import React from 'react';
import { useReactGame, ReactItem } from '../../contexts/ReactGameContext';
import { Button } from '../atoms/Button';

interface VictoryModalProps {
  isVisible?: boolean;
  onClose?: () => void;
}

const VictoryModal: React.FC<VictoryModalProps> = ({ isVisible, onClose }) => {
  const { state, hideVictoryModal, setCurrentScreen } = useReactGame();

  // Use showVictoryModal from state if isVisible prop not provided
  const modalVisible = isVisible !== undefined ? isVisible : state.showVictoryModal;

  if (!modalVisible || !state.lastCombatRewards) {
    return null;
  }

  const { experience, gold, items } = state.lastCombatRewards;

  const handleClose = () => {
    hideVictoryModal();
    // Navigate back to area exploration when modal is closed
    setCurrentScreen('area');
    // Call onClose prop if provided
    if (onClose) {
      onClose();
    }
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

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.3s ease-out'
  };

  const contentStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
    border: '3px solid #d4af37',
    borderRadius: '16px',
    padding: '2rem',
    minWidth: '400px',
    maxWidth: '500px',
    color: '#f4f4f4',
    textAlign: 'center',
    position: 'relative',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    animation: 'slideUp 0.3s ease-out'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#d4af37',
    marginBottom: '1.5rem',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
  };

  const rewardSectionStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '1.5rem',
    marginBottom: '1.5rem'
  };

  const rewardItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.5rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    fontSize: '1.2rem'
  };

  const itemsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  };

  const itemCardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.1)',
    border: '2px solid rgba(212, 175, 55, 0.3)',
    borderRadius: '8px',
    padding: '0.75rem',
    textAlign: 'center',
    transition: 'transform 0.2s ease'
  };

  return (
    <div style={modalStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>🎉 Victory! 🎉</h1>

        <div style={rewardSectionStyle}>
          <h3 style={{ color: '#d4af37', marginBottom: '1rem', fontSize: '1.5rem' }}>
            Combat Rewards
          </h3>

          <div style={rewardItemStyle}>
            <span>🌟 Experience:</span>
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>+{experience} XP</span>
          </div>

          <div style={rewardItemStyle}>
            <span>💰 Gold:</span>
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>+{gold} coins</span>
          </div>

          {items.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div style={rewardItemStyle}>
                <span>🎒 Items Found:</span>
                <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{items.length} item{items.length > 1 ? 's' : ''}</span>
              </div>

              <div style={itemsGridStyle}>
                {items.map((item: ReactItem, index: number) => (
                  <div
                    key={`${item.id}-${index}`}
                    style={{
                      ...itemCardStyle,
                      borderColor: getRarityColor(item.rarity)
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                      {item.icon}
                    </div>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      color: getRarityColor(item.rarity)
                    }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      x{item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {state.player && state.player.experience >= state.player.experienceToNext && (
          <div style={{
            background: 'linear-gradient(45deg, #10b981, #059669)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem',
            border: '2px solid #d4af37'
          }}>
            <h3 style={{ color: '#fff', margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>
              ⭐ Level Up! ⭐
            </h3>
            <p style={{ margin: 0, color: '#f0f9ff' }}>
              Congratulations! You reached level {state.player.level}!
            </p>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          onClick={handleClose}
          style={{
            backgroundColor: '#d4af37',
            color: '#1a1a2e',
            fontWeight: 'bold',
            padding: '0.75rem 2rem',
            fontSize: '1.1rem'
          }}
        >
          Continue Adventure
        </Button>
      </div>
    </div>
  );
};

export default VictoryModal;