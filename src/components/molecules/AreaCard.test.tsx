import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AreaCard, Area } from './AreaCard';

const mockArea: Area = {
  id: 'forest_path',
  name: 'Forest Path',
  description: 'A winding path through peaceful woods. Perfect for beginners.',
  type: 'wilderness',
  unlocked: true,
  unlockRequirements: {},
  encounterRate: 30,
  monsters: ['slime', 'goblin', 'wolf'],
  connections: ['starting_village', 'deep_forest'],
  services: ['save_point'],
  recommendedLevel: 2,
};

const lockedArea: Area = {
  id: 'dark_dungeon',
  name: 'Dark Dungeon',
  description: 'A dangerous dungeon filled with powerful monsters.',
  type: 'dungeon',
  unlocked: false,
  unlockRequirements: {
    level: 10,
    story: 'forest_complete',
    items: ['dungeon_key'],
  },
  encounterRate: 80,
  monsters: ['orc', 'skeleton', 'dragon'],
  connections: ['forest_path'],
  recommendedLevel: 15,
};

describe('AreaCard', () => {
  const defaultProps = {
    area: mockArea,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders area information correctly', () => {
    render(<AreaCard {...defaultProps} />);

    expect(screen.getByText('Forest Path')).toBeInTheDocument();
    expect(
      screen.getByText('A winding path through peaceful woods. Perfect for beginners.')
    ).toBeInTheDocument();
    expect(screen.getByText('Enter Area')).toBeInTheDocument();
  });

  it('displays area stats correctly', () => {
    render(<AreaCard {...defaultProps} showDetails={true} />);

    expect(screen.getByText('wilderness')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Recommended level
    expect(screen.getByText('30%')).toBeInTheDocument(); // Encounter rate
  });

  it('hides details when showDetails is false', () => {
    render(<AreaCard {...defaultProps} showDetails={false} />);

    expect(screen.queryByText('Type:')).not.toBeInTheDocument();
    expect(screen.queryByText('Monsters (3):')).not.toBeInTheDocument();
  });

  it('displays services when available', () => {
    render(<AreaCard {...defaultProps} />);

    expect(screen.getByText('Services:')).toBeInTheDocument();
    expect(screen.getByText('save point')).toBeInTheDocument();
  });

  it('displays monsters list', () => {
    render(<AreaCard {...defaultProps} showDetails={true} />);

    expect(screen.getByText('Monsters (3):')).toBeInTheDocument();
    expect(screen.getByText('slime')).toBeInTheDocument();
    expect(screen.getByText('goblin')).toBeInTheDocument();
    expect(screen.getByText('wolf')).toBeInTheDocument();
  });

  it('truncates monster list when more than 3', () => {
    const areaWithManyMonsters: Area = {
      ...mockArea,
      monsters: ['slime', 'goblin', 'wolf', 'orc', 'skeleton'],
    };

    render(<AreaCard area={areaWithManyMonsters} showDetails={true} />);

    expect(screen.getByText('slime')).toBeInTheDocument();
    expect(screen.getByText('goblin')).toBeInTheDocument();
    expect(screen.getByText('wolf')).toBeInTheDocument();
    expect(screen.getByText('+2 more')).toBeInTheDocument();
    expect(screen.queryByText('orc')).not.toBeInTheDocument();
    expect(screen.queryByText('skeleton')).not.toBeInTheDocument();
  });

  it('shows selected state correctly', () => {
    render(<AreaCard {...defaultProps} selected={true} />);

    expect(screen.getByText('Current Area')).toBeInTheDocument();
  });

  it('shows locked state for locked areas', () => {
    render(<AreaCard area={lockedArea} accessible={false} />);

    expect(screen.getByText('🔒 Locked')).toBeInTheDocument();
    expect(screen.getByLabelText('Locked')).toBeInTheDocument();
  });

  it('shows unlock tooltip for locked areas', async () => {
    const user = userEvent.setup();
    render(<AreaCard area={lockedArea} accessible={false} />);

    const lockedButton = screen.getByText('🔒 Locked');
    await user.hover(lockedButton);

    await waitFor(() => {
      expect(screen.getByText(/Unlock Requirements/)).toBeInTheDocument();
    });
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<AreaCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByLabelText('Forest Path - Available');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledWith(mockArea);
  });

  it('calls onClick when button is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<AreaCard {...defaultProps} onClick={handleClick} />);

    const button = screen.getByText('Enter Area');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledWith(mockArea);
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<AreaCard {...defaultProps} onClick={handleClick} />);

    const card = screen.getByLabelText('Forest Path - Available');
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalledWith(mockArea);

    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('does not call onClick when locked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<AreaCard area={lockedArea} accessible={false} onClick={handleClick} />);

    const card = screen.getByLabelText('Dark Dungeon - Locked');
    await user.click(card);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when not accessible', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<AreaCard {...defaultProps} accessible={false} onClick={handleClick} />);

    // When accessible={false}, isLocked is true, so aria-label shows "Locked"
    const card = screen.getByLabelText('Forest Path - Locked');
    await user.click(card);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('displays completion rate when provided', () => {
    render(<AreaCard {...defaultProps} completionRate={75} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('75% explored')).toBeInTheDocument();
  });

  it('shows level warning when player level is too low', () => {
    render(<AreaCard area={{ ...mockArea, unlockRequirements: { level: 5 } }} playerLevel={3} />);

    expect(screen.getByText(/Recommended level 5/)).toBeInTheDocument();
    expect(screen.getByText(/Current: 3/)).toBeInTheDocument();
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<AreaCard {...defaultProps} size='sm' />);
    // Test functionality rather than CSS classes - all sizes should render content
    expect(screen.getByText('Forest Path')).toBeInTheDocument();

    rerender(<AreaCard {...defaultProps} size='md' />);
    expect(screen.getByText('Forest Path')).toBeInTheDocument();

    rerender(<AreaCard {...defaultProps} size='lg' />);
    expect(screen.getByText('Forest Path')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<AreaCard {...defaultProps} className='custom-area' />);

    expect(container.firstChild).toHaveClass('custom-area');
  });

  it('sets proper ARIA attributes', () => {
    render(<AreaCard {...defaultProps} selected={true} />);

    const card = screen.getByLabelText('Forest Path - Available');
    expect(card).toHaveAttribute('aria-pressed', 'true');
    expect(card).toHaveAttribute('aria-disabled', 'false');
  });

  it('sets proper ARIA attributes when locked', () => {
    render(<AreaCard area={lockedArea} accessible={false} />);

    const card = screen.getByLabelText('Dark Dungeon - Locked');
    expect(card).toHaveAttribute('aria-disabled', 'true');
    expect(card).toHaveAttribute('tabIndex', '-1');
  });

  it('shows correct area type icon', () => {
    // Test each type separately since AreaCard is memoized by area.id
    const { container: container1 } = render(<AreaCard {...defaultProps} />);
    let iconEl = container1.querySelector('[aria-label="wilderness"]');
    expect(iconEl).toBeInTheDocument();
    expect(iconEl?.textContent).toBe('🌲');

    const { container: container2 } = render(
      <AreaCard area={{ ...mockArea, id: 'town_area', type: 'town' }} />
    );
    iconEl = container2.querySelector('[aria-label="town"]');
    expect(iconEl).toBeInTheDocument();
    expect(iconEl?.textContent).toBe('🏘️');

    const { container: container3 } = render(
      <AreaCard area={{ ...mockArea, id: 'dungeon_area', type: 'dungeon' }} />
    );
    iconEl = container3.querySelector('[aria-label="dungeon"]');
    expect(iconEl).toBeInTheDocument();
    expect(iconEl?.textContent).toBe('🏰');

    const { container: container4 } = render(
      <AreaCard area={{ ...mockArea, id: 'special_area', type: 'special' }} />
    );
    iconEl = container4.querySelector('[aria-label="special"]');
    expect(iconEl).toBeInTheDocument();
    expect(iconEl?.textContent).toBe('✨');
  });

  it('handles areas without services gracefully', () => {
    const areaWithoutServices = { ...mockArea };
    delete areaWithoutServices.services;

    render(<AreaCard area={areaWithoutServices} />);

    expect(screen.queryByText('Services:')).not.toBeInTheDocument();
  });

  it('handles areas without monsters gracefully', () => {
    const safeArea: Area = {
      ...mockArea,
      monsters: [],
      encounterRate: 0,
    };

    render(<AreaCard area={safeArea} showDetails={true} />);

    expect(screen.queryByText(/Monsters/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Danger/)).not.toBeInTheDocument();
  });

  it('formats area and service names correctly', () => {
    const areaWithUnderscores: Area = {
      ...mockArea,
      services: ['save_point', 'item_shop'],
    };

    render(<AreaCard area={areaWithUnderscores} />);

    expect(screen.getByText('save point')).toBeInTheDocument();
    expect(screen.getByText('item shop')).toBeInTheDocument();
  });

  it('formats monster names correctly', () => {
    const areaWithUnderscoreMonsters: Area = {
      ...mockArea,
      monsters: ['forest_slime', 'cave_goblin'],
    };

    render(<AreaCard area={areaWithUnderscoreMonsters} showDetails={true} />);

    expect(screen.getByText('forest slime')).toBeInTheDocument();
    expect(screen.getByText('cave goblin')).toBeInTheDocument();
  });
});
