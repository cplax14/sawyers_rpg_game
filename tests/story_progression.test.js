/**
 * Story Progression Integration Tests
 * Tests that verify players can actually progress through story content
 */

describe('Story Progression Integration Tests', () => {
    let gameState;

    beforeEach(() => {
        // Reset game state for each test
        gameState = new GameState();
        gameState.initialize();
        gameState.player.name = 'Test Hero';
        gameState.player.class = 'knight';
        gameState.player.level = 10; // Mid-game level for most tests
    });

    describe('Basic Story Flow', () => {
        test('should progress from game start to tutorial complete', () => {
            // Start with game_start event
            gameState.world.storyFlags = [];
            gameState.world.completedEvents = [];

            // Process game start
            const gameStartResult = gameState.processStoryChoice('game_start', 'default');
            expect(gameStartResult.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('tutorial_start');
            expect(gameState.player.inventory.items['starter_kit']).toBeGreaterThan(0);

            // Process tutorial complete
            const tutorialResult = gameState.processStoryChoice('tutorial_complete', 'default');
            expect(tutorialResult.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('forest_path_available');
            expect(gameState.world.unlockedAreas).toContain('forest_path');
        });

        test('should trigger first monster encounter in forest path', () => {
            // Set up prerequisites
            gameState.world.unlockedAreas = ['starting_village', 'forest_path'];
            gameState.world.currentArea = 'forest_path';

            // Check that first_monster_encounter is available
            const availableEvents = StoryData.getAreaEvents('forest_path', gameState.world.storyFlags);
            expect(availableEvents).toContain('first_monster_encounter');

            // Process the encounter - attempt capture
            const result = gameState.processStoryChoice('first_monster_encounter', 'attempt_capture');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('capture_attempt_made');
            expect(gameState.world.unlockedAreas).toContain('plains');
        });

        test('should progress to major encounters after early game', () => {
            // Set up mid-game state
            gameState.world.storyFlags = ['tutorial_start', 'forest_path_available', 'capture_attempt_made'];
            gameState.world.unlockedAreas = ['starting_village', 'forest_path', 'plains'];
            gameState.world.completedEvents = ['game_start', 'tutorial_complete', 'first_monster_encounter'];
            gameState.player.level = 8;

            // Check pack encounter becomes available
            gameState.world.currentArea = 'forest_path';
            const forestEvents = StoryData.getAreaEvents('forest_path', gameState.world.storyFlags);
            expect(forestEvents).toContain('pack_encounter');

            // Process pack encounter with respectful approach
            const packResult = gameState.processStoryChoice('pack_encounter', 'respectful_approach');
            expect(packResult.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('wolf_respect_earned');
            expect(gameState.world.storyFlags).toContain('nature_affinity');
            expect(gameState.world.unlockedAreas).toContain('wolf_den');
        });
    });

    describe('Class-Specific Story Branches', () => {
        test('knight should access knight_honor_test', () => {
            gameState.player.class = 'knight';
            gameState.player.level = 12;
            gameState.world.currentArea = 'class_trial_grounds';

            const availableEvents = StoryData.getAreaEvents('class_trial_grounds', gameState.world.storyFlags);
            expect(availableEvents).toContain('knight_honor_test');

            // Test redemption path
            const result = gameState.processStoryChoice('knight_honor_test', 'redeem_knight');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('knight_redeemer');
            expect(gameState.world.storyFlags).toContain('mercy_shown');
            expect(gameState.world.unlockedAreas).toContain('hall_of_honor');
            expect(gameState.player.inventory.items['redemption_blade']).toBeGreaterThan(0);
        });

        test('wizard should access wizard_arcane_mystery', () => {
            gameState.player.class = 'wizard';
            gameState.player.level = 12;
            gameState.world.currentArea = 'class_trial_grounds';

            const availableEvents = StoryData.getAreaEvents('class_trial_grounds', gameState.world.storyFlags);
            expect(availableEvents).toContain('wizard_arcane_mystery');

            // Test systematic study path
            const result = gameState.processStoryChoice('wizard_arcane_mystery', 'systematic_study');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('methodical_mage');
            expect(gameState.world.storyFlags).toContain('systematic_magic');
            expect(gameState.world.unlockedAreas).toContain('library_infinite');
        });

        test('rogue should access rogue_heist_opportunity', () => {
            gameState.player.class = 'rogue';
            gameState.player.level = 12;
            gameState.world.currentArea = 'class_trial_grounds';

            const availableEvents = StoryData.getAreaEvents('class_trial_grounds', gameState.world.storyFlags);
            expect(availableEvents).toContain('rogue_heist_opportunity');

            // Test Robin Hood approach
            const result = gameState.processStoryChoice('rogue_heist_opportunity', 'robin_hood_approach');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('peoples_champion');
            expect(gameState.world.storyFlags).toContain('righteous_thief');
            expect(gameState.world.unlockedAreas).toContain('hidden_sanctuary');
        });

        test('class requirements should be enforced', () => {
            gameState.player.class = 'warrior';
            gameState.world.currentArea = 'class_trial_grounds';

            // Warrior should not be able to access wizard-specific events
            const wizardEvent = StoryData.getEvent('wizard_arcane_mystery');
            expect(wizardEvent.classRequirement).toContain('wizard');

            // Test that choice would be filtered out by UI (simulated)
            const result = gameState.processStoryChoice('wizard_arcane_mystery', 'systematic_study');
            // This should fail or be filtered - depending on implementation
            expect(result.success).toBe(false);
        });
    });

    describe('Story Flag Dependencies', () => {
        test('should track story flags correctly through progression', () => {
            // Start clean
            gameState.world.storyFlags = [];

            // Process wolf encounter with communication (class-specific)
            gameState.player.class = 'ranger';
            const wolfResult = gameState.processStoryChoice('pack_encounter', 'communication_attempt');

            expect(gameState.world.storyFlags).toContain('wolf_friendship');
            expect(gameState.world.storyFlags).toContain('beast_speaker');
            expect(gameState.world.storyFlags).toContain('special_bond');
            expect(gameState.world.unlockedAreas).toContain('wolf_den');
            expect(gameState.world.unlockedAreas).toContain('mystic_grove');
        });

        test('should unlock areas based on story progression', () => {
            gameState.world.storyFlags = ['ancient_knowledge'];

            const ruinsResult = gameState.processStoryChoice('ruins_puzzle', 'solve_riddle');
            expect(ruinsResult.success).toBe(true);
            expect(gameState.world.unlockedAreas).toContain('ancient_ruins_inner');
            expect(gameState.player.inventory.items['inscribed_key']).toBeGreaterThan(0);
        });

        test('should track character development paths', () => {
            gameState.world.storyFlags = [];

            // Take warrior-oriented choices
            gameState.processStoryChoice('pack_encounter', 'bold_stance');
            gameState.processStoryChoice('dragon_encounter', 'challenge_dragon');

            expect(gameState.world.storyFlags).toContain('warrior_path');
            expect(gameState.world.storyFlags).toContain('dragon_challenge');

            // Calculate story branch
            const branch = StoryData.calculateStoryBranch(gameState.world.storyFlags);
            expect(branch).toBe('warrior_path');
        });
    });

    describe('Mid-Game Content Accessibility', () => {
        test('crystal cave mystery should be accessible in crystal caves', () => {
            gameState.world.currentArea = 'crystal_caves';
            gameState.player.level = 12;

            const availableEvents = StoryData.getAreaEvents('crystal_caves', gameState.world.storyFlags);
            expect(availableEvents).toContain('crystal_cave_mystery');

            // Test harmony path
            const result = gameState.processStoryChoice('crystal_cave_mystery', 'join_harmony');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('crystal_harmony');
            expect(gameState.world.storyFlags).toContain('peaceful_nature');
            expect(gameState.world.unlockedAreas).toContain('harmonic_sanctum');
        });

        test('merchant caravan should trigger in forest path', () => {
            gameState.world.currentArea = 'forest_path';
            gameState.player.level = 6;

            const availableEvents = StoryData.getAreaEvents('forest_path', gameState.world.storyFlags);
            expect(availableEvents).toContain('merchant_caravan');

            // Test charitable help
            const result = gameState.processStoryChoice('merchant_caravan', 'charitable_help');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('generous_heart');
            expect(gameState.world.storyFlags).toContain('merchant_friend');
            expect(gameState.world.unlockedAreas).toContain('merchant_network');
        });

        test('abandoned village should be accessible in forest path', () => {
            gameState.world.currentArea = 'forest_path';
            gameState.player.level = 8;

            const availableEvents = StoryData.getAreaEvents('forest_path', gameState.world.storyFlags);
            expect(availableEvents).toContain('abandoned_village');

            // Test investigation path
            const result = gameState.processStoryChoice('abandoned_village', 'investigate_mystery');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('village_mystery_solved');
            expect(gameState.world.storyFlags).toContain('truth_seeker');
            expect(gameState.world.unlockedAreas).toContain('hidden_shrine');
        });
    });

    describe('Endgame Content Progression', () => {
        test('should access ancient temple trial at appropriate level', () => {
            gameState.player.level = 15;
            gameState.world.currentArea = 'ancient_temple';

            const availableEvents = StoryData.getAreaEvents('ancient_temple', gameState.world.storyFlags);
            expect(availableEvents).toContain('ancient_temple_trial');

            // Test mind trial
            const result = gameState.processStoryChoice('ancient_temple_trial', 'trial_mind');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('trial_scholar');
            expect(gameState.world.storyFlags).toContain('wisdom_proven');
            expect(gameState.world.unlockedAreas).toContain('scholar_sanctum');
        });

        test('convergence point should be accessible with multiple paths', () => {
            // Set up a character who has walked multiple paths
            gameState.world.storyFlags = [
                'warrior_path', 'scholar_path', 'nature_affinity', 'dragon_wisdom',
                'trial_warrior', 'trial_scholar', 'crystal_harmony'
            ];
            gameState.player.level = 20;
            gameState.world.currentArea = 'mystic_convergence';

            const availableEvents = StoryData.getAreaEvents('mystic_convergence', gameState.world.storyFlags);
            expect(availableEvents).toContain('convergence_point');

            // Test unity path (requires multiple paths)
            const result = gameState.processStoryChoice('convergence_point', 'unity_path');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('path_unifier');
            expect(gameState.world.storyFlags).toContain('harmony_achieved');
            expect(gameState.world.unlockedAreas).toContain('unity_nexus');
        });

        test('final trial should lead to appropriate endings', () => {
            gameState.player.level = 25;
            gameState.world.currentArea = 'mystic_convergence';

            // Set up for guardian ending
            gameState.world.storyFlags = ['peaceful_approach', 'nature_affinity', 'beast_speaker'];

            const result = gameState.processStoryChoice('final_trial', 'guardian_ending');
            expect(result.success).toBe(true);

            // Check ending requirements
            const availableEndings = StoryData.getAvailableEndings(gameState.world.storyFlags);
            expect(availableEndings).toContain('guardian_ending');
        });
    });

    describe('Event Repetition Prevention', () => {
        test('should not allow repeating completed events', () => {
            gameState.world.completedEvents = ['first_monster_encounter'];
            gameState.world.currentArea = 'forest_path';

            const availableEvents = StoryData.getAreaEvents('forest_path', gameState.world.storyFlags);
            expect(availableEvents).not.toContain('first_monster_encounter');
        });

        test('should mark events as completed after processing', () => {
            expect(gameState.world.completedEvents).not.toContain('pack_encounter');

            gameState.processStoryChoice('pack_encounter', 'respectful_approach');

            expect(gameState.world.completedEvents).toContain('pack_encounter');
        });
    });

    describe('Story Branch Calculation', () => {
        test('should calculate warrior path correctly', () => {
            const warriorFlags = ['dragon_challenge', 'wolf_challenge_issued', 'combat_proven'];
            const branch = StoryData.calculateStoryBranch(warriorFlags);
            expect(branch).toBe('warrior_path');
        });

        test('should calculate scholar path correctly', () => {
            const scholarFlags = ['ancient_knowledge', 'crystal_lore', 'wisdom_proven'];
            const branch = StoryData.calculateStoryBranch(scholarFlags);
            expect(branch).toBe('scholar_path');
        });

        test('should calculate nature path correctly', () => {
            const natureFlags = ['beast_speaker', 'wolf_friendship', 'nature_affinity'];
            const branch = StoryData.calculateStoryBranch(natureFlags);
            expect(branch).toBe('nature_path');
        });

        test('should calculate peaceful path correctly', () => {
            const peacefulFlags = ['wolf_respect_earned', 'peaceful_resolution', 'dragon_friendship'];
            const branch = StoryData.calculateStoryBranch(peacefulFlags);
            expect(branch).toBe('peaceful_path');
        });
    });

    describe('Story Content Integration', () => {
        test('should integrate with loot system', () => {
            // Story choices should grant items
            const result = gameState.processStoryChoice('crystal_cave_mystery', 'magical_study');
            expect(result.success).toBe(true);
            expect(gameState.player.inventory.items['crystal_wand']).toBeGreaterThan(0);
            expect(gameState.player.inventory.items['arcane_focus']).toBeGreaterThan(0);
        });

        test('should integrate with area unlocking', () => {
            const initialAreas = [...gameState.world.unlockedAreas];

            gameState.processStoryChoice('mystic_grove_discovery', 'attune_nature');

            expect(gameState.world.unlockedAreas.length).toBeGreaterThan(initialAreas.length);
            expect(gameState.world.unlockedAreas).toContain('mystic_grove');
        });

        test('should persist story progress through save/load', () => {
            // Make story progress
            gameState.processStoryChoice('pack_encounter', 'communication_attempt');
            const flags = [...gameState.world.storyFlags];
            const areas = [...gameState.world.unlockedAreas];

            // Save and load
            const saveData = gameState.exportSave();
            const newGameState = new GameState();
            const loadResult = newGameState.importSave(saveData);

            expect(loadResult.success).toBe(true);
            expect(newGameState.world.storyFlags).toEqual(flags);
            expect(newGameState.world.unlockedAreas).toEqual(areas);
        });
    });

    describe('Multiple Ending Accessibility', () => {
        test('guardian ending should be accessible with correct flags', () => {
            gameState.world.storyFlags = ['peaceful_approach', 'nature_affinity', 'beast_speaker'];

            const availableEndings = StoryData.getAvailableEndings(gameState.world.storyFlags);
            expect(availableEndings).toContain('guardian_ending');
        });

        test('master ending should be accessible with correct flags', () => {
            gameState.world.storyFlags = ['dragon_challenge', 'warrior_path', 'all_monsters_captured'];

            const availableEndings = StoryData.getAvailableEndings(gameState.world.storyFlags);
            expect(availableEndings).toContain('master_ending');
        });

        test('peace ending should be accessible with correct flags', () => {
            gameState.world.storyFlags = ['dragon_friendship', 'wolf_friendship', 'peaceful_resolution'];

            const availableEndings = StoryData.getAvailableEndings(gameState.world.storyFlags);
            expect(availableEndings).toContain('peace_ending');
        });

        test('explorer ending should be accessible with correct flags', () => {
            gameState.world.storyFlags = ['dragon_wisdom', 'ancient_knowledge', 'all_areas_explored'];

            const availableEndings = StoryData.getAvailableEndings(gameState.world.storyFlags);
            expect(availableEndings).toContain('explorer_ending');
        });
    });
});