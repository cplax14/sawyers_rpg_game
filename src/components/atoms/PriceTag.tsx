import React from 'react';
import { motion } from 'framer-motion';

export interface PriceTagProps {
  /** Gold amount to display */
  amount: number;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show the gold icon */
  showIcon?: boolean;
  /** Whether the player can afford this amount */
  canAfford?: boolean;
  /** Additional styling */
  className?: string;
  /** Custom aria label for accessibility */
  'aria-label'?: string;
}

// Styles for the PriceTag component
const priceTagStyles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontFamily: 'inherit',
    fontWeight: 'bold' as const,
  },
  small: {
    fontSize: '0.75rem',
    gap: '0.2rem',
  },
  medium: {
    fontSize: '1rem',
    gap: '0.25rem',
  },
  large: {
    fontSize: '1.25rem',
    gap: '0.3rem',
  },
  canAfford: {
    color: '#22c55e', // Green for affordable
  },
  cannotAfford: {
    color: '#ef4444', // Red for unaffordable
  },
  neutral: {
    color: '#FFD700', // Gold color for neutral
  },
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSmall: {
    fontSize: '0.875rem',
  },
  iconMedium: {
    fontSize: '1.125rem',
  },
  iconLarge: {
    fontSize: '1.5rem',
  },
};

/**
 * PriceTag - Display gold prices with icon and formatting
 *
 * Kid-friendly component showing gold amounts with clear affordability indicators.
 * Uses color-coding to help children understand if they can afford items.
 *
 * @example
 * ```tsx
 * // Show affordable price
 * <PriceTag amount={100} canAfford={true} />
 *
 * // Show unaffordable price
 * <PriceTag amount={1000} canAfford={false} size="large" />
 *
 * // Hide icon
 * <PriceTag amount={500} showIcon={false} />
 * ```
 */
export const PriceTag: React.FC<PriceTagProps> = ({
  amount,
  size = 'medium',
  showIcon = true,
  canAfford,
  className = '',
  'aria-label': ariaLabel,
}) => {
  // Format number with commas for thousands (e.g., 1,000)
  const formatGold = (value: number): string => {
    return value.toLocaleString('en-US');
  };

  // Determine color based on affordability
  const getColorStyle = () => {
    if (canAfford === true) return priceTagStyles.canAfford;
    if (canAfford === false) return priceTagStyles.cannotAfford;
    return priceTagStyles.neutral;
  };

  // Get size styles
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return priceTagStyles.small;
      case 'large':
        return priceTagStyles.large;
      default:
        return priceTagStyles.medium;
    }
  };

  // Get icon size
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return priceTagStyles.iconSmall;
      case 'large':
        return priceTagStyles.iconLarge;
      default:
        return priceTagStyles.iconMedium;
    }
  };

  // Build comprehensive aria-label for screen readers
  const getAriaLabel = (): string => {
    if (ariaLabel) return ariaLabel;

    const formattedAmount = `${amount} gold`;
    if (canAfford === true) return `${formattedAmount} - You can afford this`;
    if (canAfford === false) return `${formattedAmount} - You cannot afford this`;
    return formattedAmount;
  };

  return (
    <motion.span
      className={className}
      style={{
        ...priceTagStyles.container,
        ...getSizeStyles(),
        ...getColorStyle(),
      }}
      aria-label={getAriaLabel()}
      role='text'
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {showIcon && (
        <span
          style={{
            ...priceTagStyles.icon,
            ...getIconSize(),
          }}
          aria-hidden='true'
        >
          💰
        </span>
      )}
      <span>{formatGold(amount)}</span>
    </motion.span>
  );
};

export default PriceTag;
