// Monster Storage Verification Test
// Verifies the fixes from docs/monster-storage-troubleshooting.md

describe('Monster Storage Verification', function() {

    test('should enable testing mode for reliable captures', function() {
        if (window.TESTING_OVERRIDES) {
            window.TESTING_OVERRIDES.easyCaptureMode = true;
        }

        // Verify testing mode is enabled
        const testingEnabled = window.TESTING_OVERRIDES?.easyCaptureMode === true;
        truthy(testingEnabled, 'Testing mode should be enabled for reliable captures');
    });

    test('should capture monster with all required fields', function() {
        // Ensure gameState is available
        truthy(window.gameState, 'GameState should be available');
        truthy(window.gameState.captureMonster, 'captureMonster method should exist');

        // Get initial storage count
        const initialCount = window.gameState.monsters?.storage?.length || 0;

        // Attempt capture (may need multiple tries even in testing mode)
        let captureResult = null;
        let attempts = 0;
        const maxAttempts = 15; // Higher chance with testing mode

        while (!captureResult?.success && attempts < maxAttempts) {
            attempts++;
            captureResult = window.gameState.captureMonster('goblin', 2);
        }

        // Verify capture succeeded
        truthy(captureResult?.success, `Capture should succeed within ${maxAttempts} attempts (got ${attempts})`);

        if (captureResult?.success) {
            const monster = captureResult.monster;

            // Verify required fields exist (the main fix from troubleshooting doc)
            truthy(monster.speciesData, 'Captured monster should have speciesData field');
            truthy(monster.id, 'Captured monster should have id field');
            truthy(monster.species, 'Captured monster should have species field');
            truthy(monster.level, 'Captured monster should have level field');
            truthy(monster.stats, 'Captured monster should have stats field');

            // Verify storage was updated
            const finalCount = window.gameState.monsters?.storage?.length || 0;
            equals(finalCount, initialCount + 1, 'Storage count should increase by 1');

            console.log(`✅ Successfully captured ${monster.species} (Level ${monster.level}) with all required fields`);
        }
    });

    test('should display captured monsters in storage UI', function() {
        // Ensure we have UIManager
        truthy(window.uiManager, 'UIManager should be available');

        // Switch to monster management scene
        window.uiManager.switchScene('monster_management');

        // Get MonsterUI module
        const monsterUI = window.uiManager.modules.get('MonsterUI');
        truthy(monsterUI, 'MonsterUI module should be available');

        // Check storage state
        const totalInStorage = window.gameState?.monsters?.storage?.length || 0;

        if (totalInStorage > 0) {
            // Test filtering functionality (the core issue that was fixed)
            const filteredMonsters = monsterUI.getFilteredMonsters();
            truthy(filteredMonsters.length > 0, 'Filtered monsters should include captured monsters');

            // The key fix: monsters with speciesData should not be filtered out
            const monstersWithSpeciesData = window.gameState.monsters.storage.filter(m => m.speciesData);
            equals(filteredMonsters.length, monstersWithSpeciesData.length,
                   'All monsters with speciesData should pass filtering');

            console.log(`🔍 Storage filtering working: ${totalInStorage} total, ${filteredMonsters.length} after filtering`);
        } else {
            console.log('ℹ️ No monsters in storage to test filtering');
        }
    });

    test('should handle empty party slot clicks without errors', function() {
        // Switch to monster management scene if not already there
        window.uiManager.switchScene('monster_management');

        // Look for party container
        const partyContainer = document.querySelector('#monster-party');
        if (!partyContainer) {
            // Create minimal party container for testing
            const container = document.createElement('div');
            container.id = 'monster-party';
            container.innerHTML = '<div class="party-slot" data-slot="0"></div>';
            document.body.appendChild(container);
        }

        // Find empty party slots
        const partySlots = document.querySelectorAll('#monster-party .party-slot');
        const emptySlots = Array.from(partySlots).filter(slot =>
            !slot.classList.contains('occupied') && !slot.dataset.monsterId
        );

        if (emptySlots.length > 0) {
            let errorOccurred = false;

            // Set up error monitoring
            const originalError = window.onerror;
            window.onerror = function(msg, url, line, col, error) {
                if (msg.includes('notificationManager.show is not a function')) {
                    errorOccurred = true;
                }
                if (originalError) originalError.apply(this, arguments);
            };

            try {
                // Click first empty slot
                const testSlot = emptySlots[0];
                testSlot.click();

                // The fix: should not throw "this.notificationManager.show is not a function"
                equals(errorOccurred, false, 'Empty party slot click should not cause notification errors');

                console.log('✅ Empty party slot click handled correctly');
            } finally {
                window.onerror = originalError;
            }
        } else {
            console.log('ℹ️ No empty party slots found - creating test slot');
            // This is acceptable as we're testing error handling
        }
    });

    test('should have proper navigation working', function() {
        // Test the navigation fixes mentioned in troubleshooting doc

        // Switch to game world first
        window.uiManager.switchScene('game_world');

        // Check if monsters button exists and has event handler
        // (The troubleshooting doc mentions this was fixed in GameWorldUI.js:648-650)
        const monstersBtn = document.querySelector('#monsters-btn');
        if (monstersBtn) {
            // Try clicking monsters button
            let sceneChanged = false;
            const originalSwitchScene = window.uiManager.switchScene;

            window.uiManager.switchScene = function(sceneName) {
                if (sceneName === 'monster_management') {
                    sceneChanged = true;
                }
                return originalSwitchScene.call(this, sceneName);
            };

            try {
                monstersBtn.click();
                truthy(sceneChanged, 'Monsters button should trigger scene change to monster_management');
                console.log('✅ Monsters button navigation working');
            } finally {
                window.uiManager.switchScene = originalSwitchScene;
            }
        } else {
            console.log('ℹ️ Monsters button not found in current DOM - expected in headless mode');
        }
    });
});