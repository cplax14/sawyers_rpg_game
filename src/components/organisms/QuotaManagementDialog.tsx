/**
 * Quota Management Dialog
 * Comprehensive interface for managing cloud storage quota
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuotaMonitor } from '../../hooks/useQuotaMonitor';
import { QuotaConfig } from '../../services/quotaMonitor';
import { User } from 'firebase/auth';
import { CloudStorageService } from '../../services/cloudStorage';
import { Button } from '../atoms';
import QuotaStatusIndicator from '../molecules/QuotaStatusIndicator';
import QuotaNotificationsPanel from '../molecules/QuotaNotificationsPanel';

interface QuotaManagementDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  /** Function to close dialog */
  onClose: () => void;
  /** Current user */
  user: User | null;
  /** Cloud storage service instance */
  cloudStorage: CloudStorageService | null;
  /** Callback when save cleanup is performed */
  onSaveCleanup?: (slotsToDelete: number[]) => Promise<void>;
  /** Callback when save management is requested */
  onManageSaves?: () => void;
}

type TabType = 'overview' | 'notifications' | 'settings' | 'cleanup';

export const QuotaManagementDialog: React.FC<QuotaManagementDialogProps> = ({
  isOpen,
  onClose,
  user,
  cloudStorage,
  onSaveCleanup,
  onManageSaves,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isPerformingCleanup, setIsPerformingCleanup] = useState(false);
  const [selectedSavesToDelete, setSelectedSavesToDelete] = useState<Set<number>>(new Set());

  const {
    quotaStatus,
    notifications,
    unreadCount,
    formatBytes,
    getSuggestions,
    updateConfig,
    getConfig,
    checkQuota,
  } = useQuotaMonitor(user, cloudStorage, {
    autoStart: true,
    enableDebugLogging: true,
  });

  const [quotaSettings, setQuotaSettings] = useState<Partial<QuotaConfig>>(() => {
    const config = getConfig();
    return {
      warningThreshold: config.warningThreshold,
      criticalThreshold: config.criticalThreshold,
      autoCleanup: config.autoCleanup,
      maxSavesToKeep: config.maxSavesToKeep,
      checkInterval: config.checkInterval / (1000 * 60), // Convert to minutes
    };
  });

  const handleSaveSettings = useCallback(() => {
    updateConfig({
      ...quotaSettings,
      checkInterval: (quotaSettings.checkInterval || 5) * 60 * 1000, // Convert to ms
    });

    // Show feedback
    alert('Settings saved successfully!');
  }, [quotaSettings, updateConfig]);

  const handleQuickCleanup = useCallback(async () => {
    if (!quotaStatus || !onSaveCleanup) return;

    setIsPerformingCleanup(true);

    try {
      // Suggest deleting oldest saves
      const oldestSaves = quotaStatus.saveBreakdown
        .sort((a, b) => {
          const aDate = a.lastPlayedAt || a.createdAt;
          const bDate = b.lastPlayedAt || b.createdAt;
          return aDate.getTime() - bDate.getTime();
        })
        .slice(0, Math.max(0, quotaStatus.totalSaves - 3)) // Keep newest 3
        .map(save => save.slotNumber);

      await onSaveCleanup(oldestSaves);

      // Refresh quota status
      await checkQuota();
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Cleanup failed. Please try again or manage saves manually.');
    } finally {
      setIsPerformingCleanup(false);
    }
  }, [quotaStatus, onSaveCleanup, checkQuota]);

  const handleCustomCleanup = useCallback(async () => {
    if (selectedSavesToDelete.size === 0 || !onSaveCleanup) return;

    setIsPerformingCleanup(true);

    try {
      await onSaveCleanup(Array.from(selectedSavesToDelete));
      setSelectedSavesToDelete(new Set());

      // Refresh quota status
      await checkQuota();
    } catch (error) {
      console.error('Custom cleanup failed:', error);
      alert('Cleanup failed. Please try again or manage saves manually.');
    } finally {
      setIsPerformingCleanup(false);
    }
  }, [selectedSavesToDelete, onSaveCleanup, checkQuota]);

  const handleNotificationAction = useCallback(
    (action: string, notificationId: string, data?: any) => {
      switch (action) {
        case 'cleanup':
          setActiveTab('cleanup');
          break;
        case 'manage':
          onManageSaves?.();
          break;
        case 'upgrade':
          // Handle upgrade logic (placeholder)
          alert('Upgrade functionality not implemented yet');
          break;
      }
    },
    [onManageSaves]
  );

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const dialogStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #2a2a3e, #1e1e2f)',
    borderRadius: '16px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    width: '90vw',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyle: React.CSSProperties = {
    padding: '20px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const tabStyle = (tab: TabType): React.CSSProperties => ({
    padding: '8px 16px',
    background: activeTab === tab ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
    color: activeTab === tab ? '#d4af37' : '#cccccc',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: activeTab === tab ? 'bold' : 'normal',
    transition: 'all 0.2s ease',
    position: 'relative',
  });

  return (
    <div style={overlayStyle} onClick={onClose}>
      <motion.div
        style={dialogStyle}
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div style={headerStyle}>
          <h2
            style={{
              color: '#d4af37',
              fontSize: '1.4rem',
              fontWeight: 'bold',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            💾 Storage Management
          </h2>

          <Button
            variant='ghost'
            size='sm'
            onClick={onClose}
            style={{ fontSize: '1.2rem', padding: '4px 8px' }}
          >
            ✕
          </Button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            padding: '0 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            gap: '4px',
          }}
        >
          <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button style={tabStyle('notifications')} onClick={() => setActiveTab('notifications')}>
            Notifications
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#ff6b6b',
                  color: '#ffffff',
                  fontSize: '0.6rem',
                  padding: '1px 4px',
                  borderRadius: '8px',
                  minWidth: '12px',
                  textAlign: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
          <button style={tabStyle('cleanup')} onClick={() => setActiveTab('cleanup')}>
            Cleanup
          </button>
          <button style={tabStyle('settings')} onClick={() => setActiveTab('settings')}>
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: '20px',
          }}
        >
          <AnimatePresence mode='wait'>
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key='overview'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <QuotaStatusIndicator
                  user={user}
                  cloudStorage={cloudStorage}
                  showDetails={true}
                  showActions={false}
                  onManageClick={onManageSaves}
                  onCleanupClick={() => setActiveTab('cleanup')}
                  style={{ margin: '0 auto' }}
                />

                {/* Quick Actions */}
                <div
                  style={{
                    marginTop: '20px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <Button
                    variant='primary'
                    onClick={() => setActiveTab('cleanup')}
                    disabled={!quotaStatus || quotaStatus.totalSaves === 0}
                  >
                    🧹 Clean Up Storage
                  </Button>
                  <Button variant='secondary' onClick={onManageSaves}>
                    ⚙️ Manage Saves
                  </Button>
                </div>

                {/* Suggestions */}
                {quotaStatus && getSuggestions().length > 0 && (
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '12px',
                      background: 'rgba(255, 193, 7, 0.1)',
                      border: '1px solid rgba(255, 193, 7, 0.3)',
                      borderRadius: '8px',
                    }}
                  >
                    <h4
                      style={{
                        color: '#ffd43b',
                        fontSize: '0.9rem',
                        margin: '0 0 8px 0',
                      }}
                    >
                      💡 Recommendations:
                    </h4>
                    {getSuggestions().map((suggestion, index) => (
                      <div
                        key={index}
                        style={{
                          color: '#ffd43b',
                          fontSize: '0.8rem',
                          marginBottom: '4px',
                        }}
                      >
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                key='notifications'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <QuotaNotificationsPanel
                  user={user}
                  cloudStorage={cloudStorage}
                  onNotificationAction={handleNotificationAction}
                  style={{ width: '100%', maxHeight: 'none' }}
                />
              </motion.div>
            )}

            {/* Cleanup Tab */}
            {activeTab === 'cleanup' && (
              <motion.div
                key='cleanup'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <h3
                  style={{
                    color: '#d4af37',
                    fontSize: '1.1rem',
                    marginBottom: '16px',
                  }}
                >
                  Clean Up Storage
                </h3>

                {/* Quick Cleanup */}
                <div
                  style={{
                    marginBottom: '24px',
                    padding: '16px',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                  }}
                >
                  <h4
                    style={{
                      color: '#ffffff',
                      fontSize: '1rem',
                      marginBottom: '8px',
                    }}
                  >
                    Quick Cleanup
                  </h4>
                  <p
                    style={{
                      color: '#cccccc',
                      fontSize: '0.85rem',
                      marginBottom: '12px',
                    }}
                  >
                    Automatically delete oldest saves, keeping only the 3 most recent ones.
                  </p>
                  <Button
                    variant='primary'
                    onClick={handleQuickCleanup}
                    disabled={isPerformingCleanup || !quotaStatus || quotaStatus.totalSaves <= 3}
                  >
                    {isPerformingCleanup ? 'Cleaning up...' : '🧹 Quick Clean'}
                  </Button>
                </div>

                {/* Custom Cleanup */}
                {quotaStatus && quotaStatus.saveBreakdown.length > 0 && (
                  <div>
                    <h4
                      style={{
                        color: '#ffffff',
                        fontSize: '1rem',
                        marginBottom: '12px',
                      }}
                    >
                      Custom Cleanup
                    </h4>
                    <p
                      style={{
                        color: '#cccccc',
                        fontSize: '0.85rem',
                        marginBottom: '12px',
                      }}
                    >
                      Select specific saves to delete:
                    </p>

                    <div
                      style={{
                        maxHeight: '200px',
                        overflow: 'auto',
                        marginBottom: '12px',
                      }}
                    >
                      {quotaStatus.saveBreakdown
                        .sort((a, b) => b.sizeBytes - a.sizeBytes)
                        .map(save => (
                          <div
                            key={save.slotNumber}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px',
                              background: selectedSavesToDelete.has(save.slotNumber)
                                ? 'rgba(255, 107, 107, 0.2)'
                                : 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '6px',
                              marginBottom: '4px',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              const newSelected = new Set(selectedSavesToDelete);
                              if (newSelected.has(save.slotNumber)) {
                                newSelected.delete(save.slotNumber);
                              } else {
                                newSelected.add(save.slotNumber);
                              }
                              setSelectedSavesToDelete(newSelected);
                            }}
                          >
                            <input
                              type='checkbox'
                              checked={selectedSavesToDelete.has(save.slotNumber)}
                              onChange={() => {}} // Handled by parent onClick
                              style={{ marginRight: '8px' }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  color: '#ffffff',
                                  fontSize: '0.85rem',
                                  fontWeight: 'bold',
                                }}
                              >
                                Slot {save.slotNumber}: {save.saveName}
                              </div>
                              <div
                                style={{
                                  color: '#999999',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {save.createdAt.toLocaleDateString()} •{' '}
                                {formatBytes(save.sizeBytes)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button
                        variant='destructive'
                        onClick={handleCustomCleanup}
                        disabled={selectedSavesToDelete.size === 0 || isPerformingCleanup}
                      >
                        {isPerformingCleanup
                          ? 'Deleting...'
                          : `Delete ${selectedSavesToDelete.size} saves`}
                      </Button>
                      <Button
                        variant='ghost'
                        onClick={() => setSelectedSavesToDelete(new Set())}
                        disabled={selectedSavesToDelete.size === 0}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key='settings'
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <h3
                  style={{
                    color: '#d4af37',
                    fontSize: '1.1rem',
                    marginBottom: '16px',
                  }}
                >
                  Quota Settings
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Warning Threshold */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        color: '#cccccc',
                        fontSize: '0.85rem',
                        marginBottom: '4px',
                      }}
                    >
                      Warning Threshold (%):
                    </label>
                    <input
                      type='number'
                      min='0'
                      max='100'
                      value={quotaSettings.warningThreshold}
                      onChange={e =>
                        setQuotaSettings(prev => ({
                          ...prev,
                          warningThreshold: parseInt(e.target.value),
                        }))
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: '#ffffff',
                      }}
                    />
                  </div>

                  {/* Critical Threshold */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        color: '#cccccc',
                        fontSize: '0.85rem',
                        marginBottom: '4px',
                      }}
                    >
                      Critical Threshold (%):
                    </label>
                    <input
                      type='number'
                      min='0'
                      max='100'
                      value={quotaSettings.criticalThreshold}
                      onChange={e =>
                        setQuotaSettings(prev => ({
                          ...prev,
                          criticalThreshold: parseInt(e.target.value),
                        }))
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: '#ffffff',
                      }}
                    />
                  </div>

                  {/* Auto Cleanup */}
                  <div>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#cccccc',
                        fontSize: '0.85rem',
                        gap: '8px',
                      }}
                    >
                      <input
                        type='checkbox'
                        checked={quotaSettings.autoCleanup}
                        onChange={e =>
                          setQuotaSettings(prev => ({
                            ...prev,
                            autoCleanup: e.target.checked,
                          }))
                        }
                      />
                      Enable automatic cleanup when quota exceeded
                    </label>
                  </div>

                  {/* Max Saves to Keep */}
                  {quotaSettings.autoCleanup && (
                    <div>
                      <label
                        style={{
                          display: 'block',
                          color: '#cccccc',
                          fontSize: '0.85rem',
                          marginBottom: '4px',
                        }}
                      >
                        Maximum saves to keep during cleanup:
                      </label>
                      <input
                        type='number'
                        min='1'
                        max='10'
                        value={quotaSettings.maxSavesToKeep}
                        onChange={e =>
                          setQuotaSettings(prev => ({
                            ...prev,
                            maxSavesToKeep: parseInt(e.target.value),
                          }))
                        }
                        style={{
                          width: '100%',
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          background: 'rgba(0, 0, 0, 0.3)',
                          color: '#ffffff',
                        }}
                      />
                    </div>
                  )}

                  {/* Check Interval */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        color: '#cccccc',
                        fontSize: '0.85rem',
                        marginBottom: '4px',
                      }}
                    >
                      Check interval (minutes):
                    </label>
                    <input
                      type='number'
                      min='1'
                      max='60'
                      value={quotaSettings.checkInterval}
                      onChange={e =>
                        setQuotaSettings(prev => ({
                          ...prev,
                          checkInterval: parseInt(e.target.value),
                        }))
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: '#ffffff',
                      }}
                    />
                  </div>

                  <Button
                    variant='primary'
                    onClick={handleSaveSettings}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Save Settings
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

QuotaManagementDialog.displayName = 'QuotaManagementDialog';

export default QuotaManagementDialog;
