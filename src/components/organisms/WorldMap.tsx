import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaCard } from '../molecules/AreaCard';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { useAreas, usePlayer, useWorld, useUI, useHorizontalSwipeNavigation, useIsMobile, useSaveSystem, useGameState } from '../../hooks';
import { ReactArea } from '../../types/game';
import { worldMapStyles } from '../../utils/temporaryStyles';
// import styles from './WorldMap.module.css'; // Temporarily disabled due to PostCSS parsing issues

const styles = worldMapStyles;

interface WorldMapProps {
  onAreaEnter?: (area: ReactArea) => void;
  className?: string;
}

interface AreaFilter {
  type: 'all' | 'town' | 'wilderness' | 'dungeon' | 'special';
  label: string;
}

const AREA_FILTERS: AreaFilter[] = [
  { type: 'all', label: 'All Areas' },
  { type: 'town', label: 'Towns' },
  { type: 'wilderness', label: 'Wilderness' },
  { type: 'dungeon', label: 'Dungeons' },
  { type: 'special', label: 'Special' }
];

export const WorldMap: React.FC<WorldMapProps> = ({
  onAreaEnter,
  className
}) => {
  const { areas, isLoading, error, getAreaById, getConnectedAreas } = useAreas();
  const { player, playerLevel } = usePlayer();
  const { currentAreaId, unlockedAreas, changeArea, hasStoryFlag, isAreaUnlocked, setStoryFlag } = useWorld();
  const { navigateToScreen } = useUI();
  const { saveGame, loadGame, getFreshSlots, saveSlots, isLoading: saveLoading } = useSaveSystem();
  const { state: gameState } = useGameState();
  const isMobile = useIsMobile();


  const [selectedArea, setSelectedArea] = useState<ReactArea | null>(null);
  const [filterType, setFilterType] = useState<AreaFilter['type']>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [showGameMenu, setShowGameMenu] = useState(false);

  // Get current area
  const currentArea = useMemo(() => {
    return currentAreaId ? getAreaById(currentAreaId) : null;
  }, [currentAreaId, getAreaById]);

  // Filter and sort areas
  const filteredAreas = useMemo(() => {
    let filtered = areas;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(area => area.type === filterType);
    }

    // Filter by unlocked status
    if (showUnlockedOnly) {
      filtered = filtered.filter(area =>
        area.unlocked || isAreaUnlocked(area.id)
      );
    }

    // Sort by recommended level, then by name
    return filtered.sort((a, b) => {
      if (a.recommendedLevel !== b.recommendedLevel) {
        return a.recommendedLevel - b.recommendedLevel;
      }
      return a.name.localeCompare(b.name);
    });
  }, [areas, filterType, showUnlockedOnly, isAreaUnlocked]);

  // Get connected areas for current area
  const connectedAreas = useMemo(() => {
    return currentArea ? getConnectedAreas(currentArea.id) : [];
  }, [currentArea, getConnectedAreas]);

  // Auto-select current area on load
  useEffect(() => {
    if (currentArea && !selectedArea) {
      setSelectedArea(currentArea);
    }
  }, [currentArea, selectedArea]);

  const handleAreaSelect = useCallback((area: ReactArea) => {
    setSelectedArea(area);
  }, []);

  const handleAreaEnter = useCallback(async (area: ReactArea) => {
    // Check if area is accessible
    if (!area.unlocked && !isAreaUnlocked(area.id)) {
      console.warn(`Area "${area.name}" is locked`);
      return;
    }

    try {
      // Change current area
      changeArea(area.id);

      // Trigger callback or navigate
      if (onAreaEnter) {
        onAreaEnter(area);
      } else {
        navigateToScreen('area');
      }
    } catch (error) {
      console.error('Failed to enter area:', error);
    }
  }, [isAreaUnlocked, changeArea, onAreaEnter, navigateToScreen]);

  const handleFilterChange = useCallback((type: AreaFilter['type']) => {
    setFilterType(type);
  }, []);

  // Swipe navigation for filters (mobile only)
  const handleSwipeLeft = useCallback(() => {
    if (!isMobile) return;

    const currentIndex = AREA_FILTERS.findIndex(filter => filter.type === filterType);
    const nextIndex = (currentIndex + 1) % AREA_FILTERS.length;
    setFilterType(AREA_FILTERS[nextIndex].type);
  }, [isMobile, filterType]);

  const handleSwipeRight = useCallback(() => {
    if (!isMobile) return;

    const currentIndex = AREA_FILTERS.findIndex(filter => filter.type === filterType);
    const prevIndex = currentIndex === 0 ? AREA_FILTERS.length - 1 : currentIndex - 1;
    setFilterType(AREA_FILTERS[prevIndex].type);
  }, [isMobile, filterType]);

  // Set up swipe gestures
  const { swipeHandlers } = useHorizontalSwipeNavigation(
    handleSwipeLeft,
    handleSwipeRight,
    {
      minDistance: 60,
      maxDuration: 400
    }
  );

  const toggleUnlockedFilter = useCallback(() => {
    setShowUnlockedOnly(prev => !prev);
  }, []);

  const toggleGameMenu = useCallback(() => {
    setShowGameMenu(prev => !prev);
  }, []);

  // Quick Save handler - finds empty slot or uses slot 0
  const handleQuickSave = useCallback(async () => {
    try {
      if (!gameState || !gameState.player) {
        console.error('Cannot save: No valid game state');
        return;
      }

      // Get fresh save slots directly from IndexedDB (bypassing stale React state)
      const currentSlots = await getFreshSlots();

      // Find first empty slot, or use slot 0 as dedicated Quick Save slot
      let targetSlot = 0;
      let foundEmpty = false;

      for (let i = 0; i < currentSlots.length; i++) {
        if (currentSlots[i].isEmpty) {
          targetSlot = i;
          foundEmpty = true;
          break;
        }
      }

      // If no empty slots, warn about overwriting
      if (!foundEmpty) {
        console.warn('⚠️ All save slots full, using Quick Save slot (slot 0)');
      } else {
        console.log(`💾 Quick Save to slot ${targetSlot} (first empty slot)`);
      }

      const success = await saveGame(gameState, {
        slotNumber: targetSlot,
        saveName: `Quick Save - ${currentArea?.name || 'Unknown Location'}`,
        overwrite: true
      });

      if (success) {
        console.log(`✅ Quick Save successful in slot ${targetSlot}`);
        setShowGameMenu(false);
      } else {
        console.error('Quick Save operation returned false');
      }
    } catch (error) {
      console.error('Failed to Quick Save:', error);
    }
  }, [gameState, currentArea, saveGame, getFreshSlots]);

  // Manual save handler - saves to specified slot
  const handleSaveGame = useCallback(async (slotId: number) => {
    try {
      if (!gameState || !gameState.player) {
        console.error('Cannot save: No valid game state');
        return;
      }

      console.log(`💾 Attempting to save game to slot ${slotId}`);
      const success = await saveGame(gameState, {
        slotNumber: slotId,
        saveName: `World Map - ${currentArea?.name || 'Unknown Location'}`,
        overwrite: true
      });

      if (success) {
        console.log(`✅ Game saved successfully to slot ${slotId}`);
        setShowGameMenu(false);
      } else {
        console.error('Save operation returned false');
      }
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }, [saveGame, currentArea, gameState]);

  const handleLoadGame = useCallback(async (slotId: number) => {
    try {
      console.log(`📂 Attempting to load game from slot ${slotId}`);
      const loadedState = await loadGame({ slotNumber: slotId });

      if (loadedState) {
        console.log(`✅ Game loaded successfully from slot ${slotId}`);
        setShowGameMenu(false);
      } else {
        console.error('Load operation returned null');
      }
    } catch (error) {
      console.error('Failed to load game:', error);
    }
  }, [loadGame]);

  // DEBUG: Temporary handler to manually fix tutorial_complete flag
  const handleForceUnlockTutorial = useCallback(() => {
    setStoryFlag('tutorial_complete', true);
    console.log('🔧 DEBUG: Manually set tutorial_complete flag to true');
    alert('Tutorial flag has been set! The Forest Path should now be unlocked.');
  }, [setStoryFlag]);

  const getAreaAccessibility = useCallback((area: ReactArea): {
    accessible: boolean;
    reason?: string;
  } => {
    // Always accessible if unlocked
    if (area.unlocked || isAreaUnlocked(area.id)) {
      return { accessible: true };
    }

    // Check if connected to current area
    const isConnected = currentArea?.connections.includes(area.id);
    if (!isConnected) {
      return {
        accessible: false,
        reason: 'Not connected to current area'
      };
    }

    // Check unlock requirements
    const requirements = area.unlockRequirements;

    if (requirements.level && playerLevel < requirements.level) {
      return {
        accessible: false,
        reason: `Requires level ${requirements.level}`
      };
    }

    if (requirements.story && !hasStoryFlag(requirements.story)) {
      return {
        accessible: false,
        reason: 'Story requirements not met'
      };
    }

    return { accessible: true };
  }, [isAreaUnlocked, currentArea, playerLevel, hasStoryFlag]);

  if (isLoading) {
    return (
      <div className={`${styles.worldMap} ${className || ''}`}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <p className={styles.loadingText}>Loading world map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.worldMap} ${className || ''}`}>
        <div className={styles.errorContainer}>
          <h2>Failed to Load World Map</h2>
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
      className={`${styles.worldMap} ${className || ''}`}
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'auto',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        color: '#f4f4f4',
        padding: '1rem',
        boxSizing: 'border-box'
      }}
      {...(isMobile ? swipeHandlers : {})}
    >
      <div
        className={styles.container}
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 1rem'
        }}
      >
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.titleSection}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <h1 className={styles.title}>World Map</h1>
                <p className={styles.subtitle}>
                  Explore the vast world and discover new adventures
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={toggleGameMenu}
                style={{
                  marginLeft: '1rem',
                  minWidth: '120px'
                }}
              >
                Game Menu
              </Button>
            </div>
          </div>

          {currentArea && (
            <div className={styles.currentLocation}>
              <span className={styles.currentLabel}>Current Location:</span>
              <span className={styles.currentAreaName}>{currentArea.name}</span>
            </div>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          className={styles.filters}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className={styles.filterTabs}>
            {AREA_FILTERS.map((filter) => (
              <button
                key={filter.type}
                className={`${styles.filterTab} ${
                  filterType === filter.type ? styles.active : ''
                }`}
                onClick={() => handleFilterChange(filter.type)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className={styles.filterOptions}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={showUnlockedOnly}
                onChange={toggleUnlockedFilter}
                className={styles.checkbox}
              />
              <span>Show unlocked only</span>
            </label>

            {/* Mobile swipe indicator */}
            {isMobile && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginTop: '0.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>←</span>
                <span>Swipe to change filters</span>
                <span>→</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content */}
        <div className={styles.content}>
          {/* Areas Grid */}
          <motion.div
            className={styles.areasSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className={styles.areasGrid}>
              <AnimatePresence>
                {filteredAreas.length > 0 ? (
                  filteredAreas.map((area, index) => {
                    const accessibility = getAreaAccessibility(area);
                    const isCurrentArea = currentArea?.id === area.id;
                    const isSelected = selectedArea?.id === area.id;

                    return (
                      <motion.div
                        key={area.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{
                          delay: index * 0.05,
                          duration: 0.3
                        }}
                        className={styles.areaCardWrapper}
                      >
                        <AreaCard
                          area={area}
                          selected={isSelected}
                          accessible={accessibility.accessible}
                          onClick={handleAreaSelect}
                          onEnter={handleAreaEnter}
                          showDetails={true}
                          size="md"
                          playerLevel={playerLevel}
                          className={isCurrentArea ? styles.currentAreaCard : ''}
                        />
                        {!accessibility.accessible && accessibility.reason && (
                          <div className={styles.accessibilityWarning}>
                            {accessibility.reason}
                          </div>
                        )}
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={styles.emptyState}
                  >
                    <p>No areas match the current filters</p>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setFilterType('all');
                        setShowUnlockedOnly(false);
                      }}
                    >
                      Reset Filters
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Area Details Sidebar */}
          <AnimatePresence>
            {selectedArea && (
              <motion.div
                className={styles.sidebar}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className={styles.sidebarContent}>
                  <h2 className={styles.sidebarTitle}>{selectedArea.name}</h2>

                  <div className={styles.areaDetails}>
                    <p className={styles.areaDescription}>
                      {selectedArea.description}
                    </p>

                    <div className={styles.areaStats}>
                      <div className={styles.statItem}>
                        <span>Type:</span>
                        <span className={styles.areaType}>
                          {selectedArea.type}
                        </span>
                      </div>
                      <div className={styles.statItem}>
                        <span>Recommended Level:</span>
                        <span>{selectedArea.recommendedLevel}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span>Encounter Rate:</span>
                        <span>{selectedArea.encounterRate}%</span>
                      </div>
                    </div>

                    {selectedArea.monsters.length > 0 && (
                      <div className={styles.areaMonsters}>
                        <h4>Monsters</h4>
                        <div className={styles.monsterTags}>
                          {selectedArea.monsters.slice(0, 5).map(monster => (
                            <span key={monster} className={styles.monsterTag}>
                              {monster.replace(/_/g, ' ')}
                            </span>
                          ))}
                          {selectedArea.monsters.length > 5 && (
                            <span className={styles.monsterMore}>
                              +{selectedArea.monsters.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {selectedArea.services.length > 0 && (
                      <div className={styles.areaServices}>
                        <h4>Services</h4>
                        <div className={styles.serviceTags}>
                          {selectedArea.services.map(service => (
                            <span key={service} className={styles.serviceTag}>
                              {service.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedArea.connections.length > 0 && (
                      <div className={styles.areaConnections}>
                        <h4>Connected Areas</h4>
                        <div className={styles.connectionList}>
                          {selectedArea.connections.map(connectionId => {
                            const connectedArea = getAreaById(connectionId);
                            return connectedArea ? (
                              <button
                                key={connectionId}
                                className={styles.connectionButton}
                                onClick={() => setSelectedArea(connectedArea)}
                              >
                                {connectedArea.name}
                              </button>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={styles.sidebarActions}>
                    {selectedArea.id === currentAreaId ? (
                      <Button variant="info" size="large" disabled>
                        Current Location
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="large"
                        onClick={() => handleAreaEnter(selectedArea)}
                        disabled={!getAreaAccessibility(selectedArea).accessible}
                      >
                        Enter Area
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Game Menu Overlay */}
        <AnimatePresence>
          {showGameMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}
              onClick={toggleGameMenu}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  backgroundColor: '#1a1a2e',
                  border: '2px solid #64748b',
                  borderRadius: '12px',
                  padding: '2rem',
                  minWidth: '320px',
                  maxWidth: '400px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2 style={{
                  margin: '0 0 1.5rem 0',
                  color: '#f4f4f4',
                  textAlign: 'center',
                  fontSize: '1.5rem'
                }}>
                  Game Menu
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <Button
                    variant="secondary"
                    size="large"
                    onClick={() => {
                      navigateToScreen('inventory');
                      setShowGameMenu(false);
                    }}
                    style={{ width: '100%' }}
                  >
                    🎒 Inventory
                  </Button>

                  <Button
                    variant="primary"
                    size="large"
                    onClick={handleQuickSave}
                    disabled={saveLoading}
                    style={{ width: '100%' }}
                  >
                    {saveLoading ? 'Saving...' : 'Quick Save'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="large"
                    onClick={() => navigateToScreen('menu')}
                    style={{ width: '100%' }}
                  >
                    Save & Load Game
                  </Button>

                  <Button
                    variant="secondary"
                    size="large"
                    onClick={() => navigateToScreen('settings')}
                    style={{ width: '100%' }}
                  >
                    Settings
                  </Button>

                  <Button
                    variant="secondary"
                    size="large"
                    onClick={() => navigateToScreen('main-menu')}
                    style={{ width: '100%' }}
                  >
                    Main Menu
                  </Button>

                  <Button
                    variant="outline"
                    size="large"
                    onClick={toggleGameMenu}
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* DEBUG: Temporary button to fix tutorial_complete flag */}
      <Button
        variant="outline"
        onClick={handleForceUnlockTutorial}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: '#ff6b35',
          color: 'white',
          border: '2px solid #ff8c61',
          padding: '0.75rem 1rem',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}
      >
        🔧 Fix Tutorial Flag
      </Button>
    </div>
  );
};

export default WorldMap;