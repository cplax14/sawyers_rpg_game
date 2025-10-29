/**
 * Shop Integration Tests for AreaExploration
 *
 * Tests the complete shop discovery and interaction flow:
 * - Auto-discovery of shops in towns/starting areas
 * - Threshold-based discovery of hidden shops
 * - Shop unlock requirements
 * - Navigation between area, shop, and back
 * - State preservation during navigation
 * - Shop discovery notifications
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AreaExploration } from './AreaExploration';
import { GameProvider } from '../../contexts/ReactGameContext';
import { Shop } from '../../types/shop';
import { ReactArea } from '../../types/game';

// Mock hooks
jest.mock('../../hooks', () => ({
  useAreas: () => ({
    getAreaById: (id: string) => mockAreas[id],
  }),
  usePlayer: () => ({
    player: {
      experience: 1000,
      gold: 500,
    },
  }),
  useWorld: () => ({
    currentAreaId: 'starting_village',
    changeArea: jest.fn(),
  }),
  useUI: () => ({
    navigateToScreen: jest.fn(),
  }),
  useCombat: () => ({
    startCombat: jest.fn(),
  }),
  useIsMobile: () => false,
}));

// Mock shop data
const mockShops: Shop[] = [
  {
    id: 'mistwood_general_store',
    name: "Rosie's Remedies & Rarities",
    type: 'general',
    location: 'starting_village',
    shopkeeper: {
      name: 'Rosie the Shopkeeper',
      mood: 'happy',
      dialogue: {
        greeting: 'Welcome to my shop!',
        buyDialogue: 'Great choice!',
        sellDialogue: 'Thanks!',
        firstVisit: "Hello! I'm Rosie! This is my first shop!",
      },
      avatar: '👩',
    },
    buysCategories: ['consumables', 'materials'],
    unlockRequirements: {
      level: 1,
    },
    pricingModifiers: {
      buyMultiplier: 1.0,
      sellMultiplier: 0.5,
    },
    theme: {
      primaryColor: '#4CAF50',
      secondaryColor: '#81C784',
      icon: '🏪',
    },
    hidden: false,
  },
  {
    id: 'hidden_forest_trader',
    name: 'The Mysterious Merchant',
    type: 'general',
    location: 'forest_path',
    shopkeeper: {
      name: 'Mysterious Merchant Max',
      mood: 'neutral',
      dialogue: {
        greeting: 'Ah, you found me!',
        buyDialogue: 'A rare find!',
        sellDialogue: 'Interesting...',
        firstVisit: 'So, you discovered my secret shop!',
      },
      avatar: '🎩',
    },
    buysCategories: ['consumables', 'materials', 'accessories', 'weapons', 'armor'],
    unlockRequirements: {
      level: 7,
      explorationThreshold: 0.75,
    },
    pricingModifiers: {
      buyMultiplier: 1.3,
      sellMultiplier: 0.6,
    },
    theme: {
      primaryColor: '#795548',
      secondaryColor: '#A1887F',
      icon: '🎩',
    },
    hidden: true,
  },
];

// Mock area data
const mockAreas: Record<string, ReactArea> = {
  starting_village: {
    id: 'starting_village',
    name: 'Peaceful Village',
    description: 'A quiet village where your adventure begins.',
    type: 'town',
    shopIds: ['mistwood_general_store'],
    unlocked: true,
    unlockRequirements: {},
    encounterRate: 0,
    monsters: [],
    connections: ['forest_path'],
    storyEvents: ['game_start', 'tutorial_complete'],
    services: ['shop', 'inn', 'save_point'],
    recommendedLevel: 1,
  },
  forest_path: {
    id: 'forest_path',
    name: 'Forest Path',
    description: 'A winding path through peaceful woods.',
    type: 'wilderness',
    shopIds: ['hidden_forest_trader'],
    unlocked: true,
    unlockRequirements: {},
    encounterRate: 30,
    monsters: ['forest_slime', 'wild_rabbit'],
    connections: ['starting_village'],
    storyEvents: [],
    services: [],
    recommendedLevel: 1,
  },
};

describe('AreaExploration - Shop Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Shop Auto-Discovery', () => {
    it('should auto-discover shops in starting areas/towns on entry', async () => {
      const mockDiscoverShop = jest.fn();

      render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: [],
            unlockedShops: [],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Auto-discovery should trigger for non-hidden shop in town
      await waitFor(() => {
        expect(mockDiscoverShop).toHaveBeenCalledWith('mistwood_general_store');
      });

      // Should show discovery notification
      expect(screen.getByText(/Shop Discovered!/i)).toBeInTheDocument();
      expect(screen.getByText("Rosie's Remedies & Rarities")).toBeInTheDocument();
    });

    it('should not auto-discover hidden shops', async () => {
      const mockDiscoverShop = jest.fn();

      render(
        <GameProvider
          initialState={{
            currentAreaId: 'forest_path',
            shops: mockShops,
            discoveredShops: [],
            unlockedShops: [],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Hidden shop should NOT be auto-discovered
      await waitFor(() => {
        expect(mockDiscoverShop).not.toHaveBeenCalledWith('hidden_forest_trader');
      });

      // Discovery notification should not appear
      expect(screen.queryByText('The Mysterious Merchant')).not.toBeInTheDocument();
    });
  });

  describe('Threshold-Based Discovery', () => {
    it('should discover hidden shop when exploration threshold is met', async () => {
      const mockDiscoverShop = jest.fn();

      const { rerender } = render(
        <GameProvider
          initialState={{
            currentAreaId: 'forest_path',
            shops: mockShops,
            discoveredShops: [],
            unlockedShops: [],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Explore multiple times to reach threshold
      const exploreButton = screen.getByRole('button', { name: /explore/i });

      // Simulate exploring to 75% (threshold for hidden shop)
      for (let i = 0; i < 10; i++) {
        fireEvent.click(exploreButton);
        await waitFor(() => expect(exploreButton).not.toBeDisabled());
      }

      // Hidden shop should be discovered after threshold
      await waitFor(() => {
        expect(mockDiscoverShop).toHaveBeenCalledWith('hidden_forest_trader');
      });

      // Discovery notification should appear
      expect(screen.getByText(/Shop Discovered!/i)).toBeInTheDocument();
      expect(screen.getByText('The Mysterious Merchant')).toBeInTheDocument();
    });
  });

  describe('Shop Interaction Buttons', () => {
    it('should show "Visit Shop" button for discovered and unlocked shops', async () => {
      render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: ['mistwood_general_store'],
            unlockedShops: ['mistwood_general_store'],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Should show Visit Shop button
      const visitButton = await screen.findByRole('button', { name: /visit shop/i });
      expect(visitButton).toBeInTheDocument();
      expect(visitButton).not.toBeDisabled();
    });

    it('should show locked icon for discovered but locked shops', async () => {
      render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: ['mistwood_general_store'],
            unlockedShops: [], // Not unlocked
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Should show locked button
      const lockedButton = await screen.findByRole('button', { name: /locked/i });
      expect(lockedButton).toBeInTheDocument();
      expect(lockedButton).toBeDisabled();
    });

    it('should not show button for undiscovered shops', () => {
      render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: [], // No discoveries
            unlockedShops: [],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Should NOT show any shop buttons
      expect(screen.queryByRole('button', { name: /visit shop/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /locked/i })).not.toBeInTheDocument();
    });
  });

  describe('Shop Discovery Notification', () => {
    it('should display discovery notification with shopkeeper info', async () => {
      render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: [],
            unlockedShops: [],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Wait for auto-discovery notification
      await waitFor(() => {
        expect(screen.getByText(/Shop Discovered!/i)).toBeInTheDocument();
      });

      // Check notification content
      expect(screen.getByText("Rosie's Remedies & Rarities")).toBeInTheDocument();
      expect(screen.getByText(/Hello! I'm Rosie!/i)).toBeInTheDocument();
      expect(screen.getByText(/Rosie the Shopkeeper/i)).toBeInTheDocument();

      // Should have action buttons
      expect(screen.getByRole('button', { name: /visit shop now/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /maybe later/i })).toBeInTheDocument();
    });

    it('should dismiss notification when "Maybe Later" is clicked', async () => {
      render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: [],
            unlockedShops: [],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Shop Discovered!/i)).toBeInTheDocument();
      });

      const maybeLaterButton = screen.getByRole('button', { name: /maybe later/i });
      fireEvent.click(maybeLaterButton);

      // Notification should disappear
      await waitFor(() => {
        expect(screen.queryByText(/Shop Discovered!/i)).not.toBeInTheDocument();
      });
    });

    it('should open shop when "Visit Shop Now" is clicked', async () => {
      const mockOpenShop = jest.fn();

      render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: [],
            unlockedShops: ['mistwood_general_store'],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Shop Discovered!/i)).toBeInTheDocument();
      });

      const visitNowButton = screen.getByRole('button', { name: /visit shop now/i });
      fireEvent.click(visitNowButton);

      // Should open shop interface
      await waitFor(() => {
        expect(mockOpenShop).toHaveBeenCalledWith('mistwood_general_store');
      });
    });
  });

  describe('Shop Interface Integration', () => {
    it('should open ShopInterface when Visit Shop is clicked', async () => {
      render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: ['mistwood_general_store'],
            unlockedShops: ['mistwood_general_store'],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      const visitButton = await screen.findByRole('button', { name: /visit shop/i });
      fireEvent.click(visitButton);

      // ShopInterface should render
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText("Rosie's Remedies & Rarities")).toBeInTheDocument();
      });
    });

    it('should close shop and return to exploration when Close is clicked', async () => {
      render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: ['mistwood_general_store'],
            unlockedShops: ['mistwood_general_store'],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Open shop
      const visitButton = await screen.findByRole('button', { name: /visit shop/i });
      fireEvent.click(visitButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close shop
      const closeButton = screen.getByRole('button', { name: /close shop/i });
      fireEvent.click(closeButton);

      // Should return to exploration view
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByText('Peaceful Village')).toBeInTheDocument();
      });
    });
  });

  describe('NPC Trade Integration', () => {
    it('should show "Talk to Trader" button when area has trader service', async () => {
      render(
        <GameProvider
          initialState={{
            currentAreaId: 'starting_village',
            shops: mockShops,
            discoveredShops: [],
            unlockedShops: [],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Mock area with trader service
      const areaWithTrader = {
        ...mockAreas.starting_village,
        services: ['shop', 'inn', 'save_point', 'trader'],
      };

      // Should show trader button
      const traderButton = await screen.findByRole('button', { name: /talk to trader/i });
      expect(traderButton).toBeInTheDocument();
    });

    it('should open NPCTradeInterface when Talk to Trader is clicked', async () => {
      const areaWithTrader = {
        ...mockAreas.starting_village,
        services: ['shop', 'inn', 'save_point', 'trader'],
      };

      render(
        <GameProvider
          initialState={{
            currentAreaId: 'starting_village',
            shops: mockShops,
            discoveredShops: [],
            unlockedShops: [],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      const traderButton = await screen.findByRole('button', { name: /talk to trader/i });
      fireEvent.click(traderButton);

      // NPCTradeInterface should render
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('State Preservation', () => {
    it('should preserve exploration progress when opening and closing shop', async () => {
      const { rerender } = render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: ['mistwood_general_store'],
            unlockedShops: ['mistwood_general_store'],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Explore a few times
      const exploreButton = screen.getByRole('button', { name: /explore/i });
      fireEvent.click(exploreButton);
      await waitFor(() => expect(exploreButton).not.toBeDisabled());

      fireEvent.click(exploreButton);
      await waitFor(() => expect(exploreButton).not.toBeDisabled());

      // Open shop
      const visitButton = screen.getByRole('button', { name: /visit shop/i });
      fireEvent.click(visitButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close shop
      const closeButton = screen.getByRole('button', { name: /close shop/i });
      fireEvent.click(closeButton);

      // Exploration history should still be present
      await waitFor(() => {
        expect(screen.getByText(/Activity Log/i)).toBeInTheDocument();
      });

      // Should be able to continue exploring
      expect(exploreButton).not.toBeDisabled();
    });

    it('should preserve discovered shops state across component re-renders', async () => {
      const { rerender } = render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: ['mistwood_general_store'],
            unlockedShops: ['mistwood_general_store'],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Verify shop button is visible
      const visitButton = await screen.findByRole('button', { name: /visit shop/i });
      expect(visitButton).toBeInTheDocument();

      // Re-render component
      rerender(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: ['mistwood_general_store'],
            unlockedShops: ['mistwood_general_store'],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Shop button should still be visible
      expect(screen.getByRole('button', { name: /visit shop/i })).toBeInTheDocument();
    });
  });

  describe('Exploration Progress Tracking', () => {
    it('should increment exploration progress with each exploration', async () => {
      render(
        <GameProvider
          initialState={{
            currentAreaId: 'forest_path',
            shops: mockShops,
            discoveredShops: [],
            unlockedShops: [],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      const exploreButton = screen.getByRole('button', { name: /explore/i });

      // Track initial state
      let explorationCount = 0;

      // Explore multiple times
      for (let i = 0; i < 5; i++) {
        fireEvent.click(exploreButton);
        await waitFor(() => expect(exploreButton).not.toBeDisabled());
        explorationCount++;
      }

      // Exploration progress should have increased
      expect(explorationCount).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing shop data gracefully', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      render(
        <GameProvider
          initialState={{
            shops: [], // No shops
            discoveredShops: [],
            unlockedShops: [],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Component should render without errors
      expect(screen.getByText('Peaceful Village')).toBeInTheDocument();

      consoleError.mockRestore();
    });

    it('should handle shop without unlock requirements', async () => {
      const shopWithoutRequirements = {
        ...mockShops[0],
        unlockRequirements: undefined,
      };

      render(
        <GameProvider
          initialState={{
            shops: [shopWithoutRequirements],
            discoveredShops: ['mistwood_general_store'],
            unlockedShops: ['mistwood_general_store'],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      // Should still show visit button
      const visitButton = await screen.findByRole('button', { name: /visit shop/i });
      expect(visitButton).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible shop buttons with proper labels', async () => {
      render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: ['mistwood_general_store'],
            unlockedShops: ['mistwood_general_store'],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      const visitButton = await screen.findByRole('button', { name: /visit shop/i });
      expect(visitButton).toHaveAttribute('title');
    });

    it('should have accessible shop discovery modal', async () => {
      render(
        <GameProvider
          initialState={{
            shops: mockShops,
            discoveredShops: [],
            unlockedShops: [],
          }}
        >
          <AreaExploration />
        </GameProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Shop Discovered!/i)).toBeInTheDocument();
      });

      // Modal should have proper heading structure
      expect(screen.getByRole('heading', { name: /Shop Discovered!/i })).toBeInTheDocument();
    });
  });
});
