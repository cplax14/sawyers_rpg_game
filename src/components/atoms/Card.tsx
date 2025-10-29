import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cardStyles } from '../../utils/temporaryStyles';
// import styles from './Card.module.css'; // Temporarily disabled due to PostCSS parsing issues

// Use temporary fallback styles to prevent JavaScript errors
const styles = cardStyles;

export interface CardProps extends HTMLMotionProps<'div'> {
  /** Card content */
  children: React.ReactNode;
  /** Visual style variant */
  variant?: 'default' | 'character' | 'area' | 'elevated';
  /** Whether the card is interactive (clickable/hoverable) */
  interactive?: boolean;
  /** Whether the card is in selected state */
  selected?: boolean;
  /** Whether the card should have a glow effect on hover */
  glow?: boolean;
  /** Custom padding */
  padding?: 'sm' | 'md' | 'lg';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      interactive = false,
      selected = false,
      glow = false,
      padding = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const cardClasses = [
      styles.card,
      styles[variant],
      styles[padding],
      interactive && styles.interactive,
      selected && styles.selected,
      glow && styles.glow,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const motionProps = interactive
      ? {
          whileHover: { scale: 1.02, y: -4 },
          whileTap: { scale: 0.98 },
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }
      : {};

    return (
      <motion.div
        ref={ref}
        className={cardClasses}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        {...motionProps}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export { Card };
