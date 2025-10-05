import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface DamageNumberProps {
  /** Damage value to display */
  damage: number;
  /** X position (center of target) */
  targetX: number;
  /** Y position (center of target) */
  targetY: number;
  /** Whether this is a critical hit (gold, larger, glowing) */
  isCritical?: boolean;
  /** Callback when animation completes */
  onComplete?: () => void;
}

/**
 * DamageNumber Component
 *
 * Displays animated damage numbers above the target when a spell hits.
 *
 * Animation timeline (1250ms total):
 * - Appear (150ms): Scale up + fade in from impact point
 * - Hold (1000ms): Stay visible at peak, slight float upward
 * - Disappear (100ms): Fade out
 *
 * Visual design:
 * - Normal hits: Red (#ff4444), medium size, simple
 * - Critical hits: Gold (#ffd700), 40% larger, glowing effect
 *
 * Timing philosophy:
 * The damage number appears at the PEAK of the impact phase, stays visible
 * for a full second so players can read it, then fades gracefully. This ensures
 * players always see the result of their action before any modal appears.
 */
export const DamageNumber: React.FC<DamageNumberProps> = React.memo(({
  damage,
  targetX,
  targetY,
  isCritical = false,
  onComplete
}) => {
  // Animation durations
  const APPEAR_DURATION = 150; // Scale up + fade in
  const HOLD_DURATION = 1000;   // Stay visible (1 full second as requested)
  const DISAPPEAR_DURATION = 100; // Fade out
  const TOTAL_DURATION = APPEAR_DURATION + HOLD_DURATION + DISAPPEAR_DURATION; // 1250ms

  // Trigger onComplete after total animation duration
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `🎯 [DamageNumber] Rendered:`,
        {
          damage,
          isCritical,
          position: { x: targetX, y: targetY },
          duration: `${TOTAL_DURATION}ms`
        }
      );
    }

    if (onComplete) {
      const timer = setTimeout(() => {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`✅ [DamageNumber] Animation complete for damage: ${damage}`);
        }
        onComplete();
      }, TOTAL_DURATION);
      return () => clearTimeout(timer);
    }
  }, [onComplete, TOTAL_DURATION, damage, isCritical, targetX, targetY]);

  // Visual styling based on critical hit
  const fontSize = isCritical ? '3.5rem' : '2.5rem'; // 40% larger for crits
  const color = isCritical ? '#ffd700' : '#ff4444'; // Gold vs red
  const textShadow = isCritical
    ? `0 0 20px #ffd700, 0 0 30px #ffaa00, 0 2px 4px rgba(0,0,0,0.8)` // Glowing gold
    : `0 2px 4px rgba(0,0,0,0.8), 0 0 8px ${color}`; // Simple red glow

  return (
    <motion.div
      initial={{
        opacity: 0,
        scale: 0.3,
        y: 0
      }}
      animate={{
        opacity: [0, 1, 1, 1, 0], // Fade in → hold → fade out
        scale: [0.3, 1.2, 1, 1, 0.9], // Bounce in → settle → slight shrink on exit
        y: [0, -10, -20, -30, -40], // Float upward throughout
        transition: {
          duration: TOTAL_DURATION / 1000,
          times: [
            0, // Start
            APPEAR_DURATION / TOTAL_DURATION, // End of appear
            (APPEAR_DURATION + HOLD_DURATION * 0.5) / TOTAL_DURATION, // Mid hold
            (APPEAR_DURATION + HOLD_DURATION) / TOTAL_DURATION, // End of hold
            1 // End
          ],
          ease: [0.4, 0, 0.2, 1] // Smooth easing
        }
      }}
      style={{
        position: 'absolute',
        left: targetX,
        top: targetY - 40, // Start 40px above target
        transform: 'translateX(-50%)', // Center horizontally
        fontSize,
        fontWeight: 'bold',
        color,
        textShadow,
        pointerEvents: 'none',
        zIndex: 150, // Above animations (which are z-index 100)
        userSelect: 'none',
        fontFamily: "'Press Start 2P', monospace, sans-serif" // Retro game font
      }}
    >
      {/* Critical hit indicator text */}
      {isCritical && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.1, 1, 0.8],
            transition: {
              duration: (APPEAR_DURATION + HOLD_DURATION * 0.3) / 1000,
              ease: 'easeOut'
            }
          }}
          style={{
            position: 'absolute',
            top: '-1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '1rem',
            color: '#ffd700',
            textShadow: '0 0 15px #ffd700, 0 0 25px #ffaa00',
            whiteSpace: 'nowrap'
          }}
        >
          CRITICAL!
        </motion.div>
      )}

      {/* Main damage number */}
      <div style={{ position: 'relative' }}>
        {damage}
      </div>

      {/* Critical hit burst effect */}
      {isCritical && (
        <>
          {/* Radial burst lines */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <motion.div
              key={`burst-${angle}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0, 1.5, 2],
                transition: {
                  duration: APPEAR_DURATION / 1000,
                  delay: i * 0.01,
                  ease: 'easeOut'
                }
              }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '3px',
                height: '40px',
                background: `linear-gradient(to bottom, #ffd700, transparent)`,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                transformOrigin: 'center 0',
                filter: 'blur(1px)'
              }}
            />
          ))}

          {/* Glowing ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.5, 2, 3],
              transition: {
                duration: (APPEAR_DURATION + HOLD_DURATION * 0.2) / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '100px',
              height: '100px',
              marginLeft: '-50px',
              marginTop: '-50px',
              borderRadius: '50%',
              border: '2px solid #ffd700',
              boxShadow: '0 0 20px #ffd700'
            }}
          />
        </>
      )}
    </motion.div>
  );
});

DamageNumber.displayName = 'DamageNumber';
