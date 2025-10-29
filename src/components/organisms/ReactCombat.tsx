import React, { useState, useEffect } from 'react';
import { useReactGame, ReactPlayer, ReactMonster } from '../../contexts/ReactGameContext';
import { Button } from '../atoms/Button';
import VictoryModal from '../ui/VictoryModal';

interface ReactCombatProps {
  className?: string;
}

interface CombatMonster {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: {
    attack: number;
    defense: number;
    magicAttack: number;
    magicDefense: number;
    speed: number;
    accuracy: number;
  };
  type: string;
  abilities: string[];
}

const ReactCombat: React.FC<ReactCombatProps> = ({ className }) => {
  const { state, endCombat, generateCombatRewards, setCurrentScreen } = useReactGame();
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [playerTurn, setPlayerTurn] = useState(true);
  const [enemy, setEnemy] = useState<CombatMonster | null>(null);
  const [isAttacking, setIsAttacking] = useState(false);

  // Initialize combat when encounter starts
  useEffect(() => {
    if (state.currentEncounter) {
      const { species, level } = state.currentEncounter;

      // Create enemy based on encounter data
      const newEnemy: CombatMonster = {
        id: `${species}_${Date.now()}`,
        name: species.charAt(0).toUpperCase() + species.slice(1),
        level: level,
        hp: level * 20 + 50,
        maxHp: level * 20 + 50,
        mp: level * 10 + 20,
        maxMp: level * 10 + 20,
        stats: {
          attack: level * 3 + 10,
          defense: level * 2 + 8,
          magicAttack: level * 2 + 8,
          magicDefense: level * 2 + 8,
          speed: level + 5,
          accuracy: 85 + Math.min(level, 15),
        },
        type: species,
        abilities: ['basic_attack'],
      };

      setEnemy(newEnemy);
      setCombatLog([`A wild ${newEnemy.name} (Level ${newEnemy.level}) appears!`]);
      setPlayerTurn(true);
    }
  }, [state.currentEncounter]);

  const calculateDamage = (attacker: any, defender: any, isPhysical: boolean = true) => {
    const baseAttack = isPhysical ? attacker.stats.attack : attacker.stats.magicAttack;
    const defense = isPhysical ? defender.stats.defense : defender.stats.magicDefense;

    const rawDamage = Math.max(1, baseAttack - defense);
    const variance = 0.15;
    const multiplier = 1 + (Math.random() - 0.5) * 2 * variance;

    return Math.floor(rawDamage * multiplier);
  };

  const performAttack = async () => {
    if (!state.player || !enemy || isAttacking || !playerTurn) return;

    setIsAttacking(true);

    // Player attacks
    const playerDamage = calculateDamage(state.player, enemy);
    const newEnemyHp = Math.max(0, enemy.hp - playerDamage);

    setEnemy(prev => (prev ? { ...prev, hp: newEnemyHp } : null));
    setCombatLog(prev => [...prev, `You attack ${enemy.name} for ${playerDamage} damage!`]);

    // Check if enemy is defeated
    if (newEnemyHp <= 0) {
      setCombatLog(prev => [...prev, `${enemy.name} is defeated!`]);

      // Generate and apply rewards
      const rewards = generateCombatRewards(enemy.level);
      endCombat(rewards);

      setIsAttacking(false);
      return;
    }

    // Enemy attacks back
    setTimeout(() => {
      if (newEnemyHp > 0) {
        const enemyDamage = calculateDamage(enemy, state.player!);
        const newPlayerHp = Math.max(0, state.player!.hp - enemyDamage);

        setCombatLog(prev => [...prev, `${enemy.name} attacks you for ${enemyDamage} damage!`]);

        // Update player HP (this would typically go through the context)
        // For now, we'll check if player is defeated
        if (newPlayerHp <= 0) {
          setCombatLog(prev => [...prev, 'You have been defeated!']);
          setCurrentScreen('world-map');
        }
      }

      setIsAttacking(false);
      setPlayerTurn(true);
    }, 1500);

    setPlayerTurn(false);
  };

  const performMagicAttack = async () => {
    if (!state.player || !enemy || isAttacking || !playerTurn || state.player.mp < 10) return;

    setIsAttacking(true);

    // Magic attack
    const magicDamage = calculateDamage(state.player, enemy, false);
    const newEnemyHp = Math.max(0, enemy.hp - magicDamage);

    setEnemy(prev => (prev ? { ...prev, hp: newEnemyHp } : null));
    setCombatLog(prev => [...prev, `You cast a spell on ${enemy.name} for ${magicDamage} damage!`]);

    // Check if enemy is defeated
    if (newEnemyHp <= 0) {
      setCombatLog(prev => [...prev, `${enemy.name} is defeated!`]);

      const rewards = generateCombatRewards(enemy.level);
      endCombat(rewards);

      setIsAttacking(false);
      return;
    }

    // Enemy attacks back
    setTimeout(() => {
      if (newEnemyHp > 0) {
        const enemyDamage = calculateDamage(enemy, state.player!);
        setCombatLog(prev => [...prev, `${enemy.name} attacks you for ${enemyDamage} damage!`]);
      }

      setIsAttacking(false);
      setPlayerTurn(true);
    }, 1500);

    setPlayerTurn(false);
  };

  const flee = () => {
    setCombatLog(prev => [...prev, 'You flee from combat!']);
    setCurrentScreen('world-map');
  };

  if (!state.player || !state.currentEncounter || !enemy) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
          color: '#f4f4f4',
        }}
      >
        <div>No combat encounter found...</div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: 'linear-gradient(135deg, #2d1b69, #1a0e33, #0f051c)',
    color: '#f4f4f4',
    overflow: 'hidden',
  };

  const battlefieldStyle: React.CSSProperties = {
    display: 'flex',
    height: '60%',
    position: 'relative',
  };

  const playerSideStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.2))',
    border: '2px solid rgba(16, 185, 129, 0.5)',
    margin: '1rem',
    borderRadius: '12px',
    padding: '1rem',
  };

  const enemySideStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3), rgba(185, 28, 28, 0.2))',
    border: '2px solid rgba(239, 68, 68, 0.5)',
    margin: '1rem',
    borderRadius: '12px',
    padding: '1rem',
  };

  const characterStyle: React.CSSProperties = {
    fontSize: '4rem',
    marginBottom: '1rem',
    filter: isAttacking ? 'brightness(1.5)' : 'none',
    transition: 'filter 0.3s ease',
  };

  const healthBarStyle: React.CSSProperties = {
    width: '100%',
    height: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '0.5rem',
  };

  const healthFillStyle = (current: number, max: number): React.CSSProperties => ({
    width: `${(current / max) * 100}%`,
    height: '100%',
    backgroundColor: current > max * 0.6 ? '#10b981' : current > max * 0.3 ? '#f59e0b' : '#ef4444',
    transition: 'width 0.5s ease',
  });

  const combatLogStyle: React.CSSProperties = {
    height: '25%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    margin: '0 1rem',
    borderRadius: '8px',
    padding: '1rem',
    overflowY: 'auto',
    fontSize: '0.9rem',
    lineHeight: '1.4',
  };

  const actionsStyle: React.CSSProperties = {
    height: '15%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    padding: '0 1rem',
  };

  return (
    <div className={className} style={containerStyle}>
      {/* Battlefield */}
      <div style={battlefieldStyle}>
        {/* Player Side */}
        <div style={playerSideStyle}>
          <div style={characterStyle}>🛡️</div>
          <h3 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>
            {state.player.name} (Level {state.player.level})
          </h3>
          <div style={healthBarStyle}>
            <div style={healthFillStyle(state.player.hp, state.player.maxHp)}></div>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            HP: {state.player.hp}/{state.player.maxHp}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            MP: {state.player.mp}/{state.player.maxMp}
          </div>
        </div>

        {/* Enemy Side */}
        <div style={enemySideStyle}>
          <div style={characterStyle}>👹</div>
          <h3 style={{ margin: '0 0 1rem 0', color: '#ef4444' }}>
            {enemy.name} (Level {enemy.level})
          </h3>
          <div style={healthBarStyle}>
            <div style={healthFillStyle(enemy.hp, enemy.maxHp)}></div>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
            HP: {enemy.hp}/{enemy.maxHp}
          </div>
        </div>
      </div>

      {/* Combat Log */}
      <div style={combatLogStyle}>
        {combatLog.map((message, index) => (
          <div key={index} style={{ marginBottom: '0.25rem' }}>
            {message}
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={actionsStyle}>
        <Button
          variant='primary'
          size='lg'
          onClick={performAttack}
          disabled={!playerTurn || isAttacking}
          style={{ minWidth: '120px' }}
        >
          {isAttacking ? 'Attacking...' : 'Attack'}
        </Button>

        <Button
          variant='secondary'
          size='lg'
          onClick={performMagicAttack}
          disabled={!playerTurn || isAttacking || state.player.mp < 10}
          style={{ minWidth: '120px' }}
        >
          Magic ({state.player.mp}/10)
        </Button>

        <Button
          variant='danger'
          size='lg'
          onClick={flee}
          disabled={isAttacking}
          style={{ minWidth: '120px' }}
        >
          Flee
        </Button>
      </div>

      {/* Victory Modal */}
      <VictoryModal isVisible={state.showVictoryModal} onClose={() => {}} />
    </div>
  );
};

export default ReactCombat;
