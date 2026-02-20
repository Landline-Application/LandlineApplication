import { getApp } from '@react-native-firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  type FirebaseAuthTypes,
} from '@react-native-firebase/auth';
import {
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from '@react-native-firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const app = getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const usersCollection = collection(db, 'users');

GoogleSignin.configure({
  webClientId: '188793229674-8d9c9m7k0gq0lk56604n4a8d01mrc2kg.apps.googleusercontent.com',
});

export {
  auth,
  createUserWithEmailAndPassword,
  db,
  firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  usersCollection,
};
export type { FirebaseAuthTypes };

export async function createUserDocument(user: FirebaseAuthTypes.User) {
  const userDocRef = doc(usersCollection, user.uid);

  const data: Record<string, any> = {
    displayName: user.displayName || null,
    lastLogin: serverTimestamp(),
  };

  if (user.email) {
    data.email = user.email;
  }
  if (user.phoneNumber) {
    data.phoneNumber = user.phoneNumber;
  }

  await setDoc(userDocRef, data, { merge: true });
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In failed: no ID token returned.');
  }
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  await createUserDocument(userCredential.user);
  return userCredential;
}

// Module-level store for the phone auth confirmation object.
// expo-router can't pass complex objects as route params, so we stash it here.
let _phoneConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

export function setPhoneConfirmation(confirmation: FirebaseAuthTypes.ConfirmationResult | null) {
  _phoneConfirmation = confirmation;
}

export function getPhoneConfirmation(): FirebaseAuthTypes.ConfirmationResult | null {
  return _phoneConfirmation;
}
