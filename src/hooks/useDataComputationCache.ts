/**
 * Data Computation Cache Hook
 * Provides intelligent caching for expensive computations like filtering, sorting, and aggregations
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { useSmartCache } from './useSmartCache';
import { processBatch } from '../utils/performance';
import { EnhancedItem, ItemCategory } from '../types/inventory';
import { EnhancedCreature, CreatureType } from '../types/creatures';

interface ComputationResult<T> {
  data: T;
  computeTime: number;
  cacheHit: boolean;
  lastComputed: number;
}

interface FilterConfig {
  category?: ItemCategory | 'all';
  rarity?: string[];
  valueRange?: { min: number; max: number };
  search?: string;
  tags?: string[];
}

interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

export function useDataComputationCache() {
  const cache = useSmartCache<string, any>({
    maxSize: 1000,
    defaultTTL: 10 * 60 * 1000, // 10 minutes
    enableStats: true,
  });

  // Generic computation with caching
  const computeWithCache = useCallback(
    async <T>(
      cacheKey: string,
      computation: () => T | Promise<T>,
      dependencies: any[] = [],
      ttl?: number
    ): Promise<ComputationResult<T>> => {
      const depKey = `${cacheKey}-${JSON.stringify(dependencies)}`;
      const startTime = performance.now();

      // Check cache first
      const cached = cache.get(depKey);
      if (cached) {
        return {
          data: cached.data,
          computeTime: cached.computeTime,
          cacheHit: true,
          lastComputed: cached.lastComputed,
        };
      }

      // Perform computation
      const result = await computation();
      const computeTime = performance.now() - startTime;

      const computationResult = {
        data: result,
        computeTime,
        cacheHit: false,
        lastComputed: Date.now(),
      };

      // Cache the result
      cache.set(depKey, computationResult, {
        ttl,
        tags: [cacheKey],
        priority: computeTime > 100 ? 'low' : 'high',
      });

      return computationResult;
    },
    [cache]
  );

  return {
    computeWithCache,
    invalidate: cache.invalidateByTag,
    clear: cache.clear,
    getStats: cache.getStats,
  };
}

/**
 * Smart filtering for inventory items with caching
 */
export function useSmartItemFiltering(items: EnhancedItem[]) {
  const { computeWithCache, invalidate } = useDataComputationCache();

  const filterItems = useCallback(
    async (
      filters: FilterConfig,
      sort?: SortConfig
    ): Promise<ComputationResult<EnhancedItem[]>> => {
      const cacheKey = 'item-filtering';
      const dependencies = [filters, sort, items.length];

      return computeWithCache(
        cacheKey,
        async () => {
          let filtered = [...items];

          // Apply filters in batches for large datasets
          if (items.length > 1000) {
            const filterBatch = async (batch: EnhancedItem[]) => {
              return batch.filter(item => {
                // Category filter
                if (
                  filters.category &&
                  filters.category !== 'all' &&
                  item.category !== filters.category
                ) {
                  return false;
                }

                // Rarity filter
                if (
                  filters.rarity &&
                  filters.rarity.length > 0 &&
                  !filters.rarity.includes(item.rarity)
                ) {
                  return false;
                }

                // Value range filter
                if (filters.valueRange) {
                  if (
                    filters.valueRange.min &&
                    item.value < parseInt(filters.valueRange.min.toString())
                  ) {
                    return false;
                  }
                  if (
                    filters.valueRange.max &&
                    item.value > parseInt(filters.valueRange.max.toString())
                  ) {
                    return false;
                  }
                }

                // Search filter
                if (filters.search && filters.search.trim()) {
                  const searchTerm = filters.search.toLowerCase();
                  if (
                    !item.name.toLowerCase().includes(searchTerm) &&
                    !item.description?.toLowerCase().includes(searchTerm)
                  ) {
                    return false;
                  }
                }

                // Tags filter (using additional properties or item type checks)
                if (filters.tags && filters.tags.length > 0) {
                  // For now, we'll map common tags to item properties
                  const hasTag = filters.tags.some(tag => {
                    switch (tag) {
                      case 'usable':
                        return item.usable || item.itemType === 'consumable';
                      case 'stackable':
                        return item.stackable;
                      case 'equipment':
                        return item.category === 'equipment';
                      default:
                        return false;
                    }
                  });
                  if (!hasTag) {
                    return false;
                  }
                }

                return true;
              });
            };

            // Process in batches for better performance
            const batchResults: EnhancedItem[][] = [];
            for (let i = 0; i < filtered.length; i += 200) {
              const batch = filtered.slice(i, i + 200);
              const batchResult = await filterBatch(batch);
              batchResults.push(batchResult);
            }
            filtered = batchResults.flat();
          } else {
            // Direct filtering for smaller datasets
            filtered = items.filter(item => {
              if (
                filters.category &&
                filters.category !== 'all' &&
                item.category !== filters.category
              ) {
                return false;
              }
              if (
                filters.rarity &&
                filters.rarity.length > 0 &&
                !filters.rarity.includes(item.rarity)
              ) {
                return false;
              }
              if (filters.valueRange) {
                if (
                  filters.valueRange.min &&
                  item.value < parseInt(filters.valueRange.min.toString())
                ) {
                  return false;
                }
                if (
                  filters.valueRange.max &&
                  item.value > parseInt(filters.valueRange.max.toString())
                ) {
                  return false;
                }
              }
              if (filters.search && filters.search.trim()) {
                const searchTerm = filters.search.toLowerCase();
                if (
                  !item.name.toLowerCase().includes(searchTerm) &&
                  !item.description?.toLowerCase().includes(searchTerm)
                ) {
                  return false;
                }
              }
              if (filters.tags && filters.tags.length > 0) {
                // Similar tag mapping for direct filtering
                const hasTag = filters.tags.some(tag => {
                  switch (tag) {
                    case 'usable':
                      return item.usable || item.itemType === 'consumable';
                    case 'stackable':
                      return item.stackable;
                    case 'equipment':
                      return item.category === 'equipment';
                    default:
                      return false;
                  }
                });
                if (!hasTag) {
                  return false;
                }
              }
              return true;
            });
          }

          // Apply sorting
          if (sort) {
            filtered.sort((a, b) => {
              let aVal: any = a[sort.field as keyof EnhancedItem];
              let bVal: any = b[sort.field as keyof EnhancedItem];

              // Handle different data types
              if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
              }

              let comparison = 0;
              if (aVal < bVal) comparison = -1;
              if (aVal > bVal) comparison = 1;

              return sort.order === 'desc' ? -comparison : comparison;
            });
          }

          return filtered;
        },
        dependencies,
        5 * 60 * 1000 // 5 minute TTL
      );
    },
    [items, computeWithCache]
  );

  // Invalidate cache when items change significantly
  useEffect(() => {
    invalidate('item-filtering');
  }, [items.length, invalidate]);

  return { filterItems };
}

/**
 * Smart filtering for creatures with caching
 */
export function useSmartCreatureFiltering(creatures: EnhancedCreature[]) {
  const { computeWithCache, invalidate } = useDataComputationCache();

  const filterCreatures = useCallback(
    async (
      filters: {
        type?: CreatureType | 'all';
        rarity?: string[];
        levelRange?: { min: number; max: number };
        search?: string;
        status?: string[];
      },
      sort?: SortConfig
    ): Promise<ComputationResult<EnhancedCreature[]>> => {
      const cacheKey = 'creature-filtering';
      const dependencies = [filters, sort, creatures.length];

      return computeWithCache(
        cacheKey,
        async () => {
          let filtered = [...creatures];

          // Apply filters
          filtered = filtered.filter(creature => {
            // Type filter
            if (filters.type && filters.type !== 'all' && creature.creatureType !== filters.type) {
              return false;
            }

            // Rarity filter
            if (
              filters.rarity &&
              filters.rarity.length > 0 &&
              !filters.rarity.includes(creature.rarity)
            ) {
              return false;
            }

            // Level range filter
            if (filters.levelRange) {
              if (filters.levelRange.min && creature.level < filters.levelRange.min) {
                return false;
              }
              if (filters.levelRange.max && creature.level > filters.levelRange.max) {
                return false;
              }
            }

            // Search filter
            if (filters.search && filters.search.trim()) {
              const searchTerm = filters.search.toLowerCase();
              if (
                !creature.name.toLowerCase().includes(searchTerm) &&
                !creature.species.toLowerCase().includes(searchTerm)
              ) {
                return false;
              }
            }

            // Status filter
            if (filters.status && filters.status.length > 0) {
              if (!filters.status.includes(creature.collectionStatus as string)) {
                return false;
              }
            }

            return true;
          });

          // Apply sorting
          if (sort) {
            filtered.sort((a, b) => {
              let aVal: any = a[sort.field as keyof EnhancedCreature];
              let bVal: any = b[sort.field as keyof EnhancedCreature];

              if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
              }

              let comparison = 0;
              if (aVal < bVal) comparison = -1;
              if (aVal > bVal) comparison = 1;

              return sort.order === 'desc' ? -comparison : comparison;
            });
          }

          return filtered;
        },
        dependencies
      );
    },
    [creatures, computeWithCache]
  );

  useEffect(() => {
    invalidate('creature-filtering');
  }, [creatures.length, invalidate]);

  return { filterCreatures };
}

/**
 * Smart aggregation computations with caching
 */
export function useSmartAggregations() {
  const { computeWithCache } = useDataComputationCache();

  const computeItemStats = useCallback(
    async (items: EnhancedItem[]) => {
      return computeWithCache(
        'item-stats',
        () => {
          const stats = {
            totalValue: 0,
            categoryDistribution: {} as Record<string, number>,
            rarityDistribution: {} as Record<string, number>,
            averageValue: 0,
            totalQuantity: 0,
          };

          for (const item of items) {
            const quantity = item.quantity || 1;
            stats.totalValue += item.value * quantity;
            stats.totalQuantity += quantity;

            // Category distribution
            stats.categoryDistribution[item.category] =
              (stats.categoryDistribution[item.category] || 0) + quantity;

            // Rarity distribution
            stats.rarityDistribution[item.rarity] =
              (stats.rarityDistribution[item.rarity] || 0) + quantity;
          }

          stats.averageValue = stats.totalQuantity > 0 ? stats.totalValue / stats.totalQuantity : 0;

          return stats;
        },
        [items.length, items.reduce((sum, item) => sum + (item.quantity || 1), 0)]
      );
    },
    [computeWithCache]
  );

  const computeCreatureStats = useCallback(
    async (creatures: EnhancedCreature[]) => {
      return computeWithCache(
        'creature-stats',
        () => {
          const stats = {
            totalCreatures: creatures.length,
            averageLevel: 0,
            typeDistribution: {} as Record<string, number>,
            rarityDistribution: {} as Record<string, number>,
            statusDistribution: {} as Record<string, number>,
            totalCombatPower: 0,
            averageCombatPower: 0,
          };

          let totalLevel = 0;
          let totalPower = 0;

          for (const creature of creatures) {
            totalLevel += creature.level;

            // Combat power calculation (using available stats)
            const power =
              creature.stats.attack +
              creature.stats.defense +
              (creature.stats.health || creature.stats.hp || 0) +
              (creature.stats.speed || 0);
            totalPower += power;

            // Type distribution
            stats.typeDistribution[creature.creatureType] =
              (stats.typeDistribution[creature.creatureType] || 0) + 1;

            // Rarity distribution
            stats.rarityDistribution[creature.rarity] =
              (stats.rarityDistribution[creature.rarity] || 0) + 1;

            // Status distribution
            const statusKey = creature.collectionStatus as string;
            stats.statusDistribution[statusKey] = (stats.statusDistribution[statusKey] || 0) + 1;
          }

          stats.averageLevel = creatures.length > 0 ? totalLevel / creatures.length : 0;
          stats.totalCombatPower = totalPower;
          stats.averageCombatPower = creatures.length > 0 ? totalPower / creatures.length : 0;

          return stats;
        },
        [creatures.length, creatures.reduce((sum, c) => sum + c.level, 0)]
      );
    },
    [computeWithCache]
  );

  return {
    computeItemStats,
    computeCreatureStats,
  };
}
