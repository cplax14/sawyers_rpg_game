import React, { useState } from 'react';
import { useReactGame } from '../../contexts/ReactGameContext';
import { Button } from '../atoms/Button';

interface ReactTestPanelProps {
  isVisible?: boolean;
}

const ReactTestPanel: React.FC<ReactTestPanelProps> = ({ isVisible = true }) => {
  const { state, startCombat, setCurrentScreen, createPlayer, addItems } = useReactGame();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isVisible) return null;

  const handleTestCombat = () => {
    startCombat('goblin', 5);
  };

  const handleOpenInventory = () => {
    setCurrentScreen('inventory');
  };

  const handleCreateTestPlayer = () => {
    createPlayer('Test Hero', 'warrior');
  };

  const handleAddTestItems = () => {
    addItems([
      {
        id: 'health_potion',
        name: 'Health Potion',
        description: 'Restores 50 HP when used.',
        type: 'consumable',
        rarity: 'common',
        value: 25,
        quantity: 3,
        icon: '🧪',
        effects: [{ type: 'heal', value: 50 }],
      },
      {
        id: 'steel_sword',
        name: 'Steel Sword',
        description: 'A sturdy steel sword with good balance.',
        type: 'weapon',
        rarity: 'uncommon',
        value: 150,
        quantity: 1,
        icon: '⚔️',
        stats: { attack: 15 },
      },
    ]);
  };

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    top: '10px',
    right: '10px',
    background: 'rgba(26, 26, 46, 0.95)',
    border: '2px solid #d4af37',
    borderRadius: '8px',
    padding: '1rem',
    color: '#f4f4f4',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    minWidth: '200px',
  };

  const titleStyle: React.CSSProperties = {
    color: '#d4af37',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
    textAlign: 'center',
  };

  const playerInfoStyle: React.CSSProperties = {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginBottom: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '4px',
  };

  return (
    <div style={panelStyle}>
      <div
        style={{
          ...titleStyle,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <span>React Test Panel</span>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#d4af37',
            cursor: 'pointer',
            fontSize: '0.8rem',
            padding: '2px 4px',
            borderRadius: '2px',
          }}
        >
          {isCollapsed ? '▼' : '▲'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {state.player ? (
            <div style={playerInfoStyle}>
              <div>
                <strong>{state.player.name}</strong>
              </div>
              <div>Level {state.player.level}</div>
              <div>{state.player.experience} XP</div>
              <div>{state.player.gold} Gold</div>
              <div>{state.inventory.length} Items</div>
              <div>Screen: {state.currentScreen}</div>
            </div>
          ) : (
            <div style={playerInfoStyle}>No player created</div>
          )}

          {!state.player && (
            <Button variant='primary' size='sm' onClick={handleCreateTestPlayer}>
              Create Test Player
            </Button>
          )}

          {state.player && (
            <>
              <Button
                variant='primary'
                size='sm'
                onClick={handleTestCombat}
                disabled={state.currentEncounter !== null}
              >
                Start Test Combat
              </Button>

              <Button variant='secondary' size='sm' onClick={handleOpenInventory}>
                Open Inventory
              </Button>

              <Button variant='secondary' size='sm' onClick={handleAddTestItems}>
                Add Test Items
              </Button>

              <Button variant='secondary' size='sm' onClick={() => setCurrentScreen('creatures')}>
                🐉 Creatures
              </Button>

              <Button variant='secondary' size='sm' onClick={() => setCurrentScreen('breeding')}>
                🧬 Breeding
              </Button>

              <Button variant='secondary' size='sm' onClick={() => setCurrentScreen('world-map')}>
                World Map
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ReactTestPanel;
