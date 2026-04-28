import { usersCollection } from '@/utils/firebase/app';
import { type FirebaseAuthTypes, updateProfile } from '@react-native-firebase/auth';
import {
  type FirebaseFirestoreTypes,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';

/** Stored under `users/{uid}.preferences` — merged on update. */
export interface UserPreferences {
  autoReplyEnabled?: boolean;
  notificationRetentionDays?: number;
  /** Hours between “Still in Landline Mode?” reminders while mode is on. */
  landlineReminderIntervalHours?: number;
}

export interface UserDocument {
  uid: string;
  displayName: string | null;
  email: string | null;
  /** Set once on creation; never overwritten by subsequent upserts. */
  createdAt: FirebaseFirestoreTypes.FieldValue;
  updatedAt: FirebaseFirestoreTypes.FieldValue;
  /** Updated on every sign-in. Never touched by profile edits. */
  lastLogin: FirebaseFirestoreTypes.FieldValue;
  preferences?: UserPreferences;
}

/**
 * Creates or updates the /users/{uid} document.
 * Safe to call on every sign-in — merge keeps `createdAt` intact.
 */
export async function upsertUserDocument(user: FirebaseAuthTypes.User): Promise<void> {
  const ref = doc(usersCollection, user.uid);

  const data: Partial<UserDocument> = {
    uid: user.uid,
    displayName: user.displayName ?? null,
    email: user.email ?? null,
    lastLogin: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // createdAt is included in the payload but merge mode leaves it untouched
  // if the document already exists.
  await setDoc(ref, { ...data, createdAt: serverTimestamp() }, { merge: true });
}

const DISPLAY_NAME_MAX = 80;

/**
 * Updates Firebase Auth profile displayName and merges it into Firestore `users/{uid}`.
 */
export async function updateUserDisplayName(
  user: FirebaseAuthTypes.User,
  displayName: string,
): Promise<void> {
  const trimmed = displayName.trim().slice(0, DISPLAY_NAME_MAX);
  await updateProfile(user, { displayName: trimmed || null });

  const ref = doc(usersCollection, user.uid);
  await setDoc(
    ref,
    {
      displayName: trimmed || null,
      profileUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/**
 * Permanently removes the /users/{uid} document.
 * Must be called *before* deleting the Firebase Auth account so that
 * Firestore security rules (which require a valid auth session) are satisfied.
 */
export async function deleteUserDocument(uid: string): Promise<void> {
  const ref = doc(usersCollection, uid);
  await deleteDoc(ref);
}

// ---------------------------------------------------------------------------
// Anonymous account migration
// ---------------------------------------------------------------------------

/**
 * Copies preferences (and any other anonymous Firestore data) from the
 * anonymous user document into the real authenticated user document.
 *
 * Strategy: anonymous data wins if it exists; otherwise existing data is
 * left untouched.
 */
export async function migrateAnonymousUserData(
  anonymousUid: string,
  realUid: string,
): Promise<void> {
  const anonPrefs = await getUserPreferences(anonymousUid);
  if (!anonPrefs || Object.keys(anonPrefs).length === 0) {
    // Nothing to migrate — the real account already has its own data.
    return;
  }

  await mergeUserPreferences(realUid, anonPrefs);
}

export async function getUserPreferences(uid: string): Promise<UserPreferences | null> {
  const snap = await getDoc(doc(usersCollection, uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserDocument> | undefined;
  const raw = data?.preferences;
  if (!raw || typeof raw !== 'object') return null;
  return raw as UserPreferences;
}

/**
 * Writes the full preferences object to Firestore.
 * The caller (usePreferencesStore) owns the complete local state so no
 * server-side read-then-write is needed — Firestore merge handles the rest.
 */
export async function mergeUserPreferences(
  uid: string,
  preferences: UserPreferences,
): Promise<void> {
  const ref = doc(usersCollection, uid);
  await setDoc(
    ref,
    {
      preferences,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
