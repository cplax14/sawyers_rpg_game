import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { ShopInterface } from './ShopInterface';
import { NPCTradeInterface } from './NPCTradeInterface';
import { useAreas, usePlayer, useWorld, useUI, useCombat, useIsMobile } from '../../hooks';
import { useReactGame } from '../../contexts/ReactGameContext';
import { Area } from '../../types/game';
import { ExperienceCalculator } from '../../utils/experienceUtils';
import { Shop } from '../../types/shop';
import { loadShopData } from '../../utils/dataLoader';

interface AreaExplorationProps {
  className?: string;
}

interface ExplorationResult {
  type: 'encounter' | 'item' | 'event' | 'nothing';
  data?: any;
  message: string;
}

/**
 * Area completion requirements for story flag progression
 * Maps area IDs to their completion story flags
 */
const AREA_COMPLETION_FLAGS: Record<
  string,
  {
    flag: string;
    encountersRequired: number;
    description: string;
  }
> = {
  forest_path: {
    flag: 'forest_path_cleared',
    encountersRequired: 3, // Complete 3 encounters to clear the area
    description: 'Forest Path Cleared',
  },
  plains: {
    flag: 'plains_explored',
    encountersRequired: 3, // Complete 3 encounters to explore thoroughly
    description: 'Grassy Plains Explored',
  },
};

export const AreaExploration: React.FC<AreaExplorationProps> = ({ className }) => {
  const { getAreaById } = useAreas();
  const { player } = usePlayer();
  const { currentAreaId, changeArea, hasStoryFlag, setStoryFlag } = useWorld();
  const { navigateToScreen } = useUI();
  const { startCombat } = useCombat();
  const isMobile = useIsMobile();
  const { state: gameState, discoverShop, unlockShop, openShop, incrementAreaEncounters } = useReactGame();

  // Calculate player level from XP (source of truth)
  const playerLevel = player?.experience
    ? ExperienceCalculator.calculateLevel(player.experience)
    : 1;

  const [isExploring, setIsExploring] = useState(false);
  const [explorationResults, setExplorationResults] = useState<ExplorationResult[]>([]);
  const [currentEncounter, setCurrentEncounter] = useState<any>(null);
  const [currentShopId, setCurrentShopId] = useState<string | null>(null);
  const [currentTradeAreaId, setCurrentTradeAreaId] = useState<string | null>(null);
  const [showShopDiscovery, setShowShopDiscovery] = useState<Shop | null>(null);
  const [explorationProgress, setExplorationProgress] = useState<number>(0);

  // Use global area encounter tracking from game state
  const areaEncounterCount = gameState.areaEncounters || {};
  const [showAreaCompletionNotification, setShowAreaCompletionNotification] = useState<string | null>(null);

  // Get current area data
  const currentArea = useMemo(() => {
    return currentAreaId ? getAreaById(currentAreaId) : null;
  }, [currentAreaId, getAreaById]);

  // DEBUG: Monitor story flags and area encounters
  useEffect(() => {
    if (currentAreaId) {
      const completionReq = AREA_COMPLETION_FLAGS[currentAreaId];
      if (completionReq) {
        const currentCount = areaEncounterCount[currentAreaId] || 0;
        const flagSet = hasStoryFlag ? hasStoryFlag(completionReq.flag) : false;

        console.log(`📍 [AREA MONITOR] ${currentAreaId} status:`, {
          encounters: currentCount,
          required: completionReq.encountersRequired,
          flagName: completionReq.flag,
          flagSet,
          allStoryFlags: gameState.storyFlags,
        });
      }
    }
  }, [currentAreaId, areaEncounterCount, hasStoryFlag, gameState.storyFlags]);

  // State for loaded shop data
  const [loadedShops, setLoadedShops] = useState<Shop[]>([]);

  // Load shop data on mount
  useEffect(() => {
    console.log('🏪 Loading shop data...');
    loadShopData().then(shops => {
      console.log('🏪 Loaded shops:', shops.length, shops.map(s => s.id));
      setLoadedShops(shops);
    }).catch(err => {
      console.error('❌ Failed to load shop data:', err);
    });
  }, []);

  // Auto-discover shops in towns/villages on area entry
  useEffect(() => {
    if (!currentArea || !discoverShop || loadedShops.length === 0) return;

    // Auto-discover shops in starting areas, towns, and villages
    if (currentArea.type === 'town' || currentArea.type === 'village' || currentArea.type === 'starting') {
      const shopsInArea = loadedShops.filter(shop =>
        currentArea.shopIds?.includes(shop.id) && !shop.hidden
      );

      shopsInArea.forEach(shop => {
        const isAlreadyDiscovered = gameState.shops?.discoveredShops?.includes(shop.id);
        if (!isAlreadyDiscovered) {
          console.log(`🏪 Auto-discovering shop in ${currentArea.type}: ${shop.name}`);
          discoverShop(shop.id);

          // Also auto-unlock if no level/story requirements
          if (unlockShop && (!shop.unlockRequirements?.minLevel || shop.unlockRequirements.minLevel <= playerLevel)) {
            unlockShop(shop.id);
          }
        }
      });
    }
  }, [currentArea, loadedShops, discoverShop, unlockShop, gameState.shops?.discoveredShops, playerLevel]);

  // Get shops in current area
  const areaShops = useMemo(() => {
    console.log('🏪 Computing areaShops:', {
      hasCurrentArea: !!currentArea,
      currentAreaId: currentArea?.id,
      shopIds: currentArea?.shopIds,
      loadedShopsCount: loadedShops.length
    });

    if (!currentArea?.shopIds || loadedShops.length === 0) {
      console.log('🏪 No shops - missing currentArea.shopIds or loadedShops');
      return [];
    }

    // Filter loaded shops to only those in this area
    const filtered = loadedShops.filter(shop => currentArea.shopIds.includes(shop.id));
    console.log('🏪 Filtered shops for area:', filtered.length, filtered.map(s => s.id));
    return filtered;
  }, [currentArea, loadedShops]);

  // Check which shops are discovered, unlocked, or available
  const shopStatus = useMemo(() => {
    return areaShops.map((shop: any) => {
      const isDiscovered = gameState.shops?.discoveredShops?.includes(shop.id) || false;
      const isUnlocked = gameState.shops?.unlockedShops?.includes(shop.id) || false;

      // Check if shop should be auto-discovered (starting area or town)
      const shouldAutoDiscover =
        currentArea?.type === 'town' || currentArea?.type === 'village' || !shop.hidden;

      // Check if shop requires exploration threshold
      const explorationThreshold = shop.unlockRequirements?.explorationThreshold || 0;
      const meetsThreshold = explorationProgress >= explorationThreshold;

      return {
        shop,
        isDiscovered,
        isUnlocked,
        shouldAutoDiscover,
        meetsThreshold,
        explorationThreshold,
      };
    });
  }, [areaShops, gameState.shops, currentArea, explorationProgress]);

  // Generate exploration result
  const generateExplorationResult = useCallback((): ExplorationResult => {
    if (!currentArea) {
      return { type: 'nothing', message: 'You find nothing of interest.' };
    }

    // Enhanced encounter rates for better gameplay
    const baseEncounterRate = currentArea.encounterRate || 30;
    // Boost encounter rate significantly to ensure frequent monster encounters
    const adjustedEncounterRate = Math.min(75, baseEncounterRate + 40); // Minimum 70% encounter rate, up to 75%
    const roll = Math.random() * 100;

    if (roll < adjustedEncounterRate && currentArea.monsters.length > 0) {
      // Monster encounter
      const monsterIndex = Math.floor(Math.random() * currentArea.monsters.length);
      const monsterSpecies = currentArea.monsters[monsterIndex];

      return {
        type: 'encounter',
        data: {
          species: monsterSpecies,
          level: Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1),
        },
        message: `A wild ${monsterSpecies.replace(/_/g, ' ')} appears!`,
      };
    } else if (roll < adjustedEncounterRate + 15) {
      // Item discovery (15% chance)
      const items = ['healing_herb', 'mana_flower', 'forest_berry', 'small_gold'];
      const foundItem = items[Math.floor(Math.random() * items.length)];

      return {
        type: 'item',
        data: { item: foundItem, quantity: 1 },
        message: `You found a ${foundItem.replace(/_/g, ' ')}!`,
      };
    } else if (roll < adjustedEncounterRate + 20) {
      // Story event (5% chance)
      const events = [
        'You hear rustling in the bushes, but nothing emerges.',
        'Ancient ruins peek through the undergrowth.',
        'You discover a hidden path leading deeper into the area.',
        'The sound of running water echoes in the distance.',
        'Strange markings on a tree catch your attention.',
      ];

      return {
        type: 'event',
        message: events[Math.floor(Math.random() * events.length)],
      };
    }

    // Nothing found (only 5-10% chance now)
    const nothingMessages = [
      'You search the area thoroughly but find nothing.',
      'The path ahead seems quiet and peaceful.',
      'You take a moment to rest and survey your surroundings.',
      'Nothing of interest catches your eye.',
    ];

    return {
      type: 'nothing',
      message: nothingMessages[Math.floor(Math.random() * nothingMessages.length)],
    };
  }, [currentArea, playerLevel]);

  // Auto-discover and unlock shops when entering area
  useEffect(() => {
    shopStatus.forEach(({ shop, isDiscovered, isUnlocked, shouldAutoDiscover }: any) => {
      if (shouldAutoDiscover && !isDiscovered && discoverShop) {
        console.log(`Auto-discovering shop: ${shop.id}`);
        discoverShop(shop.id);

        // For towns/villages, also auto-unlock the shop immediately
        if (currentArea?.type === 'town' || currentArea?.type === 'village') {
          if (!isUnlocked && unlockShop) {
            console.log(`Auto-unlocking shop in ${currentArea.type}: ${shop.id}`);
            unlockShop(shop.id);
          }
        } else {
          // For other areas, show discovery notification
          setShowShopDiscovery(shop);
        }
      }
    });
  }, [shopStatus, discoverShop, unlockShop, currentArea]);

  const handleExplore = useCallback(async () => {
    if (isExploring) return;

    setIsExploring(true);

    // Simulate exploration time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = generateExplorationResult();
    setExplorationResults(prev => [result, ...prev].slice(0, 10)); // Keep last 10 results

    // Increment exploration progress (each exploration adds ~5-10%)
    setExplorationProgress(prev => Math.min(100, prev + (Math.random() * 5 + 5)));

    // Check for hidden shop discovery based on exploration threshold
    shopStatus.forEach(({ shop, isDiscovered, meetsThreshold, explorationThreshold }: any) => {
      if (shop.hidden && !isDiscovered && meetsThreshold && discoverShop) {
        console.log(`Discovered hidden shop at ${explorationThreshold}% exploration: ${shop.name}`);
        discoverShop(shop.id);
        setShowShopDiscovery(shop);
      }
    });

    if (result.type === 'encounter') {
      setCurrentEncounter(result.data);
    }

    setIsExploring(false);
  }, [isExploring, generateExplorationResult, shopStatus, discoverShop]);

  const handleCombat = useCallback(() => {
    if (currentEncounter && currentAreaId) {
      // DEBUG: Log combat initiation
      console.log(`⚔️ [COMBAT] Starting combat in area: ${currentAreaId}`, {
        species: currentEncounter.species,
        level: currentEncounter.level,
      });

      startCombat(currentEncounter.species, currentEncounter.level);
      setCurrentEncounter(null);

      // Increment encounter count in global state IMMEDIATELY when starting combat
      // This ensures the count persists even if the component remounts
      incrementAreaEncounters(currentAreaId);

      // Get the updated encounter count (will be incremented in the next render)
      const currentCount = (areaEncounterCount[currentAreaId] || 0);
      const newCount = currentCount + 1; // Predict the new count

      // DEBUG: Log encounter count
      console.log(`📊 [AREA PROGRESS] Encounter count for ${currentAreaId}:`, newCount);

      // Check if this area has completion requirements
      const completionReq = AREA_COMPLETION_FLAGS[currentAreaId];
      if (completionReq) {
        const encountersCompleted = newCount;

        // DEBUG: Log completion check
        console.log(`🔍 [AREA COMPLETION] Checking completion for ${currentAreaId}:`, {
          encountersCompleted,
          required: completionReq.encountersRequired,
          flagName: completionReq.flag,
          hasStoryFlagFunction: typeof hasStoryFlag,
          setStoryFlagFunction: typeof setStoryFlag,
        });

        // Check if we've met the encounter requirement and flag isn't already set
        if (encountersCompleted >= completionReq.encountersRequired && hasStoryFlag) {
          const flagAlreadySet = hasStoryFlag(completionReq.flag);

          // DEBUG: Log flag status
          console.log(`🚩 [STORY FLAG] Flag "${completionReq.flag}" status:`, {
            alreadySet: flagAlreadySet,
            willSet: !flagAlreadySet && !!setStoryFlag,
          });

          if (!flagAlreadySet && setStoryFlag) {
            console.log(`✅ [AREA COMPLETE] Setting story flag "${completionReq.flag}" after ${encountersCompleted} encounters`);

            // Set the story flag
            setStoryFlag(completionReq.flag, true);

            // VERIFY: Check if flag was set immediately after
            setTimeout(() => {
              const isNowSet = hasStoryFlag(completionReq.flag);
              console.log(`🔍 [FLAG VERIFICATION] Flag "${completionReq.flag}" verification:`, {
                isSet: isNowSet,
                timestamp: new Date().toISOString(),
              });
            }, 100);

            // Show completion notification
            setShowAreaCompletionNotification(completionReq.description);

            // Auto-dismiss notification after 5 seconds
            setTimeout(() => {
              setShowAreaCompletionNotification(null);
            }, 5000);
          } else if (flagAlreadySet) {
            console.log(`ℹ️ [AREA COMPLETE] Flag "${completionReq.flag}" already set, skipping notification`);
          }
        }
      } else {
        console.log(`ℹ️ [AREA PROGRESS] No completion requirements for area: ${currentAreaId}`);
      }
    }
  }, [currentEncounter, currentAreaId, startCombat, hasStoryFlag, setStoryFlag, incrementAreaEncounters, areaEncounterCount]);

  const handleFlee = useCallback(() => {
    setCurrentEncounter(null);
  }, []);

  const handleBackToWorldMap = useCallback(() => {
    navigateToScreen('world-map');
  }, [navigateToScreen]);

  // Shop interaction handlers
  const handleVisitShop = useCallback(
    (shopId: string) => {
      console.log(`Opening shop: ${shopId}`);
      setCurrentShopId(shopId);
      if (openShop) {
        openShop(shopId);
      }
    },
    [openShop]
  );

  const handleCloseShop = useCallback(() => {
    setCurrentShopId(null);
  }, []);

  const handleDismissDiscovery = useCallback(() => {
    setShowShopDiscovery(null);
  }, []);

  // NPC Trade handlers
  const handleOpenTrade = useCallback((areaId: string) => {
    console.log(`Opening NPC trade interface for area: ${areaId}`);
    setCurrentTradeAreaId(areaId);
  }, []);

  const handleCloseTrade = useCallback(() => {
    setCurrentTradeAreaId(null);
  }, []);

  if (!currentArea) {
    return (
      <div
        className={`area-exploration ${className || ''}`}
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          color: '#f4f4f4',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2>Area Not Found</h2>
          <Button variant='primary' onClick={handleBackToWorldMap}>
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
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '1rem 2rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#ffd700' }}>{currentArea.name}</h1>
            <p style={{ margin: '0.5rem 0 0', opacity: 0.8, fontSize: '1.1rem' }}>
              {currentArea.description}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Button
              variant='secondary'
              onClick={() => navigateToScreen('inventory')}
              style={{ minWidth: '100px', padding: '0.5rem 0.75rem' }}
              title='Open Inventory'
            >
              🎒 Inventory
            </Button>
            <Button
              variant='secondary'
              onClick={handleBackToWorldMap}
              style={{ minWidth: '120px' }}
            >
              ← World Map
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          padding: '1rem',
          overflow: 'hidden',
        }}
      >
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
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        >
          <h2 style={{ margin: '0 0 1rem', color: '#ffd700' }}>Exploration</h2>

          <div
            style={{
              textAlign: 'center',
              margin: '2rem 0',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            {isExploring ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <LoadingSpinner size='lg' />
                <p style={{ fontSize: '1.2rem' }}>Exploring the area...</p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    fontSize: '4rem',
                    margin: '1rem 0',
                    filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))',
                  }}
                >
                  🌲
                </div>
                {/* Conditional message based on area type */}
                {currentArea.type === 'town' || currentArea.type === 'village' ? (
                  <p style={{ margin: '1rem 0', fontSize: '1.1rem', opacity: 0.9 }}>
                    Welcome to {currentArea.name}! Visit shops or explore the area.
                  </p>
                ) : (
                  <p style={{ margin: '1rem 0', fontSize: '1.1rem', opacity: 0.9 }}>
                    What will you discover in this {currentArea.type}?
                  </p>
                )}

                {/* Primary Actions Section */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    alignItems: 'center',
                  }}
                >
                  {/* Shops Section - Only show if shops exist */}
                  {areaShops.length > 0 && (
                    <div style={{ width: '100%', maxWidth: '500px' }}>
                      <h3
                        style={{
                          margin: '0 0 0.75rem',
                          fontSize: '1.1rem',
                          color: '#ffd700',
                          textAlign: 'center',
                        }}
                      >
                        {currentArea.type === 'town' || currentArea.type === 'village'
                          ? '🏪 Services'
                          : '🏪 Shops'}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          gap: '0.75rem',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                        }}
                      >
                        {shopStatus
                          .filter((s: any) => s.isDiscovered || s.shouldAutoDiscover)
                          .map(({ shop, isUnlocked }: any) => (
                            <Button
                              key={shop.id}
                              variant={isUnlocked ? 'primary' : 'secondary'}
                              size='lg'
                              onClick={() => isUnlocked && handleVisitShop(shop.id)}
                              disabled={!isUnlocked}
                              style={{
                                minWidth: '160px',
                                padding: '0.75rem 1.25rem',
                                fontSize: '1.05rem',
                              }}
                              title={
                                isUnlocked
                                  ? `Visit ${shop.id.replace(/_/g, ' ')}`
                                  : 'Shop Locked - Complete requirements to unlock'
                              }
                            >
                              {shop.theme?.icon || '🏪'}{' '}
                              {isUnlocked
                                ? shop.id
                                    .replace(/_/g, ' ')
                                    .split(' ')
                                    .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
                                    .join(' ')
                                : '🔒 Locked Shop'}
                            </Button>
                          ))}

                        {/* NPC Trade button - show if area has NPC trades */}
                        {currentArea?.services?.includes('trader') && (
                          <Button
                            variant='primary'
                            size='lg'
                            onClick={() => handleOpenTrade(currentArea.id)}
                            style={{
                              minWidth: '160px',
                              padding: '0.75rem 1.25rem',
                              fontSize: '1.05rem',
                            }}
                          >
                            💬 Talk to Trader
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exploration Section */}
                  <div style={{ width: '100%', maxWidth: '500px' }}>
                    <h3
                      style={{
                        margin: '0 0 0.75rem',
                        fontSize: '1.1rem',
                        color: '#ffd700',
                        textAlign: 'center',
                      }}
                    >
                      🔍 Exploration
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant='secondary'
                        size='lg'
                        onClick={handleExplore}
                        disabled={isExploring}
                        style={{
                          minWidth: '180px',
                          padding: '0.75rem 1.5rem',
                          fontSize: '1.05rem',
                        }}
                      >
                        🔍 Explore Area
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Area Info */}
          <div
            style={{
              marginTop: 'auto',
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '8px',
              fontSize: '0.9rem',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '0.5rem',
              }}
            >
              <div>
                <strong>Type:</strong> {currentArea.type}
              </div>
              <div>
                <strong>Level:</strong> {currentArea.recommendedLevel}
              </div>
              <div>
                <strong>Danger:</strong> {currentArea.encounterRate}%
              </div>
              <div>
                <strong>Monsters:</strong> {currentArea.monsters.length}
              </div>
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
            minHeight: isMobile ? '300px' : 'auto',
          }}
        >
          <h2 style={{ margin: '0 0 1rem', color: '#ffd700' }}>Activity Log</h2>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {explorationResults.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontStyle: 'italic',
                  padding: '2rem',
                }}
              >
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
                      background:
                        result.type === 'encounter'
                          ? 'rgba(255, 0, 0, 0.2)'
                          : result.type === 'item'
                            ? 'rgba(0, 255, 0, 0.2)'
                            : result.type === 'event'
                              ? 'rgba(255, 215, 0, 0.2)'
                              : 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${
                        result.type === 'encounter'
                          ? '#ff4444'
                          : result.type === 'item'
                            ? '#44ff44'
                            : result.type === 'event'
                              ? '#ffd700'
                              : '#888888'
                      }`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {result.type === 'encounter'
                          ? '⚔️'
                          : result.type === 'item'
                            ? '💎'
                            : result.type === 'event'
                              ? '✨'
                              : '🔍'}
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
              padding: '1rem',
            }}
            onClick={e => e.target === e.currentTarget && handleFlee()}
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
                boxShadow: '0 0 30px rgba(255, 107, 107, 0.5)',
              }}
            >
              <h2 style={{ margin: '0 0 1rem', color: '#ff6b6b', fontSize: '1.8rem' }}>
                Wild Encounter!
              </h2>

              <div style={{ fontSize: '4rem', margin: '1rem 0' }}>🐺</div>

              <p style={{ margin: '1rem 0', fontSize: '1.2rem' }}>
                A Level {currentEncounter.level} {currentEncounter.species.replace(/_/g, ' ')}{' '}
                blocks your path!
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  marginTop: '2rem',
                }}
              >
                <Button variant='danger' size='lg' onClick={handleCombat}>
                  ⚔️ Fight
                </Button>
                <Button variant='secondary' size='lg' onClick={handleFlee}>
                  🏃 Flee
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop Discovery Modal */}
      <AnimatePresence>
        {showShopDiscovery && (
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
              padding: '1rem',
            }}
            onClick={e => e.target === e.currentTarget && handleDismissDiscovery()}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              style={{
                background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                borderRadius: '20px',
                padding: '2rem',
                maxWidth: '600px',
                width: '100%',
                textAlign: 'center',
                border: '3px solid rgba(212, 175, 55, 0.5)',
                boxShadow: '0 0 40px rgba(212, 175, 55, 0.3)',
              }}
            >
              <div style={{ fontSize: '5rem', margin: '0 0 1rem' }}>
                {showShopDiscovery.theme?.icon || '🏪'}
              </div>

              <h2 style={{ margin: '0 0 1rem', color: '#d4af37', fontSize: '2rem' }}>
                Shop Discovered!
              </h2>

              <h3 style={{ margin: '0 0 0.5rem', color: '#f4f4f4', fontSize: '1.5rem' }}>
                {showShopDiscovery.name}
              </h3>

              <p
                style={{
                  margin: '0.5rem 0 1.5rem',
                  color: '#94a3b8',
                  fontSize: '1rem',
                  lineHeight: 1.6,
                }}
              >
                {showShopDiscovery.shopkeeper.dialogue.firstVisit ||
                  showShopDiscovery.shopkeeper.dialogue.greeting}
              </p>

              <div
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  borderRadius: '12px',
                  padding: '1rem',
                  margin: '1.5rem 0',
                }}
              >
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem' }}>
                  <strong style={{ color: '#d4af37' }}>Shopkeeper:</strong>{' '}
                  {showShopDiscovery.shopkeeper.name}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'center',
                  marginTop: '2rem',
                }}
              >
                <Button
                  variant='primary'
                  size='lg'
                  onClick={() => {
                    handleDismissDiscovery();
                    handleVisitShop(showShopDiscovery.id);
                  }}
                >
                  {showShopDiscovery.theme?.icon || '🏪'} Visit Shop Now
                </Button>
                <Button variant='secondary' size='lg' onClick={handleDismissDiscovery}>
                  Maybe Later
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop Interface Modal */}
      <AnimatePresence>
        {currentShopId && <ShopInterface shopId={currentShopId} onClose={handleCloseShop} />}
      </AnimatePresence>

      {/* NPC Trade Interface Modal */}
      <AnimatePresence>
        {currentTradeAreaId && (
          <NPCTradeInterface areaId={currentTradeAreaId} onClose={handleCloseTrade} />
        )}
      </AnimatePresence>

      {/* Area Completion Notification */}
      <AnimatePresence>
        {showAreaCompletionNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              padding: '1.5rem 2rem',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(16, 185, 129, 0.5)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              zIndex: 2000,
              minWidth: '300px',
              textAlign: 'center',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎉</div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.3rem', fontWeight: 'bold' }}>
              Area Complete!
            </h3>
            <p style={{ margin: 0, fontSize: '1rem', opacity: 0.95 }}>
              {showAreaCompletionNotification}
            </p>
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
              New areas may now be accessible!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AreaExploration;
