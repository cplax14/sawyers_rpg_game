/**
 * Offline Queue Tests
 */

import { OfflineQueueManager } from '../offlineQueue';

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => {
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock network status manager
jest.mock('../networkStatus', () => ({
  networkStatusManager: {
    addListener: jest.fn(() => jest.fn()), // Return unsubscribe function
    isOnline: jest.fn(() => true),
    getStatus: jest.fn(() => ({ isOnline: true })),
  },
}));

describe('OfflineQueueManager', () => {
  let queueManager: OfflineQueueManager;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    queueManager = new OfflineQueueManager({
      enablePersistence: true,
      autoProcessOnline: false, // Disable for testing
      maxQueueSize: 10,
    });
  });

  afterEach(() => {
    queueManager.destroy();
  });

  describe('queue management', () => {
    test('should enqueue operations', () => {
      const operationId = queueManager.enqueue(
        'save',
        {
          slotNumber: 1,
          saveName: 'Test Save',
          gameState: { player: { name: 'Test' } },
        },
        {
          priority: 5,
          metadata: {
            userId: 'user123',
            slotNumber: 1,
            description: 'Test save operation',
          },
        }
      );

      expect(operationId).toBeDefined();

      const status = queueManager.getStatus();
      expect(status.totalOperations).toBe(1);
      expect(status.pendingOperations).toBe(1);

      const operation = queueManager.getOperation(operationId);
      expect(operation).toBeDefined();
      expect(operation?.type).toBe('save');
      expect(operation?.priority).toBe(5);
      expect(operation?.metadata?.userId).toBe('user123');
    });

    test('should dequeue operations', () => {
      const operationId = queueManager.enqueue('save', { test: 'data' });

      expect(queueManager.getStatus().totalOperations).toBe(1);

      const removed = queueManager.dequeue(operationId);
      expect(removed).toBe(true);
      expect(queueManager.getStatus().totalOperations).toBe(0);

      const operation = queueManager.getOperation(operationId);
      expect(operation).toBeUndefined();
    });

    test('should enforce queue size limits', () => {
      const smallQueue = new OfflineQueueManager({
        maxQueueSize: 2,
        enablePersistence: false,
      });

      // Add operations up to limit
      smallQueue.enqueue('save', { data: 1 }, { priority: 1 });
      smallQueue.enqueue('save', { data: 2 }, { priority: 1 });

      expect(smallQueue.getStatus().totalOperations).toBe(2);

      // Adding another should remove the oldest low-priority one
      smallQueue.enqueue('save', { data: 3 }, { priority: 5 });

      expect(smallQueue.getStatus().totalOperations).toBe(2);

      smallQueue.destroy();
    });

    test('should handle queue size limits with no low-priority operations', () => {
      const smallQueue = new OfflineQueueManager({
        maxQueueSize: 2,
        enablePersistence: false,
      });

      // Add high-priority operations
      smallQueue.enqueue('save', { data: 1 }, { priority: 10 });
      smallQueue.enqueue('save', { data: 2 }, { priority: 10 });

      // Should throw when trying to add another
      expect(() => {
        smallQueue.enqueue('save', { data: 3 }, { priority: 10 });
      }).toThrow('Queue is full');

      smallQueue.destroy();
    });
  });

  describe('operation queries', () => {
    test('should get operations by type', () => {
      queueManager.enqueue('save', { data: 1 });
      queueManager.enqueue('load', { data: 2 });
      queueManager.enqueue('save', { data: 3 });

      const saveOps = queueManager.getOperationsByType('save');
      const loadOps = queueManager.getOperationsByType('load');

      expect(saveOps).toHaveLength(2);
      expect(loadOps).toHaveLength(1);
    });

    test('should get operations by user', () => {
      queueManager.enqueue(
        'save',
        { data: 1 },
        {
          metadata: { userId: 'user1' },
        }
      );
      queueManager.enqueue(
        'save',
        { data: 2 },
        {
          metadata: { userId: 'user2' },
        }
      );
      queueManager.enqueue(
        'load',
        { data: 3 },
        {
          metadata: { userId: 'user1' },
        }
      );

      const user1Ops = queueManager.getOperationsByUser('user1');
      const user2Ops = queueManager.getOperationsByUser('user2');

      expect(user1Ops).toHaveLength(2);
      expect(user2Ops).toHaveLength(1);
    });
  });

  describe('status reporting', () => {
    test('should report correct queue status', () => {
      expect(queueManager.getStatus()).toEqual({
        totalOperations: 0,
        pendingOperations: 0,
        processingOperations: 0,
        failedOperations: 0,
        completedOperations: 0,
        isProcessing: false,
        nextProcessTime: expect.any(Date),
      });

      queueManager.enqueue('save', { data: 1 });

      const status = queueManager.getStatus();
      expect(status.totalOperations).toBe(1);
      expect(status.pendingOperations).toBe(1);
    });
  });

  describe('listeners', () => {
    test('should notify status listeners', done => {
      const listener = jest.fn();
      const unsubscribe = queueManager.addStatusListener(listener);

      // Wait for the initial notification (it's async)
      setTimeout(() => {
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            totalOperations: 0,
          })
        );

        listener.mockClear();

        // Add operation should trigger listener
        queueManager.enqueue('save', { data: 1 });

        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            totalOperations: 1,
          })
        );

        unsubscribe();
        done();
      }, 10);
    });

    test('should remove status listeners', () => {
      const listener = jest.fn();
      queueManager.addStatusListener(listener);
      queueManager.removeStatusListener(listener);

      listener.mockClear();

      queueManager.enqueue('save', { data: 1 });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('persistence', () => {
    test('should persist queue to localStorage', () => {
      const persistentQueue = new OfflineQueueManager({
        enablePersistence: true,
        storageKey: 'test_queue',
      });

      persistentQueue.enqueue(
        'save',
        { data: 'test' },
        {
          metadata: { userId: 'user123' },
        }
      );

      const stored = localStorage.getItem('test_queue');
      expect(stored).toBeTruthy();

      const operations = JSON.parse(stored!);
      expect(operations).toHaveLength(1);
      expect(operations[0].type).toBe('save');
      expect(operations[0].data.data).toBe('test');

      persistentQueue.destroy();
    });

    test('should load persisted queue on initialization', () => {
      // First, create and populate a queue
      const firstQueue = new OfflineQueueManager({
        enablePersistence: true,
        storageKey: 'test_queue_load',
        autoProcessOnline: false,
      });

      firstQueue.enqueue(
        'save',
        { data: 'persisted' },
        {
          metadata: { userId: 'user123' },
        }
      );

      expect(firstQueue.getStatus().totalOperations).toBe(1);

      // Explicitly persist before destroying
      (firstQueue as any).persistQueue();
      firstQueue.destroy();

      // Verify data was stored
      const stored = localStorage.getItem('test_queue_load');
      expect(stored).toBeTruthy();

      // Then create a new queue that should load the persisted data
      const secondQueue = new OfflineQueueManager({
        enablePersistence: true,
        storageKey: 'test_queue_load',
        autoProcessOnline: false,
      });

      expect(secondQueue.getStatus().totalOperations).toBe(1);

      const operations = secondQueue.getOperationsByUser('user123');
      expect(operations).toHaveLength(1);
      expect(operations[0].data.data).toBe('persisted');

      secondQueue.destroy();
    });

    test('should handle corrupted localStorage gracefully', () => {
      localStorage.setItem('test_corrupted', 'invalid json');

      const corruptedQueue = new OfflineQueueManager({
        enablePersistence: true,
        storageKey: 'test_corrupted',
      });

      // Should initialize with empty queue despite corrupted storage
      expect(corruptedQueue.getStatus().totalOperations).toBe(0);

      corruptedQueue.destroy();
    });
  });

  describe('queue operations', () => {
    test('should clear all operations', () => {
      queueManager.enqueue('save', { data: 1 });
      queueManager.enqueue('load', { data: 2 });

      expect(queueManager.getStatus().totalOperations).toBe(2);

      queueManager.clear();

      expect(queueManager.getStatus().totalOperations).toBe(0);
    });

    test('should clear failed operations', () => {
      const op1 = queueManager.enqueue('save', { data: 1 }, { maxRetries: 2 });
      const op2 = queueManager.enqueue('save', { data: 2 }, { maxRetries: 2 });

      // Manually set retry counts to simulate failures
      const operation1 = queueManager.getOperation(op1)!;
      const operation2 = queueManager.getOperation(op2)!;
      operation1.retryCount = 3; // Failed
      operation2.retryCount = 1; // Still retrying

      queueManager.clearFailed();

      expect(queueManager.getStatus().totalOperations).toBe(1);
      expect(queueManager.getOperation(op1)).toBeUndefined();
      expect(queueManager.getOperation(op2)).toBeDefined();
    });

    test('should retry failed operations', () => {
      const opId = queueManager.enqueue('save', { data: 1 }, { maxRetries: 2 });

      // Simulate failure
      const operation = queueManager.getOperation(opId)!;
      operation.retryCount = 3;

      queueManager.retryFailed();

      const retriedOp = queueManager.getOperation(opId)!;
      expect(retriedOp.retryCount).toBe(0);
    });
  });

  describe('custom operations', () => {
    test('should handle custom operations with executor function', async () => {
      const mockExecutor = jest.fn().mockResolvedValue('custom result');

      queueManager.enqueue('custom', {
        executor: mockExecutor,
        args: { customArg: 'value' },
      });

      // Since we can't easily test the private executeOperation method,
      // we just verify the operation is queued correctly
      const status = queueManager.getStatus();
      expect(status.totalOperations).toBe(1);

      const operations = queueManager.getOperationsByType('custom');
      expect(operations).toHaveLength(1);
      expect(operations[0].data.executor).toBe(mockExecutor);
    });
  });

  describe('cleanup', () => {
    test('should cleanup resources on destroy', () => {
      const listener = jest.fn();
      queueManager.addStatusListener(listener);

      queueManager.enqueue('save', { data: 1 });
      expect(queueManager.getStatus().totalOperations).toBe(1);

      queueManager.destroy();

      // Queue should be cleared
      expect(queueManager.getStatus().totalOperations).toBe(0);

      // Listeners should be cleared
      listener.mockClear();
      queueManager.enqueue('save', { data: 2 }); // This won't actually work after destroy
    });
  });
});
