/**
 * Account Management Component
 * Comprehensive user account management interface
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { AuthResult } from '../../services/authentication';

export interface AccountManagementProps {
  /** Custom class name */
  className?: string;
  /** Whether to show as a modal */
  isModal?: boolean;
  /** Modal close handler */
  onClose?: () => void;
  /** Success callback for major account changes */
  onAccountChange?: (type: 'password' | 'email' | 'profile' | 'deleted') => void;
}

type AccountSection = 'profile' | 'security' | 'privacy' | 'danger';

interface FormData {
  // Profile
  displayName: string;

  // Security
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  newEmail: string;

  // Deletion confirmation
  deleteConfirmation: string;
}

interface FormErrors {
  [key: string]: string;
}

/**
 * Account management interface with profile, security, and privacy settings
 *
 * @example
 * ```tsx
 * function UserSettings() {
 *   const [showAccount, setShowAccount] = useState(false);
 *
 *   return (
 *     <div>
 *       <button onClick={() => setShowAccount(true)}>
 *         Account Settings
 *       </button>
 *
 *       {showAccount && (
 *         <AccountManagement
 *           isModal={true}
 *           onClose={() => setShowAccount(false)}
 *           onAccountChange={(type) => {
 *             console.log(`Account ${type} updated`);
 *             if (type === 'deleted') {
 *               setShowAccount(false);
 *             }
 *           }}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export const AccountManagement: React.FC<AccountManagementProps> = ({
  className = '',
  isModal = false,
  onClose,
  onAccountChange
}) => {
  const {
    user,
    updateProfile,
    changePassword,
    changeEmail,
    deleteAccount,
    sendPasswordReset,
    signOut,
    state
  } = useAuth();

  const [activeSection, setActiveSection] = useState<AccountSection>('profile');
  const [formData, setFormData] = useState<FormData>({
    displayName: user?.displayName || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: user?.email || '',
    deleteConfirmation: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Reset form data when user changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      displayName: user?.displayName || '',
      newEmail: user?.email || ''
    }));
  }, [user]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle form field changes
  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear field-specific error
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [formErrors]);

  // Validate forms
  const validateProfileForm = (): FormErrors => {
    const errors: FormErrors = {};

    if (!formData.displayName.trim()) {
      errors.displayName = 'Display name is required';
    } else if (formData.displayName.length < 2) {
      errors.displayName = 'Display name must be at least 2 characters';
    }

    return errors;
  };

  const validatePasswordForm = (): FormErrors => {
    const errors: FormErrors = {};

    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    return errors;
  };

  const validateEmailForm = (): FormErrors => {
    const errors: FormErrors = {};

    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!formData.newEmail) {
      errors.newEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
      errors.newEmail = 'Please enter a valid email address';
    }

    if (formData.newEmail === user?.email) {
      errors.newEmail = 'New email must be different from current email';
    }

    return errors;
  };

  const validateDeleteForm = (): FormErrors => {
    const errors: FormErrors = {};

    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (formData.deleteConfirmation !== 'DELETE') {
      errors.deleteConfirmation = 'Please type "DELETE" to confirm';
    }

    return errors;
  };

  // Handle form submissions
  const handleUpdateProfile = useCallback(async () => {
    const errors = validateProfileForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const result = await updateProfile({
        displayName: formData.displayName
      });

      if (result.success) {
        setSuccessMessage('Profile updated successfully');
        onAccountChange && onAccountChange('profile');
      } else {
        setFormErrors({ general: result.error?.message || 'Failed to update profile' });
      }
    } catch (error) {
      setFormErrors({ general: error instanceof Error ? error.message : 'Update failed' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData.displayName, updateProfile, onAccountChange]);

  const handleChangePassword = useCallback(async () => {
    const errors = validatePasswordForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const result = await changePassword(formData.currentPassword, formData.newPassword);

      if (result.success) {
        setSuccessMessage('Password changed successfully');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        onAccountChange && onAccountChange('password');
      } else {
        setFormErrors({ general: result.error?.message || 'Failed to change password' });
      }
    } catch (error) {
      setFormErrors({ general: error instanceof Error ? error.message : 'Password change failed' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData.currentPassword, formData.newPassword, changePassword, onAccountChange]);

  const handleChangeEmail = useCallback(async () => {
    const errors = validateEmailForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const result = await changeEmail(formData.currentPassword, formData.newEmail);

      if (result.success) {
        setSuccessMessage('Email changed successfully');
        setFormData(prev => ({ ...prev, currentPassword: '' }));
        onAccountChange && onAccountChange('email');
      } else {
        setFormErrors({ general: result.error?.message || 'Failed to change email' });
      }
    } catch (error) {
      setFormErrors({ general: error instanceof Error ? error.message : 'Email change failed' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData.currentPassword, formData.newEmail, changeEmail, onAccountChange]);

  const handleDeleteAccount = useCallback(async () => {
    const errors = validateDeleteForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFormErrors({});

    try {
      const result = await deleteAccount(formData.currentPassword);

      if (result.success) {
        onAccountChange && onAccountChange('deleted');
        // Note: user will be automatically signed out by the auth service
      } else {
        setFormErrors({ general: result.error?.message || 'Failed to delete account' });
      }
    } catch (error) {
      setFormErrors({ general: error instanceof Error ? error.message : 'Account deletion failed' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData.currentPassword, formData.deleteConfirmation, deleteAccount, onAccountChange]);

  const handleSendPasswordReset = useCallback(async () => {
    if (!user?.email) return;

    setIsSubmitting(true);
    try {
      const result = await sendPasswordReset(user.email);
      if (result.success) {
        setSuccessMessage('Password reset email sent');
      } else {
        setFormErrors({ general: result.error?.message || 'Failed to send password reset' });
      }
    } catch (error) {
      setFormErrors({ general: error instanceof Error ? error.message : 'Failed to send email' });
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.email, sendPasswordReset]);

  // Handle modal backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  }, [onClose]);

  // Sections configuration
  const sections = [
    { id: 'profile' as AccountSection, label: 'Profile', icon: '👤' },
    { id: 'security' as AccountSection, label: 'Security', icon: '🔒' },
    { id: 'privacy' as AccountSection, label: 'Privacy', icon: '🛡️' },
    { id: 'danger' as AccountSection, label: 'Danger Zone', icon: '⚠️' }
  ];

  const content = (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Account Settings
        </h2>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700">
          <nav className="p-4 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{section.icon}</span>
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <div className="flex">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="ml-3 text-sm text-green-800 dark:text-green-200">
                  {successMessage}
                </p>
              </div>
            </div>
          )}

          {/* General Error */}
          {formErrors.general && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="ml-3 text-sm text-red-800 dark:text-red-200">
                  {formErrors.general}
                </p>
              </div>
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Profile Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                        formErrors.displayName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      disabled={isSubmitting}
                    />
                    {formErrors.displayName && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {formErrors.displayName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
                      disabled
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Email can be changed in the Security section
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Verification Status
                    </label>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      user?.emailVerified
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                    }`}>
                      {user?.emailVerified ? (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Unverified
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleUpdateProfile}
                    disabled={isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Security Settings
                </h3>

                {/* Change Password */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Change Password
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          formErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isSubmitting}
                      />
                      {formErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.currentPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          formErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isSubmitting}
                      />
                      {formErrors.newPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.newPassword}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          formErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isSubmitting}
                      />
                      {formErrors.confirmPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      {isSubmitting ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {/* Change Email */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Change Email Address
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Email
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        New Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.newEmail}
                        onChange={(e) => handleInputChange('newEmail', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          formErrors.newEmail ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isSubmitting}
                      />
                      {formErrors.newEmail && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.newEmail}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={formData.currentPassword}
                        onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                          formErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        disabled={isSubmitting}
                      />
                      {formErrors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {formErrors.currentPassword}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleChangeEmail}
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      {isSubmitting ? 'Changing...' : 'Change Email'}
                    </button>
                  </div>
                </div>

                {/* Password Reset */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Password Reset
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Send a password reset email to your current email address.
                  </p>
                  <button
                    onClick={handleSendPasswordReset}
                    disabled={isSubmitting}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Password Reset Email'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Privacy Settings
                </h3>

                <div className="space-y-4">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Data Export
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Download a copy of your account data and preferences.
                    </p>
                    <button
                      onClick={() => {
                        const data = state.authPreferences;
                        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'account-data.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      Export Data
                    </button>
                  </div>

                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Session Management
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Session timeout: {state.authPreferences.sessionTimeout} minutes
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Remember me: {state.rememberMe ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Danger Zone */}
          {activeSection === 'danger' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">
                  Danger Zone
                </h3>

                <div className="border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                    Delete Account
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>

                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                            formErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                          }`}
                          disabled={isSubmitting}
                        />
                        {formErrors.currentPassword && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {formErrors.currentPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Type "DELETE" to confirm
                        </label>
                        <input
                          type="text"
                          value={formData.deleteConfirmation}
                          onChange={(e) => handleInputChange('deleteConfirmation', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                            formErrors.deleteConfirmation ? 'border-red-500' : 'border-gray-300'
                          }`}
                          disabled={isSubmitting}
                        />
                        {formErrors.deleteConfirmation && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {formErrors.deleteConfirmation}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isSubmitting}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
                        >
                          {isSubmitting ? 'Deleting...' : 'Delete Account'}
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setFormData(prev => ({
                              ...prev,
                              currentPassword: '',
                              deleteConfirmation: ''
                            }));
                            setFormErrors({});
                          }}
                          disabled={isSubmitting}
                          className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render as modal or inline
  if (isModal) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="w-full max-w-4xl max-h-[90vh] overflow-auto">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default AccountManagement;