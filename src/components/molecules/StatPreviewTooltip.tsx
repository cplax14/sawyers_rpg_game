import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { EnhancedItem, EquipmentSlot } from '../../types/inventory';
import { PlayerStats } from '../../types/game';
import { compareEquipment, checkEquipmentCompatibility } from '../../utils/equipmentUtils';

interface StatPreviewTooltipProps {
  currentItem?: EnhancedItem;
  previewItem?: EnhancedItem;
  slot: EquipmentSlot;
  baseStats: PlayerStats;
  playerLevel?: number;
  playerClass?: string;
  showValidation?: boolean;
  className?: string;
}

// Temporary styles since PostCSS is disabled
const tooltipStyles = {
  container: {
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(26, 26, 46, 0.95))',
    border: '1px solid rgba(212, 175, 55, 0.5)',
    borderRadius: '8px',
    padding: '0.75rem',
    fontSize: '0.8rem',
    color: '#f4f4f4',
    minWidth: '200px',
    maxWidth: '300px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    backdropFilter: 'blur(8px)',
  },
  header: {
    marginBottom: '0.5rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid rgba(212, 175, 55, 0.3)',
  },
  itemName: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#d4af37',
    margin: '0 0 0.25rem 0',
  },
  slotName: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    margin: 0,
  },
  statsSection: {
    marginBottom: '0.5rem',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem',
    padding: '0.2rem 0',
  },
  statLabel: {
    color: '#94a3b8',
  },
  statValue: {
    color: '#f4f4f4',
    fontWeight: 'bold',
  },
  changeSection: {
    borderTop: '1px solid rgba(212, 175, 55, 0.2)',
    paddingTop: '0.5rem',
  },
  changeTitle: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '0.25rem',
  },
  changeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.2rem',
    fontSize: '0.75rem',
  },
  improvementChange: {
    color: '#10b981',
  },
  degradeChange: {
    color: '#ef4444',
  },
  neutralChange: {
    color: '#94a3b8',
  },
  noItem: {
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  quickAction: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: '0.5rem',
    textAlign: 'center' as const,
  },
};

// Rarity colors
const rarityColors = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#f59e0b',
  legendary: '#ef4444',
  mythical: '#ec4899',
};

export const StatPreviewTooltip: React.FC<StatPreviewTooltipProps> = ({
  currentItem,
  previewItem,
  slot,
  baseStats,
  playerLevel = 1,
  playerClass = 'adventurer',
  showValidation = true,
  className = '',
}) => {
  // Calculate stat changes if previewing an item
  const statComparison = useMemo(() => {
    if (!previewItem) return null;
    return compareEquipment(currentItem, previewItem, baseStats);
  }, [currentItem, previewItem, baseStats]);

  // Check validation if previewing an item
  const validationResult = useMemo(() => {
    if (!previewItem || !showValidation) return null;
    return checkEquipmentCompatibility(previewItem, slot, playerLevel, playerClass, baseStats);
  }, [previewItem, slot, playerLevel, playerClass, baseStats, showValidation]);

  // Get display item (preview item or current item)
  const displayItem = previewItem || currentItem;

  // Format stat display
  const formatStatValue = (value: number) => {
    return value > 0 ? `+${value}` : value === 0 ? '0' : value.toString();
  };

  // Format slot name
  const formatSlotName = (slot: EquipmentSlot) => {
    return slot.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    return rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common;
  };

  if (!displayItem) {
    return (
      <motion.div
        className={className}
        style={tooltipStyles.container}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div style={tooltipStyles.header}>
          <h4 style={tooltipStyles.itemName}>Empty {formatSlotName(slot)}</h4>
        </div>
        <div style={tooltipStyles.noItem}>No item equipped in this slot</div>
        <div style={tooltipStyles.quickAction}>Click to equip an item</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      style={{
        ...tooltipStyles.container,
        borderColor: getRarityColor(displayItem.rarity),
      }}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
    >
      {/* Header */}
      <div style={tooltipStyles.header}>
        <h4
          style={{
            ...tooltipStyles.itemName,
            color: getRarityColor(displayItem.rarity),
          }}
        >
          {displayItem.name}
        </h4>
        <p style={tooltipStyles.slotName}>
          {displayItem.rarity} • {formatSlotName(slot)}
        </p>
      </div>

      {/* Current Stats */}
      <div style={tooltipStyles.statsSection}>
        {displayItem.statModifiers && Object.entries(displayItem.statModifiers).length > 0 ? (
          Object.entries(displayItem.statModifiers).map(([stat, modifier]) => (
            <div key={stat} style={tooltipStyles.statRow}>
              <span style={tooltipStyles.statLabel}>
                {stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
              </span>
              <span
                style={{
                  ...tooltipStyles.statValue,
                  color:
                    modifier.value > 0 ? '#10b981' : modifier.value < 0 ? '#ef4444' : '#94a3b8',
                }}
              >
                {formatStatValue(modifier.value)}
              </span>
            </div>
          ))
        ) : (
          <div style={tooltipStyles.noItem}>No stat bonuses</div>
        )}
      </div>

      {/* Stat Changes (if previewing) */}
      {previewItem && statComparison && (
        <div style={tooltipStyles.changeSection}>
          <div style={tooltipStyles.changeTitle}>
            {statComparison.isUpgrade ? '↗ Upgrade Preview' : '↘ Change Preview'}
          </div>

          {Object.entries(statComparison.statChanges).map(([stat, change]) => {
            if (change === 0) return null;

            return (
              <motion.div
                key={stat}
                style={{
                  ...tooltipStyles.changeRow,
                  ...(change > 0
                    ? tooltipStyles.improvementChange
                    : change < 0
                      ? tooltipStyles.degradeChange
                      : tooltipStyles.neutralChange),
                }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span>
                  {stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                </span>
                <span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                  >
                    {change > 0 ? '+' : ''}
                    {change}
                  </motion.span>
                  <span style={{ marginLeft: '0.25rem' }}>{change > 0 ? '↑' : '↓'}</span>
                </span>
              </motion.div>
            );
          })}

          {/* Total Change */}
          <motion.div
            style={{
              ...tooltipStyles.changeRow,
              borderTop: '1px solid rgba(212, 175, 55, 0.2)',
              paddingTop: '0.25rem',
              marginTop: '0.25rem',
              fontWeight: 'bold',
              ...(statComparison.totalStatChange > 0
                ? tooltipStyles.improvementChange
                : statComparison.totalStatChange < 0
                  ? tooltipStyles.degradeChange
                  : tooltipStyles.neutralChange),
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <span>Total Change:</span>
            <span>
              {statComparison.totalStatChange > 0 ? '+' : ''}
              {statComparison.totalStatChange}
              <motion.span
                style={{ marginLeft: '0.25rem' }}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                {statComparison.isUpgrade ? '📈' : '📉'}
              </motion.span>
            </span>
          </motion.div>
        </div>
      )}

      {/* Quick Action Hint */}
      <div style={tooltipStyles.quickAction}>
        {previewItem ? 'Click to equip' : 'Click to change equipment'}
      </div>
    </motion.div>
  );
};

export default StatPreviewTooltip;
