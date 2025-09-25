/**
 * SettingsUI Module (minimal)
 * Handles settings screen interactions. Designed to be resilient to missing DOM in tests.
 */
class SettingsUI extends BaseUIModule {
  constructor(uiManager, options = {}) {
    super('settings', uiManager, options);
  }

  getDefaultOptions() {
    return {
      ...super.getDefaultOptions(),
      persistent: false,
      transition: 'fade'
    };
  }

  init() {
    this.cacheElements();
    this.attachEvents();
    this.setupState();
    this.logDebug('Module settings initialized');
  }

  cacheElements() {
    this.elements = {
      container: document.getElementById('settings') || null,
      categories: document.getElementById('settings-categories') || null,
      content: document.getElementById('settings-content') || null,
      backButton: document.getElementById('back-from-settings') || null,
      importBtn: document.getElementById('settings-import') || null,
      exportBtn: document.getElementById('settings-export') || null,
      keybindButtons: document.querySelectorAll('[data-keybind]') || null,
    };
  }

  attachEvents() {
    const { backButton, categories, importBtn, exportBtn } = this.elements || {};
    if (backButton) {
      this.addEventListener(backButton, 'click', () => {
        if (this.uiManager?.returnToPrevious) this.uiManager.returnToPrevious();
      });
    }
    if (categories) {
      categories.querySelectorAll('[data-category]')?.forEach((btn) => {
        this.addEventListener(btn, 'click', () => this.switchCategory(btn.getAttribute('data-category')));
      });
    }
    if (importBtn) {
      this.addEventListener(importBtn, 'click', () => this.promptImport());
    }
    if (exportBtn) {
      this.addEventListener(exportBtn, 'click', () => this.exportSettings());
    }

    // Bind inputs with data-setting attributes
    try {
      document.querySelectorAll('[data-setting]')?.forEach((input) => {
        const path = input.getAttribute('data-setting');
        // Initialize value from GameState
        const gs = this.getGameState();
        const current = this.getSettingValue(gs?.settings, path);
        if (current != null) this.applyValueToInput(input, current);

        // Listen for changes
        const handler = () => {
          const value = this.readValueFromInput(input);
          const valid = this.validateSetting(path, value);
          if (!valid.ok) {
            this.notify(valid.message || 'Invalid setting value', 'error');
            // Revert input
            this.applyValueToInput(input, this.getSettingValue(gs?.settings, path));
            return;
          }
          this.updateSetting(path, valid.value);
        };
        this.addEventListener(input, 'change', handler);
        this.addEventListener(input, 'input', (e) => {
          if (input.type === 'range') handler(e);
        });
      });
    } catch (_) { /* ignore in minimal DOM */ }

    // Keybinding capture buttons
    try {
      document.querySelectorAll('[data-keybind]')?.forEach((btn) => {
        const action = btn.getAttribute('data-keybind');
        this.addEventListener(btn, 'click', () => this.startKeyCapture(action, btn));
      });
    } catch (_) { /* ignore */ }
  }

  setupState() {
    this.state = { selectedCategory: 'general', capturing: null };
  }

  onShow() {
    if (!this.elements || !this.elements.container) {
      // Lazy init if DOM became available later
      this.cacheElements();
      this.attachEvents();
    }
    this.refreshAll();
  }

  refreshAll() {
    // Sync UI with current settings
    const gs = this.getGameState();
    if (!gs) return;
    try {
      document.querySelectorAll('[data-setting]')?.forEach((input) => {
        const path = input.getAttribute('data-setting');
        const current = this.getSettingValue(gs.settings, path);
        if (current != null) this.applyValueToInput(input, current);
      });
    } catch (_) {}
  }

  // -----------------------------
  // Category switching
  // -----------------------------
  switchCategory(category) {
    if (!category) return;
    this.state.selectedCategory = category;
    try {
      document.querySelectorAll('[data-category]')?.forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === category);
      });
      document.querySelectorAll('[data-category-panel]')?.forEach((panel) => {
        panel.classList.toggle('active', panel.getAttribute('data-category-panel') === category);
      });
    } catch (_) {}
  }

  // -----------------------------
  // Settings binding helpers
  // -----------------------------
  getSettingValue(root, path) {
    if (!root || !path) return null;
    return path.split('.').reduce((obj, key) => (obj ? obj[key] : undefined), root);
  }

  setSettingValue(root, path, value) {
    if (!root || !path) return;
    const parts = path.split('.');
    let obj = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      obj[p] = obj[p] || {};
      obj = obj[p];
    }
    obj[parts[parts.length - 1]] = value;
  }

  applyValueToInput(input, value) {
    try {
      if (input.type === 'checkbox') input.checked = !!value;
      else if (input.type === 'range' || input.type === 'number') input.value = Number(value);
      else input.value = value;
    } catch (_) {}
  }

  readValueFromInput(input) {
    if (input.type === 'checkbox') return !!input.checked;
    if (input.type === 'number' || input.type === 'range') return Number(input.value);
    return input.value;
  }

  validateSetting(path, value) {
    // Known validations
    if (/^masterVolume|musicVolume|sfxVolume|voiceVolume$/.test(path)) {
      const v = Math.min(1, Math.max(0, Number(value)));
      return { ok: true, value: v };
    }
    if (path === 'uiScale') {
      const v = Math.round(Math.min(120, Math.max(80, Number(value))));
      return { ok: true, value: v };
    }
    if (path === 'difficulty') {
      const allowed = ['easy', 'normal', 'hard', 'nightmare'];
      const v = allowed.includes(String(value)) ? String(value) : 'normal';
      return { ok: true, value: v };
    }
    // Default: accept
    return { ok: true, value };
  }

  updateSetting(path, value) {
    const gs = this.getGameState();
    if (!gs) return false;
    this.setSettingValue(gs.settings, path, value);
    this.notify('Setting updated', 'success');
    return true;
  }

  // -----------------------------
  // Keybinding capture
  // -----------------------------
  startKeyCapture(action, buttonEl = null) {
    if (!action) return;
    if (this.state.capturing) return; // already capturing
    this.state.capturing = action;
    const handler = (e) => {
      e.preventDefault();
      const key = e.code || e.key;
      this.finishKeyCapture(action, key, buttonEl);
    };
    this._keyCaptureHandler = handler;
    document.addEventListener('keydown', handler, { once: true });
    this.notify(`Press a key to bind for ${action}...`, 'info');
  }

  finishKeyCapture(action, key, buttonEl) {
    const gs = this.getGameState();
    this.state.capturing = null;
    if (!gs) return;
    gs.settings.keyBindings = gs.settings.keyBindings || {};
    // Prevent conflicts: clear any existing assignment of this key
    for (const [act, k] of Object.entries(gs.settings.keyBindings)) {
      if (k === key && act !== action) {
        gs.settings.keyBindings[act] = null;
      }
    }
    gs.settings.keyBindings[action] = key;
    if (buttonEl) {
      try { buttonEl.textContent = key; } catch (_) {}
    }
    this.notify(`Bound ${action} to ${key}`, 'success');
  }

  // -----------------------------
  // Import/Export
  // -----------------------------
  exportSettings() {
    const gs = this.getGameState();
    if (!gs) return;
    try {
      const json = JSON.stringify(gs.settings, null, 2);
      // Attempt to copy to clipboard if available
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(json).then(() => this.notify('Settings copied to clipboard', 'success'));
      } else {
        this.notify('Copy unavailable; settings printed to console', 'warning');
        console.log('Exported settings:', json);
      }
    } catch (e) {
      this.notify('Failed to export settings', 'error');
    }
  }

  promptImport() {
    // Minimal prompt-based import for tests/dev
    try {
      const input = window.prompt?.('Paste settings JSON');
      if (!input) return;
      const parsed = JSON.parse(input);
      this.importSettings(parsed);
    } catch (e) {
      this.notify('Invalid JSON', 'error');
    }
  }

  importSettings(obj) {
    const gs = this.getGameState();
    if (!gs || !obj || typeof obj !== 'object') return false;
    // Shallow-merge known sections to be safe
    const allowedKeys = ['masterVolume','musicVolume','sfxVolume','voiceVolume','difficulty','autoSave','autoSaveInterval','battleAnimations','skipIntro','monsterNotifications','theme','uiScale','showFPS','reduceMotion','highContrast','keyboardShortcuts','mouseSensitivity','keyBindings'];
    for (const k of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        const res = this.validateSetting(k, obj[k]);
        this.setSettingValue(gs.settings, k, res.value);
      }
    }
    this.notify('Settings imported', 'success');
    this.refreshAll();
    return true;
  }

  // -----------------------------
  // Utilities
  // -----------------------------
  notify(message, type = 'info') {
    try {
      if (this.uiManager?.showNotification) return this.uiManager.showNotification(message, type);
      if (window.uiHelpers?.notify) return window.uiHelpers.notify(message, type);
    } catch (_) {}
    console.log(`[${type}] ${message}`);
  }

  logDebug(msg) {
    if (this.uiManager?.config?.debugMode) console.log(`✅ ${msg}`);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsUI;
} else if (typeof window !== 'undefined') {
  window.SettingsUI = SettingsUI;
}
