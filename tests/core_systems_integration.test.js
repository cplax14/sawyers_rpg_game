/**
 * Core Game Systems Integration Tests (Task 10.6)
 * Simplified integration tests for core game system workflows
 */

describe('Core Game Systems Integration Tests', () => {
    let game;
    let gameState;

    beforeAll(() => {
        assertTruthy(typeof window.SawyersRPG !== 'undefined', 'Global game instance should be defined');
        game = window.SawyersRPG;
        gameState = game.getGameState();
    });

    beforeEach(() => {
        gameState.resetToDefaults();
        if (!gameState.combatEngine) gameState.initializeCombatEngine();

        // Clear saves to prevent interference
        if (typeof SaveSystem !== 'undefined') {
            localStorage.removeItem(SaveSystem.SAVE_KEY);
            localStorage.removeItem(SaveSystem.AUTOSAVE_KEY);
        }
    });

    describe('Player System Integration', () => {
        it('should handle character class selection and progression', () => {
            // Test class selection
            assertEqual(gameState.player.class, null, 'Player should start without class');

            gameState.setPlayerClass('knight');
            assertEqual(gameState.player.class, 'knight', 'Player class should be set');
            assertTruthy(gameState.player.stats.hp > 0, 'Player should have HP after class selection');
            assertTruthy(gameState.player.stats.mp >= 0, 'Player should have MP after class selection');

            // Test experience gain
            const initialLevel = gameState.player.level;
            const initialXP = gameState.player.experience;

            gameState.addExperience(200);
            assertTruthy(gameState.player.experience >= initialXP + 200, 'Experience should increase');

            if (gameState.player.level > initialLevel) {
                assertTruthy(gameState.player.stats.hp > 0, 'HP should remain positive after level up');
            }
        });

        it('should handle inventory operations', () => {
            // Test item addition
            const initialGold = gameState.player.inventory.gold;

            gameState.addItem('health_potion', 5);
            assertTruthy(gameState.player.inventory.items.health_potion >= 5, 'Items should be added to inventory');

            // Test gold operations
            gameState.player.inventory.gold += 100;
            assertEqual(gameState.player.inventory.gold, initialGold + 100, 'Gold should be modifiable');
        });
    });

    describe('Monster System Integration', () => {
        it('should handle monster capture and storage', () => {
            // Test monster capture
            const initialStorageCount = gameState.monsters.storage.length;

            const monsterId = gameState.captureMonster('slime', 5);
            assertTruthy(monsterId, 'Capture should return monster ID');
            assertTruthy(gameState.monsters.storage.length > initialStorageCount, 'Monster should be added to storage');

            // Test party management
            const partyResult = gameState.addToParty(monsterId);
            assertTruthy(partyResult, 'Monster should be addable to party');
            assertTruthy(gameState.monsters.party.includes(monsterId), 'Monster should be in party');
        });

        it('should handle monster retrieval and location finding', () => {
            // Capture a monster first
            const monsterId = gameState.captureMonster('goblin', 8);

            // Test monster retrieval
            const { monster, location } = gameState.getMonsterByIdAnywhere(monsterId);
            assertTruthy(monster, 'Monster should be retrievable');
            assertEqual(monster.species, 'goblin', 'Retrieved monster should have correct species');
            assertEqual(monster.level, 8, 'Retrieved monster should have correct level');
            assertTruthy(location === 'storage' || location === 'party', 'Monster location should be valid');
        });
    });

    describe('Combat System Integration', () => {
        it('should handle basic combat setup and execution', () => {
            // Set up basic combat scenario
            gameState.setPlayerClass('knight');
            const playerMonsterId = gameState.captureMonster('slime', 8);
            gameState.addToParty(playerMonsterId);

            const { monster: playerMonster } = gameState.getMonsterByIdAnywhere(playerMonsterId);
            const enemy = new Monster('goblin', 6, true);

            // Test combat initialization
            const participants = [
                { id: 'P1', side: 'player', speed: playerMonster.stats.speed, ref: playerMonster },
                { id: 'E1', side: 'enemy', speed: enemy.stats.speed, ref: enemy }
            ];

            gameState.combatEngine.startBattle(participants);
            assertTruthy(gameState.combat.active, 'Combat should be active');
            assertTruthy(gameState.combat.participants.length >= 2, 'Participants should be set');
        });

        it('should handle capture mechanics', () => {
            // Create a weakened enemy for better capture chance
            const enemy = new Monster('wolf', 5, true);
            enemy.currentStats.hp = Math.floor(enemy.stats.hp * 0.3); // Low HP

            const captureChance = gameState.combatEngine.computeCaptureChance(enemy);
            assertTruthy(captureChance >= 0 && captureChance <= 100, 'Capture chance should be valid percentage');
            assertTruthy(captureChance > 10, 'Capture chance should be reasonable for weakened enemy');
        });
    });

    describe('World and Story Integration', () => {
        it('should handle area and story progression', () => {
            // Test area management
            assertEqual(gameState.world.currentArea, 'starting_village', 'Should start in starting village');
            assertTruthy(gameState.world.unlockedAreas.includes('starting_village'), 'Starting village should be unlocked');

            // Test story flag management
            const initialFlags = gameState.world.storyFlags.length;
            gameState.addStoryFlag('tutorial_complete');
            assertTruthy(gameState.world.storyFlags.length > initialFlags, 'Story flags should be addable');
            assertTruthy(gameState.world.storyFlags.includes('tutorial_complete'), 'Added story flag should exist');

            // Test area unlocking
            gameState.unlockArea('forest_path');
            assertTruthy(gameState.world.unlockedAreas.includes('forest_path'), 'New areas should be unlockable');
        });

        it('should handle story choice processing', () => {
            if (typeof gameState.processStoryChoice === 'function') {
                const initialFlags = gameState.world.storyFlags.length;

                const mockChoice = {
                    id: 'test_choice',
                    outcome: {
                        flags: ['test_outcome'],
                        unlocks: [],
                        items: []
                    }
                };

                gameState.processStoryChoice('test_event', mockChoice);
                assertTruthy(gameState.world.storyFlags.length > initialFlags, 'Story choice should add flags');
            }
        });
    });

    describe('Save System Integration', () => {
        it('should handle complete save/load workflow', () => {
            if (typeof SaveSystem !== 'undefined') {
                // Set up game state
                gameState.setPlayerClass('wizard');
                gameState.player.name = 'TestIntegration';
                gameState.addItem('health_potion', 3);
                gameState.addStoryFlag('integration_test');
                const monsterId = gameState.captureMonster('goblin', 7);

                // Save the state
                const saveResult = SaveSystem.saveGame();
                assertTruthy(saveResult, 'Save should succeed');

                // Reset and verify clean state
                gameState.resetToDefaults();
                assertEqual(gameState.player.name, '', 'State should be reset');

                // Load and verify restoration
                const loadResult = SaveSystem.loadGame();
                assertTruthy(loadResult, 'Load should succeed');
                assertEqual(gameState.player.name, 'TestIntegration', 'Player name should be restored');
                assertEqual(gameState.player.class, 'wizard', 'Player class should be restored');
                assertTruthy(gameState.world.storyFlags.includes('integration_test'), 'Story flags should be restored');
                assertTruthy(gameState.monsters.storage.length > 0, 'Monster storage should be restored');
            }
        });
    });

    describe('Error Handling and Stability', () => {
        it('should handle invalid operations gracefully', () => {
            // Test invalid monster operations
            const invalidResult = gameState.getMonsterByIdAnywhere('invalid_id');
            assertEqual(invalidResult.monster, null, 'Invalid monster ID should return null monster');

            const addResult = gameState.addToParty('invalid_id');
            assertFalsy(addResult, 'Adding invalid monster to party should fail');
        });

        it('should maintain performance under load', () => {
            const startTime = Date.now();

            // Perform multiple operations
            for (let i = 0; i < 50; i++) {
                gameState.addItem('health_potion', 1);
                gameState.addExperience(10);

                if (i % 10 === 0) {
                    gameState.captureMonster('slime', i % 10 + 1);
                }
            }

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete reasonably quickly
            assertTruthy(duration < 2000, 'Multiple operations should complete within 2 seconds');
            assertTruthy(gameState.player.inventory.items.health_potion >= 50, 'All item additions should be processed');
            assertTruthy(gameState.monsters.storage.length >= 5, 'Monster captures should be processed');
        });
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Core game systems integration tests loaded.');
}