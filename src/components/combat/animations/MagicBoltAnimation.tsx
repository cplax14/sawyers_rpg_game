import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from './core/ParticleSystem';
import { Projectile } from './Projectile';
import { ImpactEffects } from './ImpactEffects';
import { ARCANE_COLORS, validateParticleCount, CRITICAL_HIT_MULTIPLIERS } from './types';
import { CriticalScreenShake, CriticalImpactRings, CriticalIndicator } from './CriticalHitEffects';

interface MagicBoltAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
  // Critical hit enhancement props
  isCritical?: boolean;
  damage?: number;
  element?: string;
}

/**
 * MagicBoltAnimation - Basic arcane projectile spell
 *
 * Phase breakdown (950ms total):
 * - Charge (400ms): Purple/violet particles swirl around caster's hand
 * - Cast (150ms): Arcane symbols flash with bright glow
 * - Travel (300ms): Violet energy bolt with trailing particles
 * - Impact (100ms): Purple burst with sparkle effects
 *
 * Visual characteristics:
 * - Primary color: #9c27b0 (purple)
 * - Secondary color: #ba68c8 (light purple)
 * - Particles: 15 charge, 10 travel, 20 impact
 * - Special effects: Pulsing glow during charge, symbol rotation during cast
 */
export const MagicBoltAnimation: React.FC<MagicBoltAnimationProps> = React.memo(
  ({ casterX, casterY, targetX, targetY, onComplete, isCritical = false, damage, element }) => {
    const [phase, setPhase] = useState<'charge' | 'cast' | 'travel' | 'impact'>('charge');

    // Apply critical hit multipliers
    const critMultiplier = isCritical
      ? CRITICAL_HIT_MULTIPLIERS
      : {
          particleCount: 1,
          scale: 1,
          glowOpacity: 1,
          screenFlash: 1,
          impactDuration: 1,
          shakeIntensity: 0,
        };

    // Phase durations (ms) - extend impact for critical hits
    const CHARGE_DURATION = 800; // DOUBLED from 400ms for more anticipation
    const CAST_DURATION = 150;
    const TRAVEL_DURATION = 300;
    const IMPACT_DURATION = isCritical ? 150 : 100; // +50ms for crits

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
          zIndex: 100,
        }}
      >
        {/* CHARGE PHASE: Swirling particles around caster (400ms) */}
        {phase === 'charge' && (
          <>
            {/* Primary particle swirl */}
            {validateParticleCount(15, 'MagicBoltAnimation', 'charge')}
            <ParticleSystem
              originX={casterX}
              originY={casterY}
              particleCount={15}
              colors={[ARCANE_COLORS.primary, ARCANE_COLORS.secondary]}
              spread={50}
              lifetime={CHARGE_DURATION}
              size={5}
              gravity={0}
              fadeOut={true}
              onComplete={handleChargeComplete}
            />

            {/* Inner concentrated glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.7, 0.7],
                scale: [0, 1.1, 1.1],
                transition: {
                  duration: CHARGE_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: casterX - 25,
                top: casterY - 25,
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${ARCANE_COLORS.primary}90 0%, ${ARCANE_COLORS.secondary}50 50%, transparent 80%)`,
                filter: 'blur(10px)',
              }}
            />

            {/* Pulsing outer glow */}
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{
                opacity: [0, 0.5, 0.3],
                scale: [0.6, 1.4, 1.2],
                transition: {
                  duration: CHARGE_DURATION / 1000,
                  ease: 'easeInOut',
                },
              }}
              style={{
                position: 'absolute',
                left: casterX - 35,
                top: casterY - 35,
                width: 70,
                height: 70,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${ARCANE_COLORS.primary}50 0%, transparent 70%)`,
                filter: 'blur(15px)',
              }}
            />
          </>
        )}

        {/* CAST PHASE: Arcane symbol flash (150ms) */}
        {phase === 'cast' && (
          <>
            {/* Burst flash */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0.5, 1.8, 2.2],
                transition: {
                  duration: CAST_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              onAnimationComplete={handleCastComplete}
              style={{
                position: 'absolute',
                left: casterX - 45,
                top: casterY - 45,
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${ARCANE_COLORS.accent}ff 0%, ${ARCANE_COLORS.primary}90 40%, transparent 70%)`,
                filter: 'blur(12px)',
              }}
            />

            {/* Rotating arcane symbols */}
            <motion.div
              initial={{ scale: 0, rotate: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 1],
                rotate: 180,
                opacity: [0, 1, 0.8],
                transition: {
                  duration: CAST_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: casterX - 20,
                top: casterY - 20,
                width: 40,
                height: 40,
                fontSize: '2.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: ARCANE_COLORS.secondary,
                textShadow: `0 0 20px ${ARCANE_COLORS.primary}, 0 0 30px ${ARCANE_COLORS.accent}`,
              }}
            >
              ✨
            </motion.div>
          </>
        )}

        {/* TRAVEL PHASE: Violet energy bolt (300ms) */}
        {phase === 'travel' && (
          <>
            {/* Main energy bolt projectile - larger for critical hits */}
            <Projectile
              startX={casterX}
              startY={casterY}
              endX={targetX}
              endY={targetY}
              color={isCritical ? '#ffd700' : ARCANE_COLORS.primary}
              size={isCritical ? 24 : 18}
              duration={TRAVEL_DURATION}
              glowIntensity={isCritical ? 1.6 : 1.3}
              onComplete={handleTravelComplete}
            />

            {/* Pulsing arcane core */}
            <motion.div
              initial={{ x: casterX, y: casterY, opacity: 0, scale: 0.8 }}
              animate={{
                x: targetX,
                y: targetY,
                opacity: [0, 1, 1, 0.9],
                scale: [0.8, 1.1, 1, 0.9],
                transition: {
                  duration: TRAVEL_DURATION / 1000,
                  ease: 'linear',
                },
              }}
              style={{
                position: 'absolute',
                width: 16,
                height: 16,
                marginLeft: -8,
                marginTop: -8,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${ARCANE_COLORS.accent} 0%, ${ARCANE_COLORS.primary} 60%, transparent 90%)`,
                boxShadow: `0 0 15px ${ARCANE_COLORS.primary}, 0 0 25px ${ARCANE_COLORS.secondary}`,
              }}
            />

            {/* Trailing arcane particles */}
            <motion.div
              initial={{ x: casterX, y: casterY }}
              animate={{
                x: targetX,
                y: targetY,
                transition: {
                  duration: TRAVEL_DURATION / 1000,
                  ease: 'linear',
                },
              }}
              style={{
                position: 'absolute',
                width: 0,
                height: 0,
              }}
            >
              {validateParticleCount(10, 'MagicBoltAnimation', 'travel-trail')}
              <ParticleSystem
                originX={0}
                originY={0}
                particleCount={10}
                colors={[ARCANE_COLORS.primary, ARCANE_COLORS.secondary]}
                spread={25}
                lifetime={TRAVEL_DURATION * 0.7}
                size={4}
                gravity={0}
                fadeOut={true}
              />
            </motion.div>
          </>
        )}

        {/* IMPACT PHASE: Purple burst (100-150ms) */}
        {phase === 'impact' && (
          <>
            {/* Core impact flash - enhanced for critical hits */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1 * critMultiplier.glowOpacity, 0.5, 0],
                scale: [
                  0,
                  1.3 * critMultiplier.scale,
                  1.8 * critMultiplier.scale,
                  2.2 * critMultiplier.scale,
                ],
                transition: {
                  duration: IMPACT_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              onAnimationComplete={handleImpactComplete}
              style={{
                position: 'absolute',
                left: targetX - 50,
                top: targetY - 50,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: isCritical
                  ? `radial-gradient(circle, #ffd700 0%, ${ARCANE_COLORS.accent}ff 20%, ${ARCANE_COLORS.primary}dd 40%, ${ARCANE_COLORS.secondary}90 60%, transparent 80%)`
                  : `radial-gradient(circle, ${ARCANE_COLORS.accent}ff 0%, ${ARCANE_COLORS.primary}dd 30%, ${ARCANE_COLORS.secondary}90 60%, transparent 80%)`,
                filter: `blur(${isCritical ? 8 : 6}px)`,
              }}
            />

            {/* Impact ring shockwave */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0.7, 0.3, 0],
                scale: [0, 1.8, 2.5],
                transition: {
                  duration: IMPACT_DURATION / 1000,
                  ease: [0.4, 0, 0.2, 1],
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 35,
                top: targetY - 35,
                width: 70,
                height: 70,
                borderRadius: '50%',
                border: `2px solid ${ARCANE_COLORS.primary}`,
                boxShadow: `0 0 15px ${ARCANE_COLORS.primary}`,
              }}
            />

            {/* Critical-only impact rings */}
            {isCritical && (
              <CriticalImpactRings
                targetX={targetX}
                targetY={targetY}
                color={ARCANE_COLORS.accent}
                duration={IMPACT_DURATION}
              />
            )}

            {/* Impact particles - more for critical hits */}
            {validateParticleCount(
              Math.floor(20 * Math.min(critMultiplier.particleCount, 30 / 20)),
              'MagicBoltAnimation',
              'impact'
            )}
            <ParticleSystem
              originX={targetX}
              originY={targetY}
              particleCount={Math.floor(20 * Math.min(critMultiplier.particleCount, 30 / 20))}
              colors={[ARCANE_COLORS.primary, ARCANE_COLORS.secondary, ARCANE_COLORS.accent]}
              spread={120}
              lifetime={IMPACT_DURATION}
              size={6}
              gravity={60}
              fadeOut={true}
            />

            {/* Sparkle burst */}
            {validateParticleCount(12, 'MagicBoltAnimation', 'impact-sparkles')}
            <ParticleSystem
              originX={targetX}
              originY={targetY}
              particleCount={12}
              colors={[ARCANE_COLORS.accent, ARCANE_COLORS.secondary]}
              spread={80}
              lifetime={IMPACT_DURATION * 1.3}
              size={4}
              gravity={40}
              fadeOut={true}
            />

            {/* Screen flash effect - enhanced for critical hits */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.1 * critMultiplier.screenFlash, 0],
                transition: {
                  duration: IMPACT_DURATION / 1000,
                  ease: 'easeInOut',
                },
              }}
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                background: isCritical
                  ? `linear-gradient(to bottom, #ffd700, ${ARCANE_COLORS.accent}, ${ARCANE_COLORS.primary})`
                  : ARCANE_COLORS.primary,
                pointerEvents: 'none',
                zIndex: 99,
              }}
            />

            {/* Critical hit indicator */}
            {isCritical && <CriticalIndicator targetX={targetX} targetY={targetY} />}

            {/* Critical screen shake */}
            {isCritical && <CriticalScreenShake duration={IMPACT_DURATION} />}
          </>
        )}
      </div>
    );
  }
);

MagicBoltAnimation.displayName = 'MagicBoltAnimation';
