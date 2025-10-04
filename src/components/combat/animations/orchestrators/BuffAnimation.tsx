import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BuffAura } from '../core/BuffAura';
import { StatusOverlay } from '../core/StatusOverlay';

export type BuffType =
  | 'protect'      // Physical defense buff (blue)
  | 'shell'        // Magic defense buff (purple)
  | 'haste'        // Speed buff (yellow/gold)
  | 'strength'     // Attack buff (red)
  | 'barrier'      // HP shield (cyan)
  | 'regen'        // HP regeneration (green)
  | 'reflect'      // Damage reflection (silver)
  | 'berserk';     // Critical buff (orange)

export type BuffVisualStyle = 'defensive' | 'offensive' | 'supportive' | 'enhancement';

interface BuffAnimationProps {
  buffType: BuffType;
  targetX: number;
  targetY: number;
  isActive: boolean;
  onCastComplete?: () => void;
  onFadeComplete?: () => void;
  // Optional customization
  customColor?: string;
  customIntensity?: number;
  showStatusOverlay?: boolean;
  visualStyle?: BuffVisualStyle;
}

/**
 * BuffAnimation - General-purpose buff effect orchestrator
 *
 * Coordinates StatusOverlay and BuffAura components to create complete buff animations.
 * Manages the full lifecycle: cast → sustain → fade
 *
 * ARCHITECTURE:
 * - Orchestrator pattern: coordinates multiple core animation components
 * - Phase-based animation: cast (initial application) → sustain (persistent effect) → fade (removal)
 * - Composable: uses StatusOverlay for status indicators and BuffAura for character auras
 * - Type-driven: buffType determines colors, intensity, and visual characteristics
 *
 * DESIGN PRINCIPLES:
 * - Each buff type has distinct visual identity (color, particle style, intensity)
 * - Sustain phase is subtle (20-40% opacity) to avoid obscuring gameplay
 * - Cast and fade phases are more dramatic for clear feedback
 * - GPU-accelerated properties only (transform, opacity)
 * - Particle counts kept minimal during sustain (5-8 particles)
 *
 * BUFF TYPE CHARACTERISTICS:
 * - Defensive buffs (protect, shell, barrier): Calm blues/purples, shield-like, gentle pulsing
 * - Offensive buffs (strength, berserk): Energetic reds/oranges, aggressive particles, faster pulsing
 * - Speed buffs (haste): Yellow/gold, horizontal streaks, rapid movement
 * - Support buffs (regen, reflect): Greens/silvers, orbital particles, soothing flow
 *
 * USAGE:
 * ```tsx
 * <BuffAnimation
 *   buffType="protect"
 *   targetX={playerX}
 *   targetY={playerY}
 *   isActive={hasProtectBuff}
 *   onCastComplete={() => console.log('Buff applied')}
 *   onFadeComplete={() => console.log('Buff removed')}
 * />
 * ```
 */
export const BuffAnimation: React.FC<BuffAnimationProps> = React.memo(({
  buffType,
  targetX,
  targetY,
  isActive,
  onCastComplete,
  onFadeComplete,
  customColor,
  customIntensity,
  showStatusOverlay = false,
  visualStyle
}) => {
  const [phase, setPhase] = useState<'cast' | 'sustain' | 'fade'>('cast');

  // Phase durations (ms)
  const CAST_DURATION = buffType === 'haste' ? 250 : 350; // Haste is faster
  const FADE_DURATION = 200;

  /**
   * Get buff-specific visual configuration
   * Returns color palette, intensity, particle settings, and visual style
   */
  const getBuffConfig = () => {
    // Allow custom color override
    if (customColor) {
      return {
        auraColor: customColor,
        pulseSpeed: 2,
        particles: true,
        intensity: customIntensity || 0.5,
        statusColor: customColor,
        style: visualStyle || 'enhancement' as BuffVisualStyle
      };
    }

    // Type-specific configurations
    switch (buffType) {
      case 'protect':
        return {
          auraColor: '#4da6ff',      // Blue
          pulseSpeed: 2.5,
          particles: true,
          intensity: 0.5,
          statusColor: '#4da6ff',
          style: 'defensive' as BuffVisualStyle
        };

      case 'shell':
        return {
          auraColor: '#9c27b0',      // Purple
          pulseSpeed: 2.5,
          particles: true,
          intensity: 0.5,
          statusColor: '#9c27b0',
          style: 'defensive' as BuffVisualStyle
        };

      case 'haste':
        return {
          auraColor: '#ffd700',      // Gold/Yellow
          pulseSpeed: 1.2,            // Faster pulse for speed buff
          particles: true,
          intensity: 0.6,
          statusColor: '#ffd700',
          style: 'enhancement' as BuffVisualStyle
        };

      case 'strength':
        return {
          auraColor: '#ff4444',      // Red
          pulseSpeed: 1.8,
          particles: true,
          intensity: 0.6,
          statusColor: '#ff4444',
          style: 'offensive' as BuffVisualStyle
        };

      case 'barrier':
        return {
          auraColor: '#00bcd4',      // Cyan
          pulseSpeed: 2,
          particles: true,
          intensity: 0.5,
          statusColor: '#00bcd4',
          style: 'defensive' as BuffVisualStyle
        };

      case 'regen':
        return {
          auraColor: '#4caf50',      // Green
          pulseSpeed: 3,              // Slower, soothing pulse
          particles: true,
          intensity: 0.4,
          statusColor: '#4caf50',
          style: 'supportive' as BuffVisualStyle
        };

      case 'reflect':
        return {
          auraColor: '#c0c0c0',      // Silver
          pulseSpeed: 2.2,
          particles: true,
          intensity: 0.5,
          statusColor: '#c0c0c0',
          style: 'defensive' as BuffVisualStyle
        };

      case 'berserk':
        return {
          auraColor: '#ff6b35',      // Orange
          pulseSpeed: 1.5,            // Aggressive fast pulse
          particles: true,
          intensity: 0.7,
          statusColor: '#ff6b35',
          style: 'offensive' as BuffVisualStyle
        };

      default:
        return {
          auraColor: '#ffffff',
          pulseSpeed: 2,
          particles: false,
          intensity: 0.4,
          statusColor: '#ffffff',
          style: 'enhancement' as BuffVisualStyle
        };
    }
  };

  const config = getBuffConfig();

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
        zIndex: 100
      }}
    >
      {/* CAST PHASE: Initial buff application with dramatic effect */}
      {phase === 'cast' && (
        <>
          {/* Central energy burst */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.8, 0.6, 0.4],
              scale: [0.5, 1.3, 1.1, 1],
              transition: {
                duration: CAST_DURATION / 1000,
                ease: [0.34, 1.56, 0.64, 1], // Overshoot for impact
                times: [0, 0.4, 0.7, 1]
              }
            }}
            onAnimationComplete={handleCastComplete}
            style={{
              position: 'absolute',
              left: targetX - 50,
              top: targetY - 50,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${config.auraColor}dd 0%, ${config.auraColor}77 40%, ${config.auraColor}33 70%, transparent 100%)`,
              boxShadow: `
                0 0 40px ${config.auraColor}cc,
                0 0 20px ${config.auraColor}88,
                inset 0 0 30px ${config.auraColor}44
              `,
              filter: 'blur(4px)'
            }}
          />

          {/* Expanding ring wave */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0.3, 2, 2.5],
              transition: {
                duration: CAST_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 60,
              top: targetY - 60,
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: `2px solid ${config.auraColor}`,
              boxShadow: `0 0 20px ${config.auraColor}`,
              filter: 'blur(2px)'
            }}
          />

          {/* Radiating particles */}
          {config.particles && [...Array(12)].map((_, i) => {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 50;

            return (
              <motion.div
                key={i}
                initial={{
                  x: targetX,
                  y: targetY,
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  x: targetX + Math.cos(angle) * distance,
                  y: targetY + Math.sin(angle) * distance,
                  opacity: [0, 0.9, 0.5, 0],
                  scale: [0, 1.2, 1, 0.5],
                  transition: {
                    duration: CAST_DURATION / 1000,
                    delay: i * 0.02,
                    ease: 'easeOut'
                  }
                }}
                style={{
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: config.auraColor,
                  boxShadow: `0 0 10px ${config.auraColor}`
                }}
              />
            );
          })}

          {/* Bright flash at cast moment */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 2, 2.5],
              transition: {
                duration: CAST_DURATION / 1000,
                times: [0, 0.3, 1],
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 40,
              top: targetY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${config.auraColor}ff 0%, ${config.auraColor}88 40%, transparent 70%)`,
              filter: 'blur(15px)'
            }}
          />
        </>
      )}

      {/* SUSTAIN PHASE: Persistent buff effect - uses BuffAura component */}
      {phase === 'sustain' && isActive && (
        <>
          {/* Main character aura using core BuffAura component */}
          <BuffAura
            targetX={targetX}
            targetY={targetY}
            auraColor={config.auraColor}
            pulseSpeed={config.pulseSpeed}
            particles={config.particles}
            intensity={config.intensity}
            persistent={true}
            isActive={true}
          />

          {/* Optional status overlay indicator (for certain buff types) */}
          {showStatusOverlay && (
            <StatusOverlay
              statusType="stun" // Using 'stun' for generic buff indicator with star icon
              targetX={targetX}
              targetY={targetY}
              color={config.statusColor}
              intensity={config.intensity * 0.7}
              isActive={true}
            />
          )}
        </>
      )}

      {/* FADE PHASE: Buff dissipates when duration ends */}
      <AnimatePresence>
        {phase === 'fade' && (
          <>
            {/* Aura fading out */}
            <motion.div
              initial={{ opacity: config.intensity * 0.4, scale: 1 }}
              animate={{
                opacity: [config.intensity * 0.4, config.intensity * 0.2, 0],
                scale: [1, 1.2, 1.4],
                transition: {
                  duration: FADE_DURATION / 1000,
                  ease: 'easeOut'
                }
              }}
              exit={{ opacity: 0 }}
              onAnimationComplete={handleFadeComplete}
              style={{
                position: 'absolute',
                left: targetX - 50,
                top: targetY - 60,
                width: 100,
                height: 120,
                borderRadius: '50%',
                background: `radial-gradient(ellipse at center, ${config.auraColor}50 0%, ${config.auraColor}25 40%, transparent 70%)`,
                filter: 'blur(12px)'
              }}
            />

            {/* Dissipating particles */}
            {config.particles && [...Array(8)].map((_, i) => {
              const angle = (i / 8) * Math.PI * 2;
              const startRadius = 40;
              const endRadius = 65;

              return (
                <motion.div
                  key={i}
                  initial={{
                    x: targetX + Math.cos(angle) * startRadius,
                    y: targetY + Math.sin(angle) * startRadius,
                    opacity: 0.5,
                    scale: 1
                  }}
                  animate={{
                    x: targetX + Math.cos(angle) * endRadius,
                    y: targetY + Math.sin(angle) * endRadius,
                    opacity: [0.5, 0.3, 0],
                    scale: [1, 0.7, 0.3],
                    transition: {
                      duration: FADE_DURATION / 1000,
                      delay: i * 0.02,
                      ease: 'easeOut'
                    }
                  }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: config.auraColor,
                    boxShadow: `0 0 8px ${config.auraColor}`,
                    filter: 'blur(1px)'
                  }}
                />
              );
            })}

            {/* Final dissipation flash */}
            <motion.div
              initial={{ opacity: 0.3, scale: 0.9 }}
              animate={{
                opacity: [0.3, 0.5, 0],
                scale: [0.9, 1.5, 2],
                transition: {
                  duration: FADE_DURATION / 1000,
                  ease: 'easeOut'
                }
              }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                left: targetX - 45,
                top: targetY - 45,
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${config.auraColor}99 0%, ${config.auraColor}44 50%, transparent 70%)`,
                filter: 'blur(12px)'
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
});

BuffAnimation.displayName = 'BuffAnimation';
