import React, { forwardRef, useState } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { inputStyles } from '../../utils/temporaryStyles';
// import styles from './Input.module.css'; // Temporarily disabled due to PostCSS parsing issues

// Use temporary fallback styles to prevent JavaScript errors
const styles = inputStyles;

export interface InputProps extends Omit<HTMLMotionProps<'input'>, 'children' | 'size'> {
  /** Input label */
  label?: string;
  /** Helper text shown below input */
  helperText?: string;
  /** Error message - when present, shows error state */
  error?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Input variant */
  variant?: 'default' | 'search' | 'password';
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Icon to display before the input */
  iconBefore?: React.ReactNode;
  /** Icon to display after the input */
  iconAfter?: React.ReactNode;
  /** Full width input */
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      required = false,
      variant = 'default',
      size = 'md',
      iconBefore,
      iconAfter,
      fullWidth = false,
      className = '',
      disabled = false,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const hasError = Boolean(error);
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const containerClasses = [
      styles.container,
      fullWidth && styles.fullWidth,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      styles.input,
      styles[variant],
      styles[size],
      hasError && styles.error,
      disabled && styles.disabled,
      focused && styles.focused,
      iconBefore && styles.hasIconBefore,
      iconAfter && styles.hasIconAfter,
    ]
      .filter(Boolean)
      .join(' ');

    const inputType = variant === 'password' && showPassword ? 'text' :
                      variant === 'password' ? 'password' : type;

    const handleTogglePassword = () => {
      if (variant === 'password') {
        setShowPassword(!showPassword);
      }
    };

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
            {required && <span className={styles.required} aria-label="required">*</span>}
          </label>
        )}

        <div className={styles.inputWrapper}>
          {iconBefore && (
            <span className={styles.iconBefore} aria-hidden="true">
              {iconBefore}
            </span>
          )}

          <motion.input
            ref={ref}
            id={inputId}
            type={inputType}
            className={inputClasses}
            disabled={disabled}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            aria-invalid={hasError}
            aria-describedby={
              hasError ? `${inputId}-error` :
              helperText ? `${inputId}-helper` : undefined
            }
            whileFocus={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            {...props}
          />

          {variant === 'password' && (
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={handleTogglePassword}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? '👁️‍🗨️' : '👁️'}
            </button>
          )}

          {iconAfter && variant !== 'password' && (
            <span className={styles.iconAfter} aria-hidden="true">
              {iconAfter}
            </span>
          )}
        </div>

        {hasError && (
          <div id={`${inputId}-error`} className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}

        {helperText && !hasError && (
          <div id={`${inputId}-helper`} className={styles.helperText}>
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };