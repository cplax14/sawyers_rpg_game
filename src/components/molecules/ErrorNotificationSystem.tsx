/**
 * Error Notification System
 * Provides user-friendly error notifications with recovery actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudError, createUserErrorMessage, getRecoveryActions } from '../../utils/cloudErrors';
import { useErrorRecovery } from '../../utils/errorRecovery';
import {
  getContextualErrorMessage,
  getPriorityRecoveryActions,
  getEstimatedResolutionTime
} from '../../utils/userFriendlyErrors';
import TroubleshootingHelpDialog from '../organisms/TroubleshootingHelpDialog';
import { Button } from '../atoms/Button';

export interface ErrorNotification {
  id: string;
  error: CloudError;
  timestamp: Date;
  dismissed: boolean;
  retryCount: number;
  maxRetries: number;
}

interface ErrorNotificationSystemProps {
  maxNotifications?: number;
  autoHideAfter?: number; // ms
  onRetry?: (error: CloudError) => Promise<void>;
  onDismiss?: (notification: ErrorNotification) => void;
  onContactSupport?: () => void;
  context?: {
    isFirstTime?: boolean;
    hasLocalSaves?: boolean;
    isOnMobile?: boolean;
    operationType?: 'save' | 'load' | 'sync' | 'delete';
  };
}

export const ErrorNotificationSystem: React.FC<ErrorNotificationSystemProps> = ({
  maxNotifications = 5,
  autoHideAfter = 10000,
  onRetry,
  onDismiss,
  onContactSupport,
  context
}) => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());
  const [helpDialogError, setHelpDialogError] = useState<CloudError | null>(null);

  const {
    isRecoverable,
    getRecoverySuggestions,
    executeWithRecovery,
    getSystemStatus
  } = useErrorRecovery((message, type) => {
    // Handle notifications from error recovery service
    addSystemNotification(message, type);
  });

  // Add system notifications (not errors)
  const addSystemNotification = useCallback((message: string, type: 'error' | 'warning' | 'info') => {
    // For system notifications, we'll use a different approach
    // This could be integrated with a toast notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
  }, []);

  // Add error notification
  const addErrorNotification = useCallback((error: CloudError) => {
    const id = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const notification: ErrorNotification = {
      id,
      error,
      timestamp: new Date(),
      dismissed: false,
      retryCount: 0,
      maxRetries: error.retryable ? 3 : 0
    };

    setNotifications(prev => {
      const filtered = prev.filter(n => !n.dismissed);
      const newNotifications = [notification, ...filtered].slice(0, maxNotifications);
      return newNotifications;
    });

    // Auto-hide after specified time for non-critical errors
    if (error.severity !== 'critical' && autoHideAfter > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, autoHideAfter);
    }
  }, [maxNotifications, autoHideAfter]);

  // Dismiss notification
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    );

    // Remove from expanded set
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });

    // Clean up dismissed notifications after animation
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  }, []);

  // Toggle notification expansion
  const toggleExpanded = useCallback((id: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Retry operation
  const retryOperation = useCallback(async (notification: ErrorNotification) => {
    if (!onRetry || notification.retryCount >= notification.maxRetries) {
      return;
    }

    try {
      // Update retry count
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id
            ? { ...n, retryCount: n.retryCount + 1 }
            : n
        )
      );

      await onRetry(notification.error);

      // If retry succeeds, dismiss the notification
      dismissNotification(notification.id);
    } catch (error) {
      // Retry failed, but we've already incremented the count
      console.error('Retry operation failed:', error);
    }
  }, [onRetry, dismissNotification]);

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return '#dc2626'; // red-600
      case 'high': return '#ea580c'; // orange-600
      case 'medium': return '#d97706'; // amber-600
      case 'low': return '#65a30d'; // lime-600
      default: return '#6b7280'; // gray-500
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return 'ℹ️';
    }
  };

  // Expose addErrorNotification to parent components
  useEffect(() => {
    // This could be done through a context or ref
    (window as any).__addErrorNotification = addErrorNotification;

    return () => {
      delete (window as any).__addErrorNotification;
    };
  }, [addErrorNotification]);

  const visibleNotifications = notifications.filter(n => !n.dismissed);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      zIndex: 9999,
      width: '400px',
      maxWidth: '90vw',
      pointerEvents: 'none'
    }}>
      <AnimatePresence>
        {visibleNotifications.map((notification) => {
          const isExpanded = expandedNotifications.has(notification.id);
          const recoveryActions = getRecoveryActions(notification.error);
          const canRetry = notification.retryCount < notification.maxRetries && isRecoverable(notification.error);

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 400, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 400, scale: 0.9 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                marginBottom: '0.5rem',
                pointerEvents: 'auto'
              }}
            >
              <div style={{
                backgroundColor: '#1f2937', // gray-800
                border: `2px solid ${getSeverityColor(notification.error.severity)}`,
                borderRadius: '8px',
                padding: '1rem',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                color: '#f9fafb' // gray-50
              }}>
                {/* Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {getSeverityIcon(notification.error.severity)}
                    </span>
                    <span style={{
                      fontWeight: 'bold',
                      color: getSeverityColor(notification.error.severity)
                    }}>
                      {notification.error.severity.toUpperCase()} ERROR
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {recoveryActions.length > 0 && (
                      <button
                        onClick={() => toggleExpanded(notification.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                          fontSize: '0.875rem'
                        }}
                        title="Show recovery actions"
                      >
                        {isExpanded ? '▼' : '▶'}
                      </button>
                    )}

                    <button
                      onClick={() => dismissNotification(notification.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#9ca3af',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        borderRadius: '4px',
                        fontSize: '1rem'
                      }}
                      title="Dismiss"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                <p style={{
                  margin: '0 0 0.5rem 0',
                  fontSize: '0.875rem',
                  lineHeight: '1.4'
                }}>
                  {getContextualErrorMessage(notification.error, context)}
                </p>

                {/* Estimated Resolution Time */}
                <div style={{
                  fontSize: '0.75rem',
                  color: '#93c5fd',
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <span>⏱️</span>
                  <span>Expected fix time: {getEstimatedResolutionTime(notification.error)}</span>
                </div>

                {/* Error Code and Time */}
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  marginBottom: isExpanded ? '0.75rem' : '0'
                }}>
                  <span>Code: {notification.error.code}</span>
                  <span style={{ margin: '0 0.5rem' }}>•</span>
                  <span>{notification.timestamp.toLocaleTimeString()}</span>
                  {notification.retryCount > 0 && (
                    <>
                      <span style={{ margin: '0 0.5rem' }}>•</span>
                      <span>Retries: {notification.retryCount}/{notification.maxRetries}</span>
                    </>
                  )}
                </div>

                {/* Recovery Actions (Expanded) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        borderTop: '1px solid #374151',
                        paddingTop: '0.75rem'
                      }}>
                        <h4 style={{
                          margin: '0 0 0.5rem 0',
                          fontSize: '0.875rem',
                          fontWeight: 'bold',
                          color: '#f3f4f6'
                        }}>
                          Recovery Actions:
                        </h4>

                        <ul style={{
                          margin: '0 0 0.75rem 0',
                          paddingLeft: '1rem',
                          fontSize: '0.8rem',
                          lineHeight: '1.4'
                        }}>
                          {getPriorityRecoveryActions(notification.error, 4).map((action, index) => (
                            <li key={index} style={{ marginBottom: '0.25rem' }}>
                              {action}
                            </li>
                          ))}
                        </ul>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {canRetry && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => retryOperation(notification)}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.375rem 0.75rem'
                              }}
                            >
                              Retry ({notification.maxRetries - notification.retryCount} left)
                            </Button>
                          )}

                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setHelpDialogError(notification.error)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.375rem 0.75rem'
                            }}
                          >
                            Get Help
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => dismissNotification(notification.id)}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.375rem 0.75rem'
                            }}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Troubleshooting Help Dialog */}
      <TroubleshootingHelpDialog
        isOpen={!!helpDialogError}
        onClose={() => setHelpDialogError(null)}
        error={helpDialogError || undefined}
        context={context}
        onContactSupport={onContactSupport}
        onRetryOperation={helpDialogError ? async () => {
          if (onRetry) {
            await onRetry(helpDialogError);
          }
          setHelpDialogError(null);
        } : undefined}
      />
    </div>
  );
};

/**
 * Hook for adding error notifications from components
 */
export const useErrorNotification = () => {
  const addError = useCallback((error: CloudError) => {
    const addFn = (window as any).__addErrorNotification;
    if (addFn) {
      addFn(error);
    } else {
      console.error('Error notification system not initialized');
    }
  }, []);

  return { addError };
};

export default ErrorNotificationSystem;