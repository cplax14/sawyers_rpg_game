import React, { useEffect } from 'react';
import { usePlayer, useUI } from '../../contexts/GameContext';

const GameHUD: React.FC = () => {
  const player = usePlayer();
  const { showScreen } = useUI();

  // Log when HUD is ready (vanilla JS handles button attachment via delegation)
  useEffect(() => {
    if (!player) return;
    console.log('🔗 React HUD buttons ready for vanilla JS');
  }, [player]);

  if (!player) {
    return null;
  }

  return (
    <div id="game-hud" style={{
      position: 'absolute',
      top: '0',
      left: '0',
      right: '0',
      height: '80px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'rgba(45, 27, 14, 0.9)',
      borderRadius: '0 0 8px 8px',
      padding: '10px 20px',
      border: '2px solid var(--dark-gold)',
      borderTop: 'none',
      zIndex: 1000,
      boxShadow: '0 4px 8px var(--heavy-shadow)'
    }}>
      <div className="hud-section player-stats" style={{
        display: 'flex',
        gap: '20px',
        color: 'var(--parchment)',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        <div className="stat">Level: <span style={{ color: 'var(--primary-gold)' }}>{player.level}</span></div>
        <div className="stat">HP: <span style={{ color: '#ff4444' }}>{player.hp}</span>/<span>{player.maxHp}</span></div>
        <div className="stat">MP: <span style={{ color: '#4444ff' }}>{player.mp}</span>/<span>{player.maxMp}</span></div>
        <div className="stat">Gold: <span style={{ color: 'var(--primary-gold)' }}>{player.gold}</span></div>
      </div>

      <div className="hud-section action-buttons" style={{ display: 'flex', gap: '10px' }}>
        <button id="world-map-btn" className="btn hud" type="button">Map</button>
        <button id="monsters-btn" className="btn hud" type="button">Monsters</button>
        <button id="inventory-btn" className="btn hud" type="button">Inventory</button>
        <button id="save-game-btn" className="btn hud" type="button">Save</button>
      </div>
    </div>
  );
};

export default GameHUD;