import React from 'react';
import { motion } from 'framer-motion';

interface MeleeSlashProps {
  slashType: 'slash' | 'stab' | 'chop';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  duration: number;
  trailWidth?: number;
  onComplete?: () => void;
}

/**
 * MeleeSlash - Weapon trail effect component
 *
 * Displays a visual trail for melee weapon attacks with different patterns
 * based on slash type (diagonal slash, forward stab, overhead chop)
 */
export const MeleeSlash: React.FC<MeleeSlashProps> = React.memo(
  ({ slashType, startX, startY, endX, endY, color, duration, trailWidth = 4, onComplete }) => {
    // Calculate angle and distance for the slash
    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

    // Determine animation path based on slash type
    const getPathVariants = () => {
      switch (slashType) {
        case 'slash':
          // Diagonal arc slash
          return {
            initial: {
              opacity: 0,
              scale: 0,
              rotate: angle - 45,
            },
            animate: {
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.8],
              rotate: angle + 45,
              transition: {
                duration: duration / 1000,
                times: [0, 0.2, 0.7, 1],
                ease: 'easeOut',
              },
            },
          };

        case 'stab':
          // Forward thrust
          return {
            initial: {
              opacity: 0,
              scaleX: 0,
              x: startX,
              y: startY,
            },
            animate: {
              opacity: [0, 1, 1, 0],
              scaleX: [0, 1.5, 1, 0],
              x: endX,
              y: endY,
              transition: {
                duration: duration / 1000,
                times: [0, 0.3, 0.7, 1],
                ease: 'easeInOut',
              },
            },
          };

        case 'chop':
          // Overhead downward strike
          return {
            initial: {
              opacity: 0,
              scaleY: 0,
              rotate: angle - 90,
            },
            animate: {
              opacity: [0, 1, 1, 0],
              scaleY: [0, 1.3, 1, 0],
              rotate: angle,
              transition: {
                duration: duration / 1000,
                times: [0, 0.25, 0.6, 1],
                ease: [0.4, 0, 0.2, 1], // Custom easing for impact
              },
            },
          };

        default:
          return {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
          };
      }
    };

    const pathVariants = getPathVariants();

    return (
      <motion.div
        initial={pathVariants.initial}
        animate={pathVariants.animate}
        onAnimationComplete={onComplete}
        style={{
          position: 'absolute',
          left: slashType === 'stab' ? 0 : startX,
          top: slashType === 'stab' ? 0 : startY,
          width: slashType === 'stab' ? distance : distance * 0.8,
          height: trailWidth,
          background: `linear-gradient(90deg,
          transparent 0%,
          ${color} 20%,
          ${color} 80%,
          transparent 100%)`,
          boxShadow: `0 0 ${trailWidth * 2}px ${color},
                    0 0 ${trailWidth * 4}px ${color}`,
          transformOrigin: 'left center',
          pointerEvents: 'none',
          zIndex: 100,
          filter: 'blur(1px)',
        }}
      >
        {/* Additional glow effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.8, 0],
            scale: [0.8, 1.2, 0.8],
            transition: {
              duration: duration / 1000,
              times: [0, 0.5, 1],
              ease: 'easeInOut',
            },
          }}
          style={{
            position: 'absolute',
            width: '100%',
            height: trailWidth * 2,
            top: -trailWidth / 2,
            background: `radial-gradient(ellipse, ${color}40 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}
        />
      </motion.div>
    );
  }
);

MeleeSlash.displayName = 'MeleeSlash';
