/**
 * Cloud Save Hook - Full Implementation with Comprehensive Error Handling
 * Integrates with Firebase cloud storage service with robust error handling
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { useAuth } from './useAuth';
import { useSaveSystem } from './useSaveSystem';
import { cloudStorageService, CloudStorageResult, CloudSaveData, CloudSaveListItem } from '../services/cloudStorage';
import { convertFirebaseError, logCloudError, createUserErrorMessage, getRecoveryActions, CloudError, CloudErrorCode, ErrorSeverity } from '../utils/cloudErrors';
import { ReactGameState } from '../types/game';

export interface CloudSaveHookResult {
  // State
  isInitialized: boolean;
  isOnline: boolean;
  lastSyncTime: number | null;
  syncInProgress: boolean;
  quota: {
    used: number;
    total: number;
    percentage: number;
  } | null;
  error: CloudError | null;
  conflicts: number;

  // Operations
  backupToCloud: (slotNumber: number, saveName?: string) => Promise<CloudStorageResult<any>>;
  restoreFromCloud: (slotNumber: number) => Promise<CloudStorageResult<any>>;
  syncSlot: (slotNumber: number) => Promise<CloudStorageResult<any>>;
  resolveConflict: (slotNumber: number, resolution: 'local' | 'cloud' | 'merge') => Promise<CloudStorageResult<any>>;
  triggerFullSync: () => Promise<CloudStorageResult<any>>;
  triggerQuickSync: () => Promise<CloudStorageResult<any>>;
  refreshSlots: () => Promise<CloudStorageResult<CloudSaveListItem[]>>;
  clearError: () => void;

  // Error handling
  getErrorMessage: (error?: CloudError) => string;
  getRecoveryActions: (error?: CloudError) => string[];
  canRetry: (error?: CloudError) => boolean;
}

export const useCloudSave = (): CloudSaveHookResult => {
  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [quota, setQuota] = useState<{ used: number; total: number; percentage: number } | null>(null);
  const [error, setError] = useState<CloudError | null>(null);
  const [conflicts, setConflicts] = useState(0);

  // Hooks
  const { user, isAuthenticated, error: authError } = useAuth();
  const { saveGame: saveLocal, loadGame: loadLocal, getSaveSlots } = useSaveSystem();

  // Refs for cleanup
  const operationRef = useRef<AbortController | null>(null);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize cloud save system
  useEffect(() => {
    const initialize = async () => {
      try {
        if (isAuthenticated && user && isOnline) {
          // Check quota
          await updateQuotaInfo(user);
          setIsInitialized(true);
        } else {
          setIsInitialized(false);
        }
      } catch (err) {
        const cloudError = convertFirebaseError(err);
        logCloudError(cloudError, 'useCloudSave initialization');
        setError(cloudError);
      }
    };

    initialize();
  }, [isAuthenticated, user, isOnline]);

  // Update quota information
  const updateQuotaInfo = useCallback(async (currentUser: User) => {
    try {
      const statsResult = await cloudStorageService.getStorageStats(currentUser);
      if (statsResult.success && statsResult.data) {
        setQuota({
          used: statsResult.data.totalSize,
          total: statsResult.data.quota,
          percentage: statsResult.data.usagePercentage
        });
      }
    } catch (err) {
      // Non-critical error, don't fail initialization
      console.warn('Failed to update quota info:', err);
    }
  }, []);

  // Error handling utilities
  const handleError = useCallback((err: any, operation: string): CloudError => {
    const cloudError = convertFirebaseError(err);
    cloudError.operationId = `${operation}_${Date.now()}`;
    logCloudError(cloudError, operation);
    setError(cloudError);
    return cloudError;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getErrorMessage = useCallback((cloudError?: CloudError): string => {
    const targetError = cloudError || error;
    return targetError ? createUserErrorMessage(targetError) : '';
  }, [error]);

  const getRecoveryActionsForError = useCallback((cloudError?: CloudError): string[] => {
    const targetError = cloudError || error;
    return targetError ? getRecoveryActions(targetError) : [];
  }, [error]);

  const canRetry = useCallback((cloudError?: CloudError): boolean => {
    const targetError = cloudError || error;
    return targetError ? targetError.retryable : false;
  }, [error]);

  // Pre-operation checks
  const preOperationCheck = useCallback((): CloudError | null => {
    if (!isOnline) {
      return {
        code: CloudErrorCode.NETWORK_UNAVAILABLE,
        message: 'No internet connection',
        severity: ErrorSeverity.HIGH,
        retryable: true,
        userMessage: 'Internet connection required for cloud operations',
        timestamp: new Date()
      };
    }

    if (!isAuthenticated || !user) {
      return {
        code: CloudErrorCode.AUTH_REQUIRED,
        message: 'User not authenticated',
        severity: ErrorSeverity.HIGH,
        retryable: false,
        userMessage: 'Please sign in to use cloud save features',
        timestamp: new Date()
      };
    }

    return null;
  }, [isOnline, isAuthenticated, user]);

  // Backup local save to cloud
  const backupToCloud = useCallback(async (slotNumber: number, saveName?: string): Promise<CloudStorageResult<any>> => {
    const checkError = preOperationCheck();
    if (checkError) {
      setError(checkError);
      return { success: false, error: { code: checkError.code, message: checkError.message } };
    }

    setSyncInProgress(true);
    clearError();

    try {
      // Get local save data
      const localSlots = getSaveSlots();
      const localSave = localSlots.find(slot => slot.id === slotNumber);

      if (!localSave) {
        throw new Error(`No local save found in slot ${slotNumber}`);
      }

      // Load the actual game state
      const gameState = await loadLocal(slotNumber);
      const displayName = saveName || localSave.name || `Save ${slotNumber}`;

      // Upload to cloud
      const result = await cloudStorageService.saveToCloud(
        user!,
        slotNumber,
        displayName,
        gameState as ReactGameState
      );

      if (result.success) {
        setLastSyncTime(Date.now());
        await updateQuotaInfo(user!);
      } else if (result.error) {
        handleError(new Error(result.error.message), 'backupToCloud');
      }

      return result;

    } catch (err) {
      handleError(err, 'backupToCloud');
      return {
        success: false,
        error: {
          code: 'BACKUP_FAILED',
          message: err instanceof Error ? err.message : 'Backup failed'
        }
      };
    } finally {
      setSyncInProgress(false);
    }
  }, [preOperationCheck, user, getSaveSlots, loadLocal, updateQuotaInfo, handleError, clearError]);

  // Restore cloud save to local
  const restoreFromCloud = useCallback(async (slotNumber: number): Promise<CloudStorageResult<any>> => {
    const checkError = preOperationCheck();
    if (checkError) {
      setError(checkError);
      return { success: false, error: { code: checkError.code, message: checkError.message } };
    }

    setSyncInProgress(true);
    clearError();

    try {
      // Load from cloud
      const result = await cloudStorageService.loadFromCloud(user!, slotNumber);

      if (result.success && result.data) {
        // Save to local storage
        await saveLocal(slotNumber, result.data.metadata.saveName, result.data.gameState as ReactGameState);
        setLastSyncTime(Date.now());
      } else if (result.error) {
        handleError(new Error(result.error.message), 'restoreFromCloud');
      }

      return result;

    } catch (err) {
      handleError(err, 'restoreFromCloud');
      return {
        success: false,
        error: {
          code: 'RESTORE_FAILED',
          message: err instanceof Error ? err.message : 'Restore failed'
        }
      };
    } finally {
      setSyncInProgress(false);
    }
  }, [preOperationCheck, user, saveLocal, handleError, clearError]);

  // Sync specific slot
  const syncSlot = useCallback(async (slotNumber: number): Promise<CloudStorageResult<any>> => {
    const checkError = preOperationCheck();
    if (checkError) {
      setError(checkError);
      return { success: false, error: { code: checkError.code, message: checkError.message } };
    }

    setSyncInProgress(true);
    clearError();

    try {
      // Get local save info
      const localSlots = getSaveSlots();
      const localSave = localSlots.find(slot => slot.id === slotNumber);

      // Get cloud saves
      const cloudSavesResult = await cloudStorageService.listCloudSaves(user!);
      if (!cloudSavesResult.success || !cloudSavesResult.data) {
        throw new Error('Failed to retrieve cloud saves for sync comparison');
      }

      const cloudSave = cloudSavesResult.data.find(save => save.slotNumber === slotNumber);

      // Determine sync action
      if (!localSave && !cloudSave) {
        return { success: true, data: { action: 'no_sync_needed' } };
      }

      if (localSave && !cloudSave) {
        // Upload local to cloud
        return await backupToCloud(slotNumber);
      }

      if (!localSave && cloudSave) {
        // Download cloud to local
        return await restoreFromCloud(slotNumber);
      }

      if (localSave && cloudSave) {
        // Compare timestamps
        const localTime = new Date(localSave.timestamp);
        const cloudTime = cloudSave.updatedAt;

        if (localTime > cloudTime) {
          // Local is newer, upload
          return await backupToCloud(slotNumber);
        } else if (cloudTime > localTime) {
          // Cloud is newer, download
          return await restoreFromCloud(slotNumber);
        } else {
          // Same timestamp, check for conflicts
          // For now, consider them synced
          return { success: true, data: { action: 'already_synced' } };
        }
      }

      return { success: true, data: { action: 'sync_completed' } };

    } catch (err) {
      handleError(err, 'syncSlot');
      return {
        success: false,
        error: {
          code: 'SYNC_FAILED',
          message: err instanceof Error ? err.message : 'Sync failed'
        }
      };
    } finally {
      setSyncInProgress(false);
    }
  }, [preOperationCheck, user, getSaveSlots, backupToCloud, restoreFromCloud, handleError, clearError]);

  // Resolve sync conflicts
  const resolveConflict = useCallback(async (slotNumber: number, resolution: 'local' | 'cloud' | 'merge'): Promise<CloudStorageResult<any>> => {
    setSyncInProgress(true);
    clearError();

    try {
      switch (resolution) {
        case 'local':
          // Keep local, overwrite cloud
          return await backupToCloud(slotNumber);

        case 'cloud':
          // Keep cloud, overwrite local
          return await restoreFromCloud(slotNumber);

        case 'merge':
          // TODO: Implement merge strategy
          throw new Error('Merge resolution not yet implemented');

        default:
          throw new Error(`Unknown resolution strategy: ${resolution}`);
      }
    } catch (err) {
      handleError(err, 'resolveConflict');
      return {
        success: false,
        error: {
          code: 'CONFLICT_RESOLUTION_FAILED',
          message: err instanceof Error ? err.message : 'Conflict resolution failed'
        }
      };
    } finally {
      setSyncInProgress(false);
    }
  }, [backupToCloud, restoreFromCloud, handleError, clearError]);

  // Full sync of all slots
  const triggerFullSync = useCallback(async (): Promise<CloudStorageResult<any>> => {
    const checkError = preOperationCheck();
    if (checkError) {
      setError(checkError);
      return { success: false, error: { code: checkError.code, message: checkError.message } };
    }

    setSyncInProgress(true);
    clearError();

    try {
      const localSlots = getSaveSlots();
      const results = await Promise.allSettled(
        localSlots.map(slot => syncSlot(slot.id))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;

      setLastSyncTime(Date.now());
      await updateQuotaInfo(user!);

      return {
        success: failed === 0,
        data: {
          successful,
          failed,
          total: results.length
        }
      };

    } catch (err) {
      handleError(err, 'triggerFullSync');
      return {
        success: false,
        error: {
          code: 'FULL_SYNC_FAILED',
          message: err instanceof Error ? err.message : 'Full sync failed'
        }
      };
    } finally {
      setSyncInProgress(false);
    }
  }, [preOperationCheck, user, getSaveSlots, syncSlot, updateQuotaInfo, handleError, clearError]);

  // Quick sync (changed saves only)
  const triggerQuickSync = useCallback(async (): Promise<CloudStorageResult<any>> => {
    // For now, use the same logic as full sync
    // In a full implementation, this would check timestamps and only sync changed saves
    return await triggerFullSync();
  }, [triggerFullSync]);

  // Refresh cloud save slots
  const refreshSlots = useCallback(async (): Promise<CloudStorageResult<CloudSaveListItem[]>> => {
    const checkError = preOperationCheck();
    if (checkError) {
      setError(checkError);
      return { success: false, error: { code: checkError.code, message: checkError.message } };
    }

    try {
      const result = await cloudStorageService.listCloudSaves(user!);
      if (result.success) {
        await updateQuotaInfo(user!);
      }
      return result;
    } catch (err) {
      handleError(err, 'refreshSlots');
      return {
        success: false,
        error: {
          code: 'REFRESH_FAILED',
          message: err instanceof Error ? err.message : 'Failed to refresh slots'
        }
      };
    }
  }, [preOperationCheck, user, updateQuotaInfo, handleError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (operationRef.current) {
        operationRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    isInitialized,
    isOnline,
    lastSyncTime,
    syncInProgress,
    quota,
    error,
    conflicts,

    // Operations
    backupToCloud,
    restoreFromCloud,
    syncSlot,
    resolveConflict,
    triggerFullSync,
    triggerQuickSync,
    refreshSlots,
    clearError,

    // Error handling
    getErrorMessage,
    getRecoveryActions: getRecoveryActionsForError,
    canRetry
  };
};

export default useCloudSave;