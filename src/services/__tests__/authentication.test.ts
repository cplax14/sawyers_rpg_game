/**
 * Authentication Service Tests
 * Comprehensive tests for Firebase authentication functionality
 */

import { AuthenticationService } from '../authentication';
import { User, UserCredential, AuthError } from 'firebase/auth';
import { CloudError, CloudErrorCode } from '../../utils/cloudErrors';

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendEmailVerification: jest.fn(),
  updateProfile: jest.fn(),
  updatePassword: jest.fn(),
  updateEmail: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  EmailAuthProvider: {
    credential: jest.fn()
  },
  deleteUser: jest.fn(),
  onAuthStateChanged: jest.fn(),
  getAuth: jest.fn(() => ({ currentUser: null }))
}));

jest.mock('../../utils/retryManager', () => ({
  retry: jest.fn((fn) => fn())
}));

// Import mocked functions
import {
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
  getAuth
} from 'firebase/auth';

describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockUser: User;
  let mockUserCredential: UserCredential;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock user object
    mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
      photoURL: null,
      phoneNumber: null,
      providerId: 'firebase',
      metadata: {
        creationTime: '2023-01-01T00:00:00.000Z',
        lastSignInTime: '2023-01-02T00:00:00.000Z'
      },
      providerData: [],
      refreshToken: 'mock-refresh-token',
      tenantId: null,
      delete: jest.fn(),
      getIdToken: jest.fn().mockResolvedValue('mock-id-token'),
      getIdTokenResult: jest.fn(),
      reload: jest.fn(),
      toJSON: jest.fn()
    } as unknown as User;

    // Mock user credential
    mockUserCredential = {
      user: mockUser,
      providerId: 'firebase',
      operationType: 'signIn'
    } as UserCredential;

    authService = new AuthenticationService();
  });

  describe('Sign In Operations', () => {
    it('should sign in user successfully', async () => {
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const result = await authService.signIn('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.user).toBe(mockUser);
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.operationId).toBeDefined();

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        'test@example.com',
        'password123'
      );
    });

    it('should handle invalid credentials', async () => {
      const authError: AuthError = {
        code: 'auth/wrong-password',
        message: 'Wrong password',
        name: 'FirebaseError'
      } as AuthError;

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(authError);

      const result = await authService.signIn('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.AUTH_INVALID);
      expect(result.error?.userMessage).toContain('Authentication failed');
    });

    it('should handle user not found', async () => {
      const authError: AuthError = {
        code: 'auth/user-not-found',
        message: 'User not found',
        name: 'FirebaseError'
      } as AuthError;

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(authError);

      const result = await authService.signIn('nonexistent@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.AUTH_INVALID);
    });

    it('should handle network errors', async () => {
      const authError: AuthError = {
        code: 'auth/network-request-failed',
        message: 'Network request failed',
        name: 'FirebaseError'
      } as AuthError;

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(authError);

      const result = await authService.signIn('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.NETWORK_ERROR);
      expect(result.error?.userMessage).toContain('Network error');
    });

    it('should validate email format', async () => {
      const result = await authService.signIn('invalid-email', 'password123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.AUTH_INVALID);
    });

    it('should validate password length', async () => {
      const result = await authService.signIn('test@example.com', '123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.AUTH_INVALID);
    });
  });

  describe('Registration Operations', () => {
    it('should register user successfully', async () => {
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.register(
        'newuser@example.com',
        'password123',
        'New User'
      );

      expect(result.success).toBe(true);
      expect(result.user).toBe(mockUser);
      expect(result.requiresEmailVerification).toBe(true);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        'newuser@example.com',
        'password123'
      );
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('should handle email already in use', async () => {
      const authError: AuthError = {
        code: 'auth/email-already-in-use',
        message: 'Email already in use',
        name: 'FirebaseError'
      } as AuthError;

      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(authError);

      const result = await authService.register(
        'existing@example.com',
        'password123',
        'User'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.UNKNOWN); // Falls through to generic
    });

    it('should validate registration input', async () => {
      const result = await authService.register('', '', '');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.AUTH_INVALID);
    });
  });

  describe('Sign Out Operations', () => {
    it('should sign out successfully', async () => {
      (signOut as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.signOut();

      expect(result.success).toBe(true);
      expect(signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      (signOut as jest.Mock).mockRejectedValue(new Error('Sign out failed'));

      const result = await authService.signOut();

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Password Reset Operations', () => {
    it('should send password reset email successfully', async () => {
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.resetPassword('test@example.com');

      expect(result.success).toBe(true);
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.any(Object),
        'test@example.com'
      );
    });

    it('should handle user not found for password reset', async () => {
      const authError: AuthError = {
        code: 'auth/user-not-found',
        message: 'User not found',
        name: 'FirebaseError'
      } as AuthError;

      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(authError);

      const result = await authService.resetPassword('nonexistent@example.com');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.AUTH_INVALID);
    });

    it('should validate email for password reset', async () => {
      const result = await authService.resetPassword('invalid-email');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.AUTH_INVALID);
    });
  });

  describe('Profile Update Operations', () => {
    it('should update display name successfully', async () => {
      (updateProfile as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.updateDisplayName(mockUser, 'New Name');

      expect(result.success).toBe(true);
      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'New Name'
      });
    });

    it('should update email successfully', async () => {
      (updateEmail as jest.Mock).mockResolvedValue(undefined);
      (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.updateUserEmail(
        mockUser,
        'newemail@example.com'
      );

      expect(result.success).toBe(true);
      expect(updateEmail).toHaveBeenCalledWith(mockUser, 'newemail@example.com');
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('should update password successfully', async () => {
      (updatePassword as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.updateUserPassword(mockUser, 'newpassword123');

      expect(result.success).toBe(true);
      expect(updatePassword).toHaveBeenCalledWith(mockUser, 'newpassword123');
    });
  });

  describe('Reauthentication Operations', () => {
    it('should reauthenticate user successfully', async () => {
      (EmailAuthProvider.credential as jest.Mock).mockReturnValue('mock-credential');
      (reauthenticateWithCredential as jest.Mock).mockResolvedValue(mockUserCredential);

      const result = await authService.reauthenticate(mockUser, 'password123');

      expect(result.success).toBe(true);
      expect(EmailAuthProvider.credential).toHaveBeenCalledWith(
        mockUser.email!,
        'password123'
      );
      expect(reauthenticateWithCredential).toHaveBeenCalledWith(
        mockUser,
        'mock-credential'
      );
    });

    it('should handle invalid credentials during reauthentication', async () => {
      const authError: AuthError = {
        code: 'auth/wrong-password',
        message: 'Wrong password',
        name: 'FirebaseError'
      } as AuthError;

      (EmailAuthProvider.credential as jest.Mock).mockReturnValue('mock-credential');
      (reauthenticateWithCredential as jest.Mock).mockRejectedValue(authError);

      const result = await authService.reauthenticate(mockUser, 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.AUTH_INVALID);
    });
  });

  describe('Account Deletion Operations', () => {
    it('should delete user account successfully', async () => {
      (deleteUser as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.deleteAccount(mockUser);

      expect(result.success).toBe(true);
      expect(deleteUser).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('User Profile Operations', () => {
    it('should get user profile successfully', () => {
      const profile = authService.getUserProfile(mockUser);

      expect(profile).toEqual({
        displayName: 'Test User',
        email: 'test@example.com',
        emailVerified: true,
        photoURL: null,
        uid: 'test-user-123',
        createdAt: expect.any(Date),
        lastLoginAt: expect.any(Date),
        providerData: []
      });
    });

    it('should handle null user gracefully', () => {
      const profile = authService.getUserProfile(null);

      expect(profile).toBeNull();
    });
  });

  describe('Email Verification Operations', () => {
    it('should send verification email successfully', async () => {
      (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      const result = await authService.sendVerificationEmail(mockUser);

      expect(result.success).toBe(true);
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('Authentication State Management', () => {
    it('should set up auth state listener', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onAuthStateChanged as jest.Mock).mockReturnValue(mockUnsubscribe);

      const unsubscribe = authService.onAuthStateChanged(mockCallback);

      expect(onAuthStateChanged).toHaveBeenCalledWith(
        expect.any(Object),
        mockCallback
      );
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should get current user', () => {
      const mockAuth = { currentUser: mockUser };
      (getAuth as jest.Mock).mockReturnValue(mockAuth);

      const currentUser = authService.getCurrentUser();

      expect(currentUser).toBe(mockUser);
    });

    it('should handle null current user', () => {
      const mockAuth = { currentUser: null };
      (getAuth as jest.Mock).mockReturnValue(mockAuth);

      const currentUser = authService.getCurrentUser();

      expect(currentUser).toBeNull();
    });

    it('should check if user is signed in', () => {
      const mockAuth = { currentUser: mockUser };
      (getAuth as jest.Mock).mockReturnValue(mockAuth);

      expect(authService.isSignedIn()).toBe(true);

      const mockAuthNull = { currentUser: null };
      (getAuth as jest.Mock).mockReturnValue(mockAuthNull);

      expect(authService.isSignedIn()).toBe(false);
    });
  });

  describe('Error Conversion', () => {
    it('should convert unknown Firebase errors', async () => {
      const unknownError: AuthError = {
        code: 'auth/unknown-error',
        message: 'Unknown error',
        name: 'FirebaseError'
      } as AuthError;

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(unknownError);

      const result = await authService.signIn('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.UNKNOWN);
    });

    it('should handle non-AuthError exceptions', async () => {
      const genericError = new Error('Generic error');

      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(genericError);

      const result = await authService.signIn('test@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.UNKNOWN);
    });
  });
});