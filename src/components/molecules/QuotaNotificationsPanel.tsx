/**
 * Quota Notifications Panel Component
 * Displays and manages quota-related notifications
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuotaMonitor } from '../../hooks/useQuotaMonitor';
import { QuotaNotification } from '../../services/quotaMonitor';
import { User } from 'firebase/auth';
import { CloudStorageService } from '../../services/cloudStorage';
import { Button } from '../atoms';

interface QuotaNotificationsPanelProps {
  /** Current user */
  user: User | null;
  /** Cloud storage service instance */
  cloudStorage: CloudStorageService | null;
  /** Whether to show only unread notifications */
  showUnreadOnly?: boolean;
  /** Maximum number of notifications to display */
  maxNotifications?: number;
  /** Compact display mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when notification action is triggered */
  onNotificationAction?: (action: string, notificationId: string, data?: any) => void;
}

export const QuotaNotificationsPanel: React.FC<QuotaNotificationsPanelProps> = ({
  user,
  cloudStorage,
  showUnreadOnly = false,
  maxNotifications = 10,
  compact = false,
  className = '',
  onNotificationAction
}) => {
  const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set());

  const {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications
  } = useQuotaMonitor(user, cloudStorage, {
    autoStart: true
  });

  const displayedNotifications = showUnreadOnly
    ? notifications.filter(n => !n.isRead)
    : notifications.slice(0, maxNotifications);

  const toggleExpanded = useCallback((notificationId: string) => {
    setExpandedNotifications(prev => {
      const newSet = new Set(prev);
      if (newSet.has(notificationId)) {
        newSet.delete(notificationId);
      } else {
        newSet.add(notificationId);
      }
      return newSet;
    });

    // Mark as read when expanded
    markNotificationRead(notificationId);
  }, [markNotificationRead]);

  const handleNotificationAction = useCallback((
    action: string,
    notificationId: string,
    data?: any
  ) => {
    // Mark as read when action is taken
    markNotificationRead(notificationId);

    // Handle built-in actions
    if (action === 'dismiss') {
      // Just mark as read, already handled above
      return;
    }

    // Call external handler
    onNotificationAction?.(action, notificationId, data);
  }, [markNotificationRead, onNotificationAction]);

  const getNotificationIcon = (type: QuotaNotification['type']): string => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'critical':
        return '🚨';
      case 'exceeded':
        return '🔴';
      case 'cleanup':
        return '🧹';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: QuotaNotification['type']): string => {
    switch (type) {
      case 'critical':
      case 'exceeded':
        return '#ff6b6b';
      case 'warning':
        return '#ffa502';
      case 'cleanup':
        return '#3742fa';
      case 'info':
      default:
        return '#2ed573';
    }
  };

  if (displayedNotifications.length === 0) {
    return (
      <div className={`quota-notifications-panel empty ${className}`}>
        <div style={{
          padding: compact ? '12px' : '16px',
          background: 'rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          color: '#999999',
          fontSize: compact ? '0.8rem' : '0.9rem',
          textAlign: 'center'
        }}>
          {showUnreadOnly ? 'No unread notifications' : 'No quota notifications'}
        </div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #2a2a3e, #1e1e2f)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    maxWidth: compact ? '350px' : '450px',
    maxHeight: compact ? '300px' : '400px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  };

  const headerStyle: React.CSSProperties = {
    padding: compact ? '12px' : '16px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(0, 0, 0, 0.2)'
  };

  const titleStyle: React.CSSProperties = {
    color: '#d4af37',
    fontSize: compact ? '0.9rem' : '1rem',
    fontWeight: 'bold',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  return (
    <motion.div
      style={containerStyle}
      className={`quota-notifications-panel ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div style={headerStyle}>
        <h4 style={titleStyle}>
          🔔 Storage Notifications
          {unreadCount > 0 && (
            <span style={{
              background: '#ff6b6b',
              color: '#ffffff',
              fontSize: '0.7rem',
              padding: '2px 6px',
              borderRadius: '10px',
              minWidth: '18px',
              textAlign: 'center'
            }}>
              {unreadCount}
            </span>
          )}
        </h4>

        {/* Header Actions */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllNotificationsRead}
              title="Mark all as read"
              style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            >
              ✓
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearNotifications}
            title="Clear all notifications"
            style={{ fontSize: '0.8rem', padding: '4px 8px' }}
          >
            🗑️
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: compact ? '8px' : '12px'
      }}>
        <AnimatePresence>
          {displayedNotifications.map((notification, index) => {
            const isExpanded = expandedNotifications.has(notification.id);
            const notificationColor = getNotificationColor(notification.type);

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                style={{
                  marginBottom: '8px',
                  background: notification.isRead
                    ? 'rgba(0, 0, 0, 0.3)'
                    : 'rgba(255, 255, 255, 0.05)',
                  borderLeft: `4px solid ${notificationColor}`,
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}
              >
                {/* Notification Header */}
                <div
                  style={{
                    padding: compact ? '8px 10px' : '10px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}
                  onClick={() => toggleExpanded(notification.id)}
                >
                  <div style={{ fontSize: compact ? '0.9rem' : '1rem', flexShrink: 0 }}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '2px'
                    }}>
                      <h5 style={{
                        color: notification.isRead ? '#cccccc' : '#ffffff',
                        fontSize: compact ? '0.8rem' : '0.85rem',
                        fontWeight: 'bold',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notification.title}
                      </h5>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {!notification.isRead && (
                          <div style={{
                            width: '6px',
                            height: '6px',
                            background: notificationColor,
                            borderRadius: '50%',
                            flexShrink: 0
                          }} />
                        )}
                        <div style={{
                          fontSize: '0.7rem',
                          color: '#999999',
                          flexShrink: 0
                        }}>
                          {notification.timestamp.toLocaleTimeString()}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#999999',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}>
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Preview message when collapsed */}
                    {!isExpanded && (
                      <div style={{
                        fontSize: compact ? '0.7rem' : '0.75rem',
                        color: notification.isRead ? '#999999' : '#cccccc',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {notification.message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        paddingLeft: compact ? '26px' : '32px',
                        paddingRight: compact ? '10px' : '12px',
                        paddingBottom: compact ? '8px' : '10px'
                      }}
                    >
                      {/* Full Message */}
                      <div style={{
                        fontSize: compact ? '0.75rem' : '0.8rem',
                        color: '#cccccc',
                        lineHeight: '1.4',
                        marginBottom: notification.actions ? '8px' : '0'
                      }}>
                        {notification.message}
                      </div>

                      {/* Action Buttons */}
                      {notification.actions && notification.actions.length > 0 && (
                        <div style={{
                          display: 'flex',
                          gap: '6px',
                          flexWrap: 'wrap'
                        }}>
                          {notification.actions.map((actionDef, actionIndex) => (
                            <Button
                              key={actionIndex}
                              variant={actionDef.action === 'cleanup' ? 'primary' :
                                     actionDef.action === 'dismiss' ? 'ghost' : 'secondary'}
                              size="sm"
                              onClick={() => handleNotificationAction(
                                actionDef.action,
                                notification.id,
                                actionDef.data
                              )}
                              style={{
                                fontSize: '0.75rem',
                                padding: '4px 8px'
                              }}
                            >
                              {actionDef.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

QuotaNotificationsPanel.displayName = 'QuotaNotificationsPanel';

export default QuotaNotificationsPanel;