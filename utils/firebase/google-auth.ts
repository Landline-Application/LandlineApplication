import { auth } from '@/utils/firebase/app';
import { deleteUserDocument } from '@/utils/firebase/user-service';
import {
  type FirebaseAuthTypes,
  GoogleAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  signInWithCredential,
} from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '188793229674-8d9c9m7k0gq0lk56604n4a8d01mrc2kg.apps.googleusercontent.com',
});

async function getGoogleIdToken(): Promise<string> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In failed: no ID token returned.');
  }
  return idToken;
}

export async function signInWithGoogle(): Promise<FirebaseAuthTypes.UserCredential> {
  const idToken = await getGoogleIdToken();
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

/**
 * Re-authenticate with Google, delete the Firestore user document,
 * then permanently delete the Firebase Auth account.
 */
export async function deleteAccountWithGoogle(user: FirebaseAuthTypes.User): Promise<void> {
  const idToken = await getGoogleIdToken();
  const credential = GoogleAuthProvider.credential(idToken);
  await reauthenticateWithCredential(user, credential);
  await deleteUserDocument(user.uid);
  await deleteUser(user);
}
