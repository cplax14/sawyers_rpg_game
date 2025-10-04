/**
 * Combat Animation Types and Constants
 *
 * Shared types and constants for all combat animations
 * Task 5.10: Particle count validation
 */

// ================================================================
// PERFORMANCE VALIDATION
// Task 5.10: Enforce particle count limits
// ================================================================

/**
 * Maximum particle count per effect
 * Exceeding this will cause console errors in development
 */
const MAX_PARTICLES = 30;

/**
 * Recommended maximum particle count
 * Exceeding this will cause console warnings
 */
const RECOMMENDED_MAX_PARTICLES = 20;

/**
 * Validate particle count in development mode
 * Warns if particle count exceeds recommended maximum
 * Errors if particle count exceeds hard maximum
 *
 * @param count - Number of particles to create
 * @param componentName - Name of the animation component
 * @param phase - Optional animation phase (e.g., 'charge', 'impact')
 */
export const validateParticleCount = (
  count: number,
  componentName: string,
  phase?: string
): void => {
  if (process.env.NODE_ENV !== 'production') {
    const location = phase ? `${componentName} - ${phase}` : componentName;

    if (count > MAX_PARTICLES) {
      console.error(
        `🚨 [${location}] Particle count (${count}) EXCEEDS maximum (${MAX_PARTICLES}). ` +
        `This will cause performance issues! Reduce particle count immediately.`
      );
    } else if (count > RECOMMENDED_MAX_PARTICLES) {
      console.warn(
        `⚠️ [${location}] Particle count (${count}) exceeds recommended max (${RECOMMENDED_MAX_PARTICLES}). ` +
        `Consider reducing for better performance.`
      );
    }
  }
};

export interface AnimationTimings {
  charge: number;
  cast: number;
  travel: number;
  impact: number;
  total: number;
}

export interface ProjectileConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  glowColor: string;
  size?: number;
}

export interface ImpactConfig {
  x: number;
  y: number;
  damage: number;
  isCritical?: boolean;
  element?: 'fire' | 'ice' | 'lightning' | 'arcane';
}

export interface ParticleConfig {
  count: number;
  color: string;
  size: number;
  spread: number;
}

// New animation type interfaces
export interface MeleeAnimationConfig {
  slashType: 'slash' | 'stab' | 'chop';
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  duration: number;
  trailWidth?: number;
}

export interface AoeAnimationConfig {
  centerX: number;
  centerY: number;
  radius: number;
  color: string;
  expandDuration: number;
  fadeDuration: number;
  particleCount?: number;
}

export interface BuffAnimationConfig {
  targetX: number;
  targetY: number;
  auraColor: string;
  pulseSpeed: number;
  particles: boolean;
  intensity?: number;
  persistent?: boolean;
}

export interface DebuffAnimationConfig {
  targetX: number;
  targetY: number;
  statusType: 'poison' | 'sleep' | 'silence' | 'slow' | 'stun';
  color: string;
  duration: number;
  intensity?: number;
}

// Animation duration constants by attack weight
export const FAST_ATTACK_DURATION = 600;      // 400-600ms total (dagger, light spells)
export const MEDIUM_ATTACK_DURATION = 900;    // 600-1000ms total (sword, standard spells)
export const HEAVY_ATTACK_DURATION = 1400;    // 1000-1500ms total (axe, powerful spells)

// Magic Bolt specific timings
export const MAGIC_BOLT_TIMINGS: AnimationTimings = {
  charge: 400,
  cast: 200,
  travel: 600,
  impact: 200,
  total: 1400
};

// Animation spring configurations
export const SPRING_CONFIG = {
  smooth: {
    type: "spring" as const,
    stiffness: 100,
    damping: 15
  },
  bouncy: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20
  },
  stiff: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25
  }
};

// Element color palette constants (per PRD specifications)
export const FIRE_COLORS = {
  primary: '#ff6b35',    // Orange
  secondary: '#ff4444',  // Red
  accent: '#ffaa00'      // Yellow-orange
};

export const ICE_COLORS = {
  primary: '#4da6ff',    // Blue
  secondary: '#b3e0ff',  // Light blue
  accent: '#ffffff'      // White
};

export const LIGHTNING_COLORS = {
  primary: '#ffeb3b',    // Yellow
  secondary: '#fff176',  // Light yellow
  accent: '#ffffff'      // White
};

export const HOLY_COLORS = {
  primary: '#ffd700',    // Gold
  secondary: '#ffffcc',  // Light gold
  accent: '#ffffff'      // White
};

export const ARCANE_COLORS = {
  primary: '#9c27b0',    // Purple
  secondary: '#ba68c8',  // Light purple
  accent: '#4a148c'      // Dark purple
};

export const POISON_COLORS = {
  primary: '#8bc34a',    // Green
  secondary: '#33691e',  // Dark green
  accent: '#7b1fa2'      // Purple tint
};

// Legacy color schemes (kept for backward compatibility with existing Magic Bolt)
export const ELEMENT_COLORS = {
  arcane: {
    primary: '#8b5cf6',
    glow: '#a78bfa',
    particles: '#c4b5fd'
  },
  fire: {
    primary: '#f59e0b',
    glow: '#fbbf24',
    particles: '#fcd34d'
  },
  ice: {
    primary: '#3b82f6',
    glow: '#60a5fa',
    particles: '#93c5fd'
  },
  lightning: {
    primary: '#eab308',
    glow: '#facc15',
    particles: '#fde047'
  }
};
