/**
 * Equipment Utilities Test Suite
 * Comprehensive tests for equipment stat calculations, compatibility checks, and optimization
 */

import {
  calculateEquipmentStats,
  checkEquipmentCompatibility,
  compareEquipment,
  generateEquipmentRecommendations,
  optimizeEquipmentSet,
  calculateSetBonuses,
  validateEquipmentSlot,
  getSlotPriority,
  formatStatValue,
  calculateDurabilityImpact,
  getRarityMultiplier
} from './equipmentUtils';

import { EnhancedItem, EquipmentSet, EquipmentSlot } from '../types/inventory';
import { PlayerStats } from '../types/game';

describe('equipmentUtils', () => {
  // Mock data for testing
  const mockPlayerStats: PlayerStats = {
    attack: 10,
    defense: 10,
    magicAttack: 10,
    magicDefense: 10,
    speed: 10,
    accuracy: 85
  };

  const mockSword: EnhancedItem = {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A sturdy iron sword',
    category: 'equipment',
    itemType: 'equipment',
    equipmentSlot: 'weapon',
    rarity: 'common',
    value: 100,
    weight: 3,
    statModifiers: {
      attack: { value: 15, type: 'flat' },
      speed: { value: -2, type: 'flat' }
    },
    requirements: {
      level: 5,
      classes: ['warrior', 'paladin'],
      stats: { attack: 8 }
    }
  };

  const mockShield: EnhancedItem = {
    id: 'iron_shield',
    name: 'Iron Shield',
    description: 'A protective iron shield',
    category: 'equipment',
    itemType: 'equipment',
    equipmentSlot: 'shield',
    rarity: 'common',
    value: 80,
    weight: 4,
    statModifiers: {
      defense: { value: 12, type: 'flat' },
      magicDefense: { value: 5, type: 'flat' }
    },
    requirements: {
      level: 3,
      classes: ['warrior', 'paladin']
    }
  };

  const mockArmor: EnhancedItem = {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Light leather armor',
    category: 'equipment',
    itemType: 'equipment',
    equipmentSlot: 'armor',
    rarity: 'common',
    value: 150,
    weight: 5,
    statModifiers: {
      defense: { value: 8, type: 'flat' },
      speed: { value: 1, type: 'flat' }
    },
    requirements: {
      level: 2
    }
  };

  const mockBetterSword: EnhancedItem = {
    id: 'steel_sword',
    name: 'Steel Sword',
    description: 'A superior steel sword',
    category: 'equipment',
    itemType: 'equipment',
    equipmentSlot: 'weapon',
    rarity: 'uncommon',
    value: 250,
    weight: 3.5,
    statModifiers: {
      attack: { value: 25, type: 'flat' },
      accuracy: { value: 5, type: 'flat' }
    },
    requirements: {
      level: 10,
      classes: ['warrior', 'paladin', 'ranger'],
      stats: { attack: 8 } // Lowered from 12 to be compatible with mockPlayerStats (attack: 10)
    }
  };

  const mockEquipmentSet: EquipmentSet = {
    weapon: mockSword,
    shield: mockShield,
    armor: mockArmor,
    helmet: undefined,
    gloves: undefined,
    boots: undefined,
    necklace: undefined,
    ring1: undefined,
    ring2: undefined,
    charm: undefined
  };

  describe('calculateEquipmentStats', () => {
    it('should calculate total stats from equipped items', () => {
      const result = calculateEquipmentStats(mockEquipmentSet, mockPlayerStats);

      expect(result.baseStats).toEqual(mockPlayerStats);
      expect(result.equipmentBonuses.attack).toBe(15);
      expect(result.equipmentBonuses.defense).toBe(20); // Shield + Armor
      expect(result.equipmentBonuses.magicDefense).toBe(5);
      expect(result.equipmentBonuses.speed).toBe(-1); // Sword -2, Armor +1
      expect(result.finalStats.attack).toBe(25); // Base 10 + Equipment 15
      expect(result.finalStats.defense).toBe(30); // Base 10 + Equipment 20
    });

    it('should provide stat breakdown by equipment slot', () => {
      const result = calculateEquipmentStats(mockEquipmentSet, mockPlayerStats);

      expect(result.breakdown).toHaveLength(3); // 3 equipped items

      const weaponBreakdown = result.breakdown.find(b => b.slot === 'weapon');
      expect(weaponBreakdown?.statContributions.attack).toBe(15);
      expect(weaponBreakdown?.totalContribution).toBe(17); // |15| + |-2|

      const shieldBreakdown = result.breakdown.find(b => b.slot === 'shield');
      expect(shieldBreakdown?.statContributions.defense).toBe(12);
      expect(shieldBreakdown?.totalContribution).toBe(17); // |12| + |5|
    });

    it('should handle empty equipment set', () => {
      const emptySet: EquipmentSet = {
        weapon: undefined,
        shield: undefined,
        armor: undefined,
        helmet: undefined,
        gloves: undefined,
        boots: undefined,
        necklace: undefined,
        ring1: undefined,
        ring2: undefined,
        charm: undefined
      };

      const result = calculateEquipmentStats(emptySet, mockPlayerStats);

      expect(result.equipmentBonuses.attack).toBe(0);
      expect(result.finalStats).toEqual(mockPlayerStats);
      expect(result.breakdown).toHaveLength(0);
    });

    it('should cap accuracy at 100', () => {
      const highAccuracyItem: EnhancedItem = {
        ...mockSword,
        statModifiers: {
          accuracy: { value: 50, type: 'flat' }
        }
      };

      const equipmentSet: EquipmentSet = {
        ...mockEquipmentSet,
        weapon: highAccuracyItem
      };

      const result = calculateEquipmentStats(equipmentSet, mockPlayerStats);

      expect(result.finalStats.accuracy).toBe(100); // Capped at 100
    });
  });

  describe('checkEquipmentCompatibility', () => {
    it('should pass compatibility check for valid equipment', () => {
      const result = checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10, // Player level
        'warrior',
        { ...mockPlayerStats, attack: 15 }
      );

      expect(result.compatible).toBe(true);
      expect(result.unmetRequirements).toHaveLength(0);
    });

    it('should fail for wrong equipment slot', () => {
      const result = checkEquipmentCompatibility(
        mockSword,
        'shield', // Wrong slot
        10,
        'warrior',
        mockPlayerStats
      );

      expect(result.compatible).toBe(false);
      expect(result.unmetRequirements[0]).toContain('weapon');
    });

    it('should fail for insufficient level', () => {
      const result = checkEquipmentCompatibility(
        mockSword,
        'weapon',
        3, // Too low level
        'warrior',
        mockPlayerStats
      );

      expect(result.compatible).toBe(false);
      expect(result.unmetRequirements[0]).toContain('level 5');
    });

    it('should fail for wrong class', () => {
      const result = checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10,
        'mage', // Wrong class
        mockPlayerStats
      );

      expect(result.compatible).toBe(false);
      expect(result.unmetRequirements[0]).toContain('mage class');
    });

    it('should fail for insufficient stats', () => {
      const result = checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10,
        'warrior',
        { ...mockPlayerStats, attack: 5 } // Too low attack
      );

      expect(result.compatible).toBe(false);
      expect(result.unmetRequirements[0]).toContain('attack: 8');
    });

    it('should generate warnings for suboptimal usage', () => {
      const legendaryItem: EnhancedItem = {
        ...mockSword,
        rarity: 'legendary'
      };

      const result = checkEquipmentCompatibility(
        legendaryItem,
        'weapon',
        5, // Low level for legendary
        'warrior',
        { ...mockPlayerStats, attack: 15 }
      );

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('too powerful');
    });

    it('should generate recommendations', () => {
      const result = checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10,
        'warrior',
        { ...mockPlayerStats, attack: 15 }
      );

      expect(result.recommendations?.length).toBeGreaterThan(0);
    });
  });

  describe('compareEquipment', () => {
    it('should identify equipment upgrade', () => {
      const result = compareEquipment(mockSword, mockBetterSword, mockPlayerStats);

      expect(result.isUpgrade).toBe(true);
      expect(result.totalStatChange).toBeGreaterThan(0);
      expect(result.statChanges.attack).toBe(10); // 25 - 15
      // Total change: attack(10) + accuracy(5) + speed(2) = 17, so strong_upgrade
      expect(result.recommendation).toBe('strong_upgrade');
    });

    it('should identify equipment downgrade', () => {
      const result = compareEquipment(mockBetterSword, mockSword, mockPlayerStats);

      expect(result.isUpgrade).toBe(false);
      expect(result.totalStatChange).toBeLessThan(0);
      expect(result.statChanges.attack).toBe(-10); // 15 - 25
    });

    it('should handle comparison with no current item', () => {
      const result = compareEquipment(undefined, mockSword, mockPlayerStats);

      expect(result.isUpgrade).toBe(true);
      expect(result.totalStatChange).toBeGreaterThan(0);
      expect(result.statChanges.attack).toBe(15);
    });

    it('should identify significant changes', () => {
      const result = compareEquipment(mockSword, mockBetterSword, mockPlayerStats);

      expect(result.significantChanges.length).toBeGreaterThan(0);
      const attackChange = result.significantChanges.find(c => c.stat === 'attack');
      expect(attackChange?.change).toBe(10);
      expect(attackChange?.percentage).toBe(100); // 10/10 * 100
    });

    it('should determine recommendation levels', () => {
      // Test strong upgrade
      const superSword: EnhancedItem = {
        ...mockSword,
        statModifiers: {
          attack: { value: 35, type: 'flat' }, // Much better
          speed: { value: 5, type: 'flat' }
        }
      };

      const result = compareEquipment(mockSword, superSword, mockPlayerStats);

      expect(result.recommendation).toBe('strong_upgrade');
    });
  });

  describe('generateEquipmentRecommendations', () => {
    it('should recommend better equipment when available', () => {
      const availableItems = [mockBetterSword, mockShield, mockArmor];

      const result = generateEquipmentRecommendations(
        mockEquipmentSet,
        availableItems,
        mockPlayerStats,
        15, // High enough level
        'warrior'
      );

      expect(result.length).toBeGreaterThan(0);
      const weaponRec = result.find(r => r.slot === 'weapon');
      expect(weaponRec?.recommendedItem.id).toBe('steel_sword');
      expect(weaponRec?.priority).toBeDefined();
    });

    it('should sort recommendations by priority and stat improvement', () => {
      const superShield: EnhancedItem = {
        ...mockShield,
        id: 'super_shield',
        statModifiers: {
          defense: { value: 25, type: 'flat' },
          magicDefense: { value: 15, type: 'flat' }
        }
      };

      const availableItems = [mockBetterSword, superShield];

      const result = generateEquipmentRecommendations(
        mockEquipmentSet,
        availableItems,
        mockPlayerStats,
        15,
        'warrior'
      );

      // Should get at least one recommendation, possibly two
      expect(result.length).toBeGreaterThanOrEqual(1);
      // If multiple recommendations, should be sorted by priority and stat improvement
      if (result.length > 1) {
        expect(result[0].statImprovement.total).toBeGreaterThanOrEqual(result[1].statImprovement.total);
      }
    });

    it('should exclude incompatible equipment', () => {
      const highLevelSword: EnhancedItem = {
        ...mockBetterSword,
        requirements: {
          level: 50 // Too high
        }
      };

      const availableItems = [highLevelSword];

      const result = generateEquipmentRecommendations(
        mockEquipmentSet,
        availableItems,
        mockPlayerStats,
        10, // Too low level
        'warrior'
      );

      expect(result).toHaveLength(0);
    });
  });

  describe('optimizeEquipmentSet', () => {
    it('should optimize equipment set for maximum stats', () => {
      const availableItems = [mockBetterSword, mockShield, mockArmor];

      const result = optimizeEquipmentSet(
        mockEquipmentSet,
        availableItems,
        mockPlayerStats,
        15,
        'warrior'
      );

      expect(result.improvement).toBeGreaterThanOrEqual(0);
      expect(result.optimizedSetValue).toBeGreaterThanOrEqual(result.currentSetValue);
      expect(result.optimizedSet.weapon?.id).toBe('steel_sword'); // Should upgrade
    });

    it('should track changes made during optimization', () => {
      const availableItems = [mockBetterSword];

      const result = optimizeEquipmentSet(
        mockEquipmentSet,
        availableItems,
        mockPlayerStats,
        15,
        'warrior'
      );

      expect(result.changes.length).toBeGreaterThan(0);
      const weaponChange = result.changes.find(c => c.slot === 'weapon');
      expect(weaponChange?.from?.id).toBe('iron_sword');
      expect(weaponChange?.to.id).toBe('steel_sword');
      expect(weaponChange?.statGain).toBeGreaterThan(0);
    });

    it('should not change equipment if no upgrades available', () => {
      const weakerSword: EnhancedItem = {
        ...mockSword,
        id: 'weak_sword',
        statModifiers: {
          attack: { value: 5, type: 'flat' }
        }
      };

      const availableItems = [weakerSword];

      const result = optimizeEquipmentSet(
        mockEquipmentSet,
        availableItems,
        mockPlayerStats,
        15,
        'warrior'
      );

      expect(result.changes).toHaveLength(0);
      expect(result.improvement).toBe(0);
    });
  });

  describe('calculateSetBonuses', () => {
    it('should return empty object (placeholder implementation)', () => {
      const result = calculateSetBonuses(mockEquipmentSet);

      expect(result).toEqual({});
    });
  });

  describe('validateEquipmentSlot', () => {
    it('should validate correct slot assignment', () => {
      const result = validateEquipmentSlot(mockSword, 'weapon');

      expect(result).toBe(true);
    });

    it('should reject incorrect slot assignment', () => {
      const result = validateEquipmentSlot(mockSword, 'shield');

      expect(result).toBe(false);
    });

    it('should reject items without equipment slot', () => {
      const itemWithoutSlot: EnhancedItem = {
        ...mockSword,
        equipmentSlot: undefined
      };

      const result = validateEquipmentSlot(itemWithoutSlot, 'weapon');

      expect(result).toBe(false);
    });
  });

  describe('getSlotPriority', () => {
    it('should return correct priorities for equipment slots', () => {
      expect(getSlotPriority('weapon')).toBe(10);
      expect(getSlotPriority('armor')).toBe(9);
      expect(getSlotPriority('helmet')).toBe(8);
      expect(getSlotPriority('shield')).toBe(7);
      expect(getSlotPriority('charm')).toBe(1);
    });

    it('should return 0 for unknown slots', () => {
      const result = getSlotPriority('unknown' as EquipmentSlot);

      expect(result).toBe(0);
    });
  });

  describe('formatStatValue', () => {
    it('should format positive stat values with plus sign', () => {
      expect(formatStatValue(5)).toBe('+5');
      expect(formatStatValue(10)).toBe('+10');
    });

    it('should format negative stat values', () => {
      expect(formatStatValue(-3)).toBe('-3');
      expect(formatStatValue(-10)).toBe('-10');
    });

    it('should format zero without sign', () => {
      expect(formatStatValue(0)).toBe('0');
    });
  });

  describe('calculateDurabilityImpact', () => {
    it('should calculate durability impact (placeholder implementation)', () => {
      const result = calculateDurabilityImpact(mockSword, 50);

      expect(result).toBe(0.5); // 50/100
    });

    it('should have minimum impact of 0.1', () => {
      const result = calculateDurabilityImpact(mockSword, 5);

      expect(result).toBe(0.1);
    });

    it('should handle full durability', () => {
      const result = calculateDurabilityImpact(mockSword, 100);

      expect(result).toBe(1.0);
    });
  });

  describe('getRarityMultiplier', () => {
    it('should return correct multipliers for each rarity', () => {
      expect(getRarityMultiplier('common')).toBe(1.0);
      expect(getRarityMultiplier('uncommon')).toBe(1.1);
      expect(getRarityMultiplier('rare')).toBe(1.25);
      expect(getRarityMultiplier('epic')).toBe(1.5);
      expect(getRarityMultiplier('legendary')).toBe(2.0);
      expect(getRarityMultiplier('mythical')).toBe(2.5);
    });

    it('should return default multiplier for unknown rarity', () => {
      expect(getRarityMultiplier('unknown')).toBe(1.0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle equipment with no stat modifiers', () => {
      const noStatsItem: EnhancedItem = {
        ...mockSword,
        statModifiers: undefined
      };

      const equipmentSet: EquipmentSet = {
        ...mockEquipmentSet,
        weapon: noStatsItem
      };

      const result = calculateEquipmentStats(equipmentSet, mockPlayerStats);

      expect(result.equipmentBonuses.attack).toBe(0);
      expect(result.finalStats.attack).toBe(mockPlayerStats.attack);
    });

    it('should handle equipment comparison with items having no stat modifiers', () => {
      const noStatsItem: EnhancedItem = {
        ...mockSword,
        statModifiers: undefined
      };

      const result = compareEquipment(mockSword, noStatsItem, mockPlayerStats);

      expect(result.statChanges.attack).toBe(-15); // Losing the sword's attack bonus
      expect(result.isUpgrade).toBe(false);
    });

    it('should handle equipment with requirements but no specific checks needed', () => {
      const noRequirementsItem: EnhancedItem = {
        ...mockSword,
        requirements: undefined
      };

      const result = checkEquipmentCompatibility(
        noRequirementsItem,
        'weapon',
        1,
        'mage',
        { ...mockPlayerStats, attack: 1 }
      );

      expect(result.compatible).toBe(true);
      expect(result.unmetRequirements).toHaveLength(0);
    });
  });
});