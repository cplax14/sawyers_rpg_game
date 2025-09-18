/**
 * Game State Manager
 * Central system for tracking all game data, progress, and state
 */

class GameState {
    constructor() {
        this.initialized = false;
        this.currentScene = 'main_menu';
        this.previousScene = null;
        
        // Player data
        this.player = {
            name: '',
            class: null,
            level: 1,
            experience: 0,
            experienceToNext: 100,
            stats: {},
            spells: [],
            equipment: {
                weapon: null,
                armor: null,
                accessory: null
            },
            inventory: {
                items: {},
                gold: 100,
                maxSlots: 50, // Maximum number of different item types
                overflowPolicy: 'prompt' // 'auto-discard', 'prompt', 'store'
            }
        };
        
        // Monster collection
        this.monsters = {
            party: [], // Active party (max 3)
            storage: [], // All captured monsters
            nextId: 1
        };
        
        // World and story progress
        this.world = {
            currentArea: 'starting_village',
            unlockedAreas: ['starting_village'],
            storyFlags: [],
            completedEvents: [],
            currentStoryPath: null,
            defeatedBosses: [],
            storyBranches: {
                currentBranch: null,
                availableBranches: [],
                branchHistory: []
            }
        };
        
        // Game settings
        this.settings = {
            // Audio settings
            masterVolume: 0.5,
            musicVolume: 0.7,
            sfxVolume: 0.75,
            voiceVolume: 0.8,
            
            // Gameplay settings
            difficulty: 'normal', // easy, normal, hard, nightmare
            autoSave: true,
            autoSaveInterval: 5, // minutes
            battleAnimations: true,
            skipIntro: false,
            monsterNotifications: true,
            
            // Display settings
            theme: 'fantasy', // fantasy, dark, light, colorful
            uiScale: 100, // 80-120%
            showFPS: false,
            reduceMotion: false,
            highContrast: false,
            
            // Controls settings
            keyboardShortcuts: true,
            mouseSensitivity: 5,
            keyBindings: {
                menu: 'Escape',
                inventory: 'KeyI',
                map: 'KeyM',
                monsters: 'KeyP'
            }
        };
        
        // Combat state
        this.combat = {
            active: false,
            enemy: null,
            turn: 0,
            turnOrder: [],
            currentTurn: 0,
            actions: [],
            battleResult: null
        };
        
        // UI state
        this.ui = {
            activeMenu: null,
            selectedIndex: 0,
            dialogueActive: false,
            currentDialogue: null,
            notifications: []
        };
        
        // Game statistics
        this.stats = {
            playtime: 0,
            monstersEncountered: 0,
            monstersCaptured: 0,
            battlesWon: 0,
            areasExplored: 0,
            storyChoicesMade: 0
        };
        
        // Initialize the state
        this.init();
    }

    /** Determine if the player can equip a given itemId */
    canEquip(itemId) {
        if (typeof ItemData === 'undefined') return { ok: false, reason: 'Item data unavailable' };
        const item = ItemData.getItem(itemId);
        if (!item) return { ok: false, reason: 'Item not found' };
        // Only equipment types
        if (!['weapon', 'armor', 'accessory'].includes(item.type)) {
            return { ok: false, reason: 'Not equippable' };
        }
        // Class/level restrictions
        if (!ItemData.canPlayerUseItem(itemId, this.player)) {
            return { ok: false, reason: 'Requirements not met' };
        }
        return { ok: true, slot: item.type };
    }

    /** Equip an item from inventory into its slot; returns {ok, swapped} */
    equipItem(itemId) {
        const check = this.canEquip(itemId);
        if (!check.ok) {
            this.addNotification(check.reason || 'Cannot equip item', 'error');
            return { ok: false };
        }
        // Must have item in inventory
        if (!this.player.inventory.items[itemId] || this.player.inventory.items[itemId] <= 0) {
            this.addNotification('Item not in inventory', 'error');
            return { ok: false };
        }
        const slot = check.slot; // weapon/armor/accessory
        const previous = this.player.equipment[slot];
        // Equip new
        this.player.equipment[slot] = itemId;
        // Consume one if items are stackable for equipment; for now treat equipment as unique count
        // Do not decrement here to keep inventory as owned list; optional: decrement if representing bag counts
        this.recalcPlayerStats();
        this.addNotification(`Equipped ${ItemData.getItem(itemId)?.name || itemId}`, 'success');
        return { ok: true, swapped: previous };
    }

    /** Unequip item from slot; returns {ok, itemId} */
    unequipItem(slot) {
        if (!['weapon', 'armor', 'accessory'].includes(slot)) return { ok: false };
        const current = this.player.equipment[slot];
        if (!current) return { ok: false };
        // Clear equipped slot
        this.player.equipment[slot] = null;
        // Return item to inventory
        this.player.inventory = this.player.inventory || {};
        this.player.inventory.items = this.player.inventory.items || {};
        this.player.inventory.items[current] = (this.player.inventory.items[current] || 0) + 1;
        // Recalc stats and notify
        this.recalcPlayerStats();
        try {
            const name = (typeof ItemData !== 'undefined' && ItemData.getItem) ? (ItemData.getItem(current)?.name || current) : current;
            this.addNotification(`Unequipped ${name}`, 'info');
        } catch (_) {
            this.addNotification('Unequipped', 'info');
        }
        return { ok: true, itemId: current };
    }

    /** Recalculate player stats based on class base and equipment bonuses */
    recalcPlayerStats() {
        // Base stats from class/level
        if (this.player.class && typeof CharacterData !== 'undefined') {
            this.player.stats = CharacterData.getStatsAtLevel(this.player.class, this.player.level);
        }
        // Apply equipment bonuses
        if (typeof ItemData !== 'undefined') {
            let eqStats = {};
            try {
                if (typeof ItemData.getEquipmentStats === 'function') {
                    eqStats = ItemData.getEquipmentStats(this.player.equipment) || {};
                } else if (typeof ItemData.getItem === 'function') {
                    // Fallback: sum stats from equipped items directly
                    const slots = ['weapon', 'armor', 'accessory'];
                    slots.forEach(slot => {
                        const itemId = this.player.equipment?.[slot];
                        if (!itemId) return;
                        const item = ItemData.getItem(itemId);
                        if (item && item.stats) {
                            for (const [k, v] of Object.entries(item.stats)) {
                                eqStats[k] = (eqStats[k] || 0) + (v || 0);
                            }
                        }
                    });
                }
            } catch (e) {
                // In tests without ItemData helpers, ignore equipment bonuses
                eqStats = {};
            }
            for (const key of Object.keys(eqStats)) {
                const base = this.player.stats[key] || 0;
                this.player.stats[key] = base + (eqStats[key] || 0);
            }
        }
    }
    
    /**
     * Initialize the game state
     */
    init() {
        try {
            // Set up event listeners for state changes
            this.setupEventHandlers();
            
            // Initialize default values
            this.resetToDefaults();
            
            // Initialize breeding system if available
            this.initializeBreedingSystem();
            // Initialize combat engine if available
            this.initializeCombatEngine();
            
            this.initialized = true;
            console.log('✅ GameState initialized');
            
        } catch (error) {
            console.error('❌ GameState initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Set up event handlers for state management
     */
    setupEventHandlers() {
        // Listen for storage events (for cross-tab synchronization)
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', (e) => {
                if (e.key === 'sawyers_rpg_autosave') {
                    console.log('Auto-save detected from another tab');
                }
            });
        }
    }
    
    /**
     * Reset state to default values
     */
    resetToDefaults() {
        // Reset player to starting state
        this.player = {
            name: '',
            class: null,
            level: 1,
            experience: 0,
            experienceToNext: 100,
            stats: {},
            spells: [],
            equipment: {
                weapon: null,
                armor: null,
                accessory: null
            },
            inventory: {
                items: { 'health_potion': 3, 'mana_potion': 2 },
                gold: 100
            }
        };
        
        // Reset world progress
        this.world = {
            currentArea: 'starting_village',
            unlockedAreas: ['starting_village'],
            storyFlags: ['game_start'],
            completedEvents: [],
            currentStoryPath: null,
            defeatedBosses: [],
            storyBranches: {
                currentBranch: null,
                availableBranches: [],
                branchHistory: []
            }
        };
        // Establish initial story path based on starting flags
        try {
            if (typeof StoryData !== 'undefined' && typeof StoryData.calculateStoryBranch === 'function') {
                this.world.currentStoryPath = StoryData.calculateStoryBranch(this.world.storyFlags);
            }
        } catch (e) { console.warn('Story path calc on defaults failed:', e); }
        
        // Clear monster collection
        this.monsters = {
            party: [],
            storage: [],
            nextId: 1
        };
        
        // Reset combat state
        this.resetCombat();
        
        // Reset statistics
        this.stats = {
            playtime: 0,
            monstersEncountered: 0,
            monstersCaptured: 0,
            battlesWon: 0,
            areasExplored: 1, // Starting village
            storyChoicesMade: 0
        };
    }

    /**
     * Initialize breeding system wrapper
     */
    initializeBreedingSystem() {
        this.breeding = null;
        if (typeof MonsterBreedingSystem !== 'undefined') {
            try {
                this.breeding = new MonsterBreedingSystem(this);
            } catch (e) {
                console.warn('⚠️ Failed to initialize MonsterBreedingSystem:', e);
            }
        } else {
            console.warn('⚠️ MonsterBreedingSystem not loaded');
        }
    }
    
    /**
     * Initialize combat engine wrapper
     */
    initializeCombatEngine() {
        this.combatEngine = null;
        if (typeof CombatEngine !== 'undefined') {
            try {
                this.combatEngine = new CombatEngine(this);
            } catch (e) {
                console.warn('⚠️ Failed to initialize CombatEngine:', e);
            }
        } else {
            console.warn('⚠️ CombatEngine not loaded');
        }
    }

    /**
     * Trigger a random encounter based on area spawn tables and encounter rate
     */
    triggerRandomEncounter(areaId) {
        try {
            if (typeof AreaData === 'undefined' || typeof MonsterData === 'undefined') {
                this.addNotification('World data unavailable', 'error');
                return { started: false, reason: 'data_unavailable' };
            }
            const area = AreaData.getArea(areaId);
            if (!area) {
                this.addNotification('Unknown area', 'error');
                return { started: false, reason: 'unknown_area' };
            }
            const encounter = AreaData.generateRandomEncounter(areaId, this.player.level);
            if (!encounter) {
                this.addNotification('No monsters encountered...', 'info');
                return { started: false, reason: 'none' };
            }
            this.startEncounter(encounter);
            return { started: true };
        } catch (e) {
            console.warn('Failed to trigger random encounter:', e);
            return { started: false, reason: 'error' };
        }
    }

    /**
     * Start an encounter using the combat engine or a minimal fallback
     */
    startEncounter(encounter) {
        // Ensure combat engine exists
        if (!this.combatEngine) {
            this.initializeCombatEngine();
        }
        try {
            if (this.combatEngine && typeof this.combatEngine.startEncounter === 'function') {
                this.combatEngine.startEncounter(encounter);
            } else {
                // Minimal fallback to set combat active and store enemy info
                this.initializeCombat();
                const species = encounter?.species || encounter?.monster || 'unknown';
                const level = encounter?.level || Math.max(1, this.player.level);
                const baseStats = (typeof MonsterData !== 'undefined' && MonsterData.getStatsAtLevel)
                    ? MonsterData.getStatsAtLevel(species, level)
                    : { hp: 20, attack: 5, defense: 3 };

                // Ensure combat container shape expected by CombatUI
                this.combat.active = true;
                // Player stub - restore to full health for new combat
                const pStats = this.player.stats || {};
                const maxHp = Math.max(pStats.hp || 100, 100); // Ensure minimum 100 HP
                const maxMana = Math.max(pStats.mana || pStats.mp || 10, 10); // Ensure minimum 10 MP
                this.combat.player = {
                    name: this.player.name || 'Player',
                    hp: maxHp, // Always start combat at full HP
                    maxHp: maxHp,
                    mana: maxMana, // Always start combat at full MP
                    maxMana: maxMana,
                    attack: pStats.attack || 50, // Ensure reasonable attack power
                    defense: pStats.defense || 30, // Ensure reasonable defense
                    magicAttack: pStats.magicAttack || 40,
                    magicDefense: pStats.magicDefense || 35,
                    speed: pStats.speed || 60,
                    accuracy: pStats.accuracy || 80,
                    spells: this.player.spells || [],
                    inventory: this.player.inventory?.items || {}
                };

                // Also restore player stats for consistency
                if (!this.player.stats) this.player.stats = {};
                this.player.stats.hp = maxHp;
                this.player.stats.mana = maxMana;
                this.player.stats.maxHp = maxHp;
                this.player.stats.maxMana = maxMana;

                // Enemy array expected by UI
                const enemy = {
                    name: species,
                    species,
                    level,
                    hp: baseStats.hp || 20,
                    maxHp: baseStats.hp || 20,
                    attack: baseStats.attack || 5,
                    defense: baseStats.defense || 3,
                    capturable: true
                };
                this.combat.enemies = [enemy];
                // Basic turn state
                this.combat.currentTurn = 'player';
                this.combat.turnCount = 1;
            }
            // Stats and notifications
            this.stats.monstersEncountered++;
            this.addNotification('A wild encounter appears!', 'success');

            // Switch to combat scene via UI if available; also update internal scene
            try {
                if (typeof window !== 'undefined' && window.SawyersRPG && window.SawyersRPG.getUI) {
                    const ui = window.SawyersRPG.getUI();
                    if (ui && typeof ui.showScene === 'function') {
                        ui.showScene('combat');
                    }
                }
            } catch (_) {}
            this.changeScene('combat');
        } catch (e) {
            console.error('Failed to start encounter:', e);
            this.addNotification('Encounter failed to start', 'error');
        }
    }
    
    /**
     * Update game state (called every frame)
     */
    update(deltaTime) {
        if (!this.initialized) return;
        
        // Update playtime
        this.stats.playtime += deltaTime;
        
        // Update UI notifications
        this.updateNotifications(deltaTime);
        
        // Update combat state if active
        if (this.combat.active) {
            this.updateCombat(deltaTime);
        }
        
        // Auto-save periodically
        if (this.settings.autoSave && this.stats.playtime % 30 < deltaTime) {
            this.triggerAutoSave();
        }

        // Clean up old notifications periodically (every 30 seconds)
        if (this.stats.playtime % 30 < deltaTime) {
            this.cleanupNotifications();
        }
    }
    
    /**
     * Render game state (for canvas-based rendering)
     */
    render(ctx) {
        if (!this.initialized || !ctx) return;
        
        // Render current scene
        switch (this.currentScene) {
            case 'world':
                this.renderWorld(ctx);
                break;
            case 'combat':
                this.renderCombat(ctx);
                break;
            case 'menu':
                this.renderMenu(ctx);
                break;
        }
        
        // Render UI overlays
        this.renderUI(ctx);
    }
    
    /**
     * Handle input events
     */
    handleInput(inputType, inputData) {
        if (!this.initialized) return;
        
        switch (this.currentScene) {
            case 'main_menu':
                this.handleMenuInput(inputType, inputData);
                break;
            case 'character_select':
                this.handleCharacterSelectInput(inputType, inputData);
                break;
            case 'world':
                this.handleWorldInput(inputType, inputData);
                break;
            case 'combat':
                this.handleCombatInput(inputType, inputData);
                break;
            case 'monster_management':
                this.handleMonsterInput(inputType, inputData);
                break;
        }
    }
    
    // ================================================
    // PLAYER MANAGEMENT
    // ================================================
    
    /**
     * Set player character class
     */
    setPlayerClass(className) {
        if (typeof CharacterData === 'undefined') {
            console.error('CharacterData not loaded');
            return false;
        }
        
        const classData = CharacterData.getClass(className);
        if (!classData) {
            console.error(`Unknown character class: ${className}`);
            return false;
        }
        
        this.player.class = className;
        this.player.stats = CharacterData.getStatsAtLevel(className, this.player.level);
        this.player.spells = [...classData.startingSpells];
        
        console.log(`Player class set to: ${classData.name}`);
        return true;
    }
    
    /**
     * Add experience to player
     */
    addExperience(amount) {
        this.player.experience += amount;
        
        // Check for level up
        while (this.player.experience >= this.player.experienceToNext) {
            this.levelUp();
        }
        
        this.addNotification(`+${amount} EXP`, 'success');
    }
    
    /**
     * Level up the player
     */
    levelUp() {
        this.player.experience -= this.player.experienceToNext;
        this.player.level++;
        
        // Calculate new stats
        if (this.player.class && typeof CharacterData !== 'undefined') {
            this.player.stats = CharacterData.getStatsAtLevel(this.player.class, this.player.level);
            this.player.spells = CharacterData.getSpellsAtLevel(this.player.class, this.player.level);
        }
        
        // Calculate next level experience requirement
        this.player.experienceToNext = this.calculateExperienceRequired(this.player.level + 1);
        
        this.addNotification(`Level Up! Now level ${this.player.level}`, 'success');
        console.log(`Player leveled up to ${this.player.level}`);
    }
    
    /**
     * Calculate experience required for a level
     */
    calculateExperienceRequired(level) {
        return Math.floor(100 * Math.pow(1.2, level - 1));
    }
    
    /**
     * Add item to inventory with overflow handling
     */
    addItem(itemId, quantity = 1, rarity = 'common') {
        if (!itemId || quantity <= 0) return false;

        // Check if inventory is at capacity for new item types
        const currentSlots = Object.keys(this.player.inventory.items).length;
        const isNewItem = !this.player.inventory.items[itemId];
        const maxSlots = this.player.inventory.maxSlots || 50;

        if (isNewItem && currentSlots >= maxSlots) {
            return this.handleInventoryOverflow(itemId, quantity, rarity);
        }

        // Add to existing or create new slot
        if (!this.player.inventory.items[itemId]) {
            this.player.inventory.items[itemId] = 0;
        }
        this.player.inventory.items[itemId] += quantity;

        // Enhanced notification with rarity indicator
        const rarityText = rarity !== 'common' ? ` (${rarity})` : '';
        this.addNotification(`+${quantity} ${itemId}${rarityText}`, 'item');
        return true;
    }

    /**
     * Handle inventory overflow when adding new items
     */
    handleInventoryOverflow(itemId, quantity, rarity = 'common') {
        const policy = this.player.inventory.overflowPolicy || 'prompt';

        switch (policy) {
            case 'auto-discard':
                // Automatically discard common items, keep rare+
                if (['common', 'uncommon'].includes(rarity)) {
                    this.addNotification(`Inventory full! Discarded ${quantity} ${itemId}`, 'warning');
                    return false;
                } else {
                    // For rare items, try to make space by discarding common items
                    return this.makeSpaceForRareItem(itemId, quantity, rarity);
                }

            case 'store':
                // Store overflow items in a separate overflow inventory
                return this.addToOverflowStorage(itemId, quantity, rarity);

            case 'prompt':
            default:
                // Queue the item for player choice
                return this.promptPlayerForOverflow(itemId, quantity, rarity);
        }
    }

    /**
     * Make space for rare items by discarding common ones
     */
    makeSpaceForRareItem(itemId, quantity, rarity) {
        const items = this.player.inventory.items;

        // Find common items to discard (prefer lowest quantity)
        const discardCandidates = Object.entries(items)
            .filter(([id, count]) => {
                const itemRarity = this.getItemRarity(id);
                return itemRarity === 'common' && count > 0;
            })
            .sort((a, b) => a[1] - b[1]); // Sort by quantity (ascending)

        if (discardCandidates.length > 0) {
            const [discardId] = discardCandidates[0];
            delete items[discardId];

            // Now add the rare item
            items[itemId] = quantity;
            const rarityText = rarity !== 'common' ? ` (${rarity})` : '';
            this.addNotification(`Made space by discarding ${discardId}. +${quantity} ${itemId}${rarityText}`, 'item');
            return true;
        }

        // If no common items to discard, fall back to discard notification
        this.addNotification(`Inventory full! Cannot fit ${quantity} ${itemId} (${rarity})`, 'warning');
        return false;
    }

    /**
     * Add item to overflow storage
     */
    addToOverflowStorage(itemId, quantity, rarity) {
        if (!this.player.inventory.overflow) {
            this.player.inventory.overflow = {};
        }

        if (!this.player.inventory.overflow[itemId]) {
            this.player.inventory.overflow[itemId] = 0;
        }
        this.player.inventory.overflow[itemId] += quantity;

        const rarityText = rarity !== 'common' ? ` (${rarity})` : '';
        this.addNotification(`Inventory full! Stored ${quantity} ${itemId}${rarityText} in overflow`, 'info');
        return true;
    }

    /**
     * Prompt player for overflow decision
     */
    promptPlayerForOverflow(itemId, quantity, rarity) {
        // Queue the overflow decision for UI handling
        if (!this.ui.pendingOverflowDecisions) {
            this.ui.pendingOverflowDecisions = [];
        }

        this.ui.pendingOverflowDecisions.push({
            itemId,
            quantity,
            rarity,
            timestamp: Date.now()
        });

        const rarityText = rarity !== 'common' ? ` (${rarity})` : '';
        this.addNotification(`Inventory full! ${itemId}${rarityText} x${quantity} awaiting your decision`, 'warning');
        return false; // Item not added yet, awaiting player decision
    }

    /**
     * Get item rarity for overflow decisions
     */
    getItemRarity(itemId) {
        if (typeof ItemData !== 'undefined') {
            const item = ItemData.getItem(itemId);
            return item?.rarity || 'common';
        }

        // Fallback rarity detection based on item name patterns
        if (itemId.includes('legendary') || itemId.includes('ancient')) return 'legendary';
        if (itemId.includes('epic') || itemId.includes('supreme')) return 'epic';
        if (itemId.includes('rare') || itemId.includes('enchanted')) return 'rare';
        if (itemId.includes('magic') || itemId.includes('enhanced')) return 'uncommon';
        return 'common';
    }

    /**
     * Process pending overflow decisions
     */
    processOverflowDecision(decision) {
        if (!this.ui.pendingOverflowDecisions) return false;

        const pending = this.ui.pendingOverflowDecisions.shift();
        if (!pending) return false;

        const { itemId, quantity, rarity } = pending;

        switch (decision.action) {
            case 'keep':
                // Make space by discarding selected item or oldest common item
                if (decision.discardItem) {
                    delete this.player.inventory.items[decision.discardItem];
                    this.addNotification(`Discarded ${decision.discardItem} to make space`, 'info');
                } else {
                    // Auto-discard oldest common item
                    const commonItems = Object.keys(this.player.inventory.items)
                        .filter(id => this.getItemRarity(id) === 'common');
                    if (commonItems.length > 0) {
                        const discardItem = commonItems[0];
                        delete this.player.inventory.items[discardItem];
                        this.addNotification(`Auto-discarded ${discardItem} to make space`, 'info');
                    }
                }
                return this.addItem(itemId, quantity, rarity);

            case 'discard':
                this.addNotification(`Discarded ${quantity} ${itemId}`, 'info');
                return false;

            case 'store':
                return this.addToOverflowStorage(itemId, quantity, rarity);

            default:
                return false;
        }
    }

    /**
     * Get overflow storage items
     */
    getOverflowItems() {
        return this.player.inventory.overflow || {};
    }

    /**
     * Move item from overflow to main inventory
     */
    retrieveFromOverflow(itemId, quantity = null) {
        const overflow = this.player.inventory.overflow;
        if (!overflow || !overflow[itemId] || overflow[itemId] <= 0) {
            return { success: false, reason: 'Item not in overflow storage' };
        }

        const availableQuantity = overflow[itemId];
        const retrieveQuantity = quantity || availableQuantity;

        if (retrieveQuantity > availableQuantity) {
            return { success: false, reason: 'Not enough items in overflow' };
        }

        // Check if main inventory has space
        const currentSlots = Object.keys(this.player.inventory.items).length;
        const hasItem = !!this.player.inventory.items[itemId];
        const maxSlots = this.player.inventory.maxSlots || 50;

        if (!hasItem && currentSlots >= maxSlots) {
            return { success: false, reason: 'Main inventory is full' };
        }

        // Move item from overflow to main inventory
        if (!this.player.inventory.items[itemId]) {
            this.player.inventory.items[itemId] = 0;
        }
        this.player.inventory.items[itemId] += retrieveQuantity;

        // Update overflow storage
        overflow[itemId] -= retrieveQuantity;
        if (overflow[itemId] <= 0) {
            delete overflow[itemId];
        }

        this.addNotification(`Retrieved ${retrieveQuantity} ${itemId} from overflow storage`, 'success');
        return { success: true, quantity: retrieveQuantity };
    }
    
    /**
     * Remove item from inventory
     */
    removeItem(itemId, quantity = 1) {
        if (!this.player.inventory.items[itemId]) return false;
        
        if (this.player.inventory.items[itemId] >= quantity) {
            this.player.inventory.items[itemId] -= quantity;
            if (this.player.inventory.items[itemId] === 0) {
                delete this.player.inventory.items[itemId];
            }
            return true;
        }
        
        return false;
    }
    
    /**
     * Add gold to player
     */
    addGold(amount) {
        this.player.inventory.gold += amount;
        this.addNotification(`+${amount} gold`, 'success');
    }

    // ================================================
    // MONSTER MANAGEMENT
    // ================================================
    
    /**
     * Capture a monster
     */
    captureMonster(species, level, stats = null) {
        const monster = {
            id: this.monsters.nextId++,
            species: species,
            level: level,
            experience: 0,
            stats: stats || (typeof MonsterData !== 'undefined' ?
                MonsterData.getStatsAtLevel(species, level) : {}),
            abilities: typeof MonsterData !== 'undefined' ?
                MonsterData.getSpecies(species)?.abilities || [] : [],
            speciesData: typeof MonsterData !== 'undefined' ?
                MonsterData.getSpecies(species) : null,
            captureDate: new Date().toISOString(),
            nickname: null
        };
        
        this.monsters.storage.push(monster);
        this.stats.monstersCaptured++;

        this.addNotification(`Captured ${species}!`, 'success');
        console.log(`✅ Monster captured: ${species} (Level ${level}) - ID: ${monster.id}`);
        console.log(`📊 Total storage count: ${this.monsters.storage.length}`);
        
        return monster.id;
    }
    
    /**
     * Add monster to active party
     */
    addToParty(monsterId) {
        if (this.monsters.party.length >= 3) {
            console.warn('Party is full (max 3 monsters)');
            return false;
        }
        
        const monster = this.monsters.storage.find(m => m.id === monsterId);
        if (!monster) {
            console.error(`Monster with ID ${monsterId} not found`);
            return false;
        }
        
        // Remove from storage and add to party
        this.monsters.storage = this.monsters.storage.filter(m => m.id !== monsterId);
        this.monsters.party.push(monster);
        
        console.log(`${monster.species} added to party`);
        return true;
    }
    
    /**
     * Remove monster from party
     */
    removeFromParty(monsterId) {
        const monster = this.monsters.party.find(m => m.id === monsterId);
        if (!monster) return false;
        
        // Remove from party and add to storage
        this.monsters.party = this.monsters.party.filter(m => m.id !== monsterId);
        this.monsters.storage.push(monster);
        
        console.log(`${monster.species} removed from party`);
        return true;
    }

    // ================================================
    // SKILL LEARNING (4.7)
    // ================================================
    /**
     * Check if a stored monster can learn a move
     */
    canTeachMove(monsterId, moveId) {
        const { monster } = this.getMonsterByIdAnywhere(monsterId);
        if (!monster) return { canLearn: false, reason: 'Monster not found' };
        // Build temp Monster instance to use logic
        const inst = this.buildMonsterInstance(monster);
        if (!inst) return { canLearn: false, reason: 'Monster instance unavailable' };
        // Sync current learned moves from stored data if present
        if (Array.isArray(monster.abilities)) {
            inst.learnedMoves = [...monster.abilities];
        }
        return inst.canLearnMove(moveId);
    }
    
    /**
     * Teach a move to a stored monster using an inventory item (scroll)
     * itemId defaults to `scroll_<moveId>`
     */
    teachMoveWithItem(monsterId, moveId, replaceIndex = null, itemId = null) {
        const { monster, location } = this.getMonsterByIdAnywhere(monsterId);
        if (!monster) return { success: false, reason: 'Monster not found' };
        const inv = this.player.inventory.items;
        const requiredItem = itemId || `scroll_${moveId}`;
        if (!inv[requiredItem] || inv[requiredItem] <= 0) {
            return { success: false, reason: 'Required scroll not in inventory' };
        }
        // Use a Monster instance for applying the learning logic, then sync back
        const inst = this.buildMonsterInstance(monster);
        if (!inst) return { success: false, reason: 'Monster instance unavailable' };
        // Sync current learned moves from stored data if present
        if (Array.isArray(monster.abilities)) {
            inst.learnedMoves = [...monster.abilities];
        }
        const res = inst.learnMove(moveId, replaceIndex);
        if (!res.success) return res;
        // Consume item
        this.removeItem(requiredItem, 1);
        this.addNotification(`Used ${requiredItem} to teach ${moveId}`, 'item');
        // Persist learned moves back into stored representation
        monster.abilities = [...inst.learnedMoves];
        this.addNotification(`${monster.species} learned ${moveId}!`, 'success');
        return { success: true };
    }

    // ================================================
    // BREEDING INTEGRATION
    // ================================================
    
    /**
     * Find monster by ID in party or storage
     */
    getMonsterByIdAnywhere(monsterId) {
        const inParty = this.monsters.party.find(m => m.id === monsterId);
        if (inParty) return { monster: inParty, location: 'party' };
        const inStorage = this.monsters.storage.find(m => m.id === monsterId);
        if (inStorage) return { monster: inStorage, location: 'storage' };
        return { monster: null, location: null };
    }
    
    /**
     * Build a lightweight Monster instance for system checks from stored data
     */
    buildMonsterInstance(stored) {
        if (typeof Monster === 'undefined' || !stored) return null;
        const instance = new Monster(stored.species, stored.level || 1, false);
        instance.id = stored.id;
        // Best-effort friendship default if not tracked in stored object
        if (typeof instance.friendship === 'undefined') instance.friendship = 50;
        return instance;
    }
    
    /**
     * Check if two stored monsters can breed
     */
    canBreed(monsterId1, monsterId2) {
        if (!this.breeding) {
            return { canBreed: false, reason: 'Breeding system not available' };
        }
        const a = this.getMonsterByIdAnywhere(monsterId1).monster;
        const b = this.getMonsterByIdAnywhere(monsterId2).monster;
        if (!a || !b) return { canBreed: false, reason: 'Monster not found' };
        const m1 = this.buildMonsterInstance(a);
        const m2 = this.buildMonsterInstance(b);
        return this.breeding.canBreedTogether(m1, m2);
    }
    
    /**
     * Attempt to breed two monsters and add offspring to storage
     */
    breed(monsterId1, monsterId2) {
        if (!this.breeding) {
            return { success: false, reason: 'Breeding system not available' };
        }
        const check = this.canBreed(monsterId1, monsterId2);
        if (!check.canBreed) {
            this.addNotification(check.reason || 'Breeding not allowed', 'error');
            return { success: false, reason: check.reason };
        }
        if (typeof MonsterData === 'undefined') {
            return { success: false, reason: 'Monster data not available' };
        }
        const a = this.getMonsterByIdAnywhere(monsterId1).monster;
        const b = this.getMonsterByIdAnywhere(monsterId2).monster;
        
        // Determine outcome
        const outcomes = MonsterData.getBreedingOutcomes(a.species, b.species);
        if (!outcomes || outcomes.length === 0) {
            this.addNotification('No valid breeding outcomes', 'error');
            return { success: false, reason: 'No outcomes' };
        }
        const total = outcomes.reduce((s, o) => s + o.chance, 0);
        let roll = Math.random() * total;
        let chosen = outcomes[0].species;
        for (const o of outcomes) {
            roll -= o.chance;
            if (roll <= 0) { chosen = o.species; break; }
        }
        
        // Create offspring and add to storage at level 1
        const offspringLevel = 1;
        const stats = MonsterData.getStatsAtLevel(chosen, offspringLevel) || {};
        const offspringId = this.captureMonster(chosen, offspringLevel, stats);
        this.addNotification(`Breeding produced ${MonsterData.getSpecies(chosen)?.name || chosen}!`, 'success');
        
        // Apply cooldowns
        const now = Date.now();
        const cdSec = (this.breeding.settings?.cooldownTime) || 900; // seconds
        const expireAt = now + cdSec * 1000;
        this.breeding.breedingCooldowns.set(monsterId1, expireAt);
        this.breeding.breedingCooldowns.set(monsterId2, expireAt);
        
        // Record history
        this.breeding.breedingHistory.push({
            parents: [monsterId1, monsterId2],
            offspring: { id: offspringId, species: chosen, level: offspringLevel },
            time: new Date(now).toISOString()
        });
        
        return { success: true, offspringId };
    }
    
    /**
     * Release monster back to the wild
     */
    releaseMonster(monsterId) {
        // Remove from storage
        const storageIndex = this.monsters.storage.findIndex(m => m.id === monsterId);
        if (storageIndex !== -1) {
            const monster = this.monsters.storage[storageIndex];
            this.monsters.storage.splice(storageIndex, 1);
            this.addNotification(`${monster.species} released`, 'info');
            return true;
        }
        
        // Remove from party
        const partyIndex = this.monsters.party.findIndex(m => m.id === monsterId);
        if (partyIndex !== -1) {
            const monster = this.monsters.party[partyIndex];
            this.monsters.party.splice(partyIndex, 1);
            this.addNotification(`${monster.species} released`, 'info');
            return true;
        }
        
        return false;
    }
    
    // ================================================
    // WORLD AND STORY MANAGEMENT
    // ================================================
    
    /**
     * Travel to a new area
     */
    travelToArea(areaName) {
        if (typeof AreaData === 'undefined') {
            console.error('AreaData not loaded');
            return false;
        }
        
        // Check if area is unlocked
        const isUnlocked = AreaData.isAreaUnlocked(
            areaName, 
            this.world.storyFlags, 
            this.player.level, 
            Object.keys(this.player.inventory.items),
            this.player.class
        );
        
        if (!isUnlocked) {
            this.addNotification('Area is locked', 'error');
            return false;
        }
        
        // Check if area is connected to current area
        const connections = AreaData.getConnectedAreas(this.world.currentArea);
        if (!connections.includes(areaName) && this.world.currentArea !== areaName) {
            this.addNotification('Cannot reach that area from here', 'error');
            return false;
        }
        
        this.world.currentArea = areaName;
        
        // Add to unlocked areas if not already there
        if (!this.world.unlockedAreas.includes(areaName)) {
            this.world.unlockedAreas.push(areaName);
            this.stats.areasExplored++;
            this.addNotification(`New area discovered: ${AreaData.getArea(areaName)?.name || areaName}`, 'success');
        }
        
        console.log(`Traveled to: ${areaName}`);
        return true;
    }
    
    /**
     * Add story flag
     */
    addStoryFlag(flag) {
        if (!this.world.storyFlags.includes(flag)) {
            this.world.storyFlags.push(flag);
            console.log(`Story flag added: ${flag}`);
            
            // Check for newly unlocked areas
            this.checkUnlockedAreas();

            // Recalculate current story path when flags change
            try {
                if (typeof StoryData !== 'undefined' && typeof StoryData.calculateStoryBranch === 'function') {
                    this.world.currentStoryPath = StoryData.calculateStoryBranch(this.world.storyFlags);
                    console.log('Current story path:', this.world.currentStoryPath);
                }
            } catch (e) { console.warn('Story path calc failed:', e); }
        }
    }
    
    /**
     * Check for newly unlocked areas with performance optimization
     */
    checkUnlockedAreas() {
        if (typeof AreaData === 'undefined') return;

        // Performance optimization: cache expensive computations
        const startTime = performance.now();
        const playerData = {
            storyFlags: this.world.storyFlags,
            level: this.player.level,
            inventory: Object.keys(this.player.inventory.items),
            class: this.player.class,
            defeatedBosses: this.world.defeatedBosses || []
        };

        // Get all areas that are not yet unlocked for efficiency
        const lockedAreas = Object.keys(AreaData.areas).filter(areaName =>
            !this.world.unlockedAreas.includes(areaName)
        );

        let newlyUnlockedCount = 0;
        const maxCheckTime = 50; // 50ms performance budget per PRD requirement

        for (const areaName of lockedAreas) {
            // Check performance budget - exit early if we're taking too long
            if (performance.now() - startTime > maxCheckTime) {
                console.warn(`Area unlock check exceeded performance budget, processed ${newlyUnlockedCount} areas`);
                break;
            }

            const isUnlocked = AreaData.isAreaUnlocked(
                areaName,
                playerData.storyFlags,
                playerData.level,
                playerData.inventory,
                playerData.class,
                playerData.defeatedBosses
            );

            if (isUnlocked) {
                this.unlockArea(areaName);
                newlyUnlockedCount++;
            } else {
                // Check for requirement progress notifications (only for areas making progress)
                const unlockStatus = AreaData.getAreaUnlockStatus(
                    areaName,
                    playerData.storyFlags,
                    playerData.level,
                    playerData.inventory,
                    playerData.class,
                    playerData.defeatedBosses
                );

                // Only notify if there's meaningful progress and we haven't recently notified
                if (unlockStatus.progressPercentage && unlockStatus.progressPercentage >= 50) {
                    const lastNotificationKey = `progress_${areaName}`;
                    const lastNotification = this.getLastNotificationTime(lastNotificationKey);
                    const timeSinceLastNotification = Date.now() - (lastNotification || 0);

                    // Only notify every 5 minutes for the same area to avoid spam
                    if (timeSinceLastNotification > 5 * 60 * 1000) {
                        this.addRequirementProgressNotification(areaName, unlockStatus);
                        this.setLastNotificationTime(lastNotificationKey, Date.now());
                    }
                }
            }
        }

        // Log performance metrics for monitoring
        const endTime = performance.now();
        if (newlyUnlockedCount > 0) {
            console.log(`✨ Unlocked ${newlyUnlockedCount} new areas in ${(endTime - startTime).toFixed(2)}ms`);
        }
    }

    /**
     * Unlock a specific area and handle all related logic
     */
    unlockArea(areaName) {
        if (this.world.unlockedAreas.includes(areaName)) return false;

        this.world.unlockedAreas.push(areaName);
        this.stats.areasExplored++;

        const area = AreaData.getArea(areaName);
        if (area) {
            // Check if this area belongs to a story branch
            if (area.storyBranch) {
                this.updateStoryBranches(area.storyBranch, areaName);
            }

            // Send detailed area unlock notification
            this.addAreaUnlockNotification(areaName, area);

            // Log for debugging and analytics
            console.log(`🗺️ Area unlocked: ${area.name} (${areaName})`);
        }

        return true;
    }

    /**
     * Update story branches when areas are unlocked
     */
    updateStoryBranches(branchName, areaName) {
        const branches = this.world.storyBranches;

        // Add to available branches if not already present
        if (!branches.availableBranches.includes(branchName)) {
            branches.availableBranches.push(branchName);
            console.log(`Story branch "${branchName}" is now available`);
        }

        // Track branch history for narrative consistency
        const branchEntry = {
            branchName,
            areaName,
            timestamp: Date.now(),
            storyFlags: [...this.world.storyFlags],
            playerLevel: this.player.level
        };

        // Add to history if not already recorded for this area
        const existingEntry = branches.branchHistory.find(
            entry => entry.branchName === branchName && entry.areaName === areaName
        );
        if (!existingEntry) {
            branches.branchHistory.push(branchEntry);
        }

        // Set as current branch if none is set or if this is a progression
        if (!branches.currentBranch || this.shouldChangeBranch(branchName)) {
            const previousBranch = branches.currentBranch;
            branches.currentBranch = branchName;

            if (previousBranch && previousBranch !== branchName) {
                console.log(`Story branch changed from "${previousBranch}" to "${branchName}"`);
                this.addNotification(`Following ${branchName.replace('_', ' ')} path`, 'info');
            } else if (!previousBranch) {
                console.log(`🌟 Story branch available: ${branchName}`);
                this.addNotification(`New story path discovered: ${branchName}`, 'story');
            }
        }
    }

    /**
     * Determine if story branch should change based on narrative consistency
     */
    shouldChangeBranch(newBranch) {
        const current = this.world.storyBranches.currentBranch;
        if (!current) return true;

        // Don't change if already on this branch
        if (current === newBranch) return false;

        // Calculate story alignment to determine if branch change is narratively consistent
        try {
            if (typeof StoryData !== 'undefined' && typeof StoryData.calculateStoryBranch === 'function') {
                const calculatedBranch = StoryData.calculateStoryBranch(this.world.storyFlags);
                return calculatedBranch === newBranch;
            }
        } catch (e) {
            console.warn('Failed to calculate story branch alignment:', e);
        }

        return false;
    }

    /**
     * Comprehensive story branch validation for narrative coherence
     */
    validateStoryBranch(proposedBranch, storyFlags = null) {
        const flags = storyFlags || this.world.storyFlags;
        const branches = this.world.storyBranches;

        // Get branch requirements and conflicts
        const branchRequirements = this.getBranchRequirements(proposedBranch);
        const branchConflicts = this.getBranchConflicts(proposedBranch);

        // Basic requirement and conflict validation
        const requirementsMet = branchRequirements.every(req => flags.includes(req));
        const hasConflicts = branchConflicts.some(conflict => flags.includes(conflict));
        const historyConsistent = this.isBranchHistoryConsistent(proposedBranch);

        // Advanced narrative coherence checks
        const narrativeChecks = this.performNarrativeCoherenceChecks(proposedBranch, flags);
        const sequenceValidation = this.validateStorySequence(proposedBranch, flags);
        const choiceConsistency = this.validateChoiceConsistency(proposedBranch, flags);

        // Character arc validation
        const characterValidation = this.validateCharacterArcConsistency(proposedBranch, flags);

        // Timeline consistency
        const timelineValidation = this.validateStoryTimeline(proposedBranch, flags);

        const overallValid = requirementsMet &&
                           !hasConflicts &&
                           historyConsistent &&
                           narrativeChecks.valid &&
                           sequenceValidation.valid &&
                           choiceConsistency.valid &&
                           characterValidation.valid &&
                           timelineValidation.valid;

        return {
            valid: overallValid,
            requirementsMet,
            hasConflicts,
            historyConsistent,
            missingRequirements: branchRequirements.filter(req => !flags.includes(req)),
            conflictingFlags: branchConflicts.filter(conflict => flags.includes(conflict)),
            narrativeChecks,
            sequenceValidation,
            choiceConsistency,
            characterValidation,
            timelineValidation,
            score: this.calculateNarrativeCoherenceScore(proposedBranch, flags),
            recommendations: this.generateCoherenceRecommendations(proposedBranch, flags)
        };
    }

    /**
     * Perform comprehensive narrative coherence checks
     */
    performNarrativeCoherenceChecks(proposedBranch, flags) {
        const checks = {
            valid: true,
            issues: [],
            warnings: []
        };

        // Check for mutually exclusive story paths
        const exclusiveChecks = this.checkMutuallyExclusivePaths(proposedBranch, flags);
        if (!exclusiveChecks.valid) {
            checks.valid = false;
            checks.issues.push(...exclusiveChecks.issues);
        }

        // Check for prerequisite story events
        const prerequisiteChecks = this.checkStoryPrerequisites(proposedBranch, flags);
        if (!prerequisiteChecks.valid) {
            checks.valid = false;
            checks.issues.push(...prerequisiteChecks.issues);
        }

        // Check for thematic consistency
        const thematicChecks = this.checkThematicConsistency(proposedBranch, flags);
        if (!thematicChecks.valid) {
            checks.warnings.push(...thematicChecks.warnings);
        }

        return checks;
    }

    /**
     * Check for mutually exclusive story paths
     */
    checkMutuallyExclusivePaths(proposedBranch, flags) {
        const exclusiveGroups = {
            'warrior_path': {
                incompatible: ['peaceful_path'],
                flagConflicts: ['peace_treaty', 'diplomatic_solution', 'non_violence_oath']
            },
            'peaceful_path': {
                incompatible: ['warrior_path'],
                flagConflicts: ['aggressive_action', 'violence_chosen', 'war_declaration']
            },
            'scholar_path': {
                incompatible: ['nature_path'],
                flagConflicts: ['rejected_knowledge', 'anti_intellectual']
            },
            'nature_path': {
                incompatible: ['scholar_path'],
                flagConflicts: ['nature_rejected', 'civilization_over_nature']
            }
        };

        const result = { valid: true, issues: [] };
        const branchConfig = exclusiveGroups[proposedBranch];

        if (branchConfig) {
            // Check for incompatible branches in history
            const incompatibleBranches = this.world.storyBranches.branchHistory
                .filter(entry => branchConfig.incompatible.includes(entry.branchName))
                .map(entry => entry.branchName);

            if (incompatibleBranches.length > 0) {
                result.valid = false;
                result.issues.push(`Branch ${proposedBranch} is incompatible with previously chosen branches: ${incompatibleBranches.join(', ')}`);
            }

            // Check for conflicting flags
            const conflictingFlags = branchConfig.flagConflicts.filter(flag => flags.includes(flag));
            if (conflictingFlags.length > 0) {
                result.valid = false;
                result.issues.push(`Branch ${proposedBranch} conflicts with story flags: ${conflictingFlags.join(', ')}`);
            }
        }

        return result;
    }

    /**
     * Check story prerequisites and dependencies
     */
    checkStoryPrerequisites(proposedBranch, flags) {
        const prerequisites = {
            'warrior_path': {
                required: ['combat_introduction'],
                recommended: ['weapon_training', 'first_battle']
            },
            'peaceful_path': {
                required: ['diplomacy_introduction'],
                recommended: ['negotiation_success', 'peaceful_resolution']
            },
            'scholar_path': {
                required: ['knowledge_introduction'],
                recommended: ['first_research', 'ancient_text_found']
            },
            'nature_path': {
                required: ['nature_introduction'],
                recommended: ['animal_communication', 'forest_blessing']
            }
        };

        const result = { valid: true, issues: [], warnings: [] };
        const branchPrereqs = prerequisites[proposedBranch];

        if (branchPrereqs) {
            // Check required prerequisites
            const missingRequired = branchPrereqs.required.filter(req => !flags.includes(req));
            if (missingRequired.length > 0) {
                result.valid = false;
                result.issues.push(`Missing required prerequisites for ${proposedBranch}: ${missingRequired.join(', ')}`);
            }

            // Check recommended prerequisites
            const missingRecommended = branchPrereqs.recommended.filter(req => !flags.includes(req));
            if (missingRecommended.length > 0) {
                result.warnings.push(`Missing recommended setup for ${proposedBranch}: ${missingRecommended.join(', ')}`);
            }
        }

        return result;
    }

    /**
     * Check thematic consistency
     */
    checkThematicConsistency(proposedBranch, flags) {
        const themes = {
            'warrior_path': {
                supportive: ['honor', 'courage', 'strength', 'justice'],
                conflicting: ['cowardice', 'dishonor', 'weakness']
            },
            'peaceful_path': {
                supportive: ['wisdom', 'compassion', 'understanding', 'harmony'],
                conflicting: ['cruelty', 'intolerance', 'hatred']
            },
            'scholar_path': {
                supportive: ['curiosity', 'knowledge', 'discovery', 'learning'],
                conflicting: ['ignorance', 'anti_learning', 'superstition']
            },
            'nature_path': {
                supportive: ['balance', 'nature_harmony', 'environmental_care'],
                conflicting: ['environmental_destruction', 'nature_exploitation']
            }
        };

        const result = { valid: true, warnings: [] };
        const branchThemes = themes[proposedBranch];

        if (branchThemes) {
            // Check for conflicting themes
            const thematicConflicts = branchThemes.conflicting.filter(theme => flags.includes(theme));
            if (thematicConflicts.length > 0) {
                result.valid = false;
                result.warnings.push(`Thematic conflicts detected for ${proposedBranch}: ${thematicConflicts.join(', ')}`);
            }

            // Check for supportive themes (positive indicator)
            const supportiveThemes = branchThemes.supportive.filter(theme => flags.includes(theme));
            if (supportiveThemes.length === 0) {
                result.warnings.push(`No supportive themes found for ${proposedBranch}. Consider adding relevant character development.`);
            }
        }

        return result;
    }

    /**
     * Validate story sequence and pacing
     */
    validateStorySequence(proposedBranch, flags) {
        const sequences = {
            'warrior_path': ['combat_introduction', 'first_battle', 'weapon_mastery', 'leadership_role'],
            'peaceful_path': ['diplomacy_introduction', 'first_negotiation', 'conflict_resolution', 'peace_maker'],
            'scholar_path': ['knowledge_introduction', 'first_research', 'major_discovery', 'wisdom_gained'],
            'nature_path': ['nature_introduction', 'animal_bond', 'forest_guardian', 'nature_mastery']
        };

        const result = { valid: true, issues: [], warnings: [] };
        const expectedSequence = sequences[proposedBranch];

        if (expectedSequence) {
            // Check if story events are happening in logical order
            const flagIndices = expectedSequence
                .map(flag => ({ flag, index: flags.indexOf(flag) }))
                .filter(item => item.index !== -1)
                .sort((a, b) => a.index - b.index);

            const expectedOrder = expectedSequence.filter(flag => flags.includes(flag));

            // Validate sequence order
            for (let i = 0; i < flagIndices.length - 1; i++) {
                const currentFlag = flagIndices[i].flag;
                const nextFlag = flagIndices[i + 1].flag;
                const currentExpectedIndex = expectedSequence.indexOf(currentFlag);
                const nextExpectedIndex = expectedSequence.indexOf(nextFlag);

                if (currentExpectedIndex > nextExpectedIndex) {
                    result.issues.push(`Story sequence violation: ${nextFlag} should come before ${currentFlag} in ${proposedBranch}`);
                }
            }

            // Check for gaps in the sequence
            const hasEarlyFlag = flags.includes(expectedSequence[0]);
            const hasLateFlag = expectedSequence.slice(-2).some(flag => flags.includes(flag));

            if (hasLateFlag && !hasEarlyFlag) {
                result.warnings.push(`Story sequence gap: Advanced ${proposedBranch} events without foundation`);
            }
        }

        return result;
    }

    /**
     * Validate choice consistency across the story
     */
    validateChoiceConsistency(proposedBranch, flags) {
        const result = { valid: true, issues: [], warnings: [] };

        // Check for contradictory choices
        const contradictoryPairs = [
            ['help_villagers', 'ignore_villagers'],
            ['save_forest', 'burn_forest'],
            ['trust_stranger', 'distrust_stranger'],
            ['share_knowledge', 'hoard_knowledge']
        ];

        for (const [choice1, choice2] of contradictoryPairs) {
            if (flags.includes(choice1) && flags.includes(choice2)) {
                result.valid = false;
                result.issues.push(`Contradictory choices detected: ${choice1} and ${choice2}`);
            }
        }

        // Branch-specific choice validation
        const branchSpecificChecks = this.validateBranchSpecificChoices(proposedBranch, flags);
        if (!branchSpecificChecks.valid) {
            result.valid = false;
            result.issues.push(...branchSpecificChecks.issues);
        }

        return result;
    }

    /**
     * Validate branch-specific choice patterns
     */
    validateBranchSpecificChoices(proposedBranch, flags) {
        const result = { valid: true, issues: [] };

        switch (proposedBranch) {
            case 'warrior_path':
                if (flags.includes('refused_combat') && flags.includes('combat_mastery')) {
                    result.valid = false;
                    result.issues.push('Warrior path: Cannot refuse combat and achieve combat mastery');
                }
                break;

            case 'peaceful_path':
                if (flags.includes('violence_first_resort') && flags.includes('master_diplomat')) {
                    result.valid = false;
                    result.issues.push('Peaceful path: Violence-first approach conflicts with diplomacy mastery');
                }
                break;

            case 'scholar_path':
                if (flags.includes('rejected_learning') && flags.includes('scholar_achievement')) {
                    result.valid = false;
                    result.issues.push('Scholar path: Cannot reject learning and achieve scholarly recognition');
                }
                break;

            case 'nature_path':
                if (flags.includes('nature_destruction') && flags.includes('nature_guardian')) {
                    result.valid = false;
                    result.issues.push('Nature path: Environmental destruction conflicts with guardian role');
                }
                break;
        }

        return result;
    }

    /**
     * Validate character arc consistency
     */
    validateCharacterArcConsistency(proposedBranch, flags) {
        const result = { valid: true, issues: [], warnings: [] };

        // Check for character development progression
        const characterTraits = this.analyzeCharacterTraits(flags);
        const branchAlignment = this.checkBranchCharacterAlignment(proposedBranch, characterTraits);

        if (branchAlignment.conflicts.length > 0) {
            result.warnings.push(`Character arc conflicts with ${proposedBranch}: ${branchAlignment.conflicts.join(', ')}`);
        }

        if (branchAlignment.support.length === 0) {
            result.warnings.push(`No character development supports ${proposedBranch} path`);
        }

        return result;
    }

    /**
     * Analyze character traits from story flags
     */
    analyzeCharacterTraits(flags) {
        const traits = {
            brave: flags.includes('faced_danger') || flags.includes('heroic_action'),
            wise: flags.includes('good_advice') || flags.includes('solved_puzzle'),
            kind: flags.includes('helped_others') || flags.includes('showed_mercy'),
            aggressive: flags.includes('chose_violence') || flags.includes('threatened_enemy'),
            scholarly: flags.includes('studied_lore') || flags.includes('research_success'),
            naturalist: flags.includes('communed_nature') || flags.includes('animal_friend')
        };

        return traits;
    }

    /**
     * Check branch alignment with character traits
     */
    checkBranchCharacterAlignment(proposedBranch, traits) {
        const alignments = {
            'warrior_path': {
                support: ['brave', 'aggressive'],
                neutral: ['wise'],
                conflict: ['scholarly', 'naturalist']
            },
            'peaceful_path': {
                support: ['kind', 'wise'],
                neutral: ['scholarly'],
                conflict: ['aggressive']
            },
            'scholar_path': {
                support: ['wise', 'scholarly'],
                neutral: ['kind'],
                conflict: ['aggressive']
            },
            'nature_path': {
                support: ['kind', 'naturalist'],
                neutral: ['wise'],
                conflict: ['aggressive']
            }
        };

        const branchAlignment = alignments[proposedBranch] || { support: [], neutral: [], conflict: [] };

        return {
            support: branchAlignment.support.filter(trait => traits[trait]),
            conflict: branchAlignment.conflict.filter(trait => traits[trait])
        };
    }

    /**
     * Validate story timeline consistency
     */
    validateStoryTimeline(proposedBranch, flags) {
        const result = { valid: true, issues: [], warnings: [] };

        // Check for temporal inconsistencies
        const timelineEvents = this.getTimelineEvents(flags);
        const inconsistencies = this.detectTimelineInconsistencies(timelineEvents);

        if (inconsistencies.length > 0) {
            result.valid = false;
            result.issues.push(...inconsistencies);
        }

        return result;
    }

    /**
     * Get timeline events from story flags
     */
    getTimelineEvents(flags) {
        const timelineMarkers = {
            'game_start': 0,
            'tutorial_complete': 1,
            'first_area_explored': 2,
            'met_mentor': 3,
            'first_challenge': 4,
            'midgame_crisis': 10,
            'final_preparation': 18,
            'endgame_approach': 20
        };

        return flags
            .filter(flag => timelineMarkers.hasOwnProperty(flag))
            .map(flag => ({ flag, time: timelineMarkers[flag] }))
            .sort((a, b) => a.time - b.time);
    }

    /**
     * Detect timeline inconsistencies
     */
    detectTimelineInconsistencies(timelineEvents) {
        const inconsistencies = [];

        for (let i = 0; i < timelineEvents.length - 1; i++) {
            const current = timelineEvents[i];
            const next = timelineEvents[i + 1];

            if (current.time >= next.time) {
                inconsistencies.push(`Timeline inconsistency: ${next.flag} should occur after ${current.flag}`);
            }
        }

        return inconsistencies;
    }

    /**
     * Calculate overall narrative coherence score (0-100)
     */
    calculateNarrativeCoherenceScore(proposedBranch, flags) {
        let score = 100;

        const validation = this.validateStoryBranch(proposedBranch, flags);

        // Deduct points for various issues
        if (!validation.requirementsMet) score -= 20;
        if (validation.hasConflicts) score -= 30;
        if (!validation.historyConsistent) score -= 25;
        if (!validation.narrativeChecks.valid) score -= 15;
        if (!validation.sequenceValidation.valid) score -= 10;
        if (!validation.choiceConsistency.valid) score -= 20;

        // Deduct points for warnings (less severe)
        score -= validation.narrativeChecks.warnings.length * 3;
        score -= validation.characterValidation.warnings.length * 2;
        score -= validation.timelineValidation.warnings.length * 2;

        return Math.max(0, Math.round(score));
    }

    /**
     * Generate recommendations for improving narrative coherence
     */
    generateCoherenceRecommendations(proposedBranch, flags) {
        const recommendations = [];
        const validation = this.validateStoryBranch(proposedBranch, flags);

        if (!validation.requirementsMet) {
            recommendations.push({
                type: 'requirements',
                priority: 'high',
                description: `Complete missing requirements: ${validation.missingRequirements.join(', ')}`,
                actionable: true
            });
        }

        if (validation.hasConflicts) {
            recommendations.push({
                type: 'conflicts',
                priority: 'critical',
                description: `Resolve conflicting story elements: ${validation.conflictingFlags.join(', ')}`,
                actionable: true
            });
        }

        if (validation.narrativeChecks.warnings.length > 0) {
            recommendations.push({
                type: 'thematic',
                priority: 'medium',
                description: 'Consider adding thematic consistency through character actions',
                actionable: true
            });
        }

        if (validation.characterValidation.warnings.length > 0) {
            recommendations.push({
                type: 'character',
                priority: 'low',
                description: 'Develop character traits that support your chosen path',
                actionable: true
            });
        }

        return recommendations.sort((a, b) => {
            const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorities[b.priority] - priorities[a.priority];
        });
    }

    /**
     * Get story branch requirements based on narrative logic
     */
    getBranchRequirements(branchName) {
        const requirements = {
            'warrior_path': ['wolf_challenge_won', 'dragon_challenge'],
            'peaceful_path': ['wolf_respect_earned', 'peace_symbol'],
            'scholar_path': ['ancient_knowledge', 'ruins_puzzle'],
            'nature_path': ['beast_speaker', 'nature_affinity']
        };

        return requirements[branchName] || [];
    }

    /**
     * Get story branch conflicts (mutually exclusive flags)
     */
    getBranchConflicts(branchName) {
        const conflicts = {
            'warrior_path': ['respectful_decline', 'humility_lesson'],
            'peaceful_path': ['dragon_challenge', 'wolf_challenge_won'],
            'scholar_path': ['beast_speaker', 'nature_affinity'],
            'nature_path': ['ancient_knowledge', 'ruins_puzzle']
        };

        return conflicts[branchName] || [];
    }

    /**
     * Check if branch change is consistent with previous choices
     */
    isBranchHistoryConsistent(proposedBranch) {
        const history = this.world.storyBranches.branchHistory;

        // If no history, any branch is valid
        if (history.length === 0) return true;

        // Check for direct conflicts in branch history
        const conflictingBranches = this.getBranchConflicts(proposedBranch);
        const hasConflictingHistory = history.some(entry =>
            conflictingBranches.includes(entry.branchName)
        );

        return !hasConflictingHistory;
    }

    /**
     * Get detailed story branch status for UI display
     */
    getStoryBranchStatus() {
        const branches = this.world.storyBranches;
        const currentBranchValidation = branches.currentBranch
            ? this.validateStoryBranch(branches.currentBranch)
            : { valid: true };

        return {
            currentBranch: branches.currentBranch,
            availableBranches: branches.availableBranches,
            branchHistory: branches.branchHistory,
            isCurrentBranchValid: currentBranchValidation.valid,
            validationDetails: currentBranchValidation,
            progressSummary: this.getStoryProgressSummary()
        };
    }

    /**
     * Get story progress summary for each branch
     */
    getStoryProgressSummary() {
        const flags = this.world.storyFlags;
        const summary = {};

        ['warrior_path', 'peaceful_path', 'scholar_path', 'nature_path'].forEach(branch => {
            const requirements = this.getBranchRequirements(branch);
            const conflicts = this.getBranchConflicts(branch);
            const metRequirements = requirements.filter(req => flags.includes(req));
            const hasConflicts = conflicts.some(conflict => flags.includes(conflict));

            summary[branch] = {
                progress: requirements.length > 0 ? metRequirements.length / requirements.length : 0,
                metRequirements,
                totalRequirements: requirements.length,
                hasConflicts,
                available: metRequirements.length === requirements.length && !hasConflicts
            };
        });

        return summary;
    }

    /**
     * Manually set story branch with validation (for player choice scenarios)
     */
    setStoryBranch(branchName, forceChange = false) {
        const validation = this.validateStoryBranch(branchName);

        if (!validation.valid && !forceChange) {
            console.warn(`Cannot set story branch "${branchName}":`, validation);
            return {
                success: false,
                reason: 'validation_failed',
                validation
            };
        }

        // Check if this creates narrative inconsistency
        if (!forceChange && !this.shouldChangeBranch(branchName)) {
            return {
                success: false,
                reason: 'narrative_inconsistency',
                currentBranch: this.world.storyBranches.currentBranch,
                proposedBranch: branchName
            };
        }

        const previousBranch = this.world.storyBranches.currentBranch;
        this.updateStoryBranches(branchName, 'manual_selection');

        console.log(`Story branch manually set to: ${branchName}`);
        this.addNotification(`Now following the ${branchName.replace('_', ' ')}`, 'story');

        return {
            success: true,
            previousBranch,
            newBranch: branchName,
            validation
        };
    }

    /**
     * Add defeated boss to tracking system
     */
    addDefeatedBoss(bossName) {
        if (!this.world.defeatedBosses.includes(bossName)) {
            this.world.defeatedBosses.push(bossName);
            console.log(`👑 Boss defeated: ${bossName}`);

            // Check for newly unlocked areas after boss defeat
            this.checkUnlockedAreas();

            // Update progression stats
            if (!this.stats.bossesDefeated) this.stats.bossesDefeated = 0;
            this.stats.bossesDefeated++;
        }
    }

    /**
     * Comprehensive progression indicator system
     */
    getProgressionIndicators() {
        const indicators = {
            areas: this.getAreaProgressionIndicators(),
            story: this.getStoryProgressionIndicators(),
            player: this.getPlayerProgressionIndicators(),
            completion: this.getCompletionIndicators(),
            unlockStatus: this.getUnlockStatusIndicators()
        };

        return indicators;
    }

    /**
     * Get area progression indicators with detailed unlock status
     */
    getAreaProgressionIndicators() {
        const allAreas = Object.keys(AreaData.areas);
        const indicators = {
            totalAreas: allAreas.length,
            unlockedAreas: this.world.unlockedAreas.length,
            progressPercentage: Math.round((this.world.unlockedAreas.length / allAreas.length) * 100),
            areas: [],
            byBranch: {},
            nextUnlockable: []
        };

        const playerData = {
            storyFlags: this.world.storyFlags,
            level: this.player.level,
            inventory: Object.keys(this.player.inventory.items || {}),
            class: this.player.class,
            defeatedBosses: this.world.defeatedBosses
        };

        // Analyze each area
        for (const areaName of allAreas) {
            const area = AreaData.getArea(areaName);
            const isUnlocked = this.world.unlockedAreas.includes(areaName);

            let progressInfo = {
                name: areaName,
                displayName: area?.name || areaName,
                type: area?.type || 'unknown',
                storyBranch: area?.storyBranch || null,
                isUnlocked,
                unlockProgress: null
            };

            if (!isUnlocked) {
                const unlockStatus = AreaData.getAreaUnlockStatus(
                    areaName,
                    playerData.storyFlags,
                    playerData.level,
                    playerData.inventory,
                    playerData.class,
                    playerData.defeatedBosses
                );

                progressInfo.unlockProgress = {
                    canUnlock: unlockStatus.canUnlock,
                    progress: unlockStatus.progressPercentage || 0,
                    requirements: unlockStatus.requirements || [],
                    missingRequirements: unlockStatus.missingRequirements || [],
                    nextSteps: this.getNextStepsForArea(areaName, unlockStatus)
                };

                // Track areas that are close to being unlockable
                if (unlockStatus.progressPercentage && unlockStatus.progressPercentage >= 50) {
                    indicators.nextUnlockable.push({
                        ...progressInfo,
                        priority: unlockStatus.progressPercentage
                    });
                }
            }

            indicators.areas.push(progressInfo);

            // Group by story branch
            const branch = area?.storyBranch || 'main';
            if (!indicators.byBranch[branch]) {
                indicators.byBranch[branch] = { total: 0, unlocked: 0, areas: [] };
            }
            indicators.byBranch[branch].total++;
            if (isUnlocked) indicators.byBranch[branch].unlocked++;
            indicators.byBranch[branch].areas.push(progressInfo);
        }

        // Sort next unlockable by priority
        indicators.nextUnlockable.sort((a, b) => b.priority - a.priority);

        return indicators;
    }

    /**
     * Get story progression indicators
     */
    getStoryProgressionIndicators() {
        const storyBranchStatus = this.getStoryBranchStatus();
        const progressSummary = storyBranchStatus.progressSummary;

        const indicators = {
            currentBranch: storyBranchStatus.currentBranch,
            availableBranches: storyBranchStatus.availableBranches,
            branchProgress: {},
            overallStoryProgress: 0,
            completedEvents: this.world.completedEvents.length,
            storyFlags: this.world.storyFlags.length,
            choicesMade: this.stats.storyChoicesMade || 0,
            nextStoryOpportunities: []
        };

        // Calculate detailed branch progress
        let totalProgress = 0;
        let availableBranchCount = 0;

        Object.entries(progressSummary).forEach(([branch, data]) => {
            indicators.branchProgress[branch] = {
                progress: Math.round(data.progress * 100),
                requirements: {
                    met: data.metRequirements,
                    total: data.totalRequirements,
                    remaining: data.totalRequirements - data.metRequirements.length
                },
                hasConflicts: data.hasConflicts,
                isAvailable: data.available,
                canProgress: data.totalRequirements > data.metRequirements.length && !data.hasConflicts
            };

            if (data.available) availableBranchCount++;
            totalProgress += data.progress;
        });

        indicators.overallStoryProgress = Math.round((totalProgress / Object.keys(progressSummary).length) * 100);
        indicators.availableBranchProgress = Math.round((availableBranchCount / Object.keys(progressSummary).length) * 100);

        // Identify next story opportunities
        indicators.nextStoryOpportunities = this.getNextStoryOpportunities();

        return indicators;
    }

    /**
     * Get player progression indicators
     */
    getPlayerProgressionIndicators() {
        const maxLevel = 50; // Could be made configurable
        const indicators = {
            level: {
                current: this.player.level,
                progress: Math.round((this.player.level / maxLevel) * 100),
                experience: this.player.experience,
                experienceToNext: this.player.experienceToNext,
                experienceProgress: Math.round((this.player.experience / (this.player.experience + this.player.experienceToNext)) * 100)
            },
            equipment: {
                totalSlots: 3, // weapon, armor, accessory
                equippedSlots: Object.values(this.player.equipment).filter(item => item !== null).length
            },
            inventory: {
                totalItems: Object.keys(this.player.inventory.items || {}).length,
                gold: this.player.inventory.gold || 0
            },
            spells: {
                known: (this.player.spells || []).length,
                maxKnown: this.calculateMaxSpells()
            },
            stats: this.player.stats || {}
        };

        // Calculate equipment progress percentage
        indicators.equipment.progress = Math.round((indicators.equipment.equippedSlots / indicators.equipment.totalSlots) * 100);

        return indicators;
    }

    /**
     * Get overall completion indicators
     */
    getCompletionIndicators() {
        const areaIndicators = this.getAreaProgressionIndicators();
        const storyIndicators = this.getStoryProgressionIndicators();

        const indicators = {
            overall: 0,
            categories: {
                exploration: {
                    name: 'Exploration',
                    progress: areaIndicators.progressPercentage,
                    weight: 0.3
                },
                story: {
                    name: 'Story Progress',
                    progress: storyIndicators.overallStoryProgress,
                    weight: 0.4
                },
                character: {
                    name: 'Character Development',
                    progress: this.getPlayerProgressionIndicators().level.progress,
                    weight: 0.2
                },
                collection: {
                    name: 'Collection & Combat',
                    progress: this.getCollectionProgress(),
                    weight: 0.1
                }
            },
            milestones: this.getProgressionMilestones(),
            achievements: this.getRecentAchievements()
        };

        // Calculate weighted overall completion
        indicators.overall = Math.round(
            Object.values(indicators.categories).reduce(
                (sum, category) => sum + (category.progress * category.weight),
                0
            )
        );

        return indicators;
    }

    /**
     * Get unlock status indicators for immediate player guidance
     */
    getUnlockStatusIndicators() {
        const indicators = {
            immediateUnlocks: [],
            nearUnlocks: [],
            blockedUnlocks: [],
            recommendations: []
        };

        const playerData = {
            storyFlags: this.world.storyFlags,
            level: this.player.level,
            inventory: Object.keys(this.player.inventory.items || {}),
            class: this.player.class,
            defeatedBosses: this.world.defeatedBosses
        };

        const allAreas = Object.keys(AreaData.areas);

        for (const areaName of allAreas) {
            if (this.world.unlockedAreas.includes(areaName)) continue;

            const unlockStatus = AreaData.getAreaUnlockStatus(
                areaName,
                playerData.storyFlags,
                playerData.level,
                playerData.inventory,
                playerData.class,
                playerData.defeatedBosses
            );

            const area = AreaData.getArea(areaName);
            const areaInfo = {
                name: areaName,
                displayName: area?.name || areaName,
                type: area?.type || 'unknown',
                storyBranch: area?.storyBranch || null
            };

            if (unlockStatus.canUnlock) {
                indicators.immediateUnlocks.push(areaInfo);
            } else if (unlockStatus.progressPercentage && unlockStatus.progressPercentage >= 75) {
                indicators.nearUnlocks.push({
                    ...areaInfo,
                    progress: unlockStatus.progressPercentage,
                    missing: unlockStatus.missingRequirements || []
                });
            } else if (unlockStatus.progressPercentage && unlockStatus.progressPercentage < 25) {
                indicators.blockedUnlocks.push({
                    ...areaInfo,
                    progress: unlockStatus.progressPercentage,
                    requirements: unlockStatus.requirements || []
                });
            }
        }

        // Generate personalized recommendations
        indicators.recommendations = this.generateProgressionRecommendations(indicators);

        return indicators;
    }

    /**
     * Get next steps for unlocking a specific area
     */
    getNextStepsForArea(areaName, unlockStatus) {
        const steps = [];
        const missing = unlockStatus.missingRequirements || [];

        for (const requirement of missing) {
            if (requirement.type === 'story') {
                steps.push({
                    type: 'story',
                    description: `Complete story event: ${requirement.value}`,
                    priority: 'high',
                    actionable: true
                });
            } else if (requirement.type === 'level') {
                const needed = requirement.value - this.player.level;
                steps.push({
                    type: 'level',
                    description: `Gain ${needed} more level${needed > 1 ? 's' : ''} (need level ${requirement.value})`,
                    priority: 'medium',
                    actionable: true
                });
            } else if (requirement.type === 'item') {
                steps.push({
                    type: 'item',
                    description: `Obtain item: ${requirement.value}`,
                    priority: 'high',
                    actionable: true
                });
            } else if (requirement.type === 'boss') {
                steps.push({
                    type: 'boss',
                    description: `Defeat boss: ${requirement.value}`,
                    priority: 'high',
                    actionable: true
                });
            }
        }

        // Sort by priority and actionability
        steps.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        return steps;
    }

    /**
     * Get next story opportunities based on current progress
     */
    getNextStoryOpportunities() {
        const opportunities = [];
        const flags = this.world.storyFlags;

        // Check for incomplete story branches that can be progressed
        const branchRequirements = {
            'warrior_path': ['wolf_challenge_won', 'dragon_challenge'],
            'peaceful_path': ['wolf_respect_earned', 'peace_symbol'],
            'scholar_path': ['ancient_knowledge', 'ruins_puzzle'],
            'nature_path': ['beast_speaker', 'nature_affinity']
        };

        Object.entries(branchRequirements).forEach(([branch, requirements]) => {
            const metRequirements = requirements.filter(req => flags.includes(req));
            const unmetRequirements = requirements.filter(req => !flags.includes(req));

            if (metRequirements.length > 0 && unmetRequirements.length > 0) {
                opportunities.push({
                    type: 'story_branch',
                    branch,
                    description: `Continue ${branch.replace('_', ' ')} progression`,
                    progress: Math.round((metRequirements.length / requirements.length) * 100),
                    nextRequirements: unmetRequirements.slice(0, 2) // Show up to 2 next requirements
                });
            }
        });

        return opportunities;
    }

    /**
     * Calculate maximum spells player can know based on level/class
     */
    calculateMaxSpells() {
        const baseSpells = 4;
        const bonusPerLevel = Math.floor(this.player.level / 5);
        return baseSpells + bonusPerLevel;
    }

    /**
     * Get collection progress (monsters, items, etc.)
     */
    getCollectionProgress() {
        const totalItems = this.getTotalItemCount();
        const collectedItems = Object.keys(this.player.inventory.items || {}).length;
        const monstersKnown = (this.monsters?.storage?.length || 0);
        const totalMonsters = this.getTotalMonsterCount();

        const itemProgress = totalItems > 0 ? Math.round((collectedItems / totalItems) * 100) : 0;
        const monsterProgress = totalMonsters > 0 ? Math.round((monstersKnown / totalMonsters) * 100) : 0;

        return Math.round((itemProgress + monsterProgress) / 2);
    }

    /**
     * Get progression milestones
     */
    getProgressionMilestones() {
        const milestones = [];
        const areaCount = this.world.unlockedAreas.length;
        const level = this.player.level;
        const storyFlags = this.world.storyFlags.length;

        // Area milestones
        if (areaCount >= 5) milestones.push({ type: 'exploration', name: 'Explorer', achieved: true });
        if (areaCount >= 10) milestones.push({ type: 'exploration', name: 'Wanderer', achieved: true });

        // Level milestones
        if (level >= 10) milestones.push({ type: 'character', name: 'Experienced', achieved: true });
        if (level >= 25) milestones.push({ type: 'character', name: 'Veteran', achieved: true });

        // Story milestones
        if (storyFlags >= 10) milestones.push({ type: 'story', name: 'Story Seeker', achieved: true });
        if (this.world.storyBranches.availableBranches.length >= 2) {
            milestones.push({ type: 'story', name: 'Path Finder', achieved: true });
        }

        return milestones;
    }

    /**
     * Get recent achievements
     */
    getRecentAchievements() {
        // This could be expanded to track actual achievements over time
        const achievements = [];
        const recentTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

        // Check recent boss defeats
        if (this.stats.bossesDefeated > 0) {
            achievements.push({
                type: 'boss',
                name: 'Boss Defeated',
                description: `Defeated ${this.stats.bossesDefeated} boss${this.stats.bossesDefeated > 1 ? 'es' : ''}`,
                recent: true
            });
        }

        return achievements;
    }

    /**
     * Generate personalized progression recommendations
     */
    generateProgressionRecommendations(unlockIndicators) {
        const recommendations = [];

        // Recommend immediate unlocks
        if (unlockIndicators.immediateUnlocks.length > 0) {
            recommendations.push({
                type: 'immediate',
                priority: 'high',
                description: `${unlockIndicators.immediateUnlocks.length} area${unlockIndicators.immediateUnlocks.length > 1 ? 's' : ''} ready to explore!`,
                actionable: true,
                details: unlockIndicators.immediateUnlocks.slice(0, 3).map(area => area.displayName)
            });
        }

        // Recommend near unlocks
        if (unlockIndicators.nearUnlocks.length > 0) {
            const topNear = unlockIndicators.nearUnlocks[0];
            recommendations.push({
                type: 'near',
                priority: 'medium',
                description: `Almost ready to unlock ${topNear.displayName}`,
                actionable: true,
                details: topNear.missing.slice(0, 2)
            });
        }

        // Level up recommendation
        const playerIndicators = this.getPlayerProgressionIndicators();
        if (playerIndicators.level.experienceProgress >= 80) {
            recommendations.push({
                type: 'level',
                priority: 'medium',
                description: 'Close to leveling up! Gain more experience',
                actionable: true,
                details: [`${playerIndicators.level.experienceToNext - playerIndicators.level.experience} EXP needed`]
            });
        }

        // Story progression recommendation
        const storyIndicators = this.getStoryProgressionIndicators();
        const availableOpportunities = storyIndicators.nextStoryOpportunities.filter(op => op.progress > 0);
        if (availableOpportunities.length > 0) {
            const topOpportunity = availableOpportunities[0];
            recommendations.push({
                type: 'story',
                priority: 'high',
                description: `Progress your ${topOpportunity.branch.replace('_', ' ')} story`,
                actionable: true,
                details: topOpportunity.nextRequirements
            });
        }

        return recommendations.slice(0, 5); // Limit to top 5 recommendations
    }

    /**
     * Helper methods for collection calculations
     */
    getTotalItemCount() {
        try {
            return typeof ItemData !== 'undefined' ? Object.keys(ItemData.items || {}).length : 50;
        } catch (e) {
            return 50; // Fallback estimate
        }
    }

    getTotalMonsterCount() {
        try {
            return typeof MonsterData !== 'undefined' ? Object.keys(MonsterData.monsters || {}).length : 20;
        } catch (e) {
            return 20; // Fallback estimate
        }
    }

    /**
     * Add detailed area unlock notification with requirement information
     */
    addAreaUnlockNotification(areaName, area) {
        // Create detailed unlock notification
        const notification = {
            type: 'area_unlock',
            title: `🗺️ New Area Unlocked!`,
            area: {
                name: area.name || areaName,
                displayName: area.name || areaName,
                type: area.type || 'unknown',
                description: area.description || 'A new area to explore',
                storyBranch: area.storyBranch || null
            },
            timestamp: Date.now(),
            requirements: this.getAreaUnlockRequirements(areaName),
            nextAreas: this.getNextUnlockableAreas(areaName)
        };

        // Add to notification system with enhanced details
        this.addNotification(notification.title, 'success', notification);

        // Check for chain unlocks and notify about new opportunities
        this.checkForChainUnlockOpportunities(areaName);

        // Send detailed console log with unlock context
        console.log(`🗺️ Area "${area.name}" unlocked:`, {
            type: area.type,
            branch: area.storyBranch,
            description: area.description
        });
    }

    /**
     * Get the requirements that were just satisfied to unlock this area
     */
    getAreaUnlockRequirements(areaName) {
        try {
            const area = AreaData.getArea(areaName);
            if (!area?.unlockRequirements) return { summary: 'Always available', details: [] };

            const playerData = {
                storyFlags: this.world.storyFlags,
                level: this.player.level,
                inventory: Object.keys(this.player.inventory.items || {}),
                class: this.player.class,
                defeatedBosses: this.world.defeatedBosses
            };

            const satisfiedRequirements = this.analyzeSatisfiedRequirements(area.unlockRequirements, playerData);

            return {
                summary: this.generateUnlockSummary(satisfiedRequirements),
                details: satisfiedRequirements,
                totalCriteria: this.countTotalCriteria(area.unlockRequirements)
            };
        } catch (e) {
            console.warn(`Failed to analyze unlock requirements for ${areaName}:`, e);
            return { summary: 'Requirements met', details: [] };
        }
    }

    /**
     * Analyze which requirements were satisfied for the unlock
     */
    analyzeSatisfiedRequirements(requirements, playerData) {
        const satisfied = [];

        const analyzeConditions = (conditions, isAndGroup = true) => {
            if (conditions.and) {
                conditions.and.forEach(condition => analyzeConditions(condition, true));
            } else if (conditions.or) {
                conditions.or.forEach(condition => analyzeConditions(condition, false));
            } else {
                // Single condition
                Object.entries(conditions).forEach(([type, value]) => {
                    let isSatisfied = false;
                    let displayValue = value;

                    switch (type) {
                        case 'story':
                            isSatisfied = playerData.storyFlags.includes(value);
                            displayValue = `Story: ${value.replace(/_/g, ' ')}`;
                            break;
                        case 'level':
                            isSatisfied = playerData.level >= value;
                            displayValue = `Level ${value}`;
                            break;
                        case 'item':
                            isSatisfied = playerData.inventory.includes(value);
                            displayValue = `Item: ${value.replace(/_/g, ' ')}`;
                            break;
                        case 'character_class':
                            isSatisfied = Array.isArray(value) ? value.includes(playerData.class) : playerData.class === value;
                            displayValue = `Class: ${Array.isArray(value) ? value.join(' or ') : value}`;
                            break;
                        case 'defeated_boss':
                            isSatisfied = playerData.defeatedBosses.includes(value);
                            displayValue = `Defeated: ${value.replace(/_/g, ' ')}`;
                            break;
                    }

                    if (isSatisfied) {
                        satisfied.push({
                            type,
                            value,
                            displayValue,
                            groupType: isAndGroup ? 'and' : 'or'
                        });
                    }
                });
            }
        };

        analyzeConditions(requirements);
        return satisfied;
    }

    /**
     * Generate human-readable unlock summary
     */
    generateUnlockSummary(satisfiedRequirements) {
        if (satisfiedRequirements.length === 0) return 'No specific requirements';

        const groups = {
            story: satisfiedRequirements.filter(r => r.type === 'story'),
            level: satisfiedRequirements.filter(r => r.type === 'level'),
            item: satisfiedRequirements.filter(r => r.type === 'item'),
            character_class: satisfiedRequirements.filter(r => r.type === 'character_class'),
            defeated_boss: satisfiedRequirements.filter(r => r.type === 'defeated_boss')
        };

        const summaryParts = [];

        if (groups.story.length > 0) {
            summaryParts.push(`Story progress (${groups.story.length} events)`);
        }
        if (groups.level.length > 0) {
            summaryParts.push(`Level requirement (${groups.level[0].displayValue})`);
        }
        if (groups.item.length > 0) {
            summaryParts.push(`Items obtained (${groups.item.length})`);
        }
        if (groups.character_class.length > 0) {
            summaryParts.push(`Class requirement (${groups.character_class[0].displayValue})`);
        }
        if (groups.defeated_boss.length > 0) {
            summaryParts.push(`Boss defeats (${groups.defeated_boss.length})`);
        }

        return `Unlocked by: ${summaryParts.join(', ')}`;
    }

    /**
     * Count total criteria in unlock requirements
     */
    countTotalCriteria(requirements) {
        let count = 0;

        const countInConditions = (conditions) => {
            if (conditions.and) {
                conditions.and.forEach(condition => countInConditions(condition));
            } else if (conditions.or) {
                conditions.or.forEach(condition => countInConditions(condition));
            } else {
                count += Object.keys(conditions).length;
            }
        };

        countInConditions(requirements);
        return count;
    }

    /**
     * Get areas that might be unlockable after this unlock
     */
    getNextUnlockableAreas(justUnlockedArea) {
        const nextAreas = [];

        try {
            const allAreas = Object.keys(AreaData.areas);
            const playerData = {
                storyFlags: this.world.storyFlags,
                level: this.player.level,
                inventory: Object.keys(this.player.inventory.items || {}),
                class: this.player.class,
                defeatedBosses: this.world.defeatedBosses
            };

            for (const areaName of allAreas) {
                if (this.world.unlockedAreas.includes(areaName)) continue;

                const unlockStatus = AreaData.getAreaUnlockStatus(
                    areaName,
                    playerData.storyFlags,
                    playerData.level,
                    playerData.inventory,
                    playerData.class,
                    playerData.defeatedBosses
                );

                // Check if this area is now very close to being unlocked
                if (unlockStatus.progressPercentage && unlockStatus.progressPercentage >= 75) {
                    const area = AreaData.getArea(areaName);
                    nextAreas.push({
                        name: areaName,
                        displayName: area?.name || areaName,
                        progress: unlockStatus.progressPercentage,
                        missing: unlockStatus.missingRequirements?.length || 0
                    });
                }
            }

            // Sort by progress and return top 3
            nextAreas.sort((a, b) => b.progress - a.progress);
            return nextAreas.slice(0, 3);
        } catch (e) {
            console.warn('Failed to get next unlockable areas:', e);
            return [];
        }
    }

    /**
     * Check for chain unlock opportunities after unlocking an area
     */
    checkForChainUnlockOpportunities(unlockedArea) {
        // Get next potentially unlockable areas
        const nextAreas = this.getNextUnlockableAreas(unlockedArea);

        if (nextAreas.length > 0) {
            // Notify about areas that are now close to unlock
            const closeAreas = nextAreas.filter(area => area.progress >= 90);
            if (closeAreas.length > 0) {
                const areaNames = closeAreas.map(area => area.displayName).join(', ');
                this.addNotification(`🔍 Almost ready to unlock: ${areaNames}`, 'info');
            }

            // If any areas can now be immediately unlocked, check them
            setTimeout(() => {
                this.checkUnlockedAreas();
            }, 100); // Small delay to avoid recursive issues
        }

        // Check for story branch progression opportunities
        this.checkForStoryProgressionOpportunities(unlockedArea);
    }

    /**
     * Check for story progression opportunities after area unlock
     */
    checkForStoryProgressionOpportunities(unlockedArea) {
        try {
            const area = AreaData.getArea(unlockedArea);
            if (!area?.storyBranch) return;

            // Check if this unlocks new story opportunities
            const branchProgress = this.getStoryProgressSummary()[area.storyBranch];
            if (branchProgress && !branchProgress.available && branchProgress.progress > 0.5) {
                const missingCount = branchProgress.totalRequirements - branchProgress.metRequirements.length;
                this.addNotification(
                    `📖 Story path progressing: ${area.storyBranch.replace('_', ' ')} (${missingCount} requirement${missingCount > 1 ? 's' : ''} remaining)`,
                    'story'
                );
            }
        } catch (e) {
            console.warn('Failed to check story progression opportunities:', e);
        }
    }

    /**
     * Add requirement progress notifications for areas that are partially unlockable
     */
    addRequirementProgressNotification(areaName, progressData) {
        const area = AreaData.getArea(areaName);
        const displayName = area?.name || areaName;

        // Only notify for significant progress milestones
        const progress = progressData.progressPercentage || 0;
        if (progress < 25) return; // Too early to be interesting

        let message = '';
        let notificationType = 'info';

        if (progress >= 90) {
            message = `🎯 Almost ready to unlock ${displayName}!`;
            notificationType = 'success';
        } else if (progress >= 75) {
            message = `⭐ Getting close to unlocking ${displayName}`;
            notificationType = 'info';
        } else if (progress >= 50) {
            message = `🔄 Making progress toward ${displayName}`;
            notificationType = 'info';
        }

        if (message) {
            const notification = {
                type: 'requirement_progress',
                area: {
                    name: areaName,
                    displayName,
                    progress: Math.round(progress)
                },
                missing: progressData.missingRequirements || [],
                nextSteps: this.getNextStepsForArea(areaName, progressData)
            };

            this.addNotification(message, notificationType, notification);
        }
    }

    /**
     * Notification timing helpers to prevent spam
     */
    getLastNotificationTime(key) {
        if (!this.notificationTimestamps) {
            this.notificationTimestamps = {};
        }
        return this.notificationTimestamps[key];
    }

    setLastNotificationTime(key, timestamp) {
        if (!this.notificationTimestamps) {
            this.notificationTimestamps = {};
        }
        this.notificationTimestamps[key] = timestamp;
    }

    /**
     * Enhanced notification method that supports detailed notification data
     */
    addNotificationWithDetails(message, type = 'info', detailsData = null) {
        // Enhanced notification with structured data for UI consumption
        const notification = {
            id: Date.now() + Math.random(), // Unique identifier
            message,
            type,
            timestamp: Date.now(),
            details: detailsData,
            duration: this.getNotificationDuration(type),
            priority: this.getNotificationPriority(type)
        };

        // Add to notification system
        if (!this.ui.notifications) {
            this.ui.notifications = [];
        }

        this.ui.notifications.push(notification);

        // Also use the existing notification system for backward compatibility
        this.addNotification(message, type);

        return notification.id;
    }

    /**
     * Get notification duration based on type
     */
    getNotificationDuration(type) {
        const durations = {
            'error': 8000,      // 8 seconds for errors
            'success': 5000,    // 5 seconds for successes
            'story': 6000,      // 6 seconds for story events
            'area_unlock': 7000, // 7 seconds for area unlocks
            'info': 4000        // 4 seconds for general info
        };
        return durations[type] || 4000;
    }

    /**
     * Get notification priority for display ordering
     */
    getNotificationPriority(type) {
        const priorities = {
            'error': 5,         // Highest priority
            'area_unlock': 4,   // High priority
            'story': 3,         // Medium-high priority
            'success': 2,       // Medium priority
            'info': 1          // Normal priority
        };
        return priorities[type] || 1;
    }

    /**
     * Clear old notifications to prevent memory buildup
     */
    cleanupNotifications() {
        if (!this.ui.notifications) return;

        const now = Date.now();
        const maxAge = 60 * 1000; // Keep notifications for 1 minute

        this.ui.notifications = this.ui.notifications.filter(notification => {
            return (now - notification.timestamp) < maxAge;
        });

        // Also cleanup notification timestamps
        if (this.notificationTimestamps) {
            const maxTimestampAge = 30 * 60 * 1000; // Keep timestamps for 30 minutes
            Object.keys(this.notificationTimestamps).forEach(key => {
                if ((now - this.notificationTimestamps[key]) > maxTimestampAge) {
                    delete this.notificationTimestamps[key];
                }
            });
        }
    }

    /**
     * Get detailed progression status for all areas
     */
    getAreaProgressionStatus() {
        if (typeof AreaData === 'undefined') return { unlocked: [], locked: [], progression: {} };

        const playerData = {
            storyFlags: this.world.storyFlags,
            level: this.player.level,
            inventory: Object.keys(this.player.inventory.items),
            class: this.player.class,
            defeatedBosses: this.world.defeatedBosses || []
        };

        const allAreas = Object.keys(AreaData.areas);
        const status = {
            unlocked: [],
            locked: [],
            progression: {}
        };

        for (const areaName of allAreas) {
            const area = AreaData.getArea(areaName);
            const isUnlocked = this.world.unlockedAreas.includes(areaName);

            if (isUnlocked) {
                status.unlocked.push({
                    name: areaName,
                    displayName: area?.name || areaName,
                    type: area?.type || 'unknown',
                    storyBranch: area?.storyBranch || null
                });
            } else {
                const unlockStatus = AreaData.getAreaUnlockStatus(
                    areaName,
                    playerData.storyFlags,
                    playerData.level,
                    playerData.inventory,
                    playerData.class,
                    playerData.defeatedBosses
                );

                status.locked.push({
                    name: areaName,
                    displayName: area?.name || areaName,
                    type: area?.type || 'unknown',
                    storyBranch: area?.storyBranch || null,
                    status: unlockStatus
                });
            }
        }

        // Add progression summary
        status.progression = {
            totalAreas: allAreas.length,
            unlockedCount: status.unlocked.length,
            lockedCount: status.locked.length,
            progressPercentage: Math.round((status.unlocked.length / allAreas.length) * 100),
            availableBranches: this.world.storyBranches.availableBranches,
            currentBranch: this.world.storyBranches.currentBranch
        };

        return status;
    }
    
    /**
     * Process story choice
     */
    processStoryChoice(eventName, choiceOutcome) {
        if (typeof StoryData === 'undefined') return null;
        
        const outcome = StoryData.processChoice(eventName, choiceOutcome);
        if (!outcome) return null;
        
        // Apply outcome effects
        if (outcome.storyFlags) {
            outcome.storyFlags.forEach(flag => this.addStoryFlag(flag));
        }
        
        if (outcome.unlockAreas) {
            outcome.unlockAreas.forEach(area => {
                if (!this.world.unlockedAreas.includes(area)) {
                    this.world.unlockedAreas.push(area);
                    this.stats.areasExplored++;
                }
            });
        }
        
        if (outcome.items) {
            outcome.items.forEach(item => this.addItem(item, 1));
        }
        
        this.stats.storyChoicesMade++;
        this.world.completedEvents.push(eventName);
        // Mark as completed via flag for UI convenience
        this.addStoryFlag(`${eventName}_completed`);

        // Update story branch tracking based on new flags
        try {
            if (typeof StoryData !== 'undefined' && typeof StoryData.calculateStoryBranch === 'function') {
                const calculatedBranch = StoryData.calculateStoryBranch(this.world.storyFlags);
                this.world.currentStoryPath = calculatedBranch;

                // Validate and update story branch if it has changed
                if (calculatedBranch && calculatedBranch !== this.world.storyBranches.currentBranch) {
                    const validation = this.validateStoryBranch(calculatedBranch);

                    if (validation.valid) {
                        this.updateStoryBranches(calculatedBranch, 'story_choice_' + eventName);
                        console.log(`Story choice "${eventName}" led to branch: ${calculatedBranch}`);
                    } else {
                        console.warn(`Story branch "${calculatedBranch}" validation failed:`, validation);
                        // Still update the path but log the inconsistency
                        this.world.currentStoryPath = calculatedBranch;
                    }
                }
            }
        } catch (e) {
            console.warn('Story path recalc after choice failed:', e);
        }

        // Check for new area unlocks after story choice
        this.checkUnlockedAreas();

        return outcome;
    }

    // --------------------------------
    // Story endings (9.5)
    // --------------------------------
    checkForEnding() {
        try {
            const flags = this.world?.storyFlags || [];
            if (typeof window.StoryData === 'undefined' || !window.StoryData.getAvailableEndings) return null;
            const available = window.StoryData.getAvailableEndings(flags);
            if (available && available.length > 0) {
                return available[0];
            }
        } catch (_) {}
        return null;
    }
    
    // ================================================
    // SCENE MANAGEMENT
    // ================================================
    
    /**
     * Change current scene
     */
    changeScene(newScene) {
        this.previousScene = this.currentScene;
        this.currentScene = newScene;
        
        console.log(`Scene changed: ${this.previousScene} -> ${newScene}`);
        
        // Scene-specific initialization
        switch (newScene) {
            case 'combat':
                this.initializeCombat();
                break;
            case 'world':
                this.exitCombat();
                break;
        }
    }
    
    /**
     * Return to previous scene
     */
    returnToPreviousScene() {
        if (this.previousScene) {
            this.changeScene(this.previousScene);
        }
    }
    
    // ================================================
    // COMBAT MANAGEMENT
    // ================================================
    
    /**
     * Initialize combat state
     */
    initializeCombat() {
        // Reset player HP to full for new combat encounter
        if (this.player && typeof this.player.fullHeal === 'function') {
            this.player.fullHeal();
        }

        this.combat.active = true;
        this.combat.turn = 0;
        this.combat.turnOrder = [];
        this.combat.currentTurn = 'player'; // Set to 'player' instead of numeric 0
        this.combat.actions = [];
        this.combat.battleResult = null;
    }
    
    /**
     * Reset combat state
     */
    resetCombat() {
        this.combat = {
            active: false,
            enemy: null,
            turn: 0,
            turnOrder: [],
            currentTurn: null, // Set to null when combat is inactive
            actions: [],
            battleResult: null
        };
    }
    
    /**
     * Exit combat
     */
    exitCombat() {
        this.resetCombat();
    }
    
    /**
     * Update combat state
     */
    updateCombat(deltaTime) {
        // Combat update logic will be implemented in combat.js
        // This is just the state management portion
    }
    
    // ================================================
    // UI AND NOTIFICATIONS
    // ================================================
    
    /**
     * Add notification
     */
    addNotification(message, type = 'info', duration = 3000) {
        const notification = {
            id: Date.now(),
            message: message,
            type: type,
            duration: duration,
            timeRemaining: duration
        };
        
        this.ui.notifications.push(notification);
        
        // Limit notifications
        if (this.ui.notifications.length > 5) {
            this.ui.notifications.shift();
        }
    }
    
    /**
     * Update notifications
     */
    updateNotifications(deltaTime) {
        this.ui.notifications = this.ui.notifications.filter(notification => {
            notification.timeRemaining -= deltaTime * 1000;
            return notification.timeRemaining > 0;
        });
    }
    
    // ================================================
    // SAVE/LOAD SYSTEM
    // ================================================
    
    /**
     * Get save data
     */
    getSaveData() {
        return {
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            player: this.player,
            monsters: this.monsters,
            world: this.world,
            settings: this.settings,
            stats: this.stats
        };
    }
    
    /**
     * Load from save data
     */
    loadFromSave(saveData) {
        try {
            if (saveData.player) this.player = { ...this.player, ...saveData.player };
            if (saveData.monsters) this.monsters = { ...this.monsters, ...saveData.monsters };
            if (saveData.world) this.world = { ...this.world, ...saveData.world };
            if (saveData.settings) this.settings = { ...this.settings, ...saveData.settings };
            if (saveData.stats) this.stats = { ...this.stats, ...saveData.stats };
            
            console.log('✅ Game state loaded from save');
            return true;
        } catch (error) {
            console.error('❌ Failed to load save data:', error);
            return false;
        }
    }
    
    /**
     * Trigger auto-save
     */
    triggerAutoSave() {
        if (typeof SaveSystem !== 'undefined' && this.settings.autoSave) {
            SaveSystem.autoSave();
        }
    }
    
    // ================================================
    // INPUT HANDLERS (Placeholder implementations)
    // ================================================
    
    handleMenuInput(inputType, inputData) {
        // Menu input handling - will be expanded in ui.js
    }
    
    handleCharacterSelectInput(inputType, inputData) {
        // Character selection input handling
    }
    
    handleWorldInput(inputType, inputData) {
        // World exploration input handling
    }
    
    handleCombatInput(inputType, inputData) {
        // Combat input handling - will be expanded in combat.js
    }
    
    handleMonsterInput(inputType, inputData) {
        // Monster management input handling
    }
    
    // ================================================
    // RENDERING (Placeholder implementations)
    // ================================================
    
    renderWorld(ctx) {
        // World rendering - basic placeholder
        ctx.fillStyle = '#2d5016';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw area name
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        const areaData = typeof AreaData !== 'undefined' ? 
            AreaData.getArea(this.world.currentArea) : null;
        const areaName = areaData?.name || this.world.currentArea;
        ctx.fillText(areaName, ctx.canvas.width / 2, 50);
    }
    
    renderCombat(ctx) {
        // Combat rendering placeholder
        ctx.fillStyle = '#5d1a1a';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.fillText('COMBAT', ctx.canvas.width / 2, ctx.canvas.height / 2);
    }
    
    renderMenu(ctx) {
        // Menu rendering placeholder
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    
    renderUI(ctx) {
        // UI overlay rendering - notifications, HUD, etc.
        this.renderNotifications(ctx);
    }
    
    renderNotifications(ctx) {
        let yOffset = 10;
        
        for (const notification of this.ui.notifications) {
            const alpha = Math.min(1, notification.timeRemaining / 1000);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            // Background
            ctx.fillStyle = this.getNotificationColor(notification.type);
            ctx.fillRect(ctx.canvas.width - 250, yOffset, 240, 30);
            
            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px serif';
            ctx.textAlign = 'center';
            ctx.fillText(notification.message, ctx.canvas.width - 130, yOffset + 20);
            
            ctx.restore();
            
            yOffset += 35;
        }
    }
    
    getNotificationColor(type) {
        switch (type) {
            case 'success': return '#28a745';
            case 'error': return '#dc3545';
            case 'warning': return '#ffc107';
            case 'info': return '#17a2b8';
            case 'item': return '#6f42c1';
            default: return '#6c757d';
        }
    }
}

// Make available globally
window.GameState = GameState;