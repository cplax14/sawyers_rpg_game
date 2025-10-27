/**
 * Equipment Compatibility Cache Test Suite
 * Tests the LRU cache implementation for equipment compatibility checks
 */

import {
  checkEquipmentCompatibility,
  clearCompatibilityCache,
  getCompatibilityCacheStats
} from '../equipmentUtils';
import { EnhancedItem, EquipmentSet } from '../../types/inventory';
import { PlayerStats } from '../../types/game';

describe('Equipment Compatibility Cache', () => {
  // Mock data
  const mockPlayerStats: PlayerStats = {
    attack: 10,
    defense: 10,
    magicAttack: 10,
    magicDefense: 10,
    speed: 10,
    accuracy: 85
  };

  const mockSword: EnhancedItem = {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A sturdy iron sword',
    category: 'equipment',
    itemType: 'equipment',
    equipmentSlot: 'weapon',
    rarity: 'common',
    value: 100,
    weight: 3,
    statModifiers: {
      attack: { value: 15, type: 'flat' }
    },
    requirements: {
      level: 5,
      classes: ['warrior', 'paladin'],
      stats: { attack: 8 }
    }
  };

  const mockShield: EnhancedItem = {
    id: 'iron_shield',
    name: 'Iron Shield',
    description: 'A protective iron shield',
    category: 'equipment',
    itemType: 'equipment',
    equipmentSlot: 'shield',
    rarity: 'common',
    value: 80,
    weight: 4,
    statModifiers: {
      defense: { value: 12, type: 'flat' }
    }
  };

  const mockTwoHandedSword: EnhancedItem = {
    id: 'greatsword',
    name: 'Greatsword',
    description: 'A massive two-handed sword',
    category: 'equipment',
    itemType: 'equipment',
    equipmentSlot: 'weapon',
    twoHanded: true,
    rarity: 'uncommon',
    value: 250,
    weight: 8,
    statModifiers: {
      attack: { value: 30, type: 'flat' }
    },
    requirements: {
      level: 10
    }
  };

  beforeEach(() => {
    // Clear cache before each test
    clearCompatibilityCache();
  });

  describe('Cache Hit/Miss Behavior', () => {
    it('should return cached result on second identical call', () => {
      // First call - cache miss
      const result1 = checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10,
        'warrior',
        { ...mockPlayerStats, attack: 15 }
      );

      // Second call with identical parameters - cache hit
      const result2 = checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10,
        'warrior',
        { ...mockPlayerStats, attack: 15 }
      );

      // Results should be identical
      expect(result1).toEqual(result2);
      expect(result1.canEquip).toBe(true);

      // Check cache stats
      const stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5); // 1 hit out of 2 calls
    });

    it('should miss cache when parameters change', () => {
      // First call
      checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10,
        'warrior',
        mockPlayerStats
      );

      // Second call with different level - cache miss
      checkEquipmentCompatibility(
        mockSword,
        'weapon',
        15, // Different level
        'warrior',
        mockPlayerStats
      );

      const stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
    });

    it('should miss cache when player class changes', () => {
      // First call
      checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10,
        'warrior',
        mockPlayerStats
      );

      // Second call with different class - cache miss
      checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10,
        'mage', // Different class
        mockPlayerStats
      );

      const stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
    });

    it('should miss cache when player stats change', () => {
      // First call
      checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10,
        'warrior',
        mockPlayerStats
      );

      // Second call with different stats - cache miss
      checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10,
        'warrior',
        { ...mockPlayerStats, attack: 15 } // Different stats
      );

      const stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
    });

    it('should miss cache when target slot changes', () => {
      // First call
      checkEquipmentCompatibility(
        mockSword,
        'weapon',
        10,
        'warrior',
        mockPlayerStats
      );

      // Second call with different slot - cache miss
      checkEquipmentCompatibility(
        mockSword,
        'armor', // Different slot
        10,
        'warrior',
        mockPlayerStats
      );

      const stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
    });

    it('should miss cache when equipment set changes (two-handed conflicts)', () => {
      const equipmentWithShield: EquipmentSet = {
        weapon: undefined,
        shield: mockShield,
        armor: undefined,
        helmet: undefined,
        gloves: undefined,
        boots: undefined,
        necklace: undefined,
        ring1: undefined,
        ring2: undefined,
        charm: undefined
      };

      const equipmentWithoutShield: EquipmentSet = {
        weapon: undefined,
        shield: undefined,
        armor: undefined,
        helmet: undefined,
        gloves: undefined,
        boots: undefined,
        necklace: undefined,
        ring1: undefined,
        ring2: undefined,
        charm: undefined
      };

      // First call with shield equipped
      checkEquipmentCompatibility(
        mockTwoHandedSword,
        'weapon',
        15,
        'warrior',
        mockPlayerStats,
        equipmentWithShield
      );

      // Second call without shield - cache miss
      checkEquipmentCompatibility(
        mockTwoHandedSword,
        'weapon',
        15,
        'warrior',
        mockPlayerStats,
        equipmentWithoutShield
      );

      const stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
    });
  });

  describe('Cache Performance', () => {
    it('should improve performance for repeated checks', () => {
      const iterations = 100;

      // Perform same check multiple times
      for (let i = 0; i < iterations; i++) {
        checkEquipmentCompatibility(
          mockSword,
          'weapon',
          10,
          'warrior',
          mockPlayerStats
        );
      }

      const stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(iterations - 1); // First is miss, rest are hits
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.99, 2); // 99% hit rate
    });

    it('should handle multiple different items efficiently', () => {
      const items = [mockSword, mockShield, mockTwoHandedSword];

      // Check each item twice
      items.forEach(item => {
        checkEquipmentCompatibility(
          item,
          item.equipmentSlot!,
          10,
          'warrior',
          mockPlayerStats
        );
      });

      items.forEach(item => {
        checkEquipmentCompatibility(
          item,
          item.equipmentSlot!,
          10,
          'warrior',
          mockPlayerStats
        );
      });

      const stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(3); // Second round all hits
      expect(stats.misses).toBe(3); // First round all misses
      expect(stats.hitRate).toBe(0.5);
    });
  });

  describe('Cache Size and LRU Behavior', () => {
    it('should evict oldest entry when cache is full', () => {
      // Cache size is 100, so create 101 unique entries
      for (let i = 0; i < 101; i++) {
        const item: EnhancedItem = {
          ...mockSword,
          id: `item_${i}`
        };

        checkEquipmentCompatibility(
          item,
          'weapon',
          10,
          'warrior',
          mockPlayerStats
        );
      }

      const stats = getCompatibilityCacheStats();
      expect(stats.size).toBe(100); // Cache should be at max size
      expect(stats.misses).toBe(101); // All new entries

      // First item should have been evicted
      const firstItem: EnhancedItem = {
        ...mockSword,
        id: 'item_0'
      };

      checkEquipmentCompatibility(
        firstItem,
        'weapon',
        10,
        'warrior',
        mockPlayerStats
      );

      const statsAfter = getCompatibilityCacheStats();
      expect(statsAfter.misses).toBe(102); // Cache miss for evicted item
    });

    it('should move accessed items to end (most recently used)', () => {
      // Create 100 items to fill cache
      for (let i = 0; i < 100; i++) {
        const item: EnhancedItem = {
          ...mockSword,
          id: `item_${i}`
        };

        checkEquipmentCompatibility(
          item,
          'weapon',
          10,
          'warrior',
          mockPlayerStats
        );
      }

      // Access first item again (should move to end)
      const firstItem: EnhancedItem = {
        ...mockSword,
        id: 'item_0'
      };

      checkEquipmentCompatibility(
        firstItem,
        'weapon',
        10,
        'warrior',
        mockPlayerStats
      );

      const statsAfterAccess = getCompatibilityCacheStats();
      expect(statsAfterAccess.hits).toBe(1); // Cache hit

      // Add one more item (should evict item_1, not item_0)
      const newItem: EnhancedItem = {
        ...mockSword,
        id: 'item_100'
      };

      checkEquipmentCompatibility(
        newItem,
        'weapon',
        10,
        'warrior',
        mockPlayerStats
      );

      // item_0 should still be cached
      checkEquipmentCompatibility(
        firstItem,
        'weapon',
        10,
        'warrior',
        mockPlayerStats
      );

      const statsFinal = getCompatibilityCacheStats();
      expect(statsFinal.hits).toBe(2); // Both accesses should be hits
    });
  });

  describe('Cache Invalidation', () => {
    it('should clear all entries when clearCompatibilityCache is called', () => {
      // Add some entries
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);
      checkEquipmentCompatibility(mockShield, 'shield', 10, 'warrior', mockPlayerStats);

      let stats = getCompatibilityCacheStats();
      expect(stats.size).toBe(2);

      // Clear cache
      clearCompatibilityCache();

      stats = getCompatibilityCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });

    it('should result in cache miss after clearing cache', () => {
      // Add entry
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);

      // Access again - cache hit
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);

      let stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(1);

      // Clear cache
      clearCompatibilityCache();

      // Access again - cache miss
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);

      stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);
    });
  });

  describe('Cache Statistics', () => {
    it('should track hits and misses correctly', () => {
      // First call - miss
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);

      let stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(1);

      // Second call - hit
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);

      stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);

      // Third call - hit
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);

      stats = getCompatibilityCacheStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should calculate hit rate correctly', () => {
      // No calls yet
      let stats = getCompatibilityCacheStats();
      expect(stats.hitRate).toBe(0);

      // One miss
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);
      stats = getCompatibilityCacheStats();
      expect(stats.hitRate).toBe(0);

      // One hit
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);
      stats = getCompatibilityCacheStats();
      expect(stats.hitRate).toBe(0.5);

      // Another hit
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);
      stats = getCompatibilityCacheStats();
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });

    it('should track cache size correctly', () => {
      let stats = getCompatibilityCacheStats();
      expect(stats.size).toBe(0);

      // Add one entry
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);
      stats = getCompatibilityCacheStats();
      expect(stats.size).toBe(1);

      // Add another entry
      checkEquipmentCompatibility(mockShield, 'shield', 10, 'warrior', mockPlayerStats);
      stats = getCompatibilityCacheStats();
      expect(stats.size).toBe(2);

      // Accessing existing entry doesn't change size
      checkEquipmentCompatibility(mockSword, 'weapon', 10, 'warrior', mockPlayerStats);
      stats = getCompatibilityCacheStats();
      expect(stats.size).toBe(2);
    });
  });

  describe('Cache Correctness', () => {
    it('should return same result from cache as from fresh calculation', () => {
      // Get fresh result
      const freshResult = checkEquipmentCompatibility(
        mockSword,
        'weapon',
        3, // Below level requirement
        'warrior',
        { ...mockPlayerStats, attack: 5 } // Below stat requirement
      );

      expect(freshResult.canEquip).toBe(false);
      expect(freshResult.reasons.length).toBeGreaterThan(0);

      // Get cached result
      const cachedResult = checkEquipmentCompatibility(
        mockSword,
        'weapon',
        3,
        'warrior',
        { ...mockPlayerStats, attack: 5 }
      );

      // Should be identical
      expect(cachedResult).toEqual(freshResult);
      expect(cachedResult.canEquip).toBe(false);
      expect(cachedResult.reasons).toEqual(freshResult.reasons);
      expect(cachedResult.warnings).toEqual(freshResult.warnings);
      expect(cachedResult.suggestions).toEqual(freshResult.suggestions);
    });

    it('should handle complex compatibility results correctly', () => {
      const equipmentWithShield: EquipmentSet = {
        weapon: undefined,
        shield: mockShield,
        armor: undefined,
        helmet: undefined,
        gloves: undefined,
        boots: undefined,
        necklace: undefined,
        ring1: undefined,
        ring2: undefined,
        charm: undefined
      };

      // Get fresh result with two-handed weapon and shield conflict
      const freshResult = checkEquipmentCompatibility(
        mockTwoHandedSword,
        'weapon',
        15,
        'warrior',
        mockPlayerStats,
        equipmentWithShield
      );

      expect(freshResult.canEquip).toBe(true);
      expect(freshResult.warnings.length).toBeGreaterThan(0); // Should have two-handed warning

      // Get cached result
      const cachedResult = checkEquipmentCompatibility(
        mockTwoHandedSword,
        'weapon',
        15,
        'warrior',
        mockPlayerStats,
        equipmentWithShield
      );

      // Should be identical
      expect(cachedResult).toEqual(freshResult);
      expect(cachedResult.warnings).toEqual(freshResult.warnings);
    });
  });
});
