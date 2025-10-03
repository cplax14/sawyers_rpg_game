import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BuffAuraProps {
  targetX: number;
  targetY: number;
  auraColor: string;
  pulseSpeed: number;
  particles: boolean;
  intensity?: number;
  persistent?: boolean;
  isActive: boolean;
  onComplete?: () => void;
}

/**
 * BuffAura - Character aura effect component
 *
 * Displays persistent or temporary aura effects for buffs/enhancements
 * Subtle enough to not obscure gameplay while providing clear visual feedback
 */
export const BuffAura: React.FC<BuffAuraProps> = React.memo(({
  targetX,
  targetY,
  auraColor,
  pulseSpeed,
  particles,
  intensity = 0.5,
  persistent = true,
  isActive,
  onComplete
}) => {
  // Generate orbital particles if enabled
  const orbitalParticles = particles ? Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const radius = 50;
    return {
      id: i,
      angle,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }) : [];

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            left: targetX,
            top: targetY,
            width: 0,
            height: 0,
            pointerEvents: 'none',
            zIndex: 98
          }}
        >
          {/* Main pulsing aura glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: persistent
                ? [intensity * 0.3, intensity * 0.6, intensity * 0.3]
                : [0, intensity, intensity * 0.7, 0],
              scale: persistent
                ? [0.9, 1.1, 0.9]
                : [0.8, 1.2, 1, 0.8],
              transition: {
                duration: pulseSpeed,
                repeat: persistent ? Infinity : 0,
                ease: 'easeInOut'
              }
            }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
            style={{
              position: 'absolute',
              width: 100,
              height: 120,
              left: -50,
              top: -100,
              borderRadius: '50%',
              background: `radial-gradient(ellipse at center, ${auraColor}60 0%, ${auraColor}30 40%, transparent 70%)`,
              filter: 'blur(12px)'
            }}
          />

          {/* Inner core glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, intensity * 0.8, intensity * 0.5],
              scale: [0.6, 1, 0.8],
              transition: {
                duration: pulseSpeed * 0.8,
                repeat: persistent ? Infinity : 0,
                ease: 'easeInOut'
              }
            }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              width: 60,
              height: 80,
              left: -30,
              top: -80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${auraColor}80 0%, ${auraColor}40 50%, transparent 80%)`,
              filter: 'blur(6px)'
            }}
          />

          {/* Subtle shimmer ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, intensity * 0.4, 0],
              scale: [0.8, 1.3, 1.5],
              rotate: [0, 180, 360],
              transition: {
                duration: pulseSpeed * 1.5,
                repeat: persistent ? Infinity : 0,
                ease: 'linear'
              }
            }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              width: 80,
              height: 80,
              left: -40,
              top: -90,
              borderRadius: '50%',
              border: `1px solid ${auraColor}80`,
              boxShadow: `0 0 20px ${auraColor}40`
            }}
          />

          {/* Orbital particles */}
          {particles && orbitalParticles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: 0,
                y: -60,
                opacity: 0,
                scale: 0
              }}
              animate={{
                x: [0, particle.x, 0],
                y: [-60, particle.y - 60, -60],
                opacity: [0, 0.8, 0.8, 0],
                scale: [0, 1, 1, 0],
                transition: {
                  duration: pulseSpeed * 2,
                  repeat: persistent ? Infinity : 0,
                  delay: particle.id * (pulseSpeed / 8),
                  ease: 'easeInOut'
                }
              }}
              exit={{ opacity: 0, scale: 0 }}
              style={{
                position: 'absolute',
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: auraColor,
                boxShadow: `0 0 8px ${auraColor}`
              }}
            />
          ))}

          {/* Vertical light rays (subtle) */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{
              opacity: [0, intensity * 0.3, intensity * 0.2],
              scaleY: [0, 1, 0.8],
              transition: {
                duration: pulseSpeed * 1.2,
                repeat: persistent ? Infinity : 0,
                ease: 'easeOut'
              }
            }}
            exit={{ opacity: 0, scaleY: 0 }}
            style={{
              position: 'absolute',
              width: 2,
              height: 120,
              left: -1,
              top: -140,
              background: `linear-gradient(to bottom, ${auraColor}80 0%, transparent 100%)`,
              filter: 'blur(2px)',
              transformOrigin: 'bottom'
            }}
          />

          {/* Ground glow (shows buff is active on character) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: persistent
                ? [0, intensity * 0.4, intensity * 0.3]
                : [0, intensity * 0.5, 0],
              scale: [0.8, 1.2, 1],
              transition: {
                duration: pulseSpeed,
                repeat: persistent ? Infinity : 0,
                ease: 'easeInOut'
              }
            }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              width: 80,
              height: 20,
              left: -40,
              top: -10,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, ${auraColor}60 0%, transparent 70%)`,
              filter: 'blur(10px)',
              transform: 'rotateX(75deg)'
            }}
          />

          {/* Sparkle effects */}
          {particles && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`sparkle-${i}`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                    x: [(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 60],
                    y: [-80 - Math.random() * 40, -100 - Math.random() * 60],
                    transition: {
                      duration: pulseSpeed * 1.5,
                      repeat: persistent ? Infinity : 0,
                      delay: i * (pulseSpeed / 3) + Math.random() * 0.5,
                      ease: 'easeOut'
                    }
                  }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    fontSize: '12px',
                    color: auraColor,
                    textShadow: `0 0 8px ${auraColor}`
                  }}
                >
                  ✨
                </motion.div>
              ))}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

BuffAura.displayName = 'BuffAura';
