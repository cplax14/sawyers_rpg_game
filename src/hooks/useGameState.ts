import { useContext, useCallback, useMemo } from 'react';
import { ReactGameContext, ReactGameState, GameAction } from '../contexts/ReactGameContext';
import {
  ReactPlayer,
  ReactArea,
  ReactMonster,
  ReactItem,
  GameSettings
} from '../types/game';

/**
 * Custom hooks for managing game state
 * Provides typed access to game context with helper functions
 */

/**
 * Main hook for accessing game state and dispatch
 */
export const useGameState = () => {
  const context = useContext(ReactGameContext);

  if (!context) {
    throw new Error('useGameState must be used within a ReactGameProvider');
  }

  return context;
};

/**
 * Hook for player-specific state and actions
 */
export const usePlayer = () => {
  const { state, dispatch } = useGameState();

  const createPlayer = useCallback((
    name: string,
    characterClassId: string
  ) => {
    dispatch({
      type: 'CREATE_PLAYER',
      payload: { name, class: characterClassId }
    });
  }, [dispatch]);

  const updatePlayerStats = useCallback((stats: Partial<ReactPlayer['baseStats']>) => {
    if (!state.player) return;

    dispatch({
      type: 'UPDATE_PLAYER_STATS',
      payload: { playerId: state.player.id, stats }
    });
  }, [dispatch, state.player]);

  const levelUpPlayer = useCallback(() => {
    if (!state.player) return;

    dispatch({
      type: 'LEVEL_UP_PLAYER',
      payload: { playerId: state.player.id }
    });
  }, [dispatch, state.player]);

  const addExperience = useCallback((experience: number) => {
    if (!state.player) return;

    dispatch({
      type: 'ADD_EXPERIENCE',
      payload: { playerId: state.player.id, experience }
    });
  }, [dispatch, state.player]);

  const addGold = useCallback((gold: number) => {
    if (!state.player) return;

    dispatch({
      type: 'ADD_GOLD',
      payload: { playerId: state.player.id, gold }
    });
  }, [dispatch, state.player]);

  // Player computed values
  const playerLevel = useMemo(() => {
    return state.player?.level || 1;
  }, [state.player]);

  const playerGold = useMemo(() => {
    return state.player?.gold || 0;
  }, [state.player]);

  const experienceToNextLevel = useMemo(() => {
    if (!state.player) return 0;

    const currentLevel = state.player.level;
    const experienceForNext = currentLevel * 100; // Simple formula
    return Math.max(0, experienceForNext - state.player.experience);
  }, [state.player]);

  const isPlayerAlive = useMemo(() => {
    return state.player ? state.player.hp > 0 : false;
  }, [state.player]);

  return {
    player: state.player,
    createPlayer,
    updatePlayerStats,
    levelUpPlayer,
    addExperience,
    addGold,
    playerLevel,
    playerGold,
    experienceToNextLevel,
    isPlayerAlive
  };
};

/**
 * Hook for area and world state management
 */
export const useWorld = () => {
  const { state, dispatch } = useGameState();

  const changeArea = useCallback((areaId: string) => {
    dispatch({
      type: 'CHANGE_AREA',
      payload: { areaId }
    });
  }, [dispatch]);

  const unlockArea = useCallback((areaId: string) => {
    dispatch({
      type: 'UNLOCK_AREA',
      payload: { areaId }
    });
  }, [dispatch]);

  const setStoryFlag = useCallback((flag: string, value: boolean = true) => {
    dispatch({
      type: 'SET_STORY_FLAG',
      payload: { flag, value }
    });
  }, [dispatch]);

  const completeQuest = useCallback((questId: string) => {
    dispatch({
      type: 'COMPLETE_QUEST',
      payload: { questId }
    });
  }, [dispatch]);

  // World computed values
  const currentAreaId = useMemo(() => {
    return state.currentArea;
  }, [state.currentArea]);

  const unlockedAreas = useMemo(() => {
    return state.unlockedAreas;
  }, [state.unlockedAreas]);

  const completedQuests = useMemo(() => {
    return state.completedQuests;
  }, [state.completedQuests]);

  const storyFlags = useMemo(() => {
    return state.storyFlags;
  }, [state.storyFlags]);

  const hasStoryFlag = useCallback((flag: string): boolean => {
    return state.storyFlags[flag] === true;
  }, [state.storyFlags]);

  const isAreaUnlocked = useCallback((areaId: string): boolean => {
    // Check React state first
    if (state.unlockedAreas.includes(areaId)) {
      return true;
    }

    // Check legacy AreaData system with current state
    if (typeof window !== 'undefined' && (window as any).AreaData) {
      const AreaData = (window as any).AreaData;
      const storyProgress = Object.keys(state.storyFlags).filter(flag => state.storyFlags[flag]);
      const playerLevel = state.player?.level || 1;
      const inventory: string[] = []; // TODO: Extract item IDs from inventory
      const playerClass = state.player?.class || null;
      const defeatedBosses: string[] = []; // TODO: Track defeated bosses

      return AreaData.isAreaUnlocked(areaId, storyProgress, playerLevel, inventory, playerClass, defeatedBosses);
    }

    return false;
  }, [state.unlockedAreas, state.storyFlags, state.player]);

  const isQuestCompleted = useCallback((questId: string): boolean => {
    return state.completedQuests.includes(questId);
  }, [state.completedQuests]);

  return {
    currentAreaId,
    unlockedAreas,
    completedQuests,
    storyFlags,
    changeArea,
    unlockArea,
    setStoryFlag,
    completeQuest,
    hasStoryFlag,
    isAreaUnlocked,
    isQuestCompleted
  };
};

/**
 * Hook for inventory management
 */
export const useInventory = () => {
  const { state, dispatch } = useGameState();

  const addItem = useCallback((item: ReactItem, quantity: number = 1) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: { item, quantity }
    });
  }, [dispatch]);

  const removeItem = useCallback((itemId: string, quantity: number = 1) => {
    dispatch({
      type: 'REMOVE_ITEM',
      payload: { itemId, quantity }
    });
  }, [dispatch]);

  const useItem = useCallback((itemId: string) => {
    dispatch({
      type: 'USE_ITEM',
      payload: { itemId }
    });
  }, [dispatch]);

  const equipItem = useCallback((itemId: string) => {
    if (!state.player) return;

    dispatch({
      type: 'EQUIP_ITEM',
      payload: { playerId: state.player.id, itemId }
    });
  }, [dispatch, state.player]);

  // Inventory computed values
  const inventory = useMemo(() => {
    return state.inventory;
  }, [state.inventory]);

  const getItemCount = useCallback((itemId: string): number => {
    const inventoryItem = state.inventory.find(item => item.id === itemId);
    return inventoryItem?.quantity || 0;
  }, [state.inventory]);

  const hasItem = useCallback((itemId: string, minQuantity: number = 1): boolean => {
    return getItemCount(itemId) >= minQuantity;
  }, [getItemCount]);

  const getItemsByType = useCallback((type: string): ReactItem[] => {
    return state.inventory
      .filter(item => item.type === type)
      .map(item => ({ ...item, quantity: item.quantity || 1 }));
  }, [state.inventory]);

  const inventoryValue = useMemo(() => {
    return state.inventory.reduce((total, item) => {
      return total + (item.value * (item.quantity || 1));
    }, 0);
  }, [state.inventory]);

  return {
    inventory,
    addItem,
    removeItem,
    useItem,
    equipItem,
    getItemCount,
    hasItem,
    getItemsByType,
    inventoryValue
  };
};

/**
 * Hook for monster collection and management
 */
export const useMonsters = () => {
  const { state, dispatch } = useGameState();

  const captureMonster = useCallback((monster: ReactMonster) => {
    dispatch({
      type: 'CAPTURE_MONSTER',
      payload: { monster }
    });
  }, [dispatch]);

  const releaseMonster = useCallback((monsterId: string) => {
    dispatch({
      type: 'RELEASE_MONSTER',
      payload: { monsterId }
    });
  }, [dispatch]);

  const updateMonster = useCallback((monsterId: string, updates: Partial<ReactMonster>) => {
    dispatch({
      type: 'UPDATE_MONSTER',
      payload: { monsterId, updates }
    });
  }, [dispatch]);

  const renameMonster = useCallback((monsterId: string, nickname: string) => {
    dispatch({
      type: 'RENAME_MONSTER',
      payload: { monsterId, nickname }
    });
  }, [dispatch]);

  // Monster computed values
  const capturedMonsters = useMemo(() => {
    return state.capturedMonsters;
  }, [state.capturedMonsters]);

  const getMonsterById = useCallback((monsterId: string): ReactMonster | undefined => {
    return state.capturedMonsters.find(monster => monster.id === monsterId);
  }, [state.capturedMonsters]);

  const getMonstersBySpecies = useCallback((species: string): ReactMonster[] => {
    return state.capturedMonsters.filter(monster => monster.species === species);
  }, [state.capturedMonsters]);

  const monsterCount = useMemo(() => {
    return state.capturedMonsters.length;
  }, [state.capturedMonsters]);

  const averageMonsterLevel = useMemo(() => {
    if (state.capturedMonsters.length === 0) return 0;

    const totalLevel = state.capturedMonsters.reduce((sum, monster) => sum + monster.level, 0);
    return Math.floor(totalLevel / state.capturedMonsters.length);
  }, [state.capturedMonsters]);

  return {
    capturedMonsters,
    captureMonster,
    releaseMonster,
    updateMonster,
    renameMonster,
    getMonsterById,
    getMonstersBySpecies,
    monsterCount,
    averageMonsterLevel
  };
};

/**
 * Hook for UI state management
 */
export const useUI = () => {
  const { state, dispatch } = useGameState();

  const navigateToScreen = useCallback((screen: ReactGameState['currentScreen']) => {
    dispatch({
      type: 'SET_CURRENT_SCREEN',
      payload: screen
    });
  }, [dispatch]);

  const setLoading = useCallback((isLoading: boolean) => {
    dispatch({
      type: 'SET_LOADING',
      payload: { isLoading }
    });
  }, [dispatch]);

  const setError = useCallback((error: string | null) => {
    dispatch({
      type: 'SET_ERROR',
      payload: { error }
    });
  }, [dispatch]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // UI computed values
  const currentScreen = useMemo(() => {
    return state.currentScreen;
  }, [state.currentScreen]);

  const isLoading = useMemo(() => {
    return state.isLoading;
  }, [state.isLoading]);

  const error = useMemo(() => {
    return state.error;
  }, [state.error]);

  const hasError = useMemo(() => {
    return state.error !== null;
  }, [state.error]);

  return {
    currentScreen,
    isLoading,
    error,
    hasError,
    navigateToScreen,
    setLoading,
    setError,
    clearError
  };
};

/**
 * Hook for settings management
 */
export const useSettings = () => {
  const { state, dispatch } = useGameState();

  const updateSettings = useCallback((settings: Partial<GameSettings>) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { settings }
    });
  }, [dispatch]);

  const resetSettings = useCallback(() => {
    dispatch({
      type: 'RESET_SETTINGS'
    });
  }, [dispatch]);

  // Settings computed values
  const settings = useMemo(() => {
    return state.settings;
  }, [state.settings]);

  return {
    settings,
    updateSettings,
    resetSettings
  };
};

/**
 * Hook for combat management
 */
export const useCombat = () => {
  const { state, dispatch } = useGameState();

  const startCombat = useCallback((species: string, level: number) => {
    dispatch({
      type: 'START_COMBAT',
      payload: { species, level }
    });
  }, [dispatch]);

  const endCombat = useCallback(() => {
    dispatch({
      type: 'END_COMBAT'
    });
  }, [dispatch]);

  // Combat computed values
  const currentEncounter = useMemo(() => {
    return state.currentEncounter;
  }, [state.currentEncounter]);

  const isInCombat = useMemo(() => {
    return state.currentEncounter !== null;
  }, [state.currentEncounter]);

  return {
    currentEncounter,
    isInCombat,
    startCombat,
    endCombat
  };
};

/**
 * Hook for save/load game state
 */
export const useSaveLoad = () => {
  const { state, dispatch } = useGameState();

  const saveGame = useCallback((slotIndex: number, saveName?: string) => {
    dispatch({
      type: 'SAVE_GAME',
      payload: {
        slotIndex,
        saveName: saveName || `Save ${slotIndex + 1}`,
        timestamp: Date.now()
      }
    });
  }, [dispatch]);

  const loadGame = useCallback((slotIndex: number) => {
    dispatch({
      type: 'LOAD_GAME',
      payload: { slotIndex }
    });
  }, [dispatch]);

  const deleteSave = useCallback((slotIndex: number) => {
    dispatch({
      type: 'DELETE_SAVE',
      payload: { slotIndex }
    });
  }, [dispatch]);

  // Save/Load computed values
  const saveSlots = useMemo(() => {
    return state.saveSlots;
  }, [state.saveSlots]);

  const currentSaveSlot = useMemo(() => {
    return state.currentSaveSlot;
  }, [state.currentSaveSlot]);

  const hasAnySaves = useMemo(() => {
    return state.saveSlots.some(slot => slot.data !== null);
  }, [state.saveSlots]);

  return {
    saveSlots,
    currentSaveSlot,
    hasAnySaves,
    saveGame,
    loadGame,
    deleteSave
  };
};