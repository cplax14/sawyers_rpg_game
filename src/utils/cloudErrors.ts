/**
 * Cloud Error Handling Utilities
 * Standardized error handling for cloud storage operations
 */

import { FirebaseError } from 'firebase/app';

// Cloud-specific error codes
export enum CloudErrorCode {
  // Authentication errors
  AUTH_REQUIRED = 'auth/required',
  AUTH_EXPIRED = 'auth/expired',
  AUTH_INVALID = 'auth/invalid',

  // Network errors
  NETWORK_UNAVAILABLE = 'network/unavailable',
  NETWORK_TIMEOUT = 'network/timeout',
  NETWORK_ERROR = 'network/error',

  // Storage errors
  STORAGE_QUOTA_EXCEEDED = 'storage/quota-exceeded',
  STORAGE_PERMISSION_DENIED = 'storage/permission-denied',
  STORAGE_NOT_FOUND = 'storage/not-found',
  STORAGE_CORRUPTED = 'storage/corrupted',

  // Data errors
  DATA_TOO_LARGE = 'data/too-large',
  DATA_INVALID = 'data/invalid',
  DATA_CORRUPTED = 'data/corrupted',
  DATA_CHECKSUM_MISMATCH = 'data/checksum-mismatch',
  DATA_VERSION_CONFLICT = 'data/version-conflict',
  SAVE_VALIDATION_FAILED = 'save/validation-failed',

  // Operation errors
  OPERATION_CANCELLED = 'operation/cancelled',
  OPERATION_TIMEOUT = 'operation/timeout',
  OPERATION_FAILED = 'operation/failed',

  // Sync errors
  SYNC_CONFLICT = 'sync/conflict',
  SYNC_INTERRUPTED = 'sync/interrupted',
  SYNC_PARTIAL_FAILURE = 'sync/partial-failure',

  // Configuration errors
  CONFIG_INVALID = 'config/invalid',
  CONFIG_MISSING = 'config/missing',

  // Generic errors
  UNKNOWN = 'unknown',
  INTERNAL = 'internal',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Cloud error interface
export interface CloudError {
  code: CloudErrorCode;
  message: string;
  severity: ErrorSeverity;
  retryable: boolean;
  userMessage: string;
  debugInfo?: any;
  timestamp: Date;
  operationId?: string;
}

/**
 * Convert Firebase errors to standardized cloud errors
 */
export function convertFirebaseError(error: FirebaseError | Error | any): CloudError {
  const timestamp = new Date();

  // Handle Firebase-specific errors
  if (error.code) {
    switch (error.code) {
      // Auth errors
      case 'auth/user-not-found':
      case 'auth/invalid-email':
      case 'auth/wrong-password':
        return {
          code: CloudErrorCode.AUTH_INVALID,
          message: error.message,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          userMessage: 'Authentication failed. Please check your credentials.',
          timestamp,
        };

      case 'auth/network-request-failed':
        return {
          code: CloudErrorCode.NETWORK_ERROR,
          message: error.message,
          severity: ErrorSeverity.HIGH,
          retryable: true,
          userMessage: 'Network error. Please check your connection and try again.',
          timestamp,
        };

      // Firestore errors
      case 'permission-denied':
        return {
          code: CloudErrorCode.STORAGE_PERMISSION_DENIED,
          message: error.message,
          severity: ErrorSeverity.HIGH,
          retryable: false,
          userMessage: 'Permission denied. Please sign in and try again.',
          timestamp,
        };

      case 'unavailable':
        return {
          code: CloudErrorCode.NETWORK_UNAVAILABLE,
          message: error.message,
          severity: ErrorSeverity.HIGH,
          retryable: true,
          userMessage: 'Service temporarily unavailable. Please try again later.',
          timestamp,
        };

      case 'quota-exceeded':
        return {
          code: CloudErrorCode.STORAGE_QUOTA_EXCEEDED,
          message: error.message,
          severity: ErrorSeverity.CRITICAL,
          retryable: false,
          userMessage: 'Storage quota exceeded. Please delete some saves to free up space.',
          timestamp,
        };

      // Storage errors
      case 'storage/object-not-found':
        return {
          code: CloudErrorCode.STORAGE_NOT_FOUND,
          message: error.message,
          severity: ErrorSeverity.MEDIUM,
          retryable: false,
          userMessage: 'Save file not found in cloud storage.',
          timestamp,
        };

      case 'storage/quota-exceeded':
        return {
          code: CloudErrorCode.STORAGE_QUOTA_EXCEEDED,
          message: error.message,
          severity: ErrorSeverity.CRITICAL,
          retryable: false,
          userMessage: 'Cloud storage quota exceeded. Please delete some saves.',
          timestamp,
        };
    }
  }

  // Handle network errors
  if (error.message && error.message.includes('network')) {
    return {
      code: CloudErrorCode.NETWORK_ERROR,
      message: error.message,
      severity: ErrorSeverity.HIGH,
      retryable: true,
      userMessage: 'Network error. Please check your connection.',
      timestamp,
    };
  }

  // Handle timeout errors
  if (error.message && error.message.includes('timeout')) {
    return {
      code: CloudErrorCode.OPERATION_TIMEOUT,
      message: error.message,
      severity: ErrorSeverity.MEDIUM,
      retryable: true,
      userMessage: 'Operation timed out. Please try again.',
      timestamp,
    };
  }

  // Generic error
  return {
    code: CloudErrorCode.UNKNOWN,
    message: error.message || 'An unknown error occurred',
    severity: ErrorSeverity.MEDIUM,
    retryable: true,
    userMessage: 'An unexpected error occurred. Please try again.',
    debugInfo: error,
    timestamp,
  };
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: CloudError): boolean {
  return error.retryable;
}

/**
 * Get retry delay for exponential backoff
 */
export function getRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
  // Exponential backoff with jitter
  const delay = baseDelay * Math.pow(2, attemptNumber - 1);
  const jitter = Math.random() * 1000; // Add up to 1 second of jitter
  return Math.min(delay + jitter, 30000); // Cap at 30 seconds
}

/**
 * Error logging utility
 */
export function logCloudError(error: CloudError, context?: string): void {
  const logLevel = {
    [ErrorSeverity.LOW]: 'debug',
    [ErrorSeverity.MEDIUM]: 'warn',
    [ErrorSeverity.HIGH]: 'error',
    [ErrorSeverity.CRITICAL]: 'error',
  }[error.severity];

  const logData = {
    code: error.code,
    message: error.message,
    severity: error.severity,
    retryable: error.retryable,
    timestamp: error.timestamp,
    context,
    operationId: error.operationId,
    debugInfo: error.debugInfo,
  };

  (console[logLevel as keyof Console] as any)('Cloud operation error:', logData);

  // In production, you might want to send critical errors to a monitoring service
  if (error.severity === ErrorSeverity.CRITICAL) {
    // Send to monitoring service
    // Example: sendToMonitoring(logData);
  }
}

/**
 * Create user-friendly error messages
 */
export function createUserErrorMessage(error: CloudError): string {
  const baseMessage = error.userMessage;

  // Add specific guidance based on error type
  switch (error.code) {
    case CloudErrorCode.NETWORK_UNAVAILABLE:
    case CloudErrorCode.NETWORK_ERROR:
      return `${baseMessage} Make sure you have a stable internet connection.`;

    case CloudErrorCode.AUTH_REQUIRED:
      return `${baseMessage} Please sign in to use cloud save features.`;

    case CloudErrorCode.STORAGE_QUOTA_EXCEEDED:
      return `${baseMessage} You can delete old saves to make room for new ones.`;

    case CloudErrorCode.DATA_TOO_LARGE:
      return `${baseMessage} Try reducing the amount of data or clearing your inventory.`;

    case CloudErrorCode.SYNC_CONFLICT:
      return `${baseMessage} There are conflicting saves that need to be resolved.`;

    default:
      return baseMessage;
  }
}

/**
 * Create a CloudError object
 */
export function createCloudError(
  code: CloudErrorCode,
  message: string,
  options: {
    severity?: ErrorSeverity;
    retryable?: boolean;
    userMessage?: string;
    debugInfo?: any;
    operationId?: string;
  } = {}
): CloudError {
  return {
    code,
    message,
    severity: options.severity || ErrorSeverity.MEDIUM,
    retryable: options.retryable !== undefined ? options.retryable : true,
    userMessage: options.userMessage || message,
    debugInfo: options.debugInfo,
    timestamp: new Date(),
    operationId: options.operationId,
  };
}

/**
 * Error recovery suggestions
 */
export function getRecoveryActions(error: CloudError): string[] {
  const actions: string[] = [];

  switch (error.code) {
    case CloudErrorCode.NETWORK_ERROR:
    case CloudErrorCode.NETWORK_UNAVAILABLE:
      actions.push('Check your internet connection');
      actions.push('Try again in a few moments');
      actions.push('Switch to a different network if possible');
      break;

    case CloudErrorCode.AUTH_REQUIRED:
    case CloudErrorCode.AUTH_EXPIRED:
      actions.push('Sign in to your account');
      actions.push('Check your credentials');
      break;

    case CloudErrorCode.STORAGE_QUOTA_EXCEEDED:
      actions.push('Delete old or unused saves');
      actions.push('Clear local cache');
      actions.push('Contact support if quota seems incorrect');
      break;

    case CloudErrorCode.DATA_CORRUPTED:
    case CloudErrorCode.DATA_CHECKSUM_MISMATCH:
      actions.push('Try loading from a different save slot');
      actions.push('Restore from a backup if available');
      actions.push('Contact support for data recovery');
      break;

    case CloudErrorCode.SYNC_CONFLICT:
      actions.push('Review conflicting saves');
      actions.push('Choose which version to keep');
      actions.push('Merge changes manually if needed');
      break;

    default:
      if (error.retryable) {
        actions.push('Try the operation again');
        actions.push('Wait a moment and retry');
      } else {
        actions.push('Contact support if the problem persists');
      }
      break;
  }

  return actions;
}

/**
 * Batch error handling for multiple operations
 */
export function processBatchErrors(errors: (CloudError | null)[]): {
  successful: number;
  failed: number;
  retryable: number;
  criticalErrors: CloudError[];
  summary: string;
} {
  const validErrors = errors.filter(e => e !== null) as CloudError[];
  const successful = errors.length - validErrors.length;
  const failed = validErrors.length;
  const retryable = validErrors.filter(e => e.retryable).length;
  const criticalErrors = validErrors.filter(e => e.severity === ErrorSeverity.CRITICAL);

  let summary = `${successful} succeeded, ${failed} failed`;
  if (retryable > 0) {
    summary += `, ${retryable} retryable`;
  }
  if (criticalErrors.length > 0) {
    summary += `, ${criticalErrors.length} critical`;
  }

  return {
    successful,
    failed,
    retryable,
    criticalErrors,
    summary,
  };
}
