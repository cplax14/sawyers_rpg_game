import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ARCANE_COLORS } from '../types';

interface ShellAnimationProps {
  targetX: number;
  targetY: number;
  isActive: boolean;
  onCastComplete?: () => void;
  onFadeComplete?: () => void;
}

/**
 * ShellAnimation - Complete Shell spell animation with persistent buff effect
 *
 * Phase breakdown (700ms cast + persistent sustain + 200ms fade):
 * - Cast (300ms): Purple arcane circle appears on ground beneath target
 * - Form (400ms): Mystical barrier weaves together from flowing arcane energy
 * - Sustain (persistent): Ethereal purple aura remains during buff duration
 * - Fade (200ms): When buff duration ends, magical energy dissipates
 *
 * Visual characteristics:
 * - Primary color: #9c27b0 (purple)
 * - Secondary color: #ba68c8 (light purple)
 * - Persistent effect: Flowing ethereal aura that doesn't obscure gameplay
 * - Barrier design: Semi-transparent dome with flowing arcane patterns
 *
 * Design principles:
 * - Mystical and arcane (vs Protect's physical/geometric)
 * - Flowing organic patterns (vs rigid hexagonal structure)
 * - Ethereal and translucent (vs solid and structured)
 * - Wispy particles (vs orbital particles)
 * - Slower, more mystical rotation (10-12s vs 8s)
 * - Arcane runes/glyphs (vs geometric symbols)
 *
 * Special handling:
 * - Uses `isActive` prop to control when sustain phase ends
 * - Sustain phase uses `repeat: Infinity` until isActive becomes false
 * - Transitions to fade phase when isActive changes to false
 */
export const ShellAnimation: React.FC<ShellAnimationProps> = React.memo(
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
        {/* CAST PHASE: Purple arcane circle appears on ground (300ms) */}
        {phase === 'cast' && (
          <>
            {/* Ground magic circle with flowing expansion */}
            <motion.div
              initial={{ opacity: 0, scale: 0.3, rotateX: 60 }}
              animate={{
                opacity: [0, 0.9, 1],
                scale: [0.3, 1.3, 1],
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
                border: `3px solid ${ARCANE_COLORS.primary}`,
                background: `radial-gradient(ellipse, ${ARCANE_COLORS.secondary}50 0%, ${ARCANE_COLORS.primary}30 50%, transparent 80%)`,
                boxShadow: `
                0 0 25px ${ARCANE_COLORS.primary}90,
                inset 0 0 25px ${ARCANE_COLORS.secondary}70,
                0 0 40px ${ARCANE_COLORS.accent}60
              `,
                transformStyle: 'preserve-3d',
                transform: 'rotateX(60deg)',
              }}
            />

            {/* Flowing arcane runes in circle - organic rotation */}
            <motion.div
              initial={{ opacity: 0, rotateZ: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1],
                rotateZ: [0, 180, 360],
                scale: [0.5, 1.1, 1],
                transition: {
                  duration: CAST_DURATION / 1000,
                  rotateZ: { duration: CAST_DURATION / 1000, ease: [0.25, 0.1, 0.25, 1] },
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
                opacity: 0.9,
              }}
            >
              {/* Flowing arcane symbols (curved patterns vs straight hexagons) */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 0.8],
                    transition: {
                      delay: i * 0.03,
                      duration: (CAST_DURATION / 1000) * 0.8,
                    },
                  }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 35,
                    height: 2,
                    background: `linear-gradient(to right, transparent, ${ARCANE_COLORS.secondary}ee, ${ARCANE_COLORS.primary}aa, transparent)`,
                    transformOrigin: 'center left',
                    transform: `rotate(${angle}deg)`,
                    boxShadow: `0 0 6px ${ARCANE_COLORS.primary}`,
                    borderRadius: '50%',
                    filter: 'blur(0.5px)',
                  }}
                />
              ))}
            </motion.div>

            {/* Wispy particles rising from circle edges */}
            <motion.div
              style={{
                position: 'absolute',
                left: targetX,
                top: circleY,
              }}
            >
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{
                    opacity: [0, 0.7, 0.5],
                    y: [0, -15, -25],
                    x: Math.cos((i / 6) * Math.PI * 2) * (20 + i * 3),
                    transition: {
                      delay: i * 0.04,
                      duration: (CAST_DURATION / 1000) * 0.9,
                      ease: 'easeOut',
                    },
                  }}
                  style={{
                    position: 'absolute',
                    width: 4,
                    height: 8,
                    borderRadius: '50%',
                    background: `linear-gradient(to top, ${ARCANE_COLORS.primary}, ${ARCANE_COLORS.secondary})`,
                    boxShadow: `0 0 10px ${ARCANE_COLORS.primary}`,
                    filter: 'blur(1px)',
                  }}
                />
              ))}
            </motion.div>

            {/* Ground glow - more diffuse and mystical */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 0.7, 0.9],
                scale: [0.5, 1.4, 1.6],
                transition: {
                  duration: CAST_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 75,
                top: circleY - 22,
                width: 150,
                height: 44,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, ${ARCANE_COLORS.primary}40 0%, ${ARCANE_COLORS.secondary}20 40%, transparent 75%)`,
                filter: 'blur(25px)',
                transform: 'rotateX(60deg)',
                transformStyle: 'preserve-3d',
              }}
            />
          </>
        )}

        {/* FORM PHASE: Mystical barrier weaves together from arcane energy (400ms) */}
        {phase === 'form' && (
          <>
            {/* Ground circle remains visible but fading */}
            <motion.div
              initial={{ opacity: 1, scale: 1, rotateX: 60 }}
              animate={{
                opacity: [1, 0.5, 0.3],
                scale: [1, 1.05, 1],
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
                border: `3px solid ${ARCANE_COLORS.primary}`,
                background: `radial-gradient(ellipse, ${ARCANE_COLORS.secondary}50 0%, ${ARCANE_COLORS.primary}30 50%, transparent 80%)`,
                transform: 'rotateX(60deg)',
                transformStyle: 'preserve-3d',
              }}
            />

            {/* Rising mystical dome - more ethereal than Protect */}
            <motion.div
              initial={{
                opacity: 0,
                scaleY: 0,
                scaleX: 0.5,
                transformOrigin: 'bottom center',
              }}
              animate={{
                opacity: [0, 0.6, 0.75, 0.7],
                scaleY: [0, 1, 1.08, 1],
                scaleX: [0.5, 1, 1.04, 1],
                transition: {
                  duration: FORM_DURATION / 1000,
                  ease: [0.34, 1.56, 0.64, 1],
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
                border: `2px solid ${ARCANE_COLORS.primary}bb`,
                background: `
                radial-gradient(circle at 30% 30%,
                  ${ARCANE_COLORS.secondary}45 0%,
                  ${ARCANE_COLORS.primary}28 40%,
                  ${ARCANE_COLORS.accent}15 70%,
                  transparent 100%
                )
              `,
                boxShadow: `
                0 0 35px ${ARCANE_COLORS.primary}70,
                inset 0 0 35px ${ARCANE_COLORS.secondary}50,
                inset -15px -15px 40px ${ARCANE_COLORS.accent}30,
                0 0 50px ${ARCANE_COLORS.primary}40
              `,
                filter: 'blur(1.5px)',
              }}
            />

            {/* Flowing arcane patterns weaving together */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.7, 0.85, 0.6],
                rotateZ: [0, 0, 20],
                transition: {
                  duration: FORM_DURATION / 1000,
                  ease: [0.25, 0.1, 0.25, 1],
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
              {/* Flowing energy streams (3 curved paths vs hexagonal grid) */}
              {[0, 120, 240].map((angle, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{
                    scaleY: [0, 1.2, 1],
                    opacity: [0, 0.8, 0.6],
                    transition: {
                      delay: i * 0.1,
                      duration: (FORM_DURATION / 1000) * 0.7,
                      ease: [0.25, 0.1, 0.25, 1],
                    },
                  }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 65,
                    height: 1.5,
                    background: `linear-gradient(to right, transparent, ${ARCANE_COLORS.secondary}ee, ${ARCANE_COLORS.primary}cc, transparent)`,
                    transformOrigin: 'center left',
                    transform: `rotate(${angle}deg)`,
                    boxShadow: `0 0 8px ${ARCANE_COLORS.secondary}, 0 0 4px ${ARCANE_COLORS.primary}`,
                    borderRadius: '50%',
                    filter: 'blur(0.5px)',
                  }}
                />
              ))}
              {/* Inner flowing patterns */}
              {[30, 150, 270].map((angle, i) => (
                <motion.div
                  key={`inner-${i}`}
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{
                    scaleY: [0, 1],
                    opacity: [0, 0.5],
                    transition: {
                      delay: i * 0.1 + 0.05,
                      duration: (FORM_DURATION / 1000) * 0.6,
                      ease: 'easeOut',
                    },
                  }}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 40,
                    height: 1,
                    background: `linear-gradient(to right, transparent, ${ARCANE_COLORS.accent}aa, transparent)`,
                    transformOrigin: 'center left',
                    transform: `rotate(${angle}deg)`,
                    boxShadow: `0 0 6px ${ARCANE_COLORS.accent}`,
                    borderRadius: '50%',
                    filter: 'blur(0.5px)',
                  }}
                />
              ))}
            </motion.div>

            {/* Magical essence particles swirling upward */}
            <motion.div
              initial={{ y: 0 }}
              animate={{
                y: -60,
                transition: {
                  duration: FORM_DURATION / 1000,
                  ease: [0.25, 0.1, 0.25, 1],
                },
              }}
              style={{
                position: 'absolute',
                left: targetX,
                top: circleY,
              }}
            >
              {[...Array(10)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0.9, 0.3],
                    scale: [0, 1.2, 1, 0.7],
                    x: Math.cos((i / 10) * Math.PI * 2) * (30 + Math.sin(i) * 10),
                    y: Math.sin((i / 10) * Math.PI * 2) * (30 + Math.cos(i) * 10),
                    transition: {
                      duration: FORM_DURATION / 1000,
                      delay: i * 0.03,
                      ease: [0.25, 0.1, 0.25, 1],
                    },
                  }}
                  style={{
                    position: 'absolute',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: i % 3 === 0 ? ARCANE_COLORS.secondary : ARCANE_COLORS.primary,
                    boxShadow: `0 0 10px ${ARCANE_COLORS.primary}`,
                    filter: 'blur(1px)',
                  }}
                />
              ))}
            </motion.div>

            {/* Mystical formation flash */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.8, 1.4, 1.6],
                transition: {
                  duration: FORM_DURATION / 1000,
                  times: [0, 0.5, 1],
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 65,
                top: targetY - 90,
                width: 130,
                height: 130,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${ARCANE_COLORS.secondary}70 0%, ${ARCANE_COLORS.primary}40 40%, transparent 70%)`,
                filter: 'blur(20px)',
              }}
            />
          </>
        )}

        {/* SUSTAIN PHASE: Persistent ethereal aura during buff duration */}
        {phase === 'sustain' && isActive && (
          <>
            {/* Pulsing ethereal barrier - infinite loop, more translucent than Protect */}
            <motion.div
              animate={{
                opacity: [0.3, 0.4, 0.3],
                scale: [0.97, 1.03, 0.97],
                transition: {
                  duration: 2.5,
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
                border: `2px solid ${ARCANE_COLORS.primary}88`,
                background: `
                radial-gradient(circle at 30% 30%,
                  ${ARCANE_COLORS.secondary}35 0%,
                  ${ARCANE_COLORS.primary}20 40%,
                  ${ARCANE_COLORS.accent}12 70%,
                  transparent 100%
                )
              `,
                boxShadow: `
                0 0 30px ${ARCANE_COLORS.primary}50,
                inset 0 0 30px ${ARCANE_COLORS.secondary}35,
                inset -12px -12px 35px ${ARCANE_COLORS.accent}20
              `,
                filter: 'blur(1.5px)',
              }}
            />

            {/* Flowing arcane patterns - slower, more mystical rotation */}
            <motion.div
              animate={{
                rotateZ: 360,
                opacity: [0.4, 0.55, 0.4],
                transition: {
                  rotateZ: {
                    duration: 12,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                  opacity: {
                    duration: 2.5,
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
                opacity: 0.45,
              }}
            >
              {/* Flowing energy streams */}
              {[0, 120, 240].map((angle, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 65,
                    height: 1.5,
                    background: `linear-gradient(to right, transparent, ${ARCANE_COLORS.secondary}bb, ${ARCANE_COLORS.primary}99, transparent)`,
                    transformOrigin: 'center left',
                    transform: `rotate(${angle}deg)`,
                    boxShadow: `0 0 6px ${ARCANE_COLORS.secondary}`,
                    borderRadius: '50%',
                    filter: 'blur(0.5px)',
                  }}
                />
              ))}
              {/* Counter-rotating inner patterns */}
              <motion.div
                animate={{
                  rotateZ: -360,
                  transition: {
                    duration: 10,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                }}
              >
                {[30, 150, 270].map((angle, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: 40,
                      height: 1,
                      background: `linear-gradient(to right, transparent, ${ARCANE_COLORS.accent}88, transparent)`,
                      transformOrigin: 'center left',
                      transform: `rotate(${angle}deg)`,
                      boxShadow: `0 0 4px ${ARCANE_COLORS.accent}`,
                      borderRadius: '50%',
                      filter: 'blur(0.5px)',
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>

            {/* Wispy floating particles - gentle flowing motion (not orbital) */}
            {[...Array(6)].map((_, i) => {
              const baseAngle = (i / 6) * Math.PI * 2;
              const radius = 45;
              const flowAmplitude = 15;

              return (
                <motion.div
                  key={i}
                  animate={{
                    x: [
                      targetX + Math.cos(baseAngle) * radius,
                      targetX + Math.cos(baseAngle + 0.3) * (radius + flowAmplitude),
                      targetX + Math.cos(baseAngle + 0.6) * radius,
                      targetX + Math.cos(baseAngle) * (radius - flowAmplitude),
                      targetX + Math.cos(baseAngle) * radius,
                    ],
                    y: [
                      targetY - 40 + Math.sin(baseAngle) * radius,
                      targetY - 40 + Math.sin(baseAngle + 0.3) * (radius + flowAmplitude),
                      targetY - 40 + Math.sin(baseAngle + 0.6) * radius,
                      targetY - 40 + Math.sin(baseAngle) * (radius - flowAmplitude),
                      targetY - 40 + Math.sin(baseAngle) * radius,
                    ],
                    opacity: [0.3, 0.6, 0.4, 0.5, 0.3],
                    scale: [1, 1.3, 1, 1.2, 1],
                    transition: {
                      duration: 4 + i * 0.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    },
                  }}
                  style={{
                    position: 'absolute',
                    width: 4,
                    height: 8,
                    borderRadius: '50%',
                    background:
                      i % 2 === 0
                        ? `linear-gradient(to top, ${ARCANE_COLORS.primary}, ${ARCANE_COLORS.secondary})`
                        : `linear-gradient(to top, ${ARCANE_COLORS.accent}, ${ARCANE_COLORS.primary})`,
                    boxShadow: `0 0 8px ${ARCANE_COLORS.primary}`,
                    filter: 'blur(1.5px)',
                  }}
                />
              );
            })}

            {/* Subtle ground circle reminder - mystical pulsing */}
            <motion.div
              animate={{
                opacity: [0.15, 0.28, 0.15],
                scale: [0.98, 1.02, 0.98],
                transition: {
                  duration: 2.5,
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
                border: `1px solid ${ARCANE_COLORS.primary}55`,
                background: `radial-gradient(ellipse, ${ARCANE_COLORS.secondary}25 0%, ${ARCANE_COLORS.accent}15 50%, transparent 75%)`,
                transform: 'rotateX(60deg)',
                transformStyle: 'preserve-3d',
                boxShadow: `0 0 15px ${ARCANE_COLORS.primary}30`,
              }}
            />
          </>
        )}

        {/* FADE PHASE: Magical energy dissipates when buff ends (200ms) */}
        {phase === 'fade' && (
          <>
            {/* Barrier dissolving into wispy energy */}
            <motion.div
              initial={{ opacity: 0.3, scale: 1 }}
              animate={{
                opacity: [0.3, 0.15, 0],
                scale: [1, 1.15, 1.25],
                transition: {
                  duration: FADE_DURATION / 1000,
                  ease: 'easeIn',
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
                border: `2px solid ${ARCANE_COLORS.primary}88`,
                background: `
                radial-gradient(circle at 30% 30%,
                  ${ARCANE_COLORS.secondary}35 0%,
                  ${ARCANE_COLORS.primary}20 40%,
                  ${ARCANE_COLORS.accent}12 70%,
                  transparent 100%
                )
              `,
                boxShadow: `0 0 30px ${ARCANE_COLORS.primary}50`,
                filter: 'blur(1.5px)',
              }}
            />

            {/* Arcane patterns scattering */}
            <motion.div
              initial={{ opacity: 0.45, rotateZ: 0 }}
              animate={{
                opacity: [0.45, 0.25, 0],
                rotateZ: 40,
                scale: [1, 1.2, 1.4],
                transition: {
                  duration: FADE_DURATION / 1000,
                  ease: 'easeIn',
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
              {[0, 120, 240].map((angle, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: 65,
                    height: 1.5,
                    background: `linear-gradient(to right, transparent, ${ARCANE_COLORS.secondary}bb, ${ARCANE_COLORS.primary}99, transparent)`,
                    transformOrigin: 'center left',
                    transform: `rotate(${angle}deg)`,
                    boxShadow: `0 0 6px ${ARCANE_COLORS.secondary}`,
                    borderRadius: '50%',
                    filter: 'blur(0.5px)',
                  }}
                />
              ))}
            </motion.div>

            {/* Wispy particles drifting upward and dissipating */}
            {[...Array(10)].map((_, i) => {
              const baseAngle = (i / 10) * Math.PI * 2;
              const radius = 40;

              return (
                <motion.div
                  key={i}
                  initial={{
                    x: targetX + Math.cos(baseAngle) * radius,
                    y: targetY - 40 + Math.sin(baseAngle) * radius,
                    opacity: 0.4,
                    scale: 1,
                  }}
                  animate={{
                    x: targetX + Math.cos(baseAngle) * (radius + 30),
                    y: targetY - 80 + Math.sin(baseAngle) * (radius + 20),
                    opacity: [0.4, 0.2, 0],
                    scale: [1, 0.6, 0.2],
                    transition: {
                      duration: FADE_DURATION / 1000,
                      delay: i * 0.015,
                      ease: [0.25, 0.1, 0.25, 1],
                    },
                  }}
                  style={{
                    position: 'absolute',
                    width: 5,
                    height: 8,
                    borderRadius: '50%',
                    background:
                      i % 2 === 0
                        ? `linear-gradient(to top, ${ARCANE_COLORS.primary}, ${ARCANE_COLORS.secondary})`
                        : `linear-gradient(to top, ${ARCANE_COLORS.accent}, ${ARCANE_COLORS.primary})`,
                    boxShadow: `0 0 8px ${ARCANE_COLORS.primary}`,
                    filter: 'blur(1.5px)',
                  }}
                />
              );
            })}

            {/* Ground circle fading */}
            <motion.div
              initial={{ opacity: 0.15, scale: 1 }}
              animate={{
                opacity: [0.15, 0.08, 0],
                scale: [1, 1.15, 1.3],
                transition: {
                  duration: FADE_DURATION / 1000,
                  ease: 'easeIn',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 60,
                top: circleY - 15,
                width: 120,
                height: 30,
                borderRadius: '50%',
                border: `1px solid ${ARCANE_COLORS.primary}55`,
                background: `radial-gradient(ellipse, ${ARCANE_COLORS.secondary}25 0%, ${ARCANE_COLORS.accent}15 50%, transparent 75%)`,
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

ShellAnimation.displayName = 'ShellAnimation';
