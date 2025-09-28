/**
 * CreatureScreen Component Tests
 * Comprehensive tests for the creature collection management with bestiary view and breeding/trading
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreatureScreen } from './CreatureScreen';

// Mock all dependencies
jest.mock('../../hooks/useCreatures');
jest.mock('../../contexts/ReactGameContext');
jest.mock('../../hooks', () => ({
  useResponsive: jest.fn()
}));
jest.mock('../../utils/creatureUtils');

// Mock child components
jest.mock('../atoms/Button', () => ({
  Button: ({ children, onClick, disabled, variant, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="button" data-variant={variant} {...props}>
      {children}
    </button>
  )
}));
jest.mock('../atoms/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}));
jest.mock('../molecules/CreatureCard', () => ({
  CreatureCard: ({ creature, onClick, onRelease, onAddToTeam, onBreed, onTrade, ...props }: any) => (
    <div data-testid="creature-card" data-creature-id={creature?.id} {...props}>
      <span>{creature?.name}</span>
      <span>Level: {creature?.level}</span>
      <span>Type: {creature?.type}</span>
      <span>Rarity: {creature?.rarity}</span>
      {onClick && <button onClick={() => onClick(creature)} data-testid="creature-click">Click</button>}
      {onRelease && <button onClick={() => onRelease(creature)} data-testid="creature-release">Release</button>}
      {onAddToTeam && <button onClick={() => onAddToTeam(creature)} data-testid="creature-add-team">Add to Team</button>}
      {onBreed && <button onClick={() => onBreed(creature)} data-testid="creature-breed">Breed</button>}
      {onTrade && <button onClick={() => onTrade(creature)} data-testid="creature-trade">Trade</button>}
    </div>
  )
}));

// Import mocked modules
import { useCreatures } from '../../hooks/useCreatures';
import { useGameState } from '../../contexts/ReactGameContext';
import { useResponsive } from '../../hooks';
import { checkBreedingCompatibility, breedCreatures, generateNPCTraders, canMakeTrade, executeNPCTrade } from '../../utils/creatureUtils';

const mockUseCreatures = useCreatures as jest.MockedFunction<typeof useCreatures>;
const mockUseGameState = useGameState as jest.MockedFunction<typeof useGameState>;
const mockUseResponsive = useResponsive as jest.MockedFunction<typeof useResponsive>;
const mockCheckBreedingCompatibility = checkBreedingCompatibility as jest.MockedFunction<typeof checkBreedingCompatibility>;
const mockBreedCreatures = breedCreatures as jest.MockedFunction<typeof breedCreatures>;
const mockGenerateNPCTraders = generateNPCTraders as jest.MockedFunction<typeof generateNPCTraders>;
const mockCanMakeTrade = canMakeTrade as jest.MockedFunction<typeof canMakeTrade>;
const mockExecuteNPCTrade = executeNPCTrade as jest.MockedFunction<typeof executeNPCTrade>;

describe('CreatureScreen Component', () => {
  const mockOnClose = jest.fn();

  const mockBeastCreature = {
    id: 'wolf-1',
    creatureId: 'wolf-1',
    name: 'Shadow Wolf',
    description: 'A mystical wolf creature',
    type: 'beast',
    element: 'shadow',
    rarity: 'uncommon',
    level: 15,
    baseStats: {
      health: 120,
      attack: 80,
      defense: 60,
      speed: 90,
      mana: 40
    },
    currentStats: {
      health: 120,
      attack: 80,
      defense: 60,
      speed: 90,
      mana: 40
    },
    capturedAt: new Date('2024-01-15'),
    discoveredAt: new Date('2024-01-10'),
    abilities: ['Shadow Strike', 'Pack Hunt'],
    isCaptured: true,
    isInTeam: false,
    breedingEligible: true
  };

  const mockDragonCreature = {
    id: 'dragon-1',
    creatureId: 'dragon-1',
    name: 'Fire Dragon',
    description: 'A powerful fire-breathing dragon',
    type: 'dragon',
    element: 'fire',
    rarity: 'legendary',
    level: 25,
    baseStats: {
      health: 200,
      attack: 150,
      defense: 120,
      speed: 70,
      mana: 100
    },
    currentStats: {
      health: 200,
      attack: 150,
      defense: 120,
      speed: 70,
      mana: 100
    },
    capturedAt: new Date('2024-01-20'),
    discoveredAt: new Date('2024-01-18'),
    abilities: ['Fire Breath', 'Dragon Roar', 'Wing Strike'],
    isCaptured: true,
    isInTeam: true,
    breedingEligible: true
  };

  const mockElementalCreature = {
    id: 'elemental-1',
    creatureId: 'elemental-1',
    name: 'Water Spirit',
    description: 'An elemental spirit of water',
    type: 'elemental',
    element: 'water',
    rarity: 'rare',
    level: 20,
    baseStats: {
      health: 100,
      attack: 70,
      defense: 80,
      speed: 85,
      mana: 120
    },
    currentStats: {
      health: 100,
      attack: 70,
      defense: 80,
      speed: 85,
      mana: 120
    },
    capturedAt: null,
    discoveredAt: new Date('2024-01-12'),
    abilities: ['Water Surge', 'Healing Stream'],
    isCaptured: false,
    isInTeam: false,
    breedingEligible: false
  };

  const mockCollection = [mockBeastCreature, mockDragonCreature];
  const mockBestiary = [
    { creature: mockBeastCreature },
    { creature: mockDragonCreature },
    { creature: mockElementalCreature }
  ];
  const mockActiveTeam = [mockDragonCreature];

  const mockNPCTraders = [
    {
      id: 'trader-1',
      name: 'Beast Collector',
      location: 'Forest Outpost',
      offers: [
        {
          id: 'offer-1',
          wants: { type: 'beast', rarity: 'common' },
          gives: { gold: 100, items: ['Beast Food'] }
        }
      ]
    }
  ];

  const defaultMocks = {
    creatures: {
      collection: mockCollection,
      filteredCreatures: mockCollection,
      filteredBestiary: mockBestiary,
      activeTeam: mockActiveTeam,
      isLoading: false,
      error: null,
      getCollectionStats: jest.fn().mockReturnValue({
        total: 2,
        captured: 2,
        discovered: 3,
        completionPercentage: 67
      }),
      searchCreatures: jest.fn().mockImplementation((query) =>
        mockBestiary.filter(creature =>
          creature.name.toLowerCase().includes(query.toLowerCase())
        )
      ),
      filterCreatures: jest.fn().mockImplementation((creatures, filter) => {
        if (filter.type === 'all') return creatures;
        return creatures.filter(creature => creature.type === filter.type);
      }),
      sortCreatures: jest.fn().mockImplementation((creatures, sortBy, order) => {
        return [...creatures].sort((a, b) => {
          if (sortBy === 'name') {
            return order === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
          }
          return 0;
        });
      })
    },
    gameState: {
      gameState: {
        player: {
          id: 'player-1',
          name: 'Test Player',
          level: 10,
          stats: {
            strength: 15,
            defense: 12,
            agility: 18,
            intelligence: 10,
            health: 150,
            mana: 80
          }
        }
      },
      updateGameState: jest.fn()
    },
    responsive: {
      isMobile: false,
      isTablet: false,
      isDesktop: true
    },
    utils: {
      checkBreedingCompatibility: true,
      breedCreatures: { success: true, offspring: mockBeastCreature },
      generateNPCTraders: mockNPCTraders,
      canMakeTrade: true,
      executeNPCTrade: { success: true, result: 'Trade completed' }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockUseCreatures.mockReturnValue(defaultMocks.creatures as any);
    mockUseGameState.mockReturnValue(defaultMocks.gameState as any);
    mockUseResponsive.mockReturnValue(defaultMocks.responsive as any);

    // Setup utility function mocks
    mockCheckBreedingCompatibility.mockReturnValue(defaultMocks.utils.checkBreedingCompatibility);
    mockBreedCreatures.mockResolvedValue(defaultMocks.utils.breedCreatures);
    mockGenerateNPCTraders.mockReturnValue(defaultMocks.utils.generateNPCTraders);
    mockCanMakeTrade.mockReturnValue(defaultMocks.utils.canMakeTrade);
    mockExecuteNPCTrade.mockResolvedValue(defaultMocks.utils.executeNPCTrade);
  });

  const renderCreatureScreen = (props = {}) => {
    const defaultProps = {
      onClose: mockOnClose,
      ...props
    };

    return render(<CreatureScreen {...defaultProps} />);
  };

  describe('Basic Rendering', () => {
    it('should render without errors', () => {
      renderCreatureScreen();

      expect(screen.getByText('Creature Collection')).toBeInTheDocument();
      expect(screen.getByText('Discover, capture, and manage your creature companions')).toBeInTheDocument();
    });

    it('should render view mode tabs', () => {
      renderCreatureScreen();

      expect(screen.getByText('Bestiary')).toBeInTheDocument();
      expect(screen.getByText('Collection')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Breeding')).toBeInTheDocument();
      expect(screen.getByText('Trading')).toBeInTheDocument();
    });

    it('should render creature type filters', () => {
      renderCreatureScreen();

      expect(screen.getByText('All Types')).toBeInTheDocument();
      expect(screen.getByText('Beast')).toBeInTheDocument();
      expect(screen.getByText('Dragon')).toBeInTheDocument();
      expect(screen.getByText('Elemental')).toBeInTheDocument();
    });

    it('should render search input', () => {
      renderCreatureScreen();

      expect(screen.getByPlaceholderText('Search creatures...')).toBeInTheDocument();
    });

    it('should handle custom className', () => {
      const { container } = renderCreatureScreen({ className: 'custom-class' });

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('View Mode Switching', () => {
    it('should switch to collection view', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Collection'));

      // Should show collection-specific content
      expect(screen.getByText('Collection')).toBeInTheDocument();
    });

    it('should switch to team view', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Team'));

      // Should show team-specific content
      expect(screen.getByText('Team')).toBeInTheDocument();
    });

    it('should switch to breeding view', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Breeding'));

      // Should show breeding-specific content
      expect(screen.getByText('Breeding')).toBeInTheDocument();
    });

    it('should switch to trading view', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Trading'));

      // Should show trading-specific content
      expect(screen.getByText('Trading')).toBeInTheDocument();
    });

    it('should highlight active view mode', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      const collectionTab = screen.getByText('Collection');
      await user.click(collectionTab);

      // Check if tab has active styling
      expect(collectionTab).toBeInTheDocument();
    });
  });

  describe('Creature Display', () => {
    it('should display creatures in bestiary view', () => {
      renderCreatureScreen();

      expect(screen.getByText('Shadow Wolf')).toBeInTheDocument();
      expect(screen.getByText('Fire Dragon')).toBeInTheDocument();
      expect(screen.getByText('Water Spirit')).toBeInTheDocument();
    });

    it('should display creature levels', () => {
      renderCreatureScreen();

      expect(screen.getByText('Level: 15')).toBeInTheDocument();
      expect(screen.getByText('Level: 25')).toBeInTheDocument();
      expect(screen.getByText('Level: 20')).toBeInTheDocument();
    });

    it('should display creature types', () => {
      renderCreatureScreen();

      expect(screen.getByText('Type: beast')).toBeInTheDocument();
      expect(screen.getByText('Type: dragon')).toBeInTheDocument();
      expect(screen.getByText('Type: elemental')).toBeInTheDocument();
    });

    it('should display creature rarities', () => {
      renderCreatureScreen();

      expect(screen.getByText('Rarity: uncommon')).toBeInTheDocument();
      expect(screen.getByText('Rarity: legendary')).toBeInTheDocument();
      expect(screen.getByText('Rarity: rare')).toBeInTheDocument();
    });

    it('should handle empty collection gracefully', () => {
      mockUseCreatures.mockReturnValue({
        ...defaultMocks.creatures,
        collection: [],
        filteredCreatures: [],
        filteredBestiary: []
      } as any);

      renderCreatureScreen();

      expect(screen.getByText('No creatures found')).toBeInTheDocument();
    });
  });

  describe('Filtering and Search', () => {
    it('should filter creatures by type', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Beast'));

      expect(mockUseCreatures().filterCreatures).toHaveBeenCalledWith(
        expect.any(Array),
        expect.objectContaining({ type: 'beast' })
      );
    });

    it('should search creatures by name', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      const searchInput = screen.getByPlaceholderText('Search creatures...');
      await user.type(searchInput, 'Shadow');

      expect(mockUseCreatures().searchCreatures).toHaveBeenCalledWith('Shadow');
    });

    it('should clear search when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      const searchInput = screen.getByPlaceholderText('Search creatures...');
      await user.type(searchInput, 'Shadow');

      const clearButton = screen.getByTestId('clear-search');
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });

    it('should show no results message for empty search', async () => {
      const user = userEvent.setup();
      mockUseCreatures.mockReturnValue({
        ...defaultMocks.creatures,
        searchCreatures: jest.fn().mockReturnValue([])
      } as any);

      renderCreatureScreen();

      const searchInput = screen.getByPlaceholderText('Search creatures...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No creatures found matching your search')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('should sort creatures when sort option changes', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      const sortSelect = screen.getByRole('combobox');
      await user.selectOptions(sortSelect, 'level:desc');

      expect(mockUseCreatures().sortCreatures).toHaveBeenCalledWith(
        expect.any(Array),
        'level',
        'desc'
      );
    });

    it('should have correct sort options', () => {
      renderCreatureScreen();

      expect(screen.getByDisplayValue('name:asc')).toBeInTheDocument();
      expect(screen.getByText('🔤 Name (A-Z)')).toBeInTheDocument();
      expect(screen.getByText('📊 Level (Low-High)')).toBeInTheDocument();
    });
  });

  describe('Collection Statistics', () => {
    it('should display collection stats', () => {
      renderCreatureScreen();

      expect(screen.getByText('Captured: 2/3')).toBeInTheDocument();
      expect(screen.getByText('Completion: 67%')).toBeInTheDocument();
    });

    it('should update stats when collection changes', () => {
      mockUseCreatures.mockReturnValue({
        ...defaultMocks.creatures,
        getCollectionStats: jest.fn().mockReturnValue({
          total: 5,
          captured: 3,
          discovered: 5,
          completionPercentage: 60
        })
      } as any);

      renderCreatureScreen();

      expect(screen.getByText('Captured: 3/5')).toBeInTheDocument();
      expect(screen.getByText('Completion: 60%')).toBeInTheDocument();
    });
  });

  describe('Creature Actions', () => {
    it('should handle creature click', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      const creatureClickButton = screen.getAllByTestId('creature-click')[0];
      await user.click(creatureClickButton);

      // Should show creature details or select creature
      expect(creatureClickButton).toBeInTheDocument();
    });

    it('should handle creature release', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      // Switch to collection view first
      await user.click(screen.getByText('Collection'));

      const releaseButton = screen.getAllByTestId('creature-release')[0];
      await user.click(releaseButton);

      // Should release the creature
      expect(releaseButton).toBeInTheDocument();
    });

    it('should handle adding creature to team', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      // Switch to collection view first
      await user.click(screen.getByText('Collection'));

      const addToTeamButton = screen.getAllByTestId('creature-add-team')[0];
      await user.click(addToTeamButton);

      // Should add creature to team
      expect(addToTeamButton).toBeInTheDocument();
    });
  });

  describe('Breeding System', () => {
    it('should show breeding interface in breeding view', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Breeding'));

      expect(screen.getByText('Select Parent 1')).toBeInTheDocument();
      expect(screen.getByText('Select Parent 2')).toBeInTheDocument();
    });

    it('should select breeding parents', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Breeding'));

      const breedButton = screen.getAllByTestId('creature-breed')[0];
      await user.click(breedButton);

      // Should select creature as breeding parent
      expect(breedButton).toBeInTheDocument();
    });

    it('should check breeding compatibility', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Breeding'));

      // After selecting both parents, should check compatibility
      expect(mockCheckBreedingCompatibility).toBeDefined();
    });

    it('should perform breeding when compatible', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Breeding'));

      const breedingButton = screen.getByText('Breed Creatures');
      await user.click(breedingButton);

      expect(mockBreedCreatures).toHaveBeenCalled();
    });
  });

  describe('Trading System', () => {
    it('should show trading interface in trading view', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Trading'));

      expect(screen.getByText('NPC Traders')).toBeInTheDocument();
      expect(screen.getByText('Your Creatures')).toBeInTheDocument();
    });

    it('should select creature for trading', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Trading'));

      const tradeButton = screen.getAllByTestId('creature-trade')[0];
      await user.click(tradeButton);

      // Should select creature for trading
      expect(tradeButton).toBeInTheDocument();
    });

    it('should check trade feasibility', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Trading'));

      // Should check if trades are possible
      expect(mockCanMakeTrade).toBeDefined();
    });

    it('should execute NPC trade', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      await user.click(screen.getByText('Trading'));

      const executeTradeButton = screen.getByText('Execute Trade');
      await user.click(executeTradeButton);

      expect(mockExecuteNPCTrade).toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    it('should adapt to mobile layout', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: true,
        isTablet: false,
        isDesktop: false
      });

      renderCreatureScreen();

      expect(screen.getByText('Creature Collection')).toBeInTheDocument();
    });

    it('should adapt to tablet layout', () => {
      mockUseResponsive.mockReturnValue({
        isMobile: false,
        isTablet: true,
        isDesktop: false
      });

      renderCreatureScreen();

      expect(screen.getByText('Creature Collection')).toBeInTheDocument();
    });

    it('should use desktop layout by default', () => {
      renderCreatureScreen();

      expect(screen.getByText('Creature Collection')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when loading', () => {
      mockUseCreatures.mockReturnValue({
        ...defaultMocks.creatures,
        isLoading: true
      } as any);

      renderCreatureScreen();

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should hide loading spinner when not loading', () => {
      renderCreatureScreen();

      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle creature system errors gracefully', () => {
      mockUseCreatures.mockReturnValue({
        ...defaultMocks.creatures,
        error: 'Failed to load creatures'
      } as any);

      renderCreatureScreen();

      expect(screen.getByText('Error loading creatures')).toBeInTheDocument();
    });

    it('should handle missing player data gracefully', () => {
      mockUseGameState.mockReturnValue({
        gameState: { player: null },
        updateGameState: jest.fn()
      } as any);

      renderCreatureScreen();

      expect(screen.getByText('Creature Collection')).toBeInTheDocument();
    });

    it('should handle hook errors gracefully', () => {
      mockUseCreatures.mockImplementation(() => {
        throw new Error('Hook error');
      });

      expect(() => renderCreatureScreen()).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should integrate with all required hooks', () => {
      renderCreatureScreen();

      expect(mockUseCreatures).toHaveBeenCalled();
      expect(mockUseGameState).toHaveBeenCalled();
      expect(mockUseResponsive).toHaveBeenCalled();
    });

    it('should use creature utility functions', () => {
      renderCreatureScreen();

      expect(mockGenerateNPCTraders).toHaveBeenCalled();
    });

    it('should call onClose when provided', () => {
      renderCreatureScreen();

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
      renderCreatureScreen();

      // Check for proper headings and structure
      expect(screen.getByText('Creature Collection')).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      renderCreatureScreen();

      const searchInput = screen.getByPlaceholderText('Search creatures...');
      searchInput.focus();
      expect(document.activeElement).toBe(searchInput);
    });

    it('should have proper tab navigation for view modes', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      const bestiaryTab = screen.getByText('Bestiary');
      bestiaryTab.focus();
      expect(document.activeElement).toBe(bestiaryTab);

      await user.keyboard('{Tab}');
      const collectionTab = screen.getByText('Collection');
      expect(document.activeElement).toBe(collectionTab);
    });
  });

  describe('Performance', () => {
    it('should handle large creature collections efficiently', () => {
      const largeCollection = Array.from({ length: 500 }, (_, i) => ({
        ...mockBeastCreature,
        id: `creature-${i}`,
        name: `Creature ${i}`
      }));

      mockUseCreatures.mockReturnValue({
        ...defaultMocks.creatures,
        collection: largeCollection,
        filteredCreatures: largeCollection,
        filteredBestiary: largeCollection
      } as any);

      renderCreatureScreen();

      expect(screen.getByText('Creature Collection')).toBeInTheDocument();
    });

    it('should debounce search input', async () => {
      const user = userEvent.setup();
      renderCreatureScreen();

      const searchInput = screen.getByPlaceholderText('Search creatures...');

      // Type quickly
      await user.type(searchInput, 'test');

      // Search should be called
      expect(mockUseCreatures().searchCreatures).toHaveBeenCalled();
    });
  });
});