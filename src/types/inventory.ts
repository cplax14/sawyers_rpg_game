/**
 * Comprehensive Inventory System Type Definitions
 *
 * Extends the base game types with enhanced inventory management,
 * equipment systems, and item operations.
 */

import { Item, Equipment, PlayerStats, ItemEffect } from './game';

// =============================================================================
// ITEM ENHANCEMENTS
// =============================================================================

export type ItemRarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'artifact'
  | 'unique';

export const RARITY_COLORS = {
  common: '#22c55e', // green
  uncommon: '#10b981', // emerald green
  rare: '#3b82f6', // blue
  epic: '#a855f7', // purple
  legendary: '#f97316', // orange
  artifact: '#dc2626', // red
  unique: '#fbbf24', // gold/amber
} as const;

// =============================================================================
// COMPREHENSIVE RARITY SYSTEM
// =============================================================================

export interface RarityDefinition {
  name: string;
  displayName: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  dropRate: number; // Base drop rate percentage (0-100)
  valueMultiplier: number; // Multiplier for base item value
  statBonusRange: [number, number]; // Min/max stat bonus percentage
  description: string;
  tier: number; // Rarity tier for sorting (1-4)
  icon?: string;
  effects?: RarityEffect[];
}

export interface RarityEffect {
  type: 'stat_bonus' | 'special_ability' | 'set_bonus_chance' | 'upgrade_bonus';
  description: string;
  value: number;
  conditions?: string[];
}

export const RARITY_SYSTEM: Record<ItemRarity, RarityDefinition> = {
  common: {
    name: 'common',
    displayName: 'Common',
    color: '#22c55e',
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
    textColor: '#14532d',
    glowColor: '#22c55e80',
    dropRate: 70,
    valueMultiplier: 1.0,
    statBonusRange: [0, 10],
    description: 'Standard equipment found throughout the world',
    tier: 1,
    icon: '●',
    effects: [],
  },
  uncommon: {
    name: 'uncommon',
    displayName: 'Uncommon',
    color: '#10b981',
    backgroundColor: '#d1fae5',
    borderColor: '#059669',
    textColor: '#064e3b',
    glowColor: '#10b98180',
    dropRate: 50,
    valueMultiplier: 1.5,
    statBonusRange: [5, 15],
    description: 'Better than average equipment with minor enhancements',
    tier: 2,
    icon: '◆',
    effects: [
      {
        type: 'stat_bonus',
        description: 'Minor stat bonuses',
        value: 10,
        conditions: [],
      },
    ],
  },
  rare: {
    name: 'rare',
    displayName: 'Rare',
    color: '#3b82f6',
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
    textColor: '#1e3a8a',
    glowColor: '#3b82f680',
    dropRate: 25,
    valueMultiplier: 2.5,
    statBonusRange: [10, 25],
    description: 'Rare equipment with enhanced properties',
    tier: 3,
    icon: '◆',
    effects: [
      {
        type: 'stat_bonus',
        description: 'Additional stat bonuses',
        value: 15,
        conditions: [],
      },
    ],
  },
  epic: {
    name: 'epic',
    displayName: 'Epic',
    color: '#a855f7',
    backgroundColor: '#f3e8ff',
    borderColor: '#9333ea',
    textColor: '#581c87',
    glowColor: '#a855f780',
    dropRate: 4,
    valueMultiplier: 6.0,
    statBonusRange: [25, 50],
    description: 'Powerful equipment with unique abilities',
    tier: 4,
    icon: '★',
    effects: [
      {
        type: 'stat_bonus',
        description: 'Significant stat bonuses',
        value: 35,
        conditions: [],
      },
      {
        type: 'special_ability',
        description: 'May have special abilities',
        value: 25,
        conditions: [],
      },
    ],
  },
  legendary: {
    name: 'legendary',
    displayName: 'Legendary',
    color: '#f97316',
    backgroundColor: '#fed7aa',
    borderColor: '#ea580c',
    textColor: '#9a3412',
    glowColor: '#f9731680',
    dropRate: 1,
    valueMultiplier: 15.0,
    statBonusRange: [50, 100],
    description: 'Extraordinary equipment of immense power',
    tier: 5,
    icon: '✦',
    effects: [
      {
        type: 'stat_bonus',
        description: 'Massive stat bonuses',
        value: 75,
        conditions: [],
      },
      {
        type: 'special_ability',
        description: 'Guaranteed special abilities',
        value: 100,
        conditions: [],
      },
      {
        type: 'set_bonus_chance',
        description: 'Higher chance for set bonuses',
        value: 50,
        conditions: [],
      },
    ],
  },
  artifact: {
    name: 'artifact',
    displayName: 'Artifact',
    color: '#dc2626',
    backgroundColor: '#fee2e2',
    borderColor: '#b91c1c',
    textColor: '#7f1d1d',
    glowColor: '#dc262680',
    dropRate: 0.3,
    valueMultiplier: 25.0,
    statBonusRange: [75, 150],
    description: 'Ancient artifacts of legendary power',
    tier: 6,
    icon: '⬟',
    effects: [
      {
        type: 'stat_bonus',
        description: 'Exceptional stat bonuses',
        value: 100,
        conditions: [],
      },
      {
        type: 'special_ability',
        description: 'Multiple special abilities',
        value: 100,
        conditions: [],
      },
      {
        type: 'set_bonus_chance',
        description: 'Guaranteed set bonuses',
        value: 100,
        conditions: [],
      },
    ],
  },
  unique: {
    name: 'unique',
    displayName: 'Unique',
    color: '#fbbf24',
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
    textColor: '#78350f',
    glowColor: '#fbbf2480',
    dropRate: 0.1,
    valueMultiplier: 50.0,
    statBonusRange: [100, 200],
    description: 'One-of-a-kind equipment of unparalleled power',
    tier: 7,
    icon: '◈',
    effects: [
      {
        type: 'stat_bonus',
        description: 'Unmatched stat bonuses',
        value: 150,
        conditions: [],
      },
      {
        type: 'special_ability',
        description: 'Unique special abilities',
        value: 100,
        conditions: [],
      },
      {
        type: 'set_bonus_chance',
        description: 'Guaranteed set bonuses',
        value: 100,
        conditions: [],
      },
      {
        type: 'upgrade_bonus',
        description: 'Enhanced upgrade potential',
        value: 200,
        conditions: [],
      },
    ],
  },
} as const;

// =============================================================================
// RARITY UTILITIES AND HELPERS
// =============================================================================

export interface RarityDisplayOptions {
  showIcon: boolean;
  showGlow: boolean;
  showBorder: boolean;
  showBackground: boolean;
  iconSize: 'small' | 'medium' | 'large';
  glowIntensity: number; // 0-1
}

export interface RarityTheme {
  name: string;
  rarities: Record<ItemRarity, Partial<RarityDefinition>>;
}

export const RARITY_THEMES: Record<string, RarityTheme> = {
  default: {
    name: 'Default',
    rarities: RARITY_SYSTEM,
  },
  colorblind_friendly: {
    name: 'Colorblind Friendly',
    rarities: {
      common: {
        color: '#666666',
        backgroundColor: '#f5f5f5',
        borderColor: '#999999',
        icon: '○',
      },
      rare: {
        color: '#0066cc',
        backgroundColor: '#e6f2ff',
        borderColor: '#0052a3',
        icon: '◇',
      },
      epic: {
        color: '#cc6600',
        backgroundColor: '#fff2e6',
        borderColor: '#a35200',
        icon: '▲',
      },
      legendary: {
        color: '#cc0066',
        backgroundColor: '#ffe6f2',
        borderColor: '#a30052',
        icon: '♦',
      },
    },
  },
  high_contrast: {
    name: 'High Contrast',
    rarities: {
      common: {
        color: '#000000',
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        textColor: '#000000',
      },
      rare: {
        color: '#000080',
        backgroundColor: '#e0e0ff',
        borderColor: '#000080',
        textColor: '#000080',
      },
      epic: {
        color: '#800080',
        backgroundColor: '#ffe0ff',
        borderColor: '#800080',
        textColor: '#800080',
      },
      legendary: {
        color: '#ff0000',
        backgroundColor: '#ffe0e0',
        borderColor: '#ff0000',
        textColor: '#ff0000',
      },
    },
  },
};

// =============================================================================
// RARITY CALCULATION AND GENERATION
// =============================================================================

export interface RarityCalculationInput {
  baseRarity: ItemRarity;
  playerLevel: number;
  areaModifier: number; // 0.5-2.0
  luckModifier: number; // 0.8-1.5
  eventModifiers: number[]; // Additional modifiers from events
}

export interface RarityCalculationResult {
  originalRarity: ItemRarity;
  finalRarity: ItemRarity;
  rarityRoll: number; // 1-100
  thresholds: Record<ItemRarity, number>;
  modifiersApplied: RarityModifier[];
  upgraded: boolean;
}

export interface RarityModifier {
  source: string;
  type: 'player_level' | 'area_bonus' | 'luck' | 'event' | 'achievement';
  value: number;
  description: string;
}

export interface RarityDistribution {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  total: number;
}

export interface RarityAnalytics {
  distribution: RarityDistribution;
  averageRarity: number;
  rarityTrend: 'improving' | 'stable' | 'declining';
  lastRareFind?: Date;
  streakCount: number;
  streakType: 'common' | 'rare_plus';
}

// =============================================================================
// RARITY PROGRESSION AND REWARDS
// =============================================================================

export interface RarityMilestone {
  id: string;
  name: string;
  description: string;
  requirement: RarityRequirement;
  rewards: RarityReward[];
  completed: boolean;
  progress: number; // 0-100
}

export interface RarityRequirement {
  type: 'find_rarity' | 'collect_count' | 'upgrade_items' | 'use_items';
  rarity?: ItemRarity;
  count: number;
  timeframe?: number; // in hours
}

export interface RarityReward {
  type: 'rarity_boost' | 'guaranteed_drop' | 'currency' | 'item';
  value: any;
  duration?: number; // in minutes
  description: string;
}

// =============================================================================
// VISUAL EFFECTS AND ANIMATIONS
// =============================================================================

export interface RarityVisualEffect {
  type: 'glow' | 'sparkle' | 'pulse' | 'float' | 'rotate';
  intensity: number; // 0-1
  speed: number; // 0-1
  color?: string;
  enabled: boolean;
}

export interface RarityAnimationSet {
  drop: RarityVisualEffect[];
  hover: RarityVisualEffect[];
  select: RarityVisualEffect[];
  equip: RarityVisualEffect[];
}

export const RARITY_ANIMATIONS: Record<ItemRarity, RarityAnimationSet> = {
  common: {
    drop: [{ type: 'glow', intensity: 0.2, speed: 0.5, enabled: false }],
    hover: [{ type: 'glow', intensity: 0.3, speed: 0.7, enabled: true }],
    select: [{ type: 'pulse', intensity: 0.4, speed: 0.8, enabled: true }],
    equip: [],
  },
  rare: {
    drop: [
      { type: 'glow', intensity: 0.4, speed: 0.6, enabled: true },
      { type: 'sparkle', intensity: 0.3, speed: 0.5, enabled: true },
    ],
    hover: [{ type: 'glow', intensity: 0.5, speed: 0.7, enabled: true }],
    select: [{ type: 'pulse', intensity: 0.6, speed: 0.8, enabled: true }],
    equip: [{ type: 'sparkle', intensity: 0.7, speed: 1.0, enabled: true }],
  },
  epic: {
    drop: [
      { type: 'glow', intensity: 0.6, speed: 0.7, enabled: true },
      { type: 'sparkle', intensity: 0.5, speed: 0.6, enabled: true },
      { type: 'pulse', intensity: 0.4, speed: 0.8, enabled: true },
    ],
    hover: [
      { type: 'glow', intensity: 0.7, speed: 0.8, enabled: true },
      { type: 'float', intensity: 0.3, speed: 0.4, enabled: true },
    ],
    select: [{ type: 'pulse', intensity: 0.8, speed: 0.9, enabled: true }],
    equip: [
      { type: 'sparkle', intensity: 0.9, speed: 1.2, enabled: true },
      { type: 'glow', intensity: 0.8, speed: 1.0, enabled: true },
    ],
  },
  legendary: {
    drop: [
      { type: 'glow', intensity: 0.8, speed: 0.8, enabled: true },
      { type: 'sparkle', intensity: 0.7, speed: 0.7, enabled: true },
      { type: 'pulse', intensity: 0.6, speed: 0.9, enabled: true },
      { type: 'rotate', intensity: 0.3, speed: 0.2, enabled: true },
    ],
    hover: [
      { type: 'glow', intensity: 0.9, speed: 0.9, enabled: true },
      { type: 'float', intensity: 0.5, speed: 0.3, enabled: true },
      { type: 'sparkle', intensity: 0.6, speed: 0.8, enabled: true },
    ],
    select: [
      { type: 'pulse', intensity: 1.0, speed: 1.0, enabled: true },
      { type: 'rotate', intensity: 0.4, speed: 0.5, enabled: true },
    ],
    equip: [
      { type: 'sparkle', intensity: 1.0, speed: 1.5, enabled: true },
      { type: 'glow', intensity: 1.0, speed: 1.2, enabled: true },
      { type: 'pulse', intensity: 0.8, speed: 1.0, enabled: true },
    ],
  },
};

// =============================================================================
// RARITY SETTINGS AND PREFERENCES
// =============================================================================

export interface RaritySettings {
  theme: string; // Key from RARITY_THEMES
  showAnimations: boolean;
  showRarityNames: boolean;
  showRarityIcons: boolean;
  showRarityGlow: boolean;
  glowIntensity: number; // 0-1
  animationSpeed: number; // 0-2
  colorblindMode: boolean;
  highContrastMode: boolean;
  reduceMotion: boolean;
}

export type ItemCategory = 'consumables' | 'equipment' | 'materials' | 'quest' | 'misc';

export type EquipmentSlot =
  | 'helmet'
  | 'necklace'
  | 'armor'
  | 'weapon'
  | 'shield'
  | 'gloves'
  | 'boots'
  | 'ring1'
  | 'ring2'
  | 'charm';

export type EquipmentSubtype =
  | 'sword'
  | 'bow'
  | 'staff'
  | 'dagger'
  | 'axe'
  | 'mace' // weapons
  | 'helmet'
  | 'chestplate'
  | 'boots'
  | 'gloves'
  | 'shield' // armor pieces
  | 'ring'
  | 'necklace'
  | 'charm'; // accessories

export interface EnhancedItem extends Item {
  // Enhanced categorization
  category: ItemCategory;

  // Equipment-specific fields (only present for equipment items)
  equipmentSlot?: EquipmentSlot;
  equipmentSubtype?: EquipmentSubtype;
  twoHanded?: boolean; // True if weapon requires both weapon + shield slots

  // Requirements and restrictions
  levelRequirement?: number; // Direct level requirement (legacy support)
  classRequirement?: string[]; // Direct class requirement (legacy support)
  requirements?: EquipmentRequirement; // Comprehensive requirements object

  // Enhanced stats and effects
  // Note: Base Item has 'stats', EnhancedItem uses 'statModifiers' for clarity
  // Both refer to stat bonuses provided by the item (Partial<PlayerStats>)
  statModifiers?: Partial<PlayerStats>;
  activeEffects?: ItemEffect[];
  passiveEffects?: ItemEffect[];

  // Inventory management
  stackable: boolean;
  maxStack: number;
  weight: number;
  equipped?: boolean; // Dynamically computed flag indicating if item is currently equipped

  // Visual and metadata
  sprite?: string;
  model?: string;
  flavorText?: string;

  // Trading and economy
  sellValue: number;
  canTrade: boolean;
  canDrop: boolean;
  canDestroy: boolean;

  // Usage properties
  usable: boolean;
  consumeOnUse: boolean;
  useInCombat: boolean;
  useOutOfCombat: boolean;
  cooldown?: number;

  // Timestamps
  acquiredAt?: Date;
  lastUsedAt?: Date;
}

// =============================================================================
// EQUIPMENT SYSTEM
// =============================================================================

export interface EquipmentSet extends Equipment {
  // Extend base Equipment with additional slots
  helmet?: EnhancedItem | null;
  shield?: EnhancedItem | null;
  chestplate?: EnhancedItem | null;
  boots?: EnhancedItem | null;
  gloves?: EnhancedItem | null;
  ring1?: EnhancedItem | null;
  ring2?: EnhancedItem | null;
  necklace?: EnhancedItem | null;
  charm?: EnhancedItem | null;
}

export interface EquipmentSlotInfo {
  slot: EquipmentSlot;
  displayName: string;
  icon: string;
  acceptedSubtypes: EquipmentSubtype[];
  required: boolean;
}

export interface EquipmentComparison {
  currentItem: EnhancedItem | null;
  newItem: EnhancedItem;
  statChanges: Partial<PlayerStats>;
  improvements: string[];
  downgrades: string[];
  netScore: number;
}

// =============================================================================
// DETAILED EQUIPMENT SLOT DEFINITIONS
// =============================================================================

// Legacy EQUIPMENT_SLOTS removed - use EXTENDED_EQUIPMENT_SLOTS instead
// The old 3-slot system (weapon, armor, accessory) has been replaced with the 10-slot system

export const EXTENDED_EQUIPMENT_SLOTS = {
  helmet: {
    slot: 'helmet' as const,
    displayName: 'Helmet',
    icon: '⛑️',
    acceptedSubtypes: ['helmet'],
    required: false,
    position: { x: 1, y: 0 }, // Grid position for UI
  },
  armor: {
    slot: 'armor' as const,
    displayName: 'Chest Armor',
    icon: '🛡️',
    acceptedSubtypes: ['chestplate'],
    required: false,
    position: { x: 1, y: 1 },
  },
  gloves: {
    slot: 'gloves' as const,
    displayName: 'Gloves',
    icon: '🧤',
    acceptedSubtypes: ['gloves'],
    required: false,
    position: { x: 0, y: 1 },
  },
  boots: {
    slot: 'boots' as const,
    displayName: 'Boots',
    icon: '👢',
    acceptedSubtypes: ['boots'],
    required: false,
    position: { x: 1, y: 2 },
  },
  weapon: {
    slot: 'weapon' as const,
    displayName: 'Main Hand',
    icon: '⚔️',
    acceptedSubtypes: ['sword', 'bow', 'staff', 'dagger'],
    required: false,
    position: { x: 0, y: 0 },
  },
  shield: {
    slot: 'shield' as const,
    displayName: 'Off Hand',
    icon: '🛡️',
    acceptedSubtypes: ['shield'],
    required: false,
    position: { x: 1, y: 3 },
  },
  ring1: {
    slot: 'ring1' as const,
    displayName: 'Ring 1',
    icon: '💍',
    acceptedSubtypes: ['ring'],
    required: false,
    position: { x: 2, y: 0 },
  },
  ring2: {
    slot: 'ring2' as const,
    displayName: 'Ring 2',
    icon: '💍',
    acceptedSubtypes: ['ring'],
    required: false,
    position: { x: 2, y: 1 },
  },
  necklace: {
    slot: 'necklace' as const,
    displayName: 'Necklace',
    icon: '📿',
    acceptedSubtypes: ['necklace'],
    required: false,
    position: { x: 2, y: 2 },
  },
  charm: {
    slot: 'charm' as const,
    displayName: 'Charm',
    icon: '🔮',
    acceptedSubtypes: ['charm'],
    required: false,
    position: { x: 0, y: 2 },
  },
} as const;

// =============================================================================
// STAT CALCULATION SYSTEM
// =============================================================================

export interface StatCalculation {
  baseStat: number;
  equipmentBonus: number;
  levelBonus: number;
  temporaryBonus: number;
  percentage: number;
  finalValue: number;
  breakdown: StatBreakdown[];
}

export interface StatBreakdown {
  source: string;
  type: 'base' | 'equipment' | 'level' | 'buff' | 'debuff' | 'percentage';
  value: number;
  description: string;
  itemId?: string;
  effectId?: string;
}

export interface CalculatedStats {
  attack: StatCalculation;
  defense: StatCalculation;
  magicAttack: StatCalculation;
  magicDefense: StatCalculation;
  speed: StatCalculation;
  accuracy: StatCalculation;
  health: StatCalculation;
  mana: StatCalculation;

  // Derived stats
  criticalChance: StatCalculation;
  criticalDamage: StatCalculation;
  evasion: StatCalculation;
  resistance: StatCalculation;
}

export interface StatModifier {
  stat: keyof PlayerStats;
  type: 'flat' | 'percentage';
  value: number;
  source: string;
  sourceId?: string;
  temporary: boolean;
  duration?: number;
  stacks: boolean;
  maxStacks?: number;
}

// =============================================================================
// EQUIPMENT COMPATIBILITY RULES
// =============================================================================

export interface EquipmentRequirement {
  level?: number;
  classes?: string[];
  stats?: Partial<PlayerStats>;
}

export interface EquipmentCompatibility {
  canEquip: boolean;
  reasons: string[]; // Blocking errors preventing equipping (level, class, stat, slot requirements)
  warnings: string[]; // Non-blocking warnings (two-handed conflicts, suboptimal usage)
  suggestions: string[]; // Helpful hints for the player
}

// Detailed compatibility types (for advanced usage if needed)
export interface CompatibilityReason {
  type:
    | 'level_requirement'
    | 'class_requirement'
    | 'stat_requirement'
    | 'slot_conflict'
    | 'set_requirement';
  satisfied: boolean;
  current: any;
  required: any;
  description: string;
}

export interface CompatibilityWarning {
  type:
    | 'stat_decrease'
    | 'set_bonus_lost'
    | 'durability_low'
    | 'weight_limit'
    | 'two_handed_conflict';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedStats?: string[];
}

export const EQUIPMENT_COMPATIBILITY_RULES = {
  // Class restrictions
  classRestrictions: {
    warrior: ['sword', 'chestplate', 'helmet', 'boots', 'gloves'],
    mage: ['staff', 'ring', 'necklace', 'charm'],
    archer: ['bow', 'boots', 'gloves', 'ring'],
    rogue: ['dagger', 'boots', 'gloves', 'charm'],
  },

  // Stat requirements
  statRequirements: {
    sword: { attack: 10 },
    bow: { speed: 8, accuracy: 12 },
    staff: { magicAttack: 10 },
    dagger: { speed: 12, accuracy: 8 },
    chestplate: { defense: 8 },
    helmet: { defense: 5 },
    boots: { speed: 5 },
    gloves: { accuracy: 5 },
  },

  // Slot conflicts (items that can't be equipped together)
  slotConflicts: {
    'two-handed-sword': ['weapon', 'charm'], // Takes both weapon and charm slots
    shield: ['charm'], // Shield conflicts with charm slot
  },

  // Weight restrictions
  weightLimits: {
    warrior: 50,
    mage: 20,
    archer: 30,
    rogue: 25,
  },
} as const;

// =============================================================================
// EQUIPMENT SETS AND BONUSES
// =============================================================================

export interface EquipmentSet {
  id: string;
  name: string;
  description: string;
  items: string[]; // Item IDs that belong to this set
  bonuses: SetBonus[];
  rarity: ItemRarity;
}

export interface SetBonus {
  requiredItems: number; // How many set pieces needed
  name: string;
  description: string;
  statModifiers: StatModifier[];
  specialEffects: SetEffect[];
}

export interface SetEffect {
  id: string;
  name: string;
  description: string;
  type: 'passive' | 'active' | 'triggered';
  trigger?: string; // For triggered effects
  value: any;
}

export interface ActiveEquipmentSets {
  [setId: string]: {
    set: EquipmentSet;
    equippedItems: string[];
    equippedCount: number;
    activeBonuses: SetBonus[];
    availableBonuses: SetBonus[];
  };
}

// =============================================================================
// EQUIPMENT UPGRADE SYSTEM
// =============================================================================

export interface EquipmentUpgrade {
  level: number;
  experience: number;
  experienceToNext: number;
  maxLevel: number;

  // Upgrade effects
  statBonuses: Partial<PlayerStats>;
  specialEffects: string[];

  // Upgrade costs
  upgradeRequirements: UpgradeRequirement[];
}

export interface UpgradeRequirement {
  type: 'material' | 'currency' | 'level';
  itemId?: string;
  amount: number;
  description: string;
}

export interface EnhancementSystem {
  enchantments: Enchantment[];
  gems: Gem[];
  modifications: Modification[];
}

export interface Enchantment {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'accessory';
  effects: StatModifier[];
  cost: number;
  materials: string[];
}

export interface Gem {
  id: string;
  name: string;
  description: string;
  rarity: ItemRarity;
  socketTypes: SocketType[];
  effects: StatModifier[];
}

export type SocketType = 'red' | 'blue' | 'green' | 'yellow' | 'prismatic';

export interface Modification {
  id: string;
  name: string;
  description: string;
  modifies: EquipmentSubtype[];
  effects: StatModifier[];
  requirements: string[];
}

// =============================================================================
// EQUIPMENT VALIDATION UTILITIES
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  value?: any;
}

export interface ValidationWarning {
  code: string;
  message: string;
  recommendation?: string;
}

// =============================================================================
// INVENTORY MANAGEMENT
// =============================================================================

export interface InventoryContainer {
  id: string;
  name: string;
  type: 'main' | 'equipment' | 'materials' | 'quest' | 'storage';
  capacity: number;
  items: InventorySlot[];
  filters: ItemCategory[];
  sortBy: InventorySortOption;
  searchQuery: string;
}

export interface InventorySlot {
  slotId: string;
  item: EnhancedItem | null;
  quantity: number;
  locked: boolean;
  metadata?: {
    isFavorite?: boolean;
    isNew?: boolean;
    lastModified?: Date;
  };
}

export type InventorySortOption =
  | 'name'
  | 'rarity'
  | 'type'
  | 'value'
  | 'quantity'
  | 'level'
  | 'acquired';

export interface InventoryFilter {
  categories: ItemCategory[];
  rarities: ItemRarity[];
  equipmentSlots: EquipmentSlot[];
  usableOnly: boolean;
  tradableOnly: boolean;
  showEquipped?: boolean; // Whether to include equipped items in results (default: false)
  minLevel?: number;
  maxLevel?: number;
  searchText: string;
}

// =============================================================================
// INVENTORY OPERATIONS
// =============================================================================

export interface ItemStack {
  item: EnhancedItem;
  quantity: number;
  maxQuantity: number;
  canStack: boolean;
}

export type ItemOperation =
  | 'add'
  | 'remove'
  | 'use'
  | 'equip'
  | 'unequip'
  | 'move'
  | 'split'
  | 'merge'
  | 'sort'
  | 'drop';

export interface InventoryOperation {
  id: string;
  type: ItemOperation;
  timestamp: Date;
  sourceSlot?: string;
  targetSlot?: string;
  item: EnhancedItem;
  quantity: number;
  result: 'success' | 'failed' | 'partial';
  error?: string;
}

export interface UseItemResult {
  success: boolean;
  consumed: boolean;
  effects: ItemEffect[];
  message: string;
  cooldownRemaining?: number;
}

export interface EquipItemResult {
  success: boolean;
  equipped: EnhancedItem | null;
  unequipped: EnhancedItem | null;
  statChanges: Partial<PlayerStats>;
  message: string;
  errors: string[];
}

// =============================================================================
// COMPREHENSIVE INVENTORY OPERATIONS AND STATE TRANSITIONS
// =============================================================================

export type InventoryOperationType =
  | 'add_item'
  | 'remove_item'
  | 'move_item'
  | 'split_item'
  | 'merge_items'
  | 'use_item'
  | 'equip_item'
  | 'unequip_item'
  | 'drop_item'
  | 'destroy_item'
  | 'sort_container'
  | 'filter_container'
  | 'search_items'
  | 'favorite_item'
  | 'lock_slot'
  | 'unlock_slot'
  | 'expand_container'
  | 'transfer_items'
  | 'bulk_operation'
  | 'auto_sort'
  | 'auto_stack'
  | 'repair_item'
  | 'upgrade_item'
  | 'enchant_item'
  | 'socket_gem'
  | 'salvage_item';

export interface InventoryOperationContext {
  playerId: string;
  sessionId: string;
  gameState: 'exploration' | 'combat' | 'trading' | 'crafting' | 'menu';
  location?: string;
  permissions: InventoryPermission[];
  restrictions: InventoryRestriction[];
}

export interface InventoryPermission {
  operation: InventoryOperationType;
  allowed: boolean;
  reason?: string;
  conditions?: string[];
}

export interface InventoryRestriction {
  type: 'combat_only' | 'out_of_combat' | 'location_based' | 'level_requirement';
  description: string;
  affectedOperations: InventoryOperationType[];
  active: boolean;
}

export interface DetailedInventoryOperation {
  id: string;
  type: InventoryOperationType;
  context: InventoryOperationContext;

  // Operation details
  sourceContainer: string;
  targetContainer?: string;
  sourceSlot: string;
  targetSlot?: string;

  // Item information
  item: EnhancedItem;
  quantity: number;
  metadata?: Record<string, any>;

  // State tracking
  beforeState: InventorySnapshot;
  afterState?: InventorySnapshot;

  // Execution details
  status: OperationStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  retryCount: number;

  // Results
  result?: OperationResult;
  effects?: OperationEffect[];
  warnings?: OperationWarning[];
  errors?: OperationError[];

  // Transaction info
  transactionId?: string;
  batchId?: string;
  parentOperationId?: string;
  childOperationIds?: string[];
}

export type OperationStatus =
  | 'pending'
  | 'validating'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'rolled_back'
  | 'retrying';

export interface OperationResult {
  success: boolean;
  itemsAffected: number;
  slotsModified: string[];
  containersChanged: string[];
  statsChanged: Partial<PlayerStats>;
  effectsApplied: OperationEffect[];
  message: string;
  data?: Record<string, any>;
}

export interface OperationEffect {
  type:
    | 'stat_change'
    | 'health_change'
    | 'mana_change'
    | 'buff_applied'
    | 'debuff_applied'
    | 'cooldown_started';
  description: string;
  value: any;
  duration?: number;
  reversible: boolean;
}

export interface OperationWarning {
  code: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion?: string;
  canProceed: boolean;
}

export interface OperationError {
  code: string;
  category: 'validation' | 'permission' | 'resource' | 'system' | 'network';
  message: string;
  details?: Record<string, any>;
  recoverable: boolean;
  retryAfter?: number;
}

// =============================================================================
// STATE MANAGEMENT AND TRANSITIONS
// =============================================================================

export interface InventoryStateTransition {
  id: string;
  fromState: InventoryState;
  toState: InventoryState;
  trigger: StateTransitionTrigger;
  operations: DetailedInventoryOperation[];
  timestamp: Date;
  reversible: boolean;
  rollbackData?: StateRollbackData;
}

export interface StateTransitionTrigger {
  type: 'user_action' | 'system_event' | 'game_event' | 'external_api';
  source: string;
  description: string;
  data?: Record<string, any>;
}

export interface StateRollbackData {
  snapshotId: string;
  affectedContainers: string[];
  affectedSlots: string[];
  originalOperations: DetailedInventoryOperation[];
  rollbackOperations: DetailedInventoryOperation[];
}

export interface InventorySnapshot {
  id: string;
  timestamp: Date;
  containers: Record<string, InventoryContainerSnapshot>;
  equipment: EquipmentSnapshot;
  metadata: SnapshotMetadata;
  checksum: string;
}

export interface InventoryContainerSnapshot {
  containerId: string;
  capacity: number;
  items: Record<string, InventorySlotSnapshot>;
  filters: InventoryFilter;
  sortBy: InventorySortOption;
  searchQuery: string;
}

export interface InventorySlotSnapshot {
  slotId: string;
  item: EnhancedItem | null;
  quantity: number;
  locked: boolean;
  metadata?: Record<string, any>;
}

export interface EquipmentSnapshot {
  weapon: EnhancedItem | null;
  armor: EnhancedItem | null;
  accessory: EnhancedItem | null;
  helmet: EnhancedItem | null;
  chestplate: EnhancedItem | null;
  boots: EnhancedItem | null;
  gloves: EnhancedItem | null;
  ring1: EnhancedItem | null;
  ring2: EnhancedItem | null;
  necklace: EnhancedItem | null;
  charm: EnhancedItem | null;
}

export interface SnapshotMetadata {
  playerLevel: number;
  location: string;
  gameState: string;
  totalValue: number;
  totalWeight: number;
  itemCount: number;
  version: string;
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

export interface BatchOperation {
  id: string;
  name: string;
  description: string;
  operations: DetailedInventoryOperation[];
  context: InventoryOperationContext;

  // Execution strategy
  strategy: BatchExecutionStrategy;
  parallel: boolean;
  maxConcurrency?: number;
  continueOnError: boolean;

  // State tracking
  status: BatchOperationStatus;
  startTime: Date;
  endTime?: Date;
  progress: BatchProgress;

  // Results
  results: BatchOperationResults;
  rollbackPlan?: BatchRollbackPlan;
}

export type BatchExecutionStrategy = 'sequential' | 'parallel' | 'optimized' | 'transactional';

export type BatchOperationStatus =
  | 'pending'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'partially_completed'
  | 'rolled_back';

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  percentage: number;
  currentOperation?: string;
  estimatedTimeRemaining?: number;
}

export interface BatchOperationResults {
  success: boolean;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  warnings: OperationWarning[];
  errors: OperationError[];
  summary: string;
  detailedResults: OperationResult[];
}

export interface BatchRollbackPlan {
  rollbackOperations: DetailedInventoryOperation[];
  snapshotId: string;
  estimatedDuration: number;
  risks: string[];
}

// =============================================================================
// OPERATION VALIDATION
// =============================================================================

export interface OperationValidator {
  operationType: InventoryOperationType;
  validationRules: ValidationRule[];
  preConditions: PreCondition[];
  postConditions: PostCondition[];
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validator: (operation: DetailedInventoryOperation) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
  blockingOnFailure: boolean;
}

export interface PreCondition {
  id: string;
  description: string;
  check: (state: InventoryState, operation: DetailedInventoryOperation) => boolean;
  errorMessage: string;
}

export interface PostCondition {
  id: string;
  description: string;
  check: (
    beforeState: InventoryState,
    afterState: InventoryState,
    operation: DetailedInventoryOperation
  ) => boolean;
  errorMessage: string;
}

export interface OperationValidationResult {
  valid: boolean;
  canProceed: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  estimatedImpact: OperationImpact;
}

export interface ValidationSuggestion {
  type: 'alternative_action' | 'parameter_adjustment' | 'timing_change' | 'prerequisite';
  description: string;
  action?: string;
  data?: Record<string, any>;
}

export interface OperationImpact {
  affectedSlots: number;
  affectedContainers: number;
  statChanges: Partial<PlayerStats>;
  resourceChanges: Record<string, number>;
  riskLevel: 'low' | 'medium' | 'high';
  reversible: boolean;
}

// =============================================================================
// OPERATION QUEUE AND SCHEDULING
// =============================================================================

export interface OperationQueue {
  id: string;
  name: string;
  operations: QueuedOperation[];
  status: QueueStatus;
  priority: QueuePriority;

  // Execution settings
  autoExecute: boolean;
  maxConcurrency: number;
  executionDelay: number;
  retryPolicy: RetryPolicy;

  // State tracking
  currentOperation?: string;
  executedCount: number;
  failedCount: number;
  totalCount: number;

  // Metadata
  createdAt: Date;
  lastExecuted?: Date;
  estimatedDuration: number;
}

export interface QueuedOperation {
  operation: DetailedInventoryOperation;
  priority: number;
  scheduledTime?: Date;
  dependencies: string[]; // Operation IDs this depends on
  retries: number;
  maxRetries: number;
  status: 'queued' | 'executing' | 'completed' | 'failed' | 'skipped';
}

export type QueueStatus = 'idle' | 'executing' | 'paused' | 'draining' | 'error';
export type QueuePriority = 'low' | 'normal' | 'high' | 'critical';

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
  retryConditions: RetryCondition[];
}

export interface RetryCondition {
  errorType: string;
  shouldRetry: boolean;
  customDelay?: number;
}

// =============================================================================
// OPERATION HISTORY AND ANALYTICS
// =============================================================================

export interface OperationHistory {
  operations: DetailedInventoryOperation[];
  transitions: InventoryStateTransition[];
  snapshots: InventorySnapshot[];

  // Analytics
  totalOperations: number;
  operationsByType: Record<InventoryOperationType, number>;
  averageExecutionTime: Record<InventoryOperationType, number>;
  successRate: Record<InventoryOperationType, number>;

  // Performance metrics
  peakOperationsPerSecond: number;
  averageOperationsPerSession: number;
  mostCommonOperations: InventoryOperationType[];
  errorPatterns: OperationErrorPattern[];
}

export interface OperationErrorPattern {
  errorCode: string;
  frequency: number;
  operations: InventoryOperationType[];
  commonConditions: string[];
  suggestedFixes: string[];
}

export interface OperationMetrics {
  executionTime: number;
  resourceUsage: ResourceUsage;
  complexity: OperationComplexity;
  impactScore: number;
}

export interface ResourceUsage {
  memoryDelta: number;
  cpuTime: number;
  networkCalls: number;
  storageWrites: number;
}

export interface OperationComplexity {
  itemsInvolved: number;
  containersAccessed: number;
  validationsPerformed: number;
  stateChanges: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
}

// =============================================================================
// INVENTORY STATE
// =============================================================================

export interface InventoryState {
  containers: Record<string, InventoryContainer>;
  equipped: EquipmentSet;
  totalCapacity: number;
  usedCapacity: number;
  totalWeight: number;
  maxWeight: number;

  // UI state
  activeContainer: string;
  selectedItems: string[];
  draggedItem: string | null;

  // Operation history
  recentOperations: InventoryOperation[];

  // Settings
  autoSort: boolean;
  autoStack: boolean;
  showQuantities: boolean;
  compactView: boolean;

  // Search and filters
  globalFilter: InventoryFilter;
  savedFilters: Record<string, InventoryFilter>;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface ItemTooltip {
  item: EnhancedItem;
  showComparison: boolean;
  comparedItem?: EnhancedItem;
  position: { x: number; y: number };
}

export interface InventoryConfiguration {
  defaultCapacity: number;
  maxWeight: number;
  enableAutoSort: boolean;
  enableAutoStack: boolean;
  showNewItemNotifications: boolean;
  itemTooltipDelay: number;
  dragAndDropEnabled: boolean;
}

// =============================================================================
// EVENTS AND CALLBACKS
// =============================================================================

export type InventoryEventType =
  | 'item_added'
  | 'item_removed'
  | 'item_used'
  | 'item_equipped'
  | 'item_unequipped'
  | 'inventory_full'
  | 'container_changed';

export interface InventoryEvent {
  type: InventoryEventType;
  timestamp: Date;
  item?: EnhancedItem;
  quantity?: number;
  container?: string;
  slot?: string;
  metadata?: Record<string, any>;
}

export type InventoryEventCallback = (event: InventoryEvent) => void;

// =============================================================================
// ERROR TYPES
// =============================================================================

export enum InventoryError {
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  INVENTORY_FULL = 'INVENTORY_FULL',
  INVALID_QUANTITY = 'INVALID_QUANTITY',
  CANNOT_EQUIP = 'CANNOT_EQUIP',
  LEVEL_REQUIREMENT_NOT_MET = 'LEVEL_REQUIREMENT_NOT_MET',
  CLASS_REQUIREMENT_NOT_MET = 'CLASS_REQUIREMENT_NOT_MET',
  ITEM_ON_COOLDOWN = 'ITEM_ON_COOLDOWN',
  INVALID_OPERATION = 'INVALID_OPERATION',
  SLOT_LOCKED = 'SLOT_LOCKED',
  WEIGHT_LIMIT_EXCEEDED = 'WEIGHT_LIMIT_EXCEEDED',
}

export class InventoryException extends Error {
  constructor(
    public errorCode: InventoryError,
    message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'InventoryException';
  }
}
