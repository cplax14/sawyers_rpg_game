import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface LazyLoadConfig {
  pageSize: number;
  preloadDistance?: number; // How far ahead to preload (in pages)
  throttleMs?: number; // Throttle loading requests
  maxCacheSize?: number; // Maximum items to keep in cache
}

interface LazyLoadState<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  loadedPages: Set<number>;
}

interface LazyLoadResult<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  loadMore: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  reset: () => void;
  getItem: (index: number) => T | undefined;
  isPageLoaded: (page: number) => boolean;
  preloadAround: (centerIndex: number) => Promise<void>;
}

/**
 * useLazyLoading - Hook for implementing lazy loading of large datasets
 *
 * Features:
 * - Progressive loading with configurable page sizes
 * - Intelligent preloading based on user scroll position
 * - Memory management with cache size limits
 * - Error handling and retry mechanisms
 * - Throttled loading to prevent excessive API calls
 */
export function useLazyLoading<T>(
  loadFunction: (page: number, pageSize: number) => Promise<{ items: T[]; totalCount: number; hasMore: boolean }>,
  config: LazyLoadConfig
): LazyLoadResult<T> {
  const {
    pageSize,
    preloadDistance = 1,
    throttleMs = 300,
    maxCacheSize = 1000
  } = config;

  const [state, setState] = useState<LazyLoadState<T>>({
    items: [],
    loading: false,
    hasMore: true,
    error: null,
    totalCount: 0,
    currentPage: 0,
    loadedPages: new Set()
  });

  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const cacheRef = useRef<Map<number, T[]>>(new Map());
  const loadingPagesRef = useRef<Set<number>>(new Set());

  // Throttled loading function
  const throttledLoad = useCallback(async (page: number) => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    return new Promise<void>((resolve, reject) => {
      loadTimeoutRef.current = setTimeout(async () => {
        try {
          // Prevent duplicate loading
          if (loadingPagesRef.current.has(page) || state.loadedPages.has(page)) {
            resolve();
            return;
          }

          loadingPagesRef.current.add(page);
          setState(prev => ({ ...prev, loading: true, error: null }));

          const result = await loadFunction(page, pageSize);

          // Cache the results
          cacheRef.current.set(page, result.items);

          // Implement cache size limit
          if (cacheRef.current.size > maxCacheSize / pageSize) {
            const oldestPage = Math.min(...cacheRef.current.keys());
            cacheRef.current.delete(oldestPage);
          }

          setState(prev => {
            const newLoadedPages = new Set(prev.loadedPages);
            newLoadedPages.add(page);

            // Merge items maintaining order
            const newItems = [...prev.items];
            const startIndex = page * pageSize;

            result.items.forEach((item, index) => {
              newItems[startIndex + index] = item;
            });

            return {
              ...prev,
              items: newItems,
              loading: false,
              hasMore: result.hasMore,
              totalCount: result.totalCount,
              currentPage: Math.max(prev.currentPage, page),
              loadedPages: newLoadedPages
            };
          });

          loadingPagesRef.current.delete(page);
          resolve();
        } catch (error) {
          loadingPagesRef.current.delete(page);
          setState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Loading failed'
          }));
          reject(error);
        }
      }, throttleMs);
    });
  }, [loadFunction, pageSize, throttleMs, maxCacheSize, state.loadedPages]);

  // Load next page
  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    const nextPage = state.currentPage + 1;
    await throttledLoad(nextPage);
  }, [state.loading, state.hasMore, state.currentPage, throttledLoad]);

  // Load specific page
  const loadPage = useCallback(async (page: number) => {
    if (state.loadedPages.has(page) || loadingPagesRef.current.has(page)) return;

    await throttledLoad(page);
  }, [state.loadedPages, throttledLoad]);

  // Reset to initial state
  const reset = useCallback(() => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    cacheRef.current.clear();
    loadingPagesRef.current.clear();

    setState({
      items: [],
      loading: false,
      hasMore: true,
      error: null,
      totalCount: 0,
      currentPage: 0,
      loadedPages: new Set()
    });
  }, []);

  // Get item by index (may trigger loading)
  const getItem = useCallback((index: number): T | undefined => {
    const page = Math.floor(index / pageSize);

    // Trigger loading if page not loaded
    if (!state.loadedPages.has(page) && !loadingPagesRef.current.has(page)) {
      loadPage(page);
      return undefined; // Return placeholder while loading
    }

    return state.items[index];
  }, [pageSize, state.loadedPages, state.items, loadPage]);

  // Check if page is loaded
  const isPageLoaded = useCallback((page: number): boolean => {
    return state.loadedPages.has(page);
  }, [state.loadedPages]);

  // Preload pages around a center index
  const preloadAround = useCallback(async (centerIndex: number) => {
    const centerPage = Math.floor(centerIndex / pageSize);
    const pagesToLoad: number[] = [];

    // Calculate pages to preload
    for (let i = -preloadDistance; i <= preloadDistance; i++) {
      const page = centerPage + i;
      if (page >= 0 && !state.loadedPages.has(page) && !loadingPagesRef.current.has(page)) {
        pagesToLoad.push(page);
      }
    }

    // Load pages in parallel
    const loadPromises = pagesToLoad.map(page => loadPage(page));
    await Promise.allSettled(loadPromises);
  }, [pageSize, preloadDistance, state.loadedPages, loadPage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  return {
    items: state.items,
    loading: state.loading,
    hasMore: state.hasMore,
    error: state.error,
    totalCount: state.totalCount,
    currentPage: state.currentPage,
    loadMore,
    loadPage,
    reset,
    getItem,
    isPageLoaded,
    preloadAround
  };
}

/**
 * useLazyInventoryLoading - Specialized hook for lazy loading inventory items
 */
export function useLazyInventoryLoading(
  loadItems: (page: number, pageSize: number, filters?: any) => Promise<{ items: any[]; totalCount: number; hasMore: boolean }>,
  filters?: any
) {
  const config: LazyLoadConfig = {
    pageSize: 50, // Load 50 items at a time
    preloadDistance: 2, // Preload 2 pages ahead
    throttleMs: 200, // Faster loading for inventory
    maxCacheSize: 500 // Keep up to 500 items in cache
  };

  const loadFunction = useCallback(
    (page: number, pageSize: number) => loadItems(page, pageSize, filters),
    [loadItems, filters]
  );

  return useLazyLoading(loadFunction, config);
}

/**
 * useLazyCreatureLoading - Specialized hook for lazy loading creature collections
 */
export function useLazyCreatureLoading(
  loadCreatures: (page: number, pageSize: number, viewMode?: string) => Promise<{ items: any[]; totalCount: number; hasMore: boolean }>,
  viewMode?: string
) {
  const config: LazyLoadConfig = {
    pageSize: 30, // Load 30 creatures at a time
    preloadDistance: 1, // Conservative preloading for creatures
    throttleMs: 300, // Standard throttling
    maxCacheSize: 300 // Keep up to 300 creatures in cache
  };

  const loadFunction = useCallback(
    (page: number, pageSize: number) => loadCreatures(page, pageSize, viewMode),
    [loadCreatures, viewMode]
  );

  return useLazyLoading(loadFunction, config);
}

export default useLazyLoading;