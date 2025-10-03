import React from 'react';
import { motion } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  lifetime: number;
  delay: number;
}

interface ParticleSystemProps {
  originX: number;
  originY: number;
  particleCount: number;
  colors: string[];
  spread: number;
  lifetime: number;
  size?: number;
  gravity?: number;
  fadeOut?: boolean;
  onComplete?: () => void;
}

/**
 * ParticleSystem - Enhanced particle generator component
 *
 * Creates a configurable particle emission system with physics-based motion
 * Used for spell effects, impacts, explosions, and ambient magical effects
 */
export const ParticleSystem: React.FC<ParticleSystemProps> = React.memo(({
  originX,
  originY,
  particleCount,
  colors,
  spread,
  lifetime,
  size = 6,
  gravity = 0,
  fadeOut = true,
  onComplete
}) => {
  // Generate particles with randomized properties
  const particles: Particle[] = React.useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      // Random angle for particle direction
      const angle = Math.random() * Math.PI * 2;

      // Random velocity magnitude within spread range
      const velocity = (Math.random() * 0.5 + 0.5) * spread;

      // Velocity components
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      // Random color from palette
      const color = colors[Math.floor(Math.random() * colors.length)];

      // Random size variation (80% to 120% of base size)
      const particleSize = size * (0.8 + Math.random() * 0.4);

      // Random lifetime variation (80% to 120% of base lifetime)
      const particleLifetime = lifetime * (0.8 + Math.random() * 0.4);

      // Stagger particle emission slightly
      const delay = (i / particleCount) * 0.1;

      return {
        id: i,
        x: 0,
        y: 0,
        vx,
        vy,
        color,
        size: particleSize,
        lifetime: particleLifetime,
        delay
      };
    });
  }, [particleCount, colors, spread, lifetime, size]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'absolute',
        left: originX,
        top: originY,
        width: 0,
        height: 0,
        pointerEvents: 'none',
        zIndex: 100
      }}
    >
      {particles.map((particle, index) => {
        // Calculate final position based on velocity and gravity
        const finalX = particle.vx * 100;
        const finalY = particle.vy * 100 + (gravity * particle.lifetime / 2);

        return (
          <motion.div
            key={particle.id}
            initial={{
              x: 0,
              y: 0,
              scale: 0,
              opacity: 0
            }}
            animate={{
              x: finalX,
              y: finalY,
              scale: fadeOut ? [0, 1, 1, 0] : [0, 1, 1],
              opacity: fadeOut ? [0, 1, 0.8, 0] : [0, 1, 1],
              transition: {
                duration: particle.lifetime / 1000,
                delay: particle.delay,
                ease: 'easeOut',
                times: fadeOut ? [0, 0.1, 0.7, 1] : [0, 0.2, 1]
              }
            }}
            onAnimationComplete={
              index === particles.length - 1 ? onComplete : undefined
            }
            style={{
              position: 'absolute',
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              background: particle.color,
              boxShadow: `0 0 ${particle.size * 1.5}px ${particle.color}`
            }}
          />
        );
      })}
    </motion.div>
  );
});

ParticleSystem.displayName = 'ParticleSystem';

/**
 * Preset particle configurations for common effects
 */
export const PARTICLE_PRESETS = {
  // Explosive burst (fast, wide spread)
  explosion: {
    particleCount: 25,
    spread: 150,
    lifetime: 800,
    size: 8,
    gravity: 50,
    fadeOut: true
  },

  // Magical sparkles (slow, gentle)
  sparkle: {
    particleCount: 15,
    spread: 80,
    lifetime: 1200,
    size: 4,
    gravity: -20, // Negative gravity = float upward
    fadeOut: true
  },

  // Impact debris (fast fall)
  debris: {
    particleCount: 20,
    spread: 100,
    lifetime: 1000,
    size: 6,
    gravity: 150,
    fadeOut: true
  },

  // Gathering energy (converging)
  gather: {
    particleCount: 12,
    spread: -80, // Negative spread = particles move inward
    lifetime: 600,
    size: 5,
    gravity: 0,
    fadeOut: false
  },

  // Ambient glow (minimal movement)
  ambient: {
    particleCount: 10,
    spread: 30,
    lifetime: 2000,
    size: 3,
    gravity: 0,
    fadeOut: true
  },

  // Fire embers (upward drift)
  embers: {
    particleCount: 18,
    spread: 60,
    lifetime: 1500,
    size: 4,
    gravity: -30,
    fadeOut: true
  },

  // Ice crystals (sharp, fast)
  crystals: {
    particleCount: 20,
    spread: 120,
    lifetime: 700,
    size: 5,
    gravity: 80,
    fadeOut: true
  },

  // Lightning sparks (erratic, fast)
  lightning: {
    particleCount: 15,
    spread: 100,
    lifetime: 400,
    size: 3,
    gravity: 0,
    fadeOut: true
  },

  // Healing light (gentle ascent)
  healing: {
    particleCount: 12,
    spread: 50,
    lifetime: 1400,
    size: 6,
    gravity: -40,
    fadeOut: true
  },

  // Poison bubbles (slow float)
  poison: {
    particleCount: 10,
    spread: 40,
    lifetime: 2000,
    size: 8,
    gravity: -15,
    fadeOut: true
  }
} as const;
