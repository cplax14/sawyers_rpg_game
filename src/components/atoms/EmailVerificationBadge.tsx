/**
 * Email Verification Badge Component
 * Simple badge showing email verification status
 */

import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export interface EmailVerificationBadgeProps {
  /** Size of the badge */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show text or just icon */
  showText?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom verified text */
  verifiedText?: string;
  /** Custom unverified text */
  unverifiedText?: string;
}

/**
 * Email verification status badge
 * Shows a checkmark for verified emails or warning icon for unverified
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   return (
 *     <div className="flex items-center gap-2">
 *       <span>user@example.com</span>
 *       <EmailVerificationBadge size="sm" showText={true} />
 *     </div>
 *   );
 * }
 * ```
 */
export const EmailVerificationBadge: React.FC<EmailVerificationBadgeProps> = ({
  size = 'md',
  showText = false,
  className = '',
  verifiedText = 'Verified',
  unverifiedText = 'Unverified'
}) => {
  const { user, isAuthenticated } = useAuth();

  // Don't render if user is not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const isVerified = user.emailVerified;

  // Size classes
  const sizeClasses = {
    sm: {
      icon: 'w-3 h-3',
      text: 'text-xs',
      padding: 'px-1.5 py-0.5'
    },
    md: {
      icon: 'w-4 h-4',
      text: 'text-sm',
      padding: 'px-2 py-1'
    },
    lg: {
      icon: 'w-5 h-5',
      text: 'text-base',
      padding: 'px-3 py-1.5'
    }
  }[size];

  // Color classes based on verification status
  const colorClasses = isVerified
    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${sizeClasses.padding}
        ${sizeClasses.text}
        ${colorClasses}
        ${className}
      `}
      title={isVerified ? 'Email address is verified' : 'Email address needs verification'}
    >
      {/* Icon */}
      {isVerified ? (
        <svg className={sizeClasses.icon} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className={sizeClasses.icon} fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      )}

      {/* Text */}
      {showText && (
        <span>{isVerified ? verifiedText : unverifiedText}</span>
      )}
    </span>
  );
};

export default EmailVerificationBadge;