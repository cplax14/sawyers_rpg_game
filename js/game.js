/**
 * Sawyer's RPG Game - Main Entry Point
 * Handles game initialization, main loop, and core coordination
 */

class SawyersRPG {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.gameState = null;
        this.ui = null;
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.deltaTime = 0;
        
        // Game loop ID for cancellation
        this.gameLoopId = null;
        
        // Initialize game on DOM load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    /**
     * Initialize the game system
     */
    async init() {
        try {
            console.log('🎮 Initializing Sawyer\'s RPG Game...');
            
            // Get canvas and context
            this.canvas = document.getElementById('game-canvas');
            if (!this.canvas) {
                console.warn('⚠️ Game canvas not found; skipping start (test environment)');
                return; // Tolerate missing canvas in tests
            }
            
            this.ctx = this.canvas.getContext('2d');
            if (!this.ctx) {
                console.warn('⚠️ Could not get 2D rendering context; skipping start');
                return;
            }
            
            // Initialize game systems
            await this.initializeSystems();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start the game
            this.start();
            
            console.log('✅ Game initialization complete');
            
        } catch (error) {
            console.error('❌ Game initialization failed:', error);
            // Avoid surfacing as blocking error in tests without canvas
        }
    }
    
    /**
     * Initialize all game systems
     */
    async initializeSystems() {
        // Initialize game state manager
        if (typeof GameState !== 'undefined') {
            this.gameState = new GameState();
            console.log('✅ Game State initialized');
        } else {
            console.warn('⚠️ GameState not loaded');
        }
        
        // Initialize UI manager
        if (typeof UIManager !== 'undefined') {
            this.ui = new UIManager(this);
            console.log('✅ UI Manager initialized');
        } else {
            console.warn('⚠️ UIManager not loaded');
        }
        
        // Load game data
        await this.loadGameData();
        
        // Initialize save system
        if (typeof SaveSystem !== 'undefined') {
            SaveSystem.init(this.gameState);
            console.log('✅ Save System initialized');
        } else {
            console.warn('⚠️ SaveSystem not loaded');
        }
        
        // Try to load auto-save
        this.tryLoadAutoSave();
    }
    
    /**
     * Load game data from data modules
     */
    async loadGameData() {
        const dataModules = [
            'CharacterData',
            'MonsterData', 
            'AreaData',
            'StoryData'
        ];
        
        let loadedModules = 0;
        
        for (const moduleName of dataModules) {
            if (typeof window[moduleName] !== 'undefined') {
                loadedModules++;
                console.log(`✅ ${moduleName} loaded`);
            } else {
                console.warn(`⚠️ ${moduleName} not loaded`);
            }
        }
        
        console.log(`📊 Loaded ${loadedModules}/${dataModules.length} data modules`);
    }
    
    /**
     * Set up event listeners for the game
     */
    setupEventListeners() {
        // Window events
        window.addEventListener('beforeunload', () => this.handleBeforeUnload());
        window.addEventListener('resize', () => this.handleResize());
        
        // Visibility API for pause/resume
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse/Touch events on canvas (guard for test mocks)
        if (this.canvas && typeof this.canvas.addEventListener === 'function') {
            this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
            this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
            
            // Touch events for mobile
            this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        } else {
            console.warn('⚠️ Canvas event listeners not attached (canvas mock or missing)');
        }
        
        console.log('✅ Event listeners set up');
    }
    
    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) {
            console.warn('⚠️ Game is already running');
            return;
        }
        
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        
        // Start the main game loop
        this.gameLoop();
        
        console.log('🚀 Game started');
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (!this.isRunning) {
            return;
        }
        
        // Calculate delta time
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
        this.lastFrameTime = currentTime;
        
        // Cap delta time to prevent spiral of death
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        try {
            // Update game systems
            this.update(this.deltaTime);
            
            // Render the game
            this.render();
            
        } catch (error) {
            console.error('❌ Error in game loop:', error);
            this.pause();
            this.showError('Game loop error: ' + error.message);
        }
        
        // Schedule next frame
        this.gameLoopId = requestAnimationFrame(() => this.gameLoop());
    }
    
    /**
     * Update game systems
     */
    update(deltaTime) {
        // Update game state
        if (this.gameState) {
            this.gameState.update(deltaTime);
        }
        
        // Update UI
        if (this.ui) {
            this.ui.update(deltaTime);
        }
    }
    
    /**
     * Render the game
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Render game state
        if (this.gameState) {
            this.gameState.render(this.ctx);
        }
        
        // Render UI elements on canvas if needed
        if (this.ui) {
            this.ui.renderCanvas(this.ctx);
        }
    }
    
    /**
     * Pause the game
     */
    pause() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        if (this.gameLoopId) {
            cancelAnimationFrame(this.gameLoopId);
            this.gameLoopId = null;
        }
        
        console.log('⏸️ Game paused');
    }
    
    /**
     * Resume the game
     */
    resume() {
        if (this.isRunning) {
            return;
        }
        
        this.lastFrameTime = performance.now();
        this.start();
        
        console.log('▶️ Game resumed');
    }
    
    /**
     * Stop the game completely
     */
    stop() {
        this.pause();
        
        // Clean up resources
        this.cleanup();
        
        console.log('⏹️ Game stopped');
    }
    
    /**
     * Clean up game resources
     */
    cleanup() {
        // Remove event listeners
        window.removeEventListener('beforeunload', this.handleBeforeUnload);
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        
        if (this.canvas && typeof this.canvas.removeEventListener === 'function') {
            this.canvas.removeEventListener('click', this.handleCanvasClick);
            this.canvas.removeEventListener('mousemove', this.handleCanvasMouseMove);
            this.canvas.removeEventListener('touchstart', this.handleTouchStart);
            this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        }
    }
    
    // Event Handlers
    
    handleBeforeUnload() {
        // Auto-save before closing
        if (this.gameState && typeof SaveSystem !== 'undefined') {
            SaveSystem.autoSave();
        }
    }
    
    handleResize() {
        // Handle window resize if needed
        // The canvas size is handled by CSS, but we might need to adjust rendering
    }
    
    handleKeyDown(event) {
        if (this.gameState) {
            this.gameState.handleInput('keydown', {
                key: event.key,
                code: event.code,
                ctrlKey: event.ctrlKey,
                shiftKey: event.shiftKey,
                altKey: event.altKey
            });
        }
        
        // Global hotkeys
        switch (event.key) {
            case 'Escape':
                if (this.ui) {
                    this.ui.handleEscape();
                }
                break;
            case 'F11':
                event.preventDefault();
                this.toggleFullscreen();
                break;
        }
    }
    
    handleKeyUp(event) {
        if (this.gameState) {
            this.gameState.handleInput('keyup', {
                key: event.key,
                code: event.code
            });
        }
    }
    
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (this.gameState) {
            this.gameState.handleInput('click', { x, y });
        }
    }
    
    handleCanvasMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        if (this.gameState) {
            this.gameState.handleInput('mousemove', { x, y });
        }
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        if (this.gameState) {
            this.gameState.handleInput('touchstart', { x, y });
        }
    }
    
    handleTouchEnd(event) {
        event.preventDefault();
        if (this.gameState) {
            this.gameState.handleInput('touchend', {});
        }
    }
    
    // Utility Methods
    
    /**
     * Try to load auto-save data
     */
    tryLoadAutoSave() {
        if (typeof SaveSystem !== 'undefined' && SaveSystem.hasAutoSave()) {
            try {
                const autoSaveData = SaveSystem.loadAutoSave();
                if (autoSaveData && this.gameState) {
                    this.gameState.loadFromSave(autoSaveData);
                    console.log('✅ Auto-save loaded');
                }
            } catch (error) {
                console.warn('⚠️ Failed to load auto-save:', error);
            }
        }
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn('Could not enter fullscreen:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    /**
     * Show error message to user
     */
    showError(message) {
        // Create error notification
        const notification = document.createElement('div');
        notification.className = 'notification error show';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }
    
    /**
     * Show success message to user
     */
    showSuccess(message) {
        const notification = document.createElement('div');
        notification.className = 'notification success show';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    
    // Public API Methods
    
    /**
     * Get current game state
     */
    getGameState() {
        return this.gameState;
    }
    
    /**
     * Get UI manager
     */
    getUI() {
        return this.ui;
    }
    
    /**
     * Get canvas context
     */
    getContext() {
        return this.ctx;
    }
    
    /**
     * Check if game is running
     */
    isGameRunning() {
        return this.isRunning;
    }
}

// Initialize the game when script loads
const game = new SawyersRPG();

// Make game instance globally available for debugging
window.SawyersRPG = game;