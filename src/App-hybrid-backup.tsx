import React from 'react';
import { GameProvider, useGame } from './contexts/GameContext';
import { ReactGameProvider } from './contexts/ReactGameContext';
import GameCanvas from './components/GameCanvas';
import ReactUI from './components/ReactUI';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

// CSS is loaded via HTML link tags, no need to import here

function App() {
  return (
    <GameProvider>
      <ReactGameProvider>
        <div className='App'>
          <GameWrapper />
        </div>
      </ReactGameProvider>
    </GameProvider>
  );
}

function GameWrapper() {
  const { isGameLoaded } = useGame();

  return (
    <div id='game-container' className='game-container'>
      {/* Always render UI so vanilla JS can find buttons, but show loading state */}
      {!isGameLoaded && <LoadingScreen />}

      {/* Canvas for the game rendering */}
      <GameCanvas />

      {/* React-powered UI overlay - Always rendered for vanilla JS compatibility */}
      <ReactUI />

      {/* Preserve the existing HTML structure for compatibility */}
      <LegacyUILayer />
    </div>
  );
}

// Component to maintain existing HTML structure for gradual migration
function LegacyUILayer() {
  return (
    <div id='ui-overlay' style={{ display: 'none' }}>
      {/* This maintains the DOM structure that vanilla JS expects */}
      {/* Elements will be made visible as we migrate them to React */}

      {/* Keep story modal for now as it's complex */}
      <div id='story-modal' className='hidden'>
        <div className='modal-backdrop'></div>
        <div className='modal-content'>
          <header className='modal-header'>
            <h3 id='story-title'>Story</h3>
            <button className='modal-close' id='story-close'>
              ✕
            </button>
          </header>
          <div className='modal-body'>
            <div className='story-line'>
              <div className='story-speaker' id='story-speaker'></div>
              <div className='story-text' id='story-text'></div>
            </div>
            <div className='story-choices hidden' id='story-choices'></div>
          </div>
          <footer className='modal-footer'>
            <button id='story-next' className='btn primary'>
              <span className='btn-text'>Next</span>
            </button>
          </footer>
        </div>
      </div>

      {/* Game HUD that we'll eventually migrate */}
      <div id='game-hud' className='hidden'>
        <div className='hud-section player-stats'>
          <div className='stat'>
            Level: <span id='player-level'>1</span>
          </div>
          <div className='stat'>
            HP: <span id='player-hp'>100</span>/<span id='player-max-hp'>100</span>
          </div>
          <div className='stat'>
            MP: <span id='player-mp'>50</span>/<span id='player-max-mp'>50</span>
          </div>
          <div className='stat'>
            Gold: <span id='player-gold'>0</span>
          </div>
        </div>

        <div className='hud-section action-buttons'>
          <button id='world-map-btn' className='btn hud'>
            Map
          </button>
          <button id='monsters-btn' className='btn hud'>
            Monsters
          </button>
          <button id='inventory-btn' className='btn hud'>
            Inventory
          </button>
          <button id='save-game-btn' className='btn hud'>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
