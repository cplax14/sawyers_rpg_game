/**
 * Creature Collection System Type Definitions
 *
 * Extends the base Monster types with comprehensive creature collection,
 * breeding mechanics, and combat companion functionality.
 */

import { Monster, Ability, PlayerStats } from './game';

// =============================================================================
// CREATURE ENHANCEMENTS
// =============================================================================

export type CreatureRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythical';

export type CreatureType =
  | 'beast' | 'elemental' | 'undead' | 'dragon' | 'spirit'
  | 'construct' | 'fey' | 'demon' | 'angel' | 'plant' | 'insect';

export type CreatureElement =
  | 'fire' | 'water' | 'earth' | 'air' | 'light' | 'dark'
  | 'ice' | 'lightning' | 'nature' | 'neutral';

export interface EnhancedCreature extends Monster {
  // Collection metadata
  creatureId: string; // Unique instance ID
  species: string; // Base species identifier
  discoveredAt: Date;
  capturedAt?: Date;
  timesEncountered: number;

  // Enhanced classification
  element: CreatureElement;
  creatureType: CreatureType;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan';
  habitat: string[];

  // Individual traits
  personality: CreaturePersonality;
  nature: CreatureNature;
  individualStats: CreatureIndividualStats;

  // Breeding and genetics
  genetics: CreatureGenetics;
  breedingGroup: string[];
  fertility: number;

  // Combat companion features
  companionData?: CreatureCompanionData;

  // Collection status
  collectionStatus: CreatureCollectionStatus;

  // Visual and lore
  sprite: string;
  model?: string;
  description: string;
  loreText: string;
  discoveryLocation: string;
}

// =============================================================================
// CREATURE PERSONALITY AND NATURE
// =============================================================================

export interface CreaturePersonality {
  traits: CreaturePersonalityTrait[];
  mood: CreatureMood;
  loyalty: number; // 0-100
  happiness: number; // 0-100
  energy: number; // 0-100
  sociability: number; // 0-100
}

export type CreaturePersonalityTrait =
  | 'aggressive' | 'docile' | 'playful' | 'serious' | 'curious'
  | 'lazy' | 'energetic' | 'protective' | 'independent' | 'clingy';

export type CreatureMood =
  | 'happy' | 'content' | 'neutral' | 'sad' | 'angry' | 'excited' | 'tired';

export interface CreatureNature {
  name: string;
  statModifiers: Partial<PlayerStats>;
  behaviorModifiers: {
    aggression: number;
    defensiveness: number;
    cooperation: number;
  };
}

export interface CreatureIndividualStats {
  // Individual values (IVs) - genetic potential 0-31
  hpIV: number;
  attackIV: number;
  defenseIV: number;
  magicAttackIV: number;
  magicDefenseIV: number;
  speedIV: number;

  // Effort values (EVs) - training-based growth 0-255
  hpEV: number;
  attackEV: number;
  defenseEV: number;
  magicAttackEV: number;
  magicDefenseEV: number;
  speedEV: number;
}

// =============================================================================
// BREEDING SYSTEM
// =============================================================================

export interface CreatureGenetics {
  parentIds: [string?, string?]; // Up to 2 parents
  generation: number;
  inheritedTraits: InheritedTrait[];
  mutations: CreatureMutation[];
  breedingPotential: number; // Affects breeding success rate
}

export interface InheritedTrait {
  traitName: string;
  source: 'parent1' | 'parent2' | 'random';
  strength: number; // 0-1, affects expression
}

export interface CreatureMutation {
  type: 'stat' | 'ability' | 'appearance' | 'behavior';
  description: string;
  effect: any; // Flexible for different mutation types
  beneficial: boolean;
}

export interface BreedingPair {
  parent1: EnhancedCreature;
  parent2: EnhancedCreature;
  compatibility: number; // 0-100
  successRate: number; // 0-100
  timeRequired: number; // in minutes
  possibleOffspring: BreedingOutcome[];
}

export interface BreedingOutcome {
  species: string;
  probability: number;
  traits: InheritedTrait[];
  estimatedStats: Partial<PlayerStats>;
}

export interface BreedingProcess {
  id: string;
  pair: BreedingPair;
  startTime: Date;
  duration: number;
  progress: number; // 0-100
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  result?: EnhancedCreature;
}

// =============================================================================
// COMBAT COMPANION SYSTEM
// =============================================================================

export interface CreatureCompanionData {
  isCompanion: boolean;
  companionLevel: number;
  experience: number;
  experienceToNext: number;

  // Combat behavior
  combatRole: CreatureCombatRole;
  aiPersonality: CreatureAIPersonality;
  learnedMoves: Ability[];
  availableMoves: Ability[];

  // Companion bonuses
  bondLevel: number; // 0-10, affects performance
  synergy: number; // 0-100, compatibility with player

  // Equipment for companions
  equipment?: {
    accessory?: string;
    enhancer?: string;
  };
}

export type CreatureCombatRole =
  | 'tank' | 'damage' | 'support' | 'healer' | 'debuffer' | 'utility';

export interface CreatureAIPersonality {
  aggression: number; // 0-100
  caution: number; // 0-100
  supportiveness: number; // 0-100
  independence: number; // 0-100
}

// =============================================================================
// COLLECTION AND BESTIARY
// =============================================================================

export interface CreatureCollectionStatus {
  discovered: boolean;
  captured: boolean;
  timesCaptures: number;
  favorite: boolean;
  tags: string[];
  notes: string;
  completionLevel: CreatureCompletionLevel;
}

export type CreatureCompletionLevel =
  | 'unknown' | 'spotted' | 'observed' | 'captured' | 'studied' | 'mastered';

export interface BestiaryEntry {
  species: string;
  discoveryStatus: CreatureCompletionLevel;

  // Basic info (revealed progressively)
  name?: string;
  type?: CreatureType;
  element?: CreatureElement;
  rarity?: CreatureRarity;

  // Detailed info (requires higher completion)
  stats?: Partial<PlayerStats>;
  abilities?: Ability[];
  habitat?: string[];
  behavior?: string;

  // Advanced info (requires mastery)
  breeding?: {
    groups: string[];
    compatibility: Record<string, number>;
  };

  // Collection metadata
  firstSeen?: Date;
  firstCaptured?: Date;
  totalEncounters: number;
  totalCaptures: number;
  specimens: string[]; // IDs of captured creatures

  // Lore and flavor
  loreEntries: LoreEntry[];
}

export interface LoreEntry {
  id: string;
  title: string;
  content: string;
  unlockedAt?: Date;
  requiresCompletion: CreatureCompletionLevel;
}

// =============================================================================
// CREATURE TRADING
// =============================================================================

export interface CreatureTrade {
  id: string;
  trader: 'npc' | 'player';
  traderId: string;

  offered: CreatureTradeOffer;
  requested: CreatureTradeRequest;

  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'expired';
  createdAt: Date;
  expiresAt?: Date;
  completedAt?: Date;
}

export interface CreatureTradeOffer {
  creatures: string[]; // Creature IDs
  items?: string[]; // Item IDs
  currency?: number;
}

export interface CreatureTradeRequest {
  specificCreatures?: string[]; // Specific creature IDs wanted
  speciesRequests?: SpeciesRequest[];
  itemRequests?: string[];
  currencyRequest?: number;
}

export interface SpeciesRequest {
  species: string;
  minLevel?: number;
  maxLevel?: number;
  requiredTraits?: string[];
  preferredNature?: string;
  minStats?: Partial<PlayerStats>;
}

// =============================================================================
// CREATURE MANAGEMENT
// =============================================================================

export interface CreatureCollection {
  creatures: Record<string, EnhancedCreature>;
  bestiary: Record<string, BestiaryEntry>;

  // Active team
  activeTeam: string[]; // Up to 6 creature IDs
  reserves: string[]; // Stored creatures

  // Collection statistics
  totalDiscovered: number;
  totalCaptured: number;
  completionPercentage: number;
  favoriteSpecies: string[];

  // Breeding operations
  activeBreeding: BreedingProcess[];
  breedingHistory: BreedingProcess[];

  // Trading
  activeTrades: CreatureTrade[];
  tradeHistory: CreatureTrade[];

  // Settings
  autoSort: boolean;
  showStats: boolean;
  groupBy: 'species' | 'type' | 'element' | 'rarity' | 'level';
  filter: CreatureFilter;
}

export interface CreatureFilter {
  types: CreatureType[];
  elements: CreatureElement[];
  rarities: CreatureRarity[];
  completionLevels: CreatureCompletionLevel[];
  favorites: boolean;
  companions: boolean;
  breedable: boolean;
  searchText: string;
  minLevel?: number;
  maxLevel?: number;
}

// =============================================================================
// CREATURE OPERATIONS
// =============================================================================

export type CreatureOperation =
  | 'capture' | 'release' | 'rename' | 'favorite' | 'train'
  | 'breed' | 'trade' | 'evolve' | 'heal' | 'feed';

export interface CreatureOperationResult {
  success: boolean;
  operation: CreatureOperation;
  creature?: EnhancedCreature;
  message: string;
  effects?: any[];
  error?: string;
}

export interface CreatureCaptureAttempt {
  creature: Monster;
  captureRate: number;
  playerLevel: number;
  itemUsed?: string;
  success: boolean;
  result?: EnhancedCreature;
  message: string;
}

// =============================================================================
// EVENTS AND NOTIFICATIONS
// =============================================================================

export type CreatureEventType =
  | 'creature_discovered' | 'creature_captured' | 'creature_released'
  | 'breeding_started' | 'breeding_completed' | 'evolution_available'
  | 'companion_leveled' | 'trade_received' | 'rare_encounter';

export interface CreatureEvent {
  type: CreatureEventType;
  timestamp: Date;
  creature?: EnhancedCreature;
  data?: Record<string, any>;
  important: boolean;
  message: string;
}

export type CreatureEventCallback = (event: CreatureEvent) => void;

// =============================================================================
// ERROR HANDLING
// =============================================================================

export enum CreatureError {
  CREATURE_NOT_FOUND = 'CREATURE_NOT_FOUND',
  CAPTURE_FAILED = 'CAPTURE_FAILED',
  BREEDING_INCOMPATIBLE = 'BREEDING_INCOMPATIBLE',
  BREEDING_FAILED = 'BREEDING_FAILED',
  TEAM_FULL = 'TEAM_FULL',
  INVALID_TRADE = 'INVALID_TRADE',
  CREATURE_IN_USE = 'CREATURE_IN_USE',
  INSUFFICIENT_BOND = 'INSUFFICIENT_BOND',
  EVOLUTION_REQUIREMENTS_NOT_MET = 'EVOLUTION_REQUIREMENTS_NOT_MET'
}

export class CreatureException extends Error {
  constructor(
    public errorCode: CreatureError,
    message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CreatureException';
  }
}