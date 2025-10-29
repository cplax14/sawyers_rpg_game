/**
 * Network Status Indicator Component
 * Shows current network connectivity status and quality
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNetworkStatus, useCloudOperationStatus } from '../../hooks/useNetworkStatus';
import { Button } from '../atoms';

interface NetworkStatusIndicatorProps {
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Whether to show as a compact indicator */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Whether to allow manual connectivity checks */
  allowManualCheck?: boolean;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  showDetails = false,
  compact = false,
  className = '',
  allowManualCheck = true,
}) => {
  const { status, isOnline, connectionQuality, checkConnectivity, statistics } = useNetworkStatus();
  const { isSuitable, reason } = useCloudOperationStatus();
  const [isChecking, setIsChecking] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);

  const handleManualCheck = async () => {
    if (!allowManualCheck) return;

    setIsChecking(true);
    try {
      await checkConnectivity();
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return '#ff6b6b';
    if (!isSuitable) return '#ffa726';
    if (connectionQuality === 'excellent') return '#51cf66';
    if (connectionQuality === 'good') return '#69db7c';
    if (connectionQuality === 'fair') return '#ffd43b';
    return '#ff8787';
  };

  const getStatusIcon = () => {
    if (isChecking) return '🔄';
    if (!isOnline) return '📡';
    if (!isSuitable) return '⚠️';
    if (connectionQuality === 'excellent') return '📶';
    if (connectionQuality === 'good') return '📶';
    if (connectionQuality === 'fair') return '📶';
    return '📶';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (!isSuitable) return reason || 'Limited';
    return connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: compact ? '6px' : '8px',
    padding: compact ? '4px 8px' : '8px 12px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '6px',
    border: `1px solid ${getStatusColor()}`,
    fontSize: compact ? '0.8rem' : '0.9rem',
    position: 'relative',
  };

  const statusIndicatorStyle: React.CSSProperties = {
    width: compact ? '8px' : '10px',
    height: compact ? '8px' : '10px',
    borderRadius: '50%',
    backgroundColor: getStatusColor(),
    animation: isChecking ? 'pulse 1s infinite' : undefined,
  };

  const detailsPanelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    padding: '12px',
    background: 'linear-gradient(135deg, #2a2a3e, #1e1e2f)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '6px',
    fontSize: '0.8rem',
    zIndex: 1000,
    minWidth: '280px',
  };

  if (compact) {
    return (
      <motion.div
        style={containerStyle}
        className={className}
        onClick={showDetails ? () => setShowDetailsPanel(!showDetailsPanel) : undefined}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        <div style={statusIndicatorStyle} />
        <span style={{ color: '#ffffff' }}>
          {getStatusIcon()} {getStatusText()}
        </span>

        <AnimatePresence>
          {showDetailsPanel && (
            <motion.div
              style={detailsPanelStyle}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <NetworkDetails
                status={status}
                statistics={statistics}
                onManualCheck={allowManualCheck ? handleManualCheck : undefined}
                isChecking={isChecking}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      style={containerStyle}
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div style={statusIndicatorStyle} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <div style={{ color: '#ffffff', fontWeight: 'bold' }}>
          {getStatusIcon()} {getStatusText()}
        </div>

        {!compact && (
          <div style={{ color: '#cccccc', fontSize: '0.75rem' }}>
            {isOnline ? (
              <>
                {status.connectionType !== 'unknown' && `${status.connectionType} • `}
                {status.effectiveType !== 'unknown' && `${status.effectiveType}`}
                {status.downlink > 0 && ` • ${status.downlink}Mbps`}
              </>
            ) : (
              'No internet connection'
            )}
          </div>
        )}
      </div>

      {allowManualCheck && (
        <Button
          variant='secondary'
          size='sm'
          onClick={handleManualCheck}
          disabled={isChecking}
          style={{ marginLeft: 'auto' }}
        >
          {isChecking ? 'Checking...' : 'Check'}
        </Button>
      )}

      {showDetails && (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setShowDetailsPanel(!showDetailsPanel)}
          style={{ marginLeft: allowManualCheck ? '4px' : 'auto' }}
        >
          {showDetailsPanel ? '▲' : '▼'}
        </Button>
      )}

      <AnimatePresence>
        {showDetails && showDetailsPanel && (
          <motion.div
            style={detailsPanelStyle}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <NetworkDetails
              status={status}
              statistics={statistics}
              onManualCheck={allowManualCheck ? handleManualCheck : undefined}
              isChecking={isChecking}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface NetworkDetailsProps {
  status: any;
  statistics: any;
  onManualCheck?: () => void;
  isChecking: boolean;
}

const NetworkDetails: React.FC<NetworkDetailsProps> = ({
  status,
  statistics,
  onManualCheck,
  isChecking,
}) => {
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const detailItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    color: '#cccccc',
  };

  const labelStyle: React.CSSProperties = {
    color: '#999999',
    fontSize: '0.75rem',
  };

  const valueStyle: React.CSSProperties = {
    color: '#ffffff',
    fontWeight: 'bold',
  };

  return (
    <div>
      <h4 style={{ margin: '0 0 12px 0', color: '#d4af37', fontSize: '0.9rem' }}>
        Connection Details
      </h4>

      <div style={detailItemStyle}>
        <span style={labelStyle}>Status:</span>
        <span style={valueStyle}>{status.isOnline ? '🟢 Online' : '🔴 Offline'}</span>
      </div>

      <div style={detailItemStyle}>
        <span style={labelStyle}>Connection Type:</span>
        <span style={valueStyle}>
          {status.connectionType !== 'unknown' ? status.connectionType : 'Unknown'}
        </span>
      </div>

      <div style={detailItemStyle}>
        <span style={labelStyle}>Speed:</span>
        <span style={valueStyle}>
          {status.effectiveType !== 'unknown' ? status.effectiveType : 'Unknown'}
          {status.downlink > 0 && ` (${status.downlink} Mbps)`}
        </span>
      </div>

      {status.rtt > 0 && (
        <div style={detailItemStyle}>
          <span style={labelStyle}>Latency:</span>
          <span style={valueStyle}>{status.rtt}ms</span>
        </div>
      )}

      <div style={detailItemStyle}>
        <span style={labelStyle}>Data Saver:</span>
        <span style={valueStyle}>{status.saveData ? '🟡 Enabled' : '🟢 Disabled'}</span>
      </div>

      {statistics.currentSessionDuration > 0 && (
        <div style={detailItemStyle}>
          <span style={labelStyle}>Session:</span>
          <span style={valueStyle}>{formatDuration(statistics.currentSessionDuration)}</span>
        </div>
      )}

      {status.lastOnline && (
        <div style={detailItemStyle}>
          <span style={labelStyle}>Last Online:</span>
          <span style={valueStyle}>{status.lastOnline.toLocaleTimeString()}</span>
        </div>
      )}

      {status.lastOffline && (
        <div style={detailItemStyle}>
          <span style={labelStyle}>Last Offline:</span>
          <span style={valueStyle}>{status.lastOffline.toLocaleTimeString()}</span>
        </div>
      )}

      {onManualCheck && (
        <div
          style={{
            marginTop: '12px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Button
            variant='secondary'
            size='sm'
            onClick={onManualCheck}
            disabled={isChecking}
            style={{ width: '100%' }}
          >
            {isChecking ? 'Checking Connection...' : 'Test Connection'}
          </Button>
        </div>
      )}
    </div>
  );
};

NetworkStatusIndicator.displayName = 'NetworkStatusIndicator';

export default NetworkStatusIndicator;
