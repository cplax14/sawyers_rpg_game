import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GamePauseState } from '../../hooks/useGamePause';

interface GamePauseIndicatorProps {
  pauseState: GamePauseState;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  variant?: 'minimal' | 'detailed' | 'banner';
  showDuration?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const GamePauseIndicator: React.FC<GamePauseIndicatorProps> = ({
  pauseState,
  position = 'top-right',
  variant = 'minimal',
  showDuration = false,
  className = '',
  style = {},
}) => {
  if (!pauseState.isPaused) {
    return null;
  }

  const getPauseDuration = () => {
    if (!pauseState.pausedAt) return 0;
    return Math.floor((Date.now() - pauseState.pausedAt) / 1000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const getPositionStyles = () => {
    const positions = {
      'top-left': { top: '1rem', left: '1rem' },
      'top-right': { top: '1rem', right: '1rem' },
      'bottom-left': { bottom: '1rem', left: '1rem' },
      'bottom-right': { bottom: '1rem', right: '1rem' },
      center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
    };
    return positions[position];
  };

  const getReasonIcon = (reason: string | null) => {
    const reasonIcons: Record<string, string> = {
      inventory: '🎒',
      menu: '⚙️',
      settings: '🔧',
      dialogue: '💬',
      loading: '⏳',
      manual: '⏸️',
    };
    return reasonIcons[reason || ''] || '⏸️';
  };

  const getReasonText = (reason: string | null) => {
    const reasonTexts: Record<string, string> = {
      inventory: 'Inventory Open',
      menu: 'Menu Open',
      settings: 'Settings Open',
      dialogue: 'In Dialogue',
      loading: 'Loading',
      manual: 'Game Paused',
    };
    return reasonTexts[reason || ''] || 'Game Paused';
  };

  const renderMinimal = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      style={{
        position: 'fixed',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontSize: '0.9rem',
        color: '#f4f4f4',
        backdropFilter: 'blur(8px)',
        ...getPositionStyles(),
        ...style,
      }}
      className={`game-pause-indicator game-pause-minimal ${className}`}
    >
      <motion.span
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        style={{ fontSize: '1.1rem' }}
      >
        {getReasonIcon(pauseState.pauseReason)}
      </motion.span>
      <span>{getReasonText(pauseState.pauseReason)}</span>
      {showDuration && (
        <span
          style={{
            opacity: 0.8,
            fontSize: '0.8rem',
            fontFamily: 'monospace',
          }}
        >
          {formatDuration(getPauseDuration())}
        </span>
      )}
    </motion.div>
  );

  const renderDetailed = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      style={{
        position: 'fixed',
        zIndex: 1000,
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.9))',
        border: '2px solid rgba(255, 215, 0, 0.5)',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        minWidth: '200px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(12px)',
        ...getPositionStyles(),
        ...style,
      }}
      className={`game-pause-indicator game-pause-detailed ${className}`}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.5rem',
        }}
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={{ fontSize: '1.5rem' }}
        >
          {getReasonIcon(pauseState.pauseReason)}
        </motion.div>
        <div>
          <div
            style={{
              fontSize: '1rem',
              fontWeight: '600',
              color: '#ffd700',
            }}
          >
            Game Paused
          </div>
          <div
            style={{
              fontSize: '0.85rem',
              color: 'rgba(244, 244, 244, 0.8)',
            }}
          >
            {getReasonText(pauseState.pauseReason)}
          </div>
        </div>
      </div>

      {showDuration && (
        <div
          style={{
            fontSize: '0.8rem',
            color: 'rgba(244, 244, 244, 0.6)',
            fontFamily: 'monospace',
            textAlign: 'center',
            paddingTop: '0.5rem',
            borderTop: '1px solid rgba(255, 215, 0, 0.2)',
          }}
        >
          Paused for: {formatDuration(getPauseDuration())}
        </div>
      )}

      {/* Animated border glow */}
      <div
        style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          borderRadius: '12px',
          background: 'linear-gradient(45deg, #ffd700, transparent, #ffd700)',
          opacity: 0.3,
          zIndex: -1,
          animation: 'borderGlow 2s ease-in-out infinite alternate',
        }}
      />
    </motion.div>
  );

  const renderBanner = () => (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.9), rgba(255, 165, 0, 0.9))',
        color: '#000',
        padding: '0.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        fontSize: '1rem',
        fontWeight: '600',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        ...style,
      }}
      className={`game-pause-indicator game-pause-banner ${className}`}
    >
      <motion.span
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        style={{ fontSize: '1.2rem' }}
      >
        {getReasonIcon(pauseState.pauseReason)}
      </motion.span>

      <span>⏸️ GAME PAUSED</span>

      <span style={{ opacity: 0.8 }}>{getReasonText(pauseState.pauseReason)}</span>

      {showDuration && (
        <span
          style={{
            fontFamily: 'monospace',
            opacity: 0.7,
            fontSize: '0.9rem',
          }}
        >
          {formatDuration(getPauseDuration())}
        </span>
      )}

      {/* Animated progress line */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '0 0 0 3px',
        }}
        initial={{ width: '0%' }}
        animate={{ width: '100%' }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  );

  return (
    <AnimatePresence>
      {(() => {
        switch (variant) {
          case 'detailed':
            return renderDetailed();
          case 'banner':
            return renderBanner();
          default:
            return renderMinimal();
        }
      })()}

      <style jsx>{`
        @keyframes borderGlow {
          0% {
            opacity: 0.3;
          }
          100% {
            opacity: 0.6;
          }
        }
      `}</style>
    </AnimatePresence>
  );
};

// Specialized component for inventory pause
export const InventoryPauseIndicator: React.FC<{
  isPaused: boolean;
  position?: 'header' | 'footer' | 'floating';
  compact?: boolean;
}> = ({ isPaused, position = 'header', compact = false }) => {
  if (!isPaused) return null;

  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: compact ? '0.8rem' : '0.9rem',
    color: '#ffd700',
    fontWeight: '500',
  };

  const content = (
    <>
      <motion.span
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      >
        ⏸️
      </motion.span>
      <span>{compact ? 'Paused' : 'Game Paused for Inventory'}</span>
    </>
  );

  switch (position) {
    case 'header':
      return (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          style={{
            ...baseStyle,
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '6px',
            padding: '0.5rem 1rem',
          }}
        >
          {content}
        </motion.div>
      );

    case 'footer':
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          style={{
            ...baseStyle,
            justifyContent: 'center',
            padding: '0.5rem',
          }}
        >
          {content}
        </motion.div>
      );

    case 'floating':
    default:
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            ...baseStyle,
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 215, 0, 0.5)',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            backdropFilter: 'blur(8px)',
            zIndex: 10,
          }}
        >
          {content}
        </motion.div>
      );
  }
};

export default GamePauseIndicator;
