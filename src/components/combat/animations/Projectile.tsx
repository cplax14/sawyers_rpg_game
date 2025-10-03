/**
 * Projectile Component
 *
 * Reusable animated projectile for spell attacks
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ProjectileProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  size?: number;
  duration?: number;
  glowIntensity?: number;
  onComplete?: () => void;
}

export const Projectile: React.FC<ProjectileProps> = ({
  startX,
  startY,
  endX,
  endY,
  color,
  size = 12,
  duration = 600,
  glowIntensity = 1.0,
  onComplete
}) => {
  const glowColor = color;
  const glowSize = size * 2 * glowIntensity;

  return (
    <>
      {/* Main projectile */}
      <motion.div
        initial={{
          x: startX,
          y: startY,
          scale: 0,
          opacity: 0
        }}
        animate={{
          x: endX,
          y: endY,
          scale: 1,
          opacity: [0, 1, 1, 0]
        }}
        transition={{
          duration: duration / 1000,
          ease: "easeInOut",
          opacity: {
            times: [0, 0.1, 0.9, 1],
            duration: duration / 1000
          }
        }}
        onAnimationComplete={onComplete}
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: `0 0 ${glowSize}px ${glowColor}, 0 0 ${glowSize * 2}px ${glowColor}`,
          pointerEvents: 'none',
          zIndex: 101
        }}
      />

      {/* Trailing particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: startX,
            y: startY,
            scale: 0,
            opacity: 0
          }}
          animate={{
            x: endX,
            y: endY,
            scale: [0, 0.6, 0],
            opacity: [0, 0.8, 0]
          }}
          transition={{
            duration: duration / 1000,
            delay: i * 0.05,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: '50%',
            backgroundColor: glowColor,
            filter: 'blur(2px)',
            pointerEvents: 'none',
            zIndex: 100
          }}
        />
      ))}

      {/* Energy trail */}
      <motion.div
        initial={{
          x: startX,
          y: startY,
          scaleX: 0,
          opacity: 0
        }}
        animate={{
          x: [startX, endX],
          y: [startY, endY],
          scaleX: [0, 1, 0],
          opacity: [0, 0.4, 0]
        }}
        transition={{
          duration: duration / 1000,
          ease: "linear"
        }}
        style={{
          position: 'absolute',
          width: Math.sqrt(
            Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)
          ),
          height: 2,
          background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
          transformOrigin: 'left center',
          transform: `rotate(${Math.atan2(endY - startY, endX - startX)}rad)`,
          pointerEvents: 'none',
          zIndex: 99,
          filter: 'blur(1px)'
        }}
      />
    </>
  );
};
