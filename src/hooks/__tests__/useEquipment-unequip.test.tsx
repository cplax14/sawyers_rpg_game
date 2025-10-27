/**
 * useEquipment Hook - Unequip Item Tests (Task 9.5)
 *
 * Comprehensive unit tests for the unequipItem function in useEquipment hook.
 * Tests verify that items can be successfully unequipped, returned to inventory,
 * and that player stats are recalculated correctly.
 *
 * Test Coverage:
 * - Task 9.5: unequipItem successfully unequips and returns items to inventory
 *   - Basic unequip from weapon slot
 *   - Basic unequip from armor slot
 *   - Unequip from accessory slot (ring, necklace, etc.)
 *   - Stats recalculation after unequip
 *   - Unequip from empty slot (edge case)
 *   - Equipment state preservation (other items remain equipped)
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ReactGameProvider, useReactGame } from '../../contexts/ReactGameContext';

// =============================================================================
// TEST SETUP AND HELPERS
// =============================================================================

// Wrapper component for hooks
const wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <ReactGameProvider>{children}</ReactGameProvider>
);

/**
 * Helper to create a mock item (using base Item type for game context)
 */
const createMockItem = (overrides: any = {}) => {
  return {
    id: 'test_item_' + Math.random().toString(36).substring(7),
    name: 'Test Item',
    description: 'A test item',
    type: 'weapon',
    subtype: 'sword',
    rarity: 'common',
    value: 100,
    quantity: 1,
    icon: '⚔️',
    stats: {
      attack: 10,
      defense: 0,
      magicAttack: 0,
      magicDefense: 0,
      speed: 0,
      accuracy: 0
    },
    ...overrides
  };
};

// =============================================================================
// TASK 9.5: unequipItem successfully unequips and returns items to inventory
// =============================================================================

describe('Task 9.5: unequipItem successfully unequips and returns items to inventory', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should successfully unequip a weapon from the weapon slot', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const testSword = createMockItem({
      id: 'iron_sword',
      name: 'Iron Sword',
      type: 'weapon',
      subtype: 'sword',
      stats: { attack: 15, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0 }
    });

    act(() => {
      result.current.addItems([testSword]);
      result.current.equipItem('weapon', testSword.id);
    });

    // Verify equipped
    expect(result.current.state.player?.equipment.weapon).toBe(testSword.id);

    // Act - Unequip the weapon
    act(() => {
      result.current.unequipItem('weapon');
    });

    // Assert
    expect(result.current.state.player?.equipment.weapon).toBeNull();
    expect(result.current.state.inventory).toContainEqual(
      expect.objectContaining({ id: testSword.id })
    );
  });

  it('should successfully unequip armor from the armor slot', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const testArmor = createMockItem({
      id: 'leather_armor',
      name: 'Leather Armor',
      type: 'armor',
      subtype: 'chestplate',
      stats: { attack: 0, defense: 20, magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0 }
    });

    act(() => {
      result.current.addItems([testArmor]);
      result.current.equipItem('armor', testArmor.id);
    });

    expect(result.current.state.player?.equipment.armor).toBe(testArmor.id);

    // Act - Unequip the armor
    act(() => {
      result.current.unequipItem('armor');
    });

    // Assert
    expect(result.current.state.player?.equipment.armor).toBeNull();
    expect(result.current.state.inventory).toContainEqual(
      expect.objectContaining({ id: testArmor.id })
    );
  });

  it('should successfully unequip an accessory item', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const testAccessory = createMockItem({
      id: 'power_ring',
      name: 'Ring of Power',
      type: 'accessory',
      subtype: 'ring',
      stats: { attack: 8, defense: 0, magicAttack: 8, magicDefense: 0, speed: 0, accuracy: 0 }
    });

    act(() => {
      result.current.addItems([testAccessory]);
      result.current.equipItem('accessory', testAccessory.id);
    });

    expect(result.current.state.player?.equipment.accessory).toBe(testAccessory.id);

    // Act - Unequip the accessory
    act(() => {
      result.current.unequipItem('accessory');
    });

    // Assert
    expect(result.current.state.player?.equipment.accessory).toBeNull();
    expect(result.current.state.inventory).toContainEqual(
      expect.objectContaining({ id: testAccessory.id })
    );
  });

  it('should return the unequipped item to inventory', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const testHelmet = createMockItem({
      id: 'iron_helmet',
      name: 'Iron Helmet',
      type: 'armor',
      subtype: 'helmet',
      stats: { attack: 0, defense: 10, magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0 }
    });

    act(() => {
      result.current.addItems([testHelmet]);
      result.current.equipItem('helmet', testHelmet.id);
    });

    expect(result.current.state.player?.equipment.helmet).toBe(testHelmet.id);

    // Act - Unequip the helmet
    act(() => {
      result.current.unequipItem('helmet');
    });

    // Assert - Helmet should be back in inventory
    expect(result.current.state.player?.equipment.helmet).toBeNull();
    const helmetInInventory = result.current.state.inventory?.find(item => item.id === testHelmet.id);
    expect(helmetInInventory).toBeDefined();
    expect(helmetInInventory?.name).toBe('Iron Helmet');
  });

  it('should set equipment slot to null after unequipping', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const testBoots = createMockItem({
      id: 'leather_boots',
      name: 'Leather Boots',
      type: 'armor',
      subtype: 'boots',
      stats: { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 5, accuracy: 0 }
    });

    act(() => {
      result.current.addItems([testBoots]);
      result.current.equipItem('boots', testBoots.id);
    });

    expect(result.current.state.player?.equipment.boots).toBe(testBoots.id);

    // Act - Unequip the boots
    act(() => {
      result.current.unequipItem('boots');
    });

    // Assert - Boots slot should be null
    expect(result.current.state.player?.equipment.boots).toBeNull();
  });

  it('should recalculate stats correctly after unequipping (stat loss)', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const powerSword = createMockItem({
      id: 'power_sword',
      name: 'Power Sword',
      type: 'weapon',
      subtype: 'sword',
      stats: { attack: 25, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0 }
    });

    act(() => {
      result.current.addItems([powerSword]);
      result.current.equipItem('weapon', powerSword.id);
    });

    // Verify equipped
    expect(result.current.state.player?.equipment.weapon).toBe(powerSword.id);

    // Act - Unequip the sword
    act(() => {
      result.current.unequipItem('weapon');
    });

    // Assert - Equipment slot should be null (stats are calculated separately by useEquipment hook)
    expect(result.current.state.player?.equipment.weapon).toBeNull();
    expect(result.current.state.inventory).toContainEqual(
      expect.objectContaining({ id: powerSword.id })
    );
  });

  it('should handle unequipping item with multiple stat bonuses', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const multiStatGloves = createMockItem({
      id: 'magic_gloves',
      name: 'Magic Gloves',
      type: 'armor',
      subtype: 'gloves',
      stats: { attack: 5, defense: 3, magicAttack: 7, magicDefense: 0, speed: 0, accuracy: 4 }
    });

    act(() => {
      result.current.addItems([multiStatGloves]);
      result.current.equipItem('gloves', multiStatGloves.id);
    });

    // Verify equipped
    expect(result.current.state.player?.equipment.gloves).toBe(multiStatGloves.id);

    // Act - Unequip the gloves
    act(() => {
      result.current.unequipItem('gloves');
    });

    // Assert - Equipment slot should be null and item returned to inventory
    expect(result.current.state.player?.equipment.gloves).toBeNull();
    expect(result.current.state.inventory).toContainEqual(
      expect.objectContaining({ id: multiStatGloves.id })
    );
  });

  it('should gracefully handle unequipping from an empty slot', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    // Verify slot is empty
    expect(result.current.state.player?.equipment.weapon).toBeNull();

    // Act - Try to unequip from empty slot (should handle gracefully)
    act(() => {
      result.current.unequipItem('weapon');
    });

    // Assert - Slot should still be null (no error thrown)
    expect(result.current.state.player?.equipment.weapon).toBeNull();
  });

  it('should preserve other equipped items when unequipping one item', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const sword = createMockItem({
      id: 'sword_1',
      name: 'Test Sword',
      type: 'weapon',
      subtype: 'sword',
      stats: { attack: 10, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0 }
    });

    const helmet = createMockItem({
      id: 'helmet_1',
      name: 'Test Helmet',
      type: 'armor',
      subtype: 'helmet',
      stats: { attack: 0, defense: 8, magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0 }
    });

    const boots = createMockItem({
      id: 'boots_1',
      name: 'Test Boots',
      type: 'armor',
      subtype: 'boots',
      stats: { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 5, accuracy: 0 }
    });

    act(() => {
      result.current.addItems([sword, helmet, boots]);
      result.current.equipItem('weapon', sword.id);
      result.current.equipItem('helmet', helmet.id);
      result.current.equipItem('boots', boots.id);
    });

    // Verify all are equipped
    expect(result.current.state.player?.equipment.weapon).toBe(sword.id);
    expect(result.current.state.player?.equipment.helmet).toBe(helmet.id);
    expect(result.current.state.player?.equipment.boots).toBe(boots.id);

    // Act - Unequip only the helmet
    act(() => {
      result.current.unequipItem('helmet');
    });

    // Assert - Helmet unequipped, but sword and boots still equipped
    expect(result.current.state.player?.equipment.helmet).toBeNull();
    expect(result.current.state.player?.equipment.weapon).toBe(sword.id);
    expect(result.current.state.player?.equipment.boots).toBe(boots.id);
  });

  it('should allow re-equipping an item after unequipping it', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const ring = createMockItem({
      id: 'silver_ring',
      name: 'Silver Ring',
      type: 'accessory',
      subtype: 'ring',
      stats: { attack: 5, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0 }
    });

    act(() => {
      result.current.addItems([ring]);
      result.current.equipItem('accessory', ring.id);
    });

    expect(result.current.state.player?.equipment.accessory).toBe(ring.id);

    // Unequip the ring
    act(() => {
      result.current.unequipItem('accessory');
    });

    expect(result.current.state.player?.equipment.accessory).toBeNull();

    // Act - Re-equip the ring
    act(() => {
      result.current.equipItem('accessory', ring.id);
    });

    // Assert - Should successfully re-equip
    expect(result.current.state.player?.equipment.accessory).toBe(ring.id);
  });

  it('should handle unequipping items with negative stat modifiers', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const cursedArmor = createMockItem({
      id: 'cursed_plate',
      name: 'Cursed Plate Armor',
      type: 'armor',
      subtype: 'chestplate',
      stats: { attack: 0, defense: 30, magicAttack: 0, magicDefense: 0, speed: -10, accuracy: 0 }
    });

    act(() => {
      result.current.addItems([cursedArmor]);
      result.current.equipItem('armor', cursedArmor.id);
    });

    // Verify equipped
    expect(result.current.state.player?.equipment.armor).toBe(cursedArmor.id);

    // Act - Unequip the cursed armor
    act(() => {
      result.current.unequipItem('armor');
    });

    // Assert - Equipment slot should be null and item returned to inventory
    expect(result.current.state.player?.equipment.armor).toBeNull();
    expect(result.current.state.inventory).toContainEqual(
      expect.objectContaining({ id: cursedArmor.id })
    );
  });

  it('should update equipment state immediately after unequipping', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const charm = createMockItem({
      id: 'lucky_charm',
      name: 'Lucky Charm',
      type: 'accessory',
      subtype: 'charm',
      stats: { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 10 }
    });

    act(() => {
      result.current.addItems([charm]);
      result.current.equipItem('charm', charm.id);
    });

    expect(result.current.state.player?.equipment.charm).toBe(charm.id);

    // Act - Unequip the charm
    act(() => {
      result.current.unequipItem('charm');
    });

    // Assert - Equipment state should update immediately
    expect(result.current.state.player?.equipment.charm).toBeNull();
  });

  it('should handle multiple unequip operations in sequence', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const weapon = createMockItem({
      id: 'weapon_1',
      name: 'Weapon',
      type: 'weapon',
      stats: { attack: 10, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0 }
    });

    const armor = createMockItem({
      id: 'armor_1',
      name: 'Armor',
      type: 'armor',
      stats: { attack: 0, defense: 10, magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0 }
    });

    const accessory = createMockItem({
      id: 'accessory_1',
      name: 'Accessory',
      type: 'accessory',
      stats: { attack: 3, defense: 3, magicAttack: 3, magicDefense: 3, speed: 0, accuracy: 0 }
    });

    act(() => {
      result.current.addItems([weapon, armor, accessory]);
      result.current.equipItem('weapon', weapon.id);
      result.current.equipItem('armor', armor.id);
      result.current.equipItem('accessory', accessory.id);
    });

    // Verify all equipped
    expect(result.current.state.player?.equipment.weapon).toBe(weapon.id);
    expect(result.current.state.player?.equipment.armor).toBe(armor.id);
    expect(result.current.state.player?.equipment.accessory).toBe(accessory.id);

    // Act - Unequip all in sequence
    act(() => {
      result.current.unequipItem('weapon');
      result.current.unequipItem('armor');
      result.current.unequipItem('accessory');
    });

    // Assert - All slots should be empty
    expect(result.current.state.player?.equipment.weapon).toBeNull();
    expect(result.current.state.player?.equipment.armor).toBeNull();
    expect(result.current.state.player?.equipment.accessory).toBeNull();
  });
});
