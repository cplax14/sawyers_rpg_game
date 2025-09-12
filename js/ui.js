/**
 * UI Manager
 * Handles scene management, UI interactions, and screen transitions
 */

class UIManager {
    constructor(game) {
        this.game = game;
        this.scenes = {};
        this.currentScene = null;
        this.previousScene = null;
        this.transitionState = {
            active: false,
            duration: 0.3,
            elapsed: 0,
            type: 'fade'
        };
        
        // UI state
        this.selectedElements = new Map();
        this.menuStack = [];
        this.dialogueQueue = [];
        
        this.init();
    }
    
    /**
     * Initialize the UI system
     */
    init() {
        this.setupScenes();
        this.attachEventListeners();
        this.showScene('main_menu');
        
        console.log('✅ UIManager initialized');
    }
    
    /**
     * Set up all game scenes
     */
    setupScenes() {
        // Main Menu Scene
        this.scenes.main_menu = new Scene('main_menu', {
            element: document.getElementById('main-menu'),
            type: 'menu',
            buttons: [
                { id: 'new-game-btn', action: 'startNewGame' },
                { id: 'load-game-btn', action: 'loadGame' },
                { id: 'settings-btn', action: 'showSettings' }
            ]
        });
        
        // Character Selection Scene
        this.scenes.character_select = new Scene('character_select', {
            element: document.getElementById('character-select'),
            type: 'selection',
            selectableItems: '.class-card',
            confirmButton: 'start-adventure-btn'
        });
        
        // Game World Scene
        this.scenes.game_world = new Scene('game_world', {
            element: document.getElementById('game-world'),
            type: 'game',
            overlay: true
        });
        
        // Combat Scene
        this.scenes.combat = new Scene('combat', {
            element: document.getElementById('combat'),
            type: 'combat',
            overlay: true
        });
        
        // Monster Management Scene
        this.scenes.monster_management = new Scene('monster_management', {
            element: document.getElementById('monster-management'),
            type: 'menu',
            overlay: true
        });
        
        // Inventory Scene
        this.scenes.inventory = new Scene('inventory', {
            element: document.getElementById('inventory'),
            type: 'menu',
            overlay: true
        });
        
        // Settings Scene
        this.scenes.settings = new Scene('settings', {
            element: document.getElementById('settings'),
            type: 'menu',
            buttons: [
                { id: 'back-to-menu-btn', action: 'returnToPrevious' }
            ]
        });
        
        console.log(`📺 ${Object.keys(this.scenes).length} scenes registered`);
    }
    
    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Main menu buttons
        this.attachButton('new-game-btn', () => this.startNewGame());
        this.attachButton('load-game-btn', () => this.loadGame());
        this.attachButton('settings-btn', () => this.showScene('settings'));
        
        // Character selection
        this.attachCharacterSelection();
        this.attachButton('start-adventure-btn', () => this.startAdventure());
        
        // Settings
        this.attachButton('back-to-menu-btn', () => this.returnToPrevious());
        this.attachSettings();
        
        // Game HUD buttons
        this.attachButton('world-map-btn', () => this.showWorldMap());
        this.attachButton('monsters-btn', () => this.showScene('monster_management'));
        this.attachButton('inventory-btn', () => this.showScene('inventory'));
        this.attachButton('save-game-btn', () => this.saveGame());
        // Minimal breeding integration (if button exists)
        this.attachButton('breed-btn', () => this.promptBreeding());
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeys(e));
    }
    
    /**
     * Attach button event listener
     */
    attachButton(buttonId, callback) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', callback);
        } else {
            console.warn(`Button ${buttonId} not found`);
        }
    }
    
    /**
     * Set up character selection interaction
     */
    attachCharacterSelection() {
        const classCards = document.querySelectorAll('.class-card');
        const startButton = document.getElementById('start-adventure-btn');
        let selectedClass = null;
        
        classCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove previous selection
                classCards.forEach(c => c.classList.remove('selected'));
                
                // Select this card
                card.classList.add('selected');
                selectedClass = card.dataset.class;
                
                // Enable start button
                if (startButton) {
                    startButton.disabled = false;
                }
                
                // Store selection
                this.selectedElements.set('character_class', selectedClass);
            });
        });
    }
    
    /**
     * Set up settings controls
     */
    attachSettings() {
        const masterVolume = document.getElementById('master-volume');
        const sfxVolume = document.getElementById('sfx-volume');
        const autoSave = document.getElementById('auto-save');
        
        if (masterVolume) {
            masterVolume.addEventListener('input', (e) => {
                const value = e.target.value / 100;
                this.game.gameState.settings.masterVolume = value;
                this.updateAudioSettings();
            });
        }
        
        if (sfxVolume) {
            sfxVolume.addEventListener('input', (e) => {
                const value = e.target.value / 100;
                this.game.gameState.settings.sfxVolume = value;
                this.updateAudioSettings();
            });
        }
        
        if (autoSave) {
            autoSave.addEventListener('change', (e) => {
                this.game.gameState.settings.autoSave = e.target.checked;
            });
        }
    }
    
    /**
     * Update game loop
     */
    update(deltaTime) {
        // Update scene transitions
        if (this.transitionState.active) {
            this.updateTransition(deltaTime);
        }
        
        // Update current scene
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
        
        // Process dialogue queue
        this.processDialogueQueue(deltaTime);
    }
    
    /**
     * Update scene transitions
     */
    updateTransition(deltaTime) {
        this.transitionState.elapsed += deltaTime;
        
        if (this.transitionState.elapsed >= this.transitionState.duration) {
            this.completeTransition();
        }
    }
    
    /**
     * Process dialogue queue
     */
    processDialogueQueue(deltaTime) {
        // Dialogue system implementation
        // Will be expanded when story system is integrated
    }
    
    /**
     * Render UI elements on canvas (if needed)
     */
    renderCanvas(ctx) {
        // Canvas-based UI rendering for game scenes
        if (this.currentScene && this.currentScene.config.type === 'game') {
            this.renderGameUI(ctx);
        }
        
        // Render transitions
        if (this.transitionState.active) {
            this.renderTransition(ctx);
        }
    }
    
    /**
     * Render game UI elements
     */
    renderGameUI(ctx) {
        // Render world map, area info, etc. on canvas
        const gameState = this.game.gameState;
        if (!gameState) return;
        
        // Draw current area name
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 30);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px serif';
        ctx.fillText(`Area: ${gameState.world.currentArea}`, 15, 30);
        ctx.restore();
    }
    
    /**
     * Render scene transitions
     */
    renderTransition(ctx) {
        const progress = this.transitionState.elapsed / this.transitionState.duration;
        
        switch (this.transitionState.type) {
            case 'fade':
                ctx.save();
                ctx.globalAlpha = 1 - progress;
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
                break;
        }
    }
    
    /**
     * Show a scene
     */
    showScene(sceneName, transition = true) {
        const scene = this.scenes[sceneName];
        if (!scene) {
            console.error(`Scene ${sceneName} not found`);
            return false;
        }
        
        // Handle scene transition
        if (transition && this.currentScene) {
            this.startTransition(sceneName);
            return true;
        }
        
        // Hide current scene
        if (this.currentScene) {
            this.currentScene.hide();
            this.previousScene = this.currentScene;
        }
        
        // Show new scene
        this.currentScene = scene;
        scene.show();
        
        // Update game state scene
        if (this.game.gameState) {
            this.game.gameState.changeScene(sceneName);
        }
        
        // Show/hide HUD based on scene type
        this.updateHUDVisibility();
        
        console.log(`Scene changed to: ${sceneName}`);
        return true;
    }
    
    /**
     * Start scene transition
     */
    startTransition(targetScene) {
        this.transitionState = {
            active: true,
            duration: 0.3,
            elapsed: 0,
            type: 'fade',
            targetScene: targetScene
        };
    }
    
    /**
     * Complete scene transition
     */
    completeTransition() {
        const targetScene = this.transitionState.targetScene;
        this.transitionState.active = false;
        
        if (targetScene) {
            this.showScene(targetScene, false);
        }
    }
    
    /**
     * Return to previous scene
     */
    returnToPrevious() {
        if (this.previousScene) {
            this.showScene(this.previousScene.name);
        }
    }
    
    /**
     * Update HUD visibility based on current scene
     */
    updateHUDVisibility() {
        const hud = document.getElementById('game-hud');
        if (!hud) return;
        
        const showHUD = this.currentScene && 
                       (this.currentScene.config.type === 'game' || 
                        this.currentScene.config.overlay);
        
        hud.classList.toggle('hidden', !showHUD);
    }
    
    /**
     * Handle global keyboard shortcuts
     */
    handleGlobalKeys(event) {
        switch (event.key) {
            case 'Escape':
                this.handleEscape();
                break;
            case 'Enter':
                this.handleConfirm();
                break;
            case 'm':
            case 'M':
                if (this.currentScene?.name === 'game_world') {
                    this.showWorldMap();
                }
                break;
            case 'i':
            case 'I':
                if (this.currentScene?.name === 'game_world') {
                    this.showScene('inventory');
                }
                break;
            case 'p':
            case 'P':
                if (this.currentScene?.name === 'game_world') {
                    this.showScene('monster_management');
                }
                break;
        }
    }
    
    /**
     * Handle escape key
     */
    handleEscape() {
        if (this.currentScene?.config.overlay) {
            this.showScene('game_world');
        } else if (this.currentScene?.name === 'game_world') {
            this.showScene('settings');
        } else {
            this.returnToPrevious();
        }
    }
    
    /**
     * Handle confirm key
     */
    handleConfirm() {
        // Context-sensitive confirm action
        // Will be expanded based on current scene
    }
    
    // ================================================
    // SCENE ACTIONS
    // ================================================
    
    /**
     * Start new game
     */
    startNewGame() {
        if (this.game.gameState) {
            this.game.gameState.resetToDefaults();
        }
        this.showScene('character_select');
    }
    
    /**
     * Load saved game
     */
    loadGame() {
        if (typeof SaveSystem !== 'undefined') {
            const success = SaveSystem.loadGame();
            if (success) {
                this.showScene('game_world');
                this.showNotification('Game loaded successfully', 'success');
            } else {
                this.showNotification('No save file found', 'error');
            }
        }
    }
    
    /**
     * Start adventure with selected character
     */
    startAdventure() {
        const selectedClass = this.selectedElements.get('character_class');
        if (!selectedClass) {
            this.showNotification('Please select a character class', 'error');
            return;
        }
        
        if (this.game.gameState) {
            const success = this.game.gameState.setPlayerClass(selectedClass);
            if (success) {
                this.game.gameState.addStoryFlag('character_selected');
                this.showScene('game_world');
                this.showNotification(`Adventure begins as a ${selectedClass}!`, 'success');
            }
        }
    }
    
    /**
     * Show world map
     */
    showWorldMap() {
        // World map implementation
        this.showNotification('World map opened', 'info');
    }
    
    /**
     * Save game
     */
    saveGame() {
        if (typeof SaveSystem !== 'undefined') {
            const success = SaveSystem.saveGame();
            if (success) {
                this.showNotification('Game saved', 'success');
            } else {
                this.showNotification('Save failed', 'error');
            }
        }
    }
    
    /**
     * Update audio settings
     */
    updateAudioSettings() {
        // Audio system integration - placeholder
        console.log('Audio settings updated');
    }
    
    /**
     * Prompt user for two monster IDs and initiate breeding
     */
    promptBreeding() {
        const gameState = this.game.getGameState();
        if (!gameState) return;
        const input = window.prompt('Enter two monster IDs to breed (e.g., 1,2):');
        if (!input) return;
        const parts = input.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (parts.length !== 2) {
            this.showNotification('Please enter exactly two valid IDs', 'error');
            return;
        }
        this.breedMonsters(parts[0], parts[1]);
    }
    
    /**
     * Initiate breeding via GameState with notifications
     */
    breedMonsters(monsterId1, monsterId2) {
        const gameState = this.game.getGameState();
        if (!gameState) return;
        
        const check = gameState.canBreed(monsterId1, monsterId2);
        if (!check.canBreed) {
            this.showNotification(check.reason || 'Cannot breed these monsters', 'error');
            return;
        }
        const result = gameState.breed(monsterId1, monsterId2);
        if (result.success) {
            this.showNotification(`Breeding successful! Offspring added to storage.`, 'success');
        } else {
            this.showNotification(result.reason || 'Breeding failed', 'error');
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (this.game.gameState) {
            this.game.gameState.addNotification(message, type);
        }
    }
    
    /**
     * Show dialogue
     */
    showDialogue(dialogue, choices = null) {
        // Dialogue system implementation
        console.log('Showing dialogue:', dialogue);
    }
    
    /**
     * Hide all UI (for fullscreen game view)
     */
    hideAllUI() {
        document.getElementById('ui-overlay').classList.add('hidden');
        document.getElementById('game-hud').classList.add('hidden');
    }
    
    /**
     * Show all UI
     */
    showAllUI() {
        document.getElementById('ui-overlay').classList.remove('hidden');
        this.updateHUDVisibility();
    }
}

/**
 * Scene Class
 * Represents a single UI scene/screen
 */
class Scene {
    constructor(name, config) {
        this.name = name;
        this.config = config;
        this.visible = false;
        this.initialized = false;
    }
    
    /**
     * Show this scene
     */
    show() {
        if (this.config.element) {
            // Hide all other screens first
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            
            // Show this screen
            this.config.element.classList.add('active');
            this.visible = true;
            
            // Scene-specific initialization
            this.onShow();
        }
    }
    
    /**
     * Hide this scene
     */
    hide() {
        if (this.config.element) {
            this.config.element.classList.remove('active');
            this.visible = false;
            
            this.onHide();
        }
    }
    
    /**
     * Update scene
     */
    update(deltaTime) {
        if (!this.visible) return;
        
        // Scene-specific update logic
        this.onUpdate(deltaTime);
    }
    
    /**
     * Scene-specific show handler
     */
    onShow() {
        // Override in subclasses
    }
    
    /**
     * Scene-specific hide handler
     */
    onHide() {
        // Override in subclasses
    }
    
    /**
     * Scene-specific update handler
     */
    onUpdate(deltaTime) {
        // Override in subclasses
    }
}

// Make available globally
window.UIManager = UIManager;
window.Scene = Scene;