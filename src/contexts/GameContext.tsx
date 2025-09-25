import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { GameInstance, GameState, Player } from '../types/game';
import { vanillaBridge } from '../utils/vanillaBridge';
import { globalPerformanceMonitor } from '../utils/performanceMonitor';

// Game Context Interface
interface GameContextType {
  gameInstance: GameInstance | null;
  gameState: GameState | null;
  player: Player | null;
  currentScreen: string;
  isGameLoaded: boolean;
  isGameRunning: boolean;
  // Game actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  saveGame: () => void;
  loadGame: (saveData: any) => void;
  // UI actions
  showScreen: (screenName: string) => void;
  showModal: (modalName: string, data?: any) => void;
  hideModal: (modalName: string) => void;
}

const GameContext = createContext<GameContextType | null>(null);

interface GameProviderProps {
  children: React.ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  const [gameInstance, setGameInstance] = useState<GameInstance | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentScreen, setCurrentScreen] = useState<string>('main-menu');
  const [isGameLoaded, setIsGameLoaded] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);

  // Ref to track subscription cleanup and initialization state
  const cleanupRef = useRef<(() => void) | null>(null);
  const initializationRef = useRef<boolean>(false);

  useEffect(() => {
    // Only run once on mount, prevent multiple initialization attempts
    if (initializationRef.current || isGameLoaded) {
      return;
    }

    const initializeGame = () => {
      console.log('🚀 React initializing game...');

      // Wait for vanilla JS modules to be loaded and React DOM to be ready
      const checkGameReady = async () => {
        if (initializationRef.current || isGameLoaded) {
          return false; // Already initialized or in progress
        }

        if (
          typeof window !== 'undefined' &&
          window.initializeSawyersRPG &&
          typeof GameState !== 'undefined' &&
          document.getElementById('react-root')
        ) {
          try {
            initializationRef.current = true;
            console.log('🎮 Starting game initialization from React...');

            // Initialize the game now that React is ready
            const vanillaGame = await window.initializeSawyersRPG() as GameInstance;
            const vanillaGameState = window.gameState as GameState;

            if (!vanillaGame || !vanillaGameState) {
              throw new Error('Game initialization returned null/undefined');
            }

            setGameInstance(vanillaGame);
            setGameState(vanillaGameState);
            setPlayer(vanillaGameState.player);
            setIsGameLoaded(true);
            setIsGameRunning(vanillaGame.isRunning);

            // Set up state synchronization
            setupStateSync(vanillaGameState);

            // Initialize animation bridge and performance monitoring
            initializeAnimationBridge();

            console.log('✅ React connected to vanilla game instance');
            return true;
          } catch (error) {
            console.error('❌ Game initialization failed:', error);
            initializationRef.current = false;
            return false;
          }
        }
        return false;
      };

      // Try immediately, then poll if not ready
      const tryInitialize = async () => {
        if (await checkGameReady()) {
          return;
        }

        const interval = setInterval(async () => {
          if (await checkGameReady()) {
            clearInterval(interval);
          }
        }, 100);

        // Cleanup interval after 30 seconds if game doesn't load
        setTimeout(() => clearInterval(interval), 30000);
      };

      tryInitialize();
    };

    // Wait for React to render the DOM first, then initialize
    setTimeout(initializeGame, 500);
  }, []); // Empty dependency array - only run once on mount

  const setupStateSync = (vanillaGameState: GameState) => {
    // Track previous values to avoid unnecessary re-renders
    let lastStateJSON = '';
    let lastPlayerJSON = '';
    let lastCurrentScreen = currentScreen;
    let lastIsGameRunning = false;

    // Get initial scene from window.game if available
    if (window.game?.ui?.sceneManager) {
      const initialScene = window.game.ui.sceneManager.getCurrentScene();
      if (initialScene?.name) {
        lastCurrentScreen = initialScene.name;
        setCurrentScreen(initialScene.name);
      }
    }

    // Create a simple polling mechanism for state changes
    // In a more sophisticated setup, we'd use an observer pattern
    const syncInterval = setInterval(() => {
      if (vanillaGameState) {
        // Only update state if it actually changed (use shallow comparison to avoid circular references)
        const currentStateStr = `${vanillaGameState.player?.hp}-${vanillaGameState.player?.level}-${vanillaGameState.world?.currentArea}`;
        if (currentStateStr !== lastStateJSON) {
          setGameState({ ...vanillaGameState });
          lastStateJSON = currentStateStr;
        }

        // Only update player if it actually changed
        const currentPlayerStr = `${vanillaGameState.player?.hp}-${vanillaGameState.player?.level}-${vanillaGameState.player?.gold}`;
        if (currentPlayerStr !== lastPlayerJSON) {
          setPlayer({ ...vanillaGameState.player });
          lastPlayerJSON = currentPlayerStr;
        }

        // Update UI state from vanilla UI manager
        // Check if UI manager was added to game instance after initial setup
        if (gameInstance && !gameInstance.ui && window.game && window.game.ui) {
          console.log('🔄 Updating React gameInstance with UI manager');
          gameInstance.ui = window.game.ui;
        }

        if (gameInstance?.ui?.sceneManager) {
          const currentSceneObj = gameInstance.ui.sceneManager.getCurrentScene();
          const currentScene = currentSceneObj?.name || 'main-menu';
          if (currentScene !== lastCurrentScreen) {
            console.log(`🎬 React updating screen: ${lastCurrentScreen} -> ${currentScene}`);
            setCurrentScreen(currentScene);
            lastCurrentScreen = currentScene;
          }
        } else if (Math.random() < 0.05) {
          // Reduced debug logging - check both paths and update gameInstance if needed
          const hasWindowGame = !!window.game;
          const hasWindowGameUI = !!(window.game && window.game.ui);
          const hasGameInstanceUI = !!gameInstance?.ui;

          console.log(`🔍 DEBUG: gameInstance.ui=${hasGameInstanceUI}, window.game=${hasWindowGame}, window.game.ui=${hasWindowGameUI}`);

          // If we have window.game but not in our gameInstance, update it
          if (window.game && !gameInstance) {
            console.log('🔄 Found window.game, updating React gameInstance reference');
            setGameInstance(window.game);
          }

          // Also check for scene changes directly via window.game.ui
          if (window.game?.ui?.sceneManager) {
            const currentSceneObj = window.game.ui.sceneManager.getCurrentScene();
            const currentScene = currentSceneObj?.name || 'main-menu';
            if (currentScene !== lastCurrentScreen) {
              console.log(`🎬 React updating screen via window.game: ${lastCurrentScreen} -> ${currentScene}`);
              setCurrentScreen(currentScene);
              lastCurrentScreen = currentScene;
            }
          }
        }

        // Only update game running state if it changed
        const isRunning = gameInstance?.isRunning || false;
        if (isRunning !== lastIsGameRunning) {
          setIsGameRunning(isRunning);
          lastIsGameRunning = isRunning;
        }
      }
    }, 100); // Update every 100ms

    cleanupRef.current = () => clearInterval(syncInterval);
  };

  const initializeAnimationBridge = () => {
    // Start performance monitoring for animations
    globalPerformanceMonitor.startMonitoring(
      (metrics) => {
        // Performance metrics are available to React components via usePerformanceMonitor hook
      },
      (warning) => {
        console.warn(`Animation Performance: ${warning}`);
      }
    );

    // The vanillaBridge is already initialized as a singleton
    // It will automatically hook into game events and provide animation triggers
    console.log('✅ Animation bridge initialized');
  };

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // Game control methods
  const startGame = () => {
    if (gameInstance && !gameInstance.isRunning) {
      gameInstance.start();
    }
  };

  const pauseGame = () => {
    if (gameInstance && gameInstance.isRunning) {
      gameInstance.pause();
    }
  };

  const resumeGame = () => {
    if (gameInstance && !gameInstance.isRunning) {
      gameInstance.resume();
    }
  };

  const saveGame = () => {
    if (gameState) {
      gameState.saveGame();
    }
  };

  const loadGame = (saveData: any) => {
    if (gameState) {
      gameState.loadGame(saveData);
    }
  };

  // UI control methods
  const showScreen = (screenName: string) => {
    if (gameInstance?.ui?.sceneManager) {
      gameInstance.ui.sceneManager.showScene(screenName);
      setCurrentScreen(screenName);
    } else if (gameInstance?.ui?.showScene) {
      gameInstance.ui.showScene(screenName);
      setCurrentScreen(screenName);
    } else {
      console.warn('No scene switching method available in game UI');
    }
  };

  const showModal = (modalName: string, data?: any) => {
    if (gameInstance?.ui) {
      gameInstance.ui.showModal(modalName, data);
    }
  };

  const hideModal = (modalName: string) => {
    if (gameInstance?.ui) {
      gameInstance.ui.hideModal(modalName);
    }
  };

  const contextValue: GameContextType = {
    gameInstance,
    gameState,
    player,
    currentScreen,
    isGameLoaded,
    isGameRunning,
    startGame,
    pauseGame,
    resumeGame,
    saveGame,
    loadGame,
    showScreen,
    showModal,
    hideModal,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook to use game context
export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Specific hooks for common use cases
export function useGameState() {
  const { gameState } = useGame();
  return gameState;
}

export function usePlayer() {
  const { player } = useGame();
  return player;
}

export function useGameControls() {
  const { startGame, pauseGame, resumeGame, saveGame, loadGame, isGameRunning } = useGame();
  return { startGame, pauseGame, resumeGame, saveGame, loadGame, isGameRunning };
}

export function useUI() {
  const { currentScreen, showScreen, showModal, hideModal } = useGame();
  return { currentScreen, showScreen, showModal, hideModal };
}

// Global type extensions for vanilla JS integration
declare global {
  interface Window {
    SawyersRPG: any;
    game: any;
    gameState: any;
    initializeSawyersRPG: () => any;
  }
}