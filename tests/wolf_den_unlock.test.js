/**
 * Wolf Den Unlock Path Tests
 * Verifies both wolf_tracker and wolf_companion paths work
 */

describe('Wolf Den Unlock Path Tests', () => {
    beforeAll(() => {
        if (typeof AreaData === 'undefined') {
            console.warn('AreaData not loaded - skipping tests');
        }
    });

    describe('Wolf Den unlock requirements', () => {
        it('should unlock with pack_encounter story flag and wolf_tracker item', () => {
            if (typeof AreaData === 'undefined') return;

            const storyProgress = ['pack_encounter'];
            const playerLevel = 5;
            const inventory = ['wolf_tracker'];
            const playerClass = 'warrior';
            const defeatedBosses = [];

            const isUnlocked = AreaData.isAreaUnlocked(
                'wolf_den',
                storyProgress,
                playerLevel,
                inventory,
                playerClass,
                defeatedBosses
            );

            assertTruthy(isUnlocked, 'Wolf Den should unlock with pack_encounter + wolf_tracker');
        });

        it('should unlock with pack_encounter story flag and wolf_companion item', () => {
            if (typeof AreaData === 'undefined') return;

            const storyProgress = ['pack_encounter'];
            const playerLevel = 5;
            const inventory = ['wolf_companion'];
            const playerClass = 'ranger';
            const defeatedBosses = [];

            const isUnlocked = AreaData.isAreaUnlocked(
                'wolf_den',
                storyProgress,
                playerLevel,
                inventory,
                playerClass,
                defeatedBosses
            );

            assertTruthy(isUnlocked, 'Wolf Den should unlock with pack_encounter + wolf_companion (ranger path)');
        });

        it('should NOT unlock with only pack_encounter (missing item)', () => {
            if (typeof AreaData === 'undefined') return;

            const storyProgress = ['pack_encounter'];
            const playerLevel = 5;
            const inventory = []; // No wolf item
            const playerClass = 'warrior';
            const defeatedBosses = [];

            const isUnlocked = AreaData.isAreaUnlocked(
                'wolf_den',
                storyProgress,
                playerLevel,
                inventory,
                playerClass,
                defeatedBosses
            );

            assertFalsy(isUnlocked, 'Wolf Den should NOT unlock without wolf_tracker or wolf_companion');
        });

        it('should NOT unlock with only wolf_tracker (missing story flag)', () => {
            if (typeof AreaData === 'undefined') return;

            const storyProgress = []; // No pack encounter
            const playerLevel = 5;
            const inventory = ['wolf_tracker'];
            const playerClass = 'warrior';
            const defeatedBosses = [];

            const isUnlocked = AreaData.isAreaUnlocked(
                'wolf_den',
                storyProgress,
                playerLevel,
                inventory,
                playerClass,
                defeatedBosses
            );

            assertFalsy(isUnlocked, 'Wolf Den should NOT unlock without pack_encounter story flag');
        });
    });

    describe('Deep Forest wolf spawning', () => {
        it('should include wolves in Deep Forest monster list', () => {
            if (typeof AreaData === 'undefined') return;

            const deepForest = AreaData.getArea('deep_forest');
            assertTruthy(deepForest, 'Deep Forest area should exist');
            assertTruthy(deepForest.monsters, 'Deep Forest should have monsters');
            assertArrayContains(deepForest.monsters, 'wolf', 'Deep Forest should include wolves in monster list');
        });

        it('should have wolves as highest spawn weight in Deep Forest', () => {
            if (typeof AreaData === 'undefined') return;

            const deepForest = AreaData.getArea('deep_forest');
            assertTruthy(deepForest.spawnTable, 'Deep Forest should have spawn table');

            const wolfEntry = deepForest.spawnTable.find(entry => entry.species === 'wolf');
            assertTruthy(wolfEntry, 'Wolf should be in Deep Forest spawn table');
            assertEqual(wolfEntry.weight, 40, 'Wolf should have weight 40 in Deep Forest');

            // Verify it's the highest weight
            const maxWeight = Math.max(...deepForest.spawnTable.map(e => e.weight));
            assertEqual(wolfEntry.weight, maxWeight, 'Wolf should have the highest spawn weight in Deep Forest');
        });
    });

    describe('Pack encounter story event progression', () => {
        it('should be listed in Deep Forest story events', () => {
            if (typeof AreaData === 'undefined') return;

            const deepForest = AreaData.getArea('deep_forest');
            assertTruthy(deepForest.storyEvents, 'Deep Forest should have story events');
            assertArrayContains(deepForest.storyEvents, 'pack_encounter', 'Deep Forest should include pack_encounter event');
        });

        it('should validate complete unlock path progression', () => {
            if (typeof AreaData === 'undefined') return;

            // Step 1: Player should be able to access Deep Forest first
            const deepForest = AreaData.getArea('deep_forest');
            assertTruthy(deepForest.unlockRequirements, 'Deep Forest should have unlock requirements');
            assertEqual(deepForest.unlockRequirements.story, 'forest_path_cleared', 'Deep Forest requires forest_path_cleared');
            assertEqual(deepForest.unlockRequirements.level, 3, 'Deep Forest requires level 3');

            // Step 2: Wolf encounter should be possible (wolves in spawn table)
            assertArrayContains(deepForest.monsters, 'wolf', 'Wolves should spawn in Deep Forest');

            // Step 3: Pack encounter event should trigger story progression
            assertArrayContains(deepForest.storyEvents, 'pack_encounter', 'Pack encounter should be available');

            // Step 4: Wolf Den should be accessible via Deep Forest
            const wolfDen = AreaData.getArea('wolf_den');
            assertArrayContains(wolfDen.connections, 'deep_forest', 'Wolf Den should connect to Deep Forest');
            assertArrayContains(deepForest.connections, 'wolf_den', 'Deep Forest should connect to Wolf Den');
        });
    });
});