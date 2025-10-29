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
import { useInventoryFeedback } from '../../hooks/useInventoryFeedback';
import { useGameState } from '../../contexts/ReactGameContext';
import { useResponsive } from '../../hooks';
import { EquipmentSlot, EnhancedItem, StatModifier } from '../../types/inventory';
import { PlayerStats } from '../../types/game';
import {
  compareEquipment,
  checkEquipmentCompatibility,
  getEquipmentSlotIcon,
  formatStatValue,
} from '../../utils/equipmentUtils';

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
    overflow: 'auto',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
    color: '#d4af37',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    margin: '0',
  },
  content: {
    display: 'flex',
    gap: '2rem',
    flex: 1,
    flexWrap: 'wrap' as const,
  },
  paperDollSection: {
    flex: '1 1 400px',
    minWidth: '400px',
  },
  statsSection: {
    flex: '1 1 300px',
    minWidth: '300px',
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
    padding: '1rem',
  },
  characterSilhouette: {
    width: '60%',
    height: '80%',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
    margin: '10% auto',
    position: 'relative' as const,
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
    textAlign: 'center' as const,
  },
  equipmentSlotFilled: {
    border: '2px solid #d4af37',
    background: 'rgba(212, 175, 55, 0.2)',
  },
  equipmentSlotHover: {
    transform: 'scale(1.05)',
    borderColor: '#d4af37',
    background: 'rgba(212, 175, 55, 0.3)',
  },
  statsCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    padding: '1.5rem',
    marginBottom: '1rem',
  },
  statsTitle: {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '1rem',
    color: '#d4af37',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
    padding: '0.5rem',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.02)',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#94a3b8',
  },
  statValue: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#f4f4f4',
  },
  statBonus: {
    fontSize: '0.8rem',
    color: '#10b981',
  },
  comparisonCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    padding: '1rem',
  },
  comparisonTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '0.75rem',
    color: '#d4af37',
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
    transition: 'all 0.2s ease',
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
    height: '200px',
  },
  errorContainer: {
    textAlign: 'center' as const,
    padding: '2rem',
  },
  closeButton: {
    position: 'absolute' as const,
    top: '1rem',
    right: '1rem',
    zIndex: 10,
  },
  // Mobile/Tablet Grid Layout
  mobileGridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '1rem',
    padding: '1rem',
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
  },
  mobileGridContainerTablet: {
    gridTemplateColumns: 'repeat(2, 1fr)',
  },
  mobileSlotCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '2px dashed rgba(212, 175, 55, 0.5)',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    minHeight: '120px',
  },
  mobileSlotCardFilled: {
    border: '2px solid rgba(212, 175, 55, 0.8)',
    background: 'rgba(212, 175, 55, 0.1)',
  },
  mobileSlotHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  mobileSlotIcon: {
    fontSize: '2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mobileSlotInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },
  mobileSlotName: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#d4af37',
  },
  mobileSlotStatus: {
    fontSize: '0.85rem',
    color: '#94a3b8',
  },
  mobileItemInfo: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '8px',
    padding: '0.75rem',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  mobileItemName: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#f4f4f4',
    marginBottom: '0.25rem',
  },
  mobileItemStats: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    lineHeight: '1.4',
  },
  mobileUnequipButton: {
    marginTop: '0.5rem',
  },
  mobileEmptyMessage: {
    fontSize: '0.85rem',
    color: '#10b981',
    fontStyle: 'italic' as const,
    textAlign: 'center' as const,
  },
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
  charm: { top: '85%', left: '50%' },
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
  charm: 'Charm',
};

export const EquipmentScreen: React.FC<EquipmentScreenProps> = ({ className, onClose }) => {
  const { gameState } = useGameState();
  const { isMobile, isTablet } = useResponsive();

  const {
    equipped,
    finalStats,
    equipmentStats,
    equipItem,
    unequipItem,
    canEquip: canEquipItem,
  } = useEquipment();

  // Provide fallback values to prevent undefined errors
  const equipmentSet = equipped || {};
  const equipmentBonuses = equipmentStats || {};
  const getEquipmentRecommendations = () => [];
  const equipmentLoading = false;
  const equipmentError = null;

  const { getFilteredItems, isLoading: inventoryLoading, error: inventoryError } = useInventory();

  const {
    validateEquipment,
    canEquipItem: canEquipItemValidation,
    getRestrictionMessage,
    playerInfo,
  } = useEquipmentValidation();

  const { showSuccess, showError } = useInventoryFeedback();

  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [selectedItem, setSelectedItem] = useState<EnhancedItem | null>(null);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showUnequipDialog, setShowUnequipDialog] = useState(false);
  const [isEquipping, setIsEquipping] = useState(false);
  const [isUnequipping, setIsUnequipping] = useState(false);
  const [equipmentWarnings, setEquipmentWarnings] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get equipable items from inventory
  const equipableItems = useMemo(() => {
    return getFilteredItems('main', {
      categories: ['equipment'],
      showEquipped: false,
      rarities: [],
      equipmentSlots: [],
      usableOnly: false,
      tradableOnly: false,
      searchText: '',
    });
  }, [getFilteredItems]);

  // Handle equipment slot click
  const handleSlotClick = useCallback((slot: EquipmentSlot) => {
    setSelectedSlot(slot);
    setSelectedItem(null);
    setShowSelectionModal(true);
  }, []);

  // Handle item selection from modal
  const handleItemSelected = useCallback(
    (item: EnhancedItem) => {
      if (!selectedSlot) return;

      // Clear any previous errors
      setErrorMessage(null);
      setEquipmentWarnings([]);

      // Perform comprehensive compatibility check
      const compatibility = checkEquipmentCompatibility(
        item,
        selectedSlot,
        playerInfo.level,
        playerInfo.class,
        playerInfo.stats,
        equipmentSet
      );

      // Handle BLOCKING errors (canEquip === false)
      if (!compatibility.canEquip) {
        // Get the first blocking reason (most important)
        const errorReason = compatibility.reasons[0] || 'This item cannot be equipped right now!';

        // Set error message for display
        setErrorMessage(errorReason);

        // Keep modal open so user can see the error and try another item
        // Do NOT proceed to confirmation dialog
        return;
      }

      // Handle WARNINGS (canEquip === true but warnings exist)
      if (compatibility.warnings.length > 0) {
        // Store warnings to show in confirmation dialog
        setEquipmentWarnings(compatibility.warnings);
      }

      // Valid item - proceed to confirmation
      setSelectedItem(item);
      setShowSelectionModal(false);
      setShowConfirmDialog(true);
    },
    [selectedSlot, playerInfo, equipmentSet]
  );

  // Handle confirmed equip
  const handleConfirmEquip = useCallback(async () => {
    if (!selectedItem || !selectedSlot) return;

    setIsEquipping(true);
    try {
      await equipItem(selectedItem.id, selectedSlot);

      // Show success notification with kid-friendly message
      showSuccess(
        'Item Equipped!',
        `You equipped ${selectedItem.name}! Your ${slotNames[selectedSlot]} slot is now filled.`,
        { duration: 3000, icon: '⚔️' }
      );

      setShowConfirmDialog(false);
      setSelectedItem(null);
      setSelectedSlot(null);
      setEquipmentWarnings([]);
      setErrorMessage(null);
    } catch (error) {
      console.error('Failed to equip item:', error);

      // Show error notification with helpful, non-scary message
      showError("Oops! We couldn't equip that item right now. Try again in a moment!", {
        operationType: 'equip item',
        itemName: selectedItem.name,
      });
    } finally {
      setIsEquipping(false);
    }
  }, [equipItem, selectedItem, selectedSlot, showSuccess, showError]);

  // Handle unequip click
  const handleUnequipClick = useCallback((slot: EquipmentSlot) => {
    setSelectedSlot(slot);
    setShowUnequipDialog(true);
  }, []);

  // Handle confirmed unequip
  const handleConfirmUnequip = useCallback(async () => {
    if (!selectedSlot) return;

    const currentItem = equipmentSet[selectedSlot];
    const itemName = currentItem?.name || 'item';

    setIsUnequipping(true);
    try {
      await unequipItem(selectedSlot);

      // Show success notification with kid-friendly message
      showSuccess(
        'Item Removed!',
        `You removed ${itemName} from your ${slotNames[selectedSlot]} slot. It's back in your inventory!`,
        { duration: 3000, icon: '📦' }
      );

      setShowUnequipDialog(false);
      setSelectedSlot(null);
    } catch (error) {
      console.error('Failed to unequip item:', error);

      // Show error notification with helpful, non-scary message
      showError("Oops! We couldn't remove that item right now. Try again in a moment!", {
        operationType: 'unequip item',
        itemName,
      });
    } finally {
      setIsUnequipping(false);
    }
  }, [unequipItem, selectedSlot, equipmentSet, showSuccess, showError]);

  // Get items that can be equipped in selected slot
  const availableItems = useMemo(() => {
    if (!selectedSlot) return [];

    // equipableItems is InventorySlot[], need to access slot.item
    return equipableItems
      .filter(slot => {
        if (!slot.item?.equipmentSlot) return false;

        const itemSlot = slot.item.equipmentSlot.toLowerCase();
        const targetSlot = selectedSlot.toLowerCase();

        // Special case: "ring" type items can go in ring1 OR ring2
        // Items with equipmentSlot="ring1" or "ring" should work in both ring slots
        if (
          (targetSlot === 'ring1' || targetSlot === 'ring2') &&
          (itemSlot === 'ring1' || itemSlot === 'ring2' || itemSlot === 'ring')
        ) {
          return true;
        }

        // Normal case: exact slot match
        return itemSlot === targetSlot;
      })
      .map(slot => slot.item!)
      .filter(Boolean);
  }, [selectedSlot, equipableItems]);

  // Get items with validation status
  const itemsWithValidation = useMemo(() => {
    if (!selectedSlot) return [];

    return availableItems.map(item => ({
      item,
      validation: validateEquipment(item, selectedSlot),
    }));
  }, [availableItems, selectedSlot, validateEquipment]);

  // Generate confirmation dialog content
  const confirmDialogContent = useMemo(() => {
    if (!selectedItem || !selectedSlot) return null;

    const currentItem = equipmentSet[selectedSlot];
    const comparison = compareEquipment(currentItem, selectedItem, playerInfo.stats);

    // Create message with warnings if present
    let message = currentItem
      ? `Replace your ${currentItem.name} with ${selectedItem.name}?`
      : `Equip ${selectedItem.name} to your ${slotNames[selectedSlot]} slot?`;

    // Add warnings to message if they exist
    if (equipmentWarnings.length > 0) {
      message += '\n\n' + equipmentWarnings.join('\n\n');
    }

    return {
      title: currentItem ? 'Replace Equipment?' : 'Equip Item?',
      message,
      isUpgrade: comparison.isUpgrade,
      statChange: comparison.totalStatChange,
      hasWarnings: equipmentWarnings.length > 0,
    };
  }, [selectedItem, selectedSlot, equipmentSet, playerInfo.stats, equipmentWarnings]);

  // Generate unequip dialog content
  const unequipDialogContent = useMemo(() => {
    if (!selectedSlot) return null;

    const currentItem = equipmentSet[selectedSlot];
    if (!currentItem) return null;

    return {
      title: 'Unequip Item?',
      message: `Remove ${currentItem.name} from your ${slotNames[selectedSlot]} slot?`,
      itemName: currentItem.name,
    };
  }, [selectedSlot, equipmentSet]);

  // Format stat display (for character stats section)
  const formatStatDisplay = useCallback((value: number, bonus: number = 0) => {
    const total = value + bonus;
    return bonus > 0 ? `${total} (+${bonus})` : total.toString();
  }, []);

  // Format item stat modifiers for display
  const formatItemStats = useCallback((item: EnhancedItem): string => {
    if (!item.statModifiers || Object.keys(item.statModifiers).length === 0) {
      return 'No stat bonuses';
    }

    const statStrings = Object.entries(item.statModifiers)
      .filter(([_, value]) => value !== 0 && value !== undefined)
      .map(([stat, value]) => {
        const formattedStatName = stat.charAt(0).toUpperCase() + stat.slice(1);
        return `${formattedStatName}: ${formatStatValue(value as number)}`;
      });

    return statStrings.join(', ') || 'No stat bonuses';
  }, []);

  // Get tooltip content for equipment slots
  const getTooltipContent = useCallback(
    (slot: EquipmentSlot, item?: EnhancedItem): JSX.Element => {
      const slotIcon = getEquipmentSlotIcon(slot);
      const slotName = slotNames[slot];

      if (!item) {
        // Empty slot tooltip
        return (
          <div style={{ textAlign: 'center', lineHeight: '1.5' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{slotIcon}</div>
            <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Empty {slotName}</div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Click to find equipment!</div>
          </div>
        );
      }

      // Equipped item tooltip
      return (
        <div style={{ textAlign: 'left', lineHeight: '1.5', minWidth: '200px' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
          >
            <span style={{ fontSize: '1.2rem' }}>{slotIcon}</span>
            <div>
              <div style={{ fontWeight: 'bold', color: '#d4af37' }}>{item.name}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: '#e2e8f0' }}>
            {formatItemStats(item)}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', fontStyle: 'italic' }}>
            Click to change equipment!
          </div>
        </div>
      );
    },
    [formatItemStats]
  );

  // Get rarity style
  const getRarityBorderColor = useCallback((rarity: string): string => {
    switch (rarity) {
      case 'common':
        return '#10b981';
      case 'uncommon':
        return '#3b82f6';
      case 'rare':
        return '#8b5cf6';
      case 'epic':
        return '#f59e0b';
      case 'legendary':
        return '#ef4444';
      case 'mythical':
        return '#ec4899';
      default:
        return '#d4af37';
    }
  }, []);

  if (equipmentLoading || inventoryLoading) {
    return (
      <div className={className} style={equipmentStyles.container}>
        <div style={equipmentStyles.loadingContainer}>
          <LoadingSpinner size='large' />
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
          <Button variant='primary' onClick={() => window.location.reload()}>
            Reload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={equipmentStyles.container}>
      {onClose && (
        <Button variant='secondary' size='sm' onClick={onClose} style={equipmentStyles.closeButton}>
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
        <h1
          style={{
            ...equipmentStyles.title,
            fontSize: isMobile ? '1.5rem' : '2rem',
          }}
        >
          Equipment
        </h1>
        <p style={equipmentStyles.subtitle}>Manage your equipment and view character stats</p>
      </motion.div>

      {/* Main Content */}
      <div
        style={{
          ...equipmentStyles.content,
          flexDirection: isMobile ? 'column' : 'row',
        }}
      >
        {/* Conditional Layout: Mobile/Tablet Grid OR Desktop Paper Doll */}
        <motion.div
          style={equipmentStyles.paperDollSection}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {isMobile || isTablet ? (
            // Mobile/Tablet Grid Layout
            <div
              style={{
                ...equipmentStyles.mobileGridContainer,
                ...(isTablet ? equipmentStyles.mobileGridContainerTablet : {}),
              }}
            >
              {Object.entries(slotPositions).map(([slot, _]) => {
                const equipmentSlot = slot as EquipmentSlot;
                const equippedItem = equipmentSet[equipmentSlot];
                const slotIcon = getEquipmentSlotIcon(equipmentSlot);
                const slotDisplayName = slotNames[equipmentSlot];

                return (
                  <motion.div
                    key={slot}
                    style={{
                      ...equipmentStyles.mobileSlotCard,
                      ...(equippedItem ? equipmentStyles.mobileSlotCardFilled : {}),
                      ...(equippedItem
                        ? {
                            borderColor: getRarityBorderColor(equippedItem.rarity),
                          }
                        : {}),
                    }}
                    onClick={() => handleSlotClick(equipmentSlot)}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Slot Header */}
                    <div style={equipmentStyles.mobileSlotHeader}>
                      <span style={equipmentStyles.mobileSlotIcon}>{slotIcon}</span>
                      <div style={equipmentStyles.mobileSlotInfo}>
                        <div style={equipmentStyles.mobileSlotName}>{slotDisplayName}</div>
                        <div style={equipmentStyles.mobileSlotStatus}>
                          {equippedItem
                            ? equippedItem.rarity.charAt(0).toUpperCase() +
                              equippedItem.rarity.slice(1)
                            : 'Empty'}
                        </div>
                      </div>
                    </div>

                    {/* Item Info or Empty Message */}
                    {equippedItem ? (
                      <div style={equipmentStyles.mobileItemInfo}>
                        <div style={equipmentStyles.mobileItemName}>{equippedItem.name}</div>
                        <div style={equipmentStyles.mobileItemStats}>
                          {formatItemStats(equippedItem)}
                        </div>
                        <Button
                          variant='danger'
                          size='sm'
                          onClick={e => {
                            e.stopPropagation();
                            handleUnequipClick(equipmentSlot);
                          }}
                          style={equipmentStyles.mobileUnequipButton}
                          disabled={isUnequipping}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div style={equipmentStyles.mobileEmptyMessage}>Tap to equip!</div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // Desktop Paper Doll Layout
            <Card title='Character Equipment'>
              <div style={equipmentStyles.paperDoll}>
                {/* Character Silhouette */}
                <div style={equipmentStyles.characterSilhouette} />

                {/* Equipment Slots */}
                {Object.entries(slotPositions).map(([slot, position]) => {
                  const equipmentSlot = slot as EquipmentSlot;
                  const equippedItem = equipmentSet[equipmentSlot];
                  const isSelected = selectedSlot === equipmentSlot;
                  const slotIcon = getEquipmentSlotIcon(equipmentSlot);

                  return (
                    <Tooltip
                      key={slot}
                      content={getTooltipContent(equipmentSlot, equippedItem)}
                      placement='top'
                    >
                      <motion.div
                        style={{
                          ...equipmentStyles.equipmentSlot,
                          ...position,
                          // Use full border declaration to avoid mixing with borderColor
                          border: isSelected
                            ? '2px solid #f59e0b'
                            : equippedItem
                              ? `2px solid ${getRarityBorderColor(equippedItem.rarity)}`
                              : equipmentStyles.equipmentSlot.border,
                          background: isSelected
                            ? 'rgba(245, 158, 11, 0.3)'
                            : equippedItem
                              ? 'rgba(212, 175, 55, 0.2)'
                              : equipmentStyles.equipmentSlot.background,
                        }}
                        onClick={() => handleSlotClick(equipmentSlot)}
                        animate={{ x: '-50%', y: '-50%', scale: 1 }}
                        whileHover={{ x: '-50%', y: '-50%', scale: 1.05 }}
                        whileTap={{ x: '-50%', y: '-50%', scale: 0.95 }}
                      >
                        {/* Display emoji icon instead of text label */}
                        <span
                          style={{
                            fontSize: equippedItem ? '1.5rem' : '1.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            filter: equippedItem ? 'none' : 'grayscale(0.5) opacity(0.6)',
                          }}
                        >
                          {slotIcon}
                        </span>

                        {/* Unequip button for equipped items */}
                        {equippedItem && (
                          <Button
                            variant='danger'
                            size='xs'
                            onClick={e => {
                              e.stopPropagation();
                              handleUnequipClick(equipmentSlot);
                            }}
                            style={{
                              position: 'absolute',
                              top: '-6px',
                              right: '-6px',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              fontSize: '0.5rem',
                              padding: '0',
                              minWidth: '12px',
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
          )}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          style={{
            ...equipmentStyles.statsSection,
            flex: isMobile || isTablet ? '1 1 100%' : '1 1 300px',
            minWidth: isMobile || isTablet ? '100%' : '300px',
          }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {/* Character Stats */}
          <div style={equipmentStyles.statsCard}>
            <h3 style={equipmentStyles.statsTitle}>Character Stats</h3>

            {Object.entries(finalStats).map(([stat, statCalc]) => {
              const baseValue = statCalc.baseStat || 0;
              const equipmentBonus = statCalc.equipmentBonus || 0;
              const finalValue = statCalc.finalValue || 0;

              return (
                <div
                  key={stat}
                  style={{
                    ...equipmentStyles.statRow,
                    flexDirection: isMobile || isTablet ? 'column' : 'row',
                    alignItems: isMobile || isTablet ? 'flex-start' : 'center',
                    gap: isMobile || isTablet ? '0.25rem' : '0',
                  }}
                >
                  <span style={equipmentStyles.statLabel}>
                    {stat.charAt(0).toUpperCase() + stat.slice(1)}:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {/* Base Stat (Gray) */}
                    <span
                      style={{ ...equipmentStyles.statValue, color: '#94a3b8', fontSize: '0.9rem' }}
                    >
                      {baseValue}
                    </span>

                    {/* Equipment Bonus (Green if positive) */}
                    {equipmentBonus > 0 && (
                      <span
                        style={{
                          ...equipmentStyles.statBonus,
                          color: '#10b981',
                          fontSize: '0.9rem',
                        }}
                      >
                        (+{equipmentBonus})
                      </span>
                    )}

                    {/* Equals sign */}
                    {equipmentBonus > 0 && (
                      <span style={{ color: '#64748b', fontSize: '0.85rem' }}>=</span>
                    )}

                    {/* Final Stat (White/Bold) */}
                    <span
                      style={{ ...equipmentStyles.statValue, fontWeight: 'bold', fontSize: '1rem' }}
                    >
                      {finalValue}
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
              {getEquipmentRecommendations()
                .slice(0, 3)
                .map((rec, index) => (
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
          setErrorMessage(null);
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
        errorMessage={errorMessage}
      />

      {/* Equipment Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setSelectedItem(null);
          setSelectedSlot(null);
          setEquipmentWarnings([]);
          setErrorMessage(null);
        }}
        onConfirm={handleConfirmEquip}
        title={confirmDialogContent?.title || 'Equip Item?'}
        message={confirmDialogContent?.message || ''}
        confirmText='Equip'
        cancelText='Cancel'
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
        confirmText='Unequip'
        cancelText='Cancel'
        confirmVariant='danger'
        isLoading={isUnequipping}
      />
    </div>
  );
};

export default EquipmentScreen;
