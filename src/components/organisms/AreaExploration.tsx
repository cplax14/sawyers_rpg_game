import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { useAreas, usePlayer, useWorld, useUI, useIsMobile } from '../../hooks';
import { ReactArea } from '../../types/game';

interface AreaExplorationProps {
  className?: string;
}

interface ExplorationResult {
  type: 'encounter' | 'item' | 'event' | 'nothing';
  data?: any;
  message: string;
}

export const AreaExploration: React.FC<AreaExplorationProps> = ({
  className
}) => {
  const { getAreaById } = useAreas();
  const { player, playerLevel } = usePlayer();
  const { currentAreaId, changeArea } = useWorld();
  const { navigateToScreen } = useUI();
  const isMobile = useIsMobile();

  const [isExploring, setIsExploring] = useState(false);
  const [explorationResults, setExplorationResults] = useState<ExplorationResult[]>([]);
  const [currentEncounter, setCurrentEncounter] = useState<any>(null);

  // Get current area data
  const currentArea = useMemo(() => {
    return currentAreaId ? getAreaById(currentAreaId) : null;
  }, [currentAreaId, getAreaById]);

  // Generate exploration result
  const generateExplorationResult = useCallback((): ExplorationResult => {
    if (!currentArea) {
      return { type: 'nothing', message: 'You find nothing of interest.' };
    }

    const encounterRate = currentArea.encounterRate || 0;
    const roll = Math.random() * 100;

    if (roll < encounterRate && currentArea.monsters.length > 0) {
      // Monster encounter
      const monsterIndex = Math.floor(Math.random() * currentArea.monsters.length);
      const monsterSpecies = currentArea.monsters[monsterIndex];

      return {
        type: 'encounter',
        data: {
          species: monsterSpecies,
          level: Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1)
        },
        message: `A wild ${monsterSpecies.replace(/_/g, ' ')} appears!`
      };
    } else if (roll < 30) {
      // Item discovery
      const items = ['healing_herb', 'mana_flower', 'forest_berry', 'small_gold'];
      const foundItem = items[Math.floor(Math.random() * items.length)];

      return {
        type: 'item',
        data: { item: foundItem, quantity: 1 },
        message: `You found a ${foundItem.replace(/_/g, ' ')}!`
      };
    } else if (roll < 40) {
      // Story event
      const events = [
        'You hear rustling in the bushes, but nothing emerges.',
        'Ancient ruins peek through the undergrowth.',
        'You discover a hidden path leading deeper into the area.',
        'The sound of running water echoes in the distance.',
        'Strange markings on a tree catch your attention.'
      ];

      return {
        type: 'event',
        message: events[Math.floor(Math.random() * events.length)]
      };
    }

    // Nothing found
    const nothingMessages = [
      'You search the area thoroughly but find nothing.',
      'The path ahead seems quiet and peaceful.',
      'You take a moment to rest and survey your surroundings.',
      'Nothing of interest catches your eye.'
    ];

    return {
      type: 'nothing',
      message: nothingMessages[Math.floor(Math.random() * nothingMessages.length)]
    };
  }, [currentArea, playerLevel]);

  const handleExplore = useCallback(async () => {
    if (isExploring) return;

    setIsExploring(true);

    // Simulate exploration time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = generateExplorationResult();
    setExplorationResults(prev => [result, ...prev].slice(0, 10)); // Keep last 10 results

    if (result.type === 'encounter') {
      setCurrentEncounter(result.data);
    }

    setIsExploring(false);
  }, [isExploring, generateExplorationResult]);

  const handleCombat = useCallback(() => {
    // TODO: Navigate to combat screen with encounter data
    console.log('Starting combat with:', currentEncounter);
    navigateToScreen('combat');
  }, [currentEncounter, navigateToScreen]);

  const handleFlee = useCallback(() => {
    setCurrentEncounter(null);
  }, []);

  const handleBackToWorldMap = useCallback(() => {
    navigateToScreen('world-map');
  }, [navigateToScreen]);

  if (!currentArea) {
    return (
      <div className={`area-exploration ${className || ''}`}
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          color: '#f4f4f4'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2>Area Not Found</h2>
          <Button variant="primary" onClick={handleBackToWorldMap}>
            Back to World Map
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`area-exploration ${className || ''}`}
      style={{
        width: '100vw',
        height: '100vh',
        background: `linear-gradient(135deg, #0f3460, #1a1a2e, #16213e)`,
        color: '#f4f4f4',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '1rem 2rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#ffd700' }}>
              {currentArea.name}
            </h1>
            <p style={{ margin: '0.5rem 0 0', opacity: 0.8, fontSize: '1.1rem' }}>
              {currentArea.description}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={handleBackToWorldMap}
            style={{ minWidth: '120px' }}
          >
            ← World Map
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '1rem',
        padding: '1rem',
        overflow: 'hidden'
      }}>
        {/* Exploration Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            flex: '1',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <h2 style={{ margin: '0 0 1rem', color: '#ffd700' }}>Exploration</h2>

          <div style={{
            textAlign: 'center',
            margin: '2rem 0',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            {isExploring ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <LoadingSpinner size="large" />
                <p style={{ fontSize: '1.2rem' }}>Exploring the area...</p>
              </div>
            ) : (
              <>
                <div style={{
                  fontSize: '4rem',
                  margin: '1rem 0',
                  filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))'
                }}>
                  🌲
                </div>
                <p style={{ margin: '1rem 0', fontSize: '1.1rem', opacity: 0.9 }}>
                  What will you discover in this {currentArea.type}?
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Button
                    variant="primary"
                    size="large"
                    onClick={handleExplore}
                    disabled={isExploring}
                    style={{ minWidth: '140px' }}
                  >
                    🔍 Explore
                  </Button>
                  {currentArea.services && currentArea.services.length > 0 && (
                    <Button
                      variant="secondary"
                      size="large"
                      style={{ minWidth: '140px' }}
                    >
                      🏪 Services
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Area Info */}
          <div style={{
            marginTop: 'auto',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            fontSize: '0.9rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
              <div><strong>Type:</strong> {currentArea.type}</div>
              <div><strong>Level:</strong> {currentArea.recommendedLevel}</div>
              <div><strong>Danger:</strong> {currentArea.encounterRate}%</div>
              <div><strong>Monsters:</strong> {currentArea.monsters.length}</div>
            </div>
          </div>
        </motion.div>

        {/* Results Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            flex: '1',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            minHeight: isMobile ? '300px' : 'auto'
          }}
        >
          <h2 style={{ margin: '0 0 1rem', color: '#ffd700' }}>Activity Log</h2>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {explorationResults.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                fontStyle: 'italic',
                padding: '2rem'
              }}>
                Start exploring to see your discoveries here...
              </div>
            ) : (
              <AnimatePresence>
                {explorationResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    style={{
                      padding: '1rem',
                      background: result.type === 'encounter' ? 'rgba(255, 0, 0, 0.2)' :
                                 result.type === 'item' ? 'rgba(0, 255, 0, 0.2)' :
                                 result.type === 'event' ? 'rgba(255, 215, 0, 0.2)' :
                                 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${
                        result.type === 'encounter' ? '#ff4444' :
                        result.type === 'item' ? '#44ff44' :
                        result.type === 'event' ? '#ffd700' :
                        '#888888'
                      }`
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {result.type === 'encounter' ? '⚔️' :
                         result.type === 'item' ? '💎' :
                         result.type === 'event' ? '✨' :
                         '🔍'}
                      </span>
                      <span>{result.message}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>

      {/* Encounter Modal */}
      <AnimatePresence>
        {currentEncounter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={(e) => e.target === e.currentTarget && handleFlee()}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                background: 'linear-gradient(135deg, #2d1b2e, #4a0e4e)',
                borderRadius: '16px',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center',
                border: '2px solid #ff6b6b',
                boxShadow: '0 0 30px rgba(255, 107, 107, 0.5)'
              }}
            >
              <h2 style={{ margin: '0 0 1rem', color: '#ff6b6b', fontSize: '1.8rem' }}>
                Wild Encounter!
              </h2>

              <div style={{ fontSize: '4rem', margin: '1rem 0' }}>
                🐺
              </div>

              <p style={{ margin: '1rem 0', fontSize: '1.2rem' }}>
                A Level {currentEncounter.level} {currentEncounter.species.replace(/_/g, ' ')} blocks your path!
              </p>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                <Button
                  variant="danger"
                  size="large"
                  onClick={handleCombat}
                >
                  ⚔️ Fight
                </Button>
                <Button
                  variant="secondary"
                  size="large"
                  onClick={handleFlee}
                >
                  🏃 Flee
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AreaExploration;