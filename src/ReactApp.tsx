import React, { useEffect, useState } from 'react';
import { ReactGameProvider } from './contexts/ReactGameContext';
import { MainMenu, CharacterSelection, WorldMap } from './components/organisms';
import { LoadingSpinner } from './components/atoms';
import { useGameState, useUI, useDataPreloader } from './hooks';
import { ReactGameState } from './contexts/ReactGameContext';
// import styles from './ReactApp.module.css';  // Temporarily disabled due to PostCSS issues

/**
 * Pure React Game Application
 * Replaces the hybrid vanilla JS/React approach with a clean React-only implementation
 */

interface ReactAppProps {
  className?: string;
}

const ReactApp: React.FC<ReactAppProps> = ({ className }) => {
  return (
    <ReactGameProvider>
      <div className={`${styles.reactApp} ${className || ''}`}>
        <GameShell />
      </div>
    </ReactGameProvider>
  );
};

/**
 * Game Shell - Manages screen routing and global state
 */
const GameShell: React.FC = () => {
  const { state } = useGameState();
  const { currentScreen, isLoading, error } = useUI();
  const { preloadCriticalData, isDataReady } = useDataPreloader();

  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize the application
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('🚀 Initializing React Game App...');

        // Preload critical data
        if (!isDataReady()) {
          console.log('📥 Preloading game data...');
          await preloadCriticalData();
        }

        console.log('✅ Game initialization complete');
        setIsInitializing(false);
      } catch (error) {
        console.error('❌ Game initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
        setIsInitializing(false);
      }
    };

    initialize();
  }, [preloadCriticalData, isDataReady]);

  // Show initialization loading
  if (isInitializing) {
    return (
      <div className={styles.initializationScreen}>
        <div className={styles.initializationContent}>
          <div className={styles.gameLogo}>
            <h1>Sawyer's RPG</h1>
            <p>Monster Taming Adventure</p>
          </div>
          <LoadingSpinner size="large" />
          <p className={styles.initializationText}>
            Initializing game...
          </p>
        </div>
      </div>
    );
  }

  // Show initialization error
  if (initError) {
    return (
      <div className={styles.errorScreen}>
        <div className={styles.errorContent}>
          <h2>Initialization Failed</h2>
          <p className={styles.errorMessage}>{initError}</p>
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            Reload Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gameShell}>
      {/* Global Loading Overlay */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <LoadingSpinner size="large" />
        </div>
      )}

      {/* Global Error Display */}
      {error && (
        <div className={styles.errorBanner}>
          <span className={styles.errorText}>{error}</span>
          <button
            className={styles.dismissError}
            onClick={() => {
              // Clear error through UI hook
              console.log('TODO: Clear error');
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Screen Router */}
      <ScreenRouter currentScreen={currentScreen} gameState={state} />
    </div>
  );
};

/**
 * Screen Router - Handles navigation between different game screens
 */
interface ScreenRouterProps {
  currentScreen: ReactGameState['currentScreen'];
  gameState: ReactGameState;
}

const ScreenRouter: React.FC<ScreenRouterProps> = ({ currentScreen, gameState }) => {
  const renderScreen = () => {
    switch (currentScreen) {
      case 'menu':
        return <MainMenu />;

      case 'character-selection':
        return <CharacterSelection />;

      case 'world-map':
        return <WorldMap />;

      case 'area':
        return (
          <div className={styles.placeholderScreen}>
            <h2>Area Screen</h2>
            <p>Area exploration screen coming soon...</p>
            <p>Current Area: {gameState.currentArea || 'None'}</p>
          </div>
        );

      case 'combat':
        return (
          <div className={styles.placeholderScreen}>
            <h2>Combat Screen</h2>
            <p>Combat system coming soon...</p>
          </div>
        );

      case 'inventory':
        return (
          <div className={styles.placeholderScreen}>
            <h2>Inventory Screen</h2>
            <p>Inventory management coming soon...</p>
            <p>Items: {gameState.inventory.length}</p>
          </div>
        );

      case 'settings':
        return (
          <div className={styles.placeholderScreen}>
            <h2>Settings Screen</h2>
            <p>Game settings coming soon...</p>
          </div>
        );

      default:
        // Default to menu if screen is unknown
        console.warn(`Unknown screen: ${currentScreen}, defaulting to menu`);
        return <MainMenu />;
    }
  };

  return (
    <div className={styles.screenContainer}>
      {renderScreen()}
    </div>
  );
};

/**
 * Development Info Panel (only in development)
 */
const DevInfoPanel: React.FC = () => {
  const { state } = useGameState();
  const { currentScreen } = useUI();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className={styles.devInfo}>
      <div className={styles.devInfoHeader}>
        <h4>Dev Info</h4>
      </div>
      <div className={styles.devInfoContent}>
        <div className={styles.devInfoItem}>
          <span>Screen:</span>
          <span>{currentScreen}</span>
        </div>
        <div className={styles.devInfoItem}>
          <span>Player:</span>
          <span>{state.player?.name || 'None'}</span>
        </div>
        <div className={styles.devInfoItem}>
          <span>Area:</span>
          <span>{state.currentArea || 'None'}</span>
        </div>
        <div className={styles.devInfoItem}>
          <span>Loading:</span>
          <span>{state.isLoading ? 'Yes' : 'No'}</span>
        </div>
        {state.error && (
          <div className={styles.devInfoItem}>
            <span>Error:</span>
            <span className={styles.devInfoError}>{state.error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Enhanced version with dev panel for development
export const ReactAppWithDevtools: React.FC<ReactAppProps> = (props) => {
  return (
    <div className={styles.appWithDevtools}>
      <ReactApp {...props} />
      <DevInfoPanel />
    </div>
  );
};

export default ReactApp;