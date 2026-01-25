import type { User } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  lastLogin: Date;
}

/**
 * Authentication Service - Handles all auth operations
 * Following Single Responsibility Principle
 */
export class AuthService {
  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login
      await this.updateLastLogin(userCredential.user.uid);
      
      return userCredential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Create new user account - DISABLED
   * Account creation is restricted to administrators only
   * @deprecated User registration has been disabled
   */
  static async createAccount(
    _email: string,
    _password: string,
    _displayName?: string
  ): Promise<User> {
    throw new Error('Account creation is disabled. Please contact an administrator.');
  }

  /**
   * Send password reset email - DISABLED
   * Password resets are handled through the change password page for authenticated users only
   * @deprecated Password reset via email has been disabled
   */
  static async sendPasswordReset(_email: string): Promise<void> {
    throw new Error('Password reset via email is disabled. Please use the Change Password option after logging in.');
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Get user profile from Firestore
   */
  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Update last login timestamp
   */
  private static async updateLastLogin(uid: string): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(
        docRef,
        {
          lastLogin: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  }

  /**
   * Handle Firebase Auth errors with comprehensive, user-friendly messages
   */
  private static handleAuthError(error: any): Error {
    const errorMessages: { [key: string]: string } = {
      // Sign In Errors
      'auth/user-not-found': 'No account exists with this email address. Please check your email or sign up to create an account.',
      'auth/wrong-password': 'The password you entered is incorrect. Please try again or use "Forgot Password" to reset it.',
      'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
      'auth/user-disabled': 'This account has been disabled. Please contact support for assistance.',
      'auth/invalid-email': 'The email address format is invalid. Please enter a valid email address.',
      
      // Sign Up Errors
      'auth/email-already-in-use': 'An account with this email address already exists. Please sign in instead or use a different email.',
      'auth/weak-password': 'Your password is too weak. Please use at least 6 characters with a mix of letters and numbers.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
      
      // Password Reset Errors
      'auth/missing-email': 'Please enter your email address to reset your password.',
      'auth/invalid-action-code': 'This password reset link is invalid or has expired. Please request a new one.',
      'auth/expired-action-code': 'This password reset link has expired. Please request a new password reset email.',
      
      // Network & Rate Limiting Errors
      'auth/too-many-requests': 'Too many unsuccessful login attempts. Your account has been temporarily locked. Please try again in a few minutes or reset your password.',
      'auth/network-request-failed': 'Network connection failed. Please check your internet connection and try again.',
      'auth/timeout': 'The request timed out. Please check your connection and try again.',
      
      // Session & Token Errors
      'auth/requires-recent-login': 'For security reasons, please sign out and sign in again before performing this action.',
      'auth/invalid-user-token': 'Your session has expired. Please sign in again.',
      'auth/user-token-expired': 'Your session has expired. Please sign in again.',
      
      // General Errors
      'auth/popup-closed-by-user': 'The sign-in popup was closed before completing the process.',
      'auth/cancelled-popup-request': 'Only one popup request is allowed at a time.',
      'auth/internal-error': 'An unexpected error occurred. Please try again.',
      'auth/unauthorized-domain': 'This domain is not authorized for authentication.',
      'auth/missing-android-pkg-name': 'An Android Package Name must be provided.',
      'auth/missing-continue-uri': 'A continue URL must be provided in the request.',
      'auth/missing-ios-bundle-id': 'An iOS Bundle ID must be provided.',
      'auth/invalid-continue-uri': 'The continue URL provided is invalid.',
      'auth/unauthorized-continue-uri': 'The domain of the continue URL is not whitelisted.',
    };

    // Get the error message or provide a user-friendly fallback
    let message = errorMessages[error.code];
    
    if (!message) {
      // If no specific message is found, try to extract useful info from the error
      if (error.message) {
        // Clean up Firebase error messages for better readability
        message = error.message
          .replace('Firebase: ', '')
          .replace(/\(auth\/[\w-]+\)\.?/g, '')
          .trim();
        
        // If message is still too technical, use a generic message
        if (message.length < 10 || message.includes('Error')) {
          message = 'An unexpected error occurred. Please try again or contact support if the problem persists.';
        }
      } else {
        message = 'Unable to complete authentication. Please try again.';
      }
    }

    // Log the original error for debugging (but don't show technical details to user)
    console.error('[Auth Error]', error.code, error.message);

    return new Error(message);
  }
}
