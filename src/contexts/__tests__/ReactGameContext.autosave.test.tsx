/**
 * Tests for ReactGameContext - Auto-save Integration
 *
 * Tests the auto-save triggering mechanism after breeding completes.
 * This ensures that bred creatures are persisted to localStorage.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactGameProvider, useReactGame } from '../ReactGameContext';
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
    attack: 50,
    defense: 50,
    magicAttack: 50,
    magicDefense: 50,
    speed: 50,
    accuracy: 90,
  };

  return {
    creatureId: id,
    id,
    name: `Creature ${id}`,
    species: 'test_species',
    level: 10,
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
// AUTO-SAVE INTEGRATION TESTS
// =============================================================================

describe('ReactGameContext - Auto-save after breeding', () => {
  beforeEach(() => {
    // Clear any existing auto-save manager
    delete (window as any).gameAutoSaveManager;
  });

  it('should trigger auto-save when creatures.lastUpdated changes', async () => {
    // Mock the auto-save manager
    const mockForceSave = jest.fn().mockResolvedValue(true);
    (window as any).gameAutoSaveManager = {
      forceSave: mockForceSave,
    };

    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
      result.current.updatePlayer({ gold: 1000 });
    });

    const parent1 = createMockCreature('parent_1');
    const parent2 = createMockCreature('parent_2');

    act(() => {
      result.current.updateCreatureCollection({
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
      });
    });

    // Clear previous calls
    mockForceSave.mockClear();

    // WHEN: Breed creatures (updates lastUpdated)
    act(() => {
      result.current.breedCreatures('parent_1', 'parent_2');
    });

    // THEN: Auto-save triggered after delay
    await waitFor(
      () => {
        expect(mockForceSave).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );
  });

  it('should not trigger auto-save when lastUpdated is unchanged', async () => {
    // Mock the auto-save manager
    const mockForceSave = jest.fn().mockResolvedValue(true);
    (window as any).gameAutoSaveManager = {
      forceSave: mockForceSave,
    };

    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
    });

    mockForceSave.mockClear();

    // WHEN: Update player (doesn't change creatures.lastUpdated)
    act(() => {
      result.current.updatePlayer({ gold: 500 });
    });

    // Wait to ensure no save is triggered
    await new Promise(resolve => setTimeout(resolve, 600));

    // THEN: Auto-save NOT called (only triggers on creatures.lastUpdated change)
    expect(mockForceSave).not.toHaveBeenCalled();
  });

  it('should handle auto-save failure gracefully', async () => {
    // Mock console.error to verify error logging
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock failed save
    const mockForceSave = jest.fn().mockResolvedValue(false);
    (window as any).gameAutoSaveManager = {
      forceSave: mockForceSave,
    };

    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
      result.current.updatePlayer({ gold: 1000 });
    });

    const parent1 = createMockCreature('parent_1');
    const parent2 = createMockCreature('parent_2');

    act(() => {
      result.current.updateCreatureCollection({
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
      });
    });

    mockForceSave.mockClear();
    consoleErrorSpy.mockClear();

    // WHEN: Breed (triggers failed save)
    act(() => {
      result.current.breedCreatures('parent_1', 'parent_2');
    });

    // THEN: Error logged but doesn't crash
    await waitFor(
      () => {
        expect(mockForceSave).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );

    // Verify error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Auto-save failed'));

    consoleErrorSpy.mockRestore();
  });

  it('should log error when AutoSaveManager not initialized', async () => {
    // Mock console.error
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Ensure no auto-save manager exists
    delete (window as any).gameAutoSaveManager;

    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
      result.current.updatePlayer({ gold: 1000 });
    });

    const parent1 = createMockCreature('parent_1');
    const parent2 = createMockCreature('parent_2');

    act(() => {
      result.current.updateCreatureCollection({
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
      });
    });

    consoleErrorSpy.mockClear();

    // WHEN: Breed without AutoSaveManager
    act(() => {
      result.current.breedCreatures('parent_1', 'parent_2');
    });

    // THEN: Error logged about missing AutoSaveManager
    await waitFor(
      () => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('AutoSaveManager not initialized')
        );
      },
      { timeout: 1000 }
    );

    consoleErrorSpy.mockRestore();
  });

  it('should wait 500ms before triggering auto-save', async () => {
    jest.useFakeTimers();

    const mockForceSave = jest.fn().mockResolvedValue(true);
    (window as any).gameAutoSaveManager = {
      forceSave: mockForceSave,
    };

    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
      result.current.updatePlayer({ gold: 1000 });
    });

    const parent1 = createMockCreature('parent_1');
    const parent2 = createMockCreature('parent_2');

    act(() => {
      result.current.updateCreatureCollection({
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
      });
    });

    mockForceSave.mockClear();

    // WHEN: Breed
    act(() => {
      result.current.breedCreatures('parent_1', 'parent_2');
    });

    // THEN: Not called immediately
    expect(mockForceSave).not.toHaveBeenCalled();

    // Advance timers by 400ms (not enough)
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(mockForceSave).not.toHaveBeenCalled();

    // Advance timers by another 100ms (total 500ms)
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Now should be called
    await waitFor(() => {
      expect(mockForceSave).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });
});
