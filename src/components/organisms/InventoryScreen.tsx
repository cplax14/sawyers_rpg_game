import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { ItemCard } from '../molecules/ItemCard';
import { useInventory } from '../../hooks/useInventory';
import { useGameState } from '../../contexts/ReactGameContext';
import { useResponsive } from '../../hooks';
import { EnhancedItem, ItemCategory, ItemType } from '../../types/inventory';

interface InventoryScreenProps {
  className?: string;
  onClose?: () => void;
}

// Item categories for filtering
const ITEM_CATEGORIES: Array<{ id: ItemCategory | 'all'; name: string; icon: string }> = [
  { id: 'all', name: 'All Items', icon: '📦' },
  { id: 'consumables', name: 'Consumables', icon: '🧪' },
  { id: 'materials', name: 'Materials', icon: '⚒️' },
  { id: 'quest', name: 'Quest Items', icon: '📜' },
  { id: 'misc', name: 'Miscellaneous', icon: '🎒' }
];

// Sort options
const SORT_OPTIONS: Array<{ id: string; name: string; icon: string }> = [
  { id: 'name', name: 'Name', icon: '🔤' },
  { id: 'rarity', name: 'Rarity', icon: '⭐' },
  { id: 'quantity', name: 'Quantity', icon: '🔢' },
  { id: 'type', name: 'Type', icon: '📂' }
];

// Temporary styles since PostCSS is disabled
const inventoryStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    color: '#f4f4f4',
    padding: '1rem',
    boxSizing: 'border-box' as const,
    overflow: 'hidden'
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '1.5rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
    color: '#d4af37'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    margin: '0'
  },
  controls: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    flexWrap: 'wrap' as const,
    alignItems: 'center'
  },
  searchContainer: {
    flex: '1 1 300px',
    position: 'relative' as const
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    fontSize: '0.9rem',
    outline: 'none',
    transition: 'all 0.3s ease'
  },
  searchIcon: {
    position: 'absolute' as const,
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    fontSize: '1.2rem'
  },
  clearSearch: {
    position: 'absolute' as const,
    right: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '0.25rem'
  },
  filterTabs: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const
  },
  filterTab: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  filterTabActive: {
    background: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
    color: '#d4af37'
  },
  sortContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  sortLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8'
  },
  sortSelect: {
    padding: '0.5rem',
    borderRadius: '6px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    fontSize: '0.8rem',
    outline: 'none'
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const
  },
  statsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontSize: '0.8rem',
    color: '#94a3b8'
  },
  itemGrid: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '0.5rem',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
    alignContent: 'start'
  },
  mobileItemGrid: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '0.75rem'
  },
  emptyState: {
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontSize: '1rem',
    padding: '3rem 1rem',
    fontStyle: 'italic'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px'
  },
  errorContainer: {
    textAlign: 'center' as const,
    padding: '2rem'
  },
  closeButton: {
    position: 'absolute' as const,
    top: '1rem',
    right: '1rem',
    zIndex: 10
  },
  advancedFilters: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    border: '1px solid rgba(212, 175, 55, 0.3)'
  },
  filterRow: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '0.75rem',
    flexWrap: 'wrap' as const,
    alignItems: 'center'
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    minWidth: '150px'
  },
  filterLabel: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#d4af37'
  },
  rarityChips: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const
  },
  rarityChip: {
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    border: '1px solid transparent',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#f4f4f4',
    fontSize: '0.7rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  rarityChipActive: {
    background: 'rgba(212, 175, 55, 0.3)',
    borderColor: '#d4af37',
    color: '#d4af37'
  },
  numberInput: {
    padding: '0.4rem',
    borderRadius: '4px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    fontSize: '0.8rem',
    outline: 'none',
    width: '80px'
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  checkbox: {
    accentColor: '#d4af37'
  },
  filterToggle: {
    background: 'rgba(212, 175, 55, 0.1)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    color: '#d4af37',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  clearFiltersButton: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    padding: '0.5rem 1rem',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  }
};


export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  className,
  onClose
}) => {
  const { gameState } = useGameState();
  const { isMobile, isTablet } = useResponsive();

  const {
    getFilteredItems,
    getTotalItemCount,
    getItemsByCategory,
    searchItems,
    consolidateInventoryStacks,
    isLoading,
    error
  } = useInventory();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [rarityFilter, setRarityFilter] = useState<string[]>([]);
  const [valueFilter, setValueFilter] = useState({ min: '', max: '' });
  const [usableOnly, setUsableOnly] = useState(false);
  const [stackableOnly, setStackableOnly] = useState(false);

  // Get filtered and sorted items
  const filteredItems = useMemo(() => {
    let items: EnhancedItem[] = [];

    // Start with category filter
    if (selectedCategory === 'all') {
      items = getFilteredItems({
        category: 'consumables' // Get all non-equipment items
      });
    } else {
      items = getItemsByCategory(selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      items = searchItems(searchQuery, items);
    }

    // Apply advanced filters
    if (rarityFilter.length > 0) {
      items = items.filter(item => rarityFilter.includes(item.rarity || 'common'));
    }

    if (valueFilter.min || valueFilter.max) {
      items = items.filter(item => {
        const value = item.value || 0;
        const min = valueFilter.min ? parseFloat(valueFilter.min) : 0;
        const max = valueFilter.max ? parseFloat(valueFilter.max) : Infinity;
        return value >= min && value <= max;
      });
    }

    if (usableOnly) {
      items = items.filter(item => item.usable || item.itemType === 'consumable');
    }

    if (stackableOnly) {
      items = items.filter(item => item.stackable);
    }

    // Apply sorting
    items.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'rarity':
          const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'];
          comparison = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
          break;
        case 'quantity':
          comparison = (a.quantity || 1) - (b.quantity || 1);
          break;
        case 'type':
          comparison = (a.itemType || '').localeCompare(b.itemType || '');
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return items;
  }, [selectedCategory, searchQuery, sortBy, sortOrder, rarityFilter, valueFilter, usableOnly, stackableOnly, getFilteredItems, getItemsByCategory, searchItems]);

  // Handle search input
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback((category: ItemCategory | 'all') => {
    setSelectedCategory(category);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split(':');
    setSortBy(field);
    setSortOrder(order as 'asc' | 'desc');
  }, []);

  // Handle rarity filter
  const handleRarityFilterChange = useCallback((rarity: string) => {
    setRarityFilter(prev =>
      prev.includes(rarity)
        ? prev.filter(r => r !== rarity)
        : [...prev, rarity]
    );
  }, []);

  // Handle value filter
  const handleValueFilterChange = useCallback((type: 'min' | 'max', value: string) => {
    setValueFilter(prev => ({ ...prev, [type]: value }));
  }, []);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setRarityFilter([]);
    setValueFilter({ min: '', max: '' });
    setUsableOnly(false);
    setStackableOnly(false);
  }, []);

  // Consolidate stacks
  const handleConsolidateStacks = useCallback(async () => {
    try {
      await consolidateInventoryStacks('main');
      console.log('✅ Inventory stacks consolidated successfully!');
    } catch (error) {
      console.error('❌ Failed to consolidate stacks:', error);
    }
  }, [consolidateInventoryStacks]);

  // Get category stats
  const categoryStats = useMemo(() => {
    return ITEM_CATEGORIES.map(cat => ({
      ...cat,
      count: cat.id === 'all'
        ? getTotalItemCount()
        : getItemsByCategory(cat.id as ItemCategory).length
    }));
  }, [getTotalItemCount, getItemsByCategory]);

  if (isLoading) {
    return (
      <div className={className} style={inventoryStyles.container}>
        <div style={inventoryStyles.loadingContainer}>
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className} style={inventoryStyles.container}>
        <div style={inventoryStyles.errorContainer}>
          <h2>Inventory System Error</h2>
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={inventoryStyles.container}>
      {onClose && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          style={inventoryStyles.closeButton}
        >
          ✕
        </Button>
      )}

      {/* Header */}
      <motion.div
        style={inventoryStyles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{
          ...inventoryStyles.title,
          fontSize: isMobile ? '1.5rem' : '2rem'
        }}>
          Inventory
        </h1>
        <p style={inventoryStyles.subtitle}>
          Manage your items and consumables
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        style={{
          ...inventoryStyles.controls,
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {/* Search */}
        <div style={inventoryStyles.searchContainer}>
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={inventoryStyles.searchInput}
          />
          {searchQuery ? (
            <button
              onClick={handleClearSearch}
              style={inventoryStyles.clearSearch}
              aria-label="Clear search"
            >
              ✕
            </button>
          ) : (
            <span style={inventoryStyles.searchIcon}>🔍</span>
          )}
        </div>

        {/* Sort */}
        <div style={inventoryStyles.sortContainer}>
          <span style={inventoryStyles.sortLabel}>Sort by:</span>
          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={handleSortChange}
            style={inventoryStyles.sortSelect}
          >
            {SORT_OPTIONS.map(option => (
              <React.Fragment key={option.id}>
                <option value={`${option.id}:asc`}>
                  {option.icon} {option.name} (A-Z)
                </option>
                <option value={`${option.id}:desc`}>
                  {option.icon} {option.name} (Z-A)
                </option>
              </React.Fragment>
            ))}
          </select>
        </div>

        {/* Advanced Filters Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={inventoryStyles.filterToggle}
          >
            🔧 {showAdvancedFilters ? 'Hide' : 'Show'} Filters
          </button>

          {(rarityFilter.length > 0 || valueFilter.min || valueFilter.max || usableOnly || stackableOnly) && (
            <button
              onClick={handleClearAllFilters}
              style={inventoryStyles.clearFiltersButton}
            >
              🗑️ Clear Filters
            </button>
          )}
        </div>
      </motion.div>

      {/* Category Filters */}
      <motion.div
        style={inventoryStyles.filterTabs}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {categoryStats.map((category, index) => (
          <motion.button
            key={category.id}
            style={{
              ...inventoryStyles.filterTab,
              ...(selectedCategory === category.id ? inventoryStyles.filterTabActive : {})
            }}
            onClick={() => handleCategoryChange(category.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.05 }}
          >
            <span>{category.icon}</span>
            <span>{category.name}</span>
            <span style={{
              background: 'rgba(212, 175, 55, 0.2)',
              borderRadius: '10px',
              padding: '0.1rem 0.4rem',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}>
              {category.count}
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            style={inventoryStyles.advancedFilters}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Rarity Filter */}
            <div style={inventoryStyles.filterRow}>
              <div style={inventoryStyles.filterGroup}>
                <span style={inventoryStyles.filterLabel}>Rarity</span>
                <div style={inventoryStyles.rarityChips}>
                  {['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythical'].map(rarity => (
                    <button
                      key={rarity}
                      onClick={() => handleRarityFilterChange(rarity)}
                      style={{
                        ...inventoryStyles.rarityChip,
                        ...(rarityFilter.includes(rarity) ? inventoryStyles.rarityChipActive : {})
                      }}
                    >
                      {rarity}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Value Filter */}
            <div style={inventoryStyles.filterRow}>
              <div style={inventoryStyles.filterGroup}>
                <span style={inventoryStyles.filterLabel}>Value Range</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={valueFilter.min}
                    onChange={(e) => handleValueFilterChange('min', e.target.value)}
                    style={inventoryStyles.numberInput}
                  />
                  <span style={{ color: '#94a3b8' }}>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={valueFilter.max}
                    onChange={(e) => handleValueFilterChange('max', e.target.value)}
                    style={inventoryStyles.numberInput}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>gold</span>
                </div>
              </div>
            </div>

            {/* Property Filters */}
            <div style={inventoryStyles.filterRow}>
              <div style={inventoryStyles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="usableOnly"
                  checked={usableOnly}
                  onChange={(e) => setUsableOnly(e.target.checked)}
                  style={inventoryStyles.checkbox}
                />
                <label htmlFor="usableOnly" style={{ fontSize: '0.8rem', color: '#f4f4f4' }}>
                  Usable items only
                </label>
              </div>

              <div style={inventoryStyles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="stackableOnly"
                  checked={stackableOnly}
                  onChange={(e) => setStackableOnly(e.target.checked)}
                  style={inventoryStyles.checkbox}
                />
                <label htmlFor="stackableOnly" style={{ fontSize: '0.8rem', color: '#f4f4f4' }}>
                  Stackable items only
                </label>
              </div>

              <div style={inventoryStyles.checkboxGroup}>
                <button
                  onClick={handleConsolidateStacks}
                  style={{
                    ...inventoryStyles.filterToggle,
                    background: 'rgba(34, 197, 94, 0.1)',
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                    color: '#22c55e'
                  }}
                >
                  📦 Consolidate Stacks
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div style={inventoryStyles.content}>
        {/* Stats Bar */}
        <motion.div
          style={inventoryStyles.statsBar}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span>
            Showing {filteredItems.length} of {getTotalItemCount()} items
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          <span>
            Category: {ITEM_CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </span>
        </motion.div>

        {/* Items Grid */}
        <div style={{
          ...inventoryStyles.itemGrid,
          ...(isMobile ? inventoryStyles.mobileItemGrid : {})
        }}>
          <AnimatePresence>
            {filteredItems.length === 0 ? (
              <motion.div
                style={inventoryStyles.emptyState}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {searchQuery ?
                  `No items found matching "${searchQuery}"` :
                  `No items in ${ITEM_CATEGORIES.find(c => c.id === selectedCategory)?.name} category`
                }
              </motion.div>
            ) : (
              filteredItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.3
                  }}
                  layout
                >
                  <ItemCard
                    item={item}
                    size={isMobile ? 'sm' : 'md'}
                    showActions={true}
                    showQuantity={true}
                    showDescription={true}
                    onUse={(item) => {
                      console.log('Using item:', item.name);
                    }}
                    onSell={(item) => {
                      console.log('Selling item:', item.name);
                    }}
                    onDrop={(item) => {
                      console.log('Dropping item:', item.name);
                    }}
                    onInspect={(item) => {
                      console.log('Inspecting item:', item.name);
                    }}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default InventoryScreen;