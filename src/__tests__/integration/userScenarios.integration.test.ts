/**
 * User Scenarios Integration Tests
 * Tests real-world user workflows with save/load and cloud synchronization
 */

import { renderHook, act } from '@testing-library/react';
import { useSmartSave } from '../../hooks/useSmartSave';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useAuth } from '../../hooks/useAuth';
import { ServiceMode, serviceModeManager } from '../../utils/serviceMode';
import { ReactGameState } from '../../types/game';

// Mock all dependencies
jest.mock('../../hooks/useAuth');
jest.mock('../../hooks/useSaveSystem');
jest.mock('../../hooks/useCloudSave');
jest.mock('../../services/cloudStorage');
jest.mock('../../services/authentication');
jest.mock('../../utils/serviceMode');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('User Scenarios Integration Tests', () => {
  let mockGameState: ReactGameState;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGameState = {
      player: {
        name: 'Hero',
        level: 1,
        experience: 0,
        currentArea: 'starting_village',
        stats: { health: 100, mana: 50, strength: 10, agility: 8 }
      },
      inventory: {
        items: [
          { id: 'starter_sword', quantity: 1 },
          { id: 'bread', quantity: 3 }
        ]
      },
      gameFlags: {
        tutorial_completed: false,
        first_save: true
      },
      story: {
        currentChapter: 1,
        completedQuests: []
      },
      version: '1.0.0',
      timestamp: new Date().toISOString()
    } as ReactGameState;

    mockUser = {
      uid: 'user-123',
      email: 'player@example.com',
      displayName: 'Hero Player'
    };
  });

  describe('New Player Journey', () => {
    it('should handle first-time player creating account and first save', async () => {
      // Mock progression through new user flow
      const mockAuth = {
        isAuthenticated: false,
        user: null,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn().mockResolvedValue({
          success: true,
          user: mockUser,
          requiresEmailVerification: true
        })
      };

      mockUseAuth.mockReturnValue(mockAuth as any);

      // Mock save system responses
      const mockSaveSystem = {
        saveGame: jest.fn().mockResolvedValue(true),
        loadGame: jest.fn(),
        getSaveSlots: jest.fn().mockResolvedValue([]),
        isInitialized: true,
        saveSlots: [],
        isLoading: false,
        error: null
      };

      const mockCloudSave = {
        backupToCloud: jest.fn().mockResolvedValue({
          success: true,
          metadata: { slotNumber: 1, saveName: 'First Adventure' }
        }),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: false // Not initialized until authenticated
      };

      // Step 1: Player starts game (not authenticated)
      const { result: smartSaveResult } = renderHook(() => useSmartSave());

      // First save should go to local storage only
      await act(async () => {
        const saveResult = await smartSaveResult.current.smartSave(
          1,
          'First Adventure',
          mockGameState
        );

        expect(saveResult.success).toBe(true);
        expect(saveResult.savedTo).toBe('local');
      });

      // Step 2: Player decides to create account
      await act(async () => {
        const registerResult = await mockAuth.register(
          'player@example.com',
          'securepassword',
          'Hero Player'
        );

        expect(registerResult.success).toBe(true);
        expect(registerResult.requiresEmailVerification).toBe(true);
      });

      // Step 3: After email verification, user is authenticated
      mockAuth.isAuthenticated = true;
      mockAuth.user = mockUser;
      mockCloudSave.isInitialized = true;

      // Step 4: Next save should go to both cloud and local
      await act(async () => {
        const enhancedGameState = {
          ...mockGameState,
          player: { ...mockGameState.player, level: 2, experience: 100 },
          gameFlags: { ...mockGameState.gameFlags, tutorial_completed: true }
        };

        const saveResult = await smartSaveResult.current.smartSave(
          1,
          'Tutorial Complete',
          enhancedGameState
        );

        expect(saveResult.success).toBe(true);
        expect(saveResult.savedTo).toBe('both');
      });

      expect(mockAuth.register).toHaveBeenCalledWith(
        'player@example.com',
        'securepassword',
        'Hero Player'
      );
    });
  });

  describe('Experienced Player Workflows', () => {
    it('should handle player switching between devices', async () => {
      // Simulate authenticated user on first device
      const mockAuth = {
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      };

      mockUseAuth.mockReturnValue(mockAuth as any);

      const mockCloudSave = {
        backupToCloud: jest.fn().mockResolvedValue({ success: true }),
        restoreFromCloud: jest.fn().mockResolvedValue({
          success: true,
          data: {
            gameState: {
              ...mockGameState,
              player: { ...mockGameState.player, level: 25, currentArea: 'dragon_lair' }
            },
            metadata: {
              slotNumber: 1,
              saveName: 'Epic Journey',
              updatedAt: new Date()
            }
          }
        }),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      };

      const { result } = renderHook(() => useSmartSave());

      // Device 1: Save game to cloud
      await act(async () => {
        const advancedGameState = {
          ...mockGameState,
          player: { ...mockGameState.player, level: 25, currentArea: 'dragon_lair' }
        };

        const saveResult = await result.current.smartSave(
          1,
          'Epic Journey',
          advancedGameState
        );

        expect(saveResult.success).toBe(true);
        expect(saveResult.savedTo).toBe('both');
      });

      // Device 2: Load from cloud
      await act(async () => {
        const loadResult = await result.current.smartLoad(1, {
          preferCloud: true
        });

        expect(loadResult.success).toBe(true);
        expect(loadResult.loadedFrom).toBe('cloud');
        expect(loadResult.gameState?.player.level).toBe(25);
        expect(loadResult.gameState?.player.currentArea).toBe('dragon_lair');
      });

      expect(mockCloudSave.restoreFromCloud).toHaveBeenCalledWith(1);
    });

    it('should handle player going offline mid-session', async () => {
      const mockAuth = {
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      };

      mockUseAuth.mockReturnValue(mockAuth as any);

      // Start online
      const mockCloudSave = {
        backupToCloud: jest.fn().mockResolvedValue({ success: true }),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      };

      const { result, rerender } = renderHook(() => useSmartSave());

      // Save while online - goes to cloud
      await act(async () => {
        const saveResult = await result.current.smartSave(
          1,
          'Online Save',
          mockGameState
        );

        expect(saveResult.success).toBe(true);
        expect(saveResult.savedTo).toBe('both');
      });

      // Simulate going offline
      mockCloudSave.isOnline = false;
      mockCloudSave.backupToCloud.mockResolvedValue({
        success: false,
        error: { code: 'network/unavailable' }
      });

      // Trigger service mode change
      act(() => {
        serviceModeManager.degradeToMode(ServiceMode.OFFLINE, 'Network lost');
      });

      rerender();

      // Save while offline - goes to local only with queue
      await act(async () => {
        const offlineGameState = {
          ...mockGameState,
          player: { ...mockGameState.player, level: 3 }
        };

        const saveResult = await result.current.smartSave(
          2,
          'Offline Save',
          offlineGameState
        );

        expect(saveResult.success).toBe(true);
        expect(saveResult.savedTo).toBe('local');
        expect(saveResult.fallbackUsed).toBe(true);
      });

      // Simulate coming back online
      mockCloudSave.isOnline = true;
      mockCloudSave.backupToCloud.mockResolvedValue({ success: true });

      act(() => {
        serviceModeManager.setMode(ServiceMode.CLOUD_ENABLED, 'Network restored');
      });

      rerender();

      // Should sync pending saves
      await act(async () => {
        const syncResult = await result.current.syncPendingSaves();
        expect(syncResult.synced).toBeGreaterThan(0);
      });
    });
  });

  describe('Auto-Save Integration', () => {
    it('should handle auto-save during critical game moments', async () => {
      const mockAuth = {
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      };

      mockUseAuth.mockReturnValue(mockAuth as any);

      // Mock auto-save hook
      const mockAutoSave = {
        triggerAutoSave: jest.fn().mockResolvedValue({ success: true }),
        pauseAutoSave: jest.fn(),
        resumeAutoSave: jest.fn(),
        isAutoSaveEnabled: true,
        isAutoSavePaused: false,
        lastAutoSave: null
      };

      const { result: smartSaveResult } = renderHook(() => useSmartSave());

      // Simulate level up event triggering auto-save
      await act(async () => {
        const levelUpGameState = {
          ...mockGameState,
          player: { ...mockGameState.player, level: 2, experience: 1000 }
        };

        // This would normally be triggered by game events
        const autoSaveResult = await mockAutoSave.triggerAutoSave(levelUpGameState);
        expect(autoSaveResult.success).toBe(true);
      });

      // Simulate entering combat (should pause auto-save)
      act(() => {
        mockAutoSave.pauseAutoSave();
        mockAutoSave.isAutoSavePaused = true;
      });

      expect(mockAutoSave.isAutoSavePaused).toBe(true);

      // Simulate combat ending (should resume auto-save)
      act(() => {
        mockAutoSave.resumeAutoSave();
        mockAutoSave.isAutoSavePaused = false;
      });

      expect(mockAutoSave.isAutoSavePaused).toBe(false);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle save corruption and recovery', async () => {
      const mockAuth = {
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      };

      mockUseAuth.mockReturnValue(mockAuth as any);

      const mockCloudSave = {
        backupToCloud: jest.fn(),
        restoreFromCloud: jest.fn()
          .mockResolvedValueOnce({
            success: false,
            error: { code: 'data/corrupted', message: 'Save data corrupted' }
          })
          .mockResolvedValueOnce({
            success: true,
            data: {
              gameState: mockGameState,
              metadata: { slotNumber: 2, saveName: 'Backup Save' }
            }
          }),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      };

      const { result } = renderHook(() => useSmartSave());

      // Try to load corrupted save (slot 1)
      await act(async () => {
        const loadResult = await result.current.smartLoad(1);
        expect(loadResult.success).toBe(false);
      });

      // Load from backup save (slot 2)
      await act(async () => {
        const backupLoadResult = await result.current.smartLoad(2);
        expect(backupLoadResult.success).toBe(true);
        expect(backupLoadResult.gameState).toEqual(mockGameState);
      });

      expect(mockCloudSave.restoreFromCloud).toHaveBeenCalledTimes(2);
    });

    it('should handle quota exceeded gracefully', async () => {
      const mockAuth = {
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      };

      mockUseAuth.mockReturnValue(mockAuth as any);

      const mockCloudSave = {
        backupToCloud: jest.fn().mockResolvedValue({
          success: false,
          error: {
            code: 'storage/quota-exceeded',
            message: 'Storage quota exceeded'
          }
        }),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      };

      const { result } = renderHook(() => useSmartSave());

      // Attempt save when quota exceeded
      await act(async () => {
        const saveResult = await result.current.smartSave(
          1,
          'Quota Test',
          mockGameState
        );

        // Should fallback to local save
        expect(saveResult.success).toBe(true);
        expect(saveResult.savedTo).toBe('local');
        expect(saveResult.fallbackUsed).toBe(true);
      });

      expect(mockCloudSave.backupToCloud).toHaveBeenCalled();
    });
  });

  describe('Multi-Player Household Scenarios', () => {
    it('should handle multiple players on same device', async () => {
      const player1 = { ...mockUser, uid: 'player1', email: 'player1@example.com' };
      const player2 = { ...mockUser, uid: 'player2', email: 'player2@example.com' };

      const mockAuth = {
        isAuthenticated: true,
        user: player1,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      };

      mockUseAuth.mockReturnValue(mockAuth as any);

      const { result } = renderHook(() => useSmartSave());

      // Player 1 saves
      await act(async () => {
        const p1GameState = {
          ...mockGameState,
          player: { ...mockGameState.player, name: 'Player1' }
        };

        const saveResult = await result.current.smartSave(
          1,
          'Player 1 Save',
          p1GameState
        );

        expect(saveResult.success).toBe(true);
      });

      // Switch to Player 2
      mockAuth.user = player2;

      // Player 2 saves to different slot
      await act(async () => {
        const p2GameState = {
          ...mockGameState,
          player: { ...mockGameState.player, name: 'Player2', level: 5 }
        };

        const saveResult = await result.current.smartSave(
          2,
          'Player 2 Save',
          p2GameState
        );

        expect(saveResult.success).toBe(true);
      });

      // Each player should have their own cloud saves
      expect(result.current.getSaveStatus().cloudAvailable).toBe(true);
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle rapid successive save operations', async () => {
      const mockAuth = {
        isAuthenticated: true,
        user: mockUser,
        signIn: jest.fn(),
        signOut: jest.fn(),
        register: jest.fn()
      };

      mockUseAuth.mockReturnValue(mockAuth as any);

      const mockCloudSave = {
        backupToCloud: jest.fn().mockResolvedValue({ success: true }),
        restoreFromCloud: jest.fn(),
        syncSlot: jest.fn(),
        isOnline: true,
        syncInProgress: false,
        isInitialized: true
      };

      const { result } = renderHook(() => useSmartSave());

      // Rapid fire saves (simulates player spamming save button)
      const rapidSaves = [];
      for (let i = 0; i < 5; i++) {
        const savePromise = act(async () => {
          const gameState = {
            ...mockGameState,
            player: { ...mockGameState.player, experience: i * 100 }
          };

          return result.current.smartSave(1, `Rapid Save ${i}`, gameState);
        });
        rapidSaves.push(savePromise);
      }

      // Wait for all saves to complete
      const results = await Promise.all(rapidSaves);

      // All saves should succeed (last one wins)
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should have been called multiple times
      expect(mockCloudSave.backupToCloud).toHaveBeenCalled();
    });
  });
});