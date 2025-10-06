/**
 * Integration Test: Breeding System Persistence
 *
 * Tests the complete breeding workflow end-to-end including:
 * - Breeding creatures
 * - State persistence through navigation
 * - Save/load functionality
 * - Combat cycle persistence
 *
 * This test verifies the CRITICAL FIX that prevents bred creatures from disappearing.
 */

import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ReactGameProvider, useReactGame } from '../../contexts/ReactGameContext';
import { useCreatures } from '../../hooks/useCreatures';
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
// FULL WORKFLOW INTEGRATION TEST
// =============================================================================

describe('Breeding System - Persistence Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should persist bred creature through combat cycle', async () => {
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });

    // STEP 1: Setup - Load game with 4 captured creatures, 500 gold
    act(() => {
      gameResult.current.createPlayer('Test Player', 'warrior');
      gameResult.current.updatePlayer({ gold: 500 });
    });

    const parent1 = createMockCreature('creature_1', { name: 'Parent 1' });
    const parent2 = createMockCreature('creature_2', { name: 'Parent 2' });
    const creature3 = createMockCreature('creature_3', { name: 'Creature 3' });
    const creature4 = createMockCreature('creature_4', { name: 'Creature 4' });

    act(() => {
      gameResult.current.updateCreatureCollection({
        creatures: {
          creature_1: parent1,
          creature_2: parent2,
          creature_3: creature3,
          creature_4: creature4,
        },
        bestiary: {},
        activeTeam: [],
        reserves: [],
        totalDiscovered: 4,
        totalCaptured: 4,
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

    // Verify initial state
    let creatures = gameResult.current.state.creatures?.creatures || {};
    expect(Object.keys(creatures).length).toBe(4);

    // STEP 2: Navigate to Breeding screen (simulated by loading useCreatures hook)
    const { result: creaturesResult } = renderHook(() => useCreatures(), { wrapper });

    await waitFor(() => {
      expect(Object.keys(creaturesResult.current.collection.creatures).length).toBeGreaterThan(0);
    });

    // STEP 3: Select two parents and breed
    act(() => {
      gameResult.current.breedCreatures('creature_1', 'creature_2');
    });

    // STEP 4: Wait for breeding to complete
    await waitFor(() => {
      const updatedCreatures = gameResult.current.state.creatures?.creatures || {};
      expect(Object.keys(updatedCreatures).length).toBe(5); // 4 + 1 offspring
    });

    // STEP 5: Verify 5 creatures in collection
    creatures = gameResult.current.state.creatures?.creatures || {};
    expect(Object.keys(creatures).length).toBe(5);

    // Find the offspring (creature that's not one of the originals)
    const offspringId = Object.keys(creatures).find(
      id => !['creature_1', 'creature_2', 'creature_3', 'creature_4'].includes(id)
    );
    expect(offspringId).toBeDefined();

    const offspring = creatures[offspringId!];
    expect(offspring).toBeDefined();
    expect(offspring.generation).toBe(1);
    expect(offspring.parentIds).toContain('creature_1');
    expect(offspring.parentIds).toContain('creature_2');

    // STEP 6: Add bred creature to team
    act(() => {
      creaturesResult.current.addToTeam(offspringId!);
    });

    await waitFor(() => {
      expect(creaturesResult.current.collection.activeTeam).toContain(offspringId!);
    });

    // STEP 7: Enter combat (simulated by changing screen)
    act(() => {
      gameResult.current.setCurrentScreen('combat');
    });

    // STEP 8: Complete combat (simulated by ending combat)
    act(() => {
      gameResult.current.endCombat({
        experience: 50,
        gold: 25,
        items: [],
      });
    });

    // STEP 9: Navigate back to inventory (remount useCreatures)
    const { result: creaturesResult2 } = renderHook(() => useCreatures(), { wrapper });

    await waitFor(() => {
      expect(Object.keys(creaturesResult2.current.collection.creatures).length).toBeGreaterThan(0);
    });

    // STEP 10: Assert - Bred creature still exists in collection
    const finalCreatures = gameResult.current.state.creatures?.creatures || {};
    expect(Object.keys(finalCreatures).length).toBe(5);
    expect(finalCreatures[offspringId!]).toBeDefined();

    // STEP 11: Assert - Bred creature still in team
    expect(creaturesResult2.current.collection.activeTeam).toContain(offspringId!);

    // STEP 12: Assert - 5 total creatures (not reverted to 4)
    expect(Object.keys(finalCreatures).length).toBe(5);
  });

  it('should save bred creature to localStorage', async () => {
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });

    // SETUP
    act(() => {
      gameResult.current.createPlayer('Test Player', 'warrior');
      gameResult.current.updatePlayer({ gold: 500 });
    });

    const parent1 = createMockCreature('creature_1');
    const parent2 = createMockCreature('creature_2');

    act(() => {
      gameResult.current.updateCreatureCollection({
        creatures: {
          creature_1: parent1,
          creature_2: parent2,
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

    // BREED
    act(() => {
      gameResult.current.breedCreatures('creature_1', 'creature_2');
    });

    await waitFor(() => {
      const creatures = gameResult.current.state.creatures?.creatures || {};
      expect(Object.keys(creatures).length).toBe(3);
    });

    // SAVE
    act(() => {
      gameResult.current.dispatch({
        type: 'SAVE_GAME',
        payload: {
          slotIndex: 0,
          saveName: 'Test Save',
          timestamp: Date.now(),
        },
      });
    });

    // Verify save exists in localStorage
    const saveData = localStorage.getItem('sawyers_rpg_save_slot_0');
    expect(saveData).toBeTruthy();

    const parsed = JSON.parse(saveData!);
    expect(parsed.creatures).toBeDefined();
    expect(Object.keys(parsed.creatures.creatures).length).toBe(3);

    // Find offspring in saved data
    const offspringId = Object.keys(parsed.creatures.creatures).find(
      (id: string) => id !== 'creature_1' && id !== 'creature_2'
    );
    expect(offspringId).toBeDefined();

    const savedOffspring = parsed.creatures.creatures[offspringId!];
    expect(savedOffspring.generation).toBe(1);
    expect(savedOffspring.parentIds).toContain('creature_1');
    expect(savedOffspring.parentIds).toContain('creature_2');
  });

  it('should load bred creature from save', async () => {
    const { result: gameResult1 } = renderHook(() => useReactGame(), { wrapper });

    // SETUP AND BREED
    act(() => {
      gameResult1.current.createPlayer('Test Player', 'warrior');
      gameResult1.current.updatePlayer({ gold: 500 });
    });

    const parent1 = createMockCreature('creature_1');
    const parent2 = createMockCreature('creature_2');

    act(() => {
      gameResult1.current.updateCreatureCollection({
        creatures: {
          creature_1: parent1,
          creature_2: parent2,
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

    act(() => {
      gameResult1.current.breedCreatures('creature_1', 'creature_2');
    });

    await waitFor(() => {
      const creatures = gameResult1.current.state.creatures?.creatures || {};
      expect(Object.keys(creatures).length).toBe(3);
    });

    // Get offspring ID before saving
    const creatures = gameResult1.current.state.creatures?.creatures || {};
    const offspringId = Object.keys(creatures).find(
      id => id !== 'creature_1' && id !== 'creature_2'
    );
    expect(offspringId).toBeDefined();

    // SAVE
    act(() => {
      gameResult1.current.dispatch({
        type: 'SAVE_GAME',
        payload: {
          slotIndex: 0,
          saveName: 'Test Save',
          timestamp: Date.now(),
        },
      });
    });

    // NEW SESSION: Load from save
    const { result: gameResult2 } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      gameResult2.current.dispatch({
        type: 'LOAD_GAME',
        payload: { slotIndex: 0 },
      });
    });

    // Wait for load to complete
    await waitFor(() => {
      expect(gameResult2.current.state.player).toBeDefined();
      expect(gameResult2.current.state.player?.name).toBe('Test Player');
    });

    // VERIFY: Bred creature appears in collection after load
    const loadedCreatures = gameResult2.current.state.creatures?.creatures || {};
    expect(Object.keys(loadedCreatures).length).toBe(3);
    expect(loadedCreatures[offspringId!]).toBeDefined();
    expect(loadedCreatures[offspringId!].generation).toBe(1);
    expect(loadedCreatures[offspringId!].parentIds).toContain('creature_1');
    expect(loadedCreatures[offspringId!].parentIds).toContain('creature_2');
  });

  it('should handle multiple save/load cycles correctly', async () => {
    const { result: gameResult } = renderHook(() => useReactGame(), { wrapper });

    // CYCLE 1: Create, breed, save
    act(() => {
      gameResult.current.createPlayer('Test Player', 'warrior');
      gameResult.current.updatePlayer({ gold: 1000 });
    });

    const parent1 = createMockCreature('creature_1');
    const parent2 = createMockCreature('creature_2');

    act(() => {
      gameResult.current.updateCreatureCollection({
        creatures: {
          creature_1: parent1,
          creature_2: parent2,
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

    act(() => {
      gameResult.current.breedCreatures('creature_1', 'creature_2');
    });

    await waitFor(() => {
      const creatures = gameResult.current.state.creatures?.creatures || {};
      expect(Object.keys(creatures).length).toBe(3);
    });

    act(() => {
      gameResult.current.dispatch({
        type: 'SAVE_GAME',
        payload: {
          slotIndex: 0,
          saveName: 'Save 1',
          timestamp: Date.now(),
        },
      });
    });

    // CYCLE 2: Load, breed again, save
    act(() => {
      gameResult.current.dispatch({
        type: 'LOAD_GAME',
        payload: { slotIndex: 0 },
      });
    });

    await waitFor(() => {
      const creatures = gameResult.current.state.creatures?.creatures || {};
      expect(Object.keys(creatures).length).toBe(3);
    });

    // Get the first offspring ID
    let creatures = gameResult.current.state.creatures?.creatures || {};
    const offspring1Id = Object.keys(creatures).find(
      id => id !== 'creature_1' && id !== 'creature_2'
    );

    // Breed again (parent1 + offspring)
    act(() => {
      gameResult.current.breedCreatures('creature_1', offspring1Id!);
    });

    await waitFor(() => {
      const creatures = gameResult.current.state.creatures?.creatures || {};
      expect(Object.keys(creatures).length).toBe(4); // 2 parents + 2 offspring
    });

    act(() => {
      gameResult.current.dispatch({
        type: 'SAVE_GAME',
        payload: {
          slotIndex: 1,
          saveName: 'Save 2',
          timestamp: Date.now(),
        },
      });
    });

    // CYCLE 3: Load second save and verify
    act(() => {
      gameResult.current.dispatch({
        type: 'LOAD_GAME',
        payload: { slotIndex: 1 },
      });
    });

    await waitFor(() => {
      const creatures = gameResult.current.state.creatures?.creatures || {};
      expect(Object.keys(creatures).length).toBe(4);
    });

    // Verify all creatures persist correctly
    creatures = gameResult.current.state.creatures?.creatures || {};
    expect(creatures['creature_1']).toBeDefined();
    expect(creatures['creature_2']).toBeDefined();

    // Find both offspring
    const offspringIds = Object.keys(creatures).filter(
      id => id !== 'creature_1' && id !== 'creature_2'
    );
    expect(offspringIds.length).toBe(2);

    offspringIds.forEach(id => {
      expect(creatures[id].generation).toBeGreaterThanOrEqual(1);
      expect(creatures[id].parentIds.length).toBeGreaterThan(0);
    });
  });
});
