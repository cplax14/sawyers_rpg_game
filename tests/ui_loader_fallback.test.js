/**
 * UI Module Loader Fallback Tests
 * Ensures partial preloads do not throw and only present modules are initialized
 */

describe('UIModuleLoader Fallback Initialization', () => {
    let originals = {};

    beforeAll(() => {
        // Preserve originals so we can restore after tests
        const names = ['UIHelpers', 'MenuUI', 'GameWorldUI', 'CombatUI', 'MonsterUI', 'InventoryUI', 'SettingsUI', 'StoryUI'];
        names.forEach(n => { originals[n] = window[n]; });
    });

    afterAll(() => {
        // Restore originals
        Object.entries(originals).forEach(([k, v]) => { window[k] = v; });
    });

    it('checkPreloaded returns false if some classes are missing', () => {
        // Ensure at least one is missing
        const prevMenu = window.MenuUI;
        window.MenuUI = undefined;
        const strategy = UIModuleLoader.createFallbackStrategy();
        const ok = strategy.checkPreloaded();
        assertEqual(ok, false, 'checkPreloaded should return false when modules are missing');
        // Restore
        window.MenuUI = prevMenu;
    });

    it('initializeFromPreloaded skips missing modules and does not throw', () => {
        // Provide minimal safe stubs for two modules we want present
        class StubUIHelpers {
            constructor() {}
            init() { /* no-op */ }
        }
        class StubMonsterUI {
            constructor(uiManager, options) {
                this.name = 'MonsterUI';
                this.uiManager = uiManager;
                this.options = options || {};
                this.isInitialized = false;
                this.isVisible = false;
            }
            init() { this.isInitialized = true; }
        }

        // Override globals: Only these two are present
        window.UIHelpers = StubUIHelpers;
        window.MonsterUI = StubMonsterUI;
        window.MenuUI = undefined;
        window.GameWorldUI = undefined;
        window.CombatUI = undefined;
        window.InventoryUI = undefined;
        window.SettingsUI = undefined;
        window.StoryUI = undefined;

        const registered = [];
        const mockUIManager = {
            registerModule: (name, mod) => { registered.push(name); return mod; },
            // minimal fields used by modules (none for stubs)
        };

        const strategy = UIModuleLoader.createFallbackStrategy();
        // Should not throw
        const loader = strategy.initializeFromPreloaded(mockUIManager);
        assertTruthy(loader, 'Loader should be returned');

        // Only the present classes should be initialized/registered
        assertTruthy(registered.includes('UIHelpers'), 'UIHelpers should be initialized when present');
        assertTruthy(registered.includes('MonsterUI'), 'MonsterUI should be initialized when present');
        assertFalsy(registered.includes('InventoryUI'), 'Missing modules should not be initialized');
        assertFalsy(registered.includes('SettingsUI'), 'Missing modules should not be initialized');
    });
});
