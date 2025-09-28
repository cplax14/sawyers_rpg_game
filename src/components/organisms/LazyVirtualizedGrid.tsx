import React, { useMemo, useCallback, useEffect } from 'react';
import { VirtualizedGrid } from '../atoms/VirtualizedGrid';
import { SkeletonCard } from '../atoms/SkeletonCard';
import { useLazyLoading } from '../../hooks/useLazyLoading';
import { useVirtualizedGrid } from '../../hooks/useVirtualizedGrid';

interface LazyVirtualizedGridProps<T> {
  loadFunction: (page: number, pageSize: number) => Promise<{ items: T[]; totalCount: number; hasMore: boolean }>;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderSkeleton?: (index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string | number;
  itemHeight: number;
  minItemWidth: number;
  containerHeight: number;
  gap?: number;
  pageSize?: number;
  preloadDistance?: number;
  skeletonType?: 'item' | 'creature' | 'equipment';
  className?: string;
  style?: React.CSSProperties;
  onScroll?: (scrollTop: number) => void;
  emptyState?: React.ReactNode;
}

/**
 * LazyVirtualizedGrid - Combines virtualization with lazy loading for ultimate performance
 *
 * Features:
 * - Virtualized rendering for performance
 * - Lazy loading for memory efficiency
 * - Intelligent preloading based on scroll position
 * - Skeleton loading states
 * - Seamless infinite scrolling experience
 */
export function LazyVirtualizedGrid<T>({
  loadFunction,
  renderItem,
  renderSkeleton,
  getItemKey,
  itemHeight,
  minItemWidth,
  containerHeight,
  gap = 16,
  pageSize = 50,
  preloadDistance = 2,
  skeletonType = 'item',
  className,
  style,
  onScroll,
  emptyState
}: LazyVirtualizedGridProps<T>) {
  // Lazy loading setup
  const lazyConfig = useMemo(() => ({
    pageSize,
    preloadDistance,
    throttleMs: 200,
    maxCacheSize: pageSize * 10 // Keep 10 pages in cache
  }), [pageSize, preloadDistance]);

  const {
    items,
    loading,
    hasMore,
    totalCount,
    loadMore,
    getItem,
    preloadAround,
    isPageLoaded
  } = useLazyLoading(loadFunction, lazyConfig);

  // Virtualization setup
  const virtualGridSettings = useVirtualizedGrid({
    itemCount: totalCount || items.length,
    containerHeight,
    minItemWidth,
    itemHeight,
    gap,
    threshold: 30 // Lower threshold since we have lazy loading
  });

  // Combined item rendering function
  const renderVirtualItem = useCallback((item: T | undefined, index: number) => {
    // Check if item is loaded
    if (item === undefined) {
      // Trigger loading for this item
      const loadedItem = getItem(index);

      if (loadedItem) {
        return renderItem(loadedItem, index);
      }

      // Show skeleton while loading
      if (renderSkeleton) {
        return renderSkeleton(index);
      }

      return (
        <SkeletonCard
          type={skeletonType}
          size="md"
          key={`skeleton-${index}`}
        />
      );
    }

    return renderItem(item, index);
  }, [getItem, renderItem, renderSkeleton, skeletonType]);

  // Enhanced key function that handles undefined items
  const getVirtualItemKey = useCallback((item: T | undefined, index: number) => {
    if (item === undefined) {
      return `loading-${index}`;
    }
    return getItemKey(item, index);
  }, [getItemKey]);

  // Create a padded items array that includes placeholders for unloaded items
  const paddedItems = useMemo(() => {
    const total = totalCount || items.length;
    const result: (T | undefined)[] = new Array(total);

    // Fill with loaded items
    items.forEach((item, index) => {
      if (item) {
        result[index] = item;
      }
    });

    return result;
  }, [items, totalCount]);

  // Handle scroll events for preloading
  const handleScroll = useCallback((scrollTop: number) => {
    onScroll?.(scrollTop);

    // Calculate which items are currently visible
    const rowHeight = itemHeight + gap;
    const visibleStartRow = Math.floor(scrollTop / rowHeight);
    const visibleEndRow = Math.ceil((scrollTop + containerHeight) / rowHeight);

    const startIndex = visibleStartRow * virtualGridSettings.itemsPerRow;
    const endIndex = visibleEndRow * virtualGridSettings.itemsPerRow;

    // Preload around visible area
    const centerIndex = Math.floor((startIndex + endIndex) / 2);
    preloadAround(centerIndex);

    // Load more if approaching end
    const loadThreshold = totalCount - (pageSize * 2);
    if (endIndex > loadThreshold && hasMore && !loading) {
      loadMore();
    }
  }, [
    onScroll,
    itemHeight,
    gap,
    containerHeight,
    virtualGridSettings.itemsPerRow,
    preloadAround,
    totalCount,
    pageSize,
    hasMore,
    loading,
    loadMore
  ]);

  // Load initial data
  useEffect(() => {
    if (paddedItems.length === 0 && !loading) {
      loadMore();
    }
  }, [paddedItems.length, loading, loadMore]);

  // Empty state
  if (totalCount === 0 && !loading) {
    return (
      <div style={{
        height: containerHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#94a3b8',
        textAlign: 'center',
        ...style
      }}>
        {emptyState || 'No items found'}
      </div>
    );
  }

  // Use virtualized grid if we have enough items, otherwise render normally
  if (virtualGridSettings.shouldVirtualize) {
    return (
      <VirtualizedGrid
        items={paddedItems}
        itemHeight={virtualGridSettings.itemHeight}
        itemsPerRow={virtualGridSettings.itemsPerRow}
        containerHeight={virtualGridSettings.containerHeight}
        renderItem={renderVirtualItem}
        getItemKey={getVirtualItemKey}
        gap={virtualGridSettings.gap}
        overscan={virtualGridSettings.overscan}
        className={className}
        style={style}
        onScroll={handleScroll}
      />
    );
  }

  // Fallback to simple grid for small collections
  return (
    <div
      className={className}
      style={{
        height: containerHeight,
        overflowY: 'auto',
        display: 'grid',
        gridTemplateColumns: `repeat(${virtualGridSettings.itemsPerRow}, 1fr)`,
        gap: `${gap}px`,
        padding: `${gap}px`,
        ...style
      }}
      onScroll={(e) => handleScroll(e.currentTarget.scrollTop)}
    >
      {paddedItems.slice(0, Math.min(paddedItems.length, 100)).map((item, index) => (
        <div key={getVirtualItemKey(item, index)}>
          {renderVirtualItem(item, index)}
        </div>
      ))}

      {/* Loading indicator */}
      {loading && hasMore && (
        <div style={{
          gridColumn: '1 / -1',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          color: '#94a3b8'
        }}>
          Loading more items...
        </div>
      )}
    </div>
  );
}

export default LazyVirtualizedGrid;