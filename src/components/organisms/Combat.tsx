import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../atoms/Button';
import { LoadingSpinner } from '../atoms/LoadingSpinner';
import { useReactGame } from '../../contexts/ReactGameContext';
import { useIsMobile } from '../../hooks';
import { useCreatures } from '../../hooks/useCreatures';
import { ReactMonster, ReactPlayer } from '../../types/game';
import { EnhancedCreature } from '../../types/creatures';
import { MagicBoltAnimation } from '../combat/animations';

interface CombatProps {
  className?: string;
}

interface CombatState {
  phase: 'intro' | 'player-turn' | 'enemy-turn' | 'victory' | 'defeat' | 'fled' | 'captured';
  turn: number;
  playerHp: number;
  enemyHp: number;
  playerMp: number;
  battleLog: BattleLogEntry[];
  isAnimating: boolean;
  actionMode: 'main' | 'magic' | 'items' | 'companions';
}

interface BattleLogEntry {
  id: string;
  message: string;
  type: 'action' | 'damage' | 'heal' | 'status' | 'system';
  timestamp: number;
}

interface CombatAction {
  id: string;
  name: string;
  type: 'attack' | 'magic' | 'item' | 'capture' | 'flee';
  mpCost?: number;
  damage?: number;
  accuracy?: number;
  description: string;
  icon: string;
}

export const Combat: React.FC<CombatProps> = ({
  className
}) => {
  const { state, endCombat, setCurrentScreen, addExperience: addExp, addGold: addPlayerGold, generateCombatRewards, updateStoryFlags, captureMonster } = useReactGame();
  const isMobile = useIsMobile();

  const player = state.player;
  const playerLevel = player?.level || 1;
  const inventory = state.inventory || [];
  const currentEncounter = state.currentEncounter;
  const creaturesHook = useCreatures();
  const activeTeam = creaturesHook?.activeTeam || [];

  const enemyTurnExecutingRef = useRef(false);
  const battleEndedRef = useRef(false);
  const playerElementRef = useRef<HTMLDivElement>(null);
  const enemyElementRef = useRef<HTMLDivElement>(null);

  // Generate enemy monster
  const enemy = useMemo(() => {
    if (!currentEncounter) return null;

    // Make starting encounters much easier for new players
    const isEarlyGame = currentEncounter.level <= 2;
    const hpMultiplier = isEarlyGame ? 0.6 : 1.0; // 60% HP for early encounters
    const attackMultiplier = isEarlyGame ? 0.7 : 1.0; // 70% damage for early encounters

    return {
      id: `enemy_${Date.now()}`,
      name: currentEncounter.species.replace(/_/g, ' '),
      species: currentEncounter.species,
      level: currentEncounter.level,
      hp: Math.floor((25 + (currentEncounter.level * 8)) * hpMultiplier), // Reduced from 50 + level*10
      maxHp: Math.floor((25 + (currentEncounter.level * 8)) * hpMultiplier),
      mp: 15 + (currentEncounter.level * 3),
      maxMp: 15 + (currentEncounter.level * 3),
      baseStats: {
        attack: Math.floor((6 + currentEncounter.level * 1.5) * attackMultiplier), // Reduced from 8 + level*2
        defense: 3 + Math.floor(currentEncounter.level * 0.8), // Reduced from 5 + level
        magicAttack: Math.floor((5 + currentEncounter.level * 1.2) * attackMultiplier),
        magicDefense: 2 + Math.floor(currentEncounter.level * 0.7),
        speed: 5 + currentEncounter.level,
        accuracy: 75 // Reduced from 85
      },
      currentStats: {
        attack: Math.floor((6 + currentEncounter.level * 1.5) * attackMultiplier),
        defense: 3 + Math.floor(currentEncounter.level * 0.8),
        magicAttack: Math.floor((5 + currentEncounter.level * 1.2) * attackMultiplier),
        magicDefense: 2 + Math.floor(currentEncounter.level * 0.7),
        speed: 5 + currentEncounter.level,
        accuracy: 75
      },
      types: [currentEncounter.species.includes('fire') ? 'fire' : 'normal'],
      rarity: 'common' as const,
      abilities: ['tackle', 'growl'],
      captureRate: 45, // Increased from 30 for easier captures
      experience: currentEncounter.level * 12, // Slightly reduced
      gold: currentEncounter.level * 6, // Slightly reduced
      drops: [],
      areas: [],
      evolvesTo: [],
      isWild: true,
      friendship: 0
    };
  }, [currentEncounter]);

  const [combatState, setCombatState] = useState<CombatState>({
    phase: 'player-turn', // Start with player turn instead of intro
    turn: 1,
    playerHp: player?.hp || 100,
    enemyHp: enemy?.hp || 50,
    playerMp: player?.mp || 50,
    battleLog: [{
      id: 'battle_start',
      message: `Battle begins! ${enemy?.name || 'Wild monster'} appears!`,
      type: 'system',
      timestamp: Date.now()
    }],
    isAnimating: false,
    actionMode: 'main'
  });

  const [activeAnimation, setActiveAnimation] = useState<{
    type: 'magic-bolt';
    damage: number;
    isCritical: boolean;
    element: 'arcane' | 'fire' | 'ice' | 'lightning';
  } | null>(null);

  // Reset battle ended flag when new combat starts
  useEffect(() => {
    if (currentEncounter) {
      // Only reset when we have a new encounter (new combat starting)
      battleEndedRef.current = false;
      enemyTurnExecutingRef.current = false;
    }
  }, [currentEncounter]);

  // Calculate player weapon damage
  const getPlayerWeaponDamage = useCallback(() => {
    if (!player) return 8; // Increased base damage for no player

    // Check if player has equipped weapon
    const equippedWeaponId = player.equipment?.weapon;
    if (equippedWeaponId) {
      const weapon = inventory.find(item => item.id === equippedWeaponId);
      if (weapon && weapon.stats?.attack) {
        return player.baseStats.attack + weapon.stats.attack;
      }
    }

    // Use base attack stat (fighting with hands) + early game bonus
    const baseAttack = player.baseStats.attack || 10;
    const earlyGameBonus = player.level <= 3 ? 4 : 0; // +4 damage for levels 1-3
    return baseAttack + earlyGameBonus;
  }, [player, inventory]);

  // Get available spells for the player
  const getPlayerSpells = useCallback(() => {
    const spells = [
      {
        id: 'magic_bolt',
        name: 'Magic Bolt',
        mpCost: 8,
        damage: (player?.baseStats.magicAttack || 10) + (player && player.level <= 3 ? 6 : 0), // +6 magic damage for early levels
        type: 'offensive' as const,
        element: 'arcane',
        description: 'A magical energy attack'
      },
      {
        id: 'heal',
        name: 'Heal',
        mpCost: 12,
        healing: 20 + (player?.baseStats.magicAttack || 10) * 0.5,
        type: 'defensive' as const,
        description: 'Restore HP'
      },
      {
        id: 'shield',
        name: 'Shield',
        mpCost: 10,
        defenseBoost: 5,
        type: 'defensive' as const,
        description: 'Temporarily increase defense'
      }
    ];

    // Filter spells based on player class or level
    return spells.filter(spell => {
      if (spell.id === 'heal' && combatState.playerMp < spell.mpCost) return false;
      if (spell.id === 'magic_bolt' && combatState.playerMp < spell.mpCost) return false;
      if (spell.id === 'shield' && combatState.playerMp < spell.mpCost) return false;
      return true;
    });
  }, [player, combatState.playerMp]);

  // Get usable items in combat
  const getCombatItems = useCallback(() => {
    return inventory.filter(item => {
      // Only allow consumable items in combat
      if (item.type !== 'consumable') return false;

      // Check if item has combat-useful effects
      if (item.effects) {
        return item.effects.some(effect =>
          ['heal', 'restore', 'buff'].includes(effect.type)
        );
      }

      return false;
    });
  }, [inventory]);

  // Calculate animation positions from DOM elements
  const getAnimationPositions = useCallback(() => {
    const playerEl = playerElementRef.current;
    const enemyEl = enemyElementRef.current;

    // Fallback positions if refs aren't ready
    if (!playerEl || !enemyEl) {
      return {
        casterPosition: { x: 200, y: 400 },
        targetPosition: { x: 600, y: 250 }
      };
    }

    const playerRect = playerEl.getBoundingClientRect();
    const enemyRect = enemyEl.getBoundingClientRect();

    return {
      casterPosition: {
        x: playerRect.left + playerRect.width / 2,
        y: playerRect.top + playerRect.height / 2
      },
      targetPosition: {
        x: enemyRect.left + enemyRect.width / 2,
        y: enemyRect.top + enemyRect.height / 2
      }
    };
  }, []);

  const addBattleLog = useCallback((message: string, type: BattleLogEntry['type'] = 'action') => {
    setCombatState(prev => ({
      ...prev,
      battleLog: [...prev.battleLog, {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Unique ID with timestamp and random string
        message,
        type,
        timestamp: Date.now()
      }].slice(-10) // Keep last 10 entries
    }));
  }, []);

  const calculateDamage = useCallback((baseDamage: number, attackerLevel: number, defenderDefense: number): number => {
    const levelMultiplier = 1 + (attackerLevel - 1) * 0.1;
    const defenseReduction = Math.max(0.1, 1 - (defenderDefense * 0.02));
    const variance = 0.85 + Math.random() * 0.3; // 85% - 115% variance

    return Math.max(1, Math.floor(baseDamage * levelMultiplier * defenseReduction * variance));
  }, []);

  // Execute Attack Action
  const executeAttack = useCallback(async () => {
    if (combatState.isAnimating || combatState.phase !== 'player-turn') return;

    setCombatState(prev => ({ ...prev, isAnimating: true }));

    const weaponDamage = getPlayerWeaponDamage();
    const accuracy = 90 + (player?.baseStats.accuracy || 85) - 85; // Base 90% + accuracy bonus
    const accuracyRoll = Math.random() * 100;

    if (accuracyRoll <= accuracy) {
      // Calculate damage with variance
      const baseDamage = weaponDamage + Math.floor(Math.random() * 6) - 2; // +/- 2 variance
      const damage = calculateDamage(baseDamage, playerLevel, enemy?.currentStats.defense || 5);

      const weaponName = player?.equipment?.weapon ?
        inventory.find(item => item.id === player.equipment.weapon)?.name || 'weapon' :
        'fists';

      addBattleLog(`You attack with ${weaponName} for ${damage} damage!`, 'action');

      setCombatState(prev => ({
        ...prev,
        enemyHp: Math.max(0, prev.enemyHp - damage),
        phase: prev.enemyHp - damage <= 0 ? 'victory' : 'enemy-turn'
      }));
    } else {
      addBattleLog('Your attack missed!', 'action');
      setCombatState(prev => ({ ...prev, phase: 'enemy-turn' }));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setCombatState(prev => ({ ...prev, isAnimating: false }));
  }, [combatState, addBattleLog, calculateDamage, playerLevel, enemy, getPlayerWeaponDamage, player, inventory]);

  // Execute Magic Action
  const executeMagic = useCallback(async (spell: any) => {
    if (combatState.isAnimating || combatState.phase !== 'player-turn') return;

    setCombatState(prev => ({ ...prev, isAnimating: true }));

    // Check MP cost
    if (combatState.playerMp < spell.mpCost) {
      addBattleLog('Not enough MP!', 'system');
      setCombatState(prev => ({ ...prev, isAnimating: false }));
      return;
    }

    if (spell.type === 'offensive') {
      // Calculate accuracy
      const accuracy = 85 + (player?.baseStats.accuracy || 85) - 85;
      const accuracyRoll = Math.random() * 100;

      if (accuracyRoll <= accuracy) {
        // Calculate damage with variance
        const baseDamage = spell.damage + Math.floor(Math.random() * 8);
        const normalDamage = calculateDamage(baseDamage, playerLevel, enemy?.currentStats.magicDefense || 3);

        // Critical hit chance (15%)
        const isCritical = Math.random() < 0.15;
        const damage = isCritical ? Math.floor(normalDamage * 1.5) : normalDamage;

        // Trigger animation with proper positions
        setActiveAnimation({
          type: 'magic-bolt',
          damage,
          isCritical,
          element: spell.element || 'arcane'
        });

        // Wait for animation to complete (1400ms total)
        await new Promise(resolve => setTimeout(resolve, 1400));

        // Add battle log AFTER animation
        addBattleLog(
          `You cast ${spell.name} for ${damage} magic damage!${isCritical ? ' CRITICAL HIT!' : ''}`,
          'action'
        );

        // Apply damage and update state
        setCombatState(prev => ({
          ...prev,
          enemyHp: Math.max(0, prev.enemyHp - damage),
          playerMp: Math.max(0, prev.playerMp - spell.mpCost),
          phase: prev.enemyHp - damage <= 0 ? 'victory' : 'enemy-turn'
        }));

        // Clear animation
        setActiveAnimation(null);
      } else {
        // Spell missed
        addBattleLog(`${spell.name} missed!`, 'action');
        setCombatState(prev => ({
          ...prev,
          playerMp: Math.max(0, prev.playerMp - spell.mpCost),
          phase: 'enemy-turn'
        }));
      }
    } else {
      // Defensive spells (heal, shield) - no animation changes
      if (spell.id === 'heal') {
        const healAmount = Math.min(spell.healing, (player?.maxHp || 100) - combatState.playerHp);
        addBattleLog(`You cast ${spell.name} and recover ${Math.floor(healAmount)} HP!`, 'heal');

        setCombatState(prev => ({
          ...prev,
          playerHp: Math.min(player?.maxHp || 100, prev.playerHp + healAmount),
          playerMp: Math.max(0, prev.playerMp - spell.mpCost),
          phase: 'enemy-turn'
        }));
      } else if (spell.id === 'shield') {
        addBattleLog(`You cast ${spell.name}! Defense temporarily increased!`, 'action');

        setCombatState(prev => ({
          ...prev,
          playerMp: Math.max(0, prev.playerMp - spell.mpCost),
          phase: 'enemy-turn'
        }));
      }
    }

    await new Promise(resolve => setTimeout(resolve, 500));
    setCombatState(prev => ({ ...prev, isAnimating: false }));
  }, [combatState, addBattleLog, calculateDamage, playerLevel, enemy, player, getAnimationPositions]);

  // Execute Item Usage
  const executeItemUse = useCallback(async (item: any) => {
    if (combatState.isAnimating || combatState.phase !== 'player-turn') return;

    setCombatState(prev => ({ ...prev, isAnimating: true }));

    // TODO: Use the item through the inventory system
    // useItem(item.id);

    // Apply item effects
    if (item.effects) {
      for (const effect of item.effects) {
        if (effect.type === 'heal') {
          const healAmount = Math.min(effect.value, (player?.maxHp || 100) - combatState.playerHp);
          addBattleLog(`You used ${item.name} and recovered ${healAmount} HP!`, 'heal');

          setCombatState(prev => ({
            ...prev,
            playerHp: Math.min(player?.maxHp || 100, prev.playerHp + healAmount)
          }));
        } else if (effect.type === 'restore') {
          const restoreAmount = Math.min(effect.value, (player?.maxMp || 50) - combatState.playerMp);
          addBattleLog(`You used ${item.name} and recovered ${restoreAmount} MP!`, 'heal');

          setCombatState(prev => ({
            ...prev,
            playerMp: Math.min(player?.maxMp || 50, prev.playerMp + restoreAmount)
          }));
        }
      }
    } else {
      addBattleLog(`You used ${item.name}!`, 'action');
    }

    setCombatState(prev => ({ ...prev, phase: 'enemy-turn' }));

    await new Promise(resolve => setTimeout(resolve, 1000));
    setCombatState(prev => ({ ...prev, isAnimating: false }));
  }, [combatState, addBattleLog, player]);

  // Execute Capture Action
  const executeCapture = useCallback(async () => {
    if (combatState.isAnimating || combatState.phase !== 'player-turn') return;

    setCombatState(prev => ({ ...prev, isAnimating: true }));

    // Calculate capture chance based on multiple factors
    const baseCapture = enemy?.captureRate || 30;
    const healthFactor = (1 - (combatState.enemyHp / (enemy?.maxHp || 1))) * 40; // Up to 40% bonus for low HP
    const levelDifference = Math.max(0, playerLevel - (enemy?.level || 1)) * 5; // 5% per level advantage
    const finalCaptureChance = Math.min(95, baseCapture + healthFactor + levelDifference);

    const captureRoll = Math.random() * 100;

    addBattleLog(`Capture chance: ${Math.floor(finalCaptureChance)}%`, 'system');

    if (captureRoll <= finalCaptureChance) {
      addBattleLog(`Successfully captured ${enemy?.name}!`, 'system');

      // Add monster to player's collection
      if (enemy) {
        try {
          captureMonster(enemy);
        } catch (error) {
          console.error('Failed to capture monster:', error);
          addBattleLog('Capture failed due to an error!', 'system');
        }
      }

      setCombatState(prev => ({ ...prev, phase: 'captured' }));
    } else {
      addBattleLog('Capture failed! The monster broke free!', 'system');
      setCombatState(prev => ({ ...prev, phase: 'enemy-turn' }));
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    setCombatState(prev => ({ ...prev, isAnimating: false }));
  }, [combatState, addBattleLog, enemy, playerLevel, captureMonster]);

  // Execute Flee Action
  const executeFlee = useCallback(async () => {
    if (combatState.isAnimating || combatState.phase !== 'player-turn') return;

    setCombatState(prev => ({ ...prev, isAnimating: true }));

    // Calculate flee chance based on speed and level difference
    const playerSpeed = player?.baseStats.speed || 10;
    const enemySpeed = enemy?.currentStats.speed || 10;
    const speedAdvantage = Math.max(0, playerSpeed - enemySpeed) * 3; // 3% per speed point advantage
    const levelPenalty = Math.max(0, (enemy?.level || 1) - playerLevel) * 5; // 5% penalty per enemy level advantage
    const baseFlee = 75;

    const fleeChance = Math.max(25, Math.min(95, baseFlee + speedAdvantage - levelPenalty));
    const fleeRoll = Math.random() * 100;

    addBattleLog(`Escape chance: ${Math.floor(fleeChance)}%`, 'system');

    if (fleeRoll <= fleeChance) {
      addBattleLog('Successfully fled from battle!', 'system');
      setCombatState(prev => ({ ...prev, phase: 'fled' }));
    } else {
      addBattleLog('Could not escape!', 'system');
      setCombatState(prev => ({ ...prev, phase: 'enemy-turn' }));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setCombatState(prev => ({ ...prev, isAnimating: false }));
  }, [combatState, addBattleLog, enemy, playerLevel, player]);

  // Execute Companion Action
  const executeCompanionAction = useCallback(async (creature: EnhancedCreature) => {
    if (combatState.isAnimating || combatState.phase !== 'player-turn') return;

    setCombatState(prev => ({ ...prev, isAnimating: true }));

    // Calculate companion damage with creature stats
    const companionAttack = creature.currentStats?.attack || creature.baseStats?.attack || 10;
    const companionLevel = creature.level || 1;
    const accuracy = 85 + (creature.currentStats?.accuracy || creature.baseStats?.accuracy || 85) - 85;
    const accuracyRoll = Math.random() * 100;

    if (accuracyRoll <= accuracy) {
      // Calculate damage with variance
      const baseDamage = companionAttack + Math.floor(Math.random() * 6) - 2;
      const damage = calculateDamage(baseDamage, companionLevel, enemy?.currentStats.defense || 5);

      addBattleLog(`${creature.name} attacks for ${damage} damage!`, 'action');

      setCombatState(prev => ({
        ...prev,
        enemyHp: Math.max(0, prev.enemyHp - damage),
        phase: prev.enemyHp - damage <= 0 ? 'victory' : 'enemy-turn'
      }));
    } else {
      addBattleLog(`${creature.name}'s attack missed!`, 'action');
      setCombatState(prev => ({ ...prev, phase: 'enemy-turn' }));
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
    setCombatState(prev => ({ ...prev, isAnimating: false }));
  }, [combatState, addBattleLog, calculateDamage, enemy]);

  const executeEnemyTurn = useCallback(async () => {
    if (!enemy || enemyTurnExecutingRef.current) return;

    enemyTurnExecutingRef.current = true;
    setCombatState(prev => ({ ...prev, isAnimating: true }));
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple AI: mostly attack, sometimes special move
    const aiChoice = Math.random();
    let damage = 0;

    if (aiChoice < 0.8) {
      // Basic attack
      damage = calculateDamage(
        enemy.currentStats.attack,
        enemy.level,
        player?.baseStats.defense || 10
      );
      addBattleLog(`${enemy.name} attacks for ${damage} damage!`, 'action');
    } else {
      // Special ability
      damage = calculateDamage(
        enemy.currentStats.magicAttack * 1.2,
        enemy.level,
        player?.baseStats.magicDefense || 8
      );
      addBattleLog(`${enemy.name} uses special attack for ${damage} damage!`, 'action');
    }

    setCombatState(prev => ({
      ...prev,
      playerHp: Math.max(0, prev.playerHp - damage),
      turn: prev.turn + 1,
      phase: prev.playerHp - damage <= 0 ? 'defeat' : 'player-turn',
      isAnimating: false
    }));

    enemyTurnExecutingRef.current = false;
  }, [enemy, calculateDamage, player, addBattleLog]);

  // Auto-execute enemy turn
  useEffect(() => {
    if (combatState.phase === 'enemy-turn' && !combatState.isAnimating) {
      const timer = setTimeout(executeEnemyTurn, 1500);
      return () => clearTimeout(timer);
    }
  }, [combatState.phase, combatState.isAnimating, executeEnemyTurn]);

  // Handle battle end
  const handleBattleEnd = useCallback((result: 'victory' | 'defeat' | 'fled' | 'captured') => {
    if (battleEndedRef.current) {
      return;
    }

    // Don't process if victory modal is already showing (indicates battle already ended)
    if (state.showVictoryModal) {
      return;
    }

    battleEndedRef.current = true;

    if (result === 'victory' || result === 'captured') {
      // Capture rewards before enemy/encounter might become null
      const rewardEnemy = enemy || (currentEncounter ? {
        experience: currentEncounter.level * 12,
        gold: currentEncounter.level * 6,
        name: currentEncounter.species.replace(/_/g, ' '),
        level: currentEncounter.level
      } : null);

      const expGained = rewardEnemy?.experience || 0;
      const goldGained = rewardEnemy?.gold || 0;

      // Don't process if rewards would be zero (indicates stale call)
      if (expGained === 0 && goldGained === 0 && (result === 'victory' || result === 'captured')) {
        battleEndedRef.current = false; // Reset for valid call
        return;
      }

      // Add experience and gold through ReactGameContext
      if (player) {
        console.log('🎯 Combat: Attempting to add exp/gold:', {
          playerId: player.id || 'no-id',
          playerName: player.name,
          expGained,
          goldGained,
          hasId: !!player.id
        });

        // Try with or without ID - check what the functions actually expect
        if (player.id) {
          addExp(player.id, expGained);
          addPlayerGold(player.id, goldGained);
        } else {
          // Fallback: try with player name or just call without ID
          addExp(player.name || 'player', expGained);
          addPlayerGold(player.name || 'player', goldGained);
        }
      }

      // Generate rewards to show in battle log
      const rewardItems = generateCombatRewards(enemy?.species || 'unknown', enemy?.level || 1).items;
      let battleMessage = '';

      // Special message for captures
      if (result === 'captured') {
        battleMessage = `🎉 Successfully captured ${enemy?.name || 'monster'}! Added to your collection. `;
      }

      battleMessage += `Gained ${expGained} experience and ${goldGained} gold!`;
      if (rewardItems.length > 0) {
        const itemNames = rewardItems.map(item => item.name).join(', ');
        battleMessage += ` Found: ${itemNames}`;
      }
      addBattleLog(battleMessage, 'system');

      // Set story flag for first monster encounter (unlocks Grassy Plains)
      if (!state.storyFlags?.first_monster_encounter) {
        updateStoryFlags({ first_monster_encounter: true });
        console.log('🎯 Story Flag Set: first_monster_encounter (unlocks Grassy Plains)');
      }

      // End combat with proper payload to trigger victory modal
      endCombat({
        experience: expGained,
        gold: goldGained,
        items: rewardItems,
        capturedMonsterId: result === 'captured' ? enemy?.id : undefined
      });
    } else {
      // For defeat and fled - end combat without rewards
      endCombat({
        experience: 0,
        gold: 0,
        items: []
      });
    }

    // Screen navigation is handled by ReactGameContext after victory modal
  }, [enemy, addExp, addPlayerGold, addBattleLog, endCombat, currentEncounter, state.showVictoryModal, state.storyFlags, updateStoryFlags, captureMonster, generateCombatRewards]);

  // Auto-handle battle end states
  useEffect(() => {
    if (['victory', 'defeat', 'fled', 'captured'].includes(combatState.phase) && !battleEndedRef.current) {
      // Add a small delay to ensure state is stable
      const timer = setTimeout(() => {
        handleBattleEnd(combatState.phase as any);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [combatState.phase]); // Removed handleBattleEnd from deps to prevent re-runs

  if (!enemy) {
    return (
      <div className={`combat ${className || ''}`}
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
          color: '#f4f4f4'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2>No Enemy Found</h2>
          <Button variant="primary" onClick={() => setCurrentScreen('area')}>
            Back to Area
          </Button>
        </div>
      </div>
    );
  }

  const playerHpPercent = (combatState.playerHp / (player?.maxHp || 100)) * 100;
  const enemyHpPercent = (combatState.enemyHp / enemy.maxHp) * 100;
  const playerMpPercent = (combatState.playerMp / (player?.maxMp || 50)) * 100;


  return (
    <div
      className={`combat ${className || ''}`}
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #2d1b2e, #4a0e4e, #1a1a2e)',
        color: '#f4f4f4',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '1rem 2rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}
      >
        <h1 style={{ margin: 0, color: '#ff6b6b', fontSize: '2rem' }}>
          Battle! Turn {combatState.turn}
        </h1>
        <p style={{ margin: '0.5rem 0 0', opacity: 0.8 }}>
          {combatState.phase === 'player-turn' ? 'Your Turn' :
           combatState.phase === 'enemy-turn' ? 'Enemy Turn' :
           combatState.phase === 'victory' ? 'Victory!' :
           combatState.phase === 'defeat' ? 'Defeat!' :
           combatState.phase === 'fled' ? 'Fled!' :
           combatState.phase === 'captured' ? 'Captured!' : 'Battle Start'}
        </p>
      </motion.div>

      {/* Battle Arena */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        position: 'relative',
        padding: '1rem',
        gap: '1rem'
      }}>
        {/* Player Side */}
        <motion.div
          ref={playerElementRef}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0, 100, 200, 0.1)',
            borderRadius: '16px',
            padding: '2rem',
            border: '2px solid rgba(0, 150, 255, 0.3)'
          }}
        >
          <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>🤺</div>
          <h2 style={{ margin: '0 0 1rem', color: '#4fc3f7' }}>{player?.name || 'Player'}</h2>
          <div style={{ width: '100%', maxWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>HP</span>
              <span>{combatState.playerHp}/{player?.maxHp || 100}</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <motion.div
                animate={{ width: `${playerHpPercent}%` }}
                style={{
                  height: '100%',
                  background: playerHpPercent > 50 ? '#4caf50' : playerHpPercent > 25 ? '#ff9800' : '#f44336',
                  borderRadius: '4px'
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '0.5rem 0' }}>
              <span>MP</span>
              <span>{combatState.playerMp}/{player?.maxMp || 50}</span>
            </div>
            <div style={{
              width: '100%',
              height: '6px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <motion.div
                animate={{ width: `${playerMpPercent}%` }}
                style={{
                  height: '100%',
                  background: '#2196f3',
                  borderRadius: '3px'
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* VS Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isMobile ? '2rem' : '3rem',
          color: '#ffd700',
          textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
        }}>
          ⚡VS⚡
        </div>

        {/* Enemy Side */}
        <motion.div
          ref={enemyElementRef}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(200, 0, 50, 0.1)',
            borderRadius: '16px',
            padding: '2rem',
            border: '2px solid rgba(255, 50, 100, 0.3)'
          }}
        >
          <motion.div
            animate={combatState.isAnimating && combatState.phase === 'enemy-turn' ?
              { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] } :
              { scale: 1, rotate: 0 }}
            style={{ fontSize: '6rem', marginBottom: '1rem' }}
          >
            🐺
          </motion.div>
          <h2 style={{ margin: '0 0 1rem', color: '#ff6b6b' }}>
            {enemy.name} (Lv.{enemy.level})
          </h2>
          <div style={{ width: '100%', maxWidth: '200px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>HP</span>
              <span>{combatState.enemyHp}/{enemy.maxHp}</span>
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <motion.div
                animate={{ width: `${enemyHpPercent}%` }}
                style={{
                  height: '100%',
                  background: enemyHpPercent > 50 ? '#4caf50' : enemyHpPercent > 25 ? '#ff9800' : '#f44336',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Battle Actions */}
      <AnimatePresence>
        {combatState.phase === 'player-turn' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            {combatState.actionMode === 'main' && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)',
                  gap: '0.5rem',
                  maxWidth: '900px',
                  margin: '0 auto'
                }}>
                  {/* Attack */}
                  <Button
                    variant="danger"
                    size="md"
                    disabled={combatState.isAnimating}
                    onClick={executeAttack}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.75rem',
                      minHeight: '80px'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>⚔️</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Attack</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      {player?.equipment?.weapon ? 'Weapon' : 'Fists'}
                    </span>
                  </Button>

                  {/* Magic */}
                  <Button
                    variant="primary"
                    size="md"
                    disabled={combatState.isAnimating || combatState.playerMp < 8}
                    onClick={() => setCombatState(prev => ({ ...prev, actionMode: 'magic' }))}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.75rem',
                      minHeight: '80px',
                      opacity: combatState.playerMp < 8 ? 0.5 : 1
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>✨</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Magic</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Spells</span>
                  </Button>

                  {/* Items */}
                  <Button
                    variant="primary"
                    size="md"
                    disabled={combatState.isAnimating || getCombatItems().length === 0}
                    onClick={() => setCombatState(prev => ({ ...prev, actionMode: 'items' }))}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.75rem',
                      minHeight: '80px',
                      opacity: getCombatItems().length === 0 ? 0.5 : 1
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🎒</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Items</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      {getCombatItems().length} available
                    </span>
                  </Button>

                  {/* Companions */}
                  <Button
                    variant="primary"
                    size="md"
                    disabled={combatState.isAnimating || !activeTeam || activeTeam.length === 0}
                    onClick={() => setCombatState(prev => ({ ...prev, actionMode: 'companions' }))}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.75rem',
                      minHeight: '80px',
                      opacity: (!activeTeam || activeTeam.length === 0) ? 0.5 : 1
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🐾</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Companions</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      {activeTeam?.length || 0} ready
                    </span>
                  </Button>

                  {/* Capture */}
                  <Button
                    variant="success"
                    size="md"
                    disabled={combatState.isAnimating}
                    onClick={executeCapture}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.75rem',
                      minHeight: '80px'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🎯</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Capture</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                      {Math.min(95, (enemy?.captureRate || 30) + (100 - combatState.enemyHp * 100 / (enemy?.maxHp || 1)) * 0.4)}%
                    </span>
                  </Button>

                  {/* Flee */}
                  <Button
                    variant="secondary"
                    size="md"
                    disabled={combatState.isAnimating}
                    onClick={executeFlee}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.75rem',
                      minHeight: '80px'
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🏃</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Flee</span>
                    <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>Escape</span>
                  </Button>
                </div>
                <p style={{
                  textAlign: 'center',
                  margin: '0.5rem 0 0',
                  fontSize: '0.9rem',
                  opacity: 0.7
                }}>
                  Choose your action
                </p>
              </>
            )}

            {/* Magic Menu */}
            {combatState.actionMode === 'magic' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCombatState(prev => ({ ...prev, actionMode: 'main' }))}
                  >
                    ← Back
                  </Button>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  {getPlayerSpells().map((spell) => (
                    <Button
                      key={spell.id}
                      variant={spell.type === 'offensive' ? 'danger' : 'success'}
                      size="md"
                      disabled={combatState.isAnimating}
                      onClick={() => {
                        executeMagic(spell);
                        setCombatState(prev => ({ ...prev, actionMode: 'main' }));
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.75rem',
                        minHeight: '80px'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>
                        {spell.type === 'offensive' ? '💥' : '💚'}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{spell.name}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                        {spell.mpCost} MP
                      </span>
                    </Button>
                  ))}
                </div>
                <p style={{
                  textAlign: 'center',
                  margin: '0.5rem 0 0',
                  fontSize: '0.9rem',
                  opacity: 0.7
                }}>
                  Select a spell
                </p>
              </>
            )}

            {/* Items Menu */}
            {combatState.actionMode === 'items' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCombatState(prev => ({ ...prev, actionMode: 'main' }))}
                  >
                    ← Back
                  </Button>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  {getCombatItems().map((item) => (
                    <Button
                      key={item.id}
                      variant="secondary"
                      size="md"
                      disabled={combatState.isAnimating}
                      onClick={() => {
                        executeItemUse(item);
                        setCombatState(prev => ({ ...prev, actionMode: 'main' }));
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.75rem',
                        minHeight: '80px'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{item.name}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                        x{item.quantity}
                      </span>
                    </Button>
                  ))}
                  {getCombatItems().length === 0 && (
                    <div style={{
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      padding: '2rem',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      No usable items in combat
                    </div>
                  )}
                </div>
                <p style={{
                  textAlign: 'center',
                  margin: '0.5rem 0 0',
                  fontSize: '0.9rem',
                  opacity: 0.7
                }}>
                  Select an item to use
                </p>
              </>
            )}

            {/* Companions Menu */}
            {combatState.actionMode === 'companions' && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCombatState(prev => ({ ...prev, actionMode: 'main' }))}
                  >
                    ← Back
                  </Button>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: '0.5rem',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  {activeTeam?.map((creature) => (
                    <Button
                      key={creature.id}
                      variant="primary"
                      size="md"
                      disabled={combatState.isAnimating}
                      onClick={() => {
                        executeCompanionAction(creature);
                        setCombatState(prev => ({ ...prev, actionMode: 'main' }));
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.75rem',
                        minHeight: '80px'
                      }}
                    >
                      <span style={{ fontSize: '1.5rem' }}>
                        {creature.types?.[0] === 'fire' ? '🔥' :
                         creature.types?.[0] === 'water' ? '💧' :
                         creature.types?.[0] === 'earth' ? '🌍' :
                         creature.types?.[0] === 'air' ? '💨' : '⚡'}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{creature.name}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                        Lv.{creature.level}
                      </span>
                    </Button>
                  )) || []}
                  {(!activeTeam || activeTeam.length === 0) && (
                    <div style={{
                      gridColumn: '1 / -1',
                      textAlign: 'center',
                      padding: '2rem',
                      color: 'rgba(255, 255, 255, 0.6)'
                    }}>
                      No companions in your active team
                    </div>
                  )}
                </div>
                <p style={{
                  textAlign: 'center',
                  margin: '0.5rem 0 0',
                  fontSize: '0.9rem',
                  opacity: 0.7
                }}>
                  Select a companion to attack
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battle Log */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          padding: '1rem',
          maxHeight: '150px',
          overflowY: 'auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#ffd700' }}>Battle Log</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {combatState.battleLog.slice(-5).map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                fontSize: '0.9rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                background: entry.type === 'damage' ? 'rgba(255, 0, 0, 0.1)' :
                           entry.type === 'heal' ? 'rgba(0, 255, 0, 0.1)' :
                           entry.type === 'system' ? 'rgba(255, 215, 0, 0.1)' :
                           'rgba(255, 255, 255, 0.05)',
                borderLeft: `3px solid ${
                  entry.type === 'damage' ? '#ff4444' :
                  entry.type === 'heal' ? '#44ff44' :
                  entry.type === 'system' ? '#ffd700' :
                  '#888888'
                }`
              }}
            >
              {entry.message}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Loading Overlay */}
      {combatState.isAnimating && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <LoadingSpinner size="large" />
        </div>
      )}

      {/* Animation Layer */}
      {activeAnimation?.type === 'magic-bolt' && (() => {
        const positions = getAnimationPositions();
        return (
          <MagicBoltAnimation
            casterPosition={positions.casterPosition}
            targetPosition={positions.targetPosition}
            damage={activeAnimation.damage}
            isCritical={activeAnimation.isCritical}
            element={activeAnimation.element}
            isActive={true}
            onComplete={() => {
              // Animation completed, cleanup handled in executeMagic
            }}
          />
        );
      })()}
    </div>
  );
};

export default Combat;