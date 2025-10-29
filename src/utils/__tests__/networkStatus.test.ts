/**
 * Network Status Tests
 */

import { NetworkStatusManager } from '../networkStatus';

// Mock navigator
const mockNavigator = {
  onLine: true,
  connection: {
    type: 'wifi',
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
  },
} as any;

Object.defineProperty(global, 'navigator', {
  writable: true,
  value: mockNavigator,
});

// Mock window.addEventListener
const mockEventListeners: { [key: string]: EventListener[] } = {};

// Mock window methods
(global as any).window = {
  addEventListener: jest.fn((event: string, listener: EventListener) => {
    if (!mockEventListeners[event]) {
      mockEventListeners[event] = [];
    }
    mockEventListeners[event].push(listener);
  }),
  removeEventListener: jest.fn((event: string, listener: EventListener) => {
    if (mockEventListeners[event]) {
      const index = mockEventListeners[event].indexOf(listener);
      if (index > -1) {
        mockEventListeners[event].splice(index, 1);
      }
    }
  }),
  setInterval: jest.fn((callback: Function, delay: number) => {
    return setTimeout(callback, delay) as any;
  }),
  clearInterval: jest.fn((id: number) => {
    clearTimeout(id);
  }),
};

// Mock fetch
global.fetch = jest.fn();

describe('NetworkStatusManager', () => {
  let networkManager: NetworkStatusManager;

  beforeEach(() => {
    mockNavigator.onLine = true;
    (global.fetch as jest.Mock).mockClear();
    networkManager = new NetworkStatusManager({
      pingInterval: 0, // Disable automatic pings for tests
      enableDetailedInfo: true,
    });
  });

  afterEach(() => {
    networkManager.destroy();
  });

  describe('initialization', () => {
    test('should initialize with current online status', () => {
      const status = networkManager.getStatus();
      expect(status.isOnline).toBe(true);
      expect(status.connectionType).toBe('wifi');
      expect(status.effectiveType).toBe('4g');
      expect(status.downlink).toBe(10);
      expect(status.rtt).toBe(50);
    });

    test('should initialize as offline when navigator.onLine is false', () => {
      mockNavigator.onLine = false;
      const offlineManager = new NetworkStatusManager({ pingInterval: 0 });

      const status = offlineManager.getStatus();
      expect(status.isOnline).toBe(false);
      expect(status.lastOffline).toBeDefined();

      offlineManager.destroy();
    });
  });

  describe('status detection', () => {
    test('should detect online status', () => {
      expect(networkManager.isOnline()).toBe(true);
      expect(networkManager.isOffline()).toBe(false);
    });

    test('should assess connection quality', () => {
      expect(networkManager.getConnectionQuality()).toBe('excellent');

      // Test different quality levels
      mockNavigator.connection.effectiveType = '3g';
      mockNavigator.connection.rtt = 250;
      const fairManager = new NetworkStatusManager({ pingInterval: 0 });
      expect(fairManager.getConnectionQuality()).toBe('fair');
      fairManager.destroy();
    });

    test('should determine suitability for cloud operations', () => {
      expect(networkManager.isSuitableForCloudOperations()).toBe(true);

      // With save data enabled
      mockNavigator.connection.saveData = true;
      const saveDataManager = new NetworkStatusManager({ pingInterval: 0 });
      expect(saveDataManager.isSuitableForCloudOperations()).toBe(false);
      saveDataManager.destroy();
    });
  });

  describe('connectivity checks', () => {
    test('should perform connectivity check successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(new Response('OK', { status: 200 }));

      const result = await networkManager.checkConnectivity();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('google.com'),
        expect.objectContaining({
          method: 'HEAD',
          mode: 'no-cors',
        })
      );
    });

    test('should fail connectivity check when fetch fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await networkManager.checkConnectivity();
      expect(result).toBe(false);
    });

    test('should retry on failure', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue(new Response('OK', { status: 200 }));

      const manager = new NetworkStatusManager({
        pingInterval: 0,
        retryAttempts: 3,
      });

      const result = await manager.checkConnectivity();
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);

      manager.destroy();
    });
  });

  describe('event handling', () => {
    test('should handle online event', () => {
      const listener = jest.fn();
      networkManager.addListener(listener);

      // Simulate going offline then online
      mockNavigator.onLine = false;
      if (mockEventListeners['offline']) {
        mockEventListeners['offline'].forEach(l => l(new Event('offline')));
      }

      mockNavigator.onLine = true;
      if (mockEventListeners['online']) {
        mockEventListeners['online'].forEach(l => l(new Event('online')));
      }

      // Should have been called multiple times (initial + offline + online)
      expect(listener).toHaveBeenCalledTimes(3);

      const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(lastCall.isOnline).toBe(true);
    });

    test('should handle offline event', () => {
      const listener = jest.fn();
      networkManager.addListener(listener);

      mockNavigator.onLine = false;
      if (mockEventListeners['offline']) {
        mockEventListeners['offline'].forEach(l => l(new Event('offline')));
      }

      const lastCall = listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(lastCall.isOnline).toBe(false);
      expect(lastCall.lastOffline).toBeDefined();
    });
  });

  describe('listeners', () => {
    test('should add and notify listeners', () => {
      const listener = jest.fn();
      const unsubscribe = networkManager.addListener(listener);

      // Should be called immediately with current status
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: true,
        })
      );

      unsubscribe();
      listener.mockClear();

      // Trigger status change
      mockNavigator.onLine = false;
      if (mockEventListeners['offline']) {
        mockEventListeners['offline'].forEach(l => l(new Event('offline')));
      }

      // Should not be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });

    test('should remove listeners', () => {
      const listener = jest.fn();
      networkManager.addListener(listener);
      networkManager.removeListener(listener);

      listener.mockClear();

      // Trigger status change
      mockNavigator.onLine = false;
      if (mockEventListeners['offline']) {
        mockEventListeners['offline'].forEach(l => l(new Event('offline')));
      }

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    test('should calculate session statistics', () => {
      const stats = networkManager.getStatistics();

      expect(stats).toEqual({
        totalOnlineTime: expect.any(Number),
        totalOfflineTime: expect.any(Number),
        currentSessionDuration: expect.any(Number),
        connectionSwitches: 0,
      });
    });
  });

  describe('cleanup', () => {
    test('should cleanup resources on destroy', () => {
      const listener = jest.fn();
      networkManager.addListener(listener);

      networkManager.destroy();

      // Should not respond to events after destroy
      mockNavigator.onLine = false;
      if (mockEventListeners['offline']) {
        mockEventListeners['offline'].forEach(l => l(new Event('offline')));
      }

      // Clear initial listener calls
      listener.mockClear();

      // Should not be called
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
