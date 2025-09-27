/**
 * Optimized Auto-Save Hook
 * Performance-optimized auto-save with minimal gameplay impact
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useGameState } from './useGameState';
import { useSaveSystem } from './useSaveSystem';
import { useSmartSave } from './useSmartSave';
import {
  OptimizedAutoSaveManager,
  OptimizedAutoSaveConfig,
  OptimizedAutoSaveState,
  PerformanceMetrics,
  createOptimizedAutoSaveConfig,
  shouldPauseForPerformance
} from '../utils/autoSaveOptimized';
import { ReactGameState } from '../types/game';

interface PerformancePauseReason {
  reason: string;
  priority: number;
  source: 'performance' | 'system' | 'combat' | 'story' | 'user';
  metrics?: {
    fps: number;
    serializationTime: number;
    saveSize: number;
  };
}

/**
 * Enhanced pause detection with performance considerations
 */
const getOptimizedPauseReason = (
  state: ReactGameState,
  performanceMetrics: PerformanceMetrics,
  currentFPS: number
): PerformancePauseReason | null => {
  // Priority 1: Performance issues
  if (shouldPauseForPerformance(performanceMetrics, currentFPS)) {
    return {
      reason: currentFPS < 25 ? 'Low frame rate detected' : 'Save operation taking too long',
      priority: 1,
      source: 'performance',
      metrics: {
        fps: currentFPS,
        serializationTime: performanceMetrics.averageSerializationTime,
        saveSize: performanceMetrics.averageSaveSize
      }
    };
  }

  // Priority 2: System loading
  if (state.isLoading) {
    return {
      reason: 'Game is loading',
      priority: 2,
      source: 'system'
    };
  }

  // Priority 3: Combat (if enabled)
  if (state.settings?.autoSavePauseDuringCombat && state.currentScreen === 'combat') {
    return {
      reason: 'Combat in progress',
      priority: 3,
      source: 'combat'
    };
  }

  // Priority 4: Character creation
  if (state.currentScreen === 'character-selection' && !state.player) {
    return {
      reason: 'Character creation in progress',
      priority: 4,
      source: 'system'
    };
  }

  // Priority 5: Settings screen
  if (state.currentScreen === 'settings') {
    return {
      reason: 'Settings menu open',
      priority: 5,
      source: 'user'
    };
  }

  return null;
};

/**
 * Detect significant changes in game state for optimized saving
 */
const hasSignificantGameChanges = (
  lastState: ReactGameState,
  currentState: ReactGameState
): boolean => {
  // Player progress changes
  if (
    lastState.player.level !== currentState.player.level ||
    Math.abs(lastState.player.experience - currentState.player.experience) > 100 ||
    lastState.player.currentArea !== currentState.player.currentArea
  ) {
    return true;
  }

  // Inventory changes (significant item additions/removals)
  if (Math.abs(lastState.inventory.items.length - currentState.inventory.items.length) > 5) {
    return true;
  }

  // Story progress
  if (
    lastState.story.currentChapter !== currentState.story.currentChapter ||
    lastState.story.completedQuests.length !== currentState.story.completedQuests.length
  ) {
    return true;
  }

  // Major flag changes (more than 5 flags changed)
  const lastFlags = Object.keys(lastState.gameFlags);
  const currentFlags = Object.keys(currentState.gameFlags);
  const flagDifference = Math.abs(lastFlags.length - currentFlags.length);

  if (flagDifference > 5) {
    return true;
  }

  // Check for important flag changes
  const importantFlags = [
    'tutorial_completed',
    'first_boss_defeated',
    'chapter_completed',
    'major_quest_completed'
  ];

  for (const flag of importantFlags) {
    if (lastState.gameFlags[flag] !== currentState.gameFlags[flag]) {
      return true;
    }
  }

  return false;
};

interface UseOptimizedAutoSaveOptions {
  /** Auto-save configuration overrides */
  config?: Partial<OptimizedAutoSaveConfig>;
  /** Whether to start auto-save immediately */
  autoStart?: boolean;
  /** Custom save slot for auto-saves */
  autoSaveSlot?: number;
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  /** FPS threshold for performance pausing */
  fpsThreshold?: number;
}

interface UseOptimizedAutoSaveResult {
  // Auto-save state
  autoSaveState: OptimizedAutoSaveState;
  autoSaveConfig: OptimizedAutoSaveConfig;
  isAutoSaveActive: boolean;
  lastAutoSave: Date | null;
  pauseReason: PerformancePauseReason | null;
  performanceMetrics: PerformanceMetrics;

  // Performance monitoring
  currentFPS: number;
  isPerformanceOptimal: boolean;
  serializationEfficiency: number; // 0-100%

  // Auto-save controls
  startAutoSave: () => void;
  stopAutoSave: () => void;
  pauseAutoSave: () => void;
  resumeAutoSave: () => void;
  forceAutoSave: () => Promise<boolean>;
  triggerAutoSave: () => void;
  updateAutoSaveConfig: (config: Partial<OptimizedAutoSaveConfig>) => void;

  // Performance controls
  optimizePerformance: () => void;
  resetPerformanceMetrics: () => void;
}

export const useOptimizedAutoSave = (
  options: UseOptimizedAutoSaveOptions = {}
): UseOptimizedAutoSaveResult => {
  const {
    config: configOverrides = {},
    autoStart = true,
    autoSaveSlot = 0,
    enablePerformanceMonitoring = true,
    fpsThreshold = 30
  } = options;

  // Hooks
  const gameState = useGameState();
  const { smartSave } = useSmartSave();

  // State
  const [autoSaveState, setAutoSaveState] = useState<OptimizedAutoSaveState>({
    isActive: false,
    isPaused: false,
    nextSaveTime: 0,
    consecutiveFailures: 0,
    lastSaveTime: 0,
    lastSaveSuccess: true,
    lastSaveSize: 0,
    serializationTime: 0,
    isDebouncing: false
  });

  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    averageSerializationTime: 0,
    maxSerializationTime: 0,
    averageSaveSize: 0,
    maxSaveSize: 0,
    totalSaves: 0,
    failedSaves: 0,
    debouncedSaves: 0
  });

  const [currentFPS, setCurrentFPS] = useState<number>(60);
  const [pauseReason, setPauseReason] = useState<PerformancePauseReason | null>(null);

  // Refs
  const autoSaveManagerRef = useRef<OptimizedAutoSaveManager | null>(null);
  const fpsMonitorRef = useRef<{
    frameCount: number;
    lastTime: number;
    intervalId: number | null;
  }>({ frameCount: 0, lastTime: performance.now(), intervalId: null });

  // Memoized config
  const autoSaveConfig = useMemo(() => ({
    ...createOptimizedAutoSaveConfig(),
    autoSaveSlot,
    ...configOverrides
  }), [autoSaveSlot, configOverrides]);

  // Performance monitoring
  useEffect(() => {
    if (!enablePerformanceMonitoring) return;

    const monitorFPS = () => {
      fpsMonitorRef.current.frameCount++;
      const currentTime = performance.now();

      if (currentTime - fpsMonitorRef.current.lastTime >= 1000) {
        const fps = fpsMonitorRef.current.frameCount /
          ((currentTime - fpsMonitorRef.current.lastTime) / 1000);

        setCurrentFPS(Math.round(fps));
        fpsMonitorRef.current.frameCount = 0;
        fpsMonitorRef.current.lastTime = currentTime;
      }

      fpsMonitorRef.current.intervalId = requestAnimationFrame(monitorFPS);
    };

    monitorFPS();

    return () => {
      if (fpsMonitorRef.current.intervalId) {
        cancelAnimationFrame(fpsMonitorRef.current.intervalId);
      }
    };
  }, [enablePerformanceMonitoring]);

  // Auto-save manager setup
  useEffect(() => {
    const callbacks = {
      onSave: async (gameState: ReactGameState, slotNumber: number) => {
        const result = await smartSave(slotNumber, 'Auto Save', gameState, {
          skipFallback: false
        });
        return result.success;
      },
      onSaveSuccess: (timestamp: number, slotNumber: number, metrics: { saveTime: number; saveSize: number }) => {
        setAutoSaveState(prev => ({
          ...prev,
          lastSaveTime: timestamp,
          lastSaveSuccess: true,
          consecutiveFailures: 0,
          lastSaveSize: metrics.saveSize,
          serializationTime: metrics.saveTime
        }));
      },
      onSaveError: (error: Error, consecutiveFailures: number) => {
        console.warn('Optimized auto-save failed:', error);
        setAutoSaveState(prev => ({
          ...prev,
          lastSaveSuccess: false,
          consecutiveFailures
        }));
      },
      onAutoSaveDisabled: (reason: string) => {
        console.warn('Optimized auto-save disabled:', reason);
        setAutoSaveState(prev => ({ ...prev, isActive: false }));
      },
      getGameState: () => gameState,
      hasSignificantChanges: hasSignificantGameChanges
    };

    autoSaveManagerRef.current = new OptimizedAutoSaveManager(autoSaveConfig, callbacks);

    return () => {
      autoSaveManagerRef.current?.stop();
    };
  }, [autoSaveConfig, gameState, smartSave]);

  // Monitor pause conditions
  useEffect(() => {
    if (!autoSaveManagerRef.current || !gameState) return;

    const newPauseReason = getOptimizedPauseReason(gameState, performanceMetrics, currentFPS);

    if (newPauseReason && !pauseReason) {
      autoSaveManagerRef.current.pause();
      setPauseReason(newPauseReason);
    } else if (!newPauseReason && pauseReason) {
      autoSaveManagerRef.current.resume();
      setPauseReason(null);
    }
  }, [gameState, performanceMetrics, currentFPS, pauseReason]);

  // Update state from manager
  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (autoSaveManagerRef.current) {
        setAutoSaveState(autoSaveManagerRef.current.getState());
        setPerformanceMetrics(autoSaveManagerRef.current.getPerformanceMetrics());
      }
    }, 1000);

    return () => clearInterval(updateInterval);
  }, []);

  // Auto-start
  useEffect(() => {
    if (autoStart && autoSaveManagerRef.current && !autoSaveState.isActive) {
      autoSaveManagerRef.current.start();
    }
  }, [autoStart, autoSaveState.isActive]);

  // Derived values
  const isPerformanceOptimal = currentFPS >= fpsThreshold &&
    performanceMetrics.averageSerializationTime < 20;

  const serializationEfficiency = Math.max(0, Math.min(100,
    100 - (performanceMetrics.averageSerializationTime / 50) * 100
  ));

  const lastAutoSave = autoSaveState.lastSaveTime > 0 ?
    new Date(autoSaveState.lastSaveTime) : null;

  // Control functions
  const startAutoSave = useCallback(() => {
    autoSaveManagerRef.current?.start();
  }, []);

  const stopAutoSave = useCallback(() => {
    autoSaveManagerRef.current?.stop();
  }, []);

  const pauseAutoSave = useCallback(() => {
    autoSaveManagerRef.current?.pause();
  }, []);

  const resumeAutoSave = useCallback(() => {
    autoSaveManagerRef.current?.resume();
  }, []);

  const forceAutoSave = useCallback(async () => {
    return autoSaveManagerRef.current?.forceSave() ?? false;
  }, []);

  const triggerAutoSave = useCallback(() => {
    autoSaveManagerRef.current?.triggerSave();
  }, []);

  const updateAutoSaveConfig = useCallback((newConfig: Partial<OptimizedAutoSaveConfig>) => {
    autoSaveManagerRef.current?.updateConfig(newConfig);
  }, []);

  const optimizePerformance = useCallback(() => {
    if (!autoSaveManagerRef.current) return;

    // Adjust configuration based on current performance
    const currentMetrics = autoSaveManagerRef.current.getPerformanceMetrics();

    if (currentMetrics.averageSerializationTime > 30) {
      // Increase interval if serialization is slow
      updateAutoSaveConfig({
        interval: Math.min(autoSaveConfig.interval * 1.5, 300000),
        debounceTime: Math.min(autoSaveConfig.debounceTime * 1.2, 10000)
      });
    } else if (currentMetrics.averageSerializationTime < 10 && currentFPS > 50) {
      // Decrease interval if performance is good
      updateAutoSaveConfig({
        interval: Math.max(autoSaveConfig.interval * 0.8, 120000),
        debounceTime: Math.max(autoSaveConfig.debounceTime * 0.8, 2000)
      });
    }
  }, [autoSaveConfig, currentFPS, updateAutoSaveConfig]);

  const resetPerformanceMetrics = useCallback(() => {
    if (autoSaveManagerRef.current) {
      // This would require adding a reset method to the manager
      console.log('Performance metrics reset requested');
    }
  }, []);

  return {
    // State
    autoSaveState,
    autoSaveConfig,
    isAutoSaveActive: autoSaveState.isActive,
    lastAutoSave,
    pauseReason,
    performanceMetrics,

    // Performance monitoring
    currentFPS,
    isPerformanceOptimal,
    serializationEfficiency,

    // Controls
    startAutoSave,
    stopAutoSave,
    pauseAutoSave,
    resumeAutoSave,
    forceAutoSave,
    triggerAutoSave,
    updateAutoSaveConfig,

    // Performance controls
    optimizePerformance,
    resetPerformanceMetrics
  };
};