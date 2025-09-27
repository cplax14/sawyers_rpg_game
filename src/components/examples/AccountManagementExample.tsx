/**
 * Account Management Example Component
 * Demonstrates how to use the account management system
 */

import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAccountManagement } from '../../hooks/useAccountManagement';
import { AuthenticationModal } from '../molecules/AuthenticationModal';
import { PasswordResetModal } from '../molecules/PasswordResetModal';
import { AccountManagement } from '../organisms/AccountManagement';
import { UserProfileCard } from '../molecules/UserProfileCard';
import { EmailVerificationPrompt } from '../molecules/EmailVerificationPrompt';

/**
 * Example component showing complete account management integration
 * This demonstrates all the account features working together
 */
export const AccountManagementExample: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const {
    state,
    openAccountSettings,
    closeAccountSettings,
    openPasswordReset,
    closePasswordReset,
    openEmailVerification,
    closeEmailVerification,
    handleAccountChange,
    handlePasswordResetSuccess,
    handleVerificationComplete,
    hasUnverifiedEmail,
    clearMessages
  } = useAccountManagement();

  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Account Management Demo
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Sign in to access account management features
            </p>
          </div>

          <button
            onClick={() => setShowAuthModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Sign In / Sign Up
          </button>

          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Features Available After Sign In:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>✅ Profile management</li>
              <li>✅ Password changes</li>
              <li>✅ Email updates</li>
              <li>✅ Email verification</li>
              <li>✅ Password reset</li>
              <li>✅ Account deletion</li>
              <li>✅ Privacy settings</li>
              <li>✅ Session management</li>
            </ul>
          </div>

          {/* Authentication Modal */}
          <AuthenticationModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={() => setShowAuthModal(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Account Management System
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Complete user account management with all features
          </p>
        </div>

        {/* Success/Error Messages */}
        {(state.lastSuccess || state.lastError) && (
          <div className="max-w-2xl mx-auto">
            {state.lastSuccess && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex">
                    <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="ml-3 text-sm text-green-800 dark:text-green-200">
                      {state.lastSuccess}
                    </p>
                  </div>
                  <button
                    onClick={clearMessages}
                    className="text-green-400 hover:text-green-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {state.lastError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <div className="flex">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="ml-3 text-sm text-red-800 dark:text-red-200">
                      {state.lastError}
                    </p>
                  </div>
                  <button
                    onClick={clearMessages}
                    className="text-red-400 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email Verification Alert */}
        {hasUnverifiedEmail && (
          <div className="max-w-2xl mx-auto">
            <EmailVerificationPrompt />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Profile Cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Profile Cards
            </h2>

            {/* Full Profile Card */}
            <UserProfileCard variant="full" />

            {/* Compact Profile Card */}
            <UserProfileCard variant="compact" />
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
              <button
                onClick={openAccountSettings}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Account Settings
              </button>

              <button
                onClick={() => openPasswordReset(user?.email || undefined)}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Reset Password
              </button>

              {hasUnverifiedEmail && (
                <button
                  onClick={openEmailVerification}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Verify Email
                </button>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Account Information
            </h2>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {user?.email}
                  </span>
                  {user?.emailVerified ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Unverified
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Member Since</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Last Sign In</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {user?.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Current Operation</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {state.lastOperation || 'None'}
                </div>
              </div>

              <div className="flex space-x-2 text-xs">
                {state.isChangingPassword && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Changing Password...
                  </span>
                )}
                {state.isChangingEmail && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    Changing Email...
                  </span>
                )}
                {state.isDeletingAccount && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full">
                    Deleting Account...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {state.showAccountSettings && (
          <AccountManagement
            isModal={true}
            onClose={closeAccountSettings}
            onAccountChange={handleAccountChange}
          />
        )}

        {state.showPasswordReset && (
          <PasswordResetModal
            isOpen={state.showPasswordReset}
            onClose={closePasswordReset}
            initialEmail={user?.email || undefined}
            onSuccess={handlePasswordResetSuccess}
          />
        )}

        {state.showEmailVerification && (
          <EmailVerificationPrompt
            mode="modal"
            onVerificationComplete={handleVerificationComplete}
            onDismiss={closeEmailVerification}
          />
        )}
      </div>
    </div>
  );
};

export default AccountManagementExample;