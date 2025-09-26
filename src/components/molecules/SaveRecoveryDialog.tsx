/**
 * Save Recovery Dialog Component
 * Shows recovery options when interrupted saves are detected
 */

import React, { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSaveRecovery, useResponsive, useReducedMotion } from '../../hooks';
import { Button } from '../atoms';
import { SaveOperation } from '../../utils/saveRecovery';

interface SaveRecoveryDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Called when the dialog should close */
  onClose: () => void;
  /** Called when recovery is completed */
  onRecoveryComplete?: () => void;
  /** Custom className */
  className?: string;
}

export const SaveRecoveryDialog: React.FC<SaveRecoveryDialogProps> = ({
  isOpen,
  onClose,
  onRecoveryComplete,
  className = ''
}) => {
  const {
    recoveryInfo,
    isCheckingRecovery,
    retryOperation,
    clearRecoveryData,
    getOperationStats,
    formatOperationDuration,
    getOperationStatusColor,
    getOperationStatusText
  } = useSaveRecovery();

  const { isMobile } = useResponsive();
  const { animationConfig } = useReducedMotion();

  const [retryingOperations, setRetryingOperations] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);

  const handleRetryOperation = useCallback(async (operation: SaveOperation) => {
    setRetryingOperations(prev => new Set([...prev, operation.id]));

    try {
      const result = await retryOperation(operation.id);
      if (result) {
        console.log('Retried operation:', result.id);
      }
    } catch (error) {
      console.error('Failed to retry operation:', error);
    } finally {
      setRetryingOperations(prev => {
        const newSet = new Set(prev);
        newSet.delete(operation.id);
        return newSet;
      });
    }
  }, [retryOperation]);

  const handleRetryAll = useCallback(async () => {
    const retriableOps = recoveryInfo.interruptedOperations.filter(
      op => op.retryCount < 3 // Max retries
    );

    for (const operation of retriableOps) {
      await handleRetryOperation(operation);
    }

    onRecoveryComplete?.();
  }, [recoveryInfo.interruptedOperations, handleRetryOperation, onRecoveryComplete]);

  const handleClearAll = useCallback(() => {
    clearRecoveryData();
    onRecoveryComplete?.();
    onClose();
  }, [clearRecoveryData, onRecoveryComplete, onClose]);

  const handleDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen || !recoveryInfo.hasRecoverableData) {
    return null;
  }

  const stats = getOperationStats();

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: isMobile ? '16px' : '20px'
  };

  const dialogStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #2a2a3e, #1e1e2f)',
    borderRadius: '12px',
    border: '2px solid rgba(255, 107, 107, 0.3)',
    padding: isMobile ? '20px' : '24px',
    maxWidth: isMobile ? '100%' : '600px',
    maxHeight: '80vh',
    overflowY: 'auto',
    width: '100%'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px'
  };

  const titleStyle: React.CSSProperties = {
    color: '#ff6b6b',
    fontSize: isMobile ? '1.2rem' : '1.4rem',
    fontWeight: 'bold',
    margin: 0
  };

  const contentStyle: React.CSSProperties = {
    marginBottom: '20px'
  };

  const operationStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '8px',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    flexWrap: isMobile ? 'wrap' : 'nowrap'
  };

  const statsStyle: React.CSSProperties = {
    background: 'rgba(212, 175, 55, 0.1)',
    borderRadius: '6px',
    padding: '10px',
    marginBottom: '16px',
    fontSize: '0.85rem',
    color: '#cccccc'
  };

  return (
    <AnimatePresence>
      <motion.div
        style={overlayStyle}
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={animationConfig}
      >
        <motion.div
          style={dialogStyle}
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 20 }}
          transition={animationConfig}
        >
          <div style={headerStyle}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <h2 style={titleStyle}>Save Recovery Required</h2>
          </div>

          <div style={contentStyle}>
            <p style={{ color: '#ffffff', marginBottom: '12px', lineHeight: '1.4' }}>
              We detected {recoveryInfo.interruptedOperations.length} interrupted save operation
              {recoveryInfo.interruptedOperations.length !== 1 ? 's' : ''}.{' '}
              {recoveryInfo.recommendedAction === 'retry'
                ? 'We recommend retrying these operations.'
                : recoveryInfo.recommendedAction === 'recover'
                ? 'We recommend recovering from your last known good save.'
                : 'Please choose how to proceed.'
              }
            </p>

            {/* Statistics */}
            <div style={statsStyle}>
              <strong>Save Statistics:</strong> {stats.completed} completed, {stats.failed} failed, {stats.interrupted} interrupted
              {stats.total > 0 && (
                <span> • Success Rate: {stats.successRate.toFixed(1)}%</span>
              )}
            </div>

            {/* Operations List */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <h4 style={{ color: '#d4af37', margin: 0 }}>
                  Interrupted Operations:
                </h4>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#4ecdc4',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {recoveryInfo.interruptedOperations.slice(0, showDetails ? undefined : 3).map((operation) => (
                <div key={operation.id} style={operationStyle}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        color: '#ffffff',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {operation.saveName} (Slot {operation.slotNumber + 1})
                      </div>

                      <div style={{
                        fontSize: '0.8rem',
                        color: '#cccccc',
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap'
                      }}>
                        <span>
                          Status: <span style={{ color: getOperationStatusColor(operation.status) }}>
                            {getOperationStatusText(operation.status)}
                          </span>
                        </span>
                        <span>Duration: {formatOperationDuration(operation)}</span>
                        <span>Retries: {operation.retryCount}/3</span>
                      </div>

                      {operation.lastError && showDetails && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#ff9999',
                          marginTop: '4px',
                          fontStyle: 'italic'
                        }}>
                          Error: {operation.lastError}
                        </div>
                      )}
                    </div>

                    {operation.retryCount < 3 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRetryOperation(operation)}
                        disabled={retryingOperations.has(operation.id)}
                        style={{ minWidth: '60px' }}
                      >
                        {retryingOperations.has(operation.id) ? '...' : 'Retry'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {!showDetails && recoveryInfo.interruptedOperations.length > 3 && (
                <div style={{
                  textAlign: 'center',
                  color: '#999999',
                  fontSize: '0.85rem',
                  fontStyle: 'italic'
                }}>
                  +{recoveryInfo.interruptedOperations.length - 3} more operations
                </div>
              )}
            </div>

            {/* Last Known Good Save */}
            {recoveryInfo.lastKnownGoodSave && (
              <div style={{
                background: 'rgba(81, 207, 102, 0.1)',
                borderRadius: '6px',
                padding: '10px',
                marginBottom: '16px'
              }}>
                <div style={{ color: '#51cf66', fontWeight: '500', marginBottom: '4px' }}>
                  ✅ Last Known Good Save:
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cccccc' }}>
                  {recoveryInfo.lastKnownGoodSave.saveName} • {' '}
                  {new Date(recoveryInfo.lastKnownGoodSave.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div style={actionsStyle}>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              disabled={isCheckingRecovery}
            >
              Dismiss
            </Button>

            <Button
              variant="secondary"
              onClick={handleClearAll}
              disabled={isCheckingRecovery}
            >
              Clear All
            </Button>

            {recoveryInfo.recommendedAction === 'retry' && (
              <Button
                variant="primary"
                onClick={handleRetryAll}
                disabled={isCheckingRecovery || retryingOperations.size > 0}
              >
                {retryingOperations.size > 0 ? 'Retrying...' : 'Retry All'}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

SaveRecoveryDialog.displayName = 'SaveRecoveryDialog';

export default memo(SaveRecoveryDialog);