/**
 * Experience and Progression System Type Definitions
 *
 * Comprehensive XP tracking, leveling mechanics, and character progression
 * with detailed activity breakdown and achievement milestones.
 */

import { PlayerStats } from './game';

// =============================================================================
// EXPERIENCE SOURCES AND ACTIVITIES
// =============================================================================

export type ExperienceSource =
  | 'combat' | 'quest_completion' | 'exploration' | 'creature_capture'
  | 'crafting' | 'trading' | 'story_progression' | 'discovery'
  | 'achievement' | 'daily_bonus' | 'special_event';

export interface ExperienceGain {
  id: string;
  timestamp: Date;
  source: ExperienceSource;
  amount: number;
  baseAmount: number;
  multipliers: ExperienceMultiplier[];
  description: string;
  location?: string;
  relatedEntityId?: string; // Monster ID, Quest ID, etc.
  metadata?: Record<string, any>;
}

export interface ExperienceMultiplier {
  type: 'level_difference' | 'difficulty' | 'bonus_event' | 'equipment' | 'achievement';
  value: number; // 1.0 = no change, 1.5 = 50% bonus, 0.5 = 50% penalty
  description: string;
  source?: string;
}

// =============================================================================
// LEVELING SYSTEM
// =============================================================================

export interface LevelInfo {
  currentLevel: number;
  currentExperience: number;
  experienceToNext: number;
  experienceFromPrevious: number;
  totalExperience: number;

  // Level brackets
  experienceForCurrentLevel: number;
  experienceForNextLevel: number;
  progressPercentage: number; // 0-100
}

export interface LevelUpEvent {
  id: string;
  timestamp: Date;
  fromLevel: number;
  toLevel: number;
  experienceGained: number;

  // Rewards and changes
  statGains: Partial<PlayerStats>;
  healthGain: number;
  manaGain: number;
  skillPointsGained: number;
  newAbilities: string[];

  // Context
  triggeringActivity?: ExperienceSource;
  location?: string;
  message: string;
}

export interface LevelCalculation {
  level: number;
  requiredExperience: number;
  cumulativeExperience: number;
  statGrowth: Partial<PlayerStats>;
  healthGrowth: number;
  manaGrowth: number;
}

// =============================================================================
// EXPERIENCE BREAKDOWN AND STATISTICS
// =============================================================================

export interface ExperienceBreakdown {
  totalExperience: number;
  bySource: Record<ExperienceSource, ExperienceSourceStats>;
  recentGains: ExperienceGain[];
  todayGains: ExperienceGain[];
  weekGains: ExperienceGain[];

  // Performance metrics
  averagePerHour: number;
  averagePerSession: number;
  mostProductiveHour: number;
  mostProductiveDay: string;
  longestSession: number;
}

export interface ExperienceSourceStats {
  totalAmount: number;
  totalGains: number;
  percentage: number;
  averageGain: number;
  bestGain: number;
  lastGain?: Date;
  trend: 'increasing' | 'stable' | 'decreasing';
}

// =============================================================================
// PROGRESSION TRACKING
// =============================================================================

export interface ProgressionMilestone {
  id: string;
  name: string;
  description: string;
  type: 'level' | 'experience' | 'activity' | 'achievement';

  // Requirements
  requirement: ProgressionRequirement;

  // Rewards
  rewards: ProgressionReward[];

  // Status
  unlocked: boolean;
  completed: boolean;
  progress: number; // 0-100
  unlockedAt?: Date;
  completedAt?: Date;
}

export interface ProgressionRequirement {
  type: 'reach_level' | 'gain_experience' | 'complete_activities' | 'defeat_enemies';
  target: number;
  current: number;
  description: string;
  metadata?: Record<string, any>;
}

export interface ProgressionReward {
  type: 'experience' | 'item' | 'ability' | 'stat_boost' | 'title';
  value: number | string;
  description: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// ACTIVITY TRACKING
// =============================================================================

export interface ActivitySession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes

  // Experience tracking
  startingExperience: number;
  endingExperience: number;
  experienceGained: number;

  // Activity breakdown
  activitiesPerformed: ActivityPerformed[];
  experienceBySource: Record<ExperienceSource, number>;

  // Performance metrics
  experiencePerMinute: number;
  efficiency: number; // 0-100 score
  focus: ExperienceSource[]; // Most active sources
}

export interface ActivityPerformed {
  type: ExperienceSource;
  count: number;
  totalExperience: number;
  averageExperience: number;
  timeSpent: number; // in minutes
}

// =============================================================================
// PROGRESSION HISTORY
// =============================================================================

export interface ProgressionHistory {
  levelingHistory: LevelUpEvent[];
  experienceHistory: ExperienceHistoryEntry[];
  milestoneHistory: MilestoneCompletion[];
  sessionHistory: ActivitySession[];

  // Statistics
  totalPlayTime: number; // in minutes
  averageSessionLength: number;
  longestSession: number;
  totalLevelsGained: number;
  fastestLevelUp: number; // in minutes

  // Trends
  experienceTrend: ExperienceTrendData[];
  levelingTrend: LevelingTrendData[];
}

export interface ExperienceHistoryEntry {
  timestamp: Date;
  totalExperience: number;
  level: number;
  source: ExperienceSource;
  amount: number;
  session: string; // Session ID
}

export interface MilestoneCompletion {
  milestoneId: string;
  completedAt: Date;
  rewardsReceived: ProgressionReward[];
  experienceBonus: number;
}

export interface ExperienceTrendData {
  date: string; // YYYY-MM-DD
  totalExperience: number;
  dailyGain: number;
  level: number;
  efficiency: number;
}

export interface LevelingTrendData {
  level: number;
  reachedAt: Date;
  timeToReach: number; // minutes from previous level
  experienceRequired: number;
  efficiency: number;
}

// =============================================================================
// EXPERIENCE MODIFIERS AND BONUSES
// =============================================================================

export interface ExperienceModifier {
  id: string;
  name: string;
  description: string;
  type: 'permanent' | 'temporary' | 'conditional';

  // Effect
  multiplier: number;
  flatBonus: number;
  appliesTo: ExperienceSource[];

  // Conditions
  conditions?: ExperienceCondition[];

  // Duration (for temporary modifiers)
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in minutes

  // Source
  source: 'item' | 'achievement' | 'event' | 'ability' | 'location';
  sourceId?: string;
}

export interface ExperienceCondition {
  type: 'level_range' | 'location' | 'time_of_day' | 'activity_type' | 'enemy_type';
  value: any;
  description: string;
}

export interface ExperienceEvent {
  id: string;
  name: string;
  description: string;
  type: 'double_experience' | 'bonus_weekend' | 'special_event';

  // Timing
  startTime: Date;
  endTime: Date;
  isActive: boolean;

  // Effects
  multiplier: number;
  appliesTo: ExperienceSource[];

  // Restrictions
  maxLevel?: number;
  locations?: string[];
  requirements?: string[];
}

// =============================================================================
// SKILL AND ABILITY PROGRESSION
// =============================================================================

export interface SkillTree {
  skills: Record<string, Skill>;
  categories: SkillCategory[];
  unlockedSkills: string[];
  availablePoints: number;
  totalPointsEarned: number;
  totalPointsSpent: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  tier: number;

  // Requirements
  levelRequirement: number;
  prerequisites: string[]; // Other skill IDs
  cost: number; // Skill points

  // Effects
  effects: SkillEffect[];

  // Status
  unlocked: boolean;
  learned: boolean;
  masteryLevel: number; // 0-10
  experience: number;

  // Visual
  icon: string;
  position: { x: number; y: number };
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  skills: string[]; // Skill IDs
}

export interface SkillEffect {
  type: 'stat_bonus' | 'ability_unlock' | 'passive_effect' | 'active_ability';
  description: string;
  value: any;
  scaling?: number; // How effect scales with mastery level
}

// =============================================================================
// ACHIEVEMENT SYSTEM
// =============================================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

  // Requirements
  requirements: AchievementRequirement[];
  hidden: boolean; // Whether to show before completion

  // Rewards
  experienceReward: number;
  titleReward?: string;
  itemRewards?: string[];
  modifierRewards?: ExperienceModifier[];

  // Progress
  progress: number; // 0-100
  unlocked: boolean;
  completed: boolean;
  completedAt?: Date;

  // Visual
  icon: string;
  badge?: string;
}

export type AchievementCategory =
  | 'combat' | 'exploration' | 'collection' | 'progression'
  | 'social' | 'creativity' | 'challenge' | 'secret';

export interface AchievementRequirement {
  type: 'reach_level' | 'gain_experience' | 'defeat_enemies' | 'discover_areas' | 'collect_creatures';
  target: number;
  current: number;
  description: string;
}

// =============================================================================
// EXPERIENCE STATE MANAGEMENT
// =============================================================================

export interface ExperienceState {
  // Current status
  level: LevelInfo;
  breakdown: ExperienceBreakdown;

  // Progression systems
  milestones: ProgressionMilestone[];
  achievements: Achievement[];
  skillTree: SkillTree;

  // Tracking
  currentSession: ActivitySession | null;
  history: ProgressionHistory;

  // Modifiers
  activeModifiers: ExperienceModifier[];
  activeEvents: ExperienceEvent[];

  // Settings
  settings: ExperienceSettings;
}

export interface ExperienceSettings {
  showDetailedBreakdown: boolean;
  showLevelUpAnimations: boolean;
  showExperienceGainNotifications: boolean;
  showMilestoneNotifications: boolean;
  experienceGainSound: boolean;
  levelUpSound: boolean;

  // Display preferences
  showProgressBars: boolean;
  showPercentages: boolean;
  compactView: boolean;

  // History settings
  trackDetailedHistory: boolean;
  maxHistoryEntries: number;
}

// =============================================================================
// OPERATIONS AND EVENTS
// =============================================================================

export type ExperienceOperation =
  | 'gain_experience' | 'level_up' | 'complete_milestone'
  | 'unlock_achievement' | 'learn_skill' | 'start_session' | 'end_session';

export interface ExperienceOperationResult {
  success: boolean;
  operation: ExperienceOperation;
  changes: ExperienceStateChange[];
  notifications: ExperienceNotification[];
  error?: string;
}

export interface ExperienceStateChange {
  type: 'experience' | 'level' | 'skill' | 'achievement' | 'milestone';
  before: any;
  after: any;
  description: string;
}

export interface ExperienceNotification {
  type: 'experience_gain' | 'level_up' | 'milestone' | 'achievement' | 'skill';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  icon?: string;
  duration?: number; // in seconds
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: string;
  data?: any;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export enum ExperienceError {
  INSUFFICIENT_EXPERIENCE = 'INSUFFICIENT_EXPERIENCE',
  LEVEL_CAP_REACHED = 'LEVEL_CAP_REACHED',
  SKILL_REQUIREMENTS_NOT_MET = 'SKILL_REQUIREMENTS_NOT_MET',
  ACHIEVEMENT_ALREADY_COMPLETED = 'ACHIEVEMENT_ALREADY_COMPLETED',
  INVALID_EXPERIENCE_SOURCE = 'INVALID_EXPERIENCE_SOURCE',
  SESSION_ALREADY_ACTIVE = 'SESSION_ALREADY_ACTIVE',
  NO_ACTIVE_SESSION = 'NO_ACTIVE_SESSION'
}

export class ExperienceException extends Error {
  constructor(
    public errorCode: ExperienceError,
    message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ExperienceException';
  }
}