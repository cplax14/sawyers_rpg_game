import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { AutoSaveManager } from '../utils/autoSave';
import { InventoryState, EquipmentSlot } from '../types/inventory';
import { CreatureCollection, EnhancedCreature } from '../types/creatures';
import { ExperienceState } from '../types/experience';
import {
  removeExhaustion,
  calculateBreedingCost,
  generateOffspring,
  validateBreeding,
  applyExhaustion,
} from '../utils/breedingEngine';
import { BreedingRecipe } from '../types/breeding';
import { checkRecipeDiscoveryAfterCapture } from '../utils/recipeDiscovery';
import { ExperienceCalculator } from '../utils/experienceUtils';
import {
  cleanInvalidEquipment,
  migrateEquipmentSlots,
  EQUIPMENT_VERSION,
} from '../utils/equipmentValidation';
import { Transaction, PlayerShopState, ShopInventory } from '../types/shop';

// Global type declaration for auto-save manager
declare global {
  interface Window {
    gameAutoSaveManager?: AutoSaveManager;
  }
}

// Enhanced TypeScript interfaces for the React rewrite
export interface ReactPlayer {
  id: string;
  name: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  experience: number;
  experienceToNext: number;
  gold: number;
  baseStats: PlayerStats;
  stats: PlayerStats;
  equipment: Equipment;
  spells: string[]; // Spell IDs
  avatar?: string;
}

export interface PlayerStats {
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  speed: number;
  accuracy: number;
}

export interface Equipment {
  // Main equipment slots
  weapon: string | null; // Item ID
  armor: string | null; // Item ID (legacy - now maps to chestplate)
  accessory: string | null; // Item ID (legacy - general accessory slot)

  // Extended equipment slots (10-slot system)
  helmet: string | null; // Item ID
  necklace: string | null; // Item ID
  shield: string | null; // Item ID
  gloves: string | null; // Item ID
  boots: string | null; // Item ID
  ring1: string | null; // Item ID
  ring2: string | null; // Item ID
  charm: string | null; // Item ID
}

export interface ReactArea {
  id: string;
  name: string;
  description: string;
  type: 'town' | 'wilderness' | 'dungeon' | 'special';
  unlocked: boolean;
  unlockRequirements: {
    level?: number;
    story?: string;
    items?: string[];
    areas?: string[];
  };
  encounterRate: number;
  monsters: string[]; // Monster IDs
  connections: string[]; // Area IDs
  services?: string[];
  shopIds?: string[]; // Shop IDs available in this area
  recommendedLevel: number;
  position?: { x: number; y: number };
}

export interface ReactItem {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'weapon' | 'armor' | 'accessory' | 'material';
  subtype?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  value: number;
  quantity: number;
  stats?: Partial<PlayerStats>;
  effects?: ItemEffect[];
  requirements?: {
    level?: number;
    classes?: string[];
  };
  icon: string;
}

export interface ItemEffect {
  type: 'heal' | 'damage' | 'buff' | 'debuff' | 'restore';
  value: number;
  duration?: number;
  target?: 'self' | 'enemy' | 'party';
}

export interface ReactMonster {
  id: string;
  name: string;
  species: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  baseStats: PlayerStats;
  currentStats: PlayerStats;
  types: string[];
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  abilities: string[]; // Ability IDs
  captureRate: number;
  experience: number;
  gold: number;
  drops: ItemDrop[];
  areas: string[];
  evolvesTo: string[];
  isWild: boolean;
  friendship?: number;
}

export interface ItemDrop {
  itemId: string;
  chance: number;
  minQuantity: number;
  maxQuantity: number;
}

/**
 * Game metadata for tracking system versions and save information
 */
export interface GameMetadata {
  /** Equipment system version for migration tracking */
  equipmentVersion?: string;
  /** Timestamp when the game was last saved */
  savedAt?: string;
  /** Overall game version (for future use) */
  gameVersion?: string;
}

// Main game state for React
export interface ReactGameState {
  // Core game data
  player: ReactPlayer | null;
  currentArea: string;

  // Game progress
  unlockedAreas: string[];
  completedQuests: string[];
  storyFlags: Record<string, boolean>;

  // Legacy collections (for backward compatibility)
  inventory: ReactItem[];
  capturedMonsters: ReactMonster[];

  // New inventory system states
  inventoryState?: InventoryState;
  creatures?: CreatureCollection;
  experience?: ExperienceState;

  // UI state
  isLoading: boolean;
  currentScreen:
    | 'menu'
    | 'character-selection'
    | 'world-map'
    | 'area'
    | 'combat'
    | 'inventory'
    | 'breeding'
    | 'creatures'
    | 'settings';
  error: string | null;

  // Combat state
  currentEncounter: {
    species: string;
    level: number;
  } | null;
  showVictoryModal: boolean;
  lastCombatRewards: {
    experience: number;
    gold: number;
    items: ReactItem[];
    capturedMonsterId?: string; // Track which monster was just captured
    didLevelUp?: boolean; // Track if player leveled up from this combat
    previousLevel?: number; // Level before combat
    newLevel?: number; // Level after combat
  } | null;

  // Game session data
  sessionStartTime: number;
  totalPlayTime: number; // in milliseconds

  // Settings
  settings: GameSettings;

  // Save system
  saveSlots: SaveSlot[];
  currentSaveSlot: number | null;

  // Breeding system
  breedingAttempts: number;
  discoveredRecipes: string[];
  breedingMaterials: Record<string, number>;

  // Shop system
  shops?: PlayerShopState;

  // System metadata for tracking versions and migrations
  metadata?: GameMetadata;
}

export interface GameSettings {
  // Audio
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  soundEnabled: boolean;

  // Gameplay
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  autoSave: boolean;
  autoSaveInterval: number; // in minutes
  autoSaveMaxFailures: number; // max consecutive failures before disabling
  autoSaveShowNotifications: boolean; // show auto-save notifications
  autoSavePauseDuringCombat: boolean; // pause auto-save during combat
  autoSaveOnlyWhenActive: boolean; // only auto-save when user is active
  showDamageNumbers: boolean;
  fastAnimations: boolean;

  // Accessibility
  highContrast: boolean;
  reduceMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';

  // Interface
  showTutorials: boolean;
  confirmActions: boolean;
  keyboardShortcuts: Record<string, string>;
}

export interface SaveSlot {
  id: number;
  playerName: string;
  playerClass: string;
  level: number;
  currentArea: string;
  totalPlayTime: number;
  timestamp: Date;
  screenshot?: string;
  gameVersion: string;
}

// Action types for the reducer
export type ReactGameAction =
  | { type: 'SET_LOADING'; payload: { isLoading: boolean } }
  | { type: 'SET_ERROR'; payload: { error: string | null } }
  | { type: 'SET_CURRENT_SCREEN'; payload: ReactGameState['currentScreen'] }
  | { type: 'CREATE_PLAYER'; payload: { name: string; class: string } }
  | { type: 'UPDATE_PLAYER'; payload: Partial<ReactPlayer> }
  | {
      type: 'UPDATE_PLAYER_STATS';
      payload: { playerId: string; stats: Partial<ReactPlayer['stats']> };
    }
  | { type: 'LEVEL_UP_PLAYER'; payload: { playerId: string } }
  | { type: 'ADD_EXPERIENCE'; payload: { playerId: string; experience: number } }
  | { type: 'ADD_GOLD'; payload: { playerId: string; gold: number } }
  | { type: 'CHANGE_AREA'; payload: { areaId: string } }
  | { type: 'SET_CURRENT_AREA'; payload: string }
  | { type: 'UNLOCK_AREA'; payload: { areaId: string } }
  | { type: 'SET_STORY_FLAG'; payload: { flag: string; value: boolean } }
  | { type: 'COMPLETE_QUEST'; payload: { questId: string } }
  | { type: 'ADD_ITEM'; payload: { item: ReactItem; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string; quantity: number } }
  | { type: 'USE_ITEM'; payload: { itemId: string } }
  | { type: 'EQUIP_ITEM'; payload: { slot: EquipmentSlot; itemId: string } }
  | { type: 'UNEQUIP_ITEM'; payload: { slot: EquipmentSlot } }
  | { type: 'ADD_TO_INVENTORY'; payload: ReactItem[] }
  | { type: 'REMOVE_FROM_INVENTORY'; payload: { itemId: string; quantity?: number } }
  | { type: 'UPDATE_ITEM_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'CAPTURE_MONSTER'; payload: { monster: ReactMonster } }
  | { type: 'RELEASE_MONSTER'; payload: { monsterId: string } }
  | { type: 'UPDATE_MONSTER'; payload: { monsterId: string; updates: Partial<ReactMonster> } }
  | { type: 'RENAME_MONSTER'; payload: { monsterId: string; nickname: string } }
  | { type: 'UPDATE_STORY_FLAGS'; payload: Record<string, boolean> }
  | { type: 'UPDATE_SETTINGS'; payload: { settings: Partial<GameSettings> } }
  | { type: 'RESET_SETTINGS' }
  | { type: 'SAVE_GAME'; payload: { slotIndex: number; saveName: string; timestamp: number } }
  | { type: 'LOAD_GAME'; payload: { slotIndex: number } }
  | { type: 'DELETE_SAVE'; payload: { slotIndex: number } }
  | { type: 'UPDATE_PLAYTIME'; payload: number }
  | { type: 'LOAD_GAME_DATA'; payload: Partial<ReactGameState> }
  | { type: 'SAVE_TO_SLOT'; payload: { slotId: number; data: SaveSlot } }
  | { type: 'LOAD_FROM_SLOT'; payload: number }
  | { type: 'START_COMBAT'; payload: { species: string; level: number } }
  | { type: 'END_COMBAT'; payload: { experience: number; gold: number; items: ReactItem[] } }
  | { type: 'SHOW_VICTORY_MODAL'; payload: boolean }
  | { type: 'HIDE_VICTORY_MODAL' }
  | { type: 'RESET_GAME' }
  // New inventory system actions
  | { type: 'UPDATE_INVENTORY_STATE'; payload: InventoryState }
  | { type: 'UPDATE_CREATURE_COLLECTION'; payload: CreatureCollection }
  | { type: 'UPDATE_EXPERIENCE_STATE'; payload: ExperienceState }
  // Breeding system actions
  | {
      type: 'BREED_CREATURES';
      payload: { parent1Id: string; parent2Id: string; recipeId?: string };
    }
  | { type: 'UPDATE_BREEDING_ATTEMPTS'; payload: number }
  | { type: 'DISCOVER_RECIPE'; payload: string }
  | { type: 'ADD_BREEDING_MATERIAL'; payload: { materialId: string; quantity: number } }
  | { type: 'REMOVE_BREEDING_MATERIAL'; payload: { materialId: string; quantity: number } }
  | { type: 'APPLY_EXHAUSTION'; payload: { creatureId: string } }
  | {
      type: 'REMOVE_EXHAUSTION';
      payload: { creatureId: string; levelsToRemove: number; costGold?: number };
    }
  // Shop system actions
  | { type: 'DISCOVER_SHOP'; payload: { shopId: string } }
  | { type: 'UNLOCK_SHOP'; payload: { shopId: string } }
  | { type: 'OPEN_SHOP'; payload: { shopId: string } }
  | { type: 'CLOSE_SHOP' }
  | {
      type: 'BUY_ITEM';
      payload: { shopId: string; item: ReactItem; quantity: number; totalCost: number };
    }
  | {
      type: 'SELL_ITEM';
      payload: { shopId: string; itemId: string; quantity: number; totalValue: number };
    }
  | { type: 'ADD_TRANSACTION'; payload: { transaction: Transaction } }
  | { type: 'UPDATE_SHOP_INVENTORY_CACHE'; payload: { shopId: string; inventory: ShopInventory } }
  | { type: 'COMPLETE_SHOP_TUTORIAL' }
  | { type: 'COMPLETE_TRADE_TUTORIAL' }
  | { type: 'COMPLETE_NPC_TRADE'; payload: { tradeId: string } };

/**
 * Helper function to calculate player stats including equipment bonuses
 * This ensures stats are always up-to-date when equipment changes
 */
function calculatePlayerStatsWithEquipment(
  player: ReactPlayer,
  inventory: ReactItem[]
): PlayerStats {
  // Start with base stats
  const stats = { ...player.baseStats };

  // Add bonuses from each equipped item
  Object.values(player.equipment).forEach(itemId => {
    if (!itemId) return;

    // Find item in inventory
    const item = inventory.find(invItem => invItem.id === itemId);
    if (!item) return;

    // Support both legacy 'stats' and new 'statModifiers' fields
    const itemStats = item.stats || (item as any).statModifiers;
    if (!itemStats) return;

    // Add stat bonuses from equipment
    stats.attack += itemStats.attack || 0;
    stats.defense += itemStats.defense || 0;
    stats.magicAttack += itemStats.magicAttack || 0;
    stats.magicDefense += itemStats.magicDefense || 0;
    stats.speed += itemStats.speed || 0;
    stats.accuracy += itemStats.accuracy || 0;
  });

  return stats;
}

// Default settings
const defaultSettings: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  soundEnabled: true,
  difficulty: 'normal',
  autoSave: true,
  autoSaveInterval: 3, // 3 minutes (converted to milliseconds: 180000)
  autoSaveMaxFailures: 3,
  autoSaveShowNotifications: true,
  autoSavePauseDuringCombat: true,
  autoSaveOnlyWhenActive: true,
  showDamageNumbers: true,
  fastAnimations: false,
  highContrast: false,
  reduceMotion: false,
  fontSize: 'medium',
  colorBlindMode: 'none',
  showTutorials: true,
  confirmActions: true,
  keyboardShortcuts: {
    'open-inventory': 'KeyI',
    'open-menu': 'Escape',
    'quick-save': 'KeyS',
    'quick-load': 'KeyL',
  },
};

// Validation function for breeding data loaded from saves
function validateBreedingData(creature: EnhancedCreature): EnhancedCreature {
  const validated = { ...creature };

  // Validate generation (0-5)
  if (
    typeof validated.generation !== 'number' ||
    validated.generation < 0 ||
    validated.generation > 5
  ) {
    console.warn(
      `⚠️ Invalid generation ${validated.generation} for creature ${validated.id}, defaulting to 0`
    );
    validated.generation = 0;
  }

  // Validate breedingCount
  if (typeof validated.breedingCount !== 'number' || validated.breedingCount < 0) {
    validated.breedingCount = 0;
  }

  // Validate exhaustionLevel
  if (typeof validated.exhaustionLevel !== 'number' || validated.exhaustionLevel < 0) {
    validated.exhaustionLevel = 0;
  }

  // Validate parentIds
  if (!Array.isArray(validated.parentIds)) {
    validated.parentIds = [undefined, undefined];
  }

  // Validate inheritedAbilities
  if (!Array.isArray(validated.inheritedAbilities)) {
    validated.inheritedAbilities = [];
  }

  // Validate passiveTraits
  if (!Array.isArray(validated.passiveTraits)) {
    validated.passiveTraits = [];
  }

  // Validate stat caps based on generation
  const baseStatCap = 100;
  const generationBonus = validated.generation * 0.1; // +10% per generation
  const expectedCap = Math.floor(baseStatCap * (1 + generationBonus));

  // Ensure stats don't exceed generation caps
  if (validated.stats) {
    const statKeys: (keyof PlayerStats)[] = [
      'attack',
      'defense',
      'magicAttack',
      'magicDefense',
      'speed',
      'accuracy',
    ];
    statKeys.forEach(statKey => {
      if (validated.stats[statKey] > expectedCap) {
        console.warn(
          `⚠️ Stat ${statKey} (${validated.stats[statKey]}) exceeds gen ${validated.generation} cap (${expectedCap}), capping it`
        );
        validated.stats[statKey] = expectedCap;
      }
    });
  }

  return validated;
}

// Migration function for old saves without breeding metadata
function migrateCreatureToBreedingSystem(creature: any): EnhancedCreature {
  return {
    ...creature,
    generation: creature.generation ?? 0,
    breedingCount: creature.breedingCount ?? 0,
    exhaustionLevel: creature.exhaustionLevel ?? 0,
    parentIds: creature.parentIds ?? [undefined, undefined],
    inheritedAbilities: creature.inheritedAbilities ?? [],
    passiveTraits: creature.passiveTraits ?? [],
  };
}

// Initial state
const initialState: ReactGameState = {
  player: null,
  currentArea: 'starting_village',
  unlockedAreas: ['starting_village'],
  completedQuests: [],
  storyFlags: {},
  inventory: [],
  capturedMonsters: [],
  isLoading: false,
  currentScreen: 'menu',
  error: null,
  currentEncounter: null,
  showVictoryModal: false,
  lastCombatRewards: null,
  sessionStartTime: Date.now(),
  totalPlayTime: 0,
  settings: defaultSettings,
  saveSlots: [],
  currentSaveSlot: null,
  breedingAttempts: 0,
  discoveredRecipes: [],
  breedingMaterials: {},
  // Initialize shop state with defaults
  shops: {
    discoveredShops: [],
    unlockedShops: [],
    currentShop: null,
    shopInventoryCache: {},
    transactionHistory: [],
    completedTrades: [],
    tradeCooldowns: {},
    shopTutorialCompleted: false,
    tradeTutorialCompleted: false,
  },
  // Initialize creatures collection to prevent undefined errors
  creatures: {
    creatures: {},
    bestiary: {},
    activeTeam: [],
    reserves: [],
    totalDiscovered: 0,
    totalCaptured: 0,
    completionPercentage: 0,
    favoriteSpecies: [],
    activeBreeding: [],
    breedingHistory: [],
    activeTrades: [],
    tradeHistory: [],
    autoSort: true,
    showStats: true,
    groupBy: 'species',
    filter: {
      types: [],
      elements: [],
      rarities: [],
      completionLevels: [],
      favorites: false,
      companions: false,
      breedable: false,
      searchText: '',
    },
    lastUpdated: 0, // Will be updated when breeding occurs
  },
};

// Game reducer function
function reactGameReducer(state: ReactGameState, action: ReactGameAction): ReactGameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload.isLoading };

    case 'SET_ERROR':
      return { ...state, error: action.payload.error };

    case 'SET_CURRENT_SCREEN':
      return { ...state, currentScreen: action.payload };

    case 'CREATE_PLAYER':
      const { name, class: playerClass } = action.payload;

      // Load character class data and assign starting spells
      const characterClassData =
        typeof window !== 'undefined' && (window as any).CharacterData
          ? (window as any).CharacterData.getClass(playerClass)
          : null;

      const startingSpells = characterClassData?.startingSpells || [];

      // Initialize base stats based on character class data
      const baseStats: PlayerStats = characterClassData?.baseStats || {
        attack: 10,
        defense: 10,
        magicAttack: 10,
        magicDefense: 10,
        speed: 10,
        accuracy: 85,
      };

      const newPlayer: ReactPlayer = {
        id: `player_${Date.now()}`,
        name,
        class: playerClass,
        level: 1,
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        experience: 0,
        experienceToNext: 100, // Matches BASE_XP_PER_LEVEL from experienceUtils.ts
        gold: 100,
        baseStats,
        stats: { ...baseStats },
        equipment: {
          // Legacy slots
          weapon: null,
          armor: null,
          accessory: null,
          // Extended slots (10-slot system)
          helmet: null,
          necklace: null,
          shield: null,
          gloves: null,
          boots: null,
          ring1: null,
          ring2: null,
          charm: null,
        },
        spells: startingSpells,
      };
      return {
        ...state,
        player: newPlayer,
        currentScreen: 'world-map',
        sessionStartTime: Date.now(),
        storyFlags: { ...state.storyFlags, tutorial_complete: true },
      };

    case 'UPDATE_PLAYER':
      if (!state.player) return state;
      const updatedPlayerData = { ...state.player, ...action.payload };
      console.log('🔍 UPDATE_PLAYER Debug:', {
        originalPlayer: { experience: state.player.experience, gold: state.player.gold },
        updatePayload: action.payload,
        updatedPlayer: { experience: updatedPlayerData.experience, gold: updatedPlayerData.gold },
      });
      return {
        ...state,
        player: updatedPlayerData,
      };

    case 'CHANGE_AREA':
      // Trigger auto-save for area transition
      setTimeout(() => {
        if (window.gameAutoSaveManager) {
          window.gameAutoSaveManager.forceSave();
        }
      }, 500); // Small delay to ensure area change is complete
      return { ...state, currentArea: action.payload.areaId };

    case 'SET_CURRENT_AREA':
      return { ...state, currentArea: action.payload };

    case 'UNLOCK_AREA':
      if (state.unlockedAreas.includes(action.payload.areaId)) return state;
      return {
        ...state,
        unlockedAreas: [...state.unlockedAreas, action.payload.areaId],
      };

    case 'SET_STORY_FLAG':
      return {
        ...state,
        storyFlags: { ...state.storyFlags, [action.payload.flag]: action.payload.value },
      };

    case 'COMPLETE_QUEST':
      if (state.completedQuests.includes(action.payload.questId)) return state;
      // Trigger auto-save for quest completion
      setTimeout(() => {
        if (window.gameAutoSaveManager) {
          window.gameAutoSaveManager.forceSave();
        }
      }, 100);
      return {
        ...state,
        completedQuests: [...state.completedQuests, action.payload.questId],
      };

    case 'ADD_TO_INVENTORY':
      // Handle stacking of items with same ID
      const newItems = action.payload;
      const updatedInventory = [...state.inventory];

      newItems.forEach(newItem => {
        const existingItemIndex = updatedInventory.findIndex(item => item.id === newItem.id);
        if (existingItemIndex !== -1) {
          updatedInventory[existingItemIndex].quantity += newItem.quantity;
        } else {
          updatedInventory.push(newItem);
        }
      });

      return { ...state, inventory: updatedInventory };

    case 'REMOVE_FROM_INVENTORY':
      const { itemId, quantity = 1 } = action.payload;
      const filteredInventory = state.inventory
        .map(item => {
          if (item.id === itemId) {
            const newQuantity = item.quantity - quantity;
            if (newQuantity <= 0) {
              return null; // Mark for removal
            }
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter(Boolean) as ReactItem[];

      return { ...state, inventory: filteredInventory };

    case 'UPDATE_ITEM_QUANTITY':
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.itemId ? { ...item, quantity: action.payload.quantity } : item
        ),
      };

    case 'CAPTURE_MONSTER':
      const newCapturedMonsters = [...state.capturedMonsters, action.payload.monster];

      // Check for recipe discovery after capturing a new creature
      let newlyDiscoveredRecipes: string[] = [];

      // Convert captured monster to EnhancedCreature format for recipe check
      const enhancedCreature = state.creatures?.creatures[action.payload.monster.id];

      if (enhancedCreature && state.creatures) {
        const discoveryResult = checkRecipeDiscoveryAfterCapture(
          enhancedCreature,
          state.creatures.creatures,
          state.discoveredRecipes,
          state.player?.level || 1,
          state.storyFlags
        );

        newlyDiscoveredRecipes = discoveryResult.newlyDiscovered;

        if (newlyDiscoveredRecipes.length > 0) {
          console.log('✨ New recipes discovered:', newlyDiscoveredRecipes);
        }
      }

      return {
        ...state,
        capturedMonsters: newCapturedMonsters,
        discoveredRecipes: [...state.discoveredRecipes, ...newlyDiscoveredRecipes],
      };

    case 'RELEASE_MONSTER':
      return {
        ...state,
        capturedMonsters: state.capturedMonsters.filter(
          monster => monster.id !== action.payload.monsterId
        ),
      };

    case 'UPDATE_STORY_FLAGS':
      return {
        ...state,
        storyFlags: { ...state.storyFlags, ...action.payload },
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, ...action.payload.settings },
      };

    case 'RESET_SETTINGS':
      return {
        ...state,
        settings: defaultSettings,
      };

    case 'UPDATE_PLAYTIME':
      return {
        ...state,
        totalPlayTime: state.totalPlayTime + action.payload,
      };

    case 'LOAD_GAME_DATA':
      console.log('🔍 LOAD_GAME_DATA Debug:', {
        currentPlayerData: state.player
          ? { experience: state.player.experience, gold: state.player.gold }
          : 'No player',
        payloadPlayerData: action.payload.player
          ? { experience: action.payload.player.experience, gold: action.payload.player.gold }
          : 'No player in payload',
        currentStoryFlags: state.storyFlags,
        payloadStoryFlags: action.payload.storyFlags,
        fullPayload: action.payload,
      });
      const loadedState = { ...state, ...action.payload };

      // Backward compatibility: Ensure tutorial_complete flag exists if player exists
      if (loadedState.player && !loadedState.storyFlags?.tutorial_complete) {
        console.warn('⚠️ Loaded save missing tutorial_complete flag, adding it automatically...');
        loadedState.storyFlags = {
          ...loadedState.storyFlags,
          tutorial_complete: true,
        };
      }

      console.log('🔍 LOAD_GAME_DATA Result:', {
        newPlayerData: loadedState.player
          ? { experience: loadedState.player.experience, gold: loadedState.player.gold }
          : 'No player',
        storyFlags: loadedState.storyFlags,
        hasTutorialComplete: loadedState.storyFlags?.tutorial_complete,
      });
      return loadedState;

    case 'START_COMBAT':
      return {
        ...state,
        currentEncounter: action.payload,
        currentScreen: 'combat',
      };

    case 'END_COMBAT':
      // Validate payload exists
      if (!action.payload) {
        console.error('END_COMBAT action dispatched without payload');
        return state;
      }
      const { experience, gold, items } = action.payload;

      // Track level-up information
      let didLevelUp = false;
      let previousLevel = state.player?.level || 1;
      let levelAfterCombat = previousLevel;

      // Add experience and gold to player
      let updatedPlayerFromCombat = state.player;
      if (updatedPlayerFromCombat) {
        updatedPlayerFromCombat = {
          ...updatedPlayerFromCombat,
          experience: updatedPlayerFromCombat.experience + experience,
          gold: updatedPlayerFromCombat.gold + gold,
        };

        // Check for level up using proper level calculation
        const calculatedLevel = ExperienceCalculator.calculateLevel(
          updatedPlayerFromCombat.experience
        );
        if (calculatedLevel > updatedPlayerFromCombat.level && calculatedLevel <= 100) {
          // Player leveled up!
          didLevelUp = true;
          levelAfterCombat = calculatedLevel;
          const levelDifference = calculatedLevel - updatedPlayerFromCombat.level;
          console.log(
            `🎉 LEVEL UP! ${updatedPlayerFromCombat.level} → ${calculatedLevel} (gained ${levelDifference} levels)`
          );

          updatedPlayerFromCombat = {
            ...updatedPlayerFromCombat,
            level: calculatedLevel,
            experienceToNext: ExperienceCalculator.getXPForNextLevel(
              updatedPlayerFromCombat.experience
            ),
            maxHp: updatedPlayerFromCombat.maxHp + 10 * levelDifference,
            maxMp: updatedPlayerFromCombat.maxMp + 5 * levelDifference,
            hp: updatedPlayerFromCombat.maxHp + 10 * levelDifference,
            mp: updatedPlayerFromCombat.maxMp + 5 * levelDifference,
          };
        }
      }

      // Add items to inventory
      const updatedInventoryFromCombat = [...state.inventory];
      if (items && Array.isArray(items)) {
        items.forEach(newItem => {
          const existingItemIndex = updatedInventoryFromCombat.findIndex(
            item => item.id === newItem.id
          );
          if (existingItemIndex !== -1) {
            updatedInventoryFromCombat[existingItemIndex].quantity += newItem.quantity;
          } else {
            updatedInventoryFromCombat.push(newItem);
          }
        });
      }

      return {
        ...state,
        player: updatedPlayerFromCombat,
        inventory: updatedInventoryFromCombat,
        currentEncounter: null,
        showVictoryModal: true,
        lastCombatRewards: {
          experience,
          gold,
          items,
          didLevelUp,
          previousLevel,
          newLevel: levelAfterCombat,
        },
        // Keep current screen as 'combat' to show victory modal, let VictoryModal handle navigation
        currentScreen: state.currentScreen,
      };

    case 'SHOW_VICTORY_MODAL':
      return {
        ...state,
        showVictoryModal: action.payload,
      };

    case 'HIDE_VICTORY_MODAL':
      return {
        ...state,
        showVictoryModal: false,
        lastCombatRewards: null,
      };

    case 'LEVEL_UP_PLAYER':
      if (!state.player) return state;
      const newLevel = state.player.level + 1;
      const levelUpPlayer = {
        ...state.player,
        level: newLevel,
        experienceToNext: ExperienceCalculator.getXPForNextLevel(state.player.experience),
        maxHp: state.player.maxHp + 10,
        maxMp: state.player.maxMp + 5,
        hp: state.player.maxHp + 10, // Heal to full on level up
        mp: state.player.maxMp + 5,
      };
      // Trigger auto-save for level up
      setTimeout(() => {
        if (window.gameAutoSaveManager) {
          window.gameAutoSaveManager.forceSave();
        }
      }, 100);
      return {
        ...state,
        player: levelUpPlayer,
      };

    case 'ADD_EXPERIENCE':
      if (!state.player) return state;
      console.log('🔍 ADD_EXPERIENCE Debug:', {
        currentExp: state.player.experience,
        currentExpType: typeof state.player.experience,
        incomingExp: action.payload.experience,
        incomingExpType: typeof action.payload.experience,
      });
      const newExp = state.player.experience + action.payload.experience;

      // Validate XP before updating
      if (isNaN(newExp) || newExp < 0) {
        console.error('❌ Invalid XP calculation!', {
          currentXP: state.player.experience,
          addedXP: action.payload.experience,
          result: newExp,
        });
        return state; // Don't update with invalid data
      }

      console.log('🔍 ADD_EXPERIENCE Result:', { newExp, isNaN: isNaN(newExp) });
      let updatedPlayer = { ...state.player, experience: newExp };

      // Check for level up using proper level calculation
      const calculatedLevel = ExperienceCalculator.calculateLevel(updatedPlayer.experience);
      if (calculatedLevel > updatedPlayer.level && calculatedLevel <= 100) {
        // Player leveled up!
        const levelDifference = calculatedLevel - updatedPlayer.level;
        console.log(
          `🎉 LEVEL UP! ${updatedPlayer.level} → ${calculatedLevel} (gained ${levelDifference} levels)`
        );

        updatedPlayer = {
          ...updatedPlayer,
          level: calculatedLevel,
          experienceToNext: ExperienceCalculator.getXPForNextLevel(updatedPlayer.experience),
          maxHp: updatedPlayer.maxHp + 10 * levelDifference,
          maxMp: updatedPlayer.maxMp + 5 * levelDifference,
          hp: updatedPlayer.maxHp + 10 * levelDifference,
          mp: updatedPlayer.maxMp + 5 * levelDifference,
        };
        // Trigger auto-save for level up
        setTimeout(() => {
          if (window.gameAutoSaveManager) {
            window.gameAutoSaveManager.forceSave();
          }
        }, 100);
      }

      return {
        ...state,
        player: updatedPlayer,
      };

    case 'ADD_GOLD':
      if (!state.player) return state;
      console.log('🔍 ADD_GOLD Debug:', {
        currentGold: state.player.gold,
        currentGoldType: typeof state.player.gold,
        incomingGold: action.payload.gold,
        incomingGoldType: typeof action.payload.gold,
      });
      const newGold = state.player.gold + action.payload.gold;
      console.log('🔍 ADD_GOLD Result:', { newGold, isNaN: isNaN(newGold) });
      return {
        ...state,
        player: {
          ...state.player,
          gold: newGold,
        },
      };

    case 'EQUIP_ITEM':
      // Equipment state update
      // Note: Stat recalculation is handled by useEquipment hook via UPDATE_PLAYER_STATS
      if (!state.player) {
        console.warn('⚠️ [EQUIP_ITEM] Cannot equip item: No player found');
        return state;
      }

      const { slot, itemId: equipItemId } = action.payload;

      // Basic validation: slot must be a valid equipment slot
      const validSlots = [
        'weapon',
        'armor',
        'accessory',
        'helmet',
        'necklace',
        'shield',
        'gloves',
        'boots',
        'ring1',
        'ring2',
        'charm',
      ];
      if (!validSlots.includes(slot)) {
        console.warn(`⚠️ [EQUIP_ITEM] Invalid equipment slot: ${slot}`);
        return state;
      }

      // Basic validation: itemId must be a non-empty string
      if (!equipItemId || typeof equipItemId !== 'string' || equipItemId.trim() === '') {
        console.warn(`⚠️ [EQUIP_ITEM] Invalid itemId: ${equipItemId}`);
        return state;
      }

      // Update equipment (stats will be recalculated by useEquipment hook)
      return {
        ...state,
        player: {
          ...state.player,
          equipment: {
            ...state.player.equipment,
            [slot]: equipItemId,
          },
        },
      };

    case 'UNEQUIP_ITEM':
      // Unequip item from slot
      // Note: Stat recalculation is handled by useEquipment hook via UPDATE_PLAYER_STATS
      if (!state.player) {
        console.warn('⚠️ [UNEQUIP_ITEM] Cannot unequip item: No player found');
        return state;
      }

      const { slot: unequipSlot } = action.payload;

      // Basic validation: slot must be a valid equipment slot
      const validUnequipSlots = [
        'weapon',
        'armor',
        'accessory',
        'helmet',
        'necklace',
        'shield',
        'gloves',
        'boots',
        'ring1',
        'ring2',
        'charm',
      ];
      if (!validUnequipSlots.includes(unequipSlot)) {
        console.warn(`⚠️ [UNEQUIP_ITEM] Invalid equipment slot: ${unequipSlot}`);
        return state;
      }

      // Update equipment (stats will be recalculated by useEquipment hook)
      return {
        ...state,
        player: {
          ...state.player,
          equipment: {
            ...state.player.equipment,
            [unequipSlot]: null,
          },
        },
      };

    case 'UPDATE_PLAYER_STATS':
      if (!state.player) return state;

      // Extract stats from payload (sent from useEquipment.ts)
      // Payload structure: { playerId: string, stats: Partial<PlayerStats> }
      const statsToUpdate = action.payload.stats;

      // Merge equipment bonuses into player.stats
      // This ensures combat calculations use equipment-modified stats
      return {
        ...state,
        player: {
          ...state.player,
          stats: { ...state.player.stats, ...statsToUpdate },
        },
      };

    case 'RESET_GAME':
      return { ...initialState, sessionStartTime: Date.now() };

    // New inventory system action handlers
    case 'UPDATE_INVENTORY_STATE':
      return {
        ...state,
        inventoryState: action.payload,
      };

    case 'UPDATE_CREATURE_COLLECTION':
      return {
        ...state,
        creatures: action.payload,
      };

    case 'UPDATE_EXPERIENCE_STATE':
      return {
        ...state,
        experience: action.payload,
      };

    // Breeding system reducer handlers
    case 'BREED_CREATURES': {
      // Get parent creatures from collection
      if (!state.creatures) {
        console.error('❌ BREED_CREATURES: Creatures collection not initialized');
        return state;
      }

      const parent1 = state.creatures.creatures[action.payload.parent1Id];
      const parent2 = state.creatures.creatures[action.payload.parent2Id];

      if (!parent1 || !parent2) {
        console.error('❌ BREED_CREATURES: Parent creatures not found', {
          parent1Id: action.payload.parent1Id,
          parent2Id: action.payload.parent2Id,
        });
        return state;
      }

      // Load recipe if recipeId provided
      let recipe: BreedingRecipe | undefined;
      if (action.payload.recipeId) {
        console.log('🧬 Recipe breeding not yet implemented, using natural breeding');
      }

      // Calculate cost
      const cost = calculateBreedingCost(parent1, parent2, recipe);

      // Validate breeding requirements
      const validation = validateBreeding(
        parent1,
        parent2,
        state.player.gold,
        state.breedingMaterials,
        cost
      );

      if (!validation.valid) {
        console.error('❌ [BREED_CREATURES] Breeding validation failed', validation.errors);
        return state;
      }

      // Generate offspring
      const result = generateOffspring(parent1, parent2, recipe);

      if (!result.success || !result.offspring) {
        console.error('❌ [BREED_CREATURES] Offspring generation failed');
        return state;
      }

      // Create complete EnhancedCreature from offspring partial data
      const offspringId = `creature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const completeOffspring: EnhancedCreature = {
        ...result.offspring,
        creatureId: offspringId,
        id: offspringId,
        name: `${result.offspringSpecies} (Gen ${result.generation})`,

        // Combat stats
        hp: 100, // Level 1 base HP
        maxHp: 100,
        mp: 50, // Level 1 base MP
        maxMp: 50,
        baseStats: result.offspring.stats,
        currentStats: result.offspring.stats,

        // Required fields from EnhancedCreature
        types: [result.offspring.species], // Simplified
        abilities: result.offspring.inheritedAbilities || [],
        captureRate: 0.5,
        experience: 0,
        gold: 10,
        drops: [],
        areas: [],
        evolvesTo: [],
        isWild: false,

        // Enhanced classification
        element: 'neutral' as const, // Default, could be inherited
        creatureType: 'beast' as const, // Default, could be inherited
        size: 'medium' as const,
        habitat: [],

        // Individual traits
        personality: {
          traits: ['docile'],
          mood: 'content' as const,
          loyalty: 50,
          happiness: 100, // Newborn creatures are happy
          energy: 100,
          sociability: 50,
        },
        nature: {
          name: 'Neutral',
          statModifiers: {},
          behaviorModifiers: {
            aggression: 0,
            defensiveness: 0,
            cooperation: 0,
          },
        },
        individualStats: {
          hpIV: Math.floor(Math.random() * 32),
          attackIV: Math.floor(Math.random() * 32),
          defenseIV: Math.floor(Math.random() * 32),
          magicAttackIV: Math.floor(Math.random() * 32),
          magicDefenseIV: Math.floor(Math.random() * 32),
          speedIV: Math.floor(Math.random() * 32),
          hpEV: 0,
          attackEV: 0,
          defenseEV: 0,
          magicAttackEV: 0,
          magicDefenseEV: 0,
          speedEV: 0,
        },

        // Genetics (partially duplicated from breeding metadata)
        genetics: {
          parentIds: [parent1.creatureId, parent2.creatureId],
          generation: result.generation,
          inheritedTraits: [],
          mutations: [],
          breedingPotential: 1,
        },
        breedingGroup: [],
        fertility: 1,

        // Collection status
        collectionStatus: {
          discovered: true,
          captured: true,
          timesCaptures: 1,
          favorite: false,
          tags: ['bred'],
          notes: `Bred from ${parent1.name} and ${parent2.name}`,
          completionLevel: 'captured' as const,
        },

        // Visual and lore
        sprite: 'default.png',
        description: `A ${result.offspringSpecies} born from breeding`,
        loreText: `Generation ${result.generation} creature`,
        discoveryLocation: 'Breeding Facility',
        discoveredAt: new Date(),
        capturedAt: new Date(),
        timesEncountered: 0,
      };

      // Apply exhaustion to parents
      const exhaustedParent1 = applyExhaustion(parent1);
      const exhaustedParent2 = applyExhaustion(parent2);

      // Deduct gold
      const newGold = state.player.gold - cost.goldAmount;

      // Deduct materials
      const newMaterials = { ...state.breedingMaterials };
      for (const material of cost.materials) {
        const current = newMaterials[material.itemId] || 0;
        const remaining = current - material.quantity;
        if (remaining <= 0) {
          delete newMaterials[material.itemId];
        } else {
          newMaterials[material.itemId] = remaining;
        }
      }

      // Update creatures collection
      // CRITICAL FIX: Force new reference with lastUpdated timestamp
      // This ensures React detects the state change and triggers re-renders in useCreatures hook
      const updatedCreatures = {
        ...state.creatures,
        creatures: {
          ...state.creatures.creatures,
          [offspringId]: completeOffspring,
          [parent1.creatureId]: exhaustedParent1,
          [parent2.creatureId]: exhaustedParent2,
        },
        totalCaptured: state.creatures.totalCaptured + 1,
        lastUpdated: Date.now(), // Force reference change to trigger React updates
      };

      // Check for recipe discovery after breeding
      let newlyDiscoveredRecipesFromBreeding: string[] = [];

      const discoveryResult = checkRecipeDiscoveryAfterCapture(
        completeOffspring,
        updatedCreatures.creatures,
        state.discoveredRecipes,
        state.player?.level || 1,
        state.storyFlags
      );

      newlyDiscoveredRecipesFromBreeding = discoveryResult.newlyDiscovered;

      if (newlyDiscoveredRecipesFromBreeding.length > 0) {
        console.log('✨ New recipes discovered:', newlyDiscoveredRecipesFromBreeding);
      }

      console.log('✅ Breeding successful:', {
        offspring: completeOffspring.name,
        species: result.offspringSpecies,
        generation: result.generation,
        rarity: result.offspring.rarity,
      });

      // REMOVED: Auto-save trigger moved to external effect (see useEffect in ReactGameProvider)
      // Triggering save from inside reducer reads stale state before React re-renders

      return {
        ...state,
        creatures: updatedCreatures,
        player: {
          ...state.player,
          gold: newGold,
        },
        breedingMaterials: newMaterials,
        breedingAttempts: state.breedingAttempts + 1,
        discoveredRecipes: [...state.discoveredRecipes, ...newlyDiscoveredRecipesFromBreeding],
      };
    }

    case 'UPDATE_BREEDING_ATTEMPTS':
      return {
        ...state,
        breedingAttempts: action.payload,
      };

    case 'RENAME_MONSTER': {
      if (!state.creatures) return state;

      const targetCreature = state.creatures.creatures[action.payload.monsterId];
      if (!targetCreature) {
        console.warn('❌ [RENAME_MONSTER] Creature not found:', action.payload.monsterId);
        return state;
      }

      // Update creature name/nickname
      const updatedCreature = {
        ...targetCreature,
        name: action.payload.nickname,
        nickname: action.payload.nickname,
      };

      const updatedCreatures = {
        ...state.creatures,
        creatures: {
          ...state.creatures.creatures,
          [action.payload.monsterId]: updatedCreature,
        },
        lastUpdated: Date.now(), // Trigger state propagation
      };

      console.log('✅ [RENAME_MONSTER] Creature renamed:', {
        id: action.payload.monsterId,
        oldName: targetCreature.name,
        newName: action.payload.nickname,
      });

      return {
        ...state,
        creatures: updatedCreatures,
      };
    }

    case 'DISCOVER_RECIPE':
      if (state.discoveredRecipes.includes(action.payload)) return state;
      return {
        ...state,
        discoveredRecipes: [...state.discoveredRecipes, action.payload],
      };

    case 'ADD_BREEDING_MATERIAL':
      const currentMaterialQuantity = state.breedingMaterials[action.payload.materialId] || 0;
      return {
        ...state,
        breedingMaterials: {
          ...state.breedingMaterials,
          [action.payload.materialId]: currentMaterialQuantity + action.payload.quantity,
        },
      };

    case 'REMOVE_BREEDING_MATERIAL':
      const existingQuantity = state.breedingMaterials[action.payload.materialId] || 0;
      const newQuantity = Math.max(0, existingQuantity - action.payload.quantity);
      const updatedMaterials = { ...state.breedingMaterials };

      if (newQuantity <= 0) {
        delete updatedMaterials[action.payload.materialId];
      } else {
        updatedMaterials[action.payload.materialId] = newQuantity;
      }

      return {
        ...state,
        breedingMaterials: updatedMaterials,
      };

    case 'APPLY_EXHAUSTION':
      // Update creature exhaustion in creatures collection
      if (!state.creatures) return state;

      const targetCreature = state.creatures.creatures[action.payload.creatureId];
      if (!targetCreature) return state;

      const newExhaustionLevel = (targetCreature.exhaustionLevel || 0) + 1;
      const newBreedingCount = (targetCreature.breedingCount || 0) + 1;

      // Apply -20% stat penalty per exhaustion level to creature's stats
      // Note: We apply penalty directly to stats since EnhancedCreature uses Monster.stats
      const exhaustionMultiplier = 1 - newExhaustionLevel * 0.2;
      const penalizedStats = {
        attack: Math.floor(targetCreature.stats.attack * exhaustionMultiplier),
        defense: Math.floor(targetCreature.stats.defense * exhaustionMultiplier),
        magicAttack: Math.floor(targetCreature.stats.magicAttack * exhaustionMultiplier),
        magicDefense: Math.floor(targetCreature.stats.magicDefense * exhaustionMultiplier),
        speed: Math.floor(targetCreature.stats.speed * exhaustionMultiplier),
        accuracy: Math.floor(targetCreature.stats.accuracy * exhaustionMultiplier),
      };

      const updatedCreatures = {
        ...state.creatures,
        creatures: {
          ...state.creatures.creatures,
          [action.payload.creatureId]: {
            ...targetCreature,
            exhaustionLevel: newExhaustionLevel,
            breedingCount: newBreedingCount,
            stats: penalizedStats,
          },
        },
      };

      return {
        ...state,
        creatures: updatedCreatures,
      };

    case 'REMOVE_EXHAUSTION':
      // Remove exhaustion from a creature (via items or gold payment)
      if (!state.creatures) return state;

      const creatureToRestore = state.creatures.creatures[action.payload.creatureId];
      if (!creatureToRestore) return state;

      const currentExhaustion = creatureToRestore.exhaustionLevel || 0;
      if (currentExhaustion === 0) return state; // Already fully restored

      // Calculate new exhaustion level
      const levelsToRemove =
        action.payload.levelsToRemove === -1
          ? currentExhaustion // -1 means remove all
          : action.payload.levelsToRemove;
      const newExhaustion = Math.max(0, currentExhaustion - levelsToRemove);

      // Recalculate stats without exhaustion penalty using removeExhaustion from breedingEngine
      const restoredCreature = removeExhaustion(creatureToRestore, levelsToRemove);

      // Deduct gold cost if specified
      let updatedPlayerAfterRecovery = state.player;
      if (action.payload.costGold && action.payload.costGold > 0) {
        updatedPlayerAfterRecovery = {
          ...state.player,
          gold: state.player.gold - action.payload.costGold,
        };
      }

      const updatedCreaturesAfterRecovery = {
        ...state.creatures,
        creatures: {
          ...state.creatures.creatures,
          [action.payload.creatureId]: restoredCreature,
        },
      };

      return {
        ...state,
        player: updatedPlayerAfterRecovery,
        creatures: updatedCreaturesAfterRecovery,
      };

    case 'SAVE_GAME':
      try {
        const saveData = {
          player: state.player,
          currentArea: state.currentArea,
          unlockedAreas: state.unlockedAreas,
          inventory: state.inventory,
          capturedMonsters: state.capturedMonsters,
          storyFlags: state.storyFlags,
          completedQuests: state.completedQuests,
          totalPlayTime: state.totalPlayTime + (Date.now() - state.sessionStartTime),
          settings: state.settings,
          timestamp: action.payload.timestamp,
          // New inventory system data
          inventoryState: state.inventoryState,
          creatures: state.creatures,
          experience: state.experience,
          // Breeding system data
          breedingAttempts: state.breedingAttempts,
          discoveredRecipes: state.discoveredRecipes,
          breedingMaterials: state.breedingMaterials,
          // Shop system data
          shops: state.shops,
          // System metadata with version tracking
          metadata: {
            ...state.metadata,
            equipmentVersion: EQUIPMENT_VERSION,
            savedAt: new Date().toISOString(),
          },
        };

        // Save to localStorage
        const saveSlotKey = `sawyers_rpg_save_slot_${action.payload.slotIndex}`;
        localStorage.setItem(saveSlotKey, JSON.stringify(saveData));

        console.log(
          `✅ Game saved to slot ${action.payload.slotIndex + 1}:`,
          action.payload.saveName
        );

        // Update save slots in state
        const updatedSaveSlots = [...state.saveSlots];
        updatedSaveSlots[action.payload.slotIndex] = {
          data: saveData,
          isEmpty: false,
          saveName: action.payload.saveName,
          timestamp: action.payload.timestamp,
        };

        return {
          ...state,
          saveSlots: updatedSaveSlots,
          currentSaveSlot: action.payload.slotIndex,
        };
      } catch (error) {
        console.error('Save failed:', error);
        return state;
      }

    case 'LOAD_GAME':
      try {
        const saveSlotKey = `sawyers_rpg_save_slot_${action.payload.slotIndex}`;
        const savedData = localStorage.getItem(saveSlotKey);

        if (!savedData) {
          console.error(`No save data found in slot ${action.payload.slotIndex + 1}`);
          return state;
        }

        const parsedData = JSON.parse(savedData);
        console.log(`✅ Game loaded from slot ${action.payload.slotIndex + 1}`);

        // Migrate and validate equipment if present
        if (parsedData.player?.equipment) {
          // Get saved equipment version (defaults to '0.0' if not present)
          const savedVersion = parsedData.metadata?.equipmentVersion || '0.0';

          // First migrate from saved version to current version
          parsedData.player.equipment = migrateEquipmentSlots(
            parsedData.player.equipment,
            savedVersion
          );

          // Then validate and clean invalid items
          parsedData.player.equipment = cleanInvalidEquipment(parsedData.player.equipment);
        }

        // Validate and migrate creature collection if present
        let loadedCreatures = parsedData.creatures;
        if (loadedCreatures && loadedCreatures.creatures) {
          const validatedCreatures: Record<string, EnhancedCreature> = {};
          let migrationCount = 0;
          let validationCount = 0;

          Object.keys(loadedCreatures.creatures).forEach(creatureId => {
            const creature = loadedCreatures.creatures[creatureId];

            // Check if creature needs migration (missing breeding fields)
            const needsMigration =
              creature.generation === undefined ||
              creature.breedingCount === undefined ||
              creature.exhaustionLevel === undefined;

            if (needsMigration) {
              migrationCount++;
              validatedCreatures[creatureId] = validateBreedingData(
                migrateCreatureToBreedingSystem(creature)
              );
            } else {
              validationCount++;
              validatedCreatures[creatureId] = validateBreedingData(creature);
            }
          });

          loadedCreatures = {
            ...loadedCreatures,
            creatures: validatedCreatures,
          };

          if (migrationCount > 0) {
            console.log(`🔄 Migrated ${migrationCount} creatures to breeding system`);
          }
          if (validationCount > 0) {
            console.log(`✅ Validated ${validationCount} creatures with breeding data`);
          }
        }

        return {
          ...state,
          player: parsedData.player,
          currentArea: parsedData.currentArea,
          unlockedAreas: parsedData.unlockedAreas || [],
          inventory: parsedData.inventory || [],
          capturedMonsters: parsedData.capturedMonsters || [],
          storyFlags: parsedData.storyFlags || {},
          completedQuests: parsedData.completedQuests || [],
          totalPlayTime: parsedData.totalPlayTime || 0,
          settings: { ...state.settings, ...parsedData.settings },
          currentSaveSlot: action.payload.slotIndex,
          sessionStartTime: Date.now(), // Reset session start time
          // New inventory system data
          inventoryState: parsedData.inventoryState,
          creatures: loadedCreatures,
          experience: parsedData.experience,
          // Breeding system data with backward compatibility
          breedingAttempts: parsedData.breedingAttempts || 0,
          discoveredRecipes: parsedData.discoveredRecipes || [],
          breedingMaterials: parsedData.breedingMaterials || {},
          // Shop system data with backward compatibility
          // Ensure all required fields exist to prevent undefined errors in old saves
          shops: {
            discoveredShops: parsedData.shops?.discoveredShops || [],
            unlockedShops: parsedData.shops?.unlockedShops || [],
            currentShop: parsedData.shops?.currentShop || null,
            shopInventoryCache: parsedData.shops?.shopInventoryCache || {},
            transactionHistory: parsedData.shops?.transactionHistory || [],
            completedTrades: parsedData.shops?.completedTrades || [],
            tradeCooldowns: parsedData.shops?.tradeCooldowns || {},
            shopTutorialCompleted: parsedData.shops?.shopTutorialCompleted || false,
            tradeTutorialCompleted: parsedData.shops?.tradeTutorialCompleted || false,
          },
        };
      } catch (error) {
        console.error('Load failed:', error);
        return state;
      }

    case 'DELETE_SAVE':
      try {
        const saveSlotKey = `sawyers_rpg_save_slot_${action.payload.slotIndex}`;
        localStorage.removeItem(saveSlotKey);

        console.log(`✅ Save slot ${action.payload.slotIndex + 1} deleted`);

        // Update save slots in state
        const updatedSaveSlots = [...state.saveSlots];
        updatedSaveSlots[action.payload.slotIndex] = {
          data: null,
          isEmpty: true,
          saveName: '',
          timestamp: 0,
        };

        return {
          ...state,
          saveSlots: updatedSaveSlots,
          currentSaveSlot:
            state.currentSaveSlot === action.payload.slotIndex ? null : state.currentSaveSlot,
        };
      } catch (error) {
        console.error('Delete save failed:', error);
        return state;
      }

    // =============================================================================
    // SHOP SYSTEM REDUCERS
    // =============================================================================

    case 'DISCOVER_SHOP': {
      // Initialize shop state if it doesn't exist
      const shopState = state.shops || {
        discoveredShops: [],
        unlockedShops: [],
        currentShop: null,
        shopInventoryCache: {},
        transactionHistory: [],
        completedTrades: [],
        tradeCooldowns: {},
        shopTutorialCompleted: false,
        tradeTutorialCompleted: false,
      };

      // Check if shop is already discovered
      if (shopState.discoveredShops.includes(action.payload.shopId)) {
        return state;
      }

      console.log('🔍 Shop discovered:', action.payload.shopId);

      return {
        ...state,
        shops: {
          ...shopState,
          discoveredShops: [...shopState.discoveredShops, action.payload.shopId],
        },
      };
    }

    case 'UNLOCK_SHOP': {
      // Initialize shop state if it doesn't exist
      const shopState = state.shops || {
        discoveredShops: [],
        unlockedShops: [],
        currentShop: null,
        shopInventoryCache: {},
        transactionHistory: [],
        completedTrades: [],
        tradeCooldowns: {},
        shopTutorialCompleted: false,
        tradeTutorialCompleted: false,
      };

      // Check if shop is already unlocked
      if (shopState.unlockedShops.includes(action.payload.shopId)) {
        return state;
      }

      // Ensure shop is in discovered list when unlocking
      const updatedDiscoveredShops = shopState.discoveredShops.includes(action.payload.shopId)
        ? shopState.discoveredShops
        : [...shopState.discoveredShops, action.payload.shopId];

      console.log('🔓 Shop unlocked:', action.payload.shopId);

      return {
        ...state,
        shops: {
          ...shopState,
          discoveredShops: updatedDiscoveredShops,
          unlockedShops: [...shopState.unlockedShops, action.payload.shopId],
        },
      };
    }

    case 'OPEN_SHOP': {
      const shopState = state.shops || {
        discoveredShops: [],
        unlockedShops: [],
        currentShop: null,
        shopInventoryCache: {},
        transactionHistory: [],
        completedTrades: [],
        tradeCooldowns: {},
        shopTutorialCompleted: false,
        tradeTutorialCompleted: false,
      };

      console.log('🏪 Opening shop:', action.payload.shopId);

      return {
        ...state,
        shops: {
          ...shopState,
          currentShop: action.payload.shopId,
        },
      };
    }

    case 'CLOSE_SHOP': {
      const shopState = state.shops || {
        discoveredShops: [],
        unlockedShops: [],
        currentShop: null,
        shopInventoryCache: {},
        transactionHistory: [],
        completedTrades: [],
        tradeCooldowns: {},
        shopTutorialCompleted: false,
        tradeTutorialCompleted: false,
      };

      console.log('🚪 Closing shop');

      return {
        ...state,
        shops: {
          ...shopState,
          currentShop: null,
        },
      };
    }

    case 'BUY_ITEM': {
      if (!state.player) {
        console.error('❌ BUY_ITEM: No player found');
        return state;
      }

      const { shopId, item, quantity, totalCost } = action.payload;

      // Validate player has enough gold
      if (state.player.gold < totalCost) {
        console.error('❌ BUY_ITEM: Insufficient gold', {
          playerGold: state.player.gold,
          cost: totalCost,
        });
        return state;
      }

      // Deduct gold from player
      const updatedPlayerAfterPurchase = {
        ...state.player,
        gold: state.player.gold - totalCost,
      };

      // Find the item in inventory (if it exists for stacking)
      const existingItemIndex = state.inventory.findIndex(invItem => invItem.id === item.id);
      let updatedInventoryAfterPurchase: ReactItem[];

      if (existingItemIndex !== -1) {
        // Stack with existing item
        updatedInventoryAfterPurchase = state.inventory.map((invItem, index) =>
          index === existingItemIndex ? { ...invItem, quantity: invItem.quantity + quantity } : invItem
        );
      } else {
        // Add new item to inventory with full item data
        const newItem: ReactItem = {
          ...item,
          quantity: quantity,
        };
        updatedInventoryAfterPurchase = [...state.inventory, newItem];
      }

      console.log('✅ Item purchased:', {
        shopId,
        itemId: item.id,
        itemName: item.name,
        quantity,
        totalCost,
        newGold: updatedPlayerAfterPurchase.gold,
        inventoryCount: updatedInventoryAfterPurchase.length,
      });

      // Trigger auto-save for purchase
      setTimeout(() => {
        if (window.gameAutoSaveManager) {
          window.gameAutoSaveManager.forceSave();
        }
      }, 500);

      return {
        ...state,
        player: updatedPlayerAfterPurchase,
        inventory: updatedInventoryAfterPurchase,
      };
    }

    case 'SELL_ITEM': {
      if (!state.player) {
        console.error('❌ SELL_ITEM: No player found');
        return state;
      }

      const { shopId, itemId, quantity, totalValue } = action.payload;

      // Find item in inventory
      const itemIndex = state.inventory.findIndex(item => item.id === itemId);
      if (itemIndex === -1) {
        console.error('❌ SELL_ITEM: Item not found in inventory', itemId);
        return state;
      }

      const inventoryItem = state.inventory[itemIndex];

      // Validate player has enough of the item
      if (inventoryItem.quantity < quantity) {
        console.error('❌ SELL_ITEM: Insufficient quantity', {
          has: inventoryItem.quantity,
          selling: quantity,
        });
        return state;
      }

      // Add gold to player
      const updatedPlayerAfterSale = {
        ...state.player,
        gold: state.player.gold + totalValue,
      };

      // Remove items from inventory
      let updatedInventoryAfterSale: ReactItem[];
      const newQuantity = inventoryItem.quantity - quantity;

      if (newQuantity <= 0) {
        // Remove item completely
        updatedInventoryAfterSale = state.inventory.filter((_, index) => index !== itemIndex);
      } else {
        // Reduce quantity
        updatedInventoryAfterSale = state.inventory.map((item, index) =>
          index === itemIndex ? { ...item, quantity: newQuantity } : item
        );
      }

      console.log('✅ Item sold:', {
        shopId,
        itemId,
        quantity,
        totalValue,
        newGold: updatedPlayerAfterSale.gold,
      });

      // Trigger auto-save for sale
      setTimeout(() => {
        if (window.gameAutoSaveManager) {
          window.gameAutoSaveManager.forceSave();
        }
      }, 500);

      return {
        ...state,
        player: updatedPlayerAfterSale,
        inventory: updatedInventoryAfterSale,
      };
    }

    case 'ADD_TRANSACTION': {
      const shopState = state.shops || {
        discoveredShops: [],
        unlockedShops: [],
        currentShop: null,
        shopInventoryCache: {},
        transactionHistory: [],
        completedTrades: [],
        tradeCooldowns: {},
        shopTutorialCompleted: false,
        tradeTutorialCompleted: false,
      };

      // Add transaction to history, keeping only last 10
      const updatedTransactionHistory = [
        action.payload.transaction,
        ...shopState.transactionHistory,
      ].slice(0, 10); // MAX_TRANSACTION_HISTORY = 10

      return {
        ...state,
        shops: {
          ...shopState,
          transactionHistory: updatedTransactionHistory,
        },
      };
    }

    case 'UPDATE_SHOP_INVENTORY_CACHE': {
      const shopState = state.shops || {
        discoveredShops: [],
        unlockedShops: [],
        currentShop: null,
        shopInventoryCache: {},
        transactionHistory: [],
        completedTrades: [],
        tradeCooldowns: {},
        shopTutorialCompleted: false,
        tradeTutorialCompleted: false,
      };

      return {
        ...state,
        shops: {
          ...shopState,
          shopInventoryCache: {
            ...shopState.shopInventoryCache,
            [action.payload.shopId]: action.payload.inventory,
          },
        },
      };
    }

    case 'COMPLETE_SHOP_TUTORIAL': {
      const shopState = state.shops || {
        discoveredShops: [],
        unlockedShops: [],
        currentShop: null,
        shopInventoryCache: {},
        transactionHistory: [],
        completedTrades: [],
        tradeCooldowns: {},
        shopTutorialCompleted: false,
        tradeTutorialCompleted: false,
      };

      console.log('✅ Shop tutorial completed');

      return {
        ...state,
        shops: {
          ...shopState,
          shopTutorialCompleted: true,
        },
      };
    }

    case 'COMPLETE_TRADE_TUTORIAL': {
      const shopState = state.shops || {
        discoveredShops: [],
        unlockedShops: [],
        currentShop: null,
        shopInventoryCache: {},
        transactionHistory: [],
        completedTrades: [],
        tradeCooldowns: {},
        shopTutorialCompleted: false,
        tradeTutorialCompleted: false,
      };

      console.log('✅ Trade tutorial completed');

      return {
        ...state,
        shops: {
          ...shopState,
          tradeTutorialCompleted: true,
        },
      };
    }

    case 'COMPLETE_NPC_TRADE': {
      const shopState = state.shops || {
        discoveredShops: [],
        unlockedShops: [],
        currentShop: null,
        shopInventoryCache: {},
        transactionHistory: [],
        completedTrades: [],
        tradeCooldowns: {},
        shopTutorialCompleted: false,
        tradeTutorialCompleted: false,
      };

      // Add trade to completed trades list
      const updatedCompletedTrades = [...shopState.completedTrades, action.payload.tradeId];

      // Set cooldown for repeatable trades
      const updatedTradeCooldowns = {
        ...shopState.tradeCooldowns,
        [action.payload.tradeId]: new Date(),
      };

      console.log('✅ NPC trade completed:', action.payload.tradeId);

      return {
        ...state,
        shops: {
          ...shopState,
          completedTrades: updatedCompletedTrades,
          tradeCooldowns: updatedTradeCooldowns,
        },
      };
    }

    default:
      return state;
  }
}

// Context creation
interface ReactGameContextType {
  state: ReactGameState;
  dispatch: React.Dispatch<ReactGameAction>;

  // Helper functions
  createPlayer: (name: string, playerClass: string) => void;
  updatePlayer: (updates: Partial<ReactPlayer>) => void;
  levelUpPlayer: (playerId: string) => void;
  addExperience: (playerId: string, experience: number) => void;
  addGold: (playerId: string, gold: number) => void;
  updatePlayerStats: (playerId: string, stats: Partial<PlayerStats>) => void;

  // Equipment action creators
  equipItem: (slot: EquipmentSlot, itemId: string) => void;
  unequipItem: (slot: EquipmentSlot) => void;

  navigateToArea: (areaId: string) => void;
  unlockArea: (areaId: string) => void;
  addItems: (items: ReactItem[]) => void;
  removeItem: (itemId: string, quantity?: number) => void;
  useItem: (itemId: string) => void;
  captureMonster: (monster: ReactMonster) => void;
  releaseMonster: (monsterId: string) => void;
  updateStoryFlags: (flags: Record<string, boolean>) => void;
  completeQuest: (questId: string) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  setCurrentScreen: (screen: ReactGameState['currentScreen']) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  startCombat: (species: string, level: number) => void;
  endCombat: (rewards: { experience: number; gold: number; items: ReactItem[] }) => void;
  showVictoryModal: () => void;
  hideVictoryModal: () => void;
  generateCombatRewards: (enemyLevel: number) => {
    experience: number;
    gold: number;
    items: ReactItem[];
  };
  resetGame: () => void;

  // New inventory system functions
  updateGameState: (updates: Partial<ReactGameState>) => Promise<void>;
  updateInventoryState: (inventoryState: InventoryState) => void;
  updateCreatureCollection: (creatures: CreatureCollection) => void;
  updateExperienceState: (experience: ExperienceState) => void;

  // Breeding system functions
  breedCreatures: (parent1Id: string, parent2Id: string, recipeId?: string) => void;
  applyExhaustion: (creatureId: string) => void;
  recoverExhaustion: (creatureId: string, levelsToRemove: number, costGold?: number) => void;
  discoverRecipe: (recipeId: string) => void;
  updateBreedingAttempts: (attempts: number) => void;
  addBreedingMaterial: (materialId: string, quantity: number) => void;
  removeBreedingMaterial: (materialId: string, quantity: number) => void;

  // Shop system functions
  discoverShop: (shopId: string) => void;
  unlockShop: (shopId: string) => void;
  openShop: (shopId: string) => void;
  closeShop: () => void;
  buyItem: (shopId: string, itemId: string, quantity: number, totalCost: number) => void;
  sellItem: (shopId: string, itemId: string, quantity: number, totalValue: number) => void;
  addTransaction: (transaction: Transaction) => void;
  updateShopInventoryCache: (shopId: string, inventory: ShopInventory) => void;
  completeShopTutorial: () => void;
  completeTradeTutorial: () => void;
  completeNPCTrade: (tradeId: string) => void;

  // Computed properties
  isPlayerCreated: boolean;
  canAccessArea: (areaId: string) => boolean;
  getInventoryByType: (type: ReactItem['type']) => ReactItem[];
  getPlayerLevel: () => number;
  getTotalPlaytime: () => number;
  getCurrentSessionTime: () => number;
}

export const ReactGameContext = createContext<ReactGameContextType | undefined>(undefined);

// Provider component
interface ReactGameProviderProps {
  children: ReactNode;
}

export const ReactGameProvider: React.FC<ReactGameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reactGameReducer, initialState);

  // Auto-save after breeding completes (runs after state update and re-render)
  useEffect(() => {
    // Only trigger if breeding just occurred (lastUpdated changed)
    if (state.creatures?.lastUpdated) {
      const saveTimer = setTimeout(() => {
        if (window.gameAutoSaveManager) {
          window.gameAutoSaveManager
            .forceSave()
            .then((success: boolean) => {
              if (!success) {
                console.error('❌ Auto-save failed after breeding');
              }
            })
            .catch((error: Error) => {
              console.error('❌ Auto-save error:', error);
            });
        } else {
          console.error('❌ AutoSaveManager not initialized - changes will not persist');
        }
      }, 500);

      return () => clearTimeout(saveTimer);
    }
  }, [state.creatures?.lastUpdated]); // Removed state.breedingAttempts - redundant dependency

  // Initialize save slots from localStorage on mount
  useEffect(() => {
    const initializeSaveSlots = () => {
      const saveSlots = [];
      for (let i = 0; i < 5; i++) {
        // Check for 5 save slots
        const saveSlotKey = `sawyers_rpg_save_slot_${i}`;
        const savedData = localStorage.getItem(saveSlotKey);

        if (savedData) {
          try {
            const parsedData = JSON.parse(savedData);
            saveSlots[i] = {
              data: parsedData,
              isEmpty: false,
              saveName: `Save ${i + 1}`, // Default name, could be enhanced
              timestamp: parsedData.timestamp || Date.now(),
            };
          } catch (error) {
            console.error(`Failed to parse save slot ${i + 1}:`, error);
            saveSlots[i] = {
              data: null,
              isEmpty: true,
              saveName: '',
              timestamp: 0,
            };
          }
        } else {
          saveSlots[i] = {
            data: null,
            isEmpty: true,
            saveName: '',
            timestamp: 0,
          };
        }
      }

      // Update state with loaded save slots
      dispatch({ type: 'LOAD_GAME_DATA', payload: { saveSlots } });
      console.log(
        '✅ Initialized save slots from localStorage:',
        saveSlots.filter(slot => !slot.isEmpty).length,
        'saves found'
      );
    };

    initializeSaveSlots();
  }, []);

  // Track session time
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'UPDATE_PLAYTIME', payload: 1000 }); // Add 1 second
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (state.settings.autoSave && state.player && state.currentSaveSlot !== null) {
      const interval = setInterval(
        () => {
          // Auto-save logic would go here
          console.log('Auto-saving game...');
        },
        state.settings.autoSaveInterval * 60 * 1000
      ); // Convert minutes to milliseconds

      return () => clearInterval(interval);
    }
  }, [
    state.settings.autoSave,
    state.settings.autoSaveInterval,
    state.player,
    state.currentSaveSlot,
  ]);

  // Helper functions
  const createPlayer = (name: string, playerClass: string) => {
    dispatch({ type: 'CREATE_PLAYER', payload: { name, class: playerClass } });
  };

  const levelUpPlayer = (playerId: string) => {
    dispatch({ type: 'LEVEL_UP_PLAYER', payload: { playerId } });
  };

  const addExperience = (playerId: string, experience: number) => {
    dispatch({ type: 'ADD_EXPERIENCE', payload: { playerId, experience } });
  };

  const addGold = (playerId: string, gold: number) => {
    dispatch({ type: 'ADD_GOLD', payload: { playerId, gold } });
  };

  const updatePlayerStats = (playerId: string, stats: Partial<PlayerStats>) => {
    dispatch({ type: 'UPDATE_PLAYER_STATS', payload: { playerId, stats } });
  };

  const updatePlayer = (updates: Partial<ReactPlayer>) => {
    dispatch({ type: 'UPDATE_PLAYER', payload: updates });
  };

  // Equipment action creators
  const equipItem = (slot: EquipmentSlot, itemId: string) => {
    dispatch({ type: 'EQUIP_ITEM', payload: { slot, itemId } });
  };

  const unequipItem = (slot: EquipmentSlot) => {
    dispatch({ type: 'UNEQUIP_ITEM', payload: { slot } });
  };

  const navigateToArea = (areaId: string) => {
    if (canAccessArea(areaId)) {
      dispatch({ type: 'SET_CURRENT_AREA', payload: areaId });
    }
  };

  const unlockArea = (areaId: string) => {
    dispatch({ type: 'UNLOCK_AREA', payload: { areaId } });
  };

  const addItems = (items: ReactItem[]) => {
    dispatch({ type: 'ADD_TO_INVENTORY', payload: items });
  };

  const removeItem = (itemId: string, quantity: number = 1) => {
    dispatch({ type: 'REMOVE_FROM_INVENTORY', payload: { itemId, quantity } });
  };

  const useItem = (itemId: string) => {
    // Implement item usage logic based on item effects
    const item = state.inventory.find(inv => inv.id === itemId);
    if (item && item.effects) {
      item.effects.forEach(effect => {
        if (effect.type === 'heal' && state.player) {
          const healAmount = Math.min(effect.value, state.player.maxHp - state.player.hp);
          updatePlayer({ hp: state.player.hp + healAmount });
        }
        // Add other effect types here
      });
      removeItem(itemId, 1);
    }
  };

  const captureMonster = (monster: ReactMonster) => {
    dispatch({ type: 'CAPTURE_MONSTER', payload: { monster } });
  };

  const releaseMonster = (monsterId: string) => {
    dispatch({ type: 'RELEASE_MONSTER', payload: { monsterId } });
  };

  const updateStoryFlags = (flags: Record<string, boolean>) => {
    dispatch({ type: 'UPDATE_STORY_FLAGS', payload: flags });
  };

  const completeQuest = (questId: string) => {
    dispatch({ type: 'COMPLETE_QUEST', payload: { questId } });
  };

  const updateSettings = (settings: Partial<GameSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: { settings } });
  };

  const setCurrentScreen = (screen: ReactGameState['currentScreen']) => {
    dispatch({ type: 'SET_CURRENT_SCREEN', payload: screen });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: { isLoading: loading } });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: { error } });
  };

  const startCombat = (species: string, level: number) => {
    dispatch({ type: 'START_COMBAT', payload: { species, level } });
  };

  const endCombat = (rewards: { experience: number; gold: number; items: ReactItem[] }) => {
    dispatch({ type: 'END_COMBAT', payload: rewards });
  };

  const showVictoryModal = () => {
    dispatch({ type: 'SHOW_VICTORY_MODAL', payload: true });
  };

  const hideVictoryModal = () => {
    dispatch({ type: 'HIDE_VICTORY_MODAL' });
  };

  // Generate combat rewards including items and equipment
  const generateCombatRewards = useCallback((enemySpecies: string, enemyLevel: number) => {
    // Base experience and gold calculation
    const baseExp = Math.floor(enemyLevel * 10 + Math.random() * 20);
    const baseGold = Math.floor(enemyLevel * 5 + Math.random() * 10);

    // Item drop chance calculation
    const items: ReactItem[] = [];
    const breedingMaterialsDropped: { materialId: string; quantity: number }[] = [];

    // Common items (40% chance) - using items that exist in ItemData
    if (Math.random() < 0.4) {
      const commonItems = [
        {
          id: 'healing_herb',
          name: 'Healing Herb',
          type: 'material',
          rarity: 'common',
          quantity: 1,
          icon: '🌿',
        },
        {
          id: 'mana_flower',
          name: 'Mana Flower',
          type: 'material',
          rarity: 'common',
          quantity: 1,
          icon: '🌸',
        },
        {
          id: 'health_potion',
          name: 'Health Potion',
          type: 'consumable',
          rarity: 'common',
          quantity: 1,
          icon: '🧪',
        },
      ];
      const randomCommon = commonItems[Math.floor(Math.random() * commonItems.length)];
      items.push(randomCommon);
    }

    // Equipment drops based on enemy type and level (15% chance) - using actual ItemData items
    if (Math.random() < 0.15) {
      // Helper function to load full item data from ItemData
      const getFullItemData = (itemId: string): ReactItem | null => {
        if (typeof window === 'undefined' || !(window as any).ItemData) {
          return null;
        }

        const ItemData = (window as any).ItemData;
        const item = ItemData.getItem(itemId);

        if (!item) {
          return null;
        }

        // Transform to EnhancedItem format with all required fields
        return {
          id: itemId,
          name: item.name,
          description: item.description || '',
          type: item.type,
          category:
            item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory'
              ? 'equipment'
              : 'consumables',
          rarity: item.rarity as ItemRarity,
          icon: item.icon,
          value: item.value || 0,
          equipmentSlot: item.equipmentSlot,
          equipmentSubtype: item.equipmentSubtype,
          statModifiers: item.statModifiers,
          stackable: item.type === 'consumable' || item.type === 'material',
          maxStack: item.type === 'consumable' || item.type === 'material' ? 99 : 1,
          weight: item.weight || 1,
          sellValue: item.sellValue || Math.floor((item.value || 0) * 0.5),
          canTrade: item.canTrade !== false,
          canDrop: item.canDrop !== false,
          canDestroy: item.canDestroy !== false,
          usable: item.type === 'consumable',
          consumeOnUse: item.type === 'consumable',
          quantity: 1,
        } as ReactItem;
      };

      const equipmentIds = [
        'iron_sword',
        'steel_dagger',
        'oak_staff',
        'leather_vest',
        'chain_mail',
        'cloth_robe',
        'health_ring',
        'mana_crystal',
      ];

      // Filter equipment appropriate for enemy level and load full data
      const appropriateEquipment = equipmentIds
        .map(id => getFullItemData(id))
        .filter((item): item is ReactItem => {
          if (!item) return false;
          if (enemyLevel >= 5 && item.rarity === 'uncommon') return true;
          if (enemyLevel <= 8 && item.rarity === 'common') return true;
          return false;
        });

      if (appropriateEquipment.length > 0) {
        const randomEquipment =
          appropriateEquipment[Math.floor(Math.random() * appropriateEquipment.length)];
        items.push(randomEquipment);
      }
    }

    // Rare drops (5% chance for higher level enemies) - using actual ItemData items
    if (enemyLevel >= 3 && Math.random() < 0.05) {
      const rareItems = [
        {
          id: 'crystal_staff',
          name: 'Crystal Staff',
          type: 'weapon',
          rarity: 'rare',
          quantity: 1,
          icon: '✨',
        },
        {
          id: 'hi_potion',
          name: 'Hi-Potion',
          type: 'consumable',
          rarity: 'uncommon',
          quantity: 1,
          icon: '🧪',
        },
        {
          id: 'elixir',
          name: 'Elixir',
          type: 'consumable',
          rarity: 'rare',
          quantity: 1,
          icon: '✨',
        },
      ];
      const randomRare = rareItems[Math.floor(Math.random() * rareItems.length)];
      items.push(randomRare);
    }

    // Monster-specific drops - using actual ItemData materials
    if (enemySpecies === 'slime' && Math.random() < 0.3) {
      items.push({
        id: 'slime_gel',
        name: 'Slime Gel',
        type: 'material',
        rarity: 'common',
        quantity: 1,
        icon: '🫧',
      });
    } else if (enemySpecies === 'goblin' && Math.random() < 0.25) {
      items.push({
        id: 'goblin_tooth',
        name: 'Goblin Tooth',
        type: 'material',
        rarity: 'common',
        quantity: 1,
        icon: '🦷',
      });
    } else if (enemySpecies === 'wolf' && Math.random() < 0.2) {
      items.push({
        id: 'wolf_pelt',
        name: 'Wolf Pelt',
        type: 'material',
        rarity: 'uncommon',
        quantity: 1,
        icon: '🧥',
      });
    }

    // Breeding Material Drops - Check MonsterData for breedingMaterialDrops
    try {
      // Access global MonsterData if available
      const MonsterData = (window as any).MonsterData;
      if (MonsterData && MonsterData.species && MonsterData.species[enemySpecies]) {
        const monsterData = MonsterData.species[enemySpecies];

        // Check if this monster has breeding material drops defined
        if (monsterData.breedingMaterialDrops && Array.isArray(monsterData.breedingMaterialDrops)) {
          monsterData.breedingMaterialDrops.forEach((dropInfo: any) => {
            // Roll for each material drop
            const roll = Math.random();
            if (roll < dropInfo.dropRate) {
              // Determine quantity within the defined range
              const quantity = dropInfo.quantity
                ? Math.floor(Math.random() * (dropInfo.quantity.max - dropInfo.quantity.min + 1)) +
                  dropInfo.quantity.min
                : 1;

              breedingMaterialsDropped.push({
                materialId: dropInfo.materialId,
                quantity: quantity,
              });
            }
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load breeding material drops:', error);
    }

    return {
      experience: baseExp,
      gold: baseGold,
      items: items,
      breedingMaterials: breedingMaterialsDropped,
    };
  }, []);

  // Item database for loot generation
  const ITEM_DATABASE: { [key: string]: Omit<ReactItem, 'quantity'> } = {
    health_potion: {
      id: 'health_potion',
      name: 'Health Potion',
      description: 'Restores 50 HP when used.',
      type: 'consumable',
      rarity: 'common',
      value: 25,
      icon: '🧪',
    },
    mana_potion: {
      id: 'mana_potion',
      name: 'Mana Potion',
      description: 'Restores 30 MP when used.',
      type: 'consumable',
      rarity: 'common',
      value: 20,
      icon: '💙',
    },
    stamina_potion: {
      id: 'stamina_potion',
      name: 'Stamina Potion',
      description: 'Restores stamina and reduces fatigue.',
      type: 'consumable',
      rarity: 'common',
      value: 18,
      icon: '💪',
    },
    goblin_tooth: {
      id: 'goblin_tooth',
      name: 'Goblin Tooth',
      description: 'Sharp tooth from a goblin. Used in crafting.',
      type: 'material',
      rarity: 'common',
      value: 5,
      icon: '🦷',
    },
    wolf_fang: {
      id: 'wolf_fang',
      name: 'Wolf Fang',
      description: 'Curved fang from a wolf. Prized for weapon enhancement.',
      type: 'material',
      rarity: 'uncommon',
      value: 25,
      icon: '🔪',
    },
    wolf_pelt: {
      id: 'wolf_pelt',
      name: 'Wolf Pelt',
      description: 'Thick fur from a wolf. Excellent for armor crafting.',
      type: 'material',
      rarity: 'uncommon',
      value: 30,
      icon: '🧥',
    },
    leather_scraps: {
      id: 'leather_scraps',
      name: 'Leather Scraps',
      description: 'Small pieces of leather from various creatures.',
      type: 'material',
      rarity: 'common',
      value: 8,
      icon: '🟤',
    },
    repair_kit: {
      id: 'repair_kit',
      name: 'Repair Kit',
      description: 'Tools for maintaining weapons and armor.',
      type: 'material',
      rarity: 'common',
      value: 30,
      icon: '🔧',
    },
    healing_herb: {
      id: 'healing_herb',
      name: 'Healing Herb',
      description: 'A common medicinal plant found in forests.',
      type: 'material',
      rarity: 'common',
      value: 5,
      icon: '🌿',
    },
  };

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
  };

  // New inventory system functions
  const updateGameState = async (updates: Partial<ReactGameState>) => {
    dispatch({ type: 'LOAD_GAME_DATA', payload: updates });
  };

  const updateInventoryState = (inventoryState: InventoryState) => {
    dispatch({ type: 'UPDATE_INVENTORY_STATE', payload: inventoryState });
  };

  const updateCreatureCollection = (creatures: CreatureCollection) => {
    dispatch({ type: 'UPDATE_CREATURE_COLLECTION', payload: creatures });
  };

  const updateExperienceState = (experience: ExperienceState) => {
    dispatch({ type: 'UPDATE_EXPERIENCE_STATE', payload: experience });
  };

  // Breeding system helper functions
  const breedCreatures = (parent1Id: string, parent2Id: string, recipeId?: string) => {
    dispatch({ type: 'BREED_CREATURES', payload: { parent1Id, parent2Id, recipeId } });
  };

  const applyExhaustion = (creatureId: string) => {
    dispatch({ type: 'APPLY_EXHAUSTION', payload: { creatureId } });
  };

  const recoverExhaustion = (creatureId: string, levelsToRemove: number, costGold?: number) => {
    dispatch({ type: 'REMOVE_EXHAUSTION', payload: { creatureId, levelsToRemove, costGold } });
  };

  const discoverRecipe = (recipeId: string) => {
    dispatch({ type: 'DISCOVER_RECIPE', payload: recipeId });
  };

  const updateBreedingAttempts = (attempts: number) => {
    dispatch({ type: 'UPDATE_BREEDING_ATTEMPTS', payload: attempts });
  };

  const addBreedingMaterial = (materialId: string, quantity: number) => {
    dispatch({ type: 'ADD_BREEDING_MATERIAL', payload: { materialId, quantity } });
  };

  const removeBreedingMaterial = (materialId: string, quantity: number) => {
    dispatch({ type: 'REMOVE_BREEDING_MATERIAL', payload: { materialId, quantity } });
  };

  // Shop system action creators
  const discoverShop = (shopId: string) => {
    dispatch({ type: 'DISCOVER_SHOP', payload: { shopId } });
  };

  const unlockShop = (shopId: string) => {
    dispatch({ type: 'UNLOCK_SHOP', payload: { shopId } });
  };

  const openShop = (shopId: string) => {
    dispatch({ type: 'OPEN_SHOP', payload: { shopId } });
  };

  const closeShop = () => {
    dispatch({ type: 'CLOSE_SHOP' });
  };

  const buyItem = (shopId: string, item: ReactItem, quantity: number, totalCost: number) => {
    dispatch({ type: 'BUY_ITEM', payload: { shopId, item, quantity, totalCost } });
  };

  const sellItem = (shopId: string, itemId: string, quantity: number, totalValue: number) => {
    dispatch({ type: 'SELL_ITEM', payload: { shopId, itemId, quantity, totalValue } });
  };

  const addTransaction = (transaction: Transaction) => {
    dispatch({ type: 'ADD_TRANSACTION', payload: { transaction } });
  };

  const updateShopInventoryCache = (shopId: string, inventory: ShopInventory) => {
    dispatch({ type: 'UPDATE_SHOP_INVENTORY_CACHE', payload: { shopId, inventory } });
  };

  const completeShopTutorial = () => {
    dispatch({ type: 'COMPLETE_SHOP_TUTORIAL' });
  };

  const completeTradeTutorial = () => {
    dispatch({ type: 'COMPLETE_TRADE_TUTORIAL' });
  };

  const completeNPCTrade = (tradeId: string) => {
    dispatch({ type: 'COMPLETE_NPC_TRADE', payload: { tradeId } });
  };

  // Computed properties
  const isPlayerCreated = state.player !== null;

  const canAccessArea = (areaId: string): boolean => {
    return state.unlockedAreas.includes(areaId);
  };

  const getInventoryByType = (type: ReactItem['type']): ReactItem[] => {
    return state.inventory.filter(item => item.type === type);
  };

  const getPlayerLevel = (): number => {
    return state.player?.level || 1;
  };

  const getTotalPlaytime = (): number => {
    return state.totalPlayTime;
  };

  const getCurrentSessionTime = (): number => {
    return Date.now() - state.sessionStartTime;
  };

  const contextValue: ReactGameContextType = {
    state,
    dispatch,
    createPlayer,
    updatePlayer,
    levelUpPlayer,
    addExperience,
    addGold,
    updatePlayerStats,
    equipItem,
    unequipItem,
    navigateToArea,
    unlockArea,
    addItems,
    removeItem,
    useItem,
    captureMonster,
    releaseMonster,
    updateStoryFlags,
    completeQuest,
    updateSettings,
    setCurrentScreen,
    setLoading,
    setError,
    startCombat,
    endCombat,
    showVictoryModal,
    hideVictoryModal,
    generateCombatRewards,
    resetGame,
    updateGameState,
    updateInventoryState,
    updateCreatureCollection,
    updateExperienceState,
    breedCreatures,
    applyExhaustion,
    recoverExhaustion,
    discoverRecipe,
    updateBreedingAttempts,
    addBreedingMaterial,
    removeBreedingMaterial,
    discoverShop,
    unlockShop,
    openShop,
    closeShop,
    buyItem,
    sellItem,
    addTransaction,
    updateShopInventoryCache,
    completeShopTutorial,
    completeTradeTutorial,
    completeNPCTrade,
    isPlayerCreated,
    canAccessArea,
    getInventoryByType,
    getPlayerLevel,
    getTotalPlaytime,
    getCurrentSessionTime,
  };

  return <ReactGameContext.Provider value={contextValue}>{children}</ReactGameContext.Provider>;
};

// Custom hook to use the React game context
export const useReactGame = (): ReactGameContextType => {
  const context = useContext(ReactGameContext);
  if (!context) {
    throw new Error('useReactGame must be used within a ReactGameProvider');
  }
  return context;
};

// Specific hooks for common use cases
export const useReactGameState = () => {
  const { state } = useReactGame();
  return state;
};

export const useReactPlayer = () => {
  const { state } = useReactGame();
  return state.player;
};

export const useReactGameActions = () => {
  const {
    createPlayer,
    updatePlayer,
    navigateToArea,
    unlockArea,
    addItems,
    removeItem,
    useItem,
    captureMonster,
    releaseMonster,
    setCurrentScreen,
    setLoading,
    setError,
    resetGame,
  } = useReactGame();

  return {
    createPlayer,
    updatePlayer,
    navigateToArea,
    unlockArea,
    addItems,
    removeItem,
    useItem,
    captureMonster,
    releaseMonster,
    setCurrentScreen,
    setLoading,
    setError,
    resetGame,
  };
};

export const useReactGameSettings = () => {
  const { state, updateSettings } = useReactGame();
  return {
    settings: state.settings,
    updateSettings,
  };
};

// Hook for accessing inventory system state and hooks
export const useGameState = () => {
  const {
    state,
    updateGameState,
    updateInventoryState,
    updateCreatureCollection,
    updateExperienceState,
  } = useReactGame();

  return {
    gameState: state,
    updateGameState,
    updateInventoryState,
    updateCreatureCollection,
    updateExperienceState,
    // Convenience getters for new systems
    inventoryState: state.inventoryState,
    creatureCollection: state.creatures,
    experienceState: state.experience,
    // Legacy compatibility
    playerStats: state.player
      ? {
          level: state.player.level,
          experience: state.player.experience,
          maxHealth: state.player.maxHp,
          maxMana: state.player.maxMp,
          attack: state.player.stats.attack,
          defense: state.player.stats.defense,
          magicAttack: state.player.stats.magicAttack,
          magicDefense: state.player.stats.magicDefense,
          speed: state.player.stats.speed,
        }
      : undefined,
    currentLocation: state.currentArea,
  };
};
