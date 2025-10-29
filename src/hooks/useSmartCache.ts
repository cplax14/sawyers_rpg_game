/**
 * Smart Caching Hook for Item and Creature Data
 * Provides intelligent caching with TTL, LRU eviction, and invalidation strategies
 */

import { useRef, useCallback, useMemo, useEffect } from 'react';
import { LRUCache } from '../utils/performance';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  ttl: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // milliseconds
  cleanupInterval: number; // milliseconds
  enableStats: boolean;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  hitRate: number;
}

interface SmartCacheOptions {
  ttl?: number;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
}

export function useSmartCache<K, V>(config: Partial<CacheConfig> = {}) {
  const {
    maxSize = 500,
    defaultTTL = 5 * 60 * 1000, // 5 minutes
    cleanupInterval = 60 * 1000, // 1 minute
    enableStats = true,
  } = config;

  const cache = useRef(new Map<K, CacheEntry<V>>());
  const stats = useRef<CacheStats>({
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    hitRate: 0,
  });
  const tagMap = useRef(new Map<string, Set<K>>());
  const cleanupTimer = useRef<NodeJS.Timeout | null>(null);

  // Cleanup expired entries
  const cleanup = useCallback(() => {
    const now = Date.now();
    const entries = Array.from(cache.current.entries());

    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        cache.current.delete(key);
        if (enableStats) {
          stats.current.evictions++;
          stats.current.size--;
        }
      }
    }
  }, [enableStats]);

  // LRU eviction when cache is full
  const evictLRU = useCallback(() => {
    let oldestKey: K | null = null;
    let oldestTime = Date.now();
    let lowestAccess = Infinity;

    for (const [key, entry] of cache.current.entries()) {
      // Prefer items with lower access count and older timestamps
      const score = entry.accessCount + (Date.now() - entry.timestamp) / 1000;
      if (score < lowestAccess || entry.timestamp < oldestTime) {
        oldestKey = key;
        oldestTime = entry.timestamp;
        lowestAccess = score;
      }
    }

    if (oldestKey !== null) {
      cache.current.delete(oldestKey);
      if (enableStats) {
        stats.current.evictions++;
        stats.current.size--;
      }
    }
  }, [enableStats]);

  // Get item from cache
  const get = useCallback(
    (key: K): V | undefined => {
      const entry = cache.current.get(key);

      if (!entry) {
        if (enableStats) {
          stats.current.misses++;
        }
        return undefined;
      }

      const now = Date.now();

      // Check if expired
      if (now - entry.timestamp > entry.ttl) {
        cache.current.delete(key);
        if (enableStats) {
          stats.current.misses++;
          stats.current.size--;
        }
        return undefined;
      }

      // Update access statistics
      entry.accessCount++;
      entry.timestamp = now; // Update for LRU

      if (enableStats) {
        stats.current.hits++;
        const total = stats.current.hits + stats.current.misses;
        stats.current.hitRate = stats.current.hits / total;
      }

      return entry.data;
    },
    [enableStats]
  );

  // Set item in cache
  const set = useCallback(
    (key: K, value: V, options: SmartCacheOptions = {}) => {
      const { ttl = defaultTTL, tags = [] } = options;

      // Cleanup if at capacity
      if (cache.current.size >= maxSize) {
        evictLRU();
      }

      const entry: CacheEntry<V> = {
        data: value,
        timestamp: Date.now(),
        accessCount: 1,
        ttl,
      };

      cache.current.set(key, entry);

      // Update tag mappings
      for (const tag of tags) {
        if (!tagMap.current.has(tag)) {
          tagMap.current.set(tag, new Set());
        }
        tagMap.current.get(tag)!.add(key);
      }

      if (enableStats) {
        stats.current.size++;
      }
    },
    [defaultTTL, maxSize, evictLRU, enableStats]
  );

  // Delete item from cache
  const remove = useCallback(
    (key: K) => {
      const deleted = cache.current.delete(key);
      if (deleted && enableStats) {
        stats.current.size--;
      }
      return deleted;
    },
    [enableStats]
  );

  // Invalidate by tag
  const invalidateByTag = useCallback(
    (tag: string) => {
      const keys = tagMap.current.get(tag);
      if (keys) {
        for (const key of keys) {
          cache.current.delete(key);
          if (enableStats) {
            stats.current.size--;
          }
        }
        tagMap.current.delete(tag);
      }
    },
    [enableStats]
  );

  // Clear all cache
  const clear = useCallback(() => {
    cache.current.clear();
    tagMap.current.clear();
    if (enableStats) {
      stats.current.size = 0;
    }
  }, [enableStats]);

  // Get cache statistics
  const getStats = useCallback((): CacheStats => {
    return { ...stats.current };
  }, []);

  // Memoized cache operations
  const memoizedGet = useCallback(
    (key: K, fetcher: () => V | Promise<V>, options?: SmartCacheOptions) => {
      const cached = get(key);
      if (cached !== undefined) {
        return Promise.resolve(cached);
      }

      const result = fetcher();

      if (result instanceof Promise) {
        return result.then(data => {
          set(key, data, options);
          return data;
        });
      } else {
        set(key, result, options);
        return Promise.resolve(result);
      }
    },
    [get, set]
  );

  // Prefetch data
  const prefetch = useCallback(
    async (key: K, fetcher: () => V | Promise<V>, options?: SmartCacheOptions) => {
      // Only prefetch if not already cached
      if (get(key) === undefined) {
        try {
          const data = await fetcher();
          set(key, data, { ...options, priority: 'low' });
        } catch (error) {
          console.warn(`Prefetch failed for key ${String(key)}:`, error);
        }
      }
    },
    [get, set]
  );

  // Setup cleanup interval
  useEffect(() => {
    cleanupTimer.current = setInterval(cleanup, cleanupInterval);

    return () => {
      if (cleanupTimer.current) {
        clearInterval(cleanupTimer.current);
      }
    };
  }, [cleanup, cleanupInterval]);

  return {
    get,
    set,
    remove,
    clear,
    invalidateByTag,
    getStats,
    memoizedGet,
    prefetch,
    // Utility methods
    has: useCallback((key: K) => cache.current.has(key), []),
    size: useCallback(() => cache.current.size, []),
    keys: useCallback(() => Array.from(cache.current.keys()), []),
  };
}

/**
 * Specialized cache for inventory items
 */
export function useInventoryCache() {
  return useSmartCache<string, any>({
    maxSize: 1000,
    defaultTTL: 10 * 60 * 1000, // 10 minutes for items
    cleanupInterval: 2 * 60 * 1000, // 2 minutes
    enableStats: true,
  });
}

/**
 * Specialized cache for creature data
 */
export function useCreatureCache() {
  return useSmartCache<string, any>({
    maxSize: 800,
    defaultTTL: 15 * 60 * 1000, // 15 minutes for creatures
    cleanupInterval: 3 * 60 * 1000, // 3 minutes
    enableStats: true,
  });
}

/**
 * Specialized cache for computed stats and calculations
 */
export function useStatsCache() {
  return useSmartCache<string, any>({
    maxSize: 200,
    defaultTTL: 5 * 60 * 1000, // 5 minutes for stats
    cleanupInterval: 60 * 1000, // 1 minute
    enableStats: true,
  });
}
