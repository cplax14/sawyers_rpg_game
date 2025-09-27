/**
 * Equipment Utilities
 * Comprehensive utilities for equipment stat calculations, compatibility checks,
 * and equipment management operations.
 */

import {
  EnhancedItem,
  EquipmentSet,
  EquipmentSlot,
  StatModifier,
  EquipmentRequirement,
  EquipmentCompatibility
} from '../types/inventory';
import { PlayerStats } from '../types/game';

export interface StatCalculationResult {
  baseStats: PlayerStats;
  equipmentBonuses: PlayerStats;
  finalStats: PlayerStats;
  totalStatValue: number;
  breakdown: StatBreakdown[];
}

export interface StatBreakdown {
  slot: EquipmentSlot;
  item: EnhancedItem;
  statContributions: Partial<PlayerStats>;
  totalContribution: number;
}

export interface CompatibilityCheckResult {
  compatible: boolean;
  requirements: EquipmentRequirement[];
  unmetRequirements: string[];
  warnings: string[];
  recommendations?: string[];
}

export interface EquipmentComparisonResult {
  statChanges: Record<keyof PlayerStats, number>;
  totalStatChange: number;
  isUpgrade: boolean;
  significantChanges: Array<{
    stat: keyof PlayerStats;
    change: number;
    percentage: number;
  }>;
  recommendation: 'strong_upgrade' | 'minor_upgrade' | 'no_change' | 'minor_downgrade' | 'strong_downgrade';
}

export interface EquipmentRecommendation {
  slot: EquipmentSlot;
  currentItem?: EnhancedItem;
  recommendedItem: EnhancedItem;
  statImprovement: {
    total: number;
    breakdown: Record<keyof PlayerStats, number>;
  };
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface EquipmentOptimizationResult {
  currentSetValue: number;
  optimizedSet: EquipmentSet;
  optimizedSetValue: number;
  improvement: number;
  changes: Array<{
    slot: EquipmentSlot;
    from?: EnhancedItem;
    to: EnhancedItem;
    statGain: number;
  }>;
}

// Default stat values for calculations
const DEFAULT_BASE_STATS: PlayerStats = {
  attack: 10,
  defense: 10,
  magicAttack: 10,
  magicDefense: 10,
  speed: 10,
  accuracy: 85
};

/**
 * Calculate comprehensive stats from equipment set
 */
export function calculateEquipmentStats(
  equipmentSet: EquipmentSet,
  baseStats: PlayerStats = DEFAULT_BASE_STATS
): StatCalculationResult {
  const equipmentBonuses: PlayerStats = {
    attack: 0,
    defense: 0,
    magicAttack: 0,
    magicDefense: 0,
    speed: 0,
    accuracy: 0
  };

  const breakdown: StatBreakdown[] = [];

  // Process each equipped item
  Object.entries(equipmentSet).forEach(([slot, item]) => {
    if (!item || !item.statModifiers) return;

    const statContributions: Partial<PlayerStats> = {};
    let totalContribution = 0;

    Object.entries(item.statModifiers).forEach(([stat, modifier]) => {
      const statKey = stat as keyof PlayerStats;
      const value = modifier.value;

      if (statKey in equipmentBonuses) {
        equipmentBonuses[statKey] += value;
        statContributions[statKey] = value;
        totalContribution += Math.abs(value);
      }
    });

    breakdown.push({
      slot: slot as EquipmentSlot,
      item,
      statContributions,
      totalContribution
    });
  });

  // Calculate final stats
  const finalStats: PlayerStats = {
    attack: baseStats.attack + equipmentBonuses.attack,
    defense: baseStats.defense + equipmentBonuses.defense,
    magicAttack: baseStats.magicAttack + equipmentBonuses.magicAttack,
    magicDefense: baseStats.magicDefense + equipmentBonuses.magicDefense,
    speed: baseStats.speed + equipmentBonuses.speed,
    accuracy: Math.min(100, Math.max(0, baseStats.accuracy + equipmentBonuses.accuracy))
  };

  // Calculate total stat value for optimization
  const totalStatValue = Object.values(finalStats).reduce((sum, value) => sum + value, 0);

  return {
    baseStats,
    equipmentBonuses,
    finalStats,
    totalStatValue,
    breakdown
  };
}

/**
 * Check equipment compatibility for a player
 */
export function checkEquipmentCompatibility(
  item: EnhancedItem,
  slot: EquipmentSlot,
  playerLevel: number,
  playerClass: string,
  currentStats: PlayerStats
): CompatibilityCheckResult {
  const unmetRequirements: string[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Check if item is meant for this slot
  if (item.equipmentSlot && item.equipmentSlot !== slot) {
    unmetRequirements.push(`Item cannot be equipped in ${slot} slot (requires ${item.equipmentSlot})`);
  }

  // Check level requirements
  if (item.requirements?.level && playerLevel < item.requirements.level) {
    unmetRequirements.push(`Requires level ${item.requirements.level} (current: ${playerLevel})`);
  }

  // Check class requirements
  if (item.requirements?.classes && item.requirements.classes.length > 0) {
    if (!item.requirements.classes.includes(playerClass)) {
      unmetRequirements.push(`Not compatible with ${playerClass} class (requires: ${item.requirements.classes.join(', ')})`);
    }
  }

  // Check stat requirements
  if (item.requirements?.stats) {
    Object.entries(item.requirements.stats).forEach(([stat, required]) => {
      const currentValue = currentStats[stat as keyof PlayerStats];
      if (currentValue < required) {
        unmetRequirements.push(`Requires ${stat}: ${required} (current: ${currentValue})`);
      }
    });
  }

  // Generate warnings for suboptimal usage
  if (item.rarity === 'legendary' && playerLevel < 20) {
    warnings.push('This legendary item may be too powerful for your current level');
  }

  if (item.rarity === 'common' && playerLevel > 50) {
    warnings.push('This common item may be underpowered for your level');
  }

  // Generate recommendations
  if (item.statModifiers) {
    const strongestStat = Object.entries(item.statModifiers)
      .reduce((max, [stat, modifier]) =>
        modifier.value > (max?.modifier.value || 0) ? { stat, modifier } : max,
        null as { stat: string; modifier: StatModifier } | null
      );

    if (strongestStat) {
      recommendations.push(`Best suited for ${strongestStat.stat}-focused builds`);
    }
  }

  return {
    compatible: unmetRequirements.length === 0,
    requirements: item.requirements ? [item.requirements] : [],
    unmetRequirements,
    warnings,
    recommendations
  };
}

/**
 * Compare two items for the same slot
 */
export function compareEquipment(
  currentItem: EnhancedItem | undefined,
  newItem: EnhancedItem,
  baseStats: PlayerStats = DEFAULT_BASE_STATS
): EquipmentComparisonResult {
  const statChanges: Record<keyof PlayerStats, number> = {
    attack: 0,
    defense: 0,
    magicAttack: 0,
    magicDefense: 0,
    speed: 0,
    accuracy: 0
  };

  // Calculate current stats
  const currentStats = currentItem?.statModifiers || {};
  const newStats = newItem.statModifiers || {};

  // Calculate changes for each stat
  Object.keys(statChanges).forEach(stat => {
    const statKey = stat as keyof PlayerStats;
    const currentValue = currentStats[statKey]?.value || 0;
    const newValue = newStats[statKey]?.value || 0;
    statChanges[statKey] = newValue - currentValue;
  });

  // Calculate total stat change
  const totalStatChange = Object.values(statChanges).reduce((sum, change) => sum + change, 0);

  // Identify significant changes (>5% of base stat or >2 absolute points)
  const significantChanges = Object.entries(statChanges)
    .filter(([stat, change]) => {
      const baseStat = baseStats[stat as keyof PlayerStats];
      return Math.abs(change) >= 2 || Math.abs(change) >= baseStat * 0.05;
    })
    .map(([stat, change]) => ({
      stat: stat as keyof PlayerStats,
      change,
      percentage: (change / baseStats[stat as keyof PlayerStats]) * 100
    }));

  // Determine recommendation
  let recommendation: EquipmentComparisonResult['recommendation'];
  if (totalStatChange >= 10) {
    recommendation = 'strong_upgrade';
  } else if (totalStatChange >= 3) {
    recommendation = 'minor_upgrade';
  } else if (totalStatChange <= -10) {
    recommendation = 'strong_downgrade';
  } else if (totalStatChange <= -3) {
    recommendation = 'minor_downgrade';
  } else {
    recommendation = 'no_change';
  }

  return {
    statChanges,
    totalStatChange,
    isUpgrade: totalStatChange > 0,
    significantChanges,
    recommendation
  };
}

/**
 * Generate equipment recommendations based on available items
 */
export function generateEquipmentRecommendations(
  currentEquipment: EquipmentSet,
  availableItems: EnhancedItem[],
  baseStats: PlayerStats,
  playerLevel: number,
  playerClass: string
): EquipmentRecommendation[] {
  const recommendations: EquipmentRecommendation[] = [];

  // Group available items by slot
  const itemsBySlot: Record<EquipmentSlot, EnhancedItem[]> = {} as any;
  availableItems.forEach(item => {
    if (item.equipmentSlot) {
      if (!itemsBySlot[item.equipmentSlot]) {
        itemsBySlot[item.equipmentSlot] = [];
      }
      itemsBySlot[item.equipmentSlot].push(item);
    }
  });

  // Check each slot for potential upgrades
  Object.entries(itemsBySlot).forEach(([slot, items]) => {
    const equipmentSlot = slot as EquipmentSlot;
    const currentItem = currentEquipment[equipmentSlot];

    // Find the best upgrade for this slot
    const bestUpgrade = items
      .filter(item => {
        const compatibility = checkEquipmentCompatibility(
          item, equipmentSlot, playerLevel, playerClass, baseStats
        );
        return compatibility.compatible;
      })
      .map(item => {
        const comparison = compareEquipment(currentItem, item, baseStats);
        return { item, comparison };
      })
      .filter(({ comparison }) => comparison.isUpgrade)
      .sort((a, b) => b.comparison.totalStatChange - a.comparison.totalStatChange)[0];

    if (bestUpgrade) {
      const priority: EquipmentRecommendation['priority'] =
        bestUpgrade.comparison.recommendation === 'strong_upgrade' ? 'high' :
        bestUpgrade.comparison.recommendation === 'minor_upgrade' ? 'medium' : 'low';

      recommendations.push({
        slot: equipmentSlot,
        currentItem,
        recommendedItem: bestUpgrade.item,
        statImprovement: {
          total: bestUpgrade.comparison.totalStatChange,
          breakdown: bestUpgrade.comparison.statChanges
        },
        priority,
        reason: bestUpgrade.comparison.recommendation === 'strong_upgrade'
          ? `Significant stat improvement (+${bestUpgrade.comparison.totalStatChange} total stats)`
          : `Minor stat improvement (+${bestUpgrade.comparison.totalStatChange} total stats)`
      });
    }
  });

  // Sort by priority and stat improvement
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.statImprovement.total - a.statImprovement.total;
  });
}

/**
 * Optimize equipment set for maximum stats
 */
export function optimizeEquipmentSet(
  currentEquipment: EquipmentSet,
  availableItems: EnhancedItem[],
  baseStats: PlayerStats,
  playerLevel: number,
  playerClass: string
): EquipmentOptimizationResult {
  const currentStats = calculateEquipmentStats(currentEquipment, baseStats);
  const optimizedSet: EquipmentSet = { ...currentEquipment };
  const changes: EquipmentOptimizationResult['changes'] = [];

  // Group available items by slot
  const itemsBySlot: Record<EquipmentSlot, EnhancedItem[]> = {} as any;
  availableItems.forEach(item => {
    if (item.equipmentSlot) {
      if (!itemsBySlot[item.equipmentSlot]) {
        itemsBySlot[item.equipmentSlot] = [];
      }
      itemsBySlot[item.equipmentSlot].push(item);
    }
  });

  // Find best item for each slot
  Object.entries(itemsBySlot).forEach(([slot, items]) => {
    const equipmentSlot = slot as EquipmentSlot;

    const bestItem = items
      .filter(item => {
        const compatibility = checkEquipmentCompatibility(
          item, equipmentSlot, playerLevel, playerClass, baseStats
        );
        return compatibility.compatible;
      })
      .reduce((best, item) => {
        if (!best) return item;

        const currentComparison = compareEquipment(undefined, best, baseStats);
        const newComparison = compareEquipment(undefined, item, baseStats);

        return newComparison.totalStatChange > currentComparison.totalStatChange ? item : best;
      }, null as EnhancedItem | null);

    if (bestItem) {
      const currentItem = optimizedSet[equipmentSlot];
      const comparison = compareEquipment(currentItem, bestItem, baseStats);

      if (comparison.isUpgrade) {
        optimizedSet[equipmentSlot] = bestItem;
        changes.push({
          slot: equipmentSlot,
          from: currentItem,
          to: bestItem,
          statGain: comparison.totalStatChange
        });
      }
    }
  });

  const optimizedStats = calculateEquipmentStats(optimizedSet, baseStats);
  const improvement = optimizedStats.totalStatValue - currentStats.totalStatValue;

  return {
    currentSetValue: currentStats.totalStatValue,
    optimizedSet,
    optimizedSetValue: optimizedStats.totalStatValue,
    improvement,
    changes
  };
}

/**
 * Calculate set bonuses (for future implementation)
 */
export function calculateSetBonuses(equipmentSet: EquipmentSet): Record<string, any> {
  // Placeholder for set bonus calculation
  // This would check for matching item sets and apply additional bonuses
  return {};
}

/**
 * Validate equipment slot assignment
 */
export function validateEquipmentSlot(item: EnhancedItem, slot: EquipmentSlot): boolean {
  if (!item.equipmentSlot) return false;
  return item.equipmentSlot === slot;
}

/**
 * Get equipment slot priority for auto-equip
 */
export function getSlotPriority(slot: EquipmentSlot): number {
  const priorities: Record<EquipmentSlot, number> = {
    weapon: 10,
    armor: 9,
    helmet: 8,
    shield: 7,
    boots: 6,
    gloves: 5,
    necklace: 4,
    ring1: 3,
    ring2: 2,
    charm: 1
  };

  return priorities[slot] || 0;
}

/**
 * Format stat value for display
 */
export function formatStatValue(value: number): string {
  if (value === 0) return '0';
  return value > 0 ? `+${value}` : value.toString();
}

/**
 * Calculate equipment durability impact (for future implementation)
 */
export function calculateDurabilityImpact(item: EnhancedItem, durability: number): number {
  // Placeholder for durability calculations
  // Would reduce item effectiveness based on current durability
  return Math.max(0.1, durability / 100);
}

/**
 * Get rarity multiplier for stat calculations
 */
export function getRarityMultiplier(rarity: string): number {
  const multipliers: Record<string, number> = {
    common: 1.0,
    uncommon: 1.1,
    rare: 1.25,
    epic: 1.5,
    legendary: 2.0,
    mythical: 2.5
  };

  return multipliers[rarity] || 1.0;
}

/**
 * Equipment utilities export
 */
export const equipmentUtils = {
  calculateEquipmentStats,
  checkEquipmentCompatibility,
  compareEquipment,
  generateEquipmentRecommendations,
  optimizeEquipmentSet,
  calculateSetBonuses,
  validateEquipmentSlot,
  getSlotPriority,
  formatStatValue,
  calculateDurabilityImpact,
  getRarityMultiplier
};