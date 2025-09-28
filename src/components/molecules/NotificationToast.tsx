/**
 * Notification Toast Component
 * Displays user feedback messages with actions and progress indicators
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedbackNotification, NotificationAction } from '../../hooks/useInventoryFeedback';

interface NotificationToastProps {
  notification: FeedbackNotification;
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  position = 'top-right'
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(notification.progress || 0);

  // Handle auto-dismiss
  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  // Update progress for loading notifications
  useEffect(() => {
    if (notification.type === 'loading' && typeof notification.progress === 'number') {
      setProgress(notification.progress);
    }
  }, [notification.progress, notification.type]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 200);
  };

  const handleActionClick = async (action: NotificationAction) => {
    try {
      await action.action();
      if (!notification.persistent) {
        handleDismiss();
      }
    } catch (error) {
      console.error('Notification action failed:', error);
    }
  };

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          border: '1px solid #065f46',
          color: '#ffffff',
          shadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          border: '1px solid #991b1b',
          color: '#ffffff',
          shadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          border: '1px solid #92400e',
          color: '#ffffff',
          shadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
        };
      case 'info':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: '1px solid #1d4ed8',
          color: '#ffffff',
          shadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
        };
      case 'loading':
        return {
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          border: '1px solid #3730a3',
          color: '#ffffff',
          shadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
        };
      default:
        return {
          background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
          border: '1px solid #111827',
          color: '#ffffff',
          shadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        };
    }
  };

  const getPositionStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 1000,
      maxWidth: '400px',
      minWidth: '300px'
    };

    switch (position) {
      case 'top-right':
        return { ...base, top: '1rem', right: '1rem' };
      case 'top-left':
        return { ...base, top: '1rem', left: '1rem' };
      case 'bottom-right':
        return { ...base, bottom: '1rem', right: '1rem' };
      case 'bottom-left':
        return { ...base, bottom: '1rem', left: '1rem' };
      case 'top-center':
        return { ...base, top: '1rem', left: '50%', transform: 'translateX(-50%)' };
      default:
        return { ...base, top: '1rem', right: '1rem' };
    }
  };

  const typeStyles = getTypeStyles();
  const positionStyles = getPositionStyles();

  const toastVariants = {
    initial: {
      opacity: 0,
      y: position.includes('top') ? -50 : 50,
      x: position.includes('right') ? 50 : position.includes('left') ? -50 : 0,
      scale: 0.9
    },
    animate: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300
      }
    },
    exit: {
      opacity: 0,
      y: position.includes('top') ? -20 : 20,
      x: position.includes('right') ? 20 : position.includes('left') ? -20 : 0,
      scale: 0.95,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={toastVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            ...positionStyles,
            ...typeStyles,
            borderRadius: '12px',
            padding: '1rem',
            boxShadow: typeStyles.shadow,
            backdropFilter: 'blur(10px)',
            overflow: 'hidden'
          }}
        >
          {/* Progress bar for loading notifications */}
          {notification.type === 'loading' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              overflow: 'hidden'
            }}>
              <motion.div
                style={{
                  height: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  borderRadius: '0 3px 3px 0'
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            {/* Icon */}
            {notification.icon && (
              <div style={{
                fontSize: '1.25rem',
                flexShrink: 0,
                marginTop: '0.125rem'
              }}>
                {notification.icon}
              </div>
            )}

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Title */}
              <div style={{
                fontSize: '0.875rem',
                fontWeight: 'bold',
                marginBottom: '0.25rem',
                color: 'inherit'
              }}>
                {notification.title}
              </div>

              {/* Message */}
              <div style={{
                fontSize: '0.8rem',
                opacity: 0.9,
                lineHeight: 1.4,
                color: 'inherit'
              }}>
                {notification.message}
              </div>

              {/* Progress text for loading */}
              {notification.type === 'loading' && progress !== undefined && (
                <div style={{
                  fontSize: '0.75rem',
                  opacity: 0.8,
                  marginTop: '0.25rem',
                  color: 'inherit'
                }}>
                  {Math.round(progress)}% complete
                </div>
              )}

              {/* Actions */}
              {notification.actions && notification.actions.length > 0 && (
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginTop: '0.75rem'
                }}>
                  {notification.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleActionClick(action)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 'medium',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        backgroundColor: action.style === 'primary'
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(255, 255, 255, 0.1)',
                        color: 'inherit',
                        ...(action.style === 'danger' && {
                          backgroundColor: 'rgba(239, 68, 68, 0.8)',
                          color: '#ffffff'
                        })
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = action.style === 'primary'
                          ? 'rgba(255, 255, 255, 0.3)'
                          : 'rgba(255, 255, 255, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = action.style === 'primary'
                          ? 'rgba(255, 255, 255, 0.2)'
                          : 'rgba(255, 255, 255, 0.1)';
                      }}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dismiss button */}
            {!notification.persistent && (
              <button
                onClick={handleDismiss}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  fontSize: '1rem',
                  opacity: 0.7,
                  flexShrink: 0,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
              >
                ×
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};