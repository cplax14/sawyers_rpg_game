/**
 * Service Mode Manager
 * Manages graceful degradation between cloud and local-only modes
 */

import React from 'react';
import { CloudError, CloudErrorCode, ErrorSeverity } from './cloudErrors';

export enum ServiceMode {
  CLOUD_ENABLED = 'cloud_enabled',
  LOCAL_ONLY = 'local_only',
  DEGRADED = 'degraded',
  OFFLINE = 'offline',
}

export interface ServiceModeConfig {
  mode: ServiceMode;
  reason?: string;
  timestamp: Date;
  autoRetryEnabled: boolean;
  retryInterval: number; // milliseconds
  lastCloudAttempt?: Date;
  fallbackFeatures: string[];
  disabledFeatures: string[];
}

export interface ServiceCapability {
  name: string;
  description: string;
  requiredMode: ServiceMode[];
  fallbackBehavior?: string;
  essential: boolean;
}

// Define service capabilities
export const SERVICE_CAPABILITIES: Record<string, ServiceCapability> = {
  cloud_save: {
    name: 'Cloud Save',
    description: 'Save game progress to cloud storage',
    requiredMode: [ServiceMode.CLOUD_ENABLED, ServiceMode.DEGRADED],
    fallbackBehavior: 'Save locally with sync pending',
    essential: false,
  },
  cloud_load: {
    name: 'Cloud Load',
    description: 'Load game progress from cloud storage',
    requiredMode: [ServiceMode.CLOUD_ENABLED, ServiceMode.DEGRADED],
    fallbackBehavior: 'Load from local storage only',
    essential: false,
  },
  cloud_sync: {
    name: 'Cloud Sync',
    description: 'Synchronize saves across devices',
    requiredMode: [ServiceMode.CLOUD_ENABLED],
    fallbackBehavior: 'Queue for later sync',
    essential: false,
  },
  auto_backup: {
    name: 'Auto Backup',
    description: 'Automatic cloud backup of saves',
    requiredMode: [ServiceMode.CLOUD_ENABLED, ServiceMode.DEGRADED],
    fallbackBehavior: 'Local backup only',
    essential: false,
  },
  user_authentication: {
    name: 'User Authentication',
    description: 'Sign in and account management',
    requiredMode: [ServiceMode.CLOUD_ENABLED, ServiceMode.DEGRADED],
    fallbackBehavior: 'Guest mode with local saves',
    essential: false,
  },
  local_save: {
    name: 'Local Save',
    description: 'Save game progress locally',
    requiredMode: [
      ServiceMode.CLOUD_ENABLED,
      ServiceMode.LOCAL_ONLY,
      ServiceMode.DEGRADED,
      ServiceMode.OFFLINE,
    ],
    essential: true,
  },
  local_load: {
    name: 'Local Load',
    description: 'Load game progress from local storage',
    requiredMode: [
      ServiceMode.CLOUD_ENABLED,
      ServiceMode.LOCAL_ONLY,
      ServiceMode.DEGRADED,
      ServiceMode.OFFLINE,
    ],
    essential: true,
  },
  gameplay: {
    name: 'Core Gameplay',
    description: 'Main game functionality',
    requiredMode: [
      ServiceMode.CLOUD_ENABLED,
      ServiceMode.LOCAL_ONLY,
      ServiceMode.DEGRADED,
      ServiceMode.OFFLINE,
    ],
    essential: true,
  },
};

type ServiceModeListener = (config: ServiceModeConfig) => void;

export class ServiceModeManager {
  private config: ServiceModeConfig;
  private listeners: Set<ServiceModeListener> = new Set();
  private retryTimer?: NodeJS.Timeout;
  private healthCheckInterval?: NodeJS.Timeout;
  private pendingSyncQueue: Array<{ operation: string; data: any; timestamp: Date }> = [];

  constructor() {
    this.config = {
      mode: ServiceMode.CLOUD_ENABLED,
      timestamp: new Date(),
      autoRetryEnabled: true,
      retryInterval: 30000, // 30 seconds
      fallbackFeatures: [],
      disabledFeatures: [],
    };

    // Start health monitoring
    this.startHealthMonitoring();
  }

  /**
   * Get current service mode
   */
  getCurrentMode(): ServiceMode {
    return this.config.mode;
  }

  /**
   * Get current service configuration
   */
  getConfig(): ServiceModeConfig {
    return { ...this.config };
  }

  /**
   * Check if a capability is available in current mode
   */
  isCapabilityAvailable(capabilityName: string): boolean {
    const capability = SERVICE_CAPABILITIES[capabilityName];
    if (!capability) return false;

    return capability.requiredMode.includes(this.config.mode);
  }

  /**
   * Get all available capabilities in current mode
   */
  getAvailableCapabilities(): ServiceCapability[] {
    return Object.values(SERVICE_CAPABILITIES).filter(cap =>
      cap.requiredMode.includes(this.config.mode)
    );
  }

  /**
   * Get capabilities that are not available in current mode
   */
  getUnavailableCapabilities(): ServiceCapability[] {
    return Object.values(SERVICE_CAPABILITIES).filter(
      cap => !cap.requiredMode.includes(this.config.mode)
    );
  }

  /**
   * Force degradation to a specific mode
   */
  degradeToMode(mode: ServiceMode, reason: string): void {
    const previousMode = this.config.mode;

    this.config = {
      ...this.config,
      mode,
      reason,
      timestamp: new Date(),
      lastCloudAttempt: mode !== ServiceMode.CLOUD_ENABLED ? new Date() : undefined,
    };

    console.log(`Service mode changed: ${previousMode} → ${mode} (${reason})`);
    this.notifyListeners();

    // Update feature availability
    this.updateFeatureAvailability();

    // Handle mode-specific logic
    this.handleModeTransition(previousMode, mode);
  }

  /**
   * Attempt to restore cloud services
   */
  async attemptCloudRestoration(): Promise<boolean> {
    if (this.config.mode === ServiceMode.CLOUD_ENABLED) {
      return true;
    }

    console.log('Attempting to restore cloud services...');

    try {
      // Check network connectivity
      if (!navigator.onLine) {
        console.log('Network offline, cannot restore cloud services');
        return false;
      }

      // Test basic connectivity (this would be replaced with actual service checks)
      const connectivityTest = await this.testCloudConnectivity();

      if (connectivityTest.success) {
        this.config = {
          ...this.config,
          mode: ServiceMode.CLOUD_ENABLED,
          reason: 'Cloud services restored',
          timestamp: new Date(),
          lastCloudAttempt: new Date(),
        };

        console.log('Cloud services successfully restored');
        this.notifyListeners();
        this.updateFeatureAvailability();

        // Process pending sync queue
        await this.processPendingSyncQueue();

        return true;
      } else {
        // Partial restoration - degraded mode
        if (this.config.mode === ServiceMode.LOCAL_ONLY) {
          this.degradeToMode(ServiceMode.DEGRADED, 'Partial cloud restoration');
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to restore cloud services:', error);
      return false;
    }
  }

  /**
   * Handle cloud service errors and determine appropriate degradation
   */
  handleCloudError(error: CloudError): ServiceMode {
    const currentMode = this.config.mode;

    switch (error.code) {
      case CloudErrorCode.NETWORK_UNAVAILABLE:
        if (currentMode !== ServiceMode.OFFLINE) {
          this.degradeToMode(ServiceMode.OFFLINE, 'Network unavailable');
          return ServiceMode.OFFLINE;
        }
        break;

      case CloudErrorCode.NETWORK_ERROR:
      case CloudErrorCode.NETWORK_TIMEOUT:
        if (currentMode === ServiceMode.CLOUD_ENABLED) {
          this.degradeToMode(ServiceMode.DEGRADED, `Network issues: ${error.message}`);
          return ServiceMode.DEGRADED;
        }
        break;

      case CloudErrorCode.AUTH_REQUIRED:
      case CloudErrorCode.AUTH_EXPIRED:
        if (currentMode === ServiceMode.CLOUD_ENABLED) {
          this.degradeToMode(ServiceMode.LOCAL_ONLY, `Authentication required: ${error.message}`);
          return ServiceMode.LOCAL_ONLY;
        }
        break;

      case CloudErrorCode.STORAGE_QUOTA_EXCEEDED:
      case CloudErrorCode.STORAGE_PERMISSION_DENIED:
        if (currentMode === ServiceMode.CLOUD_ENABLED) {
          this.degradeToMode(ServiceMode.DEGRADED, `Storage issues: ${error.message}`);
          return ServiceMode.DEGRADED;
        }
        break;

      case CloudErrorCode.INTERNAL:
      case CloudErrorCode.CONFIG_INVALID:
        if (currentMode !== ServiceMode.LOCAL_ONLY) {
          this.degradeToMode(ServiceMode.LOCAL_ONLY, `Service unavailable: ${error.message}`);
          return ServiceMode.LOCAL_ONLY;
        }
        break;

      default:
        // For unknown errors, degrade conservatively
        if (
          error.severity === ErrorSeverity.CRITICAL &&
          currentMode === ServiceMode.CLOUD_ENABLED
        ) {
          this.degradeToMode(ServiceMode.DEGRADED, `Critical error: ${error.message}`);
          return ServiceMode.DEGRADED;
        }
        break;
    }

    return currentMode;
  }

  /**
   * Add operation to pending sync queue
   */
  queuePendingSync(operation: string, data: any): void {
    if (this.config.mode !== ServiceMode.CLOUD_ENABLED) {
      this.pendingSyncQueue.push({
        operation,
        data,
        timestamp: new Date(),
      });

      console.log(
        `Queued ${operation} for later sync (queue size: ${this.pendingSyncQueue.length})`
      );
    }
  }

  /**
   * Get pending sync queue status
   */
  getPendingSyncStatus(): {
    count: number;
    oldestItem?: Date;
    operations: string[];
  } {
    return {
      count: this.pendingSyncQueue.length,
      oldestItem: this.pendingSyncQueue.length > 0 ? this.pendingSyncQueue[0].timestamp : undefined,
      operations: [...new Set(this.pendingSyncQueue.map(item => item.operation))],
    };
  }

  /**
   * Subscribe to service mode changes
   */
  subscribe(listener: ServiceModeListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Enable or disable auto-retry
   */
  setAutoRetry(enabled: boolean, interval?: number): void {
    this.config.autoRetryEnabled = enabled;
    if (interval) {
      this.config.retryInterval = interval;
    }

    if (enabled && this.config.mode !== ServiceMode.CLOUD_ENABLED) {
      this.startRetryTimer();
    } else {
      this.stopRetryTimer();
    }
  }

  /**
   * Get human-readable status message
   */
  getStatusMessage(): string {
    switch (this.config.mode) {
      case ServiceMode.CLOUD_ENABLED:
        return 'All services operational';
      case ServiceMode.DEGRADED:
        return `Limited cloud services available (${this.config.reason || 'unknown reason'})`;
      case ServiceMode.LOCAL_ONLY:
        return `Local-only mode (${this.config.reason || 'cloud unavailable'})`;
      case ServiceMode.OFFLINE:
        return 'Offline mode - no internet connection';
      default:
        return 'Unknown service state';
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopRetryTimer();
    this.stopHealthMonitoring();
    this.listeners.clear();
  }

  // Private methods

  private async testCloudConnectivity(): Promise<{ success: boolean; services: string[] }> {
    // This would test actual cloud service endpoints
    // For now, we'll simulate based on network status
    const isOnline = navigator.onLine;

    // Simulate some service checks
    const services: string[] = [];
    if (isOnline) {
      services.push('network');
      // Add other service checks here
    }

    return {
      success: isOnline,
      services,
    };
  }

  private async processPendingSyncQueue(): Promise<void> {
    if (this.pendingSyncQueue.length === 0) return;

    console.log(`Processing ${this.pendingSyncQueue.length} pending sync operations...`);

    // Process items in batches to avoid overwhelming the service
    const batchSize = 5;
    let processed = 0;

    while (this.pendingSyncQueue.length > 0 && processed < 20) {
      // Limit total processing
      const batch = this.pendingSyncQueue.splice(0, batchSize);

      try {
        // This would actually process the sync operations
        console.log(`Processing batch of ${batch.length} sync operations`);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));

        processed += batch.length;
      } catch (error) {
        // If processing fails, put items back in queue
        this.pendingSyncQueue.unshift(...batch);
        console.error('Failed to process sync batch:', error);
        break;
      }
    }

    console.log(
      `Processed ${processed} sync operations, ${this.pendingSyncQueue.length} remaining`
    );
  }

  private handleModeTransition(fromMode: ServiceMode, toMode: ServiceMode): void {
    // Handle specific transitions
    if (fromMode === ServiceMode.CLOUD_ENABLED && toMode !== ServiceMode.CLOUD_ENABLED) {
      // Transitioning away from full cloud - start retry timer if enabled
      if (this.config.autoRetryEnabled) {
        this.startRetryTimer();
      }
    }

    if (fromMode !== ServiceMode.CLOUD_ENABLED && toMode === ServiceMode.CLOUD_ENABLED) {
      // Restored to full cloud - stop retry timer
      this.stopRetryTimer();
    }

    // Log transition for debugging
    console.log(`Service mode transition: ${fromMode} → ${toMode}`);
  }

  private updateFeatureAvailability(): void {
    const available = this.getAvailableCapabilities().map(cap => cap.name);
    const unavailable = this.getUnavailableCapabilities().map(cap => cap.name);

    this.config.fallbackFeatures = available.filter(name => {
      const cap =
        SERVICE_CAPABILITIES[
          Object.keys(SERVICE_CAPABILITIES).find(key => SERVICE_CAPABILITIES[key].name === name) ||
            ''
        ];
      return cap && cap.fallbackBehavior;
    });

    this.config.disabledFeatures = unavailable;

    console.log('Feature availability updated:', {
      available: available.length,
      unavailable: unavailable.length,
      fallback: this.config.fallbackFeatures.length,
    });
  }

  private startRetryTimer(): void {
    this.stopRetryTimer();

    this.retryTimer = setTimeout(async () => {
      console.log('Auto-retry: Attempting to restore cloud services...');
      const restored = await this.attemptCloudRestoration();

      if (!restored && this.config.autoRetryEnabled) {
        // Schedule next retry with exponential backoff (max 5 minutes)
        const nextInterval = Math.min(this.config.retryInterval * 1.5, 300000);
        this.config.retryInterval = nextInterval;
        this.startRetryTimer();
      }
    }, this.config.retryInterval);
  }

  private stopRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
  }

  private startHealthMonitoring(): void {
    // Monitor network status
    window.addEventListener('online', this.handleNetworkOnline);
    window.addEventListener('offline', this.handleNetworkOffline);

    // Periodic health check
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Check every minute
  }

  private stopHealthMonitoring(): void {
    window.removeEventListener('online', this.handleNetworkOnline);
    window.removeEventListener('offline', this.handleNetworkOffline);

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  private handleNetworkOnline = (): void => {
    console.log('Network came online');
    if (this.config.mode === ServiceMode.OFFLINE) {
      this.attemptCloudRestoration();
    }
  };

  private handleNetworkOffline = (): void => {
    console.log('Network went offline');
    if (this.config.mode !== ServiceMode.OFFLINE) {
      this.degradeToMode(ServiceMode.OFFLINE, 'Network connection lost');
    }
  };

  private async performHealthCheck(): void {
    if (this.config.mode === ServiceMode.CLOUD_ENABLED) {
      // Verify cloud services are still healthy
      try {
        const healthCheck = await this.testCloudConnectivity();
        if (!healthCheck.success) {
          this.degradeToMode(ServiceMode.DEGRADED, 'Health check failed');
        }
      } catch (error) {
        console.warn('Health check failed:', error);
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Error notifying service mode listener:', error);
      }
    });
  }
}

// Global service mode manager instance
export const serviceModeManager = new ServiceModeManager();

// React hook for using service mode
export const useServiceMode = () => {
  const [config, setConfig] = React.useState(serviceModeManager.getConfig());

  React.useEffect(() => {
    return serviceModeManager.subscribe(setConfig);
  }, []);

  return {
    mode: config.mode,
    config,
    isCapabilityAvailable: (capability: string) =>
      serviceModeManager.isCapabilityAvailable(capability),
    getAvailableCapabilities: () => serviceModeManager.getAvailableCapabilities(),
    getUnavailableCapabilities: () => serviceModeManager.getUnavailableCapabilities(),
    getStatusMessage: () => serviceModeManager.getStatusMessage(),
    getPendingSyncStatus: () => serviceModeManager.getPendingSyncStatus(),
    attemptRestoration: () => serviceModeManager.attemptCloudRestoration(),
  };
};
