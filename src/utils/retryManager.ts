/**
 * Retry Manager with Exponential Backoff
 * Handles retry logic for failed operations with configurable strategies
 */

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay cap in milliseconds */
  maxDelay: number;
  /** Backoff multiplier (e.g., 2 for exponential) */
  backoffMultiplier: number;
  /** Add random jitter to prevent thundering herd */
  enableJitter: boolean;
  /** Jitter factor (0-1, percentage of delay to randomize) */
  jitterFactor: number;
  /** Function to determine if error should be retried */
  shouldRetry?: (error: any, attempt: number) => boolean;
  /** Callback for retry attempts */
  onRetry?: (error: any, attempt: number, delay: number) => void;
  /** Callback when all retries are exhausted */
  onMaxRetriesExceeded?: (error: any, totalAttempts: number) => void;
}

export interface RetryResult<T> {
  success: boolean;
  result?: T;
  error?: any;
  attempts: number;
  totalDelay: number;
  lastAttemptTime: Date;
}

export interface RetryAttempt {
  attemptNumber: number;
  timestamp: Date;
  error: any;
  delay: number;
}

/**
 * Default retry configuration for different operation types
 */
export const RETRY_CONFIGS = {
  // Network operations (Firebase calls, etc.)
  network: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    enableJitter: true,
    jitterFactor: 0.1,
  },
  // Critical operations (authentication, save operations)
  critical: {
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 8000,
    backoffMultiplier: 1.5,
    enableJitter: true,
    jitterFactor: 0.2,
  },
  // Background operations (sync, cleanup)
  background: {
    maxRetries: 2,
    initialDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 2.5,
    enableJitter: true,
    jitterFactor: 0.3,
  },
  // Quick operations (status checks, lightweight requests)
  quick: {
    maxRetries: 2,
    initialDelay: 300,
    maxDelay: 2000,
    backoffMultiplier: 2,
    enableJitter: false,
    jitterFactor: 0,
  },
} as const;

/**
 * Error types that should typically be retried
 */
export const RETRYABLE_ERROR_TYPES = [
  // Network errors
  'NetworkError',
  'TypeError', // Often network-related in fetch contexts
  'TimeoutError',

  // Firebase errors that are retryable
  'unavailable',
  'deadline-exceeded',
  'resource-exhausted',
  'internal',
  'aborted',

  // HTTP status codes that are retryable
  'status_408', // Request Timeout
  'status_429', // Too Many Requests
  'status_500', // Internal Server Error
  'status_502', // Bad Gateway
  'status_503', // Service Unavailable
  'status_504', // Gateway Timeout
] as const;

/**
 * Error types that should NOT be retried
 */
export const NON_RETRYABLE_ERROR_TYPES = [
  // Authentication errors
  'unauthenticated',
  'permission-denied',
  'invalid-argument',
  'not-found',
  'already-exists',

  // HTTP client errors
  'status_400', // Bad Request
  'status_401', // Unauthorized
  'status_403', // Forbidden
  'status_404', // Not Found
  'status_409', // Conflict
  'status_422', // Unprocessable Entity

  // Firebase Storage errors that should not be retried
  'storage/object-not-found', // File doesn't exist - retrying won't help
  'storage/unauthorized', // Permission denied
  'storage/unauthenticated', // Not signed in
  'storage/quota-exceeded', // Storage quota exceeded
  'storage/invalid-checksum', // File corruption
] as const;

/**
 * Retry Manager Class
 * Provides retry functionality with exponential backoff and jitter
 */
export class RetryManager {
  private defaultConfig: RetryConfig;

  constructor(defaultConfig: RetryConfig = RETRY_CONFIGS.network) {
    this.defaultConfig = defaultConfig;
  }

  /**
   * Execute an operation with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {}
  ): Promise<RetryResult<T>> {
    const finalConfig: RetryConfig = {
      ...this.defaultConfig,
      ...config,
    };

    const attempts: RetryAttempt[] = [];
    let lastError: any;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        const result = await operation();

        return {
          success: true,
          result,
          attempts: attempt + 1,
          totalDelay: Date.now() - startTime,
          lastAttemptTime: new Date(),
        };
      } catch (error) {
        lastError = error;
        const attemptInfo: RetryAttempt = {
          attemptNumber: attempt + 1,
          timestamp: new Date(),
          error,
          delay: 0,
        };

        // Check if we should retry this error
        if (!this.shouldRetryError(error, attempt, finalConfig)) {
          attempts.push(attemptInfo);
          break;
        }

        // If this was the last attempt, don't wait
        if (attempt === finalConfig.maxRetries) {
          attempts.push(attemptInfo);
          finalConfig.onMaxRetriesExceeded?.(error, attempt + 1);
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt + 1, finalConfig);
        attemptInfo.delay = delay;
        attempts.push(attemptInfo);

        // Call retry callback
        finalConfig.onRetry?.(error, attempt + 1, delay);

        // Wait before next attempt
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts: attempts.length,
      totalDelay: Date.now() - startTime,
      lastAttemptTime: new Date(),
    };
  }

  /**
   * Determine if an error should be retried
   */
  private shouldRetryError(error: any, attempt: number, config: RetryConfig): boolean {
    // Use custom retry logic if provided
    if (config.shouldRetry) {
      return config.shouldRetry(error, attempt);
    }

    // Check if we've exceeded max retries
    if (attempt >= config.maxRetries) {
      return false;
    }

    return this.isRetryableError(error);
  }

  /**
   * Check if an error is retryable based on error type/code
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;

    const errorType = this.getErrorType(error);

    // Check against non-retryable errors first
    if (NON_RETRYABLE_ERROR_TYPES.some(type => errorType.includes(type))) {
      return false;
    }

    // Check against retryable errors
    return RETRYABLE_ERROR_TYPES.some(type => errorType.includes(type));
  }

  /**
   * Extract error type/code from error object
   */
  private getErrorType(error: any): string {
    // Firebase error
    if (error.code) {
      return error.code;
    }

    // HTTP error with status
    if (error.status) {
      return `status_${error.status}`;
    }

    // Network/fetch error
    if (error.name) {
      return error.name;
    }

    // Generic error
    if (error.type) {
      return error.type;
    }

    return error.toString();
  }

  /**
   * Calculate delay with exponential backoff and optional jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff: delay = initialDelay * (backoffMultiplier ^ (attempt - 1))
    const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt - 1);

    // Apply maximum delay cap
    let delay = Math.min(exponentialDelay, config.maxDelay);

    // Add jitter to prevent thundering herd
    if (config.enableJitter && config.jitterFactor > 0) {
      const jitterAmount = delay * config.jitterFactor;
      const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
      delay = Math.max(0, delay + jitter);
    }

    return Math.round(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create retry configuration for specific operation types
   */
  static createConfig(
    type: keyof typeof RETRY_CONFIGS,
    overrides: Partial<RetryConfig> = {}
  ): RetryConfig {
    return {
      ...RETRY_CONFIGS[type],
      ...overrides,
    };
  }
}

/**
 * Convenience functions for common retry patterns
 */
export const retry = {
  /**
   * Retry network operations (Firebase, HTTP requests)
   */
  network: async <T>(operation: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T> => {
    const retryManager = new RetryManager(RETRY_CONFIGS.network);
    const result = await retryManager.executeWithRetry(operation, config);

    if (result.success) {
      return result.result!;
    }

    throw result.error;
  },

  /**
   * Retry critical operations (authentication, saves)
   */
  critical: async <T>(operation: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T> => {
    const retryManager = new RetryManager(RETRY_CONFIGS.critical);
    const result = await retryManager.executeWithRetry(operation, config);

    if (result.success) {
      return result.result!;
    }

    throw result.error;
  },

  /**
   * Retry background operations (sync, cleanup)
   */
  background: async <T>(operation: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T> => {
    const retryManager = new RetryManager(RETRY_CONFIGS.background);
    const result = await retryManager.executeWithRetry(operation, config);

    if (result.success) {
      return result.result!;
    }

    throw result.error;
  },

  /**
   * Retry quick operations (status checks)
   */
  quick: async <T>(operation: () => Promise<T>, config?: Partial<RetryConfig>): Promise<T> => {
    const retryManager = new RetryManager(RETRY_CONFIGS.quick);
    const result = await retryManager.executeWithRetry(operation, config);

    if (result.success) {
      return result.result!;
    }

    throw result.error;
  },
};

/**
 * Retry decorator for class methods
 */
export function Retryable(config: Partial<RetryConfig> = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const retryManager = new RetryManager();

    descriptor.value = async function (...args: any[]) {
      const result = await retryManager.executeWithRetry(
        () => originalMethod.apply(this, args),
        config
      );

      if (result.success) {
        return result.result;
      }

      throw result.error;
    };

    return descriptor;
  };
}

export default RetryManager;
