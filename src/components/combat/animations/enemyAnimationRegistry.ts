/**
 * Enemy Animation Registry
 *
 * Maps enemy species to their attack animations with configuration.
 * Used by AnimationController to select and render the correct animation for enemy attacks.
 *
 * Covers all enemies from public/data/monsters.js
 */

import { ComponentType } from 'react';
import { AnimationComponentProps } from './animationRegistry';

// Import enemy animation components
import { EnemyProjectileAnimation, EnemyProjectileProps } from './enemy/EnemyProjectileAnimation';
import { EnemySwoopAnimation, EnemySwoopProps } from './enemy/EnemySwoopAnimation';
import { EnemyMeleeAnimation, EnemyMeleeProps } from './enemy/EnemyMeleeAnimation';
import { EnemyLungeAnimation, EnemyLungeProps } from './enemy/EnemyLungeAnimation';

/**
 * Enemy animation metadata with custom props
 */
export interface EnemyAnimationMetadata {
  /** The React component to render */
  component: ComponentType<AnimationComponentProps>;

  /** Custom props to pass to the animation component */
  props?: Partial<EnemyProjectileProps | EnemySwoopProps | EnemyMeleeProps | EnemyLungeProps>;

  /** Optional description for debugging */
  description?: string;
}

/**
 * Enemy Animation Registry
 * Maps enemy species IDs to animation configurations
 *
 * Organization by enemy type:
 * - SLIMES & BLOBS: Projectile (glob variant)
 * - HUMANOIDS: Melee (various weapons)
 * - BEASTS: Lunge (bite/claw variants)
 * - FLYING CREATURES: Swoop (talon/screech variants)
 * - MAGICAL CREATURES: Projectile (magic variants)
 * - GIANTS & GOLEMS: Melee (heavy weapons)
 * - UNDEAD: Melee/projectile mix
 */
export const ENEMY_ANIMATION_MAP: Record<string, EnemyAnimationMetadata> = {
  // ================================================
  // SLIMES & BLOBS - Projectile (glob)
  // ================================================

  slime: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'glob',
      colors: ['#4caf50', '#2e7d32'],
      trajectory: 'arc'
    },
    description: 'Green slime glob with splatter'
  },

  king_slime: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'glob',
      colors: ['#2196f3', '#1565c0'], // Blue for king
      trajectory: 'arc',
      size: 22 // Larger
    },
    description: 'Larger blue king slime glob'
  },

  gem_slime: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'glob',
      colors: ['#9c27b0', '#6a1b9a'], // Purple/gem colors
      trajectory: 'arc',
      size: 18
    },
    description: 'Gem slime with crystalline glob'
  },

  magma_slime: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'fire', // Fire variant for lava/magma
      colors: ['#ff6b00', '#ff0000'],
      trajectory: 'arc',
      size: 20
    },
    description: 'Magma slime with burning glob'
  },

  // ================================================
  // HUMANOID MELEE - Goblins, Orcs, Undead
  // ================================================

  goblin: {
    component: EnemyMeleeAnimation,
    props: {
      weaponType: 'club',
      swingPattern: 'overhead',
      colors: ['#8b4513', '#a0522d']
    },
    description: 'Goblin club smash'
  },

  hobgoblin: {
    component: EnemyMeleeAnimation,
    props: {
      weaponType: 'sword',
      swingPattern: 'horizontal',
      colors: ['#708090', '#778899']
    },
    description: 'Hobgoblin sword slash'
  },

  orc: {
    component: EnemyMeleeAnimation,
    props: {
      weaponType: 'axe',
      swingPattern: 'overhead',
      colors: ['#696969', '#808080'],
      speed: 0.8 // Slower, heavier
    },
    description: 'Orc heavy axe'
  },

  orc_warrior: {
    component: EnemyMeleeAnimation,
    props: {
      weaponType: 'axe',
      swingPattern: 'horizontal',
      colors: ['#696969', '#a0a0a0'],
      speed: 0.9
    },
    description: 'Orc warrior battle axe'
  },

  skeleton: {
    component: EnemyMeleeAnimation,
    props: {
      weaponType: 'bone',
      swingPattern: 'overhead',
      colors: ['#f5f5dc', '#fffaf0']
    },
    description: 'Skeleton bone club'
  },

  zombie: {
    component: EnemyMeleeAnimation,
    props: {
      weaponType: 'claw',
      swingPattern: 'horizontal',
      colors: ['#556b2f', '#6b8e23'],
      speed: 0.7 // Very slow
    },
    description: 'Zombie claw swipe'
  },

  // ================================================
  // BEASTS - Lunge attacks
  // ================================================

  wolf: {
    component: EnemyLungeAnimation,
    props: {
      variant: 'bite',
      colors: ['#ffffff', '#ff0000', '#8b0000'],
      speed: 1.2 // Fast
    },
    description: 'Wolf savage bite'
  },

  dire_wolf: {
    component: EnemyLungeAnimation,
    props: {
      variant: 'bite',
      colors: ['#4a4a4a', '#ff0000', '#8b0000'],
      creatureSize: 1.2,
      speed: 1.3 // Faster
    },
    description: 'Dire wolf powerful bite'
  },

  alpha_wolf: {
    component: EnemyLungeAnimation,
    props: {
      variant: 'bite',
      colors: ['#1a1a1a', '#ff0000', '#ff4500'],
      creatureSize: 1.4,
      speed: 1.4 // Fastest
    },
    description: 'Alpha wolf devastating bite'
  },

  wild_horse: {
    component: EnemyLungeAnimation,
    props: {
      variant: 'trample',
      colors: ['#8b4513', '#a0522d', '#d2691e'],
      creatureSize: 1.3
    },
    description: 'Wild horse trampling kick'
  },

  bear: {
    component: EnemyLungeAnimation,
    props: {
      variant: 'claw',
      colors: ['#8b4513', '#a0522d', '#d2691e'],
      creatureSize: 1.5,
      speed: 0.9 // Slower but powerful
    },
    description: 'Bear claw swipe'
  },

  // ================================================
  // FLYING CREATURES - Swoop attacks
  // ================================================

  hawk: {
    component: EnemySwoopAnimation,
    props: {
      variant: 'talon',
      trailColors: ['#8b4513', '#daa520', '#f4a460'],
      creatureSize: 0.9
    },
    description: 'Hawk talon dive'
  },

  eagle: {
    component: EnemySwoopAnimation,
    props: {
      variant: 'talon',
      trailColors: ['#8b4513', '#cd853f', '#daa520'],
      creatureSize: 1.1 // Larger than hawk
    },
    description: 'Eagle powerful talon strike'
  },

  bat: {
    component: EnemySwoopAnimation,
    props: {
      variant: 'screech',
      trailColors: ['#9370db', '#ba55d3', '#da70d6'],
      creatureSize: 0.7
    },
    description: 'Bat sonic screech'
  },

  vampire_bat: {
    component: EnemySwoopAnimation,
    props: {
      variant: 'screech',
      trailColors: ['#8b0000', '#9370db', '#ba55d3'],
      creatureSize: 0.8
    },
    description: 'Vampire bat life drain'
  },

  fire_bat: {
    component: EnemySwoopAnimation,
    props: {
      variant: 'flame',
      trailColors: ['#ff6b00', '#ff8c00', '#ffa500', '#ffff00'],
      creatureSize: 0.8
    },
    description: 'Fire bat flame dive'
  },

  wyvern: {
    component: EnemySwoopAnimation,
    props: {
      variant: 'talon',
      trailColors: ['#4a4a4a', '#696969', '#808080'],
      creatureSize: 1.5 // Large
    },
    description: 'Wyvern dive bomb'
  },

  dragon_whelp: {
    component: EnemySwoopAnimation,
    props: {
      variant: 'flame',
      trailColors: ['#ff6b00', '#ff0000', '#ffa500'],
      creatureSize: 1.3
    },
    description: 'Dragon whelp flame dive'
  },

  fire_drake: {
    component: EnemySwoopAnimation,
    props: {
      variant: 'flame',
      trailColors: ['#ff4500', '#ff6b00', '#ff8c00'],
      creatureSize: 1.6 // Very large
    },
    description: 'Fire drake devastating dive'
  },

  phoenix_chick: {
    component: EnemySwoopAnimation,
    props: {
      variant: 'flame',
      trailColors: ['#ffa500', '#ffff00', '#ff4500'],
      creatureSize: 1.0
    },
    description: 'Phoenix chick flame strike'
  },

  // ================================================
  // MAGICAL CREATURES - Projectile attacks
  // ================================================

  fire_sprite: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'fire',
      colors: ['#ff6b00', '#ff8c00'],
      trajectory: 'straight'
    },
    description: 'Fire sprite fireball'
  },

  ice_sprite: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'ice',
      colors: ['#00bfff', '#87ceeb'],
      trajectory: 'straight'
    },
    description: 'Ice sprite ice shard'
  },

  thunder_sprite: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'magic',
      colors: ['#ffff00', '#ffd700'],
      trajectory: 'straight'
    },
    description: 'Thunder sprite lightning bolt'
  },

  nature_sprite: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'magic',
      colors: ['#4caf50', '#8bc34a'],
      trajectory: 'arc'
    },
    description: 'Nature sprite nature magic'
  },

  fairy: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'magic',
      colors: ['#ff69b4', '#ffc0cb'],
      trajectory: 'arc',
      size: 12
    },
    description: 'Fairy magic dust'
  },

  // ================================================
  // EARTH/ROCK CREATURES - Rock throw
  // ================================================

  rock_lizard: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'rock',
      colors: ['#696969', '#808080'],
      trajectory: 'arc'
    },
    description: 'Rock lizard stone throw'
  },

  mountain_goat: {
    component: EnemyLungeAnimation,
    props: {
      variant: 'trample',
      colors: ['#d2b48c', '#daa520'],
      creatureSize: 1.1
    },
    description: 'Mountain goat ram attack'
  },

  // ================================================
  // GIANTS & GOLEMS - Heavy melee
  // ================================================

  cave_troll: {
    component: EnemyMeleeAnimation,
    props: {
      weaponType: 'club',
      swingPattern: 'slam',
      colors: ['#556b2f', '#6b8e23'],
      speed: 0.6 // Very slow, very heavy
    },
    description: 'Cave troll massive club slam'
  },

  lava_golem: {
    component: EnemyMeleeAnimation,
    props: {
      weaponType: 'fist',
      swingPattern: 'slam',
      colors: ['#ff6b00', '#ff0000'],
      speed: 0.7
    },
    description: 'Lava golem molten punch'
  },

  guardian_golem: {
    component: EnemyMeleeAnimation,
    props: {
      weaponType: 'fist',
      swingPattern: 'slam',
      colors: ['#708090', '#778899'],
      speed: 0.8
    },
    description: 'Guardian golem stone fist'
  },

  treant: {
    component: EnemyMeleeAnimation,
    props: {
      weaponType: 'club', // Branch/limb
      swingPattern: 'overhead',
      colors: ['#8b4513', '#2e7d32'],
      speed: 0.7
    },
    description: 'Treant branch slam'
  },

  // ================================================
  // SPECIAL/LEGENDARY - Unique attacks
  // ================================================

  ancient_dragon: {
    component: EnemySwoopAnimation,
    props: {
      variant: 'flame',
      trailColors: ['#ff0000', '#ff6b00', '#ffff00'],
      creatureSize: 2.0, // Massive
      impactColors: ['#ff0000', '#ff8c00']
    },
    description: 'Ancient dragon devastating flame dive'
  },

  unicorn: {
    component: EnemyLungeAnimation,
    props: {
      variant: 'pounce',
      colors: ['#ffffff', '#ffd700', '#ff69b4'],
      creatureSize: 1.3
    },
    description: 'Unicorn horn strike'
  },

  shadow_wraith: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'magic',
      colors: ['#4b0082', '#8b008b'],
      trajectory: 'straight',
      size: 16
    },
    description: 'Shadow wraith dark bolt'
  },

  ancient_spirit: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'magic',
      colors: ['#9370db', '#ba55d3'],
      trajectory: 'straight',
      size: 18
    },
    description: 'Ancient spirit ethereal blast'
  },

  crystal_spider: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'magic',
      colors: ['#00bfff', '#87ceeb'],
      trajectory: 'arc',
      size: 14
    },
    description: 'Crystal spider web shot'
  },

  // ================================================
  // SALAMANDERS & REPTILES
  // ================================================

  salamander: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'fire',
      colors: ['#ff6b00', '#ff0000'],
      trajectory: 'straight',
      size: 16
    },
    description: 'Salamander flame breath'
  },

  // ================================================
  // FALLBACK/DEFAULT
  // ================================================

  // Generic fallback for any unmapped enemies
  default: {
    component: EnemyProjectileAnimation,
    props: {
      variant: 'magic',
      colors: ['#8b5cf6', '#a78bfa'],
      trajectory: 'straight'
    },
    description: 'Generic enemy attack (fallback)'
  }
};

/**
 * Get enemy animation metadata by species ID
 * Returns default animation if species not found
 */
export function getEnemyAnimationMetadata(speciesId: string): EnemyAnimationMetadata {
  return ENEMY_ANIMATION_MAP[speciesId] || ENEMY_ANIMATION_MAP.default;
}

/**
 * Check if an enemy species has a registered animation
 */
export function hasEnemyAnimation(speciesId: string): boolean {
  return speciesId in ENEMY_ANIMATION_MAP;
}

/**
 * Get all registered enemy species IDs
 */
export function getRegisteredEnemies(): string[] {
  return Object.keys(ENEMY_ANIMATION_MAP).filter(key => key !== 'default');
}

/**
 * Get enemy animations by component type
 */
export function getEnemiesByAnimationType(
  animationType: 'projectile' | 'swoop' | 'melee' | 'lunge'
): string[] {
  const componentMap = {
    projectile: EnemyProjectileAnimation,
    swoop: EnemySwoopAnimation,
    melee: EnemyMeleeAnimation,
    lunge: EnemyLungeAnimation
  };

  const targetComponent = componentMap[animationType];

  return Object.entries(ENEMY_ANIMATION_MAP)
    .filter(([key, metadata]) => key !== 'default' && metadata.component === targetComponent)
    .map(([speciesId]) => speciesId);
}
