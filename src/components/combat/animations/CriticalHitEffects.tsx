/**
 * Critical Hit Effects
 * Task 7.7: Reusable components for enhanced critical hit visuals
 *
 * These components provide shared critical hit enhancements:
 * - Screen shake
 * - Impact rings
 * - Critical indicator text
 */

import React from 'react';
import { motion } from 'framer-motion';

interface CriticalHitFlashProps {
  targetX: number;
  targetY: number;
  color: string;
  duration: number;
}

/**
 * Screen shake effect for critical hits
 * Adds horizontal camera shake to emphasize impact
 */
export const CriticalScreenShake: React.FC<{ duration: number }> = React.memo(({ duration }) => {
  return (
    <motion.div
      initial={{ x: 0 }}
      animate={{
        x: [0, -4, 4, -3, 3, -2, 2, 0],
        transition: {
          duration: duration / 1000,
          ease: 'easeInOut',
        },
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
});

CriticalScreenShake.displayName = 'CriticalScreenShake';

/**
 * Enhanced flash rings for critical hits
 * Multiple expanding rings with gold/white accents
 */
export const CriticalImpactRings: React.FC<CriticalHitFlashProps> = React.memo(
  ({ targetX, targetY, color, duration }) => {
    return (
      <>
        {[0, 0.05, 0.1].map((delay, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.9, 0.5, 0],
              scale: [0, 2.5, 3.5],
              transition: {
                duration: duration / 1000,
                delay,
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
              border: `4px solid ${color}`,
              boxShadow: `0 0 30px ${color}, inset 0 0 20px ${color}`,
            }}
          />
        ))}
      </>
    );
  }
);

CriticalImpactRings.displayName = 'CriticalImpactRings';

/**
 * Critical hit indicator (floating text/effect)
 * Visual "CRITICAL!" indicator
 */
export const CriticalIndicator: React.FC<{ targetX: number; targetY: number }> = React.memo(
  ({ targetX, targetY }) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0, y: 0 }}
        animate={{
          opacity: [0, 1, 1, 0],
          scale: [0.5, 1.3, 1.2, 1],
          y: [0, -40, -50, -60],
          transition: {
            duration: 0.8,
            ease: 'easeOut',
          },
        }}
        style={{
          position: 'absolute',
          left: targetX,
          top: targetY - 80,
          transform: 'translateX(-50%)',
          fontSize: '1.4rem',
          fontWeight: 'bold',
          color: '#ffd700',
          textShadow: '0 0 10px #ff6b35, 0 0 20px #ff4444, 0 2px 4px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        CRITICAL!
      </motion.div>
    );
  }
);

CriticalIndicator.displayName = 'CriticalIndicator';
