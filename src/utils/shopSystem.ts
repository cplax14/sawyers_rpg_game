/**
 * Shop System Utilities
 *
 * Pure functions for shop operations including unlock checks, transaction processing,
 * and inventory filtering. No React dependencies - all functions are pure and testable.
 *
 * Ages 7-12 appropriate with encouraging feedback and clear validations.
 */

import {
  Shop,
  ShopInventory,
  ShopInventoryItem,
  TransactionType,
  TransactionResult,
  TransactionStatus,
  TransactionValidation,
  ShopUnlockRequirements,
  ItemUnlockRequirements,
  DEFAULT_ECONOMY_CONFIG,
  MAX_INVENTORY_SIZE,
} from '../types/shop';
import { ReactPlayer } from '../contexts/ReactGameContext';
import { ReactItem } from '../types/game';
import { EnhancedItem } from '../types/inventory';

// =============================================================================
// SHOP UNLOCK CHECKS
// =============================================================================

/**
 * Check if a player meets the requirements to unlock a specific shop
 *
 * @param player - Current player state
 * @param shop - Shop to check unlock requirements for
 * @param completedAreas - Array of completed area IDs
 * @param storyProgress - Current story chapter/flag completion
 * @returns true if player can unlock the shop
 */
export function canUnlockShop(
  player: ReactPlayer,
  shop: Shop,
  completedAreas: string[] = [],
  storyProgress: number = 0
): boolean {
  // If shop has no unlock requirements, it's always unlocked
  if (!shop.unlockRequirements) {
    return true;
  }

  const reqs = shop.unlockRequirements;

  // Check level requirement
  if (reqs.level !== undefined && player.level < reqs.level) {
    return false;
  }

  // Check story progress requirement
  if (reqs.storyProgress !== undefined && storyProgress < reqs.storyProgress) {
    return false;
  }

  // Check area completion requirement
  if (reqs.areaCompletion && !completedAreas.includes(reqs.areaCompletion)) {
    return false;
  }

  // All requirements met
  return true;
}

/**
 * Get the next unfulfilled requirement for unlocking a shop
 * Useful for displaying "Unlock at Level X" messages
 *
 * @param player - Current player state
 * @param shop - Shop to check
 * @param completedAreas - Array of completed area IDs
 * @param storyProgress - Current story chapter
 * @returns Human-readable requirement string or null if unlocked
 */
export function getShopUnlockRequirement(
  player: ReactPlayer,
  shop: Shop,
  completedAreas: string[] = [],
  storyProgress: number = 0
): string | null {
  if (!shop.unlockRequirements) {
    return null;
  }

  const reqs = shop.unlockRequirements;

  // Check each requirement in priority order
  if (reqs.level !== undefined && player.level < reqs.level) {
    return `Reach level ${reqs.level}`;
  }

  if (reqs.storyProgress !== undefined && storyProgress < reqs.storyProgress) {
    return `Complete chapter ${reqs.storyProgress}`;
  }

  if (reqs.areaCompletion && !completedAreas.includes(reqs.areaCompletion)) {
    return `Complete ${reqs.areaCompletion}`;
  }

  return null;
}

// =============================================================================
// INVENTORY FILTERING
// =============================================================================

/**
 * Check if a player meets the requirements to see/buy a specific shop item
 *
 * @param player - Current player state
 * @param itemUnlockReqs - Item unlock requirements
 * @param completedAreas - Array of completed area IDs
 * @param completedQuests - Array of completed quest IDs
 * @param purchasedItems - Array of previously purchased item IDs
 * @returns true if item should be visible and purchasable
 */
export function canUnlockShopItem(
  player: ReactPlayer,
  itemUnlockReqs: ItemUnlockRequirements | undefined,
  completedAreas: string[] = [],
  completedQuests: string[] = [],
  purchasedItems: string[] = []
): boolean {
  // No requirements means always unlocked
  if (!itemUnlockReqs) {
    return true;
  }

  // Check level requirement
  if (itemUnlockReqs.level !== undefined && player.level < itemUnlockReqs.level) {
    return false;
  }

  // Check story chapter requirement
  if (itemUnlockReqs.storyChapter !== undefined && itemUnlockReqs.storyChapter > 0) {
    // Story progress would need to be passed in - for now assume chapter 1
    // TODO: Add story chapter tracking to player state
    return true;
  }

  // Check area completion requirement
  if (itemUnlockReqs.areaCompletion && !completedAreas.includes(itemUnlockReqs.areaCompletion)) {
    return false;
  }

  // Check quest completion requirement
  if (itemUnlockReqs.questCompletion && !completedQuests.includes(itemUnlockReqs.questCompletion)) {
    return false;
  }

  // Check previous purchase requirements
  if (itemUnlockReqs.previousPurchases && itemUnlockReqs.previousPurchases.length > 0) {
    const allPreviousItemsPurchased = itemUnlockReqs.previousPurchases.every(itemId =>
      purchasedItems.includes(itemId)
    );
    if (!allPreviousItemsPurchased) {
      return false;
    }
  }

  return true;
}

/**
 * Filter shop inventory to only show items the player can see based on unlock requirements
 *
 * @param shopInventory - Complete shop inventory
 * @param player - Current player state
 * @param completedAreas - Array of completed area IDs
 * @param completedQuests - Array of completed quest IDs
 * @param purchasedItems - Array of previously purchased item IDs
 * @returns Filtered inventory with only unlocked items
 */
export function filterShopInventory(
  shopInventory: ShopInventory,
  player: ReactPlayer,
  completedAreas: string[] = [],
  completedQuests: string[] = [],
  purchasedItems: string[] = []
): ShopInventoryItem[] {
  return shopInventory.items
    .filter(item =>
      canUnlockShopItem(
        player,
        item.unlockRequirements,
        completedAreas,
        completedQuests,
        purchasedItems
      )
    )
    .map(item => ({
      ...item,
      unlocked: true,
    }));
}

// =============================================================================
// AFFORDABILITY AND PRICING
// =============================================================================

/**
 * Calculate the total cost for purchasing items
 *
 * @param basePrice - Base price of single item
 * @param quantity - Number of items to buy
 * @param shopType - Type of shop (affects pricing modifiers)
 * @returns Total gold cost
 */
export function calculateBuyPrice(
  basePrice: number,
  quantity: number = 1,
  shopTypeModifier: number = 1.0
): number {
  return Math.floor(basePrice * quantity * shopTypeModifier);
}

/**
 * Calculate sell price for an item (typically 40-50% of buy price)
 *
 * @param item - Item being sold
 * @param quantity - Number of items to sell
 * @returns Total gold gained from selling
 */
export function calculateSellPrice(item: ReactItem | EnhancedItem, quantity: number = 1): number {
  // Check if item has explicit sellPrice, otherwise use default multiplier
  const baseValue = item.value || 0;
  const sellMultiplier = DEFAULT_ECONOMY_CONFIG.defaultSellMultiplier;

  // Use sellPrice if defined on item, otherwise calculate from value
  const sellPrice =
    'sellPrice' in item && item.sellPrice !== undefined
      ? item.sellPrice
      : Math.floor(baseValue * sellMultiplier);

  return Math.max(1, sellPrice * quantity); // Minimum 1 gold per item
}

/**
 * Check if player has sufficient gold to afford an item purchase
 *
 * @param player - Current player state
 * @param totalCost - Total gold cost of purchase
 * @returns true if player can afford the purchase
 */
export function canAffordItem(player: ReactPlayer, totalCost: number): boolean {
  return player.gold >= totalCost;
}

/**
 * Check how many gold the player needs to afford an item
 *
 * @param player - Current player state
 * @param totalCost - Total gold cost
 * @returns Amount of gold needed (0 if already affordable)
 */
export function goldNeededToAfford(player: ReactPlayer, totalCost: number): number {
  return Math.max(0, totalCost - player.gold);
}

// =============================================================================
// INVENTORY CAPACITY CHECKS
// =============================================================================

/**
 * Check if player has inventory space for new items
 *
 * @param currentInventory - Player's current inventory
 * @param quantityToAdd - Number of items being added
 * @returns true if there's enough space
 */
export function hasInventorySpace(
  currentInventory: (ReactItem | EnhancedItem)[],
  quantityToAdd: number = 1
): boolean {
  const currentItemCount = currentInventory.reduce((total, item) => {
    return total + (item.quantity || 1);
  }, 0);

  return currentItemCount + quantityToAdd <= MAX_INVENTORY_SIZE;
}

/**
 * Calculate available inventory slots
 *
 * @param currentInventory - Player's current inventory
 * @returns Number of free slots
 */
export function getAvailableInventorySlots(currentInventory: (ReactItem | EnhancedItem)[]): number {
  const currentItemCount = currentInventory.reduce((total, item) => {
    return total + (item.quantity || 1);
  }, 0);

  return Math.max(0, MAX_INVENTORY_SIZE - currentItemCount);
}

// =============================================================================
// TRANSACTION VALIDATION
// =============================================================================

/**
 * Validate a transaction before processing
 * Comprehensive error checking with kid-friendly messages
 *
 * @param player - Current player state
 * @param item - Item being transacted
 * @param quantity - Number of items
 * @param transactionType - 'buy' or 'sell'
 * @param currentInventory - Player's current inventory
 * @param totalCost - Total transaction cost (for buy) or value (for sell)
 * @returns Validation result with errors, warnings, and suggestions
 */
export function validateTransaction(
  player: ReactPlayer,
  item: ReactItem | EnhancedItem,
  quantity: number,
  transactionType: TransactionType,
  currentInventory: (ReactItem | EnhancedItem)[],
  totalCost: number
): TransactionValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Validate quantity
  if (quantity <= 0) {
    errors.push('Quantity must be at least 1');
  }

  if (quantity > 99) {
    errors.push('You can only buy/sell up to 99 items at once');
  }

  // Transaction-specific validation
  if (transactionType === 'buy') {
    // Check affordability
    if (!canAffordItem(player, totalCost)) {
      const goldNeeded = goldNeededToAfford(player, totalCost);
      errors.push(`You need ${goldNeeded} more gold for this purchase!`);
      suggestions.push("Try selling some items you don't need");
    }

    // Check inventory space
    if (!hasInventorySpace(currentInventory, quantity)) {
      const availableSlots = getAvailableInventorySlots(currentInventory);
      errors.push(`Your inventory is full! You only have space for ${availableSlots} more items.`);
      suggestions.push('Sell or use some items to make space');
    }

    // Warn if purchase will leave player with low gold
    if (player.gold - totalCost < DEFAULT_ECONOMY_CONFIG.minGoldWarning) {
      warnings.push('This will leave you with very little gold. Are you sure?');
    }
  } else if (transactionType === 'sell') {
    // Check if player owns the item
    const inventoryItem = currentInventory.find(invItem => invItem.id === item.id);

    if (!inventoryItem) {
      errors.push("You don't own this item!");
    } else if (inventoryItem.quantity < quantity) {
      errors.push(`You only have ${inventoryItem.quantity} of this item`);
      suggestions.push(`Try selling ${inventoryItem.quantity} instead`);
    }

    // Check if item is equipped
    if ('isEquipped' in item && item.isEquipped) {
      errors.push('You need to unequip this item first!');
      suggestions.push('Go to your equipment screen to unequip it');
    }

    // Check if item is quest-critical
    // TODO: Implement quest item checking when quest system is integrated
    // For now, we'll add a generic check
    if (item.type === 'material' && item.rarity === 'rare') {
      warnings.push('This might be needed for a quest. Double-check before selling!');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
}

// =============================================================================
// TRANSACTION PROCESSING
// =============================================================================

/**
 * Process a buy transaction
 * Returns updated player state and transaction result
 *
 * @param player - Current player state
 * @param item - Item being purchased
 * @param quantity - Number of items to buy
 * @param totalCost - Total gold cost
 * @param currentInventory - Current inventory state
 * @returns Transaction result with updated state
 */
export function processBuyTransaction(
  player: ReactPlayer,
  item: ReactItem | EnhancedItem,
  quantity: number,
  totalCost: number,
  currentInventory: (ReactItem | EnhancedItem)[]
): TransactionResult {
  // Check specific conditions FIRST to provide specific status codes

  // Check affordability
  if (!canAffordItem(player, totalCost)) {
    return {
      success: false,
      status: 'insufficient_funds',
      newGoldBalance: player.gold,
      message: `You need ${goldNeededToAfford(player, totalCost)} more gold!`,
      error: {
        code: 'INSUFFICIENT_FUNDS',
        category: 'economy',
        message: 'Not enough gold for this purchase',
        suggestion: 'Try selling items or fighting monsters for gold',
      },
    };
  }

  // Check inventory space
  if (!hasInventorySpace(currentInventory, quantity)) {
    return {
      success: false,
      status: 'inventory_full',
      newGoldBalance: player.gold,
      message: 'Your inventory is full!',
      error: {
        code: 'INVENTORY_FULL',
        category: 'inventory',
        message: 'No space in inventory',
        suggestion: 'Sell or use items to make room',
      },
    };
  }

  // Now validate transaction for other conditions
  const validation = validateTransaction(
    player,
    item,
    quantity,
    'buy',
    currentInventory,
    totalCost
  );

  if (!validation.valid) {
    return {
      success: false,
      status: 'failed',
      newGoldBalance: player.gold,
      message: validation.errors[0] || 'Transaction failed',
      error: {
        code: 'VALIDATION_FAILED',
        category: 'validation',
        message: validation.errors[0] || 'Transaction validation failed',
        suggestion: validation.suggestions[0],
      },
    };
  }

  // Process the transaction
  const newGoldBalance = player.gold - totalCost;

  // Create transaction record
  const transaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    type: 'buy' as TransactionType,
    item,
    quantity,
    goldAmount: -totalCost,
    timestamp: new Date(),
    playerLevel: player.level,
    status: 'success' as TransactionStatus,
  };

  // Determine appropriate success message
  let message = `You bought ${quantity} ${item.name}${quantity > 1 ? 's' : ''}!`;
  if (item.rarity === 'rare' || item.rarity === 'epic' || item.rarity === 'legendary') {
    message = `Awesome! You got ${quantity} ${item.name}${quantity > 1 ? 's' : ''}!`;
  }

  return {
    success: true,
    status: 'success',
    transaction,
    newGoldBalance,
    message,
    effects: [
      {
        type: 'gold_change',
        description: `Spent ${totalCost} gold`,
        value: -totalCost,
      },
      {
        type: 'item_acquired',
        description: `Received ${quantity} ${item.name}`,
        value: { itemId: item.id, quantity },
      },
    ],
  };
}

/**
 * Process a sell transaction
 * Returns updated player state and transaction result
 *
 * @param player - Current player state
 * @param item - Item being sold
 * @param quantity - Number of items to sell
 * @param totalValue - Total gold value
 * @param currentInventory - Current inventory state
 * @returns Transaction result with updated state
 */
export function processSellTransaction(
  player: ReactPlayer,
  item: ReactItem | EnhancedItem,
  quantity: number,
  totalValue: number,
  currentInventory: (ReactItem | EnhancedItem)[]
): TransactionResult {
  // Check specific conditions FIRST to provide specific error codes

  // Check if player owns the item
  const inventoryItem = currentInventory.find(invItem => invItem.id === item.id);
  if (!inventoryItem) {
    return {
      success: false,
      status: 'failed',
      newGoldBalance: player.gold,
      message: `You don't own this item!`,
      error: {
        code: 'INSUFFICIENT_ITEMS',
        category: 'inventory',
        message: `You don't own this item!`,
        suggestion: 'Check your inventory',
      },
    };
  }

  // Check if player owns enough
  if (inventoryItem.quantity < quantity) {
    return {
      success: false,
      status: 'failed',
      newGoldBalance: player.gold,
      message: `You only have ${inventoryItem.quantity} of this item`,
      error: {
        code: 'INSUFFICIENT_ITEMS',
        category: 'inventory',
        message: `You only have ${inventoryItem.quantity} ${item.name}`,
        suggestion: `Try selling ${inventoryItem.quantity} instead`,
      },
    };
  }

  // Check if item is equipped
  if ('isEquipped' in item && item.isEquipped) {
    return {
      success: false,
      status: 'failed',
      newGoldBalance: player.gold,
      message: 'You need to unequip this item first!',
      error: {
        code: 'ITEM_EQUIPPED',
        category: 'inventory',
        message: 'You need to unequip this item first!',
        suggestion: 'Go to your equipment screen to unequip it',
      },
    };
  }

  // Now validate transaction for other conditions
  const validation = validateTransaction(
    player,
    item,
    quantity,
    'sell',
    currentInventory,
    totalValue
  );

  if (!validation.valid) {
    return {
      success: false,
      status: 'failed',
      newGoldBalance: player.gold,
      message: validation.errors[0] || 'Transaction failed',
      error: {
        code: 'VALIDATION_FAILED',
        category: 'validation',
        message: validation.errors[0] || 'Transaction validation failed',
        suggestion: validation.suggestions[0],
      },
    };
  }

  // Prevent gold overflow (duplicate checks removed - already done above)
  const newGoldBalance = Math.min(player.gold + totalValue, DEFAULT_ECONOMY_CONFIG.maxGold);

  const actualGoldGained = newGoldBalance - player.gold;

  // Create transaction record
  const transaction = {
    id: `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    type: 'sell' as TransactionType,
    item,
    quantity,
    goldAmount: actualGoldGained,
    timestamp: new Date(),
    playerLevel: player.level,
    status: 'success' as TransactionStatus,
  };

  const message = `You sold ${quantity} ${item.name}${quantity > 1 ? 's' : ''} for ${actualGoldGained} gold!`;

  return {
    success: true,
    status: 'success',
    transaction,
    newGoldBalance,
    message,
    effects: [
      {
        type: 'gold_change',
        description: `Earned ${actualGoldGained} gold`,
        value: actualGoldGained,
      },
      {
        type: 'item_removed',
        description: `Sold ${quantity} ${item.name}`,
        value: { itemId: item.id, quantity },
      },
    ],
  };
}

/**
 * Get transaction success message based on context
 * Age-appropriate and encouraging
 *
 * @param transactionType - Type of transaction
 * @param itemName - Name of item
 * @param quantity - Number of items
 * @param goldAmount - Gold involved
 * @returns Encouraging message
 */
export function getTransactionSuccessMessage(
  transactionType: TransactionType,
  itemName: string,
  quantity: number,
  goldAmount: number
): string {
  const pluralSuffix = quantity > 1 ? 's' : '';

  if (transactionType === 'buy') {
    const messages = [
      `Great choice! You got ${quantity} ${itemName}${pluralSuffix}!`,
      `Awesome! ${quantity} ${itemName}${pluralSuffix} added to your inventory!`,
      `Nice! You bought ${quantity} ${itemName}${pluralSuffix}!`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  } else {
    return `You sold ${quantity} ${itemName}${pluralSuffix} for ${goldAmount} gold!`;
  }
}
