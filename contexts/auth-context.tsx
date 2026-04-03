import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { AppState } from 'react-native';

import {
  type FirebaseAuthTypes,
  auth,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from '@/utils/firebase/auth';
import { signInWithGoogle as firebaseSignInWithGoogle } from '@/utils/firebase/google-auth';
import { upsertUserDocument } from '@/utils/firebase/user-service';
import { fetchAndApplyUserPreferences } from '@/utils/user-preferences-sync';
import { getIdToken, reload } from '@react-native-firebase/auth';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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

function getIdTokenWithTimeout(
  user: FirebaseAuthTypes.User,
): Promise<string> {
  return Promise.race([
    getIdToken(user, true),
    new Promise<string>((_, reject) =>
      setTimeout(
        () => reject(new Error('token-refresh-timeout')),
        TOKEN_REFRESH_MS,
      ),
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
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    try {
      await reload(currentUser);
      // auth.currentUser is a new object reference after reload — re-set state
      // so consumers re-render with the updated emailVerified value.
      setUser(auth.currentUser);
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

  useEffect(() => {
    if (!user) return;
    upsertUserDocument(user).catch((e) => console.warn('upsertUserDocument (session):', e));
    const t = setTimeout(() => {
      fetchAndApplyUserPreferences(user.uid).catch((e) =>
        console.warn('fetchAndApplyUserPreferences:', e),
      );
    }, 400);
    return () => clearTimeout(t);
  }, [user?.uid]);

  useEffect(() => {
    // isFirstEvent distinguishes a persisted session being restored on startup
    // (first event) from subsequent auth state changes caused by explicit
    // sign-in / sign-out actions (where no refresh is needed).
    let isFirstEvent = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser && isFirstEvent) {
          // On startup: force a server round-trip to confirm the account still
          // exists. Catches accounts deleted from the Firebase console while the
          // app was closed (the local token would otherwise still look valid).
          isFirstEvent = false;
          try {
            await getIdTokenWithTimeout(firebaseUser);
            setUser(firebaseUser);
          } catch {
            // Token refresh failed or timed out — treat as signed out.
            setUser(null);
          }
        } else {
          isFirstEvent = false;
          setUser(firebaseUser);
        }
      } finally {
        // Always unblock the UI even if getIdToken hangs (poor network, etc.).
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    upsertUserDocument(credential.user).catch((e) => console.warn('upsertUserDocument failed:', e));
    try {
      await sendEmailVerification(credential.user);
    } catch (verificationError: any) {
      const code = verificationError?.code;
      const message =
        code === 'auth/too-many-requests'
          ? 'Too many verification emails. Please try again later.'
          : verificationError?.message || 'We could not send the verification email.';
      const error = new Error(message) as Error & { code?: string };
      error.code = code ?? 'verification-email-failed';
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    upsertUserDocument(credential.user).catch((e) => console.warn('upsertUserDocument failed:', e));
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const signInWithGoogle = async () => {
    const credential = await firebaseSignInWithGoogle();
    upsertUserDocument(credential.user).catch((e) => console.warn('upsertUserDocument failed:', e));
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshUser = async () => {
    const current = auth.currentUser;
    if (!current) return;
    await reload(current);
    setUser(auth.currentUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
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
