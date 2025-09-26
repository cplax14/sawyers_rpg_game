/**
 * User Profile Card Component
 * Displays user profile information with quick action buttons
 */

import React, { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AccountManagement } from '../organisms/AccountManagement';
import { EmailVerificationPrompt } from './EmailVerificationPrompt';

export interface UserProfileCardProps {
  /** Custom class name */
  className?: string;
  /** Whether to show the full profile or compact version */
  variant?: 'full' | 'compact';
  /** Whether to show quick action buttons */
  showActions?: boolean;
  /** Click handler for profile picture */
  onAvatarClick?: () => void;
}

/**
 * User profile card with account information and quick actions
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   return (
 *     <div>
 *       <UserProfileCard
 *         variant="compact"
 *         showActions={true}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  className = '',
  variant = 'full',
  showActions = true,
  onAvatarClick
}) => {
  const { user, isAuthenticated, signOut, state } = useAuth();
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [signOut]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const userInitials = state.userProfile?.displayName
    ? state.userProfile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || '?';

  const displayName = state.userProfile?.displayName || user.email?.split('@')[0] || 'User';

  const isCompact = variant === 'compact';

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        {/* Profile Header */}
        <div className={`flex items-center ${isCompact ? 'space-x-3' : 'space-x-4'}`}>
          {/* Avatar */}
          <button
            onClick={onAvatarClick}
            className={`
              flex-shrink-0 flex items-center justify-center rounded-full bg-blue-500 text-white font-semibold
              ${isCompact ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-lg'}
              hover:bg-blue-600 transition-colors duration-200
            `}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              userInitials
            )}
          </button>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className={`font-medium text-gray-900 dark:text-white truncate ${isCompact ? 'text-sm' : 'text-base'}`}>
              {displayName}
            </div>
            {!isCompact && (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </div>
            )}

            {/* Verification Status */}
            <div className="flex items-center mt-1">
              {user.emailVerified ? (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 ${isCompact ? 'text-xs' : 'text-xs'}`}>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              ) : (
                <button
                  onClick={() => setShowEmailVerification(true)}
                  className={`inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-800/30 transition-colors ${isCompact ? 'text-xs' : 'text-xs'}`}
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Verify Email
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions Dropdown */}
          {showActions && (
            <div className="relative group">
              <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => setShowAccountSettings(true)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Account Settings
                  </button>

                  {!user.emailVerified && (
                    <button
                      onClick={() => setShowEmailVerification(true)}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 7.89a2 2 0 002.83 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Verify Email
                    </button>
                  )}

                  <div className="border-t border-gray-100 dark:border-gray-600 my-1"></div>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info (Full variant only) */}
        {!isCompact && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Member since</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Last sign in</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions (Compact variant) */}
        {isCompact && showActions && (
          <div className="mt-3 flex space-x-2">
            <button
              onClick={() => setShowAccountSettings(true)}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-1 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800/30 transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Account Settings Modal */}
      {showAccountSettings && (
        <AccountManagement
          isModal={true}
          onClose={() => setShowAccountSettings(false)}
          onAccountChange={(type) => {
            if (type === 'deleted') {
              setShowAccountSettings(false);
            }
          }}
        />
      )}

      {/* Email Verification Prompt */}
      {showEmailVerification && (
        <EmailVerificationPrompt
          mode="modal"
          onVerificationComplete={() => setShowEmailVerification(false)}
          onDismiss={() => setShowEmailVerification(false)}
        />
      )}
    </>
  );
};

export default UserProfileCard;