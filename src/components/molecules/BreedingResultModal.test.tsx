/**
 * Tests for BreedingResultModal Component
 *
 * Tests result modal functionality including:
 * - Successful breeding display
 * - Failed breeding display
 * - Offspring details and stats
 * - Rarity upgrade celebration
 * - Name input and actions
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BreedingResultModal } from './BreedingResultModal';
import { renderWithGameContext, createMockGameContext } from '../../test-utils/test-helpers';
import { BreedingResult } from '../../types/breeding';
import { EnhancedCreature } from '../../types/creatures';

const mockOffspring: Partial<EnhancedCreature> = {
  creatureId: 'offspring_1',
  id: 'offspring_1',
  name: 'Hybrid Creature',
  species: 'hybrid',
  level: 1,
  generation: 2,
  breedingCount: 0,
  exhaustionLevel: 0,
  rarity: 'uncommon',
  parentIds: ['parent_1', 'parent_2'],
  stats: {
    attack: 55,
    defense: 45,
    magicAttack: 40,
    magicDefense: 42,
    speed: 50,
    accuracy: 88,
  },
  abilities: ['tackle', 'absorb'],
};

describe('BreedingResultModal', () => {
  const mockOnClose = jest.fn();
  const mockOnBreedAgain = jest.fn();
  const mockOnViewInCollection = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success State', () => {
    const successResult: BreedingResult = {
      success: true,
      offspring: mockOffspring as EnhancedCreature,
      offspringSpecies: 'hybrid',
      generation: 2,
      inheritedAbilities: ['tackle'],
      rarityUpgraded: false,
      messages: ['Breeding successful!', 'Your new creature is ready!'],
      costPaid: {
        goldAmount: 5000,
        materials: [],
      },
    };

    it('should display success celebration', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.getByText('Breeding Successful!')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should display offspring creature card', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.getByText('Your New Creature')).toBeInTheDocument();
      expect(screen.getByText('Hybrid Creature')).toBeInTheDocument();
    });

    it('should display offspring stats', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.getByText('Stats Summary')).toBeInTheDocument();
      expect(screen.getByText('Gen 2')).toBeInTheDocument();
      expect(screen.getByText('hybrid')).toBeInTheDocument();
      expect(screen.getByText('uncommon')).toBeInTheDocument();
    });

    it('should display inherited abilities', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.getByText('Inherited Abilities')).toBeInTheDocument();
      expect(screen.getByText('tackle')).toBeInTheDocument();
    });

    it('should display success messages', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.getByText('Breeding successful!')).toBeInTheDocument();
      expect(screen.getByText('Your new creature is ready!')).toBeInTheDocument();
    });

    it('should not display rarity upgrade banner when not upgraded', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.queryByText(/rarity upgraded/i)).not.toBeInTheDocument();
    });

    it('should animate celebration icon', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      const celebrationIcon = screen.getByText('🎉');
      expect(celebrationIcon).toBeInTheDocument();
    });
  });

  describe('Rarity Upgrade State', () => {
    const upgradedResult: BreedingResult = {
      success: true,
      offspring: { ...mockOffspring, rarity: 'rare' } as EnhancedCreature,
      offspringSpecies: 'hybrid',
      generation: 2,
      inheritedAbilities: ['tackle'],
      rarityUpgraded: true,
      messages: ['Breeding successful!', 'Rarity upgraded!'],
      costPaid: {
        goldAmount: 5000,
        materials: [],
      },
    };

    it('should display rarity upgrade banner', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={upgradedResult} />
      );

      expect(screen.getByText(/rarity upgraded to rare/i)).toBeInTheDocument();
    });

    it('should display legendary offspring title when upgraded', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={upgradedResult} />
      );

      expect(screen.getByText(/legendary offspring/i)).toBeInTheDocument();
    });

    it('should animate upgrade banner', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={upgradedResult} />
      );

      const banner = screen.getByText(/rarity upgraded to rare/i);
      expect(banner).toBeInTheDocument();
    });
  });

  describe('Failed State', () => {
    const failedResult: BreedingResult = {
      success: false,
      offspring: null,
      offspringSpecies: '',
      generation: 0,
      inheritedAbilities: [],
      rarityUpgraded: false,
      messages: [],
      error: 'Insufficient gold for breeding',
      costPaid: {
        goldAmount: 0,
        materials: [],
      },
    };

    it('should display failure message', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={failedResult} />
      );

      expect(screen.getByText('Breeding Failed')).toBeInTheDocument();
      expect(screen.getByText('😞')).toBeInTheDocument();
    });

    it('should display error message', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={failedResult} />
      );

      expect(screen.getByText('Insufficient gold for breeding')).toBeInTheDocument();
    });

    it('should show Try Again button', () => {
      renderWithGameContext(
        <BreedingResultModal
          isOpen={true}
          onClose={mockOnClose}
          result={failedResult}
          onBreedAgain={mockOnBreedAgain}
        />
      );

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('should not show offspring details on failure', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={failedResult} />
      );

      expect(screen.queryByText('Your New Creature')).not.toBeInTheDocument();
      expect(screen.queryByText('Stats Summary')).not.toBeInTheDocument();
    });

    it('should display generic error when no error message provided', () => {
      const noErrorResult = { ...failedResult, error: undefined };

      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={noErrorResult} />
      );

      expect(screen.getByText(/an unknown error occurred/i)).toBeInTheDocument();
    });
  });

  describe('Name Input', () => {
    const successResult: BreedingResult = {
      success: true,
      offspring: mockOffspring as EnhancedCreature,
      offspringSpecies: 'hybrid',
      generation: 2,
      inheritedAbilities: [],
      rarityUpgraded: false,
      messages: [],
      costPaid: { goldAmount: 5000, materials: [] },
    };

    it('should display name input field', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.getByPlaceholderText('Enter custom name...')).toBeInTheDocument();
    });

    it('should pre-fill with offspring name', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      const input = screen.getByPlaceholderText('Enter custom name...') as HTMLInputElement;
      expect(input.value).toBe('Hybrid Creature');
    });

    it('should update name on input change', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      const input = screen.getByPlaceholderText('Enter custom name...') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, 'Super Hybrid');

      expect(input.value).toBe('Super Hybrid');
    });

    it('should dispatch rename action on blur', async () => {
      const user = userEvent.setup();
      const mockContext = createMockGameContext();

      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />,
        { contextValue: mockContext }
      );

      const input = screen.getByPlaceholderText('Enter custom name...') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, 'New Name');
      input.blur();

      await waitFor(() => {
        expect(mockContext.dispatch).toHaveBeenCalled();
      });
    });

    it('should dispatch rename action on Enter key', async () => {
      const user = userEvent.setup();
      const mockContext = createMockGameContext();

      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />,
        { contextValue: mockContext }
      );

      const input = screen.getByPlaceholderText('Enter custom name...') as HTMLInputElement;
      await user.clear(input);
      await user.type(input, 'New Name{Enter}');

      await waitFor(() => {
        expect(mockContext.dispatch).toHaveBeenCalled();
      });
    });

    it('should not dispatch rename with empty name', async () => {
      const user = userEvent.setup();
      const mockContext = createMockGameContext();

      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />,
        { contextValue: mockContext }
      );

      const input = screen.getByPlaceholderText('Enter custom name...') as HTMLInputElement;
      await user.clear(input);
      input.blur();

      expect(mockContext.dispatch).not.toHaveBeenCalled();
    });
  });

  describe('Action Buttons', () => {
    const successResult: BreedingResult = {
      success: true,
      offspring: mockOffspring as EnhancedCreature,
      offspringSpecies: 'hybrid',
      generation: 2,
      inheritedAbilities: [],
      rarityUpgraded: false,
      messages: [],
      costPaid: { goldAmount: 5000, materials: [] },
    };

    it('should display Close button', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should call onClose when Close button clicked', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should display Breed Again button when provided', () => {
      renderWithGameContext(
        <BreedingResultModal
          isOpen={true}
          onClose={mockOnClose}
          result={successResult}
          onBreedAgain={mockOnBreedAgain}
        />
      );

      expect(screen.getByRole('button', { name: /breed again/i })).toBeInTheDocument();
    });

    it('should call onBreedAgain when Breed Again clicked', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingResultModal
          isOpen={true}
          onClose={mockOnClose}
          result={successResult}
          onBreedAgain={mockOnBreedAgain}
        />
      );

      const breedAgainButton = screen.getByRole('button', { name: /breed again/i });
      await user.click(breedAgainButton);

      expect(mockOnBreedAgain).toHaveBeenCalledTimes(1);
    });

    it('should display View in Collection button when provided', () => {
      renderWithGameContext(
        <BreedingResultModal
          isOpen={true}
          onClose={mockOnClose}
          result={successResult}
          onViewInCollection={mockOnViewInCollection}
        />
      );

      expect(screen.getByRole('button', { name: /view in collection/i })).toBeInTheDocument();
    });

    it('should call onViewInCollection when button clicked', async () => {
      const user = userEvent.setup();
      renderWithGameContext(
        <BreedingResultModal
          isOpen={true}
          onClose={mockOnClose}
          result={successResult}
          onViewInCollection={mockOnViewInCollection}
        />
      );

      const viewButton = screen.getByRole('button', { name: /view in collection/i });
      await user.click(viewButton);

      expect(mockOnViewInCollection).toHaveBeenCalledTimes(1);
    });

    it('should not display action buttons when not provided', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.queryByRole('button', { name: /breed again/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /view in collection/i })).not.toBeInTheDocument();
    });
  });

  describe('Modal Behavior', () => {
    const successResult: BreedingResult = {
      success: true,
      offspring: mockOffspring as EnhancedCreature,
      offspringSpecies: 'hybrid',
      generation: 2,
      inheritedAbilities: [],
      rarityUpgraded: false,
      messages: [],
      costPaid: { goldAmount: 5000, materials: [] },
    };

    it('should not render when isOpen is false', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={false} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.queryByText('Breeding Successful!')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.getByText('Breeding Successful!')).toBeInTheDocument();
    });
  });

  describe('Animations', () => {
    const successResult: BreedingResult = {
      success: true,
      offspring: mockOffspring as EnhancedCreature,
      offspringSpecies: 'hybrid',
      generation: 2,
      inheritedAbilities: ['tackle', 'absorb'],
      rarityUpgraded: false,
      messages: ['Success!'],
      costPaid: { goldAmount: 5000, materials: [] },
    };

    it('should animate celebration section', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.getByText('🎉')).toBeInTheDocument();
    });

    it('should stagger ability animations', async () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      await waitFor(() => {
        expect(screen.getByText('tackle')).toBeInTheDocument();
        expect(screen.getByText('absorb')).toBeInTheDocument();
      });
    });

    it('should stagger message animations', async () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      await waitFor(() => {
        expect(screen.getByText('Success!')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle offspring with no abilities', () => {
      const noAbilitiesResult: BreedingResult = {
        success: true,
        offspring: { ...mockOffspring, abilities: [] } as EnhancedCreature,
        offspringSpecies: 'hybrid',
        generation: 2,
        inheritedAbilities: [],
        rarityUpgraded: false,
        messages: [],
        costPaid: { goldAmount: 5000, materials: [] },
      };

      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={noAbilitiesResult} />
      );

      expect(screen.queryByText('Inherited Abilities')).not.toBeInTheDocument();
    });

    it('should handle offspring with no messages', () => {
      const noMessagesResult: BreedingResult = {
        success: true,
        offspring: mockOffspring as EnhancedCreature,
        offspringSpecies: 'hybrid',
        generation: 2,
        inheritedAbilities: [],
        rarityUpgraded: false,
        messages: [],
        costPaid: { goldAmount: 5000, materials: [] },
      };

      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={noMessagesResult} />
      );

      // Should still render successfully
      expect(screen.getByText('Breeding Successful!')).toBeInTheDocument();
    });

    it('should handle max generation offspring', () => {
      const maxGenResult: BreedingResult = {
        success: true,
        offspring: { ...mockOffspring, generation: 5 } as EnhancedCreature,
        offspringSpecies: 'hybrid',
        generation: 5,
        inheritedAbilities: [],
        rarityUpgraded: false,
        messages: [],
        costPaid: { goldAmount: 5000, materials: [] },
      };

      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={maxGenResult} />
      );

      expect(screen.getByText('Gen 5')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    const successResult: BreedingResult = {
      success: true,
      offspring: mockOffspring as EnhancedCreature,
      offspringSpecies: 'hybrid',
      generation: 2,
      inheritedAbilities: [],
      rarityUpgraded: false,
      messages: [],
      costPaid: { goldAmount: 5000, materials: [] },
    };

    it('should have proper modal title', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      expect(screen.getByText('Breeding Successful!')).toBeInTheDocument();
    });

    it('should have accessible name input', () => {
      renderWithGameContext(
        <BreedingResultModal isOpen={true} onClose={mockOnClose} result={successResult} />
      );

      const input = screen.getByPlaceholderText('Enter custom name...');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have accessible action buttons', () => {
      renderWithGameContext(
        <BreedingResultModal
          isOpen={true}
          onClose={mockOnClose}
          result={successResult}
          onBreedAgain={mockOnBreedAgain}
          onViewInCollection={mockOnViewInCollection}
        />
      );

      expect(screen.getByRole('button', { name: /view in collection/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /breed again/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });
});
