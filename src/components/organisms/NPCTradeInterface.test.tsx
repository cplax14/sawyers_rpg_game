/**
 * NPCTradeInterface Component Tests
 *
 * Comprehensive test suite for NPC trading interface
 * Tests UI interactions, trade execution, and user feedback
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NPCTradeInterface } from './NPCTradeInterface';
import { ReactGameContext, initialGameState } from '../../contexts/ReactGameContext';
import { NPCTrade } from '../../types/shop';
import { ReactPlayer, ReactItem } from '../../contexts/ReactGameContext';
import * as useNPCTradesHook from '../../hooks/useNPCTrades';

// Mock the useNPCTrades hook
jest.mock('../../hooks/useNPCTrades');
const mockUseNPCTrades = useNPCTradesHook.useNPCTrades as jest.MockedFunction<
  typeof useNPCTradesHook.useNPCTrades
>;

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock NPC trades
const mockTrades: NPCTrade[] = [
  {
    id: 'available_trade',
    npcName: 'Available Trader',
    type: 'barter',
    repeatability: 'repeatable',
    requiredItems: [{ itemId: 'common_item', quantity: 3, consumed: true }],
    offeredItems: [{ itemId: 'reward_item', quantity: 1, chance: 1.0 }],
    dialogue: "Great! Let's trade these items!",
    location: 'test_area',
    requirements: [],
    cooldown: 0,
    available: true,
    completed: false,
  },
  {
    id: 'completed_trade',
    npcName: 'Completed Quest NPC',
    type: 'quest',
    repeatability: 'one_time',
    requiredItems: [{ itemId: 'quest_item', quantity: 1, consumed: true }],
    offeredItems: [{ itemId: 'unique_reward', quantity: 1, chance: 1.0 }],
    goldOffered: 100,
    dialogue: 'Thank you for completing the quest!',
    location: 'test_area',
    requirements: [],
    cooldown: 0,
    available: false,
    completed: true,
  },
  {
    id: 'locked_trade',
    npcName: 'Locked Trader',
    type: 'barter',
    repeatability: 'repeatable',
    requiredItems: [{ itemId: 'rare_item', quantity: 1, consumed: true }],
    offeredItems: [{ itemId: 'rare_reward', quantity: 1, chance: 1.0 }],
    dialogue: 'Come back when you meet the requirements!',
    location: 'test_area',
    requirements: [{ type: 'level', value: 20, description: 'Requires level 20' }],
    cooldown: 0,
    available: false,
    completed: false,
  },
];

// Mock items
const mockItems: ReactItem[] = [
  {
    id: 'common_item',
    name: 'Common Item',
    description: 'Common material',
    type: 'material',
    rarity: 'common',
    value: 10,
    quantity: 5,
  },
  {
    id: 'reward_item',
    name: 'Reward Item',
    description: 'Trade reward',
    type: 'material',
    rarity: 'uncommon',
    value: 25,
    quantity: 1,
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
    completedTrades: ['completed_trade'],
    currentArea: { id: 'test_area', name: 'Test Area' },
    areas: [{ id: 'test_area', name: 'Test Area', unlocked: true }],
    ...mockState,
  };

  return ({ children }: { children: React.ReactNode }) => (
    <ReactGameContext.Provider value={{ state: defaultState, dispatch: mockDispatch }}>
      {children}
    </ReactGameContext.Provider>
  );
};

// Helper to setup mock hook
const setupMockHook = (overrides: any = {}) => {
  const defaultReturn = {
    trades: mockTrades,
    availableTrades: mockTrades.filter(t => t.available && !t.completed),
    completedTrades: mockTrades.filter(t => t.completed),
    isLoading: false,
    error: null,
    canExecuteTrade: jest.fn(trade => trade.available && !trade.completed),
    getTradeRequirements: jest.fn(() => ({ missing: [], satisfied: [] })),
    isTradeAvailable: jest.fn(trade => trade.available),
    isTradeOnCooldown: jest.fn(() => false),
    executeTrade: jest.fn(async () => ({
      success: true,
      status: 'success' as const,
      newGoldBalance: 600,
      message: 'Trade completed successfully!',
    })),
    getTradesForArea: jest.fn(areaId => mockTrades.filter(t => t.location === areaId)),
    getTradeById: jest.fn(id => mockTrades.find(t => t.id === id) || null),
    ...overrides,
  };

  mockUseNPCTrades.mockReturnValue(defaultReturn);
  return defaultReturn;
};

describe('NPCTradeInterface', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    setupMockHook();
  });

  describe('rendering', () => {
    it('should render the interface with correct title', () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/NPC Traders/i)).toBeInTheDocument();
      expect(screen.getByText(/Test Area/i)).toBeInTheDocument();
    });

    it('should render filter buttons', () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('All Trades')).toBeInTheDocument();
      expect(screen.getByText(/Available/)).toBeInTheDocument();
      expect(screen.getByText(/Completed/)).toBeInTheDocument();
      expect(screen.getByText(/Locked/)).toBeInTheDocument();
    });

    it('should render NPC dialogue', () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/Welcome, adventurer/i)).toBeInTheDocument();
    });

    it('should render gold balance', () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      // Gold balance component should be present
      const goldElement = screen.getByText(/500/); // Player's gold
      expect(goldElement).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('loading and error states', () => {
    it('should show loading spinner while loading', () => {
      setupMockHook({ isLoading: true });

      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/Finding traders/i)).toBeInTheDocument();
    });

    it('should show error message on error', () => {
      const errorMessage = 'Failed to load trades';
      setupMockHook({ error: errorMessage });

      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText(/Error Loading Trades/i)).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should allow closing on error', async () => {
      setupMockHook({ error: 'Test error' });

      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const goBackButton = screen.getByRole('button', { name: /go back/i });
      fireEvent.click(goBackButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('trade filtering', () => {
    it('should show available trades by default', () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      expect(screen.getByText('Available Trader')).toBeInTheDocument();
      expect(screen.queryByText('Completed Quest NPC')).not.toBeInTheDocument();
      expect(screen.queryByText('Locked Trader')).not.toBeInTheDocument();
    });

    it('should filter to show all trades', async () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const allTradesButton = screen.getByText('All Trades');
      fireEvent.click(allTradesButton);

      await waitFor(() => {
        expect(screen.getByText('Available Trader')).toBeInTheDocument();
        expect(screen.getByText('Completed Quest NPC')).toBeInTheDocument();
        expect(screen.getByText('Locked Trader')).toBeInTheDocument();
      });
    });

    it('should filter to show completed trades', async () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const completedButton = screen.getByText(/Completed/);
      fireEvent.click(completedButton);

      await waitFor(() => {
        expect(screen.getByText('Completed Quest NPC')).toBeInTheDocument();
        expect(screen.queryByText('Available Trader')).not.toBeInTheDocument();
      });
    });

    it('should filter to show locked trades', async () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const lockedButton = screen.getByText(/Locked/);
      fireEvent.click(lockedButton);

      await waitFor(() => {
        expect(screen.getByText('Locked Trader')).toBeInTheDocument();
        expect(screen.queryByText('Available Trader')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no trades match filter', async () => {
      setupMockHook({ completedTrades: [] });

      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const completedButton = screen.getByText(/Completed/);
      fireEvent.click(completedButton);

      await waitFor(() => {
        expect(screen.getByText(/haven't completed any trades/i)).toBeInTheDocument();
      });
    });
  });

  describe('trade execution', () => {
    it('should open confirmation modal when trade is initiated', async () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const tradeButton = screen.getByRole('button', { name: /trade with available trader/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Trade')).toBeInTheDocument();
        expect(screen.getByText('Trade with Available Trader')).toBeInTheDocument();
      });
    });

    it('should show trade details in confirmation modal', async () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const tradeButton = screen.getByRole('button', { name: /trade with available trader/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByText(/Great! Let's trade these items!/i)).toBeInTheDocument();
        expect(screen.getByText(/You Will Give:/i)).toBeInTheDocument();
        expect(screen.getByText(/You Will Receive:/i)).toBeInTheDocument();
      });
    });

    it('should execute trade on confirmation', async () => {
      const mockExecuteTrade = jest.fn(async () => ({
        success: true,
        status: 'success' as const,
        newGoldBalance: 600,
        message: 'Trade completed successfully!',
      }));

      setupMockHook({ executeTrade: mockExecuteTrade });

      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      // Open modal
      const tradeButton = screen.getByRole('button', { name: /trade with available trader/i });
      fireEvent.click(tradeButton);

      // Confirm trade
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm trade/i });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockExecuteTrade).toHaveBeenCalledTimes(1);
      });
    });

    it('should show success message after successful trade', async () => {
      const mockExecuteTrade = jest.fn(async () => ({
        success: true,
        status: 'success' as const,
        newGoldBalance: 600,
        message: 'Trade completed successfully!',
      }));

      setupMockHook({ executeTrade: mockExecuteTrade });

      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      // Open and confirm trade
      const tradeButton = screen.getByRole('button', { name: /trade with available trader/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm trade/i });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Trade completed successfully!')).toBeInTheDocument();
      });
    });

    it('should show error message on trade failure', async () => {
      const mockExecuteTrade = jest.fn(async () => ({
        success: false,
        status: 'failed' as const,
        newGoldBalance: 500,
        message: 'Trade failed',
        error: {
          code: 'TRADE_FAILED',
          category: 'system' as const,
          message: 'Insufficient items',
        },
      }));

      setupMockHook({ executeTrade: mockExecuteTrade });

      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      // Open and confirm trade
      const tradeButton = screen.getByRole('button', { name: /trade with available trader/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm trade/i });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Insufficient items')).toBeInTheDocument();
      });
    });

    it('should cancel trade confirmation', async () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      // Open modal
      const tradeButton = screen.getByRole('button', { name: /trade with available trader/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Trade')).toBeInTheDocument();
      });

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Confirm Trade')).not.toBeInTheDocument();
      });
    });

    it('should disable buttons while trade is executing', async () => {
      let resolveExecute: any;
      const mockExecuteTrade = jest.fn(
        () =>
          new Promise(resolve => {
            resolveExecute = resolve;
          })
      );

      setupMockHook({ executeTrade: mockExecuteTrade });

      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      // Open and confirm trade
      const tradeButton = screen.getByRole('button', { name: /trade with available trader/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /confirm trade/i });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        const tradingButton = screen.getByRole('button', { name: /trading.../i });
        expect(tradingButton).toBeDisabled();
      });

      // Resolve the promise
      resolveExecute({
        success: true,
        status: 'success',
        newGoldBalance: 600,
        message: 'Done!',
      });
    });
  });

  describe('keyboard navigation', () => {
    it('should close interface on Escape key', async () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close on Escape when modal is open', async () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      // Open modal
      const tradeButton = screen.getByRole('button', { name: /trade with available trader/i });
      fireEvent.click(tradeButton);

      await waitFor(() => {
        expect(screen.getByText('Confirm Trade')).toBeInTheDocument();
      });

      fireEvent.keyDown(window, { key: 'Escape' });

      // Should not call onClose when modal is open
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-label', 'NPC Trade Interface');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have accessible close button', () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const closeButton = screen.getByRole('button', { name: /close trade interface/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should handle clicking overlay to close', () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const overlay = screen.getByRole('dialog').parentElement;
      if (overlay) {
        fireEvent.click(overlay);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not close when clicking inside container', () => {
      render(<NPCTradeInterface areaId='test_area' onClose={mockOnClose} />, {
        wrapper: createWrapper(),
      });

      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
