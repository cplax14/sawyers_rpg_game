/**
 * MagicBoltAnimation Component
 *
 * Orchestrates the complete Magic Bolt attack animation sequence
 * Phases: Charge → Cast → Projectile → Impact
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChargeParticles } from './ChargeParticles';
import { Projectile } from './Projectile';
import { ImpactEffects } from './ImpactEffects';
import { MAGIC_BOLT_TIMINGS, ELEMENT_COLORS, SPRING_CONFIG } from './types';

interface MagicBoltAnimationProps {
  /** Position of the caster */
  casterPosition: { x: number; y: number };
  /** Position of the target */
  targetPosition: { x: number; y: number };
  /** Damage dealt by the attack */
  damage: number;
  /** Whether this is a critical hit */
  isCritical?: boolean;
  /** Element type for visual effects */
  element?: 'arcane' | 'fire' | 'ice' | 'lightning';
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Whether to trigger the animation */
  isActive: boolean;
}

type AnimationPhase = 'idle' | 'charge' | 'cast' | 'projectile' | 'impact' | 'complete';

export const MagicBoltAnimation: React.FC<MagicBoltAnimationProps> = ({
  casterPosition,
  targetPosition,
  damage,
  isCritical = false,
  element = 'arcane',
  onComplete,
  isActive
}) => {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [screenShake, setScreenShake] = useState(false);

  const elementColor = ELEMENT_COLORS[element];

  // Reset animation when isActive changes to true
  useEffect(() => {
    if (isActive && phase === 'idle') {
      startAnimation();
    } else if (!isActive) {
      setPhase('idle');
      setScreenShake(false);
    }
  }, [isActive]);

  const startAnimation = useCallback(() => {
    // Phase 1: Charging
    setPhase('charge');

    setTimeout(() => {
      // Phase 2: Casting
      setPhase('cast');

      setTimeout(() => {
        // Phase 3: Projectile travel
        setPhase('projectile');

        setTimeout(() => {
          // Phase 4: Impact
          setPhase('impact');
          setScreenShake(true);

          setTimeout(() => {
            setScreenShake(false);
            setPhase('complete');
            onComplete?.();

            // Reset to idle after a brief delay
            setTimeout(() => {
              setPhase('idle');
            }, 100);
          }, MAGIC_BOLT_TIMINGS.impact);
        }, MAGIC_BOLT_TIMINGS.travel);
      }, MAGIC_BOLT_TIMINGS.cast);
    }, MAGIC_BOLT_TIMINGS.charge);
  }, [onComplete]);

  const handleProjectileComplete = useCallback(() => {
    // Projectile has reached target, impact happens next
  }, []);

  if (!isActive) return null;

  return (
    <>
      {/* Caster charge-up animation */}
      <motion.div
        animate={
          phase === 'charge' || phase === 'cast'
            ? {
                scale: [1, 1.1, 1],
                rotate: [0, -5, 5, 0]
              }
            : {}
        }
        transition={{
          duration: MAGIC_BOLT_TIMINGS.charge / 1000,
          ease: 'easeInOut'
        }}
        style={{
          position: 'absolute',
          left: casterPosition.x,
          top: casterPosition.y,
          pointerEvents: 'none'
        }}
      >
        {/* Caster glow during charge */}
        {(phase === 'charge' || phase === 'cast') && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1.2,
              opacity: 0.8
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{
              duration: MAGIC_BOLT_TIMINGS.charge / 1000,
              ease: 'easeOut'
            }}
            style={{
              position: 'absolute',
              width: 80,
              height: 80,
              borderRadius: '50%',
              backgroundColor: elementColor.primary,
              filter: 'blur(20px)',
              left: -40,
              top: -40,
              zIndex: 98
            }}
          />
        )}
      </motion.div>

      {/* Charge particles */}
      <ChargeParticles
        x={casterPosition.x}
        y={casterPosition.y}
        config={{
          color: elementColor.primary,
          spread: 50
        }}
        isActive={phase === 'charge'}
      />

      {/* Casting hand gesture (arcane symbols) */}
      {phase === 'cast' && (
        <motion.div
          initial={{ scale: 0, rotate: 0, opacity: 0 }}
          animate={{
            scale: 1.2,
            rotate: 180,
            opacity: 1
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            duration: MAGIC_BOLT_TIMINGS.cast / 1000,
            ease: 'easeOut'
          }}
          style={{
            position: 'absolute',
            left: casterPosition.x,
            top: casterPosition.y,
            fontSize: '3rem',
            color: elementColor.glow,
            textShadow: `0 0 20px ${elementColor.primary}`,
            zIndex: 99,
            pointerEvents: 'none'
          }}
        >
          ✨
        </motion.div>
      )}

      {/* Projectile */}
      <Projectile
        config={{
          startX: casterPosition.x,
          startY: casterPosition.y,
          endX: targetPosition.x,
          endY: targetPosition.y,
          color: elementColor.primary,
          glowColor: elementColor.glow,
          size: 16
        }}
        isActive={phase === 'projectile'}
        onComplete={handleProjectileComplete}
      />

      {/* Impact effects */}
      <ImpactEffects
        config={{
          x: targetPosition.x,
          y: targetPosition.y,
          damage,
          isCritical,
          element
        }}
        isActive={phase === 'impact'}
      />

      {/* Screen shake overlay */}
      {screenShake && (
        <motion.div
          animate={{
            x: [0, -4, 4, -4, 4, 0],
            y: [0, 2, -2, 2, -2, 0]
          }}
          transition={{
            duration: 0.2,
            ease: 'easeInOut'
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 1000
          }}
        />
      )}

      {/* Target hit reaction */}
      {(phase === 'impact' || phase === 'complete') && (
        <motion.div
          animate={{
            x: [0, 10, -10, 5, -5, 0],
            opacity: [1, 0.7, 0.7, 0.85, 0.85, 1]
          }}
          transition={{
            duration: 0.3,
            ease: 'easeInOut'
          }}
          style={{
            position: 'absolute',
            left: targetPosition.x,
            top: targetPosition.y,
            pointerEvents: 'none',
            zIndex: 97
          }}
        />
      )}
    </>
  );
};
