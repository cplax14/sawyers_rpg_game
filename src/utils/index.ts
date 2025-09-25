/**
 * Utilities Index
 * Centralized export for all utility modules
 */

// Data Loading
export * from './dataLoader';

// Validation
export * from './validation';

// Performance
export * from './performance';

// Re-export commonly used utilities
export { gameDataLoader } from './dataLoader';
export { validators } from './validation';

// Utility types
export type {
  LoadedGameData,
  LegacyAreaData,
  LegacyCharacterData,
  LegacyItemData,
  LegacyMonsterData
} from './dataLoader';

export type {
  ValidationResult,
  ValidationOptions
} from './validation';