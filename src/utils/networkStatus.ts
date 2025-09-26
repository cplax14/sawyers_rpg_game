/**
 * Network Status Detection and Management
 * Monitors network connectivity and provides offline/online state
 */

// Network status types
export interface NetworkStatus {
  isOnline: boolean;
  connectionType: 'unknown' | 'ethernet' | 'wifi' | 'cellular' | '2g' | '3g' | '4g' | '5g';
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // milliseconds
  saveData: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
}

export type NetworkStatusListener = (status: NetworkStatus) => void;

export interface NetworkStatusConfig {
  pingUrl: string;
  pingInterval: number; // milliseconds
  pingTimeout: number; // milliseconds
  retryAttempts: number;
  enableDetailedInfo: boolean;
}

const DEFAULT_CONFIG: NetworkStatusConfig = {
  pingUrl: 'https://www.google.com/favicon.ico',
  pingInterval: 30000, // 30 seconds
  pingTimeout: 5000, // 5 seconds
  retryAttempts: 3,
  enableDetailedInfo: true
};

/**
 * Network Status Manager
 * Provides comprehensive network connectivity detection and monitoring
 */
export class NetworkStatusManager {
  private config: NetworkStatusConfig;
  private status: NetworkStatus;
  private listeners: Set<NetworkStatusListener> = new Set();
  private pingIntervalId: number | null = null;
  private isDestroyed = false;

  constructor(config: Partial<NetworkStatusConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize status
    this.status = {
      isOnline: navigator.onLine,
      connectionType: 'unknown',
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false,
      lastOnline: navigator.onLine ? new Date() : null,
      lastOffline: navigator.onLine ? null : new Date()
    };

    this.initialize();
  }

  private initialize(): void {
    // Listen to browser online/offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Get initial network information
    this.updateNetworkInfo();

    // Start periodic connectivity checks
    if (this.config.pingInterval > 0) {
      this.startPingChecks();
    }
  }

  private handleOnline = (): void => {
    if (this.isDestroyed) return;

    const wasOffline = !this.status.isOnline;
    this.status.isOnline = true;
    this.status.lastOnline = new Date();

    this.updateNetworkInfo();

    if (wasOffline) {
      console.log('Network connection restored');
      this.notifyListeners();
    }
  };

  private handleOffline = (): void => {
    if (this.isDestroyed) return;

    const wasOnline = this.status.isOnline;
    this.status.isOnline = false;
    this.status.lastOffline = new Date();

    if (wasOnline) {
      console.log('Network connection lost');
      this.notifyListeners();
    }
  };

  private updateNetworkInfo(): void {
    if (!this.config.enableDetailedInfo) return;

    // Get network connection info if available
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      this.status.connectionType = connection.type || 'unknown';
      this.status.effectiveType = connection.effectiveType || 'unknown';
      this.status.downlink = connection.downlink || 0;
      this.status.rtt = connection.rtt || 0;
      this.status.saveData = connection.saveData || false;
    }
  }

  private startPingChecks(): void {
    this.pingIntervalId = window.setInterval(() => {
      if (this.isDestroyed) return;
      this.performConnectivityCheck();
    }, this.config.pingInterval);
  }

  private async performConnectivityCheck(): Promise<void> {
    if (!navigator.onLine) {
      // Browser says we're offline, trust it
      if (this.status.isOnline) {
        this.handleOffline();
      }
      return;
    }

    try {
      const isReachable = await this.pingServer();

      if (isReachable && !this.status.isOnline) {
        this.handleOnline();
      } else if (!isReachable && this.status.isOnline) {
        this.handleOffline();
      }
    } catch (error) {
      console.warn('Connectivity check failed:', error);

      // If we can't reach the server but browser says online,
      // consider it offline for cloud save purposes
      if (this.status.isOnline) {
        this.handleOffline();
      }
    }
  }

  private async pingServer(): Promise<boolean> {
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.pingTimeout);

        const response = await fetch(this.config.pingUrl, {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        return true; // If we get any response, we're online

      } catch (error) {
        if (attempt === this.config.retryAttempts) {
          return false;
        }

        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return false;
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.status });
      } catch (error) {
        console.error('Network status listener error:', error);
      }
    });
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.status };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.status.isOnline;
  }

  /**
   * Check if currently offline
   */
  isOffline(): boolean {
    return !this.status.isOnline;
  }

  /**
   * Get connection quality assessment
   */
  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
    if (!this.status.isOnline) return 'poor';

    const { effectiveType, rtt, downlink } = this.status;

    if (effectiveType === '4g' && rtt < 100 && downlink > 10) return 'excellent';
    if (effectiveType === '4g' && rtt < 200 && downlink > 5) return 'good';
    if (effectiveType === '3g' && rtt < 300) return 'fair';
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'poor';

    return 'unknown';
  }

  /**
   * Check if connection is suitable for cloud operations
   */
  isSuitableForCloudOperations(): boolean {
    if (!this.status.isOnline) return false;

    // Don't perform large operations on save data mode
    if (this.status.saveData) return false;

    const quality = this.getConnectionQuality();
    return quality === 'excellent' || quality === 'good' || quality === 'fair';
  }

  /**
   * Add network status listener
   */
  addListener(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);

    // Immediately notify with current status
    setTimeout(() => listener({ ...this.status }), 0);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove network status listener
   */
  removeListener(listener: NetworkStatusListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Force a connectivity check
   */
  async checkConnectivity(): Promise<boolean> {
    if (!navigator.onLine) {
      this.handleOffline();
      return false;
    }

    try {
      const isReachable = await this.pingServer();

      if (isReachable) {
        this.handleOnline();
        return true;
      } else {
        this.handleOffline();
        return false;
      }
    } catch (error) {
      console.warn('Manual connectivity check failed:', error);
      this.handleOffline();
      return false;
    }
  }

  /**
   * Get network status history/statistics
   */
  getStatistics(): {
    totalOnlineTime: number;
    totalOfflineTime: number;
    currentSessionDuration: number;
    connectionSwitches: number;
  } {
    const now = new Date();
    const { lastOnline, lastOffline, isOnline } = this.status;

    let totalOnlineTime = 0;
    let totalOfflineTime = 0;
    let currentSessionDuration = 0;

    if (isOnline && lastOnline) {
      currentSessionDuration = now.getTime() - lastOnline.getTime();
      totalOnlineTime = currentSessionDuration;
    } else if (!isOnline && lastOffline) {
      currentSessionDuration = now.getTime() - lastOffline.getTime();
      totalOfflineTime = currentSessionDuration;
    }

    return {
      totalOnlineTime,
      totalOfflineTime,
      currentSessionDuration,
      connectionSwitches: 0 // Would need persistent storage to track this
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.isDestroyed = true;

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);

    if (this.pingIntervalId) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }

    this.listeners.clear();
  }
}

// Create singleton instance
export const networkStatusManager = new NetworkStatusManager();

// Utility functions
export const isOnline = (): boolean => networkStatusManager.isOnline();
export const isOffline = (): boolean => networkStatusManager.isOffline();
export const getNetworkStatus = (): NetworkStatus => networkStatusManager.getStatus();
export const checkConnectivity = (): Promise<boolean> => networkStatusManager.checkConnectivity();

// React hook (to be implemented)
export const useNetworkStatus = () => {
  // This will be implemented in a separate hook file
  return networkStatusManager.getStatus();
};