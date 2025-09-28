/**
 * Notification Container
 * Manages and displays multiple notification toasts
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { NotificationToast } from '../molecules/NotificationToast';
import { useInventoryFeedback } from '../../hooks/useInventoryFeedback';

interface NotificationContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  maxNotifications?: number;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  position = 'top-right',
  maxNotifications = 5
}) => {
  const { notifications, dismissNotification } = useInventoryFeedback();

  // Limit the number of visible notifications
  const visibleNotifications = notifications
    .filter(n => !n.dismissed)
    .slice(-maxNotifications);

  if (visibleNotifications.length === 0) {
    return null;
  }

  const getContainerStyles = () => {
    const base = {
      position: 'fixed' as const,
      zIndex: 1000,
      pointerEvents: 'none' as const,
      display: 'flex',
      flexDirection: position.includes('top') ? 'column' as const : 'column-reverse' as const,
      gap: '0.5rem'
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
        return {
          ...base,
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          alignItems: 'center'
        };
      default:
        return { ...base, top: '1rem', right: '1rem' };
    }
  };

  return (
    <div style={getContainerStyles()}>
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            style={{ pointerEvents: 'auto' }}
          >
            <NotificationToast
              notification={notification}
              onDismiss={dismissNotification}
              position={position}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};