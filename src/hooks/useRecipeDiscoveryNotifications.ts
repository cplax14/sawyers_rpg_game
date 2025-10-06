/**
 * useRecipeDiscoveryNotifications Hook
 * Manages recipe discovery notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { BreedingRecipe } from '../types/breeding';

interface PendingDiscovery {
  recipes: BreedingRecipe[];
  timestamp: number;
}

export function useRecipeDiscoveryNotifications() {
  const [pendingDiscoveries, setPendingDiscoveries] = useState<PendingDiscovery[]>([]);
  const [currentDiscovery, setCurrentDiscovery] = useState<BreedingRecipe[] | null>(null);

  /**
   * Add new recipe discoveries to the queue
   */
  const addDiscoveries = useCallback((recipeIds: string[]) => {
    if (recipeIds.length === 0) return;

    // Load recipe data
    const recipeData = (window as any).BreedingRecipeData;
    if (!recipeData || !recipeData.recipes) {
      console.warn('Breeding recipe data not loaded');
      return;
    }

    // Convert recipe IDs to full recipe objects
    const recipes: BreedingRecipe[] = recipeIds
      .map(id => {
        const recipe = recipeData.recipes[id];
        if (!recipe) return null;

        return {
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
        };
      })
      .filter(Boolean) as BreedingRecipe[];

    if (recipes.length === 0) return;

    setPendingDiscoveries(prev => [
      ...prev,
      {
        recipes,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  /**
   * Show the next pending discovery
   */
  useEffect(() => {
    if (pendingDiscoveries.length > 0 && !currentDiscovery) {
      const nextDiscovery = pendingDiscoveries[0];
      setCurrentDiscovery(nextDiscovery.recipes);
      setPendingDiscoveries(prev => prev.slice(1));
    }
  }, [pendingDiscoveries, currentDiscovery]);

  /**
   * Dismiss current discovery notification
   */
  const dismissCurrentDiscovery = useCallback(() => {
    setCurrentDiscovery(null);
  }, []);

  return {
    currentDiscovery,
    addDiscoveries,
    dismissCurrentDiscovery,
    hasPendingDiscoveries: pendingDiscoveries.length > 0,
  };
}

export default useRecipeDiscoveryNotifications;
