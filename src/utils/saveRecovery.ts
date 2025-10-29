/**
 * Save Recovery System
 * Detects and recovers from interrupted save operations
 */

import { ReactGameState } from '../types/game';

export interface SaveOperation {
  id: string;
  timestamp: number;
  slotNumber: number;
  saveName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'interrupted';
  gameStateHash: string; // Hash of the game state being saved
  retryCount: number;
  lastError?: string;
  startTime: number;
  endTime?: number;
}

export interface RecoveryInfo {
  hasRecoverableData: boolean;
  interruptedOperations: SaveOperation[];
  lastKnownGoodSave?: SaveOperation;
  recommendedAction: 'none' | 'recover' | 'retry' | 'discard';
}

export interface SaveRecoveryConfig {
  maxRetries: number;
  operationTimeout: number; // milliseconds
  recoveryStorageKey: string;
  cleanupInterval: number; // milliseconds
}

/**
 * Save Recovery Manager
 * Manages save operation tracking and recovery
 */
export class SaveRecoveryManager {
  private config: SaveRecoveryConfig;
  private operations: Map<string, SaveOperation> = new Map();
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config: Partial<SaveRecoveryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      operationTimeout: 30000, // 30 seconds
      recoveryStorageKey: 'sawyers_rpg_save_recovery',
      cleanupInterval: 60000, // 1 minute
      ...config,
    };

    this.loadOperationsFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Create a hash of the game state for comparison
   */
  private createGameStateHash(gameState: ReactGameState): string {
    // Create a simplified hash based on key game state elements
    const hashData = {
      playerId: gameState.player?.id,
      level: gameState.player?.level,
      currentArea: gameState.currentArea,
      totalPlayTime: gameState.totalPlayTime,
      inventoryCount: gameState.inventory.length,
      monstersCount: gameState.capturedMonsters.length,
      questsCount: gameState.completedQuests.length,
    };

    return btoa(JSON.stringify(hashData));
  }

  /**
   * Start tracking a save operation
   */
  startSaveOperation(
    slotNumber: number,
    saveName: string,
    gameState: ReactGameState
  ): SaveOperation {
    const operation: SaveOperation = {
      id: `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      slotNumber,
      saveName,
      status: 'pending',
      gameStateHash: this.createGameStateHash(gameState),
      retryCount: 0,
      startTime: Date.now(),
    };

    this.operations.set(operation.id, operation);
    this.persistOperations();

    // Mark as in progress after a short delay
    setTimeout(() => {
      this.updateOperationStatus(operation.id, 'in_progress');
    }, 100);

    return operation;
  }

  /**
   * Update the status of a save operation
   */
  updateOperationStatus(
    operationId: string,
    status: SaveOperation['status'],
    error?: string
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    operation.status = status;
    operation.endTime = Date.now();

    if (error) {
      operation.lastError = error;
    }

    if (status === 'failed') {
      operation.retryCount++;
    }

    this.operations.set(operationId, operation);
    this.persistOperations();
  }

  /**
   * Mark a save operation as completed successfully
   */
  completeSaveOperation(operationId: string): void {
    this.updateOperationStatus(operationId, 'completed');
  }

  /**
   * Mark a save operation as failed
   */
  failSaveOperation(operationId: string, error: string): void {
    this.updateOperationStatus(operationId, 'failed', error);
  }

  /**
   * Check for interrupted save operations
   */
  detectInterruptedOperations(): SaveOperation[] {
    const now = Date.now();
    const interrupted: SaveOperation[] = [];

    for (const operation of this.operations.values()) {
      // Check if operation has been running too long
      if (
        (operation.status === 'pending' || operation.status === 'in_progress') &&
        now - operation.startTime > this.config.operationTimeout
      ) {
        operation.status = 'interrupted';
        interrupted.push(operation);
      }
    }

    if (interrupted.length > 0) {
      this.persistOperations();
    }

    return interrupted;
  }

  /**
   * Get recovery information
   */
  getRecoveryInfo(): RecoveryInfo {
    const interruptedOperations = this.detectInterruptedOperations();
    const completedOperations = Array.from(this.operations.values())
      .filter(op => op.status === 'completed')
      .sort((a, b) => b.timestamp - a.timestamp);

    const lastKnownGoodSave = completedOperations[0];

    let recommendedAction: RecoveryInfo['recommendedAction'] = 'none';

    if (interruptedOperations.length > 0) {
      const hasRetriableOperations = interruptedOperations.some(
        op => op.retryCount < this.config.maxRetries
      );

      if (hasRetriableOperations) {
        recommendedAction = 'retry';
      } else if (lastKnownGoodSave) {
        recommendedAction = 'recover';
      } else {
        recommendedAction = 'discard';
      }
    }

    return {
      hasRecoverableData: interruptedOperations.length > 0,
      interruptedOperations,
      lastKnownGoodSave,
      recommendedAction,
    };
  }

  /**
   * Attempt to retry a failed save operation
   */
  retrySaveOperation(operationId: string): SaveOperation | null {
    const operation = this.operations.get(operationId);
    if (!operation || operation.retryCount >= this.config.maxRetries) {
      return null;
    }

    // Reset operation for retry
    operation.status = 'pending';
    operation.startTime = Date.now();
    operation.endTime = undefined;
    operation.retryCount++;

    this.operations.set(operationId, operation);
    this.persistOperations();

    return operation;
  }

  /**
   * Clean up old operations
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [id, operation] of this.operations.entries()) {
      // Remove old completed operations
      if (operation.status === 'completed' && now - operation.timestamp > maxAge) {
        this.operations.delete(id);
      }

      // Remove old failed operations that can't be retried
      if (
        operation.status === 'failed' &&
        operation.retryCount >= this.config.maxRetries &&
        now - operation.timestamp > maxAge
      ) {
        this.operations.delete(id);
      }
    }

    this.persistOperations();
  }

  /**
   * Get operation statistics
   */
  getOperationStats(): {
    total: number;
    completed: number;
    failed: number;
    interrupted: number;
    pending: number;
    successRate: number;
  } {
    const operations = Array.from(this.operations.values());
    const completed = operations.filter(op => op.status === 'completed').length;
    const failed = operations.filter(op => op.status === 'failed').length;
    const interrupted = operations.filter(op => op.status === 'interrupted').length;
    const pending = operations.filter(
      op => op.status === 'pending' || op.status === 'in_progress'
    ).length;

    const total = operations.length;
    const successRate = total > 0 ? (completed / total) * 100 : 100;

    return {
      total,
      completed,
      failed,
      interrupted,
      pending,
      successRate,
    };
  }

  /**
   * Clear all recovery data
   */
  clearRecoveryData(): void {
    this.operations.clear();
    this.persistOperations();
  }

  /**
   * Get all operations for debugging
   */
  getAllOperations(): SaveOperation[] {
    return Array.from(this.operations.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Persist operations to localStorage
   */
  private persistOperations(): void {
    try {
      const data = Array.from(this.operations.entries());
      localStorage.setItem(this.config.recoveryStorageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to persist save recovery data:', error);
    }
  }

  /**
   * Load operations from localStorage
   */
  private loadOperationsFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.recoveryStorageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.operations = new Map(data);

        // Clean up any operations that were in progress when the app closed
        this.detectInterruptedOperations();
      }
    } catch (error) {
      console.warn('Failed to load save recovery data:', error);
      this.operations.clear();
    }
  }

  /**
   * Start periodic cleanup
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Stop the cleanup timer and clean up resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.cleanup();
  }
}

/**
 * Create a default save recovery manager
 */
export const createSaveRecoveryManager = (
  config?: Partial<SaveRecoveryConfig>
): SaveRecoveryManager => {
  return new SaveRecoveryManager(config);
};

/**
 * Utility functions for save recovery
 */
export const SaveRecoveryUtils = {
  /**
   * Format operation duration for display
   */
  formatDuration(startTime: number, endTime?: number): string {
    const duration = (endTime || Date.now()) - startTime;
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  },

  /**
   * Get status color for UI display
   */
  getStatusColor(status: SaveOperation['status']): string {
    switch (status) {
      case 'completed':
        return '#51cf66';
      case 'failed':
        return '#ff6b6b';
      case 'interrupted':
        return '#ffa500';
      case 'in_progress':
        return '#4ecdc4';
      case 'pending':
        return '#999999';
      default:
        return '#666666';
    }
  },

  /**
   * Get human-readable status text
   */
  getStatusText(status: SaveOperation['status']): string {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'interrupted':
        return 'Interrupted';
      default:
        return 'Unknown';
    }
  },
};
