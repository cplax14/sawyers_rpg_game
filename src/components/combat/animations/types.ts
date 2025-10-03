/**
 * Combat Animation Types and Constants
 *
 * Shared types and constants for all combat animations
 */

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

// Color schemes for different elements
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
