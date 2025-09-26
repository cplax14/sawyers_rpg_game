/**
 * Authentication Modal Component
 * Modal for user login, registration, and password reset
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthError, AuthResult } from '../../services/authentication';

export type AuthMode = 'signin' | 'signup' | 'reset';

export interface AuthenticationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onSuccess?: (mode: AuthMode, result?: AuthResult) => void;
  onError?: (error: AuthError) => void;
  className?: string;
  disableBackdropClose?: boolean;
  /** Whether to keep modal open after successful signup if email verification is required */
  keepOpenForVerification?: boolean;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
  general?: string;
}

const initialFormData: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  displayName: ''
};

/**
 * Authentication modal with login, registration, and password reset
 *
 * @example
 * ```tsx
 * function App() {
 *   const [showAuth, setShowAuth] = useState(false);
 *
 *   return (
 *     <div>
 *       <button onClick={() => setShowAuth(true)}>Sign In</button>
 *       <AuthenticationModal
 *         isOpen={showAuth}
 *         onClose={() => setShowAuth(false)}
 *         onSuccess={(mode) => {
 *           console.log(`${mode} successful`);
 *           setShowAuth(false);
 *         }}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const AuthenticationModal: React.FC<AuthenticationModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
  onSuccess,
  onError,
  className = '',
  disableBackdropClose = false,
  keepOpenForVerification = false
}) => {
  const {
    signIn,
    signUp,
    sendPasswordReset,
    isLoading,
    error: authError,
    clearError
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setFormErrors({});
      setShowPassword(false);
      setIsSubmitting(false);
      setResetEmailSent(false);
      clearError();
    }
  }, [isOpen, mode, clearError]);

  // Update mode when initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);

  // Form validation
  const validateForm = useCallback((): FormErrors => {
    const errors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation (not needed for reset mode)
    if (mode !== 'reset') {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }

      // Confirm password validation (only for signup)
      if (mode === 'signup') {
        if (!formData.confirmPassword) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }

        // Display name validation
        if (!formData.displayName) {
          errors.displayName = 'Display name is required';
        } else if (formData.displayName.length < 2) {
          errors.displayName = 'Display name must be at least 2 characters';
        }
      }
    }

    return errors;
  }, [formData, mode]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [formErrors]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      let result;

      switch (mode) {
        case 'signin':
          result = await signIn(formData.email, formData.password);
          break;
        case 'signup':
          result = await signUp(formData.email, formData.password, formData.displayName);
          break;
        case 'reset':
          result = await sendPasswordReset(formData.email);
          if (result.success) {
            setResetEmailSent(true);
          }
          break;
        default:
          throw new Error(`Unknown auth mode: ${mode}`);
      }

      if (result.success) {
        onSuccess?.(mode, result);

        // Handle modal closing logic
        if (mode === 'reset') {
          // Keep modal open for reset to show success message
          return;
        } else if (mode === 'signup' && result.requiresEmailVerification && keepOpenForVerification) {
          // Keep modal open if signup requires verification and flag is set
          return;
        } else {
          // Close modal for other successful operations
          onClose();
        }
      } else {
        const error = result.error!;
        setFormErrors({ general: error.message });
        onError?.(error);
      }
    } catch (error) {
      const authError: AuthError = {
        code: 'unknown',
        message: error instanceof Error ? error.message : 'An unexpected error occurred'
      };
      setFormErrors({ general: authError.message });
      onError?.(authError);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, mode, validateForm, signIn, signUp, sendPasswordReset, onSuccess, onError, onClose]);

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

  // Modal content based on mode
  const modalContent = useMemo(() => {
    switch (mode) {
      case 'signin':
        return {
          title: 'Sign In',
          submitLabel: 'Sign In',
          switchText: "Don't have an account?",
          switchLabel: 'Sign Up',
          switchMode: 'signup' as AuthMode
        };
      case 'signup':
        return {
          title: 'Create Account',
          submitLabel: 'Create Account',
          switchText: 'Already have an account?',
          switchLabel: 'Sign In',
          switchMode: 'signin' as AuthMode
        };
      case 'reset':
        return {
          title: 'Reset Password',
          submitLabel: 'Send Reset Email',
          switchText: 'Remember your password?',
          switchLabel: 'Sign In',
          switchMode: 'signin' as AuthMode
        };
      default:
        return {
          title: 'Authentication',
          submitLabel: 'Submit',
          switchText: '',
          switchLabel: '',
          switchMode: 'signin' as AuthMode
        };
    }
  }, [mode]);

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
            {modalContent.title}
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

        {/* Reset email sent message */}
        {mode === 'reset' && resetEmailSent && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Email sent!
                </h3>
                <div className="mt-1 text-sm text-green-700 dark:text-green-300">
                  Check your email for password reset instructions.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Email field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                formErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your email"
              disabled={isSubmitting}
              autoComplete="email"
            />
            {formErrors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.email}</p>
            )}
          </div>

          {/* Display name field (signup only) */}
          {mode === 'signup' && (
            <div className="mb-4">
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  formErrors.displayName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your display name"
                disabled={isSubmitting}
                autoComplete="name"
              />
              {formErrors.displayName && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.displayName}</p>
              )}
            </div>
          )}

          {/* Password field (not for reset) */}
          {mode !== 'reset' && (
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.password}</p>
              )}
            </div>
          )}

          {/* Confirm password field (signup only) */}
          {mode === 'signup' && (
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm your password"
                disabled={isSubmitting}
                autoComplete="new-password"
              />
              {formErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.confirmPassword}</p>
              )}
            </div>
          )}

          {/* General error */}
          {(formErrors.general || authError) && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-200">
                {formErrors.general || authError?.message}
              </p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
          >
            {(isSubmitting || isLoading) ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              modalContent.submitLabel
            )}
          </button>

          {/* Mode switching */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {modalContent.switchText}{' '}
              <button
                type="button"
                onClick={() => setMode(modalContent.switchMode)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                disabled={isSubmitting}
              >
                {modalContent.switchLabel}
              </button>
            </p>

            {/* Forgot password link for signin mode */}
            {mode === 'signin' && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  disabled={isSubmitting}
                >
                  Forgot your password?
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthenticationModal;