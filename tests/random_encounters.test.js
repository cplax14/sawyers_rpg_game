/**
 * Unit Tests for Random Encounters (6.3)
 */

describe('Random Encounters Tests', () => {
    let game;
    let gameState;

    beforeAll(() => {
        assertTruthy(typeof window.SawyersRPG !== 'undefined', 'Global game instance should be defined');
        game = window.SawyersRPG;
        assertTruthy(typeof game.getGameState === 'function', 'Global game instance should expose getGameState');
        gameState = game.getGameState();
        assertTruthy(gameState, 'GameState should be available');
    });

    beforeEach(() => {
        gameState.resetToDefaults();
    });

    it('does not generate encounters in areas with encounterRate 0', () => {
        const enc = AreaData.generateRandomEncounter('starting_village', gameState.player.level);
        assertEqual(enc, null, 'No encounters should occur in towns with 0 rate');
    });

    it('respects encounterRate chance gate', () => {
        // Force RNG high to skip encounter
        const originalRandom = Math.random;
        Math.random = () => 0.999; // 99.9 -> often greater than rate
        try {
            const none = AreaData.generateRandomEncounter('forest_path', gameState.player.level);
            // forest_path has 30% rate, with 99.9 roll -> no encounter
            assertEqual(none, null, 'Encounter should not trigger at high RNG');
        } finally {
            Math.random = originalRandom;
        }
    });

    it('generates a valid encounter when RNG favors it', () => {
        // Unlock forest_path first
        gameState.addStoryFlag('tutorial_complete');
        assertTruthy(gameState.travelToArea('forest_path'), 'Should be able to travel to forest_path');
        const originalRandom = Math.random;
        Math.random = () => 0.0; // Force encounter gate and weighted choice
        try {
            const enc = AreaData.generateRandomEncounter('forest_path', gameState.player.level);
            assertTruthy(!!enc, 'Encounter should be generated');
            // Species must be in area monsters
            const allowed = AreaData.getAreaMonsters('forest_path');
            assertTruthy(allowed.includes(enc.species), 'Encounter species should come from area monsters');
            // Level should be near player level (within +/- 3 per MonsterData)
            const diff = Math.abs(enc.level - gameState.player.level);
            assertTruthy(diff <= 3, 'Encounter level should be near player level');
        } finally {
            Math.random = originalRandom;
        }
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Random encounter tests loaded.');
}
