import React, { memo, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Tooltip } from '../atoms';
import { cardStyles } from '../../utils/temporaryStyles';
// import styles from './AreaCard.module.css'; // Temporarily disabled due to PostCSS parsing issues

const styles = cardStyles;

export interface Area {
  id: string;
  name: string;
  description: string;
  type: 'town' | 'wilderness' | 'dungeon' | 'special';
  unlocked: boolean;
  unlockRequirements: {
    level?: number;
    story?: string;
    items?: string[];
    areas?: string[];
  };
  encounterRate: number;
  monsters: string[];
  connections: string[];
  services?: string[];
  recommendedLevel: number;
}

export interface AreaCardProps {
  /** Area data */
  area: Area;
  /** Whether the area is currently selected */
  selected?: boolean;
  /** Whether the area can be accessed */
  accessible?: boolean;
  /** Current player level for level requirements */
  playerLevel?: number;
  /** Completion percentage (0-100) */
  completionRate?: number;
  /** Called when the area is clicked */
  onClick?: (area: Area) => void;
  /** Called when the enter button is clicked */
  onEnter?: (area: Area) => void;
  /** Custom className */
  className?: string;
  /** Show detailed information */
  showDetails?: boolean;
  /** Card size variant */
  size?: 'sm' | 'md' | 'lg';
}

const AreaCard: React.FC<AreaCardProps> = ({
  area,
  selected = false,
  accessible = true,
  playerLevel = 1,
  completionRate = 0,
  onClick,
  onEnter,
  className = '',
  showDetails = true,
  size = 'md',
}) => {
  // Memoize computed values that depend on props
  const isLocked = useMemo(() => !accessible, [accessible]); // Use accessible prop instead of just area.unlocked
  const isAccessible = useMemo(() => accessible, [accessible]); // Just use the accessible prop directly
  const meetsLevelRequirement = useMemo(
    () => !area.unlockRequirements.level || playerLevel >= area.unlockRequirements.level,
    [area.unlockRequirements.level, playerLevel]
  );

  // Memoize event handlers to prevent unnecessary re-renders
  const handleClick = useCallback(() => {
    if (isAccessible && onClick) {
      onClick(area);
    }
  }, [isAccessible, onClick, area]);

  const handleEnter = useCallback(() => {
    if (isAccessible && onEnter) {
      onEnter(area);
    }
  }, [isAccessible, onEnter, area]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  // Memoize area icon (rarely changes)
  const areaIcon = useMemo(() => {
    switch (area.type) {
      case 'town': return '🏘️';
      case 'wilderness': return '🌲';
      case 'dungeon': return '🏰';
      case 'special': return '✨';
      default: return '📍';
    }
  }, [area.type]);

  // Memoize difficulty color calculation
  const difficultyColor = useMemo(() => {
    if (!area.recommendedLevel) return 'var(--text-secondary)';

    const levelDiff = area.recommendedLevel - playerLevel;
    if (levelDiff <= -5) return 'var(--success-green)';  // Much easier
    if (levelDiff <= -2) return 'var(--info-blue)';     // Easier
    if (levelDiff <= 2) return 'var(--primary-gold)';   // Appropriate
    if (levelDiff <= 5) return 'var(--warning-orange)'; // Harder
    return 'var(--danger-red)';                          // Much harder
  }, [area.recommendedLevel, playerLevel]);

  const getUnlockTooltip = () => {
    if (area.unlocked) return null;

    const requirements = [];
    if (area.unlockRequirements.level) {
      requirements.push(`Level ${area.unlockRequirements.level}`);
    }
    if (area.unlockRequirements.story) {
      requirements.push(`Story: ${area.unlockRequirements.story}`);
    }
    if (area.unlockRequirements.areas?.length) {
      requirements.push(`Complete: ${area.unlockRequirements.areas.join(', ')}`);
    }
    if (area.unlockRequirements.items?.length) {
      requirements.push(`Items: ${area.unlockRequirements.items.join(', ')}`);
    }

    return `Unlock Requirements: ${requirements.join(', ')}`;
  };

  const cardClasses = [
    styles.areaCard,
    styles[size],
    selected && styles.selected,
    isLocked && styles.locked,
    !isAccessible && styles.inaccessible,
    className,
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      className={cardClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={isAccessible ? 0 : -1}
      role="button"
      aria-pressed={selected}
      aria-disabled={!isAccessible}
      aria-label={`${area.name} - ${isLocked ? 'Locked' : isAccessible ? 'Available' : 'Inaccessible'}`}
      whileHover={isAccessible ? { scale: 1.03, y: -3 } : undefined}
      whileTap={isAccessible ? { scale: 0.97 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card
        variant="area"
        size={size}
        interactive={isAccessible}
        selected={selected}
        className={styles.cardInner}
      >
        {/* Lock overlay */}
        {isLocked && (
          <div className={styles.lockOverlay}>
            <span className={styles.lockIcon} role="img" aria-label="Locked">
              🔒
            </span>
          </div>
        )}

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <span className={styles.areaIcon} role="img" aria-label={area.type}>
              {areaIcon}
            </span>
            <h3 className={styles.areaName}>{area.name}</h3>
            {completionRate > 0 && (
              <span className={styles.completionBadge}>
                {Math.round(completionRate)}%
              </span>
            )}
          </div>

          <p className={styles.description}>{area.description}</p>
        </div>

        {/* Stats */}
        {showDetails && (
          <div className={styles.stats}>
            <div className={styles.statRow}>
              <span className={styles.statLabel}>Type:</span>
              <span className={styles.statValue}>{area.type}</span>
            </div>

            <div className={styles.statRow}>
              <span className={styles.statLabel}>Level:</span>
              <span
                className={styles.statValue}
                style={{ color: difficultyColor }}
              >
                {area.recommendedLevel || 'Any'}
              </span>
            </div>

            {area.encounterRate > 0 && (
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Danger:</span>
                <div className={styles.encounterRate}>
                  <div
                    className={styles.encounterBar}
                    style={{ width: `${Math.min(area.encounterRate, 100)}%` }}
                  />
                  <span className={styles.encounterText}>{area.encounterRate}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Services */}
        {area.services && area.services.length > 0 && (
          <div className={styles.services}>
            <h4 className={styles.servicesTitle}>Services:</h4>
            <div className={styles.servicesList}>
              {area.services.map((service) => (
                <span key={service} className={styles.serviceTag}>
                  {service.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Monsters */}
        {showDetails && area.monsters.length > 0 && (
          <div className={styles.monsters}>
            <h4 className={styles.monstersTitle}>
              Monsters ({area.monsters.length}):
            </h4>
            <div className={styles.monsterList}>
              {area.monsters.slice(0, 3).map((monster) => (
                <span key={monster} className={styles.monsterTag}>
                  {monster.replace('_', ' ')}
                </span>
              ))}
              {area.monsters.length > 3 && (
                <span className={styles.monsterMore}>
                  +{area.monsters.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Completion progress bar */}
        {completionRate > 0 && (
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className={styles.progressText}>
              {Math.round(completionRate)}% explored
            </span>
          </div>
        )}

        {/* Action button */}
        <div className={styles.actions}>
          {isLocked ? (
            <Tooltip content={getUnlockTooltip()}>
              <Button
                variant="secondary"
                fullWidth
                disabled={true}
                size={size === 'sm' ? 'sm' : 'md'}
              >
                🔒 Locked
              </Button>
            </Tooltip>
          ) : (
            <Button
              variant={selected ? 'success' : 'primary'}
              fullWidth
              disabled={!isAccessible}
              size={size === 'sm' ? 'sm' : 'md'}
              onClick={(e) => {
                e.stopPropagation();
                if (onEnter && !selected) {
                  handleEnter(); // Use onEnter for entering areas
                } else {
                  handleClick(); // Use onClick for selection
                }
              }}
            >
              {selected ? 'Current Area' : 'Enter Area'}
            </Button>
          )}
        </div>

        {/* Unlock requirements display */}
        {isLocked && (
          <div className={styles.unlockRequirements}>
            <h4 className={styles.requirementsTitle}>🔒 Unlock Requirements:</h4>
            <div className={styles.requirementsList}>
              {area.unlockRequirements.level && (
                <div className={styles.requirement}>
                  <span className={styles.requirementIcon}>⭐</span>
                  <span className={`${styles.requirementText} ${!meetsLevelRequirement ? styles.unmet : styles.met}`}>
                    Level {area.unlockRequirements.level} {meetsLevelRequirement ? '✓' : `(Current: ${playerLevel})`}
                  </span>
                </div>
              )}
              {area.unlockRequirements.story && (
                <div className={styles.requirement}>
                  <span className={styles.requirementIcon}>📖</span>
                  <span className={styles.requirementText}>
                    Complete: {area.unlockRequirements.story.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              {area.unlockRequirements.areas && area.unlockRequirements.areas.length > 0 && (
                <div className={styles.requirement}>
                  <span className={styles.requirementIcon}>🗺️</span>
                  <span className={styles.requirementText}>
                    Clear: {area.unlockRequirements.areas.join(', ').replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              {area.unlockRequirements.items && area.unlockRequirements.items.length > 0 && (
                <div className={styles.requirement}>
                  <span className={styles.requirementIcon}>🎒</span>
                  <span className={styles.requirementText}>
                    Need: {area.unlockRequirements.items.join(', ').replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Level requirement warning for accessible but challenging areas */}
        {!isLocked && !meetsLevelRequirement && (
          <div className={styles.levelWarning}>
            <span className={styles.warningIcon}>⚠️</span>
            <span>Recommended level {area.unlockRequirements.level} (Current: {playerLevel})</span>
          </div>
        )}
      </Card>
    </motion.div>
  );
};

AreaCard.displayName = 'AreaCard';

// Memoized AreaCard for performance optimization
const MemoizedAreaCard = memo(AreaCard, (prevProps, nextProps) => {
  // Custom comparison function for optimal re-render prevention
  return (
    prevProps.area.id === nextProps.area.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.accessible === nextProps.accessible &&
    prevProps.playerLevel === nextProps.playerLevel &&
    prevProps.completionRate === nextProps.completionRate &&
    prevProps.showDetails === nextProps.showDetails &&
    prevProps.size === nextProps.size &&
    prevProps.className === nextProps.className
  );
});

MemoizedAreaCard.displayName = 'AreaCard';

export { MemoizedAreaCard as AreaCard };