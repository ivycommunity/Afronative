import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { 
  createUser, 
  signIn, 
  signOut, 
  signInWithGoogle, 
  signInWithApple,
  subscribeToAuthChanges 
} from '../firebase/auth/auth';
import type { 
  AuthUser, 
  SignInCredentials, 
  SignUpCredentials 
} from '../firebase/auth/types';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      setUser(user as AuthUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAuth = async (
    authFunction: Function,
    credentials?: SignInCredentials | SignUpCredentials
  ) => {
    try {
      setError(null);
      setLoading(true);
      await authFunction(credentials);
      router.replace('/home');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = (credentials: SignInCredentials) => 
    handleAuth(signIn, credentials);

  const handleSignUp = (credentials: SignUpCredentials) => 
    handleAuth(createUser, credentials);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/sign-in');
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleGoogleSignIn = () => handleAuth(signInWithGoogle);
  const handleAppleSignIn = () => handleAuth(signInWithApple);

  return {
    user,
    loading,
    error,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    signInWithGoogle: handleGoogleSignIn,
    signInWithApple: handleAppleSignIn,
  };
};