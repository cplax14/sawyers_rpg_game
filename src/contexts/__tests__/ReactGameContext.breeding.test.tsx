/**
 * Tests for ReactGameContext - Breeding System Actions
 *
 * Tests the breeding-related state management and action handlers:
 * - Breeding attempts tracking
 * - Recipe discovery
 * - Breeding material management
 * - Exhaustion application
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  ReactGameProvider,
  useReactGame,
  ReactGameState,
} from '../ReactGameContext';
import { EnhancedCreature } from '../../types/creatures';

// =============================================================================
// TEST SETUP
// =============================================================================

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ReactGameProvider>{children}</ReactGameProvider>
);

// =============================================================================
// BREEDING ATTEMPTS TESTS
// =============================================================================

describe('ReactGameContext - Breeding Attempts', () => {
  it('should initialize with 0 breeding attempts', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    expect(result.current.state.breedingAttempts).toBe(0);
  });

  it('should update breeding attempts', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.updateBreedingAttempts(5);
    });

    expect(result.current.state.breedingAttempts).toBe(5);
  });

  it('should allow incrementing breeding attempts', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.updateBreedingAttempts(3);
    });

    act(() => {
      result.current.updateBreedingAttempts(result.current.state.breedingAttempts + 1);
    });

    expect(result.current.state.breedingAttempts).toBe(4);
  });

  it('should allow resetting breeding attempts', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.updateBreedingAttempts(10);
    });

    act(() => {
      result.current.updateBreedingAttempts(0);
    });

    expect(result.current.state.breedingAttempts).toBe(0);
  });
});

// =============================================================================
// RECIPE DISCOVERY TESTS
// =============================================================================

describe('ReactGameContext - Recipe Discovery', () => {
  it('should initialize with empty discovered recipes', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    expect(result.current.state.discoveredRecipes).toEqual([]);
  });

  it('should discover a new recipe', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.discoverRecipe('slime_fusion');
    });

    expect(result.current.state.discoveredRecipes).toContain('slime_fusion');
  });

  it('should discover multiple recipes', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.discoverRecipe('slime_fusion');
    });

    act(() => {
      result.current.discoverRecipe('dragon_hybrid');
    });

    act(() => {
      result.current.discoverRecipe('elemental_beast');
    });

    expect(result.current.state.discoveredRecipes).toHaveLength(3);
    expect(result.current.state.discoveredRecipes).toContain('slime_fusion');
    expect(result.current.state.discoveredRecipes).toContain('dragon_hybrid');
    expect(result.current.state.discoveredRecipes).toContain('elemental_beast');
  });

  it('should not duplicate recipes when discovering same recipe twice', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.discoverRecipe('slime_fusion');
    });

    act(() => {
      result.current.discoverRecipe('slime_fusion');
    });

    expect(result.current.state.discoveredRecipes).toHaveLength(1);
    expect(result.current.state.discoveredRecipes).toEqual(['slime_fusion']);
  });

  it('should maintain discovered recipes order', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    const recipes = ['recipe_1', 'recipe_2', 'recipe_3', 'recipe_4'];

    recipes.forEach((recipeId) => {
      act(() => {
        result.current.discoverRecipe(recipeId);
      });
    });

    expect(result.current.state.discoveredRecipes).toEqual(recipes);
  });
});

// =============================================================================
// BREEDING MATERIALS TESTS
// =============================================================================

describe('ReactGameContext - Breeding Materials', () => {
  it('should initialize with empty breeding materials', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    expect(result.current.state.breedingMaterials).toEqual({});
  });

  it('should add breeding material', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.addBreedingMaterial('slime_gel', 5);
    });

    expect(result.current.state.breedingMaterials['slime_gel']).toBe(5);
  });

  it('should add multiple different materials', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.addBreedingMaterial('slime_gel', 5);
    });

    act(() => {
      result.current.addBreedingMaterial('dragon_scale', 3);
    });

    act(() => {
      result.current.addBreedingMaterial('phoenix_feather', 1);
    });

    expect(result.current.state.breedingMaterials).toEqual({
      slime_gel: 5,
      dragon_scale: 3,
      phoenix_feather: 1,
    });
  });

  it('should stack same material when adding', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.addBreedingMaterial('slime_gel', 5);
    });

    act(() => {
      result.current.addBreedingMaterial('slime_gel', 3);
    });

    expect(result.current.state.breedingMaterials['slime_gel']).toBe(8);
  });

  it('should remove breeding material', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.addBreedingMaterial('slime_gel', 10);
    });

    act(() => {
      result.current.removeBreedingMaterial('slime_gel', 3);
    });

    expect(result.current.state.breedingMaterials['slime_gel']).toBe(7);
  });

  it('should remove material from inventory when quantity reaches 0', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.addBreedingMaterial('slime_gel', 5);
    });

    act(() => {
      result.current.removeBreedingMaterial('slime_gel', 5);
    });

    expect(result.current.state.breedingMaterials['slime_gel']).toBeUndefined();
  });

  it('should not go negative when removing more than available', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.addBreedingMaterial('slime_gel', 5);
    });

    act(() => {
      result.current.removeBreedingMaterial('slime_gel', 10);
    });

    expect(result.current.state.breedingMaterials['slime_gel']).toBeUndefined();
  });

  it('should handle removing non-existent material gracefully', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.removeBreedingMaterial('non_existent', 5);
    });

    expect(result.current.state.breedingMaterials).toEqual({});
  });

  it('should maintain separate material quantities', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.addBreedingMaterial('slime_gel', 10);
      result.current.addBreedingMaterial('dragon_scale', 5);
      result.current.addBreedingMaterial('phoenix_feather', 2);
    });

    act(() => {
      result.current.removeBreedingMaterial('dragon_scale', 3);
    });

    expect(result.current.state.breedingMaterials).toEqual({
      slime_gel: 10,
      dragon_scale: 2,
      phoenix_feather: 2,
    });
  });
});

// =============================================================================
// EXHAUSTION APPLICATION TESTS
// =============================================================================

describe('ReactGameContext - Exhaustion Application', () => {
  // Helper to create a mock creature in the context
  const setupCreatureInContext = (result: any, creatureId: string) => {
    // Create a mock creature collection with one creature
    const mockCreature: Partial<EnhancedCreature> = {
      creatureId,
      id: creatureId,
      name: 'Test Creature',
      species: 'test',
      level: 10,
      generation: 1,
      breedingCount: 0,
      exhaustionLevel: 0,
      stats: {
        attack: 100,
        defense: 100,
        magicAttack: 100,
        magicDefense: 100,
        speed: 100,
        accuracy: 100,
      },
    };

    act(() => {
      result.current.dispatch({
        type: 'UPDATE_CREATURE_COLLECTION',
        payload: {
          creatures: {
            [creatureId]: mockCreature as EnhancedCreature,
          },
          bestiary: {},
          activeTeam: [],
          reserves: [],
          totalDiscovered: 1,
          totalCaptured: 1,
          completionPercentage: 0,
          favoriteSpecies: [],
          activeBreeding: [],
          breedingHistory: [],
          activeTrades: [],
          tradeHistory: [],
          autoSort: false,
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
  };

  it('should apply exhaustion to creature', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });
    const creatureId = 'test_creature_1';

    setupCreatureInContext(result, creatureId);

    act(() => {
      result.current.applyExhaustion(creatureId);
    });

    const creature = result.current.state.creatures?.creatures[creatureId];
    expect(creature?.exhaustionLevel).toBe(1);
    expect(creature?.breedingCount).toBe(1);
  });

  it('should apply stat penalties when exhaustion applied', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });
    const creatureId = 'test_creature_2';

    setupCreatureInContext(result, creatureId);

    act(() => {
      result.current.applyExhaustion(creatureId);
    });

    const creature = result.current.state.creatures?.creatures[creatureId];
    // -20% penalty: 100 × 0.8 = 80
    expect(creature?.stats.attack).toBe(80);
    expect(creature?.stats.defense).toBe(80);
  });

  it('should stack exhaustion penalties correctly', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });
    const creatureId = 'test_creature_3';

    setupCreatureInContext(result, creatureId);

    act(() => {
      result.current.applyExhaustion(creatureId);
    });

    act(() => {
      result.current.applyExhaustion(creatureId);
    });

    act(() => {
      result.current.applyExhaustion(creatureId);
    });

    const creature = result.current.state.creatures?.creatures[creatureId];
    expect(creature?.exhaustionLevel).toBe(3);

    // Note: Each application of exhaustion applies penalty to current stats
    // 1st: 100 × 0.8 = 80
    // 2nd: 80 × 0.6 = 48
    // 3rd: 48 × 0.4 = 19.2 → 19 (rounded)
    expect(creature?.stats.attack).toBe(19);
  });

  it('should do nothing if creature not found', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    const initialState = result.current.state;

    act(() => {
      result.current.applyExhaustion('non_existent_creature');
    });

    expect(result.current.state).toEqual(initialState);
  });

  it('should increment breedingCount each time', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });
    const creatureId = 'test_creature_4';

    setupCreatureInContext(result, creatureId);

    act(() => {
      result.current.applyExhaustion(creatureId);
    });

    let creature = result.current.state.creatures?.creatures[creatureId];
    expect(creature?.breedingCount).toBe(1);

    act(() => {
      result.current.applyExhaustion(creatureId);
    });

    creature = result.current.state.creatures?.creatures[creatureId];
    expect(creature?.breedingCount).toBe(2);

    act(() => {
      result.current.applyExhaustion(creatureId);
    });

    creature = result.current.state.creatures?.creatures[creatureId];
    expect(creature?.breedingCount).toBe(3);
  });
});

// =============================================================================
// SAVE/LOAD BREEDING DATA TESTS
// =============================================================================

describe('ReactGameContext - Breeding Data Persistence', () => {
  it('should include breeding data in save', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    act(() => {
      result.current.updateBreedingAttempts(5);
      result.current.discoverRecipe('recipe_1');
      result.current.discoverRecipe('recipe_2');
      result.current.addBreedingMaterial('slime_gel', 10);
    });

    act(() => {
      result.current.dispatch({
        type: 'SAVE_GAME',
        payload: {
          slotIndex: 0,
          saveName: 'Test Save',
          timestamp: Date.now(),
        },
      });
    });

    const saveData = localStorage.getItem('sawyers_rpg_save_slot_0');
    expect(saveData).toBeTruthy();

    const parsed = JSON.parse(saveData!);
    expect(parsed.breedingAttempts).toBe(5);
    expect(parsed.discoveredRecipes).toEqual(['recipe_1', 'recipe_2']);
    expect(parsed.breedingMaterials).toEqual({ slime_gel: 10 });

    // Cleanup
    localStorage.removeItem('sawyers_rpg_save_slot_0');
  });

  it('should restore breeding data on load', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    // Create save data
    const saveData = {
      player: {
        id: 'player_1',
        name: 'Test Player',
        class: 'warrior',
        level: 5,
        hp: 100,
        maxHp: 100,
        mp: 50,
        maxMp: 50,
        experience: 250,
        experienceToNext: 500,
        gold: 1000,
        baseStats: {
          attack: 15,
          defense: 15,
          magicAttack: 10,
          magicDefense: 10,
          speed: 12,
          accuracy: 85,
        },
        stats: {
          attack: 15,
          defense: 15,
          magicAttack: 10,
          magicDefense: 10,
          speed: 12,
          accuracy: 85,
        },
        equipment: {
          weapon: null,
          armor: null,
          accessory: null,
        },
        spells: [],
      },
      breedingAttempts: 7,
      discoveredRecipes: ['recipe_1', 'recipe_2', 'recipe_3'],
      breedingMaterials: {
        slime_gel: 15,
        dragon_scale: 3,
      },
      currentArea: 'forest',
      unlockedAreas: ['forest'],
      inventory: [],
      capturedMonsters: [],
      storyFlags: {},
      completedQuests: [],
      totalPlayTime: 0,
      settings: {},
      timestamp: Date.now(),
    };

    localStorage.setItem('sawyers_rpg_save_slot_0', JSON.stringify(saveData));

    act(() => {
      result.current.dispatch({
        type: 'LOAD_GAME',
        payload: { slotIndex: 0 },
      });
    });

    expect(result.current.state.breedingAttempts).toBe(7);
    expect(result.current.state.discoveredRecipes).toEqual([
      'recipe_1',
      'recipe_2',
      'recipe_3',
    ]);
    expect(result.current.state.breedingMaterials).toEqual({
      slime_gel: 15,
      dragon_scale: 3,
    });

    // Cleanup
    localStorage.removeItem('sawyers_rpg_save_slot_0');
  });

  it('should handle loading save without breeding data (backward compatibility)', () => {
    const { result } = renderHook(() => useReactGame(), { wrapper });

    // Create old save data without breeding fields
    const oldSaveData = {
      player: {
        id: 'player_1',
        name: 'Old Player',
        class: 'mage',
        level: 3,
        hp: 80,
        maxHp: 80,
        mp: 100,
        maxMp: 100,
        experience: 150,
        experienceToNext: 300,
        gold: 500,
        baseStats: {
          attack: 8,
          defense: 8,
          magicAttack: 20,
          magicDefense: 15,
          speed: 10,
          accuracy: 90,
        },
        stats: {
          attack: 8,
          defense: 8,
          magicAttack: 20,
          magicDefense: 15,
          speed: 10,
          accuracy: 90,
        },
        equipment: {
          weapon: null,
          armor: null,
          accessory: null,
        },
        spells: [],
      },
      currentArea: 'town',
      unlockedAreas: ['town'],
      inventory: [],
      capturedMonsters: [],
      storyFlags: {},
      completedQuests: [],
      totalPlayTime: 0,
      settings: {},
      timestamp: Date.now(),
      // No breeding fields
    };

    localStorage.setItem('sawyers_rpg_save_slot_1', JSON.stringify(oldSaveData));

    act(() => {
      result.current.dispatch({
        type: 'LOAD_GAME',
        payload: { slotIndex: 1 },
      });
    });

    // Should default to empty breeding state
    expect(result.current.state.breedingAttempts).toBe(0);
    expect(result.current.state.discoveredRecipes).toEqual([]);
    expect(result.current.state.breedingMaterials).toEqual({});

    // Cleanup
    localStorage.removeItem('sawyers_rpg_save_slot_1');
  });
});
