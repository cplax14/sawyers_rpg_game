import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import { CreatureCard } from './CreatureCard';
import { useCreatures } from '../../hooks/useCreatures';
import { useResponsive } from '../../hooks/useResponsive';
import { EnhancedCreature } from '../../types/creatures';

interface BreedingParentSelectorProps {
  selectedCreature: EnhancedCreature | null;
  onSelect: (creature: EnhancedCreature) => void;
  label: string;
  excludeCreatureId?: string;
}

const selectorStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
  },
  label: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#d4af37',
    textAlign: 'center' as const,
  },
  slot: {
    minHeight: '200px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  slotHover: {
    borderColor: '#d4af37',
    background: 'rgba(212, 175, 55, 0.1)',
  },
  slotEmpty: {
    textAlign: 'center' as const,
  },
  emptyIcon: {
    fontSize: '3rem',
    opacity: 0.5,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  selectedCard: {
    width: '100%',
  },
  changeButton: {
    marginTop: '0.5rem',
  },
  modalContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  searchContainer: {
    position: 'relative' as const,
  },
  searchInput: {
    width: '100%',
    padding: '0.75rem 2.5rem 0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    fontSize: '0.9rem',
    outline: 'none',
  },
  searchIcon: {
    position: 'absolute' as const,
    right: '0.75rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
  },
  filterSection: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  filterButton: {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    cursor: 'pointer',
    fontSize: '0.8rem',
    transition: 'all 0.3s ease',
  },
  filterButtonActive: {
    background: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
    color: '#d4af37',
  },
  creatureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
    maxHeight: '500px',
    overflowY: 'auto' as const,
    padding: '0.5rem',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '3rem 1rem',
    color: '#94a3b8',
    fontSize: '1rem',
  },
};

export const BreedingParentSelector: React.FC<BreedingParentSelectorProps> = ({
  selectedCreature,
  onSelect,
  label,
  excludeCreatureId,
}) => {
  const { collection } = useCreatures();
  const { isMobile } = useResponsive();

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRarity, setFilterRarity] = useState<string | null>(null);
  const [filterBredOnly, setFilterBredOnly] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Get available creatures (from creatures collection)
  const availableCreatures = useMemo(() => {
    // Use useCreatures hook which handles initialization properly
    const creatures = Object.values(collection.creatures || {});

    // Filter out the excluded creature
    let filtered = excludeCreatureId
      ? creatures.filter(c => c.id !== excludeCreatureId && c.creatureId !== excludeCreatureId)
      : creatures;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c => c.name.toLowerCase().includes(query) || c.species.toLowerCase().includes(query)
      );
    }

    // Apply rarity filter
    if (filterRarity) {
      filtered = filtered.filter(c => c.rarity === filterRarity);
    }

    // Apply bred only filter
    if (filterBredOnly) {
      filtered = filtered.filter(c => (c.generation || 0) > 0);
    }

    return filtered;
  }, [collection.creatures, excludeCreatureId, searchQuery, filterRarity, filterBredOnly]);

  // Unique rarities for filtering
  const availableRarities = useMemo(() => {
    const creatures = Object.values(collection.creatures || {});
    const rarities = new Set(creatures.map(c => c.rarity));
    return Array.from(rarities);
  }, [collection.creatures]);

  const handleSlotClick = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCreatureSelect = useCallback(
    (creature: EnhancedCreature) => {
      onSelect(creature);
      setShowModal(false);
      setSearchQuery('');
      setFilterRarity(null);
      setFilterBredOnly(false);
    },
    [onSelect]
  );

  const handleClearSelection = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // Create a dummy creature to clear (will be handled by parent)
      onSelect(null as any);
    },
    [onSelect]
  );

  return (
    <div style={selectorStyles.container}>
      <div style={selectorStyles.label}>{label}</div>

      <motion.div
        style={{
          ...selectorStyles.slot,
          ...(isHovering && !selectedCreature ? selectorStyles.slotHover : {}),
        }}
        onClick={handleSlotClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        whileHover={{ scale: selectedCreature ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {selectedCreature ? (
          <div style={selectorStyles.selectedCard}>
            <CreatureCard
              creature={selectedCreature}
              showActions={false}
              showDetails={true}
              size='md'
            />
            <div style={selectorStyles.changeButton}>
              <Button variant='secondary' size='sm' onClick={handleSlotClick} fullWidth>
                Change Parent
              </Button>
            </div>
          </div>
        ) : (
          <div style={selectorStyles.slotEmpty}>
            <div style={selectorStyles.emptyIcon}>👤</div>
            <div style={selectorStyles.emptyText}>Click to select {label}</div>
          </div>
        )}
      </motion.div>

      {/* Creature Selection Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`Select ${label}`}
        size='xl'
      >
        <div style={selectorStyles.modalContent}>
          {/* Search */}
          <div style={selectorStyles.searchContainer}>
            <input
              type='text'
              placeholder='Search creatures...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={selectorStyles.searchInput}
            />
            <span style={selectorStyles.searchIcon}>🔍</span>
          </div>

          {/* Rarity Filters */}
          <div style={selectorStyles.filterSection}>
            <button
              style={{
                ...selectorStyles.filterButton,
                ...(filterRarity === null ? selectorStyles.filterButtonActive : {}),
              }}
              onClick={() => setFilterRarity(null)}
            >
              All Rarities
            </button>
            {availableRarities.map(rarity => (
              <button
                key={rarity}
                style={{
                  ...selectorStyles.filterButton,
                  ...(filterRarity === rarity ? selectorStyles.filterButtonActive : {}),
                }}
                onClick={() => setFilterRarity(rarity)}
              >
                {rarity}
              </button>
            ))}
          </div>

          {/* Bred Only Filter */}
          <div style={selectorStyles.filterSection}>
            <button
              style={{
                ...selectorStyles.filterButton,
                ...(filterBredOnly ? selectorStyles.filterButtonActive : {}),
              }}
              onClick={() => setFilterBredOnly(!filterBredOnly)}
            >
              🧬 Bred Creatures Only
            </button>
          </div>

          {/* Creature Grid */}
          {availableCreatures.length === 0 ? (
            <div style={selectorStyles.emptyState}>
              {searchQuery || filterRarity
                ? 'No creatures match your filters'
                : 'No creatures available for breeding'}
            </div>
          ) : (
            <div style={selectorStyles.creatureGrid}>
              <AnimatePresence>
                {availableCreatures.map((creature, index) => (
                  <motion.div
                    key={creature.creatureId || creature.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <div onClick={() => handleCreatureSelect(creature)}>
                      <CreatureCard
                        creature={creature}
                        showActions={false}
                        showDetails={false}
                        size='sm'
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BreedingParentSelector;
