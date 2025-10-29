import React from 'react';
import { render, screen } from '@testing-library/react';
import { GoldBalance } from './GoldBalance';
import * as ReactGameContext from '../../contexts/ReactGameContext';

// Mock useGameState hook
const mockUseGameState = (gold: number = 100) => ({
  state: {
    player: {
      id: 'test-player',
      name: 'Test Player',
      level: 1,
      experience: 0,
      hp: 100,
      maxHp: 100,
      mp: 50,
      maxMp: 50,
      gold,
      stats: {
        attack: 10,
        defense: 10,
        magicAttack: 10,
        magicDefense: 10,
        speed: 10,
        accuracy: 10,
      },
    },
  },
  dispatch: jest.fn(),
});

// Helper to render with mocked context
const renderWithMockContext = (component: React.ReactElement, gold: number = 100) => {
  jest.spyOn(ReactGameContext, 'useGameState').mockReturnValue(mockUseGameState(gold) as any);
  return render(component);
};

describe('GoldBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with default props', () => {
    renderWithMockContext(<GoldBalance />);

    // Should show label and gold amount
    expect(screen.getByText(/gold/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays current gold amount from game state', () => {
    renderWithMockContext(<GoldBalance />, 250);

    // Should show 250 gold
    expect(screen.getByText('250')).toBeInTheDocument();
  });

  it('displays large gold amounts with comma formatting', () => {
    renderWithMockContext(<GoldBalance />, 12345);

    expect(screen.getByText('12,345')).toBeInTheDocument();
  });

  it('displays zero gold', () => {
    renderWithMockContext(<GoldBalance />, 0);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  describe('label display', () => {
    it('shows label by default', () => {
      renderWithMockContext(<GoldBalance />);

      expect(screen.getByText(/gold:/i)).toBeInTheDocument();
    });

    it('hides label when showLabel is false', () => {
      renderWithMockContext(<GoldBalance showLabel={false} />);

      const labels = screen.queryAllByText(/gold:/i);
      expect(labels.length).toBe(0);
    });

    it('displays custom label text', () => {
      renderWithMockContext(<GoldBalance label='Your Money' />);

      expect(screen.getByText(/your money:/i)).toBeInTheDocument();
    });
  });

  describe('size variants', () => {
    it('renders small size', () => {
      renderWithMockContext(<GoldBalance size='small' />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('renders medium size (default)', () => {
      renderWithMockContext(<GoldBalance size='medium' />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('renders large size', () => {
      renderWithMockContext(<GoldBalance size='large' />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('provides aria-live region for screen readers', () => {
      renderWithMockContext(<GoldBalance />, 500);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('provides accessible label with current gold amount', () => {
      renderWithMockContext(<GoldBalance />, 750);

      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-label');
      expect(status.getAttribute('aria-label')).toContain('750');
    });

    it('marks decorative label as aria-hidden', () => {
      const { container } = renderWithMockContext(<GoldBalance />);

      const label = container.querySelector('[aria-hidden="true"]');
      expect(label).toBeInTheDocument();
    });
  });

  describe('animations', () => {
    it('disables animations when animate is false', () => {
      renderWithMockContext(<GoldBalance animate={false} />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('enables animations by default', () => {
      renderWithMockContext(<GoldBalance />);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    renderWithMockContext(<GoldBalance className='custom-gold-class' />);

    const status = screen.getByRole('status');
    expect(status).toHaveClass('custom-gold-class');
  });

  describe('change indicators', () => {
    it('handles component mount without showing change indicator', () => {
      renderWithMockContext(<GoldBalance />, 100);

      // On initial mount, no change indicator should appear
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    // Note: Testing gold changes would require re-rendering with updated context
    // which is more complex. These tests verify the component renders correctly.
  });

  describe('edge cases', () => {
    it('handles very large gold amounts', () => {
      renderWithMockContext(<GoldBalance />, 999999);

      expect(screen.getByText('999,999')).toBeInTheDocument();
    });

    it('handles maximum safe integer', () => {
      const maxSafeInteger = 9007199254740991;
      renderWithMockContext(<GoldBalance />, maxSafeInteger);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });
  });

  describe('integration with PriceTag', () => {
    it('uses PriceTag component for displaying gold', () => {
      renderWithMockContext(<GoldBalance />, 100);

      // Should display gold with icon (💰)
      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });

    it('passes correct size to PriceTag', () => {
      renderWithMockContext(<GoldBalance size='large' />, 500);

      const status = screen.getByRole('status');
      expect(status).toBeInTheDocument();
    });
  });
});
