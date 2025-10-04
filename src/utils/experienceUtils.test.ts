/**
 * Experience Utilities Test Suite
 * Comprehensive tests for experience calculations, tracking, and level progression
 */

import {
  ExperienceCalculator,
  ExperienceTracker,
  createExperienceCalculations,
  formatExperienceNumber,
  calculateCombatXP,
  calculateQuestXP,
  calculateCreatureXP,
  ExperienceGain,
  ExperienceMultiplier,
  ExperienceActivity,
  LevelingEvent,
  ExperienceHistory,
  MAX_LEVEL,
  ACTIVITY_BASE_XP
} from './experienceUtils';

describe('experienceUtils', () => {
  describe('ExperienceCalculator', () => {
    describe('calculateRequiredXP', () => {
      it('should return 0 XP for level 1', () => {
        const result = ExperienceCalculator.calculateRequiredXP(1);
        expect(result).toBe(0);
      });

      it('should return correct XP for level 2', () => {
        const result = ExperienceCalculator.calculateRequiredXP(2);
        expect(result).toBe(100); // BASE_XP_PER_LEVEL
      });

      it('should increase exponentially with level', () => {
        const level5 = ExperienceCalculator.calculateRequiredXP(5);
        const level10 = ExperienceCalculator.calculateRequiredXP(10);
        const level15 = ExperienceCalculator.calculateRequiredXP(15);

        expect(level10).toBeGreaterThan(level5 * 2);
        expect(level15).toBeGreaterThan(level10 * 1.5);
      });

      it('should cache results for performance', () => {
        // First call
        const start = performance.now();
        ExperienceCalculator.calculateRequiredXP(50);
        const firstCall = performance.now() - start;

        // Second call (should be cached)
        const start2 = performance.now();
        ExperienceCalculator.calculateRequiredXP(50);
        const secondCall = performance.now() - start2;

        expect(secondCall).toBeLessThan(firstCall);
      });

      it('should cap at MAX_LEVEL', () => {
        const maxResult = ExperienceCalculator.calculateRequiredXP(MAX_LEVEL);
        const overMaxResult = ExperienceCalculator.calculateRequiredXP(MAX_LEVEL + 10);

        expect(overMaxResult).toBe(maxResult);
      });
    });

    describe('calculateLevel', () => {
      it('should return level 1 for 0 XP', () => {
        const result = ExperienceCalculator.calculateLevel(0);
        expect(result).toBe(1);
      });

      it('should return level 1 for negative XP', () => {
        const result = ExperienceCalculator.calculateLevel(-100);
        expect(result).toBe(1);
      });

      it('should return correct level for various XP amounts', () => {
        expect(ExperienceCalculator.calculateLevel(50)).toBe(1); // Less than 100
        expect(ExperienceCalculator.calculateLevel(100)).toBe(2); // Exactly 100
        expect(ExperienceCalculator.calculateLevel(150)).toBe(2); // Between levels
      });

      it('should cap at MAX_LEVEL', () => {
        const massiveXP = ExperienceCalculator.calculateRequiredXP(MAX_LEVEL) + 999999;
        const result = ExperienceCalculator.calculateLevel(massiveXP);

        expect(result).toBe(MAX_LEVEL);
      });
    });

    describe('getXPForNextLevel', () => {
      it('should return correct XP needed for next level', () => {
        const currentXP = 150; // Level 2, needs 100 more for level 3
        const level2XP = ExperienceCalculator.calculateRequiredXP(2); // 100
        const level3XP = ExperienceCalculator.calculateRequiredXP(3); // ~215

        const result = ExperienceCalculator.getXPForNextLevel(currentXP);
        const expected = level3XP - currentXP;

        expect(result).toBe(expected);
      });

      it('should return 0 for max level', () => {
        const maxLevelXP = ExperienceCalculator.calculateRequiredXP(MAX_LEVEL);
        const result = ExperienceCalculator.getXPForNextLevel(maxLevelXP);

        expect(result).toBe(0);
      });
    });

    describe('getProgressToNextLevel', () => {
      it('should return progress percentage', () => {
        const level2XP = ExperienceCalculator.calculateRequiredXP(2); // 100
        const level3XP = ExperienceCalculator.calculateRequiredXP(3); // ~215
        const midpointXP = level2XP + (level3XP - level2XP) / 2; // Halfway

        const result = ExperienceCalculator.getProgressToNextLevel(midpointXP);

        expect(result).toBeCloseTo(50, 1); // ~50%
      });

      it('should return 100% for max level', () => {
        const maxLevelXP = ExperienceCalculator.calculateRequiredXP(MAX_LEVEL);
        const result = ExperienceCalculator.getProgressToNextLevel(maxLevelXP);

        expect(result).toBe(100);
      });

      it('should handle exact level boundaries', () => {
        const level2XP = ExperienceCalculator.calculateRequiredXP(2);
        const result = ExperienceCalculator.getProgressToNextLevel(level2XP);

        expect(result).toBe(0); // Just reached level 2, 0% to level 3
      });
    });

    describe('calculateBaseXP', () => {
      it('should return base XP for activity', () => {
        const result = ExperienceCalculator.calculateBaseXP('combat');

        expect(result).toBeGreaterThan(0);
        // Result includes random variance (0.8-1.5x for combat), so check a reasonable range
        expect(result).toBeGreaterThanOrEqual(Math.floor(ACTIVITY_BASE_XP.combat * 0.8));
        expect(result).toBeLessThanOrEqual(Math.ceil(ACTIVITY_BASE_XP.combat * 1.5));
      });

      it('should apply difficulty multiplier', () => {
        const easyXP = ExperienceCalculator.calculateBaseXP('combat', 5); // Easy
        const hardXP = ExperienceCalculator.calculateBaseXP('combat', 15); // Hard

        expect(hardXP).toBeGreaterThan(easyXP);
      });

      it('should apply level scaling', () => {
        const lowLevelXP = ExperienceCalculator.calculateBaseXP('combat', 10, 5);
        const highLevelXP = ExperienceCalculator.calculateBaseXP('combat', 10, 25);

        expect(highLevelXP).toBeGreaterThan(lowLevelXP);
      });

      it('should apply random variance within bounds', () => {
        const results = [];
        for (let i = 0; i < 10; i++) {
          results.push(ExperienceCalculator.calculateBaseXP('combat'));
        }

        const min = Math.min(...results);
        const max = Math.max(...results);

        expect(max).toBeGreaterThan(min); // Should have variance
      });

      it('should cap difficulty multiplier', () => {
        const veryEasy = ExperienceCalculator.calculateBaseXP('combat', 1); // Should cap at 0.5
        const veryHard = ExperienceCalculator.calculateBaseXP('combat', 50); // Should cap at 2.0

        expect(veryEasy).toBeGreaterThan(0);
        expect(veryHard).toBeLessThan(ACTIVITY_BASE_XP.combat * 3); // Reasonable upper bound
      });
    });

    describe('applyMultipliers', () => {
      it('should apply single multiplier', () => {
        const baseXP = 100;
        const multipliers: ExperienceMultiplier[] = [
          { name: 'bonus', multiplier: 1.5, source: 'test' }
        ];

        const result = ExperienceCalculator.applyMultipliers(baseXP, multipliers);

        expect(result).toBe(150);
      });

      it('should apply multiple multipliers', () => {
        const baseXP = 100;
        const multipliers: ExperienceMultiplier[] = [
          { name: 'bonus1', multiplier: 1.5, source: 'test1' },
          { name: 'bonus2', multiplier: 2.0, source: 'test2' }
        ];

        const result = ExperienceCalculator.applyMultipliers(baseXP, multipliers);

        expect(result).toBe(300); // 100 * 1.5 * 2.0
      });

      it('should ignore expired multipliers', () => {
        const baseXP = 100;
        const now = Date.now();
        const multipliers: ExperienceMultiplier[] = [
          { name: 'active', multiplier: 2.0, source: 'test', expiresAt: now + 10000 },
          { name: 'expired', multiplier: 3.0, source: 'test', expiresAt: now - 10000 }
        ];

        const result = ExperienceCalculator.applyMultipliers(baseXP, multipliers);

        expect(result).toBe(200); // Only active multiplier applied
      });

      it('should handle no multipliers', () => {
        const baseXP = 100;
        const result = ExperienceCalculator.applyMultipliers(baseXP, []);

        expect(result).toBe(100);
      });
    });
  });

  describe('ExperienceTracker', () => {
    let tracker: ExperienceTracker;

    beforeEach(() => {
      tracker = new ExperienceTracker();
    });

    describe('addExperienceGain', () => {
      it('should add experience gain to history', () => {
        const gain = tracker.addExperienceGain('combat', 50, 'defeating goblin');

        expect(gain.activity).toBe('combat');
        expect(gain.amount).toBe(50);
        expect(gain.source).toBe('defeating goblin');
        expect(gain.timestamp).toBeCloseTo(Date.now(), -2); // Within ~100ms
      });

      it('should apply multipliers to experience gain', () => {
        tracker.addMultiplier({
          name: 'double_xp',
          multiplier: 2.0,
          source: 'event'
        });

        const gain = tracker.addExperienceGain('combat', 50, 'test');

        expect(gain.amount).toBe(100);
        expect(gain.multiplier).toBe(2.0);
      });

      it('should update session totals', () => {
        tracker.addExperienceGain('combat', 50, 'test1');
        tracker.addExperienceGain('quest', 100, 'test2');

        const sessionStats = tracker.getSessionStats();

        expect(sessionStats.totalGained).toBe(150);
        expect(sessionStats.activitiesCount).toBe(2);
      });

      it('should notify listeners', () => {
        const listener = jest.fn();
        tracker.onExperienceGain(listener);

        const gain = tracker.addExperienceGain('combat', 50, 'test');

        expect(listener).toHaveBeenCalledWith(gain);
      });
    });

    describe('recordLevelUp', () => {
      it('should record level up event', () => {
        tracker.recordLevelUp(5, 6, 1000, 'combat victory');

        const levelEvents = tracker.getLevelingHistory(5);

        expect(levelEvents).toHaveLength(1);
        expect(levelEvents[0].fromLevel).toBe(5);
        expect(levelEvents[0].toLevel).toBe(6);
        expect(levelEvents[0].totalXP).toBe(1000);
        expect(levelEvents[0].source).toBe('combat victory');
      });
    });

    describe('multiplier management', () => {
      it('should add and remove multipliers', () => {
        const multiplier: ExperienceMultiplier = {
          name: 'test_bonus',
          multiplier: 1.5,
          source: 'test'
        };

        tracker.addMultiplier(multiplier);

        const gain1 = tracker.addExperienceGain('combat', 100, 'test');
        expect(gain1.amount).toBe(150);

        tracker.removeMultiplier('test_bonus');

        const gain2 = tracker.addExperienceGain('combat', 100, 'test');
        expect(gain2.amount).toBe(100);
      });

      it('should automatically remove expired multipliers', () => {
        const expiredMultiplier: ExperienceMultiplier = {
          name: 'expired',
          multiplier: 2.0,
          source: 'test',
          expiresAt: Date.now() - 1000 // Expired 1 second ago
        };

        tracker.addMultiplier(expiredMultiplier);

        const gain = tracker.addExperienceGain('combat', 100, 'test');

        expect(gain.amount).toBe(100); // No multiplier applied
        expect(gain.multiplier).toBeUndefined();
      });
    });

    describe('getExperienceBreakdown', () => {
      beforeEach(() => {
        tracker.addExperienceGain('combat', 100, 'test1');
        tracker.addExperienceGain('combat', 50, 'test2');
        tracker.addExperienceGain('quest', 200, 'test3');
        tracker.addExperienceGain('exploration', 75, 'test4');
      });

      it('should provide breakdown by activity', () => {
        const breakdown = tracker.getExperienceBreakdown();

        expect(breakdown.combat).toBe(150);
        expect(breakdown.quest).toBe(200);
        expect(breakdown.exploration).toBe(75);
        expect(breakdown.creature).toBe(0);
      });

      it('should filter by time range', () => {
        const futureTime = Date.now() + 10000;

        // Add future experience
        setTimeout(() => {
          tracker.addExperienceGain('combat', 999, 'future');
        }, 5);

        const breakdown = tracker.getExperienceBreakdown({
          start: Date.now() - 1000,
          end: Date.now() + 1000
        });

        expect(breakdown.combat).toBe(150); // Should not include future XP
      });
    });

    describe('getRecentGains', () => {
      beforeEach(() => {
        for (let i = 0; i < 15; i++) {
          tracker.addExperienceGain('combat', i * 10, `test${i}`);
        }
      });

      it('should return recent gains in reverse order', () => {
        const recent = tracker.getRecentGains(5);

        expect(recent).toHaveLength(5);
        expect(recent[0].amount).toBe(140); // Most recent (14 * 10)
        expect(recent[4].amount).toBe(100); // 5th most recent (10 * 10)
      });

      it('should limit results to requested count', () => {
        const recent = tracker.getRecentGains(3);

        expect(recent).toHaveLength(3);
      });

      it('should handle requests larger than history', () => {
        const newTracker = new ExperienceTracker();
        newTracker.addExperienceGain('combat', 50, 'only one');

        const recent = newTracker.getRecentGains(10);

        expect(recent).toHaveLength(1);
      });
    });

    describe('getSessionStats', () => {
      beforeEach(() => {
        tracker.addExperienceGain('combat', 100, 'test1');
        tracker.addExperienceGain('quest', 200, 'test2');
        tracker.addExperienceGain('combat', 50, 'test3');
      });

      it('should calculate session statistics', () => {
        const stats = tracker.getSessionStats();

        expect(stats.totalGained).toBe(350);
        expect(stats.activitiesCount).toBe(2); // combat and quest
        expect(stats.topActivity).toBe('quest'); // Highest XP total
        expect(stats.sessionDuration).toBeGreaterThanOrEqual(0); // Can be 0 if test runs very quickly
        expect(stats.averagePerHour).toBeGreaterThanOrEqual(0); // Can be 0 if no time has passed
      });
    });

    describe('getLevelingHistory', () => {
      beforeEach(() => {
        for (let i = 0; i < 10; i++) {
          tracker.recordLevelUp(i + 1, i + 2, (i + 1) * 1000, `level up ${i}`);
        }
      });

      it('should return recent level events', () => {
        const history = tracker.getLevelingHistory(5);

        expect(history).toHaveLength(5);
        expect(history[0].toLevel).toBe(11); // Most recent
        expect(history[4].toLevel).toBe(7); // 5th most recent
      });

      it('should limit results to requested count', () => {
        const history = tracker.getLevelingHistory(3);

        expect(history).toHaveLength(3);
      });
    });

    describe('getActivityEfficiency', () => {
      beforeEach(() => {
        tracker.addExperienceGain('combat', 100, 'test1');
        tracker.addExperienceGain('combat', 200, 'test2');
        tracker.addExperienceGain('quest', 300, 'test3');
      });

      it('should calculate efficiency metrics for each activity', () => {
        const efficiency = tracker.getActivityEfficiency();

        expect(efficiency.combat.totalXP).toBe(300);
        expect(efficiency.combat.gainCount).toBe(2);
        expect(efficiency.combat.averageXP).toBe(150);
        expect(efficiency.combat.lastGain).toBeGreaterThan(0);

        expect(efficiency.quest.totalXP).toBe(300);
        expect(efficiency.quest.gainCount).toBe(1);
        expect(efficiency.quest.averageXP).toBe(300);
      });

      it('should handle activities with no gains', () => {
        const efficiency = tracker.getActivityEfficiency();

        expect(efficiency.creature.totalXP).toBe(0);
        expect(efficiency.creature.gainCount).toBe(0);
        expect(efficiency.creature.averageXP).toBe(0);
        expect(efficiency.creature.lastGain).toBe(0);
      });
    });

    describe('listener management', () => {
      it('should add and remove listeners', () => {
        const listener1 = jest.fn();
        const listener2 = jest.fn();

        const unsubscribe1 = tracker.onExperienceGain(listener1);
        const unsubscribe2 = tracker.onExperienceGain(listener2);

        tracker.addExperienceGain('combat', 50, 'test');

        expect(listener1).toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();

        unsubscribe1();
        listener1.mockClear();
        listener2.mockClear();

        tracker.addExperienceGain('combat', 50, 'test2');

        expect(listener1).not.toHaveBeenCalled();
        expect(listener2).toHaveBeenCalled();
      });
    });

    describe('import/export', () => {
      it('should export and import history', () => {
        tracker.addExperienceGain('combat', 100, 'test1');
        tracker.recordLevelUp(1, 2, 100, 'level up');

        const exported = tracker.exportHistory();
        const newTracker = new ExperienceTracker();
        newTracker.importHistory(exported);

        expect(newTracker.getRecentGains(1)[0].amount).toBe(100);
        expect(newTracker.getLevelingHistory(1)[0].toLevel).toBe(2);
      });
    });

    describe('resetSession', () => {
      it('should reset session data', () => {
        tracker.addExperienceGain('combat', 100, 'test');

        expect(tracker.getSessionStats().totalGained).toBe(100);

        tracker.resetSession();

        expect(tracker.getSessionStats().totalGained).toBe(0);
        expect(tracker.getSessionStats().activitiesCount).toBe(0);
      });
    });
  });

  describe('createExperienceCalculations', () => {
    it('should create experience calculation object', () => {
      const currentXP = 150;
      const result = createExperienceCalculations(currentXP);

      expect(result.currentLevel).toBe(ExperienceCalculator.calculateLevel(currentXP));
      expect(result.nextLevel).toBe(result.currentLevel + 1);
      expect(result.xpForNext).toBe(ExperienceCalculator.getXPForNextLevel(currentXP));
      expect(result.progressPercent).toBe(ExperienceCalculator.getProgressToNextLevel(currentXP));
      expect(result.requiredForNext).toBeGreaterThan(result.requiredForCurrent);
    });
  });

  describe('formatExperienceNumber', () => {
    it('should format small numbers normally', () => {
      expect(formatExperienceNumber(0)).toBe('0');
      expect(formatExperienceNumber(123)).toBe('123');
      expect(formatExperienceNumber(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatExperienceNumber(1000)).toBe('1.0K');
      expect(formatExperienceNumber(1500)).toBe('1.5K');
      expect(formatExperienceNumber(12345)).toBe('12.3K');
    });

    it('should format millions with M suffix', () => {
      expect(formatExperienceNumber(1000000)).toBe('1.0M');
      expect(formatExperienceNumber(2500000)).toBe('2.5M');
      expect(formatExperienceNumber(12345678)).toBe('12.3M');
    });
  });

  describe('calculateCombatXP', () => {
    it('should calculate base combat XP for victory', () => {
      const result = calculateCombatXP(10, 10, true);

      expect(result).toBeGreaterThan(0);
      // XP includes random variance (0.8-1.5x for combat), so check a reasonable range
      expect(result).toBeGreaterThanOrEqual(Math.floor(ACTIVITY_BASE_XP.combat * 0.5));
      expect(result).toBeLessThanOrEqual(Math.ceil(ACTIVITY_BASE_XP.combat * 2.5));
    });

    it('should give minimal XP for defeat', () => {
      const victory = calculateCombatXP(10, 10, true);
      const defeat = calculateCombatXP(10, 10, false);

      expect(defeat).toBeLessThan(victory);
      // Defeat gives exactly 10% of base XP (no variance applied)
      expect(defeat).toBe(Math.floor(ACTIVITY_BASE_XP.combat * 0.1));
    });

    it('should apply difficulty bonus for higher level enemies', () => {
      const easyFight = calculateCombatXP(5, 10, true); // Enemy 5 levels lower
      const hardFight = calculateCombatXP(15, 10, true); // Enemy 5 levels higher

      expect(hardFight).toBeGreaterThan(easyFight);
    });

    it('should apply overkill bonus', () => {
      const normal = calculateCombatXP(10, 10, true, false);
      const overkill = calculateCombatXP(10, 10, true, true);

      expect(overkill).toBeGreaterThan(normal);
      // Overkill should be approximately 1.5x normal (both have random variance)
      // Due to random variance, we can't expect exact 1.5x ratio, but overkill should be significantly higher
      expect(overkill).toBeGreaterThanOrEqual(Math.floor(normal * 1.2));
    });

    it('should handle extreme level differences', () => {
      const veryEasy = calculateCombatXP(1, 50, true); // Very low enemy
      const veryHard = calculateCombatXP(100, 10, true); // Very high enemy

      expect(veryEasy).toBeGreaterThan(0);
      expect(veryHard).toBeGreaterThan(veryEasy);
    });
  });

  describe('calculateQuestXP', () => {
    it('should calculate base quest XP for completion', () => {
      const result = calculateQuestXP(10, 10, 'complete');

      expect(result).toBeGreaterThan(0);
      // Quest XP includes random variance (1.0-2.0x), so check a reasonable range
      expect(result).toBeGreaterThanOrEqual(Math.floor(ACTIVITY_BASE_XP.quest * 0.8));
      expect(result).toBeLessThanOrEqual(Math.ceil(ACTIVITY_BASE_XP.quest * 2.5));
    });

    it('should apply completion multipliers', () => {
      const partial = calculateQuestXP(10, 10, 'partial');
      const complete = calculateQuestXP(10, 10, 'complete');
      const perfect = calculateQuestXP(10, 10, 'perfect');

      expect(complete).toBeGreaterThan(partial);
      expect(perfect).toBeGreaterThan(complete);
      // Perfect should be 1.5x complete, but both have random variance
      // so we can't expect exact ratio - just verify perfect is significantly higher
      expect(perfect).toBeGreaterThanOrEqual(Math.floor(complete * 1.2));
    });

    it('should scale with quest and player level', () => {
      const lowQuest = calculateQuestXP(5, 10, 'complete');
      const highQuest = calculateQuestXP(15, 10, 'complete');

      expect(highQuest).toBeGreaterThan(lowQuest);
    });
  });

  describe('calculateCreatureXP', () => {
    it('should calculate base creature XP', () => {
      const result = calculateCreatureXP(3, 10, 'capture'); // Rarity 3 (rare-ish)

      expect(result).toBeGreaterThan(0);
      // Creature XP includes random variance (0.9-1.8x), so check a reasonable range
      expect(result).toBeGreaterThanOrEqual(Math.floor(ACTIVITY_BASE_XP.creature * 0.5));
      expect(result).toBeLessThanOrEqual(Math.ceil(ACTIVITY_BASE_XP.creature * 2.5));
    });

    it('should apply action multipliers', () => {
      // Run multiple samples to reduce random variance impact
      const captureResults = [];
      const breedResults = [];
      const releaseResults = [];

      for (let i = 0; i < 10; i++) {
        captureResults.push(calculateCreatureXP(3, 10, 'capture'));
        breedResults.push(calculateCreatureXP(3, 10, 'breed'));
        releaseResults.push(calculateCreatureXP(3, 10, 'release'));
      }

      const avgCapture = captureResults.reduce((a, b) => a + b) / 10;
      const avgBreed = breedResults.reduce((a, b) => a + b) / 10;
      const avgRelease = releaseResults.reduce((a, b) => a + b) / 10;

      // Over multiple samples, averages should follow expected pattern
      expect(avgCapture).toBeGreaterThan(avgBreed);
      expect(avgBreed).toBeGreaterThan(avgRelease);
      expect(avgRelease).toBeLessThan(avgCapture * 0.5);
    });

    it('should scale with creature rarity', () => {
      const common = calculateCreatureXP(1, 10, 'capture'); // Low rarity
      const legendary = calculateCreatureXP(5, 10, 'capture'); // High rarity

      expect(legendary).toBeGreaterThan(common);
    });

    it('should scale with player level', () => {
      const lowLevel = calculateCreatureXP(3, 5, 'capture');
      const highLevel = calculateCreatureXP(3, 25, 'capture');

      expect(highLevel).toBeGreaterThan(lowLevel);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle negative XP values gracefully', () => {
      expect(ExperienceCalculator.calculateLevel(-1000)).toBe(1);
      expect(ExperienceCalculator.getXPForNextLevel(-100)).toBeGreaterThan(0);
    });

    it('should handle very large XP values', () => {
      const largeXP = Number.MAX_SAFE_INTEGER;
      const level = ExperienceCalculator.calculateLevel(largeXP);

      expect(level).toBeLessThanOrEqual(MAX_LEVEL);
      expect(level).toBeGreaterThan(0);
    });

    it('should handle zero multipliers', () => {
      const result = ExperienceCalculator.applyMultipliers(100, [
        { name: 'zero', multiplier: 0, source: 'test' }
      ]);

      expect(result).toBe(0);
    });

    it('should handle very large multipliers', () => {
      const result = ExperienceCalculator.applyMultipliers(100, [
        { name: 'huge', multiplier: 1000, source: 'test' }
      ]);

      expect(result).toBe(100000);
    });

    it('should handle malformed experience history', () => {
      const tracker = new ExperienceTracker();
      const malformedHistory = {
        gains: [],
        levelEvents: [],
        sessionStart: Date.now(),
        totalGainedThisSession: 0,
        activitiesThisSession: new Set()
      };

      expect(() => tracker.importHistory(malformedHistory as any)).not.toThrow();
    });

    it('should handle activity types not in ACTIVITY_BASE_XP', () => {
      const tracker = new ExperienceTracker();

      expect(() => {
        tracker.addExperienceGain('unknown_activity' as ExperienceActivity, 50, 'test');
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete leveling scenario', () => {
      const tracker = new ExperienceTracker();
      let currentXP = 0;
      let currentLevel = 1;

      // Simulate gaining experience and leveling up
      for (let i = 0; i < 10; i++) {
        const xpGain = calculateCombatXP(currentLevel + 2, currentLevel, true);
        tracker.addExperienceGain('combat', xpGain, `fight ${i}`);
        currentXP += xpGain;

        const newLevel = ExperienceCalculator.calculateLevel(currentXP);
        if (newLevel > currentLevel) {
          tracker.recordLevelUp(currentLevel, newLevel, currentXP, 'combat progression');
          currentLevel = newLevel;
        }
      }

      const stats = tracker.getSessionStats();
      const levelHistory = tracker.getLevelingHistory();
      const calculations = createExperienceCalculations(currentXP);

      expect(stats.totalGained).toBeGreaterThan(0);
      expect(levelHistory.length).toBeGreaterThan(0);
      expect(calculations.currentLevel).toBeGreaterThan(1);
      expect(calculations.progressPercent).toBeGreaterThanOrEqual(0);
    });

    it('should handle complex multiplier scenarios', () => {
      const tracker = new ExperienceTracker();

      // Add multiple overlapping multipliers
      tracker.addMultiplier({
        name: 'weekend_bonus',
        multiplier: 1.5,
        source: 'event',
        expiresAt: Date.now() + 10000
      });

      tracker.addMultiplier({
        name: 'premium_boost',
        multiplier: 2.0,
        source: 'subscription'
      });

      const gain = tracker.addExperienceGain('quest', 100, 'complex scenario');

      expect(gain.amount).toBe(300); // 100 * 1.5 * 2.0
      expect(gain.multiplier).toBe(3.0);
    });

    it('should maintain data consistency across operations', () => {
      const tracker = new ExperienceTracker();

      // Add various types of experience
      const activities: ExperienceActivity[] = ['combat', 'quest', 'exploration', 'creature'];
      let totalExpected = 0;

      activities.forEach((activity, index) => {
        const amount = (index + 1) * 50;
        tracker.addExperienceGain(activity, amount, `${activity} test`);
        totalExpected += amount;
      });

      const breakdown = tracker.getExperienceBreakdown();
      const sessionStats = tracker.getSessionStats();
      const efficiency = tracker.getActivityEfficiency();

      // Verify consistency
      const breakdownTotal = Object.values(breakdown).reduce((sum, xp) => sum + xp, 0);
      const efficiencyTotal = Object.values(efficiency).reduce((sum, eff) => sum + eff.totalXP, 0);

      expect(breakdownTotal).toBe(totalExpected);
      expect(efficiencyTotal).toBe(totalExpected);
      expect(sessionStats.totalGained).toBe(totalExpected);
    });
  });
});