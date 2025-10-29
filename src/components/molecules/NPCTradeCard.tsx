import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../atoms/Button';
import { NPCTrade, TradeItemRequirement, TradeItemOffer } from '../../types/shop';
import { useGameState } from '../../contexts/ReactGameContext';

export interface NPCTradeCardProps {
  /** Trade offer to display */
  trade: NPCTrade;
  /** Whether player can complete this trade */
  canTrade: boolean;
  /** Callback when trade is initiated */
  onTrade: (trade: NPCTrade) => void;
  /** Whether the trade card is disabled */
  disabled?: boolean;
  /** Additional className */
  className?: string;
}

// Styles for NPCTradeCard
const tradeCardStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1.25rem',
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))',
    borderRadius: '16px',
    border: '2px solid rgba(99, 102, 241, 0.3)',
    backdropFilter: 'blur(8px)',
    transition: 'all 0.3s ease',
  },
  disabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  completed: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05))',
    border: '2px solid rgba(34, 197, 94, 0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  npcInfo: {
    flex: 1,
  },
  npcName: {
    fontSize: '1.125rem',
    fontWeight: 'bold' as const,
    color: '#a78bfa',
    margin: '0 0 0.25rem 0',
  },
  tradeType: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    background: 'rgba(139, 92, 246, 0.2)',
    color: '#a78bfa',
    textTransform: 'capitalize' as const,
    display: 'inline-block',
  },
  badges: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    alignItems: 'flex-end',
  },
  badge: {
    fontSize: '0.7rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    fontWeight: 'bold' as const,
    whiteSpace: 'nowrap' as const,
  },
  repeatableBadge: {
    background: 'rgba(34, 197, 94, 0.2)',
    border: '1px solid rgba(34, 197, 94, 0.4)',
    color: '#22c55e',
  },
  oneTimeBadge: {
    background: 'rgba(245, 158, 11, 0.2)',
    border: '1px solid rgba(245, 158, 11, 0.4)',
    color: '#f59e0b',
  },
  completedBadge: {
    background: 'rgba(107, 114, 128, 0.2)',
    border: '1px solid rgba(107, 114, 128, 0.4)',
    color: '#9ca3af',
  },
  dialogue: {
    fontSize: '0.9375rem',
    color: '#e2e8f0',
    lineHeight: 1.5,
    fontStyle: 'italic' as const,
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    borderLeft: '3px solid rgba(139, 92, 246, 0.5)',
    margin: 0,
  },
  tradeSection: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemsList: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  sectionTitle: {
    fontSize: '0.75rem',
    fontWeight: 'bold' as const,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '0 0 0.5rem 0',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '6px',
    fontSize: '0.875rem',
  },
  itemName: {
    color: '#cbd5e1',
    fontWeight: '500' as const,
  },
  itemQuantity: {
    color: '#FFD700',
    fontWeight: 'bold' as const,
  },
  lackingItem: {
    opacity: 0.5,
    textDecoration: 'line-through',
  },
  arrow: {
    fontSize: '1.5rem',
    color: '#8b5cf6',
  },
  progressIndicator: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontStyle: 'italic' as const,
    marginTop: '0.5rem',
  },
};

/**
 * NPCTradeCard - Display individual NPC trade offers
 *
 * Kid-friendly trade card showing requirements, rewards, and NPC dialogue.
 * Provides clear visual feedback for tradeable/completed states.
 *
 * @example
 * ```tsx
 * <NPCTradeCard
 *   trade={npcTrade}
 *   canTrade={true}
 *   onTrade={handleTrade}
 * />
 * ```
 */
export const NPCTradeCard: React.FC<NPCTradeCardProps> = ({
  trade,
  canTrade,
  onTrade,
  disabled = false,
  className = '',
}) => {
  const { state } = useGameState();

  // Check if trade is completed
  const isCompleted = trade.completed === true;

  // Check which required items player has
  const requiredItemsStatus = useMemo(() => {
    return trade.requiredItems.map(req => {
      const playerItem = state.player.inventory.find(item => item.id === req.itemId);
      const hasEnough = playerItem && (playerItem.quantity || 0) >= req.quantity;

      return {
        ...req,
        hasEnough,
        playerQuantity: playerItem?.quantity || 0,
      };
    });
  }, [trade.requiredItems, state.player.inventory]);

  // Get repeatability badge text
  const getRepeatabilityText = (): string => {
    switch (trade.repeatability) {
      case 'one_time':
        return 'One Time';
      case 'repeatable':
        return 'Repeatable';
      case 'daily':
        return 'Daily';
      case 'weekly':
        return 'Weekly';
      default:
        return trade.repeatability;
    }
  };

  // Get container styles
  const getContainerStyles = () => {
    const base = { ...tradeCardStyles.container };
    if (disabled) Object.assign(base, tradeCardStyles.disabled);
    if (isCompleted) Object.assign(base, tradeCardStyles.completed);
    return base;
  };

  // Handle trade button click
  const handleTradeClick = () => {
    if (!disabled && !isCompleted && canTrade) {
      onTrade(trade);
    }
  };

  // Get button text
  const getButtonText = (): string => {
    if (isCompleted) return 'Completed';
    if (!canTrade) return 'Missing Items';
    return 'Trade';
  };

  return (
    <motion.div
      className={className}
      style={getContainerStyles()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      role='article'
      aria-label={`Trade offer from ${trade.npcName}`}
    >
      {/* Header */}
      <div style={tradeCardStyles.header}>
        <div style={tradeCardStyles.npcInfo}>
          <h3 style={tradeCardStyles.npcName}>{trade.npcName}</h3>
          <span style={tradeCardStyles.tradeType}>{trade.type}</span>
        </div>

        <div style={tradeCardStyles.badges}>
          {isCompleted && (
            <span style={{ ...tradeCardStyles.badge, ...tradeCardStyles.completedBadge }}>
              ✓ Completed
            </span>
          )}
          <span
            style={{
              ...tradeCardStyles.badge,
              ...(trade.repeatability === 'repeatable'
                ? tradeCardStyles.repeatableBadge
                : tradeCardStyles.oneTimeBadge),
            }}
          >
            {getRepeatabilityText()}
          </span>
        </div>
      </div>

      {/* NPC Dialogue */}
      <p style={tradeCardStyles.dialogue}>"{trade.dialogue}"</p>

      {/* Trade Details */}
      <div style={tradeCardStyles.tradeSection}>
        {/* Required Items */}
        <div style={tradeCardStyles.itemsList}>
          <p style={tradeCardStyles.sectionTitle}>You Give:</p>
          {requiredItemsStatus.map((item, index) => (
            <div
              key={`${item.itemId}-${index}`}
              style={{
                ...tradeCardStyles.item,
                ...(item.hasEnough ? {} : tradeCardStyles.lackingItem),
              }}
            >
              <span style={tradeCardStyles.itemName}>{item.itemId}</span>
              <span style={tradeCardStyles.itemQuantity}>
                ×{item.quantity} {!item.hasEnough && `(${item.playerQuantity})`}
              </span>
            </div>
          ))}
          {trade.goldRequired && trade.goldRequired > 0 && (
            <div style={tradeCardStyles.item}>
              <span style={tradeCardStyles.itemName}>Gold</span>
              <span style={tradeCardStyles.itemQuantity}>💰{trade.goldRequired}</span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div style={tradeCardStyles.arrow} aria-hidden='true'>
          →
        </div>

        {/* Offered Items */}
        <div style={tradeCardStyles.itemsList}>
          <p style={tradeCardStyles.sectionTitle}>You Get:</p>
          {trade.offeredItems.map((item, index) => (
            <div key={`${item.itemId}-${index}`} style={tradeCardStyles.item}>
              <span style={tradeCardStyles.itemName}>{item.itemId}</span>
              <span style={tradeCardStyles.itemQuantity}>
                ×{item.quantity}
                {item.chance && item.chance < 1 && ` (${Math.round(item.chance * 100)}%)`}
              </span>
            </div>
          ))}
          {trade.goldOffered && trade.goldOffered > 0 && (
            <div style={tradeCardStyles.item}>
              <span style={tradeCardStyles.itemName}>Gold</span>
              <span style={tradeCardStyles.itemQuantity}>💰{trade.goldOffered}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicator for Quest Chain */}
      {trade.requirements && trade.requirements.length > 0 && (
        <p style={tradeCardStyles.progressIndicator}>Part of a quest chain</p>
      )}

      {/* Trade Button */}
      <Button
        variant={canTrade && !isCompleted ? 'primary' : 'secondary'}
        size='md'
        onClick={handleTradeClick}
        disabled={disabled || isCompleted || !canTrade}
        fullWidth
        aria-label={`${getButtonText()} with ${trade.npcName}`}
      >
        {getButtonText()}
      </Button>
    </motion.div>
  );
};

export default NPCTradeCard;
