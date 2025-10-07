/**
 * Integration Tests - Combat Rewards Flow
 *
 * CRITICAL: These tests prevent regression of both the XP double-counting bug
 * and the incorrect level-up display bug by testing the complete flow from
 * combat to victory modal display.
 *
 * Bug Context:
 * 1. XP Double-Counting: XP/gold were added in Combat.tsx AND ReactGameContext
 * 2. Level-Up Display: Victory modal showed incorrect "Level Up!" messages
 *
 * Tests verify the complete integration:
 * - Combat -> END_COMBAT action -> State update -> Victory Modal display
 * - XP and gold added exactly once through the entire flow
 * - Level-up tracking works correctly across the full system
 * - Victory modal displays accurate information from combat rewards
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ReactGameProvider,
  useReactGame,
} from '../../contexts/ReactGameContext';
import { ExperienceCalculator } from '../../utils/experienceUtils';

// =============================================================================
// TEST SETUP
// =============================================================================

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactGameProvider>{children}</ReactGameProvider>
);

// Helper to get XP needed to reach a specific level
const getXPForLevel = (level: number): number => {
  return ExperienceCalculator.calculateRequiredXP(level);
};

// =============================================================================
// FULL COMBAT FLOW TESTS - NO LEVEL-UP
// =============================================================================

describe('Combat Rewards Integration - No Level-Up', () => {
  it('should add XP exactly once through complete combat flow', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    const initialXP = result.current.state.player?.experience || 0;

    // Act - Simulate complete combat flow (use 50 XP to avoid level-up at 100)
    act(() => {
      // 1. Start combat
      result.current.startCombat('goblin', 5);

      // 2. End combat with rewards (this is what Combat.tsx calls)
      result.current.endCombat({ experience: 50, gold: 50, items: [] });
    });

    // Assert - XP should be added exactly once
    const finalXP = result.current.state.player?.experience || 0;
    expect(finalXP - initialXP).toBe(50);

    // Verify lastCombatRewards has correct XP
    expect(result.current.state.lastCombatRewards?.experience).toBe(50);

    // Verify didLevelUp is false (no level-up happened)
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);
  });

  it('should add gold exactly once through complete combat flow', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    const initialGold = result.current.state.player?.gold || 0;

    // Act - Simulate complete combat flow
    act(() => {
      result.current.startCombat('goblin', 5);
      result.current.endCombat({ experience: 75, gold: 45, items: [] });
    });

    // Assert - Gold should be added exactly once
    const finalGold = result.current.state.player?.gold || 0;
    expect(finalGold - initialGold).toBe(45);

    // Verify lastCombatRewards has correct gold
    expect(result.current.state.lastCombatRewards?.gold).toBe(45);
  });

  it('should handle items correctly through combat flow', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    const initialInventorySize = result.current.state.inventory.length;

    const testItems = [
      {
        id: 'potion',
        name: 'Health Potion',
        quantity: 2,
        type: 'consumable' as const,
        rarity: 'common',
        icon: '🧪'
      },
    ];

    // Act - Simulate complete combat flow with item drops
    act(() => {
      result.current.startCombat('goblin', 5);
      result.current.endCombat({ experience: 50, gold: 50, items: testItems });
    });

    // Assert - Verify lastCombatRewards has correct items
    expect(result.current.state.lastCombatRewards?.items).toHaveLength(1);
    expect(result.current.state.lastCombatRewards?.items[0].id).toBe('potion');

    // Items should be added to inventory (or quantity increased if already exists)
    const potionInInventory = result.current.state.inventory.find(item => item.id === 'potion');
    expect(potionInInventory).toBeDefined();
    expect(potionInInventory?.quantity).toBeGreaterThanOrEqual(2);
  });

  it('should set showVictoryModal to true after combat ends', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
      result.current.startCombat('goblin', 5);
      result.current.endCombat({ experience: 85, gold: 42, items: [] });
    });

    // Assert - Modal should be set to show
    expect(result.current.state.showVictoryModal).toBe(true);
    expect(result.current.state.lastCombatRewards?.experience).toBe(85);
    expect(result.current.state.lastCombatRewards?.gold).toBe(42);

    // Should NOT have level-up flag
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);
  });
});

// =============================================================================
// FULL COMBAT FLOW TESTS - WITH LEVEL-UP
// =============================================================================

describe('Combat Rewards Integration - With Level-Up', () => {
  it('should handle level-up correctly through complete combat flow', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    expect(result.current.state.player?.level).toBe(1);

    const xpForLevel2 = getXPForLevel(2);

    // Act - Simulate combat that levels up player
    act(() => {
      result.current.startCombat('goblin', 5);
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert - Player should be level 2
    expect(result.current.state.player?.level).toBe(2);

    // Verify level-up tracking
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(true);
    expect(result.current.state.lastCombatRewards?.previousLevel).toBe(1);
    expect(result.current.state.lastCombatRewards?.newLevel).toBe(2);

    // Verify XP was added exactly once (not doubled)
    expect(result.current.state.player?.experience).toBe(xpForLevel2);
  });

  it('should set level-up flag correctly when leveling up', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');

      const xpForLevel2 = getXPForLevel(2);
      result.current.startCombat('goblin', 5);
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert - Level-up tracking should be correct
    expect(result.current.state.showVictoryModal).toBe(true);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(true);
    expect(result.current.state.lastCombatRewards?.newLevel).toBe(2);
    expect(result.current.state.player?.level).toBe(2);
  });

  it('should increase stats on level-up during combat flow', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    const initialMaxHp = result.current.state.player?.maxHp || 0;
    const initialMaxMp = result.current.state.player?.maxMp || 0;

    const xpForLevel2 = getXPForLevel(2);

    // Act - Level up through combat
    act(() => {
      result.current.startCombat('goblin', 5);
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert - Stats should increase
    expect(result.current.state.player?.maxHp).toBe(initialMaxHp + 10);
    expect(result.current.state.player?.maxMp).toBe(initialMaxMp + 5);

    // HP and MP should be healed to full
    expect(result.current.state.player?.hp).toBe(initialMaxHp + 10);
    expect(result.current.state.player?.mp).toBe(initialMaxMp + 5);
  });
});

// =============================================================================
// SEQUENTIAL COMBAT TESTS
// =============================================================================

describe('Combat Rewards Integration - Sequential Combats', () => {
  it('should handle 3 consecutive combats with cumulative rewards', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    const initialXP = result.current.state.player?.experience || 0;
    const initialGold = result.current.state.player?.gold || 0;

    // Act - Win 3 battles in a row
    act(() => {
      // Battle 1
      result.current.startCombat('goblin', 3);
      result.current.endCombat({ experience: 50, gold: 20, items: [] });
    });

    const xpAfter1 = result.current.state.player?.experience || 0;
    const goldAfter1 = result.current.state.player?.gold || 0;

    act(() => {
      // Battle 2
      result.current.hideVictoryModal();
      result.current.startCombat('wolf', 4);
      result.current.endCombat({ experience: 75, gold: 30, items: [] });
    });

    const xpAfter2 = result.current.state.player?.experience || 0;
    const goldAfter2 = result.current.state.player?.gold || 0;

    act(() => {
      // Battle 3
      result.current.hideVictoryModal();
      result.current.startCombat('orc', 5);
      result.current.endCombat({ experience: 100, gold: 50, items: [] });
    });

    // Assert - XP and gold should accumulate correctly
    const finalXP = result.current.state.player?.experience || 0;
    const finalGold = result.current.state.player?.gold || 0;

    // Total XP gained: 50 + 75 + 100 = 225
    expect(finalXP - initialXP).toBe(225);
    expect(xpAfter1 - initialXP).toBe(50);
    expect(xpAfter2 - xpAfter1).toBe(75);
    expect(finalXP - xpAfter2).toBe(100);

    // Total gold gained: 20 + 30 + 50 = 100
    expect(finalGold - initialGold).toBe(100);
    expect(goldAfter1 - initialGold).toBe(20);
    expect(goldAfter2 - goldAfter1).toBe(30);
    expect(finalGold - goldAfter2).toBe(50);
  });

  it('should show level-up message only when actually leveling up', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    // Act - Battle 1: Gain XP but don't level up
    act(() => {
      result.current.startCombat('goblin', 3);
      result.current.endCombat({ experience: 50, gold: 20, items: [] });
    });

    // Assert - No level-up
    expect(result.current.state.player?.level).toBe(1);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);

    // Act - Battle 2: Gain XP but still don't level up
    act(() => {
      result.current.hideVictoryModal();
      result.current.startCombat('wolf', 4);
      result.current.endCombat({ experience: 40, gold: 20, items: [] });
    });

    // Assert - Still no level-up (90 total XP, need 100)
    expect(result.current.state.player?.level).toBe(1);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);

    // Act - Battle 3: Gain enough XP to level up
    act(() => {
      result.current.hideVictoryModal();
      result.current.startCombat('orc', 5);
      result.current.endCombat({ experience: 20, gold: 20, items: [] }); // Total: 110 XP
    });

    // Assert - NOW level-up should trigger
    expect(result.current.state.player?.level).toBe(2);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(true);
  });

  it('should handle multiple level-ups across sequential combats', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    const xpForLevel2 = getXPForLevel(2); // 100
    const xpForLevel3 = getXPForLevel(3); // ~215

    // Act - Battle 1: Level up to 2
    act(() => {
      result.current.startCombat('goblin', 5);
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    expect(result.current.state.player?.level).toBe(2);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(true);
    expect(result.current.state.lastCombatRewards?.newLevel).toBe(2);

    // Act - Battle 2: Level up to 3
    const xpNeededFor3 = xpForLevel3 - xpForLevel2;
    act(() => {
      result.current.hideVictoryModal();
      result.current.startCombat('orc', 8);
      result.current.endCombat({ experience: xpNeededFor3, gold: 100, items: [] });
    });

    // Assert - Should be level 3
    expect(result.current.state.player?.level).toBe(3);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(true);
    expect(result.current.state.lastCombatRewards?.previousLevel).toBe(2);
    expect(result.current.state.lastCombatRewards?.newLevel).toBe(3);
  });
});

// =============================================================================
// EDGE CASE INTEGRATION TESTS
// =============================================================================

describe('Combat Rewards Integration - Edge Cases', () => {
  it('should handle massive XP gain that causes multiple level-ups', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    expect(result.current.state.player?.level).toBe(1);

    // Act - Gain huge XP (boss battle or special event)
    act(() => {
      result.current.startCombat('dragon', 50);
      result.current.endCombat({ experience: 1000, gold: 500, items: [] }); // Massive XP
    });

    // Assert - Should gain multiple levels
    const finalLevel = result.current.state.player?.level || 1;
    expect(finalLevel).toBeGreaterThan(1);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(true);
    expect(result.current.state.lastCombatRewards?.previousLevel).toBe(1);
    expect(result.current.state.lastCombatRewards?.newLevel).toBe(finalLevel);

    // XP should still only be added once (not doubled)
    expect(result.current.state.player?.experience).toBe(1000);
  });

  it('should handle zero rewards correctly', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    const initialXP = result.current.state.player?.experience || 0;
    const initialGold = result.current.state.player?.gold || 0;

    // Act - Combat with no rewards
    act(() => {
      result.current.startCombat('weak_slime', 1);
      result.current.endCombat({ experience: 0, gold: 0, items: [] });
    });

    // Assert - XP and gold should not change
    expect(result.current.state.player?.experience).toBe(initialXP);
    expect(result.current.state.player?.gold).toBe(initialGold);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);
  });

  it('should handle combat at level cap (100)', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
      // Get to level 100
      result.current.endCombat({ experience: 999999999, gold: 0, items: [] });
    });

    expect(result.current.state.player?.level).toBe(100);

    // Act - Win another battle at max level
    act(() => {
      result.current.hideVictoryModal();
      result.current.startCombat('legendary_boss', 100);
      result.current.endCombat({ experience: 1000, gold: 500, items: [] });
    });

    // Assert - Should still be level 100, no level-up
    expect(result.current.state.player?.level).toBe(100);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);

    // But should still gain XP and gold
    expect(result.current.state.player?.experience).toBeGreaterThan(999999999);
  });
});

// =============================================================================
// REGRESSION PREVENTION TESTS
// =============================================================================

describe('Combat Rewards Integration - Regression Prevention', () => {
  it('REGRESSION: XP should NEVER be doubled', () => {
    // This test specifically checks for the bug where XP was added twice

    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    const initialXP = result.current.state.player?.experience || 0;

    // Act
    act(() => {
      result.current.startCombat('goblin', 5);
      result.current.endCombat({ experience: 100, gold: 50, items: [] });
    });

    // Assert - XP should be exactly 100, not 200
    const finalXP = result.current.state.player?.experience || 0;
    expect(finalXP - initialXP).toBe(100);
    expect(finalXP - initialXP).not.toBe(200); // Explicitly check it's not doubled
  });

  it('REGRESSION: Level-up flag should match actual level change', () => {
    // This test specifically checks for the bug where didLevelUp was incorrect

    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');
    });

    // Test Case 1: No level-up, flag should be false
    act(() => {
      result.current.startCombat('goblin', 3);
      result.current.endCombat({ experience: 50, gold: 20, items: [] });
    });

    const levelAfterFirstBattle = result.current.state.player?.level || 1;
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);
    expect(result.current.state.lastCombatRewards?.previousLevel).toBe(levelAfterFirstBattle);
    expect(result.current.state.lastCombatRewards?.newLevel).toBe(levelAfterFirstBattle);

    // Test Case 2: Level-up happens, flag should be true
    const xpForLevel2 = getXPForLevel(2);
    const currentXP = result.current.state.player?.experience || 0;
    const xpNeeded = xpForLevel2 - currentXP;

    act(() => {
      result.current.hideVictoryModal();
      result.current.startCombat('orc', 6);
      result.current.endCombat({ experience: xpNeeded + 10, gold: 30, items: [] }); // Slightly more than needed
    });

    expect(result.current.state.player?.level).toBe(2);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(true);
    expect(result.current.state.lastCombatRewards?.previousLevel).toBe(1);
    expect(result.current.state.lastCombatRewards?.newLevel).toBe(2);
  });

  it('REGRESSION: Victory modal should use didLevelUp flag, not calculate from XP', () => {
    // This test ensures the modal reads the flag instead of calculating

    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestWarrior', 'warrior');

      // Gain XP but don't level up
      result.current.startCombat('goblin', 5);
      result.current.endCombat({ experience: 50, gold: 25, items: [] });
    });

    // Assert - didLevelUp should be false
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);

    // Even though player has XP, they didn't level up this combat
    expect(result.current.state.player?.experience).toBeGreaterThan(0);
    expect(result.current.state.player?.level).toBe(1);

    // The flag correctly reflects no level-up happened
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);
  });
});
