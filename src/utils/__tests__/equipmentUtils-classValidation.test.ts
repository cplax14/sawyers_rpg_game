/**
 * Test Suite for Class Requirement Validation
 * Tests Task 5.2 implementation
 */

import { checkEquipmentCompatibility, formatClassList } from '../equipmentUtils';
import { EnhancedItem, EquipmentSlot } from '../../types/inventory';
import { PlayerStats } from '../../types/game';

describe('Equipment Class Requirement Validation (Task 5.2)', () => {
  const mockStats: PlayerStats = {
    attack: 15,
    defense: 12,
    magicAttack: 10,
    magicDefense: 8,
    speed: 10,
    accuracy: 85
  };

  describe('checkEquipmentCompatibility - Class Requirements', () => {
    it('should allow item with no class requirements (available to all classes)', () => {
      const item: EnhancedItem = {
        id: 'health-potion',
        name: 'Health Potion',
        description: 'Restores HP',
        type: 'consumable',
        icon: 'potion.png',
        rarity: 'common',
        value: 50,
        quantity: 1,
        stackable: true,
        maxStack: 99,
        weight: 1,
        sellValue: 25,
        canTrade: true,
        canDrop: true,
        canDestroy: true,
        usable: true,
        consumeOnUse: true,
        useInCombat: true,
        useOutOfCombat: true,
        category: 'consumables'
        // No classRequirement or requirements.classes
      };

      const result = checkEquipmentCompatibility(
        item,
        'weapon' as EquipmentSlot,
        10,
        'warrior',
        mockStats
      );

      expect(result.compatible).toBe(true);
      expect(result.unmetRequirements).not.toContain(
        expect.stringContaining('Only')
      );
    });

    it('should allow item when player class matches single class requirement', () => {
      const item: EnhancedItem = {
        id: 'iron-sword',
        name: 'Iron Sword',
        description: 'A sturdy iron sword',
        type: 'equipment',
        icon: 'sword.png',
        rarity: 'common',
        value: 100,
        quantity: 1,
        stackable: false,
        maxStack: 1,
        weight: 5,
        sellValue: 50,
        canTrade: true,
        canDrop: true,
        canDestroy: false,
        usable: false,
        consumeOnUse: false,
        useInCombat: false,
        useOutOfCombat: false,
        category: 'equipment',
        equipmentSlot: 'weapon' as EquipmentSlot,
        classRequirement: ['warrior'] // Legacy format
      };

      const result = checkEquipmentCompatibility(
        item,
        'weapon' as EquipmentSlot,
        10,
        'warrior',
        mockStats
      );

      expect(result.compatible).toBe(true);
      expect(result.unmetRequirements).toHaveLength(0);
    });

    it('should reject item when player class does not match requirement', () => {
      const item: EnhancedItem = {
        id: 'iron-sword',
        name: 'Iron Sword',
        description: 'A sturdy iron sword',
        type: 'equipment',
        icon: 'sword.png',
        rarity: 'common',
        value: 100,
        quantity: 1,
        stackable: false,
        maxStack: 1,
        weight: 5,
        sellValue: 50,
        canTrade: true,
        canDrop: true,
        canDestroy: false,
        usable: false,
        consumeOnUse: false,
        useInCombat: false,
        useOutOfCombat: false,
        category: 'equipment',
        equipmentSlot: 'weapon' as EquipmentSlot,
        classRequirement: ['warrior']
      };

      const result = checkEquipmentCompatibility(
        item,
        'weapon' as EquipmentSlot,
        10,
        'mage',
        mockStats
      );

      expect(result.compatible).toBe(false);
      expect(result.unmetRequirements).toContain(
        'Only Warriors can use this equipment!'
      );
    });

    it('should handle multiple allowed classes and allow any matching class', () => {
      const item: EnhancedItem = {
        id: 'staff',
        name: 'Wooden Staff',
        description: 'A magical staff',
        type: 'equipment',
        icon: 'staff.png',
        rarity: 'common',
        value: 150,
        quantity: 1,
        stackable: false,
        maxStack: 1,
        weight: 3,
        sellValue: 75,
        canTrade: true,
        canDrop: true,
        canDestroy: false,
        usable: false,
        consumeOnUse: false,
        useInCombat: false,
        useOutOfCombat: false,
        category: 'equipment',
        equipmentSlot: 'weapon' as EquipmentSlot,
        requirements: {
          classes: ['mage', 'cleric', 'druid']
        }
      };

      // Test with Cleric - should be allowed
      const result1 = checkEquipmentCompatibility(
        item,
        'weapon' as EquipmentSlot,
        10,
        'cleric',
        mockStats
      );

      expect(result1.compatible).toBe(true);
      expect(result1.unmetRequirements).toHaveLength(0);

      // Test with Warrior - should be rejected
      const result2 = checkEquipmentCompatibility(
        item,
        'weapon' as EquipmentSlot,
        10,
        'warrior',
        mockStats
      );

      expect(result2.compatible).toBe(false);
      expect(result2.unmetRequirements).toContain(
        'Only Mages, Clerics, and Druids can use this equipment!'
      );
    });

    it('should perform case-insensitive class comparison', () => {
      const item: EnhancedItem = {
        id: 'armor',
        name: 'Heavy Armor',
        description: 'Strong armor',
        type: 'equipment',
        icon: 'armor.png',
        rarity: 'common',
        value: 200,
        quantity: 1,
        stackable: false,
        maxStack: 1,
        weight: 10,
        sellValue: 100,
        canTrade: true,
        canDrop: true,
        canDestroy: false,
        usable: false,
        consumeOnUse: false,
        useInCombat: false,
        useOutOfCombat: false,
        category: 'equipment',
        equipmentSlot: 'armor' as EquipmentSlot,
        classRequirement: ['WARRIOR', 'Paladin'] // Mixed case
      };

      // Test with "warrior" (lowercase) - should match "WARRIOR"
      const result1 = checkEquipmentCompatibility(
        item,
        'armor' as EquipmentSlot,
        10,
        'warrior',
        mockStats
      );

      expect(result1.compatible).toBe(true);

      // Test with "PALADIN" (uppercase) - should match "Paladin"
      const result2 = checkEquipmentCompatibility(
        item,
        'armor' as EquipmentSlot,
        10,
        'PALADIN',
        mockStats
      );

      expect(result2.compatible).toBe(true);
    });

    it('should use classRequirement over requirements.classes when both exist (legacy priority)', () => {
      const item: EnhancedItem = {
        id: 'test-item',
        name: 'Test Item',
        description: 'Test',
        type: 'equipment',
        icon: 'test.png',
        rarity: 'common',
        value: 100,
        quantity: 1,
        stackable: false,
        maxStack: 1,
        weight: 1,
        sellValue: 50,
        canTrade: true,
        canDrop: true,
        canDestroy: false,
        usable: false,
        consumeOnUse: false,
        useInCombat: false,
        useOutOfCombat: false,
        category: 'equipment',
        equipmentSlot: 'weapon' as EquipmentSlot,
        classRequirement: ['warrior'], // Legacy - takes priority for backwards compatibility
        requirements: {
          classes: ['mage'] // New format - ignored when classRequirement exists
        }
      };

      // Warrior should be allowed (from classRequirement)
      const result1 = checkEquipmentCompatibility(
        item,
        'weapon' as EquipmentSlot,
        10,
        'warrior',
        mockStats
      );

      expect(result1.compatible).toBe(true);

      // Mage should be rejected (requirements.classes is ignored)
      const result2 = checkEquipmentCompatibility(
        item,
        'weapon' as EquipmentSlot,
        10,
        'mage',
        mockStats
      );

      expect(result2.compatible).toBe(false);
    });
  });

  describe('formatClassList - Kid-Friendly Formatting', () => {
    it('should format single class as plural', () => {
      expect(formatClassList(['warrior'])).toBe('Warriors');
      expect(formatClassList(['mage'])).toBe('Mages');
      expect(formatClassList(['cleric'])).toBe('Clerics');
    });

    it('should format two classes with "and"', () => {
      expect(formatClassList(['warrior', 'paladin'])).toBe('Warriors and Paladins');
      expect(formatClassList(['mage', 'cleric'])).toBe('Mages and Clerics');
    });

    it('should format three or more classes with commas and "and"', () => {
      expect(formatClassList(['warrior', 'mage', 'cleric'])).toBe(
        'Warriors, Mages, and Clerics'
      );
      expect(formatClassList(['warrior', 'paladin', 'ranger', 'druid'])).toBe(
        'Warriors, Paladins, Rangers, and Druids'
      );
    });

    it('should capitalize class names properly', () => {
      expect(formatClassList(['WARRIOR'])).toBe('Warriors');
      expect(formatClassList(['mAgE'])).toBe('Mages');
      expect(formatClassList(['ClErIc'])).toBe('Clerics');
    });

    it('should handle classes already ending in "s"', () => {
      expect(formatClassList(['class'])).toBe('Class');
      // Note: Simple pluralization - doesn't add another 's'
    });

    it('should return "Unknown classes" for empty array', () => {
      expect(formatClassList([])).toBe('Unknown classes');
    });

    it('should handle null/undefined gracefully', () => {
      expect(formatClassList(null as any)).toBe('Unknown classes');
      expect(formatClassList(undefined as any)).toBe('Unknown classes');
    });
  });

  describe('Integration - Class and Level Requirements Together', () => {
    it('should validate both level and class requirements', () => {
      const item: EnhancedItem = {
        id: 'legendary-sword',
        name: 'Legendary Sword',
        description: 'A powerful legendary sword',
        type: 'equipment',
        icon: 'legendary-sword.png',
        rarity: 'legendary',
        value: 10000,
        quantity: 1,
        stackable: false,
        maxStack: 1,
        weight: 8,
        sellValue: 5000,
        canTrade: false,
        canDrop: false,
        canDestroy: false,
        usable: false,
        consumeOnUse: false,
        useInCombat: false,
        useOutOfCombat: false,
        category: 'equipment',
        equipmentSlot: 'weapon' as EquipmentSlot,
        levelRequirement: 20,
        classRequirement: ['warrior', 'paladin']
      };

      // Test with correct class but too low level
      const result1 = checkEquipmentCompatibility(
        item,
        'weapon' as EquipmentSlot,
        10,
        'warrior',
        mockStats
      );

      expect(result1.compatible).toBe(false);
      expect(result1.unmetRequirements).toContain(
        "You need to be level 20 to use this item! (You're level 10)"
      );
      expect(result1.unmetRequirements).not.toContain(
        expect.stringContaining('Only Warriors and Paladins')
      );

      // Test with wrong class but correct level
      const result2 = checkEquipmentCompatibility(
        item,
        'weapon' as EquipmentSlot,
        25,
        'mage',
        mockStats
      );

      expect(result2.compatible).toBe(false);
      expect(result2.unmetRequirements).toContain(
        'Only Warriors and Paladins can use this equipment!'
      );

      // Test with both correct
      const result3 = checkEquipmentCompatibility(
        item,
        'weapon' as EquipmentSlot,
        25,
        'warrior',
        mockStats
      );

      expect(result3.compatible).toBe(true);
      expect(result3.unmetRequirements).toHaveLength(0);
    });
  });
});
