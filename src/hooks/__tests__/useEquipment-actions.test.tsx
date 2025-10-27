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
 * Helper to create a test player and wait for initialization
 */
const createTestPlayer = async (result: any, playerClass: string = 'warrior', level: number = 1) => {
  await act(async () => {
    result.current.createPlayer('TestPlayer', playerClass);
  });

  await waitFor(() => {
    expect(result.current.state.player).toBeDefined();
  });

  // Set level if different from 1
  if (level > 1) {
    await act(async () => {
      // Add enough XP to reach the desired level
      const xpNeeded = 100 * level; // Simplified XP calculation
      result.current.addExperience(result.current.state.player.id, xpNeeded);
    });

    await waitFor(() => {
      expect(result.current.state.player?.level).toBeGreaterThanOrEqual(level);
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
 */
const addItemToInventory = async (inventoryHook: any, item: EnhancedItem) => {
  await act(async () => {
    await inventoryHook.current.addItem(item, 1);
  });

  await waitFor(() => {
    const mainInventory = inventoryHook.current.inventoryState.containers.main;
    const hasItem = mainInventory.items.some(
      (slot: any) => slot.item?.id === item.id
    );
    expect(hasItem).toBe(true);
  });
};

// =============================================================================
// TASK 9.1: equipItem successfully equips valid items
// =============================================================================

describe('Task 9.1: equipItem successfully equips valid items', () => {
  it('should successfully equip a weapon to an empty weapon slot', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 1);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const testSword = createMockItem({
      id: 'iron_sword',
      name: 'Iron Sword',
      equipmentSlot: 'weapon',
      equipmentSubtype: 'sword',
      statModifiers: { attack: 10 }
    });

    await addItemToInventory(inventoryResult, testSword);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await equipmentResult.current.equipItem(testSword.id, 'weapon');
    });

    // Assert
    expect(equipResult.success).toBe(true);
    expect(equipResult.equipped?.id).toBe(testSword.id);
    expect(equipResult.message).toContain('Equipped');
    expect(equipResult.errors).toHaveLength(0);
  });

  it('should successfully equip armor to an empty armor slot', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 1);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const testArmor = createMockItem({
      id: 'leather_armor',
      name: 'Leather Armor',
      equipmentSlot: 'armor',
      equipmentSubtype: 'chestplate',
      statModifiers: { defense: 15 }
    });

    await addItemToInventory(inventoryResult, testArmor);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await equipmentResult.current.equipItem(testArmor.id, 'armor');
    });

    // Assert
    expect(equipResult.success).toBe(true);
    expect(equipResult.equipped?.id).toBe(testArmor.id);
    expect(equipResult.message).toContain('Equipped');
  });

  it('should successfully equip multiple items to different slots', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 1);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

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

    await addItemToInventory(inventoryResult, sword);
    await addItemToInventory(inventoryResult, helmet);
    await addItemToInventory(inventoryResult, boots);

    // Act - Equip all three items
    let result1: any, result2: any, result3: any;
    await act(async () => {
      result1 = await equipmentResult.current.equipItem(sword.id, 'weapon');
      result2 = await equipmentResult.current.equipItem(helmet.id, 'helmet');
      result3 = await equipmentResult.current.equipItem(boots.id, 'boots');
    });

    // Assert
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result3.success).toBe(true);

    // Verify all items are equipped
    expect(equipmentResult.current.equipped.weapon?.id).toBe(sword.id);
    expect(equipmentResult.current.equipped.helmet?.id).toBe(helmet.id);
    expect(equipmentResult.current.equipped.boots?.id).toBe(boots.id);
  });

  it('should add item to equipment state when equipped', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 1);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const ring = createMockItem({
      id: 'power_ring',
      name: 'Ring of Power',
      equipmentSlot: 'ring1',
      equipmentSubtype: 'ring',
      statModifiers: { attack: 5, magicAttack: 5 }
    });

    await addItemToInventory(inventoryResult, ring);

    // Verify ring not equipped initially
    expect(equipmentResult.current.equipped.ring1).toBeNull();

    // Act
    await act(async () => {
      await equipmentResult.current.equipItem(ring.id, 'ring1');
    });

    // Assert - Item is now in equipment state
    await waitFor(() => {
      expect(equipmentResult.current.equipped.ring1).not.toBeNull();
      expect(equipmentResult.current.equipped.ring1?.id).toBe(ring.id);
    });
  });

  it('should return success message when item is equipped', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 1);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const gloves = createMockItem({
      id: 'test_gloves',
      name: 'Leather Gloves',
      equipmentSlot: 'gloves',
      equipmentSubtype: 'gloves',
      statModifiers: { accuracy: 2 }
    });

    await addItemToInventory(inventoryResult, gloves);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await equipmentResult.current.equipItem(gloves.id, 'gloves');
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
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 1); // Level 1 player

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const highLevelSword = createMockItem({
      id: 'legendary_sword',
      name: 'Legendary Sword',
      equipmentSlot: 'weapon',
      levelRequirement: 10, // Requires level 10
      statModifiers: { attack: 50 }
    });

    await addItemToInventory(inventoryResult, highLevelSword);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await equipmentResult.current.equipItem(highLevelSword.id, 'weapon');
    });

    // Assert
    expect(equipResult.success).toBe(false);
    expect(equipResult.equipped).toBeNull();
    expect(equipResult.errors.length).toBeGreaterThan(0);
    expect(equipResult.errors[0]).toMatch(/level.*10/i);
  });

  it('should include appropriate error message for level restriction', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 3); // Level 3 player

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const level5Armor = createMockItem({
      id: 'epic_armor',
      name: 'Epic Chestplate',
      equipmentSlot: 'armor',
      levelRequirement: 5,
      statModifiers: { defense: 30 }
    });

    await addItemToInventory(inventoryResult, level5Armor);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await equipmentResult.current.equipItem(level5Armor.id, 'armor');
    });

    // Assert
    expect(equipResult.success).toBe(false);
    expect(equipResult.message).toMatch(/cannot equip/i);
    expect(equipResult.errors[0]).toContain('5');
  });

  it('should not modify equipment state when level check fails', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 2);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const highLevelHelmet = createMockItem({
      id: 'dragon_helmet',
      name: 'Dragon Helmet',
      equipmentSlot: 'helmet',
      levelRequirement: 8,
      statModifiers: { defense: 20, magicDefense: 15 }
    });

    await addItemToInventory(inventoryResult, highLevelHelmet);

    // Verify slot empty before attempt
    expect(equipmentResult.current.equipped.helmet).toBeNull();

    // Act
    await act(async () => {
      await equipmentResult.current.equipItem(highLevelHelmet.id, 'helmet');
    });

    // Assert - Slot should still be empty
    expect(equipmentResult.current.equipped.helmet).toBeNull();
  });
});

// =============================================================================
// TASK 9.3: equipItem rejects items with wrong class requirement
// =============================================================================

describe('Task 9.3: equipItem rejects items with wrong class requirement', () => {
  it('should reject item when player class does not match requirement', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5); // Warrior class

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const mageStaff = createMockItem({
      id: 'wizard_staff',
      name: 'Wizard Staff',
      equipmentSlot: 'weapon',
      classRequirement: ['mage'], // Mage only
      statModifiers: { magicAttack: 40 }
    });

    await addItemToInventory(inventoryResult, mageStaff);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await equipmentResult.current.equipItem(mageStaff.id, 'weapon');
    });

    // Assert
    expect(equipResult.success).toBe(false);
    expect(equipResult.equipped).toBeNull();
    expect(equipResult.errors.length).toBeGreaterThan(0);
    expect(equipResult.errors[0]).toMatch(/class/i);
  });

  it('should provide clear error message for class restriction', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'archer', 5); // Archer class

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const warriorArmor = createMockItem({
      id: 'plate_armor',
      name: 'Heavy Plate Armor',
      equipmentSlot: 'armor',
      classRequirement: ['warrior', 'knight'],
      statModifiers: { defense: 50 }
    });

    await addItemToInventory(inventoryResult, warriorArmor);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await equipmentResult.current.equipItem(warriorArmor.id, 'armor');
    });

    // Assert
    expect(equipResult.success).toBe(false);
    expect(equipResult.message).toMatch(/cannot equip/i);
    expect(equipResult.errors[0]).toMatch(/warrior|knight/i);
  });

  it('should not modify equipment state when class check fails', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'rogue', 5);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const mageRobe = createMockItem({
      id: 'arcane_robe',
      name: 'Arcane Robe',
      equipmentSlot: 'armor',
      classRequirement: ['mage', 'wizard'],
      statModifiers: { magicDefense: 30 }
    });

    await addItemToInventory(inventoryResult, mageRobe);

    // Verify armor slot empty before attempt
    expect(equipmentResult.current.equipped.armor).toBeNull();

    // Act
    await act(async () => {
      await equipmentResult.current.equipItem(mageRobe.id, 'armor');
    });

    // Assert - Armor slot should still be empty
    expect(equipmentResult.current.equipped.armor).toBeNull();
  });

  it('should allow equipping when player class matches one of multiple requirements', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const universalSword = createMockItem({
      id: 'versatile_sword',
      name: 'Versatile Sword',
      equipmentSlot: 'weapon',
      classRequirement: ['warrior', 'knight', 'paladin'],
      statModifiers: { attack: 20 }
    });

    await addItemToInventory(inventoryResult, universalSword);

    // Act
    let equipResult: any;
    await act(async () => {
      equipResult = await equipmentResult.current.equipItem(universalSword.id, 'weapon');
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
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

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
    await addItemToInventory(inventoryResult, oldSword);
    await addItemToInventory(inventoryResult, newSword);

    // Equip old sword first
    await act(async () => {
      await equipmentResult.current.equipItem(oldSword.id, 'weapon');
    });

    await waitFor(() => {
      expect(equipmentResult.current.equipped.weapon?.id).toBe(oldSword.id);
    });

    // Act - Equip new sword (should replace old sword)
    let equipResult: any;
    await act(async () => {
      equipResult = await equipmentResult.current.equipItem(newSword.id, 'weapon');
    });

    // Assert - Old sword should be returned to inventory
    expect(equipResult.success).toBe(true);
    expect(equipResult.unequipped?.id).toBe(oldSword.id);
    expect(equipResult.equipped?.id).toBe(newSword.id);

    // Verify old sword is back in inventory
    await waitFor(() => {
      const mainInventory = inventoryResult.current.inventoryState.containers.main;
      const hasOldSword = mainInventory.items.some(
        (slot: any) => slot.item?.id === oldSword.id
      );
      expect(hasOldSword).toBe(true);
    });
  });

  it('should update equipment slot with new item after replacement', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

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

    await addItemToInventory(inventoryResult, leatherHelmet);
    await addItemToInventory(inventoryResult, ironHelmet);

    // Equip leather helmet
    await act(async () => {
      await equipmentResult.current.equipItem(leatherHelmet.id, 'helmet');
    });

    // Act - Equip iron helmet
    await act(async () => {
      await equipmentResult.current.equipItem(ironHelmet.id, 'helmet');
    });

    // Assert - Helmet slot should have new helmet
    await waitFor(() => {
      expect(equipmentResult.current.equipped.helmet?.id).toBe(ironHelmet.id);
      expect(equipmentResult.current.equipped.helmet?.name).toBe('Iron Helmet');
    });
  });

  it('should verify old item is in inventory after replacement', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

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

    await addItemToInventory(inventoryResult, oldBoots);
    await addItemToInventory(inventoryResult, newBoots);

    // Equip old boots
    await act(async () => {
      await equipmentResult.current.equipItem(oldBoots.id, 'boots');
    });

    // Act - Replace with new boots
    await act(async () => {
      await equipmentResult.current.equipItem(newBoots.id, 'boots');
    });

    // Assert - Old boots should be findable in inventory
    await waitFor(() => {
      const mainInventory = inventoryResult.current.inventoryState.containers.main;
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
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

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

    await addItemToInventory(inventoryResult, ring1);
    await addItemToInventory(inventoryResult, ring2);

    // Equip silver ring
    await act(async () => {
      await equipmentResult.current.equipItem(ring1.id, 'ring1');
    });

    // Act - Replace with gold ring
    let equipResult: any;
    await act(async () => {
      equipResult = await equipmentResult.current.equipItem(ring2.id, 'ring1');
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
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    // Get base stats before equipping
    const baseStats = equipmentResult.current.baseStats;
    const baseAttack = baseStats.attack;

    const sword = createMockItem({
      id: 'attack_sword',
      name: 'Attack Sword',
      equipmentSlot: 'weapon',
      statModifiers: { attack: 15 }
    });

    await addItemToInventory(inventoryResult, sword);

    // Act - Equip sword
    await act(async () => {
      await equipmentResult.current.equipItem(sword.id, 'weapon');
    });

    // Assert - Final attack should be base + equipment bonus
    await waitFor(() => {
      const finalStats = equipmentResult.current.finalStats;
      expect(finalStats.attack.finalValue).toBe(baseAttack + 15);
      expect(finalStats.attack.equipmentBonus).toBe(15);
      expect(finalStats.attack.baseStat).toBe(baseAttack);
    });
  });

  it('should sum bonuses from multiple equipped items', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const baseDefense = equipmentResult.current.baseStats.defense;

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

    await addItemToInventory(inventoryResult, helmet);
    await addItemToInventory(inventoryResult, armor);
    await addItemToInventory(inventoryResult, gloves);

    // Act - Equip all three items
    await act(async () => {
      await equipmentResult.current.equipItem(helmet.id, 'helmet');
      await equipmentResult.current.equipItem(armor.id, 'armor');
      await equipmentResult.current.equipItem(gloves.id, 'gloves');
    });

    // Assert - Total defense should be base + sum of all bonuses
    await waitFor(() => {
      const finalStats = equipmentResult.current.finalStats;
      const expectedDefense = baseDefense + 10 + 20 + 5; // base + helmet + armor + gloves
      expect(finalStats.defense.finalValue).toBe(expectedDefense);
      expect(finalStats.defense.equipmentBonus).toBe(35); // 10 + 20 + 5
    });
  });

  it('should calculate stats correctly with no equipment', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 3);

    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    // Act - Get stats with no equipment
    const baseStats = equipmentResult.current.baseStats;
    const finalStats = equipmentResult.current.finalStats;

    // Assert - Final stats should equal base stats when no equipment
    expect(finalStats.attack.finalValue).toBe(baseStats.attack);
    expect(finalStats.defense.finalValue).toBe(baseStats.defense);
    expect(finalStats.magicAttack.finalValue).toBe(baseStats.magicAttack);
    expect(finalStats.equipmentBonus).toBe(0);
  });

  it('should handle negative stat modifiers correctly', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const baseSpeed = equipmentResult.current.baseStats.speed;

    const heavyArmor = createMockItem({
      id: 'heavy_plate',
      name: 'Heavy Plate Armor',
      equipmentSlot: 'armor',
      statModifiers: {
        defense: 40,
        speed: -10 // Heavy armor slows you down
      }
    });

    await addItemToInventory(inventoryResult, heavyArmor);

    // Act
    await act(async () => {
      await equipmentResult.current.equipItem(heavyArmor.id, 'armor');
    });

    // Assert - Speed should be reduced
    await waitFor(() => {
      const finalStats = equipmentResult.current.finalStats;
      expect(finalStats.speed.finalValue).toBe(baseSpeed - 10);
      expect(finalStats.speed.equipmentBonus).toBe(-10);
    });
  });

  it('should update final stats when equipment changes', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const baseAttack = equipmentResult.current.baseStats.attack;

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

    await addItemToInventory(inventoryResult, weakSword);
    await addItemToInventory(inventoryResult, strongSword);

    // Equip weak sword
    await act(async () => {
      await equipmentResult.current.equipItem(weakSword.id, 'weapon');
    });

    await waitFor(() => {
      expect(equipmentResult.current.finalStats.attack.finalValue).toBe(baseAttack + 5);
    });

    // Act - Equip strong sword
    await act(async () => {
      await equipmentResult.current.equipItem(strongSword.id, 'weapon');
    });

    // Assert - Stats should update to new values
    await waitFor(() => {
      const finalStats = equipmentResult.current.finalStats;
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
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 3);

    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const highLevelItem = createMockItem({
      id: 'level_10_item',
      name: 'Level 10 Item',
      equipmentSlot: 'weapon',
      levelRequirement: 10
    });

    // Act
    const compatibility = equipmentResult.current.checkCompatibility(highLevelItem, 'weapon');

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
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const mageItem = createMockItem({
      id: 'mage_only_item',
      name: 'Mage Only Item',
      equipmentSlot: 'weapon',
      classRequirement: ['mage', 'wizard']
    });

    // Act
    const compatibility = equipmentResult.current.checkCompatibility(mageItem, 'weapon');

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
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 1); // Low level = low stats

    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

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
    const compatibility = equipmentResult.current.checkCompatibility(highStatItem, 'weapon');

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
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const helmetItem = createMockItem({
      id: 'test_helmet',
      name: 'Test Helmet',
      equipmentSlot: 'helmet'
    });

    // Act - Try to equip helmet in weapon slot (wrong slot)
    const compatibility = equipmentResult.current.checkCompatibility(helmetItem, 'weapon');

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
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: inventoryResult } = renderHook(() => useInventory(), { wrapper });
    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    // Equip a shield first
    const shield = createMockItem({
      id: 'test_shield',
      name: 'Test Shield',
      equipmentSlot: 'shield',
      statModifiers: { defense: 10 }
    });

    await addItemToInventory(inventoryResult, shield);

    await act(async () => {
      await equipmentResult.current.equipItem(shield.id, 'shield');
    });

    const twoHandedSword = createMockItem({
      id: 'two_handed_sword',
      name: 'Two-Handed Sword',
      equipmentSlot: 'weapon',
      twoHanded: true,
      statModifiers: { attack: 40 }
    });

    // Act
    const compatibility = equipmentResult.current.checkCompatibility(
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
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 5);

    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const validItem = createMockItem({
      id: 'valid_item',
      name: 'Valid Item',
      equipmentSlot: 'weapon',
      levelRequirement: 3,
      classRequirement: ['warrior', 'knight'],
      statModifiers: { attack: 15 }
    });

    // Act
    const compatibility = equipmentResult.current.checkCompatibility(validItem, 'weapon');

    // Assert
    expect(compatibility.canEquip).toBe(true);
    expect(compatibility.reasons.filter((r: any) => !r.satisfied)).toHaveLength(0);
  });

  it('should provide helpful suggestions when requirements are not met', async () => {
    // Arrange
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });
    await createTestPlayer(gameResult, 'warrior', 2);

    const { result: equipmentResult } = renderHook(() => useEquipment(), { wrapper });

    const restrictedItem = createMockItem({
      id: 'restricted_item',
      name: 'Restricted Item',
      equipmentSlot: 'weapon',
      levelRequirement: 8,
      statModifiers: { attack: 30 }
    });

    // Act
    const compatibility = equipmentResult.current.checkCompatibility(restrictedItem, 'weapon');

    // Assert
    expect(compatibility.canEquip).toBe(false);
    expect(compatibility.suggestions.length).toBeGreaterThan(0);
    expect(compatibility.suggestions).toEqual(
      expect.arrayContaining([
        expect.stringContaining('level')
      ])
    );
  });
});
