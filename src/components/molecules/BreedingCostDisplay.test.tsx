/**
 * Tests for BreedingCostDisplay Component
 *
 * Tests cost display functionality including:
 * - Gold cost display with breakdown
 * - Material requirements display
 * - Availability indicators
 * - Player inventory comparison
 */

import React from 'react';
import { screen } from '@testing-library/react';
import { BreedingCostDisplay } from './BreedingCostDisplay';
import { renderWithGameContext } from '../../test-utils/test-helpers';
import { BreedingCost } from '../../types/breeding';

describe('BreedingCostDisplay', () => {
  const mockBasicCost: BreedingCost = {
    goldAmount: 5000,
    materials: [],
    costBreakdown: {
      baseCost: 1800,
      rarityMultiplier: 2,
      generationMultiplier: 1.5,
      breedingCountMultiplier: 1.2,
      totalGold: 5000,
    },
  };

  const mockCostWithMaterials: BreedingCost = {
    goldAmount: 10000,
    materials: [
      { itemId: 'dragon_scale', quantity: 5, name: 'Dragon Scale' },
      { itemId: 'phoenix_feather', quantity: 3, name: 'Phoenix Feather' },
      { itemId: 'slime_gel', quantity: 10, name: 'Slime Gel' },
    ],
    costBreakdown: {
      baseCost: 3000,
      rarityMultiplier: 4,
      generationMultiplier: 2.25,
      breedingCountMultiplier: 1.44,
      totalGold: 10000,
    },
  };

  describe('Gold Cost Display', () => {
    it('should display gold cost amount', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('5,000')).toBeInTheDocument();
    });

    it('should display gold icon', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('💰')).toBeInTheDocument();
    });

    it('should display "Gold Required" label', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Gold Required:')).toBeInTheDocument();
    });

    it('should show green color when player has enough gold', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      const goldAmount = screen.getByText('5,000');
      expect(goldAmount).toHaveStyle({ color: '#22c55e' });
    });

    it('should show red color when player lacks gold', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={1000}
          playerMaterials={{}}
        />
      );

      const goldAmount = screen.getByText('5,000');
      expect(goldAmount).toHaveStyle({ color: '#ef4444' });
    });

    it('should display player current gold', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={7500}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Your Gold:')).toBeInTheDocument();
      expect(screen.getByText('7,500')).toBeInTheDocument();
    });
  });

  describe('Cost Breakdown', () => {
    it('should display cost breakdown by default', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Base Cost:')).toBeInTheDocument();
      expect(screen.getByText('1,800')).toBeInTheDocument();
    });

    it('should display rarity multiplier', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Rarity Multiplier:')).toBeInTheDocument();
      expect(screen.getByText('×2.0')).toBeInTheDocument();
    });

    it('should display generation tax', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Generation Tax:')).toBeInTheDocument();
      expect(screen.getByText('×1.5')).toBeInTheDocument();
    });

    it('should display breeding count tax', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Breeding Count Tax:')).toBeInTheDocument();
      expect(screen.getByText('×1.20')).toBeInTheDocument();
    });

    it('should display total gold in breakdown', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Total Gold:')).toBeInTheDocument();
      const totalInBreakdown = screen.getAllByText('5,000');
      expect(totalInBreakdown.length).toBeGreaterThan(0);
    });

    it('should hide breakdown when showBreakdown is false', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
          showBreakdown={false}
        />
      );

      expect(screen.queryByText('Base Cost:')).not.toBeInTheDocument();
      expect(screen.queryByText('Rarity Multiplier:')).not.toBeInTheDocument();
    });

    it('should format large numbers with commas', () => {
      const largeCost: BreedingCost = {
        ...mockBasicCost,
        goldAmount: 1500000,
        costBreakdown: {
          ...mockBasicCost.costBreakdown,
          totalGold: 1500000,
        },
      };

      renderWithGameContext(
        <BreedingCostDisplay
          cost={largeCost}
          playerGold={2000000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('1,500,000')).toBeInTheDocument();
    });
  });

  describe('Material Requirements', () => {
    it('should display material section when materials required', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Required Materials')).toBeInTheDocument();
    });

    it('should display all required materials', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Dragon Scale')).toBeInTheDocument();
      expect(screen.getByText('Phoenix Feather')).toBeInTheDocument();
      expect(screen.getByText('Slime Gel')).toBeInTheDocument();
    });

    it('should display material quantities', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('0 / 5')).toBeInTheDocument(); // Dragon Scale
      expect(screen.getByText('0 / 3')).toBeInTheDocument(); // Phoenix Feather
      expect(screen.getByText('0 / 10')).toBeInTheDocument(); // Slime Gel
    });

    it('should display material icons', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{}}
        />
      );

      const icons = screen.getAllByText('📦');
      expect(icons.length).toBe(3);
    });

    it('should show green border when player has enough materials', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{
            dragon_scale: 10,
            phoenix_feather: 5,
            slime_gel: 20,
          }}
        />
      );

      expect(screen.getByText('10 / 5')).toBeInTheDocument();
      expect(screen.getByText('5 / 3')).toBeInTheDocument();
    });

    it('should show red border when player lacks materials', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{
            dragon_scale: 2,
          }}
        />
      );

      expect(screen.getByText('2 / 5')).toBeInTheDocument();
    });

    it('should show message when no materials required', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('No special materials required - gold only!')).toBeInTheDocument();
    });
  });

  describe('Material Availability Indicators', () => {
    it('should show green color when material available', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{
            dragon_scale: 10,
          }}
        />
      );

      const dragonScaleQuantity = screen.getByText('10 / 5');
      expect(dragonScaleQuantity).toHaveStyle({ color: '#22c55e' });
    });

    it('should show red color when material insufficient', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{
            dragon_scale: 2,
          }}
        />
      );

      const dragonScaleQuantity = screen.getByText('2 / 5');
      expect(dragonScaleQuantity).toHaveStyle({ color: '#ef4444' });
    });

    it('should show 0 for materials not in inventory', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('0 / 5')).toBeInTheDocument();
      expect(screen.getByText('0 / 3')).toBeInTheDocument();
      expect(screen.getByText('0 / 10')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should render with proper structure', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Breeding Cost')).toBeInTheDocument();
    });

    it('should display materials in grid layout', () => {
      const { container } = renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{}}
        />
      );

      // Materials should be in a grid
      expect(screen.getByText('Dragon Scale')).toBeInTheDocument();
      expect(screen.getByText('Phoenix Feather')).toBeInTheDocument();
      expect(screen.getByText('Slime Gel')).toBeInTheDocument();
    });

    it('should animate on mount', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      // Component should be present after animation
      expect(screen.getByText('Breeding Cost')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero gold cost', () => {
      const zeroCost: BreedingCost = {
        ...mockBasicCost,
        goldAmount: 0,
        costBreakdown: {
          ...mockBasicCost.costBreakdown,
          totalGold: 0,
        },
      };

      renderWithGameContext(
        <BreedingCostDisplay
          cost={zeroCost}
          playerGold={1000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle player with zero gold', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={0}
          playerMaterials={{}}
        />
      );

      const playerGoldElement = screen.getByText('0');
      expect(playerGoldElement).toBeInTheDocument();
    });

    it('should handle empty materials array', () => {
      const costWithEmptyMaterials: BreedingCost = {
        ...mockBasicCost,
        materials: [],
      };

      renderWithGameContext(
        <BreedingCostDisplay
          cost={costWithEmptyMaterials}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('No special materials required - gold only!')).toBeInTheDocument();
    });

    it('should handle high multiplier values', () => {
      const highMultiplierCost: BreedingCost = {
        goldAmount: 100000,
        materials: [],
        costBreakdown: {
          baseCost: 2000,
          rarityMultiplier: 16,
          generationMultiplier: 7.59375,
          breedingCountMultiplier: 2.985984,
          totalGold: 100000,
        },
      };

      renderWithGameContext(
        <BreedingCostDisplay
          cost={highMultiplierCost}
          playerGold={200000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('×16.0')).toBeInTheDocument();
      expect(screen.getByText(/×7\./)).toBeInTheDocument();
      expect(screen.getByText(/×2\./)).toBeInTheDocument();
    });

    it('should handle exact material match', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{
            dragon_scale: 5,
            phoenix_feather: 3,
            slime_gel: 10,
          }}
        />
      );

      expect(screen.getByText('5 / 5')).toBeInTheDocument();
      expect(screen.getByText('3 / 3')).toBeInTheDocument();
      expect(screen.getByText('10 / 10')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading for cost section', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Breeding Cost')).toBeInTheDocument();
    });

    it('should have proper heading for materials section', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockCostWithMaterials}
          playerGold={20000}
          playerMaterials={{}}
        />
      );

      expect(screen.getByText('Required Materials')).toBeInTheDocument();
    });

    it('should use semantic color indicators', () => {
      renderWithGameContext(
        <BreedingCostDisplay
          cost={mockBasicCost}
          playerGold={10000}
          playerMaterials={{}}
        />
      );

      // Green for sufficient, red for insufficient
      const goldAmount = screen.getByText('5,000');
      expect(goldAmount).toHaveStyle({ color: '#22c55e' });
    });
  });
});
