/**
 * EnemyMeleeAnimation
 *
 * Generic melee weapon attack animation for humanoid enemies.
 * Direction: enemy (right) steps forward → swings weapon → strikes player (left) → returns
 *
 * Can be used for:
 * - Goblins (club, crude weapons)
 * - Orcs (axes, hammers)
 * - Skeleton (swords, bones)
 * - Zombies (claws, slow swings)
 * - Hobgoblins (swords, spears)
 * - Trolls (heavy clubs)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AnimationComponentProps } from '../animationRegistry';
import { ParticleSystem } from '../core/ParticleSystem';

export interface EnemyMeleeProps extends AnimationComponentProps {
  /** Weapon type determines swing pattern and visuals */
  weaponType?: 'club' | 'axe' | 'sword' | 'claw' | 'fist' | 'bone';

  /** Swing pattern */
  swingPattern?: 'overhead' | 'horizontal' | 'uppercut' | 'slam';

  /** Weapon/effect colors */
  colors?: [string, string];

  /** Attack speed modifier (default: 1.0, lower = slower, higher = faster) */
  speed?: number;
}

/**
 * Weapon configurations
 */
const WEAPON_CONFIG = {
  club: {
    colors: ['#8b4513', '#a0522d'] as [string, string],
    swingPattern: 'overhead' as const,
    particleColors: ['#8b4513', '#a0522d', '#d2691e'],
    impactSize: 'large' as const,
    description: 'Heavy overhead club smash'
  },
  axe: {
    colors: ['#708090', '#778899'] as [string, string],
    swingPattern: 'horizontal' as const,
    particleColors: ['#708090', '#778899', '#b0c4de'],
    impactSize: 'large' as const,
    description: 'Sweeping axe slash'
  },
  sword: {
    colors: ['#c0c0c0', '#e0e0e0'] as [string, string],
    swingPattern: 'horizontal' as const,
    particleColors: ['#c0c0c0', '#e0e0e0', '#f0f0f0'],
    impactSize: 'medium' as const,
    description: 'Quick sword slash'
  },
  claw: {
    colors: ['#8b0000', '#ff4500'] as [string, string],
    swingPattern: 'horizontal' as const,
    particleColors: ['#8b0000', '#ff4500', '#ff6347'],
    impactSize: 'small' as const,
    description: 'Raking claw swipe'
  },
  fist: {
    colors: ['#696969', '#808080'] as [string, string],
    swingPattern: 'slam' as const,
    particleColors: ['#696969', '#808080', '#a9a9a9'],
    impactSize: 'medium' as const,
    description: 'Powerful punch'
  },
  bone: {
    colors: ['#f5f5dc', '#fffaf0'] as [string, string],
    swingPattern: 'overhead' as const,
    particleColors: ['#f5f5dc', '#fffaf0', '#ffffff'],
    impactSize: 'medium' as const,
    description: 'Skeletal bone club'
  }
};

export const EnemyMeleeAnimation: React.FC<EnemyMeleeProps> = React.memo(({
  casterX,
  casterY,
  targetX,
  targetY,
  weaponType = 'club',
  swingPattern: swingPatternOverride,
  colors: colorsOverride,
  speed = 1.0,
  onComplete
}) => {
  const [phase, setPhase] = useState<'raise' | 'hold' | 'swing' | 'impact' | 'recovery'>('raise');

  // Get config for weapon type
  const config = WEAPON_CONFIG[weaponType];
  const finalColors = colorsOverride || config.colors;
  const finalSwingPattern = swingPatternOverride || config.swingPattern;

  // Calculate step forward position (enemy moves toward player during attack)
  const stepForwardX = casterX - 50; // Move 50px toward player (left)
  const stepForwardY = casterY;

  // Animation timing (affected by speed multiplier)
  const RAISE_DURATION = Math.floor(300 / speed);
  const HOLD_DURATION = Math.floor(200 / speed);
  const SWING_DURATION = Math.floor(250 / speed);
  const IMPACT_DURATION = 150;
  const RECOVERY_DURATION = Math.floor(300 / speed);

  // Phase transitions
  useEffect(() => {
    const transitions = [
      { delay: 0, nextPhase: 'raise' as const },
      { delay: RAISE_DURATION, nextPhase: 'hold' as const },
      { delay: RAISE_DURATION + HOLD_DURATION, nextPhase: 'swing' as const },
      { delay: RAISE_DURATION + HOLD_DURATION + SWING_DURATION, nextPhase: 'impact' as const },
      { delay: RAISE_DURATION + HOLD_DURATION + SWING_DURATION + IMPACT_DURATION, nextPhase: 'recovery' as const }
    ];

    const timers = transitions.map(({ delay, nextPhase }) =>
      setTimeout(() => setPhase(nextPhase), delay)
    );

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [RAISE_DURATION, HOLD_DURATION, SWING_DURATION, RECOVERY_DURATION]);

  // Notify completion after recovery
  useEffect(() => {
    if (phase === 'recovery') {
      const timer = setTimeout(() => {
        onComplete?.();
      }, RECOVERY_DURATION);
      return () => clearTimeout(timer);
    }
  }, [phase, RECOVERY_DURATION, onComplete]);

  /**
   * Get weapon arc positions based on swing pattern
   */
  const getWeaponArc = () => {
    const weaponLength = 40;

    switch (finalSwingPattern) {
      case 'overhead':
        return {
          raiseX: stepForwardX - 10,
          raiseY: stepForwardY - 50,
          holdX: stepForwardX - 10,
          holdY: stepForwardY - 50,
          swingX: targetX + 20,
          swingY: targetY + 10,
          raiseRotate: -120,
          holdRotate: -120,
          swingRotate: 20
        };

      case 'horizontal':
        return {
          raiseX: stepForwardX + 20,
          raiseY: stepForwardY - 20,
          holdX: stepForwardX + 20,
          holdY: stepForwardY - 20,
          swingX: targetX + 10,
          swingY: targetY - 5,
          raiseRotate: -45,
          holdRotate: -45,
          swingRotate: 45
        };

      case 'uppercut':
        return {
          raiseX: stepForwardX,
          raiseY: stepForwardY + 30,
          holdX: stepForwardX,
          holdY: stepForwardY + 30,
          swingX: targetX,
          swingY: targetY - 40,
          raiseRotate: 90,
          holdRotate: 90,
          swingRotate: -90
        };

      case 'slam':
      default:
        return {
          raiseX: stepForwardX,
          raiseY: stepForwardY - 40,
          holdX: stepForwardX,
          holdY: stepForwardY - 40,
          swingX: targetX,
          swingY: targetY,
          raiseRotate: -90,
          holdRotate: -90,
          swingRotate: 0
        };
    }
  };

  const arc = getWeaponArc();

  /**
   * Render weapon based on type
   */
  const renderWeapon = (size: number) => {
    const baseStyle = {
      width: size,
      height: size * 0.3,
      position: 'relative' as const
    };

    switch (weaponType) {
      case 'club':
        return (
          <svg width={size} height={size * 0.3} viewBox="0 0 40 12" style={baseStyle}>
            <rect x="0" y="4" width="30" height="4" fill={finalColors[0]} />
            <circle cx="35" cy="6" r="6" fill={finalColors[1]} />
          </svg>
        );

      case 'axe':
        return (
          <svg width={size} height={size * 0.3} viewBox="0 0 40 12" style={baseStyle}>
            <rect x="0" y="5" width="25" height="2" fill={finalColors[0]} />
            <path d="M25 0 L40 6 L25 12 Z" fill={finalColors[1]} />
          </svg>
        );

      case 'sword':
        return (
          <svg width={size} height={size * 0.3} viewBox="0 0 40 12" style={baseStyle}>
            <rect x="0" y="5" width="35" height="2" fill={finalColors[1]} />
            <polygon points="35,3 40,6 35,9" fill={finalColors[0]} />
          </svg>
        );

      case 'claw':
        return (
          <svg width={size} height={size * 0.3} viewBox="0 0 40 12" style={baseStyle}>
            {[0, 1, 2].map(i => (
              <path
                key={i}
                d={`M${i * 8},2 Q${i * 8 + 5},6 ${i * 8 + 10},10`}
                stroke={finalColors[i % 2]}
                strokeWidth="2"
                fill="none"
              />
            ))}
          </svg>
        );

      case 'fist':
        return (
          <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 20 20" style={{ ...baseStyle, width: size * 0.6, height: size * 0.6 }}>
            <circle cx="10" cy="10" r="8" fill={finalColors[0]} />
            <circle cx="10" cy="10" r="6" fill={finalColors[1]} opacity="0.6" />
          </svg>
        );

      case 'bone':
      default:
        return (
          <svg width={size} height={size * 0.3} viewBox="0 0 40 12" style={baseStyle}>
            <rect x="5" y="5" width="30" height="2" fill={finalColors[0]} />
            <circle cx="5" cy="6" r="4" fill={finalColors[1]} />
            <circle cx="35" cy="6" r="4" fill={finalColors[1]} />
          </svg>
        );
    }
  };

  return (
    <>
      {/* Enemy figure stepping forward (phases: raise, hold, swing) */}
      {(phase === 'raise' || phase === 'hold' || phase === 'swing') && (
        <motion.div
          initial={{
            x: casterX,
            y: casterY,
            opacity: 1
          }}
          animate={{
            x: phase === 'raise' ? stepForwardX : stepForwardX,
            y: stepForwardY,
            opacity: 1,
            scale: phase === 'swing' ? 1.1 : 1.0
          }}
          transition={{
            duration: RAISE_DURATION / 1000,
            ease: phase === 'swing' ? 'easeIn' : 'easeOut'
          }}
          style={{
            position: 'absolute',
            width: 30,
            height: 30,
            fontSize: '30px',
            pointerEvents: 'none',
            zIndex: 101,
            filter: `drop-shadow(0 0 8px ${finalColors[0]})`
          }}
        >
          <div style={{ transform: 'scaleX(-1)' }}>👺</div> {/* Face left toward player */}
        </motion.div>
      )}

      {/* Weapon - raise phase */}
      {phase === 'raise' && (
        <motion.div
          initial={{
            x: casterX,
            y: casterY,
            rotate: 0,
            opacity: 0
          }}
          animate={{
            x: arc.raiseX,
            y: arc.raiseY,
            rotate: arc.raiseRotate,
            opacity: 1
          }}
          transition={{
            duration: RAISE_DURATION / 1000,
            ease: 'easeOut'
          }}
          style={{
            position: 'absolute',
            transformOrigin: 'left center',
            pointerEvents: 'none',
            zIndex: 100
          }}
        >
          {renderWeapon(40)}
        </motion.div>
      )}

      {/* Weapon - hold phase (brief pause at top of swing) */}
      {phase === 'hold' && (
        <motion.div
          initial={{
            x: arc.holdX,
            y: arc.holdY,
            rotate: arc.holdRotate,
            opacity: 1
          }}
          animate={{
            x: arc.holdX,
            y: arc.holdY,
            rotate: arc.holdRotate,
            opacity: 1,
            scale: [1, 1.05, 1] // Small pulse during hold
          }}
          transition={{
            duration: HOLD_DURATION / 1000,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            transformOrigin: 'left center',
            pointerEvents: 'none',
            zIndex: 100,
            filter: `drop-shadow(0 0 6px ${finalColors[0]})`
          }}
        >
          {renderWeapon(40)}
        </motion.div>
      )}

      {/* Weapon - swing phase (fast strike) */}
      {phase === 'swing' && (
        <>
          {/* Weapon */}
          <motion.div
            initial={{
              x: arc.holdX,
              y: arc.holdY,
              rotate: arc.holdRotate,
              opacity: 1
            }}
            animate={{
              x: arc.swingX,
              y: arc.swingY,
              rotate: arc.swingRotate,
              opacity: 1
            }}
            transition={{
              duration: SWING_DURATION / 1000,
              ease: 'easeIn' // Accelerate into the strike
            }}
            style={{
              position: 'absolute',
              transformOrigin: 'left center',
              pointerEvents: 'none',
              zIndex: 100
            }}
          >
            {renderWeapon(40)}
          </motion.div>

          {/* Motion blur trail */}
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={`trail-${i}`}
              initial={{
                x: arc.holdX,
                y: arc.holdY,
                rotate: arc.holdRotate,
                opacity: 0
              }}
              animate={{
                x: arc.swingX,
                y: arc.swingY,
                rotate: arc.swingRotate,
                opacity: [0, 0.3, 0]
              }}
              transition={{
                duration: SWING_DURATION / 1000,
                delay: i * 0.03,
                ease: 'easeIn'
              }}
              style={{
                position: 'absolute',
                transformOrigin: 'left center',
                pointerEvents: 'none',
                zIndex: 99,
                filter: 'blur(2px)'
              }}
            >
              {renderWeapon(40)}
            </motion.div>
          ))}
        </>
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
              width: config.impactSize === 'large' ? 70 : config.impactSize === 'medium' ? 50 : 40,
              height: config.impactSize === 'large' ? 70 : config.impactSize === 'medium' ? 50 : 40,
              marginLeft: config.impactSize === 'large' ? -35 : config.impactSize === 'medium' ? -25 : -20,
              marginTop: config.impactSize === 'large' ? -35 : config.impactSize === 'medium' ? -25 : -20,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${finalColors[0]}, transparent)`,
              boxShadow: `0 0 40px ${finalColors[0]}`,
              pointerEvents: 'none',
              zIndex: 102
            }}
          />

          {/* Impact particles */}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={config.impactSize === 'large' ? 20 : config.impactSize === 'medium' ? 15 : 12}
            colors={config.particleColors}
            spread={config.impactSize === 'large' ? 100 : 80}
            lifetime={400}
            size={5}
            gravity={60}
            fadeOut={true}
          />

          {/* Slash mark for blade weapons */}
          {(weaponType === 'sword' || weaponType === 'axe' || weaponType === 'claw') && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: [0, 1, 0], scaleX: [0, 1, 1] }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                left: targetX - 30,
                top: targetY - 5,
                width: 60,
                height: 4,
                background: finalColors[0],
                transform: finalSwingPattern === 'horizontal' ? 'rotate(-20deg)' : 'rotate(-70deg)',
                boxShadow: `0 0 10px ${finalColors[0]}`,
                pointerEvents: 'none',
                zIndex: 103
              }}
            />
          )}
        </>
      )}

      {/* Recovery phase - enemy returns to original position */}
      {phase === 'recovery' && (
        <motion.div
          initial={{
            x: stepForwardX,
            y: stepForwardY,
            opacity: 1,
            scale: 1.1
          }}
          animate={{
            x: casterX,
            y: casterY,
            opacity: 1,
            scale: 1.0
          }}
          transition={{
            duration: RECOVERY_DURATION / 1000,
            ease: 'easeOut'
          }}
          style={{
            position: 'absolute',
            width: 30,
            height: 30,
            fontSize: '30px',
            pointerEvents: 'none',
            zIndex: 101
          }}
        >
          <div style={{ transform: 'scaleX(-1)' }}>👺</div>
        </motion.div>
      )}
    </>
  );
});

EnemyMeleeAnimation.displayName = 'EnemyMeleeAnimation';
