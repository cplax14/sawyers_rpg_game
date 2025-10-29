import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShopkeeperMood } from '../../types/shop';

export interface ShopkeeperDialogProps {
  /** Shopkeeper's name */
  shopkeeper: string;
  /** Message to display */
  message: string;
  /** Shopkeeper's mood affecting appearance */
  mood?: ShopkeeperMood;
  /** Avatar/icon for the shopkeeper */
  avatar?: string;
  /** Additional className */
  className?: string;
}

// Styles for ShopkeeperDialog
const shopkeeperDialogStyles = {
  container: {
    display: 'flex',
    gap: '1rem',
    padding: '1rem',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(99, 102, 241, 0.05))',
    borderRadius: '16px',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    backdropFilter: 'blur(8px)',
    alignItems: 'flex-start',
  },
  happy: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05))',
    border: '2px solid rgba(34, 197, 94, 0.3)',
  },
  excited: {
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.05))',
    border: '2px solid rgba(245, 158, 11, 0.3)',
  },
  grumpy: {
    background: 'linear-gradient(135deg, rgba(107, 114, 128, 0.1), rgba(75, 85, 99, 0.05))',
    border: '2px solid rgba(107, 114, 128, 0.3)',
  },
  avatarContainer: {
    flexShrink: 0,
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(99, 102, 241, 0.1))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    border: '2px solid rgba(139, 92, 246, 0.4)',
  },
  contentContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  nameTag: {
    fontSize: '0.875rem',
    fontWeight: 'bold' as const,
    color: '#a78bfa',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: 0,
  },
  speechBubble: {
    position: 'relative' as const,
    padding: '0.75rem 1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  speechBubbleArrow: {
    position: 'absolute' as const,
    left: '-8px',
    top: '12px',
    width: 0,
    height: 0,
    borderTop: '8px solid transparent',
    borderBottom: '8px solid transparent',
    borderRight: '8px solid rgba(255, 255, 255, 0.1)',
  },
  message: {
    fontSize: '0.9375rem',
    color: '#e2e8f0',
    lineHeight: 1.5,
    margin: 0,
  },
  moodIndicator: {
    display: 'inline-block',
    marginRight: '0.5rem',
    fontSize: '1rem',
  },
};

// Mood emoji mapping
const moodEmojis: Record<ShopkeeperMood, string> = {
  happy: '😊',
  neutral: '🙂',
  grumpy: '😠',
  excited: '🤩',
  helpful: '🤗',
};

// Default avatars by mood
const defaultAvatars: Record<ShopkeeperMood, string> = {
  happy: '🧙',
  neutral: '🧑‍💼',
  grumpy: '👴',
  excited: '🧑‍🔬',
  helpful: '👩‍⚕️',
};

/**
 * ShopkeeperDialog - Display NPC shopkeeper dialogue
 *
 * Kid-friendly dialogue box showing shopkeeper messages with personality.
 * Uses speech bubble pattern with mood-based styling and avatars.
 *
 * @example
 * ```tsx
 * // Happy shopkeeper greeting
 * <ShopkeeperDialog
 *   shopkeeper="Rosie"
 *   message="Welcome to my shop! How can I help you today?"
 *   mood="happy"
 * />
 *
 * // Grumpy shopkeeper
 * <ShopkeeperDialog
 *   shopkeeper="Grumpy Gus"
 *   message="What do you want? Make it quick!"
 *   mood="grumpy"
 *   avatar="👨"
 * />
 * ```
 */
export const ShopkeeperDialog: React.FC<ShopkeeperDialogProps> = ({
  shopkeeper,
  message,
  mood = 'neutral',
  avatar,
  className = '',
}) => {
  // Get mood-specific styles
  const getMoodStyles = () => {
    switch (mood) {
      case 'happy':
        return shopkeeperDialogStyles.happy;
      case 'excited':
        return shopkeeperDialogStyles.excited;
      case 'grumpy':
        return shopkeeperDialogStyles.grumpy;
      default:
        return {};
    }
  };

  // Get avatar to display
  const displayAvatar = useMemo(() => {
    return avatar || defaultAvatars[mood];
  }, [avatar, mood]);

  // Get mood emoji
  const moodEmoji = moodEmojis[mood];

  // Build accessible label
  const getAriaLabel = (): string => {
    return `${shopkeeper} says: ${message}`;
  };

  return (
    <motion.div
      className={className}
      style={{
        ...shopkeeperDialogStyles.container,
        ...getMoodStyles(),
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      role='region'
      aria-label={getAriaLabel()}
      aria-live='polite'
    >
      {/* Avatar */}
      <div style={shopkeeperDialogStyles.avatarContainer} aria-hidden='true'>
        {displayAvatar}
      </div>

      {/* Content */}
      <div style={shopkeeperDialogStyles.contentContainer}>
        {/* Name Tag */}
        <p style={shopkeeperDialogStyles.nameTag}>{shopkeeper}</p>

        {/* Speech Bubble */}
        <div style={shopkeeperDialogStyles.speechBubble}>
          <div style={shopkeeperDialogStyles.speechBubbleArrow} />
          <p style={shopkeeperDialogStyles.message}>
            <span style={shopkeeperDialogStyles.moodIndicator} aria-hidden='true'>
              {moodEmoji}
            </span>
            {message}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ShopkeeperDialog;
