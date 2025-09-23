/**
 * Story System Smoke Tests
 * Simple tests to verify the story system is functional
 */

describe('Story System Smoke Tests', () => {
    let gameState;

    beforeEach(() => {
        gameState = new GameState();
        gameState.initialize();
        gameState.player.name = 'Test Hero';
        gameState.player.class = 'knight';
        gameState.player.level = 10;
    });

    test('basic story system functions are available', () => {
        expect(StoryData).toBeDefined();
        expect(StoryData.getEvent).toBeTypeOf('function');
        expect(StoryData.processChoice).toBeTypeOf('function');
        expect(StoryData.calculateStoryBranch).toBeTypeOf('function');
        expect(gameState.processStoryChoice).toBeTypeOf('function');
    });

    test('can retrieve and process basic story events', () => {
        const gameStart = StoryData.getEvent('game_start');
        expect(gameStart).toBeDefined();
        expect(gameStart.name).toBe('The Beginning');

        const result = gameState.processStoryChoice('game_start', 'default');
        expect(result).toBeDefined();
        expect(result.success).toBe(true);
    });

    test('story choices update game state correctly', () => {
        const initialFlags = gameState.world.storyFlags.length;

        gameState.processStoryChoice('pack_encounter', 'respectful_approach');

        expect(gameState.world.storyFlags.length).toBeGreaterThan(initialFlags);
        expect(gameState.world.storyFlags).toContain('wolf_respect_earned');
    });

    test('new story events are accessible', () => {
        // Test a few key new events
        const crystalEvent = StoryData.getEvent('crystal_cave_mystery');
        expect(crystalEvent).toBeDefined();
        expect(crystalEvent.choices.length).toBeGreaterThan(0);

        const rivalEvent = StoryData.getEvent('rival_tamer_encounter');
        expect(rivalEvent).toBeDefined();

        const templeEvent = StoryData.getEvent('ancient_temple_trial');
        expect(templeEvent).toBeDefined();
    });

    test('class-specific events exist', () => {
        const knightEvent = StoryData.getEvent('knight_honor_test');
        expect(knightEvent).toBeDefined();
        expect(knightEvent.classRequirement).toContain('knight');

        const wizardEvent = StoryData.getEvent('wizard_arcane_mystery');
        expect(wizardEvent).toBeDefined();
        expect(wizardEvent.classRequirement).toContain('wizard');

        const rogueEvent = StoryData.getEvent('rogue_heist_opportunity');
        expect(rogueEvent).toBeDefined();
        expect(rogueEvent.classRequirement).toContain('rogue');
    });

    test('new areas contain story events', () => {
        const crystalCaves = AreaData.getArea('crystal_caves');
        expect(crystalCaves).toBeDefined();
        expect(crystalCaves.storyEvents).toContain('crystal_cave_mystery');

        const classTrials = AreaData.getArea('class_trial_grounds');
        expect(classTrials).toBeDefined();
        expect(classTrials.storyEvents.length).toBeGreaterThan(5); // Should have all 6 class events
    });

    test('endings are accessible with correct flags', () => {
        // Guardian ending
        const guardianFlags = ['peaceful_approach', 'nature_affinity', 'beast_speaker'];
        const guardianEndings = StoryData.getAvailableEndings(guardianFlags);
        expect(guardianEndings).toContain('guardian_ending');

        // Master ending
        const masterFlags = ['dragon_challenge', 'warrior_path', 'all_monsters_captured'];
        const masterEndings = StoryData.getAvailableEndings(masterFlags);
        expect(masterEndings).toContain('master_ending');
    });

    test('story branch calculation works for different paths', () => {
        const warriorFlags = ['dragon_challenge', 'wolf_challenge_issued'];
        expect(StoryData.calculateStoryBranch(warriorFlags)).toBe('warrior_path');

        const scholarFlags = ['ancient_knowledge'];
        expect(StoryData.calculateStoryBranch(scholarFlags)).toBe('scholar_path');

        const natureFlags = ['beast_speaker'];
        expect(StoryData.calculateStoryBranch(natureFlags)).toBe('nature_path');

        const peacefulFlags = ['wolf_respect_earned'];
        expect(StoryData.calculateStoryBranch(peacefulFlags)).toBe('peaceful_path');
    });

    test('story content volume is sufficient', () => {
        const eventCount = Object.keys(StoryData.events).length;
        expect(eventCount).toBeGreaterThanOrEqual(20); // Should have 20+ events

        const endingCount = Object.keys(StoryData.endings).length;
        expect(endingCount).toBeGreaterThanOrEqual(4); // Should have 4+ endings
    });

    test('story progression saves and loads correctly', () => {
        // Make story progress
        gameState.processStoryChoice('pack_encounter', 'communication_attempt');
        const originalFlags = [...gameState.world.storyFlags];

        // Save and load
        const saveData = gameState.exportSave();
        const newGameState = new GameState();
        const loadResult = newGameState.importSave(saveData);

        expect(loadResult.success).toBe(true);
        expect(newGameState.world.storyFlags).toEqual(originalFlags);
    });
});