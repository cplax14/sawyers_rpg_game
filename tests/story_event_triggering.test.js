/**
 * Story Event Triggering Tests
 * Tests if story events can be properly detected and triggered during exploration
 */

describe('Story Event Triggering Tests', () => {
    beforeAll(() => {
        if (typeof StoryData === 'undefined') {
            console.warn('StoryData not loaded - skipping tests');
        }
        if (typeof AreaData === 'undefined') {
            console.warn('AreaData not loaded - skipping tests');
        }
    });

    describe('Story event detection', () => {
        it('should find pack_encounter event available in deep_forest', () => {
            if (typeof StoryData === 'undefined' || typeof AreaData === 'undefined') return;

            // Check that deep_forest has pack_encounter in its storyEvents
            const deepForest = AreaData.getArea('deep_forest');
            assertTruthy(deepForest, 'Deep Forest area should exist');
            assertTruthy(deepForest.storyEvents, 'Deep Forest should have story events');
            assertArrayContains(deepForest.storyEvents, 'pack_encounter', 'Deep Forest should include pack_encounter');

            // Check that pack_encounter story event exists in StoryData
            assertTruthy(StoryData.events.pack_encounter, 'pack_encounter event should exist in StoryData');
        });

        it('should detect available story events for new player in deep_forest', () => {
            if (typeof StoryData === 'undefined') return;

            // Fresh player with no story flags (just tutorial complete to access deep forest)
            const playerFlags = ['tutorial_complete', 'forest_path_cleared'];
            const availableEvents = StoryData.getAreaEvents('deep_forest', playerFlags);

            console.log('[DEBUG] Available events in deep_forest:', availableEvents);
            console.log('[DEBUG] Player flags:', playerFlags);

            assertTruthy(Array.isArray(availableEvents), 'Should return array of available events');

            // Pack encounter should be available for new players
            if (availableEvents.length === 0) {
                console.warn('[DEBUG] No events available - this might be the issue!');
            } else {
                console.log('[DEBUG] Found events:', availableEvents);
            }
        });

        it('should not return events that are already completed', () => {
            if (typeof StoryData === 'undefined') return;

            // Player who has completed pack_encounter
            const playerFlags = ['tutorial_complete', 'forest_path_cleared', 'pack_encounter_completed'];
            const availableEvents = StoryData.getAreaEvents('deep_forest', playerFlags);

            console.log('[DEBUG] Available events after completion:', availableEvents);
            console.log('[DEBUG] Player flags with completion:', playerFlags);

            // pack_encounter should not be in the list since it's completed
            assertFalsy(availableEvents.includes('pack_encounter'), 'Completed events should not be returned');
        });
    });

    describe('Story event triggering logic', () => {
        it('should simulate the full trigger flow', () => {
            if (typeof StoryData === 'undefined' || typeof AreaData === 'undefined') return;

            // Simulate GameState for a new player in deep_forest
            const mockGameState = {
                world: {
                    storyFlags: ['tutorial_complete', 'forest_path_cleared'],
                    completedEvents: []
                }
            };

            // Step 1: Get events from StoryData.getAreaEvents
            const flags = mockGameState.world.storyFlags;
            const events = StoryData.getAreaEvents('deep_forest', flags);
            console.log('[DEBUG] Step 1 - Events from getAreaEvents:', events);

            // Step 2: Filter out completed events (as done in triggerStoryEventIfAvailable)
            const completed = mockGameState.world.completedEvents;
            const filteredEvents = events.filter(e => !completed.includes(e));
            console.log('[DEBUG] Step 2 - After completion filter:', filteredEvents);

            // Should have at least pack_encounter available
            if (filteredEvents.length === 0) {
                console.error('[DEBUG] ISSUE FOUND: No events pass the filtering process!');
                console.error('[DEBUG] Original events:', events);
                console.error('[DEBUG] Completed events:', completed);
            } else {
                console.log('[DEBUG] SUCCESS: Events would trigger:', filteredEvents);
            }

            assertTruthy(filteredEvents.length > 0, 'Should have available story events for exploration');
        });

        it('should check if event is listed in area storyEvents correctly', () => {
            if (typeof AreaData === 'undefined') return;

            const area = AreaData.getArea('deep_forest');
            const storyEvents = area.storyEvents || [];

            console.log('[DEBUG] Deep forest story events:', storyEvents);
            console.log('[DEBUG] Checking for pack_encounter in list...');

            const hasPackEncounter = storyEvents.includes('pack_encounter');
            console.log('[DEBUG] Has pack_encounter:', hasPackEncounter);

            assertTruthy(hasPackEncounter, 'pack_encounter should be listed in deep_forest storyEvents');
        });
    });

    describe('Story event probability/randomness', () => {
        it('should check if there is any randomness preventing story events', () => {
            // This test checks if there might be hidden probability/randomness
            // that prevents story events from triggering

            console.log('[DEBUG] Checking if story events have probability gates...');

            if (typeof StoryData !== 'undefined' && StoryData.events.pack_encounter) {
                const event = StoryData.events.pack_encounter;
                console.log('[DEBUG] pack_encounter event structure:', {
                    name: event.name,
                    type: event.type,
                    hasChoices: !!event.choices,
                    choiceCount: event.choices ? event.choices.length : 0,
                    hasProbability: !!event.probability,
                    hasRequirements: !!event.requirements
                });

                // Check if there are hidden requirements that might block the event
                if (event.requirements) {
                    console.log('[DEBUG] Event requirements found:', event.requirements);
                }
                if (event.probability) {
                    console.log('[DEBUG] Event probability found:', event.probability);
                }
            }
        });
    });
});