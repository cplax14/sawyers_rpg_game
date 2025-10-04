import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { AreaEffect } from '../core/AreaEffect';
import { FIRE_COLORS } from '../types';

interface MeteorAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}

/**
 * MeteorAnimation - Complete Meteor spell animation (AOE)
 *
 * Phase breakdown (1500ms total):
 * - Charge (600ms): Caster looks to sky, red glow appears overhead
 * - Warning (400ms): Shadow circles appear on ground (target indicators)
 * - Impact (300ms): Multiple meteors crash down simultaneously, explosions
 * - Aftermath (200ms): Dust clouds, crater effects, lingering particles
 *
 * Visual characteristics:
 * - Primary color: #ff4444 (red)
 * - Secondary color: #ffaa00 (orange)
 * - Particles: 30-40 total (distributed across multiple impact points)
 * - Special effects: Shadow indicators, screen shake on impact, multiple simultaneous effects
 */
export const MeteorAnimation: React.FC<MeteorAnimationProps> = React.memo(({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  const [phase, setPhase] = useState<'charge' | 'warning' | 'impact' | 'aftermath'>('charge');

  // Phase durations (ms)
  const CHARGE_DURATION = 600;
  const WARNING_DURATION = 400;
  const IMPACT_DURATION = 300;
  const AFTERMATH_DURATION = 200;

  // Generate meteor impact positions (3 meteors in AOE pattern)
  const meteorImpacts = [
    { x: targetX, y: targetY }, // Center
    { x: targetX - 60, y: targetY - 40 }, // Left
    { x: targetX + 50, y: targetY - 30 }  // Right
  ];

  // Phase transition handlers
  const handleChargeComplete = useCallback(() => {
    setPhase('warning');
  }, []);

  const handleWarningComplete = useCallback(() => {
    setPhase('impact');
  }, []);

  const handleImpactComplete = useCallback(() => {
    setPhase('aftermath');
  }, []);

  const handleAftermathComplete = useCallback(() => {
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
      {/* CHARGE PHASE: Caster summons, red glow in sky (600ms) */}
      {phase === 'charge' && (
        <>
          {/* Caster upward gesture glow */}
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{
              opacity: [0, 0.6, 0.8],
              y: [-50, -80, -100],
              transition: {
                duration: CHARGE_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            onAnimationComplete={handleChargeComplete}
            style={{
              position: 'absolute',
              left: casterX - 30,
              top: casterY,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${FIRE_COLORS.secondary}cc 0%, ${FIRE_COLORS.primary}80 50%, transparent 70%)`,
              filter: 'blur(12px)',
              boxShadow: `0 0 30px ${FIRE_COLORS.primary}`
            }}
          />

          {/* Rising energy particles */}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={15}
            colors={[FIRE_COLORS.primary, FIRE_COLORS.secondary]}
            spread={50}
            lifetime={CHARGE_DURATION}
            size={5}
            gravity={-60} // Float upward
            fadeOut={false}
          />

          {/* Red glow gathering in sky */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.3, 0.5, 0.7],
              scale: [0, 1, 1.3, 1.5],
              transition: {
                duration: CHARGE_DURATION / 1000,
                ease: 'easeIn'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 80,
              top: -100,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${FIRE_COLORS.primary}60 0%, ${FIRE_COLORS.secondary}40 50%, transparent 70%)`,
              filter: 'blur(25px)'
            }}
          />

          {/* Pulsing red cloud in sky */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.4, 0.5, 0.6],
              scale: [0.5, 1.2, 1.4, 1.6],
              transition: {
                duration: CHARGE_DURATION / 1000,
                ease: 'easeInOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 100,
              top: -80,
              width: 200,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, ${FIRE_COLORS.primary}50 0%, transparent 70%)`,
              filter: 'blur(30px)'
            }}
          />

          {/* Ominous rumble effect (pulsing glow at caster) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.3, 0.2, 0.4, 0.2, 0.5],
              transition: {
                duration: CHARGE_DURATION / 1000,
                ease: 'easeInOut'
              }
            }}
            style={{
              position: 'absolute',
              left: casterX - 40,
              top: casterY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${FIRE_COLORS.secondary}40 0%, transparent 70%)`,
              filter: 'blur(15px)'
            }}
          />
        </>
      )}

      {/* WARNING PHASE: Shadow circles on ground (400ms) */}
      {phase === 'warning' && (
        <>
          {/* Shadow target indicators for each meteor */}
          {meteorImpacts.map((impact, index) => (
            <motion.div
              key={`shadow-${index}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.6, 0.7, 0.8],
                scale: [0, 0.8, 1, 1.1],
                transition: {
                  duration: WARNING_DURATION / 1000,
                  delay: index * 0.08,
                  ease: 'easeOut'
                }
              }}
              onAnimationComplete={index === meteorImpacts.length - 1 ? handleWarningComplete : undefined}
              style={{
                position: 'absolute',
                left: impact.x - 45,
                top: impact.y - 15,
                width: 90,
                height: 30,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 80%)`,
                border: `2px dashed ${FIRE_COLORS.primary}`,
                filter: 'blur(3px)',
                transform: 'rotateX(70deg)'
              }}
            />
          ))}

          {/* Pulsing warning rings */}
          {meteorImpacts.map((impact, index) => (
            <motion.div
              key={`ring-${index}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: [0, 0.6, 0.4, 0.6, 0.4],
                scale: [0.5, 1.2, 1, 1.3, 1.1],
                transition: {
                  duration: WARNING_DURATION / 1000,
                  delay: index * 0.08,
                  ease: 'easeInOut'
                }
              }}
              style={{
                position: 'absolute',
                left: impact.x - 50,
                top: impact.y - 50,
                width: 100,
                height: 100,
                borderRadius: '50%',
                border: `2px solid ${FIRE_COLORS.primary}`,
                boxShadow: `0 0 15px ${FIRE_COLORS.primary}`
              }}
            />
          ))}

          {/* Intensifying sky glow */}
          <motion.div
            initial={{ opacity: 0.3, scale: 1.5 }}
            animate={{
              opacity: [0.3, 0.5, 0.7, 0.9],
              scale: [1.5, 1.7, 1.9, 2],
              transition: {
                duration: WARNING_DURATION / 1000,
                ease: 'easeIn'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 120,
              top: -120,
              width: 240,
              height: 240,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${FIRE_COLORS.primary}80 0%, ${FIRE_COLORS.secondary}60 40%, transparent 70%)`,
              filter: 'blur(30px)'
            }}
          />

          {/* Warning particles falling */}
          <ParticleSystem
            originX={targetX}
            originY={0}
            particleCount={12}
            colors={[FIRE_COLORS.primary, FIRE_COLORS.secondary]}
            spread={100}
            lifetime={WARNING_DURATION}
            size={4}
            gravity={200} // Fast fall
            fadeOut={true}
          />
        </>
      )}

      {/* IMPACT PHASE: Meteors crash (300ms) */}
      {phase === 'impact' && (
        <>
          {/* Meteor trails and impacts */}
          {meteorImpacts.map((impact, index) => (
            <React.Fragment key={`meteor-${index}`}>
              {/* Meteor falling trail */}
              <motion.div
                initial={{ y: -200, opacity: 0, scale: 0 }}
                animate={{
                  y: 0,
                  opacity: [0, 1, 1],
                  scale: [0, 1.5, 1.2],
                  transition: {
                    duration: IMPACT_DURATION / 1000 * 0.4,
                    delay: index * 0.05,
                    ease: [0.4, 0, 0.2, 1] // Fast easing for impact
                  }
                }}
                onAnimationComplete={index === meteorImpacts.length - 1 ? handleImpactComplete : undefined}
                style={{
                  position: 'absolute',
                  left: impact.x - 12,
                  top: impact.y - 12,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${FIRE_COLORS.accent} 0%, ${FIRE_COLORS.primary} 50%, ${FIRE_COLORS.secondary} 80%)`,
                  boxShadow: `0 0 30px ${FIRE_COLORS.primary}, 0 0 50px ${FIRE_COLORS.secondary}`
                }}
              />

              {/* Meteor flame trail */}
              <motion.div
                initial={{ scaleY: 0, opacity: 0 }}
                animate={{
                  scaleY: [0, 1, 0.8, 0],
                  opacity: [0, 0.8, 0.6, 0],
                  transition: {
                    duration: IMPACT_DURATION / 1000 * 0.5,
                    delay: index * 0.05,
                    ease: 'easeOut'
                  }
                }}
                style={{
                  position: 'absolute',
                  left: impact.x - 8,
                  top: impact.y - 150,
                  width: 16,
                  height: 150,
                  background: `linear-gradient(to bottom, transparent 0%, ${FIRE_COLORS.secondary}80 30%, ${FIRE_COLORS.primary}cc 100%)`,
                  filter: 'blur(6px)',
                  transformOrigin: 'bottom'
                }}
              />

              {/* Impact explosion */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0.8, 0],
                  scale: [0, 1.5, 2, 2.5],
                  transition: {
                    duration: IMPACT_DURATION / 1000,
                    delay: index * 0.05,
                    ease: 'easeOut'
                  }
                }}
                style={{
                  position: 'absolute',
                  left: impact.x - 50,
                  top: impact.y - 50,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${FIRE_COLORS.accent}ff 0%, ${FIRE_COLORS.primary}dd 40%, ${FIRE_COLORS.secondary}80 70%, transparent 90%)`,
                  filter: 'blur(10px)'
                }}
              />

              {/* Impact shockwave */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0.8, 0.5, 0],
                  scale: [0, 2, 3],
                  transition: {
                    duration: IMPACT_DURATION / 1000,
                    delay: index * 0.05,
                    ease: [0.4, 0, 0.2, 1]
                  }
                }}
                style={{
                  position: 'absolute',
                  left: impact.x - 60,
                  top: impact.y - 60,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  border: `4px solid ${FIRE_COLORS.primary}`,
                  boxShadow: `0 0 30px ${FIRE_COLORS.primary}`
                }}
              />

              {/* Explosion particles */}
              <ParticleSystem
                originX={impact.x}
                originY={impact.y}
                particleCount={12}
                colors={[FIRE_COLORS.primary, FIRE_COLORS.secondary, FIRE_COLORS.accent]}
                spread={130}
                lifetime={IMPACT_DURATION}
                size={7}
                gravity={100}
                fadeOut={true}
              />
            </React.Fragment>
          ))}

          {/* Overall AOE effect */}
          <AreaEffect
            centerX={targetX}
            centerY={targetY}
            radius={100}
            color={FIRE_COLORS.primary}
            expandDuration={IMPACT_DURATION * 0.6}
            fadeDuration={IMPACT_DURATION * 0.4}
            particleCount={0} // Using individual meteor particles instead
          />

          {/* Screen flash effect (red/orange) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.25, 0.15, 0],
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

      {/* AFTERMATH PHASE: Dust clouds and lingering effects (200ms) */}
      {phase === 'aftermath' && (
        <>
          {/* Dust clouds rising from each impact */}
          {meteorImpacts.map((impact, index) => (
            <React.Fragment key={`dust-${index}`}>
              {/* Rising dust cloud */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{
                  opacity: [0, 0.6, 0.4, 0],
                  scale: [0.5, 1.5, 2, 2.5],
                  y: [-20, -40, -60, -80],
                  transition: {
                    duration: AFTERMATH_DURATION / 1000,
                    delay: index * 0.04,
                    ease: 'easeOut'
                  }
                }}
                onAnimationComplete={index === meteorImpacts.length - 1 ? handleAftermathComplete : undefined}
                style={{
                  position: 'absolute',
                  left: impact.x - 40,
                  top: impact.y - 40,
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, rgba(100,100,100,0.6) 0%, rgba(80,80,80,0.3) 50%, transparent 70%)`,
                  filter: 'blur(12px)'
                }}
              />

              {/* Crater glow */}
              <motion.div
                initial={{ opacity: 0.7, scale: 1 }}
                animate={{
                  opacity: [0.7, 0.4, 0],
                  scale: [1, 1.2, 1.3],
                  transition: {
                    duration: AFTERMATH_DURATION / 1000,
                    delay: index * 0.04,
                    ease: 'easeOut'
                  }
                }}
                style={{
                  position: 'absolute',
                  left: impact.x - 35,
                  top: impact.y - 12,
                  width: 70,
                  height: 24,
                  borderRadius: '50%',
                  background: `radial-gradient(ellipse, ${FIRE_COLORS.secondary}80 0%, ${FIRE_COLORS.primary}40 50%, transparent 70%)`,
                  filter: 'blur(8px)',
                  transform: 'rotateX(70deg)'
                }}
              />

              {/* Lingering embers */}
              <ParticleSystem
                originX={impact.x}
                originY={impact.y}
                particleCount={6}
                colors={[FIRE_COLORS.secondary, FIRE_COLORS.primary]}
                spread={40}
                lifetime={AFTERMATH_DURATION}
                size={4}
                gravity={-30} // Float upward
                fadeOut={true}
              />
            </React.Fragment>
          ))}

          {/* Overall dissipating smoke */}
          <motion.div
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{
              opacity: [0.5, 0.3, 0],
              scale: [1, 1.8, 2.5],
              y: [-10, -30, -50],
              transition: {
                duration: AFTERMATH_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 80,
              top: targetY - 80,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(60,60,60,0.4) 0%, rgba(40,40,40,0.2) 50%, transparent 70%)',
              filter: 'blur(20px)'
            }}
          />
        </>
      )}
    </div>
  );
});

MeteorAnimation.displayName = 'MeteorAnimation';
