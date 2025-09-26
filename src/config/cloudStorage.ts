/**
 * Cloud Storage Configuration
 * Centralized configuration management for cloud storage services
 */

import { CompressionConfig } from '../utils/compression';
import { OfflineQueueConfig } from '../utils/offlineQueue';
import { NetworkStatusConfig } from '../utils/networkStatus';

// Environment types
export type Environment = 'development' | 'staging' | 'production' | 'test';

// Cloud storage provider configuration
export interface CloudStorageProviderConfig {
  provider: 'firebase' | 'supabase' | 'none';
  enabled: boolean;

  // Firebase specific config
  firebase?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
    useEmulator?: boolean;
    emulatorConfig?: {
      auth: { host: string; port: number };
      firestore: { host: string; port: number };
      storage: { host: string; port: number };
    };
  };

  // Supabase specific config (future)
  supabase?: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
  };
}

// Comprehensive cloud storage configuration
export interface CloudStorageConfig {
  // Environment settings
  environment: Environment;
  debug: boolean;

  // Provider configuration
  provider: CloudStorageProviderConfig;

  // Feature flags
  features: {
    compression: boolean;
    offlineQueue: boolean;
    networkMonitoring: boolean;
    autoRetry: boolean;
    analytics: boolean;
    encryption: boolean;
  };

  // Service settings
  settings: {
    maxSaves: number;
    maxSaveSize: number; // bytes
    defaultTimeout: number; // milliseconds
    retryAttempts: number;
    retryDelay: number;
    batchSize: number;
    syncInterval: number; // minutes
  };

  // Compression configuration
  compression: CompressionConfig;

  // Offline queue configuration
  offlineQueue: OfflineQueueConfig;

  // Network monitoring configuration
  networkMonitoring: NetworkStatusConfig;

  // Analytics configuration
  analytics: {
    enabled: boolean;
    trackOperations: boolean;
    trackPerformance: boolean;
    trackErrors: boolean;
    sampleRate: number; // 0-1
  };

  // Quota monitoring configuration
  quotaMonitoring: {
    enabled: boolean;
    maxStorageBytes: number;
    warningThreshold: number; // percentage
    criticalThreshold: number; // percentage
    checkInterval: number; // milliseconds
    autoCleanup: boolean;
    maxSavesToKeep: number;
  };
}

// Default configuration
export const DEFAULT_CLOUD_STORAGE_CONFIG: CloudStorageConfig = {
  environment: 'development',
  debug: true,

  provider: {
    provider: 'firebase',
    enabled: false, // Must be explicitly enabled after configuration
    firebase: {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      useEmulator: false
    }
  },

  features: {
    compression: true,
    offlineQueue: true,
    networkMonitoring: true,
    autoRetry: true,
    analytics: false, // Disabled by default
    encryption: false // TODO: Implement encryption
  },

  settings: {
    maxSaves: 10,
    maxSaveSize: 50 * 1024 * 1024, // 50MB
    defaultTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
    batchSize: 5,
    syncInterval: 15 // 15 minutes
  },

  compression: {
    algorithm: 'lz-string',
    level: 'balanced',
    enableBase64: true,
    chunkSize: 64 * 1024, // 64KB
    minimumCompressionRatio: 0.1
  },

  offlineQueue: {
    maxQueueSize: 100,
    maxRetries: 3,
    retryDelay: 1000,
    maxRetryDelay: 30000,
    enablePersistence: true,
    storageKey: 'cloud_save_offline_queue',
    processingConcurrency: 3,
    autoProcessOnline: true
  },

  networkMonitoring: {
    pingUrl: 'https://www.google.com/favicon.ico',
    pingInterval: 30000, // 30 seconds
    pingTimeout: 5000, // 5 seconds
    retryAttempts: 3,
    enableDetailedInfo: true
  },

  analytics: {
    enabled: false,
    trackOperations: true,
    trackPerformance: true,
    trackErrors: true,
    sampleRate: 0.1 // 10% sampling
  },

  quotaMonitoring: {
    enabled: true, // Enabled by default
    maxStorageBytes: 100 * 1024 * 1024, // 100MB default
    warningThreshold: 75, // 75%
    criticalThreshold: 90, // 90%
    checkInterval: 5 * 60 * 1000, // 5 minutes
    autoCleanup: false, // Disabled by default for safety
    maxSavesToKeep: 5
  }
};

/**
 * Configuration validation
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate cloud storage configuration
 */
export function validateCloudStorageConfig(config: Partial<CloudStorageConfig>): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate provider configuration
  if (config.provider?.enabled) {
    if (config.provider.provider === 'firebase') {
      const firebase = config.provider.firebase;
      if (!firebase) {
        errors.push('Firebase configuration is required when provider is enabled');
      } else {
        if (!firebase.apiKey) errors.push('Firebase apiKey is required');
        if (!firebase.authDomain) errors.push('Firebase authDomain is required');
        if (!firebase.projectId) errors.push('Firebase projectId is required');
        if (!firebase.storageBucket) errors.push('Firebase storageBucket is required');
        if (!firebase.messagingSenderId) errors.push('Firebase messagingSenderId is required');
        if (!firebase.appId) errors.push('Firebase appId is required');

        // Validate emulator config if enabled
        if (firebase.useEmulator && !firebase.emulatorConfig) {
          warnings.push('Emulator is enabled but emulatorConfig is not provided');
        }
      }
    } else if (config.provider.provider === 'supabase') {
      const supabase = config.provider.supabase;
      if (!supabase) {
        errors.push('Supabase configuration is required when provider is enabled');
      } else {
        if (!supabase.url) errors.push('Supabase URL is required');
        if (!supabase.anonKey) errors.push('Supabase anonymous key is required');
      }
    }
  }

  // Validate settings
  if (config.settings) {
    if (config.settings.maxSaves && config.settings.maxSaves < 1) {
      errors.push('maxSaves must be at least 1');
    }
    if (config.settings.maxSaveSize && config.settings.maxSaveSize < 1024) {
      warnings.push('maxSaveSize is very small (< 1KB), this may cause issues');
    }
    if (config.settings.retryAttempts && config.settings.retryAttempts > 10) {
      warnings.push('retryAttempts is very high (> 10), this may cause delays');
    }
  }

  // Validate compression config
  if (config.compression) {
    if (config.compression.chunkSize && config.compression.chunkSize < 1024) {
      warnings.push('Compression chunk size is very small (< 1KB)');
    }
    if (config.compression.minimumCompressionRatio &&
        (config.compression.minimumCompressionRatio < 0 || config.compression.minimumCompressionRatio > 1)) {
      errors.push('minimumCompressionRatio must be between 0 and 1');
    }
  }

  // Environment-specific validations
  if (config.environment === 'production') {
    if (config.debug) {
      warnings.push('Debug mode is enabled in production');
    }
    if (config.provider?.firebase?.useEmulator) {
      errors.push('Firebase emulator should not be used in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Load configuration from environment variables
 */
export function loadConfigFromEnvironment(): Partial<CloudStorageConfig> {
  const config: Partial<CloudStorageConfig> = {};

  // Environment settings
  if (process.env.NODE_ENV) {
    config.environment = process.env.NODE_ENV as Environment;
  }

  if (process.env.REACT_APP_CLOUD_STORAGE_DEBUG) {
    config.debug = process.env.REACT_APP_CLOUD_STORAGE_DEBUG === 'true';
  }

  // Firebase configuration
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || '',
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.REACT_APP_FIREBASE_APP_ID || '',
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
    useEmulator: process.env.REACT_APP_FIREBASE_USE_EMULATOR === 'true'
  };

  // Only include Firebase config if at least apiKey is provided
  if (firebaseConfig.apiKey) {
    config.provider = {
      provider: 'firebase',
      enabled: true,
      firebase: firebaseConfig
    };

    // Emulator configuration
    if (firebaseConfig.useEmulator) {
      config.provider.firebase!.emulatorConfig = {
        auth: {
          host: process.env.REACT_APP_FIREBASE_AUTH_EMULATOR_HOST || 'localhost',
          port: parseInt(process.env.REACT_APP_FIREBASE_AUTH_EMULATOR_PORT || '9099')
        },
        firestore: {
          host: process.env.REACT_APP_FIREBASE_FIRESTORE_EMULATOR_HOST || 'localhost',
          port: parseInt(process.env.REACT_APP_FIREBASE_FIRESTORE_EMULATOR_PORT || '8080')
        },
        storage: {
          host: process.env.REACT_APP_FIREBASE_STORAGE_EMULATOR_HOST || 'localhost',
          port: parseInt(process.env.REACT_APP_FIREBASE_STORAGE_EMULATOR_PORT || '9199')
        }
      };
    }
  }

  // Feature flags from environment
  config.features = {};
  if (process.env.REACT_APP_ENABLE_COMPRESSION !== undefined) {
    config.features.compression = process.env.REACT_APP_ENABLE_COMPRESSION === 'true';
  }
  if (process.env.REACT_APP_ENABLE_OFFLINE_QUEUE !== undefined) {
    config.features.offlineQueue = process.env.REACT_APP_ENABLE_OFFLINE_QUEUE === 'true';
  }
  if (process.env.REACT_APP_ENABLE_ANALYTICS !== undefined) {
    config.features.analytics = process.env.REACT_APP_ENABLE_ANALYTICS === 'true';
  }

  // Settings from environment
  config.settings = {};
  if (process.env.REACT_APP_MAX_SAVES) {
    config.settings.maxSaves = parseInt(process.env.REACT_APP_MAX_SAVES);
  }
  if (process.env.REACT_APP_MAX_SAVE_SIZE) {
    config.settings.maxSaveSize = parseInt(process.env.REACT_APP_MAX_SAVE_SIZE);
  }
  if (process.env.REACT_APP_RETRY_ATTEMPTS) {
    config.settings.retryAttempts = parseInt(process.env.REACT_APP_RETRY_ATTEMPTS);
  }

  // Quota monitoring from environment
  config.quotaMonitoring = {};
  if (process.env.REACT_APP_QUOTA_MONITORING_ENABLED !== undefined) {
    config.quotaMonitoring.enabled = process.env.REACT_APP_QUOTA_MONITORING_ENABLED === 'true';
  }
  if (process.env.REACT_APP_MAX_STORAGE_MB) {
    config.quotaMonitoring.maxStorageBytes = parseInt(process.env.REACT_APP_MAX_STORAGE_MB) * 1024 * 1024;
  }
  if (process.env.REACT_APP_QUOTA_WARNING_THRESHOLD) {
    config.quotaMonitoring.warningThreshold = parseInt(process.env.REACT_APP_QUOTA_WARNING_THRESHOLD);
  }
  if (process.env.REACT_APP_QUOTA_CRITICAL_THRESHOLD) {
    config.quotaMonitoring.criticalThreshold = parseInt(process.env.REACT_APP_QUOTA_CRITICAL_THRESHOLD);
  }
  if (process.env.REACT_APP_QUOTA_AUTO_CLEANUP !== undefined) {
    config.quotaMonitoring.autoCleanup = process.env.REACT_APP_QUOTA_AUTO_CLEANUP === 'true';
  }

  return config;
}

/**
 * Merge configurations with priority order
 */
export function mergeConfigurations(
  base: CloudStorageConfig,
  ...overrides: Partial<CloudStorageConfig>[]
): CloudStorageConfig {
  let result = { ...base };

  for (const override of overrides) {
    result = {
      ...result,
      ...override,
      provider: {
        ...result.provider,
        ...override.provider,
        firebase: {
          ...result.provider.firebase,
          ...override.provider?.firebase
        },
        supabase: {
          ...result.provider.supabase,
          ...override.provider?.supabase
        }
      },
      features: {
        ...result.features,
        ...override.features
      },
      settings: {
        ...result.settings,
        ...override.settings
      },
      compression: {
        ...result.compression,
        ...override.compression
      },
      offlineQueue: {
        ...result.offlineQueue,
        ...override.offlineQueue
      },
      networkMonitoring: {
        ...result.networkMonitoring,
        ...override.networkMonitoring
      },
      analytics: {
        ...result.analytics,
        ...override.analytics
      },
      quotaMonitoring: {
        ...result.quotaMonitoring,
        ...override.quotaMonitoring
      }
    };
  }

  return result;
}

/**
 * Create configuration with validation
 */
export function createCloudStorageConfig(
  overrides: Partial<CloudStorageConfig> = {}
): { config: CloudStorageConfig; validation: ConfigValidationResult } {
  // Load from environment
  const envConfig = loadConfigFromEnvironment();

  // Merge configurations: defaults < environment < overrides
  const config = mergeConfigurations(DEFAULT_CLOUD_STORAGE_CONFIG, envConfig, overrides);

  // Validate final configuration
  const validation = validateCloudStorageConfig(config);

  return { config, validation };
}

/**
 * Configuration utilities
 */
export const ConfigUtils = {
  /**
   * Check if cloud storage is properly configured and enabled
   */
  isCloudStorageEnabled(config: CloudStorageConfig): boolean {
    return config.provider.enabled &&
           config.provider.provider !== 'none' &&
           this.hasRequiredCredentials(config);
  },

  /**
   * Check if required credentials are present
   */
  hasRequiredCredentials(config: CloudStorageConfig): boolean {
    if (config.provider.provider === 'firebase') {
      const firebase = config.provider.firebase;
      return !!(firebase?.apiKey && firebase?.projectId);
    }
    if (config.provider.provider === 'supabase') {
      const supabase = config.provider.supabase;
      return !!(supabase?.url && supabase?.anonKey);
    }
    return false;
  },

  /**
   * Get human-readable configuration summary
   */
  getConfigSummary(config: CloudStorageConfig): string {
    const provider = config.provider.provider;
    const enabled = config.provider.enabled ? 'enabled' : 'disabled';
    const features = Object.entries(config.features)
      .filter(([, value]) => value)
      .map(([key]) => key)
      .join(', ');

    return `${provider} (${enabled}) | Features: ${features || 'none'}`;
  },

  /**
   * Get configuration for specific feature
   */
  getFeatureConfig<T extends keyof CloudStorageConfig>(
    config: CloudStorageConfig,
    feature: T
  ): CloudStorageConfig[T] {
    return config[feature];
  }
};