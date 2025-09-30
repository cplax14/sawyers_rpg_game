import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { ExperienceBar } from '../molecules/ExperienceBar';
import { useReactGame } from '../../contexts/ReactGameContext';
// import { useExperience } from '../../hooks/useExperience';
// import { usePlayer } from '../../hooks/useGameState';
// import { useEquipment } from '../../hooks/useEquipment';
import { useResponsive } from '../../hooks';
import { ExperienceSource } from '../../types/experience';
import { ExperienceCalculator, createExperienceCalculations, formatExperienceNumber } from '../../utils/experienceUtils';

interface StatsScreenProps {
  className?: string;
  onClose?: () => void;
}

// View modes for the stats screen
type StatsViewMode = 'overview' | 'experience' | 'achievements' | 'history';

// Temporary styles since PostCSS is disabled
const statsStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    color: '#f4f4f4',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 2rem',
    background: 'rgba(0, 0, 0, 0.3)',
    borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)'
  },
  navigation: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.75rem 2rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    overflowX: 'auto' as const
  },
  navButton: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    color: '#f4f4f4',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  navButtonActive: {
    background: 'rgba(100, 200, 255, 0.2)',
    borderColor: 'rgba(100, 200, 255, 0.5)',
    color: '#4fc3f7'
  },
  content: {
    flex: 1,
    padding: '1rem 2rem',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#4fc3f7'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
    overflow: 'hidden' as const,
    marginBottom: '0.5rem'
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4fc3f7, #29b6f6)',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '8px',
    padding: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    textAlign: 'center' as const
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#4fc3f7',
    marginBottom: '0.5rem'
  },
  statLabel: {
    fontSize: '0.9rem',
    opacity: 0.8
  },
  experienceCard: {
    background: 'linear-gradient(135deg, rgba(79, 195, 247, 0.1), rgba(41, 182, 246, 0.05))',
    border: '1px solid rgba(79, 195, 247, 0.2)'
  },
  sourceBreakdown: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem'
  },
  sourceItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '6px'
  },
  closeButton: {
    position: 'fixed' as const,
    top: '1rem',
    right: '1rem',
    zIndex: 1000,
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#f4f4f4',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)'
  }
};

export const StatsScreen: React.FC<StatsScreenProps> = ({
  className,
  onClose
}) => {
  const { state } = useReactGame();
  const { isMobile } = useResponsive();

  // Use player data from ReactGameContext
  const player = state.player;
  const playerLevel = player?.level || 1;

  // Debug: Check if values are NaN and log once
  React.useEffect(() => {
    if (player) {
      console.log('🎮 StatsScreen Player Data:', {
        name: player.name,
        level: player.level,
        experience: player.experience,
        experienceToNext: player.experienceToNext,
        gold: player.gold,
        experienceIsNaN: isNaN(player.experience),
        goldIsNaN: isNaN(player.gold)
      });
    }
  }, []); // Only run once

  // TODO: Replace with ReactGameContext equivalents
  // For now, create mock data to display current player stats
  const experienceState = {
    currentExperience: player?.experience || 0,
    experienceToNext: player?.experienceToNext || 100,
    achievements: [] // Empty achievements to prevent crashes
  };

  const levelInfo = {
    currentLevel: playerLevel,
    nextLevel: playerLevel + 1,
    progress: player ? (player.experience / player.experienceToNext) * 100 : 0
  };

  // Mock experience breakdown to prevent crashes
  const breakdown = {
    totalExperience: player?.experience || 0,
    sources: [], // Empty sources for now
    sourceTotals: {}, // Empty source totals for now
    bySource: {} // Empty bySource to prevent crashes
  };
  const isLoading = false;
  const error = null;

  // Mock equipment data
  const equipmentStats = { attack: 0, defense: 0, magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0 };
  const finalStats = player?.baseStats || { attack: 10, defense: 10, magicAttack: 10, magicDefense: 10, speed: 10, accuracy: 85 };
  const equipped = {};

  // Local state
  const [viewMode, setViewMode] = useState<StatsViewMode>('overview');

  // Get view mode info
  const getViewModeInfo = (mode: StatsViewMode) => {
    switch (mode) {
      case 'overview':
        return {
          icon: '📊',
          name: 'Overview',
          description: 'Character statistics and level info'
        };
      case 'experience':
        return {
          icon: '⭐',
          name: 'Experience',
          description: 'XP breakdown and progression'
        };
      case 'achievements':
        return {
          icon: '🏆',
          name: 'Achievements',
          description: 'Unlocked achievements and milestones'
        };
      case 'history':
        return {
          icon: '📈',
          name: 'History',
          description: 'Progression history and trends'
        };
      default:
        return { icon: '❓', name: 'Unknown', description: '' };
    }
  };

  // Calculate derived stats and enhanced XP info
  const derivedStats = useMemo(() => {
    if (!player) return null;

    const currentXP = player.experience || 0;
    const xpCalcs = createExperienceCalculations(currentXP);

    // Mock activity breakdown based on current XP until proper tracking is implemented
    const mockActivityBreakdown = {
      combat: Math.floor(currentXP * 0.35), // 35% from combat
      quest: Math.floor(currentXP * 0.25),   // 25% from quests
      exploration: Math.floor(currentXP * 0.15), // 15% from exploration
      creature: Math.floor(currentXP * 0.10),    // 10% from creatures
      crafting: Math.floor(currentXP * 0.08),    // 8% from crafting
      trading: Math.floor(currentXP * 0.04),     // 4% from trading
      discovery: Math.floor(currentXP * 0.02),   // 2% from discovery
      achievement: Math.floor(currentXP * 0.01)  // 1% from achievements
    };

    // Use final stats from equipment calculations if available
    const calculatedStats = finalStats || {};

    return {
      // Combat Stats
      totalAttack: calculatedStats.attack?.finalValue || player.baseStats?.attack || 10,
      totalDefense: calculatedStats.defense?.finalValue || player.baseStats?.defense || 10,
      totalMagicAttack: calculatedStats.magicAttack?.finalValue || player.baseStats?.magicAttack || 10,
      totalMagicDefense: calculatedStats.magicDefense?.finalValue || player.baseStats?.magicDefense || 10,
      totalSpeed: calculatedStats.speed?.finalValue || player.baseStats?.speed || 10,
      totalAccuracy: calculatedStats.accuracy?.finalValue || player.baseStats?.accuracy || 10,

      // Derived Combat Stats
      totalCriticalChance: calculatedStats.criticalChance?.finalValue || 5,
      totalCriticalDamage: calculatedStats.criticalDamage?.finalValue || 150,
      totalEvasion: calculatedStats.evasion?.finalValue || 5,
      totalResistance: calculatedStats.resistance?.finalValue || 5,

      // Health & Mana
      maxHealth: calculatedStats.health?.finalValue || (100 + (player.level || 1) * 10),
      maxMana: calculatedStats.mana?.finalValue || (50 + (player.level || 1) * 5),
      healthPercentage: (player.hp / (calculatedStats.health?.finalValue || 100)) * 100,
      manaPercentage: (player.mp / (calculatedStats.mana?.finalValue || 50)) * 100,

      // Stat Breakdowns for detailed view
      statBreakdowns: calculatedStats,

      // Equipment Info
      equipmentBonus: {
        attack: calculatedStats.attack?.equipmentBonus || 0,
        defense: calculatedStats.defense?.equipmentBonus || 0,
        magicAttack: calculatedStats.magicAttack?.equipmentBonus || 0,
        magicDefense: calculatedStats.magicDefense?.equipmentBonus || 0,
        speed: calculatedStats.speed?.equipmentBonus || 0,
        accuracy: calculatedStats.accuracy?.equipmentBonus || 0
      },

      // Level Progression Info
      levelBonus: {
        attack: calculatedStats.attack?.levelBonus || 0,
        defense: calculatedStats.defense?.levelBonus || 0,
        magicAttack: calculatedStats.magicAttack?.levelBonus || 0,
        magicDefense: calculatedStats.magicDefense?.levelBonus || 0,
        speed: calculatedStats.speed?.levelBonus || 0,
        accuracy: calculatedStats.accuracy?.levelBonus || 0
      },

      // XP and activity data
      xpCalculations: xpCalcs,
      activityBreakdown: mockActivityBreakdown
    };
  }, [player, finalStats]);

  // Activity type icons (enhanced mapping for new system)
  const getActivityIcon = (activity: string): string => {
    switch (activity.toLowerCase()) {
      case 'combat': return '⚔️';
      case 'quest': return '📜';
      case 'exploration': return '🗺️';
      case 'creature': return '🐉';
      case 'crafting': return '🔨';
      case 'trading': return '💰';
      case 'discovery': return '🔍';
      case 'achievement': return '🏆';
      default: return '✨';
    }
  };

  // Experience source icons (legacy support)
  const getExperienceSourceIcon = (source: ExperienceSource): string => {
    switch (source) {
      case 'combat': return '⚔️';
      case 'quest_completion': return '📜';
      case 'exploration': return '🗺️';
      case 'creature_capture': return '🎯';
      case 'crafting': return '🔨';
      case 'trading': return '🏪';
      case 'story_progression': return '📖';
      case 'discovery': return '🔍';
      case 'achievement': return '🏆';
      case 'daily_bonus': return '🎁';
      case 'special_event': return '🎊';
      default: return '✨';
    }
  };

  if (isLoading) {
    return (
      <div style={{ ...statsStyles.container, alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner size="large" />
        <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>Loading character statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...statsStyles.container, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#ff6b6b' }}>
          <h2>Error Loading Stats</h2>
          <p>{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={statsStyles.container}>
      {/* Close Button */}
      {onClose && (
        <motion.button
          style={statsStyles.closeButton}
          onClick={onClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ✕
        </motion.button>
      )}

      {/* Header */}
      <motion.div
        style={statsStyles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#4fc3f7' }}>
            Character Statistics
          </h1>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.8 }}>
            {player?.name || 'Player'} - Level {derivedStats?.xpCalculations.currentLevel || playerLevel || 1}
          </p>
        </div>

        {derivedStats?.xpCalculations && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4fc3f7' }}>
              {formatExperienceNumber(player?.experience || 0)} XP
            </div>
            <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              {formatExperienceNumber(derivedStats.xpCalculations.xpForNext)} to level {derivedStats.xpCalculations.nextLevel}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '0.25rem' }}>
              {derivedStats.xpCalculations.progressPercent.toFixed(1)}% progress
            </div>
          </div>
        )}
      </motion.div>

      {/* Navigation */}
      <motion.div
        style={statsStyles.navigation}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        {(['overview', 'experience', 'achievements', 'history'] as StatsViewMode[]).map((mode, index) => {
          const modeInfo = getViewModeInfo(mode);
          return (
            <motion.button
              key={mode}
              style={{
                ...statsStyles.navButton,
                ...(viewMode === mode ? statsStyles.navButtonActive : {})
              }}
              onClick={() => setViewMode(mode)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.05 }}
            >
              <span>{modeInfo.icon}</span>
              <span>{modeInfo.name}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Content */}
      <motion.div
        style={statsStyles.content}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {/* Overview Tab */}
        {viewMode === 'overview' && (
          <>
            {/* Character Stats */}
            <motion.div
              style={statsStyles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={statsStyles.cardHeader}>
                <span>⚔️ Character Stats</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                  {Object.values(derivedStats?.equipmentBonus || {}).reduce((sum, val) => sum + val, 0) > 0 &&
                   '+' + Object.values(derivedStats?.equipmentBonus || {}).reduce((sum, val) => sum + val, 0) + ' from equipment'}
                </span>
              </div>

              {derivedStats && (
                <>
                  <div style={statsStyles.statsGrid}>
                    <div style={statsStyles.statCard}>
                      <div style={statsStyles.statValue}>{derivedStats.totalAttack}</div>
                      <div style={statsStyles.statLabel}>Attack</div>
                      {derivedStats.equipmentBonus.attack > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#4fc3f7', marginTop: '0.25rem' }}>
                          +{derivedStats.equipmentBonus.attack} equipment
                        </div>
                      )}
                    </div>
                    <div style={statsStyles.statCard}>
                      <div style={statsStyles.statValue}>{derivedStats.totalDefense}</div>
                      <div style={statsStyles.statLabel}>Defense</div>
                      {derivedStats.equipmentBonus.defense > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#4fc3f7', marginTop: '0.25rem' }}>
                          +{derivedStats.equipmentBonus.defense} equipment
                        </div>
                      )}
                    </div>
                    <div style={statsStyles.statCard}>
                      <div style={statsStyles.statValue}>{derivedStats.totalMagicAttack}</div>
                      <div style={statsStyles.statLabel}>Magic Attack</div>
                      {derivedStats.equipmentBonus.magicAttack > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#4fc3f7', marginTop: '0.25rem' }}>
                          +{derivedStats.equipmentBonus.magicAttack} equipment
                        </div>
                      )}
                    </div>
                    <div style={statsStyles.statCard}>
                      <div style={statsStyles.statValue}>{derivedStats.totalMagicDefense}</div>
                      <div style={statsStyles.statLabel}>Magic Defense</div>
                      {derivedStats.equipmentBonus.magicDefense > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#4fc3f7', marginTop: '0.25rem' }}>
                          +{derivedStats.equipmentBonus.magicDefense} equipment
                        </div>
                      )}
                    </div>
                    <div style={statsStyles.statCard}>
                      <div style={statsStyles.statValue}>{derivedStats.totalSpeed}</div>
                      <div style={statsStyles.statLabel}>Speed</div>
                      {derivedStats.equipmentBonus.speed > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#4fc3f7', marginTop: '0.25rem' }}>
                          +{derivedStats.equipmentBonus.speed} equipment
                        </div>
                      )}
                    </div>
                    <div style={statsStyles.statCard}>
                      <div style={statsStyles.statValue}>{derivedStats.totalAccuracy}%</div>
                      <div style={statsStyles.statLabel}>Accuracy</div>
                      {derivedStats.equipmentBonus.accuracy > 0 && (
                        <div style={{ fontSize: '0.7rem', color: '#4fc3f7', marginTop: '0.25rem' }}>
                          +{derivedStats.equipmentBonus.accuracy} equipment
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Advanced Combat Stats */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '1rem',
                      color: '#4fc3f7'
                    }}>
                      🎯 Advanced Combat Stats
                    </div>
                    <div style={statsStyles.statsGrid}>
                      <div style={statsStyles.statCard}>
                        <div style={statsStyles.statValue}>{derivedStats.totalCriticalChance}%</div>
                        <div style={statsStyles.statLabel}>Critical Chance</div>
                      </div>
                      <div style={statsStyles.statCard}>
                        <div style={statsStyles.statValue}>{derivedStats.totalCriticalDamage}%</div>
                        <div style={statsStyles.statLabel}>Critical Damage</div>
                      </div>
                      <div style={statsStyles.statCard}>
                        <div style={statsStyles.statValue}>{derivedStats.totalEvasion}</div>
                        <div style={statsStyles.statLabel}>Evasion</div>
                      </div>
                      <div style={statsStyles.statCard}>
                        <div style={statsStyles.statValue}>{derivedStats.totalResistance}</div>
                        <div style={statsStyles.statLabel}>Magic Resistance</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>

            {/* Health and Mana */}
            <motion.div
              style={statsStyles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div style={statsStyles.cardHeader}>
                <span>❤️ Health & Mana</span>
              </div>

              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Health</span>
                    <span>{player?.hp || 0}/{derivedStats?.maxHealth || 100}</span>
                  </div>
                  <div style={statsStyles.progressBar}>
                    <div
                      style={{
                        ...statsStyles.progressFill,
                        width: `${derivedStats?.healthPercentage || 0}%`,
                        background: 'linear-gradient(90deg, #4caf50, #66bb6a)'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>
                    Max HP: {derivedStats?.maxHealth || 100}
                    {derivedStats?.maxHealth && derivedStats.maxHealth > 100 && (
                      <span style={{ color: '#4fc3f7' }}>
                        {' '}(+{derivedStats.maxHealth - 100} from level)
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Mana</span>
                    <span>{player?.mp || 0}/{derivedStats?.maxMana || 50}</span>
                  </div>
                  <div style={statsStyles.progressBar}>
                    <div
                      style={{
                        ...statsStyles.progressFill,
                        width: `${derivedStats?.manaPercentage || 0}%`,
                        background: 'linear-gradient(90deg, #2196f3, #42a5f5)'
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.25rem' }}>
                    Max MP: {derivedStats?.maxMana || 50}
                    {derivedStats?.maxMana && derivedStats.maxMana > 50 && (
                      <span style={{ color: '#4fc3f7' }}>
                        {' '}(+{derivedStats.maxMana - 50} from level)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Level Progress */}
            {derivedStats?.xpCalculations && (
              <motion.div
                style={{ ...statsStyles.card, ...statsStyles.experienceCard }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div style={statsStyles.cardHeader}>
                  <span>⭐ Level Progress</span>
                  <span>Level {derivedStats.xpCalculations.currentLevel}</span>
                </div>

                {/* Enhanced Experience Bar */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <ExperienceBar showTooltip={true} />
                </div>

                <div style={statsStyles.statsGrid}>
                  <div style={statsStyles.statCard}>
                    <div style={statsStyles.statValue}>
                      {formatExperienceNumber(player?.experience || 0)}
                    </div>
                    <div style={statsStyles.statLabel}>Current XP</div>
                  </div>
                  <div style={statsStyles.statCard}>
                    <div style={statsStyles.statValue}>
                      {formatExperienceNumber(derivedStats.xpCalculations.xpForNext)}
                    </div>
                    <div style={statsStyles.statLabel}>XP to Next</div>
                  </div>
                  <div style={statsStyles.statCard}>
                    <div style={statsStyles.statValue}>
                      {formatExperienceNumber(derivedStats.xpCalculations.requiredForNext)}
                    </div>
                    <div style={statsStyles.statLabel}>Next Level Req</div>
                  </div>
                  <div style={statsStyles.statCard}>
                    <div style={statsStyles.statValue}>
                      {formatExperienceNumber(derivedStats.xpCalculations.requiredForCurrent)}
                    </div>
                    <div style={statsStyles.statLabel}>Current Level Req</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Detailed Stat Breakdown */}
            {derivedStats?.statBreakdowns && (
              <motion.div
                style={statsStyles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div style={statsStyles.cardHeader}>
                  <span>🔍 Stat Breakdown</span>
                  <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    Base + Equipment + Level
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Object.entries(derivedStats.statBreakdowns)
                    .filter(([stat]) => ['attack', 'defense', 'magicAttack', 'magicDefense', 'speed', 'accuracy'].includes(stat))
                    .map(([statName, statCalc]) => (
                      <div key={statName} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '8px',
                        padding: '1rem',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                      }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.75rem'
                        }}>
                          <span style={{
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>
                            {statName.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#4fc3f7'
                          }}>
                            {statCalc.finalValue}
                          </span>
                        </div>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                          gap: '0.75rem'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              fontSize: '1.2rem',
                              fontWeight: '600',
                              color: '#f4f4f4'
                            }}>
                              {statCalc.baseStat}
                            </div>
                            <div style={{
                              fontSize: '0.8rem',
                              opacity: 0.7
                            }}>
                              Base
                            </div>
                          </div>

                          {statCalc.equipmentBonus > 0 && (
                            <>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                opacity: 0.6
                              }}>
                                +
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{
                                  fontSize: '1.2rem',
                                  fontWeight: '600',
                                  color: '#4fc3f7'
                                }}>
                                  {statCalc.equipmentBonus}
                                </div>
                                <div style={{
                                  fontSize: '0.8rem',
                                  opacity: 0.7
                                }}>
                                  Equipment
                                </div>
                              </div>
                            </>
                          )}

                          {statCalc.levelBonus > 0 && (
                            <>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.2rem',
                                opacity: 0.6
                              }}>
                                +
                              </div>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{
                                  fontSize: '1.2rem',
                                  fontWeight: '600',
                                  color: '#ffd700'
                                }}>
                                  {statCalc.levelBonus}
                                </div>
                                <div style={{
                                  fontSize: '0.8rem',
                                  opacity: 0.7
                                }}>
                                  Level
                                </div>
                              </div>
                            </>
                          )}

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.2rem',
                            opacity: 0.6
                          }}>
                            =
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}

            {/* Equipment Summary */}
            {equipped && Object.values(equipped).some(item => item !== null) && (
              <motion.div
                style={statsStyles.card}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div style={statsStyles.cardHeader}>
                  <span>🛡️ Equipped Items</span>
                  <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                    {Object.values(equipped).filter(item => item !== null).length} items equipped
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {Object.entries(equipped)
                    .filter(([, item]) => item !== null)
                    .map(([slot, item]) => (
                      <div key={slot} style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '6px',
                        padding: '0.75rem',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{ fontSize: '1.1rem' }}>
                          {slot === 'weapon' ? '⚔️' :
                           slot === 'armor' ? '🛡️' :
                           slot === 'helmet' ? '⛑️' :
                           slot === 'boots' ? '👢' :
                           slot === 'gloves' ? '🧤' :
                           slot === 'ring1' || slot === 'ring2' ? '💍' :
                           slot === 'necklace' ? '📿' :
                           slot === 'charm' ? '🔮' : '✨'}
                        </span>
                        <div>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {slot.replace(/\d+$/, '')}
                          </div>
                          <div style={{
                            fontSize: '0.8rem',
                            opacity: 0.7
                          }}>
                            {item?.name || 'Unknown Item'}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Experience Tab */}
        {viewMode === 'experience' && derivedStats?.activityBreakdown && (
          <>
            {/* Activity Breakdown */}
            <motion.div
              style={statsStyles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={statsStyles.cardHeader}>
                <span>⭐ Experience by Activity Type</span>
                <span>{formatExperienceNumber(player?.experience || 0)} Total XP</span>
              </div>

              <div style={statsStyles.sourceBreakdown}>
                {Object.entries(derivedStats.activityBreakdown)
                  .filter(([, xp]) => xp > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([activity, xp]) => {
                    const totalXP = player?.experience || 1;
                    const percentage = totalXP > 0 ? (xp / totalXP) * 100 : 0;

                    return (
                      <div key={activity} style={statsStyles.sourceItem}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{getActivityIcon(activity)}</span>
                          <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                            {activity}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{
                            minWidth: '60px',
                            height: '6px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${percentage}%`,
                                background: `linear-gradient(90deg, #4fc3f7, #29b6f6)`,
                                borderRadius: '3px',
                                transition: 'width 0.3s ease'
                              }}
                            />
                          </div>
                          <span style={{ minWidth: '80px', textAlign: 'right' }}>
                            {formatExperienceNumber(xp)} XP
                          </span>
                          <span style={{
                            fontSize: '0.8rem',
                            opacity: 0.7,
                            minWidth: '50px',
                            textAlign: 'right'
                          }}>
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>

            {/* Activity Statistics Grid */}
            <motion.div
              style={statsStyles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div style={statsStyles.cardHeader}>
                <span>📊 Activity Statistics</span>
              </div>

              <div style={statsStyles.statsGrid}>
                {Object.entries(derivedStats.activityBreakdown)
                  .filter(([, xp]) => xp > 0)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 4)
                  .map(([activity, xp]) => (
                    <div key={activity} style={statsStyles.statCard}>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                        {getActivityIcon(activity)}
                      </div>
                      <div style={statsStyles.statValue}>
                        {formatExperienceNumber(xp)}
                      </div>
                      <div style={statsStyles.statLabel}>
                        {activity.charAt(0).toUpperCase() + activity.slice(1)} XP
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>

            {/* Legacy breakdown fallback */}
            {breakdown && (
              <motion.div
                style={{ ...statsStyles.card, opacity: 0.7 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 0.7, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div style={statsStyles.cardHeader}>
                  <span>📜 Legacy Source Breakdown</span>
                  <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                    ({breakdown.totalExperience.toLocaleString()} Total XP)
                  </span>
                </div>

                <div style={statsStyles.sourceBreakdown}>
                  {Object.entries(breakdown.bySource)
                    .filter(([, stats]) => stats.totalAmount > 0)
                    .slice(0, 5)
                    .map(([source, stats]) => (
                      <div key={source} style={{ ...statsStyles.sourceItem, opacity: 0.8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{getExperienceSourceIcon(source as ExperienceSource)}</span>
                          <span style={{
                            textTransform: 'capitalize',
                            fontSize: '0.9rem'
                          }}>
                            {source.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ fontSize: '0.9rem' }}>
                            {stats.totalAmount.toLocaleString()} XP
                          </span>
                          <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                            {stats.percentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Achievements Tab */}
        {viewMode === 'achievements' && experienceState && (
          <motion.div
            style={statsStyles.card}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div style={statsStyles.cardHeader}>
              <span>🏆 Achievements</span>
              <span>{experienceState.achievements?.filter(a => a.completed).length || 0} Unlocked</span>
            </div>

            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.6 }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
              <div>Achievement system coming soon!</div>
              <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Complete quests and challenges to unlock achievements
              </div>
            </div>
          </motion.div>
        )}

        {/* History Tab */}
        {viewMode === 'history' && (
          <>
            {/* Level History */}
            <motion.div
              style={statsStyles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={statsStyles.cardHeader}>
                <span>📈 Level Progression History</span>
                <span>Level {derivedStats?.xpCalculations.currentLevel || 1}</span>
              </div>

              {derivedStats?.xpCalculations && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Level Timeline */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {Array.from({ length: Math.min(10, derivedStats.xpCalculations.currentLevel) }, (_, i) => {
                      const level = derivedStats.xpCalculations.currentLevel - i;
                      const isCurrentLevel = level === derivedStats.xpCalculations.currentLevel;
                      const requiredXP = ExperienceCalculator.calculateRequiredXP(level);
                      const mockTimestamp = Date.now() - (i * 24 * 60 * 60 * 1000 * (Math.random() * 3 + 1));

                      return (
                        <div
                          key={level}
                          style={{
                            ...statsStyles.sourceItem,
                            background: isCurrentLevel
                              ? 'rgba(79, 195, 247, 0.15)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isCurrentLevel
                              ? '1px solid rgba(79, 195, 247, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.08)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: isCurrentLevel
                                ? 'linear-gradient(135deg, #4fc3f7, #29b6f6)'
                                : 'rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.9rem',
                              fontWeight: 'bold'
                            }}>
                              {level}
                            </div>
                            <div>
                              <div style={{ fontWeight: '500' }}>
                                Level {level} {isCurrentLevel && '(Current)'}
                              </div>
                              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                {new Date(mockTimestamp).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '500' }}>
                              {formatExperienceNumber(requiredXP)} XP
                            </div>
                            {!isCurrentLevel && (
                              <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                                Achieved
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>

            {/* XP History and Statistics */}
            <motion.div
              style={statsStyles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div style={statsStyles.cardHeader}>
                <span>📊 Experience Statistics</span>
              </div>

              <div style={statsStyles.statsGrid}>
                <div style={statsStyles.statCard}>
                  <div style={statsStyles.statValue}>
                    {formatExperienceNumber(player?.experience || 0)}
                  </div>
                  <div style={statsStyles.statLabel}>Total Experience</div>
                </div>
                <div style={statsStyles.statCard}>
                  <div style={statsStyles.statValue}>
                    {derivedStats?.xpCalculations.currentLevel || 1}
                  </div>
                  <div style={statsStyles.statLabel}>Current Level</div>
                </div>
                <div style={statsStyles.statCard}>
                  <div style={statsStyles.statValue}>
                    {Math.floor((player?.experience || 0) / (derivedStats?.xpCalculations.currentLevel || 1))}
                  </div>
                  <div style={statsStyles.statLabel}>Avg XP/Level</div>
                </div>
                <div style={statsStyles.statCard}>
                  <div style={statsStyles.statValue}>
                    {derivedStats?.xpCalculations.progressPercent.toFixed(0)}%
                  </div>
                  <div style={statsStyles.statLabel}>Level Progress</div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity History */}
            <motion.div
              style={statsStyles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div style={statsStyles.cardHeader}>
                <span>🕒 Recent Activity</span>
                <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Last 7 days</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Mock recent activities */}
                {[
                  { activity: 'combat', xp: 245, time: '2 hours ago', detail: 'Defeated Shadow Beast' },
                  { activity: 'quest', xp: 500, time: '5 hours ago', detail: 'Completed "The Ancient Relic"' },
                  { activity: 'creature', xp: 180, time: '1 day ago', detail: 'Captured Fire Salamander' },
                  { activity: 'exploration', xp: 125, time: '1 day ago', detail: 'Discovered Hidden Cave' },
                  { activity: 'crafting', xp: 95, time: '2 days ago', detail: 'Crafted Steel Sword' },
                  { activity: 'trading', xp: 45, time: '3 days ago', detail: 'Sold rare materials' }
                ].map((entry, index) => (
                  <div key={index} style={{
                    ...statsStyles.sourceItem,
                    background: 'rgba(255, 255, 255, 0.02)',
                    padding: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {getActivityIcon(entry.activity)}
                      </span>
                      <div>
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                          +{entry.xp} XP
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                          {entry.detail}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', opacity: 0.6 }}>
                      {entry.time}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Progression Trends */}
            <motion.div
              style={statsStyles.card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div style={statsStyles.cardHeader}>
                <span>📈 Progression Trends</span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1rem'
              }}>
                {/* Daily XP Progress */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    color: '#4fc3f7'
                  }}>
                    Daily XP (Last 7 Days)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'end', gap: '0.25rem', height: '60px' }}>
                    {[380, 420, 290, 510, 445, 385, 465].map((xp, index) => {
                      const height = Math.max(10, (xp / 600) * 100);
                      return (
                        <div
                          key={index}
                          style={{
                            flex: 1,
                            height: `${height}%`,
                            background: index === 6
                              ? 'linear-gradient(180deg, #4fc3f7, #29b6f6)'
                              : 'rgba(79, 195, 247, 0.6)',
                            borderRadius: '2px',
                            position: 'relative'
                          }}
                          title={`${xp} XP`}
                        />
                      );
                    })}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.7rem',
                    opacity: 0.6,
                    marginTop: '0.5rem'
                  }}>
                    <span>7d ago</span>
                    <span>Today</span>
                  </div>
                </div>

                {/* Level Progress Timeline */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    marginBottom: '0.75rem',
                    color: '#4fc3f7'
                  }}>
                    Level Milestones
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {[
                      { level: derivedStats?.xpCalculations.currentLevel || 1, progress: derivedStats?.xpCalculations.progressPercent || 0, current: true },
                      { level: (derivedStats?.xpCalculations.currentLevel || 1) + 1, progress: 0, current: false },
                      { level: (derivedStats?.xpCalculations.currentLevel || 1) + 2, progress: 0, current: false }
                    ].map((milestone, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.8rem',
                          minWidth: '30px',
                          opacity: milestone.current ? 1 : 0.6
                        }}>
                          L{milestone.level}
                        </span>
                        <div style={{
                          flex: 1,
                          height: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${milestone.progress}%`,
                            background: milestone.current
                              ? 'linear-gradient(90deg, #4fc3f7, #29b6f6)'
                              : 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '2px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{
                          fontSize: '0.7rem',
                          opacity: 0.6,
                          minWidth: '35px',
                          textAlign: 'right'
                        }}>
                          {milestone.progress.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default StatsScreen;