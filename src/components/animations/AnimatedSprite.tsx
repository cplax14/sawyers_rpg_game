import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimationPerformance, usePerformanceAwareAnimation } from '../../hooks/usePerformanceMonitor';
import type { AnimationVariant, SpellElement } from '../../types/animations';

export interface AnimatedSpriteProps {
  // Sprite properties
  src?: string;
  width: number;
  height: number;
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
  frameRate?: number;

  // Animation properties
  animation?: AnimationVariant;
  loop?: boolean;
  autoPlay?: boolean;

  // Position and rendering
  x?: number;
  y?: number;
  scale?: number;
  rotation?: number;
  opacity?: number;

  // Game-specific properties
  spellElement?: SpellElement;
  isWeapon?: boolean;
  weaponType?: string;

  // Performance options
  enablePerformanceOptimization?: boolean;
  maxFps?: number;

  // Event handlers
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  onFrameChange?: (frame: number) => void;

  // Style overrides
  className?: string;
  style?: React.CSSProperties;

  // Children for overlay content
  children?: React.ReactNode;
}

const AnimatedSprite: React.FC<AnimatedSpriteProps> = ({
  src,
  width,
  height,
  frameWidth = width,
  frameHeight = height,
  frameCount = 1,
  frameRate = 12,
  animation,
  loop = false,
  autoPlay = true,
  x = 0,
  y = 0,
  scale = 1,
  rotation = 0,
  opacity = 1,
  spellElement,
  isWeapon = false,
  weaponType,
  enablePerformanceOptimization = true,
  maxFps = 60,
  onAnimationStart,
  onAnimationComplete,
  onFrameChange,
  className = '',
  style = {},
  children
}) => {
  const spriteRef = useRef<HTMLDivElement>(null);
  const { startAnimation, endAnimation } = useAnimationPerformance();
  const { shouldReduceAnimations, getOptimalAnimationDuration, getOptimalAnimationQuality } = usePerformanceAwareAnimation();

  const animationId = useRef(`sprite-${Math.random().toString(36).substr(2, 9)}`);

  // Sprite sheet animation state
  const [currentFrame, setCurrentFrame] = React.useState(0);
  const frameInterval = useRef<NodeJS.Timeout>();

  // Calculate sprite sheet position
  const backgroundPosition = React.useMemo(() => {
    if (!src || frameCount <= 1) return 'center';

    const cols = Math.floor(width / frameWidth);
    const col = currentFrame % cols;
    const row = Math.floor(currentFrame / cols);

    return `-${col * frameWidth}px -${row * frameHeight}px`;
  }, [currentFrame, src, width, height, frameWidth, frameHeight, frameCount]);

  // Sprite sheet animation effect
  useEffect(() => {
    if (!autoPlay || frameCount <= 1 || !src) return;

    const interval = 1000 / frameRate;
    frameInterval.current = setInterval(() => {
      setCurrentFrame(prev => {
        const nextFrame = prev + 1;
        const newFrame = loop ? nextFrame % frameCount : Math.min(nextFrame, frameCount - 1);

        if (onFrameChange) {
          onFrameChange(newFrame);
        }

        // Stop animation if not looping and reached end
        if (!loop && nextFrame >= frameCount) {
          if (frameInterval.current) {
            clearInterval(frameInterval.current);
          }
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }

        return newFrame;
      });
    }, interval);

    return () => {
      if (frameInterval.current) {
        clearInterval(frameInterval.current);
      }
    };
  }, [autoPlay, frameCount, frameRate, loop, onFrameChange, onAnimationComplete, src]);

  // Performance monitoring
  useEffect(() => {
    if (!enablePerformanceOptimization) return;

    const complexity = frameCount > 1 ? 'medium' : 'low';
    startAnimation(animationId.current, 'sprite', complexity, 1);

    if (onAnimationStart) {
      onAnimationStart();
    }

    return () => {
      endAnimation(animationId.current);
    };
  }, []);

  // Performance-aware animation settings
  const optimizedAnimation = React.useMemo(() => {
    if (!animation || !enablePerformanceOptimization) return animation;

    const optimized = { ...animation };

    // Adjust duration based on performance
    if (optimized.animate && typeof optimized.animate === 'object' && 'transition' in optimized.animate) {
      const transition = optimized.animate.transition as any;
      if (transition?.duration) {
        transition.duration = getOptimalAnimationDuration(transition.duration);
      }
    }

    // Reduce complexity if needed
    if (shouldReduceAnimations) {
      // Simplify complex animations
      if (optimized.animate && typeof optimized.animate === 'object') {
        const animate = optimized.animate as any;
        // Remove complex transforms in low performance
        if (getOptimalAnimationQuality === 'low') {
          delete animate.filter;
          delete animate.backdropFilter;
          if (animate.scale && Array.isArray(animate.scale)) {
            animate.scale = animate.scale[animate.scale.length - 1]; // Just final value
          }
        }
      }
    }

    return optimized;
  }, [animation, enablePerformanceOptimization, getOptimalAnimationDuration, shouldReduceAnimations, getOptimalAnimationQuality]);

  const containerStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: y,
    width: frameWidth,
    height: frameHeight,
    transform: `scale(${scale}) rotate(${rotation}deg)`,
    opacity,
    transformOrigin: 'center',
    ...style
  };

  const spriteStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundImage: src ? `url(${src})` : undefined,
    backgroundPosition,
    backgroundRepeat: 'no-repeat',
    backgroundSize: `${width}px ${height}px`,
    imageRendering: 'pixelated', // For pixel art sprites
  };

  // Add spell element visual effects
  if (spellElement) {
    const elementColors = {
      fire: '#FF4444',
      water: '#4444FF',
      earth: '#44AA44',
      air: '#DDDD44',
      light: '#FFFFFF',
      dark: '#444444',
      arcane: '#AA44AA'
    };

    const elementColor = elementColors[spellElement];
    if (elementColor) {
      spriteStyle.filter = `drop-shadow(0 0 4px ${elementColor})`;
    }
  }

  const MotionDiv = motion.div;

  return (
    <MotionDiv
      ref={spriteRef}
      className={`animated-sprite ${className}`}
      style={containerStyle}
      {...optimizedAnimation}
      animate={optimizedAnimation?.animate}
      initial={optimizedAnimation?.initial}
      exit={optimizedAnimation?.exit}
      transition={optimizedAnimation?.transition}
      onAnimationStart={onAnimationStart}
      onAnimationComplete={onAnimationComplete}
    >
      <div style={spriteStyle} />
      {children}
    </MotionDiv>
  );
};

export default AnimatedSprite;