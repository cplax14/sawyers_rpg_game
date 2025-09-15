/**
 * Basic validation test for MenuUI module
 * Ensures core menu functionality is preserved from original ui.js
 */

class MenuUIValidator {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    /**
     * Run all validation tests
     */
    async runValidation() {
        console.log('🧪 Starting MenuUI validation tests...');
        
        // Test module loading
        this.testModuleLoading();
        
        // Test initialization
        await this.testInitialization();
        
        // Test button attachments
        this.testButtonAttachments();
        
        // Test character selection
        this.testCharacterSelection();
        
        // Test navigation flow
        this.testNavigationFlow();
        
        // Report results
        this.reportResults();
        
        return this.allTestsPassed();
    }

    /**
     * Test that MenuUI module loads correctly
     */
    testModuleLoading() {
        this.addTest('Module Loading', () => {
            // Check if MenuUI class exists
            if (typeof MenuUI === 'undefined') {
                throw new Error('MenuUI class not found');
            }
            
            // Check if it extends BaseUIModule
            if (!(MenuUI.prototype instanceof BaseUIModule)) {
                throw new Error('MenuUI does not extend BaseUIModule');
            }
            
            return 'MenuUI module loaded successfully';
        });
    }

    /**
     * Test MenuUI initialization
     */
    async testInitialization() {
        this.addTest('Initialization', async () => {
            // Create mock UIManager
            const mockUIManager = {
                registerModule: () => {},
                sendMessage: () => {},
                game: {
                    gameState: {
                        resetToDefaults: () => {},
                        setPlayerClass: () => true,
                        addStoryFlag: () => {}
                    }
                }
            };
            
            // Create MenuUI instance
            const menuUI = new MenuUI(mockUIManager);
            
            // Test initialization
            const result = await menuUI.init();
            
            if (!result) {
                throw new Error('MenuUI initialization failed');
            }
            
            // Check required properties
            if (!menuUI.selectedElements) {
                throw new Error('selectedElements not initialized');
            }
            
            if (!Array.isArray(menuUI.scenes)) {
                throw new Error('scenes not properly initialized');
            }
            
            return 'MenuUI initialized successfully';
        });
    }

    /**
     * Test button attachment functionality
     */
    testButtonAttachments() {
        this.addTest('Button Attachments', () => {
            // Create test DOM elements
            const testContainer = document.createElement('div');
            testContainer.innerHTML = `
                <button id="new-game-btn">New Game</button>
                <button id="load-game-btn">Load Game</button>
                <button id="settings-btn">Settings</button>
                <button id="start-adventure-btn">Start Adventure</button>
                <button id="back-to-menu">Back to Menu</button>
                <button id="back-to-menu-btn">Back</button>
            `;
            document.body.appendChild(testContainer);
            
            try {
                // Create MenuUI instance
                const mockUIManager = {
                    registerModule: () => {},
                    sendMessage: () => {},
                    game: { gameState: {} }
                };
                const menuUI = new MenuUI(mockUIManager);
                
                // Test attachButton method exists and works
                if (typeof menuUI.attachButton !== 'function') {
                    throw new Error('attachButton method not found');
                }
                
                // Simulate event attachment (without actually calling attachEvents to avoid dependencies)
                let buttonFound = false;
                const testButton = document.getElementById('new-game-btn');
                if (testButton) {
                    buttonFound = true;
                }
                
                if (!buttonFound) {
                    throw new Error('Test buttons not properly created');
                }
                
                return 'Button attachment methods available';
            } finally {
                // Cleanup
                document.body.removeChild(testContainer);
            }
        });
    }

    /**
     * Test character selection functionality
     */
    testCharacterSelection() {
        this.addTest('Character Selection', () => {
            // Create test character cards
            const testContainer = document.createElement('div');
            testContainer.innerHTML = `
                <div class="class-card" data-class="warrior">Warrior</div>
                <div class="class-card" data-class="mage">Mage</div>
                <div class="class-card" data-class="rogue">Rogue</div>
                <div id="class-detail-content" class="hidden"></div>
                <div id="detail-class-name"></div>
                <div id="detail-class-desc"></div>
                <div id="stats-grid"></div>
                <div id="starting-spells"></div>
                <div id="class-bonus-text"></div>
                <button id="start-adventure-btn" disabled>Start Adventure</button>
            `;
            document.body.appendChild(testContainer);
            
            try {
                // Mock CharacterData
                window.CharacterData = {
                    getClass: (className) => ({
                        name: className.charAt(0).toUpperCase() + className.slice(1),
                        description: `A ${className} character`,
                        baseStats: { hp: 100, mp: 50, attack: 10 },
                        startingSpells: ['basic_attack'],
                        classBonus: `${className} bonus`
                    })
                };
                
                const mockUIManager = {
                    registerModule: () => {},
                    sendMessage: () => {},
                    game: { gameState: {} }
                };
                const menuUI = new MenuUI(mockUIManager);
                
                // Test character selection methods
                if (typeof menuUI.selectCharacterClass !== 'function') {
                    throw new Error('selectCharacterClass method not found');
                }
                
                if (typeof menuUI.showClassDetails !== 'function') {
                    throw new Error('showClassDetails method not found');
                }
                
                // Test selection tracking
                menuUI.selectCharacterClass('warrior');
                
                if (!menuUI.getSelectedClass()) {
                    throw new Error('Character class selection not tracked');
                }
                
                if (menuUI.getSelectedClass() !== 'warrior') {
                    throw new Error('Incorrect character class selected');
                }
                
                return 'Character selection functionality working';
            } finally {
                // Cleanup
                document.body.removeChild(testContainer);
                delete window.CharacterData;
            }
        });
    }

    /**
     * Test navigation flow
     */
    testNavigationFlow() {
        this.addTest('Navigation Flow', () => {
            const mockUIManager = {
                registerModule: () => {},
                sendMessage: (message, data) => {
                    // Mock scene manager responses
                    if (message === 'showScene') return true;
                    if (message === 'getCurrentScene') return { name: 'main_menu' };
                    if (message === 'getPreviousScene') return null;
                    if (message === 'hasScene') return true;
                    return null;
                },
                game: {
                    gameState: {
                        resetToDefaults: () => {},
                        setPlayerClass: () => true,
                        addStoryFlag: () => {}
                    }
                }
            };
            
            const menuUI = new MenuUI(mockUIManager);
            
            // Test navigation methods exist
            const requiredMethods = [
                'startNewGame',
                'loadGame', 
                'startAdventure',
                'showScene',
                'returnToPrevious'
            ];
            
            for (const method of requiredMethods) {
                if (typeof menuUI[method] !== 'function') {
                    throw new Error(`${method} method not found`);
                }
            }
            
            // Test basic navigation calls don't throw errors
            try {
                menuUI.showScene('main_menu');
                menuUI.returnToPrevious();
            } catch (error) {
                throw new Error(`Navigation methods threw error: ${error.message}`);
            }
            
            return 'Navigation flow methods working';
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
        
        console.log('\n📊 MenuUI Validation Results:');
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
            const validator = new MenuUIValidator();
            await validator.runValidation();
        });
    } else {
        // DOM is already ready
        setTimeout(async () => {
            const validator = new MenuUIValidator();
            await validator.runValidation();
        }, 100);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MenuUIValidator;
}