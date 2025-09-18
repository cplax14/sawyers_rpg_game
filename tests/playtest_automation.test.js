/**
 * Automated Playtest for Complete Game Experience (Task 10.7)
 * Tests pacing, progression, and engagement through automated gameplay simulation
 */

describe('Complete Game Playtest', () => {
    let game;
    let gameState;
    let playtestResults = {};

    beforeAll(() => {
        assertTruthy(typeof window.SawyersRPG !== 'undefined', 'Global game instance should be defined');
        game = window.SawyersRPG;
        gameState = game.getGameState();

        // Initialize playtest metrics
        playtestResults = {
            startTime: Date.now(),
            progression: [],
            encounters: [],
            captures: [],
            evolutions: [],
            storyEvents: [],
            difficulties: [],
            pacing: []
        };
    });

    beforeEach(() => {
        gameState.resetToDefaults();
        if (!gameState.combatEngine) gameState.initializeCombatEngine();

        // Clear saves
        if (typeof SaveSystem !== 'undefined') {
            localStorage.removeItem(SaveSystem.SAVE_KEY);
            localStorage.removeItem(SaveSystem.AUTOSAVE_KEY);
        }
    });

    describe('Early Game Experience (Levels 1-5)', () => {
        it('should provide smooth tutorial progression', () => {
            const startTime = Date.now();

            // Character creation
            gameState.setPlayerClass('knight');
            gameState.player.name = 'PlaytestHero';

            playtestResults.progression.push({
                phase: 'character_creation',
                level: gameState.player.level,
                time: Date.now() - startTime
            });

            // Tutorial area exploration
            assertEqual(gameState.world.currentArea, 'starting_village', 'Should start in tutorial area');
            assertTruthy(gameState.world.unlockedAreas.includes('starting_village'), 'Tutorial area should be accessible');

            // First encounters should be manageable
            for (let i = 0; i < 5; i++) {
                const encounter = AreaData.generateRandomEncounter('starting_village', gameState.player.level);
                if (encounter) {
                    assertTruthy(encounter.level <= gameState.player.level + 1,
                               'Early encounters should be appropriately leveled');
                    playtestResults.encounters.push({
                        area: 'starting_village',
                        species: encounter.species,
                        level: encounter.level,
                        playerLevel: gameState.player.level
                    });
                }
            }

            // Tutorial progression should unlock next area
            gameState.addStoryFlag('tutorial_complete');
            assertTruthy(gameState.world.storyFlags.includes('tutorial_complete'),
                        'Tutorial completion should be trackable');

            playtestResults.progression.push({
                phase: 'tutorial_complete',
                level: gameState.player.level,
                time: Date.now() - startTime
            });
        });

        it('should provide balanced early game combat', () => {
            gameState.setPlayerClass('wizard');

            // Simulate early combat encounters
            for (let level = 1; level <= 5; level++) {
                gameState.player.level = level;
                // Stats are recalculated automatically when class is set

                // Test combat against level-appropriate enemies
                const enemy = new Monster('slime', level, true);
                const captureChance = gameState.combatEngine.computeCaptureChance(enemy);

                // Early game captures should be reasonable
                assertTruthy(captureChance >= 15, `Level ${level} captures should be achievable`);
                assertTruthy(captureChance <= 90, `Level ${level} captures should not be trivial`);

                playtestResults.difficulties.push({
                    playerLevel: level,
                    enemySpecies: enemy.species,
                    enemyLevel: enemy.level,
                    captureChance: captureChance
                });
            }
        });
    });

    describe('Mid Game Experience (Levels 6-15)', () => {
        it('should provide engaging progression and choices', () => {
            // Set up mid-game state
            gameState.setPlayerClass('ranger');
            gameState.player.level = 8;
            gameState.addExperience(800);
            gameState.addItem('health_potion', 10);
            gameState.addStoryFlag('tutorial_complete');
            // Areas unlock automatically through story progression
            gameState.world.unlockedAreas.push('forest_path');

            const startTime = Date.now();

            // Monster collection should expand
            const capturedSpecies = new Set();
            for (let i = 0; i < 15; i++) {
                const areas = ['forest_path', 'deep_forest'];
                const randomArea = areas[Math.floor(Math.random() * areas.length)];
                const encounter = AreaData.generateRandomEncounter(randomArea, gameState.player.level);

                if (encounter && !capturedSpecies.has(encounter.species)) {
                    const monsterId = gameState.captureMonster(encounter.species, encounter.level);
                    if (monsterId) {
                        capturedSpecies.add(encounter.species);
                        playtestResults.captures.push({
                            species: encounter.species,
                            level: encounter.level,
                            area: randomArea,
                            playerLevel: gameState.player.level
                        });
                    }
                }
            }

            assertTruthy(capturedSpecies.size >= 3, 'Mid-game should offer species diversity');

            // Test monster evolution opportunities
            const monsters = gameState.monsters.storage;
            for (const monster of monsters) {
                if (monster.level >= 12) { // Evolution level for basic monsters
                    const canEvolve = gameState.checkEvolutionEligibility ?
                                    gameState.checkEvolutionEligibility(monster.id) :
                                    { eligible: false };

                    if (canEvolve.eligible) {
                        playtestResults.evolutions.push({
                            species: monster.species,
                            level: monster.level,
                            playerLevel: gameState.player.level
                        });
                    }
                }
            }

            playtestResults.progression.push({
                phase: 'mid_game',
                level: gameState.player.level,
                monstersCollected: capturedSpecies.size,
                time: Date.now() - startTime
            });
        });

        it('should provide meaningful story choices', () => {
            gameState.setPlayerClass('paladin');
            gameState.addStoryFlag('tutorial_complete');
            gameState.addStoryFlag('met_sage');

            // Test story system if available
            if (typeof StoryData !== 'undefined' && typeof StoryData.getEvent === 'function') {
                // Test key story events
                const storyEvents = ['mystic_grove_discovery', 'ruins_puzzle'];

                for (const eventId of storyEvents) {
                    const event = StoryData.getEvent(eventId);
                    if (event) {
                        assertTruthy(event.choices && event.choices.length > 0,
                                   `Story event ${eventId} should offer choices`);

                        playtestResults.storyEvents.push({
                            eventId: eventId,
                            choicesAvailable: event.choices.length,
                            playerLevel: gameState.player.level
                        });
                    }
                }
            }

            // Story progression should affect gameplay
            const initialAreas = gameState.world.unlockedAreas.length;
            gameState.addStoryFlag('forest_explored');

            // Areas should unlock based on story progress
            if (gameState.world.unlockedAreas.length > initialAreas) {
                playtestResults.progression.push({
                    phase: 'story_unlock',
                    areasUnlocked: gameState.world.unlockedAreas.length - initialAreas,
                    playerLevel: gameState.player.level
                });
            }
        });
    });

    describe('Late Game Experience (Levels 16+)', () => {
        it('should provide challenging endgame content', () => {
            // Set up late-game state
            gameState.setPlayerClass('warrior');
            gameState.player.level = 20;
            gameState.addItem('health_potion', 20);
            gameState.addItem('mana_potion', 15);

            // Populate with high-level monsters
            for (let i = 0; i < 10; i++) {
                const species = ['orc', 'dragon', 'phoenix'][i % 3];
                const level = 15 + (i % 5);
                gameState.captureMonster(species, level);
            }

            // Endgame encounters should be challenging
            const endgameAreas = ['mountain_pass', 'library_of_echoes'];
            for (const area of endgameAreas) {
                if (AreaData.getArea && AreaData.getArea(area)) {
                    const encounter = AreaData.generateRandomEncounter(area, gameState.player.level);
                    if (encounter) {
                        assertTruthy(encounter.level >= gameState.player.level - 2,
                                   `Endgame encounters should be challenging in ${area}`);

                        const captureChance = gameState.combatEngine.computeCaptureChance(
                            new Monster(encounter.species, encounter.level, true)
                        );
                        assertTruthy(captureChance <= 60,
                                   'Endgame captures should require strategy');

                        playtestResults.difficulties.push({
                            area: area,
                            playerLevel: gameState.player.level,
                            enemyLevel: encounter.level,
                            captureChance: captureChance,
                            phase: 'endgame'
                        });
                    }
                }
            }
        });

        it('should provide satisfying completion metrics', () => {
            // Set up completed game state
            gameState.setPlayerClass('knight');
            gameState.player.level = 25;
            gameState.player.name = 'CompletionTest';

            // Simulate extensive monster collection
            const targetSpecies = ['slime', 'goblin', 'wolf', 'orc', 'dragon'];
            for (const species of targetSpecies) {
                gameState.captureMonster(species, 20);
            }

            // Add major story flags
            const majorFlags = ['tutorial_complete', 'forest_explored', 'mountain_conquered', 'final_boss_defeated'];
            for (const flag of majorFlags) {
                gameState.addStoryFlag(flag);
            }

            // Test completion metrics
            assertTruthy(gameState.monsters.storage.length >= 5, 'Should have collected multiple monsters');
            assertTruthy(gameState.world.storyFlags.length >= 4, 'Should have significant story progress');
            assertTruthy(gameState.player.level >= 20, 'Should reach high level');

            playtestResults.progression.push({
                phase: 'completion',
                level: gameState.player.level,
                monstersCollected: gameState.monsters.storage.length,
                storyFlags: gameState.world.storyFlags.length,
                time: Date.now() - playtestResults.startTime
            });
        });
    });

    describe('Pacing and Engagement Analysis', () => {
        it('should maintain appropriate progression pacing', () => {
            // Simulate accelerated playthrough
            gameState.setPlayerClass('wizard');
            const progressionMilestones = [];

            // Track progression through different phases
            for (let level = 1; level <= 15; level += 2) {
                gameState.player.level = level;

                // Simulate some gameplay activities
                gameState.addItem('health_potion', 2);
                if (level % 3 === 0) {
                    gameState.captureMonster('slime', level);
                }

                progressionMilestones.push({
                    level: level,
                    hp: gameState.player.stats.hp,
                    mp: gameState.player.stats.mp,
                    monstersOwned: gameState.monsters.storage.length
                });
            }

            // Verify progression feels meaningful
            assertTruthy(progressionMilestones.length >= 5, 'Should have multiple progression points');

            const firstMilestone = progressionMilestones[0];
            const lastMilestone = progressionMilestones[progressionMilestones.length - 1];

            assertTruthy(lastMilestone.hp > firstMilestone.hp * 1.5, 'HP should scale significantly');
            assertTruthy(lastMilestone.monstersOwned >= 2, 'Monster collection should grow');

            playtestResults.pacing = progressionMilestones;
        });

        it('should provide balanced difficulty curve', () => {
            // Test difficulty scaling across level ranges
            const difficultyTests = [
                { levelRange: [1, 5], expectedCaptureRate: [60, 85], phase: 'early' },
                { levelRange: [6, 12], expectedCaptureRate: [40, 70], phase: 'mid' },
                { levelRange: [13, 20], expectedCaptureRate: [25, 55], phase: 'late' }
            ];

            for (const test of difficultyTests) {
                gameState.player.level = test.levelRange[1]; // Test at max level for range

                const enemy = new Monster('goblin', gameState.player.level, true);

                let captureChance = 0.3; // Default fallback
                if (gameState.combatEngine && typeof gameState.combatEngine.computeCaptureChance === 'function') {
                    captureChance = gameState.combatEngine.computeCaptureChance(enemy);
                }

                assertTruthy(captureChance >= test.expectedCaptureRate[0] &&
                           captureChance <= test.expectedCaptureRate[1],
                           `${test.phase} game capture rates should be balanced`);

                playtestResults.difficulties.push({
                    phase: test.phase,
                    playerLevel: gameState.player.level,
                    captureChance: captureChance,
                    balanceCheck: true
                });
            }
        });
    });

    describe('Engagement Features Analysis', () => {
        it('should provide engaging monster variety and mechanics', () => {
            gameState.setPlayerClass('ranger');

            // Test monster diversity
            const availableSpecies = ['slime', 'goblin', 'wolf', 'orc', 'phoenix', 'dragon'];
            const collectedSpecies = new Set();

            for (const species of availableSpecies) {
                if (MonsterData.getSpecies && MonsterData.getSpecies(species)) {
                    const monster = new Monster(species, 10, false);
                    assertTruthy(monster.stats.hp > 0, `${species} should have valid stats`);
                    assertTruthy(monster.abilities && monster.abilities.length > 0,
                               `${species} should have abilities`);
                    collectedSpecies.add(species);
                }
            }

            assertTruthy(collectedSpecies.size >= 4, 'Should have diverse monster species available');

            playtestResults.captures.push({
                diversityCheck: true,
                speciesAvailable: collectedSpecies.size,
                playerLevel: gameState.player.level
            });
        });

        it('should provide meaningful save/progression systems', () => {
            if (typeof SaveSystem !== 'undefined') {
                // Set up meaningful progress
                gameState.setPlayerClass('paladin');
                gameState.player.name = 'ProgressionTest';
                gameState.player.level = 12;
                gameState.addItem('health_potion', 8);
                gameState.captureMonster('wolf', 10);
                gameState.addStoryFlag('significant_progress');

                // Test save persistence
                const saveResult = SaveSystem.saveGame();
                assertTruthy(saveResult, 'Progress should be saveable');

                // Verify save contains meaningful data
                const rawSave = localStorage.getItem(SaveSystem.SAVE_KEY);
                const saveData = JSON.parse(rawSave);

                assertTruthy(saveData.player.level > 1, 'Save should preserve level progress');
                assertTruthy(saveData.monsters.storage.length > 0, 'Save should preserve monster collection');
                assertTruthy(saveData.world.storyFlags.length > 1, 'Save should preserve story progress');

                playtestResults.progression.push({
                    phase: 'save_system',
                    level: saveData.player.level,
                    saveSize: rawSave.length,
                    dataIntegrity: true
                });
            }
        });
    });

    afterAll(() => {
        // Log playtest results for analysis
        const totalTime = Date.now() - playtestResults.startTime;
        console.log('🎮 Playtest Automation Results:');
        console.log(`Total test time: ${totalTime}ms`);
        console.log(`Progression milestones: ${playtestResults.progression.length}`);
        console.log(`Encounters tested: ${playtestResults.encounters.length}`);
        console.log(`Captures simulated: ${playtestResults.captures.length}`);
        console.log(`Difficulty tests: ${playtestResults.difficulties.length}`);
        console.log(`Story events: ${playtestResults.storyEvents.length}`);

        // Verify overall playtest quality
        assertTruthy(playtestResults.progression.length >= 3, 'Should have meaningful progression tracking');
        assertTruthy(playtestResults.encounters.length >= 5, 'Should have tested multiple encounters');
        assertTruthy(playtestResults.difficulties.length >= 3, 'Should have tested difficulty balance');
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Automated playtest suite loaded.');
}