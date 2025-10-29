import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemListing } from './ItemListing';
import { ReactGameProvider } from '../../contexts/ReactGameContext';
import { EnhancedItem } from '../../types/inventory';
import { ShopInventoryItem } from '../../types/shop';

// Mock item data
const mockItem: EnhancedItem = {
  id: 'health-potion',
  name: 'Health Potion',
  description: 'Restores 50 HP',
  category: 'consumable',
  itemType: 'consumable',
  rarity: 'common',
  value: 50,
  quantity: 5,
  stackable: true,
  tradeable: true,
};

const mockShopItem: ShopInventoryItem = {
  itemId: 'health-potion',
  price: 50,
  sellPrice: 25,
  stock: 10,
  unlocked: true,
};

const mockLockedShopItem: ShopInventoryItem = {
  itemId: 'legendary-sword',
  price: 1000,
  sellPrice: 500,
  stock: 1,
  unlocked: false,
  unlockRequirements: {
    level: 10,
  },
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
    inventory: [],
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

describe('ItemListing', () => {
  const mockOnTransaction = jest.fn();

  beforeEach(() => {
    mockOnTransaction.mockClear();
  });

  describe('basic rendering', () => {
    it('renders item details in buy mode', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByText('Health Potion')).toBeInTheDocument();
      expect(screen.getByText('Restores 50 HP')).toBeInTheDocument();
    });

    it('renders item details in sell mode', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='sell'
          onTransaction={mockOnTransaction}
        />
      );

      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByText('Health Potion')).toBeInTheDocument();
      expect(screen.getByText('Sell')).toBeInTheDocument();
    });

    it('displays item category', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      expect(screen.getByText('consumable')).toBeInTheDocument();
    });
  });

  describe('pricing', () => {
    it('displays buy price in buy mode', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('displays sell price in sell mode', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='sell'
          onTransaction={mockOnTransaction}
        />
      );

      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('updates total price when quantity changes', async () => {
      const user = userEvent.setup();
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const incrementButton = screen.getByLabelText('Increase quantity');
      await user.click(incrementButton);

      // Price should be 100 (50 * 2)
      await waitFor(() => {
        expect(screen.getByText('100')).toBeInTheDocument();
      });
    });
  });

  describe('quantity controls', () => {
    it('starts with quantity of 1', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const quantityDisplay = screen.getByLabelText(/decrease quantity/i).nextSibling;
      expect(quantityDisplay).toHaveTextContent('1');
    });

    it('increments quantity when + button is clicked', async () => {
      const user = userEvent.setup();
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const incrementButton = screen.getByLabelText('Increase quantity');
      await user.click(incrementButton);

      const quantityDisplay = screen.getByLabelText(/decrease quantity/i).nextSibling;
      expect(quantityDisplay).toHaveTextContent('2');
    });

    it('decrements quantity when - button is clicked', async () => {
      const user = userEvent.setup();
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const incrementButton = screen.getByLabelText('Increase quantity');
      const decrementButton = screen.getByLabelText('Decrease quantity');

      await user.click(incrementButton);
      await user.click(incrementButton);
      await user.click(decrementButton);

      const quantityDisplay = screen.getByLabelText(/decrease quantity/i).nextSibling;
      expect(quantityDisplay).toHaveTextContent('2');
    });

    it('disables decrement button at quantity 1', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const decrementButton = screen.getByLabelText('Decrease quantity');
      expect(decrementButton).toBeDisabled();
    });

    it('respects max quantity from stock', async () => {
      const user = userEvent.setup();
      const limitedStock: ShopInventoryItem = { ...mockShopItem, stock: 3 };

      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={limitedStock}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const incrementButton = screen.getByLabelText('Increase quantity');

      // Click 5 times (should max out at 3)
      await user.click(incrementButton);
      await user.click(incrementButton);
      await user.click(incrementButton);
      await user.click(incrementButton);
      await user.click(incrementButton);

      const quantityDisplay = screen.getByLabelText(/decrease quantity/i).nextSibling;
      expect(quantityDisplay).toHaveTextContent('3');
      expect(incrementButton).toBeDisabled();
    });
  });

  describe('affordability', () => {
    it('enables buy button when player can afford', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const buyButton = screen.getByRole('button', { name: /buy/i });
      expect(buyButton).not.toBeDisabled();
    });

    it('disables buy button and shows message when player cannot afford', () => {
      const expensiveItem: ShopInventoryItem = { ...mockShopItem, price: 1000 };

      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={expensiveItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const buyButton = screen.getByRole('button', { name: /cannot afford/i });
      expect(buyButton).toBeDisabled();
    });
  });

  describe('locked items', () => {
    it('displays locked badge for locked items', () => {
      const lockedItem: EnhancedItem = {
        ...mockItem,
        name: 'Legendary Sword',
      };

      renderWithContext(
        <ItemListing
          item={lockedItem}
          shopItem={mockLockedShopItem}
          shopType='weapon'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      expect(screen.getByText(/locked/i)).toBeInTheDocument();
    });

    it('displays unlock requirements for locked items', () => {
      const lockedItem: EnhancedItem = {
        ...mockItem,
        name: 'Legendary Sword',
      };

      renderWithContext(
        <ItemListing
          item={lockedItem}
          shopItem={mockLockedShopItem}
          shopType='weapon'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      expect(screen.getByText(/requires level 10/i)).toBeInTheDocument();
    });

    it('disables transaction button for locked items', () => {
      const lockedItem: EnhancedItem = {
        ...mockItem,
        name: 'Legendary Sword',
      };

      renderWithContext(
        <ItemListing
          item={lockedItem}
          shopItem={mockLockedShopItem}
          shopType='weapon'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const button = screen.getByRole('button', { name: /locked/i });
      expect(button).toBeDisabled();
    });

    it('hides quantity controls for locked items', () => {
      const lockedItem: EnhancedItem = {
        ...mockItem,
        name: 'Legendary Sword',
      };

      renderWithContext(
        <ItemListing
          item={lockedItem}
          shopItem={mockLockedShopItem}
          shopType='weapon'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      expect(screen.queryByLabelText('Increase quantity')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Decrease quantity')).not.toBeInTheDocument();
    });
  });

  describe('transactions', () => {
    it('calls onTransaction with correct parameters when buy button is clicked', async () => {
      const user = userEvent.setup();
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const buyButton = screen.getByRole('button', { name: /buy/i });
      await user.click(buyButton);

      expect(mockOnTransaction).toHaveBeenCalledWith(mockItem, 1, 'buy');
    });

    it('calls onTransaction with updated quantity', async () => {
      const user = userEvent.setup();
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const incrementButton = screen.getByLabelText('Increase quantity');
      await user.click(incrementButton);
      await user.click(incrementButton);

      const buyButton = screen.getByRole('button', { name: /buy/i });
      await user.click(buyButton);

      expect(mockOnTransaction).toHaveBeenCalledWith(mockItem, 3, 'buy');
    });

    it('does not call onTransaction when button is disabled', async () => {
      const user = userEvent.setup();
      const expensiveItem: ShopInventoryItem = { ...mockShopItem, price: 1000 };

      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={expensiveItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const buyButton = screen.getByRole('button', { name: /cannot afford/i });
      await user.click(buyButton);

      expect(mockOnTransaction).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('provides accessible article label', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const article = screen.getByRole('article');
      expect(article).toHaveAttribute('aria-label');
      expect(article.getAttribute('aria-label')).toContain('Health Potion');
    });

    it('provides accessible button labels with quantity and price', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const buyButton = screen.getByRole('button', { name: /buy.*health potion.*50 gold/i });
      expect(buyButton).toBeInTheDocument();
    });

    it('provides aria-live region for quantity changes', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      const quantityDisplay = screen.getByLabelText(/decrease quantity/i).nextSibling;
      expect(quantityDisplay).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('equipment items', () => {
    it('displays stats for equipment items', () => {
      const equipmentItem: EnhancedItem = {
        ...mockItem,
        name: 'Iron Sword',
        stats: {
          strength: 5,
          attack: 10,
        },
      };

      renderWithContext(
        <ItemListing
          item={equipmentItem}
          shopItem={mockShopItem}
          shopType='weapon'
          mode='buy'
          onTransaction={mockOnTransaction}
        />
      );

      expect(screen.getByText(/strength.*\+5/i)).toBeInTheDocument();
      expect(screen.getByText(/attack.*\+10/i)).toBeInTheDocument();
    });
  });

  describe('disabled state', () => {
    it('disables all interactions when disabled prop is true', () => {
      renderWithContext(
        <ItemListing
          item={mockItem}
          shopItem={mockShopItem}
          shopType='general'
          mode='buy'
          onTransaction={mockOnTransaction}
          disabled={true}
        />
      );

      const buyButton = screen.getByRole('button', { name: /buy/i });
      const incrementButton = screen.getByLabelText('Increase quantity');
      const decrementButton = screen.getByLabelText('Decrease quantity');

      expect(buyButton).toBeDisabled();
      expect(incrementButton).toBeDisabled();
      expect(decrementButton).toBeDisabled();
    });
  });
});
