/**
 * Basic validation test for GameWorldUI module
 * Ensures core world map functionality is preserved from original ui.js
 */

class GameWorldUIValidator {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    /**
     * Run all validation tests
     */
    async runValidation() {
        console.log('🧪 Starting GameWorldUI validation tests...');
        
        // Test module loading
        this.testModuleLoading();
        
        // Test initialization
        await this.testInitialization();
        
        // Test world map overlay
        this.testWorldMapOverlay();
        
        // Test area management
        this.testAreaManagement();
        
        // Test travel functionality
        this.testTravelFunctionality();
        
        // Test keyboard navigation
        this.testKeyboardNavigation();
        
        // Test story integration
        this.testStoryIntegration();
        
        // Report results
        this.reportResults();
        
        return this.allTestsPassed();
    }

    /**
     * Test that GameWorldUI module loads correctly
     */
    testModuleLoading() {
        this.addTest('Module Loading', () => {
            // Check if GameWorldUI class exists
            if (typeof GameWorldUI === 'undefined') {
                throw new Error('GameWorldUI class not found');
            }
            
            // Check if it extends BaseUIModule
            if (!(GameWorldUI.prototype instanceof BaseUIModule)) {
                throw new Error('GameWorldUI does not extend BaseUIModule');
            }
            
            return 'GameWorldUI module loaded successfully';
        });
    }

    /**
     * Test GameWorldUI initialization
     */
    async testInitialization() {
        this.addTest('Initialization', async () => {
            // Create mock UIManager
            const mockUIManager = {
                registerModule: () => {},
                sendMessage: () => {},
                game: {
                    gameState: {
                        world: {
                            currentArea: 'starting_village',
                            storyFlags: [],
                            completedEvents: []
                        },
                        player: {
                            level: 1,
                            inventory: { items: {} },
                            class: 'warrior'
                        }
                    }
                }
            };
            
            // Create GameWorldUI instance
            const gameWorldUI = new GameWorldUI(mockUIManager);
            
            // Test initialization
            const result = await gameWorldUI.init();
            
            if (!result) {
                throw new Error('GameWorldUI initialization failed');
            }
            
            // Check required properties
            if (!gameWorldUI.worldMapOverlay) {
                throw new Error('World map overlay not initialized');
            }
            
            if (!Array.isArray(gameWorldUI.worldMapButtons)) {
                throw new Error('worldMapButtons not properly initialized');
            }
            
            return 'GameWorldUI initialized successfully';
        });
    }

    /**
     * Test world map overlay functionality
     */
    testWorldMapOverlay() {
        this.addTest('World Map Overlay', () => {
            const mockUIManager = {
                registerModule: () => {},
                sendMessage: () => {},
                game: { gameState: {} }
            };
            const gameWorldUI = new GameWorldUI(mockUIManager);
            
            // Test overlay creation
            const overlay = gameWorldUI.ensureWorldMapOverlay();
            if (!overlay) {
                throw new Error('Failed to create world map overlay');
            }
            
            // Test overlay properties
            if (overlay.id !== 'world-map-overlay') {
                throw new Error('World map overlay has incorrect ID');
            }
            
            if (overlay.style.position !== 'fixed') {
                throw new Error('World map overlay has incorrect positioning');
            }
            
            // Test list creation
            const list = gameWorldUI.getOrCreateWorldMapList();
            if (!list) {
                throw new Error('Failed to create world map list');
            }
            
            if (list.id !== 'world-map-list') {
                throw new Error('World map list has incorrect ID');
            }
            
            return 'World map overlay functionality working';
        });
    }

    /**
     * Test area management functionality
     */
    testAreaManagement() {
        this.addTest('Area Management', () => {
            const mockUIManager = {
                registerModule: () => {},
                sendMessage: () => {},
                game: { gameState: {} }
            };
            const gameWorldUI = new GameWorldUI(mockUIManager);
            
            // Test area selection methods
            const requiredMethods = [
                'selectArea',
                'displayAreaDetails',
                'updateAreaStats',
                'updateAreaActionButtons',
                'isAreaUnlocked',
                'getAreaIcon'
            ];
            
            for (const method of requiredMethods) {
                if (typeof gameWorldUI[method] !== 'function') {
                    throw new Error(`${method} method not found`);
                }
            }
            
            // Test area icon mapping
            const townIcon = gameWorldUI.getAreaIcon('town');
            if (townIcon !== '🏘️') {
                throw new Error('Area icon mapping incorrect');
            }
            
            const unknownIcon = gameWorldUI.getAreaIcon('unknown');
            if (unknownIcon !== '📍') {
                throw new Error('Default area icon incorrect');
            }
            
            // Test area selection
            gameWorldUI.selectedArea = null;
            if (gameWorldUI.getSelectedArea() !== null) {
                throw new Error('Selected area not properly tracked');
            }
            
            gameWorldUI.setSelectedArea('test_area');
            if (gameWorldUI.getSelectedArea() !== 'test_area') {
                throw new Error('Area selection not working');
            }
            
            return 'Area management functionality working';
        });
    }

    /**
     * Test travel functionality
     */
    testTravelFunctionality() {
        this.addTest('Travel Functionality', () => {
            // Mock AreaData
            window.AreaData = {
                getArea: (areaId) => ({
                    name: `Test ${areaId}`,
                    type: 'town',
                    description: `Description for ${areaId}`,
                    encounterRate: 10,
                    monsters: [],
                    difficulty: 1
                }),
                getUnlockedAreas: () => ['starting_village', 'forest_path'],
                getConnectedAreas: () => ['forest_path']
            };
            
            const mockUIManager = {
                registerModule: () => {},
                sendMessage: () => {},
                game: {
                    gameState: {
                        world: {
                            currentArea: 'starting_village',
                            storyFlags: [],
                            completedEvents: []
                        }
                    }
                }
            };
            const gameWorldUI = new GameWorldUI(mockUIManager);
            
            // Test travel methods
            const travelMethods = [
                'travelToArea',
                'quickTravelToArea',
                'travelToSelectedArea',
                'exploreSelectedArea'
            ];
            
            for (const method of travelMethods) {
                if (typeof gameWorldUI[method] !== 'function') {
                    throw new Error(`${method} method not found`);
                }
            }
            
            // Test current area tracking
            const initialArea = gameWorldUI.getCurrentPlayerArea();
            if (initialArea !== 'starting_village') {
                throw new Error('Current player area not properly tracked');
            }
            
            // Test quick travel
            gameWorldUI.quickTravelToArea('forest_path');
            if (gameWorldUI.getCurrentPlayerArea() !== 'forest_path') {
                throw new Error('Quick travel not working');
            }
            
            // Cleanup
            delete window.AreaData;
            
            return 'Travel functionality working';
        });
    }

    /**
     * Test keyboard navigation
     */
    testKeyboardNavigation() {
        this.addTest('Keyboard Navigation', () => {
            const mockUIManager = {
                registerModule: () => {},
                sendMessage: (message) => {
                    if (message === 'getCurrentScene') return { name: 'game_world' };
                    return null;
                },
                game: { gameState: {} }
            };
            const gameWorldUI = new GameWorldUI(mockUIManager);
            
            // Test keyboard navigation methods
            const keyboardMethods = [
                'handleWorldMapKeys',
                'handleWorldMapScreenKeys',
                'moveWorldMapSelection',
                'focusWorldMapIndex',
                'attachWorldMapKeyboard',
                'detachWorldMapKeyboard',
                'clearAreaSelection'
            ];
            
            for (const method of keyboardMethods) {
                if (typeof gameWorldUI[method] !== 'function') {
                    throw new Error(`${method} method not found`);
                }
            }
            
            // Test keyboard handler attachment/detachment
            gameWorldUI.attachWorldMapKeyboard();
            if (!gameWorldUI._worldMapScreenKeyHandler) {
                throw new Error('Keyboard handler not attached');
            }
            
            gameWorldUI.detachWorldMapKeyboard();
            if (gameWorldUI._worldMapScreenKeyHandler) {
                throw new Error('Keyboard handler not detached');
            }
            
            return 'Keyboard navigation functionality working';
        });
    }

    /**
     * Test story integration
     */
    testStoryIntegration() {
        this.addTest('Story Integration', () => {
            // Mock story systems
            window.StoryData = {
                getAreaEvents: () => ['test_event'],
                getEvent: (eventName) => ({
                    name: eventName,
                    title: `Test Event: ${eventName}`,
                    description: 'A test story event'
                })
            };
            
            window.GameState = {
                world: {
                    storyFlags: [],
                    completedEvents: []
                }
            };
            
            const mockUIManager = {
                registerModule: () => {},
                sendMessage: () => {},
                game: { gameState: window.GameState }
            };
            const gameWorldUI = new GameWorldUI(mockUIManager);
            
            // Test story methods
            const storyMethods = [
                'triggerStoryEventIfAvailable',
                'showStoryEvent',
                'showStoryEventFallback',
                'checkAreaStoryEvents',
                'getAreaStoryEvents'
            ];
            
            for (const method of storyMethods) {
                if (typeof gameWorldUI[method] !== 'function') {
                    throw new Error(`${method} method not found`);
                }
            }
            
            // Test story event checking
            const hasEvents = gameWorldUI.checkAreaStoryEvents('test_area');
            if (!hasEvents) {
                throw new Error('Story event checking not working');
            }
            
            const events = gameWorldUI.getAreaStoryEvents('test_area');
            if (!Array.isArray(events) || events.length === 0) {
                throw new Error('Story event retrieval not working');
            }
            
            // Cleanup
            delete window.StoryData;
            delete window.GameState;
            
            return 'Story integration functionality working';
        });
    }

    /**
     * Add a test to the test suite
     */
    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }

    /**
     * Run a single test and record result
     */
    async runTest(test) {
        try {
            const result = await test.testFunction();
            this.results.push({
                name: test.name,
                status: 'PASS',
                message: result
            });
            console.log(`✅ ${test.name}: ${result}`);
        } catch (error) {
            this.results.push({
                name: test.name,
                status: 'FAIL',
                message: error.message
            });
            console.error(`❌ ${test.name}: ${error.message}`);
        }
    }

    /**
     * Execute all tests
     */
    async executeTests() {
        for (const test of this.tests) {
            await this.runTest(test);
        }
    }

    /**
     * Report validation results
     */
    reportResults() {
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;
        
        console.log('\n📊 GameWorldUI Validation Results:');
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
        
        if (failed > 0) {
            console.log('\n❌ Failed Tests:');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
        }
    }

    /**
     * Check if all tests passed
     */
    allTestsPassed() {
        return this.results.every(r => r.status === 'PASS');
    }
}

// Auto-run validation if script is loaded directly
if (typeof window !== 'undefined' && window.document) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            const validator = new GameWorldUIValidator();
            await validator.runValidation();
        });
    } else {
        // DOM is already ready
        setTimeout(async () => {
            const validator = new GameWorldUIValidator();
            await validator.runValidation();
        }, 100);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameWorldUIValidator;
}