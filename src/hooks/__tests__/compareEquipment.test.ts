/**
 * compareEquipment Function Tests
 * Tests the equipment comparison logic to ensure accurate stat calculations
 */

import { renderHook } from '@testing-library/react';
import { useEquipment } from '../useEquipment';
import { EnhancedItem } from '../../types/inventory';

// Mock dependencies
jest.mock('../useGameState');
jest.mock('../useInventory');

import { useGameState } from '../useGameState';
import { useInventory } from '../useInventory';

const mockUseGameState = useGameState as jest.MockedFunction<typeof useGameState>;
const mockUseInventory = useInventory as jest.MockedFunction<typeof useInventory>;

describe('compareEquipment Function', () => {
  const mockGameState = {
    state: {
      player: {
        id: 'player-1',
        name: 'Test Player',
        level: 5,
        class: 'warrior',
        stats: {
          attack: 20,
          defense: 15,
          magicAttack: 10,
          magicDefense: 12,
          speed: 14,
          accuracy: 16,
        },
      },
    },
    dispatch: jest.fn(),
  };

  const mockInventory = {
    inventoryState: {
      containers: {
        main: {
          items: [],
        },
      },
    },
    addItem: jest.fn(),
    removeItem: jest.fn(),
    addEventListener: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGameState.mockReturnValue(mockGameState as any);
    mockUseInventory.mockReturnValue(mockInventory as any);
  });

  describe('Basic Comparison Logic', () => {
    it('should correctly calculate stat improvements when new item has higher stats', () => {
      const { result } = renderHook(() => useEquipment());

      const currentWeapon: EnhancedItem = {
        id: 'old-sword',
        name: 'Rusty Sword',
        description: 'An old sword',
        type: 'equipment',
        rarity: 'common',
        value: 50,
        weight: 3,
        category: 'equipment',
        stackable: false,
        usable: false,
        enhancementLevel: 0,
        enchantments: [],
        durability: { current: 100, max: 100 },
        requirements: { level: 1, class: [], stats: {} },
        equipmentSlot: 'weapon',
        equipmentSubtype: 'sword',
        statModifiers: {
          attack: 5,
          defense: 1,
        },
        metadata: {
          addedAt: new Date().toISOString(),
          lastUsed: null,
          timesUsed: 0,
          source: 'shop',
          tags: ['weapon'],
        },
      };

      const newWeapon: EnhancedItem = {
        ...currentWeapon,
        id: 'steel-sword',
        name: 'Steel Sword',
        description: 'A sturdy steel sword',
        value: 150,
        statModifiers: {
          attack: 12,
          defense: 2,
          speed: 3,
        },
      };

      const comparison = result.current.compareEquipment(currentWeapon, newWeapon);

      // Verify stat changes calculation
      expect(comparison.statChanges).toEqual({
        attack: 7, // 12 - 5
        defense: 1, // 2 - 1
        speed: 3, // 3 - 0
      });

      // Verify improvements array
      expect(comparison.improvements).toContain('+7 attack');
      expect(comparison.improvements).toContain('+1 defense');
      expect(comparison.improvements).toContain('+3 speed');
      expect(comparison.improvements.length).toBe(3);

      // Verify downgrades array (should be empty)
      expect(comparison.downgrades.length).toBe(0);

      // Verify net score (sum of all changes)
      expect(comparison.netScore).toBe(11); // 7 + 1 + 3
    });

    it('should correctly calculate stat downgrades when new item has lower stats', () => {
      const { result } = renderHook(() => useEquipment());

      const currentArmor: EnhancedItem = {
        id: 'plate-armor',
        name: 'Plate Armor',
        description: 'Heavy plate armor',
        type: 'equipment',
        rarity: 'rare',
        value: 500,
        weight: 15,
        category: 'equipment',
        stackable: false,
        usable: false,
        enhancementLevel: 0,
        enchantments: [],
        durability: { current: 100, max: 100 },
        requirements: { level: 1, class: [], stats: {} },
        equipmentSlot: 'armor',
        equipmentSubtype: 'heavy',
        statModifiers: {
          defense: 20,
          magicDefense: 10,
          speed: -5,
        },
        metadata: {
          addedAt: new Date().toISOString(),
          lastUsed: null,
          timesUsed: 0,
          source: 'loot',
          tags: ['armor', 'heavy'],
        },
      };

      const newArmor: EnhancedItem = {
        ...currentArmor,
        id: 'leather-armor',
        name: 'Leather Armor',
        description: 'Light leather armor',
        rarity: 'common',
        value: 100,
        weight: 5,
        statModifiers: {
          defense: 8,
          magicDefense: 3,
          speed: 2,
        },
      };

      const comparison = result.current.compareEquipment(currentArmor, newArmor);

      // Verify stat changes calculation
      expect(comparison.statChanges).toEqual({
        defense: -12, // 8 - 20
        magicDefense: -7, // 3 - 10
        speed: 7, // 2 - (-5)
      });

      // Verify improvements array
      expect(comparison.improvements).toContain('+7 speed');
      expect(comparison.improvements.length).toBe(1);

      // Verify downgrades array
      expect(comparison.downgrades).toContain('-12 defense');
      expect(comparison.downgrades).toContain('-7 magicDefense');
      expect(comparison.downgrades.length).toBe(2);

      // Verify net score (sum of all changes, including negatives)
      expect(comparison.netScore).toBe(-12); // -12 + (-7) + 7
    });

    it('should handle comparison when current item is null', () => {
      const { result } = renderHook(() => useEquipment());

      const newRing: EnhancedItem = {
        id: 'ring-1',
        name: 'Ring of Power',
        description: 'A magical ring',
        type: 'equipment',
        rarity: 'epic',
        value: 1000,
        weight: 0.1,
        category: 'equipment',
        stackable: false,
        usable: false,
        enhancementLevel: 0,
        enchantments: [],
        durability: { current: 100, max: 100 },
        requirements: { level: 1, class: [], stats: {} },
        equipmentSlot: 'ring1',
        equipmentSubtype: 'ring',
        statModifiers: {
          attack: 5,
          magicAttack: 8,
          critical: 10,
        },
        metadata: {
          addedAt: new Date().toISOString(),
          lastUsed: null,
          timesUsed: 0,
          source: 'quest',
          tags: ['ring', 'magic'],
        },
      };

      const comparison = result.current.compareEquipment(null, newRing);

      // All stats should be improvements (comparing to nothing)
      expect(comparison.statChanges).toEqual({
        attack: 5,
        magicAttack: 8,
        critical: 10,
      });

      expect(comparison.improvements).toContain('+5 attack');
      expect(comparison.improvements).toContain('+8 magicAttack');
      expect(comparison.improvements).toContain('+10 critical');
      expect(comparison.improvements.length).toBe(3);

      expect(comparison.downgrades.length).toBe(0);
      expect(comparison.netScore).toBe(23); // 5 + 8 + 10
    });

    it('should handle mixed improvements and downgrades (sidegrade scenario)', () => {
      const { result } = renderHook(() => useEquipment());

      const currentHelmet: EnhancedItem = {
        id: 'warrior-helm',
        name: 'Warrior Helm',
        description: 'A physical defense helmet',
        type: 'equipment',
        rarity: 'rare',
        value: 300,
        weight: 4,
        category: 'equipment',
        stackable: false,
        usable: false,
        enhancementLevel: 0,
        enchantments: [],
        durability: { current: 100, max: 100 },
        requirements: { level: 1, class: [], stats: {} },
        equipmentSlot: 'helmet',
        equipmentSubtype: 'helmet',
        statModifiers: {
          defense: 10,
          magicDefense: 2,
          attack: 3,
        },
        metadata: {
          addedAt: new Date().toISOString(),
          lastUsed: null,
          timesUsed: 0,
          source: 'shop',
          tags: ['helmet', 'heavy'],
        },
      };

      const newHelmet: EnhancedItem = {
        ...currentHelmet,
        id: 'mage-helm',
        name: 'Mage Helm',
        description: 'A magical defense helmet',
        statModifiers: {
          defense: 4,
          magicDefense: 12,
          magicAttack: 5,
        },
      };

      const comparison = result.current.compareEquipment(currentHelmet, newHelmet);

      // Mixed changes
      expect(comparison.statChanges).toEqual({
        defense: -6, // 4 - 10
        magicDefense: 10, // 12 - 2
        attack: -3, // 0 - 3
        magicAttack: 5, // 5 - 0
      });

      // Verify improvements
      expect(comparison.improvements).toContain('+10 magicDefense');
      expect(comparison.improvements).toContain('+5 magicAttack');
      expect(comparison.improvements.length).toBe(2);

      // Verify downgrades
      expect(comparison.downgrades).toContain('-6 defense');
      expect(comparison.downgrades).toContain('-3 attack');
      expect(comparison.downgrades.length).toBe(2);

      // Net score is the sum of all changes
      expect(comparison.netScore).toBe(6); // -6 + 10 + (-3) + 5
    });
  });

  describe('Edge Cases', () => {
    it('should handle items with no stat modifiers', () => {
      const { result } = renderHook(() => useEquipment());

      const currentItem: EnhancedItem = {
        id: 'charm-1',
        name: 'Decorative Charm',
        description: 'A charm with no stats',
        type: 'equipment',
        rarity: 'common',
        value: 10,
        weight: 0.1,
        category: 'equipment',
        stackable: false,
        usable: false,
        enhancementLevel: 0,
        enchantments: [],
        durability: { current: 100, max: 100 },
        requirements: { level: 1, class: [], stats: {} },
        equipmentSlot: 'charm',
        equipmentSubtype: 'charm',
        statModifiers: {},
        metadata: {
          addedAt: new Date().toISOString(),
          lastUsed: null,
          timesUsed: 0,
          source: 'shop',
          tags: ['charm'],
        },
      };

      const newItem: EnhancedItem = {
        ...currentItem,
        id: 'charm-2',
        name: 'Lucky Charm',
        statModifiers: {
          accuracy: 5,
        },
      };

      const comparison = result.current.compareEquipment(currentItem, newItem);

      expect(comparison.statChanges).toEqual({ accuracy: 5 });
      expect(comparison.improvements).toContain('+5 accuracy');
      expect(comparison.downgrades.length).toBe(0);
      expect(comparison.netScore).toBe(5);
    });

    it('should handle identical items (no changes)', () => {
      const { result } = renderHook(() => useEquipment());

      const item: EnhancedItem = {
        id: 'gloves-1',
        name: 'Leather Gloves',
        description: 'Basic gloves',
        type: 'equipment',
        rarity: 'common',
        value: 25,
        weight: 0.5,
        category: 'equipment',
        stackable: false,
        usable: false,
        enhancementLevel: 0,
        enchantments: [],
        durability: { current: 100, max: 100 },
        requirements: { level: 1, class: [], stats: {} },
        equipmentSlot: 'gloves',
        equipmentSubtype: 'gloves',
        statModifiers: {
          defense: 2,
          accuracy: 1,
        },
        metadata: {
          addedAt: new Date().toISOString(),
          lastUsed: null,
          timesUsed: 0,
          source: 'shop',
          tags: ['gloves'],
        },
      };

      const comparison = result.current.compareEquipment(item, item);

      expect(comparison.statChanges).toEqual({});
      expect(comparison.improvements.length).toBe(0);
      expect(comparison.downgrades.length).toBe(0);
      expect(comparison.netScore).toBe(0);
    });

    it('should correctly handle negative stat modifiers', () => {
      const { result } = renderHook(() => useEquipment());

      const currentBoots: EnhancedItem = {
        id: 'heavy-boots',
        name: 'Heavy Steel Boots',
        description: 'Very heavy boots',
        type: 'equipment',
        rarity: 'common',
        value: 100,
        weight: 8,
        category: 'equipment',
        stackable: false,
        usable: false,
        enhancementLevel: 0,
        enchantments: [],
        durability: { current: 100, max: 100 },
        requirements: { level: 1, class: [], stats: {} },
        equipmentSlot: 'boots',
        equipmentSubtype: 'boots',
        statModifiers: {
          defense: 8,
          speed: -4, // Heavy boots slow you down
        },
        metadata: {
          addedAt: new Date().toISOString(),
          lastUsed: null,
          timesUsed: 0,
          source: 'shop',
          tags: ['boots', 'heavy'],
        },
      };

      const newBoots: EnhancedItem = {
        ...currentBoots,
        id: 'light-boots',
        name: 'Light Boots',
        description: 'Lightweight boots',
        statModifiers: {
          defense: 3,
          speed: 6,
        },
      };

      const comparison = result.current.compareEquipment(currentBoots, newBoots);

      // Defense: 3 - 8 = -5
      // Speed: 6 - (-4) = 10
      expect(comparison.statChanges).toEqual({
        defense: -5,
        speed: 10,
      });

      expect(comparison.improvements).toContain('+10 speed');
      expect(comparison.downgrades).toContain('-5 defense');
      expect(comparison.netScore).toBe(5); // -5 + 10
    });
  });

  describe('Return Value Structure', () => {
    it('should return all required fields in EquipmentComparison interface', () => {
      const { result } = renderHook(() => useEquipment());

      const item: EnhancedItem = {
        id: 'necklace-1',
        name: 'Silver Necklace',
        description: 'A silver necklace',
        type: 'equipment',
        rarity: 'rare',
        value: 200,
        weight: 0.2,
        category: 'equipment',
        stackable: false,
        usable: false,
        enhancementLevel: 0,
        enchantments: [],
        durability: { current: 100, max: 100 },
        requirements: { level: 1, class: [], stats: {} },
        equipmentSlot: 'necklace',
        equipmentSubtype: 'necklace',
        statModifiers: {
          magicAttack: 10,
          magicDefense: 5,
        },
        metadata: {
          addedAt: new Date().toISOString(),
          lastUsed: null,
          timesUsed: 0,
          source: 'loot',
          tags: ['necklace'],
        },
      };

      const comparison = result.current.compareEquipment(null, item);

      // Verify all required fields exist
      expect(comparison).toHaveProperty('currentItem');
      expect(comparison).toHaveProperty('newItem');
      expect(comparison).toHaveProperty('statChanges');
      expect(comparison).toHaveProperty('improvements');
      expect(comparison).toHaveProperty('downgrades');
      expect(comparison).toHaveProperty('netScore');

      // Verify correct types
      expect(comparison.currentItem).toBeNull();
      expect(comparison.newItem).toEqual(item);
      expect(typeof comparison.statChanges).toBe('object');
      expect(Array.isArray(comparison.improvements)).toBe(true);
      expect(Array.isArray(comparison.downgrades)).toBe(true);
      expect(typeof comparison.netScore).toBe('number');
    });
  });
});
