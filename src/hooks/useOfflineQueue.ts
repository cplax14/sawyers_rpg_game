/**
 * Offline Queue Hook
 * React hook for managing offline queue operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  QueuedOperation,
  QueueStatus,
  QueueOperationType,
  offlineQueueManager
} from '../utils/offlineQueue';
import { CloudError } from '../utils/cloudErrors';
import { useNetworkStatus } from './useNetworkStatus';

export interface UseOfflineQueueOptions {
  autoProcess?: boolean;
  enablePersistence?: boolean;
}

export interface UseOfflineQueueResult {
  // Queue status
  status: QueueStatus;
  operations: QueuedOperation[];

  // Queue operations
  enqueue: (
    type: QueueOperationType,
    data: any,
    options?: {
      priority?: number;
      maxRetries?: number;
      metadata?: QueuedOperation['metadata'];
      onSuccess?: (result: any) => void;
      onError?: (error: CloudError) => void;
      onProgress?: (progress: { current: number; total: number }) => void;
    }
  ) => string;

  dequeue: (operationId: string) => boolean;
  processQueue: () => Promise<void>;

  // Queue management
  clear: () => void;
  clearFailed: () => void;
  retryFailed: () => void;

  // Operation queries
  getOperation: (operationId: string) => QueuedOperation | undefined;
  getOperationsByType: (type: QueueOperationType) => QueuedOperation[];
  getOperationsByUser: (userId: string) => QueuedOperation[];

  // Utilities
  canProcessNow: boolean;
}

/**
 * Hook for managing offline queue operations
 */
export function useOfflineQueue(options: UseOfflineQueueOptions = {}): UseOfflineQueueResult {
  const [status, setStatus] = useState<QueueStatus>(() => offlineQueueManager.getStatus());
  const [operations, setOperations] = useState<QueuedOperation[]>([]);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    // Subscribe to queue status changes
    const unsubscribe = offlineQueueManager.addStatusListener((newStatus: QueueStatus) => {
      setStatus(newStatus);

      // Update operations list
      const allOperations = Array.from((offlineQueueManager as any).queue.values());
      setOperations(allOperations);
    });

    // Initial load
    const initialOperations = Array.from((offlineQueueManager as any).queue.values());
    setOperations(initialOperations);

    return unsubscribe;
  }, []);

  const enqueue = useCallback((
    type: QueueOperationType,
    data: any,
    options?: Parameters<typeof offlineQueueManager.enqueue>[2]
  ): string => {
    return offlineQueueManager.enqueue(type, data, options);
  }, []);

  const dequeue = useCallback((operationId: string): boolean => {
    return offlineQueueManager.dequeue(operationId);
  }, []);

  const processQueue = useCallback(async (): Promise<void> => {
    return offlineQueueManager.processQueue();
  }, []);

  const clear = useCallback((): void => {
    offlineQueueManager.clear();
  }, []);

  const clearFailed = useCallback((): void => {
    offlineQueueManager.clearFailed();
  }, []);

  const retryFailed = useCallback((): void => {
    offlineQueueManager.retryFailed();
  }, []);

  const getOperation = useCallback((operationId: string): QueuedOperation | undefined => {
    return offlineQueueManager.getOperation(operationId);
  }, []);

  const getOperationsByType = useCallback((type: QueueOperationType): QueuedOperation[] => {
    return offlineQueueManager.getOperationsByType(type);
  }, []);

  const getOperationsByUser = useCallback((userId: string): QueuedOperation[] => {
    return offlineQueueManager.getOperationsByUser(userId);
  }, []);

  const canProcessNow = isOnline && status.pendingOperations > 0 && !status.isProcessing;

  return {
    status,
    operations,
    enqueue,
    dequeue,
    processQueue,
    clear,
    clearFailed,
    retryFailed,
    getOperation,
    getOperationsByType,
    getOperationsByUser,
    canProcessNow
  };
}

/**
 * Hook for save operations with offline support
 */
export function useOfflineSave(userId: string) {
  const { enqueue, getOperationsByUser } = useOfflineQueue();
  const { isOnline } = useNetworkStatus();

  const enqueueSave = useCallback((
    slotNumber: number,
    saveName: string,
    gameState: any,
    screenshot?: string,
    options?: {
      priority?: number;
      onSuccess?: (result: any) => void;
      onError?: (error: CloudError) => void;
    }
  ): string => {
    return enqueue('save', {
      slotNumber,
      saveName,
      gameState,
      screenshot
    }, {
      priority: options?.priority ?? 8, // High priority for saves
      metadata: {
        userId,
        slotNumber,
        saveName,
        description: `Save game to slot ${slotNumber}`
      },
      onSuccess: options?.onSuccess,
      onError: options?.onError
    });
  }, [enqueue, userId]);

  const enqueueLoad = useCallback((
    slotNumber: number,
    options?: {
      priority?: number;
      onSuccess?: (result: any) => void;
      onError?: (error: CloudError) => void;
    }
  ): string => {
    return enqueue('load', {
      slotNumber
    }, {
      priority: options?.priority ?? 7, // High priority for loads
      metadata: {
        userId,
        slotNumber,
        description: `Load game from slot ${slotNumber}`
      },
      onSuccess: options?.onSuccess,
      onError: options?.onError
    });
  }, [enqueue, userId]);

  const enqueueDelete = useCallback((
    slotNumber: number,
    options?: {
      priority?: number;
      onSuccess?: (result: any) => void;
      onError?: (error: CloudError) => void;
    }
  ): string => {
    return enqueue('delete', {
      slotNumber
    }, {
      priority: options?.priority ?? 5, // Medium priority for deletes
      metadata: {
        userId,
        slotNumber,
        description: `Delete save from slot ${slotNumber}`
      },
      onSuccess: options?.onSuccess,
      onError: options?.onError
    });
  }, [enqueue, userId]);

  const enqueueSync = useCallback((
    options?: {
      priority?: number;
      onSuccess?: (result: any) => void;
      onError?: (error: CloudError) => void;
    }
  ): string => {
    return enqueue('sync', {
      userId
    }, {
      priority: options?.priority ?? 3, // Lower priority for sync
      metadata: {
        userId,
        description: 'Sync all saves with cloud'
      },
      onSuccess: options?.onSuccess,
      onError: options?.onError
    });
  }, [enqueue, userId]);

  const pendingSaves = getOperationsByUser(userId).filter(op => op.type === 'save');
  const pendingLoads = getOperationsByUser(userId).filter(op => op.type === 'load');
  const pendingDeletes = getOperationsByUser(userId).filter(op => op.type === 'delete');
  const pendingSyncs = getOperationsByUser(userId).filter(op => op.type === 'sync');

  return {
    enqueueSave,
    enqueueLoad,
    enqueueDelete,
    enqueueSync,
    pendingSaves,
    pendingLoads,
    pendingDeletes,
    pendingSyncs,
    hasPendingOperations: pendingSaves.length + pendingLoads.length + pendingDeletes.length + pendingSyncs.length > 0,
    isOnline
  };
}

/**
 * Hook for monitoring specific operation status
 */
export function useOperationStatus(operationId: string | undefined) {
  const { getOperation, status: queueStatus } = useOfflineQueue();
  const [operation, setOperation] = useState<QueuedOperation | undefined>(
    operationId ? getOperation(operationId) : undefined
  );

  useEffect(() => {
    if (!operationId) {
      setOperation(undefined);
      return;
    }

    const interval = setInterval(() => {
      const currentOp = getOperation(operationId);
      setOperation(currentOp);
    }, 1000);

    return () => clearInterval(interval);
  }, [operationId, getOperation, queueStatus]);

  if (!operationId || !operation) {
    return {
      operation: undefined,
      isPending: false,
      isProcessing: false,
      isFailed: false,
      isCompleted: false,
      progress: 0
    };
  }

  const isPending = operation.retryCount === 0;
  const isProcessing = queueStatus.isProcessing &&
                      operation.retryCount > 0 &&
                      operation.retryCount < operation.maxRetries;
  const isFailed = operation.retryCount >= operation.maxRetries;
  const isCompleted = !operation; // Operation is removed from queue when completed

  return {
    operation,
    isPending,
    isProcessing,
    isFailed,
    isCompleted,
    progress: operation.retryCount / Math.max(operation.maxRetries, 1)
  };
}