/**
 * Tests for BreedingRecipeBook Component
 *
 * Tests recipe book functionality including:
 * - Recipe display (discovered and locked)
 * - Search and filtering
 * - Progress tracking
 * - Recipe data loading
 * - Discovery status indication
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BreedingRecipeBook } from './BreedingRecipeBook';
import { renderWithGameContext } from '../../test-utils/test-helpers';
import { BreedingRecipe } from '../../types/breeding';

// Mock dependencies
jest.mock('../../hooks/useResponsive', () => ({
  useResponsive: () => ({ isMobile: false }),
}));

// Mock recipe data
const mockRecipes: BreedingRecipe[] = [
  {
    id: 'recipe_slime_fusion',
    name: 'Slime Fusion',
    description: 'Combine two slimes to create a stronger slime',
    parentSpecies1: 'slime',
    parentSpecies2: 'slime',
    offspringSpecies: 'mega_slime',
    materials: [],
  },
  {
    id: 'recipe_hybrid_beast',
    name: 'Hybrid Beast',
    description: 'Merge goblin and wolf to create a powerful hybrid',
    parentSpecies1: 'goblin',
    parentSpecies2: 'wolf',
    offspringSpecies: 'goblin_wolf',
    materials: [
      { itemId: 'wolf_pelt', quantity: 3, name: 'Wolf Pelt' },
    ],
  },
  {
    id: 'recipe_dragon_phoenix',
    name: 'Celestial Dragon',
    description: 'Legendary combination of dragon and phoenix',
    parentSpecies1: 'dragon',
    parentSpecies2: 'phoenix',
    offspringSpecies: 'celestial_dragon',
    materials: [
      { itemId: 'dragon_scale', quantity: 10, name: 'Dragon Scale' },
      { itemId: 'phoenix_feather', quantity: 5, name: 'Phoenix Feather' },
    ],
    guaranteedBonuses: {
      minRarity: 'legendary',
      statMultiplier: 1.5,
      guaranteedAbilities: ['divine_flame', 'dragon_roar'],
    },
    hint: 'Combine the mightiest creatures of sky and flame',
  },
  {
    id: 'recipe_elemental_fusion',
    name: 'Elemental Fusion',
    description: 'Combine two elemental creatures',
    parentSpecies1: null,
    parentSpecies2: null,
    offspringSpecies: 'elemental_hybrid',
    materials: [
      { itemId: 'elemental_core', quantity: 2, name: 'Elemental Core' },
    ],
    unlockRequirements: {
      minPlayerLevel: 10,
    },
  },
];

describe('BreedingRecipeBook', () => {
  beforeEach(() => {
    // Mock window.BreedingRecipeData
    (window as any).BreedingRecipeData = {
      recipes: mockRecipes,
    };
  });

  afterEach(() => {
    delete (window as any).BreedingRecipeData;
  });

  describe('Component Rendering', () => {
    it('should render recipe book title', () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      expect(screen.getByText('Breeding Recipe Book')).toBeInTheDocument();
    });

    it('should render recipe book subtitle', () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      expect(screen.getByText(/discover special breeding combinations/i)).toBeInTheDocument();
    });

    it('should load recipes from window data', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should display discovery progress bar', () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      expect(screen.getByText(/0 \/ 4 recipes discovered/i)).toBeInTheDocument();
    });

    it('should calculate correct discovery percentage', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion', 'recipe_hybrid_beast']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/2 \/ 4 recipes discovered/i)).toBeInTheDocument();
      });
    });

    it('should show 100% when all recipes discovered', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={mockRecipes.map(r => r.id)}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/4 \/ 4 recipes discovered/i)).toBeInTheDocument();
      });
    });

    it('should animate progress bar fill', () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion']}
          playerLevel={1}
        />
      );

      // Progress bar should animate to 25% (1/4)
      expect(screen.getByText(/1 \/ 4 recipes discovered/i)).toBeInTheDocument();
    });
  });

  describe('Recipe Display - Discovered', () => {
    it('should display discovered recipe with full details', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
        expect(screen.getByText('Combine two slimes to create a stronger slime')).toBeInTheDocument();
      });
    });

    it('should show Discovered status badge', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Discovered')).toBeInTheDocument();
      });
    });

    it('should display parent species combination', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_hybrid_beast']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Parents')).toBeInTheDocument();
        expect(screen.getByText('goblin')).toBeInTheDocument();
        expect(screen.getByText('wolf')).toBeInTheDocument();
      });
    });

    it('should display offspring species', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_hybrid_beast']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('goblin_wolf')).toBeInTheDocument();
      });
    });

    it('should display required materials', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_hybrid_beast']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Required Materials')).toBeInTheDocument();
        expect(screen.getByText('Wolf Pelt')).toBeInTheDocument();
        expect(screen.getByText('×3')).toBeInTheDocument();
      });
    });

    it('should display guaranteed bonuses', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_dragon_phoenix']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Guaranteed Bonuses')).toBeInTheDocument();
        expect(screen.getByText(/minimum legendary rarity/i)).toBeInTheDocument();
        expect(screen.getByText(/\+50% stats/i)).toBeInTheDocument();
        expect(screen.getByText(/2 special abilities/i)).toBeInTheDocument();
      });
    });

    it('should show Any when parent species not specified', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_elemental_fusion']}
          playerLevel={10}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Any')).toHaveLength(2);
      });
    });
  });

  describe('Recipe Display - Locked', () => {
    it('should display locked recipe with ??? name', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        const questionMarks = screen.getAllByText('???');
        expect(questionMarks.length).toBeGreaterThan(0);
      });
    });

    it('should show Locked status badge', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('Locked')).toHaveLength(mockRecipes.length);
      });
    });

    it('should hide recipe details when locked', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.queryByText('Slime Fusion')).not.toBeInTheDocument();
        expect(screen.queryByText('slime')).not.toBeInTheDocument();
      });
    });

    it('should show generic locked description', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText(/breed different creature combinations/i).length).toBeGreaterThan(0);
      });
    });

    it('should display hint when available', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/combine the mightiest creatures/i)).toBeInTheDocument();
      });
    });

    it('should apply dashed border to locked recipes', async () => {
      const { container } = renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        const lockedCards = container.querySelectorAll('[style*="dashed"]');
        expect(lockedCards.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Search Functionality', () => {
    it('should display search input', () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      expect(screen.getByPlaceholderText('Search recipes...')).toBeInTheDocument();
    });

    it('should filter recipes by name', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion', 'recipe_hybrid_beast']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');
      await user.type(searchInput, 'slime');

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
        expect(screen.queryByText('Hybrid Beast')).not.toBeInTheDocument();
      });
    });

    it('should filter recipes by description', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={mockRecipes.map(r => r.id)}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Celestial Dragon')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');
      await user.type(searchInput, 'legendary');

      await waitFor(() => {
        expect(screen.getByText('Celestial Dragon')).toBeInTheDocument();
      });
    });

    it('should filter recipes by offspring species', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={mockRecipes.map(r => r.id)}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Hybrid Beast')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');
      await user.type(searchInput, 'goblin_wolf');

      await waitFor(() => {
        expect(screen.getByText('Hybrid Beast')).toBeInTheDocument();
      });
    });

    it('should be case-insensitive', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search recipes...');
      await user.type(searchInput, 'SLIME');

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
      });
    });

    it('should show empty state when search has no results', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={mockRecipes.map(r => r.id)}
          playerLevel={1}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search recipes...');
      await user.type(searchInput, 'nonexistent recipe');

      await waitFor(() => {
        expect(screen.getByText(/no recipes match your search/i)).toBeInTheDocument();
      });
    });
  });

  describe('Filter by Discovery Status', () => {
    it('should display filter buttons', () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      expect(screen.getByRole('button', { name: /all recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /discovered/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /locked/i })).toBeInTheDocument();
    });

    it('should show All Recipes as active by default', () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      const allButton = screen.getByRole('button', { name: /all recipes/i });
      expect(allButton).toHaveStyle({ color: '#d4af37' });
    });

    it('should filter to discovered recipes only', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('???').length).toBeGreaterThan(0);
      });

      const discoveredButton = screen.getByRole('button', { name: /^discovered$/i });
      await user.click(discoveredButton);

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
        expect(screen.queryByText('???')).not.toBeInTheDocument();
      });
    });

    it('should filter to locked recipes only', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
      });

      const lockedButton = screen.getByRole('button', { name: /locked/i });
      await user.click(lockedButton);

      await waitFor(() => {
        expect(screen.queryByText('Slime Fusion')).not.toBeInTheDocument();
        expect(screen.getAllByText('???').length).toBeGreaterThan(0);
      });
    });

    it('should return to all recipes when All Recipes clicked', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion']}
          playerLevel={1}
        />
      );

      // Filter to discovered
      const discoveredButton = screen.getByRole('button', { name: /^discovered$/i });
      await user.click(discoveredButton);

      // Click All Recipes
      const allButton = screen.getByRole('button', { name: /all recipes/i });
      await user.click(allButton);

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
        expect(screen.getAllByText('???').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Combined Filters', () => {
    it('should apply both search and status filters', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion', 'recipe_hybrid_beast']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
      });

      // Filter to discovered
      const discoveredButton = screen.getByRole('button', { name: /^discovered$/i });
      await user.click(discoveredButton);

      // Search for slime
      const searchInput = screen.getByPlaceholderText('Search recipes...');
      await user.type(searchInput, 'slime');

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
        expect(screen.queryByText('Hybrid Beast')).not.toBeInTheDocument();
      });
    });
  });

  describe('Unlock Requirements', () => {
    it('should show locked recipe even if level requirement not met', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_elemental_fusion']}
          playerLevel={5}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText('???').length).toBeGreaterThan(0);
      });
    });

    it('should unlock recipe when level requirement met', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_elemental_fusion']}
          playerLevel={10}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Elemental Fusion')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no recipes available', async () => {
      (window as any).BreedingRecipeData = { recipes: [] };

      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/no breeding recipes available/i)).toBeInTheDocument();
      });
    });

    it('should show 0/0 progress when no recipes', async () => {
      (window as any).BreedingRecipeData = { recipes: [] };

      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/0 \/ 0 recipes discovered/i)).toBeInTheDocument();
      });
    });
  });

  describe('Animations', () => {
    it('should animate recipe cards on render', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={['recipe_slime_fusion']}
          playerLevel={1}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
      });
    });

    it('should stagger card animations', async () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={mockRecipes.map(r => r.id)}
          playerLevel={10}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Slime Fusion')).toBeInTheDocument();
        expect(screen.getByText('Hybrid Beast')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper headings', () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      expect(screen.getByText('Breeding Recipe Book')).toBeInTheDocument();
    });

    it('should have accessible search input', () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      const searchInput = screen.getByPlaceholderText('Search recipes...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('should have accessible filter buttons', () => {
      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      expect(screen.getByRole('button', { name: /all recipes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /discovered/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /locked/i })).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing window.BreedingRecipeData gracefully', async () => {
      delete (window as any).BreedingRecipeData;

      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      // Should still render without crashing
      expect(screen.getByText('Breeding Recipe Book')).toBeInTheDocument();
    });

    it('should handle malformed recipe data', async () => {
      (window as any).BreedingRecipeData = { recipes: null };

      renderWithGameContext(
        <BreedingRecipeBook
          discoveredRecipes={[]}
          playerLevel={1}
        />
      );

      // Should handle gracefully
      await waitFor(() => {
        expect(screen.getByText('Breeding Recipe Book')).toBeInTheDocument();
      });
    });
  });
});
