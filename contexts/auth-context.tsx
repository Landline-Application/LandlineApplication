import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { AppState } from 'react-native';

import { usePreferencesStore } from '@/hooks/use-preferences-store';
import * as FirebaseApp from '@/utils/firebase/app';
import {
  type FirebaseAuthTypes,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  linkWithCredential,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
} from '@/utils/firebase/auth';
import { getGoogleCredential } from '@/utils/firebase/google-auth';
import { upsertUserDocument } from '@/utils/firebase/user-service';
import { getApps } from '@react-native-firebase/app';
import {
  EmailAuthProvider,
  getIdToken,
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
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  /** Reload current user from Firebase (e.g. after profile update) */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_REFRESH_MS = 15_000;

function getIdTokenWithTimeout(user: FirebaseAuthTypes.User): Promise<string> {
  return Promise.race([
    getIdToken(user, true),
    new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('token-refresh-timeout')), TOKEN_REFRESH_MS),
    ),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    } catch {
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
          try {
            await getIdTokenWithTimeout(firebaseUser);
            setUser(firebaseUser);
          } catch (error: unknown) {
            const code = (error as { code?: string })?.code;
            if (code === 'auth/user-not-found') {
              // Account was deleted from the console — bootstrap a fresh anonymous session.
              console.warn('User deleted from console, signing in anonymously.');
              setUser(null);
              try {
                await signInAnonymously(FirebaseApp.auth);
              } catch (anonError: unknown) {
                const anonCode = (anonError as { code?: string })?.code;
                if (anonCode === 'auth/admin-restricted-operation') {
                  console.warn(
                    'Anonymous sign-in is disabled in the Firebase console. ' +
                      'Enable it under Authentication → Sign-in providers → Anonymous.',
                  );
                } else {
                  console.warn('Anonymous sign-in failed after user-not-found:', anonError);
                }
              }
            } else {
              // Network error or timeout — stay logged in with the cached session.
              console.log('Token refresh failed (likely offline), proceeding with cached user.');
              setUser(firebaseUser);
            }
          }
        } else if (firebaseUser) {
          isFirstEvent = false;
          setUser(firebaseUser);
        } else {
          // No user at all — bootstrap an anonymous account so every install has
          // a Firebase identity from day one (enables Firestore writes, future linking).
          isFirstEvent = false;
          try {
            await signInAnonymously(FirebaseApp.auth);
            // onAuthStateChanged will fire again with the new anonymous user.
          } catch (e: unknown) {
            const code = (e as { code?: string })?.code;
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
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // ---------------------------------------------------------------------------
  // Sign-up: link the anonymous account to an email/password credential so
  // all preferences written under the anonymous UID are preserved.
  // ---------------------------------------------------------------------------
  const signUp = async (email: string, password: string) => {
    const credential = EmailAuthProvider.credential(email, password);
    const currentUser = FirebaseApp.auth.currentUser;

    let linkedUser: FirebaseAuthTypes.User;

    if (currentUser?.isAnonymous) {
      try {
        const result = await linkWithCredential(currentUser, credential);
        linkedUser = result.user;
      } catch (linkError: unknown) {
        const code = (linkError as { code?: string })?.code;
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
      const code = (verificationError as { code?: string })?.code;
      const message =
        code === 'auth/too-many-requests'
          ? 'Too many verification emails. Please try again later.'
          : (verificationError as Error)?.message || 'We could not send the verification email.';
      const error = new Error(message) as Error & { code?: string };
      error.code = code ?? 'verification-email-failed';
      throw error;
    }
  };

  // ---------------------------------------------------------------------------
  // Sign-in: link anonymous account when possible, otherwise plain sign-in.
  // ---------------------------------------------------------------------------
  const signIn = async (email: string, password: string) => {
    const credential = EmailAuthProvider.credential(email, password);
    const currentUser = FirebaseApp.auth.currentUser;

    let signedInUser: FirebaseAuthTypes.User;

    if (currentUser?.isAnonymous) {
      try {
        const result = await linkWithCredential(currentUser, credential);
        signedInUser = result.user;
      } catch (linkError: unknown) {
        const code = (linkError as { code?: string })?.code;
        if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
          const result = await signInWithEmailAndPassword(FirebaseApp.auth, email, password);
          signedInUser = result.user;
        } else {
          throw linkError;
        }
      }
    } else {
      const result = await signInWithEmailAndPassword(FirebaseApp.auth, email, password);
      signedInUser = result.user;
    }

    upsertUserDocument(signedInUser).catch((e) => console.warn('upsertUserDocument failed:', e));
  };

  // Sign-out is kept for completeness but the anonymous session is permanent —
  // the user's identity is always anchored to an anonymous UID from first launch.
  const signOut = async () => {
    await firebaseSignOut(FirebaseApp.auth);
    // onAuthStateChanged will receive null and bootstrap a new anonymous session.
  };

  const signInWithGoogle = async () => {
    const googleCredential = await getGoogleCredential();
    const currentUser = FirebaseApp.auth.currentUser;

    let result: FirebaseAuthTypes.UserCredential;

    if (currentUser?.isAnonymous) {
      try {
        result = await linkWithCredential(currentUser, googleCredential);
      } catch (linkError: unknown) {
        const code = (linkError as { code?: string })?.code;
        if (code === 'auth/credential-already-in-use') {
          // This Google account is already tied to a real account — sign in normally.
          // Google has no separate sign-up/sign-in distinction so this is always correct.
          result = await signInWithCredential(FirebaseApp.auth, googleCredential);
        } else {
          throw linkError;
        }
      }
    } else {
      result = await signInWithCredential(FirebaseApp.auth, googleCredential);
    }

    upsertUserDocument(result.user).catch((e) => console.warn('upsertUserDocument failed:', e));
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(FirebaseApp.auth, email);
  };

  const refreshUser = async () => {
    const current = FirebaseApp.auth.currentUser;
    if (!current) return;
    await reload(current);
    setUser(FirebaseApp.auth.currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user && !user.isAnonymous,
        isAnonymous: !!user?.isAnonymous,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        refreshUser,
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
