import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionModal } from './TransactionModal';
import { ReactGameProvider } from '../../contexts/ReactGameContext';
import { EnhancedItem } from '../../types/inventory';

const mockItem: EnhancedItem = {
  id: 'health-potion',
  name: 'Health Potion',
  description: 'Restores 50 HP',
  category: 'consumable',
  itemType: 'consumable',
  rarity: 'common',
  value: 50,
  quantity: 1,
  stackable: true,
  tradeable: true,
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

describe('TransactionModal', () => {
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnConfirm.mockClear();
    mockOnCancel.mockClear();
  });

  describe('basic rendering', () => {
    it('renders when open with buy transaction', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Confirm Purchase')).toBeInTheDocument();
      expect(screen.getByText('Health Potion')).toBeInTheDocument();
    });

    it('renders when open with sell transaction', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='sell'
          totalPrice={25}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Confirm Sale')).toBeInTheDocument();
      expect(screen.getByText('Sell Now')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      renderWithContext(
        <TransactionModal
          isOpen={false}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Confirm Purchase')).not.toBeInTheDocument();
    });

    it('does not render when item is null', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={null}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText('Confirm Purchase')).not.toBeInTheDocument();
    });
  });

  describe('item details', () => {
    it('displays item name', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Health Potion')).toBeInTheDocument();
    });

    it('displays item description', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Restores 50 HP')).toBeInTheDocument();
    });

    it('displays item rarity', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('common')).toBeInTheDocument();
    });
  });

  describe('transaction summary', () => {
    it('displays quantity', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={3}
          transactionType='buy'
          totalPrice={150}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/quantity/i)).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('displays price per item', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={2}
          transactionType='buy'
          totalPrice={100}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/price per item/i)).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('displays total cost for buy transaction', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={2}
          transactionType='buy'
          totalPrice={100}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/total cost/i)).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('displays total value for sell transaction', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={2}
          transactionType='sell'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/total value/i)).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('displays gold after transaction for buy', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/gold after transaction/i)).toBeInTheDocument();
      // 200 - 50 = 150
      expect(screen.getByText('150')).toBeInTheDocument();
    });

    it('displays gold after transaction for sell', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='sell'
          totalPrice={25}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      // 200 + 25 = 225
      expect(screen.getByText('225')).toBeInTheDocument();
    });
  });

  describe('low gold warning', () => {
    it('shows warning when purchase will result in low gold', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={150} // Will leave player with 50 gold (< 100 threshold)
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/your gold will be low/i)).toBeInTheDocument();
    });

    it('does not show warning when purchase leaves sufficient gold', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50} // Will leave player with 150 gold
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText(/your gold will be low/i)).not.toBeInTheDocument();
    });

    it('does not show warning for sell transactions', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='sell'
          totalPrice={25}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByText(/your gold will be low/i)).not.toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup();
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /buy now/i });
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('displays processing state when isProcessing is true', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isProcessing={true}
        />
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
    });

    it('disables buttons when processing', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          isProcessing={true}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /processing/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('different transaction types', () => {
    it('shows correct text for buy transaction', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Confirm Purchase')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to buy/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /buy now/i })).toBeInTheDocument();
    });

    it('shows correct text for sell transaction', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={1}
          transactionType='sell'
          totalPrice={25}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Confirm Sale')).toBeInTheDocument();
      expect(screen.getByText(/are you sure you want to sell/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sell now/i })).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles items without description', () => {
      const itemWithoutDesc: EnhancedItem = {
        ...mockItem,
        description: '',
      };

      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={itemWithoutDesc}
          quantity={1}
          transactionType='buy'
          totalPrice={50}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Health Potion')).toBeInTheDocument();
    });

    it('handles large quantities', () => {
      renderWithContext(
        <TransactionModal
          isOpen={true}
          item={mockItem}
          quantity={99}
          transactionType='buy'
          totalPrice={4950}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.getByText('4,950')).toBeInTheDocument();
    });
  });
});
