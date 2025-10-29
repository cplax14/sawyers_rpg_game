import React, { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../atoms/Card';
import { EnhancedItem, StatModifier } from '../../types/inventory';
import { PlayerStats } from '../../types/game';

interface StatComparisonProps {
  currentItem?: EnhancedItem;
  newItem: EnhancedItem;
  baseStats: PlayerStats;
  className?: string;
  showNetChange?: boolean;
  highlightChanges?: boolean;
  compact?: boolean;
}

interface StatChange {
  stat: keyof PlayerStats;
  current: number;
  new: number;
  change: number;
  isImprovement: boolean;
  percentage: number;
  significance: 'none' | 'minor' | 'significant' | 'major';
}

// Temporary styles since PostCSS is disabled
const comparisonStyles = {
  container: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    padding: '1rem',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#d4af37',
    margin: '0 0 0.5rem 0',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0,
  },
  compactTitle: {
    fontSize: '1rem',
    margin: '0 0 0.75rem 0',
  },
  comparison: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  compactComparison: {
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  itemSection: {
    flex: 1,
    padding: '0.75rem',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  compactItemSection: {
    padding: '0.5rem',
  },
  itemHeader: {
    textAlign: 'center' as const,
    marginBottom: '0.75rem',
  },
  itemName: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#f4f4f4',
    margin: '0 0 0.25rem 0',
  },
  itemRarity: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    margin: 0,
  },
  compactItemName: {
    fontSize: '0.8rem',
    margin: '0 0 0.25rem 0',
  },
  statsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  compactStatsList: {
    gap: '0.25rem',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    background: 'rgba(255, 255, 255, 0.02)',
    fontSize: '0.8rem',
  },
  compactStatRow: {
    padding: '0.2rem 0.4rem',
    fontSize: '0.75rem',
  },
  statLabel: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  statValue: {
    color: '#f4f4f4',
    fontWeight: 'bold',
  },
  netChangeSection: {
    borderTop: '1px solid rgba(212, 175, 55, 0.3)',
    paddingTop: '1rem',
  },
  compactNetChangeSection: {
    paddingTop: '0.75rem',
  },
  netChangeTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#d4af37',
    textAlign: 'center' as const,
    margin: '0 0 0.75rem 0',
  },
  compactNetChangeTitle: {
    fontSize: '0.9rem',
    margin: '0 0 0.5rem 0',
  },
  changeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem',
    borderRadius: '6px',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  compactChangeRow: {
    padding: '0.3rem',
    marginBottom: '0.3rem',
    fontSize: '0.8rem',
  },
  changeImprovement: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#10b981',
  },
  changeDegrade: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
  },
  changeNeutral: {
    background: 'rgba(156, 163, 175, 0.1)',
    border: '1px solid rgba(156, 163, 175, 0.3)',
    color: '#9ca3af',
  },
  arrow: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
  },
  compactArrow: {
    fontSize: '1rem',
  },
  noChangeText: {
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontStyle: 'italic',
    fontSize: '0.8rem',
    padding: '0.5rem',
  },
  statChangeIcon: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginLeft: '0.5rem',
    display: 'inline-block',
  },
  compactStatChangeIcon: {
    fontSize: '1rem',
  },
  improvementIcon: {
    color: '#10b981',
    textShadow: '0 0 4px rgba(16, 185, 129, 0.5)',
  },
  degradeIcon: {
    color: '#ef4444',
    textShadow: '0 0 4px rgba(239, 68, 68, 0.5)',
  },
  neutralIcon: {
    color: '#94a3b8',
  },
  significantChange: {
    fontWeight: 'bold',
    textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
  },
  percentageChange: {
    fontSize: '0.7rem',
    opacity: 0.8,
    marginLeft: '0.25rem',
  },
  totalStatSummary: {
    borderTop: '1px solid rgba(212, 175, 55, 0.2)',
    marginTop: '0.5rem',
    paddingTop: '0.5rem',
    textAlign: 'center' as const,
  },
  totalStatValue: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '0.25rem',
  },
  totalStatLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  animatedBadge: {
    display: 'inline-block',
    padding: '0.2rem 0.5rem',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    marginLeft: '0.5rem',
    border: '1px solid',
  },
  majorUpgradeBadge: {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#10b981',
    borderColor: '#10b981',
  },
  minorUpgradeBadge: {
    background: 'rgba(34, 197, 94, 0.15)',
    color: '#22c55e',
    borderColor: '#22c55e',
  },
  majorDowngradeBadge: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderColor: '#ef4444',
  },
  minorDowngradeBadge: {
    background: 'rgba(248, 113, 113, 0.15)',
    color: '#f87171',
    borderColor: '#f87171',
  },
};

// Rarity colors for items
const rarityColors = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#f59e0b',
  legendary: '#ef4444',
  mythical: '#ec4899',
};

export const StatComparison: React.FC<StatComparisonProps> = ({
  currentItem,
  newItem,
  baseStats,
  className = '',
  showNetChange = true,
  highlightChanges = true,
  compact = false,
}) => {
  // Helper function to get visual change indicator
  const getChangeIndicator = useCallback((change: number, baseValue: number) => {
    const percentage = baseValue > 0 ? (change / baseValue) * 100 : 0;
    const absoluteChange = Math.abs(change);

    if (change === 0) {
      return {
        icon: '→',
        style: comparisonStyles.neutralIcon,
        significance: 'none' as const,
        badge: null,
      };
    }

    const isSignificant = absoluteChange >= 5 || Math.abs(percentage) >= 20;
    const isMajor = absoluteChange >= 10 || Math.abs(percentage) >= 50;

    if (change > 0) {
      return {
        icon: isMajor ? '⬆⬆' : '⬆',
        style: {
          ...comparisonStyles.improvementIcon,
          ...(isMajor ? { fontSize: '1.3em', animation: 'pulse 2s infinite' } : {}),
        },
        significance: isMajor ? 'major' : isSignificant ? 'significant' : ('minor' as const),
        badge: isMajor ? 'major_upgrade' : isSignificant ? 'minor_upgrade' : null,
        percentage,
      };
    } else {
      return {
        icon: isMajor ? '⬇⬇' : '⬇',
        style: {
          ...comparisonStyles.degradeIcon,
          ...(isMajor ? { fontSize: '1.3em', animation: 'pulse 2s infinite' } : {}),
        },
        significance: isMajor ? 'major' : isSignificant ? 'significant' : ('minor' as const),
        badge: isMajor ? 'major_downgrade' : isSignificant ? 'minor_downgrade' : null,
        percentage,
      };
    }
  }, []);

  // Calculate stat changes
  const statChanges = useMemo((): StatChange[] => {
    const changes: StatChange[] = [];

    // Get all possible stats
    const allStats = new Set<keyof PlayerStats>();
    Object.keys(baseStats).forEach(stat => allStats.add(stat as keyof PlayerStats));
    if (currentItem?.statModifiers) {
      Object.keys(currentItem.statModifiers).forEach(stat =>
        allStats.add(stat as keyof PlayerStats)
      );
    }
    if (newItem.statModifiers) {
      Object.keys(newItem.statModifiers).forEach(stat => allStats.add(stat as keyof PlayerStats));
    }

    allStats.forEach(stat => {
      const currentBonus = currentItem?.statModifiers?.[stat] || 0;
      const newBonus = newItem.statModifiers?.[stat] || 0;
      const change = newBonus - currentBonus;

      const baseValue = baseStats[stat] || 10;
      const percentage = baseValue > 0 ? (change / baseValue) * 100 : 0;
      const absoluteChange = Math.abs(change);
      const significance =
        absoluteChange >= 10 || Math.abs(percentage) >= 50
          ? 'major'
          : absoluteChange >= 5 || Math.abs(percentage) >= 20
            ? 'significant'
            : change !== 0
              ? 'minor'
              : 'none';

      changes.push({
        stat,
        current: currentBonus,
        new: newBonus,
        change,
        isImprovement: change > 0,
        percentage,
        significance,
      });
    });

    return changes.filter(change => change.current !== 0 || change.new !== 0 || showNetChange);
  }, [currentItem, newItem, baseStats, showNetChange]);

  // Filter for only changed stats if highlighting changes
  const relevantChanges = useMemo(() => {
    return highlightChanges ? statChanges.filter(change => change.change !== 0) : statChanges;
  }, [statChanges, highlightChanges]);

  const hasChanges = relevantChanges.length > 0;

  // Get rarity color for items
  const getRarityColor = (rarity: string) => {
    return rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common;
  };

  // Format stat name for display
  const formatStatName = (stat: string) => {
    return stat.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <div
      className={className}
      style={{
        ...comparisonStyles.container,
        ...(compact ? { padding: '0.75rem' } : {}),
      }}
    >
      {/* Header */}
      <div style={comparisonStyles.header}>
        <h3
          style={{
            ...comparisonStyles.title,
            ...(compact ? comparisonStyles.compactTitle : {}),
          }}
        >
          Equipment Comparison
        </h3>
        {!compact && (
          <p style={comparisonStyles.subtitle}>Compare current equipment with new item</p>
        )}
      </div>

      {/* Item Comparison */}
      <div
        style={{
          ...comparisonStyles.comparison,
          ...(compact ? comparisonStyles.compactComparison : {}),
        }}
      >
        {/* Current Item */}
        <motion.div
          style={{
            ...comparisonStyles.itemSection,
            ...(compact ? comparisonStyles.compactItemSection : {}),
            ...(currentItem
              ? { borderLeft: `3px solid ${getRarityColor(currentItem.rarity)}` }
              : {}),
          }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={comparisonStyles.itemHeader}>
            <h4
              style={{
                ...comparisonStyles.itemName,
                ...(compact ? comparisonStyles.compactItemName : {}),
              }}
            >
              {currentItem ? currentItem.name : 'No Item Equipped'}
            </h4>
            {currentItem && <p style={comparisonStyles.itemRarity}>{currentItem.rarity}</p>}
          </div>

          <div
            style={{
              ...comparisonStyles.statsList,
              ...(compact ? comparisonStyles.compactStatsList : {}),
            }}
          >
            {statChanges.map(({ stat, current }) => (
              <div
                key={stat}
                style={{
                  ...comparisonStyles.statRow,
                  ...(compact ? comparisonStyles.compactStatRow : {}),
                }}
              >
                <span style={comparisonStyles.statLabel}>{formatStatName(stat)}:</span>
                <span style={comparisonStyles.statValue}>
                  {current > 0 ? `+${current}` : current === 0 ? '0' : current}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Arrow */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              ...comparisonStyles.arrow,
              ...(compact ? comparisonStyles.compactArrow : {}),
              color: '#d4af37',
            }}
          >
            →
          </span>
        </div>

        {/* New Item */}
        <motion.div
          style={{
            ...comparisonStyles.itemSection,
            ...(compact ? comparisonStyles.compactItemSection : {}),
            borderLeft: `3px solid ${getRarityColor(newItem.rarity)}`,
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div style={comparisonStyles.itemHeader}>
            <h4
              style={{
                ...comparisonStyles.itemName,
                ...(compact ? comparisonStyles.compactItemName : {}),
              }}
            >
              {newItem.name}
            </h4>
            <p style={comparisonStyles.itemRarity}>{newItem.rarity}</p>
          </div>

          <div
            style={{
              ...comparisonStyles.statsList,
              ...(compact ? comparisonStyles.compactStatsList : {}),
            }}
          >
            {statChanges.map(({ stat, new: newValue }) => (
              <div
                key={stat}
                style={{
                  ...comparisonStyles.statRow,
                  ...(compact ? comparisonStyles.compactStatRow : {}),
                }}
              >
                <span style={comparisonStyles.statLabel}>{formatStatName(stat)}:</span>
                <span style={comparisonStyles.statValue}>
                  {newValue > 0 ? `+${newValue}` : newValue === 0 ? '0' : newValue}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Net Change Summary */}
      {showNetChange && (
        <motion.div
          style={{
            ...comparisonStyles.netChangeSection,
            ...(compact ? comparisonStyles.compactNetChangeSection : {}),
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h4
            style={{
              ...comparisonStyles.netChangeTitle,
              ...(compact ? comparisonStyles.compactNetChangeTitle : {}),
            }}
          >
            Net Changes
          </h4>

          {hasChanges ? (
            relevantChanges.map(
              ({ stat, change, isImprovement, percentage, significance }, index) => {
                const baseValue = baseStats[stat] || 10;
                const indicator = getChangeIndicator(change, baseValue);
                const showPercentage = Math.abs(percentage) >= 10;

                return (
                  <motion.div
                    key={stat}
                    style={{
                      ...comparisonStyles.changeRow,
                      ...(compact ? comparisonStyles.compactChangeRow : {}),
                      ...(change > 0
                        ? comparisonStyles.changeImprovement
                        : change < 0
                          ? comparisonStyles.changeDegrade
                          : comparisonStyles.changeNeutral),
                      ...(significance === 'major' || significance === 'significant'
                        ? comparisonStyles.significantChange
                        : {}),
                    }}
                    initial={{ opacity: 0, scale: 0.9, x: -10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      type: 'spring',
                      stiffness: 300,
                    }}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span>{formatStatName(stat)}</span>
                      {indicator.badge && (
                        <motion.span
                          style={{
                            ...comparisonStyles.animatedBadge,
                            ...(indicator.badge === 'major_upgrade'
                              ? comparisonStyles.majorUpgradeBadge
                              : indicator.badge === 'minor_upgrade'
                                ? comparisonStyles.minorUpgradeBadge
                                : indicator.badge === 'major_downgrade'
                                  ? comparisonStyles.majorDowngradeBadge
                                  : comparisonStyles.minorDowngradeBadge),
                          }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 + index * 0.05 }}
                        >
                          {indicator.badge.includes('major') ? 'MAJOR' : 'Notable'}
                        </motion.span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span
                        style={{
                          ...(significance === 'major' || significance === 'significant'
                            ? comparisonStyles.significantChange
                            : {}),
                        }}
                      >
                        {change > 0 ? '+' : ''}
                        {change}
                      </span>
                      <motion.span
                        style={{
                          ...comparisonStyles.statChangeIcon,
                          ...(compact ? comparisonStyles.compactStatChangeIcon : {}),
                          ...indicator.style,
                        }}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.1 + index * 0.05,
                          type: 'spring',
                          stiffness: 400,
                        }}
                      >
                        {indicator.icon}
                      </motion.span>
                      {showPercentage && (
                        <span style={comparisonStyles.percentageChange}>
                          ({percentage > 0 ? '+' : ''}
                          {percentage.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              }
            )
          ) : (
            <div style={comparisonStyles.noChangeText}>No stat changes</div>
          )}

          {/* Total Stat Impact Summary */}
          {hasChanges && (
            <motion.div
              style={{
                ...comparisonStyles.totalStatSummary,
                ...(compact ? { marginTop: '0.4rem', paddingTop: '0.4rem' } : {}),
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div
                style={{
                  ...comparisonStyles.totalStatValue,
                  ...(relevantChanges.reduce((sum, change) => sum + change.change, 0) > 0
                    ? { color: '#10b981' }
                    : { color: '#ef4444' }),
                }}
              >
                Total Change:{' '}
                {relevantChanges.reduce((sum, change) => sum + change.change, 0) > 0 ? '+' : ''}
                {relevantChanges.reduce((sum, change) => sum + change.change, 0)}
                <motion.span
                  style={{
                    marginLeft: '0.5rem',
                    fontSize: '1.2rem',
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  {relevantChanges.reduce((sum, change) => sum + change.change, 0) > 0
                    ? '📈'
                    : '📉'}
                </motion.span>
              </div>
              <div style={comparisonStyles.totalStatLabel}>Overall Equipment Impact</div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default StatComparison;
