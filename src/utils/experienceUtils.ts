export interface ExperienceGain {
  amount: number;
  source: string;
  activity: ExperienceActivity;
  timestamp: number;
  details?: string;
  multiplier?: number;
}

export interface LevelingEvent {
  fromLevel: number;
  toLevel: number;
  timestamp: number;
  totalXP: number;
  source: string;
}

export interface ExperienceBreakdown {
  combat: number;
  quest: number;
  exploration: number;
  creature: number;
  crafting: number;
  trading: number;
  discovery: number;
  achievement: number;
}

export interface ExperienceHistory {
  gains: ExperienceGain[];
  levelEvents: LevelingEvent[];
  sessionStart: number;
  totalGainedThisSession: number;
  activitiesThisSession: Set<ExperienceActivity>;
}

export type ExperienceActivity =
  | 'combat'
  | 'quest'
  | 'exploration'
  | 'creature'
  | 'crafting'
  | 'trading'
  | 'discovery'
  | 'achievement';

export interface ExperienceMultiplier {
  name: string;
  multiplier: number;
  duration?: number;
  expiresAt?: number;
  source: string;
}

export interface LevelRequirements {
  level: number;
  requiredXP: number;
  cumulativeXP: number;
}

const BASE_XP_PER_LEVEL = 100;
const XP_SCALING_FACTOR = 1.15;
export const MAX_LEVEL = 100;

export const ACTIVITY_BASE_XP: Record<ExperienceActivity, number> = {
  combat: 25,
  quest: 50,
  exploration: 15,
  creature: 30,
  crafting: 20,
  trading: 10,
  discovery: 35,
  achievement: 100,
};

const ACTIVITY_VARIANCE: Record<ExperienceActivity, { min: number; max: number }> = {
  combat: { min: 0.8, max: 1.5 },
  quest: { min: 1.0, max: 2.0 },
  exploration: { min: 0.7, max: 1.3 },
  creature: { min: 0.9, max: 1.8 },
  crafting: { min: 0.8, max: 1.4 },
  trading: { min: 0.6, max: 1.2 },
  discovery: { min: 1.2, max: 2.5 },
  achievement: { min: 1.0, max: 3.0 },
};

export class ExperienceCalculator {
  private static levelRequirementsCache: Map<number, LevelRequirements> = new Map();

  static calculateRequiredXP(level: number): number {
    if (level <= 1) return 0;
    if (level > MAX_LEVEL) return this.calculateRequiredXP(MAX_LEVEL);

    const cached = this.levelRequirementsCache.get(level);
    if (cached) return cached.requiredXP;

    let totalXP = 0;
    for (let i = 2; i <= level; i++) {
      const levelXP = Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_SCALING_FACTOR, i - 2));
      totalXP += levelXP;
    }

    const requirements: LevelRequirements = {
      level,
      requiredXP: totalXP,
      cumulativeXP: totalXP,
    };

    this.levelRequirementsCache.set(level, requirements);
    return totalXP;
  }

  static calculateLevel(currentXP: number): number {
    if (currentXP <= 0) return 1;

    let level = 1;
    while (level < MAX_LEVEL && this.calculateRequiredXP(level + 1) <= currentXP) {
      level++;
    }
    return level;
  }

  static getXPForNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    if (currentLevel >= MAX_LEVEL) return 0;
    return this.calculateRequiredXP(currentLevel + 1) - currentXP;
  }

  static getProgressToNextLevel(currentXP: number): number {
    const currentLevel = this.calculateLevel(currentXP);
    if (currentLevel >= MAX_LEVEL) return 100;

    const currentLevelXP = this.calculateRequiredXP(currentLevel);
    const nextLevelXP = this.calculateRequiredXP(currentLevel + 1);
    const progressXP = currentXP - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;

    return Math.min((progressXP / neededXP) * 100, 100);
  }

  static calculateBaseXP(
    activity: ExperienceActivity,
    difficulty?: number,
    playerLevel?: number
  ): number {
    const baseXP = ACTIVITY_BASE_XP[activity];
    const variance = ACTIVITY_VARIANCE[activity];

    const difficultyMultiplier = difficulty ? Math.max(0.5, Math.min(2.0, difficulty / 10)) : 1.0;

    const levelScaling = playerLevel ? Math.max(0.8, 1 + (playerLevel - 10) * 0.02) : 1.0;

    const randomVariance = variance.min + Math.random() * (variance.max - variance.min);

    return Math.floor(baseXP * difficultyMultiplier * levelScaling * randomVariance);
  }

  static applyMultipliers(baseXP: number, multipliers: ExperienceMultiplier[]): number {
    const now = Date.now();
    let totalMultiplier = 1.0;

    for (const mult of multipliers) {
      if (mult.expiresAt && mult.expiresAt < now) continue;
      totalMultiplier *= mult.multiplier;
    }

    return Math.floor(baseXP * totalMultiplier);
  }
}

export class ExperienceTracker {
  private history: ExperienceHistory;
  private multipliers: ExperienceMultiplier[];
  private listeners: ((gain: ExperienceGain) => void)[];

  constructor(initialHistory?: Partial<ExperienceHistory>) {
    this.history = {
      gains: [],
      levelEvents: [],
      sessionStart: Date.now(),
      totalGainedThisSession: 0,
      activitiesThisSession: new Set(),
      ...initialHistory,
    };
    this.multipliers = [];
    this.listeners = [];
  }

  addExperienceGain(
    activity: ExperienceActivity,
    baseAmount: number,
    source: string,
    details?: string
  ): ExperienceGain {
    const multiplier = this.getTotalMultiplier();
    const finalAmount = Math.floor(baseAmount * multiplier);

    const gain: ExperienceGain = {
      amount: finalAmount,
      source,
      activity,
      timestamp: Date.now(),
      details,
      multiplier: multiplier !== 1.0 ? multiplier : undefined,
    };

    this.history.gains.push(gain);
    this.history.totalGainedThisSession += finalAmount;
    this.history.activitiesThisSession.add(activity);

    this.listeners.forEach(listener => listener(gain));

    return gain;
  }

  recordLevelUp(fromLevel: number, toLevel: number, totalXP: number, source: string): void {
    const event: LevelingEvent = {
      fromLevel,
      toLevel,
      timestamp: Date.now(),
      totalXP,
      source,
    };

    this.history.levelEvents.push(event);
  }

  addMultiplier(multiplier: ExperienceMultiplier): void {
    this.multipliers.push(multiplier);
  }

  removeMultiplier(name: string): void {
    this.multipliers = this.multipliers.filter(m => m.name !== name);
  }

  private getTotalMultiplier(): number {
    const now = Date.now();
    this.multipliers = this.multipliers.filter(m => !m.expiresAt || m.expiresAt > now);

    return this.multipliers.reduce((total, mult) => total * mult.multiplier, 1.0);
  }

  getExperienceBreakdown(timeRange?: { start?: number; end?: number }): ExperienceBreakdown {
    const breakdown: ExperienceBreakdown = {
      combat: 0,
      quest: 0,
      exploration: 0,
      creature: 0,
      crafting: 0,
      trading: 0,
      discovery: 0,
      achievement: 0,
    };

    const filteredGains = this.history.gains.filter(gain => {
      if (timeRange?.start && gain.timestamp < timeRange.start) return false;
      if (timeRange?.end && gain.timestamp > timeRange.end) return false;
      return true;
    });

    for (const gain of filteredGains) {
      breakdown[gain.activity] += gain.amount;
    }

    return breakdown;
  }

  getRecentGains(count: number = 10): ExperienceGain[] {
    return this.history.gains.slice(-count).reverse();
  }

  getSessionStats(): {
    totalGained: number;
    averagePerHour: number;
    activitiesCount: number;
    sessionDuration: number;
    topActivity: ExperienceActivity | null;
  } {
    const sessionDuration = Date.now() - this.history.sessionStart;
    const hoursPlayed = sessionDuration / (1000 * 60 * 60);
    const averagePerHour = hoursPlayed > 0 ? this.history.totalGainedThisSession / hoursPlayed : 0;

    const sessionBreakdown = this.getExperienceBreakdown({
      start: this.history.sessionStart,
    });

    const topActivity = Object.entries(sessionBreakdown)
      .filter(([, xp]) => xp > 0)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as ExperienceActivity | null;

    return {
      totalGained: this.history.totalGainedThisSession,
      averagePerHour: Math.floor(averagePerHour),
      activitiesCount: this.history.activitiesThisSession.size,
      sessionDuration,
      topActivity,
    };
  }

  getLevelingHistory(limit: number = 20): LevelingEvent[] {
    return this.history.levelEvents.slice(-limit).reverse();
  }

  getActivityEfficiency(): Record<
    ExperienceActivity,
    {
      totalXP: number;
      gainCount: number;
      averageXP: number;
      lastGain: number;
    }
  > {
    const efficiency: Record<string, any> = {};

    for (const activity of Object.keys(ACTIVITY_BASE_XP) as ExperienceActivity[]) {
      const activityGains = this.history.gains.filter(g => g.activity === activity);
      const totalXP = activityGains.reduce((sum, g) => sum + g.amount, 0);
      const gainCount = activityGains.length;
      const averageXP = gainCount > 0 ? totalXP / gainCount : 0;
      const lastGain =
        activityGains.length > 0 ? activityGains[activityGains.length - 1].timestamp : 0;

      efficiency[activity] = {
        totalXP,
        gainCount,
        averageXP: Math.floor(averageXP),
        lastGain,
      };
    }

    return efficiency as Record<
      ExperienceActivity,
      {
        totalXP: number;
        gainCount: number;
        averageXP: number;
        lastGain: number;
      }
    >;
  }

  onExperienceGain(listener: (gain: ExperienceGain) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) this.listeners.splice(index, 1);
    };
  }

  exportHistory(): ExperienceHistory {
    return { ...this.history };
  }

  importHistory(history: ExperienceHistory): void {
    this.history = { ...history };
  }

  resetSession(): void {
    this.history.sessionStart = Date.now();
    this.history.totalGainedThisSession = 0;
    this.history.activitiesThisSession.clear();
  }
}

export const createExperienceCalculations = (currentXP: number) => ({
  currentLevel: ExperienceCalculator.calculateLevel(currentXP),
  nextLevel: ExperienceCalculator.calculateLevel(currentXP) + 1,
  xpForNext: ExperienceCalculator.getXPForNextLevel(currentXP),
  progressPercent: ExperienceCalculator.getProgressToNextLevel(currentXP),
  requiredForNext: ExperienceCalculator.calculateRequiredXP(
    ExperienceCalculator.calculateLevel(currentXP) + 1
  ),
  requiredForCurrent: ExperienceCalculator.calculateRequiredXP(
    ExperienceCalculator.calculateLevel(currentXP)
  ),
});

export const formatExperienceNumber = (xp: number): string => {
  if (xp >= 1000000) return `${(xp / 1000000).toFixed(1)}M`;
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}K`;
  return xp.toString();
};

export const calculateCombatXP = (
  enemyLevel: number,
  playerLevel: number,
  victory: boolean,
  overkill: boolean = false
): number => {
  if (!victory) return Math.floor(ACTIVITY_BASE_XP.combat * 0.1);

  const levelDifference = enemyLevel - playerLevel;
  const difficultyBonus = Math.max(0.5, 1 + levelDifference * 0.1);
  const overkillBonus = overkill ? 1.5 : 1.0;

  return (
    ExperienceCalculator.calculateBaseXP('combat', enemyLevel, playerLevel) *
    difficultyBonus *
    overkillBonus
  );
};

export const calculateQuestXP = (
  questLevel: number,
  playerLevel: number,
  completion: 'partial' | 'complete' | 'perfect'
): number => {
  const completionMultiplier = {
    partial: 0.5,
    complete: 1.0,
    perfect: 1.5,
  }[completion];

  return (
    ExperienceCalculator.calculateBaseXP('quest', questLevel, playerLevel) * completionMultiplier
  );
};

export const calculateCreatureXP = (
  creatureRarity: number,
  playerLevel: number,
  action: 'capture' | 'breed' | 'release'
): number => {
  const actionMultiplier = {
    capture: 1.0,
    breed: 0.8,
    release: 0.3,
  }[action];

  return (
    ExperienceCalculator.calculateBaseXP('creature', creatureRarity * 2, playerLevel) *
    actionMultiplier
  );
};

export default {
  ExperienceCalculator,
  ExperienceTracker,
  createExperienceCalculations,
  formatExperienceNumber,
  calculateCombatXP,
  calculateQuestXP,
  calculateCreatureXP,
  ACTIVITY_BASE_XP,
  MAX_LEVEL,
};
