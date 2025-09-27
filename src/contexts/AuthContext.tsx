/**
 * Authentication Context
 * Provides authentication state management across the React application
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  AuthenticationService,
  AuthResult,
  UserProfile,
  AuthConfig,
  AuthEventHandlers,
  authService
} from '../services/authentication';
import { authPersistence, AuthPreferences, UserPreferences, SessionData } from '../utils/authPersistence';

// Authentication state
export interface AuthState {
  // User information
  user: User | null;
  userProfile: UserProfile | null;

  // Authentication status
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  // Email verification status
  emailVerified: boolean;
  requiresEmailVerification: boolean;

  // Error state
  lastError: string | null;
  lastOperation: string | null;

  // Session information
  sessionStartTime: Date | null;
  lastActivity: Date | null;

  // Persistence data
  authPreferences: AuthPreferences;
  userPreferences: UserPreferences | null;
  sessionData: SessionData | null;
  rememberMe: boolean;
}

// Authentication actions
export type AuthAction =
  | { type: 'AUTH_LOADING'; payload: { operation?: string } }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; operation: string } }
  | { type: 'AUTH_ERROR'; payload: { error: string; operation: string } }
  | { type: 'AUTH_SIGN_OUT' }
  | { type: 'AUTH_INITIALIZED' }
  | { type: 'USER_PROFILE_UPDATED'; payload: { userProfile: UserProfile } }
  | { type: 'EMAIL_VERIFICATION_REQUIRED'; payload: { required: boolean } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_ACTIVITY' }
  | { type: 'UPDATE_AUTH_PREFERENCES'; payload: { preferences: Partial<AuthPreferences> } }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: { preferences: Partial<UserPreferences> } }
  | { type: 'SET_SESSION_DATA'; payload: { sessionData: SessionData } }
  | { type: 'SET_REMEMBER_ME'; payload: { rememberMe: boolean } }
  | { type: 'RESTORE_PERSISTENCE_DATA' };

// Authentication context value
export interface AuthContextValue {
  // State
  state: AuthState;

  // Authentication operations
  signUp: (email: string, password: string, displayName?: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;

  // Account management
  sendPasswordReset: (email: string) => Promise<AuthResult>;
  resendEmailVerification: () => Promise<AuthResult>;
  updateProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<AuthResult>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<AuthResult>;
  changeEmail: (currentPassword: string, newEmail: string) => Promise<AuthResult>;
  deleteAccount: (currentPassword: string) => Promise<AuthResult>;

  // Utility functions
  clearError: () => void;
  refreshUserData: () => void;
  updateActivity: () => void;

  // Persistence management
  updateAuthPreferences: (preferences: Partial<AuthPreferences>) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  setRememberMe: (remember: boolean) => void;
  restorePersistenceData: () => void;
  exportUserData: () => any;
  importUserData: (data: any) => void;

  // Computed values
  isSignedIn: boolean;
  canAccessCloudFeatures: boolean;
  displayName: string;
  userInitials: string;
}

// Initial authentication state
const initialAuthState: AuthState = {
  user: null,
  userProfile: null,
  isAuthenticated: false,
  isLoading: true,
  isInitialized: false,
  emailVerified: false,
  requiresEmailVerification: false,
  lastError: null,
  lastOperation: null,
  sessionStartTime: null,
  lastActivity: null,
  authPreferences: authPersistence.getAuthPreferences(),
  userPreferences: null,
  sessionData: null,
  rememberMe: authPersistence.getRememberMe()
};

// Authentication reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        isLoading: true,
        lastOperation: action.payload.operation || null,
        lastError: null
      };

    case 'AUTH_SUCCESS':
      const userProfile = authService.getUserProfile(action.payload.user);
      const sessionData = authPersistence.initializeSession(action.payload.user);
      const userPreferences = authPersistence.getUserPreferences(action.payload.user.uid);

      // Update last activity
      authPersistence.updateActivity();

      return {
        ...state,
        user: action.payload.user,
        userProfile,
        isAuthenticated: true,
        isLoading: false,
        emailVerified: action.payload.user.emailVerified,
        requiresEmailVerification: false,
        lastError: null,
        lastOperation: action.payload.operation,
        sessionStartTime: state.sessionStartTime || new Date(),
        lastActivity: new Date(),
        sessionData,
        userPreferences
      };

    case 'AUTH_ERROR':
      return {
        ...state,
        isLoading: false,
        lastError: action.payload.error,
        lastOperation: action.payload.operation,
        requiresEmailVerification: action.payload.error.includes('verify') ||
                                  action.payload.error.includes('verification')
      };

    case 'AUTH_SIGN_OUT':
      // Clear session data but preserve auth preferences if rememberMe is true
      const shouldRemember = state.rememberMe;
      if (!shouldRemember) {
        authPersistence.clearAuthData();
      } else {
        authPersistence.clearSessionData();
      }

      return {
        ...initialAuthState,
        isInitialized: true,
        isLoading: false,
        authPreferences: shouldRemember ? state.authPreferences : authPersistence.getAuthPreferences(),
        rememberMe: shouldRemember
      };

    case 'AUTH_INITIALIZED':
      return {
        ...state,
        isInitialized: true,
        isLoading: false
      };

    case 'USER_PROFILE_UPDATED':
      return {
        ...state,
        userProfile: action.payload.userProfile,
        lastActivity: new Date()
      };

    case 'EMAIL_VERIFICATION_REQUIRED':
      return {
        ...state,
        requiresEmailVerification: action.payload.required
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        lastError: null
      };

    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: new Date()
      };

    case 'UPDATE_AUTH_PREFERENCES':
      const updatedAuthPrefs = { ...state.authPreferences, ...action.payload.preferences };
      authPersistence.setAuthPreferences(action.payload.preferences);
      return {
        ...state,
        authPreferences: updatedAuthPrefs
      };

    case 'UPDATE_USER_PREFERENCES':
      if (state.user) {
        const updatedUserPrefs = { ...state.userPreferences, ...action.payload.preferences };
        authPersistence.setUserPreferences(state.user.uid, action.payload.preferences);
        return {
          ...state,
          userPreferences: updatedUserPrefs
        };
      }
      return state;

    case 'SET_SESSION_DATA':
      authPersistence.setSessionData(action.payload.sessionData);
      return {
        ...state,
        sessionData: action.payload.sessionData
      };

    case 'SET_REMEMBER_ME':
      authPersistence.setRememberMe(action.payload.rememberMe);
      return {
        ...state,
        rememberMe: action.payload.rememberMe
      };

    case 'RESTORE_PERSISTENCE_DATA':
      const currentUser = state.user;
      return {
        ...state,
        authPreferences: authPersistence.getAuthPreferences(),
        userPreferences: currentUser ? authPersistence.getUserPreferences(currentUser.uid) : null,
        sessionData: authPersistence.getSessionData(),
        rememberMe: authPersistence.getRememberMe()
      };

    default:
      return state;
  }
}

// Create authentication context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Authentication provider props
export interface AuthProviderProps {
  children: React.ReactNode;
  config?: Partial<AuthConfig>;
  enableActivityTracking?: boolean;
  activityTrackingInterval?: number; // milliseconds
}

/**
 * Authentication Provider Component
 * Manages authentication state and provides auth operations to children
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  config = {},
  enableActivityTracking = true,
  activityTrackingInterval = 30000 // 30 seconds
}) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Set up authentication service with event handlers
  useEffect(() => {
    const eventHandlers: AuthEventHandlers = {
      onUserSignedIn: (user: User) => {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user, operation: 'signIn' } });
      },

      onUserSignedOut: () => {
        dispatch({ type: 'AUTH_SIGN_OUT' });
      },

      onUserProfileUpdated: (user: User) => {
        const userProfile = authService.getUserProfile(user);
        if (userProfile) {
          dispatch({ type: 'USER_PROFILE_UPDATED', payload: { userProfile } });
        }
      },

      onEmailVerificationSent: (email: string) => {
        console.log('Email verification sent to:', email);
      },

      onPasswordResetSent: (email: string) => {
        console.log('Password reset sent to:', email);
      },

      onAuthError: (error, operation) => {
        dispatch({
          type: 'AUTH_ERROR',
          payload: {
            error: error.message,
            operation
          }
        });
      }
    };

    // Initialize auth service with config and handlers
    const authServiceInstance = new AuthenticationService(config, eventHandlers);

    // Check for existing user
    const currentUser = authServiceInstance.getCurrentUser();
    if (currentUser) {
      dispatch({ type: 'AUTH_SUCCESS', payload: { user: currentUser, operation: 'initialize' } });
    } else {
      dispatch({ type: 'AUTH_INITIALIZED' });
    }

    // Cleanup on unmount
    return () => {
      authServiceInstance.destroy();
    };
  }, [config]);

  // Activity tracking
  useEffect(() => {
    if (!enableActivityTracking || !state.isAuthenticated) return;

    const handleActivity = () => {
      dispatch({ type: 'UPDATE_ACTIVITY' });
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up periodic activity updates
    const activityInterval = setInterval(() => {
      if (state.isAuthenticated) {
        dispatch({ type: 'UPDATE_ACTIVITY' });
      }
    }, activityTrackingInterval);

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(activityInterval);
    };
  }, [enableActivityTracking, activityTrackingInterval, state.isAuthenticated]);

  // Session expiry checking
  useEffect(() => {
    if (!state.isAuthenticated || !state.authPreferences.sessionTimeout) return;

    const checkSessionExpiry = () => {
      if (authPersistence.isSessionExpired()) {
        console.log('Session expired, signing out user');
        // Use authService directly to avoid dependency issues
        authService.signOut();
      }
    };

    // Check expiry every minute
    const expiryInterval = setInterval(checkSessionExpiry, 60000);

    // Check immediately
    checkSessionExpiry();

    return () => clearInterval(expiryInterval);
  }, [state.isAuthenticated, state.authPreferences.sessionTimeout]);

  // Authentication operations
  const signUp = useCallback(async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_LOADING', payload: { operation: 'signUp' } });

    try {
      const result = await authService.signUp(email, password, displayName);

      if (result.success && result.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: result.user, operation: 'signUp' } });

        if (result.requiresEmailVerification) {
          dispatch({ type: 'EMAIL_VERIFICATION_REQUIRED', payload: { required: true } });
        }
      } else if (result.error) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: {
            error: result.error.message,
            operation: 'signUp'
          }
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage, operation: 'signUp' } });
      throw error;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_LOADING', payload: { operation: 'signIn' } });

    try {
      const result = await authService.signIn(email, password);

      if (result.success && result.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: result.user, operation: 'signIn' } });
      } else if (result.error) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: {
            error: result.error.message,
            operation: 'signIn'
          }
        });

        if (result.requiresEmailVerification) {
          dispatch({ type: 'EMAIL_VERIFICATION_REQUIRED', payload: { required: true } });
        }
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage, operation: 'signIn' } });
      throw error;
    }
  }, []);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_LOADING', payload: { operation: 'signOut' } });

    try {
      const result = await authService.signOut();

      if (result.success) {
        dispatch({ type: 'AUTH_SIGN_OUT' });
      } else if (result.error) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: {
            error: result.error.message,
            operation: 'signOut'
          }
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage, operation: 'signOut' } });
      throw error;
    }
  }, []);

  const sendPasswordReset = useCallback(async (email: string): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_LOADING', payload: { operation: 'passwordReset' } });

    try {
      const result = await authService.sendPasswordReset(email);

      if (!result.success && result.error) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: {
            error: result.error.message,
            operation: 'passwordReset'
          }
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage, operation: 'passwordReset' } });
      throw error;
    }
  }, []);

  const resendEmailVerification = useCallback(async (): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_LOADING', payload: { operation: 'emailVerification' } });

    try {
      const result = await authService.resendEmailVerification();

      if (!result.success && result.error) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: {
            error: result.error.message,
            operation: 'emailVerification'
          }
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email verification failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage, operation: 'emailVerification' } });
      throw error;
    }
  }, []);

  const updateProfile = useCallback(async (updates: {
    displayName?: string;
    photoURL?: string;
  }): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_LOADING', payload: { operation: 'updateProfile' } });

    try {
      const result = await authService.updateUserProfile(updates);

      if (result.success && result.user) {
        const userProfile = authService.getUserProfile(result.user);
        if (userProfile) {
          dispatch({ type: 'USER_PROFILE_UPDATED', payload: { userProfile } });
        }
      } else if (result.error) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: {
            error: result.error.message,
            operation: 'updateProfile'
          }
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage, operation: 'updateProfile' } });
      throw error;
    }
  }, []);

  const changePassword = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_LOADING', payload: { operation: 'changePassword' } });

    try {
      const result = await authService.changePassword(currentPassword, newPassword);

      if (!result.success && result.error) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: {
            error: result.error.message,
            operation: 'changePassword'
          }
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password change failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage, operation: 'changePassword' } });
      throw error;
    }
  }, []);

  const changeEmail = useCallback(async (
    currentPassword: string,
    newEmail: string
  ): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_LOADING', payload: { operation: 'changeEmail' } });

    try {
      const result = await authService.changeEmail(currentPassword, newEmail);

      if (result.success && result.user) {
        dispatch({ type: 'AUTH_SUCCESS', payload: { user: result.user, operation: 'changeEmail' } });

        if (result.requiresEmailVerification) {
          dispatch({ type: 'EMAIL_VERIFICATION_REQUIRED', payload: { required: true } });
        }
      } else if (result.error) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: {
            error: result.error.message,
            operation: 'changeEmail'
          }
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Email change failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage, operation: 'changeEmail' } });
      throw error;
    }
  }, []);

  const deleteAccount = useCallback(async (currentPassword: string): Promise<AuthResult> => {
    dispatch({ type: 'AUTH_LOADING', payload: { operation: 'deleteAccount' } });

    try {
      const result = await authService.deleteAccount(currentPassword);

      if (result.success) {
        dispatch({ type: 'AUTH_SIGN_OUT' });
      } else if (result.error) {
        dispatch({
          type: 'AUTH_ERROR',
          payload: {
            error: result.error.message,
            operation: 'deleteAccount'
          }
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Account deletion failed';
      dispatch({ type: 'AUTH_ERROR', payload: { error: errorMessage, operation: 'deleteAccount' } });
      throw error;
    }
  }, []);

  // Utility functions
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const refreshUserData = useCallback(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const userProfile = authService.getUserProfile(currentUser);
      if (userProfile) {
        dispatch({ type: 'USER_PROFILE_UPDATED', payload: { userProfile } });
      }
    }
  }, []);

  const updateActivity = useCallback(() => {
    dispatch({ type: 'UPDATE_ACTIVITY' });
    authPersistence.updateActivity();
  }, []);

  // Persistence management functions
  const updateAuthPreferences = useCallback((preferences: Partial<AuthPreferences>) => {
    dispatch({ type: 'UPDATE_AUTH_PREFERENCES', payload: { preferences } });
  }, []);

  const updateUserPreferences = useCallback((preferences: Partial<UserPreferences>) => {
    dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: { preferences } });
  }, []);

  const setRememberMe = useCallback((remember: boolean) => {
    dispatch({ type: 'SET_REMEMBER_ME', payload: { rememberMe: remember } });
  }, []);

  const restorePersistenceData = useCallback(() => {
    dispatch({ type: 'RESTORE_PERSISTENCE_DATA' });
  }, []);

  const exportUserData = useCallback(() => {
    if (state.user) {
      return authPersistence.exportUserData(state.user.uid);
    }
    return null;
  }, [state.user]);

  const importUserData = useCallback((data: any) => {
    if (state.user && data) {
      authPersistence.importUserData(state.user.uid, data);
      dispatch({ type: 'RESTORE_PERSISTENCE_DATA' });
    }
  }, [state.user]);

  // Computed values
  const contextValue = useMemo((): AuthContextValue => ({
    // State
    state,

    // Authentication operations
    signUp,
    signIn,
    signOut,

    // Account management
    sendPasswordReset,
    resendEmailVerification,
    updateProfile,
    changePassword,
    changeEmail,
    deleteAccount,

    // Utility functions
    clearError,
    refreshUserData,
    updateActivity,

    // Persistence management
    updateAuthPreferences,
    updateUserPreferences,
    setRememberMe,
    restorePersistenceData,
    exportUserData,
    importUserData,

    // Computed values
    isSignedIn: state.isAuthenticated,
    canAccessCloudFeatures: state.isAuthenticated && state.emailVerified,
    displayName: state.userProfile?.displayName || state.user?.email?.split('@')[0] || 'User',
    userInitials: state.userProfile?.displayName
      ? state.userProfile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : state.user?.email?.charAt(0).toUpperCase() || '?'
  }), [
    state,
    signUp,
    signIn,
    signOut,
    sendPasswordReset,
    resendEmailVerification,
    updateProfile,
    changePassword,
    changeEmail,
    deleteAccount,
    clearError,
    refreshUserData,
    updateActivity,
    updateAuthPreferences,
    updateUserPreferences,
    setRememberMe,
    restorePersistenceData,
    exportUserData,
    importUserData
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to use authentication context
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook to get current user (simplified)
 */
export const useCurrentUser = (): User | null => {
  const { state } = useAuth();
  return state.user;
};

/**
 * Hook to check authentication status (simplified)
 */
export const useAuthStatus = (): {
  isSignedIn: boolean;
  isLoading: boolean;
  isEmailVerified: boolean;
  canAccessCloudFeatures: boolean;
} => {
  const { state, isSignedIn, canAccessCloudFeatures } = useAuth();

  return {
    isSignedIn,
    isLoading: state.isLoading,
    isEmailVerified: state.emailVerified,
    canAccessCloudFeatures
  };
};

export default AuthContext;