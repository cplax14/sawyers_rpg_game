import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShopCategoryFilter } from './ShopCategoryFilter';

describe('ShopCategoryFilter', () => {
  const mockCategories = ['all', 'weapons', 'armor', 'consumables'];
  const mockOnCategoryChange = jest.fn();

  beforeEach(() => {
    mockOnCategoryChange.mockClear();
  });

  it('renders all provided categories', () => {
    render(
      <ShopCategoryFilter
        categories={mockCategories}
        activeCategory='all'
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByRole('tab', { name: /filter by all items/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /filter by weapons/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /filter by armor/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /filter by consumables/i })).toBeInTheDocument();
  });

  it('displays category names correctly', () => {
    render(
      <ShopCategoryFilter
        categories={mockCategories}
        activeCategory='all'
        onCategoryChange={mockOnCategoryChange}
      />
    );

    expect(screen.getByText('All Items')).toBeInTheDocument();
    expect(screen.getByText('Weapons')).toBeInTheDocument();
    expect(screen.getByText('Armor')).toBeInTheDocument();
    expect(screen.getByText('Consumables')).toBeInTheDocument();
  });

  it('displays category icons', () => {
    render(
      <ShopCategoryFilter
        categories={mockCategories}
        activeCategory='all'
        onCategoryChange={mockOnCategoryChange}
      />
    );

    // Icons should be present (they're emoji text)
    expect(screen.getByText('🌟')).toBeInTheDocument(); // All
    expect(screen.getByText('⚔️')).toBeInTheDocument(); // Weapons
    expect(screen.getByText('🛡️')).toBeInTheDocument(); // Armor
    expect(screen.getByText('🧪')).toBeInTheDocument(); // Consumables
  });

  describe('active state', () => {
    it('marks active category with aria-selected', () => {
      render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='weapons'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const weaponsTab = screen.getByRole('tab', { name: /filter by weapons/i });
      expect(weaponsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('marks inactive categories without aria-selected', () => {
      render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='weapons'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const allTab = screen.getByRole('tab', { name: /filter by all items/i });
      expect(allTab).toHaveAttribute('aria-selected', 'false');
    });

    it('updates active state when activeCategory prop changes', () => {
      const { rerender } = render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      let allTab = screen.getByRole('tab', { name: /filter by all items/i });
      expect(allTab).toHaveAttribute('aria-selected', 'true');

      rerender(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='weapons'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      allTab = screen.getByRole('tab', { name: /filter by all items/i });
      const weaponsTab = screen.getByRole('tab', { name: /filter by weapons/i });

      expect(allTab).toHaveAttribute('aria-selected', 'false');
      expect(weaponsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('category selection', () => {
    it('calls onCategoryChange when category is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const weaponsTab = screen.getByRole('tab', { name: /filter by weapons/i });
      await user.click(weaponsTab);

      expect(mockOnCategoryChange).toHaveBeenCalledWith('weapons');
      expect(mockOnCategoryChange).toHaveBeenCalledTimes(1);
    });

    it('calls onCategoryChange with correct category for each button', async () => {
      const user = userEvent.setup();
      render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const allTab = screen.getByRole('tab', { name: /filter by all items/i });
      const weaponsTab = screen.getByRole('tab', { name: /filter by weapons/i });
      const armorTab = screen.getByRole('tab', { name: /filter by armor/i });

      await user.click(allTab);
      expect(mockOnCategoryChange).toHaveBeenLastCalledWith('all');

      await user.click(weaponsTab);
      expect(mockOnCategoryChange).toHaveBeenLastCalledWith('weapons');

      await user.click(armorTab);
      expect(mockOnCategoryChange).toHaveBeenLastCalledWith('armor');
    });

    it('allows clicking active category again', async () => {
      const user = userEvent.setup();
      render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='weapons'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const weaponsTab = screen.getByRole('tab', { name: /filter by weapons/i });
      await user.click(weaponsTab);

      expect(mockOnCategoryChange).toHaveBeenCalledWith('weapons');
    });
  });

  describe('accessibility', () => {
    it('provides tablist role for the container', () => {
      render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
    });

    it('provides accessible label for tablist', () => {
      render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const tablist = screen.getByRole('tablist', { name: /filter items by category/i });
      expect(tablist).toBeInTheDocument();
    });

    it('provides aria-controls for each tab', () => {
      render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const weaponsTab = screen.getByRole('tab', { name: /filter by weapons/i });
      expect(weaponsTab).toHaveAttribute('aria-controls', 'weapons-panel');
    });

    it('provides clear aria-label for each category', () => {
      render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      expect(screen.getByRole('tab', { name: /filter by all items/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /filter by weapons/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /filter by armor/i })).toBeInTheDocument();
    });

    it('marks icons as decorative with aria-hidden', () => {
      const { container } = render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const iconSpans = container.querySelectorAll('span[aria-hidden="true"]');
      expect(iconSpans.length).toBeGreaterThan(0);
    });
  });

  describe('different category sets', () => {
    it('handles minimal category set', () => {
      render(
        <ShopCategoryFilter
          categories={['all']}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      expect(screen.getByRole('tab', { name: /filter by all items/i })).toBeInTheDocument();
    });

    it('handles extended category set', () => {
      const extendedCategories = [
        'all',
        'weapons',
        'armor',
        'consumables',
        'materials',
        'magic',
        'accessories',
      ];

      render(
        <ShopCategoryFilter
          categories={extendedCategories}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      expect(screen.getByRole('tab', { name: /filter by magic items/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /filter by accessories/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /filter by materials/i })).toBeInTheDocument();
    });

    it('handles custom/unknown categories', () => {
      render(
        <ShopCategoryFilter
          categories={['all', 'custom-category']}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      // Custom categories should still render
      expect(screen.getByText('custom-category')).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('supports keyboard interaction via button element', async () => {
      const user = userEvent.setup();
      render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      const weaponsTab = screen.getByRole('tab', { name: /filter by weapons/i });

      // Focus and press Enter
      weaponsTab.focus();
      await user.keyboard('{Enter}');

      expect(mockOnCategoryChange).toHaveBeenCalledWith('weapons');
    });
  });

  it('applies custom className', () => {
    render(
      <ShopCategoryFilter
        categories={mockCategories}
        activeCategory='all'
        onCategoryChange={mockOnCategoryChange}
        className='custom-filter-class'
      />
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveClass('custom-filter-class');
  });

  describe('visual feedback', () => {
    it('renders all category buttons as motion components', () => {
      const { container } = render(
        <ShopCategoryFilter
          categories={mockCategories}
          activeCategory='all'
          onCategoryChange={mockOnCategoryChange}
        />
      );

      // Framer Motion adds attributes to animated components
      const tabs = screen.getAllByRole('tab');
      expect(tabs.length).toBe(mockCategories.length);
    });
  });
});
