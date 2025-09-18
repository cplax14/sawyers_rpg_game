/**
 * Base UI Module Class
 * Defines standard interface and lifecycle methods for all UI modules
 */
class BaseUIModule {
    constructor(name, uiManager, options = {}) {
        this.name = name;
        this.uiManager = uiManager;
        this.game = uiManager?.game;
        this.isInitialized = false;
        this.isVisible = false;
        this.eventListeners = [];
        this.options = { ...this.getDefaultOptions(), ...options };
        
        // Module state
        this.state = {};
        this.elements = {};
    }

    /**
     * Get default options for the module
     * Override in subclasses to provide module-specific defaults
     */
    getDefaultOptions() {
        return {
            autoInit: true,
            persistent: false, // Whether module stays in memory when hidden
            transition: 'fade'
        };
    }

    /**
     * Initialize the module
     * Called once when module is first loaded
     */
    init() {
        if (this.isInitialized) {
            console.warn(`Module ${this.name} already initialized`);
            return;
        }

        try {
            this.cacheElements();
            this.attachEvents();
            this.setupState();
            this.isInitialized = true;
            console.log(`✅ Module ${this.name} initialized`);
        } catch (error) {
            console.error(`❌ Failed to initialize module ${this.name}:`, error);
            throw error;
        }
    }

    /**
     * Cache DOM elements used by this module
     * Override in subclasses to cache specific elements
     */
    cacheElements() {
        // Default implementation - override in subclasses
    }

    /**
     * Attach event listeners for this module
     * Override in subclasses to attach specific events
     */
    attachEvents() {
        // Default implementation - override in subclasses
    }

    /**
     * Set up initial state for the module
     * Override in subclasses for module-specific state setup
     */
    setupState() {
        // Default implementation - override in subclasses
    }

    /**
     * Show/activate the module
     * @param {Object} data - Optional data to pass to the module
     */
    show(data = {}) {
        if (!this.isInitialized) {
            this.init();
        }

        this.isVisible = true;
        this.onShow(data);
        
        // Trigger show event
        this.emit('show', { module: this.name, data });
    }

    /**
     * Hide/deactivate the module
     */
    hide() {
        if (!this.isVisible) return;

        this.isVisible = false;
        this.onHide();
        
        // Trigger hide event
        this.emit('hide', { module: this.name });
    }

    /**
     * Called when module is shown
     * Override in subclasses for show-specific logic
     */
    onShow(data) {
        // Default implementation - override in subclasses
    }

    /**
     * Called when module is hidden
     * Override in subclasses for hide-specific logic
     */
    onHide() {
        // Default implementation - override in subclasses
    }

    /**
     * Update the module
     * Called during game update loop if module is visible
     */
    update(deltaTime) {
        if (!this.isVisible) return;
        this.onUpdate(deltaTime);
    }

    /**
     * Called during update cycle
     * Override in subclasses for update logic
     */
    onUpdate(deltaTime) {
        // Default implementation - override in subclasses
    }

    /**
     * Clean up the module
     * Remove event listeners and free resources
     */
    cleanup() {
        this.removeAllEventListeners();
        this.onCleanup();
        this.isInitialized = false;
        this.isVisible = false;
        
        console.log(`🧹 Module ${this.name} cleaned up`);
    }

    /**
     * Called during cleanup
     * Override in subclasses for cleanup-specific logic
     */
    onCleanup() {
        // Default implementation - override in subclasses
    }

    /**
     * Add an event listener and track it for cleanup
     */
    addEventListener(element, event, handler, options) {
        if (!element || typeof handler !== 'function') return;

        element.addEventListener(event, handler, options);
        this.eventListeners.push({ element, event, handler, options });
    }

    /**
     * Remove all tracked event listeners
     */
    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(event, handler, options);
            }
        });
        this.eventListeners = [];
    }

    /**
     * Emit an event through the UI manager
     */
    emit(eventName, data) {
        if (this.uiManager && typeof this.uiManager.emit === 'function') {
            this.uiManager.emit(eventName, data);
        }
    }

    /**
     * Listen for events through the UI manager
     */
    on(eventName, handler) {
        if (this.uiManager && typeof this.uiManager.on === 'function') {
            this.uiManager.on(eventName, handler);
        }
    }

    /**
     * Attach a button click by ID using UIManager helper or UIHelpers
     */
    attachButton(buttonId, callback) {
        if (this.uiManager && typeof this.uiManager.attachButton === 'function') {
            return this.uiManager.attachButton(buttonId, callback);
        }
        if (window.uiHelpers && typeof window.uiHelpers.attachButton === 'function') {
            return window.uiHelpers.attachButton(buttonId, callback);
        }
        // Fallback direct binding
        const el = document.getElementById(buttonId);
        if (el) {
            el.addEventListener('click', callback);
            return true;
        }
        console.warn(`[BaseUIModule] Button ${buttonId} not found`);
        return false;
    }

    /**
     * Show a notification through the UI manager
     */
    showNotification(message, type = 'info') {
        if (this.uiManager && typeof this.uiManager.showNotification === 'function') {
            this.uiManager.showNotification(message, type);
        }
    }

    /** Notification convenience wrappers used by modules */
    notifySuccess(message) { this.showNotification(message, 'success'); }
    notifyError(message) { this.showNotification(message, 'error'); }
    notifyWarning(message) { this.showNotification(message, 'warning'); }
    notifyInfo(message) { this.showNotification(message, 'info'); }

    /**
     * Lightweight message proxy to UIManager to preserve legacy call sites
     * Example: this.sendMessage('showScene', { sceneName: 'character_select' })
     */
    sendMessage(method, payload = {}) {
        if (!this.uiManager) return null;
        try {
            switch (method) {
                case 'showScene':
                    return this.uiManager.showScene(payload.sceneName, payload.transition);
                case 'getPreviousScene':
                    return this.uiManager.getPreviousScene ? this.uiManager.getPreviousScene() : null;
                case 'getCurrentScene':
                    return this.uiManager.getCurrentScene ? this.uiManager.getCurrentScene() : null;
                case 'hasScene':
                    if (this.uiManager.sceneManager && typeof this.uiManager.sceneManager.hasScene === 'function') {
                        return this.uiManager.sceneManager.hasScene(payload.sceneName);
                    }
                    return typeof this.uiManager.hasScene === 'function' ? this.uiManager.hasScene(payload.sceneName) : false;
                case 'showNotification':
                    return this.uiManager.showNotification(payload.message, payload.type);
                default:
                    if (typeof this.uiManager[method] === 'function') {
                        return this.uiManager[method](payload);
                    }
            }
        } catch (e) {
            console.warn(`[BaseUIModule] sendMessage failed for ${method}:`, e);
        }
        return null;
    }

    /**
     * Get current game state
     */
    getGameState() {
        return this.game && typeof this.game.getGameState === 'function' 
            ? this.game.getGameState() 
            : null;
    }

    /**
     * Get a reference from the game object (e.g., 'gameState')
     */
    getGameReference(property) {
        if (this.uiManager && this.uiManager.game) {
            return this.uiManager.game[property];
        }
        if (this.game) {
            return this.game[property];
        }
        return null;
    }

    /**
     * Validate that required elements exist
     */
    validateElements(requiredElements) {
        const missing = [];
        
        for (const elementId of requiredElements) {
            const element = document.getElementById(elementId);
            if (!element) {
                missing.push(elementId);
            }
        }

        if (missing.length > 0) {
            throw new Error(`Module ${this.name} missing required elements: ${missing.join(', ')}`);
        }
    }

    /**
     * Get module info for debugging
     */
    getInfo() {
        return {
            name: this.name,
            isInitialized: this.isInitialized,
            isVisible: this.isVisible,
            eventListenerCount: this.eventListeners.length,
            options: this.options
        };
    }
}

// Export for module loading
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaseUIModule;
} else if (typeof window !== 'undefined') {
    window.BaseUIModule = BaseUIModule;
}