/**
 * Comprehensive mock data for testing
 * Provides complete, valid test fixtures for all game entities
 */

import {
  ReactPlayer,
  ReactArea,
  ReactItem,
  ReactMonster,
  GameSettings,
  PlayerStats,
  Equipment,
} from '../contexts/ReactGameContext';
import { InventoryState } from '../types/inventory';
import { CreatureCollection } from '../types/creatures';
import { ExperienceState } from '../types/experience';

// Mock Player Stats
export const mockBaseStats: PlayerStats = {
  attack: 10,
  defense: 10,
  magicAttack: 10,
  magicDefense: 10,
  speed: 10,
  accuracy: 85,
};

export const mockEquipment: Equipment = {
  // Legacy slots
  weapon: null,
  armor: null,
  accessory: null,
  // Extended slots (10-slot system)
  helmet: null,
  necklace: null,
  shield: null,
  gloves: null,
  boots: null,
  ring1: null,
  ring2: null,
  charm: null,
};

// Mock Player
export const mockPlayer: ReactPlayer = {
  id: 'player_test_123',
  name: 'Test Hero',
  class: 'warrior',
  level: 5,
  hp: 100,
  maxHp: 100,
  mp: 50,
  maxMp: 50,
  experience: 250,
  experienceToNext: 500,
  gold: 1000,
  baseStats: { ...mockBaseStats },
  stats: { ...mockBaseStats, attack: 15, defense: 12 },
  equipment: { ...mockEquipment },
  spells: ['fireball', 'heal'],
  avatar: 'warrior_avatar.png',
};

// Mock Items
export const mockHealthPotion: ReactItem = {
  id: 'health_potion_001',
  name: 'Health Potion',
  description: 'Restores 50 HP',
  type: 'consumable',
  subtype: 'potion',
  rarity: 'common',
  value: 50,
  quantity: 5,
  effects: [{ type: 'heal', value: 50, target: 'self' }],
  icon: 'potion_health.png',
};

export const mockSword: ReactItem = {
  id: 'iron_sword_001',
  name: 'Iron Sword',
  description: 'A sturdy iron blade',
  type: 'weapon',
  subtype: 'sword',
  rarity: 'common',
  value: 200,
  quantity: 1,
  stats: { attack: 5 },
  requirements: { level: 3 },
  icon: 'weapon_sword_iron.png',
};

export const mockArmor: ReactItem = {
  id: 'leather_armor_001',
  name: 'Leather Armor',
  description: 'Basic protective gear',
  type: 'armor',
  subtype: 'light',
  rarity: 'common',
  value: 150,
  quantity: 1,
  stats: { defense: 5 },
  requirements: { level: 2 },
  icon: 'armor_leather.png',
};

export const mockRareAccessory: ReactItem = {
  id: 'magic_ring_001',
  name: 'Ring of Power',
  description: 'Increases magic attack',
  type: 'accessory',
  subtype: 'ring',
  rarity: 'rare',
  value: 500,
  quantity: 1,
  stats: { magicAttack: 10 },
  requirements: { level: 5 },
  icon: 'accessory_ring_magic.png',
};

export const mockMaterial: ReactItem = {
  id: 'slime_gel_001',
  name: 'Slime Gel',
  description: 'Sticky substance from slimes',
  type: 'material',
  subtype: 'crafting',
  rarity: 'common',
  value: 10,
  quantity: 20,
  icon: 'material_slime_gel.png',
};

export const mockInventoryItems: ReactItem[] = [
  mockHealthPotion,
  mockSword,
  mockArmor,
  mockMaterial,
];

// Mock Monsters
export const mockSlime: ReactMonster = {
  id: 'slime_001',
  name: 'Slime',
  species: 'slime',
  level: 1,
  hp: 30,
  maxHp: 30,
  mp: 10,
  maxMp: 10,
  stats: {
    attack: 5,
    defense: 3,
    magicAttack: 2,
    magicDefense: 2,
    speed: 4,
    accuracy: 80,
  },
  experience: 0,
  skills: ['tackle'],
  element: 'water',
  sprite: 'slime_sprite.png',
  captureRate: 30,
};

export const mockGoblin: ReactMonster = {
  id: 'goblin_001',
  name: 'Goblin',
  species: 'goblin',
  level: 3,
  hp: 50,
  maxHp: 50,
  mp: 20,
  maxMp: 20,
  stats: {
    attack: 8,
    defense: 5,
    magicAttack: 3,
    magicDefense: 4,
    speed: 7,
    accuracy: 85,
  },
  experience: 0,
  skills: ['slash', 'steal'],
  element: 'earth',
  sprite: 'goblin_sprite.png',
  captureRate: 20,
};

export const mockWolf: ReactMonster = {
  id: 'wolf_001',
  name: 'Wolf',
  species: 'wolf',
  level: 5,
  hp: 70,
  maxHp: 70,
  mp: 15,
  maxMp: 15,
  stats: {
    attack: 12,
    defense: 7,
    magicAttack: 4,
    magicDefense: 5,
    speed: 10,
    accuracy: 90,
  },
  experience: 0,
  skills: ['bite', 'howl'],
  element: 'neutral',
  sprite: 'wolf_sprite.png',
  captureRate: 15,
};

export const mockCapturedMonsters: ReactMonster[] = [mockSlime, mockGoblin];

// Mock Areas
export const mockStartingVillage: ReactArea = {
  id: 'starting_village',
  name: 'Starting Village',
  description: 'A peaceful village where your adventure begins',
  type: 'town',
  unlocked: true,
  unlockRequirements: {},
  encounterRate: 0.1,
  monsters: [],
  connections: ['forest_path', 'meadow'],
  services: ['shop', 'inn', 'blacksmith'],
  recommendedLevel: 1,
  position: { x: 0, y: 0 },
};

export const mockForest: ReactArea = {
  id: 'forest_path',
  name: 'Forest Path',
  description: 'A winding path through dense woods',
  type: 'wilderness',
  unlocked: true,
  unlockRequirements: { level: 2 },
  encounterRate: 0.7,
  monsters: ['slime', 'goblin'],
  connections: ['starting_village', 'dark_forest'],
  recommendedLevel: 3,
  position: { x: 1, y: 0 },
};

export const mockDungeon: ReactArea = {
  id: 'dark_cave',
  name: 'Dark Cave',
  description: 'A mysterious cave filled with danger',
  type: 'dungeon',
  unlocked: false,
  unlockRequirements: {
    level: 5,
    story: 'forest_cleared',
    items: ['torch'],
  },
  encounterRate: 0.8,
  monsters: ['wolf', 'bat', 'spider'],
  connections: ['forest_path'],
  recommendedLevel: 7,
  position: { x: 2, y: -1 },
};

export const mockAreas: ReactArea[] = [mockStartingVillage, mockForest, mockDungeon];

// Mock Game Settings
export const mockGameSettings: GameSettings = {
  masterVolume: 0.8,
  musicVolume: 0.7,
  sfxVolume: 0.8,
  soundEnabled: true,
  difficulty: 'normal',
  autoSave: true,
  autoSaveInterval: 3,
  autoSaveMaxFailures: 3,
  autoSaveShowNotifications: true,
  autoSavePauseDuringCombat: true,
  autoSaveOnlyWhenActive: true,
  showDamageNumbers: true,
  fastAnimations: false,
  highContrast: false,
  reduceMotion: false,
  fontSize: 'medium',
  colorBlindMode: 'none',
  showTutorials: true,
  confirmActions: true,
  keyboardShortcuts: {
    'open-inventory': 'KeyI',
    'open-menu': 'Escape',
    'quick-save': 'KeyS',
    'quick-load': 'KeyL',
  },
};

// Mock Inventory State
export const mockInventoryState: InventoryState = {
  items: mockInventoryItems,
  maxSlots: 50,
  usedSlots: mockInventoryItems.reduce((sum, item) => sum + item.quantity, 0),
  gold: 1000,
  sortBy: 'type',
  filterBy: 'all',
};

// Mock Creature Collection
export const mockCreatureCollection: CreatureCollection = {
  creatures: mockCapturedMonsters,
  maxSlots: 20,
  usedSlots: mockCapturedMonsters.length,
  sortBy: 'level',
  filterBy: 'all',
};

// Mock Experience State
export const mockExperienceState: ExperienceState = {
  currentLevel: 5,
  currentExp: 250,
  expToNextLevel: 500,
  totalExp: 1250,
  levelUpBonus: {
    hp: 10,
    mp: 5,
    stats: {
      attack: 2,
      defense: 1,
      magicAttack: 1,
      magicDefense: 1,
      speed: 1,
      accuracy: 0,
    },
  },
};

// Factory functions for creating test data
export function createMockPlayer(overrides?: Partial<ReactPlayer>): ReactPlayer {
  return {
    ...mockPlayer,
    ...overrides,
    stats: { ...mockPlayer.stats, ...overrides?.stats },
    baseStats: { ...mockPlayer.baseStats, ...overrides?.baseStats },
    equipment: { ...mockPlayer.equipment, ...overrides?.equipment },
  };
}

export function createMockItem(overrides?: Partial<ReactItem>): ReactItem {
  return {
    ...mockHealthPotion,
    ...overrides,
    id: overrides?.id || `item_${Date.now()}_${Math.random()}`,
  };
}

export function createMockMonster(overrides?: Partial<ReactMonster>): ReactMonster {
  return {
    ...mockSlime,
    ...overrides,
    id: overrides?.id || `monster_${Date.now()}_${Math.random()}`,
    stats: { ...mockSlime.stats, ...overrides?.stats },
  };
}

export function createMockArea(overrides?: Partial<ReactArea>): ReactArea {
  return {
    ...mockStartingVillage,
    ...overrides,
    unlockRequirements: {
      ...mockStartingVillage.unlockRequirements,
      ...overrides?.unlockRequirements,
    },
  };
}

// Combat rewards mock
export const mockCombatRewards = {
  experience: 100,
  gold: 50,
  items: [mockHealthPotion, mockMaterial],
  capturedMonsterId: undefined,
};

// Story flags mock
export const mockStoryFlags = {
  tutorial_complete: true,
  forest_cleared: false,
  first_boss_defeated: false,
};
