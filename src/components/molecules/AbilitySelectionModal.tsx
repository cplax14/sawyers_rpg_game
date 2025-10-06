import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import { Ability } from '../../types/game';
import { DEFAULT_ABILITY_INHERITANCE } from '../../types/breeding';

interface AbilitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedAbilityIds: string[]) => void;
  inheritedAbilities: Ability[];
  naturalAbilities: Ability[];
  generation: number;
  maxSelection?: number;
}

const modalStyles = {
  content: {
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  header: {
    marginBottom: '1.5rem',
    textAlign: 'center' as const
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#d4af37',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0
  },
  slotsInfo: {
    background: 'rgba(59, 130, 246, 0.2)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1.5rem',
    border: '1px solid rgba(59, 130, 246, 0.3)'
  },
  slotsText: {
    fontSize: '0.9rem',
    color: '#60a5fa',
    margin: 0,
    textAlign: 'center' as const
  },
  section: {
    marginBottom: '1.5rem'
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#f4f4f4',
    marginBottom: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  abilityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '0.75rem'
  },
  abilityCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid transparent'
  },
  abilityCardSelected: {
    background: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    boxShadow: '0 0 12px rgba(34, 197, 94, 0.3)'
  },
  abilityCardDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  abilityName: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '0.25rem'
  },
  abilityDescription: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    lineHeight: '1.3',
    marginBottom: '0.5rem'
  },
  abilityMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.7rem',
    color: '#9ca3af'
  },
  abilityCost: {
    background: 'rgba(59, 130, 246, 0.2)',
    borderRadius: '4px',
    padding: '0.15rem 0.4rem',
    color: '#60a5fa'
  },
  inheritedBadge: {
    background: 'rgba(168, 85, 247, 0.2)',
    borderRadius: '4px',
    padding: '0.15rem 0.4rem',
    fontSize: '0.65rem',
    color: '#a855f7',
    fontWeight: 'bold'
  },
  actions: {
    display: 'flex',
    gap: '0.75rem',
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)'
  },
  warningBox: {
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    border: '1px solid rgba(239, 68, 68, 0.3)'
  },
  warningText: {
    fontSize: '0.85rem',
    color: '#ef4444',
    margin: 0
  }
};

export const AbilitySelectionModal: React.FC<AbilitySelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  inheritedAbilities,
  naturalAbilities,
  generation,
  maxSelection
}) => {
  // Get ability slots for this generation
  const abilitySlots = DEFAULT_ABILITY_INHERITANCE.abilitySlotsByGeneration[generation] ||
    DEFAULT_ABILITY_INHERITANCE.abilitySlotsByGeneration[0];

  const totalSlots = abilitySlots.baseSlots + abilitySlots.bonusSlots;
  const maxAbilities = maxSelection || totalSlots;

  // Track selected abilities
  const [selectedAbilities, setSelectedAbilities] = useState<string[]>([]);

  // Combine all available abilities
  const allAbilities = useMemo(() => {
    const abilities: Array<Ability & { source: 'inherited' | 'natural' }> = [];

    inheritedAbilities.forEach(ability => {
      abilities.push({ ...ability, source: 'inherited' });
    });

    naturalAbilities.forEach(ability => {
      abilities.push({ ...ability, source: 'natural' });
    });

    return abilities;
  }, [inheritedAbilities, naturalAbilities]);

  // Handle ability selection toggle
  const handleToggleAbility = (abilityId: string) => {
    setSelectedAbilities(prev => {
      if (prev.includes(abilityId)) {
        return prev.filter(id => id !== abilityId);
      } else if (prev.length < maxAbilities) {
        return [...prev, abilityId];
      }
      return prev;
    });
  };

  // Check if selection is valid
  const isSelectionValid = selectedAbilities.length > 0 && selectedAbilities.length <= maxAbilities;

  // Handle confirm
  const handleConfirm = () => {
    if (isSelectionValid) {
      onConfirm(selectedAbilities);
      setSelectedAbilities([]);
      onClose();
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedAbilities([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} style={modalStyles.content}>
      <div style={modalStyles.header}>
        <h2 style={modalStyles.title}>Select Abilities</h2>
        <p style={modalStyles.subtitle}>
          Choose which abilities your offspring will learn
        </p>
      </div>

      {/* Slots Information */}
      <div style={modalStyles.slotsInfo}>
        <p style={modalStyles.slotsText}>
          <strong>Available Slots:</strong> {maxAbilities} ability slots
          {abilitySlots.bonusSlots > 0 && (
            <span> ({abilitySlots.baseSlots} base + {abilitySlots.bonusSlots} bonus from Gen {generation})</span>
          )}
        </p>
        <p style={{ ...modalStyles.slotsText, marginTop: '0.5rem' }}>
          <strong>Selected:</strong> {selectedAbilities.length} / {maxAbilities}
        </p>
      </div>

      {/* Warning if too many abilities */}
      {allAbilities.length > maxAbilities && (
        <div style={modalStyles.warningBox}>
          <p style={modalStyles.warningText}>
            ⚠️ Your offspring has inherited {allAbilities.length} potential abilities,
            but can only learn {maxAbilities}. Choose wisely!
          </p>
        </div>
      )}

      {/* Inherited Abilities Section */}
      {inheritedAbilities.length > 0 && (
        <div style={modalStyles.section}>
          <div style={modalStyles.sectionTitle}>
            <span>🧬</span>
            <span>Inherited Abilities ({inheritedAbilities.length})</span>
          </div>
          <div style={modalStyles.abilityGrid}>
            {inheritedAbilities.map(ability => {
              const isSelected = selectedAbilities.includes(ability.id);
              const isDisabled = !isSelected && selectedAbilities.length >= maxAbilities;

              return (
                <motion.div
                  key={`inherited-${ability.id}`}
                  style={{
                    ...modalStyles.abilityCard,
                    ...(isSelected ? modalStyles.abilityCardSelected : {}),
                    ...(isDisabled ? modalStyles.abilityCardDisabled : {})
                  }}
                  onClick={() => !isDisabled && handleToggleAbility(ability.id)}
                  whileHover={isDisabled ? {} : { scale: 1.02 }}
                  whileTap={isDisabled ? {} : { scale: 0.98 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                    <div style={modalStyles.abilityName}>{ability.name}</div>
                    <div style={modalStyles.inheritedBadge}>Inherited</div>
                  </div>
                  <div style={modalStyles.abilityDescription}>
                    {ability.description}
                  </div>
                  <div style={modalStyles.abilityMeta}>
                    <span style={modalStyles.abilityCost}>
                      {ability.cost} MP
                    </span>
                    {isSelected && <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓ Selected</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Natural Abilities Section */}
      {naturalAbilities.length > 0 && (
        <div style={modalStyles.section}>
          <div style={modalStyles.sectionTitle}>
            <span>⭐</span>
            <span>Natural Abilities ({naturalAbilities.length})</span>
          </div>
          <div style={modalStyles.abilityGrid}>
            {naturalAbilities.map(ability => {
              const isSelected = selectedAbilities.includes(ability.id);
              const isDisabled = !isSelected && selectedAbilities.length >= maxAbilities;

              return (
                <motion.div
                  key={`natural-${ability.id}`}
                  style={{
                    ...modalStyles.abilityCard,
                    ...(isSelected ? modalStyles.abilityCardSelected : {}),
                    ...(isDisabled ? modalStyles.abilityCardDisabled : {})
                  }}
                  onClick={() => !isDisabled && handleToggleAbility(ability.id)}
                  whileHover={isDisabled ? {} : { scale: 1.02 }}
                  whileTap={isDisabled ? {} : { scale: 0.98 }}
                >
                  <div style={modalStyles.abilityName}>{ability.name}</div>
                  <div style={modalStyles.abilityDescription}>
                    {ability.description}
                  </div>
                  <div style={modalStyles.abilityMeta}>
                    <span style={modalStyles.abilityCost}>
                      {ability.cost} MP
                    </span>
                    {isSelected && <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓ Selected</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={modalStyles.actions}>
        <Button
          variant="secondary"
          onClick={handleCancel}
          style={{ flex: 1 }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          disabled={!isSelectionValid}
          style={{ flex: 2 }}
        >
          Confirm Selection ({selectedAbilities.length})
        </Button>
      </div>
    </Modal>
  );
};

export default AbilitySelectionModal;
