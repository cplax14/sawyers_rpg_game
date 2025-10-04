import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { usePlayer, useUI, useSaveLoad, useDataPreloader, useResponsive, useReducedMotion, useSaveSystem } from '../../hooks';
import { useAuth } from '../../hooks/useAuth';
import { useCloudSave } from '../../hooks/useCloudSave';
import { SaveSlot } from '../../types/game';
import { mainMenuStyles } from '../../utils/temporaryStyles';
import { SaveLoadManager } from './SaveLoadManager';
import { AuthenticationModal } from '../molecules/AuthenticationModal';
import { CloudSaveManager } from './CloudSaveManager';
// import styles from './MainMenu.module.css'; // Temporarily disabled due to PostCSS parsing issues

const styles = mainMenuStyles;

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
  const { isMobile, isTablet, isLandscape } = useResponsive();
  const { animationConfig } = useReducedMotion();
  const {
    saveSlots: newSaveSlots,
    isInitialized: saveSystemInitialized,
    loadGame: loadGameNew,
    refreshSlots
  } = useSaveSystem();

  // Check if there are any non-empty saves in the new system
  const hasNewSaves = saveSystemInitialized && newSaveSlots.length > 0 && newSaveSlots.some(slot => !slot.isEmpty);
  const hasSavedGames = hasAnySaves || hasNewSaves;

  // Force refresh slots if initialized but empty (timing issue workaround)
  useEffect(() => {
    if (saveSystemInitialized && newSaveSlots.length === 0) {
      console.log('⚠️ Save system initialized but no slots loaded, forcing refresh...');
      refreshSlots?.();
    }
  }, [saveSystemInitialized, newSaveSlots.length, refreshSlots]);

  // Debug logging
  useEffect(() => {
    console.log('MainMenu save state:', {
      saveSystemInitialized,
      newSaveSlotsLength: newSaveSlots.length,
      hasNewSaves,
      hasAnySaves,
      hasSavedGames,
      nonEmptySlots: newSaveSlots.filter(s => !s.isEmpty).map(s => s.slotNumber)
    });
  }, [saveSystemInitialized, newSaveSlots, hasNewSaves, hasAnySaves, hasSavedGames]);

  // Authentication and cloud save hooks
  const { isAuthenticated, user, signOut } = useAuth();
  const { isOnline, lastSyncTime, syncInProgress } = useCloudSave();

  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCloudManager, setShowCloudManager] = useState(false);
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
    if (saveSystemInitialized && newSaveSlots.some(slot => !slot.isEmpty)) {
      setShowSaveManager(true);
    } else {
      setShowLoadMenu(true);
    }
  }, [saveSystemInitialized, newSaveSlots]);

  const handleHideLoadMenu = useCallback(() => {
    setShowLoadMenu(false);
    setSelectedSaveSlot(null);
  }, []);

  const handleCloseSaveManager = useCallback(() => {
    setShowSaveManager(false);
  }, []);

  const handleLoadComplete = useCallback(async (slotNumber: number) => {
    setShowSaveManager(false);
    navigateToScreen('world-map');
  }, [navigateToScreen]);

  // Authentication handlers
  const handleSignIn = useCallback(() => {
    setShowAuthModal(true);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [signOut]);

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  const handleCloudSaves = useCallback(() => {
    setShowCloudManager(true);
  }, []);

  const handleCloseCloudManager = useCallback(() => {
    setShowCloudManager(false);
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

  // Responsive container styles
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    width: '100vw',
    height: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    padding: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
    position: 'relative' as const,
    overflow: isMobile ? 'auto' : 'hidden'
  };

  const innerContainerStyle = {
    maxWidth: isMobile ? '100%' : isTablet ? '400px' : '500px',
    width: '100%',
    textAlign: 'center' as const
  };

  return (
    <div
      className={`${styles.mainMenu} ${className || ''}`}
      style={containerStyle}
    >
      <div
        className={styles.container}
        style={innerContainerStyle}
      >
        {/* Background Elements */}
        <div className={styles.backgroundPattern} />

        {/* Authentication Status Bar */}
        <motion.div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '8px 12px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            fontSize: '0.85rem'
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {/* Network Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: isOnline ? '#4caf50' : '#f44336'
            }} />
            <span style={{ color: '#cccccc' }}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Sync Status */}
          {isAuthenticated && syncInProgress && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#2196f3' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                🔄
              </motion.div>
              <span>Syncing</span>
            </div>
          )}

          {/* Last Sync Time */}
          {isAuthenticated && lastSyncTime && !syncInProgress && (
            <div style={{ color: '#cccccc', fontSize: '0.75rem' }}>
              Last sync: {new Date(lastSyncTime).toLocaleTimeString()}
            </div>
          )}

          {/* Authentication Status */}
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#4caf50' }}>☁️</span>
                <span style={{ color: '#ffffff', fontSize: '0.8rem' }}>
                  {user?.email?.split('@')[0] || 'Signed In'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="small"
                onClick={handleSignOut}
                style={{ fontSize: '0.7rem', padding: '4px 8px' }}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="small"
              onClick={handleSignIn}
              style={{ fontSize: '0.7rem', padding: '4px 8px', color: '#2196f3' }}
            >
              ☁️ Sign In
            </Button>
          )}
        </motion.div>

        {/* Main Menu Content */}
        <AnimatePresence mode="wait">
          {showCloudManager ? (
            <CloudSaveManager
              isModal={true}
              onClose={handleCloseCloudManager}
            />
          ) : showSaveManager ? (
            <SaveLoadManager
              mode="load"
              onClose={handleCloseSaveManager}
              onLoadComplete={handleLoadComplete}
            />
          ) : !showLoadMenu ? (
            <motion.div
              key="main-menu"
              className={styles.menuContent}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: isMobile ? '1rem' : isTablet ? '1.5rem' : '2rem',
                maxWidth: isMobile ? '100%' : isTablet ? '400px' : '500px',
                width: '100%',
                zIndex: 1,
                position: 'relative'
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: animationConfig.duration * 1.5,
                ease: animationConfig.ease
              }}
            >
              {/* Logo */}
              <motion.div
                className={styles.logo}
                style={{ textAlign: 'center' }}
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <h1
                  className={styles.gameTitle}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: isMobile ? (isLandscape ? '2rem' : '2.5rem') : isTablet ? '3rem' : '3.5rem',
                    fontWeight: 'bold',
                    color: '#ffd700',
                    margin: 0,
                    letterSpacing: '0.05em',
                    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)'
                  }}
                >
                  Sawyer's RPG
                </h1>
                <p
                  className={styles.gameSubtitle}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '1.4rem',
                    color: '#cccccc',
                    margin: '0.5rem 0 0 0',
                    fontStyle: 'italic'
                  }}
                >
                  Monster Taming Adventure
                </p>
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
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '0.75rem' : '1rem',
                  width: '100%',
                  maxWidth: '300px'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Button
                  variant="primary"
                  size={isMobile ? "md" : "large"}
                  onClick={handleContinue}
                  disabled={!player && !hasSavedGames}
                  className={styles.menuButton}
                  touchFriendly={true}
                >
                  {player ? 'Continue Game' : 'Continue'}
                </Button>

                <Button
                  variant="secondary"
                  size={isMobile ? "md" : "large"}
                  onClick={handleNewGame}
                  className={styles.menuButton}
                  touchFriendly={true}
                >
                  New Game
                </Button>

                <Button
                  variant="secondary"
                  size={isMobile ? "md" : "large"}
                  onClick={handleShowLoadMenu}
                  disabled={!hasSavedGames}
                  className={styles.menuButton}
                  touchFriendly={true}
                >
                  Load Game
                </Button>

                <Button
                  variant="secondary"
                  size={isMobile ? "md" : "large"}
                  onClick={handleSettings}
                  className={styles.menuButton}
                  touchFriendly={true}
                >
                  Settings
                </Button>

                {/* Cloud Save Button */}
                {isAuthenticated && (
                  <Button
                    variant="accent"
                    size={isMobile ? "md" : "large"}
                    onClick={handleCloudSaves}
                    className={styles.menuButton}
                    touchFriendly={true}
                    style={{
                      background: 'linear-gradient(135deg, #2196f3, #1976d2)',
                      border: '1px solid rgba(33, 150, 243, 0.5)'
                    }}
                  >
                    ☁️ Cloud Saves
                  </Button>
                )}
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
                <AnimatePresence>
                  {saveSlots.map((slot, index) => renderSaveSlot(slot, index))}
                </AnimatePresence>
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

        {/* Authentication Modal */}
        <AuthenticationModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </div>
  );
};

export default MainMenu;