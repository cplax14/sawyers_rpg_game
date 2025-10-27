/**
 * Unit tests for slot compatibility validation in equipmentUtils
 */

import {
  checkEquipmentCompatibility,
  formatSlotNameForDisplay,
  getArticle,
  clearCompatibilityCache
} from '../equipmentUtils';
import { EnhancedItem } from '../../types/inventory';
import { PlayerStats } from '../../types/game';

describe('equipmentUtils - Slot Compatibility', () => {
  beforeEach(() => {
    clearCompatibilityCache();
  });

  // Mock player stats for testing
  const mockPlayerStats: PlayerStats = {
    attack: 20,
    defense: 15,
    magicAttack: 10,
    magicDefense: 12,
    speed: 18,
    accuracy: 85
  };

  const mockPlayerLevel = 10;
  const mockPlayerClass = 'warrior';

  describe('checkEquipmentCompatibility - slot matching', () => {
    it('should allow item in correct slot', () => {
      const item: EnhancedItem = {
        id: 'iron_sword',
        name: 'Iron Sword',
        category: 'equipment',
        equipmentSlot: 'weapon',
        description: 'A basic iron sword',
        type: 'weapon',
        value: 100,
        rarity: 'common',
        quantity: 1,
        stackable: false,
        usable: false
      };

      const result = checkEquipmentCompatibility(
        item,
        'weapon',
        mockPlayerLevel,
        mockPlayerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should reject item in wrong slot', () => {
      const item: EnhancedItem = {
        id: 'iron_helmet',
        name: 'Iron Helmet',
        category: 'equipment',
        equipmentSlot: 'helmet',
        description: 'A sturdy helmet',
        type: 'helmet',
        value: 80,
        rarity: 'common',
        quantity: 1,
        stackable: false,
        usable: false
      };

      const result = checkEquipmentCompatibility(
        item,
        'weapon',
        mockPlayerLevel,
        mockPlayerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(false);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toMatch(/helmet/i);
      expect(result.reasons[0]).toMatch(/weapon/i);
    });

    it('should allow ring in ring1 slot', () => {
      const item: EnhancedItem = {
        id: 'gold_ring',
        name: 'Gold Ring',
        category: 'equipment',
        equipmentSlot: 'ring',
        description: 'A shiny gold ring',
        type: 'ring',
        value: 50,
        rarity: 'common',
        quantity: 1,
        stackable: false,
        usable: false
      };

      const result = checkEquipmentCompatibility(
        item,
        'ring1',
        mockPlayerLevel,
        mockPlayerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should allow ring in ring2 slot', () => {
      const item: EnhancedItem = {
        id: 'silver_ring',
        name: 'Silver Ring',
        category: 'equipment',
        equipmentSlot: 'ring',
        description: 'A beautiful silver ring',
        type: 'ring',
        value: 50,
        rarity: 'common',
        quantity: 1,
        stackable: false,
        usable: false
      };

      const result = checkEquipmentCompatibility(
        item,
        'ring2',
        mockPlayerLevel,
        mockPlayerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should reject ring in non-ring slot', () => {
      const item: EnhancedItem = {
        id: 'bronze_ring',
        name: 'Bronze Ring',
        category: 'equipment',
        equipmentSlot: 'ring',
        description: 'A simple bronze ring',
        type: 'ring',
        value: 30,
        rarity: 'common',
        quantity: 1,
        stackable: false,
        usable: false
      };

      const result = checkEquipmentCompatibility(
        item,
        'weapon',
        mockPlayerLevel,
        mockPlayerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(false);
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toMatch(/ring/i);
      expect(result.reasons[0]).toMatch(/weapon/i);
    });

    it('should handle case-insensitive slot names', () => {
      const item: EnhancedItem = {
        id: 'steel_armor',
        name: 'Steel Armor',
        category: 'equipment',
        equipmentSlot: 'ARMOR', // uppercase
        description: 'Strong steel armor',
        type: 'armor',
        value: 200,
        rarity: 'common',
        quantity: 1,
        stackable: false,
        usable: false
      };

      const result = checkEquipmentCompatibility(
        item,
        'armor',
        mockPlayerLevel,
        mockPlayerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should generate kid-friendly error messages', () => {
      const item: EnhancedItem = {
        id: 'leather_gloves',
        name: 'Leather Gloves',
        category: 'equipment',
        equipmentSlot: 'gloves',
        description: 'Soft leather gloves',
        type: 'gloves',
        value: 40,
        rarity: 'common',
        quantity: 1,
        stackable: false,
        usable: false
      };

      const result = checkEquipmentCompatibility(
        item,
        'boots',
        mockPlayerLevel,
        mockPlayerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(false);
      expect(result.reasons[0]).toContain('This is');
      expect(result.reasons[0]).toContain('gloves');
      expect(result.reasons[0]).toContain('boots');
      expect(result.reasons[0]).toContain('slot');
    });

    it('should return early if slot is wrong (not check other requirements)', () => {
      const item: EnhancedItem = {
        id: 'legendary_sword',
        name: 'Legendary Sword',
        category: 'equipment',
        equipmentSlot: 'weapon',
        levelRequirement: 50, // Player is level 10, so this would fail
        description: 'An incredibly powerful sword',
        type: 'weapon',
        value: 10000,
        rarity: 'legendary',
        quantity: 1,
        stackable: false,
        usable: false
      };

      // Try to equip in wrong slot (helmet)
      const result = checkEquipmentCompatibility(
        item,
        'helmet',
        mockPlayerLevel,
        mockPlayerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(false);
      // Should ONLY have slot error, not level requirement error
      expect(result.reasons).toHaveLength(1);
      expect(result.reasons[0]).toMatch(/weapon/i);
      expect(result.reasons[0]).toMatch(/helmet/i);
      expect(result.reasons[0]).not.toMatch(/level/i);
    });
  });

  describe('formatSlotNameForDisplay', () => {
    it('should format regular slot names', () => {
      expect(formatSlotNameForDisplay('weapon')).toBe('weapon');
      expect(formatSlotNameForDisplay('helmet')).toBe('helmet');
      expect(formatSlotNameForDisplay('armor')).toBe('armor');
      expect(formatSlotNameForDisplay('boots')).toBe('boots');
    });

    it('should convert ring1 to ring', () => {
      expect(formatSlotNameForDisplay('ring1')).toBe('ring');
    });

    it('should convert ring2 to ring', () => {
      expect(formatSlotNameForDisplay('ring2')).toBe('ring');
    });

    it('should handle uppercase slot names', () => {
      expect(formatSlotNameForDisplay('WEAPON')).toBe('weapon');
      expect(formatSlotNameForDisplay('Ring1')).toBe('ring');
      expect(formatSlotNameForDisplay('RING2')).toBe('ring');
    });
  });

  describe('getArticle', () => {
    it('should return "a" for consonant-starting words', () => {
      expect(getArticle('weapon')).toBe('a');
      expect(getArticle('helmet')).toBe('a');
      expect(getArticle('sword')).toBe('a');
      expect(getArticle('boots')).toBe('a');
    });

    it('should return "an" for vowel-starting words', () => {
      expect(getArticle('armor')).toBe('an');
      expect(getArticle('amulet')).toBe('an');
      expect(getArticle('elven')).toBe('an');
      expect(getArticle('iron')).toBe('an');
      expect(getArticle('ornate')).toBe('an');
      expect(getArticle('umbrella')).toBe('an');
    });

    it('should be case-insensitive', () => {
      expect(getArticle('Armor')).toBe('an');
      expect(getArticle('Weapon')).toBe('a');
      expect(getArticle('ARMOR')).toBe('an');
    });
  });
});
