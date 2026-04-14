import { getApp, getApps } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import {
  type FirebaseFirestoreTypes,
  collection,
  getFirestore,
} from '@react-native-firebase/firestore';

/**
 * Firebase native init comes from `google-services.json` (gitignored).
 * See BUILD.md and docs/FIREBASE-CONFIG.md.
 */
const FIREBASE_SETUP_ERROR =
  'Firebase is not configured.\n\n' +
  'Add google-services.json to the project root (or set GOOGLE_SERVICES_JSON in .env.local), ' +
  'then rebuild the native app: pnpm android\n\n' +
  'Details: BUILD.md · docs/FIREBASE-CONFIG.md';

/** True when native Firebase initialized (requires google-services.json + native build). */
export function isFirebaseConfigured(): boolean {
  return getApps().length > 0;
}

let firebaseSetupErrorLogged = false;

function assertDefaultAppExists(): void {
  if (getApps().length === 0) {
    if (!firebaseSetupErrorLogged) {
      firebaseSetupErrorLogged = true;
      console.error(FIREBASE_SETUP_ERROR);
    }
    throw new Error(FIREBASE_SETUP_ERROR);
  }
}

function getDefaultApp() {
  assertDefaultAppExists();
  return getApp();
}

let cachedAuth: ReturnType<typeof getAuth> | undefined;
function getAuthLazy() {
  if (!cachedAuth) {
    cachedAuth = getAuth(getDefaultApp());
  }
  return cachedAuth;
}

let cachedDb: ReturnType<typeof getFirestore> | undefined;
function getDbLazy() {
  if (!cachedDb) {
    cachedDb = getFirestore(getDefaultApp());
  }
  return cachedDb;
}

let cachedUsersCollection: FirebaseFirestoreTypes.CollectionReference | undefined;
function getUsersCollectionLazy(): FirebaseFirestoreTypes.CollectionReference {
  if (!cachedUsersCollection) {
    cachedUsersCollection = collection(
      getDbLazy(),
      'users',
    ) as FirebaseFirestoreTypes.CollectionReference;
  }
  return cachedUsersCollection;
}

/** Lazy proxy so importing this module does not call `getApp()` before native Firebase is ready. */
function createLazyModuleProxy<T extends object>(getInstance: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      const instance = getInstance();
      const value = Reflect.get(instance as object, prop, receiver);
      if (typeof value === 'function') {
        return (value as (...args: unknown[]) => unknown).bind(instance);
      }
      return value;
    },
  });
}

export const app = createLazyModuleProxy(getDefaultApp);
export const auth = createLazyModuleProxy(getAuthLazy);
export const db = createLazyModuleProxy(getDbLazy);
export const usersCollection = createLazyModuleProxy(getUsersCollectionLazy);
