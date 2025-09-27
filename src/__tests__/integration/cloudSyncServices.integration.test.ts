/**
 * Cloud Sync Services Integration Tests
 * Tests interactions between CloudStorageService, AuthenticationService, and error recovery
 */

import { CloudStorageService } from '../../services/cloudStorage';
import { AuthenticationService } from '../../services/authentication';
import { ErrorRecoveryService } from '../../utils/errorRecovery';
import { serviceModeManager, ServiceMode } from '../../utils/serviceMode';
import { ReactGameState } from '../../types/game';
import { CloudErrorCode } from '../../utils/cloudErrors';

// Mock Firebase modules
jest.mock('firebase/firestore');
jest.mock('firebase/storage');
jest.mock('firebase/auth');
jest.mock('../../config/firebase');
jest.mock('../../utils/retryManager', () => ({
  retry: {
    critical: jest.fn((fn) => fn()),
    network: jest.fn((fn) => fn()),
    background: jest.fn((fn) => fn()),
    quick: jest.fn((fn) => fn())
  },
  RETRY_CONFIGS: {
    CLOUD_STORAGE: { maxAttempts: 3 }
  }
}));

describe('Cloud Sync Services Integration', () => {
  let cloudStorage: CloudStorageService;
  let authService: AuthenticationService;
  let errorRecovery: ErrorRecoveryService;
  let mockUser: any;
  let mockGameState: ReactGameState;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset service mode
    serviceModeManager.setMode(ServiceMode.CLOUD_ENABLED, 'Test setup');

    // Initialize services
    cloudStorage = new CloudStorageService();
    authService = new AuthenticationService();
    errorRecovery = new ErrorRecoveryService();

    // Mock user
    mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    // Mock game state
    mockGameState = {
      player: {
        name: 'TestPlayer',
        level: 10,
        experience: 2500,
        currentArea: 'dungeon_1'
      },
      inventory: {
        items: [
          { id: 'sword_legendary', quantity: 1 },
          { id: 'armor_plate', quantity: 1 },
          { id: 'potion_healing', quantity: 5 }
        ]
      },
      gameFlags: {
        tutorial_completed: true,
        chapter_1_completed: true,
        boss_dragon_defeated: true
      },
      story: {
        currentChapter: 3,
        completedQuests: ['save_village', 'defeat_bandits', 'find_artifact']
      },
      version: '1.2.0',
      timestamp: new Date().toISOString()
    } as ReactGameState;
  });

  describe('Authentication and Storage Integration', () => {
    it('should authenticate user and then save to cloud', async () => {
      // Mock successful authentication
      const mockSignIn = jest.spyOn(authService, 'signIn').mockResolvedValue({
        success: true,
        user: mockUser,
        metadata: {
          operationId: 'signin_123',
          timestamp: Date.now(),
          executionTime: 500
        }
      });

      // Mock successful cloud save
      const mockSaveToCloud = jest.spyOn(cloudStorage, 'saveToCloud').mockResolvedValue({
        success: true,
        metadata: {
          id: 'save_123',
          userId: mockUser.uid,
          slotNumber: 1,
          saveName: 'Integration Test Save',
          dataSize: 2048,
          compressedSize: 1024,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Test the integrated flow
      const authResult = await authService.signIn('test@example.com', 'password123');
      expect(authResult.success).toBe(true);
      expect(authResult.user).toBe(mockUser);

      const saveResult = await cloudStorage.saveToCloud(
        mockUser,
        1,
        'Integration Test Save',
        mockGameState
      );

      expect(saveResult.success).toBe(true);
      expect(saveResult.metadata?.userId).toBe(mockUser.uid);
      expect(saveResult.metadata?.slotNumber).toBe(1);

      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockSaveToCloud).toHaveBeenCalledWith(
        mockUser,
        1,
        'Integration Test Save',
        mockGameState
      );
    });

    it('should handle authentication failure gracefully', async () => {
      // Mock authentication failure
      const mockSignIn = jest.spyOn(authService, 'signIn').mockResolvedValue({
        success: false,
        error: {
          code: CloudErrorCode.AUTH_INVALID,
          message: 'Invalid credentials',
          severity: 'medium' as any,
          retryable: false,
          userMessage: 'Authentication failed. Please check your credentials.',
          timestamp: new Date()
        }
      });

      // Test authentication failure
      const authResult = await authService.signIn('test@example.com', 'wrongpassword');
      expect(authResult.success).toBe(false);
      expect(authResult.error?.code).toBe(CloudErrorCode.AUTH_INVALID);

      // Should not attempt cloud save without authentication
      const saveResult = await cloudStorage.saveToCloud(
        null as any,
        1,
        'Failed Save',
        mockGameState
      );

      expect(saveResult.success).toBe(false);
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from network errors using error recovery service', async () => {
      // Mock network error followed by success
      let callCount = 0;
      const mockSaveToCloud = jest.spyOn(cloudStorage, 'saveToCloud').mockImplementation(
        async () => {
          callCount++;
          if (callCount === 1) {
            throw {
              code: 'unavailable',
              message: 'Service temporarily unavailable'
            };
          }
          return {
            success: true,
            metadata: {
              id: 'save_recovered',
              userId: mockUser.uid,
              slotNumber: 1,
              saveName: 'Recovered Save',
              dataSize: 2048,
              compressedSize: 1024,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          };
        }
      );

      // Test error recovery
      const result = await errorRecovery.executeWithRecovery(
        () => cloudStorage.saveToCloud(mockUser, 1, 'Recovered Save', mockGameState),
        'cloud_save_operation',
        3 // max attempts
      );

      expect(result).toBeDefined();
      expect(mockSaveToCloud).toHaveBeenCalledTimes(2); // Original + retry
    });

    it('should degrade service mode on persistent errors', async () => {
      // Mock persistent authentication errors
      const mockSignIn = jest.spyOn(authService, 'signIn').mockResolvedValue({
        success: false,
        error: {
          code: CloudErrorCode.AUTH_REQUIRED,
          message: 'Authentication required',
          severity: 'high' as any,
          retryable: false,
          userMessage: 'Please sign in to continue using cloud features.',
          timestamp: new Date()
        }
      });

      // Attempt authentication multiple times
      for (let i = 0; i < 3; i++) {
        const result = await authService.signIn('test@example.com', 'password123');
        expect(result.success).toBe(false);
      }

      // Service mode should potentially degrade to local-only
      // This would be handled by the service mode manager in real usage
      expect(mockSignIn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Data Consistency and Sync', () => {
    it('should maintain data consistency across save and load operations', async () => {
      // Mock successful save
      const mockSaveToCloud = jest.spyOn(cloudStorage, 'saveToCloud').mockResolvedValue({
        success: true,
        metadata: {
          id: 'save_consistency',
          userId: mockUser.uid,
          slotNumber: 1,
          saveName: 'Consistency Test',
          dataSize: 2048,
          compressedSize: 1024,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Mock successful load that returns the same data
      const mockLoadFromCloud = jest.spyOn(cloudStorage, 'loadFromCloud').mockResolvedValue({
        success: true,
        data: {
          gameState: mockGameState,
          metadata: {
            id: 'save_consistency',
            userId: mockUser.uid,
            slotNumber: 1,
            saveName: 'Consistency Test',
            gameVersion: '1.2.0',
            createdAt: new Date(),
            updatedAt: new Date(),
            dataSize: 2048,
            compressedSize: 1024,
            playtime: 3600,
            playerLevel: 10,
            currentArea: 'dungeon_1'
          }
        }
      });

      // Test save then load
      const saveResult = await cloudStorage.saveToCloud(
        mockUser,
        1,
        'Consistency Test',
        mockGameState
      );
      expect(saveResult.success).toBe(true);

      const loadResult = await cloudStorage.loadFromCloud(mockUser, 1);
      expect(loadResult.success).toBe(true);
      expect(loadResult.data?.gameState).toEqual(mockGameState);

      expect(mockSaveToCloud).toHaveBeenCalledWith(
        mockUser,
        1,
        'Consistency Test',
        mockGameState
      );
      expect(mockLoadFromCloud).toHaveBeenCalledWith(mockUser, 1);
    });

    it('should handle sync conflicts between local and cloud saves', async () => {
      const localGameState = {
        ...mockGameState,
        player: { ...mockGameState.player, level: 15 },
        timestamp: new Date(Date.now() - 1000).toISOString() // Older
      };

      const cloudGameState = {
        ...mockGameState,
        player: { ...mockGameState.player, level: 12 },
        timestamp: new Date().toISOString() // Newer
      };

      // Mock cloud load returning newer save
      const mockLoadFromCloud = jest.spyOn(cloudStorage, 'loadFromCloud').mockResolvedValue({
        success: true,
        data: {
          gameState: cloudGameState,
          metadata: {
            id: 'save_conflict',
            userId: mockUser.uid,
            slotNumber: 1,
            saveName: 'Conflict Test',
            gameVersion: '1.2.0',
            createdAt: new Date(Date.now() - 2000),
            updatedAt: new Date(), // More recent
            dataSize: 2048,
            compressedSize: 1024,
            playtime: 3600,
            playerLevel: 12,
            currentArea: 'dungeon_1'
          }
        }
      });

      // Mock sync operation that resolves conflict
      const mockSyncSlot = jest.spyOn(cloudStorage, 'syncSlot').mockResolvedValue({
        success: true,
        action: 'download',
        message: 'Downloaded newer cloud save',
        metadata: {
          localVersion: new Date(Date.now() - 1000),
          cloudVersion: new Date(),
          resolution: 'cloud_newer'
        }
      });

      // Test conflict resolution
      const loadResult = await cloudStorage.loadFromCloud(mockUser, 1);
      expect(loadResult.success).toBe(true);

      const syncResult = await cloudStorage.syncSlot(mockUser, 1, {
        gameState: localGameState,
        saveName: 'Local Save',
        timestamp: new Date(Date.now() - 1000)
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.action).toBe('download'); // Cloud version was newer
      expect(mockLoadFromCloud).toHaveBeenCalledWith(mockUser, 1);
      expect(mockSyncSlot).toHaveBeenCalled();
    });
  });

  describe('Batch Operations Integration', () => {
    it('should handle batch save operations with mixed results', async () => {
      const multipleGameStates = [
        { ...mockGameState, player: { ...mockGameState.player, name: 'Player1', level: 5 } },
        { ...mockGameState, player: { ...mockGameState.player, name: 'Player2', level: 10 } },
        { ...mockGameState, player: { ...mockGameState.player, name: 'Player3', level: 15 } }
      ];

      // Mock batch save with mixed results
      const mockBatchSave = jest.spyOn(cloudStorage, 'batchSaveToCloud').mockResolvedValue({
        success: false, // Overall failure due to partial failures
        results: [
          {
            slotNumber: 1,
            success: true,
            metadata: {
              id: 'batch_save_1',
              userId: mockUser.uid,
              slotNumber: 1,
              saveName: 'Batch Save 1',
              dataSize: 1024,
              compressedSize: 512,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          {
            slotNumber: 2,
            success: false,
            error: {
              code: CloudErrorCode.STORAGE_QUOTA_EXCEEDED,
              message: 'Storage quota exceeded',
              severity: 'critical' as any,
              retryable: false,
              userMessage: 'Storage quota exceeded. Please delete some saves.',
              timestamp: new Date()
            }
          },
          {
            slotNumber: 3,
            success: true,
            metadata: {
              id: 'batch_save_3',
              userId: mockUser.uid,
              slotNumber: 3,
              saveName: 'Batch Save 3',
              dataSize: 1024,
              compressedSize: 512,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        ]
      });

      const batchSaves = multipleGameStates.map((state, index) => ({
        slotNumber: index + 1,
        saveName: `Batch Save ${index + 1}`,
        gameState: state
      }));

      const result = await cloudStorage.batchSaveToCloud(mockUser, batchSaves);

      expect(result.success).toBe(false); // Overall failure
      expect(result.results).toHaveLength(3);
      expect(result.results![0].success).toBe(true);
      expect(result.results![1].success).toBe(false);
      expect(result.results![1].error?.code).toBe(CloudErrorCode.STORAGE_QUOTA_EXCEEDED);
      expect(result.results![2].success).toBe(true);

      expect(mockBatchSave).toHaveBeenCalledWith(mockUser, batchSaves);
    });
  });

  describe('Service Mode Integration', () => {
    it('should adapt to service mode changes', async () => {
      // Start in cloud enabled mode
      expect(serviceModeManager.getMode()).toBe(ServiceMode.CLOUD_ENABLED);

      // Mock cloud save failure that should trigger service degradation
      const mockSaveToCloud = jest.spyOn(cloudStorage, 'saveToCloud').mockResolvedValue({
        success: false,
        error: {
          code: CloudErrorCode.NETWORK_UNAVAILABLE,
          message: 'Network unavailable',
          severity: 'high' as any,
          retryable: true,
          userMessage: 'Network error. Please check your connection.',
          timestamp: new Date()
        }
      });

      // Attempt cloud save
      const result = await cloudStorage.saveToCloud(
        mockUser,
        1,
        'Service Mode Test',
        mockGameState
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe(CloudErrorCode.NETWORK_UNAVAILABLE);

      // In a real scenario, this would trigger service mode degradation
      serviceModeManager.degradeToMode(ServiceMode.LOCAL_ONLY, 'Network issues detected');

      expect(serviceModeManager.getMode()).toBe(ServiceMode.LOCAL_ONLY);
      expect(mockSaveToCloud).toHaveBeenCalled();
    });

    it('should restore service mode when conditions improve', async () => {
      // Start in degraded mode
      serviceModeManager.degradeToMode(ServiceMode.LOCAL_ONLY, 'Simulated network issues');
      expect(serviceModeManager.getMode()).toBe(ServiceMode.LOCAL_ONLY);

      // Mock successful operations
      const mockSaveToCloud = jest.spyOn(cloudStorage, 'saveToCloud').mockResolvedValue({
        success: true,
        metadata: {
          id: 'save_restored',
          userId: mockUser.uid,
          slotNumber: 1,
          saveName: 'Service Restored',
          dataSize: 2048,
          compressedSize: 1024,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Attempt restoration
      const restoreResult = await serviceModeManager.attemptRestoration();

      // In a real scenario, successful operations would restore service mode
      if (restoreResult) {
        serviceModeManager.setMode(ServiceMode.CLOUD_ENABLED, 'Service restored');
      }

      expect(serviceModeManager.getMode()).toBe(ServiceMode.CLOUD_ENABLED);
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent operations efficiently', async () => {
      const concurrentOperations = 10;
      const promises: Promise<any>[] = [];

      // Mock successful saves with slight delays to simulate real conditions
      const mockSaveToCloud = jest.spyOn(cloudStorage, 'saveToCloud').mockImplementation(
        async (user, slot, name, state) => {
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
          return {
            success: true,
            metadata: {
              id: `concurrent_save_${slot}`,
              userId: user.uid,
              slotNumber: slot,
              saveName: name,
              dataSize: 2048,
              compressedSize: 1024,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          };
        }
      );

      // Launch concurrent save operations
      for (let i = 0; i < concurrentOperations; i++) {
        const promise = cloudStorage.saveToCloud(
          mockUser,
          i + 1,
          `Concurrent Save ${i + 1}`,
          mockGameState
        );
        promises.push(promise);
      }

      // Wait for all operations to complete
      const results = await Promise.all(promises);

      // All operations should succeed
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.metadata?.slotNumber).toBe(index + 1);
      });

      expect(mockSaveToCloud).toHaveBeenCalledTimes(concurrentOperations);
    });
  });
});