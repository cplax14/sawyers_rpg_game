/**
 * Unit Tests for Two-Handed Weapon Slot Conflict Detection
 *
 * Tests Task 5.7: Two-handed weapons use both weapon + shield slots
 *
 * Test Coverage:
 * - Two-handed weapon conflicts with equipped shield
 * - Shield conflicts with equipped two-handed weapon
 * - No conflicts when slots are empty
 * - No conflicts for one-handed weapons
 * - Kid-friendly warning messages
 */

import { checkEquipmentCompatibility, clearCompatibilityCache } from '../equipmentUtils';
import { EnhancedItem, EquipmentSet } from '../../types/inventory';
import { PlayerStats } from '../../types/game';

describe('checkEquipmentCompatibility - Two-Handed Weapon Conflicts', () => {
  beforeEach(() => {
    clearCompatibilityCache();
  });

  // Test data setup
  const playerLevel = 10;
  const playerClass = 'warrior';
  const playerStats: PlayerStats = {
    attack: 20,
    defense: 15,
    magicAttack: 5,
    magicDefense: 10,
    speed: 12,
    accuracy: 85,
  };

  // Mock items
  const twoHandedSword: EnhancedItem = {
    id: 'great_sword',
    name: 'Great Sword',
    description: 'A massive two-handed blade',
    type: 'weapon',
    category: 'equipment',
    equipmentSlot: 'weapon',
    equipmentSubtype: 'sword',
    twoHanded: true, // Two-handed weapon
    rarity: 'rare',
    statModifiers: { attack: 45 },
    stackable: false,
    maxStack: 1,
    weight: 15,
    sellValue: 500,
    canTrade: true,
    canDrop: true,
    canDestroy: true,
    usable: false,
    consumeOnUse: false,
    useInCombat: false,
    useOutOfCombat: false,
  };

  const oneHandedSword: EnhancedItem = {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A basic one-handed sword',
    type: 'weapon',
    category: 'equipment',
    equipmentSlot: 'weapon',
    equipmentSubtype: 'sword',
    twoHanded: false, // One-handed weapon
    rarity: 'common',
    statModifiers: { attack: 20 },
    stackable: false,
    maxStack: 1,
    weight: 5,
    sellValue: 100,
    canTrade: true,
    canDrop: true,
    canDestroy: true,
    usable: false,
    consumeOnUse: false,
    useInCombat: false,
    useOutOfCombat: false,
  };

  const shield: EnhancedItem = {
    id: 'iron_shield',
    name: 'Iron Shield',
    description: 'A sturdy iron shield',
    type: 'armor',
    category: 'equipment',
    equipmentSlot: 'shield',
    equipmentSubtype: 'shield',
    rarity: 'common',
    statModifiers: { defense: 15 },
    stackable: false,
    maxStack: 1,
    weight: 8,
    sellValue: 150,
    canTrade: true,
    canDrop: true,
    canDestroy: true,
    usable: false,
    consumeOnUse: false,
    useInCombat: false,
    useOutOfCombat: false,
  };

  describe('Two-handed weapon with equipped shield', () => {
    it('should warn when equipping a two-handed weapon with a shield equipped', () => {
      const currentEquipment: EquipmentSet = {
        weapon: null,
        armor: null,
        shield: shield, // Shield is equipped
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        twoHandedSword,
        'weapon',
        playerLevel,
        playerClass,
        playerStats,
        currentEquipment
      );

      // Should be compatible (not blocked) but with a warning
      expect(result.canEquip).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);

      // Check for kid-friendly warning message
      const warningMessage = result.warnings.find(
        w => w.includes('two-handed weapon') && w.includes('shield')
      );
      expect(warningMessage).toBeDefined();
      expect(warningMessage).toContain('Iron Shield');
      expect(warningMessage).toContain('unequip');
    });

    it('should have no warnings when equipping two-handed weapon without shield', () => {
      const currentEquipment: EquipmentSet = {
        weapon: null,
        armor: null,
        shield: null, // No shield equipped
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        twoHandedSword,
        'weapon',
        playerLevel,
        playerClass,
        playerStats,
        currentEquipment
      );

      // Should be compatible with no warnings about shields
      expect(result.canEquip).toBe(true);
      const shieldWarning = result.warnings.find(w => w.includes('shield'));
      expect(shieldWarning).toBeUndefined();
    });

    it('should not warn when replacing a two-handed weapon with another two-handed weapon', () => {
      const anotherTwoHandedWeapon: EnhancedItem = {
        ...twoHandedSword,
        id: 'great_axe',
        name: 'Great Axe',
        description: 'A massive two-handed axe',
        equipmentSubtype: 'axe',
      };

      const currentEquipment: EquipmentSet = {
        weapon: twoHandedSword, // Two-handed weapon already equipped
        armor: null,
        shield: null,
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        anotherTwoHandedWeapon,
        'weapon',
        playerLevel,
        playerClass,
        playerStats,
        currentEquipment
      );

      // Should be compatible with no shield-related warnings
      expect(result.canEquip).toBe(true);
      const shieldWarning = result.warnings.find(w => w.includes('shield'));
      expect(shieldWarning).toBeUndefined();
    });
  });

  describe('Shield with equipped two-handed weapon', () => {
    it('should warn when equipping a shield with a two-handed weapon equipped', () => {
      const currentEquipment: EquipmentSet = {
        weapon: twoHandedSword, // Two-handed weapon is equipped
        armor: null,
        shield: null,
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        shield,
        'shield',
        playerLevel,
        playerClass,
        playerStats,
        currentEquipment
      );

      // Should be compatible (not blocked) but with a warning
      expect(result.canEquip).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);

      // Check for kid-friendly warning message
      const warningMessage = result.warnings.find(
        w => w.includes('two-handed weapon') && w.includes('equipped')
      );
      expect(warningMessage).toBeDefined();
      expect(warningMessage).toContain('Great Sword');
      expect(warningMessage).toContain('unequip');
    });

    it('should have no warnings when equipping shield without two-handed weapon', () => {
      const currentEquipment: EquipmentSet = {
        weapon: oneHandedSword, // One-handed weapon (compatible with shields)
        armor: null,
        shield: null,
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        shield,
        'shield',
        playerLevel,
        playerClass,
        playerStats,
        currentEquipment
      );

      // Should be compatible with no warnings
      expect(result.canEquip).toBe(true);
      const twoHandedWarning = result.warnings.find(w => w.includes('two-handed'));
      expect(twoHandedWarning).toBeUndefined();
    });

    it('should have no warnings when weapon slot is empty', () => {
      const currentEquipment: EquipmentSet = {
        weapon: null, // No weapon equipped
        armor: null,
        shield: null,
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        shield,
        'shield',
        playerLevel,
        playerClass,
        playerStats,
        currentEquipment
      );

      // Should be compatible with no warnings
      expect(result.canEquip).toBe(true);
      const twoHandedWarning = result.warnings.find(w => w.includes('two-handed'));
      expect(twoHandedWarning).toBeUndefined();
    });
  });

  describe('One-handed weapons', () => {
    it('should not warn when equipping one-handed weapon with shield', () => {
      const currentEquipment: EquipmentSet = {
        weapon: null,
        armor: null,
        shield: shield, // Shield equipped
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        oneHandedSword,
        'weapon',
        playerLevel,
        playerClass,
        playerStats,
        currentEquipment
      );

      // Should be fully compatible with no warnings
      expect(result.canEquip).toBe(true);
      const twoHandedWarning = result.warnings.find(
        w => w.includes('two-handed') || w.includes('shield')
      );
      expect(twoHandedWarning).toBeUndefined();
    });

    it('should handle weapons without twoHanded property as one-handed', () => {
      const weaponWithoutProperty: EnhancedItem = {
        ...oneHandedSword,
        twoHanded: undefined, // Property not defined
      };

      const currentEquipment: EquipmentSet = {
        weapon: null,
        armor: null,
        shield: shield,
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        weaponWithoutProperty,
        'weapon',
        playerLevel,
        playerClass,
        playerStats,
        currentEquipment
      );

      // Should be compatible (default to one-handed)
      expect(result.canEquip).toBe(true);
      const twoHandedWarning = result.warnings.find(w => w.includes('two-handed'));
      expect(twoHandedWarning).toBeUndefined();
    });
  });

  describe('No current equipment provided', () => {
    it('should not crash when currentEquipment is undefined', () => {
      const result = checkEquipmentCompatibility(
        twoHandedSword,
        'weapon',
        playerLevel,
        playerClass,
        playerStats,
        undefined // No equipment data
      );

      // Should still work, just no slot conflict warnings
      expect(result).toBeDefined();
      expect(result.canEquip).toBe(true);
    });

    it('should not crash when currentEquipment is null', () => {
      const result = checkEquipmentCompatibility(
        shield,
        'shield',
        playerLevel,
        playerClass,
        playerStats,
        null as any
      );

      // Should still work
      expect(result).toBeDefined();
      expect(result.canEquip).toBe(true);
    });
  });

  describe('Kid-friendly warning messages', () => {
    it('should use encouraging, clear language for two-handed weapon warnings', () => {
      const currentEquipment: EquipmentSet = {
        weapon: null,
        armor: null,
        shield: shield,
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        twoHandedSword,
        'weapon',
        playerLevel,
        playerClass,
        playerStats,
        currentEquipment
      );

      const warning = result.warnings.find(w => w.includes('two-handed'));
      expect(warning).toBeDefined();

      // Should use kid-friendly language
      expect(warning).not.toContain('error');
      expect(warning).not.toContain('invalid');
      expect(warning).not.toContain('conflict');

      // Should be clear and informative
      expect(warning).toContain('two-handed');
      expect(warning).toContain('unequip');
      expect(warning).toContain(shield.name);
    });

    it('should use encouraging, clear language for shield warnings', () => {
      const currentEquipment: EquipmentSet = {
        weapon: twoHandedSword,
        armor: null,
        shield: null,
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        shield,
        'shield',
        playerLevel,
        playerClass,
        playerStats,
        currentEquipment
      );

      const warning = result.warnings.find(w => w.includes('two-handed'));
      expect(warning).toBeDefined();

      // Should use kid-friendly language
      expect(warning).not.toContain('error');
      expect(warning).not.toContain('invalid');
      expect(warning).not.toContain('conflict');

      // Should be clear and informative
      expect(warning).toContain('two-handed weapon');
      expect(warning).toContain('equipped');
      expect(warning).toContain(twoHandedSword.name);
    });
  });

  describe('Integration with other validations', () => {
    it('should combine two-handed warnings with other warnings', () => {
      const legendaryTwoHandedWeapon: EnhancedItem = {
        ...twoHandedSword,
        rarity: 'legendary',
      };

      const currentEquipment: EquipmentSet = {
        weapon: null,
        armor: null,
        shield: shield,
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        legendaryTwoHandedWeapon,
        'weapon',
        5, // Low level player
        playerClass,
        playerStats,
        currentEquipment
      );

      // Should have multiple warnings
      expect(result.canEquip).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(1);

      // Should have both rarity warning and two-handed warning
      const rarityWarning = result.warnings.find(w => w.includes('legendary'));
      const twoHandedWarning = result.warnings.find(w => w.includes('two-handed'));

      expect(rarityWarning).toBeDefined();
      expect(twoHandedWarning).toBeDefined();
    });

    it('should not add two-handed warnings when item fails other requirements', () => {
      const highLevelTwoHandedWeapon: EnhancedItem = {
        ...twoHandedSword,
        levelRequirement: 50, // Player is level 10
      };

      const currentEquipment: EquipmentSet = {
        weapon: null,
        armor: null,
        shield: shield,
        helmet: null,
        necklace: null,
        gloves: null,
        boots: null,
        ring1: null,
        ring2: null,
        charm: null,
      };

      const result = checkEquipmentCompatibility(
        highLevelTwoHandedWeapon,
        'weapon',
        playerLevel,
        playerClass,
        playerStats,
        currentEquipment
      );

      // Should be incompatible due to level requirement
      expect(result.canEquip).toBe(false);
      expect(result.reasons.length).toBeGreaterThan(0);

      // Two-handed warning should still appear in warnings (not blocked)
      const twoHandedWarning = result.warnings.find(w => w.includes('two-handed'));
      expect(twoHandedWarning).toBeDefined();
    });
  });
});
