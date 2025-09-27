/**
 * Smart Save Hook
 * Automatically handles save operations with graceful degradation
 */

import { useCallback, useState, useEffect } from 'react';
import { ServiceMode, useServiceMode, serviceModeManager } from '../utils/serviceMode';
import { useSaveSystem } from './useSaveSystem';
import { useCloudSave } from './useCloudSave';
import { useAuth } from './useAuth';
import { ReactGameState } from '../types/game';
import { CloudError, CloudErrorCode } from '../utils/cloudErrors';

export interface SmartSaveResult {
  success: boolean;
  savedTo: 'cloud' | 'local' | 'both';
  message: string;
  error?: CloudError;
  fallbackUsed?: boolean;
}

export interface SmartSaveConfig {
  preferCloud: boolean;
  autoFallback: boolean;
  requireConfirmation: boolean;
  syncWhenRestored: boolean;
}

export const useSmartSave = (config: Partial<SmartSaveConfig> = {}) => {
  const defaultConfig: SmartSaveConfig = {
    preferCloud: true,
    autoFallback: true,
    requireConfirmation: false,
    syncWhenRestored: true,
    ...config
  };

  const [lastSaveAttempt, setLastSaveAttempt] = useState<Date | null>(null);
  const [pendingCloudSaves, setPendingCloudSaves] = useState<number[]>([]);

  const { mode, isCapabilityAvailable } = useServiceMode();
  const { isAuthenticated } = useAuth();
  const { saveGame: saveLocal, loadGame: loadLocal, getSaveSlots } = useSaveSystem();
  const {
    backupToCloud,
    restoreFromCloud,
    syncSlot,
    isOnline,
    syncInProgress
  } = useCloudSave();

  // Monitor service mode changes to handle pending saves
  useEffect(() => {
    const handleModeChange = (newConfig: any) => {
      if (newConfig.mode === ServiceMode.CLOUD_ENABLED && pendingCloudSaves.length > 0) {
        // Cloud is back online, sync pending saves
        if (defaultConfig.syncWhenRestored) {
          processPendingCloudSaves();
        }
      }
    };

    return serviceModeManager.subscribe(handleModeChange);
  }, [pendingCloudSaves, defaultConfig.syncWhenRestored]);

  /**
   * Smart save operation that chooses the best available method
   */
  const smartSave = useCallback(async (
    slotNumber: number,
    saveName: string,
    gameState: ReactGameState,
    options: {
      forceLocal?: boolean;
      forceCloud?: boolean;
      skipFallback?: boolean;
    } = {}
  ): Promise<SmartSaveResult> => {
    setLastSaveAttempt(new Date());

    // Determine save strategy based on service mode and options
    const canUseCloud = isCapabilityAvailable('cloud_save') &&
                       isAuthenticated &&
                       isOnline &&
                       !options.forceLocal;

    const shouldUseCloud = canUseCloud &&
                          (defaultConfig.preferCloud || options.forceCloud) &&
                          mode !== ServiceMode.LOCAL_ONLY;

    try {
      if (shouldUseCloud) {
        // Attempt cloud save first
        try {
          const cloudResult = await backupToCloud(slotNumber, saveName);

          if (cloudResult.success) {
            // Also save locally as backup
            await saveLocal(slotNumber, saveName, gameState);

            return {
              success: true,
              savedTo: 'both',
              message: 'Saved to cloud and local storage',
              fallbackUsed: false
            };
          } else {
            // Cloud save failed, fall back to local if allowed
            if (defaultConfig.autoFallback && !options.skipFallback) {
              await saveLocal(slotNumber, saveName, gameState);

              // Queue for later cloud sync
              serviceModeManager.queuePendingSync('save', {
                slotNumber,
                saveName,
                gameState
              });

              setPendingCloudSaves(prev => [...prev.filter(slot => slot !== slotNumber), slotNumber]);

              return {
                success: true,
                savedTo: 'local',
                message: 'Saved locally (cloud unavailable, will sync when restored)',
                fallbackUsed: true,
                error: cloudResult.error ? {
                  code: cloudResult.error.code as CloudErrorCode,
                  message: cloudResult.error.message,
                  severity: 'medium' as any,
                  retryable: true,
                  userMessage: 'Cloud save failed, saved locally instead',
                  timestamp: new Date()
                } : undefined
              };
            } else {
              return {
                success: false,
                savedTo: 'local',
                message: 'Cloud save failed and fallback disabled',
                error: cloudResult.error ? {
                  code: cloudResult.error.code as CloudErrorCode,
                  message: cloudResult.error.message,
                  severity: 'high' as any,
                  retryable: true,
                  userMessage: cloudResult.error.message,
                  timestamp: new Date()
                } : undefined
              };
            }
          }
        } catch (cloudError) {
          // Handle cloud save exception
          if (defaultConfig.autoFallback && !options.skipFallback) {
            await saveLocal(slotNumber, saveName, gameState);

            serviceModeManager.queuePendingSync('save', {
              slotNumber,
              saveName,
              gameState
            });

            setPendingCloudSaves(prev => [...prev.filter(slot => slot !== slotNumber), slotNumber]);

            return {
              success: true,
              savedTo: 'local',
              message: 'Saved locally (cloud error, will sync when restored)',
              fallbackUsed: true,
              error: {
                code: CloudErrorCode.OPERATION_FAILED,
                message: cloudError instanceof Error ? cloudError.message : 'Unknown cloud error',
                severity: 'medium' as any,
                retryable: true,
                userMessage: 'Cloud save failed due to error, saved locally instead',
                timestamp: new Date()
              }
            };
          } else {
            throw cloudError;
          }
        }
      } else {
        // Save locally only
        await saveLocal(slotNumber, saveName, gameState);

        const reason = !canUseCloud ?
          (isAuthenticated ? 'Cloud service unavailable' : 'Not signed in') :
          'Local save requested';

        return {
          success: true,
          savedTo: 'local',
          message: `Saved locally (${reason})`,
          fallbackUsed: false
        };
      }
    } catch (error) {
      return {
        success: false,
        savedTo: 'local',
        message: error instanceof Error ? error.message : 'Save operation failed',
        error: {
          code: CloudErrorCode.OPERATION_FAILED,
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 'high' as any,
          retryable: true,
          userMessage: 'Save operation failed',
          timestamp: new Date()
        }
      };
    }
  }, [
    mode,
    isCapabilityAvailable,
    isAuthenticated,
    isOnline,
    defaultConfig,
    backupToCloud,
    saveLocal
  ]);

  /**
   * Smart load operation that chooses the best available source
   */
  const smartLoad = useCallback(async (
    slotNumber: number,
    options: {
      preferCloud?: boolean;
      fallbackToLocal?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    gameState?: ReactGameState;
    loadedFrom: 'cloud' | 'local';
    message: string;
    error?: CloudError;
  }> => {
    const canUseCloud = isCapabilityAvailable('cloud_load') &&
                       isAuthenticated &&
                       isOnline;

    const shouldTryCloud = canUseCloud &&
                          (options.preferCloud ?? defaultConfig.preferCloud) &&
                          mode !== ServiceMode.LOCAL_ONLY;

    try {
      if (shouldTryCloud) {
        // Try cloud load first
        try {
          const cloudResult = await restoreFromCloud(slotNumber);

          if (cloudResult.success && cloudResult.data) {
            return {
              success: true,
              gameState: cloudResult.data.gameState as ReactGameState,
              loadedFrom: 'cloud',
              message: 'Loaded from cloud storage'
            };
          } else {
            // Cloud load failed, try local if fallback enabled
            if (options.fallbackToLocal !== false) {
              const localGameState = await loadLocal(slotNumber);
              return {
                success: true,
                gameState: localGameState,
                loadedFrom: 'local',
                message: 'Loaded from local storage (cloud unavailable)'
              };
            } else {
              return {
                success: false,
                loadedFrom: 'cloud',
                message: 'Cloud load failed and local fallback disabled'
              };
            }
          }
        } catch (cloudError) {
          // Cloud load exception, try local if fallback enabled
          if (options.fallbackToLocal !== false) {
            const localGameState = await loadLocal(slotNumber);
            return {
              success: true,
              gameState: localGameState,
              loadedFrom: 'local',
              message: 'Loaded from local storage (cloud error)'
            };
          } else {
            throw cloudError;
          }
        }
      } else {
        // Load locally only
        const localGameState = await loadLocal(slotNumber);

        const reason = !canUseCloud ?
          (isAuthenticated ? 'Cloud service unavailable' : 'Not signed in') :
          'Local load requested';

        return {
          success: true,
          gameState: localGameState,
          loadedFrom: 'local',
          message: `Loaded from local storage (${reason})`
        };
      }
    } catch (error) {
      return {
        success: false,
        loadedFrom: 'local',
        message: error instanceof Error ? error.message : 'Load operation failed',
        error: {
          code: CloudErrorCode.OPERATION_FAILED,
          message: error instanceof Error ? error.message : 'Unknown error',
          severity: 'high' as any,
          retryable: true,
          userMessage: 'Load operation failed',
          timestamp: new Date()
        }
      };
    }
  }, [
    mode,
    isCapabilityAvailable,
    isAuthenticated,
    isOnline,
    defaultConfig.preferCloud,
    restoreFromCloud,
    loadLocal
  ]);

  /**
   * Process pending cloud saves when service is restored
   */
  const processPendingCloudSaves = useCallback(async () => {
    if (pendingCloudSaves.length === 0 || mode !== ServiceMode.CLOUD_ENABLED) {
      return;
    }

    console.log(`Processing ${pendingCloudSaves.length} pending cloud saves...`);

    for (const slotNumber of pendingCloudSaves) {
      try {
        const syncResult = await syncSlot(slotNumber);
        if (syncResult.success) {
          setPendingCloudSaves(prev => prev.filter(slot => slot !== slotNumber));
        }
      } catch (error) {
        console.error(`Failed to sync slot ${slotNumber}:`, error);
      }
    }
  }, [pendingCloudSaves, mode, syncSlot]);

  /**
   * Manually sync all pending saves
   */
  const syncPendingSaves = useCallback(async (): Promise<{
    synced: number;
    failed: number;
    total: number;
  }> => {
    if (mode !== ServiceMode.CLOUD_ENABLED) {
      return { synced: 0, failed: 0, total: pendingCloudSaves.length };
    }

    const total = pendingCloudSaves.length;
    let synced = 0;
    let failed = 0;

    for (const slotNumber of [...pendingCloudSaves]) {
      try {
        const result = await syncSlot(slotNumber);
        if (result.success) {
          synced++;
          setPendingCloudSaves(prev => prev.filter(slot => slot !== slotNumber));
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        console.error(`Failed to sync slot ${slotNumber}:`, error);
      }
    }

    return { synced, failed, total };
  }, [mode, pendingCloudSaves, syncSlot]);

  /**
   * Get current save status and recommendations
   */
  const getSaveStatus = useCallback(() => {
    const cloudAvailable = isCapabilityAvailable('cloud_save') && isAuthenticated && isOnline;
    const recommendedMode = cloudAvailable && defaultConfig.preferCloud ? 'cloud' : 'local';

    return {
      cloudAvailable,
      localAvailable: true,
      recommendedMode,
      pendingCloudSaves: pendingCloudSaves.length,
      lastSaveAttempt,
      serviceMode: mode,
      syncInProgress
    };
  }, [
    isCapabilityAvailable,
    isAuthenticated,
    isOnline,
    defaultConfig.preferCloud,
    pendingCloudSaves.length,
    lastSaveAttempt,
    mode,
    syncInProgress
  ]);

  return {
    smartSave,
    smartLoad,
    syncPendingSaves,
    getSaveStatus,
    pendingCloudSaves: pendingCloudSaves.length,
    canUseCloud: isCapabilityAvailable('cloud_save') && isAuthenticated && isOnline,
    serviceMode: mode
  };
};