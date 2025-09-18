/**
 * Unit Tests for Area-specific Spawn Tables (6.4)
 */

describe('Area Spawn Tables Tests', () => {
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
        gameState.addStoryFlag('tutorial_complete');
    });

    it('generateRandomEncounter uses local spawnTable when present (forest_path)', () => {
        const originalRandom = Math.random;
        try {
            // Force encounter gate and first weighted pick
            let seq = [0.0, 0.0];
            Math.random = () => seq.shift() ?? 0.0;
            const enc = AreaData.generateRandomEncounter('forest_path', gameState.player.level);
            assertTruthy(!!enc, 'Encounter should be generated');
            assertEqual(enc.species, 'slime', 'First weighted pick should return the first species by weight');
        } finally {
            Math.random = originalRandom;
        }
    });

    xit('weighted choice can reach later entries (deep_forest)', () => {
        const originalRandom = Math.random;
        try {
            // Test that we can reach the last entry by running multiple encounters
            const table = AreaData.getArea('deep_forest').spawnTable;
            const lastSpecies = table[table.length - 1].species;
            let foundLastSpecies = false;

            // Try multiple encounters to verify the last species can be selected
            for (let i = 0; i < 50; i++) {
                // Always pass encounter gate, vary the weighted choice
                let seq = [0.0, 0.7, 0.7, Math.random()];
                Math.random = () => seq.shift() ?? Math.random();

                const enc = AreaData.generateRandomEncounter('deep_forest', gameState.player.level);
                if (enc && enc.species === lastSpecies) {
                    foundLastSpecies = true;
                    break;
                }
            }

            assertTruthy(foundLastSpecies, 'Should be able to encounter the last species in spawn table');
        } finally {
            Math.random = originalRandom;
        }
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Area spawn tables tests loaded.');
}
