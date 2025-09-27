/**
 * Error Help Center
 * Comprehensive help center for all cloud save error types and issues
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudErrorCode } from '../../utils/cloudErrors';
import { getUserFriendlyErrorInfo, UserFriendlyErrorData } from '../../utils/userFriendlyErrors';
import { Button } from '../atoms/Button';
import HelpTooltip from '../atoms/HelpTooltip';

interface ErrorHelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onContactSupport?: () => void;
  searchFilter?: string;
  categoryFilter?: 'all' | 'network' | 'auth' | 'storage' | 'data' | 'sync';
}

interface ErrorCategoryInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  errorCodes: CloudErrorCode[];
  color: string;
}

const ERROR_CATEGORIES: ErrorCategoryInfo[] = [
  {
    id: 'network',
    name: 'Connection Issues',
    description: 'Problems with internet connectivity and network access',
    icon: '🌐',
    color: '#3b82f6',
    errorCodes: [
      CloudErrorCode.NETWORK_UNAVAILABLE,
      CloudErrorCode.NETWORK_ERROR,
      CloudErrorCode.NETWORK_TIMEOUT
    ]
  },
  {
    id: 'auth',
    name: 'Account & Sign-In',
    description: 'Authentication, login, and account-related issues',
    icon: '🔐',
    color: '#8b5cf6',
    errorCodes: [
      CloudErrorCode.AUTH_REQUIRED,
      CloudErrorCode.AUTH_EXPIRED,
      CloudErrorCode.AUTH_INVALID
    ]
  },
  {
    id: 'storage',
    name: 'Storage & Quota',
    description: 'Cloud storage space, permissions, and access issues',
    icon: '💾',
    color: '#ef4444',
    errorCodes: [
      CloudErrorCode.STORAGE_QUOTA_EXCEEDED,
      CloudErrorCode.STORAGE_PERMISSION_DENIED,
      CloudErrorCode.STORAGE_NOT_FOUND,
      CloudErrorCode.STORAGE_CORRUPTED
    ]
  },
  {
    id: 'data',
    name: 'Save Data Issues',
    description: 'Problems with save file integrity, size, and format',
    icon: '📁',
    color: '#f59e0b',
    errorCodes: [
      CloudErrorCode.DATA_TOO_LARGE,
      CloudErrorCode.DATA_INVALID,
      CloudErrorCode.DATA_CORRUPTED,
      CloudErrorCode.DATA_CHECKSUM_MISMATCH,
      CloudErrorCode.DATA_VERSION_CONFLICT
    ]
  },
  {
    id: 'sync',
    name: 'Sync & Operations',
    description: 'Synchronization conflicts and operation failures',
    icon: '🔄',
    color: '#10b981',
    errorCodes: [
      CloudErrorCode.SYNC_CONFLICT,
      CloudErrorCode.SYNC_INTERRUPTED,
      CloudErrorCode.SYNC_PARTIAL_FAILURE,
      CloudErrorCode.OPERATION_CANCELLED,
      CloudErrorCode.OPERATION_TIMEOUT,
      CloudErrorCode.OPERATION_FAILED
    ]
  }
];

export const ErrorHelpCenter: React.FC<ErrorHelpCenterProps> = ({
  isOpen,
  onClose,
  onContactSupport,
  searchFilter = '',
  categoryFilter = 'all'
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<CloudErrorCode | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchFilter);

  // Get all error information
  const allErrors = useMemo(() => {
    return Object.values(CloudErrorCode).map(code => ({
      code,
      info: getUserFriendlyErrorInfo({ code } as any)
    }));
  }, []);

  // Filter errors based on search and category
  const filteredErrors = useMemo(() => {
    let filtered = allErrors;

    // Filter by category
    if (categoryFilter !== 'all') {
      const category = ERROR_CATEGORIES.find(cat => cat.id === categoryFilter);
      if (category) {
        filtered = filtered.filter(error => category.errorCodes.includes(error.code));
      }
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(error =>
        error.info.title.toLowerCase().includes(term) ||
        error.info.message.toLowerCase().includes(term) ||
        error.code.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [allErrors, categoryFilter, searchTerm]);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setSelectedError(null);
  }, [selectedCategory]);

  const handleErrorSelect = useCallback((errorCode: CloudErrorCode) => {
    setSelectedError(errorCode === selectedError ? null : errorCode);
  }, [selectedError]);

  if (!isOpen) {
    return null;
  }

  const selectedErrorInfo = selectedError ? getUserFriendlyErrorInfo({ code: selectedError } as any) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '1rem'
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          style={{
            backgroundColor: '#1f2937',
            borderRadius: '12px',
            border: '2px solid #374151',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #374151',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h2 style={{
                margin: '0 0 0.25rem 0',
                color: '#f9fafb',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                🆘 Error Help Center
              </h2>
              <p style={{
                margin: 0,
                color: '#9ca3af',
                fontSize: '0.875rem'
              }}>
                Find solutions to common cloud save issues
              </p>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '6px',
                fontSize: '1.25rem'
              }}
            >
              ✕
            </button>
          </div>

          {/* Search */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #374151'
          }}>
            <input
              type="text"
              placeholder="Search for error codes, messages, or keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #374151',
                backgroundColor: '#111827',
                color: '#f3f4f6',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden'
          }}>
            {/* Sidebar - Categories */}
            <div style={{
              width: '300px',
              borderRight: '1px solid #374151',
              overflow: 'auto'
            }}>
              <div style={{ padding: '1rem' }}>
                <h3 style={{
                  margin: '0 0 1rem 0',
                  color: '#f9fafb',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}>
                  Error Categories
                </h3>

                {ERROR_CATEGORIES.map((category) => (
                  <div key={category.id} style={{ marginBottom: '0.5rem' }}>
                    <button
                      onClick={() => handleCategorySelect(category.id)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: selectedCategory === category.id ? '#374151' : '#111827',
                        color: '#f3f4f6',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span style={{ fontSize: '1.25rem' }}>{category.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'semibold' }}>{category.name}</div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#9ca3af',
                          marginTop: '0.25rem'
                        }}>
                          {category.description}
                        </div>
                      </div>
                      <div style={{
                        backgroundColor: category.color,
                        color: 'white',
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontWeight: 'bold'
                      }}>
                        {category.errorCodes.length}
                      </div>
                    </button>

                    {/* Category Errors */}
                    <AnimatePresence>
                      {selectedCategory === category.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden', marginTop: '0.5rem' }}
                        >
                          {category.errorCodes.map(errorCode => {
                            const errorInfo = getUserFriendlyErrorInfo({ code: errorCode } as any);
                            return (
                              <button
                                key={errorCode}
                                onClick={() => handleErrorSelect(errorCode)}
                                style={{
                                  width: '100%',
                                  padding: '0.5rem 0.75rem',
                                  marginBottom: '0.25rem',
                                  borderRadius: '6px',
                                  border: 'none',
                                  backgroundColor: selectedError === errorCode ? category.color + '33' : '#0f172a',
                                  color: '#d1d5db',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  marginLeft: '1rem'
                                }}
                              >
                                {errorInfo.title}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              padding: '1.5rem'
            }}>
              {selectedErrorInfo ? (
                /* Detailed Error Info */
                <div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{
                      margin: '0 0 0.5rem 0',
                      color: '#f9fafb',
                      fontSize: '1.25rem',
                      fontWeight: 'bold'
                    }}>
                      {selectedErrorInfo.title}
                    </h3>
                    <div style={{
                      fontSize: '0.875rem',
                      color: '#9ca3af',
                      fontFamily: 'monospace',
                      marginBottom: '1rem'
                    }}>
                      Error Code: {selectedError}
                    </div>
                    <p style={{
                      margin: 0,
                      color: '#d1d5db',
                      lineHeight: '1.6'
                    }}>
                      {selectedErrorInfo.explanation}
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div style={{
                    backgroundColor: '#065f46',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: '1px solid #10b981'
                  }}>
                    <h4 style={{
                      margin: '0 0 0.75rem 0',
                      color: '#d1fae5',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      🚀 Quick Fix
                      <HelpTooltip
                        content="Try these steps first - they solve most issues quickly"
                        position="top"
                      />
                    </h4>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '1.25rem',
                      color: '#d1fae5'
                    }}>
                      {selectedErrorInfo.immediate_actions.map((action, index) => (
                        <li key={index} style={{ marginBottom: '0.25rem' }}>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Detailed Steps */}
                  <div style={{
                    backgroundColor: '#1e3a8a',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: '1px solid #3b82f6'
                  }}>
                    <h4 style={{
                      margin: '0 0 0.75rem 0',
                      color: '#dbeafe',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      🔧 Detailed Solution
                      <HelpTooltip
                        content="Step-by-step instructions if quick fixes don't work"
                        position="top"
                      />
                    </h4>
                    <ol style={{
                      margin: 0,
                      paddingLeft: '1.25rem',
                      color: '#dbeafe'
                    }}>
                      {selectedErrorInfo.detailed_steps.map((step, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem' }}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Prevention Tips */}
                  <div style={{
                    backgroundColor: '#7c2d12',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: '1px solid #ea580c'
                  }}>
                    <h4 style={{
                      margin: '0 0 0.75rem 0',
                      color: '#fed7aa',
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      🛡️ Prevention Tips
                      <HelpTooltip
                        content="Follow these tips to avoid this error in the future"
                        position="top"
                      />
                    </h4>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '1.25rem',
                      color: '#fed7aa'
                    }}>
                      {selectedErrorInfo.prevention_tips.map((tip, index) => (
                        <li key={index} style={{ marginBottom: '0.25rem' }}>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Support Info */}
                  <div style={{
                    backgroundColor: '#374151',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div>
                      <h4 style={{
                        margin: '0 0 0.25rem 0',
                        color: '#f9fafb',
                        fontSize: '1rem'
                      }}>
                        Need More Help?
                      </h4>
                      <p style={{
                        margin: 0,
                        color: '#d1d5db',
                        fontSize: '0.875rem'
                      }}>
                        {selectedErrorInfo.when_to_contact_support}
                      </p>
                    </div>
                    {onContactSupport && (
                      <Button
                        variant="primary"
                        onClick={onContactSupport}
                        style={{ marginLeft: '1rem' }}
                      >
                        Contact Support
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                /* Error List or Welcome */
                <div>
                  <h3 style={{
                    margin: '0 0 1rem 0',
                    color: '#f9fafb',
                    fontSize: '1.25rem',
                    fontWeight: 'bold'
                  }}>
                    {searchTerm ? `Search Results (${filteredErrors.length})` : 'Common Cloud Save Issues'}
                  </h3>

                  {filteredErrors.length > 0 ? (
                    <div style={{
                      display: 'grid',
                      gap: '0.75rem'
                    }}>
                      {filteredErrors.map(({ code, info }) => (
                        <button
                          key={code}
                          onClick={() => handleErrorSelect(code)}
                          style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            border: '1px solid #374151',
                            backgroundColor: '#111827',
                            color: '#f3f4f6',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{
                            fontWeight: 'bold',
                            marginBottom: '0.25rem'
                          }}>
                            {info.title}
                          </div>
                          <div style={{
                            fontSize: '0.875rem',
                            color: '#9ca3af',
                            marginBottom: '0.5rem'
                          }}>
                            {info.message}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            fontFamily: 'monospace'
                          }}>
                            {code}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: '#9ca3af',
                      padding: '2rem'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                      <p>No errors found matching your search.</p>
                      <p>Try different keywords or browse by category.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ErrorHelpCenter;