/**
 * Tests for null/undefined handling in checkEquipmentCompatibility
 *
 * This test file specifically tests the defensive null checking added
 * to prevent crashes when the function is called with null/undefined values.
 *
 * Bug context: App crashed when clicking "Cancel" on equipment modal because
 * checkEquipmentCompatibility was called with null item during re-render.
 */

import { checkEquipmentCompatibility } from '../equipmentUtils';
import { PlayerStats } from '../../types/game';

describe('checkEquipmentCompatibility - null/undefined handling', () => {
  const mockPlayerStats: PlayerStats = {
    attack: 10,
    defense: 10,
    magicAttack: 10,
    magicDefense: 10,
    speed: 10,
    accuracy: 85
  };

  it('should handle null item gracefully', () => {
    const result = checkEquipmentCompatibility(
      null,
      'weapon',
      5,
      'warrior',
      mockPlayerStats
    );

    expect(result).toBeDefined();
    expect(result.canEquip).toBe(false);
    expect(result.reasons).toContain('No item selected');
    expect(result.warnings).toEqual([]);
    expect(result.suggestions).toEqual([]);
  });

  it('should handle undefined item gracefully', () => {
    const result = checkEquipmentCompatibility(
      undefined,
      'weapon',
      5,
      'warrior',
      mockPlayerStats
    );

    expect(result).toBeDefined();
    expect(result.canEquip).toBe(false);
    expect(result.reasons).toContain('No item selected');
    expect(result.warnings).toEqual([]);
    expect(result.suggestions).toEqual([]);
  });

  it('should handle null slot gracefully', () => {
    const mockItem = {
      id: 'test-sword',
      name: 'Test Sword',
      description: 'A test sword',
      category: 'equipment' as const,
      type: 'weapon' as const,
      rarity: 'common' as const,
      value: 100,
      equipmentSlot: 'weapon' as const,
      statModifiers: {}
    };

    const result = checkEquipmentCompatibility(
      mockItem,
      null as any,
      5,
      'warrior',
      mockPlayerStats
    );

    expect(result).toBeDefined();
    expect(result.canEquip).toBe(false);
    expect(result.reasons).toContain('No equipment slot specified');
    expect(result.warnings).toEqual([]);
    expect(result.suggestions).toEqual([]);
  });

  it('should handle undefined slot gracefully', () => {
    const mockItem = {
      id: 'test-sword',
      name: 'Test Sword',
      description: 'A test sword',
      category: 'equipment' as const,
      type: 'weapon' as const,
      rarity: 'common' as const,
      value: 100,
      equipmentSlot: 'weapon' as const,
      statModifiers: {}
    };

    const result = checkEquipmentCompatibility(
      mockItem,
      undefined as any,
      5,
      'warrior',
      mockPlayerStats
    );

    expect(result).toBeDefined();
    expect(result.canEquip).toBe(false);
    expect(result.reasons).toContain('No equipment slot specified');
    expect(result.warnings).toEqual([]);
    expect(result.suggestions).toEqual([]);
  });

  it('should handle item with null equipmentSlot gracefully', () => {
    const mockItem = {
      id: 'test-item',
      name: 'Test Item',
      description: 'An item with null slot',
      category: 'equipment' as const,
      type: 'weapon' as const,
      rarity: 'common' as const,
      value: 100,
      equipmentSlot: null as any,
      statModifiers: {}
    };

    const result = checkEquipmentCompatibility(
      mockItem,
      'weapon',
      5,
      'warrior',
      mockPlayerStats
    );

    expect(result).toBeDefined();
    // Should return early with slot mismatch since itemSlot is falsy
    expect(result.canEquip).toBe(true); // No itemSlot means we skip slot check
  });

  it('should not crash when item.equipmentSlot is undefined', () => {
    const mockItem = {
      id: 'test-item',
      name: 'Test Item',
      description: 'An item with undefined slot',
      category: 'equipment' as const,
      type: 'weapon' as const,
      rarity: 'common' as const,
      value: 100,
      // equipmentSlot is undefined
      statModifiers: {}
    } as any;

    expect(() => {
      checkEquipmentCompatibility(
        mockItem,
        'weapon',
        5,
        'warrior',
        mockPlayerStats
      );
    }).not.toThrow();
  });

  it('should handle normal valid item without errors', () => {
    const mockItem = {
      id: 'test-sword',
      name: 'Test Sword',
      description: 'A test sword',
      category: 'equipment' as const,
      type: 'weapon' as const,
      rarity: 'common' as const,
      value: 100,
      equipmentSlot: 'weapon' as const,
      statModifiers: {
        attack: { value: 5, type: 'flat' as const }
      }
    };

    const result = checkEquipmentCompatibility(
      mockItem,
      'weapon',
      5,
      'warrior',
      mockPlayerStats
    );

    expect(result).toBeDefined();
    expect(result.canEquip).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it('should handle modal cancel scenario (null item, valid slot)', () => {
    // This is the exact scenario that causes the crash:
    // User clicks Cancel on modal, causing re-render with null selectedItem
    const result = checkEquipmentCompatibility(
      null,
      'armor', // Valid slot
      10,      // Valid level
      'warrior', // Valid class
      mockPlayerStats
    );

    expect(result).toBeDefined();
    expect(result.canEquip).toBe(false);
    expect(result.reasons).toContain('No item selected');
    expect(result.warnings).toHaveLength(0);
    expect(result.suggestions).toHaveLength(0);
  });
});
