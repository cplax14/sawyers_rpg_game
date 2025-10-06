/**
 * Tests for Breeding Engine - Core Breeding Logic
 *
 * Tests all pure utility functions for the instant breeding system:
 * - Cost calculation with multipliers
 * - Stat inheritance with generation bonuses
 * - Rarity upgrade system
 * - Exhaustion mechanics
 * - Ability inheritance
 * - Generation-based stat caps
 */

import {
  calculateBreedingCost,
  generateOffspring,
  inheritStats,
  rollRarityUpgrade,
  applyExhaustion,
  removeExhaustion,
  inheritAbilities,
  calculateStatCaps,
  calculateRecoveryCost,
  canBreed,
  validateBreeding,
  validateBreedingCost,
} from './breedingEngine';
import { EnhancedCreature, CreatureRarity } from '../types/creatures';
import { PlayerStats } from '../types/game';
import { BreedingRecipe } from '../types/breeding';

// =============================================================================
// MOCK DATA HELPERS
// =============================================================================

const createMockCreature = (overrides: Partial<EnhancedCreature> = {}): EnhancedCreature => {
  const baseStats: PlayerStats = {
    attack: 10,
    defense: 10,
    magicAttack: 10,
    magicDefense: 10,
    speed: 10,
    accuracy: 85,
  };

  return {
    creatureId: `creature_${Math.random()}`,
    id: `creature_${Math.random()}`,
    name: 'Test Creature',
    species: 'test_species',
    level: 1,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    baseStats,
    currentStats: baseStats,
    stats: baseStats,
    types: ['beast'],
    rarity: 'common',
    abilities: [],
    captureRate: 0.5,
    experience: 0,
    gold: 10,
    drops: [],
    areas: [],
    evolvesTo: [],
    isWild: false,
    element: 'neutral',
    creatureType: 'beast',
    size: 'medium',
    habitat: ['forest'],
    personality: {
      traits: ['docile'],
      mood: 'content',
      loyalty: 50,
      happiness: 50,
      energy: 50,
      sociability: 50,
    },
    nature: {
      name: 'Neutral',
      statModifiers: {},
      behaviorModifiers: {
        aggression: 0,
        defensiveness: 0,
        cooperation: 0,
      },
    },
    individualStats: {
      hpIV: 15,
      attackIV: 15,
      defenseIV: 15,
      magicAttackIV: 15,
      magicDefenseIV: 15,
      speedIV: 15,
      hpEV: 0,
      attackEV: 0,
      defenseEV: 0,
      magicAttackEV: 0,
      magicDefenseEV: 0,
      speedEV: 0,
    },
    genetics: {
      parentIds: [],
      generation: 0,
      inheritedTraits: [],
      mutations: [],
      breedingPotential: 1,
    },
    breedingGroup: ['test'],
    fertility: 1,
    generation: 0,
    breedingCount: 0,
    exhaustionLevel: 0,
    inheritedAbilities: [],
    parentIds: [],
    statCaps: {},
    collectionStatus: {
      discovered: true,
      captured: true,
      timesCaptures: 1,
      favorite: false,
      tags: [],
      notes: '',
      completionLevel: 'captured',
    },
    sprite: 'test.png',
    description: 'A test creature',
    loreText: 'Test lore',
    discoveryLocation: 'Test Area',
    discoveredAt: new Date(),
    timesEncountered: 1,
    ...overrides,
  };
};

const createMockRecipe = (overrides: Partial<BreedingRecipe> = {}): BreedingRecipe => ({
  id: 'test_recipe',
  name: 'Test Recipe',
  description: 'A test breeding recipe',
  parentSpecies1: null,
  parentSpecies2: null,
  materials: [],
  offspringSpecies: 'test_offspring',
  ...overrides,
});

// =============================================================================
// COST CALCULATION TESTS
// =============================================================================

describe('calculateBreedingCost', () => {
  it('should calculate base cost correctly (100 × (level1 + level2))', () => {
    const parent1 = createMockCreature({ level: 5 });
    const parent2 = createMockCreature({ level: 5 });

    const result = calculateBreedingCost(parent1, parent2);

    expect(result.costBreakdown.baseCost).toBe(1000); // 100 × (5 + 5)
  });

  it('should apply rarity multiplier correctly (Common = ×1)', () => {
    const parent1 = createMockCreature({ level: 5, rarity: 'common' });
    const parent2 = createMockCreature({ level: 5, rarity: 'common' });

    const result = calculateBreedingCost(parent1, parent2);

    expect(result.costBreakdown.rarityMultiplier).toBe(1);
  });

  it('should apply rarity multiplier correctly (Uncommon = ×2)', () => {
    const parent1 = createMockCreature({ level: 5, rarity: 'uncommon' });
    const parent2 = createMockCreature({ level: 5, rarity: 'common' });

    const result = calculateBreedingCost(parent1, parent2);

    expect(result.costBreakdown.rarityMultiplier).toBe(2);
  });

  it('should apply rarity multiplier correctly (Legendary = ×16)', () => {
    const parent1 = createMockCreature({ level: 5, rarity: 'legendary' });
    const parent2 = createMockCreature({ level: 5, rarity: 'rare' });

    const result = calculateBreedingCost(parent1, parent2);

    expect(result.costBreakdown.rarityMultiplier).toBe(16);
  });

  it('should use higher rarity for multiplier when parents differ', () => {
    const parent1 = createMockCreature({ level: 5, rarity: 'rare' });
    const parent2 = createMockCreature({ level: 5, rarity: 'uncommon' });

    const result = calculateBreedingCost(parent1, parent2);

    expect(result.costBreakdown.rarityMultiplier).toBe(4); // Rare = ×4
  });

  it('should apply generation tax correctly (×1.5 per generation)', () => {
    const parent1 = createMockCreature({ level: 5, generation: 2 });
    const parent2 = createMockCreature({ level: 5, generation: 1 });

    const result = calculateBreedingCost(parent1, parent2);

    expect(result.costBreakdown.generationMultiplier).toBe(Math.pow(1.5, 2)); // 2.25
  });

  it('should apply breeding count tax correctly (×1.2 per count)', () => {
    const parent1 = createMockCreature({ level: 5, breedingCount: 2 });
    const parent2 = createMockCreature({ level: 5, breedingCount: 1 });

    const result = calculateBreedingCost(parent1, parent2);

    // Parent1: 1.2^2 = 1.44, Parent2: 1.2^1 = 1.2, Total: 1.728
    expect(result.costBreakdown.breedingCountMultiplier).toBeCloseTo(1.728, 2);
  });

  it('should calculate total gold cost with all multipliers', () => {
    const parent1 = createMockCreature({
      level: 10,
      rarity: 'rare',
      generation: 1,
      breedingCount: 1,
    });
    const parent2 = createMockCreature({
      level: 10,
      rarity: 'common',
      generation: 0,
      breedingCount: 0,
    });

    const result = calculateBreedingCost(parent1, parent2);

    // Base: 100 × 20 = 2000
    // Rarity: ×4 (rare)
    // Generation: ×1.5 (gen 1)
    // Breeding: ×1.2 (one parent bred once)
    // Total: 2000 × 4 × 1.5 × 1.2 = 14,400
    expect(result.goldAmount).toBe(14400);
  });

  it('should include materials from recipe', () => {
    const parent1 = createMockCreature({ level: 5 });
    const parent2 = createMockCreature({ level: 5 });
    const recipe = createMockRecipe({
      materials: [
        { itemId: 'dragon_scale', quantity: 5, name: 'Dragon Scale' },
        { itemId: 'phoenix_feather', quantity: 3, name: 'Phoenix Feather' },
      ],
    });

    const result = calculateBreedingCost(parent1, parent2, recipe);

    expect(result.materials).toHaveLength(2);
    expect(result.materials[0].itemId).toBe('dragon_scale');
    expect(result.materials[0].quantity).toBe(5);
  });

  it('should have empty materials array when no recipe', () => {
    const parent1 = createMockCreature({ level: 5 });
    const parent2 = createMockCreature({ level: 5 });

    const result = calculateBreedingCost(parent1, parent2);

    expect(result.materials).toHaveLength(0);
  });
});

// =============================================================================
// STAT INHERITANCE TESTS
// =============================================================================

describe('inheritStats', () => {
  const parent1Stats: PlayerStats = {
    attack: 20,
    defense: 15,
    magicAttack: 10,
    magicDefense: 12,
    speed: 18,
    accuracy: 90,
  };

  const parent2Stats: PlayerStats = {
    attack: 10,
    defense: 20,
    magicAttack: 15,
    magicDefense: 8,
    speed: 12,
    accuracy: 85,
  };

  it('should return stats within expected range (70-90% or better parent)', () => {
    // Run multiple times to test randomness
    for (let i = 0; i < 10; i++) {
      const result = inheritStats(parent1Stats, parent2Stats, 0);

      // Check attack (average = 15, better parent = 20)
      // Minimum: 70% of average = 10.5
      // Maximum: Either 90% of average OR better parent = max(13.5, 20) = 20
      expect(result.attack).toBeGreaterThanOrEqual(Math.floor(15 * 0.7));
      expect(result.attack).toBeLessThanOrEqual(20); // Better parent value

      // Check defense (average = 17.5, better parent = 20)
      expect(result.defense).toBeGreaterThanOrEqual(Math.floor(17.5 * 0.7));
      expect(result.defense).toBeLessThanOrEqual(20); // Better parent value
    }
  });

  it('should apply generation bonus correctly (+5% per gen)', () => {
    // Set seed for consistent testing by running many iterations
    const results = [];
    for (let i = 0; i < 50; i++) {
      const gen0Result = inheritStats(parent1Stats, parent2Stats, 0);
      const gen5Result = inheritStats(parent1Stats, parent2Stats, 5);
      results.push({ gen0: gen0Result, gen5: gen5Result });
    }

    // Gen 5 should have higher average stats due to +25% bonus
    const avgGen0Attack = results.reduce((sum, r) => sum + r.gen0.attack, 0) / results.length;
    const avgGen5Attack = results.reduce((sum, r) => sum + r.gen5.attack, 0) / results.length;

    expect(avgGen5Attack).toBeGreaterThan(avgGen0Attack * 1.15); // Should be at least 15% higher
  });

  it('should inherit all stat types', () => {
    const result = inheritStats(parent1Stats, parent2Stats, 0);

    expect(result.attack).toBeDefined();
    expect(result.defense).toBeDefined();
    expect(result.magicAttack).toBeDefined();
    expect(result.magicDefense).toBeDefined();
    expect(result.speed).toBeDefined();
    expect(result.accuracy).toBeDefined();
  });

  it('should return rounded integer values', () => {
    const result = inheritStats(parent1Stats, parent2Stats, 0);

    Object.values(result).forEach((statValue) => {
      expect(Number.isInteger(statValue)).toBe(true);
    });
  });

  it('should handle generation 5 with max bonus (+25%)', () => {
    const result = inheritStats(parent1Stats, parent2Stats, 5);

    // Gen 5 has 1.25× multiplier
    // Average attack = 15, with 70-90% range and 1.25× bonus
    // Min: 15 × 0.7 × 1.25 = 13.125
    // Max: Either (15 × 0.9 × 1.25 = 16.875) OR (better parent × 1.25 = 20 × 1.25 = 25)
    expect(result.attack).toBeGreaterThanOrEqual(13);
    expect(result.attack).toBeLessThanOrEqual(25); // Better parent with bonus
  });
});

// =============================================================================
// RARITY UPGRADE TESTS
// =============================================================================

describe('rollRarityUpgrade', () => {
  it('should maintain rarity when upgrade fails (90% of the time)', () => {
    // Run many iterations to test probability
    let upgrades = 0;
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const result = rollRarityUpgrade('common');
      if (result.upgraded) upgrades++;
    }

    // Should be approximately 10% upgrades (within reasonable variance)
    expect(upgrades).toBeGreaterThan(50); // At least 5%
    expect(upgrades).toBeLessThan(150); // At most 15%
  });

  it('should upgrade one tier when successful', () => {
    // Mock Math.random to always succeed
    const originalRandom = Math.random;
    Math.random = jest.fn(() => 0.05); // Always succeed (< 0.1)

    const result = rollRarityUpgrade('common');

    expect(result.upgraded).toBe(true);
    expect(result.finalRarity).toBe('uncommon');

    Math.random = originalRandom;
  });

  it('should follow rarity progression correctly', () => {
    const originalRandom = Math.random;
    Math.random = jest.fn(() => 0.05); // Always succeed

    expect(rollRarityUpgrade('common').finalRarity).toBe('uncommon');
    expect(rollRarityUpgrade('uncommon').finalRarity).toBe('rare');
    expect(rollRarityUpgrade('rare').finalRarity).toBe('epic');
    expect(rollRarityUpgrade('epic').finalRarity).toBe('legendary');
    expect(rollRarityUpgrade('legendary').finalRarity).toBe('mythical');

    Math.random = originalRandom;
  });

  it('should not upgrade past mythical', () => {
    const originalRandom = Math.random;
    Math.random = jest.fn(() => 0.05); // Always succeed

    const result = rollRarityUpgrade('mythical');

    expect(result.upgraded).toBe(false);
    expect(result.finalRarity).toBe('mythical');

    Math.random = originalRandom;
  });

  it('should respect recipe guaranteed minimum rarity', () => {
    const recipe = createMockRecipe({
      guaranteedBonuses: {
        minRarity: 'epic',
      },
    });

    const result = rollRarityUpgrade('common', recipe);

    expect(result.finalRarity).toBe('epic');
  });

  it('should not count recipe guarantee as upgrade', () => {
    const recipe = createMockRecipe({
      guaranteedBonuses: {
        minRarity: 'epic',
      },
    });

    // Mock to fail upgrade roll
    const originalRandom = Math.random;
    Math.random = jest.fn(() => 0.5);

    const result = rollRarityUpgrade('common', recipe);

    expect(result.finalRarity).toBe('epic');
    expect(result.upgraded).toBe(false);

    Math.random = originalRandom;
  });
});

// =============================================================================
// EXHAUSTION MECHANICS TESTS
// =============================================================================

describe('applyExhaustion', () => {
  it('should increment breedingCount by 1', () => {
    const creature = createMockCreature({ breedingCount: 0 });

    const result = applyExhaustion(creature);

    expect(result.breedingCount).toBe(1);
  });

  it('should increment exhaustionLevel by 1', () => {
    const creature = createMockCreature({ exhaustionLevel: 0 });

    const result = applyExhaustion(creature);

    expect(result.exhaustionLevel).toBe(1);
  });

  it('should apply -20% stat penalty per exhaustion level', () => {
    const creature = createMockCreature({
      exhaustionLevel: 0,
      stats: {
        attack: 100,
        defense: 100,
        magicAttack: 100,
        magicDefense: 100,
        speed: 100,
        accuracy: 100,
      },
    });

    const result = applyExhaustion(creature);

    // After 1 exhaustion level: 100 × (1 - 0.2) = 80
    expect(result.stats.attack).toBe(80);
    expect(result.stats.defense).toBe(80);
    expect(result.stats.magicAttack).toBe(80);
  });

  it('should stack exhaustion penalties correctly', () => {
    const creature = createMockCreature({
      exhaustionLevel: 2,
      stats: {
        attack: 100,
        defense: 100,
        magicAttack: 100,
        magicDefense: 100,
        speed: 100,
        accuracy: 100,
      },
    });

    const result = applyExhaustion(creature);

    // After 3 exhaustion levels: 100 × (1 - 0.6) = 40
    expect(result.exhaustionLevel).toBe(3);
    expect(result.stats.attack).toBe(40);
  });

  it('should preserve original creature data', () => {
    const creature = createMockCreature({
      name: 'Test Creature',
      species: 'test',
    });

    const result = applyExhaustion(creature);

    expect(result.name).toBe('Test Creature');
    expect(result.species).toBe('test');
  });
});

describe('removeExhaustion', () => {
  it('should reduce exhaustionLevel by specified amount', () => {
    const creature = createMockCreature({ exhaustionLevel: 3 });

    const result = removeExhaustion(creature, 2);

    expect(result.exhaustionLevel).toBe(1);
  });

  it('should not reduce exhaustionLevel below 0', () => {
    const creature = createMockCreature({ exhaustionLevel: 2 });

    const result = removeExhaustion(creature, 5);

    expect(result.exhaustionLevel).toBe(0);
  });

  it('should restore stats when removing exhaustion', () => {
    const creature = createMockCreature({
      exhaustionLevel: 2,
      stats: {
        attack: 60, // Original: 100, with 2 levels (-40%)
        defense: 60,
        magicAttack: 60,
        magicDefense: 60,
        speed: 60,
        accuracy: 60,
      },
    });

    const result = removeExhaustion(creature, 1);

    // After removing 1 level: only 1 level remains (-20%)
    // Original × (1 - 0.2) = 80
    expect(result.exhaustionLevel).toBe(1);
    expect(result.stats.attack).toBe(80);
  });

  it('should fully restore stats when all exhaustion removed', () => {
    const creature = createMockCreature({
      exhaustionLevel: 3,
      stats: {
        attack: 40, // Original: 100, with 3 levels (-60%)
        defense: 40,
        magicAttack: 40,
        magicDefense: 40,
        speed: 40,
        accuracy: 40,
      },
    });

    const result = removeExhaustion(creature, 3);

    expect(result.exhaustionLevel).toBe(0);
    expect(result.stats.attack).toBe(100);
  });
});

describe('calculateRecoveryCost', () => {
  it('should calculate cost as 100 gold × exhaustion level', () => {
    expect(calculateRecoveryCost(1)).toBe(100);
    expect(calculateRecoveryCost(3)).toBe(300);
    expect(calculateRecoveryCost(5)).toBe(500);
  });

  it('should return 0 for 0 exhaustion', () => {
    expect(calculateRecoveryCost(0)).toBe(0);
  });
});

// =============================================================================
// ABILITY INHERITANCE TESTS
// =============================================================================

describe('inheritAbilities', () => {
  it('should inherit abilities from both parents with 30% chance', () => {
    const parent1 = createMockCreature({
      abilities: ['fireball', 'heal', 'shield'],
    });
    const parent2 = createMockCreature({
      abilities: ['ice_blast', 'thunder', 'regenerate'],
    });

    // Run many iterations to test probability
    let totalInherited = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const result = inheritAbilities(parent1, parent2);
      totalInherited += result.length;
    }

    // Average inheritance: 6 abilities × 30% = 1.8 abilities
    const avgInherited = totalInherited / iterations;
    expect(avgInherited).toBeGreaterThan(1.0);
    expect(avgInherited).toBeLessThan(3.0);
  });

  it('should not duplicate abilities from both parents', () => {
    const parent1 = createMockCreature({
      abilities: ['fireball', 'heal'],
    });
    const parent2 = createMockCreature({
      abilities: ['fireball', 'thunder'],
    });

    const result = inheritAbilities(parent1, parent2);

    // Count occurrences of 'fireball'
    const fireballCount = result.filter((a) => a === 'fireball').length;
    expect(fireballCount).toBeLessThanOrEqual(1);
  });

  it('should limit inherited abilities to max (4)', () => {
    const parent1 = createMockCreature({
      abilities: ['ability1', 'ability2', 'ability3', 'ability4', 'ability5'],
    });
    const parent2 = createMockCreature({
      abilities: ['ability6', 'ability7', 'ability8', 'ability9', 'ability10'],
    });

    // Force all abilities to inherit
    const originalRandom = Math.random;
    Math.random = jest.fn(() => 0.1); // Always succeed

    const result = inheritAbilities(parent1, parent2);

    expect(result.length).toBeLessThanOrEqual(4);

    Math.random = originalRandom;
  });

  it('should include recipe guaranteed abilities', () => {
    const parent1 = createMockCreature({ abilities: ['fireball'] });
    const parent2 = createMockCreature({ abilities: ['ice_blast'] });
    const recipe = createMockRecipe({
      guaranteedBonuses: {
        guaranteedAbilities: ['ultimate_power', 'divine_shield'],
      },
    });

    const result = inheritAbilities(parent1, parent2, recipe);

    expect(result).toContain('ultimate_power');
    expect(result).toContain('divine_shield');
  });

  it('should not duplicate recipe abilities if already inherited', () => {
    const parent1 = createMockCreature({ abilities: ['ultimate_power'] });
    const parent2 = createMockCreature({ abilities: [] });
    const recipe = createMockRecipe({
      guaranteedBonuses: {
        guaranteedAbilities: ['ultimate_power'],
      },
    });

    // Force inheritance
    const originalRandom = Math.random;
    Math.random = jest.fn(() => 0.1);

    const result = inheritAbilities(parent1, parent2, recipe);

    const ultimateCount = result.filter((a) => a === 'ultimate_power').length;
    expect(ultimateCount).toBe(1);

    Math.random = originalRandom;
  });

  it('should return empty array if no abilities to inherit', () => {
    const parent1 = createMockCreature({ abilities: [] });
    const parent2 = createMockCreature({ abilities: [] });

    const result = inheritAbilities(parent1, parent2);

    expect(result).toHaveLength(0);
  });
});

// =============================================================================
// STAT CAPS TESTS
// =============================================================================

describe('calculateStatCaps', () => {
  it('should return base caps for generation 0', () => {
    const result = calculateStatCaps(0);

    expect(result.attack).toBe(100);
    expect(result.defense).toBe(100);
    expect(result.magicAttack).toBe(100);
  });

  it('should apply +10% per generation', () => {
    const gen1 = calculateStatCaps(1);
    const gen3 = calculateStatCaps(3);
    const gen5 = calculateStatCaps(5);

    expect(gen1.attack).toBe(110); // 100 × 1.1
    expect(gen3.attack).toBe(130); // 100 × 1.3
    expect(gen5.attack).toBe(150); // 100 × 1.5
  });

  it('should apply to all stats equally', () => {
    const result = calculateStatCaps(5);

    expect(result.attack).toBe(150);
    expect(result.defense).toBe(150);
    expect(result.magicAttack).toBe(150);
    expect(result.magicDefense).toBe(150);
    expect(result.speed).toBe(150);
    expect(result.accuracy).toBe(150);
  });

  it('should return rounded integer values', () => {
    const result = calculateStatCaps(2);

    Object.values(result).forEach((capValue) => {
      expect(Number.isInteger(capValue)).toBe(true);
    });
  });
});

// =============================================================================
// VALIDATION TESTS
// =============================================================================

describe('canBreed', () => {
  it('should return true for valid breeding candidate', () => {
    const creature = createMockCreature({
      generation: 2,
      exhaustionLevel: 2,
    });

    expect(canBreed(creature)).toBe(true);
  });

  it('should return false if at max generation (5)', () => {
    const creature = createMockCreature({
      generation: 5,
      exhaustionLevel: 0,
    });

    expect(canBreed(creature)).toBe(false);
  });

  it('should return false if exhaustion exceeds limit', () => {
    const creature = createMockCreature({
      generation: 2,
      exhaustionLevel: 5,
    });

    expect(canBreed(creature, 5)).toBe(false);
  });

  it('should allow custom exhaustion limit', () => {
    const creature = createMockCreature({
      generation: 2,
      exhaustionLevel: 3,
    });

    expect(canBreed(creature, 2)).toBe(false);
    expect(canBreed(creature, 4)).toBe(true);
  });
});

describe('validateBreeding', () => {
  it('should return valid for two compatible parents', () => {
    const parent1 = createMockCreature({ generation: 1, exhaustionLevel: 0 });
    const parent2 = createMockCreature({ generation: 2, exhaustionLevel: 1 });

    const result = validateBreeding(parent1, parent2);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should error if parents are missing', () => {
    const parent1 = createMockCreature();

    const result = validateBreeding(parent1, null as any);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Two parent creatures are required');
  });

  it('should error if breeding same creature', () => {
    const parent = createMockCreature({ creatureId: 'same_id' });

    const result = validateBreeding(parent, parent);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Cannot breed a creature with itself');
  });

  it('should error if parent1 at max generation', () => {
    const parent1 = createMockCreature({
      name: 'MaxGen',
      generation: 5,
      exhaustionLevel: 0,
    });
    const parent2 = createMockCreature({ generation: 1, exhaustionLevel: 0 });

    const result = validateBreeding(parent1, parent2);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('MaxGen');
  });

  it('should error if parent2 too exhausted', () => {
    const parent1 = createMockCreature({ generation: 1, exhaustionLevel: 0 });
    const parent2 = createMockCreature({
      name: 'Exhausted',
      generation: 1,
      exhaustionLevel: 5,
    });

    const result = validateBreeding(parent1, parent2);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Exhausted');
  });

  it('should validate gold cost when provided', () => {
    const parent1 = createMockCreature({ level: 10 });
    const parent2 = createMockCreature({ level: 10 });
    const cost = calculateBreedingCost(parent1, parent2);
    const playerGold = cost.goldAmount + 500; // Ensure we have enough
    const playerMaterials = {};

    const result = validateBreeding(parent1, parent2, playerGold, playerMaterials, cost);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should error when insufficient gold', () => {
    const parent1 = createMockCreature({ level: 10 });
    const parent2 = createMockCreature({ level: 10 });
    const cost = calculateBreedingCost(parent1, parent2);
    const playerGold = 100; // Not enough
    const playerMaterials = {};

    const result = validateBreeding(parent1, parent2, playerGold, playerMaterials, cost);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Insufficient gold'))).toBe(true);
  });

  it('should error when missing materials', () => {
    const parent1 = createMockCreature({ level: 10 });
    const parent2 = createMockCreature({ level: 10 });
    const recipe = createMockRecipe({
      materials: [
        { itemId: 'slime_gel', quantity: 5, name: 'Slime Gel' },
      ],
    });
    const cost = calculateBreedingCost(parent1, parent2, recipe);
    const playerGold = 10000;
    const playerMaterials = { slime_gel: 2 }; // Not enough

    const result = validateBreeding(parent1, parent2, playerGold, playerMaterials, cost);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Slime Gel'))).toBe(true);
  });

  it('should add warning for exhausted parents', () => {
    const parent1 = createMockCreature({ generation: 1, exhaustionLevel: 2 });
    const parent2 = createMockCreature({ generation: 1, exhaustionLevel: 1 });

    const result = validateBreeding(parent1, parent2);

    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('exhausted');
  });
});

describe('validateBreedingCost', () => {
  it('should return canAfford true when player has resources', () => {
    const cost = {
      goldAmount: 1000,
      costBreakdown: {
        baseCost: 1000,
        rarityMultiplier: 1,
        generationMultiplier: 1,
        breedingCountMultiplier: 1,
        totalGold: 1000,
      },
      materials: [
        { itemId: 'slime_gel', quantity: 3, name: 'Slime Gel' },
      ],
    };
    const playerGold = 1500;
    const playerMaterials = { slime_gel: 5 };

    const result = validateBreedingCost(cost, playerGold, playerMaterials);

    expect(result.canAfford).toBe(true);
    expect(result.goldShortfall).toBe(0);
    expect(result.missingMaterials).toHaveLength(0);
  });

  it('should calculate gold shortfall', () => {
    const cost = {
      goldAmount: 1000,
      costBreakdown: {
        baseCost: 1000,
        rarityMultiplier: 1,
        generationMultiplier: 1,
        breedingCountMultiplier: 1,
        totalGold: 1000,
      },
      materials: [],
    };
    const playerGold = 600;
    const playerMaterials = {};

    const result = validateBreedingCost(cost, playerGold, playerMaterials);

    expect(result.canAfford).toBe(false);
    expect(result.goldShortfall).toBe(400);
  });

  it('should identify missing materials', () => {
    const cost = {
      goldAmount: 1000,
      costBreakdown: {
        baseCost: 1000,
        rarityMultiplier: 1,
        generationMultiplier: 1,
        breedingCountMultiplier: 1,
        totalGold: 1000,
      },
      materials: [
        { itemId: 'slime_gel', quantity: 5, name: 'Slime Gel' },
        { itemId: 'goblin_tooth', quantity: 3, name: 'Goblin Tooth' },
      ],
    };
    const playerGold = 2000;
    const playerMaterials = { slime_gel: 2 }; // Missing goblin_tooth, not enough slime_gel

    const result = validateBreedingCost(cost, playerGold, playerMaterials);

    expect(result.canAfford).toBe(false);
    expect(result.missingMaterials).toHaveLength(2);
    expect(result.missingMaterials[0]).toEqual({
      itemId: 'slime_gel',
      quantity: 3, // Need 3 more
      name: 'Slime Gel',
    });
    expect(result.missingMaterials[1]).toEqual({
      itemId: 'goblin_tooth',
      quantity: 3, // Need all 3
      name: 'Goblin Tooth',
    });
  });

  it('should handle empty materials requirement', () => {
    const cost = {
      goldAmount: 500,
      costBreakdown: {
        baseCost: 500,
        rarityMultiplier: 1,
        generationMultiplier: 1,
        breedingCountMultiplier: 1,
        totalGold: 500,
      },
      materials: [],
    };
    const playerGold = 1000;
    const playerMaterials = {};

    const result = validateBreedingCost(cost, playerGold, playerMaterials);

    expect(result.canAfford).toBe(true);
    expect(result.missingMaterials).toHaveLength(0);
  });
});

// =============================================================================
// OFFSPRING GENERATION TESTS
// =============================================================================

describe('generateOffspring', () => {
  it('should generate valid offspring from two parents', () => {
    const parent1 = createMockCreature({
      species: 'slime',
      level: 10,
      generation: 1,
    });
    const parent2 = createMockCreature({
      species: 'goblin',
      level: 8,
      generation: 0,
    });

    const result = generateOffspring(parent1, parent2);

    expect(result.success).toBe(true);
    expect(result.offspring).toBeDefined();
    expect(result.messages.length).toBeGreaterThan(0);
  });

  it('should determine species from parents (50/50)', () => {
    const parent1 = createMockCreature({ species: 'slime' });
    const parent2 = createMockCreature({ species: 'goblin' });

    const results = [];
    for (let i = 0; i < 50; i++) {
      const result = generateOffspring(parent1, parent2);
      results.push(result.offspringSpecies);
    }

    // Should have both species represented
    expect(results).toContain('slime');
    expect(results).toContain('goblin');
  });

  it('should use recipe species when provided', () => {
    const parent1 = createMockCreature({ species: 'slime' });
    const parent2 = createMockCreature({ species: 'goblin' });
    const recipe = createMockRecipe({ offspringSpecies: 'dragon' });

    const result = generateOffspring(parent1, parent2, recipe);

    expect(result.offspringSpecies).toBe('dragon');
  });

  it('should set generation to max parent gen + 1', () => {
    const parent1 = createMockCreature({ generation: 2 });
    const parent2 = createMockCreature({ generation: 3 });

    const result = generateOffspring(parent1, parent2);

    expect(result.generation).toBe(4);
  });

  it('should cap generation at 5', () => {
    const parent1 = createMockCreature({ generation: 5 });
    const parent2 = createMockCreature({ generation: 4 });

    const result = generateOffspring(parent1, parent2);

    expect(result.generation).toBe(5);
  });

  it('should set parentIds to track lineage', () => {
    const parent1 = createMockCreature({ creatureId: 'parent_1' });
    const parent2 = createMockCreature({ creatureId: 'parent_2' });

    const result = generateOffspring(parent1, parent2);

    expect(result.offspring?.parentIds).toEqual(['parent_1', 'parent_2']);
  });

  it('should initialize offspring at level 1', () => {
    const parent1 = createMockCreature({ level: 20 });
    const parent2 = createMockCreature({ level: 15 });

    const result = generateOffspring(parent1, parent2);

    expect(result.offspring?.level).toBe(1);
  });

  it('should initialize breedingCount and exhaustionLevel to 0', () => {
    const parent1 = createMockCreature({ breedingCount: 5, exhaustionLevel: 3 });
    const parent2 = createMockCreature({ breedingCount: 2, exhaustionLevel: 1 });

    const result = generateOffspring(parent1, parent2);

    expect(result.offspring?.breedingCount).toBe(0);
    expect(result.offspring?.exhaustionLevel).toBe(0);
  });

  it('should include inherited abilities in result', () => {
    const parent1 = createMockCreature({ abilities: ['fireball'] });
    const parent2 = createMockCreature({ abilities: ['ice_blast'] });

    // Force ability inheritance
    const originalRandom = Math.random;
    Math.random = jest.fn(() => 0.1);

    const result = generateOffspring(parent1, parent2);

    expect(result.inheritedAbilities.length).toBeGreaterThan(0);

    Math.random = originalRandom;
  });

  it('should include recipe in result if used', () => {
    const parent1 = createMockCreature();
    const parent2 = createMockCreature();
    const recipe = createMockRecipe({ id: 'special_recipe' });

    const result = generateOffspring(parent1, parent2, recipe);

    expect(result.recipeUsed).toBeDefined();
    expect(result.recipeUsed?.id).toBe('special_recipe');
  });

  it('should include rarity upgrade flag in result', () => {
    const parent1 = createMockCreature({ rarity: 'common' });
    const parent2 = createMockCreature({ rarity: 'common' });

    // Run multiple times to eventually get an upgrade
    let foundUpgrade = false;
    for (let i = 0; i < 100; i++) {
      const result = generateOffspring(parent1, parent2);
      if (result.rarityUpgraded) {
        foundUpgrade = true;
        expect(result.offspring?.rarity).toBe('uncommon');
        break;
      }
    }

    // Should eventually find an upgrade with 10% probability
    expect(foundUpgrade).toBe(true);
  });

  it('should set stat caps based on generation', () => {
    const parent1 = createMockCreature({ generation: 2 });
    const parent2 = createMockCreature({ generation: 2 });

    const result = generateOffspring(parent1, parent2);

    // Generation 3 should have 130 stat caps
    expect(result.offspring?.statCaps?.attack).toBe(130);
  });

  it('should include cost in result', () => {
    const parent1 = createMockCreature({ level: 10 });
    const parent2 = createMockCreature({ level: 10 });

    const result = generateOffspring(parent1, parent2);

    expect(result.costPaid).toBeDefined();
    expect(result.costPaid.goldAmount).toBeGreaterThan(0);
  });
});
