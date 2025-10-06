/**
 * RecipeDiscoveryManager
 * Monitors game state for recipe discoveries and displays notifications
 */

import React, { useEffect, useRef } from 'react';
import { useReactGame } from '../../contexts/ReactGameContext';
import { RecipeDiscoveryNotification } from '../molecules/RecipeDiscoveryNotification';
import { useRecipeDiscoveryNotifications } from '../../hooks/useRecipeDiscoveryNotifications';

export const RecipeDiscoveryManager: React.FC = () => {
  const { state } = useReactGame();
  const { currentDiscovery, addDiscoveries, dismissCurrentDiscovery } =
    useRecipeDiscoveryNotifications();

  // Track previous discovered recipes to detect new discoveries
  const previousDiscoveredRef = useRef<string[]>([]);

  useEffect(() => {
    const previousDiscovered = previousDiscoveredRef.current;
    const currentDiscovered = state.discoveredRecipes;

    // Find newly discovered recipes
    const newDiscoveries = currentDiscovered.filter(
      recipeId => !previousDiscovered.includes(recipeId)
    );

    if (newDiscoveries.length > 0) {
      console.log('🎉 [RecipeDiscoveryManager] New recipes discovered:', newDiscoveries);
      addDiscoveries(newDiscoveries);
    }

    // Update previous discovered recipes
    previousDiscoveredRef.current = [...currentDiscovered];
  }, [state.discoveredRecipes, addDiscoveries]);

  // Render notification if there's a current discovery
  if (!currentDiscovery || currentDiscovery.length === 0) {
    return null;
  }

  return (
    <RecipeDiscoveryNotification
      recipes={currentDiscovery}
      onDismiss={dismissCurrentDiscovery}
    />
  );
};

export default RecipeDiscoveryManager;
