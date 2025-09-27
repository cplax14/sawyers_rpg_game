import { useMemo } from 'react';
import { useCombat } from './useGameState';
import { InventoryTab } from '../contexts/InventoryNavigationContext';

export interface CombatRestrictions {
  isInCombat: boolean;
  allowedTabs: InventoryTab[];
  restrictedTabs: InventoryTab[];
  restrictedMessage: string;
  allowedItemTypes: string[];
  restrictedActions: string[];
}

export interface CombatInventoryOptions {
  allowEquipmentView?: boolean;
  allowStatsView?: boolean;
  allowCreatureView?: boolean;
  allowedConsumableTypes?: string[];
  enableEmergencyHealing?: boolean;
}

export const useCombatInventoryRestrictions = (
  options: CombatInventoryOptions = {}
): CombatRestrictions => {
  const { isInCombat, currentEncounter } = useCombat();

  const {
    allowEquipmentView = false,
    allowStatsView = true,
    allowCreatureView = false,
    allowedConsumableTypes = ['healing', 'mana', 'buff', 'debuff'],
    enableEmergencyHealing = true
  } = options;

  const restrictions = useMemo((): CombatRestrictions => {
    if (!isInCombat) {
      // No restrictions when not in combat
      return {
        isInCombat: false,
        allowedTabs: ['equipment', 'items', 'creatures', 'stats'],
        restrictedTabs: [],
        restrictedMessage: '',
        allowedItemTypes: [],
        restrictedActions: []
      };
    }

    // Determine allowed tabs during combat
    const allowedTabs: InventoryTab[] = ['items']; // Always allow items for consumables
    const restrictedTabs: InventoryTab[] = [];

    if (allowStatsView) {
      allowedTabs.push('stats');
    } else {
      restrictedTabs.push('stats');
    }

    if (allowEquipmentView) {
      allowedTabs.push('equipment');
    } else {
      restrictedTabs.push('equipment');
    }

    if (allowCreatureView) {
      allowedTabs.push('creatures');
    } else {
      restrictedTabs.push('creatures');
    }

    // Determine restricted message
    const enemyName = currentEncounter?.species?.replace(/_/g, ' ') || 'enemy';
    let restrictedMessage = `⚔️ Combat Mode: You're fighting a ${enemyName}! `;

    if (restrictedTabs.length > 0) {
      restrictedMessage += `Access to ${restrictedTabs.join(', ')} is limited during combat. `;
    }

    restrictedMessage += 'You can only use consumable items to aid in battle.';

    // Determine allowed item types
    let allowedItemTypes = [...allowedConsumableTypes];

    if (enableEmergencyHealing && !allowedItemTypes.includes('healing')) {
      allowedItemTypes.push('healing');
    }

    // Determine restricted actions
    const restrictedActions = [
      'equip',
      'unequip',
      'drop',
      'sell',
      'trade',
      'release_creature',
      'breed_creature',
      'capture_creature',
      'auto_sort',
      'repair',
      'upgrade'
    ];

    // Add equipment restrictions if equipment tab is restricted
    if (!allowEquipmentView) {
      restrictedActions.push('view_equipment', 'compare_equipment', 'save_loadout');
    }

    // Add creature restrictions if creature tab is restricted
    if (!allowCreatureView) {
      restrictedActions.push('view_creatures', 'summon_creature', 'feed_creatures');
    }

    return {
      isInCombat: true,
      allowedTabs,
      restrictedTabs,
      restrictedMessage,
      allowedItemTypes,
      restrictedActions
    };
  }, [
    isInCombat,
    currentEncounter,
    allowEquipmentView,
    allowStatsView,
    allowCreatureView,
    allowedConsumableTypes,
    enableEmergencyHealing
  ]);

  return restrictions;
};

// Helper functions for checking restrictions
export const isTabAllowedInCombat = (
  tab: InventoryTab,
  restrictions: CombatRestrictions
): boolean => {
  return restrictions.allowedTabs.includes(tab);
};

export const isActionAllowedInCombat = (
  action: string,
  restrictions: CombatRestrictions
): boolean => {
  return !restrictions.restrictedActions.includes(action);
};

export const isItemTypeAllowedInCombat = (
  itemType: string,
  restrictions: CombatRestrictions
): boolean => {
  if (!restrictions.isInCombat) return true;
  return restrictions.allowedItemTypes.includes(itemType);
};

export const getRestrictedTabMessage = (
  tab: InventoryTab,
  restrictions: CombatRestrictions
): string => {
  if (!restrictions.isInCombat || isTabAllowedInCombat(tab, restrictions)) {
    return '';
  }

  const messages = {
    equipment: '⚔️ Equipment changes are not allowed during combat! Focus on using consumable items to survive the battle.',
    creatures: '🐉 Creature management is restricted during combat! You cannot summon, feed, or manage your creatures while fighting.',
    stats: '📊 Character statistics are read-only during combat. Focus on the battle at hand!',
    items: '🎒 Item usage is restricted during combat. Only healing and combat items are available.'
  };

  return messages[tab] || `${tab.charAt(0).toUpperCase() + tab.slice(1)} access is restricted during combat.`;
};

export const getCombatItemCategories = (restrictions: CombatRestrictions) => {
  if (!restrictions.isInCombat) {
    return ['all'];
  }

  const categories = [];

  if (restrictions.allowedItemTypes.includes('healing')) {
    categories.push('healing', 'health');
  }

  if (restrictions.allowedItemTypes.includes('mana')) {
    categories.push('mana', 'magic');
  }

  if (restrictions.allowedItemTypes.includes('buff')) {
    categories.push('buff', 'enhancement');
  }

  if (restrictions.allowedItemTypes.includes('debuff')) {
    categories.push('debuff', 'combat');
  }

  return categories.length > 0 ? categories : ['consumable'];
};

export default useCombatInventoryRestrictions;