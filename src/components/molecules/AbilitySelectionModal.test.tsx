/**
 * Tests for AbilitySelectionModal Component
 *
 * Tests ability selection UI for Task 10.0:
 * - Ability slot calculations
 * - Selection validation
 * - Maximum selection limits
 * - Inherited vs natural ability display
 * - User interactions
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AbilitySelectionModal } from './AbilitySelectionModal';
import { Ability } from '../../types/game';

// =============================================================================
// MOCK DATA
// =============================================================================

const createMockAbility = (id: string, name: string, overrides: Partial<Ability> = {}): Ability => ({
  id,
  name,
  description: `${name} description`,
  cost: 20,
  power: 50,
  accuracy: 90,
  type: 'attack',
  element: 'neutral',
  target: 'single',
  effects: [],
  cooldown: 0,
  level: 1,
  ...overrides
});

const mockInheritedAbilities: Ability[] = [
  createMockAbility('fireball', 'Fireball', { element: 'fire', cost: 25 }),
  createMockAbility('ice_blast', 'Ice Blast', { element: 'ice', cost: 20 }),
  createMockAbility('thunder', 'Thunder', { element: 'electric', cost: 30 })
];

const mockNaturalAbilities: Ability[] = [
  createMockAbility('slash', 'Slash', { cost: 10 }),
  createMockAbility('guard', 'Guard', { type: 'defense', cost: 5 })
];

// =============================================================================
// ABILITY SLOT TESTS
// =============================================================================

describe('AbilitySelectionModal - Ability Slots', () => {
  it('should display correct base slots for Gen 0', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={mockNaturalAbilities}
        generation={0}
      />
    );

    // Gen 0: 4 base slots, 0 bonus = 4 total
    const slotsText = screen.getByText(/4 ability slots/);
    expect(slotsText).toBeInTheDocument();
  });

  it('should display correct slots for Gen 1 with bonus', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={mockNaturalAbilities}
        generation={1}
      />
    );

    // Gen 1: 4 base + 1 bonus = 5 total
    const slotsText = screen.getByText(/5 ability slots/);
    expect(slotsText).toBeInTheDocument();
  });

  it('should display base and bonus slot breakdown', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={mockNaturalAbilities}
        generation={3}
      />
    );

    // Gen 3: 4 base + 3 bonus = 7 total
    const breakdownText = screen.getByText(/4 base \+ 3 bonus from Gen 3/);
    expect(breakdownText).toBeInTheDocument();
  });

  it('should display correct slots for Gen 5 (max generation)', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={mockNaturalAbilities}
        generation={5}
      />
    );

    // Gen 5: 4 base + 5 bonus = 9 total
    const slotsText = screen.getByText(/9 ability slots/);
    expect(slotsText).toBeInTheDocument();
  });

  it('should respect custom maxSelection prop', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={mockNaturalAbilities}
        generation={3}
        maxSelection={3}
      />
    );

    // Custom max overrides generation calculation
    const slotsText = screen.getByText(/3 ability slots/);
    expect(slotsText).toBeInTheDocument();
  });
});

// =============================================================================
// ABILITY DISPLAY TESTS
// =============================================================================

describe('AbilitySelectionModal - Ability Display', () => {
  it('should display inherited abilities section', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    const sectionTitle = screen.getByText(/Inherited Abilities \(3\)/);
    expect(sectionTitle).toBeInTheDocument();
  });

  it('should display natural abilities section', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={[]}
        naturalAbilities={mockNaturalAbilities}
        generation={0}
      />
    );

    const sectionTitle = screen.getByText(/Natural Abilities \(2\)/);
    expect(sectionTitle).toBeInTheDocument();
  });

  it('should display all inherited ability names', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.getByText('Ice Blast')).toBeInTheDocument();
    expect(screen.getByText('Thunder')).toBeInTheDocument();
  });

  it('should display all natural ability names', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={[]}
        naturalAbilities={mockNaturalAbilities}
        generation={0}
      />
    );

    expect(screen.getByText('Slash')).toBeInTheDocument();
    expect(screen.getByText('Guard')).toBeInTheDocument();
  });

  it('should show inherited badge for inherited abilities', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    const inheritedBadges = screen.getAllByText('Inherited');
    expect(inheritedBadges).toHaveLength(3);
  });

  it('should display ability MP costs', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    expect(screen.getByText('25 MP')).toBeInTheDocument(); // Fireball
    expect(screen.getByText('20 MP')).toBeInTheDocument(); // Ice Blast
    expect(screen.getByText('30 MP')).toBeInTheDocument(); // Thunder
  });

  it('should not display inherited section when no inherited abilities', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={[]}
        naturalAbilities={mockNaturalAbilities}
        generation={0}
      />
    );

    const inheritedSection = screen.queryByText(/Inherited Abilities/);
    expect(inheritedSection).not.toBeInTheDocument();
  });

  it('should not display natural section when no natural abilities', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    const naturalSection = screen.queryByText(/Natural Abilities/);
    expect(naturalSection).not.toBeInTheDocument();
  });
});

// =============================================================================
// SELECTION INTERACTION TESTS
// =============================================================================

describe('AbilitySelectionModal - Selection Interaction', () => {
  it('should allow selecting an ability', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    // Initially 0 selected
    expect(screen.getByText(/Selected: 0 \/ 5/)).toBeInTheDocument();

    // Click on Fireball
    const fireballCard = screen.getByText('Fireball').closest('div');
    fireEvent.click(fireballCard!);

    // Should now show 1 selected
    expect(screen.getByText(/Selected: 1 \/ 5/)).toBeInTheDocument();
  });

  it('should allow deselecting an ability', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    // Select Fireball
    const fireballCard = screen.getByText('Fireball').closest('div');
    fireEvent.click(fireballCard!);
    expect(screen.getByText(/Selected: 1 \/ 5/)).toBeInTheDocument();

    // Deselect Fireball
    fireEvent.click(fireballCard!);
    expect(screen.getByText(/Selected: 0 \/ 5/)).toBeInTheDocument();
  });

  it('should allow selecting multiple abilities', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    // Select three abilities
    const fireballCard = screen.getByText('Fireball').closest('div');
    const iceBlastCard = screen.getByText('Ice Blast').closest('div');
    const thunderCard = screen.getByText('Thunder').closest('div');

    fireEvent.click(fireballCard!);
    fireEvent.click(iceBlastCard!);
    fireEvent.click(thunderCard!);

    expect(screen.getByText(/Selected: 3 \/ 5/)).toBeInTheDocument();
  });

  it('should prevent selecting more than max abilities', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={mockNaturalAbilities}
        generation={0}
        maxSelection={2}
      />
    );

    // Select 2 abilities (max)
    const fireballCard = screen.getByText('Fireball').closest('div');
    const iceBlastCard = screen.getByText('Ice Blast').closest('div');
    const thunderCard = screen.getByText('Thunder').closest('div');

    fireEvent.click(fireballCard!);
    fireEvent.click(iceBlastCard!);

    expect(screen.getByText(/Selected: 2 \/ 2/)).toBeInTheDocument();

    // Try to select a third (should not work)
    fireEvent.click(thunderCard!);

    // Should still be 2 selected
    expect(screen.getByText(/Selected: 2 \/ 2/)).toBeInTheDocument();
  });

  it('should show selected checkmark on selected abilities', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    const fireballCard = screen.getByText('Fireball').closest('div');
    fireEvent.click(fireballCard!);

    const checkmarks = screen.getAllByText(/✓ Selected/);
    expect(checkmarks.length).toBeGreaterThanOrEqual(1);
  });
});

// =============================================================================
// WARNING AND VALIDATION TESTS
// =============================================================================

describe('AbilitySelectionModal - Warnings and Validation', () => {
  it('should show warning when more abilities than slots', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={mockNaturalAbilities}
        generation={0}
        maxSelection={3}
      />
    );

    // 5 total abilities, but only 3 slots
    const warning = screen.getByText(/has inherited 5 potential abilities/);
    expect(warning).toBeInTheDocument();
  });

  it('should not show warning when abilities fit in slots', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={[mockInheritedAbilities[0]]}
        naturalAbilities={[mockNaturalAbilities[0]]}
        generation={1}
      />
    );

    // 2 abilities, 5 slots available
    const warning = screen.queryByText(/has inherited/);
    expect(warning).not.toBeInTheDocument();
  });
});

// =============================================================================
// CONFIRM AND CANCEL TESTS
// =============================================================================

describe('AbilitySelectionModal - Confirm and Cancel', () => {
  it('should call onConfirm with selected abilities when confirm clicked', () => {
    const onConfirm = jest.fn();

    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={onConfirm}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    // Select Fireball and Ice Blast
    const fireballCard = screen.getByText('Fireball').closest('div');
    const iceBlastCard = screen.getByText('Ice Blast').closest('div');

    fireEvent.click(fireballCard!);
    fireEvent.click(iceBlastCard!);

    // Click confirm
    const confirmButton = screen.getByText(/Confirm/);
    fireEvent.click(confirmButton);

    // Should call onConfirm with selected ability IDs
    expect(onConfirm).toHaveBeenCalledWith(['fireball', 'ice_blast']);
  });

  it('should not call onConfirm when no abilities selected', () => {
    const onConfirm = jest.fn();

    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={onConfirm}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    const confirmButton = screen.getByText(/Confirm/);
    fireEvent.click(confirmButton);

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should call onClose when cancel clicked', () => {
    const onClose = jest.fn();

    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={onClose}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    const cancelButton = screen.getByText(/Cancel/);
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('should reset selection when cancelled', () => {
    const onClose = jest.fn();

    const { rerender } = render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={onClose}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    // Select an ability
    const fireballCard = screen.getByText('Fireball').closest('div');
    fireEvent.click(fireballCard!);

    expect(screen.getByText(/Selected: 1 \/ 5/)).toBeInTheDocument();

    // Cancel
    const cancelButton = screen.getByText(/Cancel/);
    fireEvent.click(cancelButton);

    // Reopen modal
    rerender(
      <AbilitySelectionModal
        isOpen={true}
        onClose={onClose}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    // Selection should be reset to 0
    expect(screen.getByText(/Selected: 0 \/ 5/)).toBeInTheDocument();
  });

  it('should close modal and reset selection after confirm', () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();

    const { rerender } = render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={onClose}
        onConfirm={onConfirm}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    // Select and confirm
    const fireballCard = screen.getByText('Fireball').closest('div');
    fireEvent.click(fireballCard!);

    const confirmButton = screen.getByText(/Confirm/);
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});

// =============================================================================
// MODAL DISPLAY TESTS
// =============================================================================

describe('AbilitySelectionModal - Modal Display', () => {
  it('should render when isOpen is true', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    const title = screen.getByText('Select Abilities');
    expect(title).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <AbilitySelectionModal
        isOpen={false}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    const title = screen.queryByText('Select Abilities');
    expect(title).not.toBeInTheDocument();
  });

  it('should display subtitle text', () => {
    render(
      <AbilitySelectionModal
        isOpen={true}
        onClose={jest.fn()}
        onConfirm={jest.fn()}
        inheritedAbilities={mockInheritedAbilities}
        naturalAbilities={[]}
        generation={1}
      />
    );

    const subtitle = screen.getByText(/Choose which abilities your offspring will learn/);
    expect(subtitle).toBeInTheDocument();
  });
});
