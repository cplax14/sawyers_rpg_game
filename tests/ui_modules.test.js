/**
 * Unit Tests for UI Modules - Monster Management
 * Tests the MonsterUI module functionality and integration
 */

describe('MonsterUI Module Tests', () => {
    let monsterUI;
    let mockUIManager;
    let mockGameState;

    beforeAll(() => {
        // Create mock UIManager
        mockUIManager = {
            state: { previousModule: null },
            notificationManager: {
                show: (message, options) => console.log(`Notification: ${message}`)
            },
            switchToModule: (moduleName) => console.log(`Switching to: ${moduleName}`),
            getGameReference: (refName) => {
                if (refName === 'gameState') return mockGameState;
                return null;
            }
        };

        // Create mock GameState
        mockGameState = {
            monsters: {
                party: [null, null, null],
                storage: [],
                breedingHistory: []
            },
            breeding: {
                startBreeding: (parent1, parent2) => true,
                checkCompatibility: (p1, p2) => ({ compatible: true, reason: 'Test compatibility' })
            }
        };

        // Ensure MonsterUI class is available
        assertTruthy(typeof MonsterUI !== 'undefined', 'MonsterUI class should be defined');
    });

    beforeEach(() => {
        // Reset mock data
        mockGameState.monsters.party = [null, null, null];
        mockGameState.monsters.storage = [];
        mockGameState.monsters.breedingHistory = [];
        
        // Create fresh MonsterUI instance
        monsterUI = new MonsterUI(mockUIManager);
    });

    // ================================================
    // INITIALIZATION TESTS
    // ================================================

    it('should initialize with correct default values', () => {
        assertEqual(monsterUI.selectedTab, 'party', 'Default selected tab should be party');
        assertTruthy(monsterUI.selectedMonsters instanceof Set, 'selectedMonsters should be a Set');
        assertEqual(monsterUI.selectedMonsters.size, 0, 'selectedMonsters should be empty initially');
        assertTruthy(monsterUI.breedingParents, 'breedingParents should be initialized');
        assertEqual(monsterUI.breedingParents.parent1, null, 'breeding parent1 should be null initially');
        assertEqual(monsterUI.breedingParents.parent2, null, 'breeding parent2 should be null initially');
    });

    it('should have correct module name and dependencies', () => {
        assertEqual(monsterUI.name, 'MonsterUI', 'Module name should be MonsterUI');
        assertTruthy(monsterUI.options.scenes.includes('monsters'), 'Should handle monsters scene');
        assertTruthy(monsterUI.options.dependencies.includes('UIHelpers'), 'Should depend on UIHelpers');
    });

    // ================================================
    // TAB MANAGEMENT TESTS
    // ================================================

    it('should switch tabs correctly', () => {
        monsterUI.switchMonsterTab('storage');
        assertEqual(monsterUI.selectedTab, 'storage', 'Should switch to storage tab');
        
        monsterUI.switchMonsterTab('breeding');
        assertEqual(monsterUI.selectedTab, 'breeding', 'Should switch to breeding tab');
        
        monsterUI.switchMonsterTab('party');
        assertEqual(monsterUI.selectedTab, 'party', 'Should switch back to party tab');
    });

    // ================================================
    // STAT CALCULATION TESTS
    // ================================================

    it('should calculate effective stats correctly', () => {
        const testMonster = {
            level: 5,
            stats: { hp: 100, attack: 50, defense: 40, speed: 30 },
            personality: 'aggressive',
            abilities: ['Fire Mastery']
        };

        const effectiveStats = monsterUI.calculateEffectiveStats(testMonster);
        
        // Level scaling: 1 + (5-1) * 0.1 = 1.4 multiplier
        // Base HP: 100 * 1.4 = 140
        // Aggressive personality: no HP bonus
        // Fire Mastery: no HP bonus
        // Expected: 140
        assertEqual(effectiveStats.hp, 140, 'HP should be scaled by level');
        
        // Base Attack: 50 * 1.4 = 70
        // Aggressive personality: +15 attack
        // Fire Mastery: +5 attack
        // Expected: 70 + 15 + 5 = 90
        assertEqual(effectiveStats.attack, 90, 'Attack should include level, personality, and ability bonuses');
    });

    it('should handle monsters without personality or abilities', () => {
        const basicMonster = {
            level: 1,
            stats: { hp: 50, attack: 25, defense: 20, speed: 15 }
        };

        const effectiveStats = monsterUI.calculateEffectiveStats(basicMonster);
        
        assertEqual(effectiveStats.hp, 50, 'HP should remain unchanged for level 1 monster');
        assertEqual(effectiveStats.attack, 25, 'Attack should remain unchanged without bonuses');
    });

    it('should ensure stats never go below 1', () => {
        const weakMonster = {
            level: 1,
            stats: { hp: 1, attack: 1, defense: 1, speed: 1 },
            personality: 'defensive' // This gives -5 attack
        };

        const effectiveStats = monsterUI.calculateEffectiveStats(weakMonster);
        
        // Even with -5 attack from personality, should not go below 1
        assertEqual(effectiveStats.attack, 1, 'Attack should not go below 1');
        assertTruthy(effectiveStats.hp >= 1, 'HP should not go below 1');
    });

    // ================================================
    // BREEDING COMPATIBILITY TESTS
    // ================================================

    it('should detect same species compatibility', () => {
        const slime1 = { species: 'slime', level: 10 };
        const slime2 = { species: 'slime', level: 12 };

        const compatibility = monsterUI.checkBreedingCompatibility(slime1, slime2);
        
        assertTruthy(compatibility.compatible, 'Same species should be compatible');
        assertEqual(compatibility.successRate, 0.9, 'Same species should have 90% success rate');
        assertTruthy(compatibility.reason.includes('Same species'), 'Reason should mention same species');
    });

    it('should detect type compatibility', () => {
        const fireMonster = {
            species: 'phoenix',
            level: 10,
            speciesData: { type: ['fire', 'flying'] }
        };
        const earthMonster = {
            species: 'golem',
            level: 11,
            speciesData: { type: ['earth', 'basic'] }
        };

        const compatibility = monsterUI.checkBreedingCompatibility(fireMonster, earthMonster);
        
        assertTruthy(compatibility.compatible, 'Fire and earth types should be compatible');
        assertEqual(compatibility.successRate, 0.6, 'Complementary types should have 60% success rate');
    });

    it('should reject monsters with large level differences', () => {
        const lowLevel = { species: 'slime', level: 5 };
        const highLevel = { species: 'dragon', level: 20 };

        const compatibility = monsterUI.checkBreedingCompatibility(lowLevel, highLevel);
        
        assertFalsy(compatibility.compatible, 'Large level difference should be incompatible');
        assertEqual(compatibility.successRate, 0, 'Incompatible should have 0% success rate');
    });

    // ================================================
    // BREEDING SUITABILITY TESTS
    // ================================================

    it('should calculate breeding suitability correctly', () => {
        const excellentMonster = {
            level: 20, // 20 * 2 = 40 points (max 30, so 30)
            stats: { hp: 100, attack: 80, defense: 70, speed: 60, mp: 50 }, // total 360, /10 = 36 (max 25, so 25)
            currentStats: { hp: 100 }, // 100% health = 20 points
            abilities: ['Fire Mastery', 'Swift Strike', 'Iron Will', 'Keen Eye', 'Thick Skin'] // 5 abilities * 5 = 25 points
        };

        const score = monsterUI.calculateBreedingSuitability(excellentMonster);
        
        // Expected: 30 (level) + 20 (health) + 25 (abilities) + 25 (stats) = 100
        assertEqual(score, 100, 'Excellent monster should get maximum score');
        assertEqual(monsterUI.getSuitabilityText(score), 'Excellent', 'Score 100 should be Excellent');
        assertEqual(monsterUI.getSuitabilityClass(score), 'excellent', 'Score 100 should have excellent class');
    });

    it('should calculate poor breeding suitability', () => {
        const poorMonster = {
            level: 5, // 5 * 2 = 10 points
            stats: { hp: 30, attack: 20, defense: 15, speed: 10, mp: 15 }, // total 90, /10 = 9 points
            currentStats: { hp: 15 }, // 50% health = 10 points
            abilities: [] // 0 abilities = 0 points
        };

        const score = monsterUI.calculateBreedingSuitability(poorMonster);
        
        // Expected: 10 (level) + 10 (health) + 0 (abilities) + 9 (stats) = 29
        assertEqual(score, 29, 'Poor monster should get low score');
        assertEqual(monsterUI.getSuitabilityText(score), 'Poor', 'Score 29 should be Poor');
        assertEqual(monsterUI.getSuitabilityClass(score), 'poor', 'Score 29 should have poor class');
    });

    // ================================================
    // ABILITY SYSTEM TESTS
    // ================================================

    it('should provide detailed ability information', () => {
        const fireDetails = monsterUI.getAbilityDetails('Fire Mastery');
        
        assertEqual(fireDetails.type, 'Offensive', 'Fire Mastery should be Offensive type');
        assertEqual(fireDetails.rarity, 'Common', 'Fire Mastery should be Common rarity');
        assertTruthy(fireDetails.description.includes('fire'), 'Description should mention fire');
        assertTruthy(fireDetails.effect.includes('Magic Attack'), 'Effect should mention Magic Attack');
    });

    it('should handle unknown abilities gracefully', () => {
        const unknownDetails = monsterUI.getAbilityDetails('Unknown Ability');
        
        assertEqual(unknownDetails.type, 'Unknown', 'Unknown ability should have Unknown type');
        assertEqual(unknownDetails.rarity, 'Unknown', 'Unknown ability should have Unknown rarity');
        assertTruthy(unknownDetails.description.includes('unique'), 'Should have generic description');
    });

    it('should display ability details correctly', () => {
        const testMonster = {
            abilities: ['Fire Mastery', 'Swift Strike']
        };

        const abilityDisplay = monsterUI.displayAbilityDetails(testMonster);
        
        assertTruthy(abilityDisplay.includes('Fire Mastery'), 'Should include Fire Mastery');
        assertTruthy(abilityDisplay.includes('Swift Strike'), 'Should include Swift Strike');
        assertTruthy(abilityDisplay.includes('ability-detail-card'), 'Should have proper card structure');
        assertTruthy(abilityDisplay.includes('common'), 'Should include rarity class');
    });

    // ================================================
    // BREEDING SELECTION TESTS
    // ================================================

    it('should filter breeding monsters correctly', () => {
        // Set up test data
        mockGameState.monsters.storage = [
            { id: 1, level: 6, currentStats: { hp: 50 }, stats: { hp: 60 } }, // Good candidate
            { id: 2, level: 3, currentStats: { hp: 30 }, stats: { hp: 40 } }, // Too low level
            { id: 3, level: 8, currentStats: { hp: 10 }, stats: { hp: 80 } }, // Too low health
            { id: 4, level: 10, currentStats: { hp: 100 }, stats: { hp: 100 } } // Good candidate
        ];
        mockGameState.monsters.party = [
            { id: 5, level: 12 }, null, null // One in party
        ];

        const availableMonsters = monsterUI.getAvailableBreedingMonsters();
        
        assertEqual(availableMonsters.length, 2, 'Should return 2 valid breeding candidates');
        assertTruthy(availableMonsters.find(m => m.id === 1), 'Should include monster 1');
        assertTruthy(availableMonsters.find(m => m.id === 4), 'Should include monster 4');
        assertFalsy(availableMonsters.find(m => m.id === 2), 'Should exclude low level monster');
        assertFalsy(availableMonsters.find(m => m.id === 3), 'Should exclude low health monster');
        assertFalsy(availableMonsters.find(m => m.id === 5), 'Should exclude party member');
    });

    // ================================================
    // BREEDING OUTCOME TESTS
    // ================================================

    it('should generate correct breeding outcomes for same species', () => {
        const slime1 = { species: 'slime' };
        const slime2 = { species: 'slime' };

        const outcomes = monsterUI.getPossibleBreedingOutcomes(slime1, slime2);
        
        assertTruthy(outcomes.length > 0, 'Should generate at least one outcome');
        assertTruthy(outcomes.find(o => o.species === 'slime'), 'Should include slime as outcome');
        const slimeOutcome = outcomes.find(o => o.species === 'slime');
        assertEqual(slimeOutcome.probability, 0.8, 'Same species should have 80% probability');
    });

    it('should generate hybrid outcomes when applicable', () => {
        const dragon = { species: 'dragon' };
        const phoenix = { species: 'phoenix' };

        const outcomes = monsterUI.getPossibleBreedingOutcomes(dragon, phoenix);
        
        assertTruthy(outcomes.length >= 3, 'Should generate multiple outcomes');
        assertTruthy(outcomes.find(o => o.species === 'dragon'), 'Should include dragon as outcome');
        assertTruthy(outcomes.find(o => o.species === 'phoenix'), 'Should include phoenix as outcome');
        assertTruthy(outcomes.find(o => o.species === 'flame_dragon'), 'Should include flame_dragon hybrid');
    });

    // ================================================
    // UTILITY METHOD TESTS
    // ================================================

    it('should provide correct monster icons', () => {
        assertEqual(monsterUI.getMonsterIcon('slime'), '🟢', 'Slime should have green circle icon');
        assertEqual(monsterUI.getMonsterIcon('dragon'), '🐉', 'Dragon should have dragon emoji');
        assertEqual(monsterUI.getMonsterIcon('unknown'), '👾', 'Unknown species should have default icon');
    });

    it('should check party membership correctly', () => {
        mockGameState.monsters.party = [
            { id: 1 },
            { id: 2 },
            null
        ];

        assertTruthy(monsterUI.isMonsterInParty(1), 'Should detect monster 1 in party');
        assertTruthy(monsterUI.isMonsterInParty(2), 'Should detect monster 2 in party');
        assertFalsy(monsterUI.isMonsterInParty(3), 'Should not detect monster 3 in party');
    });

    // ================================================
    // ERROR HANDLING TESTS
    // ================================================

    it('should handle null or undefined monsters gracefully', () => {
        const nullStats = monsterUI.calculateEffectiveStats(null);
        assertTruthy(typeof nullStats === 'object', 'Should return object for null monster');
        assertEqual(nullStats.hp, 0, 'Should return 0 stats for null monster');

        const undefinedStats = monsterUI.calculateEffectiveStats(undefined);
        assertTruthy(typeof undefinedStats === 'object', 'Should return object for undefined monster');
        assertEqual(undefinedStats.attack, 0, 'Should return 0 stats for undefined monster');
    });

    it('should handle monsters without stats gracefully', () => {
        const monsterNoStats = { level: 5 };
        const effectiveStats = monsterUI.calculateEffectiveStats(monsterNoStats);
        
        assertTruthy(typeof effectiveStats === 'object', 'Should return object for monster without stats');
        assertEqual(effectiveStats.hp, 0, 'Should return 0 for missing stats');
    });
});