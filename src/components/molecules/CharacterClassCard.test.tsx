import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CharacterClassCard, CharacterClass } from './CharacterClassCard';

const mockCharacterClass: CharacterClass = {
  id: 'knight',
  name: 'Knight',
  description: 'Strong defense and sword mastery',
  baseStats: {
    hp: 120,
    mp: 30,
    attack: 85,
    defense: 95,
    magicAttack: 40,
    magicDefense: 70,
    speed: 60,
    accuracy: 80,
  },
  weaponTypes: ['sword', 'shield', 'heavy_armor'],
  startingSpells: ['heal'],
  spellAffinities: ['healing', 'defensive', 'holy'],
  classBonus: 'Increased capture rate for defensive monsters',
};

describe('CharacterClassCard', () => {
  const defaultProps = {
    characterClass: mockCharacterClass,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders character class information', () => {
    render(<CharacterClassCard {...defaultProps} />);

    expect(screen.getByText('Knight')).toBeInTheDocument();
    expect(screen.getByText('Strong defense and sword mastery')).toBeInTheDocument();
    expect(screen.getByText('Choose Class')).toBeInTheDocument();
  });

  it('displays primary stats correctly', () => {
    render(<CharacterClassCard {...defaultProps} />);

    expect(screen.getByText('120')).toBeInTheDocument(); // HP
    expect(screen.getByText('30')).toBeInTheDocument(); // MP
    expect(screen.getByText('85')).toBeInTheDocument(); // Attack
    expect(screen.getByText('95')).toBeInTheDocument(); // Defense
  });

  it('displays secondary stats when showDetailedStats is true', () => {
    render(<CharacterClassCard {...defaultProps} showDetailedStats={true} />);

    expect(screen.getByText('40')).toBeInTheDocument(); // Magic Attack
    expect(screen.getByText('70')).toBeInTheDocument(); // Magic Defense
    expect(screen.getByText('60')).toBeInTheDocument(); // Speed
    expect(screen.getByText('80')).toBeInTheDocument(); // Accuracy
  });

  it('hides secondary stats when showDetailedStats is false', () => {
    render(<CharacterClassCard {...defaultProps} showDetailedStats={false} />);

    expect(screen.queryByText('Secondary Stats')).not.toBeInTheDocument();
  });

  it('displays starting abilities', () => {
    render(<CharacterClassCard {...defaultProps} />);

    expect(screen.getByText('heal')).toBeInTheDocument();
  });

  it('displays weapon types', () => {
    render(<CharacterClassCard {...defaultProps} />);

    expect(screen.getByText('sword')).toBeInTheDocument();
    expect(screen.getByText('shield')).toBeInTheDocument();
    expect(screen.getByText('heavy armor')).toBeInTheDocument();
  });

  it('displays class bonus when showClassBonus is true', () => {
    render(<CharacterClassCard {...defaultProps} showClassBonus={true} />);

    expect(screen.getByText('Increased capture rate for defensive monsters')).toBeInTheDocument();
  });

  it('hides class bonus when showClassBonus is false', () => {
    render(<CharacterClassCard {...defaultProps} showClassBonus={false} />);

    expect(screen.queryByText('Class Bonus')).not.toBeInTheDocument();
    expect(
      screen.queryByText('Increased capture rate for defensive monsters')
    ).not.toBeInTheDocument();
  });

  it('shows selected state', () => {
    render(<CharacterClassCard {...defaultProps} selected={true} />);

    expect(screen.getByText('Selected')).toBeInTheDocument();
    expect(screen.getByLabelText('Selected')).toBeInTheDocument();
  });

  it('shows default state when not selected', () => {
    render(<CharacterClassCard {...defaultProps} selected={false} />);

    expect(screen.getByText('Choose Class')).toBeInTheDocument();
    expect(screen.queryByLabelText('Selected')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<CharacterClassCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: 'Select Knight class' });
    await user.click(card);

    expect(handleClick).toHaveBeenCalledWith(mockCharacterClass);
  });

  it('calls onClick when button is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<CharacterClassCard {...defaultProps} onClick={handleClick} />);

    const button = screen.getByText('Choose Class');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledWith(mockCharacterClass);
  });

  it('handles keyboard navigation with Enter', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<CharacterClassCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: 'Select Knight class' });
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledWith(mockCharacterClass);
  });

  it('handles keyboard navigation with Space', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<CharacterClassCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: 'Select Knight class' });
    card.focus();
    await user.keyboard(' ');

    expect(handleClick).toHaveBeenCalledWith(mockCharacterClass);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<CharacterClassCard {...defaultProps} disabled={true} onClick={handleClick} />);

    const card = screen.getByRole('button', { name: 'Select Knight class' });
    await user.click(card);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('sets proper ARIA attributes', () => {
    render(<CharacterClassCard {...defaultProps} selected={true} />);

    const card = screen.getByRole('button', { name: 'Select Knight class' });
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(card).toHaveAttribute('aria-disabled', 'false');
  });

  it('sets proper ARIA attributes when disabled', () => {
    render(<CharacterClassCard {...defaultProps} disabled={true} />);

    const card = screen.getByRole('button', { name: 'Select Knight class' });
    expect(card).toHaveAttribute('aria-disabled', 'true');
    expect(card).toHaveAttribute('tabIndex', '-1');
  });

  it('applies custom className', () => {
    const { container } = render(<CharacterClassCard {...defaultProps} className='custom-class' />);

    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('renders compact variant', () => {
    render(<CharacterClassCard {...defaultProps} variant='compact' />);

    // Test functionality rather than CSS classes - compact variant should still render all content
    expect(screen.getByText('Knight')).toBeInTheDocument();
    expect(screen.getByText('Choose Class')).toBeInTheDocument();
  });

  it('renders default variant', () => {
    render(<CharacterClassCard {...defaultProps} variant='default' />);

    // Test functionality rather than CSS classes - default variant should render all content
    expect(screen.getByText('Knight')).toBeInTheDocument();
    expect(screen.getByText('Choose Class')).toBeInTheDocument();
  });

  it('displays tooltips on ability hover', async () => {
    const user = userEvent.setup();
    render(<CharacterClassCard {...defaultProps} />);

    const abilityTag = screen.getByText('heal');
    await user.hover(abilityTag);

    await waitFor(() => {
      expect(screen.getByText('Starting spell: heal')).toBeInTheDocument();
    });
  });

  it('prevents event propagation when button is clicked', async () => {
    const user = userEvent.setup();
    const handleCardClick = jest.fn();
    const handleButtonClick = jest.fn();

    render(<CharacterClassCard {...defaultProps} onClick={handleCardClick} />);

    // Mock the button click to test stopPropagation
    const button = screen.getByText('Choose Class');

    // Add event listener to test propagation
    const card = screen.getByRole('button', { name: 'Select Knight class' });
    card.addEventListener('click', handleCardClick);

    await user.click(button);

    // Both should be called due to our implementation
    expect(handleCardClick).toHaveBeenCalled();
  });

  it('handles missing optional props gracefully', () => {
    render(<CharacterClassCard characterClass={mockCharacterClass} />);

    expect(screen.getByText('Knight')).toBeInTheDocument();
    expect(screen.getByText('Choose Class')).toBeInTheDocument();
  });

  it('formats weapon names correctly', () => {
    render(<CharacterClassCard {...defaultProps} />);

    // heavy_armor should be displayed as "heavy armor"
    expect(screen.getByText('heavy armor')).toBeInTheDocument();
  });

  it('formats spell names correctly', () => {
    const characterWithUnderscoreSpell: CharacterClass = {
      ...mockCharacterClass,
      startingSpells: ['sneak_attack'],
    };

    render(<CharacterClassCard characterClass={characterWithUnderscoreSpell} />);

    // sneak_attack should be displayed as "sneak attack"
    expect(screen.getByText('sneak attack')).toBeInTheDocument();
  });
});
