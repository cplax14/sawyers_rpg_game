/**
 * Hooks Index
 * Centralized export for all custom hooks
 */

// Game Data Hooks
export {
  useGameData,
  useAreas,
  useCharacterClasses,
  useItems,
  useMonsters,
  useDataPreloader
} from './useGameData';

// Game State Hooks
export {
  useGameState,
  usePlayer,
  useWorld,
  useInventory,
  useMonsters as useCapturedMonsters,
  useUI,
  useSettings,
  useSaveLoad
} from './useGameState';

// Re-export hook result types for convenience
export type {
  UseGameDataResult
} from './useGameData';