/**
 * Offline Queue Indicator Component
 * Shows pending offline operations and queue status
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOfflineQueue, useOfflineSave } from '../../hooks/useOfflineQueue';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { Button } from '../atoms';
import { QueuedOperation, QueueOperationType } from '../../utils/offlineQueue';

interface OfflineQueueIndicatorProps {
  /** User ID for filtering operations */
  userId?: string;
  /** Whether to show detailed queue information */
  showDetails?: boolean;
  /** Whether to show as a compact indicator */
  compact?: boolean;
  /** Custom className */
  className?: string;
}

export const OfflineQueueIndicator: React.FC<OfflineQueueIndicatorProps> = ({
  userId,
  showDetails = false,
  compact = false,
  className = '',
}) => {
  const { status, operations, processQueue, clear, clearFailed, retryFailed, canProcessNow } =
    useOfflineQueue();
  const { isOnline } = useNetworkStatus();
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter operations by user if provided
  const userOperations = userId
    ? operations.filter(op => op.metadata?.userId === userId)
    : operations;

  // Don't show indicator if no operations
  if (userOperations.length === 0) {
    return null;
  }

  const handleProcessQueue = async () => {
    if (!canProcessNow) return;

    setIsProcessing(true);
    try {
      await processQueue();
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = () => {
    if (status.failedOperations > 0) return '#ff6b6b';
    if (status.processingOperations > 0) return '#ffd43b';
    if (status.pendingOperations > 0 && isOnline) return '#69db7c';
    if (status.pendingOperations > 0) return '#ffa726';
    return '#51cf66';
  };

  const getStatusIcon = () => {
    if (status.processingOperations > 0 || isProcessing) return '⏳';
    if (status.failedOperations > 0) return '❌';
    if (status.pendingOperations > 0 && !isOnline) return '📴';
    if (status.pendingOperations > 0) return '📤';
    return '✅';
  };

  const getStatusText = () => {
    if (status.processingOperations > 0 || isProcessing) {
      return `Processing ${status.processingOperations} operations...`;
    }
    if (status.failedOperations > 0) {
      return `${status.failedOperations} failed operations`;
    }
    if (status.pendingOperations > 0) {
      const pending = userId ? userOperations.length : status.pendingOperations;
      return `${pending} pending ${pending === 1 ? 'operation' : 'operations'}`;
    }
    return 'Queue empty';
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
    animation: status.processingOperations > 0 || isProcessing ? 'pulse 1s infinite' : undefined,
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
          {getStatusIcon()} {userOperations.length}
        </span>

        <AnimatePresence>
          {showDetailsPanel && (
            <motion.div
              style={{
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
                minWidth: '300px',
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <QueueDetails
                operations={userOperations}
                status={status}
                isOnline={isOnline}
                canProcessNow={canProcessNow}
                onProcessQueue={handleProcessQueue}
                onClear={clear}
                onClearFailed={clearFailed}
                onRetryFailed={retryFailed}
                isProcessing={isProcessing}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        <div style={{ color: '#ffffff', fontWeight: 'bold' }}>{getStatusIcon()} Offline Queue</div>
        <div style={{ color: '#cccccc', fontSize: '0.75rem' }}>{getStatusText()}</div>
      </div>

      {canProcessNow && (
        <Button variant='secondary' size='sm' onClick={handleProcessQueue} disabled={isProcessing}>
          {isProcessing ? 'Processing...' : 'Process'}
        </Button>
      )}

      {showDetails && (
        <Button
          variant='ghost'
          size='sm'
          onClick={() => setShowDetailsPanel(!showDetailsPanel)}
          style={{ marginLeft: '4px' }}
        >
          {showDetailsPanel ? '▲' : '▼'}
        </Button>
      )}

      <AnimatePresence>
        {showDetails && showDetailsPanel && (
          <motion.div
            style={{
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
              minWidth: '350px',
              maxHeight: '400px',
              overflowY: 'auto',
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <QueueDetails
              operations={userOperations}
              status={status}
              isOnline={isOnline}
              canProcessNow={canProcessNow}
              onProcessQueue={handleProcessQueue}
              onClear={clear}
              onClearFailed={clearFailed}
              onRetryFailed={retryFailed}
              isProcessing={isProcessing}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface QueueDetailsProps {
  operations: QueuedOperation[];
  status: any;
  isOnline: boolean;
  canProcessNow: boolean;
  onProcessQueue: () => void;
  onClear: () => void;
  onClearFailed: () => void;
  onRetryFailed: () => void;
  isProcessing: boolean;
}

const QueueDetails: React.FC<QueueDetailsProps> = ({
  operations,
  status,
  isOnline,
  canProcessNow,
  onProcessQueue,
  onClear,
  onClearFailed,
  onRetryFailed,
  isProcessing,
}) => {
  const getOperationIcon = (type: QueueOperationType) => {
    switch (type) {
      case 'save':
        return '💾';
      case 'load':
        return '📂';
      case 'delete':
        return '🗑️';
      case 'sync':
        return '🔄';
      case 'custom':
        return '⚙️';
      default:
        return '❓';
    }
  };

  const getOperationStatus = (operation: QueuedOperation) => {
    if (operation.retryCount >= operation.maxRetries) return 'Failed';
    if (operation.retryCount > 0) return 'Retrying';
    return 'Pending';
  };

  const getOperationStatusColor = (operation: QueuedOperation) => {
    if (operation.retryCount >= operation.maxRetries) return '#ff6b6b';
    if (operation.retryCount > 0) return '#ffd43b';
    return '#69db7c';
  };

  const operationItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '4px',
    marginBottom: '8px',
  };

  const groupedOperations = operations.reduce(
    (acc, op) => {
      if (!acc[op.type]) acc[op.type] = [];
      acc[op.type].push(op);
      return acc;
    },
    {} as Record<QueueOperationType, QueuedOperation[]>
  );

  return (
    <div>
      <h4 style={{ margin: '0 0 12px 0', color: '#d4af37', fontSize: '0.9rem' }}>Queue Details</h4>

      {/* Status Summary */}
      <div
        style={{
          marginBottom: '16px',
          padding: '8px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            fontSize: '0.75rem',
          }}
        >
          <div>
            <span style={{ color: '#999999' }}>Total:</span>
            <span style={{ color: '#ffffff', marginLeft: '4px', fontWeight: 'bold' }}>
              {status.totalOperations}
            </span>
          </div>
          <div>
            <span style={{ color: '#999999' }}>Pending:</span>
            <span style={{ color: '#69db7c', marginLeft: '4px', fontWeight: 'bold' }}>
              {status.pendingOperations}
            </span>
          </div>
          <div>
            <span style={{ color: '#999999' }}>Processing:</span>
            <span style={{ color: '#ffd43b', marginLeft: '4px', fontWeight: 'bold' }}>
              {status.processingOperations}
            </span>
          </div>
          <div>
            <span style={{ color: '#999999' }}>Failed:</span>
            <span style={{ color: '#ff6b6b', marginLeft: '4px', fontWeight: 'bold' }}>
              {status.failedOperations}
            </span>
          </div>
        </div>
      </div>

      {/* Operations by Type */}
      {Object.entries(groupedOperations).map(([type, ops]) => (
        <div key={type} style={{ marginBottom: '12px' }}>
          <h5 style={{ margin: '0 0 8px 0', color: '#cccccc', fontSize: '0.8rem' }}>
            {getOperationIcon(type as QueueOperationType)} {type.toUpperCase()} ({ops.length})
          </h5>

          {ops.slice(0, 5).map(op => (
            <div key={op.id} style={operationItemStyle}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#ffffff', fontSize: '0.75rem', marginBottom: '2px' }}>
                  {op.metadata?.description || `${op.type} operation`}
                </div>
                <div style={{ color: '#999999', fontSize: '0.7rem' }}>
                  {new Date(op.timestamp).toLocaleTimeString()}
                  {op.metadata?.slotNumber !== undefined && ` • Slot ${op.metadata.slotNumber}`}
                </div>
              </div>
              <div
                style={{
                  color: getOperationStatusColor(op),
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                }}
              >
                {getOperationStatus(op)}
                {op.retryCount > 0 && ` (${op.retryCount}/${op.maxRetries})`}
              </div>
            </div>
          ))}

          {ops.length > 5 && (
            <div
              style={{
                color: '#999999',
                fontSize: '0.7rem',
                textAlign: 'center',
                marginTop: '4px',
              }}
            >
              ... and {ops.length - 5} more
            </div>
          )}
        </div>
      ))}

      {/* Action Buttons */}
      <div
        style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
        }}
      >
        {canProcessNow && (
          <Button
            variant='primary'
            size='sm'
            onClick={onProcessQueue}
            disabled={isProcessing}
            style={{ gridColumn: '1 / -1' }}
          >
            {isProcessing ? 'Processing...' : `Process Queue (${status.pendingOperations})`}
          </Button>
        )}

        {status.failedOperations > 0 && (
          <>
            <Button variant='secondary' size='sm' onClick={onRetryFailed}>
              Retry Failed
            </Button>
            <Button variant='destructive' size='sm' onClick={onClearFailed}>
              Clear Failed
            </Button>
          </>
        )}

        {operations.length > 0 && (
          <Button
            variant='destructive'
            size='sm'
            onClick={onClear}
            style={{ gridColumn: status.failedOperations > 0 ? 'auto' : '1 / -1' }}
          >
            Clear All
          </Button>
        )}
      </div>

      {!isOnline && (
        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            background: 'rgba(255, 167, 38, 0.1)',
            border: '1px solid rgba(255, 167, 38, 0.3)',
            borderRadius: '4px',
            color: '#ffa726',
            fontSize: '0.7rem',
            textAlign: 'center',
          }}
        >
          📴 Queue will process automatically when connection is restored
        </div>
      )}
    </div>
  );
};

OfflineQueueIndicator.displayName = 'OfflineQueueIndicator';

export default OfflineQueueIndicator;
