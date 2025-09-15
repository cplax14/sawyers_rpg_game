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
                    // Show target selection if multiple enemies
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
        if (actionType === 'attack' || actionType === 'capture') {
            targets = combat.enemies.filter(enemy => enemy.hp > 0);
        } else if (actionType === 'magic' || actionType === 'item') {
            // Could target enemies or allies depending on spell/item
            targets = combat.enemies.filter(enemy => enemy.hp > 0);
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
        
        const gameState = this.gameState || window.GameState;
        if (!gameState || !gameState.player) {
            this.notifyError('Player data not available');
            return;
        }
        
        spellList.innerHTML = '';
        const player = gameState.player;
        
        // Get player's available spells
        let spells = [];
        if (player.spells) {
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
        
        spells.forEach(spell => {
            const spellBtn = document.createElement('button');
            spellBtn.className = 'spell-btn';
            
            let spellName = typeof spell === 'string' ? spell : spell.name;
            let manaCost = typeof spell === 'object' ? spell.manaCost : 0;
            
            spellBtn.textContent = `${spellName}${manaCost > 0 ? ` (${manaCost} MP)` : ''}`;
            
            // Disable if not enough mana
            if (manaCost > 0 && player.mana < manaCost) {
                spellBtn.disabled = true;
                spellBtn.classList.add('insufficient-mana');
            }
            
            this.addEventListener(spellBtn, 'click', () => {
                this.hideSubMenu('magic-submenu');
                this.showTargetSelection('magic', spell);
            });
            
            spellList.appendChild(spellBtn);
        });
        
        console.log(`🧙 Populated ${spells.length} spells`);
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
                    const attackResult = combat.performAttack(combat.player, target);
                    const attackMsg = `${combat.player.name || 'Player'} attacks ${target.name || 'enemy'}!`;
                    this.addBattleLogEntry(attackMsg, 'attack');
                    this.notifyInfo(attackMsg);
                    break;
                case 'capture':
                    const captureResult = combat.attemptCapture(target);
                    const captureMsg = `Attempting to capture ${target.name || 'enemy'}!`;
                    this.addBattleLogEntry(captureMsg, 'capture');
                    this.notifyInfo(captureMsg);
                    break;
                case 'magic':
                    if (actionData) {
                        const spellResult = combat.castSpell(combat.player, actionData, target);
                        const spellName = typeof actionData === 'string' ? actionData : actionData.name;
                        const magicMsg = `${combat.player.name || 'Player'} casts ${spellName} on ${target.name || 'target'}!`;
                        this.addBattleLogEntry(magicMsg, 'magic');
                        this.notifyInfo(magicMsg);
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
            
        } catch (error) {
            console.error('Combat action failed:', error);
            this.addBattleLogEntry(`Action failed: ${error.message}`, 'error');
            this.notifyError(`Action failed: ${error.message}`);
        }
        
        console.log(`⚔️ Executed ${actionType} on ${target.name || 'target'}`);
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
        this.updateEnemyDisplays(combat.enemies);
        
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
        
        // Update HP bar
        const hpBar = document.querySelector('.player-hp-bar .hp-fill');
        if (hpBar && player.maxHp > 0) {
            const hpPercent = (player.hp / player.maxHp) * 100;
            hpBar.style.width = `${hpPercent}%`;
        }
        
        // Update MP bar
        const mpBar = document.querySelector('.player-mp-bar .mp-fill');
        if (mpBar && player.maxMana > 0) {
            const mpPercent = ((player.mana || player.mp || 0) / player.maxMana) * 100;
            mpBar.style.width = `${mpPercent}%`;
        }
    }

    /**
     * Update enemy displays in combat
     */
    updateEnemyDisplays(enemies) {
        if (!enemies || !Array.isArray(enemies)) return;
        
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
        // Update attack button
        const attackBtn = document.getElementById('attack-btn');
        if (attackBtn) {
            const hasEnemies = combat.enemies.some(enemy => enemy.hp > 0);
            attackBtn.disabled = !hasEnemies;
        }
        
        // Update capture button
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            const canCapture = combat.enemies.some(enemy => enemy.hp > 0 && enemy.capturable !== false);
            captureBtn.disabled = !canCapture;
        }
        
        // Update magic button
        const magicBtn = document.getElementById('magic-btn');
        if (magicBtn) {
            const hasSpells = combat.player.spells && combat.player.spells.length > 0;
            const hasMana = (combat.player.mana || combat.player.mp || 0) > 0;
            magicBtn.disabled = !hasSpells || !hasMana;
        }
        
        // Update items button
        const itemsBtn = document.getElementById('items-btn');
        if (itemsBtn) {
            const hasUsableItems = Object.entries(combat.player.inventory || {})
                .some(([item, qty]) => qty > 0 && this.isUsableInCombat(item));
            itemsBtn.disabled = !hasUsableItems;
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
        
        // Enable/disable main action menu based on turn
        const actionMenu = document.getElementById('main-action-menu');
        if (actionMenu) {
            if (isPlayerTurn && !isProcessing) {
                actionMenu.classList.remove('disabled');
            } else {
                actionMenu.classList.add('disabled');
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
                } else {
                    button.style.pointerEvents = 'auto';
                    button.style.opacity = '1';
                }
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