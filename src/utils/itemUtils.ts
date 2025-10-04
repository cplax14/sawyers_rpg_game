/**
 * Item Utilities
 * Comprehensive utility functions for item operations, filtering, and stacking logic
 */

import { EnhancedItem, ItemCategory, ItemType, ItemEffect, ItemStack, ItemFilter } from '../types/inventory';
import { PlayerStats } from '../types/game';

// ================================
// ITEM FILTERING AND SEARCH
// ================================

/**
 * Filter items based on various criteria
 */
export const filterItems = (
  items: EnhancedItem[],
  filter: ItemFilter
): EnhancedItem[] => {
  return items.filter(item => {
    // Category filter
    if (filter.category && item.category !== filter.category) {
      return false;
    }

    // Type filter
    if (filter.itemType && item.itemType !== filter.itemType) {
      return false;
    }

    // Rarity filter
    if (filter.rarity && (!item.rarity || !filter.rarity.includes(item.rarity))) {
      return false;
    }

    // Stackable filter
    if (filter.stackable !== undefined && item.stackable !== filter.stackable) {
      return false;
    }

    // Consumable filter
    if (filter.consumable !== undefined) {
      const isConsumable = item.itemType === 'consumable';
      if (isConsumable !== filter.consumable) {
        return false;
      }
    }

    // Tradeable filter
    if (filter.tradeable !== undefined && item.tradeable !== filter.tradeable) {
      return false;
    }

    // Quest item filter
    if (filter.questItem !== undefined && item.questItem !== filter.questItem) {
      return false;
    }

    // Minimum value filter
    if (filter.minValue !== undefined && (item.value || 0) < filter.minValue) {
      return false;
    }

    // Maximum value filter
    if (filter.maxValue !== undefined && (item.value || 0) > filter.maxValue) {
      return false;
    }

    // Minimum level filter
    if (filter.minLevel !== undefined && (item.requiredLevel || 0) < filter.minLevel) {
      return false;
    }

    // Has effects filter
    if (filter.hasEffects !== undefined) {
      const hasEffects = item.effects && item.effects.length > 0;
      if (hasEffects !== filter.hasEffects) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Search items by name or description
 */
export const searchItems = (
  items: EnhancedItem[],
  query: string,
  searchFields: ('name' | 'description' | 'category' | 'itemType')[] = ['name', 'description']
): EnhancedItem[] => {
  if (!query.trim()) {
    return items;
  }

  const searchTerm = query.toLowerCase().trim();

  return items.filter(item => {
    return searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm);
      }
      return false;
    });
  });
};

/**
 * Get items by category
 */
export const getItemsByCategory = (
  items: EnhancedItem[],
  category: ItemCategory
): EnhancedItem[] => {
  return items.filter(item => item.category === category);
};

/**
 * Get items by type
 */
export const getItemsByType = (
  items: EnhancedItem[],
  itemType: ItemType
): EnhancedItem[] => {
  return items.filter(item => item.itemType === itemType);
};

// ================================
// ITEM SORTING
// ================================

export type SortField = 'name' | 'rarity' | 'value' | 'quantity' | 'category' | 'level' | 'weight';
export type SortOrder = 'asc' | 'desc';

/**
 * Sort items by specified field and order
 */
export const sortItems = (
  items: EnhancedItem[],
  field: SortField,
  order: SortOrder = 'asc'
): EnhancedItem[] => {
  const sorted = [...items].sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;

      case 'rarity':
        const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
        const aRarityIndex = rarityOrder.indexOf(a.rarity || 'common');
        const bRarityIndex = rarityOrder.indexOf(b.rarity || 'common');
        comparison = aRarityIndex - bRarityIndex;
        break;

      case 'value':
        comparison = (a.value || 0) - (b.value || 0);
        break;

      case 'quantity':
        comparison = (a.quantity || 1) - (b.quantity || 1);
        break;

      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '');
        break;

      case 'level':
        comparison = (a.requiredLevel || 0) - (b.requiredLevel || 0);
        break;

      case 'weight':
        comparison = (a.weight || 0) - (b.weight || 0);
        break;

      default:
        comparison = 0;
    }

    return order === 'desc' ? -comparison : comparison;
  });

  return sorted;
};

// ================================
// ITEM STACKING
// ================================

/**
 * Check if two items can be stacked together
 */
export const canStackItems = (item1: EnhancedItem, item2: EnhancedItem): boolean => {
  // Must be stackable
  if (!item1.stackable || !item2.stackable) {
    return false;
  }

  // Must have same ID (identical items)
  if (item1.id !== item2.id) {
    return false;
  }

  // Must have same name and description
  if (item1.name !== item2.name || item1.description !== item2.description) {
    return false;
  }

  // Must have same category and type
  if (item1.category !== item2.category || item1.itemType !== item2.itemType) {
    return false;
  }

  // Must have same rarity
  if (item1.rarity !== item2.rarity) {
    return false;
  }

  return true;
};

/**
 * Create a stacked item from multiple identical items
 */
export const stackItems = (items: EnhancedItem[]): EnhancedItem => {
  if (items.length === 0) {
    throw new Error('Cannot stack empty array of items');
  }

  const baseItem = items[0];
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  // Verify all items can be stacked
  const canStack = items.every(item => canStackItems(baseItem, item));
  if (!canStack) {
    throw new Error('Cannot stack items that are not identical');
  }

  return {
    ...baseItem,
    quantity: totalQuantity
  };
};

/**
 * Split a stacked item into individual items or smaller stacks
 */
export const splitStack = (
  item: EnhancedItem,
  splitQuantity: number
): { remainingStack: EnhancedItem | null; splitStack: EnhancedItem } => {
  if (!item.stackable) {
    throw new Error('Cannot split non-stackable item');
  }

  const currentQuantity = item.quantity || 1;

  if (splitQuantity >= currentQuantity) {
    return {
      remainingStack: null,
      splitStack: item
    };
  }

  const remainingQuantity = currentQuantity - splitQuantity;

  return {
    remainingStack: {
      ...item,
      quantity: remainingQuantity
    },
    splitStack: {
      ...item,
      quantity: splitQuantity
    }
  };
};

/**
 * Consolidate identical stackable items in an inventory
 */
export const consolidateStacks = (items: EnhancedItem[]): EnhancedItem[] => {
  const consolidated: EnhancedItem[] = [];
  const processed = new Set<string>();

  for (const item of items) {
    if (processed.has(item.id)) {
      continue;
    }

    if (!item.stackable) {
      consolidated.push(item);
      processed.add(item.id);
      continue;
    }

    // Find all identical stackable items
    const identicalItems = items.filter(otherItem =>
      canStackItems(item, otherItem)
    );

    if (identicalItems.length > 1) {
      const stackedItem = stackItems(identicalItems);
      consolidated.push(stackedItem);
    } else {
      consolidated.push(item);
    }

    // Mark as processed
    identicalItems.forEach(identicalItem => processed.add(identicalItem.id));
  }

  return consolidated;
};

// ================================
// ITEM VALIDATION
// ================================

/**
 * Check if a player meets the requirements to use an item
 */
export const canUseItem = (
  item: EnhancedItem,
  playerLevel: number,
  playerClass?: string,
  playerStats?: PlayerStats
): { canUse: boolean; reasons: string[] } => {
  const reasons: string[] = [];

  // Level requirement
  if (item.requiredLevel && playerLevel < item.requiredLevel) {
    reasons.push(`Requires level ${item.requiredLevel} (you are level ${playerLevel})`);
  }

  // Class requirement
  if (item.requiredClass && playerClass && !item.requiredClass.includes(playerClass)) {
    reasons.push(`Requires class: ${item.requiredClass.join(' or ')}`);
  }

  // Stat requirements
  if (item.requiredStats && playerStats) {
    for (const [stat, requirement] of Object.entries(item.requiredStats)) {
      const playerStat = playerStats[stat as keyof PlayerStats] as number;
      if (playerStat < requirement) {
        reasons.push(`Requires ${stat}: ${requirement} (you have ${playerStat})`);
      }
    }
  }

  // Quest item check (quest items usually can't be used directly)
  if (item.questItem) {
    reasons.push('Quest items cannot be used directly');
  }

  return {
    canUse: reasons.length === 0,
    reasons
  };
};

/**
 * Check if an item can be sold
 */
export const canSellItem = (item: EnhancedItem): { canSell: boolean; reason?: string } => {
  if (item.questItem) {
    return { canSell: false, reason: 'Quest items cannot be sold' };
  }

  if (item.tradeable === false) {
    return { canSell: false, reason: 'This item is not tradeable' };
  }

  if (!item.value || item.value <= 0) {
    return { canSell: false, reason: 'This item has no value' };
  }

  return { canSell: true };
};

/**
 * Check if an item can be dropped
 */
export const canDropItem = (item: EnhancedItem): { canDrop: boolean; reason?: string } => {
  if (item.questItem) {
    return { canDrop: false, reason: 'Quest items cannot be dropped' };
  }

  if (item.bound) {
    return { canDrop: false, reason: 'This item is bound to you' };
  }

  return { canDrop: true };
};

// ================================
// ITEM EFFECTS AND USAGE
// ================================

/**
 * Calculate the total effect of using an item
 */
export const calculateItemEffects = (
  item: EnhancedItem,
  quantity: number = 1
): ItemEffect[] => {
  if (!item.effects) {
    return [];
  }

  return item.effects.map(effect => ({
    ...effect,
    value: effect.value * quantity
  }));
};

/**
 * Get the healing value of a consumable item
 */
export const getHealingValue = (item: EnhancedItem): number => {
  if (!item.effects) {
    return 0;
  }

  const healingEffect = item.effects.find(effect =>
    effect.type === 'heal' || effect.stat === 'health'
  );

  return healingEffect ? healingEffect.value : 0;
};

/**
 * Get the mana restoration value of a consumable item
 */
export const getManaValue = (item: EnhancedItem): number => {
  if (!item.effects) {
    return 0;
  }

  const manaEffect = item.effects.find(effect =>
    effect.type === 'restore' && effect.stat === 'mana'
  );

  return manaEffect ? manaEffect.value : 0;
};

// ================================
// INVENTORY ANALYSIS
// ================================

/**
 * Calculate total value of items
 */
export const calculateTotalValue = (items: EnhancedItem[]): number => {
  return items.reduce((total, item) => {
    const itemValue = item.value || 0;
    const quantity = item.quantity || 1;
    return total + (itemValue * quantity);
  }, 0);
};

/**
 * Calculate total weight of items
 */
export const calculateTotalWeight = (items: EnhancedItem[]): number => {
  return items.reduce((total, item) => {
    const itemWeight = item.weight || 0;
    const quantity = item.quantity || 1;
    return total + (itemWeight * quantity);
  }, 0);
};

/**
 * Get inventory statistics
 */
export const getInventoryStats = (items: EnhancedItem[]) => {
  const stats = {
    totalItems: 0,
    totalValue: 0,
    totalWeight: 0,
    categories: {} as Record<string, number>,
    rarities: {} as Record<string, number>,
    consumables: 0,
    questItems: 0,
    tradeableItems: 0,
    stackableItems: 0
  };

  items.forEach(item => {
    const quantity = item.quantity || 1;
    stats.totalItems += quantity;
    stats.totalValue += (item.value || 0) * quantity;
    stats.totalWeight += (item.weight || 0) * quantity;

    // Categories
    const category = item.category || 'misc';
    stats.categories[category] = (stats.categories[category] || 0) + quantity;

    // Rarities
    const rarity = item.rarity || 'common';
    stats.rarities[rarity] = (stats.rarities[rarity] || 0) + quantity;

    // Special properties
    if (item.itemType === 'consumable') {
      stats.consumables += quantity;
    }
    if (item.questItem) {
      stats.questItems += quantity;
    }
    if (item.tradeable !== false) {
      stats.tradeableItems += quantity;
    }
    if (item.stackable) {
      stats.stackableItems += quantity;
    }
  });

  return stats;
};

/**
 * Find items that can be consumed to restore health
 */
export const findHealingItems = (
  items: EnhancedItem[],
  minHealing: number = 1
): EnhancedItem[] => {
  return items.filter(item => {
    if (item.itemType !== 'consumable') return false;
    const healingValue = getHealingValue(item);
    return healingValue >= minHealing;
  });
};

/**
 * Find items that can be consumed to restore mana
 */
export const findManaItems = (
  items: EnhancedItem[],
  minMana: number = 1
): EnhancedItem[] => {
  return items.filter(item => {
    if (item.itemType !== 'consumable') return false;
    const manaValue = getManaValue(item);
    return manaValue >= minMana;
  });
};

// ================================
// ITEM CATEGORIZATION
// ================================

/**
 * Automatically categorize an item based on its properties
 */
export const categorizeItem = (item: EnhancedItem): ItemCategory => {
  // Quest items take priority
  if (item.questItem) {
    return 'quest';
  }

  // Check by itemType first
  if (item.itemType === 'consumable') {
    return 'consumables';
  }

  if (item.itemType === 'equipment') {
    return 'equipment';
  }

  // Check by category if available
  if (item.category) {
    return item.category;
  }

  // Check for material indicators
  if (item.name.toLowerCase().includes('ore') ||
      item.name.toLowerCase().includes('wood') ||
      item.name.toLowerCase().includes('leather') ||
      item.name.toLowerCase().includes('cloth') ||
      item.name.toLowerCase().includes('gem') ||
      item.name.toLowerCase().includes('crystal') ||
      item.description?.toLowerCase().includes('crafting material')) {
    return 'materials';
  }

  // Check for consumable indicators
  if (item.name.toLowerCase().includes('potion') ||
      item.name.toLowerCase().includes('elixir') ||
      item.name.toLowerCase().includes('scroll') ||
      item.name.toLowerCase().includes('food') ||
      item.effects && item.effects.length > 0) {
    return 'consumables';
  }

  // Check for equipment indicators
  if (item.statModifiers && Object.keys(item.statModifiers).length > 0) {
    return 'equipment';
  }

  // Default to miscellaneous
  return 'misc';
};

/**
 * Get category display information
 */
export const getCategoryInfo = (category: ItemCategory) => {
  const categoryMap = {
    consumables: {
      name: 'Consumables',
      icon: '🧪',
      description: 'Items that can be used and consumed',
      color: '#a855f7'
    },
    equipment: {
      name: 'Equipment',
      icon: '⚔️',
      description: 'Weapons, armor, and accessories',
      color: '#3b82f6'
    },
    materials: {
      name: 'Materials',
      icon: '⚒️',
      description: 'Crafting materials and resources',
      color: '#f59e0b'
    },
    quest: {
      name: 'Quest Items',
      icon: '📜',
      description: 'Important story and quest items',
      color: '#ef4444'
    },
    misc: {
      name: 'Miscellaneous',
      icon: '🎒',
      description: 'Various other items',
      color: '#6b7280'
    }
  };

  return categoryMap[category] || categoryMap.misc;
};

/**
 * Get all available categories with their information
 */
export const getAllCategories = () => {
  const categories: ItemCategory[] = ['consumables', 'equipment', 'materials', 'quest', 'misc'];
  return categories.map(category => ({
    id: category,
    ...getCategoryInfo(category)
  }));
};

/**
 * Filter items by multiple categories
 */
export const filterByCategories = (
  items: EnhancedItem[],
  categories: ItemCategory[]
): EnhancedItem[] => {
  if (categories.length === 0) {
    return items;
  }

  return items.filter(item => {
    const itemCategory = item.category || categorizeItem(item);
    return categories.includes(itemCategory);
  });
};

/**
 * Group items by category
 */
export const groupByCategory = (items: EnhancedItem[]): Record<ItemCategory, EnhancedItem[]> => {
  const groups: Record<ItemCategory, EnhancedItem[]> = {
    consumables: [],
    equipment: [],
    materials: [],
    quest: [],
    misc: []
  };

  items.forEach(item => {
    const category = item.category || categorizeItem(item);
    groups[category].push(item);
  });

  return groups;
};

/**
 * Get category statistics for an inventory
 */
export const getCategoryStats = (items: EnhancedItem[]) => {
  const groups = groupByCategory(items);
  const stats: Record<ItemCategory, { count: number; totalValue: number; totalWeight: number }> = {
    consumables: { count: 0, totalValue: 0, totalWeight: 0 },
    equipment: { count: 0, totalValue: 0, totalWeight: 0 },
    materials: { count: 0, totalValue: 0, totalWeight: 0 },
    quest: { count: 0, totalValue: 0, totalWeight: 0 },
    misc: { count: 0, totalValue: 0, totalWeight: 0 }
  };

  for (const [category, categoryItems] of Object.entries(groups)) {
    const cat = category as ItemCategory;
    stats[cat].count = categoryItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
    stats[cat].totalValue = calculateTotalValue(categoryItems);
    stats[cat].totalWeight = calculateTotalWeight(categoryItems);
  }

  return stats;
};

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Generate a unique item instance ID
 */
export const generateItemInstanceId = (): string => {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Create a copy of an item (useful for instance-based items)
 */
export const cloneItem = (item: EnhancedItem): EnhancedItem => {
  return {
    ...item,
    instanceId: generateItemInstanceId(),
    // Deep clone effects if they exist
    effects: item.effects ? item.effects.map(effect => ({ ...effect })) : undefined,
    // Deep clone stat modifiers if they exist
    statModifiers: item.statModifiers ?
      Object.fromEntries(
        Object.entries(item.statModifiers).map(([key, modifier]) => [
          key,
          { ...modifier }
        ])
      ) : undefined
  };
};

/**
 * Check if an item is a specific type
 */
export const isItemType = (item: EnhancedItem, type: ItemType): boolean => {
  return item.itemType === type;
};

/**
 * Check if an item is consumable
 */
export const isConsumable = (item: EnhancedItem): boolean => {
  return isItemType(item, 'consumable');
};

/**
 * Check if an item is equipment
 */
export const isEquipment = (item: EnhancedItem): boolean => {
  return isItemType(item, 'equipment');
};

/**
 * Check if an item is a quest item
 */
export const isQuestItem = (item: EnhancedItem): boolean => {
  return item.questItem === true;
};

/**
 * Format item quantity display
 */
export const formatQuantity = (quantity?: number): string => {
  if (!quantity || quantity <= 1) {
    return '';
  }
  return `×${quantity}`;
};

/**
 * Format item value display
 */
export const formatValue = (value?: number): string => {
  if (!value || value <= 0) {
    return '0g';
  }

  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}Mg`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}kg`;
  } else {
    return `${value}g`;
  }
};

/**
 * Format item weight display
 */
export const formatWeight = (weight?: number): string => {
  if (!weight || weight <= 0) {
    return '0';
  }

  return `${weight.toFixed(1)}`;
};

export default {
  // Filtering and search
  filterItems,
  searchItems,
  getItemsByCategory,
  getItemsByType,

  // Sorting
  sortItems,

  // Stacking
  canStackItems,
  stackItems,
  splitStack,
  consolidateStacks,

  // Validation
  canUseItem,
  canSellItem,
  canDropItem,

  // Effects
  calculateItemEffects,
  getHealingValue,
  getManaValue,

  // Analysis
  calculateTotalValue,
  calculateTotalWeight,
  getInventoryStats,
  findHealingItems,
  findManaItems,

  // Categorization
  categorizeItem,
  getCategoryInfo,
  getAllCategories,
  filterByCategories,
  groupByCategory,
  getCategoryStats,

  // Utilities
  generateItemInstanceId,
  cloneItem,
  isItemType,
  isConsumable,
  isEquipment,
  isQuestItem,
  formatQuantity,
  formatValue,
  formatWeight
};