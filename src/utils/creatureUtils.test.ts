/**
 * Creature Utilities Test Suite
 * Comprehensive tests for creature breeding, combat calculations, trading, and management
 */

import {
  filterCreatures,
  searchCreatures,
  getCreaturesByType,
  getCreaturesByElement,
  sortCreatures,
  isBreedingEligible,
  checkBreedingCompatibility,
  calculatePersonalityCompatibility,
  generateOffspringPredictions,
  breedCreatures,
  getInheritedElement,
  getInheritedRarity,
  upgradeRarity,
  mixTraits,
  generateRandomTraits,
  getRandomElement,
  generateNPCTraders,
  canMakeTrade,
  executeNPCTrade,
  calculateCombatStats,
  getTypeEffectiveness,
  calculateDamage,
  calculateExperienceGain,
  calculateCreatureRating,
  getTypeAdvantages,
  getCollectionStats
} from './creatureUtils';

import {
  EnhancedCreature,
  CreatureType,
  CreatureElement,
  CreatureRarity,
  CreatureFilter
} from '../types/creatures';

describe('creatureUtils', () => {
  // Mock creatures for testing
  const mockCreatures: EnhancedCreature[] = [
    {
      id: 'creature_1',
      creatureId: 'wolf_001',
      name: 'Forest Wolf',
      species: 'wolf',
      level: 15,
      hp: 120,
      attack: 18,
      defense: 12,
      magicAttack: 8,
      magicDefense: 10,
      speed: 22,
      element: 'earth',
      creatureType: 'beast',
      rarity: 'common',
      breedingGroup: ['beast', 'predator'],
      fertility: 85,
      habitat: ['forest', 'mountains'],
      discoveredAt: new Date('2023-01-01'),
      capturedAt: new Date('2023-01-02'),
      captureLocation: 'dark_forest',
      collectionStatus: {
        discovered: true,
        captured: true,
        seen: true,
        timesEncountered: 3
      },
      personality: {
        traits: ['aggressive', 'loyal'],
        dominantTrait: 'aggressive',
        compatibility: 70,
        mood: 'neutral',
        happiness: 80,
        loyalty: 90,
        energy: 75
      },
      individualStats: {
        hpIV: 20,
        attackIV: 25,
        defenseIV: 15,
        magicAttackIV: 10,
        magicDefenseIV: 12,
        speedIV: 28
      },
      nature: {
        name: 'Adamant',
        statModifiers: {
          attack: 2,
          speed: -1
        }
      },
      genetics: {
        parentIds: [],
        generation: 0,
        inheritedTraits: ['aggressive'],
        mutations: [],
        breedingPotential: 100
      },
      companionData: {
        isCompanion: true,
        isActive: true,
        isActiveTeamMember: true,
        bond: 75,
        experience: 1200,
        lastInteraction: new Date()
      }
    },
    {
      id: 'creature_2',
      creatureId: 'phoenix_001',
      name: 'Fire Phoenix',
      species: 'phoenix',
      level: 25,
      hp: 180,
      attack: 30,
      defense: 20,
      magicAttack: 45,
      magicDefense: 35,
      speed: 40,
      element: 'fire',
      creatureType: 'elemental',
      rarity: 'legendary',
      breedingGroup: ['elemental', 'divine'],
      fertility: 60,
      habitat: ['volcano', 'desert'],
      discoveredAt: new Date('2023-02-01'),
      capturedAt: new Date('2023-02-02'),
      captureLocation: 'fire_temple',
      collectionStatus: {
        discovered: true,
        captured: true,
        seen: true,
        timesEncountered: 1
      },
      personality: {
        traits: ['proud', 'noble'],
        dominantTrait: 'proud',
        compatibility: 50,
        mood: 'content',
        happiness: 90,
        loyalty: 60,
        energy: 85
      },
      individualStats: {
        hpIV: 31,
        attackIV: 28,
        defenseIV: 20,
        magicAttackIV: 31,
        magicDefenseIV: 30,
        speedIV: 31
      },
      nature: {
        name: 'Modest',
        statModifiers: {
          magicAttack: 2,
          attack: -1
        }
      },
      genetics: {
        parentIds: [],
        generation: 0,
        inheritedTraits: ['proud'],
        mutations: ['fire_immunity'],
        breedingPotential: 120
      },
      companionData: {
        isCompanion: true,
        isActive: false,
        isActiveTeamMember: false,
        bond: 45,
        experience: 3000,
        lastInteraction: new Date(Date.now() - 86400000) // 1 day ago
      }
    },
    {
      id: 'creature_3',
      creatureId: 'sprite_001',
      name: 'Water Sprite',
      species: 'sprite',
      level: 8,
      hp: 60,
      attack: 12,
      defense: 8,
      magicAttack: 25,
      magicDefense: 20,
      speed: 35,
      element: 'water',
      creatureType: 'fey',
      rarity: 'uncommon',
      breedingGroup: ['fey', 'spirit'],
      fertility: 95,
      habitat: ['lake', 'river'],
      discoveredAt: new Date('2023-01-15'),
      capturedAt: undefined, // Not captured
      collectionStatus: {
        discovered: true,
        captured: false,
        seen: true,
        timesEncountered: 2
      },
      personality: {
        traits: ['playful', 'curious'],
        dominantTrait: 'playful',
        compatibility: 85,
        mood: 'happy',
        happiness: 95,
        loyalty: 40,
        energy: 90
      }
    }
  ];

  describe('filterCreatures', () => {
    it('should filter creatures by type', () => {
      const filter: CreatureFilter = { types: ['beast'] };
      const result = filterCreatures(mockCreatures, filter);

      expect(result).toHaveLength(1);
      expect(result[0].creatureType).toBe('beast');
    });

    it('should filter creatures by element', () => {
      const filter: CreatureFilter = { elements: ['fire', 'water'] };
      const result = filterCreatures(mockCreatures, filter);

      expect(result).toHaveLength(2);
      expect(result.every(c => ['fire', 'water'].includes(c.element))).toBe(true);
    });

    it('should filter creatures by rarity', () => {
      const filter: CreatureFilter = { rarities: ['legendary'] };
      const result = filterCreatures(mockCreatures, filter);

      expect(result).toHaveLength(1);
      expect(result[0].rarity).toBe('legendary');
    });

    it('should filter creatures by level range', () => {
      const filter: CreatureFilter = { minLevel: 10, maxLevel: 20 };
      const result = filterCreatures(mockCreatures, filter);

      expect(result).toHaveLength(1);
      expect(result[0].level).toBe(15);
    });

    it('should filter creatures by capture status', () => {
      const filter: CreatureFilter = { capturedOnly: true };
      const result = filterCreatures(mockCreatures, filter);

      expect(result).toHaveLength(2);
      expect(result.every(c => c.capturedAt !== undefined)).toBe(true);
    });

    it('should filter creatures by team status', () => {
      const filter: CreatureFilter = { inTeamOnly: true };
      const result = filterCreatures(mockCreatures, filter);

      expect(result).toHaveLength(1);
      expect(result[0].companionData?.isActive).toBe(true);
    });

    it('should filter creatures by breeding eligibility', () => {
      const filter: CreatureFilter = { breedingEligible: true };
      const result = filterCreatures(mockCreatures, filter);

      expect(result.length).toBeGreaterThan(0);
      result.forEach(creature => {
        expect(isBreedingEligible(creature)).toBe(true);
      });
    });

    it('should filter creatures by habitat', () => {
      const filter: CreatureFilter = { habitats: ['forest'] };
      const result = filterCreatures(mockCreatures, filter);

      expect(result).toHaveLength(1);
      expect(result[0].habitat.includes('forest')).toBe(true);
    });
  });

  describe('searchCreatures', () => {
    it('should search creatures by name', () => {
      const result = searchCreatures(mockCreatures, 'wolf');

      expect(result).toHaveLength(1);
      expect(result[0].name.toLowerCase()).toContain('wolf');
    });

    it('should search creatures by species', () => {
      const result = searchCreatures(mockCreatures, 'phoenix');

      expect(result).toHaveLength(1);
      expect(result[0].species).toBe('phoenix');
    });

    it('should return all creatures for empty query', () => {
      const result = searchCreatures(mockCreatures, '');

      expect(result).toHaveLength(mockCreatures.length);
    });

    it('should search in specific fields only', () => {
      const result = searchCreatures(mockCreatures, 'fire', ['name']);

      expect(result).toHaveLength(1);
      expect(result[0].name.toLowerCase()).toContain('fire');
    });
  });

  describe('getCreaturesByType', () => {
    it('should return creatures of specified type', () => {
      const result = getCreaturesByType(mockCreatures, 'elemental');

      expect(result).toHaveLength(1);
      expect(result[0].creatureType).toBe('elemental');
    });
  });

  describe('getCreaturesByElement', () => {
    it('should return creatures of specified element', () => {
      const result = getCreaturesByElement(mockCreatures, 'fire');

      expect(result).toHaveLength(1);
      expect(result[0].element).toBe('fire');
    });
  });

  describe('sortCreatures', () => {
    it('should sort creatures by name', () => {
      const result = sortCreatures(mockCreatures, 'name', 'asc');

      expect(result[0].name).toBe('Fire Phoenix');
      expect(result[2].name).toBe('Water Sprite');
    });

    it('should sort creatures by level descending', () => {
      const result = sortCreatures(mockCreatures, 'level', 'desc');

      expect(result[0].level).toBe(25);
      expect(result[2].level).toBe(8);
    });

    it('should sort creatures by rarity', () => {
      const result = sortCreatures(mockCreatures, 'rarity', 'asc');

      const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
      for (let i = 1; i < result.length; i++) {
        const prevIndex = rarityOrder.indexOf(result[i-1].rarity as string);
        const currIndex = rarityOrder.indexOf(result[i].rarity as string);
        expect(prevIndex).toBeLessThanOrEqual(currIndex);
      }
    });

    it('should sort creatures by stats', () => {
      const result = sortCreatures(mockCreatures, 'attack', 'desc');

      expect(result[0].attack).toBeGreaterThanOrEqual(result[1].attack);
      expect(result[1].attack).toBeGreaterThanOrEqual(result[2].attack);
    });
  });

  describe('isBreedingEligible', () => {
    it('should allow breeding for eligible creatures', () => {
      const result = isBreedingEligible(mockCreatures[0]); // Level 15, captured, good fertility

      expect(result).toBe(true);
    });

    it('should reject uncaptured creatures', () => {
      const result = isBreedingEligible(mockCreatures[2]); // Not captured

      expect(result).toBe(false);
    });

    it('should reject low-level creatures', () => {
      const lowLevelCreature = { ...mockCreatures[0], level: 5 };
      const result = isBreedingEligible(lowLevelCreature);

      expect(result).toBe(false);
    });

    it('should reject creatures with zero fertility', () => {
      const infertileCreature = { ...mockCreatures[0], fertility: 0 };
      const result = isBreedingEligible(infertileCreature);

      expect(result).toBe(false);
    });

    it('should reject exhausted creatures', () => {
      const exhaustedCreature = {
        ...mockCreatures[0],
        personality: {
          ...mockCreatures[0].personality!,
          energy: 20 // Too low
        }
      };
      const result = isBreedingEligible(exhaustedCreature);

      expect(result).toBe(false);
    });
  });

  describe('checkBreedingCompatibility', () => {
    it('should allow breeding between compatible creatures', () => {
      const creature1 = mockCreatures[0]; // Wolf
      const creature2 = { ...mockCreatures[0], creatureId: 'wolf_002', name: 'Mountain Wolf' }; // Same species

      const result = checkBreedingCompatibility(creature1, creature2);

      expect(result.compatible).toBe(true);
      expect(result.compatibilityScore).toBeGreaterThan(30);
      expect(result.successChance).toBeGreaterThan(0);
      expect(result.offspringPredictions.length).toBeGreaterThan(0);
    });

    it('should reject breeding creature with itself', () => {
      const result = checkBreedingCompatibility(mockCreatures[0], mockCreatures[0]);

      expect(result.compatible).toBe(false);
      expect(result.reasons).toContain('Cannot breed creature with itself');
    });

    it('should reject breeding between incompatible breeding groups', () => {
      const creature1 = mockCreatures[0]; // beast/predator
      const creature2 = {
        ...mockCreatures[0],
        creatureId: 'different_001',
        breedingGroup: ['fish', 'aquatic'] // Different groups
      };

      const result = checkBreedingCompatibility(creature1, creature2);

      expect(result.compatible).toBe(false);
      expect(result.reasons).toContain('No shared breeding groups');
    });

    it('should calculate compatibility score based on species similarity', () => {
      const creature1 = mockCreatures[0]; // Wolf
      const creature2 = { ...mockCreatures[0], creatureId: 'wolf_002' }; // Same species

      const result = checkBreedingCompatibility(creature1, creature2);

      expect(result.compatibilityScore).toBeGreaterThan(50); // Same species bonus
    });

    it('should apply level difference penalty', () => {
      const creature1 = mockCreatures[0]; // Level 15
      const creature2 = { ...mockCreatures[0], creatureId: 'wolf_002', level: 5 }; // Large level difference

      const result = checkBreedingCompatibility(creature1, creature2);

      expect(result.compatibilityScore).toBeLessThan(100); // Penalty applied
    });

    it('should consider personality compatibility', () => {
      const creature1 = mockCreatures[0];
      const creature2 = {
        ...mockCreatures[0],
        creatureId: 'wolf_002',
        personality: {
          ...mockCreatures[0].personality!,
          mood: 'happy', // Compatible with neutral
          traits: ['protective', 'loyal'] // Compatible traits
        }
      };

      const result = checkBreedingCompatibility(creature1, creature2);

      expect(result.compatibilityScore).toBeGreaterThan(50);
    });
  });

  describe('calculatePersonalityCompatibility', () => {
    it('should calculate compatibility based on mood', () => {
      const personality1 = mockCreatures[0].personality!;
      const personality2 = {
        ...personality1,
        mood: 'content' // Compatible with neutral
      };

      const result = calculatePersonalityCompatibility(personality1, personality2);

      expect(result).toBeGreaterThan(0);
    });

    it('should give bonus for compatible traits', () => {
      const personality1 = { ...mockCreatures[0].personality!, traits: ['aggressive'] };
      const personality2 = { ...mockCreatures[0].personality!, traits: ['protective'] };

      const result = calculatePersonalityCompatibility(personality1, personality2);

      expect(result).toBeGreaterThan(0);
    });

    it('should penalize large differences in loyalty and happiness', () => {
      const personality1 = { ...mockCreatures[0].personality!, loyalty: 90, happiness: 90 };
      const personality2 = { ...mockCreatures[0].personality!, loyalty: 10, happiness: 10 };

      const result = calculatePersonalityCompatibility(personality1, personality2);

      expect(result).toBeLessThan(0);
    });
  });

  describe('generateOffspringPredictions', () => {
    it('should generate multiple prediction outcomes', () => {
      const result = generateOffspringPredictions(mockCreatures[0], mockCreatures[1]);

      expect(result).toHaveLength(3); // Primary, hybrid, mutation
      expect(result.some(p => p.type === 'primary')).toBe(true);
      expect(result.some(p => p.type === 'hybrid')).toBe(true);
      expect(result.some(p => p.type === 'mutation')).toBe(true);
    });

    it('should assign correct chances to each outcome', () => {
      const result = generateOffspringPredictions(mockCreatures[0], mockCreatures[1]);

      const primary = result.find(p => p.type === 'primary');
      const hybrid = result.find(p => p.type === 'hybrid');
      const mutation = result.find(p => p.type === 'mutation');

      expect(primary?.chance).toBe(75);
      expect(hybrid?.chance).toBe(20);
      expect(mutation?.chance).toBe(5);
    });
  });

  describe('getInheritedElement', () => {
    it('should return same element for identical parents', () => {
      const result = getInheritedElement('fire', 'fire');

      expect(result).toBe('fire');
    });

    it('should combine different elements according to rules', () => {
      const result = getInheritedElement('fire', 'water');

      expect(result).toBe('neutral');
    });

    it('should handle unknown combinations', () => {
      const result = getInheritedElement('light', 'nature');

      expect(['light', 'nature']).toContain(result); // Should be one of the parents
    });
  });

  describe('getInheritedRarity', () => {
    it('should average parent rarities', () => {
      const result = getInheritedRarity('common', 'rare');

      expect(['common', 'uncommon', 'rare']).toContain(result);
    });

    it('should handle same rarity parents', () => {
      const result = getInheritedRarity('epic', 'epic');

      expect(['rare', 'epic', 'legendary']).toContain(result); // Base or slight variation
    });

    it('should handle extreme rarities', () => {
      const result = getInheritedRarity('mythical', 'mythical');

      expect(result).toBeDefined();
    });
  });

  describe('upgradeRarity', () => {
    it('should upgrade rarity by one tier', () => {
      expect(upgradeRarity('common')).toBe('uncommon');
      expect(upgradeRarity('rare')).toBe('epic');
      expect(upgradeRarity('legendary')).toBe('mythical');
    });

    it('should not upgrade beyond mythical', () => {
      expect(upgradeRarity('mythical')).toBe('mythical');
    });
  });

  describe('mixTraits', () => {
    it('should combine traits from both parents', () => {
      const traits1 = ['aggressive', 'loyal'];
      const traits2 = ['protective', 'brave'];

      const result = mixTraits(traits1, traits2);

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(3); // Max 3 traits
    });

    it('should add new traits when enhanced', () => {
      const traits1 = ['aggressive'];
      const traits2 = ['loyal'];

      const result = mixTraits(traits1, traits2, true);

      expect(result.length).toBeGreaterThan(1); // Should add new trait
    });

    it('should remove duplicates', () => {
      const traits1 = ['aggressive', 'loyal'];
      const traits2 = ['aggressive', 'brave']; // Duplicate 'aggressive'

      const result = mixTraits(traits1, traits2);

      const uniqueTraits = new Set(result);
      expect(uniqueTraits.size).toBe(result.length); // No duplicates
    });
  });

  describe('generateRandomTraits', () => {
    it('should generate valid traits', () => {
      const result = generateRandomTraits();

      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(3);

      const validTraits = ['aggressive', 'docile', 'playful', 'serious', 'curious', 'lazy', 'energetic', 'protective', 'independent', 'clingy'];
      result.forEach(trait => {
        expect(validTraits).toContain(trait);
      });
    });

    it('should not generate duplicate traits', () => {
      const result = generateRandomTraits();

      const uniqueTraits = new Set(result);
      expect(uniqueTraits.size).toBe(result.length);
    });
  });

  describe('getRandomElement', () => {
    it('should return a valid element', () => {
      const result = getRandomElement();

      const validElements = ['fire', 'water', 'earth', 'air', 'light', 'dark', 'ice', 'lightning', 'nature', 'neutral'];
      expect(validElements).toContain(result);
    });
  });

  describe('breedCreatures', () => {
    it('should create offspring from compatible parents', () => {
      const parent1 = mockCreatures[0];
      const parent2 = { ...mockCreatures[0], creatureId: 'wolf_002', name: 'Mountain Wolf' };

      const result = breedCreatures(parent1, parent2);

      expect(result.genetics?.parentIds).toEqual([parent1.creatureId, parent2.creatureId]);
      expect(result.genetics?.generation).toBe(1);
      expect(result.level).toBe(1);
      expect(result.capturedAt).toBeDefined();
      expect(result.hp).toBeGreaterThan(0);
      expect(result.attack).toBeGreaterThan(0);
    });

    it('should throw error for incompatible creatures', () => {
      const parent1 = mockCreatures[0];
      const parent2 = mockCreatures[2]; // Not captured, won't be eligible

      expect(() => breedCreatures(parent1, parent2)).toThrow();
    });

    it('should inherit stats from parents with variance', () => {
      const parent1 = mockCreatures[0]; // HP: 120, Attack: 18
      const parent2 = { ...mockCreatures[0], creatureId: 'wolf_002', hp: 100, attack: 20 };

      const result = breedCreatures(parent1, parent2);

      // Stats should be based on parent averages with variance
      expect(result.hp).toBeGreaterThan(70); // ~88 with 0.8-1.2 variance
      expect(result.hp).toBeLessThan(130);
      expect(result.attack).toBeGreaterThan(12); // ~19 with variance
      expect(result.attack).toBeLessThan(25);
    });

    it('should set appropriate companion data for offspring', () => {
      const parent1 = mockCreatures[0];
      const parent2 = { ...mockCreatures[0], creatureId: 'wolf_002' };

      const result = breedCreatures(parent1, parent2);

      expect(result.companionData?.isCompanion).toBe(false);
      expect(result.companionData?.bond).toBe(10); // Start with low bond
      expect(result.companionData?.experience).toBe(0);
    });
  });

  describe('generateNPCTraders', () => {
    it('should generate multiple traders', () => {
      const result = generateNPCTraders();

      expect(result.length).toBeGreaterThan(0);
      result.forEach(trader => {
        expect(trader.id).toBeDefined();
        expect(trader.name).toBeDefined();
        expect(trader.trades.length).toBeGreaterThan(0);
      });
    });

    it('should generate traders with different specialties', () => {
      const result = generateNPCTraders();

      const specialties = result.map(t => t.specialty);
      expect(new Set(specialties).size).toBeGreaterThan(1); // Multiple different specialties
    });

    it('should generate valid trade offers', () => {
      const result = generateNPCTraders();

      result.forEach(trader => {
        trader.trades.forEach(trade => {
          expect(trade.id).toBeDefined();
          expect(trade.wants).toBeDefined();
          expect(trade.offers).toBeDefined();
          expect(trade.availability).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('canMakeTrade', () => {
    const traders = generateNPCTraders();
    const beastTrader = traders.find(t => t.specialty === 'beast')!;
    const beastTrade = beastTrader.trades[0];

    it('should allow valid trades', () => {
      const playerCreature = {
        ...mockCreatures[0],
        creatureType: 'beast' as CreatureType,
        level: 10
      };

      const result = canMakeTrade(beastTrader, beastTrade, playerCreature);

      expect(result.canTrade).toBe(true);
    });

    it('should reject trades with insufficient availability', () => {
      const unavailableTrade = { ...beastTrade, availability: 0 };
      const result = canMakeTrade(beastTrader, unavailableTrade, mockCreatures[0]);

      expect(result.canTrade).toBe(false);
      expect(result.reason).toContain('no longer available');
    });

    it('should reject trades with unmet requirements', () => {
      const highRepTrade = {
        ...beastTrade,
        requirements: { minReputation: 80 }
      };

      const result = canMakeTrade(beastTrader, highRepTrade, mockCreatures[0], 50);

      expect(result.canTrade).toBe(false);
      expect(result.reason).toContain('reputation');
    });

    it('should validate creature requirements', () => {
      const specificTrade = {
        ...beastTrade,
        wants: { species: 'dragon', minLevel: 20 }
      };

      const result = canMakeTrade(beastTrader, specificTrade, mockCreatures[0]);

      expect(result.canTrade).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });

  describe('executeNPCTrade', () => {
    const traders = generateNPCTraders();
    const trader = traders[0];
    const trade = trader.trades[0];

    it('should execute successful trade', () => {
      const playerCreature = {
        ...mockCreatures[0],
        creatureType: trader.specialty === 'all' ? 'beast' : trader.specialty,
        level: 15
      };

      const result = executeNPCTrade(trader, trade, playerCreature);

      expect(result.success).toBe(true);
      if (trade.offers.species) {
        expect(result.receivedCreature).toBeDefined();
        expect(result.receivedCreature?.level).toBe(trade.offers.level);
      }
      if (trade.offers.currency) {
        expect(result.receivedCurrency).toBe(trade.offers.currency);
      }
    });

    it('should fail trade for invalid conditions', () => {
      const invalidCreature = {
        ...mockCreatures[0],
        level: 1 // Too low level
      };

      const result = executeNPCTrade(trader, trade, invalidCreature);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should create NPC creature with correct properties', () => {
      const playerCreature = {
        ...mockCreatures[0],
        creatureType: trader.specialty === 'all' ? 'beast' : trader.specialty,
        level: 15
      };

      const result = executeNPCTrade(trader, trade, playerCreature);

      if (result.receivedCreature) {
        expect(result.receivedCreature.captureLocation).toBe(trader.location);
        expect(result.receivedCreature.companionData?.bond).toBe(20); // Higher bond for traded creatures
        expect(result.receivedCreature.genetics?.generation).toBe(0);
        expect(result.receivedCreature.individualStats).toBeDefined();
      }
    });
  });

  describe('calculateCombatStats', () => {
    it('should calculate base combat stats', () => {
      const result = calculateCombatStats(mockCreatures[0]);

      expect(result.hp).toBeGreaterThan(mockCreatures[0].hp);
      expect(result.attack).toBeGreaterThan(mockCreatures[0].attack);
      expect(result.accuracy).toBeGreaterThan(0);
      expect(result.evasion).toBeGreaterThan(0);
      expect(result.criticalRate).toBeGreaterThan(0);
    });

    it('should apply individual values (IVs)', () => {
      const creature = mockCreatures[0];
      const result = calculateCombatStats(creature);

      // IVs should boost stats based on level
      const expectedHpBoost = Math.floor(creature.individualStats!.hpIV * creature.level / 100);
      expect(result.hp).toBeGreaterThanOrEqual(creature.hp + expectedHpBoost);
    });

    it('should apply nature modifiers', () => {
      const creature = mockCreatures[0]; // Has Adamant nature (+attack, -speed)
      const result = calculateCombatStats(creature);

      expect(result.attack).toBeGreaterThan(creature.attack + 2); // Nature bonus
      expect(result.speed).toBeLessThan(creature.speed * 2); // Level scaling minus nature penalty
    });

    it('should scale stats by level', () => {
      const lowLevel = { ...mockCreatures[0], level: 1 };
      const highLevel = { ...mockCreatures[0], level: 50 };

      const lowResult = calculateCombatStats(lowLevel);
      const highResult = calculateCombatStats(highLevel);

      expect(highResult.hp).toBeGreaterThan(lowResult.hp);
      expect(highResult.attack).toBeGreaterThan(lowResult.attack);
    });
  });

  describe('getTypeEffectiveness', () => {
    it('should return correct effectiveness multipliers', () => {
      expect(getTypeEffectiveness('fire', 'water')).toBe(0.5); // Fire weak vs Water
      expect(getTypeEffectiveness('fire', 'earth')).toBe(2.0); // Fire strong vs Earth
      expect(getTypeEffectiveness('fire', 'fire')).toBe(1.0); // Neutral
    });

    it('should handle unknown type combinations', () => {
      expect(getTypeEffectiveness('unknown' as CreatureElement, 'fire')).toBe(1.0);
    });
  });

  describe('calculateDamage', () => {
    const attacker = mockCreatures[1]; // Phoenix - high magic attack
    const defender = mockCreatures[0]; // Wolf - moderate defense

    it('should calculate physical damage', () => {
      const result = calculateDamage(attacker, defender, 'physical');

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(attacker.attack * 2); // Reasonable damage range
    });

    it('should calculate magical damage', () => {
      const result = calculateDamage(attacker, defender, 'magical');

      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThan(attacker.magicAttack! * 2);
    });

    it('should apply elemental effectiveness', () => {
      const fireVsWater = calculateDamage(attacker, { ...defender, element: 'water' }, 'elemental');
      const fireVsEarth = calculateDamage(attacker, { ...defender, element: 'earth' }, 'elemental');

      expect(fireVsEarth).toBeGreaterThan(fireVsWater); // Fire strong vs Earth, weak vs Water
    });

    it('should ensure minimum damage', () => {
      const weakAttacker = { ...attacker, attack: 1, magicAttack: 1 };
      const strongDefender = { ...defender, defense: 100, magicDefense: 100 };

      const result = calculateDamage(weakAttacker, strongDefender);

      expect(result).toBeGreaterThanOrEqual(1); // Minimum damage
    });
  });

  describe('calculateExperienceGain', () => {
    it('should calculate base experience', () => {
      const victor = mockCreatures[0];
      const defeated = mockCreatures[1];

      const result = calculateExperienceGain(victor, defeated);

      expect(result).toBeGreaterThan(0);
      expect(result).toBe(Math.floor(defeated.level * 100 * 1.0 * 3.0)); // Base * level diff * rarity
    });

    it('should apply level difference modifier', () => {
      const lowLevel = { ...mockCreatures[0], level: 5 };
      const highLevel = { ...mockCreatures[1], level: 25 };

      const upwardFight = calculateExperienceGain(lowLevel, highLevel);
      const downwardFight = calculateExperienceGain(highLevel, lowLevel);

      expect(upwardFight).toBeGreaterThan(downwardFight); // More XP for defeating higher level
    });

    it('should apply rarity multiplier', () => {
      const commonDefeated = { ...mockCreatures[0], rarity: 'common' as CreatureRarity };
      const legendaryDefeated = { ...mockCreatures[0], rarity: 'legendary' as CreatureRarity };

      const commonXP = calculateExperienceGain(mockCreatures[0], commonDefeated);
      const legendaryXP = calculateExperienceGain(mockCreatures[0], legendaryDefeated);

      expect(legendaryXP).toBeGreaterThan(commonXP);
    });

    it('should apply participation rate', () => {
      const fullParticipation = calculateExperienceGain(mockCreatures[0], mockCreatures[1], 1.0);
      const halfParticipation = calculateExperienceGain(mockCreatures[0], mockCreatures[1], 0.5);

      expect(halfParticipation).toBe(Math.floor(fullParticipation * 0.5));
    });
  });

  describe('calculateCreatureRating', () => {
    it('should calculate comprehensive creature rating', () => {
      const result = calculateCreatureRating(mockCreatures[1]); // Phoenix - high stats

      expect(result).toBeGreaterThan(0);
      expect(result).toBeGreaterThan(calculateCreatureRating(mockCreatures[0])); // Phoenix > Wolf
    });

    it('should include level bonus', () => {
      const lowLevel = { ...mockCreatures[0], level: 1 };
      const highLevel = { ...mockCreatures[0], level: 50 };

      const lowRating = calculateCreatureRating(lowLevel);
      const highRating = calculateCreatureRating(highLevel);

      expect(highRating).toBeGreaterThan(lowRating);
    });

    it('should include rarity bonus', () => {
      const common = { ...mockCreatures[0], rarity: 'common' as CreatureRarity };
      const legendary = { ...mockCreatures[0], rarity: 'legendary' as CreatureRarity };

      const commonRating = calculateCreatureRating(common);
      const legendaryRating = calculateCreatureRating(legendary);

      expect(legendaryRating).toBeGreaterThan(commonRating);
    });

    it('should include IV bonus', () => {
      const perfectIVs = {
        hpIV: 31, attackIV: 31, defenseIV: 31,
        magicAttackIV: 31, magicDefenseIV: 31, speedIV: 31
      };

      const perfectCreature = { ...mockCreatures[0], individualStats: perfectIVs };
      const normalCreature = mockCreatures[0];

      const perfectRating = calculateCreatureRating(perfectCreature);
      const normalRating = calculateCreatureRating(normalCreature);

      expect(perfectRating).toBeGreaterThan(normalRating);
    });
  });

  describe('getTypeAdvantages', () => {
    it('should return type advantages for beast', () => {
      const result = getTypeAdvantages('beast');

      expect(result.strongAgainst).toContain('plant');
      expect(result.strongAgainst).toContain('insect');
      expect(result.weakAgainst).toContain('construct');
      expect(result.weakAgainst).toContain('undead');
    });

    it('should handle unknown types', () => {
      const result = getTypeAdvantages('unknown' as CreatureType);

      expect(result.strongAgainst).toEqual([]);
      expect(result.weakAgainst).toEqual([]);
    });
  });

  describe('getCollectionStats', () => {
    it('should calculate collection statistics', () => {
      const result = getCollectionStats(mockCreatures, 100);

      expect(result.discovered).toBe(mockCreatures.length);
      expect(result.captured).toBe(2); // Two captured creatures
      expect(result.total).toBe(100);
      expect(result.discoveryPercentage).toBe(3); // 3/100 * 100
      expect(result.capturePercentage).toBe(66.67); // 2/3 * 100 (rounded)
      expect(result.completionPercentage).toBe(2); // 2/100 * 100
    });

    it('should group creatures by type', () => {
      const result = getCollectionStats(mockCreatures);

      expect(result.byType.beast).toBe(1);
      expect(result.byType.elemental).toBe(1);
      expect(result.byType.fey).toBe(1);
    });

    it('should group creatures by element', () => {
      const result = getCollectionStats(mockCreatures);

      expect(result.byElement.earth).toBe(1);
      expect(result.byElement.fire).toBe(1);
      expect(result.byElement.water).toBe(1);
    });

    it('should group creatures by rarity', () => {
      const result = getCollectionStats(mockCreatures);

      expect(result.byRarity.common).toBe(1);
      expect(result.byRarity.uncommon).toBe(1);
      expect(result.byRarity.legendary).toBe(1);
    });

    it('should calculate level statistics', () => {
      const result = getCollectionStats(mockCreatures);

      expect(result.averageLevel).toBe((15 + 25 + 8) / 3);
      expect(result.highestLevel).toBe(25);
    });

    it('should calculate team size', () => {
      const result = getCollectionStats(mockCreatures);

      expect(result.teamSize).toBe(1); // Only one active team member
    });
  });
});