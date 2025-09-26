/**
 * Cloud Storage Initialization Hook
 * React hook for managing cloud storage initialization
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  InitializationStatus,
  InitializationOptions,
  CloudStorageServices,
  cloudStorageInitializer
} from '../services/cloudStorageInitializer';

export interface UseCloudStorageInitializationOptions {
  /** Automatically initialize on mount */
  autoInitialize?: boolean;
  /** Skip connection tests during initialization */
  skipConnectionTest?: boolean;
  /** Enable debug logging */
  enableDebugLogging?: boolean;
  /** Custom configuration overrides */
  customConfig?: InitializationOptions['customConfig'];
  /** Polling interval for status updates (ms) */
  statusPollingInterval?: number;
}

export interface UseCloudStorageInitializationResult {
  // Status
  status: InitializationStatus;
  services: CloudStorageServices;
  isInitializing: boolean;
  isReady: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;

  // Actions
  initialize: (options?: InitializationOptions) => Promise<InitializationStatus>;
  reinitialize: (options?: InitializationOptions) => Promise<InitializationStatus>;
  cleanup: () => Promise<void>;

  // Utilities
  getConfigurationSummary: () => ReturnType<typeof cloudStorageInitializer.getConfigurationSummary>;
  retryInitialization: () => Promise<InitializationStatus>;
}

/**
 * Hook for managing cloud storage initialization
 */
export function useCloudStorageInitialization(
  options: UseCloudStorageInitializationOptions = {}
): UseCloudStorageInitializationResult {
  const [status, setStatus] = useState<InitializationStatus>(() =>
    cloudStorageInitializer.getStatus()
  );
  const [services, setServices] = useState<CloudStorageServices>(() =>
    cloudStorageInitializer.getServices()
  );
  const [isInitializing, setIsInitializing] = useState(false);

  // Update status and services periodically
  useEffect(() => {
    const interval = options.statusPollingInterval || 1000; // Default 1 second

    const updateStatus = () => {
      const currentStatus = cloudStorageInitializer.getStatus();
      const currentServices = cloudStorageInitializer.getServices();

      setStatus(prev => {
        // Only update if there are actual changes
        if (JSON.stringify(prev) !== JSON.stringify(currentStatus)) {
          return currentStatus;
        }
        return prev;
      });

      setServices(prev => {
        // Simple reference comparison for services
        if (prev.storageService !== currentServices.storageService ||
            prev.networkManager !== currentServices.networkManager ||
            prev.queueManager !== currentServices.queueManager) {
          return currentServices;
        }
        return prev;
      });
    };

    const intervalId = setInterval(updateStatus, interval);

    // Initial update
    updateStatus();

    return () => clearInterval(intervalId);
  }, [options.statusPollingInterval]);

  // Initialize cloud storage
  const initialize = useCallback(async (initOptions?: InitializationOptions): Promise<InitializationStatus> => {
    setIsInitializing(true);

    try {
      const combinedOptions: InitializationOptions = {
        skipConnectionTest: options.skipConnectionTest,
        enableDebugLogging: options.enableDebugLogging,
        customConfig: options.customConfig,
        ...initOptions,
        onProgress: (step: string, progress: number) => {
          if (options.enableDebugLogging) {
            console.log(`Initialization progress: ${step} (${progress}%)`);
          }
          initOptions?.onProgress?.(step, progress);
        },
        onWarning: (warning: string) => {
          if (options.enableDebugLogging) {
            console.warn('Initialization warning:', warning);
          }
          initOptions?.onWarning?.(warning);
        },
        onError: (error: string) => {
          if (options.enableDebugLogging) {
            console.error('Initialization error:', error);
          }
          initOptions?.onError?.(error);
        }
      };

      const result = await cloudStorageInitializer.initialize(combinedOptions);

      // Update state immediately after initialization
      setStatus(result);
      setServices(cloudStorageInitializer.getServices());

      return result;
    } finally {
      setIsInitializing(false);
    }
  }, [options.skipConnectionTest, options.enableDebugLogging, options.customConfig]);

  // Reinitialize cloud storage
  const reinitialize = useCallback(async (initOptions?: InitializationOptions): Promise<InitializationStatus> => {
    setIsInitializing(true);

    try {
      const result = await cloudStorageInitializer.reinitialize({
        skipConnectionTest: options.skipConnectionTest,
        enableDebugLogging: options.enableDebugLogging,
        customConfig: options.customConfig,
        ...initOptions
      });

      setStatus(result);
      setServices(cloudStorageInitializer.getServices());

      return result;
    } finally {
      setIsInitializing(false);
    }
  }, [options.skipConnectionTest, options.enableDebugLogging, options.customConfig]);

  // Cleanup cloud storage
  const cleanup = useCallback(async (): Promise<void> => {
    await cloudStorageInitializer.cleanup();
    setStatus(cloudStorageInitializer.getStatus());
    setServices(cloudStorageInitializer.getServices());
  }, []);

  // Retry initialization (same as initialize but with different semantics)
  const retryInitialization = useCallback((): Promise<InitializationStatus> => {
    return initialize();
  }, [initialize]);

  // Get configuration summary
  const getConfigurationSummary = useCallback(() => {
    return cloudStorageInitializer.getConfigurationSummary();
  }, []);

  // Auto-initialize on mount if enabled
  useEffect(() => {
    if (options.autoInitialize && !status.isInitialized && !isInitializing) {
      initialize().catch(error => {
        if (options.enableDebugLogging) {
          console.error('Auto-initialization failed:', error);
        }
      });
    }
  }, [options.autoInitialize, status.isInitialized, isInitializing, initialize, options.enableDebugLogging]);

  // Computed values
  const isReady = useMemo(() => cloudStorageInitializer.isReady(), [status]);
  const hasErrors = useMemo(() => status.errors.length > 0, [status.errors]);
  const hasWarnings = useMemo(() => status.warnings.length > 0, [status.warnings]);

  return {
    status,
    services,
    isInitializing,
    isReady,
    hasErrors,
    hasWarnings,
    initialize,
    reinitialize,
    cleanup,
    getConfigurationSummary,
    retryInitialization
  };
}

/**
 * Simplified hook that just returns initialization status
 */
export function useCloudStorageStatus(): {
  isInitialized: boolean;
  isReady: boolean;
  isConfigured: boolean;
  isConnected: boolean;
  hasErrors: boolean;
  provider: string;
} {
  const { status, isReady } = useCloudStorageInitialization({
    statusPollingInterval: 2000 // Less frequent polling for simple status
  });

  return {
    isInitialized: status.isInitialized,
    isReady,
    isConfigured: status.isConfigured,
    isConnected: status.isConnected,
    hasErrors: status.errors.length > 0,
    provider: status.provider
  };
}

/**
 * Hook for accessing initialized cloud storage services
 */
export function useCloudStorageServices(): {
  storageService: CloudStorageServices['storageService'];
  networkManager: CloudStorageServices['networkManager'];
  queueManager: CloudStorageServices['queueManager'];
  compressor: CloudStorageServices['compressor'];
  config: CloudStorageServices['config'];
  isReady: boolean;
} {
  const { services, isReady } = useCloudStorageInitialization({
    autoInitialize: true,
    statusPollingInterval: 5000 // Even less frequent for service access
  });

  return {
    ...services,
    isReady
  };
}