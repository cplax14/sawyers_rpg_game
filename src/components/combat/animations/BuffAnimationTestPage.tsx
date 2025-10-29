import React, { useState, useCallback } from 'react';
import { HealAnimation } from './variants/HealAnimation';
import { ProtectAnimation } from './variants/ProtectAnimation';
import { ShellAnimation } from './variants/ShellAnimation';
import { HasteAnimation } from './variants/HasteAnimation';

/**
 * BuffAnimationTestPage - Test harness for buff animations
 *
 * Allows visual testing of all buff animations in sustain phase with:
 * - Mock character position clearly visible
 * - Individual trigger buttons for each buff
 * - Toggle between cast phase and sustain phase
 * - Ability to deactivate sustain to trigger fade phase
 * - Visual subtlety assessment during sustained effects
 */

type BuffType = 'heal' | 'protect' | 'shell' | 'haste' | null;

const TARGET_X = 400;
const TARGET_Y = 300;

export const BuffAnimationTestPage: React.FC = () => {
  const [activeBuff, setActiveBuff] = useState<BuffType>(null);
  const [isSustaining, setIsSustaining] = useState(false);

  const playBuff = useCallback((buff: BuffType) => {
    if (buff === null) return;

    console.log(`🎬 Starting ${buff} animation...`);
    setActiveBuff(buff);
    setIsSustaining(false); // Start with cast phase
  }, []);

  const handleCastComplete = useCallback(() => {
    console.log('✅ Cast phase complete, entering sustain phase');
    setIsSustaining(true);
  }, []);

  const handleFadeComplete = useCallback(() => {
    console.log('✅ Fade complete, buff animation ended');
    setActiveBuff(null);
    setIsSustaining(false);
  }, []);

  const stopBuff = useCallback(() => {
    console.log('🛑 Stopping buff, triggering fade phase');
    setIsSustaining(false);
  }, []);

  const clearBuff = useCallback(() => {
    setActiveBuff(null);
    setIsSustaining(false);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          right: 20,
          zIndex: 200,
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '20px',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <h1
          style={{
            color: '#fff',
            margin: '0 0 15px 0',
            fontSize: '24px',
            fontWeight: 600,
          }}
        >
          Buff Animation Test Harness - Subtlety Assessment
        </h1>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <button
            onClick={() => playBuff('heal')}
            disabled={activeBuff !== null}
            style={{
              padding: '10px 20px',
              background: activeBuff === 'heal' ? '#8bc34a' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: activeBuff === null ? 'pointer' : 'not-allowed',
              opacity: activeBuff === null ? 1 : 0.5,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            🌿 Heal (1100ms)
          </button>

          <button
            onClick={() => playBuff('protect')}
            disabled={activeBuff !== null}
            style={{
              padding: '10px 20px',
              background: activeBuff === 'protect' ? '#4da6ff' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: activeBuff === null ? 'pointer' : 'not-allowed',
              opacity: activeBuff === null ? 1 : 0.5,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            🛡️ Protect (700ms + sustain)
          </button>

          <button
            onClick={() => playBuff('shell')}
            disabled={activeBuff !== null}
            style={{
              padding: '10px 20px',
              background: activeBuff === 'shell' ? '#9c27b0' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: activeBuff === null ? 'pointer' : 'not-allowed',
              opacity: activeBuff === null ? 1 : 0.5,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            ✨ Shell (700ms + sustain)
          </button>

          <button
            onClick={() => playBuff('haste')}
            disabled={activeBuff !== null}
            style={{
              padding: '10px 20px',
              background: activeBuff === 'haste' ? '#ffd700' : '#333',
              color: activeBuff === 'haste' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: activeBuff === null ? 'pointer' : 'not-allowed',
              opacity: activeBuff === null ? 1 : 0.5,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            ⚡ Haste (250ms + sustain)
          </button>

          <div style={{ flex: '1 0 auto' }} />

          {isSustaining && activeBuff && activeBuff !== 'heal' && (
            <button
              onClick={stopBuff}
              style={{
                padding: '10px 20px',
                background: '#f44336',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              🛑 End Buff (Trigger Fade)
            </button>
          )}

          <button
            onClick={clearBuff}
            style={{
              padding: '10px 20px',
              background: '#444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            ❌ Clear
          </button>
        </div>

        {/* Status Indicator */}
        {activeBuff && (
          <div
            style={{
              padding: '10px',
              background: isSustaining ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
              borderRadius: '4px',
              border: isSustaining ? '2px solid #4caf50' : '2px solid #ff9800',
              color: '#fff',
            }}
          >
            <strong>Status:</strong> {activeBuff.toUpperCase()} -{' '}
            {isSustaining ? 'SUSTAINING (observe subtlety)' : 'CASTING'}
          </div>
        )}
      </div>

      {/* Position Indicator */}
      <div style={{ position: 'absolute', zIndex: 50 }}>
        {/* Character position (green) */}
        <div
          style={{
            position: 'absolute',
            left: TARGET_X - 20,
            top: TARGET_Y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(76, 175, 80, 0.3)',
            border: '3px solid #4caf50',
            boxShadow: '0 0 20px rgba(76, 175, 80, 0.5)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: TARGET_X - 60,
            top: TARGET_Y + 30,
            color: '#4caf50',
            fontSize: '12px',
            fontWeight: 600,
            textShadow: '0 0 8px rgba(76, 175, 80, 0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          CHARACTER ({TARGET_X}, {TARGET_Y})
        </div>
      </div>

      {/* Subtlety Assessment Guide */}
      <div
        style={{
          position: 'absolute',
          bottom: 20,
          left: 20,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          borderRadius: '8px',
          maxWidth: '500px',
          zIndex: 200,
          backdropFilter: 'blur(10px)',
          color: '#fff',
          fontSize: '13px',
          lineHeight: '1.6',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 600 }}>
          Subtlety Assessment Criteria
        </h3>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li>✅ Buff effect is visible but doesn't obscure the character</li>
          <li>✅ Opacity is low enough (15-45%) to see through effects</li>
          <li>✅ Particle counts are minimal (not overwhelming)</li>
          <li>✅ Animation motion is gentle (not frenetic)</li>
          <li>✅ Colors are pleasant and thematically appropriate</li>
          <li>✅ Effects clearly communicate buff type without being intrusive</li>
        </ul>
        <p style={{ margin: '10px 0 0 0', fontStyle: 'italic', color: '#aaa' }}>
          During SUSTAINING phase, observe if you can still clearly see the character sprite and
          whether the effect would be distracting during actual combat.
        </p>
      </div>

      {/* Active Status Indicator */}
      {activeBuff && !isSustaining && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#fff',
            fontSize: '24px',
            fontWeight: 700,
            textShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
            zIndex: 150,
            pointerEvents: 'none',
            animation: 'pulse 1s infinite',
          }}
        >
          Casting: {activeBuff.toUpperCase()}
        </div>
      )}

      {/* Animations */}
      {activeBuff === 'heal' && (
        <HealAnimation
          targetX={TARGET_X}
          targetY={TARGET_Y}
          healAmount={25}
          onComplete={handleFadeComplete}
        />
      )}

      {activeBuff === 'protect' && (
        <ProtectAnimation
          targetX={TARGET_X}
          targetY={TARGET_Y}
          isActive={isSustaining}
          onCastComplete={handleCastComplete}
          onFadeComplete={handleFadeComplete}
        />
      )}

      {activeBuff === 'shell' && (
        <ShellAnimation
          targetX={TARGET_X}
          targetY={TARGET_Y}
          isActive={isSustaining}
          onCastComplete={handleCastComplete}
          onFadeComplete={handleFadeComplete}
        />
      )}

      {activeBuff === 'haste' && (
        <HasteAnimation
          targetX={TARGET_X}
          targetY={TARGET_Y}
          isActive={isSustaining}
          onCastComplete={handleCastComplete}
          onFadeComplete={handleFadeComplete}
        />
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default BuffAnimationTestPage;
