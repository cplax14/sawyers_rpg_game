/**
 * UI Module Template
 * 
 * This is a template/example for creating new UI modules.
 * Copy this file and rename it to your module name (e.g., ExampleUI.js)
 * 
 * Instructions:
 * 1. Replace "ModuleTemplate" with your module name (e.g., "ExampleUI")
 * 2. Update the constructor name and super() call
 * 3. Implement the required methods for your specific functionality
 * 4. Update element IDs and event handlers to match your UI
 * 5. Remove this header comment and unused methods
 */

class ModuleTemplate extends BaseUIModule {
    constructor(uiManager, options = {}) {
        // Call parent constructor with module name
        super('moduleTemplate', uiManager, options);
        
        // Module-specific properties
        this.currentTab = 'default';
        this.selectedItem = null;
        this.filters = {
            type: 'all',
            category: null
        };
    }

    /**
     * Override default options for this module
     */
    getDefaultOptions() {
        return {
            ...super.getDefaultOptions(),
            // Module-specific default options
            autoRefresh: true,
            defaultTab: 'default',
            enableFilters: true,
            maxItems: 50
        };
    }

    /**
     * Cache DOM elements used by this module
     * Override this method to cache your specific elements
     */
    cacheElements() {
        // Define required elements for this module
        const requiredElements = [
            'module-template-container',
            'module-template-tabs',
            'module-template-content'
        ];

        // Cache elements
        this.elements = {
            container: document.getElementById('module-template-container'),
            tabs: document.getElementById('module-template-tabs'),
            content: document.getElementById('module-template-content'),
            
            // Tab buttons (if using tabs)
            tabButtons: document.querySelectorAll('.module-template-tab-btn'),
            
            // Common UI elements
            searchInput: document.getElementById('module-template-search'),
            filterSelect: document.getElementById('module-template-filter'),
            itemsList: document.getElementById('module-template-items'),
            
            // Action buttons
            primaryButton: document.getElementById('module-template-primary-btn'),
            secondaryButton: document.getElementById('module-template-secondary-btn'),
            backButton: document.getElementById('module-template-back-btn'),
            
            // Modals (if used)
            modal: document.getElementById('module-template-modal'),
            modalCloseBtn: document.getElementById('module-template-modal-close')
        };

        // Validate that required elements exist
        this.validateElements(requiredElements);
    }

    /**
     * Attach event listeners for this module
     * Override this method to attach your specific event handlers
     */
    attachEvents() {
        // Tab switching (if using tabs)
        if (this.elements.tabButtons) {
            this.elements.tabButtons.forEach(button => {
                this.addEventListener(button, 'click', (e) => {
                    const tabName = e.target.dataset.tab;
                    this.switchTab(tabName);
                });
            });
        }

        // Search functionality
        if (this.elements.searchInput) {
            this.addEventListener(this.elements.searchInput, 'input', (e) => {
                this.handleSearch(e.target.value);
            });
        }

        // Filter functionality
        if (this.elements.filterSelect) {
            this.addEventListener(this.elements.filterSelect, 'change', (e) => {
                this.handleFilterChange(e.target.value);
            });
        }

        // Action buttons
        if (this.elements.primaryButton) {
            this.addEventListener(this.elements.primaryButton, 'click', () => {
                this.handlePrimaryAction();
            });
        }

        if (this.elements.secondaryButton) {
            this.addEventListener(this.elements.secondaryButton, 'click', () => {
                this.handleSecondaryAction();
            });
        }

        if (this.elements.backButton) {
            this.addEventListener(this.elements.backButton, 'click', () => {
                this.handleBackAction();
            });
        }

        // Modal events (if using modals)
        if (this.elements.modal && this.elements.modalCloseBtn) {
            this.addEventListener(this.elements.modalCloseBtn, 'click', () => {
                this.hideModal();
            });
            
            // Close modal on backdrop click
            this.addEventListener(this.elements.modal, 'click', (e) => {
                if (e.target === this.elements.modal) {
                    this.hideModal();
                }
            });
        }

        // Keyboard shortcuts
        this.addEventListener(document, 'keydown', (e) => {
            this.handleKeyDown(e);
        });

        // Listen for other module events
        this.on('gameStateChanged', (data) => {
            this.handleGameStateChange(data);
        });
    }

    /**
     * Set up initial state for the module
     * Override this method to set up your module's initial state
     */
    setupState() {
        this.state = {
            // UI state
            currentTab: this.options.defaultTab,
            selectedItem: null,
            isLoading: false,
            
            // Data state
            items: [],
            filteredItems: [],
            searchQuery: '',
            
            // Filter state
            filters: {
                type: 'all',
                category: null,
                sortBy: 'name',
                sortOrder: 'asc'
            },
            
            // Pagination (if needed)
            pagination: {
                currentPage: 1,
                itemsPerPage: 20,
                totalItems: 0
            }
        };
    }

    /**
     * Called when module is shown
     * Override this method for show-specific logic
     */
    onShow(data) {
        // Update container visibility
        if (this.elements.container) {
            this.elements.container.classList.remove('hidden');
        }

        // Refresh data when shown
        this.refreshData();
        
        // Focus on search input if available
        if (this.elements.searchInput) {
            this.elements.searchInput.focus();
        }

        // Handle any data passed to the module
        if (data) {
            this.handleShowData(data);
        }
    }

    /**
     * Called when module is hidden
     * Override this method for hide-specific logic
     */
    onHide() {
        // Hide container
        if (this.elements.container) {
            this.elements.container.classList.add('hidden');
        }

        // Hide any open modals
        this.hideModal();
        
        // Clear temporary selections
        this.clearSelection();
        
        // Save any pending state
        this.savePendingState();
    }

    /**
     * Called during update cycle
     * Override this method for update logic
     */
    onUpdate(deltaTime) {
        // Update animations or time-sensitive UI elements
        if (this.state.isLoading) {
            this.updateLoadingAnimation();
        }
        
        // Update any real-time data displays
        this.updateRealTimeElements();
    }

    /**
     * Called during cleanup
     * Override this method for cleanup-specific logic
     */
    onCleanup() {
        // Clear any intervals or timeouts
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Clear any cached data
        this.state.items = [];
        this.state.filteredItems = [];
    }

    // ===================================
    // MODULE-SPECIFIC METHODS
    // Implement these methods for your module's functionality
    // ===================================

    /**
     * Switch to a different tab
     */
    switchTab(tabName) {
        if (this.state.currentTab === tabName) return;

        // Update state
        this.state.currentTab = tabName;

        // Update UI
        this.updateTabUI();
        
        // Load tab-specific data
        this.loadTabData(tabName);

        console.log(`📂 Switched to tab: ${tabName}`);
    }

    /**
     * Update tab UI appearance
     */
    updateTabUI() {
        if (!this.elements.tabButtons) return;

        this.elements.tabButtons.forEach(button => {
            const isActive = button.dataset.tab === this.state.currentTab;
            button.classList.toggle('active', isActive);
        });
    }

    /**
     * Handle search input
     */
    handleSearch(query) {
        this.state.searchQuery = query.toLowerCase();
        this.applyFilters();
    }

    /**
     * Handle filter changes
     */
    handleFilterChange(filterValue) {
        this.state.filters.type = filterValue;
        this.applyFilters();
    }

    /**
     * Apply current filters to items
     */
    applyFilters() {
        let filtered = [...this.state.items];

        // Apply search filter
        if (this.state.searchQuery) {
            filtered = filtered.filter(item => 
                item.name.toLowerCase().includes(this.state.searchQuery) ||
                item.description?.toLowerCase().includes(this.state.searchQuery)
            );
        }

        // Apply type filter
        if (this.state.filters.type !== 'all') {
            filtered = filtered.filter(item => item.type === this.state.filters.type);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const field = this.state.filters.sortBy;
            const order = this.state.filters.sortOrder === 'asc' ? 1 : -1;
            
            if (a[field] < b[field]) return -1 * order;
            if (a[field] > b[field]) return 1 * order;
            return 0;
        });

        this.state.filteredItems = filtered;
        this.renderItems();
    }

    /**
     * Render items to the UI
     */
    renderItems() {
        if (!this.elements.itemsList) return;

        const fragment = document.createDocumentFragment();

        this.state.filteredItems.forEach(item => {
            const itemElement = this.createItemElement(item);
            fragment.appendChild(itemElement);
        });

        this.elements.itemsList.innerHTML = '';
        this.elements.itemsList.appendChild(fragment);
    }

    /**
     * Create an item element
     */
    createItemElement(item) {
        const element = document.createElement('div');
        element.className = 'module-template-item';
        element.dataset.itemId = item.id;

        element.innerHTML = `
            <div class="item-icon">${item.icon || '📄'}</div>
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-description">${item.description || ''}</div>
            </div>
            <div class="item-actions">
                <button class="btn small primary" data-action="select">Select</button>
                <button class="btn small secondary" data-action="details">Details</button>
            </div>
        `;

        // Attach item-specific events
        this.addEventListener(element, 'click', (e) => {
            if (e.target.dataset.action === 'select') {
                this.selectItem(item);
            } else if (e.target.dataset.action === 'details') {
                this.showItemDetails(item);
            }
        });

        return element;
    }

    /**
     * Handle item selection
     */
    selectItem(item) {
        this.state.selectedItem = item;
        this.updateSelectionUI();
        this.emit('itemSelected', { module: this.name, item });
    }

    /**
     * Update selection UI
     */
    updateSelectionUI() {
        // Update selected item styling
        const itemElements = this.elements.itemsList?.querySelectorAll('.module-template-item');
        itemElements?.forEach(el => {
            const isSelected = el.dataset.itemId === this.state.selectedItem?.id;
            el.classList.toggle('selected', isSelected);
        });
    }

    /**
     * Show item details modal
     */
    showItemDetails(item) {
        if (!this.elements.modal) return;

        // Populate modal with item data
        this.populateModal(item);
        
        // Show modal
        this.elements.modal.classList.remove('hidden');
    }

    /**
     * Hide modal
     */
    hideModal() {
        if (this.elements.modal) {
            this.elements.modal.classList.add('hidden');
        }
    }

    /**
     * Populate modal with data
     */
    populateModal(item) {
        // Override this method to populate your specific modal content
        console.log('Showing details for:', item);
    }

    /**
     * Handle primary action
     */
    handlePrimaryAction() {
        // Override this method for your primary action
        console.log('Primary action triggered');
    }

    /**
     * Handle secondary action
     */
    handleSecondaryAction() {
        // Override this method for your secondary action
        console.log('Secondary action triggered');
    }

    /**
     * Handle back action
     */
    handleBackAction() {
        // Override this method for back navigation
        this.uiManager?.goBack();
    }

    /**
     * Handle keyboard input
     */
    handleKeyDown(e) {
        if (!this.isVisible) return;

        switch (e.key) {
            case 'Escape':
                this.hideModal();
                break;
            case 'Enter':
                if (this.state.selectedItem) {
                    this.handlePrimaryAction();
                }
                break;
            // Add more keyboard shortcuts as needed
        }
    }

    /**
     * Handle game state changes
     */
    handleGameStateChange(data) {
        // Override this method to respond to game state changes
        if (this.isVisible) {
            this.refreshData();
        }
    }

    /**
     * Handle data passed when showing the module
     */
    handleShowData(data) {
        // Override this method to handle specific data
        if (data.selectedTab) {
            this.switchTab(data.selectedTab);
        }
        
        if (data.selectedItem) {
            this.selectItem(data.selectedItem);
        }
    }

    /**
     * Refresh module data
     */
    refreshData() {
        this.state.isLoading = true;
        
        // Load your module's data here
        this.loadData()
            .then(data => {
                this.state.items = data;
                this.applyFilters();
                this.state.isLoading = false;
            })
            .catch(error => {
                console.error(`Error loading ${this.name} data:`, error);
                this.showNotification('Failed to load data', 'error');
                this.state.isLoading = false;
            });
    }

    /**
     * Load data for this module
     */
    async loadData() {
        // Override this method to load your specific data
        // This is just an example
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { id: 1, name: 'Example Item 1', type: 'example', icon: '📄' },
                    { id: 2, name: 'Example Item 2', type: 'example', icon: '📋' }
                ]);
            }, 100);
        });
    }

    /**
     * Load data specific to a tab
     */
    loadTabData(tabName) {
        // Override this method to load tab-specific data
        console.log(`Loading data for tab: ${tabName}`);
    }

    /**
     * Clear current selection
     */
    clearSelection() {
        this.state.selectedItem = null;
        this.updateSelectionUI();
    }

    /**
     * Save any pending state
     */
    savePendingState() {
        // Override this method to save any important state
        // before the module is hidden or cleaned up
    }

    /**
     * Update loading animation
     */
    updateLoadingAnimation() {
        // Override this method to update loading indicators
    }

    /**
     * Update real-time elements
     */
    updateRealTimeElements() {
        // Override this method to update elements that need real-time updates
    }

    // ===================================
    // UTILITY METHODS
    // Helper methods for common operations
    // ===================================

    /**
     * Format number with appropriate units
     */
    formatNumber(value) {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        }
        if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        }
        return value.toString();
    }

    /**
     * Debounce function calls
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Get current game state safely
     */
    getGameStateSafe() {
        try {
            return this.getGameState();
        } catch (error) {
            console.warn(`Failed to get game state in ${this.name}:`, error);
            return null;
        }
    }
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModuleTemplate;
} else if (typeof window !== 'undefined') {
    window.ModuleTemplate = ModuleTemplate;
}