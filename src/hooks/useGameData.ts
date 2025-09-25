import { useEffect, useState, useCallback } from 'react';
import {
  ReactArea,
  ReactCharacterClass,
  ReactItem,
  ReactMonster
} from '../types/game';
import { gameDataLoader, LoadedGameData } from '../utils/dataLoader';

/**
 * Custom hooks for accessing transformed game data
 * Provides reactive data loading with caching and error handling
 */

export interface UseGameDataResult {
  data: LoadedGameData | null;
  isLoading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * Main hook for loading all game data
 */
export const useGameData = (): UseGameDataResult => {
  const [data, setData] = useState<LoadedGameData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const gameData = await gameDataLoader.loadGameData();

      if (gameData.errors.length > 0) {
        console.warn('Game data loaded with errors:', gameData.errors);
        setError(`Data loaded with ${gameData.errors.length} errors. Check console for details.`);
      }

      if (gameData.warnings.length > 0) {
        console.info('Game data warnings:', gameData.warnings);
      }

      setData(gameData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load game data';
      setError(errorMessage);
      console.error('Failed to load game data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, isLoading, error, reload };
};

/**
 * Hook for accessing areas data with filtering capabilities
 */
export const useAreas = () => {
  const { data, isLoading, error } = useGameData();

  // Debug logging for areas hook
  console.log('🔍 useAreas Debug:', {
    hasData: !!data,
    areasCount: data?.areas?.length || 0,
    isLoading,
    error,
    firstArea: data?.areas?.[0]?.name || 'None'
  });

  const getAreaById = useCallback((id: string): ReactArea | undefined => {
    return data?.areas.find(area => area.id === id);
  }, [data]);

  const getAreasByType = useCallback((type: string): ReactArea[] => {
    return data?.areas.filter(area => area.type === type) || [];
  }, [data]);

  const getUnlockedAreas = useCallback((unlockedAreaIds: string[]): ReactArea[] => {
    return data?.areas.filter(area =>
      area.unlocked || unlockedAreaIds.includes(area.id)
    ) || [];
  }, [data]);

  const getConnectedAreas = useCallback((areaId: string): ReactArea[] => {
    const area = getAreaById(areaId);
    if (!area) return [];

    return area.connections
      .map(connectionId => getAreaById(connectionId))
      .filter(Boolean) as ReactArea[];
  }, [data, getAreaById]);

  return {
    areas: data?.areas || [],
    isLoading,
    error,
    getAreaById,
    getAreasByType,
    getUnlockedAreas,
    getConnectedAreas
  };
};

/**
 * Hook for accessing character class data
 */
export const useCharacterClasses = () => {
  const { data, isLoading, error } = useGameData();

  const getCharacterClassById = useCallback((id: string): ReactCharacterClass | undefined => {
    return data?.characterClasses.find(cls => cls.id === id);
  }, [data]);

  const getClassesByWeaponType = useCallback((weaponType: string): ReactCharacterClass[] => {
    return data?.characterClasses.filter(cls =>
      cls.weaponTypes.includes(weaponType)
    ) || [];
  }, [data]);

  return {
    characterClasses: data?.characterClasses || [],
    isLoading,
    error,
    getCharacterClassById,
    getClassesByWeaponType
  };
};

/**
 * Hook for accessing items data with filtering and search
 */
export const useItems = () => {
  const { data, isLoading, error } = useGameData();

  const getItemById = useCallback((id: string): ReactItem | undefined => {
    return data?.items.find(item => item.id === id);
  }, [data]);

  const getItemsByType = useCallback((type: string): ReactItem[] => {
    return data?.items.filter(item => item.type === type) || [];
  }, [data]);

  const getItemsByRarity = useCallback((rarity: string): ReactItem[] => {
    return data?.items.filter(item => item.rarity === rarity) || [];
  }, [data]);

  const getEquippableItems = useCallback((characterClass: string): ReactItem[] => {
    return data?.items.filter(item =>
      item.requirements?.classes?.includes(characterClass) ||
      !item.requirements?.classes?.length
    ) || [];
  }, [data]);

  const searchItems = useCallback((query: string): ReactItem[] => {
    if (!query || !data?.items) return [];

    const lowercaseQuery = query.toLowerCase();
    return data.items.filter(item =>
      item.name.toLowerCase().includes(lowercaseQuery) ||
      item.description.toLowerCase().includes(lowercaseQuery)
    );
  }, [data]);

  return {
    items: data?.items || [],
    isLoading,
    error,
    getItemById,
    getItemsByType,
    getItemsByRarity,
    getEquippableItems,
    searchItems
  };
};

/**
 * Hook for accessing monster data with species information
 */
export const useMonsters = () => {
  const { data, isLoading, error } = useGameData();

  const getMonsterBySpecies = useCallback((species: string): ReactMonster | undefined => {
    return data?.monsters.find(monster => monster.species === species);
  }, [data]);

  const getMonstersByType = useCallback((type: string): ReactMonster[] => {
    return data?.monsters.filter(monster =>
      monster.types.includes(type as any)
    ) || [];
  }, [data]);

  const getMonstersByArea = useCallback((areaId: string): ReactMonster[] => {
    return data?.monsters.filter(monster =>
      monster.areas.includes(areaId)
    ) || [];
  }, [data]);

  const getEvolutionChain = useCallback((species: string): ReactMonster[] => {
    const monster = getMonsterBySpecies(species);
    if (!monster || !monster.evolvesTo.length) return [monster].filter(Boolean) as ReactMonster[];

    const chain: ReactMonster[] = [monster];

    // Get evolution targets
    monster.evolvesTo.forEach(evolutionSpecies => {
      const evolution = getMonsterBySpecies(evolutionSpecies);
      if (evolution) {
        chain.push(evolution);
        // Could recursively get further evolutions here
      }
    });

    return chain;
  }, [data, getMonsterBySpecies]);

  const createMonsterInstance = useCallback((
    species: string,
    level: number = 1,
    isWild: boolean = true
  ): ReactMonster | null => {
    const baseMonster = getMonsterBySpecies(species);
    if (!baseMonster) return null;

    // Calculate level-scaled stats
    const levelMultiplier = level / 1; // Base level scaling
    const scaledStats = {
      hp: Math.floor(baseMonster.baseStats.hp * levelMultiplier),
      mp: Math.floor(baseMonster.baseStats.mp * levelMultiplier),
      attack: Math.floor(baseMonster.baseStats.attack * levelMultiplier),
      defense: Math.floor(baseMonster.baseStats.defense * levelMultiplier),
      magicAttack: Math.floor(baseMonster.baseStats.magicAttack * levelMultiplier),
      magicDefense: Math.floor(baseMonster.baseStats.magicDefense * levelMultiplier),
      speed: Math.floor(baseMonster.baseStats.speed * levelMultiplier),
      accuracy: Math.min(100, Math.floor(baseMonster.baseStats.accuracy * Math.sqrt(levelMultiplier)))
    };

    return {
      ...baseMonster,
      level,
      currentStats: scaledStats,
      isWild,
      experience: 0,
      friendship: isWild ? 0 : 50
    };
  }, [getMonsterBySpecies]);

  return {
    monsters: data?.monsters || [],
    isLoading,
    error,
    getMonsterBySpecies,
    getMonstersByType,
    getMonstersByArea,
    getEvolutionChain,
    createMonsterInstance
  };
};

/**
 * Hook for data preloading and caching strategies
 */
export const useDataPreloader = () => {
  const [preloadStatus, setPreloadStatus] = useState<{
    areas: boolean;
    characters: boolean;
    items: boolean;
    monsters: boolean;
  }>({
    areas: false,
    characters: false,
    items: false,
    monsters: false
  });

  const preloadCriticalData = useCallback(async () => {
    try {
      // Preload character classes first (needed for character creation)
      const data = await gameDataLoader.loadGameData();

      setPreloadStatus({
        areas: data.areas.length > 0,
        characters: data.characterClasses.length > 0,
        items: data.items.length > 0,
        monsters: data.monsters.length > 0
      });

      return data;
    } catch (error) {
      console.error('Failed to preload critical data:', error);
      return null;
    }
  }, []);

  const isDataReady = useCallback((): boolean => {
    return Object.values(preloadStatus).every(status => status);
  }, [preloadStatus]);

  return {
    preloadStatus,
    preloadCriticalData,
    isDataReady
  };
};