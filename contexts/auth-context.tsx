import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { AppState } from 'react-native';

import { usePreferencesStore } from '@/hooks/use-preferences-store';
import * as FirebaseApp from '@/utils/firebase/app';
import {
  type FirebaseAuthTypes,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  getAuthErrorCode,
  linkWithCredential,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  validateAuthSession,
} from '@/utils/firebase/auth';
import { getGoogleCredential } from '@/utils/firebase/google-auth';
import { migrateAnonymousUserData, upsertUserDocument } from '@/utils/firebase/user-service';
import { getApps } from '@react-native-firebase/app';
import {
  EmailAuthProvider,
  reload,
  signInWithCredential,
} from '@react-native-firebase/auth';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  /** true only for real (non-anonymous) authenticated accounts */
  isAuthenticated: boolean;
  /** true when the current Firebase user is anonymous */
  isAnonymous: boolean;
  /** true when any auth operation (sign-in, sign-up, sign-out) is in flight */
  isOperationInProgress: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Reload current user from Firebase (e.g. after profile update) */
  refreshUser: () => Promise<void>;
  /** Retry anonymous authentication after a previous failure (e.g. after regaining network). */
  retryAnonymousAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Auth operation concurrency lock
// ---------------------------------------------------------------------------

type AuthOperation = () => Promise<void>;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationInProgress, setIsOperationInProgress] = useState(false);

  const operationLockRef = useRef(false);

  const withAuthLock = useCallback(
    async (operation: AuthOperation): Promise<void> => {
      if (operationLockRef.current) {
        const error = new Error('An authentication operation is already in progress.') as Error & {
          code: string;
        };
        error.code = 'auth/operation-in-progress';
        throw error;
      }
      operationLockRef.current = true;
      setIsOperationInProgress(true);
      try {
        await operation();
      } finally {
        operationLockRef.current = false;
        setIsOperationInProgress(false);
      }
    },
    [],
  );

  // Reload the Firebase user when the app comes back to the foreground.
  // This picks up emailVerified flipping to true after the user taps the
  // verification link and returns to the app.
  const reloadUser = useCallback(async () => {
    if (getApps().length === 0) return;
    const currentUser = FirebaseApp.auth.currentUser;
    if (!currentUser) return;
    try {
      await reload(currentUser);
      // FirebaseApp.auth.currentUser is a new object reference after reload — re-set state
      // so consumers re-render with the updated emailVerified value.
      setUser(FirebaseApp.auth.currentUser);
    } catch (error: unknown) {
      const code = getAuthErrorCode(error);
      if (code === 'auth/user-not-found') {
        // Account was deleted from the console while the app was in the background.
        // Force a sign-out so onAuthStateChanged can bootstrap a fresh anonymous session.
        console.warn('reloadUser: user-not-found, signing out to bootstrap anonymous.');
        setUser(null);
        await firebaseSignOut(FirebaseApp.auth).catch(() => {});
        return;
      }
      // Silently ignore — if this fails the user just won't see the update
      // until their next forced token refresh.
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        reloadUser();
      }
    });
    return () => subscription.remove();
  }, [reloadUser]);

  // Keep a stable ref to the latest user so the uid-change effect below can
  // read it without including `user` itself as a dep (which changes on every reload).
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  });

  // Upsert the Firestore user document and trigger a preference sync whenever
  // the Firebase user identity changes (sign-in, anonymous creation, upgrade).
  const uid = user?.uid;
  useEffect(() => {
    const currentUser = userRef.current;
    if (!currentUser || !uid) return;
    upsertUserDocument(currentUser).catch((e) => console.warn('upsertUserDocument (session):', e));
    const t = setTimeout(() => {
      usePreferencesStore
        .getState()
        .onAuthReady(uid)
        .catch((e) => console.warn('onAuthReady:', e));
    }, 400);
    return () => clearTimeout(t);
  }, [uid]);

  // ---------------------------------------------------------------------------
  // Anonymous auth bootstrap hardening
  // ---------------------------------------------------------------------------

  const hasAttemptedAnonymousBootstrap = useRef(false);

  useEffect(() => {
    if (getApps().length === 0) {
      if (__DEV__) {
        console.warn(
          '[Landline] Firebase is not configured (missing google-services.json). Auth is disabled until you add it and rebuild. See BUILD.md.',
        );
      }
      setUser(null);
      setIsLoading(false);
      return;
    }

    // isFirstEvent distinguishes a persisted session being restored on startup
    // (first event) from subsequent auth state changes caused by explicit
    // sign-in / sign-out actions (where no refresh is needed).
    let isFirstEvent = true;

    const unsubscribe = onAuthStateChanged(FirebaseApp.auth, async (firebaseUser) => {
      try {
        if (firebaseUser && isFirstEvent) {
          // On startup: attempt to refresh the token to confirm the account still exists.
          // This catches accounts deleted from the Firebase console while the app was closed.
          isFirstEvent = false;
          const isValid = await validateAuthSession(firebaseUser);
          if (isValid) {
            setUser(firebaseUser);
          } else {
            // Account was deleted from the console — bootstrap a fresh anonymous session.
            console.warn('User deleted from console, signing in anonymously.');
            setUser(null);
            if (!hasAttemptedAnonymousBootstrap.current) {
              hasAttemptedAnonymousBootstrap.current = true;
              try {
                await signInAnonymously(FirebaseApp.auth);
              } catch (anonError: unknown) {
                const code = getAuthErrorCode(anonError);
                if (code === 'auth/admin-restricted-operation') {
                  console.warn(
                    'Anonymous sign-in is disabled in the Firebase console. ' +
                      'Enable it under Authentication → Sign-in providers → Anonymous.',
                  );
                } else {
                  console.warn('Anonymous sign-in failed after user-not-found:', anonError);
                }
              }
            }
          }
        } else if (firebaseUser) {
          isFirstEvent = false;
          setUser(firebaseUser);
        } else {
          // No user at all — bootstrap an anonymous account so every install has
          // a Firebase identity from day one (enables Firestore writes, future linking).
          isFirstEvent = false;
          if (!hasAttemptedAnonymousBootstrap.current) {
            hasAttemptedAnonymousBootstrap.current = true;
            try {
              await signInAnonymously(FirebaseApp.auth);
              // onAuthStateChanged will fire again with the new anonymous user.
            } catch (e: unknown) {
              const code = getAuthErrorCode(e);
              if (code === 'auth/admin-restricted-operation') {
                // Anonymous auth is disabled in the Firebase console.
                // App continues without a Firebase identity — Firestore sync is
                // skipped but all core Landline features remain functional.
                console.warn(
                  'Anonymous sign-in is disabled. Enable it under ' +
                    'Firebase Console → Authentication → Sign-in providers → Anonymous.',
                );
              } else {
                console.warn('Anonymous sign-in failed:', e);
              }
              setUser(null);
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // ---------------------------------------------------------------------------
  // Retry anonymous auth (exposed for manual retry, e.g. after regaining network)
  // ---------------------------------------------------------------------------
  const retryAnonymousAuth = useCallback(async () => {
    if (getApps().length === 0) return;
    hasAttemptedAnonymousBootstrap.current = false;
    try {
      await signInAnonymously(FirebaseApp.auth);
    } catch (e: unknown) {
      const code = getAuthErrorCode(e);
      if (code === 'auth/admin-restricted-operation') {
        console.warn(
          'Anonymous sign-in is disabled. Enable it under ' +
            'Firebase Console → Authentication → Sign-in providers → Anonymous.',
        );
      } else {
        console.warn('Anonymous sign-in retry failed:', e);
      }
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Sign-up: link the anonymous account to an email/password credential so
  // all preferences written under the anonymous UID are preserved.
  // ---------------------------------------------------------------------------
  const signUp = useCallback(
    async (email: string, password: string) => {
      await withAuthLock(async () => {
        const credential = EmailAuthProvider.credential(email, password);
        const currentUser = FirebaseApp.auth.currentUser;

        let linkedUser: FirebaseAuthTypes.User;

        if (currentUser?.isAnonymous) {
          try {
            const result = await linkWithCredential(currentUser, credential);
            linkedUser = result.user;
          } catch (linkError: unknown) {
            const code = getAuthErrorCode(linkError);
            if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
              // An account with this email already exists — surface the error so the
              // sign-up screen can direct the user to sign in instead.
              const error = new Error(
                'An account with this email already exists. Please sign in instead.',
              ) as Error & { code: string };
              error.code = 'auth/email-already-in-use';
              throw error;
            }
            throw linkError;
          }
        } else {
          const result = await createUserWithEmailAndPassword(FirebaseApp.auth, email, password);
          linkedUser = result.user;
        }

        upsertUserDocument(linkedUser).catch((e) => console.warn('upsertUserDocument failed:', e));

        try {
          await sendEmailVerification(linkedUser);
        } catch (verificationError: unknown) {
          const code = getAuthErrorCode(verificationError);
          const message =
            code === 'auth/too-many-requests'
              ? 'Too many verification emails. Please try again later.'
              : (verificationError as Error)?.message || 'We could not send the verification email.';
          const error = new Error(message) as Error & { code?: string };
          error.code = code ?? 'verification-email-failed';
          throw error;
        }
      });
    },
    [withAuthLock],
  );

  // ---------------------------------------------------------------------------
  // Sign-in: link anonymous account when possible, otherwise plain sign-in.
  // If the anonymous account cannot be linked because the credential is already
  // in use, we migrate the anonymous Firestore data into the existing account.
  // ---------------------------------------------------------------------------
  const signIn = useCallback(
    async (email: string, password: string) => {
      await withAuthLock(async () => {
        const credential = EmailAuthProvider.credential(email, password);
        const currentUser = FirebaseApp.auth.currentUser;
        const anonUid = currentUser?.isAnonymous ? currentUser.uid : null;

        let signedInUser: FirebaseAuthTypes.User;

        if (currentUser?.isAnonymous) {
          try {
            const result = await linkWithCredential(currentUser, credential);
            signedInUser = result.user;
          } catch (linkError: unknown) {
            const code = getAuthErrorCode(linkError);
            if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
              const result = await signInWithEmailAndPassword(FirebaseApp.auth, email, password);
              signedInUser = result.user;
              if (anonUid) {
                await migrateAnonymousUserData(anonUid, signedInUser.uid).catch((e) =>
                  console.warn('migrateAnonymousUserData failed:', e),
                );
              }
            } else {
              throw linkError;
            }
          }
        } else {
          const result = await signInWithEmailAndPassword(FirebaseApp.auth, email, password);
          signedInUser = result.user;
        }

        upsertUserDocument(signedInUser).catch((e) => console.warn('upsertUserDocument failed:', e));
      });
    },
    [withAuthLock],
  );

  // Sign-out is kept for completeness but the anonymous session is permanent —
  // the user's identity is always anchored to an anonymous UID from first launch.
  const signOut = useCallback(async () => {
    await withAuthLock(async () => {
      await firebaseSignOut(FirebaseApp.auth);
      // onAuthStateChanged will receive null and bootstrap a new anonymous session.
    });
  }, [withAuthLock]);

  const signInWithGoogle = useCallback(async () => {
    await withAuthLock(async () => {
      const googleCredential = await getGoogleCredential();
      const currentUser = FirebaseApp.auth.currentUser;
      const anonUid = currentUser?.isAnonymous ? currentUser.uid : null;

      let result: FirebaseAuthTypes.UserCredential;

      if (currentUser?.isAnonymous) {
        try {
          result = await linkWithCredential(currentUser, googleCredential);
        } catch (linkError: unknown) {
          const code = getAuthErrorCode(linkError);
          if (code === 'auth/credential-already-in-use') {
            // This Google account is already tied to a real account — sign in normally.
            // Google has no separate sign-up/sign-in distinction so this is always correct.
            result = await signInWithCredential(FirebaseApp.auth, googleCredential);
            if (anonUid) {
              await migrateAnonymousUserData(anonUid, result.user.uid).catch((e) =>
                console.warn('migrateAnonymousUserData failed:', e),
              );
            }
          } else {
            throw linkError;
          }
        }
      } else {
        result = await signInWithCredential(FirebaseApp.auth, googleCredential);
      }

      upsertUserDocument(result.user).catch((e) => console.warn('upsertUserDocument failed:', e));
    });
  }, [withAuthLock]);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(FirebaseApp.auth, email);
  }, []);

  const refreshUser = useCallback(async () => {
    const current = FirebaseApp.auth.currentUser;
    if (!current) return;
    await reload(current);
    setUser(FirebaseApp.auth.currentUser);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !user.isAnonymous,
        isAnonymous: !!user?.isAnonymous,
        isOperationInProgress,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        refreshUser,
        retryAnonymousAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
