/**
 * Item Data Validator
 *
 * Validates equipment items from legacy JavaScript data files and detects
 * migration needs for the enhanced equipment system.
 *
 * This utility ensures that item data from public/data/items.js is compatible
 * with the TypeScript EnhancedItem interface and the 10-slot equipment system.
 */

import type {
  EnhancedItem,
  EquipmentSlot,
  EquipmentSubtype,
  ItemCategory,
  ItemRarity
} from '../types/inventory';
import type { PlayerStats } from '../types/game';

// =============================================================================
// VALIDATION RESULT TYPES
// =============================================================================

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: any;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  code: string;
  message: string;
  recommendation?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  migrationNeeded: boolean;
  itemId?: string;
  itemType?: string;
}

export interface ValidationReport {
  totalItems: number;
  validItems: number;
  invalidItems: number;
  itemsNeedingMigration: number;
  results: Map<string, ValidationResult>;
  summary: {
    criticalErrors: number;
    warnings: number;
    byCategory: Record<string, number>;
  };
}

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================

const VALID_EQUIPMENT_SLOTS: EquipmentSlot[] = [
  'helmet', 'necklace', 'armor', 'weapon', 'shield',
  'gloves', 'boots', 'ring1', 'ring2', 'charm'
];

const VALID_EQUIPMENT_SUBTYPES: EquipmentSubtype[] = [
  'sword', 'bow', 'staff', 'dagger', 'axe', 'mace',
  'helmet', 'chestplate', 'boots', 'gloves', 'shield',
  'ring', 'necklace', 'charm'
];

const VALID_ITEM_CATEGORIES: ItemCategory[] = [
  'consumables', 'equipment', 'materials', 'quest', 'misc'
];

const VALID_RARITIES: ItemRarity[] = [
  'common', 'rare', 'epic', 'legendary'
];

const VALID_STAT_FIELDS: (keyof PlayerStats)[] = [
  'attack', 'defense', 'magicAttack', 'magicDefense',
  'speed', 'accuracy', 'maxHp', 'maxMp'
];

// Legacy field names that need migration
const LEGACY_FIELDS = {
  STATS: 'stats',           // Should be 'statModifiers'
  OLD_SLOT_NAMES: ['accessory'], // Old slot names that need updating
};

// =============================================================================
// CORE VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates a single equipment item for compatibility with the enhanced equipment system
 */
export function validateEquipmentItem(item: any, itemId?: string): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    migrationNeeded: false,
    itemId,
    itemType: item?.type
  };

  // Basic existence check
  if (!item) {
    result.valid = false;
    result.errors.push({
      code: 'ITEM_NULL',
      message: 'Item is null or undefined',
      severity: 'error'
    });
    return result;
  }

  // Check for required base fields
  validateRequiredFields(item, result);

  // Check if item is equipment type
  const isEquipment = isEquipmentType(item);

  if (isEquipment) {
    // Validate equipment-specific fields
    validateEquipmentSlot(item, result);
    validateEquipmentSubtype(item, result);
    validateStatModifiers(item, result);

    // Check for legacy fields that need migration
    checkLegacyFields(item, result);
  }

  // Validate optional but important fields
  validateRarity(item, result);
  validateRequirements(item, result);

  // Set overall validity
  result.valid = result.errors.filter(e => e.severity === 'error').length === 0;

  return result;
}

/**
 * Validates all items in an items object (like ItemData from items.js)
 */
export function validateItemData(items: Record<string, any>): ValidationReport {
  const results = new Map<string, ValidationResult>();
  let validCount = 0;
  let invalidCount = 0;
  let migrationCount = 0;
  let criticalErrors = 0;
  let warningCount = 0;
  const categoryStats: Record<string, number> = {};

  for (const [itemId, item] of Object.entries(items)) {
    const validationResult = validateEquipmentItem(item, itemId);
    results.set(itemId, validationResult);

    // Update statistics
    if (validationResult.valid) {
      validCount++;
    } else {
      invalidCount++;
    }

    if (validationResult.migrationNeeded) {
      migrationCount++;
    }

    criticalErrors += validationResult.errors.filter(e => e.severity === 'error').length;
    warningCount += validationResult.warnings.length;

    // Track by category
    const itemType = item?.type || 'unknown';
    categoryStats[itemType] = (categoryStats[itemType] || 0) + 1;
  }

  return {
    totalItems: results.size,
    validItems: validCount,
    invalidItems: invalidCount,
    itemsNeedingMigration: migrationCount,
    results,
    summary: {
      criticalErrors,
      warnings: warningCount,
      byCategory: categoryStats
    }
  };
}

/**
 * Migrates a legacy item to the enhanced item format
 * Transforms old field names and structures to match EnhancedItem interface
 */
export function migrateItemData(item: any): Partial<EnhancedItem> {
  const migrated: any = { ...item };

  // Migrate 'stats' field to 'statModifiers'
  if (item.stats && !item.statModifiers) {
    migrated.statModifiers = item.stats;
    delete migrated.stats;
  }

  // Migrate legacy slot names
  if (item.equipmentSlot === 'accessory') {
    // Need context to determine if it's ring, necklace, or charm
    // Default to charm if we can't determine
    if (item.equipmentSubtype === 'ring') {
      migrated.equipmentSlot = 'ring1';
    } else if (item.equipmentSubtype === 'necklace') {
      migrated.equipmentSlot = 'necklace';
    } else {
      migrated.equipmentSlot = 'charm';
    }
  }

  // Ensure equipment has required fields
  if (isEquipmentType(item)) {
    // Add equipmentSlot if missing based on type
    if (!migrated.equipmentSlot) {
      migrated.equipmentSlot = inferEquipmentSlot(item);
    }

    // Add equipmentSubtype if missing
    if (!migrated.equipmentSubtype) {
      migrated.equipmentSubtype = inferEquipmentSubtype(item);
    }

    // Ensure statModifiers exists (even if empty)
    if (!migrated.statModifiers) {
      migrated.statModifiers = {};
    }
  }

  // Set default category if missing
  if (!migrated.category) {
    migrated.category = inferCategory(item);
  }

  // Set default rarity if invalid
  if (!VALID_RARITIES.includes(migrated.rarity)) {
    migrated.rarity = 'common';
  }

  return migrated;
}

// =============================================================================
// HELPER VALIDATION FUNCTIONS
// =============================================================================

function validateRequiredFields(item: any, result: ValidationResult): void {
  const requiredFields = ['name', 'description', 'type'];

  for (const field of requiredFields) {
    if (!item[field]) {
      result.errors.push({
        code: 'MISSING_REQUIRED_FIELD',
        message: `Missing required field: ${field}`,
        field,
        severity: 'error'
      });
    }
  }
}

function validateEquipmentSlot(item: any, result: ValidationResult): void {
  if (!item.equipmentSlot) {
    result.errors.push({
      code: 'MISSING_EQUIPMENT_SLOT',
      message: 'Equipment item is missing equipmentSlot field',
      field: 'equipmentSlot',
      severity: 'error'
    });
    result.migrationNeeded = true;
    return;
  }

  if (!VALID_EQUIPMENT_SLOTS.includes(item.equipmentSlot)) {
    // Check if it's a legacy slot name
    if (LEGACY_FIELDS.OLD_SLOT_NAMES.includes(item.equipmentSlot)) {
      result.warnings.push({
        code: 'LEGACY_SLOT_NAME',
        message: `Legacy equipment slot name: ${item.equipmentSlot}`,
        recommendation: 'Migrate to new slot names: ring1, ring2, necklace, charm'
      });
      result.migrationNeeded = true;
    } else {
      result.errors.push({
        code: 'INVALID_EQUIPMENT_SLOT',
        message: `Invalid equipmentSlot value: ${item.equipmentSlot}`,
        field: 'equipmentSlot',
        value: item.equipmentSlot,
        severity: 'error'
      });
    }
  }
}

function validateEquipmentSubtype(item: any, result: ValidationResult): void {
  if (!item.equipmentSubtype) {
    result.warnings.push({
      code: 'MISSING_EQUIPMENT_SUBTYPE',
      message: 'Equipment item is missing equipmentSubtype field',
      recommendation: 'Add equipmentSubtype for better slot matching (e.g., "sword", "helmet", "ring")'
    });
    result.migrationNeeded = true;
    return;
  }

  if (!VALID_EQUIPMENT_SUBTYPES.includes(item.equipmentSubtype)) {
    result.warnings.push({
      code: 'UNKNOWN_EQUIPMENT_SUBTYPE',
      message: `Unknown equipmentSubtype: ${item.equipmentSubtype}`,
      recommendation: 'Verify this is a valid subtype for the equipment system'
    });
  }
}

function validateStatModifiers(item: any, result: ValidationResult): void {
  // Check for legacy 'stats' field
  if (item.stats && !item.statModifiers) {
    result.warnings.push({
      code: 'LEGACY_STATS_FIELD',
      message: 'Item uses legacy "stats" field instead of "statModifiers"',
      recommendation: 'Migrate to use "statModifiers" field'
    });
    result.migrationNeeded = true;
  }

  // Validate statModifiers structure
  const statsToValidate = item.statModifiers || item.stats;

  if (!statsToValidate) {
    result.warnings.push({
      code: 'NO_STAT_MODIFIERS',
      message: 'Equipment item has no stat modifiers defined',
      recommendation: 'Add statModifiers object with stat bonuses'
    });
    return;
  }

  // Check if stats are valid PlayerStats fields
  for (const [stat, value] of Object.entries(statsToValidate)) {
    if (!VALID_STAT_FIELDS.includes(stat as keyof PlayerStats)) {
      result.warnings.push({
        code: 'UNKNOWN_STAT_FIELD',
        message: `Unknown stat field: ${stat}`,
        recommendation: `Valid stats are: ${VALID_STAT_FIELDS.join(', ')}`
      });
    }

    if (typeof value !== 'number') {
      result.errors.push({
        code: 'INVALID_STAT_VALUE',
        message: `Stat value must be a number: ${stat}`,
        field: `statModifiers.${stat}`,
        value,
        severity: 'error'
      });
    }
  }
}

function validateRarity(item: any, result: ValidationResult): void {
  if (!item.rarity) {
    result.warnings.push({
      code: 'MISSING_RARITY',
      message: 'Item is missing rarity field',
      recommendation: 'Add rarity: "common" | "rare" | "epic" | "legendary"'
    });
    return;
  }

  if (!VALID_RARITIES.includes(item.rarity)) {
    result.errors.push({
      code: 'INVALID_RARITY',
      message: `Invalid rarity value: ${item.rarity}`,
      field: 'rarity',
      value: item.rarity,
      severity: 'warning'
    });
  }
}

function validateRequirements(item: any, result: ValidationResult): void {
  if (!item.requirements) {
    return; // Requirements are optional
  }

  const req = item.requirements;

  // Validate level requirement
  if (req.level !== undefined && (typeof req.level !== 'number' || req.level < 1)) {
    result.errors.push({
      code: 'INVALID_LEVEL_REQUIREMENT',
      message: 'Level requirement must be a positive number',
      field: 'requirements.level',
      value: req.level,
      severity: 'warning'
    });
  }

  // Validate class requirements
  if (req.classes !== undefined && !Array.isArray(req.classes)) {
    result.errors.push({
      code: 'INVALID_CLASS_REQUIREMENT',
      message: 'Class requirement must be an array',
      field: 'requirements.classes',
      value: req.classes,
      severity: 'warning'
    });
  }
}

function checkLegacyFields(item: any, result: ValidationResult): void {
  // Check for legacy 'stats' field
  if (item.stats && !item.statModifiers) {
    result.migrationNeeded = true;
  }

  // Check for legacy slot names
  if (LEGACY_FIELDS.OLD_SLOT_NAMES.includes(item.equipmentSlot)) {
    result.migrationNeeded = true;
  }

  // Check for missing new fields
  if (isEquipmentType(item) && !item.equipmentSubtype) {
    result.migrationNeeded = true;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function isEquipmentType(item: any): boolean {
  return item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory';
}

function inferEquipmentSlot(item: any): EquipmentSlot | undefined {
  if (item.type === 'weapon') return 'weapon';
  if (item.type === 'armor') {
    if (item.armorType === 'helmet') return 'helmet';
    return 'armor'; // Default to chest armor
  }
  if (item.type === 'accessory') {
    // Try to infer from subtype or name
    if (item.equipmentSubtype === 'ring' || item.name?.toLowerCase().includes('ring')) {
      return 'ring1';
    }
    if (item.equipmentSubtype === 'necklace' || item.name?.toLowerCase().includes('necklace')) {
      return 'necklace';
    }
    return 'charm'; // Default accessory slot
  }
  return undefined;
}

function inferEquipmentSubtype(item: any): EquipmentSubtype | undefined {
  // Try to infer from weaponType or armorType
  if (item.weaponType) return item.weaponType as EquipmentSubtype;
  if (item.armorType) {
    if (item.armorType === 'light' || item.armorType === 'medium' || item.armorType === 'heavy') {
      return 'chestplate';
    }
    return item.armorType as EquipmentSubtype;
  }

  // Try to infer from type
  if (item.type === 'weapon') return 'sword'; // Default weapon
  if (item.type === 'armor') return 'chestplate'; // Default armor
  if (item.type === 'accessory') return 'charm'; // Default accessory

  return undefined;
}

function inferCategory(item: any): ItemCategory {
  if (item.type === 'consumable') return 'consumables';
  if (isEquipmentType(item)) return 'equipment';
  if (item.type === 'material') return 'materials';
  if (item.type === 'quest') return 'quest';
  return 'misc';
}

// =============================================================================
// REPORTING AND OUTPUT
// =============================================================================

/**
 * Generates a human-readable validation report
 */
export function generateValidationReport(report: ValidationReport): string {
  const lines: string[] = [];

  lines.push('='.repeat(80));
  lines.push('ITEM DATA VALIDATION REPORT');
  lines.push('='.repeat(80));
  lines.push('');
  lines.push(`Total Items: ${report.totalItems}`);
  lines.push(`Valid Items: ${report.validItems} (${((report.validItems / report.totalItems) * 100).toFixed(1)}%)`);
  lines.push(`Invalid Items: ${report.invalidItems}`);
  lines.push(`Items Needing Migration: ${report.itemsNeedingMigration}`);
  lines.push('');
  lines.push(`Critical Errors: ${report.summary.criticalErrors}`);
  lines.push(`Warnings: ${report.summary.warnings}`);
  lines.push('');

  lines.push('Items by Category:');
  for (const [category, count] of Object.entries(report.summary.byCategory)) {
    lines.push(`  ${category}: ${count}`);
  }
  lines.push('');

  // Show detailed errors if any
  if (report.summary.criticalErrors > 0) {
    lines.push('CRITICAL ERRORS:');
    lines.push('-'.repeat(80));

    for (const [itemId, result] of report.results.entries()) {
      const criticalErrors = result.errors.filter(e => e.severity === 'error');
      if (criticalErrors.length > 0) {
        lines.push(`\n[${itemId}] - ${result.itemType || 'unknown'}`);
        for (const error of criticalErrors) {
          lines.push(`  ERROR: ${error.message}`);
          if (error.field) lines.push(`    Field: ${error.field}`);
          if (error.value !== undefined) lines.push(`    Value: ${JSON.stringify(error.value)}`);
        }
      }
    }
    lines.push('');
  }

  // Show items needing migration
  if (report.itemsNeedingMigration > 0) {
    lines.push('ITEMS NEEDING MIGRATION:');
    lines.push('-'.repeat(80));

    for (const [itemId, result] of report.results.entries()) {
      if (result.migrationNeeded) {
        lines.push(`\n[${itemId}] - ${result.itemType || 'unknown'}`);
        for (const warning of result.warnings) {
          lines.push(`  ${warning.message}`);
          if (warning.recommendation) {
            lines.push(`    → ${warning.recommendation}`);
          }
        }
      }
    }
    lines.push('');
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}

/**
 * Gets items that failed validation
 */
export function getInvalidItems(report: ValidationReport): string[] {
  const invalidItems: string[] = [];

  for (const [itemId, result] of report.results.entries()) {
    if (!result.valid) {
      invalidItems.push(itemId);
    }
  }

  return invalidItems;
}

/**
 * Gets items that need migration
 */
export function getItemsNeedingMigration(report: ValidationReport): string[] {
  const itemsNeedingMigration: string[] = [];

  for (const [itemId, result] of report.results.entries()) {
    if (result.migrationNeeded) {
      itemsNeedingMigration.push(itemId);
    }
  }

  return itemsNeedingMigration;
}

// =============================================================================
// EXAMPLE USAGE (in comments)
// =============================================================================

/*
// Example 1: Validate a single item
const item = {
  name: "Iron Sword",
  description: "A sturdy blade",
  type: "weapon",
  weaponType: "sword",
  equipmentSlot: "weapon",
  equipmentSubtype: "sword",
  rarity: "common",
  statModifiers: { attack: 15, accuracy: 5 },
  requirements: { classes: ["knight", "paladin"] },
  value: 250,
  icon: "⚔️"
};

const result = validateEquipmentItem(item, 'iron_sword');
console.log('Valid:', result.valid);
console.log('Errors:', result.errors);
console.log('Warnings:', result.warnings);
console.log('Needs Migration:', result.migrationNeeded);

// Example 2: Validate all items from ItemData
import ItemData from '../public/data/items.js';

const allItems = ItemData.getAllItems();
const report = validateItemData(allItems);

console.log(generateValidationReport(report));

// Example 3: Migrate legacy items
const legacyItem = {
  name: "Old Sword",
  type: "weapon",
  stats: { attack: 10 }, // Legacy field
  equipmentSlot: "accessory" // Legacy slot name
};

const migratedItem = migrateItemData(legacyItem);
console.log('Migrated:', migratedItem);
// Result: { name: "Old Sword", type: "weapon", statModifiers: { attack: 10 }, equipmentSlot: "charm" }

// Example 4: Runtime validation in data loader
async function loadAndValidateItems() {
  const items = await loadItemsFromFile();
  const report = validateItemData(items);

  if (report.summary.criticalErrors > 0) {
    console.error('Critical errors in item data!');
    console.error(generateValidationReport(report));
    throw new Error('Invalid item data detected');
  }

  if (report.itemsNeedingMigration > 0) {
    console.warn(`${report.itemsNeedingMigration} items need migration`);
    // Optionally auto-migrate items
    const migratedItems = {};
    for (const [itemId, item] of Object.entries(items)) {
      migratedItems[itemId] = migrateItemData(item);
    }
    return migratedItems;
  }

  return items;
}

// Example 5: Development tool usage
// Run this during development to check data files
if (import.meta.env.DEV) {
  const report = validateItemData(ItemData.getAllItems());
  if (report.invalidItems > 0 || report.itemsNeedingMigration > 0) {
    console.warn('Item Data Validation Issues Detected:');
    console.log(generateValidationReport(report));
  }
}
*/
