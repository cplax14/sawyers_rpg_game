/**
 * Animation Registry
 *
 * Maps spell/attack IDs to their corresponding animation components with metadata.
 * This registry is used by AnimationController to select and render the correct
 * animation for any spell or attack in the game.
 *
 * Task 4.1-4.3: Animation Registry & Metadata
 */

import { ComponentType } from 'react';

// Import all animation components
import { MagicBoltAnimation } from './MagicBoltAnimation';
import { FireballAnimation } from './variants/FireballAnimation';
import { IceShardAnimation } from './variants/IceShardAnimation';
import { LightningAnimation } from './variants/LightningAnimation';
import { HealAnimation } from './variants/HealAnimation';
import { HolyBeamAnimation } from './variants/HolyBeamAnimation';
import { MeteorAnimation } from './variants/MeteorAnimation';
import { ProtectAnimation } from './variants/ProtectAnimation';
import { ShellAnimation } from './variants/ShellAnimation';
import { HasteAnimation } from './variants/HasteAnimation';

/**
 * Animation component props interface
 * All animation components must accept these props
 */
export interface AnimationComponentProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}

/**
 * Metadata for each animation entry
 */
export interface AnimationMetadata {
  /** Element type for visual theming */
  element?: 'fire' | 'ice' | 'lightning' | 'holy' | 'arcane' | 'nature' | 'neutral' | 'poison';

  /** Animation type category */
  type: 'projectile' | 'beam' | 'aoe' | 'buff' | 'heal' | 'debuff' | 'physical';

  /** The React component to render */
  component: ComponentType<AnimationComponentProps>;

  /** Optional description for debugging */
  description?: string;
}

/**
 * Main animation registry
 * Maps spell IDs (from public/data/spells.js) to animation components with metadata
 */
export const ATTACK_ANIMATION_MAP: Record<string, AnimationMetadata> = {
  // ================================================
  // OFFENSIVE MAGIC - Projectile Spells
  // ================================================

  // Magic Bolt - Default arcane attack (wizard level 1)
  magic_bolt: {
    element: 'arcane',
    type: 'projectile',
    component: MagicBoltAnimation,
    description: 'Basic arcane projectile attack'
  },

  // Fire - Fireball spell (wizard level 1)
  fire: {
    element: 'fire',
    type: 'projectile',
    component: FireballAnimation,
    description: 'Spinning fireball with explosive impact'
  },

  // Ice - Ice Shard spell (wizard level 1)
  ice: {
    element: 'ice',
    type: 'projectile',
    component: IceShardAnimation,
    description: 'Sharp crystalline ice shard with shatter effect'
  },

  // Thunder - Lightning spell (wizard level 5)
  thunder: {
    element: 'lightning',
    type: 'beam',
    component: LightningAnimation,
    description: 'Lightning bolt strike from sky'
  },

  // Holy - Divine light attack (paladin level 10)
  holy: {
    element: 'holy',
    type: 'beam',
    component: HolyBeamAnimation,
    description: 'Divine light beam smiting evil'
  },

  // ================================================
  // OFFENSIVE MAGIC - AOE Spells
  // ================================================

  // Meteor - Devastating meteor strike (wizard level 20)
  meteor: {
    element: 'fire',
    type: 'aoe',
    component: MeteorAnimation,
    description: 'Meteor falling from sky with massive impact'
  },

  // ================================================
  // HEALING SPELLS
  // ================================================

  // Heal - Basic healing spell
  heal: {
    element: 'holy',
    type: 'heal',
    component: HealAnimation,
    description: 'Healing light restoring health'
  },

  // ================================================
  // SUPPORT SPELLS - Buffs
  // ================================================

  // Protect - Defense boost (knight/paladin level 6)
  protect: {
    element: 'neutral',
    type: 'buff',
    component: ProtectAnimation,
    description: 'Protective barrier increasing defense'
  },

  // Shell - Magic defense boost (knight/paladin level 6)
  shell: {
    element: 'neutral',
    type: 'buff',
    component: ShellAnimation,
    description: 'Magical barrier increasing magic defense'
  },

  // Haste - Speed boost (rogue/ranger level 8)
  haste: {
    element: 'neutral',
    type: 'buff',
    component: HasteAnimation,
    description: 'Speed enhancement increasing attack frequency'
  }
};

/**
 * Get animation metadata for a spell/attack ID
 * Returns null if animation is not registered
 */
export function getAnimationMetadata(attackId: string): AnimationMetadata | null {
  return ATTACK_ANIMATION_MAP[attackId] || null;
}

/**
 * Check if an attack has a registered animation
 */
export function hasAnimation(attackId: string): boolean {
  return attackId in ATTACK_ANIMATION_MAP;
}

/**
 * Get all registered spell IDs
 */
export function getRegisteredSpells(): string[] {
  return Object.keys(ATTACK_ANIMATION_MAP);
}

/**
 * Get spells by element type
 */
export function getSpellsByElement(element: AnimationMetadata['element']): string[] {
  return Object.entries(ATTACK_ANIMATION_MAP)
    .filter(([, metadata]) => metadata.element === element)
    .map(([spellId]) => spellId);
}

/**
 * Get spells by animation type
 */
export function getSpellsByType(type: AnimationMetadata['type']): string[] {
  return Object.entries(ATTACK_ANIMATION_MAP)
    .filter(([, metadata]) => metadata.type === type)
    .map(([spellId]) => spellId);
}

/**
 * Default fallback animation (Magic Bolt)
 * Used when requested spell has no registered animation
 */
export const DEFAULT_ANIMATION: AnimationMetadata = {
  element: 'arcane',
  type: 'projectile',
  component: MagicBoltAnimation,
  description: 'Fallback animation for unmapped attacks'
};
