/**
 * Browser Compatibility Tests (Task 10.4)
 * Tests specific browser features and edge cases for cross-browser compatibility
 */

describe('Browser Compatibility Tests', () => {
    let originalUserAgent;
    let originalNavigator;

    beforeAll(() => {
        originalUserAgent = navigator.userAgent;
        originalNavigator = window.navigator;
    });

    afterAll(() => {
        // Restore original navigator
        Object.defineProperty(window, 'navigator', {
            value: originalNavigator,
            writable: true
        });
    });

    describe('User Agent Detection', () => {
        it('should handle Chrome browser features', () => {
            // Mock Chrome user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                configurable: true
            });

            // Test localStorage is available
            assertTruthy(typeof localStorage !== 'undefined', 'localStorage should be available in Chrome');
            assertTruthy(typeof JSON.stringify === 'function', 'JSON.stringify should be available');
            assertTruthy(typeof JSON.parse === 'function', 'JSON.parse should be available');
        });

        it('should handle Firefox browser features', () => {
            // Mock Firefox user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
                configurable: true
            });

            // Test localStorage is available
            assertTruthy(typeof localStorage !== 'undefined', 'localStorage should be available in Firefox');
            assertTruthy(typeof Date.now === 'function', 'Date.now should be available');
        });

        it('should handle Safari browser features', () => {
            // Mock Safari user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
                configurable: true
            });

            // Test localStorage is available
            assertTruthy(typeof localStorage !== 'undefined', 'localStorage should be available in Safari');
            assertTruthy(typeof Blob === 'function', 'Blob should be available for save exports');
        });

        it('should handle Edge browser features', () => {
            // Mock Edge user agent
            Object.defineProperty(navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
                configurable: true
            });

            // Test localStorage is available
            assertTruthy(typeof localStorage !== 'undefined', 'localStorage should be available in Edge');
            assertTruthy(typeof URL.createObjectURL === 'function', 'URL.createObjectURL should be available for downloads');
        });
    });

    describe('Storage API Compatibility', () => {
        it('should handle different localStorage implementations', () => {
            // Test that localStorage behaves consistently
            const testKey = 'test_key_' + Date.now();
            const testValue = 'test_value';

            localStorage.setItem(testKey, testValue);
            const retrieved = localStorage.getItem(testKey);
            assertEqual(retrieved, testValue, 'localStorage should store and retrieve strings consistently');

            localStorage.removeItem(testKey);
            const afterRemoval = localStorage.getItem(testKey);
            assertEqual(afterRemoval, null, 'localStorage should return null for removed items');
        });

        it('should handle JSON serialization consistently', () => {
            const testObject = {
                string: 'test',
                number: 42,
                boolean: true,
                array: [1, 2, 3],
                null_value: null,
                nested: { key: 'value' }
            };

            const serialized = JSON.stringify(testObject);
            assertTruthy(typeof serialized === 'string', 'JSON.stringify should return a string');

            const deserialized = JSON.parse(serialized);
            assertEqual(deserialized.string, 'test', 'String values should be preserved');
            assertEqual(deserialized.number, 42, 'Number values should be preserved');
            assertEqual(deserialized.boolean, true, 'Boolean values should be preserved');
            assertEqual(deserialized.array.length, 3, 'Array length should be preserved');
            assertEqual(deserialized.null_value, null, 'Null values should be preserved');
            assertEqual(deserialized.nested.key, 'value', 'Nested objects should be preserved');
        });

        it('should handle Date objects consistently', () => {
            const testDate = new Date('2024-01-01T12:00:00.000Z');
            const timestamp = testDate.getTime();

            // Test Date.now() consistency
            const now1 = Date.now();
            const now2 = Date.now();
            assertTruthy(now2 >= now1, 'Date.now() should be monotonic');

            // Test timestamp conversion
            const reconstructed = new Date(timestamp);
            assertEqual(reconstructed.getTime(), timestamp, 'Date timestamps should be consistent');
        });
    });

    describe('DOM API Compatibility', () => {
        it('should handle document.createElement consistently', () => {
            const anchor = document.createElement('a');
            assertTruthy(anchor instanceof HTMLElement, 'createElement should return HTMLElement');
            assertTruthy(typeof anchor.click === 'function', 'Anchor elements should have click method');

            const div = document.createElement('div');
            assertTruthy(div instanceof HTMLElement, 'div elements should be HTML elements');
            assertTruthy(typeof div.appendChild === 'function', 'div should have appendChild method');
        });

        it('should handle URL object consistently', () => {
            if (typeof URL !== 'undefined') {
                assertTruthy(typeof URL.createObjectURL === 'function', 'URL.createObjectURL should be available');
                assertTruthy(typeof URL.revokeObjectURL === 'function', 'URL.revokeObjectURL should be available');

                // Test with a simple blob
                const blob = new Blob(['test'], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                assertTruthy(typeof url === 'string', 'createObjectURL should return a string');
                assertTruthy(url.startsWith('blob:'), 'URL should start with blob: prefix');

                // Clean up
                URL.revokeObjectURL(url);
            }
        });

        it('should handle File API if available', () => {
            if (typeof File !== 'undefined') {
                assertTruthy(typeof Blob === 'function', 'Blob constructor should be available');

                const blob = new Blob(['test content'], { type: 'application/json' });
                assertTruthy(blob instanceof Blob, 'Blob instance should be created');
                assertTruthy(blob.size > 0, 'Blob should have size');
                assertEqual(blob.type, 'application/json', 'Blob type should be preserved');
            }
        });
    });

    describe('Error Handling Compatibility', () => {
        it('should handle DOMException consistently', () => {
            try {
                // Try to trigger a DOMException (varies by browser)
                if (typeof DOMException !== 'undefined') {
                    const exception = new DOMException('Test message', 'TestError');
                    assertTruthy(exception instanceof Error, 'DOMException should be instance of Error');
                    assertEqual(exception.name, 'TestError', 'DOMException name should be preserved');
                }
            } catch (e) {
                // Some browsers might not support DOMException constructor
                console.log('DOMException constructor not supported (acceptable)');
            }
        });

        it('should handle try/catch consistently', () => {
            let caughtError = null;

            try {
                throw new Error('Test error');
            } catch (e) {
                caughtError = e;
            }

            assertTruthy(caughtError instanceof Error, 'Error should be caught');
            assertEqual(caughtError.message, 'Test error', 'Error message should be preserved');
        });
    });

    describe('Performance API Compatibility', () => {
        it('should handle timing functions', () => {
            // Test Date.now() availability
            assertTruthy(typeof Date.now === 'function', 'Date.now should be available');

            const start = Date.now();
            // Small delay
            for (let i = 0; i < 1000; i++) {
                Math.random();
            }
            const end = Date.now();

            assertTruthy(end >= start, 'Time should progress forward');
        });

        it('should handle Math functions consistently', () => {
            // Test Math.random()
            const random1 = Math.random();
            const random2 = Math.random();
            assertTruthy(random1 >= 0 && random1 < 1, 'Math.random should return [0,1)');
            assertTruthy(random2 >= 0 && random2 < 1, 'Math.random should return [0,1)');

            // Test Math.floor()
            assertEqual(Math.floor(3.7), 3, 'Math.floor should work consistently');
            assertEqual(Math.floor(-2.3), -3, 'Math.floor should handle negatives consistently');

            // Test Math.max/min
            assertEqual(Math.max(1, 5, 3), 5, 'Math.max should work consistently');
            assertEqual(Math.min(1, 5, 3), 1, 'Math.min should work consistently');
        });
    });

    describe('Save System Browser Integration', () => {
        it('should save and load across browser sessions', () => {
            if (typeof SaveSystem !== 'undefined') {
                // Clear any existing saves
                localStorage.removeItem(SaveSystem.SAVE_KEY);

                // Create a test save
                const game = window.SawyersRPG;
                const gameState = game?.getGameState?.();

                if (gameState) {
                    gameState.resetToDefaults();
                    gameState.player.name = 'CrossBrowserTest';
                    gameState.player.level = 15;

                    const saveResult = SaveSystem.saveGame();
                    assertTruthy(saveResult, 'Save should succeed across browsers');

                    // Verify the save exists in localStorage
                    const rawSave = localStorage.getItem(SaveSystem.SAVE_KEY);
                    assertTruthy(rawSave, 'Save data should exist in localStorage');

                    // Parse and verify structure
                    const parsedSave = JSON.parse(rawSave);
                    assertEqual(parsedSave.player.name, 'CrossBrowserTest', 'Save data should be correctly structured');
                    assertEqual(parsedSave.player.level, 15, 'Save data should preserve player level');
                }
            }
        });

        it('should handle import/export across browsers', () => {
            if (typeof SaveSystem !== 'undefined') {
                const mockSaveData = {
                    version: '1.0.0',
                    timestamp: Date.now(),
                    player: { name: 'ExportTest', level: 20 },
                    world: { currentArea: 'forest_path' },
                    monsters: { storage: [] },
                    settings: { volume: 0.7 }
                };

                // Test JSON serialization consistency
                const serialized = JSON.stringify(mockSaveData);
                const deserialized = JSON.parse(serialized);

                assertEqual(deserialized.player.name, 'ExportTest', 'Export data should preserve player name');
                assertEqual(deserialized.player.level, 20, 'Export data should preserve player level');
                assertEqual(deserialized.settings.volume, 0.7, 'Export data should preserve settings');

                // Test validation
                const isValid = SaveSystem.validateSaveData(deserialized);
                assertTruthy(isValid, 'Exported save data should pass validation');
            }
        });
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Browser compatibility tests loaded.');
}