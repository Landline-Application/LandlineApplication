import { usersCollection } from '@/utils/firebase/app';
import { type FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  type FirebaseFirestoreTypes,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';

export interface UserDocument {
  uid: string;
  displayName: string | null;
  email: string | null;
  /** Set once on creation; never overwritten by subsequent upserts. */
  createdAt: FirebaseFirestoreTypes.FieldValue;
  updatedAt: FirebaseFirestoreTypes.FieldValue;
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
    updatedAt: serverTimestamp(),
  };

  // createdAt is included in the payload but merge mode leaves it untouched
  // if the document already exists.
  await setDoc(ref, { ...data, createdAt: serverTimestamp() }, { merge: true });
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
