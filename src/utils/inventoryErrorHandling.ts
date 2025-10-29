/**
 * Inventory Error Handling Utilities
 * Provides user-friendly error messages, recovery strategies, and feedback systems
 */

import { InventoryError, InventoryException } from '../types/inventory';

export interface UserFriendlyError {
  title: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  recoveryActions?: RecoveryAction[];
  autoDismiss?: boolean;
  duration?: number; // milliseconds
  icon?: string;
}

export interface RecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type: 'primary' | 'secondary';
  icon?: string;
}

export interface ErrorContext {
  itemId?: string;
  itemName?: string;
  quantity?: number;
  containerId?: string;
  operationType?: string;
  playerLevel?: number;
  timestamp?: number;
}

/**
 * Convert inventory errors to user-friendly messages
 */
export function createUserFriendlyError(
  error: InventoryError | InventoryException | Error,
  context: ErrorContext = {}
): UserFriendlyError {
  const timestamp = context.timestamp || Date.now();

  // Handle InventoryException
  if (error instanceof InventoryException) {
    return createInventoryExceptionMessage(error, context);
  }

  // Handle InventoryError enum
  if (
    typeof error === 'string' &&
    Object.values(InventoryError).includes(error as InventoryError)
  ) {
    return createInventoryErrorMessage(error as InventoryError, context);
  }

  // Handle generic errors
  if (error instanceof Error) {
    return {
      title: 'Unexpected Error',
      message: `Something went wrong: ${error.message}`,
      severity: 'error',
      recoveryActions: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          type: 'primary',
          icon: '🔄',
        },
      ],
      icon: '⚠️',
    };
  }

  // Fallback for unknown errors
  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred. Please try again.',
    severity: 'error',
    icon: '❓',
  };
}

function createInventoryExceptionMessage(
  exception: InventoryException,
  context: ErrorContext
): UserFriendlyError {
  return createInventoryErrorMessage(exception.errorCode, {
    ...context,
    ...exception.context,
  });
}

function createInventoryErrorMessage(
  errorCode: InventoryError,
  context: ErrorContext
): UserFriendlyError {
  const itemName = context.itemName || 'item';
  const quantity = context.quantity || 1;

  switch (errorCode) {
    case InventoryError.ITEM_NOT_FOUND:
      return {
        title: 'Item Not Found',
        message: `${itemName} could not be found in your inventory.`,
        severity: 'warning',
        recoveryActions: [
          {
            label: 'Refresh Inventory',
            action: () => window.location.reload(),
            type: 'primary',
            icon: '🔄',
          },
        ],
        icon: '🔍',
        autoDismiss: true,
        duration: 5000,
      };

    case InventoryError.INVENTORY_FULL:
      return {
        title: 'Inventory Full',
        message: 'Your inventory is full. You need to make space before adding more items.',
        severity: 'warning',
        recoveryActions: [
          {
            label: 'Manage Inventory',
            action: () => {
              // This would open the inventory management UI
              console.log('Opening inventory management');
            },
            type: 'primary',
            icon: '📦',
          },
          {
            label: 'Auto-Sort',
            action: () => {
              // This would trigger auto-sorting/stacking
              console.log('Auto-sorting inventory');
            },
            type: 'secondary',
            icon: '🔧',
          },
        ],
        icon: '📦',
      };

    case InventoryError.INVALID_QUANTITY:
      return {
        title: 'Invalid Quantity',
        message: `Cannot process ${quantity} of ${itemName}. Please check the available quantity.`,
        severity: 'warning',
        recoveryActions: [
          {
            label: 'Check Available',
            action: () => {
              console.log('Checking available quantity');
            },
            type: 'primary',
            icon: '🔢',
          },
        ],
        icon: '🔢',
        autoDismiss: true,
        duration: 4000,
      };

    case InventoryError.STACK_SIZE_EXCEEDED:
      return {
        title: 'Stack Limit Reached',
        message: `${itemName} has reached its maximum stack size. Consider splitting the stack or storing excess items elsewhere.`,
        severity: 'info',
        recoveryActions: [
          {
            label: 'Split Stack',
            action: () => {
              console.log('Opening stack splitting interface');
            },
            type: 'primary',
            icon: '✂️',
          },
        ],
        icon: '📚',
        autoDismiss: true,
        duration: 6000,
      };

    case InventoryError.INVALID_OPERATION:
      return {
        title: 'Invalid Operation',
        message: 'This operation cannot be performed right now. Please try again later.',
        severity: 'error',
        recoveryActions: [
          {
            label: 'Retry',
            action: () => {
              console.log('Retrying operation');
            },
            type: 'primary',
            icon: '🔄',
          },
        ],
        icon: '🚫',
      };

    case InventoryError.PERMISSION_DENIED:
      return {
        title: 'Access Denied',
        message: `You don't have permission to perform this action with ${itemName}.`,
        severity: 'error',
        recoveryActions: [
          {
            label: 'Check Requirements',
            action: () => {
              console.log('Showing permission requirements');
            },
            type: 'primary',
            icon: '📋',
          },
        ],
        icon: '🔒',
      };

    case InventoryError.CONTAINER_LOCKED:
      return {
        title: 'Container Locked',
        message: 'This container is currently locked and cannot be accessed.',
        severity: 'warning',
        recoveryActions: [
          {
            label: 'Find Key',
            action: () => {
              console.log('Looking for unlock requirements');
            },
            type: 'primary',
            icon: '🗝️',
          },
        ],
        icon: '🔐',
        autoDismiss: true,
        duration: 5000,
      };

    case InventoryError.WEIGHT_LIMIT_EXCEEDED:
      return {
        title: 'Weight Limit Exceeded',
        message: `Adding ${itemName} would exceed your carrying capacity. Consider dropping some items or increasing your strength.`,
        severity: 'warning',
        recoveryActions: [
          {
            label: 'Manage Weight',
            action: () => {
              console.log('Opening weight management');
            },
            type: 'primary',
            icon: '⚖️',
          },
          {
            label: 'Drop Items',
            action: () => {
              console.log('Opening item dropping interface');
            },
            type: 'secondary',
            icon: '📤',
          },
        ],
        icon: '⚖️',
      };

    default:
      return {
        title: 'Inventory Error',
        message: 'An inventory-related error occurred. Please try again.',
        severity: 'error',
        icon: '❗',
      };
  }
}

/**
 * Determine error severity based on context
 */
export function getErrorSeverity(
  errorCode: InventoryError,
  context: ErrorContext = {}
): 'error' | 'warning' | 'info' {
  const criticalErrors = [InventoryError.INVALID_OPERATION, InventoryError.PERMISSION_DENIED];

  const warningErrors = [
    InventoryError.INVENTORY_FULL,
    InventoryError.WEIGHT_LIMIT_EXCEEDED,
    InventoryError.CONTAINER_LOCKED,
    InventoryError.INVALID_QUANTITY,
  ];

  const infoErrors = [InventoryError.STACK_SIZE_EXCEEDED, InventoryError.ITEM_NOT_FOUND];

  if (criticalErrors.includes(errorCode)) return 'error';
  if (warningErrors.includes(errorCode)) return 'warning';
  if (infoErrors.includes(errorCode)) return 'info';

  return 'error'; // Default to error for unknown codes
}

/**
 * Generate contextual help messages
 */
export function getContextualHelp(
  errorCode: InventoryError,
  context: ErrorContext = {}
): string | null {
  const playerLevel = context.playerLevel || 1;

  switch (errorCode) {
    case InventoryError.INVENTORY_FULL:
      if (playerLevel < 5) {
        return 'Tip: You can increase your inventory size by leveling up or finding bags and containers!';
      }
      return 'Try selling items to merchants or storing them in chests to free up space.';

    case InventoryError.WEIGHT_LIMIT_EXCEEDED:
      if (playerLevel < 10) {
        return 'Tip: Increase your Strength stat to carry more items, or consider using pack animals!';
      }
      return 'Consider upgrading your equipment with weight reduction enchantments.';

    case InventoryError.STACK_SIZE_EXCEEDED:
      return 'Some items have maximum stack sizes. Use multiple stacks or store excess in containers.';

    case InventoryError.PERMISSION_DENIED:
      return 'Check if you meet the level requirements or have completed necessary quests.';

    case InventoryError.CONTAINER_LOCKED:
      return 'Look for keys, solve puzzles, or meet unlock conditions to access locked containers.';

    default:
      return null;
  }
}

/**
 * Error analytics for tracking common issues
 */
export interface ErrorAnalytics {
  errorCode: InventoryError;
  frequency: number;
  lastOccurrence: number;
  context: ErrorContext[];
}

class ErrorTracker {
  private errors: Map<InventoryError, ErrorAnalytics> = new Map();

  track(errorCode: InventoryError, context: ErrorContext = {}) {
    const existing = this.errors.get(errorCode);

    if (existing) {
      existing.frequency++;
      existing.lastOccurrence = Date.now();
      existing.context.push(context);

      // Keep only last 10 contexts
      if (existing.context.length > 10) {
        existing.context = existing.context.slice(-10);
      }
    } else {
      this.errors.set(errorCode, {
        errorCode,
        frequency: 1,
        lastOccurrence: Date.now(),
        context: [context],
      });
    }
  }

  getAnalytics(): ErrorAnalytics[] {
    return Array.from(this.errors.values());
  }

  getMostCommonErrors(limit = 5): ErrorAnalytics[] {
    return this.getAnalytics()
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  getRecentErrors(hours = 24): ErrorAnalytics[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.getAnalytics()
      .filter(error => error.lastOccurrence > cutoff)
      .sort((a, b) => b.lastOccurrence - a.lastOccurrence);
  }

  reset() {
    this.errors.clear();
  }
}

export const errorTracker = new ErrorTracker();
