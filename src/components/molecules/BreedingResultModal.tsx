import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../atoms/Modal';
import { Button } from '../atoms/Button';
import { CreatureCard } from './CreatureCard';
import { BreedingResult } from '../../types/breeding';
import { useGameState } from '../../hooks/useGameState';

interface BreedingResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: BreedingResult;
  onBreedAgain?: () => void;
  onViewInCollection?: () => void;
}

const resultStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  celebration: {
    textAlign: 'center' as const,
    padding: '1.5rem',
  },
  celebrationIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '0.5rem',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
  },
  offspringSection: {
    background: 'rgba(212, 175, 55, 0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '2px solid rgba(212, 175, 55, 0.3)',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '1rem',
    textAlign: 'center' as const,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginTop: '1rem',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '1rem',
    textAlign: 'center' as const,
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginBottom: '0.5rem',
  },
  statValue: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#d4af37',
  },
  abilitiesSection: {
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '2px solid rgba(59, 130, 246, 0.3)',
  },
  abilityList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  abilityItem: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '8px',
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  abilityIcon: {
    fontSize: '1.5rem',
  },
  abilityName: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    color: '#f4f4f4',
  },
  messagesSection: {
    background: 'rgba(34, 197, 94, 0.1)',
    borderRadius: '12px',
    padding: '1rem',
    border: '1px solid rgba(34, 197, 94, 0.3)',
  },
  messageList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  message: {
    fontSize: '0.9rem',
    color: '#f4f4f4',
    padding: '0.5rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px',
  },
  nameInput: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f4f4f4',
    fontSize: '1rem',
    outline: 'none',
    textAlign: 'center' as const,
  },
  actionsSection: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
  },
  rarityUpgradeBanner: {
    background: 'linear-gradient(90deg, #f59e0b, #d97706)',
    padding: '1rem',
    borderRadius: '8px',
    textAlign: 'center' as const,
    marginBottom: '1rem',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    color: '#fff',
  },
};

export const BreedingResultModal: React.FC<BreedingResultModalProps> = ({
  isOpen,
  onClose,
  result,
  onBreedAgain,
  onViewInCollection,
}) => {
  const { dispatch } = useGameState();
  const [customName, setCustomName] = useState(result.offspring?.name || '');

  const handleNameChange = useCallback(
    (newName: string) => {
      if (!result.offspring) return;

      // Update creature name in game state
      dispatch({
        type: 'RENAME_MONSTER',
        payload: {
          monsterId: result.offspring.creatureId,
          nickname: newName,
        },
      });

      setCustomName(newName);
    },
    [result.offspring, dispatch]
  );

  const handleSaveName = useCallback(() => {
    if (!customName.trim()) return;
    handleNameChange(customName.trim());
  }, [customName, handleNameChange]);

  if (!result.offspring) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title='Breeding Failed' size='md'>
        <div style={resultStyles.container}>
          <div style={resultStyles.celebration}>
            <div style={resultStyles.celebrationIcon}>😞</div>
            <div style={resultStyles.title}>Breeding Failed</div>
            <div style={resultStyles.subtitle}>
              {result.error || 'An unknown error occurred during breeding.'}
            </div>
          </div>
          <div style={resultStyles.actionsSection}>
            <Button variant='secondary' size='lg' onClick={onClose}>
              Close
            </Button>
            {onBreedAgain && (
              <Button variant='primary' size='lg' onClick={onBreedAgain}>
                Try Again
              </Button>
            )}
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Breeding Successful!' size='lg'>
      <div style={resultStyles.container}>
        {/* Celebration Header */}
        <motion.div
          style={resultStyles.celebration}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <motion.div
            style={resultStyles.celebrationIcon}
            animate={{
              rotate: [0, -10, 10, -10, 10, 0],
              scale: [1, 1.1, 1, 1.1, 1],
            }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
          >
            🎉
          </motion.div>
          <div style={resultStyles.title}>
            {result.rarityUpgraded ? '✨ Legendary Offspring! ✨' : 'New Creature Born!'}
          </div>
          <div style={resultStyles.subtitle}>Congratulations! Your breeding was successful!</div>
        </motion.div>

        {/* Rarity Upgrade Banner */}
        {result.rarityUpgraded && (
          <motion.div
            style={resultStyles.rarityUpgradeBanner}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            🌟 Rarity Upgraded to {result.offspring.rarity}! 🌟
          </motion.div>
        )}

        {/* Offspring Creature Card */}
        <motion.div
          style={resultStyles.offspringSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div style={resultStyles.sectionTitle}>Your New Creature</div>
          <CreatureCard
            creature={result.offspring}
            showActions={false}
            showDetails={true}
            size='lg'
          />

          {/* Name Input */}
          <div style={{ marginTop: '1rem' }}>
            <input
              type='text'
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              onBlur={handleSaveName}
              onKeyPress={e => e.key === 'Enter' && handleSaveName()}
              placeholder='Enter custom name...'
              style={resultStyles.nameInput}
            />
          </div>
        </motion.div>

        {/* Offspring Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div style={resultStyles.sectionTitle}>Stats Summary</div>
          <div style={resultStyles.statsGrid}>
            <div style={resultStyles.statCard}>
              <div style={resultStyles.statLabel}>Generation</div>
              <div style={resultStyles.statValue}>Gen {result.generation}</div>
            </div>
            <div style={resultStyles.statCard}>
              <div style={resultStyles.statLabel}>Species</div>
              <div style={resultStyles.statValue}>{result.offspringSpecies}</div>
            </div>
            <div style={resultStyles.statCard}>
              <div style={resultStyles.statLabel}>Rarity</div>
              <div style={resultStyles.statValue}>{result.offspring.rarity}</div>
            </div>
            <div style={resultStyles.statCard}>
              <div style={resultStyles.statLabel}>Level</div>
              <div style={resultStyles.statValue}>{result.offspring.level}</div>
            </div>
          </div>
        </motion.div>

        {/* Inherited Abilities */}
        {result.inheritedAbilities.length > 0 && (
          <motion.div
            style={resultStyles.abilitiesSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div style={resultStyles.sectionTitle}>Inherited Abilities</div>
            <div style={resultStyles.abilityList}>
              <AnimatePresence>
                {result.inheritedAbilities.map((ability, index) => (
                  <motion.div
                    key={ability}
                    style={resultStyles.abilityItem}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                  >
                    <span style={resultStyles.abilityIcon}>⚡</span>
                    <span style={resultStyles.abilityName}>{ability}</span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Messages */}
        {result.messages.length > 0 && (
          <motion.div
            style={resultStyles.messagesSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div style={resultStyles.messageList}>
              {result.messages.map((message, index) => (
                <motion.div
                  key={index}
                  style={resultStyles.message}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  {message}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          style={resultStyles.actionsSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          {onViewInCollection && (
            <Button variant='primary' size='lg' onClick={onViewInCollection}>
              View in Collection
            </Button>
          )}
          {onBreedAgain && (
            <Button variant='success' size='lg' onClick={onBreedAgain}>
              Breed Again
            </Button>
          )}
          <Button variant='secondary' size='lg' onClick={onClose}>
            Close
          </Button>
        </motion.div>
      </div>
    </Modal>
  );
};

export default BreedingResultModal;
