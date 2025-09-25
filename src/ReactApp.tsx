import React, { useEffect, useState, useRef } from 'react';
import { ReactGameProvider } from './contexts/ReactGameContext';
import { MainMenu, CharacterSelection, WorldMap } from './components/organisms';
import { LoadingSpinner } from './components/atoms';
import { useGameState, useUI, useDataPreloader } from './hooks';
import { ReactGameState } from './contexts/ReactGameContext';
import { reactAppStyles } from './utils/temporaryStyles';
// import styles from './ReactApp.module.css';  // Temporarily disabled due to PostCSS issues

// Use temporary fallback styles to prevent JavaScript errors
const styles = reactAppStyles;

/**
 * Pure React Game Application
 * Replaces the hybrid vanilla JS/React approach with a clean React-only implementation
 */

interface ReactAppProps {
  className?: string;
}

const ReactApp: React.FC<ReactAppProps> = ({ className }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Debug container sizing
    const debugSizing = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const computed = window.getComputedStyle(containerRef.current);
        console.log('🔍 ReactApp Container Debug:', {
          boundingRect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          },
          computedStyle: {
            width: computed.width,
            height: computed.height,
            display: computed.display,
            position: computed.position,
            overflow: computed.overflow
          },
          viewport: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight
          }
        });

        // Also check the root element
        const root = document.getElementById('root');
        if (root) {
          const rootRect = root.getBoundingClientRect();
          const rootComputed = window.getComputedStyle(root);
          console.log('🔍 Root Element Debug:', {
            boundingRect: {
              width: rootRect.width,
              height: rootRect.height,
              top: rootRect.top,
              left: rootRect.left
            },
            computedStyle: {
              width: rootComputed.width,
              height: rootComputed.height,
              display: rootComputed.display,
              position: rootComputed.position
            }
          });
        }
      }
    };

    // Debug immediately and on resize
    debugSizing();
    window.addEventListener('resize', debugSizing);

    return () => window.removeEventListener('resize', debugSizing);
  }, []);

  return (
    <ReactGameProvider>
      <div
        ref={containerRef}
        className={`react-app ${className || ''}`}
        style={{
          width: '100vw',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
          color: '#f4f4f4',
          margin: 0,
          padding: 0,
          boxSizing: 'border-box'
        }}
      >
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
  const gameShellRef = useRef<HTMLDivElement>(null);

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

    // Only initialize once when component mounts
    if (isInitializing) {
      initialize();
    }
  }, []); // Empty dependency array - run only once on mount

  // Debug GameShell sizing - run only once after initialization
  useEffect(() => {
    const debugGameShell = () => {
      if (gameShellRef.current) {
        const rect = gameShellRef.current.getBoundingClientRect();
        const computed = window.getComputedStyle(gameShellRef.current);
        console.log('🔍 GameShell Debug:', {
          boundingRect: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          },
          computedStyle: {
            width: computed.width,
            height: computed.height,
            display: computed.display,
            position: computed.position
          },
          currentScreen: currentScreen,
          isInitializing: isInitializing
        });
      }
    };

    // Only debug once after initialization is complete
    if (!isInitializing && gameShellRef.current) {
      setTimeout(debugGameShell, 100); // Small delay to ensure DOM is ready
    }
  }, [isInitializing]); // Only depend on initialization status

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
    <div
      ref={gameShellRef}
      className={styles.gameShell}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        margin: 0,
        padding: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Global Loading Overlay */}
      {isLoading && (
        <div
          className={styles.loadingOverlay}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
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
    <div
      className={styles.screenContainer}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
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

  // Hide dev panel completely for now to prevent content blocking
  return null;

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
    <ReactGameProvider>
      <div className={styles.appWithDevtools}>
        <GameShell />
        <DevInfoPanel />
      </div>
    </ReactGameProvider>
  );
};

export default ReactApp;