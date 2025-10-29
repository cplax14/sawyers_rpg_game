/**
 * Authentication Service
 * Handles user authentication using Firebase Auth with comprehensive error handling
 */

import {
  User,
  UserCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updatePassword,
  updateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  onAuthStateChanged,
  getAuth,
  Auth,
  AuthError,
} from 'firebase/auth';
import { retry } from '../utils/retryManager';
import { convertFirebaseError, logCloudError, CloudError } from '../utils/cloudErrors';

// Re-export AuthError for external use
export { AuthError } from 'firebase/auth';

// Authentication result types
export interface AuthResult {
  success: boolean;
  user?: User | null;
  error?: CloudError;
  requiresEmailVerification?: boolean;
  metadata?: {
    operationId: string;
    timestamp: number;
    executionTime: number;
  };
}

// User profile information
export interface UserProfile {
  displayName: string;
  email: string;
  emailVerified: boolean;
  photoURL?: string;
  uid: string;
  createdAt: Date;
  lastLoginAt?: Date;
  providerData: {
    providerId: string;
    email?: string;
    displayName?: string;
  }[];
}

// Authentication configuration
export interface AuthConfig {
  /** Require email verification for new accounts */
  requireEmailVerification: boolean;
  /** Minimum password length */
  minPasswordLength: number;
  /** Password complexity requirements */
  passwordRequirements: {
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  /** Auto sign-out after inactivity (minutes) */
  autoSignOutAfter?: number;
  /** Enable debug logging */
  enableDebugLogging: boolean;
}

// Default authentication configuration
export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  requireEmailVerification: true,
  minPasswordLength: 8,
  passwordRequirements: {
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  autoSignOutAfter: undefined, // Disabled by default
  enableDebugLogging: false,
};

// Authentication event handlers
export interface AuthEventHandlers {
  onUserSignedIn?: (user: User) => void;
  onUserSignedOut?: () => void;
  onUserProfileUpdated?: (user: User) => void;
  onEmailVerificationSent?: (email: string) => void;
  onPasswordResetSent?: (email: string) => void;
  onAuthError?: (error: CloudError, operation: string) => void;
}

/**
 * Authentication Service Class
 * Provides comprehensive user authentication functionality
 */
export class AuthenticationService {
  private auth: Auth;
  private config: AuthConfig;
  private eventHandlers: AuthEventHandlers;
  private unsubscribeAuthState: (() => void) | null = null;
  private autoSignOutTimer: NodeJS.Timeout | null = null;
  private currentUser: User | null = null;

  constructor(config: Partial<AuthConfig> = {}, eventHandlers: AuthEventHandlers = {}) {
    this.auth = getAuth();
    this.config = { ...DEFAULT_AUTH_CONFIG, ...config };
    this.eventHandlers = eventHandlers;

    this.setupAuthStateListener();
  }

  /**
   * Set up authentication state listener
   */
  private setupAuthStateListener(): void {
    this.unsubscribeAuthState = onAuthStateChanged(this.auth, user => {
      const wasSignedIn = !!this.currentUser;
      const isSignedIn = !!user;

      this.currentUser = user;

      if (this.config.enableDebugLogging) {
        console.log(
          'Auth state changed:',
          user ? `User ${user.email} signed in` : 'User signed out'
        );
      }

      // Handle sign in
      if (!wasSignedIn && isSignedIn && user) {
        this.eventHandlers.onUserSignedIn?.(user);
        this.setupAutoSignOut();
      }

      // Handle sign out
      if (wasSignedIn && !isSignedIn) {
        this.eventHandlers.onUserSignedOut?.();
        this.clearAutoSignOut();
      }

      // Reset auto sign-out timer on any activity when user is signed in
      if (isSignedIn) {
        this.resetAutoSignOutTimer();
      }
    });
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResult> {
    const operationId = `signup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Validate input
      const validation = this.validateSignUpInput(email, password);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      if (this.config.enableDebugLogging) {
        console.log('Attempting sign up for:', email);
      }

      // Create user account with retry logic
      const userCredential = await retry.critical(() =>
        createUserWithEmailAndPassword(this.auth, email, password)
      );

      const user = userCredential.user;

      // Update profile with display name if provided
      if (displayName) {
        await retry.network(() => updateProfile(user, { displayName }));

        if (this.config.enableDebugLogging) {
          console.log('Updated user profile with display name:', displayName);
        }
      }

      // Send email verification if required
      let requiresEmailVerification = false;
      if (this.config.requireEmailVerification) {
        await retry.network(() => sendEmailVerification(user));
        requiresEmailVerification = true;
        this.eventHandlers.onEmailVerificationSent?.(email);

        if (this.config.enableDebugLogging) {
          console.log('Email verification sent to:', email);
        }
      }

      return {
        success: true,
        user,
        requiresEmailVerification,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      const cloudError = convertFirebaseError(error);
      logCloudError(cloudError, 'signUp');
      this.eventHandlers.onAuthError?.(cloudError, 'signUp');

      if (this.config.enableDebugLogging) {
        console.error('Sign up failed:', cloudError);
      }

      return {
        success: false,
        error: cloudError,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    const operationId = `signin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (this.config.enableDebugLogging) {
        console.log('Attempting sign in for:', email);
      }

      // Sign in with retry logic
      const userCredential = await retry.critical(() =>
        signInWithEmailAndPassword(this.auth, email, password)
      );

      const user = userCredential.user;

      // Check email verification if required
      if (this.config.requireEmailVerification && !user.emailVerified) {
        if (this.config.enableDebugLogging) {
          console.log('User email not verified:', email);
        }

        return {
          success: false,
          error: {
            code: 'email-not-verified',
            message: 'Please verify your email address before signing in',
            details: { email: user.email },
          },
          requiresEmailVerification: true,
          metadata: {
            operationId,
            timestamp: Date.now(),
            executionTime: Date.now() - startTime,
          },
        };
      }

      if (this.config.enableDebugLogging) {
        console.log('Sign in successful for:', email);
      }

      return {
        success: true,
        user,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      const cloudError = convertFirebaseError(error);
      logCloudError(cloudError, 'signIn');
      this.eventHandlers.onAuthError?.(cloudError, 'signIn');

      if (this.config.enableDebugLogging) {
        console.error('Sign in failed:', cloudError);
      }

      return {
        success: false,
        error: cloudError,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<AuthResult> {
    const operationId = `signout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      if (this.config.enableDebugLogging) {
        console.log('Signing out user');
      }

      await retry.network(() => signOut(this.auth));

      return {
        success: true,
        user: null,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      const cloudError = convertFirebaseError(error);
      logCloudError(cloudError, 'signOut');
      this.eventHandlers.onAuthError?.(cloudError, 'signOut');

      return {
        success: false,
        error: cloudError,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string): Promise<AuthResult> {
    const operationId = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      if (!email) {
        throw new Error('Email address is required');
      }

      if (this.config.enableDebugLogging) {
        console.log('Sending password reset email to:', email);
      }

      await retry.network(() => sendPasswordResetEmail(this.auth, email));
      this.eventHandlers.onPasswordResetSent?.(email);

      return {
        success: true,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      const cloudError = convertFirebaseError(error);
      logCloudError(cloudError, 'sendPasswordReset');
      this.eventHandlers.onAuthError?.(cloudError, 'sendPasswordReset');

      return {
        success: false,
        error: cloudError,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Resend email verification
   */
  async resendEmailVerification(): Promise<AuthResult> {
    const operationId = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      if (user.emailVerified) {
        throw new Error('Email is already verified');
      }

      if (this.config.enableDebugLogging) {
        console.log('Resending email verification to:', user.email);
      }

      await retry.network(() => sendEmailVerification(user));
      this.eventHandlers.onEmailVerificationSent?.(user.email!);

      return {
        success: true,
        user,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      const cloudError = convertFirebaseError(error);
      logCloudError(cloudError, 'resendEmailVerification');
      this.eventHandlers.onAuthError?.(cloudError, 'resendEmailVerification');

      return {
        success: false,
        error: cloudError,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(updates: {
    displayName?: string;
    photoURL?: string;
  }): Promise<AuthResult> {
    const operationId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      const user = this.getCurrentUser();
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      if (this.config.enableDebugLogging) {
        console.log('Updating user profile:', updates);
      }

      await retry.network(() => updateProfile(user, updates));
      this.eventHandlers.onUserProfileUpdated?.(user);

      return {
        success: true,
        user,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      const cloudError = convertFirebaseError(error);
      logCloudError(cloudError, 'updateUserProfile');
      this.eventHandlers.onAuthError?.(cloudError, 'updateUserProfile');

      return {
        success: false,
        error: cloudError,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResult> {
    const operationId = `changepw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      const user = this.getCurrentUser();
      if (!user || !user.email) {
        throw new Error('No user is currently signed in');
      }

      // Validate new password
      const validation = this.validatePassword(newPassword);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      if (this.config.enableDebugLogging) {
        console.log('Changing password for user:', user.email);
      }

      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await retry.critical(() => reauthenticateWithCredential(user, credential));

      // Update password
      await retry.network(() => updatePassword(user, newPassword));

      return {
        success: true,
        user,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      const cloudError = convertFirebaseError(error);
      logCloudError(cloudError, 'changePassword');
      this.eventHandlers.onAuthError?.(cloudError, 'changePassword');

      return {
        success: false,
        error: cloudError,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Change user email
   */
  async changeEmail(currentPassword: string, newEmail: string): Promise<AuthResult> {
    const operationId = `changeemail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      const user = this.getCurrentUser();
      if (!user || !user.email) {
        throw new Error('No user is currently signed in');
      }

      if (this.config.enableDebugLogging) {
        console.log('Changing email for user from', user.email, 'to', newEmail);
      }

      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await retry.critical(() => reauthenticateWithCredential(user, credential));

      // Update email
      await retry.network(() => updateEmail(user, newEmail));

      // Send verification email for new address
      if (this.config.requireEmailVerification) {
        await retry.network(() => sendEmailVerification(user));
        this.eventHandlers.onEmailVerificationSent?.(newEmail);
      }

      return {
        success: true,
        user,
        requiresEmailVerification: this.config.requireEmailVerification,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      const cloudError = convertFirebaseError(error);
      logCloudError(cloudError, 'changeEmail');
      this.eventHandlers.onAuthError?.(cloudError, 'changeEmail');

      return {
        success: false,
        error: cloudError,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(currentPassword: string): Promise<AuthResult> {
    const operationId = `delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    try {
      const user = this.getCurrentUser();
      if (!user || !user.email) {
        throw new Error('No user is currently signed in');
      }

      if (this.config.enableDebugLogging) {
        console.log('Deleting account for user:', user.email);
      }

      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await retry.critical(() => reauthenticateWithCredential(user, credential));

      // Delete user
      await retry.critical(() => deleteUser(user));

      return {
        success: true,
        user: null,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      const cloudError = convertFirebaseError(error);
      logCloudError(cloudError, 'deleteAccount');
      this.eventHandlers.onAuthError?.(cloudError, 'deleteAccount');

      return {
        success: false,
        error: cloudError,
        metadata: {
          operationId,
          timestamp: Date.now(),
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get user profile information
   */
  getUserProfile(user?: User): UserProfile | null {
    const currentUser = user || this.getCurrentUser();
    if (!currentUser) return null;

    return {
      uid: currentUser.uid,
      email: currentUser.email!,
      displayName: currentUser.displayName || '',
      emailVerified: currentUser.emailVerified,
      photoURL: currentUser.photoURL || undefined,
      createdAt: new Date(currentUser.metadata.creationTime!),
      lastLoginAt: currentUser.metadata.lastSignInTime
        ? new Date(currentUser.metadata.lastSignInTime)
        : undefined,
      providerData: currentUser.providerData.map(provider => ({
        providerId: provider.providerId,
        email: provider.email || undefined,
        displayName: provider.displayName || undefined,
      })),
    };
  }

  /**
   * Check if user is signed in
   */
  isSignedIn(): boolean {
    return !!this.currentUser;
  }

  /**
   * Check if user email is verified
   */
  isEmailVerified(): boolean {
    return this.currentUser?.emailVerified ?? false;
  }

  /**
   * Set up auto sign-out timer
   */
  private setupAutoSignOut(): void {
    if (!this.config.autoSignOutAfter) return;

    this.autoSignOutTimer = setTimeout(
      () => {
        if (this.config.enableDebugLogging) {
          console.log('Auto sign-out triggered due to inactivity');
        }
        this.signOut();
      },
      this.config.autoSignOutAfter * 60 * 1000
    );
  }

  /**
   * Reset auto sign-out timer
   */
  private resetAutoSignOutTimer(): void {
    if (this.autoSignOutTimer) {
      clearTimeout(this.autoSignOutTimer);
      this.setupAutoSignOut();
    }
  }

  /**
   * Clear auto sign-out timer
   */
  private clearAutoSignOut(): void {
    if (this.autoSignOutTimer) {
      clearTimeout(this.autoSignOutTimer);
      this.autoSignOutTimer = null;
    }
  }

  /**
   * Validate sign up input
   */
  private validateSignUpInput(
    email: string,
    password: string
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Email validation
    if (!email) {
      errors.push('Email address is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }

    // Password validation
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate password requirements
   */
  private validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const { minPasswordLength, passwordRequirements } = this.config;

    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    if (password.length < minPasswordLength) {
      errors.push(`Password must be at least ${minPasswordLength} characters long`);
    }

    if (passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (passwordRequirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (passwordRequirements.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.unsubscribeAuthState) {
      this.unsubscribeAuthState();
      this.unsubscribeAuthState = null;
    }

    this.clearAutoSignOut();
  }
}

// Export singleton instance
export const authService = new AuthenticationService();

// Export utility functions
export const getCurrentUser = (): User | null => authService.getCurrentUser();
export const isSignedIn = (): boolean => authService.isSignedIn();
export const getUserProfile = (user?: User): UserProfile | null => authService.getUserProfile(user);

export default AuthenticationService;
