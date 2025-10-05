import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem, PARTICLE_PRESETS } from '../core/ParticleSystem';

// Heal color palette - soft, soothing greens
const HEAL_COLORS = {
  primary: '#8bc34a',    // Green
  secondary: '#c5e1a5',  // Light green
  accent: '#ffffff'      // White
};

interface HealAnimationProps {
  targetX: number;
  targetY: number;
  healAmount?: number;
  onComplete?: () => void;
}

/**
 * HealAnimation - Complete Heal spell animation
 *
 * Phase breakdown (1100ms total):
 * - Cast (400ms): Green particles gather in air above target
 * - Descend (300ms): Healing light falls gracefully onto target
 * - Absorption (300ms): Green glow envelops target, HP numbers rise
 * - Complete (100ms): Final sparkle effect, particles dissipate
 *
 * Visual characteristics:
 * - Primary color: #8bc34a (green)
 * - Secondary color: #c5e1a5 (light green)
 * - Particles: 20-25 during cast, continuous glow during absorption
 * - Special effects: Rising HP numbers, gentle pulsing glow, soothing visual feel
 *
 * Design principles:
 * - Gentle, non-aggressive motion (vs offensive spells)
 * - Soft glows and blurs (more than offensive magic)
 * - Upward/descending graceful movements
 * - Positive reinforcement through brightening effects
 * - No harsh flashes or screen shakes
 */
export const HealAnimation: React.FC<HealAnimationProps> = React.memo(({
  targetX,
  targetY,
  healAmount,
  onComplete
}) => {
  const [phase, setPhase] = useState<'cast' | 'descend' | 'absorption' | 'complete'>('cast');

  // Phase durations (ms)
  const CAST_DURATION = 800; // DOUBLED from 400ms for more anticipation
  const DESCEND_DURATION = 300;
  const ABSORPTION_DURATION = 300;
  const COMPLETE_DURATION = 100;

  // Gathering point above target
  const gatherY = targetY - 80;

  // Phase transition handlers
  const handleCastComplete = useCallback(() => {
    setPhase('descend');
  }, []);

  const handleDescendComplete = useCallback(() => {
    setPhase('absorption');
  }, []);

  const handleAbsorptionComplete = useCallback(() => {
    setPhase('complete');
  }, []);

  const handleCompleteComplete = useCallback(() => {
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
      {/* CAST PHASE: Particles gather above target (400ms) */}
      {phase === 'cast' && (
        <>
          {/* Gathering particles - rising upward */}
          <ParticleSystem
            originX={targetX}
            originY={gatherY}
            particleCount={22}
            colors={[HEAL_COLORS.primary, HEAL_COLORS.secondary, HEAL_COLORS.accent]}
            spread={-60} // Negative spread = particles converge inward
            lifetime={CAST_DURATION}
            size={6}
            gravity={-30} // Negative gravity = float upward
            fadeOut={false} // Don't fade, they'll transform into descending light
            onComplete={handleCastComplete}
          />

          {/* Gentle gathering glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: [0, 0.6, 0.8],
              scale: [0.3, 1, 1.2],
              transition: {
                duration: CAST_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 25,
              top: gatherY - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${HEAL_COLORS.secondary}60 0%, ${HEAL_COLORS.primary}30 50%, transparent 80%)`,
              filter: 'blur(12px)'
            }}
          />

          {/* Soft outer glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.4, 0.6],
              scale: [0.5, 1.2, 1.5],
              transition: {
                duration: CAST_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 40,
              top: gatherY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${HEAL_COLORS.primary}30 0%, transparent 70%)`,
              filter: 'blur(16px)'
            }}
          />
        </>
      )}

      {/* DESCEND PHASE: Healing light falls gracefully (300ms) */}
      {phase === 'descend' && (
        <>
          {/* Descending light beam */}
          <motion.div
            initial={{
              opacity: 0,
              scaleY: 0,
              transformOrigin: 'top center'
            }}
            animate={{
              opacity: [0, 0.8, 0.8, 0.6],
              scaleY: [0, 1, 1, 0.9],
              transition: {
                duration: DESCEND_DURATION / 1000,
                ease: 'easeInOut'
              }
            }}
            onAnimationComplete={handleDescendComplete}
            style={{
              position: 'absolute',
              left: targetX - 15,
              top: gatherY,
              width: 30,
              height: targetY - gatherY,
              background: `linear-gradient(to bottom,
                ${HEAL_COLORS.secondary}cc 0%,
                ${HEAL_COLORS.primary}99 50%,
                ${HEAL_COLORS.primary}66 100%
              )`,
              filter: 'blur(8px)',
              boxShadow: `0 0 30px ${HEAL_COLORS.primary}80`
            }}
          />

          {/* Descending particles alongside beam */}
          <motion.div
            initial={{ y: gatherY }}
            animate={{
              y: targetY,
              transition: {
                duration: DESCEND_DURATION / 1000,
                ease: 'easeInOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX,
              width: 0,
              height: 0
            }}
          >
            <ParticleSystem
              originX={0}
              originY={0}
              particleCount={12}
              colors={[HEAL_COLORS.secondary, HEAL_COLORS.accent]}
              spread={25}
              lifetime={DESCEND_DURATION * 0.8}
              size={4}
              gravity={10}
              fadeOut={true}
            />
          </motion.div>

          {/* Glow at gathering point */}
          <motion.div
            initial={{ opacity: 0.8, scale: 1.2 }}
            animate={{
              opacity: [0.8, 0.4, 0],
              scale: [1.2, 1, 0.8],
              transition: {
                duration: DESCEND_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 25,
              top: gatherY - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${HEAL_COLORS.accent}60 0%, ${HEAL_COLORS.secondary}40 40%, transparent 70%)`,
              filter: 'blur(15px)'
            }}
          />
        </>
      )}

      {/* ABSORPTION PHASE: Green glow envelops target, HP rises (300ms) */}
      {phase === 'absorption' && (
        <>
          {/* Pulsing healing aura around target */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.8, 0.9, 0.8, 0.6],
              scale: [0.5, 1.3, 1.1, 1.2, 1],
              transition: {
                duration: ABSORPTION_DURATION / 1000,
                ease: 'easeOut',
                times: [0, 0.3, 0.5, 0.7, 1] // Two gentle pulses
              }
            }}
            onAnimationComplete={handleAbsorptionComplete}
            style={{
              position: 'absolute',
              left: targetX - 50,
              top: targetY - 50,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${HEAL_COLORS.primary}50 0%, ${HEAL_COLORS.secondary}30 50%, transparent 80%)`,
              filter: 'blur(18px)',
              boxShadow: `0 0 40px ${HEAL_COLORS.primary}60`
            }}
          />

          {/* Inner bright core */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{
              opacity: [0, 0.9, 0.95, 0.9, 0.7],
              scale: [0.3, 1, 0.9, 1, 0.95],
              transition: {
                duration: ABSORPTION_DURATION / 1000,
                ease: 'easeOut',
                times: [0, 0.3, 0.5, 0.7, 1]
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 30,
              top: targetY - 30,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${HEAL_COLORS.accent}80 0%, ${HEAL_COLORS.secondary}60 40%, transparent 70%)`,
              filter: 'blur(10px)'
            }}
          />

          {/* Gentle surrounding particles */}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={15}
            colors={[HEAL_COLORS.secondary, HEAL_COLORS.accent]}
            spread={60}
            lifetime={ABSORPTION_DURATION}
            size={5}
            gravity={-20} // Gentle upward float
            fadeOut={true}
          />

          {/* HP restoration number (if healAmount provided) */}
          {healAmount && (
            <motion.div
              initial={{ opacity: 0, y: targetY, scale: 0.5 }}
              animate={{
                opacity: [0, 1, 1, 0.8, 0],
                y: [targetY, targetY - 60, targetY - 70, targetY - 75, targetY - 80],
                scale: [0.5, 1.2, 1, 1, 0.9],
                transition: {
                  duration: ABSORPTION_DURATION / 1000,
                  ease: 'easeOut'
                }
              }}
              style={{
                position: 'absolute',
                left: targetX - 40,
                top: 0,
                width: 80,
                textAlign: 'center',
                fontSize: '28px',
                fontWeight: 'bold',
                color: HEAL_COLORS.primary,
                textShadow: `
                  0 0 10px ${HEAL_COLORS.accent},
                  0 0 20px ${HEAL_COLORS.secondary},
                  2px 2px 4px rgba(0,0,0,0.5)
                `,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                userSelect: 'none'
              }}
            >
              +{healAmount}
            </motion.div>
          )}
        </>
      )}

      {/* COMPLETE PHASE: Final sparkle effect (100ms) */}
      {phase === 'complete' && (
        <>
          {/* Final sparkle burst */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.8, 1.5, 2],
              transition: {
                duration: COMPLETE_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            onAnimationComplete={handleCompleteComplete}
            style={{
              position: 'absolute',
              left: targetX - 35,
              top: targetY - 35,
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${HEAL_COLORS.accent}ff 0%, ${HEAL_COLORS.secondary}80 30%, transparent 70%)`,
              filter: 'blur(8px)'
            }}
          />

          {/* Quick sparkle particles */}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={10}
            colors={[HEAL_COLORS.accent, HEAL_COLORS.secondary]}
            spread={80}
            lifetime={COMPLETE_DURATION}
            size={4}
            gravity={0}
            fadeOut={true}
          />

          {/* Fading aura remnant */}
          <motion.div
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{
              opacity: [0.6, 0],
              scale: [1, 1.3],
              transition: {
                duration: COMPLETE_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 40,
              top: targetY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${HEAL_COLORS.primary}30 0%, transparent 70%)`,
              filter: 'blur(15px)'
            }}
          />
        </>
      )}
    </div>
  );
});

HealAnimation.displayName = 'HealAnimation';
