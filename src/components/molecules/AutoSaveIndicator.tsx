/**
 * Auto-Save Status Indicator Component
 * Shows auto-save status, progress, and next save time
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoSave, useResponsive, useReducedMotion } from '../../hooks';
import { useReactGame } from '../../contexts/ReactGameContext';

interface AutoSaveIndicatorProps {
  /** Position of the indicator */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Whether to show detailed status */
  showDetails?: boolean;
  /** Custom className */
  className?: string;
  /** Whether to show as overlay (fixed position) */
  overlay?: boolean;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  position = 'top-right',
  showDetails = false,
  className = '',
  overlay = true
}) => {
  const { state } = useReactGame();
  const {
    autoSaveState,
    isAutoSaveActive,
    lastAutoSave,
    getAutoSaveStatus,
    formatTimeUntilNext,
    getTimeUntilNextAutoSave,
    pauseReason
  } = useAutoSave();

  const { isMobile } = useResponsive();
  const { animationConfig } = useReducedMotion();

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time for countdown
  useEffect(() => {
    if (!isAutoSaveActive) return;

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isAutoSaveActive]);

  // Show notification when auto-save completes
  useEffect(() => {
    if (lastAutoSave && state.settings.autoSaveShowNotifications) {
      setNotificationMessage('Game auto-saved');
      setShowNotification(true);

      const timeout = setTimeout(() => {
        setShowNotification(false);
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [lastAutoSave, state.settings.autoSaveShowNotifications]);

  // Don't render if auto-save is disabled or no player
  if (!state.settings.autoSave || !state.player) {
    return null;
  }

  const getStatusIcon = () => {
    if (!isAutoSaveActive) return '⏸️';
    if (autoSaveState.isPaused) return '⏸️';
    if (autoSaveState.consecutiveFailures > 0) return '⚠️';
    if (getTimeUntilNextAutoSave() < 10000) return '💾'; // Saving soon
    return '🔄';
  };

  const getStatusColor = () => {
    if (!isAutoSaveActive) return '#666666';
    if (autoSaveState.isPaused) return '#ffa500';
    if (autoSaveState.consecutiveFailures > 0) return '#ff6b6b';
    if (getTimeUntilNextAutoSave() < 10000) return '#4ecdc4';
    return '#51cf66';
  };

  const positionStyles: React.CSSProperties = {
    position: overlay ? 'fixed' : 'absolute',
    zIndex: 1000,
    ...(position === 'top-left' && { top: '16px', left: '16px' }),
    ...(position === 'top-right' && { top: '16px', right: '16px' }),
    ...(position === 'bottom-left' && { bottom: '16px', left: '16px' }),
    ...(position === 'bottom-right' && { bottom: '16px', right: '16px' }),
  };

  const containerStyle: React.CSSProperties = {
    ...positionStyles,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: isMobile ? '8px 12px' : '6px 10px',
    background: 'rgba(0, 0, 0, 0.8)',
    borderRadius: '8px',
    border: `1px solid ${getStatusColor()}`,
    fontSize: isMobile ? '0.75rem' : '0.7rem',
    color: '#ffffff',
    backdropFilter: 'blur(4px)',
    maxWidth: isMobile ? '200px' : '250px',
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
  };

  const notificationStyle: React.CSSProperties = {
    ...positionStyles,
    padding: '10px 16px',
    background: 'rgba(78, 205, 196, 0.95)',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '500',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(78, 205, 196, 0.3)',
  };

  return (
    <>
      {/* Main Status Indicator */}
      <motion.div
        style={containerStyle}
        className={className}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={animationConfig}
      >
        <span style={iconStyle}>{getStatusIcon()}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: getStatusColor(),
            fontWeight: '500',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {getAutoSaveStatus()}
          </div>

          {showDetails && isAutoSaveActive && !autoSaveState.isPaused && (
            <div style={{
              fontSize: '0.65rem',
              color: '#cccccc',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Next: {formatTimeUntilNext()}
            </div>
          )}

          {autoSaveState.consecutiveFailures > 0 && (
            <div style={{
              fontSize: '0.65rem',
              color: '#ff9999',
              marginTop: '2px'
            }}>
              {autoSaveState.consecutiveFailures} failure{autoSaveState.consecutiveFailures > 1 ? 's' : ''}
            </div>
          )}

          {pauseReason && autoSaveState.isPaused && showDetails && (
            <div style={{
              fontSize: '0.65rem',
              color: '#ffa500',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {pauseReason.source === 'story' && '📖'}
              {pauseReason.source === 'combat' && '⚔️'}
              {pauseReason.source === 'system' && '⚙️'}
              {pauseReason.source === 'user' && '👤'}
              {pauseReason.reason}
            </div>
          )}

          {lastAutoSave && showDetails && (
            <div style={{
              fontSize: '0.6rem',
              color: '#999999',
              marginTop: '2px'
            }}>
              Last: {lastAutoSave.toLocaleTimeString()}
            </div>
          )}
        </div>
      </motion.div>

      {/* Auto-Save Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            style={{
              ...notificationStyle,
              ...(position.includes('top') && { top: '60px' }),
              ...(position.includes('bottom') && { bottom: '60px' }),
            }}
            initial={{ opacity: 0, y: position.includes('top') ? -20 : 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: position.includes('top') ? -20 : 20, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>✅</span>
              <span>{notificationMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

AutoSaveIndicator.displayName = 'AutoSaveIndicator';

export default memo(AutoSaveIndicator);