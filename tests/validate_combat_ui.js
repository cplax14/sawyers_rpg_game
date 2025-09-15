/**
 * Basic validation test for CombatUI module
 * Ensures core combat functionality is preserved from original ui.js
 */

class CombatUIValidator {
    constructor() {
        this.tests = [];
        this.results = [];
    }

    /**
     * Run all validation tests
     */
    async runValidation() {
        console.log('🧪 Starting CombatUI validation tests...');
        
        // Test module loading
        this.testModuleLoading();
        
        // Test initialization
        await this.testInitialization();
        
        // Test combat interface attachment
        this.testCombatInterfaceAttachment();
        
        // Test combat actions
        this.testCombatActions();
        
        // Test submenu management
        this.testSubmenuManagement();
        
        // Test target selection
        this.testTargetSelection();
        
        // Test spell and item management
        this.testSpellAndItemManagement();
        
        // Test battle log management
        this.testBattleLogManagement();
        
        // Test combat display updates
        this.testCombatDisplayUpdates();
        
        // Test turn management
        this.testTurnManagement();
        
        // Report results
        this.reportResults();
        
        return this.allTestsPassed();
    }

    /**
     * Test that CombatUI module loads correctly
     */
    testModuleLoading() {
        this.addTest('Module Loading', () => {
            // Check if CombatUI class exists
            if (typeof CombatUI === 'undefined') {
                throw new Error('CombatUI class not found');
            }
            
            // Check if it extends BaseUIModule
            if (!(CombatUI.prototype instanceof BaseUIModule)) {
                throw new Error('CombatUI does not extend BaseUIModule');
            }
            
            return 'CombatUI module loaded successfully';
        });
    }

    /**
     * Test CombatUI initialization
     */
    async testInitialization() {
        this.addTest('Initialization', async () => {
            // Create mock UIManager
            const mockUIManager = {
                registerModule: () => {},
                sendMessage: () => {},
                game: {
                    gameState: {
                        combat: {
                            inCombat: true,
                            player: { name: 'Test Player', hp: 100, maxHp: 100, mana: 50, maxMana: 50 },
                            enemies: [{ name: 'Test Enemy', hp: 50, maxHp: 50 }],
                            battleLog: [],
                            currentTurn: 'player',
                            turnCount: 1
                        }
                    }
                }
            };
            
            // Create CombatUI instance
            const combatUI = new CombatUI(mockUIManager);
            
            // Test initialization
            const result = await combatUI.init();
            
            if (!result) {
                throw new Error('CombatUI initialization failed');
            }
            
            // Check required properties
            if (combatUI.currentSubmenu !== null) {
                throw new Error('currentSubmenu not properly initialized');
            }
            
            if (!combatUI.scenes.includes('combat')) {
                throw new Error('combat scene not registered');
            }
            
            return 'CombatUI initialized successfully';
        });
    }

    /**
     * Test combat interface attachment
     */
    testCombatInterfaceAttachment() {
        this.addTest('Combat Interface Attachment', () => {
            const mockUIManager = {
                registerModule: () => {},
                sendMessage: () => {},
                game: { gameState: {} }
            };
            const combatUI = new CombatUI(mockUIManager);
            
            // Test interface attachment method exists
            if (typeof combatUI.attachCombatInterface !== 'function') {
                throw new Error('attachCombatInterface method not found');
            }
            
            // Test that attachButton method is called for each combat button
            let attachButtonCalls = 0;
            const originalAttachButton = combatUI.attachButton;
            combatUI.attachButton = () => { attachButtonCalls++; };
            
            combatUI.attachCombatInterface();
            
            // Should attach buttons for: attack, magic, items, capture, flee, magic-back, items-back, target-back
            if (attachButtonCalls < 8) {
                throw new Error(`Expected at least 8 button attachments, got ${attachButtonCalls}`);
            }
            
            // Restore original method
            combatUI.attachButton = originalAttachButton;
            
            return 'Combat interface attachment working';
        });
    }

    /**
     * Test combat actions
     */
    testCombatActions() {
        this.addTest('Combat Actions', () => {
            // Mock game state with combat
            window.GameState = {
                combat: {
                    performAttack: () => ({ success: true }),
                    attemptCapture: () => ({ success: true }),
                    castSpell: () => ({ success: true }),
                    useItem: () => ({ success: true }),
                    attemptFlee: () => ({ success: true }),
                    player: { name: 'Player' },
                    enemies: [{ name: 'Enemy', hp: 50 }]
                }
            };
            
            const mockUIManager = {
                registerModule: () => {},
                sendMessage: () => {},
                game: { gameState: window.GameState }
            };
            const combatUI = new CombatUI(mockUIManager);
            
            // Test combat action methods
            const actionMethods = [
                'handleCombatAction',
                'executeTargetedAction'
            ];
            
            for (const method of actionMethods) {
                if (typeof combatUI[method] !== 'function') {
                    throw new Error(`${method} method not found`);
                }
            }
            
            // Test basic combat action handling (should not throw)
            try {
                combatUI.handleCombatAction('attack');
                combatUI.handleCombatAction('flee');
            } catch (error) {
                throw new Error(`Combat action handling failed: ${error.message}`);
            }
            
            // Cleanup
            delete window.GameState;
            
            return 'Combat actions functionality working';
        });
    }

    /**
     * Test submenu management
     */
    testSubmenuManagement() {
        this.addTest('Submenu Management', () => {
            // Create test DOM elements
            const testContainer = document.createElement('div');
            testContainer.innerHTML = `
                <div id="main-action-menu">Main Menu</div>
                <div id="magic-submenu" class="hidden">
                    <div class="spell-list"></div>
                </div>
                <div id="items-submenu" class="hidden">
                    <div class="item-list"></div>
                </div>
                <div id="target-selection" class="hidden">
                    <div class="target-list"></div>
                </div>
            `;
            document.body.appendChild(testContainer);
            
            try {
                const mockUIManager = {
                    registerModule: () => {},
                    sendMessage: () => {},
                    game: { gameState: {} }
                };
                const combatUI = new CombatUI(mockUIManager);
                
                // Test submenu methods
                const submenuMethods = [
                    'showSubMenu',
                    'hideSubMenu',
                    'hideAllSubMenus'
                ];
                
                for (const method of submenuMethods) {
                    if (typeof combatUI[method] !== 'function') {
                        throw new Error(`${method} method not found`);
                    }
                }
                
                // Test showing and hiding submenus
                combatUI.showSubMenu('magic-submenu');
                if (combatUI.currentSubmenu !== 'magic-submenu') {
                    throw new Error('Submenu state not tracked correctly');
                }
                
                combatUI.hideSubMenu('magic-submenu');
                if (combatUI.currentSubmenu !== null) {
                    throw new Error('Submenu state not reset correctly');
                }
                
                // Test hiding all submenus
                combatUI.showSubMenu('items-submenu');
                combatUI.hideAllSubMenus();
                if (combatUI.currentSubmenu !== null) {
                    throw new Error('hideAllSubMenus not working correctly');
                }
                
                return 'Submenu management functionality working';
            } finally {
                // Cleanup
                document.body.removeChild(testContainer);
            }
        });
    }

    /**
     * Test target selection
     */
    testTargetSelection() {
        this.addTest('Target Selection', () => {
            // Create test DOM elements
            const testContainer = document.createElement('div');
            testContainer.innerHTML = `
                <div id="main-action-menu">Main Menu</div>
                <div id="target-selection" class="hidden">
                    <div class="target-list"></div>
                </div>
            `;
            document.body.appendChild(testContainer);
            
            // Mock game state
            window.GameState = {
                combat: {
                    enemies: [
                        { name: 'Enemy 1', hp: 50, maxHp: 50 },
                        { name: 'Enemy 2', hp: 30, maxHp: 50 }
                    ],
                    player: { name: 'Player', hp: 100, maxHp: 100 }
                }
            };
            
            try {
                const mockUIManager = {
                    registerModule: () => {},
                    sendMessage: () => {},
                    game: { gameState: window.GameState }
                };
                const combatUI = new CombatUI(mockUIManager);
                
                // Test target selection methods
                const targetMethods = [
                    'showTargetSelection',
                    'populateTargetList'
                ];
                
                for (const method of targetMethods) {
                    if (typeof combatUI[method] !== 'function') {
                        throw new Error(`${method} method not found`);
                    }
                }
                
                // Test showing target selection
                combatUI.showTargetSelection('attack');
                if (combatUI.selectedAction !== 'attack') {
                    throw new Error('Selected action not tracked correctly');
                }
                
                // Test target population
                combatUI.populateTargetList('attack');
                const targetList = document.querySelector('#target-selection .target-list');
                if (!targetList || targetList.children.length === 0) {
                    throw new Error('Target list not populated correctly');
                }
                
                return 'Target selection functionality working';
            } finally {
                // Cleanup
                document.body.removeChild(testContainer);
                delete window.GameState;
            }
        });
    }

    /**
     * Test spell and item management
     */
    testSpellAndItemManagement() {
        this.addTest('Spell and Item Management', () => {
            // Create test DOM elements
            const testContainer = document.createElement('div');
            testContainer.innerHTML = `
                <div id="magic-submenu">
                    <div class="spell-list"></div>
                </div>
                <div id="items-submenu">
                    <div class="item-list"></div>
                </div>
            `;
            document.body.appendChild(testContainer);
            
            // Mock game state
            window.GameState = {
                player: {
                    spells: [
                        { name: 'Fireball', manaCost: 10 },
                        { name: 'Heal', manaCost: 5 }
                    ],
                    mana: 20,
                    inventory: {
                        'potion': 3,
                        'ether': 1,
                        'sword': 1 // Not usable in combat
                    }
                }
            };
            
            try {
                const mockUIManager = {
                    registerModule: () => {},
                    sendMessage: () => {},
                    game: { gameState: window.GameState }
                };
                const combatUI = new CombatUI(mockUIManager);
                
                // Test spell and item methods
                const methods = [
                    'populateSpellList',
                    'populateItemList',
                    'isUsableInCombat'
                ];
                
                for (const method of methods) {
                    if (typeof combatUI[method] !== 'function') {
                        throw new Error(`${method} method not found`);
                    }
                }
                
                // Test spell list population
                combatUI.populateSpellList();
                const spellList = document.querySelector('#magic-submenu .spell-list');
                if (!spellList || spellList.children.length === 0) {
                    throw new Error('Spell list not populated correctly');
                }
                
                // Test item list population
                combatUI.populateItemList();
                const itemList = document.querySelector('#items-submenu .item-list');
                if (!itemList || itemList.children.length === 0) {
                    throw new Error('Item list not populated correctly');
                }
                
                // Test combat item filtering
                if (!combatUI.isUsableInCombat('potion')) {
                    throw new Error('Combat item filtering not working correctly');
                }
                
                if (combatUI.isUsableInCombat('sword')) {
                    throw new Error('Non-combat item incorrectly marked as usable');
                }
                
                return 'Spell and item management functionality working';
            } finally {
                // Cleanup
                document.body.removeChild(testContainer);
                delete window.GameState;
            }
        });
    }

    /**
     * Test battle log management
     */
    testBattleLogManagement() {
        this.addTest('Battle Log Management', () => {
            // Create test DOM elements
            const testContainer = document.createElement('div');
            testContainer.innerHTML = `
                <div id="battle-log"></div>
            `;
            document.body.appendChild(testContainer);
            
            // Mock game state
            window.GameState = {
                combat: {
                    battleLog: []
                }
            };
            
            try {
                const mockUIManager = {
                    registerModule: () => {},
                    sendMessage: () => {},
                    game: { gameState: window.GameState }
                };
                const combatUI = new CombatUI(mockUIManager);
                
                // Test battle log methods
                const logMethods = [
                    'updateBattleLog',
                    'addBattleLogEntry',
                    'clearBattleLog',
                    'getBattleLogEntries'
                ];
                
                for (const method of logMethods) {
                    if (typeof combatUI[method] !== 'function') {
                        throw new Error(`${method} method not found`);
                    }
                }
                
                // Test adding log entries
                combatUI.addBattleLogEntry('Test attack', 'attack');
                const entries = combatUI.getBattleLogEntries();
                if (entries.length !== 1) {
                    throw new Error('Battle log entry not added correctly');
                }
                
                // Test clearing log
                combatUI.clearBattleLog();
                const clearedEntries = combatUI.getBattleLogEntries();
                if (clearedEntries.length !== 0) {
                    throw new Error('Battle log not cleared correctly');
                }
                
                return 'Battle log management functionality working';
            } finally {
                // Cleanup
                document.body.removeChild(testContainer);
                delete window.GameState;
            }
        });
    }

    /**
     * Test combat display updates
     */
    testCombatDisplayUpdates() {
        this.addTest('Combat Display Updates', () => {
            // Create test DOM elements
            const testContainer = document.createElement('div');
            testContainer.innerHTML = `
                <div id="player-hp">100/100</div>
                <div id="player-mp">50/50</div>
                <div class="player-hp-bar"><div class="hp-fill"></div></div>
                <div class="player-mp-bar"><div class="mp-fill"></div></div>
                <div data-enemy-index="0">
                    <div class="enemy-name">Enemy</div>
                    <div class="enemy-hp">50/50</div>
                    <div class="enemy-hp-bar"><div class="hp-fill"></div></div>
                </div>
                <div id="battle-log"></div>
            `;
            document.body.appendChild(testContainer);
            
            // Mock game state
            window.GameState = {
                combat: {
                    player: { name: 'Player', hp: 80, maxHp: 100, mana: 30, maxMana: 50 },
                    enemies: [{ name: 'Enemy', hp: 25, maxHp: 50 }],
                    battleLog: ['Test log entry']
                }
            };
            
            try {
                const mockUIManager = {
                    registerModule: () => {},
                    sendMessage: () => {},
                    game: { gameState: window.GameState }
                };
                const combatUI = new CombatUI(mockUIManager);
                
                // Test display update methods
                const updateMethods = [
                    'updateCombatDisplay',
                    'updatePlayerDisplay',
                    'updateEnemyDisplays',
                    'updateActionButtonStates'
                ];
                
                for (const method of updateMethods) {
                    if (typeof combatUI[method] !== 'function') {
                        throw new Error(`${method} method not found`);
                    }
                }
                
                // Test updating combat display
                combatUI.updateCombatDisplay();
                
                // Verify player HP was updated
                const playerHP = document.getElementById('player-hp');
                if (playerHP.textContent !== '80/100') {
                    throw new Error('Player HP not updated correctly');
                }
                
                return 'Combat display updates functionality working';
            } finally {
                // Cleanup
                document.body.removeChild(testContainer);
                delete window.GameState;
            }
        });
    }

    /**
     * Test turn management
     */
    testTurnManagement() {
        this.addTest('Turn Management', () => {
            // Create test DOM elements
            const testContainer = document.createElement('div');
            testContainer.innerHTML = `
                <div id="turn-indicator"></div>
                <div id="turn-order"></div>
                <div id="main-action-menu"></div>
                <div id="combat-messages" class="hidden"></div>
            `;
            document.body.appendChild(testContainer);
            
            // Mock game state
            window.GameState = {
                combat: {
                    currentTurn: 'player',
                    turnCount: 1,
                    player: { name: 'Player', hp: 100, maxHp: 100, initiative: 5 },
                    enemies: [{ name: 'Enemy', hp: 50, maxHp: 50, initiative: 3 }]
                }
            };
            
            try {
                const mockUIManager = {
                    registerModule: () => {},
                    sendMessage: () => {},
                    game: { gameState: window.GameState }
                };
                const combatUI = new CombatUI(mockUIManager);
                
                // Test turn management methods
                const turnMethods = [
                    'updateTurnDisplay',
                    'updateTurnIndicator',
                    'updateTurnOrderDisplay',
                    'startPlayerTurn',
                    'startEnemyTurn',
                    'advanceTurn'
                ];
                
                for (const method of turnMethods) {
                    if (typeof combatUI[method] !== 'function') {
                        throw new Error(`${method} method not found`);
                    }
                }
                
                // Test turn display update
                combatUI.updateTurnDisplay(window.GameState.combat);
                
                // Verify turn indicator was updated
                const turnIndicator = document.getElementById('turn-indicator');
                if (!turnIndicator.textContent.includes('Your Turn')) {
                    throw new Error('Turn indicator not updated correctly');
                }
                
                // Test turn advancement
                combatUI.advanceTurn();
                if (window.GameState.combat.turnCount !== 2) {
                    throw new Error('Turn count not advanced correctly');
                }
                
                return 'Turn management functionality working';
            } finally {
                // Cleanup
                document.body.removeChild(testContainer);
                delete window.GameState;
            }
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
        
        console.log('\n📊 CombatUI Validation Results:');
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
            const validator = new CombatUIValidator();
            await validator.runValidation();
        });
    } else {
        // DOM is already ready
        setTimeout(async () => {
            const validator = new CombatUIValidator();
            await validator.runValidation();
        }, 100);
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatUIValidator;
}