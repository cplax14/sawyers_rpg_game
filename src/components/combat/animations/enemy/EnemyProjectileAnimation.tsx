/**
 * EnemyProjectileAnimation
 *
 * Generic projectile attack animation for enemies.
 * Supports multiple variants: glob (slimes), arrow (archers), rock (trolls), magic bolt (mages).
 * Direction: enemy (right) → player (left)
 *
 * Can be used for:
 * - Slime glob attacks (green, bouncy, splatter)
 * - Goblin/Orc rock throws (brown, arc trajectory)
 * - Archer arrows (straight, fast)
 * - Mage magic bolts (various colors, glowing)
 * - Fire sprite fireballs (orange/red, burning)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimationComponentProps } from '../animationRegistry';
import { ParticleSystem, PARTICLE_PRESETS } from '../core/ParticleSystem';

export interface EnemyProjectileProps extends AnimationComponentProps {
  /** Projectile visual variant */
  variant?: 'glob' | 'arrow' | 'rock' | 'magic' | 'fire' | 'ice' | 'poison';

  /** Trajectory type */
  trajectory?: 'straight' | 'arc';

  /** Colors for projectile [primary, secondary] */
  colors?: [string, string];

  /** Projectile size (default: 14) */
  size?: number;

  /** Whether projectile spins */
  spin?: boolean;
}

/**
 * Variant configurations with sensible defaults
 */
const VARIANT_CONFIG = {
  glob: {
    colors: ['#4caf50', '#2e7d32'] as [string, string],
    size: 18,
    spin: false,
    trajectory: 'arc' as const,
    particleColors: ['#4caf50', '#66bb6a', '#81c784'],
    shape: 'blob', // Wobbly circular blob
  },
  arrow: {
    colors: ['#8b4513', '#a0522d'] as [string, string],
    size: 24,
    spin: false,
    trajectory: 'straight' as const,
    particleColors: ['#d2b48c', '#daa520'],
    shape: 'arrow', // Pointed arrow shape
  },
  rock: {
    colors: ['#696969', '#808080'] as [string, string],
    size: 16,
    spin: true,
    trajectory: 'arc' as const,
    particleColors: ['#a9a9a9', '#808080', '#696969'],
    shape: 'rock', // Irregular rock shape
  },
  magic: {
    colors: ['#8b5cf6', '#a78bfa'] as [string, string],
    size: 14,
    spin: false,
    trajectory: 'straight' as const,
    particleColors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
    shape: 'sphere', // Smooth magical orb
  },
  fire: {
    colors: ['#ff6b00', '#ff8c00'] as [string, string],
    size: 16,
    spin: true,
    trajectory: 'straight' as const,
    particleColors: ['#ff6b00', '#ff8c00', '#ffa500', '#ffff00'],
    shape: 'fire', // Flickering fireball
  },
  ice: {
    colors: ['#00bfff', '#87ceeb'] as [string, string],
    size: 14,
    spin: false,
    trajectory: 'straight' as const,
    particleColors: ['#00bfff', '#87ceeb', '#add8e6'],
    shape: 'shard', // Crystalline ice shard
  },
  poison: {
    colors: ['#9c27b0', '#ba68c8'] as [string, string],
    size: 12,
    spin: false,
    trajectory: 'arc' as const,
    particleColors: ['#9c27b0', '#ba68c8', '#ce93d8'],
    shape: 'blob', // Wobbly poison glob
  },
};

export const EnemyProjectileAnimation: React.FC<EnemyProjectileProps> = React.memo(
  ({
    casterX,
    casterY,
    targetX,
    targetY,
    variant = 'magic',
    trajectory: trajectoryOverride,
    colors: colorsOverride,
    size: sizeOverride,
    spin: spinOverride,
    onComplete,
  }) => {
    const [phase, setPhase] = useState<'windup' | 'launch' | 'travel' | 'impact'>('windup');

    // Get config for variant
    const config = VARIANT_CONFIG[variant];
    const finalColors = colorsOverride || config.colors;
    const finalSize = sizeOverride || config.size;
    const finalTrajectory = trajectoryOverride || config.trajectory;
    const finalSpin = spinOverride !== undefined ? spinOverride : config.spin;

    // Calculate angle for rotation (enemy on right, player on left)
    const angle = Math.atan2(targetY - casterY, targetX - casterX);
    const angleDeg = (angle * 180) / Math.PI;

    // Arc trajectory calculation
    const midX = (casterX + targetX) / 2;
    const midY =
      finalTrajectory === 'arc'
        ? Math.min(casterY, targetY) - 80 // Arc upward
        : (casterY + targetY) / 2;

    // Animation timing
    const WINDUP_DURATION = 250;
    const LAUNCH_DURATION = 100;
    const TRAVEL_DURATION = 450;
    const IMPACT_DURATION = 200;

    // Phase transitions
    useEffect(() => {
      const transitions = [
        { delay: 0, nextPhase: 'windup' as const },
        { delay: WINDUP_DURATION, nextPhase: 'launch' as const },
        { delay: WINDUP_DURATION + LAUNCH_DURATION, nextPhase: 'travel' as const },
        {
          delay: WINDUP_DURATION + LAUNCH_DURATION + TRAVEL_DURATION,
          nextPhase: 'impact' as const,
        },
      ];

      const timers = transitions.map(({ delay, nextPhase }) =>
        setTimeout(() => setPhase(nextPhase), delay)
      );

      return () => timers.forEach(timer => clearTimeout(timer));
    }, []);

    // Notify completion after impact
    useEffect(() => {
      if (phase === 'impact') {
        const timer = setTimeout(() => {
          onComplete?.();
        }, IMPACT_DURATION);
        return () => clearTimeout(timer);
      }
    }, [phase, onComplete]);

    /**
     * Render projectile based on shape/variant
     */
    const renderProjectile = () => {
      const [primaryColor, secondaryColor] = finalColors;

      // Common styles for all shapes
      const baseStyle = {
        position: 'absolute' as const,
        left: 0,
        top: 0,
        pointerEvents: 'none' as const,
      };

      switch (config.shape) {
        case 'arrow':
          return (
            <svg width={finalSize} height={finalSize} viewBox='0 0 24 24' style={baseStyle}>
              <path
                d='M2 12L22 12M22 12L18 8M22 12L18 16'
                stroke={primaryColor}
                strokeWidth='2'
                strokeLinecap='round'
                fill='none'
              />
              <path d='M2 12L6 10L6 14L2 12Z' fill={secondaryColor} />
            </svg>
          );

        case 'blob':
          return (
            <div
              style={{
                ...baseStyle,
                width: finalSize,
                height: finalSize,
                background: `radial-gradient(circle, ${primaryColor}, ${secondaryColor})`,
                borderRadius: '47% 53% 52% 48% / 43% 57% 43% 57%', // Irregular blob
                boxShadow: `0 0 ${finalSize}px ${primaryColor}`,
              }}
            />
          );

        case 'rock':
          return (
            <svg width={finalSize} height={finalSize} viewBox='0 0 20 20' style={baseStyle}>
              <polygon
                points='10,2 18,8 16,16 4,18 2,10 7,4'
                fill={primaryColor}
                stroke={secondaryColor}
                strokeWidth='1'
              />
              <polygon points='10,2 14,6 10,10 6,8' fill={secondaryColor} opacity='0.6' />
            </svg>
          );

        case 'fire':
          return (
            <div
              style={{
                ...baseStyle,
                width: finalSize,
                height: finalSize,
                background: `radial-gradient(circle, ${secondaryColor} 0%, ${primaryColor} 50%, transparent 100%)`,
                borderRadius: '50% 50% 47% 53%',
                boxShadow: `0 0 ${finalSize * 1.5}px ${primaryColor}, 0 0 ${finalSize * 3}px ${primaryColor}`,
                filter: 'blur(2px)',
              }}
            />
          );

        case 'shard':
          return (
            <svg width={finalSize} height={finalSize} viewBox='0 0 20 20' style={baseStyle}>
              <polygon
                points='10,0 12,8 10,20 8,8'
                fill={primaryColor}
                stroke={secondaryColor}
                strokeWidth='1'
                opacity='0.9'
              />
              <polygon points='10,0 15,10 10,20' fill={secondaryColor} opacity='0.5' />
            </svg>
          );

        case 'sphere':
        default:
          return (
            <div
              style={{
                ...baseStyle,
                width: finalSize,
                height: finalSize,
                borderRadius: '50%',
                background: `radial-gradient(circle at 30% 30%, ${secondaryColor}, ${primaryColor})`,
                boxShadow: `0 0 ${finalSize}px ${primaryColor}, 0 0 ${finalSize * 2}px ${primaryColor}`,
              }}
            />
          );
      }
    };

    return (
      <>
        {/* Windup effect at caster position */}
        {phase === 'windup' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: WINDUP_DURATION / 1000 }}
            style={{
              position: 'absolute',
              left: casterX,
              top: casterY,
              width: finalSize * 2,
              height: finalSize * 2,
              marginLeft: -finalSize,
              marginTop: -finalSize,
              borderRadius: '50%',
              border: `2px solid ${finalColors[0]}`,
              boxShadow: `0 0 20px ${finalColors[0]}`,
            }}
          />
        )}

        {/* Projectile travel animation */}
        {(phase === 'launch' || phase === 'travel') && (
          <motion.div
            initial={{
              x: casterX,
              y: casterY,
              scale: 0.5,
              opacity: 0,
              rotate: angleDeg,
            }}
            animate={
              finalTrajectory === 'arc'
                ? {
                    x: [casterX, midX, targetX],
                    y: [casterY, midY, targetY],
                    scale: [0.5, 1, 1],
                    opacity: [0, 1, 1],
                    rotate: finalSpin ? angleDeg + 720 : angleDeg,
                  }
                : {
                    x: targetX,
                    y: targetY,
                    scale: 1,
                    opacity: 1,
                    rotate: finalSpin ? angleDeg + 360 : angleDeg,
                  }
            }
            transition={{
              duration: (LAUNCH_DURATION + TRAVEL_DURATION) / 1000,
              ease: finalTrajectory === 'arc' ? 'easeInOut' : 'linear',
              times: finalTrajectory === 'arc' ? [0, 0.5, 1] : undefined,
            }}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              zIndex: 101,
            }}
          >
            {renderProjectile()}
          </motion.div>
        )}

        {/* Trail particles during travel */}
        {phase === 'travel' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: casterX, y: casterY, opacity: 0 }}
                animate={
                  finalTrajectory === 'arc'
                    ? {
                        x: [casterX, midX, targetX],
                        y: [casterY, midY, targetY],
                        opacity: [0, 0.6, 0],
                      }
                    : {
                        x: targetX,
                        y: targetY,
                        opacity: [0, 0.6, 0],
                      }
                }
                transition={{
                  duration: TRAVEL_DURATION / 1000,
                  delay: i * 0.05,
                  ease: finalTrajectory === 'arc' ? 'easeInOut' : 'linear',
                  times: finalTrajectory === 'arc' ? [0, 0.5, 1] : undefined,
                }}
                style={{
                  position: 'absolute',
                  width: finalSize * 0.5,
                  height: finalSize * 0.5,
                  borderRadius: '50%',
                  background: finalColors[1],
                  filter: 'blur(2px)',
                  pointerEvents: 'none',
                  zIndex: 100,
                }}
              />
            ))}
          </motion.div>
        )}

        {/* Impact effects */}
        {phase === 'impact' && (
          <>
            {/* Impact flash */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2, 0], opacity: [0, 0.8, 0] }}
              transition={{ duration: IMPACT_DURATION / 1000, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: targetX,
                top: targetY,
                width: finalSize * 3,
                height: finalSize * 3,
                marginLeft: -(finalSize * 1.5),
                marginTop: -(finalSize * 1.5),
                borderRadius: '50%',
                background: `radial-gradient(circle, ${finalColors[0]}, transparent)`,
                boxShadow: `0 0 40px ${finalColors[0]}`,
                pointerEvents: 'none',
                zIndex: 102,
              }}
            />

            {/* Impact particles */}
            <ParticleSystem
              originX={targetX}
              originY={targetY}
              particleCount={variant === 'glob' ? 20 : 15}
              colors={config.particleColors}
              spread={variant === 'glob' ? 120 : 80}
              lifetime={variant === 'glob' ? 600 : 500}
              size={variant === 'glob' ? 8 : 5}
              gravity={variant === 'glob' ? 100 : 50}
              fadeOut={true}
            />

            {/* Special splatter effect for glob */}
            {variant === 'glob' && (
              <>
                {[...Array(8)].map((_, i) => {
                  const splatAngle = (i / 8) * Math.PI * 2;
                  const splatDist = 30 + Math.random() * 20;
                  return (
                    <motion.div
                      key={`splat-${i}`}
                      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                      animate={{
                        x: Math.cos(splatAngle) * splatDist,
                        y: Math.sin(splatAngle) * splatDist,
                        scale: [0, 1.5, 0.8],
                        opacity: [0, 0.8, 0],
                      }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        left: targetX,
                        top: targetY,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: config.particleColors[i % config.particleColors.length],
                        filter: 'blur(1px)',
                      }}
                    />
                  );
                })}
              </>
            )}
          </>
        )}
      </>
    );
  }
);

EnemyProjectileAnimation.displayName = 'EnemyProjectileAnimation';
