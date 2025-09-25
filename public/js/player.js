/**
 * Player System
 * Handles player character creation, progression, and management
 */

class Player {
    constructor(gameState) {
        this.gameState = gameState;
        this.data = gameState.player;
        this.initialized = false;
        
        this.init();
    }
    
    /**
     * Initialize player system
     */
    init() {
        this.initialized = true;
        console.log('✅ Player system initialized');
    }
    
    // ================================================
    // CHARACTER CREATION
    // ================================================
    
    /**
     * Create new character with specified class
     */
    createCharacter(className, playerName = '') {
        if (typeof CharacterData === 'undefined') {
            console.error('CharacterData not available');
            return false;
        }
        
        const classData = CharacterData.getClass(className);
        if (!classData) {
            console.error(`Invalid character class: ${className}`);
            return false;
        }
        
        // Initialize player data
        this.data.name = playerName || this.generateDefaultName();
        this.data.class = className;
        this.data.level = 1;
        this.data.experience = 0;
        this.data.experienceToNext = this.calculateExperienceForLevel(2);
        
        // Set base stats from class data
        this.data.stats = { ...classData.baseStats };
        
        // Add current HP/MP tracking
        this.data.currentStats = {
            hp: this.data.stats.hp,
            mp: this.data.stats.mp
        };
        
        // Set starting spells
        this.data.spells = [...classData.startingSpells];
        
        // Set starting equipment
        this.setStartingEquipment(classData);
        
        // Set starting inventory
        this.setStartingInventory(classData);
        
        console.log(`Character created: ${this.data.name} (${classData.name})`);
        return true;
    }
    
    /**
     * Generate default player name
     */
    generateDefaultName() {
        const names = [
            'Adventurer', 'Hero', 'Champion', 'Wanderer', 'Explorer',
            'Seeker', 'Guardian', 'Warrior', 'Traveler', 'Quester'
        ];
        return GameUtils.randomChoice(names);
    }
    
    /**
     * Set starting equipment based on class
     */
    setStartingEquipment(classData) {
        const startingGear = {
            knight: {
                weapon: 'iron_sword',
                armor: 'leather_armor',
                accessory: 'health_ring'
            },
            wizard: {
                weapon: 'oak_staff',
                armor: 'cloth_robe',
                accessory: 'mana_crystal'
            },
            rogue: {
                weapon: 'steel_dagger',
                armor: 'leather_vest',
                accessory: 'stealth_cloak'
            },
            paladin: {
                weapon: 'blessed_mace',
                armor: 'chain_mail',
                accessory: 'holy_symbol'
            },
            ranger: {
                weapon: 'hunting_bow',
                armor: 'ranger_cloak',
                accessory: 'nature_charm'
            },
            warrior: {
                weapon: 'battle_axe',
                armor: 'scale_mail',
                accessory: 'strength_band'
            }
        };
        
        const gear = startingGear[this.data.class];
        if (gear) {
            this.data.equipment = { ...gear };
        }
    }
    
    /**
     * Set starting inventory based on class
     */
    setStartingInventory(classData) {
        // Base starting items for all classes
        this.data.inventory.items = {
            'health_potion': 5,
            'mana_potion': 3,
            'antidote': 2,
            'bread': 10
        };
        
        // Class-specific starting items
        const classItems = {
            knight: { 'repair_kit': 2 },
            wizard: { 'spell_scroll': 3, 'magic_ink': 5 },
            rogue: { 'lockpick': 5, 'smoke_bomb': 3 },
            paladin: { 'blessed_water': 3, 'prayer_book': 1 },
            ranger: { 'arrow': 50, 'trap_kit': 3 },
            warrior: { 'whetstone': 3, 'battle_ration': 5 }
        };
        
        const items = classItems[this.data.class];
        if (items) {
            Object.assign(this.data.inventory.items, items);
        }
        
        // Starting gold
        this.data.inventory.gold = 100;
    }
    
    // ================================================
    // LEVEL PROGRESSION
    // ================================================
    
    /**
     * Add experience and handle level ups
     */
    addExperience(amount) {
        this.data.experience += amount;
        
        let levelsGained = 0;
        while (this.data.experience >= this.data.experienceToNext) {
            levelsGained += this.levelUp();
        }
        
        if (levelsGained > 0) {
            this.gameState.addNotification(`Gained ${levelsGained} level(s)!`, 'success');
            return levelsGained;
        }
        
        return 0;
    }
    
    /**
     * Level up the player
     */
    levelUp() {
        if (typeof CharacterData === 'undefined') return 0;
        
        this.data.experience -= this.data.experienceToNext;
        this.data.level++;
        
        // Calculate new stats
        const newStats = CharacterData.getStatsAtLevel(this.data.class, this.data.level);
        const oldHP = this.data.currentStats.hp;
        const oldMP = this.data.currentStats.mp;
        
        // Store the HP/MP increase for display
        const hpGain = newStats.hp - this.data.stats.hp;
        const mpGain = newStats.mp - this.data.stats.mp;
        
        // Update stats
        this.data.stats = newStats;
        
        // Heal player by the amount of HP/MP gained
        this.data.currentStats.hp = Math.min(oldHP + hpGain, this.data.stats.hp);
        this.data.currentStats.mp = Math.min(oldMP + mpGain, this.data.stats.mp);
        
        // Learn new spells
        this.data.spells = CharacterData.getSpellsAtLevel(this.data.class, this.data.level);
        
        // Update experience requirement for next level
        this.data.experienceToNext = this.calculateExperienceForLevel(this.data.level + 1);
        
        console.log(`Player leveled up to ${this.data.level}! +${hpGain} HP, +${mpGain} MP`);
        
        // Show detailed level up notification
        this.gameState.addNotification(
            `Level ${this.data.level}! +${hpGain} HP, +${mpGain} MP`, 
            'success'
        );
        
        return 1;
    }
    
    /**
     * Calculate experience required for a specific level
     */
    calculateExperienceForLevel(level) {
        // Exponential curve: level 2 = 100, level 10 ≈ 1000, level 30 ≈ 20000
        return Math.floor(50 * Math.pow(level, 1.8));
    }
    
    /**
     * Get experience percentage to next level
     */
    getExperiencePercentage() {
        if (this.data.experienceToNext <= 0) return 100;
        return (this.data.experience / this.data.experienceToNext) * 100;
    }
    
    // ================================================
    // STATS AND EQUIPMENT
    // ================================================
    
    /**
     * Get effective stats (base + equipment bonuses)
     */
    getEffectiveStats() {
        const baseStats = { ...this.data.stats };
        
        // Apply equipment bonuses
        const equipmentBonuses = this.calculateEquipmentBonuses();
        
        const effectiveStats = {};
        for (const stat in baseStats) {
            effectiveStats[stat] = baseStats[stat] + (equipmentBonuses[stat] || 0);
        }
        
        return effectiveStats;
    }
    
    /**
     * Calculate equipment stat bonuses
     */
    calculateEquipmentBonuses() {
        // Equipment data would need to be defined - placeholder
        const bonuses = {
            hp: 0, mp: 0, attack: 0, defense: 0,
            magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0
        };
        
        // Add weapon bonuses
        if (this.data.equipment.weapon) {
            const weaponBonuses = this.getItemStats(this.data.equipment.weapon);
            this.addStatBonuses(bonuses, weaponBonuses);
        }
        
        // Add armor bonuses
        if (this.data.equipment.armor) {
            const armorBonuses = this.getItemStats(this.data.equipment.armor);
            this.addStatBonuses(bonuses, armorBonuses);
        }
        
        // Add accessory bonuses
        if (this.data.equipment.accessory) {
            const accessoryBonuses = this.getItemStats(this.data.equipment.accessory);
            this.addStatBonuses(bonuses, accessoryBonuses);
        }
        
        return bonuses;
    }
    
    /**
     * Get item stat bonuses (placeholder - would need item database)
     */
    getItemStats(itemId) {
        // Placeholder item stats - would come from item database
        const itemStats = {
            // Weapons
            'iron_sword': { attack: 15, accuracy: 5 },
            'oak_staff': { magicAttack: 20, mp: 10 },
            'steel_dagger': { attack: 12, speed: 8, accuracy: 10 },
            'blessed_mace': { attack: 18, magicAttack: 8, magicDefense: 5 },
            'hunting_bow': { attack: 16, accuracy: 15 },
            'battle_axe': { attack: 22, speed: -5 },
            
            // Armor
            'leather_armor': { defense: 8, speed: -2 },
            'cloth_robe': { magicDefense: 12, mp: 15 },
            'leather_vest': { defense: 6, speed: 3 },
            'chain_mail': { defense: 15, magicDefense: 8, speed: -8 },
            'ranger_cloak': { defense: 5, speed: 5, accuracy: 5 },
            'scale_mail': { defense: 20, speed: -10 },
            
            // Accessories
            'health_ring': { hp: 25 },
            'mana_crystal': { mp: 30, magicAttack: 5 },
            'stealth_cloak': { speed: 10, accuracy: 8 },
            'holy_symbol': { magicDefense: 10, mp: 20 },
            'nature_charm': { hp: 15, mp: 15 },
            'strength_band': { attack: 8, hp: 20 }
        };
        
        return itemStats[itemId] || {};
    }
    
    /**
     * Add stat bonuses to total
     */
    addStatBonuses(total, bonuses) {
        for (const stat in bonuses) {
            if (total.hasOwnProperty(stat)) {
                total[stat] += bonuses[stat];
            }
        }
    }
    
    /**
     * Equip item
     */
    equipItem(itemId, slot) {
        if (!this.hasItem(itemId)) {
            console.warn(`Player doesn't have item: ${itemId}`);
            return false;
        }
        
        // Unequip current item in slot
        if (this.data.equipment[slot]) {
            this.addItem(this.data.equipment[slot], 1);
        }
        
        // Equip new item
        this.data.equipment[slot] = itemId;
        this.removeItem(itemId, 1);
        
        this.gameState.addNotification(`Equipped ${itemId}`, 'success');
        console.log(`Equipped ${itemId} in ${slot} slot`);
        
        return true;
    }
    
    /**
     * Unequip item
     */
    unequipItem(slot) {
        if (!this.data.equipment[slot]) return false;
        
        const itemId = this.data.equipment[slot];
        this.data.equipment[slot] = null;
        this.addItem(itemId, 1);
        
        this.gameState.addNotification(`Unequipped ${itemId}`, 'info');
        console.log(`Unequipped ${itemId} from ${slot} slot`);
        
        return true;
    }
    
    // ================================================
    // INVENTORY MANAGEMENT
    // ================================================
    
    /**
     * Add item to inventory
     */
    addItem(itemId, quantity = 1) {
        if (!this.data.inventory.items[itemId]) {
            this.data.inventory.items[itemId] = 0;
        }
        this.data.inventory.items[itemId] += quantity;
        
        if (quantity > 0) {
            this.gameState.addNotification(
                `+${quantity} ${this.getItemName(itemId)}`, 
                'item'
            );
        }
        
        return true;
    }
    
    /**
     * Remove item from inventory
     */
    removeItem(itemId, quantity = 1) {
        if (!this.hasItem(itemId, quantity)) {
            return false;
        }
        
        this.data.inventory.items[itemId] -= quantity;
        if (this.data.inventory.items[itemId] <= 0) {
            delete this.data.inventory.items[itemId];
        }
        
        return true;
    }
    
    /**
     * Check if player has item
     */
    hasItem(itemId, quantity = 1) {
        return (this.data.inventory.items[itemId] || 0) >= quantity;
    }
    
    /**
     * Get item count
     */
    getItemCount(itemId) {
        return this.data.inventory.items[itemId] || 0;
    }
    
    /**
     * Get item display name
     */
    getItemName(itemId) {
        // Would come from item database - placeholder
        return itemId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Use consumable item
     */
    useItem(itemId) {
        if (!this.hasItem(itemId)) {
            this.gameState.addNotification(`No ${this.getItemName(itemId)} available`, 'error');
            return false;
        }
        
        const success = this.applyItemEffect(itemId);
        if (success) {
            this.removeItem(itemId, 1);
            this.gameState.addNotification(`Used ${this.getItemName(itemId)}`, 'info');
        }
        
        return success;
    }
    
    /**
     * Apply item effects
     */
    applyItemEffect(itemId) {
        const effects = {
            'health_potion': () => this.heal(50),
            'mana_potion': () => this.restoreMana(30),
            'antidote': () => this.removeStatusEffect('poison'),
            'bread': () => this.heal(15)
        };
        
        const effect = effects[itemId];
        if (effect) {
            return effect();
        }
        
        console.warn(`No effect defined for item: ${itemId}`);
        return false;
    }
    
    /**
     * Add gold
     */
    addGold(amount) {
        this.data.inventory.gold += amount;
        if (amount > 0) {
            this.gameState.addNotification(`+${amount} gold`, 'success');
        }
    }
    
    /**
     * Remove gold
     */
    removeGold(amount) {
        if (this.data.inventory.gold >= amount) {
            this.data.inventory.gold -= amount;
            return true;
        }
        return false;
    }
    
    // ================================================
    // HEALTH AND STATUS
    // ================================================
    
    /**
     * Heal player
     */
    heal(amount) {
        const oldHP = this.data.currentStats.hp;
        this.data.currentStats.hp = Math.min(
            this.data.currentStats.hp + amount,
            this.data.stats.hp
        );
        
        const actualHealing = this.data.currentStats.hp - oldHP;
        if (actualHealing > 0) {
            this.gameState.addNotification(`+${actualHealing} HP`, 'success');
            return true;
        }
        
        return false;
    }
    
    /**
     * Restore mana
     */
    restoreMana(amount) {
        const oldMP = this.data.currentStats.mp;
        this.data.currentStats.mp = Math.min(
            this.data.currentStats.mp + amount,
            this.data.stats.mp
        );
        
        const actualRestore = this.data.currentStats.mp - oldMP;
        if (actualRestore > 0) {
            this.gameState.addNotification(`+${actualRestore} MP`, 'success');
            return true;
        }
        
        return false;
    }
    
    /**
     * Take damage
     */
    takeDamage(amount) {
        this.data.currentStats.hp = Math.max(0, this.data.currentStats.hp - amount);
        this.gameState.addNotification(`-${amount} HP`, 'error');
        
        return this.data.currentStats.hp <= 0; // Returns true if player died
    }
    
    /**
     * Use mana
     */
    useMana(amount) {
        if (this.data.currentStats.mp >= amount) {
            this.data.currentStats.mp -= amount;
            return true;
        }
        return false;
    }
    
    /**
     * Check if player is alive
     */
    isAlive() {
        return this.data.currentStats.hp > 0;
    }
    
    /**
     * Full heal (rest at inn, etc.)
     */
    fullHeal() {
        this.data.currentStats.hp = this.data.stats.hp;
        this.data.currentStats.mp = this.data.stats.mp;
        this.gameState.addNotification('Fully restored!', 'success');
    }
    
    /**
     * Remove status effect
     */
    removeStatusEffect(effect) {
        // Status effects would be tracked separately - placeholder
        this.gameState.addNotification(`${effect} cured`, 'success');
        return true;
    }
    
    // ================================================
    // SPELLS AND ABILITIES
    // ================================================
    
    /**
     * Learn new spell
     */
    learnSpell(spellId) {
        if (!this.data.spells.includes(spellId)) {
            this.data.spells.push(spellId);
            this.gameState.addNotification(`Learned ${spellId}!`, 'success');
            console.log(`Player learned spell: ${spellId}`);
            return true;
        }
        return false;
    }
    
    /**
     * Check if player knows spell
     */
    knowsSpell(spellId) {
        return this.data.spells.includes(spellId);
    }
    
    /**
     * Get available spells for current level
     */
    getAvailableSpells() {
        if (typeof CharacterData === 'undefined') return this.data.spells;
        
        return CharacterData.getSpellsAtLevel(this.data.class, this.data.level);
    }
    
    // ================================================
    // DISPLAY AND UI HELPERS
    // ================================================
    
    /**
     * Get player summary for UI display
     */
    getSummary() {
        const classData = typeof CharacterData !== 'undefined' ? 
            CharacterData.getClass(this.data.class) : null;
        
        return {
            name: this.data.name,
            class: this.data.class,
            className: classData?.name || this.data.class,
            level: this.data.level,
            hp: this.data.currentStats.hp,
            maxHP: this.data.stats.hp,
            mp: this.data.currentStats.mp,
            maxMP: this.data.stats.mp,
            experience: this.data.experience,
            experienceToNext: this.data.experienceToNext,
            experiencePercentage: this.getExperiencePercentage(),
            gold: this.data.inventory.gold,
            stats: this.getEffectiveStats()
        };
    }
    
    /**
     * Get inventory summary
     */
    getInventorySummary() {
        return {
            gold: this.data.inventory.gold,
            items: Object.entries(this.data.inventory.items).map(([id, count]) => ({
                id: id,
                name: this.getItemName(id),
                count: count
            })),
            equipment: {
                weapon: this.data.equipment.weapon,
                armor: this.data.equipment.armor,
                accessory: this.data.equipment.accessory
            }
        };
    }
}

// Make available globally
window.Player = Player;