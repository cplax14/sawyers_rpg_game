/**
 * Password Reset Modal Component
 * Standalone modal for password reset functionality
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthError } from '../../services/authentication';

export interface PasswordResetModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to close the modal */
  onClose: () => void;
  /** Initial email address to populate */
  initialEmail?: string;
  /** Success callback */
  onSuccess?: (email: string) => void;
  /** Error callback */
  onError?: (error: AuthError) => void;
  /** Custom class name */
  className?: string;
  /** Whether to disable backdrop close */
  disableBackdropClose?: boolean;
}

/**
 * Password reset modal with email input and confirmation
 *
 * @example
 * ```tsx
 * function LoginPage() {
 *   const [showReset, setShowReset] = useState(false);
 *   const [userEmail, setUserEmail] = useState('');
 *
 *   return (
 *     <div>
 *       <button onClick={() => setShowReset(true)}>
 *         Forgot Password?
 *       </button>
 *
 *       <PasswordResetModal
 *         isOpen={showReset}
 *         onClose={() => setShowReset(false)}
 *         initialEmail={userEmail}
 *         onSuccess={(email) => {
 *           console.log(`Reset email sent to ${email}`);
 *           setShowReset(false);
 *         }}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccess,
  onError,
  className = '',
  disableBackdropClose = false
}) => {
  const { sendPasswordReset, isLoading } = useAuth();

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setError(null);
      setIsSubmitting(false);
      setResetSent(false);
      setCooldownTime(0);
    }
  }, [isOpen, initialEmail]);

  // Cooldown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Email address is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (cooldownTime > 0) {
      setError(`Please wait ${cooldownTime} seconds before requesting another reset`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await sendPasswordReset(email);

      if (result.success) {
        setResetSent(true);
        setCooldownTime(60); // 60 second cooldown
        onSuccess?.(email);
      } else {
        const errorMessage = result.error?.message || 'Failed to send password reset email';
        setError(errorMessage);
        onError?.(result.error!);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      setError(errorMessage);
      onError?.({
        code: 'unknown',
        message: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [email, cooldownTime, sendPasswordReset, onSuccess, onError]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !disableBackdropClose) {
      onClose();
    }
  }, [onClose, disableBackdropClose]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !disableBackdropClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, disableBackdropClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success State */}
        {resetSent ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Check Your Email
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              We've sent a password reset link to <strong>{email}</strong>.
              Check your inbox and click the link to reset your password.
            </p>
            <div className="space-y-3">
              <button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Done
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Didn't receive the email? Check your spam folder or try again in {cooldownTime > 0 ? `${cooldownTime} seconds` : 'a moment'}.
              </p>
            </div>
          </div>
        ) : (
          /* Form State */
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="reset-email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  error ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email address"
                disabled={isSubmitting}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="ml-3 text-sm text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting || cooldownTime > 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : cooldownTime > 0 ? (
                `Try again in ${cooldownTime}s`
              ) : (
                'Send Reset Link'
              )}
            </button>

            {/* Back to login */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                disabled={isSubmitting}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* Help text */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Having trouble? The reset link will expire in 1 hour. Make sure to check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;