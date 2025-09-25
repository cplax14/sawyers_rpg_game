import {
  ReactPlayer,
  ReactArea,
  ReactCharacterClass,
  ReactItem,
  ReactMonster,
  GameStats,
  UnlockRequirement
} from '../types/game';

/**
 * Data Validation Utilities
 * Provides comprehensive validation for game data structures
 * Includes sanitization, type checking, and business logic validation
 */

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
}

export interface ValidationOptions {
  strict?: boolean; // Strict mode throws on any validation error
  sanitize?: boolean; // Attempt to fix/sanitize invalid data
  logWarnings?: boolean; // Log warnings to console
}

/**
 * Base validation class with common utility methods
 */
abstract class BaseValidator<T> {
  protected options: ValidationOptions;

  constructor(options: ValidationOptions = {}) {
    this.options = {
      strict: false,
      sanitize: true,
      logWarnings: true,
      ...options
    };
  }

  abstract validate(data: any): ValidationResult<T>;

  protected createResult(
    isValid: boolean,
    data?: T,
    errors: string[] = [],
    warnings: string[] = []
  ): ValidationResult<T> {
    if (this.options.logWarnings && warnings.length > 0) {
      console.warn('Validation warnings:', warnings);
    }

    return { isValid, data, errors, warnings };
  }

  protected sanitizeString(value: any, fallback: string = ''): string {
    if (typeof value !== 'string') {
      return String(value || fallback).trim();
    }
    return value.trim();
  }

  protected sanitizeNumber(
    value: any,
    min: number = 0,
    max: number = Infinity,
    fallback: number = min
  ): number {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num)) return fallback;
    return Math.max(min, Math.min(max, num));
  }

  protected sanitizeArray<U>(
    value: any,
    itemValidator?: (item: any) => U | null
  ): U[] {
    if (!Array.isArray(value)) return [];

    if (itemValidator) {
      return value.map(itemValidator).filter(item => item !== null) as U[];
    }

    return value.filter(item => item != null);
  }
}

/**
 * Player data validator
 */
export class PlayerValidator extends BaseValidator<ReactPlayer> {
  validate(data: any): ValidationResult<ReactPlayer> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      return this.createResult(false, undefined, ['Player data must be an object']);
    }

    try {
      const player: ReactPlayer = {
        id: this.sanitizeString(data.id, `player_${Date.now()}`),
        name: this.sanitizeString(data.name, 'Unknown Player'),
        characterClass: this.sanitizeString(data.characterClass, 'knight'),
        level: this.sanitizeNumber(data.level, 1, 100, 1),
        experience: this.sanitizeNumber(data.experience, 0, Infinity, 0),
        gold: this.sanitizeNumber(data.gold, 0, Infinity, 0),
        baseStats: this.validateStats(data.baseStats, errors, warnings),
        currentStats: this.validateStats(data.currentStats || data.baseStats, errors, warnings),
        equipment: data.equipment || {},
        statusEffects: this.sanitizeArray(data.statusEffects),
        abilities: this.sanitizeArray(data.abilities)
      };

      // Validate player name
      if (!player.name || player.name.length < 1) {
        if (this.options.sanitize) {
          player.name = 'Unknown Player';
          warnings.push('Player name was empty, set to default');
        } else {
          errors.push('Player name is required');
        }
      }

      // Validate level consistency
      if (player.level < 1) {
        if (this.options.sanitize) {
          player.level = 1;
          warnings.push('Player level was below 1, corrected to 1');
        } else {
          errors.push('Player level must be at least 1');
        }
      }

      // Validate experience consistency
      const requiredExpForLevel = this.calculateRequiredExperience(player.level);
      if (player.experience < requiredExpForLevel) {
        if (this.options.sanitize) {
          player.experience = requiredExpForLevel;
          warnings.push(`Player experience adjusted to match level ${player.level}`);
        } else {
          warnings.push(`Player experience may be too low for level ${player.level}`);
        }
      }

      return this.createResult(errors.length === 0, player, errors, warnings);

    } catch (error) {
      return this.createResult(false, undefined, [`Player validation failed: ${error}`]);
    }
  }

  private validateStats(stats: any, errors: string[], warnings: string[]): GameStats {
    const defaultStats: GameStats = {
      hp: 50,
      mp: 20,
      attack: 30,
      defense: 25,
      magicAttack: 20,
      magicDefense: 20,
      speed: 40,
      accuracy: 75
    };

    if (!stats || typeof stats !== 'object') {
      warnings.push('Player stats missing, using defaults');
      return defaultStats;
    }

    return {
      hp: this.sanitizeNumber(stats.hp, 1, 9999, defaultStats.hp),
      mp: this.sanitizeNumber(stats.mp, 0, 999, defaultStats.mp),
      attack: this.sanitizeNumber(stats.attack, 1, 999, defaultStats.attack),
      defense: this.sanitizeNumber(stats.defense, 1, 999, defaultStats.defense),
      magicAttack: this.sanitizeNumber(stats.magicAttack, 1, 999, defaultStats.magicAttack),
      magicDefense: this.sanitizeNumber(stats.magicDefense, 1, 999, defaultStats.magicDefense),
      speed: this.sanitizeNumber(stats.speed, 1, 999, defaultStats.speed),
      accuracy: this.sanitizeNumber(stats.accuracy, 1, 100, defaultStats.accuracy)
    };
  }

  private calculateRequiredExperience(level: number): number {
    // Simple experience formula: level^2 * 100
    return Math.max(0, (level - 1) * (level - 1) * 100);
  }
}

/**
 * Area data validator
 */
export class AreaValidator extends BaseValidator<ReactArea> {
  validate(data: any): ValidationResult<ReactArea> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      return this.createResult(false, undefined, ['Area data must be an object']);
    }

    try {
      const area: ReactArea = {
        id: this.sanitizeString(data.id),
        name: this.sanitizeString(data.name, 'Unknown Area'),
        description: this.sanitizeString(data.description, 'A mysterious area.'),
        type: this.validateAreaType(data.type),
        unlocked: Boolean(data.unlocked),
        unlockRequirements: this.validateUnlockRequirements(data.unlockRequirements),
        encounterRate: this.sanitizeNumber(data.encounterRate, 0, 100, 0),
        monsters: this.sanitizeArray(data.monsters, item => typeof item === 'string' ? item : null),
        connections: this.sanitizeArray(data.connections, item => typeof item === 'string' ? item : null),
        services: this.sanitizeArray(data.services, item => typeof item === 'string' ? item : null),
        storyEvents: this.sanitizeArray(data.storyEvents, item => typeof item === 'string' ? item : null),
        backgroundMusic: this.sanitizeString(data.backgroundMusic, 'default'),
        recommendedLevel: this.sanitizeNumber(data.recommendedLevel || data.difficulty, 1, 100, 1),
        boss: data.boss ? this.validateBoss(data.boss, errors, warnings) : undefined,
        lootTable: data.lootTable || undefined
      };

      // Validate required fields
      if (!area.id) {
        errors.push('Area ID is required');
      }

      if (!area.name) {
        if (this.options.sanitize) {
          area.name = `Area ${area.id}`;
          warnings.push('Area name was empty, generated from ID');
        } else {
          errors.push('Area name is required');
        }
      }

      // Validate encounter rate consistency
      if (area.encounterRate > 0 && area.monsters.length === 0) {
        warnings.push(`Area "${area.name}" has encounter rate but no monsters defined`);
      }

      return this.createResult(errors.length === 0, area, errors, warnings);

    } catch (error) {
      return this.createResult(false, undefined, [`Area validation failed: ${error}`]);
    }
  }

  private validateAreaType(type: any): ReactArea['type'] {
    const validTypes = ['town', 'wilderness', 'dungeon', 'special'];
    const typeStr = String(type || '').toLowerCase();

    if (validTypes.includes(typeStr)) {
      return typeStr as ReactArea['type'];
    }

    return 'wilderness'; // Default fallback
  }

  private validateUnlockRequirements(requirements: any): UnlockRequirement {
    if (!requirements || typeof requirements !== 'object') {
      return {};
    }

    const validated: UnlockRequirement = {};

    if (requirements.story) {
      validated.story = this.sanitizeString(requirements.story);
    }

    if (requirements.level) {
      validated.level = this.sanitizeNumber(requirements.level, 1, 100);
    }

    if (requirements.items) {
      validated.items = this.sanitizeArray(requirements.items, item =>
        typeof item === 'string' ? item : null
      );
    }

    return validated;
  }

  private validateBoss(boss: any, errors: string[], warnings: string[]): ReactArea['boss'] {
    if (!boss || typeof boss !== 'object') {
      warnings.push('Boss data is invalid, skipping');
      return undefined;
    }

    return {
      name: this.sanitizeString(boss.name, 'Unknown Boss'),
      species: this.sanitizeString(boss.species, 'unknown'),
      level: this.sanitizeNumber(boss.level, 1, 100, 10),
      reward: {
        experience: this.sanitizeNumber(boss.reward?.exp || boss.reward?.experience, 0, Infinity, 100),
        gold: this.sanitizeNumber(boss.reward?.gold, 0, Infinity, 50),
        items: this.sanitizeArray(boss.reward?.items, item =>
          typeof item === 'string' ? item : null
        )
      }
    };
  }
}

/**
 * Monster data validator
 */
export class MonsterValidator extends BaseValidator<ReactMonster> {
  validate(data: any): ValidationResult<ReactMonster> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      return this.createResult(false, undefined, ['Monster data must be an object']);
    }

    try {
      const statsValidator = new PlayerValidator(this.options);
      const baseStatsResult = statsValidator['validateStats'](data.baseStats, errors, warnings);
      const currentStatsResult = statsValidator['validateStats'](
        data.currentStats || data.baseStats, errors, warnings
      );

      const monster: ReactMonster = {
        id: this.sanitizeString(data.id, `monster_${Date.now()}`),
        name: this.sanitizeString(data.name, 'Unknown Monster'),
        species: this.sanitizeString(data.species, data.id || 'unknown'),
        level: this.sanitizeNumber(data.level, 1, 100, 1),
        types: this.validateMonsterTypes(data.types || data.type),
        rarity: this.validateRarity(data.rarity),
        baseStats: baseStatsResult,
        currentStats: currentStatsResult,
        abilities: this.sanitizeArray(data.abilities, item =>
          typeof item === 'string' ? item : null
        ),
        captureRate: this.sanitizeNumber(data.captureRate, 0, 100, 50),
        experience: this.sanitizeNumber(data.experience, 0, Infinity, 0),
        friendship: this.sanitizeNumber(data.friendship, 0, 100, 0),
        evolutionLevel: data.evolutionLevel ? this.sanitizeNumber(data.evolutionLevel, 1, 100) : null,
        evolvesTo: this.sanitizeArray(data.evolvesTo, item =>
          typeof item === 'string' ? item : null
        ),
        areas: this.sanitizeArray(data.areas, item =>
          typeof item === 'string' ? item : null
        ),
        isWild: Boolean(data.isWild !== false), // Default to wild
        nickname: data.nickname ? this.sanitizeString(data.nickname) : null
      };

      return this.createResult(errors.length === 0, monster, errors, warnings);

    } catch (error) {
      return this.createResult(false, undefined, [`Monster validation failed: ${error}`]);
    }
  }

  private validateMonsterTypes(types: any): ReactMonster['types'] {
    const validTypes = ['normal', 'fire', 'water', 'earth', 'air', 'light', 'dark'];

    if (!Array.isArray(types)) {
      return ['normal'];
    }

    const validated = types
      .map(type => String(type).toLowerCase())
      .filter(type => validTypes.includes(type)) as ReactMonster['types'];

    return validated.length > 0 ? validated : ['normal'];
  }

  private validateRarity(rarity: any): ReactMonster['rarity'] {
    const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const rarityStr = String(rarity || '').toLowerCase();

    if (validRarities.includes(rarityStr)) {
      return rarityStr as ReactMonster['rarity'];
    }

    return 'common';
  }
}

/**
 * Item data validator
 */
export class ItemValidator extends BaseValidator<ReactItem> {
  validate(data: any): ValidationResult<ReactItem> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
      return this.createResult(false, undefined, ['Item data must be an object']);
    }

    try {
      const item: ReactItem = {
        id: this.sanitizeString(data.id),
        name: this.sanitizeString(data.name, 'Unknown Item'),
        description: this.sanitizeString(data.description, 'A mysterious item.'),
        type: this.validateItemType(data.type),
        subType: this.sanitizeString(data.subType || data.weaponType),
        rarity: this.validateRarity(data.rarity),
        stats: this.sanitizeStats(data.stats),
        requirements: {
          level: this.sanitizeNumber(data.requirements?.level, 1, 100, 1),
          classes: this.sanitizeArray(data.requirements?.classes, item =>
            typeof item === 'string' ? item : null
          )
        },
        value: this.sanitizeNumber(data.value, 0, Infinity, 0),
        icon: this.sanitizeString(data.icon, '📦'),
        effects: this.sanitizeArray(data.effects, item =>
          typeof item === 'string' ? item : null
        ),
        stackable: Boolean(data.stackable !== false),
        consumable: Boolean(data.consumable),
        quantity: this.sanitizeNumber(data.quantity, 1, 999, 1)
      };

      // Validate required fields
      if (!item.id) {
        errors.push('Item ID is required');
      }

      return this.createResult(errors.length === 0, item, errors, warnings);

    } catch (error) {
      return this.createResult(false, undefined, [`Item validation failed: ${error}`]);
    }
  }

  private validateItemType(type: any): ReactItem['type'] {
    const validTypes = ['weapon', 'armor', 'consumable', 'material', 'key', 'misc'];
    const typeStr = String(type || '').toLowerCase();

    if (validTypes.includes(typeStr)) {
      return typeStr as ReactItem['type'];
    }

    return 'misc';
  }

  private validateRarity(rarity: any): ReactItem['rarity'] {
    const validRarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
    const rarityStr = String(rarity || '').toLowerCase();

    if (validRarities.includes(rarityStr)) {
      return rarityStr as ReactItem['rarity'];
    }

    return 'common';
  }

  private sanitizeStats(stats: any): { [key: string]: number } {
    if (!stats || typeof stats !== 'object') {
      return {};
    }

    const sanitized: { [key: string]: number } = {};

    for (const [key, value] of Object.entries(stats)) {
      const numValue = this.sanitizeNumber(value, -999, 999, 0);
      if (numValue !== 0) {
        sanitized[key] = numValue;
      }
    }

    return sanitized;
  }
}

/**
 * Validation factory and utility functions
 */
export const validators = {
  player: new PlayerValidator(),
  area: new AreaValidator(),
  monster: new MonsterValidator(),
  item: new ItemValidator()
};

export const validatePlayer = (data: any, options?: ValidationOptions): ValidationResult<ReactPlayer> => {
  return new PlayerValidator(options).validate(data);
};

export const validateArea = (data: any, options?: ValidationOptions): ValidationResult<ReactArea> => {
  return new AreaValidator(options).validate(data);
};

export const validateMonster = (data: any, options?: ValidationOptions): ValidationResult<ReactMonster> => {
  return new MonsterValidator(options).validate(data);
};

export const validateItem = (data: any, options?: ValidationOptions): ValidationResult<ReactItem> => {
  return new ItemValidator(options).validate(data);
};

/**
 * Batch validation utility
 */
export const validateBatch = <T>(
  dataArray: any[],
  validator: (data: any, options?: ValidationOptions) => ValidationResult<T>,
  options?: ValidationOptions
): {
  valid: T[];
  invalid: Array<{ data: any; result: ValidationResult<T> }>;
  totalErrors: number;
  totalWarnings: number;
} => {
  const valid: T[] = [];
  const invalid: Array<{ data: any; result: ValidationResult<T> }> = [];
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const data of dataArray) {
    const result = validator(data, options);

    if (result.isValid && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({ data, result });
    }

    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  }

  return { valid, invalid, totalErrors, totalWarnings };
};