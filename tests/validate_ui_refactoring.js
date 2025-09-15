/**
 * UI Refactoring Validation Tests
 * Ensures all functionality is preserved during UI module refactoring
 */

class UIRefactoringValidator {
    constructor() {
        this.tests = [];
        this.results = [];
        this.monsterUI = null;
    }

    /**
     * Run all validation tests
     */
    async runValidation() {
        console.log('🧪 Starting UI refactoring validation tests...');
        
        try {
            // Test MonsterUI module loading
            await this.testMonsterUILoading();
            
            // Test MonsterUI initialization
            await this.testMonsterUIInitialization();
            
            // Test monster tab switching
            this.testMonsterTabSwitching();
            
            // Test breeding functionality
            this.testBreedingFunctionality();
            
            // Test party management
            this.testPartyManagement();
            
            // Test storage operations
            this.testStorageOperations();
            
            // Test stat calculations
            this.testStatCalculations();
            
            // Test monster selection
            this.testMonsterSelection();
            
            // Test ability management
            this.testAbilityManagement();
            
            // Test interaction workflows
            this.testInteractionWorkflows();
            
        } catch (error) {
            this.recordFailure('Validation suite execution', error.message);
        }
        
        this.printResults();
    }

    // ================================================
    // MODULE LOADING TESTS
    // ================================================

    async testMonsterUILoading() {
        console.log('📦 Testing MonsterUI module loading...');
        
        try {
            // Check if MonsterUI class is available
            this.assertTrue(
                typeof MonsterUI !== 'undefined',
                'MonsterUI class should be globally available'
            );
            
            // Check if UIManager is available
            this.assertTrue(
                typeof UIManager !== 'undefined',
                'UIManager class should be globally available'
            );
            
            // Check if BaseUIModule is available
            this.assertTrue(
                typeof BaseUIModule !== 'undefined',
                'BaseUIModule class should be globally available'
            );
            
            this.recordSuccess('MonsterUI module loading');
        } catch (error) {
            this.recordFailure('MonsterUI module loading', error.message);
        }
    }

    async testMonsterUIInitialization() {
        console.log('🏗️ Testing MonsterUI initialization...');
        
        try {
            // Create mock UIManager
            const mockUIManager = {
                state: { previousModule: null },
                notificationManager: {
                    show: (message, options) => console.log(`Mock notification: ${message}`)
                },
                getGameReference: (refName) => {
                    if (refName === 'gameState') {
                        return {
                            monsters: {
                                party: [null, null, null],
                                storage: [],
                                breedingHistory: []
                            }
                        };
                    }
                    return null;
                }
            };
            
            // Initialize MonsterUI
            this.monsterUI = new MonsterUI(mockUIManager);
            await this.monsterUI.init();
            
            // Verify initialization
            this.assertEqual(this.monsterUI.name, 'MonsterUI', 'Module name should be MonsterUI');
            this.assertEqual(this.monsterUI.selectedTab, 'party', 'Default tab should be party');
            this.assertTrue(this.monsterUI.selectedMonsters instanceof Set, 'selectedMonsters should be a Set');
            this.assertTrue(typeof this.monsterUI.breedingParents === 'object', 'breedingParents should be an object');
            
            this.recordSuccess('MonsterUI initialization');
        } catch (error) {
            this.recordFailure('MonsterUI initialization', error.message);
        }
    }

    // ================================================
    // FUNCTIONALITY PRESERVATION TESTS
    // ================================================

    testMonsterTabSwitching() {
        console.log('📑 Testing monster tab switching...');
        
        try {
            if (!this.monsterUI) throw new Error('MonsterUI not initialized');
            
            // Test switching to different tabs
            this.monsterUI.switchMonsterTab('storage');
            this.assertEqual(this.monsterUI.selectedTab, 'storage', 'Should switch to storage tab');
            
            this.monsterUI.switchMonsterTab('breeding');
            this.assertEqual(this.monsterUI.selectedTab, 'breeding', 'Should switch to breeding tab');
            
            this.monsterUI.switchMonsterTab('party');
            this.assertEqual(this.monsterUI.selectedTab, 'party', 'Should switch back to party tab');
            
            // Verify tab switching methods exist
            this.assertTrue(
                typeof this.monsterUI.switchMonsterTab === 'function',
                'switchMonsterTab method should exist'
            );
            
            this.recordSuccess('Monster tab switching');
        } catch (error) {
            this.recordFailure('Monster tab switching', error.message);
        }
    }

    testBreedingFunctionality() {
        console.log('💕 Testing breeding functionality...');
        
        try {
            if (!this.monsterUI) throw new Error('MonsterUI not initialized');
            
            // Verify breeding methods exist
            const breedingMethods = [
                'refreshBreedingDisplay',
                'updateBreedingSlots',
                'updateBreedingCompatibility',
                'updateBreedingHistory',
                'startBreeding',
                'clearBreedingSelection',
                'selectBreedingParent',
                'checkBreedingCompatibility',
                'calculateBreedingSuitability',
                'getPossibleBreedingOutcomes'
            ];
            
            breedingMethods.forEach(method => {
                this.assertTrue(
                    typeof this.monsterUI[method] === 'function',
                    `${method} method should exist`
                );
            });
            
            // Test breeding compatibility
            const monster1 = { species: 'slime', level: 10 };
            const monster2 = { species: 'slime', level: 12 };
            
            const compatibility = this.monsterUI.checkBreedingCompatibility(monster1, monster2);
            this.assertTrue(compatibility.compatible, 'Same species should be compatible');
            this.assertEqual(compatibility.successRate, 0.9, 'Same species should have 90% success rate');
            
            // Test breeding suitability calculation
            const testMonster = {
                level: 10,
                stats: { hp: 100, attack: 50, defense: 40, speed: 30 },
                currentStats: { hp: 100 },
                abilities: ['Fire Mastery']
            };
            
            const suitability = this.monsterUI.calculateBreedingSuitability(testMonster);
            this.assertTrue(suitability >= 0 && suitability <= 100, 'Suitability score should be 0-100');
            
            // Test breeding state management
            this.monsterUI.clearBreedingSelection();
            this.assertEqual(this.monsterUI.breedingParents.parent1, null, 'Parent1 should be cleared');
            this.assertEqual(this.monsterUI.breedingParents.parent2, null, 'Parent2 should be cleared');
            
            this.recordSuccess('Breeding functionality');
        } catch (error) {
            this.recordFailure('Breeding functionality', error.message);
        }
    }

    testPartyManagement() {
        console.log('👥 Testing party management...');
        
        try {
            if (!this.monsterUI) throw new Error('MonsterUI not initialized');
            
            // Verify party management methods exist
            const partyMethods = [
                'refreshPartyDisplay',
                'healAllPartyMonsters',
                'autoArrangeParty',
                'addMonsterToPartySlot',
                'removeMonsterFromParty',
                'showMonsterSelection',
                'isMonsterInParty'
            ];
            
            partyMethods.forEach(method => {
                this.assertTrue(
                    typeof this.monsterUI[method] === 'function',
                    `${method} method should exist`
                );
            });
            
            // Test party membership checking
            const mockGameState = {
                monsters: {
                    party: [
                        { id: 1, nickname: 'Test Monster' },
                        null,
                        null
                    ]
                }
            };
            
            // Temporarily override game reference
            const originalGetGameReference = this.monsterUI.getGameReference;
            this.monsterUI.getGameReference = () => mockGameState;
            
            this.assertTrue(
                this.monsterUI.isMonsterInParty(1),
                'Should detect monster in party'
            );
            this.assertFalse(
                this.monsterUI.isMonsterInParty(999),
                'Should not detect non-existent monster'
            );
            
            // Restore original method
            this.monsterUI.getGameReference = originalGetGameReference;
            
            this.recordSuccess('Party management');
        } catch (error) {
            this.recordFailure('Party management', error.message);
        }
    }

    testStorageOperations() {
        console.log('📦 Testing storage operations...');
        
        try {
            if (!this.monsterUI) throw new Error('MonsterUI not initialized');
            
            // Verify storage methods exist
            const storageMethods = [
                'refreshStorageDisplay',
                'createMonsterCard',
                'getFilteredMonsters',
                'filterStorage',
                'toggleMonsterSelection',
                'releaseSelectedMonsters',
                'sortStorage'
            ];
            
            storageMethods.forEach(method => {
                this.assertTrue(
                    typeof this.monsterUI[method] === 'function',
                    `${method} method should exist`
                );
            });
            
            // Test monster selection state management
            this.monsterUI.selectedMonsters.clear();
            this.assertEqual(this.monsterUI.selectedMonsters.size, 0, 'Selection should start empty');
            
            // Test filtering functionality
            const testMonsters = [
                {
                    id: 1,
                    species: 'slime',
                    speciesData: { type: ['water'], rarity: 'common' }
                },
                {
                    id: 2,
                    species: 'dragon',
                    speciesData: { type: ['fire'], rarity: 'legendary' }
                }
            ];
            
            // Filter should return all monsters when no filters applied
            const filtered = this.monsterUI.getFilteredMonsters(testMonsters);
            this.assertEqual(filtered.length, 2, 'Should return all monsters without filters');
            
            this.recordSuccess('Storage operations');
        } catch (error) {
            this.recordFailure('Storage operations', error.message);
        }
    }

    testStatCalculations() {
        console.log('📊 Testing stat calculations...');
        
        try {
            if (!this.monsterUI) throw new Error('MonsterUI not initialized');
            
            // Verify stat calculation methods exist
            const statMethods = [
                'calculateEffectiveStats',
                'getPersonalityStatBonuses',
                'getAbilityStatBonuses',
                'getDetailedStatDisplay'
            ];
            
            statMethods.forEach(method => {
                this.assertTrue(
                    typeof this.monsterUI[method] === 'function',
                    `${method} method should exist`
                );
            });
            
            // Test stat calculation with level scaling
            const testMonster = {
                level: 5,
                stats: { hp: 100, attack: 50, defense: 40, speed: 30 }
            };
            
            const effectiveStats = this.monsterUI.calculateEffectiveStats(testMonster);
            this.assertTrue(effectiveStats.hp > testMonster.stats.hp, 'Stats should be scaled by level');
            this.assertEqual(effectiveStats.hp, 140, 'HP should be correctly scaled (100 * 1.4)');
            
            // Test personality bonuses
            const aggressiveBonuses = this.monsterUI.getPersonalityStatBonuses('aggressive');
            this.assertEqual(aggressiveBonuses.attack, 15, 'Aggressive should give +15 attack');
            this.assertEqual(aggressiveBonuses.defense, -5, 'Aggressive should give -5 defense');
            
            // Test ability bonuses
            const fireMasteryBonuses = this.monsterUI.getAbilityStatBonuses('Fire Mastery');
            this.assertEqual(fireMasteryBonuses.magicAttack, 10, 'Fire Mastery should give +10 magic attack');
            
            // Test detailed stat display
            const detailedStats = this.monsterUI.getDetailedStatDisplay(testMonster);
            this.assertTrue(Array.isArray(detailedStats), 'Should return array of stat details');
            this.assertTrue(detailedStats.length > 0, 'Should return at least one stat detail');
            
            this.recordSuccess('Stat calculations');
        } catch (error) {
            this.recordFailure('Stat calculations', error.message);
        }
    }

    testMonsterSelection() {
        console.log('🎯 Testing monster selection...');
        
        try {
            if (!this.monsterUI) throw new Error('MonsterUI not initialized');
            
            // Verify selection methods exist
            const selectionMethods = [
                'showMonsterSelection',
                'showMonsterSelectionModal',
                'populateMonsterSelectionGrid',
                'closeMonsterSelectionModal',
                'selectMonsterForParty'
            ];
            
            selectionMethods.forEach(method => {
                this.assertTrue(
                    typeof this.monsterUI[method] === 'function',
                    `${method} method should exist`
                );
            });
            
            // Verify breeding selection methods exist
            const breedingSelectionMethods = [
                'showBreedingSelectionModal',
                'populateBreedingSelectionGrid',
                'getAvailableBreedingMonsters',
                'closeBreedingSelectionModal'
            ];
            
            breedingSelectionMethods.forEach(method => {
                this.assertTrue(
                    typeof this.monsterUI[method] === 'function',
                    `${method} method should exist`
                );
            });
            
            this.recordSuccess('Monster selection');
        } catch (error) {
            this.recordFailure('Monster selection', error.message);
        }
    }

    testAbilityManagement() {
        console.log('⚡ Testing ability management...');
        
        try {
            if (!this.monsterUI) throw new Error('MonsterUI not initialized');
            
            // Verify ability methods exist
            const abilityMethods = [
                'getAbilityDetails',
                'displayAbilityDetails'
            ];
            
            abilityMethods.forEach(method => {
                this.assertTrue(
                    typeof this.monsterUI[method] === 'function',
                    `${method} method should exist`
                );
            });
            
            // Test ability details retrieval
            const fireDetails = this.monsterUI.getAbilityDetails('Fire Mastery');
            this.assertTrue(typeof fireDetails === 'object', 'Should return ability details object');
            this.assertTrue(typeof fireDetails.description === 'string', 'Should have description');
            this.assertTrue(typeof fireDetails.effect === 'string', 'Should have effect');
            this.assertTrue(typeof fireDetails.type === 'string', 'Should have type');
            this.assertTrue(typeof fireDetails.rarity === 'string', 'Should have rarity');
            
            // Test unknown ability handling
            const unknownDetails = this.monsterUI.getAbilityDetails('Non-existent Ability');
            this.assertEqual(unknownDetails.type, 'Unknown', 'Unknown ability should have Unknown type');
            
            // Test ability display
            const testMonster = {
                abilities: ['Fire Mastery', 'Swift Strike']
            };
            
            const abilityDisplay = this.monsterUI.displayAbilityDetails(testMonster);
            this.assertTrue(typeof abilityDisplay === 'string', 'Should return HTML string');
            this.assertTrue(abilityDisplay.includes('Fire Mastery'), 'Should include ability names');
            
            this.recordSuccess('Ability management');
        } catch (error) {
            this.recordFailure('Ability management', error.message);
        }
    }

    testInteractionWorkflows() {
        console.log('🔄 Testing interaction workflows...');
        
        try {
            if (!this.monsterUI) throw new Error('MonsterUI not initialized');
            
            // Verify workflow methods exist
            const workflowMethods = [
                'showInteractionPrompt',
                'closeInteractionPrompt',
                'showBreedingConfirmationPrompt',
                'executeBreeding',
                'showBreedingStartedWorkflow',
                'simulateBreeding'
            ];
            
            workflowMethods.forEach(method => {
                this.assertTrue(
                    typeof this.monsterUI[method] === 'function',
                    `${method} method should exist`
                );
            });
            
            // Verify modal management methods exist
            const modalMethods = [
                'showMonsterDetails',
                'closeMonsterModal',
                'closeBreedingConfirmModal'
            ];
            
            modalMethods.forEach(method => {
                this.assertTrue(
                    typeof this.monsterUI[method] === 'function',
                    `${method} method should exist`
                );
            });
            
            // Test hybrid species generation
            this.assertTrue(
                typeof this.monsterUI.getHybridSpecies === 'function',
                'getHybridSpecies method should exist'
            );
            
            const hybridSpecies = this.monsterUI.getHybridSpecies('dragon', 'phoenix');
            this.assertEqual(hybridSpecies, 'flame_dragon', 'Should return correct hybrid species');
            
            this.recordSuccess('Interaction workflows');
        } catch (error) {
            this.recordFailure('Interaction workflows', error.message);
        }
    }

    // ================================================
    // UTILITY METHODS
    // ================================================

    assertTrue(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    assertFalse(condition, message) {
        if (condition) {
            throw new Error(`Assertion failed: ${message} (expected false, got true)`);
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${message} (expected ${expected}, got ${actual})`);
        }
    }

    recordSuccess(testName) {
        this.results.push({
            test: testName,
            status: 'PASS',
            message: 'Test completed successfully'
        });
    }

    recordFailure(testName, error) {
        this.results.push({
            test: testName,
            status: 'FAIL',
            message: error
        });
    }

    printResults() {
        console.log('\n📊 UI Refactoring Validation Results:');
        console.log('=====================================');
        
        let passed = 0;
        let failed = 0;
        
        this.results.forEach(result => {
            const status = result.status === 'PASS' ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.message}`);
            
            if (result.status === 'PASS') passed++;
            else failed++;
        });
        
        console.log('\n📈 Summary:');
        console.log(`Total tests: ${passed + failed}`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
        
        if (failed === 0) {
            console.log('\n🎉 All validation tests passed! UI refactoring is successful.');
        } else {
            console.log('\n⚠️ Some tests failed. Please review the failing components.');
        }
    }
}

// Export for use in test runner
if (typeof window !== 'undefined') {
    window.UIRefactoringValidator = UIRefactoringValidator;
}

// Auto-run if loaded in browser
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        if (window.location.pathname.includes('test-runner') || 
            window.location.search.includes('validate-ui')) {
            console.log('🚀 Auto-running UI refactoring validation...');
            const validator = new UIRefactoringValidator();
            await validator.runValidation();
        }
    });
}