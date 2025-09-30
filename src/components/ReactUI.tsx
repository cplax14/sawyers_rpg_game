import React, { useEffect } from 'react';
import { useGame, useUI } from '../contexts/GameContext';
import { useReactGame } from '../contexts/ReactGameContext';
import MainMenu from './ui/MainMenu';
import CharacterSelection from './ui/CharacterSelection';
import GameHUD from './ui/GameHUD';
import ReactInventoryScreen from './organisms/ReactInventoryScreen';
import ReactCombat from './organisms/ReactCombat';
import ReactTestPanel from './ui/ReactTestPanel';

/**
 * Main React UI component that renders different screens based on game state
 */
const ReactUI: React.FC = () => {
  const { isGameLoaded } = useGame();
  const { currentScreen } = useUI();
  const { state: reactGameState } = useReactGame();

  console.log(`🖼️ ReactUI render: isGameLoaded=${isGameLoaded}, currentScreen="${currentScreen}"`);

  // Reinitialize world map when switching to game_world screen
  useEffect(() => {
    if (currentScreen === 'game_world' && isGameLoaded) {
      console.log('🗺️ React: Initializing world map for game_world screen');

      // Small delay to ensure DOM is ready
      setTimeout(() => {
        if (window.game?.ui?.ensureWorldMapOverlay) {
          console.log('🗺️ React: Calling ensureWorldMapOverlay()');
          window.game.ui.ensureWorldMapOverlay();
        } else {
          console.warn('⚠️ React: ensureWorldMapOverlay not available');
        }
      }, 100);
    }
  }, [currentScreen, isGameLoaded]);

  // Always render the UI structure so vanilla JS can find buttons
  // The game state will control what content is actually shown

  return (
    <div className="react-ui-overlay">
      {/* DOM containers for vanilla JS scene manager - these need to exist for scene registration */}
      <div id="main-menu" className={`screen ${currentScreen === 'main-menu' ? 'active' : ''}`}>
        <MainMenu />
      </div>

      <div id="character-select" className={`screen ${currentScreen === 'character_select' ? 'active' : ''}`}>
        <CharacterSelection />
      </div>

      <div id="game-world" className={`screen ${currentScreen === 'game_world' ? 'active' : ''}`}>
        <GameHUD />
        {/* World map container for vanilla JS */}
        <div id="world-map-container" style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 80px)',
          paddingTop: '80px',
          background: 'linear-gradient(135deg, var(--deep-brown) 0%, var(--shadow-black) 100%)'
        }}>
          {/* World map element that vanilla JS expects */}
          <div id="world-map" style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            padding: '20px',
            overflow: 'auto'
          }}></div>

          {/* Area details panel */}
          <div id="area-details-panel" style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            right: '20px',
            background: 'rgba(45, 27, 14, 0.95)',
            border: '2px solid var(--dark-gold)',
            borderRadius: '8px',
            padding: '15px',
            display: 'none'
          }}>
            <h3 id="area-name" style={{ color: 'var(--primary-gold)', marginBottom: '10px' }}></h3>
            <p id="area-description" style={{ color: 'var(--parchment)', marginBottom: '15px' }}></p>
            <div id="area-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button id="travel-to-area" className="btn primary" type="button">Travel Here</button>
              <button id="explore-area" className="btn primary" type="button">Explore Area</button>
              <button id="center-map" className="btn secondary" type="button">Center Map</button>
            </div>
          </div>

          {/* Control buttons */}
          <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
            <button id="back-from-world" className="btn secondary" type="button">← Back to Menu</button>
          </div>
        </div>
      </div>

      <div id="combat" className={`screen ${currentScreen === 'combat' || reactGameState.currentScreen === 'combat' ? 'active' : ''}`}>
        <ReactCombat />
      </div>

      <div id="monster-management" className={`screen ${currentScreen === 'monster_management' ? 'active' : ''}`}>
        {/* Monster management UI will be implemented here */}
        <div className="monster-management-placeholder">
          <h2>Monster Management</h2>
          <p>Monster management interface will be implemented here.</p>
          <div className="monster-buttons" style={{ margin: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button id="heal-all-btn" className="btn primary" type="button">Heal All</button>
            <button id="auto-arrange-btn" className="btn primary" type="button">Auto Arrange</button>
            <button id="release-selected-btn" className="btn danger" type="button">Release Selected</button>
            <button id="sort-storage-btn" className="btn secondary" type="button">Sort Storage</button>
            <button id="start-breeding-btn" className="btn primary" type="button">Start Breeding</button>
            <button id="clear-breeding-btn" className="btn secondary" type="button">Clear Breeding</button>
            <button id="back-from-monsters" className="btn secondary" type="button">Back</button>
          </div>
          <div className="monster-modal" id="monster-modal" style={{ display: 'none' }}>
            <button id="monster-modal-close" className="btn secondary" type="button">Close</button>
            <button id="modal-add-to-party" className="btn primary" type="button">Add to Party</button>
            <button id="modal-remove-from-party" className="btn secondary" type="button">Remove from Party</button>
            <button id="modal-release-monster" className="btn danger" type="button">Release Monster</button>
          </div>
        </div>
      </div>

      <div id="inventory" className={`screen ${currentScreen === 'inventory' || reactGameState.currentScreen === 'inventory' ? 'active' : ''}`}>
        <ReactInventoryScreen />
      </div>

      <div id="settings" className={`screen ${currentScreen === 'settings' ? 'active' : ''}`}>
        {/* Settings UI will be implemented here */}
        <div className="settings-placeholder">
          <h2>Settings</h2>
          <p>Settings interface will be implemented here.</p>
        </div>
      </div>

      {/* React Test Panel for development */}
      {process.env.NODE_ENV === 'development' && <ReactTestPanel />}
    </div>
  );
};

export default ReactUI;