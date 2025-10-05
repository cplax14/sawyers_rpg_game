/**
 * EnemySwoopAnimation
 *
 * Generic swooping/diving attack animation for flying enemies.
 * Direction: enemy (right, high) → player (left, low) → retreat back
 *
 * Can be used for:
 * - Hawks (talon strike from above)
 * - Bats (sonic screech dive)
 * - Fire Bats (flame wing dive)
 * - Wyverns (dive bomb)
 * - Dragons (aerial assault)
 * - Phoenix (flame dive)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimationComponentProps } from '../animationRegistry';
import { ParticleSystem } from '../core/ParticleSystem';

export interface EnemySwoopProps extends AnimationComponentProps {
  /** Visual variant for different flying creatures */
  variant?: 'talon' | 'screech' | 'flame' | 'frost' | 'shadow';

  /** Trail particle colors */
  trailColors?: string[];

  /** Impact colors */
  impactColors?: [string, string];

  /** Size multiplier for creature (default: 1.0) */
  creatureSize?: number;
}

/**
 * Variant configurations
 */
const VARIANT_CONFIG = {
  talon: {
    trailColors: ['#8b4513', '#daa520', '#f4a460'],
    impactColors: ['#8b4513', '#daa520'] as [string, string],
    swooshColor: '#8b4513',
    slashMarks: true,
    description: 'Sharp talon strike with slash marks'
  },
  screech: {
    trailColors: ['#9370db', '#ba55d3', '#da70d6'],
    impactColors: ['#9370db', '#ba55d3'] as [string, string],
    swooshColor: '#9370db',
    slashMarks: false,
    description: 'Sonic screech with sound waves'
  },
  flame: {
    trailColors: ['#ff6b00', '#ff8c00', '#ffa500', '#ffff00'],
    impactColors: ['#ff6b00', '#ffa500'] as [string, string],
    swooshColor: '#ff8c00',
    slashMarks: false,
    description: 'Fiery dive with burning trail'
  },
  frost: {
    trailColors: ['#00bfff', '#87ceeb', '#add8e6', '#f0f8ff'],
    impactColors: ['#00bfff', '#87ceeb'] as [string, string],
    swooshColor: '#87ceeb',
    slashMarks: true,
    description: 'Icy dive with frost trail'
  },
  shadow: {
    trailColors: ['#4b0082', '#8b008b', '#9932cc'],
    impactColors: ['#4b0082', '#8b008b'] as [string, string],
    swooshColor: '#8b008b',
    slashMarks: false,
    description: 'Shadow dive with dark energy'
  }
};

export const EnemySwoopAnimation: React.FC<EnemySwoopProps> = React.memo(({
  casterX,
  casterY,
  targetX,
  targetY,
  variant = 'talon',
  trailColors: trailColorsOverride,
  impactColors: impactColorsOverride,
  creatureSize = 1.0,
  onComplete
}) => {
  const [phase, setPhase] = useState<'ascent' | 'dive' | 'impact' | 'retreat'>('ascent');

  // Get config for variant
  const config = VARIANT_CONFIG[variant];
  const trailColors = trailColorsOverride || config.trailColors;
  const impactColors = impactColorsOverride || config.impactColors;

  // Calculate positions for swoop path
  // Enemy starts at casterX/casterY (right side, mid height)
  // Ascends to high position above target
  // Dives down to target
  // Retreats back to original position
  const ascentX = casterX;
  const ascentY = casterY - 120; // Rise up high
  const diveX = targetX;
  const diveY = targetY;
  const retreatX = casterX + 30; // Slightly further back
  const retreatY = casterY - 40; // Stay elevated

  // Animation timing
  const ASCENT_DURATION = 300;
  const DIVE_DURATION = 350;
  const IMPACT_DURATION = 200;
  const RETREAT_DURATION = 400;

  // Phase transitions
  useEffect(() => {
    const transitions = [
      { delay: 0, nextPhase: 'ascent' as const },
      { delay: ASCENT_DURATION, nextPhase: 'dive' as const },
      { delay: ASCENT_DURATION + DIVE_DURATION, nextPhase: 'impact' as const },
      { delay: ASCENT_DURATION + DIVE_DURATION + IMPACT_DURATION, nextPhase: 'retreat' as const }
    ];

    const timers = transitions.map(({ delay, nextPhase }) =>
      setTimeout(() => setPhase(nextPhase), delay)
    );

    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  // Notify completion after retreat
  useEffect(() => {
    if (phase === 'retreat') {
      const timer = setTimeout(() => {
        onComplete?.();
      }, RETREAT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, onComplete]);

  // Calculate angle for rotation during dive
  const diveAngle = Math.atan2(diveY - ascentY, diveX - ascentX);
  const diveAngleDeg = (diveAngle * 180) / Math.PI;

  /**
   * Render creature silhouette based on variant
   */
  const renderCreature = (size: number) => {
    const baseStyle = {
      width: size,
      height: size,
      position: 'relative' as const
    };

    // Simple bird/bat silhouette
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        style={baseStyle}
      >
        {/* Wings */}
        <ellipse
          cx="10"
          cy="20"
          rx="8"
          ry="12"
          fill={impactColors[0]}
          opacity="0.8"
        />
        <ellipse
          cx="30"
          cy="20"
          rx="8"
          ry="12"
          fill={impactColors[0]}
          opacity="0.8"
        />
        {/* Body */}
        <ellipse
          cx="20"
          cy="20"
          rx="6"
          ry="10"
          fill={impactColors[1]}
        />
        {/* Head */}
        <circle
          cx="20"
          cy="15"
          r="4"
          fill={impactColors[1]}
        />
      </svg>
    );
  };

  const creatureSizePx = 40 * creatureSize;

  return (
    <>
      {/* Ascent phase - creature rises up */}
      {phase === 'ascent' && (
        <motion.div
          initial={{
            x: casterX,
            y: casterY,
            opacity: 0,
            scale: 0.8,
            rotate: -10
          }}
          animate={{
            x: ascentX,
            y: ascentY,
            opacity: 1,
            scale: 1,
            rotate: 0
          }}
          transition={{
            duration: ASCENT_DURATION / 1000,
            ease: 'easeOut'
          }}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 101
          }}
        >
          {renderCreature(creatureSizePx)}
        </motion.div>
      )}

      {/* Dive phase - creature swoops down at player */}
      {phase === 'dive' && (
        <>
          {/* Creature diving */}
          <motion.div
            initial={{
              x: ascentX,
              y: ascentY,
              scale: 1,
              rotate: 0
            }}
            animate={{
              x: diveX,
              y: diveY,
              scale: 1.2, // Grow larger as it approaches
              rotate: diveAngleDeg - 45 // Angle downward
            }}
            transition={{
              duration: DIVE_DURATION / 1000,
              ease: 'easeIn' // Accelerate downward
            }}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              zIndex: 101,
              filter: `drop-shadow(0 0 10px ${config.swooshColor})`
            }}
          >
            {renderCreature(creatureSizePx)}
          </motion.div>

          {/* Swoosh trail particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`trail-${i}`}
              initial={{
                x: ascentX,
                y: ascentY,
                opacity: 0,
                scale: 0
              }}
              animate={{
                x: diveX,
                y: diveY,
                opacity: [0, 0.6, 0],
                scale: [0, 1.5, 0]
              }}
              transition={{
                duration: DIVE_DURATION / 1000,
                delay: i * 0.04,
                ease: 'easeIn'
              }}
              style={{
                position: 'absolute',
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: trailColors[i % trailColors.length],
                filter: 'blur(3px)',
                pointerEvents: 'none',
                zIndex: 100
              }}
            />
          ))}

          {/* Speed lines */}
          {[...Array(6)].map((_, i) => {
            const lineAngle = diveAngleDeg + (Math.random() * 20 - 10);
            return (
              <motion.div
                key={`line-${i}`}
                initial={{
                  x: ascentX + Math.random() * 20 - 10,
                  y: ascentY + Math.random() * 20 - 10,
                  opacity: 0,
                  scaleX: 0
                }}
                animate={{
                  x: diveX,
                  y: diveY,
                  opacity: [0, 0.4, 0],
                  scaleX: [0, 1, 0]
                }}
                transition={{
                  duration: DIVE_DURATION / 1000,
                  delay: i * 0.05,
                  ease: 'linear'
                }}
                style={{
                  position: 'absolute',
                  width: 40,
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${config.swooshColor})`,
                  transformOrigin: 'left center',
                  transform: `rotate(${lineAngle}deg)`,
                  pointerEvents: 'none',
                  zIndex: 99
                }}
              />
            );
          })}
        </>
      )}

      {/* Impact phase */}
      {phase === 'impact' && (
        <>
          {/* Impact flash */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2.5, 0], opacity: [0, 0.9, 0] }}
            transition={{ duration: IMPACT_DURATION / 1000, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: targetX,
              top: targetY,
              width: 80,
              height: 80,
              marginLeft: -40,
              marginTop: -40,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${impactColors[0]}, transparent)`,
              boxShadow: `0 0 60px ${impactColors[0]}`,
              pointerEvents: 'none',
              zIndex: 102
            }}
          />

          {/* Slash marks for talon/frost variants */}
          {config.slashMarks && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`slash-${i}`}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1] }}
                  transition={{
                    duration: 0.3,
                    delay: i * 0.05,
                    ease: 'easeOut'
                  }}
                  style={{
                    position: 'absolute',
                    left: targetX - 30,
                    top: targetY - 20 + i * 15,
                    width: 60,
                    height: 3,
                    background: impactColors[0],
                    transform: `rotate(${-30 + i * 15}deg)`,
                    boxShadow: `0 0 8px ${impactColors[0]}`,
                    pointerEvents: 'none',
                    zIndex: 103
                  }}
                />
              ))}
            </>
          )}

          {/* Impact particles */}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={18}
            colors={trailColors}
            spread={100}
            lifetime={500}
            size={6}
            gravity={80}
            fadeOut={true}
          />

          {/* Special effects for screech variant (sound waves) */}
          {variant === 'screech' && (
            <>
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={`wave-${i}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 2, 3], opacity: [0, 0.6, 0] }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: 'easeOut'
                  }}
                  style={{
                    position: 'absolute',
                    left: targetX,
                    top: targetY,
                    width: 60,
                    height: 60,
                    marginLeft: -30,
                    marginTop: -30,
                    borderRadius: '50%',
                    border: `2px solid ${config.swooshColor}`,
                    pointerEvents: 'none',
                    zIndex: 101
                  }}
                />
              ))}
            </>
          )}
        </>
      )}

      {/* Retreat phase - creature flies back */}
      {phase === 'retreat' && (
        <motion.div
          initial={{
            x: diveX,
            y: diveY,
            scale: 1.2,
            rotate: diveAngleDeg - 45,
            opacity: 1
          }}
          animate={{
            x: retreatX,
            y: retreatY,
            scale: 0.8,
            rotate: 20,
            opacity: 0
          }}
          transition={{
            duration: RETREAT_DURATION / 1000,
            ease: 'easeOut'
          }}
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 101
          }}
        >
          {renderCreature(creatureSizePx)}
        </motion.div>
      )}
    </>
  );
});

EnemySwoopAnimation.displayName = 'EnemySwoopAnimation';
