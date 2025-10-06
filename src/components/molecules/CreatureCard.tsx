import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { useCreatures } from '../../hooks/useCreatures';
import { useGameState } from '../../contexts/ReactGameContext';
import { useResponsive } from '../../hooks';
import { EnhancedCreature, CreatureElement, CreatureType } from '../../types/creatures';

interface CreatureCardProps {
  creature: EnhancedCreature;
  viewMode?: 'bestiary' | 'collection' | 'team' | 'breeding' | 'trading';
  onRelease?: (creature: EnhancedCreature) => void;
  onAddToTeam?: (creature: EnhancedCreature) => void;
  onRemoveFromTeam?: (creature: EnhancedCreature) => void;
  onRename?: (creature: EnhancedCreature) => void;
  onInspect?: (creature: EnhancedCreature) => void;
  onClick?: (creature: EnhancedCreature) => void;
  showActions?: boolean;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

// Temporary styles since PostCSS is disabled
const cardStyles = {
  container: {
    position: 'relative' as const,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
    borderRadius: '12px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(8px)'
  },
  containerSm: {
    padding: '0.75rem'
  },
  containerLg: {
    padding: '1.25rem'
  },
  containerDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  border: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '12px',
    padding: '2px',
    background: 'linear-gradient(135deg, transparent, transparent)',
    pointerEvents: 'none' as const
  },
  content: {
    position: 'relative' as const,
    zIndex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '0.5rem'
  },
  titleContainer: {
    flex: 1,
    minWidth: 0
  },
  title: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: '#d4af37',
    margin: '0 0 0.25rem 0',
    lineHeight: '1.2',
    wordBreak: 'break-word' as const
  },
  titleSm: {
    fontSize: '0.9rem'
  },
  titleLg: {
    fontSize: '1.1rem'
  },
  species: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    margin: 0,
    fontWeight: '500'
  },
  statusBadges: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
    alignItems: 'flex-end'
  },
  levelBadge: {
    background: 'rgba(212, 175, 55, 0.2)',
    borderRadius: '12px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#d4af37',
    whiteSpace: 'nowrap' as const,
    border: '1px solid rgba(212, 175, 55, 0.3)'
  },
  rarityBadge: {
    borderRadius: '12px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap' as const,
    border: '1px solid transparent'
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    margin: '0 auto 0.5rem',
    border: '2px solid rgba(255, 255, 255, 0.2)'
  },
  avatarSm: {
    width: '50px',
    height: '50px',
    fontSize: '1.5rem'
  },
  avatarLg: {
    width: '70px',
    height: '70px',
    fontSize: '2.5rem'
  },
  description: {
    fontSize: '0.8rem',
    color: '#e2e8f0',
    lineHeight: '1.4',
    margin: 0,
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const
  },
  descriptionExpanded: {
    WebkitLineClamp: 'unset',
    display: 'block'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginTop: '0.5rem'
  },
  tag: {
    fontSize: '0.7rem',
    padding: '0.2rem 0.4rem',
    borderRadius: '6px',
    fontWeight: '500'
  },
  typeTag: {
    background: 'rgba(59, 130, 246, 0.2)',
    color: '#60a5fa',
    border: '1px solid rgba(59, 130, 246, 0.3)'
  },
  elementTag: {
    border: '1px solid rgba(255, 255, 255, 0.3)'
  },
  sizeTag: {
    background: 'rgba(156, 163, 175, 0.2)',
    color: '#9ca3af',
    border: '1px solid rgba(156, 163, 175, 0.3)'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '6px'
  },
  statItem: {
    textAlign: 'center' as const,
    fontSize: '0.7rem'
  },
  statLabel: {
    color: '#94a3b8',
    display: 'block'
  },
  statValue: {
    color: '#f4f4f4',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    display: 'block',
    marginTop: '0.1rem'
  },
  personality: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    marginTop: '0.5rem',
    fontStyle: 'italic'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto',
    paddingTop: '0.5rem'
  },
  actionButton: {
    flex: 1,
    fontSize: '0.7rem',
    padding: '0.4rem 0.6rem'
  },
  primaryAction: {
    flex: 2
  },
  expandButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.7rem',
    padding: '0.25rem',
    marginTop: '0.25rem',
    transition: 'color 0.2s ease'
  },
  loadingOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    zIndex: 10
  },
  captureDate: {
    fontSize: '0.7rem',
    color: '#94a3b8',
    marginTop: '0.5rem'
  },
  discoveryBadge: {
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    borderRadius: '12px',
    padding: '0.2rem 0.4rem',
    fontSize: '0.6rem',
    fontWeight: 'bold',
    border: '1px solid rgba(34, 197, 94, 0.3)'
  },
  exhaustionBadge: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#ef4444',
    borderRadius: '12px',
    padding: '0.2rem 0.4rem',
    fontSize: '0.6rem',
    fontWeight: 'bold',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  exhaustionOverlay: {
    opacity: 0.6,
    filter: 'grayscale(40%)'
  },
  statPenalty: {
    color: '#ef4444',
    fontSize: '0.65rem',
    fontStyle: 'italic',
    marginLeft: '0.25rem'
  },
  generationBadge: {
    position: 'absolute' as const,
    top: '0.5rem',
    right: '0.5rem',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    border: '2px solid',
    zIndex: 2,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
  },
  mythicalAura: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '12px',
    pointerEvents: 'none' as const,
    zIndex: 0,
    animation: 'mythicalPulse 2s ease-in-out infinite'
  },
  bredIndicator: {
    position: 'absolute' as const,
    top: '0.5rem',
    left: '0.5rem',
    background: 'rgba(139, 92, 246, 0.3)',
    borderRadius: '6px',
    padding: '0.2rem 0.4rem',
    fontSize: '0.6rem',
    fontWeight: 'bold',
    color: '#a78bfa',
    border: '1px solid rgba(139, 92, 246, 0.5)',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  }
};

// Element colors
const elementColors = {
  fire: { bg: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  water: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  earth: { bg: 'rgba(163, 163, 163, 0.2)', color: '#a3a3a3', border: 'rgba(163, 163, 163, 0.3)' },
  air: { bg: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' },
  light: { bg: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' },
  dark: { bg: 'rgba(107, 33, 168, 0.2)', color: '#6b21a8', border: 'rgba(107, 33, 168, 0.3)' },
  ice: { bg: 'rgba(147, 197, 253, 0.2)', color: '#93c5fd', border: 'rgba(147, 197, 253, 0.3)' },
  lightning: { bg: 'rgba(255, 215, 0, 0.2)', color: '#ffd700', border: 'rgba(255, 215, 0, 0.3)' },
  nature: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
  neutral: { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' }
};

// Rarity colors
const rarityColors = {
  common: { bg: 'rgba(107, 114, 128, 0.2)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' },
  uncommon: { bg: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
  rare: { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
  epic: { bg: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' },
  legendary: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
  mythical: { bg: 'rgba(236, 72, 153, 0.2)', color: '#ec4899', border: 'rgba(236, 72, 153, 0.3)' }
};

// Generation badge colors
const generationColors = {
  0: { bg: 'rgba(107, 114, 128, 0.3)', color: '#9ca3af', border: '#6b7280' }, // Wild - Gray
  1: { bg: 'rgba(205, 127, 50, 0.3)', color: '#cd7f32', border: '#b8860b' }, // Gen 1 - Bronze
  2: { bg: 'rgba(192, 192, 192, 0.3)', color: '#c0c0c0', border: '#a8a8a8' }, // Gen 2 - Silver
  3: { bg: 'rgba(255, 215, 0, 0.3)', color: '#ffd700', border: '#daa520' }, // Gen 3 - Gold
  4: { bg: 'rgba(229, 228, 226, 0.3)', color: '#e5e4e2', border: '#c0c0c0' }, // Gen 4 - Platinum
  5: { bg: 'linear-gradient(135deg, #ff0080, #ff8c00, #40e0d0, #9b59b6)', color: '#fff', border: '#fff' } // Gen 5 - Rainbow
};

// Element emojis for avatar fallback
const elementEmojis = {
  fire: '🔥',
  water: '💧',
  earth: '🌍',
  air: '💨',
  light: '✨',
  dark: '🌙',
  ice: '❄️',
  lightning: '⚡',
  nature: '🌿',
  neutral: '⭕'
};

export const CreatureCard: React.FC<CreatureCardProps> = ({
  creature,
  viewMode = 'bestiary',
  onRelease,
  onAddToTeam,
  onRemoveFromTeam,
  onRename,
  onInspect,
  onClick,
  showActions = true,
  showDetails = true,
  size = 'md',
  className = '',
  disabled = false
}) => {
  const { gameState } = useGameState();
  const { isMobile } = useResponsive();
  const {
    releaseCreature,
    addToTeam,
    removeFromTeam,
    renameCreature,
    isLoading: creaturesLoading
  } = useCreatures();

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRenameInput, setShowRenameInput] = useState(false);
  const [newName, setNewName] = useState(creature.name);

  // Get styling based on element and rarity
  const elementColor = elementColors[creature.element] || elementColors.neutral;
  const rarityColor = rarityColors[creature.rarity as keyof typeof rarityColors] || rarityColors.common;

  // Handle creature actions
  const handleRelease = useCallback(async () => {
    if (disabled || isLoading || creaturesLoading) return;

    setIsLoading(true);
    try {
      if (onRelease) {
        onRelease(creature);
      } else {
        const result = await releaseCreature(creature.creatureId);
        if (result.success) {
          console.log(`✅ Released ${creature.name} back to the wild`);
        } else {
          console.error(`❌ Failed to release ${creature.name}: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Error releasing creature:', error);
    } finally {
      setIsLoading(false);
    }
  }, [creature, onRelease, releaseCreature, disabled, isLoading, creaturesLoading]);

  const handleAddToTeam = useCallback(async () => {
    if (disabled || isLoading || creaturesLoading) return;

    setIsLoading(true);
    try {
      if (onAddToTeam) {
        onAddToTeam(creature);
      } else {
        const result = await addToTeam(creature.creatureId);
        if (result.success) {
          console.log(`✅ Added ${creature.name} to your team`);
        } else {
          console.error(`❌ Failed to add ${creature.name} to team: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Error adding creature to team:', error);
    } finally {
      setIsLoading(false);
    }
  }, [creature, onAddToTeam, addToTeam, disabled, isLoading, creaturesLoading]);

  const handleRemoveFromTeam = useCallback(async () => {
    if (disabled || isLoading || creaturesLoading) return;

    setIsLoading(true);
    try {
      if (onRemoveFromTeam) {
        onRemoveFromTeam(creature);
      } else {
        const result = await removeFromTeam(creature.creatureId);
        if (result.success) {
          console.log(`✅ Removed ${creature.name} from your team`);
        } else {
          console.error(`❌ Failed to remove ${creature.name} from team: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Error removing creature from team:', error);
    } finally {
      setIsLoading(false);
    }
  }, [creature, onRemoveFromTeam, removeFromTeam, disabled, isLoading, creaturesLoading]);

  const handleRename = useCallback(async () => {
    if (disabled || isLoading || creaturesLoading || !newName.trim()) return;

    setIsLoading(true);
    try {
      if (onRename) {
        onRename({ ...creature, name: newName.trim() });
      } else {
        const result = await renameCreature(creature.creatureId, newName.trim());
        if (result.success) {
          console.log(`✅ Renamed creature to ${newName.trim()}`);
          setShowRenameInput(false);
        } else {
          console.error(`❌ Failed to rename creature: ${result.message}`);
        }
      }
    } catch (error) {
      console.error('Error renaming creature:', error);
    } finally {
      setIsLoading(false);
    }
  }, [creature, newName, onRename, renameCreature, disabled, isLoading, creaturesLoading]);

  // Handle card click (inspect or custom action)
  const handleCardClick = useCallback(() => {
    if (disabled || isLoading) return;

    if (onClick) {
      onClick(creature);
    } else if (onInspect) {
      onInspect(creature);
    } else {
      setIsExpanded(!isExpanded);
    }
  }, [creature, onClick, onInspect, disabled, isLoading, isExpanded]);

  // Get container styles based on size
  const getContainerStyles = () => {
    const base = {
      ...cardStyles.container,
      border: `2px solid ${elementColor.border}`,
      boxShadow: `0 2px 8px rgba(0, 0, 0, 0.1), 0 0 20px ${elementColor.color}20`
    };

    if (size === 'sm') Object.assign(base, cardStyles.containerSm);
    if (size === 'lg') Object.assign(base, cardStyles.containerLg);
    if (disabled) Object.assign(base, cardStyles.containerDisabled);

    return base;
  };

  // Get title styles based on size
  const getTitleStyles = () => {
    const base = { ...cardStyles.title };
    if (size === 'sm') Object.assign(base, cardStyles.titleSm);
    if (size === 'lg') Object.assign(base, cardStyles.titleLg);
    return base;
  };

  // Get avatar styles based on size
  const getAvatarStyles = () => {
    const base = {
      ...cardStyles.avatar,
      borderColor: elementColor.border
    };
    if (size === 'sm') Object.assign(base, cardStyles.avatarSm);
    if (size === 'lg') Object.assign(base, cardStyles.avatarLg);
    return base;
  };

  // Format date display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  // Get available actions based on view mode
  const getAvailableActions = () => {
    const actions = [];

    if (viewMode === 'collection') {
      actions.push(
        { key: 'team', label: 'Add to Team', action: handleAddToTeam, variant: 'primary' as const },
        { key: 'rename', label: 'Rename', action: () => setShowRenameInput(true), variant: 'secondary' as const },
        { key: 'release', label: 'Release', action: handleRelease, variant: 'danger' as const }
      );
    } else if (viewMode === 'team') {
      actions.push(
        { key: 'remove', label: 'Remove', action: handleRemoveFromTeam, variant: 'danger' as const }
      );
    }

    return actions;
  };

  // Get generation badge styling
  const getGenerationBadgeStyle = () => {
    const generation = creature.generation || 0;
    const genColor = generationColors[generation as keyof typeof generationColors] || generationColors[0];

    return {
      ...cardStyles.generationBadge,
      background: genColor.bg,
      color: genColor.color,
      borderColor: genColor.border
    };
  };

  // Check if creature is bred (Gen 1+)
  const isBred = (creature.generation || 0) > 0;

  // Check if creature is mythical rarity
  const isMythical = creature.rarity === 'mythical';

  return (
    <motion.div
      className={className}
      style={getContainerStyles()}
      onClick={handleCardClick}
      whileHover={disabled ? {} : {
        scale: 1.02,
        boxShadow: `0 4px 16px rgba(0, 0, 0, 0.15), 0 0 30px ${elementColor.color}30`
      }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {/* Mythical Aura Effect */}
      {isMythical && (
        <motion.div
          style={{
            ...cardStyles.mythicalAura,
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
            boxShadow: '0 0 40px rgba(236, 72, 153, 0.4), inset 0 0 40px rgba(236, 72, 153, 0.2)'
          }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.02, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      )}

      {/* Bred Creature Indicator */}
      {isBred && (
        <div style={cardStyles.bredIndicator}>
          <span>🧬</span>
          <span>Bred</span>
        </div>
      )}

      {/* Generation Badge */}
      {isBred && (
        <div style={getGenerationBadgeStyle()} title={`Generation ${creature.generation}`}>
          G{creature.generation}
        </div>
      )}

      {/* Content */}
      <div style={cardStyles.content}>
        {/* Header */}
        <div style={cardStyles.header}>
          <div style={cardStyles.titleContainer}>
            {showRenameInput ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    color: '#f4f4f4',
                    fontSize: '0.8rem',
                    outline: 'none',
                    flex: 1
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                  autoFocus
                />
                <button
                  onClick={handleRename}
                  style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    color: '#22c55e',
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                >
                  ✓
                </button>
                <button
                  onClick={() => {
                    setShowRenameInput(false);
                    setNewName(creature.name);
                  }}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '4px',
                    padding: '0.25rem 0.5rem',
                    color: '#ef4444',
                    fontSize: '0.7rem',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <h3 style={getTitleStyles()}>
                  {creature.name}
                </h3>
                <p style={cardStyles.species}>
                  {creature.species} • {creature.creatureType}
                </p>
              </>
            )}
          </div>

          <div style={cardStyles.statusBadges}>
            <div style={cardStyles.levelBadge}>
              Lv. {creature.level}
            </div>
            <div style={{
              ...cardStyles.rarityBadge,
              background: rarityColor.bg,
              color: rarityColor.color,
              borderColor: rarityColor.border
            }}>
              {creature.rarity}
            </div>
            {viewMode === 'bestiary' && !creature.capturedAt && (
              <div style={cardStyles.discoveryBadge}>
                Discovered
              </div>
            )}
            {creature.exhaustionLevel && creature.exhaustionLevel > 0 && (
              <div style={cardStyles.exhaustionBadge} title={`Exhausted: -${creature.exhaustionLevel * 20}% stats`}>
                <span>😴</span>
                <span>×{creature.exhaustionLevel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Avatar */}
        <div style={{
          ...getAvatarStyles(),
          ...(creature.exhaustionLevel && creature.exhaustionLevel > 0 ? cardStyles.exhaustionOverlay : {})
        }}>
          {creature.sprite ? (
            <img
              src={creature.sprite}
              alt={creature.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            <span>{elementEmojis[creature.element]}</span>
          )}
        </div>

        {/* Description */}
        {showDetails && creature.description && (
          <p style={{
            ...cardStyles.description,
            ...(isExpanded ? cardStyles.descriptionExpanded : {})
          }}>
            {creature.description}
          </p>
        )}

        {/* Tags */}
        <div style={cardStyles.tags}>
          <span style={{
            ...cardStyles.tag,
            ...cardStyles.elementTag,
            background: elementColor.bg,
            color: elementColor.color,
            borderColor: elementColor.border
          }}>
            {creature.element}
          </span>
          <span style={{ ...cardStyles.tag, ...cardStyles.sizeTag }}>
            {creature.size}
          </span>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Stats */}
              <div style={cardStyles.stats}>
                <div style={cardStyles.statItem}>
                  <span style={cardStyles.statLabel}>HP</span>
                  <span style={cardStyles.statValue}>{creature.hp}</span>
                </div>
                <div style={cardStyles.statItem}>
                  <span style={cardStyles.statLabel}>ATK</span>
                  <span style={cardStyles.statValue}>
                    {creature.attack}
                    {creature.exhaustionLevel && creature.exhaustionLevel > 0 && (
                      <span style={cardStyles.statPenalty}>
                        (-{creature.exhaustionLevel * 20}%)
                      </span>
                    )}
                  </span>
                </div>
                <div style={cardStyles.statItem}>
                  <span style={cardStyles.statLabel}>DEF</span>
                  <span style={cardStyles.statValue}>
                    {creature.defense}
                    {creature.exhaustionLevel && creature.exhaustionLevel > 0 && (
                      <span style={cardStyles.statPenalty}>
                        (-{creature.exhaustionLevel * 20}%)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Exhaustion Warning */}
              {creature.exhaustionLevel && creature.exhaustionLevel > 0 && (
                <div style={{
                  fontSize: '0.7rem',
                  color: '#ef4444',
                  marginTop: '0.5rem',
                  padding: '0.5rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  <strong>Exhausted:</strong> All stats reduced by {creature.exhaustionLevel * 20}%.
                  Use recovery items or rest to restore.
                </div>
              )}

              {/* Personality */}
              {creature.personality && (
                <div style={cardStyles.personality}>
                  Mood: {creature.personality.mood} •
                  Loyalty: {creature.personality.loyalty}%
                </div>
              )}

              {/* Capture Date */}
              {creature.capturedAt && (
                <div style={cardStyles.captureDate}>
                  Captured: {formatDate(creature.capturedAt)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expand Button */}
        {showDetails && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            style={cardStyles.expandButton}
          >
            {isExpanded ? '▼ Show Less' : '▶ Show More'}
          </button>
        )}

        {/* Actions */}
        {showActions && !disabled && size !== 'sm' && (
          <motion.div
            style={cardStyles.actions}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {getAvailableActions().map((action, index) => (
              <Button
                key={action.key}
                variant={action.variant}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  action.action();
                }}
                disabled={isLoading || creaturesLoading}
                style={action.variant === 'primary' ? cardStyles.primaryAction : cardStyles.actionButton}
              >
                {action.label}
              </Button>
            ))}
          </motion.div>
        )}
      </div>

      {/* Loading Overlay */}
      <AnimatePresence>
        {(isLoading || creaturesLoading) && (
          <motion.div
            style={cardStyles.loadingOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingSpinner size="sm" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CreatureCard;