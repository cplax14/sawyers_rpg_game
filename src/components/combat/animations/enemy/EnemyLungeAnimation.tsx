/**
 * EnemyLungeAnimation
 *
 * Generic lunge/dash attack animation for beast enemies.
 * Direction: enemy (right) crouches → dashes forward → bites/claws player (left) → retreats
 *
 * Can be used for:
 * - Wolves (bite with fangs)
 * - Dire Wolves (savage bite)
 * - Alpha Wolves (powerful bite)
 * - Wild Horses (trampling kick)
 * - Bears (claw swipe)
 * - Tigers/Big cats (pounce)
 * - Raptors (leap and claw)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimationComponentProps } from '../animationRegistry';
import { ParticleSystem } from '../core/ParticleSystem';

export interface EnemyLungeProps extends AnimationComponentProps {
  /** Attack variant determines visuals and impact */
  variant?: 'bite' | 'claw' | 'trample' | 'pounce';

  /** Trail/particle colors */
  colors?: string[];

  /** Impact effect colors */
  impactColors?: [string, string];

  /** Creature size multiplier (default: 1.0) */
  creatureSize?: number;

  /** Speed multiplier (default: 1.0, higher = faster) */
  speed?: number;
}

/**
 * Variant configurations
 */
const VARIANT_CONFIG = {
  bite: {
    colors: ['#ffffff', '#ff0000', '#8b0000'],
    impactColors: ['#ff0000', '#8b0000'] as [string, string],
    icon: '🦷', // Fangs/teeth
    particleCount: 15,
    description: 'Savage bite attack with fangs'
  },
  claw: {
    colors: ['#8b4513', '#a0522d', '#d2691e'],
    impactColors: ['#8b4513', '#d2691e'] as [string, string],
    icon: '🩸', // Claws/blood
    particleCount: 18,
    description: 'Raking claw swipe'
  },
  trample: {
    colors: ['#696969', '#808080', '#a9a9a9'],
    impactColors: ['#696969', '#a9a9a9'] as [string, string],
    icon: '🦴', // Hooves/impact
    particleCount: 20,
    description: 'Trampling charge'
  },
  pounce: {
    colors: ['#ff8c00', '#ffa500', '#ffb732'],
    impactColors: ['#ff8c00', '#ffb732'] as [string, string],
    icon: '⚡', // Energy/power
    particleCount: 16,
    description: 'Explosive pounce'
  }
};

export const EnemyLungeAnimation: React.FC<EnemyLungeProps> = React.memo(({
  casterX,
  casterY,
  targetX,
  targetY,
  variant = 'bite',
  colors: colorsOverride,
  impactColors: impactColorsOverride,
  creatureSize = 1.0,
  speed = 1.0,
  onComplete
}) => {
  const [phase, setPhase] = useState<'crouch' | 'dash' | 'bite' | 'retreat'>('crouch');

  // Get config for variant
  const config = VARIANT_CONFIG[variant];
  const finalColors = colorsOverride || config.colors;
  const finalImpactColors = impactColorsOverride || config.impactColors;

  // Calculate lunge path
  const dashX = targetX + 40; // Stop just before player
  const dashY = targetY;
  const biteX = targetX + 10; // Close in for the bite/strike
  const biteY = targetY;

  // Animation timing (affected by speed multiplier)
  const CROUCH_DURATION = Math.floor(300 / speed);
  const DASH_DURATION = Math.floor(350 / speed);
  const BITE_DURATION = 250;
  const RETREAT_DURATION = Math.floor(400 / speed);

  // Phase transitions
  useEffect(() => {
    const transitions = [
      { delay: 0, nextPhase: 'crouch' as const },
      { delay: CROUCH_DURATION, nextPhase: 'dash' as const },
      { delay: CROUCH_DURATION + DASH_DURATION, nextPhase: 'bite' as const },
      { delay: CROUCH_DURATION + DASH_DURATION + BITE_DURATION, nextPhase: 'retreat' as const }
    ];

    const timers = transitions.map(({ delay, nextPhase }) =>
      setTimeout(() => setPhase(nextPhase), delay)
    );

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [CROUCH_DURATION, DASH_DURATION, RETREAT_DURATION]);

  // Notify completion after retreat
  useEffect(() => {
    if (phase === 'retreat') {
      const timer = setTimeout(() => {
        onComplete?.();
      }, RETREAT_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, RETREAT_DURATION, onComplete]);

  const creatureSizePx = 40 * creatureSize;

  return (
    <>
      {/* Crouch phase - anticipation */}
      {phase === 'crouch' && (
        <>
          {/* Creature crouching */}
          <motion.div
            initial={{
              x: casterX,
              y: casterY,
              scale: 1,
              opacity: 1
            }}
            animate={{
              x: casterX,
              y: casterY + 8, // Lower slightly
              scale: 0.9, // Compress
              opacity: 1
            }}
            transition={{
              duration: CROUCH_DURATION / 1000,
              ease: 'easeIn'
            }}
            style={{
              position: 'absolute',
              fontSize: `${creatureSizePx}px`,
              pointerEvents: 'none',
              zIndex: 101,
              filter: `drop-shadow(0 0 8px ${finalImpactColors[0]})`
            }}
          >
            <div style={{ transform: 'scaleX(-1)' }}>🐺</div> {/* Face left toward player */}
          </motion.div>

          {/* Tension particles gathering */}
          {[...Array(6)].map((_, i) => {
            const angle = (i / 6) * Math.PI * 2;
            const distance = 25;
            return (
              <motion.div
                key={`tension-${i}`}
                initial={{
                  x: casterX + Math.cos(angle) * distance,
                  y: casterY + Math.sin(angle) * distance,
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  x: casterX,
                  y: casterY,
                  opacity: [0, 0.6, 0],
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: CROUCH_DURATION / 1000,
                  delay: i * 0.05,
                  ease: 'easeIn'
                }}
                style={{
                  position: 'absolute',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: finalColors[i % finalColors.length],
                  pointerEvents: 'none',
                  zIndex: 100
                }}
              />
            );
          })}
        </>
      )}

      {/* Dash phase - rapid forward movement */}
      {phase === 'dash' && (
        <>
          {/* Creature dashing */}
          <motion.div
            initial={{
              x: casterX,
              y: casterY + 8,
              scale: 0.9,
              opacity: 1
            }}
            animate={{
              x: dashX,
              y: dashY,
              scale: 1.1, // Grow during dash
              opacity: 1
            }}
            transition={{
              duration: DASH_DURATION / 1000,
              ease: 'easeOut'
            }}
            style={{
              position: 'absolute',
              fontSize: `${creatureSizePx}px`,
              pointerEvents: 'none',
              zIndex: 101,
              filter: `drop-shadow(0 0 12px ${finalImpactColors[0]})`
            }}
          >
            <div style={{ transform: 'scaleX(-1)' }}>🐺</div>
          </motion.div>

          {/* Motion blur trail */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={`dash-trail-${i}`}
              initial={{
                x: casterX,
                y: casterY,
                opacity: 0,
                scale: 0.8
              }}
              animate={{
                x: dashX,
                y: dashY,
                opacity: [0, 0.4, 0],
                scale: [0.8, 1, 0.6]
              }}
              transition={{
                duration: DASH_DURATION / 1000,
                delay: i * 0.04,
                ease: 'easeOut'
              }}
              style={{
                position: 'absolute',
                fontSize: `${creatureSizePx * 0.8}px`,
                filter: 'blur(3px)',
                pointerEvents: 'none',
                zIndex: 100
              }}
            >
              <div style={{ transform: 'scaleX(-1)' }}>🐺</div>
            </motion.div>
          ))}

          {/* Speed particles */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`speed-${i}`}
              initial={{
                x: casterX + Math.random() * 40 - 20,
                y: casterY + Math.random() * 40 - 20,
                opacity: 0,
                scaleX: 0
              }}
              animate={{
                x: casterX - 60,
                y: casterY + Math.random() * 20 - 10,
                opacity: [0, 0.6, 0],
                scaleX: [0, 1, 0]
              }}
              transition={{
                duration: DASH_DURATION / 1000,
                delay: i * 0.03,
                ease: 'linear'
              }}
              style={{
                position: 'absolute',
                width: 30,
                height: 2,
                background: `linear-gradient(90deg, ${finalColors[i % finalColors.length]}, transparent)`,
                pointerEvents: 'none',
                zIndex: 99
              }}
            />
          ))}
        </>
      )}

      {/* Bite/Strike phase - impact */}
      {phase === 'bite' && (
        <>
          {/* Creature at impact position */}
          <motion.div
            initial={{
              x: dashX,
              y: dashY,
              scale: 1.1,
              opacity: 1
            }}
            animate={{
              x: [dashX, biteX, dashX], // Quick lunge forward then back
              y: [dashY, biteY, dashY],
              scale: [1.1, 1.3, 1.1], // Grow at impact moment
              opacity: 1
            }}
            transition={{
              duration: BITE_DURATION / 1000,
              times: [0, 0.4, 1],
              ease: 'easeInOut'
            }}
            style={{
              position: 'absolute',
              fontSize: `${creatureSizePx}px`,
              pointerEvents: 'none',
              zIndex: 101
            }}
          >
            <div style={{ transform: 'scaleX(-1)' }}>🐺</div>
          </motion.div>

          {/* Attack icon/effect at impact point */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0], rotate: [0, 20, 0] }}
            transition={{ duration: BITE_DURATION / 1000, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: targetX,
              top: targetY,
              fontSize: '40px',
              pointerEvents: 'none',
              zIndex: 103,
              filter: `drop-shadow(0 0 10px ${finalImpactColors[0]})`
            }}
          >
            {config.icon}
          </motion.div>

          {/* Impact flash */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2.5, 0], opacity: [0, 0.9, 0] }}
            transition={{ duration: BITE_DURATION / 1000, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: targetX,
              top: targetY,
              width: 70,
              height: 70,
              marginLeft: -35,
              marginTop: -35,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${finalImpactColors[0]}, transparent)`,
              boxShadow: `0 0 50px ${finalImpactColors[0]}`,
              pointerEvents: 'none',
              zIndex: 102
            }}
          />

          {/* Impact particles */}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={config.particleCount}
            colors={finalColors}
            spread={120}
            lifetime={500}
            size={6}
            gravity={70}
            fadeOut={true}
          />

          {/* Claw marks for claw/pounce variants */}
          {(variant === 'claw' || variant === 'pounce') && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`claw-${i}`}
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1] }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.05,
                    ease: 'easeOut'
                  }}
                  style={{
                    position: 'absolute',
                    left: targetX - 25,
                    top: targetY - 20 + i * 12,
                    width: 50,
                    height: 3,
                    background: finalImpactColors[0],
                    transform: `rotate(${-35 + i * 10}deg)`,
                    boxShadow: `0 0 8px ${finalImpactColors[0]}`,
                    pointerEvents: 'none',
                    zIndex: 103
                  }}
                />
              ))}
            </>
          )}

          {/* Bite marks for bite variant */}
          {variant === 'bite' && (
            <>
              {[0, 1].map((i) => (
                <motion.div
                  key={`bite-${i}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0.5, 0], scale: [0, 1, 1, 1] }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    left: targetX + (i === 0 ? -15 : 5),
                    top: targetY - 5,
                    width: 8,
                    height: 12,
                    background: finalImpactColors[0],
                    borderRadius: i === 0 ? '2px 2px 50% 50%' : '2px 2px 50% 50%',
                    transform: i === 0 ? 'rotate(-10deg)' : 'rotate(10deg)',
                    pointerEvents: 'none',
                    zIndex: 103
                  }}
                />
              ))}
            </>
          )}
        </>
      )}

      {/* Retreat phase - creature returns */}
      {phase === 'retreat' && (
        <motion.div
          initial={{
            x: dashX,
            y: dashY,
            scale: 1.1,
            opacity: 1
          }}
          animate={{
            x: casterX + 20, // Slightly further back
            y: casterY,
            scale: 1.0,
            opacity: 0.6
          }}
          transition={{
            duration: RETREAT_DURATION / 1000,
            ease: 'easeOut'
          }}
          style={{
            position: 'absolute',
            fontSize: `${creatureSizePx}px`,
            pointerEvents: 'none',
            zIndex: 101
          }}
        >
          <div style={{ transform: 'scaleX(-1)' }}>🐺</div>
        </motion.div>
      )}
    </>
  );
});

EnemyLungeAnimation.displayName = 'EnemyLungeAnimation';
