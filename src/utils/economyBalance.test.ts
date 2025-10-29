/**
 * Economy Balance Utilities Tests
 *
 * Tests for economy calculations, pricing tiers, and balance validation
 */

import {
  calculateItemPricing,
  getShopPricingModifiers,
  calculateShopSellPrice,
  getItemPricingTier,
  calculateAreaGoldPerHour,
  validateAreaGoldEarningRate,
  calculateGoldEarningRate,
  getItemAffordabilityTimeline,
  getRecommendedGoldRate,
  getUnlockThresholds,
  getRecommendedItemUnlockLevel,
  validateEconomyBalance,
  generateEconomyReport,
  ITEM_PRICING_TIERS,
  GOLD_EARNING_RATES,
  COMBAT_ASSUMPTIONS,
} from './economyBalance';

import { ReactArea, ReactMonster } from '../types/game';
import { ShopType } from '../types/shop';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const createMockArea = (overrides?: Partial<ReactArea>): ReactArea => ({
  id: 'test-area',
  name: 'Test Area',
  description: 'A test area',
  type: 'wilderness',
  unlocked: true,
  unlockRequirements: {},
  encounterRate: 0.7,
  monsters: ['slime', 'goblin'],
  connections: [],
  recommendedLevel: 5,
  ...overrides,
});

const createMockMonster = (overrides?: Partial<ReactMonster>): ReactMonster => ({
  id: 'test-monster',
  name: 'Test Monster',
  species: 'test',
  level: 5,
  hp: 50,
  maxHp: 50,
  mp: 20,
  maxMp: 20,
  baseStats: {
    attack: 10,
    defense: 5,
    magicAttack: 3,
    magicDefense: 4,
    speed: 6,
    accuracy: 80,
  },
  currentStats: {
    attack: 10,
    defense: 5,
    magicAttack: 3,
    magicDefense: 4,
    speed: 6,
    accuracy: 80,
  },
  types: ['normal'],
  rarity: 'common',
  abilities: [],
  captureRate: 0.5,
  experience: 50,
  gold: 20,
  drops: [],
  areas: ['test-area'],
  evolvesTo: [],
  isWild: true,
  ...overrides,
});

// =============================================================================
// PRICING CALCULATIONS TESTS
// =============================================================================

describe('Pricing Calculations', () => {
  describe('calculateItemPricing', () => {
    it('should apply general store modifier (1.0x)', () => {
      const price = calculateItemPricing(100, 'general', 1);
      expect(price).toBe(100);
    });

    it('should apply weapon shop modifier (1.1x)', () => {
      const price = calculateItemPricing(100, 'weapon', 1);
      expect(price).toBe(110);
    });

    it('should apply armor shop modifier (1.1x)', () => {
      const price = calculateItemPricing(100, 'armor', 1);
      expect(price).toBe(110);
    });

    it('should apply magic shop modifier (1.2x)', () => {
      const price = calculateItemPricing(100, 'magic', 1);
      expect(price).toBe(120);
    });

    it('should apply apothecary modifier (1.0x)', () => {
      const price = calculateItemPricing(100, 'apothecary', 1);
      expect(price).toBe(100);
    });

    it('should floor the result', () => {
      const price = calculateItemPricing(95, 'weapon', 1);
      expect(price).toBe(104); // 95 * 1.1 = 104.5 → 104
    });
  });

  describe('getShopPricingModifiers', () => {
    it('should return correct modifiers for each shop type', () => {
      const generalMods = getShopPricingModifiers('general');
      expect(generalMods.buyMultiplier).toBe(1.0);
      expect(generalMods.sellMultiplier).toBe(0.5);

      const magicMods = getShopPricingModifiers('magic');
      expect(magicMods.buyMultiplier).toBe(1.2);
      expect(magicMods.sellMultiplier).toBe(0.4);
    });
  });

  describe('calculateShopSellPrice', () => {
    it('should calculate sell price with shop modifier', () => {
      const price = calculateShopSellPrice(100, 'general');
      expect(price).toBe(50); // 100 * 0.5
    });

    it('should return minimum 1 gold', () => {
      const price = calculateShopSellPrice(1, 'magic');
      expect(price).toBeGreaterThanOrEqual(1);
    });

    it('should apply magic shop sell penalty', () => {
      const price = calculateShopSellPrice(100, 'magic');
      expect(price).toBe(40); // 100 * 0.4
    });
  });

  describe('getItemPricingTier', () => {
    it('should classify tier 1 items (50-500g)', () => {
      const tier = getItemPricingTier(300);
      expect(tier).toBe(ITEM_PRICING_TIERS.tier1);
      expect(tier.name).toBe('Early Game');
    });

    it('should classify tier 2 items (500-1500g)', () => {
      const tier = getItemPricingTier(1000);
      expect(tier).toBe(ITEM_PRICING_TIERS.tier2);
      expect(tier.name).toBe('Mid Game');
    });

    it('should classify tier 3 items (1500-5000g)', () => {
      const tier = getItemPricingTier(3000);
      expect(tier).toBe(ITEM_PRICING_TIERS.tier3);
      expect(tier.name).toBe('Late Game');
    });

    it('should classify tier 4 items (5000+g)', () => {
      const tier = getItemPricingTier(10000);
      expect(tier).toBe(ITEM_PRICING_TIERS.tier4);
      expect(tier.name).toBe('End Game');
    });
  });
});

// =============================================================================
// GOLD EARNING RATE TESTS
// =============================================================================

describe('Gold Earning Rate Calculations', () => {
  describe('calculateAreaGoldPerHour', () => {
    it('should calculate gold per hour based on monster drops', () => {
      const area = createMockArea({ encounterRate: 0.7 });
      const monsters = [
        createMockMonster({ gold: 20, areas: ['test-area'] }),
        createMockMonster({ id: 'goblin', gold: 30, areas: ['test-area'] }),
      ];

      const [minGold, maxGold] = calculateAreaGoldPerHour(area, monsters, 5);

      // Average: (20 + 30) / 2 = 25 gold per monster
      // Combats: 84 * 0.7 = ~59 combats/hour
      // Expected: 25 * 59 = ~1475 gold/hour
      expect(minGold).toBeGreaterThan(1000);
      expect(maxGold).toBeLessThan(2000);
    });

    it('should return [0, 0] for area with no monsters', () => {
      const area = createMockArea();
      const [min, max] = calculateAreaGoldPerHour(area, [], 5);
      expect(min).toBe(0);
      expect(max).toBe(0);
    });

    it('should only count monsters in the area', () => {
      const area = createMockArea({ id: 'forest' });
      const monsters = [
        createMockMonster({ gold: 20, areas: ['forest'] }),
        createMockMonster({ id: 'mountain-beast', gold: 100, areas: ['mountain'] }),
      ];

      const [minGold, maxGold] = calculateAreaGoldPerHour(area, monsters, 5);

      // Should only count the forest monster (20g)
      expect(minGold).toBeLessThan(2000);
    });

    it('should respect custom encounter rates', () => {
      const lowEncounterArea = createMockArea({ encounterRate: 0.3 });
      const highEncounterArea = createMockArea({ encounterRate: 0.9 });
      const monsters = [createMockMonster({ gold: 20, areas: ['test-area'] })];

      const [minLow] = calculateAreaGoldPerHour(lowEncounterArea, monsters, 5);
      const [minHigh] = calculateAreaGoldPerHour(highEncounterArea, monsters, 5);

      expect(minHigh).toBeGreaterThan(minLow);
    });
  });

  describe('validateAreaGoldEarningRate', () => {
    it('should validate area meeting target rate', () => {
      const area = createMockArea();
      const monsters = [createMockMonster({ gold: 24, areas: ['test-area'] })];

      const result = validateAreaGoldEarningRate(area, monsters, 5);

      expect(result.valid).toBe(true);
      expect(result.goldPerHour[0]).toBeGreaterThanOrEqual(800);
      expect(result.goldPerHour[1]).toBeLessThanOrEqual(2400);
    });

    it('should provide suggestion when gold rate too low', () => {
      const area = createMockArea();
      const monsters = [createMockMonster({ gold: 5, areas: ['test-area'] })];

      const result = validateAreaGoldEarningRate(area, monsters, 5);

      expect(result.valid).toBe(false);
      expect(result.suggestion).toBeDefined();
      expect(result.suggestion).toContain('Increase');
    });

    it('should provide suggestion when gold rate too high', () => {
      const area = createMockArea();
      const monsters = [createMockMonster({ gold: 100, areas: ['test-area'] })];

      const result = validateAreaGoldEarningRate(area, monsters, 5);

      expect(result.valid).toBe(false);
      expect(result.suggestion).toContain('Reduce');
    });
  });

  describe('calculateGoldEarningRate', () => {
    it('should calculate rates for all areas', () => {
      const areas = [
        createMockArea({ id: 'area-1', name: 'Forest', recommendedLevel: 3 }),
        createMockArea({ id: 'area-2', name: 'Mountain', recommendedLevel: 7 }),
      ];
      const monsters = [
        createMockMonster({ gold: 20, areas: ['area-1'] }),
        createMockMonster({ gold: 40, areas: ['area-2'] }),
      ];

      const rates = calculateGoldEarningRate(areas, monsters);

      expect(rates).toHaveLength(2);
      expect(rates[0].areaId).toBe('area-1');
      expect(rates[0].goldPerHour).toBeDefined();
      expect(rates[1].areaId).toBe('area-2');
    });

    it('should mark areas as meeting or not meeting target', () => {
      const areas = [createMockArea()];
      const monsters = [createMockMonster({ gold: 24, areas: ['test-area'] })];

      const rates = calculateGoldEarningRate(areas, monsters);

      expect(rates[0]).toHaveProperty('meetsTarget');
      expect(typeof rates[0].meetsTarget).toBe('boolean');
    });
  });
});

// =============================================================================
// AFFORDABILITY TESTS
// =============================================================================

describe('Affordability Calculations', () => {
  describe('getItemAffordabilityTimeline', () => {
    it('should return 0 time when player can afford now', () => {
      const result = getItemAffordabilityTimeline(100, 1000, 500);
      expect(result.canAffordNow).toBe(true);
      expect(result.hoursNeeded).toBe(0);
      expect(result.minutesNeeded).toBe(0);
    });

    it('should calculate hours needed to afford item', () => {
      const result = getItemAffordabilityTimeline(1000, 500, 0);
      expect(result.canAffordNow).toBe(false);
      expect(result.hoursNeeded).toBe(2.0);
      expect(result.minutesNeeded).toBe(120);
    });

    it('should account for current gold', () => {
      const result = getItemAffordabilityTimeline(1000, 500, 500);
      expect(result.hoursNeeded).toBe(1.0);
      expect(result.minutesNeeded).toBe(60);
    });

    it('should return item tier information', () => {
      const result = getItemAffordabilityTimeline(300, 1000, 0);
      expect(result.tier).toBe(ITEM_PRICING_TIERS.tier1);
    });

    it('should ceil minutes for display', () => {
      const result = getItemAffordabilityTimeline(1550, 1000, 0);
      expect(result.minutesNeeded).toBe(93); // 1.55 hours = 93 minutes
    });
  });

  describe('getRecommendedGoldRate', () => {
    it('should return early game rate for low levels', () => {
      const rate = getRecommendedGoldRate(3);
      expect(rate).toEqual(GOLD_EARNING_RATES.earlyGame.goldPerHour);
    });

    it('should return mid game rate for medium levels', () => {
      const rate = getRecommendedGoldRate(8);
      expect(rate).toEqual(GOLD_EARNING_RATES.midGame.goldPerHour);
    });

    it('should return late game rate for high levels', () => {
      const rate = getRecommendedGoldRate(15);
      expect(rate).toEqual(GOLD_EARNING_RATES.lateGame.goldPerHour);
    });
  });
});

// =============================================================================
// UNLOCK THRESHOLD TESTS
// =============================================================================

describe('Unlock Thresholds', () => {
  describe('getUnlockThresholds', () => {
    it('should recommend level 1 for general stores', () => {
      const thresholds = getUnlockThresholds('general');
      expect(thresholds.recommendedLevel).toBe(1);
      expect(thresholds.recommendedStory).toBe(0);
    });

    it('should recommend level 3 for weapon shops', () => {
      const thresholds = getUnlockThresholds('weapon');
      expect(thresholds.recommendedLevel).toBe(3);
      expect(thresholds.recommendedStory).toBe(1);
    });

    it('should recommend level 5 for magic shops', () => {
      const thresholds = getUnlockThresholds('magic');
      expect(thresholds.recommendedLevel).toBe(5);
      expect(thresholds.recommendedStory).toBe(2);
    });

    it('should include reasoning for recommendations', () => {
      const thresholds = getUnlockThresholds('weapon');
      expect(thresholds.reasoning).toBeDefined();
      expect(thresholds.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('getRecommendedItemUnlockLevel', () => {
    it('should recommend level 1 for tier 1 items', () => {
      expect(getRecommendedItemUnlockLevel(200)).toBe(1);
    });

    it('should recommend level 5 for tier 2 items', () => {
      expect(getRecommendedItemUnlockLevel(1000)).toBe(5);
    });

    it('should recommend level 10 for tier 3 items', () => {
      expect(getRecommendedItemUnlockLevel(3000)).toBe(10);
    });

    it('should recommend level 15 for tier 4 items', () => {
      expect(getRecommendedItemUnlockLevel(10000)).toBe(15);
    });
  });
});

// =============================================================================
// BALANCE VALIDATION TESTS
// =============================================================================

describe('Balance Validation', () => {
  describe('validateEconomyBalance', () => {
    it('should report balanced economy when most areas meet targets', () => {
      const areas = [
        createMockArea({ id: 'area-1' }),
        createMockArea({ id: 'area-2' }),
        createMockArea({ id: 'area-3' }),
      ];
      const monsters = [
        createMockMonster({ gold: 24, areas: ['area-1'] }),
        createMockMonster({ gold: 24, areas: ['area-2'] }),
        createMockMonster({ gold: 24, areas: ['area-3'] }),
      ];

      const result = validateEconomyBalance(areas, monsters);

      expect(result.overall).toBe('balanced');
      expect(result.areaReports).toHaveLength(3);
    });

    it('should report too_hard when gold rates are low', () => {
      const areas = [createMockArea()];
      const monsters = [createMockMonster({ gold: 5, areas: ['test-area'] })];

      const result = validateEconomyBalance(areas, monsters);

      expect(result.overall).toBe('too_hard');
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.toLowerCase().includes('increase'))).toBe(true);
    });

    it('should report too_easy when gold rates are high', () => {
      const areas = [createMockArea()];
      const monsters = [createMockMonster({ gold: 100, areas: ['test-area'] })];

      const result = validateEconomyBalance(areas, monsters);

      expect(result.overall).toBe('too_easy');
      expect(result.recommendations.some(r => r.toLowerCase().includes('reduce'))).toBe(true);
    });

    it('should provide area-specific recommendations', () => {
      const areas = [
        createMockArea({ id: 'low-gold', name: 'Low Gold Area' }),
        createMockArea({ id: 'good-gold', name: 'Good Gold Area' }),
      ];
      const monsters = [
        createMockMonster({ gold: 5, areas: ['low-gold'] }),
        createMockMonster({ gold: 24, areas: ['good-gold'] }),
      ];

      const result = validateEconomyBalance(areas, monsters);

      expect(result.recommendations.some(r => r.includes('Low Gold Area'))).toBe(true);
    });
  });

  describe('generateEconomyReport', () => {
    it('should generate formatted report string', () => {
      const areas = [createMockArea({ name: 'Test Forest' })];
      const monsters = [createMockMonster({ gold: 24, areas: ['test-area'] })];

      const report = generateEconomyReport(areas, monsters);

      expect(report).toContain('ECONOMY BALANCE REPORT');
      expect(report).toContain('Test Forest');
      expect(report).toContain('Gold/Hour');
    });

    it('should include overall status', () => {
      const areas = [createMockArea()];
      const monsters = [createMockMonster({ gold: 24, areas: ['test-area'] })];

      const report = generateEconomyReport(areas, monsters);

      expect(report).toContain('Overall Status:');
      expect(report).toMatch(/BALANCED|TOO_EASY|TOO_HARD/);
    });

    it('should include recommendations when present', () => {
      const areas = [createMockArea()];
      const monsters = [createMockMonster({ gold: 5, areas: ['test-area'] })];

      const report = generateEconomyReport(areas, monsters);

      expect(report).toContain('Recommendations:');
    });

    it('should use checkmarks for areas meeting targets', () => {
      const areas = [createMockArea()];
      const monsters = [createMockMonster({ gold: 24, areas: ['test-area'] })];

      const report = generateEconomyReport(areas, monsters);

      expect(report).toMatch(/[✓✗]/);
    });
  });
});

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Economy Integration Tests', () => {
  it('should validate tier 1 items are affordable within 30 minutes', () => {
    const itemCost = ITEM_PRICING_TIERS.tier1.max;
    const goldPerHour = GOLD_EARNING_RATES.earlyGame.goldPerHour[0];

    const timeline = getItemAffordabilityTimeline(itemCost, goldPerHour, 0);

    expect(timeline.minutesNeeded).toBeLessThanOrEqual(ITEM_PRICING_TIERS.tier1.targetMinutes[1]);
  });

  it('should validate tier 2 items are affordable within 2 hours', () => {
    const itemCost = ITEM_PRICING_TIERS.tier2.max;
    const goldPerHour = GOLD_EARNING_RATES.midGame.goldPerHour[0];

    const timeline = getItemAffordabilityTimeline(itemCost, goldPerHour, 0);

    expect(timeline.hoursNeeded).toBeLessThanOrEqual(
      ITEM_PRICING_TIERS.tier2.targetMinutes[1] / 60
    );
  });

  it('should validate combat assumptions produce target gold rates', () => {
    const goldPerMonster = 24;
    const combatsPerHour = COMBAT_ASSUMPTIONS.combatsPerHour;
    const expectedGoldPerHour = goldPerMonster * combatsPerHour;

    expect(expectedGoldPerHour).toBeGreaterThanOrEqual(1000);
    expect(expectedGoldPerHour).toBeLessThanOrEqual(2500);
  });
});
