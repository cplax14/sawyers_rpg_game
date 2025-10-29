import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ICE_COLORS } from '../types';

interface ProtectAnimationProps {
  targetX: number;
  targetY: number;
  isActive: boolean;
  onCastComplete?: () => void;
  onFadeComplete?: () => void;
}

/**
 * ProtectAnimation - Complete Protect spell animation with persistent buff effect
 *
 * Phase breakdown (700ms cast + persistent sustain + 200ms fade):
 * - Cast (300ms): Blue magical circle appears on ground beneath target
 * - Form (400ms): Shield barrier materializes, rising from circle
 * - Sustain (persistent): Subtle blue shimmer remains during buff duration
 * - Fade (200ms): When buff duration ends, shield fades away
 *
 * Visual characteristics:
 * - Primary color: #4da6ff (blue)
 * - Secondary color: #b3e0ff (light blue)
 * - Persistent effect: Gentle pulsing shield that doesn't obscure gameplay
 * - Shield design: Semi-transparent dome with hexagonal pattern
 *
 * Design principles:
 * - Visible but not distracting during sustain phase
 * - Low opacity (20-40%) for sustained effect
 * - Gentle pulsing (2s cycle) for visual interest without distraction
 * - Minimal particles during sustain (3-5 floating wisps)
 * - Clear indication of protection without blocking combat view
 *
 * Special handling:
 * - Uses `isActive` prop to control when sustain phase ends
 * - Sustain phase uses `repeat: Infinity` until isActive becomes false
 * - Transitions to fade phase when isActive changes to false
 */
export const ProtectAnimation: React.FC<ProtectAnimationProps> = React.memo(
  ({ targetX, targetY, isActive, onCastComplete, onFadeComplete }) => {
    const [phase, setPhase] = useState<'cast' | 'form' | 'sustain' | 'fade'>('cast');

    // Phase durations (ms)
    const CAST_DURATION = 600; // DOUBLED from 300ms for more anticipation
    const FORM_DURATION = 400;
    const FADE_DURATION = 200;

    // Ground circle position (beneath target's feet)
    const circleY = targetY + 30;

    // Watch for isActive changes during sustain phase
    useEffect(() => {
      if (phase === 'sustain' && !isActive) {
        setPhase('fade');
      }
    }, [phase, isActive]);

    // Phase transition handlers
    const handleCastComplete = useCallback(() => {
      setPhase('form');
    }, []);

    const handleFormComplete = useCallback(() => {
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
        {/* CAST PHASE: Blue magical circle appears on ground (300ms) */}
        {phase === 'cast' && (
          <>
            {/* Ground magic circle with radial expansion */}
            <motion.div
              initial={{ opacity: 0, scale: 0.3, rotateX: 60 }}
              animate={{
                opacity: [0, 0.8, 1],
                scale: [0.3, 1.2, 1],
                rotateX: 60,
                transition: {
                  duration: CAST_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              onAnimationComplete={handleCastComplete}
              style={{
                position: 'absolute',
                left: targetX - 60,
                top: circleY - 15,
                width: 120,
                height: 30,
                borderRadius: '50%',
                border: `3px solid ${ICE_COLORS.primary}`,
                background: `radial-gradient(ellipse, ${ICE_COLORS.secondary}40 0%, ${ICE_COLORS.primary}20 50%, transparent 80%)`,
                boxShadow: `
                0 0 20px ${ICE_COLORS.primary}80,
                inset 0 0 20px ${ICE_COLORS.secondary}60
              `,
                transformStyle: 'preserve-3d',
                transform: 'rotateX(60deg)',
              }}
            />

            {/* Rotating runic symbols in circle */}
            <motion.div
              initial={{ opacity: 0, rotateZ: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1],
                rotateZ: 360,
                scale: [0.5, 1, 1],
                transition: {
                  duration: CAST_DURATION / 1000,
                  rotateZ: { duration: CAST_DURATION / 1000, ease: 'linear' },
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 50,
                top: circleY - 25,
                width: 100,
                height: 50,
                transformStyle: 'preserve-3d',
                transform: 'rotateX(60deg)',
                opacity: 0.8,
              }}
            >
              {/* Hexagonal pattern suggestion (using borders) */}
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 30,
                    height: 2,
                    background: `linear-gradient(to right, transparent, ${ICE_COLORS.accent}, transparent)`,
                    transformOrigin: 'center left',
                    transform: `rotate(${angle}deg)`,
                    boxShadow: `0 0 4px ${ICE_COLORS.primary}`,
                  }}
                />
              ))}
            </motion.div>

            {/* Ground glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 0.6, 0.8],
                scale: [0.5, 1.3, 1.5],
                transition: {
                  duration: CAST_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 70,
                top: circleY - 20,
                width: 140,
                height: 40,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, ${ICE_COLORS.primary}30 0%, transparent 70%)`,
                filter: 'blur(20px)',
                transform: 'rotateX(60deg)',
                transformStyle: 'preserve-3d',
              }}
            />
          </>
        )}

        {/* FORM PHASE: Shield barrier materializes, rising from circle (400ms) */}
        {phase === 'form' && (
          <>
            {/* Ground circle remains visible but fading */}
            <motion.div
              initial={{ opacity: 1, scale: 1, rotateX: 60 }}
              animate={{
                opacity: [1, 0.6, 0.3],
                scale: [1, 1, 1],
                transition: {
                  duration: FORM_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 60,
                top: circleY - 15,
                width: 120,
                height: 30,
                borderRadius: '50%',
                border: `3px solid ${ICE_COLORS.primary}`,
                background: `radial-gradient(ellipse, ${ICE_COLORS.secondary}40 0%, ${ICE_COLORS.primary}20 50%, transparent 80%)`,
                transform: 'rotateX(60deg)',
                transformStyle: 'preserve-3d',
              }}
            />

            {/* Rising shield dome */}
            <motion.div
              initial={{
                opacity: 0,
                scaleY: 0,
                scaleX: 0.5,
                transformOrigin: 'bottom center',
              }}
              animate={{
                opacity: [0, 0.7, 0.85, 0.8],
                scaleY: [0, 1, 1.05, 1],
                scaleX: [0.5, 1, 1.02, 1],
                transition: {
                  duration: FORM_DURATION / 1000,
                  ease: [0.34, 1.56, 0.64, 1], // Overshoot slightly for impact
                  times: [0, 0.6, 0.8, 1],
                },
              }}
              onAnimationComplete={handleFormComplete}
              style={{
                position: 'absolute',
                left: targetX - 55,
                top: targetY - 80,
                width: 110,
                height: 110,
                borderRadius: '50%',
                border: `2px solid ${ICE_COLORS.primary}cc`,
                background: `
                radial-gradient(circle at 30% 30%,
                  ${ICE_COLORS.secondary}50 0%,
                  ${ICE_COLORS.primary}30 40%,
                  ${ICE_COLORS.primary}20 70%,
                  transparent 100%
                )
              `,
                boxShadow: `
                0 0 30px ${ICE_COLORS.primary}60,
                inset 0 0 30px ${ICE_COLORS.secondary}40,
                inset -20px -20px 40px ${ICE_COLORS.accent}20
              `,
                filter: 'blur(1px)',
              }}
            />

            {/* Hexagonal pattern weaving */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.8, 0.9, 0.7],
                rotateZ: [0, 0, 30],
                transition: {
                  duration: FORM_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 50,
                top: targetY - 75,
                width: 100,
                height: 100,
                borderRadius: '50%',
                opacity: 0.6,
              }}
            >
              {/* Hexagonal grid pattern */}
              {[0, 60, 120].map((angle, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{
                    scaleY: [0, 1],
                    transition: {
                      delay: i * 0.08,
                      duration: (FORM_DURATION / 1000) * 0.6,
                      ease: 'easeOut',
                    },
                  }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 60,
                    height: 1,
                    background: `linear-gradient(to right, transparent, ${ICE_COLORS.primary}dd, transparent)`,
                    transformOrigin: 'center left',
                    transform: `rotate(${angle}deg)`,
                    boxShadow: `0 0 6px ${ICE_COLORS.secondary}`,
                  }}
                />
              ))}
            </motion.div>

            {/* Formation particles rising with shield */}
            <motion.div
              initial={{ y: 0 }}
              animate={{
                y: -60,
                transition: {
                  duration: FORM_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX,
                top: circleY,
              }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0.8, 0],
                    scale: [0, 1, 1, 0.5],
                    x: Math.cos((i / 8) * Math.PI * 2) * 35,
                    y: Math.sin((i / 8) * Math.PI * 2) * 35,
                    transition: {
                      duration: FORM_DURATION / 1000,
                      delay: i * 0.04,
                      ease: 'easeOut',
                    },
                  }}
                  style={{
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: ICE_COLORS.secondary,
                    boxShadow: `0 0 8px ${ICE_COLORS.primary}`,
                  }}
                />
              ))}
            </motion.div>

            {/* Shield formation flash */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0.8, 1.3, 1.5],
                transition: {
                  duration: FORM_DURATION / 1000,
                  times: [0, 0.5, 1],
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 60,
                top: targetY - 85,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${ICE_COLORS.accent}60 0%, ${ICE_COLORS.secondary}30 40%, transparent 70%)`,
                filter: 'blur(15px)',
              }}
            />
          </>
        )}

        {/* SUSTAIN PHASE: Persistent gentle shimmer during buff duration */}
        {phase === 'sustain' && isActive && (
          <>
            {/* Pulsing shield barrier - infinite loop */}
            <motion.div
              animate={{
                opacity: [0.35, 0.45, 0.35],
                scale: [0.98, 1.02, 0.98],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 55,
                top: targetY - 80,
                width: 110,
                height: 110,
                borderRadius: '50%',
                border: `2px solid ${ICE_COLORS.primary}99`,
                background: `
                radial-gradient(circle at 30% 30%,
                  ${ICE_COLORS.secondary}40 0%,
                  ${ICE_COLORS.primary}25 40%,
                  ${ICE_COLORS.primary}15 70%,
                  transparent 100%
                )
              `,
                boxShadow: `
                0 0 25px ${ICE_COLORS.primary}50,
                inset 0 0 25px ${ICE_COLORS.secondary}30,
                inset -15px -15px 30px ${ICE_COLORS.accent}15
              `,
                filter: 'blur(1px)',
              }}
            />

            {/* Rotating hexagonal pattern - slow, infinite */}
            <motion.div
              animate={{
                rotateZ: 360,
                opacity: [0.5, 0.6, 0.5],
                transition: {
                  rotateZ: {
                    duration: 8,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                  opacity: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 50,
                top: targetY - 75,
                width: 100,
                height: 100,
                borderRadius: '50%',
                opacity: 0.5,
              }}
            >
              {[0, 60, 120].map((angle, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 60,
                    height: 1,
                    background: `linear-gradient(to right, transparent, ${ICE_COLORS.primary}cc, transparent)`,
                    transformOrigin: 'center left',
                    transform: `rotate(${angle}deg)`,
                    boxShadow: `0 0 5px ${ICE_COLORS.secondary}`,
                  }}
                />
              ))}
            </motion.div>

            {/* Minimal floating particles - 5 particles in gentle orbit */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  x: [
                    targetX + Math.cos((i / 5) * Math.PI * 2) * 40,
                    targetX + Math.cos((i / 5) * Math.PI * 2 + Math.PI) * 40,
                    targetX + Math.cos((i / 5) * Math.PI * 2) * 40,
                  ],
                  y: [
                    targetY - 40 + Math.sin((i / 5) * Math.PI * 2) * 40,
                    targetY - 40 + Math.sin((i / 5) * Math.PI * 2 + Math.PI) * 40,
                    targetY - 40 + Math.sin((i / 5) * Math.PI * 2) * 40,
                  ],
                  opacity: [0.4, 0.6, 0.4],
                  transition: {
                    duration: 3 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }}
                style={{
                  position: 'absolute',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: i % 2 === 0 ? ICE_COLORS.secondary : ICE_COLORS.accent,
                  boxShadow: `0 0 6px ${ICE_COLORS.primary}`,
                  filter: 'blur(1px)',
                }}
              />
            ))}

            {/* Subtle ground circle reminder */}
            <motion.div
              animate={{
                opacity: [0.2, 0.3, 0.2],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 60,
                top: circleY - 15,
                width: 120,
                height: 30,
                borderRadius: '50%',
                border: `1px solid ${ICE_COLORS.primary}66`,
                background: `radial-gradient(ellipse, ${ICE_COLORS.secondary}20 0%, transparent 70%)`,
                transform: 'rotateX(60deg)',
                transformStyle: 'preserve-3d',
              }}
            />
          </>
        )}

        {/* FADE PHASE: Shield dissipates when buff ends (200ms) */}
        {phase === 'fade' && (
          <>
            {/* Shield barrier fading */}
            <motion.div
              initial={{ opacity: 0.35, scale: 1 }}
              animate={{
                opacity: [0.35, 0.2, 0],
                scale: [1, 1.1, 1.2],
                transition: {
                  duration: FADE_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              onAnimationComplete={handleFadeComplete}
              style={{
                position: 'absolute',
                left: targetX - 55,
                top: targetY - 80,
                width: 110,
                height: 110,
                borderRadius: '50%',
                border: `2px solid ${ICE_COLORS.primary}99`,
                background: `
                radial-gradient(circle at 30% 30%,
                  ${ICE_COLORS.secondary}40 0%,
                  ${ICE_COLORS.primary}25 40%,
                  ${ICE_COLORS.primary}15 70%,
                  transparent 100%
                )
              `,
                boxShadow: `0 0 25px ${ICE_COLORS.primary}50`,
                filter: 'blur(1px)',
              }}
            />

            {/* Hexagonal pattern fading */}
            <motion.div
              initial={{ opacity: 0.5, rotateZ: 0 }}
              animate={{
                opacity: [0.5, 0.3, 0],
                rotateZ: 30,
                transition: {
                  duration: FADE_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 50,
                top: targetY - 75,
                width: 100,
                height: 100,
                borderRadius: '50%',
              }}
            >
              {[0, 60, 120].map((angle, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 60,
                    height: 1,
                    background: `linear-gradient(to right, transparent, ${ICE_COLORS.primary}cc, transparent)`,
                    transformOrigin: 'center left',
                    transform: `rotate(${angle}deg)`,
                    boxShadow: `0 0 5px ${ICE_COLORS.secondary}`,
                  }}
                />
              ))}
            </motion.div>

            {/* Dissipating particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: targetX + Math.cos((i / 8) * Math.PI * 2) * 40,
                  y: targetY - 40 + Math.sin((i / 8) * Math.PI * 2) * 40,
                  opacity: 0.5,
                  scale: 1,
                }}
                animate={{
                  x: targetX + Math.cos((i / 8) * Math.PI * 2) * 60,
                  y: targetY - 60 + Math.sin((i / 8) * Math.PI * 2) * 60,
                  opacity: [0.5, 0.3, 0],
                  scale: [1, 0.8, 0.3],
                  transition: {
                    duration: FADE_DURATION / 1000,
                    ease: 'easeOut',
                  },
                }}
                style={{
                  position: 'absolute',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: i % 2 === 0 ? ICE_COLORS.secondary : ICE_COLORS.accent,
                  boxShadow: `0 0 6px ${ICE_COLORS.primary}`,
                  filter: 'blur(1px)',
                }}
              />
            ))}

            {/* Ground circle fading */}
            <motion.div
              initial={{ opacity: 0.2, scale: 1 }}
              animate={{
                opacity: [0.2, 0.1, 0],
                scale: [1, 1.1, 1.2],
                transition: {
                  duration: FADE_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 60,
                top: circleY - 15,
                width: 120,
                height: 30,
                borderRadius: '50%',
                border: `1px solid ${ICE_COLORS.primary}66`,
                background: `radial-gradient(ellipse, ${ICE_COLORS.secondary}20 0%, transparent 70%)`,
                transform: 'rotateX(60deg)',
                transformStyle: 'preserve-3d',
              }}
            />
          </>
        )}
      </div>
    );
  }
);

ProtectAnimation.displayName = 'ProtectAnimation';
