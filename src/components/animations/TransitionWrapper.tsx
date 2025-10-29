import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformanceAwareAnimation } from '../../hooks/usePerformanceMonitor';
import type { AnimationVariant, TransitionType } from '../../types/animations';

export interface TransitionWrapperProps {
  // Animation properties
  transitionType?: TransitionType;
  customAnimation?: AnimationVariant;
  duration?: number;
  delay?: number;
  easing?: string;

  // Trigger conditions
  show?: boolean;
  trigger?: string | number; // Key that changes to trigger animation
  mode?: 'wait' | 'sync' | 'popLayout';

  // Performance options
  enablePerformanceOptimization?: boolean;
  reduceMotion?: boolean;

  // Layout options
  layout?: boolean;
  layoutId?: string;

  // Style and positioning
  className?: string;
  style?: React.CSSProperties;

  // Event handlers
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  onLayoutAnimationStart?: () => void;
  onLayoutAnimationComplete?: () => void;

  // Children
  children: React.ReactNode;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  transitionType = 'fade',
  customAnimation,
  duration = 0.3,
  delay = 0,
  easing = 'easeOut',
  show = true,
  trigger,
  mode = 'wait',
  enablePerformanceOptimization = true,
  reduceMotion,
  layout = false,
  layoutId,
  className = '',
  style = {},
  onAnimationStart,
  onAnimationComplete,
  onLayoutAnimationStart,
  onLayoutAnimationComplete,
  children,
}) => {
  const { shouldReduceAnimations, getOptimalAnimationDuration, getOptimalAnimationQuality } =
    usePerformanceAwareAnimation();

  // Built-in transition presets
  const transitionPresets: Record<TransitionType, AnimationVariant> = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { x: -100, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 100, opacity: 0 },
    },
    slideUp: {
      initial: { y: 100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -100, opacity: 0 },
    },
    slideDown: {
      initial: { y: -100, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 100, opacity: 0 },
    },
    scale: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.8, opacity: 0 },
    },
    scaleUp: {
      initial: { scale: 0, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0, opacity: 0 },
    },
    rotate: {
      initial: { rotate: -180, opacity: 0 },
      animate: { rotate: 0, opacity: 1 },
      exit: { rotate: 180, opacity: 0 },
    },
    flip: {
      initial: { rotateY: -90, opacity: 0 },
      animate: { rotateY: 0, opacity: 1 },
      exit: { rotateY: 90, opacity: 0 },
    },
  };

  // Determine which animation to use
  const animation = customAnimation || transitionPresets[transitionType];

  // Apply performance optimizations
  const optimizedAnimation = React.useMemo(() => {
    if (!enablePerformanceOptimization || !animation) return animation;

    const optimized = { ...animation };

    // Check for reduced motion preference
    const shouldReduce =
      reduceMotion ??
      (shouldReduceAnimations ||
        (typeof window !== 'undefined' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches));

    if (shouldReduce) {
      // Simplified animations for reduced motion
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };
    }

    // Adjust duration based on performance
    const optimizedDuration = getOptimalAnimationDuration(duration);

    // Create transition config
    const transition = {
      duration: optimizedDuration,
      delay,
      ease: easing as any,
    };

    // Apply quality optimizations
    if (getOptimalAnimationQuality === 'low') {
      // Remove complex transforms for low-end devices
      ['filter', 'backdropFilter', 'boxShadow'].forEach(prop => {
        if (optimized.initial && typeof optimized.initial === 'object') {
          delete (optimized.initial as any)[prop];
        }
        if (optimized.animate && typeof optimized.animate === 'object') {
          delete (optimized.animate as any)[prop];
        }
        if (optimized.exit && typeof optimized.exit === 'object') {
          delete (optimized.exit as any)[prop];
        }
      });
    }

    // Add transition to each state
    if (optimized.initial && typeof optimized.initial === 'object') {
      (optimized.initial as any).transition = transition;
    }
    if (optimized.animate && typeof optimized.animate === 'object') {
      (optimized.animate as any).transition = transition;
    }
    if (optimized.exit && typeof optimized.exit === 'object') {
      (optimized.exit as any).transition = transition;
    }

    return optimized;
  }, [
    animation,
    enablePerformanceOptimization,
    reduceMotion,
    shouldReduceAnimations,
    getOptimalAnimationDuration,
    getOptimalAnimationQuality,
    duration,
    delay,
    easing,
  ]);

  // Handle layout animations
  const layoutProps = layout
    ? {
        layout: true,
        layoutId,
        onLayoutAnimationStart,
        onLayoutAnimationComplete,
      }
    : {};

  const MotionDiv = motion.div;

  // If using trigger-based animation
  if (trigger !== undefined) {
    return (
      <AnimatePresence mode={mode}>
        <MotionDiv
          key={trigger}
          className={`transition-wrapper ${className}`}
          style={style}
          initial={optimizedAnimation?.initial}
          animate={optimizedAnimation?.animate}
          exit={optimizedAnimation?.exit}
          onAnimationStart={onAnimationStart}
          onAnimationComplete={onAnimationComplete}
          {...layoutProps}
        >
          {children}
        </MotionDiv>
      </AnimatePresence>
    );
  }

  // If using show/hide based animation
  return (
    <AnimatePresence mode={mode}>
      {show && (
        <MotionDiv
          className={`transition-wrapper ${className}`}
          style={style}
          initial={optimizedAnimation?.initial}
          animate={optimizedAnimation?.animate}
          exit={optimizedAnimation?.exit}
          onAnimationStart={onAnimationStart}
          onAnimationComplete={onAnimationComplete}
          {...layoutProps}
        >
          {children}
        </MotionDiv>
      )}
    </AnimatePresence>
  );
};

export default TransitionWrapper;
