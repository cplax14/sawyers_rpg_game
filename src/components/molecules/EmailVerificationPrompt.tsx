/**
 * Email Verification Prompt Component
 * Shows email verification status and provides resend functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthResult } from '../../services/authentication';

export interface EmailVerificationPromptProps {
  /** Whether the prompt is displayed as a modal or inline */
  mode?: 'modal' | 'inline';
  /** Custom class name for styling */
  className?: string;
  /** Callback when verification is completed */
  onVerificationComplete?: () => void;
  /** Callback when prompt is dismissed */
  onDismiss?: () => void;
  /** Whether to show the close button */
  showCloseButton?: boolean;
  /** Whether to auto-dismiss on verification */
  autoDismissOnVerification?: boolean;
}

/**
 * Email verification prompt component
 * Shows verification status and allows resending verification emails
 *
 * @example
 * ```tsx
 * function App() {
 *   const { user } = useAuth();
 *   const [showPrompt, setShowPrompt] = useState(false);
 *
 *   useEffect(() => {
 *     if (user && !user.emailVerified) {
 *       setShowPrompt(true);
 *     }
 *   }, [user]);
 *
 *   return (
 *     <div>
 *       {showPrompt && (
 *         <EmailVerificationPrompt
 *           mode="modal"
 *           onVerificationComplete={() => setShowPrompt(false)}
 *           onDismiss={() => setShowPrompt(false)}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const EmailVerificationPrompt: React.FC<EmailVerificationPromptProps> = ({
  mode = 'inline',
  className = '',
  onVerificationComplete,
  onDismiss,
  showCloseButton = true,
  autoDismissOnVerification = true,
}) => {
  const { user, isAuthenticated, resendEmailVerification } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const [lastResendTime, setLastResendTime] = useState<Date | null>(null);

  // Check if verification is needed
  const needsVerification = isAuthenticated && user && !user.emailVerified;

  // Auto-dismiss when email becomes verified
  useEffect(() => {
    if (autoDismissOnVerification && user?.emailVerified && onVerificationComplete) {
      onVerificationComplete();
    }
  }, [user?.emailVerified, autoDismissOnVerification, onVerificationComplete]);

  // Reset states when user changes
  useEffect(() => {
    setResendSuccess(false);
    setResendError(null);
    setResendCount(0);
    setLastResendTime(null);
  }, [user?.uid]);

  // Calculate cooldown for resend button
  const getResendCooldown = useCallback((): number => {
    if (!lastResendTime) return 0;
    const cooldownMinutes = Math.min(5, Math.pow(2, resendCount - 1)); // Exponential backoff, max 5 minutes
    const cooldownMs = cooldownMinutes * 60 * 1000;
    const elapsed = Date.now() - lastResendTime.getTime();
    return Math.max(0, cooldownMs - elapsed);
  }, [lastResendTime, resendCount]);

  const [cooldownTime, setCooldownTime] = useState(getResendCooldown());

  // Update cooldown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const interval = setInterval(() => {
        setCooldownTime(getResendCooldown());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [cooldownTime, getResendCooldown]);

  // Handle resend verification email
  const handleResendVerification = useCallback(async () => {
    if (!user || isResending || cooldownTime > 0) return;

    setIsResending(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const result = await resendEmailVerification();

      if (result.success) {
        setResendSuccess(true);
        setResendCount(prev => prev + 1);
        setLastResendTime(new Date());
      } else {
        setResendError(result.error?.message || 'Failed to resend verification email');
      }
    } catch (error) {
      setResendError(error instanceof Error ? error.message : 'Network error occurred');
    } finally {
      setIsResending(false);
    }
  }, [user, isResending, cooldownTime, resendEmailVerification]);

  // Handle manual verification check
  const handleCheckVerification = useCallback(async () => {
    if (!user) return;

    try {
      await user.reload();
      // The auth state will update automatically through the listener
    } catch (error) {
      console.error('Failed to reload user:', error);
    }
  }, [user]);

  // Format cooldown time
  const formatCooldownTime = useCallback((ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  }, []);

  // Don't render if verification is not needed
  if (!needsVerification) {
    return null;
  }

  const content = (
    <div
      className={`bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 ${className}`}
    >
      {/* Header */}
      <div className='flex items-start justify-between'>
        <div className='flex items-start'>
          <div className='flex-shrink-0'>
            <svg
              className='w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5'
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3 flex-1'>
            <h3 className='text-sm font-medium text-yellow-800 dark:text-yellow-200'>
              Email Verification Required
            </h3>
            <div className='mt-1 text-sm text-yellow-700 dark:text-yellow-300'>
              <p>
                Please verify your email address ({user?.email}) to access all features. Check your
                inbox for a verification email.
              </p>
            </div>
          </div>
        </div>
        {showCloseButton && onDismiss && (
          <button
            onClick={onDismiss}
            className='flex-shrink-0 ml-3 text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-200'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        )}
      </div>

      {/* Success message */}
      {resendSuccess && (
        <div className='mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md'>
          <div className='flex'>
            <svg className='w-5 h-5 text-green-400' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            <div className='ml-2'>
              <p className='text-sm text-green-800 dark:text-green-200'>
                Verification email sent! Check your inbox and spam folder.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {resendError && (
        <div className='mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md'>
          <div className='flex'>
            <svg className='w-5 h-5 text-red-400' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                clipRule='evenodd'
              />
            </svg>
            <div className='ml-2'>
              <p className='text-sm text-red-800 dark:text-red-200'>{resendError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className='mt-4 flex flex-wrap gap-2'>
        <button
          onClick={handleResendVerification}
          disabled={isResending || cooldownTime > 0}
          className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-800/30 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
        >
          {isResending ? (
            <>
              <svg
                className='animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-600'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              Sending...
            </>
          ) : cooldownTime > 0 ? (
            `Resend in ${formatCooldownTime(cooldownTime)}`
          ) : (
            <>
              <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                />
              </svg>
              Resend Email
            </>
          )}
        </button>

        <button
          onClick={handleCheckVerification}
          className='inline-flex items-center px-3 py-2 border border-yellow-300 dark:border-yellow-600 text-sm leading-4 font-medium rounded-md text-yellow-800 dark:text-yellow-200 bg-transparent hover:bg-yellow-100 dark:hover:bg-yellow-800/30 transition-colors duration-200'
        >
          <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
            />
          </svg>
          I've Verified
        </button>
      </div>

      {/* Additional help text */}
      <div className='mt-3 text-xs text-yellow-600 dark:text-yellow-400'>
        <p>
          Didn't receive the email? Check your spam folder or try resending.
          {resendCount > 0 && ` (Sent ${resendCount} time${resendCount !== 1 ? 's' : ''})`}
        </p>
      </div>
    </div>
  );

  // Render as modal if requested
  if (mode === 'modal') {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6'>
          <div className='mb-4'>
            <h2 className='text-xl font-bold text-gray-900 dark:text-white mb-2'>
              Email Verification
            </h2>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default EmailVerificationPrompt;
