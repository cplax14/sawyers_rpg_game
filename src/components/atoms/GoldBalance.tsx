import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameState } from '../../hooks/useGameState';
import { PriceTag } from './PriceTag';

export interface GoldBalanceProps {
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Whether to show label text */
  showLabel?: boolean;
  /** Label text to display */
  label?: string;
  /** Additional styling */
  className?: string;
  /** Whether to animate changes */
  animate?: boolean;
}

// Styles for the GoldBalance component
const goldBalanceStyles = {
  container: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(218, 165, 32, 0.1))',
    borderRadius: '12px',
    border: '2px solid rgba(255, 215, 0, 0.3)',
    backdropFilter: 'blur(8px)',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '600' as const,
    color: '#FFD700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  changeIndicator: {
    position: 'absolute' as const,
    top: '-20px',
    right: '0',
    fontSize: '0.75rem',
    fontWeight: 'bold' as const,
    padding: '0.25rem 0.5rem',
    borderRadius: '6px',
    background: 'rgba(0, 0, 0, 0.8)',
    pointerEvents: 'none' as const,
  },
  increase: {
    color: '#22c55e',
  },
  decrease: {
    color: '#ef4444',
  },
  wrapper: {
    position: 'relative' as const,
    display: 'inline-flex',
  },
};

/**
 * GoldBalance - Display player's current gold with real-time updates
 *
 * Kid-friendly component showing gold balance with animated change indicators.
 * Highlights when gold increases (green) or decreases (red) to provide clear feedback.
 *
 * @example
 * ```tsx
 * // Basic usage with default label
 * <GoldBalance />
 *
 * // Custom label and size
 * <GoldBalance label="Your Gold" size="large" />
 *
 * // Without label
 * <GoldBalance showLabel={false} />
 * ```
 */
export const GoldBalance: React.FC<GoldBalanceProps> = ({
  size = 'medium',
  showLabel = true,
  label = 'Gold',
  className = '',
  animate = true,
}) => {
  const { state } = useGameState();

  // Defensive null checks for state and player
  const currentGold = state?.player?.gold ?? 0;

  const [previousGold, setPreviousGold] = useState<number>(currentGold);
  const [goldChange, setGoldChange] = useState<number | null>(null);
  const [showChange, setShowChange] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track gold changes and show animation
  useEffect(() => {
    if (animate && currentGold !== previousGold) {
      const change = currentGold - previousGold;
      setGoldChange(change);
      setShowChange(true);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Hide change indicator after 2 seconds
      timeoutRef.current = setTimeout(() => {
        setShowChange(false);
        setGoldChange(null);
      }, 2000);

      setPreviousGold(currentGold);
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [currentGold, previousGold, animate]);

  // Format change for display
  const formatChange = (change: number): string => {
    if (change > 0) return `+${change.toLocaleString('en-US')}`;
    return change.toLocaleString('en-US');
  };

  // Build aria-live region for screen readers
  const getAriaLive = (): string => {
    if (!goldChange) return `You have ${currentGold} gold`;
    if (goldChange > 0) {
      return `Gold increased by ${goldChange}. You now have ${currentGold} gold`;
    }
    return `Gold decreased by ${Math.abs(goldChange)}. You now have ${currentGold} gold`;
  };

  return (
    <div style={goldBalanceStyles.wrapper}>
      <motion.div
        className={className}
        style={goldBalanceStyles.container}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        role='status'
        aria-live='polite'
        aria-label={getAriaLive()}
      >
        {showLabel && (
          <span style={goldBalanceStyles.label} aria-hidden='true'>
            {label}:
          </span>
        )}

        <PriceTag
          amount={currentGold}
          size={size}
          showIcon={true}
          aria-label={`${currentGold} gold`}
        />
      </motion.div>

      {/* Change Indicator */}
      <AnimatePresence>
        {showChange && goldChange !== null && (
          <motion.div
            style={{
              ...goldBalanceStyles.changeIndicator,
              ...(goldChange > 0 ? goldBalanceStyles.increase : goldBalanceStyles.decrease),
            }}
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            aria-hidden='true'
          >
            {goldChange > 0 ? '↑' : '↓'} {formatChange(goldChange)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoldBalance;
