import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface MissIndicatorProps {
  /** X position (center of target) */
  targetX: number;
  /** Y position (center of target) */
  targetY: number;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * MissIndicator Component
 *
 * Displays "MISS!" indicator when attacks/spells miss their target.
 *
 * Animation timeline (1200ms total):
 * - Appear (150ms): Diagonal swipe in from left, fade in + scale up
 * - Hold (850ms): Stay visible with slight rotation wobble
 * - Disappear (200ms): Swipe out to right, fade out
 *
 * Visual design:
 * - Cool gray/cyan color scheme (#e0e0e0 with cyan glow)
 * - Diagonal motion path (enters left, exits right)
 * - Motion streaks and particle trails
 * - Contrasts with warm damage numbers
 *
 * Timing philosophy:
 * The miss indicator appears at the same time as damage numbers would (impact moment),
 * stays visible long enough to clearly communicate the miss (~850ms readable time),
 * then swipes away diagonally. This ensures players never miss the "miss" message.
 */
export const MissIndicator: React.FC<MissIndicatorProps> = React.memo(
  ({ targetX, targetY, onComplete }) => {
    // Animation durations (matching design spec)
    const APPEAR_DURATION = 150; // Swipe in + fade in
    const HOLD_DURATION = 850; // Stay visible (readable time)
    const DISAPPEAR_DURATION = 200; // Swipe out + fade out
    const TOTAL_DURATION = APPEAR_DURATION + HOLD_DURATION + DISAPPEAR_DURATION; // 1200ms

    // Trigger onComplete after total animation duration
    useEffect(() => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`❌ [MissIndicator] Rendered:`, {
          position: { x: targetX, y: targetY },
          duration: `${TOTAL_DURATION}ms`,
        });
      }

      if (onComplete) {
        const timer = setTimeout(() => {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`✅ [MissIndicator] Animation complete`);
          }
          onComplete();
        }, TOTAL_DURATION);
        return () => clearTimeout(timer);
      }
    }, [onComplete, TOTAL_DURATION, targetX, targetY]);

    // Visual styling - cool colors to contrast with warm damage numbers
    const textColor = '#e0e0e0'; // Cool gray
    const glowColor = '#00e5ff'; // Cyan glow
    const textShadow = `
    0 0 20px ${glowColor},
    0 0 30px ${glowColor},
    0 0 40px ${glowColor},
    0 2px 4px rgba(0,0,0,0.8)
  `;

    return (
      <>
        {/* Main MISS text with diagonal swipe motion */}
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.5,
            x: -80, // Start off to the left
            y: 0,
            rotate: -15,
          }}
          animate={{
            opacity: [0, 1, 1, 1, 0], // Fade in → hold → fade out
            scale: [0.5, 1.2, 1.1, 1.1, 0.9], // Pop in → settle → slight shrink on exit
            x: [-80, 0, 0, 0, 100], // Swipe in from left → hold → swipe out to right
            y: [0, 0, 0, 0, -20], // Slight upward motion on exit
            rotate: [-15, 0, 2, -2, 15], // Rotation wobble during hold, angle out on exit
            transition: {
              duration: TOTAL_DURATION / 1000,
              times: [
                0, // Start
                APPEAR_DURATION / TOTAL_DURATION, // End of appear (150ms)
                (APPEAR_DURATION + HOLD_DURATION * 0.3) / TOTAL_DURATION, // Early hold
                (APPEAR_DURATION + HOLD_DURATION) / TOTAL_DURATION, // End of hold (1000ms)
                1, // End (1200ms)
              ],
              ease: [0.4, 0, 0.2, 1], // Smooth easing
            },
          }}
          style={{
            position: 'absolute',
            left: targetX,
            top: targetY - 40, // Position above target like damage numbers
            transform: 'translateX(-50%)', // Center horizontally
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: textColor,
            textShadow,
            pointerEvents: 'none',
            zIndex: 150, // Same as damage numbers - above animations
            userSelect: 'none',
            fontFamily: "'Press Start 2P', monospace, sans-serif", // Retro game font
            letterSpacing: '0.15em', // Slightly spaced out for emphasis
          }}
        >
          MISS!
        </motion.div>

        {/* Motion streak effect - trail behind the text */}
        <motion.div
          initial={{
            opacity: 0,
            scaleX: 0,
            x: -80,
          }}
          animate={{
            opacity: [0, 0.6, 0.4, 0.3, 0],
            scaleX: [0, 1.5, 1.2, 1, 0],
            x: [-80, -20, 0, 0, 80],
            transition: {
              duration: TOTAL_DURATION / 1000,
              times: [0, 0.125, 0.5, 0.83, 1],
              ease: 'easeOut',
            },
          }}
          style={{
            position: 'absolute',
            left: targetX - 60,
            top: targetY - 40,
            width: '120px',
            height: '3px',
            background: `linear-gradient(to right, transparent, ${glowColor}, transparent)`,
            transformOrigin: 'left center',
            filter: 'blur(2px)',
            pointerEvents: 'none',
            zIndex: 149, // Behind the text
          }}
        />

        {/* Particle trails - small dots that follow the motion */}
        {[0, 1, 2].map(index => (
          <motion.div
            key={`particle-${index}`}
            initial={{
              opacity: 0,
              scale: 0,
              x: -80 + index * 20,
              y: 0,
            }}
            animate={{
              opacity: [0, 0.8, 0.6, 0],
              scale: [0, 1, 0.8, 0],
              x: [-80 + index * 20, -20 + index * 15, 0 + index * 10, 80 + index * 20],
              y: [0, -5, -8, -15],
              transition: {
                duration: TOTAL_DURATION / 1000,
                delay: index * 0.03,
                times: [0, 0.25, 0.75, 1],
                ease: 'easeOut',
              },
            }}
            style={{
              position: 'absolute',
              left: targetX,
              top: targetY - 35,
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: glowColor,
              boxShadow: `0 0 10px ${glowColor}`,
              pointerEvents: 'none',
              zIndex: 149,
            }}
          />
        ))}

        {/* Cross/X mark effect that appears briefly */}
        <motion.div
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 0.8, 0.6, 0],
            scale: [0, 1.5, 1.3, 0.8],
            rotate: [0, 180, 360, 540],
            transition: {
              duration: (APPEAR_DURATION + HOLD_DURATION * 0.3) / 1000,
              ease: 'easeOut',
            },
          }}
          style={{
            position: 'absolute',
            left: targetX,
            top: targetY - 40,
            transform: 'translate(-50%, -50%)',
            fontSize: '3rem',
            color: glowColor,
            textShadow: `0 0 20px ${glowColor}`,
            pointerEvents: 'none',
            zIndex: 148,
            opacity: 0.6,
          }}
        >
          ✕
        </motion.div>
      </>
    );
  }
);

MissIndicator.displayName = 'MissIndicator';
