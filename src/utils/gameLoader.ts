/**
 * Utility to load vanilla JavaScript game modules dynamically
 */

interface ScriptLoader {
  src: string;
  loaded: boolean;
  element?: HTMLScriptElement;
}

class GameModuleLoader {
  private scripts: ScriptLoader[] = [];
  private loadPromises: Map<string, Promise<void>> = new Map();

  constructor() {
    // Define the loading order for game scripts
    this.scripts = [
      { src: 'js/spellSystem.js', loaded: false },
      { src: 'js/gameState.js', loaded: false },
      { src: 'js/ui/BaseUIModule.js', loaded: false },
      { src: 'js/ui/UIHelpers.js', loaded: false },
      { src: 'js/ui/SceneManager.js', loaded: false },
      { src: 'js/ui/NotificationBridge.js', loaded: false },
      { src: 'js/ui/UIModuleLoader.js', loaded: false },
      { src: 'js/ui/TransitionController.js', loaded: false },
      { src: 'js/ui/UIManager.js', loaded: false },
      { src: 'js/ui/MenuUI.js', loaded: false },
      { src: 'js/ui/GameWorldUI.js', loaded: false },
      { src: 'js/ui/CombatUI.js', loaded: false },
      { src: 'js/ui/MonsterUI.js', loaded: false },
      { src: 'js/ui/InventoryUI.js', loaded: false },
      { src: 'js/ui/SettingsUI.js', loaded: false },
      { src: 'js/ui/StoryUI.js', loaded: false },
      { src: 'js/player.js', loaded: false },
      { src: 'js/monster.js', loaded: false },
      { src: 'js/monsterBreeding.js', loaded: false },
      { src: 'js/combat.js', loaded: false },
      { src: 'js/worldMap.js', loaded: false },
      { src: 'js/lootSystem.js', loaded: false },
      { src: 'js/saveSystem.js', loaded: false },
      { src: 'data/characters.js', loaded: false },
      { src: 'data/monsters.js', loaded: false },
      { src: 'data/areas.js', loaded: false },
      { src: 'data/items.js', loaded: false },
      { src: 'data/spells.js', loaded: false },
      { src: 'data/story.js', loaded: false },
      // Game.js must be last to initialize everything
      { src: 'js/game.js', loaded: false },
    ];
  }

  private loadScript(src: string): Promise<void> {
    // Check if already loaded or loading
    if (this.loadPromises.has(src)) {
      return this.loadPromises.get(src)!;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.type = 'text/javascript';
      script.async = false; // Maintain order

      script.onload = () => {
        const scriptLoader = this.scripts.find(s => s.src === src);
        if (scriptLoader) {
          scriptLoader.loaded = true;
          scriptLoader.element = script;
        }
        console.log(`✅ Loaded: ${src}`);
        resolve();
      };

      script.onerror = error => {
        console.error(`❌ Failed to load: ${src}`, error);
        reject(new Error(`Failed to load script: ${src}`));
      };

      document.head.appendChild(script);
    });

    this.loadPromises.set(src, promise);
    return promise;
  }

  async loadAllModules(): Promise<void> {
    console.log('🎮 Loading vanilla JS game modules...');

    try {
      // Load scripts in order
      for (const script of this.scripts) {
        if (!script.loaded) {
          await this.loadScript(script.src);
          // Small delay to ensure proper initialization
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Wait a bit more for the game to initialize
      await new Promise(resolve => setTimeout(resolve, 200));

      console.log('✅ All game modules loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load game modules:', error);
      throw error;
    }
  }

  isGameReady(): boolean {
    return (
      typeof window !== 'undefined' &&
      window.SawyersRPG &&
      window.gameState &&
      this.scripts.every(script => script.loaded)
    );
  }

  getLoadProgress(): number {
    const loadedCount = this.scripts.filter(script => script.loaded).length;
    return (loadedCount / this.scripts.length) * 100;
  }
}

export const gameLoader = new GameModuleLoader();

// Global type declarations for TypeScript
declare global {
  interface Window {
    SawyersRPG: any;
    gameState: any;
    UIManager: any;
    GameState: any;
  }
}
