/**
 * Tests for VictoryModal Component
 *
 * CRITICAL: These tests prevent regression of the incorrect level-up display bug
 * that was fixed by using the didLevelUp flag instead of checking
 * experience >= experienceToNext after level had already changed.
 *
 * Bug Context:
 * - Victory modal was checking experience >= experienceToNext to show "Level Up!"
 * - This check happened AFTER the level had already been updated
 * - This caused incorrect level-up messages (showing when it shouldn't, or vice versa)
 * - Fixed by using lastCombatRewards.didLevelUp flag set during END_COMBAT action
 *
 * Tests verify:
 * - Level-up banner shows when didLevelUp is true
 * - Level-up banner hidden when didLevelUp is false
 * - Correct new level is displayed in banner
 * - XP, gold, and items display correctly
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import VictoryModal from './VictoryModal';
import * as ReactGameContext from '../../contexts/ReactGameContext';

// =============================================================================
// MOCK SETUP
// =============================================================================

// Mock the useReactGame hook
const mockUseReactGame = jest.fn();

// Mock Button component
jest.mock('../atoms/Button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} data-testid='continue-button' {...props}>
      {children}
    </button>
  ),
}));

// Mock the context
jest.spyOn(ReactGameContext, 'useReactGame').mockImplementation(mockUseReactGame);

// Helper to create mock state
const createMockState = (overrides: any = {}) => ({
  player: {
    name: 'TestPlayer',
    level: 5,
    experience: 500,
    experienceToNext: 200,
    gold: 100,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    ...overrides.player,
  },
  showVictoryModal: true,
  lastCombatRewards: {
    experience: 75,
    gold: 40,
    items: [],
    didLevelUp: false,
    previousLevel: 5,
    newLevel: 5,
    ...overrides.lastCombatRewards,
  },
  capturedMonsters: overrides.capturedMonsters || [],
  ...overrides,
});

// Helper to create mock context return value
const createMockContext = (stateOverrides: any = {}) => ({
  state: createMockState(stateOverrides),
  hideVictoryModal: jest.fn(),
  setCurrentScreen: jest.fn(),
});

// =============================================================================
// LEVEL-UP BANNER DISPLAY TESTS
// =============================================================================

describe('VictoryModal - Level-Up Banner Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show level-up banner when didLevelUp is true', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 100,
        gold: 50,
        items: [],
        didLevelUp: true,
        previousLevel: 5,
        newLevel: 6,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert - Level-up banner should be visible
    expect(screen.getByText(/Level Up!/i)).toBeInTheDocument();
    expect(screen.getByText(/level 6/i)).toBeInTheDocument();
  });

  it('should NOT show level-up banner when didLevelUp is false', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 75,
        gold: 40,
        items: [],
        didLevelUp: false,
        previousLevel: 5,
        newLevel: 5,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert - Level-up banner should NOT be visible
    expect(screen.queryByText(/Level Up!/i)).not.toBeInTheDocument();
  });

  it('should show correct new level in banner', () => {
    // Arrange - Level up from 10 to 11
    const mockContext = createMockContext({
      player: {
        level: 11,
      },
      lastCombatRewards: {
        experience: 200,
        gold: 100,
        items: [],
        didLevelUp: true,
        previousLevel: 10,
        newLevel: 11,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert - Should show level 11
    expect(screen.getByText(/Level Up!/i)).toBeInTheDocument();
    expect(screen.getByText(/level 11/i)).toBeInTheDocument();
  });

  it('should show level-up banner for multiple level gains', () => {
    // Arrange - Level up from 5 to 8 (gained 3 levels)
    const mockContext = createMockContext({
      player: {
        level: 8,
      },
      lastCombatRewards: {
        experience: 500,
        gold: 200,
        items: [],
        didLevelUp: true,
        previousLevel: 5,
        newLevel: 8,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert - Should show new level (8)
    expect(screen.getByText(/Level Up!/i)).toBeInTheDocument();
    expect(screen.getByText(/level 8/i)).toBeInTheDocument();
  });

  it('should fall back to player.level if newLevel is not provided', () => {
    // Arrange
    const mockContext = createMockContext({
      player: {
        level: 7,
      },
      lastCombatRewards: {
        experience: 150,
        gold: 75,
        items: [],
        didLevelUp: true,
        previousLevel: 6,
        newLevel: undefined, // Not provided
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert - Should fall back to player.level (7)
    expect(screen.getByText(/Level Up!/i)).toBeInTheDocument();
    expect(screen.getByText(/level 7/i)).toBeInTheDocument();
  });
});

// =============================================================================
// REWARD DISPLAY TESTS
// =============================================================================

describe('VictoryModal - Reward Display', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display XP reward correctly', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 75,
        gold: 40,
        items: [],
        didLevelUp: false,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert
    expect(screen.getByText(/\+75 XP/i)).toBeInTheDocument();
  });

  it('should display gold reward correctly', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 100,
        gold: 85,
        items: [],
        didLevelUp: false,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert
    expect(screen.getByText(/\+85 coins/i)).toBeInTheDocument();
  });

  it('should display items found count correctly', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 100,
        gold: 50,
        items: [
          {
            id: 'potion',
            name: 'Health Potion',
            quantity: 2,
            type: 'consumable',
            icon: '🧪',
            rarity: 'common',
          },
          {
            id: 'sword',
            name: 'Iron Sword',
            quantity: 1,
            type: 'weapon',
            icon: '⚔️',
            rarity: 'uncommon',
          },
        ],
        didLevelUp: false,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert - Should show "2 items"
    expect(screen.getByText(/2 items/i)).toBeInTheDocument();
  });

  it('should display singular "item" for 1 item', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 100,
        gold: 50,
        items: [
          {
            id: 'potion',
            name: 'Health Potion',
            quantity: 1,
            type: 'consumable',
            icon: '🧪',
            rarity: 'common',
          },
        ],
        didLevelUp: false,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert - Should show "1 item" (singular)
    expect(screen.getByText(/1 item$/i)).toBeInTheDocument();
  });

  it('should display item details correctly', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 100,
        gold: 50,
        items: [
          {
            id: 'potion',
            name: 'Health Potion',
            quantity: 3,
            type: 'consumable',
            icon: '🧪',
            rarity: 'common',
          },
        ],
        didLevelUp: false,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert
    expect(screen.getByText('Health Potion')).toBeInTheDocument();
    expect(screen.getByText('x3')).toBeInTheDocument();
  });

  it('should NOT display items section when no items found', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 100,
        gold: 50,
        items: [],
        didLevelUp: false,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert - "Items Found" should not be visible
    expect(screen.queryByText(/Items Found/i)).not.toBeInTheDocument();
  });

  it('should handle zero XP and gold correctly', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 0,
        gold: 0,
        items: [],
        didLevelUp: false,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert
    expect(screen.getByText(/\+0 XP/i)).toBeInTheDocument();
    expect(screen.getByText(/\+0 coins/i)).toBeInTheDocument();
  });
});

// =============================================================================
// VISIBILITY TESTS
// =============================================================================

describe('VictoryModal - Visibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when showVictoryModal is true', () => {
    // Arrange
    const mockContext = createMockContext({
      showVictoryModal: true,
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert
    expect(screen.getByText(/Victory!/i)).toBeInTheDocument();
  });

  it('should NOT render when showVictoryModal is false', () => {
    // Arrange
    const mockContext = createMockContext({
      showVictoryModal: false,
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    const { container } = render(<VictoryModal />);

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it('should NOT render when lastCombatRewards is null', () => {
    // Arrange
    const mockContext = createMockContext({
      showVictoryModal: true,
      lastCombatRewards: null,
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    const { container } = render(<VictoryModal />);

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it('should respect isVisible prop when provided', () => {
    // Arrange
    const mockContext = createMockContext({
      showVictoryModal: false, // State says false
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act - Override with isVisible prop
    render(<VictoryModal isVisible={true} />);

    // Assert - Should be visible because prop overrides state
    expect(screen.getByText(/Victory!/i)).toBeInTheDocument();
  });
});

// =============================================================================
// INTERACTION TESTS
// =============================================================================

describe('VictoryModal - Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call hideVictoryModal when continue button is clicked', async () => {
    // Arrange
    const mockHideVictoryModal = jest.fn();
    const mockContext = createMockContext();
    mockContext.hideVictoryModal = mockHideVictoryModal;

    mockUseReactGame.mockReturnValue(mockContext);

    const user = userEvent.setup();

    // Act
    render(<VictoryModal />);
    const continueButton = screen.getByTestId('continue-button');
    await user.click(continueButton);

    // Assert
    expect(mockHideVictoryModal).toHaveBeenCalledTimes(1);
  });

  it('should call setCurrentScreen with "area" when continue button is clicked', async () => {
    // Arrange
    const mockSetCurrentScreen = jest.fn();
    const mockContext = createMockContext();
    mockContext.setCurrentScreen = mockSetCurrentScreen;

    mockUseReactGame.mockReturnValue(mockContext);

    const user = userEvent.setup();

    // Act
    render(<VictoryModal />);
    const continueButton = screen.getByTestId('continue-button');
    await user.click(continueButton);

    // Assert
    expect(mockSetCurrentScreen).toHaveBeenCalledWith('area');
  });

  it('should call onClose prop if provided', async () => {
    // Arrange
    const mockOnClose = jest.fn();
    const mockContext = createMockContext();

    mockUseReactGame.mockReturnValue(mockContext);

    const user = userEvent.setup();

    // Act
    render(<VictoryModal onClose={mockOnClose} />);
    const continueButton = screen.getByTestId('continue-button');
    await user.click(continueButton);

    // Assert
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

// =============================================================================
// COMBINED SCENARIOS TESTS
// =============================================================================

describe('VictoryModal - Combined Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display both rewards and level-up banner correctly', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 150,
        gold: 75,
        items: [
          {
            id: 'potion',
            name: 'Health Potion',
            quantity: 2,
            type: 'consumable',
            icon: '🧪',
            rarity: 'common',
          },
        ],
        didLevelUp: true,
        previousLevel: 9,
        newLevel: 10,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert - All elements should be visible
    expect(screen.getByText(/Victory!/i)).toBeInTheDocument();
    expect(screen.getByText(/\+150 XP/i)).toBeInTheDocument();
    expect(screen.getByText(/\+75 coins/i)).toBeInTheDocument();
    expect(screen.getByText(/1 item/i)).toBeInTheDocument();
    expect(screen.getByText(/Level Up!/i)).toBeInTheDocument();
    expect(screen.getByText(/level 10/i)).toBeInTheDocument();
  });

  it('should display monster capture banner when monster was captured', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 100,
        gold: 50,
        items: [],
        capturedMonsterId: 'monster-123',
        didLevelUp: false,
      },
      capturedMonsters: [
        {
          id: 'monster-123',
          name: 'Slime',
          level: 3,
          species: 'slime',
        },
      ],
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert
    expect(screen.getByText(/Monster Captured!/i)).toBeInTheDocument();
    expect(screen.getByText(/Slime/i)).toBeInTheDocument();
    expect(screen.getByText(/Level 3/i)).toBeInTheDocument();
  });

  it('should display all banners when capturing monster AND leveling up', () => {
    // Arrange
    const mockContext = createMockContext({
      player: {
        level: 5,
      },
      lastCombatRewards: {
        experience: 150,
        gold: 75,
        items: [],
        capturedMonsterId: 'monster-456',
        didLevelUp: true,
        previousLevel: 4,
        newLevel: 5,
      },
      capturedMonsters: [
        {
          id: 'monster-456',
          name: 'Goblin',
          level: 5,
          species: 'goblin',
        },
      ],
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert - Both banners should be visible
    expect(screen.getByText(/Monster Captured!/i)).toBeInTheDocument();
    expect(screen.getByText(/Goblin/i)).toBeInTheDocument();
    expect(screen.getByText(/Level Up!/i)).toBeInTheDocument();
    // Check for the specific level-up text, not the monster level
    expect(screen.getByText(/You reached level 5/i)).toBeInTheDocument();
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe('VictoryModal - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle very large XP and gold values', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 999999,
        gold: 999999,
        items: [],
        didLevelUp: false,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert
    expect(screen.getByText(/\+999999 XP/i)).toBeInTheDocument();
    expect(screen.getByText(/\+999999 coins/i)).toBeInTheDocument();
  });

  it('should handle many items (10+)', () => {
    // Arrange
    const manyItems = Array.from({ length: 15 }, (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i}`,
      quantity: 1,
      type: 'consumable' as const,
      icon: '📦',
      rarity: 'common',
    }));

    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 100,
        gold: 50,
        items: manyItems,
        didLevelUp: false,
      },
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act
    render(<VictoryModal />);

    // Assert
    expect(screen.getByText(/15 items/i)).toBeInTheDocument();
  });

  it('should NOT crash when capturedMonsterId points to non-existent monster', () => {
    // Arrange
    const mockContext = createMockContext({
      lastCombatRewards: {
        experience: 100,
        gold: 50,
        items: [],
        capturedMonsterId: 'non-existent-id',
        didLevelUp: false,
      },
      capturedMonsters: [], // Empty array
    });

    mockUseReactGame.mockReturnValue(mockContext);

    // Act & Assert - Should not crash
    render(<VictoryModal />);
    expect(screen.getByText(/Victory!/i)).toBeInTheDocument();
    // Monster capture banner should NOT be visible
    expect(screen.queryByText(/Monster Captured!/i)).not.toBeInTheDocument();
  });
});
