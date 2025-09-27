/**
 * Save/Load Cloud Synchronization Integration Tests
 * Tests the complete flow of save/load operations with cloud synchronization
 */

import { renderHook, act } from '@testing-library/react';
import { useSmartSave } from '../../hooks/useSmartSave';
import { useCloudSave } from '../../hooks/useCloudSave';
import { useSaveSystem } from '../../hooks/useSaveSystem';
import { useAuth } from '../../hooks/useAuth';
import { ServiceMode, serviceModeManager } from '../../utils/serviceMode';
import { ReactGameState } from '../../types/game';

// Mock the dependencies at the service level
jest.mock('../../services/cloudStorage');
jest.mock('../../services/authentication');
jest.mock('../../utils/saveSystemManager');
jest.mock('../../config/firebase');

// Mock React hooks
jest.mock('../../hooks/useAuth');
jest.mock('../../hooks/useSaveSystem');
jest.mock('../../hooks/useCloudSave');

// Create comprehensive mock implementations
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseSaveSystem = useSaveSystem as jest.MockedFunction<typeof useSaveSystem>;
const mockUseCloudSave = useCloudSave as jest.MockedFunction<typeof useCloudSave>;

describe('Save/Load Cloud Synchronization Integration', () => {
  let mockGameState: ReactGameState;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock game state
    mockGameState = {
      player: {
        name: 'TestPlayer',
        level: 5,
        experience: 1000,
        currentArea: 'forest',
        stats: { health: 100, mana: 50 }
      },
      inventory: {
        items: [
          { id: 'sword_01', quantity: 1 },
          { id: 'potion_health', quantity: 3 }
        ]
      },
      gameFlags: {
        tutorial_completed: true,
        boss_defeated: false
      },
      story: {
        currentChapter: 2,
        completedQuests: ['quest_001', 'quest_002']
      },
      version: '1.0.0',
      timestamp: new Date().toISOString()
    } as ReactGameState;

    // Mock user
    mockUser = {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    // Setup service mode
    serviceModeManager.setMode(ServiceMode.CLOUD_ENABLED, 'Test setup');
  });

  describe('Smart Save Integration', () => {
    it('should perform end-to-end save to cloud with local backup', async () => {
      // Setup mocks
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      } as any);

      mockUseSaveSystem.mockReturnValue({
        saveGame: jest.fn().mockResolvedValue(true),
        loadGame: jest.fn().mockResolvedValue(mockGameState),
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      } as any);

      mockUseCloudSave.mockReturnValue({
        backupToCloud: jest.fn().mockResolvedValue({
          success: true,
          metadata: {
            slotNumber: 1,
            saveName: 'Test Save',
            dataSize: 1000,
            compressedSize: 500
          }
        }),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      } as any);

      // Test the smart save flow
      const { result } = renderHook(() => useSmartSave({
        preferCloud: true,
        autoFallback: true
      }));

      await act(async () => {
        const saveResult = await result.current.smartSave(
          1,
          'Test Save',
          mockGameState
        );

        expect(saveResult.success).toBe(true);
        expect(saveResult.savedTo).toBe('both');
        expect(saveResult.message).toContain('cloud and local');
      });

      // Verify both cloud and local saves were called
      expect(mockUseCloudSave().backupToCloud).toHaveBeenCalledWith(1, 'Test Save');
      expect(mockUseSaveSystem().saveGame).toHaveBeenCalledWith(1, 'Test Save', mockGameState);
    });

    it('should fallback to local save when cloud fails', async () => {
      // Setup mocks with cloud failure
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      } as any);

      mockUseSaveSystem.mockReturnValue({
        saveGame: jest.fn().mockResolvedValue(true),
        loadGame: jest.fn().mockResolvedValue(mockGameState),
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      } as any);

      mockUseCloudSave.mockReturnValue({
        backupToCloud: jest.fn().mockResolvedValue({
          success: false,
          error: {
            code: 'network/error',
            message: 'Network failure'
          }
        }),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn(),
        isOnline: false, // Simulate offline
        syncInProgress: false,
        isInitialized: true
      } as any);

      // Test the smart save flow with fallback
      const { result } = renderHook(() => useSmartSave({
        preferCloud: true,
        autoFallback: true
      }));

      await act(async () => {
        const saveResult = await result.current.smartSave(
          1,
          'Test Save',
          mockGameState
        );

        expect(saveResult.success).toBe(true);
        expect(saveResult.savedTo).toBe('local');
        expect(saveResult.fallbackUsed).toBe(true);
        expect(saveResult.message).toContain('will sync when restored');
      });

      // Verify local save was called and queued for later sync
      expect(mockUseSaveSystem().saveGame).toHaveBeenCalledWith(1, 'Test Save', mockGameState);
    });

    it('should load from cloud and fallback to local', async () => {
      // Setup mocks
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      } as any);

      mockUseSaveSystem.mockReturnValue({
        saveGame: jest.fn(),
        loadGame: jest.fn().mockResolvedValue(mockGameState),
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      } as any);

      // First attempt cloud load (succeeds)
      mockUseCloudSave.mockReturnValue({
        backupToCloud: jest.fn(),
        restoreFromCloud: jest.fn().mockResolvedValue({
          success: true,
          data: {
            gameState: mockGameState,
            metadata: {
              slotNumber: 1,
              saveName: 'Cloud Save'
            }
          }
        }),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      } as any);

      const { result } = renderHook(() => useSmartSave());

      await act(async () => {
        const loadResult = await result.current.smartLoad(1, {
          preferCloud: true,
          fallbackToLocal: true
        });

        expect(loadResult.success).toBe(true);
        expect(loadResult.loadedFrom).toBe('cloud');
        expect(loadResult.gameState).toEqual(mockGameState);
      });

      expect(mockUseCloudSave().restoreFromCloud).toHaveBeenCalledWith(1);
    });
  });

  describe('Synchronization Scenarios', () => {
    it('should handle sync conflicts by choosing newer save', async () => {
      const newerGameState = {
        ...mockGameState,
        player: { ...mockGameState.player, level: 10 },
        timestamp: new Date(Date.now() + 1000).toISOString()
      };

      // Setup mocks with conflict scenario
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      } as any);

      mockUseSaveSystem.mockReturnValue({
        saveGame: jest.fn().mockResolvedValue(true),
        loadGame: jest.fn().mockResolvedValue(mockGameState), // Older local save
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      } as any);

      mockUseCloudSave.mockReturnValue({
        backupToCloud: jest.fn(),
        restoreFromCloud: jest.fn().mockResolvedValue({
          success: true,
          data: {
            gameState: newerGameState, // Newer cloud save
            metadata: {
              slotNumber: 1,
              saveName: 'Cloud Save',
              updatedAt: new Date(Date.now() + 1000)
            }
          }
        }),
        syncSlot: jest.fn().mockResolvedValue({
          success: true,
          action: 'download',
          message: 'Downloaded newer cloud save'
        }),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      } as any);

      const { result } = renderHook(() => useSmartSave());

      await act(async () => {
        // Sync should detect the conflict and choose the newer cloud save
        const syncResult = await result.current.syncPendingSaves();

        expect(syncResult.synced).toBe(1);
        expect(syncResult.failed).toBe(0);
      });

      expect(mockUseCloudSave().syncSlot).toHaveBeenCalled();
    });

    it('should queue saves when offline and sync when online', async () => {
      // Start offline
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      } as any);

      mockUseSaveSystem.mockReturnValue({
        saveGame: jest.fn().mockResolvedValue(true),
        loadGame: jest.fn().mockResolvedValue(mockGameState),
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      } as any);

      // Start with cloud unavailable
      const cloudSaveMock = {
        backupToCloud: jest.fn().mockResolvedValue({
          success: false,
          error: { code: 'network/unavailable' }
        }),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn().mockResolvedValue({ success: true }),
        isOnline: false,
        syncInProgress: false,
        isInitialized: true
      };

      mockUseCloudSave.mockReturnValue(cloudSaveMock as any);

      const { result, rerender } = renderHook(() => useSmartSave({
        autoFallback: true,
        syncWhenRestored: true
      }));

      // Save while offline - should queue
      await act(async () => {
        const saveResult = await result.current.smartSave(
          1,
          'Offline Save',
          mockGameState
        );

        expect(saveResult.success).toBe(true);
        expect(saveResult.savedTo).toBe('local');
        expect(saveResult.fallbackUsed).toBe(true);
      });

      // Simulate coming back online
      cloudSaveMock.isOnline = true;
      cloudSaveMock.backupToCloud.mockResolvedValue({ success: true });

      // Trigger service mode change
      act(() => {
        serviceModeManager.setMode(ServiceMode.CLOUD_ENABLED, 'Connection restored');
      });

      rerender();

      // Should automatically sync pending saves
      await act(async () => {
        const syncResult = await result.current.syncPendingSaves();
        expect(syncResult.synced).toBeGreaterThan(0);
      });

      expect(cloudSaveMock.syncSlot).toHaveBeenCalled();
    });
  });

  describe('Error Recovery Integration', () => {
    it('should recover from temporary network failures', async () => {
      let callCount = 0;

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      } as any);

      mockUseSaveSystem.mockReturnValue({
        saveGame: jest.fn().mockResolvedValue(true),
        loadGame: jest.fn().mockResolvedValue(mockGameState),
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      } as any);

      mockUseCloudSave.mockReturnValue({
        backupToCloud: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call fails
            return Promise.resolve({
              success: false,
              error: { code: 'network/timeout', message: 'Request timeout' }
            });
          } else {
            // Second call succeeds
            return Promise.resolve({
              success: true,
              metadata: { slotNumber: 1, saveName: 'Recovered Save' }
            });
          }
        }),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      } as any);

      const { result } = renderHook(() => useSmartSave({
        preferCloud: true,
        autoFallback: true
      }));

      // First save attempt (will fail then succeed)
      await act(async () => {
        const saveResult = await result.current.smartSave(
          1,
          'Recovery Test',
          mockGameState
        );

        // Should eventually succeed with fallback to local
        expect(saveResult.success).toBe(true);
      });

      // Should have tried cloud save and fallen back to local
      expect(mockUseCloudSave().backupToCloud).toHaveBeenCalled();
      expect(mockUseSaveSystem().saveGame).toHaveBeenCalled();
    });

    it('should handle authentication expiration during sync', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false, // Simulate auth expiration
        user: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      } as any);

      mockUseSaveSystem.mockReturnValue({
        saveGame: jest.fn().mockResolvedValue(true),
        loadGame: jest.fn().mockResolvedValue(mockGameState),
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      } as any);

      mockUseCloudSave.mockReturnValue({
        backupToCloud: jest.fn().mockResolvedValue({
          success: false,
          error: { code: 'auth/required', message: 'Authentication required' }
        }),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      } as any);

      const { result } = renderHook(() => useSmartSave());

      await act(async () => {
        const saveResult = await result.current.smartSave(
          1,
          'Auth Test',
          mockGameState
        );

        // Should fallback to local save when not authenticated
        expect(saveResult.success).toBe(true);
        expect(saveResult.savedTo).toBe('local');
      });

      expect(mockUseSaveSystem().saveGame).toHaveBeenCalledWith(1, 'Auth Test', mockGameState);
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle multiple simultaneous save operations', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      } as any);

      mockUseSaveSystem.mockReturnValue({
        saveGame: jest.fn().mockResolvedValue(true),
        loadGame: jest.fn().mockResolvedValue(mockGameState),
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      } as any);

      mockUseCloudSave.mockReturnValue({
        backupToCloud: jest.fn().mockResolvedValue({ success: true }),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      } as any);

      const { result } = renderHook(() => useSmartSave());

      // Trigger multiple save operations concurrently
      await act(async () => {
        const savePromises = [
          result.current.smartSave(1, 'Save 1', mockGameState),
          result.current.smartSave(2, 'Save 2', mockGameState),
          result.current.smartSave(3, 'Save 3', mockGameState)
        ];

        const results = await Promise.all(savePromises);

        // All saves should succeed
        results.forEach(result => {
          expect(result.success).toBe(true);
        });
      });

      // Verify all saves were processed
      expect(mockUseCloudSave().backupToCloud).toHaveBeenCalledTimes(3);
      expect(mockUseSaveSystem().saveGame).toHaveBeenCalledTimes(3);
    });

    it('should maintain save order during batch operations', async () => {
      const saveOrder: number[] = [];

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      } as any);

      mockUseSaveSystem.mockReturnValue({
        saveGame: jest.fn().mockImplementation((slot: number) => {
          saveOrder.push(slot);
          return Promise.resolve(true);
        }),
        loadGame: jest.fn().mockResolvedValue(mockGameState),
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      } as any);

      mockUseCloudSave.mockReturnValue({
        backupToCloud: jest.fn().mockResolvedValue({ success: true }),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      } as any);

      const { result } = renderHook(() => useSmartSave());

      // Execute saves in sequence
      await act(async () => {
        for (let i = 1; i <= 5; i++) {
          await result.current.smartSave(i, `Save ${i}`, mockGameState);
        }
      });

      // Verify saves were processed in order
      expect(saveOrder).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('Data Integrity', () => {
    it('should validate game state before saving', async () => {
      const invalidGameState = {
        // Missing required fields
        player: null,
        inventory: undefined
      } as any;

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      } as any);

      mockUseSaveSystem.mockReturnValue({
        saveGame: jest.fn().mockRejectedValue(new Error('Invalid game state')),
        loadGame: jest.fn(),
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      } as any);

      mockUseCloudSave.mockReturnValue({
        backupToCloud: jest.fn(),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      } as any);

      const { result } = renderHook(() => useSmartSave());

      await act(async () => {
        const saveResult = await result.current.smartSave(
          1,
          'Invalid Save',
          invalidGameState
        );

        expect(saveResult.success).toBe(false);
        expect(saveResult.error).toBeDefined();
      });
    });

    it('should verify data integrity after loading', async () => {
      const corruptedGameState = {
        player: mockGameState.player,
        // Corrupted inventory data
        inventory: { corruptedData: true },
        gameFlags: null
      } as any;

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      } as any);

      mockUseSaveSystem.mockReturnValue({
        saveGame: jest.fn(),
        loadGame: jest.fn().mockResolvedValue(corruptedGameState),
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      } as any);

      mockUseCloudSave.mockReturnValue({
        backupToCloud: jest.fn(),
        restoreFromCloud: jest.fn().mockResolvedValue({
          success: false,
          error: { code: 'data/corrupted', message: 'Data integrity check failed' }
        }),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      } as any);

      const { result } = renderHook(() => useSmartSave());

      await act(async () => {
        const loadResult = await result.current.smartLoad(1);

        // Should still succeed with local fallback but indicate data issues
        expect(loadResult.success).toBe(true);
        expect(loadResult.loadedFrom).toBe('local');
        expect(loadResult.message).toContain('cloud error');
      });
    });
  });
});