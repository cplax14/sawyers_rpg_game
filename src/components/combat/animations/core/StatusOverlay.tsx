import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusOverlayProps {
  statusType: 'poison' | 'sleep' | 'silence' | 'slow' | 'stun' | 'burn' | 'freeze';
  targetX: number;
  targetY: number;
  color: string;
  intensity?: number;
  isActive: boolean;
  onComplete?: () => void;
}

/**
 * StatusOverlay - Persistent status effect overlay component
 *
 * Displays visual indicators for status ailments on characters
 * Persists for the duration of the status effect without obscuring gameplay
 */
export const StatusOverlay: React.FC<StatusOverlayProps> = React.memo(
  ({ statusType, targetX, targetY, color, intensity = 0.6, isActive, onComplete }) => {
    // Get status-specific visual configuration
    const getStatusConfig = () => {
      switch (statusType) {
        case 'poison':
          return {
            particles: true,
            particleColor: color,
            pulseSpeed: 2,
            icon: '☠️',
            overlay: 'bubbles',
          };
        case 'sleep':
          return {
            particles: true,
            particleColor: color,
            pulseSpeed: 3,
            icon: '💤',
            overlay: 'zs',
          };
        case 'silence':
          return {
            particles: false,
            particleColor: color,
            pulseSpeed: 1.5,
            icon: '🔇',
            overlay: 'seal',
          };
        case 'slow':
          return {
            particles: true,
            particleColor: color,
            pulseSpeed: 4,
            icon: '🐌',
            overlay: 'drip',
          };
        case 'stun':
          return {
            particles: true,
            particleColor: color,
            pulseSpeed: 0.8,
            icon: '⭐',
            overlay: 'stars',
          };
        case 'burn':
          return {
            particles: true,
            particleColor: color,
            pulseSpeed: 1.2,
            icon: '🔥',
            overlay: 'flames',
          };
        case 'freeze':
          return {
            particles: true,
            particleColor: color,
            pulseSpeed: 0.5,
            icon: '❄️',
            overlay: 'frost',
          };
        default:
          return {
            particles: false,
            particleColor: color,
            pulseSpeed: 2,
            icon: '❓',
            overlay: 'none',
          };
      }
    };

    const config = getStatusConfig();

    // Generate floating particles
    const floatingParticles = config.particles
      ? Array.from({ length: 5 }, (_, i) => ({
          id: i,
          x: (Math.random() - 0.5) * 60,
          y: -20 - Math.random() * 40,
          delay: i * 0.3,
          duration: 2 + Math.random(),
        }))
      : [];

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
              zIndex: 101,
            }}
          >
            {/* Pulsing glow overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: [0, intensity, intensity * 0.6, intensity],
                scale: [0.8, 1, 1.1, 1],
                transition: {
                  duration: config.pulseSpeed,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{
                position: 'absolute',
                width: 80,
                height: 80,
                left: -40,
                top: -60,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
                filter: 'blur(8px)',
              }}
            />

            {/* Status icon indicator */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{
                opacity: [0, 1, 1],
                y: [-10, -50, -50],
                transition: {
                  duration: 0.5,
                  times: [0, 0.5, 1],
                },
              }}
              exit={{ opacity: 0, y: -60 }}
              style={{
                position: 'absolute',
                left: -15,
                fontSize: '30px',
                textShadow: `0 0 10px ${color}`,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
              }}
            >
              {config.icon}
            </motion.div>

            {/* Floating particles for certain statuses */}
            {config.particles &&
              floatingParticles.map(particle => (
                <motion.div
                  key={particle.id}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    x: particle.x,
                    y: particle.y,
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0.5],
                    transition: {
                      duration: particle.duration,
                      delay: particle.delay,
                      repeat: Infinity,
                      ease: 'easeOut',
                    },
                  }}
                  style={{
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: config.particleColor,
                    boxShadow: `0 0 6px ${config.particleColor}`,
                  }}
                />
              ))}

            {/* Status-specific overlay patterns */}
            {config.overlay === 'seal' && (
              <motion.div
                initial={{ opacity: 0, rotate: 0 }}
                animate={{
                  opacity: [0, 0.6, 0.6],
                  rotate: [0, 180, 180],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  width: 60,
                  height: 60,
                  left: -30,
                  top: -70,
                  border: `2px solid ${color}`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '70%',
                    height: 2,
                    background: color,
                    transform: 'rotate(45deg)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    width: '70%',
                    height: 2,
                    background: color,
                    transform: 'rotate(-45deg)',
                  }}
                />
              </motion.div>
            )}

            {config.overlay === 'stars' && (
              <>
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.2, 0],
                      rotate: [0, 360],
                      transition: {
                        duration: 1.5,
                        delay: i * 0.3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      },
                    }}
                    style={{
                      position: 'absolute',
                      left: -10 + i * 15,
                      top: -80 - i * 10,
                      fontSize: '20px',
                      color: color,
                    }}
                  >
                    ⭐
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);

StatusOverlay.displayName = 'StatusOverlay';
