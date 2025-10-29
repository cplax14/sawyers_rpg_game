/**
 * Performance Optimization Utilities
 * Provides memoization, debouncing, and other performance optimizations
 * for the React game state management system
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
// Type imports (fallback interfaces since we may not have all React types)
interface ReactArea {
  id: string;
  type: string;
  connections: string[];
  unlocked: boolean;
}

interface ReactMonster {
  id: string;
  species: string;
  level: number;
  types: string[];
  rarity: string;
}

interface ReactItem {
  id: string;
  type: string;
  value: number;
  quantity?: number;
  consumable?: boolean;
}

/**
 * Debounce utility for expensive operations
 */
export const useDebounce = <T extends (...args: any[]) => any>(callback: T, delay: number): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;
};

/**
 * Throttle utility for frequent operations
 */
export const useThrottle = <T extends (...args: any[]) => any>(callback: T, delay: number): T => {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        return callbackRef.current(...args);
      }
    },
    [delay]
  ) as T;
};

/**
 * Memoized area filtering for performance
 */
export const useAreaFilters = (areas: ReactArea[]) => {
  const areasByType = useMemo(() => {
    const typeMap = new Map<string, ReactArea[]>();

    for (const area of areas) {
      if (!typeMap.has(area.type)) {
        typeMap.set(area.type, []);
      }
      typeMap.get(area.type)!.push(area);
    }

    return typeMap;
  }, [areas]);

  const areasByConnection = useMemo(() => {
    const connectionMap = new Map<string, ReactArea[]>();

    for (const area of areas) {
      for (const connection of area.connections) {
        if (!connectionMap.has(connection)) {
          connectionMap.set(connection, []);
        }
        connectionMap.get(connection)!.push(area);
      }
    }

    return connectionMap;
  }, [areas]);

  const unlockedAreas = useMemo(() => {
    return areas.filter(area => area.unlocked);
  }, [areas]);

  const dungeonAreas = useMemo(() => {
    return areas.filter(area => area.type === 'dungeon');
  }, [areas]);

  return {
    areasByType,
    areasByConnection,
    unlockedAreas,
    dungeonAreas,
  };
};

/**
 * Memoized monster calculations
 */
export const useMonsterCalculations = (monsters: ReactMonster[]) => {
  const monstersBySpecies = useMemo(() => {
    const speciesMap = new Map<string, ReactMonster[]>();

    for (const monster of monsters) {
      if (!speciesMap.has(monster.species)) {
        speciesMap.set(monster.species, []);
      }
      speciesMap.get(monster.species)!.push(monster);
    }

    return speciesMap;
  }, [monsters]);

  const averageLevel = useMemo(() => {
    if (monsters.length === 0) return 0;

    const totalLevel = monsters.reduce((sum, monster) => sum + monster.level, 0);
    return Math.floor(totalLevel / monsters.length);
  }, [monsters]);

  const typeDistribution = useMemo(() => {
    const distribution = new Map<string, number>();

    for (const monster of monsters) {
      for (const type of monster.types) {
        distribution.set(type, (distribution.get(type) || 0) + 1);
      }
    }

    return distribution;
  }, [monsters]);

  const rarityCount = useMemo(() => {
    const rarity = new Map<string, number>();

    for (const monster of monsters) {
      rarity.set(monster.rarity, (rarity.get(monster.rarity) || 0) + 1);
    }

    return rarity;
  }, [monsters]);

  return {
    monstersBySpecies,
    averageLevel,
    typeDistribution,
    rarityCount,
  };
};

/**
 * Memoized item calculations
 */
export const useItemCalculations = (items: ReactItem[]) => {
  const itemsByType = useMemo(() => {
    const typeMap = new Map<string, ReactItem[]>();

    for (const item of items) {
      if (!typeMap.has(item.type)) {
        typeMap.set(item.type, []);
      }
      typeMap.get(item.type)!.push(item);
    }

    return typeMap;
  }, [items]);

  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + item.value * (item.quantity || 1);
    }, 0);
  }, [items]);

  const equipableItems = useMemo(() => {
    return items.filter(item => item.type === 'weapon' || item.type === 'armor');
  }, [items]);

  const consumableItems = useMemo(() => {
    return items.filter(item => item.consumable);
  }, [items]);

  return {
    itemsByType,
    totalValue,
    equipableItems,
    consumableItems,
  };
};

/**
 * Memoized search utility
 */
export const useSearch = <T>(
  items: T[],
  searchFields: (keyof T)[],
  searchTerm: string,
  delay: number = 300
) => {
  const debouncedSearch = useDebounce((term: string) => term, delay);
  const debouncedTerm = debouncedSearch(searchTerm);

  const filteredItems = useMemo(() => {
    if (!debouncedTerm.trim()) return items;

    const lowercaseTerm = debouncedTerm.toLowerCase();

    return items.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowercaseTerm);
        }
        if (Array.isArray(value)) {
          return value.some(v => typeof v === 'string' && v.toLowerCase().includes(lowercaseTerm));
        }
        return false;
      })
    );
  }, [items, searchFields, debouncedTerm]);

  return filteredItems;
};

/**
 * Cache utility for expensive computations
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache: Map<K, V>;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      const value = this.cache.get(key)!;
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Hook for using LRU cache
 */
export const useCache = <K, V>(maxSize: number = 100) => {
  const cache = useRef(new LRUCache<K, V>(maxSize));

  const get = useCallback((key: K): V | undefined => {
    return cache.current.get(key);
  }, []);

  const set = useCallback((key: K, value: V): void => {
    cache.current.set(key, value);
  }, []);

  const clear = useCallback((): void => {
    cache.current.clear();
  }, []);

  return { get, set, clear };
};

/**
 * Performance monitoring utility
 */
export const usePerformanceMonitor = (name: string) => {
  const startTime = useRef<number>(0);

  const start = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = useCallback(() => {
    const duration = performance.now() - startTime.current;
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return duration;
  }, [name]);

  const measure = useCallback(
    <T>(fn: () => T): T => {
      start();
      const result = fn();
      end();
      return result;
    },
    [start, end]
  );

  return { start, end, measure };
};

/**
 * Batch processing utility for large datasets
 */
export const processBatch = async <T, R>(
  items: T[],
  processor: (item: T) => R | Promise<R>,
  batchSize: number = 50,
  onProgress?: (processed: number, total: number) => void
): Promise<R[]> => {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length);
    }

    // Allow other tasks to run
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
};
