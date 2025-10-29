import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatExperienceNumber } from '../../utils/experienceUtils';

interface LevelUpNotificationProps {
  isVisible: boolean;
  fromLevel: number;
  toLevel: number;
  totalXP: number;
  onClose: () => void;
  onViewStats?: () => void;
  autoCloseDelay?: number;
}

interface LevelUpReward {
  type: 'stat' | 'skill' | 'feature';
  name: string;
  value?: number | string;
  icon: string;
}

export const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({
  isVisible,
  fromLevel,
  toLevel,
  totalXP,
  onClose,
  onViewStats,
  autoCloseDelay = 5000,
}) => {
  const [shouldAutoClose, setShouldAutoClose] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(autoCloseDelay / 1000);

  // Generate mock rewards based on level
  const getLevelRewards = (level: number): LevelUpReward[] => {
    const baseRewards: LevelUpReward[] = [
      { type: 'stat', name: 'Health', value: '+10', icon: '❤️' },
      { type: 'stat', name: 'Mana', value: '+5', icon: '💙' },
    ];

    // Add special rewards at milestone levels
    if (level % 5 === 0) {
      baseRewards.push({ type: 'skill', name: 'Skill Point', value: '+1', icon: '⭐' });
    }

    if (level % 10 === 0) {
      baseRewards.push({ type: 'feature', name: 'New Ability', value: 'Unlocked', icon: '🔥' });
    }

    if (level === 20) {
      baseRewards.push({
        type: 'feature',
        name: 'Creature Breeding',
        value: 'Unlocked',
        icon: '🐣',
      });
    }

    if (level === 30) {
      baseRewards.push({
        type: 'feature',
        name: 'Advanced Trading',
        value: 'Unlocked',
        icon: '💰',
      });
    }

    return baseRewards;
  };

  const rewards = getLevelRewards(toLevel);
  const levelsGained = toLevel - fromLevel;

  useEffect(() => {
    if (!isVisible || !shouldAutoClose) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, shouldAutoClose, onClose]);

  const handleMouseEnter = () => setShouldAutoClose(false);
  const handleMouseLeave = () => setShouldAutoClose(true);

  const containerVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: -50,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        duration: 0.6,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 50,
      transition: {
        duration: 0.3,
      },
    },
  };

  const glowVariants = {
    glow: {
      boxShadow: [
        '0 0 20px rgba(79, 195, 247, 0.4)',
        '0 0 40px rgba(79, 195, 247, 0.6)',
        '0 0 20px rgba(79, 195, 247, 0.4)',
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className='level-up-overlay'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '1rem',
          }}
          onClick={e => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className='level-up-notification'
            variants={containerVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
              background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              border: '2px solid rgba(79, 195, 247, 0.5)',
              color: '#f4f4f4',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background glow effect */}
            <motion.div
              variants={glowVariants}
              animate='glow'
              style={{
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                background:
                  'linear-gradient(135deg, rgba(79, 195, 247, 0.1), rgba(41, 182, 246, 0.1))',
                borderRadius: '20px',
                zIndex: -1,
              }}
            />

            {/* Confetti particles */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                overflow: 'hidden',
                borderRadius: '20px',
              }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <motion.div
                  key={i}
                  style={{
                    position: 'absolute',
                    width: '8px',
                    height: '8px',
                    background: ['#4fc3f7', '#29b6f6', '#ffd700', '#ff6b9d'][i % 4],
                    borderRadius: '50%',
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -20, 0],
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>

            {/* Close button */}
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f4f4f4',
                cursor: 'pointer',
                fontSize: '1.2rem',
              }}
            >
              ✕
            </motion.button>

            {/* Auto-close timer */}
            {shouldAutoClose && timeRemaining > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '1rem',
                  left: '1rem',
                  fontSize: '0.8rem',
                  opacity: 0.6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid #4fc3f7',
                    position: 'relative',
                  }}
                >
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '0.7rem',
                    }}
                  >
                    {timeRemaining}
                  </motion.div>
                </div>
              </div>
            )}

            {/* Main content */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {/* Level up title */}
              <motion.div
                style={{
                  fontSize: '3rem',
                  marginBottom: '0.5rem',
                }}
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 0.6,
                  ease: 'easeInOut',
                }}
              >
                🎉
              </motion.div>

              <motion.h1
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  color: '#4fc3f7',
                  margin: '0 0 0.5rem 0',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                }}
                animate={{
                  scale: [0.9, 1.05, 1],
                }}
                transition={{
                  duration: 0.8,
                  ease: 'easeOut',
                }}
              >
                LEVEL UP!
              </motion.h1>

              <motion.div
                style={{
                  fontSize: '1.2rem',
                  marginBottom: '1.5rem',
                  opacity: 0.9,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ delay: 0.5 }}
              >
                {levelsGained > 1 ? (
                  <>
                    Level {fromLevel} → {toLevel} (+{levelsGained} levels!)
                  </>
                ) : (
                  <>
                    Level {fromLevel} → {toLevel}
                  </>
                )}
              </motion.div>

              {/* XP info */}
              <motion.div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Total Experience
                </div>
                <div style={{ fontSize: '1.5rem', color: '#4fc3f7', fontWeight: 'bold' }}>
                  {formatExperienceNumber(totalXP)} XP
                </div>
              </motion.div>

              {/* Rewards */}
              {rewards.length > 0 && (
                <motion.div
                  style={{ marginBottom: '1.5rem' }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <h3
                    style={{
                      fontSize: '1.3rem',
                      color: '#ffd700',
                      marginBottom: '1rem',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    🎁 Rewards Unlocked
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '0.75rem',
                    }}
                  >
                    {rewards.map((reward, index) => (
                      <motion.div
                        key={index}
                        style={{
                          background: 'rgba(255, 215, 0, 0.1)',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: '8px',
                          padding: '0.75rem',
                          textAlign: 'center',
                        }}
                        initial={{ scale: 0, rotate: -10 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.9 + index * 0.1,
                          type: 'spring',
                          stiffness: 200,
                        }}
                      >
                        <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                          {reward.icon}
                        </div>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{reward.name}</div>
                        {reward.value && (
                          <div
                            style={{ fontSize: '0.8rem', color: '#ffd700', marginTop: '0.25rem' }}
                          >
                            {reward.value}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Action buttons */}
              <motion.div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {onViewStats && (
                  <motion.button
                    onClick={onViewStats}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background: 'linear-gradient(135deg, #4fc3f7, #29b6f6)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '1rem',
                    }}
                  >
                    📊 View Stats
                  </motion.button>
                )}

                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '0.75rem 1.5rem',
                    color: '#f4f4f4',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '1rem',
                  }}
                >
                  Continue
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpNotification;
