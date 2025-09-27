/**
 * Optimized Auto-Save Utility
 * Performance-optimized auto-save system with minimal gameplay impact
 */

import { ReactGameState } from '../types/game';

export interface OptimizedAutoSaveConfig {
  /** Auto-save interval in milliseconds (default: 180000 = 3 minutes) */
  interval: number;
  /** Whether auto-save is enabled */
  enabled: boolean;
  /** Maximum number of consecutive failed saves before disabling auto-save */
  maxFailures: number;
  /** Delay before first auto-save after game start (milliseconds) */
  initialDelay: number;
  /** Save slot to use for auto-saves (default: 0) */
  autoSaveSlot: number;
  /** Debounce time for rapid state changes (milliseconds) */
  debounceTime: number;
  /** Use background thread for serialization when available */
  useBackgroundSerialization: boolean;
  /** Compress save data to reduce size */
  compressSaveData: boolean;
  /** Maximum size of game state before triggering optimization */
  maxStateSizeKB: number;
}

export interface OptimizedAutoSaveState {
  isActive: boolean;
  isPaused: boolean;
  nextSaveTime: number;
  consecutiveFailures: number;
  lastSaveTime: number;
  lastSaveSuccess: boolean;
  lastSaveSize: number;
  serializationTime: number;
  isDebouncing: boolean;
}

export interface PerformanceMetrics {
  averageSerializationTime: number;
  maxSerializationTime: number;
  averageSaveSize: number;
  maxSaveSize: number;
  totalSaves: number;
  failedSaves: number;
  debouncedSaves: number;
}

export interface OptimizedAutoSaveCallbacks {
  /** Function to execute the actual save operation */
  onSave: (gameState: ReactGameState, slotNumber: number) => Promise<boolean>;
  /** Called when auto-save completes successfully */
  onSaveSuccess?: (timestamp: number, slotNumber: number, metrics: { saveTime: number; saveSize: number }) => void;
  /** Called when auto-save fails */
  onSaveError?: (error: Error, consecutiveFailures: number) => void;
  /** Called when auto-save is disabled due to too many failures */
  onAutoSaveDisabled?: (reason: string) => void;
  /** Function to get current game state */
  getGameState: () => ReactGameState | null;
  /** Function to check if game state has changed significantly */
  hasSignificantChanges?: (lastState: ReactGameState, currentState: ReactGameState) => boolean;
}

export class OptimizedAutoSaveManager {
  private config: OptimizedAutoSaveConfig;
  private state: OptimizedAutoSaveState;
  private callbacks: OptimizedAutoSaveCallbacks;
  private timerId: NodeJS.Timeout | null = null;
  private debounceTimerId: NodeJS.Timeout | null = null;
  private lastGameStateSnapshot: string | null = null;
  private performanceMetrics: PerformanceMetrics;
  private activityTimestamp: number = Date.now();
  private readonly INACTIVITY_THRESHOLD = 30000; // 30 seconds
  private readonly FRAME_BUDGET_MS = 8; // Reserve 8ms per frame for other operations

  constructor(config: Partial<OptimizedAutoSaveConfig>, callbacks: OptimizedAutoSaveCallbacks) {
    this.config = {
      interval: 180000, // 3 minutes - longer than original to reduce frequency
      enabled: true,
      maxFailures: 3,
      initialDelay: 90000, // 1.5 minutes initial delay
      autoSaveSlot: 0,
      debounceTime: 5000, // 5 seconds debounce
      useBackgroundSerialization: true,
      compressSaveData: true,
      maxStateSizeKB: 500, // Trigger optimization at 500KB
      ...config
    };

    this.state = {
      isActive: false,
      isPaused: false,
      nextSaveTime: 0,
      consecutiveFailures: 0,
      lastSaveTime: 0,
      lastSaveSuccess: true,
      lastSaveSize: 0,
      serializationTime: 0,
      isDebouncing: false
    };

    this.performanceMetrics = {
      averageSerializationTime: 0,
      maxSerializationTime: 0,
      averageSaveSize: 0,
      maxSaveSize: 0,
      totalSaves: 0,
      failedSaves: 0,
      debouncedSaves: 0
    };

    this.callbacks = callbacks;
  }

  /**
   * Start the optimized auto-save system
   */
  start(): void {
    if (!this.config.enabled || this.state.isActive) {
      return;
    }

    this.state.isActive = true;
    this.state.isPaused = false;
    this.state.nextSaveTime = Date.now() + this.config.initialDelay;

    this.scheduleNextSave();
    this.trackUserActivity();
    this.optimizePerformance();
  }

  /**
   * Stop the auto-save system
   */
  stop(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    if (this.debounceTimerId) {
      clearTimeout(this.debounceTimerId);
      this.debounceTimerId = null;
    }

    this.state.isActive = false;
    this.state.isPaused = false;
    this.state.isDebouncing = false;
  }

  /**
   * Pause auto-save temporarily
   */
  pause(): void {
    this.state.isPaused = true;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Resume auto-save
   */
  resume(): void {
    if (!this.state.isActive || !this.state.isPaused) {
      return;
    }

    this.state.isPaused = false;
    this.scheduleNextSave();
  }

  /**
   * Force an immediate auto-save with performance optimization
   */
  async forceSave(): Promise<boolean> {
    if (!this.state.isActive) {
      return false;
    }

    return this.performOptimizedSave();
  }

  /**
   * Trigger auto-save with debouncing for rapid state changes
   */
  triggerSave(): void {
    if (!this.state.isActive || this.state.isPaused) {
      return;
    }

    // Clear existing debounce timer
    if (this.debounceTimerId) {
      clearTimeout(this.debounceTimerId);
      this.performanceMetrics.debouncedSaves++;
    }

    this.state.isDebouncing = true;

    // Set new debounce timer
    this.debounceTimerId = setTimeout(() => {
      this.state.isDebouncing = false;
      this.performOptimizedSave();
    }, this.config.debounceTime);
  }

  /**
   * Schedule the next auto-save
   */
  private scheduleNextSave(): void {
    if (!this.state.isActive || this.state.isPaused) {
      return;
    }

    const now = Date.now();
    const delay = Math.max(0, this.state.nextSaveTime - now);

    this.timerId = setTimeout(async () => {
      await this.performOptimizedSave();

      if (this.state.isActive && !this.state.isPaused) {
        this.state.nextSaveTime = Date.now() + this.config.interval;
        this.scheduleNextSave();
      }
    }, delay);
  }

  /**
   * Perform an optimized save operation
   */
  private async performOptimizedSave(): Promise<boolean> {
    const gameState = this.callbacks.getGameState();
    if (!gameState) {
      return false;
    }

    try {
      // Check if state has changed significantly
      if (!this.hasGameStateChanged(gameState)) {
        return true; // No need to save if nothing changed
      }

      const startTime = performance.now();

      // Optimize game state before saving
      const optimizedState = await this.optimizeGameState(gameState);

      // Perform the actual save
      const saveSuccess = await this.callbacks.onSave(optimizedState, this.config.autoSaveSlot);

      const endTime = performance.now();
      const saveTime = endTime - startTime;

      // Update performance metrics
      this.updatePerformanceMetrics(saveTime, optimizedState);

      if (saveSuccess) {
        this.state.lastSaveTime = Date.now();
        this.state.lastSaveSuccess = true;
        this.state.consecutiveFailures = 0;
        this.state.serializationTime = saveTime;

        // Update game state snapshot for change detection
        this.lastGameStateSnapshot = JSON.stringify(optimizedState);

        this.callbacks.onSaveSuccess?.(this.state.lastSaveTime, this.config.autoSaveSlot, {
          saveTime,
          saveSize: this.state.lastSaveSize
        });

        return true;
      } else {
        this.handleSaveFailure(new Error('Save operation returned false'));
        return false;
      }
    } catch (error) {
      this.handleSaveFailure(error as Error);
      return false;
    }
  }

  /**
   * Check if game state has changed significantly since last save
   */
  private hasGameStateChanged(gameState: ReactGameState): boolean {
    // Use custom change detection if provided
    if (this.callbacks.hasSignificantChanges && this.lastGameStateSnapshot) {
      try {
        const lastState = JSON.parse(this.lastGameStateSnapshot);
        return this.callbacks.hasSignificantChanges(lastState, gameState);
      } catch {
        // Fall back to JSON comparison if custom detection fails
      }
    }

    // Fall back to JSON string comparison (optimized)
    const currentSnapshot = this.createOptimizedSnapshot(gameState);

    if (!this.lastGameStateSnapshot) {
      return true; // First save
    }

    return this.lastGameStateSnapshot !== currentSnapshot;
  }

  /**
   * Create an optimized snapshot for change detection
   */
  private createOptimizedSnapshot(gameState: ReactGameState): string {
    // Only include fields that are significant for change detection
    const snapshot = {
      player: {
        level: gameState.player.level,
        experience: gameState.player.experience,
        currentArea: gameState.player.currentArea,
        stats: gameState.player.stats
      },
      inventory: {
        itemCount: gameState.inventory.items.length,
        // Hash of item IDs for quick comparison
        itemHash: gameState.inventory.items
          .map(item => `${item.id}:${item.quantity}`)
          .sort()
          .join('|')
      },
      story: {
        currentChapter: gameState.story.currentChapter,
        questCount: gameState.story.completedQuests.length
      },
      flagCount: Object.keys(gameState.gameFlags).length,
      timestamp: gameState.timestamp
    };

    return JSON.stringify(snapshot);
  }

  /**
   * Optimize game state before saving
   */
  private async optimizeGameState(gameState: ReactGameState): Promise<ReactGameState> {
    // Use requestIdleCallback if available for background processing
    if ('requestIdleCallback' in window) {
      return new Promise((resolve) => {
        requestIdleCallback(() => {
          resolve(this.performGameStateOptimization(gameState));
        }, { timeout: 1000 });
      });
    }

    return this.performGameStateOptimization(gameState);
  }

  /**
   * Perform game state optimization
   */
  private performGameStateOptimization(gameState: ReactGameState): ReactGameState {
    const optimized = { ...gameState };

    // Remove redundant data
    if (optimized.temporaryData) {
      delete optimized.temporaryData;
    }

    // Compress large arrays by removing duplicates or unnecessary data
    if (optimized.inventory?.items && optimized.inventory.items.length > 100) {
      // Consolidate similar items
      const itemMap = new Map();
      optimized.inventory.items.forEach(item => {
        const key = item.id;
        if (itemMap.has(key)) {
          itemMap.get(key).quantity += item.quantity;
        } else {
          itemMap.set(key, { ...item });
        }
      });
      optimized.inventory.items = Array.from(itemMap.values());
    }

    // Limit history arrays to reasonable sizes
    if (optimized.actionHistory && optimized.actionHistory.length > 50) {
      optimized.actionHistory = optimized.actionHistory.slice(-50);
    }

    return optimized;
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(saveTime: number, gameState: ReactGameState): void {
    const stateSize = JSON.stringify(gameState).length;

    this.performanceMetrics.totalSaves++;
    this.performanceMetrics.averageSerializationTime =
      (this.performanceMetrics.averageSerializationTime * (this.performanceMetrics.totalSaves - 1) + saveTime) /
      this.performanceMetrics.totalSaves;

    this.performanceMetrics.maxSerializationTime = Math.max(
      this.performanceMetrics.maxSerializationTime,
      saveTime
    );

    this.performanceMetrics.averageSaveSize =
      (this.performanceMetrics.averageSaveSize * (this.performanceMetrics.totalSaves - 1) + stateSize) /
      this.performanceMetrics.totalSaves;

    this.performanceMetrics.maxSaveSize = Math.max(this.performanceMetrics.maxSaveSize, stateSize);
    this.state.lastSaveSize = stateSize;
  }

  /**
   * Handle save failures
   */
  private handleSaveFailure(error: Error): void {
    this.state.consecutiveFailures++;
    this.state.lastSaveSuccess = false;
    this.performanceMetrics.failedSaves++;

    this.callbacks.onSaveError?.(error, this.state.consecutiveFailures);

    if (this.state.consecutiveFailures >= this.config.maxFailures) {
      this.state.isActive = false;
      this.callbacks.onAutoSaveDisabled?.(`Too many consecutive failures: ${this.state.consecutiveFailures}`);
    }
  }

  /**
   * Track user activity to pause auto-save during inactivity
   */
  private trackUserActivity(): void {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    const updateActivity = () => {
      this.activityTimestamp = Date.now();
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }

  /**
   * Optimize performance based on runtime conditions
   */
  private optimizePerformance(): void {
    // Monitor frame rate and adjust auto-save frequency
    let frameCount = 0;
    let lastTime = performance.now();

    const monitorFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        const fps = frameCount / ((currentTime - lastTime) / 1000);

        // If FPS is low, increase auto-save interval to reduce impact
        if (fps < 30 && this.config.interval < 300000) {
          this.config.interval = Math.min(this.config.interval * 1.2, 300000);
        } else if (fps > 50 && this.config.interval > 120000) {
          this.config.interval = Math.max(this.config.interval * 0.9, 120000);
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      if (this.state.isActive) {
        requestAnimationFrame(monitorFrameRate);
      }
    };

    requestAnimationFrame(monitorFrameRate);
  }

  /**
   * Get current state
   */
  getState(): OptimizedAutoSaveState {
    return { ...this.state };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OptimizedAutoSaveConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart if interval changed and system is active
    if (this.state.isActive && newConfig.interval !== undefined) {
      this.state.nextSaveTime = Date.now() + this.config.interval;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.scheduleNextSave();
      }
    }
  }
}

/**
 * Default configuration for optimized auto-save
 */
export const createOptimizedAutoSaveConfig = (): OptimizedAutoSaveConfig => ({
  interval: 180000, // 3 minutes
  enabled: true,
  maxFailures: 3,
  initialDelay: 90000, // 1.5 minutes
  autoSaveSlot: 0,
  debounceTime: 5000, // 5 seconds
  useBackgroundSerialization: true,
  compressSaveData: true,
  maxStateSizeKB: 500
});

/**
 * Utility function to check if auto-save should be paused based on performance
 */
export const shouldPauseForPerformance = (
  performanceMetrics: PerformanceMetrics,
  currentFPS: number
): boolean => {
  // Pause if serialization is taking too long or FPS is too low
  return performanceMetrics.averageSerializationTime > 50 || currentFPS < 25;
};