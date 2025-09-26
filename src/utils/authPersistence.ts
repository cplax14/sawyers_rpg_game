/**
 * Authentication Persistence Utilities
 * Handles persistent storage of authentication state and user preferences
 */

import { User } from 'firebase/auth';

// Storage keys
const STORAGE_KEYS = {
  AUTH_PREFERENCES: 'auth_preferences',
  SESSION_DATA: 'session_data',
  LAST_ACTIVITY: 'last_activity',
  REMEMBER_ME: 'remember_me',
  USER_PREFERENCES: 'user_preferences'
} as const;

// Types for persistent data
export interface AuthPreferences {
  rememberMe: boolean;
  autoSignIn: boolean;
  sessionTimeout: number; // minutes
  keepMeSignedIn: boolean;
  lastSignInMethod: 'email' | 'google' | 'anonymous' | null;
  preferredTheme: 'light' | 'dark' | 'system';
  language: string;
}

export interface SessionData {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
  loginAttempts: number;
  lastLoginTime: number;
}

export interface UserPreferences {
  displayName?: string;
  avatar?: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisible: boolean;
    shareAnalytics: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

// Default values
const DEFAULT_AUTH_PREFERENCES: AuthPreferences = {
  rememberMe: true,
  autoSignIn: false,
  sessionTimeout: 60, // 1 hour
  keepMeSignedIn: true,
  lastSignInMethod: null,
  preferredTheme: 'system',
  language: 'en'
};

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  notifications: {
    email: true,
    push: true,
    marketing: false
  },
  privacy: {
    profileVisible: true,
    shareAnalytics: true
  },
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    fontSize: 'medium'
  }
};

/**
 * Authentication Persistence Manager
 * Handles storing and retrieving authentication-related data
 */
export class AuthPersistenceManager {
  private storage: Storage;
  private sessionStorage: Storage;

  constructor() {
    this.storage = window.localStorage;
    this.sessionStorage = window.sessionStorage;
  }

  /**
   * Store authentication preferences
   */
  setAuthPreferences(preferences: Partial<AuthPreferences>): void {
    try {
      const current = this.getAuthPreferences();
      const updated = { ...current, ...preferences };
      this.storage.setItem(STORAGE_KEYS.AUTH_PREFERENCES, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to store auth preferences:', error);
    }
  }

  /**
   * Get authentication preferences
   */
  getAuthPreferences(): AuthPreferences {
    try {
      const stored = this.storage.getItem(STORAGE_KEYS.AUTH_PREFERENCES);
      if (stored) {
        return { ...DEFAULT_AUTH_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load auth preferences:', error);
    }
    return DEFAULT_AUTH_PREFERENCES;
  }

  /**
   * Store session data
   */
  setSessionData(data: Partial<SessionData>): void {
    try {
      const current = this.getSessionData();
      const updated = { ...current, ...data };

      // Use sessionStorage for temporary session data
      this.sessionStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(updated));

      // Store last activity in localStorage for persistence across sessions
      if (data.lastActivity) {
        this.storage.setItem(STORAGE_KEYS.LAST_ACTIVITY, data.lastActivity.toString());
      }
    } catch (error) {
      console.warn('Failed to store session data:', error);
    }
  }

  /**
   * Get session data
   */
  getSessionData(): SessionData | null {
    try {
      const stored = this.sessionStorage.getItem(STORAGE_KEYS.SESSION_DATA);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load session data:', error);
    }
    return null;
  }

  /**
   * Initialize new session
   */
  initializeSession(user: User): SessionData {
    const sessionData: SessionData = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      lastActivity: Date.now(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      },
      loginAttempts: 0,
      lastLoginTime: Date.now()
    };

    this.setSessionData(sessionData);
    return sessionData;
  }

  /**
   * Update last activity time
   */
  updateActivity(): void {
    const now = Date.now();
    this.setSessionData({ lastActivity: now });
  }

  /**
   * Get last activity time
   */
  getLastActivity(): number {
    try {
      const stored = this.storage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      return stored ? parseInt(stored) : 0;
    } catch (error) {
      console.warn('Failed to get last activity:', error);
      return 0;
    }
  }

  /**
   * Store user preferences (user-specific)
   */
  setUserPreferences(userId: string, preferences: Partial<UserPreferences>): void {
    try {
      const current = this.getUserPreferences(userId);
      const updated = { ...current, ...preferences };
      const key = `${STORAGE_KEYS.USER_PREFERENCES}_${userId}`;
      this.storage.setItem(key, JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to store user preferences:', error);
    }
  }

  /**
   * Get user preferences (user-specific)
   */
  getUserPreferences(userId: string): UserPreferences {
    try {
      const key = `${STORAGE_KEYS.USER_PREFERENCES}_${userId}`;
      const stored = this.storage.getItem(key);
      if (stored) {
        return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
    return DEFAULT_USER_PREFERENCES;
  }

  /**
   * Set remember me preference
   */
  setRememberMe(remember: boolean): void {
    try {
      this.storage.setItem(STORAGE_KEYS.REMEMBER_ME, remember.toString());
      this.setAuthPreferences({ rememberMe: remember });
    } catch (error) {
      console.warn('Failed to store remember me preference:', error);
    }
  }

  /**
   * Get remember me preference
   */
  getRememberMe(): boolean {
    try {
      const stored = this.storage.getItem(STORAGE_KEYS.REMEMBER_ME);
      return stored === 'true';
    } catch (error) {
      console.warn('Failed to get remember me preference:', error);
      return true; // Default to true
    }
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(): boolean {
    const preferences = this.getAuthPreferences();
    const lastActivity = this.getLastActivity();

    if (!lastActivity || !preferences.sessionTimeout) {
      return false;
    }

    const timeoutMs = preferences.sessionTimeout * 60 * 1000;
    return (Date.now() - lastActivity) > timeoutMs;
  }

  /**
   * Clear all stored authentication data
   */
  clearAuthData(): void {
    try {
      // Clear auth-specific data
      this.storage.removeItem(STORAGE_KEYS.AUTH_PREFERENCES);
      this.storage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
      this.storage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      this.sessionStorage.removeItem(STORAGE_KEYS.SESSION_DATA);

      // Clear user-specific preferences (all users)
      const keys = Object.keys(this.storage);
      keys.forEach(key => {
        if (key.startsWith(STORAGE_KEYS.USER_PREFERENCES)) {
          this.storage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear auth data:', error);
    }
  }

  /**
   * Clear session data only (keep preferences)
   */
  clearSessionData(): void {
    try {
      this.sessionStorage.removeItem(STORAGE_KEYS.SESSION_DATA);
      this.storage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    } catch (error) {
      console.warn('Failed to clear session data:', error);
    }
  }

  /**
   * Export user data (for data portability)
   */
  exportUserData(userId: string): {
    preferences: AuthPreferences;
    userPreferences: UserPreferences;
    sessionInfo: {
      lastActivity: number;
      rememberMe: boolean;
    };
  } {
    return {
      preferences: this.getAuthPreferences(),
      userPreferences: this.getUserPreferences(userId),
      sessionInfo: {
        lastActivity: this.getLastActivity(),
        rememberMe: this.getRememberMe()
      }
    };
  }

  /**
   * Import user data (for data portability)
   */
  importUserData(
    userId: string,
    data: {
      preferences?: Partial<AuthPreferences>;
      userPreferences?: Partial<UserPreferences>;
      sessionInfo?: {
        rememberMe?: boolean;
      };
    }
  ): void {
    if (data.preferences) {
      this.setAuthPreferences(data.preferences);
    }
    if (data.userPreferences) {
      this.setUserPreferences(userId, data.userPreferences);
    }
    if (data.sessionInfo?.rememberMe !== undefined) {
      this.setRememberMe(data.sessionInfo.rememberMe);
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): {
    localStorageUsed: number;
    sessionStorageUsed: number;
    totalKeys: number;
    authKeys: string[];
  } {
    const authKeys = Object.values(STORAGE_KEYS);
    let localStorageUsed = 0;
    let sessionStorageUsed = 0;
    let totalKeys = 0;

    // Calculate localStorage usage
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key) {
        totalKeys++;
        const value = this.storage.getItem(key);
        if (value) {
          localStorageUsed += key.length + value.length;
        }
      }
    }

    // Calculate sessionStorage usage
    for (let i = 0; i < this.sessionStorage.length; i++) {
      const key = this.sessionStorage.key(i);
      if (key) {
        const value = this.sessionStorage.getItem(key);
        if (value) {
          sessionStorageUsed += key.length + value.length;
        }
      }
    }

    return {
      localStorageUsed,
      sessionStorageUsed,
      totalKeys,
      authKeys: authKeys.filter(key =>
        this.storage.getItem(key) || this.sessionStorage.getItem(key)
      )
    };
  }
}

// Export singleton instance
export const authPersistence = new AuthPersistenceManager();

// Export utility functions
export const getAuthPreferences = (): AuthPreferences => authPersistence.getAuthPreferences();
export const setAuthPreferences = (preferences: Partial<AuthPreferences>): void =>
  authPersistence.setAuthPreferences(preferences);
export const getUserPreferences = (userId: string): UserPreferences =>
  authPersistence.getUserPreferences(userId);
export const setUserPreferences = (userId: string, preferences: Partial<UserPreferences>): void =>
  authPersistence.setUserPreferences(userId, preferences);
export const updateActivity = (): void => authPersistence.updateActivity();
export const isSessionExpired = (): boolean => authPersistence.isSessionExpired();

export default AuthPersistenceManager;