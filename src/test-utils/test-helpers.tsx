/**
 * Test utilities for React Testing Library
 * Provides helpers for rendering components with necessary context providers
 */

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import {
  ReactGameContext,
  ReactGameState,
  ReactGameContextType,
  ReactGameAction,
} from '../contexts/ReactGameContext';
import {
  mockPlayer,
  mockGameSettings,
  mockInventoryItems,
  mockCapturedMonsters,
  mockStoryFlags,
} from './mock-data';

// Default mock game state
export const defaultMockGameState: ReactGameState = {
  player: mockPlayer,
  currentArea: 'starting_village',
  unlockedAreas: ['starting_village', 'forest_path'],
  completedQuests: [],
  storyFlags: { ...mockStoryFlags },
  inventory: [...mockInventoryItems],
  capturedMonsters: [...mockCapturedMonsters],
  isLoading: false,
  currentScreen: 'world-map',
  error: null,
  currentEncounter: null,
  showVictoryModal: false,
  lastCombatRewards: null,
  sessionStartTime: Date.now(),
  totalPlayTime: 0,
  settings: { ...mockGameSettings },
  saveSlots: [],
  currentSaveSlot: null,
};

// Mock dispatch function
export const mockDispatch = jest.fn();

// Mock game context actions
export const mockGameContextActions = {
  // Loading and error
  setLoading: jest.fn(),
  setError: jest.fn(),

  // Screen navigation
  setCurrentScreen: jest.fn(),

  // Player actions
  createPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  updatePlayerStats: jest.fn(),
  levelUpPlayer: jest.fn(),
  addExperience: jest.fn(),
  addGold: jest.fn(),

  // Area actions
  changeArea: jest.fn(),
  setCurrentArea: jest.fn(),
  unlockArea: jest.fn(),

  // Story actions
  setStoryFlag: jest.fn(),
  completeQuest: jest.fn(),
  updateStoryFlags: jest.fn(),

  // Inventory actions
  addItem: jest.fn(),
  removeItem: jest.fn(),
  useItem: jest.fn(),
  equipItem: jest.fn(),
  addToInventory: jest.fn(),
  removeFromInventory: jest.fn(),
  updateItemQuantity: jest.fn(),

  // Monster actions
  captureMonster: jest.fn(),
  releaseMonster: jest.fn(),
  updateMonster: jest.fn(),
  renameMonster: jest.fn(),

  // Combat actions
  startCombat: jest.fn(),
  endCombat: jest.fn(),
  showVictoryModal: jest.fn(),
  hideVictoryModal: jest.fn(),

  // Settings actions
  updateSettings: jest.fn(),
  resetSettings: jest.fn(),

  // Save/Load actions
  saveGame: jest.fn(),
  loadGame: jest.fn(),
  deleteSave: jest.fn(),
  saveToSlot: jest.fn(),
  loadFromSlot: jest.fn(),

  // Time tracking
  updatePlaytime: jest.fn(),

  // Data loading
  loadGameData: jest.fn(),

  // New inventory system
  updateInventoryState: jest.fn(),
  updateCreatureCollection: jest.fn(),
  updateExperienceState: jest.fn(),

  // Game reset
  resetGame: jest.fn(),

  // Computed properties
  isPlayerCreated: true,
  canAccessArea: jest.fn(() => true),
  getInventoryByType: jest.fn((type) => mockInventoryItems.filter(item => item.type === type)),
  getPlayerLevel: jest.fn(() => mockPlayer.level),
  getTotalPlaytime: jest.fn(() => 0),
  getCurrentSessionTime: jest.fn(() => 0),
};

// Default mock context value
export function createMockGameContext(
  stateOverrides?: Partial<ReactGameState>,
  actionOverrides?: Partial<ReactGameContextType>
): ReactGameContextType {
  return {
    state: { ...defaultMockGameState, ...stateOverrides },
    dispatch: mockDispatch,
    ...mockGameContextActions,
    ...actionOverrides,
  };
}

// Mock Game Provider component
interface MockGameProviderProps {
  children: ReactNode;
  value?: ReactGameContextType;
}

export function MockGameProvider({ children, value }: MockGameProviderProps) {
  const contextValue = value || createMockGameContext();

  return (
    <ReactGameContext.Provider value={contextValue}>
      {children}
    </ReactGameContext.Provider>
  );
}

// Custom render function with game context
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  gameState?: Partial<ReactGameState>;
  gameActions?: Partial<ReactGameContextType>;
  contextValue?: ReactGameContextType;
}

export function renderWithGameContext(
  ui: ReactElement,
  {
    gameState,
    gameActions,
    contextValue,
    ...renderOptions
  }: CustomRenderOptions = {}
): RenderResult {
  const mockContext = contextValue || createMockGameContext(gameState, gameActions);

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ReactGameContext.Provider value={mockContext}>
        {children}
      </ReactGameContext.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Alias for convenience
export const renderWithProviders = renderWithGameContext;

// Helper to reset all mocks
export function resetAllMocks() {
  mockDispatch.mockReset();
  Object.values(mockGameContextActions).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      (mock as jest.Mock).mockReset();
    }
  });
}

// Helper to create minimal game state for specific scenarios
export function createMinimalGameState(overrides?: Partial<ReactGameState>): ReactGameState {
  return {
    player: null,
    currentArea: 'starting_village',
    unlockedAreas: ['starting_village'],
    completedQuests: [],
    storyFlags: {},
    inventory: [],
    capturedMonsters: [],
    isLoading: false,
    currentScreen: 'menu',
    error: null,
    currentEncounter: null,
    showVictoryModal: false,
    lastCombatRewards: null,
    sessionStartTime: Date.now(),
    totalPlayTime: 0,
    settings: { ...mockGameSettings },
    saveSlots: [],
    currentSaveSlot: null,
    ...overrides,
  };
}

// Helper for testing combat scenarios
export function createCombatGameState(overrides?: Partial<ReactGameState>): ReactGameState {
  return {
    ...defaultMockGameState,
    currentScreen: 'combat',
    currentEncounter: {
      species: 'slime',
      level: 1,
    },
    ...overrides,
  };
}

// Helper for testing post-combat scenarios
export function createPostCombatGameState(overrides?: Partial<ReactGameState>): ReactGameState {
  return {
    ...defaultMockGameState,
    showVictoryModal: true,
    lastCombatRewards: {
      experience: 100,
      gold: 50,
      items: [mockInventoryItems[0]],
    },
    ...overrides,
  };
}

// Helper to wait for async state updates
export function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

// Re-export testing library utilities
export * from '@testing-library/react';
export { renderWithGameContext as render };
