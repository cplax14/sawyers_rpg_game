import React, { useState, useEffect } from 'react';
import { Button } from './atoms/Button';

interface SimpleInventoryScreenProps {
  className?: string;
  onClose?: () => void;
}

declare global {
  interface Window {
    GameState: any;
    ItemData: any;
  }
}

export const SimpleInventoryScreen: React.FC<SimpleInventoryScreenProps> = ({
  className,
  onClose
}) => {
  const [gameState, setGameState] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [gold, setGold] = useState(0);
  const [level, setLevel] = useState(1);
  const [experience, setExperience] = useState(0);

  // Update data from vanilla JS GameState
  useEffect(() => {
    const updateFromGameState = () => {
      if (window.GameState) {
        setGameState(window.GameState);

        // Get player data
        if (window.GameState.player) {
          setGold(window.GameState.player.inventory?.gold || 0);
          setLevel(window.GameState.player.level || 1);
          setExperience(window.GameState.player.experience || 0);

          // Get inventory items
          const inventoryItems = window.GameState.player.inventory?.items || {};
          const itemArray = Object.entries(inventoryItems).map(([itemId, quantity]) => {
            // Get item data from ItemData if available
            let itemData = { name: itemId, description: '', rarity: 'common' };
            if (window.ItemData && window.ItemData.getItem) {
              const data = window.ItemData.getItem(itemId);
              if (data) {
                itemData = { ...data };
              }
            }

            return {
              id: itemId,
              quantity,
              ...itemData
            };
          });
          setItems(itemArray);
        }
      }
    };

    // Update immediately
    updateFromGameState();

    // Update every second to catch changes
    const interval = setInterval(updateFromGameState, 1000);

    return () => clearInterval(interval);
  }, []);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    color: '#f4f4f4',
    padding: '1rem',
    boxSizing: 'border-box',
    overflow: 'auto'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '1.5rem'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0',
    color: '#d4af37'
  };

  const statsStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-around',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '1rem',
    marginBottom: '1rem',
    fontSize: '1.1rem'
  };

  const itemGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
    flex: 1
  };

  const itemCardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '8px',
    padding: '1rem',
    transition: 'transform 0.2s, box-shadow 0.2s'
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '1.2rem',
    padding: '3rem 1rem',
    fontStyle: 'italic'
  };

  return (
    <div className={className} style={containerStyle}>
      {onClose && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}
        >
          ✕
        </Button>
      )}

      <div style={headerStyle}>
        <h1 style={titleStyle}>Inventory</h1>
        <p style={{ color: '#94a3b8', margin: '0' }}>
          View your character progress and items
        </p>
      </div>

      {/* Character Stats */}
      <div style={statsStyle}>
        <div>
          <strong>Level:</strong> {level}
        </div>
        <div>
          <strong>Experience:</strong> {experience} XP
        </div>
        <div>
          <strong>Gold:</strong> {gold}
        </div>
      </div>

      {/* Items */}
      <div>
        <h3 style={{ color: '#d4af37', marginBottom: '1rem' }}>Items ({items.length})</h3>

        {items.length === 0 ? (
          <div style={emptyStateStyle}>
            No items in inventory
          </div>
        ) : (
          <div style={itemGridStyle}>
            {items.map((item) => (
              <div key={item.id} style={itemCardStyle}>
                <div style={{ fontWeight: 'bold', color: '#d4af37', marginBottom: '0.5rem' }}>
                  {item.name || item.id}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                  Quantity: {item.quantity}
                </div>
                {item.description && (
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {item.description}
                  </div>
                )}
                {item.rarity && item.rarity !== 'common' && (
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#d4af37',
                    marginTop: '0.5rem',
                    textTransform: 'uppercase'
                  }}>
                    {item.rarity}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '4px',
          fontSize: '0.8rem',
          color: '#94a3b8'
        }}>
          <strong>Debug Info:</strong><br/>
          GameState loaded: {window.GameState ? 'Yes' : 'No'}<br/>
          ItemData loaded: {window.ItemData ? 'Yes' : 'No'}<br/>
          Raw inventory: {JSON.stringify(gameState?.player?.inventory?.items || {}, null, 2)}
        </div>
      )}
    </div>
  );
};

export default SimpleInventoryScreen;