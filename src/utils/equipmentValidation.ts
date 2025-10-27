/**
 * Equipment Validation Utility
 *
 * Validates equipped items on game load to ensure all equipped item IDs
 * still exist in the item database. Prevents errors when items are removed
 * from the game in updates.
 *
 * This is critical for maintaining save compatibility across game versions.
 */

import type { Equipment } from '../contexts/ReactGameContext';
import type { EquipmentSlot } from '../types/inventory';

// =============================================================================
// VERSION TRACKING
// =============================================================================

/**
 * Current equipment system version
 *
 * Version history:
 * - 1.0: 10-slot system (helmet, necklace, armor, weapon, shield, gloves, boots, ring1, ring2, charm)
 * - 0.0: Legacy 3-slot system (weapon, armor, accessory) - no longer used
 *
 * This version number is saved with game data to enable future migrations
 * and maintain backward compatibility as the equipment system evolves.
 */
export const EQUIPMENT_VERSION = '1.0';

// =============================================================================
// TYPES
// =============================================================================

export interface EquipmentValidationResult {
  /** True if all equipped items are valid */
  isValid: boolean;
  /** Slots that contain invalid item IDs */
  invalidSlots: EquipmentSlot[];
  /** Slots that contain valid item IDs */
  validSlots: EquipmentSlot[];
  /** Kid-friendly warning messages */
  warnings: string[];
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates all equipped items against the item database
 *
 * Checks each equipment slot to ensure the item ID still exists in ItemData.
 * Returns detailed results about which slots are valid/invalid.
 *
 * @param equipment - The player's equipment object with 10 slots
 * @returns Validation result with detailed slot information
 */
export const validateEquippedItems = (equipment: Equipment): EquipmentValidationResult => {
  const invalidSlots: EquipmentSlot[] = [];
  const validSlots: EquipmentSlot[] = [];
  const warnings: string[] = [];

  // Access global ItemData from legacy data files
  const ItemData = (window as any).ItemData;

  if (!ItemData || typeof ItemData.getItem !== 'function') {
    console.error('❌ ItemData not available - cannot validate equipment');
    warnings.push('Unable to validate equipment - item database not loaded');
    return {
      isValid: false,
      invalidSlots: [],
      validSlots: [],
      warnings
    };
  }

  // Check each equipment slot
  for (const [slot, itemId] of Object.entries(equipment)) {
    // Skip empty slots (null is valid)
    if (itemId === null) {
      continue;
    }

    // Validate that the item ID exists in the database
    const item = ItemData.getItem(itemId);

    if (!item) {
      invalidSlots.push(slot as EquipmentSlot);
      warnings.push(`⚠️ Item "${itemId}" in ${slot} slot no longer exists in the game`);
    } else {
      validSlots.push(slot as EquipmentSlot);
    }
  }

  const isValid = invalidSlots.length === 0;

  return {
    isValid,
    invalidSlots,
    validSlots,
    warnings
  };
};

/**
 * Removes invalid items from equipment and returns a cleaned copy
 *
 * This function is safe to call during game load - it creates a new equipment
 * object with invalid slots set to null, preserving all valid equipment.
 *
 * @param equipment - The equipment object to clean
 * @returns A new equipment object with invalid items removed
 */
export const cleanInvalidEquipment = (equipment: Equipment): Equipment => {
  const validation = validateEquippedItems(equipment);

  // If everything is valid, return original equipment unchanged
  if (validation.isValid) {
    return equipment;
  }

  // Create a cleaned copy of equipment
  const cleaned = { ...equipment };

  // Set invalid slots to null
  for (const slot of validation.invalidSlots) {
    console.warn(`🧹 Removing invalid item from ${slot} slot`);
    cleaned[slot] = null;
  }

  // Kid-friendly message about what happened
  if (validation.invalidSlots.length > 0) {
    const slotNames = validation.invalidSlots.join(', ');
    console.log(
      `✨ Some equipment was removed in a game update. ` +
      `The following slots are now empty: ${slotNames}. ` +
      `Don't worry - you can find new equipment in your adventures!`
    );
  }

  // Log all warnings
  validation.warnings.forEach(warning => console.warn(warning));

  return cleaned;
};

/**
 * Validates a single equipment slot
 *
 * Useful for checking if a specific slot has a valid item without
 * validating the entire equipment set.
 *
 * @param itemId - The item ID to validate
 * @param slot - The slot being checked (for logging)
 * @returns True if the item exists in the database or is null
 */
export const validateEquipmentSlot = (
  itemId: string | null,
  slot: EquipmentSlot
): boolean => {
  // Null/empty slots are always valid
  if (itemId === null) {
    return true;
  }

  const ItemData = (window as any).ItemData;

  if (!ItemData || typeof ItemData.getItem !== 'function') {
    console.error('❌ ItemData not available - cannot validate slot');
    return false;
  }

  const item = ItemData.getItem(itemId);
  const isValid = item !== null;

  if (!isValid) {
    console.warn(`⚠️ Invalid item "${itemId}" in ${slot} slot`);
  }

  return isValid;
};

/**
 * Gets a summary of equipment validation for logging/debugging
 *
 * @param validation - The validation result to summarize
 * @returns A human-readable summary string
 */
export const getValidationSummary = (validation: EquipmentValidationResult): string => {
  if (validation.isValid) {
    return '✅ All equipped items are valid';
  }

  const totalSlots = validation.validSlots.length + validation.invalidSlots.length;
  const invalidCount = validation.invalidSlots.length;

  return (
    `⚠️ Equipment validation found ${invalidCount} invalid slot(s) out of ${totalSlots} equipped items. ` +
    `Invalid slots: ${validation.invalidSlots.join(', ')}`
  );
};

// =============================================================================
// EQUIPMENT SLOT MIGRATION
// =============================================================================

/**
 * Migrates equipment based on version
 *
 * This function handles backward compatibility for save files created before
 * the equipment system expansion. Old saves only had weapon, armor, and accessory
 * slots. This migration adds the new slots (helmet, necklace, shield, gloves,
 * boots, ring1, ring2, charm) and attempts to intelligently map the old
 * accessory slot to the appropriate new slot based on item type.
 *
 * Migration rules:
 * - Version 0.0 (3-slot) → Version 1.0 (10-slot):
 *   - Weapon slot → Preserved in weapon slot
 *   - Armor slot → Preserved in armor slot
 *   - Accessory slot → Mapped to necklace, ring1, or charm based on item's equipmentSlot property
 *   - New slots (helmet, shield, gloves, boots, ring2) → Initialized to null
 *
 * @param equipment - The equipment object to migrate (may be old or new format)
 * @param fromVersion - The version of the equipment data (defaults to '0.0' if not specified)
 * @returns A fully migrated equipment object with all 10 slots
 */
export const migrateEquipmentSlots = (
  equipment: Partial<Equipment>,
  fromVersion?: string
): Equipment => {
  // If no version specified, check structure to determine version
  // Old format (pre-versioning) is treated as version 0.0
  const version = fromVersion || '0.0';

  // Check if migration is needed by looking for new slot properties
  const hasNewSlots = 'helmet' in equipment || 'ring1' in equipment || 'charm' in equipment;

  // Version 1.0 (current) - no migration needed
  if (version === EQUIPMENT_VERSION && hasNewSlots) {
    // Already at current version - just ensure all slots exist with proper null values
    return ensureAllSlots(equipment);
  }

  // Version 0.0 → Version 1.0 migration (3-slot → 10-slot)
  if (version === '0.0' || !hasNewSlots) {
    console.log(`🔄 Migrating equipment from version ${version} to ${EQUIPMENT_VERSION}...`);
    return performLegacyMigration(equipment);
  }

  // Should not reach here, but ensure all slots as fallback
  return ensureAllSlots(equipment);
};

/**
 * Ensures all 10 equipment slots exist with proper null values
 *
 * Helper function for equipment already at current version but may have missing slots.
 *
 * @param equipment - Partial equipment object
 * @returns Complete equipment object with all 10 slots
 */
const ensureAllSlots = (equipment: Partial<Equipment>): Equipment => {
  return {
    helmet: equipment.helmet ?? null,
    necklace: equipment.necklace ?? null,
    armor: equipment.armor ?? null,
    weapon: equipment.weapon ?? null,
    shield: equipment.shield ?? null,
    gloves: equipment.gloves ?? null,
    boots: equipment.boots ?? null,
    ring1: equipment.ring1 ?? null,
    ring2: equipment.ring2 ?? null,
    charm: equipment.charm ?? null,
    accessory: equipment.accessory ?? null // Deprecated but kept for backward compatibility
  };
};

/**
 * Performs legacy 3-slot → 10-slot migration
 *
 * Handles the actual migration logic for old save files.
 *
 * @param equipment - Legacy equipment object
 * @returns Fully migrated equipment with all 10 slots
 */
const performLegacyMigration = (equipment: Partial<Equipment>): Equipment => {
  // Initialize new slots
  let necklace: string | null = null;
  let ring1: string | null = null;
  let charm: string | null = null;

  // Handle old accessory slot - try to intelligently map to correct new slot
  if (equipment.accessory) {
    // Access global ItemData from legacy data files
    const ItemData = (window as any).ItemData;

    if (ItemData && typeof ItemData.getItem === 'function') {
      const item = ItemData.getItem(equipment.accessory);

      if (item && item.equipmentSlot) {
        // Item has explicit slot information - use it
        if (item.equipmentSlot === 'necklace') {
          necklace = equipment.accessory;
          console.log(`📿 Mapped old accessory "${equipment.accessory}" to necklace slot`);
        } else if (item.equipmentSlot === 'ring1' || item.equipmentSlot === 'ring2' || item.equipmentSlot === 'ring') {
          ring1 = equipment.accessory;
          console.log(`💍 Mapped old accessory "${equipment.accessory}" to ring1 slot`);
        } else if (item.equipmentSlot === 'charm') {
          charm = equipment.accessory;
          console.log(`🔮 Mapped old accessory "${equipment.accessory}" to charm slot`);
        } else {
          // Fallback: default to necklace if slot type is unclear
          necklace = equipment.accessory;
          console.log(`📿 Mapped old accessory "${equipment.accessory}" to necklace slot (default mapping)`);
        }
      } else {
        // Item not found or no slot info - default to necklace
        necklace = equipment.accessory;
        console.log(`📿 Mapped old accessory "${equipment.accessory}" to necklace slot (item not found, using default)`);
      }
    } else {
      // ItemData not available - default to necklace
      necklace = equipment.accessory;
      console.log(`📿 Mapped old accessory "${equipment.accessory}" to necklace slot (ItemData unavailable, using default)`);
    }
  }

  // Create the fully migrated equipment object
  const migrated: Equipment = {
    helmet: null,
    necklace,
    armor: equipment.armor ?? null,
    weapon: equipment.weapon ?? null,
    shield: null,
    gloves: null,
    boots: null,
    ring1,
    ring2: null,
    charm,
    accessory: null // Deprecated but kept for backward compatibility
  };

  console.log('✅ Equipment migration complete! Added 7 new equipment slots.');

  return migrated;
};

// =============================================================================
// DEVELOPMENT HELPERS
// =============================================================================

/**
 * Validates equipment and logs detailed information (development only)
 *
 * This is useful during development to see exactly what's happening
 * with equipment validation.
 */
export const debugEquipmentValidation = (equipment: Equipment): void => {
  console.group('🔍 Equipment Validation Debug');

  const validation = validateEquippedItems(equipment);

  console.log('Validation Result:', validation);
  console.log('Summary:', getValidationSummary(validation));

  if (validation.validSlots.length > 0) {
    console.log('✅ Valid slots:', validation.validSlots);
  }

  if (validation.invalidSlots.length > 0) {
    console.error('❌ Invalid slots:', validation.invalidSlots);
    validation.warnings.forEach(warning => console.warn(warning));
  }

  console.groupEnd();
};
