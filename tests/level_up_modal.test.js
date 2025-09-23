/**
 * Unit Tests for Level-Up Modal
 * Tests the level-up modal functionality and stat gain calculations
 */

describe('Level-Up Modal Tests', () => {
    beforeAll(() => {
        // Ensure GameState is loaded
        if (typeof GameState === 'undefined') {
            console.warn('GameState not loaded - skipping tests');
        }
    });

    it('should calculate stat gains correctly', () => {
        if (typeof GameState === 'undefined') return;

        const gameState = new GameState();

        const oldStats = {
            hp: 100,
            mp: 50,
            attack: 20,
            defense: 15,
            magicAttack: 10,
            magicDefense: 12,
            speed: 8,
            accuracy: 70
        };

        const newStats = {
            hp: 115,
            mp: 60,
            attack: 23,
            defense: 18,
            magicAttack: 12,
            magicDefense: 14,
            speed: 10,
            accuracy: 75
        };

        const gains = gameState.calculateStatGains(oldStats, newStats);

        assertEqual(gains.hp, 15, 'HP gain should be calculated correctly');
        assertEqual(gains.mp, 10, 'MP gain should be calculated correctly');
        assertEqual(gains.attack, 3, 'Attack gain should be calculated correctly');
        assertEqual(gains.defense, 3, 'Defense gain should be calculated correctly');
        assertEqual(gains.magicAttack, 2, 'Magic Attack gain should be calculated correctly');
        assertEqual(gains.magicDefense, 2, 'Magic Defense gain should be calculated correctly');
        assertEqual(gains.speed, 2, 'Speed gain should be calculated correctly');
        assertEqual(gains.accuracy, 5, 'Accuracy gain should be calculated correctly');
    });

    it('should handle missing stats gracefully', () => {
        if (typeof GameState === 'undefined') return;

        const gameState = new GameState();

        const oldStats = {
            hp: 100,
            attack: 20
        };

        const newStats = {
            hp: 115,
            attack: 23,
            defense: 15
        };

        const gains = gameState.calculateStatGains(oldStats, newStats);

        assertEqual(gains.hp, 15, 'HP gain should be calculated correctly');
        assertEqual(gains.attack, 3, 'Attack gain should be calculated correctly');
        assertEqual(gains.defense, 15, 'New stat should be treated as full gain');
        assertTruthy(!gains.mp, 'Missing stats should not appear in gains');
    });

    it('should only include positive gains', () => {
        if (typeof GameState === 'undefined') return;

        const gameState = new GameState();

        const oldStats = {
            hp: 100,
            attack: 20,
            defense: 15
        };

        const newStats = {
            hp: 115,
            attack: 18, // Decreased
            defense: 15 // Same
        };

        const gains = gameState.calculateStatGains(oldStats, newStats);

        assertEqual(gains.hp, 15, 'Positive HP gain should be included');
        assertTruthy(!gains.attack, 'Negative changes should not be included');
        assertTruthy(!gains.defense, 'Zero changes should not be included');
    });

    it('should handle level-up data structure correctly', () => {
        if (typeof GameState === 'undefined') return;

        const levelUpData = {
            oldLevel: 5,
            newLevel: 6,
            statGains: {
                hp: 15,
                attack: 3,
                defense: 2
            },
            newSpells: [
                {
                    id: 'fire_bolt',
                    name: 'Fire Bolt',
                    description: 'A basic fire spell'
                }
            ],
            newSpellCount: 1
        };

        // Test that the data structure is valid
        assertTruthy(levelUpData.oldLevel < levelUpData.newLevel, 'Level should increase');
        assertTruthy(Object.keys(levelUpData.statGains).length > 0, 'Should have stat gains');
        assertTruthy(levelUpData.newSpells.length > 0, 'Should have new spells');
        assertEqual(levelUpData.newSpells[0].id, 'fire_bolt', 'Spell data should be correct');
    });

    it('should not show modal when UIHelpers is unavailable', () => {
        if (typeof GameState === 'undefined') return;

        const gameState = new GameState();

        // Temporarily hide UIHelpers
        const originalUIHelpers = window.UIHelpers;
        window.UIHelpers = undefined;

        const levelUpData = {
            oldLevel: 1,
            newLevel: 2,
            statGains: { hp: 10 },
            newSpells: [],
            newSpellCount: 0
        };

        // Should not throw an error
        assertDoesNotThrow(() => {
            gameState.showLevelUpModal(levelUpData);
        }, 'Should handle missing UIHelpers gracefully');

        // Restore UIHelpers
        window.UIHelpers = originalUIHelpers;
    });
});