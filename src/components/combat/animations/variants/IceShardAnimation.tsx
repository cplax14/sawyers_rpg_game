import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { Projectile } from '../Projectile';
import { ICE_COLORS } from '../types';

interface IceShardAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}

/**
 * IceShardAnimation - Complete Ice Shard spell animation
 *
 * Phase breakdown (900ms total):
 * - Charge (400ms): Blue crystalline particles form and coalesce
 * - Cast (150ms): Frost mist burst from hand
 * - Travel (250ms): Sharp rotating ice shard with frozen trail effect
 * - Impact (100ms): Shatter effect with ice fragment particles
 *
 * Visual characteristics:
 * - Primary color: #4da6ff (ice blue)
 * - Secondary color: #b3e0ff (light blue)
 * - Particles: 12-18 charge, 8-12 travel, 20-25 impact
 * - Special effects: Crystal formation during charge, sharp angular shatter on impact
 */
export const IceShardAnimation: React.FC<IceShardAnimationProps> = React.memo(({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  const [phase, setPhase] = useState<'charge' | 'cast' | 'travel' | 'impact'>('charge');

  // Phase durations (ms)
  const CHARGE_DURATION = 400;
  const CAST_DURATION = 150;
  const TRAVEL_DURATION = 250;
  const IMPACT_DURATION = 100;

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
      {/* CHARGE PHASE: Crystalline particles forming (400ms) */}
      {phase === 'charge' && (
        <>
          {/* Converging ice crystals */}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={15}
            colors={[ICE_COLORS.primary, ICE_COLORS.secondary, ICE_COLORS.accent]}
            spread={-70} // Negative spread = particles converge inward
            lifetime={CHARGE_DURATION}
            size={5}
            gravity={0}
            fadeOut={false}
            onComplete={handleChargeComplete}
          />

          {/* Crystalline formation glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.6, 0.8, 0.9],
              scale: [0, 0.8, 1, 1.1],
              transition: {
                duration: CHARGE_DURATION / 1000,
                ease: 'easeIn'
              }
            }}
            style={{
              position: 'absolute',
              left: casterX - 25,
              top: casterY - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ICE_COLORS.accent}80 0%, ${ICE_COLORS.primary}60 40%, transparent 70%)`,
              filter: 'blur(6px)',
              boxShadow: `0 0 20px ${ICE_COLORS.primary}`
            }}
          />

          {/* Hexagonal crystal pattern */}
          <motion.div
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: [0, 0.7, 0.8],
              scale: [0, 1, 1.2],
              rotate: [0, 60, 120],
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
              background: 'transparent',
              border: `2px solid ${ICE_COLORS.primary}`,
              clipPath: 'polygon(50% 0%, 90% 25%, 90% 75%, 50% 100%, 10% 75%, 10% 25%)', // Hexagon
              boxShadow: `0 0 15px ${ICE_COLORS.primary}`
            }}
          />

          {/* Frost mist gathering */}
          <motion.div
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{
              opacity: [0, 0.3, 0.4],
              scale: [1.5, 1, 0.8],
              transition: {
                duration: CHARGE_DURATION / 1000,
                ease: 'easeIn'
              }
            }}
            style={{
              position: 'absolute',
              left: casterX - 35,
              top: casterY - 35,
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ICE_COLORS.secondary}30 0%, transparent 70%)`,
              filter: 'blur(10px)'
            }}
          />
        </>
      )}

      {/* CAST PHASE: Frost mist burst (150ms) */}
      {phase === 'cast' && (
        <>
          {/* Frost mist explosion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.8, 0],
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
              background: `radial-gradient(circle, ${ICE_COLORS.accent}cc 0%, ${ICE_COLORS.secondary}60 50%, transparent 80%)`,
              filter: 'blur(8px)'
            }}
          />

          {/* Crystalline shards bursting out */}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={10}
            colors={[ICE_COLORS.accent, ICE_COLORS.primary]}
            spread={120}
            lifetime={CAST_DURATION}
            size={6}
            gravity={0}
            fadeOut={true}
          />

          {/* Flash effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.6, 0],
              transition: {
                duration: CAST_DURATION / 1000,
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
              background: ICE_COLORS.accent,
              filter: 'blur(15px)'
            }}
          />
        </>
      )}

      {/* TRAVEL PHASE: Rotating ice shard (250ms) */}
      {phase === 'travel' && (
        <>
          {/* Main ice shard projectile */}
          <Projectile
            startX={casterX}
            startY={casterY}
            endX={targetX}
            endY={targetY}
            color={ICE_COLORS.primary}
            size={22}
            duration={TRAVEL_DURATION}
            glowIntensity={1.0}
            onComplete={handleTravelComplete}
          />

          {/* Sharp crystalline shard (rotates rapidly) */}
          <motion.div
            initial={{ x: casterX, y: casterY, opacity: 0, rotate: 0 }}
            animate={{
              x: targetX,
              y: targetY,
              opacity: [0, 1, 1],
              rotate: 900, // Rapid rotation (2.5 spins)
              transition: {
                duration: TRAVEL_DURATION / 1000,
                ease: 'linear'
              }
            }}
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              marginLeft: 0,
              marginTop: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: `28px solid ${ICE_COLORS.primary}`,
              filter: `drop-shadow(0 0 8px ${ICE_COLORS.primary}) drop-shadow(0 0 12px ${ICE_COLORS.accent})`,
              transformOrigin: 'center 66%' // Rotate from base of triangle
            }}
          />

          {/* Frozen trail particles */}
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
              particleCount={10}
              colors={[ICE_COLORS.secondary, ICE_COLORS.accent]}
              spread={25}
              lifetime={TRAVEL_DURATION * 0.7}
              size={4}
              gravity={-10} // Slight upward float
              fadeOut={true}
            />
          </motion.div>

          {/* Frost vapor trail */}
          <motion.div
            initial={{ x: casterX, y: casterY, opacity: 0 }}
            animate={{
              x: targetX,
              y: targetY,
              opacity: [0, 0.4, 0.4, 0],
              transition: {
                duration: TRAVEL_DURATION / 1000,
                ease: 'linear'
              }
            }}
            style={{
              position: 'absolute',
              width: 15,
              height: 15,
              marginLeft: -7.5,
              marginTop: -7.5,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ICE_COLORS.secondary}60 0%, transparent 70%)`,
              filter: 'blur(6px)'
            }}
          />
        </>
      )}

      {/* IMPACT PHASE: Ice shatter effect (100ms) */}
      {phase === 'impact' && (
        <>
          {/* Core shatter burst */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.2, 1.8],
              transition: {
                duration: IMPACT_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            onAnimationComplete={handleImpactComplete}
            style={{
              position: 'absolute',
              left: targetX - 40,
              top: targetY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ICE_COLORS.accent}ff 0%, ${ICE_COLORS.primary}cc 40%, transparent 70%)`,
              filter: 'blur(5px)'
            }}
          />

          {/* Ice fragment shards (angular) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <motion.div
              key={angle}
              initial={{
                x: targetX,
                y: targetY,
                opacity: 0,
                rotate: angle,
                scale: 0
              }}
              animate={{
                x: targetX + Math.cos((angle * Math.PI) / 180) * 50,
                y: targetY + Math.sin((angle * Math.PI) / 180) * 50,
                opacity: [0, 1, 0.7, 0],
                rotate: angle + 180,
                scale: [0, 1, 0.8, 0],
                transition: {
                  duration: IMPACT_DURATION / 1000,
                  ease: 'easeOut'
                }
              }}
              style={{
                position: 'absolute',
                width: 0,
                height: 0,
                borderLeft: '4px solid transparent',
                borderRight: '4px solid transparent',
                borderBottom: `12px solid ${ICE_COLORS.primary}`,
                filter: `drop-shadow(0 0 4px ${ICE_COLORS.accent})`
              }}
            />
          ))}

          {/* Shatter particles */}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={22}
            colors={[ICE_COLORS.primary, ICE_COLORS.secondary, ICE_COLORS.accent]}
            spread={130}
            lifetime={IMPACT_DURATION}
            size={6}
            gravity={100}
            fadeOut={true}
          />

          {/* Frost cloud */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.5, 2, 2.5],
              transition: {
                duration: IMPACT_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 50,
              top: targetY - 50,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ICE_COLORS.secondary}40 0%, transparent 70%)`,
              filter: 'blur(12px)'
            }}
          />

          {/* Screen flash effect (blue) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.1, 0],
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
              background: ICE_COLORS.primary,
              pointerEvents: 'none',
              zIndex: 99
            }}
          />
        </>
      )}
    </div>
  );
});

IceShardAnimation.displayName = 'IceShardAnimation';
