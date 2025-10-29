/**
 * Save Slot Card Component
 * Displays save slot information with metadata and controls
 */

import React, { useState, memo, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { SaveSlotInfo, SaveSyncStatus } from '../../types/saveSystem';
import { useResponsive, useReducedMotion } from '../../hooks';

interface SaveSlotCardProps {
  slotInfo: SaveSlotInfo;
  onLoad?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onCloudSync?: () => void;
  onCloudRestore?: () => void;
  onConflictResolve?: () => void;
  isSelected?: boolean;
  isLoading?: boolean;
  className?: string;
  disableCardClick?: boolean;
}

const SaveSlotCardComponent: React.FC<SaveSlotCardProps> = ({
  slotInfo,
  onLoad,
  onSave,
  onDelete,
  onExport,
  onCloudSync,
  onCloudRestore,
  onConflictResolve,
  isSelected = false,
  isLoading = false,
  className = '',
  disableCardClick = false,
}) => {
  const [showActions, setShowActions] = useState(false);
  const { isMobile, isTablet } = useResponsive();
  const { animationConfig } = useReducedMotion();

  // Cloud sync status configuration
  const getCloudSyncConfig = useCallback((status: SaveSyncStatus) => {
    switch (status) {
      case SaveSyncStatus.SYNCED:
        return {
          icon: '☁️',
          color: '#4caf50',
          background: 'rgba(76, 175, 80, 0.1)',
          border: 'rgba(76, 175, 80, 0.3)',
          text: 'Synced',
          tooltip: 'Save is synchronized with cloud storage',
        };
      case SaveSyncStatus.LOCAL_ONLY:
        return {
          icon: '💾',
          color: '#2196f3',
          background: 'rgba(33, 150, 243, 0.1)',
          border: 'rgba(33, 150, 243, 0.3)',
          text: 'Local Only',
          tooltip: 'Save exists only on this device',
        };
      case SaveSyncStatus.CLOUD_ONLY:
        return {
          icon: '☁️',
          color: '#9c27b0',
          background: 'rgba(156, 39, 176, 0.1)',
          border: 'rgba(156, 39, 176, 0.3)',
          text: 'Cloud Only',
          tooltip: 'Save exists only in cloud storage',
        };
      case SaveSyncStatus.LOCAL_NEWER:
        return {
          icon: '⬆️',
          color: '#ff9800',
          background: 'rgba(255, 152, 0, 0.1)',
          border: 'rgba(255, 152, 0, 0.3)',
          text: 'Local Newer',
          tooltip: 'Local version is newer than cloud',
        };
      case SaveSyncStatus.CLOUD_NEWER:
        return {
          icon: '⬇️',
          color: '#607d8b',
          background: 'rgba(96, 125, 139, 0.1)',
          border: 'rgba(96, 125, 139, 0.3)',
          text: 'Cloud Newer',
          tooltip: 'Cloud version is newer than local',
        };
      case SaveSyncStatus.SYNCING:
        return {
          icon: '🔄',
          color: '#2196f3',
          background: 'rgba(33, 150, 243, 0.1)',
          border: 'rgba(33, 150, 243, 0.3)',
          text: 'Syncing...',
          tooltip: 'Synchronization in progress',
        };
      case SaveSyncStatus.SYNC_FAILED:
        return {
          icon: '❌',
          color: '#f44336',
          background: 'rgba(244, 67, 54, 0.1)',
          border: 'rgba(244, 67, 54, 0.3)',
          text: 'Sync Failed',
          tooltip: 'Synchronization failed - click to retry',
        };
      case SaveSyncStatus.CONFLICT:
        return {
          icon: '⚠️',
          color: '#ff5722',
          background: 'rgba(255, 87, 34, 0.1)',
          border: 'rgba(255, 87, 34, 0.3)',
          text: 'Conflict',
          tooltip: 'Sync conflict detected - click to resolve',
        };
      default:
        return {
          icon: '❓',
          color: '#9e9e9e',
          background: 'rgba(158, 158, 158, 0.1)',
          border: 'rgba(158, 158, 158, 0.3)',
          text: 'Unknown',
          tooltip: 'Unknown sync status',
        };
    }
  }, []);

  // Memoize formatting functions
  const formatPlayTime = useCallback((totalPlayTime: number): string => {
    const hours = Math.floor(totalPlayTime / 3600000);
    const minutes = Math.floor((totalPlayTime % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`;
  }, []);

  // Memoize computed values
  const isEmpty = useMemo(() => !slotInfo.metadata, [slotInfo.metadata]);
  const formattedDate = useMemo(
    () => (slotInfo.metadata ? formatDate(new Date(slotInfo.metadata.lastModified)) : ''),
    [slotInfo.metadata, formatDate]
  );
  const formattedFileSize = useMemo(
    () => (slotInfo.metadata ? formatFileSize(slotInfo.metadata.fileSizeBytes) : ''),
    [slotInfo.metadata, formatFileSize]
  );
  const formattedPlayTime = useMemo(
    () => (slotInfo.metadata ? formatPlayTime(slotInfo.metadata.totalPlayTime) : ''),
    [slotInfo.metadata, formatPlayTime]
  );
  const cloudSyncConfig = useMemo(
    () => getCloudSyncConfig(slotInfo.syncStatus),
    [slotInfo.syncStatus, getCloudSyncConfig]
  );

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    background: isSelected
      ? 'linear-gradient(135deg, #4a5f8a, #3d4571)'
      : slotInfo.isEmpty
        ? 'linear-gradient(135deg, #2a2a3e, #1e1e2f)'
        : 'linear-gradient(135deg, #3a4f7a, #2d3561)',
    border: `3px solid ${isSelected ? '#d4af37' : 'rgba(212, 175, 55, 0.3)'}`,
    borderRadius: '12px',
    padding: isMobile ? '12px' : '16px',
    minHeight: isMobile ? '120px' : '140px',
    cursor: slotInfo.isEmpty ? 'default' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: isSelected
      ? '0 8px 32px rgba(212, 175, 55, 0.5), inset 0 0 0 2px rgba(212, 175, 55, 0.2)'
      : '0 4px 16px rgba(0, 0, 0, 0.3)',
    opacity: isLoading ? 0.7 : 1,
    overflow: 'hidden',
    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  };

  const slotNumberStyle: React.CSSProperties = {
    fontSize: isMobile ? '0.9rem' : '1rem',
    fontWeight: 'bold',
    color: '#d4af37',
  };

  // Cloud sync indicator click handler
  const handleCloudSyncClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      switch (slotInfo.syncStatus) {
        case SaveSyncStatus.SYNC_FAILED:
          onCloudSync?.();
          break;
        case SaveSyncStatus.CONFLICT:
          onConflictResolve?.();
          break;
        case SaveSyncStatus.CLOUD_NEWER:
          onCloudRestore?.();
          break;
        case SaveSyncStatus.LOCAL_NEWER:
          onCloudSync?.();
          break;
        default:
          // For other states, show more details or status
          break;
      }
    },
    [slotInfo.syncStatus, onCloudSync, onCloudRestore, onConflictResolve]
  );

  return (
    <motion.div
      className={className}
      style={cardStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        !slotInfo.isEmpty
          ? {
              scale: 1.02,
              boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4)',
            }
          : {}
      }
      whileTap={!slotInfo.isEmpty ? { scale: 0.98 } : {}}
      transition={animationConfig}
      onClick={
        disableCardClick
          ? undefined
          : () => {
              console.log('💾 SaveSlotCard clicked:', {
                slotNumber: slotInfo.slotNumber,
                isEmpty: slotInfo.isEmpty,
                hasOnLoad: !!onLoad,
                disableCardClick,
              });
              if (!slotInfo.isEmpty && onLoad) {
                console.log('🔥 Calling onLoad for slot:', slotInfo.slotNumber);
                onLoad();
              } else {
                console.log('⚠️ Click blocked:', {
                  isEmpty: slotInfo.isEmpty,
                  hasOnLoad: !!onLoad,
                });
              }
            }
      }
      onMouseEnter={() => !isMobile && setShowActions(true)}
      onMouseLeave={() => !isMobile && setShowActions(false)}
    >
      {/* Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              zIndex: 10,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ color: '#d4af37', fontSize: '1rem' }}>Loading...</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection Indicator */}
      <AnimatePresence>
        {isSelected && !slotInfo.isEmpty && (
          <motion.div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #d4af37, #f4c653)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1a1a2e',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.5)',
              zIndex: 5,
            }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            ✓
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={headerStyle}>
        <span style={slotNumberStyle}>Slot {slotInfo.slotNumber + 1}</span>
        {!slotInfo.isEmpty && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Enhanced Cloud Sync Indicator */}
            <motion.div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: `1px solid ${cloudSyncConfig.border}`,
                background: cloudSyncConfig.background,
                cursor: [
                  SaveSyncStatus.SYNC_FAILED,
                  SaveSyncStatus.CONFLICT,
                  SaveSyncStatus.LOCAL_NEWER,
                  SaveSyncStatus.CLOUD_NEWER,
                ].includes(slotInfo.syncStatus)
                  ? 'pointer'
                  : 'default',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: cloudSyncConfig.color,
                transition: 'all 0.2s ease',
              }}
              whileHover={
                [
                  SaveSyncStatus.SYNC_FAILED,
                  SaveSyncStatus.CONFLICT,
                  SaveSyncStatus.LOCAL_NEWER,
                  SaveSyncStatus.CLOUD_NEWER,
                ].includes(slotInfo.syncStatus)
                  ? {
                      scale: 1.05,
                      background: cloudSyncConfig.color + '20',
                    }
                  : {}
              }
              onClick={handleCloudSyncClick}
              title={cloudSyncConfig.tooltip}
            >
              <span style={{ fontSize: '0.8rem' }}>{cloudSyncConfig.icon}</span>
              <span>{cloudSyncConfig.text}</span>
              {slotInfo.syncStatus === SaveSyncStatus.SYNCING && (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block' }}
                >
                  🔄
                </motion.div>
              )}
            </motion.div>

            {/* Cloud Storage Availability Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {slotInfo.isLocalAvailable && (
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#4caf50',
                    title: 'Available locally',
                  }}
                />
              )}
              {slotInfo.isCloudAvailable && (
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#2196f3',
                    title: 'Available in cloud',
                  }}
                />
              )}
            </div>

            {slotInfo.metadata?.isFavorite && (
              <span style={{ color: '#d4af37', fontSize: '1.2rem' }}>★</span>
            )}
          </div>
        )}
      </div>

      {slotInfo.isEmpty ? (
        /* Empty Slot */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '80px',
            color: '#888',
            fontSize: isMobile ? '0.9rem' : '1rem',
          }}
        >
          <div style={{ marginBottom: '8px', fontSize: '2rem' }}>+</div>
          <div>Empty Slot</div>
        </div>
      ) : (
        /* Filled Slot */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Thumbnail */}
          {slotInfo.metadata?.thumbnail && (
            <div
              style={{
                width: '60px',
                height: '45px',
                borderRadius: '4px',
                overflow: 'hidden',
                float: 'right',
                marginLeft: '12px',
              }}
            >
              <img
                src={slotInfo.metadata.thumbnail}
                alt='Save thumbnail'
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Player Info */}
          {slotInfo.playerSummary && (
            <div>
              <div
                style={{
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: 'bold',
                  color: '#ffffff',
                  marginBottom: '4px',
                }}
              >
                {slotInfo.playerSummary.name}
              </div>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: '#cccccc',
                }}
              >
                Level {slotInfo.playerSummary.level} {slotInfo.playerSummary.class}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  color: '#aaaaaa',
                }}
              >
                {slotInfo.playerSummary.currentAreaName}
              </div>
            </div>
          )}

          {/* Progress Info */}
          {slotInfo.progressSummary && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                color: '#aaaaaa',
                marginTop: '8px',
              }}
            >
              <span>{slotInfo.progressSummary.overallCompletion}% Complete</span>
              <span>{formatPlayTime(slotInfo.metadata?.totalPlayTime || 0)}</span>
            </div>
          )}

          {/* Metadata */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.7rem',
              color: '#888',
              marginTop: '4px',
            }}
          >
            <span>{slotInfo.metadata && formatDate(new Date(slotInfo.metadata.lastModified))}</span>
            <span>{slotInfo.metadata && formatFileSize(slotInfo.metadata.fileSizeBytes)}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <AnimatePresence>
        {(showActions || isMobile) && !slotInfo.isEmpty && (
          <motion.div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              display: 'flex',
              gap: '4px',
              background: 'rgba(0, 0, 0, 0.8)',
              borderRadius: '6px',
              padding: '4px',
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {onSave && (
              <Button
                variant='ghost'
                size='small'
                onClick={e => {
                  e.stopPropagation();
                  onSave();
                }}
                style={{ fontSize: '0.7rem', padding: '4px 6px' }}
              >
                Save
              </Button>
            )}
            {onExport && (
              <Button
                variant='ghost'
                size='small'
                onClick={e => {
                  e.stopPropagation();
                  onExport();
                }}
                style={{ fontSize: '0.7rem', padding: '4px 6px' }}
              >
                Export
              </Button>
            )}

            {/* Cloud-specific action buttons */}
            {onCloudSync &&
              [
                SaveSyncStatus.LOCAL_ONLY,
                SaveSyncStatus.LOCAL_NEWER,
                SaveSyncStatus.SYNC_FAILED,
              ].includes(slotInfo.syncStatus) && (
                <Button
                  variant='ghost'
                  size='small'
                  onClick={e => {
                    e.stopPropagation();
                    onCloudSync();
                  }}
                  style={{ fontSize: '0.7rem', padding: '4px 6px', color: '#2196f3' }}
                  title='Upload to cloud'
                >
                  ☁️↑
                </Button>
              )}

            {onCloudRestore &&
              [SaveSyncStatus.CLOUD_ONLY, SaveSyncStatus.CLOUD_NEWER].includes(
                slotInfo.syncStatus
              ) && (
                <Button
                  variant='ghost'
                  size='small'
                  onClick={e => {
                    e.stopPropagation();
                    onCloudRestore();
                  }}
                  style={{ fontSize: '0.7rem', padding: '4px 6px', color: '#9c27b0' }}
                  title='Download from cloud'
                >
                  ☁️↓
                </Button>
              )}

            {onConflictResolve && slotInfo.syncStatus === SaveSyncStatus.CONFLICT && (
              <Button
                variant='ghost'
                size='small'
                onClick={e => {
                  e.stopPropagation();
                  onConflictResolve();
                }}
                style={{ fontSize: '0.7rem', padding: '4px 6px', color: '#ff5722' }}
                title='Resolve conflict'
              >
                ⚠️
              </Button>
            )}

            {onDelete && (
              <Button
                variant='ghost'
                size='small'
                onClick={e => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={{ fontSize: '0.7rem', padding: '4px 6px', color: '#ff6b6b' }}
              >
                Delete
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Indicator */}
      {slotInfo.lastError && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '8px',
            height: '8px',
            background: '#ff4444',
            borderRadius: '50%',
            title: slotInfo.lastError,
          }}
        />
      )}
    </motion.div>
  );
};

// Memoized SaveSlotCard for performance optimization
export const SaveSlotCard = memo(SaveSlotCardComponent, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-render prevention
  return (
    prevProps.slotInfo.slotNumber === nextProps.slotInfo.slotNumber &&
    prevProps.slotInfo.isEmpty === nextProps.slotInfo.isEmpty &&
    prevProps.slotInfo.syncStatus === nextProps.slotInfo.syncStatus &&
    prevProps.slotInfo.lastError === nextProps.slotInfo.lastError &&
    prevProps.slotInfo.isLocalAvailable === nextProps.slotInfo.isLocalAvailable &&
    prevProps.slotInfo.isCloudAvailable === nextProps.slotInfo.isCloudAvailable &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.className === nextProps.className &&
    // Compare function references for cloud actions
    prevProps.onCloudSync === nextProps.onCloudSync &&
    prevProps.onCloudRestore === nextProps.onCloudRestore &&
    prevProps.onConflictResolve === nextProps.onConflictResolve &&
    // Deep compare metadata if both exist
    ((!prevProps.slotInfo.metadata && !nextProps.slotInfo.metadata) ||
      (prevProps.slotInfo.metadata?.lastModified === nextProps.slotInfo.metadata?.lastModified &&
        prevProps.slotInfo.metadata?.fileSizeBytes === nextProps.slotInfo.metadata?.fileSizeBytes &&
        prevProps.slotInfo.metadata?.totalPlayTime === nextProps.slotInfo.metadata?.totalPlayTime &&
        prevProps.slotInfo.metadata?.isFavorite === nextProps.slotInfo.metadata?.isFavorite))
  );
});

SaveSlotCard.displayName = 'SaveSlotCard';

export default SaveSlotCard;
