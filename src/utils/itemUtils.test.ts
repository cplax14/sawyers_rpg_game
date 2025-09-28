/**
 * Item Utilities Test Suite
 * Comprehensive tests for item operations, filtering, stacking logic, and categorization
 */

import {
  filterItems,
  searchItems,
  getItemsByCategory,
  getItemsByType,
  sortItems,
  canStackItems,
  stackItems,
  splitStack,
  consolidateStacks,
  canUseItem,
  canSellItem,
  canDropItem,
  calculateItemEffects,
  getHealingValue,
  getManaValue,
  calculateTotalValue,
  calculateTotalWeight,
  getInventoryStats,
  findHealingItems,
  findManaItems,
  categorizeItem,
  getCategoryInfo,
  getAllCategories,
  filterByCategories,
  groupByCategory,
  getCategoryStats,
  generateItemInstanceId,
  cloneItem,
  isItemType,
  isConsumable,
  isEquipment,
  isQuestItem,
  formatQuantity,
  formatValue,
  formatWeight
} from './itemUtils';

import { EnhancedItem, ItemCategory, ItemType, ItemFilter } from '../types/inventory';
import { PlayerStats } from '../types/game';

describe('itemUtils', () => {
  // Mock data for testing
  const mockItems: EnhancedItem[] = [
    {
      id: 'sword_1',
      name: 'Iron Sword',
      description: 'A basic iron sword',
      category: 'equipment',
      itemType: 'equipment',
      rarity: 'common',
      value: 100,
      weight: 5,
      stackable: false,
      tradeable: true,
      quantity: 1,
      requiredLevel: 5,
      requiredClass: ['warrior', 'paladin'],
      statModifiers: {
        attack: { value: 10, type: 'flat' }
      }
    },
    {
      id: 'potion_heal',
      name: 'Health Potion',
      description: 'Restores health points',
      category: 'consumables',
      itemType: 'consumable',
      rarity: 'common',
      value: 50,
      weight: 0.5,
      stackable: true,
      tradeable: true,
      quantity: 3,
      effects: [
        { type: 'heal', stat: 'health', value: 50, duration: 0 }
      ]
    },
    {
      id: 'potion_mana',
      name: 'Mana Potion',
      description: 'Restores mana points',
      category: 'consumables',
      itemType: 'consumable',
      rarity: 'uncommon',
      value: 75,
      weight: 0.5,
      stackable: true,
      tradeable: true,
      quantity: 2,
      effects: [
        { type: 'restore', stat: 'mana', value: 30, duration: 0 }
      ]
    },
    {
      id: 'iron_ore',
      name: 'Iron Ore',
      description: 'Raw iron for crafting',
      category: 'materials',
      itemType: 'material',
      rarity: 'common',
      value: 10,
      weight: 2,
      stackable: true,
      tradeable: true,
      quantity: 10
    },
    {
      id: 'quest_scroll',
      name: 'Ancient Scroll',
      description: 'An important quest item',
      category: 'quest',
      itemType: 'quest',
      rarity: 'rare',
      value: 0,
      weight: 0.1,
      stackable: false,
      tradeable: false,
      questItem: true,
      quantity: 1
    }
  ];

  const mockPlayerStats: PlayerStats = {
    attack: 15,
    defense: 12,
    magicAttack: 8,
    magicDefense: 10,
    speed: 14,
    accuracy: 85
  };

  describe('filterItems', () => {
    it('should filter items by category', () => {
      const filter: ItemFilter = { category: 'consumables' };
      const result = filterItems(mockItems, filter);

      expect(result).toHaveLength(2);
      expect(result.every(item => item.category === 'consumables')).toBe(true);
    });

    it('should filter items by rarity', () => {
      const filter: ItemFilter = { rarity: ['rare'] };
      const result = filterItems(mockItems, filter);

      expect(result).toHaveLength(1);
      expect(result[0].rarity).toBe('rare');
    });

    it('should filter items by stackable property', () => {
      const filter: ItemFilter = { stackable: true };
      const result = filterItems(mockItems, filter);

      expect(result).toHaveLength(3);
      expect(result.every(item => item.stackable)).toBe(true);
    });

    it('should filter items by value range', () => {
      const filter: ItemFilter = { minValue: 50, maxValue: 100 };
      const result = filterItems(mockItems, filter);

      expect(result).toHaveLength(3);
      expect(result.every(item => (item.value || 0) >= 50 && (item.value || 0) <= 100)).toBe(true);
    });

    it('should filter items by quest item status', () => {
      const filter: ItemFilter = { questItem: true };
      const result = filterItems(mockItems, filter);

      expect(result).toHaveLength(1);
      expect(result[0].questItem).toBe(true);
    });

    it('should return all items when no filters applied', () => {
      const filter: ItemFilter = {};
      const result = filterItems(mockItems, filter);

      expect(result).toHaveLength(mockItems.length);
    });
  });

  describe('searchItems', () => {
    it('should search items by name', () => {
      const result = searchItems(mockItems, 'potion');

      expect(result).toHaveLength(2);
      expect(result.every(item => item.name.toLowerCase().includes('potion'))).toBe(true);
    });

    it('should search items by description', () => {
      const result = searchItems(mockItems, 'health');

      expect(result).toHaveLength(1);
      expect(result[0].description.toLowerCase().includes('health')).toBe(true);
    });

    it('should return all items for empty query', () => {
      const result = searchItems(mockItems, '');

      expect(result).toHaveLength(mockItems.length);
    });

    it('should search in specific fields only', () => {
      const result = searchItems(mockItems, 'iron', ['name']);

      expect(result).toHaveLength(2);
      expect(result.every(item => item.name.toLowerCase().includes('iron'))).toBe(true);
    });
  });

  describe('getItemsByCategory', () => {
    it('should return items of specified category', () => {
      const result = getItemsByCategory(mockItems, 'equipment');

      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('equipment');
    });
  });

  describe('getItemsByType', () => {
    it('should return items of specified type', () => {
      const result = getItemsByType(mockItems, 'consumable');

      expect(result).toHaveLength(2);
      expect(result.every(item => item.itemType === 'consumable')).toBe(true);
    });
  });

  describe('sortItems', () => {
    it('should sort items by name ascending', () => {
      const result = sortItems(mockItems, 'name', 'asc');

      expect(result[0].name).toBe('Ancient Scroll');
      expect(result[result.length - 1].name).toBe('Mana Potion');
    });

    it('should sort items by value descending', () => {
      const result = sortItems(mockItems, 'value', 'desc');

      expect(result[0].value).toBe(100);
      expect(result[result.length - 1].value).toBe(0);
    });

    it('should sort items by rarity', () => {
      const result = sortItems(mockItems, 'rarity', 'asc');

      expect(result.filter(item => item.rarity === 'common')).toHaveLength(3);
      expect(result[result.length - 1].rarity).toBe('rare');
    });

    it('should sort items by quantity', () => {
      const result = sortItems(mockItems, 'quantity', 'desc');

      expect(result[0].quantity).toBe(10);
      expect(result[result.length - 1].quantity).toBe(1);
    });
  });

  describe('canStackItems', () => {
    it('should allow stacking identical stackable items', () => {
      const item1 = { ...mockItems[1] }; // Health Potion
      const item2 = { ...mockItems[1] };

      const result = canStackItems(item1, item2);

      expect(result).toBe(true);
    });

    it('should not allow stacking non-stackable items', () => {
      const item1 = { ...mockItems[0] }; // Iron Sword (not stackable)
      const item2 = { ...mockItems[0] };

      const result = canStackItems(item1, item2);

      expect(result).toBe(false);
    });

    it('should not allow stacking different items', () => {
      const item1 = { ...mockItems[1] }; // Health Potion
      const item2 = { ...mockItems[2] }; // Mana Potion

      const result = canStackItems(item1, item2);

      expect(result).toBe(false);
    });

    it('should not allow stacking items with different rarities', () => {
      const item1 = { ...mockItems[1] }; // Common Health Potion
      const item2 = { ...mockItems[1], rarity: 'rare' };

      const result = canStackItems(item1, item2);

      expect(result).toBe(false);
    });
  });

  describe('stackItems', () => {
    it('should combine quantities of identical items', () => {
      const item1 = { ...mockItems[1], quantity: 3 };
      const item2 = { ...mockItems[1], quantity: 2 };

      const result = stackItems([item1, item2]);

      expect(result.quantity).toBe(5);
      expect(result.id).toBe(item1.id);
    });

    it('should throw error for empty array', () => {
      expect(() => stackItems([])).toThrow('Cannot stack empty array of items');
    });

    it('should throw error for non-stackable items', () => {
      const item1 = { ...mockItems[0] }; // Non-stackable sword
      const item2 = { ...mockItems[2] }; // Different item

      expect(() => stackItems([item1, item2])).toThrow('Cannot stack items that are not identical');
    });
  });

  describe('splitStack', () => {
    it('should split a stack into two parts', () => {
      const item = { ...mockItems[1], quantity: 5 };

      const result = splitStack(item, 2);

      expect(result.splitStack.quantity).toBe(2);
      expect(result.remainingStack?.quantity).toBe(3);
    });

    it('should return null remaining stack when splitting entire quantity', () => {
      const item = { ...mockItems[1], quantity: 3 };

      const result = splitStack(item, 3);

      expect(result.splitStack.quantity).toBe(3);
      expect(result.remainingStack).toBeNull();
    });

    it('should throw error for non-stackable items', () => {
      const item = { ...mockItems[0] }; // Non-stackable sword

      expect(() => splitStack(item, 1)).toThrow('Cannot split non-stackable item');
    });
  });

  describe('consolidateStacks', () => {
    it('should consolidate identical stackable items', () => {
      const items = [
        { ...mockItems[1], quantity: 2 },
        { ...mockItems[1], quantity: 3 },
        { ...mockItems[0] }, // Different item
        { ...mockItems[1], quantity: 1 }
      ];

      const result = consolidateStacks(items);

      expect(result).toHaveLength(2); // Consolidated potion stack + sword
      const potionStack = result.find(item => item.id === 'potion_heal');
      expect(potionStack?.quantity).toBe(6);
    });

    it('should leave non-stackable items unchanged', () => {
      const items = [
        { ...mockItems[0] }, // Sword 1
        { ...mockItems[0] }, // Sword 2 (same ID but not stackable)
      ];

      const result = consolidateStacks(items);

      expect(result).toHaveLength(1); // Should only process first occurrence
    });
  });

  describe('canUseItem', () => {
    it('should allow using item when requirements are met', () => {
      const result = canUseItem(mockItems[0], 10, 'warrior', mockPlayerStats);

      expect(result.canUse).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('should prevent using item when level requirement not met', () => {
      const result = canUseItem(mockItems[0], 3, 'warrior', mockPlayerStats);

      expect(result.canUse).toBe(false);
      expect(result.reasons).toContain('Requires level 5 (you are level 3)');
    });

    it('should prevent using item when class requirement not met', () => {
      const result = canUseItem(mockItems[0], 10, 'mage', mockPlayerStats);

      expect(result.canUse).toBe(false);
      expect(result.reasons).toContain('Requires class: warrior or paladin');
    });

    it('should prevent using quest items', () => {
      const result = canUseItem(mockItems[4], 10, 'warrior', mockPlayerStats);

      expect(result.canUse).toBe(false);
      expect(result.reasons).toContain('Quest items cannot be used directly');
    });
  });

  describe('canSellItem', () => {
    it('should allow selling regular tradeable items', () => {
      const result = canSellItem(mockItems[0]);

      expect(result.canSell).toBe(true);
    });

    it('should prevent selling quest items', () => {
      const result = canSellItem(mockItems[4]);

      expect(result.canSell).toBe(false);
      expect(result.reason).toBe('Quest items cannot be sold');
    });

    it('should prevent selling non-tradeable items', () => {
      const item = { ...mockItems[0], tradeable: false };
      const result = canSellItem(item);

      expect(result.canSell).toBe(false);
      expect(result.reason).toBe('This item is not tradeable');
    });

    it('should prevent selling items with no value', () => {
      const item = { ...mockItems[0], value: 0 };
      const result = canSellItem(item);

      expect(result.canSell).toBe(false);
      expect(result.reason).toBe('This item has no value');
    });
  });

  describe('canDropItem', () => {
    it('should allow dropping regular items', () => {
      const result = canDropItem(mockItems[0]);

      expect(result.canDrop).toBe(true);
    });

    it('should prevent dropping quest items', () => {
      const result = canDropItem(mockItems[4]);

      expect(result.canDrop).toBe(false);
      expect(result.reason).toBe('Quest items cannot be dropped');
    });

    it('should prevent dropping bound items', () => {
      const item = { ...mockItems[0], bound: true };
      const result = canDropItem(item);

      expect(result.canDrop).toBe(false);
      expect(result.reason).toBe('This item is bound to you');
    });
  });

  describe('calculateItemEffects', () => {
    it('should calculate effects for single use', () => {
      const result = calculateItemEffects(mockItems[1]); // Health Potion

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(50);
    });

    it('should scale effects by quantity', () => {
      const result = calculateItemEffects(mockItems[1], 3); // 3x Health Potion

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(150);
    });

    it('should return empty array for items without effects', () => {
      const result = calculateItemEffects(mockItems[0]); // Sword

      expect(result).toHaveLength(0);
    });
  });

  describe('getHealingValue', () => {
    it('should return healing value for health potions', () => {
      const result = getHealingValue(mockItems[1]);

      expect(result).toBe(50);
    });

    it('should return zero for non-healing items', () => {
      const result = getHealingValue(mockItems[0]);

      expect(result).toBe(0);
    });
  });

  describe('getManaValue', () => {
    it('should return mana value for mana potions', () => {
      const result = getManaValue(mockItems[2]);

      expect(result).toBe(30);
    });

    it('should return zero for non-mana items', () => {
      const result = getManaValue(mockItems[0]);

      expect(result).toBe(0);
    });
  });

  describe('calculateTotalValue', () => {
    it('should calculate total value including quantities', () => {
      const items = [
        { ...mockItems[0], quantity: 1, value: 100 }, // 100
        { ...mockItems[1], quantity: 3, value: 50 },  // 150
        { ...mockItems[3], quantity: 10, value: 10 }  // 100
      ];

      const result = calculateTotalValue(items);

      expect(result).toBe(350);
    });

    it('should handle items without value', () => {
      const items = [
        { ...mockItems[0], value: undefined },
        { ...mockItems[1], value: 50, quantity: 2 }
      ];

      const result = calculateTotalValue(items);

      expect(result).toBe(100);
    });
  });

  describe('calculateTotalWeight', () => {
    it('should calculate total weight including quantities', () => {
      const items = [
        { ...mockItems[0], quantity: 1, weight: 5 },   // 5
        { ...mockItems[1], quantity: 3, weight: 0.5 }, // 1.5
        { ...mockItems[3], quantity: 10, weight: 2 }   // 20
      ];

      const result = calculateTotalWeight(items);

      expect(result).toBe(26.5);
    });
  });

  describe('getInventoryStats', () => {
    it('should calculate comprehensive inventory statistics', () => {
      const result = getInventoryStats(mockItems);

      expect(result.totalItems).toBe(17); // Sum of all quantities
      expect(result.totalValue).toBe(370); // Calculated total value
      expect(result.categories.consumables).toBe(5); // Health + Mana potions
      expect(result.categories.equipment).toBe(1);
      expect(result.rarities.common).toBe(14); // Common items quantities
      expect(result.consumables).toBe(5);
      expect(result.questItems).toBe(1);
    });
  });

  describe('findHealingItems', () => {
    it('should find items that can heal', () => {
      const result = findHealingItems(mockItems);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('potion_heal');
    });

    it('should filter by minimum healing amount', () => {
      const result = findHealingItems(mockItems, 100);

      expect(result).toHaveLength(0); // No items heal for 100+
    });
  });

  describe('findManaItems', () => {
    it('should find items that can restore mana', () => {
      const result = findManaItems(mockItems);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('potion_mana');
    });
  });

  describe('categorizeItem', () => {
    it('should categorize quest items correctly', () => {
      const result = categorizeItem(mockItems[4]);

      expect(result).toBe('quest');
    });

    it('should categorize by itemType', () => {
      const result = categorizeItem(mockItems[1]);

      expect(result).toBe('consumables');
    });

    it('should categorize materials by name patterns', () => {
      const item = { ...mockItems[3], name: 'Iron Ore', category: undefined };
      const result = categorizeItem(item);

      expect(result).toBe('materials');
    });

    it('should default to misc for unknown items', () => {
      const item = { ...mockItems[0], itemType: 'unknown' as any, category: undefined };
      const result = categorizeItem(item);

      expect(result).toBe('misc');
    });
  });

  describe('getCategoryInfo', () => {
    it('should return category information', () => {
      const result = getCategoryInfo('consumables');

      expect(result.name).toBe('Consumables');
      expect(result.icon).toBe('🧪');
      expect(result.description).toContain('consumed');
    });
  });

  describe('getAllCategories', () => {
    it('should return all available categories', () => {
      const result = getAllCategories();

      expect(result).toHaveLength(5);
      expect(result.map(c => c.id)).toContain('consumables');
      expect(result.map(c => c.id)).toContain('equipment');
      expect(result.map(c => c.id)).toContain('materials');
      expect(result.map(c => c.id)).toContain('quest');
      expect(result.map(c => c.id)).toContain('misc');
    });
  });

  describe('filterByCategories', () => {
    it('should filter items by multiple categories', () => {
      const result = filterByCategories(mockItems, ['consumables', 'equipment']);

      expect(result).toHaveLength(3);
    });

    it('should return all items when no categories specified', () => {
      const result = filterByCategories(mockItems, []);

      expect(result).toHaveLength(mockItems.length);
    });
  });

  describe('groupByCategory', () => {
    it('should group items by their categories', () => {
      const result = groupByCategory(mockItems);

      expect(result.consumables).toHaveLength(2);
      expect(result.equipment).toHaveLength(1);
      expect(result.materials).toHaveLength(1);
      expect(result.quest).toHaveLength(1);
      expect(result.misc).toHaveLength(0);
    });
  });

  describe('getCategoryStats', () => {
    it('should calculate statistics for each category', () => {
      const result = getCategoryStats(mockItems);

      expect(result.consumables.count).toBe(5); // Health + Mana potions
      expect(result.equipment.count).toBe(1);
      expect(result.materials.count).toBe(10);
      expect(result.quest.count).toBe(1);
    });
  });

  describe('generateItemInstanceId', () => {
    it('should generate unique item instance IDs', () => {
      const id1 = generateItemInstanceId();
      const id2 = generateItemInstanceId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^item_\d+_[a-z0-9]+$/);
    });
  });

  describe('cloneItem', () => {
    it('should create a deep copy of an item', () => {
      const clone = cloneItem(mockItems[0]);

      expect(clone).not.toBe(mockItems[0]);
      expect(clone.id).toBe(mockItems[0].id);
      expect(clone.instanceId).toBeDefined();
      expect(clone.instanceId).not.toBe(mockItems[0].instanceId);
    });

    it('should deep clone effects and stat modifiers', () => {
      const item = {
        ...mockItems[1],
        effects: [{ type: 'heal', stat: 'health', value: 50, duration: 0 }],
        statModifiers: { attack: { value: 5, type: 'flat' } }
      };

      const clone = cloneItem(item);

      expect(clone.effects).not.toBe(item.effects);
      expect(clone.statModifiers).not.toBe(item.statModifiers);
      expect(clone.effects?.[0]).not.toBe(item.effects?.[0]);
    });
  });

  describe('isItemType', () => {
    it('should correctly identify item types', () => {
      expect(isItemType(mockItems[0], 'equipment')).toBe(true);
      expect(isItemType(mockItems[1], 'consumable')).toBe(true);
      expect(isItemType(mockItems[0], 'consumable')).toBe(false);
    });
  });

  describe('isConsumable', () => {
    it('should identify consumable items', () => {
      expect(isConsumable(mockItems[1])).toBe(true);
      expect(isConsumable(mockItems[0])).toBe(false);
    });
  });

  describe('isEquipment', () => {
    it('should identify equipment items', () => {
      expect(isEquipment(mockItems[0])).toBe(true);
      expect(isEquipment(mockItems[1])).toBe(false);
    });
  });

  describe('isQuestItem', () => {
    it('should identify quest items', () => {
      expect(isQuestItem(mockItems[4])).toBe(true);
      expect(isQuestItem(mockItems[0])).toBe(false);
    });
  });

  describe('formatQuantity', () => {
    it('should format quantities correctly', () => {
      expect(formatQuantity(1)).toBe('');
      expect(formatQuantity(5)).toBe('×5');
      expect(formatQuantity(undefined)).toBe('');
      expect(formatQuantity(0)).toBe('');
    });
  });

  describe('formatValue', () => {
    it('should format values with appropriate units', () => {
      expect(formatValue(0)).toBe('0g');
      expect(formatValue(500)).toBe('500g');
      expect(formatValue(1500)).toBe('1.5kg');
      expect(formatValue(1500000)).toBe('1.5Mg');
      expect(formatValue(undefined)).toBe('0g');
    });
  });

  describe('formatWeight', () => {
    it('should format weights correctly', () => {
      expect(formatWeight(0)).toBe('0');
      expect(formatWeight(5.5)).toBe('5.5');
      expect(formatWeight(10)).toBe('10.0');
      expect(formatWeight(undefined)).toBe('0');
    });
  });
});