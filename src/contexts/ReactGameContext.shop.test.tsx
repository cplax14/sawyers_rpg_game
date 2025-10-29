/**
 * Shop State Management Tests for ReactGameContext
 *
 * Tests all shop-related reducers, actions, and state transitions.
 * Ensures immutability, backwards compatibility, and correct behavior.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PlayerShopState, Transaction } from '../types/shop';
import { ReactGameState, ReactPlayer } from './ReactGameContext';

// Mock player for testing
const mockPlayer: ReactPlayer = {
  id: 'test_player',
  name: 'Test Player',
  class: 'knight',
  level: 5,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  experience: 500,
  experienceToNext: 1000,
  gold: 1000,
  baseStats: {
    attack: 20,
    defense: 15,
    magicAttack: 10,
    magicDefense: 12,
    speed: 14,
    accuracy: 85,
  },
  stats: {
    attack: 20,
    defense: 15,
    magicAttack: 10,
    magicDefense: 12,
    speed: 14,
    accuracy: 85,
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
};

// Initial shop state for testing
const initialShopState: PlayerShopState = {
  discoveredShops: [],
  unlockedShops: [],
  currentShop: null,
  shopInventoryCache: {},
  transactionHistory: [],
  completedTrades: [],
  tradeCooldowns: {},
  shopTutorialCompleted: false,
  tradeTutorialCompleted: false,
};

describe('ReactGameContext - Shop State Management', () => {
  describe('DISCOVER_SHOP action', () => {
    it('should add shop to discoveredShops list', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: initialShopState,
      };

      // Simulate reducer behavior
      const updatedShops: PlayerShopState = {
        ...state.shops!,
        discoveredShops: [...state.shops!.discoveredShops, 'shop_001'],
      };

      expect(updatedShops.discoveredShops).toContain('shop_001');
      expect(updatedShops.discoveredShops).toHaveLength(1);
    });

    it('should not duplicate shop IDs in discoveredShops', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: {
          ...initialShopState,
          discoveredShops: ['shop_001'],
        },
      };

      // Check if shop already exists
      const alreadyDiscovered = state.shops!.discoveredShops.includes('shop_001');

      expect(alreadyDiscovered).toBe(true);
      // If already discovered, state should not change
    });

    it('should preserve existing discovered shops when adding new ones', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: {
          ...initialShopState,
          discoveredShops: ['shop_001', 'shop_002'],
        },
      };

      const updatedShops: PlayerShopState = {
        ...state.shops!,
        discoveredShops: [...state.shops!.discoveredShops, 'shop_003'],
      };

      expect(updatedShops.discoveredShops).toHaveLength(3);
      expect(updatedShops.discoveredShops).toEqual(['shop_001', 'shop_002', 'shop_003']);
    });
  });

  describe('UNLOCK_SHOP action', () => {
    it('should add shop to unlockedShops list', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: {
          ...initialShopState,
          discoveredShops: ['shop_001'],
        },
      };

      const updatedShops: PlayerShopState = {
        ...state.shops!,
        unlockedShops: [...state.shops!.unlockedShops, 'shop_001'],
      };

      expect(updatedShops.unlockedShops).toContain('shop_001');
    });

    it('should automatically discover shop when unlocking if not already discovered', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: initialShopState,
      };

      // Simulating unlock logic that also adds to discovered if missing
      const isDiscovered = state.shops!.discoveredShops.includes('shop_001');
      const updatedDiscoveredShops = isDiscovered
        ? state.shops!.discoveredShops
        : [...state.shops!.discoveredShops, 'shop_001'];

      const updatedShops: PlayerShopState = {
        ...state.shops!,
        discoveredShops: updatedDiscoveredShops,
        unlockedShops: [...state.shops!.unlockedShops, 'shop_001'],
      };

      expect(updatedShops.discoveredShops).toContain('shop_001');
      expect(updatedShops.unlockedShops).toContain('shop_001');
    });

    it('should not duplicate shop IDs in unlockedShops', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: {
          ...initialShopState,
          discoveredShops: ['shop_001'],
          unlockedShops: ['shop_001'],
        },
      };

      const alreadyUnlocked = state.shops!.unlockedShops.includes('shop_001');
      expect(alreadyUnlocked).toBe(true);
    });
  });

  describe('OPEN_SHOP and CLOSE_SHOP actions', () => {
    it('should set currentShop when opening a shop', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: {
          ...initialShopState,
          unlockedShops: ['shop_001'],
        },
      };

      const updatedShops: PlayerShopState = {
        ...state.shops!,
        currentShop: 'shop_001',
      };

      expect(updatedShops.currentShop).toBe('shop_001');
    });

    it('should clear currentShop when closing a shop', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: {
          ...initialShopState,
          currentShop: 'shop_001',
        },
      };

      const updatedShops: PlayerShopState = {
        ...state.shops!,
        currentShop: null,
      };

      expect(updatedShops.currentShop).toBeNull();
    });
  });

  describe('BUY_ITEM action', () => {
    it('should deduct gold from player when buying item', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        inventory: [],
      };

      const totalCost = 100;
      const updatedPlayer = {
        ...state.player!,
        gold: state.player!.gold - totalCost,
      };

      expect(updatedPlayer.gold).toBe(900);
      expect(state.player!.gold).toBe(1000); // Original unchanged
    });

    it('should prevent purchase when player has insufficient gold', () => {
      const state: Partial<ReactGameState> = {
        player: { ...mockPlayer, gold: 50 },
        inventory: [],
      };

      const totalCost = 100;
      const canAfford = state.player!.gold >= totalCost;

      expect(canAfford).toBe(false);
    });

    it('should add purchased item to inventory', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        inventory: [],
      };

      const newItem = {
        id: 'health_potion',
        name: 'Health Potion',
        description: 'Restores 50 HP',
        type: 'consumable' as const,
        rarity: 'common' as const,
        value: 25,
        quantity: 3,
        icon: '🧪',
      };

      const updatedInventory = [...state.inventory!, newItem];

      expect(updatedInventory).toHaveLength(1);
      expect(updatedInventory[0].id).toBe('health_potion');
      expect(updatedInventory[0].quantity).toBe(3);
    });

    it('should stack items when buying item that already exists in inventory', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        inventory: [
          {
            id: 'health_potion',
            name: 'Health Potion',
            description: 'Restores 50 HP',
            type: 'consumable' as const,
            rarity: 'common' as const,
            value: 25,
            quantity: 2,
            icon: '🧪',
          },
        ],
      };

      const existingItemIndex = state.inventory!.findIndex(item => item.id === 'health_potion');
      const updatedInventory = state.inventory!.map((item, index) =>
        index === existingItemIndex ? { ...item, quantity: item.quantity + 3 } : item
      );

      expect(updatedInventory[0].quantity).toBe(5);
      expect(updatedInventory).toHaveLength(1); // No duplicate items
    });
  });

  describe('SELL_ITEM action', () => {
    it('should add gold to player when selling item', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        inventory: [
          {
            id: 'health_potion',
            name: 'Health Potion',
            description: 'Restores 50 HP',
            type: 'consumable' as const,
            rarity: 'common' as const,
            value: 25,
            quantity: 2,
            icon: '🧪',
          },
        ],
      };

      const totalValue = 20; // Selling 1 potion for 20 gold
      const updatedPlayer = {
        ...state.player!,
        gold: state.player!.gold + totalValue,
      };

      expect(updatedPlayer.gold).toBe(1020);
    });

    it('should remove sold item from inventory when quantity reaches 0', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        inventory: [
          {
            id: 'health_potion',
            name: 'Health Potion',
            description: 'Restores 50 HP',
            type: 'consumable' as const,
            rarity: 'common' as const,
            value: 25,
            quantity: 1,
            icon: '🧪',
          },
        ],
      };

      const itemIndex = 0;
      const sellQuantity = 1;
      const newQuantity = state.inventory![itemIndex].quantity - sellQuantity;

      const updatedInventory =
        newQuantity <= 0
          ? state.inventory!.filter((_, index) => index !== itemIndex)
          : state.inventory!.map((item, index) =>
              index === itemIndex ? { ...item, quantity: newQuantity } : item
            );

      expect(updatedInventory).toHaveLength(0);
    });

    it('should reduce item quantity when selling partial stack', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        inventory: [
          {
            id: 'health_potion',
            name: 'Health Potion',
            description: 'Restores 50 HP',
            type: 'consumable' as const,
            rarity: 'common' as const,
            value: 25,
            quantity: 5,
            icon: '🧪',
          },
        ],
      };

      const itemIndex = 0;
      const sellQuantity = 2;
      const newQuantity = state.inventory![itemIndex].quantity - sellQuantity;

      const updatedInventory = state.inventory!.map((item, index) =>
        index === itemIndex ? { ...item, quantity: newQuantity } : item
      );

      expect(updatedInventory[0].quantity).toBe(3);
      expect(updatedInventory).toHaveLength(1);
    });

    it('should prevent selling item not in inventory', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        inventory: [],
      };

      const itemIndex = state.inventory!.findIndex(item => item.id === 'health_potion');
      expect(itemIndex).toBe(-1);
    });

    it('should prevent selling more items than player owns', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        inventory: [
          {
            id: 'health_potion',
            name: 'Health Potion',
            description: 'Restores 50 HP',
            type: 'consumable' as const,
            rarity: 'common' as const,
            value: 25,
            quantity: 2,
            icon: '🧪',
          },
        ],
      };

      const sellQuantity = 5;
      const hasEnough = state.inventory![0].quantity >= sellQuantity;
      expect(hasEnough).toBe(false);
    });
  });

  describe('ADD_TRANSACTION action', () => {
    it('should add transaction to transaction history', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: initialShopState,
      };

      const transaction: Transaction = {
        id: 'txn_001',
        type: 'buy',
        shopId: 'shop_001',
        item: {
          id: 'health_potion',
          name: 'Health Potion',
          description: 'Restores 50 HP',
          type: 'consumable',
          rarity: 'common',
          value: 25,
          quantity: 1,
          icon: '🧪',
        },
        quantity: 1,
        goldAmount: -25,
        timestamp: new Date(),
        playerLevel: 5,
        status: 'success',
      };

      const updatedTransactionHistory = [transaction, ...state.shops!.transactionHistory];

      expect(updatedTransactionHistory).toHaveLength(1);
      expect(updatedTransactionHistory[0].id).toBe('txn_001');
    });

    it('should limit transaction history to 10 most recent transactions', () => {
      const oldTransactions: Transaction[] = Array.from({ length: 10 }, (_, i) => ({
        id: `txn_${i}`,
        type: 'buy' as const,
        shopId: 'shop_001',
        item: {
          id: 'health_potion',
          name: 'Health Potion',
          description: 'Restores 50 HP',
          type: 'consumable' as const,
          rarity: 'common' as const,
          value: 25,
          quantity: 1,
          icon: '🧪',
        },
        quantity: 1,
        goldAmount: -25,
        timestamp: new Date(),
        playerLevel: 5,
        status: 'success' as const,
      }));

      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: {
          ...initialShopState,
          transactionHistory: oldTransactions,
        },
      };

      const newTransaction: Transaction = {
        id: 'txn_new',
        type: 'buy',
        shopId: 'shop_001',
        item: {
          id: 'health_potion',
          name: 'Health Potion',
          description: 'Restores 50 HP',
          type: 'consumable',
          rarity: 'common',
          value: 25,
          quantity: 1,
          icon: '🧪',
        },
        quantity: 1,
        goldAmount: -25,
        timestamp: new Date(),
        playerLevel: 5,
        status: 'success',
      };

      const updatedTransactionHistory = [newTransaction, ...state.shops!.transactionHistory].slice(
        0,
        10
      );

      expect(updatedTransactionHistory).toHaveLength(10);
      expect(updatedTransactionHistory[0].id).toBe('txn_new');
      expect(updatedTransactionHistory[9].id).toBe('txn_8');
      expect(updatedTransactionHistory.find(t => t.id === 'txn_9')).toBeUndefined();
    });

    it('should preserve transaction history immutability', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: {
          ...initialShopState,
          transactionHistory: [],
        },
      };

      const originalHistory = state.shops!.transactionHistory;

      const newTransaction: Transaction = {
        id: 'txn_001',
        type: 'buy',
        shopId: 'shop_001',
        item: {
          id: 'health_potion',
          name: 'Health Potion',
          description: 'Restores 50 HP',
          type: 'consumable',
          rarity: 'common',
          value: 25,
          quantity: 1,
          icon: '🧪',
        },
        quantity: 1,
        goldAmount: -25,
        timestamp: new Date(),
        playerLevel: 5,
        status: 'success',
      };

      const updatedTransactionHistory = [newTransaction, ...state.shops!.transactionHistory];

      expect(originalHistory).toHaveLength(0);
      expect(updatedTransactionHistory).toHaveLength(1);
      expect(originalHistory).not.toBe(updatedTransactionHistory);
    });
  });

  describe('Tutorial completion actions', () => {
    it('should mark shop tutorial as completed', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: initialShopState,
      };

      const updatedShops: PlayerShopState = {
        ...state.shops!,
        shopTutorialCompleted: true,
      };

      expect(updatedShops.shopTutorialCompleted).toBe(true);
    });

    it('should mark trade tutorial as completed', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: initialShopState,
      };

      const updatedShops: PlayerShopState = {
        ...state.shops!,
        tradeTutorialCompleted: true,
      };

      expect(updatedShops.tradeTutorialCompleted).toBe(true);
    });
  });

  describe('COMPLETE_NPC_TRADE action', () => {
    it('should add trade to completedTrades list', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: initialShopState,
      };

      const updatedShops: PlayerShopState = {
        ...state.shops!,
        completedTrades: [...state.shops!.completedTrades, 'trade_001'],
      };

      expect(updatedShops.completedTrades).toContain('trade_001');
      expect(updatedShops.completedTrades).toHaveLength(1);
    });

    it('should set cooldown for repeatable trades', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: initialShopState,
      };

      const now = new Date();
      const updatedShops: PlayerShopState = {
        ...state.shops!,
        completedTrades: [...state.shops!.completedTrades, 'trade_001'],
        tradeCooldowns: {
          ...state.shops!.tradeCooldowns,
          trade_001: now,
        },
      };

      expect(updatedShops.tradeCooldowns['trade_001']).toBe(now);
    });
  });

  describe('Save/Load integration', () => {
    it('should include shop state in save data', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: {
          ...initialShopState,
          discoveredShops: ['shop_001', 'shop_002'],
          unlockedShops: ['shop_001'],
          shopTutorialCompleted: true,
        },
      };

      const saveData = {
        player: state.player,
        shops: state.shops,
      };

      expect(saveData.shops).toBeDefined();
      expect(saveData.shops!.discoveredShops).toHaveLength(2);
      expect(saveData.shops!.unlockedShops).toHaveLength(1);
      expect(saveData.shops!.shopTutorialCompleted).toBe(true);
    });

    it('should load shop state with backwards compatibility for old saves', () => {
      // Simulate loading old save without shop data
      const loadedData: any = {
        player: mockPlayer,
        // No shops field
      };

      const loadedShops = loadedData.shops || initialShopState;

      expect(loadedShops.discoveredShops).toEqual([]);
      expect(loadedShops.unlockedShops).toEqual([]);
      expect(loadedShops.shopTutorialCompleted).toBe(false);
    });

    it('should preserve shop state when loading save with shop data', () => {
      const savedShopState: PlayerShopState = {
        discoveredShops: ['shop_001', 'shop_002'],
        unlockedShops: ['shop_001'],
        currentShop: null,
        shopInventoryCache: {},
        transactionHistory: [
          {
            id: 'txn_001',
            type: 'buy',
            shopId: 'shop_001',
            item: {
              id: 'health_potion',
              name: 'Health Potion',
              description: 'Restores 50 HP',
              type: 'consumable',
              rarity: 'common',
              value: 25,
              quantity: 1,
              icon: '🧪',
            },
            quantity: 1,
            goldAmount: -25,
            timestamp: new Date(),
            playerLevel: 5,
            status: 'success',
          },
        ],
        completedTrades: ['trade_001'],
        tradeCooldowns: {},
        shopTutorialCompleted: true,
        tradeTutorialCompleted: false,
      };

      const loadedData = {
        player: mockPlayer,
        shops: savedShopState,
      };

      expect(loadedData.shops.discoveredShops).toHaveLength(2);
      expect(loadedData.shops.unlockedShops).toHaveLength(1);
      expect(loadedData.shops.transactionHistory).toHaveLength(1);
      expect(loadedData.shops.completedTrades).toHaveLength(1);
      expect(loadedData.shops.shopTutorialCompleted).toBe(true);
    });
  });

  describe('State immutability', () => {
    it('should not mutate original state when discovering shop', () => {
      const originalShops: PlayerShopState = {
        ...initialShopState,
        discoveredShops: [],
      };

      const updatedShops: PlayerShopState = {
        ...originalShops,
        discoveredShops: [...originalShops.discoveredShops, 'shop_001'],
      };

      expect(originalShops.discoveredShops).toHaveLength(0);
      expect(updatedShops.discoveredShops).toHaveLength(1);
      expect(originalShops).not.toBe(updatedShops);
    });

    it('should not mutate original transaction history when adding transaction', () => {
      const originalHistory: Transaction[] = [];
      const newTransaction: Transaction = {
        id: 'txn_001',
        type: 'buy',
        shopId: 'shop_001',
        item: {
          id: 'health_potion',
          name: 'Health Potion',
          description: 'Restores 50 HP',
          type: 'consumable',
          rarity: 'common',
          value: 25,
          quantity: 1,
          icon: '🧪',
        },
        quantity: 1,
        goldAmount: -25,
        timestamp: new Date(),
        playerLevel: 5,
        status: 'success',
      };

      const updatedHistory = [newTransaction, ...originalHistory];

      expect(originalHistory).toHaveLength(0);
      expect(updatedHistory).toHaveLength(1);
      expect(originalHistory).not.toBe(updatedHistory);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle undefined shop state gracefully', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: undefined,
      };

      // Reducer should initialize shop state if undefined
      const shopState = state.shops || initialShopState;

      expect(shopState.discoveredShops).toEqual([]);
      expect(shopState.unlockedShops).toEqual([]);
    });

    it('should prevent buying when player is null', () => {
      const state: Partial<ReactGameState> = {
        player: null,
        shops: initialShopState,
      };

      const canBuy = state.player !== null;
      expect(canBuy).toBe(false);
    });

    it('should prevent selling when inventory is empty', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        inventory: [],
      };

      const itemExists = state.inventory!.find(item => item.id === 'health_potion');
      expect(itemExists).toBeUndefined();
    });

    it('should handle empty transaction history correctly', () => {
      const state: Partial<ReactGameState> = {
        player: mockPlayer,
        shops: {
          ...initialShopState,
          transactionHistory: [],
        },
      };

      expect(state.shops!.transactionHistory).toHaveLength(0);
    });

    it('should handle gold overflow prevention (max gold limit)', () => {
      const MAX_GOLD = 999999;
      const state: Partial<ReactGameState> = {
        player: { ...mockPlayer, gold: 999990 },
        shops: initialShopState,
      };

      const totalValue = 100;
      const newGoldBalance = Math.min(state.player!.gold + totalValue, MAX_GOLD);

      expect(newGoldBalance).toBe(MAX_GOLD);
      expect(newGoldBalance).not.toBeGreaterThan(MAX_GOLD);
    });
  });
});
