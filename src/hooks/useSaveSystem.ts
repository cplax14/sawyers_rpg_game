/**
 * Save System React Hook
 * Provides React components with save/load functionality and progress tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { SaveSystemManager, createDefaultSaveSystemConfig } from '../utils/saveSystemManager';
import {
  SaveSlotInfo,
  SaveOperationOptions,
  LoadOperationOptions,
  SaveExportOptions,
  SaveImportResult,
  SaveOperationResult,
  SaveSystemEvents,
  SaveSyncStatus
} from '../types/saveSystem';
import { ReactGameState } from '../types/game';

interface SaveProgress {
  isActive: boolean;
  progress: number;
  status: string;
}

interface UseSaveSystemResult {
  // Save System State
  isInitialized: boolean;
  saveSlots: SaveSlotInfo[];
  isLoading: boolean;
  error: string | null;

  // Progress Tracking
  saveProgress: SaveProgress;
  loadProgress: SaveProgress;

  // Storage Info
  storageUsed: number;
  storageTotal: number;
  storagePercentage: number;

  // Core Operations
  saveGame: (gameState: ReactGameState, options: SaveOperationOptions) => Promise<boolean>;
  loadGame: (options: LoadOperationOptions) => Promise<ReactGameState | null>;
  deleteSave: (slotNumber: number) => Promise<boolean>;
  refreshSlots: () => Promise<void>;

  // Import/Export
  exportSave: (slotNumber: number, options?: Partial<SaveExportOptions>) => Promise<Blob | null>;
  importSave: (file: File, targetSlot: number) => Promise<SaveImportResult>;

  // Utilities
  initializeSaveSystem: () => Promise<boolean>;
  cleanup: () => Promise<void>;
  getStorageInfo: () => Promise<void>;
  getFreshSlots: () => Promise<SaveSlotInfo[]>;
  updateSyncStatus: (slotNumber: number, status: SaveSyncStatus, isCloudAvailable?: boolean, lastError?: string | null) => Promise<boolean>;
}

export const useSaveSystem = (): UseSaveSystemResult => {
  const saveManagerRef = useRef<SaveSystemManager | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [saveSlots, setSaveSlots] = useState<SaveSlotInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Progress tracking
  const [saveProgress, setSaveProgress] = useState<SaveProgress>({
    isActive: false,
    progress: 0,
    status: ''
  });

  const [loadProgress, setLoadProgress] = useState<SaveProgress>({
    isActive: false,
    progress: 0,
    status: ''
  });

  // Storage tracking
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageTotal, setStorageTotal] = useState(0);
  const [storagePercentage, setStoragePercentage] = useState(0);

  // Initialize save manager with events
  const createSaveManager = useCallback(() => {
    if (saveManagerRef.current) return saveManagerRef.current;

    const config = createDefaultSaveSystemConfig();
    const events: SaveSystemEvents = {
      onSaveStarted: (slotNumber, saveName) => {
        setSaveProgress({ isActive: true, progress: 0, status: `Starting save to slot ${slotNumber + 1}...` });
        setError(null);
      },
      onSaveProgress: (progress, status) => {
        setSaveProgress({ isActive: true, progress, status });
      },
      onSaveCompleted: (slotNumber) => {
        setSaveProgress({ isActive: false, progress: 100, status: 'Save completed' });
        refreshSlots();
      },
      onSaveError: (error, slotNumber) => {
        setSaveProgress({ isActive: false, progress: 0, status: 'Save failed' });
        setError(`Save to slot ${slotNumber + 1} failed: ${error.message}`);
      },

      onLoadStarted: (slotNumber) => {
        setLoadProgress({ isActive: true, progress: 0, status: `Loading from slot ${slotNumber + 1}...` });
        setError(null);
      },
      onLoadProgress: (progress, status) => {
        setLoadProgress({ isActive: true, progress, status });
      },
      onLoadCompleted: (slotNumber) => {
        setLoadProgress({ isActive: false, progress: 100, status: 'Load completed' });
      },
      onLoadError: (error, slotNumber) => {
        setLoadProgress({ isActive: false, progress: 0, status: 'Load failed' });
        setError(`Load from slot ${slotNumber + 1} failed: ${error.message}`);
      },

      onQuotaWarning: (usedPercentage) => {
        console.warn(`Storage quota warning: ${usedPercentage.toFixed(1)}% used`);
      },
      onQuotaExceeded: () => {
        setError('Storage quota exceeded. Please delete some saves to free up space.');
      }
    };

    saveManagerRef.current = new SaveSystemManager(config, events);
    return saveManagerRef.current;
  }, []);

  // Initialize save system
  const initializeSaveSystem = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🚀 Initializing save system...');
      const saveManager = createSaveManager();
      const result = await saveManager.initialize();

      if (result.success) {
        console.log('✅ Save system initialized successfully');
        setIsInitialized(true);

        // Wait for state update to propagate
        await new Promise(resolve => setTimeout(resolve, 0));

        // Note: refreshSlots and getStorageInfo are called here but not in deps
        // to avoid circular dependency. They'll use the latest state values.
        await refreshSlots();
        await getStorageInfo();

        console.log('✅ Save system ready');
        return true;
      } else {
        console.error('❌ Save system initialization failed:', result.error);
        setError(result.error?.message || 'Failed to initialize save system');
        return false;
      }
    } catch (err) {
      console.error('❌ Save system initialization exception:', err);
      setError(err instanceof Error ? err.message : 'Unknown initialization error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [createSaveManager]);

  // Get fresh slots directly from IndexedDB without React state
  const getFreshSlots = useCallback(async (): Promise<SaveSlotInfo[]> => {
    if (!saveManagerRef.current) return [];

    try {
      const result = await saveManagerRef.current.getAllSaves();
      if (result.success && result.data) {
        return result.data;
      }
      return [];
    } catch (err) {
      console.error('Failed to get fresh slots:', err);
      return [];
    }
  }, []); // Remove isInitialized from dependency array

  // Refresh save slots
  const refreshSlots = useCallback(async (): Promise<void> => {
    // Only check for the actual manager reference, not React state
    if (!saveManagerRef.current) {
      console.warn('⚠️ Cannot refresh slots: manager not yet created');
      // Don't set error here - it's expected during initialization
      return;
    }

    try {
      console.log('🔄 Refreshing save slots...');
      const result = await saveManagerRef.current.getAllSaves();
      if (result.success) {
        const slots = result.data || [];
        console.log('✅ Save slots refreshed:', {
          totalSlots: slots.length,
          occupiedSlots: slots.filter(s => !s.isEmpty).length,
          slotNumbers: slots.filter(s => !s.isEmpty).map(s => s.slotNumber)
        });
        setSaveSlots(slots);
        // Clear any previous errors on success
        setError(null);
      } else {
        console.error('❌ Failed to refresh slots:', result.error);
        setError(result.error?.message || 'Failed to refresh save slots');
      }
    } catch (err) {
      console.error('❌ Exception refreshing slots:', err);
      // Only set error if it's not an initialization-related issue
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh save slots';
      if (!errorMessage.includes('not initialized')) {
        setError(errorMessage);
      }
    }
  }, []); // Remove isInitialized from dependency array

  // Save game
  const saveGame = useCallback(async (
    gameState: ReactGameState,
    options: SaveOperationOptions
  ): Promise<boolean> => {
    if (!saveManagerRef.current) {
      console.error('❌ Save failed: Save system not initialized');
      setError('Save system not initialized');
      return false;
    }

    try {
      const result = await saveManagerRef.current.saveGame(gameState, {
        ...options,
        onProgress: (progress, status) => {
          setSaveProgress({ isActive: true, progress, status });
          options.onProgress?.(progress, status);
        }
      });

      if (!result.success) {
        console.error('❌ Save failed:', result.error);
        setError(result.error?.message || 'Save operation failed');
      }

      return result.success;
    } catch (err) {
      console.error('❌ Save exception:', err);
      setError(err instanceof Error ? err.message : 'Save operation failed');
      return false;
    }
  }, []); // Remove isInitialized from dependency array

  // Load game
  const loadGame = useCallback(async (
    options: LoadOperationOptions
  ): Promise<ReactGameState | null> => {
    // Only check for actual manager, not React state
    if (!saveManagerRef.current) {
      setError('Save system not initialized');
      return null;
    }

    try {
      const result = await saveManagerRef.current.loadGame({
        ...options,
        onProgress: (progress, status) => {
          setLoadProgress({ isActive: true, progress, status });
          options.onProgress?.(progress, status);
        }
      });

      if (result.success) {
        return result.data!.gameState;
      } else {
        setError(result.error?.message || 'Load operation failed');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Load operation failed');
      return null;
    }
  }, []); // Remove isInitialized from dependency array

  // Delete save
  const deleteSave = useCallback(async (slotNumber: number): Promise<boolean> => {
    if (!saveManagerRef.current) {
      setError('Save system not initialized');
      return false;
    }

    try {
      const result = await saveManagerRef.current.deleteSave(slotNumber);
      if (result.success) {
        await refreshSlots();
        return true;
      } else {
        setError(result.error?.message || 'Delete operation failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete operation failed');
      return false;
    }
  }, [refreshSlots]); // Remove isInitialized from dependency array

  // Export save
  const exportSave = useCallback(async (
    slotNumber: number,
    options: Partial<SaveExportOptions> = {}
  ): Promise<Blob | null> => {
    if (!saveManagerRef.current || !isInitialized) {
      setError('Save system not initialized');
      return null;
    }

    try {
      const exportOptions: SaveExportOptions = {
        format: 'json',
        includeMetadata: true,
        compress: false,
        filename: `sawyers_rpg_save_slot_${slotNumber + 1}.json`,
        ...options
      };

      const result = await saveManagerRef.current.exportSave(slotNumber, exportOptions);

      if (result.success) {
        return result.data!;
      } else {
        setError(result.error?.message || 'Export operation failed');
        return null;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export operation failed');
      return null;
    }
  }, [isInitialized]);

  // Import save
  const importSave = useCallback(async (
    file: File,
    targetSlot: number
  ): Promise<SaveImportResult> => {
    if (!saveManagerRef.current || !isInitialized) {
      setError('Save system not initialized');
      return {
        success: false,
        errors: ['Save system not initialized'],
        warnings: [],
        sourceFormat: 'unknown'
      };
    }

    try {
      const result = await saveManagerRef.current.importSave(file, targetSlot);

      if (result.success) {
        await refreshSlots();
      } else if (result.errors.length > 0) {
        setError(`Import failed: ${result.errors.join(', ')}`);
      }

      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Import operation failed';
      setError(errorMsg);
      return {
        success: false,
        errors: [errorMsg],
        warnings: [],
        sourceFormat: 'unknown'
      };
    }
  }, [isInitialized, refreshSlots]);

  // Get storage info
  const getStorageInfo = useCallback(async (): Promise<void> => {
    if (!saveManagerRef.current || !isInitialized) return;

    try {
      const result = await saveManagerRef.current.getStorageInfo();
      if (result.success) {
        const { used, total, quotaPercentage } = result.data!;
        setStorageUsed(used);
        setStorageTotal(total);
        setStoragePercentage(quotaPercentage);
      }
    } catch (err) {
      console.warn('Failed to get storage info:', err);
    }
  }, [isInitialized]);

  // Update sync status
  const updateSyncStatus = useCallback(async (
    slotNumber: number,
    status: SaveSyncStatus,
    isCloudAvailable: boolean = false,
    lastError: string | null = null
  ): Promise<boolean> => {
    if (!saveManagerRef.current) {
      console.warn('Cannot update sync status: Save system not initialized');
      return false;
    }

    try {
      const result = await saveManagerRef.current.updateSyncStatus(slotNumber, status, isCloudAvailable, lastError);
      if (result.success) {
        // Refresh slots to update UI
        await refreshSlots();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update sync status:', err);
      return false;
    }
  }, [refreshSlots]);

  // Cleanup
  const cleanup = useCallback(async (): Promise<void> => {
    if (saveManagerRef.current) {
      try {
        await saveManagerRef.current.cleanup();
        await refreshSlots();
        await getStorageInfo();
      } catch (err) {
        console.warn('Cleanup failed:', err);
      }
    }
  }, [refreshSlots, getStorageInfo]);

  // Initialize on mount
  useEffect(() => {
    initializeSaveSystem();

    // Cleanup on unmount
    return () => {
      if (saveManagerRef.current) {
        saveManagerRef.current.close();
        saveManagerRef.current = null;
      }
    };
  }, [initializeSaveSystem]);

  // Periodic storage info updates
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      getStorageInfo();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [isInitialized, getStorageInfo]);

  return {
    // State
    isInitialized,
    saveSlots,
    isLoading,
    error,

    // Progress
    saveProgress,
    loadProgress,

    // Storage
    storageUsed,
    storageTotal,
    storagePercentage,

    // Operations
    saveGame,
    loadGame,
    deleteSave,
    refreshSlots,

    // Import/Export
    exportSave,
    importSave,

    // Utilities
    initializeSaveSystem,
    cleanup,
    getStorageInfo,
    getFreshSlots,
    updateSyncStatus
  };
};

export default useSaveSystem;