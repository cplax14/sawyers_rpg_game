import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { StatComparison } from './StatComparison';
import { EquipmentRestrictions } from './EquipmentRestrictions';
import { EnhancedItem, EquipmentSlot } from '../../types/inventory';
import { PlayerStats } from '../../types/game';
import { compareEquipment, checkEquipmentCompatibility } from '../../utils/equipmentUtils';

interface EquipmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEquip: (item: EnhancedItem) => void;
  slot: EquipmentSlot;
  slotName: string;
  currentItem?: EnhancedItem;
  availableItems: EnhancedItem[];
  baseStats: PlayerStats;
  playerLevel: number;
  playerClass: string;
  isLoading?: boolean;
  errorMessage?: string | null;
}

// Temporary styles since PostCSS is disabled
const modalStyles = {
  container: {
    maxHeight: '70vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '1rem',
    padding: '0 0.5rem'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0
  },
  content: {
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    gap: '1rem'
  },
  itemList: {
    flex: 1,
    maxHeight: '50vh',
    overflowY: 'auto' as const,
    padding: '0.5rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    border: '1px solid rgba(212, 175, 55, 0.2)'
  },
  comparison: {
    flex: 1,
    minWidth: '300px'
  },
  noItems: {
    textAlign: 'center' as const,
    color: '#94a3b8',
    fontStyle: 'italic',
    padding: '2rem'
  },
  itemCard: {
    padding: '0.75rem',
    marginBottom: '0.5rem',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative' as const
  },
  itemCardSelected: {
    background: 'rgba(212, 175, 55, 0.1)'
  },
  itemCardIncompatible: {
    opacity: 0.5,
    filter: 'grayscale(0.5)',
    cursor: 'not-allowed'
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem'
  },
  itemName: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#f4f4f4',
    margin: 0
  },
  itemRarity: {
    fontSize: '0.7rem',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    fontWeight: 'bold'
  },
  itemStats: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    lineHeight: '1.3'
  },
  incompatibleText: {
    fontSize: '0.75rem',
    color: '#ef4444',
    fontStyle: 'italic',
    marginTop: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
    fontWeight: '500'
  },
  upgradeIndicator: {
    fontSize: '0.7rem',
    fontWeight: 'bold',
    padding: '0.2rem 0.4rem',
    borderRadius: '3px',
    marginLeft: '0.5rem'
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'center',
    marginTop: '1rem',
    padding: '1rem 0.5rem 0'
  },
  errorMessage: {
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))',
    border: '2px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    marginTop: '0.75rem',
    color: '#fca5a5',
    fontSize: '0.9rem',
    fontWeight: '500',
    textAlign: 'center' as const,
    lineHeight: '1.5',
    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
  }
};

// Rarity colors
const rarityColors = {
  common: '#10b981',
  uncommon: '#3b82f6',
  rare: '#8b5cf6',
  epic: '#f59e0b',
  legendary: '#ef4444',
  mythical: '#ec4899'
};

export const EquipmentSelectionModal: React.FC<EquipmentSelectionModalProps> = ({
  isOpen,
  onClose,
  onEquip,
  slot,
  slotName,
  currentItem,
  availableItems,
  baseStats,
  playerLevel,
  playerClass,
  isLoading = false,
  errorMessage = null
}) => {
  const [selectedItem, setSelectedItem] = useState<EnhancedItem | null>(null);

  // Filter and categorize items
  const { compatibleItems, incompatibleItems } = useMemo(() => {
    const compatible: EnhancedItem[] = [];
    const incompatible: EnhancedItem[] = [];

    const filteredItems = availableItems.filter(item =>
      item.equipmentSlot === slot && item.id !== currentItem?.id
    );

    filteredItems.forEach(item => {
      const compatibility = checkEquipmentCompatibility(
        item, slot, playerLevel, playerClass, baseStats
      );

      if (compatibility.canEquip) {
        compatible.push(item);
      } else {
        incompatible.push(item);
      }
    });

    // Sort compatible items by stat improvement
    compatible.sort((a, b) => {
      const aComparison = compareEquipment(currentItem, a, baseStats);
      const bComparison = compareEquipment(currentItem, b, baseStats);
      return bComparison.totalStatChange - aComparison.totalStatChange;
    });

    return { compatibleItems: compatible, incompatibleItems: incompatible };
  }, [availableItems, slot, currentItem, playerLevel, playerClass, baseStats]);

  const allItems = [...compatibleItems, ...incompatibleItems];

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    return rarityColors[rarity as keyof typeof rarityColors] || rarityColors.common;
  };

  // Get border color based on item state (Task 6.7)
  const getBorderStyle = (item: EnhancedItem, isCompatible: boolean) => {
    if (!isCompatible) {
      return {
        border: '2px solid #6b7280', // Gray for locked
        borderColor: '#6b7280'
      };
    }

    const comparison = compareEquipment(currentItem, item, baseStats);
    const totalChange = comparison.totalStatChange;

    // Green for upgrade
    if (comparison.isUpgrade || totalChange > 0) {
      return {
        border: '2px solid #10b981',
        borderColor: '#10b981',
        boxShadow: '0 0 8px rgba(16, 185, 129, 0.3)'
      };
    }

    // Red for downgrade
    if (totalChange < 0) {
      return {
        border: '2px solid #ef4444',
        borderColor: '#ef4444',
        boxShadow: '0 0 8px rgba(239, 68, 68, 0.3)'
      };
    }

    // Default gold for neutral
    return {
      border: '2px solid #d4af37',
      borderColor: '#d4af37'
    };
  };

  // Get upgrade indicator with enhanced visuals
  const getUpgradeIndicator = (item: EnhancedItem) => {
    const comparison = compareEquipment(currentItem, item, baseStats);
    const totalChange = comparison.totalStatChange;
    const isSignificant = Math.abs(totalChange) >= 5;
    const isMajor = Math.abs(totalChange) >= 10;

    if (comparison.recommendation === 'strong_upgrade') {
      return {
        text: isMajor ? '⬆⬆⬆' : '⬆⬆',
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.25)',
        glow: '0 0 8px rgba(16, 185, 129, 0.4)',
        badge: 'MAJOR UPGRADE',
        priority: 'high'
      };
    } else if (comparison.recommendation === 'minor_upgrade') {
      return {
        text: isSignificant ? '⬆⬆' : '⬆',
        color: '#22c55e',
        bg: 'rgba(34, 197, 94, 0.15)',
        glow: '0 0 4px rgba(34, 197, 94, 0.3)',
        badge: isSignificant ? 'GOOD UPGRADE' : 'Minor Upgrade',
        priority: isSignificant ? 'medium' : 'low'
      };
    } else if (comparison.recommendation === 'minor_downgrade') {
      return {
        text: '⬇',
        color: '#f87171',
        bg: 'rgba(248, 113, 113, 0.15)',
        glow: '0 0 4px rgba(248, 113, 113, 0.3)',
        badge: 'Minor Loss',
        priority: 'low'
      };
    } else if (comparison.recommendation === 'strong_downgrade') {
      return {
        text: isMajor ? '⬇⬇⬇' : '⬇⬇',
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.25)',
        glow: '0 0 8px rgba(239, 68, 68, 0.4)',
        badge: 'MAJOR LOSS',
        priority: 'warning'
      };
    }
    return {
      text: '→',
      color: '#94a3b8',
      bg: 'rgba(156, 163, 175, 0.1)',
      glow: 'none',
      badge: 'No Change',
      priority: 'neutral'
    };
  };

  const handleItemClick = (item: EnhancedItem) => {
    const compatibility = checkEquipmentCompatibility(
      item, slot, playerLevel, playerClass, baseStats
    );

    if (compatibility.canEquip) {
      setSelectedItem(item);
    }
  };

  const handleEquip = () => {
    if (selectedItem && !isLoading) {
      onEquip(selectedItem);
    }
  };

  const formatStatModifiers = (item: EnhancedItem) => {
    if (!item.statModifiers) return 'No stat bonuses';

    return Object.entries(item.statModifiers)
      .map(([stat, value]) => `${stat}: +${value}`)
      .join(', ');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Equip ${slotName}`}
      size="xl"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={!isLoading}
    >
      <div style={modalStyles.container}>
        <div style={modalStyles.header}>
          <p style={modalStyles.subtitle}>
            Select an item to equip in your {slotName.toLowerCase()} slot
          </p>
        </div>

        <div style={modalStyles.content}>
          {/* Item List */}
          <div style={modalStyles.itemList}>
            {allItems.length === 0 ? (
              <div style={modalStyles.noItems}>
                No {slotName.toLowerCase()} items available
              </div>
            ) : (
              <AnimatePresence>
                {allItems.map((item, index) => {
                  const isCompatible = compatibleItems.includes(item);
                  const isSelected = selectedItem?.id === item.id;
                  const upgrade = isCompatible ? getUpgradeIndicator(item) : null;
                  const compatibility = checkEquipmentCompatibility(
                    item, slot, playerLevel, playerClass, baseStats
                  );
                  const borderStyle = getBorderStyle(item, isCompatible);

                  return (
                    <motion.div
                      key={item.id}
                      style={{
                        ...modalStyles.itemCard,
                        ...borderStyle,
                        ...(isSelected ? modalStyles.itemCardSelected : {}),
                        ...(!isCompatible ? modalStyles.itemCardIncompatible : {})
                      }}
                      onClick={() => handleItemClick(item)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={isCompatible ? {
                        scale: 1.02,
                        boxShadow: borderStyle.boxShadow ? `0 0 12px ${borderStyle.borderColor}40` : undefined
                      } : undefined}
                      whileTap={isCompatible ? { scale: 0.98 } : undefined}
                    >
                      <div style={modalStyles.itemHeader}>
                        <div>
                          <h4 style={modalStyles.itemName}>{item.name}</h4>
                          <div
                            style={{
                              ...modalStyles.itemRarity,
                              background: getRarityColor(item.rarity),
                              color: '#ffffff'
                            }}
                          >
                            {item.rarity}
                          </div>
                        </div>
                        {upgrade && isCompatible && (
                          <motion.div
                            style={{
                              ...modalStyles.upgradeIndicator,
                              color: upgrade.color,
                              background: upgrade.bg,
                              boxShadow: upgrade.glow !== 'none' ? upgrade.glow : undefined,
                              fontSize: upgrade.priority === 'high' ? '0.9rem' : '0.7rem',
                              fontWeight: upgrade.priority === 'high' ? 'bold' : '500'
                            }}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              delay: index * 0.05,
                              type: 'spring',
                              stiffness: 400
                            }}
                            whileHover={{ scale: 1.1 }}
                          >
                            {upgrade.text}
                          </motion.div>
                        )}
                        {upgrade && isCompatible && upgrade.priority === 'high' && (
                          <motion.div
                            style={{
                              position: 'absolute',
                              top: '-5px',
                              right: '-5px',
                              background: 'linear-gradient(45deg, #10b981, #22c55e)',
                              color: 'white',
                              fontSize: '0.6rem',
                              fontWeight: 'bold',
                              padding: '0.15rem 0.3rem',
                              borderRadius: '8px',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              zIndex: 10
                            }}
                            initial={{ scale: 0, y: -10 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={{
                              delay: 0.2 + index * 0.05,
                              type: 'spring'
                            }}
                          >
                            {upgrade.badge}
                          </motion.div>
                        )}
                      </div>

                      <div style={modalStyles.itemStats}>
                        {formatStatModifiers(item)}
                      </div>

                      {!isCompatible && compatibility.reasons.length > 0 && (
                        <motion.div
                          style={modalStyles.incompatibleText}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                        >
                          <span style={{ fontSize: '0.85rem' }}>🔒</span>
                          <span>{compatibility.reasons[0]}</span>
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Stat Comparison & Restrictions */}
          <div style={modalStyles.comparison}>
            {selectedItem ? (
              <>
                <StatComparison
                  currentItem={currentItem}
                  newItem={selectedItem}
                  baseStats={baseStats}
                  compact={true}
                  showNetChange={true}
                  highlightChanges={true}
                />

                {/* Equipment Restrictions */}
                <div style={{ marginTop: '1rem' }}>
                  <EquipmentRestrictions
                    compatibilityResult={checkEquipmentCompatibility(
                      selectedItem,
                      slot,
                      playerLevel,
                      playerClass,
                      baseStats
                    )}
                    compact={true}
                    showRecommendations={true}
                  />
                </div>
              </>
            ) : (
              <div style={{
                ...modalStyles.noItems,
                border: '1px dashed rgba(212, 175, 55, 0.3)',
                borderRadius: '8px'
              }}>
                Select an item to see comparison
              </div>
            )}
          </div>
        </div>

        {/* Error Message Display */}
        {errorMessage && (
          <motion.div
            style={modalStyles.errorMessage}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {errorMessage}
          </motion.div>
        )}

        {/* Actions */}
        <div style={modalStyles.actions}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
            size="md"
          >
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleEquip}
            disabled={
              !selectedItem ||
              isLoading ||
              !checkEquipmentCompatibility(
                selectedItem || {} as EnhancedItem,
                slot,
                playerLevel,
                playerClass,
                baseStats
              ).canEquip
            }
            loading={isLoading}
            size="md"
          >
            {selectedItem && !checkEquipmentCompatibility(
              selectedItem,
              slot,
              playerLevel,
              playerClass,
              baseStats
            ).canEquip
              ? 'Cannot Equip'
              : 'Equip Item'
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EquipmentSelectionModal;