import { useEffect, useState, useCallback } from 'react';
import { vanillaBridge, GameEvents, GameEventName } from '../utils/vanillaBridge';

/**
 * React hook for interacting with the vanilla game bridge
 */
export function useVanillaBridge() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkReady = () => {
      setIsReady(vanillaBridge.isReady());
    };

    // Check initial state
    checkReady();

    // Listen for ready event
    const unsubscribe = vanillaBridge.on('game:loaded', checkReady);

    return unsubscribe;
  }, []);

  return {
    isReady,
    bridge: vanillaBridge
  };
}

/**
 * React hook for listening to specific vanilla game events
 */
export function useVanillaBridgeEvent<K extends GameEventName>(
  event: K,
  callback: GameEvents[K],
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = vanillaBridge.on(event, callback);
    return unsubscribe;
  }, [event, callback, enabled]);
}

/**
 * React hook for triggering animations from React components
 */
export function useVanillaBridgeAnimations() {
  const { isReady, bridge } = useVanillaBridge();

  const triggerAttackAnimation = useCallback((attacker: string, target: string, weaponType?: string) => {
    if (isReady) {
      bridge.triggerAttackAnimation(attacker, target, weaponType);
    }
  }, [isReady, bridge]);

  const triggerSpellAnimation = useCallback((caster: string, target: string, element: string, spell: string) => {
    if (isReady) {
      bridge.triggerSpellAnimation(caster, target, element, spell);
    }
  }, [isReady, bridge]);

  const triggerDamageAnimation = useCallback((target: string, damage: number, type: 'physical' | 'magical' = 'physical') => {
    if (isReady) {
      bridge.triggerDamageAnimation(target, damage, type);
    }
  }, [isReady, bridge]);

  const triggerHealAnimation = useCallback((target: string, amount: number) => {
    if (isReady) {
      bridge.triggerHealAnimation(target, amount);
    }
  }, [isReady, bridge]);

  const triggerNotificationAnimation = useCallback((message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    if (isReady) {
      bridge.triggerNotificationAnimation(message, type);
    }
  }, [isReady, bridge]);

  const triggerLevelUpAnimation = useCallback((newLevel: number, stats: any) => {
    if (isReady) {
      bridge.triggerLevelUpAnimation(newLevel, stats);
    }
  }, [isReady, bridge]);

  const triggerItemFoundAnimation = useCallback((item: string, quantity: number = 1) => {
    if (isReady) {
      bridge.triggerItemFoundAnimation(item, quantity);
    }
  }, [isReady, bridge]);

  const triggerMonsterCapturedAnimation = useCallback((monster: string) => {
    if (isReady) {
      bridge.triggerMonsterCapturedAnimation(monster);
    }
  }, [isReady, bridge]);

  return {
    isReady,
    triggerAttackAnimation,
    triggerSpellAnimation,
    triggerDamageAnimation,
    triggerHealAnimation,
    triggerNotificationAnimation,
    triggerLevelUpAnimation,
    triggerItemFoundAnimation,
    triggerMonsterCapturedAnimation
  };
}

/**
 * React hook for game state access through the bridge
 */
export function useVanillaGameState() {
  const [gameState, setGameState] = useState<any>(null);
  const [player, setPlayer] = useState<any>(null);
  const { isReady, bridge } = useVanillaBridge();

  useEffect(() => {
    if (!isReady) return;

    const updateGameState = async () => {
      try {
        const state = await bridge.getGameState();
        setGameState(state);
        setPlayer(state?.player || null);
      } catch (error) {
        console.error('Failed to get game state:', error);
      }
    };

    updateGameState();

    // Listen for state changes
    const unsubscribeHp = bridge.on('player:hpchange', () => updateGameState());
    const unsubscribeLevelUp = bridge.on('player:levelup', () => updateGameState());

    return () => {
      unsubscribeHp();
      unsubscribeLevelUp();
    };
  }, [isReady, bridge]);

  return {
    gameState,
    player,
    isReady
  };
}

/**
 * React hook for calling vanilla game methods safely
 */
export function useVanillaGameMethods() {
  const { isReady, bridge } = useVanillaBridge();

  const callGameMethod = useCallback(async (method: string, ...args: any[]) => {
    if (!isReady) {
      throw new Error('Game not ready');
    }
    return bridge.callGameMethod(method, ...args);
  }, [isReady, bridge]);

  const callUIMethod = useCallback(async (method: string, ...args: any[]) => {
    if (!isReady) {
      throw new Error('Game not ready');
    }
    return bridge.callUIMethod(method, ...args);
  }, [isReady, bridge]);

  return {
    callGameMethod,
    callUIMethod,
    isReady
  };
}