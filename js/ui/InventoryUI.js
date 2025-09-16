/**
 * InventoryUI Module
 * Handles inventory viewing and equipment UI, extracted from legacy ui.js
 * Follows BaseUIModule lifecycle and UI conventions in docs/ui-module-conventions.md
 */
class InventoryUI extends BaseUIModule {
    constructor(uiManager, options = {}) {
        super('InventoryUI', uiManager, {
            scenes: ['inventory'],
            dependencies: ['UIHelpers'],
            ...options
        });
    }

    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            persistent: false,
            transition: 'fade'
        };
    }

    // Cache DOM elements used by Inventory UI
    cacheElements() {
        this.elements = {
            container: document.getElementById('inventory'),
            backButton: document.getElementById('back-from-inventory'),
            tabs: document.getElementById('inventory-tabs'),
            itemList: document.getElementById('inventory-items'),
            equipmentPanel: document.getElementById('equipment-panel'),
            filterSelect: document.getElementById('inventory-filter'),
            goldDisplay: document.getElementById('inventory-gold')
        };
        // Only require the scene container to exist to avoid breaking legacy screens
        if (!this.elements.container) {
            // Defer errors to when the scene is actually shown
            console.warn('InventoryUI: container #inventory not found at init');
        }
    }

    // Attach event listeners
    attachEvents() {
        const { backButton, filterSelect, itemList } = this.elements;

        if (backButton) {
            this.addEventListener(backButton, 'click', () => {
                if (this.uiManager && typeof this.uiManager.returnToPrevious === 'function') {
                    this.uiManager.returnToPrevious();
                }
            });
        }

        if (filterSelect) {
            this.addEventListener(filterSelect, 'change', () => {
                this.state.filters.type = filterSelect.value || 'all';
                this.refreshInventoryList();
            });
        }

        if (itemList) {
            // Delegate clicks for item interaction; specific actions will be implemented in later subtasks
            this.addEventListener(itemList, 'click', (e) => {
                const row = e.target.closest('[data-item-id]');
                if (!row) return;
                const itemId = row.getAttribute('data-item-id');
                this.state.selectedItem = itemId;
                this.openItemDetail(itemId);
            });
        }

        // Tabs
        document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
            this.addEventListener(btn, 'click', () => {
                const tab = btn.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });

        // Equipment filter buttons
        document.querySelectorAll('.equipment-filters .filter-btn').forEach(btn => {
            this.addEventListener(btn, 'click', () => {
                const filter = btn.getAttribute('data-filter');
                this.setEquipmentFilter(filter);
            });
        });

        // Items filter buttons
        document.querySelectorAll('.items-filters .filter-btn').forEach(btn => {
            this.addEventListener(btn, 'click', () => {
                const filter = btn.getAttribute('data-filter');
                this.setItemsFilter(filter);
            });
        });

        // Materials filter buttons
        document.querySelectorAll('.materials-filters .filter-btn').forEach(btn => {
            this.addEventListener(btn, 'click', () => {
                const filter = btn.getAttribute('data-filter');
                this.setMaterialsFilter(filter);
            });
        });

        // Modal close and background click
        const modal = document.getElementById('item-detail-modal');
        const closeBtn = document.getElementById('close-item-detail');
        const equipBtn = document.getElementById('equip-item-btn');
        const useBtn = document.getElementById('use-item-btn');
        const sellBtn = document.getElementById('sell-item-btn');
        if (modal) {
            this.addEventListener(modal, 'click', (e) => {
                if (e.target === modal) this.hideItemDetail();
            });
        }
        if (closeBtn) {
            this.addEventListener(closeBtn, 'click', () => this.hideItemDetail());
        }

        // Modal action buttons
        if (equipBtn) {
            this.addEventListener(equipBtn, 'click', () => {
                if (this.state.selectedItem) this.equipItem(this.state.selectedItem);
            });
        }
        if (useBtn) {
            this.addEventListener(useBtn, 'click', () => {
                if (this.state.selectedItem) this.useItem(this.state.selectedItem);
            });
        }
        if (sellBtn) {
            this.addEventListener(sellBtn, 'click', () => {
                if (this.state.selectedItem) this.sellItem(this.state.selectedItem);
            });
        }

        // Equipment slot click-to-unequip (delegate on panel)
        if (this.elements.equipmentPanel) {
            this.addEventListener(this.elements.equipmentPanel, 'click', (e) => {
                const slotEl = e.target.closest('.equipment-slot');
                if (!slotEl) return;
                const slotType = slotEl.getAttribute('data-slot');
                if (slotType) this.unequipItem(slotType);
            });
        }
    }

    // Initial state
    setupState() {
        this.state = {
            selectedTab: 'items', // items | equipment | etc.
            selectedItem: null,
            filters: {
                type: 'all'
            },
            equipmentFilter: 'all',
            itemsFilter: 'all',
            materialsFilter: 'all'
        };
    }

    // Called when module is shown
    onShow(data) {
        // Ensure elements are cached if DOM was not ready during init
        if (!this.elements || !this.elements.container) {
            this.cacheElements();
            this.attachEvents();
        }
        this.refreshAll();
    }

    // Called when module is hidden
    onHide() {
        // No-op for now; later subtasks may persist scroll or selection
    }

    // Refresh everything
    refreshAll() {
        this.refreshHeader();
        this.refreshInventoryList();
        this.refreshEquipmentPanel();
        // Ensure current tab content is populated
        this.switchTab(this.state.selectedTab || 'items');
    }

    // Refresh header information like gold
    refreshHeader() {
        const gs = this.getGameState();
        if (!gs) return;
        if (this.elements.goldDisplay) {
            // Mirror legacy: use player.inventory.gold when available
            const gold = gs.player?.inventory?.gold ?? gs.player?.gold ?? 0;
            this.elements.goldDisplay.textContent = `${gold}`;
        }
    }

    // Build inventory list UI (placeholder; full logic in 7.2–7.4)
    refreshInventoryList() {
        const { itemList } = this.elements;
        if (!itemList) return;

        const gs = this.getGameState();
        const items = gs?.player?.inventory?.items || {};
        const entries = Object.entries(items);
        const filtered = this.applyFilters(entries);

        itemList.innerHTML = '';
        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No items';
            itemList.appendChild(empty);
            return;
        }

        filtered.forEach(([itemId, qty]) => {
            const row = document.createElement('div');
            row.className = 'inventory-row';
            row.setAttribute('data-item-id', itemId);

            const name = document.createElement('span');
            name.className = 'item-name';
            name.textContent = this.formatItemName(itemId);

            const count = document.createElement('span');
            count.className = 'item-qty';
            count.textContent = `x${qty}`;

            row.appendChild(name);
            row.appendChild(count);
            itemList.appendChild(row);
        });
    }

    // Apply active filters to inventory entries
    applyFilters(entries) {
        const type = this.state.filters?.type || 'all';
        if (type === 'all') return entries;

        // If ItemData is available, filter by item type
        if (typeof window.ItemData !== 'undefined' && window.ItemData?.getItem) {
            return entries.filter(([itemId]) => {
                const item = window.ItemData.getItem(itemId);
                return item?.type === type;
            });
        }
        return entries;
    }

    // Placeholder for showing item details
    showItemDetails(itemId) {
        // Later subtasks will implement modal/details and actions
        const pretty = this.formatItemName(itemId);
        this.showNotification(`Selected: ${pretty}`);
    }

    // Equipment panel refresh (skeleton; full logic in 7.2–7.4)
    refreshEquipmentPanel() {
        const { equipmentPanel } = this.elements;
        if (!equipmentPanel) return;

        const gs = this.getGameState();
        const eq = gs?.player?.equipment || {};
        equipmentPanel.innerHTML = '';

        const slots = ['weapon', 'armor', 'accessory'];
        slots.forEach((slot) => {
            const row = document.createElement('div');
            row.className = 'equipment-row';

            const label = document.createElement('span');
            label.className = 'equipment-slot';
            label.setAttribute('data-slot', slot);
            label.textContent = slot.charAt(0).toUpperCase() + slot.slice(1);

            const value = document.createElement('span');
            value.className = 'equipment-item';
            const itemId = eq[slot] || null;
            value.textContent = itemId ? this.formatItemName(itemId) : 'None';

            row.appendChild(label);
            row.appendChild(value);
            equipmentPanel.appendChild(row);
        });
    }

    // -------------------------------
    // Tab Switching and Filters
    // -------------------------------

    switchTab(tabName) {
        if (!tabName) return;
        this.state.selectedTab = tabName;

        // Update tab buttons
        document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });

        // Update tab content
        document.querySelectorAll('.inventory-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });

        // Populate active tab
        switch (tabName) {
            case 'equipment':
                this.renderEquipmentList(this.state.equipmentFilter || 'all');
                break;
            case 'items':
                this.renderItemsGrid(this.state.itemsFilter || 'all');
                break;
            case 'materials':
                this.renderMaterialsGrid(this.state.materialsFilter || 'all');
                break;
        }
    }

    setEquipmentFilter(filter) {
        this.state.equipmentFilter = filter || 'all';
        // Update active classes
        document.querySelectorAll('.equipment-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === this.state.equipmentFilter);
        });
        this.renderEquipmentList(this.state.equipmentFilter);
    }

    setItemsFilter(filter) {
        this.state.itemsFilter = filter || 'all';
        document.querySelectorAll('.items-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === this.state.itemsFilter);
        });
        this.renderItemsGrid(this.state.itemsFilter);
    }

    setMaterialsFilter(filter) {
        this.state.materialsFilter = filter || 'all';
        document.querySelectorAll('.materials-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === this.state.materialsFilter);
        });
        this.renderMaterialsGrid(this.state.materialsFilter);
    }

    // -------------------------------
    // Rendering helpers (skeletons)
    // -------------------------------

    updateEquipmentSlots(equipment) {
        // Rebuild the equipment panel using provided equipment mapping
        const { equipmentPanel } = this.elements;
        if (!equipmentPanel) return;
        const eq = equipment || {};
        equipmentPanel.innerHTML = '';
        ['weapon', 'armor', 'accessory'].forEach(slot => {
            const row = document.createElement('div');
            row.className = 'equipment-row';
            const label = document.createElement('span');
            label.className = 'equipment-slot';
            label.setAttribute('data-slot', slot);
            label.textContent = slot.charAt(0).toUpperCase() + slot.slice(1);
            const value = document.createElement('span');
            value.className = 'equipment-item';
            const itemId = eq[slot] || null;
            value.textContent = itemId ? this.formatItemName(itemId) : 'None';
            row.appendChild(label);
            row.appendChild(value);
            equipmentPanel.appendChild(row);
        });
    }

    renderEquipmentList(filter = 'all') {
        const container = document.getElementById('equipment-list');
        if (!container) return;
        const gs = this.getGameState();
        const items = gs?.player?.inventory?.items || {};
        const entries = Object.entries(items);
        // If ItemData exists, filter by equipment types and requested filter
        const filtered = entries.filter(([itemId, qty]) => {
            if (qty <= 0) return false;
            if (typeof window.ItemData !== 'undefined' && window.ItemData?.getItem) {
                const item = window.ItemData.getItem(itemId);
                const isEquip = ['weapon', 'armor', 'accessory'].includes(item?.type);
                if (!isEquip) return false;
                if (filter === 'all') return true;
                return item.type === filter;
            }
            // Without ItemData, show all entries in equipment tab
            return true;
        });

        container.innerHTML = '';
        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No equipment available';
            container.appendChild(empty);
            return;
        }

        filtered.forEach(([itemId, qty]) => {
            const row = document.createElement('div');
            row.className = 'equipment-list-row';
            row.setAttribute('data-item-id', itemId);
            const name = document.createElement('span');
            name.className = 'item-name';
            name.textContent = this.formatItemName(itemId);
            const count = document.createElement('span');
            count.className = 'item-qty';
            count.textContent = `x${qty}`;
            row.appendChild(name);
            row.appendChild(count);
            container.appendChild(row);
        });
    }

    renderItemsGrid(filter = 'all') {
        const container = document.getElementById('items-grid');
        if (!container) return;
        const gs = this.getGameState();
        const items = gs?.player?.inventory?.items || {};
        const entries = Object.entries(items);
        const filtered = entries.filter(([itemId, qty]) => {
            if (qty <= 0) return false;
            if (typeof window.ItemData !== 'undefined' && window.ItemData?.getItem) {
                const item = window.ItemData.getItem(itemId);
                if (!item) return false;
                if (['weapon', 'armor', 'accessory'].includes(item.type)) return false;
                if (filter === 'all') return true;
                return item.type === filter;
            }
            return true;
        });

        container.innerHTML = '';
        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No items';
            container.appendChild(empty);
            return;
        }

        filtered.forEach(([itemId, qty]) => {
            const cell = document.createElement('div');
            cell.className = 'item-cell';
            cell.setAttribute('data-item-id', itemId);
            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = this.formatItemName(itemId);
            const count = document.createElement('div');
            count.className = 'item-qty';
            count.textContent = `x${qty}`;
            cell.appendChild(name);
            cell.appendChild(count);
            container.appendChild(cell);
        });
    }

    renderMaterialsGrid(filter = 'all') {
        const container = document.getElementById('materials-grid');
        if (!container) return;
        const gs = this.getGameState();
        const items = gs?.player?.inventory?.items || {};
        const entries = Object.entries(items);
        const filtered = entries.filter(([itemId, qty]) => {
            if (qty <= 0) return false;
            if (typeof window.ItemData !== 'undefined' && window.ItemData?.getItem) {
                const item = window.ItemData.getItem(itemId);
                if (!item) return false;
                // Heuristic: treat type === 'material' as crafting material
                if (filter === 'all') return item.type === 'material';
                return item.type === 'material' && item.subtype === filter;
            }
            return false;
        });

        container.innerHTML = '';
        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No materials';
            container.appendChild(empty);
            return;
        }

        filtered.forEach(([itemId, qty]) => {
            const cell = document.createElement('div');
            cell.className = 'material-cell';
            cell.setAttribute('data-item-id', itemId);
            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = this.formatItemName(itemId);
            const count = document.createElement('div');
            count.className = 'item-qty';
            count.textContent = `x${qty}`;
            cell.appendChild(name);
            cell.appendChild(count);
            container.appendChild(cell);
        });
    }

    // Utility: prettify item id
    formatItemName(id) {
        return (id || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
    }

    // -------------------------------
    // Character stats and item detail modal
    // -------------------------------

    updateCharacterStatsDisplay() {
        const gs = this.getGameState();
        if (!gs || !gs.player || typeof gs.player.getEffectiveStats !== 'function') return;
        const stats = gs.player.getEffectiveStats();
        const statMapping = {
            'stat-hp': 'hp',
            'stat-mp': 'mp',
            'stat-attack': 'attack',
            'stat-defense': 'defense',
            'stat-magic-attack': 'magicAttack',
            'stat-magic-defense': 'magicDefense',
            'stat-speed': 'speed',
            'stat-accuracy': 'accuracy'
        };
        for (const [elId, key] of Object.entries(statMapping)) {
            const el = document.getElementById(elId);
            if (el && stats[key] !== undefined) {
                el.textContent = stats[key];
            }
        }
    }

    getItemStatsString(item) {
        if (!item || !item.stats) return '';
        const parts = [];
        for (const [stat, val] of Object.entries(item.stats)) {
            const sign = val >= 0 ? '+' : '';
            parts.push(`${stat}: ${sign}${val}`);
        }
        return parts.join(', ');
    }

    openItemDetail(itemId) {
        this.state.selectedItem = itemId;
        const modal = document.getElementById('item-detail-modal');
        if (!modal) return;

        let item = null;
        if (typeof window.ItemData !== 'undefined' && window.ItemData?.getItem) {
            item = window.ItemData.getItem(itemId);
        }

        const nameEl = document.getElementById('item-detail-name');
        const descEl = document.getElementById('item-detail-desc');
        const statsEl = document.getElementById('item-detail-stats');
        const equipBtn = document.getElementById('equip-item-btn');
        const useBtn = document.getElementById('use-item-btn');
        const sellBtn = document.getElementById('sell-item-btn');

        if (nameEl) nameEl.textContent = item?.name || this.formatItemName(itemId);
        if (descEl) descEl.textContent = item?.description || '';
        if (statsEl) statsEl.textContent = this.getItemStatsString(item);

        // Enable/disable action buttons based on item type (actual actions in 7.4)
        const isEquip = item && ['weapon', 'armor', 'accessory'].includes(item.type);
        if (equipBtn) equipBtn.disabled = !isEquip;
        // For now, leave use/sell toggles permissive; detailed rules in 7.4
        if (useBtn) useBtn.disabled = false;
        if (sellBtn) sellBtn.disabled = false;

        modal.classList.remove('hidden');
    }

    hideItemDetail() {
        const modal = document.getElementById('item-detail-modal');
        if (modal) modal.classList.add('hidden');
        this.state.selectedItem = null;
    }

    unequipItem(slotType) {
        const gs = this.getGameState();
        if (!gs) return;
        if (typeof gs.unequipItem === 'function') {
            const res = gs.unequipItem(slotType);
            if (!res || res.ok !== true) return;
        } else {
            // Fallback: move equipped item back to inventory if present
            const current = gs.player?.equipment?.[slotType];
            if (!current) return;
            gs.player.equipment[slotType] = null;
            gs.player.inventory = gs.player.inventory || {};
            gs.player.inventory.items = gs.player.inventory.items || {};
            gs.player.inventory.items[current] = (gs.player.inventory.items[current] || 0) + 1;
        }

        // Refresh UI
        this.updateEquipmentSlots(gs.player.equipment);
        this.updateCharacterStatsDisplay();
        this.refreshInventoryList();
        this.refreshHeader();

        // Optional autosave
        try { window.SaveSystem?.autoSave?.(); } catch (_) {}
    }

    // -------------------------------
    // Item actions: equip, sell, use
    // -------------------------------

    equipItem(itemId) {
        const gs = this.getGameState();
        if (!gs || typeof window.ItemData === 'undefined') return;

        const item = window.ItemData.getItem(itemId);
        if (!item || !['weapon', 'armor', 'accessory'].includes(item.type)) return;

        if (typeof window.ItemData.canPlayerUseItem === 'function' &&
            !window.ItemData.canPlayerUseItem(itemId, gs.player)) {
            this.showNotification('Cannot equip this item', 'error');
            return;
        }

        const slot = item.type;
        const prev = gs.player.equipment?.[slot];
        gs.player.equipment = gs.player.equipment || {};
        gs.player.inventory = gs.player.inventory || {};
        gs.player.inventory.items = gs.player.inventory.items || {};

        if (prev) {
            gs.player.inventory.items[prev] = (gs.player.inventory.items[prev] || 0) + 1;
        }
        gs.player.equipment[slot] = itemId;

        if (gs.player.inventory.items[itemId] != null) {
            gs.player.inventory.items[itemId]--;
            if (gs.player.inventory.items[itemId] <= 0) {
                delete gs.player.inventory.items[itemId];
            }
        }

        this.showNotification(`Equipped ${item.name || this.formatItemName(itemId)}`, 'success');
        this.hideItemDetail();
        this.updateEquipmentSlots(gs.player.equipment);
        this.updateCharacterStatsDisplay();
        this.refreshInventoryList();
        this.refreshHeader();
        try { window.SaveSystem?.autoSave?.(); } catch (_) {}
    }

    sellItem(itemId) {
        const gs = this.getGameState();
        if (!gs || typeof window.ItemData === 'undefined') return;

        const item = window.ItemData.getItem(itemId);
        if (!item) return;

        gs.player.inventory = gs.player.inventory || {};
        gs.player.inventory.items = gs.player.inventory.items || {};
        if (!gs.player.inventory.items[itemId] || gs.player.inventory.items[itemId] <= 0) {
            this.showNotification("You don't have this item!", 'error');
            return;
        }

        const sellPrice = Math.floor((item.value || 0) * 0.5);
        gs.player.inventory.items[itemId]--;
        if (gs.player.inventory.items[itemId] <= 0) delete gs.player.inventory.items[itemId];
        gs.player.inventory.gold = (gs.player.inventory.gold || 0) + sellPrice;

        this.showNotification(`Sold ${item.name || this.formatItemName(itemId)} for ${sellPrice} gold`, 'success');
        this.hideItemDetail();
        this.refreshInventoryList();
        this.refreshHeader();
        try { window.SaveSystem?.autoSave?.(); } catch (_) {}
    }

    useItem(itemId) {
        const gs = this.getGameState();
        if (!gs || typeof window.ItemData === 'undefined') return;
        const item = window.ItemData.getItem(itemId);
        if (!item) return;

        // Basic non-combat use handling; specific effects delegated if available
        let applied = false;
        try {
            if (typeof window.ItemData.applyItemEffect === 'function') {
                const result = window.ItemData.applyItemEffect(itemId, gs.player, gs);
                applied = !!(result?.ok ?? result);
            }
        } catch (_) { /* ignore */ }

        if (!applied) {
            // Fallback: treat as consumable that disappears
            applied = ['consumable', 'potion', 'elixir'].includes(item.type);
        }

        if (!applied) {
            this.showNotification('Cannot use this item here', 'error');
            return;
        }

        gs.player.inventory = gs.player.inventory || {};
        gs.player.inventory.items = gs.player.inventory.items || {};
        if (!gs.player.inventory.items[itemId] || gs.player.inventory.items[itemId] <= 0) {
            this.showNotification("You don't have this item!", 'error');
            return;
        }

        gs.player.inventory.items[itemId]--;
        if (gs.player.inventory.items[itemId] <= 0) delete gs.player.inventory.items[itemId];

        this.showNotification(`Used ${item.name || this.formatItemName(itemId)}`, 'success');
        this.hideItemDetail();
        this.updateCharacterStatsDisplay();
        this.refreshInventoryList();
        try { window.SaveSystem?.autoSave?.(); } catch (_) {}
    }

    // Optional: provide minimal info for debugging
    getInfo() {
        return {
            ...super.getInfo(),
            selectedTab: this.state.selectedTab,
            selectedItem: this.state.selectedItem,
            filterType: this.state.filters?.type
        };
    }
}

// Export for module loader and global access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryUI;
} else if (typeof window !== 'undefined') {
    window.InventoryUI = InventoryUI;
}
