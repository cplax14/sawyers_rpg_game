import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from '../atoms/Tooltip';
import { Button } from '../atoms/Button';
import { EquipmentSlot as EquipmentSlotType, EnhancedItem } from '../../types/inventory';
import { PlayerStats } from '../../types/game';

interface EquipmentSlotProps {
  slot: EquipmentSlotType;
  slotName: string;
  equippedItem?: EnhancedItem;
  availableItems?: EnhancedItem[];
  onEquip?: (item: EnhancedItem, slot: EquipmentSlotType) => void;
  onUnequip?: (slot: EquipmentSlotType) => void;
  onSlotClick?: (slot: EquipmentSlotType) => void;
  showTooltip?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showComparison?: boolean;
}

// Temporary styles since PostCSS is disabled
const slotStyles = {
  container: {
    position: 'relative' as const,
    display: 'inline-block'
  },
  slot: {
    position: 'relative' as const,
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
    overflow: 'hidden'
  },
  slotSm: {
    width: '40px',
    height: '40px',
    fontSize: '0.6rem'
  },
  slotMd: {
    width: '60px',
    height: '60px',
    fontSize: '0.8rem'
  },
  slotLg: {
    width: '80px',
    height: '80px',
    fontSize: '1rem'
  },
  slotFilled: {
    border: '2px solid #d4af37',
    background: 'rgba(212, 175, 55, 0.2)'
  },
  slotHover: {
    transform: 'scale(1.05)',
    borderColor: '#d4af37',
    background: 'rgba(212, 175, 55, 0.3)'
  },
  slotDragOver: {
    borderColor: '#10b981',
    background: 'rgba(16, 185, 129, 0.3)',
    transform: 'scale(1.1)'
  },
  slotDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  itemIcon: {
    width: '80%',
    height: '80%',
    borderRadius: '4px',
    background: 'rgba(212, 175, 55, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    position: 'relative' as const
  },
  rarityIndicator: {
    position: 'absolute' as const,
    top: '-2px',
    right: '-2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  unequipButton: {
    position: 'absolute' as const,
    top: '-6px',
    right: '-6px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    fontSize: '0.6rem',
    zIndex: 10
  },
  slotLabel: {
    fontSize: '0.6rem',
    color: '#94a3b8',
    textAlign: 'center' as const,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  dragPreview: {
    position: 'absolute' as const,
    pointerEvents: 'none' as const,
    zIndex: 1000,
    opacity: 0.8
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

export const EquipmentSlot: React.FC<EquipmentSlotProps> = ({
  slot,
  slotName,
  equippedItem,
  availableItems = [],
  onEquip,
  onUnequip,
  onSlotClick,
  showTooltip = true,
  disabled = false,
  className = '',
  size = 'md',
  interactive = true,
  showComparison = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const slotRef = useRef<HTMLDivElement>(null);

  // Handle slot click
  const handleSlotClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || !interactive) return;

    onSlotClick?.(slot);
  }, [slot, onSlotClick, disabled, interactive]);

  // Handle item unequip
  const handleUnequip = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    onUnequip?.(slot);
  }, [slot, onUnequip, disabled]);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (!equippedItem || disabled) {
      e.preventDefault();
      return;
    }

    setIsDragging(true);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'equipment',
      item: equippedItem,
      sourceSlot: slot
    }));
    e.dataTransfer.effectAllowed = 'move';
  }, [equippedItem, slot, disabled]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragPosition({ x: 0, y: 0 });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));

      if (data.type === 'equipment' && data.item) {
        // Check if this is a valid drop
        if (data.item.equipmentSlot === slot) {
          onEquip?.(data.item, slot);
        }
      }
    } catch (error) {
      console.warn('Invalid drop data:', error);
    }
  }, [slot, onEquip, disabled]);

  // Mouse drag tracking for visual feedback
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    setDragPosition({
      x: e.clientX,
      y: e.clientY
    });
  }, [isDragging]);

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isDragging, handleMouseMove]);

  // Generate tooltip content
  const tooltipContent = React.useMemo(() => {
    if (!showTooltip) return '';

    if (equippedItem) {
      const statBonuses = equippedItem.statModifiers
        ? Object.entries(equippedItem.statModifiers)
            .map(([stat, mod]) => `${stat}: +${mod.value}`)
            .join('\n')
        : 'No stat bonuses';

      return `${equippedItem.name}\nRarity: ${equippedItem.rarity}\n${statBonuses}\n\nClick to change equipment`;
    }

    return `Empty ${slotName} slot\nClick to equip an item`;
  }, [equippedItem, slotName, showTooltip]);

  // Get slot size styles
  const sizeStyle = React.useMemo(() => {
    switch (size) {
      case 'sm': return slotStyles.slotSm;
      case 'lg': return slotStyles.slotLg;
      default: return slotStyles.slotMd;
    }
  }, [size]);

  // Get rarity color
  const rarityColor = equippedItem
    ? rarityColors[equippedItem.rarity as keyof typeof rarityColors] || rarityColors.common
    : undefined;

  const slotElement = (
    <div
      ref={slotRef}
      className={className}
      style={slotStyles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        style={{
          ...slotStyles.slot,
          ...sizeStyle,
          ...(equippedItem ? slotStyles.slotFilled : {}),
          ...(isHovered && !disabled ? slotStyles.slotHover : {}),
          ...(isDragOver ? slotStyles.slotDragOver : {}),
          ...(disabled ? slotStyles.slotDisabled : {}),
          ...(equippedItem && rarityColor ? { borderColor: rarityColor } : {})
        }}
        onClick={handleSlotClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        draggable={!!equippedItem && interactive && !disabled}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        whileHover={!disabled ? { scale: 1.05 } : undefined}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
        animate={{
          scale: isDragOver ? 1.1 : 1,
          rotate: isDragOver ? 5 : 0
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {equippedItem ? (
          <>
            {/* Equipped Item */}
            <div style={slotStyles.itemIcon}>
              {equippedItem.name.slice(0, 3).toUpperCase()}

              {/* Rarity Indicator */}
              <div
                style={{
                  ...slotStyles.rarityIndicator,
                  background: rarityColor
                }}
              />
            </div>

            {/* Unequip Button */}
            {interactive && !disabled && (
              <Button
                variant="danger"
                size="xs"
                onClick={handleUnequip}
                style={slotStyles.unequipButton}
                aria-label={`Unequip ${equippedItem.name}`}
              >
                ×
              </Button>
            )}
          </>
        ) : (
          /* Empty Slot */
          <div style={slotStyles.slotLabel}>
            {slotName}
          </div>
        )}
      </motion.div>

      {/* Drag Preview */}
      <AnimatePresence>
        {isDragging && equippedItem && (
          <motion.div
            style={{
              ...slotStyles.dragPreview,
              ...sizeStyle,
              left: dragPosition.x - (sizeStyle.width as number) / 2,
              top: dragPosition.y - (sizeStyle.height as number) / 2
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.8, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div style={{
              ...slotStyles.slot,
              ...sizeStyle,
              ...slotStyles.slotFilled,
              borderColor: rarityColor
            }}>
              <div style={slotStyles.itemIcon}>
                {equippedItem.name.slice(0, 3).toUpperCase()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Wrap with tooltip if enabled
  if (showTooltip && tooltipContent) {
    return (
      <Tooltip content={tooltipContent} placement="top">
        {slotElement}
      </Tooltip>
    );
  }

  return slotElement;
};

export default EquipmentSlot;