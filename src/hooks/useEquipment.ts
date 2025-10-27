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

  // Equipment cache key for localStorage persistence
  const EQUIPMENT_CACHE_KEY = `equipment_cache_${gameState.state.player?.id || 'temp'}`;

  // Load equipped items from cache
  const loadEquippedItemsFromCache = useCallback((): EquipmentSet => {
    try {
      const cached = localStorage.getItem(EQUIPMENT_CACHE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        console.log('✅ [useEquipment] Loaded equipped items from cache:', parsedCache);
        return parsedCache;
      }
    } catch (error) {
      console.warn('⚠️ [useEquipment] Failed to load equipment cache:', error);
    }

    return {
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
  }, [EQUIPMENT_CACHE_KEY]);

  // Save equipped items to cache
  const saveEquippedItemsToCache = useCallback((equipped: EquipmentSet) => {
    try {
      localStorage.setItem(EQUIPMENT_CACHE_KEY, JSON.stringify(equipped));
      console.log('💾 [useEquipment] Saved equipped items to cache');
    } catch (error) {
      console.error('❌ [useEquipment] Failed to save equipment cache:', error);
    }
  }, [EQUIPMENT_CACHE_KEY]);

  // Equipment state
  const [equipmentState, setEquipmentState] = useState<EquipmentState>(() => {
    const player = gameState.state.player;
    const mainInventory = inventoryState.containers.main;

    // Start with cached equipment items
    const initialEquipped = loadEquippedItemsFromCache();

    // Sync with player equipment IDs from game state
    // This handles cases where equipment was changed outside this hook
    if (player && player.equipment) {
      Object.keys(initialEquipped).forEach((slotKey) => {
        const slot = slotKey as EquipmentSlot;
        const itemIdFromState = player.equipment[slot];

        // If game state has no item ID for this slot, clear it
        if (!itemIdFromState) {
          initialEquipped[slot] = null;
        }
        // If cached item doesn't match game state ID, try to find correct item
        else if (!initialEquipped[slot] || initialEquipped[slot]?.id !== itemIdFromState) {
          // Try to find item in inventory first
          const inventorySlot = mainInventory?.items.find(
            invSlot => invSlot.item?.id === itemIdFromState
          );

          if (inventorySlot?.item) {
            initialEquipped[slot] = inventorySlot.item;
          }
          // If not in inventory but we have it in cache, keep cached version
          // (this is the normal case for equipped items)
        }
      });
    }

    console.log('🎮 [useEquipment] Initialized equipment state:', initialEquipped);

    return {
      equipped: initialEquipped,
      statCalculations: {} as CalculatedStats,
      activeModifiers: [],
      equipmentSets: {},
      lastEquipTime: new Date()
    };
  });

  // Sync equipment state from game context when player changes or component mounts
  useEffect(() => {
    const player = gameState.state.player;
    if (!player || !player.equipment) return;

    const mainInventory = inventoryState.containers.main;
    if (!mainInventory) return;

    // Load from cache as base
    const syncedEquipment = loadEquippedItemsFromCache();

    // Sync with player equipment IDs
    Object.keys(syncedEquipment).forEach((slotKey) => {
      const slot = slotKey as EquipmentSlot;
      const itemId = player.equipment[slot];

      if (!itemId) {
        // Game state says slot is empty
        syncedEquipment[slot] = null;
      } else {
        // Game state has an item ID
        const currentlyEquipped = equipmentState.equipped[slot];

        // If we already have the correct item locally, keep it
        if (currentlyEquipped?.id === itemId) {
          syncedEquipment[slot] = currentlyEquipped;
        }
        // Otherwise try to find in cache (loaded above)
        else if (syncedEquipment[slot]?.id === itemId) {
          // Cache has the correct item, use it
        }
        // Last resort: look in inventory (for items being equipped from outside this hook)
        else {
          const inventorySlot = mainInventory.items.find(
            invSlot => invSlot.item?.id === itemId
          );
          if (inventorySlot?.item) {
            syncedEquipment[slot] = inventorySlot.item;
          }
        }
      }
    });

    // Only update if equipment actually changed to prevent infinite loops
    const hasChanges = Object.keys(syncedEquipment).some((slotKey) => {
      const slot = slotKey as EquipmentSlot;
      return syncedEquipment[slot]?.id !== equipmentState.equipped[slot]?.id;
    });

    if (hasChanges) {
      console.log('🔄 [useEquipment] Syncing equipment state with game state');
      setEquipmentState(prev => ({
        ...prev,
        equipped: syncedEquipment
      }));
      // Save to cache after sync
      saveEquippedItemsToCache(syncedEquipment);
    }
  }, [gameState.state.player?.id, gameState.state.player?.equipment, inventoryState.containers.main, equipmentState.equipped, loadEquippedItemsFromCache, saveEquippedItemsToCache]);

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
  }, [gameState.state.player?.id, gameState.state.player?.level, gameState.state.player?.class]);

  // Calculate equipment stat bonuses for all stats including extended stats
  const calculateEquipmentStats = useCallback((): Record<string, number> => {
    const stats: Record<string, number> = {
      attack: 0,
      defense: 0,
      magicAttack: 0,
      magicDefense: 0,
      speed: 0,
      accuracy: 0,
      hp: 0,
      mp: 0,
      critical: 0,
      criticalDamage: 0,
      evasion: 0,
      resistance: 0
    };

    Object.values(equipmentState.equipped).forEach(item => {
      if (item?.statModifiers) {
        Object.entries(item.statModifiers).forEach(([stat, value]) => {
          if (value !== undefined) {
            // Map stat names to handle both PlayerStats and extended stats
            const statKey = stat;
            if (stats[statKey] !== undefined) {
              stats[statKey] += value;
            }
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
    const playerLevel = gameState.state.player?.level || 1;

    /**
     * Creates a stat calculation following the PRD formula:
     * finalStat = baseStat + equipmentBonus + levelBonus + temporaryBuffs
     *
     * Note: levelBonus is NOT added on top of baseStat since baseStat already
     * includes level scaling from getBaseStats(). This levelBonus represents
     * additional percentage-based bonuses from progression.
     */
    const createStatCalculation = (
      baseStat: number,
      equipmentBonus: number,
      includePercentageBonus: boolean = false
    ): StatCalculation => {
      // Additional percentage-based level bonus (optional, currently 0)
      const levelBonus = includePercentageBonus ? Math.floor(baseStat * 0.05) : 0;
      const temporaryBonus = 0; // From buffs/debuffs (to be implemented)
      const percentage = 100; // Percentage modifiers (to be implemented)

      // Final calculation: base + equipment + level bonus + temporary buffs
      const finalValue = Math.floor((baseStat + equipmentBonus + levelBonus + temporaryBonus) * (percentage / 100));

      const breakdown: any[] = [
        {
          source: 'Base',
          type: 'base' as const,
          value: baseStat,
          description: 'Base character stats from level and class'
        },
        {
          source: 'Equipment',
          type: 'equipment' as const,
          value: equipmentBonus,
          description: 'Bonuses from equipped items'
        }
      ];

      if (levelBonus > 0) {
        breakdown.push({
          source: 'Level Bonus',
          type: 'level' as const,
          value: levelBonus,
          description: 'Additional percentage bonus from level'
        });
      }

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

    // Core combat stats (from PlayerStats)
    return {
      attack: createStatCalculation(baseStats.attack, equipmentStats.attack || 0),
      defense: createStatCalculation(baseStats.defense, equipmentStats.defense || 0),
      magicAttack: createStatCalculation(baseStats.magicAttack, equipmentStats.magicAttack || 0),
      magicDefense: createStatCalculation(baseStats.magicDefense, equipmentStats.magicDefense || 0),
      speed: createStatCalculation(baseStats.speed, equipmentStats.speed || 0),
      accuracy: createStatCalculation(baseStats.accuracy, equipmentStats.accuracy || 0),

      // Resource stats (health and mana)
      health: createStatCalculation(
        100 + playerLevel * 10, // Base: 100 + 10 per level
        equipmentStats.hp || 0  // Equipment can provide HP bonuses
      ),
      mana: createStatCalculation(
        50 + playerLevel * 5,   // Base: 50 + 5 per level
        equipmentStats.mp || 0  // Equipment can provide MP bonuses
      ),

      // Derived combat stats
      criticalChance: createStatCalculation(
        5,  // Base 5% critical chance
        equipmentStats.critical || 0  // Equipment can provide critical chance
      ),
      criticalDamage: createStatCalculation(
        150,  // Base 150% critical damage multiplier
        equipmentStats.criticalDamage || 0
      ),
      evasion: createStatCalculation(
        Math.floor(baseStats.speed / 2),  // Evasion derived from speed
        equipmentStats.evasion || 0
      ),
      resistance: createStatCalculation(
        Math.floor(baseStats.magicDefense / 2),  // Resistance derived from magic defense
        equipmentStats.resistance || 0
      )
    };
  }, [getBaseStats, calculateEquipmentStats, gameState.state.player?.level]);

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
  }, [gameState.state.player?.id, gameState.state.player?.level, gameState.state.player?.class, equipmentState.equipped, calculateFinalStats]);

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
    itemId: string,
    slot: EquipmentSlot
  ): Promise<EquipItemResult> => {
    try {
      // Look up the item by ID from inventory
      const mainInventory = inventoryState.containers.main;
      if (!mainInventory) {
        return {
          success: false,
          equipped: null,
          unequipped: null,
          statChanges: {},
          message: 'Inventory not available',
          errors: ['Cannot access inventory']
        };
      }

      const inventorySlot = mainInventory.items.find(invSlot => invSlot.item?.id === itemId);
      const item = inventorySlot?.item;

      if (!item) {
        return {
          success: false,
          equipped: null,
          unequipped: null,
          statChanges: {},
          message: 'Item not found',
          errors: ['Item not found in inventory']
        };
      }

      // Determine target slot
      const targetSlot = slot;
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

      // Get currently equipped item in the target slot
      const currentItem = equipmentState.equipped[targetSlot];

      // Calculate stat changes from the equipment swap
      const comparison = compareEquipment(currentItem, item);

      /**
       * AUTOMATIC SLOT MANAGEMENT (US-5)
       * When equipping a new item to a slot that already has an item:
       * 1. Validate inventory space for the swap (if replacing)
       * 2. Remove the new item from inventory
       * 3. Update equipment state (automatically replacing old item)
       * 4. Add the old item back to inventory
       *
       * This order prevents issues if the new item and old item are the same,
       * and ensures the swap is atomic from the player's perspective.
       */

      // Step 1: Validate inventory space if we're replacing an item
      // TASK 4.6: Only count BAG items (non-equipped) toward capacity
      // When replacing, we remove 1 item and add 1 item back, so net change is 0
      // However, if inventory is at max capacity, we still need to ensure the swap can complete
      if (currentItem) {
        // Count only items in the bag (exclude equipped items)
        const currentBagItemCount = mainInventory.items.reduce((total, slot) => {
          if (!slot.item) return total;

          // Check if this item is currently equipped
          const equipment = gameState.state.player?.equipment;
          const isEquipped = equipment && [
            equipment.weapon,
            equipment.armor,
            equipment.accessory,
            equipment.helmet,
            equipment.necklace,
            equipment.shield,
            equipment.gloves,
            equipment.boots,
            equipment.ring1,
            equipment.ring2,
            equipment.charm
          ].includes(slot.item.id);

          // Skip equipped items when counting bag capacity
          if (isEquipped) return total;

          return total + slot.quantity;
        }, 0);

        const MAX_INVENTORY_CAPACITY = 10000;

        // After removing the new item, we'll have currentBagItemCount - 1
        // We need to be able to add the old item back, so check if we'd exceed capacity
        // Since we're doing a swap (remove 1, add 1), this should always work
        // But we check as a safety measure for edge cases
        if (currentBagItemCount - 1 + 1 > MAX_INVENTORY_CAPACITY) {
          return {
            success: false,
            equipped: null,
            unequipped: null,
            statChanges: {},
            message: `Inventory is full (${MAX_INVENTORY_CAPACITY}/${MAX_INVENTORY_CAPACITY}). Cannot swap equipment.`,
            errors: [`Inventory capacity reached. Free up space before swapping equipment.`]
          };
        }
      }

      // Step 2: Remove new item from inventory
      const removeResult = await removeItem(item.id, 1);
      if (!removeResult) {
        return {
          success: false,
          equipped: null,
          unequipped: null,
          statChanges: {},
          message: 'Failed to remove item from inventory',
          errors: ['Could not remove item from inventory']
        };
      }

      // Step 2: Update equipment state (atomic swap)
      const newEquipped = {
        ...equipmentState.equipped,
        [targetSlot]: item
      };

      setEquipmentState(prev => ({
        ...prev,
        equipped: newEquipped,
        lastEquipTime: new Date()
      }));

      // Save to cache for persistence across remounts
      saveEquippedItemsToCache(newEquipped);

      // Step 3: If there was an old item, add it back to inventory
      if (currentItem) {
        const addResult = await addItem(currentItem, 1);
        if (!addResult) {
          // If we fail to add the old item back to inventory, we have a problem
          // The equipment swap already happened, so we need to log this as an error
          // but still report success for the equip operation
          console.error('Failed to add unequipped item to inventory:', currentItem.name);
          return {
            success: true,
            equipped: item,
            unequipped: currentItem,
            statChanges: comparison.statChanges,
            message: `Equipped ${item.name}`,
            errors: [`Warning: Could not return ${currentItem.name} to inventory. Contact support if item is missing.`]
          };
        }
      }

      // Update game state for backward compatibility
      if (gameState.state.player) {
        gameState.dispatch({
          type: 'EQUIP_ITEM',
          payload: { slot: targetSlot, itemId: item.id }
        });
      }

      // Success with appropriate message
      const message = currentItem
        ? `Equipped ${item.name} (replaced ${currentItem.name})`
        : `Equipped ${item.name}`;

      return {
        success: true,
        equipped: item,
        unequipped: currentItem,
        statChanges: comparison.statChanges,
        message,
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
  }, [equipmentState.equipped, checkCompatibility, compareEquipment, addItem, removeItem, gameState.dispatch, gameState.state.player?.id, inventoryState]);

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

      /**
       * INVENTORY SPACE VALIDATION (US-7)
       * Check if there is space in inventory before unequipping
       * Maximum inventory capacity: 10,000 items
       * With such a high limit, this is primarily a safety check
       */
      const mainInventory = inventoryState.containers.main;
      if (!mainInventory) {
        return {
          success: false,
          equipped: null,
          unequipped: null,
          statChanges: {},
          message: 'Inventory not available',
          errors: ['Cannot access inventory']
        };
      }

      // TASK 4.6: Calculate BAG size (exclude equipped items from capacity)
      // Only count items in the bag, not items currently equipped
      const currentBagItemCount = mainInventory.items.reduce((total, slot) => {
        if (!slot.item) return total;

        // Check if this item is currently equipped
        const equipment = gameState.state.player?.equipment;
        const isEquipped = equipment && [
          equipment.weapon,
          equipment.armor,
          equipment.accessory,
          equipment.helmet,
          equipment.necklace,
          equipment.shield,
          equipment.gloves,
          equipment.boots,
          equipment.ring1,
          equipment.ring2,
          equipment.charm
        ].includes(slot.item.id);

        // Skip equipped items when counting bag capacity
        if (isEquipped) return total;

        return total + slot.quantity;
      }, 0);

      // Maximum inventory capacity (very high to not restrict players)
      const MAX_INVENTORY_CAPACITY = 10000;

      // Check if adding the unequipped item would exceed bag capacity
      if (currentBagItemCount >= MAX_INVENTORY_CAPACITY) {
        return {
          success: false,
          equipped: null,
          unequipped: null,
          statChanges: {},
          message: `Inventory is full (${MAX_INVENTORY_CAPACITY}/${MAX_INVENTORY_CAPACITY}). Cannot unequip item.`,
          errors: [`Inventory capacity reached. Free up space before unequipping items.`]
        };
      }

      // Add item back to inventory
      const addResult = await addItem(currentItem, 1);
      if (!addResult) {
        return {
          success: false,
          equipped: null,
          unequipped: null,
          statChanges: {},
          message: 'Failed to add item to inventory',
          errors: ['Could not add item to inventory']
        };
      }

      // Update equipment state
      const newEquipped = {
        ...equipmentState.equipped,
        [slot]: null
      };

      setEquipmentState(prev => ({
        ...prev,
        equipped: newEquipped,
        lastEquipTime: new Date()
      }));

      // Save to cache for persistence across remounts
      saveEquippedItemsToCache(newEquipped);

      // Update game state for backward compatibility
      if (gameState.state.player) {
        gameState.dispatch({
          type: 'UNEQUIP_ITEM',
          payload: { slot }
        });
      }

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
  }, [equipmentState.equipped, addItem, inventoryState]);

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

  // Memoize equipped items to prevent infinite loops
  const equippedItems = useMemo(() => equipmentState.equipped, [
    equipmentState.equipped.weapon?.id,
    equipmentState.equipped.armor?.id,
    equipmentState.equipped.accessory?.id,
    equipmentState.equipped.helmet?.id,
    equipmentState.equipped.chestplate?.id,
    equipmentState.equipped.boots?.id,
    equipmentState.equipped.gloves?.id,
    equipmentState.equipped.ring1?.id,
    equipmentState.equipped.ring2?.id,
    equipmentState.equipped.necklace?.id,
    equipmentState.equipped.charm?.id
  ]);

  // Update calculated stats whenever equipment changes
  useEffect(() => {
    const newStats = calculateFinalStats();
    setEquipmentState(prev => ({
      ...prev,
      statCalculations: newStats
    }));
  }, [equippedItems, calculateFinalStats]);

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
  }, [equipmentState.statCalculations, gameState.dispatch, gameState.state.player?.id]);

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

  // Memoize base stats calculation to prevent recreation on every render
  const baseStats = useMemo(() => {
    return getBaseStats();
  }, [getBaseStats]);

  // Memoize equipment stats calculation to prevent recreation on every render
  const equipmentStats = useMemo(() => {
    return calculateEquipmentStats();
  }, [calculateEquipmentStats]);

  // Memoize final stats calculation to prevent recreation on every render
  const finalStats = useMemo(() => {
    return calculateFinalStats();
  }, [calculateFinalStats]);

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
    baseStats,
    equipmentStats,
    finalStats,

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