/**
 * Unit Tests for Material Icon System
 * Tests the material icon mapping functionality in InventoryUI
 */

describe('Material Icon System Tests', () => {
    beforeAll(() => {
        // Ensure InventoryUI is loaded
        if (typeof InventoryUI === 'undefined') {
            console.warn('InventoryUI not loaded - skipping tests');
        }
    });

    describe('Category Icon Mapping', () => {
        it('should return correct icons for known categories', () => {
            if (typeof InventoryUI === 'undefined') return;

            // Call method directly on prototype to avoid instantiation issues
            const getCategoryIcon = InventoryUI.prototype.getCategoryIcon;

            assertEqual(getCategoryIcon.call(null, 'monster_part'), '🦴', 'Monster parts should use bone icon');
            assertEqual(getCategoryIcon.call(null, 'natural'), '🌿', 'Natural materials should use herb icon');
            assertEqual(getCategoryIcon.call(null, 'mineral'), '💎', 'Minerals should use gem icon');
            assertEqual(getCategoryIcon.call(null, 'magical'), '✨', 'Magical materials should use sparkles icon');
            assertEqual(getCategoryIcon.call(null, 'crafting'), '🔨', 'Crafting materials should use hammer icon');
            assertEqual(getCategoryIcon.call(null, 'maintenance'), '🔧', 'Maintenance items should use wrench icon');
            assertEqual(getCategoryIcon.call(null, 'utility'), '📦', 'Utility items should use package icon');
            assertEqual(getCategoryIcon.call(null, 'evolution'), '💫', 'Evolution items should use star icon');
        });

        it('should return default icon for unknown categories', () => {
            if (typeof InventoryUI === 'undefined') return;

            const getCategoryIcon = InventoryUI.prototype.getCategoryIcon;

            assertEqual(getCategoryIcon.call(null, 'unknown_category'), '📦', 'Unknown categories should use default package icon');
            assertEqual(getCategoryIcon.call(null, ''), '📦', 'Empty category should use default package icon');
            assertEqual(getCategoryIcon.call(null, null), '📦', 'Null category should use default package icon');
        });
    });

    describe('Name-Based Icon Mapping', () => {
        it('should return correct icons for herb materials', () => {
            if (typeof InventoryUI === 'undefined') return;

            const getIconFromName = InventoryUI.prototype.getIconFromName;

            assertEqual(getIconFromName.call(null, 'healing_herb'), '🌿', 'Healing herb should use herb icon');
            assertEqual(getIconFromName.call(null, 'mana_flower'), '🌸', 'Mana flower should use flower icon');
            assertEqual(getIconFromName.call(null, 'ancient_root'), '🌱', 'Root materials should use sprout icon');
        });

        it('should return correct icons for wood materials', () => {
            if (typeof InventoryUI === 'undefined') return;

            const getIconFromName = InventoryUI.prototype.getIconFromName;

            assertEqual(getIconFromName.call(null, 'oak_branch'), '🌳', 'Oak materials should use tree icon');
            assertEqual(getIconFromName.call(null, 'pine_sap'), '🍯', 'Sap materials should use honey icon');
            assertEqual(getIconFromName.call(null, 'birch_wood'), '🌳', 'Wood materials should use tree icon');
        });

        it('should return correct icons for crystal materials', () => {
            if (typeof InventoryUI === 'undefined') return;

            const getIconFromName = InventoryUI.prototype.getIconFromName;

            assertEqual(getIconFromName.call(null, 'forest_crystal'), '💎', 'Crystal materials should use gem icon');
            assertEqual(getIconFromName.call(null, 'amethyst_shard'), '💜', 'Amethyst should use purple heart icon');
            assertEqual(getIconFromName.call(null, 'quartz_crystal'), '💎', 'Quartz should use gem icon');
        });

        it('should return correct icons for monster parts', () => {
            if (typeof InventoryUI === 'undefined') return;

            const getIconFromName = InventoryUI.prototype.getIconFromName;

            assertEqual(getIconFromName.call(null, 'wolf_fang'), '🔪', 'Fangs should use knife icon');
            assertEqual(getIconFromName.call(null, 'goblin_tooth'), '🦷', 'Teeth should use tooth icon');
            assertEqual(getIconFromName.call(null, 'dragon_scale'), '🐲', 'Scales should use dragon icon');
            assertEqual(getIconFromName.call(null, 'wolf_pelt'), '🧥', 'Pelts should use coat icon');
            assertEqual(getIconFromName.call(null, 'slime_gel'), '🫧', 'Slime should use bubble icon');
        });

        it('should return correct icons for metal materials', () => {
            if (typeof InventoryUI === 'undefined') return;

            const getIconFromName = InventoryUI.prototype.getIconFromName;

            assertEqual(getIconFromName.call(null, 'iron_ore'), '⛏️', 'Ore materials should use pickaxe icon');
            assertEqual(getIconFromName.call(null, 'mithril_ingot'), '✨', 'Mithril should use sparkles icon');
            assertEqual(getIconFromName.call(null, 'adamantine_crystal'), '💠', 'Adamantine should use diamond shape icon');
        });

        it('should return default icon for unrecognized names', () => {
            if (typeof InventoryUI === 'undefined') return;

            const getIconFromName = InventoryUI.prototype.getIconFromName;

            assertEqual(getIconFromName.call(null, 'completely_unknown_item'), '📦', 'Unknown items should use package icon');
            assertEqual(getIconFromName.call(null, ''), '📦', 'Empty name should use package icon');
        });
    });

    describe('Basic Integration Tests', () => {
        it('should handle complex item names correctly', () => {
            if (typeof InventoryUI === 'undefined') return;

            const getIconFromName = InventoryUI.prototype.getIconFromName;

            assertEqual(getIconFromName.call(null, 'ancient_dragon_heart_essence'), '❤️', 'Should match heart keyword');
            assertEqual(getIconFromName.call(null, 'crystallized_mana_flower_extract'), '🌸', 'Should match flower keyword');
            assertEqual(getIconFromName.call(null, 'refined_iron_ore_chunks'), '⛏️', 'Should match ore keyword');
        });

        it('should handle null and undefined item IDs gracefully', () => {
            if (typeof InventoryUI === 'undefined') return;

            const getIconFromName = InventoryUI.prototype.getIconFromName;

            assertEqual(getIconFromName.call(null, null), '📦', 'Null ID should return default icon');
            assertEqual(getIconFromName.call(null, undefined), '📦', 'Undefined ID should return default icon');
            assertEqual(getIconFromName.call(null, ''), '📦', 'Empty ID should return default icon');
        });

        it('should format unknown item names to pretty display names', () => {
            if (typeof InventoryUI === 'undefined') return;

            const formatItemName = InventoryUI.prototype.formatItemName;

            assertEqual(formatItemName.call(null, 'unknown_mysterious_item'), 'Unknown Mysterious Item', 'Should convert underscores to spaces and title case');
            assertEqual(formatItemName.call(null, 'strange-artifact'), 'Strange Artifact', 'Should convert hyphens to spaces and title case');
            assertEqual(formatItemName.call(null, 'weird_stuff_123'), 'Weird Stuff 123', 'Should handle numbers properly');
            assertEqual(formatItemName.call(null, null), 'Unknown Item', 'Null ID should return fallback name');
            assertEqual(formatItemName.call(null, undefined), 'Unknown Item', 'Undefined ID should return fallback name');
            assertEqual(formatItemName.call(null, ''), 'Unknown Item', 'Empty ID should return fallback name');
        });

        it('should ensure all materials always get an icon', () => {
            if (typeof InventoryUI === 'undefined') return;

            // Create a mock context with the required methods
            const mockContext = {
                getCategoryIcon: InventoryUI.prototype.getCategoryIcon,
                getIconFromName: InventoryUI.prototype.getIconFromName
            };

            const getMaterialIcon = InventoryUI.prototype.getMaterialIcon;

            // Test that even completely unknown items get the fallback icon
            const unknownIcon = getMaterialIcon.call(mockContext, 'completely_unknown_item_xyz');
            assertEqual(unknownIcon, '📦', 'Unknown materials should get generic package icon');

            // Test that even null/undefined gets handled
            const nullIcon = getMaterialIcon.call(mockContext, null);
            assertEqual(nullIcon, '📦', 'Null material ID should get generic package icon');
        });
    });
});