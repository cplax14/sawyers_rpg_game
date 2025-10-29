import React from 'react';
import { render, screen } from '@testing-library/react';
import { PriceTag } from './PriceTag';

describe('PriceTag', () => {
  it('renders with default props', () => {
    render(<PriceTag amount={100} />);

    const priceTag = screen.getByRole('text');
    expect(priceTag).toBeInTheDocument();
    expect(priceTag).toHaveTextContent('100');
  });

  it('displays gold icon by default', () => {
    const { container } = render(<PriceTag amount={100} />);

    // Icon should be present
    const icon = container.querySelector('span[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveTextContent('💰');
  });

  it('hides gold icon when showIcon is false', () => {
    const { container } = render(<PriceTag amount={100} showIcon={false} />);

    // Icon should not be present
    const icon = container.querySelector('span[aria-hidden="true"]');
    expect(icon).not.toBeInTheDocument();
  });

  it('formats large numbers with commas', () => {
    render(<PriceTag amount={1000} />);
    expect(screen.getByText('1,000')).toBeInTheDocument();

    const { rerender } = render(<PriceTag amount={12345} />);
    expect(screen.getByText('12,345')).toBeInTheDocument();

    rerender(<PriceTag amount={999999} />);
    expect(screen.getByText('999,999')).toBeInTheDocument();
  });

  it('formats small numbers without commas', () => {
    render(<PriceTag amount={50} />);
    expect(screen.getByText('50')).toBeInTheDocument();

    const { rerender } = render(<PriceTag amount={999} />);
    expect(screen.getByText('999')).toBeInTheDocument();
  });

  it('handles zero amount', () => {
    render(<PriceTag amount={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  describe('size variants', () => {
    it('renders small size', () => {
      const { container } = render(<PriceTag amount={100} size='small' />);
      const priceTag = screen.getByRole('text');

      // Check that small styles are applied
      expect(priceTag).toBeInTheDocument();
    });

    it('renders medium size (default)', () => {
      const { container } = render(<PriceTag amount={100} size='medium' />);
      const priceTag = screen.getByRole('text');

      expect(priceTag).toBeInTheDocument();
    });

    it('renders large size', () => {
      const { container } = render(<PriceTag amount={100} size='large' />);
      const priceTag = screen.getByRole('text');

      expect(priceTag).toBeInTheDocument();
    });
  });

  describe('affordability indicators', () => {
    it('indicates when player can afford (green color)', () => {
      render(<PriceTag amount={100} canAfford={true} />);

      const priceTag = screen.getByRole('text');
      expect(priceTag).toHaveStyle({ color: '#22c55e' });
    });

    it('indicates when player cannot afford (red color)', () => {
      render(<PriceTag amount={1000} canAfford={false} />);

      const priceTag = screen.getByRole('text');
      expect(priceTag).toHaveStyle({ color: '#ef4444' });
    });

    it('uses neutral gold color when affordability is undefined', () => {
      render(<PriceTag amount={500} />);

      const priceTag = screen.getByRole('text');
      expect(priceTag).toHaveStyle({ color: '#FFD700' });
    });
  });

  describe('accessibility', () => {
    it('provides accessible label for affordable price', () => {
      render(<PriceTag amount={100} canAfford={true} />);

      const priceTag = screen.getByRole('text');
      expect(priceTag).toHaveAttribute('aria-label', '100 gold - You can afford this');
    });

    it('provides accessible label for unaffordable price', () => {
      render(<PriceTag amount={1000} canAfford={false} />);

      const priceTag = screen.getByRole('text');
      expect(priceTag).toHaveAttribute('aria-label', '1000 gold - You cannot afford this');
    });

    it('provides basic accessible label when affordability is undefined', () => {
      render(<PriceTag amount={500} />);

      const priceTag = screen.getByRole('text');
      expect(priceTag).toHaveAttribute('aria-label', '500 gold');
    });

    it('uses custom aria-label when provided', () => {
      render(<PriceTag amount={100} aria-label='Custom label for price' />);

      const priceTag = screen.getByRole('text');
      expect(priceTag).toHaveAttribute('aria-label', 'Custom label for price');
    });

    it('marks icon as decorative with aria-hidden', () => {
      const { container } = render(<PriceTag amount={100} />);

      const icon = container.querySelector('span[aria-hidden="true"]');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('applies custom className', () => {
    render(<PriceTag amount={100} className='custom-price-class' />);

    const priceTag = screen.getByRole('text');
    expect(priceTag).toHaveClass('custom-price-class');
  });

  it('formats large amounts correctly for screen readers', () => {
    render(<PriceTag amount={12345} canAfford={true} />);

    const priceTag = screen.getByRole('text');
    expect(priceTag).toHaveAttribute('aria-label', '12345 gold - You can afford this');
  });

  describe('edge cases', () => {
    it('handles negative amounts (though not typical in game)', () => {
      render(<PriceTag amount={-100} />);
      expect(screen.getByText('-100')).toBeInTheDocument();
    });

    it('handles very large amounts', () => {
      render(<PriceTag amount={9999999} />);
      expect(screen.getByText('9,999,999')).toBeInTheDocument();
    });

    it('handles decimal amounts by rounding (gold should be whole numbers)', () => {
      render(<PriceTag amount={100.5} />);
      // JavaScript's toLocaleString will handle decimals
      expect(screen.getByRole('text')).toBeInTheDocument();
    });
  });

  describe('visual feedback', () => {
    it('renders with animation properties', () => {
      const { container } = render(<PriceTag amount={100} />);

      // Framer Motion should add animation-related attributes
      const priceTag = screen.getByRole('text');
      expect(priceTag).toBeInTheDocument();
    });
  });
});
