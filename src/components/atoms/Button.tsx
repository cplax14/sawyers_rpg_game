import React, { forwardRef, memo } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
// import styles from './Button.module.css'; // Temporarily disabled due to PostCSS parsing issues

// Temporary fallback styles while CSS modules are disabled
const createButtonStyles = () => {
  const buttonClasses = [
    'button',
    'primary',
    'secondary',
    'danger',
    'success',
    'sm',
    'md',
    'lg',
    'loading',
    'disabled',
    'fullWidth',
    'spinner',
    'content',
    'iconBefore',
    'iconAfter',
  ];
  const styles: Record<string, string> = {};
  buttonClasses.forEach(className => {
    const cssClass = className.replace(/([A-Z])/g, '-$1').toLowerCase();
    styles[className] = `btn-${cssClass}`;
  });
  return styles;
};

const styles = createButtonStyles();

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
  /** Touch-friendly mode (increases touch targets on mobile) */
  touchFriendly?: boolean;
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
      touchFriendly = true, // Default to touch-friendly
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    // Detect if user is on a touch device
    const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window;

    const buttonClasses = [
      styles.button,
      styles[variant],
      styles[size],
      loading && styles.loading,
      disabled && styles.disabled,
      fullWidth && styles.fullWidth,
      touchFriendly && 'touch-friendly',
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

    // Mobile-optimized touch target styles
    const mobileStyles =
      touchFriendly && isTouchDevice
        ? {
            minHeight: '48px',
            minWidth: '48px',
            padding: size === 'sm' ? '8px 16px' : size === 'lg' ? '16px 24px' : '12px 20px',
            fontSize: size === 'sm' ? '14px' : size === 'lg' ? '18px' : '16px',
            touchAction: 'manipulation', // Prevents zoom on double-tap
            WebkitTapHighlightColor: 'transparent', // Remove iOS highlight
          }
        : {};

    return (
      <motion.button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        style={{ ...mobileStyles, ...style }}
        whileHover={
          !isTouchDevice
            ? {
                scale: 1.02,
                y: -2,
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.4)',
              }
            : undefined
        } // Only hover on non-touch devices
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        {...props}
      >
        {buttonContent}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// Optimize for mobile performance with memo
const MemoizedButton = memo(Button, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.children === nextProps.children &&
    prevProps.variant === nextProps.variant &&
    prevProps.size === nextProps.size &&
    prevProps.loading === nextProps.loading &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.touchFriendly === nextProps.touchFriendly &&
    prevProps.className === nextProps.className
  );
});

MemoizedButton.displayName = 'MemoizedButton';

export { MemoizedButton as Button };
