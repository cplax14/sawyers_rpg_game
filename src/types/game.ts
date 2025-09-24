// Game Type Definitions for React Integration

// Vanilla JS Game Instance Interface
export interface GameInstance {
  gameState: GameState;
  ui: UIManager;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  isRunning: boolean;
  start(): void;
  pause(): void;
  resume(): void;
  stop(): void;
  getGameState(): GameState;
  getUI(): UIManager;
}

// Game State Interface (mirrors vanilla GameState)
export interface GameState {
  player: Player;
  currentArea: string;
  inventory: Inventory;
  monsters: Monster[];
  combat: CombatState | null;
  story: StoryState;
  settings: GameSettings;
  // Add methods
  update(deltaTime: number): void;
  handleInput(type: string, data: any): void;
  saveGame(): void;
  loadGame(saveData: any): void;
}

export interface Player {
  name: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  experience: number;
  experienceToNext: number;
  gold: number;
  stats: PlayerStats;
  equipment: Equipment;
  spells: Spell[];
}

export interface PlayerStats {
  attack: number;
  defense: number;
  magicAttack: number;
  magicDefense: number;
  speed: number;
  accuracy: number;
}

export interface Equipment {
  weapon: Item | null;
  armor: Item | null;
  accessory: Item | null;
}

export interface Inventory {
  items: Item[];
  equipment: Item[];
  materials: Item[];
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'equipment' | 'material';
  subtype?: string;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  value: number;
  quantity: number;
  stats?: Partial<PlayerStats>;
  effects?: ItemEffect[];
}

export interface ItemEffect {
  type: string;
  value: number;
  duration?: number;
}

export interface Monster {
  id: string;
  name: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stats: PlayerStats;
  type: string;
  rarity: string;
  abilities: Ability[];
  captureRate: number;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  cost: number;
  effects: AbilityEffect[];
}

export interface AbilityEffect {
  type: string;
  target: string;
  value: number;
}

export interface Spell {
  id: string;
  name: string;
  description: string;
  cost: number;
  school: string;
  effects: SpellEffect[];
}

export interface SpellEffect {
  type: string;
  value: number;
  duration?: number;
}

export interface CombatState {
  isActive: boolean;
  turn: number;
  currentActor: 'player' | 'enemy';
  enemies: Monster[];
  battleLog: string[];
  selectedAction: string | null;
  selectedTarget: Monster | null;
}

export interface StoryState {
  currentNode: string | null;
  completedNodes: string[];
  availableChoices: StoryChoice[];
  flags: { [key: string]: boolean };
}

export interface StoryChoice {
  id: string;
  text: string;
  nextNode: string;
  requirements?: string[];
}

export interface GameSettings {
  audio: AudioSettings;
  gameplay: GameplaySettings;
  display: DisplaySettings;
  controls: ControlSettings;
}

export interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  voiceVolume: number;
}

export interface GameplaySettings {
  difficulty: 'easy' | 'normal' | 'hard' | 'nightmare';
  autoSave: boolean;
  autoSaveInterval: number;
  battleAnimations: boolean;
  skipIntro: boolean;
  monsterNotifications: boolean;
}

export interface DisplaySettings {
  theme: 'fantasy' | 'dark' | 'light' | 'colorful';
  uiScale: number;
  showFps: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
}

export interface ControlSettings {
  keyboardShortcuts: boolean;
  mouseSensitivity: number;
  keyBindings: { [action: string]: string };
}

// UI Manager Interface
export interface UIManager {
  currentScene: string;
  modules: Map<string, any>;
  showScreen(screenName: string): void;
  hideScreen(screenName: string): void;
  showModal(modalName: string, data?: any): void;
  hideModal(modalName: string): void;
  update(deltaTime: number): void;
}

// Area/World Data
export interface Area {
  id: string;
  name: string;
  description: string;
  type: 'town' | 'wilderness' | 'dungeon';
  icon: string;
  encounterRate: number;
  monsters: string[];
  connections: string[];
  services: string[];
  unlocked: boolean;
  position: { x: number; y: number };
}