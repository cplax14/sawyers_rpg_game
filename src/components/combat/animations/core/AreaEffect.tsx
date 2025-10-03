import React from 'react';
import { motion } from 'framer-motion';

interface AreaEffectProps {
  centerX: number;
  centerY: number;
  radius: number;
  color: string;
  expandDuration: number;
  fadeDuration: number;
  particleCount?: number;
  onComplete?: () => void;
}

/**
 * AreaEffect - AOE spreading circle component
 *
 * Displays an expanding area-of-effect circle with optional particles
 * Used for AOE spells like Meteor, Earthquake, or area buffs
 */
export const AreaEffect: React.FC<AreaEffectProps> = React.memo(({
  centerX,
  centerY,
  radius,
  color,
  expandDuration,
  fadeDuration,
  particleCount = 20,
  onComplete
}) => {
  const totalDuration = expandDuration + fadeDuration;

  // Generate particle positions in a circle
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const angle = (i / particleCount) * Math.PI * 2;
    const distance = radius * 0.8;
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: (i / particleCount) * 0.2 // Stagger particle appearance
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onAnimationComplete={onComplete}
      style={{
        position: 'absolute',
        left: centerX,
        top: centerY,
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 99
      }}
    >
      {/* Main expanding circle */}
      <motion.div
        initial={{
          scale: 0,
          opacity: 0
        }}
        animate={{
          scale: [0, 1, 1],
          opacity: [0, 0.8, 0],
          transition: {
            duration: totalDuration / 1000,
            times: [0, expandDuration / totalDuration, 1],
            ease: 'easeOut'
          }
        }}
        style={{
          position: 'absolute',
          width: radius * 2,
          height: radius * 2,
          left: -radius,
          top: -radius,
          borderRadius: '50%',
          border: `3px solid ${color}`,
          boxShadow: `
            0 0 ${radius * 0.2}px ${color},
            inset 0 0 ${radius * 0.3}px ${color}40
          `
        }}
      />

      {/* Inner glow circle */}
      <motion.div
        initial={{
          scale: 0,
          opacity: 0
        }}
        animate={{
          scale: [0, 0.8, 0.8],
          opacity: [0, 0.6, 0],
          transition: {
            duration: totalDuration / 1000,
            times: [0, expandDuration / totalDuration, 1],
            ease: 'easeOut'
          }
        }}
        style={{
          position: 'absolute',
          width: radius * 2,
          height: radius * 2,
          left: -radius,
          top: -radius,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}60 0%, ${color}20 50%, transparent 80%)`
        }}
      />

      {/* Ground indicator ring (appears before expansion) */}
      <motion.div
        initial={{
          scale: 0.9,
          opacity: 0
        }}
        animate={{
          scale: [0.9, 1, 1],
          opacity: [0, 0.5, 0],
          transition: {
            duration: totalDuration / 1000,
            times: [0, 0.3, 1],
            ease: 'easeInOut'
          }
        }}
        style={{
          position: 'absolute',
          width: radius * 2,
          height: radius * 2,
          left: -radius,
          top: -radius,
          borderRadius: '50%',
          border: `2px dashed ${color}80`,
          transform: 'rotateX(60deg)', // Perspective to show on ground
          transformStyle: 'preserve-3d'
        }}
      />

      {/* Particles radiating outward */}
      {particles.map((particle, index) => (
        <motion.div
          key={index}
          initial={{
            x: 0,
            y: 0,
            scale: 0,
            opacity: 0
          }}
          animate={{
            x: particle.x,
            y: particle.y,
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
            transition: {
              duration: (expandDuration + fadeDuration * 0.5) / 1000,
              delay: particle.delay,
              ease: 'easeOut'
            }
          }}
          style={{
            position: 'absolute',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 8px ${color}`
          }}
        />
      ))}

      {/* Shockwave ring effect */}
      <motion.div
        initial={{
          scale: 0,
          opacity: 0
        }}
        animate={{
          scale: [0, 1.2],
          opacity: [0.8, 0],
          transition: {
            duration: expandDuration / 1000,
            ease: [0.4, 0, 0.2, 1] // Custom easing for impact
          }
        }}
        style={{
          position: 'absolute',
          width: radius * 2,
          height: radius * 2,
          left: -radius,
          top: -radius,
          borderRadius: '50%',
          border: `4px solid ${color}`,
          boxShadow: `0 0 ${radius * 0.4}px ${color}`
        }}
      />
    </motion.div>
  );
});

AreaEffect.displayName = 'AreaEffect';
