/**
 * Optimized Rendering Hook
 * Provides advanced performance optimizations for large datasets including:
 * - Intelligent memoization
 * - Smart batch rendering
 * - Frame-rate aware updates
 * - Memory leak prevention
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useDebounce, useThrottle, usePerformanceMonitor } from '../utils/performance';
import { useSmartCache, useInventoryCache, useCreatureCache } from './useSmartCache';

interface RenderOptimizationConfig {
  // Virtualization settings
  itemHeight: number;
  containerHeight: number;
  overscan: number;

  // Performance settings
  maxFPS: number;
  batchSize: number;
  debounceMs: number;
  throttleMs: number;

  // Caching settings
  enableCaching: boolean;
  cacheKey: string;
  cacheTTL?: number;

  // Monitoring
  enableMonitoring: boolean;
  componentName: string;
}

interface OptimizedRenderResult<T> {
  // Rendered data
  visibleItems: T[];
  totalItems: number;

  // Render methods
  renderBatch: (items: T[], startIndex: number) => React.ReactNode[];
  renderItem: (item: T, index: number) => React.ReactNode;

  // Performance metrics
  renderTime: number;
  cacheHitRate: number;
  memoryUsage: number;

  // Control methods
  invalidateCache: () => void;
  preloadRange: (start: number, end: number) => void;
  optimizeForScrolling: (isScrolling: boolean) => void;
}

export function useOptimizedRendering<T extends { id: string }>(
  items: T[],
  renderFunction: (item: T, index: number) => React.ReactNode,
  config: Partial<RenderOptimizationConfig> = {}
): OptimizedRenderResult<T> {
  const {
    itemHeight = 100,
    containerHeight = 600,
    overscan = 5,
    maxFPS = 60,
    batchSize = 20,
    debounceMs = 100,
    throttleMs = 16, // ~60fps
    enableCaching = true,
    cacheKey = 'optimized-render',
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    enableMonitoring = true,
    componentName = 'OptimizedRenderer',
  } = config;

  // Performance monitoring
  const performanceMonitor = usePerformanceMonitor(componentName);

  // Smart caching
  const cache = useSmartCache<string, React.ReactNode>({
    maxSize: Math.max(500, items.length * 2),
    defaultTTL: cacheTTL,
    enableStats: true,
  });

  // State for performance tracking
  const [renderMetrics, setRenderMetrics] = useState({
    renderTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
  });

  // Frame rate management
  const frameTimeRef = useRef(1000 / maxFPS);
  const lastFrameRef = useRef(0);
  const renderQueueRef = useRef<
    Array<{ item: T; index: number; callback: (node: React.ReactNode) => void }>
  >([]);

  // Scroll optimization state
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, 0 - overscan); // In real app, this would be based on scroll position
    const endIndex = Math.min(items.length - 1, startIndex + visibleCount + overscan * 2);

    return { startIndex, endIndex, visibleCount };
  }, [containerHeight, itemHeight, overscan, items.length]);

  // Get visible items with memoization
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  // Optimized render function with caching
  const renderItemOptimized = useCallback(
    (item: T, index: number) => {
      const itemCacheKey = `${cacheKey}-${item.id}-${index}`;

      if (enableCaching) {
        const cached = cache.get(itemCacheKey);
        if (cached) {
          return cached;
        }
      }

      const startTime = performance.now();
      const rendered = renderFunction(item, index);
      const renderTime = performance.now() - startTime;

      if (enableMonitoring && renderTime > frameTimeRef.current) {
        console.warn(`Slow render detected for item ${item.id}: ${renderTime.toFixed(2)}ms`);
      }

      if (enableCaching) {
        // Cache with higher TTL for frequently accessed items
        const cacheTtl = renderTime > frameTimeRef.current ? cacheTTL * 2 : cacheTTL;
        cache.set(itemCacheKey, rendered, {
          ttl: cacheTtl,
          tags: [cacheKey, `item-${item.id}`],
          priority: renderTime > frameTimeRef.current ? 'low' : 'high',
        });
      }

      return rendered;
    },
    [renderFunction, enableCaching, cache, cacheKey, enableMonitoring, cacheTTL]
  );

  // Batch rendering for better performance
  const renderBatch = useCallback(
    (items: T[], startIndex: number) => {
      return performanceMonitor.measure(() => {
        const batchStart = performance.now();
        const nodes: React.ReactNode[] = [];

        // Render items in smaller chunks to avoid blocking
        for (let i = 0; i < items.length; i += batchSize) {
          const chunk = items.slice(i, Math.min(i + batchSize, items.length));

          chunk.forEach((item, chunkIndex) => {
            const itemIndex = startIndex + i + chunkIndex;
            nodes.push(renderItemOptimized(item, itemIndex));
          });

          // Check if we need to yield to prevent frame drops
          const elapsed = performance.now() - batchStart;
          if (elapsed > frameTimeRef.current * 0.8) {
            // Queue remaining items for next frame
            const remaining = items.slice(i + batchSize);
            if (remaining.length > 0) {
              requestIdleCallback(() => {
                const remainingNodes = renderBatch(remaining, startIndex + i + batchSize);
                nodes.push(...remainingNodes);
              });
            }
            break;
          }
        }

        const renderTime = performance.now() - batchStart;
        setRenderMetrics(prev => ({ ...prev, renderTime }));

        return nodes;
      });
    },
    [batchSize, frameTimeRef, renderItemOptimized, performanceMonitor]
  );

  // Throttled scroll optimization
  const optimizeForScrolling = useThrottle(
    useCallback(
      (scrolling: boolean) => {
        setIsScrolling(scrolling);

        if (scrolling) {
          // Reduce quality during scrolling for better performance
          frameTimeRef.current = 1000 / (maxFPS * 0.6); // Reduce target FPS during scroll

          // Clear timeout if it exists
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }

          // Reset after scrolling stops
          scrollTimeoutRef.current = setTimeout(() => {
            setIsScrolling(false);
            frameTimeRef.current = 1000 / maxFPS;
          }, 150);
        }
      },
      [maxFPS]
    ),
    throttleMs
  );

  // Preload items in range
  const preloadRange = useCallback(
    async (start: number, end: number) => {
      const preloadItems = items.slice(start, end + 1);

      for (const item of preloadItems) {
        const cacheKey = `${config.cacheKey}-${item.id}`;
        await cache.prefetch(cacheKey, () =>
          renderFunction(item, start + preloadItems.indexOf(item))
        );
      }
    },
    [items, cache, renderFunction, config.cacheKey]
  );

  // Cache invalidation
  const invalidateCache = useCallback(() => {
    cache.invalidateByTag(cacheKey);
  }, [cache, cacheKey]);

  // Update cache hit rate (debounced to avoid excessive updates)
  useEffect(() => {
    if (!enableCaching) return;

    const timeoutId = setTimeout(() => {
      const stats = cache.getStats();
      setRenderMetrics(prev => ({
        ...prev,
        cacheHitRate: stats.hitRate,
      }));
    }, 100); // Debounce by 100ms

    return () => clearTimeout(timeoutId);
  }, [cache, enableCaching]); // Removed visibleItems dependency

  // Monitor memory usage (throttled to avoid excessive updates)
  useEffect(() => {
    if (!enableMonitoring || !('memory' in performance)) return;

    const intervalId = setInterval(() => {
      const memory = (performance as any).memory;
      setRenderMetrics(prev => ({
        ...prev,
        memoryUsage: memory.usedJSHeapSize / 1024 / 1024, // MB
      }));
    }, 1000); // Update every 1 second instead of on every visibleItems change

    return () => clearInterval(intervalId);
  }, [enableMonitoring]); // Removed visibleItems dependency

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (enableCaching) {
        // Keep cache but mark as low priority
        cache.invalidateByTag(`${cacheKey}-active`);
      }
    };
  }, [cache, cacheKey, enableCaching]);

  return {
    visibleItems,
    totalItems: items.length,
    renderBatch,
    renderItem: renderItemOptimized,
    renderTime: renderMetrics.renderTime,
    cacheHitRate: renderMetrics.cacheHitRate,
    memoryUsage: renderMetrics.memoryUsage,
    invalidateCache,
    preloadRange,
    optimizeForScrolling,
  };
}

/**
 * Specialized hook for inventory rendering optimization
 */
export function useOptimizedInventoryRendering<T extends { id: string }>(
  items: T[],
  renderFunction: (item: T, index: number) => React.ReactNode
) {
  return useOptimizedRendering(items, renderFunction, {
    componentName: 'InventoryRenderer',
    cacheKey: 'inventory',
    itemHeight: 120,
    containerHeight: 600,
    overscan: 3,
    batchSize: 15,
    maxFPS: 60,
    enableCaching: true,
    enableMonitoring: true,
  });
}

/**
 * Specialized hook for creature rendering optimization
 */
export function useOptimizedCreatureRendering<T extends { id: string }>(
  items: T[],
  renderFunction: (item: T, index: number) => React.ReactNode
) {
  return useOptimizedRendering(items, renderFunction, {
    componentName: 'CreatureRenderer',
    cacheKey: 'creatures',
    itemHeight: 140,
    containerHeight: 700,
    overscan: 2,
    batchSize: 12,
    maxFPS: 60,
    enableCaching: true,
    enableMonitoring: true,
  });
}
