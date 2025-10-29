/**
 * Shop Type Definitions Tests
 *
 * Validates type structure, type guards, and utility functions for the shop system.
 */

import {
  Shop,
  ShopType,
  ShopInventory,
  ShopInventoryItem,
  NPCTrade,
  TradeType,
  Transaction,
  TransactionResult,
  TransactionType,
  Shopkeeper,
  ShopkeeperDialog,
  PlayerShopState,
  EconomyConfig,
  DEFAULT_ECONOMY_CONFIG,
  isShop,
  isNPCTrade,
  isTransactionResult,
  SHOP_TYPE_INFO,
  SHOP_CATEGORY_NAMES,
  MAX_TRANSACTION_HISTORY,
  MAX_INVENTORY_SIZE,
} from './shop';

describe('Shop Type Definitions', () => {
  // =============================================================================
  // TYPE CONSTANTS AND ENUMS
  // =============================================================================

  describe('ShopType', () => {
    it('should include all 5 shop types', () => {
      const shopTypes: ShopType[] = ['general', 'weapon', 'armor', 'magic', 'apothecary'];

      shopTypes.forEach(type => {
        expect(['general', 'weapon', 'armor', 'magic', 'apothecary']).toContain(type);
      });
    });

    it('should have metadata for all shop types', () => {
      const shopTypes: ShopType[] = ['general', 'weapon', 'armor', 'magic', 'apothecary'];

      shopTypes.forEach(type => {
        expect(SHOP_TYPE_INFO[type]).toBeDefined();
        expect(SHOP_TYPE_INFO[type].name).toBeTruthy();
        expect(SHOP_TYPE_INFO[type].icon).toBeTruthy();
        expect(SHOP_TYPE_INFO[type].description).toBeTruthy();
      });
    });
  });

  describe('TransactionType', () => {
    it('should include buy and sell', () => {
      const types: TransactionType[] = ['buy', 'sell'];

      types.forEach(type => {
        expect(['buy', 'sell']).toContain(type);
      });
    });
  });

  describe('TradeType', () => {
    it('should include barter and quest', () => {
      const types: TradeType[] = ['barter', 'quest'];

      types.forEach(type => {
        expect(['barter', 'quest']).toContain(type);
      });
    });
  });

  // =============================================================================
  // SHOP INTERFACE VALIDATION
  // =============================================================================

  describe('Shop Interface', () => {
    const validShopkeeper: Shopkeeper = {
      name: 'Rosie the Shopkeeper',
      mood: 'happy',
      dialogue: {
        greeting: 'Welcome to my shop!',
        buyDialogue: 'Great choice!',
        sellDialogue: 'Thanks for the items!',
      },
      avatar: '👩',
    };

    const validShop: Shop = {
      id: 'test-shop-1',
      name: "Rosie's Remedies & Rarities",
      type: 'general',
      location: 'mistwood-forest',
      shopkeeper: validShopkeeper,
      buysCategories: ['consumables', 'materials'],
      status: 'unlocked',
    };

    it('should validate required fields', () => {
      expect(validShop.id).toBeDefined();
      expect(validShop.name).toBeDefined();
      expect(validShop.type).toBeDefined();
      expect(validShop.location).toBeDefined();
      expect(validShop.shopkeeper).toBeDefined();
      expect(validShop.buysCategories).toBeDefined();
    });

    it('should have valid shop type', () => {
      const validTypes: ShopType[] = ['general', 'weapon', 'armor', 'magic', 'apothecary'];
      expect(validTypes).toContain(validShop.type);
    });

    it('should have shopkeeper with required dialogue', () => {
      expect(validShop.shopkeeper.name).toBeTruthy();
      expect(validShop.shopkeeper.dialogue).toBeDefined();
      expect(validShop.shopkeeper.dialogue.greeting).toBeTruthy();
      expect(validShop.shopkeeper.dialogue.buyDialogue).toBeTruthy();
      expect(validShop.shopkeeper.dialogue.sellDialogue).toBeTruthy();
    });

    it('should have age-appropriate shopkeeper name', () => {
      // Names should not contain inappropriate language
      expect(validShop.shopkeeper.name).not.toMatch(/damn|hell|stupid|dumb/i);
      expect(validShop.name).not.toMatch(/damn|hell|stupid|dumb/i);
    });

    it('should accept optional unlock requirements', () => {
      const shopWithRequirements: Shop = {
        ...validShop,
        unlockRequirements: {
          level: 5,
          storyProgress: 2,
          explorationThreshold: 0.5,
        },
      };

      expect(shopWithRequirements.unlockRequirements).toBeDefined();
      expect(shopWithRequirements.unlockRequirements?.level).toBe(5);
    });

    it('should accept optional pricing modifiers', () => {
      const shopWithPricing: Shop = {
        ...validShop,
        pricingModifiers: {
          buyMultiplier: 1.1,
          sellMultiplier: 0.5,
          discount: 0.1,
        },
      };

      expect(shopWithPricing.pricingModifiers).toBeDefined();
      expect(shopWithPricing.pricingModifiers?.buyMultiplier).toBe(1.1);
    });
  });

  // =============================================================================
  // SHOP INVENTORY VALIDATION
  // =============================================================================

  describe('ShopInventory Interface', () => {
    const validInventoryItem: ShopInventoryItem = {
      itemId: 'health-potion',
      stock: 10,
      price: 50,
      sellPrice: 25,
      unlocked: true,
    };

    const validInventory: ShopInventory = {
      shopId: 'test-shop-1',
      items: [validInventoryItem],
    };

    it('should validate required fields', () => {
      expect(validInventory.shopId).toBeDefined();
      expect(validInventory.items).toBeDefined();
      expect(Array.isArray(validInventory.items)).toBe(true);
    });

    it('should validate inventory item fields', () => {
      expect(validInventoryItem.itemId).toBeTruthy();
      expect(validInventoryItem.stock).toBeDefined();
      expect(typeof validInventoryItem.stock).toBe('number');
    });

    it('should allow unlimited stock (-1)', () => {
      const unlimitedItem: ShopInventoryItem = {
        ...validInventoryItem,
        stock: -1,
      };

      expect(unlimitedItem.stock).toBe(-1);
    });

    it('should handle unlock requirements', () => {
      const lockedItem: ShopInventoryItem = {
        ...validInventoryItem,
        unlockRequirements: {
          level: 5,
          storyChapter: 2,
        },
        unlocked: false,
      };

      expect(lockedItem.unlockRequirements).toBeDefined();
      expect(lockedItem.unlockRequirements?.level).toBe(5);
      expect(lockedItem.unlocked).toBe(false);
    });

    it('should validate sell price is less than buy price', () => {
      if (validInventoryItem.price && validInventoryItem.sellPrice) {
        expect(validInventoryItem.sellPrice).toBeLessThan(validInventoryItem.price);
      }
    });
  });

  // =============================================================================
  // NPC TRADE VALIDATION
  // =============================================================================

  describe('NPCTrade Interface', () => {
    const validTrade: NPCTrade = {
      id: 'herbalist-slime-trade',
      npcName: 'Village Herbalist',
      type: 'barter',
      repeatability: 'repeatable',
      requiredItems: [{ itemId: 'slime-gel', quantity: 3, consumed: true }],
      offeredItems: [{ itemId: 'health-potion', quantity: 1 }],
      dialogue: "I can make potions from slime gel! Bring me 3 and I'll give you a potion.",
      location: 'mistwood-forest',
    };

    it('should validate required fields', () => {
      expect(validTrade.id).toBeDefined();
      expect(validTrade.npcName).toBeDefined();
      expect(validTrade.type).toBeDefined();
      expect(validTrade.repeatability).toBeDefined();
      expect(validTrade.requiredItems).toBeDefined();
      expect(validTrade.offeredItems).toBeDefined();
      expect(validTrade.dialogue).toBeDefined();
      expect(validTrade.location).toBeDefined();
    });

    it('should have valid trade type', () => {
      expect(['barter', 'quest']).toContain(validTrade.type);
    });

    it('should have required items array', () => {
      expect(Array.isArray(validTrade.requiredItems)).toBe(true);
      expect(validTrade.requiredItems.length).toBeGreaterThan(0);
    });

    it('should have offered items array', () => {
      expect(Array.isArray(validTrade.offeredItems)).toBe(true);
      expect(validTrade.offeredItems.length).toBeGreaterThan(0);
    });

    it('should have age-appropriate dialogue', () => {
      expect(validTrade.dialogue).toBeTruthy();
      expect(validTrade.dialogue).not.toMatch(/damn|hell|stupid|dumb|kill|die|blood/i);
    });

    it('should validate required item structure', () => {
      const reqItem = validTrade.requiredItems[0];
      expect(reqItem.itemId).toBeTruthy();
      expect(typeof reqItem.quantity).toBe('number');
      expect(reqItem.quantity).toBeGreaterThan(0);
      expect(typeof reqItem.consumed).toBe('boolean');
    });

    it('should validate offered item structure', () => {
      const offeredItem = validTrade.offeredItems[0];
      expect(offeredItem.itemId).toBeTruthy();
      expect(typeof offeredItem.quantity).toBe('number');
      expect(offeredItem.quantity).toBeGreaterThan(0);
    });

    it('should handle optional gold requirements', () => {
      const tradeWithGold: NPCTrade = {
        ...validTrade,
        goldRequired: 100,
        goldOffered: 50,
      };

      expect(tradeWithGold.goldRequired).toBe(100);
      expect(tradeWithGold.goldOffered).toBe(50);
    });
  });

  // =============================================================================
  // TRANSACTION VALIDATION
  // =============================================================================

  describe('Transaction Interface', () => {
    const validTransaction: Transaction = {
      id: 'txn-12345',
      type: 'buy',
      shopId: 'test-shop-1',
      item: {
        id: 'health-potion',
        name: 'Health Potion',
        type: 'consumable',
        description: 'Restores health',
        value: 50,
        stackable: true,
        maxStack: 99,
        weight: 0.5,
        sellValue: 25,
        canTrade: true,
        canDrop: true,
        canDestroy: true,
        usable: true,
        consumeOnUse: true,
        useInCombat: true,
        useOutOfCombat: true,
        category: 'consumables',
      },
      quantity: 1,
      goldAmount: -50,
      timestamp: new Date(),
      playerLevel: 5,
      status: 'success',
    };

    it('should validate required fields', () => {
      expect(validTransaction.id).toBeDefined();
      expect(validTransaction.type).toBeDefined();
      expect(validTransaction.item).toBeDefined();
      expect(validTransaction.quantity).toBeDefined();
      expect(validTransaction.goldAmount).toBeDefined();
      expect(validTransaction.timestamp).toBeDefined();
      expect(validTransaction.playerLevel).toBeDefined();
      expect(validTransaction.status).toBeDefined();
    });

    it('should have valid transaction type', () => {
      expect(['buy', 'sell']).toContain(validTransaction.type);
    });

    it('should have negative gold for purchases', () => {
      if (validTransaction.type === 'buy') {
        expect(validTransaction.goldAmount).toBeLessThanOrEqual(0);
      }
    });

    it('should have positive gold for sales', () => {
      const sellTransaction: Transaction = {
        ...validTransaction,
        type: 'sell',
        goldAmount: 25,
      };

      expect(sellTransaction.goldAmount).toBeGreaterThanOrEqual(0);
    });

    it('should have valid quantity', () => {
      expect(validTransaction.quantity).toBeGreaterThan(0);
    });
  });

  describe('TransactionResult Interface', () => {
    const validResult: TransactionResult = {
      success: true,
      status: 'success',
      newGoldBalance: 450,
      message: 'Purchase successful!',
    };

    it('should validate required fields', () => {
      expect(typeof validResult.success).toBe('boolean');
      expect(validResult.status).toBeDefined();
      expect(typeof validResult.newGoldBalance).toBe('number');
      expect(validResult.message).toBeTruthy();
    });

    it('should have encouraging message for success', () => {
      if (validResult.success) {
        expect(validResult.message.length).toBeGreaterThan(0);
      }
    });

    it('should include error for failures', () => {
      const failedResult: TransactionResult = {
        success: false,
        status: 'insufficient_funds',
        newGoldBalance: 25,
        message: 'You need 25 more gold for this!',
        error: {
          code: 'INSUFFICIENT_GOLD',
          category: 'economy',
          message: 'Not enough gold',
          suggestion: 'Try selling items or defeating monsters for gold',
        },
      };

      expect(failedResult.success).toBe(false);
      expect(failedResult.error).toBeDefined();
      expect(failedResult.error?.code).toBeTruthy();
      expect(failedResult.error?.message).toBeTruthy();
      expect(failedResult.error?.suggestion).toBeTruthy();
    });
  });

  // =============================================================================
  // PLAYER SHOP STATE VALIDATION
  // =============================================================================

  describe('PlayerShopState Interface', () => {
    const validState: PlayerShopState = {
      discoveredShops: ['shop-1', 'shop-2'],
      unlockedShops: ['shop-1'],
      currentShop: null,
      shopInventoryCache: {},
      transactionHistory: [],
      completedTrades: [],
      tradeCooldowns: {},
      shopTutorialCompleted: false,
      tradeTutorialCompleted: false,
    };

    it('should validate required fields', () => {
      expect(Array.isArray(validState.discoveredShops)).toBe(true);
      expect(Array.isArray(validState.unlockedShops)).toBe(true);
      expect(Array.isArray(validState.transactionHistory)).toBe(true);
      expect(Array.isArray(validState.completedTrades)).toBe(true);
      expect(typeof validState.shopInventoryCache).toBe('object');
      expect(typeof validState.tradeCooldowns).toBe('object');
      expect(typeof validState.shopTutorialCompleted).toBe('boolean');
      expect(typeof validState.tradeTutorialCompleted).toBe('boolean');
    });

    it('should respect transaction history limit', () => {
      expect(validState.transactionHistory.length).toBeLessThanOrEqual(MAX_TRANSACTION_HISTORY);
    });

    it('should track discovered vs unlocked shops', () => {
      // All unlocked shops should be discovered
      validState.unlockedShops.forEach(shopId => {
        expect(validState.discoveredShops).toContain(shopId);
      });
    });
  });

  // =============================================================================
  // ECONOMY CONFIG VALIDATION
  // =============================================================================

  describe('EconomyConfig', () => {
    it('should have valid default economy config', () => {
      expect(DEFAULT_ECONOMY_CONFIG).toBeDefined();
      expect(DEFAULT_ECONOMY_CONFIG.startingGold).toBe(100);
      expect(DEFAULT_ECONOMY_CONFIG.targetGoldPerHour).toEqual([1000, 2000]);
      expect(DEFAULT_ECONOMY_CONFIG.defaultSellMultiplier).toBe(0.5);
      expect(DEFAULT_ECONOMY_CONFIG.maxGold).toBeGreaterThan(0);
      expect(DEFAULT_ECONOMY_CONFIG.minGoldWarning).toBe(100);
    });

    it('should have modifiers for all shop types', () => {
      const shopTypes: ShopType[] = ['general', 'weapon', 'armor', 'magic', 'apothecary'];

      shopTypes.forEach(type => {
        expect(DEFAULT_ECONOMY_CONFIG.shopTypeModifiers[type]).toBeDefined();
        expect(DEFAULT_ECONOMY_CONFIG.shopTypeModifiers[type].buyMultiplier).toBeGreaterThan(0);
        expect(DEFAULT_ECONOMY_CONFIG.shopTypeModifiers[type].sellMultiplier).toBeGreaterThan(0);
        expect(DEFAULT_ECONOMY_CONFIG.shopTypeModifiers[type].sellMultiplier).toBeLessThan(1);
      });
    });

    it('should have sell multiplier less than buy multiplier', () => {
      const shopTypes: ShopType[] = ['general', 'weapon', 'armor', 'magic', 'apothecary'];

      shopTypes.forEach(type => {
        const modifiers = DEFAULT_ECONOMY_CONFIG.shopTypeModifiers[type];
        expect(modifiers.sellMultiplier).toBeLessThan(modifiers.buyMultiplier);
      });
    });

    it('should have reasonable gold earning target', () => {
      const [min, max] = DEFAULT_ECONOMY_CONFIG.targetGoldPerHour;
      expect(min).toBeGreaterThan(0);
      expect(max).toBeGreaterThan(min);
      expect(min).toBe(1000);
      expect(max).toBe(2000);
    });
  });

  // =============================================================================
  // TYPE GUARDS
  // =============================================================================

  describe('Type Guards', () => {
    describe('isShop', () => {
      it('should return true for valid shop', () => {
        const shop: Shop = {
          id: 'test-shop',
          name: 'Test Shop',
          type: 'general',
          location: 'test-area',
          shopkeeper: {
            name: 'Test Keeper',
            mood: 'happy',
            dialogue: {
              greeting: 'Hello',
              buyDialogue: 'Thanks',
              sellDialogue: 'Thanks',
            },
          },
          buysCategories: ['consumables'],
        };

        expect(isShop(shop)).toBe(true);
      });

      it('should return false for invalid shop', () => {
        expect(isShop(null)).toBe(false);
        expect(isShop(undefined)).toBe(false);
        expect(isShop({})).toBe(false);
        expect(isShop({ id: 'test' })).toBe(false);
        expect(isShop('not a shop')).toBe(false);
        expect(isShop(123)).toBe(false);
      });
    });

    describe('isNPCTrade', () => {
      it('should return true for valid NPC trade', () => {
        const trade: NPCTrade = {
          id: 'test-trade',
          npcName: 'Test NPC',
          type: 'barter',
          repeatability: 'repeatable',
          requiredItems: [{ itemId: 'item-1', quantity: 1, consumed: true }],
          offeredItems: [{ itemId: 'item-2', quantity: 1 }],
          dialogue: 'Test dialogue',
          location: 'test-area',
        };

        expect(isNPCTrade(trade)).toBe(true);
      });

      it('should return false for invalid NPC trade', () => {
        expect(isNPCTrade(null)).toBe(false);
        expect(isNPCTrade(undefined)).toBe(false);
        expect(isNPCTrade({})).toBe(false);
        expect(isNPCTrade({ id: 'test' })).toBe(false);
      });
    });

    describe('isTransactionResult', () => {
      it('should return true for valid transaction result', () => {
        const result: TransactionResult = {
          success: true,
          status: 'success',
          newGoldBalance: 500,
          message: 'Success',
        };

        expect(isTransactionResult(result)).toBe(true);
      });

      it('should return false for invalid transaction result', () => {
        expect(isTransactionResult(null)).toBe(false);
        expect(isTransactionResult(undefined)).toBe(false);
        expect(isTransactionResult({})).toBe(false);
        expect(isTransactionResult({ success: true })).toBe(false);
      });
    });
  });

  // =============================================================================
  // CONSTANTS VALIDATION
  // =============================================================================

  describe('Constants', () => {
    it('should have valid MAX_TRANSACTION_HISTORY', () => {
      expect(MAX_TRANSACTION_HISTORY).toBe(10);
      expect(MAX_TRANSACTION_HISTORY).toBeGreaterThan(0);
    });

    it('should have valid MAX_INVENTORY_SIZE', () => {
      expect(MAX_INVENTORY_SIZE).toBe(50);
      expect(MAX_INVENTORY_SIZE).toBeGreaterThan(0);
    });

    it('should have shop category names', () => {
      expect(SHOP_CATEGORY_NAMES).toBeDefined();
      expect(Object.keys(SHOP_CATEGORY_NAMES).length).toBeGreaterThan(0);

      // Check some expected categories
      expect(SHOP_CATEGORY_NAMES.all).toBe('All Items');
      expect(SHOP_CATEGORY_NAMES.weapons).toBe('Weapons');
      expect(SHOP_CATEGORY_NAMES.armor).toBe('Armor');
    });

    it('should have age-appropriate category names', () => {
      Object.values(SHOP_CATEGORY_NAMES).forEach(name => {
        expect(name).not.toMatch(/damn|hell|stupid|kill|die/i);
      });
    });
  });
});
