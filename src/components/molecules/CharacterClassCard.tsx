import React from 'react';
import { motion } from 'framer-motion';
import { Card, Button, Tooltip } from '../atoms';
import { characterClassCardStyles } from '../../utils/temporaryStyles';
// import styles from './CharacterClassCard.module.css'; // Temporarily disabled due to PostCSS parsing issues

// Use temporary fallback styles to prevent JavaScript errors
const styles = characterClassCardStyles;

export interface CharacterClass {
  id: string;
  name: string;
  description: string;
  baseStats: {
    hp: number;
    mp: number;
    attack: number;
    defense: number;
    magicAttack: number;
    magicDefense: number;
    speed: number;
    accuracy: number;
  };
  weaponTypes: string[];
  startingSpells: string[];
  spellAffinities: string[];
  classBonus: string;
}

export interface CharacterClassCardProps {
  /** Character class data */
  characterClass: CharacterClass;
  /** Whether this class is selected */
  selected?: boolean;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Called when the card is clicked */
  onClick?: (characterClass: CharacterClass) => void;
  /** Custom className */
  className?: string;
  /** Show detailed stats */
  showDetailedStats?: boolean;
  /** Show class bonus */
  showClassBonus?: boolean;
  /** Animation variant */
  variant?: 'default' | 'compact';
}

const CharacterClassCard: React.FC<CharacterClassCardProps> = ({
  characterClass,
  selected = false,
  disabled = false,
  onClick,
  className = '',
  showDetailedStats = true,
  showClassBonus = true,
  variant = 'default',
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(characterClass);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  const cardClasses = [
    styles.characterCard,
    styles[variant],
    selected && styles.selected,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Calculate primary stats for display
  const primaryStats = [
    { label: 'HP', value: characterClass.baseStats.hp, icon: '❤️' },
    { label: 'MP', value: characterClass.baseStats.mp, icon: '💧' },
    { label: 'ATK', value: characterClass.baseStats.attack, icon: '⚔️' },
    { label: 'DEF', value: characterClass.baseStats.defense, icon: '🛡️' },
  ];

  const secondaryStats = [
    { label: 'M.ATK', value: characterClass.baseStats.magicAttack, icon: '🔮' },
    { label: 'M.DEF', value: characterClass.baseStats.magicDefense, icon: '✨' },
    { label: 'SPD', value: characterClass.baseStats.speed, icon: '💨' },
    { label: 'ACC', value: characterClass.baseStats.accuracy, icon: '🎯' },
  ];

  return (
    <motion.div
      className={cardClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role='button'
      aria-pressed={selected}
      aria-disabled={disabled}
      aria-label={`Select ${characterClass.name} class`}
      whileHover={!disabled ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        variant='character'
        size='md'
        interactive={!disabled}
        selected={selected}
        className={styles.cardInner}
      >
        {/* Header with class name and description */}
        <div className={styles.header}>
          <h3 className={styles.className}>{characterClass.name}</h3>
          <p className={styles.description}>{characterClass.description}</p>
        </div>

        {/* Primary stats */}
        <div className={styles.statsSection}>
          <h4 className={styles.sectionTitle}>Primary Stats</h4>
          <div className={styles.statGrid}>
            {primaryStats.map(stat => (
              <div key={stat.label} className={styles.statItem}>
                <span className={styles.statIcon} role='img' aria-label={stat.label}>
                  {stat.icon}
                </span>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary stats (optional detailed view) */}
        {showDetailedStats && (
          <div className={styles.statsSection}>
            <h4 className={styles.sectionTitle}>Secondary Stats</h4>
            <div className={styles.statGrid}>
              {secondaryStats.map(stat => (
                <div key={stat.label} className={styles.statItem}>
                  <span className={styles.statIcon} role='img' aria-label={stat.label}>
                    {stat.icon}
                  </span>
                  <span className={styles.statLabel}>{stat.label}</span>
                  <span className={styles.statValue}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Abilities */}
        <div className={styles.abilitiesSection}>
          <h4 className={styles.sectionTitle}>Starting Abilities</h4>
          <div className={styles.abilityList}>
            {characterClass.startingSpells.map(spell => (
              <Tooltip key={spell} content={`Starting spell: ${spell}`}>
                <span className={styles.abilityTag}>{spell.replace('_', ' ')}</span>
              </Tooltip>
            ))}
          </div>
        </div>

        {/* Weapon types */}
        <div className={styles.weaponsSection}>
          <h4 className={styles.sectionTitle}>Weapon Proficiency</h4>
          <div className={styles.weaponList}>
            {characterClass.weaponTypes.map(weapon => (
              <span key={weapon} className={styles.weaponTag}>
                {weapon.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Class bonus */}
        {showClassBonus && (
          <div className={styles.bonusSection}>
            <h4 className={styles.sectionTitle}>Class Bonus</h4>
            <p className={styles.bonusText}>{characterClass.classBonus}</p>
          </div>
        )}

        {/* Selection indicator */}
        {selected && (
          <motion.div
            className={styles.selectionIndicator}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <span className={styles.checkmark} role='img' aria-label='Selected'>
              ✓
            </span>
          </motion.div>
        )}

        {/* Action button */}
        <div className={styles.actions}>
          <Button
            variant={selected ? 'success' : 'primary'}
            fullWidth
            disabled={disabled}
            onClick={e => {
              e.stopPropagation();
              handleClick();
            }}
          >
            {selected ? 'Selected' : 'Choose Class'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

CharacterClassCard.displayName = 'CharacterClassCard';

export { CharacterClassCard };
