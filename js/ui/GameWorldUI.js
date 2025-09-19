/**
 * Game World UI Module
 * Handles world map, area selection, travel, and exploration interfaces
 * Extracted from original ui.js lines ~316-613, 1771-1793
 */

class GameWorldUI extends BaseUIModule {
    constructor(uiManager, options = {}) {
        super('GameWorldUI', uiManager, {
            scenes: ['game_world'],
            dependencies: ['UIHelpers', 'SceneManager'],
            ...options
        });
        
        // World map state
        this.worldMapOverlay = null;
        this.worldMapButtons = [];
        this.worldMapIndex = 0;
        this.worldMapKeyHandler = null;
        this.selectedArea = null;
        this.currentPlayerArea = 'starting_village';
        this.worldMap = null; // inline world map system (renders into #world-map)
        
        console.log('✅ GameWorldUI initialized');
    }

    /**
     * Initialize the game world UI module
     */
    async init() {
        await super.init();
        
        // Get references to dependencies
        this.gameState = this.getGameReference('gameState');
        
        // Initialize world map overlay early for tests
        this.ensureWorldMapOverlay();
        // Initialize inline world map (renders into #world-map container)
        this.ensureInlineWorldMap();

        // Inject progression indicator styles
        this.injectProgressionStyles();

        console.log('🌍 GameWorldUI initialization completed');
        return true;
    }

    /**
     * Attach event listeners for game world functionality
     */
    attachEvents() {
        super.attachEvents();
        
        // World map interface
        this.attachWorldMapInterface();
        
        console.log('🔗 GameWorldUI events attached');
    }

    /**
     * Show the game world UI
     */
    show(sceneName = 'game_world') {
        super.show();
        
        // Initialize world map if not already done
        if (!this.worldMapOverlay) {
            this.ensureWorldMapOverlay();
        }
        
        // Update current player area from game state
        if (!this.gameState) {
            this.gameState = this.getGameReference('gameState');
        }
        if (this.gameState && this.gameState.world) {
            this.currentPlayerArea = this.gameState.world.currentArea || 'starting_village';
        }
        
        // Attach keyboard navigation for main world map
        this.attachWorldMapKeyboard();

        // Ensure the inline world map is rendered for the current area
        this.ensureInlineWorldMap();
        this.renderInlineWorldMap();
        // Update details panel to reflect current area
        try {
            if (window.AreaData && window.AreaData.getArea) {
                const areaData = window.AreaData.getArea(this.currentPlayerArea);
                if (areaData) {
                    this.selectedArea = this.currentPlayerArea;
                    this.displayAreaDetails(this.currentPlayerArea, areaData);
                    // Ensure action buttons are properly updated for current area
                    this.updateAreaActionButtons(this.currentPlayerArea, areaData);
                    console.log(`🔧 Auto-selected current area: ${this.currentPlayerArea}`);
                } else {
                    console.warn(`Area data not found for: ${this.currentPlayerArea}`);
                }
            } else {
                console.warn('AreaData not available or missing getArea method');
            }
        } catch (e) {
            console.warn('Failed to auto-select current area:', e);
        }
        
        console.log(`🗺️ GameWorldUI showing scene: ${sceneName}`);
    }

    /**
     * Hide the game world UI
     */
    hide() {
        // Close world map overlay if open
        this.closeWorldMapOverlay();
        
        // Detach keyboard navigation
        this.detachWorldMapKeyboard();
        
        super.hide();
        console.log('👋 GameWorldUI hidden');
    }

    // ================================================
    // WORLD MAP OVERLAY MANAGEMENT
    // ================================================

    /**
     * Ensure world map overlay exists in DOM
     * Extracted from original ui.js ensureWorldMapOverlay method (lines 317-419)
     */
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
            this.addEventListener(closeBtn, 'click', () => this.closeWorldMapOverlay());
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
            this.addEventListener(overlay, 'click', (e) => {
                if (e.target === overlay) this.closeWorldMapOverlay();
            });
            overlay.setAttribute('data-click-handler-added', 'true');
        }
        
        this.worldMapOverlay = overlay;
        return overlay;
    }

    /**
     * Ensure the inner list element exists and return it
     * Extracted from original ui.js getOrCreateWorldMapList method (lines 422-474)
     */
    getOrCreateWorldMapList() {
        this.ensureWorldMapOverlay();
        let list = this.worldMapOverlay.querySelector('#world-map-list');
        
        if (!list) {
            // Rebuild inner structure if somehow missing
            const existingPanel = this.worldMapOverlay.querySelector('[data-role="world-map-panel"]');
            if (existingPanel) existingPanel.remove();
            
            // Recreate panel fully
            const overlay = this.worldMapOverlay;
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
            this.addEventListener(closeBtn, 'click', () => this.closeWorldMapOverlay());
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

    /**
     * Show world map overlay
     * Extracted from original ui.js showWorldMap method (lines 1781-1800)
     */
    showWorldMap() {
        // Always create and show overlay so UI tests can assert presence
        this.ensureWorldMapOverlay();
        const gs = this.gameState || this.getGameReference('gameState');
        
        if (!gs || typeof window.AreaData === 'undefined') {
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
     * Open world map overlay with populated areas
     * Extracted from original ui.js openWorldMapOverlay method
     */
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
                // Find first non-disabled
                const idx = this.worldMapButtons.findIndex(b => !b.disabled);
                this.worldMapIndex = idx >= 0 ? idx : 0;
                this.focusWorldMapIndex();
            }
            
            // Setup keyboard navigation
            if (!this.worldMapKeyHandler) {
                this.worldMapKeyHandler = (e) => this.handleWorldMapKeys(e);
                document.addEventListener('keydown', this.worldMapKeyHandler);
            }
        }
    }

    /**
     * Close world map overlay
     * Extracted from original ui.js closeWorldMapOverlay method
     */
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

    // ================================================
    // AREA POPULATION AND MANAGEMENT
    // ================================================

    /**
     * Populate world map areas
     * Extracted from original ui.js populateWorldMapAreas method
     */
    populateWorldMapAreas() {
        const gs = this.gameState || this.getGameReference('gameState');
        if (!gs || typeof window.AreaData === 'undefined') return;
        
        const list = this.getOrCreateWorldMapList();
        list.innerHTML = '';
        this.worldMapButtons = [];
        
        const unlocked = window.AreaData.getUnlockedAreas(
            gs.world.storyFlags,
            gs.player.level,
            Object.keys(gs.player.inventory.items),
            gs.player.class
        );
        
        const connections = window.AreaData.getConnectedAreas(gs.world.currentArea) || [];
        
        // Filter to only connected (plus current area as disabled)
        const candidates = unlocked.filter(a => 
            a === gs.world.currentArea || connections.includes(a)
        );
        
        candidates.forEach(areaName => {
            const btn = document.createElement('button');
            const area = window.AreaData.getArea(areaName);
            const displayName = area?.name || areaName;
            const current = areaName === gs.world.currentArea;
            
            btn.textContent = displayName + (current ? ' (Current)' : '');
            btn.style.padding = '8px 12px';
            btn.style.background = current ? '#065f46' : '#374151';
            btn.style.color = '#e5e7eb';
            btn.style.border = '1px solid #4b5563';
            btn.style.borderRadius = '4px';
            btn.style.cursor = current ? 'default' : 'pointer';
            btn.style.textAlign = 'left';
            btn.disabled = current;
            
            if (!current) {
                btn.style.transition = 'all 0.2s';
                this.addEventListener(btn, 'mouseenter', () => {
                    btn.style.background = '#4b5563';
                });
                this.addEventListener(btn, 'mouseleave', () => {
                    btn.style.background = '#374151';
                });
                this.addEventListener(btn, 'click', () => {
                    this.travelToArea(areaName);
                    this.closeWorldMapOverlay();
                });
            }
            
            list.appendChild(btn);
            this.worldMapButtons.push(btn);
        });

        // Update progression indicators on the world map
        setTimeout(() => this.updateWorldMapProgressionIndicators(), 0);
    }

    // ================================================
    // AREA SELECTION AND DETAILS
    // ================================================

    /**
     * Select an area and display its details
     * Extracted from original ui.js selectArea method (lines 3194-3211)
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
        
        console.log(`📍 Selected area: ${areaId}`);
    }

    /**
     * Display detailed information about an area
     * Extracted from original ui.js displayAreaDetails method (lines 3216-3256)
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
                if (pill && typeof window.AreaData !== 'undefined') {
                    const gs = this.gameState || this.getGameReference('gameState');
                    const flags = gs?.world?.storyFlags || [];
                    const completed = gs?.world?.completedEvents || [];
                    const events = (window.AreaData.getArea(areaId)?.storyEvents || [])
                        .filter(e => !completed.includes(e) && !flags.includes(`${e}_completed`));
                    pill.classList.toggle('hidden', events.length === 0);
                }
            } catch (e) {
                // Silent fail for missing story system
            }

            // Update stats
            this.updateAreaStats(areaData);

            // Update progression indicators
            this.updateAreaProgressionIndicators(areaId, areaData);

            // Update action buttons
            this.updateAreaActionButtons(areaId, areaData);
        }
        
        console.log(`📋 Displayed area details for: ${areaId}`);
    }

    /**
     * Update area statistics display
     * Extracted from original ui.js updateAreaStats method (lines 3261-3275)
     */
    updateAreaStats(areaData) {
        // Encounter rate
        const encounterRateEl = document.getElementById('encounter-rate');
        if (encounterRateEl) {
            encounterRateEl.textContent = `${areaData.encounterRate || 0}%`;
        }

        // Monster count
        const monsterCountEl = document.getElementById('monster-count');
        if (monsterCountEl && areaData.monsters) {
            monsterCountEl.textContent = areaData.monsters.length || 0;
        }

        // Difficulty level
        const difficultyEl = document.getElementById('area-difficulty');
        if (difficultyEl) {
            const difficulty = areaData.difficulty || 1;
            difficultyEl.textContent = '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
        }
    }

    /**
     * Update area progression indicators showing unlock requirements and current progress
     */
    updateAreaProgressionIndicators(areaId, areaData) {
        // Get or create progression indicators container
        let progressContainer = document.getElementById('area-progression');
        if (!progressContainer) {
            progressContainer = this.createProgressionContainer();
        }

        if (!progressContainer) return; // Failed to create or find container

        // Clear previous content
        progressContainer.innerHTML = '';

        const gs = this.gameState || this.getGameReference('gameState');
        if (!gs || typeof window.AreaData === 'undefined') {
            progressContainer.style.display = 'none';
            return;
        }

        // Get unlock status and requirements
        const unlockStatus = this.getAreaUnlockStatus(areaId, areaData);

        if (unlockStatus.unlocked) {
            this.displayUnlockedStatus(progressContainer, areaId, areaData);
        } else {
            this.displayUnlockRequirements(progressContainer, unlockStatus);
        }

        progressContainer.style.display = 'block';
    }

    /**
     * Create progression indicators container if it doesn't exist
     */
    createProgressionContainer() {
        const areaInfo = document.getElementById('area-info');
        if (!areaInfo) return null;

        const container = document.createElement('div');
        container.id = 'area-progression';
        container.className = 'area-progression';

        // Insert after area stats or at the end
        const statsContainer = areaInfo.querySelector('.area-stats') || areaInfo.querySelector('#area-difficulty')?.parentElement;
        if (statsContainer && statsContainer.nextSibling) {
            areaInfo.insertBefore(container, statsContainer.nextSibling);
        } else {
            areaInfo.appendChild(container);
        }

        return container;
    }

    /**
     * Get detailed unlock status for an area
     */
    getAreaUnlockStatus(areaId, areaData) {
        if (typeof window.AreaData === 'undefined') {
            return { unlocked: true, requirements: [], missing: [] };
        }

        const gs = this.gameState || this.getGameReference('gameState');
        if (!gs) {
            return { unlocked: true, requirements: [], missing: [] };
        }

        // Use AreaData's getUnlockStatus if available, otherwise fallback
        if (typeof window.AreaData.getUnlockStatus === 'function') {
            return window.AreaData.getUnlockStatus(
                areaId,
                gs.world.storyFlags || [],
                gs.player.level || 1,
                Object.keys(gs.player.inventory?.items || {}),
                gs.player.class || 'warrior',
                gs.world.defeatedBosses || []
            );
        }

        // Fallback to basic unlock check
        const isUnlocked = this.isAreaUnlocked(areaId, areaData);
        return {
            unlocked: isUnlocked,
            requirements: this.parseUnlockRequirements(areaData.unlockRequirements || {}),
            missing: isUnlocked ? [] : this.parseUnlockRequirements(areaData.unlockRequirements || {})
        };
    }

    /**
     * Parse unlock requirements into a readable format
     */
    parseUnlockRequirements(requirements) {
        const parsed = [];

        if (!requirements || typeof requirements !== 'object') {
            return parsed;
        }

        // Handle logical operators
        if (requirements.and) {
            parsed.push({
                type: 'group',
                operator: 'and',
                requirements: requirements.and.map(req => this.parseUnlockRequirements(req)).flat()
            });
        }

        if (requirements.or) {
            parsed.push({
                type: 'group',
                operator: 'or',
                requirements: requirements.or.map(req => this.parseUnlockRequirements(req)).flat()
            });
        }

        // Handle direct requirements
        Object.entries(requirements).forEach(([key, value]) => {
            if (key === 'and' || key === 'or') return; // Already handled

            switch (key) {
                case 'story':
                    parsed.push({
                        type: 'story',
                        flag: value,
                        description: `Complete: ${this.formatStoryFlag(value)}`
                    });
                    break;

                case 'level':
                    parsed.push({
                        type: 'level',
                        required: value,
                        description: `Reach level ${value}`
                    });
                    break;

                case 'item':
                    parsed.push({
                        type: 'item',
                        item: value,
                        description: `Obtain: ${this.formatItemName(value)}`
                    });
                    break;

                case 'character_class':
                    const classes = Array.isArray(value) ? value : [value];
                    parsed.push({
                        type: 'class',
                        classes: classes,
                        description: `Be a ${classes.join(' or ')}`
                    });
                    break;

                case 'boss_defeated':
                    parsed.push({
                        type: 'boss',
                        boss: value,
                        description: `Defeat: ${this.formatBossName(value)}`
                    });
                    break;

                default:
                    parsed.push({
                        type: 'custom',
                        key: key,
                        value: value,
                        description: `${key}: ${value}`
                    });
            }
        });

        return parsed;
    }

    /**
     * Display status for unlocked areas
     */
    displayUnlockedStatus(container, areaId, areaData) {
        const unlockedDiv = document.createElement('div');
        unlockedDiv.className = 'progression-status unlocked';
        unlockedDiv.innerHTML = `
            <div class="status-header">
                <span class="status-icon">✓</span>
                <span class="status-text">Area Unlocked</span>
            </div>
        `;

        // Add exploration progress if applicable
        if (areaData.encounterRate > 0) {
            const explorationProgress = this.getExplorationProgress(areaId);
            if (explorationProgress) {
                const progressDiv = document.createElement('div');
                progressDiv.className = 'exploration-progress';
                progressDiv.innerHTML = `
                    <div class="progress-label">Exploration Progress</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${explorationProgress.percentage}%"></div>
                    </div>
                    <div class="progress-text">${explorationProgress.percentage}% Complete</div>
                `;
                unlockedDiv.appendChild(progressDiv);
            }
        }

        container.appendChild(unlockedDiv);
    }

    /**
     * Display unlock requirements for locked areas
     */
    displayUnlockRequirements(container, unlockStatus) {
        const requirementsDiv = document.createElement('div');
        requirementsDiv.className = 'progression-status locked';

        const header = document.createElement('div');
        header.className = 'status-header';
        header.innerHTML = `
            <span class="status-icon">🔒</span>
            <span class="status-text">Unlock Requirements</span>
        `;
        requirementsDiv.appendChild(header);

        if (unlockStatus.requirements.length === 0) {
            const noReqs = document.createElement('div');
            noReqs.className = 'requirement-item completed';
            noReqs.textContent = 'No specific requirements';
            requirementsDiv.appendChild(noReqs);
        } else {
            this.displayRequirementsList(requirementsDiv, unlockStatus.requirements, unlockStatus.missing);
        }

        container.appendChild(requirementsDiv);
    }

    /**
     * Display a list of requirements with completion status
     */
    displayRequirementsList(container, requirements, missing) {
        const gs = this.gameState || this.getGameReference('gameState');

        requirements.forEach(req => {
            if (req.type === 'group') {
                const groupDiv = document.createElement('div');
                groupDiv.className = 'requirement-group';

                const groupLabel = document.createElement('div');
                groupLabel.className = 'group-label';
                groupLabel.textContent = req.operator === 'and' ? 'All of the following:' : 'Any of the following:';
                groupDiv.appendChild(groupLabel);

                this.displayRequirementsList(groupDiv, req.requirements, missing);
                container.appendChild(groupDiv);
                return;
            }

            const reqDiv = document.createElement('div');
            reqDiv.className = 'requirement-item';

            const isCompleted = this.checkRequirementCompletion(req, gs);
            reqDiv.classList.add(isCompleted ? 'completed' : 'incomplete');

            const icon = document.createElement('span');
            icon.className = 'requirement-icon';
            icon.textContent = isCompleted ? '✓' : '○';

            const text = document.createElement('span');
            text.className = 'requirement-text';
            text.textContent = req.description;

            // Add current progress for level requirements
            if (req.type === 'level' && !isCompleted) {
                const currentLevel = gs?.player?.level || 1;
                const progressText = document.createElement('span');
                progressText.className = 'progress-indicator';
                progressText.textContent = ` (Currently ${currentLevel})`;
                text.appendChild(progressText);
            }

            reqDiv.appendChild(icon);
            reqDiv.appendChild(text);
            container.appendChild(reqDiv);
        });
    }

    /**
     * Check if a specific requirement is completed
     */
    checkRequirementCompletion(requirement, gameState) {
        if (!gameState) return false;

        switch (requirement.type) {
            case 'story':
                const storyFlags = gameState.world?.storyFlags || [];
                return storyFlags.includes(requirement.flag) ||
                       storyFlags.includes(`${requirement.flag}_completed`);

            case 'level':
                return (gameState.player?.level || 1) >= requirement.required;

            case 'item':
                const inventory = gameState.player?.inventory?.items || {};
                return !!inventory[requirement.item];

            case 'class':
                return requirement.classes.includes(gameState.player?.class);

            case 'boss':
                const defeatedBosses = gameState.world?.defeatedBosses || [];
                return defeatedBosses.includes(requirement.boss);

            default:
                return false;
        }
    }

    /**
     * Get exploration progress for an area
     */
    getExplorationProgress(areaId) {
        const gs = this.gameState || this.getGameReference('gameState');
        if (!gs || !gs.world?.explorationProgress) {
            return null;
        }

        const progress = gs.world.explorationProgress[areaId];
        if (!progress) {
            return { percentage: 0, encounters: 0, totalEncounters: 10 };
        }

        return {
            percentage: Math.min(100, Math.floor((progress.encounters || 0) / (progress.totalEncounters || 10) * 100)),
            encounters: progress.encounters || 0,
            totalEncounters: progress.totalEncounters || 10
        };
    }

    /**
     * Format story flag names for display
     */
    formatStoryFlag(flag) {
        return flag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Format item names for display
     */
    formatItemName(item) {
        return item.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Format boss names for display
     */
    formatBossName(boss) {
        return boss.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Update world map area nodes with progression indicators
     */
    updateWorldMapProgressionIndicators() {
        const areaNodes = document.querySelectorAll('.area-node');

        areaNodes.forEach(node => {
            const areaId = node.dataset.areaId;
            if (!areaId || typeof window.AreaData === 'undefined') return;

            const areaData = window.AreaData.getArea(areaId);
            if (!areaData) return;

            // Remove existing progression indicators
            const existingIndicator = node.querySelector('.progression-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            // Get unlock status
            const unlockStatus = this.getAreaUnlockStatus(areaId, areaData);

            // Create progression indicator
            const indicator = document.createElement('div');
            indicator.className = 'progression-indicator';

            if (unlockStatus.unlocked) {
                indicator.classList.add('unlocked');
                indicator.title = 'Area Unlocked';

                // Add exploration progress for unlocked areas
                if (areaData.encounterRate > 0) {
                    const explorationProgress = this.getExplorationProgress(areaId);
                    if (explorationProgress && explorationProgress.percentage > 0) {
                        indicator.classList.add('explored');
                        indicator.style.setProperty('--progress', `${explorationProgress.percentage}%`);
                        indicator.title = `${explorationProgress.percentage}% Explored`;
                    }
                }
            } else {
                indicator.classList.add('locked');
                indicator.title = 'Area Locked';

                // Show partial progress if some requirements are met
                const completedReqs = unlockStatus.requirements.filter(req =>
                    this.checkRequirementCompletion(req, this.gameState || this.getGameReference('gameState'))
                );

                if (completedReqs.length > 0 && unlockStatus.requirements.length > 0) {
                    const progressPercent = Math.floor((completedReqs.length / unlockStatus.requirements.length) * 100);
                    indicator.classList.add('partial');
                    indicator.style.setProperty('--progress', `${progressPercent}%`);
                    indicator.title = `${completedReqs.length}/${unlockStatus.requirements.length} requirements met`;
                }
            }

            node.appendChild(indicator);
        });
    }

    /**
     * Add CSS styles for progression indicators (inject once)
     */
    injectProgressionStyles() {
        if (document.getElementById('progression-indicator-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'progression-indicator-styles';
        styles.textContent = `
            .area-progression {
                margin: 10px 0;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                background: #f9f9f9;
            }

            .progression-status {
                margin-bottom: 8px;
            }

            .status-header {
                display: flex;
                align-items: center;
                font-weight: bold;
                margin-bottom: 8px;
            }

            .status-icon {
                margin-right: 8px;
                font-size: 1.2em;
            }

            .progression-status.unlocked {
                border-left: 4px solid #4CAF50;
                background: #f1f8e9;
            }

            .progression-status.locked {
                border-left: 4px solid #f44336;
                background: #fce4ec;
            }

            .exploration-progress {
                margin: 8px 0;
            }

            .progress-label {
                font-size: 0.9em;
                color: #666;
                margin-bottom: 4px;
            }

            .progress-bar {
                width: 100%;
                height: 6px;
                background: #e0e0e0;
                border-radius: 3px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #81C784);
                transition: width 0.3s ease;
            }

            .progress-text {
                font-size: 0.8em;
                color: #666;
                text-align: right;
                margin-top: 2px;
            }

            .requirement-item {
                display: flex;
                align-items: center;
                margin: 4px 0;
                padding: 2px 0;
            }

            .requirement-icon {
                margin-right: 8px;
                width: 16px;
                text-align: center;
            }

            .requirement-item.completed {
                color: #4CAF50;
            }

            .requirement-item.incomplete {
                color: #666;
            }

            .requirement-group {
                margin: 8px 0;
                padding-left: 16px;
                border-left: 2px solid #ddd;
            }

            .group-label {
                font-weight: bold;
                margin-bottom: 4px;
                color: #333;
            }

            .progress-indicator {
                font-size: 0.8em;
                color: #888;
                font-style: italic;
            }

            /* World map progression indicators */
            .area-node {
                position: relative;
            }

            .progression-indicator {
                position: absolute;
                top: -2px;
                right: -2px;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 1px solid #fff;
                font-size: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .progression-indicator.unlocked {
                background: #4CAF50;
            }

            .progression-indicator.locked {
                background: #f44336;
            }

            .progression-indicator.partial {
                background: conic-gradient(#ff9800 var(--progress, 0%), #ddd var(--progress, 0%));
            }

            .progression-indicator.explored {
                background: conic-gradient(#2196F3 var(--progress, 0%), #4CAF50 var(--progress, 0%));
            }
        `;

        document.head.appendChild(styles);
    }

    /**
     * Update area action buttons based on area state
     * Extracted from original ui.js updateAreaActionButtons method (lines 3397-3420)
     */
    updateAreaActionButtons(areaId, areaData) {
        const travelBtn = document.getElementById('travel-to-area');
        const exploreBtn = document.getElementById('explore-area');

        const gs = this.gameState || this.getGameReference('gameState');
        // Sync currentPlayerArea with game state if available
        if (gs && gs.world && gs.world.currentArea) {
            this.currentPlayerArea = gs.world.currentArea;
        }
        const isCurrentLocation = areaId === (gs?.world?.currentArea || this.currentPlayerArea);
        
        // Unlocked check
        const isUnlocked = this.isAreaUnlocked(areaId, areaData);
        
        // Connectivity check: allow if same area, otherwise require connection from current
        let isConnected = true;
        if (!isCurrentLocation && gs && typeof window.AreaData !== 'undefined') {
            const conns = window.AreaData.getConnectedAreas(gs.world.currentArea) || [];
            isConnected = conns.includes(areaId);
        }
        
        const canTravel = !isCurrentLocation && isUnlocked && isConnected;
        const canExplore = areaData.encounterRate > 0 && isCurrentLocation;

        // Update travel button
        if (travelBtn) {
            travelBtn.disabled = !canTravel;
            travelBtn.textContent = isCurrentLocation ? 'Current Location' : 'Travel Here';
            travelBtn.style.opacity = canTravel ? '1' : '0.5';
        }

        // Update explore button
        if (exploreBtn) {
            exploreBtn.disabled = !canExplore;
            exploreBtn.textContent = canExplore ? 'Explore Area' : 'Not Available';
            exploreBtn.style.opacity = canExplore ? '1' : '0.5';
        }
    }

    /**
     * Check if area is unlocked for the player
     */
    isAreaUnlocked(areaId, areaData) {
        if (typeof window.AreaData === 'undefined') return true;
        
        const gs = this.gameState || this.getGameReference('gameState');
        if (!gs) return true;
        
        const unlocked = window.AreaData.getUnlockedAreas(
            gs.world.storyFlags,
            gs.player.level,
            Object.keys(gs.player.inventory.items),
            gs.player.class
        );
        
        return unlocked.includes(areaId);
    }

    /**
     * Get area icon based on type
     * Extracted from original ui.js getAreaIcon method (lines 3124-3136)
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

    // ================================================
    // AREA TRAVEL AND EXPLORATION
    // ================================================

    /**
     * Attach world map interface event handlers
     * Extracted from original ui.js attachWorldMapInterface method
     */
    attachWorldMapInterface() {
        // Initialize world map state
        this.selectedArea = null;
        this.currentPlayerArea = 'starting_village';
        
        // Main world map button
        this.attachButton('world-map-btn', () => this.showWorldMap());

        // Global navigation buttons
        this.attachButton('monsters-btn', () => this.sendMessage('showScene', { sceneName: 'monster_management' }));
        this.attachButton('inventory-btn', () => this.sendMessage('showScene', { sceneName: 'inventory' }));
        this.attachButton('save-game-btn', () => this.saveGame());
        
        // Navigation buttons
        this.attachButton('back-from-world', () => this.returnToPrevious());
        this.attachButton('center-map', () => this.centerMapOnPlayer());
        
        // Area action buttons
        this.attachButton('travel-to-area', () => this.travelToSelectedArea());
        this.attachButton('explore-area', () => this.exploreSelectedArea());
        
        console.log('🗺️ World map interface attached');
    }

    /**
     * Ensure the inline world map system instance exists and is initialized
     */
    ensureInlineWorldMap() {
        try {
            const gameRef = this.uiManager?.game || window.SawyersRPG || { getGameState: () => this.gameState };
            if (window.WorldMapSystem) {
                if (!this.worldMap) {
                    this.worldMap = new window.WorldMapSystem(gameRef);
                }
                if (!this.worldMap.initialized) {
                    this.worldMap.init();
                }
                // Sync current area from game state if available
                if (this.gameState?.world?.currentArea) {
                    this.worldMap.currentArea = this.gameState.world.currentArea;
                }
            }
        } catch (e) {
            console.warn('Inline world map init failed:', e);
        }
    }

    /**
     * Render the inline world map into #world-map if available
     */
    renderInlineWorldMap() {
        try {
            if (this.worldMap && typeof this.worldMap.renderMap === 'function') {
                this.worldMap.renderMap();
                // After rendering, wire up selection to the details pane and action buttons
                const container = document.getElementById('world-map');
                if (container) {
                    const tiles = Array.from(container.querySelectorAll('.map-area'));
                    tiles.forEach(tile => {
                        const areaId = tile.dataset.area;
                        // Click selects area (and double-click travels)
                        this.addEventListener(tile, 'click', (e) => {
                            // Select and update details
                            this.handleInlineMapSelect(areaId);
                        });
                        this.addEventListener(tile, 'dblclick', (e) => {
                            this.travelToArea(areaId);
                        });
                        // Keyboard support: Enter to select, Shift+Enter to travel
                        this.addEventListener(tile, 'keydown', (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (e.shiftKey) {
                                    this.travelToArea(areaId);
                                } else {
                                    this.handleInlineMapSelect(areaId);
                                }
                            }
                        });
                    });
                }
            }
        } catch (e) {
            console.warn('Inline world map render failed:', e);
        }
    }

    /**
     * Handle selecting an area from the inline world map and update UI panels/buttons
     */
    handleInlineMapSelect(areaId) {
        try {
            if (!window.AreaData) return;
            const areaData = window.AreaData.getArea(areaId);
            if (!areaData) return;
            this.selectedArea = areaId;
            // highlight selection in map
            document.querySelectorAll('#world-map .map-area').forEach(n => n.classList.remove('selected'));
            const n = document.querySelector(`#world-map .map-area[data-area="${areaId}"]`);
            if (n) n.classList.add('selected');
            // update details and action buttons
            this.displayAreaDetails(areaId, areaData);
            this.updateAreaActionButtons(areaId, areaData);
        } catch (err) {
            console.warn('Failed to select inline map area:', err);
        }
    }

    /**
     * Travel to selected area
     * Extracted from original ui.js travelToSelectedArea method
     */
    travelToSelectedArea() {
        if (!this.selectedArea) return;
        
        const gs = this.gameState || this.getGameReference('gameState');
        if (!gs || typeof window.AreaData === 'undefined') return;
        
        if (this.selectedArea === gs.world.currentArea) {
            this.notifyInfo('Already at this location');
            return;
        }
        
        this.travelToArea(this.selectedArea);
    }

    /**
     * Travel to a specific area
     */
    travelToArea(areaName) {
        const gs = this.gameState || this.getGameReference('gameState');
        if (!gs || typeof window.AreaData === 'undefined') return;
        
        const area = window.AreaData.getArea(areaName);
        if (!area) {
            this.notifyError(`Area not found: ${areaName}`);
            return;
        }
        
        // Update game state
        gs.world.currentArea = areaName;
        this.currentPlayerArea = areaName;
        
        // Show success notification
        this.notifySuccess(`Traveled to ${area.name || areaName}`);
        
        // Trigger any story events for this area
        this.triggerStoryEventIfAvailable(areaName);
        
        // Refresh area display
        this.refreshAreaDisplay();
        
        console.log(`🚶 Traveled to area: ${areaName}`);
    }

    /**
     * Quick travel to area (bypasses normal travel restrictions)
     * Extracted from original ui.js quickTravelToArea method
     */
    quickTravelToArea(areaId) {
        this.currentPlayerArea = areaId;
        
        // Update game state
        const gs = this.gameState || this.getGameReference('gameState');
        if (gs) {
            gs.world.currentArea = areaId;
        }
        if (window.GameState) {
            window.GameState.currentArea = areaId;
        }
        
        // Refresh the map display
        this.refreshWorldMapDisplay();
        
        // Show notification
        const area = window.AreaData?.getArea(areaId);
        const areaName = area?.name || areaId;
        this.notifySuccess(`Quick traveled to ${areaName}`);
        
        console.log(`⚡ Quick traveled to area: ${areaId}`);
    }

    /**
     * Refresh world map display after travel
     */
    refreshWorldMapDisplay() {
        // Repopulate world map if overlay is open
        if (this.isWorldMapOpen()) {
            this.populateWorldMapAreas();
        }
        
        // Refresh area selection if we have one
        if (this.selectedArea && window.AreaData) {
            const areaData = window.AreaData.getArea(this.selectedArea);
            if (areaData) {
                this.displayAreaDetails(this.selectedArea, areaData);
            }
        }
    }

    /**
     * Refresh area display after state changes
     */
    refreshAreaDisplay() {
        // Update current area indicators on map
        document.querySelectorAll('.area-node').forEach(node => {
            const areaId = node.dataset.areaId;
            if (areaId === this.currentPlayerArea) {
                node.classList.add('current');
            } else {
                node.classList.remove('current');
            }
        });
        
        // Refresh selected area details if applicable
        if (this.selectedArea && window.AreaData) {
            const areaData = window.AreaData.getArea(this.selectedArea);
            if (areaData) {
                this.updateAreaActionButtons(this.selectedArea, areaData);
            }
        }
        
        // Refresh world map overlay if open
        this.refreshWorldMapDisplay();

        // Update progression indicators on world map
        this.updateWorldMapProgressionIndicators();
    }

    /**
     * Explore selected area
     * Extracted from original ui.js exploreSelectedArea method
     */
    exploreSelectedArea() {
        if (!this.selectedArea) return;
        
        // Trigger exploration/encounter system using the game instance's GameState
        const gs = this.gameState || this.getGameReference('gameState');
        if (gs && typeof gs.triggerRandomEncounter === 'function') {
            gs.triggerRandomEncounter(this.selectedArea);
        } else {
            const area = window.AreaData?.areas?.[this.selectedArea];
            const areaName = area?.name || this.selectedArea;
            this.notifyInfo(`Exploring ${areaName}...`);
        }
        
        // Attempt to trigger a story event available for this area
        try {
            this.triggerStoryEventIfAvailable(this.selectedArea);
        } catch (error) {
            console.warn('Story event trigger failed:', error);
        }
        
        console.log(`🔍 Exploring area: ${this.selectedArea}`);
    }

    /**
     * Center map on player location
     * Extracted from original ui.js centerMapOnPlayer method
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
            this.notifyInfo('Centered on current location');
        } else {
            this.notifyWarning('Current location not found on map');
        }
    }

    // ================================================
    // KEYBOARD NAVIGATION
    // ================================================

    /**
     * Handle keyboard navigation in world map overlay
     * Extracted from original ui.js handleWorldMapKeys method
     */
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
     * Move world map selection by delta
     * Extracted from original ui.js moveWorldMapSelection method
     */
    moveWorldMapSelection(delta) {
        if (!this.worldMapButtons.length) return;
        
        this.worldMapIndex = (this.worldMapIndex + delta + this.worldMapButtons.length) % this.worldMapButtons.length;
        this.focusWorldMapIndex();
    }

    /**
     * Focus current world map index
     * Extracted from original ui.js focusWorldMapIndex method
     */
    focusWorldMapIndex() {
        const btn = this.worldMapButtons[this.worldMapIndex];
        if (btn && typeof btn.focus === 'function') {
            btn.focus();
            if (typeof btn.scrollIntoView === 'function') {
                btn.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    /**
     * Attach keyboard navigation for main world map screen
     * Extracted from original ui.js attachWorldMapKeyboard method (lines 3507-3511)
     */
    attachWorldMapKeyboard() {
        if (this._worldMapScreenKeyHandler) return;
        this._worldMapScreenKeyHandler = (e) => this.handleWorldMapScreenKeys(e);
        document.addEventListener('keydown', this._worldMapScreenKeyHandler);
        console.log('⌨️ World map screen keyboard navigation attached');
    }

    /**
     * Detach keyboard navigation for main world map screen
     * Extracted from original ui.js detachWorldMapKeyboard method (lines 3513-3518)
     */
    detachWorldMapKeyboard() {
        if (this._worldMapScreenKeyHandler) {
            document.removeEventListener('keydown', this._worldMapScreenKeyHandler);
            this._worldMapScreenKeyHandler = null;
            console.log('⌨️ World map screen keyboard navigation detached');
        }
    }

    /**
     * Handle keyboard navigation in main world map screen
     * Extracted from original ui.js handleWorldMapScreenKeys method (lines 3520-3555)
     */
    handleWorldMapScreenKeys(e) {
        // Only handle keys when in game world scene
        const currentScene = this.sendMessage('getCurrentScene');
        if (currentScene?.name !== 'game_world') return;
        
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
                if (this.selectedArea) {
                    // If area is selected, try to travel there
                    const areaData = window.AreaData?.areas[this.selectedArea];
                    if (areaData) {
                        this.travelToSelectedArea();
                    }
                }
                break;
            case 'Escape':
                e.preventDefault();
                // Clear area selection
                this.clearAreaSelection();
                break;
            case 'Space':
                e.preventDefault();
                if (this.selectedArea) {
                    // Explore selected area
                    this.exploreSelectedArea();
                }
                break;
        }
    }

    /**
     * Clear area selection
     */
    clearAreaSelection() {
        // Remove selection from all nodes
        document.querySelectorAll('.area-node').forEach(node => {
            node.classList.remove('selected');
        });
        
        // Clear stored selection
        this.selectedArea = null;
        
        // Hide area details
        const areaInfo = document.getElementById('area-info');
        if (areaInfo) {
            areaInfo.classList.add('hidden');
        }
        
        // Show no-selection prompt
        const noSelection = document.querySelector('.no-area-selected');
        if (noSelection) {
            noSelection.style.display = 'block';
        }
        
        console.log('🚫 Cleared area selection');
    }

    // ================================================
    // STORY INTEGRATION
    // ================================================

    /**
     * Trigger story event if available for area
     * Extracted from original ui.js triggerStoryEventIfAvailable method
     */
    triggerStoryEventIfAvailable(areaId) {
        if (typeof window.StoryData === 'undefined' || !window.GameState) {
            return;
        }
        
        try {
            const flags = window.GameState.world?.storyFlags || [];
            const completed = window.GameState.world?.completedEvents || [];
            const events = (window.StoryData.getAreaEvents(areaId, flags) || [])
                .filter(e => !completed.includes(e));
            
            // Avoid opening if modal already visible
            const modal = document.getElementById('story-modal');
            const isOpen = modal && !modal.classList.contains('hidden');
            
            if (!isOpen && events.length > 0) {
                this.showStoryEvent(events[0]);
            }
        } catch (error) {
            console.warn(`Failed to trigger story event for ${areaId}:`, error);
        }
    }

    /**
     * Show story event modal
     * Integrates with StoryUI module or falls back to direct modal handling
     */
    showStoryEvent(eventName) {
        if (typeof window.StoryData === 'undefined') {
            console.warn('StoryData not available for story event');
            return;
        }

        // Check if this is an immediate encounter event
        const eventData = window.StoryData.getEvent(eventName);
        if (eventData && eventData.encounter && eventData.encounter.immediate) {
            console.log(`🎭 Immediate encounter event detected: ${eventName}`);
            const gs = this.gameState || this.getGameReference('gameState');
            if (gs && typeof gs.startEncounter === 'function') {
                const encounter = {
                    species: eventData.encounter.species || 'slime',
                    level: eventData.encounter.level || 1,
                    source: 'story_event',
                    eventName: eventName
                };
                console.log(`🎭 Starting immediate encounter:`, encounter);
                gs.startEncounter(encounter);
                return; // Skip showing the story event modal
            }
        }

        try {
            // Try to delegate to StoryUI module if available
            this.sendMessage('showStoryEvent', { eventName });
            console.log(`📖 Showing story event: ${eventName}`);
        } catch (error) {
            // Fallback: try to show story modal directly
            console.warn('Story module unavailable, attempting direct modal:', error);
            this.showStoryEventFallback(eventName);
        }
    }

    /**
     * Fallback story event display for when StoryUI module isn't available
     */
    showStoryEventFallback(eventName) {
        try {
            const event = window.StoryData.getEvent(eventName);
            if (!event) {
                console.warn(`Story event not found: ${eventName}`);
                return;
            }
            
            // Show simple notification instead of full modal
            this.notifyInfo(`Story: ${event.title || eventName}`);
            
            // Mark event as triggered in GameState if possible
            if (window.GameState && window.GameState.world) {
                if (!window.GameState.world.completedEvents) {
                    window.GameState.world.completedEvents = [];
                }
                window.GameState.world.completedEvents.push(eventName);
            }
        } catch (error) {
            console.warn('Story event fallback failed:', error);
        }
    }

    /**
     * Check for story events when entering an area
     */
    checkAreaStoryEvents(areaId) {
        if (typeof window.StoryData === 'undefined' || !window.GameState) {
            return false;
        }
        
        const flags = window.GameState.world?.storyFlags || [];
        const completed = window.GameState.world?.completedEvents || [];
        const events = (window.StoryData.getAreaEvents(areaId, flags) || [])
            .filter(e => !completed.includes(e));
        
        return events.length > 0;
    }

    /**
     * Get available story events for an area
     */
    getAreaStoryEvents(areaId) {
        if (typeof window.StoryData === 'undefined' || !window.GameState) {
            return [];
        }
        
        const flags = window.GameState.world?.storyFlags || [];
        const completed = window.GameState.world?.completedEvents || [];
        return (window.StoryData.getAreaEvents(areaId, flags) || [])
            .filter(e => !completed.includes(e));
    }

    // ================================================
    // UTILITY METHODS
    // ================================================

    /**
     * Return to previous scene with intelligent fallbacks
     */
    returnToPrevious() {
        this.sendMessage('returnToPrevious');
    }

    /**
     * Get game object reference
     */
    getGameReference(property) {
        if (this.uiManager && this.uiManager.game) {
            return this.uiManager.game[property];
        }
        return null;
    }

    /**
     * Notification helpers
     */
    notifySuccess(message) {
        this.sendMessage('showNotification', { message, type: 'success' });
    }

    notifyError(message) {
        this.sendMessage('showNotification', { message, type: 'error' });
    }

    notifyWarning(message) {
        this.sendMessage('showNotification', { message, type: 'warning' });
    }

    notifyInfo(message) {
        this.sendMessage('showNotification', { message, type: 'info' });
    }

    /**
     * Get current selected area
     */
    getSelectedArea() {
        return this.selectedArea;
    }

    /**
     * Set selected area
     */
    setSelectedArea(areaName) {
        this.selectedArea = areaName;
        console.log(`📍 Selected area: ${areaName}`);
    }

    /**
     * Get current player area
     */
    getCurrentPlayerArea() {
        return this.currentPlayerArea;
    }

    /**
     * Check if world map overlay is open
     */
    isWorldMapOpen() {
        return this.worldMapOverlay && this.worldMapOverlay.style.display !== 'none';
    }

    /**
     * Save the game
     */
    saveGame() {
        if (typeof SaveSystem !== 'undefined' && SaveSystem.saveGame) {
            const success = SaveSystem.saveGame();
            if (success) {
                this.notifySuccess('Game saved successfully!');
            } else {
                this.notifyError('Failed to save game');
            }
        } else {
            console.warn('SaveSystem not available');
            this.notifyError('Save system unavailable');
        }
    }

    /**
     * Cleanup game world UI resources
     */
    cleanup() {
        // Close world map overlay
        this.closeWorldMapOverlay();
        
        // Detach keyboard navigation
        this.detachWorldMapKeyboard();
        
        // Clear references
        this.worldMapOverlay = null;
        this.worldMapButtons = [];
        this.selectedArea = null;
        this._worldMapScreenKeyHandler = null;
        
        super.cleanup();
        console.log('🧹 GameWorldUI cleaned up');
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameWorldUI;
} else if (typeof window !== 'undefined') {
    window.GameWorldUI = GameWorldUI;
}