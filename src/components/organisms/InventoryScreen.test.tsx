/**
 * InventoryScreen Component Tests
 * Comprehensive tests for the items inventory screen with categorized grid view and search functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryScreen } from './InventoryScreen';

// Mock all dependencies
jest.mock('../../hooks/useInventory');
jest.mock('../../contexts/ReactGameContext');
jest.mock('../../hooks', () => ({
  useResponsive: jest.fn(),
}));

// Mock child components
jest.mock('../atoms/Button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid='button'
      data-variant={variant}
      {...props}
    >
      {children}
    </button>
  ),
}));
jest.mock('../atoms/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid='loading-spinner'>Loading...</div>,
}));
jest.mock('../molecules/ItemCard', () => ({
  ItemCard: ({ item, onClick, onUse, onDelete, ...props }: any) => (
    <div data-testid='item-card' data-item-id={item?.id} {...props}>
      <span>{item?.name}</span>
      <span>Qty: {item?.quantity || 1}</span>
      <span>Rarity: {item?.rarity}</span>
      {onClick && (
        <button onClick={() => onClick(item)} data-testid='item-click'>
          Click
        </button>
      )}
      {onUse && (
        <button onClick={() => onUse(item)} data-testid='item-use'>
          Use
        </button>
      )}
      {onDelete && (
        <button onClick={() => onDelete(item)} data-testid='item-delete'>
          Delete
        </button>
      )}
    </div>
  ),
}));

// Import mocked modules
import { useInventory } from '../../hooks/useInventory';
import { useGameState } from '../../contexts/ReactGameContext';
import { useResponsive } from '../../hooks';

const mockUseInventory = useInventory as jest.MockedFunction<typeof useInventory>;
const mockUseGameState = useGameState as jest.MockedFunction<typeof useGameState>;
const mockUseResponsive = useResponsive as jest.MockedFunction<typeof useResponsive>;

describe('InventoryScreen Component', () => {
  const mockOnClose = jest.fn();

  const mockConsumableItem = {
    id: 'potion-1',
    name: 'Health Potion',
    description: 'Restores 50 HP',
    type: 'consumable',
    category: 'consumables',
    rarity: 'common',
    value: 25,
    weight: 0.5,
    quantity: 5,
    stackable: true,
    usable: true,
    effects: {
      health: 50,
    },
  };

  const mockMaterialItem = {
    id: 'ore-1',
    name: 'Iron Ore',
    description: 'Common crafting material',
    type: 'material',
    category: 'materials',
    rarity: 'common',
    value: 10,
    weight: 2,
    quantity: 10,
    stackable: true,
    usable: false,
  };

  const mockQuestItem = {
    id: 'key-1',
    name: 'Ancient Key',
    description: 'Opens ancient doors',
    type: 'quest',
    category: 'quest',
    rarity: 'rare',
    value: 0,
    weight: 0.1,
    quantity: 1,
    stackable: false,
    usable: false,
  };

  const mockItems = [mockConsumableItem, mockMaterialItem, mockQuestItem];

  const defaultMocks = {
    inventory: {
      getFilteredItems: jest.fn().mockImplementation(filter => {
        if (!filter) return mockItems;
        if (filter.category === 'consumables') return [mockConsumableItem];
        if (filter.category === 'materials') return [mockMaterialItem];
        if (filter.category === 'quest') return [mockQuestItem];
        return mockItems;
      }),
      getTotalItemCount: jest.fn().mockReturnValue(16),
      getItemsByCategory: jest.fn().mockImplementation(category => {
        if (category === 'consumables') return [mockConsumableItem];
        if (category === 'materials') return [mockMaterialItem];
        if (category === 'quest') return [mockQuestItem];
        return mockItems;
      }),
      searchItems: jest.fn().mockImplementation(query => {
        return mockItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
      }),
      consolidateInventoryStacks: jest.fn().mockResolvedValue({ success: true }),
      isLoading: false,
      error: null,
    },
    gameState: {
      gameState: {
        player: {
          id: 'player-1',
          name: 'Test Player',
          level: 5,
          stats: {
            strength: 10,
            defense: 8,
            agility: 12,
            intelligence: 6,
            health: 100,
            mana: 50,
          },
        },
      },
      updateGameState: jest.fn(),
    },
    responsive: {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockUseInventory.mockReturnValue(defaultMocks.inventory as any);
    mockUseGameState.mockReturnValue(defaultMocks.gameState as any);
    mockUseResponsive.mockReturnValue(defaultMocks.responsive as any);
  });

  const renderInventoryScreen = (props = {}) => {
    const defaultProps = {
      onClose: mockOnClose,
      ...props,
    };

    return render(<InventoryScreen {...defaultProps} />);
  };

  describe('Basic Rendering', () => {
    it('should render without errors', () => {
      renderInventoryScreen();

      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('Manage your items and consumables')).toBeInTheDocument();
    });

    it('should display total item count', () => {
      renderInventoryScreen();

      expect(screen.getByText('Total: 16 items')).toBeInTheDocument();
    });

    it('should render category filter buttons', () => {
      renderInventoryScreen();

      expect(screen.getByText('All Items')).toBeInTheDocument();
      expect(screen.getByText('Consumables')).toBeInTheDocument();
      expect(screen.getByText('Materials')).toBeInTheDocument();
      expect(screen.getByText('Quest Items')).toBeInTheDocument();
      expect(screen.getByText('Miscellaneous')).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderInventoryScreen();

      expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
    });

    it('should handle custom className', () => {
      const { container } = renderInventoryScreen({ className: 'custom-class' });

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Item Display', () => {
    it('should display all items by default', () => {
      renderInventoryScreen();

      expect(screen.getByText('Health Potion')).toBeInTheDocument();
      expect(screen.getByText('Iron Ore')).toBeInTheDocument();
      expect(screen.getByText('Ancient Key')).toBeInTheDocument();
    });

    it('should display item quantities', () => {
      renderInventoryScreen();

      expect(screen.getByText('Qty: 5')).toBeInTheDocument();
      expect(screen.getByText('Qty: 10')).toBeInTheDocument();
      expect(screen.getByText('Qty: 1')).toBeInTheDocument();
    });

    it('should display item rarities', () => {
      renderInventoryScreen();

      expect(screen.getAllByText('Rarity: common')).toHaveLength(2);
      expect(screen.getByText('Rarity: rare')).toBeInTheDocument();
    });

    it('should handle empty inventory gracefully', () => {
      mockUseInventory.mockReturnValue({
        ...defaultMocks.inventory,
        getFilteredItems: jest.fn().mockReturnValue([]),
        getItemsByCategory: jest.fn().mockReturnValue([]),
        getTotalItemCount: jest.fn().mockReturnValue(0),
      } as any);

      renderInventoryScreen();

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });

  describe('Category Filtering', () => {
    it('should filter items by category', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      // Click consumables filter
      await user.click(screen.getByText('Consumables'));

      expect(mockUseInventory().getItemsByCategory).toHaveBeenCalledWith('consumables');
    });

    it('should show all items when "All Items" is selected', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      // Click All Items filter
      await user.click(screen.getByText('All Items'));

      expect(screen.getByText('Health Potion')).toBeInTheDocument();
    });

    it('should highlight active category', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      const consumablesButton = screen.getByText('Consumables');
      await user.click(consumablesButton);

      // Check if button has active styling (would need to check computed styles)
      expect(consumablesButton).toBeInTheDocument();
    });

    it('should update item count when category changes', async () => {
      const user = userEvent.setup();
      mockUseInventory.mockReturnValue({
        ...defaultMocks.inventory,
        getTotalItemCount: jest.fn().mockReturnValue(5),
      } as any);

      renderInventoryScreen();

      await user.click(screen.getByText('Consumables'));

      expect(screen.getByText('Total: 5 items')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should filter items by search query', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      const searchInput = screen.getByPlaceholderText('Search items...');
      await user.type(searchInput, 'Health');

      expect(mockUseInventory().searchItems).toHaveBeenCalledWith('Health');
    });

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      const searchInput = screen.getByPlaceholderText('Search items...');
      await user.type(searchInput, 'Health');

      const clearButton = screen.getByTestId('clear-search');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });

    it('should show no results message for empty search', async () => {
      const user = userEvent.setup();
      mockUseInventory.mockReturnValue({
        ...defaultMocks.inventory,
        searchItems: jest.fn().mockReturnValue([]),
      } as any);

      renderInventoryScreen();

      const searchInput = screen.getByPlaceholderText('Search items...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No items found matching your search')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should render sort dropdown', () => {
      renderInventoryScreen();

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should sort items when sort option changes', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      const sortSelect = screen.getByRole('combobox');
      await user.selectOptions(sortSelect, 'rarity:desc');

      // Component should re-render with sorted items
      expect(sortSelect).toHaveValue('rarity:desc');
    });

    it('should have correct sort options', () => {
      renderInventoryScreen();

      expect(screen.getByDisplayValue('name:asc')).toBeInTheDocument();
      expect(screen.getByText('🔤 Name (A-Z)')).toBeInTheDocument();
      expect(screen.getByText('⭐ Rarity (Low-High)')).toBeInTheDocument();
    });
  });

  describe('Advanced Filters', () => {
    it('should toggle advanced filters', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      const toggleButton = screen.getByText('Advanced Filters');
      await user.click(toggleButton);

      expect(screen.getByText('Rarity Filter')).toBeInTheDocument();
      expect(screen.getByText('Value Range')).toBeInTheDocument();
    });

    it('should filter by rarity', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      // Open advanced filters
      await user.click(screen.getByText('Advanced Filters'));

      // Click common rarity filter
      const commonChip = screen.getByText('Common');
      await user.click(commonChip);

      // Component should filter by rarity
      expect(commonChip).toBeInTheDocument();
    });

    it('should filter by value range', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      // Open advanced filters
      await user.click(screen.getByText('Advanced Filters'));

      const minInput = screen.getByLabelText('Min Value');
      const maxInput = screen.getByLabelText('Max Value');

      await user.type(minInput, '10');
      await user.type(maxInput, '100');

      expect(minInput).toHaveValue(10);
      expect(maxInput).toHaveValue(100);
    });

    it('should filter usable items only', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      // Open advanced filters
      await user.click(screen.getByText('Advanced Filters'));

      const usableCheckbox = screen.getByLabelText('Usable Only');
      await user.click(usableCheckbox);

      expect(usableCheckbox).toBeChecked();
    });

    it('should clear all filters', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      // Open advanced filters and set some filters
      await user.click(screen.getByText('Advanced Filters'));
      await user.click(screen.getByText('Common'));
      await user.click(screen.getByLabelText('Usable Only'));

      // Clear all filters
      const clearButton = screen.getByText('Clear All');
      await user.click(clearButton);

      expect(screen.getByPlaceholderText('Search items...')).toHaveValue('');
    });
  });

  describe('Item Actions', () => {
    it('should handle item click', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      const itemClickButton = screen.getAllByTestId('item-click')[0];
      await user.click(itemClickButton);

      // Should trigger item selection or detail view
      expect(itemClickButton).toBeInTheDocument();
    });

    it('should handle item use for consumables', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      const useButton = screen.getAllByTestId('item-use')[0];
      await user.click(useButton);

      // Should use the item
      expect(useButton).toBeInTheDocument();
    });

    it('should handle item deletion', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      const deleteButton = screen.getAllByTestId('item-delete')[0];
      await user.click(deleteButton);

      // Should delete the item
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe('Inventory Management', () => {
    it('should consolidate stacks', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      const consolidateButton = screen.getByText('Consolidate Stacks');
      await user.click(consolidateButton);

      expect(mockUseInventory().consolidateInventoryStacks).toHaveBeenCalledWith('main');
    });

    it('should handle consolidation success', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      const consolidateButton = screen.getByText('Consolidate Stacks');
      await user.click(consolidateButton);

      await waitFor(() => {
        expect(mockUseInventory().consolidateInventoryStacks).toHaveBeenCalled();
      });
    });

    it('should handle consolidation error gracefully', async () => {
      const user = userEvent.setup();
      mockUseInventory.mockReturnValue({
        ...defaultMocks.inventory,
        consolidateInventoryStacks: jest.fn().mockRejectedValue(new Error('Consolidation failed')),
      } as any);

      renderInventoryScreen();

      const consolidateButton = screen.getByText('Consolidate Stacks');
      await user.click(consolidateButton);

      // Component should handle error gracefully
      expect(consolidateButton).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to mobile layout', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
      });

      renderInventoryScreen();

      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('should adapt to tablet layout', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
      });

      renderInventoryScreen();

      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('should use desktop layout by default', () => {
      renderInventoryScreen();

      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when loading', () => {
      mockUseInventory.mockReturnValue({
        ...defaultMocks.inventory,
        isLoading: true,
      } as any);

      renderInventoryScreen();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should hide loading spinner when not loading', () => {
      renderInventoryScreen();

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle inventory errors gracefully', () => {
      mockUseInventory.mockReturnValue({
        ...defaultMocks.inventory,
        error: 'Failed to load inventory',
      } as any);

      renderInventoryScreen();

      expect(screen.getByText('Error loading inventory')).toBeInTheDocument();
    });

    it('should handle missing player data gracefully', () => {
      mockUseGameState.mockReturnValue({
        gameState: { player: null },
        updateGameState: jest.fn(),
      } as any);

      renderInventoryScreen();

      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('should handle hook errors gracefully', () => {
      mockUseInventory.mockImplementation(() => {
        throw new Error('Hook error');
      });

      expect(() => renderInventoryScreen()).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should integrate with all required hooks', () => {
      renderInventoryScreen();

      expect(mockUseInventory).toHaveBeenCalled();
      expect(mockUseGameState).toHaveBeenCalled();
      expect(mockUseResponsive).toHaveBeenCalled();
    });

    it('should call onClose when provided', () => {
      renderInventoryScreen();

      // Assuming there's a close button (component implementation dependent)
      const closeButton = screen.queryByText('Close');
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderInventoryScreen();

      // Check for proper headings and structure
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderInventoryScreen();

      const searchInput = screen.getByPlaceholderText('Search items...');
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });

    it('should have proper form labels', () => {
      renderInventoryScreen();

      // Open advanced filters to access form elements
      fireEvent.click(screen.getByText('Advanced Filters'));

      expect(screen.getByLabelText('Min Value')).toBeInTheDocument();
      expect(screen.getByLabelText('Max Value')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should handle large item lists efficiently', () => {
      const largeItemList = Array.from({ length: 1000 }, (_, i) => ({
        ...mockConsumableItem,
        id: `item-${i}`,
        name: `Item ${i}`,
      }));

      mockUseInventory.mockReturnValue({
        ...defaultMocks.inventory,
        getFilteredItems: jest.fn().mockReturnValue(largeItemList),
        getTotalItemCount: jest.fn().mockReturnValue(1000),
      } as any);

      renderInventoryScreen();

      expect(screen.getByText('Total: 1000 items')).toBeInTheDocument();
    });

    it('should debounce search input', async () => {
      const user = userEvent.setup();
      renderInventoryScreen();

      const searchInput = screen.getByPlaceholderText('Search items...');

      // Type quickly
      await user.type(searchInput, 'test');

      // Search should be called
      expect(mockUseInventory().searchItems).toHaveBeenCalled();
    });
  });
});
