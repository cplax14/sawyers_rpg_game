/**
 * Network Status Hook
 * React hook for monitoring network connectivity status
 */

import { useState, useEffect } from 'react';
import { NetworkStatus, NetworkStatusListener, networkStatusManager } from '../utils/networkStatus';

export interface UseNetworkStatusOptions {
  enablePeriodicChecks?: boolean;
  checkInterval?: number; // milliseconds
}

export interface UseNetworkStatusResult {
  status: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  isSuitableForCloudOperations: boolean;
  checkConnectivity: () => Promise<boolean>;
  statistics: {
    totalOnlineTime: number;
    totalOfflineTime: number;
    currentSessionDuration: number;
    connectionSwitches: number;
  };
}

/**
 * Hook for monitoring network connectivity status
 */
export function useNetworkStatus(options: UseNetworkStatusOptions = {}): UseNetworkStatusResult {
  const [status, setStatus] = useState<NetworkStatus>(() => networkStatusManager.getStatus());

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = networkStatusManager.addListener((newStatus: NetworkStatus) => {
      setStatus(newStatus);
    });

    // Optional periodic connectivity checks
    let intervalId: NodeJS.Timeout | undefined;
    if (options.enablePeriodicChecks && options.checkInterval) {
      intervalId = setInterval(async () => {
        await networkStatusManager.checkConnectivity();
      }, options.checkInterval);
    }

    return () => {
      unsubscribe();
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [options.enablePeriodicChecks, options.checkInterval]);

  const checkConnectivity = async (): Promise<boolean> => {
    return networkStatusManager.checkConnectivity();
  };

  return {
    status,
    isOnline: status.isOnline,
    isOffline: !status.isOnline,
    connectionQuality: networkStatusManager.getConnectionQuality(),
    isSuitableForCloudOperations: networkStatusManager.isSuitableForCloudOperations(),
    checkConnectivity,
    statistics: networkStatusManager.getStatistics()
  };
}

/**
 * Simple hook that just returns online/offline status
 */
export function useOnlineStatus(): boolean {
  const { isOnline } = useNetworkStatus();
  return isOnline;
}

/**
 * Hook that returns true when suitable for cloud operations
 */
export function useCloudOperationStatus(): {
  isSuitable: boolean;
  isOnline: boolean;
  quality: string;
  reason?: string;
} {
  const { isOnline, connectionQuality, status } = useNetworkStatus();

  let reason: string | undefined;
  if (!isOnline) {
    reason = 'No internet connection';
  } else if (status.saveData) {
    reason = 'Data saver mode enabled';
  } else if (connectionQuality === 'poor') {
    reason = 'Poor connection quality';
  }

  return {
    isSuitable: networkStatusManager.isSuitableForCloudOperations(),
    isOnline,
    quality: connectionQuality,
    reason
  };
}

/**
 * Hook for getting detailed network information
 */
export function useNetworkInfo(): {
  connectionType: NetworkStatus['connectionType'];
  effectiveType: NetworkStatus['effectiveType'];
  downlink: number;
  rtt: number;
  saveData: boolean;
} {
  const { status } = useNetworkStatus();

  return {
    connectionType: status.connectionType,
    effectiveType: status.effectiveType,
    downlink: status.downlink,
    rtt: status.rtt,
    saveData: status.saveData
  };
}