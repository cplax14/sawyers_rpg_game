/**
 * useExperience Hook
 *
 * Comprehensive experience tracking and leveling system for character progression.
 * Handles XP gain, level calculations, milestones, achievements, and detailed analytics.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useGameState } from '@/contexts/ReactGameContext';
import {
  ExperienceState,
  LevelInfo,
  ExperienceGain,
  ExperienceBreakdown,
  LevelUpEvent,
  ExperienceSource,
  ExperienceMultiplier,
  ActivitySession,
  ProgressionMilestone,
  Achievement,
  ExperienceModifier,
  ExperienceOperationResult,
  ExperienceOperation,
  ExperienceNotification,
  ExperienceSettings,
  ProgressionHistory,
  LevelCalculation,
  ExperienceError,
  ExperienceException,
  SkillTree,
  Skill,
  ExperienceEvent
} from '@/types/experience';
import { PlayerStats } from '@/types/game';

interface UseExperienceReturn {
  // Core state
  experienceState: ExperienceState;
  levelInfo: LevelInfo;
  breakdown: ExperienceBreakdown;

  // Experience operations
  gainExperience: (source: ExperienceSource, amount: number, description: string, metadata?: Record<string, any>) => Promise<ExperienceOperationResult>;
  checkLevelUp: () => LevelUpEvent | null;
  processLevelUp: () => Promise<ExperienceOperationResult>;

  // Session management
  startSession: () => Promise<ExperienceOperationResult>;
  endSession: () => Promise<ExperienceOperationResult>;
  getCurrentSession: () => ActivitySession | null;

  // Progression tracking
  checkMilestones: () => ProgressionMilestone[];
  completeMilestone: (milestoneId: string) => Promise<ExperienceOperationResult>;
  unlockAchievement: (achievementId: string) => Promise<ExperienceOperationResult>;

  // Skill system
  learnSkill: (skillId: string) => Promise<ExperienceOperationResult>;
  getAvailableSkills: () => Skill[];
  getSkillRequirements: (skillId: string) => { met: boolean; missing: string[] };

  // Statistics and analytics
  getExperienceToNext: (level?: number) => number;
  getExperienceForLevel: (level: number) => number;
  calculateLevelFromExperience: (experience: number) => number;
  getProgressionStats: () => {
    totalPlayTime: number;
    averageExpPerHour: number;
    levelsThisWeek: number;
    currentStreak: number;
  };

  // Experience modifiers
  addModifier: (modifier: ExperienceModifier) => void;
  removeModifier: (modifierId: string) => void;
  getActiveMultiplier: (source: ExperienceSource) => number;

  // History and trends
  getRecentGains: (limit?: number) => ExperienceGain[];
  getExperienceTrend: (days: number) => { date: string; experience: number; level: number }[];
  getLevelingHistory: () => LevelUpEvent[];

  // Settings
  updateSettings: (newSettings: Partial<ExperienceSettings>) => void;

  // Utility
  formatExperience: (amount: number) => string;
  getTimeToNextLevel: (currentRate?: number) => number; // in minutes
  simulateLevelProgress: (targetLevel: number) => LevelCalculation[];

  // Events and notifications
  getNotifications: () => ExperienceNotification[];
  clearNotifications: () => void;

  // Loading and error states
  isLoading: boolean;
  error: string | null;
}

export function useExperience(): UseExperienceReturn {
  const { gameState, updateGameState } = useGameState();

  // Local state
  const [experienceState, setExperienceState] = useState<ExperienceState>({
    level: {
      currentLevel: 1,
      currentExperience: 0,
      experienceToNext: 100,
      experienceFromPrevious: 0,
      totalExperience: 0,
      experienceForCurrentLevel: 0,
      experienceForNextLevel: 100,
      progressPercentage: 0
    },
    breakdown: {
      totalExperience: 0,
      bySource: {} as Record<ExperienceSource, any>,
      recentGains: [],
      todayGains: [],
      weekGains: [],
      averagePerHour: 0,
      averagePerSession: 0,
      mostProductiveHour: 0,
      mostProductiveDay: '',
      longestSession: 0
    },
    milestones: [],
    achievements: [],
    skillTree: {
      skills: {},
      categories: [],
      unlockedSkills: [],
      availablePoints: 0,
      totalPointsEarned: 0,
      totalPointsSpent: 0
    },
    currentSession: null,
    history: {
      levelingHistory: [],
      experienceHistory: [],
      milestoneHistory: [],
      sessionHistory: [],
      totalPlayTime: 0,
      averageSessionLength: 0,
      longestSession: 0,
      totalLevelsGained: 0,
      fastestLevelUp: 0,
      experienceTrend: [],
      levelingTrend: []
    },
    activeModifiers: [],
    activeEvents: [],
    settings: {
      showDetailedBreakdown: true,
      showLevelUpAnimations: true,
      showExperienceGainNotifications: true,
      showMilestoneNotifications: true,
      experienceGainSound: true,
      levelUpSound: true,
      showProgressBars: true,
      showPercentages: true,
      compactView: false,
      trackDetailedHistory: true,
      maxHistoryEntries: 1000
    }
  });

  const [notifications, setNotifications] = useState<ExperienceNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs for tracking
  const sessionStartRef = useRef<Date | null>(null);
  const lastSaveRef = useRef<Date>(new Date());

  // Initialize from game state
  useEffect(() => {
    if (gameState.experience) {
      setExperienceState(prev => ({
        ...prev,
        ...gameState.experience
      }));
    } else {
      // Initialize level info from player stats
      const level = gameState.playerStats?.level || 1;
      const exp = gameState.playerStats?.experience || 0;
      updateLevelInfo(level, exp);
    }
  }, [gameState.experience, gameState.playerStats]);

  // Save experience state to game state
  const saveExperienceState = useCallback(async (newState: ExperienceState) => {
    setExperienceState(newState);
    await updateGameState({
      experience: newState,
      playerStats: {
        ...gameState.playerStats,
        level: newState.level.currentLevel,
        experience: newState.level.totalExperience
      }
    });
    lastSaveRef.current = new Date();
  }, [updateGameState, gameState.playerStats]);

  // Experience calculation formulas
  // CONSOLIDATED: Using the same formula as experienceUtils.ts
  // Formula: BASE_XP = 100, scaling = 1.15^level (cumulative)
  const getExperienceForLevel = useCallback((level: number): number => {
    if (level <= 1) return 0;
    if (level > 100) level = 100; // Max level cap

    // Calculate cumulative XP required to reach this level
    let totalXP = 0;
    const BASE_XP_PER_LEVEL = 100;
    const XP_SCALING_FACTOR = 1.15;

    for (let i = 2; i <= level; i++) {
      const levelXP = Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_SCALING_FACTOR, i - 2));
      totalXP += levelXP;
    }

    return totalXP;
  }, []);

  const getExperienceToNext = useCallback((level?: number): number => {
    const currentLevel = level || experienceState.level.currentLevel;
    return getExperienceForLevel(currentLevel + 1) - getExperienceForLevel(currentLevel);
  }, [experienceState.level.currentLevel, getExperienceForLevel]);

  const calculateLevelFromExperience = useCallback((experience: number): number => {
    let level = 1;
    while (getExperienceForLevel(level + 1) <= experience) {
      level++;
    }
    return level;
  }, [getExperienceForLevel]);

  // Update level info based on current experience
  const updateLevelInfo = useCallback((level: number, totalExperience: number) => {
    const experienceForCurrentLevel = getExperienceForLevel(level);
    const experienceForNextLevel = getExperienceForLevel(level + 1);
    const experienceFromPrevious = totalExperience - experienceForCurrentLevel;
    const experienceToNext = experienceForNextLevel - totalExperience;
    const progressPercentage = experienceToNext > 0
      ? (experienceFromPrevious / (experienceForNextLevel - experienceForCurrentLevel)) * 100
      : 100;

    const newLevelInfo: LevelInfo = {
      currentLevel: level,
      currentExperience: totalExperience,
      experienceToNext,
      experienceFromPrevious,
      totalExperience,
      experienceForCurrentLevel,
      experienceForNextLevel,
      progressPercentage: Math.min(100, Math.max(0, progressPercentage))
    };

    setExperienceState(prev => ({
      ...prev,
      level: newLevelInfo
    }));

    return newLevelInfo;
  }, [getExperienceForLevel]);

  // Calculate experience multipliers
  const getActiveMultiplier = useCallback((source: ExperienceSource): number => {
    let multiplier = 1.0;

    // Apply active modifiers
    experienceState.activeModifiers.forEach(modifier => {
      if (modifier.appliesTo.length === 0 || modifier.appliesTo.includes(source)) {
        // Check conditions
        let conditionsMet = true;
        if (modifier.conditions) {
          // Simple condition checking - would need more sophisticated logic
          conditionsMet = modifier.conditions.every(condition => {
            switch (condition.type) {
              case 'level_range':
                const [min, max] = condition.value as [number, number];
                return experienceState.level.currentLevel >= min && experienceState.level.currentLevel <= max;
              default:
                return true;
            }
          });
        }

        if (conditionsMet) {
          multiplier *= modifier.multiplier;
          // Note: flat bonus would be applied after multiplication
        }
      }
    });

    // Apply active events
    experienceState.activeEvents.forEach(event => {
      if (event.isActive && (event.appliesTo.length === 0 || event.appliesTo.includes(source))) {
        multiplier *= event.multiplier;
      }
    });

    return multiplier;
  }, [experienceState.activeModifiers, experienceState.activeEvents, experienceState.level.currentLevel]);

  // Generate experience gain ID
  const generateGainId = useCallback(() => {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Add notification
  const addNotification = useCallback((notification: ExperienceNotification) => {
    setNotifications(prev => [...prev, notification]);

    // Auto-clear notification after duration
    if (notification.duration) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n !== notification));
      }, notification.duration * 1000);
    }
  }, []);

  // Gain experience
  const gainExperience = useCallback(async (
    source: ExperienceSource,
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<ExperienceOperationResult> => {
    try {
      setIsLoading(true);
      setError(null);

      const baseAmount = amount;
      const multiplier = getActiveMultiplier(source);
      const finalAmount = Math.floor(baseAmount * multiplier);

      // Create experience gain record
      const experienceGain: ExperienceGain = {
        id: generateGainId(),
        timestamp: new Date(),
        source,
        amount: finalAmount,
        baseAmount,
        multipliers: [
          {
            type: 'level_difference',
            value: multiplier,
            description: `Active multipliers for ${source}`,
            source: 'system'
          }
        ],
        description,
        location: gameState.currentLocation,
        metadata
      };

      // Update experience state
      const newTotalExperience = experienceState.level.totalExperience + finalAmount;
      const newLevel = calculateLevelFromExperience(newTotalExperience);
      const leveledUp = newLevel > experienceState.level.currentLevel;

      // Update level info
      const newLevelInfo = updateLevelInfo(newLevel, newTotalExperience);

      // Update breakdown
      const newBreakdown = { ...experienceState.breakdown };
      newBreakdown.totalExperience = newTotalExperience;
      newBreakdown.recentGains = [experienceGain, ...newBreakdown.recentGains].slice(0, 50);

      // Update by source stats
      if (!newBreakdown.bySource[source]) {
        newBreakdown.bySource[source] = {
          totalAmount: 0,
          totalGains: 0,
          percentage: 0,
          averageGain: 0,
          bestGain: 0,
          trend: 'stable' as const
        };
      }

      const sourceStats = newBreakdown.bySource[source];
      sourceStats.totalAmount += finalAmount;
      sourceStats.totalGains += 1;
      sourceStats.averageGain = sourceStats.totalAmount / sourceStats.totalGains;
      sourceStats.bestGain = Math.max(sourceStats.bestGain, finalAmount);
      sourceStats.lastGain = new Date();
      sourceStats.percentage = (sourceStats.totalAmount / newTotalExperience) * 100;

      // Update today's gains
      const today = new Date().toDateString();
      newBreakdown.todayGains = [
        experienceGain,
        ...newBreakdown.todayGains.filter(gain => gain.timestamp.toDateString() === today)
      ];

      // Update current session if active
      let updatedSession = experienceState.currentSession;
      if (updatedSession) {
        updatedSession = {
          ...updatedSession,
          endingExperience: newTotalExperience,
          experienceGained: newTotalExperience - updatedSession.startingExperience,
          experienceBySource: {
            ...updatedSession.experienceBySource,
            [source]: (updatedSession.experienceBySource[source] || 0) + finalAmount
          }
        };

        // Update activities performed
        const existingActivity = updatedSession.activitiesPerformed.find(a => a.type === source);
        if (existingActivity) {
          existingActivity.count += 1;
          existingActivity.totalExperience += finalAmount;
          existingActivity.averageExperience = existingActivity.totalExperience / existingActivity.count;
        } else {
          updatedSession.activitiesPerformed.push({
            type: source,
            count: 1,
            totalExperience: finalAmount,
            averageExperience: finalAmount,
            timeSpent: 0 // Would need to track this separately
          });
        }

        // Update efficiency metrics
        const sessionDuration = (Date.now() - updatedSession.startTime.getTime()) / (1000 * 60); // minutes
        updatedSession.duration = sessionDuration;
        updatedSession.experiencePerMinute = updatedSession.experienceGained / Math.max(1, sessionDuration);
      }

      // Create new experience state
      const newExperienceState: ExperienceState = {
        ...experienceState,
        level: newLevelInfo,
        breakdown: newBreakdown,
        currentSession: updatedSession,
        history: {
          ...experienceState.history,
          experienceHistory: [
            {
              timestamp: new Date(),
              totalExperience: newTotalExperience,
              level: newLevel,
              source,
              amount: finalAmount,
              session: updatedSession?.id || 'no_session'
            },
            ...experienceState.history.experienceHistory
          ].slice(0, experienceState.settings.maxHistoryEntries)
        }
      };

      await saveExperienceState(newExperienceState);

      // Create notifications
      const notifications: ExperienceNotification[] = [];

      if (experienceState.settings.showExperienceGainNotifications) {
        notifications.push({
          type: 'experience_gain',
          priority: 'low',
          title: 'Experience Gained',
          message: `+${finalAmount} XP from ${source}${multiplier > 1 ? ` (${multiplier.toFixed(1)}x bonus)` : ''}`,
          duration: 3
        });
      }

      // Add notifications
      notifications.forEach(addNotification);

      const result: ExperienceOperationResult = {
        success: true,
        operation: 'gain_experience',
        changes: [
          {
            type: 'experience',
            before: experienceState.level.totalExperience,
            after: newTotalExperience,
            description: `Gained ${finalAmount} experience from ${source}`
          }
        ],
        notifications
      };

      // Check for level up
      if (leveledUp) {
        const levelUpResult = await processLevelUp();
        result.changes.push(...levelUpResult.changes);
        result.notifications.push(...levelUpResult.notifications);
      }

      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to gain experience';
      setError(error);
      return {
        success: false,
        operation: 'gain_experience',
        changes: [],
        notifications: [],
        error
      };
    } finally {
      setIsLoading(false);
    }
  }, [
    getActiveMultiplier,
    generateGainId,
    gameState.currentLocation,
    experienceState,
    calculateLevelFromExperience,
    updateLevelInfo,
    saveExperienceState,
    addNotification
  ]);

  // Check for level up
  const checkLevelUp = useCallback((): LevelUpEvent | null => {
    const currentLevel = experienceState.level.currentLevel;
    const totalExp = experienceState.level.totalExperience;
    const calculatedLevel = calculateLevelFromExperience(totalExp);

    if (calculatedLevel > currentLevel) {
      // Calculate stat gains for level up
      const statGains: Partial<PlayerStats> = {
        maxHealth: 10 + Math.floor(calculatedLevel / 5),
        maxMana: 5 + Math.floor(calculatedLevel / 3),
        attack: 2 + Math.floor(calculatedLevel / 4),
        defense: 2 + Math.floor(calculatedLevel / 4),
        magicAttack: 1 + Math.floor(calculatedLevel / 5),
        magicDefense: 1 + Math.floor(calculatedLevel / 5),
        speed: 1 + Math.floor(calculatedLevel / 6)
      };

      return {
        id: `levelup_${Date.now()}`,
        timestamp: new Date(),
        fromLevel: currentLevel,
        toLevel: calculatedLevel,
        experienceGained: totalExp - getExperienceForLevel(currentLevel),
        statGains,
        healthGain: statGains.maxHealth || 0,
        manaGain: statGains.maxMana || 0,
        skillPointsGained: calculatedLevel - currentLevel,
        newAbilities: [], // Would need to be defined based on level
        location: gameState.currentLocation,
        message: `Congratulations! You reached level ${calculatedLevel}!`
      };
    }

    return null;
  }, [experienceState.level, calculateLevelFromExperience, getExperienceForLevel, gameState.currentLocation]);

  // Process level up
  const processLevelUp = useCallback(async (): Promise<ExperienceOperationResult> => {
    try {
      const levelUpEvent = checkLevelUp();
      if (!levelUpEvent) {
        return {
          success: false,
          operation: 'level_up',
          changes: [],
          notifications: [],
          error: 'No level up available'
        };
      }

      // Update player stats
      const newPlayerStats = { ...gameState.playerStats };
      Object.entries(levelUpEvent.statGains).forEach(([stat, gain]) => {
        if (gain && stat in newPlayerStats) {
          (newPlayerStats as any)[stat] += gain;
        }
      });

      // Add skill points
      const newSkillTree = {
        ...experienceState.skillTree,
        availablePoints: experienceState.skillTree.availablePoints + levelUpEvent.skillPointsGained,
        totalPointsEarned: experienceState.skillTree.totalPointsEarned + levelUpEvent.skillPointsGained
      };

      // Update experience state
      const newExperienceState = {
        ...experienceState,
        skillTree: newSkillTree,
        history: {
          ...experienceState.history,
          levelingHistory: [levelUpEvent, ...experienceState.history.levelingHistory],
          totalLevelsGained: experienceState.history.totalLevelsGained + (levelUpEvent.toLevel - levelUpEvent.fromLevel)
        }
      };

      await saveExperienceState(newExperienceState);

      // Update player stats in game state
      await updateGameState({
        playerStats: newPlayerStats
      });

      // Create notification
      const notification: ExperienceNotification = {
        type: 'level_up',
        priority: 'critical',
        title: 'Level Up!',
        message: levelUpEvent.message,
        duration: 10
      };

      addNotification(notification);

      return {
        success: true,
        operation: 'level_up',
        changes: [
          {
            type: 'level',
            before: levelUpEvent.fromLevel,
            after: levelUpEvent.toLevel,
            description: `Leveled up to ${levelUpEvent.toLevel}`
          }
        ],
        notifications: [notification]
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to process level up';
      setError(error);
      return {
        success: false,
        operation: 'level_up',
        changes: [],
        notifications: [],
        error
      };
    }
  }, [checkLevelUp, gameState.playerStats, experienceState, saveExperienceState, updateGameState, addNotification]);

  // Start session
  const startSession = useCallback(async (): Promise<ExperienceOperationResult> => {
    try {
      if (experienceState.currentSession) {
        throw new ExperienceException(ExperienceError.SESSION_ALREADY_ACTIVE, 'A session is already active');
      }

      const newSession: ActivitySession = {
        id: `session_${Date.now()}`,
        startTime: new Date(),
        duration: 0,
        startingExperience: experienceState.level.totalExperience,
        endingExperience: experienceState.level.totalExperience,
        experienceGained: 0,
        activitiesPerformed: [],
        experienceBySource: {},
        experiencePerMinute: 0,
        efficiency: 0,
        focus: []
      };

      const newExperienceState = {
        ...experienceState,
        currentSession: newSession
      };

      await saveExperienceState(newExperienceState);
      sessionStartRef.current = new Date();

      return {
        success: true,
        operation: 'start_session',
        changes: [
          {
            type: 'experience',
            before: null,
            after: newSession,
            description: 'Started new experience tracking session'
          }
        ],
        notifications: []
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start session';
      setError(error);
      return {
        success: false,
        operation: 'start_session',
        changes: [],
        notifications: [],
        error
      };
    }
  }, [experienceState, saveExperienceState]);

  // End session
  const endSession = useCallback(async (): Promise<ExperienceOperationResult> => {
    try {
      if (!experienceState.currentSession) {
        throw new ExperienceException(ExperienceError.NO_ACTIVE_SESSION, 'No active session to end');
      }

      const endTime = new Date();
      const duration = (endTime.getTime() - experienceState.currentSession.startTime.getTime()) / (1000 * 60);

      const completedSession: ActivitySession = {
        ...experienceState.currentSession,
        endTime,
        duration,
        experiencePerMinute: experienceState.currentSession.experienceGained / Math.max(1, duration)
      };

      // Calculate efficiency (simple metric based on exp/minute relative to level)
      const expectedExpPerMinute = experienceState.level.currentLevel * 2;
      completedSession.efficiency = Math.min(100, (completedSession.experiencePerMinute / expectedExpPerMinute) * 100);

      // Determine focus areas (top 3 experience sources)
      const sourceEntries = Object.entries(completedSession.experienceBySource);
      sourceEntries.sort((a, b) => b[1] - a[1]);
      completedSession.focus = sourceEntries.slice(0, 3).map(([source]) => source as ExperienceSource);

      const newExperienceState = {
        ...experienceState,
        currentSession: null,
        history: {
          ...experienceState.history,
          sessionHistory: [completedSession, ...experienceState.history.sessionHistory],
          totalPlayTime: experienceState.history.totalPlayTime + duration,
          averageSessionLength:
            (experienceState.history.averageSessionLength * experienceState.history.sessionHistory.length + duration) /
            (experienceState.history.sessionHistory.length + 1),
          longestSession: Math.max(experienceState.history.longestSession, duration)
        }
      };

      await saveExperienceState(newExperienceState);
      sessionStartRef.current = null;

      return {
        success: true,
        operation: 'end_session',
        changes: [
          {
            type: 'experience',
            before: experienceState.currentSession,
            after: null,
            description: `Ended session with ${completedSession.experienceGained} XP gained in ${duration.toFixed(1)} minutes`
          }
        ],
        notifications: []
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to end session';
      setError(error);
      return {
        success: false,
        operation: 'end_session',
        changes: [],
        notifications: [],
        error
      };
    }
  }, [experienceState, saveExperienceState]);

  // Get current session
  const getCurrentSession = useCallback((): ActivitySession | null => {
    return experienceState.currentSession;
  }, [experienceState.currentSession]);

  // Check milestones (simplified implementation)
  const checkMilestones = useCallback((): ProgressionMilestone[] => {
    return experienceState.milestones.filter(milestone =>
      !milestone.completed && milestone.unlocked
    );
  }, [experienceState.milestones]);

  // Complete milestone
  const completeMilestone = useCallback(async (milestoneId: string): Promise<ExperienceOperationResult> => {
    try {
      const milestone = experienceState.milestones.find(m => m.id === milestoneId);
      if (!milestone) {
        throw new Error('Milestone not found');
      }

      if (milestone.completed) {
        throw new Error('Milestone already completed');
      }

      const updatedMilestone = {
        ...milestone,
        completed: true,
        completedAt: new Date()
      };

      const newMilestones = experienceState.milestones.map(m =>
        m.id === milestoneId ? updatedMilestone : m
      );

      const newExperienceState = {
        ...experienceState,
        milestones: newMilestones
      };

      await saveExperienceState(newExperienceState);

      const notification: ExperienceNotification = {
        type: 'milestone',
        priority: 'high',
        title: 'Milestone Completed!',
        message: milestone.name,
        duration: 5
      };

      addNotification(notification);

      return {
        success: true,
        operation: 'complete_milestone',
        changes: [
          {
            type: 'milestone',
            before: milestone,
            after: updatedMilestone,
            description: `Completed milestone: ${milestone.name}`
          }
        ],
        notifications: [notification]
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to complete milestone';
      setError(error);
      return {
        success: false,
        operation: 'complete_milestone',
        changes: [],
        notifications: [],
        error
      };
    }
  }, [experienceState.milestones, saveExperienceState, addNotification]);

  // Unlock achievement
  const unlockAchievement = useCallback(async (achievementId: string): Promise<ExperienceOperationResult> => {
    try {
      const achievement = experienceState.achievements.find(a => a.id === achievementId);
      if (!achievement) {
        throw new Error('Achievement not found');
      }

      if (achievement.completed) {
        throw new ExperienceException(ExperienceError.ACHIEVEMENT_ALREADY_COMPLETED, 'Achievement already completed');
      }

      const updatedAchievement = {
        ...achievement,
        completed: true,
        completedAt: new Date()
      };

      const newAchievements = experienceState.achievements.map(a =>
        a.id === achievementId ? updatedAchievement : a
      );

      const newExperienceState = {
        ...experienceState,
        achievements: newAchievements
      };

      await saveExperienceState(newExperienceState);

      // Gain experience reward
      if (achievement.experienceReward > 0) {
        await gainExperience('achievement', achievement.experienceReward, `Achievement: ${achievement.name}`);
      }

      const notification: ExperienceNotification = {
        type: 'achievement',
        priority: 'high',
        title: 'Achievement Unlocked!',
        message: achievement.name,
        duration: 8
      };

      addNotification(notification);

      return {
        success: true,
        operation: 'unlock_achievement',
        changes: [
          {
            type: 'achievement',
            before: achievement,
            after: updatedAchievement,
            description: `Unlocked achievement: ${achievement.name}`
          }
        ],
        notifications: [notification]
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to unlock achievement';
      setError(error);
      return {
        success: false,
        operation: 'unlock_achievement',
        changes: [],
        notifications: [],
        error
      };
    }
  }, [experienceState.achievements, saveExperienceState, gainExperience, addNotification]);

  // Learn skill
  const learnSkill = useCallback(async (skillId: string): Promise<ExperienceOperationResult> => {
    try {
      const skill = experienceState.skillTree.skills[skillId];
      if (!skill) {
        throw new Error('Skill not found');
      }

      if (skill.learned) {
        throw new Error('Skill already learned');
      }

      if (experienceState.skillTree.availablePoints < skill.cost) {
        throw new ExperienceException(ExperienceError.SKILL_REQUIREMENTS_NOT_MET, 'Insufficient skill points');
      }

      // Check prerequisites
      const unmetPrereqs = skill.prerequisites.filter(prereqId =>
        !experienceState.skillTree.skills[prereqId]?.learned
      );

      if (unmetPrereqs.length > 0) {
        throw new ExperienceException(ExperienceError.SKILL_REQUIREMENTS_NOT_MET, `Prerequisites not met: ${unmetPrereqs.join(', ')}`);
      }

      const updatedSkill = {
        ...skill,
        learned: true,
        unlocked: true
      };

      const newSkillTree = {
        ...experienceState.skillTree,
        skills: {
          ...experienceState.skillTree.skills,
          [skillId]: updatedSkill
        },
        availablePoints: experienceState.skillTree.availablePoints - skill.cost,
        totalPointsSpent: experienceState.skillTree.totalPointsSpent + skill.cost,
        unlockedSkills: [...experienceState.skillTree.unlockedSkills, skillId]
      };

      const newExperienceState = {
        ...experienceState,
        skillTree: newSkillTree
      };

      await saveExperienceState(newExperienceState);

      const notification: ExperienceNotification = {
        type: 'skill',
        priority: 'medium',
        title: 'Skill Learned!',
        message: skill.name,
        duration: 5
      };

      addNotification(notification);

      return {
        success: true,
        operation: 'learn_skill',
        changes: [
          {
            type: 'skill',
            before: skill,
            after: updatedSkill,
            description: `Learned skill: ${skill.name}`
          }
        ],
        notifications: [notification]
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to learn skill';
      setError(error);
      return {
        success: false,
        operation: 'learn_skill',
        changes: [],
        notifications: [],
        error
      };
    }
  }, [experienceState.skillTree, saveExperienceState, addNotification]);

  // Get available skills
  const getAvailableSkills = useCallback((): Skill[] => {
    return Object.values(experienceState.skillTree.skills).filter(skill =>
      !skill.learned &&
      skill.levelRequirement <= experienceState.level.currentLevel &&
      skill.prerequisites.every(prereqId => experienceState.skillTree.skills[prereqId]?.learned)
    );
  }, [experienceState.skillTree.skills, experienceState.level.currentLevel]);

  // Get skill requirements
  const getSkillRequirements = useCallback((skillId: string): { met: boolean; missing: string[] } => {
    const skill = experienceState.skillTree.skills[skillId];
    if (!skill) {
      return { met: false, missing: ['Skill not found'] };
    }

    const missing: string[] = [];

    if (skill.levelRequirement > experienceState.level.currentLevel) {
      missing.push(`Level ${skill.levelRequirement} required`);
    }

    if (experienceState.skillTree.availablePoints < skill.cost) {
      missing.push(`${skill.cost} skill points required`);
    }

    const unmetPrereqs = skill.prerequisites.filter(prereqId =>
      !experienceState.skillTree.skills[prereqId]?.learned
    );

    unmetPrereqs.forEach(prereqId => {
      const prereqSkill = experienceState.skillTree.skills[prereqId];
      missing.push(`Prerequisite: ${prereqSkill?.name || prereqId}`);
    });

    return {
      met: missing.length === 0,
      missing
    };
  }, [experienceState.skillTree, experienceState.level.currentLevel]);

  // Get progression stats
  const getProgressionStats = useCallback(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekGains = experienceState.breakdown.recentGains.filter(gain =>
      gain.timestamp >= weekAgo
    );

    const levelsThisWeek = experienceState.history.levelingHistory.filter(level =>
      level.timestamp >= weekAgo
    ).length;

    return {
      totalPlayTime: experienceState.history.totalPlayTime,
      averageExpPerHour: experienceState.breakdown.averagePerHour,
      levelsThisWeek,
      currentStreak: 0 // Would need to implement streak calculation
    };
  }, [experienceState.breakdown, experienceState.history]);

  // Add modifier
  const addModifier = useCallback((modifier: ExperienceModifier) => {
    setExperienceState(prev => ({
      ...prev,
      activeModifiers: [...prev.activeModifiers, modifier]
    }));
  }, []);

  // Remove modifier
  const removeModifier = useCallback((modifierId: string) => {
    setExperienceState(prev => ({
      ...prev,
      activeModifiers: prev.activeModifiers.filter(m => m.id !== modifierId)
    }));
  }, []);

  // Get recent gains
  const getRecentGains = useCallback((limit: number = 10): ExperienceGain[] => {
    return experienceState.breakdown.recentGains.slice(0, limit);
  }, [experienceState.breakdown.recentGains]);

  // Get experience trend
  const getExperienceTrend = useCallback((days: number): { date: string; experience: number; level: number }[] => {
    // Simplified implementation - would need proper daily aggregation
    return experienceState.history.experienceTrend.slice(0, days).map(trend => ({
      date: trend.date,
      experience: trend.totalExperience,
      level: trend.level
    }));
  }, [experienceState.history.experienceTrend]);

  // Get leveling history
  const getLevelingHistory = useCallback((): LevelUpEvent[] => {
    return experienceState.history.levelingHistory;
  }, [experienceState.history.levelingHistory]);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<ExperienceSettings>) => {
    setExperienceState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings
      }
    }));
  }, []);

  // Format experience
  const formatExperience = useCallback((amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toString();
  }, []);

  // Get time to next level
  const getTimeToNextLevel = useCallback((currentRate?: number): number => {
    const rate = currentRate || experienceState.breakdown.averagePerHour;
    if (rate <= 0) return Infinity;

    const expNeeded = experienceState.level.experienceToNext;
    return (expNeeded / rate) * 60; // Convert to minutes
  }, [experienceState.level.experienceToNext, experienceState.breakdown.averagePerHour]);

  // Simulate level progress
  const simulateLevelProgress = useCallback((targetLevel: number): LevelCalculation[] => {
    const calculations: LevelCalculation[] = [];

    for (let level = experienceState.level.currentLevel + 1; level <= targetLevel; level++) {
      const requiredExp = getExperienceForLevel(level);
      const cumulativeExp = requiredExp;

      calculations.push({
        level,
        requiredExperience: requiredExp - getExperienceForLevel(level - 1),
        cumulativeExperience: cumulativeExp,
        statGrowth: {
          maxHealth: 10 + Math.floor(level / 5),
          maxMana: 5 + Math.floor(level / 3),
          attack: 2 + Math.floor(level / 4),
          defense: 2 + Math.floor(level / 4)
        },
        healthGrowth: 10 + Math.floor(level / 5),
        manaGrowth: 5 + Math.floor(level / 3)
      });
    }

    return calculations;
  }, [experienceState.level.currentLevel, getExperienceForLevel]);

  // Get notifications
  const getNotifications = useCallback((): ExperienceNotification[] => {
    return notifications;
  }, [notifications]);

  // Clear notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    // Core state
    experienceState,
    levelInfo: experienceState.level,
    breakdown: experienceState.breakdown,

    // Experience operations
    gainExperience,
    checkLevelUp,
    processLevelUp,

    // Session management
    startSession,
    endSession,
    getCurrentSession,

    // Progression tracking
    checkMilestones,
    completeMilestone,
    unlockAchievement,

    // Skill system
    learnSkill,
    getAvailableSkills,
    getSkillRequirements,

    // Statistics and analytics
    getExperienceToNext,
    getExperienceForLevel,
    calculateLevelFromExperience,
    getProgressionStats,

    // Experience modifiers
    addModifier,
    removeModifier,
    getActiveMultiplier,

    // History and trends
    getRecentGains,
    getExperienceTrend,
    getLevelingHistory,

    // Settings
    updateSettings,

    // Utility
    formatExperience,
    getTimeToNextLevel,
    simulateLevelProgress,

    // Events and notifications
    getNotifications,
    clearNotifications,

    // Loading and error states
    isLoading,
    error
  };
}