import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import styles from './Button.module.css';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  /** Button content */
  children: React.ReactNode;
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Icon to display before the text */
  iconBefore?: React.ReactNode;
  /** Icon to display after the text */
  iconAfter?: React.ReactNode;
  /** Full width button */
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      iconBefore,
      iconAfter,
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const buttonClasses = [
      styles.button,
      styles[variant],
      styles[size],
      loading && styles.loading,
      disabled && styles.disabled,
      fullWidth && styles.fullWidth,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const buttonContent = (
      <>
        {iconBefore && <span className={styles.iconBefore}>{iconBefore}</span>}
        {loading && <span className={styles.spinner} />}
        <span className={styles.content}>{children}</span>
        {iconAfter && <span className={styles.iconAfter}>{iconAfter}</span>}
      </>
    );

    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        {...props}
      >
        {buttonContent}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };