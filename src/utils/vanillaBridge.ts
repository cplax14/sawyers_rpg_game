/**
 * Bridge between React and Vanilla JS Game
 * Provides safe communication and state synchronization
 */

export interface GameEvents {
  'game:loaded': () => void;
  'game:started': () => void;
  'game:paused': () => void;
  'game:resumed': () => void;
  'player:levelup': (level: number) => void;
  'player:hpchange': (hp: number, maxHp: number) => void;
  'combat:start': (enemies: any[]) => void;
  'combat:end': (victory: boolean) => void;
  'story:show': (storyData: any) => void;
  'ui:screenchange': (screenName: string) => void;
  // Animation events
  'animation:combat:attack': (data: {
    attacker: string;
    target: string;
    weaponType?: string;
  }) => void;
  'animation:combat:spell': (data: {
    caster: string;
    target: string;
    element: string;
    spell: string;
  }) => void;
  'animation:combat:damage': (data: {
    target: string;
    damage: number;
    type: 'physical' | 'magical';
  }) => void;
  'animation:combat:heal': (data: { target: string; amount: number }) => void;
  'animation:ui:notification': (data: {
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
  }) => void;
  'animation:player:levelup': (data: { newLevel: number; stats: any }) => void;
  'animation:item:found': (data: { item: string; quantity: number }) => void;
  'animation:monster:captured': (data: { monster: string }) => void;
}

export type GameEventName = keyof GameEvents;

class VanillaBridge {
  private eventListeners: Map<GameEventName, Set<Function>> = new Map();
  private isConnected = false;
  private gameReadyPromise: Promise<void>;
  private gameReadyResolve: (() => void) | null = null;

  // Track state changes
  private lastHp = 0;
  private lastMaxHp = 0;

  constructor() {
    this.gameReadyPromise = new Promise(resolve => {
      this.gameReadyResolve = resolve;
    });

    this.initializeBridge();
  }

  private async initializeBridge() {
    // Wait for vanilla JS modules to load
    await this.waitForGame();

    // Hook into vanilla game events
    this.setupEventForwarding();

    this.isConnected = true;
    console.log('✅ React-Vanilla bridge connected');

    if (this.gameReadyResolve) {
      this.gameReadyResolve();
    }
  }

  private async waitForGame(): Promise<void> {
    return new Promise(resolve => {
      const checkReady = () => {
        if (
          typeof window !== 'undefined' &&
          window.SawyersRPG &&
          window.gameState &&
          window.UIManager
        ) {
          resolve();
          return true;
        }
        return false;
      };

      if (!checkReady()) {
        const interval = setInterval(() => {
          if (checkReady()) {
            clearInterval(interval);
          }
        }, 50);

        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(interval);
          console.warn('⚠️ Game failed to load within timeout');
          resolve(); // Resolve anyway to prevent hanging
        }, 30000);
      }
    });
  }

  private setupEventForwarding() {
    if (!window.gameState || !window.SawyersRPG) {
      return;
    }

    // Monitor game state changes
    const originalUpdate = window.gameState.update;
    if (originalUpdate) {
      window.gameState.update = (...args: any[]) => {
        const result = originalUpdate.apply(window.gameState, args);
        this.onGameUpdate();
        return result;
      };
    }

    // Monitor UI state changes
    if (window.SawyersRPG.ui && window.SawyersRPG.ui.showScreen) {
      const originalShowScreen = window.SawyersRPG.ui.showScreen;
      window.SawyersRPG.ui.showScreen = (screenName: string) => {
        const result = originalShowScreen.call(window.SawyersRPG.ui, screenName);
        this.emit('ui:screenchange', screenName);
        return result;
      };
    }

    // Set up automatic animation hooks
    this.setupCombatAnimationHooks();

    // Game loaded event
    this.emit('game:loaded');
  }

  private onGameUpdate() {
    // Emit relevant state change events
    const gameState = window.gameState;
    if (!gameState) return;

    // Monitor player HP changes
    if (gameState.player) {
      if (gameState.player.hp !== this.lastHp || gameState.player.maxHp !== this.lastMaxHp) {
        this.lastHp = gameState.player.hp;
        this.lastMaxHp = gameState.player.maxHp;
        this.emit('player:hpchange', gameState.player.hp, gameState.player.maxHp);
      }
    }
  }

  // Event system
  on<K extends GameEventName>(event: K, callback: GameEvents[K]): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }

    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  private emit<K extends GameEventName>(event: K, ...args: Parameters<GameEvents[K]>) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as any)(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Safe API methods
  async getGameState() {
    await this.gameReadyPromise;
    return window.gameState;
  }

  async getGameInstance() {
    await this.gameReadyPromise;
    return window.SawyersRPG;
  }

  async callGameMethod(method: string, ...args: any[]) {
    await this.gameReadyPromise;

    if (window.gameState && typeof window.gameState[method] === 'function') {
      return window.gameState[method](...args);
    }

    throw new Error(`Method ${method} not found on game state`);
  }

  async callUIMethod(method: string, ...args: any[]) {
    await this.gameReadyPromise;

    if (window.SawyersRPG?.ui && typeof window.SawyersRPG.ui[method] === 'function') {
      return window.SawyersRPG.ui[method](...args);
    }

    throw new Error(`UI method ${method} not found`);
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async waitForReady(): Promise<void> {
    return this.gameReadyPromise;
  }

  // Animation integration methods

  /**
   * Trigger a combat attack animation
   */
  triggerAttackAnimation(attacker: string, target: string, weaponType?: string): void {
    this.emit('animation:combat:attack', { attacker, target, weaponType });
  }

  /**
   * Trigger a spell animation
   */
  triggerSpellAnimation(caster: string, target: string, element: string, spell: string): void {
    this.emit('animation:combat:spell', { caster, target, element, spell });
  }

  /**
   * Trigger a damage animation
   */
  triggerDamageAnimation(
    target: string,
    damage: number,
    type: 'physical' | 'magical' = 'physical'
  ): void {
    this.emit('animation:combat:damage', { target, damage, type });
  }

  /**
   * Trigger a heal animation
   */
  triggerHealAnimation(target: string, amount: number): void {
    this.emit('animation:combat:heal', { target, amount });
  }

  /**
   * Trigger a notification animation
   */
  triggerNotificationAnimation(
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info'
  ): void {
    this.emit('animation:ui:notification', { message, type });
  }

  /**
   * Trigger a level up animation
   */
  triggerLevelUpAnimation(newLevel: number, stats: any): void {
    this.emit('animation:player:levelup', { newLevel, stats });
  }

  /**
   * Trigger an item found animation
   */
  triggerItemFoundAnimation(item: string, quantity: number = 1): void {
    this.emit('animation:item:found', { item, quantity });
  }

  /**
   * Trigger a monster captured animation
   */
  triggerMonsterCapturedAnimation(monster: string): void {
    this.emit('animation:monster:captured', { monster });
  }

  /**
   * Hook into vanilla game combat system to trigger animations automatically
   */
  private setupCombatAnimationHooks(): void {
    if (!window.gameState) return;

    // Hook into combat damage dealing
    const originalDealDamage = window.gameState.dealDamage;
    if (originalDealDamage) {
      window.gameState.dealDamage = (target: any, damage: number, type?: string) => {
        // Trigger damage animation before dealing damage
        this.triggerDamageAnimation(
          target.name || 'target',
          damage,
          type === 'spell' ? 'magical' : 'physical'
        );

        const result = originalDealDamage.call(window.gameState, target, damage, type);
        return result;
      };
    }

    // Hook into healing
    const originalHeal = window.gameState.heal;
    if (originalHeal) {
      window.gameState.heal = (target: any, amount: number) => {
        // Trigger heal animation before healing
        this.triggerHealAnimation(target.name || 'target', amount);

        const result = originalHeal.call(window.gameState, target, amount);
        return result;
      };
    }

    // Hook into level up
    const originalLevelUp = window.gameState.player?.levelUp;
    if (originalLevelUp) {
      window.gameState.player.levelUp = (...args: any[]) => {
        const result = originalLevelUp.apply(window.gameState.player, args);

        // Trigger level up animation after leveling up
        this.triggerLevelUpAnimation(window.gameState.player.level, {
          hp: window.gameState.player.maxHp,
          mp: window.gameState.player.maxMp,
          attack: window.gameState.player.attack,
          defense: window.gameState.player.defense,
        });

        return result;
      };
    }
  }
}

// Export singleton instance
export const vanillaBridge = new VanillaBridge();
