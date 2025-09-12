/**
 * Unit Tests for Monster Breeding (4.6)
 */

describe('Monster Breeding Tests', () => {
    let game;
    let gameState;

    beforeAll(() => {
        assertTruthy(typeof window.SawyersRPG !== 'undefined', 'Global game instance should be defined');
        game = window.SawyersRPG;
        assertTruthy(typeof game.getGameState === 'function', 'Global game instance should expose getGameState');
        gameState = game.getGameState();
        assertTruthy(gameState, 'GameState should be available');

        // Ensure breeding system is initialized
        if (!gameState.breeding) {
            gameState.initializeBreedingSystem();
        }
        assertTruthy(gameState.breeding, 'Breeding system should be initialized');
    });

    beforeEach(() => {
        // Reset monsters and breeding state to a known baseline for each test
        gameState.resetToDefaults();
        gameState.initializeBreedingSystem();
    });

    it('canBreed returns true for compatible, ready monsters', () => {
        // Create two compatible monsters (slime + goblin), level >=10
        const slimeId = gameState.captureMonster('slime', 12);
        const goblinId = gameState.captureMonster('goblin', 12);

        const result = gameState.canBreed(slimeId, goblinId);
        assertTruthy(result.canBreed, `Expected canBreed to be true (reason: ${result.reason})`);
    });

    it('breed() creates an offspring in storage and records cooldown/history', () => {
        const slimeId = gameState.captureMonster('slime', 12);
        const goblinId = gameState.captureMonster('goblin', 12);

        const preStorageLen = gameState.monsters.storage.length;
        const outcome = gameState.breed(slimeId, goblinId);

        assertTruthy(outcome.success, `breed() should succeed (reason: ${outcome.reason})`);
        assertEqual(gameState.monsters.storage.length, preStorageLen + 1, 'Offspring should be added to storage');

        // Cooldown should be set for both parents
        const cdMap = gameState.breeding.breedingCooldowns;
        assertTruthy(cdMap.has(slimeId), 'Slime should have a cooldown');
        assertTruthy(cdMap.has(goblinId), 'Goblin should have a cooldown');

        // History should be appended
        const last = gameState.breeding.breedingHistory[gameState.breeding.breedingHistory.length - 1];
        assertTruthy(!!last, 'Breeding history should have a new entry');
        Assert.deepEqual(last.parents, [slimeId, goblinId], 'History should record parent IDs');
    });

    it('canBreed returns false when cooldown is active', () => {
        const slimeId = gameState.captureMonster('slime', 12);
        const goblinId = gameState.captureMonster('goblin', 12);

        // First breeding to set cooldowns
        const first = gameState.breed(slimeId, goblinId);
        assertTruthy(first.success, 'Initial breeding should succeed');

        const result = gameState.canBreed(slimeId, goblinId);
        assertFalsy(result.canBreed, 'Breeding should be blocked by cooldown');
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Monster breeding tests loaded.');
}
