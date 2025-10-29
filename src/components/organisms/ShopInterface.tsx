import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { GoldBalance } from '../atoms/GoldBalance';
import { ItemListing } from '../molecules/ItemListing';
import { ShopkeeperDialog } from '../molecules/ShopkeeperDialog';
import { TransactionModal } from '../molecules/TransactionModal';
import { ShopCategoryFilter } from '../molecules/ShopCategoryFilter';
import { ShopTutorial } from './ShopTutorial';
import { useShop } from '../../hooks/useShop';
import { useReactGame } from '../../contexts/ReactGameContext';
import { useGameData } from '../../hooks/useGameData';
import { EnhancedItem } from '../../types/inventory';
import { ShopInventoryItem, ShopkeeperMood } from '../../types/shop';
import { SHOP_CATEGORY_NAMES } from '../../types/shop';

export interface ShopInterfaceProps {
  /** Shop ID to display */
  shopId: string;
  /** Callback when shop is closed */
  onClose: () => void;
  /** Additional className */
  className?: string;
}

// Styles for ShopInterface
const shopInterfaceStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(8px)',
  },
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '90vw',
    maxWidth: '1200px',
    height: '85vh',
    maxHeight: '900px',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    borderRadius: '20px',
    border: '3px solid rgba(139, 92, 246, 0.4)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
    position: 'relative' as const,
  },
  header: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1.5rem',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.1))',
    borderBottom: '2px solid rgba(139, 92, 246, 0.3)',
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 'bold' as const,
    color: '#d4af37',
    margin: '0 0 0.25rem 0',
  },
  subtitle: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    margin: 0,
  },
  closeButton: {
    minWidth: '100px',
  },
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
  },
  tab: {
    flex: 1,
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 'bold' as const,
    borderRadius: '12px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  activeTab: {
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    color: '#fff',
    border: '2px solid rgba(139, 92, 246, 0.5)',
  },
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  mainPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '1.5rem',
    gap: '1rem',
    overflow: 'hidden',
  },
  searchContainer: {
    position: 'relative' as const,
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 1rem',
    borderRadius: '12px',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'all 0.3s ease',
  },
  searchIcon: {
    position: 'absolute' as const,
    right: '1rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#8b5cf6',
    fontSize: '1.25rem',
    pointerEvents: 'none' as const,
  },
  itemListContainer: {
    flex: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    paddingRight: '0.5rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    textAlign: 'center' as const,
    color: '#94a3b8',
    gap: '1rem',
  },
  emptyStateIcon: {
    fontSize: '4rem',
  },
  emptyStateText: {
    fontSize: '1.125rem',
    margin: 0,
  },
  lockedShopOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    padding: '2rem',
    zIndex: 10,
  },
  lockedIcon: {
    fontSize: '5rem',
  },
  lockedTitle: {
    fontSize: '2rem',
    fontWeight: 'bold' as const,
    color: '#d4af37',
    margin: 0,
  },
  lockedMessage: {
    fontSize: '1.125rem',
    color: '#e2e8f0',
    textAlign: 'center' as const,
    maxWidth: '500px',
    lineHeight: 1.6,
    margin: 0,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    gap: '1rem',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    gap: '1rem',
    color: '#ef4444',
  },
};

// Categories available for filtering
const AVAILABLE_CATEGORIES = [
  'all',
  'weapons',
  'armor',
  'consumables',
  'materials',
  'magic',
  'accessories',
];

/**
 * ShopInterface - Main shop UI container
 *
 * Complete shop system with buy/sell modes, category filtering, item search,
 * shopkeeper dialogue, and transaction management. Designed for ages 7-12
 * with kid-friendly feedback and clear visual indicators.
 *
 * Features:
 * - Three-panel layout (shopkeeper, items, actions)
 * - Buy/sell tab switching
 * - Category filtering
 * - Item search
 * - Transaction confirmation modals
 * - Keyboard navigation (Tab, Enter, Escape)
 * - Responsive design
 * - Loading and error states
 * - Shop unlock requirements display
 *
 * @example
 * ```tsx
 * <ShopInterface
 *   shopId="mistwood-general-store"
 *   onClose={handleClose}
 * />
 * ```
 */
export const ShopInterface: React.FC<ShopInterfaceProps> = ({
  shopId,
  onClose,
  className = '',
}) => {
  const { state, completeShopTutorial } = useReactGame();
  const { data: gameData, isLoading: isGameDataLoading } = useGameData();
  const {
    shop,
    shopInventory,
    isLoading,
    error,
    isUnlocked,
    unlockRequirement,
    buyItem,
    sellItem,
    canAfford,
    getPricingInfo,
  } = useShop(shopId);

  // Check if this is the player's first shop visit
  // Add defensive check to ensure shops state exists
  const isFirstShopVisit = !state?.shops?.shopTutorialCompleted;
  const [showTutorial, setShowTutorial] = useState(isFirstShopVisit);

  // UI state
  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<{
    item: EnhancedItem;
    shopItem: ShopInventoryItem;
    quantity: number;
  } | null>(null);
  const [isTransacting, setIsTransacting] = useState(false);
  const [shopkeeperMessage, setShopkeeperMessage] = useState<string>('');
  const [shopkeeperMood, setShopkeeperMood] = useState<ShopkeeperMood>('neutral');

  // Refs for keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Set initial shopkeeper greeting
  useEffect(() => {
    if (shop?.shopkeeper?.dialogue?.greeting) {
      setShopkeeperMessage(shop.shopkeeper.dialogue.greeting);
      setShopkeeperMood(shop.shopkeeper.mood || 'neutral');
    }
  }, [shop]);

  // Get filtered items based on mode, category, and search
  const filteredItems = useMemo(() => {
    // Defensive checks: ensure we have necessary data
    // Return null if still loading to distinguish from "no items"
    if (isGameDataLoading) {
      return null;
    }

    if (!gameData?.items || !state?.inventory) {
      return [];
    }

    if (mode === 'buy') {
      // Buy mode: show shop inventory
      return shopInventory
        .filter(shopItem => {
          // Find the item data from game data
          const item = gameData.items.find(i => i.id === shopItem.itemId);
          if (!item) return false;

          // Category filter
          if (activeCategory !== 'all') {
            const itemCategory = item.category?.toLowerCase() || item.itemType?.toLowerCase() || '';
            if (itemCategory !== activeCategory.toLowerCase()) return false;
          }

          // Search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = item.name.toLowerCase().includes(query);
            const matchesDescription = item.description?.toLowerCase().includes(query);
            if (!matchesName && !matchesDescription) return false;
          }

          return true;
        })
        .map(shopItem => {
          const item = gameData.items.find(i => i.id === shopItem.itemId);
          return { item: item as EnhancedItem, shopItem };
        });
    } else {
      // Sell mode: show player inventory filtered by what shop buys
      const buyableCategories = shop?.buysCategories || [];

      return state.inventory
        .filter(item => {
          // Check if shop buys this category
          const itemCategory = item.category?.toLowerCase() || item.itemType?.toLowerCase() || '';
          const canSell = buyableCategories.some(cat => itemCategory.includes(cat.toLowerCase()));

          if (!canSell) return false;

          // Category filter
          if (activeCategory !== 'all') {
            if (itemCategory !== activeCategory.toLowerCase()) return false;
          }

          // Search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = item.name.toLowerCase().includes(query);
            const matchesDescription = item.description?.toLowerCase().includes(query);
            if (!matchesName && !matchesDescription) return false;
          }

          return true;
        })
        .map(item => {
          // Create a shop item representation for sell mode
          const shopItem: ShopInventoryItem = {
            itemId: item.id,
            sellPrice: Math.floor((item.value || 0) * 0.5),
            stock: -1,
            unlocked: true,
          };
          return { item, shopItem };
        });
    }
  }, [mode, activeCategory, searchQuery, shopInventory, state?.inventory, gameData?.items, shop, isGameDataLoading]);

  // Handle mode change
  const handleModeChange = useCallback(
    (newMode: 'buy' | 'sell') => {
      setMode(newMode);
      setActiveCategory('all');
      setSearchQuery('');

      // Update shopkeeper message
      if (newMode === 'buy' && shop?.shopkeeper?.dialogue?.greeting) {
        setShopkeeperMessage(shop.shopkeeper.dialogue.greeting);
        setShopkeeperMood('helpful');
      } else if (newMode === 'sell' && shop?.shopkeeper?.dialogue?.browsing) {
        setShopkeeperMessage(shop.shopkeeper.dialogue.browsing);
        setShopkeeperMood('neutral');
      }
    },
    [shop]
  );

  // Handle transaction initiation
  const handleTransactionInitiate = useCallback(
    (item: EnhancedItem, quantity: number, transactionMode: 'buy' | 'sell') => {
      // Find the shop item data
      const shopItem =
        mode === 'buy'
          ? shopInventory.find(si => si.itemId === item.id)
          : ({
              itemId: item.id,
              sellPrice: Math.floor((item.value || 0) * 0.5),
              stock: -1,
              unlocked: true,
            } as ShopInventoryItem);

      if (!shopItem) return;

      setSelectedItem({ item, shopItem, quantity });
    },
    [mode, shopInventory]
  );

  // Handle transaction confirmation
  const handleTransactionConfirm = useCallback(async () => {
    if (!selectedItem) return;

    setIsTransacting(true);

    try {
      if (mode === 'buy') {
        const result = await buyItem(selectedItem.item, selectedItem.quantity);

        if (result.success) {
          // Success message
          const message =
            shop?.shopkeeper?.dialogue?.buyDialogue ||
            'Thank you for your purchase! Come back anytime!';
          setShopkeeperMessage(message);
          setShopkeeperMood('happy');
        } else {
          // Error message
          const errorMsg = result.error?.message || 'Sorry, I cannot complete this purchase.';
          setShopkeeperMessage(errorMsg);
          setShopkeeperMood('neutral');
        }
      } else {
        const result = await sellItem(selectedItem.item, selectedItem.quantity);

        if (result.success) {
          // Success message
          const message =
            shop?.shopkeeper?.dialogue?.sellDialogue ||
            'Thank you! I will put these items to good use!';
          setShopkeeperMessage(message);
          setShopkeeperMood('happy');
        } else {
          // Error message
          const errorMsg = result.error?.message || 'Sorry, I cannot buy this item.';
          setShopkeeperMessage(errorMsg);
          setShopkeeperMood('neutral');
        }
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setShopkeeperMessage('Oops! Something went wrong. Please try again!');
      setShopkeeperMood('grumpy');
    } finally {
      setIsTransacting(false);
      setSelectedItem(null);
    }
  }, [selectedItem, mode, buyItem, sellItem, shop]);

  // Handle transaction cancel
  const handleTransactionCancel = useCallback(() => {
    setSelectedItem(null);

    // Update shopkeeper message
    if (shop?.shopkeeper?.dialogue?.browsing) {
      setShopkeeperMessage(shop.shopkeeper.dialogue.browsing);
      setShopkeeperMood('neutral');
    }
  }, [shop]);

  // Handle tutorial completion
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    completeShopTutorial();
  }, [completeShopTutorial]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if tutorial is active
      if (showTutorial) return;

      // Escape to close shop (if no modal is open)
      if (e.key === 'Escape' && !selectedItem) {
        e.preventDefault();
        onClose();
      }

      // Focus search with Ctrl/Cmd + F
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, onClose, showTutorial]);

  // Render game data loading state
  if (isGameDataLoading || !gameData) {
    return (
      <div style={shopInterfaceStyles.overlay} onClick={e => e.stopPropagation()}>
        <motion.div
          style={shopInterfaceStyles.container}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div style={shopInterfaceStyles.loadingContainer}>
            <LoadingSpinner size='large' />
            <p style={{ color: '#94a3b8', fontSize: '1.125rem', margin: 0 }}>Loading game data...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render shop loading state
  if (isLoading) {
    return (
      <div style={shopInterfaceStyles.overlay} onClick={e => e.stopPropagation()}>
        <motion.div
          style={shopInterfaceStyles.container}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div style={shopInterfaceStyles.loadingContainer}>
            <LoadingSpinner size='large' />
            <p style={{ color: '#94a3b8', fontSize: '1.125rem', margin: 0 }}>Opening shop...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render error state
  if (error || !shop) {
    return (
      <div style={shopInterfaceStyles.overlay} onClick={e => e.stopPropagation()}>
        <motion.div
          style={shopInterfaceStyles.container}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div style={shopInterfaceStyles.errorContainer}>
            <span style={{ fontSize: '4rem' }}>❌</span>
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Shop Not Found</p>
            <p style={{ fontSize: '1rem', margin: 0 }}>{error || 'This shop does not exist.'}</p>
            <Button variant='primary' onClick={onClose}>
              Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={shopInterfaceStyles.overlay} onClick={onClose}>
      <motion.div
        ref={containerRef}
        className={className}
        style={shopInterfaceStyles.container}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        onClick={e => e.stopPropagation()}
        role='dialog'
        aria-label={`${shop.name} shop interface`}
        aria-modal='true'
      >
        {/* Header */}
        <div style={shopInterfaceStyles.header}>
          <div style={shopInterfaceStyles.headerTop}>
            <div style={shopInterfaceStyles.titleSection}>
              <h1 style={shopInterfaceStyles.title}>
                {shop.theme?.icon} {shop.name}
              </h1>
              <p style={shopInterfaceStyles.subtitle}>
                {shop.shopkeeper.name} • {SHOP_CATEGORY_NAMES[shop.type] || shop.type}
              </p>
            </div>

            <div data-tutorial='gold-balance'>
              <GoldBalance size='large' showLabel={true} />
            </div>

            <Button
              variant='secondary'
              size='md'
              onClick={onClose}
              style={shopInterfaceStyles.closeButton}
              aria-label='Close shop'
            >
              Close Shop
            </Button>
          </div>

          {/* Shopkeeper Dialog */}
          <ShopkeeperDialog
            shopkeeper={shop.shopkeeper.name}
            message={shopkeeperMessage}
            mood={shopkeeperMood}
            avatar={shop.shopkeeper.avatar}
          />

          {/* Buy/Sell Tabs */}
          <div style={shopInterfaceStyles.tabContainer}>
            <motion.button
              style={{
                ...shopInterfaceStyles.tab,
                ...(mode === 'buy' ? shopInterfaceStyles.activeTab : {}),
              }}
              onClick={() => handleModeChange('buy')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              role='tab'
              aria-selected={mode === 'buy'}
              aria-controls='buy-panel'
              data-tutorial='buy-tab'
            >
              🛒 Buy Items
            </motion.button>

            <motion.button
              style={{
                ...shopInterfaceStyles.tab,
                ...(mode === 'sell' ? shopInterfaceStyles.activeTab : {}),
              }}
              onClick={() => handleModeChange('sell')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              role='tab'
              aria-selected={mode === 'sell'}
              aria-controls='sell-panel'
              data-tutorial='sell-tab'
            >
              💰 Sell Items
            </motion.button>
          </div>
        </div>

        {/* Main Content */}
        <div style={shopInterfaceStyles.content}>
          <div style={shopInterfaceStyles.mainPanel}>
            {/* Category Filter */}
            <div data-tutorial='category-filter'>
              <ShopCategoryFilter
                categories={AVAILABLE_CATEGORIES}
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>

            {/* Search Bar */}
            <div style={shopInterfaceStyles.searchContainer}>
              <input
                ref={searchInputRef}
                type='text'
                placeholder={`Search ${mode === 'buy' ? 'shop' : 'your'} items...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={shopInterfaceStyles.searchInput}
                aria-label='Search items'
              />
              <span style={shopInterfaceStyles.searchIcon} aria-hidden='true'>
                🔍
              </span>
            </div>

            {/* Item List */}
            <div
              style={shopInterfaceStyles.itemListContainer}
              role='tabpanel'
              id={`${mode}-panel`}
              aria-label={`${mode === 'buy' ? 'Shop' : 'Your'} inventory`}
            >
              {filteredItems === null ? (
                <div style={shopInterfaceStyles.emptyState}>
                  <span style={shopInterfaceStyles.emptyStateIcon}>⏳</span>
                  <p style={shopInterfaceStyles.emptyStateText}>
                    Loading items...
                  </p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div style={shopInterfaceStyles.emptyState}>
                  <span style={shopInterfaceStyles.emptyStateIcon}>📦</span>
                  <p style={shopInterfaceStyles.emptyStateText}>
                    {mode === 'buy'
                      ? searchQuery || activeCategory !== 'all'
                        ? 'No items match your search.'
                        : 'This shop has no items available right now.'
                      : searchQuery || activeCategory !== 'all'
                        ? 'No items match your search.'
                        : 'You have no items to sell to this shop.'}
                  </p>
                </div>
              ) : (
                filteredItems.map(({ item, shopItem }, index) => (
                  <div
                    key={`${mode}-${item.id}`}
                    data-tutorial={index === 0 ? 'item-listing' : undefined}
                  >
                    <ItemListing
                      item={item}
                      shopItem={shopItem}
                      shopType={shop.type}
                      mode={mode}
                      onTransaction={handleTransactionInitiate}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Locked Shop Overlay */}
        {!isUnlocked && (
          <div style={shopInterfaceStyles.lockedShopOverlay}>
            <span style={shopInterfaceStyles.lockedIcon}>🔒</span>
            <h2 style={shopInterfaceStyles.lockedTitle}>Shop Locked</h2>
            <p style={shopInterfaceStyles.lockedMessage}>
              {unlockRequirement || 'This shop is not yet available.'}
            </p>
            <Button variant='primary' size='lg' onClick={onClose}>
              Return to Exploration
            </Button>
          </div>
        )}

        {/* Transaction Modal */}
        {selectedItem && (
          <TransactionModal
            isOpen={true}
            item={selectedItem.item}
            quantity={selectedItem.quantity}
            transactionType={mode}
            totalPrice={getPricingInfo(selectedItem.item, selectedItem.quantity, mode).totalCost}
            onConfirm={handleTransactionConfirm}
            onCancel={handleTransactionCancel}
            isProcessing={isTransacting}
          />
        )}

        {/* Shop Tutorial */}
        {showTutorial && <ShopTutorial isFirstVisit={true} onComplete={handleTutorialComplete} />}
      </motion.div>
    </div>
  );
};

export default ShopInterface;
