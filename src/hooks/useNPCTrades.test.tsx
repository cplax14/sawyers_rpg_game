/**
 * useNPCTrades Hook Tests
 *
 * Comprehensive test suite for NPC trading functionality
 * Tests trade validation, execution, and state management
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { useNPCTrades, useCurrentAreaTrades } from './useNPCTrades';
import { ReactGameContext, initialGameState } from '../contexts/ReactGameContext';
import { NPCTrade } from '../types/shop';
import { ReactPlayer, ReactItem } from '../contexts/ReactGameContext';
import * as dataLoader from '../utils/dataLoader';

// Mock data loader
jest.mock('../utils/dataLoader');
const mockLoadNPCTrades = dataLoader.loadNPCTrades as jest.MockedFunction<
  typeof dataLoader.loadNPCTrades
>;

// Mock NPC trades data
const mockTrades: NPCTrade[] = [
  {
    id: 'test_barter_trade',
    npcName: 'Test Merchant',
    type: 'barter',
    repeatability: 'repeatable',
    requiredItems: [{ itemId: 'test_item_1', quantity: 3, consumed: true }],
    offeredItems: [{ itemId: 'test_item_2', quantity: 1, chance: 1.0 }],
    dialogue: "Great! Let's trade!",
    location: 'test_area',
    requirements: [{ type: 'level', value: 5, description: 'Level 5 required' }],
    cooldown: 0,
  },
  {
    id: 'test_quest_trade',
    npcName: 'Quest NPC',
    type: 'quest',
    repeatability: 'one_time',
    requiredItems: [{ itemId: 'quest_item', quantity: 1, consumed: true }],
    offeredItems: [{ itemId: 'reward_item', quantity: 1, chance: 1.0 }],
    goldOffered: 100,
    dialogue: 'Thank you for completing the quest!',
    location: 'test_area',
    requirements: [],
    cooldown: 0,
  },
  {
    id: 'test_gold_trade',
    npcName: 'Gold Trader',
    type: 'barter',
    repeatability: 'repeatable',
    requiredItems: [{ itemId: 'material_item', quantity: 5, consumed: true }],
    offeredItems: [],
    goldRequired: 50,
    goldOffered: 200,
    dialogue: "I'll buy those materials!",
    location: 'test_area',
    requirements: [],
    cooldown: 0,
  },
  {
    id: 'test_locked_trade',
    npcName: 'Locked Trader',
    type: 'quest',
    repeatability: 'one_time',
    requiredItems: [],
    offeredItems: [{ itemId: 'rare_item', quantity: 1, chance: 1.0 }],
    dialogue: 'Complete the quest first!',
    location: 'test_area',
    requirements: [{ type: 'quest', id: 'missing_quest', description: 'Complete Missing Quest' }],
    cooldown: 0,
  },
  {
    id: 'test_other_area_trade',
    npcName: 'Other Area NPC',
    type: 'barter',
    repeatability: 'repeatable',
    requiredItems: [],
    offeredItems: [{ itemId: 'common_item', quantity: 1, chance: 1.0 }],
    dialogue: 'Visit me in the other area!',
    location: 'other_area',
    requirements: [],
    cooldown: 0,
  },
];

// Mock items
const mockItems: ReactItem[] = [
  {
    id: 'test_item_1',
    name: 'Test Item 1',
    description: 'Test item',
    type: 'material',
    rarity: 'common',
    value: 10,
    quantity: 5,
  },
  {
    id: 'test_item_2',
    name: 'Test Item 2',
    description: 'Test reward',
    type: 'material',
    rarity: 'uncommon',
    value: 25,
    quantity: 1,
  },
  {
    id: 'quest_item',
    name: 'Quest Item',
    description: 'Quest item',
    type: 'material',
    rarity: 'rare',
    value: 50,
    quantity: 1,
  },
  {
    id: 'material_item',
    name: 'Material',
    description: 'Crafting material',
    type: 'material',
    rarity: 'common',
    value: 5,
    quantity: 10,
  },
];

// Helper to create mock player
const createMockPlayer = (overrides: Partial<ReactPlayer> = {}): ReactPlayer => ({
  id: 'test_player',
  name: 'Test Player',
  class: 'warrior',
  level: 10,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  experience: 0,
  experienceToNext: 100,
  gold: 500,
  baseStats: {
    attack: 10,
    defense: 10,
    magicAttack: 5,
    magicDefense: 5,
    speed: 8,
    accuracy: 90,
  },
  stats: {
    attack: 10,
    defense: 10,
    magicAttack: 5,
    magicDefense: 5,
    speed: 8,
    accuracy: 90,
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

// Helper to create test wrapper
const createWrapper = (mockState: any = {}) => {
  const mockDispatch = jest.fn();

  const defaultState = {
    ...initialGameState,
    player: createMockPlayer(),
    inventory: mockItems,
    items: mockItems,
    completedTrades: [],
    currentArea: { id: 'test_area', name: 'Test Area' },
    areas: [
      { id: 'test_area', unlocked: true },
      { id: 'other_area', unlocked: false },
    ],
    ...mockState,
  };

  return ({ children }: { children: ReactNode }) => (
    <ReactGameContext.Provider value={{ state: defaultState, dispatch: mockDispatch }}>
      {children}
    </ReactGameContext.Provider>
  );
};

describe('useNPCTrades', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadNPCTrades.mockResolvedValue(mockTrades);
  });

  describe('initialization', () => {
    it('should load trades on mount', async () => {
      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.trades).toHaveLength(5);
      expect(mockLoadNPCTrades).toHaveBeenCalledTimes(1);
    });

    it('should handle loading errors gracefully', async () => {
      const testError = new Error('Failed to load trades');
      mockLoadNPCTrades.mockRejectedValue(testError);

      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to load trades');
      expect(result.current.trades).toHaveLength(0);
    });
  });

  describe('trade availability', () => {
    it('should check if trade is available based on requirements', async () => {
      const { result } = renderHook(() => useNPCTrades('test_area'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const barterTrade = result.current.trades.find(t => t.id === 'test_barter_trade');
      expect(barterTrade).toBeDefined();
      expect(result.current.isTradeAvailable(barterTrade!)).toBe(true);
    });

    it('should mark trade as unavailable if requirements not met', async () => {
      const lowLevelPlayer = createMockPlayer({ level: 3 });

      const { result } = renderHook(() => useNPCTrades('test_area'), {
        wrapper: createWrapper({ player: lowLevelPlayer }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const barterTrade = result.current.trades.find(t => t.id === 'test_barter_trade');
      expect(barterTrade).toBeDefined();
      expect(result.current.isTradeAvailable(barterTrade!)).toBe(false);
    });

    it('should mark trade as unavailable if in wrong area', async () => {
      const { result } = renderHook(() => useNPCTrades('test_area'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const otherAreaTrade = result.current.trades.find(t => t.id === 'test_other_area_trade');
      expect(otherAreaTrade).toBeDefined();
      expect(result.current.isTradeAvailable(otherAreaTrade!)).toBe(false);
    });

    it('should mark one-time trade as unavailable if already completed', async () => {
      const { result } = renderHook(() => useNPCTrades('test_area'), {
        wrapper: createWrapper({ completedTrades: ['test_quest_trade'] }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const questTrade = result.current.trades.find(t => t.id === 'test_quest_trade');
      expect(questTrade).toBeDefined();
      expect(result.current.isTradeOnCooldown(questTrade!)).toBe(true);
      expect(result.current.isTradeAvailable(questTrade!)).toBe(false);
    });
  });

  describe('trade validation', () => {
    it('should validate player has required items', async () => {
      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const barterTrade = result.current.trades.find(t => t.id === 'test_barter_trade');
      expect(result.current.canExecuteTrade(barterTrade!)).toBe(true);
    });

    it('should fail validation if player lacks required items', async () => {
      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper({ inventory: [] }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const barterTrade = result.current.trades.find(t => t.id === 'test_barter_trade');
      expect(result.current.canExecuteTrade(barterTrade!)).toBe(false);
    });

    it('should validate player has required gold', async () => {
      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const goldTrade = result.current.trades.find(t => t.id === 'test_gold_trade');
      expect(result.current.canExecuteTrade(goldTrade!)).toBe(true);
    });

    it('should fail validation if player lacks required gold', async () => {
      const poorPlayer = createMockPlayer({ gold: 25 });

      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper({ player: poorPlayer }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const goldTrade = result.current.trades.find(t => t.id === 'test_gold_trade');
      expect(result.current.canExecuteTrade(goldTrade!)).toBe(false);
    });

    it('should get detailed requirement status', async () => {
      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const barterTrade = result.current.trades.find(t => t.id === 'test_barter_trade');
      const requirements = result.current.getTradeRequirements(barterTrade!);

      expect(requirements.satisfied).toContain('Level 5 required');
      expect(requirements.satisfied).toContain('3x test_item_1');
      expect(requirements.missing).toHaveLength(0);
    });

    it('should identify missing requirements', async () => {
      const lowLevelPlayer = createMockPlayer({ level: 3 });

      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper({ player: lowLevelPlayer, inventory: [] }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const barterTrade = result.current.trades.find(t => t.id === 'test_barter_trade');
      const requirements = result.current.getTradeRequirements(barterTrade!);

      expect(requirements.missing).toContain('Level 5 required');
      expect(requirements.missing.some(m => m.includes('test_item_1'))).toBe(true);
    });
  });

  describe('trade execution', () => {
    it('should successfully execute a barter trade', async () => {
      const mockDispatch = jest.fn();
      const wrapper = createWrapper();

      // Override dispatch in wrapper
      const WrapperWithDispatch = ({ children }: { children: ReactNode }) => (
        <ReactGameContext.Provider
          value={{
            state: {
              ...initialGameState,
              player: createMockPlayer(),
              inventory: mockItems,
              items: mockItems,
              completedTrades: [],
              currentArea: { id: 'test_area' },
            },
            dispatch: mockDispatch,
          }}
        >
          {children}
        </ReactGameContext.Provider>
      );

      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: WrapperWithDispatch,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const barterTrade = result.current.trades.find(t => t.id === 'test_barter_trade');
      let tradeResult: any;

      await act(async () => {
        tradeResult = await result.current.executeTrade(barterTrade!);
      });

      expect(tradeResult.success).toBe(true);
      expect(tradeResult.status).toBe('success');
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'REMOVE_ITEM',
        payload: { itemId: 'test_item_1', quantity: 3 },
      });
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'COMPLETE_NPC_TRADE',
        payload: { tradeId: 'test_barter_trade' },
      });
    });

    it('should handle gold transactions correctly', async () => {
      const mockDispatch = jest.fn();
      const wrapper = createWrapper();

      const WrapperWithDispatch = ({ children }: { children: ReactNode }) => (
        <ReactGameContext.Provider
          value={{
            state: {
              ...initialGameState,
              player: createMockPlayer(),
              inventory: mockItems,
              items: mockItems,
              completedTrades: [],
              currentArea: { id: 'test_area' },
            },
            dispatch: mockDispatch,
          }}
        >
          {children}
        </ReactGameContext.Provider>
      );

      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: WrapperWithDispatch,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const goldTrade = result.current.trades.find(t => t.id === 'test_gold_trade');
      let tradeResult: any;

      await act(async () => {
        tradeResult = await result.current.executeTrade(goldTrade!);
      });

      expect(tradeResult.success).toBe(true);

      // Should remove required gold
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_GOLD',
        payload: { playerId: 'test_player', gold: -50 },
      });

      // Should add offered gold
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'ADD_GOLD',
        payload: { playerId: 'test_player', gold: 200 },
      });
    });

    it('should fail execution if requirements not met', async () => {
      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper({ inventory: [] }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const barterTrade = result.current.trades.find(t => t.id === 'test_barter_trade');
      let tradeResult: any;

      await act(async () => {
        tradeResult = await result.current.executeTrade(barterTrade!);
      });

      expect(tradeResult.success).toBe(false);
      expect(tradeResult.status).toBe('failed');
      expect(tradeResult.error?.code).toBe('TRADE_REQUIREMENTS_NOT_MET');
    });

    it('should handle trade with no player gracefully', async () => {
      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper({ player: null }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const barterTrade = result.current.trades.find(t => t.id === 'test_barter_trade');
      let tradeResult: any;

      await act(async () => {
        tradeResult = await result.current.executeTrade(barterTrade!);
      });

      expect(tradeResult.success).toBe(false);
      expect(tradeResult.error?.code).toBe('NO_PLAYER');
    });
  });

  describe('utility functions', () => {
    it('should get trades for specific area', async () => {
      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const testAreaTrades = result.current.getTradesForArea('test_area');
      expect(testAreaTrades).toHaveLength(4);

      const otherAreaTrades = result.current.getTradesForArea('other_area');
      expect(otherAreaTrades).toHaveLength(1);
    });

    it('should get trade by ID', async () => {
      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const trade = result.current.getTradeById('test_barter_trade');
      expect(trade).toBeDefined();
      expect(trade?.npcName).toBe('Test Merchant');

      const nonExistent = result.current.getTradeById('non_existent');
      expect(nonExistent).toBeNull();
    });

    it('should filter available trades correctly', async () => {
      const { result } = renderHook(() => useNPCTrades('test_area'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only include trades that are available and can be executed
      expect(result.current.availableTrades.length).toBeGreaterThan(0);

      result.current.availableTrades.forEach(trade => {
        expect(result.current.canExecuteTrade(trade)).toBe(true);
      });
    });

    it('should track completed trades', async () => {
      const { result } = renderHook(() => useNPCTrades(), {
        wrapper: createWrapper({ completedTrades: ['test_quest_trade'] }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.completedTrades).toHaveLength(1);
      expect(result.current.completedTrades[0].id).toBe('test_quest_trade');
    });
  });

  describe('useCurrentAreaTrades', () => {
    it('should return trades for current area', async () => {
      const { result } = renderHook(() => useCurrentAreaTrades(), {
        wrapper: createWrapper({ currentArea: { id: 'test_area' } }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should only include trades from test_area
      const testAreaTrades = result.current.trades.filter(t => t.location === 'test_area');
      expect(testAreaTrades.length).toBeGreaterThan(0);
    });
  });
});
