/**
 * Auto-Save Integration Hook
 * Integrates auto-save functionality with the existing save system
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useGameState } from './useGameState';
import { useSaveSystem } from './useSaveSystem';
import { useSaveRecovery } from './useSaveRecovery';
import { AutoSaveManager, AutoSaveConfig, AutoSaveState, createDefaultAutoSaveConfig } from '../utils/autoSave';
import { ReactGameState } from '../types/game';
import { getHighestPriorityStoryMoment, StoryMoment } from '../utils/storyMoments';

interface PauseReason {
  reason: string;
  priority: number; // Higher priority reasons override lower priority ones
  source: 'system' | 'combat' | 'story' | 'user';
}

/**
 * Determines if auto-save should be paused based on current game state
 */
const getShouldPauseAutoSave = (state: ReactGameState): PauseReason | null => {
  // Priority 1: Game is loading
  if (state.isLoading) {
    return {
      reason: 'Game is loading',
      priority: 1,
      source: 'system'
    };
  }

  // Priority 2: Combat (if setting is enabled)
  if (state.settings.autoSavePauseDuringCombat && state.currentScreen === 'combat') {
    return {
      reason: 'Combat in progress',
      priority: 2,
      source: 'combat'
    };
  }

  // Priority 3: Character creation screen
  if (state.currentScreen === 'character-selection' && !state.player) {
    return {
      reason: 'Character creation in progress',
      priority: 3,
      source: 'system'
    };
  }

  // Priority 4: Important story moments (using the story moment system)
  const activeStoryMoment = getHighestPriorityStoryMoment(state.storyFlags);
  if (activeStoryMoment) {
    const priorityMap = { critical: 1, high: 2, medium: 3, low: 4 };
    return {
      reason: activeStoryMoment.description,
      priority: 4,
      source: 'story'
    };
  }

  // Priority 5: Settings screen (to avoid saving while user is changing settings)
  if (state.currentScreen === 'settings') {
    return {
      reason: 'Settings menu open',
      priority: 5,
      source: 'user'
    };
  }

  return null;
};

interface UseAutoSaveOptions {
  /** Auto-save configuration overrides */
  config?: Partial<AutoSaveConfig>;
  /** Whether to start auto-save immediately */
  autoStart?: boolean;
  /** Custom save slot for auto-saves (defaults to slot 0) */
  autoSaveSlot?: number;
}

interface UseAutoSaveResult {
  // Auto-save state
  autoSaveState: AutoSaveState;
  autoSaveConfig: AutoSaveConfig;
  isAutoSaveActive: boolean;
  lastAutoSave: Date | null;
  pauseReason: PauseReason | null;

  // Auto-save controls
  startAutoSave: () => void;
  stopAutoSave: () => void;
  pauseAutoSave: () => void;
  resumeAutoSave: () => void;
  forceAutoSave: () => Promise<boolean>;
  updateAutoSaveConfig: (config: Partial<AutoSaveConfig>) => void;

  // Manual save integration
  saveGame: (slotIndex: number, saveName?: string) => Promise<boolean>;
  saveGameWithoutAutoSave: (slotIndex: number, saveName?: string) => Promise<boolean>;

  // Status and utilities
  getTimeUntilNextAutoSave: () => number;
  formatTimeUntilNext: () => string;
  getAutoSaveStatus: () => string;
  getPauseReason: () => PauseReason | null;
}

export const useAutoSave = (options: UseAutoSaveOptions = {}): UseAutoSaveResult => {
  const { state } = useGameState();
  const { saveGame: systemSaveGame, isInitialized } = useSaveSystem();
  const {
    startTrackingSave,
    completeSaveTracking,
    failSaveTracking,
    checkForRecovery
  } = useSaveRecovery({ autoCheck: true });

  const autoSaveManagerRef = useRef<AutoSaveManager | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>({
    isActive: false,
    isPaused: false,
    nextSaveTime: 0,
    consecutiveFailures: 0,
    lastSaveTime: 0,
    lastSaveSuccess: true
  });
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [pauseReason, setPauseReason] = useState<PauseReason | null>(null);

  const config = useMemo(() => {
    // Defensive validation of settings to prevent NaN/undefined
    const safeAutoSaveInterval = typeof state.settings.autoSaveInterval === 'number' &&
                                  !isNaN(state.settings.autoSaveInterval) &&
                                  isFinite(state.settings.autoSaveInterval)
      ? state.settings.autoSaveInterval
      : 2.5; // Default 2.5 minutes

    const safeAutoSaveSlot = typeof options.autoSaveSlot === 'number' &&
                             !isNaN(options.autoSaveSlot) &&
                             isFinite(options.autoSaveSlot)
      ? options.autoSaveSlot
      : 0;

    const safeMaxFailures = typeof state.settings.autoSaveMaxFailures === 'number' &&
                            !isNaN(state.settings.autoSaveMaxFailures) &&
                            isFinite(state.settings.autoSaveMaxFailures)
      ? state.settings.autoSaveMaxFailures
      : 3;

    return {
      ...createDefaultAutoSaveConfig(),
      autoSaveSlot: safeAutoSaveSlot,
      interval: safeAutoSaveInterval * 60 * 1000, // Convert minutes to milliseconds
      enabled: state.settings.autoSave ?? true,
      maxFailures: safeMaxFailures,
      ...options.config
    };
  }, [options.config, options.autoSaveSlot, state.settings]);

  // Initialize auto-save manager
  const initializeAutoSave = useCallback(() => {
    if (autoSaveManagerRef.current || !isInitialized) return;

    const callbacks = {
      onSave: async (gameState: ReactGameState, slotNumber: number): Promise<boolean> => {
        const saveName = `Auto-Save ${new Date().toLocaleString()}`;
        let operation;

        try {
          // Start tracking the save operation
          operation = startTrackingSave(slotNumber, saveName, gameState);

          const success = await systemSaveGame(gameState, {
            slotNumber,
            saveName,
            includeScreenshot: false,
            syncToCloud: false // Auto-saves are local only by default
          });

          if (success) {
            setLastAutoSave(new Date());
            completeSaveTracking(operation.id);
          } else {
            failSaveTracking(operation.id, 'Save operation returned false');
          }

          return success;
        } catch (error) {
          console.error('Auto-save failed:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          if (operation) {
            failSaveTracking(operation.id, errorMessage);
          }

          return false;
        }
      },

      onSaveSuccess: (timestamp: number, slotNumber: number) => {
        console.log(`Auto-save completed successfully to slot ${slotNumber}`);
        setLastAutoSave(new Date(timestamp));
      },

      onSaveError: (error: Error, consecutiveFailures: number) => {
        console.warn(`Auto-save failed (${consecutiveFailures} consecutive failures):`, error.message);
      },

      onAutoSaveDisabled: (reason: string) => {
        console.error(`Auto-save disabled: ${reason}`);
      },

      getGameState: (): ReactGameState | null => {
        // Only auto-save if there's a player created
        return state.player ? state : null;
      }
    };

    autoSaveManagerRef.current = new AutoSaveManager(config, callbacks);

    // Set up state synchronization
    const updateState = () => {
      if (autoSaveManagerRef.current) {
        setAutoSaveState(autoSaveManagerRef.current.getState());
      }
    };

    // Update state periodically
    const stateInterval = setInterval(updateState, 1000);
    updateState(); // Initial update

    // Store cleanup function
    const cleanup = () => {
      clearInterval(stateInterval);
      if (autoSaveManagerRef.current) {
        autoSaveManagerRef.current.destroy();
        autoSaveManagerRef.current = null;
      }
    };

    // Set global reference for context triggers
    if (typeof window !== 'undefined') {
      window.gameAutoSaveManager = autoSaveManagerRef.current;
    }

    return cleanup;
  }, [isInitialized, systemSaveGame, config, state]);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) return;

    const cleanup = initializeAutoSave();

    // Auto-start if requested
    if (options.autoStart !== false && state.player) {
      setTimeout(() => startAutoSave(), 100);
    }

    return cleanup;
  }, [isInitialized, initializeAutoSave, options.autoStart, state.player]);

  // Auto-save controls
  const startAutoSave = useCallback(() => {
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.start();
    }
  }, []);

  const stopAutoSave = useCallback(() => {
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.stop();
    }
  }, []);

  const pauseAutoSave = useCallback(() => {
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.pause();
    }
  }, []);

  const resumeAutoSave = useCallback(() => {
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.resume();
    }
  }, []);

  const forceAutoSave = useCallback(async (): Promise<boolean> => {
    if (autoSaveManagerRef.current) {
      return await autoSaveManagerRef.current.forceSave();
    }
    return false;
  }, []);

  const updateAutoSaveConfig = useCallback((newConfig: Partial<AutoSaveConfig>) => {
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.updateConfig(newConfig);
    }
  }, []);

  // Enhanced save function that updates activity
  const saveGame = useCallback(async (slotIndex: number, saveName?: string): Promise<boolean> => {
    // Update auto-save activity to show user is active
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.updateActivity();
    }

    if (!state) return false;

    const finalSaveName = saveName || `Save ${slotIndex + 1}`;
    let operation;

    try {
      // Start tracking the save operation
      operation = startTrackingSave(slotIndex, finalSaveName, state);

      const success = await systemSaveGame(state, {
        slotNumber: slotIndex,
        saveName: finalSaveName,
        includeScreenshot: true,
        syncToCloud: false
      });

      if (success) {
        completeSaveTracking(operation.id);
      } else {
        failSaveTracking(operation.id, 'Manual save operation returned false');
      }

      return success;
    } catch (error) {
      console.error('Manual save failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (operation) {
        failSaveTracking(operation.id, errorMessage);
      }

      return false;
    }
  }, [systemSaveGame, state, startTrackingSave, completeSaveTracking, failSaveTracking]);

  // Save function that doesn't interfere with auto-save
  const saveGameWithoutAutoSave = useCallback(async (slotIndex: number, saveName?: string): Promise<boolean> => {
    if (!state) return false;

    try {
      const success = await systemSaveGame(state, {
        slotNumber: slotIndex,
        saveName: saveName || `Save ${slotIndex + 1}`,
        includeScreenshot: true,
        syncToCloud: false
      });

      return success;
    } catch (error) {
      console.error('Manual save failed:', error);
      return false;
    }
  }, [systemSaveGame, state]);

  // Utility functions
  const getTimeUntilNextAutoSave = useCallback((): number => {
    return Math.max(0, autoSaveState.nextSaveTime - Date.now());
  }, [autoSaveState.nextSaveTime]);

  const formatTimeUntilNext = useCallback((): string => {
    const timeRemaining = getTimeUntilNextAutoSave();
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);

    if (timeRemaining === 0) return 'Now';
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }, [getTimeUntilNextAutoSave]);

  const getAutoSaveStatus = useCallback((): string => {
    if (!autoSaveState.isActive) return 'Disabled';
    if (autoSaveState.isPaused) {
      return pauseReason ? `Paused: ${pauseReason.reason}` : 'Paused';
    }
    if (!state.player) return 'Waiting for player';

    const timeUntilNext = getTimeUntilNextAutoSave();
    if (timeUntilNext === 0) return 'Saving...';

    return `Next save in ${formatTimeUntilNext()}`;
  }, [autoSaveState, state.player, pauseReason, getTimeUntilNextAutoSave, formatTimeUntilNext]);

  const getPauseReason = useCallback((): PauseReason | null => {
    return pauseReason;
  }, [pauseReason]);

  // Track user activity for auto-save
  useEffect(() => {
    if (!autoSaveManagerRef.current) return;

    const updateActivity = () => {
      if (autoSaveManagerRef.current) {
        autoSaveManagerRef.current.updateActivity();
      }
    };

    // Track user interactions
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Auto-pause during combat and important moments
  useEffect(() => {
    if (!autoSaveManagerRef.current) return;

    const shouldPause = getShouldPauseAutoSave(state);

    if (shouldPause && !autoSaveState.isPaused) {
      pauseAutoSave();
      setPauseReason(shouldPause);
      console.log('Auto-save paused:', shouldPause.reason, `(${shouldPause.source})`);
    } else if (!shouldPause && autoSaveState.isPaused && autoSaveState.isActive) {
      // Resume if we should no longer be paused and we're still active
      resumeAutoSave();
      setPauseReason(null);
      console.log('Auto-save resumed');
    } else if (!shouldPause && pauseReason) {
      // Clear pause reason if we're no longer paused but haven't resumed yet
      setPauseReason(null);
    }
  }, [state.currentScreen, state.settings.autoSavePauseDuringCombat, state.storyFlags, state.isLoading, pauseAutoSave, resumeAutoSave, autoSaveState.isPaused, autoSaveState.isActive]);

  // Update auto-save configuration when settings change
  useEffect(() => {
    if (autoSaveManagerRef.current) {
      autoSaveManagerRef.current.updateConfig(config);
    }
  }, [config]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveManagerRef.current) {
        autoSaveManagerRef.current.destroy();
        autoSaveManagerRef.current = null;
      }

      if (typeof window !== 'undefined') {
        delete window.gameAutoSaveManager;
      }
    };
  }, []);

  return {
    // State
    autoSaveState,
    autoSaveConfig: config,
    isAutoSaveActive: autoSaveState.isActive,
    lastAutoSave,
    pauseReason,

    // Controls
    startAutoSave,
    stopAutoSave,
    pauseAutoSave,
    resumeAutoSave,
    forceAutoSave,
    updateAutoSaveConfig,

    // Save functions
    saveGame,
    saveGameWithoutAutoSave,

    // Utilities
    getTimeUntilNextAutoSave,
    formatTimeUntilNext,
    getAutoSaveStatus,
    getPauseReason
  };
};

export default useAutoSave;