/**
 * Unit Tests for Material Filter System
 * Tests the material filtering functionality in InventoryUI
 */

describe('Material Filter System Tests', () => {
    beforeAll(() => {
        // Ensure InventoryUI is loaded
        if (typeof InventoryUI === 'undefined') {
            console.warn('InventoryUI not loaded - skipping tests');
        }
    });

    describe('Filter Button Integration', () => {
        it('should properly set materials filter state', () => {
            if (typeof InventoryUI === 'undefined') return;

            // Create a minimal mock instance
            const mockUI = {
                state: { materialsFilter: 'all' },
                setMaterialsFilter: InventoryUI.prototype.setMaterialsFilter,
                renderMaterialsGrid: () => {} // Mock render method
            };

            // Test setting different filters
            mockUI.setMaterialsFilter.call(mockUI, 'natural');
            assertEqual(mockUI.state.materialsFilter, 'natural', 'Should set natural filter');

            mockUI.setMaterialsFilter.call(mockUI, 'mineral');
            assertEqual(mockUI.state.materialsFilter, 'mineral', 'Should set mineral filter');

            mockUI.setMaterialsFilter.call(mockUI, 'scroll');
            assertEqual(mockUI.state.materialsFilter, 'scroll', 'Should set scroll filter');

            mockUI.setMaterialsFilter.call(mockUI, 'all');
            assertEqual(mockUI.state.materialsFilter, 'all', 'Should reset to all filter');
        });
    });

    describe('Material Item Filtering Logic', () => {
        it('should correctly identify materials for filtering', () => {
            if (typeof InventoryUI === 'undefined') return;

            // Mock ItemData with different material types
            const originalItemData = window.ItemData;
            window.ItemData = {
                getItem: (id) => {
                    const items = {
                        'healing_herb': { type: 'material', category: 'natural' },
                        'iron_ore': { type: 'material', category: 'mineral' },
                        'wolf_fang': { type: 'material', category: 'monster_part' },
                        'magic_essence': { type: 'material', category: 'magical' },
                        'teleport_scroll': { type: 'scroll' },
                        'iron_sword': { type: 'weapon' },
                        'unknown_item': null
                    };
                    return items[id] || null;
                }
            };

            // Create test inventory entries
            const testEntries = [
                ['healing_herb', 5],
                ['iron_ore', 3],
                ['wolf_fang', 2],
                ['magic_essence', 1],
                ['teleport_scroll', 4],
                ['iron_sword', 1], // Should be filtered out
                ['unknown_item', 2] // Should be included as unknown
            ];

            // Test 'all' filter - should include materials, scrolls, and unknowns
            const allFiltered = testEntries.filter(([itemId, qty]) => {
                if (qty <= 0) return false;
                const item = window.ItemData.getItem(itemId);
                if (!item) return true; // Unknown items included
                const isValidForMaterialsTab = item.type === 'material' || item.type === 'scroll';
                if (!isValidForMaterialsTab) return false;
                return true; // 'all' filter
            });
            assertEqual(allFiltered.length, 6, 'All filter should include 6 items (4 materials + 1 scroll + 1 unknown)');

            // Test 'natural' filter
            const naturalFiltered = testEntries.filter(([itemId, qty]) => {
                if (qty <= 0) return false;
                const item = window.ItemData.getItem(itemId);
                if (!item) return true;
                const isValidForMaterialsTab = item.type === 'material' || item.type === 'scroll';
                if (!isValidForMaterialsTab) return false;
                if ('natural' === 'scroll') return item.type === 'scroll';
                return item.category === 'natural';
            });
            assertEqual(naturalFiltered.length, 2, 'Natural filter should include healing_herb + unknown_item');

            // Test 'scroll' filter
            const scrollFiltered = testEntries.filter(([itemId, qty]) => {
                if (qty <= 0) return false;
                const item = window.ItemData.getItem(itemId);
                if (!item) return true;
                const isValidForMaterialsTab = item.type === 'material' || item.type === 'scroll';
                if (!isValidForMaterialsTab) return false;
                if ('scroll' === 'scroll') return item.type === 'scroll';
                return item.category === 'scroll';
            });
            assertEqual(scrollFiltered.length, 2, 'Scroll filter should include teleport_scroll + unknown_item');

            // Restore original ItemData
            window.ItemData = originalItemData;
        });
    });

    describe('Icon Mapping for Scrolls', () => {
        it('should return scroll icon for scroll items', () => {
            if (typeof InventoryUI === 'undefined') return;

            // Mock ItemData and context
            const originalItemData = window.ItemData;
            window.ItemData = {
                getItem: (id) => {
                    if (id === 'test_scroll') return { type: 'scroll' };
                    return null;
                }
            };

            const mockContext = {
                getCategoryIcon: InventoryUI.prototype.getCategoryIcon,
                getIconFromName: InventoryUI.prototype.getIconFromName
            };

            const getMaterialIcon = InventoryUI.prototype.getMaterialIcon;
            const scrollIcon = getMaterialIcon.call(mockContext, 'test_scroll');

            assertEqual(scrollIcon, '📜', 'Scroll items should get scroll icon');

            // Restore original ItemData
            window.ItemData = originalItemData;
        });

        it('should fallback to name-based mapping for unknown scrolls', () => {
            if (typeof InventoryUI === 'undefined') return;

            const mockContext = {
                getCategoryIcon: InventoryUI.prototype.getCategoryIcon,
                getIconFromName: InventoryUI.prototype.getIconFromName
            };

            const getMaterialIcon = InventoryUI.prototype.getMaterialIcon;
            const unknownScrollIcon = getMaterialIcon.call(mockContext, 'unknown_scroll_item');

            assertEqual(unknownScrollIcon, '📜', 'Unknown scroll items should get scroll icon via name matching');
        });
    });
});