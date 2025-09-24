import React, { useEffect } from 'react';

// Define character classes data inline for now
const CHARACTER_CLASSES = {
  knight: {
    name: "Knight",
    description: "Strong defense and sword mastery",
    icon: "⚔️",
    baseStats: {
      hp: 120,
      mp: 30,
      attack: 85,
      defense: 95
    },
    color: "#B8860B"
  },
  wizard: {
    name: "Wizard",
    description: "Master of magical arts and spells",
    icon: "🧙",
    baseStats: {
      hp: 80,
      mp: 120,
      attack: 50,
      defense: 40
    },
    color: "#4169E1"
  },
  rogue: {
    name: "Rogue",
    description: "Fast and deadly with daggers",
    icon: "🗡️",
    baseStats: {
      hp: 90,
      mp: 50,
      attack: 95,
      defense: 60
    },
    color: "#8B0000"
  },
  ranger: {
    name: "Ranger",
    description: "Nature's guardian with bow mastery",
    icon: "🏹",
    baseStats: {
      hp: 100,
      mp: 70,
      attack: 80,
      defense: 75
    },
    color: "#228B22"
  }
};

const CharacterSelection: React.FC = () => {

  useEffect(() => {
    console.log('🎭 CharacterSelection component mounted');

    // Wait for DOM to be ready and stable, then ensure vanilla JS can attach listeners
    const attachListeners = () => {
      const classCards = document.querySelectorAll('.class-card');
      console.log(`🎯 Found ${classCards.length} class cards - notifying vanilla JS`);

      // Trigger vanilla JS to re-attach character selection event listeners
      if (window.game && window.game.ui && window.game.ui.modules.MenuUI) {
        console.log('🔗 Re-attaching character selection event listeners');
        window.game.ui.modules.MenuUI.attachCharacterSelection();
      } else {
        console.log('⚠️ MenuUI not available for re-attachment');
      }
    };

    // Try multiple times to ensure it works
    setTimeout(attachListeners, 100);
    setTimeout(attachListeners, 500);
    setTimeout(attachListeners, 1000);

  }, []);

  return (
    <div className="character-selection-container" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(135deg, var(--deep-brown) 0%, var(--shadow-black) 100%)',
      padding: '2rem',
      overflowY: 'auto'
    }}>
      <div className="character-selection-content" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div className="selection-header" style={{ marginBottom: '2rem' }}>
          <h1 style={{
            color: 'var(--primary-gold)',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            textShadow: '2px 2px 4px var(--heavy-shadow)',
            marginBottom: '0.5rem'
          }}>
            Choose Your Class
          </h1>
          <p style={{
            color: 'var(--parchment)',
            fontSize: '1.2rem',
            opacity: 0.9,
            marginBottom: '2rem'
          }}>
            Select the character class that will define your adventure
          </p>
        </div>

        <div className="character-classes-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {Object.entries(CHARACTER_CLASSES).map(([classKey, classData]) => (
            <div
              key={classKey}
              className="class-card"
              data-class={classKey}
              style={{
                background: 'linear-gradient(135deg, var(--deep-brown), var(--medium-brown))',
                border: '2px solid var(--dark-gold)',
                borderRadius: '12px',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = 'var(--primary-gold)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 175, 55, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--dark-gold)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              }}
            >
              <div className="class-icon" style={{
                fontSize: '3rem',
                marginBottom: '1rem'
              }}>
                {classData.icon}
              </div>

              <h3 style={{
                color: 'var(--primary-gold)',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                textShadow: '1px 1px 2px var(--heavy-shadow)'
              }}>
                {classData.name}
              </h3>

              <p style={{
                color: 'var(--parchment)',
                fontSize: '0.95rem',
                marginBottom: '1rem',
                opacity: 0.9,
                lineHeight: '1.4'
              }}>
                {classData.description}
              </p>

              <div className="class-stats" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                fontSize: '0.85rem'
              }}>
                <div style={{ color: 'var(--blood-red)' }}>
                  ❤️ HP: {classData.baseStats.hp}
                </div>
                <div style={{ color: 'var(--ice-blue)' }}>
                  💧 MP: {classData.baseStats.mp}
                </div>
                <div style={{ color: 'var(--dragon-red)' }}>
                  ⚔️ ATK: {classData.baseStats.attack}
                </div>
                <div style={{ color: 'var(--emerald-green)' }}>
                  🛡️ DEF: {classData.baseStats.defense}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="character-selection-buttons" style={{
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button
            id="start-adventure-btn"
            className="btn primary"
            disabled={true}
            type="button"
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1.1rem',
              opacity: 0.6
            }}
          >
            Start Adventure
          </button>
          <button
            id="back-to-menu"
            className="btn secondary"
            type="button"
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1.1rem'
            }}
          >
            ← Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterSelection;