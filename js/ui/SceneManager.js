/**
 * Scene Manager
 * Extracted scene management utilities from the original ui.js
 * Handles scene transitions, Scene class, and related functionality
 */

/**
 * Scene Class
 * Represents a single UI scene/screen
 * Extracted from original ui.js lines 3615-3684
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
    
    /**
     * Get monster icon based on species
     * Extracted from original Scene class
     */
    getMonsterIcon(species) {
        const iconMap = {
            // Common monsters
            'slime': '💧',
            'goblin': '👹',
            'wolf': '🐺',
            'orc': '😤',
            
            // Forest monsters
            'dire_wolf': '🐺',
            'alpha_wolf': '🐺',
            'treant': '🌲',
            
            // Plains monsters
            'wild_horse': '🐎',
            'hawk': '🦅',
            
            // Mountain monsters
            'mountain_goat': '🐐',
            'rock_lizard': '🦎',
            
            // Cave monsters
            'bat': '🦇',
            'crystal_spider': '🕷️',
            'gem_slime': '💎',
            'cave_troll': '👹',
            
            // Desert monsters
            'sand_worm': '🪱',
            'cactus_sprite': '🌵',
            'mirage_cat': '🐱',
            
            // Legendary monsters
            'phoenix': '🔥',
            'dragon': '🐲',
            'leviathan': '🌊',
            'earth_titan': '🗿'
        };
        
        return iconMap[species] || '❓';
    }
}

/**
 * Scene Transition Manager
 * Handles scene transitions and animation
 * Extracted from original UIManager transition methods
 */
class SceneTransitionManager {
    constructor() {
        this.transitionState = {
            active: false,
            duration: 0.3,
            elapsed: 0,
            type: 'fade',
            targetScene: null
        };
        
        this.transitionTypes = {
            fade: this.renderFadeTransition.bind(this),
            slide: this.renderSlideTransition.bind(this),
            scale: this.renderScaleTransition.bind(this)
        };
    }

    /**
     * Begin a scene transition
     * Extracted from original startTransition method
     */
    startTransition(targetScene, options = {}) {
        this.transitionState = {
            active: true,
            duration: options.duration || this.transitionState.duration || 0.3,
            elapsed: 0,
            type: options.type || this.transitionState.type || 'fade',
            targetScene: targetScene,
            direction: options.direction || 'forward'
        };
        
        console.log(`🎬 Starting transition to ${targetScene} (${this.transitionState.type})`);
    }

    /**
     * Update scene transitions
     * Extracted from original updateTransition method
     */
    updateTransition(deltaTime) {
        if (!this.transitionState.active) return;
        
        this.transitionState.elapsed += deltaTime;
        
        if (this.transitionState.elapsed >= this.transitionState.duration) {
            this.completeTransition();
        }
    }

    /**
     * Complete the current scene transition
     * Extracted from original completeTransition method
     */
    completeTransition() {
        const targetScene = this.transitionState?.targetScene;
        const onComplete = this.transitionState?.onComplete;
        
        this.transitionState.active = false;
        this.transitionState.elapsed = 0;
        this.transitionState.targetScene = null;
        
        if (onComplete && typeof onComplete === 'function') {
            onComplete(targetScene);
        }
        
        console.log(`✅ Transition completed to ${targetScene}`);
    }

    /**
     * Check if transition is active
     */
    isTransitioning() {
        return this.transitionState.active;
    }

    /**
     * Get transition progress (0-1)
     */
    getTransitionProgress() {
        if (!this.transitionState.active) return 1;
        return Math.min(this.transitionState.elapsed / this.transitionState.duration, 1);
    }

    /**
     * Render scene transitions on canvas
     * Extracted from original renderTransition method
     */
    renderTransition(ctx) {
        if (!this.transitionState.active) return;
        
        const transitionRenderer = this.transitionTypes[this.transitionState.type];
        if (transitionRenderer) {
            transitionRenderer(ctx);
        }
    }

    /**
     * Render fade transition
     */
    renderFadeTransition(ctx) {
        const progress = this.getTransitionProgress();
        
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    /**
     * Render slide transition
     */
    renderSlideTransition(ctx) {
        const progress = this.getTransitionProgress();
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        ctx.save();
        
        // Slide direction based on transition direction
        const slideOffset = this.transitionState.direction === 'forward' 
            ? width * (1 - progress)
            : -width * (1 - progress);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(slideOffset, 0, width, height);
        
        ctx.restore();
    }

    /**
     * Render scale transition
     */
    renderScaleTransition(ctx) {
        const progress = this.getTransitionProgress();
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const scale = progress;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
        
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.restore();
    }

    /**
     * Set transition duration
     */
    setTransitionDuration(duration) {
        this.transitionState.duration = duration;
    }

    /**
     * Set default transition type
     */
    setTransitionType(type) {
        if (this.transitionTypes[type]) {
            this.transitionState.type = type;
        } else {
            console.warn(`Unknown transition type: ${type}`);
        }
    }

    /**
     * Add custom transition type
     */
    addTransitionType(name, renderer) {
        if (typeof renderer === 'function') {
            this.transitionTypes[name] = renderer;
        }
    }
}

/**
 * Enhanced Scene Manager
 * Manages multiple scenes with transitions and state
 */
class SceneManager {
    constructor(options = {}) {
        this.scenes = new Map();
        this.currentScene = null;
        this.previousScene = null;
        this.sceneStack = [];
        
        // Initialize transition manager
        this.transitionManager = new SceneTransitionManager();
        
        // Configuration
        this.options = {
            enableTransitions: options.enableTransitions !== false,
            defaultTransition: options.defaultTransition || 'fade',
            transitionDuration: options.transitionDuration || 0.3,
            trackHistory: options.trackHistory !== false,
            maxHistorySize: options.maxHistorySize || 10
        };
        
        console.log('✅ SceneManager initialized');
    }

    /**
     * Register a scene
     */
    registerScene(name, config) {
        const scene = new Scene(name, config);
        this.scenes.set(name, scene);
        
        console.log(`📋 Registered scene: ${name}`);
        return scene;
    }

    /**
     * Register multiple scenes
     */
    registerScenes(sceneConfigs) {
        Object.entries(sceneConfigs).forEach(([name, config]) => {
            this.registerScene(name, config);
        });
    }

    /**
     * Show a scene with optional transition
     * Enhanced version of original showScene method
     */
    showScene(sceneName, transition = true, transitionOptions = {}) {
        const scene = this.scenes.get(sceneName);
        if (!scene) {
            console.error(`Scene ${sceneName} not found`);
            return false;
        }

        // Handle scene transition if enabled and current scene exists
        if (transition && this.options.enableTransitions && this.currentScene) {
            // Setup transition with completion callback
            const options = {
                ...transitionOptions,
                type: transitionOptions.type || this.options.defaultTransition,
                duration: transitionOptions.duration || this.options.transitionDuration,
                onComplete: () => this._performSceneSwitch(scene)
            };
            
            this.transitionManager.startTransition(sceneName, options);
            return true;
        }

        // Direct scene switch without transition
        this._performSceneSwitch(scene);
        return true;
    }

    /**
     * Perform the actual scene switch
     */
    _performSceneSwitch(scene) {
        // Hide current scene
        if (this.currentScene) {
            this.currentScene.hide();
            this.previousScene = this.currentScene;
            
            // Add to history if tracking is enabled
            if (this.options.trackHistory) {
                this.sceneStack.push(this.currentScene.name);
                
                // Limit history size
                if (this.sceneStack.length > this.options.maxHistorySize) {
                    this.sceneStack.shift();
                }
            }
        }

        // Show new scene
        this.currentScene = scene;
        scene.show();

        console.log(`🎬 Switched to scene: ${scene.name}`);
    }

    /**
     * Return to previous scene
     */
    returnToPrevious() {
        if (this.previousScene && this.previousScene.name) {
            this.showScene(this.previousScene.name);
            return true;
        }
        
        // Try to go back in history
        if (this.options.trackHistory && this.sceneStack.length > 0) {
            const previousSceneName = this.sceneStack.pop();
            this.showScene(previousSceneName);
            return true;
        }
        
        console.warn('No previous scene to return to');
        return false;
    }

    /**
     * Get current scene
     */
    getCurrentScene() {
        return this.currentScene;
    }

    /**
     * Get previous scene
     */
    getPreviousScene() {
        return this.previousScene;
    }

    /**
     * Check if scene exists
     */
    hasScene(sceneName) {
        return this.scenes.has(sceneName);
    }

    /**
     * Get scene by name
     */
    getScene(sceneName) {
        return this.scenes.get(sceneName);
    }

    /**
     * Update scenes and transitions
     */
    update(deltaTime) {
        // Update transitions
        this.transitionManager.updateTransition(deltaTime);
        
        // Update current scene
        if (this.currentScene && !this.transitionManager.isTransitioning()) {
            this.currentScene.update(deltaTime);
        }
    }

    /**
     * Render scenes and transitions
     */
    render(ctx) {
        // Render current scene (if it has custom rendering)
        if (this.currentScene && typeof this.currentScene.render === 'function') {
            this.currentScene.render(ctx);
        }
        
        // Render transitions
        this.transitionManager.renderTransition(ctx);
    }

    /**
     * Get scene history
     */
    getSceneHistory() {
        return [...this.sceneStack];
    }

    /**
     * Clear scene history
     */
    clearHistory() {
        this.sceneStack = [];
    }

    /**
     * Set transition options
     */
    setTransitionOptions(options) {
        this.options = { ...this.options, ...options };
        
        if (options.defaultTransition) {
            this.transitionManager.setTransitionType(options.defaultTransition);
        }
        
        if (options.transitionDuration) {
            this.transitionManager.setTransitionDuration(options.transitionDuration);
        }
    }

    /**
     * Enable/disable transitions
     */
    setTransitionsEnabled(enabled) {
        this.options.enableTransitions = enabled;
    }

    /**
     * Get all registered scenes
     */
    getAllScenes() {
        return Array.from(this.scenes.keys());
    }

    /**
     * Remove a scene
     */
    removeScene(sceneName) {
        if (this.currentScene?.name === sceneName) {
            console.warn(`Cannot remove active scene: ${sceneName}`);
            return false;
        }
        
        return this.scenes.delete(sceneName);
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        // Hide current scene
        if (this.currentScene) {
            this.currentScene.hide();
        }
        
        // Clear all scenes
        this.scenes.clear();
        this.currentScene = null;
        this.previousScene = null;
        this.sceneStack = [];
        
        console.log('🧹 SceneManager cleaned up');
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Scene, SceneTransitionManager, SceneManager };
} else if (typeof window !== 'undefined') {
    window.Scene = Scene;
    window.SceneTransitionManager = SceneTransitionManager;
    window.SceneManager = SceneManager;
}