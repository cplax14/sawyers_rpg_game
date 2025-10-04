/**
 * Test utilities entry point
 * Export all test helpers and mock data
 */

// Test helpers and rendering utilities
export {
  renderWithGameContext,
  renderWithProviders,
  MockGameProvider,
  createMockGameContext,
  defaultMockGameState,
  createMinimalGameState,
  createCombatGameState,
  createPostCombatGameState,
  mockDispatch,
  mockGameContextActions,
  resetAllMocks,
  flushPromises,
} from './test-helpers';

// Mock data exports
export {
  // Player mocks
  mockPlayer,
  mockBaseStats,
  mockEquipment,
  createMockPlayer,

  // Item mocks
  mockHealthPotion,
  mockSword,
  mockArmor,
  mockRareAccessory,
  mockMaterial,
  mockInventoryItems,
  createMockItem,

  // Monster mocks
  mockSlime,
  mockGoblin,
  mockWolf,
  mockCapturedMonsters,
  createMockMonster,

  // Area mocks
  mockStartingVillage,
  mockForest,
  mockDungeon,
  mockAreas,
  createMockArea,

  // State mocks
  mockGameSettings,
  mockInventoryState,
  mockCreatureCollection,
  mockExperienceState,
  mockCombatRewards,
  mockStoryFlags,
} from './mock-data';

// Re-export commonly used testing library utilities
export {
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  fireEvent,
  act,
} from '@testing-library/react';

export { default as userEvent } from '@testing-library/user-event';
