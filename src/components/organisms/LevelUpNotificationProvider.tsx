import React from 'react';
import { LevelUpNotification } from '../molecules/LevelUpNotification';
import { useLevelUpNotifications } from '../../hooks/useLevelUpNotifications';

interface LevelUpNotificationProviderProps {
  children: React.ReactNode;
  onViewStats?: () => void;
}

export const LevelUpNotificationProvider: React.FC<LevelUpNotificationProviderProps> = ({
  children,
  onViewStats,
}) => {
  const { currentNotification, dismissNotification, hasPendingNotifications } =
    useLevelUpNotifications();

  const handleViewStats = () => {
    if (onViewStats) {
      onViewStats();
    }
    dismissNotification();
  };

  return (
    <>
      {children}

      {/* Level Up Notification Overlay */}
      <LevelUpNotification
        isVisible={!!currentNotification}
        fromLevel={currentNotification?.fromLevel || 1}
        toLevel={currentNotification?.toLevel || 1}
        totalXP={currentNotification?.totalXP || 0}
        onClose={dismissNotification}
        onViewStats={onViewStats ? handleViewStats : undefined}
        autoCloseDelay={hasPendingNotifications ? 3000 : 5000} // Faster auto-close if more notifications are queued
      />
    </>
  );
};

export default LevelUpNotificationProvider;
