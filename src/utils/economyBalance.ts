/**
 * Economy Balance Utilities
 *
 * Functions for calculating and validating game economy balance:
 * - Item pricing tiers
 * - Gold earning rates
 * - Shop unlock thresholds
 * - Affordability timelines
 *
 * Ensures 1000-2000 gold/hour earning rate and balanced progression
 */

import { ShopType, DEFAULT_ECONOMY_CONFIG, ShopPricingModifiers } from '../types/shop';
import { Area, Monster } from '../types/game';

// Type aliases for consistency with existing codebase
type ReactArea = Area;
type ReactMonster = Monster;

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Item pricing tiers for progression balance
 */
export const ITEM_PRICING_TIERS = {
  tier1: { min: 50, max: 500, name: 'Early Game', targetMinutes: [15, 30] },
  tier2: { min: 500, max: 1500, name: 'Mid Game', targetMinutes: [60, 120] },
  tier3: { min: 1500, max: 5000, name: 'Late Game', targetMinutes: [180, 300] },
  tier4: { min: 5000, max: 15000, name: 'End Game', targetMinutes: [300, 600] },
} as const;

/**
 * Gold earning rates by player level
 */
export const GOLD_EARNING_RATES = {
  earlyGame: { minLevel: 1, maxLevel: 5, goldPerHour: [1000, 1500] },
  midGame: { minLevel: 6, maxLevel: 10, goldPerHour: [1500, 2000] },
  lateGame: { minLevel: 11, maxLevel: 20, goldPerHour: [2000, 2500] },
} as const;

/**
 * Combat encounter assumptions for gold calculations
 */
export const COMBAT_ASSUMPTIONS = {
  averageCombatSeconds: 30,
  encounterRate: 0.7, // 70% chance per exploration
  explorationsPerMinute: 2,
  combatsPerHour: 84, // (60 / 30) * 60 * 0.7
} as const;

// =============================================================================
// PRICING CALCULATIONS
// =============================================================================

/**
 * Calculate item price with shop type modifiers
 *
 * @param baseValue - Base item value
 * @param shopType - Type of shop selling the item
 * @param playerLevel - Current player level (for future level-based pricing)
 * @returns Final purchase price
 */
export function calculateItemPricing(
  baseValue: number,
  shopType: ShopType,
  playerLevel: number = 1
): number {
  const modifiers = DEFAULT_ECONOMY_CONFIG.shopTypeModifiers[shopType];
  const buyMultiplier = modifiers.buyMultiplier;

  // Future: Could add level-based dynamic pricing here
  // For now, just apply shop type modifier
  return Math.floor(baseValue * buyMultiplier);
}

/**
 * Get shop-specific pricing modifiers
 *
 * @param shopType - Type of shop
 * @returns Pricing modifiers for that shop type
 */
export function getShopPricingModifiers(shopType: ShopType): ShopPricingModifiers {
  return DEFAULT_ECONOMY_CONFIG.shopTypeModifiers[shopType];
}

/**
 * Calculate sell price for an item based on shop type
 *
 * @param baseValue - Base item value
 * @param shopType - Type of shop buying the item
 * @returns Sell price
 */
export function calculateShopSellPrice(baseValue: number, shopType: ShopType): number {
  const modifiers = DEFAULT_ECONOMY_CONFIG.shopTypeModifiers[shopType];
  return Math.max(1, Math.floor(baseValue * modifiers.sellMultiplier));
}

/**
 * Determine pricing tier for an item
 *
 * @param itemValue - Item's gold value
 * @returns Pricing tier information
 */
export function getItemPricingTier(itemValue: number) {
  if (itemValue < ITEM_PRICING_TIERS.tier1.max) {
    return ITEM_PRICING_TIERS.tier1;
  } else if (itemValue < ITEM_PRICING_TIERS.tier2.max) {
    return ITEM_PRICING_TIERS.tier2;
  } else if (itemValue < ITEM_PRICING_TIERS.tier3.max) {
    return ITEM_PRICING_TIERS.tier3;
  } else {
    return ITEM_PRICING_TIERS.tier4;
  }
}

// =============================================================================
// GOLD EARNING RATE CALCULATIONS
// =============================================================================

/**
 * Calculate expected gold per hour from combat in an area
 *
 * @param area - Area to calculate for
 * @param monsters - Monster data for the area
 * @param playerLevel - Player's current level
 * @returns Expected gold per hour range [min, max]
 */
export function calculateAreaGoldPerHour(
  area: ReactArea,
  monsters: ReactMonster[],
  playerLevel: number
): [number, number] {
  if (monsters.length === 0) {
    return [0, 0];
  }

  // Calculate average gold drop from monsters in this area
  const areaMonsters = monsters.filter(m => m.areas?.includes(area.id));

  if (areaMonsters.length === 0) {
    return [0, 0];
  }

  const avgGoldPerMonster =
    areaMonsters.reduce((sum, monster) => {
      // Get average gold from monster
      const monsterGold = monster.gold || 0;
      return sum + monsterGold;
    }, 0) / areaMonsters.length;

  // Calculate gold per hour based on combat assumptions
  const encounterRate = area.encounterRate || COMBAT_ASSUMPTIONS.encounterRate;
  const combatsPerHour = COMBAT_ASSUMPTIONS.combatsPerHour;

  // Adjust for actual encounter rate
  const effectiveCombats = combatsPerHour * encounterRate;
  const goldPerHour = avgGoldPerMonster * effectiveCombats;

  // Return range with 20% variance
  return [Math.floor(goldPerHour * 0.9), Math.floor(goldPerHour * 1.1)];
}

/**
 * Validate that an area meets the 1000-2000 gold/hour target
 *
 * @param area - Area to validate
 * @param monsters - Monster data
 * @param playerLevel - Player level
 * @returns Validation result with suggestions
 */
export function validateAreaGoldEarningRate(
  area: ReactArea,
  monsters: ReactMonster[],
  playerLevel: number
): {
  valid: boolean;
  goldPerHour: [number, number];
  suggestion?: string;
} {
  const [minGold, maxGold] = calculateAreaGoldPerHour(area, monsters, playerLevel);
  const [targetMin, targetMax] = DEFAULT_ECONOMY_CONFIG.targetGoldPerHour;

  const valid = minGold >= targetMin * 0.8 && maxGold <= targetMax * 1.2;

  let suggestion: string | undefined;
  if (minGold < targetMin) {
    const increaseNeeded = Math.ceil((targetMin - minGold) / COMBAT_ASSUMPTIONS.combatsPerHour);
    suggestion = `Increase monster gold drops by ${increaseNeeded} per monster`;
  } else if (maxGold > targetMax * 1.5) {
    suggestion = 'Reduce monster gold drops to prevent inflation';
  }

  return {
    valid,
    goldPerHour: [minGold, maxGold],
    suggestion,
  };
}

/**
 * Calculate gold earning rate across all areas
 *
 * @param areas - All game areas
 * @param monsters - All monsters
 * @returns Summary of gold earning rates by area
 */
export function calculateGoldEarningRate(
  areas: ReactArea[],
  monsters: ReactMonster[]
): {
  areaId: string;
  areaName: string;
  recommendedLevel: number;
  goldPerHour: [number, number];
  meetsTarget: boolean;
}[] {
  const [targetMin, targetMax] = DEFAULT_ECONOMY_CONFIG.targetGoldPerHour;

  return areas.map(area => {
    const [minGold, maxGold] = calculateAreaGoldPerHour(area, monsters, area.recommendedLevel);
    const meetsTarget = minGold >= targetMin * 0.8 && maxGold <= targetMax * 1.2;

    return {
      areaId: area.id,
      areaName: area.name,
      recommendedLevel: area.recommendedLevel,
      goldPerHour: [minGold, maxGold],
      meetsTarget,
    };
  });
}

// =============================================================================
// AFFORDABILITY CALCULATIONS
// =============================================================================

/**
 * Calculate how long it takes to afford an item at current earning rate
 *
 * @param itemCost - Total cost of the item
 * @param goldPerHour - Player's current gold earning rate
 * @param currentGold - Player's current gold
 * @returns Hours needed to afford the item
 */
export function getItemAffordabilityTimeline(
  itemCost: number,
  goldPerHour: number,
  currentGold: number = 0
): {
  hoursNeeded: number;
  minutesNeeded: number;
  canAffordNow: boolean;
  tier: (typeof ITEM_PRICING_TIERS)[keyof typeof ITEM_PRICING_TIERS];
} {
  const tier = getItemPricingTier(itemCost);
  const canAffordNow = currentGold >= itemCost;

  if (canAffordNow) {
    return {
      hoursNeeded: 0,
      minutesNeeded: 0,
      canAffordNow: true,
      tier,
    };
  }

  const goldNeeded = itemCost - currentGold;
  const hoursNeeded = goldNeeded / goldPerHour;
  const minutesNeeded = Math.ceil(hoursNeeded * 60);

  return {
    hoursNeeded: Math.ceil(hoursNeeded * 10) / 10, // Round to 1 decimal
    minutesNeeded,
    canAffordNow: false,
    tier,
  };
}

/**
 * Get recommended gold earning rate for player level
 *
 * @param playerLevel - Player's current level
 * @returns Expected gold per hour range
 */
export function getRecommendedGoldRate(playerLevel: number): [number, number] {
  if (playerLevel <= GOLD_EARNING_RATES.earlyGame.maxLevel) {
    return GOLD_EARNING_RATES.earlyGame.goldPerHour;
  } else if (playerLevel <= GOLD_EARNING_RATES.midGame.maxLevel) {
    return GOLD_EARNING_RATES.midGame.goldPerHour;
  } else {
    return GOLD_EARNING_RATES.lateGame.goldPerHour;
  }
}

// =============================================================================
// SHOP UNLOCK THRESHOLDS
// =============================================================================

/**
 * Get recommended unlock thresholds for shop types
 *
 * @param shopType - Type of shop
 * @returns Recommended level and story requirements
 */
export function getUnlockThresholds(shopType: ShopType): {
  recommendedLevel: number;
  recommendedStory: number;
  reasoning: string;
} {
  switch (shopType) {
    case 'general':
      return {
        recommendedLevel: 1,
        recommendedStory: 0,
        reasoning: 'Basic shop, available from start',
      };

    case 'weapon':
      return {
        recommendedLevel: 3,
        recommendedStory: 1,
        reasoning: 'Players need combat experience before upgrading weapons',
      };

    case 'armor':
      return {
        recommendedLevel: 3,
        recommendedStory: 1,
        reasoning: 'Players need combat experience before upgrading armor',
      };

    case 'magic':
      return {
        recommendedLevel: 5,
        recommendedStory: 2,
        reasoning: 'Advanced shop, requires story progress and higher level',
      };

    case 'apothecary':
      return {
        recommendedLevel: 2,
        recommendedStory: 1,
        reasoning: 'Potion shop, useful early but not from start',
      };

    default:
      return {
        recommendedLevel: 1,
        recommendedStory: 0,
        reasoning: 'Default shop type',
      };
  }
}

/**
 * Get item unlock level recommendations based on value
 *
 * @param itemValue - Item's gold value
 * @returns Recommended unlock level
 */
export function getRecommendedItemUnlockLevel(itemValue: number): number {
  const tier = getItemPricingTier(itemValue);

  if (tier === ITEM_PRICING_TIERS.tier1) {
    return 1;
  } else if (tier === ITEM_PRICING_TIERS.tier2) {
    return 5;
  } else if (tier === ITEM_PRICING_TIERS.tier3) {
    return 10;
  } else {
    return 15;
  }
}

// =============================================================================
// BALANCE VALIDATION
// =============================================================================

/**
 * Validate overall economy balance
 *
 * @param areas - All game areas
 * @param monsters - All monsters
 * @returns Comprehensive balance report
 */
export function validateEconomyBalance(
  areas: ReactArea[],
  monsters: ReactMonster[]
): {
  overall: 'balanced' | 'too_easy' | 'too_hard';
  areaReports: ReturnType<typeof validateAreaGoldEarningRate>[];
  recommendations: string[];
} {
  const areaReports = areas.map(area =>
    validateAreaGoldEarningRate(area, monsters, area.recommendedLevel)
  );

  const validAreas = areaReports.filter(r => r.valid).length;
  const totalAreas = areaReports.length;
  const percentageValid = totalAreas > 0 ? (validAreas / totalAreas) * 100 : 0;

  let overall: 'balanced' | 'too_easy' | 'too_hard';
  const recommendations: string[] = [];

  if (percentageValid >= 75) {
    overall = 'balanced';
  } else {
    const avgGold = areaReports.reduce((sum, r) => sum + r.goldPerHour[0], 0) / areaReports.length;
    const [targetMin] = DEFAULT_ECONOMY_CONFIG.targetGoldPerHour;

    if (avgGold < targetMin * 0.8) {
      overall = 'too_hard';
      recommendations.push('Economy is too stingy - players earn too little gold');
      recommendations.push('Consider increasing monster gold drops by 20-30%');
    } else {
      overall = 'too_easy';
      recommendations.push('Economy is too generous - players earn too much gold');
      recommendations.push('Consider reducing monster gold drops by 10-20%');
    }
  }

  // Add area-specific recommendations
  areaReports.forEach((report, index) => {
    if (!report.valid && report.suggestion) {
      recommendations.push(`${areas[index].name}: ${report.suggestion}`);
    }
  });

  return {
    overall,
    areaReports,
    recommendations,
  };
}

/**
 * Generate economy balance report for debugging/balancing
 *
 * @param areas - All game areas
 * @param monsters - All monsters
 * @returns Formatted report string
 */
export function generateEconomyReport(areas: ReactArea[], monsters: ReactMonster[]): string {
  const validation = validateEconomyBalance(areas, monsters);
  const earningRates = calculateGoldEarningRate(areas, monsters);

  let report = 'ECONOMY BALANCE REPORT\n';
  report += '='.repeat(60) + '\n\n';

  report += `Overall Status: ${validation.overall.toUpperCase()}\n\n`;

  report += 'Gold Earning Rates by Area:\n';
  report += '-'.repeat(60) + '\n';

  earningRates.forEach(rate => {
    const status = rate.meetsTarget ? '✓' : '✗';
    report += `${status} ${rate.areaName} (Level ${rate.recommendedLevel})\n`;
    report += `   Gold/Hour: ${rate.goldPerHour[0]}-${rate.goldPerHour[1]}\n`;
  });

  report += '\n';

  if (validation.recommendations.length > 0) {
    report += 'Recommendations:\n';
    report += '-'.repeat(60) + '\n';
    validation.recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });
  }

  return report;
}
