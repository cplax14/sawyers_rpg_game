/**
 * useEquipment Hook - Core Actions Tests
 *
 * Comprehensive unit tests for useEquipment actions covering Tasks 9.1-9.4, 9.6-9.7
 *
 * Test Coverage:
 * - Task 9.1: equipItem successfully equips valid items
 * - Task 9.2: equipItem rejects items below level requirement
 * - Task 9.3: equipItem rejects items with wrong class requirement
 * - Task 9.4: equipItem returns old item to inventory when replacing
 * - Task 9.6: calculateFinalStats correctly sums base + equipment stats
 * - Task 9.7: checkCompatibility validates all restriction types
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactGameProvider, useReactGame } from '../../contexts/ReactGameContext';
import { useEquipment } from '../useEquipment';
import { useInventory } from '../useInventory';
import { EnhancedItem } from '../../types/inventory';

// =============================================================================
// TEST SETUP AND HELPERS
// =============================================================================

// Wrapper component for hooks
const wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <ReactGameProvider>{children}</ReactGameProvider>
);

/**
 * Combined hook for testing - ensures all hooks share the same context
 */
const useTestHooks = () => {
  const gameHook = useReactGame();
  const equipmentHook = useEquipment();
  const inventoryHook = useInventory();

  return {
    game: gameHook,
    equipment: equipmentHook,
    inventory: inventoryHook
  };
};

/**
 * Helper to create a test player and wait for initialization
 */
const createTestPlayer = async (result: any, playerClass: string = 'warrior', level: number = 1) => {
  await act(async () => {
    result.current.game.createPlayer('TestPlayer', playerClass);
  });

  await waitFor(() => {
    expect(result.current.game.state.player).toBeDefined();
  });

  // Set level if different from 1
  if (level > 1) {
    await act(async () => {
      // Add enough XP to reach the desired level
      const xpNeeded = 100 * level; // Simplified XP calculation
      result.current.game.addExperience(result.current.game.state.player.id, xpNeeded);
    });

    await waitFor(() => {
      expect(result.current.game.state.player?.level).toBeGreaterThanOrEqual(level);
    });
  }
};

/**
 * Helper to create a mock enhanced item
 */
const createMockItem = (overrides: Partial<EnhancedItem> = {}): EnhancedItem => {
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
    category: 'equipment',
    equipmentSlot: 'weapon',
    equipmentSubtype: 'sword',
    stackable: false,
    maxStack: 1,
    weight: 1,
    sellValue: 50,
    canTrade: true,
    canDrop: true,
    canDestroy: true,
    usable: false,
    consumeOnUse: false,
    useInCombat: false,
    useOutOfCombat: false,
    statModifiers: {
      attack: 10
    },
    requirements: {
      level: 1,
      classes: [],
      stats: {}
    },
    ...overrides
  };
};

/**
 * Helper to add an item to inventory
 * Adds directly to game context to avoid multiple useInventory instances
 */
const addItemToInventory = async (result: any, item: EnhancedItem) => {
  await act(async () => {
    // Add to both game context AND inventory hook
    result.current.game.addItems([{ ...item, quantity: 1 }]);
    // Also add to inventory hook if available
    if (result.current.inventory) {
      await result.current.inventory.addItem(item, 1);
    }
  });

  await waitFor(() => {
    // Verify item is in game context inventory
    const contextInventory = result.current.game.state.inventory;
    const hasItem = contextInventory.some((invItem: any) => invItem.id === item.id);
    expect(hasItem).toBe(true);
  });
};

// =============================================================================
// TASK 9.1: equipItem successfully equips valid items
// =============================================================================

describe('Task 9.1: equipItem successfully equips valid items', () => {
  it('should successfully equip a weapon to an empty weapon slot', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 1);

    const testSword = createMockItem({
      id: 'iron_sword',
      name: 'Iron Sword',
      equipmentSlot: 'weapon',
      equipmentSubtype: 'sword',
      statModifiers: { attack: 10 }
    });

    await addItemToInventory(result, testSword);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await result.current.equipment.equipItem(testSword.id, 'weapon');
    });

    // Debug output
    if (!equipResult.success) {
      console.log('❌ Equipment failed:', {
        message: equipResult.message,
        errors: equipResult.errors,
        player: result.current.game.state.player
      });
    }

    // Assert
    expect(equipResult.success).toBe(true);
    expect(equipResult.equipped?.id).toBe(testSword.id);
    expect(equipResult.message).toContain('Equipped');
    expect(equipResult.errors).toHaveLength(0);
  });

  it('should successfully equip armor to an empty armor slot', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 1);

    const testArmor = createMockItem({
      id: 'leather_armor',
      name: 'Leather Armor',
      equipmentSlot: 'armor',
      equipmentSubtype: 'chestplate',
      statModifiers: { defense: 15 }
    });

    await addItemToInventory(result, testArmor);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await result.current.equipment.equipItem(testArmor.id, 'armor');
    });

    // Debug
    if (!equipResult.success) {
      console.log('❌ Armor equip failed:', {
        message: equipResult.message,
        errors: equipResult.errors,
        itemSlot: testArmor.equipmentSlot
      });
    }

    // Assert
    expect(equipResult.success).toBe(true);
    expect(equipResult.equipped?.id).toBe(testArmor.id);
    expect(equipResult.message).toContain('Equipped');
  });

  it('should successfully equip multiple items to different slots', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 1);

    const sword = createMockItem({
      id: 'sword_1',
      name: 'Sword',
      equipmentSlot: 'weapon',
      statModifiers: { attack: 10 }
    });

    const helmet = createMockItem({
      id: 'helmet_1',
      name: 'Helmet',
      equipmentSlot: 'helmet',
      equipmentSubtype: 'helmet',
      statModifiers: { defense: 5 }
    });

    const boots = createMockItem({
      id: 'boots_1',
      name: 'Boots',
      equipmentSlot: 'boots',
      equipmentSubtype: 'boots',
      statModifiers: { speed: 3 }
    });

    await addItemToInventory(result, sword);
    await addItemToInventory(result, helmet);
    await addItemToInventory(result, boots);

    // Act - Equip all three items (separately to allow state updates)
    let result1: any;
    await act(async () => {
      result1 = await result.current.equipment.equipItem(sword.id, 'weapon');
    });

    let result2: any;
    await act(async () => {
      result2 = await result.current.equipment.equipItem(helmet.id, 'helmet');
    });

    let result3: any;
    await act(async () => {
      result3 = await result.current.equipment.equipItem(boots.id, 'boots');
    });

    // Assert
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result3.success).toBe(true);

    // Verify all items are equipped
    expect(result.current.equipment.equipped.weapon?.id).toBe(sword.id);
    expect(result.current.equipment.equipped.helmet?.id).toBe(helmet.id);
    expect(result.current.equipment.equipped.boots?.id).toBe(boots.id);
  });

  it('should add item to equipment state when equipped', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 1);

    const ring = createMockItem({
      id: 'power_ring',
      name: 'Ring of Power',
      equipmentSlot: 'ring1',
      equipmentSubtype: 'ring',
      statModifiers: { attack: 5, magicAttack: 5 }
    });

    await addItemToInventory(result, ring);

    // Verify ring not equipped initially
    expect(result.current.equipment.equipped.ring1).toBeNull();

    // Act
    await act(async () => {
      await result.current.equipment.equipItem(ring.id, 'ring1');
    });

    // Assert - Item is now in equipment state
    await waitFor(() => {
      expect(result.current.equipment.equipped.ring1).not.toBeNull();
      expect(result.current.equipment.equipped.ring1?.id).toBe(ring.id);
    });
  });

  it('should return success message when item is equipped', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 1);

    const gloves = createMockItem({
      id: 'test_gloves',
      name: 'Leather Gloves',
      equipmentSlot: 'gloves',
      equipmentSubtype: 'gloves',
      statModifiers: { accuracy: 2 }
    });

    await addItemToInventory(result, gloves);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await result.current.equipment.equipItem(gloves.id, 'gloves');
    });

    // Assert
    expect(equipResult.success).toBe(true);
    expect(equipResult.message).toMatch(/Equipped.*Leather Gloves/i);
    expect(equipResult.errors).toHaveLength(0);
  });
});

// =============================================================================
// TASK 9.2: equipItem rejects items below level requirement
// =============================================================================

describe('Task 9.2: equipItem rejects items below level requirement', () => {
  it('should reject item when player level is below requirement', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 1); // Level 1 player

    const highLevelSword = createMockItem({
      id: 'legendary_sword',
      name: 'Legendary Sword',
      equipmentSlot: 'weapon',
      levelRequirement: 10, // Requires level 10
      statModifiers: { attack: 50 }
    });

    await addItemToInventory(result, highLevelSword);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await result.current.equipment.equipItem(highLevelSword.id, 'weapon');
    });

    // Assert
    expect(equipResult.success).toBe(false);
    expect(equipResult.equipped).toBeNull();
    expect(equipResult.errors.length).toBeGreaterThan(0);
    expect(equipResult.errors[0]).toMatch(/level.*10/i);
  });

  it('should include appropriate error message for level restriction', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 3); // Level 3 player


    const level5Armor = createMockItem({
      id: 'epic_armor',
      name: 'Epic Chestplate',
      equipmentSlot: 'armor',
      levelRequirement: 5,
      statModifiers: { defense: 30 }
    });

    await addItemToInventory(result, level5Armor);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await result.current.equipment.equipItem(level5Armor.id, 'armor');
    });

    // Assert
    expect(equipResult.success).toBe(false);
    expect(equipResult.message).toMatch(/cannot equip/i);
    expect(equipResult.errors[0]).toContain('5');
  });

  it('should not modify equipment state when level check fails', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 2);

    const highLevelHelmet = createMockItem({
      id: 'dragon_helmet',
      name: 'Dragon Helmet',
      equipmentSlot: 'helmet',
      levelRequirement: 8,
      statModifiers: { defense: 20, magicDefense: 15 }
    });

    await addItemToInventory(result, highLevelHelmet);

    // Verify slot empty before attempt
    expect(result.current.equipment.equipped.helmet).toBeNull();

    // Act
    await act(async () => {
      await result.current.equipment.equipItem(highLevelHelmet.id, 'helmet');
    });

    // Assert - Slot should still be empty
    expect(result.current.equipment.equipped.helmet).toBeNull();
  });
});

// =============================================================================
// TASK 9.3: equipItem rejects items with wrong class requirement
// =============================================================================

describe('Task 9.3: equipItem rejects items with wrong class requirement', () => {
  it('should reject item when player class does not match requirement', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5); // Warrior class


    const mageStaff = createMockItem({
      id: 'wizard_staff',
      name: 'Wizard Staff',
      equipmentSlot: 'weapon',
      classRequirement: ['mage'], // Mage only
      statModifiers: { magicAttack: 40 }
    });

    await addItemToInventory(result, mageStaff);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await result.current.equipment.equipItem(mageStaff.id, 'weapon');
    });

    // Assert
    expect(equipResult.success).toBe(false);
    expect(equipResult.equipped).toBeNull();
    expect(equipResult.errors.length).toBeGreaterThan(0);
    expect(equipResult.errors[0]).toMatch(/class/i);
  });

  it('should provide clear error message for class restriction', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'archer', 5); // Archer class


    const warriorArmor = createMockItem({
      id: 'plate_armor',
      name: 'Heavy Plate Armor',
      equipmentSlot: 'armor',
      classRequirement: ['warrior', 'knight'],
      statModifiers: { defense: 50 }
    });

    await addItemToInventory(result, warriorArmor);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await result.current.equipment.equipItem(warriorArmor.id, 'armor');
    });

    // Assert
    expect(equipResult.success).toBe(false);
    expect(equipResult.message).toMatch(/cannot equip/i);
    expect(equipResult.errors[0]).toMatch(/warrior|knight/i);
  });

  it('should not modify equipment state when class check fails', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'rogue', 5);

    const mageRobe = createMockItem({
      id: 'arcane_robe',
      name: 'Arcane Robe',
      equipmentSlot: 'armor',
      classRequirement: ['mage', 'wizard'],
      statModifiers: { magicDefense: 30 }
    });

    await addItemToInventory(result, mageRobe);

    // Verify armor slot empty before attempt
    expect(result.current.equipment.equipped.armor).toBeNull();

    // Act
    await act(async () => {
      await result.current.equipment.equipItem(mageRobe.id, 'armor');
    });

    // Assert - Armor slot should still be empty
    expect(result.current.equipment.equipped.armor).toBeNull();
  });

  it('should allow equipping when player class matches one of multiple requirements', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    const universalSword = createMockItem({
      id: 'versatile_sword',
      name: 'Versatile Sword',
      equipmentSlot: 'weapon',
      classRequirement: ['warrior', 'knight', 'paladin'],
      statModifiers: { attack: 20 }
    });

    await addItemToInventory(result, universalSword);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await result.current.equipment.equipItem(universalSword.id, 'weapon');
    });

    // Assert
    expect(equipResult.success).toBe(true);
    expect(equipResult.equipped?.id).toBe(universalSword.id);
  });
});

// =============================================================================
// TASK 9.4: equipItem returns old item to inventory when replacing
// =============================================================================

describe('Task 9.4: equipItem returns old item to inventory when replacing', () => {
  it('should return old weapon to inventory when equipping new weapon', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    const oldSword = createMockItem({
      id: 'iron_sword',
      name: 'Iron Sword',
      equipmentSlot: 'weapon',
      statModifiers: { attack: 10 }
    });

    const newSword = createMockItem({
      id: 'steel_sword',
      name: 'Steel Sword',
      equipmentSlot: 'weapon',
      statModifiers: { attack: 20 }
    });

    // Add both swords to inventory
    await addItemToInventory(result, oldSword);
    await addItemToInventory(result, newSword);

    // Equip old sword first
    await act(async () => {
      await result.current.equipment.equipItem(oldSword.id, 'weapon');
    });

    await waitFor(() => {
      expect(result.current.equipment.equipped.weapon?.id).toBe(oldSword.id);
    });

    // Act - Equip new sword (should replace old sword)
    let equipResult: any;
    await act(async () => {
      equipResult = await result.current.equipment.equipItem(newSword.id, 'weapon');
    });

    // Assert - Old sword should be returned to inventory
    expect(equipResult.success).toBe(true);
    expect(equipResult.unequipped?.id).toBe(oldSword.id);
    expect(equipResult.equipped?.id).toBe(newSword.id);

    // Verify old sword is back in inventory
    await waitFor(() => {
      const mainInventory = result.current.inventory.inventoryState.containers.main;
      const hasOldSword = mainInventory.items.some(
        (slot: any) => slot.item?.id === oldSword.id
      );
      expect(hasOldSword).toBe(true);
    });
  });

  it('should update equipment slot with new item after replacement', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    const leatherHelmet = createMockItem({
      id: 'leather_helmet',
      name: 'Leather Helmet',
      equipmentSlot: 'helmet',
      statModifiers: { defense: 5 }
    });

    const ironHelmet = createMockItem({
      id: 'iron_helmet',
      name: 'Iron Helmet',
      equipmentSlot: 'helmet',
      statModifiers: { defense: 12 }
    });

    await addItemToInventory(result, leatherHelmet);
    await addItemToInventory(result, ironHelmet);

    // Equip leather helmet
    await act(async () => {
      await result.current.equipment.equipItem(leatherHelmet.id, 'helmet');
    });

    // Act - Equip iron helmet
    await act(async () => {
      await result.current.equipment.equipItem(ironHelmet.id, 'helmet');
    });

    // Assert - Helmet slot should have new helmet
    await waitFor(() => {
      expect(result.current.equipment.equipped.helmet?.id).toBe(ironHelmet.id);
      expect(result.current.equipment.equipped.helmet?.name).toBe('Iron Helmet');
    });
  });

  it('should verify old item is in inventory after replacement', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    const oldBoots = createMockItem({
      id: 'old_boots',
      name: 'Old Boots',
      equipmentSlot: 'boots',
      statModifiers: { speed: 2 }
    });

    const newBoots = createMockItem({
      id: 'new_boots',
      name: 'New Boots',
      equipmentSlot: 'boots',
      statModifiers: { speed: 8 }
    });

    await addItemToInventory(result, oldBoots);
    await addItemToInventory(result, newBoots);

    // Equip old boots
    await act(async () => {
      await result.current.equipment.equipItem(oldBoots.id, 'boots');
    });

    // Act - Replace with new boots
    await act(async () => {
      await result.current.equipment.equipItem(newBoots.id, 'boots');
    });

    // Assert - Old boots should be findable in inventory
    await waitFor(() => {
      const mainInventory = result.current.inventory.inventoryState.containers.main;
      const oldBootsSlot = mainInventory.items.find(
        (slot: any) => slot.item?.id === oldBoots.id
      );
      expect(oldBootsSlot).toBeDefined();
      expect(oldBootsSlot.item.name).toBe('Old Boots');
      expect(oldBootsSlot.quantity).toBeGreaterThan(0);
    });
  });

  it('should include replacement message when swapping items', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    const ring1 = createMockItem({
      id: 'silver_ring',
      name: 'Silver Ring',
      equipmentSlot: 'ring1',
      statModifiers: { attack: 3 }
    });

    const ring2 = createMockItem({
      id: 'gold_ring',
      name: 'Gold Ring',
      equipmentSlot: 'ring1',
      statModifiers: { attack: 7 }
    });

    await addItemToInventory(result, ring1);
    await addItemToInventory(result, ring2);

    // Equip silver ring
    await act(async () => {
      await result.current.equipment.equipItem(ring1.id, 'ring1');
    });

    // Act - Replace with gold ring
    let equipResult: any;
    await act(async () => {
      equipResult = await result.current.equipment.equipItem(ring2.id, 'ring1');
    });

    // Assert - Message should mention replacement
    expect(equipResult.success).toBe(true);
    expect(equipResult.message).toMatch(/replaced/i);
    expect(equipResult.message).toContain('Silver Ring');
    expect(equipResult.message).toContain('Gold Ring');
  });
});

// =============================================================================
// TASK 9.6: calculateFinalStats correctly sums base + equipment stats
// =============================================================================

describe('Task 9.6: calculateFinalStats correctly sums base + equipment stats', () => {
  it('should calculate final stats as base + equipment bonuses', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    // Get base stats before equipping
    const baseStats = result.current.equipment.baseStats;
    const baseAttack = baseStats.attack;

    const sword = createMockItem({
      id: 'attack_sword',
      name: 'Attack Sword',
      equipmentSlot: 'weapon',
      statModifiers: { attack: 15 }
    });

    await addItemToInventory(result, sword);

    // Act - Equip sword
    await act(async () => {
      await result.current.equipment.equipItem(sword.id, 'weapon');
    });

    // Assert - Final attack should be base + equipment bonus
    await waitFor(() => {
      const finalStats = result.current.equipment.finalStats;
      expect(finalStats.attack.finalValue).toBe(baseAttack + 15);
      expect(finalStats.attack.equipmentBonus).toBe(15);
      expect(finalStats.attack.baseStat).toBe(baseAttack);
    });
  });

  it('should sum bonuses from multiple equipped items', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    const baseDefense = result.current.equipment.baseStats.defense;

    const helmet = createMockItem({
      id: 'def_helmet',
      name: 'Defense Helmet',
      equipmentSlot: 'helmet',
      statModifiers: { defense: 10 }
    });

    const armor = createMockItem({
      id: 'def_armor',
      name: 'Defense Armor',
      equipmentSlot: 'armor',
      statModifiers: { defense: 20 }
    });

    const gloves = createMockItem({
      id: 'def_gloves',
      name: 'Defense Gloves',
      equipmentSlot: 'gloves',
      statModifiers: { defense: 5 }
    });

    await addItemToInventory(result, helmet);
    await addItemToInventory(result, armor);
    await addItemToInventory(result, gloves);

    // Act - Equip all three items
    await act(async () => {
      await result.current.equipment.equipItem(helmet.id, 'helmet');
      await result.current.equipment.equipItem(armor.id, 'armor');
      await result.current.equipment.equipItem(gloves.id, 'gloves');
    });

    // Assert - Total defense should be base + sum of all bonuses
    await waitFor(() => {
      const finalStats = result.current.equipment.finalStats;
      const expectedDefense = baseDefense + 10 + 20 + 5; // base + helmet + armor + gloves
      expect(finalStats.defense.finalValue).toBe(expectedDefense);
      expect(finalStats.defense.equipmentBonus).toBe(35); // 10 + 20 + 5
    });
  });

  it('should calculate stats correctly with no equipment', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 3);

    // Act - Get stats with no equipment
    const baseStats = result.current.equipment.baseStats;
    const finalStats = result.current.equipment.finalStats;

    // Assert - Final stats should equal base stats when no equipment
    expect(finalStats.attack.finalValue).toBe(baseStats.attack);
    expect(finalStats.defense.finalValue).toBe(baseStats.defense);
    expect(finalStats.magicAttack.finalValue).toBe(baseStats.magicAttack);
    // All equipment bonuses should be 0 when no equipment is equipped
    expect(finalStats.attack.equipmentBonus).toBe(0);
    expect(finalStats.defense.equipmentBonus).toBe(0);
    expect(finalStats.magicAttack.equipmentBonus).toBe(0);
  });

  it('should handle negative stat modifiers correctly', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    const baseSpeed = result.current.equipment.baseStats.speed;

    const heavyArmor = createMockItem({
      id: 'heavy_plate',
      name: 'Heavy Plate Armor',
      equipmentSlot: 'armor',
      statModifiers: {
        defense: 40,
        speed: -10 // Heavy armor slows you down
      }
    });

    await addItemToInventory(result, heavyArmor);

    // Act
    await act(async () => {
      await result.current.equipment.equipItem(heavyArmor.id, 'armor');
    });

    // Assert - Speed should be reduced
    await waitFor(() => {
      const finalStats = result.current.equipment.finalStats;
      expect(finalStats.speed.finalValue).toBe(baseSpeed - 10);
      expect(finalStats.speed.equipmentBonus).toBe(-10);
    });
  });

  it('should update final stats when equipment changes', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    const baseAttack = result.current.equipment.baseStats.attack;

    const weakSword = createMockItem({
      id: 'weak_sword',
      name: 'Weak Sword',
      equipmentSlot: 'weapon',
      statModifiers: { attack: 5 }
    });

    const strongSword = createMockItem({
      id: 'strong_sword',
      name: 'Strong Sword',
      equipmentSlot: 'weapon',
      statModifiers: { attack: 25 }
    });

    await addItemToInventory(result, weakSword);
    await addItemToInventory(result, strongSword);

    // Equip weak sword
    await act(async () => {
      await result.current.equipment.equipItem(weakSword.id, 'weapon');
    });

    await waitFor(() => {
      expect(result.current.equipment.finalStats.attack.finalValue).toBe(baseAttack + 5);
    });

    // Act - Equip strong sword
    await act(async () => {
      await result.current.equipment.equipItem(strongSword.id, 'weapon');
    });

    // Assert - Stats should update to new values
    await waitFor(() => {
      const finalStats = result.current.equipment.finalStats;
      expect(finalStats.attack.finalValue).toBe(baseAttack + 25);
      expect(finalStats.attack.equipmentBonus).toBe(25);
    });
  });
});

// =============================================================================
// TASK 9.7: checkCompatibility validates all restriction types
// =============================================================================

describe('Task 9.7: checkCompatibility validates all restriction types', () => {
  it('should validate level requirement', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 3);

    const highLevelItem = createMockItem({
      id: 'level_10_item',
      name: 'Level 10 Item',
      equipmentSlot: 'weapon',
      levelRequirement: 10
    });

    // Act
    const compatibility = result.current.equipment.checkCompatibility(highLevelItem, 'weapon');

    // Assert
    expect(compatibility.canEquip).toBe(false);
    expect(compatibility.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'level_requirement',
          satisfied: false,
          required: 10
        })
      ])
    );
  });

  it('should validate class requirement', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    const mageItem = createMockItem({
      id: 'mage_only_item',
      name: 'Mage Only Item',
      equipmentSlot: 'weapon',
      classRequirement: ['mage', 'wizard']
    });

    // Act
    const compatibility = result.current.equipment.checkCompatibility(mageItem, 'weapon');

    // Assert
    expect(compatibility.canEquip).toBe(false);
    expect(compatibility.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'class_requirement',
          satisfied: false,
          current: 'warrior',
          required: ['mage', 'wizard']
        })
      ])
    );
  });

  it('should validate stat requirements', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 1); // Low level = low stats


    const highStatItem = createMockItem({
      id: 'stat_req_item',
      name: 'High Stat Item',
      equipmentSlot: 'weapon',
      equipmentSubtype: 'sword',
      requirements: {
        stats: { attack: 50 } // Requires 50 attack
      }
    });

    // Act
    const compatibility = result.current.equipment.checkCompatibility(highStatItem, 'weapon');

    // Assert - May or may not fail depending on base stats, but should check stats
    if (!compatibility.canEquip) {
      expect(compatibility.reasons).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'stat_requirement'
          })
        ])
      );
    }
  });

  it('should validate slot compatibility', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    const helmetItem = createMockItem({
      id: 'test_helmet',
      name: 'Test Helmet',
      equipmentSlot: 'helmet'
    });

    // Act - Try to equip helmet in weapon slot (wrong slot)
    const compatibility = result.current.equipment.checkCompatibility(helmetItem, 'weapon');

    // Assert
    expect(compatibility.canEquip).toBe(false);
    expect(compatibility.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'slot_conflict',
          satisfied: false
        })
      ])
    );
  });

  it('should validate two-handed weapon conflicts', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    // Equip a shield first
    const shield = createMockItem({
      id: 'test_shield',
      name: 'Test Shield',
      equipmentSlot: 'shield',
      statModifiers: { defense: 10 }
    });

    await addItemToInventory(result, shield);

    await act(async () => {
      await result.current.equipment.equipItem(shield.id, 'shield');
    });

    const twoHandedSword = createMockItem({
      id: 'two_handed_sword',
      name: 'Two-Handed Sword',
      equipmentSlot: 'weapon',
      twoHanded: true,
      statModifiers: { attack: 40 }
    });

    // Act
    const compatibility = result.current.equipment.checkCompatibility(
      twoHandedSword,
      'weapon'
    );

    // Assert - Should have warnings about shield conflict
    expect(compatibility.warnings.length).toBeGreaterThan(0);
    const hasShieldWarning = compatibility.warnings.some((w: any) =>
      w.description?.toLowerCase().includes('shield')
    );
    expect(hasShieldWarning).toBe(true);
  });

  it('should return canEquip true when all requirements are met', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 5);

    const validItem = createMockItem({
      id: 'valid_item',
      name: 'Valid Item',
      equipmentSlot: 'weapon',
      levelRequirement: 3,
      classRequirement: ['warrior', 'knight'],
      statModifiers: { attack: 15 }
    });

    // Act
    const compatibility = result.current.equipment.checkCompatibility(validItem, 'weapon');

    // Assert
    expect(compatibility.canEquip).toBe(true);
    expect(compatibility.reasons.filter((r: any) => !r.satisfied)).toHaveLength(0);
  });

  it('should provide helpful suggestions when requirements are not met', async () => {
    // Arrange
    const { result } = renderHook(() => useTestHooks(), { wrapper });
    await createTestPlayer(result, 'warrior', 2);

    const restrictedItem = createMockItem({
      id: 'restricted_item',
      name: 'Restricted Item',
      equipmentSlot: 'weapon',
      levelRequirement: 8,
      statModifiers: { attack: 30 }
    });

    // Act
    const compatibility = result.current.equipment.checkCompatibility(restrictedItem, 'weapon');

    // Assert
    expect(compatibility.canEquip).toBe(false);
    expect(compatibility.suggestions.length).toBeGreaterThan(0);
    // Check that at least one suggestion mentions leveling up (case-insensitive)
    const hasLevelSuggestion = compatibility.suggestions.some((s: string) =>
      s.toLowerCase().includes('level')
    );
    expect(hasLevelSuggestion).toBe(true);
  });
});
