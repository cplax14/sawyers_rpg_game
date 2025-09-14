/**
 * Save System - Task 8.0 Implementation
 * LocalStorage-based saves with versioned schema and basic export/import.
 */

const SaveSystem = {
    VERSION: '1.0.0',
    SAVE_KEY: 'sawyers_rpg_save',
    AUTOSAVE_KEY: 'sawyers_rpg_autosave',
    lastError: null,

    init() {
        console.log('✅ SaveSystem initialized');
        return true;
    },

    // Light-weight schema validation
    validateSaveData(save) {
        this.lastError = null;
        try {
            if (!save || typeof save !== 'object') throw new Error('Save is not an object');
            if (typeof save.version !== 'string') throw new Error('Missing version');
            if (typeof save.timestamp !== 'number') throw new Error('Missing timestamp');
            if (!save.player || typeof save.player !== 'object') throw new Error('Missing player');
            if (!save.world || typeof save.world !== 'object') throw new Error('Missing world');
            if (!save.monsters || typeof save.monsters !== 'object') throw new Error('Missing monsters');
            if (!save.settings || typeof save.settings !== 'object') throw new Error('Missing settings');
            if (save.meta && typeof save.meta !== 'object') throw new Error('Bad meta block');
            if (save.meta?.scene && typeof save.meta.scene !== 'string') throw new Error('Bad meta.scene');
            return true;
        } catch (e) {
            this.lastError = e?.message || String(e);
            return false;
        }
    },

    // Migration stub for future versions
    migrateIfNeeded(save) {
        try {
            if (!save || typeof save !== 'object') return save;
            const ver = String(save.version || '0.0.0');
            // Future: if (semverLt(ver, '1.0.0')) { ... }
            return save;
        } catch {
            return save;
        }
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
            const parsed = JSON.parse(raw);
            const save = this.migrateIfNeeded(parsed);
            if (!this.validateSaveData(save)) {
                console.warn('Load validation failed:', this.lastError);
                return false;
            }
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
        if (!raw) {
            this.lastError = 'No manual save found to export';
            return false;
        }
        const blob = new Blob([raw], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sawyers_rpg_save.json';
        a.click();
        URL.revokeObjectURL(url);
        return true;
    },

    // Emit a JSON schema-like description of the save structure for debugging
    exportSchema() {
        try {
            const schema = {
                $schema: 'https://json-schema.org/draft/2020-12/schema',
                title: 'Sawyers RPG Save Schema',
                type: 'object',
                required: ['version', 'timestamp', 'player', 'world', 'monsters', 'settings'],
                properties: {
                    version: { type: 'string' },
                    timestamp: { type: 'number', description: 'ms since epoch' },
                    player: { type: 'object' },
                    world: { type: 'object' },
                    monsters: { type: 'object' },
                    settings: { type: 'object' },
                    meta: {
                        type: 'object',
                        properties: { scene: { type: ['string', 'null'] } },
                        additionalProperties: true
                    }
                },
                additionalProperties: true
            };
            const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sawyers_rpg_save_schema.json';
            a.click();
            URL.revokeObjectURL(url);
            return true;
        } catch (e) {
            this.lastError = e?.message || String(e);
            return false;
        }
    },

    // Import a save file and apply
    async importSave(file) {
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            const save = this.migrateIfNeeded(parsed);
            if (!this.validateSaveData(save)) {
                throw new Error(this.lastError || 'Invalid save file');
            }
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(save));
            return this.applyToGame(save);
        } catch (e) {
            console.warn('Import failed:', e);
            this.lastError = e?.message || String(e);
            return false;
        }
    }
};

// Make available globally
window.SaveSystem = SaveSystem;