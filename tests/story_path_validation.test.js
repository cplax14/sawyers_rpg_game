/**
 * Story Path Validation Tests
 * Tests that verify complete story paths can be traversed from start to finish
 */

describe('Story Path Validation Tests', () => {
    let gameState;

    beforeEach(() => {
        gameState = new GameState();
        gameState.initialize();
        gameState.player.name = 'Test Hero';
        gameState.player.level = 15; // High enough for most content
    });

    describe('Warrior Path Validation', () => {
        test('can complete warrior story path from start to ending', () => {
            gameState.player.class = 'warrior';
            gameState.world.storyFlags = [];
            gameState.world.completedEvents = [];

            // Early game warrior choices
            let result = gameState.processStoryChoice('pack_encounter', 'bold_stance');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('warrior_path');

            // Dragon encounter - challenge path
            result = gameState.processStoryChoice('dragon_encounter', 'challenge_dragon');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('dragon_challenge');

            // Class-specific trial
            gameState.world.currentArea = 'class_trial_grounds';
            result = gameState.processStoryChoice('warrior_ultimate_test', 'pure_strength');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('strength_legend');

            // Check path calculation
            const branch = StoryData.calculateStoryBranch(gameState.world.storyFlags);
            expect(branch).toBe('warrior_path');

            // Verify master ending is accessible
            gameState.world.storyFlags.push('all_monsters_captured'); // Simulate completion
            const availableEndings = StoryData.getAvailableEndings(gameState.world.storyFlags);
            expect(availableEndings).toContain('master_ending');
        });
    });

    describe('Scholar Path Validation', () => {
        test('can complete scholar story path from start to ending', () => {
            gameState.player.class = 'wizard';
            gameState.world.storyFlags = [];
            gameState.world.completedEvents = [];

            // Scholar-oriented choices
            let result = gameState.processStoryChoice('dragon_encounter', 'wisdom_seeker');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('dragon_wisdom');
            expect(gameState.world.storyFlags).toContain('ancient_knowledge');

            // Ruins puzzle
            result = gameState.processStoryChoice('ruins_puzzle', 'solve_riddle');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('scholar_path');

            // Crystal cave knowledge path
            result = gameState.processStoryChoice('crystal_cave_mystery', 'seek_knowledge');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('crystal_lore');

            // Class-specific trial
            gameState.world.currentArea = 'class_trial_grounds';
            result = gameState.processStoryChoice('wizard_arcane_mystery', 'systematic_study');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('methodical_mage');

            // Check path calculation
            const branch = StoryData.calculateStoryBranch(gameState.world.storyFlags);
            expect(branch).toBe('scholar_path');

            // Verify explorer ending is accessible
            gameState.world.storyFlags.push('all_areas_explored'); // Simulate completion
            const availableEndings = StoryData.getAvailableEndings(gameState.world.storyFlags);
            expect(availableEndings).toContain('explorer_ending');
        });
    });

    describe('Nature Path Validation', () => {
        test('can complete nature story path from start to ending', () => {
            gameState.player.class = 'ranger';
            gameState.world.storyFlags = [];
            gameState.world.completedEvents = [];

            // Nature-oriented choices
            let result = gameState.processStoryChoice('pack_encounter', 'communication_attempt');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('beast_speaker');
            expect(gameState.world.storyFlags).toContain('wolf_friendship');

            // Grove discovery
            result = gameState.processStoryChoice('mystic_grove_discovery', 'attune_nature');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('nature_attuned');

            // Dragon peaceful approach
            result = gameState.processStoryChoice('dragon_encounter', 'peaceful_approach');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('dragon_friendship');
            expect(gameState.world.storyFlags).toContain('peaceful_resolution');

            // Class-specific trial
            gameState.world.currentArea = 'class_trial_grounds';
            result = gameState.processStoryChoice('ranger_nature_call', 'balance_seeker');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('balance_keeper');

            // Check path calculation
            const branch = StoryData.calculateStoryBranch(gameState.world.storyFlags);
            expect(branch).toBe('nature_path');

            // Verify guardian or peace ending is accessible
            const availableEndings = StoryData.getAvailableEndings(gameState.world.storyFlags);
            expect(availableEndings.some(ending =>
                ending === 'guardian_ending' || ending === 'peace_ending'
            )).toBe(true);
        });
    });

    describe('Peaceful Path Validation', () => {
        test('can complete peaceful story path from start to ending', () => {
            gameState.player.class = 'paladin';
            gameState.world.storyFlags = [];
            gameState.world.completedEvents = [];

            // Peaceful choices
            let result = gameState.processStoryChoice('pack_encounter', 'respectful_approach');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('wolf_respect_earned');
            expect(gameState.world.storyFlags).toContain('nature_affinity');

            // Dragon peaceful approach
            result = gameState.processStoryChoice('dragon_encounter', 'peaceful_approach');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('dragon_friendship');
            expect(gameState.world.storyFlags).toContain('peaceful_resolution');

            // Merchant help
            result = gameState.processStoryChoice('merchant_caravan', 'charitable_help');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('generous_heart');

            // Village spirits help
            result = gameState.processStoryChoice('abandoned_village', 'help_spirits');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('spirit_helper');
            expect(gameState.world.storyFlags).toContain('compassionate_heart');

            // Class-specific trial
            gameState.world.currentArea = 'class_trial_grounds';
            result = gameState.processStoryChoice('paladin_faith_crisis', 'divine_guidance');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('divine_messenger');

            // Check path calculation
            const branch = StoryData.calculateStoryBranch(gameState.world.storyFlags);
            expect(branch).toBe('peaceful_path');

            // Verify peace ending is accessible
            const availableEndings = StoryData.getAvailableEndings(gameState.world.storyFlags);
            expect(availableEndings).toContain('peace_ending');
        });
    });

    describe('Mixed Path Validation', () => {
        test('can combine multiple paths for unity ending', () => {
            gameState.player.class = 'knight';
            gameState.world.storyFlags = [];
            gameState.world.completedEvents = [];

            // Collect flags from multiple paths
            let result = gameState.processStoryChoice('pack_encounter', 'communication_attempt');
            expect(result.success).toBe(true);

            result = gameState.processStoryChoice('dragon_encounter', 'wisdom_seeker');
            expect(result.success).toBe(true);

            result = gameState.processStoryChoice('ruins_puzzle', 'solve_riddle');
            expect(result.success).toBe(true);

            result = gameState.processStoryChoice('crystal_cave_mystery', 'join_harmony');
            expect(result.success).toBe(true);

            // Class trial
            gameState.world.currentArea = 'class_trial_grounds';
            result = gameState.processStoryChoice('knight_honor_test', 'redeem_knight');
            expect(result.success).toBe(true);

            // Add convergence flags to simulate completion
            gameState.world.storyFlags.push('multiple_paths_completed');

            // Convergence event
            gameState.world.currentArea = 'mystic_convergence';
            result = gameState.processStoryChoice('convergence_point', 'unity_path');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('path_unifier');

            // Check that unity was achieved
            expect(gameState.world.storyFlags).toContain('harmony_achieved');
        });
    });

    describe('Area Progression Validation', () => {
        test('story events unlock appropriate areas', () => {
            gameState.world.unlockedAreas = ['starting_village'];

            // Tutorial progression
            let result = gameState.processStoryChoice('tutorial_complete', 'default');
            expect(result.success).toBe(true);
            expect(gameState.world.unlockedAreas).toContain('forest_path');

            // First encounter
            result = gameState.processStoryChoice('first_monster_encounter', 'attempt_capture');
            expect(result.success).toBe(true);
            expect(gameState.world.unlockedAreas).toContain('plains');

            // Wolf encounter
            result = gameState.processStoryChoice('pack_encounter', 'respectful_approach');
            expect(result.success).toBe(true);
            expect(gameState.world.unlockedAreas).toContain('wolf_den');

            // Verify linear progression works
            const expectedAreas = ['starting_village', 'forest_path', 'plains', 'wolf_den'];
            expectedAreas.forEach(area => {
                expect(gameState.world.unlockedAreas).toContain(area);
            });
        });

        test('class trials unlock class-specific areas', () => {
            gameState.player.class = 'wizard';
            gameState.world.currentArea = 'class_trial_grounds';

            const result = gameState.processStoryChoice('wizard_arcane_mystery', 'systematic_study');
            expect(result.success).toBe(true);
            expect(gameState.world.unlockedAreas).toContain('library_infinite');
        });
    });

    describe('Item Rewards Validation', () => {
        test('story choices grant appropriate items', () => {
            // Crystal cave choice should grant crystal items
            let result = gameState.processStoryChoice('crystal_cave_mystery', 'join_harmony');
            expect(result.success).toBe(true);
            expect(gameState.player.inventory.items['resonance_crystal']).toBeGreaterThan(0);
            expect(gameState.player.inventory.items['harmony_stone']).toBeGreaterThan(0);

            // Knight honor test should grant knight items
            gameState.player.class = 'knight';
            result = gameState.processStoryChoice('knight_honor_test', 'redeem_knight');
            expect(result.success).toBe(true);
            expect(gameState.player.inventory.items['redemption_blade']).toBeGreaterThan(0);
            expect(gameState.player.inventory.items['mercy_shield']).toBeGreaterThan(0);
        });

        test('high-level events grant epic/legendary items', () => {
            gameState.player.level = 20;
            gameState.world.currentArea = 'mystic_convergence';

            // Simulate having the required flags
            gameState.world.storyFlags = ['multiple_paths_completed'];

            const result = gameState.processStoryChoice('convergence_point', 'unity_path');
            expect(result.success).toBe(true);
            expect(gameState.player.inventory.items['convergence_artifact']).toBeGreaterThan(0);
            expect(gameState.player.inventory.items['unity_crown']).toBeGreaterThan(0);
        });
    });

    describe('Story Event Prerequisites', () => {
        test('class requirements are enforced', () => {
            gameState.player.class = 'warrior';

            // Warrior should not be able to access wizard-specific content
            // This depends on UI filtering, but the event data should have requirements
            const wizardEvent = StoryData.getEvent('wizard_arcane_mystery');
            expect(wizardEvent.classRequirement).toContain('wizard');
            expect(wizardEvent.classRequirement).not.toContain('warrior');
        });

        test('level requirements work for high-level content', () => {
            gameState.player.level = 5; // Low level
            gameState.world.currentArea = 'ancient_temple';

            // Ancient temple should be high-level content
            const templeArea = AreaData.getArea('ancient_temple');
            expect(templeArea.difficulty).toBeGreaterThanOrEqual(15);
        });

        test('story flag dependencies work', () => {
            // Convergence event should require specific flags
            const convergenceEvent = StoryData.getEvent('convergence_point');
            expect(convergenceEvent).toBeDefined();

            // Unity path specifically requires multiple paths
            const unityChoice = convergenceEvent.choices.find(choice => choice.outcome === 'unity_path');
            expect(unityChoice.requirement).toContain('multiple_paths_completed');
        });
    });
});