/**
 * Email Verification Flow Component
 * Manages the complete email verification flow including signup and verification prompts
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthenticationModal, AuthMode } from '../molecules/AuthenticationModal';
import { EmailVerificationPrompt } from '../molecules/EmailVerificationPrompt';
import { AuthResult } from '../../services/authentication';

export type EmailVerificationFlowState =
  | 'idle'           // No verification flow active
  | 'signup'         // User is signing up
  | 'verification'   // User needs to verify email
  | 'verified'       // Email has been verified
  | 'error';         // Error occurred

export interface EmailVerificationFlowProps {
  /** Whether to show the flow initially */
  isOpen?: boolean;
  /** Callback when the entire flow completes successfully */
  onComplete?: () => void;
  /** Callback when flow is cancelled or closed */
  onCancel?: () => void;
  /** Callback for flow state changes */
  onStateChange?: (state: EmailVerificationFlowState) => void;
  /** Custom class name */
  className?: string;
  /** Whether to auto-start with signup modal */
  autoStartSignup?: boolean;
  /** Whether verification is required to complete flow */
  requireVerification?: boolean;
  /** Custom messages for different states */
  messages?: {
    signupSuccess?: string;
    verificationSent?: string;
    verificationComplete?: string;
    error?: string;
  };
}

/**
 * Complete email verification flow component
 * Handles signup → email verification → completion flow
 *
 * @example
 * ```tsx
 * function App() {
 *   const [showFlow, setShowFlow] = useState(false);
 *
 *   return (
 *     <div>
 *       <button onClick={() => setShowFlow(true)}>
 *         Create Account
 *       </button>
 *
 *       <EmailVerificationFlow
 *         isOpen={showFlow}
 *         onComplete={() => {
 *           console.log('User signed up and verified!');
 *           setShowFlow(false);
 *         }}
 *         onCancel={() => setShowFlow(false)}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const EmailVerificationFlow: React.FC<EmailVerificationFlowProps> = ({
  isOpen = false,
  onComplete,
  onCancel,
  onStateChange,
  className = '',
  autoStartSignup = true,
  requireVerification = true,
  messages = {}
}) => {
  const { user, isAuthenticated } = useAuth();
  const [flowState, setFlowState] = useState<EmailVerificationFlowState>('idle');
  const [signupResult, setSignupResult] = useState<AuthResult | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  // Update flow state based on user authentication and verification status
  useEffect(() => {
    if (!isOpen) {
      setFlowState('idle');
      return;
    }

    if (!isAuthenticated) {
      // User not authenticated, show signup if auto-start is enabled
      if (autoStartSignup && flowState === 'idle') {
        setFlowState('signup');
        setShowAuthModal(true);
      }
    } else if (user) {
      // User is authenticated
      if (user.emailVerified) {
        // Email is verified - flow complete
        if (flowState !== 'verified') {
          setFlowState('verified');
          if (!requireVerification || flowState === 'verification') {
            // Complete the flow if we were waiting for verification or don't require it
            setTimeout(() => onComplete?.(), 100);
          }
        }
      } else {
        // Email not verified - show verification prompt
        if (flowState === 'signup' || flowState === 'idle') {
          setFlowState('verification');
          setShowVerificationPrompt(true);
          setShowAuthModal(false);
        }
      }
    }
  }, [isOpen, isAuthenticated, user, flowState, autoStartSignup, requireVerification, onComplete]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(flowState);
  }, [flowState, onStateChange]);

  // Handle successful signup
  const handleSignupSuccess = useCallback((mode: AuthMode) => {
    if (mode === 'signup') {
      setFlowState('verification');
      setShowAuthModal(false);
      setShowVerificationPrompt(true);
    }
  }, []);

  // Handle signup errors
  const handleSignupError = useCallback((error: any) => {
    setFlowState('error');
    console.error('Signup error:', error);
  }, []);

  // Handle authentication modal close
  const handleAuthModalClose = useCallback(() => {
    setShowAuthModal(false);
    if (flowState === 'signup') {
      // User cancelled signup
      onCancel?.();
    }
  }, [flowState, onCancel]);

  // Handle verification completion
  const handleVerificationComplete = useCallback(() => {
    setFlowState('verified');
    setShowVerificationPrompt(false);
    onComplete?.();
  }, [onComplete]);

  // Handle verification prompt dismiss
  const handleVerificationDismiss = useCallback(() => {
    setShowVerificationPrompt(false);
    if (!requireVerification) {
      // If verification isn't required, complete the flow
      onComplete?.();
    } else {
      // If verification is required, this is a cancellation
      onCancel?.();
    }
  }, [requireVerification, onComplete, onCancel]);

  // Handle flow restart (e.g., if user wants to try again)
  const handleRestart = useCallback(() => {
    setFlowState('idle');
    setSignupResult(null);
    setShowAuthModal(false);
    setShowVerificationPrompt(false);

    if (autoStartSignup) {
      setTimeout(() => {
        setFlowState('signup');
        setShowAuthModal(true);
      }, 100);
    }
  }, [autoStartSignup]);

  // Don't render anything if flow is not open
  if (!isOpen) {
    return null;
  }

  return (
    <div className={className}>
      {/* Authentication Modal for Signup */}
      <AuthenticationModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        initialMode="signup"
        onSuccess={handleSignupSuccess}
        onError={handleSignupError}
        disableBackdropClose={true} // Prevent accidental dismissal during flow
      />

      {/* Email Verification Prompt */}
      {showVerificationPrompt && (
        <EmailVerificationPrompt
          mode="modal"
          onVerificationComplete={handleVerificationComplete}
          onDismiss={handleVerificationDismiss}
          showCloseButton={!requireVerification} // Hide close button if verification is required
          autoDismissOnVerification={true}
        />
      )}

      {/* Success State Overlay */}
      {flowState === 'verified' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Welcome!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {messages.verificationComplete || 'Your account has been created and verified successfully.'}
              </p>
              <button
                onClick={onComplete}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error State Overlay */}
      {flowState === 'error' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {messages.error || 'There was an error during account creation. Please try again.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRestart}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Try Again
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Hook for managing email verification flow state
 * Provides utilities for controlling the verification flow
 */
export function useEmailVerificationFlow() {
  const { user, isAuthenticated } = useAuth();
  const [isFlowOpen, setIsFlowOpen] = useState(false);
  const [flowState, setFlowState] = useState<EmailVerificationFlowState>('idle');

  // Check if user needs email verification
  const needsVerification = isAuthenticated && user && !user.emailVerified;

  // Start the verification flow
  const startFlow = useCallback(() => {
    setIsFlowOpen(true);
  }, []);

  // Complete the verification flow
  const completeFlow = useCallback(() => {
    setIsFlowOpen(false);
    setFlowState('idle');
  }, []);

  // Cancel the verification flow
  const cancelFlow = useCallback(() => {
    setIsFlowOpen(false);
    setFlowState('idle');
  }, []);

  return {
    isFlowOpen,
    flowState,
    needsVerification,
    startFlow,
    completeFlow,
    cancelFlow,
    setFlowState
  };
}

export default EmailVerificationFlow;