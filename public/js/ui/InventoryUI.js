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
            filterSelect: document.getElementById('inventory-filter'),
            goldDisplay: document.getElementById('inventory-gold')
        };
        // Only require the scene container to exist to avoid breaking legacy screens
        if (!this.elements.container) {
            // Defer errors to when the scene is actually shown
            console.warn('InventoryUI: container #inventory not found at init');
        }

        // Add tooltip CSS styles
        this.addTooltipStyles();
    }

    /**
     * Add CSS styles for equipment comparison tooltips
     */
    addTooltipStyles() {
        if (document.getElementById('equipment-tooltip-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'equipment-tooltip-styles';
        styles.textContent = `
            .equipment-comparison-tooltip {
                position: fixed;
                background: var(--background-primary, #2c1810);
                border: 2px solid var(--primary-gold, #d4af37);
                border-radius: 8px;
                padding: 16px;
                min-width: 320px;
                max-width: 500px;
                font-family: var(--font-primary, 'Georgia', serif);
                font-size: 14px;
                color: var(--text-primary, #f4e4bc);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
                z-index: 10000;
                pointer-events: none;
                animation: tooltipFadeIn 0.2s ease-out;
            }

            @keyframes tooltipFadeIn {
                from {
                    opacity: 0;
                    transform: scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            .tooltip-header {
                text-align: center;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid var(--primary-gold, #d4af37);
            }

            .tooltip-title {
                font-weight: bold;
                font-size: 16px;
                color: var(--primary-gold, #d4af37);
            }

            .comparison-items {
                display: flex;
                gap: 16px;
                margin-bottom: 12px;
                align-items: stretch;
            }

            .comparison-item {
                flex: 1;
                padding: 12px;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.05);
            }

            .comparison-item.new-item {
                border-left: 3px solid #4caf50;
            }

            .comparison-item.current-item {
                border-left: 3px solid #2196f3;
            }

            .comparison-item.empty {
                border-left: 3px solid #9e9e9e;
                opacity: 0.7;
            }

            .comparison-vs {
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: var(--primary-gold, #d4af37);
                min-width: 30px;
                font-size: 12px;
            }

            .item-header {
                margin-bottom: 8px;
            }

            .item-name {
                font-weight: bold;
                display: block;
                margin-bottom: 4px;
            }

            .item-rarity {
                font-size: 12px;
                padding: 2px 6px;
                border-radius: 3px;
                font-weight: bold;
            }

            .item-rarity.rarity-common {
                background: #9e9e9e;
                color: white;
            }

            .item-rarity.rarity-uncommon {
                background: #4caf50;
                color: white;
            }

            .item-rarity.rarity-rare {
                background: #2196f3;
                color: white;
            }

            .item-rarity.rarity-epic {
                background: #9c27b0;
                color: white;
            }

            .item-rarity.rarity-legendary {
                background: #ff9800;
                color: white;
                text-shadow: 0 0 4px rgba(255, 152, 0, 0.7);
            }

            .equipped-label {
                font-size: 11px;
                color: var(--text-secondary, #b8860b);
                font-style: italic;
                margin-left: 8px;
            }

            .item-stats {
                margin: 8px 0;
            }

            .stat-line {
                display: flex;
                justify-content: space-between;
                margin: 4px 0;
                font-size: 13px;
            }

            .stat-name {
                color: var(--text-secondary, #b8860b);
            }

            .stat-value {
                font-weight: bold;
            }

            .stat-value.new {
                color: #4caf50;
            }

            .stat-value.current {
                color: #2196f3;
            }

            .item-description {
                font-size: 12px;
                color: var(--text-secondary, #b8860b);
                font-style: italic;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .empty-slot-message {
                color: var(--text-secondary, #b8860b);
                font-style: italic;
                text-align: center;
                padding: 8px;
            }

            .stat-changes {
                margin: 12px 0;
                padding: 8px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }

            .changes-title {
                font-weight: bold;
                margin-bottom: 6px;
                color: var(--primary-gold, #d4af37);
                font-size: 13px;
            }

            .stat-change {
                display: flex;
                align-items: center;
                gap: 6px;
                margin: 3px 0;
                font-size: 12px;
            }

            .stat-change.improvement {
                color: #4caf50;
            }

            .stat-change.downgrade {
                color: #f44336;
            }

            .change-icon {
                font-size: 10px;
                font-weight: bold;
            }

            .change-value {
                font-weight: bold;
                margin-left: auto;
            }

            .no-changes {
                text-align: center;
                color: var(--text-secondary, #b8860b);
                font-style: italic;
                font-size: 12px;
            }

            .tooltip-footer {
                margin-top: 12px;
                padding-top: 8px;
                border-top: 1px solid var(--primary-gold, #d4af37);
                text-align: center;
            }

            .upgrade-recommendation {
                font-size: 13px;
                font-weight: bold;
            }

            .recommendation.upgrade {
                color: #4caf50;
            }

            .recommendation.downgrade {
                color: #f44336;
            }

            .recommendation.mixed {
                color: #ff9800;
            }

            .recommendation.neutral {
                color: var(--text-secondary, #b8860b);
            }

            .equipment-indicator {
                font-size: 12px;
                margin-left: 8px;
                opacity: 0.7;
            }

            .inventory-row.equipment-item {
                cursor: help;
                position: relative;
            }

            .inventory-row.equipment-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }
        `;
        document.head.appendChild(styles);
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
            // Delegate clicks for item interaction; specific actions will be implemented later
            this.addEventListener(itemList, 'click', (e) => {
                const row = e.target.closest('[data-item-id]');
                if (!row) return;
                const itemId = row.getAttribute('data-item-id');
                this.state.selectedItem = itemId;
                this.openItemDetail(itemId);
            });
        }

        // Equipment list click-to-equip (delegation)
        const equipmentList = document.getElementById('equipment-list');
        if (equipmentList) {
            this.addEventListener(equipmentList, 'click', (e) => {
                const row = e.target.closest('.equipment-list-row');
                if (!row) return;
                const itemId = row.getAttribute('data-item-id');
                if (!itemId) return;
                this.equipItem(itemId);
            });
        }

        // Equipment filters
        document.querySelectorAll('.equipment-filters .filter-btn').forEach(btn => {
            this.addEventListener(btn, 'click', () => {
                const filter = btn.getAttribute('data-filter') || 'all';
                this.setEquipmentFilter(filter);
            });
        });

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

        // Equipment slot click-to-unequip (delegate on equipment slots container)
        const equipmentSlotsContainer = document.querySelector('.equipment-slots');
        if (equipmentSlotsContainer) {
            this.addEventListener(equipmentSlotsContainer, 'click', (e) => {
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
        try {
            const gs = this.getGameState();
            const inv = gs?.player?.inventory?.items || {};
            console.log('[INV DEBUG] onShow - inventory keys:', Object.keys(inv), 'gold:', gs?.player?.inventory?.gold);
        } catch(_) {}
        this.refreshAll();
        // Ensure character stats/EXP are up to date when entering the screen
        try { this.updateCharacterStatsDisplay(); } catch (_) {}
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
        this.updateCharacterStatsDisplay();
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
        console.log('[INV DEBUG] refreshInventoryList entries:', entries.length);
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

            // Check if this is an equipment item for comparison tooltip
            const isEquipment = this.isEquipmentItem(itemId);
            if (isEquipment) {
                row.classList.add('equipment-item');
                this.attachComparisonTooltip(row, itemId);
            }

            const name = document.createElement('span');
            name.className = 'item-name';
            name.textContent = this.formatItemName(itemId);

            const count = document.createElement('span');
            count.className = 'item-qty';
            count.textContent = `x${qty}`;

            // Add equipment indicator for easy identification
            if (isEquipment) {
                const equipIcon = document.createElement('span');
                equipIcon.className = 'equipment-indicator';
                equipIcon.textContent = '⚔️';
                equipIcon.title = 'Equipment item - hover for comparison';
                row.appendChild(equipIcon);
            }

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
        const gs = this.getGameState();
        const eq = gs?.player?.equipment || {};
        // Update individual equipment slots using the existing HTML structure
        const slots = ['weapon', 'armor', 'accessory'];
        slots.forEach((slot) => {
            const slotElement = document.getElementById(`equipped-${slot}`);
            const itemId = eq[slot] || null;

            if (slotElement) {
                const itemNameEl = slotElement.querySelector('.item-name');
                const itemIconEl = slotElement.querySelector('.item-icon');

                if (itemNameEl) {
                    itemNameEl.textContent = itemId ? this.formatItemName(itemId) : 'None';
                }
                if (itemIconEl && itemId) {
                    // Try to get the item icon from ItemData
                    const item = window.ItemData?.getItem?.(itemId);
                    if (item?.icon) {
                        itemIconEl.textContent = item.icon;
                    } else {
                        // Default icons based on slot type
                        const defaultIcons = { weapon: '⚔️', armor: '🛡️', accessory: '💍' };
                        itemIconEl.textContent = defaultIcons[slot] || '⚔️';
                    }
                } else if (itemIconEl) {
                    itemIconEl.textContent = '❌';
                }
            }
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
                // Recalculate stats based on current equipment and level
                const gs = this.getGameState();
                if (gs && typeof gs.recalcPlayerStats === 'function') {
                    gs.recalcPlayerStats();
                }
                // Update player panel, stats, EXP, equipped items and list
                this.updateCharacterStatsDisplay();
                this.refreshEquipmentPanel();
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
        // Update equipment slots using the existing HTML structure
        const eq = equipment || {};
        // Use the same logic as refreshEquipmentPanel
        this.refreshEquipmentPanel();
    }

    renderEquipmentList(filter = 'all') {
        const container = document.getElementById('equipment-list');
        if (!container) return;
        
        // Clean up any existing tooltip event listeners
        const existingRows = container.querySelectorAll('.equipment-list-row');
        existingRows.forEach(row => {
            if (row._cleanupTooltip) {
                row._cleanupTooltip();
            }
        });
        const gs = this.getGameState();
        const player = gs?.player;
        const items = player?.inventory?.items || {};
        const entries = Object.entries(items);
        
        // Get currently equipped items
        const equippedItems = player?.equipment ? Object.values(player.equipment) : [];
        
        // If ItemData exists, filter by equipment types and requested filter
        const filtered = entries.filter(([itemId, qty]) => {
            if (qty <= 0) return false;
            if (typeof window.ItemData !== 'undefined' && window.ItemData?.getItem) {
                const item = window.ItemData.getItem(itemId);
                const isEquip = item && ['weapon', 'armor', 'accessory'].includes(item.type);
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
            const item = window.ItemData?.getItem?.(itemId);
            const isEquipped = equippedItems.includes(itemId);
            
            // Set row classes and attributes
            row.className = 'equipment-list-row';
            if (isEquipped) {
                row.classList.add('equipped');
            }
            row.setAttribute('data-item-id', itemId);
            
            // Create item icon
            const icon = document.createElement('span');
            icon.className = 'item-icon';
            icon.textContent = item?.icon || '⚔️';
            
            // Item info container
            const infoContainer = document.createElement('div');
            infoContainer.className = 'item-info';
            
            // Item name
            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = this.formatItemName(itemId);
            
            // Item quantity
            const count = document.createElement('span');
            count.className = 'item-qty';
            count.textContent = `x${qty}`;
            
            // Add equipped badge if equipped
            if (isEquipped) {
                const badge = document.createElement('span');
                badge.className = 'equipped-badge';
                badge.textContent = 'Equipped';
                name.appendChild(badge);
            }
            
            // Assemble the row
            infoContainer.appendChild(name);
            infoContainer.appendChild(count);
            
            row.appendChild(icon);
            row.appendChild(infoContainer);
            
            // Add tooltip functionality
            if (item?.description) {
                const tooltip = document.createElement('div');
                tooltip.className = 'equipment-tooltip';
                tooltip.textContent = item.description;
                row.appendChild(tooltip);
                
                // Add hover events for tooltip
                row.addEventListener('mouseenter', (e) => {
                    // Show the tooltip first to calculate its dimensions
                    tooltip.style.visibility = 'visible';
                    tooltip.style.opacity = '1';
                    
                    // Get the row's position
                    const rect = row.getBoundingClientRect();
                    
                    // Check if tooltip would go off screen to the right
                    const tooltipWidth = 250; // Max width from CSS
                    const rightSpace = window.innerWidth - rect.right - 20;
                    const useLeftPosition = rightSpace < tooltipWidth;
                    
                    // Position the tooltip
                    if (useLeftPosition) {
                        tooltip.classList.add('left');
                        tooltip.classList.remove('right');
                        tooltip.style.left = `${rect.left - 15}px`;
                    } else {
                        tooltip.classList.add('right');
                        tooltip.classList.remove('left');
                        tooltip.style.left = `${rect.right + 15}px`;
                    }
                    
                    // Center vertically
                    tooltip.style.top = `${rect.top + (rect.height / 2)}px`;
                    
                    row.classList.add('hover');
                });
                
                row.addEventListener('mouseleave', () => {
                    tooltip.style.visibility = 'hidden';
                    tooltip.style.opacity = '0';
                    row.classList.remove('hover');
                });
                
                // Handle window resize to reposition tooltips if needed
                const handleResize = () => {
                    if (row.classList.contains('hover')) {
                        row.dispatchEvent(new Event('mouseenter'));
                    }
                };
                
                window.addEventListener('resize', handleResize);
                
                // Clean up event listener when row is removed
                row._cleanupTooltip = () => {
                    window.removeEventListener('resize', handleResize);
                };
            }
            
            // Add click handler for item actions
            row.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openItemDetail(itemId);
            });
            
            // Position the row as relative to contain absolute tooltips
            row.style.position = 'relative';
            
            // Add the row to the container
            container.appendChild(row);
        });
    }

    renderItemsGrid(filter = 'all') {
        const container = document.getElementById('items-grid');
        if (!container) return;
        const gs = this.getGameState();
        const items = gs?.player?.inventory?.items || {};
        const entries = Object.entries(items);
        console.log('[INV DEBUG] renderItemsGrid entries:', entries.length, 'filter:', filter);
        const filtered = entries.filter(([itemId, qty]) => {
            if (qty <= 0) return false;
            // Prefer ItemData classification when available
            if (typeof window.ItemData !== 'undefined' && window.ItemData?.getItem) {
                const item = window.ItemData.getItem(itemId);
                // If item is unknown to ItemData, still show it as a generic item
                if (!item) return true;
                // Hide equipment from the Items tab
                if (['weapon', 'armor', 'accessory'].includes(item.type)) return false;
                if (filter === 'all') return true;
                // If a specific filter is set, apply it to known items; unknown items already passed above
                return item.type === filter;
            }
            // Fallback: no ItemData -> show all entries in Items tab
            return true;
        });
        console.log('[INV DEBUG] renderItemsGrid filtered:', filtered);

        container.innerHTML = '';
        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No items';
            container.appendChild(empty);
            console.log('[INV DEBUG] renderItemsGrid filtered=0');
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
            // Debug visual aid to ensure visibility
            cell.style.border = '1px solid rgba(255,255,255,0.2)';
            cell.style.padding = '6px';
            cell.style.margin = '4px';
            container.appendChild(cell);
        });
        // Ensure container is visible
        container.style.minHeight = '60px';
        container.style.color = getComputedStyle(document.body).color || '#fff';
    }

    renderMaterialsGrid(filter = 'all') {
        const container = document.getElementById('materials-grid');
        if (!container) return;
        const gs = this.getGameState();
        const items = gs?.player?.inventory?.items || {};
        const entries = Object.entries(items);
        console.log('[INV DEBUG] renderMaterialsGrid entries:', entries.length, 'filter:', filter);
        const filtered = entries.filter(([itemId, qty]) => {
            if (qty <= 0) return false;
            // Prefer ItemData classification when available
            if (typeof window.ItemData !== 'undefined' && window.ItemData?.getItem) {
                const item = window.ItemData.getItem(itemId);
                // If item not found in ItemData, show it in Materials with generic icon and pretty name
                if (!item) return true;
                // Include materials and scrolls in Materials tab
                const isValidForMaterialsTab = item.type === 'material' || item.type === 'scroll';
                if (!isValidForMaterialsTab) return false;
                if (filter === 'all') return true;
                // For scrolls, filter by type; for materials, filter by category
                if (filter === 'scroll') return item.type === 'scroll';
                return item.category === filter;
            }
            // Fallback: no ItemData -> show all entries in Materials tab as a generic list
            return true;
        });
        console.log('[INV DEBUG] renderMaterialsGrid filtered:', filtered);

        container.innerHTML = '';
        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'empty-state';
            empty.textContent = 'No materials';
            container.appendChild(empty);
            console.log('[INV DEBUG] renderMaterialsGrid filtered=0');
            return;
        }

        filtered.forEach(([itemId, qty]) => {
            const cell = document.createElement('div');
            cell.className = 'material-cell';
            cell.setAttribute('data-item-id', itemId);

            // Create name container with icon
            const nameContainer = document.createElement('div');
            nameContainer.className = 'item-name-container';
            nameContainer.style.cssText = 'display: flex; align-items: center; gap: 6px;';

            // Get icon for the material (always returns something, fallback to 📦)
            const icon = this.getMaterialIcon(itemId) || '📦';
            const iconSpan = document.createElement('span');
            iconSpan.className = 'material-icon';
            iconSpan.textContent = icon;
            iconSpan.style.cssText = 'font-size: 16px; flex-shrink: 0;';
            nameContainer.appendChild(iconSpan);

            const name = document.createElement('div');
            name.className = 'item-name';
            name.textContent = this.formatItemName(itemId);
            nameContainer.appendChild(name);

            const count = document.createElement('div');
            count.className = 'item-qty';
            count.textContent = `x${qty}`;

            cell.appendChild(nameContainer);
            cell.appendChild(count);
            // Debug visual aid
            cell.style.border = '1px solid rgba(255,255,255,0.2)';
            cell.style.padding = '6px';
            cell.style.margin = '4px';
            container.appendChild(cell);
        });
        container.style.minHeight = '60px';
        container.style.color = getComputedStyle(document.body).color || '#fff';
    }

    // Utility: prettify item id - converts raw IDs to human-readable names
    formatItemName(id) {
        if (!id) return 'Unknown Item';

        // Convert underscores/hyphens to spaces, then title case each word
        return id.toString()
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, (m) => m.toUpperCase())
            .trim();
    }

    // Get icon for material based on ItemData or intelligent fallback
    getMaterialIcon(itemId) {
        // First try to get icon from ItemData if available
        if (typeof window.ItemData !== 'undefined' && window.ItemData?.getItem) {
            const item = window.ItemData.getItem(itemId);
            if (item && item.icon) {
                return item.icon;
            }

            // Special handling for scrolls by type
            if (item && item.type === 'scroll') {
                return '📜';
            }

            // If no direct icon, use category-based mapping for materials
            if (item && item.category) {
                return this.getCategoryIcon(item.category);
            }
        }

        // Fallback: intelligent icon mapping based on item name
        return this.getIconFromName(itemId);
    }

    // Get icon based on material category
    getCategoryIcon(category) {
        const categoryIcons = {
            // Monster-derived materials
            'monster_part': '🦴',

            // Natural materials (plants, herbs, wood)
            'natural': '🌿',

            // Minerals, ores, crystals
            'mineral': '💎',

            // Magical components
            'magical': '✨',

            // Crafting and utility
            'crafting': '🔨',
            'maintenance': '🔧',
            'utility': '📦',

            // Evolution items
            'evolution': '💫'
        };

        return categoryIcons[category] || '📦'; // Default to package icon
    }

    // Intelligent icon mapping based on item name/ID
    getIconFromName(itemId) {
        // Handle null/undefined item IDs
        if (!itemId) {
            return '📦';
        }

        const nameIconMap = {
            // Specific materials first (more specific matches win)
            'sap': '🍯', 'resin': '🍯',
            'healing_herb': '🌿', 'mana_flower': '🌸', 'poison_ivy': '☘️',

            // Herbs and plants
            'herb': '🌿', 'flower': '🌸', 'leaf': '🍃', 'root': '🌱',

            // Wood and tree materials
            'wood': '🌲', 'branch': '🌳', 'log': '🪵', 'bark': '🌳',
            'oak': '🌳', 'pine': '🌲', 'birch': '🌳', 'willow': '🌳',

            // Crystals and gems
            'crystal': '💎', 'gem': '💎', 'diamond': '💎', 'ruby': '❤️',
            'sapphire': '💙', 'emerald': '💚', 'amethyst': '💜',
            'quartz': '💎', 'shard': '💎',

            // Ores and metals
            'ore': '⛏️', 'iron': '⛏️', 'copper': '🟤', 'gold': '🟨',
            'silver': '⚪', 'steel': '⚫', 'mithril': '✨', 'adamantine': '💠',

            // Monster parts
            'fang': '🔪', 'tooth': '🦷', 'claw': '🪝', 'horn': '🦏',
            'scale': '🐲', 'pelt': '🧥', 'fur': '🧸', 'feather': '🪶',
            'bone': '🦴', 'skull': '💀', 'heart': '❤️', 'eye': '👁️',
            'wing': '🦋', 'tail': '🦎', 'tusk': '🦏',

            // Slime/gel materials
            'slime': '🫧', 'gel': '🫧', 'ooze': '🟢',

            // Magical materials
            'essence': '💫', 'dust': '✨', 'powder': '🌟',
            'rune': '🔮', 'scroll': '📜', 'tome': '📚',
            'orb': '🔮', 'wand': '🪄', 'staff': '🪄',

            // Tools and components
            'kit': '🔧', 'tool': '🔨', 'part': '⚙️', 'gear': '⚙️',
            'spring': '⚙️', 'wire': '🔗', 'chain': '⛓️',

            // Food/bait items
            'bait': '🥩', 'meat': '🥩', 'fish': '🐟', 'bread': '🍞',

            // Bottles and containers
            'potion': '🧪', 'vial': '🧪', 'bottle': '🍶', 'jar': '🫙',

            // Time/special materials
            'time': '⏳', 'temporal': '⏳', 'void': '🕳️', 'chaos': '🌀',
            'evolution': '💫', 'transform': '🔄'
        };

        // Check if any keyword from the map appears in the item ID
        // Process from most specific to least specific to get better matches
        const itemLower = itemId.toLowerCase();

        // For compound materials, prefer the most relevant match
        let bestMatch = null;
        let bestScore = 0;

        for (const [keyword, icon] of Object.entries(nameIconMap)) {
            if (itemLower.includes(keyword)) {
                // Score based on keyword length and position (longer, more specific keywords win)
                const score = keyword.length;
                if (score > bestScore) {
                    bestMatch = icon;
                    bestScore = score;
                }
            }
        }

        if (bestMatch) {
            return bestMatch;
        }

        // Ultimate fallback - generic material icon
        return '📦';
    }

    // -------------------------------
    // Character stats and item detail modal
    // -------------------------------

    updateCharacterStatsDisplay() {
        const gs = this.getGameState();
        if (!gs || !gs.player) return;
        // Prefer a character method if available; otherwise fall back to stored stats
        let stats = null;
        try {
            if (typeof gs.player.getEffectiveStats === 'function') {
                stats = gs.player.getEffectiveStats();
            }
        } catch (_) { /* ignore */ }
        if (!stats) {
            stats = gs.player.stats || {};
        }
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
            if (el) {
                // Provide graceful fallback values to ensure stats are always visible
                const value = stats[key] !== undefined ? stats[key] : 0;
                el.textContent = value;
            }
        }

        // Update character level and experience progress
        this.updateExperienceDisplay();
    }

    updateExperienceDisplay() {
        const gs = this.getGameState();
        if (!gs || !gs.player) return;

        const player = gs.player;
        const level = player.level || 1;
        const currentExp = player.experience || 0;
        // Fallback formula if experienceToNext is not tracked on player
        const expToNext = player.experienceToNext || (typeof player.getExpToNext === 'function' ? player.getExpToNext() : Math.max(50, level * 100));
        const expProgress = expToNext > 0 ? Math.min(100, (currentExp / expToNext) * 100) : 0;

        try {
            console.log('[INV DEBUG] EXP display:', { level, currentExp, expToNext, expProgress: Math.round(expProgress) });
        } catch (_) {}

        // Update level display
        const levelEl = document.getElementById('character-level');
        if (levelEl) levelEl.textContent = level;

        // Update experience display
        const expEl = document.getElementById('character-experience');
        const expNextEl = document.getElementById('character-experience-next');
        const expFillEl = document.getElementById('character-exp-fill');
        const expPctEl = document.getElementById('character-experience-percent');

        if (expEl) expEl.textContent = currentExp;
        if (expNextEl) expNextEl.textContent = expToNext;
        if (expFillEl) {
            expFillEl.style.width = `${expProgress}%`;
            expFillEl.style.minWidth = '2%';
            expFillEl.style.backgroundColor = 'rgba(255,215,0,0.6)';
        }
        if (expPctEl) expPctEl.textContent = ` (${Math.round(expProgress)}%)`;
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

    /**
     * Calculate stat differences between currently equipped item and a new item
     * @param {string} itemId - The ID of the item to compare
     * @returns {Object} Object containing stat deltas and comparison info
     */
    getStatDeltas(itemId) {
        const gs = this.getGameState();
        if (!gs || !gs.player || !window.ItemData) return null;

        const item = window.ItemData.getItem(itemId);
        if (!item || !['weapon', 'armor', 'accessory'].includes(item.type)) return null;

        const slot = item.type;
        const currentItemId = gs.player.equipment?.[slot];
        const currentItem = currentItemId ? window.ItemData.getItem(currentItemId) : null;

        const deltas = {};
        const statMapping = {
            'hp': 'HP',
            'mp': 'MP',
            'attack': 'Attack',
            'defense': 'Defense',
            'magicAttack': 'Magic Atk',
            'magicDefense': 'Magic Def',
            'speed': 'Speed',
            'accuracy': 'Accuracy'
        };

        // Calculate deltas for each stat
        Object.entries(statMapping).forEach(([statKey, displayName]) => {
            const newVal = item.stats?.[statKey] || 0;
            const currentVal = currentItem?.stats?.[statKey] || 0;
            const delta = newVal - currentVal;
            
            if (delta !== 0) {
                deltas[statKey] = {
                    displayName,
                    current: currentVal,
                    new: newVal,
                    delta,
                    isBetter: delta > 0,
                    isWorse: delta < 0
                };
            }
        });

        return {
            hasDeltas: Object.keys(deltas).length > 0,
            deltas,
            isNewSlot: !currentItem,
            slotType: slot
        };
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

        // Show/hide and enable/disable action buttons based on item type
        const isEquip = item && ['weapon', 'armor', 'accessory'].includes(item.type);
        const isUsable = item && ['potion', 'consumable'].includes(item.type);

        if (equipBtn) {
            equipBtn.style.display = isEquip ? 'inline-block' : 'none';
            equipBtn.disabled = !isEquip;
        }
        if (useBtn) {
            useBtn.style.display = isUsable ? 'inline-block' : 'none';
            useBtn.disabled = !isUsable;
        }
        if (sellBtn) {
            sellBtn.style.display = 'inline-block';
            sellBtn.disabled = false;
        }

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
        this.renderEquipmentList(this.state.equipmentFilter || 'all');
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
        this.renderEquipmentList(this.state.equipmentFilter || 'all');
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

    // ================================================
    // LOOT COMPARISON TOOLTIP SYSTEM
    // ================================================

    /**
     * Check if an item is equipment that can be compared
     */
    isEquipmentItem(itemId) {
        if (typeof window.ItemData === 'undefined' || !window.ItemData.getItem) {
            return false;
        }

        const item = window.ItemData.getItem(itemId);
        return item && ['weapon', 'armor', 'accessory'].includes(item.type);
    }

    /**
     * Attach comparison tooltip to an inventory row for equipment items
     */
    attachComparisonTooltip(row, itemId) {
        if (!this.isEquipmentItem(itemId)) return;

        let tooltip = null;
        let showTimeout = null;
        let hideTimeout = null;

        // Mouse enter - show tooltip with delay
        this.addEventListener(row, 'mouseenter', (e) => {
            clearTimeout(hideTimeout);
            showTimeout = setTimeout(() => {
                tooltip = this.createComparisonTooltip(itemId);
                if (tooltip) {
                    document.body.appendChild(tooltip);
                    this.positionTooltip(tooltip, e);
                }
            }, 500); // 500ms delay before showing
        });

        // Mouse move - update tooltip position
        this.addEventListener(row, 'mousemove', (e) => {
            if (tooltip) {
                this.positionTooltip(tooltip, e);
            }
        });

        // Mouse leave - hide tooltip
        this.addEventListener(row, 'mouseleave', () => {
            clearTimeout(showTimeout);
            if (tooltip) {
                hideTimeout = setTimeout(() => {
                    if (tooltip && tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                    tooltip = null;
                }, 100); // Small delay to prevent flickering
            }
        });
    }

    /**
     * Create the comparison tooltip element
     */
    createComparisonTooltip(itemId) {
        const item = window.ItemData.getItem(itemId);
        if (!item) return null;

        const gs = this.getGameState();
        if (!gs) return null;

        // Get currently equipped item in the same slot
        const currentItem = gs.player?.equipment?.[item.type];
        const currentItemData = currentItem ? window.ItemData.getItem(currentItem) : null;

        // Create tooltip container
        const tooltip = document.createElement('div');
        tooltip.className = 'equipment-comparison-tooltip';
        tooltip.innerHTML = this.buildComparisonContent(item, currentItemData, itemId, currentItem);

        return tooltip;
    }

    /**
     * Build the content for the comparison tooltip
     */
    buildComparisonContent(newItem, currentItem, newItemId, currentItemId) {
        const newStats = this.getItemStats(newItem);
        const currentStats = currentItem ? this.getItemStats(currentItem) : {};

        // Calculate stat differences
        const statComparison = this.compareStats(newStats, currentStats);

        return `
            <div class="tooltip-header">
                <div class="tooltip-title">Equipment Comparison</div>
            </div>

            <div class="comparison-items">
                <div class="comparison-item new-item">
                    <div class="item-header">
                        <span class="item-name">${newItem.name || newItemId}</span>
                        <span class="item-rarity rarity-${(newItem.rarity || 'common').toLowerCase()}">${newItem.rarity || 'Common'}</span>
                    </div>
                    <div class="item-stats">
                        ${this.formatItemStats(newStats, 'new')}
                    </div>
                    ${newItem.description ? `<div class="item-description">${newItem.description}</div>` : ''}
                </div>

                ${currentItem ? `
                    <div class="comparison-vs">VS</div>
                    <div class="comparison-item current-item">
                        <div class="item-header">
                            <span class="item-name">${currentItem.name || currentItemId}</span>
                            <span class="item-rarity rarity-${(currentItem.rarity || 'common').toLowerCase()}">${currentItem.rarity || 'Common'}</span>
                            <span class="equipped-label">(Equipped)</span>
                        </div>
                        <div class="item-stats">
                            ${this.formatItemStats(currentStats, 'current')}
                        </div>
                    </div>
                ` : `
                    <div class="comparison-vs">VS</div>
                    <div class="comparison-item current-item empty">
                        <div class="item-header">
                            <span class="item-name">No ${newItem.type} equipped</span>
                        </div>
                        <div class="empty-slot-message">Equipping this item will provide new bonuses</div>
                    </div>
                `}
            </div>

            <div class="stat-changes">
                <div class="changes-title">Stat Changes:</div>
                ${this.formatStatChanges(statComparison)}
            </div>

            <div class="tooltip-footer">
                <div class="upgrade-recommendation">
                    ${this.getUpgradeRecommendation(statComparison, newItem, currentItem)}
                </div>
            </div>
        `;
    }

    /**
     * Get item stats for comparison
     */
    getItemStats(item) {
        if (!item) return {};

        return {
            attack: item.stats?.attack || item.attack || 0,
            defense: item.stats?.defense || item.defense || 0,
            magic: item.stats?.magic || item.magic || 0,
            speed: item.stats?.speed || item.speed || 0,
            hp: item.stats?.hp || item.hp || 0,
            mana: item.stats?.mana || item.mana || 0
        };
    }

    /**
     * Compare stats between new and current items
     */
    compareStats(newStats, currentStats) {
        const comparison = {};
        const statKeys = ['attack', 'defense', 'magic', 'speed', 'hp', 'mana'];

        statKeys.forEach(stat => {
            const newValue = newStats[stat] || 0;
            const currentValue = currentStats[stat] || 0;
            const difference = newValue - currentValue;

            if (difference !== 0) {
                comparison[stat] = {
                    new: newValue,
                    current: currentValue,
                    difference: difference,
                    isImprovement: difference > 0
                };
            }
        });

        return comparison;
    }

    /**
     * Format item stats for display
     */
    formatItemStats(stats, itemType) {
        const statLabels = {
            attack: 'Attack',
            defense: 'Defense',
            magic: 'Magic',
            speed: 'Speed',
            hp: 'HP',
            mana: 'Mana'
        };

        const formattedStats = Object.entries(stats)
            .filter(([_, value]) => value > 0)
            .map(([stat, value]) => {
                return `<div class="stat-line">
                    <span class="stat-name">${statLabels[stat] || stat}:</span>
                    <span class="stat-value ${itemType}">${value}</span>
                </div>`;
            })
            .join('');

        return formattedStats || '<div class="stat-line">No stat bonuses</div>';
    }

    /**
     * Format stat changes for comparison
     */
    formatStatChanges(statComparison) {
        if (Object.keys(statComparison).length === 0) {
            return '<div class="no-changes">No stat changes</div>';
        }

        const changes = Object.entries(statComparison)
            .map(([stat, data]) => {
                const icon = data.isImprovement ? '▲' : '▼';
                const className = data.isImprovement ? 'improvement' : 'downgrade';
                const sign = data.difference > 0 ? '+' : '';

                return `<div class="stat-change ${className}">
                    <span class="change-icon">${icon}</span>
                    <span class="stat-name">${stat.charAt(0).toUpperCase() + stat.slice(1)}:</span>
                    <span class="change-value">${sign}${data.difference}</span>
                </div>`;
            })
            .join('');

        return changes;
    }

    /**
     * Generate upgrade recommendation
     */
    getUpgradeRecommendation(statComparison, newItem, currentItem) {
        if (!currentItem) {
            return '<span class="recommendation upgrade">🔺 Recommended: Provides stat bonuses</span>';
        }

        const improvements = Object.values(statComparison).filter(change => change.isImprovement).length;
        const downgrades = Object.values(statComparison).filter(change => !change.isImprovement).length;

        if (improvements > downgrades) {
            return '<span class="recommendation upgrade">🔺 Recommended: Overall stat improvement</span>';
        } else if (downgrades > improvements) {
            return '<span class="recommendation downgrade">🔻 Consider carefully: Some stats will decrease</span>';
        } else if (improvements === downgrades && improvements > 0) {
            return '<span class="recommendation mixed">⚖️ Mixed: Balanced trade-offs in stats</span>';
        } else {
            return '<span class="recommendation neutral">➖ Equivalent: Similar stat distribution</span>';
        }
    }

    /**
     * Position tooltip relative to mouse cursor
     */
    positionTooltip(tooltip, event) {
        if (!tooltip) return;

        const mouseX = event.clientX;
        const mouseY = event.clientY;
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Default position: right and below cursor
        let x = mouseX + 15;
        let y = mouseY + 15;

        // Adjust if tooltip would go off-screen horizontally
        if (x + tooltipRect.width > viewportWidth) {
            x = mouseX - tooltipRect.width - 15;
        }

        // Adjust if tooltip would go off-screen vertically
        if (y + tooltipRect.height > viewportHeight) {
            y = mouseY - tooltipRect.height - 15;
        }

        // Ensure tooltip doesn't go off the left or top edges
        x = Math.max(5, x);
        y = Math.max(5, y);

        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
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
