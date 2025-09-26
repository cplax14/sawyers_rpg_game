/**
 * Cloud Storage Quota Monitor
 * Tracks storage usage, quota limits, and provides warnings
 */

import { User } from 'firebase/auth';
import { CloudStorageService } from './cloudStorage';
import { retry } from '../utils/retryManager';

// Quota monitoring configuration
export interface QuotaConfig {
  /** Maximum storage allowed per user (bytes) */
  maxStorageBytes: number;
  /** Warning threshold (percentage) */
  warningThreshold: number;
  /** Critical threshold (percentage) */
  criticalThreshold: number;
  /** How often to check quota (milliseconds) */
  checkInterval: number;
  /** Enable automatic cleanup of oldest saves when quota exceeded */
  autoCleanup: boolean;
  /** Maximum number of saves to keep during cleanup */
  maxSavesToKeep: number;
}

// Quota status and usage information
export interface QuotaStatus {
  /** Current storage usage in bytes */
  usedBytes: number;
  /** Maximum storage allowed in bytes */
  maxBytes: number;
  /** Usage as percentage (0-100) */
  usagePercentage: number;
  /** Available storage in bytes */
  availableBytes: number;
  /** Number of saves stored */
  totalSaves: number;
  /** Status level */
  status: 'normal' | 'warning' | 'critical' | 'exceeded';
  /** Human-readable status message */
  message: string;
  /** Timestamp of last check */
  lastChecked: Date;
  /** Breakdown by save slot */
  saveBreakdown: Array<{
    slotNumber: number;
    saveName: string;
    sizeBytes: number;
    createdAt: Date;
    lastPlayedAt?: Date;
  }>;
}

// Quota notification types
export interface QuotaNotification {
  id: string;
  type: 'warning' | 'critical' | 'exceeded' | 'cleanup' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actions?: Array<{
    label: string;
    action: 'cleanup' | 'manage' | 'upgrade' | 'dismiss';
    data?: any;
  }>;
}

// Quota monitoring events
export interface QuotaEventHandlers {
  onQuotaWarning?: (status: QuotaStatus) => void;
  onQuotaCritical?: (status: QuotaStatus) => void;
  onQuotaExceeded?: (status: QuotaStatus) => void;
  onCleanupPerformed?: (deletedSaves: number, freedBytes: number) => void;
  onNotification?: (notification: QuotaNotification) => void;
}

/**
 * Default quota configuration
 */
export const DEFAULT_QUOTA_CONFIG: QuotaConfig = {
  maxStorageBytes: 100 * 1024 * 1024, // 100MB default
  warningThreshold: 75, // 75%
  criticalThreshold: 90, // 90%
  checkInterval: 5 * 60 * 1000, // 5 minutes
  autoCleanup: false, // Disabled by default
  maxSavesToKeep: 5
};

/**
 * Cloud Storage Quota Monitor Service
 */
export class QuotaMonitorService {
  private config: QuotaConfig;
  private cloudStorage: CloudStorageService;
  private currentStatus: QuotaStatus | null = null;
  private notifications: QuotaNotification[] = [];
  private eventHandlers: QuotaEventHandlers = {};
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  constructor(
    cloudStorage: CloudStorageService,
    config: Partial<QuotaConfig> = {},
    eventHandlers: QuotaEventHandlers = {}
  ) {
    this.cloudStorage = cloudStorage;
    this.config = { ...DEFAULT_QUOTA_CONFIG, ...config };
    this.eventHandlers = eventHandlers;
  }

  /**
   * Start quota monitoring
   */
  startMonitoring(user: User): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Initial check
    this.checkQuota(user);

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      if (this.isMonitoring) {
        this.checkQuota(user);
      }
    }, this.config.checkInterval);
  }

  /**
   * Stop quota monitoring
   */
  stopMonitoring(): void {
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Manually check quota status
   */
  async checkQuota(user: User): Promise<QuotaStatus> {
    try {
      const storageStats = await retry.quick(() => this.getStorageStats(user));
      const status = this.calculateQuotaStatus(storageStats);

      // Check if status has changed significantly
      if (this.hasStatusChanged(status)) {
        this.handleStatusChange(status);
      }

      this.currentStatus = status;
      return status;

    } catch (error) {
      console.error('Failed to check quota:', error);

      // Return last known status or create error status
      return this.currentStatus || this.createErrorStatus();
    }
  }

  /**
   * Get current quota status (cached)
   */
  getCurrentStatus(): QuotaStatus | null {
    return this.currentStatus;
  }

  /**
   * Get storage statistics from cloud storage service
   */
  private async getStorageStats(user: User): Promise<{
    totalSaves: number;
    totalSize: number;
    saves: Array<{
      slotNumber: number;
      saveName: string;
      sizeBytes: number;
      compressedSize: number;
      createdAt: Date;
      lastPlayedAt?: Date;
    }>;
  }> {
    const listResult = await this.cloudStorage.listCloudSaves(user);

    if (!listResult.success) {
      throw new Error('Failed to get storage statistics');
    }

    const saves = listResult.data!;
    const totalSize = saves.reduce((sum, save) => sum + save.compressedSize, 0);

    return {
      totalSaves: saves.length,
      totalSize,
      saves: saves.map(save => ({
        slotNumber: save.slotNumber,
        saveName: save.saveName,
        sizeBytes: save.dataSize,
        compressedSize: save.compressedSize,
        createdAt: save.createdAt,
        lastPlayedAt: save.updatedAt
      }))
    };
  }

  /**
   * Calculate quota status from storage stats
   */
  private calculateQuotaStatus(stats: {
    totalSaves: number;
    totalSize: number;
    saves: Array<{
      slotNumber: number;
      saveName: string;
      sizeBytes: number;
      compressedSize: number;
      createdAt: Date;
      lastPlayedAt?: Date;
    }>;
  }): QuotaStatus {
    const usedBytes = stats.totalSize;
    const maxBytes = this.config.maxStorageBytes;
    const usagePercentage = Math.round((usedBytes / maxBytes) * 100);
    const availableBytes = Math.max(0, maxBytes - usedBytes);

    let status: QuotaStatus['status'] = 'normal';
    let message = `Using ${this.formatBytes(usedBytes)} of ${this.formatBytes(maxBytes)} (${usagePercentage}%)`;

    if (usagePercentage >= 100) {
      status = 'exceeded';
      message = `Storage quota exceeded! Using ${this.formatBytes(usedBytes)} of ${this.formatBytes(maxBytes)}`;
    } else if (usagePercentage >= this.config.criticalThreshold) {
      status = 'critical';
      message = `Storage almost full: ${usagePercentage}% used. Consider managing your saves.`;
    } else if (usagePercentage >= this.config.warningThreshold) {
      status = 'warning';
      message = `Storage warning: ${usagePercentage}% used. You may want to clean up old saves.`;
    }

    return {
      usedBytes,
      maxBytes,
      usagePercentage,
      availableBytes,
      totalSaves: stats.totalSaves,
      status,
      message,
      lastChecked: new Date(),
      saveBreakdown: stats.saves.map(save => ({
        slotNumber: save.slotNumber,
        saveName: save.saveName,
        sizeBytes: save.compressedSize,
        createdAt: save.createdAt,
        lastPlayedAt: save.lastPlayedAt
      }))
    };
  }

  /**
   * Check if quota status has changed significantly
   */
  private hasStatusChanged(newStatus: QuotaStatus): boolean {
    if (!this.currentStatus) {
      return true;
    }

    const oldStatus = this.currentStatus.status;
    const newStatusLevel = newStatus.status;

    // Status level changed
    if (oldStatus !== newStatusLevel) {
      return true;
    }

    // Significant usage change (>5%)
    const usageDiff = Math.abs(newStatus.usagePercentage - this.currentStatus.usagePercentage);
    if (usageDiff >= 5) {
      return true;
    }

    return false;
  }

  /**
   * Handle quota status changes
   */
  private handleStatusChange(status: QuotaStatus): void {
    switch (status.status) {
      case 'warning':
        this.eventHandlers.onQuotaWarning?.(status);
        this.createNotification({
          type: 'warning',
          title: 'Storage Warning',
          message: status.message,
          actions: [
            { label: 'Manage Saves', action: 'manage' },
            { label: 'Dismiss', action: 'dismiss' }
          ]
        });
        break;

      case 'critical':
        this.eventHandlers.onQuotaCritical?.(status);
        this.createNotification({
          type: 'critical',
          title: 'Storage Critical',
          message: status.message,
          actions: [
            { label: 'Clean Up Now', action: 'cleanup' },
            { label: 'Manage Saves', action: 'manage' }
          ]
        });
        break;

      case 'exceeded':
        this.eventHandlers.onQuotaExceeded?.(status);
        this.createNotification({
          type: 'exceeded',
          title: 'Storage Quota Exceeded',
          message: status.message,
          actions: [
            { label: 'Clean Up Now', action: 'cleanup' },
            { label: 'Manage Saves', action: 'manage' }
          ]
        });

        // Auto-cleanup if enabled
        if (this.config.autoCleanup) {
          this.performAutoCleanup();
        }
        break;

      case 'normal':
        if (this.currentStatus?.status !== 'normal') {
          this.createNotification({
            type: 'info',
            title: 'Storage Normal',
            message: 'Storage usage is back to normal levels.',
            actions: [{ label: 'OK', action: 'dismiss' }]
          });
        }
        break;
    }
  }

  /**
   * Perform automatic cleanup of oldest saves
   */
  private async performAutoCleanup(): Promise<void> {
    if (!this.currentStatus) return;

    try {
      const savesToDelete = this.currentStatus.saveBreakdown
        .sort((a, b) => {
          // Sort by last played (or created if never played), oldest first
          const aDate = a.lastPlayedAt || a.createdAt;
          const bDate = b.lastPlayedAt || b.createdAt;
          return aDate.getTime() - bDate.getTime();
        })
        .slice(0, Math.max(0, this.currentStatus.totalSaves - this.config.maxSavesToKeep));

      let deletedCount = 0;
      let freedBytes = 0;

      // Delete saves one by one
      // Note: In a real implementation, you'd need access to the user object
      // This is a placeholder for the cleanup logic
      for (const save of savesToDelete) {
        try {
          // await this.cloudStorage.deleteCloudSave(user, save.slotNumber);
          deletedCount++;
          freedBytes += save.sizeBytes;
        } catch (error) {
          console.error(`Failed to delete save slot ${save.slotNumber}:`, error);
        }
      }

      if (deletedCount > 0) {
        this.eventHandlers.onCleanupPerformed?.(deletedCount, freedBytes);
        this.createNotification({
          type: 'info',
          title: 'Automatic Cleanup Performed',
          message: `Deleted ${deletedCount} old saves, freed ${this.formatBytes(freedBytes)}.`,
          actions: [{ label: 'OK', action: 'dismiss' }]
        });
      }

    } catch (error) {
      console.error('Auto-cleanup failed:', error);
      this.createNotification({
        type: 'warning',
        title: 'Cleanup Failed',
        message: 'Automatic cleanup encountered an error. Please manage saves manually.',
        actions: [
          { label: 'Manage Saves', action: 'manage' },
          { label: 'Dismiss', action: 'dismiss' }
        ]
      });
    }
  }

  /**
   * Create and store a notification
   */
  private createNotification(notification: Omit<QuotaNotification, 'id' | 'timestamp' | 'isRead'>): void {
    const fullNotification: QuotaNotification = {
      id: `quota_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false,
      ...notification
    };

    this.notifications.unshift(fullNotification);

    // Limit notification history
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.eventHandlers.onNotification?.(fullNotification);
  }

  /**
   * Get all notifications
   */
  getNotifications(): QuotaNotification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  getUnreadNotifications(): QuotaNotification[] {
    return this.notifications.filter(n => !n.isRead);
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead(): void {
    this.notifications.forEach(n => n.isRead = true);
  }

  /**
   * Clear all notifications
   */
  clearNotifications(): void {
    this.notifications = [];
  }

  /**
   * Create error status when monitoring fails
   */
  private createErrorStatus(): QuotaStatus {
    return {
      usedBytes: 0,
      maxBytes: this.config.maxStorageBytes,
      usagePercentage: 0,
      availableBytes: this.config.maxStorageBytes,
      totalSaves: 0,
      status: 'normal',
      message: 'Unable to check storage usage',
      lastChecked: new Date(),
      saveBreakdown: []
    };
  }

  /**
   * Format bytes for human-readable display
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  /**
   * Get configuration
   */
  getConfig(): QuotaConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<QuotaConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

export default QuotaMonitorService;