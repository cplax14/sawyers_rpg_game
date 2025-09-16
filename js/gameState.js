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
                gold: 100
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
            currentStoryPath: null
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
            currentStoryPath: null
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
     * Add item to inventory
     */
    addItem(itemId, quantity = 1) {
        if (!this.player.inventory.items[itemId]) {
            this.player.inventory.items[itemId] = 0;
        }
        this.player.inventory.items[itemId] += quantity;
        
        this.addNotification(`+${quantity} ${itemId}`, 'item');
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
            captureDate: new Date().toISOString(),
            nickname: null
        };
        
        this.monsters.storage.push(monster);
        this.stats.monstersCaptured++;
        
        this.addNotification(`Captured ${species}!`, 'success');
        console.log(`Monster captured: ${species} (Level ${level})`);
        
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
     * Check for newly unlocked areas
     */
    checkUnlockedAreas() {
        if (typeof AreaData === 'undefined') return;
        
        const allAreas = Object.keys(AreaData.areas);
        
        for (const areaName of allAreas) {
            if (!this.world.unlockedAreas.includes(areaName)) {
                const isUnlocked = AreaData.isAreaUnlocked(
                    areaName,
                    this.world.storyFlags,
                    this.player.level,
                    Object.keys(this.player.inventory.items),
                    this.player.class
                );
                
                if (isUnlocked) {
                    this.world.unlockedAreas.push(areaName);
                    // Keep stats consistent with travelToArea when discovering new areas
                    this.stats.areasExplored++;
                    const area = AreaData.getArea(areaName);
                    this.addNotification(`New area available: ${area?.name || areaName}`, 'info');
                }
            }
        }
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
        // Ensure story path reflects any new flags
        try {
            if (typeof StoryData !== 'undefined' && typeof StoryData.calculateStoryBranch === 'function') {
                this.world.currentStoryPath = StoryData.calculateStoryBranch(this.world.storyFlags);
            }
        } catch (e) { console.warn('Story path recalc after choice failed:', e); }
        
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