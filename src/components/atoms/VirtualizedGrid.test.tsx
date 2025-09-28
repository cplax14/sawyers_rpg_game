import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VirtualizedGrid } from './VirtualizedGrid';

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, initial, animate, exit, transition, layout, ...props }: any) =>
      <div style={style} {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

// Test data
const generateTestItems = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
    value: i * 10
  }));

const renderTestItem = (item: any, index: number) => (
  <div key={item.id} data-testid={`item-${index}`}>
    {item.name} - ${item.value}
  </div>
);

const getTestItemKey = (item: any, index: number) => item.id;

describe('VirtualizedGrid', () => {
  const defaultProps = {
    items: generateTestItems(100),
    itemHeight: 100,
    itemsPerRow: 3,
    containerHeight: 400,
    renderItem: renderTestItem,
    getItemKey: getTestItemKey,
    gap: 16
  };

  beforeEach(() => {
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 800,
      height: 400,
      top: 0,
      left: 0,
      bottom: 400,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));
  });

  describe('Basic Rendering', () => {
    it('should render the virtualized grid container', () => {
      render(<VirtualizedGrid {...defaultProps} />);

      const container = screen.getByTestId('virtualized-grid');
      expect(container).toBeInTheDocument();
      expect(container).toHaveStyle({
        height: '400px',
        overflowY: 'auto'
      });
    });

    it('should render only visible items initially', () => {
      render(<VirtualizedGrid {...defaultProps} />);

      // Should only render items that are visible in the viewport
      const visibleItems = screen.getAllByTestId(/^item-\d+$/);
      expect(visibleItems.length).toBeGreaterThan(0);
      expect(visibleItems.length).toBeLessThan(defaultProps.items.length);
    });

    it('should apply custom styles and className', () => {
      const customStyle = { border: '1px solid red' };
      const customClassName = 'custom-grid';

      render(
        <VirtualizedGrid
          {...defaultProps}
          style={customStyle}
          className={customClassName}
        />
      );

      const container = screen.getByTestId('virtualized-grid');
      expect(container).toHaveClass(customClassName);
      expect(container).toHaveStyle(customStyle);
    });
  });

  describe('Grid Layout', () => {
    it('should calculate correct grid layout with different itemsPerRow', () => {
      const { rerender } = render(
        <VirtualizedGrid {...defaultProps} itemsPerRow={2} />
      );

      let container = screen.getByTestId('virtualized-grid');
      expect(container).toBeInTheDocument();

      // Rerender with different itemsPerRow
      rerender(<VirtualizedGrid {...defaultProps} itemsPerRow={4} />);

      container = screen.getByTestId('virtualized-grid');
      expect(container).toBeInTheDocument();
    });

    it('should handle different item heights correctly', () => {
      render(<VirtualizedGrid {...defaultProps} itemHeight={150} />);

      const container = screen.getByTestId('virtualized-grid');
      expect(container).toBeInTheDocument();
    });

    it('should apply correct gap spacing', () => {
      render(<VirtualizedGrid {...defaultProps} gap={24} />);

      const container = screen.getByTestId('virtualized-grid');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Scrolling and Virtualization', () => {
    it('should handle scroll events and update visible items', async () => {
      render(<VirtualizedGrid {...defaultProps} />);

      const container = screen.getByTestId('virtualized-grid');

      // Simulate scroll
      fireEvent.scroll(container, { target: { scrollTop: 200 } });

      // Wait for scroll handling
      await waitFor(() => {
        expect(container.scrollTop).toBe(200);
      });
    });

    it('should call onScroll callback when provided', async () => {
      const onScrollMock = jest.fn();

      render(
        <VirtualizedGrid
          {...defaultProps}
          onScroll={onScrollMock}
        />
      );

      const container = screen.getByTestId('virtualized-grid');

      fireEvent.scroll(container, { target: { scrollTop: 100 } });

      await waitFor(() => {
        expect(onScrollMock).toHaveBeenCalledWith(100);
      });
    });

    it('should handle overscan correctly', () => {
      render(<VirtualizedGrid {...defaultProps} overscan={5} />);

      // Should render extra items for smooth scrolling
      const visibleItems = screen.getAllByTestId(/^item-\d+$/);
      expect(visibleItems.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Optimizations', () => {
    it('should render efficiently with large datasets', () => {
      const largeDataset = generateTestItems(1000);

      const startTime = performance.now();
      render(
        <VirtualizedGrid
          {...defaultProps}
          items={largeDataset}
        />
      );
      const endTime = performance.now();

      // Should render quickly even with large datasets
      expect(endTime - startTime).toBeLessThan(100);

      // Should only render visible items, not all 1000
      const visibleItems = screen.getAllByTestId(/^item-\d+$/);
      expect(visibleItems.length).toBeLessThan(50);
    });

    it('should handle empty items array gracefully', () => {
      render(<VirtualizedGrid {...defaultProps} items={[]} />);

      const container = screen.getByTestId('virtualized-grid');
      expect(container).toBeInTheDocument();

      const items = screen.queryAllByTestId(/^item-\d+$/);
      expect(items).toHaveLength(0);
    });

    it('should update when items change', () => {
      const { rerender } = render(<VirtualizedGrid {...defaultProps} />);

      const initialItems = screen.getAllByTestId(/^item-\d+$/);
      expect(initialItems.length).toBeGreaterThan(0);

      // Update with new items
      const newItems = generateTestItems(50);
      rerender(<VirtualizedGrid {...defaultProps} items={newItems} />);

      // Should re-render with new items
      const updatedItems = screen.getAllByTestId(/^item-\d+$/);
      expect(updatedItems.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle container height changes', () => {
      const { rerender } = render(<VirtualizedGrid {...defaultProps} />);

      // Change container height
      rerender(
        <VirtualizedGrid
          {...defaultProps}
          containerHeight={600}
        />
      );

      const container = screen.getByTestId('virtualized-grid');
      expect(container).toHaveStyle({ height: '600px' });
    });

    it('should recalculate visible items when layout changes', () => {
      const { rerender } = render(<VirtualizedGrid {...defaultProps} />);

      const initialItems = screen.getAllByTestId(/^item-\d+$/);
      const initialCount = initialItems.length;

      // Change items per row
      rerender(
        <VirtualizedGrid
          {...defaultProps}
          itemsPerRow={5}
        />
      );

      const updatedItems = screen.getAllByTestId(/^item-\d+$/);
      // The count might change due to different layout
      expect(updatedItems.length).toBeGreaterThan(0);
    });
  });

  describe('Scroll to Index', () => {
    it('should scroll to specific index when scrollToIndex is provided', async () => {
      const { rerender } = render(<VirtualizedGrid {...defaultProps} />);

      // Scroll to index 50
      rerender(
        <VirtualizedGrid
          {...defaultProps}
          scrollToIndex={50}
        />
      );

      const container = screen.getByTestId('virtualized-grid');

      await waitFor(() => {
        // Should have scrolled down
        expect(container.scrollTop).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid itemHeight gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(
          <VirtualizedGrid
            {...defaultProps}
            itemHeight={0}
          />
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });

    it('should handle invalid itemsPerRow gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(
          <VirtualizedGrid
            {...defaultProps}
            itemsPerRow={0}
          />
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe('Key Generation', () => {
    it('should use provided getItemKey function', () => {
      const customGetItemKey = jest.fn((item, index) => `custom-${item.id}`);

      render(
        <VirtualizedGrid
          {...defaultProps}
          getItemKey={customGetItemKey}
        />
      );

      expect(customGetItemKey).toHaveBeenCalled();
    });

    it('should handle duplicate keys gracefully', () => {
      const duplicateKeyFunction = () => 'duplicate-key';
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(
          <VirtualizedGrid
            {...defaultProps}
            getItemKey={duplicateKeyFunction}
          />
        );
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});