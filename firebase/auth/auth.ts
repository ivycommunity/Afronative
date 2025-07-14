import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  OAuthProvider,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { app } from '../config/firebase.config';
import { createUserProfile } from '../firestore/users';
import type { SignInCredentials, SignUpCredentials, AuthUser } from './types';

const auth = getAuth(app);

export const createUser = async ({ email, password, username }: SignUpCredentials): Promise<AuthUser> => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: username });
    
    // Create user profile in Firestore
    await createUserProfile(user as AuthUser, { username });
    
    return user as AuthUser;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const signIn = async ({ email, password }: SignInCredentials): Promise<AuthUser> => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    // Update last login in Firestore
    await createUserProfile(user as AuthUser);
    return user as AuthUser;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const signInWithGoogle = async (): Promise<AuthUser> => {
  try {
    const [request, response, promptAsync] = Google.useAuthRequest({
      clientId: 'YOUR_GOOGLE_CLIENT_ID',
    });

    const result = await promptAsync();
    
    if (result.type === 'success') {
      const { id_token } = result.params;
      const credential = GoogleAuthProvider.credential(id_token);
      const { user } = await signInWithCredential(auth, credential);
      
      // Create/update user profile in Firestore
      await createUserProfile(user as AuthUser);
      
      return user as AuthUser;
    } else {
      throw new Error('Google sign in was cancelled or failed');
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const signInWithApple = async (): Promise<AuthUser> => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ]
    });

    const provider = new OAuthProvider('apple.com');
    const oauthCredential = provider.credential({
      idToken: credential.identityToken!
    });

    const { user } = await signInWithCredential(auth, oauthCredential);
    
    // Create/update user profile in Firestore
    await createUserProfile(user as AuthUser, {
      displayName: credential.fullName?.givenName || undefined
    });
    
    return user as AuthUser;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};