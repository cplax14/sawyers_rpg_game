/**
 * Unit Tests for World Map (6.1)
 */

describe('World Map Tests', () => {
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

    it('AreaData has proper connections from starting_village', () => {
        const conns = AreaData.getConnectedAreas('starting_village');
        Assert.deepEqual(conns, ['forest_path'], 'starting_village should connect to forest_path');
    });

    it('travelToArea respects unlock requirements (story, level, item)', () => {
        // 1) forest_path requires story: tutorial_complete
        let ok = gameState.travelToArea('forest_path');
        assertFalsy(ok, 'Should not travel before tutorial_complete');
        gameState.addStoryFlag('tutorial_complete');
        ok = gameState.travelToArea('forest_path');
        assertTruthy(ok, 'Should travel to forest_path after tutorial_complete');

        // 2) deep_forest requires story: forest_path_cleared and level >= 5
        let okDeep = gameState.travelToArea('deep_forest');
        assertFalsy(okDeep, 'Should fail deep_forest before requirements');
        gameState.addStoryFlag('forest_path_cleared');
        // Level up player to 5
        while (gameState.player.level < 5) {
            gameState.addExperience(gameState.player.experienceToNext);
        }
        okDeep = gameState.travelToArea('deep_forest');
        assertTruthy(okDeep, 'Should travel to deep_forest after story and level');

        // 3) wolf_den requires story: pack_encounter and item: wolf_tracker
        let okDen = gameState.travelToArea('wolf_den');
        assertFalsy(okDen, 'Should fail wolf_den before requirements');
        gameState.addStoryFlag('pack_encounter');
        gameState.addItem('wolf_tracker', 1);
        okDen = gameState.travelToArea('wolf_den');
        assertTruthy(okDen, 'Should travel to wolf_den after item and story');
    });

    it('travelToArea updates unlocked areas list and stats', () => {
        const startingCount = gameState.world.unlockedAreas.length;
        gameState.addStoryFlag('tutorial_complete');
        const ok = gameState.travelToArea('forest_path');
        assertTruthy(ok, 'Travel should succeed');
        assertTruthy(gameState.world.unlockedAreas.includes('forest_path'), 'Area should be added to unlockedAreas');
        assertTruthy(gameState.stats.areasExplored >= 2, 'areasExplored should increment');
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 World map tests loaded.');
}
