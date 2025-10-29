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
  useDataPreloader,
} from './useGameData';

// Game State Hooks
export {
  useGameState,
  usePlayer,
  useWorld,
  useInventory as useGameInventory,
  useMonsters as useCapturedMonsters,
  useUI,
  useSettings,
  useCombat,
  useSaveLoad,
} from './useGameState';

// Save System Hooks
export { useSaveSystem } from './useSaveSystem';

// Auto-Save Hooks
export { useAutoSave } from './useAutoSave';

export { useSaveRecovery } from './useSaveRecovery';

// Story Management Hooks
export { useStoryMoments } from './useStoryMoments';

// Responsive Design Hooks
export {
  useResponsive,
  useBreakpoint,
  useResponsiveValue,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice,
  useOrientation,
  breakpointValues,
} from './useResponsive';

// Touch & Gesture Hooks
export {
  useSwipeGestures,
  useElementSwipeGestures,
  useHorizontalSwipeNavigation,
  useVerticalSwipeNavigation,
} from './useSwipeGestures';

// Performance Optimization Hooks
export {
  usePerformanceOptimization,
  useMobileDebounce,
  useMobileThrottle,
  useLazyLoad,
  useReducedMotion,
  useOptimizedImages,
} from './usePerformance';

// Inventory System Hooks
export { useInventory } from './useInventory';

export { useEquipment } from './useEquipment';

export { useCreatures } from './useCreatures';

export { useExperience } from './useExperience';

export { useEquipmentValidation } from './useEquipmentValidation';

// Re-export hook result types for convenience
export type { UseGameDataResult } from './useGameData';

export type { Breakpoint, BreakpointValues, ResponsiveState } from './useResponsive';

export type { SwipeGestureConfig, SwipeHandlers, SwipeState } from './useSwipeGestures';

export type { PerformanceMetrics } from './usePerformance';
