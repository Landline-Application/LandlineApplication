import { Platform } from 'react-native';

// Ensure the native Firebase App module is loaded before we read apps.
import '@react-native-firebase/app';
import { getApps } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import { collection, getFirestore } from '@react-native-firebase/firestore';

/**
 * @react-native-firebase only runs on native builds with google-services / GoogleService-Info.
 * Web and Expo Go will not have a default app.
 */
function getDefaultFirebaseApp() {
  if (Platform.OS === 'web') {
    throw new Error(
      'Landline uses @react-native-firebase: open the app with a native dev build (expo run:android / run:ios), not the web preview.',
    );
  }

  const apps = getApps();
  if (apps.length === 0) {
    throw new Error(
      'Firebase default app is missing. Use a development client (expo run:android), ensure android/app/google-services.json exists, then rebuild. Expo Go does not load native Firebase.',
    );
  }

  return apps[0];
}

export const app = getDefaultFirebaseApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const usersCollection = collection(db, 'users');
