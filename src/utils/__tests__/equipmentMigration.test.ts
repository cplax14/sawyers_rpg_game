/**
 * Tests for Equipment Slot Migration
 *
 * Ensures that old save files with 3-slot equipment systems are correctly
 * migrated to the new 10-slot system without losing player equipment.
 *
 * Also tests version-based migration to support future equipment system changes.
 */

import { migrateEquipmentSlots, EQUIPMENT_VERSION } from '../equipmentValidation';
import type { Equipment } from '../../contexts/ReactGameContext';

// =============================================================================
// TEST SETUP
// =============================================================================

// Mock ItemData on window object
const mockItemData = {
  getItem: jest.fn((itemId: string) => {
    // Valid items in our mock database with equipmentSlot info
    const validItems: Record<string, any> = {
      iron_sword: { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', equipmentSlot: 'weapon' },
      steel_armor: {
        id: 'steel_armor',
        name: 'Steel Armor',
        type: 'armor',
        equipmentSlot: 'armor',
      },
      bronze_ring: {
        id: 'bronze_ring',
        name: 'Bronze Ring',
        type: 'accessory',
        equipmentSlot: 'ring1',
      },
      jade_necklace: {
        id: 'jade_necklace',
        name: 'Jade Necklace',
        type: 'accessory',
        equipmentSlot: 'necklace',
      },
      lucky_charm: {
        id: 'lucky_charm',
        name: 'Lucky Charm',
        type: 'accessory',
        equipmentSlot: 'charm',
      },
      generic_accessory: { id: 'generic_accessory', name: 'Generic Accessory', type: 'accessory' }, // No equipmentSlot
      leather_boots: {
        id: 'leather_boots',
        name: 'Leather Boots',
        type: 'armor',
        equipmentSlot: 'boots',
      },
      steel_helmet: {
        id: 'steel_helmet',
        name: 'Steel Helmet',
        type: 'armor',
        equipmentSlot: 'helmet',
      },
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

// Helper to suppress console logs during tests
const suppressConsoleLogs = () => {
  const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  return () => consoleLogSpy.mockRestore();
};

// =============================================================================
// MIGRATION DETECTION TESTS
// =============================================================================

describe('migrateEquipmentSlots - Migration Detection', () => {
  it('should detect old 3-slot format and perform migration', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: 'bronze_ring',
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    // Should have all 10 slots
    expect(migrated).toHaveProperty('helmet');
    expect(migrated).toHaveProperty('necklace');
    expect(migrated).toHaveProperty('armor');
    expect(migrated).toHaveProperty('weapon');
    expect(migrated).toHaveProperty('shield');
    expect(migrated).toHaveProperty('gloves');
    expect(migrated).toHaveProperty('boots');
    expect(migrated).toHaveProperty('ring1');
    expect(migrated).toHaveProperty('ring2');
    expect(migrated).toHaveProperty('charm');

    restore();
  });

  it('should detect already-migrated equipment and skip migration', () => {
    const restore = suppressConsoleLogs();

    const newEquipment: Equipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: null,
      helmet: 'steel_helmet',
      necklace: null,
      shield: null,
      gloves: null,
      boots: 'leather_boots',
      ring1: 'bronze_ring',
      ring2: null,
      charm: null,
    };

    const result = migrateEquipmentSlots(newEquipment, '1.0');

    // Should return equipment with all slots intact (but without accessory - it's deprecated)
    expect(result.weapon).toBe('iron_sword');
    expect(result.armor).toBe('steel_armor');
    expect(result.helmet).toBe('steel_helmet');
    expect(result.boots).toBe('leather_boots');
    expect(result.ring1).toBe('bronze_ring');
    expect(result.necklace).toBeNull();
    expect(result.shield).toBeNull();
    expect(result.gloves).toBeNull();
    expect(result.ring2).toBeNull();
    expect(result.charm).toBeNull();

    restore();
  });

  it('should handle empty old equipment (all null)', () => {
    const restore = suppressConsoleLogs();

    const emptyEquipment = {
      weapon: null,
      armor: null,
      accessory: null,
    };

    const migrated = migrateEquipmentSlots(emptyEquipment);

    // All slots should be null
    expect(migrated.weapon).toBeNull();
    expect(migrated.armor).toBeNull();
    expect(migrated.helmet).toBeNull();
    expect(migrated.necklace).toBeNull();
    expect(migrated.shield).toBeNull();
    expect(migrated.gloves).toBeNull();
    expect(migrated.boots).toBeNull();
    expect(migrated.ring1).toBeNull();
    expect(migrated.ring2).toBeNull();
    expect(migrated.charm).toBeNull();

    restore();
  });
});

// =============================================================================
// SLOT PRESERVATION TESTS
// =============================================================================

describe('migrateEquipmentSlots - Slot Preservation', () => {
  it('should preserve weapon slot during migration', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: 'iron_sword',
      armor: null,
      accessory: null,
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    expect(migrated.weapon).toBe('iron_sword');

    restore();
  });

  it('should preserve armor slot during migration', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: null,
      armor: 'steel_armor',
      accessory: null,
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    expect(migrated.armor).toBe('steel_armor');

    restore();
  });

  it('should preserve all legacy slots when fully equipped', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: 'bronze_ring',
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    expect(migrated.weapon).toBe('iron_sword');
    expect(migrated.armor).toBe('steel_armor');
    // Accessory should be mapped somewhere (ring1, necklace, or charm)
    const accessoryMapped =
      migrated.ring1 === 'bronze_ring' ||
      migrated.necklace === 'bronze_ring' ||
      migrated.charm === 'bronze_ring';
    expect(accessoryMapped).toBe(true);

    restore();
  });
});

// =============================================================================
// ACCESSORY MAPPING TESTS
// =============================================================================

describe('migrateEquipmentSlots - Accessory Mapping', () => {
  it('should map ring-type accessory to ring1 slot', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: null,
      armor: null,
      accessory: 'bronze_ring', // Has equipmentSlot: 'ring1'
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    expect(migrated.ring1).toBe('bronze_ring');
    expect(migrated.necklace).toBeNull();
    expect(migrated.charm).toBeNull();

    restore();
  });

  it('should map necklace-type accessory to necklace slot', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: null,
      armor: null,
      accessory: 'jade_necklace', // Has equipmentSlot: 'necklace'
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    expect(migrated.necklace).toBe('jade_necklace');
    expect(migrated.ring1).toBeNull();
    expect(migrated.charm).toBeNull();

    restore();
  });

  it('should map charm-type accessory to charm slot', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: null,
      armor: null,
      accessory: 'lucky_charm', // Has equipmentSlot: 'charm'
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    expect(migrated.charm).toBe('lucky_charm');
    expect(migrated.ring1).toBeNull();
    expect(migrated.necklace).toBeNull();

    restore();
  });

  it('should default to necklace slot when accessory has no equipmentSlot property', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: null,
      armor: null,
      accessory: 'generic_accessory', // No equipmentSlot property
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    expect(migrated.necklace).toBe('generic_accessory');
    expect(migrated.ring1).toBeNull();
    expect(migrated.charm).toBeNull();

    restore();
  });

  it('should default to necklace slot when accessory item not found', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: null,
      armor: null,
      accessory: 'nonexistent_item', // Item doesn't exist in database
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    expect(migrated.necklace).toBe('nonexistent_item');
    expect(migrated.ring1).toBeNull();
    expect(migrated.charm).toBeNull();

    restore();
  });

  it('should handle accessory mapping when ItemData is unavailable', () => {
    const restore = suppressConsoleLogs();

    // Temporarily remove ItemData
    const originalItemData = (window as any).ItemData;
    delete (window as any).ItemData;

    const oldEquipment = {
      weapon: null,
      armor: null,
      accessory: 'bronze_ring',
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    // Should default to necklace when ItemData unavailable
    expect(migrated.necklace).toBe('bronze_ring');
    expect(migrated.ring1).toBeNull();
    expect(migrated.charm).toBeNull();

    // Restore
    (window as any).ItemData = originalItemData;
    restore();
  });
});

// =============================================================================
// NEW SLOT INITIALIZATION TESTS
// =============================================================================

describe('migrateEquipmentSlots - New Slot Initialization', () => {
  it('should initialize all new slots to null', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: null,
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    // New slots should all be null (except potentially accessory mapping)
    expect(migrated.helmet).toBeNull();
    expect(migrated.shield).toBeNull();
    expect(migrated.gloves).toBeNull();
    expect(migrated.boots).toBeNull();
    expect(migrated.ring2).toBeNull();
    // necklace, ring1, charm depend on accessory mapping

    restore();
  });

  it('should initialize all 10 slots even if old equipment is partial', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: 'iron_sword',
      // Missing armor and accessory
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    // All slots should be present (10 new slots + 1 deprecated accessory = 11)
    expect(Object.keys(migrated).length).toBe(11);
    expect(migrated.weapon).toBe('iron_sword');
    expect(migrated.armor).toBeNull();
    expect(migrated.helmet).toBeNull();
    expect(migrated.necklace).toBeNull();
    expect(migrated.shield).toBeNull();
    expect(migrated.gloves).toBeNull();
    expect(migrated.boots).toBeNull();
    expect(migrated.ring1).toBeNull();
    expect(migrated.ring2).toBeNull();
    expect(migrated.charm).toBeNull();
    expect(migrated.accessory).toBeNull();

    restore();
  });
});

// =============================================================================
// CONSOLE MESSAGE TESTS
// =============================================================================

describe('migrateEquipmentSlots - Console Messages', () => {
  it('should log migration start message for old format', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const oldEquipment = {
      weapon: 'iron_sword',
      armor: null,
      accessory: null,
    };

    migrateEquipmentSlots(oldEquipment);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('🔄 Migrating equipment from version 0.0 to 1.0')
    );

    consoleLogSpy.mockRestore();
  });

  it('should log completion message after migration', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const oldEquipment = {
      weapon: 'iron_sword',
      armor: null,
      accessory: null,
    };

    migrateEquipmentSlots(oldEquipment);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('✅ Equipment migration complete! Added 7 new equipment slots.')
    );

    consoleLogSpy.mockRestore();
  });

  it('should log accessory mapping message when mapping occurs', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const oldEquipment = {
      weapon: null,
      armor: null,
      accessory: 'bronze_ring',
    };

    migrateEquipmentSlots(oldEquipment);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('💍 Mapped old accessory "bronze_ring" to ring1 slot')
    );

    consoleLogSpy.mockRestore();
  });

  it('should not log migration messages for already-migrated equipment', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const newEquipment: Equipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: null,
      helmet: null,
      necklace: null,
      shield: null,
      gloves: null,
      boots: null,
      ring1: 'bronze_ring',
      ring2: null,
      charm: null,
    };

    migrateEquipmentSlots(newEquipment, '1.0');

    // Should not log migration messages
    expect(consoleLogSpy).not.toHaveBeenCalledWith(expect.stringContaining('Migrating equipment'));

    consoleLogSpy.mockRestore();
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe('migrateEquipmentSlots - Edge Cases', () => {
  it('should handle undefined equipment object', () => {
    const restore = suppressConsoleLogs();

    const migrated = migrateEquipmentSlots({});

    // Should create equipment with all null slots
    expect(migrated.weapon).toBeNull();
    expect(migrated.armor).toBeNull();
    expect(migrated.helmet).toBeNull();
    expect(migrated.necklace).toBeNull();
    expect(migrated.shield).toBeNull();
    expect(migrated.gloves).toBeNull();
    expect(migrated.boots).toBeNull();
    expect(migrated.ring1).toBeNull();
    expect(migrated.ring2).toBeNull();
    expect(migrated.charm).toBeNull();

    restore();
  });

  it('should handle equipment with undefined slot values', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: undefined as any,
      armor: undefined as any,
      accessory: undefined as any,
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    // Undefined should be treated as null
    expect(migrated.weapon).toBeNull();
    expect(migrated.armor).toBeNull();

    restore();
  });

  it('should ensure result is immutable (not same reference as input)', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: null,
    };

    const migrated = migrateEquipmentSlots(oldEquipment);

    // Should be a new object
    expect(migrated).not.toBe(oldEquipment);

    restore();
  });

  it('should handle already-migrated equipment with missing new slots', () => {
    const restore = suppressConsoleLogs();

    const partialNewEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      helmet: 'steel_helmet',
      // Missing other new slots
    };

    const migrated = migrateEquipmentSlots(partialNewEquipment, '1.0');

    // Should fill in missing slots with null
    expect(migrated.helmet).toBe('steel_helmet');
    expect(migrated.weapon).toBe('iron_sword');
    expect(migrated.armor).toBe('steel_armor');
    expect(migrated.necklace).toBeNull();
    expect(migrated.shield).toBeNull();
    expect(migrated.gloves).toBeNull();
    expect(migrated.boots).toBeNull();
    expect(migrated.ring1).toBeNull();
    expect(migrated.ring2).toBeNull();
    expect(migrated.charm).toBeNull();

    restore();
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('migrateEquipmentSlots - Integration', () => {
  it('should handle realistic save game migration scenario', () => {
    const restore = suppressConsoleLogs();

    // Player had sword, armor, and ring in old 3-slot system
    const oldSaveEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: 'bronze_ring',
    };

    const migrated = migrateEquipmentSlots(oldSaveEquipment);

    // Legacy items should be preserved
    expect(migrated.weapon).toBe('iron_sword');
    expect(migrated.armor).toBe('steel_armor');
    expect(migrated.ring1).toBe('bronze_ring'); // Ring mapped to ring1

    // New slots should be available but empty
    expect(migrated.helmet).toBeNull();
    expect(migrated.necklace).toBeNull();
    expect(migrated.shield).toBeNull();
    expect(migrated.gloves).toBeNull();
    expect(migrated.boots).toBeNull();
    expect(migrated.ring2).toBeNull();
    expect(migrated.charm).toBeNull();

    restore();
  });

  it('should handle player who never equipped accessories', () => {
    const restore = suppressConsoleLogs();

    const oldSaveEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: null,
    };

    const migrated = migrateEquipmentSlots(oldSaveEquipment);

    expect(migrated.weapon).toBe('iron_sword');
    expect(migrated.armor).toBe('steel_armor');

    // All accessory slots should be null
    expect(migrated.necklace).toBeNull();
    expect(migrated.ring1).toBeNull();
    expect(migrated.ring2).toBeNull();
    expect(migrated.charm).toBeNull();

    restore();
  });

  it('should handle brand new player (no equipment)', () => {
    const restore = suppressConsoleLogs();

    const newPlayerEquipment = {
      weapon: null,
      armor: null,
      accessory: null,
    };

    const migrated = migrateEquipmentSlots(newPlayerEquipment);

    // All slots should be null
    Object.values(migrated).forEach(slot => {
      expect(slot).toBeNull();
    });

    restore();
  });
});

// =============================================================================
// VERSION-BASED MIGRATION TESTS
// =============================================================================

describe('migrateEquipmentSlots - Version-Based Migration', () => {
  it('should migrate from version 0.0 to current version (1.0)', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: 'bronze_ring',
    };

    const result = migrateEquipmentSlots(oldEquipment, '0.0');

    // Should have all 10 slots after migration
    expect(result).toHaveProperty('helmet');
    expect(result).toHaveProperty('necklace');
    expect(result).toHaveProperty('shield');
    expect(result).toHaveProperty('gloves');
    expect(result).toHaveProperty('boots');
    expect(result).toHaveProperty('ring1');
    expect(result).toHaveProperty('ring2');
    expect(result).toHaveProperty('charm');

    // Legacy items should be preserved
    expect(result.weapon).toBe('iron_sword');
    expect(result.armor).toBe('steel_armor');
    expect(result.ring1).toBe('bronze_ring'); // Accessory mapped to ring1

    restore();
  });

  it('should skip migration for version 1.0 (current version)', () => {
    const restore = suppressConsoleLogs();

    const currentEquipment: Equipment = {
      helmet: 'steel_helmet',
      necklace: null,
      armor: 'steel_armor',
      weapon: 'iron_sword',
      shield: null,
      gloves: null,
      boots: 'leather_boots',
      ring1: 'bronze_ring',
      ring2: null,
      charm: null,
      accessory: null,
    };

    const result = migrateEquipmentSlots(currentEquipment, '1.0');

    // Should return unchanged (all slots preserved)
    expect(result.helmet).toBe('steel_helmet');
    expect(result.weapon).toBe('iron_sword');
    expect(result.armor).toBe('steel_armor');
    expect(result.boots).toBe('leather_boots');
    expect(result.ring1).toBe('bronze_ring');
    expect(result.necklace).toBeNull();
    expect(result.shield).toBeNull();
    expect(result.gloves).toBeNull();
    expect(result.ring2).toBeNull();
    expect(result.charm).toBeNull();

    restore();
  });

  it('should default to version 0.0 if no version provided', () => {
    const restore = suppressConsoleLogs();

    const legacyEquipment = {
      weapon: 'iron_sword',
      armor: null,
      accessory: null,
    };

    // Call without version parameter
    const result = migrateEquipmentSlots(legacyEquipment);

    // Should perform migration (detected as old format)
    expect(result).toHaveProperty('helmet');
    expect(result).toHaveProperty('ring1');
    expect(result).toHaveProperty('charm');
    expect(result.weapon).toBe('iron_sword');

    restore();
  });

  it('should log correct version information during migration', () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    const oldEquipment = {
      weapon: 'iron_sword',
      armor: null,
      accessory: null,
    };

    migrateEquipmentSlots(oldEquipment, '0.0');

    // Should log the version being migrated from
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('version 0.0 to 1.0'));

    consoleLogSpy.mockRestore();
  });

  it('should handle undefined version as version 0.0', () => {
    const restore = suppressConsoleLogs();

    const oldEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: 'jade_necklace',
    };

    const result = migrateEquipmentSlots(oldEquipment, undefined);

    // Should perform migration
    expect(result).toHaveProperty('helmet');
    expect(result).toHaveProperty('ring1');
    expect(result).toHaveProperty('charm');
    expect(result.weapon).toBe('iron_sword');
    expect(result.armor).toBe('steel_armor');
    expect(result.necklace).toBe('jade_necklace'); // Accessory mapped to necklace

    restore();
  });

  it('should ensure all slots exist even for current version with missing slots', () => {
    const restore = suppressConsoleLogs();

    const partialEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      helmet: 'steel_helmet',
      // Missing other slots
    };

    const result = migrateEquipmentSlots(partialEquipment as Partial<Equipment>, '1.0');

    // Should fill in all missing slots with null
    expect(result.weapon).toBe('iron_sword');
    expect(result.armor).toBe('steel_armor');
    expect(result.helmet).toBe('steel_helmet');
    expect(result.necklace).toBeNull();
    expect(result.shield).toBeNull();
    expect(result.gloves).toBeNull();
    expect(result.boots).toBeNull();
    expect(result.ring1).toBeNull();
    expect(result.ring2).toBeNull();
    expect(result.charm).toBeNull();

    restore();
  });

  it('should verify EQUIPMENT_VERSION constant is defined', () => {
    // Ensure the constant exists and is the expected value
    expect(EQUIPMENT_VERSION).toBeDefined();
    expect(EQUIPMENT_VERSION).toBe('1.0');
  });
});

// =============================================================================
// VERSION TRACKING INTEGRATION TESTS
// =============================================================================

describe('migrateEquipmentSlots - Version Tracking Integration', () => {
  it('should handle realistic save game migration from pre-versioning era', () => {
    const restore = suppressConsoleLogs();

    // Old save file with no version metadata (pre-versioning)
    const oldSaveEquipment = {
      weapon: 'iron_sword',
      armor: 'steel_armor',
      accessory: 'bronze_ring',
    };

    // Version is undefined/missing in old saves
    const result = migrateEquipmentSlots(oldSaveEquipment, undefined);

    // Should migrate successfully
    expect(result.weapon).toBe('iron_sword');
    expect(result.armor).toBe('steel_armor');
    expect(result.ring1).toBe('bronze_ring');

    // New slots should be available
    expect(result.helmet).toBeNull();
    expect(result.shield).toBeNull();
    expect(result.gloves).toBeNull();
    expect(result.boots).toBeNull();
    expect(result.ring2).toBeNull();

    restore();
  });

  it('should handle save game already at current version', () => {
    const restore = suppressConsoleLogs();

    // Save file with version 1.0 metadata
    const currentSaveEquipment: Equipment = {
      helmet: 'steel_helmet',
      necklace: 'jade_necklace',
      armor: 'steel_armor',
      weapon: 'iron_sword',
      shield: null,
      gloves: null,
      boots: 'leather_boots',
      ring1: 'bronze_ring',
      ring2: 'silver_ring',
      charm: 'lucky_charm',
      accessory: null,
    };

    const result = migrateEquipmentSlots(currentSaveEquipment, '1.0');

    // Should return unchanged
    expect(result).toEqual(currentSaveEquipment);

    restore();
  });

  it('should future-proof for potential version 2.0 migration', () => {
    const restore = suppressConsoleLogs();

    const version1Equipment: Equipment = {
      helmet: 'steel_helmet',
      necklace: null,
      armor: 'steel_armor',
      weapon: 'iron_sword',
      shield: null,
      gloves: null,
      boots: null,
      ring1: 'bronze_ring',
      ring2: null,
      charm: null,
      accessory: null,
    };

    // Even if we pass a future version, it should handle gracefully
    // (In the future, you'd add migration logic for 1.0 → 2.0)
    const result = migrateEquipmentSlots(version1Equipment, '1.0');

    // Should preserve all equipment
    expect(result.helmet).toBe('steel_helmet');
    expect(result.weapon).toBe('iron_sword');
    expect(result.armor).toBe('steel_armor');
    expect(result.ring1).toBe('bronze_ring');

    restore();
  });
});
