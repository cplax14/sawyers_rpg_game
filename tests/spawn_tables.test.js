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

    it('weighted choice can reach later entries (deep_forest)', () => {
        const originalRandom = Math.random;
        try {
            // First roll passes encounter gate; second roll near the end selects last entry if roll > cumulative of previous
            const table = AreaData.getArea('deep_forest').spawnTable;
            const total = table.reduce((s, e) => s + e.weight, 0);
            // Roll very close to total to fall into last bucket
            let seq = [0.0, (total - 0.001) / total];
            Math.random = () => seq.shift() ?? 0.5;
            const enc = AreaData.generateRandomEncounter('deep_forest', gameState.player.level);
            assertTruthy(!!enc, 'Encounter should be generated');
            assertEqual(enc.species, table[table.length - 1].species, 'Weighted pick near total should choose last species');
        } finally {
            Math.random = originalRandom;
        }
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Area spawn tables tests loaded.');
}
