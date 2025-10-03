/**
 * Cloud Save Manager Component
 * Comprehensive interface for managing cloud save operations, sync status, and settings
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { SaveSlotCard } from '../molecules/SaveSlotCard';
import { useAuth } from '../../hooks/useAuth';
import { useCloudSave } from '../../hooks/useCloudSave';
import { useSaveSystem } from '../../hooks/useSaveSystem';
import { useResponsive, useReducedMotion } from '../../hooks';
import { SaveSyncStatus, SaveSlotInfo, ConflictResolution } from '../../types/saveSystem';

interface CloudSaveManagerProps {
  /** Whether to show as modal dialog */
  isModal?: boolean;
  /** Modal close handler */
  onClose?: () => void;
  /** Custom CSS class */
  className?: string;
}

interface SyncOperation {
  type: 'backup' | 'restore' | 'sync' | 'conflict_resolve';
  slotNumber: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export const CloudSaveManager: React.FC<CloudSaveManagerProps> = ({
  isModal = false,
  onClose,
  className = ''
}) => {
  const { isAuthenticated, user } = useAuth();
  const { saveSlots, refreshSlots } = useSaveSystem();
  const {
    isInitialized,
    isOnline,
    lastSyncTime,
    syncInProgress,
    quota,
    backupToCloud,
    restoreFromCloud,
    syncSlot,
    resolveConflict,
    deleteCloudSave,
    triggerFullSync,
    triggerQuickSync
  } = useCloudSave();
  const { isMobile, isTablet } = useResponsive();
  const { animationConfig } = useReducedMotion();

  // Local state
  const [activeTab, setActiveTab] = useState<'overview' | 'slots' | 'sync' | 'settings'>('overview');
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [syncOperations, setSyncOperations] = useState<Map<number, SyncOperation>>(new Map());
  const [conflictResolution, setConflictResolution] = useState<ConflictResolution>('keep-newest');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Refresh save slots on mount and when cloud state changes
  useEffect(() => {
    // Only refresh if save system is actually initialized (not just the flag)
    // Add a small delay to ensure initialization is complete
    if (isAuthenticated && isInitialized) {
      const timeoutId = setTimeout(() => {
        refreshSlots().catch(err => {
          console.warn('Failed to refresh slots on mount:', err);
        });
      }, 100); // Small delay to ensure save system is fully ready

      return () => clearTimeout(timeoutId);
    }
  }, [refreshSlots, isAuthenticated, isInitialized]);

  // Computed values
  const cloudSaveSlots = useMemo(() =>
    saveSlots.filter(slot => !slot.isEmpty && slot.isCloudAvailable),
    [saveSlots]
  );

  const localOnlySlots = useMemo(() =>
    saveSlots.filter(slot => !slot.isEmpty && slot.isLocalAvailable && !slot.isCloudAvailable),
    [saveSlots]
  );

  const conflictSlots = useMemo(() =>
    saveSlots.filter(slot => slot.syncStatus === SaveSyncStatus.CONFLICT),
    [saveSlots]
  );

  const outOfSyncSlots = useMemo(() =>
    saveSlots.filter(slot =>
      [SaveSyncStatus.LOCAL_NEWER, SaveSyncStatus.CLOUD_NEWER, SaveSyncStatus.SYNC_FAILED].includes(slot.syncStatus)
    ),
    [saveSlots]
  );

  // Event handlers
  const handleSlotSelection = useCallback((slotNumber: number, selected: boolean) => {
    console.log('🎯 handleSlotSelection called:', { slotNumber, selected, currentSelectedSlots: Array.from(selectedSlots) });
    setSelectedSlots(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(slotNumber);
        console.log('✅ Added slot to selection:', slotNumber, 'New set:', Array.from(newSet));
      } else {
        newSet.delete(slotNumber);
        console.log('❌ Removed slot from selection:', slotNumber, 'New set:', Array.from(newSet));
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allSlotNumbers = saveSlots.filter(slot => !slot.isEmpty).map(slot => slot.slotNumber);
    setSelectedSlots(new Set(allSlotNumbers));
  }, [saveSlots]);

  const handleDeselectAll = useCallback(() => {
    setSelectedSlots(new Set());
  }, []);

  const trackSyncOperation = useCallback((slotNumber: number, operation: Omit<SyncOperation, 'slotNumber'>) => {
    setSyncOperations(prev => new Map(prev.set(slotNumber, { ...operation, slotNumber })));
  }, []);

  const handleCloudSync = useCallback(async (slotNumber: number) => {
    trackSyncOperation(slotNumber, { type: 'backup', status: 'in_progress', progress: 0 });

    try {
      // backupToCloud only accepts (slotNumber, saveName?) - no options object
      await backupToCloud(slotNumber);

      trackSyncOperation(slotNumber, { type: 'backup', status: 'completed', progress: 100 });
      setTimeout(() => setSyncOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(slotNumber);
        return newMap;
      }), 3000);

      await refreshSlots();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Backup failed';
      trackSyncOperation(slotNumber, { type: 'backup', status: 'failed', progress: 0, error: errorMessage });
    }
  }, [backupToCloud, refreshSlots, trackSyncOperation]);

  const handleCloudRestore = useCallback(async (slotNumber: number) => {
    trackSyncOperation(slotNumber, { type: 'restore', status: 'in_progress', progress: 0 });

    try {
      // restoreFromCloud only accepts (slotNumber) - no options object
      await restoreFromCloud(slotNumber);

      trackSyncOperation(slotNumber, { type: 'restore', status: 'completed', progress: 100 });
      setTimeout(() => setSyncOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(slotNumber);
        return newMap;
      }), 3000);

      await refreshSlots();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Restore failed';
      trackSyncOperation(slotNumber, { type: 'restore', status: 'failed', progress: 0, error: errorMessage });
    }
  }, [restoreFromCloud, refreshSlots, trackSyncOperation]);

  const handleConflictResolve = useCallback(async (slotNumber: number) => {
    trackSyncOperation(slotNumber, { type: 'conflict_resolve', status: 'in_progress', progress: 0 });

    try {
      await resolveConflict(slotNumber, conflictResolution);
      trackSyncOperation(slotNumber, { type: 'conflict_resolve', status: 'completed', progress: 100 });

      setTimeout(() => setSyncOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(slotNumber);
        return newMap;
      }), 3000);

      await refreshSlots();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Conflict resolution failed';
      trackSyncOperation(slotNumber, { type: 'conflict_resolve', status: 'failed', progress: 0, error: errorMessage });
    }
  }, [resolveConflict, conflictResolution, refreshSlots, trackSyncOperation]);

  const handleBatchSync = useCallback(async () => {
    if (selectedSlots.size === 0) return;

    const slots = Array.from(selectedSlots);

    for (const slotNumber of slots) {
      await handleCloudSync(slotNumber);
    }

    setSelectedSlots(new Set());
  }, [selectedSlots, handleCloudSync]);

  const handleFullSync = useCallback(async () => {
    try {
      await triggerFullSync();
      await refreshSlots();
    } catch (error) {
      console.error('Full sync failed:', error);
    }
  }, [triggerFullSync, refreshSlots]);

  const handleQuickSync = useCallback(async () => {
    try {
      await triggerQuickSync();
      await refreshSlots();
    } catch (error) {
      console.error('Quick sync failed:', error);
    }
  }, [triggerQuickSync, refreshSlots]);

  const handleDeleteCloudSave = useCallback(async (slotNumber: number, deleteLocalToo: boolean = true) => {
    // Show confirmation dialog
    const confirmMessage = deleteLocalToo
      ? `Delete save slot ${slotNumber + 1} from both cloud and local storage?`
      : `Delete save slot ${slotNumber + 1} from cloud storage only?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    trackSyncOperation(slotNumber, { type: 'backup', status: 'in_progress', progress: 0 });

    try {
      const result = await deleteCloudSave(slotNumber, deleteLocalToo);

      if (result.success) {
        trackSyncOperation(slotNumber, { type: 'backup', status: 'completed', progress: 100 });

        setTimeout(() => setSyncOperations(prev => {
          const newMap = new Map(prev);
          newMap.delete(slotNumber);
          return newMap;
        }), 2000);

        await refreshSlots();
      } else {
        throw new Error(result.error?.message || 'Delete failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cloud save deletion failed';
      trackSyncOperation(slotNumber, { type: 'backup', status: 'failed', progress: 0, error: errorMessage });
    }
  }, [deleteCloudSave, refreshSlots, trackSyncOperation]);

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className={`cloud-save-manager ${className}`}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          textAlign: 'center',
          minHeight: '400px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>☁️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>
            Sign In Required
          </h2>
          <p style={{ color: '#cccccc', marginBottom: '24px', maxWidth: '400px' }}>
            Sign in to your account to access cloud save management features and synchronize your game progress across devices.
          </p>
          <Button variant="primary" onClick={() => {/* Open auth modal */}}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1e1e2f, #2a2a3e)',
    borderRadius: isModal ? '12px' : '0',
    padding: '24px',
    maxWidth: isModal ? '900px' : '100%',
    width: '100%',
    maxHeight: isModal ? '80vh' : 'auto',
    overflow: 'auto',
    position: 'relative'
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: isMobile ? '8px 12px' : '12px 16px',
    borderRadius: '8px',
    background: isActive ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
    border: `1px solid ${isActive ? 'rgba(212, 175, 55, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
    color: isActive ? '#d4af37' : '#cccccc',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontSize: isMobile ? '0.85rem' : '0.9rem',
    fontWeight: isActive ? '600' : '400'
  });

  return (
    <motion.div
      className={`cloud-save-manager ${className}`}
      style={containerStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={animationConfig}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
            Cloud Save Manager
          </h1>
          <p style={{ color: '#cccccc', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Manage and synchronize your game saves across devices
          </p>
        </div>
        {isModal && onClose && (
          <Button variant="ghost" onClick={onClose} style={{ padding: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>✕</span>
          </Button>
        )}
      </div>

      {/* Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
        padding: '12px 16px',
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '8px',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isOnline ? '#4caf50' : '#f44336'
          }} />
          <span style={{ color: isOnline ? '#4caf50' : '#f44336' }}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {lastSyncTime && (
          <div style={{ color: '#cccccc' }}>
            Last sync: {new Date(lastSyncTime).toLocaleString()}
          </div>
        )}

        {quota && (
          <div style={{ color: '#cccccc' }}>
            Storage: {Math.round(quota.usedBytes / 1024 / 1024)}MB / {Math.round(quota.totalBytes / 1024 / 1024)}MB
          </div>
        )}

        {syncInProgress && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2196f3' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              🔄
            </motion.div>
            <span>Syncing...</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '16px'
      }}>
        {(['overview', 'slots', 'sync', 'settings'] as const).map(tab => (
          <motion.button
            key={tab}
            style={tabStyle(activeTab === tab)}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'slots' && '💾 Save Slots'}
            {tab === 'sync' && '🔄 Sync Operations'}
            {tab === 'settings' && '⚙️ Settings'}
          </motion.button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={animationConfig}
            style={{ minHeight: '300px' }}
          >
            {/* Overview content will be implemented here */}
            <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              {/* Summary Cards */}
              <div style={{
                padding: '16px',
                background: 'rgba(76, 175, 80, 0.1)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#4caf50', margin: '0 0 8px 0' }}>Cloud Saves</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffffff' }}>
                  {cloudSaveSlots.length}
                </div>
                <p style={{ color: '#cccccc', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Saved to cloud storage
                </p>
              </div>

              <div style={{
                padding: '16px',
                background: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#2196f3', margin: '0 0 8px 0' }}>Local Only</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffffff' }}>
                  {localOnlySlots.length}
                </div>
                <p style={{ color: '#cccccc', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Not backed up
                </p>
              </div>

              <div style={{
                padding: '16px',
                background: 'rgba(255, 87, 34, 0.1)',
                border: '1px solid rgba(255, 87, 34, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#ff5722', margin: '0 0 8px 0' }}>Conflicts</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffffff' }}>
                  {conflictSlots.length}
                </div>
                <p style={{ color: '#cccccc', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Need resolution
                </p>
              </div>

              <div style={{
                padding: '16px',
                background: 'rgba(255, 152, 0, 0.1)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#ff9800', margin: '0 0 8px 0' }}>Out of Sync</h3>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffffff' }}>
                  {outOfSyncSlots.length}
                </div>
                <p style={{ color: '#cccccc', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  Need synchronization
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>Quick Actions</h3>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  onClick={handleFullSync}
                  disabled={syncInProgress || !isOnline}
                  style={{ minWidth: '140px' }}
                >
                  🔄 Full Sync
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleQuickSync}
                  disabled={syncInProgress || !isOnline}
                  style={{ minWidth: '140px' }}
                >
                  ⚡ Quick Sync
                </Button>
                {localOnlySlots.length > 0 && (
                  <Button
                    variant="accent"
                    onClick={() => {
                      setSelectedSlots(new Set(localOnlySlots.map(slot => slot.slotNumber)));
                      setActiveTab('slots');
                    }}
                    style={{ minWidth: '140px' }}
                  >
                    ☁️ Backup All Local
                  </Button>
                )}
                {conflictSlots.length > 0 && (
                  <Button
                    variant="warning"
                    onClick={() => setActiveTab('sync')}
                    style={{ minWidth: '140px' }}
                  >
                    ⚠️ Resolve Conflicts
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'sync' && (
          <motion.div
            key="sync"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={animationConfig}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Conflict Resolution Settings */}
              <div style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>Conflict Resolution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="conflictResolution"
                      value="keep-local"
                      checked={conflictResolution === 'keep-local'}
                      onChange={(e) => setConflictResolution(e.target.value as ConflictResolution)}
                    />
                    <span style={{ color: '#cccccc' }}>Keep Local Version</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="conflictResolution"
                      value="keep-cloud"
                      checked={conflictResolution === 'keep-cloud'}
                      onChange={(e) => setConflictResolution(e.target.value as ConflictResolution)}
                    />
                    <span style={{ color: '#cccccc' }}>Keep Cloud Version</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="conflictResolution"
                      value="keep-newest"
                      checked={conflictResolution === 'keep-newest'}
                      onChange={(e) => setConflictResolution(e.target.value as ConflictResolution)}
                    />
                    <span style={{ color: '#cccccc' }}>Keep Newest Version (Recommended)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="conflictResolution"
                      value="manual"
                      checked={conflictResolution === 'manual'}
                      onChange={(e) => setConflictResolution(e.target.value as ConflictResolution)}
                    />
                    <span style={{ color: '#cccccc' }}>Manual Review Required</span>
                  </label>
                </div>
              </div>

              {/* Conflict Slots */}
              {conflictSlots.length > 0 && (
                <div>
                  <h3 style={{ color: '#ff5722', marginBottom: '16px' }}>
                    ⚠️ Conflicts Requiring Resolution ({conflictSlots.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {conflictSlots.map(slot => (
                      <div
                        key={slot.slotNumber}
                        style={{
                          padding: '16px',
                          background: 'rgba(255, 87, 34, 0.1)',
                          border: '1px solid rgba(255, 87, 34, 0.3)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ color: '#ffffff', fontWeight: '600' }}>
                            Slot {slot.slotNumber + 1}
                          </div>
                          <div style={{ color: '#cccccc', fontSize: '0.85rem' }}>
                            {slot.playerSummary?.name} - Level {slot.playerSummary?.level}
                          </div>
                          <div style={{ color: '#ff5722', fontSize: '0.75rem', marginTop: '4px' }}>
                            Local and cloud versions differ
                          </div>
                        </div>
                        <Button
                          variant="warning"
                          size="small"
                          onClick={() => handleConflictResolve(slot.slotNumber)}
                          disabled={syncInProgress || !isOnline}
                        >
                          Resolve
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
                    <Button
                      variant="warning"
                      onClick={() => {
                        conflictSlots.forEach(slot => handleConflictResolve(slot.slotNumber));
                      }}
                      disabled={syncInProgress || !isOnline || conflictSlots.length === 0}
                    >
                      Resolve All Conflicts
                    </Button>
                  </div>
                </div>
              )}

              {/* Out of Sync Slots */}
              {outOfSyncSlots.length > 0 && (
                <div>
                  <h3 style={{ color: '#ff9800', marginBottom: '16px' }}>
                    🔄 Out of Sync Saves ({outOfSyncSlots.length})
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {outOfSyncSlots.map(slot => (
                      <div
                        key={slot.slotNumber}
                        style={{
                          padding: '16px',
                          background: 'rgba(255, 152, 0, 0.1)',
                          border: '1px solid rgba(255, 152, 0, 0.3)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ color: '#ffffff', fontWeight: '600' }}>
                            Slot {slot.slotNumber + 1}
                          </div>
                          <div style={{ color: '#cccccc', fontSize: '0.85rem' }}>
                            {slot.playerSummary?.name} - Level {slot.playerSummary?.level}
                          </div>
                          <div style={{ color: '#ff9800', fontSize: '0.75rem', marginTop: '4px' }}>
                            {slot.syncStatus === SaveSyncStatus.LOCAL_NEWER && 'Local version is newer'}
                            {slot.syncStatus === SaveSyncStatus.CLOUD_NEWER && 'Cloud version is newer'}
                            {slot.syncStatus === SaveSyncStatus.SYNC_FAILED && 'Sync failed - retry needed'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {slot.syncStatus === SaveSyncStatus.LOCAL_NEWER && (
                            <Button
                              variant="primary"
                              size="small"
                              onClick={() => handleCloudSync(slot.slotNumber)}
                              disabled={syncInProgress || !isOnline}
                            >
                              Upload
                            </Button>
                          )}
                          {slot.syncStatus === SaveSyncStatus.CLOUD_NEWER && (
                            <Button
                              variant="secondary"
                              size="small"
                              onClick={() => handleCloudRestore(slot.slotNumber)}
                              disabled={syncInProgress || !isOnline}
                            >
                              Download
                            </Button>
                          )}
                          {slot.syncStatus === SaveSyncStatus.SYNC_FAILED && (
                            <Button
                              variant="accent"
                              size="small"
                              onClick={() => handleCloudSync(slot.slotNumber)}
                              disabled={syncInProgress || !isOnline}
                            >
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sync All Actions */}
              <div style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>Bulk Operations</h3>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Button
                    variant="primary"
                    onClick={handleFullSync}
                    disabled={syncInProgress || !isOnline}
                  >
                    🔄 Full Sync (All Saves)
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleQuickSync}
                    disabled={syncInProgress || !isOnline}
                  >
                    ⚡ Quick Sync (Changed Only)
                  </Button>
                  {localOnlySlots.length > 0 && (
                    <Button
                      variant="accent"
                      onClick={() => {
                        localOnlySlots.forEach(slot => handleCloudSync(slot.slotNumber));
                      }}
                      disabled={syncInProgress || !isOnline}
                    >
                      ☁️ Backup All Local ({localOnlySlots.length})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={animationConfig}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Auto-sync Settings */}
              <div style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>Auto-Sync Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={autoSyncEnabled}
                      onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                    />
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: '500' }}>Enable Auto-Sync</div>
                      <div style={{ color: '#cccccc', fontSize: '0.85rem' }}>
                        Automatically sync saves when changes are detected
                      </div>
                    </div>
                  </label>

                  {autoSyncEnabled && (
                    <div style={{ marginLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked />
                        <span style={{ color: '#cccccc' }}>Sync on game save</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked />
                        <span style={{ color: '#cccccc' }}>Sync on app startup</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked />
                        <span style={{ color: '#cccccc' }}>Sync on app close</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="checkbox" />
                        <span style={{ color: '#cccccc' }}>Periodic sync (every 30 minutes)</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Advanced Options */}
              <div style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ color: '#ffffff', margin: 0 }}>Advanced Options</h3>
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  >
                    {showAdvancedOptions ? '▼' : '▶'} {showAdvancedOptions ? 'Hide' : 'Show'}
                  </Button>
                </div>

                {showAdvancedOptions && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked />
                      <div>
                        <div style={{ color: '#ffffff' }}>Compress cloud saves</div>
                        <div style={{ color: '#cccccc', fontSize: '0.8rem' }}>Reduces storage usage and transfer time</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" defaultChecked />
                      <div>
                        <div style={{ color: '#ffffff' }}>Enable sync notifications</div>
                        <div style={{ color: '#cccccc', fontSize: '0.8rem' }}>Show notifications for sync events</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" />
                      <div>
                        <div style={{ color: '#ffffff' }}>Sync in background</div>
                        <div style={{ color: '#cccccc', fontSize: '0.8rem' }}>Continue syncing when game is minimized</div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" />
                      <div>
                        <div style={{ color: '#ffffff' }}>Upload screenshots</div>
                        <div style={{ color: '#cccccc', fontSize: '0.8rem' }}>Include save thumbnails in cloud backup</div>
                      </div>
                    </label>

                    <div style={{ marginTop: '8px' }}>
                      <label style={{ color: '#ffffff', display: 'block', marginBottom: '8px' }}>
                        Max concurrent syncs:
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        defaultValue="3"
                        style={{ width: '100%' }}
                      />
                      <div style={{ color: '#cccccc', fontSize: '0.8rem', textAlign: 'center' }}>
                        1 (Slower) ← → 5 (Faster, more bandwidth)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Storage Info */}
              <div style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>Storage Information</h3>
                {quota && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#cccccc' }}>Used Storage:</span>
                      <span style={{ color: '#ffffff' }}>
                        {Math.round(quota.usedBytes / 1024 / 1024)}MB / {Math.round(quota.totalBytes / 1024 / 1024)}MB
                      </span>
                    </div>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        width: `${(quota.usedBytes / quota.totalBytes) * 100}%`,
                        height: '100%',
                        background: quota.usedBytes / quota.totalBytes > 0.8 ? '#f44336' :
                                  quota.usedBytes / quota.totalBytes > 0.6 ? '#ff9800' : '#4caf50',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <div style={{ color: '#cccccc', fontSize: '0.8rem' }}>
                      {Math.round(quota.remainingBytes / 1024 / 1024)}MB remaining
                    </div>
                  </div>
                )}
              </div>

              {/* Account Info */}
              <div style={{
                padding: '16px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>Account Information</h3>
                {user && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cccccc' }}>Email:</span>
                      <span style={{ color: '#ffffff' }}>{user.email}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cccccc' }}>Account Created:</span>
                      <span style={{ color: '#ffffff' }}>
                        {user.metadata.creationTime && new Date(user.metadata.creationTime).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#cccccc' }}>Email Verified:</span>
                      <span style={{ color: user.emailVerified ? '#4caf50' : '#f44336' }}>
                        {user.emailVerified ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div style={{
                padding: '16px',
                background: 'rgba(244, 67, 54, 0.1)',
                border: '1px solid rgba(244, 67, 54, 0.3)',
                borderRadius: '8px'
              }}>
                <h3 style={{ color: '#f44336', marginBottom: '16px' }}>⚠️ Danger Zone</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all cloud saves? This action cannot be undone.')) {
                        // Clear all cloud saves
                      }
                    }}
                    style={{ color: '#f44336', border: '1px solid #f44336' }}
                  >
                    🗑️ Clear All Cloud Saves
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Are you sure you want to reset sync settings? This will return all settings to defaults.')) {
                        setAutoSyncEnabled(true);
                        setConflictResolution('keep-newest');
                        setShowAdvancedOptions(false);
                      }
                    }}
                    style={{ color: '#f44336', border: '1px solid #f44336' }}
                  >
                    🔄 Reset Settings
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'slots' && (
          <motion.div
            key="slots"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={animationConfig}
          >
            {/* Empty state message when no saves exist */}
            {saveSlots.every(slot => slot.isEmpty) && (
              <div style={{
                padding: '32px 24px',
                background: 'rgba(33, 150, 243, 0.1)',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💾</div>
                <h3 style={{ color: '#2196f3', marginBottom: '12px', fontSize: '1.2rem' }}>
                  No Saved Games Found
                </h3>
                <p style={{ color: '#cccccc', marginBottom: '16px', maxWidth: '500px', margin: '0 auto 16px' }}>
                  The Cloud Save Manager syncs your existing saved games to cloud storage.
                  To create a save, start a new game and save your progress from the main menu.
                </p>
                <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setActiveTab('overview')}
                  >
                    View Overview
                  </Button>
                </div>
              </div>
            )}

            {/* Show slots only if at least one save exists */}
            {!saveSlots.every(slot => slot.isEmpty) && (
              <>
                {/* Slot selection controls */}
                <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#cccccc' }}>
                {selectedSlots.size} slot{selectedSlots.size !== 1 ? 's' : ''} selected
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="ghost" size="small" onClick={handleSelectAll}>
                  Select All
                </Button>
                <Button variant="ghost" size="small" onClick={handleDeselectAll}>
                  Clear
                </Button>
                {selectedSlots.size > 0 && (
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleBatchSync}
                    disabled={syncInProgress || !isOnline}
                  >
                    Sync Selected
                  </Button>
                )}
              </div>
            </div>

            {/* Save slots grid */}
            <div style={{
              display: 'grid',
              gap: '16px',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))'
            }}>
              {saveSlots.map(slot => {
                const operation = syncOperations.get(slot.slotNumber);
                const isSelected = selectedSlots.has(slot.slotNumber);
                const isOperating = operation?.status === 'in_progress';

                return (
                  <motion.div
                    key={slot.slotNumber}
                    style={{
                      position: 'relative',
                      border: `2px solid ${isSelected ? '#d4af37' : 'transparent'}`,
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <SaveSlotCard
                      slotInfo={slot}
                      isSelected={isSelected}
                      isLoading={isOperating}
                      onLoad={() => handleSlotSelection(slot.slotNumber, !isSelected)}
                      onCloudSync={() => handleCloudSync(slot.slotNumber)}
                      onCloudRestore={() => handleCloudRestore(slot.slotNumber)}
                      onConflictResolve={() => handleConflictResolve(slot.slotNumber)}
                      onDelete={() => handleDeleteCloudSave(slot.slotNumber)}
                    />

                    {/* Operation Progress */}
                    {operation && (
                      <div style={{
                        position: 'absolute',
                        bottom: '0',
                        left: '0',
                        right: '0',
                        background: 'rgba(0, 0, 0, 0.8)',
                        padding: '8px',
                        fontSize: '0.75rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{ color: '#ffffff' }}>
                            {operation.type.replace('_', ' ')}
                          </span>
                          <span style={{
                            color: operation.status === 'failed' ? '#f44336' :
                                  operation.status === 'completed' ? '#4caf50' : '#2196f3'
                          }}>
                            {operation.status}
                          </span>
                        </div>
                        {operation.status === 'in_progress' && (
                          <div style={{
                            width: '100%',
                            height: '4px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${operation.progress}%`,
                              height: '100%',
                              background: '#2196f3',
                              transition: 'width 0.2s ease'
                            }} />
                          </div>
                        )}
                        {operation.error && (
                          <div style={{ color: '#f44336', fontSize: '0.7rem', marginTop: '4px' }}>
                            {operation.error}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CloudSaveManager;