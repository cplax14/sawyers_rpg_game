/**
 * Save System - Task 8.0 Implementation
 * LocalStorage-based saves with versioned schema and basic export/import.
 */

const SaveSystem = {
    VERSION: '1.0.0',
    SAVE_KEY: 'sawyers_rpg_save',
    AUTOSAVE_KEY: 'sawyers_rpg_autosave',

    init() {
        console.log('✅ SaveSystem initialized');
        return true;
    },

    // Build a versioned save object from GameState
    serialize(gs) {
        if (!gs) return null;
        const safeClone = (obj) => JSON.parse(JSON.stringify(obj || {}));
        const save = {
            version: this.VERSION,
            timestamp: Date.now(),
            player: safeClone(gs.player),
            world: safeClone(gs.world),
            monsters: safeClone(gs.monsters),
            settings: safeClone(gs.settings),
            meta: {
                scene: gs.currentScene || null
            }
        };
        return save;
    },

    // Apply a save object to GameState
    applyToGame(save) {
        try {
            if (!save) return false;
            const game = window.SawyersRPG;
            const gs = game?.getGameState ? game.getGameState() : null;
            if (!gs) return false;
            if (typeof gs.loadFromSave === 'function') {
                gs.loadFromSave(save);
            } else {
                // Direct assignment fallback (non-destructive)
                if (save.player) gs.player = Object.assign(gs.player || {}, save.player);
                if (save.world) gs.world = Object.assign(gs.world || {}, save.world);
                if (save.monsters) gs.monsters = Object.assign(gs.monsters || {}, save.monsters);
                if (save.settings) gs.settings = Object.assign(gs.settings || {}, save.settings);
                if (save.meta?.scene && game?.getUI?.()) {
                    try { game.getUI().showScene(save.meta.scene); } catch (e) {}
                }
            }
            return true;
        } catch (e) {
            console.warn('Failed to apply save:', e);
            return false;
        }
    },

    // Save to localStorage
    saveGame() {
        try {
            const gs = window.SawyersRPG?.getGameState?.();
            const save = this.serialize(gs);
            if (!save) return false;
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(save));
            console.log('💾 Game saved');
            return true;
        } catch (error) {
            console.warn('Save failed:', error);
            return false;
        }
    },

    // Load from localStorage and apply
    loadGame() {
        try {
            const raw = localStorage.getItem(this.SAVE_KEY);
            if (!raw) return false;
            const save = JSON.parse(raw);
            // TODO: handle migrations by version
            const ok = this.applyToGame(save);
            return !!ok;
        } catch (error) {
            console.warn('Load failed:', error);
            return false;
        }
    },

    // Auto-save helpers
    hasAutoSave() {
        try { return !!localStorage.getItem(this.AUTOSAVE_KEY); } catch { return false; }
    },

    loadAutoSave() {
        try {
            const raw = localStorage.getItem(this.AUTOSAVE_KEY);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    },

    autoSave() {
        try {
            const gs = window.SawyersRPG?.getGameState?.();
            const save = this.serialize(gs);
            if (!save) return false;
            localStorage.setItem(this.AUTOSAVE_KEY, JSON.stringify(save));
            console.log('📝 Auto-saved');
            return true;
        } catch (e) {
            console.warn('Auto-save failed:', e);
            return false;
        }
    },

    // Export current save to a file
    exportSave() {
        const raw = localStorage.getItem(this.SAVE_KEY);
        if (!raw) return false;
        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sawyers_rpg_save.json';
        a.click();
        URL.revokeObjectURL(url);
        return true;
    },

    // Import a save file and apply
    async importSave(file) {
        try {
            const text = await file.text();
            const save = JSON.parse(text);
            // Basic validation
            if (!save || !save.version || !save.player) throw new Error('Invalid save file');
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(save));
            return this.applyToGame(save);
        } catch (e) {
            console.warn('Import failed:', e);
            return false;
        }
    }
};

// Make available globally
window.SaveSystem = SaveSystem;