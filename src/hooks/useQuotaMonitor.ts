/**
 * React Hook for Cloud Storage Quota Monitoring
 * Provides real-time quota status and notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  QuotaMonitorService,
  QuotaStatus,
  QuotaNotification,
  QuotaConfig,
  QuotaEventHandlers,
  DEFAULT_QUOTA_CONFIG
} from '../services/quotaMonitor';
import { CloudStorageService } from '../services/cloudStorage';

export interface UseQuotaMonitorOptions {
  /** Whether to start monitoring automatically */
  autoStart?: boolean;
  /** Custom quota configuration */
  config?: Partial<QuotaConfig>;
  /** Whether to enable debug logging */
  enableDebugLogging?: boolean;
}

export interface UseQuotaMonitorResult {
  // Status
  quotaStatus: QuotaStatus | null;
  notifications: QuotaNotification[];
  unreadCount: number;
  isMonitoring: boolean;

  // Actions
  startMonitoring: () => void;
  stopMonitoring: () => void;
  checkQuota: () => Promise<QuotaStatus | null>;

  // Notification management
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Configuration
  updateConfig: (newConfig: Partial<QuotaConfig>) => void;
  getConfig: () => QuotaConfig;

  // Utilities
  formatBytes: (bytes: number) => string;
  getUsageColor: () => string;
  getUsageIcon: () => string;
  getSuggestions: () => string[];
}

/**
 * Hook for quota monitoring functionality
 */
export function useQuotaMonitor(
  user: User | null,
  cloudStorage: CloudStorageService | null,
  options: UseQuotaMonitorOptions = {}
): UseQuotaMonitorResult {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null);
  const [notifications, setNotifications] = useState<QuotaNotification[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const quotaServiceRef = useRef<QuotaMonitorService | null>(null);

  // Initialize quota service
  useEffect(() => {
    if (cloudStorage && user) {
      const eventHandlers: QuotaEventHandlers = {
        onQuotaWarning: (status) => {
          setQuotaStatus(status);
          if (options.enableDebugLogging) {
            console.warn('Quota warning:', status);
          }
        },

        onQuotaCritical: (status) => {
          setQuotaStatus(status);
          if (options.enableDebugLogging) {
            console.warn('Quota critical:', status);
          }
        },

        onQuotaExceeded: (status) => {
          setQuotaStatus(status);
          if (options.enableDebugLogging) {
            console.error('Quota exceeded:', status);
          }
        },

        onCleanupPerformed: (deletedSaves, freedBytes) => {
          if (options.enableDebugLogging) {
            console.log(`Auto-cleanup: ${deletedSaves} saves deleted, ${freedBytes} bytes freed`);
          }
        },

        onNotification: (notification) => {
          setNotifications(prev => {
            const updated = [notification, ...prev];
            return updated.slice(0, 50); // Keep last 50 notifications
          });
        }
      };

      quotaServiceRef.current = new QuotaMonitorService(
        cloudStorage,
        options.config,
        eventHandlers
      );

      // Auto-start if enabled
      if (options.autoStart) {
        quotaServiceRef.current.startMonitoring(user);
        setIsMonitoring(true);
      }

      // Initial quota check
      quotaServiceRef.current.checkQuota(user).then(status => {
        setQuotaStatus(status);
      }).catch(error => {
        if (options.enableDebugLogging) {
          console.error('Initial quota check failed:', error);
        }
      });

    } else {
      // Clean up if user or cloudStorage becomes unavailable
      if (quotaServiceRef.current) {
        quotaServiceRef.current.stopMonitoring();
        quotaServiceRef.current = null;
        setIsMonitoring(false);
        setQuotaStatus(null);
      }
    }

    // Cleanup on unmount
    return () => {
      if (quotaServiceRef.current) {
        quotaServiceRef.current.stopMonitoring();
      }
    };
  }, [user, cloudStorage, options.autoStart, options.config, options.enableDebugLogging]);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (quotaServiceRef.current && user && !isMonitoring) {
      quotaServiceRef.current.startMonitoring(user);
      setIsMonitoring(true);
    }
  }, [user, isMonitoring]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (quotaServiceRef.current && isMonitoring) {
      quotaServiceRef.current.stopMonitoring();
      setIsMonitoring(false);
    }
  }, [isMonitoring]);

  // Manual quota check
  const checkQuota = useCallback(async (): Promise<QuotaStatus | null> => {
    if (!quotaServiceRef.current || !user) {
      return null;
    }

    try {
      const status = await quotaServiceRef.current.checkQuota(user);
      setQuotaStatus(status);
      return status;
    } catch (error) {
      if (options.enableDebugLogging) {
        console.error('Manual quota check failed:', error);
      }
      return null;
    }
  }, [user, options.enableDebugLogging]);

  // Notification management
  const markNotificationRead = useCallback((notificationId: string) => {
    if (quotaServiceRef.current) {
      quotaServiceRef.current.markNotificationRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    }
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    if (quotaServiceRef.current) {
      quotaServiceRef.current.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  }, []);

  const clearNotifications = useCallback(() => {
    if (quotaServiceRef.current) {
      quotaServiceRef.current.clearNotifications();
      setNotifications([]);
    }
  }, []);

  // Configuration management
  const updateConfig = useCallback((newConfig: Partial<QuotaConfig>) => {
    if (quotaServiceRef.current) {
      quotaServiceRef.current.updateConfig(newConfig);
    }
  }, []);

  const getConfig = useCallback((): QuotaConfig => {
    if (quotaServiceRef.current) {
      return quotaServiceRef.current.getConfig();
    }
    return DEFAULT_QUOTA_CONFIG;
  }, []);

  // Utility functions
  const formatBytes = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }, []);

  const getUsageColor = useCallback((): string => {
    if (!quotaStatus) return '#999999';

    switch (quotaStatus.status) {
      case 'exceeded':
        return '#ff4757'; // Red
      case 'critical':
        return '#ff6b35'; // Orange
      case 'warning':
        return '#ffa502'; // Yellow
      case 'normal':
      default:
        return '#2ed573'; // Green
    }
  }, [quotaStatus]);

  const getUsageIcon = useCallback((): string => {
    if (!quotaStatus) return '📊';

    switch (quotaStatus.status) {
      case 'exceeded':
        return '🚨';
      case 'critical':
        return '⚠️';
      case 'warning':
        return '💛';
      case 'normal':
      default:
        return '✅';
    }
  }, [quotaStatus]);

  const getSuggestions = useCallback((): string[] => {
    if (!quotaStatus) return [];

    const suggestions: string[] = [];

    if (quotaStatus.status === 'exceeded' || quotaStatus.status === 'critical') {
      suggestions.push('Delete old or unused saves');
      suggestions.push('Consider keeping only recent saves');

      if (quotaStatus.totalSaves > 5) {
        suggestions.push(`You have ${quotaStatus.totalSaves} saves - consider keeping only the 3-5 most recent`);
      }
    }

    if (quotaStatus.status === 'warning') {
      suggestions.push('Review your saves and delete any you no longer need');
      suggestions.push('Consider setting up automatic cleanup');
    }

    if (quotaStatus.usagePercentage > 50) {
      // Find largest saves
      const largeSaves = quotaStatus.saveBreakdown
        .sort((a, b) => b.sizeBytes - a.sizeBytes)
        .slice(0, 3);

      if (largeSaves.length > 0) {
        suggestions.push(`Your largest save is "${largeSaves[0].saveName}" (${formatBytes(largeSaves[0].sizeBytes)})`);
      }
    }

    return suggestions;
  }, [quotaStatus, formatBytes]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    // Status
    quotaStatus,
    notifications,
    unreadCount,
    isMonitoring,

    // Actions
    startMonitoring,
    stopMonitoring,
    checkQuota,

    // Notification management
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,

    // Configuration
    updateConfig,
    getConfig,

    // Utilities
    formatBytes,
    getUsageColor,
    getUsageIcon,
    getSuggestions
  };
}

/**
 * Simplified hook that just returns quota status
 */
export function useQuotaStatus(
  user: User | null,
  cloudStorage: CloudStorageService | null
): {
  usagePercentage: number;
  status: QuotaStatus['status'];
  message: string;
  isLoading: boolean;
} {
  const { quotaStatus, isMonitoring } = useQuotaMonitor(user, cloudStorage, {
    autoStart: true,
    config: { checkInterval: 10 * 60 * 1000 } // Check every 10 minutes
  });

  return {
    usagePercentage: quotaStatus?.usagePercentage || 0,
    status: quotaStatus?.status || 'normal',
    message: quotaStatus?.message || 'Checking storage...',
    isLoading: !quotaStatus && isMonitoring
  };
}

export default useQuotaMonitor;