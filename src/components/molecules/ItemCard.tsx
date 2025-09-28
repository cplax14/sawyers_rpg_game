import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { RarityIndicator } from '../atoms/RarityIndicator';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { useInventory } from '../../hooks/useInventory';
import { useGameState } from '../../contexts/ReactGameContext';
import { useResponsive } from '../../hooks';
import { EnhancedItem, ItemCategory, ItemType } from '../../types/inventory';

interface ItemCardProps {
  item: EnhancedItem;
  onUse?: (item: EnhancedItem) => void;
  onSell?: (item: EnhancedItem) => void;
  onDrop?: (item: EnhancedItem) => void;
  onInspect?: (item: EnhancedItem) => void;
  showActions?: boolean;
  showQuantity?: boolean;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

// Temporary styles since PostCSS is disabled
const cardStyles = {
  container: {
    position: 'relative' as const,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
    borderRadius: '12px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(8px)'
  },
  containerSm: {
    padding: '0.75rem'
  },
  containerLg: {
    padding: '1.25rem'
  },
  containerDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  border: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '12px',
    padding: '2px',
    background: 'linear-gradient(135deg, transparent, transparent)',
    pointerEvents: 'none' as const
  },
  content: {
    position: 'relative' as const,
    zIndex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem'
  },
  titleContainer: {
    flex: 1,
    minWidth: 0
  },
  title: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#d4af37',
    margin: '0 0 0.25rem 0',
    lineHeight: '1.2',
    wordBreak: 'break-word' as const
  },
  titleSm: {
    fontSize: '0.9rem'
  },
  titleLg: {
    fontSize: '1.1rem'
  },
  category: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    margin: 0,
    fontWeight: '500'
  },
  quantityBadge: {
    background: 'rgba(212, 175, 55, 0.2)',
    borderRadius: '12px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#d4af37',
    whiteSpace: 'nowrap' as const,
    border: '1px solid rgba(212, 175, 55, 0.3)'
  },
  description: {
    fontSize: '0.8rem',
    color: '#e2e8f0',
    lineHeight: '1.4',
    margin: 0,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical' as const
  },
  descriptionSm: {
    fontSize: '0.75rem',
    WebkitLineClamp: 2
  },
  properties: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginTop: '0.5rem'
  },
  property: {
    fontSize: '0.7rem',
    padding: '0.2rem 0.4rem',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: '#cbd5e1'
  },
  stackable: {
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#4ade80'
  },
  consumable: {
    background: 'rgba(168, 85, 247, 0.2)',
    color: '#a855f7'
  },
  tradeable: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#3b82f6'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto',
    paddingTop: '0.5rem'
  },
  actionButton: {
    flex: 1,
    fontSize: '0.75rem',
    padding: '0.4rem 0.6rem'
  },
  primaryAction: {
    flex: 2
  },
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    zIndex: 10
  },
  messageOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    zIndex: 15,
    padding: '0.5rem',
    textAlign: 'center' as const
  },
  messageText: {
    fontSize: '0.8rem',
    color: '#10b981',
    fontWeight: 'bold',
    lineHeight: '1.2'
  },
  errorMessageText: {
    fontSize: '0.8rem',
    color: '#ef4444',
    fontWeight: 'bold',
    lineHeight: '1.2'
  },
  valueDisplay: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    marginTop: '0.5rem',
    display: 'flex',
    justifyContent: 'space-between'
  }
};

// Rarity colors and effects
const rarityColors = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#f59e0b',
  legendary: '#ef4444',
  mythical: '#ec4899'
};

const rarityGlow = {
  common: 'rgba(16, 185, 129, 0.2)',
  uncommon: 'rgba(59, 130, 246, 0.2)',
  rare: 'rgba(139, 92, 246, 0.2)',
  epic: 'rgba(245, 158, 11, 0.2)',
  legendary: 'rgba(239, 68, 68, 0.2)',
  mythical: 'rgba(236, 72, 153, 0.2)'
};

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onUse,
  onSell,
  onDrop,
  onInspect,
  showActions = true,
  showQuantity = true,
  showDescription = true,
  size = 'md',
  className = '',
  disabled = false
}) => {
  const { gameState } = useGameState();
  const { isMobile } = useResponsive();
  const { useItem, isLoading: inventoryLoading } = useInventory();

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [lastUseMessage, setLastUseMessage] = useState<string | null>(null);

  // Get rarity styling
  const rarityColor = rarityColors[item.rarity as keyof typeof rarityColors] || rarityColors.common;
  const glowColor = rarityGlow[item.rarity as keyof typeof rarityGlow] || rarityGlow.common;

  // Determine item properties
  const itemProperties = useMemo(() => {
    const props: Array<{ key: string; label: string; type: string }> = [];

    if (item.stackable) {
      props.push({ key: 'stackable', label: 'Stackable', type: 'stackable' });
    }

    if (item.itemType === 'consumable') {
      props.push({ key: 'consumable', label: 'Consumable', type: 'consumable' });
    }

    if (item.tradeable !== false) {
      props.push({ key: 'tradeable', label: 'Tradeable', type: 'tradeable' });
    }

    return props;
  }, [item]);

  // Handle item usage
  const handleUse = useCallback(async () => {
    if (disabled || isLoading || inventoryLoading) return;

    setIsLoading(true);
    try {
      if (onUse) {
        onUse(item);
      } else if (item.itemType === 'consumable') {
        const result = await useItem(item.id, 1);
        if (result.success) {
          console.log(`✅ ${result.message}`);
          setLastUseMessage(result.message);
          // Clear message after 3 seconds
          setTimeout(() => setLastUseMessage(null), 3000);

          if (result.effects.length > 0) {
            result.effects.forEach(effect => {
              console.log(`  - ${effect.message}`);
            });
          }
        } else {
          console.error(`❌ Failed to use ${item.name}: ${result.message}`);
          setLastUseMessage(`Error: ${result.message}`);
          setTimeout(() => setLastUseMessage(null), 3000);
        }
      }
    } catch (error) {
      console.error('Error using item:', error);
    } finally {
      setIsLoading(false);
    }
  }, [item, onUse, useItem, disabled, isLoading, inventoryLoading]);

  // Handle card click (inspect)
  const handleCardClick = useCallback(() => {
    if (disabled || isLoading) return;

    if (onInspect) {
      onInspect(item);
    } else {
      setShowFullDescription(!showFullDescription);
    }
  }, [item, onInspect, disabled, isLoading, showFullDescription]);

  // Get container styles based on size
  const getContainerStyles = () => {
    const base = {
      ...cardStyles.container,
      border: `2px solid ${rarityColor}`,
      boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1), 0 0 20px ${glowColor}`
    };

    if (size === 'sm') Object.assign(base, cardStyles.containerSm);
    if (size === 'lg') Object.assign(base, cardStyles.containerLg);
    if (disabled) Object.assign(base, cardStyles.containerDisabled);

    return base;
  };

  // Get title styles based on size
  const getTitleStyles = () => {
    const base = { ...cardStyles.title };
    if (size === 'sm') Object.assign(base, cardStyles.titleSm);
    if (size === 'lg') Object.assign(base, cardStyles.titleLg);
    return base;
  };

  // Format category display
  const getCategoryDisplay = () => {
    if (item.category) {
      return item.category.charAt(0).toUpperCase() + item.category.slice(1);
    }
    return item.itemType || 'Item';
  };

  return (
    <motion.div
      className={className}
      style={getContainerStyles()}
      onClick={handleCardClick}
      whileHover={disabled ? {} : {
        scale: 1.02,
        boxShadow: `0 4px 16px rgba(0, 0, 0, 0.15), 0 0 30px ${glowColor}`
      }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* Content */}
      <div style={cardStyles.content}>
        {/* Header */}
        <div style={cardStyles.header}>
          <div style={cardStyles.titleContainer}>
            <h3 style={getTitleStyles()}>
              {item.name}
            </h3>
            <p style={cardStyles.category}>
              {getCategoryDisplay()}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            {/* Rarity Indicator */}
            <RarityIndicator rarity={item.rarity} size={size} />

            {/* Quantity Badge */}
            {showQuantity && item.quantity && item.quantity > 1 && (
              <motion.div
                style={cardStyles.quantityBadge}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                ×{item.quantity}
              </motion.div>
            )}
          </div>
        </div>

        {/* Description */}
        {showDescription && item.description && (
          <AnimatePresence>
            <motion.p
              style={{
                ...cardStyles.description,
                ...(size === 'sm' ? cardStyles.descriptionSm : {}),
                WebkitLineClamp: showFullDescription ? 'unset' : (size === 'sm' ? 2 : 3)
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {item.description}
            </motion.p>
          </AnimatePresence>
        )}

        {/* Item Properties */}
        {itemProperties.length > 0 && (
          <motion.div
            style={cardStyles.properties}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {itemProperties.map((prop, index) => (
              <motion.span
                key={prop.key}
                style={{
                  ...cardStyles.property,
                  ...(cardStyles[prop.type as keyof typeof cardStyles] || {})
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                {prop.label}
              </motion.span>
            ))}
          </motion.div>
        )}

        {/* Value/Stats Display */}
        {(item.value || item.weight) && (
          <div style={cardStyles.valueDisplay}>
            {item.value && <span>Value: {item.value}g</span>}
            {item.weight && <span>Weight: {item.weight}</span>}
          </div>
        )}

        {/* Actions */}
        {showActions && !disabled && size !== 'sm' && (
          <motion.div
            style={cardStyles.actions}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Primary Action (Use/Consume) */}
            {item.itemType === 'consumable' && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUse();
                }}
                disabled={isLoading || inventoryLoading}
                style={cardStyles.primaryAction}
              >
                {isLoading ? 'Using...' : 'Use'}
              </Button>
            )}

            {/* Secondary Actions */}
            {onSell && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSell(item);
                }}
                disabled={isLoading || inventoryLoading}
                style={cardStyles.actionButton}
              >
                Sell
              </Button>
            )}

            {onDrop && (
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDrop(item);
                }}
                disabled={isLoading || inventoryLoading}
                style={cardStyles.actionButton}
              >
                Drop
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {(isLoading || inventoryLoading) && (
          <motion.div
            style={cardStyles.loadingOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingSpinner size="sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Use Message Overlay */}
      <AnimatePresence>
        {lastUseMessage && (
          <motion.div
            style={cardStyles.messageOverlay}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <div style={
              lastUseMessage.startsWith('Error:')
                ? cardStyles.errorMessageText
                : cardStyles.messageText
            }>
              {lastUseMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ItemCard;