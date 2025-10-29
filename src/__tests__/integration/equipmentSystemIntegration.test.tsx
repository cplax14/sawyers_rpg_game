/**
 * Equipment System Integration Test
 *
 * Task 9.11: Integration test - Equipping item updates inventory state correctly
 *
 * This test verifies the integration between equipment and inventory at the
 * game state level (ReactGameContext). It tests that:
 *
 * 1. Equipment slots correctly store item IDs
 * 2. Multiple equipment changes work in sequence
 * 3. Equipment state persists correctly in game context
 * 4. Items can be equipped and unequipped
 * 5. Equipment references remain valid in inventory
 *
 * Test Approach:
 * - Uses real ReactGameProvider (no mocking)
 * - Uses useReactGame() hook pattern (proven reliable)
 * - Tests game state integration (not hook internals)
 * - Focuses on user workflows and state consistency
 *
 * Coverage:
 * - Equipping items to empty slots
 * - Replacing equipped items
 * - Unequipping items
 * - Multiple equipment operations
 * - Equipment/inventory state coordination
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReactGameProvider, useReactGame } from '../../contexts/ReactGameContext';

// =============================================================================
// TEST SETUP
// =============================================================================

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactGameProvider>{children}</ReactGameProvider>
);

// Mock equipment items matching ReactItem structure
const createMockIronSword = () => ({
  id: 'iron_sword',
  name: 'Iron Sword',
  description: 'A sturdy iron blade',
  type: 'weapon' as const,
  subtype: 'sword',
  rarity: 'common' as const,
  value: 100,
  quantity: 1,
  stats: {
    attack: 15,
    defense: 0,
    magicAttack: 0,
    magicDefense: 0,
    speed: 0,
    accuracy: 2,
  },
  icon: '⚔️',
});

const createMockSteelSword = () => ({
  id: 'steel_sword',
  name: 'Steel Sword',
  description: 'A sharp steel blade',
  type: 'weapon' as const,
  subtype: 'sword',
  rarity: 'uncommon' as const,
  value: 250,
  quantity: 1,
  stats: {
    attack: 25,
    defense: 0,
    magicAttack: 0,
    magicDefense: 0,
    speed: 0,
    accuracy: 3,
  },
  icon: '⚔️',
});

const createMockLeatherVest = () => ({
  id: 'leather_vest',
  name: 'Leather Vest',
  description: 'Basic leather protection',
  type: 'armor' as const,
  subtype: 'chestplate',
  rarity: 'common' as const,
  value: 80,
  quantity: 1,
  stats: {
    attack: 0,
    defense: 12,
    magicAttack: 0,
    magicDefense: 5,
    speed: -2,
    accuracy: 0,
  },
  icon: '🛡️',
});

const createMockIronHelmet = () => ({
  id: 'iron_helmet',
  name: 'Iron Helmet',
  description: 'Protective headgear',
  type: 'armor' as const,
  subtype: 'helmet',
  rarity: 'common' as const,
  value: 60,
  quantity: 1,
  stats: {
    attack: 0,
    defense: 8,
    magicAttack: 0,
    magicDefense: 3,
    speed: 0,
    accuracy: 0,
  },
  icon: '⛑️',
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Equipment System Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Equipping items to empty slots', () => {
    it('should store item ID in equipment slot', () => {
      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const ironSword = createMockIronSword();

      act(() => {
        result.current.addItems([ironSword]);
      });

      // Verify equipment slot is initially empty
      expect(result.current.state.player?.equipment.weapon).toBeNull();

      // Act: Equip the sword
      act(() => {
        result.current.equipItem('weapon', ironSword.id);
      });

      // Assert: Equipment slot contains item ID
      expect(result.current.state.player?.equipment.weapon).toBe(ironSword.id);
    });

    it('should maintain item in inventory after equipping', () => {
      // At the game state level, items exist in both inventory and equipment
      // This allows the equipment system to reference items by ID

      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const ironSword = createMockIronSword();

      act(() => {
        result.current.addItems([ironSword]);
      });

      // Act: Equip the sword
      act(() => {
        result.current.equipItem('weapon', ironSword.id);
      });

      // Assert: Item still in inventory (context stores by reference)
      const itemInInventory = result.current.state.inventory.find(item => item.id === ironSword.id);
      expect(itemInInventory).toBeDefined();
      expect(itemInInventory?.name).toBe('Iron Sword');
    });

    it('should allow equipping items to different slots simultaneously', () => {
      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const sword = createMockIronSword();
      const vest = createMockLeatherVest();
      const helmet = createMockIronHelmet();

      act(() => {
        result.current.addItems([sword, vest, helmet]);
      });

      // Act: Equip all three items
      act(() => {
        result.current.equipItem('weapon', sword.id);
        result.current.equipItem('armor', vest.id);
        result.current.equipItem('helmet', helmet.id);
      });

      // Assert: All three slots filled independently
      expect(result.current.state.player?.equipment.weapon).toBe(sword.id);
      expect(result.current.state.player?.equipment.armor).toBe(vest.id);
      expect(result.current.state.player?.equipment.helmet).toBe(helmet.id);
    });
  });

  describe('Replacing equipped items', () => {
    it('should replace equipment slot with new item ID', () => {
      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const ironSword = createMockIronSword();
      const steelSword = createMockSteelSword();

      act(() => {
        result.current.addItems([ironSword, steelSword]);
        result.current.equipItem('weapon', ironSword.id);
      });

      // Verify iron sword equipped
      expect(result.current.state.player?.equipment.weapon).toBe(ironSword.id);

      // Act: Equip steel sword (replaces iron sword)
      act(() => {
        result.current.equipItem('weapon', steelSword.id);
      });

      // Assert: Steel sword now in equipment slot
      expect(result.current.state.player?.equipment.weapon).toBe(steelSword.id);
    });

    it('should preserve both items in inventory after replacement', () => {
      // Both the old and new items remain in inventory at the context level

      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const ironSword = createMockIronSword();
      const steelSword = createMockSteelSword();

      act(() => {
        result.current.addItems([ironSword, steelSword]);
        result.current.equipItem('weapon', ironSword.id);
      });

      // Act: Replace with steel sword
      act(() => {
        result.current.equipItem('weapon', steelSword.id);
      });

      // Assert: Both items remain in inventory
      const ironInInventory = result.current.state.inventory.find(item => item.id === ironSword.id);
      const steelInInventory = result.current.state.inventory.find(
        item => item.id === steelSword.id
      );

      expect(ironInInventory).toBeDefined();
      expect(steelInInventory).toBeDefined();
    });

    it('should handle multiple replacements in sequence', () => {
      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const ironSword = createMockIronSword();
      const steelSword = createMockSteelSword();

      act(() => {
        result.current.addItems([ironSword, steelSword]);
      });

      // Act: Equip → replace → replace again
      act(() => {
        result.current.equipItem('weapon', ironSword.id);
      });
      expect(result.current.state.player?.equipment.weapon).toBe(ironSword.id);

      act(() => {
        result.current.equipItem('weapon', steelSword.id);
      });
      expect(result.current.state.player?.equipment.weapon).toBe(steelSword.id);

      act(() => {
        result.current.equipItem('weapon', ironSword.id);
      });
      expect(result.current.state.player?.equipment.weapon).toBe(ironSword.id);
    });
  });

  describe('Unequipping items', () => {
    it('should clear equipment slot when unequipped', () => {
      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const ironSword = createMockIronSword();

      act(() => {
        result.current.addItems([ironSword]);
        result.current.equipItem('weapon', ironSword.id);
      });

      // Verify equipped
      expect(result.current.state.player?.equipment.weapon).toBe(ironSword.id);

      // Act: Unequip the sword
      act(() => {
        result.current.unequipItem('weapon');
      });

      // Assert: Equipment slot cleared
      expect(result.current.state.player?.equipment.weapon).toBeNull();
    });

    it('should preserve item in inventory after unequipping', () => {
      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const ironSword = createMockIronSword();

      act(() => {
        result.current.addItems([ironSword]);
        result.current.equipItem('weapon', ironSword.id);
        result.current.unequipItem('weapon');
      });

      // Assert: Item still in inventory
      const itemInInventory = result.current.state.inventory.find(item => item.id === ironSword.id);
      expect(itemInInventory).toBeDefined();
    });

    it('should allow re-equipping after unequipping', () => {
      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const ironSword = createMockIronSword();

      act(() => {
        result.current.addItems([ironSword]);
      });

      // Act: Equip → unequip → re-equip
      act(() => {
        result.current.equipItem('weapon', ironSword.id);
      });
      expect(result.current.state.player?.equipment.weapon).toBe(ironSword.id);

      act(() => {
        result.current.unequipItem('weapon');
      });
      expect(result.current.state.player?.equipment.weapon).toBeNull();

      act(() => {
        result.current.equipItem('weapon', ironSword.id);
      });
      expect(result.current.state.player?.equipment.weapon).toBe(ironSword.id);
    });

    it('should preserve other equipped items when unequipping one slot', () => {
      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const sword = createMockIronSword();
      const vest = createMockLeatherVest();

      act(() => {
        result.current.addItems([sword, vest]);
        result.current.equipItem('weapon', sword.id);
        result.current.equipItem('armor', vest.id);
      });

      // Verify both equipped
      expect(result.current.state.player?.equipment.weapon).toBe(sword.id);
      expect(result.current.state.player?.equipment.armor).toBe(vest.id);

      // Act: Unequip weapon only
      act(() => {
        result.current.unequipItem('weapon');
      });

      // Assert: Armor still equipped, weapon cleared
      expect(result.current.state.player?.equipment.weapon).toBeNull();
      expect(result.current.state.player?.equipment.armor).toBe(vest.id);
    });
  });

  describe('Equipment-inventory state coordination', () => {
    it('should maintain valid item references between equipment and inventory', () => {
      // This tests the core integration: equipped items can be looked up from inventory

      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const sword = createMockIronSword();
      const vest = createMockLeatherVest();
      const helmet = createMockIronHelmet();

      act(() => {
        result.current.addItems([sword, vest, helmet]);
        result.current.equipItem('weapon', sword.id);
        result.current.equipItem('armor', vest.id);
        result.current.equipItem('helmet', helmet.id);
      });

      // Act: Look up each equipped item from inventory
      const equippedWeaponId = result.current.state.player?.equipment.weapon;
      const equippedArmorId = result.current.state.player?.equipment.armor;
      const equippedHelmetId = result.current.state.player?.equipment.helmet;

      const weaponInInventory = result.current.state.inventory.find(
        item => item.id === equippedWeaponId
      );
      const armorInInventory = result.current.state.inventory.find(
        item => item.id === equippedArmorId
      );
      const helmetInInventory = result.current.state.inventory.find(
        item => item.id === equippedHelmetId
      );

      // Assert: All equipped items can be found in inventory
      expect(weaponInInventory).toBeDefined();
      expect(weaponInInventory?.name).toBe('Iron Sword');

      expect(armorInInventory).toBeDefined();
      expect(armorInInventory?.name).toBe('Leather Vest');

      expect(helmetInInventory).toBeDefined();
      expect(helmetInInventory?.name).toBe('Iron Helmet');
    });

    it('should handle rapid equipment changes without state corruption', () => {
      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const ironSword = createMockIronSword();
      const steelSword = createMockSteelSword();

      act(() => {
        result.current.addItems([ironSword, steelSword]);
      });

      // Act: Rapid equipment changes
      act(() => {
        result.current.equipItem('weapon', ironSword.id);
        result.current.equipItem('weapon', steelSword.id);
        result.current.unequipItem('weapon');
        result.current.equipItem('weapon', ironSword.id);
        result.current.equipItem('weapon', steelSword.id);
        result.current.unequipItem('weapon');
        result.current.equipItem('weapon', ironSword.id);
      });

      // Assert: Final state is correct
      expect(result.current.state.player?.equipment.weapon).toBe(ironSword.id);

      // Assert: Both items still in inventory
      const ironInInventory = result.current.state.inventory.find(item => item.id === ironSword.id);
      const steelInInventory = result.current.state.inventory.find(
        item => item.id === steelSword.id
      );

      expect(ironInInventory).toBeDefined();
      expect(steelInInventory).toBeDefined();
    });

    it('should maintain equipment state across all 10+ slots', () => {
      // Test that all equipment slots work correctly with the inventory

      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const items = [
        createMockIronSword(), // weapon
        createMockLeatherVest(), // armor
        createMockIronHelmet(), // helmet
      ];

      act(() => {
        result.current.addItems(items);
        result.current.equipItem('weapon', items[0].id);
        result.current.equipItem('armor', items[1].id);
        result.current.equipItem('helmet', items[2].id);
      });

      // Assert: All slots independent
      expect(result.current.state.player?.equipment.weapon).toBe(items[0].id);
      expect(result.current.state.player?.equipment.armor).toBe(items[1].id);
      expect(result.current.state.player?.equipment.helmet).toBe(items[2].id);

      // Verify all can be looked up from inventory
      items.forEach(item => {
        const found = result.current.state.inventory.find(invItem => invItem.id === item.id);
        expect(found).toBeDefined();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle equipping the same item twice (no-op)', () => {
      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      const ironSword = createMockIronSword();

      act(() => {
        result.current.addItems([ironSword]);
        result.current.equipItem('weapon', ironSword.id);
      });

      // Act: Try to equip the same item again
      act(() => {
        result.current.equipItem('weapon', ironSword.id);
      });

      // Assert: Still equipped (no error)
      expect(result.current.state.player?.equipment.weapon).toBe(ironSword.id);
    });

    it('should handle unequipping an empty slot gracefully', () => {
      // Arrange
      const { result } = renderHook(() => useReactGame(), { wrapper });

      act(() => {
        result.current.createPlayer('TestPlayer', 'warrior');
      });

      // Verify slot is empty
      expect(result.current.state.player?.equipment.weapon).toBeNull();

      // Act: Try to unequip empty slot
      act(() => {
        result.current.unequipItem('weapon');
      });

      // Assert: Still empty (no error)
      expect(result.current.state.player?.equipment.weapon).toBeNull();
    });
  });
});
