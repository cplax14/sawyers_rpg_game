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
  SaveSystemEvents
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

      const saveManager = createSaveManager();
      const result = await saveManager.initialize();

      if (result.success) {
        setIsInitialized(true);
        await refreshSlots();
        await getStorageInfo();
        return true;
      } else {
        setError(result.error?.message || 'Failed to initialize save system');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown initialization error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [createSaveManager]);

  // Refresh save slots
  const refreshSlots = useCallback(async (): Promise<void> => {
    if (!saveManagerRef.current || !isInitialized) return;

    try {
      const result = await saveManagerRef.current.getAllSaves();
      if (result.success) {
        setSaveSlots(result.data || []);
      } else {
        setError(result.error?.message || 'Failed to refresh save slots');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh save slots');
    }
  }, [isInitialized]);

  // Save game
  const saveGame = useCallback(async (
    gameState: ReactGameState,
    options: SaveOperationOptions
  ): Promise<boolean> => {
    if (!saveManagerRef.current || !isInitialized) {
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

      return result.success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save operation failed');
      return false;
    }
  }, [isInitialized]);

  // Load game
  const loadGame = useCallback(async (
    options: LoadOperationOptions
  ): Promise<ReactGameState | null> => {
    if (!saveManagerRef.current || !isInitialized) {
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
  }, [isInitialized]);

  // Delete save
  const deleteSave = useCallback(async (slotNumber: number): Promise<boolean> => {
    if (!saveManagerRef.current || !isInitialized) {
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
  }, [isInitialized, refreshSlots]);

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
    getStorageInfo
  };
};

export default useSaveSystem;