import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShopInterface } from './ShopInterface';
import { ReactGameProvider } from '../../contexts/ReactGameContext';
import { Shop, ShopInventory, ShopInventoryItem } from '../../types/shop';
import { EnhancedItem } from '../../types/inventory';
import * as useShopModule from '../../hooks/useShop';

// Mock the useShop hook
jest.mock('../../hooks/useShop');

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock shop data
const mockShop: Shop = {
  id: 'test-shop',
  name: 'Test General Store',
  type: 'general',
  location: 'test-area',
  shopkeeper: {
    name: 'Friendly Shopkeeper',
    mood: 'happy',
    dialogue: {
      greeting: 'Welcome to my shop!',
      buyDialogue: 'Thank you for your purchase!',
      sellDialogue: 'Thanks for selling!',
      browsing: 'Let me know if you need help!',
      farewell: 'Come back soon!',
    },
    avatar: '🧙',
  },
  buysCategories: ['consumables', 'materials'],
  theme: {
    primaryColor: '#8b5cf6',
    secondaryColor: '#6366f1',
    icon: '🏪',
  },
};

// Mock shop inventory items
const mockShopInventoryItems: ShopInventoryItem[] = [
  {
    itemId: 'health-potion',
    price: 50,
    sellPrice: 25,
    stock: 10,
    unlocked: true,
  },
  {
    itemId: 'mana-potion',
    price: 60,
    sellPrice: 30,
    stock: 5,
    unlocked: true,
  },
  {
    itemId: 'legendary-sword',
    price: 500,
    sellPrice: 250,
    stock: 1,
    unlocked: false,
    unlockRequirements: {
      level: 10,
    },
  },
];

// Mock enhanced items
const mockHealthPotion: EnhancedItem = {
  id: 'health-potion',
  name: 'Health Potion',
  description: 'Restores 50 HP',
  value: 50,
  rarity: 'common',
  category: 'consumables',
  itemType: 'consumable',
  quantity: 1,
};

const mockManaPotion: EnhancedItem = {
  id: 'mana-potion',
  name: 'Mana Potion',
  description: 'Restores 30 MP',
  value: 60,
  rarity: 'common',
  category: 'consumables',
  itemType: 'consumable',
  quantity: 1,
};

const mockLegendarySword: EnhancedItem = {
  id: 'legendary-sword',
  name: 'Legendary Sword',
  description: 'A powerful weapon',
  value: 500,
  rarity: 'legendary',
  category: 'weapons',
  itemType: 'weapon',
  quantity: 1,
  stats: {
    attack: 50,
  },
};

// Mock initial game state
const mockInitialState = {
  player: {
    id: 'test-player',
    name: 'Test Player',
    characterClass: 'Knight',
    level: 5,
    experience: 0,
    experienceToNextLevel: 100,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    gold: 200,
    stats: {
      attack: 10,
      defense: 5,
      magic: 3,
      speed: 7,
    },
    equipment: {
      weapon: null,
      armor: null,
      accessory: null,
    },
  },
  inventory: [
    { ...mockHealthPotion, quantity: 5 },
    { ...mockManaPotion, quantity: 3 },
  ],
  items: [mockHealthPotion, mockManaPotion, mockLegendarySword],
  currentArea: null,
  areas: [],
  monsters: [],
  quests: [],
  completedQuests: [],
  currentEnemy: null,
  combatLog: [],
  gameStarted: false,
  isPaused: false,
  autoSaveEnabled: true,
  lastSaveTime: null,
};

// Helper to render with context
const renderWithContext = (ui: React.ReactElement, initialState = mockInitialState) => {
  return render(<ReactGameProvider>{ui}</ReactGameProvider>);
};

describe('ShopInterface', () => {
  let mockUseShop: jest.Mock;
  let mockBuyItem: jest.Mock;
  let mockSellItem: jest.Mock;
  let mockOnClose: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    mockBuyItem = jest.fn();
    mockSellItem = jest.fn();
    mockOnClose = jest.fn();

    // Setup default mock return value
    mockUseShop = jest.fn(() => ({
      shop: mockShop,
      shopInventory: mockShopInventoryItems,
      isLoading: false,
      error: null,
      isUnlocked: true,
      isDiscovered: true,
      unlockRequirement: null,
      buyItem: mockBuyItem,
      sellItem: mockSellItem,
      canAfford: jest.fn((item, quantity) => {
        const totalCost = (item.value || 0) * quantity;
        return mockInitialState.player.gold >= totalCost;
      }),
      getPricingInfo: jest.fn((item, quantity, type) => ({
        totalCost: (item.value || 0) * quantity,
        perItemCost: item.value || 0,
        tier: { name: 'Standard', multiplier: 1.0 },
      })),
      discoverShop: jest.fn(),
      unlockShop: jest.fn(),
    }));

    (useShopModule.useShop as jest.Mock) = mockUseShop;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render shop interface with shop name and shopkeeper', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByText(/Test General Store/i)).toBeInTheDocument();
      expect(screen.getByText(/Friendly Shopkeeper/i)).toBeInTheDocument();
      expect(screen.getByText(/Welcome to my shop!/i)).toBeInTheDocument();
    });

    it('should render gold balance in header', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByText(/Gold/i)).toBeInTheDocument();
      expect(screen.getByText(/200/)).toBeInTheDocument();
    });

    it('should render buy and sell tabs', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByRole('tab', { name: /Buy Items/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /Sell Items/i })).toBeInTheDocument();
    });

    it('should render category filters', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByText(/All Items/i)).toBeInTheDocument();
      expect(screen.getByText(/Weapons/i)).toBeInTheDocument();
      expect(screen.getByText(/Armor/i)).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByPlaceholderText(/Search shop items/i)).toBeInTheDocument();
    });

    it('should render close button', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /Close shop/i })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when shop data is loading', () => {
      mockUseShop.mockReturnValue({
        ...mockUseShop(),
        isLoading: true,
        shop: null,
      });

      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByText(/Opening shop/i)).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when shop loading fails', () => {
      mockUseShop.mockReturnValue({
        ...mockUseShop(),
        shop: null,
        error: 'Shop not found',
      });

      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByText(/Shop Not Found/i)).toBeInTheDocument();
      expect(screen.getByText(/Shop not found/i)).toBeInTheDocument();
    });

    it('should call onClose when clicking Go Back on error', () => {
      mockUseShop.mockReturnValue({
        ...mockUseShop(),
        shop: null,
        error: 'Shop not found',
      });

      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      fireEvent.click(screen.getByRole('button', { name: /Go Back/i }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Locked Shop State', () => {
    it('should show locked overlay when shop is not unlocked', () => {
      mockUseShop.mockReturnValue({
        ...mockUseShop(),
        isUnlocked: false,
        unlockRequirement: 'Requires Level 10',
      });

      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByText(/Shop Locked/i)).toBeInTheDocument();
      expect(screen.getByText(/Requires Level 10/i)).toBeInTheDocument();
    });

    it('should call onClose when clicking Return to Exploration on locked shop', () => {
      mockUseShop.mockReturnValue({
        ...mockUseShop(),
        isUnlocked: false,
        unlockRequirement: 'Requires Level 10',
      });

      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      fireEvent.click(screen.getByRole('button', { name: /Return to Exploration/i }));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Buy Mode', () => {
    it('should display shop inventory items in buy mode', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      // Buy mode is default
      expect(screen.getByText(/Health Potion/i)).toBeInTheDocument();
      expect(screen.getByText(/Mana Potion/i)).toBeInTheDocument();
    });

    it('should show locked items with unlock requirements', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByText(/Legendary Sword/i)).toBeInTheDocument();
      expect(screen.getByText(/Requires Level 10/i)).toBeInTheDocument();
    });

    it('should filter items by category in buy mode', async () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      // Click weapons filter
      const weaponsButton = screen.getByRole('tab', { name: /Filter by Weapons/i });
      fireEvent.click(weaponsButton);

      await waitFor(() => {
        // Only legendary sword should be visible (weapons category)
        expect(screen.getByText(/Legendary Sword/i)).toBeInTheDocument();
        expect(screen.queryByText(/Health Potion/i)).not.toBeInTheDocument();
      });
    });

    it('should search items in buy mode', async () => {
      const user = userEvent.setup();
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      const searchInput = screen.getByPlaceholderText(/Search shop items/i);
      await user.type(searchInput, 'health');

      await waitFor(() => {
        expect(screen.getByText(/Health Potion/i)).toBeInTheDocument();
        expect(screen.queryByText(/Mana Potion/i)).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no items match filter', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      // Click armor filter (no armor items in shop)
      const armorButton = screen.getByRole('tab', { name: /Filter by Armor/i });
      fireEvent.click(armorButton);

      expect(screen.getByText(/No items match your search/i)).toBeInTheDocument();
    });
  });

  describe('Sell Mode', () => {
    it('should switch to sell mode when clicking sell tab', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      const sellTab = screen.getByRole('tab', { name: /Sell Items/i });
      fireEvent.click(sellTab);

      // Should show player inventory items
      expect(screen.getByPlaceholderText(/Search your items/i)).toBeInTheDocument();
    });

    it('should display player inventory items that shop buys in sell mode', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      const sellTab = screen.getByRole('tab', { name: /Sell Items/i });
      fireEvent.click(sellTab);

      // Shop buys consumables, so health and mana potions should appear
      expect(screen.getByText(/Health Potion/i)).toBeInTheDocument();
      expect(screen.getByText(/Mana Potion/i)).toBeInTheDocument();
    });

    it('should update shopkeeper message when switching to sell mode', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      const sellTab = screen.getByRole('tab', { name: /Sell Items/i });
      fireEvent.click(sellTab);

      expect(screen.getByText(/Let me know if you need help!/i)).toBeInTheDocument();
    });
  });

  describe('Transactions', () => {
    it('should open transaction modal when buying an item', async () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      // Find and click buy button for health potion
      const healthPotionListing = screen.getByText(/Health Potion/i).closest('div');
      const buyButton = within(healthPotionListing!).getByRole('button', { name: /Buy/i });

      fireEvent.click(buyButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Purchase/i)).toBeInTheDocument();
      });
    });

    it('should close transaction modal when clicking cancel', async () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      // Open transaction modal
      const healthPotionListing = screen.getByText(/Health Potion/i).closest('div');
      const buyButton = within(healthPotionListing!).getByRole('button', { name: /Buy/i });
      fireEvent.click(buyButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Purchase/i)).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText(/Confirm Purchase/i)).not.toBeInTheDocument();
      });
    });

    it('should execute buy transaction when confirming purchase', async () => {
      mockBuyItem.mockResolvedValue({
        success: true,
        status: 'success',
        newGoldBalance: 150,
        message: 'Purchase successful!',
        transaction: {
          id: 'txn-1',
          type: 'buy',
          item: mockHealthPotion,
          quantity: 1,
          goldAmount: -50,
          timestamp: new Date(),
          playerLevel: 5,
          status: 'success',
        },
      });

      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      // Open transaction modal
      const healthPotionListing = screen.getByText(/Health Potion/i).closest('div');
      const buyButton = within(healthPotionListing!).getByRole('button', { name: /Buy/i });
      fireEvent.click(buyButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Purchase/i)).toBeInTheDocument();
      });

      // Confirm purchase
      const confirmButton = screen.getByRole('button', { name: /Buy Now/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockBuyItem).toHaveBeenCalledWith(mockHealthPotion, 1);
        expect(screen.getByText(/Thank you for your purchase!/i)).toBeInTheDocument();
      });
    });

    it('should execute sell transaction when confirming sale', async () => {
      mockSellItem.mockResolvedValue({
        success: true,
        status: 'success',
        newGoldBalance: 225,
        message: 'Sale successful!',
        transaction: {
          id: 'txn-2',
          type: 'sell',
          item: mockHealthPotion,
          quantity: 1,
          goldAmount: 25,
          timestamp: new Date(),
          playerLevel: 5,
          status: 'success',
        },
      });

      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      // Switch to sell mode
      const sellTab = screen.getByRole('tab', { name: /Sell Items/i });
      fireEvent.click(sellTab);

      // Open transaction modal
      const healthPotionListing = screen.getByText(/Health Potion/i).closest('div');
      const sellButton = within(healthPotionListing!).getByRole('button', { name: /Sell/i });
      fireEvent.click(sellButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Sale/i)).toBeInTheDocument();
      });

      // Confirm sale
      const confirmButton = screen.getByRole('button', { name: /Sell Now/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockSellItem).toHaveBeenCalledWith(mockHealthPotion, 1);
        expect(screen.getByText(/Thanks for selling!/i)).toBeInTheDocument();
      });
    });

    it('should show error message when transaction fails', async () => {
      mockBuyItem.mockResolvedValue({
        success: false,
        status: 'insufficient_funds',
        newGoldBalance: 200,
        message: 'Insufficient funds',
        error: {
          code: 'INSUFFICIENT_FUNDS',
          category: 'economy',
          message: 'You do not have enough gold',
        },
      });

      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      // Open transaction modal
      const healthPotionListing = screen.getByText(/Health Potion/i).closest('div');
      const buyButton = within(healthPotionListing!).getByRole('button', { name: /Buy/i });
      fireEvent.click(buyButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Purchase/i)).toBeInTheDocument();
      });

      // Confirm purchase
      const confirmButton = screen.getByRole('button', { name: /Buy Now/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/You do not have enough gold/i)).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close shop when pressing Escape key', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close shop when Escape is pressed with modal open', async () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      // Open transaction modal
      const healthPotionListing = screen.getByText(/Health Potion/i).closest('div');
      const buyButton = within(healthPotionListing!).getByRole('button', { name: /Buy/i });
      fireEvent.click(buyButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Purchase/i)).toBeInTheDocument();
      });

      // Press Escape (should not close shop, only modal)
      fireEvent.keyDown(window, { key: 'Escape' });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should focus search input with Ctrl+F', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      const searchInput = screen.getByPlaceholderText(/Search shop items/i);

      fireEvent.keyDown(window, { key: 'f', ctrlKey: true });

      expect(document.activeElement).toBe(searchInput);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByRole('tablist')).toHaveAttribute('aria-label', 'Filter items by category');
    });

    it('should announce tab selection to screen readers', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      const buyTab = screen.getByRole('tab', { name: /Buy Items/i });
      const sellTab = screen.getByRole('tab', { name: /Sell Items/i });

      expect(buyTab).toHaveAttribute('aria-selected', 'true');
      expect(sellTab).toHaveAttribute('aria-selected', 'false');

      fireEvent.click(sellTab);

      expect(buyTab).toHaveAttribute('aria-selected', 'false');
      expect(sellTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when clicking close button', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      const closeButton = screen.getByRole('button', { name: /Close shop/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking overlay background', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      const overlay = screen.getByRole('dialog').parentElement;
      fireEvent.click(overlay!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should not close when clicking inside shop container', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      const shopContainer = screen.getByRole('dialog');
      fireEvent.click(shopContainer);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shop inventory gracefully', () => {
      mockUseShop.mockReturnValue({
        ...mockUseShop(),
        shopInventory: [],
      });

      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      expect(screen.getByText(/This shop has no items available right now/i)).toBeInTheDocument();
    });

    it('should handle empty player inventory in sell mode', () => {
      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />, {
        ...mockInitialState,
        inventory: [],
      });

      const sellTab = screen.getByRole('tab', { name: /Sell Items/i });
      fireEvent.click(sellTab);

      expect(screen.getByText(/You have no items to sell to this shop/i)).toBeInTheDocument();
    });

    it('should handle transaction with quantity greater than 1', async () => {
      mockBuyItem.mockResolvedValue({
        success: true,
        status: 'success',
        newGoldBalance: 50,
        message: 'Purchase successful!',
      });

      renderWithContext(<ShopInterface shopId='test-shop' onClose={mockOnClose} />);

      // Find health potion and increase quantity
      const healthPotionListing = screen.getByText(/Health Potion/i).closest('div');
      const increaseButton = within(healthPotionListing!).getByRole('button', {
        name: /Increase quantity/i,
      });

      fireEvent.click(increaseButton);
      fireEvent.click(increaseButton); // Quantity = 3

      // Buy
      const buyButton = within(healthPotionListing!).getByRole('button', { name: /Buy/i });
      fireEvent.click(buyButton);

      await waitFor(() => {
        expect(screen.getByText(/Confirm Purchase/i)).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /Buy Now/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockBuyItem).toHaveBeenCalledWith(mockHealthPotion, 3);
      });
    });
  });
});
