/**
 * Tests for Equipment Validation Utility
 *
 * Ensures that equipment validation correctly identifies invalid items
 * and safely cleans them from loaded save games.
 */

import {
  validateEquippedItems,
  cleanInvalidEquipment,
  validateEquipmentSlot,
  getValidationSummary,
} from '../equipmentValidation';
import type { Equipment } from '../../contexts/ReactGameContext';

// =============================================================================
// TEST SETUP
// =============================================================================

// Mock ItemData on window object
const mockItemData = {
  getItem: jest.fn((itemId: string) => {
    // Valid items in our mock database
    const validItems: Record<string, any> = {
      iron_sword: { id: 'iron_sword', name: 'Iron Sword', type: 'weapon' },
      steel_armor: { id: 'steel_armor', name: 'Steel Armor', type: 'armor' },
      magic_ring: { id: 'magic_ring', name: 'Magic Ring', type: 'accessory' },
      leather_boots: { id: 'leather_boots', name: 'Leather Boots', type: 'armor' },
      steel_helmet: { id: 'steel_helmet', name: 'Steel Helmet', type: 'armor' },
    };

    return validItems[itemId] || null;
  }),
};

// Set up global ItemData mock
beforeAll(() => {
  (window as any).ItemData = mockItemData;
});

afterAll(() => {
  delete (window as any).ItemData;
});

beforeEach(() => {
  // Clear mock call history before each test
  mockItemData.getItem.mockClear();
});

// =============================================================================
// TEST CASES
// =============================================================================

describe('validateEquippedItems', () => {
  it('should validate all slots are empty (all null)', () => {
    const equipment: Equipment = {
      weapon: null,
      armor: null,
      accessory: null,
      helmet: null,
      necklace: null,
      shield: null,
      gloves: null,
      boots: null,
      ring1: null,
      ring2: null,
      charm: null,
    };

    const result = validateEquippedItems(equipment);

    expect(result.isValid).toBe(true);
    expect(result.invalidSlots).toEqual([]);
    expect(result.validSlots).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('should validate all equipped items are valid', () => {
    const equipment: Equipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: null,
      helmet: 'steel_helmet',
      necklace: null,
      shield: null,
      gloves: null,
      boots: 'leather_boots',
      ring1: 'magic_ring',
      ring2: null,
      charm: null,
    };

    const result = validateEquippedItems(equipment);

    expect(result.isValid).toBe(true);
    expect(result.invalidSlots).toEqual([]);
    expect(result.validSlots).toContain('weapon');
    expect(result.validSlots).toContain('armor');
    expect(result.validSlots).toContain('helmet');
    expect(result.validSlots).toContain('boots');
    expect(result.validSlots).toContain('ring1');
    expect(result.warnings).toEqual([]);
  });

  it('should identify invalid items that no longer exist', () => {
    const equipment: Equipment = {
      weapon: 'deleted_sword', // This item doesn't exist
      armor: 'steel_armor', // This item exists
      accessory: null,
      helmet: null,
      necklace: null,
      shield: null,
      gloves: null,
      boots: 'removed_boots', // This item doesn't exist
      ring1: null,
      ring2: null,
      charm: null,
    };

    const result = validateEquippedItems(equipment);

    expect(result.isValid).toBe(false);
    expect(result.invalidSlots).toContain('weapon');
    expect(result.invalidSlots).toContain('boots');
    expect(result.invalidSlots.length).toBe(2);
    expect(result.validSlots).toContain('armor');
    expect(result.validSlots.length).toBe(1);
    expect(result.warnings.length).toBe(2);
    expect(result.warnings[0]).toContain('deleted_sword');
    expect(result.warnings[1]).toContain('removed_boots');
  });

  it('should handle all items being invalid', () => {
    const equipment: Equipment = {
      weapon: 'invalid_1',
      armor: 'invalid_2',
      accessory: 'invalid_3',
      helmet: 'invalid_4',
      necklace: 'invalid_5',
      shield: 'invalid_6',
      gloves: 'invalid_7',
      boots: 'invalid_8',
      ring1: 'invalid_9',
      ring2: 'invalid_10',
      charm: 'invalid_11',
    };

    const result = validateEquippedItems(equipment);

    expect(result.isValid).toBe(false);
    expect(result.invalidSlots.length).toBe(11); // All 11 slots
    expect(result.validSlots.length).toBe(0);
    expect(result.warnings.length).toBe(11);
  });

  it('should handle missing ItemData gracefully', () => {
    // Temporarily remove ItemData
    const originalItemData = (window as any).ItemData;
    delete (window as any).ItemData;

    const equipment: Equipment = {
      weapon: 'iron_sword',
      armor: null,
      accessory: null,
      helmet: null,
      necklace: null,
      shield: null,
      gloves: null,
      boots: null,
      ring1: null,
      ring2: null,
      charm: null,
    };

    // Suppress console.error for this test
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const result = validateEquippedItems(equipment);

    expect(result.isValid).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain('Unable to validate equipment');

    // Restore
    (window as any).ItemData = originalItemData;
    consoleErrorSpy.mockRestore();
  });
});

describe('cleanInvalidEquipment', () => {
  it('should return equipment unchanged if all items are valid', () => {
    const equipment: Equipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: null,
      helmet: null,
      necklace: null,
      shield: null,
      gloves: null,
      boots: null,
      ring1: null,
      ring2: null,
      charm: null,
    };

    const cleaned = cleanInvalidEquipment(equipment);

    expect(cleaned).toEqual(equipment);
    expect(cleaned.weapon).toBe('iron_sword');
    expect(cleaned.armor).toBe('steel_armor');
  });

  it('should remove invalid items and set slots to null', () => {
    const equipment: Equipment = {
      weapon: 'deleted_sword', // Invalid
      armor: 'steel_armor', // Valid
      accessory: null,
      helmet: 'steel_helmet', // Valid
      necklace: null,
      shield: null,
      gloves: null,
      boots: 'removed_boots', // Invalid
      ring1: 'magic_ring', // Valid
      ring2: null,
      charm: null,
    };

    // Suppress console warnings for this test
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const cleaned = cleanInvalidEquipment(equipment);

    expect(cleaned.weapon).toBeNull(); // Invalid item removed
    expect(cleaned.armor).toBe('steel_armor'); // Valid item kept
    expect(cleaned.helmet).toBe('steel_helmet'); // Valid item kept
    expect(cleaned.boots).toBeNull(); // Invalid item removed
    expect(cleaned.ring1).toBe('magic_ring'); // Valid item kept

    // Check that console messages were logged
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should create a new equipment object (not mutate original)', () => {
    const equipment: Equipment = {
      weapon: 'deleted_sword',
      armor: 'steel_armor',
      accessory: null,
      helmet: null,
      necklace: null,
      shield: null,
      gloves: null,
      boots: null,
      ring1: null,
      ring2: null,
      charm: null,
    };

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const cleaned = cleanInvalidEquipment(equipment);

    // Original should be unchanged
    expect(equipment.weapon).toBe('deleted_sword');
    // Cleaned should have invalid items removed
    expect(cleaned.weapon).toBeNull();
    // They should be different objects
    expect(cleaned).not.toBe(equipment);

    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should handle all items being invalid', () => {
    const equipment: Equipment = {
      weapon: 'invalid_1',
      armor: 'invalid_2',
      accessory: 'invalid_3',
      helmet: null,
      necklace: null,
      shield: null,
      gloves: null,
      boots: null,
      ring1: null,
      ring2: null,
      charm: null,
    };

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const cleaned = cleanInvalidEquipment(equipment);

    // All invalid items should be removed
    expect(cleaned.weapon).toBeNull();
    expect(cleaned.armor).toBeNull();
    expect(cleaned.accessory).toBeNull();

    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });
});

describe('validateEquipmentSlot', () => {
  it('should validate null slots as valid', () => {
    const isValid = validateEquipmentSlot(null, 'weapon');
    expect(isValid).toBe(true);
  });

  it('should validate existing items as valid', () => {
    const isValid = validateEquipmentSlot('iron_sword', 'weapon');
    expect(isValid).toBe(true);
  });

  it('should identify non-existent items as invalid', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const isValid = validateEquipmentSlot('deleted_item', 'armor');
    expect(isValid).toBe(false);

    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('deleted_item'));

    consoleWarnSpy.mockRestore();
  });

  it('should handle missing ItemData gracefully', () => {
    const originalItemData = (window as any).ItemData;
    delete (window as any).ItemData;

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const isValid = validateEquipmentSlot('iron_sword', 'weapon');
    expect(isValid).toBe(false);

    (window as any).ItemData = originalItemData;
    consoleErrorSpy.mockRestore();
  });
});

describe('getValidationSummary', () => {
  it('should return success message for valid equipment', () => {
    const validResult = {
      isValid: true,
      invalidSlots: [],
      validSlots: ['weapon', 'armor'] as any,
      warnings: [],
    };

    const summary = getValidationSummary(validResult);
    expect(summary).toContain('✅');
    expect(summary).toContain('All equipped items are valid');
  });

  it('should return warning message for invalid equipment', () => {
    const invalidResult = {
      isValid: false,
      invalidSlots: ['weapon', 'boots'] as any,
      validSlots: ['armor', 'helmet'] as any,
      warnings: ['warning 1', 'warning 2'],
    };

    const summary = getValidationSummary(invalidResult);
    expect(summary).toContain('⚠️');
    expect(summary).toContain('2 invalid slot(s)');
    expect(summary).toContain('weapon');
    expect(summary).toContain('boots');
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Equipment Validation Integration', () => {
  it('should handle a realistic save game scenario with mixed valid/invalid items', () => {
    // Simulate loading a save game where some items were removed in an update
    const savedEquipment: Equipment = {
      weapon: 'iron_sword', // Valid - still exists
      armor: 'old_armor_v1', // Invalid - removed in update
      accessory: null,
      helmet: 'steel_helmet', // Valid - still exists
      necklace: null,
      shield: null,
      gloves: null,
      boots: 'deprecated_boots', // Invalid - removed in update
      ring1: 'magic_ring', // Valid - still exists
      ring2: null,
      charm: null,
    };

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Validate and clean the equipment (this is what happens on LOAD_GAME)
    const cleanedEquipment = cleanInvalidEquipment(savedEquipment);

    // Valid items should be preserved
    expect(cleanedEquipment.weapon).toBe('iron_sword');
    expect(cleanedEquipment.helmet).toBe('steel_helmet');
    expect(cleanedEquipment.ring1).toBe('magic_ring');

    // Invalid items should be removed
    expect(cleanedEquipment.armor).toBeNull();
    expect(cleanedEquipment.boots).toBeNull();

    // Empty slots should remain empty
    expect(cleanedEquipment.accessory).toBeNull();
    expect(cleanedEquipment.necklace).toBeNull();

    // Verify kid-friendly messages were logged
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Some equipment was removed in a game update')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Don't worry - you can find new equipment")
    );

    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should handle completely fresh save (all slots empty)', () => {
    const freshEquipment: Equipment = {
      weapon: null,
      armor: null,
      accessory: null,
      helmet: null,
      necklace: null,
      shield: null,
      gloves: null,
      boots: null,
      ring1: null,
      ring2: null,
      charm: null,
    };

    const cleaned = cleanInvalidEquipment(freshEquipment);

    // Should return identical equipment (no changes needed)
    expect(cleaned).toEqual(freshEquipment);
  });

  it('should handle save from before equipment system expansion', () => {
    // Old save might only have weapon, armor, accessory
    const legacyEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: 'magic_ring',
      helmet: null,
      necklace: null,
      shield: null,
      gloves: null,
      boots: null,
      ring1: null,
      ring2: null,
      charm: null,
    } as Equipment;

    const cleaned = cleanInvalidEquipment(legacyEquipment);

    // All valid legacy items should be preserved
    expect(cleaned.weapon).toBe('iron_sword');
    expect(cleaned.armor).toBe('steel_armor');
    expect(cleaned.accessory).toBe('magic_ring');

    // All new slots should remain null
    expect(cleaned.helmet).toBeNull();
    expect(cleaned.necklace).toBeNull();
    expect(cleaned.shield).toBeNull();
  });
});
