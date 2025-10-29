/**
 * Tests for useCreatures Hook - Breeding Integration
 *
 * Tests the CRITICAL FIX that prevents bred creatures from being overwritten.
 * This test file focuses on the sync behavior between local state and global state.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactGameProvider } from '../../contexts/ReactGameContext';
import { useCreatures } from '../useCreatures';
import { useGameState } from '../useGameState';
import { EnhancedCreature } from '../../types/creatures';
import { PlayerStats } from '../../types/game';

// =============================================================================
// TEST SETUP
// =============================================================================

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactGameProvider>{children}</ReactGameProvider>
);

const createMockCreature = (
  id: string,
  overrides?: Partial<EnhancedCreature>
): EnhancedCreature => {
  const baseStats: PlayerStats = {
    attack: 20,
    defense: 20,
    magicAttack: 20,
    magicDefense: 20,
    speed: 20,
    accuracy: 85,
  };

  return {
    creatureId: id,
    id,
    name: `Creature ${id}`,
    species: 'test_species',
    level: 5,
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    currentHealth: 100,
    maxHealth: 100,
    baseStats,
    currentStats: baseStats,
    stats: baseStats,
    types: ['beast'],
    rarity: 'common',
    abilities: ['slash'],
    captureRate: 0.5,
    experience: 0,
    gold: 10,
    drops: [],
    areas: [],
    evolvesTo: [],
    isWild: false,
    element: 'neutral',
    creatureType: 'beast',
    size: 'medium',
    habitat: ['forest'],
    personality: {
      traits: ['docile'],
      mood: 'content',
      loyalty: 50,
      happiness: 100,
      energy: 100,
      sociability: 50,
    },
    nature: {
      name: 'Neutral',
      statModifiers: {},
      behaviorModifiers: {
        aggression: 0,
        defensiveness: 0,
        cooperation: 0,
      },
    },
    individualStats: {
      hpIV: 15,
      attackIV: 15,
      defenseIV: 15,
      magicAttackIV: 15,
      magicDefenseIV: 15,
      speedIV: 15,
      hpEV: 0,
      attackEV: 0,
      defenseEV: 0,
      magicAttackEV: 0,
      magicDefenseEV: 0,
      speedEV: 0,
    },
    genetics: {
      parentIds: [],
      generation: 0,
      inheritedTraits: [],
      mutations: [],
      breedingPotential: 100,
    },
    breedingGroup: ['beast'],
    fertility: 100,
    generation: 0,
    breedingCount: 0,
    exhaustionLevel: 0,
    inheritedAbilities: [],
    parentIds: [],
    statCaps: {},
    collectionStatus: {
      discovered: true,
      captured: true,
      timesCaptures: 1,
      favorite: false,
      tags: [],
      notes: '',
      completionLevel: 'captured',
      firstSeenDate: Date.now(),
      captureCount: 1,
      releaseCount: 0,
      breedCount: 0,
    },
    sprite: 'test.png',
    description: 'A test creature',
    loreText: 'Test lore',
    discoveryLocation: 'Test Area',
    discoveredAt: new Date(),
    capturedAt: new Date(),
    timesEncountered: 1,
    capturedBy: 'Test Player',
    captureDate: Date.now(),
    captureLocation: 'Test Area',
    nickname: undefined,
    isFavorite: false,
    isCompanion: false,
    ...overrides,
  };
};

// =============================================================================
// CRITICAL FIX TESTS - Breeding Sync Behavior
// =============================================================================

describe('useCreatures - Breeding Integration (CRITICAL FIX)', () => {
  it('should not overwrite global state when creatures already exist', async () => {
    // This test verifies the CRITICAL FIX at useCreatures.ts:316-348
    const { result: gameStateResult } = renderHook(() => useGameState(), { wrapper });

    // SETUP: Create initial collection with 4 creatures
    const existingCreatures: Record<string, EnhancedCreature> = {
      creature_1: createMockCreature('creature_1'),
      creature_2: createMockCreature('creature_2'),
      creature_3: createMockCreature('creature_3'),
      creature_4: createMockCreature('creature_4'),
    };

    // Simulate breeding: Add a 5th creature (offspring) directly to global state
    const bredCreature = createMockCreature('creature_bred_1', {
      name: 'Offspring',
      generation: 1,
      parentIds: ['creature_1', 'creature_2'],
    });

    act(() => {
      gameStateResult.current.updateGameState({
        creatures: {
          creatures: {
            ...existingCreatures,
            creature_bred_1: bredCreature,
          },
          bestiary: {},
          activeTeam: [],
          reserves: [],
          totalDiscovered: 5,
          totalCaptured: 5,
          completionPercentage: 0,
          favoriteSpecies: [],
          activeBreeding: [],
          breedingHistory: [],
          activeTrades: [],
          tradeHistory: [],
          autoSort: true,
          showStats: true,
          groupBy: 'species',
          filter: {
            types: [],
            elements: [],
            rarities: [],
            completionLevels: [],
            favorites: false,
            companions: false,
            breedable: false,
            searchText: '',
          },
          lastUpdated: Date.now(),
        },
      });
    });

    // WHEN: useCreatures hook processes the collection
    const { result: creaturesResult } = renderHook(() => useCreatures(), { wrapper });

    // Wait for sync to complete
    await waitFor(() => {
      expect(Object.keys(creaturesResult.current.collection.creatures).length).toBeGreaterThan(0);
    });

    // THEN: Global state still has 5 creatures (bred creature preserved)
    const globalCreatureCount = Object.keys(
      gameStateResult.current.gameState.creatures?.creatures || {}
    ).length;

    expect(globalCreatureCount).toBe(5);
    expect(gameStateResult.current.gameState.creatures?.creatures['creature_bred_1']).toBeDefined();
    expect(gameStateResult.current.gameState.creatures?.creatures['creature_bred_1']?.name).toBe(
      'Offspring'
    );
  });

  it('should sync to global state when global state is empty', async () => {
    // This test verifies initial sync behavior
    const { result: gameStateResult } = renderHook(() => useGameState(), { wrapper });

    // SETUP: Ensure global state starts empty
    act(() => {
      gameStateResult.current.updateGameState({
        creatures: {
          creatures: {},
          bestiary: {},
          activeTeam: [],
          reserves: [],
          totalDiscovered: 0,
          totalCaptured: 0,
          completionPercentage: 0,
          favoriteSpecies: [],
          activeBreeding: [],
          breedingHistory: [],
          activeTrades: [],
          tradeHistory: [],
          autoSort: true,
          showStats: true,
          groupBy: 'species',
          filter: {
            types: [],
            elements: [],
            rarities: [],
            completionLevels: [],
            favorites: false,
            companions: false,
            breedable: false,
            searchText: '',
          },
        },
      });
    });

    // Verify global state is empty
    const initialGlobalCount = Object.keys(
      gameStateResult.current.gameState.creatures?.creatures || {}
    ).length;
    expect(initialGlobalCount).toBe(0);

    // WHEN: Add captured monsters to simulate first-time capture
    act(() => {
      gameStateResult.current.gameState.capturedMonsters = [
        {
          id: 'monster_1',
          name: 'Slime',
          species: 'slime',
          level: 3,
          hp: 30,
          maxHp: 30,
          mp: 10,
          maxMp: 10,
          baseStats: {
            attack: 10,
            defense: 10,
            magicAttack: 5,
            magicDefense: 5,
            speed: 5,
            accuracy: 80,
          },
          currentStats: {
            attack: 10,
            defense: 10,
            magicAttack: 5,
            magicDefense: 5,
            speed: 5,
            accuracy: 80,
          },
          types: ['slime'],
          rarity: 'common',
          abilities: [],
          captureRate: 0.8,
          experience: 10,
          gold: 5,
          drops: [],
          areas: ['forest'],
          evolvesTo: [],
          isWild: true,
        } as any,
      ];
    });

    // Mount useCreatures hook
    const { result: creaturesResult } = renderHook(() => useCreatures(), { wrapper });

    // THEN: Global state should be populated
    await waitFor(
      () => {
        const globalCount = Object.keys(
          gameStateResult.current.gameState.creatures?.creatures || {}
        ).length;
        expect(globalCount).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  it('should use setTimeout to avoid React update warning', async () => {
    // This test verifies that updateGameState is called asynchronously
    const { result: gameStateResult } = renderHook(() => useGameState(), { wrapper });

    // Mock console to detect warnings
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // SETUP: Empty global state
    act(() => {
      gameStateResult.current.updateGameState({
        creatures: {
          creatures: {},
          bestiary: {},
          activeTeam: [],
          reserves: [],
          totalDiscovered: 0,
          totalCaptured: 0,
          completionPercentage: 0,
          favoriteSpecies: [],
          activeBreeding: [],
          breedingHistory: [],
          activeTrades: [],
          tradeHistory: [],
          autoSort: true,
          showStats: true,
          groupBy: 'species',
          filter: {
            types: [],
            elements: [],
            rarities: [],
            completionLevels: [],
            favorites: false,
            companions: false,
            breedable: false,
            searchText: '',
          },
        },
      });
    });

    // WHEN: Add captured monsters
    act(() => {
      gameStateResult.current.gameState.capturedMonsters = [
        {
          id: 'monster_1',
          name: 'Slime',
          species: 'slime',
          level: 3,
          hp: 30,
          maxHp: 30,
          mp: 10,
          maxMp: 10,
          baseStats: {
            attack: 10,
            defense: 10,
            magicAttack: 5,
            magicDefense: 5,
            speed: 5,
            accuracy: 80,
          },
          currentStats: {
            attack: 10,
            defense: 10,
            magicAttack: 5,
            magicDefense: 5,
            speed: 5,
            accuracy: 80,
          },
          types: ['slime'],
          rarity: 'common',
          abilities: [],
          captureRate: 0.8,
          experience: 10,
          gold: 5,
          drops: [],
          areas: ['forest'],
          evolvesTo: [],
          isWild: true,
        } as any,
      ];
    });

    renderHook(() => useCreatures(), { wrapper });

    // THEN: No React warnings should appear
    await waitFor(() => {
      const hasReactWarning = consoleWarnSpy.mock.calls.some(call =>
        call.some(
          arg => typeof arg === 'string' && arg.includes('Cannot update component during render')
        )
      );
      const hasReactError = consoleErrorSpy.mock.calls.some(call =>
        call.some(
          arg => typeof arg === 'string' && arg.includes('Cannot update component during render')
        )
      );

      expect(hasReactWarning).toBe(false);
      expect(hasReactError).toBe(false);
    });

    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

// =============================================================================
// BREEDING SCENARIO TESTS
// =============================================================================

describe('useCreatures - Breeding Scenarios', () => {
  it('should preserve bred creature after combat navigation', async () => {
    // Simulate full workflow: breed -> combat -> return
    const { result: gameStateResult } = renderHook(() => useGameState(), { wrapper });

    // SETUP: Create initial creatures
    const parent1 = createMockCreature('parent_1');
    const parent2 = createMockCreature('parent_2');

    act(() => {
      gameStateResult.current.updateGameState({
        creatures: {
          creatures: {
            parent_1: parent1,
            parent_2: parent2,
          },
          bestiary: {},
          activeTeam: [],
          reserves: [],
          totalDiscovered: 2,
          totalCaptured: 2,
          completionPercentage: 0,
          favoriteSpecies: [],
          activeBreeding: [],
          breedingHistory: [],
          activeTrades: [],
          tradeHistory: [],
          autoSort: true,
          showStats: true,
          groupBy: 'species',
          filter: {
            types: [],
            elements: [],
            rarities: [],
            completionLevels: [],
            favorites: false,
            companions: false,
            breedable: false,
            searchText: '',
          },
          lastUpdated: Date.now(),
        },
      });
    });

    // STEP 1: Breed creatures (simulated)
    const offspring = createMockCreature('offspring_1', {
      name: 'Offspring',
      generation: 1,
      parentIds: ['parent_1', 'parent_2'],
    });

    act(() => {
      const currentCreatures = gameStateResult.current.gameState.creatures?.creatures || {};
      gameStateResult.current.updateGameState({
        creatures: {
          ...gameStateResult.current.gameState.creatures!,
          creatures: {
            ...currentCreatures,
            offspring_1: offspring,
          },
          totalCaptured: 3,
          lastUpdated: Date.now(),
        },
      });
    });

    // STEP 2: Verify offspring exists
    let globalCreatures = gameStateResult.current.gameState.creatures?.creatures || {};
    expect(Object.keys(globalCreatures).length).toBe(3);
    expect(globalCreatures['offspring_1']).toBeDefined();

    // STEP 3: Simulate combat navigation (re-mount useCreatures)
    const { result: creaturesResult } = renderHook(() => useCreatures(), { wrapper });

    await waitFor(() => {
      expect(Object.keys(creaturesResult.current.collection.creatures).length).toBeGreaterThan(0);
    });

    // STEP 4: Verify offspring still exists after re-mount
    globalCreatures = gameStateResult.current.gameState.creatures?.creatures || {};
    expect(Object.keys(globalCreatures).length).toBe(3);
    expect(globalCreatures['offspring_1']).toBeDefined();
    expect(globalCreatures['offspring_1']?.name).toBe('Offspring');
  });

  it('should handle multiple breeding cycles correctly', async () => {
    const { result: gameStateResult } = renderHook(() => useGameState(), { wrapper });

    // SETUP: Initial creatures
    const initialCreatures: Record<string, EnhancedCreature> = {
      creature_1: createMockCreature('creature_1'),
      creature_2: createMockCreature('creature_2'),
    };

    act(() => {
      gameStateResult.current.updateGameState({
        creatures: {
          creatures: initialCreatures,
          bestiary: {},
          activeTeam: [],
          reserves: [],
          totalDiscovered: 2,
          totalCaptured: 2,
          completionPercentage: 0,
          favoriteSpecies: [],
          activeBreeding: [],
          breedingHistory: [],
          activeTrades: [],
          tradeHistory: [],
          autoSort: true,
          showStats: true,
          groupBy: 'species',
          filter: {
            types: [],
            elements: [],
            rarities: [],
            completionLevels: [],
            favorites: false,
            companions: false,
            breedable: false,
            searchText: '',
          },
          lastUpdated: Date.now(),
        },
      });
    });

    // CYCLE 1: Breed first offspring
    const offspring1 = createMockCreature('offspring_1', {
      generation: 1,
      parentIds: ['creature_1', 'creature_2'],
    });

    act(() => {
      const currentCreatures = gameStateResult.current.gameState.creatures?.creatures || {};
      gameStateResult.current.updateGameState({
        creatures: {
          ...gameStateResult.current.gameState.creatures!,
          creatures: {
            ...currentCreatures,
            offspring_1: offspring1,
          },
          totalCaptured: 3,
          lastUpdated: Date.now(),
        },
      });
    });

    // CYCLE 2: Breed second offspring
    const offspring2 = createMockCreature('offspring_2', {
      generation: 1,
      parentIds: ['creature_1', 'creature_2'],
    });

    act(() => {
      const currentCreatures = gameStateResult.current.gameState.creatures?.creatures || {};
      gameStateResult.current.updateGameState({
        creatures: {
          ...gameStateResult.current.gameState.creatures!,
          creatures: {
            ...currentCreatures,
            offspring_2: offspring2,
          },
          totalCaptured: 4,
          lastUpdated: Date.now(),
        },
      });
    });

    // Mount useCreatures after multiple breeding cycles
    renderHook(() => useCreatures(), { wrapper });

    await waitFor(() => {
      const globalCreatures = gameStateResult.current.gameState.creatures?.creatures || {};
      expect(Object.keys(globalCreatures).length).toBe(4);
      expect(globalCreatures['offspring_1']).toBeDefined();
      expect(globalCreatures['offspring_2']).toBeDefined();
    });
  });
});
