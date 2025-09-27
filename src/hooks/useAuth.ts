/**
 * Auth Hook - Firebase Implementation
 * Simple Firebase authentication hook
 */

import { useState, useCallback, useEffect } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirebaseAuth } from '../config/firebase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [auth, setAuth] = useState<any>(null);

  // Initialize Firebase Auth safely
  useEffect(() => {
    try {
      const firebaseAuth = getFirebaseAuth();
      setAuth(firebaseAuth);
    } catch (err) {
      console.error('Failed to initialize Firebase Auth:', err);
      setError('Authentication service unavailable');
      setIsLoading(false);
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const isAuthenticated = !!user;

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) {
      return { success: false, error: { code: 'auth-unavailable', message: 'Authentication service unavailable' } };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (err: any) {
      const errorMessage = err.message || 'Sign in failed';
      setError(errorMessage);
      return { success: false, error: { code: err.code, message: errorMessage } };
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    if (!auth) {
      return { success: false, error: { code: 'auth-unavailable', message: 'Authentication service unavailable' } };
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update profile with display name if provided
      if (displayName && result.user) {
        await updateProfile(result.user, { displayName });
      }

      return { success: true, user: result.user };
    } catch (err: any) {
      const errorMessage = err.message || 'Sign up failed';
      setError(errorMessage);
      return { success: false, error: { code: err.code, message: errorMessage } };
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  const sendPasswordReset = useCallback(async (email: string) => {
    if (!auth) {
      return { success: false, error: { code: 'auth-unavailable', message: 'Authentication service unavailable' } };
    }

    setIsLoading(true);
    setError(null);

    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Password reset failed';
      setError(errorMessage);
      return { success: false, error: { code: err.code, message: errorMessage } };
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  const signOut = useCallback(async () => {
    if (!auth) {
      return { success: false, error: { code: 'auth-unavailable', message: 'Authentication service unavailable' } };
    }

    setIsLoading(true);
    setError(null);

    try {
      await firebaseSignOut(auth);
      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Sign out failed';
      setError(errorMessage);
      return { success: false, error: { code: err.code, message: errorMessage } };
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isAuthenticated,
    user,
    isLoading,
    error,
    signIn,
    signUp,
    sendPasswordReset,
    signOut,
    clearError
  };
};

export default useAuth;