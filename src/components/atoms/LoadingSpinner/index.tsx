import React from 'react';
// import styles from './LoadingSpinner.module.css'; // Temporarily disabled due to PostCSS parsing issues

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  message,
  className = ''
}) => {
  return (
    <div className={`${styles.loadingContainer} ${styles[size]} ${className}`}>
      <div className={styles.spinner} aria-hidden="true">
        <div className={styles.spinnerInner}></div>
      </div>
      {message && (
        <p className={styles.message} aria-live="polite">
          {message}
        </p>
      )}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;