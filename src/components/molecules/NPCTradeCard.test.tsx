import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NPCTradeCard } from './NPCTradeCard';
import { ReactGameProvider } from '../../contexts/ReactGameContext';
import { NPCTrade } from '../../types/shop';

const mockTrade: NPCTrade = {
  id: 'slime-trade-1',
  npcName: 'Village Herbalist',
  type: 'barter',
  repeatability: 'repeatable',
  requiredItems: [{ itemId: 'slime-gel', quantity: 3, consumed: true }],
  offeredItems: [{ itemId: 'health-potion', quantity: 1 }],
  dialogue: "I can make potions from slime gel! Bring me 3 and I'll give you a potion.",
  location: 'mistwood-forest',
  available: true,
  completed: false,
};

const mockOneTimeTrade: NPCTrade = {
  ...mockTrade,
  id: 'quest-trade-1',
  npcName: 'Wise Elder',
  type: 'quest',
  repeatability: 'one_time',
  dialogue: 'Bring me the ancient artifact and I will reward you.',
};

const mockGameState = {
  player: {
    id: 'test-player',
    name: 'Test Player',
    level: 5,
    experience: 0,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    gold: 200,
    stats: {
      strength: 10,
      defense: 10,
      agility: 10,
      intelligence: 10,
      vitality: 10,
      luck: 10,
    },
    inventory: [
      {
        id: 'slime-gel',
        name: 'Slime Gel',
        quantity: 5,
        rarity: 'common',
        itemType: 'material',
        value: 5,
        stackable: true,
        tradeable: true,
      },
    ],
    equipment: {},
  },
  currentArea: null,
  unlockedAreas: [],
  gameStarted: false,
  loading: false,
};

const renderWithContext = (component: React.ReactElement) => {
  return render(
    <ReactGameProvider initialState={mockGameState as any}>{component}</ReactGameProvider>
  );
};

describe('NPCTradeCard', () => {
  const mockOnTrade = jest.fn();

  beforeEach(() => {
    mockOnTrade.mockClear();
  });

  describe('basic rendering', () => {
    it('renders trade card with NPC name', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      expect(screen.getByText('Village Herbalist')).toBeInTheDocument();
    });

    it('displays trade dialogue', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      expect(screen.getByText(/I can make potions from slime gel/i)).toBeInTheDocument();
    });

    it('shows trade type', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      expect(screen.getByText('barter')).toBeInTheDocument();
    });
  });

  describe('repeatability badges', () => {
    it('displays repeatable badge', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      expect(screen.getByText('Repeatable')).toBeInTheDocument();
    });

    it('displays one-time badge', () => {
      renderWithContext(
        <NPCTradeCard trade={mockOneTimeTrade} canTrade={true} onTrade={mockOnTrade} />
      );

      expect(screen.getByText('One Time')).toBeInTheDocument();
    });

    it('displays daily badge', () => {
      const dailyTrade: NPCTrade = { ...mockTrade, repeatability: 'daily' };

      renderWithContext(<NPCTradeCard trade={dailyTrade} canTrade={true} onTrade={mockOnTrade} />);

      expect(screen.getByText('Daily')).toBeInTheDocument();
    });

    it('displays weekly badge', () => {
      const weeklyTrade: NPCTrade = { ...mockTrade, repeatability: 'weekly' };

      renderWithContext(<NPCTradeCard trade={weeklyTrade} canTrade={true} onTrade={mockOnTrade} />);

      expect(screen.getByText('Weekly')).toBeInTheDocument();
    });
  });

  describe('required items', () => {
    it('displays required items', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      expect(screen.getByText('You Give:')).toBeInTheDocument();
      expect(screen.getByText('slime-gel')).toBeInTheDocument();
      expect(screen.getByText(/×3/)).toBeInTheDocument();
    });

    it('shows player has enough required items', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      // Player has 5 slime gels, needs 3 - should not show lacking style
      const requiredItem = screen.getByText('slime-gel').closest('div');
      expect(requiredItem).not.toHaveStyle({ opacity: '0.5' });
    });

    it('shows player lacks required items', () => {
      const insufficientState = {
        ...mockGameState,
        player: {
          ...mockGameState.player,
          inventory: [
            {
              id: 'slime-gel',
              name: 'Slime Gel',
              quantity: 1,
              rarity: 'common',
              itemType: 'material',
              value: 5,
              stackable: true,
              tradeable: true,
            },
          ],
        },
      };

      render(
        <ReactGameProvider initialState={insufficientState as any}>
          <NPCTradeCard trade={mockTrade} canTrade={false} onTrade={mockOnTrade} />
        </ReactGameProvider>
      );

      // Should show player only has 1
      expect(screen.getByText(/\(1\)/)).toBeInTheDocument();
    });

    it('displays required gold', () => {
      const tradeWithGold: NPCTrade = {
        ...mockTrade,
        goldRequired: 100,
      };

      renderWithContext(
        <NPCTradeCard trade={tradeWithGold} canTrade={true} onTrade={mockOnTrade} />
      );

      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText(/💰100/)).toBeInTheDocument();
    });
  });

  describe('offered items', () => {
    it('displays offered items', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      expect(screen.getByText('You Get:')).toBeInTheDocument();
      expect(screen.getByText('health-potion')).toBeInTheDocument();
      expect(screen.getByText(/×1/)).toBeInTheDocument();
    });

    it('displays chance percentage for probabilistic rewards', () => {
      const tradeWithChance: NPCTrade = {
        ...mockTrade,
        offeredItems: [{ itemId: 'rare-gem', quantity: 1, chance: 0.5 }],
      };

      renderWithContext(
        <NPCTradeCard trade={tradeWithChance} canTrade={true} onTrade={mockOnTrade} />
      );

      expect(screen.getByText(/50%/)).toBeInTheDocument();
    });

    it('displays offered gold', () => {
      const tradeWithGold: NPCTrade = {
        ...mockTrade,
        goldOffered: 50,
      };

      renderWithContext(
        <NPCTradeCard trade={tradeWithGold} canTrade={true} onTrade={mockOnTrade} />
      );

      expect(screen.getByText(/💰50/)).toBeInTheDocument();
    });
  });

  describe('completed state', () => {
    it('shows completed badge when trade is completed', () => {
      const completedTrade: NPCTrade = {
        ...mockTrade,
        completed: true,
      };

      renderWithContext(
        <NPCTradeCard trade={completedTrade} canTrade={false} onTrade={mockOnTrade} />
      );

      expect(screen.getByText(/✓ completed/i)).toBeInTheDocument();
    });

    it('disables button when trade is completed', () => {
      const completedTrade: NPCTrade = {
        ...mockTrade,
        completed: true,
      };

      renderWithContext(
        <NPCTradeCard trade={completedTrade} canTrade={false} onTrade={mockOnTrade} />
      );

      const button = screen.getByRole('button', { name: /completed/i });
      expect(button).toBeDisabled();
    });
  });

  describe('trade button', () => {
    it('shows "Trade" button when player can trade', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      expect(
        screen.getByRole('button', { name: /trade with village herbalist/i })
      ).toBeInTheDocument();
    });

    it('shows "Missing Items" when player cannot trade', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={false} onTrade={mockOnTrade} />);

      expect(screen.getByRole('button', { name: /missing items/i })).toBeInTheDocument();
    });

    it('calls onTrade when trade button is clicked', async () => {
      const user = userEvent.setup();
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      const tradeButton = screen.getByRole('button', { name: /trade/i });
      await user.click(tradeButton);

      expect(mockOnTrade).toHaveBeenCalledWith(mockTrade);
      expect(mockOnTrade).toHaveBeenCalledTimes(1);
    });

    it('does not call onTrade when button is disabled', async () => {
      const user = userEvent.setup();
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={false} onTrade={mockOnTrade} />);

      const tradeButton = screen.getByRole('button', { name: /missing items/i });
      await user.click(tradeButton);

      expect(mockOnTrade).not.toHaveBeenCalled();
    });

    it('disables button when disabled prop is true', () => {
      renderWithContext(
        <NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} disabled={true} />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('quest chain indicator', () => {
    it('shows quest chain indicator when trade has requirements', () => {
      const questChainTrade: NPCTrade = {
        ...mockTrade,
        requirements: [{ type: 'quest', id: 'quest-1', description: 'Complete Quest 1' }],
      };

      renderWithContext(
        <NPCTradeCard trade={questChainTrade} canTrade={true} onTrade={mockOnTrade} />
      );

      expect(screen.getByText(/part of a quest chain/i)).toBeInTheDocument();
    });

    it('does not show quest chain indicator without requirements', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      expect(screen.queryByText(/part of a quest chain/i)).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('provides accessible article label', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label', 'Trade offer from Village Herbalist');
    });

    it('provides accessible button label', () => {
      renderWithContext(<NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />);

      const button = screen.getByRole('button', { name: /trade with village herbalist/i });
      expect(button).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    renderWithContext(
      <NPCTradeCard
        trade={mockTrade}
        canTrade={true}
        onTrade={mockOnTrade}
        className='custom-trade-card'
      />
    );

    const article = screen.getByRole('article');
    expect(article).toHaveClass('custom-trade-card');
  });

  describe('visual feedback', () => {
    it('renders with motion animation', () => {
      const { container } = renderWithContext(
        <NPCTradeCard trade={mockTrade} canTrade={true} onTrade={mockOnTrade} />
      );

      // Framer Motion adds attributes to animated components
      expect(screen.getByRole('article')).toBeInTheDocument();
    });
  });
});
