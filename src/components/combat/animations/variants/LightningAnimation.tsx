import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { LIGHTNING_COLORS, validateParticleCount, CRITICAL_HIT_MULTIPLIERS } from '../types';
import { CriticalScreenShake, CriticalImpactRings, CriticalIndicator } from '../CriticalHitEffects';

interface LightningAnimationProps {
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
 * LightningAnimation - Complete Lightning Bolt spell animation
 *
 * Phase breakdown (900ms total):
 * - Charge (350ms): Electric sparks crackle around caster
 * - Cast (100ms): Caster points hand/staff upward
 * - Strike (200ms): Lightning bolt strikes from sky to target (instant visual travel)
 * - Impact (250ms): Electric burst at target, continuous electrical sparks
 *
 * Visual characteristics:
 * - Primary color: #ffeb3b (yellow)
 * - Secondary color: #fff176 (light yellow)
 * - Particles: 10-15 charge, 0 strike (bolt is instant), 20-25 impact
 * - Special effects: Jagged bolt path, lingering electric arcs at impact site
 */
export const LightningAnimation: React.FC<LightningAnimationProps> = React.memo(({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete,
  isCritical = false,
  damage,
  element
}) => {
  const [phase, setPhase] = useState<'charge' | 'cast' | 'strike' | 'impact'>('charge');

  // Apply critical hit multipliers
  const critMultiplier = isCritical ? CRITICAL_HIT_MULTIPLIERS : {
    particleCount: 1,
    scale: 1,
    glowOpacity: 1,
    screenFlash: 1,
    impactDuration: 1,
    shakeIntensity: 0
  };

  // Phase durations (ms) - extend impact for critical hits
  const CHARGE_DURATION = 700; // DOUBLED from 350ms for more anticipation
  const CAST_DURATION = 100;
  const STRIKE_DURATION = 200;
  const IMPACT_DURATION = isCritical ? 300 : 250; // +50ms for crits

  // Phase transition handlers
  const handleChargeComplete = useCallback(() => {
    setPhase('cast');
  }, []);

  const handleCastComplete = useCallback(() => {
    setPhase('strike');
  }, []);

  const handleStrikeComplete = useCallback(() => {
    setPhase('impact');
  }, []);

  const handleImpactComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  // Generate jagged lightning bolt path
  const generateLightningPath = () => {
    const segments = 8;
    const maxDeviation = 30;
    let path = `M ${targetX} 0`; // Start from top of screen

    const stepY = targetY / segments;
    let currentX = targetX;
    let currentY = 0;

    for (let i = 1; i <= segments; i++) {
      currentY += stepY;
      const deviation = (Math.random() - 0.5) * maxDeviation;
      currentX += deviation;
      path += ` L ${currentX} ${currentY}`;
    }

    return path;
  };

  const lightningPath = generateLightningPath();

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
      {/* CHARGE PHASE: Electric sparks around caster (350ms) */}
      {phase === 'charge' && (
        <>
          {/* Crackling electric sparks */}
          {validateParticleCount(12, 'LightningAnimation', 'charge')}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={12}
            colors={[LIGHTNING_COLORS.primary, LIGHTNING_COLORS.secondary, LIGHTNING_COLORS.accent]}
            spread={50}
            lifetime={CHARGE_DURATION}
            size={4}
            gravity={0}
            fadeOut={true}
            onComplete={handleChargeComplete}
          />

          {/* Electric aura pulsing */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0.6, 0.4, 0.6, 0.4, 0.7],
              scale: [0.8, 1.1, 0.9, 1.2, 1, 1.3],
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
              background: `radial-gradient(circle, ${LIGHTNING_COLORS.accent}80 0%, ${LIGHTNING_COLORS.primary}40 50%, transparent 70%)`,
              filter: 'blur(8px)',
              boxShadow: `0 0 25px ${LIGHTNING_COLORS.primary}`
            }}
          />

          {/* Erratic electric arcs */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{
                opacity: [0, 1, 0, 1, 0],
                scaleX: [0, 1, 0.5, 1, 0],
                transition: {
                  duration: CHARGE_DURATION / 1000,
                  delay: i * 0.08,
                  ease: 'linear'
                }
              }}
              style={{
                position: 'absolute',
                left: casterX,
                top: casterY - 5,
                width: 40,
                height: 2,
                background: LIGHTNING_COLORS.accent,
                boxShadow: `0 0 6px ${LIGHTNING_COLORS.accent}`,
                transformOrigin: 'left center',
                transform: `rotate(${i * 120}deg)`
              }}
            />
          ))}

          {/* Gathering energy glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.3, 0.5, 0.7],
              transition: {
                duration: CHARGE_DURATION / 1000,
                ease: 'easeIn'
              }
            }}
            style={{
              position: 'absolute',
              left: casterX - 20,
              top: casterY - 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: LIGHTNING_COLORS.accent,
              filter: 'blur(12px)'
            }}
          />
        </>
      )}

      {/* CAST PHASE: Point upward (100ms) */}
      {phase === 'cast' && (
        <>
          {/* Upward energy burst */}
          <motion.div
            initial={{ opacity: 0, y: 0, scaleY: 0 }}
            animate={{
              opacity: [0, 1, 0.8],
              y: -80,
              scaleY: [0, 1.5, 1],
              transition: {
                duration: CAST_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            onAnimationComplete={handleCastComplete}
            style={{
              position: 'absolute',
              left: casterX - 3,
              top: casterY,
              width: 6,
              height: 80,
              background: `linear-gradient(to top, ${LIGHTNING_COLORS.accent} 0%, ${LIGHTNING_COLORS.primary} 50%, transparent 100%)`,
              filter: 'blur(3px)',
              boxShadow: `0 0 15px ${LIGHTNING_COLORS.accent}`
            }}
          />

          {/* Flash at caster position */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 0.6],
              scale: [0.5, 1.5, 1.2],
              transition: {
                duration: CAST_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: casterX - 25,
              top: casterY - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: LIGHTNING_COLORS.accent,
              filter: 'blur(15px)'
            }}
          />

          {/* Upward sparks */}
          {validateParticleCount(8, 'LightningAnimation', 'cast')}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={8}
            colors={[LIGHTNING_COLORS.primary, LIGHTNING_COLORS.accent]}
            spread={40}
            lifetime={CAST_DURATION}
            size={4}
            gravity={-150} // Strong upward motion
            fadeOut={true}
          />
        </>
      )}

      {/* STRIKE PHASE: Lightning bolt from sky (200ms) */}
      {phase === 'strike' && (
        <>
          {/* Main jagged lightning bolt */}
          <svg
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {/* Primary bolt - thicker for critical hits */}
            <motion.path
              d={lightningPath}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: [0, 1 * critMultiplier.glowOpacity, 0.8],
                transition: {
                  duration: STRIKE_DURATION / 1000,
                  ease: 'linear'
                }
              }}
              onAnimationComplete={handleStrikeComplete}
              stroke={isCritical ? '#ffd700' : LIGHTNING_COLORS.accent}
              strokeWidth={isCritical ? 6 : 4}
              fill="none"
              filter={isCritical
                ? `drop-shadow(0 0 12px #ffd700) drop-shadow(0 0 16px ${LIGHTNING_COLORS.accent})`
                : `drop-shadow(0 0 8px ${LIGHTNING_COLORS.accent}) drop-shadow(0 0 12px ${LIGHTNING_COLORS.primary})`}
            />

            {/* Secondary thinner bolt (slight offset) */}
            <motion.path
              d={lightningPath}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: [0, 0.6, 0.4],
                transition: {
                  duration: STRIKE_DURATION / 1000,
                  delay: 0.02,
                  ease: 'linear'
                }
              }}
              stroke={LIGHTNING_COLORS.secondary}
              strokeWidth="2"
              fill="none"
              style={{ transform: 'translateX(3px)' }}
            />
          </svg>

          {/* Sky flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.3, 0.2, 0],
              transition: {
                duration: STRIKE_DURATION / 1000,
                ease: 'easeInOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 100,
              top: -50,
              width: 200,
              height: 150,
              background: `radial-gradient(ellipse, ${LIGHTNING_COLORS.accent}60 0%, transparent 70%)`,
              filter: 'blur(20px)'
            }}
          />

          {/* Strike point glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0.8],
              scale: [0, 1.5, 1.3],
              transition: {
                duration: STRIKE_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 30,
              top: targetY - 30,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: LIGHTNING_COLORS.accent,
              filter: 'blur(15px)'
            }}
          />
        </>
      )}

      {/* IMPACT PHASE: Electric burst and arcs (250-300ms) */}
      {phase === 'impact' && (
        <>
          {/* Central electric burst - enhanced for critical hits */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1 * critMultiplier.glowOpacity, 0.7, 0.5, 0],
              scale: [0, 1.2 * critMultiplier.scale, 1.5 * critMultiplier.scale, 1.8 * critMultiplier.scale, 2 * critMultiplier.scale],
              transition: {
                duration: IMPACT_DURATION / 1000,
                ease: 'easeOut'
              }
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
                ? `radial-gradient(circle, #ffd700 0%, ${LIGHTNING_COLORS.accent}ff 20%, ${LIGHTNING_COLORS.primary}cc 50%, ${LIGHTNING_COLORS.secondary}60 70%, transparent 90%)`
                : `radial-gradient(circle, ${LIGHTNING_COLORS.accent}ff 0%, ${LIGHTNING_COLORS.primary}cc 40%, ${LIGHTNING_COLORS.secondary}60 70%, transparent 90%)`,
              filter: `blur(${isCritical ? 8 : 6}px)`
            }}
          />

          {/* Electric arc bursts */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <motion.div
              key={angle}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{
                opacity: [0, 1, 0.8, 0.6, 0],
                scaleX: [0, 1, 1.2, 1, 0.8],
                transition: {
                  duration: IMPACT_DURATION / 1000,
                  delay: Math.random() * 0.05,
                  ease: 'easeOut'
                }
              }}
              style={{
                position: 'absolute',
                left: targetX,
                top: targetY - 2,
                width: 60,
                height: 4,
                background: `linear-gradient(to right, ${LIGHTNING_COLORS.accent} 0%, ${LIGHTNING_COLORS.primary} 50%, transparent 100%)`,
                boxShadow: `0 0 8px ${LIGHTNING_COLORS.accent}`,
                transformOrigin: 'left center',
                transform: `rotate(${angle}deg)`,
                filter: 'blur(1px)'
              }}
            />
          ))}

          {/* Critical-only impact rings */}
          {isCritical && (
            <CriticalImpactRings
              targetX={targetX}
              targetY={targetY}
              color={LIGHTNING_COLORS.accent}
              duration={IMPACT_DURATION}
            />
          )}

          {/* Crackling electric particles - more for critical hits */}
          {validateParticleCount(
            Math.floor(24 * Math.min(critMultiplier.particleCount, 30/24)),
            'LightningAnimation',
            'impact'
          )}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={Math.floor(24 * Math.min(critMultiplier.particleCount, 30/24))}
            colors={[LIGHTNING_COLORS.primary, LIGHTNING_COLORS.secondary, LIGHTNING_COLORS.accent]}
            spread={120}
            lifetime={IMPACT_DURATION}
            size={5}
            gravity={0}
            fadeOut={true}
          />

          {/* Lingering electric arcs (erratic) */}
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={`arc-${i}`}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 1, 0, 0.8, 0, 0.6, 0],
                x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60],
                y: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60],
                transition: {
                  duration: IMPACT_DURATION / 1000,
                  delay: i * 0.04,
                  ease: 'linear'
                }
              }}
              style={{
                position: 'absolute',
                left: targetX,
                top: targetY,
                width: 20,
                height: 2,
                background: LIGHTNING_COLORS.accent,
                boxShadow: `0 0 6px ${LIGHTNING_COLORS.accent}`,
                transform: `rotate(${Math.random() * 360}deg)`
              }}
            />
          ))}

          {/* Shockwave ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.8, 0.5, 0],
              scale: [0, 2, 3],
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
              border: `3px solid ${LIGHTNING_COLORS.primary}`,
              boxShadow: `0 0 20px ${LIGHTNING_COLORS.primary}`
            }}
          />

          {/* Screen flash effect (yellow) - enhanced for critical hits */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.2 * critMultiplier.screenFlash, 0.1, 0],
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
              background: isCritical
                ? `linear-gradient(to bottom, #ffd700, ${LIGHTNING_COLORS.accent}, ${LIGHTNING_COLORS.primary})`
                : LIGHTNING_COLORS.accent,
              pointerEvents: 'none',
              zIndex: 99
            }}
          />

          {/* Critical hit indicator */}
          {isCritical && (
            <CriticalIndicator targetX={targetX} targetY={targetY} />
          )}

          {/* Critical screen shake */}
          {isCritical && <CriticalScreenShake duration={IMPACT_DURATION} />}
        </>
      )}
    </div>
  );
});

LightningAnimation.displayName = 'LightningAnimation';
