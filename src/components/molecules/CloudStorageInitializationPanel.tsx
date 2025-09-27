/**
 * Cloud Storage Initialization Panel Component
 * Shows initialization status and provides controls
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCloudStorageInitialization } from '../../hooks/useCloudStorageInitialization';
import { Button } from '../atoms';
import { InitializationOptions } from '../../services/cloudStorageInitializer';

interface CloudStorageInitializationPanelProps {
  /** Whether to show detailed information */
  showDetails?: boolean;
  /** Whether to show initialization controls */
  showControls?: boolean;
  /** Whether to auto-initialize on mount */
  autoInitialize?: boolean;
  /** Custom className */
  className?: string;
  /** Callback when initialization completes */
  onInitializationComplete?: (success: boolean) => void;
  /** Callback for initialization progress */
  onProgress?: (step: string, progress: number) => void;
}

export const CloudStorageInitializationPanel: React.FC<CloudStorageInitializationPanelProps> = ({
  showDetails = true,
  showControls = true,
  autoInitialize = false,
  className = '',
  onInitializationComplete,
  onProgress
}) => {
  const [initProgress, setInitProgress] = useState({ step: '', progress: 0 });
  const [showFullDetails, setShowFullDetails] = useState(false);

  const {
    status,
    services,
    isInitializing,
    isReady,
    hasErrors,
    hasWarnings,
    initialize,
    reinitialize,
    getConfigurationSummary
  } = useCloudStorageInitialization({
    autoInitialize,
    enableDebugLogging: true
  });

  const handleInitialize = useCallback(async () => {
    const options: InitializationOptions = {
      enableDebugLogging: true,
      onProgress: (step: string, progress: number) => {
        setInitProgress({ step, progress });
        onProgress?.(step, progress);
      },
      onWarning: (warning: string) => {
        console.warn('Initialization warning:', warning);
      },
      onError: (error: string) => {
        console.error('Initialization error:', error);
      }
    };

    try {
      const result = await initialize(options);
      onInitializationComplete?.(result.isInitialized && result.errors.length === 0);
    } catch (error) {
      console.error('Failed to initialize:', error);
      onInitializationComplete?.(false);
    } finally {
      setInitProgress({ step: '', progress: 0 });
    }
  }, [initialize, onInitializationComplete, onProgress]);

  const handleReinitialize = useCallback(async () => {
    try {
      const result = await reinitialize({
        enableDebugLogging: true,
        onProgress: (step: string, progress: number) => {
          setInitProgress({ step, progress });
          onProgress?.(step, progress);
        }
      });
      onInitializationComplete?.(result.isInitialized && result.errors.length === 0);
    } catch (error) {
      console.error('Failed to reinitialize:', error);
      onInitializationComplete?.(false);
    } finally {
      setInitProgress({ step: '', progress: 0 });
    }
  }, [reinitialize, onInitializationComplete, onProgress]);

  const getStatusColor = () => {
    if (hasErrors) return '#ff6b6b';
    if (isInitializing) return '#ffd43b';
    if (isReady) return '#51cf66';
    if (status.isConfigured) return '#69db7c';
    return '#999999';
  };

  const getStatusIcon = () => {
    if (isInitializing) return '⏳';
    if (hasErrors) return '❌';
    if (isReady) return '✅';
    if (status.isConfigured) return '⚙️';
    return '❓';
  };

  const getStatusText = () => {
    if (isInitializing) {
      return initProgress.step || 'Initializing...';
    }
    if (hasErrors) return 'Initialization Failed';
    if (isReady) return 'Ready';
    if (status.isConfigured) return 'Configured (Not Connected)';
    if (status.isInitialized) return 'Initialized';
    return 'Not Initialized';
  };

  const configSummary = getConfigurationSummary();

  const containerStyle: React.CSSProperties = {
    padding: '16px',
    background: 'linear-gradient(135deg, #2a2a3e, #1e1e2f)',
    borderRadius: '12px',
    border: `2px solid ${getStatusColor()}`,
    maxWidth: '600px'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  };

  const titleStyle: React.CSSProperties = {
    color: '#d4af37',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  };

  const statusStyle: React.CSSProperties = {
    color: getStatusColor(),
    fontSize: '0.9rem',
    fontWeight: 'bold'
  };

  return (
    <motion.div
      style={containerStyle}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={headerStyle}>
        <h3 style={titleStyle}>
          {getStatusIcon()} Cloud Storage
        </h3>
        <div style={statusStyle}>
          {getStatusText()}
        </div>
      </div>

      {/* Progress Bar */}
      {isInitializing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            marginBottom: '16px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          <motion.div
            style={{
              height: '4px',
              background: 'linear-gradient(90deg, #51cf66, #69db7c)',
              borderRadius: '4px'
            }}
            animate={{ width: `${initProgress.progress}%` }}
            transition={{ duration: 0.3 }}
          />
          <div style={{
            padding: '8px',
            color: '#cccccc',
            fontSize: '0.8rem'
          }}>
            {initProgress.step} ({initProgress.progress}%)
          </div>
        </motion.div>
      )}

      {/* Quick Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#999999', fontSize: '0.8rem' }}>Provider:</span>
          <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '0.8rem' }}>
            {configSummary.provider}
          </span>
        </div>

        <div style={{
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#999999', fontSize: '0.8rem' }}>Status:</span>
          <span style={{
            color: getStatusColor(),
            fontWeight: 'bold',
            fontSize: '0.8rem'
          }}>
            {configSummary.status}
          </span>
        </div>

        <div style={{
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#999999', fontSize: '0.8rem' }}>Features:</span>
          <span style={{ color: '#ffffff', fontSize: '0.8rem' }}>
            {configSummary.features.length || 'None'}
          </span>
        </div>

        <div style={{
          padding: '8px 12px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: '#999999', fontSize: '0.8rem' }}>Issues:</span>
          <span style={{
            color: (configSummary.errors > 0) ? '#ff6b6b' :
                  (configSummary.warnings > 0) ? '#ffd43b' : '#51cf66',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            {configSummary.errors}E / {configSummary.warnings}W
          </span>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: status.isInitialized ? 'repeat(2, 1fr)' : '1fr',
          gap: '8px',
          marginBottom: showDetails ? '16px' : '0'
        }}>
          {!status.isInitialized ? (
            <Button
              variant="primary"
              onClick={handleInitialize}
              disabled={isInitializing}
              style={{ width: '100%' }}
            >
              {isInitializing ? 'Initializing...' : 'Initialize Cloud Storage'}
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                onClick={handleReinitialize}
                disabled={isInitializing}
              >
                Reinitialize
              </Button>
              <Button
                variant={isReady ? 'success' : hasErrors ? 'destructive' : 'secondary'}
                disabled
              >
                {isReady ? 'Ready' : hasErrors ? 'Failed' : 'Offline'}
              </Button>
            </>
          )}
        </div>
      )}

      {/* Detailed Information */}
      {showDetails && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h4 style={{
              color: '#cccccc',
              fontSize: '0.9rem',
              margin: 0
            }}>
              Details
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullDetails(!showFullDetails)}
            >
              {showFullDetails ? '▲' : '▼'}
            </Button>
          </div>

          <AnimatePresence>
            {showFullDetails && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Features */}
                {configSummary.features.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <h5 style={{
                      color: '#999999',
                      fontSize: '0.8rem',
                      margin: '0 0 4px 0'
                    }}>
                      Enabled Features:
                    </h5>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}>
                      {configSummary.features.map(feature => (
                        <span
                          key={feature}
                          style={{
                            padding: '2px 6px',
                            background: 'rgba(81, 207, 102, 0.2)',
                            color: '#51cf66',
                            borderRadius: '3px',
                            fontSize: '0.7rem'
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {status.errors.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <h5 style={{
                      color: '#ff6b6b',
                      fontSize: '0.8rem',
                      margin: '0 0 4px 0'
                    }}>
                      Errors:
                    </h5>
                    {status.errors.map((error, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255, 107, 107, 0.1)',
                          border: '1px solid rgba(255, 107, 107, 0.3)',
                          borderRadius: '4px',
                          color: '#ff9999',
                          fontSize: '0.7rem',
                          marginBottom: '4px'
                        }}
                      >
                        {error}
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {status.warnings.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <h5 style={{
                      color: '#ffd43b',
                      fontSize: '0.8rem',
                      margin: '0 0 4px 0'
                    }}>
                      Warnings:
                    </h5>
                    {status.warnings.map((warning, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(255, 212, 59, 0.1)',
                          border: '1px solid rgba(255, 212, 59, 0.3)',
                          borderRadius: '4px',
                          color: '#ffd43b',
                          fontSize: '0.7rem',
                          marginBottom: '4px'
                        }}
                      >
                        {warning}
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div style={{
                  color: '#999999',
                  fontSize: '0.7rem',
                  textAlign: 'right'
                }}>
                  Last updated: {status.timestamp.toLocaleTimeString()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

CloudStorageInitializationPanel.displayName = 'CloudStorageInitializationPanel';

export default CloudStorageInitializationPanel;