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
import { SaveOperationOptions } from '../../types/saveSystem';

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
  className = ''
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
    refreshSlots
  } = useSaveSystem();

  const { gameState } = useGameState();
  const { isMobile, isTablet } = useResponsive();
  const { animationConfig } = useReducedMotion();

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [saveName, setSaveName] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = useCallback(async (slotNumber: number) => {
    if (!gameState || !isInitialized) return;

    const options: SaveOperationOptions = {
      slotNumber,
      saveName: saveName || `Save ${slotNumber + 1}`,
      includeScreenshot: true,
      syncToCloud: false
    };

    const success = await saveGame(gameState, options);
    if (success) {
      onSaveComplete?.(slotNumber);
      setSaveName('');
    }
  }, [gameState, isInitialized, saveName, saveGame, onSaveComplete]);

  const handleLoad = useCallback(async (slotNumber: number) => {
    if (!isInitialized) return;

    const loadedState = await loadGame({
      slotNumber,
      validate: true,
      updateAccessTime: true
    });

    if (loadedState) {
      onLoadComplete?.(slotNumber);
    }
  }, [isInitialized, loadGame, onLoadComplete]);

  const handleDelete = useCallback(async (slotNumber: number) => {
    if (!isInitialized) return;

    const success = await deleteSave(slotNumber);
    if (success) {
      setShowConfirmDelete(null);
      await refreshSlots();
    }
  }, [isInitialized, deleteSave, refreshSlots]);

  const handleExport = useCallback(async (slotNumber: number) => {
    if (!isInitialized) return;

    const blob = await exportSave(slotNumber, {
      format: 'json',
      includeMetadata: true,
      filename: `sawyers_rpg_save_${slotNumber + 1}.json`
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
  }, [isInitialized, exportSave]);

  const handleImport = useCallback(async (slotNumber: number) => {
    if (!fileInputRef.current || !isInitialized) return;

    fileInputRef.current.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const result = await importSave(file, slotNumber);
      if (result.success) {
        await refreshSlots();
      }
    };

    fileInputRef.current.click();
  }, [isInitialized, importSave, refreshSlots]);

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: '16px'
      }}>
        <LoadingSpinner size="large" />
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
    minHeight: isMobile ? '400px' : '500px'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isMobile ? '1.5rem' : '1.8rem',
    fontWeight: 'bold',
    color: '#d4af37',
    margin: 0
  };

  const progressStyle: React.CSSProperties = {
    background: 'rgba(212, 175, 55, 0.1)',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
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
            variant="ghost"
            size="small"
            onClick={onClose}
            style={{ minWidth: 'auto', padding: '8px' }}
          >
            ✕
          </Button>
        )}
      </div>

      {/* Storage Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.85rem',
        color: '#aaaaaa',
        padding: '8px 0',
        borderBottom: '1px solid rgba(212, 175, 55, 0.2)'
      }}>
        <span>Storage: {storagePercentage.toFixed(1)}% used</span>
        <span>{saveSlots.filter(slot => !slot.isEmpty).length} / {saveSlots.length} slots</span>
      </div>

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
            <LoadingSpinner size="small" />
            <div style={{ flex: 1 }}>
              <div style={{ color: '#ffffff', marginBottom: '4px' }}>
                {saveProgress.isActive ? saveProgress.status : loadProgress.status}
              </div>
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '4px',
                height: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#d4af37',
                  height: '100%',
                  width: `${saveProgress.isActive ? saveProgress.progress : loadProgress.progress}%`,
                  transition: 'width 0.3s ease'
                }} />
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
              color: '#ff6b6b'
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
          <label style={{ color: '#cccccc', fontSize: '0.9rem' }}>
            Save Name (optional):
          </label>
          <input
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Enter save name..."
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              borderRadius: '6px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>
      )}

      {/* Save Slots Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: '16px',
        flex: 1,
        overflowY: 'auto'
      }}>
        {saveSlots.map((slot, index) => (
          <SaveSlotCard
            key={slot.slotNumber}
            slotInfo={slot}
            isSelected={selectedSlot === slot.slotNumber}
            isLoading={isLoading}
            onLoad={mode !== 'save' ? () => handleLoad(slot.slotNumber) : undefined}
            onSave={mode === 'save' || slot.isEmpty ? () => handleSave(slot.slotNumber) : undefined}
            onDelete={mode === 'manage' && !slot.isEmpty ? () => setShowConfirmDelete(slot.slotNumber) : undefined}
            onExport={mode === 'manage' && !slot.isEmpty ? () => handleExport(slot.slotNumber) : undefined}
          />
        ))}
      </div>

      {/* Action Buttons */}
      {mode === 'manage' && (
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          paddingTop: '16px',
          borderTop: '1px solid rgba(212, 175, 55, 0.2)'
        }}>
          <Button
            variant="secondary"
            size={isMobile ? "md" : "large"}
            onClick={() => handleImport(selectedSlot || 0)}
            disabled={selectedSlot === null}
          >
            Import Save
          </Button>
          <Button
            variant="secondary"
            size={isMobile ? "md" : "large"}
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
              zIndex: 1000
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
                border: '2px solid rgba(212, 175, 55, 0.3)'
              }}
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <h3 style={{ color: '#d4af37', margin: '0 0 16px 0' }}>
                Delete Save?
              </h3>
              <p style={{ color: '#cccccc', margin: '0 0 20px 0' }}>
                Are you sure you want to delete save slot {showConfirmDelete + 1}? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirmDelete(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.sav"
        style={{ display: 'none' }}
      />
    </motion.div>
  );
};

export default SaveLoadManager;