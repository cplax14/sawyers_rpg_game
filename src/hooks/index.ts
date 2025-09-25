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
  breakpointValues
} from './useResponsive';

// Touch & Gesture Hooks
export {
  useSwipeGestures,
  useElementSwipeGestures,
  useHorizontalSwipeNavigation,
  useVerticalSwipeNavigation
} from './useSwipeGestures';

// Performance Optimization Hooks
export {
  usePerformanceOptimization,
  useMobileDebounce,
  useMobileThrottle,
  useLazyLoad,
  useReducedMotion,
  useOptimizedImages
} from './usePerformance';

// Re-export hook result types for convenience
export type {
  UseGameDataResult
} from './useGameData';

export type {
  Breakpoint,
  BreakpointValues,
  ResponsiveState
} from './useResponsive';

export type {
  SwipeGestureConfig,
  SwipeHandlers,
  SwipeState
} from './useSwipeGestures';

export type {
  PerformanceMetrics
} from './usePerformance';