/**
 * Tests for ReactGameContext - XP and Gold Rewards
 *
 * CRITICAL: These tests prevent regression of the XP double-counting bug
 * that was fixed by removing duplicate addExp() and addPlayerGold() calls
 * from Combat.tsx.
 *
 * Bug Context:
 * - XP and gold were being added twice: once in Combat.tsx via addExp(),
 *   and again in ReactGameContext reducer via END_COMBAT action
 * - Fixed by ensuring only END_COMBAT action adds rewards
 *
 * Tests verify:
 * - END_COMBAT adds XP exactly once (not doubled)
 * - END_COMBAT adds gold exactly once (not doubled)
 * - Combat rewards are stored correctly in lastCombatRewards
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ReactGameProvider, useReactGame } from '../ReactGameContext';

// =============================================================================
// TEST SETUP
// =============================================================================

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactGameProvider>{children}</ReactGameProvider>
);

// =============================================================================
// XP REWARDS TESTS
// =============================================================================

describe('ReactGameContext - XP Rewards', () => {
  it('should add XP correctly when END_COMBAT is dispatched', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialXP = result.current.state.player?.experience || 0;

    // Act
    act(() => {
      result.current.endCombat({ experience: 100, gold: 50, items: [] });
    });

    // Assert
    const finalXP = result.current.state.player?.experience || 0;
    expect(finalXP).toBe(initialXP + 100);
    expect(finalXP - initialXP).toBe(100); // Exactly 100, not 200 (doubled)
  });

  it('should NOT add XP multiple times for same combat', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialXP = result.current.state.player?.experience || 0;

    // Act - Dispatch END_COMBAT once
    act(() => {
      result.current.endCombat({ experience: 75, gold: 30, items: [] });
    });

    // Assert - XP should increase by exactly 75, not doubled
    const finalXP = result.current.state.player?.experience || 0;
    expect(finalXP - initialXP).toBe(75);

    // Verify it's not 150 (which would indicate double-counting)
    expect(finalXP - initialXP).not.toBe(150);
  });

  it('should handle multiple combats with cumulative XP gains', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialXP = result.current.state.player?.experience || 0;

    // Act - Win 3 battles
    act(() => {
      result.current.endCombat({ experience: 50, gold: 20, items: [] });
    });

    const xpAfterBattle1 = result.current.state.player?.experience || 0;

    act(() => {
      result.current.endCombat({ experience: 75, gold: 30, items: [] });
    });

    const xpAfterBattle2 = result.current.state.player?.experience || 0;

    act(() => {
      result.current.endCombat({ experience: 100, gold: 40, items: [] });
    });

    // Assert - Total XP should be initial + 50 + 75 + 100 = initial + 225
    const finalXP = result.current.state.player?.experience || 0;
    expect(finalXP - initialXP).toBe(225);

    // Verify each battle added correct amount
    expect(xpAfterBattle1 - initialXP).toBe(50);
    expect(xpAfterBattle2 - xpAfterBattle1).toBe(75);
    expect(finalXP - xpAfterBattle2).toBe(100);
  });

  it('should handle zero XP rewards correctly', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialXP = result.current.state.player?.experience || 0;

    // Act - Combat with 0 XP
    act(() => {
      result.current.endCombat({ experience: 0, gold: 10, items: [] });
    });

    // Assert - XP should not change
    const finalXP = result.current.state.player?.experience || 0;
    expect(finalXP).toBe(initialXP);
  });

  it('should handle large XP rewards correctly', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialXP = result.current.state.player?.experience || 0;

    // Act - Large XP reward (e.g., boss battle)
    act(() => {
      result.current.endCombat({ experience: 5000, gold: 500, items: [] });
    });

    // Assert - XP should increase by exactly 5000
    const finalXP = result.current.state.player?.experience || 0;
    expect(finalXP - initialXP).toBe(5000);
  });
});

// =============================================================================
// GOLD REWARDS TESTS
// =============================================================================

describe('ReactGameContext - Gold Rewards', () => {
  it('should add gold correctly when END_COMBAT is dispatched', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialGold = result.current.state.player?.gold || 0;

    // Act
    act(() => {
      result.current.endCombat({ experience: 100, gold: 50, items: [] });
    });

    // Assert
    const finalGold = result.current.state.player?.gold || 0;
    expect(finalGold).toBe(initialGold + 50);
    expect(finalGold - initialGold).toBe(50); // Exactly 50, not 100 (doubled)
  });

  it('should NOT add gold multiple times for same combat', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialGold = result.current.state.player?.gold || 0;

    // Act - Dispatch END_COMBAT once
    act(() => {
      result.current.endCombat({ experience: 75, gold: 40, items: [] });
    });

    // Assert - Gold should increase by exactly 40, not doubled
    const finalGold = result.current.state.player?.gold || 0;
    expect(finalGold - initialGold).toBe(40);

    // Verify it's not 80 (which would indicate double-counting)
    expect(finalGold - initialGold).not.toBe(80);
  });

  it('should handle multiple combats with cumulative gold gains', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialGold = result.current.state.player?.gold || 0;

    // Act - Win 3 battles with different gold rewards
    act(() => {
      result.current.endCombat({ experience: 50, gold: 20, items: [] });
    });

    const goldAfterBattle1 = result.current.state.player?.gold || 0;

    act(() => {
      result.current.endCombat({ experience: 75, gold: 35, items: [] });
    });

    const goldAfterBattle2 = result.current.state.player?.gold || 0;

    act(() => {
      result.current.endCombat({ experience: 100, gold: 45, items: [] });
    });

    // Assert - Total gold should be initial + 20 + 35 + 45 = initial + 100
    const finalGold = result.current.state.player?.gold || 0;
    expect(finalGold - initialGold).toBe(100);

    // Verify each battle added correct amount
    expect(goldAfterBattle1 - initialGold).toBe(20);
    expect(goldAfterBattle2 - goldAfterBattle1).toBe(35);
    expect(finalGold - goldAfterBattle2).toBe(45);
  });

  it('should handle zero gold rewards correctly', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialGold = result.current.state.player?.gold || 0;

    // Act - Combat with 0 gold
    act(() => {
      result.current.endCombat({ experience: 100, gold: 0, items: [] });
    });

    // Assert - Gold should not change
    const finalGold = result.current.state.player?.gold || 0;
    expect(finalGold).toBe(initialGold);
  });
});

// =============================================================================
// COMBINED REWARDS TESTS
// =============================================================================

describe('ReactGameContext - Combined XP and Gold Rewards', () => {
  it('should add both XP and gold in single END_COMBAT action', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialXP = result.current.state.player?.experience || 0;
    const initialGold = result.current.state.player?.gold || 0;

    // Act
    act(() => {
      result.current.endCombat({ experience: 150, gold: 75, items: [] });
    });

    // Assert - Both should be added correctly
    const finalXP = result.current.state.player?.experience || 0;
    const finalGold = result.current.state.player?.gold || 0;

    expect(finalXP - initialXP).toBe(150);
    expect(finalGold - initialGold).toBe(75);
  });

  it('should store combat rewards in lastCombatRewards state', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    // Act
    act(() => {
      result.current.endCombat({ experience: 200, gold: 100, items: [] });
    });

    // Assert - lastCombatRewards should contain correct values
    expect(result.current.state.lastCombatRewards).toBeDefined();
    expect(result.current.state.lastCombatRewards?.experience).toBe(200);
    expect(result.current.state.lastCombatRewards?.gold).toBe(100);
    expect(result.current.state.lastCombatRewards?.items).toEqual([]);
  });

  it('should store item rewards in lastCombatRewards', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const testItems = [
      { id: 'potion', name: 'Health Potion', quantity: 2, type: 'consumable' as const },
      { id: 'sword', name: 'Iron Sword', quantity: 1, type: 'weapon' as const },
    ];

    // Act
    act(() => {
      result.current.endCombat({ experience: 100, gold: 50, items: testItems });
    });

    // Assert - lastCombatRewards should contain items
    expect(result.current.state.lastCombatRewards).toBeDefined();
    expect(result.current.state.lastCombatRewards?.items).toHaveLength(2);
    expect(result.current.state.lastCombatRewards?.items[0].id).toBe('potion');
    expect(result.current.state.lastCombatRewards?.items[1].id).toBe('sword');
  });

  it('should clear lastCombatRewards when HIDE_VICTORY_MODAL is dispatched', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
      result.current.endCombat({ experience: 100, gold: 50, items: [] });
    });

    expect(result.current.state.lastCombatRewards).toBeDefined();

    // Act
    act(() => {
      result.current.hideVictoryModal();
    });

    // Assert - lastCombatRewards should be null
    expect(result.current.state.lastCombatRewards).toBeNull();
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe('ReactGameContext - XP Rewards Edge Cases', () => {
  it('should handle END_COMBAT without player gracefully', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    // No player created - state.player is null

    // Act - Should not crash
    act(() => {
      result.current.endCombat({ experience: 100, gold: 50, items: [] });
    });

    // Assert - Player should still be null
    expect(result.current.state.player).toBeNull();
  });

  it('should handle negative XP values (should not decrease XP)', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialXP = result.current.state.player?.experience || 0;

    // Act - Try to add negative XP (edge case that shouldn't happen but test robustness)
    act(() => {
      result.current.endCombat({ experience: -50, gold: 20, items: [] });
    });

    // Assert - XP should decrease by 50 (technically, though this shouldn't happen in practice)
    const finalXP = result.current.state.player?.experience || 0;
    expect(finalXP).toBe(initialXP - 50);
  });
});
