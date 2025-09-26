/**
 * Cloud Storage Initializer
 * Handles application startup initialization of cloud storage services
 */

import { CloudStorageConfig, createCloudStorageConfig, ConfigUtils, ConfigValidationResult } from '../config/cloudStorage';
import { CloudStorageService } from './cloudStorage';
import { NetworkStatusManager } from '../utils/networkStatus';
import { OfflineQueueManager } from '../utils/offlineQueue';
import { DataCompressor } from '../utils/compression';
import { initializeFirebase, checkFirebaseConnection } from '../config/firebase';
import { convertFirebaseError, logCloudError } from '../utils/cloudErrors';
import { retry } from '../utils/retryManager';

// Initialization status
export interface InitializationStatus {
  isInitialized: boolean;
  isConfigured: boolean;
  isConnected: boolean;
  provider: string;
  features: {
    compression: boolean;
    offlineQueue: boolean;
    networkMonitoring: boolean;
  };
  errors: string[];
  warnings: string[];
  timestamp: Date;
}

// Service instances
export interface CloudStorageServices {
  config: CloudStorageConfig;
  storageService: CloudStorageService | null;
  networkManager: NetworkStatusManager | null;
  queueManager: OfflineQueueManager | null;
  compressor: DataCompressor | null;
}

// Initialization options
export interface InitializationOptions {
  skipConnectionTest?: boolean;
  enableDebugLogging?: boolean;
  customConfig?: Partial<CloudStorageConfig>;
  onProgress?: (step: string, progress: number) => void;
  onWarning?: (warning: string) => void;
  onError?: (error: string) => void;
}

/**
 * Cloud Storage Initializer Class
 * Manages the complete initialization lifecycle
 */
export class CloudStorageInitializer {
  private status: InitializationStatus;
  private services: CloudStorageServices;
  private initializationPromise: Promise<InitializationStatus> | null = null;

  constructor() {
    this.status = {
      isInitialized: false,
      isConfigured: false,
      isConnected: false,
      provider: 'none',
      features: {
        compression: false,
        offlineQueue: false,
        networkMonitoring: false
      },
      errors: [],
      warnings: [],
      timestamp: new Date()
    };

    this.services = {
      config: createCloudStorageConfig().config,
      storageService: null,
      networkManager: null,
      queueManager: null,
      compressor: null
    };
  }

  /**
   * Initialize cloud storage services
   */
  async initialize(options: InitializationOptions = {}): Promise<InitializationStatus> {
    // Return existing initialization if already in progress
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization(options);
    return this.initializationPromise;
  }

  private async performInitialization(options: InitializationOptions): Promise<InitializationStatus> {
    const startTime = Date.now();

    try {
      // Reset status
      this.status = {
        isInitialized: false,
        isConfigured: false,
        isConnected: false,
        provider: 'none',
        features: {
          compression: false,
          offlineQueue: false,
          networkMonitoring: false
        },
        errors: [],
        warnings: [],
        timestamp: new Date()
      };

      options.onProgress?.('Loading configuration', 10);

      // Step 1: Load and validate configuration
      await this.loadConfiguration(options);

      options.onProgress?.('Validating configuration', 20);

      // Step 2: Initialize core services
      await this.initializeServices(options);

      options.onProgress?.('Testing connections', 60);

      // Step 3: Test connections (optional)
      if (!options.skipConnectionTest) {
        await this.testConnections(options);
      }

      options.onProgress?.('Finalizing setup', 90);

      // Step 4: Final setup
      await this.finalizeInitialization(options);

      options.onProgress?.('Initialization complete', 100);

      const duration = Date.now() - startTime;

      if (options.enableDebugLogging) {
        console.log(`Cloud storage initialization completed in ${duration}ms`, this.status);
      }

      return this.status;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      this.status.errors.push(errorMessage);

      if (options.enableDebugLogging) {
        console.error('Cloud storage initialization failed:', error);
      }

      options.onError?.(errorMessage);
      logCloudError(convertFirebaseError(error), 'cloudStorageInitialization');

      return this.status;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async loadConfiguration(options: InitializationOptions): Promise<void> {
    // Create configuration with overrides
    const { config, validation } = createCloudStorageConfig(options.customConfig);

    // Store configuration
    this.services.config = config;

    // Handle validation results
    if (!validation.isValid) {
      this.status.errors.push(...validation.errors);
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      this.status.warnings.push(...validation.warnings);
      validation.warnings.forEach(warning => options.onWarning?.(warning));
    }

    // Update status
    this.status.isConfigured = ConfigUtils.isCloudStorageEnabled(config);
    this.status.provider = config.provider.provider;

    if (options.enableDebugLogging) {
      console.log('Configuration loaded:', ConfigUtils.getConfigSummary(config));
    }
  }

  private async initializeServices(options: InitializationOptions): Promise<void> {
    const { config } = this.services;

    try {
      // Initialize compression service if enabled
      if (config.features.compression) {
        this.services.compressor = new DataCompressor(
          config.compression,
          {
            includeMetadata: true,
            stripFunctions: true,
            preserveUndefined: false
          }
        );
        this.status.features.compression = true;

        if (options.enableDebugLogging) {
          console.log('Compression service initialized');
        }
      }

      // Initialize network monitoring if enabled
      if (config.features.networkMonitoring) {
        this.services.networkManager = new NetworkStatusManager(config.networkMonitoring);
        this.status.features.networkMonitoring = true;

        if (options.enableDebugLogging) {
          console.log('Network monitoring initialized');
        }
      }

      // Initialize offline queue if enabled
      if (config.features.offlineQueue) {
        this.services.queueManager = new OfflineQueueManager(config.offlineQueue);
        this.status.features.offlineQueue = true;

        if (options.enableDebugLogging) {
          console.log('Offline queue initialized');
        }
      }

      // Initialize cloud storage service if configured
      if (ConfigUtils.isCloudStorageEnabled(config)) {
        // Initialize Firebase if that's the provider
        if (config.provider.provider === 'firebase') {
          await this.initializeFirebaseProvider(options);
        }

        // Create storage service instance
        this.services.storageService = new CloudStorageService({
          maxSaves: config.settings.maxSaves,
          maxSaveSize: config.settings.maxSaveSize,
          compressionEnabled: config.features.compression,
          checksumValidation: true,
          compressionConfig: config.compression
        });

        if (options.enableDebugLogging) {
          console.log('Cloud storage service initialized');
        }
      }

    } catch (error) {
      const errorMessage = `Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.status.errors.push(errorMessage);
      throw error;
    }
  }

  private async initializeFirebaseProvider(options: InitializationOptions): Promise<void> {
    const { config } = this.services;
    const firebaseConfig = config.provider.firebase;

    if (!firebaseConfig) {
      throw new Error('Firebase configuration is missing');
    }

    try {
      // Initialize Firebase
      const firebaseServices = initializeFirebase();

      if (options.enableDebugLogging) {
        console.log('Firebase services initialized:', {
          auth: !!firebaseServices.auth,
          firestore: !!firebaseServices.firestore,
          storage: !!firebaseServices.storage
        });
      }

      // Set up emulators if configured
      if (firebaseConfig.useEmulator && firebaseConfig.emulatorConfig) {
        const { emulatorConfig } = firebaseConfig;

        // Connect to emulators
        // Note: This would typically be done in the firebase config file
        if (options.enableDebugLogging) {
          console.log('Firebase emulators configured:', emulatorConfig);
        }
      }

    } catch (error) {
      const errorMessage = `Firebase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.status.errors.push(errorMessage);
      throw error;
    }
  }

  private async testConnections(options: InitializationOptions): Promise<void> {
    const { config, networkManager } = this.services;

    try {
      // Test network connectivity with retry
      if (networkManager) {
        const isOnline = await retry.quick(() => networkManager.checkConnectivity());
        if (!isOnline) {
          this.status.warnings.push('No internet connection detected');
          options.onWarning?.('No internet connection detected');
        }

        if (options.enableDebugLogging) {
          console.log('Network connectivity test:', isOnline ? 'online' : 'offline');
        }
      }

      // Test cloud storage connection if enabled
      if (ConfigUtils.isCloudStorageEnabled(config)) {
        await this.testCloudStorageConnection(options);
      }

    } catch (error) {
      const errorMessage = `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.status.warnings.push(errorMessage);
      options.onWarning?.(errorMessage);

      if (options.enableDebugLogging) {
        console.warn('Connection test failed:', error);
      }
    }
  }

  private async testCloudStorageConnection(options: InitializationOptions): Promise<void> {
    const { config } = this.services;

    if (config.provider.provider === 'firebase') {
      try {
        const connectionResult = await retry.network(() => checkFirebaseConnection(), {
          onRetry: (error, attempt, delay) => {
            if (options.enableDebugLogging) {
              console.log(`Retrying Firebase connection test, attempt ${attempt}, delay ${delay}ms:`, error);
            }
          }
        });

        if (connectionResult.connected) {
          this.status.isConnected = true;

          if (options.enableDebugLogging) {
            console.log('Firebase connection test successful:', connectionResult);
          }
        } else {
          this.status.warnings.push('Firebase connection test failed');
          options.onWarning?.('Firebase connection test failed');

          if (connectionResult.error) {
            this.status.warnings.push(`Firebase error: ${connectionResult.error}`);
          }
        }

      } catch (error) {
        const errorMessage = `Firebase connection test error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        this.status.warnings.push(errorMessage);
        options.onWarning?.(errorMessage);
      }
    }
  }

  private async finalizeInitialization(options: InitializationOptions): Promise<void> {
    // Set initialization status
    this.status.isInitialized = true;
    this.status.timestamp = new Date();

    // Log final status if debug enabled
    if (options.enableDebugLogging) {
      console.log('Cloud storage initialization finalized:', {
        configured: this.status.isConfigured,
        connected: this.status.isConnected,
        provider: this.status.provider,
        features: this.status.features,
        errors: this.status.errors.length,
        warnings: this.status.warnings.length
      });
    }

    // Emit any final warnings
    if (this.status.warnings.length > 0) {
      this.status.warnings.forEach(warning => options.onWarning?.(warning));
    }
  }

  /**
   * Get current initialization status
   */
  getStatus(): InitializationStatus {
    return { ...this.status };
  }

  /**
   * Get initialized services
   */
  getServices(): CloudStorageServices {
    return { ...this.services };
  }

  /**
   * Check if initialization is complete
   */
  isInitialized(): boolean {
    return this.status.isInitialized;
  }

  /**
   * Check if cloud storage is ready for use
   */
  isReady(): boolean {
    return this.status.isInitialized &&
           this.status.isConfigured &&
           this.status.errors.length === 0;
  }

  /**
   * Reinitialize with new configuration
   */
  async reinitialize(options: InitializationOptions = {}): Promise<InitializationStatus> {
    // Cleanup existing services
    await this.cleanup();

    // Perform fresh initialization
    return this.initialize(options);
  }

  /**
   * Cleanup all services
   */
  async cleanup(): Promise<void> {
    if (this.services.networkManager) {
      this.services.networkManager.destroy();
      this.services.networkManager = null;
    }

    if (this.services.queueManager) {
      this.services.queueManager.destroy();
      this.services.queueManager = null;
    }

    // Reset status
    this.status.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Get configuration summary for display
   */
  getConfigurationSummary(): {
    provider: string;
    status: string;
    features: string[];
    errors: number;
    warnings: number;
  } {
    return {
      provider: this.status.provider,
      status: this.status.isInitialized ?
        (this.status.isConnected ? 'ready' : 'offline') : 'not initialized',
      features: Object.entries(this.status.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature),
      errors: this.status.errors.length,
      warnings: this.status.warnings.length
    };
  }
}

// Export singleton instance
export const cloudStorageInitializer = new CloudStorageInitializer();

// Convenience functions
export const initializeCloudStorage = (options?: InitializationOptions): Promise<InitializationStatus> =>
  cloudStorageInitializer.initialize(options);

export const getCloudStorageStatus = (): InitializationStatus =>
  cloudStorageInitializer.getStatus();

export const getCloudStorageServices = (): CloudStorageServices =>
  cloudStorageInitializer.getServices();

export const isCloudStorageReady = (): boolean =>
  cloudStorageInitializer.isReady();