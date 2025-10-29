/**
 * Offline Queue Management
 * Manages queued operations when offline and processes them when online
 */

import { CloudStorageResult } from '../services/cloudStorage';
import { ReactGameState } from '../types/game';
import { networkStatusManager } from './networkStatus';
import { convertFirebaseError, CloudError, logCloudError } from './cloudErrors';

// Queue operation types
export type QueueOperationType = 'save' | 'load' | 'delete' | 'sync' | 'custom';

export interface QueuedOperation {
  id: string;
  type: QueueOperationType;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: number; // Higher number = higher priority
  data: any;
  metadata?: {
    userId: string;
    slotNumber?: number;
    saveName?: string;
    description?: string;
  };
  onSuccess?: (result: any) => void;
  onError?: (error: CloudError) => void;
  onProgress?: (progress: { current: number; total: number }) => void;
}

export interface QueueStatus {
  totalOperations: number;
  pendingOperations: number;
  processingOperations: number;
  failedOperations: number;
  completedOperations: number;
  isProcessing: boolean;
  nextProcessTime?: Date;
}

export interface OfflineQueueConfig {
  maxQueueSize: number;
  maxRetries: number;
  retryDelay: number; // base delay in milliseconds
  maxRetryDelay: number;
  enablePersistence: boolean;
  storageKey: string;
  processingConcurrency: number;
  autoProcessOnline: boolean;
}

const DEFAULT_CONFIG: OfflineQueueConfig = {
  maxQueueSize: 100,
  maxRetries: 3,
  retryDelay: 1000,
  maxRetryDelay: 30000,
  enablePersistence: true,
  storageKey: 'cloud_save_offline_queue',
  processingConcurrency: 3,
  autoProcessOnline: true,
};

/**
 * Offline Queue Manager
 * Handles queuing of cloud operations when offline and processing when online
 */
export class OfflineQueueManager {
  private config: OfflineQueueConfig;
  private queue: Map<string, QueuedOperation> = new Map();
  private processing: Set<string> = new Set();
  private isProcessing = false;
  private processingPromise: Promise<void> | null = null;
  private listeners: Set<(status: QueueStatus) => void> = new Set();
  private networkStatusUnsubscribe?: () => void;

  constructor(config: Partial<OfflineQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.initialize();
  }

  private initialize(): void {
    // Load persisted queue
    if (this.config.enablePersistence) {
      this.loadPersistedQueue();
    }

    // Listen to network status changes
    if (this.config.autoProcessOnline) {
      this.networkStatusUnsubscribe = networkStatusManager.addListener(status => {
        if (status.isOnline && this.queue.size > 0) {
          console.log('Network online, processing offline queue...');
          this.processQueue();
        }
      });
    }
  }

  private loadPersistedQueue(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const operations = JSON.parse(stored);
        operations.forEach((op: any) => {
          const operation: QueuedOperation = {
            ...op,
            timestamp: new Date(op.timestamp),
            onSuccess: undefined, // Callbacks can't be serialized
            onError: undefined,
            onProgress: undefined,
          };
          this.queue.set(operation.id, operation);
        });

        console.log(`Loaded ${this.queue.size} operations from offline queue`);
      }
    } catch (error) {
      console.error('Failed to load persisted offline queue:', error);
    }
  }

  private persistQueue(): void {
    if (!this.config.enablePersistence) return;

    try {
      const operations = Array.from(this.queue.values()).map(op => ({
        ...op,
        // Remove non-serializable callbacks
        onSuccess: undefined,
        onError: undefined,
        onProgress: undefined,
      }));

      localStorage.setItem(this.config.storageKey, JSON.stringify(operations));
    } catch (error) {
      console.error('Failed to persist offline queue:', error);
    }
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Queue status listener error:', error);
      }
    });
  }

  /**
   * Add operation to queue
   */
  enqueue(
    type: QueueOperationType,
    data: any,
    options: {
      priority?: number;
      maxRetries?: number;
      metadata?: QueuedOperation['metadata'];
      onSuccess?: (result: any) => void;
      onError?: (error: CloudError) => void;
      onProgress?: (progress: { current: number; total: number }) => void;
    } = {}
  ): string {
    const operationId = this.generateOperationId();

    // Check queue size limit
    if (this.queue.size >= this.config.maxQueueSize) {
      // Remove oldest low-priority operation
      const oldestLowPriority = Array.from(this.queue.values())
        .filter(op => op.priority <= 1)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];

      if (oldestLowPriority) {
        this.queue.delete(oldestLowPriority.id);
        console.warn('Queue full, removed oldest low-priority operation');
      } else {
        throw new Error('Queue is full and no low-priority operations to remove');
      }
    }

    const operation: QueuedOperation = {
      id: operationId,
      type,
      timestamp: new Date(),
      retryCount: 0,
      maxRetries: options.maxRetries ?? this.config.maxRetries,
      priority: options.priority ?? 5,
      data,
      metadata: options.metadata,
      onSuccess: options.onSuccess,
      onError: options.onError,
      onProgress: options.onProgress,
    };

    this.queue.set(operationId, operation);
    this.persistQueue();
    this.notifyListeners();

    console.log(`Queued ${type} operation:`, operationId);

    // If online, start processing immediately
    if (networkStatusManager.isOnline() && this.config.autoProcessOnline) {
      this.processQueue();
    }

    return operationId;
  }

  /**
   * Remove operation from queue
   */
  dequeue(operationId: string): boolean {
    const removed = this.queue.delete(operationId);
    if (removed) {
      this.processing.delete(operationId);
      this.persistQueue();
      this.notifyListeners();
    }
    return removed;
  }

  /**
   * Get operation from queue
   */
  getOperation(operationId: string): QueuedOperation | undefined {
    return this.queue.get(operationId);
  }

  /**
   * Get all operations of a specific type
   */
  getOperationsByType(type: QueueOperationType): QueuedOperation[] {
    return Array.from(this.queue.values()).filter(op => op.type === type);
  }

  /**
   * Get operations for a specific user
   */
  getOperationsByUser(userId: string): QueuedOperation[] {
    return Array.from(this.queue.values()).filter(op => op.metadata?.userId === userId);
  }

  /**
   * Get queue status
   */
  getStatus(): QueueStatus {
    const operations = Array.from(this.queue.values());
    const processing = operations.filter(op => this.processing.has(op.id));
    const failed = operations.filter(op => op.retryCount >= op.maxRetries);

    return {
      totalOperations: operations.length,
      pendingOperations: operations.length - processing.length,
      processingOperations: processing.length,
      failedOperations: failed.length,
      completedOperations: 0, // Completed operations are removed from queue
      isProcessing: this.isProcessing,
      nextProcessTime: this.isProcessing
        ? undefined
        : new Date(Date.now() + this.config.retryDelay),
    };
  }

  /**
   * Process the queue (attempt to execute queued operations)
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      return this.processingPromise || Promise.resolve();
    }

    if (!networkStatusManager.isOnline()) {
      console.log('Cannot process queue: offline');
      return;
    }

    this.isProcessing = true;
    this.notifyListeners();

    this.processingPromise = this.executeQueueProcessing();

    try {
      await this.processingPromise;
    } finally {
      this.isProcessing = false;
      this.processingPromise = null;
      this.notifyListeners();
    }
  }

  private async executeQueueProcessing(): Promise<void> {
    console.log(`Processing offline queue with ${this.queue.size} operations`);

    // Get operations sorted by priority (high to low) and timestamp (old to new)
    const operations = Array.from(this.queue.values())
      .filter(op => !this.processing.has(op.id))
      .filter(op => op.retryCount < op.maxRetries)
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority; // Higher priority first
        }
        return a.timestamp.getTime() - b.timestamp.getTime(); // Older first
      });

    // Process operations with concurrency limit
    const processingPromises: Promise<void>[] = [];

    for (const operation of operations) {
      if (processingPromises.length >= this.config.processingConcurrency) {
        // Wait for one to complete before starting another
        await Promise.race(processingPromises);
      }

      const promise = this.processOperation(operation);
      processingPromises.push(promise);

      // Remove completed promises
      promise.finally(() => {
        const index = processingPromises.indexOf(promise);
        if (index > -1) {
          processingPromises.splice(index, 1);
        }
      });
    }

    // Wait for all remaining operations to complete
    await Promise.all(processingPromises);

    console.log('Offline queue processing completed');
  }

  private async processOperation(operation: QueuedOperation): Promise<void> {
    this.processing.add(operation.id);

    try {
      console.log(`Processing ${operation.type} operation:`, operation.id);

      // Execute the operation based on its type
      const result = await this.executeOperation(operation);

      // Operation succeeded
      operation.onSuccess?.(result);
      this.dequeue(operation.id);

      console.log(`Successfully processed ${operation.type} operation:`, operation.id);
    } catch (error) {
      operation.retryCount++;
      const cloudError = convertFirebaseError(error);

      console.warn(
        `Operation ${operation.id} failed (attempt ${operation.retryCount}/${operation.maxRetries}):`,
        cloudError.message
      );

      if (operation.retryCount >= operation.maxRetries) {
        // Max retries reached, notify error and remove from queue
        operation.onError?.(cloudError);
        this.dequeue(operation.id);

        logCloudError(cloudError, `offlineQueue_${operation.type}_failed`);
      } else {
        // Schedule retry with exponential backoff
        const delay = Math.min(
          this.config.retryDelay * Math.pow(2, operation.retryCount - 1),
          this.config.maxRetryDelay
        );

        setTimeout(() => {
          this.processing.delete(operation.id);
          this.persistQueue();
        }, delay);
      }
    } finally {
      this.processing.delete(operation.id);
      this.persistQueue();
      this.notifyListeners();
    }
  }

  private async executeOperation(operation: QueuedOperation): Promise<any> {
    // This is a placeholder - actual implementation would depend on the operation type
    // and would need to be connected to the cloud storage service

    switch (operation.type) {
      case 'save':
        return this.executeSaveOperation(operation);
      case 'load':
        return this.executeLoadOperation(operation);
      case 'delete':
        return this.executeDeleteOperation(operation);
      case 'sync':
        return this.executeSyncOperation(operation);
      case 'custom':
        return this.executeCustomOperation(operation);
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  private async executeSaveOperation(operation: QueuedOperation): Promise<any> {
    const { CloudStorageService } = await import('../services/cloudStorage');
    const cloudStorage = new CloudStorageService();

    const { slotNumber, saveName, gameState, screenshot } = operation.data;

    // Get user from auth (this would come from Firebase Auth)
    const user = { uid: operation.metadata?.userId } as any;

    const result = await cloudStorage.saveToCloud(
      user,
      slotNumber,
      saveName,
      gameState,
      screenshot
    );

    if (!result.success) {
      throw new Error(result.error?.message || 'Save operation failed');
    }

    return result.data;
  }

  private async executeLoadOperation(operation: QueuedOperation): Promise<any> {
    const { CloudStorageService } = await import('../services/cloudStorage');
    const cloudStorage = new CloudStorageService();

    const { slotNumber } = operation.data;

    // Get user from auth
    const user = { uid: operation.metadata?.userId } as any;

    const result = await cloudStorage.loadFromCloud(user, slotNumber);

    if (!result.success) {
      throw new Error(result.error?.message || 'Load operation failed');
    }

    return result.data;
  }

  private async executeDeleteOperation(operation: QueuedOperation): Promise<any> {
    const { CloudStorageService } = await import('../services/cloudStorage');
    const cloudStorage = new CloudStorageService();

    const { slotNumber } = operation.data;

    // Get user from auth
    const user = { uid: operation.metadata?.userId } as any;

    const result = await cloudStorage.deleteCloudSave(user, slotNumber);

    if (!result.success) {
      throw new Error(result.error?.message || 'Delete operation failed');
    }

    return result.data;
  }

  private async executeSyncOperation(operation: QueuedOperation): Promise<any> {
    const { CloudStorageService } = await import('../services/cloudStorage');
    const cloudStorage = new CloudStorageService();

    const { userId } = operation.data;

    // Get user from auth
    const user = { uid: userId } as any;

    // Get local saves (this would come from the local save system)
    const localSaves: any[] = []; // Placeholder

    const result = await cloudStorage.syncWithCloud(user, localSaves);

    if (!result.success) {
      throw new Error(result.error?.message || 'Sync operation failed');
    }

    return result.data;
  }

  private async executeCustomOperation(operation: QueuedOperation): Promise<any> {
    // Custom operations would have their executor function in the data
    if (typeof operation.data.executor === 'function') {
      return operation.data.executor(operation.data.args);
    }
    throw new Error('Custom operation missing executor function');
  }

  /**
   * Clear all operations from queue
   */
  clear(): void {
    this.queue.clear();
    this.processing.clear();
    this.persistQueue();
    this.notifyListeners();
    console.log('Offline queue cleared');
  }

  /**
   * Clear failed operations from queue
   */
  clearFailed(): void {
    const failedOps = Array.from(this.queue.values()).filter(op => op.retryCount >= op.maxRetries);

    failedOps.forEach(op => this.queue.delete(op.id));

    this.persistQueue();
    this.notifyListeners();

    console.log(`Cleared ${failedOps.length} failed operations from queue`);
  }

  /**
   * Retry failed operations
   */
  retryFailed(): void {
    const failedOps = Array.from(this.queue.values()).filter(op => op.retryCount >= op.maxRetries);

    failedOps.forEach(op => {
      op.retryCount = 0; // Reset retry count
    });

    this.persistQueue();
    this.notifyListeners();

    console.log(`Reset retry count for ${failedOps.length} failed operations`);

    // Start processing if online
    if (networkStatusManager.isOnline()) {
      this.processQueue();
    }
  }

  /**
   * Add status listener
   */
  addStatusListener(listener: (status: QueueStatus) => void): () => void {
    this.listeners.add(listener);

    // Immediately notify with current status
    setTimeout(() => listener(this.getStatus()), 0);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove status listener
   */
  removeStatusListener(listener: (status: QueueStatus) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.networkStatusUnsubscribe?.();
    this.queue.clear();
    this.processing.clear();
    this.listeners.clear();

    if (this.config.enablePersistence) {
      localStorage.removeItem(this.config.storageKey);
    }
  }
}

// Create singleton instance
export const offlineQueueManager = new OfflineQueueManager();

// Utility functions for easier usage
export const enqueueOperation = (
  type: QueueOperationType,
  data: any,
  options?: Parameters<OfflineQueueManager['enqueue']>[2]
): string => offlineQueueManager.enqueue(type, data, options);

export const processOfflineQueue = (): Promise<void> => offlineQueueManager.processQueue();

export const getQueueStatus = (): QueueStatus => offlineQueueManager.getStatus();

export const clearOfflineQueue = (): void => offlineQueueManager.clear();
