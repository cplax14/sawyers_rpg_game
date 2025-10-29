/**
 * Shop System Utilities Tests
 *
 * Comprehensive unit tests for all shop system functions
 * Tests include edge cases, validation, and economy balance
 */

import {
  canUnlockShop,
  getShopUnlockRequirement,
  canUnlockShopItem,
  filterShopInventory,
  calculateBuyPrice,
  calculateSellPrice,
  canAffordItem,
  goldNeededToAfford,
  hasInventorySpace,
  getAvailableInventorySlots,
  validateTransaction,
  processBuyTransaction,
  processSellTransaction,
  getTransactionSuccessMessage,
} from './shopSystem';

import { Shop, ShopInventory, ShopInventoryItem, DEFAULT_ECONOMY_CONFIG } from '../types/shop';
import { ReactPlayer } from '../contexts/ReactGameContext';
import { ReactItem } from '../types/game';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const createMockPlayer = (overrides?: Partial<ReactPlayer>): ReactPlayer => ({
  id: 'player-1',
  name: 'Test Hero',
  class: 'knight',
  level: 5,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  experience: 500,
  experienceToNext: 600,
  gold: 1000,
  baseStats: {
    attack: 10,
    defense: 8,
    magicAttack: 5,
    magicDefense: 6,
    speed: 7,
    accuracy: 80,
  },
  stats: {
    attack: 10,
    defense: 8,
    magicAttack: 5,
    magicDefense: 6,
    speed: 7,
    accuracy: 80,
  },
  equipment: {
    weapon: null,
    armor: null,
    accessory: null,
    helmet: null,
    necklace: null,
    shield: null,
    gloves: null,
    boots: null,
    ring1: null,
    ring2: null,
    charm: null,
  },
  spells: [],
  ...overrides,
});

const createMockShop = (overrides?: Partial<Shop>): Shop => ({
  id: 'test-shop',
  name: 'Test Shop',
  type: 'general',
  location: 'test-area',
  shopkeeper: {
    name: 'Test Keeper',
    mood: 'happy',
    dialogue: {
      greeting: 'Welcome!',
      buyDialogue: 'Thanks!',
      sellDialogue: 'Great!',
    },
  },
  buysCategories: ['consumables', 'materials'],
  ...overrides,
});

const createMockItem = (overrides?: Partial<ReactItem>): ReactItem => ({
  id: 'test-item',
  name: 'Test Item',
  description: 'A test item',
  type: 'consumable',
  rarity: 'common',
  value: 100,
  quantity: 1,
  icon: '🧪',
  ...overrides,
});

const createMockShopInventory = (items: ShopInventoryItem[]): ShopInventory => ({
  shopId: 'test-shop',
  items,
});

// =============================================================================
// SHOP UNLOCK TESTS
// =============================================================================

describe('Shop Unlock Functions', () => {
  describe('canUnlockShop', () => {
    it('should return true for shop with no requirements', () => {
      const player = createMockPlayer();
      const shop = createMockShop();

      expect(canUnlockShop(player, shop)).toBe(true);
    });

    it('should return true when all requirements are met', () => {
      const player = createMockPlayer({ level: 10, gold: 500 });
      const shop = createMockShop({
        unlockRequirements: {
          level: 5,
          storyProgress: 1,
        },
      });

      expect(canUnlockShop(player, shop, [], 2)).toBe(true);
    });

    it('should return false when level requirement not met', () => {
      const player = createMockPlayer({ level: 3 });
      const shop = createMockShop({
        unlockRequirements: { level: 5 },
      });

      expect(canUnlockShop(player, shop)).toBe(false);
    });

    it('should return false when story progress not met', () => {
      const player = createMockPlayer({ level: 10 });
      const shop = createMockShop({
        unlockRequirements: { storyProgress: 3 },
      });

      expect(canUnlockShop(player, shop, [], 1)).toBe(false);
    });

    it('should return false when area completion not met', () => {
      const player = createMockPlayer({ level: 10 });
      const shop = createMockShop({
        unlockRequirements: { areaCompletion: 'forest-area' },
      });

      expect(canUnlockShop(player, shop, ['town-area'])).toBe(false);
    });

    it('should return true when area completion is met', () => {
      const player = createMockPlayer({ level: 10 });
      const shop = createMockShop({
        unlockRequirements: { areaCompletion: 'forest-area' },
      });

      expect(canUnlockShop(player, shop, ['forest-area', 'town-area'])).toBe(true);
    });
  });

  describe('getShopUnlockRequirement', () => {
    it('should return null for unlocked shop', () => {
      const player = createMockPlayer({ level: 10 });
      const shop = createMockShop();

      expect(getShopUnlockRequirement(player, shop)).toBeNull();
    });

    it('should return level requirement message', () => {
      const player = createMockPlayer({ level: 3 });
      const shop = createMockShop({
        unlockRequirements: { level: 5 },
      });

      expect(getShopUnlockRequirement(player, shop)).toBe('Reach level 5');
    });

    it('should return story progress requirement message', () => {
      const player = createMockPlayer({ level: 10 });
      const shop = createMockShop({
        unlockRequirements: { storyProgress: 3 },
      });

      expect(getShopUnlockRequirement(player, shop, [], 1)).toBe('Complete chapter 3');
    });

    it('should return area completion requirement message', () => {
      const player = createMockPlayer({ level: 10 });
      const shop = createMockShop({
        unlockRequirements: { areaCompletion: 'dark-forest' },
      });

      expect(getShopUnlockRequirement(player, shop, [])).toBe('Complete dark-forest');
    });

    it('should prioritize level requirement over others', () => {
      const player = createMockPlayer({ level: 3 });
      const shop = createMockShop({
        unlockRequirements: {
          level: 5,
          storyProgress: 2,
          areaCompletion: 'forest',
        },
      });

      expect(getShopUnlockRequirement(player, shop)).toBe('Reach level 5');
    });
  });
});

// =============================================================================
// INVENTORY FILTERING TESTS
// =============================================================================

describe('Inventory Filtering Functions', () => {
  describe('canUnlockShopItem', () => {
    it('should return true for item with no requirements', () => {
      const player = createMockPlayer();
      expect(canUnlockShopItem(player, undefined)).toBe(true);
    });

    it('should return true when level requirement is met', () => {
      const player = createMockPlayer({ level: 10 });
      expect(canUnlockShopItem(player, { level: 5 })).toBe(true);
    });

    it('should return false when level requirement not met', () => {
      const player = createMockPlayer({ level: 3 });
      expect(canUnlockShopItem(player, { level: 5 })).toBe(false);
    });

    it('should check area completion requirements', () => {
      const player = createMockPlayer();
      const reqs = { areaCompletion: 'forest-area' };

      expect(canUnlockShopItem(player, reqs, [])).toBe(false);
      expect(canUnlockShopItem(player, reqs, ['forest-area'])).toBe(true);
    });

    it('should check quest completion requirements', () => {
      const player = createMockPlayer();
      const reqs = { questCompletion: 'rescue-quest' };

      expect(canUnlockShopItem(player, reqs, [], [])).toBe(false);
      expect(canUnlockShopItem(player, reqs, [], ['rescue-quest'])).toBe(true);
    });

    it('should check previous purchase requirements', () => {
      const player = createMockPlayer();
      const reqs = { previousPurchases: ['item-1', 'item-2'] };

      expect(canUnlockShopItem(player, reqs, [], [], ['item-1'])).toBe(false);
      expect(canUnlockShopItem(player, reqs, [], [], ['item-1', 'item-2'])).toBe(true);
    });
  });

  describe('filterShopInventory', () => {
    it('should return all items when no requirements', () => {
      const player = createMockPlayer();
      const inventory = createMockShopInventory([
        { itemId: 'item-1', stock: 10 },
        { itemId: 'item-2', stock: 5 },
      ]);

      const filtered = filterShopInventory(inventory, player);
      expect(filtered).toHaveLength(2);
    });

    it('should filter out items player cannot unlock', () => {
      const player = createMockPlayer({ level: 3 });
      const inventory = createMockShopInventory([
        { itemId: 'item-1', stock: 10, unlockRequirements: { level: 1 } },
        { itemId: 'item-2', stock: 5, unlockRequirements: { level: 5 } },
        { itemId: 'item-3', stock: 3, unlockRequirements: { level: 10 } },
      ]);

      const filtered = filterShopInventory(inventory, player);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].itemId).toBe('item-1');
    });

    it('should mark filtered items as unlocked', () => {
      const player = createMockPlayer({ level: 5 });
      const inventory = createMockShopInventory([
        { itemId: 'item-1', stock: 10, unlockRequirements: { level: 3 } },
      ]);

      const filtered = filterShopInventory(inventory, player);
      expect(filtered[0].unlocked).toBe(true);
    });
  });
});

// =============================================================================
// PRICING AND AFFORDABILITY TESTS
// =============================================================================

describe('Pricing Functions', () => {
  describe('calculateBuyPrice', () => {
    it('should calculate single item price', () => {
      expect(calculateBuyPrice(100, 1, 1.0)).toBe(100);
    });

    it('should calculate multiple items price', () => {
      expect(calculateBuyPrice(100, 5, 1.0)).toBe(500);
    });

    it('should apply shop type modifier', () => {
      // Magic shop 20% markup
      expect(calculateBuyPrice(100, 1, 1.2)).toBe(120);
    });

    it('should floor the result', () => {
      expect(calculateBuyPrice(100, 3, 1.15)).toBe(345); // 345 floored
    });
  });

  describe('calculateSellPrice', () => {
    it('should calculate sell price at 50% of value', () => {
      const item = createMockItem({ value: 100 });
      expect(calculateSellPrice(item, 1)).toBe(50);
    });

    it('should calculate for multiple items', () => {
      const item = createMockItem({ value: 100 });
      expect(calculateSellPrice(item, 3)).toBe(150);
    });

    it('should use explicit sellPrice if provided', () => {
      const item = createMockItem({ value: 100 }) as any;
      item.sellPrice = 60;
      expect(calculateSellPrice(item, 1)).toBe(60);
    });

    it('should return minimum 1 gold per item', () => {
      const item = createMockItem({ value: 1 });
      expect(calculateSellPrice(item, 1)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('canAffordItem', () => {
    it('should return true when player has enough gold', () => {
      const player = createMockPlayer({ gold: 500 });
      expect(canAffordItem(player, 300)).toBe(true);
    });

    it('should return true when gold exactly matches cost', () => {
      const player = createMockPlayer({ gold: 500 });
      expect(canAffordItem(player, 500)).toBe(true);
    });

    it('should return false when player lacks gold', () => {
      const player = createMockPlayer({ gold: 200 });
      expect(canAffordItem(player, 300)).toBe(false);
    });
  });

  describe('goldNeededToAfford', () => {
    it('should return 0 when player can afford', () => {
      const player = createMockPlayer({ gold: 500 });
      expect(goldNeededToAfford(player, 300)).toBe(0);
    });

    it('should return gold shortfall', () => {
      const player = createMockPlayer({ gold: 200 });
      expect(goldNeededToAfford(player, 300)).toBe(100);
    });
  });
});

// =============================================================================
// INVENTORY CAPACITY TESTS
// =============================================================================

describe('Inventory Capacity Functions', () => {
  describe('hasInventorySpace', () => {
    it('should return true when inventory has space', () => {
      const inventory = [
        createMockItem({ quantity: 10 }),
        createMockItem({ id: 'item-2', quantity: 5 }),
      ];
      expect(hasInventorySpace(inventory, 5)).toBe(true);
    });

    it('should return false when inventory is full', () => {
      const inventory = Array(50)
        .fill(null)
        .map((_, i) => createMockItem({ id: `item-${i}`, quantity: 1 }));
      expect(hasInventorySpace(inventory, 1)).toBe(false);
    });

    it('should return true when adding exactly fills inventory', () => {
      const inventory = Array(45)
        .fill(null)
        .map((_, i) => createMockItem({ id: `item-${i}`, quantity: 1 }));
      expect(hasInventorySpace(inventory, 5)).toBe(true);
    });
  });

  describe('getAvailableInventorySlots', () => {
    it('should return correct available slots', () => {
      const inventory = [
        createMockItem({ quantity: 10 }),
        createMockItem({ id: 'item-2', quantity: 5 }),
      ];
      expect(getAvailableInventorySlots(inventory)).toBe(35); // 50 - 15
    });

    it('should return 0 when inventory is full', () => {
      const inventory = Array(50)
        .fill(null)
        .map((_, i) => createMockItem({ id: `item-${i}`, quantity: 1 }));
      expect(getAvailableInventorySlots(inventory)).toBe(0);
    });

    it('should return 50 for empty inventory', () => {
      expect(getAvailableInventorySlots([])).toBe(50);
    });
  });
});

// =============================================================================
// TRANSACTION VALIDATION TESTS
// =============================================================================

describe('Transaction Validation', () => {
  describe('validateTransaction', () => {
    it('should validate successful buy transaction', () => {
      const player = createMockPlayer({ gold: 500 });
      const item = createMockItem({ value: 100 });
      const inventory: ReactItem[] = [];

      const result = validateTransaction(player, item, 1, 'buy', inventory, 100);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject zero quantity', () => {
      const player = createMockPlayer();
      const item = createMockItem();
      const inventory: ReactItem[] = [];

      const result = validateTransaction(player, item, 0, 'buy', inventory, 0);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('at least 1');
    });

    it('should reject quantity over 99', () => {
      const player = createMockPlayer({ gold: 10000 });
      const item = createMockItem({ value: 10 });
      const inventory: ReactItem[] = [];

      const result = validateTransaction(player, item, 100, 'buy', inventory, 1000);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('99');
    });

    it('should reject buy when player cannot afford', () => {
      const player = createMockPlayer({ gold: 50 });
      const item = createMockItem({ value: 100 });
      const inventory: ReactItem[] = [];

      const result = validateTransaction(player, item, 1, 'buy', inventory, 100);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('more gold');
    });

    it('should provide suggestions when cannot afford', () => {
      const player = createMockPlayer({ gold: 50 });
      const item = createMockItem({ value: 100 });
      const inventory: ReactItem[] = [];

      const result = validateTransaction(player, item, 1, 'buy', inventory, 100);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should reject buy when inventory is full', () => {
      const player = createMockPlayer({ gold: 500 });
      const item = createMockItem({ value: 100 });
      const inventory = Array(50)
        .fill(null)
        .map((_, i) => createMockItem({ id: `item-${i}`, quantity: 1 }));

      const result = validateTransaction(player, item, 1, 'buy', inventory, 100);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('full');
    });

    it('should warn when purchase leaves low gold', () => {
      const player = createMockPlayer({ gold: 150 });
      const item = createMockItem({ value: 100 });
      const inventory: ReactItem[] = [];

      const result = validateTransaction(player, item, 1, 'buy', inventory, 100);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should reject sell when player does not own item', () => {
      const player = createMockPlayer();
      const item = createMockItem({ id: 'rare-item' });
      const inventory: ReactItem[] = [];

      const result = validateTransaction(player, item, 1, 'sell', inventory, 50);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("don't own");
    });

    it('should reject sell when quantity exceeds owned', () => {
      const player = createMockPlayer();
      const item = createMockItem({ id: 'potion', quantity: 2 });
      const inventory = [item];

      const result = validateTransaction(player, item, 5, 'sell', inventory, 250);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('only have 2');
    });

    it('should reject sell of equipped items', () => {
      const player = createMockPlayer();
      const item = { ...createMockItem(), isEquipped: true } as any;
      const inventory = [item];

      const result = validateTransaction(player, item, 1, 'sell', inventory, 50);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('unequip');
    });

    it('should warn when selling rare materials', () => {
      const player = createMockPlayer();
      const item = createMockItem({ type: 'material', rarity: 'rare' });
      const inventory = [item];

      const result = validateTransaction(player, item, 1, 'sell', inventory, 50);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});

// =============================================================================
// TRANSACTION PROCESSING TESTS
// =============================================================================

describe('Transaction Processing', () => {
  describe('processBuyTransaction', () => {
    it('should process successful buy transaction', () => {
      const player = createMockPlayer({ gold: 500 });
      const item = createMockItem({ value: 100 });
      const inventory: ReactItem[] = [];

      const result = processBuyTransaction(player, item, 1, 100, inventory);

      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.newGoldBalance).toBe(400);
      expect(result.transaction).toBeDefined();
      expect(result.message).toContain('bought');
    });

    it('should create transaction record with correct data', () => {
      const player = createMockPlayer({ gold: 500, level: 5 });
      const item = createMockItem({ value: 100 });
      const inventory: ReactItem[] = [];

      const result = processBuyTransaction(player, item, 2, 200, inventory);

      expect(result.transaction).toBeDefined();
      expect(result.transaction!.type).toBe('buy');
      expect(result.transaction!.quantity).toBe(2);
      expect(result.transaction!.goldAmount).toBe(-200);
      expect(result.transaction!.playerLevel).toBe(5);
    });

    it('should include effects in result', () => {
      const player = createMockPlayer({ gold: 500 });
      const item = createMockItem({ value: 100 });
      const inventory: ReactItem[] = [];

      const result = processBuyTransaction(player, item, 1, 100, inventory);

      expect(result.effects).toBeDefined();
      expect(result.effects!.length).toBeGreaterThan(0);
      expect(result.effects!.some(e => e.type === 'gold_change')).toBe(true);
      expect(result.effects!.some(e => e.type === 'item_acquired')).toBe(true);
    });

    it('should fail when player cannot afford', () => {
      const player = createMockPlayer({ gold: 50 });
      const item = createMockItem({ value: 100 });
      const inventory: ReactItem[] = [];

      const result = processBuyTransaction(player, item, 1, 100, inventory);

      expect(result.success).toBe(false);
      expect(result.status).toBe('insufficient_funds');
      expect(result.error).toBeDefined();
      expect(result.error!.code).toBe('INSUFFICIENT_FUNDS');
    });

    it('should fail when inventory is full', () => {
      const player = createMockPlayer({ gold: 500 });
      const item = createMockItem({ value: 100 });
      const inventory = Array(50)
        .fill(null)
        .map((_, i) => createMockItem({ id: `item-${i}`, quantity: 1 }));

      const result = processBuyTransaction(player, item, 1, 100, inventory);

      expect(result.success).toBe(false);
      expect(result.status).toBe('inventory_full');
      expect(result.error!.code).toBe('INVENTORY_FULL');
    });

    it('should use encouraging message for rare items', () => {
      const player = createMockPlayer({ gold: 500 });
      const item = createMockItem({ value: 100, rarity: 'epic' });
      const inventory: ReactItem[] = [];

      const result = processBuyTransaction(player, item, 1, 100, inventory);

      expect(result.message).toContain('Awesome');
    });
  });

  describe('processSellTransaction', () => {
    it('should process successful sell transaction', () => {
      const player = createMockPlayer({ gold: 100 });
      const item = createMockItem({ value: 100, quantity: 1 });
      const inventory = [item];

      const result = processSellTransaction(player, item, 1, 50, inventory);

      expect(result.success).toBe(true);
      expect(result.status).toBe('success');
      expect(result.newGoldBalance).toBe(150);
    });

    it('should create transaction record for sell', () => {
      const player = createMockPlayer({ gold: 100 });
      const item = createMockItem({ value: 100, quantity: 3 });
      const inventory = [item];

      const result = processSellTransaction(player, item, 2, 100, inventory);

      expect(result.transaction).toBeDefined();
      expect(result.transaction!.type).toBe('sell');
      expect(result.transaction!.quantity).toBe(2);
      expect(result.transaction!.goldAmount).toBe(100);
    });

    it('should fail when player does not own item', () => {
      const player = createMockPlayer({ gold: 100 });
      const item = createMockItem({ id: 'nonexistent' });
      const inventory: ReactItem[] = [];

      const result = processSellTransaction(player, item, 1, 50, inventory);

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('INSUFFICIENT_ITEMS');
    });

    it('should fail when selling more than owned', () => {
      const player = createMockPlayer({ gold: 100 });
      const item = createMockItem({ quantity: 2 });
      const inventory = [item];

      const result = processSellTransaction(player, item, 5, 250, inventory);

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('INSUFFICIENT_ITEMS');
    });

    it('should fail when item is equipped', () => {
      const player = createMockPlayer({ gold: 100 });
      const item = { ...createMockItem(), isEquipped: true } as any;
      const inventory = [item];

      const result = processSellTransaction(player, item, 1, 50, inventory);

      expect(result.success).toBe(false);
      expect(result.error!.code).toBe('ITEM_EQUIPPED');
    });

    it('should prevent gold overflow', () => {
      const player = createMockPlayer({ gold: DEFAULT_ECONOMY_CONFIG.maxGold - 50 });
      const item = createMockItem({ value: 200, quantity: 1 });
      const inventory = [item];

      const result = processSellTransaction(player, item, 1, 100, inventory);

      expect(result.newGoldBalance).toBe(DEFAULT_ECONOMY_CONFIG.maxGold);
      expect(result.transaction!.goldAmount).toBeLessThanOrEqual(50);
    });
  });

  describe('getTransactionSuccessMessage', () => {
    it('should return buy message', () => {
      const message = getTransactionSuccessMessage('buy', 'Potion', 1, 50);
      expect(message).toContain('Potion');
      expect(message.toLowerCase()).toMatch(/bought|got|added/);
    });

    it('should handle plural items', () => {
      const message = getTransactionSuccessMessage('buy', 'Potion', 5, 250);
      expect(message).toContain('5');
      expect(message).toContain('Potions');
    });

    it('should return sell message with gold amount', () => {
      const message = getTransactionSuccessMessage('sell', 'Sword', 1, 150);
      expect(message).toContain('sold');
      expect(message).toContain('150');
      expect(message).toContain('gold');
    });

    it('should use random encouraging messages for buys', () => {
      const messages = new Set<string>();
      for (let i = 0; i < 10; i++) {
        messages.add(getTransactionSuccessMessage('buy', 'Item', 1, 50));
      }
      // Should have some variety in messages
      expect(messages.size).toBeGreaterThan(1);
    });
  });
});

// =============================================================================
// EDGE CASES AND STRESS TESTS
// =============================================================================

describe('Edge Cases', () => {
  it('should handle zero gold player', () => {
    const player = createMockPlayer({ gold: 0 });
    expect(canAffordItem(player, 1)).toBe(false);
    expect(goldNeededToAfford(player, 100)).toBe(100);
  });

  it('should handle maximum gold', () => {
    const player = createMockPlayer({ gold: DEFAULT_ECONOMY_CONFIG.maxGold });
    expect(canAffordItem(player, 1000)).toBe(true);
  });

  it('should handle very large quantities', () => {
    const price = calculateBuyPrice(10, 99, 1.0);
    expect(price).toBe(990);
  });

  it('should handle very cheap items', () => {
    const item = createMockItem({ value: 1 });
    const sellPrice = calculateSellPrice(item, 1);
    expect(sellPrice).toBeGreaterThanOrEqual(1);
  });

  it('should handle empty inventory', () => {
    expect(hasInventorySpace([], 1)).toBe(true);
    expect(getAvailableInventorySlots([])).toBe(50);
  });

  it('should handle exact inventory limit', () => {
    const inventory = Array(50)
      .fill(null)
      .map((_, i) => createMockItem({ id: `item-${i}`, quantity: 1 }));
    expect(hasInventorySpace(inventory, 0)).toBe(true);
    expect(hasInventorySpace(inventory, 1)).toBe(false);
  });
});
