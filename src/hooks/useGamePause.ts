import { useEffect, useCallback, useRef, useState } from 'react';
import { useGameState } from './useGameState';

export interface GamePauseState {
  isPaused: boolean;
  pauseReason: string | null;
  pausedAt: number | null;
  totalPausedTime: number;
}

export interface GamePauseOptions {
  pauseAutoSave?: boolean;
  pauseExplorationTimers?: boolean;
  pauseBackgroundProcesses?: boolean;
  pauseAnimations?: boolean;
  pauseAudio?: boolean;
}

export interface GamePauseManager {
  pauseState: GamePauseState;
  pauseGame: (reason: string, options?: GamePauseOptions) => void;
  resumeGame: () => void;
  isPausedForReason: (reason: string) => boolean;
  getTotalPausedTime: () => number;
  addPauseListener: (listener: (paused: boolean, reason?: string) => void) => () => void;
}

// Global pause state for coordination across components
let globalPauseState: GamePauseState = {
  isPaused: false,
  pauseReason: null,
  pausedAt: null,
  totalPausedTime: 0
};

const pauseListeners = new Set<(paused: boolean, reason?: string) => void>();
const pauseStack: Array<{ reason: string; options: GamePauseOptions; timestamp: number }> = [];

// Pause manager for auto-save integration
export const gamePauseManager = {
  pause: (reason: string, options: GamePauseOptions = {}) => {
    const timestamp = Date.now();
    pauseStack.push({ reason, options, timestamp });

    if (!globalPauseState.isPaused) {
      globalPauseState = {
        isPaused: true,
        pauseReason: reason,
        pausedAt: timestamp,
        totalPausedTime: globalPauseState.totalPausedTime
      };

      // Notify external systems
      if (options.pauseAutoSave && typeof window !== 'undefined' && window.gameAutoSaveManager) {
        window.gameAutoSaveManager.pause();
      }

      // Pause other systems as needed
      pauseOtherSystems(options);

      // Notify listeners
      pauseListeners.forEach(listener => listener(true, reason));
    }
  },

  resume: (reason?: string) => {
    if (reason) {
      // Remove specific reason from stack
      const index = pauseStack.findIndex(p => p.reason === reason);
      if (index !== -1) {
        pauseStack.splice(index, 1);
      }
    } else {
      // Remove most recent pause
      pauseStack.pop();
    }

    // If no more pauses in stack, resume the game
    if (pauseStack.length === 0 && globalPauseState.isPaused) {
      const pauseDuration = globalPauseState.pausedAt ? Date.now() - globalPauseState.pausedAt : 0;

      globalPauseState = {
        isPaused: false,
        pauseReason: null,
        pausedAt: null,
        totalPausedTime: globalPauseState.totalPausedTime + pauseDuration
      };

      // Resume external systems
      if (typeof window !== 'undefined' && window.gameAutoSaveManager) {
        window.gameAutoSaveManager.resume();
      }

      // Resume other systems
      resumeOtherSystems();

      // Notify listeners
      pauseListeners.forEach(listener => listener(false));
    } else if (pauseStack.length > 0) {
      // Update to show the most recent pause reason
      const mostRecent = pauseStack[pauseStack.length - 1];
      globalPauseState.pauseReason = mostRecent.reason;
    }
  },

  isPaused: () => globalPauseState.isPaused,
  getCurrentReason: () => globalPauseState.pauseReason,
  getTotalPausedTime: () => globalPauseState.totalPausedTime,

  addListener: (listener: (paused: boolean, reason?: string) => void) => {
    pauseListeners.add(listener);
    return () => pauseListeners.delete(listener);
  }
};

// Store paused intervals and timeouts for resuming
const pausedTimers = new Map<number, { type: 'interval' | 'timeout'; callback: Function; delay: number; startTime: number }>();
let originalSetInterval: typeof setInterval;
let originalSetTimeout: typeof setTimeout;
let originalClearInterval: typeof clearInterval;
let originalClearTimeout: typeof clearTimeout;

function pauseOtherSystems(options: GamePauseOptions) {
  if (options.pauseExplorationTimers) {
    // Override timer functions to track and pause them
    if (!originalSetInterval) {
      originalSetInterval = window.setInterval;
      originalSetTimeout = window.setTimeout;
      originalClearInterval = window.clearInterval;
      originalClearTimeout = window.clearTimeout;

      // Override setInterval
      window.setInterval = (callback: Function, delay: number, ...args: any[]) => {
        const id = originalSetInterval(() => {
          if (!globalPauseState.isPaused) {
            callback(...args);
          }
        }, delay);

        pausedTimers.set(id, {
          type: 'interval',
          callback,
          delay,
          startTime: Date.now()
        });

        return id;
      };

      // Override setTimeout
      window.setTimeout = (callback: Function, delay: number, ...args: any[]) => {
        const id = originalSetTimeout(() => {
          if (!globalPauseState.isPaused) {
            callback(...args);
            pausedTimers.delete(id);
          }
        }, delay);

        pausedTimers.set(id, {
          type: 'timeout',
          callback,
          delay,
          startTime: Date.now()
        });

        return id;
      };
    }
  }

  if (options.pauseAnimations) {
    // Pause CSS animations and transitions
    const style = document.createElement('style');
    style.id = 'game-pause-animations';
    style.textContent = `
      *, *::before, *::after {
        animation-play-state: paused !important;
        transition-duration: 0s !important;
      }
    `;
    document.head.appendChild(style);
  }

  if (options.pauseAudio) {
    // Pause all audio elements
    const audioElements = document.querySelectorAll('audio, video');
    audioElements.forEach(element => {
      if (!element.paused) {
        (element as any)._wasPausedByGame = false;
        element.pause();
        (element as any)._wasPausedByGame = true;
      }
    });
  }
}

function resumeOtherSystems() {
  // Resume animations
  const pauseStyle = document.getElementById('game-pause-animations');
  if (pauseStyle) {
    pauseStyle.remove();
  }

  // Resume audio
  const audioElements = document.querySelectorAll('audio, video');
  audioElements.forEach(element => {
    if ((element as any)._wasPausedByGame) {
      element.play().catch(() => {}); // Ignore autoplay errors
      delete (element as any)._wasPausedByGame;
    }
  });

  // Note: Timers will automatically resume since we check globalPauseState.isPaused in their callbacks
}

export const useGamePause = (): GamePauseManager => {
  const [pauseState, setPauseState] = useState<GamePauseState>(globalPauseState);
  const { state } = useGameState();

  // Listen for pause state changes
  useEffect(() => {
    const unsubscribe = gamePauseManager.addListener((paused, reason) => {
      setPauseState({ ...globalPauseState });
    });

    return unsubscribe;
  }, []);

  const pauseGame = useCallback((reason: string, options: GamePauseOptions = {}) => {
    gamePauseManager.pause(reason, {
      pauseAutoSave: true,
      pauseExplorationTimers: true,
      pauseBackgroundProcesses: true,
      pauseAnimations: false, // Keep UI animations for better UX
      pauseAudio: false, // Keep audio unless specifically requested
      ...options
    });
  }, []);

  const resumeGame = useCallback(() => {
    gamePauseManager.resume();
  }, []);

  const isPausedForReason = useCallback((reason: string) => {
    return pauseStack.some(p => p.reason === reason);
  }, []);

  const getTotalPausedTime = useCallback(() => {
    return gamePauseManager.getTotalPausedTime();
  }, []);

  const addPauseListener = useCallback((listener: (paused: boolean, reason?: string) => void) => {
    return gamePauseManager.addListener(listener);
  }, []);

  return {
    pauseState,
    pauseGame,
    resumeGame,
    isPausedForReason,
    getTotalPausedTime,
    addPauseListener
  };
};

// Hook specifically for inventory pause functionality
export const useInventoryPause = () => {
  const { pauseGame, resumeGame, isPausedForReason } = useGamePause();
  const { state } = useGameState();

  const pauseForInventory = useCallback(() => {
    // Only pause during exploration, not during combat
    if (state.currentScreen === 'area' && !state.currentEncounter) {
      pauseGame('inventory', {
        pauseAutoSave: true,
        pauseExplorationTimers: true,
        pauseBackgroundProcesses: true,
        pauseAnimations: false,
        pauseAudio: false
      });
    }
  }, [state.currentScreen, state.currentEncounter, pauseGame]);

  const resumeFromInventory = useCallback(() => {
    if (isPausedForReason('inventory')) {
      resumeGame();
    }
  }, [isPausedForReason, resumeGame]);

  const shouldPauseForInventory = useCallback(() => {
    // Pause when opening inventory during exploration (area screen) but not during combat
    return state.currentScreen === 'area' && !state.currentEncounter;
  }, [state.currentScreen, state.currentEncounter]);

  return {
    pauseForInventory,
    resumeFromInventory,
    shouldPauseForInventory,
    isInventoryPaused: isPausedForReason('inventory')
  };
};

export default useGamePause;