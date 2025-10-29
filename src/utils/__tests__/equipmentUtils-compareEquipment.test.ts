/**
 * Equipment Comparison Test Suite
 * Tests the compareEquipment function for stat difference calculations,
 * net improvement scoring, and upgrade/downgrade recommendations.
 *
 * This is for a children's game (ages 7-12), so comparison logic must be
 * clear and help kids make good equipment decisions.
 */

import { compareEquipment } from '../equipmentUtils';
import { EnhancedItem } from '../../types/inventory';
import { PlayerStats } from '../../types/game';

describe('compareEquipment - Stat Difference Calculations', () => {
  // Mock base stats for calculations
  const mockBaseStats: PlayerStats = {
    attack: 10,
    defense: 10,
    magicAttack: 10,
    magicDefense: 10,
    speed: 10,
    accuracy: 85,
  };

  // Helper function to create test items with specific stats
  const createTestItem = (
    id: string,
    name: string,
    stats: Partial<Record<keyof PlayerStats, number>>
  ): EnhancedItem => ({
    id,
    name,
    description: `Test item: ${name}`,
    category: 'equipment',
    type: 'equipment',
    equipmentSlot: 'weapon',
    rarity: 'common',
    value: 100,
    weight: 2,
    stackable: false,
    maxStack: 1,
    statModifiers: Object.entries(stats).reduce(
      (acc, [stat, value]) => ({
        ...acc,
        [stat]: { value, type: 'flat' },
      }),
      {}
    ),
  });

  describe('Basic stat increases (upgrades)', () => {
    it('should calculate positive stat difference for simple attack upgrade', () => {
      const currentItem = createTestItem('sword1', 'Iron Sword', { attack: 10 });
      const newItem = createTestItem('sword2', 'Steel Sword', { attack: 15 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.attack).toBe(5);
      expect(result.totalStatChange).toBe(5);
      expect(result.isUpgrade).toBe(true);
    });

    it('should recommend "minor_upgrade" for +3 to +9 total stats', () => {
      const currentItem = createTestItem('sword1', 'Iron Sword', { attack: 10 });
      const newItem = createTestItem('sword2', 'Steel Sword', { attack: 15 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.totalStatChange).toBe(5);
      expect(result.recommendation).toBe('minor_upgrade');
    });

    it('should recommend "strong_upgrade" for +10 or more total stats', () => {
      const currentItem = createTestItem('sword1', 'Iron Sword', { attack: 10 });
      const newItem = createTestItem('sword2', 'Legendary Sword', { attack: 25 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.totalStatChange).toBe(15);
      expect(result.recommendation).toBe('strong_upgrade');
    });

    it('should handle multiple stat increases', () => {
      const currentItem = createTestItem('armor1', 'Leather Armor', {
        defense: 8,
        speed: 2,
      });
      const newItem = createTestItem('armor2', 'Chain Mail', {
        defense: 12,
        speed: 3,
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.defense).toBe(4);
      expect(result.statChanges.speed).toBe(1);
      expect(result.totalStatChange).toBe(5);
      expect(result.isUpgrade).toBe(true);
      expect(result.recommendation).toBe('minor_upgrade');
    });
  });

  describe('Basic stat decreases (downgrades)', () => {
    it('should calculate negative stat difference for simple attack downgrade', () => {
      const currentItem = createTestItem('sword1', 'Steel Sword', { attack: 15 });
      const newItem = createTestItem('sword2', 'Iron Sword', { attack: 10 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.attack).toBe(-5);
      expect(result.totalStatChange).toBe(-5);
      expect(result.isUpgrade).toBe(false);
    });

    it('should recommend "minor_downgrade" for -3 to -9 total stats', () => {
      const currentItem = createTestItem('sword1', 'Steel Sword', { attack: 15 });
      const newItem = createTestItem('sword2', 'Iron Sword', { attack: 10 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.totalStatChange).toBe(-5);
      expect(result.recommendation).toBe('minor_downgrade');
    });

    it('should recommend "strong_downgrade" for -10 or worse total stats', () => {
      const currentItem = createTestItem('sword1', 'Legendary Sword', { attack: 25 });
      const newItem = createTestItem('sword2', 'Iron Sword', { attack: 10 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.totalStatChange).toBe(-15);
      expect(result.recommendation).toBe('strong_downgrade');
    });

    it('should handle multiple stat decreases', () => {
      const currentItem = createTestItem('armor1', 'Plate Armor', {
        defense: 20,
        magicDefense: 10,
      });
      const newItem = createTestItem('armor2', 'Leather Armor', {
        defense: 15,
        magicDefense: 5,
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.defense).toBe(-5);
      expect(result.statChanges.magicDefense).toBe(-5);
      expect(result.totalStatChange).toBe(-10);
      expect(result.isUpgrade).toBe(false);
      expect(result.recommendation).toBe('strong_downgrade');
    });
  });

  describe('Mixed stat changes (sidegrades)', () => {
    it('should calculate mixed stat changes correctly', () => {
      const currentItem = createTestItem('item1', 'Balanced Item', {
        attack: 10,
        defense: 5,
      });
      const newItem = createTestItem('item2', 'Offensive Item', {
        attack: 15,
        defense: 3,
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.attack).toBe(5);
      expect(result.statChanges.defense).toBe(-2);
      expect(result.totalStatChange).toBe(3);
      expect(result.isUpgrade).toBe(true);
      expect(result.recommendation).toBe('minor_upgrade');
    });

    it('should recommend "no_change" for neutral net stats (within -2 to +2)', () => {
      const currentItem = createTestItem('item1', 'Item A', {
        attack: 10,
        defense: 5,
      });
      const newItem = createTestItem('item2', 'Item B', {
        attack: 8,
        defense: 7,
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.attack).toBe(-2);
      expect(result.statChanges.defense).toBe(2);
      expect(result.totalStatChange).toBe(0);
      expect(result.recommendation).toBe('no_change');
    });

    it('should handle complex mixed changes (3+ stats)', () => {
      const currentItem = createTestItem('item1', 'Old Equipment', {
        attack: 10,
        defense: 8,
        speed: 5,
      });
      const newItem = createTestItem('item2', 'New Equipment', {
        attack: 12,
        defense: 6,
        speed: 8,
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.attack).toBe(2);
      expect(result.statChanges.defense).toBe(-2);
      expect(result.statChanges.speed).toBe(3);
      expect(result.totalStatChange).toBe(3);
      expect(result.isUpgrade).toBe(true);
      expect(result.recommendation).toBe('minor_upgrade');
    });
  });

  describe('Comparing to null (empty slot)', () => {
    it('should treat undefined current item as empty slot with zero stats', () => {
      const newItem = createTestItem('sword1', 'Iron Sword', { attack: 10 });

      const result = compareEquipment(undefined, newItem, mockBaseStats);

      expect(result.statChanges.attack).toBe(10);
      expect(result.totalStatChange).toBe(10);
      expect(result.isUpgrade).toBe(true);
      expect(result.recommendation).toBe('strong_upgrade');
    });

    it('should handle equipping item with multiple stats to empty slot', () => {
      const newItem = createTestItem('armor1', 'Leather Armor', {
        defense: 8,
        speed: 2,
        magicDefense: 4,
      });

      const result = compareEquipment(undefined, newItem, mockBaseStats);

      expect(result.statChanges.defense).toBe(8);
      expect(result.statChanges.speed).toBe(2);
      expect(result.statChanges.magicDefense).toBe(4);
      expect(result.totalStatChange).toBe(14);
      expect(result.isUpgrade).toBe(true);
      expect(result.recommendation).toBe('strong_upgrade');
    });
  });

  describe('Comparing to empty slot (unequipping)', () => {
    it('should show negative changes when "unequipping" (new item has no stats)', () => {
      const currentItem = createTestItem('sword1', 'Iron Sword', { attack: 10 });
      const emptyItem = createTestItem('empty', 'Empty Slot', {});

      const result = compareEquipment(currentItem, emptyItem, mockBaseStats);

      expect(result.statChanges.attack).toBe(-10);
      expect(result.totalStatChange).toBe(-10);
      expect(result.isUpgrade).toBe(false);
      expect(result.recommendation).toBe('strong_downgrade');
    });

    it('should handle unequipping item with multiple stats', () => {
      const currentItem = createTestItem('armor1', 'Plate Armor', {
        defense: 15,
        magicDefense: 8,
      });
      const emptyItem = createTestItem('empty', 'Empty Slot', {});

      const result = compareEquipment(currentItem, emptyItem, mockBaseStats);

      expect(result.statChanges.defense).toBe(-15);
      expect(result.statChanges.magicDefense).toBe(-8);
      expect(result.totalStatChange).toBe(-23);
      expect(result.isUpgrade).toBe(false);
      expect(result.recommendation).toBe('strong_downgrade');
    });
  });

  describe('Zero difference (same stats)', () => {
    it('should show no change when items have identical stats', () => {
      const currentItem = createTestItem('sword1', 'Iron Sword', { attack: 10 });
      const newItem = createTestItem('sword2', 'Different Iron Sword', { attack: 10 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.attack).toBe(0);
      expect(result.totalStatChange).toBe(0);
      expect(result.isUpgrade).toBe(false);
      expect(result.recommendation).toBe('no_change');
    });

    it('should handle identical multi-stat items', () => {
      const currentItem = createTestItem('armor1', 'Leather Armor', {
        defense: 8,
        speed: 3,
        magicDefense: 2,
      });
      const newItem = createTestItem('armor2', 'Another Leather Armor', {
        defense: 8,
        speed: 3,
        magicDefense: 2,
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.defense).toBe(0);
      expect(result.statChanges.speed).toBe(0);
      expect(result.statChanges.magicDefense).toBe(0);
      expect(result.totalStatChange).toBe(0);
      expect(result.recommendation).toBe('no_change');
    });
  });

  describe('Negative stat modifiers (cursed/debuff items)', () => {
    it('should handle current item with negative stats (cursed item)', () => {
      const currentItem = createTestItem('cursed_sword', 'Cursed Blade', {
        attack: 15,
        speed: -5,
      });
      const newItem = createTestItem('normal_sword', 'Normal Blade', {
        attack: 12,
        speed: 0,
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.attack).toBe(-3);
      expect(result.statChanges.speed).toBe(5); // Removing -5 penalty is a +5 improvement
      expect(result.totalStatChange).toBe(2);
      expect(result.isUpgrade).toBe(true);
      expect(result.recommendation).toBe('no_change');
    });

    it('should handle new item with negative stats', () => {
      const currentItem = createTestItem('normal_armor', 'Normal Armor', {
        defense: 10,
        speed: 5,
      });
      const newItem = createTestItem('heavy_armor', 'Heavy Armor', {
        defense: 15,
        speed: -2,
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.defense).toBe(5);
      expect(result.statChanges.speed).toBe(-7); // From +5 to -2
      expect(result.totalStatChange).toBe(-2);
      expect(result.isUpgrade).toBe(false);
      expect(result.recommendation).toBe('no_change');
    });

    it('should handle both items having negative stats', () => {
      const currentItem = createTestItem('heavy_armor1', 'Heavy Plate', {
        defense: 20,
        speed: -5,
      });
      const newItem = createTestItem('heavy_armor2', 'Ultra Heavy Plate', {
        defense: 25,
        speed: -3,
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.defense).toBe(5);
      expect(result.statChanges.speed).toBe(2); // From -5 to -3 is improvement
      expect(result.totalStatChange).toBe(7);
      expect(result.isUpgrade).toBe(true);
      expect(result.recommendation).toBe('minor_upgrade');
    });
  });

  describe('Significant changes calculation', () => {
    it('should identify significant changes (>= 2 points absolute OR >= 5% of base stat)', () => {
      const currentItem = createTestItem('item1', 'Item A', {
        attack: 10,
        defense: 5,
        speed: 3,
      });
      const newItem = createTestItem('item2', 'Item B', {
        attack: 15, // +5 (significant: >= 2 points AND >= 5% of base 10)
        defense: 6, // +1 (significant: >= 5% of base 10, which is 10%)
        speed: 5, // +2 (significant: >= 2 points AND >= 5% of base 10)
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      // All three changes should be significant because:
      // - attack: +5 is both >= 2 points AND >= 5% of base (50%)
      // - defense: +1 is 10% of base stat (10), which is >= 5%
      // - speed: +2 is both >= 2 points AND >= 5% of base (20%)
      expect(result.significantChanges).toHaveLength(3);
      expect(result.significantChanges.map(c => c.stat)).toContain('attack');
      expect(result.significantChanges.map(c => c.stat)).toContain('defense');
      expect(result.significantChanges.map(c => c.stat)).toContain('speed');
    });

    it('should calculate percentage changes correctly', () => {
      const currentItem = createTestItem('item1', 'Item A', { attack: 10 });
      const newItem = createTestItem('item2', 'Item B', { attack: 15 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      const attackChange = result.significantChanges.find(c => c.stat === 'attack');
      expect(attackChange).toBeDefined();
      expect(attackChange?.change).toBe(5);
      // Percentage is based on base stats (10), so 5/10 = 50%
      expect(attackChange?.percentage).toBe(50);
    });

    it('should identify significant changes based on percentage (>= 5% of base stat)', () => {
      // With base stats of 10, 5% = 0.5, so anything >= 0.5 is significant
      // But we also have the >= 2 absolute threshold
      const currentItem = createTestItem('item1', 'Item A', { attack: 10 });
      const newItem = createTestItem('item2', 'Item B', { attack: 12 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      // +2 should be significant (meets absolute threshold)
      const attackChange = result.significantChanges.find(c => c.stat === 'attack');
      expect(attackChange).toBeDefined();
      expect(attackChange?.change).toBe(2);
      expect(attackChange?.percentage).toBe(20); // 2/10 = 20%
    });

    it('should NOT identify insignificant changes (< 2 points AND < 5% of base stat)', () => {
      // With base accuracy of 85, 5% = 4.25
      // So a change of +1 accuracy is only 1.18% - not significant
      const currentItem = createTestItem('item1', 'Item A', {
        attack: 10,
        accuracy: 5,
      });
      const newItem = createTestItem('item2', 'Item B', {
        attack: 10,
        accuracy: 6, // +1 accuracy, which is < 2 points AND < 5% of base 85
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      // Only accuracy changed, and it's not significant
      expect(result.significantChanges).toHaveLength(0);
      expect(result.statChanges.accuracy).toBe(1);
    });
  });

  describe('Edge cases and boundary conditions', () => {
    it('should handle items with no stat modifiers', () => {
      const currentItem = createTestItem('item1', 'Empty Item 1', {});
      const newItem = createTestItem('item2', 'Empty Item 2', {});

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.totalStatChange).toBe(0);
      expect(result.isUpgrade).toBe(false);
      expect(result.recommendation).toBe('no_change');
      expect(result.significantChanges).toHaveLength(0);
    });

    it('should handle all stats changing', () => {
      const currentItem = createTestItem('item1', 'Old Legendary', {
        attack: 10,
        defense: 10,
        magicAttack: 10,
        magicDefense: 10,
        speed: 10,
        accuracy: 10,
      });
      const newItem = createTestItem('item2', 'New Legendary', {
        attack: 12,
        defense: 12,
        magicAttack: 12,
        magicDefense: 12,
        speed: 12,
        accuracy: 12,
      });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.statChanges.attack).toBe(2);
      expect(result.statChanges.defense).toBe(2);
      expect(result.statChanges.magicAttack).toBe(2);
      expect(result.statChanges.magicDefense).toBe(2);
      expect(result.statChanges.speed).toBe(2);
      expect(result.statChanges.accuracy).toBe(2);
      expect(result.totalStatChange).toBe(12);
      expect(result.recommendation).toBe('strong_upgrade');
    });

    it('should handle boundary between minor and strong upgrade (exactly 10)', () => {
      const currentItem = createTestItem('item1', 'Item A', { attack: 10 });
      const newItem = createTestItem('item2', 'Item B', { attack: 20 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.totalStatChange).toBe(10);
      expect(result.recommendation).toBe('strong_upgrade');
    });

    it('should handle boundary between minor and no change (exactly 3)', () => {
      const currentItem = createTestItem('item1', 'Item A', { attack: 10 });
      const newItem = createTestItem('item2', 'Item B', { attack: 13 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.totalStatChange).toBe(3);
      expect(result.recommendation).toBe('minor_upgrade');
    });

    it('should handle very large stat differences', () => {
      const currentItem = createTestItem('item1', 'Weak Item', { attack: 5 });
      const newItem = createTestItem('item2', 'God Tier Item', { attack: 100 });

      const result = compareEquipment(currentItem, newItem, mockBaseStats);

      expect(result.totalStatChange).toBe(95);
      expect(result.isUpgrade).toBe(true);
      expect(result.recommendation).toBe('strong_upgrade');
    });
  });

  describe('Real-world equipment scenarios', () => {
    it('should handle warrior upgrading from starting sword to better sword', () => {
      const woodenSword = createTestItem('wooden_sword', 'Wooden Training Sword', {
        attack: 5,
      });
      const ironSword = createTestItem('iron_sword', 'Iron Sword', {
        attack: 12,
      });

      const result = compareEquipment(woodenSword, ironSword, mockBaseStats);

      expect(result.statChanges.attack).toBe(7);
      expect(result.totalStatChange).toBe(7);
      expect(result.isUpgrade).toBe(true);
      expect(result.recommendation).toBe('minor_upgrade');
    });

    it('should handle mage choosing between different stat focuses', () => {
      const balancedStaff = createTestItem('balanced_staff', 'Balanced Staff', {
        magicAttack: 15,
        magicDefense: 8,
      });
      const offensiveStaff = createTestItem('offensive_staff', 'Offensive Staff', {
        magicAttack: 20,
        magicDefense: 5,
      });

      const result = compareEquipment(balancedStaff, offensiveStaff, mockBaseStats);

      expect(result.statChanges.magicAttack).toBe(5);
      expect(result.statChanges.magicDefense).toBe(-3);
      expect(result.totalStatChange).toBe(2);
      expect(result.recommendation).toBe('no_change');
    });

    it('should handle tank choosing heavy armor with speed penalty', () => {
      const mediumArmor = createTestItem('medium_armor', 'Chain Mail', {
        defense: 15,
        speed: 5,
      });
      const heavyArmor = createTestItem('heavy_armor', 'Full Plate', {
        defense: 25,
        speed: 2,
      });

      const result = compareEquipment(mediumArmor, heavyArmor, mockBaseStats);

      expect(result.statChanges.defense).toBe(10);
      expect(result.statChanges.speed).toBe(-3);
      expect(result.totalStatChange).toBe(7);
      expect(result.isUpgrade).toBe(true);
      expect(result.recommendation).toBe('minor_upgrade');
    });
  });
});
