import {
  ReactArea,
  ReactCharacterClass,
  ReactItem,
  ReactMonster,
  UnlockRequirement,
  AreaType,
  MonsterType,
  ItemRarity,
  WeaponType
} from '../types/game';

/**
 * Data Loader Utility
 * Transforms legacy JavaScript game data into React-friendly TypeScript interfaces
 * Handles data validation, normalization, and error recovery
 */

export interface LegacyAreaData {
  [key: string]: {
    name: string;
    description: string;
    type: string;
    unlocked?: boolean;
    unlockRequirements?: any;
    encounterRate?: number;
    monsters?: string[];
    connections?: string[];
    services?: string[];
    storyEvents?: string[];
    backgroundMusic?: string;
    boss?: {
      name: string;
      species: string;
      level: number;
      reward: {
        exp: number;
        gold: number;
        items: string[];
      };
    };
    lootTable?: any;
    difficulty?: number;
  };
}

export interface LegacyCharacterData {
  [key: string]: {
    name: string;
    description: string;
    baseStats: {
      hp: number;
      mp: number;
      attack: number;
      defense: number;
      magicAttack: number;
      magicDefense: number;
      speed: number;
      accuracy: number;
    };
    weaponTypes: string[];
    startingSpells: string[];
    spellAffinities?: string[];
    classBonus?: string;
  };
}

export interface LegacyItemData {
  weapons?: {
    [key: string]: {
      name: string;
      description: string;
      type: string;
      weaponType: string;
      rarity: string;
      stats: { [key: string]: number };
      requirements?: { classes?: string[]; level?: number };
      value: number;
      icon: string;
      effects?: string[];
    };
  };
  armor?: { [key: string]: any };
  consumables?: { [key: string]: any };
  materials?: { [key: string]: any };
}

export interface LegacyMonsterData {
  species: {
    [key: string]: {
      name: string;
      type: string[];
      rarity: string;
      baseStats: {
        hp: number;
        mp: number;
        attack: number;
        defense: number;
        magicAttack: number;
        magicDefense: number;
        speed: number;
        accuracy: number;
      };
      statGrowth?: { [key: string]: number };
      abilities?: string[];
      captureRate?: number;
      evolutionLevel?: number;
      evolvesTo?: string[];
      breedsWith?: string[];
      areas?: string[];
      lootTable?: any;
    };
  };
}

export interface GameDataSources {
  areas?: LegacyAreaData;
  characters?: LegacyCharacterData;
  items?: LegacyItemData;
  monsters?: LegacyMonsterData;
}

export interface LoadedGameData {
  areas: ReactArea[];
  characterClasses: ReactCharacterClass[];
  items: ReactItem[];
  monsters: ReactMonster[];
  errors: string[];
  warnings: string[];
}

/**
 * Main data loader class
 */
export class GameDataLoader {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Load all game data from legacy sources
   */
  async loadGameData(): Promise<LoadedGameData> {
    this.errors = [];
    this.warnings = [];

    try {
      // Load legacy data from global objects or fetch from public directory
      const dataSources = await this.loadLegacyData();

      // Transform data in parallel
      const [areas, characterClasses, items, monsters] = await Promise.all([
        this.transformAreas(dataSources.areas || {}),
        this.transformCharacterClasses(dataSources.characters || {}),
        this.transformItems(dataSources.items || {}),
        this.transformMonsters(dataSources.monsters?.species || {})
      ]);

      return {
        areas,
        characterClasses,
        items,
        monsters,
        errors: [...this.errors],
        warnings: [...this.warnings]
      };
    } catch (error) {
      this.errors.push(`Failed to load game data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        areas: [],
        characterClasses: [],
        items: [],
        monsters: [],
        errors: [...this.errors],
        warnings: [...this.warnings]
      };
    }
  }

  /**
   * Load legacy data from various sources
   */
  private async loadLegacyData(): Promise<GameDataSources> {
    const dataSources: GameDataSources = {};

    try {
      // Check if data is available globally (from script tags)
      if (typeof window !== 'undefined') {
        if ((window as any).AreaData?.areas) {
          dataSources.areas = (window as any).AreaData.areas;
        }
        if ((window as any).CharacterData?.classes) {
          dataSources.characters = (window as any).CharacterData.classes;
        }
        if ((window as any).ItemData) {
          dataSources.items = (window as any).ItemData;
        }
        if ((window as any).MonsterData?.species) {
          dataSources.monsters = (window as any).MonsterData;
        }
      }

      // If not available globally, try fetching from public directory
      if (!dataSources.areas) {
        try {
          const response = await fetch('/data/areas.js');
          const text = await response.text();
          // Simple extraction of AreaData.areas object
          const match = text.match(/areas:\s*({[\s\S]*?})\s*,\s*storyFlags/);
          if (match) {
            dataSources.areas = this.parseDataObject(match[1]);
          }
        } catch (error) {
          this.warnings.push('Failed to fetch areas data from public directory');
        }
      }

      // Similar fetch operations for other data types...
      // For now, we'll focus on the areas data which we have

    } catch (error) {
      this.errors.push(`Error loading legacy data sources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return dataSources;
  }

  /**
   * Parse data object from string (fallback for fetch method)
   */
  private parseDataObject(objectString: string): any {
    try {
      // This is a simplified parser - in production you'd want a more robust solution
      return Function(`"use strict"; return (${objectString})`)();
    } catch (error) {
      this.warnings.push('Failed to parse data object from string');
      return {};
    }
  }

  /**
   * Transform legacy area data to React format
   */
  private async transformAreas(legacyAreas: LegacyAreaData): Promise<ReactArea[]> {
    const areas: ReactArea[] = [];

    for (const [id, area] of Object.entries(legacyAreas)) {
      try {
        const transformedArea: ReactArea = {
          id,
          name: this.sanitizeString(area.name),
          description: this.sanitizeString(area.description),
          type: this.normalizeAreaType(area.type),
          unlocked: area.unlocked || false,
          unlockRequirements: this.transformUnlockRequirements(area.unlockRequirements || {}),
          encounterRate: Math.max(0, Math.min(100, area.encounterRate || 0)),
          monsters: this.sanitizeStringArray(area.monsters || []),
          connections: this.sanitizeStringArray(area.connections || []),
          services: this.sanitizeStringArray(area.services || []),
          storyEvents: this.sanitizeStringArray(area.storyEvents || []),
          backgroundMusic: area.backgroundMusic || 'default',
          recommendedLevel: area.difficulty || this.calculateRecommendedLevel(area),
          boss: area.boss ? {
            name: this.sanitizeString(area.boss.name),
            species: this.sanitizeString(area.boss.species),
            level: Math.max(1, area.boss.level || 1),
            reward: {
              experience: Math.max(0, area.boss.reward?.exp || 0),
              gold: Math.max(0, area.boss.reward?.gold || 0),
              items: this.sanitizeStringArray(area.boss.reward?.items || [])
            }
          } : undefined,
          lootTable: area.lootTable || undefined
        };

        areas.push(transformedArea);
      } catch (error) {
        this.errors.push(`Failed to transform area '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    this.warnings.push(`Transformed ${areas.length} areas from legacy data`);
    return areas;
  }

  /**
   * Transform legacy character class data to React format
   */
  private async transformCharacterClasses(legacyCharacters: LegacyCharacterData): Promise<ReactCharacterClass[]> {
    const characterClasses: ReactCharacterClass[] = [];

    for (const [id, character] of Object.entries(legacyCharacters)) {
      try {
        const transformedClass: ReactCharacterClass = {
          id,
          name: this.sanitizeString(character.name),
          description: this.sanitizeString(character.description),
          baseStats: {
            hp: Math.max(1, character.baseStats.hp || 50),
            mp: Math.max(0, character.baseStats.mp || 20),
            attack: Math.max(1, character.baseStats.attack || 50),
            defense: Math.max(1, character.baseStats.defense || 50),
            magicAttack: Math.max(1, character.baseStats.magicAttack || 30),
            magicDefense: Math.max(1, character.baseStats.magicDefense || 30),
            speed: Math.max(1, character.baseStats.speed || 50),
            accuracy: Math.max(1, Math.min(100, character.baseStats.accuracy || 75))
          },
          weaponTypes: this.sanitizeStringArray(character.weaponTypes || []),
          startingSpells: this.sanitizeStringArray(character.startingSpells || []),
          spellAffinities: this.sanitizeStringArray(character.spellAffinities || []),
          classBonus: character.classBonus || undefined
        };

        characterClasses.push(transformedClass);
      } catch (error) {
        this.errors.push(`Failed to transform character class '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    this.warnings.push(`Transformed ${characterClasses.length} character classes from legacy data`);
    return characterClasses;
  }

  /**
   * Transform legacy item data to React format
   */
  private async transformItems(legacyItems: LegacyItemData): Promise<ReactItem[]> {
    const items: ReactItem[] = [];

    // Transform weapons
    if (legacyItems.weapons) {
      for (const [id, weapon] of Object.entries(legacyItems.weapons)) {
        try {
          const transformedItem: ReactItem = {
            id,
            name: this.sanitizeString(weapon.name),
            description: this.sanitizeString(weapon.description),
            type: 'weapon',
            subType: this.normalizeWeaponType(weapon.weaponType),
            rarity: this.normalizeRarity(weapon.rarity),
            stats: this.normalizeStats(weapon.stats),
            requirements: {
              level: weapon.requirements?.level || 1,
              classes: this.sanitizeStringArray(weapon.requirements?.classes || [])
            },
            value: Math.max(0, weapon.value || 0),
            icon: weapon.icon || '⚔️',
            effects: this.sanitizeStringArray(weapon.effects || []),
            stackable: false,
            consumable: false
          };

          items.push(transformedItem);
        } catch (error) {
          this.errors.push(`Failed to transform weapon '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Transform armor, consumables, materials would follow similar patterns...
    // For now focusing on weapons as they're most defined in the legacy data

    this.warnings.push(`Transformed ${items.length} items from legacy data`);
    return items;
  }

  /**
   * Transform legacy monster data to React format
   */
  private async transformMonsters(legacyMonsters: { [key: string]: any }): Promise<ReactMonster[]> {
    const monsters: ReactMonster[] = [];

    for (const [id, monster] of Object.entries(legacyMonsters)) {
      try {
        const transformedMonster: ReactMonster = {
          id,
          name: this.sanitizeString(monster.name),
          species: id,
          level: 1, // Base level, will be set dynamically
          types: this.normalizeMonsterTypes(monster.type || []),
          rarity: this.normalizeRarity(monster.rarity),
          baseStats: {
            hp: Math.max(1, monster.baseStats.hp || 25),
            mp: Math.max(0, monster.baseStats.mp || 10),
            attack: Math.max(1, monster.baseStats.attack || 20),
            defense: Math.max(1, monster.baseStats.defense || 15),
            magicAttack: Math.max(1, monster.baseStats.magicAttack || 15),
            magicDefense: Math.max(1, monster.baseStats.magicDefense || 15),
            speed: Math.max(1, monster.baseStats.speed || 30),
            accuracy: Math.max(1, Math.min(100, monster.baseStats.accuracy || 70))
          },
          currentStats: {
            hp: Math.max(1, monster.baseStats.hp || 25),
            mp: Math.max(0, monster.baseStats.mp || 10),
            attack: Math.max(1, monster.baseStats.attack || 20),
            defense: Math.max(1, monster.baseStats.defense || 15),
            magicAttack: Math.max(1, monster.baseStats.magicAttack || 15),
            magicDefense: Math.max(1, monster.baseStats.magicDefense || 15),
            speed: Math.max(1, monster.baseStats.speed || 30),
            accuracy: Math.max(1, Math.min(100, monster.baseStats.accuracy || 70))
          },
          abilities: this.sanitizeStringArray(monster.abilities || []),
          captureRate: Math.max(0, Math.min(100, monster.captureRate || 50)),
          experience: 0,
          friendship: 0,
          evolutionLevel: monster.evolutionLevel || null,
          evolvesTo: this.sanitizeStringArray(monster.evolvesTo || []),
          areas: this.sanitizeStringArray(monster.areas || []),
          isWild: true,
          nickname: null
        };

        monsters.push(transformedMonster);
      } catch (error) {
        this.errors.push(`Failed to transform monster '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    this.warnings.push(`Transformed ${monsters.length} monsters from legacy data`);
    return monsters;
  }

  /**
   * Transform unlock requirements to normalized format
   */
  private transformUnlockRequirements(requirements: any): UnlockRequirement {
    if (!requirements || typeof requirements !== 'object') {
      return {};
    }

    const normalized: UnlockRequirement = {};

    if (requirements.story) {
      normalized.story = this.sanitizeString(requirements.story);
    }
    if (typeof requirements.level === 'number') {
      normalized.level = Math.max(1, requirements.level);
    }
    if (requirements.item) {
      normalized.items = [this.sanitizeString(requirements.item)];
    }
    if (requirements.items) {
      normalized.items = this.sanitizeStringArray(requirements.items);
    }

    return normalized;
  }

  /**
   * Utility methods for data normalization
   */
  private sanitizeString(str: any): string {
    if (typeof str !== 'string') {
      return String(str || '');
    }
    return str.trim();
  }

  private sanitizeStringArray(arr: any[]): string[] {
    if (!Array.isArray(arr)) {
      return [];
    }
    return arr.filter(item => typeof item === 'string').map(str => str.trim());
  }

  private normalizeAreaType(type: string): AreaType {
    const typeMap: { [key: string]: AreaType } = {
      'town': 'town',
      'village': 'town',
      'wilderness': 'wilderness',
      'forest': 'wilderness',
      'plains': 'wilderness',
      'mountain': 'wilderness',
      'dungeon': 'dungeon',
      'cave': 'dungeon',
      'temple': 'dungeon',
      'special': 'special',
      'secret': 'special'
    };

    return typeMap[type?.toLowerCase()] || 'wilderness';
  }

  private normalizeRarity(rarity: string): ItemRarity {
    const rarityMap: { [key: string]: ItemRarity } = {
      'common': 'common',
      'uncommon': 'uncommon',
      'rare': 'rare',
      'epic': 'epic',
      'legendary': 'legendary'
    };

    return rarityMap[rarity?.toLowerCase()] || 'common';
  }

  private normalizeWeaponType(weaponType: string): WeaponType {
    const weaponMap: { [key: string]: WeaponType } = {
      'sword': 'sword',
      'staff': 'staff',
      'bow': 'bow',
      'dagger': 'dagger',
      'mace': 'mace',
      'axe': 'axe',
      'spear': 'spear'
    };

    return weaponMap[weaponType?.toLowerCase()] || 'sword';
  }

  private normalizeMonsterTypes(types: any[]): MonsterType[] {
    if (!Array.isArray(types)) {
      return ['normal'];
    }

    const typeMap: { [key: string]: MonsterType } = {
      'water': 'water',
      'fire': 'fire',
      'earth': 'earth',
      'air': 'air',
      'light': 'light',
      'dark': 'dark',
      'normal': 'normal',
      'basic': 'normal',
      'humanoid': 'normal'
    };

    const normalized = types
      .map(type => typeMap[String(type).toLowerCase()])
      .filter(type => type !== undefined) as MonsterType[];

    return normalized.length > 0 ? normalized : ['normal'];
  }

  private normalizeStats(stats: { [key: string]: number }): { [key: string]: number } {
    const normalized: { [key: string]: number } = {};

    for (const [key, value] of Object.entries(stats || {})) {
      if (typeof value === 'number' && !isNaN(value)) {
        normalized[key] = Math.max(0, value);
      }
    }

    return normalized;
  }

  private calculateRecommendedLevel(area: any): number {
    // Calculate based on encounter rate and area type
    const baseLevel = area.encounterRate ? Math.floor(area.encounterRate / 20) + 1 : 1;

    const typeMultiplier: { [key: string]: number } = {
      'town': 0.5,
      'wilderness': 1,
      'dungeon': 1.5,
      'special': 2
    };

    const multiplier = typeMultiplier[area.type] || 1;
    return Math.max(1, Math.floor(baseLevel * multiplier));
  }
}

// Singleton instance
export const gameDataLoader = new GameDataLoader();

// Export helper functions for individual data loading
export const loadAreas = () => gameDataLoader.loadGameData().then(data => data.areas);
export const loadCharacterClasses = () => gameDataLoader.loadGameData().then(data => data.characterClasses);
export const loadItems = () => gameDataLoader.loadGameData().then(data => data.items);
export const loadMonsters = () => gameDataLoader.loadGameData().then(data => data.monsters);