import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CharacterClassCard } from '../molecules/CharacterClassCard';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { useCharacterClasses, usePlayer, useUI, useResponsive } from '../../hooks';
import { ReactCharacterClass } from '../../types/game';
import { characterSelectionStyles } from '../../utils/temporaryStyles';
// import styles from './CharacterSelection.module.css'; // Temporarily disabled due to PostCSS parsing issues

const styles = characterSelectionStyles;

interface CharacterSelectionProps {
  onCharacterCreated?: () => void;
  className?: string;
}

export const CharacterSelection: React.FC<CharacterSelectionProps> = ({
  onCharacterCreated,
  className
}) => {
  const { characterClasses, isLoading, error } = useCharacterClasses();
  const { createPlayer } = usePlayer();
  const { navigateToScreen } = useUI();
  const { isMobile, isTablet, isLandscape } = useResponsive();

  const [selectedClass, setSelectedClass] = useState<ReactCharacterClass | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  // Ref to track current selectedClass value (fixes stale closure bug)
  const selectedClassRef = useRef<ReactCharacterClass | null>(null);

  // Keep ref in sync with selectedClass state
  useEffect(() => {
    selectedClassRef.current = selectedClass;
  }, [selectedClass]);

  // Auto-select first class if available
  useEffect(() => {
    if (characterClasses.length > 0 && !selectedClass) {
      setSelectedClass(characterClasses[0]);
    }
  }, [characterClasses, selectedClass]);

  const validateName = useCallback((name: string): boolean => {
    setNameError(null);

    if (!name.trim()) {
      setNameError('Player name is required');
      return false;
    }

    if (name.trim().length < 2) {
      setNameError('Player name must be at least 2 characters');
      return false;
    }

    if (name.trim().length > 20) {
      setNameError('Player name must be less than 20 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9\s-_]+$/.test(name.trim())) {
      setNameError('Player name can only contain letters, numbers, spaces, hyphens, and underscores');
      return false;
    }

    return true;
  }, []);

  const handleNameChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPlayerName(value);
    if (nameError) {
      validateName(value);
    }
  }, [nameError, validateName]);

  const handleClassSelect = useCallback((characterClass: ReactCharacterClass) => {
    setSelectedClass(characterClass);
  }, []);

  const handleCreateCharacter = useCallback(async () => {
    // Use ref to get current value, not stale closure value
    const currentClass = selectedClassRef.current;

    if (!currentClass || !validateName(playerName)) {
      return;
    }

    setIsCreating(true);

    try {
      // Simulate character creation delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      createPlayer(playerName.trim(), currentClass.id);

      // Navigate to world map or trigger callback
      if (onCharacterCreated) {
        onCharacterCreated();
      } else {
        navigateToScreen('world-map');
      }
    } catch (error) {
      console.error('Failed to create character:', error);
      setNameError('Failed to create character. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }, [playerName, validateName, createPlayer, onCharacterCreated, navigateToScreen]);
  // Note: selectedClass removed from deps since we use selectedClassRef.current

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isCreating) {
      handleCreateCharacter();
    }
  }, [handleCreateCharacter, isCreating]);

  if (isLoading) {
    return (
      <div className={`${styles.characterSelection} ${className || ''}`}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <p className={styles.loadingText}>Loading character classes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.characterSelection} ${className || ''}`}>
        <div className={styles.errorContainer}>
          <h2>Failed to Load Character Classes</h2>
          <p className={styles.errorMessage}>{error}</p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.characterSelection} ${className || ''}`}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'auto',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        color: '#f4f4f4',
        padding: '1rem',
        boxSizing: 'border-box'
      }}
    >
      <motion.div
        className={styles.container}
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem',
          minHeight: 'fit-content'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1
            className={styles.title}
            style={{
              fontSize: isMobile ? (isLandscape ? '1.5rem' : '1.75rem') : isTablet ? '2rem' : '2.25rem',
              textAlign: 'center',
              margin: '0 0 1rem 0'
            }}
          >
            Create Your Character
          </h1>
          <p
            className={styles.subtitle}
            style={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              textAlign: 'center',
              margin: '0 0 1.5rem 0',
              color: '#94a3b8'
            }}
          >
            Choose your class and enter your name to begin your adventure
          </p>
        </motion.div>

        {/* Character Name Input */}
        <motion.div
          className={styles.nameSection}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <label htmlFor="player-name" className={styles.nameLabel}>
            Character Name
          </label>
          <Input
            id="player-name"
            type="text"
            value={playerName}
            onChange={handleNameChange}
            onKeyPress={handleKeyPress}
            placeholder="Enter your character's name..."
            error={nameError}
            maxLength={20}
            disabled={isCreating}
            className={styles.nameInput}
          />
        </motion.div>

        {/* Class Selection */}
        <motion.div
          className={styles.classSection}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className={styles.sectionTitle}>Choose Your Class</h2>

          <div className={styles.classGrid}>
            <AnimatePresence>
              {characterClasses.map((characterClass, index) => (
                <motion.div
                  key={characterClass.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    delay: 0.8 + index * 0.1,
                    duration: 0.4
                  }}
                  className={styles.classCardWrapper}
                >
                  <CharacterClassCard
                    characterClass={characterClass}
                    selected={selectedClass?.id === characterClass.id}
                    onClick={handleClassSelect}
                    disabled={isCreating}
                    showDetailedStats={true}
                    showClassBonus={true}
                    variant="default"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Selected Class Preview */}
        <AnimatePresence>
          {selectedClass && (
            <motion.div
              className={styles.previewSection}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className={styles.previewTitle}>
                Selected Class: {selectedClass.name}
              </h3>
              <div className={styles.previewContent}>
                <div className={styles.previewStats}>
                  <h4>Starting Stats</h4>
                  <div className={styles.statsList}>
                    <div className={styles.statItem}>
                      <span>HP:</span>
                      <span>{selectedClass.baseStats.hp}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span>MP:</span>
                      <span>{selectedClass.baseStats.mp}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span>Attack:</span>
                      <span>{selectedClass.baseStats.attack}</span>
                    </div>
                    <div className={styles.statItem}>
                      <span>Defense:</span>
                      <span>{selectedClass.baseStats.defense}</span>
                    </div>
                  </div>
                </div>

                {selectedClass.startingSpells.length > 0 && (
                  <div className={styles.previewSpells}>
                    <h4>Starting Abilities</h4>
                    <div className={styles.spellsList}>
                      {selectedClass.startingSpells.map(spell => (
                        <span key={spell} className={styles.spellTag}>
                          {spell.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Create Button */}
        <motion.div
          className={styles.actionSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.5 }}
        >
          <Button
            variant="primary"
            size={isMobile ? "md" : "large"}
            onClick={handleCreateCharacter}
            disabled={!selectedClass || !playerName || typeof playerName !== 'string' || !playerName.trim() || isCreating || !!nameError}
            loading={isCreating}
            className={styles.createButton}
            touchFriendly={true}
            style={{
              minHeight: '48px',
              width: '100%',
              maxWidth: isMobile ? '100%' : '300px'
            }}
          >
            {isCreating ? 'Creating Character...' : 'Start Adventure'}
          </Button>

          <p className={styles.disclaimer}>
            Your adventure will begin in the peaceful village where you can learn the basics
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CharacterSelection;