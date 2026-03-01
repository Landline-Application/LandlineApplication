import React, { createContext, useContext, useEffect, useState } from 'react';

import {
  auth,
  createUserDocument,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithGoogle as firebaseSignInWithGoogle,
  type FirebaseAuthTypes,
} from '@/utils/firebase';

interface AuthContextType {
  user: FirebaseAuthTypes.User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          await createUserDocument(firebaseUser);
        } catch (error) {
          console.warn('Failed to update user document:', error);
        }
      }
      setUser(firebaseUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDocument(credential.user);
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
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const signInWithGoogle = async () => {
    await firebaseSignInWithGoogle();
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
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
