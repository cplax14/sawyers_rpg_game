/**
 * Menu UI Module
 * Handles main menu, character selection, and navigation interfaces
 * Extracted from original ui.js lines ~258-314, 1713-1766
 */

class MenuUI extends BaseUIModule {
    constructor(uiManager, options = {}) {
        super('MenuUI', uiManager, {
            scenes: ['main_menu', 'character_select'],
            dependencies: ['UIHelpers', 'SceneManager'],
            ...options
        });
        
        this.selectedElements = new Map();
        this.classData = null;
        this.gameState = null;
        
        console.log('✅ MenuUI initialized');
    }

    /**
     * Initialize the menu UI module
     */
    async init() {
        await super.init();
        
        // Get references to dependencies
        this.gameState = this.getGameReference('gameState');
        this.classData = window.CharacterData;
        
        // Initialize selected elements tracking
        this.selectedElements.clear();
        
        // Validate navigation elements exist
        this.validateNavigationElements();
        
        console.log('🎮 MenuUI initialization completed');
        return true;
    }

    /**
     * Attach event listeners for menu functionality
     */
    attachEvents() {
        super.attachEvents();
        
        // Main menu buttons
        this.attachButton('new-game-btn', () => this.startNewGame());
        this.attachButton('load-game-btn', () => this.loadGame());
        this.attachButton('settings-btn', () => this.showScene('settings'));
        
        // Character selection
        this.attachCharacterSelection();
        this.attachButton('start-adventure-btn', () => this.startAdventure());
        this.attachButton('back-to-menu', () => this.showScene('main_menu'));
        this.attachButton('back-to-menu-btn', () => this.returnToPrevious());

        // Resilient delegation for main menu buttons (in case early bind fails)
        this.addEventListener(document, 'click', (e) => {
            const btn = e.target.closest('#new-game-btn, #load-game-btn, #settings-btn');
            if (!btn) return;
            
            switch (btn.id) {
                case 'new-game-btn':
                    this.startNewGame();
                    break;
                case 'load-game-btn':
                    this.loadGame();
                    break;
                case 'settings-btn':
                    this.showScene('settings');
                    break;
            }
        });
        
        console.log('🔗 MenuUI events attached');
    }

    /**
     * Show the menu UI
     */
    show(sceneName = 'main_menu') {
        super.show();

        // Just update internal state - don't trigger scene transitions
        // The scene system is already handling the scene change

        // Reset character selection if showing character select
        if (sceneName === 'character_select') {
            this.resetCharacterSelection();
        }

        console.log(`🎭 MenuUI showing scene: ${sceneName}`);
    }

    /**
     * Hide the menu UI
     */
    hide() {
        super.hide();
        console.log('👋 MenuUI hidden');
    }

    // ================================================
    // MAIN MENU ACTIONS
    // ================================================

    /**
     * Start new game
     * Extracted from original ui.js lines 1723-1728
     */
    startNewGame() {
        if (this.gameState) {
            this.gameState.resetToDefaults();
        }
        // Clear any existing auto-save to ensure clean slate
        try {
            localStorage.removeItem('sawyers_rpg_autosave');
            console.log('🗑️ Cleared auto-save for new game');
        } catch (error) {
            console.warn('⚠️ Failed to clear auto-save:', error);
        }
        this.resetCharacterSelection();
        this.showScene('character_select');
        this.notifySuccess('New game started! Select your character class.');
    }

    /**
     * Load saved game
     * Extracted from original ui.js lines 1733-1743
     */
    loadGame() {
        if (typeof SaveSystem !== 'undefined') {
            const success = SaveSystem.loadGame();
            if (success) {
                this.showScene('game_world');
                this.notifySuccess('Game loaded successfully');
            } else {
                this.notifyError('No save file found');
            }
        } else {
            this.notifyError('Save system not available');
        }
    }

    /**
     * Start adventure with selected character
     * Extracted from original ui.js lines 1748-1772
     */
    startAdventure() {
        console.log('🚨 startAdventure called!');
        console.trace('🔍 Call stack for startAdventure');
        // Support multiple selection sources to tolerate different attach flows
        let selectedClass = this.selectedElements.get('character_class');
        
        if (!selectedClass && this.gameState && this.gameState.selectedClass) {
            selectedClass = this.gameState.selectedClass;
        }
        
        if (!selectedClass) {
            const selectedCard = document.querySelector('.class-card.selected');
            if (selectedCard && selectedCard.dataset && selectedCard.dataset.class) {
                selectedClass = selectedCard.dataset.class;
            }
        }
        
        if (!selectedClass) {
            this.notifyError('Please select a character class');
            return;
        }

        if (this.gameState) {
            const success = this.gameState.setPlayerClass(selectedClass);
            if (success) {
                this.gameState.addStoryFlag('character_selected');
                // Unlock early-game progression so Forest Path is available
                this.gameState.addStoryFlag('tutorial_complete');
                this.showScene('game_world');
                this.notifySuccess(`Adventure started as ${selectedClass}!`);
            } else {
                this.notifyError('Failed to set character class');
            }
        } else {
            this.notifyError('Game state not available');
        }
    }

    // ================================================
    // CHARACTER SELECTION
    // ================================================

    /**
     * Attach character selection event handlers
     * Extracted from original ui.js attachCharacterSelection method
     */
    attachCharacterSelection() {
        // Class card selection
        const classCards = document.querySelectorAll('.class-card');
        classCards.forEach(card => {
            this.addEventListener(card, 'click', () => {
                this.selectCharacterClass(card.dataset.class);
            });
        });
        
        console.log(`🎯 Attached character selection to ${classCards.length} class cards`);
    }

    /**
     * Handle character class selection
     * Extracted from original ui.js selectCharacterClass method
     */
    selectCharacterClass(className) {
        console.log('🚨 selectCharacterClass called with:', className);
        console.trace('🔍 Call stack for selectCharacterClass');
        if (!className) {
            console.warn('No class name provided for selection');
            return;
        }

        // Remove previous selection
        document.querySelectorAll('.class-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Add selection to clicked card
        const selectedCard = document.querySelector(`[data-class="${className}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        } else {
            console.warn(`No card found for class: ${className}`);
            return;
        }

        // Update details panel
        this.showClassDetails(className);

        // Enable start button
        const startBtn = document.getElementById('start-adventure-btn');
        if (startBtn) {
            startBtn.disabled = false;
        }

        // Store selection in multiple places for compatibility
        this.selectedElements.set('character_class', className);
        if (this.gameState) {
            this.gameState.selectedClass = className;
        }
        if (window.GameState) {
            window.GameState.selectedClass = className;
        }
        
        console.log(`🎭 Selected character class: ${className}`);
    }

    /**
     * Show detailed information about a character class
     * Extracted from original ui.js showClassDetails method
     */
    showClassDetails(className) {
        if (!this.classData && !window.CharacterData) {
            console.warn('CharacterData not available');
            this.notifyWarning('Character data not loaded');
            return;
        }

        const characterData = this.classData || window.CharacterData;
        const classData = characterData.getClass(className);
        if (!classData) {
            console.warn(`Class data not found for: ${className}`);
            this.notifyWarning(`Class data not found: ${className}`);
            return;
        }

        // Hide no-selection prompt
        const noSelection = document.querySelector('.no-selection');
        if (noSelection) noSelection.style.display = 'none';

        // Show details content
        const detailContent = document.getElementById('class-detail-content');
        if (detailContent) {
            detailContent.classList.remove('hidden');

            // Update class name and description
            const nameEl = document.getElementById('detail-class-name');
            const descEl = document.getElementById('detail-class-desc');
            if (nameEl) nameEl.textContent = classData.name;
            if (descEl) descEl.textContent = classData.description;

            // Update stats
            this.populateStats(classData.baseStats);

            // Update spells
            this.populateStartingSpells(classData.startingSpells);

            // Update class bonus
            const bonusEl = document.getElementById('class-bonus-text');
            if (bonusEl) bonusEl.textContent = classData.classBonus;
        }
        
        console.log(`📋 Displayed class details for: ${className}`);
    }

    /**
     * Populate stats grid with character stats
     * Extracted from original ui.js populateStats method
     */
    populateStats(stats) {
        const statsGrid = document.getElementById('stats-grid');
        if (!statsGrid) return;

        statsGrid.innerHTML = '';

        // Define stat display names
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

        Object.entries(stats).forEach(([statKey, value]) => {
            const statDiv = document.createElement('div');
            statDiv.className = 'stat-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'stat-name';
            nameSpan.textContent = statNames[statKey] || statKey;
            
            const valueSpan = document.createElement('span');
            valueSpan.className = 'stat-value';
            valueSpan.textContent = value;
            
            statDiv.appendChild(nameSpan);
            statDiv.appendChild(valueSpan);
            statsGrid.appendChild(statDiv);
        });
    }

    /**
     * Populate starting spells list
     * Extracted from original ui.js populateStartingSpells method
     */
    populateStartingSpells(spells) {
        const spellsList = document.getElementById('starting-spells');
        if (!spellsList) return;

        spellsList.innerHTML = '';

        if (spells && spells.length > 0) {
            spells.forEach(spell => {
                const spellTag = document.createElement('span');
                spellTag.className = 'spell-tag';
                spellTag.textContent = spell.replace('_', ' ');
                spellsList.appendChild(spellTag);
            });
        } else {
            const noSpells = document.createElement('span');
            noSpells.className = 'spell-tag no-spells';
            noSpells.textContent = 'None';
            spellsList.appendChild(noSpells);
        }
    }

    /**
     * Reset character selection state
     */
    resetCharacterSelection() {
        // Clear selections
        this.selectedElements.clear();
        
        // Remove selected class from cards
        document.querySelectorAll('.class-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Disable start button
        const startBtn = document.getElementById('start-adventure-btn');
        if (startBtn) {
            startBtn.disabled = true;
        }
        
        // Hide class details
        const detailContent = document.getElementById('class-detail-content');
        if (detailContent) {
            detailContent.classList.add('hidden');
        }
        
        // Show no-selection prompt
        const noSelection = document.querySelector('.no-selection');
        if (noSelection) noSelection.style.display = 'block';
        
        console.log('🔄 Character selection reset');
    }

    // ================================================
    // UTILITY METHODS
    // ================================================

    /**
     * Show a scene using the scene manager
     */
    showScene(sceneName) {
        if (sceneName === 'game_world') {
            console.log('🚨 showScene(game_world) called!');
            console.trace('🔍 Call stack for showScene(game_world)');
        }
        this.sendMessage('showScene', { sceneName });
    }

    /**
     * Return to previous scene with intelligent fallbacks
     * Extracted from original ui.js returnToPrevious method
     */
    returnToPrevious() {
        console.log('🚨 returnToPrevious called!');
        console.trace('🔍 Call stack for returnToPrevious');
        // Try to get previous scene from scene manager
        const previousScene = this.sendMessage('getPreviousScene');
        if (previousScene && previousScene.name) {
            this.showScene(previousScene.name);
            return;
        }

        // Get current scene to determine appropriate fallback
        const currentScene = this.sendMessage('getCurrentScene');
        const currentSceneName = currentScene?.name;

        // Fallbacks based on current context
        if (currentSceneName === 'settings') {
            // If coming from settings with no recorded previous, go to main_menu
            this.showScene('main_menu');
            return;
        }

        if (currentSceneName === 'character_select') {
            // From character select, return to main menu
            this.showScene('main_menu');
            return;
        }

        // Final fallback: game world if available, else main menu
        if (this.hasScene('game_world')) {
            this.showScene('game_world');
        } else {
            this.showScene('main_menu');
        }
        
        console.log(`🔄 Returned to previous scene from ${currentSceneName}`);
    }

    /**
     * Check if a scene exists
     */
    hasScene(sceneName) {
        return this.sendMessage('hasScene', { sceneName });
    }

    /**
     * Get game object reference
     */
    getGameReference(property) {
        if (this.uiManager && this.uiManager.game) {
            return this.uiManager.game[property];
        }
        return null;
    }

    /**
     * Notification helpers
     */
    notifySuccess(message) {
        this.sendMessage('showNotification', { message, type: 'success' });
    }

    notifyError(message) {
        this.sendMessage('showNotification', { message, type: 'error' });
    }

    notifyWarning(message) {
        this.sendMessage('showNotification', { message, type: 'warning' });
    }

    /**
     * Get current selected character class
     */
    getSelectedClass() {
        return this.selectedElements.get('character_class');
    }

    /**
     * Check if a character class is selected
     */
    hasSelectedClass() {
        return this.selectedElements.has('character_class');
    }

    /**
     * Validate navigation elements exist for proper menu flow
     */
    validateNavigationElements() {
        const requiredElements = [
            'new-game-btn',
            'load-game-btn', 
            'settings-btn',
            'start-adventure-btn'
        ];
        
        const missingElements = [];
        requiredElements.forEach(id => {
            if (!document.getElementById(id)) {
                missingElements.push(id);
            }
        });
        
        if (missingElements.length > 0) {
            console.warn(`MenuUI: Missing navigation elements: ${missingElements.join(', ')}`);
        }
        
        // Validate character selection elements
        const classCards = document.querySelectorAll('.class-card');
        if (classCards.length === 0) {
            console.warn('MenuUI: No character class cards found');
        }
        
        console.log(`🔍 MenuUI navigation validation: ${requiredElements.length - missingElements.length}/${requiredElements.length} elements found`);
    }

    /**
     * Cleanup menu UI resources
     */
    cleanup() {
        this.selectedElements.clear();
        super.cleanup();
        console.log('🧹 MenuUI cleaned up');
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuUI;
} else if (typeof window !== 'undefined') {
    window.MenuUI = MenuUI;
}