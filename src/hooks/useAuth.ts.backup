/**
 * Authentication Hook
 * Custom hook for authentication operations and user session management
 */

import { useContext, useCallback, useMemo } from 'react';
import { AuthContext, AuthContextValue } from '../contexts/AuthContext';
import { AuthResult, AuthError } from '../services/authentication';

/**
 * Authentication hook interface
 */
export interface UseAuthReturn {
  // State
  user: AuthContextValue['state']['user'];
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: AuthError | null;

  // Activity tracking
  lastActivity: Date | null;
  sessionDuration: number;
  isActive: boolean;

  // Authentication operations
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;

  // Password management
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;

  // Email verification
  resendEmailVerification: () => Promise<AuthResult>;

  // Profile management
  updateProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<AuthResult>;

  // Account management
  deleteAccount: (password: string) => Promise<AuthResult>;

  // Session management
  refreshToken: () => Promise<AuthResult>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;

  // Utility functions
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  canAccess: (resource: string) => boolean;

  // Activity management
  updateActivity: () => void;
  isSessionExpired: () => boolean;
  getTimeUntilExpiry: () => number;

  // Error handling
  clearError: () => void;
  retryLastOperation: () => Promise<AuthResult | null>;
}

/**
 * Custom hook for authentication operations and user session management
 *
 * @returns Authentication state and operations
 *
 * @example
 * ```tsx
 * function LoginComponent() {
 *   const { user, isAuthenticated, signIn, signOut, error } = useAuth();
 *
 *   const handleLogin = async () => {
 *     const result = await signIn(email, password);
 *     if (!result.success) {
 *       console.error('Login failed:', result.error);
 *     }
 *   };
 *
 *   if (isAuthenticated) {
 *     return <button onClick={signOut}>Sign Out ({user?.displayName})</button>;
 *   }
 *
 *   return <button onClick={handleLogin}>Sign In</button>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function ProtectedComponent() {
 *   const { isAuthenticated, hasRole, canAccess } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *
 *   if (!hasRole('premium') && !canAccess('premium-features')) {
 *     return <div>Upgrade to premium for access</div>;
 *   }
 *
 *   return <div>Premium content here</div>;
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const {
    state,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    changePassword,
    resendEmailVerification,
    updateProfile,
    deleteAccount,
    refreshToken,
    getIdToken,
    updateActivity,
    clearError,
    retryLastOperation
  } = context;

  // Computed values
  const isAuthenticated = useMemo(() =>
    state.user !== null && !state.error,
    [state.user, state.error]
  );

  const sessionDuration = useMemo(() => {
    if (!state.lastActivity || !state.user) return 0;
    return Date.now() - state.lastActivity.getTime();
  }, [state.lastActivity, state.user]);

  const isActive = useMemo(() => {
    if (!state.lastActivity) return false;
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes
    return Date.now() - state.lastActivity.getTime() < inactiveThreshold;
  }, [state.lastActivity]);

  // Role and permission utilities
  const hasRole = useCallback((role: string): boolean => {
    if (!state.user?.customClaims) return false;
    const roles = state.user.customClaims.roles as string[] || [];
    return roles.includes(role);
  }, [state.user]);

  const hasAnyRole = useCallback((roles: string[]): boolean => {
    return roles.some(role => hasRole(role));
  }, [hasRole]);

  const hasAllRoles = useCallback((roles: string[]): boolean => {
    return roles.every(role => hasRole(role));
  }, [hasRole]);

  const canAccess = useCallback((resource: string): boolean => {
    if (!state.user?.customClaims) return false;
    const permissions = state.user.customClaims.permissions as string[] || [];
    return permissions.includes(resource) || permissions.includes('*');
  }, [state.user]);

  // Session management utilities
  const isSessionExpired = useCallback((): boolean => {
    if (!state.user?.tokenExpiry) return false;
    return Date.now() >= state.user.tokenExpiry.getTime();
  }, [state.user]);

  const getTimeUntilExpiry = useCallback((): number => {
    if (!state.user?.tokenExpiry) return 0;
    return Math.max(0, state.user.tokenExpiry.getTime() - Date.now());
  }, [state.user]);

  return {
    // State
    user: state.user,
    isAuthenticated,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    error: state.error,

    // Activity tracking
    lastActivity: state.lastActivity,
    sessionDuration,
    isActive,

    // Authentication operations
    signUp,
    signIn,
    signOut,

    // Password management
    sendPasswordReset,
    changePassword,

    // Email verification
    resendEmailVerification,

    // Profile management
    updateProfile,

    // Account management
    deleteAccount,

    // Session management
    refreshToken,
    getIdToken,

    // Utility functions
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccess,

    // Activity management
    updateActivity,
    isSessionExpired,
    getTimeUntilExpiry,

    // Error handling
    clearError,
    retryLastOperation
  };
}

/**
 * Hook for checking authentication status only (lighter alternative)
 * Useful for components that only need to know if user is authenticated
 */
export function useAuthStatus() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthStatus must be used within an AuthProvider');
  }

  const { state } = context;

  return {
    isAuthenticated: state.user !== null && !state.error,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    user: state.user,
    error: state.error
  };
}

/**
 * Hook for authentication operations only (no state)
 * Useful for components that only need to trigger auth operations
 */
export function useAuthOperations() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthOperations must be used within an AuthProvider');
  }

  const {
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    changePassword,
    resendEmailVerification,
    updateProfile,
    deleteAccount,
    refreshToken,
    updateActivity,
    clearError,
    retryLastOperation
  } = context;

  return {
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    changePassword,
    resendEmailVerification,
    updateProfile,
    deleteAccount,
    refreshToken,
    updateActivity,
    clearError,
    retryLastOperation
  };
}

/**
 * Hook for user permissions and roles
 * Useful for authorization checks
 */
export function useAuthPermissions() {
  const { user, hasRole, hasAnyRole, hasAllRoles, canAccess } = useAuth();

  return {
    user,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccess,
    isAuthenticated: user !== null,
    roles: user?.customClaims?.roles as string[] || [],
    permissions: user?.customClaims?.permissions as string[] || []
  };
}

export default useAuth;