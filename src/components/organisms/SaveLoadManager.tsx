/**
 * Save/Load Manager Component
 * Complete interface for managing game saves with progress indicators and error handling
 */

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { SaveSlotCard } from '../molecules/SaveSlotCard';
import { useSaveSystem, useGameState, useResponsive, useReducedMotion } from '../../hooks';
import { useAuth } from '../../hooks/useAuth';
import { useCloudSave } from '../../hooks/useCloudSave';
import { SaveOperationOptions, SaveSyncStatus } from '../../types/saveSystem';

interface SaveLoadManagerProps {
  mode: 'save' | 'load' | 'manage';
  onClose?: () => void;
  onSaveComplete?: (slotNumber: number) => void;
  onLoadComplete?: (slotNumber: number) => void;
  className?: string;
}

export const SaveLoadManager: React.FC<SaveLoadManagerProps> = ({
  mode,
  onClose,
  onSaveComplete,
  onLoadComplete,
  className = '',
}) => {
  const {
    isInitialized,
    saveSlots,
    isLoading,
    error,
    saveProgress,
    loadProgress,
    storagePercentage,
    saveGame,
    loadGame,
    deleteSave,
    exportSave,
    importSave,
    refreshSlots,
  } = useSaveSystem();

  const { state: gameState, updateGameState } = useGameState();
  const { isMobile, isTablet } = useResponsive();
  const { animationConfig } = useReducedMotion();

  // Cloud save hooks
  const { isAuthenticated } = useAuth();
  const {
    isOnline,
    syncInProgress,
    backupToCloud,
    restoreFromCloud,
    resolveConflict,
    triggerFullSync,
  } = useCloudSave();

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [saveName, setSaveName] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);
  const [cloudOperations, setCloudOperations] = useState<
    Map<number, { type: string; progress: number; status: string }>
  >(new Map());
  const [showCloudOptions, setShowCloudOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(
    async (slotNumber: number) => {
      if (!gameState || !isInitialized) return;

      const options: SaveOperationOptions = {
        slotNumber,
        saveName: saveName || `Save ${slotNumber + 1}`,
        includeScreenshot: true,
        syncToCloud: false,
      };

      const success = await saveGame(gameState, options);
      if (success) {
        onSaveComplete?.(slotNumber);
        setSaveName('');
      }
    },
    [gameState, isInitialized, saveName, saveGame, onSaveComplete]
  );

  const handleLoad = useCallback(
    async (slotNumber: number) => {
      if (!isInitialized) return;

      const loadedState = await loadGame({
        slotNumber,
        validate: true,
        updateAccessTime: true,
      });

      if (loadedState) {
        // CRITICAL FIX: Dispatch the loaded state to React context
        await updateGameState(loadedState);
        onLoadComplete?.(slotNumber);
      }
    },
    [isInitialized, loadGame, onLoadComplete, updateGameState]
  );

  const handleDelete = useCallback(
    async (slotNumber: number) => {
      if (!isInitialized) return;

      const success = await deleteSave(slotNumber);
      if (success) {
        setShowConfirmDelete(null);
        await refreshSlots();
      }
    },
    [isInitialized, deleteSave, refreshSlots]
  );

  const handleExport = useCallback(
    async (slotNumber: number) => {
      if (!isInitialized) return;

      const blob = await exportSave(slotNumber, {
        format: 'json',
        includeMetadata: true,
        filename: `sawyers_rpg_save_${slotNumber + 1}.json`,
      });

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sawyers_rpg_save_${slotNumber + 1}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    },
    [isInitialized, exportSave]
  );

  const handleImport = useCallback(
    async (slotNumber: number) => {
      if (!fileInputRef.current || !isInitialized) return;

      fileInputRef.current.onchange = async e => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        const result = await importSave(file, slotNumber);
        if (result.success) {
          await refreshSlots();
        }
      };

      fileInputRef.current.click();
    },
    [isInitialized, importSave, refreshSlots]
  );

  // Cloud save handlers
  const trackCloudOperation = useCallback(
    (slotNumber: number, type: string, progress: number, status: string) => {
      setCloudOperations(prev => new Map(prev.set(slotNumber, { type, progress, status })));
    },
    []
  );

  const handleCloudBackup = useCallback(
    async (slotNumber: number) => {
      if (!isAuthenticated || !isOnline) return;

      trackCloudOperation(slotNumber, 'backup', 0, 'Starting backup...');

      try {
        await backupToCloud(slotNumber, {
          overwriteNewer: false,
          progressCallback: progress => {
            trackCloudOperation(slotNumber, 'backup', progress.percentage, progress.status);
          },
        });

        trackCloudOperation(slotNumber, 'backup', 100, 'Backup completed');
        setTimeout(() => {
          setCloudOperations(prev => {
            const newMap = new Map(prev);
            newMap.delete(slotNumber);
            return newMap;
          });
        }, 3000);

        await refreshSlots();
      } catch (error) {
        trackCloudOperation(
          slotNumber,
          'backup',
          0,
          `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [isAuthenticated, isOnline, backupToCloud, refreshSlots, trackCloudOperation]
  );

  const handleCloudRestore = useCallback(
    async (slotNumber: number) => {
      if (!isAuthenticated || !isOnline) return;

      trackCloudOperation(slotNumber, 'restore', 0, 'Starting restore...');

      try {
        await restoreFromCloud(slotNumber, {
          overwriteLocal: true,
          progressCallback: progress => {
            trackCloudOperation(slotNumber, 'restore', progress.percentage, progress.status);
          },
        });

        trackCloudOperation(slotNumber, 'restore', 100, 'Restore completed');
        setTimeout(() => {
          setCloudOperations(prev => {
            const newMap = new Map(prev);
            newMap.delete(slotNumber);
            return newMap;
          });
        }, 3000);

        await refreshSlots();
      } catch (error) {
        trackCloudOperation(
          slotNumber,
          'restore',
          0,
          `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [isAuthenticated, isOnline, restoreFromCloud, refreshSlots, trackCloudOperation]
  );

  const handleConflictResolve = useCallback(
    async (slotNumber: number) => {
      if (!isAuthenticated || !isOnline) return;

      trackCloudOperation(slotNumber, 'resolve', 0, 'Resolving conflict...');

      try {
        await resolveConflict(slotNumber, 'keep-newest');
        trackCloudOperation(slotNumber, 'resolve', 100, 'Conflict resolved');

        setTimeout(() => {
          setCloudOperations(prev => {
            const newMap = new Map(prev);
            newMap.delete(slotNumber);
            return newMap;
          });
        }, 3000);

        await refreshSlots();
      } catch (error) {
        trackCloudOperation(
          slotNumber,
          'resolve',
          0,
          `Resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    },
    [isAuthenticated, isOnline, resolveConflict, refreshSlots, trackCloudOperation]
  );

  const handleFullCloudSync = useCallback(async () => {
    if (!isAuthenticated || !isOnline) return;

    try {
      await triggerFullSync();
      await refreshSlots();
    } catch (error) {
      console.error('Full sync failed:', error);
    }
  }, [isAuthenticated, isOnline, triggerFullSync, refreshSlots]);

  if (!isInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          gap: '16px',
        }}
      >
        <LoadingSpinner size='large' />
        <p style={{ color: '#cccccc' }}>Initializing save system...</p>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: isMobile ? '16px' : '24px',
    maxWidth: '800px',
    margin: '0 auto',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
    borderRadius: '16px',
    border: '2px solid rgba(212, 175, 55, 0.3)',
    minHeight: isMobile ? '400px' : '500px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '1.5rem' : '1.8rem',
    fontWeight: 'bold',
    color: '#d4af37',
    margin: 0,
  };

  const progressStyle: React.CSSProperties = {
    background: 'rgba(212, 175, 55, 0.1)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  };

  return (
    <motion.div
      className={className}
      style={containerStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={animationConfig}
    >
      {/* Header */}
      <div style={headerStyle}>
        <h2 style={titleStyle}>
          {mode === 'save' && 'Save Game'}
          {mode === 'load' && 'Load Game'}
          {mode === 'manage' && 'Manage Saves'}
        </h2>
        {onClose && (
          <Button
            variant='ghost'
            size='small'
            onClick={onClose}
            style={{ minWidth: 'auto', padding: '8px' }}
          >
            ✕
          </Button>
        )}
      </div>

      {/* Storage Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: '#aaaaaa',
          padding: '8px 0',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
        }}
      >
        <span>Storage: {storagePercentage.toFixed(1)}% used</span>
        <span>
          {saveSlots.filter(slot => !slot.isEmpty).length} / {saveSlots.length} slots
        </span>
      </div>

      {/* Cloud Status & Controls */}
      {isAuthenticated && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            background: isOnline ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            border: `1px solid ${isOnline ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
            borderRadius: '8px',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: isOnline ? '#4caf50' : '#f44336',
                }}
              />
              <span style={{ color: isOnline ? '#4caf50' : '#f44336' }}>
                Cloud {isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
            {syncInProgress && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2196f3' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  🔄
                </motion.div>
                <span>Syncing...</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant='ghost'
              size='small'
              onClick={() => setShowCloudOptions(!showCloudOptions)}
              disabled={!isOnline}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              {showCloudOptions ? '▼ Hide' : '▶ Show'} Cloud Options
            </Button>
            <Button
              variant='primary'
              size='small'
              onClick={handleFullCloudSync}
              disabled={!isOnline || syncInProgress}
              style={{ fontSize: '0.75rem', padding: '4px 8px' }}
            >
              🔄 Sync All
            </Button>
          </div>
        </div>
      )}

      {/* Cloud Options Panel */}
      <AnimatePresence>
        {isAuthenticated && showCloudOptions && (
          <motion.div
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div style={{ color: '#ffffff', fontWeight: '600', marginBottom: '8px' }}>
              Bulk Cloud Operations
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Button
                variant='secondary'
                size='small'
                onClick={() => {
                  saveSlots
                    .filter(
                      slot => !slot.isEmpty && slot.isLocalAvailable && !slot.isCloudAvailable
                    )
                    .forEach(slot => handleCloudBackup(slot.slotNumber));
                }}
                disabled={!isOnline || syncInProgress}
                style={{ fontSize: '0.75rem' }}
              >
                ☁️↑ Backup All Local
              </Button>
              <Button
                variant='secondary'
                size='small'
                onClick={() => {
                  saveSlots
                    .filter(slot => slot.syncStatus === SaveSyncStatus.CLOUD_NEWER)
                    .forEach(slot => handleCloudRestore(slot.slotNumber));
                }}
                disabled={!isOnline || syncInProgress}
                style={{ fontSize: '0.75rem' }}
              >
                ☁️↓ Download All Newer
              </Button>
              <Button
                variant='warning'
                size='small'
                onClick={() => {
                  saveSlots
                    .filter(slot => slot.syncStatus === SaveSyncStatus.CONFLICT)
                    .forEach(slot => handleConflictResolve(slot.slotNumber));
                }}
                disabled={!isOnline || syncInProgress}
                style={{ fontSize: '0.75rem' }}
              >
                ⚠️ Resolve All Conflicts
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <AnimatePresence>
        {(saveProgress.isActive || loadProgress.isActive) && (
          <motion.div
            style={progressStyle}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LoadingSpinner size='small' />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#ffffff', marginBottom: '4px' }}>
                {saveProgress.isActive ? saveProgress.status : loadProgress.status}
              </div>
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  borderRadius: '4px',
                  height: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: '#d4af37',
                    height: '100%',
                    width: `${saveProgress.isActive ? saveProgress.progress : loadProgress.progress}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            style={{
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid #ff6b6b',
              borderRadius: '8px',
              padding: '12px',
              color: '#ff6b6b',
            }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Name Input (for save mode) */}
      {mode === 'save' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ color: '#cccccc', fontSize: '0.9rem' }}>Save Name (optional):</label>
          <input
            type='text'
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            placeholder='Enter save name...'
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
        </div>
      )}

      {/* Save Slots Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: '16px',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        {saveSlots.map((slot, index) => {
          const cloudOperation = cloudOperations.get(slot.slotNumber);
          const isCloudOperating = cloudOperation !== undefined;

          return (
            <div key={slot.slotNumber} style={{ position: 'relative' }}>
              <SaveSlotCard
                slotInfo={slot}
                isSelected={selectedSlot === slot.slotNumber}
                isLoading={isLoading || isCloudOperating}
                onLoad={mode !== 'save' ? () => handleLoad(slot.slotNumber) : undefined}
                onSave={
                  mode === 'save' || slot.isEmpty ? () => handleSave(slot.slotNumber) : undefined
                }
                onDelete={
                  mode === 'manage' && !slot.isEmpty
                    ? () => setShowConfirmDelete(slot.slotNumber)
                    : undefined
                }
                onExport={
                  mode === 'manage' && !slot.isEmpty
                    ? () => handleExport(slot.slotNumber)
                    : undefined
                }
                onCloudSync={
                  isAuthenticated && isOnline ? () => handleCloudBackup(slot.slotNumber) : undefined
                }
                onCloudRestore={
                  isAuthenticated && isOnline
                    ? () => handleCloudRestore(slot.slotNumber)
                    : undefined
                }
                onConflictResolve={
                  isAuthenticated && isOnline
                    ? () => handleConflictResolve(slot.slotNumber)
                    : undefined
                }
              />

              {/* Cloud Operation Progress Overlay */}
              {cloudOperation && (
                <motion.div
                  style={{
                    position: 'absolute',
                    bottom: '0',
                    left: '0',
                    right: '0',
                    background: 'rgba(0, 0, 0, 0.9)',
                    padding: '8px 12px',
                    borderRadius: '0 0 8px 8px',
                    fontSize: '0.75rem',
                    zIndex: 5,
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ color: '#ffffff', textTransform: 'capitalize' }}>
                      {cloudOperation.type}ing...
                    </span>
                    <span style={{ color: '#2196f3' }}>{cloudOperation.progress}%</span>
                  </div>

                  {cloudOperation.progress > 0 && cloudOperation.progress < 100 && (
                    <div
                      style={{
                        width: '100%',
                        height: '3px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        marginBottom: '4px',
                      }}
                    >
                      <motion.div
                        style={{
                          height: '100%',
                          background: '#2196f3',
                          borderRadius: '2px',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${cloudOperation.progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}

                  <div
                    style={{
                      color: cloudOperation.status.includes('failed')
                        ? '#f44336'
                        : cloudOperation.status.includes('completed')
                          ? '#4caf50'
                          : '#cccccc',
                      fontSize: '0.7rem',
                    }}
                  >
                    {cloudOperation.status}
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {mode === 'manage' && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            paddingTop: '16px',
            borderTop: '1px solid rgba(212, 175, 55, 0.2)',
          }}
        >
          <Button
            variant='secondary'
            size={isMobile ? 'md' : 'large'}
            onClick={() => handleImport(selectedSlot || 0)}
            disabled={selectedSlot === null}
          >
            Import Save
          </Button>
          <Button
            variant='secondary'
            size={isMobile ? 'md' : 'large'}
            onClick={() => refreshSlots()}
          >
            Refresh
          </Button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDelete !== null && (
          <motion.div
            style={{
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
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={{
                background: 'linear-gradient(135deg, #2a2a3e, #1e1e2f)',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '400px',
                margin: '16px',
                border: '2px solid rgba(212, 175, 55, 0.3)',
              }}
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <h3 style={{ color: '#d4af37', margin: '0 0 16px 0' }}>Delete Save?</h3>
              <p style={{ color: '#cccccc', margin: '0 0 20px 0' }}>
                Are you sure you want to delete save slot {showConfirmDelete + 1}? This action
                cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button variant='ghost' onClick={() => setShowConfirmDelete(null)}>
                  Cancel
                </Button>
                <Button
                  variant='primary'
                  onClick={() => handleDelete(showConfirmDelete)}
                  style={{ background: '#ff6b6b' }}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input for imports */}
      <input ref={fileInputRef} type='file' accept='.json,.sav' style={{ display: 'none' }} />
    </motion.div>
  );
};

export default SaveLoadManager;
