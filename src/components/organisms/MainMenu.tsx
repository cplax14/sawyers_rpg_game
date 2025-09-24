import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { usePlayer, useUI, useSaveLoad, useDataPreloader } from '../../hooks';
import { SaveSlot } from '../../types/game';
// import styles from './MainMenu.module.css'; // Temporarily disabled due to PostCSS parsing issues

interface MainMenuProps {
  onNewGame?: () => void;
  onContinue?: () => void;
  onLoadGame?: (slotIndex: number) => void;
  onSettings?: () => void;
  className?: string;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onNewGame,
  onContinue,
  onLoadGame,
  onSettings,
  className
}) => {
  const { player } = usePlayer();
  const { navigateToScreen } = useUI();
  const { saveSlots, hasAnySaves, loadGame } = useSaveLoad();
  const { preloadCriticalData, isDataReady } = useDataPreloader();

  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);
  const [selectedSaveSlot, setSelectedSaveSlot] = useState<number | null>(null);

  // Preload critical data on mount
  useEffect(() => {
    const preload = async () => {
      setIsPreloading(true);
      try {
        await preloadCriticalData();
      } catch (error) {
        console.error('Failed to preload critical data:', error);
      } finally {
        setIsPreloading(false);
      }
    };

    if (!isDataReady()) {
      preload();
    }
  }, [preloadCriticalData, isDataReady]);

  const handleNewGame = useCallback(() => {
    if (onNewGame) {
      onNewGame();
    } else {
      navigateToScreen('character-selection');
    }
  }, [onNewGame, navigateToScreen]);

  const handleContinue = useCallback(() => {
    if (player) {
      if (onContinue) {
        onContinue();
      } else {
        navigateToScreen('world-map');
      }
    } else {
      // No current game, show load menu instead
      setShowLoadMenu(true);
    }
  }, [player, onContinue, navigateToScreen]);

  const handleLoadGame = useCallback((slotIndex: number) => {
    if (onLoadGame) {
      onLoadGame(slotIndex);
    } else {
      loadGame(slotIndex);
      navigateToScreen('world-map');
    }
    setShowLoadMenu(false);
  }, [onLoadGame, loadGame, navigateToScreen]);

  const handleSettings = useCallback(() => {
    if (onSettings) {
      onSettings();
    } else {
      navigateToScreen('settings');
    }
  }, [onSettings, navigateToScreen]);

  const handleShowLoadMenu = useCallback(() => {
    setShowLoadMenu(true);
  }, []);

  const handleHideLoadMenu = useCallback(() => {
    setShowLoadMenu(false);
    setSelectedSaveSlot(null);
  }, []);

  const formatPlayTime = useCallback((playTime: number): string => {
    const hours = Math.floor(playTime / 3600000);
    const minutes = Math.floor((playTime % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  const formatSaveDate = useCallback((timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const renderSaveSlot = useCallback((slot: SaveSlot, index: number) => {
    const isSelected = selectedSaveSlot === index;
    const isEmpty = !slot.data;

    return (
      <motion.div
        key={index}
        className={`${styles.saveSlot} ${isEmpty ? styles.empty : ''} ${
          isSelected ? styles.selected : ''
        }`}
        onClick={() => setSelectedSaveSlot(isEmpty ? null : index)}
        onDoubleClick={() => !isEmpty && handleLoadGame(index)}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1, duration: 0.3 }}
        whileHover={{ scale: isEmpty ? 1 : 1.02 }}
        whileTap={{ scale: isEmpty ? 1 : 0.98 }}
      >
        <div className={styles.saveSlotHeader}>
          <span className={styles.slotNumber}>Slot {index + 1}</span>
          {!isEmpty && (
            <span className={styles.saveDate}>
              {formatSaveDate(slot.timestamp)}
            </span>
          )}
        </div>

        {isEmpty ? (
          <div className={styles.emptySlot}>
            <span>Empty Slot</span>
          </div>
        ) : (
          <div className={styles.saveInfo}>
            <div className={styles.playerInfo}>
              <span className={styles.playerName}>{slot.data!.player!.name}</span>
              <span className={styles.playerClass}>
                Level {slot.data!.player!.level} {slot.data!.player!.characterClass}
              </span>
            </div>
            <div className={styles.gameInfo}>
              <span className={styles.location}>
                {slot.data!.currentArea || 'Unknown Location'}
              </span>
              <span className={styles.playTime}>
                {formatPlayTime(slot.data!.totalPlayTime)}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    );
  }, [selectedSaveSlot, handleLoadGame, formatSaveDate, formatPlayTime]);

  if (isPreloading) {
    return (
      <div className={`${styles.mainMenu} ${className || ''}`}>
        <div className={styles.preloadingContainer}>
          <motion.div
            className={styles.logo}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1>Sawyer's RPG</h1>
          </motion.div>
          <LoadingSpinner size="large" />
          <p className={styles.preloadingText}>Loading game data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.mainMenu} ${className || ''}`}>
      <div className={styles.container}>
        {/* Background Elements */}
        <div className={styles.backgroundPattern} />

        {/* Main Menu Content */}
        <AnimatePresence mode="wait">
          {!showLoadMenu ? (
            <motion.div
              key="main-menu"
              className={styles.menuContent}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Logo */}
              <motion.div
                className={styles.logo}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <h1 className={styles.gameTitle}>Sawyer's RPG</h1>
                <p className={styles.gameSubtitle}>Monster Taming Adventure</p>
              </motion.div>

              {/* Current Player Info */}
              <AnimatePresence>
                {player && (
                  <motion.div
                    className={styles.playerInfo}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className={styles.welcomeText}>Welcome back,</span>
                    <span className={styles.playerName}>{player.name}</span>
                    <span className={styles.playerDetails}>
                      Level {player.level} {player.characterClass}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Menu Buttons */}
              <motion.div
                className={styles.menuButtons}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleContinue}
                  disabled={!player && !hasAnySaves}
                  className={styles.menuButton}
                >
                  {player ? 'Continue Game' : 'Continue'}
                </Button>

                <Button
                  variant="secondary"
                  size="large"
                  onClick={handleNewGame}
                  className={styles.menuButton}
                >
                  New Game
                </Button>

                <Button
                  variant="secondary"
                  size="large"
                  onClick={handleShowLoadMenu}
                  disabled={!hasAnySaves}
                  className={styles.menuButton}
                >
                  Load Game
                </Button>

                <Button
                  variant="secondary"
                  size="large"
                  onClick={handleSettings}
                  className={styles.menuButton}
                >
                  Settings
                </Button>
              </motion.div>

              {/* Footer */}
              <motion.div
                className={styles.footer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.5 }}
              >
                <p>A React port of the classic monster taming RPG</p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="load-menu"
              className={styles.loadMenuContent}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.loadMenuHeader}>
                <h2 className={styles.loadMenuTitle}>Load Game</h2>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={handleHideLoadMenu}
                  className={styles.backButton}
                >
                  ← Back
                </Button>
              </div>

              <div className={styles.saveSlotsList}>
                {saveSlots.map((slot, index) => renderSaveSlot(slot, index))}
              </div>

              <div className={styles.loadMenuActions}>
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => selectedSaveSlot !== null && handleLoadGame(selectedSaveSlot)}
                  disabled={selectedSaveSlot === null || !saveSlots[selectedSaveSlot || 0]?.data}
                >
                  Load Selected Save
                </Button>
              </div>

              {saveSlots.every(slot => !slot.data) && (
                <div className={styles.noSavesMessage}>
                  <p>No saved games found. Start a new game to create your first save.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MainMenu;