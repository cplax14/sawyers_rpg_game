/**
 * Enhanced Transition Controller
 * Advanced scene transition management and HUD visibility control
 */

/**
 * Transition Effects Library
 * Collection of transition effects for scenes and UI elements
 */
class TransitionEffects {
    constructor() {
        this.effects = new Map();
        this.setupDefaultEffects();
    }

    /**
     * Set up default transition effects
     */
    setupDefaultEffects() {
        // Fade transitions
        this.addEffect('fade', {
            duration: 300,
            render: this.renderFade.bind(this),
            css: this.applyCSSFade.bind(this)
        });

        this.addEffect('fadeBlack', {
            duration: 500,
            render: this.renderFadeBlack.bind(this),
            css: this.applyCSSFadeBlack.bind(this)
        });

        // Slide transitions
        this.addEffect('slideLeft', {
            duration: 400,
            render: this.renderSlideLeft.bind(this),
            css: this.applyCSSSlideLeft.bind(this)
        });

        this.addEffect('slideRight', {
            duration: 400,
            render: this.renderSlideRight.bind(this),
            css: this.applyCSSSlideRight.bind(this)
        });

        this.addEffect('slideUp', {
            duration: 400,
            render: this.renderSlideUp.bind(this),
            css: this.applyCSSSlideUp.bind(this)
        });

        this.addEffect('slideDown', {
            duration: 400,
            render: this.renderSlideDown.bind(this),
            css: this.applyCSSSlideDown.bind(this)
        });

        // Scale transitions
        this.addEffect('scaleIn', {
            duration: 350,
            render: this.renderScaleIn.bind(this),
            css: this.applyCSSScaleIn.bind(this)
        });

        this.addEffect('scaleOut', {
            duration: 350,
            render: this.renderScaleOut.bind(this),
            css: this.applyCSSScaleOut.bind(this)
        });

        // Special effects
        this.addEffect('iris', {
            duration: 600,
            render: this.renderIris.bind(this),
            css: this.applyCSSIris.bind(this)
        });

        this.addEffect('pixelate', {
            duration: 500,
            render: this.renderPixelate.bind(this),
            css: this.applyCSSPixelate.bind(this)
        });
    }

    /**
     * Add a transition effect
     */
    addEffect(name, config) {
        this.effects.set(name, config);
    }

    /**
     * Get transition effect
     */
    getEffect(name) {
        return this.effects.get(name);
    }

    // Fade effect implementations
    renderFade(ctx, progress) {
        ctx.save();
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    applyCSSFade(element, progress, direction = 'out') {
        const opacity = direction === 'out' ? 1 - progress : progress;
        element.style.opacity = opacity;
    }

    renderFadeBlack(ctx, progress) {
        ctx.save();
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    applyCSSFadeBlack(element, progress, direction = 'out') {
        const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
        if (direction === 'out') {
            element.style.opacity = 1 - alpha;
        } else {
            element.style.opacity = alpha;
        }
    }

    // Slide effect implementations
    renderSlideLeft(ctx, progress) {
        const width = ctx.canvas.width;
        const offset = width * progress;
        
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(-offset, 0, width, ctx.canvas.height);
        ctx.restore();
    }

    applyCSSSlideLeft(element, progress, direction = 'out') {
        const translateX = direction === 'out' ? -100 * progress : 100 * (1 - progress);
        element.style.transform = `translateX(${translateX}%)`;
    }

    renderSlideRight(ctx, progress) {
        const width = ctx.canvas.width;
        const offset = width * (1 - progress);
        
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(offset, 0, width, ctx.canvas.height);
        ctx.restore();
    }

    applyCSSSlideRight(element, progress, direction = 'out') {
        const translateX = direction === 'out' ? 100 * progress : -100 * (1 - progress);
        element.style.transform = `translateX(${translateX}%)`;
    }

    renderSlideUp(ctx, progress) {
        const height = ctx.canvas.height;
        const offset = height * progress;
        
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, -offset, ctx.canvas.width, height);
        ctx.restore();
    }

    applyCSSSlideUp(element, progress, direction = 'out') {
        const translateY = direction === 'out' ? -100 * progress : 100 * (1 - progress);
        element.style.transform = `translateY(${translateY}%)`;
    }

    renderSlideDown(ctx, progress) {
        const height = ctx.canvas.height;
        const offset = height * (1 - progress);
        
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, offset, ctx.canvas.width, height);
        ctx.restore();
    }

    applyCSSSlideDown(element, progress, direction = 'out') {
        const translateY = direction === 'out' ? 100 * progress : -100 * (1 - progress);
        element.style.transform = `translateY(${translateY}%)`;
    }

    // Scale effect implementations
    renderScaleIn(ctx, progress) {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const scale = 1 - progress;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    applyCSSScaleIn(element, progress, direction = 'out') {
        const scale = direction === 'out' ? 1 - progress : progress;
        const opacity = direction === 'out' ? 1 - progress : progress;
        element.style.transform = `scale(${scale})`;
        element.style.opacity = opacity;
    }

    renderScaleOut(ctx, progress) {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const scale = 1 + progress * 2;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
        ctx.globalAlpha = 1 - progress;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    applyCSSScaleOut(element, progress, direction = 'out') {
        const scale = direction === 'out' ? 1 + progress : 1 - progress;
        const opacity = direction === 'out' ? 1 - progress : progress;
        element.style.transform = `scale(${scale})`;
        element.style.opacity = opacity;
    }

    // Special effect implementations
    renderIris(ctx, progress) {
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);
        const radius = maxRadius * (1 - progress);
        
        ctx.save();
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    applyCSSIris(element, progress, direction = 'out') {
        const scale = direction === 'out' ? 1 - progress : progress;
        const clipPath = `circle(${scale * 100}% at center)`;
        element.style.clipPath = clipPath;
    }

    renderPixelate(ctx, progress) {
        // Pixelation effect would require image data manipulation
        // This is a simplified version using rectangles
        const pixelSize = Math.floor(progress * 20) + 1;
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Apply pixelation (simplified)
        ctx.save();
        ctx.globalAlpha = progress;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }

    applyCSSPixelate(element, progress, direction = 'out') {
        const pixelSize = Math.floor(progress * 10) + 1;
        element.style.filter = `blur(${pixelSize}px)`;
        element.style.opacity = direction === 'out' ? 1 - progress : progress;
    }
}

/**
 * HUD Controller
 * Manages HUD visibility and state based on game context
 */
class HUDController {
    constructor() {
        this.hudElements = new Map();
        this.hudState = {
            visible: false,
            currentMode: 'hidden',
            previousMode: null,
            animating: false
        };
        
        this.modes = new Map();
        this.setupDefaultModes();
        
        this.transitionDuration = 300;
        this.debugMode = false;
        
        console.log('✅ HUDController initialized');
    }

    /**
     * Set up default HUD modes
     */
    setupDefaultModes() {
        // Hidden mode - no HUD visible
        this.addMode('hidden', {
            elements: {},
            description: 'All HUD elements hidden'
        });

        // Game mode - full HUD visible
        this.addMode('game', {
            elements: {
                'game-hud': { visible: true, position: 'overlay' },
                'player-stats': { visible: true, position: 'top-left' },
                'action-buttons': { visible: true, position: 'bottom-right' },
                'minimap': { visible: true, position: 'top-right' }
            },
            description: 'Full game HUD with all elements'
        });

        // Combat mode - combat-focused HUD
        this.addMode('combat', {
            elements: {
                'game-hud': { visible: true, position: 'overlay' },
                'combat-ui': { visible: true, position: 'bottom' },
                'player-stats': { visible: true, position: 'top-left' },
                'enemy-stats': { visible: true, position: 'top-right' }
            },
            description: 'Combat-focused HUD layout'
        });

        // Menu mode - minimal HUD for menus
        this.addMode('menu', {
            elements: {
                'back-button': { visible: true, position: 'top-left' }
            },
            description: 'Minimal HUD for menu navigation'
        });

        // Dialogue mode - dialogue-focused HUD
        this.addMode('dialogue', {
            elements: {
                'dialogue-box': { visible: true, position: 'bottom' },
                'character-portrait': { visible: true, position: 'bottom-left' }
            },
            description: 'Dialogue-focused HUD'
        });

        // Inventory mode - inventory-specific HUD
        this.addMode('inventory', {
            elements: {
                'inventory-hud': { visible: true, position: 'overlay' },
                'item-stats': { visible: true, position: 'right' },
                'player-stats': { visible: true, position: 'left' }
            },
            description: 'Inventory management HUD'
        });
    }

    /**
     * Register HUD element
     */
    registerElement(elementId, config = {}) {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`HUD element not found: ${elementId}`);
            return false;
        }

        this.hudElements.set(elementId, {
            element,
            config: {
                animatable: config.animatable !== false,
                fadeTime: config.fadeTime || this.transitionDuration,
                slideDirection: config.slideDirection || 'up',
                ...config
            },
            state: {
                visible: !element.classList.contains('hidden'),
                animating: false
            }
        });

        if (this.debugMode) {
            console.log(`📋 Registered HUD element: ${elementId}`);
        }

        return true;
    }

    /**
     * Add HUD mode
     */
    addMode(name, config) {
        this.modes.set(name, config);
        if (this.debugMode) {
            console.log(`📋 Added HUD mode: ${name}`);
        }
    }

    /**
     * Set HUD mode
     */
    async setMode(modeName, options = {}) {
        const mode = this.modes.get(modeName);
        if (!mode) {
            console.error(`HUD mode not found: ${modeName}`);
            return false;
        }

        if (this.hudState.animating && !options.force) {
            console.warn('HUD is currently animating, skipping mode change');
            return false;
        }

        const previousMode = this.hudState.currentMode;
        this.hudState.previousMode = previousMode;
        this.hudState.currentMode = modeName;
        this.hudState.animating = true;

        try {
            await this.transitionToMode(mode, options);
            this.hudState.visible = Object.values(mode.elements).some(el => el.visible);
            
            if (this.debugMode) {
                console.log(`🎬 HUD mode changed: ${previousMode} → ${modeName}`);
            }

            return true;
        } catch (error) {
            console.error('Error changing HUD mode:', error);
            return false;
        } finally {
            this.hudState.animating = false;
        }
    }

    /**
     * Transition to new HUD mode
     */
    async transitionToMode(mode, options = {}) {
        const {
            animate = true,
            duration = this.transitionDuration,
            stagger = 50
        } = options;

        const transitionPromises = [];

        // Hide elements not in new mode
        this.hudElements.forEach((hudElement, elementId) => {
            const elementConfig = mode.elements[elementId];
            const shouldBeVisible = elementConfig?.visible || false;

            if (!shouldBeVisible && hudElement.state.visible) {
                const promise = this.hideElement(elementId, { animate, duration });
                transitionPromises.push(promise);
            }
        });

        // Wait for hide animations to complete
        if (transitionPromises.length > 0) {
            await Promise.all(transitionPromises);
        }

        // Show elements in new mode with staggered timing
        const showPromises = [];
        let delay = 0;

        Object.entries(mode.elements).forEach(([elementId, elementConfig]) => {
            if (elementConfig.visible) {
                const hudElement = this.hudElements.get(elementId);
                if (hudElement && !hudElement.state.visible) {
                    setTimeout(() => {
                        const promise = this.showElement(elementId, { 
                            animate, 
                            duration,
                            position: elementConfig.position 
                        });
                        showPromises.push(promise);
                    }, delay);
                    delay += stagger;
                }
            }
        });

        // Wait for show animations to complete
        if (showPromises.length > 0) {
            await Promise.all(showPromises);
        }
    }

    /**
     * Show HUD element
     */
    async showElement(elementId, options = {}) {
        const hudElement = this.hudElements.get(elementId);
        if (!hudElement) {
            console.warn(`HUD element not registered: ${elementId}`);
            return false;
        }

        const { element, config } = hudElement;
        const {
            animate = config.animatable,
            duration = config.fadeTime,
            position = null
        } = options;

        hudElement.state.animating = true;

        try {
            // Set position if specified
            if (position) {
                this.setElementPosition(element, position);
            }

            if (animate) {
                // Animated show
                element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
                element.classList.remove('hidden');
                
                // Force reflow
                element.offsetHeight;
                
                element.style.opacity = '1';
                element.style.transform = 'translateY(0) scale(1)';
                
                await this.waitForTransition(duration);
            } else {
                // Instant show
                element.classList.remove('hidden');
                element.style.opacity = '1';
                element.style.transform = 'translateY(0) scale(1)';
            }

            hudElement.state.visible = true;
            return true;
        } catch (error) {
            console.error(`Error showing HUD element ${elementId}:`, error);
            return false;
        } finally {
            hudElement.state.animating = false;
        }
    }

    /**
     * Hide HUD element
     */
    async hideElement(elementId, options = {}) {
        const hudElement = this.hudElements.get(elementId);
        if (!hudElement) {
            console.warn(`HUD element not registered: ${elementId}`);
            return false;
        }

        const { element, config } = hudElement;
        const {
            animate = config.animatable,
            duration = config.fadeTime
        } = options;

        hudElement.state.animating = true;

        try {
            if (animate) {
                // Animated hide
                element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
                element.style.opacity = '0';
                
                const slideDirection = config.slideDirection;
                const transform = this.getHideTransform(slideDirection);
                element.style.transform = transform;
                
                await this.waitForTransition(duration);
                element.classList.add('hidden');
            } else {
                // Instant hide
                element.classList.add('hidden');
                element.style.opacity = '0';
            }

            hudElement.state.visible = false;
            return true;
        } catch (error) {
            console.error(`Error hiding HUD element ${elementId}:`, error);
            return false;
        } finally {
            hudElement.state.animating = false;
        }
    }

    /**
     * Set element position
     */
    setElementPosition(element, position) {
        // Remove existing position classes
        element.classList.remove(
            'hud-top-left', 'hud-top-right', 'hud-bottom-left', 
            'hud-bottom-right', 'hud-center', 'hud-overlay'
        );

        // Add new position class
        switch (position) {
            case 'top-left':
                element.classList.add('hud-top-left');
                break;
            case 'top-right':
                element.classList.add('hud-top-right');
                break;
            case 'bottom-left':
                element.classList.add('hud-bottom-left');
                break;
            case 'bottom-right':
                element.classList.add('hud-bottom-right');
                break;
            case 'center':
                element.classList.add('hud-center');
                break;
            case 'overlay':
                element.classList.add('hud-overlay');
                break;
        }
    }

    /**
     * Get hide transform based on slide direction
     */
    getHideTransform(direction) {
        switch (direction) {
            case 'up':
                return 'translateY(-20px) scale(0.95)';
            case 'down':
                return 'translateY(20px) scale(0.95)';
            case 'left':
                return 'translateX(-20px) scale(0.95)';
            case 'right':
                return 'translateX(20px) scale(0.95)';
            default:
                return 'scale(0.95)';
        }
    }

    /**
     * Wait for transition to complete
     */
    waitForTransition(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    /**
     * Toggle HUD visibility
     */
    async toggle(options = {}) {
        const targetMode = this.hudState.visible ? 'hidden' : 'game';
        return this.setMode(targetMode, options);
    }

    /**
     * Get current HUD state
     */
    getState() {
        return {
            ...this.hudState,
            elements: Object.fromEntries(
                Array.from(this.hudElements.entries()).map(([id, hudElement]) => [
                    id, 
                    hudElement.state
                ])
            )
        };
    }

    /**
     * Set debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`🐛 HUD debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.hudElements.clear();
        this.modes.clear();
        console.log('🧹 HUDController cleaned up');
    }
}

/**
 * Enhanced Transition Controller
 * Coordinates scene transitions and HUD management
 */
class EnhancedTransitionController {
    constructor(sceneManager, hudController, options = {}) {
        this.sceneManager = sceneManager;
        this.hudController = hudController;
        this.transitionEffects = new TransitionEffects();
        
        this.options = {
            enableHUDTransitions: options.enableHUDTransitions !== false,
            enableSceneTransitions: options.enableSceneTransitions !== false,
            coordinateTransitions: options.coordinateTransitions !== false,
            debugMode: options.debugMode || false,
            ...options
        };
        
        this.currentTransition = null;
        this.transitionQueue = [];
        
        if (this.options.debugMode) {
            this.hudController.setDebugMode(true);
        }
        
        console.log('✅ EnhancedTransitionController initialized');
    }

    /**
     * Perform coordinated scene and HUD transition
     */
    async performTransition(targetScene, options = {}) {
        const {
            sceneTransition = 'fade',
            hudMode = this.getHUDModeForScene(targetScene),
            duration = 500,
            coordinateWithHUD = this.options.coordinateTransitions
        } = options;

        if (this.currentTransition) {
            if (options.queue !== false) {
                this.transitionQueue.push({ targetScene, options });
                return;
            } else {
                console.warn('Transition already in progress, aborting new transition');
                return false;
            }
        }

        this.currentTransition = {
            targetScene,
            startTime: Date.now(),
            options
        };

        try {
            if (coordinateWithHUD && this.options.enableHUDTransitions) {
                // Coordinated transition
                await this.performCoordinatedTransition(targetScene, hudMode, {
                    sceneTransition,
                    duration
                });
            } else {
                // Separate transitions
                const promises = [];
                
                if (this.options.enableSceneTransitions) {
                    promises.push(this.performSceneTransition(targetScene, {
                        effect: sceneTransition,
                        duration
                    }));
                } else {
                    this.sceneManager.showScene(targetScene, false);
                }
                
                if (this.options.enableHUDTransitions && hudMode) {
                    promises.push(this.hudController.setMode(hudMode));
                }
                
                await Promise.all(promises);
            }

            if (this.options.debugMode) {
                console.log(`🎬 Transition completed: ${targetScene} (${Date.now() - this.currentTransition.startTime}ms)`);
            }

            return true;
        } catch (error) {
            console.error('Transition failed:', error);
            return false;
        } finally {
            this.currentTransition = null;
            this.processTransitionQueue();
        }
    }

    /**
     * Perform coordinated scene and HUD transition
     */
    async performCoordinatedTransition(targetScene, hudMode, options) {
        const { duration } = options;
        const halfDuration = duration / 2;

        // Phase 1: Hide current elements
        const hidePromises = [];
        
        // Hide HUD
        if (this.hudController.hudState.visible) {
            hidePromises.push(this.hudController.setMode('hidden', { 
                animate: true, 
                duration: halfDuration 
            }));
        }
        
        // Start scene transition out
        if (this.sceneManager.getCurrentScene()) {
            hidePromises.push(this.fadeOutCurrentScene(halfDuration));
        }
        
        await Promise.all(hidePromises);

        // Phase 2: Switch scene and show new elements
        const showPromises = [];
        
        // Switch scene
        this.sceneManager.showScene(targetScene, false);
        
        // Show new scene
        showPromises.push(this.fadeInNewScene(halfDuration));
        
        // Show HUD in new mode
        if (hudMode && hudMode !== 'hidden') {
            showPromises.push(this.hudController.setMode(hudMode, { 
                animate: true, 
                duration: halfDuration 
            }));
        }
        
        await Promise.all(showPromises);
    }

    /**
     * Perform scene transition
     */
    async performSceneTransition(targetScene, options) {
        const { effect, duration } = options;
        const transitionEffect = this.transitionEffects.getEffect(effect);
        
        if (!transitionEffect) {
            console.warn(`Unknown transition effect: ${effect}`);
            this.sceneManager.showScene(targetScene, false);
            return;
        }

        // Apply CSS transition
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene?.config?.element && transitionEffect.css) {
            await this.applyCSSTransition(
                currentScene.config.element,
                transitionEffect,
                duration,
                'out'
            );
        }

        // Switch scene
        this.sceneManager.showScene(targetScene, false);

        // Transition in new scene
        const newScene = this.sceneManager.getCurrentScene();
        if (newScene?.config?.element && transitionEffect.css) {
            await this.applyCSSTransition(
                newScene.config.element,
                transitionEffect,
                duration,
                'in'
            );
        }
    }

    /**
     * Apply CSS transition to element
     */
    async applyCSSTransition(element, effect, duration, direction) {
        return new Promise(resolve => {
            let progress = 0;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                progress = Math.min(elapsed / duration, 1);
                
                effect.css(element, progress, direction);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    // Reset styles
                    element.style.transform = '';
                    element.style.opacity = '';
                    element.style.filter = '';
                    element.style.clipPath = '';
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    /**
     * Fade out current scene
     */
    async fadeOutCurrentScene(duration) {
        const currentScene = this.sceneManager.getCurrentScene();
        if (currentScene?.config?.element) {
            const element = currentScene.config.element;
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '0';
            await this.waitForDuration(duration);
        }
    }

    /**
     * Fade in new scene
     */
    async fadeInNewScene(duration) {
        const newScene = this.sceneManager.getCurrentScene();
        if (newScene?.config?.element) {
            const element = newScene.config.element;
            element.style.opacity = '0';
            element.style.transition = `opacity ${duration}ms ease`;
            
            // Force reflow
            element.offsetHeight;
            
            element.style.opacity = '1';
            await this.waitForDuration(duration);
            
            // Clean up
            element.style.transition = '';
        }
    }

    /**
     * Get appropriate HUD mode for scene
     */
    getHUDModeForScene(sceneName) {
        const sceneToHUDMapping = {
            'main_menu': 'hidden',
            'character_select': 'hidden',
            'settings': 'menu',
            'game_world': 'game',
            'combat': 'combat',
            'monster_management': 'menu',
            'inventory': 'inventory'
        };
        
        return sceneToHUDMapping[sceneName] || 'hidden';
    }

    /**
     * Process transition queue
     */
    async processTransitionQueue() {
        if (this.transitionQueue.length > 0) {
            const { targetScene, options } = this.transitionQueue.shift();
            await this.performTransition(targetScene, options);
        }
    }

    /**
     * Wait for specified duration
     */
    waitForDuration(duration) {
        return new Promise(resolve => setTimeout(resolve, duration));
    }

    /**
     * Add custom transition effect
     */
    addTransitionEffect(name, config) {
        this.transitionEffects.addEffect(name, config);
    }

    /**
     * Set transition options
     */
    setOptions(options) {
        this.options = { ...this.options, ...options };
    }

    /**
     * Get transition state
     */
    getState() {
        return {
            currentTransition: this.currentTransition,
            queueLength: this.transitionQueue.length,
            hudState: this.hudController.getState(),
            options: this.options
        };
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.currentTransition = null;
        this.transitionQueue = [];
        this.hudController.cleanup();
        console.log('🧹 EnhancedTransitionController cleaned up');
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        TransitionEffects, 
        HUDController, 
        EnhancedTransitionController 
    };
} else if (typeof window !== 'undefined') {
    window.TransitionEffects = TransitionEffects;
    window.HUDController = HUDController;
    window.EnhancedTransitionController = EnhancedTransitionController;
}