/**
 * Animation Helper Utilities
 * Provides reusable functions for creating and managing animations with Framer Motion
 */

import { Transition, Variants, MotionValue } from 'framer-motion';
import {
  AnimationConfig,
  AnimationVariant,
  SpellElement,
  DamageType,
  ANIMATION_DURATIONS,
  ANIMATION_EASINGS,
  ANIMATION_PRESETS,
  AnimationPerformanceConfig,
  AnimationMetrics,
} from '../types/animations';

// ================================================
// ANIMATION CREATION HELPERS
// ================================================

/**
 * Creates a standardized transition configuration
 */
export function createTransition(config: Partial<AnimationConfig>): Transition {
  return {
    duration: config.duration || ANIMATION_DURATIONS.normal,
    ease: (config.ease as any) || ANIMATION_EASINGS.easeInOut, // Type assertion for easing
    delay: config.delay || 0,
    repeat: config.repeat || 0,
    repeatType: config.repeatType || 'loop',
    repeatDelay: config.repeatDelay || 0,
  };
}

/**
 * Creates animation variants with consistent timing
 */
export function createAnimationVariant(
  initial: Record<string, any>,
  animate: Record<string, any>,
  exit?: Record<string, any>,
  transition?: Partial<AnimationConfig>
): AnimationVariant {
  return {
    initial,
    animate,
    exit: exit || initial,
    transition: transition ? createTransition(transition) : undefined,
  };
}

/**
 * Creates a staggered animation for child elements
 */
export function createStaggeredAnimation(
  baseVariant: AnimationVariant,
  staggerDelay: number = 0.1
): Variants {
  return {
    hidden: baseVariant.initial,
    visible: {
      ...baseVariant.animate,
      transition: {
        ...baseVariant.transition,
        staggerChildren: staggerDelay,
      },
    },
  };
}

// ================================================
// COMBAT ANIMATION HELPERS
// ================================================

/**
 * Gets color configuration for spell elements
 */
export function getSpellElementColor(element: SpellElement): string {
  const colorMap: Record<SpellElement, string> = {
    fire: '#ff4444',
    ice: '#44aaff',
    lightning: '#ffff44',
    earth: '#88aa44',
    wind: '#aaffaa',
    water: '#4488ff',
    holy: '#ffffaa',
    dark: '#aa44aa',
    neutral: '#aaaaaa',
  };
  return colorMap[element];
}

/**
 * Gets damage number color based on damage type
 */
export function getDamageTypeColor(type: DamageType, isCritical: boolean = false): string {
  const baseColors: Record<DamageType, string> = {
    physical: '#ff6666',
    magical: '#6666ff',
    healing: '#66ff66',
    status: '#ffff66',
  };

  const color = baseColors[type];
  return isCritical ? '#ffaa00' : color; // Gold for critical hits
}

/**
 * Creates attack animation based on weapon type
 */
export function createAttackAnimation(weaponType: string): AnimationVariant {
  const attackAnimations: Record<string, AnimationVariant> = {
    sword: {
      initial: { rotate: -45, scale: 0.8, x: -20 },
      animate: {
        rotate: [0, 45, 0],
        scale: [1, 1.2, 1],
        x: [0, 20, 0],
      },
      transition: createTransition({
        duration: ANIMATION_DURATIONS.combat.attack,
        ease: ANIMATION_EASINGS.easeInOut,
      }),
    },
    bow: {
      initial: { x: -50, scale: 0.8 },
      animate: {
        x: [0, 30, 0],
        scale: [1, 1.1, 1],
      },
      transition: createTransition({
        duration: ANIMATION_DURATIONS.combat.attack,
        ease: ANIMATION_EASINGS.easeOut,
      }),
    },
    staff: {
      initial: { rotate: 0, scale: 1, y: 0 },
      animate: {
        rotate: [0, -10, 10, 0],
        scale: [1, 1.1, 1.1, 1],
        y: [0, -5, 0],
      },
      transition: createTransition({
        duration: ANIMATION_DURATIONS.combat.spell,
        ease: ANIMATION_EASINGS.easeInOut,
      }),
    },
  };

  return attackAnimations[weaponType] || attackAnimations.sword;
}

/**
 * Creates spell effect animation based on element
 */
export function createSpellEffectAnimation(
  element: SpellElement,
  intensity: string
): AnimationVariant {
  const intensityMultiplier =
    {
      low: 0.8,
      medium: 1.0,
      high: 1.3,
      critical: 1.6,
    }[intensity] || 1.0;

  const baseAnimations: Record<SpellElement, AnimationVariant> = {
    fire: {
      initial: { scale: 0, rotate: 0, opacity: 0 },
      animate: {
        scale: [0, 1.2 * intensityMultiplier, 1],
        rotate: [0, 180, 360],
        opacity: [0, 1, 0.8, 0],
      },
    },
    ice: {
      initial: { scale: 0, y: -20, opacity: 0 },
      animate: {
        scale: [0, 1.1 * intensityMultiplier, 1],
        y: [0, 0, 10],
        opacity: [0, 1, 0.6, 0],
      },
    },
    lightning: {
      initial: { scaleY: 0, scaleX: 1, opacity: 0 },
      animate: {
        scaleY: [0, 1.5 * intensityMultiplier, 0],
        scaleX: [1, 0.8, 1.2, 1],
        opacity: [0, 1, 1, 0],
      },
    },
    // Add more elements as needed
    earth: ANIMATION_PRESETS.spellCast,
    wind: ANIMATION_PRESETS.spellCast,
    water: ANIMATION_PRESETS.spellCast,
    holy: ANIMATION_PRESETS.spellCast,
    dark: ANIMATION_PRESETS.spellCast,
    neutral: ANIMATION_PRESETS.spellCast,
  };

  const animation = baseAnimations[element];
  return {
    ...animation,
    transition: createTransition({
      duration: ANIMATION_DURATIONS.combat.spell * intensityMultiplier,
      ease: ANIMATION_EASINGS.easeInOut,
    }),
  };
}

// ================================================
// UI ANIMATION HELPERS
// ================================================

/**
 * Creates responsive screen transition animation
 */
export function createScreenTransition(
  direction: 'in' | 'out',
  type: 'fade' | 'slide' | 'scale' = 'fade'
): AnimationVariant {
  const transitions = {
    fade:
      direction === 'in'
        ? ANIMATION_PRESETS.fadeIn
        : {
            initial: { opacity: 1 },
            animate: { opacity: 0 },
          },
    slide:
      direction === 'in'
        ? ANIMATION_PRESETS.slideInLeft
        : {
            initial: { x: 0, opacity: 1 },
            animate: { x: -100, opacity: 0 },
          },
    scale:
      direction === 'in'
        ? ANIMATION_PRESETS.fadeInScale
        : {
            initial: { scale: 1, opacity: 1 },
            animate: { scale: 0.8, opacity: 0 },
          },
  };

  return {
    ...transitions[type],
    transition: createTransition({
      duration: ANIMATION_DURATIONS.ui.transition,
      ease: ANIMATION_EASINGS.easeInOut,
    }),
  };
}

/**
 * Creates button interaction animations
 */
export function createButtonAnimations() {
  return {
    hover: {
      ...ANIMATION_PRESETS.buttonHover,
      transition: createTransition({
        duration: ANIMATION_DURATIONS.ui.hover,
        ease: ANIMATION_EASINGS.easeOut,
      }),
    },
    press: {
      ...ANIMATION_PRESETS.buttonPress,
      transition: createTransition({
        duration: ANIMATION_DURATIONS.ui.click,
        ease: ANIMATION_EASINGS.easeInOut,
      }),
    },
  };
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

/**
 * Checks if user prefers reduced motion
 */
export function shouldReduceMotion(): boolean {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

/**
 * Applies reduced motion settings to animation variant
 */
export function applyReducedMotion(variant: AnimationVariant): AnimationVariant {
  if (!shouldReduceMotion()) {
    return variant;
  }

  // For reduced motion, simplify animations
  return {
    initial: variant.initial,
    animate: {
      ...variant.animate,
      // Remove complex movements
      x: variant.animate.x ? 0 : variant.animate.x,
      y: variant.animate.y ? 0 : variant.animate.y,
      rotate: variant.animate.rotate ? 0 : variant.animate.rotate,
      scale: variant.animate.scale || 1,
    },
    exit: variant.exit,
    transition: variant.transition
      ? {
          ...variant.transition,
          duration: Math.min(variant.transition.duration || 0.3, 0.2),
        }
      : undefined,
  };
}

/**
 * Creates a spring animation configuration
 */
export function createSpringTransition(
  stiffness: number = 100,
  damping: number = 10,
  mass: number = 1
): Transition {
  return {
    type: 'spring',
    stiffness,
    damping,
    mass,
  };
}

/**
 * Interpolates between two values with easing
 */
export function interpolate(
  from: number,
  to: number,
  progress: number,
  _easing?: string // Prefixed with underscore to indicate unused parameter
): number {
  // Simple linear interpolation (can be extended with easing functions)
  return from + (to - from) * progress;
}

/**
 * Converts degrees to radians
 */
export function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Creates a random value within a range
 */
export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/**
 * Delays execution for animation sequencing
 */
export function animationDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ================================================
// PERFORMANCE HELPERS
// ================================================

/**
 * Creates performance-optimized animation configuration
 */
export function createPerformantAnimation(
  variant: AnimationVariant,
  config: Partial<AnimationPerformanceConfig> = {}
): AnimationVariant {
  const defaultConfig: AnimationPerformanceConfig = {
    enableReducedMotion: true,
    targetFPS: 60,
    skipFrames: 0,
    enableGPUAcceleration: true,
    maxConcurrentAnimations: 10,
  };

  const mergedConfig = { ...defaultConfig, ...config };

  let optimizedVariant = variant;

  // Apply reduced motion if enabled
  if (mergedConfig.enableReducedMotion) {
    optimizedVariant = applyReducedMotion(optimizedVariant);
  }

  // Add GPU acceleration hints
  if (mergedConfig.enableGPUAcceleration) {
    optimizedVariant = {
      ...optimizedVariant,
      animate: {
        ...optimizedVariant.animate,
        willChange: 'transform, opacity',
      },
    };
  }

  return optimizedVariant;
}
