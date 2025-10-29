/**
 * Tests for ReactGameContext - Level-Up Logic
 *
 * CRITICAL: These tests prevent regression of the level-up tracking bug
 * that was fixed by adding didLevelUp, previousLevel, and newLevel tracking
 * to the lastCombatRewards state.
 *
 * Bug Context:
 * - Victory modal was showing "Level Up!" incorrectly because it checked
 *   experience >= experienceToNext AFTER level had already changed
 * - Fixed by tracking level-up state in END_COMBAT action and storing it
 *   in lastCombatRewards for the modal to use
 *
 * Tests verify:
 * - Level-up triggers correctly when XP threshold is reached
 * - didLevelUp flag is set correctly
 * - previousLevel and newLevel are tracked accurately
 * - Multiple level-ups in one combat work correctly
 * - Stats increase on level-up (HP, MP)
 * - Level cap at 100 is enforced
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ReactGameProvider, useReactGame } from '../ReactGameContext';
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

// Helper to set player to specific level with exact XP
const setPlayerToLevel = (result: any, targetLevel: number, xpIntoLevel: number = 0) => {
  const baseXP = getXPForLevel(targetLevel);
  const totalXP = baseXP + xpIntoLevel;

  // Set player XP directly by manipulating state
  act(() => {
    result.current.createCharacter('warrior', 'TestPlayer');
  });

  // Add XP to reach target level
  if (totalXP > 0) {
    act(() => {
      result.current.endCombat(totalXP, 0, []);
    });
  }
};

// =============================================================================
// LEVEL-UP TRIGGER TESTS
// =============================================================================

describe('ReactGameContext - Level-Up Triggers', () => {
  it('should trigger level-up when XP threshold is reached', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    // Player starts at level 1 with 0 XP
    expect(result.current.state.player?.level).toBe(1);

    // Calculate XP needed to reach level 2
    const xpForLevel2 = getXPForLevel(2); // Should be 100

    // Act - Gain exactly enough XP to level up
    act(() => {
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert - Player should be level 2
    expect(result.current.state.player?.level).toBe(2);
  });

  it('should NOT trigger level-up when XP is below threshold', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    // Player starts at level 1
    expect(result.current.state.player?.level).toBe(1);

    // Act - Gain XP but not enough to level up (need 100 for level 2)
    act(() => {
      result.current.endCombat({ experience: 50, gold: 20, items: [] });
    });

    // Assert - Player should still be level 1
    expect(result.current.state.player?.level).toBe(1);
    expect(result.current.state.player?.experience).toBe(50);
  });

  it('should trigger level-up exactly at XP threshold', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
      // Get to 90 XP (10 away from level 2)
      result.current.endCombat({ experience: 90, gold: 0, items: [] });
    });

    expect(result.current.state.player?.level).toBe(1);
    expect(result.current.state.player?.experience).toBe(90);

    // Act - Gain exactly 10 more XP to reach 100 (level 2 threshold)
    act(() => {
      result.current.endCombat({ experience: 10, gold: 0, items: [] });
    });

    // Assert - Should level up to 2
    expect(result.current.state.player?.level).toBe(2);
    expect(result.current.state.player?.experience).toBe(100);
  });
});

// =============================================================================
// LEVEL-UP FLAG TESTS
// =============================================================================

describe('ReactGameContext - Level-Up didLevelUp Flag', () => {
  it('should set didLevelUp to true when player levels up', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const xpForLevel2 = getXPForLevel(2);

    // Act - Level up
    act(() => {
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert - didLevelUp should be true
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(true);
  });

  it('should set didLevelUp to false when player does NOT level up', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    // Act - Gain XP but don't level up
    act(() => {
      result.current.endCombat({ experience: 50, gold: 20, items: [] });
    });

    // Assert - didLevelUp should be false
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);
  });

  it('should track previousLevel correctly', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const xpForLevel2 = getXPForLevel(2);

    // Act - Level up from 1 to 2
    act(() => {
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert - previousLevel should be 1
    expect(result.current.state.lastCombatRewards?.previousLevel).toBe(1);
  });

  it('should track newLevel correctly', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const xpForLevel2 = getXPForLevel(2);

    // Act - Level up from 1 to 2
    act(() => {
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert - newLevel should be 2
    expect(result.current.state.lastCombatRewards?.newLevel).toBe(2);
  });

  it('should track previousLevel and newLevel when not leveling up', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    // Act - Gain XP but don't level up
    act(() => {
      result.current.endCombat({ experience: 50, gold: 20, items: [] });
    });

    // Assert - Both should be 1 since no level-up occurred
    expect(result.current.state.lastCombatRewards?.previousLevel).toBe(1);
    expect(result.current.state.lastCombatRewards?.newLevel).toBe(1);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);
  });
});

// =============================================================================
// MULTIPLE LEVEL-UP TESTS
// =============================================================================

describe('ReactGameContext - Multiple Level-Ups', () => {
  it('should handle multiple level-ups in one combat', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    expect(result.current.state.player?.level).toBe(1);

    // Act - Gain massive XP to skip multiple levels
    // Level 2 = 100 XP, Level 3 = 215 XP, Level 4 = 347 XP
    act(() => {
      result.current.endCombat({ experience: 500, gold: 100, items: [] }); // Should reach level 4+
    });

    // Assert - Should have leveled up multiple times
    const finalLevel = result.current.state.player?.level || 1;
    expect(finalLevel).toBeGreaterThan(1);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(true);
    expect(result.current.state.lastCombatRewards?.previousLevel).toBe(1);
    expect(result.current.state.lastCombatRewards?.newLevel).toBe(finalLevel);
  });

  it('should apply correct stat increases for multiple level-ups', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialMaxHp = result.current.state.player?.maxHp || 0;
    const initialMaxMp = result.current.state.player?.maxMp || 0;

    // Act - Gain enough XP to level up 3 times (1 -> 4)
    act(() => {
      result.current.endCombat({ experience: 500, gold: 100, items: [] });
    });

    // Assert - Each level-up adds +10 maxHp, +5 maxMp
    const finalLevel = result.current.state.player?.level || 1;
    const levelsGained = finalLevel - 1; // Started at level 1

    const expectedMaxHp = initialMaxHp + levelsGained * 10;
    const expectedMaxMp = initialMaxMp + levelsGained * 5;

    expect(result.current.state.player?.maxHp).toBe(expectedMaxHp);
    expect(result.current.state.player?.maxMp).toBe(expectedMaxMp);
  });
});

// =============================================================================
// STAT INCREASE TESTS
// =============================================================================

describe('ReactGameContext - Level-Up Stat Increases', () => {
  it('should increase maxHp by 10 on level-up', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialMaxHp = result.current.state.player?.maxHp || 0;
    const xpForLevel2 = getXPForLevel(2);

    // Act
    act(() => {
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert
    const finalMaxHp = result.current.state.player?.maxHp || 0;
    expect(finalMaxHp).toBe(initialMaxHp + 10);
  });

  it('should increase maxMp by 5 on level-up', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const initialMaxMp = result.current.state.player?.maxMp || 0;
    const xpForLevel2 = getXPForLevel(2);

    // Act
    act(() => {
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert
    const finalMaxMp = result.current.state.player?.maxMp || 0;
    expect(finalMaxMp).toBe(initialMaxMp + 5);
  });

  it('should heal HP to full on level-up', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    // Damage player by updating HP directly
    const initialMaxHp = result.current.state.player?.maxHp || 0;
    act(() => {
      result.current.updatePlayer({ hp: initialMaxHp - 20 });
    });

    expect(result.current.state.player?.hp).toBeLessThan(result.current.state.player?.maxHp || 0);

    const xpForLevel2 = getXPForLevel(2);

    // Act - Level up
    act(() => {
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert - HP should be healed to new max
    const newMaxHp = result.current.state.player?.maxHp || 0;
    expect(result.current.state.player?.hp).toBe(newMaxHp);
  });

  it('should heal MP to full on level-up', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestMage', 'mage');
    });

    // Reduce MP for test by updating directly
    const initialMaxMp = result.current.state.player?.maxMp || 0;
    act(() => {
      result.current.updatePlayer({ mp: initialMaxMp - 10 });
    });

    const xpForLevel2 = getXPForLevel(2);

    // Act - Level up
    act(() => {
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert - MP should be healed to new max
    const newMaxMp = result.current.state.player?.maxMp || 0;
    expect(result.current.state.player?.mp).toBe(newMaxMp);
  });
});

// =============================================================================
// EXPERIENCE TO NEXT LEVEL TESTS
// =============================================================================

describe('ReactGameContext - Experience To Next Level', () => {
  it('should recalculate experienceToNext after level-up', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    const xpForLevel2 = getXPForLevel(2);

    // Act - Level up to 2
    act(() => {
      result.current.endCombat({ experience: xpForLevel2, gold: 50, items: [] });
    });

    // Assert - experienceToNext should be for level 3
    const xpForLevel3 = getXPForLevel(3);
    const currentXp = result.current.state.player?.experience || 0;
    const expectedXpToNext = xpForLevel3 - currentXp;

    expect(result.current.state.player?.experienceToNext).toBe(expectedXpToNext);
  });

  it('should update experienceToNext correctly with partial progress', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    // Get to level 2 with some extra XP
    const xpForLevel2 = getXPForLevel(2);
    const extraXp = 50;

    // Act
    act(() => {
      result.current.endCombat({ experience: xpForLevel2 + extraXp, gold: 50, items: [] });
    });

    // Assert - experienceToNext should account for extra XP
    const xpForLevel3 = getXPForLevel(3);
    const currentXp = xpForLevel2 + extraXp;
    const expectedXpToNext = xpForLevel3 - currentXp;

    expect(result.current.state.player?.experienceToNext).toBe(expectedXpToNext);
  });
});

// =============================================================================
// LEVEL CAP TESTS
// =============================================================================

describe('ReactGameContext - Level Cap', () => {
  it('should not exceed level 100', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    // Act - Gain insane amount of XP (should hit level cap)
    act(() => {
      result.current.endCombat({ experience: 999999999, gold: 50, items: [] });
    });

    // Assert - Level should be capped at 100
    expect(result.current.state.player?.level).toBe(100);
  });

  it('should not level up when already at level 100', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
      // Get to level 100
      result.current.endCombat({ experience: 999999999, gold: 0, items: [] });
    });

    expect(result.current.state.player?.level).toBe(100);

    // Act - Try to gain more XP
    act(() => {
      result.current.endCombat({ experience: 1000, gold: 50, items: [] });
    });

    // Assert - Should still be level 100
    expect(result.current.state.player?.level).toBe(100);
  });

  it('should set experienceToNext to 0 at level 100', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
      // Get to level 100
      result.current.endCombat({ experience: 999999999, gold: 0, items: [] });
    });

    // Assert - experienceToNext should be 0 (no more levels)
    expect(result.current.state.player?.experienceToNext).toBe(0);
  });
});

// =============================================================================
// SEQUENTIAL COMBAT TESTS
// =============================================================================

describe('ReactGameContext - Sequential Combat Level-Ups', () => {
  it('should correctly track level-ups across multiple combats', () => {
    // Arrange
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.createPlayer('TestPlayer', 'warrior');
    });

    // Act - First combat: get to 90 XP (no level-up)
    act(() => {
      result.current.endCombat({ experience: 90, gold: 20, items: [] });
    });

    expect(result.current.state.player?.level).toBe(1);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);

    // Act - Second combat: gain 20 XP (should level up to 2)
    act(() => {
      result.current.endCombat({ experience: 20, gold: 20, items: [] });
    });

    expect(result.current.state.player?.level).toBe(2);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(true);
    expect(result.current.state.lastCombatRewards?.previousLevel).toBe(1);
    expect(result.current.state.lastCombatRewards?.newLevel).toBe(2);

    // Act - Third combat: gain 50 XP (no level-up)
    act(() => {
      result.current.endCombat({ experience: 50, gold: 20, items: [] });
    });

    expect(result.current.state.player?.level).toBe(2);
    expect(result.current.state.lastCombatRewards?.didLevelUp).toBe(false);
  });
});
