/**
 * Story Accessibility Tests
 * Focused tests to ensure story events can be accessed and processed
 */

describe('Story Accessibility Tests', () => {
    let gameState;

    beforeEach(() => {
        gameState = new GameState();
        gameState.initialize();
        gameState.player.name = 'Test Hero';
        gameState.player.class = 'knight';
        gameState.player.level = 10;
    });

    describe('Story Event Accessibility', () => {
        test('can access basic story events', () => {
            expect(StoryData).toBeDefined();
            expect(StoryData.getEvent).toBeDefined();

            const gameStart = StoryData.getEvent('game_start');
            expect(gameStart).toBeDefined();
            expect(gameStart.name).toBe('The Beginning');
        });

        test('can process basic story progression', () => {
            expect(gameState.processStoryChoice).toBeDefined();

            // Reset to clean state
            gameState.world.storyFlags = [];
            gameState.world.completedEvents = [];

            // Process game start
            const result = gameState.processStoryChoice('game_start', 'default');
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
        });

        test('can access class-specific events', () => {
            const knightEvent = StoryData.getEvent('knight_honor_test');
            expect(knightEvent).toBeDefined();
            expect(knightEvent.classRequirement).toContain('knight');

            const wizardEvent = StoryData.getEvent('wizard_arcane_mystery');
            expect(wizardEvent).toBeDefined();
            expect(wizardEvent.classRequirement).toContain('wizard');
        });

        test('area events are properly configured', () => {
            expect(AreaData).toBeDefined();
            expect(AreaData.getArea).toBeDefined();

            const forestPath = AreaData.getArea('forest_path');
            expect(forestPath).toBeDefined();
            expect(forestPath.storyEvents).toBeDefined();
            expect(forestPath.storyEvents.length).toBeGreaterThan(0);
        });
    });

    describe('Class-Specific Story Access', () => {
        test('knight can access knight-specific content', () => {
            gameState.player.class = 'knight';
            gameState.world.currentArea = 'class_trial_grounds';

            const area = AreaData.getArea('class_trial_grounds');
            expect(area.storyEvents).toContain('knight_honor_test');

            const availableEvents = StoryData.getAreaEvents('class_trial_grounds', gameState.world.storyFlags);
            expect(availableEvents).toContain('knight_honor_test');
        });

        test('wizard can access wizard-specific content', () => {
            gameState.player.class = 'wizard';
            gameState.world.currentArea = 'class_trial_grounds';

            const area = AreaData.getArea('class_trial_grounds');
            expect(area.storyEvents).toContain('wizard_arcane_mystery');

            const availableEvents = StoryData.getAreaEvents('class_trial_grounds', gameState.world.storyFlags);
            expect(availableEvents).toContain('wizard_arcane_mystery');
        });

        test('rogue can access rogue-specific content', () => {
            gameState.player.class = 'rogue';
            gameState.world.currentArea = 'class_trial_grounds';

            const area = AreaData.getArea('class_trial_grounds');
            expect(area.storyEvents).toContain('rogue_heist_opportunity');

            const availableEvents = StoryData.getAreaEvents('class_trial_grounds', gameState.world.storyFlags);
            expect(availableEvents).toContain('rogue_heist_opportunity');
        });
    });

    describe('Story Flag Progression', () => {
        test('story flags are set correctly', () => {
            gameState.world.storyFlags = [];

            const result = gameState.processStoryChoice('pack_encounter', 'respectful_approach');
            expect(result.success).toBe(true);
            expect(gameState.world.storyFlags).toContain('wolf_respect_earned');
            expect(gameState.world.storyFlags).toContain('nature_affinity');
        });

        test('areas are unlocked by story choices', () => {
            const initialAreas = gameState.world.unlockedAreas.length;

            const result = gameState.processStoryChoice('mystic_grove_discovery', 'attune_nature');
            expect(result.success).toBe(true);
            expect(gameState.world.unlockedAreas.length).toBeGreaterThan(initialAreas);
            expect(gameState.world.unlockedAreas).toContain('mystic_grove');
        });

        test('items are granted by story choices', () => {
            const result = gameState.processStoryChoice('crystal_cave_mystery', 'join_harmony');
            expect(result.success).toBe(true);
            expect(gameState.player.inventory.items['resonance_crystal']).toBeGreaterThan(0);
            expect(gameState.player.inventory.items['harmony_stone']).toBeGreaterThan(0);
        });
    });

    describe('Ending Requirements', () => {
        test('ending requirements are properly defined', () => {
            const guardianEnding = StoryData.getEnding('guardian_ending');
            expect(guardianEnding).toBeDefined();
            expect(guardianEnding.requirements).toBeDefined();
            expect(guardianEnding.requirements.length).toBeGreaterThan(0);
        });

        test('can check ending availability', () => {
            expect(StoryData.getAvailableEndings).toBeDefined();

            // Test with specific flags for guardian ending
            const flags = ['peaceful_approach', 'nature_affinity', 'beast_speaker'];
            const availableEndings = StoryData.getAvailableEndings(flags);
            expect(availableEndings).toContain('guardian_ending');
        });
    });

    describe('Story Branch Calculation', () => {
        test('story branch calculation works', () => {
            expect(StoryData.calculateStoryBranch).toBeDefined();

            // Test warrior path
            const warriorFlags = ['dragon_challenge', 'wolf_challenge_issued'];
            const branch = StoryData.calculateStoryBranch(warriorFlags);
            expect(branch).toBe('warrior_path');
        });

        test('different paths are calculated correctly', () => {
            const scholarFlags = ['ancient_knowledge'];
            const scholarBranch = StoryData.calculateStoryBranch(scholarFlags);
            expect(scholarBranch).toBe('scholar_path');

            const natureFlags = ['beast_speaker'];
            const natureBranch = StoryData.calculateStoryBranch(natureFlags);
            expect(natureBranch).toBe('nature_path');
        });
    });

    describe('Event Completion Tracking', () => {
        test('completed events are tracked', () => {
            expect(gameState.world.completedEvents).toBeDefined();

            const initialCount = gameState.world.completedEvents.length;
            gameState.processStoryChoice('pack_encounter', 'respectful_approach');

            expect(gameState.world.completedEvents.length).toBeGreaterThan(initialCount);
            expect(gameState.world.completedEvents).toContain('pack_encounter');
        });

        test('completed events are not repeated', () => {
            gameState.world.completedEvents = ['first_monster_encounter'];
            gameState.world.currentArea = 'forest_path';

            const availableEvents = StoryData.getAreaEvents('forest_path', gameState.world.storyFlags);
            expect(availableEvents).not.toContain('first_monster_encounter');
        });
    });

    describe('New Story Content Integration', () => {
        test('new mid-game events are accessible', () => {
            const crystalEvent = StoryData.getEvent('crystal_cave_mystery');
            expect(crystalEvent).toBeDefined();
            expect(crystalEvent.choices.length).toBeGreaterThan(0);

            const villageEvent = StoryData.getEvent('abandoned_village');
            expect(villageEvent).toBeDefined();
            expect(villageEvent.choices.length).toBeGreaterThan(0);

            const rivalEvent = StoryData.getEvent('rival_tamer_encounter');
            expect(rivalEvent).toBeDefined();
            expect(rivalEvent.choices.length).toBeGreaterThan(0);
        });

        test('endgame events are accessible', () => {
            const convergenceEvent = StoryData.getEvent('convergence_point');
            expect(convergenceEvent).toBeDefined();
            expect(convergenceEvent.choices.length).toBeGreaterThan(0);

            const templeEvent = StoryData.getEvent('ancient_temple_trial');
            expect(templeEvent).toBeDefined();
            expect(templeEvent.choices.length).toBeGreaterThan(0);
        });

        test('new areas contain story events', () => {
            const templeArea = AreaData.getArea('ancient_temple');
            expect(templeArea).toBeDefined();
            expect(templeArea.storyEvents).toContain('ancient_temple_trial');

            const convergenceArea = AreaData.getArea('mystic_convergence');
            expect(convergenceArea).toBeDefined();
            expect(convergenceArea.storyEvents).toContain('convergence_point');
        });
    });

    describe('Story Content Volume', () => {
        test('sufficient story events for extended gameplay', () => {
            const eventCount = Object.keys(StoryData.events).length;
            expect(eventCount).toBeGreaterThanOrEqual(20); // Should have 20+ events for 2-4 hour gameplay
        });

        test('multiple choices per event for replay value', () => {
            const events = Object.values(StoryData.events);
            const eventsWithChoices = events.filter(event => event.choices && event.choices.length > 0);
            const averageChoices = eventsWithChoices.reduce((sum, event) => sum + event.choices.length, 0) / eventsWithChoices.length;

            expect(averageChoices).toBeGreaterThanOrEqual(2); // Average 2+ choices per event
        });

        test('sufficient story flags for complex branching', () => {
            // Count unique story flags across all outcomes
            const allFlags = new Set();
            const events = Object.values(StoryData.events);

            events.forEach(event => {
                if (event.outcomes) {
                    Object.values(event.outcomes).forEach(outcome => {
                        if (outcome.storyFlags) {
                            outcome.storyFlags.forEach(flag => allFlags.add(flag));
                        }
                    });
                }
            });

            expect(allFlags.size).toBeGreaterThanOrEqual(60); // Should have 60+ unique flags
        });
    });
});