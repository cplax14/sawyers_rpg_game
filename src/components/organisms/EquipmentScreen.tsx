import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { Card } from '../atoms/Card';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { Tooltip } from '../atoms/Tooltip';
import { ConfirmationDialog } from '../molecules/ConfirmationDialog';
import { EquipmentSelectionModal } from '../molecules/EquipmentSelectionModal';
import { StatComparison } from '../molecules/StatComparison';
import { useEquipment } from '../../hooks/useEquipment';
import { useInventory } from '../../hooks/useInventory';
import { useEquipmentValidation } from '../../hooks/useEquipmentValidation';
import { useGameState } from '../../contexts/ReactGameContext';
import { useResponsive } from '../../hooks';
import { EquipmentSlot, EnhancedItem, StatModifier } from '../../types/inventory';
import { PlayerStats } from '../../types/game';
import { compareEquipment, checkEquipmentCompatibility } from '../../utils/equipmentUtils';

interface EquipmentScreenProps {
  className?: string;
  onClose?: () => void;
}

// Temporary styles since PostCSS is disabled
const equipmentStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    color: '#f4f4f4',
    padding: '1rem',
    boxSizing: 'border-box' as const,
    overflow: 'auto'
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
  content: {
    display: 'flex',
    gap: '2rem',
    flex: 1,
    flexWrap: 'wrap' as const
  },
  paperDollSection: {
    flex: '1 1 400px',
    minWidth: '400px'
  },
  statsSection: {
    flex: '1 1 300px',
    minWidth: '300px'
  },
  paperDoll: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '400px',
    aspectRatio: '1',
    margin: '0 auto',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '2px solid rgba(212, 175, 55, 0.3)',
    padding: '1rem'
  },
  characterSilhouette: {
    width: '60%',
    height: '80%',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
    margin: '10% auto',
    position: 'relative' as const
  },
  equipmentSlot: {
    position: 'absolute' as const,
    width: '60px',
    height: '60px',
    borderRadius: '8px',
    border: '2px dashed rgba(212, 175, 55, 0.5)',
    background: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textAlign: 'center' as const
  },
  equipmentSlotFilled: {
    border: '2px solid #d4af37',
    background: 'rgba(212, 175, 55, 0.2)'
  },
  equipmentSlotHover: {
    transform: 'scale(1.05)',
    borderColor: '#d4af37',
    background: 'rgba(212, 175, 55, 0.3)'
  },
  statsCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    padding: '1.5rem',
    marginBottom: '1rem'
  },
  statsTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#d4af37'
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    padding: '0.5rem',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.02)'
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#94a3b8'
  },
  statValue: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#f4f4f4'
  },
  statBonus: {
    fontSize: '0.8rem',
    color: '#10b981'
  },
  comparisonCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    padding: '1rem'
  },
  comparisonTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '0.75rem',
    color: '#d4af37'
  },
  itemSlot: {
    width: '50px',
    height: '50px',
    borderRadius: '6px',
    background: 'rgba(212, 175, 55, 0.2)',
    border: '2px solid #d4af37',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  rarityCommon: { borderColor: '#10b981' },
  rarityUncommon: { borderColor: '#3b82f6' },
  rarityRare: { borderColor: '#8b5cf6' },
  rarityEpic: { borderColor: '#f59e0b' },
  rarityLegendary: { borderColor: '#ef4444' },
  rarityMythical: { borderColor: '#ec4899' },
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
  }
};

// Equipment slot positions on the paper doll
const slotPositions: Record<EquipmentSlot, { top: string; left: string }> = {
  helmet: { top: '5%', left: '50%' },
  necklace: { top: '15%', left: '50%' },
  armor: { top: '35%', left: '50%' },
  weapon: { top: '25%', left: '15%' },
  shield: { top: '25%', left: '85%' },
  gloves: { top: '45%', left: '25%' },
  boots: { top: '75%', left: '50%' },
  ring1: { top: '55%', left: '15%' },
  ring2: { top: '55%', left: '85%' },
  charm: { top: '85%', left: '50%' }
};

const slotNames: Record<EquipmentSlot, string> = {
  helmet: 'Helmet',
  necklace: 'Necklace',
  armor: 'Armor',
  weapon: 'Weapon',
  shield: 'Shield',
  gloves: 'Gloves',
  boots: 'Boots',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
  charm: 'Charm'
};

export const EquipmentScreen: React.FC<EquipmentScreenProps> = ({
  className,
  onClose
}) => {
  const { gameState } = useGameState();
  const { isMobile, isTablet } = useResponsive();

  const {
    equipmentSet,
    finalStats,
    equipmentBonuses,
    equipItem,
    unequipItem,
    canEquipItem,
    getEquipmentRecommendations,
    isLoading: equipmentLoading,
    error: equipmentError
  } = useEquipment();

  const {
    getFilteredItems,
    isLoading: inventoryLoading,
    error: inventoryError
  } = useInventory();

  const {
    validateEquipment,
    canEquipItem: canEquipItemValidation,
    getRestrictionMessage,
    playerInfo
  } = useEquipmentValidation();

  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [selectedItem, setSelectedItem] = useState<EnhancedItem | null>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showUnequipDialog, setShowUnequipDialog] = useState(false);
  const [isEquipping, setIsEquipping] = useState(false);
  const [isUnequipping, setIsUnequipping] = useState(false);

  // Get equipable items from inventory
  const equipableItems = useMemo(() => {
    return getFilteredItems({
      category: 'equipment',
      equipped: false
    });
  }, [getFilteredItems]);

  // Handle equipment slot click
  const handleSlotClick = useCallback((slot: EquipmentSlot) => {
    setSelectedSlot(slot);
    setSelectedItem(null);
    setShowSelectionModal(true);
  }, []);

  // Handle item selection from modal
  const handleItemSelected = useCallback((item: EnhancedItem) => {
    if (!selectedSlot) return;

    // Validate equipment before proceeding
    const validation = validateEquipment(item, selectedSlot);
    if (!validation.canEquip) {
      // Show validation error - could add toast notification here
      console.warn('Cannot equip item:', validation.validationMessage);
      return;
    }

    setSelectedItem(item);
    setShowSelectionModal(false);
    setShowConfirmDialog(true);
  }, [selectedSlot, validateEquipment]);

  // Handle confirmed equip
  const handleConfirmEquip = useCallback(async () => {
    if (!selectedItem || !selectedSlot) return;

    setIsEquipping(true);
    try {
      await equipItem(selectedItem.id, selectedSlot);
      setShowConfirmDialog(false);
      setSelectedItem(null);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Failed to equip item:', error);
      // TODO: Show error notification
    } finally {
      setIsEquipping(false);
    }
  }, [equipItem, selectedItem, selectedSlot]);

  // Handle unequip click
  const handleUnequipClick = useCallback((slot: EquipmentSlot) => {
    setSelectedSlot(slot);
    setShowUnequipDialog(true);
  }, []);

  // Handle confirmed unequip
  const handleConfirmUnequip = useCallback(async () => {
    if (!selectedSlot) return;

    setIsUnequipping(true);
    try {
      await unequipItem(selectedSlot);
      setShowUnequipDialog(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Failed to unequip item:', error);
      // TODO: Show error notification
    } finally {
      setIsUnequipping(false);
    }
  }, [unequipItem, selectedSlot]);

  // Get items that can be equipped in selected slot
  const availableItems = useMemo(() => {
    if (!selectedSlot) return [];

    return equipableItems.filter(item =>
      item.equipmentSlot === selectedSlot
    );
  }, [selectedSlot, equipableItems]);

  // Get items with validation status
  const itemsWithValidation = useMemo(() => {
    if (!selectedSlot) return [];

    return availableItems.map(item => ({
      item,
      validation: validateEquipment(item, selectedSlot)
    }));
  }, [availableItems, selectedSlot, validateEquipment]);


  // Generate confirmation dialog content
  const confirmDialogContent = useMemo(() => {
    if (!selectedItem || !selectedSlot) return null;

    const currentItem = equipmentSet[selectedSlot];
    const comparison = compareEquipment(currentItem, selectedItem, playerInfo.stats);

    return {
      title: currentItem ? 'Replace Equipment?' : 'Equip Item?',
      message: currentItem
        ? `Replace your ${currentItem.name} with ${selectedItem.name}?`
        : `Equip ${selectedItem.name} to your ${slotNames[selectedSlot]} slot?`,
      isUpgrade: comparison.isUpgrade,
      statChange: comparison.totalStatChange
    };
  }, [selectedItem, selectedSlot, equipmentSet, playerInfo.baseStats]);

  // Generate unequip dialog content
  const unequipDialogContent = useMemo(() => {
    if (!selectedSlot) return null;

    const currentItem = equipmentSet[selectedSlot];
    if (!currentItem) return null;

    return {
      title: 'Unequip Item?',
      message: `Remove ${currentItem.name} from your ${slotNames[selectedSlot]} slot?`,
      itemName: currentItem.name
    };
  }, [selectedSlot, equipmentSet]);

  // Format stat display
  const formatStatValue = useCallback((value: number, bonus: number = 0) => {
    const total = value + bonus;
    return bonus > 0 ? `${total} (+${bonus})` : total.toString();
  }, []);

  // Get rarity style
  const getRarityStyle = useCallback((rarity: string) => {
    switch (rarity) {
      case 'common': return equipmentStyles.rarityCommon;
      case 'uncommon': return equipmentStyles.rarityUncommon;
      case 'rare': return equipmentStyles.rarityRare;
      case 'epic': return equipmentStyles.rarityEpic;
      case 'legendary': return equipmentStyles.rarityLegendary;
      case 'mythical': return equipmentStyles.rarityMythical;
      default: return {};
    }
  }, []);

  if (equipmentLoading || inventoryLoading) {
    return (
      <div className={className} style={equipmentStyles.container}>
        <div style={equipmentStyles.loadingContainer}>
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  if (equipmentError || inventoryError) {
    return (
      <div className={className} style={equipmentStyles.container}>
        <div style={equipmentStyles.errorContainer}>
          <h2>Equipment System Error</h2>
          <p>{equipmentError || inventoryError}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={equipmentStyles.container}>
      {onClose && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          style={equipmentStyles.closeButton}
        >
          ✕
        </Button>
      )}

      {/* Header */}
      <motion.div
        style={equipmentStyles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{
          ...equipmentStyles.title,
          fontSize: isMobile ? '1.5rem' : '2rem'
        }}>
          Equipment
        </h1>
        <p style={equipmentStyles.subtitle}>
          Manage your equipment and view character stats
        </p>
      </motion.div>

      {/* Main Content */}
      <div style={{
        ...equipmentStyles.content,
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {/* Paper Doll Section */}
        <motion.div
          style={equipmentStyles.paperDollSection}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card title="Character Equipment">
            <div style={equipmentStyles.paperDoll}>
              {/* Character Silhouette */}
              <div style={equipmentStyles.characterSilhouette} />

              {/* Equipment Slots */}
              {Object.entries(slotPositions).map(([slot, position]) => {
                const equipmentSlot = slot as EquipmentSlot;
                const equippedItem = equipmentSet[equipmentSlot];
                const isSelected = selectedSlot === equipmentSlot;

                return (
                  <Tooltip
                    key={slot}
                    content={
                      equippedItem
                        ? `${equippedItem.name} (${equippedItem.rarity})`
                        : `Empty ${slotNames[equipmentSlot]} slot - Click to equip`
                    }
                    placement="top"
                  >
                    <motion.div
                      style={{
                        ...equipmentStyles.equipmentSlot,
                        ...position,
                        transform: 'translate(-50%, -50%)',
                        ...(equippedItem ? equipmentStyles.equipmentSlotFilled : {}),
                        ...(isSelected ? { borderColor: '#f59e0b', background: 'rgba(245, 158, 11, 0.3)' } : {}),
                        ...(equippedItem ? getRarityStyle(equippedItem.rarity) : {})
                      }}
                      onClick={() => handleSlotClick(equipmentSlot)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {equippedItem ? (
                        <div style={equipmentStyles.itemSlot}>
                          {equippedItem.name.slice(0, 3)}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.6rem' }}>
                          {slotNames[equipmentSlot]}
                        </span>
                      )}

                      {/* Unequip button for equipped items */}
                      {equippedItem && (
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnequipClick(equipmentSlot);
                          }}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            fontSize: '0.6rem'
                          }}
                          disabled={isUnequipping}
                        >
                          ×
                        </Button>
                      )}
                    </motion.div>
                  </Tooltip>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          style={equipmentStyles.statsSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Character Stats */}
          <div style={equipmentStyles.statsCard}>
            <h3 style={equipmentStyles.statsTitle}>Character Stats</h3>

            {Object.entries(finalStats).map(([stat, value]) => {
              const bonus = equipmentBonuses[stat as keyof PlayerStats] || 0;
              const baseValue = value - bonus;

              return (
                <div key={stat} style={equipmentStyles.statRow}>
                  <span style={equipmentStyles.statLabel}>
                    {stat.charAt(0).toUpperCase() + stat.slice(1)}:
                  </span>
                  <div>
                    <span style={equipmentStyles.statValue}>
                      {formatStatValue(baseValue, bonus)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Equipment Recommendations */}
          {getEquipmentRecommendations().length > 0 && (
            <div style={equipmentStyles.statsCard}>
              <h3 style={equipmentStyles.statsTitle}>Recommended Upgrades</h3>
              {getEquipmentRecommendations().slice(0, 3).map((rec, index) => (
                <div key={index} style={equipmentStyles.statRow}>
                  <span style={equipmentStyles.statLabel}>
                    {rec.slot}: {rec.item.name}
                  </span>
                  <span style={equipmentStyles.statBonus}>
                    +{rec.statImprovement.total} stats
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Equipment Selection Modal */}
      <EquipmentSelectionModal
        isOpen={showSelectionModal}
        onClose={() => {
          setShowSelectionModal(false);
          setSelectedSlot(null);
        }}
        onEquip={handleItemSelected}
        slot={selectedSlot!}
        slotName={selectedSlot ? slotNames[selectedSlot] : ''}
        currentItem={selectedSlot ? equipmentSet[selectedSlot] : undefined}
        availableItems={availableItems}
        baseStats={playerInfo.stats}
        playerLevel={playerInfo.level}
        playerClass={playerInfo.class}
        isLoading={isEquipping}
      />

      {/* Equipment Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setSelectedItem(null);
          setSelectedSlot(null);
        }}
        onConfirm={handleConfirmEquip}
        title={confirmDialogContent?.title || 'Equip Item?'}
        message={confirmDialogContent?.message || ''}
        confirmText="Equip"
        cancelText="Cancel"
        confirmVariant={confirmDialogContent?.isUpgrade ? 'primary' : 'secondary'}
        isLoading={isEquipping}
      >
        {selectedItem && selectedSlot && (
          <StatComparison
            currentItem={equipmentSet[selectedSlot]}
            newItem={selectedItem}
            baseStats={playerInfo.stats}
            compact={true}
            showNetChange={true}
            highlightChanges={true}
          />
        )}
      </ConfirmationDialog>

      {/* Unequip Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showUnequipDialog}
        onClose={() => {
          setShowUnequipDialog(false);
          setSelectedSlot(null);
        }}
        onConfirm={handleConfirmUnequip}
        title={unequipDialogContent?.title || 'Unequip Item?'}
        message={unequipDialogContent?.message || ''}
        confirmText="Unequip"
        cancelText="Cancel"
        confirmVariant="danger"
        isLoading={isUnequipping}
      />
    </div>
  );
};

export default EquipmentScreen;