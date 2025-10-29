/**
 * Troubleshooting Help Dialog
 * Comprehensive help system for cloud save issues with step-by-step guides
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CloudError } from '../../utils/cloudErrors';
import {
  getUserFriendlyErrorInfo,
  generateTroubleshootingGuide,
  shouldContactSupport,
} from '../../utils/userFriendlyErrors';
import { Button } from '../atoms/Button';

interface TroubleshootingHelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
  error?: CloudError;
  context?: {
    isFirstTime?: boolean;
    hasLocalSaves?: boolean;
    isOnMobile?: boolean;
    operationType?: 'save' | 'load' | 'sync' | 'delete';
  };
  onContactSupport?: () => void;
  onRetryOperation?: () => void;
}

type TabType = 'overview' | 'steps' | 'prevention' | 'advanced';

export const TroubleshootingHelpDialog: React.FC<TroubleshootingHelpDialogProps> = ({
  isOpen,
  onClose,
  error,
  context,
  onContactSupport,
  onRetryOperation,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [hasTriedBasicSteps, setHasTriedBasicSteps] = useState(false);

  const troubleshootingGuide = error ? generateTroubleshootingGuide(error, context) : null;
  const supportInfo = error ? shouldContactSupport(error, hasTriedBasicSteps) : null;

  const toggleStepCompletion = useCallback((stepIndex: number) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepIndex)) {
        newSet.delete(stepIndex);
      } else {
        newSet.add(stepIndex);
      }

      // Check if user has tried basic steps
      if (newSet.size >= 2) {
        setHasTriedBasicSteps(true);
      }

      return newSet;
    });
  }, []);

  const getSeverityColor = (severity?: string): string => {
    switch (severity) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'medium':
        return '#d97706';
      case 'low':
        return '#65a30d';
      default:
        return '#6b7280';
    }
  };

  const getSeverityIcon = (severity?: string): string => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return 'ℹ️';
    }
  };

  if (!isOpen || !error || !troubleshootingGuide) {
    return null;
  }

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📋' },
    { id: 'steps' as const, label: 'Step-by-Step', icon: '🔧' },
    { id: 'prevention' as const, label: 'Prevention', icon: '🛡️' },
    { id: 'advanced' as const, label: 'Advanced', icon: '⚙️' },
  ];

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
          padding: '1rem',
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
            border: `2px solid ${getSeverityColor(error.severity)}`,
            width: '100%',
            maxWidth: '800px',
            maxHeight: '90vh',
            overflow: 'hidden',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '1.5rem',
              borderBottom: '1px solid #374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>{getSeverityIcon(error.severity)}</span>
              <div>
                <h2
                  style={{
                    margin: 0,
                    color: '#f9fafb',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                  }}
                >
                  {troubleshootingGuide.title}
                </h2>
                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    color: getSeverityColor(error.severity),
                    fontSize: '0.875rem',
                    fontWeight: 'semibold',
                  }}
                >
                  {error.severity.toUpperCase()} ERROR • Code: {error.code}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {onRetryOperation && (
                <Button variant='primary' size='sm' onClick={onRetryOperation}>
                  Retry
                </Button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  fontSize: '1.25rem',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #374151',
              backgroundColor: '#111827',
            }}
          >
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  background: activeTab === tab.id ? '#1f2937' : 'transparent',
                  border: 'none',
                  color: activeTab === tab.id ? '#f3f4f6' : '#9ca3af',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === tab.id ? 'semibold' : 'normal',
                  borderBottom:
                    activeTab === tab.id
                      ? `2px solid ${getSeverityColor(error.severity)}`
                      : '2px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div
            style={{
              padding: '1.5rem',
              maxHeight: 'calc(90vh - 200px)',
              overflow: 'auto',
              color: '#f3f4f6',
            }}
          >
            {activeTab === 'overview' && (
              <div>
                <div
                  style={{
                    backgroundColor: '#111827',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: `1px solid ${getSeverityColor(error.severity)}33`,
                  }}
                >
                  <h3
                    style={{
                      margin: '0 0 0.5rem 0',
                      color: '#f9fafb',
                      fontSize: '1.125rem',
                    }}
                  >
                    What happened?
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      lineHeight: '1.6',
                      color: '#d1d5db',
                    }}
                  >
                    {troubleshootingGuide.description}
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#111827',
                      padding: '1rem',
                      borderRadius: '8px',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 0.5rem 0',
                        color: '#f9fafb',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      ⏱️ Estimated Fix Time
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        color: '#d1d5db',
                        fontSize: '0.875rem',
                      }}
                    >
                      {troubleshootingGuide.estimatedTime}
                    </p>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#111827',
                      padding: '1rem',
                      borderRadius: '8px',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 0.5rem 0',
                        color: '#f9fafb',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      🎯 Quick Actions
                    </h4>
                    <div style={{ fontSize: '0.875rem' }}>
                      {troubleshootingGuide.immediateSteps.slice(0, 2).map((step, index) => (
                        <div
                          key={index}
                          style={{
                            margin: '0.25rem 0',
                            color: '#d1d5db',
                          }}
                        >
                          • {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {supportInfo?.shouldContact && (
                  <div
                    style={{
                      backgroundColor: '#7c2d12',
                      border: '1px solid #ea580c',
                      padding: '1rem',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 0.5rem 0',
                        color: '#fed7aa',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}
                    >
                      💬 Support Recommended
                    </h4>
                    <p
                      style={{
                        margin: '0 0 0.75rem 0',
                        color: '#fed7aa',
                        fontSize: '0.875rem',
                      }}
                    >
                      {supportInfo.reason}
                    </p>
                    {onContactSupport && (
                      <Button variant='secondary' size='sm' onClick={onContactSupport}>
                        Contact Support
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'steps' && (
              <div>
                <h3
                  style={{
                    margin: '0 0 1rem 0',
                    color: '#f9fafb',
                    fontSize: '1.25rem',
                  }}
                >
                  Step-by-Step Solution
                </h3>

                <p
                  style={{
                    margin: '0 0 1.5rem 0',
                    color: '#9ca3af',
                    fontSize: '0.875rem',
                  }}
                >
                  Follow these steps in order. Check off each step as you complete it.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4
                    style={{
                      margin: '0 0 0.75rem 0',
                      color: '#f9fafb',
                      fontSize: '1rem',
                    }}
                  >
                    🚀 Quick Fixes (Try These First)
                  </h4>
                  {troubleshootingGuide.immediateSteps.map((step, index) => (
                    <div
                      key={`immediate-${index}`}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem',
                        padding: '0.75rem',
                        backgroundColor: completedSteps.has(index) ? '#065f4633' : '#111827',
                        border: `1px solid ${completedSteps.has(index) ? '#10b981' : '#374151'}`,
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleStepCompletion(index)}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${completedSteps.has(index) ? '#10b981' : '#6b7280'}`,
                          backgroundColor: completedSteps.has(index) ? '#10b981' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          color: 'white',
                          flexShrink: 0,
                          marginTop: '0.125rem',
                        }}
                      >
                        {completedSteps.has(index) ? '✓' : index + 1}
                      </div>
                      <div
                        style={{
                          color: completedSteps.has(index) ? '#d1fae5' : '#d1d5db',
                          fontSize: '0.875rem',
                          lineHeight: '1.5',
                        }}
                      >
                        {step}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4
                    style={{
                      margin: '0 0 0.75rem 0',
                      color: '#f9fafb',
                      fontSize: '1rem',
                    }}
                  >
                    🔧 Detailed Troubleshooting
                  </h4>
                  {troubleshootingGuide.detailedSteps.map((step, index) => {
                    const stepIndex = troubleshootingGuide.immediateSteps.length + index;
                    return (
                      <div
                        key={`detailed-${index}`}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          backgroundColor: completedSteps.has(stepIndex) ? '#065f4633' : '#111827',
                          border: `1px solid ${completedSteps.has(stepIndex) ? '#10b981' : '#374151'}`,
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleStepCompletion(stepIndex)}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${completedSteps.has(stepIndex) ? '#10b981' : '#6b7280'}`,
                            backgroundColor: completedSteps.has(stepIndex)
                              ? '#10b981'
                              : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: 'white',
                            flexShrink: 0,
                            marginTop: '0.125rem',
                          }}
                        >
                          {completedSteps.has(stepIndex) ? '✓' : stepIndex + 1}
                        </div>
                        <div
                          style={{
                            color: completedSteps.has(stepIndex) ? '#d1fae5' : '#d1d5db',
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                          }}
                        >
                          {step}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {completedSteps.size > 0 && (
                  <div
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#065f46',
                      border: '1px solid #10b981',
                      borderRadius: '8px',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        color: '#d1fae5',
                        fontSize: '0.875rem',
                      }}
                    >
                      ✅ Progress: {completedSteps.size} of{' '}
                      {troubleshootingGuide.immediateSteps.length +
                        troubleshootingGuide.detailedSteps.length}{' '}
                      steps completed
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'prevention' && (
              <div>
                <h3
                  style={{
                    margin: '0 0 1rem 0',
                    color: '#f9fafb',
                    fontSize: '1.25rem',
                  }}
                >
                  🛡️ Prevent This Issue
                </h3>

                <p
                  style={{
                    margin: '0 0 1.5rem 0',
                    color: '#9ca3af',
                    fontSize: '0.875rem',
                  }}
                >
                  Follow these tips to avoid encountering this error in the future.
                </p>

                {troubleshootingGuide.preventionTips.map((tip, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: '#111827',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#065f46',
                        color: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        flexShrink: 0,
                        marginTop: '0.125rem',
                      }}
                    >
                      💡
                    </div>
                    <div
                      style={{
                        color: '#d1d5db',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                      }}
                    >
                      {tip}
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    backgroundColor: '#1e3a8a',
                    border: '1px solid #3b82f6',
                    borderRadius: '8px',
                  }}
                >
                  <h4
                    style={{
                      margin: '0 0 0.5rem 0',
                      color: '#dbeafe',
                      fontSize: '1rem',
                    }}
                  >
                    💡 Pro Tip
                  </h4>
                  <p
                    style={{
                      margin: 0,
                      color: '#dbeafe',
                      fontSize: '0.875rem',
                    }}
                  >
                    Regular maintenance and following best practices can prevent most cloud save
                    issues. Set up auto-save and keep local backups for important progress.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'advanced' && (
              <div>
                <h3
                  style={{
                    margin: '0 0 1rem 0',
                    color: '#f9fafb',
                    fontSize: '1.25rem',
                  }}
                >
                  ⚙️ Advanced Information
                </h3>

                <div
                  style={{
                    display: 'grid',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#111827',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #374151',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 0.5rem 0',
                        color: '#f9fafb',
                        fontSize: '1rem',
                      }}
                    >
                      🔍 Technical Details
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontFamily: 'monospace' }}>
                      <div>Error Code: {error.code}</div>
                      <div>Severity: {error.severity}</div>
                      <div>Retryable: {error.retryable ? 'Yes' : 'No'}</div>
                      <div>Timestamp: {error.timestamp.toISOString()}</div>
                      {error.operationId && <div>Operation ID: {error.operationId}</div>}
                    </div>
                  </div>

                  <div
                    style={{
                      backgroundColor: '#111827',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #374151',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 0.5rem 0',
                        color: '#f9fafb',
                        fontSize: '1rem',
                      }}
                    >
                      🆘 When to Contact Support
                    </h4>
                    <p
                      style={{
                        margin: 0,
                        color: '#d1d5db',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                      }}
                    >
                      {troubleshootingGuide.supportInfo}
                    </p>
                  </div>
                </div>

                {onContactSupport && (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: '#7c2d12',
                      border: '1px solid #ea580c',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <h4
                      style={{
                        margin: '0 0 0.5rem 0',
                        color: '#fed7aa',
                        fontSize: '1rem',
                      }}
                    >
                      Need More Help?
                    </h4>
                    <p
                      style={{
                        margin: '0 0 1rem 0',
                        color: '#fed7aa',
                        fontSize: '0.875rem',
                      }}
                    >
                      If you've tried the suggested steps and still need help, our support team is
                      here to assist you.
                    </p>
                    <Button variant='secondary' onClick={onContactSupport}>
                      Contact Support Team
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TroubleshootingHelpDialog;
