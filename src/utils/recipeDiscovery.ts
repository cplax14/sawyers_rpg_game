/**
 * Recipe Discovery System
 * Automatically discovers breeding recipes when player obtains required creatures
 */

import { EnhancedCreature } from '../types/creatures';
import { BreedingRecipe } from '../types/breeding';

export interface RecipeDiscoveryResult {
  newlyDiscovered: string[];
  recipes: BreedingRecipe[];
}

/**
 * Check which recipes can be discovered based on player's creature collection
 * @param capturedCreatures - Dictionary of all captured creatures
 * @param currentlyDiscovered - Array of already discovered recipe IDs
 * @param playerLevel - Current player level
 * @param storyFlags - Story progression flags
 * @returns Array of newly discoverable recipe IDs
 */
export function checkRecipeDiscovery(
  capturedCreatures: Record<string, EnhancedCreature>,
  currentlyDiscovered: string[],
  playerLevel: number,
  storyFlags: Record<string, boolean> = {}
): RecipeDiscoveryResult {
  const newlyDiscovered: string[] = [];
  const discoveredRecipes: BreedingRecipe[] = [];

  // Get all recipes from global data
  const recipeData = (window as any).BreedingRecipeData;
  if (!recipeData || !recipeData.recipes) {
    console.warn('Breeding recipe data not loaded');
    return { newlyDiscovered: [], recipes: [] };
  }

  // Get unique species in player's collection
  const ownedSpecies = new Set(
    Object.values(capturedCreatures).map(creature => creature.species)
  );

  // Check each recipe
  for (const recipeId in recipeData.recipes) {
    const recipe = recipeData.recipes[recipeId];

    // Skip if already discovered
    if (currentlyDiscovered.includes(recipeId)) {
      continue;
    }

    // Check unlock requirements first
    if (recipe.unlockRequirements) {
      const req = recipe.unlockRequirements;

      // Check level requirement
      if (req.minPlayerLevel && playerLevel < req.minPlayerLevel) {
        continue;
      }

      // Check story flags
      if (req.storyFlags && Array.isArray(req.storyFlags)) {
        const hasAllFlags = req.storyFlags.every((flag: string) => storyFlags[flag] === true);
        if (!hasAllFlags) {
          continue;
        }
      }

      // Check required creatures
      if (req.requiredCreatures && Array.isArray(req.requiredCreatures)) {
        const hasAllCreatures = req.requiredCreatures.every((species: string) =>
          ownedSpecies.has(species)
        );
        if (!hasAllCreatures) {
          continue;
        }
      }
    }

    // Check if player has both parent species
    const hasParent1 = ownedSpecies.has(recipe.parentSpecies1);
    const hasParent2 = ownedSpecies.has(recipe.parentSpecies2);

    if (hasParent1 && hasParent2) {
      newlyDiscovered.push(recipeId);
      discoveredRecipes.push({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        parentSpecies1: recipe.parentSpecies1,
        parentSpecies2: recipe.parentSpecies2,
        offspringSpecies: recipe.offspringSpecies,
        materials: recipe.materials || [],
        guaranteedBonuses: recipe.guaranteedBonuses,
        unlockRequirements: recipe.unlockRequirements,
        hint: recipe.hint,
      });
    }
  }

  return { newlyDiscovered, recipes: discoveredRecipes };
}

/**
 * Check for recipe discovery after capturing or breeding a new creature
 * @param newCreature - The newly acquired creature
 * @param allCreatures - All creatures in collection
 * @param discoveredRecipes - Currently discovered recipe IDs
 * @param playerLevel - Player level
 * @param storyFlags - Story flags
 * @returns Discovery result with new recipes
 */
export function checkRecipeDiscoveryAfterCapture(
  newCreature: EnhancedCreature,
  allCreatures: Record<string, EnhancedCreature>,
  discoveredRecipes: string[],
  playerLevel: number,
  storyFlags: Record<string, boolean> = {}
): RecipeDiscoveryResult {
  // Include the new creature in the check
  const updatedCreatures = {
    ...allCreatures,
    [newCreature.creatureId]: newCreature,
  };

  return checkRecipeDiscovery(
    updatedCreatures,
    discoveredRecipes,
    playerLevel,
    storyFlags
  );
}

/**
 * Get hint for an undiscovered recipe
 * @param recipeId - Recipe ID
 * @returns Hint text or null
 */
export function getRecipeHint(recipeId: string): string | null {
  const recipeData = (window as any).BreedingRecipeData;
  if (!recipeData || !recipeData.recipes) {
    return null;
  }

  const recipe = recipeData.recipes[recipeId];
  return recipe?.hint || null;
}

/**
 * Check if a specific recipe is unlockable (meets all requirements except creature ownership)
 * @param recipeId - Recipe ID
 * @param playerLevel - Player level
 * @param storyFlags - Story flags
 * @returns Whether the recipe can be discovered if player obtains the creatures
 */
export function isRecipeUnlockable(
  recipeId: string,
  playerLevel: number,
  storyFlags: Record<string, boolean> = {}
): boolean {
  const recipeData = (window as any).BreedingRecipeData;
  if (!recipeData || !recipeData.recipes) {
    return false;
  }

  const recipe = recipeData.recipes[recipeId];
  if (!recipe) {
    return false;
  }

  // Check unlock requirements
  if (recipe.unlockRequirements) {
    const req = recipe.unlockRequirements;

    // Check level requirement
    if (req.minPlayerLevel && playerLevel < req.minPlayerLevel) {
      return false;
    }

    // Check story flags
    if (req.storyFlags && Array.isArray(req.storyFlags)) {
      const hasAllFlags = req.storyFlags.every((flag: string) => storyFlags[flag] === true);
      if (!hasAllFlags) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Calculate recipe discovery progress
 * @param discoveredRecipes - Discovered recipe IDs
 * @param playerLevel - Player level
 * @param storyFlags - Story flags
 * @returns Progress information
 */
export function calculateRecipeProgress(
  discoveredRecipes: string[],
  playerLevel: number,
  storyFlags: Record<string, boolean> = {}
): { discovered: number; available: number; total: number; percentage: number } {
  const recipeData = (window as any).BreedingRecipeData;
  if (!recipeData || !recipeData.recipes) {
    return { discovered: 0, available: 0, total: 0, percentage: 0 };
  }

  const allRecipeIds = Object.keys(recipeData.recipes);
  const total = allRecipeIds.length;

  // Count available recipes (those that can be unlocked at current level/story)
  const available = allRecipeIds.filter(recipeId =>
    isRecipeUnlockable(recipeId, playerLevel, storyFlags)
  ).length;

  const discovered = discoveredRecipes.length;
  const percentage = total > 0 ? Math.round((discovered / total) * 100) : 0;

  return { discovered, available, total, percentage };
}
