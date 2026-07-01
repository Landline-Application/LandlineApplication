/**
 * auth.ts
 *
 * Auth primitives and phone-auth helpers.
 * Singletons live in app.ts.
 * User document operations live in user-service.ts.
 * Google auth lives in google-auth.ts.
 */
import { deleteUserDocument } from '@/utils/firebase/user-service';
import {
  EmailAuthProvider,
  type FirebaseAuthTypes,
  createUserWithEmailAndPassword,
  deleteUser,
  signOut as firebaseSignOut,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
} from '@react-native-firebase/auth';

export {
  createUserWithEmailAndPassword,
  firebaseSignOut,
  linkWithCredential,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
};
export type { FirebaseAuthTypes };

// ---------------------------------------------------------------------------
// Error helpers
// ---------------------------------------------------------------------------

/**
 * Type-safe extraction of Firebase Auth error codes.
 * Replaces the common but unsafe `(error as { code?: string })?.code` pattern.
 */
export function getAuthErrorCode(error: unknown): string | null {
  if (error == null) return null;
  if (typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Session validation
// ---------------------------------------------------------------------------

/**
 * Force-refreshes the current user's ID token to confirm the account still
 * exists (catches deletion from the Firebase console).
 *
 * Returns `true` if the session is valid, `false` if the user was deleted.
 * When `false` is returned the caller should sign-out so that the auth
 * listener can bootstrap a fresh anonymous session.
 */
export async function validateAuthSession(user: FirebaseAuthTypes.User): Promise<boolean> {
  try {
    await user.getIdToken(true);
    return true;
  } catch (error: unknown) {
    const code = getAuthErrorCode(error);
    if (code === 'auth/user-not-found') {
      return false;
    }
    // Network or other transient error — keep the cached session.
    return true;
  }
}

// ---------------------------------------------------------------------------
// Account deletion — email/password
// ---------------------------------------------------------------------------

/**
 * Re-authenticate with email/password, delete the Firestore user document,
 * then permanently delete the Firebase Auth account.
 */
export async function deleteAccountWithEmail(
  user: FirebaseAuthTypes.User,
  password: string,
): Promise<void> {
  const credential = EmailAuthProvider.credential(user.email!, password);
  await reauthenticateWithCredential(user, credential);
  await deleteUserDocument(user.uid);
  await deleteUser(user);
}

// ---------------------------------------------------------------------------
// Phone auth
// Module-level store for the confirmation result.
// expo-router can't pass complex objects as route params, so we stash it here.
// ---------------------------------------------------------------------------

let _phoneConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

export function setPhoneConfirmation(
  confirmation: FirebaseAuthTypes.ConfirmationResult | null,
): void {
  _phoneConfirmation = confirmation;
}

export function getPhoneConfirmation(): FirebaseAuthTypes.ConfirmationResult | null {
  return _phoneConfirmation;
}
