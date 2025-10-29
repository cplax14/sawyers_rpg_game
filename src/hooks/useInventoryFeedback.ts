/**
 * Inventory Feedback Hook
 * Provides user feedback through toasts, notifications, and progress indicators
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createUserFriendlyError,
  errorTracker,
  ErrorContext,
  UserFriendlyError,
} from '../utils/inventoryErrorHandling';
import { InventoryError, InventoryException } from '../types/inventory';

export interface NotificationOptions {
  id?: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number; // milliseconds, 0 = permanent
  icon?: string;
  actions?: NotificationAction[];
  progress?: number; // 0-100 for loading notifications
  persistent?: boolean; // survives page reload
}

export interface NotificationAction {
  label: string;
  action: () => void | Promise<void>;
  style?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

export interface FeedbackNotification extends NotificationOptions {
  id: string;
  timestamp: number;
  dismissed?: boolean;
}

export interface OperationProgress {
  id: string;
  label: string;
  progress: number;
  stage: string;
  total?: number;
  completed?: number;
  estimatedTimeRemaining?: number;
}

export function useInventoryFeedback() {
  const [notifications, setNotifications] = useState<FeedbackNotification[]>([]);
  const [operations, setOperations] = useState<Map<string, OperationProgress>>(new Map());
  const notificationId = useRef(0);
  const dismissTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Generate unique notification ID
  const generateId = useCallback(() => {
    return `notification-${++notificationId.current}-${Date.now()}`;
  }, []);

  // Show notification
  const showNotification = useCallback(
    (options: NotificationOptions) => {
      const id = options.id || generateId();
      const notification: FeedbackNotification = {
        ...options,
        id,
        timestamp: Date.now(),
      };

      setNotifications(prev => {
        // Remove existing notification with same ID
        const filtered = prev.filter(n => n.id !== id);
        return [...filtered, notification];
      });

      // Auto-dismiss if duration is set
      if (options.duration && options.duration > 0) {
        const timer = setTimeout(() => {
          dismissNotification(id);
        }, options.duration);

        dismissTimers.current.set(id, timer);
      }

      return id;
    },
    [generateId]
  );

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Clear dismiss timer
    const timer = dismissTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      dismissTimers.current.delete(id);
    }
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);

    // Clear all timers
    dismissTimers.current.forEach(timer => clearTimeout(timer));
    dismissTimers.current.clear();
  }, []);

  // Show success message
  const showSuccess = useCallback(
    (title: string, message: string, options: Partial<NotificationOptions> = {}) => {
      return showNotification({
        ...options,
        title,
        message,
        type: 'success',
        duration: options.duration ?? 4000,
        icon: options.icon ?? '✅',
      });
    },
    [showNotification]
  );

  // Show error message
  const showError = useCallback(
    (
      error: InventoryError | InventoryException | Error | string,
      context: ErrorContext = {},
      options: Partial<NotificationOptions> = {}
    ) => {
      let userFriendlyError: UserFriendlyError;

      if (typeof error === 'string') {
        userFriendlyError = {
          title: 'Error',
          message: error,
          severity: 'error',
          icon: '❌',
        };
      } else {
        userFriendlyError = createUserFriendlyError(error, context);

        // Track error for analytics
        if (error instanceof InventoryException) {
          errorTracker.track(error.errorCode, context);
        } else if (
          typeof error === 'string' &&
          Object.values(InventoryError).includes(error as InventoryError)
        ) {
          errorTracker.track(error as InventoryError, context);
        }
      }

      return showNotification({
        ...options,
        title: userFriendlyError.title,
        message: userFriendlyError.message,
        type: userFriendlyError.severity === 'warning' ? 'warning' : 'error',
        duration:
          options.duration ?? (userFriendlyError.autoDismiss ? userFriendlyError.duration : 0),
        icon: options.icon ?? userFriendlyError.icon,
        actions: userFriendlyError.recoveryActions?.map(action => ({
          label: action.label,
          action: action.action,
          style: action.type === 'primary' ? 'primary' : 'secondary',
        })),
      });
    },
    [showNotification]
  );

  // Show warning message
  const showWarning = useCallback(
    (title: string, message: string, options: Partial<NotificationOptions> = {}) => {
      return showNotification({
        ...options,
        title,
        message,
        type: 'warning',
        duration: options.duration ?? 5000,
        icon: options.icon ?? '⚠️',
      });
    },
    [showNotification]
  );

  // Show info message
  const showInfo = useCallback(
    (title: string, message: string, options: Partial<NotificationOptions> = {}) => {
      return showNotification({
        ...options,
        title,
        message,
        type: 'info',
        duration: options.duration ?? 3000,
        icon: options.icon ?? 'ℹ️',
      });
    },
    [showNotification]
  );

  // Start operation progress
  const startOperation = useCallback(
    (id: string, label: string, total?: number) => {
      const operation: OperationProgress = {
        id,
        label,
        progress: 0,
        stage: 'Starting...',
        total,
        completed: 0,
        estimatedTimeRemaining: undefined,
      };

      setOperations(prev => new Map(prev).set(id, operation));

      // Show loading notification
      showNotification({
        id: `operation-${id}`,
        title: label,
        message: 'Starting operation...',
        type: 'loading',
        duration: 0, // Permanent until operation completes
        progress: 0,
      });

      return id;
    },
    [showNotification]
  );

  // Update operation progress
  const updateOperation = useCallback(
    (
      id: string,
      updates: Partial<
        Pick<OperationProgress, 'progress' | 'stage' | 'completed' | 'estimatedTimeRemaining'>
      >
    ) => {
      setOperations(prev => {
        const operation = prev.get(id);
        if (!operation) return prev;

        const updated = { ...operation, ...updates };
        const newMap = new Map(prev);
        newMap.set(id, updated);

        // Update loading notification
        setNotifications(current =>
          current.map(notification =>
            notification.id === `operation-${id}`
              ? {
                  ...notification,
                  message: updated.stage,
                  progress: updated.progress,
                }
              : notification
          )
        );

        return newMap;
      });
    },
    []
  );

  // Complete operation
  const completeOperation = useCallback(
    (id: string, result: { success: boolean; message?: string; data?: any }) => {
      const operation = operations.get(id);
      if (!operation) return;

      // Remove operation
      setOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(id);
        return newMap;
      });

      // Dismiss loading notification
      dismissNotification(`operation-${id}`);

      // Show result notification
      if (result.success) {
        showSuccess(
          `${operation.label} Complete`,
          result.message || 'Operation completed successfully'
        );
      } else {
        showError(result.message || 'Operation failed', { operationType: operation.label });
      }
    },
    [operations, dismissNotification, showSuccess, showError]
  );

  // Batch operations for multiple items
  const showBatchProgress = useCallback(
    (
      label: string,
      items: string[],
      processor: (item: string, index: number) => Promise<{ success: boolean; message?: string }>
    ) => {
      const operationId = `batch-${Date.now()}`;
      const total = items.length;

      startOperation(operationId, label, total);

      const processBatch = async () => {
        const results = { successful: 0, failed: 0, errors: [] as string[] };

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          updateOperation(operationId, {
            progress: (i / total) * 100,
            stage: `Processing ${item}... (${i + 1}/${total})`,
            completed: i,
            estimatedTimeRemaining: total > i + 1 ? (total - i - 1) * 1000 : 0,
          });

          try {
            const result = await processor(item, i);
            if (result.success) {
              results.successful++;
            } else {
              results.failed++;
              if (result.message) {
                results.errors.push(`${item}: ${result.message}`);
              }
            }
          } catch (error) {
            results.failed++;
            results.errors.push(
              `${item}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }

          // Small delay to prevent UI blocking
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        updateOperation(operationId, {
          progress: 100,
          stage: 'Completing...',
          completed: total,
        });

        // Complete with summary
        const successMessage = `Processed ${total} items: ${results.successful} successful, ${results.failed} failed`;
        completeOperation(operationId, {
          success: results.failed === 0,
          message: successMessage,
          data: results,
        });

        // Show detailed errors if any
        if (results.errors.length > 0 && results.errors.length <= 3) {
          results.errors.forEach(errorMsg => {
            showError(errorMsg, { operationType: label });
          });
        } else if (results.errors.length > 3) {
          showError(
            `Multiple errors occurred during ${label}`,
            { operationType: label },
            {
              actions: [
                {
                  label: 'View Details',
                  action: () => console.log('Detailed errors:', results.errors),
                  style: 'secondary',
                },
              ],
            }
          );
        }

        return results;
      };

      return processBatch();
    },
    [startOperation, updateOperation, completeOperation, showError]
  );

  // Quick feedback for common actions
  const showItemAdded = useCallback(
    (itemName: string, quantity: number = 1) => {
      showSuccess(
        'Item Added',
        `${quantity > 1 ? `${quantity}x ` : ''}${itemName} added to inventory`,
        { duration: 2000 }
      );
    },
    [showSuccess]
  );

  const showItemRemoved = useCallback(
    (itemName: string, quantity: number = 1) => {
      showInfo(
        'Item Removed',
        `${quantity > 1 ? `${quantity}x ` : ''}${itemName} removed from inventory`,
        { duration: 2000 }
      );
    },
    [showInfo]
  );

  const showItemUsed = useCallback(
    (itemName: string, effect?: string) => {
      showSuccess('Item Used', effect ? `${itemName} used: ${effect}` : `${itemName} used`, {
        duration: 3000,
      });
    },
    [showSuccess]
  );

  const showInventoryFull = useCallback(() => {
    showWarning('Inventory Full', 'Your inventory is full. Consider selling or dropping items.', {
      actions: [
        {
          label: 'Manage',
          action: () => console.log('Opening inventory management'),
          style: 'primary',
        },
      ],
    });
  }, [showWarning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dismissTimers.current.forEach(timer => clearTimeout(timer));
      dismissTimers.current.clear();
    };
  }, []);

  return {
    // Notifications
    notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications,

    // Typed feedback methods
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Operations progress
    operations: Array.from(operations.values()),
    startOperation,
    updateOperation,
    completeOperation,
    showBatchProgress,

    // Quick actions
    showItemAdded,
    showItemRemoved,
    showItemUsed,
    showInventoryFull,
  };
}
