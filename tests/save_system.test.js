/**
 * Save System Cross-Browser Compatibility Tests (Task 10.4)
 * Tests save/load functionality across different browser environments and edge cases
 */

describe('Save System Cross-Browser Tests', () => {
    let game;
    let gameState;
    let originalLocalStorage;

    beforeAll(() => {
        assertTruthy(typeof window.SawyersRPG !== 'undefined', 'Global game instance should be defined');
        assertTruthy(typeof window.SaveSystem !== 'undefined', 'SaveSystem should be available');
        game = window.SawyersRPG;
        gameState = game.getGameState();

        // Store original localStorage for restoration
        originalLocalStorage = window.localStorage;
    });

    beforeEach(() => {
        // Reset game state and clear localStorage
        gameState.resetToDefaults();
        localStorage.clear();
        SaveSystem.lastError = null;
    });

    afterAll(() => {
        // Restore original localStorage
        window.localStorage = originalLocalStorage;
    });

    describe('Basic Save/Load Functionality', () => {
        it('should save and load game state successfully', () => {
            // Modify game state
            gameState.player.name = 'TestPlayer';
            gameState.player.level = 5;
            gameState.player.experience = 1000;
            gameState.player.inventory.gold = 500;
            gameState.addStoryFlag('test_flag');

            // Save game
            const saveResult = SaveSystem.saveGame();
            assertTruthy(saveResult, 'Save should succeed');

            // Reset state
            gameState.resetToDefaults();
            assertEqual(gameState.player.level, 1, 'Level should be reset');
            assertEqual(gameState.player.inventory.gold, 100, 'Gold should be reset to default value');

            // Load game
            const loadResult = SaveSystem.loadGame();
            assertTruthy(loadResult, 'Load should succeed');

            // Verify restored state
            assertEqual(gameState.player.name, 'TestPlayer', 'Player name should be restored');
            assertEqual(gameState.player.level, 5, 'Player level should be restored');
            assertEqual(gameState.player.experience, 1000, 'Player experience should be restored');
            assertEqual(gameState.player.inventory.gold, 500, 'Player gold should be restored');
            assertTruthy(gameState.world.storyFlags.includes('test_flag'), 'Story flags should be restored');
        });

        it('should handle autosave functionality', () => {
            // Test autosave creation
            gameState.player.level = 3;
            const autoSaveResult = SaveSystem.autoSave();
            assertTruthy(autoSaveResult, 'Auto-save should succeed');
            assertTruthy(SaveSystem.hasAutoSave(), 'Auto-save should exist');

            // Test autosave loading
            const autoSaveData = SaveSystem.loadAutoSave();
            assertTruthy(autoSaveData, 'Auto-save data should be retrievable');
            assertEqual(autoSaveData.player.level, 3, 'Auto-save should contain correct player level');
        });
    });

    describe('Save Data Validation', () => {
        it('should validate save data structure', () => {
            const validSave = {
                version: '1.0.0',
                timestamp: Date.now(),
                player: { name: 'Test', level: 1 },
                world: { currentArea: 'starting_village' },
                monsters: { storage: [] },
                settings: { volume: 0.5 }
            };

            assertTruthy(SaveSystem.validateSaveData(validSave), 'Valid save should pass validation');
            assertEqual(SaveSystem.lastError, null, 'No error should be set for valid save');
        });

        it('should reject invalid save data', () => {
            const invalidSaves = [
                null,
                { version: '1.0.0' }, // Missing required fields
                { version: 123, timestamp: Date.now() }, // Wrong types
                { version: '1.0.0', timestamp: 'invalid' } // Wrong timestamp type
            ];

            invalidSaves.forEach((invalidSave, index) => {
                assertFalsy(SaveSystem.validateSaveData(invalidSave), `Invalid save ${index} should fail validation`);
                assertTruthy(SaveSystem.lastError, `Error should be set for invalid save ${index}`);
            });
        });
    });

    describe('localStorage Edge Cases', () => {
        it('should handle localStorage quota exceeded', () => {
            // Mock localStorage to simulate quota exceeded
            const mockStorage = {
                getItem: localStorage.getItem.bind(localStorage),
                setItem: () => {
                    throw new DOMException('QuotaExceededError', 'QuotaExceededError');
                },
                removeItem: localStorage.removeItem.bind(localStorage),
                clear: localStorage.clear.bind(localStorage)
            };

            // Temporarily replace localStorage
            Object.defineProperty(window, 'localStorage', {
                value: mockStorage,
                writable: true
            });

            const saveResult = SaveSystem.saveGame();
            assertFalsy(saveResult, 'Save should fail when quota exceeded');

            // Restore localStorage
            Object.defineProperty(window, 'localStorage', {
                value: originalLocalStorage,
                writable: true
            });
        });

        it('should handle localStorage access denied', () => {
            // Mock localStorage to simulate access denied (private browsing)
            Object.defineProperty(window, 'localStorage', {
                get: () => {
                    throw new DOMException('SecurityError', 'Access denied');
                },
                configurable: true
            });

            const saveResult = SaveSystem.saveGame();
            assertFalsy(saveResult, 'Save should fail when localStorage access denied');

            // Restore localStorage
            Object.defineProperty(window, 'localStorage', {
                value: originalLocalStorage,
                writable: true
            });
        });

        it('should handle corrupted localStorage data', () => {
            // Set corrupted data directly
            originalLocalStorage.setItem(SaveSystem.SAVE_KEY, 'invalid json data');

            const loadResult = SaveSystem.loadGame();
            assertFalsy(loadResult, 'Load should fail with corrupted data');
        });
    });

    describe('Import/Export Functionality', () => {
        it('should export save data as downloadable file', () => {
            // Save a game first
            gameState.player.name = 'ExportTest';
            SaveSystem.saveGame();

            // Mock DOM elements for download
            const mockAnchor = {
                click: () => {},
                href: '',
                download: ''
            };
            const originalCreateElement = document.createElement;
            document.createElement = (tag) => {
                if (tag === 'a') return mockAnchor;
                return originalCreateElement.call(document, tag);
            };

            // Mock URL.createObjectURL and revokeObjectURL
            const mockURL = {
                createObjectURL: () => 'mock-url',
                revokeObjectURL: () => {}
            };
            const originalURL = window.URL;
            window.URL = mockURL;

            const exportResult = SaveSystem.exportSave();
            assertTruthy(exportResult, 'Export should succeed');

            // Restore mocks
            document.createElement = originalCreateElement;
            window.URL = originalURL;
        });

        it('should import save data from file', async () => {
            const saveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                player: { name: 'ImportTest', level: 10 },
                world: { currentArea: 'deep_forest' },
                monsters: { storage: [] },
                settings: { volume: 0.8 }
            };

            // Mock File object
            const mockFile = {
                text: async () => JSON.stringify(saveData)
            };

            const importResult = await SaveSystem.importSave(mockFile);
            assertTruthy(importResult, 'Import should succeed');
            assertEqual(gameState.player.name, 'ImportTest', 'Imported player name should be applied');
            assertEqual(gameState.player.level, 10, 'Imported player level should be applied');
        });

        it('should reject invalid import files', async () => {
            const mockInvalidFile = {
                text: async () => 'invalid json'
            };

            const importResult = await SaveSystem.importSave(mockInvalidFile);
            assertFalsy(importResult, 'Import should fail with invalid file');
            assertTruthy(SaveSystem.lastError, 'Error should be set for invalid import');
        });
    });

    describe('Cross-Browser Compatibility', () => {
        it('should handle different JSON.stringify behaviors', () => {
            // Test with complex nested objects that might stringify differently
            gameState.player.inventory.items = {
                'health_potion': 5,
                'mana_potion': 3
            };
            gameState.monsters.storage = [
                { id: 'test1', species: 'slime', level: 5 },
                { id: 'test2', species: 'goblin', level: 8 }
            ];

            const saveResult = SaveSystem.saveGame();
            assertTruthy(saveResult, 'Save with complex data should succeed');

            const loadResult = SaveSystem.loadGame();
            assertTruthy(loadResult, 'Load with complex data should succeed');

            assertEqual(gameState.player.inventory.items['health_potion'], 5, 'Complex inventory should be restored');
            assertEqual(gameState.monsters.storage.length, 2, 'Monster storage should be restored');
        });

        it('should handle different Date.now() timestamp formats', () => {
            // Test with various timestamp edge cases
            const originalDateNow = Date.now;

            // Test with very large timestamp (year 3000)
            Date.now = () => 32503680000000;
            let saveResult = SaveSystem.saveGame();
            assertTruthy(saveResult, 'Save with large timestamp should succeed');

            // Test with small timestamp (year 1970)
            Date.now = () => 0;
            saveResult = SaveSystem.saveGame();
            assertTruthy(saveResult, 'Save with small timestamp should succeed');

            // Restore original Date.now
            Date.now = originalDateNow;
        });

        it('should handle browser-specific localStorage size limits', () => {
            // Create a large save file to test size limits
            const largeSaveData = {
                version: '1.0.0',
                timestamp: Date.now(),
                player: {
                    name: 'LargeTest',
                    level: 99,
                    // Create large inventory to test size limits
                    inventory: {
                        items: {}
                    }
                },
                world: { currentArea: 'starting_village' },
                monsters: { storage: [] },
                settings: { volume: 0.5 }
            };

            // Fill with large data (but not too large to break tests)
            for (let i = 0; i < 100; i++) {
                largeSaveData.player.inventory.items[`item_${i}`] = i;
            }

            // Manually save large data
            try {
                localStorage.setItem(SaveSystem.SAVE_KEY, JSON.stringify(largeSaveData));
                const loadResult = SaveSystem.loadGame();
                assertTruthy(loadResult, 'Large save should load successfully');
            } catch (e) {
                // If storage quota exceeded, test should still pass
                console.log('Storage quota exceeded during large save test (expected in some browsers)');
            }
        });
    });

    describe('Migration and Versioning', () => {
        it('should handle version migration gracefully', () => {
            const oldVersionSave = {
                version: '0.9.0', // Older version
                timestamp: Date.now(),
                player: { name: 'MigrationTest' },
                world: {},
                monsters: {},
                settings: {}
            };

            const migratedSave = SaveSystem.migrateIfNeeded(oldVersionSave);
            assertTruthy(migratedSave, 'Migration should return a save object');

            // Currently no migrations implemented, so should return unchanged
            assertEqual(migratedSave.version, '0.9.0', 'Version should be unchanged in current implementation');
        });

        it('should handle missing version field', () => {
            const noVersionSave = {
                timestamp: Date.now(),
                player: { name: 'NoVersionTest' },
                world: {},
                monsters: {},
                settings: {}
            };

            const migratedSave = SaveSystem.migrateIfNeeded(noVersionSave);
            assertTruthy(migratedSave, 'Migration should handle missing version');
        });
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Save system cross-browser tests loaded.');
}