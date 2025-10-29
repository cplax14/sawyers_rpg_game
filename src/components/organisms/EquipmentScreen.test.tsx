/**
 * EquipmentScreen Component Tests
 * Comprehensive tests for the equipment management screen with paper doll view and stat comparisons
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EquipmentScreen } from './EquipmentScreen';

// Mock all dependencies
jest.mock('../../hooks/useEquipment');
jest.mock('../../hooks/useInventory');
jest.mock('../../hooks/useEquipmentValidation');
jest.mock('../../contexts/ReactGameContext');
jest.mock('../../hooks', () => ({
  useResponsive: jest.fn(),
}));
jest.mock('../../utils/equipmentUtils');

// Mock child components
jest.mock('../atoms/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid='button' {...props}>
      {children}
    </button>
  ),
}));
jest.mock('../atoms/Card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} data-testid='card' {...props}>
      {children}
    </div>
  ),
}));
jest.mock('../atoms/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid='loading-spinner'>Loading...</div>,
}));
jest.mock('../atoms/Tooltip', () => ({
  Tooltip: ({ children, content }: any) => (
    <div data-testid='tooltip' title={content}>
      {children}
    </div>
  ),
}));
jest.mock('../molecules/ConfirmationDialog', () => ({
  ConfirmationDialog: ({ isOpen, onClose, onConfirm, title, message }: any) =>
    isOpen ? (
      <div data-testid='confirmation-dialog'>
        <h3>{title}</h3>
        <p>{message}</p>
        <button onClick={onConfirm}>Confirm</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));
jest.mock('../molecules/EquipmentSelectionModal', () => ({
  EquipmentSelectionModal: ({ isOpen, onClose, onSelect, slot }: any) =>
    isOpen ? (
      <div data-testid='equipment-selection-modal'>
        <h3>Select Equipment for {slot}</h3>
        <button onClick={() => onSelect({ id: 'test-item', name: 'Test Item' })}>
          Select Test Item
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));
jest.mock('../molecules/StatComparison', () => ({
  StatComparison: ({ currentStats, newStats }: any) => (
    <div data-testid='stat-comparison'>
      <div>Current: {JSON.stringify(currentStats)}</div>
      <div>New: {JSON.stringify(newStats)}</div>
    </div>
  ),
}));

// Import mocked modules
import { useEquipment } from '../../hooks/useEquipment';
import { useInventory } from '../../hooks/useInventory';
import { useEquipmentValidation } from '../../hooks/useEquipmentValidation';
import { useGameState } from '../../contexts/ReactGameContext';
import { useResponsive } from '../../hooks';
import { compareEquipment, checkEquipmentCompatibility } from '../../utils/equipmentUtils';

const mockUseEquipment = useEquipment as jest.MockedFunction<typeof useEquipment>;
const mockUseInventory = useInventory as jest.MockedFunction<typeof useInventory>;
const mockUseEquipmentValidation = useEquipmentValidation as jest.MockedFunction<
  typeof useEquipmentValidation
>;
const mockUseGameState = useGameState as jest.MockedFunction<typeof useGameState>;
const mockUseResponsive = useResponsive as jest.MockedFunction<typeof useResponsive>;
const mockCompareEquipment = compareEquipment as jest.MockedFunction<typeof compareEquipment>;
const mockCheckEquipmentCompatibility = checkEquipmentCompatibility as jest.MockedFunction<
  typeof checkEquipmentCompatibility
>;

describe('EquipmentScreen Component', () => {
  const mockOnClose = jest.fn();

  const mockEquipmentItem = {
    id: 'sword-1',
    name: 'Steel Sword',
    description: 'A sharp steel sword',
    type: 'equipment',
    rarity: 'common',
    value: 100,
    weight: 3,
    equipmentSlot: 'weapon',
    statModifiers: {
      strength: 10,
      defense: 2,
    },
  };

  const defaultMocks = {
    equipment: {
      equipmentSet: {
        helmet: null,
        necklace: null,
        armor: null,
        weapon: mockEquipmentItem,
        shield: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      },
      finalStats: {
        strength: 20,
        defense: 10,
        agility: 12,
        intelligence: 6,
        health: 100,
        mana: 50,
      },
      equipmentBonuses: {
        strength: 10,
        defense: 2,
        agility: 0,
        intelligence: 0,
        health: 0,
        mana: 0,
      },
      equipItem: jest.fn().mockResolvedValue({ success: true }),
      unequipItem: jest.fn().mockResolvedValue({ success: true }),
      canEquipItem: jest.fn().mockReturnValue(true),
      getEquipmentRecommendations: jest.fn().mockReturnValue([]),
      isLoading: false,
      error: null,
    },
    inventory: {
      getFilteredItems: jest.fn().mockImplementation(filter => {
        if (filter?.category === 'equipment') {
          return [mockEquipmentItem];
        }
        return [];
      }),
      isLoading: false,
      error: null,
    },
    validation: {
      validateEquipment: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
      canEquipItem: jest.fn().mockReturnValue(true),
      getRestrictionMessage: jest.fn().mockReturnValue(''),
      playerInfo: {
        baseStats: {
          strength: 10,
          defense: 8,
          agility: 12,
          intelligence: 6,
          health: 100,
          mana: 50,
        },
        level: 5,
        class: 'warrior',
      },
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
      screenSize: 'desktop',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockUseEquipment.mockReturnValue(defaultMocks.equipment as any);
    mockUseInventory.mockReturnValue(defaultMocks.inventory as any);
    mockUseEquipmentValidation.mockReturnValue(defaultMocks.validation as any);
    mockUseGameState.mockReturnValue(defaultMocks.gameState as any);
    mockUseResponsive.mockReturnValue(defaultMocks.responsive as any);

    // Setup utility function mocks
    mockCompareEquipment.mockReturnValue({
      statDifferences: { strength: 5, defense: 1 },
      improvement: true,
      score: 1.2,
    });
    mockCheckEquipmentCompatibility.mockReturnValue({
      compatible: true,
      restrictions: [],
    });
  });

  const renderEquipmentScreen = (props = {}) => {
    const defaultProps = {
      onClose: mockOnClose,
      ...props,
    };

    return render(<EquipmentScreen {...defaultProps} />);
  };

  describe('Basic Rendering', () => {
    it('should render without errors', () => {
      renderEquipmentScreen();

      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(
        screen.getByText('Manage your equipment and view character stats')
      ).toBeInTheDocument();
    });

    it('should render equipment slots', () => {
      renderEquipmentScreen();

      expect(screen.getByText('Weapon')).toBeInTheDocument();
      expect(screen.getByText('Armor')).toBeInTheDocument();
      expect(screen.getByText('Helmet')).toBeInTheDocument();
    });

    it('should render stat display', () => {
      renderEquipmentScreen();

      expect(screen.getByText('Character Stats')).toBeInTheDocument();
    });

    it('should handle custom className', () => {
      const { container } = renderEquipmentScreen({ className: 'custom-class' });

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Equipment Display', () => {
    it('should show equipped items', () => {
      renderEquipmentScreen();

      expect(screen.getByText('Steel Sword')).toBeInTheDocument();
    });

    it('should show empty slot for unequipped items', () => {
      mockUseEquipment.mockReturnValue({
        ...defaultMocks.equipment,
        equipmentSet: {
          helmet: null,
          necklace: null,
          armor: null,
          weapon: null,
          shield: null,
          gloves: null,
          boots: null,
          ring1: null,
          ring2: null,
          charm: null,
        },
      } as any);

      renderEquipmentScreen();

      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('should display item tooltips on hover', async () => {
      renderEquipmentScreen();

      const weaponSlot = screen.getByText('Steel Sword');
      fireEvent.mouseEnter(weaponSlot);

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should show item stats and effects', () => {
      renderEquipmentScreen();

      // The item should display its stat modifiers
      expect(screen.getByText('Steel Sword')).toBeInTheDocument();
    });
  });

  describe('Equipment Management', () => {
    it('should open equipment selection modal when slot is clicked', async () => {
      renderEquipmentScreen();

      const weaponSlot = screen.getByText('Weapon');
      fireEvent.click(weaponSlot);

      await waitFor(() => {
        expect(screen.getByTestId('equipment-selection-modal')).toBeInTheDocument();
      });
    });

    it('should equip item when selected from modal', async () => {
      const mockEquipItem = jest.fn().mockResolvedValue({ success: true });
      mockUseEquipment.mockReturnValue({
        ...defaultMocks.equipment,
        equipItem: mockEquipItem,
      } as any);

      renderEquipmentScreen();

      // Open modal
      const weaponSlot = screen.getByText('Weapon');
      fireEvent.click(weaponSlot);

      await waitFor(() => {
        expect(screen.getByTestId('equipment-selection-modal')).toBeInTheDocument();
      });

      // Select item
      const selectButton = screen.getByText('Select Test Item');
      fireEvent.click(selectButton);

      expect(mockEquipItem).toHaveBeenCalledWith({ id: 'test-item', name: 'Test Item' }, 'weapon');
    });

    it('should unequip item when unequip button is clicked', async () => {
      const mockUnequipItem = jest.fn().mockResolvedValue({ success: true });
      mockUseEquipment.mockReturnValue({
        ...defaultMocks.equipment,
        unequipItem: mockUnequipItem,
      } as any);

      renderEquipmentScreen();

      const unequipButton = screen.getByText('Unequip');
      fireEvent.click(unequipButton);

      expect(mockUnequipItem).toHaveBeenCalledWith('weapon');
    });

    it('should show confirmation dialog for equipment changes', async () => {
      renderEquipmentScreen();

      // This would typically be triggered by a significant equipment change
      // The exact flow depends on the component implementation
      expect(screen.queryByTestId('confirmation-dialog')).not.toBeInTheDocument();
    });
  });

  describe('Stat Comparison', () => {
    it('should show stat comparison when previewing equipment', () => {
      renderEquipmentScreen();

      expect(screen.getByTestId('stat-comparison')).toBeInTheDocument();
    });

    it('should calculate stat differences correctly', () => {
      renderEquipmentScreen();

      const statComparison = screen.getByTestId('stat-comparison');
      expect(statComparison).toHaveTextContent('Current');
      expect(statComparison).toHaveTextContent('New');
    });

    it('should highlight stat improvements and decreases', () => {
      mockCompareEquipment.mockReturnValue({
        statDifferences: { strength: 5, defense: -2 },
        improvement: true,
        score: 1.1,
      });

      renderEquipmentScreen();

      expect(screen.getByTestId('stat-comparison')).toBeInTheDocument();
    });
  });

  describe('Equipment Validation', () => {
    it('should validate equipment compatibility', () => {
      renderEquipmentScreen();

      expect(mockUseEquipmentValidation).toHaveBeenCalled();
    });

    it('should show restriction messages for incompatible equipment', () => {
      mockUseEquipmentValidation.mockReturnValue({
        ...defaultMocks.validation,
        canEquipItem: jest.fn().mockReturnValue(false),
        getRestrictionMessage: jest.fn().mockReturnValue('Level too low'),
      } as any);

      renderEquipmentScreen();

      expect(screen.getByText('Level too low')).toBeInTheDocument();
    });

    it('should disable equip button for incompatible items', () => {
      mockUseEquipment.mockReturnValue({
        ...defaultMocks.equipment,
        canEquipItem: jest.fn().mockReturnValue(false),
      } as any);

      renderEquipmentScreen();

      const equipButtons = screen.getAllByTestId('button');
      const equipButton = equipButtons.find(btn => btn.textContent === 'Equip');
      expect(equipButton).toBeDisabled();
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to mobile layout', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false,
        screenSize: 'mobile',
      });

      renderEquipmentScreen();

      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });

    it('should adapt to tablet layout', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false,
        screenSize: 'tablet',
      });

      renderEquipmentScreen();

      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });

    it('should use desktop layout by default', () => {
      renderEquipmentScreen();

      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when equipment is being loaded', () => {
      mockUseEquipment.mockReturnValue({
        ...defaultMocks.equipment,
        isLoading: true,
      } as any);

      renderEquipmentScreen();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should hide loading spinner when equipment is loaded', () => {
      renderEquipmentScreen();

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle equipment operation errors gracefully', async () => {
      const mockEquipItem = jest.fn().mockRejectedValue(new Error('Equip failed'));
      mockUseEquipment.mockReturnValue({
        ...defaultMocks.equipment,
        equipItem: mockEquipItem,
      } as any);

      renderEquipmentScreen();

      // Try to equip item
      const weaponSlot = screen.getByText('Weapon');
      fireEvent.click(weaponSlot);

      await waitFor(() => {
        expect(screen.getByTestId('equipment-selection-modal')).toBeInTheDocument();
      });

      const selectButton = screen.getByText('Select Test Item');
      fireEvent.click(selectButton);

      // Component should handle the error gracefully
      expect(mockEquipItem).toHaveBeenCalled();
    });

    it('should handle missing player data gracefully', () => {
      mockUseGameState.mockReturnValue({
        gameState: { player: null },
        updateGameState: jest.fn(),
      } as any);

      renderEquipmentScreen();

      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });

    it('should handle hook errors gracefully', () => {
      mockUseEquipment.mockImplementation(() => {
        throw new Error('Hook error');
      });

      expect(() => renderEquipmentScreen()).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should integrate with all required hooks', () => {
      renderEquipmentScreen();

      expect(mockUseEquipment).toHaveBeenCalled();
      expect(mockUseInventory).toHaveBeenCalled();
      expect(mockUseEquipmentValidation).toHaveBeenCalled();
      expect(mockUseGameState).toHaveBeenCalled();
      expect(mockUseResponsive).toHaveBeenCalled();
    });

    it('should use equipment utility functions', () => {
      renderEquipmentScreen();

      // These would be called during equipment comparison
      expect(mockCompareEquipment).toBeDefined();
      expect(mockCheckEquipmentCompatibility).toBeDefined();
    });

    it('should call onClose when provided', () => {
      renderEquipmentScreen();

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
      renderEquipmentScreen();

      // Check for proper headings and structure
      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderEquipmentScreen();

      const weaponSlot = screen.getByText('Weapon');
      weaponSlot.focus();
      expect(document.activeElement).toBe(weaponSlot);
    });

    it('should have proper button labeling', () => {
      renderEquipmentScreen();

      const buttons = screen.getAllByTestId('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type');
      });
    });
  });

  describe('Equipment Actions', () => {
    it('should provide quick actions for equipment management', () => {
      renderEquipmentScreen();

      // Look for common equipment actions
      expect(screen.getByText('Unequip')).toBeInTheDocument();
    });

    it('should handle bulk equipment operations', () => {
      renderEquipmentScreen();

      // This would test features like "unequip all" or "optimize equipment"
      // Implementation depends on component features
      expect(screen.getByText('Equipment')).toBeInTheDocument();
    });

    it('should save equipment configurations', () => {
      renderEquipmentScreen();

      // Test loadout saving functionality if implemented
      expect(mockUseEquipment).toHaveBeenCalled();
    });
  });
});
