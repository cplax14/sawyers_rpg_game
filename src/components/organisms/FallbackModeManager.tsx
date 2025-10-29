/**
 * Fallback Mode Manager
 * Provides UI for managing service degradation and fallback scenarios
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceMode, useServiceMode, SERVICE_CAPABILITIES } from '../../utils/serviceMode';
import { useSmartSave } from '../../hooks/useSmartSave';
import { Button } from '../atoms/Button';
import HelpTooltip from '../atoms/HelpTooltip';

interface FallbackModeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSupport?: () => void;
}

export const FallbackModeManager: React.FC<FallbackModeManagerProps> = ({
  isOpen,
  onClose,
  onContactSupport,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'capabilities' | 'pending' | 'settings'>(
    'overview'
  );
  const [isRestoring, setIsRestoring] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const {
    mode,
    config,
    getAvailableCapabilities,
    getUnavailableCapabilities,
    getStatusMessage,
    getPendingSyncStatus,
    attemptRestoration,
  } = useServiceMode();

  const { syncPendingSaves, getSaveStatus, pendingCloudSaves } = useSmartSave();

  const getModeColor = (serviceMode: ServiceMode): string => {
    switch (serviceMode) {
      case ServiceMode.CLOUD_ENABLED:
        return '#10b981';
      case ServiceMode.DEGRADED:
        return '#f59e0b';
      case ServiceMode.LOCAL_ONLY:
        return '#6b7280';
      case ServiceMode.OFFLINE:
        return '#ef4444';
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

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    try {
      await attemptRestoration();
    } finally {
      setIsRestoring(false);
    }
  }, [attemptRestoration]);

  const handleSyncPending = useCallback(async () => {
    setIsSyncing(true);
    try {
      await syncPendingSaves();
    } finally {
      setIsSyncing(false);
    }
  }, [syncPendingSaves]);

  const availableCapabilities = getAvailableCapabilities();
  const unavailableCapabilities = getUnavailableCapabilities();
  const pendingSync = getPendingSyncStatus();
  const saveStatus = getSaveStatus();

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundColor: '#1f2937',
            borderRadius: '12px',
            border: `2px solid ${getModeColor(mode)}`,
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.5rem',
              borderBottom: '1px solid #374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{getModeIcon(mode)}</span>
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: '#f9fafb',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                  }}
                >
                  Service Mode Manager
                </h2>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    color: getModeColor(mode),
                    fontSize: '0.875rem',
                    fontWeight: 'semibold',
                  }}
                >
                  {getStatusMessage()}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '6px',
                fontSize: '1.25rem',
              }}
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #374151',
              backgroundColor: '#111827',
            }}
          >
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'capabilities', label: 'Features', icon: '⚙️' },
              { id: 'pending', label: 'Pending', icon: '⏳' },
              { id: 'settings', label: 'Options', icon: '🔧' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: activeTab === tab.id ? '#1f2937' : 'transparent',
                  border: 'none',
                  color: activeTab === tab.id ? '#f3f4f6' : '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === tab.id ? 'semibold' : 'normal',
                  borderBottom:
                    activeTab === tab.id
                      ? `2px solid ${getModeColor(mode)}`
                      : '2px solid transparent',
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.id === 'pending' && pendingSync.count > 0 && (
                  <span
                    style={{
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      fontSize: '0.7rem',
                      padding: '0.125rem 0.375rem',
                      borderRadius: '10px',
                      fontWeight: 'bold',
                      marginLeft: '0.25rem',
                    }}
                  >
                    {pendingSync.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '1.5rem',
              color: '#f3f4f6',
            }}
          >
            {activeTab === 'overview' && (
              <div>
                {/* Current Status */}
                <div
                  style={{
                    backgroundColor: getModeColor(mode) + '20',
                    border: `1px solid ${getModeColor(mode)}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <h3
                    style={{
                      margin: '0 0 0.5rem 0',
                      color: '#f9fafb',
                      fontSize: '1.125rem',
                    }}
                  >
                    Current Status
                  </h3>
                  <p
                    style={{
                      margin: '0 0 1rem 0',
                      color: '#d1d5db',
                      lineHeight: '1.5',
                    }}
                  >
                    {getStatusMessage()}
                  </p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div>
                      <strong>Last Updated:</strong>
                      <br />
                      {config.timestamp.toLocaleString()}
                    </div>
                    <div>
                      <strong>Auto Retry:</strong>
                      <br />
                      {config.autoRetryEnabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  {mode !== ServiceMode.CLOUD_ENABLED && (
                    <Button
                      variant='primary'
                      onClick={handleRestore}
                      disabled={isRestoring || mode === ServiceMode.OFFLINE}
                      style={{ width: '100%' }}
                    >
                      {isRestoring ? 'Restoring...' : 'Restore Cloud Services'}
                    </Button>
                  )}

                  {pendingSync.count > 0 && (
                    <Button
                      variant='secondary'
                      onClick={handleSyncPending}
                      disabled={isSyncing || mode !== ServiceMode.CLOUD_ENABLED}
                      style={{ width: '100%' }}
                    >
                      {isSyncing ? 'Syncing...' : `Sync ${pendingSync.count} Pending`}
                    </Button>
                  )}

                  {onContactSupport && (
                    <Button variant='outline' onClick={onContactSupport} style={{ width: '100%' }}>
                      Contact Support
                    </Button>
                  )}
                </div>

                {/* Impact Summary */}
                <div
                  style={{
                    backgroundColor: '#111827',
                    borderRadius: '8px',
                    padding: '1rem',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 0.75rem 0',
                      color: '#f9fafb',
                      fontSize: '1rem',
                    }}
                  >
                    Service Impact
                  </h4>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    <div>
                      <div style={{ color: '#10b981', marginBottom: '0.25rem' }}>
                        ✅ Available: {availableCapabilities.length}
                      </div>
                      <div style={{ color: '#ef4444' }}>
                        ❌ Unavailable: {unavailableCapabilities.length}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#f59e0b', marginBottom: '0.25rem' }}>
                        ⏳ Pending Syncs: {pendingSync.count}
                      </div>
                      <div style={{ color: '#6b7280' }}>💾 Local Saves: Active</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'capabilities' && (
              <div>
                <h3
                  style={{
                    margin: '0 0 1rem 0',
                    color: '#f9fafb',
                    fontSize: '1.25rem',
                  }}
                >
                  Feature Availability
                </h3>

                {/* Available Features */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4
                    style={{
                      margin: '0 0 0.75rem 0',
                      color: '#10b981',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    ✅ Available Features ({availableCapabilities.length})
                  </h4>
                  {availableCapabilities.map((capability, index) => (
                    <div
                      key={index}
                      style={{
                        backgroundColor: '#065f4620',
                        border: '1px solid #10b981',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                      }}
                    >
                      <div style={{ fontWeight: 'semibold', marginBottom: '0.25rem' }}>
                        {capability.name}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                        {capability.description}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Unavailable Features */}
                {unavailableCapabilities.length > 0 && (
                  <div>
                    <h4
                      style={{
                        margin: '0 0 0.75rem 0',
                        color: '#ef4444',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      ❌ Unavailable Features ({unavailableCapabilities.length})
                    </h4>
                    {unavailableCapabilities.map((capability, index) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: '#7f1d1d20',
                          border: '1px solid #ef4444',
                          borderRadius: '6px',
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '0.25rem',
                          }}
                        >
                          <span style={{ fontWeight: 'semibold' }}>{capability.name}</span>
                          {capability.fallbackBehavior && (
                            <HelpTooltip
                              content={`Fallback: ${capability.fallbackBehavior}`}
                              icon='ℹ️'
                              position='left'
                            />
                          )}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                          {capability.description}
                        </div>
                        {capability.fallbackBehavior && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#f59e0b',
                              marginTop: '0.25rem',
                            }}
                          >
                            Fallback: {capability.fallbackBehavior}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pending' && (
              <div>
                <h3
                  style={{
                    margin: '0 0 1rem 0',
                    color: '#f9fafb',
                    fontSize: '1.25rem',
                  }}
                >
                  Pending Operations
                </h3>

                {pendingSync.count > 0 ? (
                  <div>
                    <div
                      style={{
                        backgroundColor: '#7c2d12',
                        border: '1px solid #ea580c',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                      }}
                    >
                      <h4
                        style={{
                          margin: '0 0 0.5rem 0',
                          color: '#fed7aa',
                          fontSize: '1rem',
                        }}
                      >
                        Sync Queue Status
                      </h4>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '1rem',
                          marginBottom: '1rem',
                        }}
                      >
                        <div>
                          <div style={{ color: '#fed7aa', fontSize: '0.875rem' }}>
                            <strong>Pending Items:</strong> {pendingSync.count}
                          </div>
                          <div style={{ color: '#fed7aa', fontSize: '0.875rem' }}>
                            <strong>Operations:</strong> {pendingSync.operations.join(', ')}
                          </div>
                        </div>
                        <div>
                          {pendingSync.oldestItem && (
                            <div style={{ color: '#fed7aa', fontSize: '0.875rem' }}>
                              <strong>Oldest Item:</strong>
                              <br />
                              {pendingSync.oldestItem.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant='primary'
                        onClick={handleSyncPending}
                        disabled={isSyncing || mode !== ServiceMode.CLOUD_ENABLED}
                        style={{ width: '100%' }}
                      >
                        {isSyncing ? 'Syncing...' : 'Process Pending Syncs'}
                      </Button>
                    </div>

                    <div
                      style={{
                        backgroundColor: '#1e3a8a',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        padding: '1rem',
                      }}
                    >
                      <h4
                        style={{
                          margin: '0 0 0.5rem 0',
                          color: '#dbeafe',
                          fontSize: '1rem',
                        }}
                      >
                        What happens to pending syncs?
                      </h4>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: '1.25rem',
                          color: '#dbeafe',
                          fontSize: '0.875rem',
                          lineHeight: '1.5',
                        }}
                      >
                        <li>Operations are queued when cloud services are unavailable</li>
                        <li>Data is safely stored locally until sync is possible</li>
                        <li>Automatic sync occurs when cloud services are restored</li>
                        <li>Manual sync can be triggered from this panel</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: 'center',
                      color: '#9ca3af',
                      padding: '2rem',
                    }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                    <p>No pending operations</p>
                    <p style={{ fontSize: '0.875rem' }}>All data is synchronized and up to date</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div>
                <h3
                  style={{
                    margin: '0 0 1rem 0',
                    color: '#f9fafb',
                    fontSize: '1.25rem',
                  }}
                >
                  Fallback Options
                </h3>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4
                    style={{
                      margin: '0 0 0.75rem 0',
                      color: '#f9fafb',
                      fontSize: '1rem',
                    }}
                  >
                    Auto-Recovery Settings
                  </h4>
                  <div
                    style={{
                      backgroundColor: '#111827',
                      borderRadius: '8px',
                      padding: '1rem',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span>Auto-retry cloud services</span>
                      <span
                        style={{
                          color: config.autoRetryEnabled ? '#10b981' : '#ef4444',
                        }}
                      >
                        {config.autoRetryEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.875rem',
                        color: '#9ca3af',
                      }}
                    >
                      <span>Retry interval</span>
                      <span>{Math.round(config.retryInterval / 1000)}s</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: '#1e3a8a',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                    padding: '1rem',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 0.75rem 0',
                      color: '#dbeafe',
                      fontSize: '1rem',
                    }}
                  >
                    Graceful Degradation Features
                  </h4>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: '1.25rem',
                      color: '#dbeafe',
                      fontSize: '0.875rem',
                      lineHeight: '1.6',
                    }}
                  >
                    <li>Automatic fallback to local storage when cloud is unavailable</li>
                    <li>Smart save operations that choose the best available method</li>
                    <li>Pending operation queue for delayed synchronization</li>
                    <li>Real-time service health monitoring and recovery</li>
                    <li>User notifications about service status changes</li>
                    <li>Manual override options for advanced users</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FallbackModeManager;
