/**
 * Animation-specific TypeScript definitions
 * Defines types for Framer Motion animations and game-specific animation requirements
 */

import { Variants, Transition } from 'framer-motion';

// ================================================
// BASE ANIMATION TYPES
// ================================================

export interface AnimationConfig {
  duration: number;
  ease: string | number[];
  delay?: number;
  repeat?: number;
  repeatType?: 'loop' | 'reverse' | 'mirror';
  repeatDelay?: number;
}

export interface AnimationVariant {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Transition;
}

// ================================================
// COMBAT ANIMATION TYPES
// ================================================

export type AttackType = 'melee' | 'ranged' | 'spell' | 'special';
export type SpellElement =
  | 'fire'
  | 'ice'
  | 'lightning'
  | 'earth'
  | 'wind'
  | 'water'
  | 'holy'
  | 'dark'
  | 'neutral';
export type DamageType = 'physical' | 'magical' | 'healing' | 'status';

export interface AttackAnimationProps {
  attackType: AttackType;
  weaponType?: string;
  duration?: number;
  onComplete?: () => void;
  targetPosition?: { x: number; y: number };
}

export interface SpellEffectProps {
  element: SpellElement;
  intensity: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  targetPosition?: { x: number; y: number };
  casterPosition?: { x: number; y: number };
  onComplete?: () => void;
}

export interface DamageNumberProps {
  value: number;
  type: DamageType;
  isCritical?: boolean;
  position: { x: number; y: number };
  onComplete?: () => void;
}

export interface ParticleEffectProps {
  type: 'hit' | 'critical' | 'block' | 'dodge' | 'explosion' | 'sparkle';
  intensity: number;
  color?: string;
  position: { x: number; y: number };
  duration?: number;
  onComplete?: () => void;
}

// ================================================
// UI ANIMATION TYPES
// ================================================

export interface HealthBarAnimationProps {
  currentValue: number;
  maxValue: number;
  previousValue?: number;
  animationSpeed?: 'slow' | 'normal' | 'fast';
  color?: string;
  onComplete?: () => void;
}

export interface ScreenTransitionProps {
  direction: 'in' | 'out';
  type: 'fade' | 'slide' | 'scale' | 'rotate';
  duration?: number;
  onComplete?: () => void;
}

export interface UIElementAnimation {
  hover?: AnimationVariant;
  press?: AnimationVariant;
  focus?: AnimationVariant;
  disabled?: AnimationVariant;
}

// ================================================
// MONSTER ANIMATION TYPES
// ================================================

export interface MonsterCaptureProps {
  success: boolean;
  monsterType: string;
  captureDevice?: string;
  onComplete?: () => void;
}

export interface MonsterCardAnimationProps {
  isDragging?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  animationControls?: any; // Will be properly typed when AnimationControls is available
}

// ================================================
// PRESET ANIMATION VARIANTS
// ================================================

export const ANIMATION_PRESETS = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },

  fadeInScale: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
  },

  // Slide animations
  slideInLeft: {
    initial: { x: -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  },

  slideInRight: {
    initial: { x: 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 100, opacity: 0 },
  },

  // Combat specific
  attackSlash: {
    initial: { rotate: -45, scale: 0 },
    animate: { rotate: 45, scale: 1.2 },
    exit: { rotate: 135, scale: 0 },
  },

  spellCast: {
    initial: { scale: 0, rotate: 0 },
    animate: { scale: [0, 1.2, 1], rotate: [0, 180, 360] },
    exit: { scale: 0, opacity: 0 },
  },

  // UI interactions
  buttonHover: {
    initial: { scale: 1 },
    animate: { scale: 1.05 },
  },

  buttonPress: {
    initial: { scale: 1 },
    animate: { scale: 0.95 },
  },
} as const;

// ================================================
// ANIMATION TIMING CONSTANTS
// ================================================

export const ANIMATION_DURATIONS = {
  instant: 0,
  veryFast: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
  combat: {
    attack: 0.6,
    spell: 1.2,
    damage: 0.4,
    heal: 0.8,
    capture: 2.0,
  },
  ui: {
    hover: 0.2,
    click: 0.1,
    transition: 0.3,
    modal: 0.4,
  },
} as const;

export const ANIMATION_EASINGS = {
  linear: 'linear',
  easeIn: 'easeIn',
  easeOut: 'easeOut',
  easeInOut: 'easeInOut',
  // Custom easings
  bounce: [0.68, -0.55, 0.265, 1.55],
  elastic: [0.175, 0.885, 0.32, 1.275],
  back: [0.68, -0.55, 0.265, 1.55],
  anticipate: [0.22, 1, 0.36, 1],
} as const;

// ================================================
// ANIMATION STATE TYPES
// ================================================

export interface AnimationState {
  isPlaying: boolean;
  currentAnimation: string | null;
  queue: string[];
  controls: any | null; // Will be properly typed when AnimationControls is available
}

export interface AnimationQueueItem {
  id: string;
  animation: AnimationVariant;
  delay?: number;
  onComplete?: () => void;
}

// ================================================
// PERFORMANCE TYPES
// ================================================

export interface AnimationPerformanceConfig {
  enableReducedMotion: boolean;
  targetFPS: number;
  skipFrames: number;
  enableGPUAcceleration: boolean;
  maxConcurrentAnimations: number;
}

export interface AnimationMetrics {
  frameRate: number;
  droppedFrames: number;
  averageFrameTime: number;
  activeAnimations: number;
  memoryUsage?: number;
}
