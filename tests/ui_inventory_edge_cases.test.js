/**
 * InventoryUI Edge Cases and Operations Tests (7.5)
 */

describe('InventoryUI Operations and Edge Cases', () => {
    let game;
    let uiManager;
    let invUI;
    let gs;

    function ensureInventoryUI() {
        // Try to get from UIManager registry
        invUI = uiManager?.getModule && uiManager.getModule('InventoryUI');
        if (!invUI && typeof InventoryUI !== 'undefined') {
            invUI = new InventoryUI(uiManager || {});
            if (typeof invUI.init === 'function') invUI.init();
        }
        assertTruthy(invUI, 'InventoryUI instance should be available');
    }

    function stubItemData() {
        const original = {
            getItem: window.ItemData?.getItem,
            canPlayerUseItem: window.ItemData?.canPlayerUseItem,
            applyItemEffect: window.ItemData?.applyItemEffect
        };
        if (!window.ItemData) window.ItemData = {};
        window.ItemData.getItem = (id) => ({
            id,
            name: id.replace(/_/g, ' ').toUpperCase(),
            type: id.includes('sword') ? 'weapon' : (id.includes('armor') ? 'armor' : (id.includes('potion') ? 'consumable' : 'misc')),
            value: 100,
            stats: id.includes('sword') ? { attack: 5 } : (id.includes('armor') ? { defense: 3 } : {})
        });
        window.ItemData.canPlayerUseItem = (id, player) => true;
        window.ItemData.applyItemEffect = (id, player, gameState) => ({ ok: id.includes('potion') });
        return original;
    }

    function restoreItemData(original) {
        if (!original) return;
        if (original.getItem) window.ItemData.getItem = original.getItem; else delete window.ItemData.getItem;
        if (original.canPlayerUseItem) window.ItemData.canPlayerUseItem = original.canPlayerUseItem; else delete window.ItemData.canPlayerUseItem;
        if (original.applyItemEffect) window.ItemData.applyItemEffect = original.applyItemEffect; else delete window.ItemData.applyItemEffect;
    }

    beforeAll(async () => {
        game = window.SawyersRPG;
        assertTruthy(game, 'Game should be initialized');
        // Wait for UI and GS
        let attempts = 0;
        while ((!game.getGameState || !game.getUI || !game.getGameState() || !game.getUI()) && attempts < 50) {
            await new Promise(r => setTimeout(r, 10));
            attempts++;
        }
        gs = game.getGameState();
        uiManager = game.getUI();
        assertTruthy(gs, 'GameState should be available');
        assertTruthy(uiManager, 'UIManager should be available');
        ensureInventoryUI();
    });

    beforeEach(() => {
        // Reset a minimal inventory and equipment
        gs.resetToDefaults && gs.resetToDefaults();
        gs.player = gs.player || {};
        gs.player.inventory = { gold: 0, items: {} };
        gs.player.equipment = { weapon: null, armor: null, accessory: null };
    });

    it('equipItem equips weapon, updates equipment and inventory', () => {
        const original = stubItemData();
        try {
            // Seed inventory with iron_sword
            gs.player.inventory.items['iron_sword'] = 1;
            ensureInventoryUI();

            invUI.equipItem('iron_sword');

            assertEqual(gs.player.equipment.weapon, 'iron_sword', 'Weapon slot should be iron_sword');
            assertFalsy(gs.player.inventory.items['iron_sword'], 'Inventory should decrement/remove the equipped item');
        } finally {
            restoreItemData(original);
        }
    });

    it('unequipItem moves equipped item back to inventory', () => {
        const original = stubItemData();
        try {
            // Equip first
            gs.player.inventory.items['iron_sword'] = 1;
            invUI.equipItem('iron_sword');
            // Unequip
            invUI.unequipItem('weapon');
            assertFalsy(gs.player.equipment.weapon, 'Weapon slot should be empty after unequip');
            assertTruthy(gs.player.inventory.items['iron_sword'] === 1, 'Inventory should regain the item');
        } finally {
            restoreItemData(original);
        }
    });

    it('useItem applies effect and reduces count', () => {
        const original = stubItemData();
        try {
            gs.player.inventory.items['health_potion'] = 2;
            invUI.useItem('health_potion');
            assertEqual(gs.player.inventory.items['health_potion'], 1, 'Using an item should decrement count');
        } finally {
            restoreItemData(original);
        }
    });

    it('sellItem increases gold and removes item', () => {
        const original = stubItemData();
        try {
            gs.player.inventory.items['iron_sword'] = 1;
            invUI.sellItem('iron_sword');
            assertFalsy(gs.player.inventory.items['iron_sword'], 'Sold item should be removed from inventory');
            assertTruthy(gs.player.inventory.gold > 0, 'Gold should increase after selling');
        } finally {
            restoreItemData(original);
        }
    });

    it('tab switching and filters do not throw with minimal DOM', () => {
        ensureInventoryUI();
        invUI.switchTab('items');
        invUI.setItemsFilter('consumable');
        invUI.switchTab('equipment');
        invUI.setEquipmentFilter('weapon');
        invUI.switchTab('materials');
        invUI.setMaterialsFilter('all');
        assertTruthy(true, 'Tab and filter operations completed without throwing');
    });
});
