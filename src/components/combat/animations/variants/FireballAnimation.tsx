import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { Projectile } from '../Projectile';
import { ImpactEffects } from '../ImpactEffects';
import { FIRE_COLORS } from '../types';

interface FireballAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}

/**
 * FireballAnimation - Complete Fireball spell animation
 *
 * Phase breakdown (950ms total):
 * - Charge (350ms): Red/orange particles swirl around caster's hand
 * - Cast (150ms): Flame burst from hand with bright flash
 * - Travel (300ms): Spinning fireball projectile with trailing particles
 * - Impact (150ms): Explosion burst with fire particles scattering
 *
 * Visual characteristics:
 * - Primary color: #ff6b35 (fire orange)
 * - Secondary color: #ff4444 (red)
 * - Particles: 15-20 charge, 10-15 travel, 25-30 impact
 * - Special effects: Rotation during travel, radial burst on impact
 */
export const FireballAnimation: React.FC<FireballAnimationProps> = React.memo(({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  const [phase, setPhase] = useState<'charge' | 'cast' | 'travel' | 'impact'>('charge');

  // Phase durations (ms)
  const CHARGE_DURATION = 350;
  const CAST_DURATION = 150;
  const TRAVEL_DURATION = 300;
  const IMPACT_DURATION = 150;

  // Calculate projectile trajectory
  const deltaX = targetX - casterX;
  const deltaY = targetY - casterY;
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  // Phase transition handlers
  const handleChargeComplete = useCallback(() => {
    setPhase('cast');
  }, []);

  const handleCastComplete = useCallback(() => {
    setPhase('travel');
  }, []);

  const handleTravelComplete = useCallback(() => {
    setPhase('impact');
  }, []);

  const handleImpactComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

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
      {/* CHARGE PHASE: Swirling particles around caster (350ms) */}
      {phase === 'charge' && (
        <>
          {/* Primary particle swirl */}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={18}
            colors={[FIRE_COLORS.primary, FIRE_COLORS.secondary]}
            spread={60}
            lifetime={CHARGE_DURATION}
            size={6}
            gravity={0}
            fadeOut={true}
            onComplete={handleChargeComplete}
          />

          {/* Inner concentrated glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0.8],
              scale: [0, 1.2, 1.2],
              transition: {
                duration: CHARGE_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: casterX - 20,
              top: casterY - 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${FIRE_COLORS.primary}80 0%, ${FIRE_COLORS.secondary}40 50%, transparent 80%)`,
              filter: 'blur(8px)'
            }}
          />

          {/* Pulsing outer glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.6, 0.4],
              scale: [0.5, 1.5, 1.3],
              transition: {
                duration: CHARGE_DURATION / 1000,
                ease: 'easeInOut'
              }
            }}
            style={{
              position: 'absolute',
              left: casterX - 30,
              top: casterY - 30,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${FIRE_COLORS.primary}40 0%, transparent 70%)`,
              filter: 'blur(12px)'
            }}
          />
        </>
      )}

      {/* CAST PHASE: Flame burst (150ms) */}
      {phase === 'cast' && (
        <>
          {/* Burst flash */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 2, 2.5],
              transition: {
                duration: CAST_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            onAnimationComplete={handleCastComplete}
            style={{
              position: 'absolute',
              left: casterX - 40,
              top: casterY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${FIRE_COLORS.accent}ff 0%, ${FIRE_COLORS.primary}80 40%, transparent 70%)`,
              filter: 'blur(10px)'
            }}
          />

          {/* Burst particles */}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={12}
            colors={[FIRE_COLORS.primary, FIRE_COLORS.accent]}
            spread={100}
            lifetime={CAST_DURATION}
            size={8}
            gravity={0}
            fadeOut={true}
          />
        </>
      )}

      {/* TRAVEL PHASE: Spinning fireball projectile (300ms) */}
      {phase === 'travel' && (
        <>
          {/* Main fireball projectile */}
          <Projectile
            startX={casterX}
            startY={casterY}
            endX={targetX}
            endY={targetY}
            color={FIRE_COLORS.primary}
            size={24}
            duration={TRAVEL_DURATION}
            glowIntensity={1.2}
            onComplete={handleTravelComplete}
          />

          {/* Spinning fire core */}
          <motion.div
            initial={{ x: casterX, y: casterY, opacity: 0, rotate: 0 }}
            animate={{
              x: targetX,
              y: targetY,
              opacity: [0, 1, 1, 0.8],
              rotate: 720, // Two full rotations
              transition: {
                duration: TRAVEL_DURATION / 1000,
                ease: 'linear'
              }
            }}
            style={{
              position: 'absolute',
              width: 20,
              height: 20,
              marginLeft: -10,
              marginTop: -10,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${FIRE_COLORS.accent} 0%, ${FIRE_COLORS.primary} 50%, transparent 80%)`,
              boxShadow: `0 0 20px ${FIRE_COLORS.primary}, 0 0 30px ${FIRE_COLORS.secondary}`
            }}
          />

          {/* Trailing fire particles */}
          <motion.div
            initial={{ x: casterX, y: casterY }}
            animate={{
              x: targetX,
              y: targetY,
              transition: {
                duration: TRAVEL_DURATION / 1000,
                ease: 'linear'
              }
            }}
            style={{
              position: 'absolute',
              width: 0,
              height: 0
            }}
          >
            <ParticleSystem
              originX={0}
              originY={0}
              particleCount={15}
              colors={[FIRE_COLORS.primary, FIRE_COLORS.secondary]}
              spread={30}
              lifetime={TRAVEL_DURATION * 0.6}
              size={5}
              gravity={20}
              fadeOut={true}
            />
          </motion.div>
        </>
      )}

      {/* IMPACT PHASE: Explosion burst (150ms) */}
      {phase === 'impact' && (
        <>
          {/* Core explosion flash */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0.6, 0],
              scale: [0, 1.5, 2, 2.5],
              transition: {
                duration: IMPACT_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            onAnimationComplete={handleImpactComplete}
            style={{
              position: 'absolute',
              left: targetX - 60,
              top: targetY - 60,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${FIRE_COLORS.accent}ff 0%, ${FIRE_COLORS.primary}cc 30%, ${FIRE_COLORS.secondary}80 60%, transparent 80%)`,
              filter: 'blur(8px)'
            }}
          />

          {/* Explosion ring shockwave */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.8, 0.4, 0],
              scale: [0, 2, 3],
              transition: {
                duration: IMPACT_DURATION / 1000,
                ease: [0.4, 0, 0.2, 1]
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 40,
              top: targetY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              border: `3px solid ${FIRE_COLORS.primary}`,
              boxShadow: `0 0 20px ${FIRE_COLORS.primary}`
            }}
          />

          {/* Radiating explosion particles */}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={28}
            colors={[FIRE_COLORS.primary, FIRE_COLORS.secondary, FIRE_COLORS.accent]}
            spread={150}
            lifetime={IMPACT_DURATION}
            size={8}
            gravity={80}
            fadeOut={true}
          />

          {/* Secondary particle burst */}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={15}
            colors={[FIRE_COLORS.accent, FIRE_COLORS.primary]}
            spread={100}
            lifetime={IMPACT_DURATION * 1.2}
            size={6}
            gravity={50}
            fadeOut={true}
          />

          {/* Screen flash effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.15, 0],
              transition: {
                duration: IMPACT_DURATION / 1000,
                ease: 'easeInOut'
              }
            }}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              background: FIRE_COLORS.primary,
              pointerEvents: 'none',
              zIndex: 99
            }}
          />
        </>
      )}
    </div>
  );
});

FireballAnimation.displayName = 'FireballAnimation';
