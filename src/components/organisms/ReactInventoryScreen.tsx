import React from 'react';
import { useReactGame, ReactItem } from '../../contexts/ReactGameContext';
import { Button } from '../atoms/Button';

interface ReactInventoryScreenProps {
  className?: string;
  onClose?: () => void;
}

const ReactInventoryScreen: React.FC<ReactInventoryScreenProps> = ({ className, onClose }) => {
  const { state, useItem, removeItem, setCurrentScreen } = useReactGame();

  if (!state.player) {
    return (
      <div className={className} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
        color: '#f4f4f4'
      }}>
        <div>No player data found...</div>
      </div>
    );
  }

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setCurrentScreen('world-map');
    }
  };

  const handleUseItem = (itemId: string) => {
    useItem(itemId);
  };

  const handleDropItem = (itemId: string) => {
    removeItem(itemId, 1);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return '#ff6b35';
      case 'epic': return '#9d4edd';
      case 'rare': return '#3b82f6';
      case 'uncommon': return '#10b981';
      case 'common': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getItemsByType = (type: ReactItem['type']) => {
    return state.inventory.filter(item => item.type === type);
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    color: '#f4f4f4',
    padding: '1rem',
    boxSizing: 'border-box',
    overflow: 'auto'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    margin: 0,
    color: '#d4af37',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
  };

  const statsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '2rem',
    border: '2px solid rgba(212, 175, 55, 0.3)'
  };

  const statItemStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '0.5rem'
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#d4af37',
    display: 'block'
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '0.9rem',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const tabsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem'
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.75rem 1.5rem',
    backgroundColor: active ? '#d4af37' : 'rgba(255, 255, 255, 0.1)',
    color: active ? '#1a1a2e' : '#f4f4f4',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  });

  const contentStyle: React.CSSProperties = {
    flex: 1,
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  };

  const itemGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem'
  };

  const itemCardStyle = (item: ReactItem): React.CSSProperties => ({
    background: 'rgba(255, 255, 255, 0.1)',
    border: `2px solid ${getRarityColor(item.rarity)}`,
    borderRadius: '12px',
    padding: '1rem',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    position: 'relative'
  });

  const itemHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.75rem'
  };

  const itemIconStyle: React.CSSProperties = {
    fontSize: '2rem',
    marginRight: '0.75rem'
  };

  const itemNameStyle = (rarity: string): React.CSSProperties => ({
    fontWeight: 'bold',
    color: getRarityColor(rarity),
    fontSize: '1.1rem'
  });

  const itemActionsStyle: React.CSSProperties = {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem'
  };

  const emptyStateStyle: React.CSSProperties = {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '1.2rem',
    padding: '3rem 1rem',
    fontStyle: 'italic'
  };

  const [activeTab, setActiveTab] = React.useState<'all' | 'consumable' | 'weapon' | 'armor' | 'material'>('all');

  const getFilteredItems = () => {
    if (activeTab === 'all') return state.inventory;
    return getItemsByType(activeTab);
  };

  const filteredItems = getFilteredItems();

  const totalValue = state.inventory.reduce((sum, item) => sum + (item.value * item.quantity), 0);

  return (
    <div className={className} style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={titleStyle}>🎒 Inventory</h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleClose}
        >
          ← Back
        </Button>
      </div>

      {/* Character Stats */}
      <div style={statsStyle}>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{state.player.level}</span>
          <span style={statLabelStyle}>Level</span>
        </div>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{state.player.experience}</span>
          <span style={statLabelStyle}>Experience</span>
        </div>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{state.player.gold}</span>
          <span style={statLabelStyle}>Gold</span>
        </div>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{state.inventory.length}</span>
          <span style={statLabelStyle}>Items</span>
        </div>
        <div style={statItemStyle}>
          <span style={statValueStyle}>{totalValue}</span>
          <span style={statLabelStyle}>Total Value</span>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={tabsStyle}>
        <button
          style={tabStyle(activeTab === 'all')}
          onClick={() => setActiveTab('all')}
        >
          All ({state.inventory.length})
        </button>
        <button
          style={tabStyle(activeTab === 'consumable')}
          onClick={() => setActiveTab('consumable')}
        >
          Consumables ({getItemsByType('consumable').length})
        </button>
        <button
          style={tabStyle(activeTab === 'weapon')}
          onClick={() => setActiveTab('weapon')}
        >
          Weapons ({getItemsByType('weapon').length})
        </button>
        <button
          style={tabStyle(activeTab === 'armor')}
          onClick={() => setActiveTab('armor')}
        >
          Armor ({getItemsByType('armor').length})
        </button>
        <button
          style={tabStyle(activeTab === 'material')}
          onClick={() => setActiveTab('material')}
        >
          Materials ({getItemsByType('material').length})
        </button>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {filteredItems.length === 0 ? (
          <div style={emptyStateStyle}>
            No {activeTab === 'all' ? 'items' : activeTab + 's'} in inventory
          </div>
        ) : (
          <div style={itemGridStyle}>
            {filteredItems.map((item) => (
              <div key={item.id} style={itemCardStyle(item)}>
                <div style={itemHeaderStyle}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={itemIconStyle}>{item.icon}</span>
                    <div>
                      <div style={itemNameStyle(item.rarity)}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {item.rarity} • x{item.quantity}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: '#f59e0b', fontWeight: 'bold' }}>
                      {item.value}g
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  {item.description}
                </div>

                {item.effects && item.effects.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    {item.effects.map((effect, index) => (
                      <div key={index} style={{
                        fontSize: '0.8rem',
                        color: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        marginBottom: '0.25rem'
                      }}>
                        {effect.type}: {effect.value}
                        {effect.duration && ` (${effect.duration}s)`}
                      </div>
                    ))}
                  </div>
                )}

                <div style={itemActionsStyle}>
                  {item.type === 'consumable' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUseItem(item.id)}
                      disabled={item.quantity <= 0}
                    >
                      Use
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDropItem(item.id)}
                    disabled={item.quantity <= 0}
                  >
                    Drop
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactInventoryScreen;