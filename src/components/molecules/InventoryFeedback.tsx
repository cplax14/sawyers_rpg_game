import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedbackState } from '../../hooks/useInventoryAnimations';

interface InventoryFeedbackProps {
  feedbacks: FeedbackState[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxVisible?: number;
  className?: string;
}

export const InventoryFeedback: React.FC<InventoryFeedbackProps> = ({
  feedbacks,
  onRemove,
  position = 'top-right',
  maxVisible = 5,
  className = ''
}) => {
  const visibleFeedbacks = feedbacks.slice(-maxVisible);

  const getPositionStyles = () => {
    const positions = {
      'top-right': { top: '1rem', right: '1rem' },
      'top-left': { top: '1rem', left: '1rem' },
      'bottom-right': { bottom: '1rem', right: '1rem' },
      'bottom-left': { bottom: '1rem', left: '1rem' },
      'top-center': { top: '1rem', left: '50%', transform: 'translateX(-50%)' },
      'bottom-center': { bottom: '1rem', left: '50%', transform: 'translateX(-50%)' }
    };
    return positions[position];
  };

  const getFeedbackConfig = (type: FeedbackState['type']) => {
    const configs = {
      success: {
        icon: '✅',
        colors: {
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))',
          border: 'rgba(34, 197, 94, 0.8)',
          text: '#ffffff'
        }
      },
      error: {
        icon: '❌',
        colors: {
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
          border: 'rgba(239, 68, 68, 0.8)',
          text: '#ffffff'
        }
      },
      warning: {
        icon: '⚠️',
        colors: {
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(217, 119, 6, 0.9))',
          border: 'rgba(245, 158, 11, 0.8)',
          text: '#ffffff'
        }
      },
      info: {
        icon: 'ℹ️',
        colors: {
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))',
          border: 'rgba(59, 130, 246, 0.8)',
          text: '#ffffff'
        }
      }
    };
    return configs[type];
  };

  return (
    <div
      className={`inventory-feedback-container ${className}`}
      style={{
        position: 'fixed',
        zIndex: 2000,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '300px',
        ...getPositionStyles()
      }}
    >
      <AnimatePresence>
        {visibleFeedbacks.map((feedback) => {
          const config = getFeedbackConfig(feedback.type);

          return (
            <motion.div
              key={feedback.id}
              layout
              initial={{
                opacity: 0,
                x: position.includes('right') ? 300 : position.includes('left') ? -300 : 0,
                y: position.includes('top') ? -20 : 20,
                scale: 0.9
              }}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                x: position.includes('right') ? 300 : position.includes('left') ? -300 : 0,
                scale: 0.9,
                transition: { duration: 0.2 }
              }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300
              }}
              style={{
                background: config.colors.background,
                border: `1px solid ${config.colors.border}`,
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                backdropFilter: 'blur(8px)',
                pointerEvents: 'auto',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              onClick={() => onRemove(feedback.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                style={{ fontSize: '1.2rem', lineHeight: 1 }}
              >
                {config.icon}
              </motion.div>

              {/* Message */}
              <div style={{
                flex: 1,
                color: config.colors.text,
                fontSize: '0.9rem',
                fontWeight: '500',
                lineHeight: 1.3
              }}>
                {feedback.message}
              </div>

              {/* Progress bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '0 0 8px 8px',
                overflow: 'hidden'
              }}>
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{
                    duration: feedback.duration / 1000,
                    ease: 'linear'
                  }}
                  style={{
                    height: '100%',
                    background: 'rgba(255, 255, 255, 0.8)'
                  }}
                />
              </div>

              {/* Close button */}
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(feedback.id);
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: config.colors.text,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </motion.button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Simplified feedback toast for single messages
export const FeedbackToast: React.FC<{
  type: FeedbackState['type'];
  message: string;
  onClose: () => void;
  duration?: number;
}> = ({ type, message, onClose, duration = 3000 }) => {
  const config = {
    success: { icon: '✅', color: '#22c55e' },
    error: { icon: '❌', color: '#ef4444' },
    warning: { icon: '⚠️', color: '#f59e0b' },
    info: { icon: 'ℹ️', color: '#3b82f6' }
  }[type];

  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      style={{
        position: 'fixed',
        top: '2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2000,
        background: `linear-gradient(135deg, ${config.color}20, ${config.color}30)`,
        border: `1px solid ${config.color}60`,
        borderRadius: '8px',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        backdropFilter: 'blur(12px)',
        boxShadow: `0 8px 32px ${config.color}40`
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>{config.icon}</span>
      <span style={{ color: '#f4f4f4', fontWeight: '500' }}>{message}</span>
    </motion.div>
  );
};

// Action-specific feedback components
export const EquipFeedback: React.FC<{
  success: boolean;
  itemName: string;
  reason?: string;
}> = ({ success, itemName, reason }) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: success
          ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.9))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9))',
        color: '#ffffff',
        padding: '1rem 1.5rem',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        zIndex: 1000,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(8px)'
      }}
    >
      <motion.div
        animate={success ? { rotate: [0, 10, -10, 0] } : { x: [0, -5, 5, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
        style={{ fontSize: '1.5rem' }}
      >
        {success ? '⚔️' : '🚫'}
      </motion.div>
      <div>
        <div style={{ fontWeight: '600' }}>
          {success ? 'Equipped!' : 'Cannot Equip'}
        </div>
        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          {success ? itemName : reason || 'Requirements not met'}
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryFeedback;