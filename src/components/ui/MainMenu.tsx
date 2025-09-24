import React, { useEffect } from 'react';
import { useUI, useGame } from '../../contexts/GameContext';

const MainMenu: React.FC = () => {
  const { showScreen } = useUI();
  const { isGameLoaded } = useGame();

  console.log('🍎 MainMenu rendering - isGameLoaded:', isGameLoaded);

  // Log when menu is ready and check if buttons actually exist in DOM
  useEffect(() => {
    console.log('🔗 MainMenu useEffect - isGameLoaded:', isGameLoaded);

    const newGameBtn = document.getElementById('new-game-btn');
    const loadGameBtn = document.getElementById('load-game-btn');
    const settingsBtn = document.getElementById('settings-btn');

    console.log('🔍 MainMenu DOM check:', {
      newGameBtn: !!newGameBtn,
      loadGameBtn: !!loadGameBtn,
      settingsBtn: !!settingsBtn
    });

    if (isGameLoaded) {
      console.log('🔗 React Menu buttons ready for vanilla JS');
    }
  }, [isGameLoaded]);

  // Remove React onClick handlers - let vanilla JS MenuUI handle all interactions

  return (
    <div className="main-menu-wrapper" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      background: 'linear-gradient(135deg, var(--deep-brown) 0%, var(--shadow-black) 100%)',
      backgroundImage: 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><defs><pattern id=\'grain\' patternUnits=\'userSpaceOnUse\' width=\'100\' height=\'100\'><circle cx=\'50\' cy=\'50\' r=\'1\' fill=\'%23000\' opacity=\'0.1\'/></pattern></defs><rect width=\'100\' height=\'100\' fill=\'url(%23grain)\'/></svg>")'
    }}>
      <div className="main-menu-content">
        <div className="game-title-section">
          <h1 className="game-title">Sawyer's RPG Game</h1>
          <p className="game-subtitle">A Fantasy Adventure</p>
        </div>

        <div className="main-menu-art">
          <div className="menu-emblem">⚔️</div>
        </div>

        {!isGameLoaded && (
          <div style={{ textAlign: 'center', margin: '20px', color: '#ccc' }}>
            <div>🔄 Initializing Sawyer's RPG Game...</div>
            <div style={{ fontSize: '0.8em', marginTop: '5px' }}>Please wait...</div>
          </div>
        )}

        <div className="menu-buttons">
          <button
            id="new-game-btn"
            className="btn primary menu-btn"
            disabled={!isGameLoaded}
            type="button"
          >
            <span className="btn-icon">🆕</span>
            <span className="btn-text">New Game</span>
            <span className="btn-subtitle">Begin your adventure</span>
          </button>

          <button
            id="load-game-btn"
            className="btn secondary menu-btn"
            disabled={!isGameLoaded}
            type="button"
          >
            <span className="btn-icon">📂</span>
            <span className="btn-text">Load Game</span>
            <span className="btn-subtitle">Continue your journey</span>
          </button>

          <button
            id="settings-btn"
            className="btn secondary menu-btn"
            disabled={!isGameLoaded}
            type="button"
          >
            <span className="btn-icon">⚙️</span>
            <span className="btn-text">Settings</span>
            <span className="btn-subtitle">Configure your game</span>
          </button>
        </div>

        <div className="menu-footer">
          <p className="version-info">Version 1.0 - React Port</p>
          <p className="credit">Created for Sawyer</p>
          {isGameLoaded && <p style={{ color: '#4a4', fontSize: '0.8em' }}>✅ Game Ready!</p>}
        </div>
      </div>
    </div>
  );
};

export default MainMenu;