/**
 * Monster UI Module
 * Handles monster management, breeding, storage, and party interfaces
 * Extracted from original ui.js lines ~2077-2400 and related functions
 */

class MonsterUI extends BaseUIModule {
    constructor(uiManager, options = {}) {
        super('MonsterUI', uiManager, {
            scenes: ['monster_management'],
            dependencies: ['UIHelpers'],
            ...options
        });
        
        // Monster management state
        this.selectedTab = 'party';
        this.selectedMonsters = new Set();
        this.breedingParents = { parent1: null, parent2: null };
        this.currentModalMonster = null;
        
        console.log('✅ MonsterUI initialized');
    }

    /**
     * Initialize the monster UI module
     */
    async init() {
        await super.init();
        
        // Get references to dependencies
        this.gameState = this.getGameReference('gameState');
        this.notificationManager = this.uiManager.notificationManager;
        
        console.log('👾 MonsterUI initialization completed');
        return true;
    }

    /**
     * Attach event listeners for monster functionality
     */
    attachEvents() {
        super.attachEvents();
        
        // Attach monster management interface
        this.attachMonsterManagement();
        
        console.log('🔗 MonsterUI events attached');
    }

    /**
     * Safely get the current game state (works in tests and runtime)
     */
    getGS() {
        if (this.gameState) return this.gameState;
        // Prefer UIManager-provided reference (used by unit tests' mock)
        if (this.uiManager && typeof this.uiManager.getGameReference === 'function') {
            const gs = this.uiManager.getGameReference('gameState');
            if (gs) return gs;
        }
        // Fallback: if this module implements getGameReference itself
        if (typeof this.getGameReference === 'function') {
            const gs2 = this.getGameReference('gameState');
            if (gs2) return gs2;
        }
        return (typeof window !== 'undefined' && window.GameState) ? window.GameState : null;
    }

    /**
     * Attach button click handler with compatibility for validators
     */
    attachButton(buttonId, callback) {
        // Delegate to BaseUIModule helper for unified behavior
        const ok = super.attachButton(buttonId, callback);
        if (!ok && this.uiManager?.config?.debugMode) {
            console.warn(`[MonsterUI] attachButton fallback failed for #${buttonId}`);
        }
    }

    /**
     * Show the monster UI
     */
    show(sceneName = 'monster_management') {
        super.show();
        
        // Initialize default tab
        this.switchMonsterTab(this.selectedTab || 'party');
        
        console.log(`👾 MonsterUI showing scene: ${sceneName}`);
    }

    /**
     * Hide the monster UI
     */
    hide() {
        // Close any open modals
        this.closeMonsterModal();
        
        super.hide();
        console.log('👋 MonsterUI hidden');
    }

    // ================================================
    // MONSTER MANAGEMENT INTERFACE
    // ================================================

    /**
     * Attach monster management interface event handlers
     * Extracted from original ui.js attachMonsterManagement method (lines 2456-2503)
     */
    attachMonsterManagement() {
        // Initialize tab system
        this.selectedTab = 'party';
        this.selectedMonsters = new Set();
        this.breedingParents = { parent1: null, parent2: null };
        
        // Tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;
                this.switchMonsterTab(tabName);
            });
        });
        
        // Party actions
        this.attachButton('heal-all-btn', () => this.healAllPartyMonsters());
        this.attachButton('auto-arrange-btn', () => this.autoArrangeParty());
        
        // Storage actions
        this.attachButton('release-selected-btn', () => this.releaseSelectedMonsters());
        this.attachButton('sort-storage-btn', () => this.sortStorage());
        
        // Storage filters
        const typeFilter = document.getElementById('type-filter');
        const rarityFilter = document.getElementById('rarity-filter');
        if (typeFilter) typeFilter.addEventListener('change', () => this.filterStorage());
        if (rarityFilter) rarityFilter.addEventListener('change', () => this.filterStorage());
        
        // Breeding actions
        this.attachButton('start-breeding-btn', () => this.startBreeding());
        this.attachButton('clear-breeding-btn', () => this.clearBreedingSelection());
        
        // Modal controls
        this.attachButton('monster-modal-close', () => this.closeMonsterModal());
        this.attachButton('modal-add-to-party', () => this.addMonsterToParty());
        this.attachButton('modal-remove-from-party', () => this.removeMonsterFromParty());
        this.attachButton('modal-release-monster', () => this.releaseMonster());
        
        // Navigation
        this.attachButton('back-from-monsters', () => this.returnToPrevious());
        
        // Modal backdrop click
        const modalBackdrop = document.querySelector('.modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => this.closeMonsterModal());
        }
    }

    // ================================================
    // TAB MANAGEMENT
    // ================================================

    /**
     * Switch between monster management tabs
     * Extracted from original ui.js switchMonsterTab method (lines 2508-2533)
     */
    switchMonsterTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });
        
        this.selectedTab = tabName;
        
        // Refresh content based on tab
        switch(tabName) {
            case 'party':
                this.refreshPartyDisplay();
                break;
            case 'storage':
                this.refreshStorageDisplay();
                break;
            case 'breeding':
                this.refreshBreedingDisplay();
                break;
        }
    }

    // ================================================
    // PARTY MANAGEMENT
    // ================================================

    /**
     * Refresh party display
     * Extracted from original ui.js refreshPartyDisplay method (lines 2538-2582)
     */
    refreshPartyDisplay() {
        const partyGrid = document.getElementById('party-grid');
        const partySizeEl = document.getElementById('party-size');
        
        if (!partyGrid || !window.GameState) return;
        
        const party = window.GameState.monsters?.party || [];
        const maxPartySize = 3;
        
        // Update party size display
        if (partySizeEl) partySizeEl.textContent = party.length;
        
        // Clear and rebuild party grid
        partyGrid.innerHTML = '';
        
        for (let i = 0; i < maxPartySize; i++) {
            const monster = party[i];
            const slot = document.createElement('div');
            slot.className = `party-slot ${monster ? 'filled' : 'empty'}`;
            slot.dataset.slot = i;
            
            if (monster) {
                // Calculate effective stats for display
                const effectiveStats = this.calculateEffectiveStats(monster);
                const currentHP = monster.currentStats?.hp || monster.stats?.hp || 0;
                const currentMP = monster.currentStats?.mp || monster.stats?.mp || 0;
                
                slot.innerHTML = `
                    <div class="monster-card-icon">${this.getMonsterIcon(monster.species)}</div>
                    <div class="monster-card-name">${monster.nickname || monster.speciesData?.name || monster.species}</div>
                    <div class="monster-card-level">Lv. ${monster.level}</div>
                    <div class="monster-card-stats enhanced">
                        <div class="stat-bar">
                            <span class="stat-label">HP:</span>
                            <span class="stat-value">${currentHP}/${effectiveStats.hp}</span>
                        </div>
                        <div class="stat-bar">
                            <span class="stat-label">MP:</span>
                            <span class="stat-value">${currentMP}/${effectiveStats.mp}</span>
                        </div>
                        <div class="stat-summary">
                            <span title="Attack">⚔️${effectiveStats.attack}</span>
                            <span title="Defense">🛡️${effectiveStats.defense}</span>
                            <span title="Speed">💨${effectiveStats.speed}</span>
                        </div>
                    </div>
                `;
                slot.addEventListener('click', () => this.showMonsterDetails(monster));
            } else {
                slot.innerHTML = `
                    <div class="empty-slot-content">
                        <span class="empty-icon">➕</span>
                        <span class="empty-text">Empty Slot</span>
                    </div>
                `;
                slot.addEventListener('click', () => this.showMonsterSelection(i));
            }
            
            partyGrid.appendChild(slot);
        }
    }

    /**
     * Heal all party monsters
     * Extracted from original ui.js healAllPartyMonsters method (lines 3847-3870)
     */
    healAllPartyMonsters() {
        if (!window.GameState?.monsters?.party) return;
        
        let healedCount = 0;
        window.GameState.monsters.party.forEach(monster => {
            if (monster && monster.currentStats) {
                const hpRestored = monster.stats.hp - monster.currentStats.hp;
                const mpRestored = monster.stats.mp - monster.currentStats.mp;
                
                if (hpRestored > 0 || mpRestored > 0) {
                    monster.currentStats.hp = monster.stats.hp;
                    monster.currentStats.mp = monster.stats.mp;
                    healedCount++;
                }
            }
        });
        
        if (healedCount > 0) {
            this.refreshPartyDisplay();
            this.showNotification(`Healed ${healedCount} monster(s)`, 'success');
        } else {
            this.showNotification('All monsters are already at full health', 'info');
        }
    }

    /**
     * Auto-arrange party by level
     * Extracted from original ui.js autoArrangeParty method (lines 3875-3889)
     */
    autoArrangeParty() {
        if (!window.GameState?.monsters?.party) return;
        
        const monsters = window.GameState.monsters.party.filter(m => m !== null);
        monsters.sort((a, b) => (b.level || 1) - (a.level || 1));
        
        // Clear and refill party
        window.GameState.monsters.party = [];
        for (let i = 0; i < 3; i++) {
            window.GameState.monsters.party[i] = monsters[i] || null;
        }
        
        this.refreshPartyDisplay();
        this.showNotification('Party arranged by level', 'success');
    }

    // ================================================
    // STORAGE MANAGEMENT
    // ================================================

    /**
     * Refresh storage display
     * Extracted from original ui.js refreshStorageDisplay method (lines 2587-2616)
     */
    refreshStorageDisplay() {
        const storageGrid = document.getElementById('storage-grid');
        const totalMonstersEl = document.getElementById('total-monsters');
        
        if (!storageGrid || !window.GameState) return;
        
        const storage = window.GameState.monsters?.storage || [];
        
        // Update total count
        if (totalMonstersEl) totalMonstersEl.textContent = storage.length;
        
        // Apply filters
        const filteredMonsters = this.getFilteredMonsters(storage);
        
        // Clear and rebuild storage grid
        storageGrid.innerHTML = '';
        
        if (filteredMonsters.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'no-monsters';
            emptyMessage.innerHTML = '<p>No monsters found matching the current filters.</p>';
            storageGrid.appendChild(emptyMessage);
            return;
        }
        
        filteredMonsters.forEach(monster => {
            const card = this.createMonsterCard(monster);
            storageGrid.appendChild(card);
        });
    }

    /**
     * Create a monster card element
     * Extracted from original ui.js createMonsterCard method (lines 2621-2654)
     */
    createMonsterCard(monster) {
        const card = document.createElement('div');
        card.className = 'monster-card';
        card.dataset.monsterId = monster.id;
        
        const types = monster.speciesData?.type || ['unknown'];
        const typesBadges = types.map(type => 
            `<span class="type-badge">${type}</span>`
        ).join('');
        
        // Calculate effective stats for better display
        const effectiveStats = this.calculateEffectiveStats(monster);
        
        // Show abilities preview
        const abilities = monster.abilities || [];
        const abilityPreview = abilities.length > 0 
            ? `<div class="ability-preview">
                 ${abilities.slice(0, 2).map(ability => {
                    const details = this.getAbilityDetails(ability);
                    return `<span class="ability-mini ${details.rarity.toLowerCase()}" title="${ability}: ${details.description}">${ability.substring(0, 3)}</span>`;
                 }).join('')}
                 ${abilities.length > 2 ? `<span class="ability-more" title="${abilities.length - 2} more abilities">+${abilities.length - 2}</span>` : ''}
               </div>`
            : '<div class="ability-preview"><span class="no-abilities-mini">No Abilities</span></div>';
        
        card.innerHTML = `
            <div class="monster-card-header">
                <div class="monster-card-icon">${this.getMonsterIcon(monster.species)}</div>
                <div class="monster-card-info">
                    <div class="monster-card-name">${monster.nickname || monster.speciesData?.name || monster.species}</div>
                    <div class="monster-card-level">Lv. ${monster.level}</div>
                </div>
            </div>
            <div class="monster-card-type">${typesBadges}</div>
            <div class="monster-card-stats enhanced">
                <div class="stat-group">
                    <span class="stat-item" title="Health">❤️ ${effectiveStats.hp}</span>
                    <span class="stat-item" title="Attack">⚔️ ${effectiveStats.attack}</span>
                </div>
                <div class="stat-group">
                    <span class="stat-item" title="Defense">🛡️ ${effectiveStats.defense}</span>
                    <span class="stat-item" title="Speed">💨 ${effectiveStats.speed}</span>
                </div>
            </div>
            ${abilityPreview}
            ${monster.personality ? `<div class="personality-badge">${monster.personality}</div>` : ''}
        `;
        
        // Event handlers
        card.addEventListener('click', (e) => {
            if (e.shiftKey) {
                this.toggleMonsterSelection(monster.id, card);
            } else {
                this.showMonsterDetails(monster);
            }
        });
        
        return card;
    }

    /**
     * Apply storage filters
     * Extracted from original ui.js getFilteredMonsters method (lines 2766-2786)
     */
    getFilteredMonsters(monsters) {
        const typeFilter = document.getElementById('type-filter')?.value || '';
        const rarityFilter = document.getElementById('rarity-filter')?.value || '';
        
        return monsters.filter(monster => {
            const speciesData = monster.speciesData;
            if (!speciesData) return true;
            
            // Type filter
            if (typeFilter && !speciesData.type?.includes(typeFilter)) {
                return false;
            }
            
            // Rarity filter
            if (rarityFilter && speciesData.rarity !== rarityFilter) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Filter storage display
     * Extracted from original ui.js filterStorage method (lines 2791-2793)
     */
    filterStorage() {
        this.refreshStorageDisplay();
    }

    /**
     * Toggle monster selection for batch operations
     * Extracted from original ui.js toggleMonsterSelection method (lines 2798-2812)
     */
    toggleMonsterSelection(monsterId, cardElement) {
        if (this.selectedMonsters.has(monsterId)) {
            this.selectedMonsters.delete(monsterId);
            cardElement.classList.remove('selected');
        } else {
            this.selectedMonsters.add(monsterId);
            cardElement.classList.add('selected');
        }
        
        // Update action button states
        const releaseBtn = document.getElementById('release-selected-btn');
        if (releaseBtn) {
            releaseBtn.disabled = this.selectedMonsters.size === 0;
        }
    }

    /**
     * Release selected monsters
     * Extracted from original ui.js releaseSelectedMonsters method (lines 3894-3912)
     */
    releaseSelectedMonsters() {
        if (!window.GameState?.monsters || this.selectedMonsters.size === 0) return;
        
        const confirmed = confirm(`Are you sure you want to release ${this.selectedMonsters.size} monster(s)? This action cannot be undone.`);
        if (!confirmed) return;
        
        let releasedCount = 0;
        this.selectedMonsters.forEach(monsterId => {
            const index = window.GameState.monsters.storage.findIndex(m => m.id === monsterId);
            if (index !== -1) {
                window.GameState.monsters.storage.splice(index, 1);
                releasedCount++;
            }
        });
        
        this.selectedMonsters.clear();
        this.refreshStorageDisplay();
        this.showNotification(`Released ${releasedCount} monster(s)`, 'success');
    }

    /**
     * Sort storage by level
     * Extracted from original ui.js sortStorage method (lines 3917-3923)
     */
    sortStorage() {
        if (!window.GameState?.monsters?.storage) return;
        
        window.GameState.monsters.storage.sort((a, b) => (b.level || 1) - (a.level || 1));
        this.refreshStorageDisplay();
        this.showNotification('Storage sorted by level', 'success');
    }

    // ================================================
    // BREEDING SYSTEM
    // ================================================

    /**
     * Refresh breeding display
     * Extracted from original ui.js refreshBreedingDisplay method (lines 2817-2821)
     */
    refreshBreedingDisplay() {
        this.updateBreedingSlots();
        this.updateBreedingCompatibility();
        this.updateBreedingHistory();
    }

    /**
     * Update breeding slots display
     * Extracted from original ui.js updateBreedingSlots method (lines 2826-2852)
     */
    updateBreedingSlots() {
        ['1', '2'].forEach(slotNum => {
            const slot = document.querySelector(`[data-slot="${slotNum}"]`);
            const parent = this.breedingParents[`parent${slotNum}`];
            
            if (!slot) return;
            
            if (parent) {
                slot.className = 'breeding-monster-slot filled';
                slot.innerHTML = `
                    <div class="monster-card-icon">${this.getMonsterIcon(parent.species)}</div>
                    <div class="monster-card-name">${parent.nickname || parent.speciesData?.name || parent.species}</div>
                    <div class="monster-card-level">Lv. ${parent.level}</div>
                `;
                slot.addEventListener('click', () => this.clearBreedingSlot(slotNum));
            } else {
                slot.className = 'breeding-monster-slot empty';
                slot.innerHTML = `
                    <div class="empty-slot-content">
                        <span class="empty-icon">➕</span>
                        <span class="empty-text">Select Monster</span>
                    </div>
                `;
                slot.addEventListener('click', () => this.selectBreedingParent(slotNum));
            }
        });
    }

    /**
     * Update breeding compatibility display
     * Extracted from original ui.js updateBreedingCompatibility method (lines 2857-2895)
     */
    updateBreedingCompatibility() {
        const statusEl = document.getElementById('compatibility-status');
        const offspringEl = document.getElementById('offspring-list');
        const startBtn = document.getElementById('start-breeding-btn');
        
        const { parent1, parent2 } = this.breedingParents;
        
        if (!parent1 || !parent2) {
            if (statusEl) statusEl.textContent = 'Select two monsters to check compatibility';
            if (offspringEl) offspringEl.textContent = 'Select compatible monsters to see possible outcomes';
            if (startBtn) startBtn.disabled = true;
            return;
        }
        
        // Check compatibility using breeding system
        if (window.MonsterBreedingSystem) {
            const compatibility = window.MonsterBreedingSystem.checkCompatibility(parent1, parent2);
            
            if (statusEl) {
                statusEl.textContent = compatibility.compatible 
                    ? '✅ Compatible - These monsters can breed!'
                    : '❌ Incompatible - These monsters cannot breed together';
                statusEl.style.color = compatibility.compatible ? '#4CAF50' : '#f44336';
            }
            
            if (offspringEl && compatibility.compatible) {
                const outcomes = window.MonsterBreedingSystem.getPossibleOutcomes(parent1, parent2);
                offspringEl.innerHTML = outcomes.map(outcome => 
                    `<div class="offspring-option">
                        ${this.getMonsterIcon(outcome.species)} ${outcome.species} (${Math.round(outcome.probability * 100)}%)
                    </div>`
                ).join('');
            }
            
            if (startBtn) {
                startBtn.disabled = !compatibility.compatible;
            }
        }
    }

    /**
     * Update breeding history display
     * Extracted from original ui.js updateBreedingHistory method (lines 2900-2916)
     */
    updateBreedingHistory() {
        const historyEl = document.getElementById('breeding-history-list');
        if (!historyEl || !window.GameState?.monsters?.breedingHistory) return;
        
        const history = window.GameState.monsters.breedingHistory || [];
        
        if (history.length === 0) {
            historyEl.innerHTML = '<p class="no-history">No breeding history yet</p>';
        } else {
            historyEl.innerHTML = history.slice(-5).reverse().map(record => 
                `<div class="breeding-record">
                    ${this.getMonsterIcon(record.parent1Species)} + ${this.getMonsterIcon(record.parent2Species)} 
                    → ${this.getMonsterIcon(record.offspring)} (${new Date(record.date).toLocaleDateString()})
                </div>`
            ).join('');
        }
    }

    /**
     * Start breeding process
     * Extracted from original ui.js startBreeding method (lines 3928-3948)
     */
    startBreeding() {
        if (!this.breedingParents.parent1 || !this.breedingParents.parent2) {
            this.showNotification('Select two monsters for breeding', 'error');
            return;
        }
        
        if (window.GameState?.breeding) {
            const success = window.GameState.breeding.startBreeding(
                this.breedingParents.parent1,
                this.breedingParents.parent2
            );
            
            if (success) {
                this.showNotification('Breeding started successfully!', 'success');
                this.clearBreedingSelection();
                this.refreshBreedingDisplay();
            } else {
                this.showNotification('Breeding failed - check compatibility and cooldowns', 'error');
            }
        }
    }

    /**
     * Clear breeding selection
     * Extracted from original ui.js clearBreedingSelection method (lines 3953-3960)
     */
    clearBreedingSelection() {
        this.breedingParents = { parent1: null, parent2: null };
        this.updateBreedingSlots();
        this.updateBreedingCompatibility();
        
        const startBtn = document.getElementById('start-breeding-btn');
        if (startBtn) startBtn.disabled = true;
    }

    /**
     * Select breeding parent with enhanced interaction workflow
     * Enhanced for sub-task 6.5
     */
    selectBreedingParent(slotNum) {
        // If slot already has a parent, show options to change or clear
        const currentParent = this.breedingParents[`parent${slotNum}`];
        
        if (currentParent) {
            this.showBreedingParentOptions(slotNum, currentParent);
        } else {
            this.showBreedingParentSelection(slotNum);
        }
    }

    /**
     * Show options for existing breeding parent
     * Enhanced feature for sub-task 6.5
     */
    showBreedingParentOptions(slotNum, currentParent) {
        const options = [
            {
                text: `Keep ${currentParent.nickname || currentParent.species}`,
                action: () => {} // Do nothing, keep current parent
            },
            {
                text: 'Choose Different Monster',
                action: () => this.showBreedingParentSelection(slotNum)
            },
            {
                text: 'Remove from Breeding',
                action: () => this.clearBreedingSlot(slotNum)
            },
            {
                text: 'View Monster Details',
                action: () => this.showMonsterDetails(currentParent)
            }
        ];

        this.showInteractionPrompt(
            'Breeding Parent Options',
            `What would you like to do with ${currentParent.nickname || currentParent.species}?`,
            options
        );
    }

    /**
     * Show breeding parent selection with enhanced workflow
     * Enhanced feature for sub-task 6.5
     */
    showBreedingParentSelection(slotNum) {
        if (!window.GameState?.monsters?.storage) {
            this.showNotification('No monsters in storage for breeding', 'error');
            return;
        }

        // Filter available monsters for breeding
        const availableMonsters = this.getAvailableBreedingMonsters();
        
        if (availableMonsters.length === 0) {
            this.showNotification('No suitable monsters available for breeding', 'warning');
            return;
        }

        // Show breeding-specific selection modal
        this.showBreedingSelectionModal(slotNum, availableMonsters);
    }

    /**
     * Get monsters available for breeding (not in party, not already selected for breeding)
     * Enhanced feature for sub-task 6.5
     */
    getAvailableBreedingMonsters() {
        const gs = this.getGS();
        const storage = gs?.monsters?.storage || [];
        const party = gs?.monsters?.party || [];
        const otherParent = this.breedingParents.parent1 || this.breedingParents.parent2;

        return storage.filter(monster => {
            // Not in party
            if (party.includes(monster)) return false;
            
            // Not the other breeding parent
            if (otherParent && monster.id === otherParent.id) return false;
            
            // Must be at breeding level (e.g., level 5+)
            if (monster.level < 5) return false;
            
            // Must be healthy
            if (monster.currentStats?.hp < monster.stats?.hp * 0.5) return false;
            
            return true;
        });
    }

    /**
     * Show breeding-specific selection modal
     * Enhanced feature for sub-task 6.5
     */
    showBreedingSelectionModal(slotNum, availableMonsters) {
        // Create or get breeding selection modal
        let breedingModal = document.getElementById('breeding-selection-modal');
        
        if (!breedingModal) {
            breedingModal = document.createElement('div');
            breedingModal.id = 'breeding-selection-modal';
            breedingModal.className = 'modal hidden';
            breedingModal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content breeding-selection-content">
                    <header class="modal-header">
                        <h3>Select Breeding Partner</h3>
                        <button class="modal-close" id="breeding-modal-close">✕</button>
                    </header>
                    <div class="modal-body">
                        <div class="breeding-info">
                            <div class="info-text">
                                <p>Choose a monster for breeding slot ${slotNum}:</p>
                                <div class="breeding-requirements">
                                    <span class="req-item">• Must be Level 5+</span>
                                    <span class="req-item">• Must have 50%+ HP</span>
                                    <span class="req-item">• Cannot be in active party</span>
                                </div>
                            </div>
                            <div class="compatibility-preview" id="compatibility-preview">
                                <!-- Compatibility info will appear here when monster is selected -->
                            </div>
                        </div>
                        <div class="breeding-selection-grid" id="breeding-selection-grid">
                            <!-- Breeding selection cards will be populated here -->
                        </div>
                    </div>
                    <footer class="modal-footer">
                        <button id="breeding-selection-cancel" class="btn secondary">Cancel</button>
                        <button id="confirm-breeding-selection" class="btn primary" disabled>Confirm Selection</button>
                    </footer>
                </div>
            `;
            document.body.appendChild(breedingModal);
            
            // Attach modal events
            const closeBtn = breedingModal.querySelector('#breeding-modal-close');
            const cancelBtn = breedingModal.querySelector('#breeding-selection-cancel');
            const confirmBtn = breedingModal.querySelector('#confirm-breeding-selection');
            const backdrop = breedingModal.querySelector('.modal-backdrop');
            
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeBreedingSelectionModal());
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeBreedingSelectionModal());
            if (confirmBtn) confirmBtn.addEventListener('click', () => this.confirmBreedingSelection());
            if (backdrop) backdrop.addEventListener('click', () => this.closeBreedingSelectionModal());
        }
        
        // Update slot info
        const infoText = breedingModal.querySelector('.info-text p');
        if (infoText) {
            infoText.textContent = `Choose a monster for breeding slot ${slotNum}:`;
        }
        
        // Store current selection context
        this.currentBreedingSlot = slotNum;
        this.selectedBreedingMonster = null;
        
        // Populate breeding selection grid
        this.populateBreedingSelectionGrid(availableMonsters);
        
        // Show modal
        breedingModal.classList.remove('hidden');
    }

    /**
     * Clear breeding slot
     */
    clearBreedingSlot(slotNum) {
        this.breedingParents[`parent${slotNum}`] = null;
        this.updateBreedingSlots();
        this.updateBreedingCompatibility();
    }

    /**
     * Populate breeding selection grid with breeding-focused information
     * Enhanced feature for sub-task 6.5
     */
    populateBreedingSelectionGrid(monsters) {
        const grid = document.getElementById('breeding-selection-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        monsters.forEach(monster => {
            const breedingCard = document.createElement('div');
            breedingCard.className = 'breeding-selection-card';
            breedingCard.dataset.monsterId = monster.id;
            
            // Calculate breeding suitability score
            const suitabilityScore = this.calculateBreedingSuitability(monster);
            const effectiveStats = this.calculateEffectiveStats(monster);
            
            // Check current compatibility if other parent exists
            const otherParent = this.breedingParents.parent1 || this.breedingParents.parent2;
            let compatibilityInfo = '';
            
            if (otherParent) {
                const compatibility = this.checkBreedingCompatibility(monster, otherParent);
                compatibilityInfo = `
                    <div class="compatibility-indicator ${compatibility.compatible ? 'compatible' : 'incompatible'}">
                        ${compatibility.compatible ? '✅ Compatible' : '❌ Incompatible'}
                        <div class="compatibility-reason">${compatibility.reason}</div>
                    </div>
                `;
            }
            
            breedingCard.innerHTML = `
                <div class="breeding-card-header">
                    <div class="monster-icon-large">${this.getMonsterIcon(monster.species)}</div>
                    <div class="breeding-monster-info">
                        <div class="monster-name">${monster.nickname || monster.speciesData?.name || monster.species}</div>
                        <div class="monster-level">Level ${monster.level}</div>
                        <div class="breeding-suitability">
                            <span class="suitability-label">Breeding Quality:</span>
                            <span class="suitability-score ${this.getSuitabilityClass(suitabilityScore)}">${this.getSuitabilityText(suitabilityScore)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="breeding-stats">
                    <div class="stat-grid">
                        <div class="stat-item">❤️ ${effectiveStats.hp}</div>
                        <div class="stat-item">⚔️ ${effectiveStats.attack}</div>
                        <div class="stat-item">🛡️ ${effectiveStats.defense}</div>
                        <div class="stat-item">💨 ${effectiveStats.speed}</div>
                    </div>
                    <div class="breeding-traits">
                        <div class="trait">Personality: ${monster.personality || 'Unknown'}</div>
                        <div class="trait">Abilities: ${(monster.abilities || []).length}</div>
                    </div>
                </div>
                
                ${compatibilityInfo}
                
                <div class="breeding-actions">
                    <button class="btn primary select-breeding-btn" data-monster-id="${monster.id}">
                        Select for Breeding
                    </button>
                    <button class="btn secondary view-breeding-details-btn" data-monster-id="${monster.id}">
                        Details
                    </button>
                </div>
            `;
            
            // Attach selection events
            const selectBtn = breedingCard.querySelector('.select-breeding-btn');
            const detailsBtn = breedingCard.querySelector('.view-breeding-details-btn');
            
            if (selectBtn) {
                selectBtn.addEventListener('click', () => {
                    this.selectedBreedingMonster = monster;
                    this.updateBreedingSelection(breedingCard);
                });
            }
            
            if (detailsBtn) {
                detailsBtn.addEventListener('click', () => {
                    this.showMonsterDetails(monster);
                });
            }
            
            grid.appendChild(breedingCard);
        });
    }

    /**
     * Calculate breeding suitability score for a monster
     * Enhanced feature for sub-task 6.5
     */
    calculateBreedingSuitability(monster) {
        let score = 0;
        
        // Level bonus (max 30 points)
        score += Math.min(monster.level * 2, 30);
        
        // Health percentage (max 20 points)
        const healthPercent = (monster.currentStats?.hp || monster.stats?.hp) / monster.stats?.hp;
        score += healthPercent * 20;
        
        // Ability count (max 25 points)
        const abilityCount = (monster.abilities || []).length;
        score += Math.min(abilityCount * 5, 25);
        
        // Stat total (max 25 points)
        const statTotal = Object.values(monster.stats || {}).reduce((sum, stat) => sum + stat, 0);
        score += Math.min(statTotal / 10, 25);
        
        return Math.round(score);
    }

    /**
     * Get breeding suitability CSS class
     */
    getSuitabilityClass(score) {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    }

    /**
     * Get breeding suitability text
     */
    getSuitabilityText(score) {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Poor';
    }

    /**
     * Check breeding compatibility between two monsters
     * Enhanced feature for sub-task 6.5
     */
    checkBreedingCompatibility(monster1, monster2) {
        // Basic compatibility rules
        if (monster1.species === monster2.species) {
            return {
                compatible: true,
                reason: 'Same species - perfect compatibility',
                successRate: 0.9
            };
        }
        
        // Check type compatibility if species data exists
        if (monster1.speciesData && monster2.speciesData) {
            const types1 = monster1.speciesData.type || [];
            const types2 = monster2.speciesData.type || [];
            
            const sharedTypes = types1.filter(type => types2.includes(type));
            
            if (sharedTypes.length > 0) {
                return {
                    compatible: true,
                    reason: `Shared type: ${sharedTypes[0]}`,
                    successRate: 0.7
                };
            }
            
            // Check complementary types
            const compatiblePairs = [
                ['fire', 'earth'], ['water', 'air'], ['light', 'dark'],
                ['nature', 'earth'], ['ice', 'water'], ['lightning', 'air']
            ];
            
            for (let pair of compatiblePairs) {
                if ((types1.includes(pair[0]) && types2.includes(pair[1])) ||
                    (types1.includes(pair[1]) && types2.includes(pair[0]))) {
                    return {
                        compatible: true,
                        reason: `Complementary types: ${pair[0]} & ${pair[1]}`,
                        successRate: 0.6
                    };
                }
            }
        }
        
        // Level compatibility
        const levelDiff = Math.abs(monster1.level - monster2.level);
        if (levelDiff > 10) {
            return {
                compatible: false,
                reason: 'Level difference too great',
                successRate: 0
            };
        }
        
        // Default compatibility for other cases
        return {
            compatible: true,
            reason: 'Basic compatibility',
            successRate: 0.4
        };
    }

    /**
     * Update breeding selection in modal
     * Enhanced feature for sub-task 6.5
     */
    updateBreedingSelection(selectedCard) {
        // Remove previous selections
        const allCards = document.querySelectorAll('.breeding-selection-card');
        allCards.forEach(card => {
            card.classList.remove('selected');
            const btn = card.querySelector('.select-breeding-btn');
            if (btn) btn.textContent = 'Select for Breeding';
        });
        
        // Mark new selection
        selectedCard.classList.add('selected');
        const selectBtn = selectedCard.querySelector('.select-breeding-btn');
        if (selectBtn) selectBtn.textContent = 'Selected ✓';
        
        // Update compatibility preview if other parent exists
        const otherParent = this.breedingParents.parent1 || this.breedingParents.parent2;
        if (otherParent && this.selectedBreedingMonster) {
            this.updateCompatibilityPreview(this.selectedBreedingMonster, otherParent);
        }
        
        // Enable confirm button
        const confirmBtn = document.getElementById('confirm-breeding-selection');
        if (confirmBtn) confirmBtn.disabled = false;
    }

    /**
     * Update compatibility preview in breeding modal
     * Enhanced feature for sub-task 6.5
     */
    updateCompatibilityPreview(selectedMonster, otherParent) {
        const previewEl = document.getElementById('compatibility-preview');
        if (!previewEl) return;
        
        const compatibility = this.checkBreedingCompatibility(selectedMonster, otherParent);
        
        previewEl.innerHTML = `
            <div class="preview-header">
                <h4>Breeding Preview</h4>
            </div>
            <div class="breeding-pair">
                <div class="parent-info">
                    <span class="parent-icon">${this.getMonsterIcon(selectedMonster.species)}</span>
                    <span class="parent-name">${selectedMonster.nickname || selectedMonster.species}</span>
                </div>
                <div class="breeding-symbol">+</div>
                <div class="parent-info">
                    <span class="parent-icon">${this.getMonsterIcon(otherParent.species)}</span>
                    <span class="parent-name">${otherParent.nickname || otherParent.species}</span>
                </div>
            </div>
            <div class="compatibility-result ${compatibility.compatible ? 'compatible' : 'incompatible'}">
                <div class="result-status">${compatibility.compatible ? '✅' : '❌'} ${compatibility.reason}</div>
                ${compatibility.compatible ? `<div class="success-rate">Success Rate: ${Math.round(compatibility.successRate * 100)}%</div>` : ''}
            </div>
        `;
    }

    /**
     * Confirm breeding selection and close modal
     * Enhanced feature for sub-task 6.5
     */
    confirmBreedingSelection() {
        if (!this.selectedBreedingMonster || this.currentBreedingSlot === null) return;
        
        // Set the breeding parent
        this.breedingParents[`parent${this.currentBreedingSlot}`] = this.selectedBreedingMonster;
        
        // Update displays
        this.updateBreedingSlots();
        this.updateBreedingCompatibility();
        
        // Close modal
        this.closeBreedingSelectionModal();
        
        // Show confirmation
        this.showNotification(`${this.selectedBreedingMonster.nickname || this.selectedBreedingMonster.species} selected for breeding`, 'success');
    }

    /**
     * Close breeding selection modal
     * Enhanced feature for sub-task 6.5
     */
    closeBreedingSelectionModal() {
        const modal = document.getElementById('breeding-selection-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        
        // Clean up selection state
        this.currentBreedingSlot = null;
        this.selectedBreedingMonster = null;
    }

    // ================================================
    // MONSTER DETAILS AND MODALS
    // ================================================

    /**
     * Show monster details in modal
     * Extracted from original ui.js showMonsterDetails method (lines 2681-2742)
     */
    showMonsterDetails(monster) {
        const modal = document.getElementById('monster-detail-modal');
        if (!modal) return;
        
        // Populate modal with monster data
        const nameEl = document.getElementById('modal-monster-name');
        const iconEl = document.getElementById('modal-monster-icon');
        const levelEl = document.getElementById('modal-monster-level');
        const statsEl = document.getElementById('modal-stats');
        const abilitiesEl = document.getElementById('modal-abilities');
        const infoEl = document.getElementById('modal-info');
        
        if (nameEl) nameEl.textContent = monster.nickname || monster.speciesData?.name || monster.species;
        if (iconEl) iconEl.textContent = this.getMonsterIcon(monster.species);
        if (levelEl) levelEl.textContent = monster.level;
        
        // Enhanced stats display with detailed breakdown
        if (statsEl) {
            const detailedStats = this.getDetailedStatDisplay(monster);
            statsEl.innerHTML = `
                <div class="stats-enhanced">
                    ${detailedStats.map(stat => `
                        <div class="stat-row enhanced">
                            <span class="stat-name">${stat.name}:</span>
                            <span class="stat-value ${stat.bonus > 0 ? 'buffed' : ''}" title="Base: ${stat.base}, Effective: ${stat.effective}">
                                ${stat.display}
                            </span>
                        </div>
                    `).join('')}
                </div>
                <div class="stat-breakdown">
                    <button class="btn small toggle-breakdown" onclick="this.parentElement.parentElement.querySelector('.stat-details').classList.toggle('hidden')">
                        Show Stat Breakdown
                    </button>
                    <div class="stat-details hidden">
                        <h5>Stat Sources:</h5>
                        <div class="breakdown-list">
                            <div class="breakdown-item">Base Stats (Level ${monster.level || 1})</div>
                            ${monster.personality ? `<div class="breakdown-item">Personality: ${monster.personality}</div>` : ''}
                            ${(monster.abilities || []).map(ability => `<div class="breakdown-item">Ability: ${ability}</div>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Enhanced abilities display with detailed information
        if (abilitiesEl) {
            const detailedAbilities = this.displayAbilityDetails(monster);
            abilitiesEl.innerHTML = detailedAbilities;
        }
        
        // Info display
        if (infoEl) {
            infoEl.innerHTML = `
                <div>Species: ${monster.species}</div>
                <div>Personality: ${monster.personality || 'Unknown'}</div>
                <div>Experience: ${monster.experience || 0}</div>
                <div>Friendship: ${monster.friendship || 0}</div>
            `;
        }
        
        // Update action buttons
        const isInParty = this.isMonsterInParty(monster.id);
        const addBtn = document.getElementById('modal-add-to-party');
        const removeBtn = document.getElementById('modal-remove-from-party');
        
        if (addBtn) {
            addBtn.classList.toggle('hidden', isInParty);
            addBtn.onclick = () => this.addMonsterToParty(monster);
        }
        
        if (removeBtn) {
            removeBtn.classList.toggle('hidden', !isInParty);
            removeBtn.onclick = () => this.removeMonsterFromParty(monster);
        }
        
        // Store current monster for modal actions
        this.currentModalMonster = monster;
        
        // Show modal
        modal.classList.remove('hidden');
    }

    /**
     * Close monster details modal
     * Extracted from original ui.js closeMonsterModal method (lines 2747-2753)
     */
    closeMonsterModal() {
        const modal = document.getElementById('monster-detail-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.currentModalMonster = null;
        }
    }

    /**
     * Show monster selection for party slot
     * Enhanced implementation with proper selection interface
     * Extracted from original ui.js showMonsterSelection method (lines 3775-3794)
     */
    showMonsterSelection(slotIndex) {
        if (!window.GameState?.monsters?.storage) {
            this.showNotification('No monsters in storage', 'error');
            return;
        }
        
        const availableMonsters = window.GameState.monsters.storage.filter(monster => 
            !window.GameState.monsters.party.includes(monster)
        );
        
        if (availableMonsters.length === 0) {
            this.showNotification('No available monsters to add', 'warning');
            return;
        }
        
        // Show monster selection modal
        this.showMonsterSelectionModal(slotIndex, availableMonsters);
    }

    /**
     * Show monster selection modal for choosing which monster to add to party
     * Enhanced feature for sub-task 6.4
     */
    showMonsterSelectionModal(slotIndex, availableMonsters) {
        // Create or get selection modal
        let selectionModal = document.getElementById('monster-selection-modal');
        
        if (!selectionModal) {
            // Create modal if it doesn't exist
            selectionModal = document.createElement('div');
            selectionModal.id = 'monster-selection-modal';
            selectionModal.className = 'modal hidden';
            selectionModal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content monster-selection-content">
                    <header class="modal-header">
                        <h3>Select Monster for Party</h3>
                        <button class="modal-close" id="selection-modal-close">✕</button>
                    </header>
                    <div class="modal-body">
                        <div class="selection-info">
                            <p>Choose a monster to add to party slot ${slotIndex + 1}:</p>
                        </div>
                        <div class="monster-selection-grid" id="monster-selection-grid">
                            <!-- Monster selection cards will be populated here -->
                        </div>
                    </div>
                    <footer class="modal-footer">
                        <button id="selection-cancel" class="btn secondary">Cancel</button>
                    </footer>
                </div>
            `;
            document.body.appendChild(selectionModal);
            
            // Attach modal events
            const closeBtn = selectionModal.querySelector('#selection-modal-close');
            const cancelBtn = selectionModal.querySelector('#selection-cancel');
            const backdrop = selectionModal.querySelector('.modal-backdrop');
            
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeMonsterSelectionModal());
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeMonsterSelectionModal());
            if (backdrop) backdrop.addEventListener('click', () => this.closeMonsterSelectionModal());
        }
        
        // Update slot info
        const slotInfo = selectionModal.querySelector('.selection-info p');
        if (slotInfo) {
            slotInfo.textContent = `Choose a monster to add to party slot ${slotIndex + 1}:`;
        }
        
        // Populate monster selection grid
        this.populateMonsterSelectionGrid(availableMonsters, slotIndex);
        
        // Store current slot index for later use
        this.currentSelectionSlot = slotIndex;
        
        // Show modal
        selectionModal.classList.remove('hidden');
    }

    /**
     * Populate the monster selection grid with available monsters
     * Enhanced feature for sub-task 6.4
     */
    populateMonsterSelectionGrid(monsters, slotIndex) {
        const grid = document.getElementById('monster-selection-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        monsters.forEach(monster => {
            const selectionCard = document.createElement('div');
            selectionCard.className = 'monster-selection-card';
            selectionCard.dataset.monsterId = monster.id;
            
            // Enhanced stat display for selection
            const effectiveStats = this.calculateEffectiveStats(monster);
            const statDisplay = `
                <div class="selection-stats">
                    <div class="stat-pair">
                        <span class="stat-label">HP:</span>
                        <span class="stat-value">${effectiveStats.hp}</span>
                    </div>
                    <div class="stat-pair">
                        <span class="stat-label">ATK:</span>
                        <span class="stat-value">${effectiveStats.attack}</span>
                    </div>
                    <div class="stat-pair">
                        <span class="stat-label">DEF:</span>
                        <span class="stat-value">${effectiveStats.defense}</span>
                    </div>
                    <div class="stat-pair">
                        <span class="stat-label">SPD:</span>
                        <span class="stat-value">${effectiveStats.speed}</span>
                    </div>
                </div>
            `;
            
            // Enhanced ability display
            const abilities = monster.abilities || [];
            const abilityDisplay = abilities.length > 0 
                ? `<div class="selection-abilities">
                     ${abilities.slice(0, 3).map(ability => `<span class="ability-chip">${ability}</span>`).join('')}
                     ${abilities.length > 3 ? `<span class="ability-more">+${abilities.length - 3}</span>` : ''}
                   </div>`
                : '<div class="selection-abilities"><span class="no-abilities-text">No special abilities</span></div>';
            
            selectionCard.innerHTML = `
                <div class="selection-card-header">
                    <div class="monster-icon-large">${this.getMonsterIcon(monster.species)}</div>
                    <div class="monster-info">
                        <div class="monster-name">${monster.nickname || monster.speciesData?.name || monster.species}</div>
                        <div class="monster-level">Level ${monster.level}</div>
                    </div>
                </div>
                ${statDisplay}
                ${abilityDisplay}
                <div class="selection-actions">
                    <button class="btn primary select-monster-btn" data-monster-id="${monster.id}">
                        Select
                    </button>
                    <button class="btn secondary view-details-btn" data-monster-id="${monster.id}">
                        Details
                    </button>
                </div>
            `;
            
            // Attach selection events
            const selectBtn = selectionCard.querySelector('.select-monster-btn');
            const detailsBtn = selectionCard.querySelector('.view-details-btn');
            
            if (selectBtn) {
                selectBtn.addEventListener('click', () => {
                    this.selectMonsterForParty(monster, slotIndex);
                    this.closeMonsterSelectionModal();
                });
            }
            
            if (detailsBtn) {
                detailsBtn.addEventListener('click', () => {
                    this.showMonsterDetails(monster);
                });
            }
            
            grid.appendChild(selectionCard);
        });
    }

    /**
     * Close monster selection modal
     */
    closeMonsterSelectionModal() {
        const modal = document.getElementById('monster-selection-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.currentSelectionSlot = null;
    }

    /**
     * Select monster for party slot from selection modal
     */
    selectMonsterForParty(monster, slotIndex) {
        this.addMonsterToPartySlot(monster, slotIndex);
    }

    // ================================================
    // PARTY ACTIONS
    // ================================================

    /**
     * Add monster to party (modal action)
     */
    addMonsterToParty(monster = null) {
        const targetMonster = monster || this.currentModalMonster;
        if (!targetMonster) return;
        
        // Find first empty party slot
        const party = window.GameState?.monsters?.party || [];
        const emptySlotIndex = party.findIndex(m => m === null || m === undefined);
        
        if (emptySlotIndex === -1) {
            this.showNotification('Party is full', 'error');
            return;
        }
        
        this.addMonsterToPartySlot(targetMonster, emptySlotIndex);
        this.closeMonsterModal();
    }

    /**
     * Add monster to specific party slot
     * Extracted from original ui.js addMonsterToPartySlot method (lines 3799-3810)
     */
    addMonsterToPartySlot(monster, slotIndex) {
        if (!window.GameState?.monsters) return;
        
        // Remove from storage and add to party at specific slot
        const storageIndex = window.GameState.monsters.storage.indexOf(monster);
        if (storageIndex !== -1) {
            window.GameState.monsters.storage.splice(storageIndex, 1);
            window.GameState.monsters.party[slotIndex] = monster;
            this.refreshPartyDisplay();
            this.showNotification(`${monster.nickname || monster.species} added to party`, 'success');
        }
    }

    /**
     * Remove monster from party (modal action)
     */
    removeMonsterFromParty(monster = null) {
        const targetMonster = monster || this.currentModalMonster;
        if (!targetMonster || !window.GameState?.monsters) return;
        
        const partyIndex = window.GameState.monsters.party.findIndex(m => m && m.id === targetMonster.id);
        if (partyIndex !== -1) {
            // Remove from party and add to storage
            window.GameState.monsters.party[partyIndex] = null;
            window.GameState.monsters.storage.push(targetMonster);
            
            this.refreshPartyDisplay();
            this.showNotification(`${targetMonster.nickname || targetMonster.species} moved to storage`, 'success');
            this.closeMonsterModal();
        }
    }

    /**
     * Release monster (modal action)
     */
    releaseMonster(monster = null) {
        const targetMonster = monster || this.currentModalMonster;
        if (!targetMonster) return;
        
        const confirmed = confirm(`Are you sure you want to release ${targetMonster.nickname || targetMonster.species}? This action cannot be undone.`);
        if (!confirmed) return;
        
        if (window.GameState?.monsters) {
            // Remove from storage or party
            const storageIndex = window.GameState.monsters.storage.findIndex(m => m.id === targetMonster.id);
            const partyIndex = window.GameState.monsters.party.findIndex(m => m && m.id === targetMonster.id);
            
            if (storageIndex !== -1) {
                window.GameState.monsters.storage.splice(storageIndex, 1);
            } else if (partyIndex !== -1) {
                window.GameState.monsters.party[partyIndex] = null;
            }
            
            this.refreshPartyDisplay();
            this.refreshStorageDisplay();
            this.showNotification(`Released ${targetMonster.nickname || targetMonster.species}`, 'success');
            this.closeMonsterModal();
        }
    }

    // ================================================
    // ENHANCED STAT CALCULATION AND DISPLAY
    // ================================================

    /**
     * Calculate effective stats for a monster including bonuses
     * Enhanced feature for sub-task 6.4
     */
    calculateEffectiveStats(monster) {
        if (!monster || !monster.stats) {
            return { hp: 0, attack: 0, defense: 0, speed: 0, mp: 0, magicAttack: 0, magicDefense: 0, accuracy: 0 };
        }

        // Start with base stats
        const effectiveStats = { ...monster.stats };

        // Apply level-based scaling (if monster has level)
        if (monster.level && monster.level > 1) {
            const levelMultiplier = 1 + ((monster.level - 1) * 0.1); // 10% per level
            Object.keys(effectiveStats).forEach(stat => {
                effectiveStats[stat] = Math.floor(effectiveStats[stat] * levelMultiplier);
            });
        }

        // Apply personality bonuses (if monster has personality)
        if (monster.personality) {
            const personalityBonuses = this.getPersonalityStatBonuses(monster.personality);
            Object.entries(personalityBonuses).forEach(([stat, bonus]) => {
                if (effectiveStats[stat]) {
                    effectiveStats[stat] += bonus;
                }
            });
        }

        // Apply ability bonuses (if monster has abilities)
        if (monster.abilities && monster.abilities.length > 0) {
            monster.abilities.forEach(ability => {
                const abilityBonuses = this.getAbilityStatBonuses(ability);
                Object.entries(abilityBonuses).forEach(([stat, bonus]) => {
                    if (effectiveStats[stat]) {
                        effectiveStats[stat] += bonus;
                    }
                });
            });
        }

        // Ensure stats don't go below 1
        Object.keys(effectiveStats).forEach(stat => {
            effectiveStats[stat] = Math.max(1, effectiveStats[stat]);
        });

        return effectiveStats;
    }

    /**
     * Get stat bonuses based on monster personality
     * Enhanced feature for sub-task 6.4
     */
    getPersonalityStatBonuses(personality) {
        const bonuses = {
            aggressive: { attack: 15, defense: -5, speed: 10 },
            defensive: { defense: 15, hp: 20, attack: -5 },
            speedy: { speed: 20, accuracy: 10, defense: -10 },
            magical: { magicAttack: 15, mp: 15, attack: -5 },
            balanced: { hp: 5, attack: 5, defense: 5, speed: 5 },
            wise: { magicAttack: 10, magicDefense: 10, mp: 10 },
            hardy: { hp: 25, defense: 10, speed: -5 },
            nimble: { speed: 15, accuracy: 15, hp: -10 },
            calm: { mp: 20, magicDefense: 10, magicAttack: 5 }
        };

        return bonuses[personality] || {};
    }

    /**
     * Get stat bonuses from monster abilities
     * Enhanced feature for sub-task 6.4
     */
    getAbilityStatBonuses(ability) {
        const bonuses = {
            'Fire Mastery': { magicAttack: 10, attack: 5 },
            'Water Shield': { magicDefense: 10, defense: 5 },
            'Earth Strength': { defense: 15, hp: 10 },
            'Air Speed': { speed: 15, accuracy: 5 },
            'Lightning Strike': { speed: 10, attack: 10 },
            'Ice Barrier': { defense: 10, magicDefense: 10 },
            'Nature Healing': { hp: 20, mp: 10 },
            'Dark Power': { magicAttack: 15, attack: -5 },
            'Light Protection': { magicDefense: 15, defense: 5 },
            'Berserker Rage': { attack: 20, defense: -10 },
            'Swift Strike': { speed: 10, accuracy: 10 },
            'Iron Will': { magicDefense: 15, mp: 5 },
            'Keen Eye': { accuracy: 20, attack: 5 },
            'Thick Skin': { defense: 20, speed: -5 },
            'Energy Flow': { mp: 25, magicAttack: 5 }
        };

        return bonuses[ability] || {};
    }

    /**
     * Enhanced stat display with detailed breakdown
     * Enhanced feature for sub-task 6.4
     */
    getDetailedStatDisplay(monster) {
        const baseStats = monster.stats || {};
        const effectiveStats = this.calculateEffectiveStats(monster);
        
        const statNames = {
            hp: 'Health',
            mp: 'Mana',
            attack: 'Attack',
            defense: 'Defense',
            magicAttack: 'Magic Attack',
            magicDefense: 'Magic Defense',
            speed: 'Speed',
            accuracy: 'Accuracy'
        };

        return Object.entries(effectiveStats).map(([statKey, effectiveValue]) => {
            const baseValue = baseStats[statKey] || 0;
            const bonus = effectiveValue - baseValue;
            const statName = statNames[statKey] || statKey;
            
            return {
                name: statName,
                base: baseValue,
                effective: effectiveValue,
                bonus: bonus,
                display: bonus > 0 ? `${effectiveValue} (+${bonus})` : `${effectiveValue}`
            };
        });
    }

    // ================================================
    // ENHANCED ABILITY MANAGEMENT
    // ================================================

    /**
     * Get detailed ability information
     * Enhanced feature for sub-task 6.4
     */
    getAbilityDetails(abilityName) {
        const abilityData = {
            'Fire Mastery': {
                description: 'Increases fire-based attack damage and magic power',
                effect: '+10 Magic Attack, +5 Attack',
                type: 'Offensive',
                rarity: 'Common'
            },
            'Water Shield': {
                description: 'Provides protection against magical and physical attacks',
                effect: '+10 Magic Defense, +5 Defense', 
                type: 'Defensive',
                rarity: 'Common'
            },
            'Earth Strength': {
                description: 'Grants incredible physical resilience and durability',
                effect: '+15 Defense, +10 HP',
                type: 'Defensive',
                rarity: 'Uncommon'
            },
            'Air Speed': {
                description: 'Enhances movement speed and attack accuracy',
                effect: '+15 Speed, +5 Accuracy',
                type: 'Utility',
                rarity: 'Common'
            },
            'Lightning Strike': {
                description: 'Combines speed and power for devastating attacks',
                effect: '+10 Speed, +10 Attack',
                type: 'Offensive',
                rarity: 'Uncommon'
            },
            'Ice Barrier': {
                description: 'Creates protective barriers against all damage types',
                effect: '+10 Defense, +10 Magic Defense',
                type: 'Defensive',
                rarity: 'Uncommon'
            },
            'Nature Healing': {
                description: 'Harnesses natural energy for enhanced vitality',
                effect: '+20 HP, +10 MP',
                type: 'Support',
                rarity: 'Rare'
            },
            'Dark Power': {
                description: 'Channels dark energy for devastating magic attacks',
                effect: '+15 Magic Attack, -5 Attack',
                type: 'Offensive',
                rarity: 'Rare'
            },
            'Light Protection': {
                description: 'Divine protection against magical and physical harm',
                effect: '+15 Magic Defense, +5 Defense',
                type: 'Defensive',
                rarity: 'Rare'
            },
            'Berserker Rage': {
                description: 'Unleashes primal fury at the cost of defense',
                effect: '+20 Attack, -10 Defense',
                type: 'Offensive',
                rarity: 'Epic'
            },
            'Swift Strike': {
                description: 'Enables rapid, precise attacks',
                effect: '+10 Speed, +10 Accuracy',
                type: 'Offensive',
                rarity: 'Common'
            },
            'Iron Will': {
                description: 'Mental fortitude that resists magical effects',
                effect: '+15 Magic Defense, +5 MP',
                type: 'Defensive',
                rarity: 'Uncommon'
            },
            'Keen Eye': {
                description: 'Enhanced perception for perfect accuracy',
                effect: '+20 Accuracy, +5 Attack',
                type: 'Utility',
                rarity: 'Uncommon'
            },
            'Thick Skin': {
                description: 'Natural armor that reduces physical damage',
                effect: '+20 Defense, -5 Speed',
                type: 'Defensive',
                rarity: 'Common'
            },
            'Energy Flow': {
                description: 'Channels magical energy with greater efficiency',
                effect: '+25 MP, +5 Magic Attack',
                type: 'Support',
                rarity: 'Rare'
            }
        };

        return abilityData[abilityName] || {
            description: 'A unique ability with unknown effects',
            effect: 'Unknown',
            type: 'Unknown',
            rarity: 'Unknown'
        };
    }

    /**
     * Enhanced ability display in monster details
     * Enhanced feature for sub-task 6.4
     */
    displayAbilityDetails(monster) {
        const abilities = monster.abilities || [];
        if (abilities.length === 0) {
            return '<div class="no-abilities">This monster has no special abilities.</div>';
        }

        return abilities.map(ability => {
            const details = this.getAbilityDetails(ability);
            return `
                <div class="ability-detail-card" data-ability="${ability}">
                    <div class="ability-header">
                        <span class="ability-name">${ability}</span>
                        <span class="ability-rarity ${details.rarity.toLowerCase()}">${details.rarity}</span>
                    </div>
                    <div class="ability-description">${details.description}</div>
                    <div class="ability-effect">
                        <span class="effect-label">Effect:</span>
                        <span class="effect-text">${details.effect}</span>
                    </div>
                    <div class="ability-type">
                        <span class="type-label">Type:</span>
                        <span class="type-badge ${details.type.toLowerCase()}">${details.type}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ================================================
    // ENHANCED INTERACTION PROMPTS AND WORKFLOWS
    // ================================================

    /**
     * Show interactive prompt with multiple options
     * Enhanced feature for sub-task 6.5
     */
    showInteractionPrompt(title, message, options) {
        // Create or get interaction prompt modal
        let promptModal = document.getElementById('interaction-prompt-modal');
        
        if (!promptModal) {
            promptModal = document.createElement('div');
            promptModal.id = 'interaction-prompt-modal';
            promptModal.className = 'modal hidden';
            promptModal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content interaction-prompt-content">
                    <header class="modal-header">
                        <h3 id="prompt-title">Interaction</h3>
                        <button class="modal-close" id="prompt-modal-close">✕</button>
                    </header>
                    <div class="modal-body">
                        <div class="prompt-message" id="prompt-message"></div>
                        <div class="prompt-options" id="prompt-options">
                            <!-- Options will be populated here -->
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(promptModal);
            
            // Attach modal close events
            const closeBtn = promptModal.querySelector('#prompt-modal-close');
            const backdrop = promptModal.querySelector('.modal-backdrop');
            
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeInteractionPrompt());
            if (backdrop) backdrop.addEventListener('click', () => this.closeInteractionPrompt());
        }
        
        // Update content
        const titleEl = promptModal.querySelector('#prompt-title');
        const messageEl = promptModal.querySelector('#prompt-message');
        const optionsEl = promptModal.querySelector('#prompt-options');
        
        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;
        
        if (optionsEl) {
            optionsEl.innerHTML = '';
            options.forEach((option, index) => {
                const optionBtn = document.createElement('button');
                optionBtn.className = `btn ${index === 0 ? 'primary' : 'secondary'} prompt-option`;
                optionBtn.textContent = option.text;
                optionBtn.addEventListener('click', () => {
                    this.closeInteractionPrompt();
                    if (option.action) option.action();
                });
                optionsEl.appendChild(optionBtn);
            });
        }
        
        // Show modal
        promptModal.classList.remove('hidden');
    }

    /**
     * Close interaction prompt modal
     */
    closeInteractionPrompt() {
        const modal = document.getElementById('interaction-prompt-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * Enhanced breeding start with confirmation prompt
     * Enhanced feature for sub-task 6.5
     */
    startBreeding() {
        if (!this.breedingParents.parent1 || !this.breedingParents.parent2) {
            this.showNotification('Select two monsters for breeding', 'error');
            return;
        }

        // Show breeding confirmation prompt
        this.showBreedingConfirmationPrompt();
    }

    /**
     * Show breeding confirmation with detailed information
     * Enhanced feature for sub-task 6.5
     */
    showBreedingConfirmationPrompt() {
        const parent1 = this.breedingParents.parent1;
        const parent2 = this.breedingParents.parent2;
        
        if (!parent1 || !parent2) return;
        
        const compatibility = this.checkBreedingCompatibility(parent1, parent2);
        
        // Create breeding confirmation modal
        let confirmModal = document.getElementById('breeding-confirm-modal');
        
        if (!confirmModal) {
            confirmModal = document.createElement('div');
            confirmModal.id = 'breeding-confirm-modal';
            confirmModal.className = 'modal hidden';
            confirmModal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content breeding-confirm-content">
                    <header class="modal-header">
                        <h3>Confirm Breeding</h3>
                        <button class="modal-close" id="breeding-confirm-close">✕</button>
                    </header>
                    <div class="modal-body">
                        <div class="breeding-confirmation-info" id="breeding-confirmation-info">
                            <!-- Breeding info will be populated here -->
                        </div>
                    </div>
                    <footer class="modal-footer">
                        <button id="cancel-breeding" class="btn secondary">Cancel</button>
                        <button id="confirm-start-breeding" class="btn primary">Start Breeding</button>
                    </footer>
                </div>
            `;
            document.body.appendChild(confirmModal);
            
            // Attach modal events
            const closeBtn = confirmModal.querySelector('#breeding-confirm-close');
            const cancelBtn = confirmModal.querySelector('#cancel-breeding');
            const confirmBtn = confirmModal.querySelector('#confirm-start-breeding');
            const backdrop = confirmModal.querySelector('.modal-backdrop');
            
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeBreedingConfirmModal());
            if (cancelBtn) cancelBtn.addEventListener('click', () => this.closeBreedingConfirmModal());
            if (confirmBtn) confirmBtn.addEventListener('click', () => this.executeBreeding());
            if (backdrop) backdrop.addEventListener('click', () => this.closeBreedingConfirmModal());
        }
        
        // Populate breeding confirmation info
        const infoEl = confirmModal.querySelector('#breeding-confirmation-info');
        if (infoEl) {
            const possibleOutcomes = this.getPossibleBreedingOutcomes(parent1, parent2);
            
            infoEl.innerHTML = `
                <div class="breeding-parents">
                    <div class="parent-card">
                        <div class="parent-icon">${this.getMonsterIcon(parent1.species)}</div>
                        <div class="parent-info">
                            <div class="parent-name">${parent1.nickname || parent1.species}</div>
                            <div class="parent-level">Level ${parent1.level}</div>
                            <div class="parent-traits">
                                <span class="trait">Personality: ${parent1.personality || 'Unknown'}</span>
                                <span class="trait">Abilities: ${(parent1.abilities || []).length}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="breeding-operator">+</div>
                    
                    <div class="parent-card">
                        <div class="parent-icon">${this.getMonsterIcon(parent2.species)}</div>
                        <div class="parent-info">
                            <div class="parent-name">${parent2.nickname || parent2.species}</div>
                            <div class="parent-level">Level ${parent2.level}</div>
                            <div class="parent-traits">
                                <span class="trait">Personality: ${parent2.personality || 'Unknown'}</span>
                                <span class="trait">Abilities: ${(parent2.abilities || []).length}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="breeding-results">
                    <div class="compatibility-status ${compatibility.compatible ? 'compatible' : 'incompatible'}">
                        <h4>Compatibility: ${compatibility.compatible ? '✅ Compatible' : '❌ Incompatible'}</h4>
                        <p>${compatibility.reason}</p>
                        ${compatibility.compatible ? `<p class="success-rate">Success Rate: ${Math.round(compatibility.successRate * 100)}%</p>` : ''}
                    </div>
                    
                    ${compatibility.compatible ? `
                        <div class="possible-outcomes">
                            <h4>Possible Outcomes:</h4>
                            <div class="outcome-list">
                                ${possibleOutcomes.map(outcome => `
                                    <div class="outcome-item">
                                        <span class="outcome-icon">${this.getMonsterIcon(outcome.species)}</span>
                                        <span class="outcome-species">${outcome.species}</span>
                                        <span class="outcome-chance">${Math.round(outcome.probability * 100)}%</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="breeding-cost">
                            <h4>Breeding Requirements:</h4>
                            <ul>
                                <li>Both monsters will be unavailable for 24 hours</li>
                                <li>Requires 100 Gold for breeding materials</li>
                                <li>Both monsters must maintain 25%+ HP</li>
                            </ul>
                        </div>
                    ` : `
                        <div class="incompatible-message">
                            <p>These monsters cannot breed together. Try selecting different monsters with compatible types or similar levels.</p>
                        </div>
                    `}
                </div>
            `;
        }
        
        // Enable/disable confirm button based on compatibility
        const confirmBtn = confirmModal.querySelector('#confirm-start-breeding');
        if (confirmBtn) {
            confirmBtn.disabled = !compatibility.compatible;
            confirmBtn.textContent = compatibility.compatible ? 'Start Breeding' : 'Cannot Breed';
        }
        
        // Show modal
        confirmModal.classList.remove('hidden');
    }

    /**
     * Get possible breeding outcomes
     * Enhanced feature for sub-task 6.5
     */
    getPossibleBreedingOutcomes(parent1, parent2) {
        // Simple breeding outcome calculation
        const outcomes = [];
        
        // Same species = same species offspring (high chance)
        if (parent1.species === parent2.species) {
            outcomes.push({
                species: parent1.species,
                probability: 0.8
            });
        } else {
            // Different species = chance of either parent species
            outcomes.push(
                { species: parent1.species, probability: 0.4 },
                { species: parent2.species, probability: 0.4 }
            );
        }
        
        // Rare chance of hybrid or unique offspring
        const hybridSpecies = this.getHybridSpecies(parent1.species, parent2.species);
        if (hybridSpecies) {
            outcomes.push({
                species: hybridSpecies,
                probability: 0.2
            });
        }
        
        return outcomes.sort((a, b) => b.probability - a.probability);
    }

    /**
     * Get hybrid species for breeding combinations
     * Enhanced feature for sub-task 6.5
     */
    getHybridSpecies(species1, species2) {
        const hybridMap = {
            'dragon-phoenix': 'flame_dragon',
            'wolf-hawk': 'storm_wolf',
            'slime-golem': 'crystal_slime',
            'fairy-unicorn': 'celestial_fairy',
            'goblin-orc': 'war_goblin',
            'spider-skeleton': 'bone_spider'
        };
        
        const key = [species1, species2].sort().join('-');
        return hybridMap[key] || null;
    }

    /**
     * Execute the actual breeding process
     * Enhanced feature for sub-task 6.5
     */
    executeBreeding() {
        const parent1 = this.breedingParents.parent1;
        const parent2 = this.breedingParents.parent2;
        
        if (!parent1 || !parent2) return;
        
        // Close confirmation modal
        this.closeBreedingConfirmModal();
        
        // Attempt breeding with the game breeding system
        if (window.GameState?.breeding) {
            const success = window.GameState.breeding.startBreeding(parent1, parent2);
            
            if (success) {
                this.showNotification('Breeding started successfully!', 'success');
                this.clearBreedingSelection();
                this.refreshBreedingDisplay();
                
                // Show breeding started workflow
                this.showBreedingStartedWorkflow(parent1, parent2);
            } else {
                this.showNotification('Breeding failed - check compatibility and cooldowns', 'error');
            }
        } else {
            // Fallback breeding simulation
            this.simulateBreeding(parent1, parent2);
        }
    }

    /**
     * Show breeding started workflow with next steps
     * Enhanced feature for sub-task 6.5
     */
    showBreedingStartedWorkflow(parent1, parent2) {
        const options = [
            {
                text: 'View Breeding Progress',
                action: () => this.showBreedingProgress()
            },
            {
                text: 'Continue Managing Monsters',
                action: () => {} // Stay on current screen
            },
            {
                text: 'Return to Main Menu',
                action: () => this.returnToPrevious()
            }
        ];

        this.showInteractionPrompt(
            'Breeding Started!',
            `${parent1.nickname || parent1.species} and ${parent2.nickname || parent2.species} have begun the breeding process. Check back in 24 hours for results!`,
            options
        );
    }

    /**
     * Simulate breeding process (fallback)
     * Enhanced feature for sub-task 6.5
     */
    simulateBreeding(parent1, parent2) {
        // Add simulated breeding record
        if (!window.GameState.monsters) window.GameState.monsters = {};
        if (!window.GameState.monsters.breedingHistory) window.GameState.monsters.breedingHistory = [];
        
        const outcomes = this.getPossibleBreedingOutcomes(parent1, parent2);
        const selectedOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
        
        window.GameState.monsters.breedingHistory.unshift({
            parent1Species: parent1.species,
            parent2Species: parent2.species,
            offspring: selectedOutcome.species,
            date: Date.now()
        });
        
        this.showNotification('Breeding started successfully! (Simulated)', 'success');
        this.clearBreedingSelection();
        this.refreshBreedingDisplay();
        this.showBreedingStartedWorkflow(parent1, parent2);
    }

    /**
     * Close breeding confirmation modal
     */
    closeBreedingConfirmModal() {
        const modal = document.getElementById('breeding-confirm-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    /**
     * Show breeding progress (placeholder)
     * Enhanced feature for sub-task 6.5
     */
    showBreedingProgress() {
        this.showNotification('Breeding progress feature coming soon!', 'info');
    }

    // ================================================
    // UTILITY METHODS
    // ================================================

    /**
     * Get appropriate icon for monster species
     * Extracted from original ui.js getMonsterIcon method (lines 2659-2676)
     */
    getMonsterIcon(species) {
        const icons = {
            slime: '🟢',
            goblin: '👹',
            wolf: '🐺',
            hawk: '🦅',
            dragon: '🐉',
            phoenix: '🔥',
            unicorn: '🦄',
            spider: '🕷️',
            skeleton: '💀',
            orc: '👺',
            fairy: '🧚',
            golem: '🗿'
        };
        
        return icons[species] || '👾';
    }

    /**
     * Check if monster is in party
     * Extracted from original ui.js isMonsterInParty method (lines 2758-2761)
     */
    isMonsterInParty(monsterId) {
        const gs = this.getGS();
        if (!gs?.monsters?.party) return false;
        return gs.monsters.party.some(m => m && m.id === monsterId);
    }

    /**
     * Get available breeding monsters
     * Enhanced feature for sub-task 6.5
     */
    getAvailableBreedingMonsters() {
        const gs = this.getGS();
        const storage = gs?.monsters?.storage || [];
        const party = gs?.monsters?.party || [];
        const otherParent = this.breedingParents.parent1 || this.breedingParents.parent2;

        return storage.filter(monster => {
            if (party.includes(monster)) return false;
            if (otherParent && monster.id === otherParent.id) return false;
            if (monster.level < 5) return false;
            if (monster.currentStats?.hp < monster.stats?.hp * 0.5) return false;
            return true;
        });
    }

    /**
     * Show a notification message
     * Wrapper method for notification system
     */
    showNotification(message, type = 'info') {
        if (this.notificationManager) {
            this.notificationManager.show(message, { type });
        } else {
            console.log(`Notification [${type}]:`, message);
        }
    }

    /**
     * Return to previous scene
     */
    returnToPrevious() {
        // Use the same pattern as other modules
        this.sendMessage('returnToPrevious');
    }
}

// Export for module loading system
if (typeof window !== 'undefined') {
    window.MonsterUI = MonsterUI;
}