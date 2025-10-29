/**
 * useNPCTrades Custom Hook
 *
 * React hook for NPC trading functionality
 * Handles barter and quest-based trades with requirements validation
 *
 * Features:
 * - Trade availability checking (level, quest, area, cooldown)
 * - Player inventory validation
 * - Trade execution with item/gold exchanges
 * - Cooldown tracking for repeatable trades
 * - Integration with game state management
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGameState } from './useGameState';
import {
  NPCTrade,
  TradeRequirement,
  TradeItemRequirement,
  TradeItemOffer,
  TransactionResult,
  TransactionStatus,
} from '../types/shop';
import { loadNPCTrades } from '../utils/dataLoader';
import { Item } from '../types/game';

// Type alias for consistency
type ReactItem = Item;

export interface UseNPCTradesReturn {
  // Trade data
  trades: NPCTrade[];
  availableTrades: NPCTrade[];
  completedTrades: NPCTrade[];
  isLoading: boolean;
  error: string | null;

  // Trade validation
  canExecuteTrade: (trade: NPCTrade) => boolean;
  getTradeRequirements: (trade: NPCTrade) => {
    missing: string[];
    satisfied: string[];
  };
  isTradeAvailable: (trade: NPCTrade) => boolean;
  isTradeOnCooldown: (trade: NPCTrade) => boolean;

  // Trade execution
  executeTrade: (trade: NPCTrade) => Promise<TransactionResult>;

  // Utility
  getTradesForArea: (areaId: string) => NPCTrade[];
  getTradeById: (tradeId: string) => NPCTrade | null;
}

/**
 * Custom hook for managing NPC trades
 *
 * @param areaId - Optional area ID to filter trades by location
 * @returns NPC trade state and operations
 */
export function useNPCTrades(areaId?: string): UseNPCTradesReturn {
  const { state, dispatch } = useGameState();
  const [trades, setTrades] = useState<NPCTrade[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load NPC trades data
  useEffect(() => {
    let isMounted = true;

    const loadTradesAsync = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const loadedTrades = await loadNPCTrades();

        if (isMounted) {
          setTrades(loadedTrades);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load NPC trades');
          console.error('NPC trades loading error:', err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadTradesAsync();

    return () => {
      isMounted = false;
    };
  }, []);

  // Get completed trade IDs from state
  const completedTradeIds = useMemo(() => {
    return state.shops?.completedTrades || [];
  }, [state.shops]);

  // Get trade cooldowns from state
  const tradeCooldowns = useMemo(() => {
    return state.shops?.tradeCooldowns || {};
  }, [state.shops]);

  /**
   * Check if a requirement is satisfied
   */
  const checkRequirement = useCallback(
    (requirement: TradeRequirement): boolean => {
      if (!state.player) return false;

      switch (requirement.type) {
        case 'level':
          return state.player.level >= (requirement.value || 0);

        case 'quest':
          return completedTradeIds.includes(requirement.id || '');

        case 'story':
          // TODO: Implement story progress in ReactGameContext
          // For now, assume all story requirements are met
          return true;

        case 'area':
          // Check if area is unlocked (in unlockedAreas array)
          return state.unlockedAreas.includes(requirement.id || '');

        default:
          return true;
      }
    },
    [state.player, state.areas, completedTradeIds]
  );

  /**
   * Check if trade is on cooldown
   */
  const isTradeOnCooldown = useCallback(
    (trade: NPCTrade): boolean => {
      // One-time trades that are completed are permanently on "cooldown"
      if (trade.repeatability === 'one_time' && completedTradeIds.includes(trade.id)) {
        return true;
      }

      // Check cooldown timestamp
      const lastCompleted = tradeCooldowns[trade.id];
      if (!lastCompleted || !trade.cooldown) return false;

      const now = new Date();
      const cooldownEnd = new Date(lastCompleted.getTime() + trade.cooldown);

      return now < cooldownEnd;
    },
    [tradeCooldowns, completedTradeIds]
  );

  /**
   * Check if trade requirements are met
   */
  const isTradeAvailable = useCallback(
    (trade: NPCTrade): boolean => {
      // Check cooldown
      if (isTradeOnCooldown(trade)) return false;

      // Check area match (if filtering by area)
      if (areaId && trade.location !== areaId) return false;

      // Check all requirements
      if (trade.requirements) {
        return trade.requirements.every(checkRequirement);
      }

      return true;
    },
    [areaId, checkRequirement, isTradeOnCooldown]
  );

  /**
   * Get detailed requirements status
   */
  const getTradeRequirements = useCallback(
    (
      trade: NPCTrade
    ): {
      missing: string[];
      satisfied: string[];
    } => {
      const missing: string[] = [];
      const satisfied: string[] = [];

      if (!state.player) {
        return { missing: ['Player not initialized'], satisfied: [] };
      }

      // Check requirements
      if (trade.requirements) {
        trade.requirements.forEach(req => {
          if (checkRequirement(req)) {
            satisfied.push(req.description);
          } else {
            missing.push(req.description);
          }
        });
      }

      // Check required items
      trade.requiredItems.forEach(reqItem => {
        const playerItem = state.inventory.find(item => item.id === reqItem.itemId);
        const hasEnough = playerItem && (playerItem.quantity || 0) >= reqItem.quantity;

        if (hasEnough) {
          satisfied.push(`${reqItem.quantity}x ${reqItem.itemId}`);
        } else {
          const have = playerItem?.quantity || 0;
          missing.push(`${reqItem.quantity}x ${reqItem.itemId} (have ${have})`);
        }
      });

      // Check required gold
      if (trade.goldRequired && trade.goldRequired > 0) {
        if (state.player.gold >= trade.goldRequired) {
          satisfied.push(`${trade.goldRequired} gold`);
        } else {
          missing.push(`${trade.goldRequired} gold (have ${state.player.gold})`);
        }
      }

      // Check cooldown
      if (isTradeOnCooldown(trade)) {
        if (trade.repeatability === 'one_time') {
          missing.push('Already completed (one-time trade)');
        } else {
          missing.push('Trade is on cooldown');
        }
      }

      return { missing, satisfied };
    },
    [state.player, state.inventory, checkRequirement, isTradeOnCooldown]
  );

  /**
   * Check if player can execute a trade
   */
  const canExecuteTrade = useCallback(
    (trade: NPCTrade): boolean => {
      if (!state.player) return false;

      // Trade must be available
      if (!isTradeAvailable(trade)) return false;

      // Check required items
      const hasAllItems = trade.requiredItems.every(reqItem => {
        const playerItem = state.inventory.find(item => item.id === reqItem.itemId);
        return playerItem && (playerItem.quantity || 0) >= reqItem.quantity;
      });

      if (!hasAllItems) return false;

      // Check required gold
      if (trade.goldRequired && trade.goldRequired > 0) {
        if (state.player.gold < trade.goldRequired) return false;
      }

      // Check inventory space for offered items
      const offeredItemsCount = trade.offeredItems.reduce((sum, item) => sum + item.quantity, 0);
      const currentInventoryCount = state.inventory.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      );
      const maxInventorySize = 50; // TODO: Get from constants

      if (currentInventoryCount + offeredItemsCount > maxInventorySize) {
        return false;
      }

      return true;
    },
    [state.player, state.inventory, isTradeAvailable]
  );

  /**
   * Execute a trade
   */
  const executeTrade = useCallback(
    async (trade: NPCTrade): Promise<TransactionResult> => {
      if (!state.player) {
        return {
          success: false,
          status: 'failed' as TransactionStatus,
          newGoldBalance: 0,
          message: 'No player found',
          error: {
            code: 'NO_PLAYER',
            category: 'system',
            message: 'Player not initialized',
          },
        };
      }

      // Validate trade can be executed
      if (!canExecuteTrade(trade)) {
        const { missing } = getTradeRequirements(trade);
        return {
          success: false,
          status: 'failed' as TransactionStatus,
          newGoldBalance: state.player.gold,
          message: 'Cannot complete this trade',
          error: {
            code: 'TRADE_REQUIREMENTS_NOT_MET',
            category: 'requirement',
            message: `Missing: ${missing.join(', ')}`,
            suggestion: 'Check the trade requirements and try again',
          },
        };
      }

      try {
        // Remove required items from inventory
        for (const reqItem of trade.requiredItems) {
          if (reqItem.consumed) {
            dispatch({
              type: 'REMOVE_ITEM',
              payload: {
                itemId: reqItem.itemId,
                quantity: reqItem.quantity,
              },
            });
          }
        }

        // Remove required gold
        if (trade.goldRequired && trade.goldRequired > 0) {
          dispatch({
            type: 'ADD_GOLD',
            payload: {
              playerId: state.player.id,
              gold: -trade.goldRequired,
            },
          });
        }

        // Add offered items to inventory (with chance)
        for (const offeredItem of trade.offeredItems) {
          const chance = offeredItem.chance || 1.0;
          const randomRoll = Math.random();

          if (randomRoll <= chance) {
            // Find item data
            const itemData = state.items.find(i => i.id === offeredItem.itemId);

            if (itemData) {
              dispatch({
                type: 'ADD_ITEM',
                payload: {
                  item: { ...itemData, quantity: offeredItem.quantity },
                  quantity: offeredItem.quantity,
                },
              });
            }
          }
        }

        // Add offered gold
        if (trade.goldOffered && trade.goldOffered > 0) {
          dispatch({
            type: 'ADD_GOLD',
            payload: {
              playerId: state.player.id,
              gold: trade.goldOffered,
            },
          });
        }

        // Mark trade as completed
        dispatch({
          type: 'COMPLETE_NPC_TRADE',
          payload: {
            tradeId: trade.id,
          },
        });

        // Calculate new gold balance
        const goldChange = (trade.goldOffered || 0) - (trade.goldRequired || 0);
        const newGoldBalance = state.player.gold + goldChange;

        return {
          success: true,
          status: 'success' as TransactionStatus,
          newGoldBalance,
          message: `Trade completed with ${trade.npcName}! ${trade.dialogue}`,
        };
      } catch (err) {
        console.error('Trade execution error:', err);
        return {
          success: false,
          status: 'failed' as TransactionStatus,
          newGoldBalance: state.player.gold,
          message: 'Oops! Something went wrong with the trade.',
          error: {
            code: 'TRADE_EXECUTION_FAILED',
            category: 'system',
            message: err instanceof Error ? err.message : 'Unknown error',
          },
        };
      }
    },
    [state.player, state.inventory, state.items, canExecuteTrade, getTradeRequirements, dispatch]
  );

  /**
   * Get trades filtered by area
   */
  const getTradesForArea = useCallback(
    (areaId: string): NPCTrade[] => {
      return trades.filter(trade => trade.location === areaId);
    },
    [trades]
  );

  /**
   * Get trade by ID
   */
  const getTradeById = useCallback(
    (tradeId: string): NPCTrade | null => {
      return trades.find(trade => trade.id === tradeId) || null;
    },
    [trades]
  );

  // Filter available trades
  const availableTrades = useMemo(() => {
    return trades.filter(trade => isTradeAvailable(trade) && canExecuteTrade(trade));
  }, [trades, isTradeAvailable, canExecuteTrade]);

  // Filter completed trades
  const completedTrades = useMemo(() => {
    return trades.filter(trade => completedTradeIds.includes(trade.id));
  }, [trades, completedTradeIds]);

  return {
    trades,
    availableTrades,
    completedTrades,
    isLoading,
    error,
    canExecuteTrade,
    getTradeRequirements,
    isTradeAvailable,
    isTradeOnCooldown,
    executeTrade,
    getTradesForArea,
    getTradeById,
  };
}

/**
 * Helper hook for getting trades in the current area
 */
export function useCurrentAreaTrades(): UseNPCTradesReturn {
  const { state } = useGameState();
  const currentAreaId = state.currentArea?.id;

  return useNPCTrades(currentAreaId);
}
