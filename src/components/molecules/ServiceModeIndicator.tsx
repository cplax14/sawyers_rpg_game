/**
 * Service Mode Indicator
 * Shows current service mode and allows manual restoration attempts
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceMode, useServiceMode } from '../../utils/serviceMode';
import { Button } from '../atoms/Button';
import HelpTooltip from '../atoms/HelpTooltip';

interface ServiceModeIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showWhenHealthy?: boolean;
  compact?: boolean;
  onModeClick?: () => void;
}

export const ServiceModeIndicator: React.FC<ServiceModeIndicatorProps> = ({
  position = 'top-right',
  showWhenHealthy = false,
  compact = false,
  onModeClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const {
    mode,
    config,
    getStatusMessage,
    getPendingSyncStatus,
    attemptRestoration
  } = useServiceMode();

  const getModeColor = (serviceMode: ServiceMode): string => {
    switch (serviceMode) {
      case ServiceMode.CLOUD_ENABLED:
        return '#10b981'; // green
      case ServiceMode.DEGRADED:
        return '#f59e0b'; // amber
      case ServiceMode.LOCAL_ONLY:
        return '#6b7280'; // gray
      case ServiceMode.OFFLINE:
        return '#ef4444'; // red
      default:
        return '#6b7280';
    }
  };

  const getModeIcon = (serviceMode: ServiceMode): string => {
    switch (serviceMode) {
      case ServiceMode.CLOUD_ENABLED:
        return '☁️';
      case ServiceMode.DEGRADED:
        return '⚠️';
      case ServiceMode.LOCAL_ONLY:
        return '💾';
      case ServiceMode.OFFLINE:
        return '📴';
      default:
        return '❓';
    }
  };

  const getModeLabel = (serviceMode: ServiceMode): string => {
    switch (serviceMode) {
      case ServiceMode.CLOUD_ENABLED:
        return 'Cloud Active';
      case ServiceMode.DEGRADED:
        return 'Limited Cloud';
      case ServiceMode.LOCAL_ONLY:
        return 'Local Only';
      case ServiceMode.OFFLINE:
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getPositionStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000
    };

    switch (position) {
      case 'top-left':
        return { ...base, top: '1rem', left: '1rem' };
      case 'top-right':
        return { ...base, top: '1rem', right: '1rem' };
      case 'bottom-left':
        return { ...base, bottom: '1rem', left: '1rem' };
      case 'bottom-right':
        return { ...base, bottom: '1rem', right: '1rem' };
      default:
        return base;
    }
  };

  const handleRestoreAttempt = useCallback(async () => {
    setIsRestoring(true);
    try {
      await attemptRestoration();
    } finally {
      setIsRestoring(false);
    }
  }, [attemptRestoration]);

  const pendingSync = getPendingSyncStatus();
  const shouldShow = showWhenHealthy || mode !== ServiceMode.CLOUD_ENABLED;

  if (!shouldShow) {
    return null;
  }

  return (
    <div style={getPositionStyles()}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
        >
          {compact ? (
            /* Compact Mode - Just Icon */
            <button
              onClick={() => {
                setIsExpanded(!isExpanded);
                onModeClick?.();
              }}
              style={{
                background: 'none',
                border: `2px solid ${getModeColor(mode)}`,
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.2rem',
                backgroundColor: 'rgba(0, 0, 0, 0.8)'
              }}
              title={getStatusMessage()}
            >
              {getModeIcon(mode)}
            </button>
          ) : (
            /* Full Mode */
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: `2px solid ${getModeColor(mode)}`,
                borderRadius: '8px',
                padding: '0.75rem',
                minWidth: '200px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: isExpanded ? '0.75rem' : '0',
                  cursor: 'pointer'
                }}
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{getModeIcon(mode)}</span>
                  <span style={{
                    color: '#f3f4f6',
                    fontSize: '0.875rem',
                    fontWeight: 'semibold'
                  }}>
                    {getModeLabel(mode)}
                  </span>
                  <HelpTooltip
                    content={getStatusMessage()}
                    icon="ℹ️"
                    position="bottom"
                  />
                </div>

                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    padding: '0.25rem'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>

              {/* Pending Sync Badge */}
              {pendingSync.count > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginBottom: isExpanded ? '0.5rem' : '0',
                  fontSize: '0.75rem',
                  color: '#fbbf24'
                }}>
                  <span>⏳</span>
                  <span>{pendingSync.count} pending sync{pendingSync.count > 1 ? 's' : ''}</span>
                </div>
              )}

              {/* Expanded Details */}
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
                      {/* Status Message */}
                      <p style={{
                        margin: '0 0 0.75rem 0',
                        color: '#d1d5db',
                        fontSize: '0.8rem',
                        lineHeight: '1.4'
                      }}>
                        {getStatusMessage()}
                      </p>

                      {/* Last Updated */}
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#9ca3af',
                        marginBottom: '0.75rem'
                      }}>
                        Updated: {config.timestamp.toLocaleTimeString()}
                      </div>

                      {/* Pending Sync Details */}
                      {pendingSync.count > 0 && (
                        <div style={{
                          backgroundColor: '#7c2d12',
                          border: '1px solid #ea580c',
                          borderRadius: '4px',
                          padding: '0.5rem',
                          marginBottom: '0.75rem'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#fed7aa',
                            marginBottom: '0.25rem'
                          }}>
                            Pending Syncs: {pendingSync.count}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: '#fdba74'
                          }}>
                            Operations: {pendingSync.operations.join(', ')}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {mode !== ServiceMode.CLOUD_ENABLED && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleRestoreAttempt}
                            disabled={isRestoring || mode === ServiceMode.OFFLINE}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.375rem 0.75rem'
                            }}
                          >
                            {isRestoring ? 'Restoring...' : 'Retry Cloud'}
                          </Button>
                        )}

                        {onModeClick && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={onModeClick}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.375rem 0.75rem'
                            }}
                          >
                            Details
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ServiceModeIndicator;