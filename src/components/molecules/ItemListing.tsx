import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../atoms/Button';
import { PriceTag } from '../atoms/PriceTag';
import { RarityIndicator } from '../atoms/RarityIndicator';
import { ShopType, ShopInventoryItem } from '../../types/shop';
import { EnhancedItem } from '../../types/inventory';
import { useGameState } from '../../contexts/ReactGameContext';

export interface ItemListingProps {
  /** Item to display */
  item: EnhancedItem;
  /** Shop inventory item data (contains price, unlock status) */
  shopItem: ShopInventoryItem;
  /** Shop type for context */
  shopType: ShopType;
  /** Transaction mode: buy or sell */
  mode: 'buy' | 'sell';
  /** Callback when transaction is initiated */
  onTransaction: (item: EnhancedItem, quantity: number, mode: 'buy' | 'sell') => void;
  /** Whether the item listing is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

// Styles for ItemListing
const itemListingStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    padding: '1rem',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
    borderRadius: '12px',
    border: '2px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s ease',
  },
  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  locked: {
    background: 'linear-gradient(135deg, rgba(100, 100, 100, 0.1), rgba(80, 80, 80, 0.05))',
    border: '2px solid rgba(150, 150, 150, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  titleSection: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: '1rem',
    fontWeight: 'bold' as const,
    color: '#d4af37',
    margin: '0 0 0.25rem 0',
    lineHeight: 1.2,
  },
  category: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    margin: 0,
  },
  badges: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  description: {
    fontSize: '0.875rem',
    color: '#e2e8f0',
    lineHeight: 1.4,
    margin: 0,
  },
  stats: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  stat: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#60a5fa',
    fontWeight: '600' as const,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '0.5rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  quantityControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  quantityButton: {
    minWidth: '32px',
    minHeight: '32px',
    padding: '0.25rem',
    fontSize: '1rem',
    fontWeight: 'bold' as const,
  },
  quantityDisplay: {
    minWidth: '40px',
    textAlign: 'center' as const,
    fontSize: '1rem',
    fontWeight: 'bold' as const,
    color: '#FFD700',
  },
  lockBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    fontSize: '0.7rem',
    fontWeight: 'bold' as const,
    color: '#ef4444',
    whiteSpace: 'nowrap' as const,
  },
  unlockRequirement: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontStyle: 'italic' as const,
    marginTop: '0.25rem',
  },
};

/**
 * ItemListing - Display individual shop item with buy/sell options
 *
 * Shows item details, pricing, unlock status, and quantity controls.
 * Provides kid-friendly affordability indicators and clear action buttons.
 *
 * @example
 * ```tsx
 * // Buy mode
 * <ItemListing
 *   item={healthPotion}
 *   shopItem={shopInventoryItem}
 *   shopType="general"
 *   mode="buy"
 *   onTransaction={handleBuy}
 * />
 *
 * // Sell mode
 * <ItemListing
 *   item={oldSword}
 *   shopItem={shopInventoryItem}
 *   shopType="weapon"
 *   mode="sell"
 *   onTransaction={handleSell}
 * />
 * ```
 */
export const ItemListing: React.FC<ItemListingProps> = ({
  item,
  shopItem,
  mode,
  onTransaction,
  disabled = false,
  className = '',
}) => {
  const { gameState } = useGameState();
  const [quantity, setQuantity] = useState(1);

  // Determine if item is locked
  const isLocked = shopItem?.unlocked === false;

  // Calculate price based on mode
  const price = useMemo(() => {
    if (mode === 'buy') {
      return shopItem?.price ?? item?.value ?? 0;
    } else {
      return shopItem?.sellPrice ?? Math.floor((item?.value ?? 0) * 0.5);
    }
  }, [mode, shopItem?.price, shopItem?.sellPrice, item?.value]);

  // Total price for selected quantity
  const totalPrice = price * quantity;

  // Check if player can afford (for buy mode)
  const canAfford = useMemo(() => {
    if (mode === 'sell') return true;
    const playerGold = gameState?.player?.gold ?? 0;
    return playerGold >= totalPrice;
  }, [mode, gameState?.player?.gold, totalPrice]);

  // Check stock availability
  const hasStock = (shopItem?.stock ?? -1) === -1 || (shopItem?.stock ?? 0) >= quantity;

  // Max quantity player can buy/sell
  const maxQuantity = useMemo(() => {
    if (mode === 'buy') {
      const stock = shopItem?.stock ?? -1;
      if (stock === -1) return 99; // Unlimited stock
      return Math.min(stock, 99);
    } else {
      // Sell mode: max is quantity player owns
      return Math.min(item?.quantity ?? 1, 99);
    }
  }, [mode, shopItem?.stock, item?.quantity]);

  // Increment quantity
  const incrementQuantity = useCallback(() => {
    setQuantity(prev => Math.min(prev + 1, maxQuantity));
  }, [maxQuantity]);

  // Decrement quantity
  const decrementQuantity = useCallback(() => {
    setQuantity(prev => Math.max(prev - 1, 1));
  }, []);

  // Handle transaction
  const handleTransaction = useCallback(() => {
    if (disabled || isLocked || !hasStock || (mode === 'buy' && !canAfford)) {
      return;
    }
    onTransaction(item, quantity, mode);
  }, [disabled, isLocked, hasStock, canAfford, mode, onTransaction, item, quantity]);

  // Build unlock requirement text
  const getUnlockRequirement = (): string | null => {
    if (!shopItem?.unlockRequirements) return null;

    const req = shopItem.unlockRequirements;
    if (req?.level) return `Requires Level ${req.level}`;
    if (req?.storyChapter) return `Complete Chapter ${req.storyChapter}`;
    if (req?.questCompletion) return `Complete Quest: ${req.questCompletion}`;
    if (req?.areaCompletion) return `Complete Area: ${req.areaCompletion}`;

    return 'Requirements not met';
  };

  // Get button text
  const getButtonText = (): string => {
    if (isLocked) return 'Locked';
    if (!hasStock) return 'Out of Stock';
    if (mode === 'buy' && !canAfford) return 'Cannot Afford';
    return mode === 'buy' ? 'Buy' : 'Sell';
  };

  // Container styles
  const containerStyle = {
    ...itemListingStyles.container,
    ...(disabled || isLocked ? itemListingStyles.disabled : {}),
    ...(isLocked ? itemListingStyles.locked : {}),
  };

  return (
    <motion.div
      className={className}
      style={containerStyle}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role='article'
      aria-label={`${item?.name ?? 'Unknown Item'} - ${mode === 'buy' ? 'for sale' : 'selling'}`}
    >
      {/* Header */}
      <div style={itemListingStyles.header}>
        <div style={itemListingStyles.titleSection}>
          <h3 style={itemListingStyles.title}>{item?.name ?? 'Unknown Item'}</h3>
          <p style={itemListingStyles.category}>{item?.category ?? 'Item'}</p>
          {isLocked && <p style={itemListingStyles.unlockRequirement}>{getUnlockRequirement()}</p>}
        </div>

        <div style={itemListingStyles.badges}>
          <RarityIndicator rarity={item?.rarity ?? 'common'} size='medium' />
          {isLocked && <span style={itemListingStyles.lockBadge}>🔒 Locked</span>}
        </div>
      </div>

      {/* Description */}
      {item?.description && <p style={itemListingStyles.description}>{item.description}</p>}

      {/* Stats Preview (if equipment) */}
      {item?.stats && (
        <div style={itemListingStyles.stats}>
          {Object.entries(item.stats).map(([stat, value]) => (
            <span key={stat} style={itemListingStyles.stat}>
              {stat}: {value > 0 ? '+' : ''}
              {value}
            </span>
          ))}
        </div>
      )}

      {/* Footer with Price and Quantity Controls */}
      <div style={itemListingStyles.footer}>
        {/* Quantity Controls */}
        {!isLocked && (
          <div style={itemListingStyles.quantityControls}>
            <Button
              size='sm'
              variant='secondary'
              onClick={decrementQuantity}
              disabled={quantity <= 1 || disabled}
              style={itemListingStyles.quantityButton}
              aria-label='Decrease quantity'
            >
              −
            </Button>

            <span style={itemListingStyles.quantityDisplay} aria-live='polite'>
              {quantity}
            </span>

            <Button
              size='sm'
              variant='secondary'
              onClick={incrementQuantity}
              disabled={quantity >= maxQuantity || disabled}
              style={itemListingStyles.quantityButton}
              aria-label='Increase quantity'
            >
              +
            </Button>
          </div>
        )}

        {/* Price Display */}
        <PriceTag
          amount={totalPrice}
          size='medium'
          canAfford={mode === 'buy' ? canAfford : undefined}
        />

        {/* Action Button */}
        <Button
          variant={mode === 'buy' ? 'primary' : 'success'}
          size='md'
          onClick={handleTransaction}
          disabled={disabled || isLocked || !hasStock || (mode === 'buy' && !canAfford)}
          aria-label={`${getButtonText()} ${quantity} ${item?.name ?? 'item'}${quantity > 1 ? 's' : ''} for ${totalPrice} gold`}
        >
          {getButtonText()}
        </Button>
      </div>
    </motion.div>
  );
};

export default ItemListing;
