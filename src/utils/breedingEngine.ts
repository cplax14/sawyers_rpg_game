/**
 * Breeding Engine - Core Breeding Logic
 *
 * Pure utility functions for the instant breeding system.
 * No React dependencies or side effects.
 *
 * Features:
 * - Gold cost calculation with multiple multipliers
 * - Stat inheritance with generation bonuses
 * - Rarity upgrade system (10% chance)
 * - Exhaustion mechanics (-20% per level)
 * - Ability inheritance (30% chance per parent)
 * - Generation-based stat caps
 */

import {
  BreedingCost,
  BreedingResult,
  BreedingRecipe,
  BreedingMaterialRequirement,
  DEFAULT_STAT_INHERITANCE,
  DEFAULT_RARITY_UPGRADE,
  DEFAULT_ABILITY_INHERITANCE,
  DEFAULT_EXHAUSTION_CONFIG,
  DEFAULT_PASSIVE_TRAIT_CONFIG,
} from '../types/breeding';
import { EnhancedCreature, CreatureRarity } from '../types/creatures';
import { PlayerStats } from '../types/game';

// =============================================================================
// COST CALCULATION
// =============================================================================

/**
 * Calculate the gold and material cost for breeding two creatures.
 *
 * Cost Formula:
 * - Base: 100 × (parent1.level + parent2.level)
 * - Rarity Multiplier: Common ×1, Uncommon ×2, Rare ×4, Epic ×8, Legendary ×16, Mythical ×32
 * - Generation Tax: ×1.5 per generation level
 * - Breeding Count Tax: ×1.2 per breedingCount on each parent
 *
 * @param parent1 - First parent creature
 * @param parent2 - Second parent creature
 * @param recipe - Optional breeding recipe (provides material requirements)
 * @returns Calculated breeding cost with breakdown
 */
export function calculateBreedingCost(
  parent1: EnhancedCreature,
  parent2: EnhancedCreature,
  recipe?: BreedingRecipe
): BreedingCost {
  // Base cost: 100 × (parent1.level + parent2.level)
  const baseCost = 100 * (parent1.level + parent2.level);

  // Rarity multiplier
  const rarityMultiplier = getRarityMultiplier(parent1.rarity, parent2.rarity);

  // Generation tax: ×1.5 per generation level
  const maxGeneration = Math.max(parent1.generation || 0, parent2.generation || 0);
  const generationMultiplier = Math.pow(1.5, maxGeneration);

  // Breeding count tax: ×1.2 per breedingCount on each parent
  const parent1BreedingMultiplier = Math.pow(1.2, parent1.breedingCount || 0);
  const parent2BreedingMultiplier = Math.pow(1.2, parent2.breedingCount || 0);
  const breedingCountMultiplier = parent1BreedingMultiplier * parent2BreedingMultiplier;

  // Calculate final gold cost
  const totalGold = Math.round(
    baseCost * rarityMultiplier * generationMultiplier * breedingCountMultiplier
  );

  // Materials from recipe (or empty)
  const materials: BreedingMaterialRequirement[] = recipe?.materials || [];

  return {
    goldAmount: totalGold,
    costBreakdown: {
      baseCost,
      rarityMultiplier,
      generationMultiplier,
      breedingCountMultiplier,
      totalGold,
    },
    materials,
  };
}

/**
 * Get the combined rarity multiplier for two parents
 */
function getRarityMultiplier(
  rarity1: CreatureRarity | string,
  rarity2: CreatureRarity | string
): number {
  const rarityValues: Record<string, number> = {
    common: 1,
    uncommon: 2,
    rare: 4,
    epic: 8,
    legendary: 16,
    mythical: 32,
  };

  // Use the higher rarity for cost calculation
  const maxRarity = Math.max(rarityValues[rarity1] || 1, rarityValues[rarity2] || 1);
  return maxRarity;
}

// =============================================================================
// OFFSPRING GENERATION
// =============================================================================

/**
 * Generate offspring from two parent creatures.
 *
 * Process:
 * 1. Determine offspring species (50/50 or recipe-specific)
 * 2. Calculate inherited stats
 * 3. Roll for rarity upgrade (10% chance)
 * 4. Determine generation (max parent gen + 1, cap at 5)
 * 5. Inherit abilities (30% chance per parent ability)
 * 6. Set lineage tracking
 *
 * @param parent1 - First parent creature
 * @param parent2 - Second parent creature
 * @param recipe - Optional breeding recipe
 * @returns Breeding result with offspring data
 */
export function generateOffspring(
  parent1: EnhancedCreature,
  parent2: EnhancedCreature,
  recipe?: BreedingRecipe
): BreedingResult {
  const messages: string[] = [];

  // Determine offspring species
  const offspringSpecies = determineOffspringSpecies(parent1, parent2, recipe);
  messages.push(`Offspring species: ${offspringSpecies}`);

  // Determine generation (max parent gen + 1, cap at 5)
  const parentGen1 = parent1.generation || 0;
  const parentGen2 = parent2.generation || 0;
  const generation = Math.min(
    Math.max(parentGen1, parentGen2) + 1,
    DEFAULT_STAT_INHERITANCE.maxGeneration
  );
  messages.push(`Generation ${generation}`);

  // Inherit stats with generation bonuses
  const inheritedStats = inheritStats(parent1.stats, parent2.stats, generation);

  // Roll for rarity upgrade (10% chance)
  const parentRarity = getHigherRarity(
    parent1.rarity as CreatureRarity,
    parent2.rarity as CreatureRarity
  );
  const { upgraded, finalRarity } = rollRarityUpgrade(parentRarity, recipe);
  const rarityUpgraded = upgraded;
  if (rarityUpgraded) {
    messages.push(`Rarity upgraded to ${finalRarity}!`);
  }

  // Inherit abilities (30% chance per parent ability)
  const inheritedAbilities = inheritAbilities(parent1, parent2);
  if (inheritedAbilities.length > 0) {
    messages.push(`Inherited ${inheritedAbilities.length} abilities from parents`);
  }

  // Inherit passive traits (Gen 3+, 25% chance per parent trait)
  const inheritedPassiveTraits = inheritPassiveTraits(parent1, parent2, generation, recipe);
  if (inheritedPassiveTraits.length > 0) {
    messages.push(`Inherited ${inheritedPassiveTraits.length} passive traits`);
  }

  // Calculate stat caps based on generation
  const statCaps = calculateStatCaps(generation);

  // Create offspring creature (partial data, full creature built in context)
  const offspring: Partial<EnhancedCreature> = {
    species: offspringSpecies,
    level: 1, // Newborns start at level 1
    rarity: finalRarity,
    generation,
    breedingCount: 0,
    exhaustionLevel: 0,
    inheritedAbilities,
    passiveTraits: inheritedPassiveTraits,
    parentIds: [parent1.creatureId, parent2.creatureId],
    statCaps,
    // Stats will be set properly when creating the full creature
    stats: inheritedStats,
  };

  const cost = calculateBreedingCost(parent1, parent2, recipe);

  return {
    success: true,
    offspring: offspring as EnhancedCreature, // Will be fully populated by context
    messages,
    inheritedAbilities,
    rarityUpgraded,
    generation,
    offspringSpecies,
    costPaid: cost,
    recipeUsed: recipe,
  };
}

/**
 * Determine the species of the offspring
 */
function determineOffspringSpecies(
  parent1: EnhancedCreature,
  parent2: EnhancedCreature,
  recipe?: BreedingRecipe
): string {
  // Recipe overrides species selection
  if (recipe?.offspringSpecies) {
    return recipe.offspringSpecies;
  }

  // 50/50 chance between parent species
  return Math.random() < 0.5 ? parent1.species : parent2.species;
}

/**
 * Get the higher rarity between two creatures
 */
function getHigherRarity(rarity1: CreatureRarity, rarity2: CreatureRarity): CreatureRarity {
  const rarityOrder: CreatureRarity[] = DEFAULT_RARITY_UPGRADE.rarityProgression;
  const index1 = rarityOrder.indexOf(rarity1);
  const index2 = rarityOrder.indexOf(rarity2);
  return index1 > index2 ? rarity1 : rarity2;
}

// =============================================================================
// STAT INHERITANCE
// =============================================================================

/**
 * Calculate inherited stats from two parents.
 *
 * Inheritance Rules:
 * 1. Base stats: random 70-90% of parent average for each stat
 * 2. Better parent chance: 40% chance to inherit better parent's stat
 * 3. Generation bonus: +5% per generation (max +25% at Gen 5)
 *
 * @param parent1Stats - First parent's stats
 * @param parent2Stats - Second parent's stats
 * @param generation - Offspring generation (0-5)
 * @returns Inherited stat values
 */
export function inheritStats(
  parent1Stats: PlayerStats,
  parent2Stats: PlayerStats,
  generation: number
): PlayerStats {
  const config = DEFAULT_STAT_INHERITANCE;
  const generationBonus = 1 + generation * config.generationBonusPercent;

  const statKeys: (keyof PlayerStats)[] = [
    'attack',
    'defense',
    'magicAttack',
    'magicDefense',
    'speed',
    'accuracy',
  ];
  const inheritedStats: any = {};

  for (const stat of statKeys) {
    const parent1Value = parent1Stats[stat] || 0;
    const parent2Value = parent2Stats[stat] || 0;

    // Calculate parent average
    const average = (parent1Value + parent2Value) / 2;

    // Random 70-90% of parent average
    const randomPercent =
      config.minParentAveragePercent +
      Math.random() * (config.maxParentAveragePercent - config.minParentAveragePercent);
    let baseStat = average * randomPercent;

    // 40% chance to inherit better parent's stat
    if (Math.random() < config.betterStatInheritChance) {
      baseStat = Math.max(parent1Value, parent2Value);
    }

    // Apply generation bonus
    const finalStat = Math.round(baseStat * generationBonus);

    inheritedStats[stat] = finalStat;
  }

  return inheritedStats as PlayerStats;
}

// =============================================================================
// RARITY UPGRADE
// =============================================================================

/**
 * Roll for a rarity upgrade (10% chance to upgrade one tier).
 *
 * @param parentRarity - Base rarity from parents
 * @param recipe - Optional recipe (may guarantee minimum rarity)
 * @returns Object with upgrade flag and final rarity
 */
export function rollRarityUpgrade(
  parentRarity: CreatureRarity,
  recipe?: BreedingRecipe
): { upgraded: boolean; finalRarity: CreatureRarity } {
  const config = DEFAULT_RARITY_UPGRADE;
  const rarityOrder = config.rarityProgression;

  let finalRarity = parentRarity;
  let upgraded = false;

  // 10% chance to upgrade one tier
  if (Math.random() < config.upgradeChance) {
    const currentIndex = rarityOrder.indexOf(parentRarity);
    if (currentIndex < rarityOrder.length - 1) {
      finalRarity = rarityOrder[currentIndex + 1];
      upgraded = true;
    }
  }

  // Recipe may guarantee minimum rarity
  if (recipe?.guaranteedBonuses?.minRarity) {
    const guaranteedIndex = rarityOrder.indexOf(recipe.guaranteedBonuses.minRarity);
    const currentIndex = rarityOrder.indexOf(finalRarity);
    if (guaranteedIndex > currentIndex) {
      finalRarity = recipe.guaranteedBonuses.minRarity;
      // Don't count as "upgraded" if it was guaranteed
    }
  }

  return { upgraded, finalRarity };
}

// =============================================================================
// EXHAUSTION MECHANICS
// =============================================================================

/**
 * Apply exhaustion to a creature after breeding.
 *
 * Effects:
 * - Increments breedingCount
 * - Increments exhaustionLevel
 * - Applies -20% stat penalty per exhaustion level
 *
 * @param creature - Creature to apply exhaustion to
 * @returns Updated creature with exhaustion applied
 */
export function applyExhaustion(creature: EnhancedCreature): EnhancedCreature {
  const config = DEFAULT_EXHAUSTION_CONFIG;

  const newBreedingCount = (creature.breedingCount || 0) + 1;
  const newExhaustionLevel = (creature.exhaustionLevel || 0) + 1;

  // Calculate stat penalties
  const penaltyMultiplier = 1 - newExhaustionLevel * config.penaltyPerLevel;

  // Apply penalty to current stats
  const exhaustedStats: any = {};
  const statKeys: (keyof PlayerStats)[] = [
    'attack',
    'defense',
    'magicAttack',
    'magicDefense',
    'speed',
    'accuracy',
  ];

  for (const stat of statKeys) {
    const originalValue = creature.stats?.[stat] || 0;
    exhaustedStats[stat] = Math.round(originalValue * penaltyMultiplier);
  }

  return {
    ...creature,
    breedingCount: newBreedingCount,
    exhaustionLevel: newExhaustionLevel,
    stats: exhaustedStats as PlayerStats,
  };
}

/**
 * Remove exhaustion levels from a creature (e.g., using items or rest).
 *
 * @param creature - Creature to restore
 * @param levelsToRemove - Number of exhaustion levels to remove
 * @returns Updated creature with reduced exhaustion
 */
export function removeExhaustion(
  creature: EnhancedCreature,
  levelsToRemove: number
): EnhancedCreature {
  const newExhaustionLevel = Math.max(0, (creature.exhaustionLevel || 0) - levelsToRemove);

  // Recalculate stats without exhaustion penalties
  const config = DEFAULT_EXHAUSTION_CONFIG;
  const penaltyMultiplier = 1 - newExhaustionLevel * config.penaltyPerLevel;

  const restoredStats: any = {};
  const statKeys: (keyof PlayerStats)[] = [
    'attack',
    'defense',
    'magicAttack',
    'magicDefense',
    'speed',
    'accuracy',
  ];

  // Get original stats (before exhaustion)
  // Assuming we store original stats or calculate from base + exhaustion
  for (const stat of statKeys) {
    const currentValue = creature.stats?.[stat] || 0;
    const currentExhaustionMultiplier =
      1 - (creature.exhaustionLevel || 0) * config.penaltyPerLevel;
    const originalValue =
      currentExhaustionMultiplier > 0 ? currentValue / currentExhaustionMultiplier : currentValue;
    restoredStats[stat] = Math.round(originalValue * penaltyMultiplier);
  }

  return {
    ...creature,
    exhaustionLevel: newExhaustionLevel,
    stats: restoredStats as PlayerStats,
  };
}

// =============================================================================
// ABILITY INHERITANCE
// =============================================================================

/**
 * Determine which abilities are inherited from parents.
 *
 * Rules:
 * - 30% chance to inherit each parent ability
 * - Maximum of 4 inherited abilities (config.maxInheritedAbilities)
 * - Recipe may guarantee specific abilities
 *
 * @param parent1 - First parent creature
 * @param parent2 - Second parent creature
 * @param recipe - Optional breeding recipe
 * @returns Array of inherited ability IDs
 */
export function inheritAbilities(
  parent1: EnhancedCreature,
  parent2: EnhancedCreature,
  recipe?: BreedingRecipe
): string[] {
  const config = DEFAULT_ABILITY_INHERITANCE;
  const inheritedAbilities: string[] = [];

  // Collect parent abilities
  const parent1Abilities = parent1.abilities?.map(a => (typeof a === 'string' ? a : a.id)) || [];
  const parent2Abilities = parent2.abilities?.map(a => (typeof a === 'string' ? a : a.id)) || [];

  // Roll for each parent's abilities (30% chance)
  for (const abilityId of parent1Abilities) {
    if (Math.random() < config.inheritChance) {
      inheritedAbilities.push(abilityId);
    }
  }

  for (const abilityId of parent2Abilities) {
    if (Math.random() < config.inheritChance && !inheritedAbilities.includes(abilityId)) {
      inheritedAbilities.push(abilityId);
    }
  }

  // Recipe may guarantee specific abilities
  if (recipe?.guaranteedBonuses?.guaranteedAbilities) {
    for (const abilityId of recipe.guaranteedBonuses.guaranteedAbilities) {
      if (!inheritedAbilities.includes(abilityId)) {
        inheritedAbilities.push(abilityId);
      }
    }
  }

  // Limit to max inherited abilities
  return inheritedAbilities.slice(0, config.maxInheritedAbilities);
}

// =============================================================================
// STAT CAPS
// =============================================================================

/**
 * Calculate stat caps based on generation level.
 *
 * Stat caps increase by +10% per generation:
 * - Gen 0: 100% (base)
 * - Gen 1: 110%
 * - Gen 2: 120%
 * - Gen 3: 130%
 * - Gen 4: 140%
 * - Gen 5: 150%
 *
 * @param generation - Generation level (0-5)
 * @returns Stat cap multipliers
 */
export function calculateStatCaps(generation: number): Partial<PlayerStats> {
  const capMultiplier = 1 + generation * 0.1; // +10% per generation

  // Base stat caps (these would be multiplied by species base stats)
  // For now, return multiplier as a percentage
  const statCaps: Partial<PlayerStats> = {
    attack: Math.round(100 * capMultiplier),
    defense: Math.round(100 * capMultiplier),
    magicAttack: Math.round(100 * capMultiplier),
    magicDefense: Math.round(100 * capMultiplier),
    speed: Math.round(100 * capMultiplier),
    accuracy: Math.round(100 * capMultiplier),
  };

  return statCaps;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Calculate exhaustion recovery cost based on exhaustion level.
 *
 * Cost: 100 gold × exhaustion level
 *
 * @param exhaustionLevel - Current exhaustion level
 * @returns Gold cost to remove all exhaustion
 */
export function calculateRecoveryCost(exhaustionLevel: number): number {
  const config = DEFAULT_EXHAUSTION_CONFIG;
  return config.recoveryCostPerLevel * exhaustionLevel;
}

/**
 * Check if a creature can breed (not at max generation, not too exhausted).
 *
 * @param creature - Creature to check
 * @param maxExhaustion - Maximum allowed exhaustion level (default 5)
 * @returns Whether the creature can breed
 */
export function canBreed(creature: EnhancedCreature, maxExhaustion: number = 5): boolean {
  const generation = creature.generation || 0;
  const exhaustionLevel = creature.exhaustionLevel || 0;

  // Can't breed if at max generation (Gen 5)
  if (generation >= DEFAULT_STAT_INHERITANCE.maxGeneration) {
    return false;
  }

  // Can't breed if too exhausted
  if (exhaustionLevel >= maxExhaustion) {
    return false;
  }

  return true;
}

/**
 * Validate breeding requirements for two creatures.
 *
 * @param parent1 - First parent
 * @param parent2 - Second parent
 * @param playerGold - Player's current gold
 * @param playerMaterials - Player's breeding materials inventory
 * @param cost - Calculated breeding cost
 * @returns Validation result with errors and warnings
 */
export function validateBreeding(
  parent1: EnhancedCreature,
  parent2: EnhancedCreature,
  playerGold: number = 0,
  playerMaterials: Record<string, number> = {},
  cost?: BreedingCost
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!parent1 || !parent2) {
    errors.push('Two parent creatures are required');
    return { valid: false, errors, warnings };
  }

  if (parent1.creatureId === parent2.creatureId) {
    errors.push('Cannot breed a creature with itself');
  }

  if (!canBreed(parent1)) {
    errors.push(`${parent1.name} cannot breed (generation or exhaustion limit)`);
  }

  if (!canBreed(parent2)) {
    errors.push(`${parent2.name} cannot breed (generation or exhaustion limit)`);
  }

  // Validate cost if provided
  if (cost) {
    // Check gold
    if (cost.goldAmount > playerGold) {
      const shortfall = cost.goldAmount - playerGold;
      errors.push(`Insufficient gold (need ${shortfall.toLocaleString()} more)`);
    }

    // Check materials
    for (const material of cost.materials) {
      const available = playerMaterials[material.itemId] || 0;
      if (available < material.quantity) {
        const needed = material.quantity - available;
        errors.push(`Need ${needed} more ${material.name}`);
      }
    }
  }

  // Add warnings for exhaustion
  const parent1Exhaustion = parent1.exhaustionLevel || 0;
  const parent2Exhaustion = parent2.exhaustionLevel || 0;

  if (parent1Exhaustion > 0 || parent2Exhaustion > 0) {
    warnings.push('One or both parents are exhausted (reduced stats)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate if player can afford a breeding cost.
 *
 * @param cost - Breeding cost to validate
 * @param playerGold - Player's current gold
 * @param playerMaterials - Player's breeding materials inventory
 * @returns Validation result with missing resources
 */
export function validateBreedingCost(
  cost: BreedingCost,
  playerGold: number,
  playerMaterials: Record<string, number>
): {
  canAfford: boolean;
  goldShortfall: number;
  missingMaterials: BreedingMaterialRequirement[];
} {
  const goldShortfall = Math.max(0, cost.goldAmount - playerGold);
  const missingMaterials: BreedingMaterialRequirement[] = [];

  // Check each material requirement
  for (const material of cost.materials) {
    const available = playerMaterials[material.itemId] || 0;
    if (available < material.quantity) {
      missingMaterials.push({
        ...material,
        quantity: material.quantity - available, // Store the shortage amount
      });
    }
  }

  return {
    canAfford: goldShortfall === 0 && missingMaterials.length === 0,
    goldShortfall,
    missingMaterials,
  };
}

// =============================================================================
// PASSIVE TRAIT INHERITANCE
// =============================================================================

/**
 * Determine which passive traits are inherited from parents.
 *
 * Rules:
 * - Gen 3+: Can have passive traits
 * - 25% chance to inherit each parent trait
 * - 5% chance to mutate a new random trait
 * - Maximum of 3 inherited traits
 *
 * @param parent1 - First parent creature
 * @param parent2 - Second parent creature
 * @param generation - Offspring generation
 * @param recipe - Optional breeding recipe
 * @returns Array of inherited passive trait IDs
 */
export function inheritPassiveTraits(
  parent1: EnhancedCreature,
  parent2: EnhancedCreature,
  generation: number,
  recipe?: BreedingRecipe
): string[] {
  const config = DEFAULT_PASSIVE_TRAIT_CONFIG;

  // Gen 0-2 creatures cannot have passive traits
  if (generation < 3) {
    return [];
  }

  const inheritedTraits: string[] = [];

  // Collect parent traits
  const parent1Traits = parent1.passiveTraits || [];
  const parent2Traits = parent2.passiveTraits || [];

  // Roll for each parent's traits (25% chance)
  for (const traitId of parent1Traits) {
    if (Math.random() < config.inheritChance) {
      inheritedTraits.push(traitId);
    }
  }

  for (const traitId of parent2Traits) {
    if (Math.random() < config.inheritChance && !inheritedTraits.includes(traitId)) {
      inheritedTraits.push(traitId);
    }
  }

  // 5% chance to mutate a new random trait (would need trait pool to implement)
  // This is a placeholder for future implementation
  if (Math.random() < config.mutationChance) {
    // TODO: Randomly select a trait from available pool based on generation
    // For now, we skip this as it requires the trait data to be loaded
  }

  // Limit to max traits for this generation
  const maxTraitsForGen = config.traitsByGeneration[generation] || 0;
  return inheritedTraits.slice(0, Math.min(maxTraitsForGen, config.maxInheritedTraits));
}

/**
 * Get the maximum number of ability slots for a given generation.
 *
 * @param generation - Generation level (0-5)
 * @returns Total ability slots (base + bonus)
 */
export function getAbilitySlots(generation: number): number {
  const slots =
    DEFAULT_ABILITY_INHERITANCE.abilitySlotsByGeneration[generation] ||
    DEFAULT_ABILITY_INHERITANCE.abilitySlotsByGeneration[0];

  return slots.baseSlots + slots.bonusSlots;
}

/**
 * Get the maximum number of passive trait slots for a given generation.
 *
 * @param generation - Generation level (0-5)
 * @returns Number of passive trait slots
 */
export function getPassiveTraitSlots(generation: number): number {
  return DEFAULT_PASSIVE_TRAIT_CONFIG.traitsByGeneration[generation] || 0;
}
