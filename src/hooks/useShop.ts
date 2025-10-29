/**
 * useShop Custom Hook
 *
 * React hook for shop state and operations
 * Integrates shop system utilities with game state management
 *
 * Features:
 * - Shop data loading and caching
 * - Filtered inventory based on player progression
 * - Buy/sell transaction handling
 * - Shop unlock status tracking
 * - Performance optimization with memoization
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameState } from './useGameState';
import {
  Shop,
  ShopInventory,
  ShopInventoryItem,
  TransactionResult,
  TransactionType,
} from '../types/shop';
import {
  canUnlockShop,
  getShopUnlockRequirement,
  filterShopInventory,
  calculateBuyPrice,
  calculateSellPrice,
  canAffordItem,
  processBuyTransaction,
  processSellTransaction,
} from '../utils/shopSystem';
import { getItemPricingTier } from '../utils/economyBalance';
import { loadShopData, loadShopInventory } from '../utils/dataLoader';
import { ReactItem } from '../contexts/ReactGameContext';

export interface UseShopReturn {
  // Shop data
  shop: Shop | null;
  shopInventory: ShopInventoryItem[];
  isLoading: boolean;
  error: string | null;

  // Shop status
  isUnlocked: boolean;
  isDiscovered: boolean;
  unlockRequirement: string | null;

  // Transaction functions
  buyItem: (item: ReactItem, quantity: number) => Promise<TransactionResult>;
  sellItem: (item: ReactItem, quantity: number) => Promise<TransactionResult>;

  // Utility functions
  canAfford: (item: ReactItem, quantity: number) => boolean;
  getPricingInfo: (
    item: ReactItem,
    quantity: number,
    type: TransactionType
  ) => {
    totalCost: number;
    perItemCost: number;
    tier: ReturnType<typeof getItemPricingTier>;
  };

  // Shop actions
  discoverShop: () => void;
  unlockShop: () => void;
}

/**
 * Custom hook for managing shop interactions
 *
 * @param shopId - Unique identifier for the shop
 * @returns Shop state and operations
 */
export function useShop(shopId: string | null): UseShopReturn {
  const { state, dispatch } = useGameState();
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopInventory, setShopInventory] = useState<ShopInventory | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load shop data when shopId changes
  useEffect(() => {
    if (!shopId) {
      setShop(null);
      setShopInventory(null);
      return;
    }

    let isMounted = true;

    const loadShopAsync = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Load shop data
        const shops = await loadShopData();
        const foundShop = shops.find(s => s.id === shopId);

        if (!foundShop) {
          throw new Error(`Shop '${shopId}' not found`);
        }

        // Load shop inventory
        const inventories = await loadShopInventory();
        const foundInventory = inventories.find(inv => inv.shopId === shopId);

        if (!foundInventory) {
          throw new Error(`Inventory for shop '${shopId}' not found`);
        }

        if (isMounted) {
          setShop(foundShop);
          setShopInventory(foundInventory);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load shop data');
          console.error('Shop loading error:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadShopAsync();

    return () => {
      isMounted = false;
    };
  }, [shopId]);

  // Check if shop is discovered
  const isDiscovered = useMemo(() => {
    if (!shopId) return false;
    // TODO: Check against state.discoveredShops when implemented in ReactGameContext
    // For now, assume all shops are discovered
    return true;
  }, [shopId]);

  // Check if shop is unlocked
  const isUnlocked = useMemo(() => {
    if (!shop || !state.player) return false;

    // TODO: Check against state.unlockedShops when implemented in ReactGameContext
    // For now, use canUnlockShop to determine based on requirements
    return canUnlockShop(
      state.player,
      shop,
      [], // TODO: Get completed areas from state
      0 // TODO: Get story progress from state
    );
  }, [shop, state.player]);

  // Get unlock requirement message
  const unlockRequirement = useMemo(() => {
    if (!shop || !state.player || isUnlocked) return null;

    return getShopUnlockRequirement(
      state.player,
      shop,
      [], // TODO: Get completed areas from state
      0 // TODO: Get story progress from state
    );
  }, [shop, state.player, isUnlocked]);

  // Filter shop inventory based on player progression
  const filteredInventory = useMemo(() => {
    if (!shopInventory || !state.player) {
      return [];
    }

    return filterShopInventory(
      shopInventory,
      state.player,
      [], // TODO: Get completed areas
      state.completedQuests || [],
      [] // TODO: Track purchased items
    );
  }, [shopInventory, state.player, state.completedQuests]);

  // Buy item transaction
  const buyItem = useCallback(
    async (item: ReactItem, quantity: number): Promise<TransactionResult> => {
      if (!state.player || !shopId) {
        return {
          success: false,
          status: 'failed',
          newGoldBalance: 0,
          message: 'No player found',
          error: {
            code: 'NO_PLAYER',
            category: 'system',
            message: 'Player not initialized',
          },
        };
      }

      // Find the shop item to get the correct price
      const shopItem = filteredInventory.find(si => si.itemId === item.id);
      if (!shopItem) {
        return {
          success: false,
          status: 'failed',
          newGoldBalance: state.player.gold,
          message: 'Item not found in shop inventory',
          error: {
            code: 'ITEM_NOT_FOUND',
            category: 'validation',
            message: 'Item not available in this shop',
          },
        };
      }

      // Calculate total cost using shop's price, not item.value
      const totalCost = (shopItem.price || item.value) * quantity;

      // Process transaction
      const result = processBuyTransaction(
        state.player,
        item,
        quantity,
        totalCost,
        state.inventory
      );

      // If successful, dispatch BUY_ITEM action to update game state
      if (result.success && result.transaction) {
        // Use the BUY_ITEM action which handles both gold deduction and inventory addition
        dispatch({
          type: 'BUY_ITEM',
          payload: {
            shopId,
            item, // Pass the full item object with all properties
            quantity,
            totalCost,
          },
        });

        // TODO: Add transaction to history when implemented
        // dispatch({ type: 'ADD_TRANSACTION', payload: result.transaction });
      }

      return result;
    },
    [state.player, state.inventory, shop, shopId, filteredInventory, dispatch]
  );

  // Sell item transaction
  const sellItem = useCallback(
    async (item: ReactItem, quantity: number): Promise<TransactionResult> => {
      if (!state.player) {
        return {
          success: false,
          status: 'failed',
          newGoldBalance: 0,
          message: 'No player found',
          error: {
            code: 'NO_PLAYER',
            category: 'system',
            message: 'Player not initialized',
          },
        };
      }

      // Calculate sell value
      const totalValue = calculateSellPrice(item, quantity);

      // Process transaction
      const result = processSellTransaction(
        state.player,
        item,
        quantity,
        totalValue,
        state.inventory
      );

      // If successful, dispatch actions to update game state
      if (result.success && result.transaction) {
        // Add gold
        dispatch({
          type: 'ADD_GOLD',
          payload: {
            playerId: state.player.id,
            gold: totalValue,
          },
        });

        // Remove item from inventory
        dispatch({
          type: 'REMOVE_ITEM',
          payload: {
            itemId: item.id,
            quantity,
          },
        });

        // TODO: Add transaction to history when implemented
        // dispatch({ type: 'ADD_TRANSACTION', payload: result.transaction });
      }

      return result;
    },
    [state.player, state.inventory, dispatch]
  );

  // Check if player can afford an item
  const canAfford = useCallback(
    (item: ReactItem, quantity: number): boolean => {
      if (!state.player) return false;

      const shopTypeModifier = shop?.pricingModifiers?.buyMultiplier || 1.0;
      const totalCost = calculateBuyPrice(item.value, quantity, shopTypeModifier);

      return canAffordItem(state.player, totalCost);
    },
    [state.player, shop]
  );

  // Get pricing information for an item
  const getPricingInfo = useCallback(
    (item: ReactItem, quantity: number, type: TransactionType) => {
      if (type === 'buy') {
        // Find the shop item to get the correct price
        const shopItem = filteredInventory.find(si => si.itemId === item.id);
        const price = shopItem?.price || item.value;
        const totalCost = price * quantity;

        return {
          totalCost,
          perItemCost: price,
          tier: getItemPricingTier(price),
        };
      } else {
        const totalCost = calculateSellPrice(item, quantity);
        return {
          totalCost,
          perItemCost: totalCost / quantity,
          tier: getItemPricingTier(item.value),
        };
      }
    },
    [shop, filteredInventory]
  );

  // Discover shop action
  const discoverShop = useCallback(() => {
    if (!shopId) return;

    // TODO: Dispatch DISCOVER_SHOP action when implemented
    console.log(`Discovered shop: ${shopId}`);
  }, [shopId]);

  // Unlock shop action
  const unlockShop = useCallback(() => {
    if (!shopId) return;

    // TODO: Dispatch UNLOCK_SHOP action when implemented
    console.log(`Unlocked shop: ${shopId}`);
  }, [shopId]);

  return {
    shop,
    shopInventory: filteredInventory,
    isLoading,
    error,
    isUnlocked,
    isDiscovered,
    unlockRequirement,
    buyItem,
    sellItem,
    canAfford,
    getPricingInfo,
    discoverShop,
    unlockShop,
  };
}

/**
 * Helper hook for accessing current shop from game state
 * Useful when shop UI is open and current shop is tracked in state
 */
export function useCurrentShop(): UseShopReturn {
  const { state } = useGameState();
  // TODO: Get currentShop from state when implemented
  const currentShopId = null; // state.currentShop

  return useShop(currentShopId);
}

/**
 * Helper hook for getting all discovered shops
 */
export function useDiscoveredShops(): {
  shops: Shop[];
  isLoading: boolean;
  error: string | null;
} {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { state } = useGameState();

  useEffect(() => {
    let isMounted = true;

    const loadShopsAsync = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const allShops = await loadShopData();

        // TODO: Filter by discovered shops when state is implemented
        // const discoveredShopIds = state.discoveredShops || [];
        // const discovered = allShops.filter(shop => discoveredShopIds.includes(shop.id));

        if (isMounted) {
          setShops(allShops); // For now, return all shops
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load shops');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadShopsAsync();

    return () => {
      isMounted = false;
    };
  }, [state]);

  return { shops, isLoading, error };
}
