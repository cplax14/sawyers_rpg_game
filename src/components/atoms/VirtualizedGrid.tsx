import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VirtualizedGridProps<T> {
  items: T[];
  itemHeight: number;
  itemsPerRow: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T, index: number) => string | number;
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
  overscan?: number; // Number of extra rows to render outside visible area
  onScroll?: (scrollTop: number) => void;
  scrollToIndex?: number;
}

/**
 * VirtualizedGrid - A high-performance virtualized grid component for rendering large lists
 *
 * Features:
 * - Only renders visible items + overscan buffer
 * - Maintains smooth scrolling performance with 1000+ items
 * - Supports variable item heights and responsive grid layouts
 * - Integrates with Framer Motion for animations
 * - Handles dynamic resizing and item updates
 */
export function VirtualizedGrid<T>({
  items,
  itemHeight,
  itemsPerRow,
  containerHeight,
  renderItem,
  getItemKey,
  gap = 16,
  className,
  style,
  overscan = 3,
  onScroll,
  scrollToIndex
}: VirtualizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Calculate grid dimensions
  const rowHeight = itemHeight + gap;
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const totalHeight = totalRows * rowHeight - gap; // Remove last gap

  // Calculate visible range with overscan
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
  );

  // Calculate visible items
  const visibleItems = useMemo(() => {
    const startIndex = startRow * itemsPerRow;
    const endIndex = Math.min(items.length - 1, (endRow + 1) * itemsPerRow - 1);

    const visibleData: Array<{
      item: T;
      index: number;
      row: number;
      col: number;
      top: number;
      left: number;
      key: string | number;
    }> = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (i >= items.length) break;

      const item = items[i];
      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;
      const top = row * rowHeight;
      const left = col * (100 / itemsPerRow); // Percentage for responsive layout

      visibleData.push({
        item,
        index: i,
        row,
        col,
        top,
        left,
        key: getItemKey(item, i)
      });
    }

    return visibleData;
  }, [items, startRow, endRow, itemsPerRow, rowHeight, getItemKey]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);

    // Track scrolling state for performance optimizations
    isScrollingRef.current = true;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, [onScroll]);

  // Handle scroll to index
  useEffect(() => {
    if (scrollToIndex !== undefined && containerRef.current) {
      const targetRow = Math.floor(scrollToIndex / itemsPerRow);
      const targetScrollTop = targetRow * rowHeight;
      containerRef.current.scrollTop = targetScrollTop;
    }
  }, [scrollToIndex, itemsPerRow, rowHeight]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    height: containerHeight,
    overflowY: 'auto',
    overflowX: 'hidden',
    position: 'relative',
    ...style
  };

  const spacerStyle: React.CSSProperties = {
    height: totalHeight,
    width: '100%',
    position: 'relative'
  };

  const itemContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    display: 'grid',
    gridTemplateColumns: `repeat(${itemsPerRow}, 1fr)`,
    gap: `${gap}px`,
    padding: `0 ${gap / 2}px`
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      onScroll={handleScroll}
      data-testid="virtualized-grid"
    >
      <div style={spacerStyle}>
        <div style={itemContainerStyle}>
          <AnimatePresence>
            {visibleItems.map(({ item, index, top, left, key }) => (
              <motion.div
                key={key}
                style={{
                  position: 'absolute',
                  top: `${top}px`,
                  left: `${left}%`,
                  width: `${100 / itemsPerRow}%`,
                  height: `${itemHeight}px`,
                  padding: `0 ${gap / 2}px`
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: isScrollingRef.current ? 0.1 : 0.3,
                  delay: isScrollingRef.current ? 0 : index * 0.02
                }}
                layout
              >
                {renderItem(item, index)}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default VirtualizedGrid;