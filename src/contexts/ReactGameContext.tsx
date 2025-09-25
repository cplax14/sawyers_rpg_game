import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

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
  weapon: string | null; // Item ID
  armor: string | null;  // Item ID
  accessory: string | null; // Item ID
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
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: PlayerStats;
  type: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  abilities: string[]; // Ability IDs
  captureRate: number;
  experience: number;
  gold: number;
  drops: ItemDrop[];
}

export interface ItemDrop {
  itemId: string;
  chance: number;
  minQuantity: number;
  maxQuantity: number;
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

  // Collections
  inventory: ReactItem[];
  capturedMonsters: ReactMonster[];

  // UI state
  isLoading: boolean;
  currentScreen: 'menu' | 'character-selection' | 'world-map' | 'area' | 'combat' | 'inventory' | 'settings';
  error: string | null;

  // Game session data
  sessionStartTime: number;
  totalPlayTime: number; // in milliseconds

  // Settings
  settings: GameSettings;

  // Save system
  saveSlots: SaveSlot[];
  currentSaveSlot: number | null;
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
  | { type: 'UPDATE_PLAYER_STATS'; payload: { playerId: string; stats: Partial<ReactPlayer['stats']> } }
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
  | { type: 'EQUIP_ITEM'; payload: { playerId: string; itemId: string } }
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
  | { type: 'RESET_GAME' };

// Default settings
const defaultSettings: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  soundEnabled: true,
  difficulty: 'normal',
  autoSave: true,
  autoSaveInterval: 5,
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
  sessionStartTime: Date.now(),
  totalPlayTime: 0,
  settings: defaultSettings,
  saveSlots: [],
  currentSaveSlot: null,
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
      // This will be enhanced with actual class data
      const baseStats = {
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
        experienceToNext: 100,
        gold: 100,
        baseStats,
        stats: { ...baseStats },
        equipment: {
          weapon: null,
          armor: null,
          accessory: null,
        },
        spells: [],
      };
      return {
        ...state,
        player: newPlayer,
        currentScreen: 'world-map',
        sessionStartTime: Date.now(),
        storyFlags: { ...state.storyFlags, tutorial_complete: true }
      };

    case 'UPDATE_PLAYER':
      if (!state.player) return state;
      return {
        ...state,
        player: { ...state.player, ...action.payload },
      };

    case 'CHANGE_AREA':
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
      const filteredInventory = state.inventory.map(item => {
        if (item.id === itemId) {
          const newQuantity = item.quantity - quantity;
          if (newQuantity <= 0) {
            return null; // Mark for removal
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      }).filter(Boolean) as ReactItem[];

      return { ...state, inventory: filteredInventory };

    case 'UPDATE_ITEM_QUANTITY':
      return {
        ...state,
        inventory: state.inventory.map(item =>
          item.id === action.payload.itemId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };

    case 'CAPTURE_MONSTER':
      return {
        ...state,
        capturedMonsters: [...state.capturedMonsters, action.payload.monster],
      };

    case 'RELEASE_MONSTER':
      return {
        ...state,
        capturedMonsters: state.capturedMonsters.filter(monster => monster.id !== action.payload.monsterId),
      };

    case 'UPDATE_STORY_FLAGS':
      return {
        ...state,
        storyFlags: { ...state.storyFlags, ...action.payload },
      };

    case 'COMPLETE_QUEST':
      if (state.completedQuests.includes(action.payload)) return state;
      return {
        ...state,
        completedQuests: [...state.completedQuests, action.payload],
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
      return { ...state, ...action.payload };

    case 'RESET_GAME':
      return { ...initialState, sessionStartTime: Date.now() };

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
  resetGame: () => void;

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
      const interval = setInterval(() => {
        // Auto-save logic would go here
        console.log('Auto-saving game...');
      }, state.settings.autoSaveInterval * 60 * 1000); // Convert minutes to milliseconds

      return () => clearInterval(interval);
    }
  }, [state.settings.autoSave, state.settings.autoSaveInterval, state.player, state.currentSaveSlot]);

  // Helper functions
  const createPlayer = (name: string, playerClass: string) => {
    dispatch({ type: 'CREATE_PLAYER', payload: { name, class: playerClass } });
  };

  const updatePlayer = (updates: Partial<ReactPlayer>) => {
    dispatch({ type: 'UPDATE_PLAYER', payload: updates });
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

  const resetGame = () => {
    dispatch({ type: 'RESET_GAME' });
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
    resetGame,
    isPlayerCreated,
    canAccessArea,
    getInventoryByType,
    getPlayerLevel,
    getTotalPlaytime,
    getCurrentSessionTime,
  };

  return (
    <ReactGameContext.Provider value={contextValue}>
      {children}
    </ReactGameContext.Provider>
  );
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
    resetGame
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