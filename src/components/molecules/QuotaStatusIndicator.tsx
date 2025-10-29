/**
 * Quota Status Indicator Component
 * Shows storage usage, quota status, and provides management actions
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuotaMonitor } from '../../hooks/useQuotaMonitor';
import { User } from 'firebase/auth';
import { CloudStorageService } from '../../services/cloudStorage';
import { Button } from '../atoms';

interface QuotaStatusIndicatorProps {
  /** Current user */
  user: User | null;
  /** Cloud storage service instance */
  cloudStorage: CloudStorageService | null;
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Whether to show management actions */
  showActions?: boolean;
  /** Compact display mode */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when manage action is clicked */
  onManageClick?: () => void;
  /** Callback when cleanup action is clicked */
  onCleanupClick?: () => void;
}

export const QuotaStatusIndicator: React.FC<QuotaStatusIndicatorProps> = ({
  user,
  cloudStorage,
  showDetails = true,
  showActions = true,
  compact = false,
  className = '',
  onManageClick,
  onCleanupClick,
}) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const {
    quotaStatus,
    isMonitoring,
    formatBytes,
    getUsageColor,
    getUsageIcon,
    getSuggestions,
    checkQuota,
  } = useQuotaMonitor(user, cloudStorage, {
    autoStart: true,
    enableDebugLogging: true,
  });

  const handleRefresh = async () => {
    await checkQuota();
  };

  if (!quotaStatus && !isMonitoring) {
    return (
      <div className={`quota-status-indicator unavailable ${className}`}>
        <div
          style={{
            padding: compact ? '8px' : '12px',
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            color: '#999999',
            fontSize: compact ? '0.8rem' : '0.9rem',
            textAlign: 'center',
          }}
        >
          Storage monitoring unavailable
        </div>
      </div>
    );
  }

  if (!quotaStatus) {
    return (
      <div className={`quota-status-indicator loading ${className}`}>
        <div
          style={{
            padding: compact ? '8px' : '12px',
            background: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            color: '#cccccc',
            fontSize: compact ? '0.8rem' : '0.9rem',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <div>⏳</div>
          <div>Checking storage usage...</div>
        </div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    padding: compact ? '8px' : '16px',
    background: 'linear-gradient(135deg, #2a2a3e, #1e1e2f)',
    borderRadius: '12px',
    border: `2px solid ${getUsageColor()}`,
    color: '#ffffff',
    maxWidth: compact ? '300px' : '400px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: showDetails || showActions ? (compact ? '8px' : '12px') : '0',
  };

  const titleStyle: React.CSSProperties = {
    color: '#d4af37',
    fontSize: compact ? '0.9rem' : '1rem',
    fontWeight: 'bold',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const usageBarStyle: React.CSSProperties = {
    width: '100%',
    height: compact ? '4px' : '6px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: compact ? '6px' : '8px',
  };

  const usageFillStyle: React.CSSProperties = {
    height: '100%',
    background: `linear-gradient(90deg, ${getUsageColor()}, ${getUsageColor()}aa)`,
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  };

  const suggestions = getSuggestions();

  return (
    <motion.div
      style={containerStyle}
      className={`quota-status-indicator ${quotaStatus.status} ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div style={headerStyle}>
        <h4 style={titleStyle}>{getUsageIcon()} Storage Usage</h4>
        {!compact && (
          <Button variant='ghost' size='sm' onClick={handleRefresh} title='Refresh storage usage'>
            🔄
          </Button>
        )}
      </div>

      {/* Usage Bar */}
      <div style={usageBarStyle}>
        <motion.div
          style={usageFillStyle}
          animate={{ width: `${Math.min(100, quotaStatus.usagePercentage)}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Usage Info */}
      <div
        style={{
          fontSize: compact ? '0.75rem' : '0.85rem',
          color: '#cccccc',
          marginBottom: showDetails ? (compact ? '6px' : '8px') : '0',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '4px',
          }}
        >
          <span>{formatBytes(quotaStatus.usedBytes)} used</span>
          <span>{quotaStatus.usagePercentage}%</span>
        </div>
        <div
          style={{
            fontSize: compact ? '0.7rem' : '0.8rem',
            color: '#999999',
          }}
        >
          {formatBytes(quotaStatus.availableBytes)} of {formatBytes(quotaStatus.maxBytes)} available
        </div>
      </div>

      {/* Status Message */}
      {!compact && (
        <div
          style={{
            fontSize: '0.8rem',
            color: getUsageColor(),
            marginBottom: showDetails ? '12px' : '8px',
            fontWeight: quotaStatus.status !== 'normal' ? 'bold' : 'normal',
          }}
        >
          {quotaStatus.message}
        </div>
      )}

      {/* Detailed Information */}
      {showDetails && !compact && (
        <div>
          {/* Save Breakdown Toggle */}
          {quotaStatus.totalSaves > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => setShowBreakdown(!showBreakdown)}
                style={{ fontSize: '0.8rem' }}
              >
                {showBreakdown ? '▲' : '▼'} {quotaStatus.totalSaves} saves
              </Button>
            </div>
          )}

          {/* Save Breakdown */}
          <AnimatePresence>
            {showBreakdown && quotaStatus.saveBreakdown.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  marginBottom: '12px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '6px',
                  padding: '8px',
                  maxHeight: '150px',
                  overflowY: 'auto',
                }}
              >
                {quotaStatus.saveBreakdown
                  .sort((a, b) => b.sizeBytes - a.sizeBytes)
                  .map((save, index) => (
                    <div
                      key={save.slotNumber}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 0',
                        borderBottom:
                          index < quotaStatus.saveBreakdown.length - 1
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : 'none',
                        fontSize: '0.75rem',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            color: '#ffffff',
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Slot {save.slotNumber}: {save.saveName}
                        </div>
                        <div style={{ color: '#999999' }}>
                          {save.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      <div
                        style={{
                          color: '#cccccc',
                          fontWeight: 'bold',
                          marginLeft: '8px',
                        }}
                      >
                        {formatBytes(save.sizeBytes)}
                      </div>
                    </div>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div
              style={{
                marginBottom: '12px',
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '6px',
                padding: '8px',
              }}
            >
              <div
                style={{
                  color: '#ffd43b',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  marginBottom: '4px',
                }}
              >
                💡 Suggestions:
              </div>
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  style={{
                    color: '#ffd43b',
                    fontSize: '0.75rem',
                    marginBottom: index < suggestions.length - 1 ? '2px' : '0',
                  }}
                >
                  • {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {showActions &&
        (quotaStatus.status === 'warning' ||
          quotaStatus.status === 'critical' ||
          quotaStatus.status === 'exceeded') && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '8px',
            }}
          >
            {quotaStatus.status === 'exceeded' || quotaStatus.status === 'critical' ? (
              <>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={onCleanupClick}
                  style={{
                    background: 'linear-gradient(45deg, #ff6b6b, #ee5a52)',
                    flex: 1,
                  }}
                >
                  Clean Up Now
                </Button>
                <Button variant='secondary' size='sm' onClick={onManageClick}>
                  Manage
                </Button>
              </>
            ) : (
              <Button variant='secondary' size='sm' onClick={onManageClick} style={{ flex: 1 }}>
                Manage Saves
              </Button>
            )}
          </div>
        )}

      {/* Last Updated */}
      {!compact && (
        <div
          style={{
            fontSize: '0.7rem',
            color: '#777777',
            textAlign: 'right',
            marginTop: '8px',
          }}
        >
          Updated: {quotaStatus.lastChecked.toLocaleTimeString()}
        </div>
      )}
    </motion.div>
  );
};

QuotaStatusIndicator.displayName = 'QuotaStatusIndicator';

export default QuotaStatusIndicator;
