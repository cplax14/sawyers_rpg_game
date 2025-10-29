/**
 * Account Management Hook
 * Provides utilities for managing user account operations and UI states
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { AuthResult } from '../services/authentication';

export interface AccountManagementState {
  // Modal states
  showAccountSettings: boolean;
  showPasswordReset: boolean;
  showEmailVerification: boolean;

  // Operation states
  isChangingPassword: boolean;
  isChangingEmail: boolean;
  isDeletingAccount: boolean;

  // Success/error states
  lastOperation: string | null;
  lastError: string | null;
  lastSuccess: string | null;
}

export interface UseAccountManagementReturn {
  // State
  state: AccountManagementState;

  // Modal controls
  openAccountSettings: () => void;
  closeAccountSettings: () => void;
  openPasswordReset: (email?: string) => void;
  closePasswordReset: () => void;
  openEmailVerification: () => void;
  closeEmailVerification: () => void;

  // Account operations
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<AuthResult>;
  deleteAccount: (currentPassword: string) => Promise<AuthResult>;
  sendPasswordReset: (email?: string) => Promise<AuthResult>;

  // Utility functions
  clearMessages: () => void;
  hasUnverifiedEmail: boolean;
  canAccessAccountFeatures: boolean;

  // Event handlers
  handleAccountChange: (type: 'password' | 'email' | 'profile' | 'deleted') => void;
  handlePasswordResetSuccess: (email: string) => void;
  handleVerificationComplete: () => void;
}

/**
 * Hook for managing user account operations and related UI states
 *
 * @example
 * ```tsx
 * function UserDashboard() {
 *   const {
 *     state,
 *     openAccountSettings,
 *     openPasswordReset,
 *     handleAccountChange,
 *     hasUnverifiedEmail
 *   } = useAccountManagement();
 *
 *   return (
 *     <div>
 *       <button onClick={openAccountSettings}>
 *         Account Settings
 *       </button>
 *
 *       {hasUnverifiedEmail && (
 *         <div className="warning">
 *           Please verify your email address
 *         </div>
 *       )}
 *
 *       {state.lastSuccess && (
 *         <div className="success">{state.lastSuccess}</div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAccountManagement(): UseAccountManagementReturn {
  const {
    user,
    isAuthenticated,
    changePassword: authChangePassword,
    changeEmail: authChangeEmail,
    deleteAccount: authDeleteAccount,
    sendPasswordReset: authSendPasswordReset,
  } = useAuth();

  const [state, setState] = useState<AccountManagementState>({
    showAccountSettings: false,
    showPasswordReset: false,
    showEmailVerification: false,
    isChangingPassword: false,
    isChangingEmail: false,
    isDeletingAccount: false,
    lastOperation: null,
    lastError: null,
    lastSuccess: null,
  });

  // Clear messages after 5 seconds
  useEffect(() => {
    if (state.lastSuccess || state.lastError) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          lastSuccess: null,
          lastError: null,
        }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.lastSuccess, state.lastError]);

  // Modal controls
  const openAccountSettings = useCallback(() => {
    setState(prev => ({ ...prev, showAccountSettings: true }));
  }, []);

  const closeAccountSettings = useCallback(() => {
    setState(prev => ({ ...prev, showAccountSettings: false }));
  }, []);

  const openPasswordReset = useCallback((email?: string) => {
    setState(prev => ({ ...prev, showPasswordReset: true }));
  }, []);

  const closePasswordReset = useCallback(() => {
    setState(prev => ({ ...prev, showPasswordReset: false }));
  }, []);

  const openEmailVerification = useCallback(() => {
    setState(prev => ({ ...prev, showEmailVerification: true }));
  }, []);

  const closeEmailVerification = useCallback(() => {
    setState(prev => ({ ...prev, showEmailVerification: false }));
  }, []);

  // Account operations with state management
  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<AuthResult> => {
      setState(prev => ({
        ...prev,
        isChangingPassword: true,
        lastError: null,
        lastOperation: 'changePassword',
      }));

      try {
        const result = await authChangePassword(currentPassword, newPassword);

        if (result.success) {
          setState(prev => ({
            ...prev,
            isChangingPassword: false,
            lastSuccess: 'Password changed successfully',
          }));
        } else {
          setState(prev => ({
            ...prev,
            isChangingPassword: false,
            lastError: result.error?.message || 'Failed to change password',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Password change failed';
        setState(prev => ({
          ...prev,
          isChangingPassword: false,
          lastError: errorMessage,
        }));
        throw error;
      }
    },
    [authChangePassword]
  );

  const changeEmail = useCallback(
    async (currentPassword: string, newEmail: string): Promise<AuthResult> => {
      setState(prev => ({
        ...prev,
        isChangingEmail: true,
        lastError: null,
        lastOperation: 'changeEmail',
      }));

      try {
        const result = await authChangeEmail(currentPassword, newEmail);

        if (result.success) {
          setState(prev => ({
            ...prev,
            isChangingEmail: false,
            lastSuccess: 'Email changed successfully',
          }));
        } else {
          setState(prev => ({
            ...prev,
            isChangingEmail: false,
            lastError: result.error?.message || 'Failed to change email',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Email change failed';
        setState(prev => ({
          ...prev,
          isChangingEmail: false,
          lastError: errorMessage,
        }));
        throw error;
      }
    },
    [authChangeEmail]
  );

  const deleteAccount = useCallback(
    async (currentPassword: string): Promise<AuthResult> => {
      setState(prev => ({
        ...prev,
        isDeletingAccount: true,
        lastError: null,
        lastOperation: 'deleteAccount',
      }));

      try {
        const result = await authDeleteAccount(currentPassword);

        if (result.success) {
          setState(prev => ({
            ...prev,
            isDeletingAccount: false,
            lastSuccess: 'Account deleted successfully',
          }));
        } else {
          setState(prev => ({
            ...prev,
            isDeletingAccount: false,
            lastError: result.error?.message || 'Failed to delete account',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Account deletion failed';
        setState(prev => ({
          ...prev,
          isDeletingAccount: false,
          lastError: errorMessage,
        }));
        throw error;
      }
    },
    [authDeleteAccount]
  );

  const sendPasswordReset = useCallback(
    async (email?: string): Promise<AuthResult> => {
      const resetEmail = email || user?.email;
      if (!resetEmail) {
        const errorResult: AuthResult = {
          success: false,
          error: { code: 'missing-email', message: 'Email address is required' },
        };
        setState(prev => ({ ...prev, lastError: 'Email address is required' }));
        return errorResult;
      }

      setState(prev => ({ ...prev, lastError: null, lastOperation: 'sendPasswordReset' }));

      try {
        const result = await authSendPasswordReset(resetEmail);

        if (result.success) {
          setState(prev => ({
            ...prev,
            lastSuccess: `Password reset email sent to ${resetEmail}`,
          }));
        } else {
          setState(prev => ({
            ...prev,
            lastError: result.error?.message || 'Failed to send password reset email',
          }));
        }

        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email';
        setState(prev => ({ ...prev, lastError: errorMessage }));
        throw error;
      }
    },
    [authSendPasswordReset, user?.email]
  );

  // Utility functions
  const clearMessages = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastError: null,
      lastSuccess: null,
    }));
  }, []);

  // Computed values
  const hasUnverifiedEmail = isAuthenticated && user && !user.emailVerified;
  const canAccessAccountFeatures = isAuthenticated && user;

  // Event handlers
  const handleAccountChange = useCallback((type: 'password' | 'email' | 'profile' | 'deleted') => {
    switch (type) {
      case 'password':
        setState(prev => ({ ...prev, lastSuccess: 'Password updated successfully' }));
        break;
      case 'email':
        setState(prev => ({ ...prev, lastSuccess: 'Email updated successfully' }));
        break;
      case 'profile':
        setState(prev => ({ ...prev, lastSuccess: 'Profile updated successfully' }));
        break;
      case 'deleted':
        setState(prev => ({ ...prev, showAccountSettings: false }));
        break;
    }
  }, []);

  const handlePasswordResetSuccess = useCallback((email: string) => {
    setState(prev => ({
      ...prev,
      lastSuccess: `Password reset email sent to ${email}`,
      showPasswordReset: false,
    }));
  }, []);

  const handleVerificationComplete = useCallback(() => {
    setState(prev => ({
      ...prev,
      lastSuccess: 'Email verified successfully',
      showEmailVerification: false,
    }));
  }, []);

  return {
    // State
    state,

    // Modal controls
    openAccountSettings,
    closeAccountSettings,
    openPasswordReset,
    closePasswordReset,
    openEmailVerification,
    closeEmailVerification,

    // Account operations
    changePassword,
    changeEmail,
    deleteAccount,
    sendPasswordReset,

    // Utility functions
    clearMessages,
    hasUnverifiedEmail,
    canAccessAccountFeatures,

    // Event handlers
    handleAccountChange,
    handlePasswordResetSuccess,
    handleVerificationComplete,
  };
}

export default useAccountManagement;
