/**
 * Performance Optimizations Test Suite
 * Tests smart caching, optimized rendering, and data computation caching
 */

import { renderHook, act } from '@testing-library/react';
import { useSmartCache, useInventoryCache, useCreatureCache } from '../../hooks/useSmartCache';
import { useDataComputationCache, useSmartItemFiltering, useSmartAggregations } from '../../hooks/useDataComputationCache';
import { EnhancedItem } from '../../types/inventory';
import { EnhancedCreature } from '../../types/creatures';

// Mock performance API
Object.defineProperty(global.performance, 'now', {
  writable: true,
  value: jest.fn(() => Date.now())
});

describe('Performance Optimizations', () => {
  describe('Smart Cache', () => {
    it('should cache and retrieve values correctly', () => {
      const { result } = renderHook(() => useSmartCache<string, string>());

      act(() => {
        result.current.set('key1', 'value1');
      });

      expect(result.current.get('key1')).toBe('value1');
      expect(result.current.has('key1')).toBe(true);
      expect(result.current.size()).toBe(1);
    });

    it('should handle TTL expiration', async () => {
      const { result } = renderHook(() => useSmartCache<string, string>({
        maxSize: 10,
        defaultTTL: 100 // 100ms
      }));

      act(() => {
        result.current.set('key1', 'value1');
      });

      expect(result.current.get('key1')).toBe('value1');

      // Wait for TTL expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(result.current.get('key1')).toBeUndefined();
    });

    it('should invalidate by tag', () => {
      const { result } = renderHook(() => useSmartCache<string, string>());

      act(() => {
        result.current.set('key1', 'value1', { tags: ['group1'] });
        result.current.set('key2', 'value2', { tags: ['group1'] });
        result.current.set('key3', 'value3', { tags: ['group2'] });
      });

      act(() => {
        result.current.invalidateByTag('group1');
      });

      expect(result.current.get('key1')).toBeUndefined();
      expect(result.current.get('key2')).toBeUndefined();
      expect(result.current.get('key3')).toBe('value3');
    });

    it('should provide correct cache statistics', () => {
      const { result } = renderHook(() => useSmartCache<string, string>());

      // Set some values
      act(() => {
        result.current.set('key1', 'value1');
        result.current.set('key2', 'value2');
      });

      // Generate hits and misses
      result.current.get('key1'); // hit
      result.current.get('key1'); // hit
      result.current.get('nonexistent'); // miss

      const stats = result.current.getStats();
      expect(stats.hits).toBeGreaterThanOrEqual(2);
      expect(stats.misses).toBeGreaterThanOrEqual(1);
      expect(stats.hitRate).toBeGreaterThan(0); // Just ensure it's calculated
    });
  });

  describe('Specialized Caches', () => {
    it('should create inventory cache with appropriate settings', () => {
      const { result } = renderHook(() => useInventoryCache());

      act(() => {
        result.current.set('item1', { id: 'item1', name: 'Sword' });
      });

      expect(result.current.get('item1')).toEqual({ id: 'item1', name: 'Sword' });
    });

    it('should create creature cache with appropriate settings', () => {
      const { result } = renderHook(() => useCreatureCache());

      act(() => {
        result.current.set('creature1', { id: 'creature1', name: 'Dragon' });
      });

      expect(result.current.get('creature1')).toEqual({ id: 'creature1', name: 'Dragon' });
    });
  });

  describe('Data Computation Cache', () => {
    const mockItems: EnhancedItem[] = [
      {
        id: 'item1',
        name: 'Health Potion',
        category: 'consumables',
        itemType: 'consumable',
        rarity: 'common',
        quantity: 5,
        value: 50,
        stackable: true,
        usable: true,
        description: 'Restores health'
      },
      {
        id: 'item2',
        name: 'Steel Sword',
        category: 'equipment',
        itemType: 'weapon',
        rarity: 'uncommon',
        quantity: 1,
        value: 200,
        stackable: false,
        usable: false,
        description: 'A sharp blade'
      }
    ];

    it('should cache computation results', async () => {
      const { result } = renderHook(() => useDataComputationCache());

      let computationCount = 0;
      const computation = () => {
        computationCount++;
        return mockItems.filter(item => item.rarity === 'common');
      };

      // First call should compute
      const result1 = await result.current.computeWithCache('test-key', computation, ['common']);
      expect(result1.cacheHit).toBe(false);
      expect(computationCount).toBe(1);

      // Second call should use cache
      const result2 = await result.current.computeWithCache('test-key', computation, ['common']);
      expect(result2.cacheHit).toBe(true);
      expect(computationCount).toBe(1); // Should not increment
    });

    it('should handle different dependencies correctly', async () => {
      const { result } = renderHook(() => useDataComputationCache());

      let computationCount = 0;
      const computation = (filter: string) => {
        computationCount++;
        return mockItems.filter(item => item.rarity === filter);
      };

      // Different dependencies should trigger new computation
      await result.current.computeWithCache('test-key', () => computation('common'), ['common']);
      await result.current.computeWithCache('test-key', () => computation('uncommon'), ['uncommon']);

      expect(computationCount).toBe(2);
    });
  });

  describe('Smart Item Filtering', () => {
    const mockItems: EnhancedItem[] = [
      {
        id: 'item1',
        name: 'Health Potion',
        category: 'consumables',
        itemType: 'consumable',
        rarity: 'common',
        quantity: 5,
        value: 50,
        stackable: true,
        usable: true,
        description: 'Restores health'
      },
      {
        id: 'item2',
        name: 'Steel Sword',
        category: 'equipment',
        itemType: 'weapon',
        rarity: 'uncommon',
        quantity: 1,
        value: 200,
        stackable: false,
        usable: false,
        description: 'A sharp blade'
      },
      {
        id: 'item3',
        name: 'Magic Ring',
        category: 'equipment',
        itemType: 'accessory',
        rarity: 'rare',
        quantity: 1,
        value: 500,
        stackable: false,
        usable: false,
        description: 'Increases mana'
      }
    ];

    it('should filter items by category', async () => {
      const { result } = renderHook(() => useSmartItemFiltering(mockItems));

      const filtered = await result.current.filterItems({
        category: 'equipment'
      });

      expect(filtered.data).toHaveLength(2);
      expect(filtered.data.every(item => item.category === 'equipment')).toBe(true);
    });

    it('should filter items by rarity', async () => {
      const { result } = renderHook(() => useSmartItemFiltering(mockItems));

      const filtered = await result.current.filterItems({
        rarity: ['common', 'uncommon']
      });

      expect(filtered.data).toHaveLength(2);
      expect(filtered.data.every(item => ['common', 'uncommon'].includes(item.rarity))).toBe(true);
    });

    it('should filter items by value range', async () => {
      const { result } = renderHook(() => useSmartItemFiltering(mockItems));

      const filtered = await result.current.filterItems({
        valueRange: { min: 100, max: 300 }
      });

      expect(filtered.data).toHaveLength(1);
      expect(filtered.data[0].value).toBe(200);
    });

    it('should filter items by search term', async () => {
      const { result } = renderHook(() => useSmartItemFiltering(mockItems));

      const filtered = await result.current.filterItems({
        search: 'sword'
      });

      expect(filtered.data).toHaveLength(1);
      expect(filtered.data[0].name).toBe('Steel Sword');
    });

    it('should sort filtered results', async () => {
      const { result } = renderHook(() => useSmartItemFiltering(mockItems));

      const filtered = await result.current.filterItems(
        {},
        { field: 'value', order: 'desc' }
      );

      expect(filtered.data[0].value).toBe(500); // Magic Ring
      expect(filtered.data[1].value).toBe(200); // Steel Sword
      expect(filtered.data[2].value).toBe(50);  // Health Potion
    });

    it('should provide performance metrics', async () => {
      const { result } = renderHook(() => useSmartItemFiltering(mockItems));

      const filtered = await result.current.filterItems({
        category: 'equipment'
      });

      expect(typeof filtered.computeTime).toBe('number');
      expect(filtered.computeTime).toBeGreaterThanOrEqual(0);
      expect(typeof filtered.cacheHit).toBe('boolean');
      expect(typeof filtered.lastComputed).toBe('number');
    });
  });

  describe('Smart Aggregations', () => {
    const mockItems: EnhancedItem[] = [
      {
        id: 'item1',
        name: 'Health Potion',
        category: 'consumables',
        itemType: 'consumable',
        rarity: 'common',
        quantity: 5,
        value: 50,
        stackable: true,
        usable: true,
        description: 'Restores health'
      },
      {
        id: 'item2',
        name: 'Steel Sword',
        category: 'equipment',
        itemType: 'weapon',
        rarity: 'uncommon',
        quantity: 1,
        value: 200,
        stackable: false,
        usable: false,
        description: 'A sharp blade'
      }
    ];

    const mockCreatures: EnhancedCreature[] = [
      {
        id: 'creature1',
        creatureId: 'creature1',
        name: 'Fire Dragon',
        species: 'Dragon',
        creatureType: 'fire',
        level: 25,
        rarity: 'legendary',
        stats: { health: 500, attack: 80, defense: 60, speed: 40 },
        collectionStatus: 'captured'
      },
      {
        id: 'creature2',
        creatureId: 'creature2',
        name: 'Ice Wolf',
        species: 'Wolf',
        creatureType: 'ice',
        level: 15,
        rarity: 'rare',
        stats: { health: 200, attack: 60, defense: 40, speed: 70 },
        collectionStatus: 'discovered'
      }
    ];

    it('should compute item statistics', async () => {
      const { result } = renderHook(() => useSmartAggregations());

      const stats = await result.current.computeItemStats(mockItems);

      expect(stats.data.totalValue).toBe(450); // 5*50 + 1*200
      expect(stats.data.totalQuantity).toBe(6); // 5 + 1
      expect(stats.data.averageValue).toBe(75); // 450/6
      expect(stats.data.categoryDistribution.consumables).toBe(5);
      expect(stats.data.categoryDistribution.equipment).toBe(1);
      expect(stats.data.rarityDistribution.common).toBe(5);
      expect(stats.data.rarityDistribution.uncommon).toBe(1);
    });

    it('should compute creature statistics', async () => {
      const { result } = renderHook(() => useSmartAggregations());

      const stats = await result.current.computeCreatureStats(mockCreatures);

      expect(stats.data.totalCreatures).toBe(2);
      expect(stats.data.averageLevel).toBe(20); // (25+15)/2
      expect(stats.data.typeDistribution.fire).toBe(1);
      expect(stats.data.typeDistribution.ice).toBe(1);
      expect(stats.data.rarityDistribution.legendary).toBe(1);
      expect(stats.data.rarityDistribution.rare).toBe(1);
      expect(stats.data.statusDistribution.captured).toBe(1);
      expect(stats.data.statusDistribution.discovered).toBe(1);
    });

    it('should cache aggregation results', async () => {
      const { result } = renderHook(() => useSmartAggregations());

      // First computation
      const stats1 = await result.current.computeItemStats(mockItems);
      expect(stats1.cacheHit).toBe(false);

      // Second computation should use cache
      const stats2 = await result.current.computeItemStats(mockItems);
      expect(stats2.cacheHit).toBe(true);
    });
  });
});