/**
 * ImpactEffects Component
 *
 * Displays impact flash, particles, and damage numbers on hit
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImpactConfig } from './types';

interface ImpactEffectsProps {
  config: ImpactConfig;
  isActive: boolean;
  onComplete?: () => void;
}

export const ImpactEffects: React.FC<ImpactEffectsProps> = ({
  config,
  isActive,
  onComplete
}) => {
  const {
    x,
    y,
    damage,
    isCritical = false,
    element = 'arcane'
  } = config;

  const elementColors = {
    arcane: { primary: '#8b5cf6', secondary: '#a78bfa' },
    fire: { primary: '#f59e0b', secondary: '#fbbf24' },
    ice: { primary: '#3b82f6', secondary: '#60a5fa' },
    lightning: { primary: '#eab308', secondary: '#facc15' }
  };

  const colors = elementColors[element];

  // Generate explosion particles
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    const distance = 40 + Math.random() * 20;

    return {
      id: i,
      offsetX: Math.cos(angle) * distance,
      offsetY: Math.sin(angle) * distance,
      delay: Math.random() * 0.1
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
        zIndex: 102
      }}
    >
      {/* Impact flash */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 1.5, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 0.3,
          ease: "easeOut"
        }}
        onAnimationComplete={onComplete}
        style={{
          position: 'absolute',
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: colors.primary,
          boxShadow: `0 0 40px ${colors.primary}`,
          left: -30,
          top: -30,
          filter: 'blur(4px)'
        }}
      />

      {/* Secondary flash ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: [0, 2, 0],
          opacity: [0, 0.6, 0]
        }}
        transition={{
          duration: 0.4,
          delay: 0.05,
          ease: "easeOut"
        }}
        style={{
          position: 'absolute',
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: `3px solid ${colors.secondary}`,
          left: -40,
          top: -40
        }}
      />

      {/* Explosion particles */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              x: 0,
              y: 0,
              scale: 1,
              opacity: 1
            }}
            animate={{
              x: particle.offsetX,
              y: particle.offsetY,
              scale: 0,
              opacity: 0
            }}
            transition={{
              duration: 0.5,
              delay: particle.delay,
              ease: "easeOut"
            }}
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: colors.secondary,
              boxShadow: `0 0 8px ${colors.secondary}`,
              left: -3,
              top: -3
            }}
          />
        ))}
      </AnimatePresence>

      {/* Damage number */}
      <motion.div
        initial={{
          y: 0,
          scale: 0,
          opacity: 0
        }}
        animate={{
          y: -80,
          scale: isCritical ? [0, 1.3, 1] : [0, 1],
          opacity: [0, 1, 1, 0]
        }}
        transition={{
          duration: 1.2,
          ease: "easeOut",
          opacity: {
            times: [0, 0.2, 0.8, 1],
            duration: 1.2
          }
        }}
        style={{
          position: 'absolute',
          left: -40,
          top: -20,
          fontSize: isCritical ? '2.5rem' : '2rem',
          fontWeight: 'bold',
          color: isCritical ? '#ff4444' : '#fff',
          textShadow: isCritical
            ? '0 0 10px #ff0000, 2px 2px 4px rgba(0,0,0,0.8)'
            : '2px 2px 4px rgba(0,0,0,0.8)',
          fontFamily: 'var(--font-heading)',
          minWidth: 80,
          textAlign: 'center'
        }}
      >
        {isCritical && (
          <div style={{ fontSize: '1rem', color: '#ff6666', marginBottom: -5 }}>
            CRITICAL!
          </div>
        )}
        {damage}
      </motion.div>

      {/* Critical hit sparkles */}
      {isCritical && (
        <>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 50;
            return (
              <motion.div
                key={`sparkle-${i}`}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 0
                }}
                animate={{
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180]
                }}
                transition={{
                  duration: 0.6,
                  delay: i * 0.05,
                  ease: "easeOut"
                }}
                style={{
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  left: -4,
                  top: -4
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(45deg, #ffff00, #ff4444)',
                    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                    filter: 'drop-shadow(0 0 4px #ff0000)'
                  }}
                />
              </motion.div>
            );
          })}
        </>
      )}
    </div>
  );
};
