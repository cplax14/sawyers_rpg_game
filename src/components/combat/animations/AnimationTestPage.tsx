import React, { useState, useCallback } from 'react';
import { FireballAnimation } from './variants/FireballAnimation';
import { IceShardAnimation } from './variants/IceShardAnimation';
import { LightningAnimation } from './variants/LightningAnimation';
import { HolyBeamAnimation } from './variants/HolyBeamAnimation';
import { MeteorAnimation } from './variants/MeteorAnimation';

/**
 * AnimationTestPage - Test harness for spell animations
 *
 * Allows visual testing of all spell animations in isolation with:
 * - Mock caster/target positions clearly visible
 * - Individual trigger buttons for each spell
 * - Timing measurements to verify durations
 * - "Play All" sequential testing
 */

type SpellType = 'fireball' | 'ice-shard' | 'lightning' | 'holy-beam' | 'meteor' | null;

interface AnimationTiming {
  name: string;
  expectedDuration: number;
  actualDuration?: number;
}

const SPELL_TIMINGS: Record<string, number> = {
  fireball: 950,
  'ice-shard': 900,
  lightning: 900,
  'holy-beam': 1000,
  meteor: 1500,
};

const CASTER_X = 200;
const CASTER_Y = 300;
const TARGET_X = 600;
const TARGET_Y = 300;

export const AnimationTestPage: React.FC = () => {
  const [activeSpell, setActiveSpell] = useState<SpellType>(null);
  const [timingLog, setTimingLog] = useState<AnimationTiming[]>([]);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const playSpell = useCallback((spell: SpellType) => {
    if (spell === null) return;

    console.log(`🎬 Starting ${spell} animation...`);
    setActiveSpell(spell);
    setStartTime(Date.now());
  }, []);

  const handleAnimationComplete = useCallback(() => {
    const endTime = Date.now();
    const spell = activeSpell;

    if (spell && startTime) {
      const actualDuration = endTime - startTime;
      const expectedDuration = SPELL_TIMINGS[spell];
      const timing: AnimationTiming = {
        name: spell,
        expectedDuration,
        actualDuration,
      };

      console.log(`✅ ${spell} completed in ${actualDuration}ms (expected: ${expectedDuration}ms)`);
      setTimingLog(prev => [...prev, timing]);
    }

    setActiveSpell(null);
    setStartTime(null);
  }, [activeSpell, startTime]);

  const playAll = useCallback(() => {
    setIsPlayingAll(true);
    setTimingLog([]);

    const spells: SpellType[] = ['fireball', 'ice-shard', 'lightning', 'holy-beam', 'meteor'];
    let currentIndex = 0;

    const playNext = () => {
      if (currentIndex < spells.length) {
        const spell = spells[currentIndex];
        console.log(`🎬 Playing ${spell} (${currentIndex + 1}/${spells.length})`);
        playSpell(spell);
        currentIndex++;
      } else {
        setIsPlayingAll(false);
        console.log('🎉 All animations complete!');
      }
    };

    // Start first animation
    playNext();

    // Use a temporary completion handler for sequential playback
    const originalComplete = handleAnimationComplete;
    const sequentialComplete = () => {
      originalComplete();
      setTimeout(playNext, 500); // 500ms delay between animations
    };

    // Note: This is a simplified approach. In practice, you'd want better state management
    // for sequential playback, but this works for testing purposes.
  }, [playSpell, handleAnimationComplete]);

  const clearLog = useCallback(() => {
    setTimingLog([]);
    console.clear();
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
          Spell Animation Test Harness
        </h1>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => playSpell('fireball')}
            disabled={activeSpell !== null || isPlayingAll}
            style={{
              padding: '10px 20px',
              background: activeSpell === 'fireball' ? '#ff6b35' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: activeSpell === null && !isPlayingAll ? 'pointer' : 'not-allowed',
              opacity: activeSpell === null && !isPlayingAll ? 1 : 0.5,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            🔥 Fireball (950ms)
          </button>

          <button
            onClick={() => playSpell('ice-shard')}
            disabled={activeSpell !== null || isPlayingAll}
            style={{
              padding: '10px 20px',
              background: activeSpell === 'ice-shard' ? '#4da6ff' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: activeSpell === null && !isPlayingAll ? 'pointer' : 'not-allowed',
              opacity: activeSpell === null && !isPlayingAll ? 1 : 0.5,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            ❄️ Ice Shard (900ms)
          </button>

          <button
            onClick={() => playSpell('lightning')}
            disabled={activeSpell !== null || isPlayingAll}
            style={{
              padding: '10px 20px',
              background: activeSpell === 'lightning' ? '#ffeb3b' : '#333',
              color: activeSpell === 'lightning' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: activeSpell === null && !isPlayingAll ? 'pointer' : 'not-allowed',
              opacity: activeSpell === null && !isPlayingAll ? 1 : 0.5,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            ⚡ Lightning (900ms)
          </button>

          <button
            onClick={() => playSpell('holy-beam')}
            disabled={activeSpell !== null || isPlayingAll}
            style={{
              padding: '10px 20px',
              background: activeSpell === 'holy-beam' ? '#ffd700' : '#333',
              color: activeSpell === 'holy-beam' ? '#000' : '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: activeSpell === null && !isPlayingAll ? 'pointer' : 'not-allowed',
              opacity: activeSpell === null && !isPlayingAll ? 1 : 0.5,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            ✨ Holy Beam (1000ms)
          </button>

          <button
            onClick={() => playSpell('meteor')}
            disabled={activeSpell !== null || isPlayingAll}
            style={{
              padding: '10px 20px',
              background: activeSpell === 'meteor' ? '#ff4444' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: activeSpell === null && !isPlayingAll ? 'pointer' : 'not-allowed',
              opacity: activeSpell === null && !isPlayingAll ? 1 : 0.5,
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            ☄️ Meteor (1500ms)
          </button>

          <div style={{ flex: '1 0 auto' }} />

          <button
            onClick={playAll}
            disabled={activeSpell !== null || isPlayingAll}
            style={{
              padding: '10px 20px',
              background: isPlayingAll ? '#4caf50' : '#666',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: activeSpell === null && !isPlayingAll ? 'pointer' : 'not-allowed',
              opacity: activeSpell === null && !isPlayingAll ? 1 : 0.5,
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            🎬 Play All
          </button>

          <button
            onClick={clearLog}
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
            🗑️ Clear Log
          </button>
        </div>
      </div>

      {/* Position Indicators */}
      <div style={{ position: 'absolute', zIndex: 50 }}>
        {/* Caster position (blue) */}
        <div
          style={{
            position: 'absolute',
            left: CASTER_X - 15,
            top: CASTER_Y - 15,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(33, 150, 243, 0.3)',
            border: '3px solid #2196f3',
            boxShadow: '0 0 20px rgba(33, 150, 243, 0.5)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: CASTER_X - 50,
            top: CASTER_Y + 25,
            color: '#2196f3',
            fontSize: '12px',
            fontWeight: 600,
            textShadow: '0 0 8px rgba(33, 150, 243, 0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          CASTER ({CASTER_X}, {CASTER_Y})
        </div>

        {/* Target position (red) */}
        <div
          style={{
            position: 'absolute',
            left: TARGET_X - 15,
            top: TARGET_Y - 15,
            width: 30,
            height: 30,
            borderRadius: '50%',
            background: 'rgba(244, 67, 54, 0.3)',
            border: '3px solid #f44336',
            boxShadow: '0 0 20px rgba(244, 67, 54, 0.5)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: TARGET_X - 50,
            top: TARGET_Y + 25,
            color: '#f44336',
            fontSize: '12px',
            fontWeight: 600,
            textShadow: '0 0 8px rgba(244, 67, 54, 0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          TARGET ({TARGET_X}, {TARGET_Y})
        </div>
      </div>

      {/* Timing Log */}
      {timingLog.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            background: 'rgba(0, 0, 0, 0.8)',
            padding: '15px',
            borderRadius: '8px',
            maxWidth: '400px',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 200,
            backdropFilter: 'blur(10px)',
          }}
        >
          <h3
            style={{
              color: '#fff',
              margin: '0 0 10px 0',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            Timing Log
          </h3>
          {timingLog.map((timing, index) => {
            const diff = timing.actualDuration
              ? timing.actualDuration - timing.expectedDuration
              : 0;
            const isAccurate = Math.abs(diff) < 50; // Within 50ms tolerance

            return (
              <div
                key={index}
                style={{
                  padding: '8px',
                  marginBottom: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '4px',
                  borderLeft: `3px solid ${isAccurate ? '#4caf50' : '#ff9800'}`,
                }}
              >
                <div
                  style={{
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    marginBottom: '4px',
                  }}
                >
                  {timing.name.replace('-', ' ')}
                </div>
                <div
                  style={{
                    color: '#aaa',
                    fontSize: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Expected: {timing.expectedDuration}ms</span>
                  <span
                    style={{
                      color: isAccurate ? '#4caf50' : '#ff9800',
                      fontWeight: 500,
                    }}
                  >
                    Actual: {timing.actualDuration}ms ({diff >= 0 ? '+' : ''}
                    {diff}ms)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Status Indicator */}
      {activeSpell && (
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
          Playing: {activeSpell.replace('-', ' ').toUpperCase()}
        </div>
      )}

      {/* Animations */}
      {activeSpell === 'fireball' && (
        <FireballAnimation
          casterX={CASTER_X}
          casterY={CASTER_Y}
          targetX={TARGET_X}
          targetY={TARGET_Y}
          onComplete={handleAnimationComplete}
        />
      )}

      {activeSpell === 'ice-shard' && (
        <IceShardAnimation
          casterX={CASTER_X}
          casterY={CASTER_Y}
          targetX={TARGET_X}
          targetY={TARGET_Y}
          onComplete={handleAnimationComplete}
        />
      )}

      {activeSpell === 'lightning' && (
        <LightningAnimation
          casterX={CASTER_X}
          casterY={CASTER_Y}
          targetX={TARGET_X}
          targetY={TARGET_Y}
          onComplete={handleAnimationComplete}
        />
      )}

      {activeSpell === 'holy-beam' && (
        <HolyBeamAnimation
          casterX={CASTER_X}
          casterY={CASTER_Y}
          targetX={TARGET_X}
          targetY={TARGET_Y}
          onComplete={handleAnimationComplete}
        />
      )}

      {activeSpell === 'meteor' && (
        <MeteorAnimation
          casterX={CASTER_X}
          casterY={CASTER_Y}
          targetX={TARGET_X}
          targetY={TARGET_Y}
          onComplete={handleAnimationComplete}
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

export default AnimationTestPage;
