/**
 * Equipment Utils - Ring Slot Compatibility Test
 *
 * This test verifies that ring items with equipmentSlot="ring" can be equipped
 * in both ring1 and ring2 slots.
 */

import { checkEquipmentCompatibility } from '../equipmentUtils';
import { EnhancedItem, EquipmentSlot } from '../../types/inventory';
import { PlayerStats } from '../../types/game';

describe('equipmentUtils - Ring Slot Compatibility', () => {
  // Mock player stats for testing
  const mockPlayerStats: PlayerStats = {
    attack: 20,
    defense: 15,
    magicAttack: 10,
    magicDefense: 12,
    speed: 14,
    accuracy: 85,
  };

  const playerLevel = 5;
  const playerClass = 'warrior';

  // Mock Health Ring item (as defined in items.js after fix)
  const healthRing: EnhancedItem = {
    id: 'health_ring',
    name: 'Health Ring',
    description: "A ring that increases the wearer's vitality.",
    type: 'accessory',
    equipmentSlot: 'ring', // Generic ring slot
    equipmentSubtype: 'ring',
    rarity: 'common',
    statModifiers: {
      maxHp: {
        value: 20,
        type: 'flat',
        displayName: 'Max HP',
      },
    },
    value: 200,
    icon: '💍',
    quantity: 1,
    stackable: false,
  };

  describe('Ring1 Slot Compatibility', () => {
    it('should allow ring items to be equipped in ring1 slot', () => {
      const result = checkEquipmentCompatibility(
        healthRing,
        'ring1',
        playerLevel,
        playerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(true);
      expect(result.reasons).toHaveLength(0);
      expect(result.warnings).toEqual([]);
    });
  });

  describe('Ring2 Slot Compatibility', () => {
    it('should allow ring items to be equipped in ring2 slot', () => {
      const result = checkEquipmentCompatibility(
        healthRing,
        'ring2',
        playerLevel,
        playerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(true);
      expect(result.reasons).toHaveLength(0);
      expect(result.warnings).toEqual([]);
    });
  });

  describe('Wrong Slot Compatibility', () => {
    it('should NOT allow ring items to be equipped in weapon slot', () => {
      const result = checkEquipmentCompatibility(
        healthRing,
        'weapon',
        playerLevel,
        playerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toContain('ring');
    });

    it('should NOT allow ring items to be equipped in armor slot', () => {
      const result = checkEquipmentCompatibility(
        healthRing,
        'armor',
        playerLevel,
        playerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);
      expect(result.reasons[0]).toContain('ring');
    });
  });

  describe('Null/Undefined Safety', () => {
    it('should handle null item gracefully', () => {
      const result = checkEquipmentCompatibility(
        null as any,
        'ring1',
        playerLevel,
        playerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(false);
      expect(result.reasons).toContain('No item selected');
    });

    it('should handle undefined item gracefully', () => {
      const result = checkEquipmentCompatibility(
        undefined as any,
        'ring1',
        playerLevel,
        playerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(false);
      expect(result.reasons).toContain('No item selected');
    });

    it('should handle null slot gracefully', () => {
      const result = checkEquipmentCompatibility(
        healthRing,
        null as any,
        playerLevel,
        playerClass,
        mockPlayerStats
      );

      expect(result.canEquip).toBe(false);
      expect(result.reasons).toContain('No equipment slot specified');
    });
  });

  describe('Case Sensitivity', () => {
    it('should handle case-insensitive slot matching for rings', () => {
      // Item with uppercase equipmentSlot
      const ringWithUppercaseSlot: EnhancedItem = {
        ...healthRing,
        equipmentSlot: 'RING' as EquipmentSlot,
      };

      const result1 = checkEquipmentCompatibility(
        ringWithUppercaseSlot,
        'ring1',
        playerLevel,
        playerClass,
        mockPlayerStats
      );

      const result2 = checkEquipmentCompatibility(
        ringWithUppercaseSlot,
        'ring2',
        playerLevel,
        playerClass,
        mockPlayerStats
      );

      expect(result1.canEquip).toBe(true);
      expect(result2.canEquip).toBe(true);
    });
  });
});
