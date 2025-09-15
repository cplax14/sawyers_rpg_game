/**
 * UI Manager
 * Handles scene management, UI interactions, and screen transitions
 */

class UIManager {
    constructor(game) {
        this.game = game;
        this.scenes = {};
        this.currentScene = null;
        this.previousScene = null;
        this.transitionState = {
            active: false,
            duration: 0.3,
            elapsed: 0,
            type: 'fade'
        };
        
        // UI state
        this.selectedElements = new Map();
        this.menuStack = [];
        this.dialogueQueue = [];
        this.worldMapOverlay = null;
        this.worldMapButtons = [];
        this.worldMapIndex = 0;
        this.worldMapKeyHandler = null;
        this.storyState = null;
        
        this.init();
    }

    // ===============================
    // STORY MVP
    // ===============================
    attachStoryUI() {
        this.storyState = { eventName: null, index: 0, queue: [], choices: [] };
        const nextBtn = document.getElementById('story-next');
        const closeBtn = document.getElementById('story-close');
        const backdrop = document.querySelector('#story-modal .modal-backdrop');
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStoryLine());
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeStory());
        if (backdrop) backdrop.addEventListener('click', () => this.closeStory());
    }

    triggerStoryEventIfAvailable(areaId) {
        if (typeof StoryData === 'undefined' || !window.GameState) return;
        const flags = window.GameState.world?.storyFlags || [];
        const completed = window.GameState.world?.completedEvents || [];
        const events = (StoryData.getAreaEvents(areaId, flags) || [])
            .filter(e => !completed.includes(e));
        // Avoid opening if modal already visible
        const modal = document.getElementById('story-modal');
        const isOpen = modal && !modal.classList.contains('hidden');
        if (!isOpen && events.length > 0) {
            this.showStoryEvent(events[0]);
        }
    }

    showStoryEvent(eventName) {
        if (typeof StoryData === 'undefined') return;
        const event = StoryData.getEvent(eventName);
        if (!event) return;
        const modal = document.getElementById('story-modal');
        if (!modal) return;
        // Build dialogue queue
        const gs = this.game?.getGameState ? this.game.getGameState() : null;
        const playerFlags = gs?.world?.storyFlags || [];
        const path = gs?.world?.currentStoryPath || null;
        const base = event.dialogue || [];
        const lines = (typeof StoryData.generateDynamicDialogue === 'function')
            ? StoryData.generateDynamicDialogue(base, playerFlags, path)
            : base;
        this.storyState = { eventName, index: 0, queue: lines, choices: event.choices || [] };
        // UI
        const title = document.getElementById('story-title');
        if (title) title.textContent = event.name || 'Story';
        modal.classList.remove('hidden');
        this.renderStoryLine();
    }

    renderStoryLine() {
        const { index, queue, choices } = this.storyState || {};
        const speakerEl = document.getElementById('story-speaker');
        const textEl = document.getElementById('story-text');
        const nextBtn = document.getElementById('story-next');
        const choicesEl = document.getElementById('story-choices');
        if (!textEl || !nextBtn || !choicesEl) return;
        // Hide choices while lines remain
        choicesEl.classList.add('hidden');
        choicesEl.innerHTML = '';
        if (index < (queue?.length || 0)) {
            const line = queue[index];
            if (speakerEl) speakerEl.textContent = line?.speaker || '';
            textEl.textContent = line?.text || '';
            nextBtn.disabled = false;
            nextBtn.classList.remove('hidden');
        } else if ((choices && choices.length) > 0) {
            // Show choices
            this.showStoryChoices(choices);
        } else {
            // No choices -> allow close
            if (speakerEl) speakerEl.textContent = '';
            textEl.textContent = '';
            nextBtn.disabled = true;
            nextBtn.classList.add('hidden');
            // Auto-complete with default outcome if defined
            this.chooseStoryOutcome('default');
        }
    }

    nextStoryLine() {
        if (!this.storyState) return;
        this.storyState.index++;
        this.renderStoryLine();
    }

    showStoryChoices(choices) {
        const choicesEl = document.getElementById('story-choices');
        const nextBtn = document.getElementById('story-next');
        if (!choicesEl) return;
        choicesEl.classList.remove('hidden');
        if (nextBtn) nextBtn.classList.add('hidden');
        choicesEl.innerHTML = '';
        choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'btn secondary choice-btn';
            btn.textContent = choice.text || 'Choose';
            btn.addEventListener('click', () => this.chooseStoryOutcome(choice.outcome));
            choicesEl.appendChild(btn);
        });
    }

    chooseStoryOutcome(outcomeKey) {
        if (!this.storyState || typeof StoryData === 'undefined') return;
        const eventName = this.storyState.eventName;
        const gs = this.game?.getGameState ? this.game.getGameState() : null;
        if (gs && typeof gs.processStoryChoice === 'function') {
            const outcome = gs.processStoryChoice(eventName, outcomeKey);
            // Mark event completed via story flag to satisfy StoryData.getAreaEvents check
            try { gs.addStoryFlag(`${eventName}_completed`); } catch {}
            // Outcome summary toast
            try {
                const parts = [];
                if (Array.isArray(outcome?.storyFlags) && outcome.storyFlags.length) {
                    parts.push(`Flags: ${outcome.storyFlags.join(', ')}`);
                }
                if (Array.isArray(outcome?.unlockAreas) && outcome.unlockAreas.length) {
                    parts.push(`Areas: ${outcome.unlockAreas.join(', ')}`);
                }
                if (Array.isArray(outcome?.items) && outcome.items.length) {
                    parts.push(`Items: ${outcome.items.join(', ')}`);
                }
                if (parts.length) this.showNotification(`Story outcome → ${parts.join(' | ')}`);
            } catch {}
            if (outcome?.dialogue && outcome.dialogue.length > 0) {
                // Show outcome dialogue briefly
                this.storyState.queue = outcome.dialogue;
                this.storyState.index = 0;
                this.storyState.choices = [];
                this.renderStoryLine();
            } else {
                this.closeStory();
            }
            // Auto-save after story progression
            try { window.SaveSystem?.autoSave?.(); } catch {}
        } else {
            this.closeStory();
        }
    }

    closeStory() {
        const modal = document.getElementById('story-modal');
        if (modal) modal.classList.add('hidden');
        this.storyState = null;
    }
    
    /**
     * Initialize the UI system
     */
    init() {
        this.setupScenes();
        this.attachEventListeners();
        // Prepare world map overlay early so tests can find it
        this.ensureWorldMapOverlay();
        this.showScene('main_menu');
        
        console.log('✅ UIManager initialized');
    }
    
    /**
     * Set up all game scenes
     */
    setupScenes() {
        // Main Menu Scene
        this.scenes.main_menu = new Scene('main_menu', {
            element: document.getElementById('main-menu'),
            type: 'menu',
            buttons: [
                { id: 'new-game-btn', action: 'startNewGame' },
                { id: 'load-game-btn', action: 'loadGame' },
                { id: 'settings-btn', action: 'showSettings' }
            ]
        });
        
        // Character Selection Scene
        this.scenes.character_select = new Scene('character_select', {
            element: document.getElementById('character-select'),
            type: 'selection',
            selectableItems: '.class-card',
            confirmButton: 'start-adventure-btn'
        });
        
        // Game World Scene
        this.scenes.game_world = new Scene('game_world', {
            element: document.getElementById('game-world'),
            type: 'game',
            overlay: true
        });
        
        // Combat Scene
        this.scenes.combat = new Scene('combat', {
            element: document.getElementById('combat'),
            type: 'combat',
            overlay: true
        });
        
        // Monster Management Scene
        this.scenes.monster_management = new Scene('monster_management', {
            element: document.getElementById('monster-management'),
            type: 'menu',
            overlay: true
        });
        
        // Inventory Scene
        this.scenes.inventory = new Scene('inventory', {
            element: document.getElementById('inventory'),
            type: 'menu',
            overlay: true
        });
        
        // Settings Scene
        this.scenes.settings = new Scene('settings', {
            element: document.getElementById('settings'),
            type: 'menu',
            buttons: [
                { id: 'back-to-menu-btn', action: 'returnToPrevious' }
            ]
        });
        
        console.log(`📺 ${Object.keys(this.scenes).length} scenes registered`);
    }
    
    /**
     * Attach event listeners to UI elements
     */
    attachEventListeners() {
        // Main menu buttons
        this.attachButton('new-game-btn', () => this.startNewGame());
        this.attachButton('load-game-btn', () => this.loadGame());
        this.attachButton('settings-btn', () => this.showScene('settings'));
        
        // Character selection
        this.attachCharacterSelection();
        this.attachButton('start-adventure-btn', () => this.startAdventure());
        
        // Settings
        this.attachButton('back-to-menu-btn', () => this.returnToPrevious());
        this.attachSettings();
        // Story UI
        if (typeof this.attachStoryUI === 'function') this.attachStoryUI();
        
        // Inventory
        this.attachButton('back-from-inventory', () => this.returnToPrevious());
        
        // Game HUD buttons
        this.attachButton('world-map-btn', () => this.showWorldMap());
        this.attachButton('monsters-btn', () => this.showScene('monster_management'));
        this.attachButton('inventory-btn', () => this.showScene('inventory'));
        this.attachButton('save-game-btn', () => this.saveGame());
        // Minimal breeding integration (if button exists)
        this.attachButton('breed-btn', () => this.promptBreeding());
        
        // Combat interface buttons
        this.attachCombatInterface();
        
        // Character selection interface
        this.attachCharacterSelection();
        
        // Monster management interface - moved to MonsterUI module
        
        // World map interface
        this.attachWorldMapInterface();
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleGlobalKeys(e));

        // Resilient delegation for main menu buttons (in case early bind fails)
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#new-game-btn, #load-game-btn, #settings-btn');
            if (!btn) return;
            switch (btn.id) {
                case 'new-game-btn':
                    this.startNewGame();
                    break;
                case 'load-game-btn':
                    this.loadGame();
                    break;
                case 'settings-btn':
                    this.showScene('settings');
                    break;
            }
        });
    }

    /** Ensure world map overlay exists in DOM */
    ensureWorldMapOverlay() {
        // Check our stored reference first, then DOM, prioritizing consistency
        let overlay = this.worldMapOverlay;
        
        if (!overlay) {
            // Try to find existing overlay in DOM
            overlay = document.getElementById('world-map-overlay');
        }
        
        if (!overlay) {
            // Create new overlay
            overlay = document.createElement('div');
            overlay.id = 'world-map-overlay';
        }
        
        // Ensure proper styling regardless of how the overlay was created
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.right = '0';
        overlay.style.bottom = '0';
        overlay.style.background = 'rgba(0,0,0,0.7)';
        overlay.style.display = overlay.style.display || 'none';
        overlay.style.zIndex = '9999';
        // Build panel and list if missing
        let panel = overlay.querySelector('[data-role="world-map-panel"]');
        let list = overlay.querySelector('#world-map-list');
        if (!panel) {
            panel = document.createElement('div');
            panel.setAttribute('data-role', 'world-map-panel');
            panel.style.position = 'absolute';
            panel.style.top = '50%';
            panel.style.left = '50%';
            panel.style.transform = 'translate(-50%, -50%)';
            panel.style.width = '420px';
            panel.style.maxHeight = '70vh';
            panel.style.overflowY = 'auto';
            panel.style.background = '#1f2937';
            panel.style.border = '1px solid #374151';
            panel.style.borderRadius = '8px';
            panel.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
            panel.style.padding = '16px';
            panel.style.color = '#e5e7eb';

            const header = document.createElement('div');
            header.textContent = 'World Map - Select an Area';
            header.style.fontSize = '18px';
            header.style.marginBottom = '10px';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';

            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✕';
            closeBtn.style.background = '#374151';
            closeBtn.style.color = '#e5e7eb';
            closeBtn.style.border = 'none';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.padding = '4px 8px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.addEventListener('click', () => this.closeWorldMapOverlay());
            header.appendChild(closeBtn);

            list = document.createElement('div');
            list.id = 'world-map-list';
            list.style.display = 'grid';
            list.style.gridTemplateColumns = '1fr';
            list.style.gap = '8px';

            const footer = document.createElement('div');
            footer.style.marginTop = '10px';
            footer.style.fontSize = '12px';
            footer.style.color = '#9ca3af';
            footer.textContent = 'Only connected and unlocked areas are available.';

            panel.appendChild(header);
            panel.appendChild(list);
            panel.appendChild(footer);
            overlay.appendChild(panel);
        }
        // Append overlay to DOM if not already attached
        if (!overlay.parentElement) {
            const parent = document.body || document.documentElement;
            if (parent && parent.appendChild) {
                try {
                    parent.appendChild(overlay);
                } catch (e) {
                    console.warn('Failed to append world map overlay to DOM:', e);
                }
            }
        }
        
        // Only add event listener if not already added to avoid duplicates
        if (!overlay.hasAttribute('data-click-handler-added')) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.closeWorldMapOverlay();
            });
            overlay.setAttribute('data-click-handler-added', 'true');
        }
        
        this.worldMapOverlay = overlay;
        return overlay;
    }

    /** Ensure the inner list element exists and return it */
    getOrCreateWorldMapList() {
        this.ensureWorldMapOverlay();
        let list = this.worldMapOverlay.querySelector('#world-map-list');
        if (!list) {
            // Rebuild inner structure if somehow missing
            // Remove existing panel nodes if any inconsistent
            const existingPanel = this.worldMapOverlay.querySelector('[data-role="world-map-panel"]');
            if (existingPanel) existingPanel.remove();
            // Recreate panel fully
            let overlay = this.worldMapOverlay;
            const panel = document.createElement('div');
            panel.setAttribute('data-role', 'world-map-panel');
            panel.style.position = 'absolute';
            panel.style.top = '50%';
            panel.style.left = '50%';
            panel.style.transform = 'translate(-50%, -50%)';
            panel.style.width = '420px';
            panel.style.maxHeight = '70vh';
            panel.style.overflowY = 'auto';
            panel.style.background = '#1f2937';
            panel.style.border = '1px solid #374151';
            panel.style.borderRadius = '8px';
            panel.style.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
            panel.style.padding = '16px';
            panel.style.color = '#e5e7eb';

            const header = document.createElement('div');
            header.textContent = 'World Map - Select an Area';
            header.style.fontSize = '18px';
            header.style.marginBottom = '10px';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✕';
            closeBtn.style.background = '#374151';
            closeBtn.style.color = '#e5e7eb';
            closeBtn.style.border = 'none';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.padding = '4px 8px';
            closeBtn.style.cursor = 'pointer';
            closeBtn.addEventListener('click', () => this.closeWorldMapOverlay());
            header.appendChild(closeBtn);

            list = document.createElement('div');
            list.id = 'world-map-list';
            list.style.display = 'grid';
            list.style.gridTemplateColumns = '1fr';
            list.style.gap = '8px';

            const footer = document.createElement('div');
            footer.style.marginTop = '10px';
            footer.style.fontSize = '12px';
            footer.style.color = '#9ca3af';
            footer.textContent = 'Only connected and unlocked areas are available.';

            panel.appendChild(header);
            panel.appendChild(list);
            panel.appendChild(footer);
            overlay.appendChild(panel);
        }
        return list;
    }

    /** Populate world map list with unlocked areas as buttons */
    populateWorldMapAreas() {
        const gs = this.game.getGameState();
        if (!gs || typeof AreaData === 'undefined') return;
        const list = this.getOrCreateWorldMapList();
        list.innerHTML = '';
        this.worldMapButtons = [];
        const unlocked = AreaData.getUnlockedAreas(
            gs.world.storyFlags,
            gs.player.level,
            Object.keys(gs.player.inventory.items),
            gs.player.class
        );
        const connections = AreaData.getConnectedAreas(gs.world.currentArea) || [];
        // Filter to only connected (plus current area as disabled)
        const candidates = unlocked.filter(a => a === gs.world.currentArea || connections.includes(a));
        candidates.forEach(areaName => {
            const btn = document.createElement('button');
            const area = AreaData.getArea(areaName);
            const displayName = area?.name || areaName;
            const desc = area?.description || '';
            btn.innerHTML = `<div style="font-weight:600">${displayName}${areaName === gs.world.currentArea ? ' (current)' : ''}</div>`+
                            `<div style="font-size:12px;color:#9ca3af;margin-top:2px">${desc}</div>`;
            btn.style.textAlign = 'left';
            btn.style.background = areaName === gs.world.currentArea ? '#111827' : '#374151';
            btn.style.color = '#e5e7eb';
            btn.style.border = '1px solid #4b5563';
            btn.style.borderRadius = '6px';
            btn.style.padding = '10px';
            btn.style.cursor = areaName === gs.world.currentArea ? 'default' : 'pointer';
            btn.disabled = areaName === gs.world.currentArea;
            btn.setAttribute('data-area', areaName);
            btn.tabIndex = 0;
            btn.addEventListener('click', () => {
                if (areaName !== gs.world.currentArea) {
                    const ok = gs.travelToArea(areaName);
                    if (ok) this.showNotification(`Traveled to ${areaName}`, 'success');
                    this.closeWorldMapOverlay();
                }
            });
            list.appendChild(btn);
            this.worldMapButtons.push(btn);
        });
    }

    openWorldMapOverlay() {
        this.ensureWorldMapOverlay();
        // Ensure list exists before populating
        this.getOrCreateWorldMapList();
        this.populateWorldMapAreas();
        
        if (this.worldMapOverlay) {
            this.worldMapOverlay.style.display = 'block';
            this.worldMapOverlay.setAttribute('aria-hidden', 'false');
            
            // Focus handling: focus first enabled button
            this.worldMapIndex = 0;
            if (this.worldMapButtons.length > 0) {
                // find first non-disabled
                const idx = this.worldMapButtons.findIndex(b => !b.disabled);
                this.worldMapIndex = idx >= 0 ? idx : 0;
                this.focusWorldMapIndex();
            }
            
            // Keyboard navigation - avoid duplicate listeners
            if (!this.worldMapKeyHandler) {
                this.worldMapKeyHandler = (e) => this.handleWorldMapKeys(e);
                document.addEventListener('keydown', this.worldMapKeyHandler);
            }
        }
    }

    closeWorldMapOverlay() {
        if (this.worldMapOverlay) {
            this.worldMapOverlay.style.display = 'none';
            this.worldMapOverlay.setAttribute('aria-hidden', 'true');
        }
        if (this.worldMapKeyHandler) {
            document.removeEventListener('keydown', this.worldMapKeyHandler);
            this.worldMapKeyHandler = null;
        }
    }

    focusWorldMapIndex() {
        const btn = this.worldMapButtons[this.worldMapIndex];
        if (btn && typeof btn.focus === 'function') {
            btn.focus();
            if (typeof btn.scrollIntoView === 'function') {
                btn.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    moveWorldMapSelection(delta) {
        if (!this.worldMapButtons.length) return;
        let next = this.worldMapIndex;
        const count = this.worldMapButtons.length;
        for (let i = 0; i < count; i++) {
            next = (next + delta + count) % count;
            if (!this.worldMapButtons[next].disabled) break;
        }
        this.worldMapIndex = next;
        this.focusWorldMapIndex();
    }

    handleWorldMapKeys(e) {
        if (this.worldMapOverlay && this.worldMapOverlay.style.display !== 'none') {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.moveWorldMapSelection(1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.moveWorldMapSelection(-1);
                    break;
                case 'Enter':
                    e.preventDefault();
                    const btn = this.worldMapButtons[this.worldMapIndex];
                    if (btn && !btn.disabled) btn.click();
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.closeWorldMapOverlay();
                    break;
            }
        }
    }
    
    /**
     * Attach button event listener
     */
    attachButton(buttonId, callback) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', callback);
        } else {
            console.warn(`Button ${buttonId} not found`);
        }
    }
    
    /**
     * Set up character selection interaction
     */
    attachCharacterSelection() {
        const classCards = document.querySelectorAll('.class-card');
        const startButton = document.getElementById('start-adventure-btn');
        let selectedClass = null;
        
        classCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove previous selection
                classCards.forEach(c => c.classList.remove('selected'));
                
                // Select this card
                card.classList.add('selected');
                selectedClass = card.dataset.class;
                
                // Enable start button
                if (startButton) {
                    startButton.disabled = false;
                }
                
                // Store selection
                this.selectedElements.set('character_class', selectedClass);
            });
        });
    }
    
    /**
     * Initialize comprehensive settings interface
     */
    initializeSettings() {
        this.currentSettingsCategory = 'audio';
        this.settingsChanged = false;
        this.keyBindingMode = null;
        
        this.updateSettingsFromGameState();
        this.attachSettingsEventHandlers();
        this.switchSettingsCategory('audio');
    }
    
    /**
     * Update all settings controls from game state
     */
    updateSettingsFromGameState() {
        const gs = this.game.getGameState();
        if (!gs) return;
        
        const settings = gs.settings;
        
        // Audio settings
        this.updateSliderValue('master-volume', settings.masterVolume * 100);
        this.updateSliderValue('music-volume', settings.musicVolume * 100);
        this.updateSliderValue('sfx-volume', settings.sfxVolume * 100);
        this.updateSliderValue('voice-volume', settings.voiceVolume * 100);
        
        // Gameplay settings
        this.updateSelectValue('difficulty-level', settings.difficulty);
        this.updateCheckboxValue('auto-save', settings.autoSave);
        this.updateSelectValue('autosave-interval', settings.autoSaveInterval);
        this.updateCheckboxValue('battle-animations', settings.battleAnimations);
        this.updateCheckboxValue('skip-intro', settings.skipIntro);
        this.updateCheckboxValue('monster-notifications', settings.monsterNotifications);
        
        // Display settings
        this.updateSelectValue('theme', settings.theme);
        this.updateSliderValue('ui-scale', settings.uiScale);
        this.updateCheckboxValue('show-fps', settings.showFPS);
        this.updateCheckboxValue('reduce-motion', settings.reduceMotion);
        this.updateCheckboxValue('high-contrast', settings.highContrast);
        
        // Controls settings
        this.updateCheckboxValue('keyboard-shortcuts', settings.keyboardShortcuts);
        this.updateSliderValue('mouse-sensitivity', settings.mouseSensitivity);
        this.updateKeyBindings(settings.keyBindings);
        
        // Game statistics
        this.updateGameStats();
    }
    
    /**
     * Update slider value and display
     */
    updateSliderValue(sliderId, value) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(`${sliderId}-value`);
        
        if (slider) {
            slider.value = value;
            if (display) {
                if (sliderId.includes('volume') || sliderId === 'ui-scale') {
                    display.textContent = `${Math.round(value)}%`;
                } else {
                    display.textContent = Math.round(value);
                }
            }
        }
    }
    
    /**
     * Update select value
     */
    updateSelectValue(selectId, value) {
        const select = document.getElementById(selectId);
        if (select) {
            select.value = value;
        }
    }
    
    /**
     * Update checkbox value
     */
    updateCheckboxValue(checkboxId, value) {
        const checkbox = document.getElementById(checkboxId);
        if (checkbox) {
            checkbox.checked = value;
        }
    }
    
    /**
     * Update key binding displays
     */
    updateKeyBindings(keyBindings) {
        for (const [action, key] of Object.entries(keyBindings)) {
            const btn = document.getElementById(`key-${action}`);
            if (btn) {
                btn.textContent = this.formatKeyName(key);
            }
        }
    }
    
    /**
     * Update game statistics display
     */
    updateGameStats() {
        const gs = this.game.getGameState();
        if (!gs) return;
        
        const stats = gs.stats;
        
        // Format playtime
        const hours = Math.floor(stats.playtime / 3600);
        const minutes = Math.floor((stats.playtime % 3600) / 60);
        const playtimeEl = document.getElementById('stat-playtime');
        if (playtimeEl) {
            playtimeEl.textContent = `${hours}h ${minutes}m`;
        }
        
        // Update other stats
        const statMappings = {
            'stat-monsters-captured': stats.monstersCaptured || 0,
            'stat-battles-won': stats.battlesWon || 0,
            'stat-areas-explored': Object.keys(gs.world.unlockedAreas || {}).length
        };
        
        for (const [elementId, value] of Object.entries(statMappings)) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = value;
            }
        }
    }
    
    /**
     * Format key name for display
     */
    formatKeyName(key) {
        const keyMap = {
            'Escape': 'Esc',
            'KeyI': 'I',
            'KeyM': 'M',
            'KeyP': 'P',
            'Enter': 'Enter',
            'Space': 'Space'
        };
        return keyMap[key] || key;
    }
    
    /**
     * Switch settings category
     */
    switchSettingsCategory(category) {
        this.currentSettingsCategory = category;
        
        // Update category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-category') === category);
        });
        
        // Update panels
        document.querySelectorAll('.settings-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${category}-settings`);
        });
    }
    
    /**
     * Attach comprehensive settings event handlers
     */
    attachSettingsEventHandlers() {
        // Category navigation
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchSettingsCategory(btn.getAttribute('data-category'));
            });
        });
        
        // Audio settings
        this.attachAudioSettings();
        
        // Gameplay settings
        this.attachGameplaySettings();
        
        // Display settings
        this.attachDisplaySettings();
        
        // Controls settings
        this.attachControlsSettings();
        
        // Data settings
        this.attachDataSettings();
        
        // Navigation buttons
        const backBtn = document.getElementById('back-to-menu-btn');
        const applyBtn = document.getElementById('apply-settings-btn');
        
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.settingsChanged) {
                    this.showSettingsConfirmDialog();
                } else {
                    this.returnToPrevious();
                }
            });
        }
        
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applySettings();
            });
        }
    }
    
    /**
     * Attach audio settings handlers
     */
    attachAudioSettings() {
        const audioSliders = ['master-volume', 'music-volume', 'sfx-volume', 'voice-volume'];
        
        audioSliders.forEach(sliderId => {
            const slider = document.getElementById(sliderId);
            const display = document.getElementById(`${sliderId}-value`);
            
            if (slider) {
                slider.addEventListener('input', (e) => {
                    const value = parseInt(e.target.value);
                    if (display) {
                        display.textContent = `${value}%`;
                    }
                    this.updateGameStateSetting(sliderId.replace('-', ''), value / 100);
                    this.settingsChanged = true;
                });
            }
        });
    }
    
    /**
     * Attach gameplay settings handlers
     */
    attachGameplaySettings() {
        // Difficulty
        const difficultySelect = document.getElementById('difficulty-level');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', (e) => {
                this.updateGameStateSetting('difficulty', e.target.value);
                this.settingsChanged = true;
            });
        }
        
        // Checkboxes
        const gameplayCheckboxes = [
            'auto-save', 'battle-animations', 'skip-intro', 'monster-notifications'
        ];
        
        gameplayCheckboxes.forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const settingName = checkboxId.replace('-', '');
                    this.updateGameStateSetting(settingName, e.target.checked);
                    this.settingsChanged = true;
                });
            }
        });
        
        // Auto-save interval
        const intervalSelect = document.getElementById('autosave-interval');
        if (intervalSelect) {
            intervalSelect.addEventListener('change', (e) => {
                this.updateGameStateSetting('autoSaveInterval', parseInt(e.target.value));
                this.settingsChanged = true;
            });
        }
    }
    
    /**
     * Attach display settings handlers
     */
    attachDisplaySettings() {
        // Theme
        const themeSelect = document.getElementById('theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.updateGameStateSetting('theme', e.target.value);
                this.applyTheme(e.target.value);
                this.settingsChanged = true;
            });
        }
        
        // UI Scale
        const uiScaleSlider = document.getElementById('ui-scale');
        const uiScaleDisplay = document.getElementById('ui-scale-value');
        if (uiScaleSlider) {
            uiScaleSlider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (uiScaleDisplay) {
                    uiScaleDisplay.textContent = `${value}%`;
                }
                this.updateGameStateSetting('uiScale', value);
                this.applyUIScale(value);
                this.settingsChanged = true;
            });
        }
        
        // Display checkboxes
        const displayCheckboxes = ['show-fps', 'reduce-motion', 'high-contrast'];
        displayCheckboxes.forEach(checkboxId => {
            const checkbox = document.getElementById(checkboxId);
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    const settingName = checkboxId.replace('-', '');
                    this.updateGameStateSetting(settingName, e.target.checked);
                    this.applyDisplaySetting(settingName, e.target.checked);
                    this.settingsChanged = true;
                });
            }
        });
    }
    
    /**
     * Attach controls settings handlers
     */
    attachControlsSettings() {
        // Keyboard shortcuts toggle
        const keyboardShortcuts = document.getElementById('keyboard-shortcuts');
        if (keyboardShortcuts) {
            keyboardShortcuts.addEventListener('change', (e) => {
                this.updateGameStateSetting('keyboardShortcuts', e.target.checked);
                this.settingsChanged = true;
            });
        }
        
        // Mouse sensitivity
        const mouseSensitivity = document.getElementById('mouse-sensitivity');
        const sensitivityDisplay = document.getElementById('mouse-sensitivity-value');
        if (mouseSensitivity) {
            mouseSensitivity.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                if (sensitivityDisplay) {
                    sensitivityDisplay.textContent = value;
                }
                this.updateGameStateSetting('mouseSensitivity', value);
                this.settingsChanged = true;
            });
        }
        
        // Key binding buttons
        document.querySelectorAll('.key-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.startKeyBinding(btn);
            });
        });
    }
    
    /**
     * Attach data settings handlers
     */
    attachDataSettings() {
        // Clear save data
        const clearBtn = document.getElementById('clear-save-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.confirmClearSaveData();
            });
        }
        
        // Export save
        const exportBtn = document.getElementById('export-save');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportSaveData();
            });
        }
        
        // Import save
        const importBtn = document.getElementById('import-save-btn');
        const importInput = document.getElementById('import-save');
        
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => {
                importInput.click();
            });
            
            importInput.addEventListener('change', (e) => {
                this.importSaveData(e.target.files[0]);
            });
        }
        
        // Reset settings
        const resetBtn = document.getElementById('reset-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.confirmResetSettings();
            });
        }
    }
    
    /**
     * Update game state setting
     */
    updateGameStateSetting(settingName, value) {
        const gs = this.game.getGameState();
        if (gs) {
            // Handle nested settings
            const settingMap = {
                'mastervolume': 'masterVolume',
                'musicvolume': 'musicVolume',
                'sfxvolume': 'sfxVolume',
                'voicevolume': 'voiceVolume',
                'autosave': 'autoSave',
                'battleanimations': 'battleAnimations',
                'skipintro': 'skipIntro',
                'monsternotifications': 'monsterNotifications',
                'showfps': 'showFPS',
                'reducemotion': 'reduceMotion',
                'highcontrast': 'highContrast',
                'keyboardshortcuts': 'keyboardShortcuts',
                'mousesensitivity': 'mouseSensitivity'
            };
            
            const actualSettingName = settingMap[settingName.toLowerCase()] || settingName;
            gs.settings[actualSettingName] = value;
        }
    }
    
    /**
     * Apply theme changes
     */
    applyTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
    }
    
    /**
     * Apply UI scale changes
     */
    applyUIScale(scale) {
        document.documentElement.style.setProperty('--ui-scale', `${scale / 100}`);
    }
    
    /**
     * Apply display setting changes
     */
    applyDisplaySetting(setting, value) {
        switch (setting) {
            case 'showFPS':
                // Toggle FPS counter (placeholder)
                console.log('FPS counter:', value ? 'enabled' : 'disabled');
                break;
            case 'reduceMotion':
                document.body.classList.toggle('reduce-motion', value);
                break;
            case 'highContrast':
                document.body.classList.toggle('high-contrast', value);
                break;
        }
    }

    /**
     * Apply UI scale percentage to the root UI
     */
    applyUIScale(percent) {
        // Clamp between 50% and 200%
        const p = Math.max(50, Math.min(200, parseInt(percent) || 100));
        document.documentElement.style.setProperty('--ui-scale', (p / 100).toString());
        const overlay = document.getElementById('ui-overlay');
        if (overlay) {
            overlay.style.transformOrigin = 'top left';
            overlay.style.transform = `scale(${p / 100})`;
        }
    }

    /**
     * Attach audio settings handlers
     */
    attachAudioSettings() {
        const sliders = [
            { id: 'master-volume', setting: 'masterVolume' },
            { id: 'music-volume', setting: 'musicVolume' },
            { id: 'sfx-volume', setting: 'sfxVolume' },
            { id: 'voice-volume', setting: 'voiceVolume' }
        ];
        sliders.forEach(({ id, setting }) => {
            const el = document.getElementById(id);
            if (!el) return;
            const display = document.getElementById(`${id}-value`);
            el.addEventListener('input', (e) => {
                const raw = parseInt(e.target.value);
                if (display) display.textContent = `${Math.round(raw)}%`;
                // Store as 0..1 in settings
                this.updateGameStateSetting(setting, Math.max(0, Math.min(1, raw / 100)));
                this.settingsChanged = true;
            });
        });
    }

    /**
     * Attach data settings handlers (stubs for 8.x)
     */
    attachDataSettings() {
        const clearBtn = document.getElementById('clear-save-data');
        const exportBtn = document.getElementById('export-save');
        const exportSchemaBtn = document.getElementById('export-save-schema');
        const importBtn = document.getElementById('import-save-btn');
        const importInput = document.getElementById('import-save');
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (confirm('This will delete your saved progress. Continue?')) {
                    try {
                        localStorage.removeItem('sawyers_rpg_save');
                        localStorage.removeItem('sawyers_rpg_autosave');
                        this.showNotification('Save data cleared', 'success');
                    } catch (e) {
                        this.showNotification('Failed to clear save data', 'error');
                    }
                }
            });
        }
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                if (typeof SaveSystem !== 'undefined') {
                    const ok = SaveSystem.exportSave();
                    if (!ok) this.showNotification(SaveSystem.lastError || 'No save to export', 'error');
                    else this.showNotification('Save exported', 'success');
                }
            });
        }
        if (exportSchemaBtn && typeof SaveSystem !== 'undefined' && typeof SaveSystem.exportSchema === 'function') {
            exportSchemaBtn.addEventListener('click', () => {
                const ok = SaveSystem.exportSchema();
                this.showNotification(ok ? 'Save schema exported' : (SaveSystem.lastError || 'Failed to export schema'), ok ? 'success' : 'error');
            });
        }
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => importInput.click());
            importInput.addEventListener('change', async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                if (!confirm('Importing will overwrite your current save. Continue?')) {
                    importInput.value = '';
                    return;
                }
                if (typeof SaveSystem !== 'undefined') {
                    const ok = await SaveSystem.importSave(file);
                    this.showNotification(ok ? 'Save imported' : (SaveSystem.lastError || 'Import failed'), ok ? 'success' : 'error');
                    if (ok) {
                        // Reload current UI state from GameState
                        try { this.updateHUDVisibility(); } catch {}
                    }
                }
                importInput.value = '';
            });
        }
    }

    /**
     * Prompt to apply or discard settings before leaving
     */
    showSettingsConfirmDialog() {
        const apply = confirm('You have unsaved changes. Apply them now?\nPress OK to Apply, Cancel to discard.');
        if (apply) {
            this.applySettings();
        } else {
            this.settingsChanged = false;
            this.returnToPrevious();
        }
    }
    
    /**
     * Start key binding mode
     */
    startKeyBinding(button) {
        if (this.keyBindingMode) return;
        
        this.keyBindingMode = button;
        button.classList.add('editing');
        button.textContent = 'Press key...';
        
        const handleKeyPress = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const action = button.getAttribute('data-action');
            const key = e.code;
            
            // Update game state
            const gs = this.game.getGameState();
            if (gs) {
                gs.settings.keyBindings[action] = key;
                this.settingsChanged = true;
            }
            
            // Update display
            button.textContent = this.formatKeyName(key);
            button.classList.remove('editing');
            
            // Clean up
            document.removeEventListener('keydown', handleKeyPress, true);
            this.keyBindingMode = null;
        };
        
        document.addEventListener('keydown', handleKeyPress, true);
    }
    
    /**
     * Confirm clear save data
     */
    confirmClearSaveData() {
        if (confirm('Are you sure you want to clear all save data? This cannot be undone!')) {
            // Clear save data (placeholder)
            localStorage.removeItem('sawyers_rpg_save');
            localStorage.removeItem('sawyers_rpg_autosave');
            this.showNotification('Save data cleared!', 'success');
        }
    }
    
    /**
     * Export save data
     */
    exportSaveData() {
        const gs = this.game.getGameState();
        if (!gs) return;
        
        const saveData = gs.getSaveData();
        const dataStr = JSON.stringify(saveData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sawyers_rpg_save_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showNotification('Save data exported!', 'success');
    }
    
    /**
     * Import save data
     */
    importSaveData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const saveData = JSON.parse(e.target.result);
                const gs = this.game.getGameState();
                if (gs && gs.loadFromSave(saveData)) {
                    this.updateSettingsFromGameState();
                    this.showNotification('Save data imported!', 'success');
                } else {
                    this.showNotification('Failed to import save data!', 'error');
                }
            } catch (error) {
                this.showNotification('Invalid save file!', 'error');
                console.error('Save import error:', error);
            }
        };
        reader.readAsText(file);
    }
    
    /**
     * Confirm reset settings
     */
    confirmResetSettings() {
        if (confirm('Reset all settings to default values?')) {
            // Reset to defaults (placeholder)
            const gs = this.game.getGameState();
            if (gs) {
                // Reset settings to defaults
                gs.settings = {
                    masterVolume: 0.5,
                    musicVolume: 0.7,
                    sfxVolume: 0.75,
                    voiceVolume: 0.8,
                    difficulty: 'normal',
                    autoSave: true,
                    autoSaveInterval: 5,
                    battleAnimations: true,
                    skipIntro: false,
                    monsterNotifications: true,
                    theme: 'fantasy',
                    uiScale: 100,
                    showFPS: false,
                    reduceMotion: false,
                    highContrast: false,
                    keyboardShortcuts: true,
                    mouseSensitivity: 5,
                    keyBindings: {
                        menu: 'Escape',
                        inventory: 'KeyI',
                        map: 'KeyM',
                        monsters: 'KeyP'
                    }
                };
                
                this.updateSettingsFromGameState();
                this.applyAllSettings();
                this.showNotification('Settings reset to defaults!', 'success');
            }
        }
    }
    
    /**
     * Apply all settings
     */
    applyAllSettings() {
        const gs = this.game.getGameState();
        if (!gs) return;
        
        const settings = gs.settings;
        
        // Apply theme
        this.applyTheme(settings.theme);
        
        // Apply UI scale
        this.applyUIScale(settings.uiScale);
        
        // Apply display settings
        this.applyDisplaySetting('showFPS', settings.showFPS);
        this.applyDisplaySetting('reduceMotion', settings.reduceMotion);
        this.applyDisplaySetting('highContrast', settings.highContrast);
        
        // Update audio settings
        this.updateAudioSettings();
        
        this.settingsChanged = false;
        this.showNotification('Settings applied!', 'success');
    }

    /**
     * Auto-save if setting enabled
     */
    autoSaveIfEnabled(reason = '') {
        try {
            const gs = this.game?.getGameState ? this.game.getGameState() : null;
            if (!gs || typeof SaveSystem === 'undefined') return;
            if (gs.settings?.autoSave) {
                SaveSystem.autoSave();
                if (reason) console.log(`📝 Auto-saved: ${reason}`);
            }
        } catch (e) {
            // ignore
        }
    }
    
    /**
     * Show settings confirmation dialog
     */
    showSettingsConfirmDialog() {
        if (confirm('You have unsaved changes. Do you want to apply them before leaving?')) {
            this.applySettings();
        }
        this.returnToPrevious();
    }
    
    /**
     * Apply settings
     */
    applySettings() {
        this.applyAllSettings();
    }
    
    /**
     * Set up settings controls (legacy compatibility)
     */
    attachSettings() {
        // Legacy method - now handled by initializeSettings
        this.initializeSettings();
    }
    
    /**
     * Update game loop
     */
    update(deltaTime) {
        // Update scene transitions
        if (this.transitionState.active) {
            this.updateTransition(deltaTime);
        }
        
        // Update current scene
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
        
        // Process dialogue queue
        this.processDialogueQueue(deltaTime);
    }
    
    /**
     * Update scene transitions
     */
    updateTransition(deltaTime) {
        this.transitionState.elapsed += deltaTime;
        
        if (this.transitionState.elapsed >= this.transitionState.duration) {
            this.completeTransition();
        }
    }

    /**
     * Begin a scene transition
     */
    startTransition(targetScene) {
        this.transitionState = {
            active: true,
            duration: this.transitionState?.duration || 0.3,
            elapsed: 0,
            type: this.transitionState?.type || 'fade',
            targetScene: targetScene
        };
    }
    
    /**
     * Complete the current scene transition
     */
    completeTransition() {
        const targetScene = this.transitionState?.targetScene;
        this.transitionState.active = false;
        this.transitionState.elapsed = 0;
        this.transitionState.targetScene = null;
        if (targetScene) {
            this.showScene(targetScene, false);
        }
    }
    
    /**
     * Return to previous scene, or a sensible default
     */
    returnToPrevious() {
        // Prefer explicit previous scene if available
        if (this.previousScene && this.previousScene.name) {
            this.showScene(this.previousScene.name);
            return;
        }
        // Fallbacks based on current context
        if (this.currentScene?.name === 'settings') {
            // If coming from settings with no recorded previous, go to main_menu
            this.showScene('main_menu');
            return;
        }
        // Final fallback: game world if registered, else main menu
        if (this.scenes.game_world) {
            this.showScene('game_world');
        } else if (this.scenes.main_menu) {
            this.showScene('main_menu');
        }
    }
    
    /**
     * Process dialogue queue
     */
    processDialogueQueue(deltaTime) {
        // Dialogue system implementation
        // Will be expanded when story system is integrated
    }
    
    /**
     * Render UI elements on canvas (if needed)
     */
    renderCanvas(ctx) {
        // Canvas-based UI rendering for game scenes
        if (this.currentScene && this.currentScene.config.type === 'game') {
            this.renderGameUI(ctx);
        }
        
        // Render transitions
        if (this.transitionState.active) {
            this.renderTransition(ctx);
        }
    }
    
    /**
     * Render game UI elements
     */
    renderGameUI(ctx) {
        // Render world map, area info, etc. on canvas
        const gameState = this.game.gameState;
        if (!gameState) return;
        
        // Draw current area name
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 30);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px serif';
        ctx.fillText(`Area: ${gameState.world.currentArea}`, 15, 30);
        ctx.restore();
    }
    
    /**
     * Render scene transitions
     */
    renderTransition(ctx) {
        const progress = this.transitionState.elapsed / this.transitionState.duration;
        
        switch (this.transitionState.type) {
            case 'fade':
                ctx.save();
                ctx.globalAlpha = 1 - progress;
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
                break;
        }
    }
    
    /**
     * Show a scene
     */
    showScene(sceneName, transition = true) {
        const scene = this.scenes[sceneName];
        if (!scene) {
            console.error(`Scene ${sceneName} not found`);
            return false;
        }
        
        // Handle scene transition
        if (transition && this.currentScene) {
            this.startTransition(sceneName);
            return true;
        }
        
        // Hide current scene
        if (this.currentScene) {
            this.currentScene.hide();
            this.previousScene = this.currentScene;
        }
        
        // Show new scene
        this.currentScene = scene;
        scene.show();
        
        // Update game state scene
        if (this.game.gameState) {
            this.game.gameState.changeScene(sceneName);
        }
        
        // Show/hide HUD based on scene type
        this.updateHUDVisibility();
        
        // Initialize scene-specific content (guard for undefined methods)
        if (sceneName === 'game_world' && typeof this.initializeWorldMap === 'function') {
            this.initializeWorldMap();
            // Trigger story on entering world (MVP)
            try {
                const gs = this.game?.getGameState ? this.game.getGameState() : null;
                const area = this.currentPlayerArea || gs?.world?.currentArea || 'starting_village';
                // Intro auto-trigger: game_start only once
                const flags = gs?.world?.storyFlags || [];
                const completed = gs?.world?.completedEvents || [];
                const modal = document.getElementById('story-modal');
                const isOpen = modal && !modal.classList.contains('hidden');
                const areaEvents = (typeof AreaData !== 'undefined') ? (AreaData.getArea(area)?.storyEvents || []) : [];
                if (!isOpen && !flags.includes('game_start_completed') && areaEvents.includes('game_start') && !completed.includes('game_start')) {
                    this.showStoryEvent('game_start');
                } else {
                    this.triggerStoryEventIfAvailable(area);
                }
            } catch (e) { console.warn('Story trigger on world enter failed:', e); }
        }
        // Monster management scene handled by MonsterUI module
        if (sceneName === 'inventory' && typeof this.initializeInventory === 'function') {
            this.initializeInventory();
        }
        if (sceneName === 'settings' && typeof this.initializeSettings === 'function') {
            this.initializeSettings();
        }
        
        console.log(`Scene changed to: ${sceneName}`);
        return true;
    }

/**
 * Load saved game
 */
loadGame() {
    if (typeof SaveSystem !== 'undefined') {
        const success = SaveSystem.loadGame();
        if (success) {
            this.showScene('game_world');
            this.showNotification('Game loaded successfully', 'success');
        } else {
            this.showNotification('No save file found', 'error');
        }
    }
}

    /**
     * Update HUD visibility based on current scene
     */
    updateHUDVisibility() {
        const hud = document.getElementById('game-hud');
        if (!hud) return;
        
        const showHUD = this.currentScene && 
                       (this.currentScene.config.type === 'game' || 
                        this.currentScene.config.overlay);
        
        hud.classList.toggle('hidden', !showHUD);
    }
    
    /**
     * Handle global keyboard shortcuts
     */
    handleGlobalKeys(event) {
        switch (event.key) {
            case 'Escape':
                this.handleEscape();
                break;
            case 'Enter':
                this.handleConfirm();
                break;
            case 'm':
            case 'M':
                if (this.currentScene?.name === 'game_world') {
                    this.showWorldMap();
                }
                break;
            case 'i':
            case 'I':
                if (this.currentScene?.name === 'game_world') {
                    this.showScene('inventory');
                }
                break;
            case 'p':
            case 'P':
                if (this.currentScene?.name === 'game_world') {
                    this.showScene('monster_management');
                }
                break;
        }
    }
    
    /**
     * Handle escape key
     */
    handleEscape() {
        if (this.currentScene?.config.overlay) {
            this.showScene('game_world');
        } else if (this.currentScene?.name === 'game_world') {
            this.showScene('settings');
        } else {
            this.returnToPrevious();
        }
    }
    
    /**
     * Handle confirm key
     */
    handleConfirm() {
        // Context-sensitive confirm action
        // Will be expanded based on current scene
    }
    
    // ================================================
    // SCENE ACTIONS
    // ================================================
    
    /**
     * Start new game
     */
    startNewGame() {
        if (this.game.gameState) {
            this.game.gameState.resetToDefaults();
        }
        this.showScene('character_select');
    }
    
    /**
     * Load saved game
     */
    loadGame() {
        if (typeof SaveSystem !== 'undefined') {
            const success = SaveSystem.loadGame();
            if (success) {
                this.showScene('game_world');
                this.showNotification('Game loaded successfully', 'success');
            } else {
                this.showNotification('No save file found', 'error');
            }
        }
    }
    
    /**
     * Start adventure with selected character
     */
    startAdventure() {
        // Support multiple selection sources to tolerate different attach flows
        let selectedClass = this.selectedElements.get('character_class');
        if (!selectedClass && this.game && typeof this.game.getGameState === 'function') {
            const gs = this.game.getGameState();
            if (gs && gs.selectedClass) selectedClass = gs.selectedClass;
        }
        if (!selectedClass) {
            const selectedCard = document.querySelector('.class-card.selected');
            if (selectedCard && selectedCard.dataset && selectedCard.dataset.class) {
                selectedClass = selectedCard.dataset.class;
            }
        }
        if (!selectedClass) {
            this.showNotification('Please select a character class', 'error');
            return;
        }
        
        if (this.game.gameState) {
            const success = this.game.gameState.setPlayerClass(selectedClass);
            if (success) {
                this.game.gameState.addStoryFlag('character_selected');
                // Unlock early-game progression so Forest Path is available
                this.game.gameState.addStoryFlag('tutorial_complete');
                this.showScene('game_world');
                this.showNotification(`Adventure begins as a ${selectedClass}!`, 'success');
            }
        }
    }
    
    /**
     * Show world map
     */
    showWorldMap() {
        // Always create and show overlay so UI tests can assert presence
        this.ensureWorldMapOverlay();
        const gs = this.game.getGameState();
        if (!gs || typeof AreaData === 'undefined') {
            const list = this.worldMapOverlay.querySelector('#world-map-list');
            if (list) {
                list.innerHTML = '';
                const info = document.createElement('div');
                info.style.color = '#e5e7eb';
                info.style.background = '#374151';
                info.style.border = '1px solid #4b5563';
                info.style.borderRadius = '6px';
                info.style.padding = '10px';
                info.textContent = 'World map data unavailable in this environment.';
                list.appendChild(info);
            }
            this.worldMapOverlay.style.display = 'block';
            return true;
        }
        this.openWorldMapOverlay();
        return true;
    }
    
    /**
     * Save game
     */
    saveGame() {
        if (typeof SaveSystem !== 'undefined') {
            const success = SaveSystem.saveGame();
            if (success) {
                this.showNotification('Game saved', 'success');
            } else {
                this.showNotification('Save failed', 'error');
            }
        }
    }
    
    /**
     * Update audio settings
     */
    updateAudioSettings() {
        // Audio system integration - placeholder
        console.log('Audio settings updated');
    }
    
    /**
     * Prompt user for two monster IDs and initiate breeding
     */
    promptBreeding() {
        const gameState = this.game.getGameState();
        if (!gameState) return;
        const input = window.prompt('Enter two monster IDs to breed (e.g., 1,2):');
        if (!input) return;
        const parts = input.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
        if (parts.length !== 2) {
            this.showNotification('Please enter exactly two valid IDs', 'error');
            return;
        }
        this.breedMonsters(parts[0], parts[1]);
    }
    
    /**
     * Initiate breeding via GameState with notifications
     */
    breedMonsters(monsterId1, monsterId2) {
        const gameState = this.game.getGameState();
        if (!gameState) return;
        
        const check = gameState.canBreed(monsterId1, monsterId2);
        if (!check.canBreed) {
            this.showNotification(check.reason || 'Cannot breed these monsters', 'error');
            return;
        }
        const result = gameState.breed(monsterId1, monsterId2);
        if (result.success) {
            this.showNotification(`Breeding successful! Offspring added to storage.`, 'success');
        } else {
            this.showNotification(result.reason || 'Breeding failed', 'error');
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (this.game.gameState) {
            this.game.gameState.addNotification(message, type);
        }
    }
    
    /**
     * Show dialogue
     */
    showDialogue(dialogue, choices = null) {
        // Dialogue system implementation
        console.log('Showing dialogue:', dialogue);
    }
    
    /**
     * Hide all UI (for fullscreen game view)
     */
    hideAllUI() {
        document.getElementById('ui-overlay').classList.add('hidden');
        document.getElementById('game-hud').classList.add('hidden');
    }
    
    /**
     * Show all UI
     */
    showAllUI() {
        document.getElementById('ui-overlay').classList.remove('hidden');
        this.updateHUDVisibility();
    }
    
    /**
     * Attach combat interface event handlers
     */
    attachCombatInterface() {
        // Main action buttons
        this.attachButton('attack-btn', () => this.handleCombatAction('attack'));
        this.attachButton('magic-btn', () => this.showSubMenu('magic-submenu'));
        this.attachButton('items-btn', () => this.showSubMenu('items-submenu'));
        this.attachButton('capture-btn', () => this.handleCombatAction('capture'));
        this.attachButton('flee-btn', () => this.handleCombatAction('flee'));
        
        // Back buttons for submenus
        this.attachButton('magic-back-btn', () => this.hideSubMenu('magic-submenu'));
        this.attachButton('items-back-btn', () => this.hideSubMenu('items-submenu'));
        this.attachButton('target-back-btn', () => this.hideSubMenu('target-selection'));
    }
    
    /**
     * Handle combat action selection
     */
    handleCombatAction(action) {
        if (window.GameState && window.GameState.combat) {
            const combat = window.GameState.combat;
            
            switch(action) {
                case 'attack':
                    // Show target selection if multiple enemies
                    this.showTargetSelection('attack');
                    break;
                case 'capture':
                    this.showTargetSelection('capture');
                    break;
                case 'flee':
                    combat.attemptFlee();
                    break;
                default:
                    console.warn(`Unknown combat action: ${action}`);
            }
        }
    }
    
    /**
     * Show combat submenu
     */
    showSubMenu(submenuId) {
        // Hide main menu
        const mainMenu = document.getElementById('main-action-menu');
        if (mainMenu) mainMenu.classList.add('hidden');
        
        // Show submenu
        const submenu = document.getElementById(submenuId);
        if (submenu) {
            submenu.classList.remove('hidden');
            
            // Populate submenu content based on type
            if (submenuId === 'magic-submenu') {
                this.populateSpellList();
            } else if (submenuId === 'items-submenu') {
                this.populateItemList();
            }
        }
    }
    
    /**
     * Hide combat submenu
     */
    hideSubMenu(submenuId) {
        // Hide submenu
        const submenu = document.getElementById(submenuId);
        if (submenu) submenu.classList.add('hidden');
        
        // Show main menu
        const mainMenu = document.getElementById('main-action-menu');
        if (mainMenu) mainMenu.classList.remove('hidden');
    }
    
    /**
     * Show target selection interface
     */
    showTargetSelection(actionType) {
        // Show target selection menu
        const targetMenu = document.getElementById('target-selection');
        if (targetMenu) {
            targetMenu.classList.remove('hidden');
            this.populateTargetList(actionType);
        }
        
        // Hide main menu
        const mainMenu = document.getElementById('main-action-menu');
        if (mainMenu) mainMenu.classList.add('hidden');
    }
    
    /**
     * Populate spell list for magic submenu
     */
    populateSpellList() {
        const spellList = document.querySelector('#magic-submenu .spell-list');
        if (!spellList || !window.GameState) return;
        
        const player = window.GameState.player;
        if (!player || !player.spells) return;
        
        spellList.innerHTML = '';
        
        player.spells.forEach(spell => {
            const spellBtn = document.createElement('button');
            spellBtn.className = 'spell-btn';
            spellBtn.textContent = `${spell.name} (${spell.manaCost} MP)`;
            spellBtn.disabled = player.mana < spell.manaCost;
            spellBtn.addEventListener('click', () => {
                this.hideSubMenu('magic-submenu');
                this.showTargetSelection('magic', spell);
            });
            spellList.appendChild(spellBtn);
        });
    }
    
    /**
     * Populate item list for items submenu
     */
    populateItemList() {
        const itemList = document.querySelector('#items-submenu .item-list');
        if (!itemList || !window.GameState) return;
        
        const inventory = window.GameState.player.inventory || {};
        itemList.innerHTML = '';
        
        Object.entries(inventory).forEach(([itemName, quantity]) => {
            if (quantity > 0) {
                const itemBtn = document.createElement('button');
                itemBtn.className = 'item-btn';
                itemBtn.textContent = `${itemName} (${quantity})`;
                itemBtn.addEventListener('click', () => {
                    this.hideSubMenu('items-submenu');
                    this.showTargetSelection('item', itemName);
                });
                itemList.appendChild(itemBtn);
            }
        });
        
        if (itemList.children.length === 0) {
            const noItems = document.createElement('p');
            noItems.textContent = 'No usable items';
            noItems.className = 'no-items';
            itemList.appendChild(noItems);
        }
    }
    
    /**
     * Populate target list for target selection
     */
    populateTargetList(actionType, actionData = null) {
        const targetList = document.querySelector('#target-selection .target-list');
        if (!targetList || !window.GameState) return;
        
        targetList.innerHTML = '';
        const combat = window.GameState.combat;
        
        if (!combat) return;
        
        // Get available targets based on action type
        let targets = [];
        if (actionType === 'attack' || actionType === 'capture') {
            targets = combat.enemies.filter(enemy => enemy.hp > 0);
        } else if (actionType === 'magic' || actionType === 'item') {
            // Could target enemies or allies depending on spell/item
            targets = combat.enemies.filter(enemy => enemy.hp > 0);
            // Add player and monsters as potential targets for healing/buffs
            targets.push(combat.player);
            if (combat.playerMonsters) {
                targets.push(...combat.playerMonsters.filter(m => m.hp > 0));
            }
        }
        
        targets.forEach((target, index) => {
            const targetBtn = document.createElement('button');
            targetBtn.className = 'target-btn';
            targetBtn.textContent = target.name || `Enemy ${index + 1}`;
            targetBtn.addEventListener('click', () => {
                this.executeTargetedAction(actionType, target, actionData);
                this.hideSubMenu('target-selection');
            });
            targetList.appendChild(targetBtn);
        });
    }
    
    /**
     * Execute the selected action on the chosen target
     */
    executeTargetedAction(actionType, target, actionData) {
        if (!window.GameState || !window.GameState.combat) return;
        
        const combat = window.GameState.combat;
        
        switch(actionType) {
            case 'attack':
                combat.performAttack(combat.player, target);
                break;
            case 'capture':
                combat.attemptCapture(target);
                break;
            case 'magic':
                if (actionData) {
                    combat.castSpell(combat.player, actionData, target);
                }
                break;
            case 'item':
                if (actionData) {
                    combat.useItem(actionData, target);
                }
                break;
        }
    }
    
    /**
     * Populate spell list for magic submenu
     */
    populateSpellList() {
        const spellList = document.querySelector('#magic-submenu .spell-list');
        if (!spellList) return;
        
        spellList.innerHTML = '';
        
        // Get player's available spells
        let spells = [];
        if (window.GameState && window.GameState.player) {
            spells = window.GameState.player.knownSpells || [];
        }
        
        if (spells.length === 0) {
            const noSpells = document.createElement('div');
            noSpells.textContent = 'No spells available';
            noSpells.className = 'no-items';
            noSpells.style.color = 'var(--parchment)';
            noSpells.style.textAlign = 'center';
            noSpells.style.padding = 'var(--spacing-md)';
            spellList.appendChild(noSpells);
            return;
        }
        
        spells.forEach(spell => {
            const spellBtn = document.createElement('button');
            spellBtn.className = 'spell-btn';
            spellBtn.textContent = spell.replace('_', ' ');
            spellBtn.dataset.spell = spell;
            
            spellBtn.addEventListener('click', () => {
                this.showTargetSelection('magic', { spell });
                this.hideSubMenu('magic-submenu');
            });
            
            spellList.appendChild(spellBtn);
        });
    }
    
    /**
     * Populate item list for items submenu
     */
    populateItemList() {
        const itemList = document.querySelector('#items-submenu .item-list');
        if (!itemList) return;
        
        itemList.innerHTML = '';
        
        // Get player's usable items in combat
        let items = [];
        if (window.GameState && window.GameState.player) {
            const inventory = window.GameState.player.inventory || {};
            // Filter for consumable items
            items = Object.entries(inventory)
                .filter(([item, count]) => count > 0 && this.isUsableInCombat(item))
                .map(([item, count]) => ({ name: item, count }));
        }
        
        if (items.length === 0) {
            const noItems = document.createElement('div');
            noItems.textContent = 'No usable items';
            noItems.className = 'no-items';
            noItems.style.color = 'var(--parchment)';
            noItems.style.textAlign = 'center';
            noItems.style.padding = 'var(--spacing-md)';
            itemList.appendChild(noItems);
            return;
        }
        
        items.forEach(item => {
            const itemBtn = document.createElement('button');
            itemBtn.className = 'item-btn';
            itemBtn.innerHTML = `${item.name.replace('_', ' ')}<br><small>(${item.count})</small>`;
            itemBtn.dataset.item = item.name;
            
            itemBtn.addEventListener('click', () => {
                this.showTargetSelection('item', { item: item.name });
                this.hideSubMenu('items-submenu');
            });
            
            itemList.appendChild(itemBtn);
        });
    }
    
    /**
     * Check if an item is usable in combat
     */
    isUsableInCombat(itemName) {
        const combatItems = [
            'potion', 'hi_potion', 'ether', 'elixir',
            'antidote', 'eye_drops', 'echo_screen',
            'phoenix_down', 'remedy', 'mega_potion'
        ];
        return combatItems.includes(itemName);
    }
    
    /**
     * Update combat status display
     */
    updateCombatStatus(turnNumber, currentActor) {
        const turnEl = document.getElementById('current-turn');
        const actorEl = document.getElementById('current-actor');
        
        if (turnEl) turnEl.textContent = turnNumber;
        if (actorEl) actorEl.textContent = currentActor;
    }
    
    /**
     * Update combatant display (health, mana, status effects)
     */
    updateCombatant(combatantId, data) {
        const combatant = document.getElementById(combatantId);
        if (!combatant) return;
        
        // Update name
        const nameEl = combatant.querySelector('.combatant-name');
        if (nameEl && data.name) nameEl.textContent = data.name;
        
        // Update health bar
        const healthFill = combatant.querySelector('.health-fill');
        const healthText = combatant.querySelector('.health-text');
        if (healthFill && healthText && data.hp !== undefined && data.maxHp !== undefined) {
            const healthPercent = Math.max(0, (data.hp / data.maxHp) * 100);
            healthFill.style.width = `${healthPercent}%`;
            healthText.textContent = `${data.hp}/${data.maxHp}`;
        }
        
        // Update mana bar
        const manaFill = combatant.querySelector('.mana-fill');
        const manaText = combatant.querySelector('.mana-text');
        if (manaFill && manaText && data.mp !== undefined && data.maxMp !== undefined) {
            const manaPercent = Math.max(0, (data.mp / data.maxMp) * 100);
            manaFill.style.width = `${manaPercent}%`;
            manaText.textContent = `${data.mp}/${data.maxMp}`;
        }
        
        // Update status effects
        const statusEl = combatant.querySelector('.status-effects');
        if (statusEl && data.statusEffects) {
            statusEl.innerHTML = '';
            data.statusEffects.forEach(effect => {
                const effectEl = document.createElement('span');
                effectEl.className = 'status-effect';
                effectEl.textContent = effect.name || effect;
                statusEl.appendChild(effectEl);
            });
        }
        
        // Update active state
        if (data.isActive) {
            combatant.classList.add('active');
        } else {
            combatant.classList.remove('active');
        }
    }
    
    /**
     * Add message to battle log
     */
    addBattleLogMessage(message, type = 'default') {
        const logMessages = document.getElementById('battle-log-messages');
        if (!logMessages) return;
        
        const messageEl = document.createElement('div');
        messageEl.className = `log-message ${type}`;
        messageEl.textContent = message;
        
        logMessages.appendChild(messageEl);
        
        // Auto-scroll to bottom
        logMessages.scrollTop = logMessages.scrollHeight;
        
        // Limit log size
        const messages = logMessages.querySelectorAll('.log-message');
        if (messages.length > 50) {
            messages[0].remove();
        }
    }
    
    /**
     * Clear battle log
     */
    clearBattleLog() {
        const logMessages = document.getElementById('battle-log-messages');
        if (logMessages) {
            logMessages.innerHTML = '<div class="log-message">Battle started!</div>';
        }
    }
    
    /**
     * Attach character selection interface event handlers
     */
    attachCharacterSelection() {
        // Class card selection
        const classCards = document.querySelectorAll('.class-card');
        classCards.forEach(card => {
            card.addEventListener('click', () => {
                this.selectCharacterClass(card.dataset.class);
            });
        });
        
        // Back to menu button
        this.attachButton('back-to-menu', () => this.showScene('main_menu'));
    }
    
    /**
     * Handle character class selection
     */
    selectCharacterClass(className) {
        // Remove previous selection
        document.querySelectorAll('.class-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Add selection to clicked card
        const selectedCard = document.querySelector(`[data-class="${className}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
        
        // Update details panel
        this.showClassDetails(className);
        
        // Enable start button
        const startBtn = document.getElementById('start-adventure-btn');
        if (startBtn) {
            startBtn.disabled = false;
        }
        
        // Store selection
        if (window.GameState) {
            window.GameState.selectedClass = className;
        }
    }
    
    /**
     * Show detailed information about a character class
     */
    showClassDetails(className) {
        if (!window.CharacterData) {
            console.warn('CharacterData not available');
            return;
        }
        
        const classData = window.CharacterData.getClass(className);
        if (!classData) {
            console.warn(`Class data not found for: ${className}`);
            return;
        }
        
        // Hide no-selection prompt
        const noSelection = document.querySelector('.no-selection');
        if (noSelection) noSelection.style.display = 'none';
        
        // Show details content
        const detailContent = document.getElementById('class-detail-content');
        if (detailContent) {
            detailContent.classList.remove('hidden');
            
            // Update class name and description
            const nameEl = document.getElementById('detail-class-name');
            const descEl = document.getElementById('detail-class-desc');
            if (nameEl) nameEl.textContent = classData.name;
            if (descEl) descEl.textContent = classData.description;
            
            // Update stats
            this.populateStats(classData.baseStats);
            
            // Update spells
            this.populateStartingSpells(classData.startingSpells);
            
            // Update class bonus
            const bonusEl = document.getElementById('class-bonus-text');
            if (bonusEl) bonusEl.textContent = classData.classBonus;
        }
    }
    
    /**
     * Populate stats grid with character stats
     */
    populateStats(stats) {
        const statsGrid = document.getElementById('stats-grid');
        if (!statsGrid) return;
        
        statsGrid.innerHTML = '';
        
        // Define stat display names
        const statNames = {
            hp: 'Health',
            mp: 'Mana',
            attack: 'Attack',
            defense: 'Defense',
            magicAttack: 'Magic Attack',
            magicDefense: 'Magic Defense',
            speed: 'Speed',
            accuracy: 'Accuracy'
        };
        
        Object.entries(stats).forEach(([statKey, value]) => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            
            const statName = document.createElement('span');
            statName.className = 'stat-name';
            statName.textContent = statNames[statKey] || statKey;
            
            const statValue = document.createElement('span');
            statValue.className = 'stat-value';
            statValue.textContent = value;
            
            statItem.appendChild(statName);
            statItem.appendChild(statValue);
            statsGrid.appendChild(statItem);
        });
    }
    
    /**
     * Populate starting spells list
     */
    populateStartingSpells(spells) {
        const spellsList = document.getElementById('starting-spells');
        if (!spellsList) return;
        
        spellsList.innerHTML = '';
        
        if (spells && spells.length > 0) {
            spells.forEach(spell => {
                const spellTag = document.createElement('span');
                spellTag.className = 'spell-tag';
                spellTag.textContent = spell.replace('_', ' ');
                spellsList.appendChild(spellTag);
            });
        } else {
            const noSpells = document.createElement('span');
            noSpells.className = 'spell-tag';
            noSpells.style.opacity = '0.6';
            noSpells.textContent = 'None';
            spellsList.appendChild(noSpells);
        }
    }
    
    // Monster management interface moved to MonsterUI module
    
    // switchMonsterTab method moved to MonsterUI module
    
    // refreshPartyDisplay method moved to MonsterUI module
    
    // refreshStorageDisplay method moved to MonsterUI module
    
    // createMonsterCard method moved to MonsterUI module
    
    // getMonsterIcon method moved to MonsterUI module
    
    // showMonsterDetails method moved to MonsterUI module
    
    // closeMonsterModal method moved to MonsterUI module
    
    // isMonsterInParty method moved to MonsterUI module
    
    // getFilteredMonsters method moved to MonsterUI module
    
    // filterStorage method moved to MonsterUI module
    
    // toggleMonsterSelection method moved to MonsterUI module
    
    // refreshBreedingDisplay method moved to MonsterUI module
    
    // updateBreedingSlots method moved to MonsterUI module
    
    // updateBreedingCompatibility method moved to MonsterUI module
    
    // updateBreedingHistory method moved to MonsterUI module
    
    // healAllPartyMonsters method moved to MonsterUI module
    
    /**
     * Show a notification message
     */
    showNotification(message) {
        // Simple notification - could be enhanced with a proper notification system
        console.log('Notification:', message);
        // TODO: Implement proper notification UI
    }
    
    /**
     * Attach world map interface event handlers
     */
    attachWorldMapInterface() {
        // Initialize world map state
        this.selectedArea = null;
        this.currentPlayerArea = 'starting_village';
        
        // Navigation buttons
        this.attachButton('back-from-world', () => this.returnToPrevious());
        this.attachButton('center-map', () => this.centerMapOnPlayer());
        
        // Area action buttons
        this.attachButton('travel-to-area', () => this.travelToSelectedArea());
        this.attachButton('explore-area', () => this.exploreSelectedArea());
    }
    
    /**
     * Initialize and render the world map
     */
    initializeWorldMap() {
        if (!window.AreaData) {
            console.warn('AreaData not available');
            return;
        }
        
        const worldMap = document.getElementById('world-map');
        if (!worldMap) return;
        
        // Clear existing content
        worldMap.innerHTML = '';
        
        // Define area positions on the map (x%, y%)
        const areaPositions = {
            starting_village: { x: 50, y: 80 },
            forest_path: { x: 50, y: 60 },
            deep_forest: { x: 30, y: 40 },
            plains: { x: 70, y: 50 },
            mountain_pass: { x: 20, y: 20 },
            desert_oasis: { x: 80, y: 70 },
            ancient_ruins: { x: 15, y: 60 },
            crystal_cave: { x: 25, y: 15 },
            haunted_swamp: { x: 75, y: 30 },
            dragon_peak: { x: 10, y: 10 }
        };
        
        // Sync current area with GameState if available
        const gs = this.game?.getGameState ? this.game.getGameState() : null;
        if (gs && gs.world && gs.world.currentArea) {
            this.currentPlayerArea = gs.world.currentArea;
        }

        // Create area nodes and connections
        this.createAreaNodes(worldMap, areaPositions);
        this.createAreaConnections(worldMap, areaPositions);
        
        // Update player location display
        this.updatePlayerLocationDisplay();
        
        // Initialize quick travel
        this.updateQuickTravelButtons();

        // Auto-select the current area on map init
        const currentId = this.currentPlayerArea || (gs?.world?.currentArea) || 'starting_village';
        const currentData = window.AreaData.areas[currentId];
        if (currentData) {
            this.selectArea(currentId, currentData);
        }

        // Attach keyboard navigation for world map
        this.attachWorldMapKeyboard();
    }
    
    /**
     * Create area nodes on the map
     */
    createAreaNodes(worldMap, positions) {
        const areas = window.AreaData.areas;
        
        Object.entries(areas).forEach(([areaId, areaData]) => {
            const position = positions[areaId];
            if (!position) return;
            
            const node = document.createElement('div');
            node.className = `area-node ${areaData.type}`;
            node.dataset.areaId = areaId;
            
            // Position the node
            node.style.left = `${position.x}%`;
            node.style.top = `${position.y}%`;
            node.style.transform = 'translate(-50%, -50%)';
            
            // Check if area is unlocked
            const isUnlocked = this.isAreaUnlocked(areaId, areaData);
            const isCurrentLocation = areaId === this.currentPlayerArea;
            
            if (!isUnlocked) {
                node.classList.add('locked');
            }
            
            if (isCurrentLocation) {
                node.classList.add('current');
            }
            
            // Create node content
            const icon = this.getAreaIcon(areaData.type);
            const label = this.getAreaShortName(areaData.name);
            
            node.innerHTML = `
                <div class="area-icon">${icon}</div>
                <div class="area-label">${label}</div>
            `;
            
            // Add click handler
            if (isUnlocked) {
                node.addEventListener('click', () => this.selectArea(areaId, areaData));
            }
            
            worldMap.appendChild(node);
        });
    }
    
    /**
     * Create visual connections between areas
     */
    createAreaConnections(worldMap, positions) {
        const areas = window.AreaData.areas;
        
        Object.entries(areas).forEach(([areaId, areaData]) => {
            const startPos = positions[areaId];
            if (!startPos || !areaData.connections) return;
            
            areaData.connections.forEach(connectedAreaId => {
                const endPos = positions[connectedAreaId];
                if (!endPos) return;
                
                // Calculate connection line
                const connection = this.createConnectionLine(startPos, endPos, areaId, connectedAreaId);
                if (connection) {
                    worldMap.appendChild(connection);
                }
            });
        });
    }
    
    /**
     * Create a connection line between two areas
     */
    createConnectionLine(startPos, endPos, startId, endId) {
        const line = document.createElement('div');
        line.className = 'area-connection';
        
        // Calculate line position and rotation
        const deltaX = endPos.x - startPos.x;
        const deltaY = endPos.y - startPos.y;
        const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        // Position and style the line
        line.style.width = `${length}%`;
        line.style.left = `${startPos.x}%`;
        line.style.top = `${startPos.y}%`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.transformOrigin = '0 50%';
        
        // Check if connection is unlocked
        const startUnlocked = this.isAreaUnlocked(startId);
        const endUnlocked = this.isAreaUnlocked(endId);
        
        if (startUnlocked && endUnlocked) {
            line.classList.add('unlocked');
        } else {
            line.classList.add('locked');
        }
        
        return line;
    }
    
    /**
     * Get appropriate icon for area type
     */
    getAreaIcon(type) {
        const icons = {
            town: '🏘️',
            wilderness: '🌲',
            dungeon: '🏰',
            desert: '🏜️',
            mountain: '⛰️',
            cave: '🕳️',
            ruins: '🏛️',
            swamp: '🌿'
        };
        return icons[type] || '📍';
    }
    
    /**
     * Get shortened area name for display
     */
    getAreaShortName(fullName) {
        const shortNames = {
            'Peaceful Village': 'Village',
            'Forest Path': 'Forest',
            'Deep Forest': 'Deep',
            'Mountain Pass': 'Mountain',
            'Desert Oasis': 'Oasis',
            'Ancient Ruins': 'Ruins',
            'Crystal Cave': 'Cave',
            'Haunted Swamp': 'Swamp',
            'Dragon Peak': 'Peak'
        };
        return shortNames[fullName] || fullName.split(' ')[0];
    }
    
    /**
     * Check if an area is unlocked based on requirements
     */
    isAreaUnlocked(areaId, areaData = null) {
        if (!areaData) {
            areaData = window.AreaData?.areas[areaId];
        }
        
        if (!areaData) return false;
        
        // Always unlocked areas
        if (areaData.unlocked === true) return true;
        
        // Check unlock requirements
        const requirements = areaData.unlockRequirements || {};
        
        // Story requirements
        if (requirements.story && window.GameState?.story) {
            const storyFlags = window.GameState.story.flags || [];
            if (!storyFlags.includes(requirements.story)) {
                return false;
            }
        }
        
        // Level requirements
        if (requirements.level && window.GameState?.player) {
            if (window.GameState.player.level < requirements.level) {
                return false;
            }
        }
        
        // Default to unlocked if no specific requirements
        return true;
    }
    
    /**
     * Select an area and show its details
     */
    selectArea(areaId, areaData) {
        // Remove previous selection
        document.querySelectorAll('.area-node').forEach(node => {
            node.classList.remove('selected');
        });
        
        // Add selection to clicked area
        const selectedNode = document.querySelector(`[data-area-id="${areaId}"]`);
        if (selectedNode) {
            selectedNode.classList.add('selected');
        }
        
        // Store selection
        this.selectedArea = areaId;
        
        // Show area details
        this.displayAreaDetails(areaId, areaData);
    }
    
    /**
     * Display detailed information about an area
     */
    displayAreaDetails(areaId, areaData) {
        // Hide no-selection prompt
        const noSelection = document.querySelector('.no-area-selected');
        if (noSelection) noSelection.style.display = 'none';
        
        // Show area info panel
        const areaInfo = document.getElementById('area-info');
        if (areaInfo) {
            areaInfo.classList.remove('hidden');
            
            // Update basic info
            const iconEl = document.getElementById('area-icon');
            const nameEl = document.getElementById('area-name');
            const typeEl = document.getElementById('area-type');
            const descEl = document.getElementById('area-description');
            
            if (iconEl) iconEl.textContent = this.getAreaIcon(areaData.type);
            if (nameEl) nameEl.textContent = areaData.name;
            if (typeEl) typeEl.textContent = areaData.type;
            if (descEl) descEl.textContent = areaData.description;

            // Story pill visibility: show if any uncompleted story events are available
            try {
                const pill = document.getElementById('story-pill');
                if (pill && typeof AreaData !== 'undefined') {
                    const gs = this.game?.getGameState ? this.game.getGameState() : null;
                    const flags = gs?.world?.storyFlags || [];
                    const completed = gs?.world?.completedEvents || [];
                    const events = (AreaData.getArea(areaId)?.storyEvents || [])
                        .filter(e => !completed.includes(e) && !flags.includes(`${e}_completed`));
                    pill.classList.toggle('hidden', events.length === 0);
                }
            } catch (e) { /* no-op */ }
            
            // Update stats
            this.updateAreaStats(areaData);
            
            // Update action buttons
            this.updateAreaActionButtons(areaId, areaData);
        }
    }
    
    /**
     * Update area statistics display
     */
    updateAreaStats(areaData) {
        // Encounter rate
        const encounterRateEl = document.getElementById('encounter-rate');
        if (encounterRateEl) {
            encounterRateEl.textContent = `${areaData.encounterRate || 0}%`;
        }
        
        // Monster count
        const monsterCountEl = document.getElementById('monster-count');
        if (monsterCountEl) {
            const monsterCount = areaData.monsters ? areaData.monsters.length : 0;
            monsterCountEl.textContent = monsterCount;
        }
        
        // Monsters list
        this.updateMonstersList(areaData.monsters || []);
        
        // Services list
        this.updateServicesList(areaData.services || []);
        
        // Connections list
        this.updateConnectionsList(areaData.connections || []);
    }
    
    /**
     * Update monsters list display
     */
    updateMonstersList(monsters) {
        const monstersListEl = document.getElementById('monsters-list');
        if (!monstersListEl) return;
        
        monstersListEl.innerHTML = '';
        
        if (monsters.length === 0) {
            const noMonsters = document.createElement('span');
            noMonsters.textContent = 'No monsters';
            noMonsters.style.color = 'var(--light-brown)';
            noMonsters.style.fontStyle = 'italic';
            monstersListEl.appendChild(noMonsters);
            return;
        }
        
        monsters.forEach(monsterId => {
            const icon = document.createElement('span');
            icon.className = 'monster-icon';
            icon.textContent = this.getMonsterIcon(monsterId);
            icon.title = monsterId.replace('_', ' ');
            monstersListEl.appendChild(icon);
        });
    }
    
    /**
     * Update services list display
     */
    updateServicesList(services) {
        const servicesListEl = document.getElementById('services-list');
        if (!servicesListEl) return;
        
        servicesListEl.innerHTML = '';
        
        if (services.length === 0) {
            const noServices = document.createElement('span');
            noServices.textContent = 'No services';
            noServices.style.color = 'var(--light-brown)';
            noServices.style.fontStyle = 'italic';
            servicesListEl.appendChild(noServices);
            return;
        }
        
        services.forEach(service => {
            const icon = document.createElement('span');
            icon.className = 'service-icon';
            icon.textContent = this.getServiceIcon(service);
            icon.title = service.replace('_', ' ');
            servicesListEl.appendChild(icon);
        });
    }
    
    /**
     * Get service icon
     */
    getServiceIcon(service) {
        const icons = {
            shop: '🏪',
            inn: '🏨',
            save_point: '💾',
            blacksmith: '⚒️',
            temple: '⛪',
            guild: '🏢'
        };
        return icons[service] || '📍';
    }
    
    /**
     * Update connections list display
     */
    updateConnectionsList(connections) {
        const connectionsListEl = document.getElementById('connections-list');
        if (!connectionsListEl) return;
        
        connectionsListEl.innerHTML = '';
        
        if (connections.length === 0) {
            const noConnections = document.createElement('span');
            noConnections.textContent = 'No connections';
            noConnections.style.color = 'var(--light-brown)';
            noConnections.style.fontStyle = 'italic';
            connectionsListEl.appendChild(noConnections);
            return;
        }
        
        connections.forEach(connectionId => {
            const areaData = window.AreaData?.areas[connectionId];
            if (!areaData) return;
            
            const item = document.createElement('div');
            item.className = 'connection-item';
            
            const isUnlocked = this.isAreaUnlocked(connectionId);
            if (!isUnlocked) {
                item.classList.add('locked');
            }
            
            item.innerHTML = `
                <span class="connection-icon">${this.getAreaIcon(areaData.type)}</span>
                <span class="connection-name">${areaData.name}</span>
                ${!isUnlocked ? '<span class="lock-icon">🔒</span>' : ''}
            `;
            
            connectionsListEl.appendChild(item);
        });
    }
    
    /**
     * Update area action buttons
     */
    updateAreaActionButtons(areaId, areaData) {
        const travelBtn = document.getElementById('travel-to-area');
        const exploreBtn = document.getElementById('explore-area');
        
        const gs = this.game?.getGameState ? this.game.getGameState() : null;
        const isCurrentLocation = areaId === (gs?.world?.currentArea || this.currentPlayerArea);
        // Unlocked check
        const isUnlocked = this.isAreaUnlocked(areaId, areaData);
        // Connectivity check: allow if same area, otherwise require connection from current
        let isConnected = true;
        if (!isCurrentLocation && gs && typeof AreaData !== 'undefined') {
            const conns = AreaData.getConnectedAreas(gs.world.currentArea) || [];
            isConnected = conns.includes(areaId);
        }
        const canTravel = !isCurrentLocation && isUnlocked && isConnected;
        const canExplore = areaData.encounterRate > 0 && isCurrentLocation;
        
        if (travelBtn) {
            travelBtn.disabled = !canTravel;
            if (isCurrentLocation) {
                travelBtn.querySelector('.btn-text').textContent = 'Current Location';
            } else {
                travelBtn.querySelector('.btn-text').textContent = 'Travel Here';
            }
        }
        
        if (exploreBtn) {
            exploreBtn.disabled = !canExplore;
        }
    }
    
    /**
     * Update player location display
     */
    updatePlayerLocationDisplay() {
        const currentAreaEl = document.getElementById('current-area');
        if (currentAreaEl && window.AreaData) {
            const areaData = window.AreaData.areas[this.currentPlayerArea];
            if (areaData) {
                currentAreaEl.textContent = areaData.name;
            }
        }
    }
    
    /**
     * Update quick travel buttons
     */
    updateQuickTravelButtons() {
        const buttonsContainer = document.getElementById('quick-travel-buttons');
        if (!buttonsContainer || !window.AreaData) return;
        
        buttonsContainer.innerHTML = '';
        
        // Get unlocked town/safe areas for quick travel
        const quickTravelAreas = Object.entries(window.AreaData.areas)
            .filter(([areaId, areaData]) => 
                areaData.type === 'town' && 
                this.isAreaUnlocked(areaId, areaData) &&
                areaId !== this.currentPlayerArea
            );
        
        if (quickTravelAreas.length === 0) {
            const noTravel = document.createElement('span');
            noTravel.textContent = 'No quick travel locations available';
            noTravel.style.color = 'var(--light-brown)';
            noTravel.style.fontStyle = 'italic';
            buttonsContainer.appendChild(noTravel);
            return;
        }
        
        quickTravelAreas.forEach(([areaId, areaData]) => {
            const btn = document.createElement('button');
            btn.className = 'quick-travel-btn';
            btn.textContent = areaData.name;
            btn.addEventListener('click', () => this.quickTravelToArea(areaId));
            buttonsContainer.appendChild(btn);
        });
    }
    
    /**
     * Travel to selected area
     */
    travelToSelectedArea() {
        if (!this.selectedArea) return;
        const gs = this.game?.getGameState ? this.game.getGameState() : null;
        if (!gs || typeof AreaData === 'undefined') return;
        if (this.selectedArea === gs.world.currentArea) {
            this.showNotification('Already at this location', 'info');
            return;
        }
        const ok = gs.travelToArea(this.selectedArea);
        if (!ok) {
            this.showNotification('Cannot travel to that area from here', 'error');
            return;
        }
        this.currentPlayerArea = gs.world.currentArea;
        this.initializeWorldMap();
        const name = window.AreaData.areas[this.selectedArea]?.name || this.selectedArea;
        this.showNotification(`Traveled to ${name}`);
        this.autoSaveIfEnabled('travel');
        // After travel, try to trigger story for new area (MVP)
        try { 
            console.log('Attempting to trigger story event after travel...');
            this.triggerStoryEventIfAvailable(this.currentPlayerArea); 
        } catch (e) { 
            console.warn('Story trigger after travel failed:', e); 
        }
    }

    /** Keyboard navigation on world map screen */
    attachWorldMapKeyboard() {
        if (this._worldMapKeyHandler) return;
        this._worldMapKeyHandler = (e) => this.handleWorldMapScreenKeys(e);
        document.addEventListener('keydown', this._worldMapKeyHandler);
    }

    detachWorldMapKeyboard() {
        if (this._worldMapKeyHandler) {
            document.removeEventListener('keydown', this._worldMapKeyHandler);
            this._worldMapKeyHandler = null;
        }
    }

    handleWorldMapScreenKeys(e) {
        if (this.currentScene?.name !== 'game_world') return;
        const selectable = Array.from(document.querySelectorAll('.area-node'))
            .filter(n => !n.classList.contains('locked'));
        if (selectable.length === 0) return;
        const currentIndex = selectable.findIndex(n => n.classList.contains('selected'));
        const move = (delta) => {
            let idx = currentIndex;
            idx = idx < 0 ? 0 : idx;
            idx = (idx + delta + selectable.length) % selectable.length;
            const node = selectable[idx];
            const id = node?.dataset?.areaId;
            if (id && window.AreaData?.areas[id]) {
                this.selectArea(id, window.AreaData.areas[id]);
                node.scrollIntoView({ block: 'nearest', inline: 'nearest' });
            }
        };
        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                move(1);
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                move(-1);
                break;
            case 'Enter':
                e.preventDefault();
                this.travelToSelectedArea();
                break;
            case 'Escape':
                // Go back to previous scene if any
                e.preventDefault();
                this.returnToPrevious();
                break;
        }
    }
    
    /**
     * Quick travel to area
     */
    quickTravelToArea(areaId) {
        this.currentPlayerArea = areaId;
        
        // Update game state
        if (window.GameState) {
            window.GameState.currentArea = areaId;
        }
        
        // Refresh the map display
        this.initializeWorldMap();
        
        this.showNotification(`Quick traveled to ${window.AreaData.areas[areaId]?.name}`);
        this.autoSaveIfEnabled('quick-travel');
    }
    
    /**
     * Explore current area
     */
    exploreSelectedArea() {
        if (!this.selectedArea) return;
        
        // Trigger exploration/encounter system
        if (window.GameState && window.GameState.triggerRandomEncounter) {
            window.GameState.triggerRandomEncounter(this.selectedArea);
        } else {
            this.showNotification(`Exploring ${window.AreaData.areas[this.selectedArea]?.name}...`);
        }

        // MVP: attempt to trigger a story event available for this area
        try { this.triggerStoryEventIfAvailable(this.selectedArea); } catch {}
    }

    /**
     * Center map on player location
     */
    centerMapOnPlayer() {
        // Find current player node and ensure it's visible
        const currentNode = document.querySelector('.area-node.current');
        if (currentNode) {
            currentNode.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center', 
                inline: 'center' 
            });
        }
    }
}

/**
 * Scene Class
 * Represents a single UI scene/screen
 */
class Scene {
    constructor(name, config) {
        this.name = name;
        this.config = config;
        this.visible = false;
        this.initialized = false;
    }
    
    /**
     * Show this scene
     */
    show() {
        if (this.config.element) {
            // Hide all other screens first
            document.querySelectorAll('.screen').forEach(screen => {
                screen.classList.remove('active');
            });
            
            // Show this screen
            this.config.element.classList.add('active');
            this.visible = true;
            
            // Scene-specific initialization
            this.onShow();
        }
    }
    
    /**
     * Hide this scene
     */
    hide() {
        if (this.config.element) {
            this.config.element.classList.remove('active');
            this.visible = false;
            
            this.onHide();
        }
    }
    
    /**
     * Update scene
     */
    update(deltaTime) {
        if (!this.visible) return;
        
        // Scene-specific update logic
        this.onUpdate(deltaTime);
    }
    
    /**
     * Scene-specific show handler
     */
    onShow() {
        // Override in subclasses
    }
    
    /**
     * Scene-specific hide handler
     */
    onHide() {
        // Override in subclasses
    }
    
    /**
     * Scene-specific update handler
     */
    onUpdate(deltaTime) {
        // Override in subclasses
    }
    
    /**
     * Get monster icon based on species
     */
    getMonsterIcon(species) {
        const iconMap = {
            // Common monsters
            'slime': '💧',
            'goblin': '👹',
            'wolf': '🐺',
            'orc': '😤',
            
            // Forest monsters
            'dire_wolf': '🐺',
            'alpha_wolf': '🐺',
            'treant': '🌲',
            
            // Plains monsters
            'wild_horse': '🐎',
            'hawk': '🦅',
            
            // Mountain monsters
            'mountain_goat': '🐐',
            'rock_lizard': '🦎',
            
            // Cave monsters
            'bat': '🦇',
            'crystal_spider': '🕷️',
            'gem_slime': '💎',
            'cave_troll': '👹',
            
            // Volcanic monsters
            'fire_sprite': '🔥',
            'fire_bat': '🦇',
            'salamander': '🦎',
            'lava_golem': '🔥',
            
            // Dragon peak monsters
            'dragon_whelp': '🐉',
            'wyvern': '🐲',
            'fire_drake': '🐉',
            'ancient_dragon': '🐉',
            
            // Mystic grove monsters
            'nature_sprite': '🧚',
            'fairy': '🧚',
            'unicorn': '🦄',
            
            // Ancient ruins monsters
            'guardian_golem': '🗿',
            'shadow_wraith': '👻',
            'ancient_spirit': '👻',
            'guardian_titan': '🗿',
            
            // Legendary monsters
            'phoenix_chick': '🐤',
            'phoenix': '🔥'
        };
        
        return iconMap[species] || '❓';
    }
    
    /**
     * Get filtered monsters based on current filter settings
     */
    getFilteredMonsters(monsters) {
        const typeFilter = document.getElementById('type-filter')?.value;
        const rarityFilter = document.getElementById('rarity-filter')?.value;
        
        return monsters.filter(monster => {
            // Get species data for filtering
            const speciesData = window.MonsterData?.getSpecies(monster.species);
            if (!speciesData) return true; // Show if no species data available
            
            // Type filter
            if (typeFilter && !speciesData.type.includes(typeFilter)) {
                return false;
            }
            
            // Rarity filter
            if (rarityFilter && speciesData.rarity !== rarityFilter) {
                return false;
            }
            
            return true;
        });
    }
    
    // showMonsterSelection method moved to MonsterUI module
    
    // addMonsterToPartySlot method moved to MonsterUI module
    
    /**
     * Show monster details modal
     */
    showMonsterDetails(monster) {
        const modal = document.getElementById('monster-detail-modal');
        const nameEl = document.getElementById('modal-monster-name');
        
        if (!modal || !monster) return;
        
        // Update modal content
        if (nameEl) {
            nameEl.textContent = monster.nickname || monster.speciesData?.name || monster.species;
        }
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Store current monster for modal actions
        this.currentModalMonster = monster;
    }
    
    // closeMonsterModal method moved to MonsterUI module
    
    // healAllPartyMonsters method moved to MonsterUI module
    
    // autoArrangeParty method moved to MonsterUI module
    
    // releaseSelectedMonsters method moved to MonsterUI module
    
    // sortStorage method moved to MonsterUI module
    
    // startBreeding method moved to MonsterUI module
    
    // clearBreedingSelection method moved to MonsterUI module
    
    // updateBreedingSlots method moved to MonsterUI module
    
    // selectBreedingParent method moved to MonsterUI module
    
    // updateBreedingCompatibility method moved to MonsterUI module
    
    // updateBreedingHistory method moved to MonsterUI module
    
    // ================================================
    // INVENTORY & EQUIPMENT MANAGEMENT
    // ================================================
    
    /**
     * Initialize inventory interface
     */
    initializeInventory() {
        this.currentInventoryTab = 'equipment';
        this.selectedItem = null;
        this.equipmentFilter = 'all';
        this.itemsFilter = 'all';
        this.materialsFilter = 'all';
        
        this.updateInventoryData();
        this.attachInventoryEventHandlers();
        this.switchInventoryTab('equipment');
    }
    
    /**
     * Update inventory data display (consolidated)
     */
    updateInventoryData() {
        const gs = this.game.getGameState();
        if (!gs) return;
        // Gold
        const goldDisplay = document.getElementById('player-gold');
        if (goldDisplay) goldDisplay.textContent = (gs.player.inventory.gold ?? 0).toLocaleString();
        // Character + equipment
        this.updateCharacterStatsDisplay?.();
        this.updateEquipmentSlots?.(gs.player.equipment);
        // Lists
        const ef = this.equipmentFilter || 'all';
        const iflt = this.itemsFilter || 'all';
        const mf = this.materialsFilter || 'all';
        this.renderEquipmentList?.(ef);
        this.renderItemsGrid?.(iflt);
        this.renderMaterialsGrid?.(mf);
    }
    
    /**
     * Update character display panel (legacy wrapper)
     */
    updateCharacterDisplay() {
        const gs = this.game.getGameState();
        if (!gs) return;
        // Basic header
        const nameEl = document.getElementById('character-name');
        const classEl = document.getElementById('character-class');
        const levelEl = document.getElementById('character-level');
        if (nameEl) nameEl.textContent = gs.player.name || 'Player';
        if (classEl) classEl.textContent = (gs.player.class || '').toString();
        if (levelEl) levelEl.textContent = gs.player.level || 1;
        this.updateCharacterStatsDisplay?.();
    }
    
    /**
     * Update character stats display
     */
    updateCharacterStats() {
        const gs = this.game.getGameState();
        if (!gs) return;
        
        const stats = gs.player.getEffectiveStats();
        const statMapping = {
            'stat-hp': 'hp',
            'stat-mp': 'mp',
            'stat-attack': 'attack',
            'stat-defense': 'defense',
            'stat-magic-attack': 'magicAttack',
            'stat-magic-defense': 'magicDefense',
            'stat-speed': 'speed',
            'stat-accuracy': 'accuracy'
        };
        
        for (const [elementId, statKey] of Object.entries(statMapping)) {
            const element = document.getElementById(elementId);
            if (element && stats[statKey] !== undefined) {
                element.textContent = stats[statKey];
            }
        }
    }
    
    /**
     * Update equipment display (legacy wrapper)
     */
    updateEquipmentDisplay() {
        const gs = this.game.getGameState();
        if (!gs) return;
        this.updateEquipmentSlots?.(gs.player.equipment);
    }
    
    /**
     * Switch inventory tab
     */
    switchInventoryTab(tabName) {
        this.currentInventoryTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.inventory-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        // Populate content for current tab
        switch (tabName) {
            case 'equipment':
                this.renderEquipmentList?.();
                break;
            case 'items':
                this.renderItemsGrid?.();
                break;
            case 'materials':
                this.renderMaterialsGrid?.();
                break;
        }
    }
    
    /**
     * Populate equipment list (legacy wrapper -> renderEquipmentList)
     */
    populateEquipmentList() {
        const filter = this.equipmentFilter || 'all';
        this.renderEquipmentList?.(filter);
    }
    
    /**
     * Get item stats as string
     */
    getItemStatsString(item) {
        if (!item.stats) return '';
        
        const statStrings = [];
        for (const [stat, value] of Object.entries(item.stats)) {
            const sign = value >= 0 ? '+' : '';
            statStrings.push(`${stat}: ${sign}${value}`);
        }
        
        return statStrings.join(', ');
    }
    
    /**
     * Show item detail modal (legacy wrapper)
     */
    showItemDetail(itemId) {
        this.openItemDetail?.(itemId);
    }
    
    /**
     * Attach inventory event handlers
     */
    attachInventoryEventHandlers() {
        // Tab navigation
        document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchInventoryTab(btn.getAttribute('data-tab'));
            });
        });
        
        // Equipment filters
        document.querySelectorAll('.equipment-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setEquipmentFilter(btn.getAttribute('data-filter'));
            });
        });
        
        // Items filters
        document.querySelectorAll('.items-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setItemsFilter(btn.getAttribute('data-filter'));
            });
        });
        
        // Materials filters
        document.querySelectorAll('.materials-filters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setMaterialsFilter(btn.getAttribute('data-filter'));
            });
        });
        
        // Modal close
        const closeBtn = document.getElementById('close-item-detail');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideItemDetail());
        }
        
        // Modal action buttons
        const equipBtn = document.getElementById('equip-item-btn');
        const useBtn = document.getElementById('use-item-btn');
        const sellBtn = document.getElementById('sell-item-btn');
        
        if (equipBtn) {
            equipBtn.addEventListener('click', () => {
                if (this.selectedItem) this.equipItem(this.selectedItem);
            });
        }
        
        if (useBtn) {
            useBtn.addEventListener('click', () => {
                if (this.selectedItem) this.useItem(this.selectedItem);
            });
        }
        
        if (sellBtn) {
            sellBtn.addEventListener('click', () => {
                if (this.selectedItem) this.sellItem(this.selectedItem);
            });
        }
        
        // Back button
        const backBtn = document.getElementById('back-from-inventory');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showScene('game_world');
            });
        }
        
        // Equipment slots (for unequipping)
        document.querySelectorAll('.equipment-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const slotType = slot.getAttribute('data-slot');
                this.unequipItem(slotType);
            });
        });
        
        // Close modal on background click
        const modal = document.getElementById('item-detail-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideItemDetail();
                }
            });
        }
    }
    
    /**
     * Set equipment filter
     */
    setEquipmentFilter(filter) {
        this.equipmentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.equipment-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
        });
        
        this.renderEquipmentList?.(filter);
    }
    
    /**
     * Set items filter
     */
    setItemsFilter(filter) {
        this.itemsFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.items-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
        });
        
        this.renderItemsGrid?.(filter);
    }
    
    /**
     * Set materials filter
     */
    setMaterialsFilter(filter) {
        this.materialsFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.materials-filters .filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
        });
        
        this.renderMaterialsGrid?.(filter);
    }
    
    /**
     * Populate items grid (legacy wrapper -> renderItemsGrid)
     */
    populateItemsGrid() {
        const filter = this.itemsFilter || 'all';
        this.renderItemsGrid?.(filter);
    }
    
    /**
     * Populate materials grid (legacy wrapper -> renderMaterialsGrid)
     */
    populateMaterialsGrid() {
        const filter = this.materialsFilter || 'all';
        this.renderMaterialsGrid?.(filter);
    }
    
    /**
     * Hide item detail modal
     */
    hideItemDetail() {
        const modal = document.getElementById('item-detail-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.selectedItem = null;
    }
    
    /**
     * Equip item
     */
    equipItem(itemId) {
        const gs = this.game.getGameState();
        if (!gs || !window.ItemData) return;
        
        const item = window.ItemData.getItem(itemId);
        if (!item || !['weapon', 'armor', 'accessory'].includes(item.type)) return;
        
        if (!window.ItemData.canPlayerUseItem(itemId, gs.player)) {
            this.showNotification('Cannot equip this item', 'error');
            return;
        }
        
        const slot = item.type;
        const prev = gs.player.equipment[slot];
        if (prev) {
            gs.player.inventory.items[prev] = (gs.player.inventory.items[prev] || 0) + 1;
        }
        gs.player.equipment[slot] = itemId;
        
        // Decrement inventory for the equipped item
        if (gs.player.inventory.items[itemId] != null) {
            gs.player.inventory.items[itemId]--;
            if (gs.player.inventory.items[itemId] <= 0) {
                delete gs.player.inventory.items[itemId];
            }
        }
        
        this.showNotification(`Equipped ${item.name}`, 'success');
        this.hideItemDetail();
        this.updateInventoryData();
        this.autoSaveIfEnabled('equip');
    }

/**
 * Sell item
 */
sellItem(itemId) {
    const gs = this.game.getGameState();
    if (!gs || !window.ItemData) return;
    
    const item = window.ItemData.getItem(itemId);
    if (!item) return;
    
    // Check if player has the item
    if (!gs.player.inventory.items[itemId] || gs.player.inventory.items[itemId] <= 0) {
        this.showNotification('You don\'t have this item!', 'error');
        return;
    }
    
    const sellPrice = Math.floor(item.value * 0.5); // Sell for half value
    
    // Remove item and add gold
    gs.player.inventory.items[itemId]--;
    if (gs.player.inventory.items[itemId] <= 0) {
        delete gs.player.inventory.items[itemId];
    }
    gs.player.inventory.gold += sellPrice;
    
    this.showNotification(`Sold ${item.name} for ${sellPrice} gold`, 'success');
    this.hideItemDetail();
    this.updateInventoryData();
    this.autoSaveIfEnabled('sell-item');
}

/**
 * Unequip item from slot
 */
unequipItem(slotType) {
    const gs = this.game.getGameState();
    if (!gs || typeof gs.unequipItem !== 'function') return;
    const res = gs.unequipItem(slotType);
    if (res?.ok) {
        // Refresh UI panels
        if (typeof this.updateEquipmentSlots === 'function') {
            this.updateEquipmentSlots(gs.player.equipment);
        } else {
            this.updateEquipmentDisplay?.();
        }
        this.updateCharacterStatsDisplay?.();
        this.updateInventoryData?.();
        this.autoSaveIfEnabled('unequip');
    }
}
}

// Make available globally
window.UIManager = UIManager;
window.Scene = Scene;

// Ensure inventory initializer exists to avoid runtime errors
if (typeof UIManager !== 'undefined' && !UIManager.prototype.initializeInventory) {
    UIManager.prototype.initializeInventory = function() {
        try {
            // Default tab
            this.currentInventoryTab = 'equipment';
            // Populate UI
            if (typeof this.updateInventoryData === 'function') {
                this.updateInventoryData();
            }
            // Attach handlers
            if (typeof this.attachInventoryEventHandlers === 'function') {
                this.attachInventoryEventHandlers();
            }
            // Switch to equipment tab if helper exists
            if (typeof this.switchInventoryTab === 'function') {
                this.switchInventoryTab('equipment');
            }
        } catch (e) {
            console.error('initializeInventory failed:', e);
        }
    };
}

// Fallback: ensure world map overlay exists for tests even before UIManager construction
// Disabled to avoid conflicts with UIManager overlay creation
// try {
//     if (typeof document !== 'undefined' && !document.getElementById('world-map-overlay')) {
//         const el = document.createElement('div');
//         el.id = 'world-map-overlay';
//         el.style.display = 'none';
//         const parent = document.body || document.documentElement || document;
//         parent.appendChild(el);
//     }
// } catch (e) {
//     // ignore in non-DOM environments
// }