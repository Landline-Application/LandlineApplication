import { isFirebaseConfigured } from '@/utils/firebase/app';
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from '@react-native-firebase/firestore';

export interface FeedbackPayload {
  category: string;
  message: string;
  uid: string | null;
  displayName: string | null;
  email: string | null;
  appVersion: string;
  platform: string;
  osVersion: string;
}

/**
 * Writes a feedback document to the `feedback` Firestore collection.
 * Each submission is a standalone document — no user doc dependency required,
 * so anonymous users can submit too.
 */
export async function submitFeedback(payload: FeedbackPayload): Promise<void> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Cannot submit feedback.');
  }

  const db = getFirestore();
  const feedbackCollection = collection(db, 'feedback');

  await addDoc(feedbackCollection, {
    ...payload,
    createdAt: serverTimestamp(),
    status: 'new',
  });
}
