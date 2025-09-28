import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LazyVirtualizedGrid } from './LazyVirtualizedGrid';

// Mock hooks and components
jest.mock('../../hooks/useLazyLoading', () => ({
  useLazyLoading: jest.fn()
}));

jest.mock('../../hooks/useVirtualizedGrid', () => ({
  useVirtualizedGrid: jest.fn()
}));

jest.mock('../atoms/VirtualizedGrid', () => ({
  VirtualizedGrid: ({ items, renderItem, getItemKey }: any) => (
    <div data-testid="virtualized-grid">
      {items.slice(0, 10).map((item: any, index: number) => (
        <div key={getItemKey(item, index)} data-testid={`item-${index}`}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  )
}));

jest.mock('../atoms/SkeletonCard', () => ({
  SkeletonCard: ({ type }: any) => (
    <div data-testid={`skeleton-${type}`}>Loading...</div>
  )
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, style, initial, animate, exit, transition, ...props }: any) =>
      <div style={style} {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

import { useLazyLoading } from '../../hooks/useLazyLoading';
import { useVirtualizedGrid } from '../../hooks/useVirtualizedGrid';

const mockUseLazyLoading = useLazyLoading as jest.MockedFunction<typeof useLazyLoading>;
const mockUseVirtualizedGrid = useVirtualizedGrid as jest.MockedFunction<typeof useVirtualizedGrid>;

describe('LazyVirtualizedGrid', () => {
  const mockItems = Array.from({ length: 20 }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
    value: i * 10
  }));

  const mockLoadFunction = jest.fn().mockResolvedValue({
    items: mockItems.slice(0, 10),
    totalCount: mockItems.length,
    hasMore: true
  });

  const mockRenderItem = jest.fn((item, index) => (
    <div data-testid={`rendered-item-${index}`}>
      {item ? item.name : 'Loading...'}
    </div>
  ));

  const mockGetItemKey = jest.fn((item, index) => item ? item.id : `loading-${index}`);

  const defaultProps = {
    loadFunction: mockLoadFunction,
    renderItem: mockRenderItem,
    getItemKey: mockGetItemKey,
    itemHeight: 100,
    minItemWidth: 200,
    containerHeight: 500
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseLazyLoading.mockReturnValue({
      items: mockItems.slice(0, 10),
      loading: false,
      hasMore: true,
      totalCount: mockItems.length,
      loadMore: jest.fn(),
      getItem: jest.fn((index) => mockItems[index]),
      preloadAround: jest.fn(),
      isPageLoaded: jest.fn(() => true),
      currentPage: 0,
      error: null,
      loadPage: jest.fn(),
      reset: jest.fn()
    });

    mockUseVirtualizedGrid.mockReturnValue({
      itemsPerRow: 2,
      itemHeight: 100,
      gap: 16,
      shouldVirtualize: true,
      containerHeight: 500,
      overscan: 3,
      estimatedTotalHeight: 1000
    });
  });

  describe('Rendering', () => {
    it('should render virtualized grid when virtualization is enabled', () => {
      render(<LazyVirtualizedGrid {...defaultProps} />);

      expect(screen.getByTestId('virtualized-grid')).toBeInTheDocument();
    });

    it('should render simple grid when virtualization is disabled', () => {
      mockUseVirtualizedGrid.mockReturnValue({
        itemsPerRow: 2,
        itemHeight: 100,
        gap: 16,
        shouldVirtualize: false,
        containerHeight: 500,
        overscan: 3,
        estimatedTotalHeight: 1000
      });

      render(<LazyVirtualizedGrid {...defaultProps} />);

      // Should render simple grid instead of virtualized
      expect(screen.queryByTestId('virtualized-grid')).not.toBeInTheDocument();
    });

    it('should render skeleton cards for loading items', () => {
      mockUseLazyLoading.mockReturnValue({
        items: [mockItems[0], undefined, mockItems[2]],
        loading: true,
        hasMore: true,
        totalCount: 3,
        loadMore: jest.fn(),
        getItem: jest.fn((index) => index === 1 ? undefined : mockItems[index]),
        preloadAround: jest.fn(),
        isPageLoaded: jest.fn(() => true),
        currentPage: 0,
        error: null,
        loadPage: jest.fn(),
        reset: jest.fn()
      });

      render(<LazyVirtualizedGrid {...defaultProps} skeletonType="item" />);

      // Should render skeleton for undefined item
      expect(screen.getByTestId('skeleton-item')).toBeInTheDocument();
    });

    it('should render custom skeleton when renderSkeleton is provided', () => {
      const customRenderSkeleton = jest.fn((index) => (
        <div data-testid={`custom-skeleton-${index}`}>Custom Loading</div>
      ));

      mockUseLazyLoading.mockReturnValue({
        items: [undefined],
        loading: true,
        hasMore: true,
        totalCount: 1,
        loadMore: jest.fn(),
        getItem: jest.fn(() => undefined),
        preloadAround: jest.fn(),
        isPageLoaded: jest.fn(() => false),
        currentPage: 0,
        error: null,
        loadPage: jest.fn(),
        reset: jest.fn()
      });

      render(
        <LazyVirtualizedGrid
          {...defaultProps}
          renderSkeleton={customRenderSkeleton}
        />
      );

      expect(screen.getByTestId('custom-skeleton-0')).toBeInTheDocument();
      expect(customRenderSkeleton).toHaveBeenCalledWith(0);
    });

    it('should render empty state when no items', () => {
      mockUseLazyLoading.mockReturnValue({
        items: [],
        loading: false,
        hasMore: false,
        totalCount: 0,
        loadMore: jest.fn(),
        getItem: jest.fn(() => undefined),
        preloadAround: jest.fn(),
        isPageLoaded: jest.fn(() => true),
        currentPage: 0,
        error: null,
        loadPage: jest.fn(),
        reset: jest.fn()
      });

      render(
        <LazyVirtualizedGrid
          {...defaultProps}
          emptyState={<div data-testid="custom-empty">No items found</div>}
        />
      );

      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    });

    it('should render default empty state when no custom empty state provided', () => {
      mockUseLazyLoading.mockReturnValue({
        items: [],
        loading: false,
        hasMore: false,
        totalCount: 0,
        loadMore: jest.fn(),
        getItem: jest.fn(() => undefined),
        preloadAround: jest.fn(),
        isPageLoaded: jest.fn(() => true),
        currentPage: 0,
        error: null,
        loadPage: jest.fn(),
        reset: jest.fn()
      });

      render(<LazyVirtualizedGrid {...defaultProps} />);

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });
  });

  describe('Lazy Loading Integration', () => {
    it('should call loadFunction with correct parameters', () => {
      const config = {
        pageSize: 50,
        preloadDistance: 2,
        throttleMs: 200,
        maxCacheSize: 500
      };

      render(
        <LazyVirtualizedGrid
          {...defaultProps}
          pageSize={50}
          preloadDistance={2}
        />
      );

      expect(mockUseLazyLoading).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          pageSize: 50,
          preloadDistance: 2,
          throttleMs: 200,
          maxCacheSize: 500
        })
      );
    });

    it('should handle scroll events and trigger preloading', () => {
      const mockPreloadAround = jest.fn();
      const mockLoadMore = jest.fn();

      mockUseLazyLoading.mockReturnValue({
        items: mockItems,
        loading: false,
        hasMore: true,
        totalCount: 100,
        loadMore: mockLoadMore,
        getItem: jest.fn((index) => mockItems[index]),
        preloadAround: mockPreloadAround,
        isPageLoaded: jest.fn(() => true),
        currentPage: 0,
        error: null,
        loadPage: jest.fn(),
        reset: jest.fn()
      });

      render(<LazyVirtualizedGrid {...defaultProps} />);

      const grid = screen.getByTestId('virtualized-grid');

      // Simulate scroll event
      fireEvent.scroll(grid, { target: { scrollTop: 200 } });

      expect(mockPreloadAround).toHaveBeenCalled();
    });

    it('should trigger loadMore when approaching end', () => {
      const mockLoadMore = jest.fn();

      mockUseLazyLoading.mockReturnValue({
        items: mockItems,
        loading: false,
        hasMore: true,
        totalCount: 30,
        loadMore: mockLoadMore,
        getItem: jest.fn((index) => mockItems[index]),
        preloadAround: jest.fn(),
        isPageLoaded: jest.fn(() => true),
        currentPage: 0,
        error: null,
        loadPage: jest.fn(),
        reset: jest.fn()
      });

      const { container } = render(<LazyVirtualizedGrid {...defaultProps} pageSize={10} />);

      // Simulate scrolling near the end
      const grid = container.querySelector('[data-testid="virtualized-grid"]');
      if (grid) {
        fireEvent.scroll(grid, { target: { scrollTop: 400 } });
      }

      expect(mockLoadMore).toHaveBeenCalled();
    });

    it('should call onScroll prop when provided', () => {
      const mockOnScroll = jest.fn();

      render(
        <LazyVirtualizedGrid
          {...defaultProps}
          onScroll={mockOnScroll}
        />
      );

      const grid = screen.getByTestId('virtualized-grid');
      fireEvent.scroll(grid, { target: { scrollTop: 150 } });

      expect(mockOnScroll).toHaveBeenCalledWith(150);
    });
  });

  describe('Item Rendering', () => {
    it('should handle undefined items gracefully', () => {
      const mockGetItem = jest.fn((index) => index === 1 ? undefined : mockItems[index]);

      mockUseLazyLoading.mockReturnValue({
        items: [mockItems[0], undefined, mockItems[2]],
        loading: false,
        hasMore: true,
        totalCount: 3,
        loadMore: jest.fn(),
        getItem: mockGetItem,
        preloadAround: jest.fn(),
        isPageLoaded: jest.fn(() => true),
        currentPage: 0,
        error: null,
        loadPage: jest.fn(),
        reset: jest.fn()
      });

      render(<LazyVirtualizedGrid {...defaultProps} />);

      // Should handle both loaded and unloaded items
      expect(mockRenderItem).toHaveBeenCalledWith(mockItems[0], 0);
      expect(mockGetItem).toHaveBeenCalledWith(1);
    });

    it('should generate correct keys for loaded and loading items', () => {
      mockUseLazyLoading.mockReturnValue({
        items: [mockItems[0], undefined],
        loading: false,
        hasMore: true,
        totalCount: 2,
        loadMore: jest.fn(),
        getItem: jest.fn((index) => index === 1 ? undefined : mockItems[index]),
        preloadAround: jest.fn(),
        isPageLoaded: jest.fn(() => true),
        currentPage: 0,
        error: null,
        loadPage: jest.fn(),
        reset: jest.fn()
      });

      render(<LazyVirtualizedGrid {...defaultProps} />);

      // Should call getItemKey for loaded item
      expect(mockGetItemKey).toHaveBeenCalledWith(mockItems[0], 0);
      // Should generate loading key for undefined item
      expect(mockGetItemKey).toHaveBeenCalledWith(undefined, 1);
    });
  });

  describe('Loading States', () => {
    it('should load initial data on mount', async () => {
      const mockLoadMore = jest.fn();

      mockUseLazyLoading.mockReturnValue({
        items: [],
        loading: false,
        hasMore: true,
        totalCount: 0,
        loadMore: mockLoadMore,
        getItem: jest.fn(),
        preloadAround: jest.fn(),
        isPageLoaded: jest.fn(() => false),
        currentPage: 0,
        error: null,
        loadPage: jest.fn(),
        reset: jest.fn()
      });

      render(<LazyVirtualizedGrid {...defaultProps} />);

      expect(mockLoadMore).toHaveBeenCalled();
    });

    it('should show loading indicator when loading more items', () => {
      mockUseLazyLoading.mockReturnValue({
        items: mockItems.slice(0, 10),
        loading: true,
        hasMore: true,
        totalCount: 20,
        loadMore: jest.fn(),
        getItem: jest.fn((index) => mockItems[index]),
        preloadAround: jest.fn(),
        isPageLoaded: jest.fn(() => true),
        currentPage: 0,
        error: null,
        loadPage: jest.fn(),
        reset: jest.fn()
      });

      mockUseVirtualizedGrid.mockReturnValue({
        itemsPerRow: 2,
        itemHeight: 100,
        gap: 16,
        shouldVirtualize: false,
        containerHeight: 500,
        overscan: 3,
        estimatedTotalHeight: 1000
      });

      render(<LazyVirtualizedGrid {...defaultProps} />);

      expect(screen.getByText('Loading more items...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors from useVirtualizedGrid gracefully', () => {
      mockUseVirtualizedGrid.mockImplementation(() => {
        throw new Error('Grid configuration error');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<LazyVirtualizedGrid {...defaultProps} />);
      }).toThrow();

      consoleSpy.mockRestore();
    });

    it('should handle missing required props', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // @ts-ignore - Testing invalid props
      render(<LazyVirtualizedGrid />);

      consoleSpy.mockRestore();
    });
  });

  describe('Configuration', () => {
    it('should use different skeleton types', () => {
      mockUseLazyLoading.mockReturnValue({
        items: [undefined],
        loading: true,
        hasMore: true,
        totalCount: 1,
        loadMore: jest.fn(),
        getItem: jest.fn(() => undefined),
        preloadAround: jest.fn(),
        isPageLoaded: jest.fn(() => false),
        currentPage: 0,
        error: null,
        loadPage: jest.fn(),
        reset: jest.fn()
      });

      const { rerender } = render(
        <LazyVirtualizedGrid {...defaultProps} skeletonType="creature" />
      );

      expect(screen.getByTestId('skeleton-creature')).toBeInTheDocument();

      rerender(
        <LazyVirtualizedGrid {...defaultProps} skeletonType="equipment" />
      );

      expect(screen.getByTestId('skeleton-equipment')).toBeInTheDocument();
    });

    it('should apply custom styles and className', () => {
      const customStyle = { backgroundColor: 'red' };
      const customClassName = 'custom-grid';

      render(
        <LazyVirtualizedGrid
          {...defaultProps}
          style={customStyle}
          className={customClassName}
        />
      );

      const grid = screen.getByTestId('virtualized-grid');
      expect(grid).toHaveClass(customClassName);
    });
  });
});