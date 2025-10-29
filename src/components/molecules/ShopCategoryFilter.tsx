import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../atoms/Button';

export interface ShopCategoryFilterProps {
  /** Available categories to filter by */
  categories: string[];
  /** Currently active category */
  activeCategory: string;
  /** Callback when category changes */
  onCategoryChange: (category: string) => void;
  /** Additional className */
  className?: string;
}

// Styles for ShopCategoryFilter
const categoryFilterStyles = {
  container: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    padding: '0.75rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  filterButton: {
    minWidth: '80px',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '600' as const,
    transition: 'all 0.2s ease',
  },
  activeButton: {
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    color: '#fff',
    border: '2px solid rgba(139, 92, 246, 0.5)',
  },
  inactiveButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
};

// Category icons for kid-friendly display
const categoryIcons: Record<string, string> = {
  all: '🌟',
  weapons: '⚔️',
  armor: '🛡️',
  consumables: '🧪',
  materials: '📦',
  magic: '✨',
  accessories: '💍',
  quest: '📜',
};

// Category display names
const categoryNames: Record<string, string> = {
  all: 'All Items',
  weapons: 'Weapons',
  armor: 'Armor',
  consumables: 'Consumables',
  materials: 'Materials',
  magic: 'Magic Items',
  accessories: 'Accessories',
  quest: 'Quest Items',
};

/**
 * ShopCategoryFilter - Filter shop inventory by item category
 *
 * Kid-friendly category buttons with icons and clear active state.
 * Provides accessible category navigation for shop browsing.
 *
 * @example
 * ```tsx
 * <ShopCategoryFilter
 *   categories={['all', 'weapons', 'armor', 'consumables']}
 *   activeCategory="all"
 *   onCategoryChange={handleCategoryChange}
 * />
 * ```
 */
export const ShopCategoryFilter: React.FC<ShopCategoryFilterProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  className = '',
}) => {
  // Get display name for category
  const getCategoryDisplay = (category: string): string => {
    return categoryNames[category.toLowerCase()] || category;
  };

  // Get icon for category
  const getCategoryIcon = (category: string): string => {
    return categoryIcons[category.toLowerCase()] || '📁';
  };

  return (
    <div
      className={className}
      style={categoryFilterStyles.container}
      role='tablist'
      aria-label='Filter items by category'
    >
      {categories.map(category => {
        const isActive = category === activeCategory;
        const displayName = getCategoryDisplay(category);
        const icon = getCategoryIcon(category);

        return (
          <motion.button
            key={category}
            onClick={() => onCategoryChange(category)}
            style={{
              ...categoryFilterStyles.filterButton,
              ...(isActive
                ? categoryFilterStyles.activeButton
                : categoryFilterStyles.inactiveButton),
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role='tab'
            aria-selected={isActive}
            aria-controls={`${category}-panel`}
            aria-label={`Filter by ${displayName}`}
          >
            <span aria-hidden='true' style={{ marginRight: '0.5rem' }}>
              {icon}
            </span>
            <span>{displayName}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default ShopCategoryFilter;
