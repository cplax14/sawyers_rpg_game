/**
 * Auto-Save Utility
 * Provides timer-based automatic saving functionality for the game
 */

import { ReactGameState } from '../types/game';

export interface AutoSaveConfig {
  /** Auto-save interval in milliseconds (default: 150000 = 2.5 minutes) */
  interval: number;
  /** Whether auto-save is enabled */
  enabled: boolean;
  /** Maximum number of consecutive failed saves before disabling auto-save */
  maxFailures: number;
  /** Delay before first auto-save after game start (milliseconds) */
  initialDelay: number;
  /** Save slot to use for auto-saves (default: 0) */
  autoSaveSlot: number;
}

export interface AutoSaveState {
  isActive: boolean;
  isPaused: boolean;
  nextSaveTime: number;
  consecutiveFailures: number;
  lastSaveTime: number;
  lastSaveSuccess: boolean;
}

export interface AutoSaveCallbacks {
  /** Function to execute the actual save operation */
  onSave: (gameState: ReactGameState, slotNumber: number) => Promise<boolean>;
  /** Called when auto-save completes successfully */
  onSaveSuccess?: (timestamp: number, slotNumber: number) => void;
  /** Called when auto-save fails */
  onSaveError?: (error: Error, consecutiveFailures: number) => void;
  /** Called when auto-save is disabled due to too many failures */
  onAutoSaveDisabled?: (reason: string) => void;
  /** Function to get current game state */
  getGameState: () => ReactGameState | null;
}

export class AutoSaveManager {
  private config: AutoSaveConfig;
  private state: AutoSaveState;
  private callbacks: AutoSaveCallbacks;
  private timerId: NodeJS.Timeout | null = null;
  private activityTimestamp: number = Date.now();
  private readonly INACTIVITY_THRESHOLD = 30000; // 30 seconds of inactivity pauses auto-save

  constructor(config: Partial<AutoSaveConfig>, callbacks: AutoSaveCallbacks) {
    this.config = {
      interval: 150000, // 2.5 minutes
      enabled: true,
      maxFailures: 3,
      initialDelay: 60000, // 1 minute initial delay
      autoSaveSlot: 0,
      ...config
    };

    this.state = {
      isActive: false,
      isPaused: false,
      nextSaveTime: 0,
      consecutiveFailures: 0,
      lastSaveTime: 0,
      lastSaveSuccess: true
    };

    this.callbacks = callbacks;
  }

  /**
   * Start the auto-save system
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
  }

  /**
   * Stop the auto-save system
   */
  stop(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.state.isActive = false;
    this.state.isPaused = false;
  }

  /**
   * Pause auto-save temporarily (e.g., during combat or story moments)
   */
  pause(): void {
    if (!this.state.isActive) return;

    this.state.isPaused = true;
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Resume auto-save from paused state
   */
  resume(): void {
    if (!this.state.isActive || !this.state.isPaused) return;

    this.state.isPaused = false;
    this.state.nextSaveTime = Date.now() + this.config.interval;
    this.scheduleNextSave();
  }

  /**
   * Update user activity timestamp (call this on user interactions)
   */
  updateActivity(): void {
    this.activityTimestamp = Date.now();
  }

  /**
   * Check if auto-save should be active based on user activity
   */
  private isUserActive(): boolean {
    return (Date.now() - this.activityTimestamp) < this.INACTIVITY_THRESHOLD;
  }

  /**
   * Schedule the next auto-save
   */
  private scheduleNextSave(): void {
    if (!this.state.isActive || this.state.isPaused || this.timerId) {
      return;
    }

    const timeUntilSave = Math.max(0, this.state.nextSaveTime - Date.now());

    this.timerId = setTimeout(() => {
      this.timerId = null;
      this.performAutoSave();
    }, timeUntilSave);
  }

  /**
   * Perform the auto-save operation
   */
  private async performAutoSave(): Promise<void> {
    // Skip if user is inactive
    if (!this.isUserActive()) {
      this.state.nextSaveTime = Date.now() + this.config.interval;
      this.scheduleNextSave();
      return;
    }

    // Skip if paused or inactive
    if (!this.state.isActive || this.state.isPaused) {
      return;
    }

    try {
      const gameState = this.callbacks.getGameState();

      if (!gameState) {
        // No game state to save, try again later
        this.state.nextSaveTime = Date.now() + this.config.interval;
        this.scheduleNextSave();
        return;
      }

      const success = await this.callbacks.onSave(gameState, this.config.autoSaveSlot);

      if (success) {
        this.state.lastSaveTime = Date.now();
        this.state.lastSaveSuccess = true;
        this.state.consecutiveFailures = 0;
        this.callbacks.onSaveSuccess?.(this.state.lastSaveTime, this.config.autoSaveSlot);
      } else {
        throw new Error('Save operation returned false');
      }

    } catch (error) {
      this.state.consecutiveFailures++;
      this.state.lastSaveSuccess = false;

      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.callbacks.onSaveError?.(errorObj, this.state.consecutiveFailures);

      // Disable auto-save if too many consecutive failures
      if (this.state.consecutiveFailures >= this.config.maxFailures) {
        this.config.enabled = false;
        this.stop();
        this.callbacks.onAutoSaveDisabled?.(`Too many consecutive failures (${this.state.consecutiveFailures})`);
        return;
      }
    }

    // Schedule next save
    this.state.nextSaveTime = Date.now() + this.config.interval;
    this.scheduleNextSave();
  }

  /**
   * Set up user activity tracking
   */
  private trackUserActivity(): void {
    // Track various user interaction events
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    const updateActivity = () => this.updateActivity();

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Store cleanup function for later use
    this.cleanup = () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }

  private cleanup: (() => void) | null = null;

  /**
   * Get current auto-save state
   */
  getState(): AutoSaveState {
    return { ...this.state };
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoSaveConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AutoSaveConfig>): void {
    const wasEnabled = this.config.enabled;
    this.config = { ...this.config, ...newConfig };

    // Restart if enabling auto-save
    if (!wasEnabled && this.config.enabled) {
      this.start();
    }
    // Stop if disabling auto-save
    else if (wasEnabled && !this.config.enabled) {
      this.stop();
    }
    // Update interval if changed and active
    else if (this.state.isActive && newConfig.interval !== undefined) {
      this.state.nextSaveTime = Date.now() + this.config.interval;
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
        this.scheduleNextSave();
      }
    }
  }

  /**
   * Force an immediate auto-save (doesn't affect the regular schedule)
   */
  async forceSave(): Promise<boolean> {
    if (!this.state.isActive || this.state.isPaused) {
      return false;
    }

    try {
      const gameState = this.callbacks.getGameState();
      if (!gameState) return false;

      const success = await this.callbacks.onSave(gameState, this.config.autoSaveSlot);

      if (success) {
        this.state.lastSaveTime = Date.now();
        this.state.lastSaveSuccess = true;
        this.state.consecutiveFailures = 0;
        this.callbacks.onSaveSuccess?.(this.state.lastSaveTime, this.config.autoSaveSlot);
      }

      return success;
    } catch (error) {
      this.state.consecutiveFailures++;
      this.state.lastSaveSuccess = false;

      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.callbacks.onSaveError?.(errorObj, this.state.consecutiveFailures);

      return false;
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stop();
    this.cleanup?.();
  }
}

/**
 * Default auto-save configuration
 */
export const createDefaultAutoSaveConfig = (): AutoSaveConfig => ({
  interval: 150000, // 2.5 minutes
  enabled: true,
  maxFailures: 3,
  initialDelay: 60000, // 1 minute
  autoSaveSlot: 0
});

/**
 * Utility function to format time remaining until next save
 */
export const formatTimeUntilSave = (nextSaveTime: number): string => {
  const timeRemaining = Math.max(0, nextSaveTime - Date.now());
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};