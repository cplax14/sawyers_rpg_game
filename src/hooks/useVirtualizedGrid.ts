import { useState, useEffect, useMemo, useCallback } from 'react';
import { useResponsive } from './index';

interface UseVirtualizedGridProps {
  itemCount: number;
  containerHeight: number;
  minItemWidth: number;
  itemHeight: number;
  gap?: number;
  threshold?: number; // Item count threshold to enable virtualization
}

interface VirtualizedGridSettings {
  itemsPerRow: number;
  itemHeight: number;
  gap: number;
  shouldVirtualize: boolean;
  containerHeight: number;
  overscan: number;
  estimatedTotalHeight: number;
}

/**
 * useVirtualizedGrid - Hook for managing virtualized grid settings and performance optimization
 *
 * Features:
 * - Automatic responsive grid calculation based on screen size
 * - Smart virtualization threshold (only virtualize for large lists)
 * - Performance-optimized settings based on device capabilities
 * - Dynamic item sizing and gap adjustments
 */
export function useVirtualizedGrid({
  itemCount,
  containerHeight,
  minItemWidth,
  itemHeight,
  gap = 16,
  threshold = 100
}: UseVirtualizedGridProps): VirtualizedGridSettings {
  const { isMobile, isTablet, screenWidth } = useResponsive();
  const [containerWidth, setContainerWidth] = useState(screenWidth || 1024);

  // Update container width when screen size changes
  useEffect(() => {
    if (screenWidth) {
      setContainerWidth(screenWidth);
    }
  }, [screenWidth]);

  // Calculate responsive grid settings
  const gridSettings = useMemo(() => {
    // Adjust parameters based on device type
    const adjustedGap = isMobile ? Math.max(8, gap * 0.75) : gap;
    const adjustedMinWidth = isMobile ? minItemWidth * 0.9 : minItemWidth;
    const adjustedHeight = isMobile ? itemHeight * 0.9 : itemHeight;

    // Calculate items per row based on available width
    const availableWidth = containerWidth - (adjustedGap * 2); // Account for container padding
    const itemWidth = adjustedMinWidth + adjustedGap;
    const maxItemsPerRow = Math.floor(availableWidth / itemWidth);
    const itemsPerRow = Math.max(1, maxItemsPerRow);

    // Calculate total rows and estimated height
    const totalRows = Math.ceil(itemCount / itemsPerRow);
    const estimatedTotalHeight = totalRows * (adjustedHeight + adjustedGap) - adjustedGap;

    // Determine if virtualization is needed
    const shouldVirtualize = itemCount >= threshold;

    // Calculate overscan based on performance considerations
    let overscan = 3; // Default
    if (isMobile) {
      overscan = 2; // Reduce overscan on mobile for better performance
    } else if (itemCount > 1000) {
      overscan = 5; // Increase overscan for very large lists on desktop
    }

    return {
      itemsPerRow,
      itemHeight: adjustedHeight,
      gap: adjustedGap,
      shouldVirtualize,
      containerHeight,
      overscan,
      estimatedTotalHeight
    };
  }, [
    containerWidth,
    itemCount,
    minItemWidth,
    itemHeight,
    gap,
    threshold,
    isMobile,
    isTablet,
    containerHeight
  ]);

  return gridSettings;
}

/**
 * useVirtualizedGridPerformance - Hook for performance monitoring and optimization
 */
export function useVirtualizedGridPerformance() {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    visibleItems: 0,
    totalItems: 0,
    memoryUsage: 0
  });

  const recordRenderMetrics = useCallback((
    startTime: number,
    visibleItems: number,
    totalItems: number
  ) => {
    const renderTime = performance.now() - startTime;

    // Estimate memory usage (rough calculation)
    const estimatedMemoryPerItem = 0.1; // KB per item
    const memoryUsage = visibleItems * estimatedMemoryPerItem;

    setMetrics({
      renderTime,
      visibleItems,
      totalItems,
      memoryUsage
    });

    // Log performance warnings in development
    if (process.env.NODE_ENV === 'development') {
      if (renderTime > 16) { // 60fps threshold
        console.warn(`VirtualizedGrid: Slow render detected (${renderTime.toFixed(2)}ms)`, {
          visibleItems,
          totalItems,
          renderTime
        });
      }
    }
  }, []);

  const getPerformanceReport = useCallback(() => {
    const efficiency = metrics.totalItems > 0
      ? ((metrics.visibleItems / metrics.totalItems) * 100).toFixed(1)
      : '0';

    return {
      ...metrics,
      efficiency: `${efficiency}%`,
      fps: metrics.renderTime > 0 ? Math.round(1000 / metrics.renderTime) : 0
    };
  }, [metrics]);

  return {
    metrics,
    recordRenderMetrics,
    getPerformanceReport
  };
}

export default useVirtualizedGrid;