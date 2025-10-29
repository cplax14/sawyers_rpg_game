import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { HOLY_COLORS, validateParticleCount, CRITICAL_HIT_MULTIPLIERS } from '../types';
import { CriticalScreenShake, CriticalImpactRings, CriticalIndicator } from '../CriticalHitEffects';

interface HolyBeamAnimationProps {
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
 * HolyBeamAnimation - Complete Holy Beam spell animation
 *
 * Phase breakdown (1000ms total):
 * - Charge (350ms): Golden particles gather above caster
 * - Cast (150ms): Bright divine light begins to form
 * - Beam (350ms): Column of light descends from above onto target
 * - Impact (150ms): Radiant burst, lingering golden sparkles
 *
 * Visual characteristics:
 * - Primary color: #ffd700 (gold)
 * - Secondary color: #ffffcc (light gold)
 * - Particles: 15-20 charge, continuous beam effect, 25-30 impact
 * - Special effects: Vertical beam of light, radiant glow effect, divine sparkles
 */
export const HolyBeamAnimation: React.FC<HolyBeamAnimationProps> = React.memo(
  ({ casterX, casterY, targetX, targetY, onComplete, isCritical = false, damage, element }) => {
    const [phase, setPhase] = useState<'charge' | 'cast' | 'beam' | 'impact'>('charge');

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
    const CHARGE_DURATION = 700; // DOUBLED from 350ms for more anticipation
    const CAST_DURATION = 150;
    const BEAM_DURATION = 350;
    const IMPACT_DURATION = isCritical ? 200 : 150; // +50ms for crits

    // Phase transition handlers
    const handleChargeComplete = useCallback(() => {
      setPhase('cast');
    }, []);

    const handleCastComplete = useCallback(() => {
      setPhase('beam');
    }, []);

    const handleBeamComplete = useCallback(() => {
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
        {/* CHARGE PHASE: Golden particles gather above (350ms) */}
        {phase === 'charge' && (
          <>
            {/* Rising golden particles */}
            <ParticleSystem
              originX={casterX}
              originY={casterY}
              particleCount={18}
              colors={[HOLY_COLORS.primary, HOLY_COLORS.secondary, HOLY_COLORS.accent]}
              spread={60}
              lifetime={CHARGE_DURATION}
              size={6}
              gravity={-80} // Float upward
              fadeOut={false}
              onComplete={handleChargeComplete}
            />

            {/* Gathering light above caster */}
            <motion.div
              initial={{ opacity: 0, scale: 0, y: 0 }}
              animate={{
                opacity: [0, 0.4, 0.6, 0.8],
                scale: [0, 0.8, 1, 1.2],
                y: [-60, -70, -80, -90],
                transition: {
                  duration: CHARGE_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: casterX - 30,
                top: casterY,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${HOLY_COLORS.accent}ff 0%, ${HOLY_COLORS.primary}cc 40%, ${HOLY_COLORS.secondary}60 70%, transparent 90%)`,
                filter: 'blur(10px)',
                boxShadow: `0 0 30px ${HOLY_COLORS.primary}`,
              }}
            />

            {/* Divine circle forming above */}
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: 0 }}
              animate={{
                opacity: [0, 0.6, 0.8],
                scale: [0, 1, 1.2],
                rotate: [0, 180, 360],
                transition: {
                  duration: CHARGE_DURATION / 1000,
                  ease: 'linear',
                },
              }}
              style={{
                position: 'absolute',
                left: casterX - 35,
                top: casterY - 100,
                width: 70,
                height: 70,
                borderRadius: '50%',
                border: `2px solid ${HOLY_COLORS.primary}`,
                boxShadow: `0 0 20px ${HOLY_COLORS.primary}, inset 0 0 20px ${HOLY_COLORS.secondary}40`,
              }}
            />

            {/* Radiant cross pattern */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.7, 0.8],
                scale: [0, 0.9, 1],
                transition: {
                  duration: CHARGE_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: casterX - 2,
                top: casterY - 110,
                width: 4,
                height: 30,
                background: `linear-gradient(to bottom, ${HOLY_COLORS.accent} 0%, ${HOLY_COLORS.primary} 100%)`,
                boxShadow: `0 0 12px ${HOLY_COLORS.primary}`,
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.7, 0.8],
                scale: [0, 0.9, 1],
                transition: {
                  duration: CHARGE_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: casterX - 15,
                top: casterY - 97,
                width: 30,
                height: 4,
                background: `linear-gradient(to right, ${HOLY_COLORS.accent} 0%, ${HOLY_COLORS.primary} 100%)`,
                boxShadow: `0 0 12px ${HOLY_COLORS.primary}`,
              }}
            />

            {/* Soft glow at caster */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.3, 0.5],
                transition: {
                  duration: CHARGE_DURATION / 1000,
                  ease: 'easeIn',
                },
              }}
              style={{
                position: 'absolute',
                left: casterX - 40,
                top: casterY - 40,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${HOLY_COLORS.secondary}40 0%, transparent 70%)`,
                filter: 'blur(15px)',
              }}
            />
          </>
        )}

        {/* CAST PHASE: Divine light forms (150ms) */}
        {phase === 'cast' && (
          <>
            {/* Bright flash above */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 0.8],
                scale: [0.5, 1.5, 1.3],
                transition: {
                  duration: CAST_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              onAnimationComplete={handleCastComplete}
              style={{
                position: 'absolute',
                left: casterX - 50,
                top: casterY - 120,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${HOLY_COLORS.accent}ff 0%, ${HOLY_COLORS.primary}dd 50%, transparent 80%)`,
                filter: 'blur(12px)',
              }}
            />

            {/* Expanding divine ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0.6],
                scale: [0, 1.5, 2],
                transition: {
                  duration: CAST_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: casterX - 60,
                top: casterY - 130,
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: `3px solid ${HOLY_COLORS.accent}`,
                boxShadow: `0 0 25px ${HOLY_COLORS.primary}`,
              }}
            />

            {/* Descending preparation glow */}
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{
                opacity: [0, 0.5, 0.7],
                scaleY: [0, 0.5, 0.8],
                transition: {
                  duration: CAST_DURATION / 1000,
                  ease: 'easeIn',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 25,
                top: 0,
                width: 50,
                height: targetY,
                background: `linear-gradient(to bottom, ${HOLY_COLORS.accent}40 0%, ${HOLY_COLORS.primary}20 50%, transparent 100%)`,
                filter: 'blur(8px)',
                transformOrigin: 'top',
              }}
            />

            {/* Burst particles */}
            <ParticleSystem
              originX={casterX}
              originY={casterY - 100}
              particleCount={12}
              colors={[HOLY_COLORS.accent, HOLY_COLORS.primary]}
              spread={100}
              lifetime={CAST_DURATION}
              size={5}
              gravity={0}
              fadeOut={true}
            />
          </>
        )}

        {/* BEAM PHASE: Column of light descends (350ms) */}
        {phase === 'beam' && (
          <>
            {/* Main beam column - wider for critical hits */}
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{
                opacity: [0, 0.9 * critMultiplier.glowOpacity, 0.8, 0.7],
                scaleY: [0, 1, 1, 1],
                transition: {
                  duration: BEAM_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              onAnimationComplete={handleBeamComplete}
              style={{
                position: 'absolute',
                left: targetX - (isCritical ? 40 : 30),
                top: 0,
                width: isCritical ? 80 : 60,
                height: targetY,
                background: isCritical
                  ? `linear-gradient(to bottom,
                  #ffd700 0%,
                  ${HOLY_COLORS.accent}ff 20%,
                  ${HOLY_COLORS.primary}dd 40%,
                  ${HOLY_COLORS.secondary}bb 70%,
                  ${HOLY_COLORS.primary}dd 100%)`
                  : `linear-gradient(to bottom,
                  ${HOLY_COLORS.accent}ff 0%,
                  ${HOLY_COLORS.primary}dd 30%,
                  ${HOLY_COLORS.secondary}bb 70%,
                  ${HOLY_COLORS.primary}dd 100%)`,
                filter: `blur(${isCritical ? 8 : 6}px)`,
                transformOrigin: 'top',
                boxShadow: isCritical
                  ? `0 0 60px #ffd700, 0 0 40px ${HOLY_COLORS.primary}`
                  : `0 0 40px ${HOLY_COLORS.primary}`,
              }}
            />

            {/* Inner bright core */}
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{
                opacity: [0, 1, 0.9, 0.8],
                scaleY: [0, 1, 1, 1],
                transition: {
                  duration: BEAM_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 15,
                top: 0,
                width: 30,
                height: targetY,
                background: `linear-gradient(to bottom, ${HOLY_COLORS.accent}ff 0%, ${HOLY_COLORS.accent}cc 100%)`,
                filter: 'blur(3px)',
                transformOrigin: 'top',
              }}
            />

            {/* Outer beam glow */}
            <motion.div
              initial={{ opacity: 0, scaleY: 0, scaleX: 0 }}
              animate={{
                opacity: [0, 0.5, 0.4],
                scaleY: [0, 1, 1],
                scaleX: [0, 1.2, 1],
                transition: {
                  duration: BEAM_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 50,
                top: 0,
                width: 100,
                height: targetY,
                background: `linear-gradient(to bottom, ${HOLY_COLORS.primary}40 0%, ${HOLY_COLORS.secondary}20 100%)`,
                filter: 'blur(20px)',
                transformOrigin: 'top',
              }}
            />

            {/* Descending sparkles */}
            <motion.div
              initial={{ y: 0 }}
              animate={{
                y: targetY,
                transition: {
                  duration: BEAM_DURATION / 1000,
                  ease: 'linear',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX,
                top: 0,
                width: 0,
                height: 0,
              }}
            >
              <ParticleSystem
                originX={0}
                originY={0}
                particleCount={15}
                colors={[HOLY_COLORS.accent, HOLY_COLORS.primary, HOLY_COLORS.secondary]}
                spread={30}
                lifetime={BEAM_DURATION * 0.6}
                size={5}
                gravity={50}
                fadeOut={true}
              />
            </motion.div>

            {/* Pulsing light at top */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0, 1, 0.9, 0.8],
                scale: [0.8, 1.3, 1.2, 1.1],
                transition: {
                  duration: BEAM_DURATION / 1000,
                  ease: 'easeInOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 40,
                top: -50,
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${HOLY_COLORS.accent}ff 0%, ${HOLY_COLORS.primary}80 60%, transparent 90%)`,
                filter: 'blur(15px)',
              }}
            />

            {/* Target ground indicator */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.7, 0.8],
                scale: [0, 1.2, 1],
                transition: {
                  duration: BEAM_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 45,
                top: targetY - 10,
                width: 90,
                height: 20,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, ${HOLY_COLORS.primary}80 0%, ${HOLY_COLORS.secondary}40 60%, transparent 90%)`,
                filter: 'blur(8px)',
                transform: 'rotateX(70deg)',
              }}
            />
          </>
        )}

        {/* IMPACT PHASE: Radiant burst (150-200ms) */}
        {phase === 'impact' && (
          <>
            {/* Central radiant burst - enhanced for critical hits */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 1 * critMultiplier.glowOpacity, 0.7, 0],
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
                left: targetX - 60,
                top: targetY - 60,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: isCritical
                  ? `radial-gradient(circle, #ffd700 0%, ${HOLY_COLORS.accent}ff 20%, ${HOLY_COLORS.primary}dd 50%, ${HOLY_COLORS.secondary}80 70%, transparent 90%)`
                  : `radial-gradient(circle, ${HOLY_COLORS.accent}ff 0%, ${HOLY_COLORS.primary}dd 40%, ${HOLY_COLORS.secondary}80 70%, transparent 90%)`,
                filter: `blur(${isCritical ? 10 : 8}px)`,
              }}
            />

            {/* Radiant light rays */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
              <motion.div
                key={angle}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{
                  opacity: [0, 0.8, 0.6, 0],
                  scaleX: [0, 1, 1.2, 1],
                  transition: {
                    duration: IMPACT_DURATION / 1000,
                    ease: 'easeOut',
                  },
                }}
                style={{
                  position: 'absolute',
                  left: targetX,
                  top: targetY - 3,
                  width: 70,
                  height: 6,
                  background: `linear-gradient(to right, ${HOLY_COLORS.accent}ff 0%, ${HOLY_COLORS.primary}cc 50%, transparent 100%)`,
                  boxShadow: `0 0 10px ${HOLY_COLORS.accent}`,
                  transformOrigin: 'left center',
                  transform: `rotate(${angle}deg)`,
                  filter: 'blur(2px)',
                }}
              />
            ))}

            {/* Critical-only impact rings */}
            {isCritical && (
              <CriticalImpactRings
                targetX={targetX}
                targetY={targetY}
                color={HOLY_COLORS.accent}
                duration={IMPACT_DURATION}
              />
            )}

            {/* Golden sparkle burst - more for critical hits */}
            {validateParticleCount(
              Math.floor(28 * Math.min(critMultiplier.particleCount, 30 / 28)),
              'HolyBeamAnimation',
              'impact'
            )}
            <ParticleSystem
              originX={targetX}
              originY={targetY}
              particleCount={Math.floor(28 * Math.min(critMultiplier.particleCount, 30 / 28))}
              colors={[HOLY_COLORS.primary, HOLY_COLORS.secondary, HOLY_COLORS.accent]}
              spread={140}
              lifetime={IMPACT_DURATION}
              size={7}
              gravity={-20} // Slight upward float
              fadeOut={true}
            />

            {/* Divine shimmer ring */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0.8, 0.5, 0],
                scale: [0, 2.5, 3.5],
                transition: {
                  duration: IMPACT_DURATION / 1000,
                  ease: 'easeOut',
                },
              }}
              style={{
                position: 'absolute',
                left: targetX - 60,
                top: targetY - 60,
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: `3px solid ${HOLY_COLORS.accent}`,
                boxShadow: `0 0 30px ${HOLY_COLORS.primary}`,
              }}
            />

            {/* Ascending sparkles */}
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div
                key={`sparkle-${i}`}
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0.8, 0],
                  scale: [0, 1.2, 1, 0],
                  y: -80,
                  x: (Math.random() - 0.5) * 60,
                  transition: {
                    duration: IMPACT_DURATION / 1000,
                    delay: i * 0.02,
                    ease: 'easeOut',
                  },
                }}
                style={{
                  position: 'absolute',
                  left: targetX,
                  top: targetY,
                  fontSize: '16px',
                  color: HOLY_COLORS.accent,
                  textShadow: `0 0 10px ${HOLY_COLORS.primary}`,
                }}
              >
                ✨
              </motion.div>
            ))}

            {/* Screen flash effect (golden) - enhanced for critical hits */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.15 * critMultiplier.screenFlash, 0],
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
                  ? `linear-gradient(to bottom, #ffd700, ${HOLY_COLORS.accent}, ${HOLY_COLORS.primary})`
                  : HOLY_COLORS.primary,
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

HolyBeamAnimation.displayName = 'HolyBeamAnimation';
