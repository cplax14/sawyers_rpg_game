/**
 * Tests for Recipe Discovery System
 */

import {
  checkRecipeDiscovery,
  checkRecipeDiscoveryAfterCapture,
  isRecipeUnlockable,
  calculateRecipeProgress,
} from './recipeDiscovery';
import { EnhancedCreature } from '../types/creatures';

describe('Recipe Discovery System', () => {
  beforeAll(() => {
    // Mock BreedingRecipeData on window object
    (window as any).BreedingRecipeData = {
      recipes: {
        slime_fusion: {
          id: 'slime_fusion',
          name: 'Slime Fusion',
          description: 'Two slimes combine',
          parentSpecies1: 'slime',
          parentSpecies2: 'slime',
          offspringSpecies: 'king_slime',
          materials: [],
          hint: 'Two of the same...',
        },
        goblin_warrior: {
          id: 'goblin_warrior',
          name: 'Goblin Warrior',
          description: 'Train goblins',
          parentSpecies1: 'goblin',
          parentSpecies2: 'goblin',
          offspringSpecies: 'goblin_warrior',
          materials: [],
          hint: 'Warriors need weapons...',
        },
        worg_creation: {
          id: 'worg_creation',
          name: 'Worg Breeding',
          description: 'Wolf + Goblin',
          parentSpecies1: 'wolf',
          parentSpecies2: 'goblin',
          offspringSpecies: 'worg',
          materials: [],
          hint: 'Beast and humanoid...',
        },
        ancient_dragon: {
          id: 'ancient_dragon',
          name: 'Ancient Dragon',
          description: 'Legendary dragon',
          parentSpecies1: 'fire_drake',
          parentSpecies2: 'wyvern',
          offspringSpecies: 'ancient_dragon',
          materials: [],
          unlockRequirements: {
            minPlayerLevel: 35,
            storyFlags: ['dragon_peak_unlocked'],
          },
          hint: 'When dragons unite...',
        },
      },
    };
  });

  describe('checkRecipeDiscovery', () => {
    it('should discover recipes when player has both parent species', () => {
      const creatures: Record<string, EnhancedCreature> = {
        creature1: { species: 'slime' } as EnhancedCreature,
        creature2: { species: 'slime' } as EnhancedCreature,
      };

      const result = checkRecipeDiscovery(creatures, [], 1, {});

      expect(result.newlyDiscovered).toContain('slime_fusion');
      expect(result.recipes.length).toBeGreaterThan(0);
    });

    it('should not discover recipes player already knows', () => {
      const creatures: Record<string, EnhancedCreature> = {
        creature1: { species: 'slime' } as EnhancedCreature,
        creature2: { species: 'slime' } as EnhancedCreature,
      };

      const result = checkRecipeDiscovery(creatures, ['slime_fusion'], 1, {});

      expect(result.newlyDiscovered).not.toContain('slime_fusion');
    });

    it('should discover hybrid recipes when player has both species', () => {
      const creatures: Record<string, EnhancedCreature> = {
        creature1: { species: 'wolf' } as EnhancedCreature,
        creature2: { species: 'goblin' } as EnhancedCreature,
      };

      const result = checkRecipeDiscovery(creatures, [], 1, {});

      expect(result.newlyDiscovered).toContain('worg_creation');
    });

    it('should not discover recipes with unmet level requirements', () => {
      const creatures: Record<string, EnhancedCreature> = {
        creature1: { species: 'fire_drake' } as EnhancedCreature,
        creature2: { species: 'wyvern' } as EnhancedCreature,
      };

      const result = checkRecipeDiscovery(creatures, [], 10, {});

      expect(result.newlyDiscovered).not.toContain('ancient_dragon');
    });

    it('should not discover recipes with unmet story flags', () => {
      const creatures: Record<string, EnhancedCreature> = {
        creature1: { species: 'fire_drake' } as EnhancedCreature,
        creature2: { species: 'wyvern' } as EnhancedCreature,
      };

      const result = checkRecipeDiscovery(creatures, [], 35, {});

      expect(result.newlyDiscovered).not.toContain('ancient_dragon');
    });

    it('should discover recipes when all requirements are met', () => {
      const creatures: Record<string, EnhancedCreature> = {
        creature1: { species: 'fire_drake' } as EnhancedCreature,
        creature2: { species: 'wyvern' } as EnhancedCreature,
      };

      const result = checkRecipeDiscovery(creatures, [], 35, { dragon_peak_unlocked: true });

      expect(result.newlyDiscovered).toContain('ancient_dragon');
    });
  });

  describe('checkRecipeDiscoveryAfterCapture', () => {
    it('should discover recipes after capturing new creature', () => {
      const existingCreatures: Record<string, EnhancedCreature> = {
        creature1: { creatureId: 'c1', species: 'slime' } as EnhancedCreature,
      };

      const newCreature: EnhancedCreature = {
        creatureId: 'c2',
        species: 'slime',
      } as EnhancedCreature;

      const result = checkRecipeDiscoveryAfterCapture(newCreature, existingCreatures, [], 1, {});

      expect(result.newlyDiscovered).toContain('slime_fusion');
    });

    it('should discover cross-species recipes after capture', () => {
      const existingCreatures: Record<string, EnhancedCreature> = {
        creature1: { creatureId: 'c1', species: 'wolf' } as EnhancedCreature,
      };

      const newCreature: EnhancedCreature = {
        creatureId: 'c2',
        species: 'goblin',
      } as EnhancedCreature;

      const result = checkRecipeDiscoveryAfterCapture(newCreature, existingCreatures, [], 1, {});

      expect(result.newlyDiscovered).toContain('worg_creation');
    });
  });

  describe('isRecipeUnlockable', () => {
    it('should return true for recipes with no requirements', () => {
      const result = isRecipeUnlockable('slime_fusion', 1, {});
      expect(result).toBe(true);
    });

    it('should return false if level requirement not met', () => {
      const result = isRecipeUnlockable('ancient_dragon', 10, { dragon_peak_unlocked: true });
      expect(result).toBe(false);
    });

    it('should return false if story flag requirement not met', () => {
      const result = isRecipeUnlockable('ancient_dragon', 35, {});
      expect(result).toBe(false);
    });

    it('should return true when all requirements met', () => {
      const result = isRecipeUnlockable('ancient_dragon', 35, { dragon_peak_unlocked: true });
      expect(result).toBe(true);
    });
  });

  describe('calculateRecipeProgress', () => {
    it('should calculate correct progress percentage', () => {
      const discoveredRecipes = ['slime_fusion', 'goblin_warrior'];
      const result = calculateRecipeProgress(discoveredRecipes, 1, {});

      expect(result.discovered).toBe(2);
      expect(result.total).toBe(4); // Total recipes in mock data
      expect(result.percentage).toBe(50);
    });

    it('should count available recipes correctly', () => {
      const result = calculateRecipeProgress([], 1, {});

      // At level 1, only recipes without level requirements should be available
      expect(result.available).toBe(3); // slime_fusion, goblin_warrior, worg_creation
    });

    it('should include recipes when requirements met', () => {
      const result = calculateRecipeProgress([], 35, { dragon_peak_unlocked: true });

      expect(result.available).toBe(4); // All recipes
    });
  });
});
