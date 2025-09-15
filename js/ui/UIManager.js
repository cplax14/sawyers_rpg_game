/**
 * Modular UI Manager
 * Main coordinator for the new modular UI system
 * Handles module registration, communication, and overall UI orchestration
 */
class UIManager extends EventTarget {
    constructor(game, options = {}) {
        super();
        
        this.game = game;
        this.modules = new Map();
        this.isInitialized = false;
        
        // Initialize core components
        this.sceneManager = new SceneManager(options.sceneManager || {});
        this.notificationManager = new NotificationManager(
            window.uiHelpers, 
            this.game?.getGameState ? this.game.getGameState() : null
        );
        
        // Module loading system
        this.moduleLoader = new UIModuleLoader();
        this.loadingPromise = null;
        
        // UI state management
        this.state = {
            currentModule: null,
            previousModule: null,
            hudVisible: false,
            overlaysOpen: new Set(),
            keyboardFocus: null,
            inputMode: 'default' // 'default', 'combat', 'dialogue', etc.
        };
        
        // Event handling
        this.eventHandlers = new Map();
        this.keyboardHandlers = new Map();
        
        // Configuration
        this.config = {
            enableModuleTransitions: options.enableModuleTransitions !== false,
            enableKeyboardShortcuts: options.enableKeyboardShortcuts !== false,
            enableModuleCommunication: options.enableModuleCommunication !== false,
            autoLoadModules: options.autoLoadModules !== false,
            debugMode: options.debugMode || false,
            ...options
        };
        
        // Legacy compatibility layer
        this.legacyCompatibility = {
            scenes: this.sceneManager.scenes,
            currentScene: null,
            previousScene: null,
            showNotification: this.showNotification.bind(this)
        };
        
        console.log('✅ UIManager initialized (modular version)');
        
        // Auto-initialize if configured
        if (this.config.autoInit !== false) {
            this.init();
        }
    }

    // ===================================
    // INITIALIZATION AND LIFECYCLE
    // ===================================

    /**
     * Initialize the UI Manager
     */
    async init() {
        if (this.isInitialized) {
            console.warn('UIManager already initialized');
            return;
        }

        try {
            // Set up core event listeners
            this.setupCoreEventListeners();
            
            // Initialize legacy compatibility
            this.setupLegacyCompatibility();
            
            // Auto-load modules if configured
            if (this.config.autoLoadModules) {
                await this.loadAllModules();
            }
            
            // Set up default scenes for legacy compatibility
            this.setupDefaultScenes();
            
            // Initialize HUD visibility
            this.updateHUDVisibility();
            
            this.isInitialized = true;
            
            console.log('✅ UIManager fully initialized');
            this.emit('initialized', { manager: this });
            
        } catch (error) {
            console.error('❌ Failed to initialize UIManager:', error);
            throw error;
        }
    }

    /**
     * Set up core event listeners
     */
    setupCoreEventListeners() {
        // Keyboard shortcuts
        if (this.config.enableKeyboardShortcuts) {
            document.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
        
        // Window events
        window.addEventListener('resize', this.handleResize.bind(this));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        
        // Game state changes
        if (this.game && typeof this.game.addEventListener === 'function') {
            this.game.addEventListener('stateChanged', this.handleGameStateChange.bind(this));
        }
    }

    /**
     * Set up legacy compatibility layer
     */
    setupLegacyCompatibility() {
        // Map scene manager events to legacy properties
        this.sceneManager.addEventListener('sceneChanged', (event) => {
            this.legacyCompatibility.currentScene = event.detail.current;
            this.legacyCompatibility.previousScene = event.detail.previous;
        });
        
        // Update notification manager with current game state
        if (this.game?.getGameState) {
            this.notificationManager.setGameState(this.game.getGameState());
        }
    }

    /**
     * Set up default scenes for backward compatibility
     */
    setupDefaultScenes() {
        const defaultScenes = {
            main_menu: {
                element: document.getElementById('main-menu'),
                type: 'menu'
            },
            character_select: {
                element: document.getElementById('character-select'),
                type: 'menu'
            },
            game_world: {
                element: document.getElementById('game-world'),
                type: 'game'
            },
            combat: {
                element: document.getElementById('combat'),
                type: 'game'
            },
            monster_management: {
                element: document.getElementById('monster-management'),
                type: 'menu'
            },
            inventory: {
                element: document.getElementById('inventory'),
                type: 'menu'
            },
            settings: {
                element: document.getElementById('settings'),
                type: 'menu'
            }
        };

        this.sceneManager.registerScenes(defaultScenes);
    }

    // ===================================
    // MODULE MANAGEMENT
    // ===================================

    /**
     * Register a UI module
     */
    registerModule(name, moduleInstance) {
        if (this.modules.has(name)) {
            console.warn(`Module ${name} already registered, replacing...`);
        }
        
        this.modules.set(name, moduleInstance);
        
        // Set up module communication if enabled
        if (this.config.enableModuleCommunication) {
            this.setupModuleCommunication(name, moduleInstance);
        }
        
        console.log(`📋 Registered module: ${name}`);
        this.emit('moduleRegistered', { name, module: moduleInstance });
        
        return moduleInstance;
    }

    /**
     * Get a registered module
     */
    getModule(name) {
        return this.modules.get(name);
    }

    /**
     * Check if module is registered
     */
    hasModule(name) {
        return this.modules.has(name);
    }

    /**
     * Get all registered modules
     */
    getAllModules() {
        return new Map(this.modules);
    }

    /**
     * Load all modules using the module loader
     */
    async loadAllModules() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._performModuleLoading();
        return this.loadingPromise;
    }

    /**
     * Perform the actual module loading
     */
    async _performModuleLoading() {
        try {
            // Set up default module configuration
            const moduleConfig = UIModuleLoader.createDefaultConfiguration();
            this.moduleLoader.registerModules(moduleConfig);
            
            // Set up loading callbacks
            this.moduleLoader.setCallbacks({
                onProgress: (moduleName, status) => {
                    console.log(`📦 Loading module: ${moduleName} (${status.loaded}/${status.total})`);
                    this.emit('moduleLoadProgress', { moduleName, status });
                },
                onComplete: (status) => {
                    console.log('✅ All modules loaded successfully');
                    this.emit('modulesLoaded', { status });
                },
                onError: (error, status) => {
                    console.error('❌ Module loading failed:', error);
                    this.emit('moduleLoadError', { error, status });
                }
            });
            
            // Load modules
            await this.moduleLoader.loadModules();
            
            // Initialize loaded modules
            this.moduleLoader.initializeModules(this);
            
            console.log('✅ All modules loaded and initialized');
            
        } catch (error) {
            console.error('❌ Failed to load modules:', error);
            throw error;
        } finally {
            this.loadingPromise = null;
        }
    }

    /**
     * Set up communication for a module
     */
    setupModuleCommunication(name, moduleInstance) {
        // Allow modules to communicate through the manager
        if (moduleInstance && typeof moduleInstance.on === 'function') {
            // Relay module events through the manager
            const originalOn = moduleInstance.on.bind(moduleInstance);
            moduleInstance.on = (eventName, handler) => {
                // Also listen on the manager
                this.addEventListener(eventName, handler);
                return originalOn(eventName, handler);
            };
        }
    }

    // ===================================
    // SCENE MANAGEMENT (Legacy Compatibility)
    // ===================================

    /**
     * Show a scene (legacy compatibility)
     */
    showScene(sceneName, transition = true) {
        const success = this.sceneManager.showScene(sceneName, transition);
        
        if (success) {
            // Update legacy compatibility
            this.legacyCompatibility.currentScene = this.sceneManager.getCurrentScene();
            this.legacyCompatibility.previousScene = this.sceneManager.getPreviousScene();
            
            // Update HUD visibility
            this.updateHUDVisibility();
            
            // Emit legacy event
            this.emit('sceneChanged', {
                sceneName,
                scene: this.sceneManager.getCurrentScene()
            });
        }
        
        return success;
    }

    /**
     * Get current scene (legacy compatibility)
     */
    getCurrentScene() {
        return this.sceneManager.getCurrentScene();
    }

    /**
     * Return to previous scene (legacy compatibility)
     */
    returnToPrevious() {
        return this.sceneManager.returnToPrevious();
    }

    // ===================================
    // NOTIFICATION SYSTEM
    // ===================================

    /**
     * Show notification (legacy compatibility)
     */
    showNotification(message, type = 'info') {
        return this.notificationManager.showNotification(message, type);
    }

    /**
     * Get notification manager
     */
    getNotificationManager() {
        return this.notificationManager;
    }

    // ===================================
    // EVENT HANDLING AND COMMUNICATION
    // ===================================

    /**
     * Emit an event (enhanced EventTarget)
     */
    emit(eventName, data) {
        const event = new CustomEvent(eventName, { detail: data });
        this.dispatchEvent(event);
        
        if (this.config.debugMode) {
            console.log(`🔔 Event emitted: ${eventName}`, data);
        }
    }

    /**
     * Listen for events (enhanced EventTarget)
     */
    on(eventName, handler) {
        this.addEventListener(eventName, handler);
        return () => this.removeEventListener(eventName, handler);
    }

    /**
     * Handle keyboard input
     */
    handleKeyDown(event) {
        // Check for registered keyboard handlers
        const handler = this.keyboardHandlers.get(event.key);
        if (handler && typeof handler === 'function') {
            const result = handler(event);
            if (result === false) {
                event.preventDefault();
                return;
            }
        }
        
        // Default keyboard shortcuts
        switch (event.key) {
            case 'Escape':
                this.handleEscapeKey(event);
                break;
            case 'F1':
                event.preventDefault();
                this.showHelp();
                break;
            // Add more default shortcuts as needed
        }
    }

    /**
     * Handle escape key
     */
    handleEscapeKey(event) {
        // Close any open overlays first
        if (this.state.overlaysOpen.size > 0) {
            this.closeAllOverlays();
            event.preventDefault();
            return;
        }
        
        // Scene-specific escape handling
        const currentScene = this.getCurrentScene();
        if (currentScene?.name === 'settings' || currentScene?.name === 'inventory') {
            this.returnToPrevious();
            event.preventDefault();
        }
    }

    /**
     * Register keyboard shortcut
     */
    registerKeyboardShortcut(key, handler) {
        this.keyboardHandlers.set(key, handler);
    }

    /**
     * Handle window resize
     */
    handleResize(event) {
        // Update all modules about resize
        this.modules.forEach((module, name) => {
            if (module.isVisible && typeof module.onResize === 'function') {
                module.onResize(event);
            }
        });
        
        this.emit('resize', { event });
    }

    /**
     * Handle game state changes
     */
    handleGameStateChange(event) {
        // Update notification manager
        if (this.game?.getGameState) {
            this.notificationManager.setGameState(this.game.getGameState());
        }
        
        // Notify modules
        this.emit('gameStateChanged', event.detail || event);
    }

    /**
     * Handle before unload
     */
    handleBeforeUnload(event) {
        // Perform cleanup
        this.cleanup();
    }

    // ===================================
    // UI STATE MANAGEMENT
    // ===================================

    /**
     * Update HUD visibility based on current scene
     */
    updateHUDVisibility() {
        const hud = document.getElementById('game-hud');
        if (!hud) return;
        
        const currentScene = this.getCurrentScene();
        const showHUD = currentScene && 
                       (currentScene.config?.type === 'game' || 
                        currentScene.name === 'game_world');
        
        this.state.hudVisible = showHUD;
        hud.classList.toggle('hidden', !showHUD);
        
        this.emit('hudVisibilityChanged', { visible: showHUD });
    }

    /**
     * Open overlay
     */
    openOverlay(overlayName) {
        this.state.overlaysOpen.add(overlayName);
        this.emit('overlayOpened', { overlay: overlayName });
    }

    /**
     * Close overlay
     */
    closeOverlay(overlayName) {
        this.state.overlaysOpen.delete(overlayName);
        this.emit('overlayClosed', { overlay: overlayName });
    }

    /**
     * Close all overlays
     */
    closeAllOverlays() {
        const overlays = Array.from(this.state.overlaysOpen);
        this.state.overlaysOpen.clear();
        
        overlays.forEach(overlay => {
            this.emit('overlayClosed', { overlay });
        });
        
        this.emit('allOverlaysClosed', { overlays });
    }

    /**
     * Set input mode
     */
    setInputMode(mode) {
        const previousMode = this.state.inputMode;
        this.state.inputMode = mode;
        
        this.emit('inputModeChanged', { 
            mode, 
            previousMode 
        });
    }

    /**
     * Get current input mode
     */
    getInputMode() {
        return this.state.inputMode;
    }

    // ===================================
    // MODULE LIFECYCLE COORDINATION
    // ===================================

    /**
     * Update all modules
     */
    update(deltaTime) {
        // Update scene manager
        this.sceneManager.update(deltaTime);
        
        // Update visible modules
        this.modules.forEach((module, name) => {
            if (module.isVisible && typeof module.update === 'function') {
                try {
                    module.update(deltaTime);
                } catch (error) {
                    console.error(`Error updating module ${name}:`, error);
                }
            }
        });
    }

    /**
     * Render all modules (if canvas-based rendering is needed)
     */
    render(ctx) {
        // Render scene manager
        this.sceneManager.render(ctx);
        
        // Render visible modules
        this.modules.forEach((module, name) => {
            if (module.isVisible && typeof module.render === 'function') {
                try {
                    module.render(ctx);
                } catch (error) {
                    console.error(`Error rendering module ${name}:`, error);
                }
            }
        });
    }

    // ===================================
    // UTILITY METHODS
    // ===================================

    /**
     * Show help/documentation
     */
    showHelp() {
        // TODO: Implement help system
        this.showNotification('Help system not yet implemented', 'info');
    }

    /**
     * Get UI state
     */
    getUIState() {
        return {
            ...this.state,
            currentScene: this.getCurrentScene()?.name,
            registeredModules: Array.from(this.modules.keys()),
            isInitialized: this.isInitialized
        };
    }

    /**
     * Debug info
     */
    getDebugInfo() {
        return {
            modules: Array.from(this.modules.entries()).map(([name, module]) => ({
                name,
                isInitialized: module.isInitialized,
                isVisible: module.isVisible,
                info: typeof module.getInfo === 'function' ? module.getInfo() : null
            })),
            scenes: this.sceneManager.getAllScenes(),
            currentScene: this.getCurrentScene()?.name,
            state: this.state,
            config: this.config
        };
    }

    // ===================================
    // LEGACY COMPATIBILITY METHODS
    // ===================================

    /**
     * Legacy method compatibility for existing code
     */
    
    // From original UIManager
    attachButton(buttonId, callback) {
        return window.uiHelpers?.attachButton(buttonId, callback);
    }
    
    // Scene management passthrough
    get scenes() {
        return this.legacyCompatibility.scenes;
    }
    
    get currentScene() {
        return this.legacyCompatibility.currentScene;
    }
    
    get previousScene() {
        return this.legacyCompatibility.previousScene;
    }

    // ===================================
    // CLEANUP
    // ===================================

    /**
     * Clean up resources
     */
    cleanup() {
        // Clean up modules
        this.modules.forEach((module, name) => {
            if (typeof module.cleanup === 'function') {
                try {
                    module.cleanup();
                } catch (error) {
                    console.error(`Error cleaning up module ${name}:`, error);
                }
            }
        });
        
        // Clean up scene manager
        this.sceneManager.cleanup();
        
        // Clean up notification manager
        this.notificationManager.cleanup();
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        
        // Clear state
        this.modules.clear();
        this.eventHandlers.clear();
        this.keyboardHandlers.clear();
        this.state.overlaysOpen.clear();
        
        this.isInitialized = false;
        
        console.log('🧹 UIManager cleaned up');
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
} else if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}