/**
 * Data Integrity Validation Utilities
 * Comprehensive validation and verification for save data integrity
 */

import { ReactGameState } from '../types/game';
import { CloudError, CloudErrorCode, createCloudError, ErrorSeverity } from './cloudErrors';

export interface DataIntegrityResult {
  isValid: boolean;
  checksum: string;
  errors: string[];
  warnings: string[];
  corruptedFields: string[];
  recoveredData?: any;
}

export interface IntegrityValidationOptions {
  /** Enable deep validation of nested objects */
  deepValidation?: boolean;
  /** Attempt to recover corrupted data */
  enableRecovery?: boolean;
  /** Strict mode (fail on warnings) */
  strictMode?: boolean;
  /** Maximum allowed data size in bytes */
  maxDataSize?: number;
  /** Schema version for validation */
  schemaVersion?: string;
}

export interface GameStateSchema {
  version: string;
  requiredFields: string[];
  fieldTypes: Record<string, string>;
  fieldConstraints: Record<string, any>;
  deprecatedFields: string[];
}

/**
 * Generate SHA-256 checksum for data integrity verification
 */
export const generateChecksum = async (data: any): Promise<string> => {
  try {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(serialized);

    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch (error) {
    throw createCloudError(
      CloudErrorCode.SAVE_VALIDATION_FAILED,
      'Failed to generate data checksum',
      {
        severity: ErrorSeverity.HIGH,
        retryable: false,
        debugInfo: { originalError: error },
      }
    );
  }
};

/**
 * Verify data integrity using checksum comparison
 */
export const verifyChecksum = async (data: any, expectedChecksum: string): Promise<boolean> => {
  try {
    const actualChecksum = await generateChecksum(data);
    return actualChecksum === expectedChecksum;
  } catch (error) {
    console.warn('Checksum verification failed:', error);
    return false;
  }
};

/**
 * Default game state schema for validation
 */
export const DEFAULT_GAME_STATE_SCHEMA: GameStateSchema = {
  version: '1.0.0',
  requiredFields: ['player', 'inventory', 'story', 'gameFlags', 'version', 'timestamp'],
  fieldTypes: {
    player: 'object',
    'player.name': 'string',
    'player.level': 'number',
    'player.experience': 'number',
    'player.currentArea': 'string',
    'player.stats': 'object',
    inventory: 'object',
    'inventory.items': 'array',
    story: 'object',
    'story.currentChapter': 'number',
    'story.completedQuests': 'array',
    gameFlags: 'object',
    version: 'string',
    timestamp: 'string',
  },
  fieldConstraints: {
    'player.level': { min: 1, max: 999 },
    'player.experience': { min: 0, max: 999999999 },
    'story.currentChapter': { min: 0, max: 100 },
    'inventory.items': { maxLength: 1000 },
  },
  deprecatedFields: ['oldPlayerData', 'legacyFlags', 'tempData'],
};

/**
 * Validate game state structure and data types
 */
export const validateGameStateStructure = (
  gameState: any,
  schema: GameStateSchema = DEFAULT_GAME_STATE_SCHEMA,
  options: IntegrityValidationOptions = {}
): DataIntegrityResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const corruptedFields: string[] = [];

  try {
    // Check required fields
    for (const field of schema.requiredFields) {
      if (!hasNestedProperty(gameState, field)) {
        errors.push(`Missing required field: ${field}`);
        corruptedFields.push(field);
      }
    }

    // Validate field types
    for (const [fieldPath, expectedType] of Object.entries(schema.fieldTypes)) {
      const value = getNestedProperty(gameState, fieldPath);

      if (value !== undefined && !validateFieldType(value, expectedType)) {
        errors.push(
          `Invalid type for field ${fieldPath}: expected ${expectedType}, got ${typeof value}`
        );
        corruptedFields.push(fieldPath);
      }
    }

    // Check field constraints
    for (const [fieldPath, constraints] of Object.entries(schema.fieldConstraints)) {
      const value = getNestedProperty(gameState, fieldPath);

      if (value !== undefined) {
        const constraintErrors = validateFieldConstraints(value, constraints, fieldPath);
        errors.push(...constraintErrors);
        if (constraintErrors.length > 0) {
          corruptedFields.push(fieldPath);
        }
      }
    }

    // Check for deprecated fields
    for (const deprecatedField of schema.deprecatedFields) {
      if (hasNestedProperty(gameState, deprecatedField)) {
        warnings.push(`Deprecated field found: ${deprecatedField}`);
      }
    }

    // Deep validation if enabled
    if (options.deepValidation) {
      const deepValidationResult = performDeepValidation(gameState);
      errors.push(...deepValidationResult.errors);
      warnings.push(...deepValidationResult.warnings);
      corruptedFields.push(...deepValidationResult.corruptedFields);
    }

    // Check data size limits
    if (options.maxDataSize) {
      const dataSize = JSON.stringify(gameState).length;
      if (dataSize > options.maxDataSize) {
        errors.push(`Data size exceeds limit: ${dataSize} > ${options.maxDataSize} bytes`);
      }
    }

    const isValid = errors.length === 0 && (!options.strictMode || warnings.length === 0);

    return {
      isValid,
      checksum: '', // Will be filled by caller
      errors,
      warnings,
      corruptedFields: [...new Set(corruptedFields)], // Remove duplicates
    };
  } catch (error) {
    return {
      isValid: false,
      checksum: '',
      errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      corruptedFields: [],
    };
  }
};

/**
 * Comprehensive data integrity validation
 */
export const validateDataIntegrity = async (
  data: any,
  expectedChecksum?: string,
  schema?: GameStateSchema,
  options: IntegrityValidationOptions = {}
): Promise<DataIntegrityResult> => {
  try {
    // Generate or verify checksum
    const checksum = await generateChecksum(data);
    let checksumValid = true;

    if (expectedChecksum) {
      checksumValid = await verifyChecksum(data, expectedChecksum);
    }

    // Validate structure
    const structureResult = validateGameStateStructure(data, schema, options);

    // Combine results
    const result: DataIntegrityResult = {
      ...structureResult,
      checksum,
      isValid: structureResult.isValid && checksumValid,
    };

    if (!checksumValid) {
      result.errors.unshift('Data checksum mismatch - possible corruption detected');
      result.corruptedFields.push('_checksum');
    }

    // Attempt recovery if enabled and data is corrupted
    if (!result.isValid && options.enableRecovery) {
      const recoveryResult = attemptDataRecovery(data, result);
      if (recoveryResult.recovered) {
        result.recoveredData = recoveryResult.data;
        result.warnings.push(
          'Data recovery attempted - some data may have been restored from defaults'
        );
      }
    }

    return result;
  } catch (error) {
    throw createCloudError(
      CloudErrorCode.SAVE_VALIDATION_FAILED,
      'Data integrity validation failed',
      {
        severity: ErrorSeverity.HIGH,
        retryable: false,
        debugInfo: { originalError: error },
      }
    );
  }
};

/**
 * Attempt to recover corrupted data
 */
export const attemptDataRecovery = (
  corruptedData: any,
  validationResult: DataIntegrityResult
): { recovered: boolean; data: any } => {
  let recoveredData = { ...corruptedData };
  let recovered = false;

  try {
    // Recover missing required fields with defaults
    const defaults = getDefaultGameStateValues();

    for (const field of validationResult.corruptedFields) {
      if (field in defaults) {
        setNestedProperty(recoveredData, field, defaults[field]);
        recovered = true;
      }
    }

    // Fix type mismatches
    if (validationResult.corruptedFields.includes('player.level')) {
      const level = getNestedProperty(recoveredData, 'player.level');
      if (typeof level !== 'number' || level < 1) {
        setNestedProperty(recoveredData, 'player.level', 1);
        recovered = true;
      }
    }

    if (validationResult.corruptedFields.includes('player.experience')) {
      const exp = getNestedProperty(recoveredData, 'player.experience');
      if (typeof exp !== 'number' || exp < 0) {
        setNestedProperty(recoveredData, 'player.experience', 0);
        recovered = true;
      }
    }

    // Ensure arrays are valid
    if (validationResult.corruptedFields.includes('inventory.items')) {
      const items = getNestedProperty(recoveredData, 'inventory.items');
      if (!Array.isArray(items)) {
        setNestedProperty(recoveredData, 'inventory.items', []);
        recovered = true;
      }
    }

    if (validationResult.corruptedFields.includes('story.completedQuests')) {
      const quests = getNestedProperty(recoveredData, 'story.completedQuests');
      if (!Array.isArray(quests)) {
        setNestedProperty(recoveredData, 'story.completedQuests', []);
        recovered = true;
      }
    }

    return { recovered, data: recoveredData };
  } catch (error) {
    console.warn('Data recovery failed:', error);
    return { recovered: false, data: corruptedData };
  }
};

/**
 * Get default values for game state fields
 */
const getDefaultGameStateValues = (): Record<string, any> => ({
  'player.name': 'Unknown Player',
  'player.level': 1,
  'player.experience': 0,
  'player.currentArea': 'starting_area',
  'player.stats': {
    health: 100,
    mana: 50,
    strength: 10,
    agility: 10,
    intelligence: 10,
    defense: 10,
  },
  'inventory.items': [],
  'story.currentChapter': 0,
  'story.completedQuests': [],
  gameFlags: {},
  version: '1.0.0',
  timestamp: new Date().toISOString(),
});

/**
 * Perform deep validation of complex game state structures
 */
const performDeepValidation = (
  gameState: any
): {
  errors: string[];
  warnings: string[];
  corruptedFields: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const corruptedFields: string[] = [];

  // Validate inventory items structure
  const items = getNestedProperty(gameState, 'inventory.items');
  if (Array.isArray(items)) {
    items.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Invalid item at inventory.items[${index}]`);
        corruptedFields.push(`inventory.items[${index}]`);
        return;
      }

      if (!item.id || typeof item.id !== 'string') {
        errors.push(`Missing or invalid item ID at inventory.items[${index}]`);
        corruptedFields.push(`inventory.items[${index}].id`);
      }

      if (typeof item.quantity !== 'number' || item.quantity < 0) {
        errors.push(`Invalid item quantity at inventory.items[${index}]`);
        corruptedFields.push(`inventory.items[${index}].quantity`);
      }
    });
  }

  // Validate game flags
  const gameFlags = getNestedProperty(gameState, 'gameFlags');
  if (gameFlags && typeof gameFlags === 'object') {
    Object.entries(gameFlags).forEach(([key, value]) => {
      if (typeof key !== 'string') {
        errors.push(`Invalid game flag key: ${key}`);
        corruptedFields.push(`gameFlags.${key}`);
      }

      if (typeof value !== 'boolean' && typeof value !== 'string' && typeof value !== 'number') {
        warnings.push(`Unusual game flag value type for ${key}: ${typeof value}`);
      }
    });
  }

  // Validate player stats
  const stats = getNestedProperty(gameState, 'player.stats');
  if (stats && typeof stats === 'object') {
    const requiredStats = ['health', 'mana', 'strength', 'agility', 'intelligence', 'defense'];

    for (const stat of requiredStats) {
      if (!(stat in stats) || typeof stats[stat] !== 'number' || stats[stat] < 0) {
        errors.push(`Invalid or missing player stat: ${stat}`);
        corruptedFields.push(`player.stats.${stat}`);
      }
    }
  }

  return { errors, warnings, corruptedFields };
};

/**
 * Utility functions for nested property access
 */
const hasNestedProperty = (obj: any, path: string): boolean => {
  return getNestedProperty(obj, path) !== undefined;
};

const getNestedProperty = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
};

const setNestedProperty = (obj: any, path: string, value: any): void => {
  const keys = path.split('.');
  const lastKey = keys.pop()!;

  const target = keys.reduce((current, key) => {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    return current[key];
  }, obj);

  target[lastKey] = value;
};

const validateFieldType = (value: any, expectedType: string): boolean => {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return true;
  }
};

const validateFieldConstraints = (value: any, constraints: any, fieldPath: string): string[] => {
  const errors: string[] = [];

  if (typeof constraints.min === 'number' && value < constraints.min) {
    errors.push(`Field ${fieldPath} value ${value} is below minimum ${constraints.min}`);
  }

  if (typeof constraints.max === 'number' && value > constraints.max) {
    errors.push(`Field ${fieldPath} value ${value} exceeds maximum ${constraints.max}`);
  }

  if (
    typeof constraints.maxLength === 'number' &&
    Array.isArray(value) &&
    value.length > constraints.maxLength
  ) {
    errors.push(
      `Field ${fieldPath} array length ${value.length} exceeds maximum ${constraints.maxLength}`
    );
  }

  return errors;
};

/**
 * Create a sanitized copy of game state for safe cloud storage
 */
export const sanitizeGameStateForCloud = (gameState: ReactGameState): ReactGameState => {
  // Guard against null/undefined input
  if (!gameState || typeof gameState !== 'object') {
    throw new Error('Invalid game state: must be a non-null object');
  }

  // Deep clone and remove functions recursively
  const removeNonSerializable = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'function') {
      return undefined;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => removeNonSerializable(item)).filter(item => item !== undefined);
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = removeNonSerializable(obj[key]);
          if (value !== undefined && typeof value !== 'function') {
            cleaned[key] = value;
          }
        }
      }
      return cleaned;
    }

    return obj;
  };

  const sanitized = removeNonSerializable(gameState);

  // Guard against sanitized being null
  if (!sanitized || typeof sanitized !== 'object') {
    throw new Error('Sanitization failed: result is null or not an object');
  }

  // Remove temporary or sensitive data
  if ('temporaryData' in sanitized) {
    delete sanitized.temporaryData;
  }

  if ('sessionData' in sanitized) {
    delete sanitized.sessionData;
  }

  // Ensure timestamp is current
  sanitized.timestamp = new Date().toISOString();

  // Limit array sizes to prevent excessive data
  if (sanitized.inventory?.items && sanitized.inventory.items.length > 1000) {
    sanitized.inventory.items = sanitized.inventory.items.slice(0, 1000);
  }

  return sanitized;
};
