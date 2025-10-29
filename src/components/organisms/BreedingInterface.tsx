import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { Modal } from '../atoms/Modal';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { HelpTooltip } from '../atoms/HelpTooltip';
import { BreedingParentSelector } from '../molecules/BreedingParentSelector';
import { BreedingCostDisplay } from '../molecules/BreedingCostDisplay';
import { BreedingResultModal } from '../molecules/BreedingResultModal';
import { BreedingRecipeBook } from '../molecules/BreedingRecipeBook';
import { useGameState } from '../../hooks/useGameState';
import { useResponsive } from '../../hooks/useResponsive';
import { EnhancedCreature } from '../../types/creatures';
import { BreedingResult, BreedingCost } from '../../types/breeding';
import {
  calculateBreedingCost,
  generateOffspring,
  validateBreeding,
} from '../../utils/breedingEngine';

interface BreedingInterfaceProps {
  className?: string;
  onClose?: () => void;
}

type ViewTab = 'breed' | 'recipes' | 'history';

const breedingStyles = {
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
  tabs: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1.5rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  tab: {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  tabActive: {
    background: 'rgba(212, 175, 55, 0.2)',
    borderColor: '#d4af37',
    color: '#d4af37',
  },
  content: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  breedingArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  parentsSection: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gap: '1rem',
    alignItems: 'center',
  },
  plusIcon: {
    fontSize: '2rem',
    color: '#d4af37',
    fontWeight: 'bold',
  },
  previewSection: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '2px solid rgba(212, 175, 55, 0.3)',
  },
  previewTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '1rem',
  },
  previewContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  previewRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  previewLabel: {
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  previewValue: {
    color: '#f4f4f4',
    fontSize: '0.9rem',
    fontWeight: 'bold',
  },
  actionsSection: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '1rem',
  },
  errorMessage: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '8px',
    padding: '1rem',
    color: '#ef4444',
    fontSize: '0.9rem',
    textAlign: 'center' as const,
  },
  confirmModalContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  confirmText: {
    fontSize: '1rem',
    color: '#f4f4f4',
    textAlign: 'center' as const,
  },
  confirmActions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '1rem',
  },
};

export const BreedingInterface: React.FC<BreedingInterfaceProps> = ({ className, onClose }) => {
  const { state: gameState, dispatch } = useGameState();
  const { isMobile } = useResponsive();

  // Local state
  const [activeTab, setActiveTab] = useState<ViewTab>('breed');
  const [selectedParent1, setSelectedParent1] = useState<EnhancedCreature | null>(null);
  const [selectedParent2, setSelectedParent2] = useState<EnhancedCreature | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [breedingResult, setBreedingResult] = useState<BreedingResult | null>(null);
  const [isBreeding, setIsBreeding] = useState(false);

  // Calculate breeding cost and validation
  const breedingCost = useMemo(() => {
    if (!selectedParent1 || !selectedParent2) return null;

    // TODO: Check for matching recipe
    const recipe = undefined; // Will be implemented when recipe matching is added

    return calculateBreedingCost(selectedParent1, selectedParent2, recipe);
  }, [selectedParent1, selectedParent2]);

  const validation = useMemo(() => {
    if (!selectedParent1 || !selectedParent2 || !breedingCost) {
      return { valid: false, errors: ['Please select two parent creatures'], warnings: [] };
    }

    return validateBreeding(
      selectedParent1,
      selectedParent2,
      gameState.player?.gold || 0,
      gameState.breedingMaterials || {},
      breedingCost
    );
  }, [
    selectedParent1,
    selectedParent2,
    breedingCost,
    gameState.player?.gold,
    gameState.breedingMaterials,
  ]);

  // Handle parent selection
  const handleParent1Select = useCallback((creature: EnhancedCreature) => {
    setSelectedParent1(creature);
  }, []);

  const handleParent2Select = useCallback((creature: EnhancedCreature) => {
    setSelectedParent2(creature);
  }, []);

  // Handle breeding confirmation
  const handleBreedClick = useCallback(() => {
    if (!validation.valid) return;
    setShowConfirmModal(true);
  }, [validation.valid]);

  // Handle breeding execution
  const handleConfirmBreed = useCallback(async () => {
    if (!selectedParent1 || !selectedParent2 || !breedingCost) return;

    setShowConfirmModal(false);
    setIsBreeding(true);

    try {
      // Simulate breeding process with delay for UX
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Dispatch breeding action to update game state
      // The reducer will handle offspring generation, cost deduction, and exhaustion internally
      dispatch({
        type: 'BREED_CREATURES',
        payload: {
          parent1Id: selectedParent1.creatureId,
          parent2Id: selectedParent2.creatureId,
          recipeId: undefined, // TODO: Find matching recipe based on parents
        },
      });

      // Generate result for UI display (reducer already updated state)
      const recipe = undefined; // TODO: Find matching recipe
      const result = generateOffspring(selectedParent1, selectedParent2, recipe);

      // Wait for React state update to propagate to all hooks
      await new Promise(resolve => setTimeout(resolve, 500));

      // Show result modal
      setBreedingResult(result);
      setShowResultModal(true);

      // Reset selections
      setSelectedParent1(null);
      setSelectedParent2(null);
    } catch (error) {
      console.error('Breeding failed:', error);

      // Show user-friendly error message
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred during breeding';

      alert(`Breeding Failed: ${errorMessage}`);
    } finally {
      setIsBreeding(false);
    }
  }, [selectedParent1, selectedParent2, breedingCost, dispatch]);

  // Handle result modal close
  const handleResultClose = useCallback(() => {
    setShowResultModal(false);
    setBreedingResult(null);

    // Navigate back to collection view so user can see the new creature
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Handle breed again from result modal
  const handleBreedAgain = useCallback(() => {
    setShowResultModal(false);
    setBreedingResult(null);
  }, []);

  // Render breeding tab content
  const renderBreedingTab = () => (
    <div style={breedingStyles.breedingArea}>
      {/* Parent Selection */}
      <div
        style={{
          ...breedingStyles.parentsSection,
          gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr',
        }}
      >
        <BreedingParentSelector
          selectedCreature={selectedParent1}
          onSelect={handleParent1Select}
          label='Parent 1'
          excludeCreatureId={selectedParent2?.creatureId}
        />

        {!isMobile && <div style={breedingStyles.plusIcon}>+</div>}

        <BreedingParentSelector
          selectedCreature={selectedParent2}
          onSelect={handleParent2Select}
          label='Parent 2'
          excludeCreatureId={selectedParent1?.creatureId}
        />
      </div>

      {/* Preview and Cost */}
      {selectedParent1 && selectedParent2 && breedingCost && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div style={breedingStyles.previewSection}>
            <h3 style={breedingStyles.previewTitle}>
              Offspring Preview
              <HelpTooltip
                title='Offspring Preview'
                content="Generation determines stat caps (+10% per gen). Offspring will inherit 70-90% of parent stats with 40% chance for better parent's value. Each parent's abilities have 30% inheritance chance."
                position='right'
                maxWidth={280}
                style={{ marginLeft: '0.5rem' }}
              />
            </h3>
            <div style={breedingStyles.previewContent}>
              <div style={breedingStyles.previewRow}>
                <span style={breedingStyles.previewLabel}>
                  Generation:
                  <HelpTooltip
                    content='Max generation is 5. Each generation grants +10% stat caps (+5% per gen bonus on base stats). Higher gens unlock more ability slots.'
                    position='top'
                    maxWidth={250}
                    style={{ marginLeft: '0.25rem' }}
                  />
                </span>
                <span style={breedingStyles.previewValue}>
                  Gen{' '}
                  {Math.min(
                    Math.max(selectedParent1.generation || 0, selectedParent2.generation || 0) + 1,
                    5
                  )}
                </span>
              </div>
              <div style={breedingStyles.previewRow}>
                <span style={breedingStyles.previewLabel}>Possible Species:</span>
                <span style={breedingStyles.previewValue}>
                  {selectedParent1.species} or {selectedParent2.species}
                </span>
              </div>
              <div style={breedingStyles.previewRow}>
                <span style={breedingStyles.previewLabel}>
                  Rarity Upgrade Chance:
                  <HelpTooltip
                    content='10% chance to upgrade rarity tier. Legendary can become Mythical with incredible stat multipliers and ultimate abilities!'
                    position='top'
                    maxWidth={250}
                    style={{ marginLeft: '0.25rem' }}
                  />
                </span>
                <span style={breedingStyles.previewValue}>10%</span>
              </div>
            </div>
          </div>

          <BreedingCostDisplay
            cost={breedingCost}
            playerGold={gameState.player?.gold || 0}
            playerMaterials={gameState.breedingMaterials || {}}
          />
        </motion.div>
      )}

      {/* Validation Errors */}
      {!validation.valid && selectedParent1 && selectedParent2 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={breedingStyles.errorMessage}
        >
          {validation.errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </motion.div>
      )}

      {/* Breed Button */}
      <div style={breedingStyles.actionsSection}>
        <Button
          variant='primary'
          size='lg'
          disabled={!validation.valid || isBreeding}
          onClick={handleBreedClick}
          loading={isBreeding}
          aria-label={isBreeding ? 'Breeding creatures in progress' : 'Breed selected creatures'}
          aria-busy={isBreeding}
        >
          {isBreeding ? 'Breeding...' : 'Breed Creatures'}
        </Button>

        {(selectedParent1 || selectedParent2) && (
          <Button
            variant='secondary'
            size='lg'
            onClick={() => {
              setSelectedParent1(null);
              setSelectedParent2(null);
            }}
            aria-label='Clear selected parent creatures'
          >
            Clear Selection
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className={className} style={breedingStyles.container}>
      {/* Header */}
      <motion.div
        style={breedingStyles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ ...breedingStyles.title, fontSize: isMobile ? '1.5rem' : '2rem' }}>
          Creature Breeding
          <HelpTooltip
            title='Creature Breeding System'
            content="Combine two creatures to create offspring with inherited stats and abilities. Higher generation creatures have better stat caps. There's a 10% chance for rarity upgrades!"
            position='bottom'
            maxWidth={300}
            style={{ marginLeft: '0.5rem' }}
          />
        </h1>
        <p style={breedingStyles.subtitle}>Combine two creatures to create powerful offspring</p>
      </motion.div>

      {/* Tabs */}
      <motion.div
        style={breedingStyles.tabs}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <motion.button
          style={{
            ...breedingStyles.tab,
            ...(activeTab === 'breed' ? breedingStyles.tabActive : {}),
          }}
          onClick={() => setActiveTab('breed')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label='Breed creatures tab'
          aria-pressed={activeTab === 'breed'}
          role='tab'
        >
          <span>🧬</span>
          <span>Breed</span>
        </motion.button>

        <motion.button
          style={{
            ...breedingStyles.tab,
            ...(activeTab === 'recipes' ? breedingStyles.tabActive : {}),
          }}
          onClick={() => setActiveTab('recipes')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label='View breeding recipes tab'
          aria-pressed={activeTab === 'recipes'}
          role='tab'
        >
          <span>📖</span>
          <span>Recipes</span>
        </motion.button>

        <motion.button
          style={{
            ...breedingStyles.tab,
            ...(activeTab === 'history' ? breedingStyles.tabActive : {}),
          }}
          onClick={() => setActiveTab('history')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label='View breeding history tab'
          aria-pressed={activeTab === 'history'}
          role='tab'
        >
          <span>📜</span>
          <span>History</span>
        </motion.button>
      </motion.div>

      {/* Content */}
      <div style={breedingStyles.content}>
        <AnimatePresence mode='wait'>
          {activeTab === 'breed' && (
            <motion.div
              key='breed'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {renderBreedingTab()}
            </motion.div>
          )}

          {activeTab === 'recipes' && (
            <motion.div
              key='recipes'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <BreedingRecipeBook
                discoveredRecipes={gameState.discoveredRecipes || []}
                playerLevel={gameState.player?.level || 1}
              />
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key='history'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}
            >
              <h3>Breeding History</h3>
              <p>This feature will track all your breeding attempts and results.</p>
              <p style={{ fontSize: '0.9rem', marginTop: '1rem' }}>Coming soon...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title='Confirm Breeding'
        size='md'
      >
        <div style={breedingStyles.confirmModalContent}>
          <p style={breedingStyles.confirmText}>
            Are you sure you want to breed {selectedParent1?.name} and {selectedParent2?.name}?
          </p>
          <p style={breedingStyles.confirmText}>
            This will cost {breedingCost?.goldAmount.toLocaleString()} gold and apply exhaustion to
            both parents.
          </p>

          <div style={breedingStyles.confirmActions}>
            <Button variant='primary' size='lg' onClick={handleConfirmBreed}>
              Confirm
            </Button>
            <Button variant='secondary' size='lg' onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Result Modal */}
      {breedingResult && (
        <BreedingResultModal
          isOpen={showResultModal}
          onClose={handleResultClose}
          result={breedingResult}
          onBreedAgain={handleBreedAgain}
        />
      )}

      {/* Close Button */}
      {onClose && (
        <Button
          variant='secondary'
          size='sm'
          onClick={onClose}
          style={{
            position: 'absolute' as const,
            top: '1rem',
            right: '1rem',
            zIndex: 10,
          }}
        >
          ✕
        </Button>
      )}
    </div>
  );
};

export default BreedingInterface;
