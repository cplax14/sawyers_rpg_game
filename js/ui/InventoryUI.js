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
