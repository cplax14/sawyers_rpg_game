import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

// Haste color palette - energetic yellows for speed enhancement
const HASTE_COLORS = {
  primary: '#ffd700', // Gold/Yellow
  secondary: '#ffeb3b', // Bright yellow
  accent: '#fff176', // Light yellow
};

interface HasteAnimationProps {
  targetX: number;
  targetY: number;
  isActive: boolean;
  onCastComplete?: () => void;
  onFadeComplete?: () => void;
}

/**
 * HasteAnimation - Complete Haste spell animation with persistent speed buff effect
 *
 * Phase breakdown (250ms cast + persistent sustain + 200ms fade):
 * - Cast (250ms): Quick yellow energy burst forms around target
 * - Sustain (persistent): Speed lines and subtle particle trail during buff duration
 * - Fade (200ms): When buff duration ends, speed effect dissipates
 *
 * Visual characteristics:
 * - Primary color: #ffd700 (gold/yellow)
 * - Secondary color: #ffeb3b (bright yellow)
 * - Persistent effect: Horizontal speed lines and trailing particles
 * - Speed emphasis: Directional blur/streaks suggesting rapid movement
 *
 * Design principles:
 * - Fast, snappy cast animation (250ms vs 700ms for other buffs)
 * - Horizontal movement emphasis (vs vertical/circular in other buffs)
 * - Energetic and dynamic (vs calm/protective in Protect/Shell)
 * - Streaking particles (vs orbital/floating particles)
 * - Blur/motion emphasis (vs solid barriers)
 * - Minimal visual footprint during sustain (speed shouldn't slow down view)
 *
 * Special handling:
 * - Uses `isActive` prop to control when sustain phase ends
 * - Sustain phase uses `repeat: Infinity` until isActive becomes false
 * - Transitions to fade phase when isActive changes to false
 */
export const HasteAnimation: React.FC<HasteAnimationProps> = React.memo(
  ({ targetX, targetY, isActive, onCastComplete, onFadeComplete }) => {
    const [phase, setPhase] = useState<'cast' | 'sustain' | 'fade'>('cast');

    // Phase durations (ms)
    const CAST_DURATION = 500; // DOUBLED from 250ms for more anticipation
    const FADE_DURATION = 200;

    // Watch for isActive changes during sustain phase
    useEffect(() => {
      if (phase === 'sustain' && !isActive) {
        setPhase('fade');
      }
    }, [phase, isActive]);

    // Phase transition handlers
    const handleCastComplete = useCallback(() => {
      setPhase('sustain');
      onCastComplete?.();
    }, [onCastComplete]);

    const handleFadeComplete = useCallback(() => {
      onFadeComplete?.();
    }, [onFadeComplete]);

    return (
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 100,
        }}
      >
        {/* CAST PHASE: Quick yellow energy burst (250ms) */}
        {phase === 'cast' && (
          <>
            {/* Central energy burst at target */}
            <motion.div
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{
                opacity: [0, 1, 0.8, 0.6],
                scale: [0.3, 1.3, 1.1, 1],
                transition: {
                  duration: CAST_DURATION / 1000,
                  ease: [0.34, 1.56, 0.64, 1], // Quick overshoot
                  times: [0, 0.4, 0.7, 1],
                },
              }}
              onAnimationComplete={handleCastComplete}
              style={{
                position: 'absolute',
                left: targetX - 45,
                top: targetY - 45,
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${HASTE_COLORS.accent}dd 0%, ${HASTE_COLORS.secondary}99 40%, ${HASTE_COLORS.primary}55 70%, transparent 100%)`,
                boxShadow: `
                0 0 40px ${HASTE_COLORS.secondary}cc,
                0 0 20px ${HASTE_COLORS.primary}88,
                inset 0 0 30px ${HASTE_COLORS.accent}66
              `,
                filter: 'blur(3px)',
              }}
            />

            {/* Initial speed lines bursting outward */}
            <motion.div
              style={{
                position: 'absolute',
                left: targetX,
                top: targetY,
              }}
            >
              {/* Horizontal speed lines expanding left and right */}
              {[-1, 1].map((direction, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scaleX: 0, x: 0 }}
                  animate={{
                    opacity: [0, 1, 0.7, 0],
                    scaleX: [0, 1, 1, 0.8],
                    x: direction * 60,
                    transition: {
                      duration: CAST_DURATION / 1000,
                      ease: 'easeOut',
                      times: [0, 0.3, 0.7, 1],
                    },
                  }}
                  style={{
                    position: 'absolute',
                    left: direction === 1 ? 0 : -80,
                    top: -2,
                    width: 80,
                    height: 4,
                    background: `linear-gradient(to ${direction === 1 ? 'right' : 'left'}, ${HASTE_COLORS.accent}ff, ${HASTE_COLORS.secondary}cc, transparent)`,
                    boxShadow: `0 0 10px ${HASTE_COLORS.secondary}`,
                    transformOrigin: direction === 1 ? 'left center' : 'right center',
                  }}
                />
              ))}
              {/* Diagonal speed lines at 45° angles */}
              {[-45, 45, -135, 135].map((angle, i) => (
                <motion.div
                  key={`diag-${i}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 0.8, 0.5, 0],
                    scale: [0, 1, 1, 0.7],
                    transition: {
                      duration: CAST_DURATION / 1000,
                      delay: i * 0.02,
                      ease: 'easeOut',
                    },
                  }}
                  style={{
                    position: 'absolute',
                    left: -40,
                    top: -2,
                    width: 50,
                    height: 3,
                    background: `linear-gradient(to right, transparent, ${HASTE_COLORS.secondary}aa, transparent)`,
                    boxShadow: `0 0 8px ${HASTE_COLORS.primary}`,
                    transformOrigin: 'center',
                    transform: `rotate(${angle}deg)`,
                  }}
                />
              ))}
            </motion.div>

            {/* Radiating energy particles */}
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const distance = 50;

              return (
                <motion.div
                  key={i}
                  initial={{
                    x: targetX,
                    y: targetY,
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    x: targetX + Math.cos(angle) * distance,
                    y: targetY + Math.sin(angle) * distance,
                    opacity: [0, 1, 0.6, 0],
                    scale: [0, 1.2, 1, 0.5],
                    transition: {
                      duration: CAST_DURATION / 1000,
                      delay: i * 0.015,
                      ease: 'easeOut',
                    },
                  }}
                  style={{
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: i % 2 === 0 ? HASTE_COLORS.secondary : HASTE_COLORS.accent,
                    boxShadow: `0 0 10px ${HASTE_COLORS.primary}`,
                  }}
                />
              );
            })}

            {/* Core flash */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 2, 2.5],
                transition: {
                  duration: CAST_DURATION / 1000,
                  times: [0, 0.4, 1],
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 30,
                top: targetY - 30,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${HASTE_COLORS.accent}ff 0%, ${HASTE_COLORS.secondary}66 50%, transparent 80%)`,
                filter: 'blur(10px)',
              }}
            />
          </>
        )}

        {/* SUSTAIN PHASE: Persistent speed lines and particle trail */}
        {phase === 'sustain' && isActive && (
          <>
            {/* Continuous horizontal speed lines - pulsing */}
            <motion.div
              style={{
                position: 'absolute',
                left: targetX,
                top: targetY,
              }}
            >
              {/* Primary speed lines - left to right flow */}
              {[-1, 1].map((direction, i) => (
                <motion.div
                  key={`sustain-line-${i}`}
                  animate={{
                    opacity: [0.4, 0.6, 0.4],
                    scaleX: [0.9, 1.1, 0.9],
                    x: [direction * 40, direction * 50, direction * 40],
                    transition: {
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.6,
                    },
                  }}
                  style={{
                    position: 'absolute',
                    left: direction === 1 ? 0 : -60,
                    top: -1.5,
                    width: 60,
                    height: 3,
                    background: `linear-gradient(to ${direction === 1 ? 'right' : 'left'}, ${HASTE_COLORS.secondary}bb, ${HASTE_COLORS.primary}66, transparent)`,
                    boxShadow: `0 0 8px ${HASTE_COLORS.secondary}88`,
                    transformOrigin: direction === 1 ? 'left center' : 'right center',
                    filter: 'blur(0.5px)',
                  }}
                />
              ))}
              {/* Secondary speed lines - alternating */}
              {[-1, 1].map((direction, i) => (
                <motion.div
                  key={`sustain-line-alt-${i}`}
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                    scaleX: [0.8, 1, 0.8],
                    x: [direction * 35, direction * 45, direction * 35],
                    transition: {
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.6 + i * 0.6,
                    },
                  }}
                  style={{
                    position: 'absolute',
                    left: direction === 1 ? 0 : -50,
                    top: -10,
                    width: 50,
                    height: 2,
                    background: `linear-gradient(to ${direction === 1 ? 'right' : 'left'}, ${HASTE_COLORS.accent}99, ${HASTE_COLORS.secondary}44, transparent)`,
                    boxShadow: `0 0 6px ${HASTE_COLORS.primary}66`,
                    transformOrigin: direction === 1 ? 'left center' : 'right center',
                    filter: 'blur(0.5px)',
                  }}
                />
              ))}
            </motion.div>

            {/* Trailing particle effect - streaking behind */}
            {[...Array(8)].map((_, i) => {
              const yOffset = (i % 2 === 0 ? -1 : 1) * (10 + (i % 3) * 8);
              const direction = i % 2 === 0 ? 1 : -1;

              return (
                <motion.div
                  key={`trail-${i}`}
                  animate={{
                    x: [
                      targetX + direction * 20,
                      targetX + direction * 40,
                      targetX + direction * 20,
                    ],
                    y: targetY + yOffset,
                    opacity: [0.3, 0.5, 0.3],
                    scaleX: [0.8, 1.2, 0.8],
                    transition: {
                      duration: 1 + (i % 3) * 0.3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.12,
                    },
                  }}
                  style={{
                    position: 'absolute',
                    width: 12,
                    height: 3,
                    borderRadius: '50%',
                    background: `linear-gradient(to ${direction === 1 ? 'right' : 'left'}, ${HASTE_COLORS.accent}cc, ${HASTE_COLORS.secondary}66, transparent)`,
                    boxShadow: `0 0 6px ${HASTE_COLORS.primary}99`,
                    filter: 'blur(1px)',
                    transformOrigin: 'center',
                  }}
                />
              );
            })}

            {/* Subtle energy glow around character - minimal */}
            <motion.div
              animate={{
                opacity: [0.15, 0.25, 0.15],
                scale: [0.95, 1.05, 0.95],
                transition: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 40,
                top: targetY - 40,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${HASTE_COLORS.secondary}30 0%, ${HASTE_COLORS.primary}15 50%, transparent 80%)`,
                filter: 'blur(15px)',
              }}
            />

            {/* Energetic sparkles appearing randomly */}
            {[...Array(4)].map((_, i) => {
              const angle = (i / 4) * Math.PI * 2;
              const radius = 35;

              return (
                <motion.div
                  key={`sparkle-${i}`}
                  animate={{
                    opacity: [0, 0.7, 0],
                    scale: [0, 1.2, 0],
                    x: targetX + Math.cos(angle + i) * radius,
                    y: targetY + Math.sin(angle + i) * radius,
                    transition: {
                      duration: 0.8,
                      repeat: Infinity,
                      ease: 'easeOut',
                      delay: i * 0.4,
                      repeatDelay: 0.8,
                    },
                  }}
                  style={{
                    position: 'absolute',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: HASTE_COLORS.accent,
                    boxShadow: `0 0 8px ${HASTE_COLORS.secondary}`,
                  }}
                />
              );
            })}
          </>
        )}

        {/* FADE PHASE: Speed effect dissipates (200ms) */}
        {phase === 'fade' && (
          <>
            {/* Speed lines fading out rapidly */}
            <motion.div
              style={{
                position: 'absolute',
                left: targetX,
                top: targetY,
              }}
            >
              {[-1, 1].map((direction, i) => (
                <motion.div
                  key={`fade-line-${i}`}
                  initial={{ opacity: 0.5, scaleX: 1, x: direction * 45 }}
                  animate={{
                    opacity: [0.5, 0.2, 0],
                    scaleX: [1, 1.3, 1.5],
                    x: direction * 70,
                    transition: {
                      duration: FADE_DURATION / 1000,
                      ease: 'easeOut',
                    },
                  }}
                  onAnimationComplete={i === 0 ? handleFadeComplete : undefined}
                  style={{
                    position: 'absolute',
                    left: direction === 1 ? 0 : -60,
                    top: -1.5,
                    width: 60,
                    height: 3,
                    background: `linear-gradient(to ${direction === 1 ? 'right' : 'left'}, ${HASTE_COLORS.secondary}bb, ${HASTE_COLORS.primary}66, transparent)`,
                    boxShadow: `0 0 8px ${HASTE_COLORS.secondary}88`,
                    transformOrigin: direction === 1 ? 'left center' : 'right center',
                    filter: 'blur(0.5px)',
                  }}
                />
              ))}
            </motion.div>

            {/* Trailing particles dispersing */}
            {[...Array(10)].map((_, i) => {
              const angle = (i / 10) * Math.PI * 2;
              const startRadius = 30;
              const endRadius = 55;

              return (
                <motion.div
                  key={`fade-particle-${i}`}
                  initial={{
                    x: targetX + Math.cos(angle) * startRadius,
                    y: targetY + Math.sin(angle) * startRadius,
                    opacity: 0.4,
                    scale: 1,
                  }}
                  animate={{
                    x: targetX + Math.cos(angle) * endRadius,
                    y: targetY + Math.sin(angle) * endRadius,
                    opacity: [0.4, 0.2, 0],
                    scale: [1, 0.7, 0.3],
                    transition: {
                      duration: FADE_DURATION / 1000,
                      delay: i * 0.015,
                      ease: 'easeOut',
                    },
                  }}
                  style={{
                    position: 'absolute',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: i % 2 === 0 ? HASTE_COLORS.secondary : HASTE_COLORS.accent,
                    boxShadow: `0 0 8px ${HASTE_COLORS.primary}`,
                    filter: 'blur(1px)',
                  }}
                />
              );
            })}

            {/* Energy glow dissipating */}
            <motion.div
              initial={{ opacity: 0.2, scale: 1 }}
              animate={{
                opacity: [0.2, 0.1, 0],
                scale: [1, 1.3, 1.5],
                transition: {
                  duration: FADE_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 40,
                top: targetY - 40,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${HASTE_COLORS.secondary}30 0%, ${HASTE_COLORS.primary}15 50%, transparent 80%)`,
                filter: 'blur(15px)',
              }}
            />

            {/* Final flash of speed energy */}
            <motion.div
              initial={{ opacity: 0.3, scale: 0.8 }}
              animate={{
                opacity: [0.3, 0.6, 0],
                scale: [0.8, 1.5, 2],
                transition: {
                  duration: FADE_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 35,
                top: targetY - 35,
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${HASTE_COLORS.accent}99 0%, ${HASTE_COLORS.secondary}55 40%, transparent 70%)`,
                filter: 'blur(12px)',
              }}
            />
          </>
        )}
      </div>
    );
  }
);

HasteAnimation.displayName = 'HasteAnimation';
