import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaCard } from '../molecules/AreaCard';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { useAreas, usePlayer, useWorld, useUI } from '../../hooks';
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
  const { currentAreaId, unlockedAreas, changeArea, hasStoryFlag, isAreaUnlocked } = useWorld();
  const { navigateToScreen } = useUI();

  // Debug logging
  console.log('🗺️ WorldMap Debug:', {
    areas: areas?.length || 0,
    isLoading,
    error,
    currentAreaId,
    unlockedAreas,
    playerLevel,
    player: player?.name || 'None'
  });

  const [selectedArea, setSelectedArea] = useState<ReactArea | null>(null);
  const [filterType, setFilterType] = useState<AreaFilter['type']>('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

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

  const toggleUnlockedFilter = useCallback(() => {
    setShowUnlockedOnly(prev => !prev);
  }, []);

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
            <h1 className={styles.title}>World Map</h1>
            <p className={styles.subtitle}>
              Explore the vast world and discover new adventures
            </p>
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
              <AnimatePresence mode="wait">
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
      </div>
    </div>
  );
};

export default WorldMap;