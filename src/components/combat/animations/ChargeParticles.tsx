/**
 * ChargeParticles Component
 *
 * Displays magical particles during spell charge-up phase
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ParticleConfig } from './types';

interface ChargeParticlesProps {
  x: number;
  y: number;
  config?: Partial<ParticleConfig>;
  isActive: boolean;
}

const DEFAULT_CONFIG: ParticleConfig = {
  count: 8,
  color: '#8b5cf6',
  size: 4,
  spread: 40
};

export const ChargeParticles: React.FC<ChargeParticlesProps> = ({
  x,
  y,
  config,
  isActive
}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Generate particles in a circle around the charge point
  const particles = Array.from({ length: finalConfig.count }, (_, i) => {
    const angle = (i / finalConfig.count) * Math.PI * 2;
    const distance = finalConfig.spread;

    return {
      id: i,
      angle,
      offsetX: Math.cos(angle) * distance,
      offsetY: Math.sin(angle) * distance
    };
  });

  if (!isActive) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        pointerEvents: 'none',
        zIndex: 100
      }}
    >
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: particle.offsetX,
            y: particle.offsetY,
            scale: 0,
            opacity: 0
          }}
          animate={{
            x: [particle.offsetX, 0, particle.offsetX],
            y: [particle.offsetY, 0, particle.offsetY],
            scale: [0, 1, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: particle.id * 0.1,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            width: finalConfig.size,
            height: finalConfig.size,
            borderRadius: '50%',
            backgroundColor: finalConfig.color,
            boxShadow: `0 0 ${finalConfig.size * 2}px ${finalConfig.color}`,
            left: -finalConfig.size / 2,
            top: -finalConfig.size / 2
          }}
        />
      ))}

      {/* Central glow */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.2, 1],
          opacity: [0, 0.6, 0.8]
        }}
        transition={{
          duration: 0.4,
          ease: "easeOut"
        }}
        style={{
          position: 'absolute',
          width: 30,
          height: 30,
          borderRadius: '50%',
          backgroundColor: finalConfig.color,
          opacity: 0.3,
          filter: 'blur(8px)',
          left: -15,
          top: -15
        }}
      />
    </div>
  );
};
