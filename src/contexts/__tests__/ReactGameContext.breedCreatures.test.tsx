/**
 * Tests for ReactGameContext - BREED_CREATURES Reducer Action
 *
 * Tests the complete breeding workflow through the reducer:
 * - Offspring generation
 * - Parent exhaustion
 * - Gold deduction
 * - State timestamp updates (for auto-save triggering)
 * - Error handling
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  ReactGameProvider,
  useReactGame,
} from '../ReactGameContext';
import { EnhancedCreature } from '../../types/creatures';
import { PlayerStats } from '../../types/game';

// =============================================================================
// TEST SETUP
// =============================================================================

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactGameProvider>{children}</ReactGameProvider>
);

const createFullMockCreature = (
  id: string,
  overrides: Partial<EnhancedCreature> = {}
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
    abilities: ['slash', 'guard'],
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
      hpIV: 20,
      attackIV: 20,
      defenseIV: 20,
      magicAttackIV: 20,
      magicDefenseIV: 20,
      speedIV: 20,
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
// BREED_CREATURES REDUCER TESTS
// =============================================================================

describe('ReactGameContext - BREED_CREATURES Reducer', () => {
  it('should create offspring and add to creatures collection', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP: Create player with gold
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
      result.current.updatePlayer({ gold: 1000 });
    });

    // SETUP: Create parent creatures
    const parent1 = createFullMockCreature('parent_1', { name: 'Slime Alpha' });
    const parent2 = createFullMockCreature('parent_2', { name: 'Slime Beta' });

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
      });
    });

    // WHEN: Breed creatures
    act(() => {
      result.current.breedCreatures('parent_1', 'parent_2');
    });

    // THEN: Offspring created
    const creatures = result.current.state.creatures?.creatures || {};
    expect(Object.keys(creatures).length).toBe(3); // 2 parents + 1 offspring

    // Find offspring (any creature that's not a parent)
    const offspringId = Object.keys(creatures).find(
      id => id !== 'parent_1' && id !== 'parent_2'
    );
    expect(offspringId).toBeDefined();

    const offspring = creatures[offspringId!];
    expect(offspring).toBeDefined();
    expect(offspring.generation).toBe(1); // Gen 0 parents -> Gen 1 offspring
    expect(offspring.parentIds).toContain('parent_1');
    expect(offspring.parentIds).toContain('parent_2');
  });

  it('should update lastUpdated timestamp to trigger auto-save', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
      result.current.updatePlayer({ gold: 1000 });
    });

    const parent1 = createFullMockCreature('parent_1');
    const parent2 = createFullMockCreature('parent_2');

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
        lastUpdated: 12345, // Set known timestamp
      });
    });

    const initialTimestamp = result.current.state.creatures?.lastUpdated;
    expect(initialTimestamp).toBe(12345);

    // WHEN: Breed
    act(() => {
      result.current.breedCreatures('parent_1', 'parent_2');
    });

    // THEN: Timestamp changed
    const newTimestamp = result.current.state.creatures?.lastUpdated;
    expect(newTimestamp).toBeDefined();
    expect(newTimestamp).not.toBe(initialTimestamp);
    expect(newTimestamp).toBeGreaterThan(initialTimestamp!);
  });

  it('should handle missing parent creatures gracefully', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP: Player with gold but no creatures
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
      result.current.updatePlayer({ gold: 1000 });
    });

    act(() => {
      result.current.updateCreatureCollection({
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
      });
    });

    const initialState = result.current.state;

    // WHEN: Try to breed with non-existent creatures
    act(() => {
      result.current.breedCreatures('non_existent_1', 'non_existent_2');
    });

    // THEN: State unchanged (error handled)
    expect(result.current.state.creatures?.creatures).toEqual(initialState.creatures?.creatures);
  });

  it('should deduct breeding cost from player gold', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
      result.current.updatePlayer({ gold: 1000 });
    });

    const parent1 = createFullMockCreature('parent_1');
    const parent2 = createFullMockCreature('parent_2');

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
      });
    });

    const initialGold = result.current.state.player?.gold || 0;
    expect(initialGold).toBe(1000);

    // WHEN: Breed
    act(() => {
      result.current.breedCreatures('parent_1', 'parent_2');
    });

    // THEN: Gold deducted (base breeding cost is 300 gold for Gen 0 parents)
    const finalGold = result.current.state.player?.gold || 0;
    expect(finalGold).toBeLessThan(initialGold);
    expect(finalGold).toBe(700); // 1000 - 300 = 700
  });

  it('should apply exhaustion to parent creatures', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
      result.current.updatePlayer({ gold: 1000 });
    });

    const parent1 = createFullMockCreature('parent_1', {
      stats: { attack: 100, defense: 100, magicAttack: 100, magicDefense: 100, speed: 100, accuracy: 100 },
    });
    const parent2 = createFullMockCreature('parent_2', {
      stats: { attack: 100, defense: 100, magicAttack: 100, magicDefense: 100, speed: 100, accuracy: 100 },
    });

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
      });
    });

    // WHEN: Breed
    act(() => {
      result.current.breedCreatures('parent_1', 'parent_2');
    });

    // THEN: Parents have exhaustion applied
    const creatures = result.current.state.creatures?.creatures || {};
    const updatedParent1 = creatures['parent_1'];
    const updatedParent2 = creatures['parent_2'];

    expect(updatedParent1.exhaustionLevel).toBe(1);
    expect(updatedParent2.exhaustionLevel).toBe(1);

    // Stats reduced by 20% (exhaustion penalty)
    expect(updatedParent1.stats.attack).toBe(80); // 100 * 0.8 = 80
    expect(updatedParent2.stats.attack).toBe(80);
  });

  it('should fail when player has insufficient gold', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP: Player with low gold
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
      result.current.updatePlayer({ gold: 100 }); // Not enough for breeding
    });

    const parent1 = createFullMockCreature('parent_1');
    const parent2 = createFullMockCreature('parent_2');

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
      });
    });

    const initialCreatureCount = Object.keys(result.current.state.creatures?.creatures || {}).length;

    // WHEN: Try to breed with insufficient gold
    act(() => {
      result.current.breedCreatures('parent_1', 'parent_2');
    });

    // THEN: No offspring created (validation failed)
    const finalCreatureCount = Object.keys(result.current.state.creatures?.creatures || {}).length;
    expect(finalCreatureCount).toBe(initialCreatureCount); // Still 2 parents, no offspring
  });

  it('should initialize creatures in initialState', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    // THEN: creatures collection is initialized (not undefined)
    expect(result.current.state.creatures).toBeDefined();
    expect(result.current.state.creatures?.creatures).toBeDefined();
    expect(result.current.state.creatures?.creatures).toEqual({});
  });

  it('should increment breedingAttempts after successful breeding', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    // SETUP
    act(() => {
      result.current.createPlayer('Test Player', 'warrior');
      result.current.updatePlayer({ gold: 1000 });
    });

    const parent1 = createFullMockCreature('parent_1');
    const parent2 = createFullMockCreature('parent_2');

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
      });
    });

    const initialAttempts = result.current.state.breedingAttempts;

    // WHEN: Breed
    act(() => {
      result.current.breedCreatures('parent_1', 'parent_2');
    });

    // THEN: Attempts incremented
    expect(result.current.state.breedingAttempts).toBe(initialAttempts + 1);
  });
});
