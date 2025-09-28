import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useInventoryAnimations } from '../../hooks/useInventoryAnimations';
import { useResponsiveInventory } from '../../hooks/useResponsiveInventory';

interface GridItem {
  id: string;
  content: React.ReactNode;
  category?: string;
  sortKey?: string | number;
  isNew?: boolean;
  isHighlighted?: boolean;
}

interface AnimatedInventoryGridProps {
  items: GridItem[];
  columns?: number | 'auto';
  gap?: string;
  sortBy?: 'name' | 'category' | 'date' | 'custom';
  sortDirection?: 'asc' | 'desc';
  filterBy?: string;
  showAnimation?: boolean;
  enableReordering?: boolean;
  onItemMove?: (fromIndex: number, toIndex: number) => void;
  className?: string;
  style?: React.CSSProperties;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  isLoading?: boolean;
  useResponsiveLayout?: boolean;
}

export const AnimatedInventoryGrid: React.FC<AnimatedInventoryGridProps> = ({
  items,
  columns = 'auto',
  gap = '1rem',
  sortBy = 'name',
  sortDirection = 'asc',
  filterBy,
  showAnimation = true,
  enableReordering = false,
  onItemMove,
  className = '',
  style = {},
  emptyState,
  loadingState,
  isLoading = false,
  useResponsiveLayout = false
}) => {
  const { animations } = useInventoryAnimations();
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const { layoutConfig, getResponsiveGridColumns } = useResponsiveInventory();

  // Filter and sort items
  const processedItems = useMemo(() => {
    let filtered = [...items];

    // Apply filter
    if (filterBy) {
      filtered = filtered.filter(item =>
        item.category?.toLowerCase().includes(filterBy.toLowerCase()) ||
        item.id.toLowerCase().includes(filterBy.toLowerCase())
      );
    }

    // Apply sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'custom':
          aValue = a.sortKey || 0;
          bValue = b.sortKey || 0;
          break;
        default:
          aValue = a.id;
          bValue = b.id;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [items, filterBy, sortBy, sortDirection]);

  const getGridStyles = () => {
    const baseStyles: React.CSSProperties = {
      display: 'grid',
      gap: useResponsiveLayout ? layoutConfig.gridGap : gap,
      width: '100%',
      ...style
    };

    if (useResponsiveLayout) {
      const responsiveColumns = layoutConfig.gridColumns;
      if (responsiveColumns === 'auto') {
        return {
          ...baseStyles,
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))'
        };
      }
      return {
        ...baseStyles,
        gridTemplateColumns: `repeat(${responsiveColumns}, 1fr)`
      };
    }

    if (columns === 'auto') {
      return {
        ...baseStyles,
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))'
      };
    }

    return {
      ...baseStyles,
      gridTemplateColumns: `repeat(${columns}, 1fr)`
    };
  };

  const handleDragStart = (itemId: string) => {
    if (!enableReordering) return;
    setDraggedItem(itemId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (targetItemId: string) => {
    if (!enableReordering || !draggedItem || !onItemMove) return;

    const fromIndex = processedItems.findIndex(item => item.id === draggedItem);
    const toIndex = processedItems.findIndex(item => item.id === targetItemId);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      onItemMove(fromIndex, toIndex);
    }

    setDraggedItem(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`animated-inventory-grid loading ${className}`} style={getGridStyles()}>
        {loadingState || (
          Array.from({ length: 12 }).map((_, index) => (
            <motion.div
              key={`loading-${index}`}
              variants={animations.shimmer}
              initial="initial"
              animate="shimmer"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                height: '120px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            />
          ))
        )}
      </div>
    );
  }

  // Empty state
  if (processedItems.length === 0) {
    return (
      <motion.div
        className={`animated-inventory-grid empty ${className}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem',
          textAlign: 'center',
          color: 'rgba(244, 244, 244, 0.6)',
          ...style
        }}
      >
        {emptyState || (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              style={{ fontSize: '3rem', marginBottom: '1rem' }}
            >
              📦
            </motion.div>
            <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
              No items found
            </div>
            <div style={{ fontSize: '0.9rem' }}>
              {filterBy ? `No items match "${filterBy}"` : 'This inventory section is empty'}
            </div>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <LayoutGroup>
      <motion.div
        className={`animated-inventory-grid ${className}`}
        style={getGridStyles()}
        variants={showAnimation ? animations.staggerContainer : undefined}
        initial={showAnimation ? 'hidden' : undefined}
        animate={showAnimation ? 'visible' : undefined}
      >
        <AnimatePresence mode="popLayout">
          {processedItems.map((item, index) => (
            <motion.div
              key={item.id}
              layout
              layoutId={item.id}
              variants={showAnimation ? animations.listItem : undefined}
              initial={showAnimation ? 'hidden' : undefined}
              animate={showAnimation ? 'visible' : undefined}
              exit={showAnimation ? 'exit' : undefined}
              transition={{
                layout: { duration: 0.3, ease: 'easeInOut' },
                opacity: { duration: 0.2 }
              }}
              drag={enableReordering}
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragStart={() => handleDragStart(item.id)}
              onDragEnd={handleDragEnd}
              whileDrag={{
                scale: 1.05,
                zIndex: 1000,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
              }}
              onDrop={() => handleDrop(item.id)}
              style={{
                position: 'relative',
                cursor: enableReordering ? 'grab' : 'default'
              }}
            >
              {/* New item indicator */}
              {item.isNew && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#22c55e',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 'bold',
                    zIndex: 10,
                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)'
                  }}
                >
                  ✨
                </motion.div>
              )}

              {/* Highlight effect */}
              {item.isHighlighted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    background: 'linear-gradient(45deg, #4fc3f7, transparent, #4fc3f7)',
                    borderRadius: '10px',
                    zIndex: -1
                  }}
                />
              )}

              {/* Drag indicator */}
              {enableReordering && draggedItem === item.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(79, 195, 247, 0.8)',
                    color: '#ffffff',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    zIndex: 1001,
                    pointerEvents: 'none'
                  }}
                >
                  Dragging...
                </motion.div>
              )}

              {item.content}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Drop zones for reordering */}
        {enableReordering && draggedItem && (
          <AnimatePresence>
            {processedItems.map((item, index) => (
              <motion.div
                key={`drop-zone-${item.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(79, 195, 247, 0.2)',
                  border: '2px dashed rgba(79, 195, 247, 0.6)',
                  borderRadius: '8px',
                  pointerEvents: draggedItem === item.id ? 'none' : 'auto'
                }}
                onMouseUp={() => handleDrop(item.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </motion.div>
    </LayoutGroup>
  );
};

// Specialized grid components for different inventory types
export const ItemGrid: React.FC<Omit<AnimatedInventoryGridProps, 'columns'> & { itemSize?: 'small' | 'medium' | 'large' }> = ({
  itemSize = 'medium',
  useResponsiveLayout = true,
  ...props
}) => {
  const { layoutConfig, getGridItemSize } = useResponsiveInventory();

  if (useResponsiveLayout) {
    const itemStyles = getGridItemSize();
    return (
      <AnimatedInventoryGrid
        {...props}
        useResponsiveLayout={true}
        style={{
          ...props.style
        }}
      />
    );
  }

  const columnSizes = {
    small: 'repeat(auto-fill, minmax(80px, 1fr))',
    medium: 'repeat(auto-fill, minmax(120px, 1fr))',
    large: 'repeat(auto-fill, minmax(160px, 1fr))'
  };

  return (
    <AnimatedInventoryGrid
      {...props}
      useResponsiveLayout={false}
      style={{
        gridTemplateColumns: columnSizes[itemSize],
        ...props.style
      }}
    />
  );
};

export const EquipmentSlotGrid: React.FC<Omit<AnimatedInventoryGridProps, 'columns'>> = ({ useResponsiveLayout = true, ...props }) => (
  <AnimatedInventoryGrid
    {...props}
    useResponsiveLayout={useResponsiveLayout}
    columns={useResponsiveLayout ? 'auto' : 3}
    style={{
      maxWidth: useResponsiveLayout ? 'none' : '400px',
      margin: useResponsiveLayout ? '0' : '0 auto',
      ...props.style
    }}
  />
);

export const CreatureGrid: React.FC<Omit<AnimatedInventoryGridProps, 'columns'>> = ({ useResponsiveLayout = true, ...props }) => (
  <AnimatedInventoryGrid
    {...props}
    useResponsiveLayout={useResponsiveLayout}
    style={{
      gridTemplateColumns: useResponsiveLayout ? undefined : 'repeat(auto-fill, minmax(180px, 1fr))',
      ...props.style
    }}
  />
);

export default AnimatedInventoryGrid;