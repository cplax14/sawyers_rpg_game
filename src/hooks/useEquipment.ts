/**
 * useEquipment Hook
 * Comprehensive equipment management with stat calculations and compatibility
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGameState } from './useGameState';
import { useInventory } from './useInventory';
import {
  EquipmentSet,
  EnhancedItem,
  EquipmentComparison,
  EquipmentCompatibility,
  EquipItemResult,
  StatCalculation,
  CalculatedStats,
  StatModifier,
  EquipmentSlot,
  EquipmentSubtype,
  EQUIPMENT_SLOTS,
  EXTENDED_EQUIPMENT_SLOTS,
  EQUIPMENT_COMPATIBILITY_RULES,
  ActiveEquipmentSets,
  EquipmentUpgrade,
  ValidationResult
} from '../types/inventory';
import { PlayerStats } from '../contexts/ReactGameContext';

// Equipment state management
interface EquipmentState {
  equipped: EquipmentSet;
  statCalculations: CalculatedStats;
  activeModifiers: StatModifier[];
  equipmentSets: ActiveEquipmentSets;
  lastEquipTime: Date;
}

export const useEquipment = () => {
  const gameState = useGameState();
  const { inventoryState, addItem, removeItem, addEventListener } = useInventory();

  // Equipment state
  const [equipmentState, setEquipmentState] = useState<EquipmentState>(() => {
    const initialEquipped: EquipmentSet = {
      weapon: null,
      armor: null,
      accessory: null,
      helmet: null,
      chestplate: null,
      boots: null,
      gloves: null,
      ring1: null,
      ring2: null,
      necklace: null,
      charm: null
    };

    return {
      equipped: initialEquipped,
      statCalculations: {} as CalculatedStats,
      activeModifiers: [],
      equipmentSets: {},
      lastEquipTime: new Date()
    };
  });

  // Calculate base stats from level and class
  const getBaseStats = useCallback((): PlayerStats => {
    const player = gameState.state.player;
    if (!player) {
      return {
        attack: 10,
        defense: 10,
        magicAttack: 10,
        magicDefense: 10,
        speed: 10,
        accuracy: 10
      };
    }

    // Base stats calculation based on level and class
    const level = player.level;
    const classModifiers = {
      warrior: { attack: 1.2, defense: 1.3, magicAttack: 0.8, magicDefense: 1.0, speed: 0.9, accuracy: 1.0 },
      mage: { attack: 0.8, defense: 0.9, magicAttack: 1.4, magicDefense: 1.2, speed: 1.0, accuracy: 1.1 },
      archer: { attack: 1.1, defense: 0.8, magicAttack: 0.9, magicDefense: 0.9, speed: 1.3, accuracy: 1.4 },
      rogue: { attack: 1.0, defense: 0.9, magicAttack: 0.7, magicDefense: 0.8, speed: 1.4, accuracy: 1.2 }
    };

    const modifier = classModifiers[player.class as keyof typeof classModifiers] || classModifiers.warrior;

    return {
      attack: Math.floor((10 + level * 2) * modifier.attack),
      defense: Math.floor((10 + level * 2) * modifier.defense),
      magicAttack: Math.floor((10 + level * 2) * modifier.magicAttack),
      magicDefense: Math.floor((10 + level * 2) * modifier.magicDefense),
      speed: Math.floor((10 + level * 2) * modifier.speed),
      accuracy: Math.floor((10 + level * 2) * modifier.accuracy)
    };
  }, [gameState.state.player]);

  // Calculate equipment stat bonuses
  const calculateEquipmentStats = useCallback((): Partial<PlayerStats> => {
    const stats: Partial<PlayerStats> = {
      attack: 0,
      defense: 0,
      magicAttack: 0,
      magicDefense: 0,
      speed: 0,
      accuracy: 0
    };

    Object.values(equipmentState.equipped).forEach(item => {
      if (item?.statModifiers) {
        Object.entries(item.statModifiers).forEach(([stat, value]) => {
          if (stats[stat as keyof PlayerStats] !== undefined && value !== undefined) {
            stats[stat as keyof PlayerStats]! += value;
          }
        });
      }
    });

    return stats;
  }, [equipmentState.equipped]);

  // Calculate final stats with all modifiers
  const calculateFinalStats = useCallback((): CalculatedStats => {
    const baseStats = getBaseStats();
    const equipmentStats = calculateEquipmentStats();

    const createStatCalculation = (
      baseStat: number,
      equipmentBonus: number,
      stat: keyof PlayerStats
    ): StatCalculation => {
      const levelBonus = Math.floor(baseStat * 0.1); // 10% bonus from level
      const temporaryBonus = 0; // From buffs/debuffs
      const percentage = 100; // No percentage modifiers yet
      const finalValue = Math.floor((baseStat + equipmentBonus + levelBonus + temporaryBonus) * (percentage / 100));

      const breakdown: any[] = [
        {
          source: 'Base',
          type: 'base' as const,
          value: baseStat,
          description: 'Base character stats'
        },
        {
          source: 'Equipment',
          type: 'equipment' as const,
          value: equipmentBonus,
          description: 'Equipment bonuses'
        },
        {
          source: 'Level',
          type: 'level' as const,
          value: levelBonus,
          description: 'Level progression bonus'
        }
      ];

      return {
        baseStat,
        equipmentBonus,
        levelBonus,
        temporaryBonus,
        percentage,
        finalValue,
        breakdown
      };
    };

    return {
      attack: createStatCalculation(baseStats.attack, equipmentStats.attack || 0, 'attack'),
      defense: createStatCalculation(baseStats.defense, equipmentStats.defense || 0, 'defense'),
      magicAttack: createStatCalculation(baseStats.magicAttack, equipmentStats.magicAttack || 0, 'magicAttack'),
      magicDefense: createStatCalculation(baseStats.magicDefense, equipmentStats.magicDefense || 0, 'magicDefense'),
      speed: createStatCalculation(baseStats.speed, equipmentStats.speed || 0, 'speed'),
      accuracy: createStatCalculation(baseStats.accuracy, equipmentStats.accuracy || 0, 'accuracy'),
      health: createStatCalculation(
        100 + (gameState.state.player?.level || 1) * 10,
        0,
        'attack' // Using attack as placeholder for keyof PlayerStats
      ),
      mana: createStatCalculation(
        50 + (gameState.state.player?.level || 1) * 5,
        0,
        'attack' // Using attack as placeholder for keyof PlayerStats
      ),
      criticalChance: createStatCalculation(5, 0, 'accuracy'),
      criticalDamage: createStatCalculation(150, 0, 'attack'),
      evasion: createStatCalculation(baseStats.speed / 2, 0, 'speed'),
      resistance: createStatCalculation(baseStats.magicDefense / 2, 0, 'magicDefense')
    };
  }, [getBaseStats, calculateEquipmentStats, gameState.state.player]);

  // Check equipment compatibility
  const checkCompatibility = useCallback((
    item: EnhancedItem,
    slot: EquipmentSlot
  ): EquipmentCompatibility => {
    const player = gameState.state.player;
    const reasons: any[] = [];
    const warnings: any[] = [];
    const suggestions: string[] = [];

    if (!player) {
      reasons.push({
        type: 'class_requirement',
        satisfied: false,
        current: 'none',
        required: 'any',
        description: 'No player character found'
      });
      return { canEquip: false, reasons, warnings, suggestions };
    }

    // Check level requirement
    if (item.levelRequirement && player.level < item.levelRequirement) {
      reasons.push({
        type: 'level_requirement',
        satisfied: false,
        current: player.level,
        required: item.levelRequirement,
        description: `Requires level ${item.levelRequirement}`
      });
    }

    // Check class requirement
    if (item.classRequirement && !item.classRequirement.includes(player.class)) {
      reasons.push({
        type: 'class_requirement',
        satisfied: false,
        current: player.class,
        required: item.classRequirement,
        description: `Requires class: ${item.classRequirement.join(', ')}`
      });
    }

    // Check stat requirements
    const currentStats = calculateFinalStats();
    const statRequirements = EQUIPMENT_COMPATIBILITY_RULES.statRequirements[item.equipmentSubtype as keyof typeof EQUIPMENT_COMPATIBILITY_RULES.statRequirements];

    if (statRequirements) {
      Object.entries(statRequirements).forEach(([stat, required]) => {
        const current = currentStats[stat as keyof CalculatedStats]?.finalValue || 0;
        if (current < required) {
          reasons.push({
            type: 'stat_requirement',
            satisfied: false,
            current,
            required,
            description: `Requires ${stat}: ${required} (have ${current})`
          });
        }
      });
    }

    // Check slot compatibility
    if (item.equipmentSlot !== slot) {
      reasons.push({
        type: 'slot_conflict',
        satisfied: false,
        current: slot,
        required: item.equipmentSlot,
        description: `Item cannot be equipped in ${slot} slot`
      });
    }

    // Check for stat decreases
    const currentItem = equipmentState.equipped[slot];
    if (currentItem) {
      const comparison = compareEquipment(currentItem, item);
      if (comparison.netScore < 0) {
        warnings.push({
          type: 'stat_decrease',
          severity: 'medium' as const,
          description: 'This item may decrease overall stats',
          affectedStats: comparison.downgrades
        });
      }
    }

    const canEquip = reasons.every(reason => reason.satisfied !== false);

    // Add suggestions
    if (!canEquip) {
      if (reasons.some(r => r.type === 'level_requirement')) {
        suggestions.push('Level up to meet requirements');
      }
      if (reasons.some(r => r.type === 'stat_requirement')) {
        suggestions.push('Improve stats with other equipment or training');
      }
    }

    return { canEquip, reasons, warnings, suggestions };
  }, [gameState.state.player, equipmentState.equipped, calculateFinalStats]);

  // Compare two pieces of equipment
  const compareEquipment = useCallback((
    currentItem: EnhancedItem | null,
    newItem: EnhancedItem
  ): EquipmentComparison => {
    const statChanges: Partial<PlayerStats> = {};
    const improvements: string[] = [];
    const downgrades: string[] = [];

    // Compare stat modifiers
    const currentStats = currentItem?.statModifiers || {};
    const newStats = newItem.statModifiers || {};

    const allStats = new Set([...Object.keys(currentStats), ...Object.keys(newStats)]);

    allStats.forEach(stat => {
      const currentValue = currentStats[stat as keyof PlayerStats] || 0;
      const newValue = newStats[stat as keyof PlayerStats] || 0;
      const change = newValue - currentValue;

      if (change !== 0) {
        statChanges[stat as keyof PlayerStats] = change;

        if (change > 0) {
          improvements.push(`+${change} ${stat}`);
        } else {
          downgrades.push(`${change} ${stat}`);
        }
      }
    });

    // Calculate net score (simple sum of stat changes)
    const netScore = Object.values(statChanges).reduce((sum, change) => sum + (change || 0), 0);

    return {
      currentItem,
      newItem,
      statChanges,
      improvements,
      downgrades,
      netScore
    };
  }, []);

  // Equip item
  const equipItem = useCallback(async (
    item: EnhancedItem,
    slot?: EquipmentSlot
  ): Promise<EquipItemResult> => {
    try {
      // Determine target slot
      const targetSlot = slot || item.equipmentSlot;
      if (!targetSlot) {
        return {
          success: false,
          equipped: null,
          unequipped: null,
          statChanges: {},
          message: 'Item cannot be equipped',
          errors: ['Item has no valid equipment slot']
        };
      }

      // Check compatibility
      const compatibility = checkCompatibility(item, targetSlot);
      if (!compatibility.canEquip) {
        return {
          success: false,
          equipped: null,
          unequipped: null,
          statChanges: {},
          message: 'Cannot equip item',
          errors: compatibility.reasons.map(r => r.description)
        };
      }

      // Get currently equipped item
      const currentItem = equipmentState.equipped[targetSlot];

      // Calculate stat changes
      const comparison = compareEquipment(currentItem, item);

      // Unequip current item (add to inventory)
      if (currentItem) {
        await addItem(currentItem, 1);
      }

      // Remove new item from inventory
      await removeItem(item.id, 1);

      // Update equipment state
      setEquipmentState(prev => ({
        ...prev,
        equipped: {
          ...prev.equipped,
          [targetSlot]: item
        },
        lastEquipTime: new Date()
      }));

      // Update game state for backward compatibility
      if (gameState.state.player) {
        gameState.dispatch({
          type: 'EQUIP_ITEM',
          payload: { playerId: gameState.state.player.id, itemId: item.id }
        });
      }

      return {
        success: true,
        equipped: item,
        unequipped: currentItem,
        statChanges: comparison.statChanges,
        message: `Equipped ${item.name}`,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        equipped: null,
        unequipped: null,
        statChanges: {},
        message: 'Failed to equip item',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }, [equipmentState.equipped, checkCompatibility, compareEquipment, addItem, removeItem, gameState]);

  // Unequip item
  const unequipItem = useCallback(async (slot: EquipmentSlot): Promise<EquipItemResult> => {
    try {
      const currentItem = equipmentState.equipped[slot];
      if (!currentItem) {
        return {
          success: false,
          equipped: null,
          unequipped: null,
          statChanges: {},
          message: 'No item equipped in this slot',
          errors: []
        };
      }

      // Add item back to inventory
      await addItem(currentItem, 1);

      // Update equipment state
      setEquipmentState(prev => ({
        ...prev,
        equipped: {
          ...prev.equipped,
          [slot]: null
        },
        lastEquipTime: new Date()
      }));

      // Calculate stat changes (loss of stats)
      const statChanges: Partial<PlayerStats> = {};
      if (currentItem.statModifiers) {
        Object.entries(currentItem.statModifiers).forEach(([stat, value]) => {
          if (value !== undefined) {
            statChanges[stat as keyof PlayerStats] = -value;
          }
        });
      }

      return {
        success: true,
        equipped: null,
        unequipped: currentItem,
        statChanges,
        message: `Unequipped ${currentItem.name}`,
        errors: []
      };

    } catch (error) {
      return {
        success: false,
        equipped: null,
        unequipped: null,
        statChanges: {},
        message: 'Failed to unequip item',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }, [equipmentState.equipped, addItem]);

  // Get available equipment for a slot
  const getAvailableEquipment = useCallback((slot: EquipmentSlot): EnhancedItem[] => {
    const mainInventory = inventoryState.containers.main;
    if (!mainInventory) return [];

    return mainInventory.items
      .filter(invSlot =>
        invSlot.item?.equipmentSlot === slot &&
        checkCompatibility(invSlot.item, slot).canEquip
      )
      .map(invSlot => invSlot.item!)
      .sort((a, b) => {
        // Sort by overall stat improvement potential
        const compA = compareEquipment(equipmentState.equipped[slot], a);
        const compB = compareEquipment(equipmentState.equipped[slot], b);
        return compB.netScore - compA.netScore;
      });
  }, [inventoryState, equipmentState.equipped, checkCompatibility, compareEquipment]);

  // Get equipment recommendations
  const getRecommendations = useCallback((): Array<{
    slot: EquipmentSlot;
    currentItem: EnhancedItem | null;
    recommendedItem: EnhancedItem;
    improvement: number;
    reasons: string[];
  }> => {
    const recommendations: any[] = [];

    Object.entries(EXTENDED_EQUIPMENT_SLOTS).forEach(([slotName, slotInfo]) => {
      const slot = slotName as EquipmentSlot;
      const availableItems = getAvailableEquipment(slot);

      if (availableItems.length > 0) {
        const currentItem = equipmentState.equipped[slot];
        const bestItem = availableItems[0]; // Already sorted by improvement
        const comparison = compareEquipment(currentItem, bestItem);

        if (comparison.netScore > 0) {
          recommendations.push({
            slot,
            currentItem,
            recommendedItem: bestItem,
            improvement: comparison.netScore,
            reasons: comparison.improvements
          });
        }
      }
    });

    return recommendations.sort((a, b) => b.improvement - a.improvement);
  }, [equipmentState.equipped, getAvailableEquipment, compareEquipment]);

  // Update calculated stats whenever equipment changes
  useEffect(() => {
    const newStats = calculateFinalStats();
    setEquipmentState(prev => ({
      ...prev,
      statCalculations: newStats
    }));
  }, [equipmentState.equipped, calculateFinalStats]);

  // Auto-update player stats in game state
  useEffect(() => {
    if (gameState.state.player) {
      const finalStats = {
        attack: equipmentState.statCalculations.attack?.finalValue || 0,
        defense: equipmentState.statCalculations.defense?.finalValue || 0,
        magicAttack: equipmentState.statCalculations.magicAttack?.finalValue || 0,
        magicDefense: equipmentState.statCalculations.magicDefense?.finalValue || 0,
        speed: equipmentState.statCalculations.speed?.finalValue || 0,
        accuracy: equipmentState.statCalculations.accuracy?.finalValue || 0
      };

      gameState.dispatch({
        type: 'UPDATE_PLAYER_STATS',
        payload: { playerId: gameState.state.player.id, stats: finalStats }
      });
    }
  }, [equipmentState.statCalculations, gameState]);

  // Equipment summary for display
  const equipmentSummary = useMemo(() => {
    const equipped = Object.values(equipmentState.equipped).filter(Boolean);
    const totalValue = equipped.reduce((sum, item) => sum + (item?.value || 0), 0);
    const totalWeight = equipped.reduce((sum, item) => sum + (item?.weight || 0), 0);

    return {
      equippedCount: equipped.length,
      totalSlots: Object.keys(EXTENDED_EQUIPMENT_SLOTS).length,
      totalValue,
      totalWeight,
      averageRarity: equipped.length > 0 ?
        equipped.reduce((sum, item) => {
          const rarityValues = { common: 1, rare: 2, epic: 3, legendary: 4 };
          return sum + (rarityValues[item?.rarity as keyof typeof rarityValues] || 1);
        }, 0) / equipped.length : 0
    };
  }, [equipmentState.equipped]);

  return {
    // State
    equipped: equipmentState.equipped,
    statCalculations: equipmentState.statCalculations,
    equipmentSummary,

    // Core operations
    equipItem,
    unequipItem,

    // Analysis and comparison
    compareEquipment,
    checkCompatibility,
    getAvailableEquipment,
    getRecommendations,

    // Calculated stats
    baseStats: getBaseStats(),
    equipmentStats: calculateEquipmentStats(),
    finalStats: calculateFinalStats(),

    // Utility
    equipmentSlots: EXTENDED_EQUIPMENT_SLOTS,
    compatibilityRules: EQUIPMENT_COMPATIBILITY_RULES,

    // Quick access
    isSlotEquipped: (slot: EquipmentSlot) => equipmentState.equipped[slot] !== null,
    getEquippedItem: (slot: EquipmentSlot) => equipmentState.equipped[slot],

    // Equipment validation
    canEquip: (item: EnhancedItem, slot?: EquipmentSlot) => {
      const targetSlot = slot || item.equipmentSlot;
      return targetSlot ? checkCompatibility(item, targetSlot).canEquip : false;
    }
  };
};

export default useEquipment;