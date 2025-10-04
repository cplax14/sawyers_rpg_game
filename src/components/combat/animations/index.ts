/**
 * Combat Animations - Barrel Export
 *
 * Centralized export for all combat animation components
 */

// Legacy animation components
export { MagicBoltAnimation } from './MagicBoltAnimation';
export { ChargeParticles } from './ChargeParticles';
export { Projectile } from './Projectile';
export { ImpactEffects } from './ImpactEffects';

// Core animation components
export { MeleeSlash } from './core/MeleeSlash';
export { AreaEffect } from './core/AreaEffect';
export { StatusOverlay } from './core/StatusOverlay';
export { BuffAura } from './core/BuffAura';
export { ParticleSystem, PARTICLE_PRESETS } from './core/ParticleSystem';

// Animation system
export { AnimationController } from './AnimationController';
export {
  getAnimationMetadata,
  hasAnimation,
  getRegisteredSpells,
  getSpellsByElement,
  getSpellsByType,
  DEFAULT_ANIMATION,
  ATTACK_ANIMATION_MAP
} from './animationRegistry';
export type { AnimationMetadata, AnimationComponentProps } from './animationRegistry';

// Type definitions
export * from './types';
