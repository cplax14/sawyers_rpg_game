/**
 * Animation Showcase Component
 *
 * Interactive demonstration of all wizard spell animations.
 * Allows testing and previewing normal and critical hit variants.
 *
 * Task 7.10: Test battle scenario for all wizard animations
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AnimationController } from './animations/AnimationController';
import { getRegisteredSpells, getAnimationMetadata } from './animations/animationRegistry';
import './AnimationShowcase.css';

interface SpellDefinition {
  id: string;
  name: string;
  type: string;
  duration: number;
  category: 'offensive' | 'support';
  element?: string;
}

// All wizard spells with their metadata
const SPELLS: SpellDefinition[] = [
  { id: 'magic_bolt', name: 'Magic Bolt', type: 'Arcane Projectile', duration: 1400, category: 'offensive', element: 'arcane' },
  { id: 'fire', name: 'Fireball', type: 'Fire Projectile', duration: 950, category: 'offensive', element: 'fire' },
  { id: 'ice', name: 'Ice Shard', type: 'Ice Projectile', duration: 900, category: 'offensive', element: 'ice' },
  { id: 'thunder', name: 'Lightning', type: 'Lightning Beam', duration: 900, category: 'offensive', element: 'lightning' },
  { id: 'holy', name: 'Holy Beam', type: 'Holy Beam', duration: 1000, category: 'offensive', element: 'holy' },
  { id: 'meteor', name: 'Meteor', type: 'Fire AOE', duration: 1500, category: 'offensive', element: 'fire' },
  { id: 'heal', name: 'Heal', type: 'Restoration', duration: 1100, category: 'support', element: 'holy' },
  { id: 'protect', name: 'Protect', type: 'Defense Buff', duration: 900, category: 'support', element: 'neutral' },
  { id: 'shell', name: 'Shell', type: 'Magic Defense Buff', duration: 900, category: 'support', element: 'neutral' },
  { id: 'haste', name: 'Haste', type: 'Speed Buff', duration: 700, category: 'support', element: 'neutral' }
];

export const AnimationShowcase: React.FC = () => {
  // State
  const [currentSpell, setCurrentSpell] = useState<SpellDefinition | null>(null);
  const [isCritical, setIsCritical] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSpells, setCompletedSpells] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPlayingAll, setIsPlayingAll] = useState(false);

  // Refs
  const wizardRef = useRef<HTMLDivElement>(null);
  const enemyRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const playQueueRef = useRef<SpellDefinition[]>([]);

  // Get character positions for animations
  const getCharacterPositions = useCallback(() => {
    if (!wizardRef.current || !enemyRef.current || !stageRef.current) {
      return { casterX: 150, casterY: 250, targetX: 650, targetY: 250 };
    }

    const wizardRect = wizardRef.current.getBoundingClientRect();
    const enemyRect = enemyRef.current.getBoundingClientRect();
    const stageRect = stageRef.current.getBoundingClientRect();

    return {
      casterX: wizardRect.left + wizardRect.width / 2 - stageRect.left,
      casterY: wizardRect.top + wizardRect.height / 2 - stageRect.top,
      targetX: enemyRect.left + enemyRect.width / 2 - stageRect.left,
      targetY: enemyRect.top + enemyRect.height / 2 - stageRect.top
    };
  }, []);

  // Play animation
  const playAnimation = useCallback((spell: SpellDefinition, critical: boolean = false) => {
    if (isPlaying) return;

    console.log(`🎬 Playing ${spell.name} (${critical ? 'CRITICAL' : 'NORMAL'})`);

    setCurrentSpell(spell);
    setIsCritical(critical);
    setIsPlaying(true);
    setProgress(0);
    setElapsedTime(0);

    // Start progress tracking
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressPercent = Math.min((elapsed / spell.duration) * 100, 100);

      setElapsedTime(elapsed);
      setProgress(progressPercent);

      if (elapsed >= spell.duration) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      }
    }, 16); // ~60fps
  }, [isPlaying]);

  // Handle animation completion
  const handleAnimationComplete = useCallback(() => {
    console.log(`✅ Animation complete: ${currentSpell?.name}`);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setIsPlaying(false);
    setProgress(100);

    if (currentSpell) {
      setCompletedSpells(prev => new Set(prev).add(currentSpell.id));
    }

    // Process queue if playing all
    if (isPlayingAll && playQueueRef.current.length > 0) {
      const nextSpell = playQueueRef.current.shift()!;
      setTimeout(() => {
        playAnimation(nextSpell, isCritical);
      }, 500);
    } else if (isPlayingAll && playQueueRef.current.length === 0) {
      setIsPlayingAll(false);
      console.log('🎉 All animations complete!');
    }
  }, [currentSpell, isCritical, isPlayingAll, playAnimation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Spell selection handler
  const handleSpellClick = useCallback((spell: SpellDefinition) => {
    if (isPlaying) return;
    playAnimation(spell, isCritical);
  }, [isPlaying, isCritical, playAnimation]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (isPlaying) return;

    const currentIndex = SPELLS.findIndex(s => s.id === currentSpell?.id);
    const nextIndex = (currentIndex + 1) % SPELLS.length;
    playAnimation(SPELLS[nextIndex], isCritical);
  }, [isPlaying, currentSpell, isCritical, playAnimation]);

  const handlePrevious = useCallback(() => {
    if (isPlaying) return;

    const currentIndex = SPELLS.findIndex(s => s.id === currentSpell?.id);
    const prevIndex = currentIndex <= 0 ? SPELLS.length - 1 : currentIndex - 1;
    playAnimation(SPELLS[prevIndex], isCritical);
  }, [isPlaying, currentSpell, isCritical, playAnimation]);

  const handlePlay = useCallback(() => {
    if (isPlaying) return;

    if (currentSpell) {
      playAnimation(currentSpell, isCritical);
    } else {
      playAnimation(SPELLS[0], isCritical);
    }
  }, [isPlaying, currentSpell, isCritical, playAnimation]);

  const handlePlayAll = useCallback(() => {
    if (isPlaying) return;

    console.log('🎬 Playing all animations...');

    setCompletedSpells(new Set());
    setIsPlayingAll(true);

    // Queue all spells except the first
    playQueueRef.current = SPELLS.slice(1);

    // Start with first spell
    playAnimation(SPELLS[0], isCritical);
  }, [isPlaying, isCritical, playAnimation]);

  // Render
  const offensiveSpells = SPELLS.filter(s => s.category === 'offensive');
  const supportSpells = SPELLS.filter(s => s.category === 'support');

  const positions = getCharacterPositions();

  return (
    <div className="animation-showcase">
      <header className="showcase-header">
        <h1>Wizard Animation Showcase</h1>
        <p className="subtitle">Interactive demonstration of all wizard spell animations</p>
      </header>

      <div className="showcase-content">
        {/* Sidebar Controls */}
        <aside className="showcase-sidebar">
          <h2>Controls</h2>

          <div className="controls">
            <div className="control-group">
              <div className="btn-group">
                <button
                  className="btn btn-primary"
                  onClick={handlePlay}
                  disabled={isPlaying}
                >
                  ▶ Play
                </button>
                <button
                  className="btn btn-secondary"
                  disabled
                >
                  ⏸ Pause
                </button>
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-secondary"
                  onClick={handlePrevious}
                  disabled={isPlaying}
                >
                  ◀ Previous
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleNext}
                  disabled={isPlaying}
                >
                  Next ▶
                </button>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handlePlayAll}
                disabled={isPlaying}
              >
                ▶️ Play All Spells
              </button>
            </div>

            <div className="control-group">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isCritical}
                  onChange={(e) => setIsCritical(e.target.checked)}
                  disabled={isPlaying}
                />
                <span>Critical Hit Mode ⭐</span>
              </label>
            </div>
          </div>

          <div className="spell-list">
            <div className="spell-category">
              <h3>Offensive Spells</h3>
              {offensiveSpells.map(spell => (
                <div
                  key={spell.id}
                  className={`spell-item ${currentSpell?.id === spell.id ? 'active' : ''} ${
                    completedSpells.has(spell.id) ? 'completed' : ''
                  }`}
                  onClick={() => handleSpellClick(spell)}
                >
                  <div className="spell-info">
                    <div className="spell-name">{spell.name}</div>
                    <div className="spell-type">{spell.type}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="spell-category">
              <h3>Support Spells</h3>
              {supportSpells.map(spell => (
                <div
                  key={spell.id}
                  className={`spell-item ${currentSpell?.id === spell.id ? 'active' : ''} ${
                    completedSpells.has(spell.id) ? 'completed' : ''
                  }`}
                  onClick={() => handleSpellClick(spell)}
                >
                  <div className="spell-info">
                    <div className="spell-name">{spell.name}</div>
                    <div className="spell-type">{spell.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="instructions">
            <h4>How to Use</h4>
            <ul>
              <li>Click a spell to preview it</li>
              <li>Use Play All to see sequence</li>
              <li>Toggle Critical Hit for enhanced visuals</li>
              <li>Navigation buttons control playback</li>
            </ul>
          </div>
        </aside>

        {/* Main Battle Stage */}
        <main className="battle-stage">
          <div className="stage-info">
            <h3>
              {currentSpell
                ? `${currentSpell.name} ${isCritical ? '⭐ CRITICAL HIT' : ''}`
                : 'Select a spell to begin'}
            </h3>
            <div className="animation-status">
              <span className={`status-badge ${isPlaying ? 'status-playing' : 'status-idle'}`}>
                {isPlaying ? 'Playing...' : progress === 100 ? 'Complete' : 'Idle'}
              </span>
              {isCritical && (
                <span className="status-badge status-critical">Critical Hit ⭐</span>
              )}
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="progress-text">
                {elapsedTime}ms / {currentSpell?.duration || 0}ms
              </span>
            </div>
          </div>

          <div className="battle-arena" ref={stageRef}>
            <div className="character wizard" ref={wizardRef}>
              🧙‍♂️
              <span className="character-label">Wizard</span>
            </div>

            <div className="character enemy" ref={enemyRef}>
              👹
              <span className="character-label">Enemy</span>
            </div>

            {/* Animation Stage */}
            {isPlaying && currentSpell && (
              <AnimationController
                attackType={currentSpell.id}
                attackData={{
                  casterX: positions.casterX,
                  casterY: positions.casterY,
                  targetX: positions.targetX,
                  targetY: positions.targetY,
                  damage: isCritical ? 999 : 100,
                  isCritical: isCritical,
                  element: currentSpell.element
                }}
                onComplete={handleAnimationComplete}
                isActive={isPlaying}
              />
            )}
          </div>
        </main>
      </div>

      <footer className="showcase-footer">
        <p>Sawyer's RPG Game - Animation System Demo | Built with React + TypeScript</p>
      </footer>
    </div>
  );
};

export default AnimationShowcase;
