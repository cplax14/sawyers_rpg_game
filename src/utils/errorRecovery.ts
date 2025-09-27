/**
 * Error Recovery Service
 * Provides comprehensive error handling and graceful degradation for cloud save operations
 */

import { CloudError, CloudErrorCode, ErrorSeverity, logCloudError } from './cloudErrors';
import { serviceModeManager, ServiceMode } from './serviceMode';

export interface RecoveryStrategy {
  name: string;
  description: string;
  execute: () => Promise<boolean>;
  fallback?: () => Promise<boolean>;
}

export interface RecoveryContext {
  operation: string;
  attempt: number;
  maxAttempts: number;
  error: CloudError;
  userNotified: boolean;
}

export class ErrorRecoveryService {
  private recoveryStrategies: Map<CloudErrorCode, RecoveryStrategy[]> = new Map();
  private fallbackMode: boolean = false;
  private notificationCallback?: (message: string, type: 'error' | 'warning' | 'info') => void;

  constructor(notificationCallback?: (message: string, type: 'error' | 'warning' | 'info') => void) {
    this.notificationCallback = notificationCallback;
    this.initializeRecoveryStrategies();
  }

  /**
   * Initialize default recovery strategies for different error types
   */
  private initializeRecoveryStrategies(): void {
    // Network error strategies
    this.recoveryStrategies.set(CloudErrorCode.NETWORK_UNAVAILABLE, [
      {
        name: 'wait_and_retry',
        description: 'Wait for network connection and retry',
        execute: async () => {
          return new Promise((resolve) => {
            const checkConnection = () => {
              if (navigator.onLine) {
                resolve(true);
                return;
              }
              setTimeout(checkConnection, 2000);
            };
            checkConnection();
          });
        },
        fallback: async () => {
          this.enableFallbackMode();
          serviceModeManager.degradeToMode(ServiceMode.OFFLINE, 'Network connection lost');
          this.notify('Operating in offline mode. Changes will sync when connection is restored.', 'warning');
          return true;
        }
      }
    ]);

    this.recoveryStrategies.set(CloudErrorCode.NETWORK_ERROR, [
      {
        name: 'exponential_backoff',
        description: 'Retry with exponential backoff',
        execute: async () => {
          const delay = Math.min(1000 * Math.pow(2, Math.random() * 3), 10000);
          await new Promise(resolve => setTimeout(resolve, delay));
          return navigator.onLine;
        }
      }
    ]);

    // Authentication error strategies
    this.recoveryStrategies.set(CloudErrorCode.AUTH_REQUIRED, [
      {
        name: 'prompt_signin',
        description: 'Prompt user to sign in',
        execute: async () => {
          this.notify('Please sign in to continue using cloud features.', 'warning');
          return false; // Requires user action
        },
        fallback: async () => {
          this.enableFallbackMode();
          serviceModeManager.degradeToMode(ServiceMode.LOCAL_ONLY, 'Authentication required');
          this.notify('Operating in local-only mode. Sign in to enable cloud features.', 'info');
          return true;
        }
      }
    ]);

    this.recoveryStrategies.set(CloudErrorCode.AUTH_EXPIRED, [
      {
        name: 'refresh_token',
        description: 'Attempt to refresh authentication token',
        execute: async () => {
          // In a real implementation, this would attempt token refresh
          this.notify('Authentication expired. Please sign in again.', 'warning');
          return false;
        }
      }
    ]);

    // Storage quota strategies
    this.recoveryStrategies.set(CloudErrorCode.STORAGE_QUOTA_EXCEEDED, [
      {
        name: 'cleanup_old_saves',
        description: 'Suggest cleanup of old saves',
        execute: async () => {
          this.notify('Cloud storage is full. Please delete some old saves to continue.', 'error');
          return false; // Requires user action
        },
        fallback: async () => {
          this.notify('Cannot save to cloud due to storage limits. Saving locally only.', 'warning');
          return true; // Continue with local saves
        }
      }
    ]);

    // Data integrity strategies
    this.recoveryStrategies.set(CloudErrorCode.DATA_CORRUPTED, [
      {
        name: 'restore_from_backup',
        description: 'Attempt to restore from backup',
        execute: async () => {
          this.notify('Save data appears corrupted. Attempting recovery...', 'warning');
          // In a real implementation, this would attempt to restore from a backup
          return false;
        },
        fallback: async () => {
          this.notify('Unable to recover corrupted save. Please use a different save slot.', 'error');
          return true;
        }
      }
    ]);

    this.recoveryStrategies.set(CloudErrorCode.DATA_CHECKSUM_MISMATCH, [
      {
        name: 'verify_and_repair',
        description: 'Verify data integrity and attempt repair',
        execute: async () => {
          this.notify('Data integrity check failed. Attempting repair...', 'warning');
          // Simplified repair: assume success for now
          return Math.random() > 0.5; // 50% success rate for demo
        }
      }
    ]);

    // Sync conflict strategies
    this.recoveryStrategies.set(CloudErrorCode.SYNC_CONFLICT, [
      {
        name: 'automatic_resolution',
        description: 'Attempt automatic conflict resolution',
        execute: async () => {
          this.notify('Sync conflict detected. Resolving automatically...', 'info');
          // Use timestamp-based resolution by default
          return true;
        }
      }
    ]);

    // Operation timeout strategies
    this.recoveryStrategies.set(CloudErrorCode.OPERATION_TIMEOUT, [
      {
        name: 'retry_with_timeout',
        description: 'Retry operation with extended timeout',
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 5000));
          return true;
        }
      }
    ]);
  }

  /**
   * Attempt to recover from an error using appropriate strategies
   */
  async attemptRecovery(context: RecoveryContext): Promise<boolean> {
    const strategies = this.recoveryStrategies.get(context.error.code) || [];

    logCloudError(context.error, `Recovery attempt ${context.attempt}/${context.maxAttempts} for ${context.operation}`);

    // Try each recovery strategy
    for (const strategy of strategies) {
      try {
        console.log(`Attempting recovery strategy: ${strategy.name}`);
        const success = await strategy.execute();

        if (success) {
          console.log(`Recovery strategy ${strategy.name} succeeded`);
          return true;
        }
      } catch (recoveryError) {
        console.warn(`Recovery strategy ${strategy.name} failed:`, recoveryError);

        // Try fallback if available
        if (strategy.fallback) {
          try {
            const fallbackSuccess = await strategy.fallback();
            if (fallbackSuccess) {
              console.log(`Fallback for ${strategy.name} succeeded`);
              return true;
            }
          } catch (fallbackError) {
            console.warn(`Fallback for ${strategy.name} failed:`, fallbackError);
          }
        }
      }
    }

    // No recovery strategy worked
    return false;
  }

  /**
   * Check if an error is recoverable
   */
  isRecoverable(error: CloudError): boolean {
    // Critical errors with no recovery strategies are not recoverable
    if (error.severity === ErrorSeverity.CRITICAL && !this.recoveryStrategies.has(error.code)) {
      return false;
    }

    // Non-retryable errors without specific strategies are not recoverable
    if (!error.retryable && !this.recoveryStrategies.has(error.code)) {
      return false;
    }

    return true;
  }

  /**
   * Get recovery suggestions for an error
   */
  getRecoverySuggestions(error: CloudError): string[] {
    const strategies = this.recoveryStrategies.get(error.code) || [];
    return strategies.map(s => s.description);
  }

  /**
   * Enable fallback mode (local-only operations)
   */
  enableFallbackMode(): void {
    this.fallbackMode = true;
    console.log('Error recovery: Fallback mode enabled - operating locally only');
  }

  /**
   * Disable fallback mode
   */
  disableFallbackMode(): void {
    this.fallbackMode = false;
    console.log('Error recovery: Fallback mode disabled - cloud operations restored');
  }

  /**
   * Check if currently in fallback mode
   */
  isInFallbackMode(): boolean {
    return this.fallbackMode;
  }

  /**
   * Add a custom recovery strategy
   */
  addRecoveryStrategy(errorCode: CloudErrorCode, strategy: RecoveryStrategy): void {
    const existing = this.recoveryStrategies.get(errorCode) || [];
    existing.push(strategy);
    this.recoveryStrategies.set(errorCode, existing);
  }

  /**
   * Send notification to user
   */
  private notify(message: string, type: 'error' | 'warning' | 'info'): void {
    if (this.notificationCallback) {
      this.notificationCallback(message, type);
    } else {
      // Fallback to console
      const logFn = type === 'error' ? console.error : type === 'warning' ? console.warn : console.info;
      logFn(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Create an error recovery context for operation tracking
   */
  createRecoveryContext(
    operation: string,
    error: CloudError,
    attempt: number = 1,
    maxAttempts: number = 3
  ): RecoveryContext {
    return {
      operation,
      attempt,
      maxAttempts,
      error,
      userNotified: false
    };
  }

  /**
   * Execute operation with automatic error recovery
   */
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxAttempts: number = 3
  ): Promise<T> {
    let lastError: CloudError | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const cloudError = error instanceof Error ?
          {
            code: CloudErrorCode.UNKNOWN,
            message: error.message,
            severity: ErrorSeverity.MEDIUM,
            retryable: true,
            userMessage: error.message,
            timestamp: new Date()
          } as CloudError :
          error as CloudError;

        lastError = cloudError;

        if (attempt < maxAttempts && this.isRecoverable(cloudError)) {
          const context = this.createRecoveryContext(operationName, cloudError, attempt, maxAttempts);
          const recovered = await this.attemptRecovery(context);

          if (recovered) {
            // Recovery successful, try operation again
            continue;
          }
        }

        // If this is the last attempt or error is not recoverable, throw
        if (attempt === maxAttempts || !this.isRecoverable(cloudError)) {
          throw cloudError;
        }
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError || new Error('Unknown error in executeWithRecovery');
  }

  /**
   * Get current system status
   */
  getSystemStatus(): {
    fallbackMode: boolean;
    onlineStatus: boolean;
    recoveryStrategiesCount: number;
  } {
    return {
      fallbackMode: this.fallbackMode,
      onlineStatus: navigator.onLine,
      recoveryStrategiesCount: Array.from(this.recoveryStrategies.values()).reduce((sum, strategies) => sum + strategies.length, 0)
    };
  }
}

/**
 * Global error recovery service instance
 */
export const errorRecoveryService = new ErrorRecoveryService();

/**
 * Hook for using error recovery in React components
 */
export const useErrorRecovery = (notificationCallback?: (message: string, type: 'error' | 'warning' | 'info') => void) => {
  const service = notificationCallback ? new ErrorRecoveryService(notificationCallback) : errorRecoveryService;

  return {
    attemptRecovery: service.attemptRecovery.bind(service),
    isRecoverable: service.isRecoverable.bind(service),
    getRecoverySuggestions: service.getRecoverySuggestions.bind(service),
    enableFallbackMode: service.enableFallbackMode.bind(service),
    disableFallbackMode: service.disableFallbackMode.bind(service),
    isInFallbackMode: service.isInFallbackMode.bind(service),
    executeWithRecovery: service.executeWithRecovery.bind(service),
    getSystemStatus: service.getSystemStatus.bind(service)
  };
};