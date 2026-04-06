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
  landlineModeOn?: boolean;
  autoReplyEnabled?: boolean;
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

export async function getUserPreferences(uid: string): Promise<UserPreferences | null> {
  const snap = await getDoc(doc(usersCollection, uid));
  if (!snap.exists()) return null;
  const data = snap.data() as Partial<UserDocument> | undefined;
  const raw = data?.preferences;
  if (!raw || typeof raw !== 'object') return null;
  return raw as UserPreferences;
}

/**
 * Deep-merge into `preferences` so partial updates do not wipe other keys.
 */
export async function mergeUserPreferences(
  uid: string,
  partial: Partial<UserPreferences>,
): Promise<void> {
  const ref = doc(usersCollection, uid);
  const snap = await getDoc(ref);
  const existing = snap.exists()
    ? (snap.data() as Partial<UserDocument> | undefined)?.preferences
    : undefined;
  const prev =
    existing && typeof existing === 'object' ? (existing as UserPreferences) : {};
  const next: UserPreferences = { ...prev, ...partial };
  await setDoc(
    ref,
    {
      preferences: next,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
