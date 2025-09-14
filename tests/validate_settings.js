/**
 * Settings Interface Validation Test
 * Tests the comprehensive settings menu functionality
 */

// Initialize test results
let settingsTestResults = {
    passed: 0,
    failed: 0,
    errors: []
};

function validateSettingsInterface() {
    console.log('🔧 Starting Settings Interface Validation...\n');
    
    // Test 1: Verify settings HTML structure exists
    try {
        const settingsScreen = document.getElementById('settings-screen');
        const settingsCategories = document.querySelector('.settings-categories');
        const settingsContent = document.querySelector('.settings-content');
        
        if (!settingsScreen) {
            throw new Error('Settings screen element not found');
        }
        
        if (!settingsCategories) {
            throw new Error('Settings categories container not found');
        }
        
        if (!settingsContent) {
            throw new Error('Settings content container not found');
        }
        
        // Verify category buttons exist
        const categoryButtons = settingsCategories.querySelectorAll('.category-btn');
        const expectedCategories = ['audio', 'gameplay', 'display', 'controls', 'data'];
        
        if (categoryButtons.length !== expectedCategories.length) {
            throw new Error(`Expected ${expectedCategories.length} category buttons, found ${categoryButtons.length}`);
        }
        
        // Verify each expected category exists
        expectedCategories.forEach(category => {
            const button = settingsCategories.querySelector(`[data-category="${category}"]`);
            if (!button) {
                throw new Error(`Category button for '${category}' not found`);
            }
        });
        
        console.log('✅ Settings HTML structure validation passed');
        settingsTestResults.passed++;
    } catch (error) {
        console.log(`❌ Settings HTML structure validation failed: ${error.message}`);
        settingsTestResults.failed++;
        settingsTestResults.errors.push(error.message);
    }
    
    // Test 2: Verify settings panels exist and have correct content
    try {
        const panels = ['audio-settings', 'gameplay-settings', 'display-settings', 'controls-settings', 'data-settings'];
        
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId);
            if (!panel) {
                throw new Error(`Settings panel '${panelId}' not found`);
            }
            
            // Verify panel has setting items
            const settingItems = panel.querySelectorAll('.setting-item, .setting-group');
            if (settingItems.length === 0) {
                throw new Error(`Settings panel '${panelId}' has no setting items`);
            }
        });
        
        // Verify specific important settings exist
        const criticalSettings = [
            'master-volume-slider',
            'music-volume-slider',
            'difficulty-select',
            'auto-save-toggle',
            'theme-select',
            'ui-scale-slider'
        ];
        
        criticalSettings.forEach(settingId => {
            const element = document.getElementById(settingId);
            if (!element) {
                throw new Error(`Critical setting '${settingId}' not found`);
            }
        });
        
        console.log('✅ Settings panels validation passed');
        settingsTestResults.passed++;
    } catch (error) {
        console.log(`❌ Settings panels validation failed: ${error.message}`);
        settingsTestResults.failed++;
        settingsTestResults.errors.push(error.message);
    }
    
    // Test 3: Verify key binding buttons exist
    try {
        const keyBindingButtons = document.querySelectorAll('.key-bind-btn');
        const expectedBindings = ['menu', 'inventory', 'map', 'monsters'];
        
        if (keyBindingButtons.length < expectedBindings.length) {
            throw new Error(`Expected at least ${expectedBindings.length} key binding buttons, found ${keyBindingButtons.length}`);
        }
        
        expectedBindings.forEach(binding => {
            const button = document.querySelector(`[data-action="${binding}"]`);
            if (!button || !button.classList.contains('key-bind-btn')) {
                throw new Error(`Key binding button for '${binding}' not found`);
            }
        });
        
        console.log('✅ Key binding buttons validation passed');
        settingsTestResults.passed++;
    } catch (error) {
        console.log(`❌ Key binding buttons validation failed: ${error.message}`);
        settingsTestResults.failed++;
        settingsTestResults.errors.push(error.message);
    }
    
    // Test 4: Verify data management buttons exist
    try {
        const dataButtons = [
            'export-save-btn',
            'import-save-btn',
            'clear-save-btn',
            'reset-settings-btn'
        ];
        
        dataButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (!button) {
                throw new Error(`Data management button '${buttonId}' not found`);
            }
        });
        
        console.log('✅ Data management buttons validation passed');
        settingsTestResults.passed++;
    } catch (error) {
        console.log(`❌ Data management buttons validation failed: ${error.message}`);
        settingsTestResults.failed++;
        settingsTestResults.errors.push(error.message);
    }
    
    // Test 5: Verify CSS classes and styling
    try {
        const settingsScreen = document.getElementById('settings-screen');
        
        // Check if settings-specific CSS classes are applied
        const requiredClasses = [
            '.settings-categories',
            '.category-btn',
            '.settings-content',
            '.settings-panel',
            '.setting-item',
            '.toggle-switch',
            '.custom-slider',
            '.key-bind-btn'
        ];
        
        requiredClasses.forEach(className => {
            const elements = document.querySelectorAll(className);
            if (elements.length === 0) {
                throw new Error(`No elements found with class '${className}'`);
            }
        });
        
        // Verify active category styling
        const activeCategory = document.querySelector('.category-btn.active');
        if (!activeCategory) {
            throw new Error('No active category button found');
        }
        
        console.log('✅ CSS classes and styling validation passed');
        settingsTestResults.passed++;
    } catch (error) {
        console.log(`❌ CSS classes and styling validation failed: ${error.message}`);
        settingsTestResults.failed++;
        settingsTestResults.errors.push(error.message);
    }
    
    // Test 6: Test GameState settings structure (if available)
    try {
        if (typeof SawyersRPG !== 'undefined') {
            // Create a temporary game instance to check GameState
            const tempCanvas = document.createElement('canvas');
            const tempGame = new SawyersRPG(tempCanvas);
            const gameState = tempGame.getGameState();
            
            if (!gameState || !gameState.settings) {
                throw new Error('GameState settings not found');
            }
            
            // Verify critical settings properties exist
            const requiredSettings = [
                'masterVolume',
                'musicVolume',
                'difficulty',
                'autoSave',
                'theme',
                'uiScale',
                'keyBindings'
            ];
            
            requiredSettings.forEach(setting => {
                if (!(setting in gameState.settings)) {
                    throw new Error(`Required setting '${setting}' not found in GameState`);
                }
            });
            
            // Verify keyBindings structure
            if (typeof gameState.settings.keyBindings !== 'object') {
                throw new Error('keyBindings should be an object');
            }
            
            const requiredKeyBindings = ['menu', 'inventory', 'map', 'monsters'];
            requiredKeyBindings.forEach(binding => {
                if (!(binding in gameState.settings.keyBindings)) {
                    throw new Error(`Required key binding '${binding}' not found`);
                }
            });
            
            console.log('✅ GameState settings structure validation passed');
            settingsTestResults.passed++;
        } else {
            console.log('⚠️ SawyersRPG not available, skipping GameState validation');
        }
    } catch (error) {
        console.log(`❌ GameState settings structure validation failed: ${error.message}`);
        settingsTestResults.failed++;
        settingsTestResults.errors.push(error.message);
    }
    
    // Test 7: Verify UI methods exist (if UI manager is available)
    try {
        if (typeof SawyersRPG !== 'undefined') {
            const tempCanvas = document.createElement('canvas');
            const tempGame = new SawyersRPG(tempCanvas);
            const uiManager = tempGame.ui;
            
            if (!uiManager) {
                throw new Error('UI Manager not found');
            }
            
            // Check for required settings methods
            const requiredMethods = [
                'initializeSettings',
                'switchSettingsCategory',
                'updateSettingsFromGameState',
                'startKeyBinding',
                'exportSaveData',
                'importSaveData',
                'clearSaveData',
                'resetSettings'
            ];
            
            requiredMethods.forEach(method => {
                if (typeof uiManager[method] !== 'function') {
                    throw new Error(`Required UI method '${method}' not found or not a function`);
                }
            });
            
            console.log('✅ UI Manager settings methods validation passed');
            settingsTestResults.passed++;
        } else {
            console.log('⚠️ SawyersRPG not available, skipping UI methods validation');
        }
    } catch (error) {
        console.log(`❌ UI Manager settings methods validation failed: ${error.message}`);
        settingsTestResults.failed++;
        settingsTestResults.errors.push(error.message);
    }
    
    // Display final results
    console.log('\n🔧 Settings Interface Validation Results:');
    console.log(`✅ Passed: ${settingsTestResults.passed}`);
    console.log(`❌ Failed: ${settingsTestResults.failed}`);
    console.log(`📊 Total: ${settingsTestResults.passed + settingsTestResults.failed}`);
    
    if (settingsTestResults.failed > 0) {
        console.log('\n🔍 Error Details:');
        settingsTestResults.errors.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
        });
    }
    
    if (settingsTestResults.failed === 0) {
        console.log('\n🎉 All settings interface validations passed! The comprehensive settings system is ready for use.');
    } else {
        console.log(`\n⚠️ ${settingsTestResults.failed} validation(s) failed. Please review the implementation.`);
    }
    
    return settingsTestResults;
}

// Auto-run validation when loaded
if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', validateSettingsInterface);
} else if (typeof document !== 'undefined') {
    // If document is already loaded, run immediately
    setTimeout(validateSettingsInterface, 100);
}

// Export for manual testing
if (typeof window !== 'undefined') {
    window.validateSettingsInterface = validateSettingsInterface;
}