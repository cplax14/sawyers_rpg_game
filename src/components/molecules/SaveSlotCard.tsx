/**
 * Save Slot Card Component
 * Displays save slot information with metadata and controls
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { SaveSlotInfo } from '../../types/saveSystem';
import { useResponsive, useReducedMotion } from '../../hooks';

interface SaveSlotCardProps {
  slotInfo: SaveSlotInfo;
  onLoad?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  isSelected?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const SaveSlotCard: React.FC<SaveSlotCardProps> = ({
  slotInfo,
  onLoad,
  onSave,
  onDelete,
  onExport,
  isSelected = false,
  isLoading = false,
  className = ''
}) => {
  const [showActions, setShowActions] = useState(false);
  const { isMobile, isTablet } = useResponsive();
  const { animationConfig } = useReducedMotion();

  const formatPlayTime = (totalPlayTime: number): string => {
    const hours = Math.floor(totalPlayTime / 3600000);
    const minutes = Math.floor((totalPlayTime % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)}MB` : `${(bytes / 1024).toFixed(0)}KB`;
  };

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    background: slotInfo.isEmpty
      ? 'linear-gradient(135deg, #2a2a3e, #1e1e2f)'
      : 'linear-gradient(135deg, #3a4f7a, #2d3561)',
    border: `2px solid ${isSelected ? '#d4af37' : 'rgba(212, 175, 55, 0.3)'}`,
    borderRadius: '12px',
    padding: isMobile ? '12px' : '16px',
    minHeight: isMobile ? '120px' : '140px',
    cursor: slotInfo.isEmpty ? 'default' : 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: isSelected
      ? '0 8px 32px rgba(212, 175, 55, 0.3)'
      : '0 4px 16px rgba(0, 0, 0, 0.3)',
    opacity: isLoading ? 0.7 : 1,
    overflow: 'hidden'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  };

  const slotNumberStyle: React.CSSProperties = {
    fontSize: isMobile ? '0.9rem' : '1rem',
    fontWeight: 'bold',
    color: '#d4af37'
  };

  const syncStatusStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    padding: '2px 6px',
    borderRadius: '4px',
    background: slotInfo.syncStatus === 'synced' ? '#4caf50' : '#ff9800',
    color: 'white'
  };

  return (
    <motion.div
      className={className}
      style={cardStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!slotInfo.isEmpty ? {
        scale: 1.02,
        boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4)'
      } : {}}
      whileTap={!slotInfo.isEmpty ? { scale: 0.98 } : {}}
      transition={animationConfig}
      onClick={() => !slotInfo.isEmpty && onLoad?.()}
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
              zIndex: 10
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ color: '#d4af37', fontSize: '1rem' }}>
              Loading...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={headerStyle}>
        <span style={slotNumberStyle}>Slot {slotInfo.slotNumber + 1}</span>
        {!slotInfo.isEmpty && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={syncStatusStyle}>
              {slotInfo.syncStatus.replace('_', ' ')}
            </span>
            {slotInfo.metadata?.isFavorite && (
              <span style={{ color: '#d4af37', fontSize: '1.2rem' }}>★</span>
            )}
          </div>
        )}
      </div>

      {slotInfo.isEmpty ? (
        /* Empty Slot */
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80px',
          color: '#888',
          fontSize: isMobile ? '0.9rem' : '1rem'
        }}>
          <div style={{ marginBottom: '8px', fontSize: '2rem' }}>+</div>
          <div>Empty Slot</div>
        </div>
      ) : (
        /* Filled Slot */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Thumbnail */}
          {slotInfo.metadata?.thumbnail && (
            <div style={{
              width: '60px',
              height: '45px',
              borderRadius: '4px',
              overflow: 'hidden',
              float: 'right',
              marginLeft: '12px'
            }}>
              <img
                src={slotInfo.metadata.thumbnail}
                alt="Save thumbnail"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          )}

          {/* Player Info */}
          {slotInfo.playerSummary && (
            <div>
              <div style={{
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 'bold',
                color: '#ffffff',
                marginBottom: '4px'
              }}>
                {slotInfo.playerSummary.name}
              </div>
              <div style={{
                fontSize: '0.85rem',
                color: '#cccccc'
              }}>
                Level {slotInfo.playerSummary.level} {slotInfo.playerSummary.class}
              </div>
              <div style={{
                fontSize: '0.8rem',
                color: '#aaaaaa'
              }}>
                {slotInfo.playerSummary.currentAreaName}
              </div>
            </div>
          )}

          {/* Progress Info */}
          {slotInfo.progressSummary && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#aaaaaa',
              marginTop: '8px'
            }}>
              <span>
                {slotInfo.progressSummary.overallCompletion}% Complete
              </span>
              <span>
                {formatPlayTime(slotInfo.metadata?.totalPlayTime || 0)}
              </span>
            </div>
          )}

          {/* Metadata */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: '#888',
            marginTop: '4px'
          }}>
            <span>
              {slotInfo.metadata && formatDate(new Date(slotInfo.metadata.lastModified))}
            </span>
            <span>
              {slotInfo.metadata && formatFileSize(slotInfo.metadata.fileSizeBytes)}
            </span>
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
              padding: '4px'
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {onSave && (
              <Button
                variant="ghost"
                size="small"
                onClick={(e) => {
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
                variant="ghost"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onExport();
                }}
                style={{ fontSize: '0.7rem', padding: '4px 6px' }}
              >
                Export
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="small"
                onClick={(e) => {
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
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '8px',
          height: '8px',
          background: '#ff4444',
          borderRadius: '50%',
          title: slotInfo.lastError
        }} />
      )}
    </motion.div>
  );
};

export default SaveSlotCard;