import {
  Area,
  Item,
  Monster,
} from '../types/game';
import { Shop, ShopInventory, NPCTrade } from '../types/shop';

// Type aliases for legacy compatibility
type ReactArea = Area;
type ReactItem = Item;
type ReactMonster = Monster;
type ReactCharacterClass = any; // TODO: Define proper CharacterClass type
type UnlockRequirement = any;
type AreaType = string;
type MonsterType = string;
type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
type WeaponType = string;

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

export interface LegacyShopData {
  [key: string]: {
    name: string;
    type: string;
    location: string;
    shopkeeper: {
      name: string;
      mood?: string;
      dialogue: any;
      avatar?: string;
      backstory?: string;
    };
    buysCategories: string[];
    unlockRequirements?: any;
    pricingModifiers?: any;
    theme?: any;
    hidden?: boolean;
  };
}

export interface LegacyShopInventoryData {
  [shopId: string]: Array<{
    itemId: string;
    price?: number;
    sellPrice?: number;
    stock: number;
    unlockRequirements?: any;
    unlocked?: boolean;
    featured?: boolean;
  }>;
}

export interface LegacyNPCTradeData {
  [key: string]: {
    npcName: string;
    type: string;
    repeatability: string;
    requiredItems: Array<{
      itemId: string;
      quantity: number;
      consumed?: boolean;
    }>;
    offeredItems: Array<{
      itemId: string;
      quantity: number;
      chance?: number;
    }>;
    goldRequired?: number;
    goldOffered?: number;
    requirements?: any[];
    dialogue: string;
    location: string;
  };
}

export interface GameDataSources {
  areas?: LegacyAreaData;
  characters?: LegacyCharacterData;
  items?: LegacyItemData;
  monsters?: LegacyMonsterData;
  shops?: LegacyShopData;
  shopInventory?: LegacyShopInventoryData;
  npcTrades?: LegacyNPCTradeData;
}

export interface LoadedGameData {
  areas: ReactArea[];
  characterClasses: ReactCharacterClass[];
  items: ReactItem[];
  monsters: ReactMonster[];
  shops?: Shop[];
  shopInventories?: ShopInventory[];
  npcTrades?: NPCTrade[];
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
        this.transformMonsters(dataSources.monsters?.species || {}),
      ]);

      return {
        areas,
        characterClasses,
        items,
        monsters,
        errors: [...this.errors],
        warnings: [...this.warnings],
      };
    } catch (error) {
      this.errors.push(
        `Failed to load game data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return {
        areas: [],
        characterClasses: [],
        items: [],
        monsters: [],
        errors: [...this.errors],
        warnings: [...this.warnings],
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
      this.errors.push(
        `Error loading legacy data sources: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
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
          shopIds: this.sanitizeStringArray(area.shopIds || []),
          storyEvents: this.sanitizeStringArray(area.storyEvents || []),
          backgroundMusic: area.backgroundMusic || 'default',
          recommendedLevel: area.difficulty || this.calculateRecommendedLevel(area),
          boss: area.boss
            ? {
                name: this.sanitizeString(area.boss.name),
                species: this.sanitizeString(area.boss.species),
                level: Math.max(1, area.boss.level || 1),
                reward: {
                  experience: Math.max(0, area.boss.reward?.exp || 0),
                  gold: Math.max(0, area.boss.reward?.gold || 0),
                  items: this.sanitizeStringArray(area.boss.reward?.items || []),
                },
              }
            : undefined,
          lootTable: area.lootTable || undefined,
        };

        areas.push(transformedArea);
      } catch (error) {
        this.errors.push(
          `Failed to transform area '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    this.warnings.push(`Transformed ${areas.length} areas from legacy data`);
    return areas;
  }

  /**
   * Transform legacy character class data to React format
   */
  private async transformCharacterClasses(
    legacyCharacters: LegacyCharacterData
  ): Promise<ReactCharacterClass[]> {
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
            accuracy: Math.max(1, Math.min(100, character.baseStats.accuracy || 75)),
          },
          weaponTypes: this.sanitizeStringArray(character.weaponTypes || []),
          startingSpells: this.sanitizeStringArray(character.startingSpells || []),
          spellAffinities: this.sanitizeStringArray(character.spellAffinities || []),
          classBonus: character.classBonus || undefined,
        };

        characterClasses.push(transformedClass);
      } catch (error) {
        this.errors.push(
          `Failed to transform character class '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
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
              classes: this.sanitizeStringArray(weapon.requirements?.classes || []),
            },
            value: Math.max(0, weapon.value || 0),
            icon: weapon.icon || '⚔️',
            effects: this.sanitizeStringArray(weapon.effects || []),
            stackable: false,
            consumable: false,
          };

          items.push(transformedItem);
        } catch (error) {
          this.errors.push(
            `Failed to transform weapon '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    // Transform consumables
    if (legacyItems.consumables) {
      for (const [id, consumable] of Object.entries(legacyItems.consumables)) {
        try {
          const transformedItem: ReactItem = {
            id,
            name: this.sanitizeString(consumable.name),
            description: this.sanitizeString(consumable.description),
            type: 'consumable',
            subType: consumable.consumableType || 'potion',
            rarity: this.normalizeRarity(consumable.rarity),
            value: Math.max(0, consumable.value || 0),
            icon: consumable.icon || '🧪',
            effects: this.sanitizeStringArray(consumable.effects || []),
            stackable: true,
            consumable: true,
            stats: this.normalizeStats(consumable.stats || {}),
          };

          items.push(transformedItem);
        } catch (error) {
          this.errors.push(
            `Failed to transform consumable '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    // Transform armor
    if (legacyItems.armor) {
      for (const [id, armor] of Object.entries(legacyItems.armor)) {
        try {
          const transformedItem: ReactItem = {
            id,
            name: this.sanitizeString(armor.name),
            description: this.sanitizeString(armor.description),
            type: 'armor',
            subType: armor.armorType || armor.slot || 'body',
            rarity: this.normalizeRarity(armor.rarity),
            stats: this.normalizeStats(armor.stats || {}),
            requirements: {
              level: armor.requirements?.level || 1,
              classes: this.sanitizeStringArray(armor.requirements?.classes || []),
            },
            value: Math.max(0, armor.value || 0),
            icon: armor.icon || '🛡️',
            effects: this.sanitizeStringArray(armor.effects || []),
            stackable: false,
            consumable: false,
          };

          items.push(transformedItem);
        } catch (error) {
          this.errors.push(
            `Failed to transform armor '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

    // Transform materials
    if (legacyItems.materials) {
      for (const [id, material] of Object.entries(legacyItems.materials)) {
        try {
          const transformedItem: ReactItem = {
            id,
            name: this.sanitizeString(material.name),
            description: this.sanitizeString(material.description),
            type: 'material',
            subType: material.materialType || 'common',
            rarity: this.normalizeRarity(material.rarity),
            value: Math.max(0, material.value || 0),
            icon: material.icon || '📦',
            effects: this.sanitizeStringArray(material.effects || []),
            stackable: true,
            consumable: false,
            stats: {},
          };

          items.push(transformedItem);
        } catch (error) {
          this.errors.push(
            `Failed to transform material '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }
    }

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
            accuracy: Math.max(1, Math.min(100, monster.baseStats.accuracy || 70)),
          },
          currentStats: {
            hp: Math.max(1, monster.baseStats.hp || 25),
            mp: Math.max(0, monster.baseStats.mp || 10),
            attack: Math.max(1, monster.baseStats.attack || 20),
            defense: Math.max(1, monster.baseStats.defense || 15),
            magicAttack: Math.max(1, monster.baseStats.magicAttack || 15),
            magicDefense: Math.max(1, monster.baseStats.magicDefense || 15),
            speed: Math.max(1, monster.baseStats.speed || 30),
            accuracy: Math.max(1, Math.min(100, monster.baseStats.accuracy || 70)),
          },
          abilities: this.sanitizeStringArray(monster.abilities || []),
          captureRate: Math.max(0, Math.min(100, monster.captureRate || 50)),
          experience: 0,
          friendship: 0,
          evolutionLevel: monster.evolutionLevel || null,
          evolvesTo: this.sanitizeStringArray(monster.evolvesTo || []),
          areas: this.sanitizeStringArray(monster.areas || []),
          isWild: true,
          nickname: null,
        };

        monsters.push(transformedMonster);
      } catch (error) {
        this.errors.push(
          `Failed to transform monster '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    this.warnings.push(`Transformed ${monsters.length} monsters from legacy data`);
    return monsters;
  }

  /**
   * Transform unlock requirements to normalized format
   * Preserves complex AND/OR logic from areas.js for proper unlock evaluation
   */
  private transformUnlockRequirements(requirements: any): UnlockRequirement {
    if (!requirements || typeof requirements !== 'object') {
      return {};
    }

    // Pass through the requirements object as-is to preserve complex AND/OR logic
    // The AreaData.isAreaUnlocked function handles the evaluation
    // We just need to ensure basic structure is valid
    const normalized: UnlockRequirement = { ...requirements };

    // Normalize simple fields for backward compatibility
    if (requirements.story && !normalized.story) {
      normalized.story = this.sanitizeString(requirements.story);
    }
    if (typeof requirements.level === 'number' && !normalized.level) {
      normalized.level = Math.max(1, requirements.level);
    }
    if (requirements.item && !normalized.items) {
      normalized.items = [this.sanitizeString(requirements.item)];
    }
    if (requirements.items && Array.isArray(requirements.items)) {
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
      town: 'town',
      village: 'town',
      wilderness: 'wilderness',
      forest: 'wilderness',
      plains: 'wilderness',
      mountain: 'wilderness',
      dungeon: 'dungeon',
      cave: 'dungeon',
      temple: 'dungeon',
      special: 'special',
      secret: 'special',
    };

    return typeMap[type?.toLowerCase()] || 'wilderness';
  }

  private normalizeRarity(rarity: string): ItemRarity {
    const rarityMap: { [key: string]: ItemRarity } = {
      common: 'common',
      uncommon: 'uncommon',
      rare: 'rare',
      epic: 'epic',
      legendary: 'legendary',
    };

    return rarityMap[rarity?.toLowerCase()] || 'common';
  }

  private normalizeWeaponType(weaponType: string): WeaponType {
    const weaponMap: { [key: string]: WeaponType } = {
      sword: 'sword',
      staff: 'staff',
      bow: 'bow',
      dagger: 'dagger',
      mace: 'mace',
      axe: 'axe',
      spear: 'spear',
    };

    return weaponMap[weaponType?.toLowerCase()] || 'sword';
  }

  private normalizeMonsterTypes(types: any[]): MonsterType[] {
    if (!Array.isArray(types)) {
      return ['normal'];
    }

    const typeMap: { [key: string]: MonsterType } = {
      water: 'water',
      fire: 'fire',
      earth: 'earth',
      air: 'air',
      light: 'light',
      dark: 'dark',
      normal: 'normal',
      basic: 'normal',
      humanoid: 'normal',
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
      town: 0.5,
      wilderness: 1,
      dungeon: 1.5,
      special: 2,
    };

    const multiplier = typeMultiplier[area.type] || 1;
    return Math.max(1, Math.floor(baseLevel * multiplier));
  }

  /**
   * Load and transform shop data from legacy sources
   */
  async loadShopData(): Promise<Shop[]> {
    this.errors = [];
    this.warnings = [];

    try {
      let shopData: LegacyShopData = {};

      // Check if data is available globally
      if (typeof window !== 'undefined' && (window as any).ShopData) {
        shopData = (window as any).ShopData;
      }

      return await this.transformShops(shopData);
    } catch (error) {
      this.errors.push(
        `Failed to load shop data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return [];
    }
  }

  /**
   * Load and transform shop inventory data
   */
  async loadShopInventory(): Promise<ShopInventory[]> {
    this.errors = [];
    this.warnings = [];

    try {
      let inventoryData: LegacyShopInventoryData = {};

      // Check if data is available globally
      if (typeof window !== 'undefined' && (window as any).ShopInventoryData) {
        inventoryData = (window as any).ShopInventoryData;
      }

      return await this.transformShopInventories(inventoryData);
    } catch (error) {
      this.errors.push(
        `Failed to load shop inventory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return [];
    }
  }

  /**
   * Load and transform NPC trade data
   */
  async loadNPCTrades(): Promise<NPCTrade[]> {
    this.errors = [];
    this.warnings = [];

    try {
      let tradeData: LegacyNPCTradeData = {};

      // Check if data is available globally
      if (typeof window !== 'undefined' && (window as any).NPCTradeData) {
        tradeData = (window as any).NPCTradeData;
      }

      return await this.transformNPCTrades(tradeData);
    } catch (error) {
      this.errors.push(
        `Failed to load NPC trades: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return [];
    }
  }

  /**
   * Transform legacy shop data to React format
   */
  private async transformShops(legacyShops: LegacyShopData): Promise<Shop[]> {
    const shops: Shop[] = [];

    for (const [id, shop] of Object.entries(legacyShops)) {
      try {
        const transformedShop: Shop = {
          id,
          name: this.sanitizeString(shop.name),
          type: this.normalizeShopType(shop.type),
          location: this.sanitizeString(shop.location),
          shopkeeper: {
            name: this.sanitizeString(shop.shopkeeper.name),
            mood: this.normalizeShopkeeperMood(shop.shopkeeper.mood || 'happy'),
            dialogue: {
              greeting: this.sanitizeString(shop.shopkeeper.dialogue?.greeting || 'Welcome!'),
              buyDialogue: this.sanitizeString(
                shop.shopkeeper.dialogue?.buyDialogue || 'Thanks for your purchase!'
              ),
              sellDialogue: this.sanitizeString(
                shop.shopkeeper.dialogue?.sellDialogue || 'Thanks for the items!'
              ),
              browsing: shop.shopkeeper.dialogue?.browsing,
              farewell: shop.shopkeeper.dialogue?.farewell,
              firstVisit: shop.shopkeeper.dialogue?.firstVisit,
              tips: this.sanitizeStringArray(shop.shopkeeper.dialogue?.tips || []),
              encouragement: this.sanitizeStringArray(
                shop.shopkeeper.dialogue?.encouragement || []
              ),
            },
            avatar: shop.shopkeeper.avatar,
            backstory: shop.shopkeeper.backstory,
          },
          buysCategories: this.sanitizeStringArray(shop.buysCategories),
          unlockRequirements: shop.unlockRequirements
            ? {
                level: shop.unlockRequirements.level,
                storyProgress: shop.unlockRequirements.storyProgress,
                areaCompletion: shop.unlockRequirements.areaCompletion,
                explorationThreshold: shop.unlockRequirements.explorationThreshold,
                questRequired: shop.unlockRequirements.questRequired,
              }
            : undefined,
          pricingModifiers: shop.pricingModifiers,
          theme: shop.theme,
          hidden: shop.hidden || false,
        };

        shops.push(transformedShop);
      } catch (error) {
        this.errors.push(
          `Failed to transform shop '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    this.warnings.push(`Transformed ${shops.length} shops from legacy data`);
    return shops;
  }

  /**
   * Transform legacy shop inventory data to React format
   */
  private async transformShopInventories(
    legacyInventories: LegacyShopInventoryData
  ): Promise<ShopInventory[]> {
    const inventories: ShopInventory[] = [];

    for (const [shopId, itemsArray] of Object.entries(legacyInventories)) {
      try {
        // Validate that itemsArray is actually an array
        if (!Array.isArray(itemsArray)) {
          this.errors.push(
            `Shop inventory for '${shopId}' is not an array. Expected array, got ${typeof itemsArray}`
          );
          continue;
        }

        const transformedInventory: ShopInventory = {
          shopId,
          items: itemsArray.map(item => ({
            itemId: this.sanitizeString(item.itemId),
            price: item.price,
            sellPrice: item.sellPrice,
            stock: Math.max(-1, item.stock), // -1 for unlimited
            unlockRequirements: item.unlockRequirements
              ? {
                  level: item.unlockRequirements.level,
                  storyChapter: item.unlockRequirements.storyChapter,
                  areaCompletion: item.unlockRequirements.areaCompletion,
                  questCompletion: item.unlockRequirements.questCompletion,
                  previousPurchases: this.sanitizeStringArray(
                    item.unlockRequirements.previousPurchases || []
                  ),
                }
              : undefined,
            featured: item.featured || false,
          })),
        };

        inventories.push(transformedInventory);
      } catch (error) {
        this.errors.push(
          `Failed to transform shop inventory for '${shopId}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    this.warnings.push(`Transformed ${inventories.length} shop inventories from legacy data`);
    return inventories;
  }

  /**
   * Transform legacy NPC trade data to React format
   */
  private async transformNPCTrades(legacyTrades: LegacyNPCTradeData): Promise<NPCTrade[]> {
    const trades: NPCTrade[] = [];

    for (const [id, trade] of Object.entries(legacyTrades)) {
      try {
        const transformedTrade: NPCTrade = {
          id,
          npcName: this.sanitizeString(trade.npcName),
          type: this.normalizeTradeType(trade.type),
          repeatability: this.normalizeTradeRepeatability(trade.repeatability),
          requiredItems: trade.requiredItems.map(req => ({
            itemId: this.sanitizeString(req.itemId),
            quantity: Math.max(1, req.quantity),
            consumed: req.consumed !== false, // Default to true
          })),
          offeredItems: trade.offeredItems.map(offer => ({
            itemId: this.sanitizeString(offer.itemId),
            quantity: Math.max(1, offer.quantity),
            chance: offer.chance !== undefined ? Math.max(0, Math.min(1, offer.chance)) : 1.0,
          })),
          goldRequired: trade.goldRequired,
          goldOffered: trade.goldOffered,
          requirements: trade.requirements?.map(req => ({
            type: req.type,
            id: req.id,
            quantity: req.quantity,
            value: req.value,
            description: this.sanitizeString(req.description || ''),
          })),
          dialogue: this.sanitizeString(trade.dialogue),
          location: this.sanitizeString(trade.location),
        };

        trades.push(transformedTrade);
      } catch (error) {
        this.errors.push(
          `Failed to transform NPC trade '${id}': ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    this.warnings.push(`Transformed ${trades.length} NPC trades from legacy data`);
    return trades;
  }

  /**
   * Normalize shop type to valid values
   */
  private normalizeShopType(type: string): 'general' | 'weapon' | 'armor' | 'magic' | 'apothecary' {
    const typeMap: { [key: string]: 'general' | 'weapon' | 'armor' | 'magic' | 'apothecary' } = {
      general: 'general',
      weapon: 'weapon',
      armor: 'armor',
      magic: 'magic',
      apothecary: 'apothecary',
      alchemy: 'apothecary',
      potion: 'apothecary',
    };

    return typeMap[type?.toLowerCase()] || 'general';
  }

  /**
   * Normalize shopkeeper mood to valid values
   */
  private normalizeShopkeeperMood(
    mood: string
  ): 'happy' | 'neutral' | 'grumpy' | 'excited' | 'helpful' {
    const moodMap: { [key: string]: 'happy' | 'neutral' | 'grumpy' | 'excited' | 'helpful' } = {
      happy: 'happy',
      neutral: 'neutral',
      grumpy: 'grumpy',
      excited: 'excited',
      helpful: 'helpful',
    };

    return moodMap[mood?.toLowerCase()] || 'happy';
  }

  /**
   * Normalize trade type to valid values
   */
  private normalizeTradeType(type: string): 'barter' | 'quest' {
    return type?.toLowerCase() === 'quest' ? 'quest' : 'barter';
  }

  /**
   * Normalize trade repeatability to valid values
   */
  private normalizeTradeRepeatability(
    repeatability: string
  ): 'one_time' | 'repeatable' | 'daily' | 'weekly' {
    const repeatMap: { [key: string]: 'one_time' | 'repeatable' | 'daily' | 'weekly' } = {
      one_time: 'one_time',
      once: 'one_time',
      repeatable: 'repeatable',
      unlimited: 'repeatable',
      daily: 'daily',
      weekly: 'weekly',
    };

    return repeatMap[repeatability?.toLowerCase()] || 'one_time';
  }
}

// Singleton instance
export const gameDataLoader = new GameDataLoader();

// Export helper functions for individual data loading
export const loadAreas = () => gameDataLoader.loadGameData().then(data => data.areas);
export const loadCharacterClasses = () =>
  gameDataLoader.loadGameData().then(data => data.characterClasses);
export const loadItems = () => gameDataLoader.loadGameData().then(data => data.items);
export const loadMonsters = () => gameDataLoader.loadGameData().then(data => data.monsters);

// Export shop data loading functions
export const loadShopData = () => gameDataLoader.loadShopData();
export const loadShopInventory = () => gameDataLoader.loadShopInventory();
export const loadNPCTrades = () => gameDataLoader.loadNPCTrades();
