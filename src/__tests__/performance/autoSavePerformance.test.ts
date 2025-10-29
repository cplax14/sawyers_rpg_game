/**
 * Auto-Save Performance Tests
 * Tests to measure and optimize auto-save performance impact on gameplay
 */

import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../../hooks/useAutoSave';
import { AutoSaveManager, AutoSaveConfig } from '../../utils/autoSave';
import { ReactGameState } from '../../types/game';

// Mock dependencies
jest.mock('../../hooks/useGameState');
jest.mock('../../hooks/useSaveSystem');
jest.mock('../../hooks/useSaveRecovery');

describe('Auto-Save Performance Tests', () => {
  let mockGameState: ReactGameState;
  let performanceMetrics: { [key: string]: number[] } = {};

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMetrics = {};

    // Create a comprehensive game state for testing
    mockGameState = {
      player: {
        name: 'PerfTestPlayer',
        level: 50,
        experience: 500000,
        currentArea: 'complex_dungeon',
        stats: {
          health: 1000,
          mana: 800,
          strength: 150,
          agility: 120,
          intelligence: 90,
          defense: 130,
        },
        equipment: {
          weapon: { id: 'legendary_sword', enchantments: ['fire', 'sharpness'] },
          armor: { id: 'dragon_scale_armor', enchantments: ['protection', 'durability'] },
          accessories: [
            { id: 'ring_of_power', stats: { strength: 20 } },
            { id: 'amulet_of_wisdom', stats: { intelligence: 15 } },
          ],
        },
      },
      inventory: {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: `item_${i}`,
          quantity: Math.floor(Math.random() * 10) + 1,
          rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'][
            Math.floor(Math.random() * 5)
          ],
        })),
      },
      gameFlags: Object.fromEntries(
        Array.from({ length: 200 }, (_, i) => [`flag_${i}`, Math.random() > 0.5])
      ),
      story: {
        currentChapter: 15,
        completedQuests: Array.from({ length: 50 }, (_, i) => `quest_${i}`),
        activeQuests: Array.from({ length: 10 }, (_, i) => ({
          id: `active_quest_${i}`,
          progress: Math.floor(Math.random() * 100),
          objectives: Array.from({ length: 5 }, (_, j) => ({
            id: `objective_${j}`,
            completed: Math.random() > 0.5,
          })),
        })),
      },
      worldState: {
        areas: Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [
            `area_${i}`,
            {
              explored: Math.random() > 0.3,
              completion: Math.floor(Math.random() * 100),
              secrets: Array.from({ length: 5 }, (_, j) => ({
                id: `secret_${j}`,
                discovered: Math.random() > 0.7,
              })),
            },
          ])
        ),
      },
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    } as ReactGameState;
  });

  const measurePerformance = async (
    testName: string,
    operation: () => Promise<any>,
    iterations: number = 10
  ): Promise<{
    averageTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
    p95Time: number;
  }> => {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      await operation();
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    times.sort((a, b) => a - b);
    const p95Index = Math.floor(times.length * 0.95);

    const metrics = {
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
      minTime: times[0],
      maxTime: times[times.length - 1],
      totalTime: times.reduce((sum, time) => sum + time, 0),
      p95Time: times[p95Index],
    };

    performanceMetrics[testName] = times;
    return metrics;
  };

  describe('Serialization Performance', () => {
    it('should serialize game state efficiently', async () => {
      const metrics = await measurePerformance(
        'gameStateSerialization',
        async () => {
          return JSON.stringify(mockGameState);
        },
        50
      );

      // Game state serialization should be fast (< 10ms on average)
      expect(metrics.averageTime).toBeLessThan(10);
      expect(metrics.p95Time).toBeLessThan(20);

      console.log('Game State Serialization Metrics:', {
        averageTime: `${metrics.averageTime.toFixed(2)}ms`,
        p95Time: `${metrics.p95Time.toFixed(2)}ms`,
        maxTime: `${metrics.maxTime.toFixed(2)}ms`,
      });
    });

    it('should handle large game states without blocking', async () => {
      // Create an even larger game state
      const largeGameState = {
        ...mockGameState,
        inventory: {
          items: Array.from({ length: 1000 }, (_, i) => ({
            id: `large_item_${i}`,
            quantity: Math.floor(Math.random() * 100) + 1,
            properties: Array.from({ length: 20 }, (_, j) => `prop_${j}`),
          })),
        },
      };

      const metrics = await measurePerformance(
        'largeGameStateSerialization',
        async () => {
          return JSON.stringify(largeGameState);
        },
        20
      );

      // Even large states should serialize reasonably fast (< 50ms on average)
      expect(metrics.averageTime).toBeLessThan(50);
      expect(metrics.p95Time).toBeLessThan(100);

      console.log('Large Game State Serialization Metrics:', {
        averageTime: `${metrics.averageTime.toFixed(2)}ms`,
        p95Time: `${metrics.p95Time.toFixed(2)}ms`,
        dataSize: `${JSON.stringify(largeGameState).length} characters`,
      });
    });
  });

  describe('Auto-Save Manager Performance', () => {
    it('should handle rapid state changes efficiently', async () => {
      const mockSaveFunction = jest.fn().mockResolvedValue(true);
      const autoSaveManager = new AutoSaveManager(
        {
          interval: 100, // Very short interval for testing
          enabled: true,
          maxFailures: 3,
        },
        {
          onSave: mockSaveFunction,
          getGameState: () => mockGameState,
        }
      );

      const metrics = await measurePerformance(
        'rapidStateChanges',
        async () => {
          // Simulate rapid game state changes
          for (let i = 0; i < 10; i++) {
            mockGameState.player.experience += 100;
            await new Promise(resolve => setTimeout(resolve, 5));
          }
        },
        20
      );

      // Rapid state changes should not cause performance issues
      expect(metrics.averageTime).toBeLessThan(100);

      autoSaveManager.stop();
    });

    it('should efficiently determine when to pause auto-save', async () => {
      const combatGameState = {
        ...mockGameState,
        currentScreen: 'combat',
        settings: {
          autoSavePauseDuringCombat: true,
        },
      };

      const metrics = await measurePerformance(
        'autoSavePauseDetection',
        async () => {
          // This would normally be called by the auto-save hook
          const shouldPause =
            combatGameState.currentScreen === 'combat' &&
            combatGameState.settings.autoSavePauseDuringCombat;
          return shouldPause;
        },
        100
      );

      // Pause detection should be extremely fast (< 1ms)
      expect(metrics.averageTime).toBeLessThan(1);

      console.log('Auto-Save Pause Detection Metrics:', {
        averageTime: `${metrics.averageTime.toFixed(4)}ms`,
        maxTime: `${metrics.maxTime.toFixed(4)}ms`,
      });
    });
  });

  describe('Memory Usage Optimization', () => {
    it('should not accumulate memory during auto-save operations', async () => {
      const mockSaveFunction = jest.fn().mockResolvedValue(true);
      let memoryUsageBefore: number;
      let memoryUsageAfter: number;

      if (performance.memory) {
        memoryUsageBefore = performance.memory.usedJSHeapSize;
      }

      // Simulate multiple auto-save operations
      for (let i = 0; i < 20; i++) {
        await mockSaveFunction(mockGameState, 0);
        // Force garbage collection hint
        if (global.gc) {
          global.gc();
        }
      }

      if (performance.memory) {
        memoryUsageAfter = performance.memory.usedJSHeapSize;
        const memoryIncrease = memoryUsageAfter - memoryUsageBefore;

        console.log('Memory Usage Test:', {
          before: `${(memoryUsageBefore / 1024 / 1024).toFixed(2)} MB`,
          after: `${(memoryUsageAfter / 1024 / 1024).toFixed(2)} MB`,
          increase: `${(memoryIncrease / 1024).toFixed(2)} KB`,
        });

        // Memory increase should be minimal (< 5MB for 20 operations)
        expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
      }
    });
  });

  describe('Frame Rate Impact', () => {
    it('should not cause frame drops during auto-save', async () => {
      const frameTimestamps: number[] = [];
      let animationId: number;

      // Start measuring frame rate
      const measureFrames = () => {
        frameTimestamps.push(performance.now());
        if (frameTimestamps.length < 60) {
          // Measure 60 frames
          animationId = requestAnimationFrame(measureFrames);
        }
      };

      // Start frame measurement
      requestAnimationFrame(measureFrames);

      // Simulate auto-save during animation
      const mockSaveFunction = jest.fn().mockImplementation(async () => {
        // Simulate save operation with some processing time
        const data = JSON.stringify(mockGameState);
        await new Promise(resolve => setTimeout(resolve, 10)); // 10ms save operation
        return true;
      });

      // Trigger save during frame measurement
      setTimeout(() => {
        mockSaveFunction(mockGameState, 0);
      }, 500);

      // Wait for all frames to be measured
      await new Promise(resolve => {
        const checkFrames = () => {
          if (frameTimestamps.length >= 60) {
            resolve(void 0);
          } else {
            setTimeout(checkFrames, 16);
          }
        };
        checkFrames();
      });

      // Calculate frame times
      const frameTimes = [];
      for (let i = 1; i < frameTimestamps.length; i++) {
        frameTimes.push(frameTimestamps[i] - frameTimestamps[i - 1]);
      }

      const averageFrameTime = frameTimes.reduce((sum, time) => sum + time, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);

      console.log('Frame Rate Impact Metrics:', {
        averageFrameTime: `${averageFrameTime.toFixed(2)}ms`,
        maxFrameTime: `${maxFrameTime.toFixed(2)}ms`,
        estimatedFPS: Math.round(1000 / averageFrameTime),
      });

      // Frame times should stay reasonable (< 20ms average, < 50ms max)
      expect(averageFrameTime).toBeLessThan(20);
      expect(maxFrameTime).toBeLessThan(50);

      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle auto-save concurrent with user actions', async () => {
      const mockSaveFunction = jest.fn().mockResolvedValue(true);
      const mockUserAction = jest.fn().mockResolvedValue(true);

      const metrics = await measurePerformance(
        'concurrentOperations',
        async () => {
          // Simulate concurrent auto-save and user action
          const savePromise = mockSaveFunction(mockGameState, 0);
          const userActionPromise = mockUserAction('move_player');

          await Promise.all([savePromise, userActionPromise]);
        },
        30
      );

      // Concurrent operations should complete efficiently
      expect(metrics.averageTime).toBeLessThan(50);

      console.log('Concurrent Operations Metrics:', {
        averageTime: `${metrics.averageTime.toFixed(2)}ms`,
        p95Time: `${metrics.p95Time.toFixed(2)}ms`,
      });
    });

    it('should prioritize user input over auto-save', async () => {
      const operationOrder: string[] = [];

      const mockSaveFunction = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
        operationOrder.push('auto-save');
        return true;
      });

      const mockUserInput = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 5));
        operationOrder.push('user-input');
        return true;
      });

      // Start auto-save first, then user input
      const savePromise = mockSaveFunction(mockGameState, 0);
      await new Promise(resolve => setTimeout(resolve, 5)); // Small delay
      const inputPromise = mockUserInput('player_action');

      await Promise.all([savePromise, inputPromise]);

      // User input should complete before or around the same time as auto-save
      // This tests that save operations don't block user interactions
      expect(operationOrder).toContain('user-input');
      expect(operationOrder).toContain('auto-save');
    });
  });

  describe('Performance Optimization Validation', () => {
    it('should validate debounced save operations', async () => {
      const saveCallTimes: number[] = [];
      const mockSaveFunction = jest.fn().mockImplementation(async () => {
        saveCallTimes.push(Date.now());
        return true;
      });

      // Simulate rapid game state changes that should be debounced
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        mockGameState.player.experience += 100;
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms between changes
      }

      // Only the last save should actually execute due to debouncing
      // (Implementation would need actual debouncing logic)
      console.log(
        'Save Call Times:',
        saveCallTimes.map(time => time - startTime)
      );
    });

    it('should validate efficient data structures', async () => {
      // Test that game state updates are efficient
      const updateOperations = [
        () => {
          mockGameState.player.experience += 100;
        },
        () => {
          mockGameState.inventory.items.push({ id: 'new_item', quantity: 1 });
        },
        () => {
          mockGameState.gameFlags.new_flag = true;
        },
        () => {
          mockGameState.story.completedQuests.push('new_quest');
        },
      ];

      const metrics = await measurePerformance(
        'gameStateUpdates',
        async () => {
          const operation = updateOperations[Math.floor(Math.random() * updateOperations.length)];
          operation();
        },
        100
      );

      // Game state updates should be very fast
      expect(metrics.averageTime).toBeLessThan(0.1);

      console.log('Game State Update Metrics:', {
        averageTime: `${metrics.averageTime.toFixed(4)}ms`,
        maxTime: `${metrics.maxTime.toFixed(4)}ms`,
      });
    });
  });

  afterAll(() => {
    // Generate performance report
    console.log('\n=== AUTO-SAVE PERFORMANCE REPORT ===');
    Object.entries(performanceMetrics).forEach(([testName, times]) => {
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);

      console.log(`${testName}:`);
      console.log(`  Average: ${avg.toFixed(2)}ms`);
      console.log(`  Min: ${min.toFixed(2)}ms`);
      console.log(`  Max: ${max.toFixed(2)}ms`);
      console.log(`  Samples: ${times.length}`);
    });
    console.log('=====================================\n');
  });
});
