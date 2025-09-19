/**
 * Combat UI Module
 * Handles combat interface, actions, battle management, and targeting
 * Extracted from original ui.js lines ~1889-2076
 */

class CombatUI extends BaseUIModule {
    constructor(uiManager, options = {}) {
        super('CombatUI', uiManager, {
            scenes: ['combat'],
            dependencies: ['UIHelpers'],
            ...options
        });
        
        // Combat state
        this.currentSubmenu = null;
        this.selectedAction = null;
        this.selectedTarget = null;
        this.actionData = null;
        
        console.log('✅ CombatUI initialized');
    }

    /**
     * Initialize the combat UI module
     */
    async init() {
        await super.init();
        
        // Get references to dependencies
        this.gameState = this.getGameReference('gameState');
        
        console.log('⚔️ CombatUI initialization completed');
        return true;
    }

    /**
     * Attach event listeners for combat functionality
     */
    attachEvents() {
        super.attachEvents();
        
        // Attach combat interface
        this.attachCombatInterface();
        
        console.log('🔗 CombatUI events attached');
    }

    /**
     * Show the combat UI
     */
    show(sceneName = 'combat') {
        super.show();

        // Reset combat UI state
        this.resetCombatState();

        // Ensure combat is properly initialized
        const gameState = this.gameState || window.GameState;
        if (gameState && gameState.combat) {
            // If we're in combat scene but combat isn't active, something went wrong
            if (!gameState.combat.active) {
                console.warn('⚠️ Combat scene shown but combat not active, attempting to reinitialize');
                // Try to trigger a new encounter if in forest_path
                if (gameState.world && gameState.world.currentArea === 'forest_path') {
                    setTimeout(() => {
                        gameState.triggerRandomEncounter('forest_path');
                    }, 100);
                    return;
                }
            }

            // If combat is active but currentTurn is not set, default to player
            if (gameState.combat.active && (!gameState.combat.currentTurn || gameState.combat.currentTurn === 'unknown')) {
                gameState.combat.currentTurn = 'player';
                gameState.combat.turnCount = gameState.combat.turnCount || 1;
                console.log('🔧 Force-set currentTurn to player in CombatUI.show()');
            }
        }

        // Update combat display
        this.updateCombatDisplay();

        console.log(`⚔️ CombatUI showing scene: ${sceneName}`);
    }

    /**
     * Hide the combat UI
     */
    hide() {
        // Hide all submenus
        this.hideAllSubMenus();
        
        super.hide();
        console.log('👋 CombatUI hidden');
    }

    // ================================================
    // COMBAT INTERFACE ATTACHMENT
    // ================================================

    /**
     * Attach combat interface event handlers
     * Extracted from original ui.js attachCombatInterface method (lines 1899-1911)
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
        
        console.log('⚔️ Combat interface attached');
    }

    // ================================================
    // COMBAT ACTION HANDLING
    // ================================================

    /**
     * Handle combat action selection
     * Extracted from original ui.js handleCombatAction method (lines 1916-1935)
     */
    handleCombatAction(action) {
        const gameState = this.gameState || window.GameState;
        if (gameState && gameState.combat) {
            const combat = gameState.combat;
            
            switch(action) {
                case 'attack':
                    // Show target selection (single or multiple enemies)
                    this.showTargetSelection('attack');
                    break;
                case 'capture':
                    this.showTargetSelection('capture');
                    break;
                case 'flee':
                    combat.attemptFlee();
                    this.notifyInfo('Attempting to flee from battle...');
                    break;
                default:
                    console.warn(`Unknown combat action: ${action}`);
                    this.notifyWarning(`Unknown action: ${action}`);
            }
        } else {
            console.warn('Combat system not available');
            this.notifyError('Combat system not available');
        }
        
        console.log(`⚔️ Combat action: ${action}`);
    }

    // ================================================
    // SUBMENU MANAGEMENT
    // ================================================

    /**
     * Show combat submenu
     * Extracted from original ui.js showSubMenu method (lines 1940-1957)
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
        
        this.currentSubmenu = submenuId;
        console.log(`📋 Showing combat submenu: ${submenuId}`);
    }

    /**
     * Hide combat submenu
     * Extracted from original ui.js hideSubMenu method (lines 1962-1970)
     */
    hideSubMenu(submenuId) {
        // Hide submenu
        const submenu = document.getElementById(submenuId);
        if (submenu) submenu.classList.add('hidden');
        
        // Show main menu
        const mainMenu = document.getElementById('main-action-menu');
        if (mainMenu) mainMenu.classList.remove('hidden');
        
        if (this.currentSubmenu === submenuId) {
            this.currentSubmenu = null;
        }
        
        console.log(`📋 Hidden combat submenu: ${submenuId}`);
    }

    /**
     * Hide all submenus
     */
    hideAllSubMenus() {
        const submenus = ['magic-submenu', 'items-submenu', 'target-selection'];
        submenus.forEach(submenuId => {
            const submenu = document.getElementById(submenuId);
            if (submenu) {
                submenu.classList.add('hidden');
            }
        });
        
        // Show main menu
        const mainMenu = document.getElementById('main-action-menu');
        if (mainMenu) mainMenu.classList.remove('hidden');
        
        this.currentSubmenu = null;
    }

    // ================================================
    // TARGET SELECTION
    // ================================================

    /**
     * Show target selection interface
     * Extracted from original ui.js showTargetSelection method
     */
    showTargetSelection(actionType, actionData = null) {
        // Show target selection menu
        const targetMenu = document.getElementById('target-selection');
        if (targetMenu) {
            targetMenu.classList.remove('hidden');
            this.populateTargetList(actionType, actionData);

            // Add robust event delegation fallback once
            if (!targetMenu.getAttribute('data-delegation-bound')) {
                this.addEventListener(targetMenu, 'click', (e) => {
                    const btn = e.target.closest('.target-btn');
                    if (!btn) return;
                    const idx = Array.from(targetMenu.querySelectorAll('.target-btn')).indexOf(btn);
                    const gameState = this.gameState || window.GameState;
                    const combat = gameState?.combat;
                    if (!combat || !Array.isArray(combat.enemies)) return;
                    const alive = combat.enemies.filter(en => (en.hp || 0) > 0);
                    const target = alive[idx] || alive[0] || combat.enemies[0];
                    if (!target) return;
                    this.executeTargetedAction(actionType, target, actionData);
                    this.hideSubMenu('target-selection');
                });
                targetMenu.setAttribute('data-delegation-bound', 'true');
            }

            // If there is only one valid enemy target, auto-select it for smoother UX
            try {
                const gameState = this.gameState || window.GameState;
                const enemies = gameState?.combat?.enemies || [];
                const alive = Array.isArray(enemies) ? enemies.filter(e => (e?.hp || 0) > 0) : [];
                if (alive.length === 1) {
                    // Defer to allow DOM to update target list
                    setTimeout(() => {
                        this.executeTargetedAction(actionType, alive[0], actionData);
                        this.hideSubMenu('target-selection');
                    }, 0);
                }
            } catch (_) {}
        }
        
        // Hide main menu
        const mainMenu = document.getElementById('main-action-menu');
        if (mainMenu) mainMenu.classList.add('hidden');
        
        this.selectedAction = actionType;
        this.actionData = actionData;
        this.currentSubmenu = 'target-selection';
        
        console.log(`🎯 Showing target selection for: ${actionType}`);
    }

    /**
     * Populate target list for target selection
     * Extracted from original ui.js populateTargetList method (lines 2049-2079)
     */
    populateTargetList(actionType, actionData = null) {
        const targetList = document.querySelector('#target-selection .target-list');
        if (!targetList) {
            console.warn('Target list element not found');
            return;
        }
        
        const gameState = this.gameState || window.GameState;
        if (!gameState || !gameState.combat) {
            this.notifyError('Combat state not available');
            return;
        }
        
        targetList.innerHTML = '';
        const combat = gameState.combat;
        
        // Get available targets based on action type
        let targets = [];
        const enemies = combat.enemies || [];

        if (actionType === 'attack' || actionType === 'capture') {
            targets = enemies.filter(enemy => enemy.hp > 0);
        } else if (actionType === 'magic' || actionType === 'item') {
            // Could target enemies or allies depending on spell/item
            targets = enemies.filter(enemy => enemy.hp > 0);
            // Add player and monsters as potential targets for healing/buffs
            if (combat.player) targets.push(combat.player);
            if (combat.playerMonsters) {
                targets.push(...combat.playerMonsters.filter(m => m.hp > 0));
            }
        }
        
        if (targets.length === 0) {
            const noTargets = document.createElement('div');
            noTargets.textContent = 'No valid targets available';
            noTargets.className = 'no-targets';
            noTargets.style.color = '#9ca3af';
            noTargets.style.textAlign = 'center';
            noTargets.style.padding = '10px';
            targetList.appendChild(noTargets);
            return;
        }
        
        targets.forEach((target, index) => {
            const targetBtn = document.createElement('button');
            targetBtn.className = 'target-btn';
            targetBtn.textContent = target.name || `Enemy ${index + 1}`;
            
            // Add HP display for targets
            if (target.hp !== undefined && target.maxHp !== undefined) {
                const hpPercent = Math.round((target.hp / target.maxHp) * 100);
                targetBtn.textContent += ` (${hpPercent}% HP)`;
            }
            
            // Style button based on target type
            if (target === combat.player) {
                targetBtn.classList.add('player-target');
            } else if (combat.playerMonsters && combat.playerMonsters.includes(target)) {
                targetBtn.classList.add('ally-target');
            } else {
                targetBtn.classList.add('enemy-target');
            }
            
            this.addEventListener(targetBtn, 'click', () => {
                this.executeTargetedAction(actionType, target, actionData);
                this.hideSubMenu('target-selection');
            });
            
            targetList.appendChild(targetBtn);
        });
        
        console.log(`🎯 Populated ${targets.length} targets for ${actionType}`);
    }

    // ================================================
    // SPELL AND ITEM MANAGEMENT
    // ================================================

    /**
     * Populate spell list for magic submenu
     * Extracted from original ui.js populateSpellList method
     */
    populateSpellList() {
        const spellList = document.querySelector('#magic-submenu .spell-list');
        if (!spellList) {
            console.warn('Spell list element not found');
            return;
        }

        // Debug spell list container
        console.log('🔍 Spell list container:', spellList);
        console.log('🔍 Container styles:', {
            display: getComputedStyle(spellList).display,
            pointerEvents: getComputedStyle(spellList).pointerEvents,
            zIndex: getComputedStyle(spellList).zIndex,
            position: getComputedStyle(spellList).position
        });

        // Force container to be clickable with maximum z-index
        spellList.style.pointerEvents = 'auto';
        spellList.style.position = 'fixed';
        spellList.style.zIndex = '999999';
        spellList.style.left = '50%';
        spellList.style.top = '50%';
        spellList.style.transform = 'translate(-50%, -50%)';
        spellList.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        spellList.style.padding = '20px';
        spellList.style.borderRadius = '8px';
        spellList.style.border = '2px solid #ffd700';

        // Add click debug to container
        spellList.addEventListener('click', (e) => {
            console.log('🎯 Click on spell list container, target:', e.target);
        });
        
        const gameState = this.gameState || window.GameState;
        if (!gameState || !gameState.player) {
            this.notifyError('Player data not available');
            return;
        }
        
        spellList.innerHTML = '';
        const player = gameState.player;
        
        // Get player's available spells using SpellSystem
        let spells = [];
        if (gameState.spellSystem && typeof gameState.spellSystem.getAvailableSpells === 'function') {
            spells = gameState.spellSystem.getAvailableSpells();
        } else if (player.spells) {
            spells = player.spells;
        } else if (player.knownSpells) {
            spells = player.knownSpells;
        }
        
        if (spells.length === 0) {
            const noSpells = document.createElement('div');
            noSpells.textContent = 'No spells available';
            noSpells.className = 'no-spells';
            noSpells.style.color = '#9ca3af';
            noSpells.style.textAlign = 'center';
            noSpells.style.padding = '10px';
            spellList.appendChild(noSpells);
            return;
        }
        
        // Group spells by category for better organization
        const spellsByCategory = this.groupSpellsByCategory(spells);

        // Create spell categories
        Object.entries(spellsByCategory).forEach(([category, categorySpells]) => {
            if (categorySpells.length === 0) return;

            // Create category header
            const categoryHeader = document.createElement('div');
            categoryHeader.className = 'spell-category-header';
            categoryHeader.textContent = this.formatCategoryName(category);
            spellList.appendChild(categoryHeader);

            // Create category container
            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'spell-category-container';
            spellList.appendChild(categoryContainer);

            categorySpells.forEach(spell => {
                const spellCard = this.createEnhancedSpellButton(spell, player);
                categoryContainer.appendChild(spellCard);
            });
        });
        
        console.log(`🧙 Populated ${spells.length} spells`);
    }

    /**
     * Group spells by category for organized display
     */
    groupSpellsByCategory(spells) {
        const categories = {
            damage: [],
            healing: [],
            utility: [],
            buff: [],
            debuff: [],
            other: []
        };

        spells.forEach(spell => {
            const spellData = this.getSpellData(spell);
            const category = this.determineSpellCategory(spellData);
            categories[category].push(spell);
        });

        // Remove empty categories
        Object.keys(categories).forEach(key => {
            if (categories[key].length === 0) {
                delete categories[key];
            }
        });

        return categories;
    }

    /**
     * Get unified spell data from different formats
     */
    getSpellData(spell) {
        if (typeof spell === 'string') {
            return { id: spell, name: spell, element: 'none', effects: [] };
        } else if (spell.data) {
            return { id: spell.id || spell.spellId, ...spell.data };
        } else {
            return { id: spell.id || spell.spellId || spell.name, ...spell };
        }
    }

    /**
     * Determine spell category based on effects
     */
    determineSpellCategory(spellData) {
        const effects = spellData.effects || [];
        const spellName = (spellData.name || '').toLowerCase();

        // Check for healing spells
        if (effects.some(e => e.type === 'heal') || spellName.includes('heal') || spellName.includes('cure')) {
            return 'healing';
        }

        // Check for damage spells
        if (effects.some(e => e.type === 'damage') ||
            spellName.includes('ball') || spellName.includes('bolt') ||
            spellName.includes('strike') || spellName.includes('blast')) {
            return 'damage';
        }

        // Check for buffs
        if (effects.some(e => e.type === 'status_applied' && e.beneficial) ||
            spellName.includes('bless') || spellName.includes('enhance') || spellName.includes('boost')) {
            return 'buff';
        }

        // Check for debuffs
        if (effects.some(e => e.type === 'status_applied' && !e.beneficial) ||
            spellName.includes('curse') || spellName.includes('slow') || spellName.includes('weaken')) {
            return 'debuff';
        }

        // Check for utility spells
        if (effects.some(e => ['teleport', 'summon', 'shield', 'dispel'].includes(e.type)) ||
            spellName.includes('light') || spellName.includes('detect') || spellName.includes('shield')) {
            return 'utility';
        }

        return 'other';
    }

    /**
     * Format category name for display
     */
    formatCategoryName(category) {
        const categoryNames = {
            damage: '⚔️ Damage Spells',
            healing: '✨ Healing Spells',
            utility: '🛠️ Utility Spells',
            buff: '📈 Buffs',
            debuff: '📉 Debuffs',
            other: '🔮 Other Spells'
        };
        return categoryNames[category] || '🔮 Other Spells';
    }

    /**
     * Create enhanced spell button with detailed information
     */
    createEnhancedSpellButton(spell, player) {
        const spellCard = document.createElement('button');
        spellCard.className = 'spell-card';

        // Get spell data
        const spellData = this.getSpellData(spell);
        spellCard.setAttribute('data-spell', spellData.id || spell.id || spell);
        let canCast = true;
        let canCastReason = '';

        // Check if can cast using spell system
        if (spell.canCast) {
            canCast = spell.canCast.canCast;
            canCastReason = spell.canCast.reason || '';
        }

        // Create spell header
        const spellHeader = document.createElement('div');
        spellHeader.className = 'spell-header';

        // Create spell name with element icon
        const spellNameContainer = document.createElement('div');
        spellNameContainer.className = 'spell-name';

        if (spellData.element && spellData.element !== 'none') {
            const elementIcon = document.createElement('span');
            elementIcon.className = 'spell-element-icon';
            elementIcon.textContent = this.getElementIcon(spellData.element);
            elementIcon.title = spellData.element;
            spellNameContainer.appendChild(elementIcon);
        }

        const nameText = document.createElement('span');
        nameText.textContent = spellData.name || spellData.id;
        spellNameContainer.appendChild(nameText);

        // Create MP cost display
        const spellCost = document.createElement('div');
        spellCost.className = 'spell-mp-cost';
        const mpCost = spellData.mpCost || 0;
        spellCost.textContent = mpCost > 0 ? `${mpCost} MP` : 'Free';

        spellHeader.appendChild(spellNameContainer);
        spellHeader.appendChild(spellCost);

        // Create spell description
        if (spellData.description) {
            const description = document.createElement('div');
            description.className = 'spell-description';
            description.textContent = spellData.description;
            spellCard.appendChild(description);
        }

        // Create spell details section
        const spellDetails = document.createElement('div');
        spellDetails.className = 'spell-details';

        // Add damage/effect info
        if (spellData.damage) {
            const damageInfo = document.createElement('div');
            damageInfo.className = 'spell-damage-range';
            if (typeof spellData.damage === 'object' && spellData.damage.min !== undefined) {
                damageInfo.textContent = `${spellData.damage.min}-${spellData.damage.max} dmg`;
            } else {
                damageInfo.textContent = `${spellData.damage} dmg`;
            }
            spellDetails.appendChild(damageInfo);
        } else if (spellData.healing) {
            const healingInfo = document.createElement('div');
            healingInfo.className = 'spell-effect-info';
            if (typeof spellData.healing === 'object' && spellData.healing.min !== undefined) {
                healingInfo.textContent = `${spellData.healing.min}-${spellData.healing.max} heal`;
            } else {
                healingInfo.textContent = `${spellData.healing} heal`;
            }
            spellDetails.appendChild(healingInfo);
        } else if (spellData.effects && spellData.effects.length > 0) {
            const effectInfo = document.createElement('div');
            effectInfo.className = 'spell-effect-info';
            effectInfo.textContent = spellData.effects.slice(0, 2).join(', ');
            spellDetails.appendChild(effectInfo);
        }

        // Add cooldown if applicable
        if (spell.cooldown && spell.cooldown > 0) {
            const cooldownInfo = document.createElement('div');
            cooldownInfo.className = 'spell-effect-info';
            cooldownInfo.textContent = `Cooldown: ${Math.ceil(spell.cooldown)}s`;
            spellDetails.appendChild(cooldownInfo);
        }

        // Add level/tier info if available
        if (spellData.level || spellData.tier) {
            const levelInfo = document.createElement('div');
            levelInfo.className = 'spell-effect-info';
            levelInfo.textContent = `Lv.${spellData.level || spellData.tier}`;
            spellDetails.appendChild(levelInfo);
        }

        spellCard.appendChild(spellHeader);
        spellCard.appendChild(spellDetails);

        // Apply styling and interactivity based on availability
        if (!canCast) {
            spellCard.classList.add('spell-insufficient-mp');
            spellCard.disabled = true;
            spellCard.title = canCastReason;
        } else {
            spellCard.addEventListener('click', () => {
                this.hideSubMenu('magic-submenu');
                this.showTargetSelection('magic', {
                    id: spellData.id,
                    name: spellData.name || spellData.id
                });
            });
        }

        return spellCard;
    }

    /**
     * Get element icon for spell display
     */
    getElementIcon(element) {
        const elementIcons = {
            fire: '🔥',
            ice: '❄️',
            water: '💧',
            thunder: '⚡',
            electric: '⚡',
            earth: '🌍',
            nature: '🌿',
            healing: '✨',
            holy: '☀️',
            light: '💡',
            dark: '🌑',
            death: '💀',
            arcane: '🔮',
            wind: '💨',
            poison: '☠️'
        };
        return elementIcons[element] || '✨';
    }

    /**
     * Populate item list for items submenu
     * Extracted from original ui.js populateItemList method
     */
    populateItemList() {
        const itemList = document.querySelector('#items-submenu .item-list');
        if (!itemList) {
            console.warn('Item list element not found');
            return;
        }
        
        const gameState = this.gameState || window.GameState;
        if (!gameState || !gameState.player) {
            this.notifyError('Player data not available');
            return;
        }
        
        itemList.innerHTML = '';
        const inventory = gameState.player.inventory || {};
        
        // Get usable items in combat
        const usableItems = Object.entries(inventory)
            .filter(([itemName, quantity]) => quantity > 0 && this.isUsableInCombat(itemName))
            .map(([itemName, quantity]) => ({ name: itemName, quantity }));
        
        if (usableItems.length === 0) {
            const noItems = document.createElement('div');
            noItems.textContent = 'No usable items';
            noItems.className = 'no-items';
            noItems.style.color = '#9ca3af';
            noItems.style.textAlign = 'center';
            noItems.style.padding = '10px';
            itemList.appendChild(noItems);
            return;
        }
        
        usableItems.forEach(item => {
            const itemBtn = document.createElement('button');
            itemBtn.className = 'item-btn';
            itemBtn.textContent = `${item.name} (${item.quantity})`;
            
            this.addEventListener(itemBtn, 'click', () => {
                this.hideSubMenu('items-submenu');
                this.showTargetSelection('item', item.name);
            });
            
            itemList.appendChild(itemBtn);
        });
        
        console.log(`🎒 Populated ${usableItems.length} usable items`);
    }

    /**
     * Check if an item is usable in combat
     * Extracted from original ui.js isUsableInCombat method
     */
    isUsableInCombat(itemName) {
        const combatItems = [
            'potion', 'hi_potion', 'ether', 'elixir',
            'antidote', 'eye_drops', 'echo_screen',
            'phoenix_down', 'remedy', 'mega_potion',
            'healing_potion', 'mana_potion', 'stamina_potion'
        ];
        return combatItems.includes(itemName);
    }

    // ================================================
    // ACTION EXECUTION
    // ================================================

    /**
     * Execute the selected action on the chosen target
     * Extracted from original ui.js executeTargetedAction method
     */
    executeTargetedAction(actionType, target, actionData) {
        const gameState = this.gameState || window.GameState;
        if (!gameState || !gameState.combat) {
            this.notifyError('Combat system not available');
            return;
        }

        const combat = gameState.combat;
        this.selectedTarget = target;
        
        try {
            switch(actionType) {
                case 'attack':
                    if (typeof combat.performAttack === 'function') {
                        const attackResult = combat.performAttack(combat.player, target);
                        const attackMsg = `${combat.player.name || 'Player'} attacks ${target.name || 'enemy'}!`;
                        this.addBattleLogEntry(attackMsg, 'attack');
                        this.notifyInfo(attackMsg);
                    } else {
                        // Fallback simple damage calculation
                        const baseAtk = combat.player?.attack || 10;
                        const def = target.defense || 0;
                        const dmg = Math.max(1, Math.round(baseAtk - def * 0.5));
                        target.hp = Math.max(0, (target.hp || target.maxHp || 10) - dmg);
                        const attackMsg = `${combat.player?.name || 'Player'} hits ${target.name || 'enemy'} for ${dmg} damage!`;
                        this.addBattleLogEntry(attackMsg, 'attack');
                        this.notifyInfo(attackMsg);
                        if (target.hp === 0) {
                            this.addBattleLogEntry(`${target.name || 'Enemy'} is defeated!`, 'success');
                            this.notifySuccess(`${target.name || 'Enemy'} defeated!`);
                        }
                    }
                    break;
                case 'capture':
                    // Use the proper CombatEngine instead of fallback logic
                    if (gameState.combatEngine && typeof gameState.combatEngine.attemptCapture === 'function') {
                        console.log(`🎯 Using CombatEngine.attemptCapture for ${target.name || 'enemy'}`);
                        const captureResult = gameState.combatEngine.attemptCapture(target.id || 0);
                        const captureMsg = `Attempting to capture ${target.name || 'enemy'}!`;
                        this.addBattleLogEntry(captureMsg, 'capture');
                        this.notifyInfo(captureMsg);
                    } else {
                        console.warn('🚨 CombatEngine.attemptCapture not available, using fallback');
                        // Fallback: simple capture chance based on target HP
                        const hpRatio = target.maxHp > 0 ? (target.hp / target.maxHp) : 1;
                        const chance = Math.max(0.1, 0.6 - hpRatio * 0.5); // 10% to 60%
                        if (Math.random() < chance) {
                            target.hp = 0;
                            this.addBattleLogEntry(`Captured ${target.name || 'enemy'}!`, 'success');
                            this.notifySuccess(`Captured ${target.name || 'enemy'}!`);
                        } else {
                            this.addBattleLogEntry(`Capture failed on ${target.name || 'enemy'}.`, 'info');
                            this.notifyInfo('Capture failed. Try weakening the enemy.');
                        }
                    }
                    break;
                case 'magic':
                    if (actionData) {
                        // Get spell ID (actionData might be spell object or ID)
                        const spellId = typeof actionData === 'string' ? actionData : actionData.id;

                        // Get target ID - try multiple approaches
                        let targetId = target.id || target.monsterId || target.name;

                        // If still no ID, try to find the target in combat enemies by name
                        if (!targetId && gameState.combat && gameState.combat.enemies) {
                            const enemy = gameState.combat.enemies.find(e => e.name === target.name);
                            if (enemy) {
                                targetId = enemy.id || enemy.monsterId || enemy.name;
                            }
                        }

                        // Debug targeting
                        console.log('🎯 Spell targeting debug:', {
                            spellId,
                            target: target,
                            targetId: targetId,
                            targetName: target.name || 'Unknown',
                            combatEnemies: gameState.combat?.enemies?.map(e => ({ name: e.name, id: e.id, monsterId: e.monsterId }))
                        });

                        // Use the combat engine's castSpell method (which uses SpellSystem)
                        let spellResult = null;

                        // Try GameState spell casting first (direct SpellSystem access)
                        if (gameState.castSpell && typeof gameState.castSpell === 'function') {
                            console.log('🎯 Using GameState.castSpell');
                            spellResult = gameState.castSpell(spellId, targetId);
                        } else if (gameState.spellSystem && typeof gameState.spellSystem.castSpell === 'function') {
                            // Direct spell system access
                            console.log('🎯 Using SpellSystem.castSpell directly');
                            spellResult = gameState.spellSystem.castSpell(spellId, 'player', targetId);
                        } else if (gameState.combatEngine && typeof gameState.combatEngine.castSpell === 'function') {
                            // Fallback to combat engine (though turnOrder is empty)
                            console.log('🎯 Using CombatEngine.castSpell (fallback)');
                            spellResult = gameState.combatEngine.castSpell('player', spellId, targetId);
                        } else {
                            console.error('No spell casting system available');
                            this.addBattleLogEntry('Spell casting system not available', 'error');
                            this.notifyError('Cannot cast spells - system not initialized');
                            break;
                        }

                        if (spellResult && spellResult.success) {
                            const spell = spellResult.spell;
                            const casterName = spellResult.caster?.name || 'Player';
                            const magicMsg = `${casterName} casts ${spell.name}!`;
                            this.addBattleLogEntry(magicMsg, 'magic');
                            this.notifyInfo(magicMsg);

                            // Debug spell results
                            console.log('🔍 Spell result:', spellResult);

                            // Show spell results
                            if (spellResult.effects && spellResult.effects.length > 0) {
                                console.log('📊 Processing spell effects:', spellResult.effects);
                                spellResult.effects.forEach(effect => {
                                    console.log('📊 Individual effect:', effect);
                                    if (effect.type === 'damage' && effect.amount > 0) {
                                        this.addBattleLogEntry(`${spellResult.target?.name || 'Target'} takes ${effect.amount} damage!`, 'damage');
                                    } else if (effect.type === 'healing' && effect.amount > 0) {
                                        this.addBattleLogEntry(`${spellResult.target?.name || 'Target'} recovers ${effect.amount} HP!`, 'healing');
                                    }
                                });
                            } else {
                                console.log('⚠️ No spell effects to display - effects:', spellResult.effects);
                            }
                        } else {
                            const reason = spellResult ? spellResult.reason : 'Spell failed';
                            this.addBattleLogEntry(`Spell failed: ${reason}`, 'error');
                            this.notifyError(`Cannot cast spell: ${reason}`);
                        }
                    }
                    break;
                case 'item':
                    if (actionData) {
                        const itemResult = combat.useItem(actionData, target);
                        const itemMsg = `${combat.player.name || 'Player'} uses ${actionData} on ${target.name || 'target'}!`;
                        this.addBattleLogEntry(itemMsg, 'item');
                        this.notifyInfo(itemMsg);
                    }
                    break;
                default:
                    console.warn(`Unknown action type: ${actionType}`);
                    this.addBattleLogEntry(`Unknown action: ${actionType}`, 'error');
                    this.notifyWarning(`Unknown action: ${actionType}`);
            }
            
            // Update combat display after action
            this.updateCombatDisplay();
            // If we are using fallback (no engine), run a simple enemy turn then return to player
            this.proceedToEnemyTurnIfFallback(combat);
            
        } catch (error) {
            console.error('Combat action failed:', error);
            this.addBattleLogEntry(`Action failed: ${error.message}`, 'error');
            this.notifyError(`Action failed: ${error.message}`);
        }

        console.log(`🔍 executeTargetedAction END: currentTurn=${combat.currentTurn} (${typeof combat.currentTurn})`);
        console.log(`⚔️ Executed ${actionType} on ${target.name || 'target'}`);
    }

    /**
     * In fallback mode (no engine), simulate an enemy turn after the player's action
     */
    proceedToEnemyTurnIfFallback(combat) {
        try {
            if (!combat) return;
            const usingEngine = typeof combat.performAttack === 'function' || typeof combat.nextTurn === 'function';
            // If no engine and enemies remain, simulate a quick enemy attack
            const aliveEnemies = (combat.enemies || []).filter(e => (e?.hp || 0) > 0);
            if (usingEngine || aliveEnemies.length === 0) {
                // Victory check
                if (aliveEnemies.length === 0) {
                    this.addBattleLogEntry('Victory! Returning to world...', 'success');
                    this.notifySuccess('Victory!');
                    // Reset combat state after victory
                    combat.active = false;
                    combat.currentTurn = null;
                    // Return to world after brief delay
                    setTimeout(() => {
                        try { this.sendMessage('showScene', { sceneName: 'game_world' }); } catch(_){ }
                    }, 500);
                }
                return;
            }

            // Set processing state and disable actions
            combat.currentTurn = 'processing';
            this.updateTurnDisplay(combat);

            setTimeout(() => {
                // Enemy chooses a target (player)
                const enemy = aliveEnemies[0];
                const atk = enemy.attack || 6;
                const def = combat.player?.defense || 0;
                const dmg = Math.max(1, Math.round(atk - def * 0.3));
                combat.player.hp = Math.max(0, (combat.player.hp || combat.player.maxHp || 50) - dmg);
                const msg = `${enemy.name || 'Enemy'} strikes back for ${dmg} damage!`;
                this.addBattleLogEntry(msg, 'enemy');
                this.notifyInfo(msg);

                // Check defeat
                if (combat.player.hp === 0) {
                    this.addBattleLogEntry('You were defeated...', 'error');
                    this.notifyError('Defeated...');
                    // Reset combat state after defeat
                    combat.active = false;
                    combat.currentTurn = null;
                    setTimeout(() => {
                        try { this.sendMessage('showScene', { sceneName: 'game_world' }); } catch(_){ }
                    }, 800);
                    return;
                }

                // Back to player turn
                combat.currentTurn = 'player';
                combat.turnCount = (combat.turnCount || 1) + 1;
                this.updateCombatDisplay();
            }, 500);
        } catch (e) {
            console.warn('Fallback enemy turn failed:', e);
        }
    }

    // ================================================
    // COMBAT DISPLAY UPDATES
    // ================================================

    /**
     * Update combat display with current battle state
     */
    updateCombatDisplay() {
        const gameState = this.gameState || window.GameState;
        if (!gameState || !gameState.combat) {
            return;
        }
        
        const combat = gameState.combat;
        
        // Update player stats
        this.updatePlayerDisplay(combat.player);

        // Update enemy displays
        this.updateEnemyDisplays(combat.enemies || []);

        // Update battle log
        this.updateBattleLog();

        // Update action button states
        this.updateActionButtonStates(combat);
        
        // Update turn management display
        this.updateTurnDisplay(combat);
        
        console.log('🔄 Combat display updated');
    }

    /**
     * Update player display in combat
     */
    updatePlayerDisplay(player) {
        if (!player) return;
        
        // Update HP
        const playerHP = document.getElementById('player-hp');
        if (playerHP) {
            playerHP.textContent = `${player.hp}/${player.maxHp}`;
        }
        
        // Update MP
        const playerMP = document.getElementById('player-mp');
        if (playerMP) {
            playerMP.textContent = `${player.mana || player.mp || 0}/${player.maxMana || player.maxMp || 0}`;
        }

        // Enhanced MP display using new CSS classes
        const mpDisplay = document.querySelector('.mp-display .mp-text');
        if (mpDisplay) {
            const currentMP = player.mana || player.mp || 0;
            const maxMP = player.maxMana || player.maxMp || 0;
            mpDisplay.textContent = `Mana: ${currentMP}/${maxMP}`;
        }

        // Update HP bar
        const hpBar = document.querySelector('.player-hp-bar .hp-fill');
        if (hpBar && player.maxHp > 0) {
            const hpPercent = (player.hp / player.maxHp) * 100;
            hpBar.style.width = `${hpPercent}%`;
        }

        // Update MP bar (both old and new styles)
        const mpBar = document.querySelector('.player-mp-bar .mp-fill');
        if (mpBar && player.maxMana > 0) {
            const mpPercent = ((player.mana || player.mp || 0) / player.maxMana) * 100;
            mpBar.style.width = `${mpPercent}%`;
        }

        // Update enhanced MP bar
        const enhancedMpBar = document.querySelector('.mp-bar .mp-fill');
        if (enhancedMpBar && (player.maxMana || player.maxMp) > 0) {
            const currentMP = player.mana || player.mp || 0;
            const maxMP = player.maxMana || player.maxMp || 0;
            const mpPercent = (currentMP / maxMP) * 100;
            enhancedMpBar.style.width = `${mpPercent}%`;
        }

        // Update spell button states based on current MP
        this.updateSpellButtonStates(player.mana || player.mp || 0);
    }

    /**
     * Update spell button states based on current MP
     */
    updateSpellButtonStates(currentMP) {
        const spellButtons = document.querySelectorAll('.spell-card');
        spellButtons.forEach(button => {
            const mpCostElement = button.querySelector('.spell-mp-cost');
            if (mpCostElement) {
                const mpCostText = mpCostElement.textContent;
                const mpCost = parseInt(mpCostText.replace(/[^\d]/g, '')) || 0;

                if (mpCost > currentMP) {
                    button.classList.add('spell-insufficient-mp');
                    button.disabled = true;
                } else {
                    button.classList.remove('spell-insufficient-mp');
                    button.disabled = false;
                }
            }
        });
    }

    /**
     * Update enemy displays in combat
     */
    updateEnemyDisplays(enemies) {
        if (!enemies || !Array.isArray(enemies)) return;
        
        // Ensure enemy slots exist in DOM
        const container = document.querySelector('.enemy-combatants');
        if (container) {
            const existing = container.querySelectorAll('[data-enemy-index]');
            if (existing.length < enemies.length) {
                for (let i = existing.length; i < enemies.length; i++) {
                    const slot = document.createElement('div');
                    slot.className = 'combatant enemy';
                    slot.setAttribute('data-enemy-index', String(i));
                    slot.innerHTML = `
                        <div class="enemy-name">Enemy ${i + 1}</div>
                        <div class="health-bar enemy-hp-bar">
                            <div class="hp-fill" style="width: 100%"></div>
                            <span class="health-text enemy-hp">--/--</span>
                        </div>
                        <div class="status-effects"></div>
                    `;
                    container.appendChild(slot);
                }
            }
        }
        
        enemies.forEach((enemy, index) => {
            const enemyElement = document.querySelector(`[data-enemy-index="${index}"]`);
            if (!enemyElement) return;
            
            // Update enemy name
            const nameElement = enemyElement.querySelector('.enemy-name');
            if (nameElement) {
                nameElement.textContent = enemy.name || `Enemy ${index + 1}`;
            }
            
            // Update enemy HP
            const hpElement = enemyElement.querySelector('.enemy-hp');
            if (hpElement) {
                hpElement.textContent = `${enemy.hp}/${enemy.maxHp}`;
            }
            
            // Update enemy HP bar
            const hpBar = enemyElement.querySelector('.enemy-hp-bar .hp-fill');
            if (hpBar && enemy.maxHp > 0) {
                const hpPercent = (enemy.hp / enemy.maxHp) * 100;
                hpBar.style.width = `${hpPercent}%`;
            }
            
            // Update enemy status (alive/defeated)
            if (enemy.hp <= 0) {
                enemyElement.classList.add('defeated');
            } else {
                enemyElement.classList.remove('defeated');
            }
        });
    }

    /**
     * Update battle log with recent actions
     */
    updateBattleLog() {
        const battleLog = document.getElementById('battle-log');
        if (!battleLog) return;
        
        const gameState = this.gameState || window.GameState;
        if (!gameState || !gameState.combat || !gameState.combat.battleLog) {
            // Create empty log if none exists
            this.clearBattleLog();
            return;
        }
        
        const log = gameState.combat.battleLog;
        battleLog.innerHTML = '';
        
        // Show recent log entries (last 5)
        const recentEntries = log.slice(-5);
        recentEntries.forEach((entry, index) => {
            const logEntry = document.createElement('div');
            logEntry.className = 'battle-log-entry';
            logEntry.textContent = entry;
            
            // Add entry type styling if available
            if (typeof entry === 'object' && entry.type) {
                logEntry.classList.add(`log-${entry.type}`);
                logEntry.textContent = entry.message;
            }
            
            // Add fade-in animation for new entries
            if (index === recentEntries.length - 1) {
                logEntry.classList.add('log-entry-new');
            }
            
            battleLog.appendChild(logEntry);
        });
        
        // Auto-scroll to bottom
        battleLog.scrollTop = battleLog.scrollHeight;
    }

    /**
     * Add entry to battle log
     */
    addBattleLogEntry(message, type = 'info') {
        const gameState = this.gameState || window.GameState;
        if (!gameState || !gameState.combat) {
            return;
        }
        
        if (!gameState.combat.battleLog) {
            gameState.combat.battleLog = [];
        }
        
        // Add timestamp and type info
        const entry = {
            message,
            type,
            timestamp: Date.now()
        };
        
        gameState.combat.battleLog.push(entry);
        
        // Limit log size to prevent memory issues
        if (gameState.combat.battleLog.length > 50) {
            gameState.combat.battleLog = gameState.combat.battleLog.slice(-50);
        }
        
        // Update display
        this.updateBattleLog();
        
        console.log(`📝 Battle log: ${message} (${type})`);
    }

    /**
     * Clear battle log
     */
    clearBattleLog() {
        const battleLog = document.getElementById('battle-log');
        if (battleLog) {
            battleLog.innerHTML = '<div class="battle-log-empty">Battle begins...</div>';
        }
        
        const gameState = this.gameState || window.GameState;
        if (gameState && gameState.combat) {
            gameState.combat.battleLog = [];
        }
    }

    /**
     * Get battle log entries
     */
    getBattleLogEntries(count = 10) {
        const gameState = this.gameState || window.GameState;
        if (!gameState || !gameState.combat || !gameState.combat.battleLog) {
            return [];
        }
        
        return gameState.combat.battleLog.slice(-count);
    }

    /**
     * Update action button states based on combat situation
     */
    updateActionButtonStates(combat) {
        // Check if it's player's turn - if not, don't override the turn-based disable logic
        const isPlayerTurn = combat.currentTurn === 'player';
        const isProcessing = combat.currentTurn === 'processing';

        // If it's not player turn or processing, skip this method to avoid conflicts
        if (!isPlayerTurn || isProcessing) {
            console.log('🔄 Skipping action button state update - not player turn');
            return;
        }

        // Update attack button
        const attackBtn = document.getElementById('attack-btn');
        if (attackBtn) {
            const enemies = combat.enemies || [];
            const hasEnemies = enemies.some(enemy => enemy.hp > 0);
            attackBtn.disabled = !hasEnemies;
            if (!hasEnemies) console.log('🔒 Attack disabled - no enemies');
        }

        // Update capture button
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            const enemies = combat.enemies || [];
            const canCapture = enemies.some(enemy => enemy.hp > 0 && enemy.capturable !== false);
            captureBtn.disabled = !canCapture;
            if (!canCapture) console.log('🔒 Capture disabled - no capturable enemies');
        }

        // Update magic button
        const magicBtn = document.getElementById('magic-btn');
        if (magicBtn) {
            const player = combat.player || {};
            const hasSpells = player.spells && player.spells.length > 0;
            const hasMana = (player.mana || player.mp || 0) > 0;
            magicBtn.disabled = !hasSpells || !hasMana;
            if (!hasSpells || !hasMana) console.log('🔒 Magic disabled - no spells or mana');
        }

        // Update items button
        const itemsBtn = document.getElementById('items-btn');
        if (itemsBtn) {
            const player = combat.player || {};
            const hasUsableItems = Object.entries(player.inventory || {})
                .some(([item, qty]) => qty > 0 && this.isUsableInCombat(item));
            itemsBtn.disabled = !hasUsableItems;
            if (!hasUsableItems) console.log('🔒 Items disabled - no usable items');
        }
    }

    // ================================================
    // TURN MANAGEMENT UI
    // ================================================

    /**
     * Update turn display and management UI
     */
    updateTurnDisplay(combat) {
        if (!combat) return;
        
        // Update turn indicator
        this.updateTurnIndicator(combat);
        
        // Update turn order display
        this.updateTurnOrderDisplay(combat);
        
        // Update turn-specific UI states
        this.updateTurnBasedUI(combat);
        
        console.log(`🔄 Turn display updated - Current: ${combat.currentTurn || 'unknown'}`);
    }

    /**
     * Update turn indicator showing whose turn it is
     */
    updateTurnIndicator(combat) {
        const turnIndicator = document.getElementById('turn-indicator');
        if (!turnIndicator) return;
        
        const currentTurn = combat.currentTurn || 'unknown';
        
        // Update indicator text
        let turnText = '';
        switch(currentTurn) {
            case 'player':
                turnText = 'Your Turn';
                turnIndicator.className = 'turn-indicator player-turn';
                break;
            case 'enemy':
                turnText = 'Enemy Turn';
                turnIndicator.className = 'turn-indicator enemy-turn';
                break;
            case 'processing':
                turnText = 'Processing...';
                turnIndicator.className = 'turn-indicator processing-turn';
                break;
            default:
                turnText = 'Combat';
                turnIndicator.className = 'turn-indicator';
        }
        
        turnIndicator.textContent = turnText;
        
        // Add turn counter if available
        if (combat.turnCount !== undefined) {
            const turnCounter = turnIndicator.querySelector('.turn-counter') || 
                              document.createElement('span');
            turnCounter.className = 'turn-counter';
            turnCounter.textContent = ` - Turn ${combat.turnCount}`;
            
            if (!turnIndicator.querySelector('.turn-counter')) {
                turnIndicator.appendChild(turnCounter);
            }
        }
    }

    /**
     * Update turn order display showing initiative order
     */
    updateTurnOrderDisplay(combat) {
        const turnOrder = document.getElementById('turn-order');
        if (!turnOrder) return;
        
        // Get all combat participants
        const participants = [];
        
        if (combat.player) {
            participants.push({
                name: combat.player.name || 'Player',
                type: 'player',
                hp: combat.player.hp,
                maxHp: combat.player.maxHp,
                initiative: combat.player.initiative || 0,
                isActive: combat.currentTurn === 'player'
            });
        }
        
        if (combat.enemies && Array.isArray(combat.enemies)) {
            combat.enemies.forEach((enemy, index) => {
                if (enemy.hp > 0) {
                    participants.push({
                        name: enemy.name || `Enemy ${index + 1}`,
                        type: 'enemy',
                        hp: enemy.hp,
                        maxHp: enemy.maxHp,
                        initiative: enemy.initiative || 0,
                        isActive: combat.currentTurn === 'enemy' && combat.activeEnemyIndex === index
                    });
                }
            });
        }
        
        // Sort by initiative (highest first)
        participants.sort((a, b) => (b.initiative || 0) - (a.initiative || 0));
        
        // Update turn order display
        turnOrder.innerHTML = '';
        participants.forEach(participant => {
            const participantEl = document.createElement('div');
            participantEl.className = `turn-participant ${participant.type}`;
            
            if (participant.isActive) {
                participantEl.classList.add('active-turn');
            }
            
            const nameEl = document.createElement('span');
            nameEl.className = 'participant-name';
            nameEl.textContent = participant.name;
            
            const hpEl = document.createElement('span');
            hpEl.className = 'participant-hp';
            const hpPercent = participant.maxHp > 0 ? 
                            Math.round((participant.hp / participant.maxHp) * 100) : 0;
            hpEl.textContent = `${hpPercent}%`;
            
            participantEl.appendChild(nameEl);
            participantEl.appendChild(hpEl);
            turnOrder.appendChild(participantEl);
        });
    }

    /**
     * Update UI elements based on turn state
     */
    updateTurnBasedUI(combat) {
        const isPlayerTurn = combat.currentTurn === 'player';
        const isProcessing = combat.currentTurn === 'processing';

        console.log(`🔍 updateTurnBasedUI: currentTurn=${combat.currentTurn}, isPlayerTurn=${isPlayerTurn}, isProcessing=${isProcessing}`);
        console.log(`🔍 combat.active=${combat.active}, combat.turnCount=${combat.turnCount || 'undefined'}`);

        // Enable/disable main action menu based on turn
        const actionMenu = document.getElementById('main-action-menu');
        if (actionMenu) {
            if (isPlayerTurn && !isProcessing) {
                actionMenu.classList.remove('disabled');
                console.log('🔓 Enabled main action menu');
            } else {
                actionMenu.classList.add('disabled');
                console.log('🔒 Disabled main action menu');
            }
        }

        // Update action buttons interactivity
        const actionButtons = ['attack-btn', 'magic-btn', 'items-btn', 'capture-btn', 'flee-btn'];
        actionButtons.forEach(buttonId => {
            const button = document.getElementById(buttonId);
            if (button) {
                if (!isPlayerTurn || isProcessing) {
                    button.style.pointerEvents = 'none';
                    button.style.opacity = '0.5';
                    button.setAttribute('disabled', 'true');
                    button.disabled = true;
                    console.log(`🔒 Disabled button: ${buttonId} - disabled=${button.disabled}`);
                } else {
                    button.style.pointerEvents = 'auto';
                    button.style.opacity = '1';
                    // Force styles with !important to override any CSS conflicts
                    button.style.setProperty('opacity', '1', 'important');
                    button.style.setProperty('pointer-events', 'auto', 'important');

                    // Force remove disabled attribute that might be causing CSS conflicts
                    button.removeAttribute('disabled');
                    button.disabled = false;
                }
            } else {
                console.warn(`⚠️ Button not found: ${buttonId}`);
            }
        });

        // Show/hide turn-specific messages
        this.updateTurnMessages(combat);
    }

    /**
     * Update turn-specific messages and prompts
     */
    updateTurnMessages(combat) {
        const messageArea = document.getElementById('combat-messages');
        if (!messageArea) return;
        
        const currentTurn = combat.currentTurn;
        let message = '';
        
        switch(currentTurn) {
            case 'player':
                message = 'Choose your action';
                break;
            case 'enemy':
                message = 'Enemy is thinking...';
                break;
            case 'processing':
                message = 'Processing actions...';
                break;
            default:
                message = '';
        }
        
        if (message) {
            messageArea.textContent = message;
            messageArea.classList.remove('hidden');
        } else {
            messageArea.classList.add('hidden');
        }
    }

    /**
     * Start player turn
     */
    startPlayerTurn() {
        const gameState = this.gameState || window.GameState;
        if (gameState && gameState.combat) {
            gameState.combat.currentTurn = 'player';
            this.addBattleLogEntry('Your turn!', 'turn');
            this.updateCombatDisplay();
        }
        
        console.log('▶️ Player turn started');
    }

    /**
     * Start enemy turn
     */
    startEnemyTurn() {
        const gameState = this.gameState || window.GameState;
        if (gameState && gameState.combat) {
            gameState.combat.currentTurn = 'enemy';
            this.addBattleLogEntry('Enemy turn!', 'turn');
            this.updateCombatDisplay();
        }
        
        console.log('▶️ Enemy turn started');
    }

    /**
     * Start processing phase
     */
    startProcessingPhase() {
        const gameState = this.gameState || window.GameState;
        if (gameState && gameState.combat) {
            gameState.combat.currentTurn = 'processing';
            this.updateCombatDisplay();
        }
        
        console.log('⚙️ Processing phase started');
    }

    /**
     * Advance to next turn
     */
    advanceTurn() {
        const gameState = this.gameState || window.GameState;
        if (!gameState || !gameState.combat) return;
        
        const combat = gameState.combat;
        
        // Increment turn counter
        if (combat.turnCount === undefined) {
            combat.turnCount = 1;
        } else {
            combat.turnCount++;
        }
        
        // Switch turns (simplified turn logic)
        if (combat.currentTurn === 'player') {
            this.startEnemyTurn();
        } else if (combat.currentTurn === 'enemy') {
            this.startPlayerTurn();
        } else {
            this.startPlayerTurn(); // Default to player turn
        }
        
        console.log(`🔄 Advanced to turn ${combat.turnCount}`);
    }

    // ================================================
    // UTILITY METHODS
    // ================================================

    /**
     * Reset combat UI state
     */
    resetCombatState() {
        this.currentSubmenu = null;
        this.selectedAction = null;
        this.selectedTarget = null;
        this.actionData = null;
        
        // Hide all submenus
        this.hideAllSubMenus();
        
        // Clear battle log for new combat
        this.clearBattleLog();
        
        console.log('🔄 Combat UI state reset');
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
     * Get current combat state
     */
    getCurrentCombatState() {
        const gameState = this.gameState || window.GameState;
        return gameState ? gameState.combat : null;
    }

    /**
     * Check if combat is active
     */
    isCombatActive() {
        const combat = this.getCurrentCombatState();
        return combat && combat.inCombat;
    }

    /**
     * Check if player's turn
     */
    isPlayerTurn() {
        const combat = this.getCurrentCombatState();
        return combat && combat.currentTurn === 'player';
    }

    /**
     * Cleanup combat UI resources
     */
    cleanup() {
        this.resetCombatState();
        super.cleanup();
        console.log('🧹 CombatUI cleaned up');
    }
}

// Export for both module and global usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombatUI;
} else if (typeof window !== 'undefined') {
    window.CombatUI = CombatUI;
}