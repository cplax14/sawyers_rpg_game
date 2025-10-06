/**
 * Creature Breeding System Type Definitions
 *
 * This file defines types for the instant breeding system that allows
 * players to combine any two creatures to create offspring with inherited
 * stats, abilities, and generation-based progression.
 *
 * Key Features:
 * - Instant breeding (no time delays)
 * - Generation system (Gen 0-5)
 * - Stat inheritance with bonuses
 * - Rarity upgrades (10% chance)
 * - Exhaustion mechanics
 * - Material-based advanced recipes
 */

import { EnhancedCreature, CreatureRarity } from './creatures';
import { PlayerStats } from './game';

// =============================================================================
// BREEDING RECIPES
// =============================================================================

/**
 * Defines a special breeding combination that requires specific parents
 * and optionally materials to produce guaranteed offspring with bonuses.
 */
export interface BreedingRecipe {
  /** Unique recipe identifier */
  id: string;

  /** Display name for the recipe */
  name: string;

  /** Description of the recipe and its effects */
  description: string;

  /** First parent species required (null for any species) */
  parentSpecies1: string | null;

  /** Second parent species required (null for any species) */
  parentSpecies2: string | null;

  /** Materials required for this recipe (empty array for basic breeding) */
  materials: BreedingMaterialRequirement[];

  /** Guaranteed offspring species (overrides random selection) */
  offspringSpecies: string;

  /** Guaranteed stat bonuses applied to offspring */
  guaranteedBonuses?: {
    /** Additional stat multiplier (e.g., 1.1 for +10% to all stats) */
    statMultiplier?: number;

    /** Guaranteed minimum rarity tier */
    minRarity?: CreatureRarity;

    /** Guaranteed abilities granted to offspring */
    guaranteedAbilities?: string[];

    /** Additional generation bonus beyond normal calculation */
    generationBonus?: number;
  };

  /** Requirements to unlock this recipe */
  unlockRequirements?: {
    /** Story flags required */
    storyFlags?: string[];

    /** Minimum player level */
    minPlayerLevel?: number;

    /** Specific creatures that must be owned */
    requiredCreatures?: string[];
  };

  /** Whether this recipe has been discovered by the player */
  discovered?: boolean;

  /** Hint text shown for undiscovered recipes */
  hint?: string;
}

/**
 * Material requirement for a breeding recipe
 */
export interface BreedingMaterialRequirement {
  /** Item ID of the material */
  itemId: string;

  /** Quantity required */
  quantity: number;

  /** Display name of material */
  name: string;
}

// =============================================================================
// BREEDING COSTS
// =============================================================================

/**
 * Calculated cost for a breeding attempt
 */
export interface BreedingCost {
  /** Total gold cost */
  goldAmount: number;

  /** Breakdown of cost calculation for display */
  costBreakdown: {
    /** Base cost before multipliers */
    baseCost: number;

    /** Multiplier from parent rarity */
    rarityMultiplier: number;

    /** Multiplier from parent generation */
    generationMultiplier: number;

    /** Multiplier from parent breeding counts */
    breedingCountMultiplier: number;

    /** Final calculated gold cost */
    totalGold: number;
  };

  /** Materials required (from recipe or empty) */
  materials: BreedingMaterialRequirement[];

  /** Whether the player can afford this cost */
  canAfford?: boolean;

  /** Missing resources preventing breeding */
  missingResources?: {
    goldShortfall?: number;
    missingMaterials?: BreedingMaterialRequirement[];
  };
}

// =============================================================================
// BREEDING RESULTS
// =============================================================================

/**
 * Result of a breeding attempt
 */
export interface BreedingResult {
  /** Whether breeding was successful */
  success: boolean;

  /** The newly created offspring creature */
  offspring?: EnhancedCreature;

  /** Messages to display to player */
  messages: string[];

  /** Abilities inherited from parents */
  inheritedAbilities: string[];

  /** Whether a rarity upgrade occurred */
  rarityUpgraded: boolean;

  /** The generation of the offspring */
  generation: number;

  /** Species of the offspring */
  offspringSpecies: string;

  /** Cost that was consumed */
  costPaid: BreedingCost;

  /** Recipe that was used (if any) */
  recipeUsed?: BreedingRecipe;

  /** Error message if breeding failed */
  error?: string;
}

// =============================================================================
// BREEDING ATTEMPTS
// =============================================================================

/**
 * Tracks a single breeding attempt for history/statistics
 */
export interface BreedingAttempt {
  /** Unique identifier for this attempt */
  id: string;

  /** Timestamp of the breeding */
  timestamp: Date;

  /** ID of first parent creature */
  parent1Id: string;

  /** ID of second parent creature */
  parent2Id: string;

  /** Species of parent 1 */
  parent1Species: string;

  /** Species of parent 2 */
  parent2Species: string;

  /** Cost paid for this breeding */
  cost: BreedingCost;

  /** Result of the breeding */
  result: BreedingResult;

  /** Recipe used (if any) */
  recipeId?: string;
}

// =============================================================================
// BREEDING MATERIALS
// =============================================================================

/**
 * Defines a breeding material item
 */
export interface BreedingMaterial {
  /** Unique material identifier */
  id: string;

  /** Display name */
  name: string;

  /** Material description */
  description: string;

  /** Rarity tier */
  rarity: CreatureRarity;

  /** Drop rate percentage (0-100) */
  dropRate: number;

  /** Icon/sprite identifier */
  icon: string;

  /** Gold value for selling */
  value: number;

  /** Which monsters drop this material */
  droppedBy: string[];

  /** Stack limit in inventory */
  stackLimit: number;
}

// =============================================================================
// BREEDING STATE
// =============================================================================

/**
 * State for the breeding system in ReactGameContext
 */
export interface BreedingState {
  /** Number of breeding attempts this session (for cost escalation) */
  breedingAttempts: number;

  /** List of discovered recipe IDs */
  discoveredRecipes: string[];

  /** Available breeding materials (itemId -> quantity) */
  breedingMaterials: Record<string, number>;

  /** History of all breeding attempts */
  breedingHistory: BreedingAttempt[];

  /** Currently selected parents for breeding UI */
  selectedParents?: {
    parent1?: EnhancedCreature;
    parent2?: EnhancedCreature;
  };

  /** Total number of creatures bred (all-time stat) */
  totalCreaturesBred: number;

  /** Highest generation achieved */
  highestGeneration: number;

  /** Special combinations discovered count */
  specialCombinationsDiscovered: number;
}

// =============================================================================
// STAT INHERITANCE
// =============================================================================

/**
 * Configuration for stat inheritance during breeding
 */
export interface StatInheritanceConfig {
  /** Minimum percentage of parent average (0.7 = 70%) */
  minParentAveragePercent: number;

  /** Maximum percentage of parent average (0.9 = 90%) */
  maxParentAveragePercent: number;

  /** Chance to inherit better parent's stat (0.4 = 40%) */
  betterStatInheritChance: number;

  /** Bonus per generation level (0.05 = +5%) */
  generationBonusPercent: number;

  /** Maximum generation */
  maxGeneration: number;
}

/**
 * Default stat inheritance configuration
 */
export const DEFAULT_STAT_INHERITANCE: StatInheritanceConfig = {
  minParentAveragePercent: 0.7,
  maxParentAveragePercent: 0.9,
  betterStatInheritChance: 0.4,
  generationBonusPercent: 0.05,
  maxGeneration: 5,
};

// =============================================================================
// EXHAUSTION SYSTEM
// =============================================================================

/**
 * Exhaustion data for a creature
 */
export interface CreatureExhaustion {
  /** Number of times this creature has bred */
  exhaustionLevel: number;

  /** Stat penalty per exhaustion level (e.g., 0.2 = -20%) */
  penaltyPerLevel: number;

  /** Current stats after exhaustion penalties */
  exhaustedStats: Partial<PlayerStats>;

  /** Original stats before exhaustion */
  originalStats: Partial<PlayerStats>;

  /** Whether this creature is currently exhausted */
  isExhausted: boolean;
}

/**
 * Configuration for exhaustion mechanics
 */
export interface ExhaustionConfig {
  /** Stat penalty per exhaustion level (0.2 = -20% per level) */
  penaltyPerLevel: number;

  /** Whether exhaustion can be removed */
  allowRecovery: boolean;

  /** Gold cost per exhaustion level to remove */
  recoveryCostPerLevel: number;
}

/**
 * Default exhaustion configuration
 */
export const DEFAULT_EXHAUSTION_CONFIG: ExhaustionConfig = {
  penaltyPerLevel: 0.2,
  allowRecovery: true,
  recoveryCostPerLevel: 100,
};

// =============================================================================
// RARITY UPGRADE SYSTEM
// =============================================================================

/**
 * Configuration for rarity upgrades during breeding
 */
export interface RarityUpgradeConfig {
  /** Chance for rarity upgrade (0.1 = 10%) */
  upgradeChance: number;

  /** Rarity tier progression */
  rarityProgression: CreatureRarity[];
}

/**
 * Default rarity upgrade configuration
 */
export const DEFAULT_RARITY_UPGRADE: RarityUpgradeConfig = {
  upgradeChance: 0.1,
  rarityProgression: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'],
};

// =============================================================================
// ABILITY INHERITANCE
// =============================================================================

/**
 * Configuration for ability inheritance
 */
export interface AbilityInheritanceConfig {
  /** Chance to inherit each parent ability (0.3 = 30%) */
  inheritChance: number;

  /** Maximum abilities that can be inherited */
  maxInheritedAbilities: number;

  /** Generation-based ability slots */
  abilitySlotsByGeneration: Record<number, AbilitySlots>;
}

/**
 * Ability and trait slots available by generation
 */
export interface AbilitySlots {
  /** Base ability slots */
  baseSlots: number;

  /** Bonus ability slots from generation */
  bonusSlots: number;

  /** Passive trait slots */
  passiveSlots: number;

  /** Whether ultimate ability is unlocked */
  hasUltimate: boolean;
}

/**
 * Default ability inheritance configuration
 */
export const DEFAULT_ABILITY_INHERITANCE: AbilityInheritanceConfig = {
  inheritChance: 0.3,
  maxInheritedAbilities: 4,
  abilitySlotsByGeneration: {
    0: { baseSlots: 4, bonusSlots: 0, passiveSlots: 0, hasUltimate: false },
    1: { baseSlots: 4, bonusSlots: 0, passiveSlots: 0, hasUltimate: false },
    2: { baseSlots: 4, bonusSlots: 1, passiveSlots: 0, hasUltimate: false },
    3: { baseSlots: 4, bonusSlots: 2, passiveSlots: 1, hasUltimate: false },
    4: { baseSlots: 4, bonusSlots: 3, passiveSlots: 2, hasUltimate: false },
    5: { baseSlots: 4, bonusSlots: 4, passiveSlots: 3, hasUltimate: true },
  },
};

// =============================================================================
// BREEDING VALIDATION
// =============================================================================

/**
 * Result of validating a breeding attempt
 */
export interface BreedingValidation {
  /** Whether breeding can proceed */
  valid: boolean;

  /** Error messages preventing breeding */
  errors: string[];

  /** Warning messages (breeding can proceed but player should know) */
  warnings: string[];

  /** Cost calculation if valid */
  cost?: BreedingCost;

  /** Matching recipe if found */
  matchingRecipe?: BreedingRecipe;
}

// =============================================================================
// PASSIVE TRAIT SYSTEM
// =============================================================================

/**
 * Passive trait that provides bonuses without needing to be activated
 */
export interface PassiveTrait {
  /** Unique trait identifier */
  id: string;

  /** Display name */
  name: string;

  /** Trait description */
  description: string;

  /** Trait rarity tier */
  rarity: CreatureRarity;

  /** Trait category */
  category: 'stat_boost' | 'resistance' | 'special_effect' | 'regeneration' | 'critical';

  /** Stat modifiers applied passively */
  statModifiers?: Partial<PlayerStats>;

  /** Percentage-based stat modifiers */
  percentModifiers?: {
    /** HP bonus percentage */
    hpBonus?: number;
    /** MP bonus percentage */
    mpBonus?: number;
    /** All stats bonus percentage */
    allStatsBonus?: number;
    /** Attack bonus percentage */
    attackBonus?: number;
    /** Defense bonus percentage */
    defenseBonus?: number;
    /** Magic bonus percentage */
    magicBonus?: number;
  };

  /** Element resistances (0-100%) */
  resistances?: {
    fire?: number;
    water?: number;
    earth?: number;
    air?: number;
    light?: number;
    dark?: number;
    ice?: number;
    lightning?: number;
    nature?: number;
  };

  /** Special effects */
  specialEffects?: {
    /** Type of special effect */
    type: 'regeneration' | 'critical_chance' | 'counter_attack' | 'first_strike' | 'last_stand';
    /** Effect value/percentage */
    value: number;
    /** Effect description */
    description: string;
  }[];

  /** Generation requirement to unlock this trait */
  minGeneration: number;

  /** Whether this is a Gen 5 exclusive trait */
  isUltimate?: boolean;

  /** Icon/sprite identifier */
  icon?: string;
}

/**
 * Configuration for passive trait inheritance
 */
export interface PassiveTraitConfig {
  /** Chance to inherit passive trait from parents */
  inheritChance: number;

  /** Maximum passive traits that can be inherited */
  maxInheritedTraits: number;

  /** Chance to randomly mutate a new passive trait */
  mutationChance: number;

  /** Generation-based passive trait availability */
  traitsByGeneration: Record<number, number>;
}

/**
 * Default passive trait configuration
 */
export const DEFAULT_PASSIVE_TRAIT_CONFIG: PassiveTraitConfig = {
  inheritChance: 0.25, // 25% chance per parent trait
  maxInheritedTraits: 3,
  mutationChance: 0.05, // 5% chance to gain new trait
  traitsByGeneration: {
    0: 0, // No passive traits for wild creatures
    1: 0, // No passive traits for Gen 1
    2: 0, // No passive traits for Gen 2
    3: 1, // 1 passive trait slot for Gen 3
    4: 2, // 2 passive trait slots for Gen 4
    5: 3, // 3 passive trait slots for Gen 5
  },
};

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Parent selection for breeding
 */
export interface ParentSelection {
  parent1: EnhancedCreature;
  parent2: EnhancedCreature;
}

/**
 * Offspring preview before breeding
 */
export interface OffspringPreview {
  /** Possible species outcomes */
  possibleSpecies: Array<{ species: string; probability: number }>;

  /** Stat ranges */
  estimatedStats: {
    min: Partial<PlayerStats>;
    max: Partial<PlayerStats>;
    average: Partial<PlayerStats>;
  };

  /** Estimated generation */
  generation: number;

  /** Rarity upgrade chance */
  rarityUpgradeChance: number;

  /** Current rarity and possible upgraded rarity */
  currentRarity: CreatureRarity;
  possibleRarity: CreatureRarity;

  /** Abilities that might be inherited */
  possibleInheritedAbilities: string[];

  /** Cost of breeding */
  cost: BreedingCost;
}
