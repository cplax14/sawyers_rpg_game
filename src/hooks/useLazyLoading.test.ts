import { renderHook, act, waitFor } from '@testing-library/react';
import { useLazyLoading, useLazyInventoryLoading, useLazyCreatureLoading } from './useLazyLoading';

// Mock test data
const generateTestItems = (count: number, prefix = 'item') =>
  Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-${i}`,
    name: `${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${i}`,
    value: i * 10
  }));

describe('useLazyLoading', () => {
  // Mock load function
  const createMockLoadFunction = (allItems: any[], delay = 0) =>
    jest.fn(async (page: number, pageSize: number) => {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const startIndex = page * pageSize;
      const endIndex = startIndex + pageSize;
      const items = allItems.slice(startIndex, endIndex);

      return {
        items,
        totalCount: allItems.length,
        hasMore: endIndex < allItems.length
      };
    });

  const defaultConfig = {
    pageSize: 10,
    preloadDistance: 1,
    throttleMs: 100,
    maxCacheSize: 100
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should initialize with empty state', () => {
      const allItems = generateTestItems(50);
      const mockLoadFunction = createMockLoadFunction(allItems);

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, defaultConfig)
      );

      expect(result.current.items).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.error).toBe(null);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.currentPage).toBe(0);
    });

    it('should load first page when loadMore is called', async () => {
      const allItems = generateTestItems(50);
      const mockLoadFunction = createMockLoadFunction(allItems);

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, defaultConfig)
      );

      await act(async () => {
        await result.current.loadMore();
      });

      expect(mockLoadFunction).toHaveBeenCalledWith(1, 10);
      expect(result.current.items).toHaveLength(10);
      expect(result.current.totalCount).toBe(50);
      expect(result.current.hasMore).toBe(true);
      expect(result.current.currentPage).toBe(1);
    });

    it('should load specific page when loadPage is called', async () => {
      const allItems = generateTestItems(50);
      const mockLoadFunction = createMockLoadFunction(allItems);

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, defaultConfig)
      );

      await act(async () => {
        await result.current.loadPage(3);
      });

      expect(mockLoadFunction).toHaveBeenCalledWith(3, 10);
      expect(result.current.items).toHaveLength(10);
      expect(result.current.currentPage).toBe(3);
    });

    it('should reset state when reset is called', async () => {
      const allItems = generateTestItems(50);
      const mockLoadFunction = createMockLoadFunction(allItems);

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, defaultConfig)
      );

      // Load some data first
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.items).toHaveLength(10);

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.items).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.currentPage).toBe(0);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Item Access', () => {
    it('should return item by index if loaded', async () => {
      const allItems = generateTestItems(50);
      const mockLoadFunction = createMockLoadFunction(allItems);

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, defaultConfig)
      );

      await act(async () => {
        await result.current.loadPage(0);
      });

      const item = result.current.getItem(5);
      expect(item).toEqual(allItems[5]);
    });

    it('should trigger loading and return undefined for unloaded items', () => {
      const allItems = generateTestItems(50);
      const mockLoadFunction = createMockLoadFunction(allItems);

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, defaultConfig)
      );

      const item = result.current.getItem(25); // Page 2
      expect(item).toBeUndefined();
      expect(mockLoadFunction).toHaveBeenCalledWith(2, 10);
    });

    it('should check if page is loaded correctly', async () => {
      const allItems = generateTestItems(50);
      const mockLoadFunction = createMockLoadFunction(allItems);

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, defaultConfig)
      );

      expect(result.current.isPageLoaded(0)).toBe(false);

      await act(async () => {
        await result.current.loadPage(0);
      });

      expect(result.current.isPageLoaded(0)).toBe(true);
      expect(result.current.isPageLoaded(1)).toBe(false);
    });
  });

  describe('Preloading', () => {
    it('should preload pages around center index', async () => {
      const allItems = generateTestItems(100);
      const mockLoadFunction = createMockLoadFunction(allItems);

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, { ...defaultConfig, preloadDistance: 2 })
      );

      await act(async () => {
        await result.current.preloadAround(25); // Center page 2
      });

      // Should load pages 0, 1, 2, 3, 4 (center ± preloadDistance)
      expect(mockLoadFunction).toHaveBeenCalledTimes(5);
      expect(mockLoadFunction).toHaveBeenCalledWith(0, 10);
      expect(mockLoadFunction).toHaveBeenCalledWith(1, 10);
      expect(mockLoadFunction).toHaveBeenCalledWith(2, 10);
      expect(mockLoadFunction).toHaveBeenCalledWith(3, 10);
      expect(mockLoadFunction).toHaveBeenCalledWith(4, 10);
    });

    it('should not preload negative pages', async () => {
      const allItems = generateTestItems(100);
      const mockLoadFunction = createMockLoadFunction(allItems);

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, { ...defaultConfig, preloadDistance: 3 })
      );

      await act(async () => {
        await result.current.preloadAround(5); // Page 0
      });

      // Should only load pages 0, 1, 2, 3 (no negative pages)
      expect(mockLoadFunction).toHaveBeenCalledTimes(4);
      expect(mockLoadFunction).toHaveBeenCalledWith(0, 10);
      expect(mockLoadFunction).toHaveBeenCalledWith(1, 10);
      expect(mockLoadFunction).toHaveBeenCalledWith(2, 10);
      expect(mockLoadFunction).toHaveBeenCalledWith(3, 10);
    });
  });

  describe('Error Handling', () => {
    it('should handle loading errors gracefully', async () => {
      const mockLoadFunction = jest.fn().mockRejectedValue(new Error('Load failed'));

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, defaultConfig)
      );

      await act(async () => {
        try {
          await result.current.loadMore();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Load failed');
    });

    it('should handle non-Error exceptions', async () => {
      const mockLoadFunction = jest.fn().mockRejectedValue('String error');

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, defaultConfig)
      );

      await act(async () => {
        try {
          await result.current.loadMore();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Loading failed');
    });
  });

  describe('Throttling', () => {
    it('should throttle loading requests', async () => {
      const allItems = generateTestItems(50);
      const mockLoadFunction = createMockLoadFunction(allItems);

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, { ...defaultConfig, throttleMs: 300 })
      );

      // Make multiple rapid calls
      act(() => {
        result.current.loadPage(0);
        result.current.loadPage(1);
        result.current.loadPage(2);
      });

      // Should only call once initially due to throttling
      expect(mockLoadFunction).toHaveBeenCalledTimes(0);

      // Advance timers
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Wait for async operations
      await waitFor(() => {
        expect(mockLoadFunction).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Duplicate Prevention', () => {
    it('should not load the same page multiple times', async () => {
      const allItems = generateTestItems(50);
      const mockLoadFunction = createMockLoadFunction(allItems);

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, defaultConfig)
      );

      // Load page 0 multiple times
      await act(async () => {
        await Promise.all([
          result.current.loadPage(0),
          result.current.loadPage(0),
          result.current.loadPage(0)
        ]);
      });

      expect(mockLoadFunction).toHaveBeenCalledTimes(1);
    });

    it('should prevent loading when already loading', async () => {
      const allItems = generateTestItems(50);
      const mockLoadFunction = createMockLoadFunction(allItems, 100); // Add delay

      const { result } = renderHook(() =>
        useLazyLoading(mockLoadFunction, defaultConfig)
      );

      act(() => {
        result.current.loadMore();
        result.current.loadMore(); // Should be ignored
      });

      expect(mockLoadFunction).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useLazyInventoryLoading', () => {
  it('should use inventory-specific configuration', () => {
    const mockLoadItems = jest.fn().mockResolvedValue({
      items: [],
      totalCount: 0,
      hasMore: false
    });

    const { result } = renderHook(() =>
      useLazyInventoryLoading(mockLoadItems)
    );

    expect(result.current.items).toEqual([]);
  });

  it('should reset when filters change', async () => {
    const mockLoadItems = jest.fn().mockResolvedValue({
      items: [{ id: '1', name: 'Item 1' }],
      totalCount: 1,
      hasMore: false
    });

    const { result, rerender } = renderHook(
      ({ filters }) => useLazyInventoryLoading(mockLoadItems, filters),
      { initialProps: { filters: { category: 'weapons' } } }
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockLoadItems).toHaveBeenCalledWith(0, 50, { category: 'weapons' });
    });

    // Change filters
    rerender({ filters: { category: 'armor' } });

    // Should reset and load with new filters
    await waitFor(() => {
      expect(mockLoadItems).toHaveBeenCalledWith(0, 50, { category: 'armor' });
    });
  });
});

describe('useLazyCreatureLoading', () => {
  it('should use creature-specific configuration', () => {
    const mockLoadCreatures = jest.fn().mockResolvedValue({
      items: [],
      totalCount: 0,
      hasMore: false
    });

    const { result } = renderHook(() =>
      useLazyCreatureLoading(mockLoadCreatures)
    );

    expect(result.current.items).toEqual([]);
  });

  it('should reset when view mode changes', async () => {
    const mockLoadCreatures = jest.fn().mockResolvedValue({
      items: [{ id: '1', name: 'Dragon' }],
      totalCount: 1,
      hasMore: false
    });

    const { result, rerender } = renderHook(
      ({ viewMode }) => useLazyCreatureLoading(mockLoadCreatures, viewMode),
      { initialProps: { viewMode: 'bestiary' } }
    );

    // Load first page with initial view mode
    await act(async () => {
      await result.current.loadPage(0);
    });

    expect(mockLoadCreatures).toHaveBeenCalledWith(0, 30, 'bestiary');

    // Change view mode
    rerender({ viewMode: 'collection' });

    // Reset should clear items
    act(() => {
      result.current.reset();
    });

    expect(result.current.items).toEqual([]);

    // Load with new view mode
    await act(async () => {
      await result.current.loadPage(0);
    });

    expect(mockLoadCreatures).toHaveBeenCalledWith(0, 30, 'collection');
  });
});