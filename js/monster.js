/**
 * Monster System
 * Handles monster instances, stats, abilities, evolution, and breeding
 */

class Monster {
    constructor(species, level = 1, isWild = true) {
        this.id = null; // Will be set when captured
        this.species = species;
        this.level = level;
        this.isWild = isWild;
        
        // Get species data
        this.speciesData = this.getSpeciesData();
        if (!this.speciesData) {
            throw new Error(`Unknown monster species: ${species}`);
        }
        
        // Initialize stats and properties
        this.experience = 0;
        this.experienceToNext = this.calculateExperienceForLevel(level + 1);
        // Individual characteristics (must be ready before stats calc)
        this.personality = this.generatePersonality();
        this.individualValues = this.generateIVs();

        // Now that IVs exist, calculate stats
        this.stats = this.calculateStats();
        this.currentStats = {
            hp: this.stats.hp,
            mp: this.stats.mp
        };
        
        // Abilities and moves
        this.abilities = [...this.speciesData.abilities];
        this.learnedMoves = this.getMovesForLevel(level);
        this.nickname = null;
        this.friendship = isWild ? 0 : 50;
        
        // Evolution and breeding
        this.evolutionStage = 0;
        this.parentSpecies = null;
        this.generation = 1;
        
        // Status effects
        this.statusEffects = [];
        this.statModifiers = {};
        
        // Capture and management
        this.captureDate = null;
        this.originalTrainer = null;
        
        console.log(`${isWild ? 'Wild' : 'Captured'} ${species} (Level ${level}) created`);
    }
    
    // ================================================
    // DATA AND INITIALIZATION
    // ================================================
    
    /**
     * Get species data from MonsterData
     */
    getSpeciesData() {
        if (typeof MonsterData === 'undefined') {
            console.error('MonsterData not loaded');
            return null;
        }
        return MonsterData.getSpecies(this.species);
    }
    
    /**
     * Calculate current stats based on level and IVs
     */
    calculateStats() {
        if (!this.speciesData) return {};
        
        const baseStats = this.speciesData.baseStats;
        const growth = this.speciesData.statGrowth;
        const stats = {};
        
        // Calculate each stat with level growth and individual values
        for (const stat in baseStats) {
            const baseStat = baseStats[stat];
            const growthRate = growth[stat] || 0;
            const iv = this.individualValues[stat] || 0;
            
            // Formula: Base + (Growth * (Level - 1)) + IV + Level bonus
            stats[stat] = Math.floor(
                baseStat + 
                (growthRate * (this.level - 1)) + 
                iv + 
                (this.level * 0.5)
            );
        }
        
        return stats;
    }
    
    /**
     * Generate individual values (IVs) for unique stats
     */
    generateIVs() {
        const ivs = {};
        const statNames = ['hp', 'mp', 'attack', 'defense', 'magicAttack', 'magicDefense', 'speed', 'accuracy'];
        
        for (const stat of statNames) {
            // IVs range from 0 to 31 (like Pokemon)
            ivs[stat] = GameUtils.randomInt(0, 31);
        }
        
        return ivs;
    }
    
    /**
     * Generate personality traits
     */
    generatePersonality() {
        const personalities = [
            'Hardy', 'Lonely', 'Brave', 'Adamant', 'Naughty',
            'Bold', 'Docile', 'Relaxed', 'Impish', 'Lax',
            'Timid', 'Hasty', 'Serious', 'Jolly', 'Naive',
            'Modest', 'Mild', 'Quiet', 'Bashful', 'Rash',
            'Calm', 'Gentle', 'Sassy', 'Careful', 'Quirky'
        ];
        
        return GameUtils.randomChoice(personalities);
    }
    
    /**
     * Get moves/abilities available at current level
     */
    getMovesForLevel(level) {
        if (!this.speciesData || !this.speciesData.abilities) return [];
        
        // Start with basic abilities
        const moves = [...this.speciesData.abilities];
        
        // Add level-based moves (would come from a move learning table)
        const levelMoves = this.getLevelMoves(level);
        moves.push(...levelMoves);
        
        // Limit to 4 moves (like Pokemon)
        return moves.slice(0, 4);
    }
    
    /**
     * Get moves learned by level (placeholder implementation)
     */
    getLevelMoves(level) {
        const levelMoves = [];
        
        // Basic move progression based on level
        if (level >= 5) levelMoves.push('tackle');
        if (level >= 10) levelMoves.push('bite');
        if (level >= 15) levelMoves.push('roar');
        if (level >= 20) levelMoves.push('charge');
        
        return levelMoves;
    }
    
    // ================================================
    // LEVEL PROGRESSION
    // ================================================
    
    /**
     * Add experience and handle level ups
     */
    addExperience(amount) {
        if (this.isWild) return 0; // Wild monsters don't gain experience
        
        this.experience += amount;
        let levelsGained = 0;
        
        while (this.experience >= this.experienceToNext && this.level < 100) {
            levelsGained += this.levelUp();
        }
        
        return levelsGained;
    }
    
    /**
     * Level up the monster
     */
    levelUp() {
        this.experience -= this.experienceToNext;
        this.level++;
        
        // Calculate new stats
        const oldStats = { ...this.stats };
        this.stats = this.calculateStats();
        
        // Heal by the amount of HP/MP gained
        const hpGain = this.stats.hp - oldStats.hp;
        const mpGain = this.stats.mp - oldStats.mp;
        this.currentStats.hp = Math.min(this.currentStats.hp + hpGain, this.stats.hp);
        this.currentStats.mp = Math.min(this.currentStats.mp + mpGain, this.stats.mp);
        
        // Learn new moves
        const newMoves = this.getMovesForLevel(this.level);
        if (newMoves.length > this.learnedMoves.length) {
            const learnedMove = newMoves[newMoves.length - 1];
            this.learnedMoves = newMoves;
            console.log(`${this.getDisplayName()} learned ${learnedMove}!`);
        }
        
        // Check for evolution
        this.checkForEvolution();
        
        // Update experience requirement
        this.experienceToNext = this.calculateExperienceForLevel(this.level + 1);
        
        console.log(`${this.getDisplayName()} leveled up to ${this.level}! +${hpGain} HP, +${mpGain} MP`);
        
        return 1;
    }
    
    /**
     * Calculate experience required for a level
     */
    calculateExperienceForLevel(level) {
        // Different growth rates for different monster types
        const growthRate = this.getGrowthRate();
        
        switch (growthRate) {
            case 'fast':
                return Math.floor(80 * Math.pow(level, 2.4));
            case 'medium':
                return Math.floor(100 * Math.pow(level, 2.2));
            case 'slow':
                return Math.floor(125 * Math.pow(level, 2.0));
            default:
                return Math.floor(100 * Math.pow(level, 2.2));
        }
    }
    
    /**
     * Get growth rate based on species rarity
     */
    getGrowthRate() {
        if (!this.speciesData) return 'medium';
        
        switch (this.speciesData.rarity) {
            case 'common': return 'fast';
            case 'uncommon': return 'medium';
            case 'rare': return 'slow';
            case 'legendary': return 'slow';
            default: return 'medium';
        }
    }
    
    // ================================================
    // COMBAT AND STATUS
    // ================================================
    
    /**
     * Take damage in combat
     */
    takeDamage(amount, type = 'physical') {
        const actualDamage = Math.max(1, Math.floor(amount));
        this.currentStats.hp = Math.max(0, this.currentStats.hp - actualDamage);
        
        return this.currentStats.hp <= 0; // Returns true if fainted
    }
    
    /**
     * Heal HP
     */
    heal(amount) {
        const oldHP = this.currentStats.hp;
        this.currentStats.hp = Math.min(this.currentStats.hp + amount, this.stats.hp);
        return this.currentStats.hp - oldHP;
    }
    
    /**
     * Restore MP
     */
    restoreMP(amount) {
        const oldMP = this.currentStats.mp;
        this.currentStats.mp = Math.min(this.currentStats.mp + amount, this.stats.mp);
        return this.currentStats.mp - oldMP;
    }
    
    /**
     * Use MP for abilities
     */
    useMP(amount) {
        if (this.currentStats.mp >= amount) {
            this.currentStats.mp -= amount;
            return true;
        }
        return false;
    }
    
    /**
     * Check if monster is alive/conscious
     */
    isAlive() {
        return this.currentStats.hp > 0;
    }
    
    /**
     * Full heal (rest at sanctuary, etc.)
     */
    fullHeal() {
        this.currentStats.hp = this.stats.hp;
        this.currentStats.mp = this.stats.mp;
        this.statusEffects = [];
        this.statModifiers = {};
    }
    
    /**
     * Apply status effect
     */
    applyStatusEffect(effect, duration = 3) {
        // Remove existing effect of same type
        this.statusEffects = this.statusEffects.filter(se => se.type !== effect);
        
        // Add new effect
        this.statusEffects.push({
            type: effect,
            duration: duration,
            remainingTurns: duration
        });
        
        console.log(`${this.getDisplayName()} is now ${effect}`);
    }
    
    /**
     * Remove status effect
     */
    removeStatusEffect(effect) {
        const removed = this.statusEffects.find(se => se.type === effect);
        this.statusEffects = this.statusEffects.filter(se => se.type !== effect);
        
        if (removed) {
            console.log(`${this.getDisplayName()} is no longer ${effect}`);
        }
        
        return !!removed;
    }
    
    /**
     * Process status effects (called each turn)
     */
    processStatusEffects() {
        const effectsToRemove = [];
        
        for (const effect of this.statusEffects) {
            // Apply effect
            switch (effect.type) {
                case 'poison':
                    const poisonDamage = Math.floor(this.stats.hp * 0.1);
                    this.takeDamage(poisonDamage, 'poison');
                    console.log(`${this.getDisplayName()} takes ${poisonDamage} poison damage`);
                    break;
                case 'burn':
                    const burnDamage = Math.floor(this.stats.hp * 0.08);
                    this.takeDamage(burnDamage, 'burn');
                    console.log(`${this.getDisplayName()} takes ${burnDamage} burn damage`);
                    break;
                case 'regeneration':
                    const healAmount = Math.floor(this.stats.hp * 0.1);
                    this.heal(healAmount);
                    console.log(`${this.getDisplayName()} regenerates ${healAmount} HP`);
                    break;
            }
            
            // Reduce duration
            effect.remainingTurns--;
            if (effect.remainingTurns <= 0) {
                effectsToRemove.push(effect);
            }
        }
        
        // Remove expired effects
        for (const effect of effectsToRemove) {
            this.removeStatusEffect(effect.type);
        }
    }
    
    // ================================================
    // EVOLUTION SYSTEM
    // ================================================
    
    /**
     * Check if monster can evolve
     */
    checkForEvolution() {
        if (!this.speciesData || !this.speciesData.evolvesTo.length) return false;
        
        const evolutionData = MonsterData.getEvolutionRequirements(this.species);
        if (!evolutionData) return false;
        
        // Check level requirement
        if (this.level < evolutionData.level) return false;
        
        // If items are required, verify player has them and confirm consumption
        const itemsRequired = Array.isArray(evolutionData.items) ? evolutionData.items : [];
        if (itemsRequired.length > 0) {
            const gameState = this.getGameState();
            if (!gameState) {
                console.warn('GameState not available; cannot verify evolution items.');
                return false;
            }
            // Verify inventory
            if (!this.hasRequiredItems(itemsRequired, gameState)) {
                gameState.addNotification('Missing required items for evolution', 'error');
                return false;
            }
            // Simple confirmation UX
            const itemList = itemsRequired.join(', ');
            const confirmed = typeof window !== 'undefined' ? window.confirm(
                `Evolve ${this.getDisplayName()} using required items: ${itemList}?`
            ) : true;
            if (!confirmed) return false;
        }
        
        // Evolution is possible
        const possibleEvolutions = evolutionData.possibleEvolutions;
        if (possibleEvolutions.length > 0) {
            const newSpecies = possibleEvolutions[0];
            const gameState = this.getGameState();
            // Consume items if required
            const itemsRequired = Array.isArray(evolutionData.items) ? evolutionData.items : [];
            if (itemsRequired.length > 0 && gameState) {
                this.consumeEvolutionItems(itemsRequired, gameState);
                gameState.addNotification(`Used items for evolution: ${itemsRequired.join(', ')}`, 'item');
            }
            this.evolve(newSpecies);
            if (gameState) {
                gameState.addNotification(`${this.getDisplayName()} evolved into ${this.speciesData?.name || newSpecies}!`, 'success');
            }
            return true;
        }
        
        return false;
    }
    
    /**
     * Evolve monster to new species
     */
    evolve(newSpecies) {
        const oldSpecies = this.species;
        const oldName = this.getDisplayName();
        
        // Update species
        this.species = newSpecies;
        this.speciesData = this.getSpeciesData();
        this.evolutionStage++;
        
        if (!this.speciesData) {
            console.error(`Evolution failed: Unknown species ${newSpecies}`);
            this.species = oldSpecies;
            return false;
        }
        
        // Recalculate stats with new species base
        const oldStats = { ...this.currentStats };
        this.stats = this.calculateStats();
        
        // Maintain HP/MP percentages through evolution
        const hpPercent = oldStats.hp / this.stats.hp;
        const mpPercent = oldStats.mp / this.stats.mp;
        this.currentStats.hp = Math.floor(this.stats.hp * hpPercent);
        this.currentStats.mp = Math.floor(this.stats.mp * mpPercent);
        
        // Learn new abilities from evolved form
        this.abilities = [...this.speciesData.abilities];
        this.learnedMoves = this.getMovesForLevel(this.level);
        
        console.log(`${oldName} evolved into ${this.getDisplayName()}!`);
        
        return true;
    }

    /**
     * Helpers for evolution item checks/consumption
     */
    getGameState() {
        try {
            if (typeof window !== 'undefined' && window.SawyersRPG && typeof window.SawyersRPG.getGameState === 'function') {
                return window.SawyersRPG.getGameState();
            }
        } catch (e) {
            // ignore
        }
        return null;
    }
    
    hasRequiredItems(items, gameState) {
        if (!gameState || !Array.isArray(items) || items.length === 0) return true;
        const inv = gameState.player?.inventory?.items || {};
        // All items listed are required once each
        return items.every(itemId => (inv[itemId] || 0) >= 1);
    }
    
    consumeEvolutionItems(items, gameState) {
        if (!gameState || !Array.isArray(items) || items.length === 0) return;
        for (const itemId of items) {
            // Remove one of each required item
            if (typeof gameState.removeItem === 'function') {
                gameState.removeItem(itemId, 1);
            } else {
                // Fallback direct decrement if needed
                if (gameState.player?.inventory?.items?.[itemId]) {
                    gameState.player.inventory.items[itemId] = Math.max(0, gameState.player.inventory.items[itemId] - 1);
                    if (gameState.player.inventory.items[itemId] === 0) {
                        delete gameState.player.inventory.items[itemId];
                    }
                }
            }
        }
    }
    
    /**
     * Check if monster can breed with another
     */
    canBreedWith(otherMonster) {
        if (!this.speciesData || !otherMonster.speciesData) return false;
        
        // Check if species are compatible
        if (typeof MonsterData !== 'undefined') {
            return MonsterData.canBreed(this.species, otherMonster.species);
        }
        
        return false;
    }
    
    /**
     * Breed with another monster to create offspring
     */
    breedWith(otherMonster) {
        if (!this.canBreedWith(otherMonster)) {
            return null;
        }
        
        // Get possible breeding outcomes
        let outcomes = [];
        if (typeof MonsterData !== 'undefined') {
            outcomes = MonsterData.getBreedingOutcomes(this.species, otherMonster.species);
        }
        
        if (outcomes.length === 0) return null;
        
        // Select outcome based on chances
        const totalChance = outcomes.reduce((sum, outcome) => sum + outcome.chance, 0);
        let random = Math.random() * totalChance;
        
        let selectedSpecies = outcomes[0].species;
        for (const outcome of outcomes) {
            random -= outcome.chance;
            if (random <= 0) {
                selectedSpecies = outcome.species;
                break;
            }
        }
        
        // Create offspring
        const offspring = new Monster(selectedSpecies, 1, false);
        offspring.parentSpecies = [this.species, otherMonster.species];
        offspring.generation = Math.max(this.generation, otherMonster.generation) + 1;
        
        // Inherit some characteristics
        this.inheritCharacteristics(offspring, otherMonster);
        
        console.log(`${this.getDisplayName()} and ${otherMonster.getDisplayName()} produced a ${offspring.getDisplayName()}!`);
        
        return offspring;
    }
    
    /**
     * Pass characteristics to offspring
     */
    inheritCharacteristics(offspring, otherParent) {
        // Inherit random IVs from both parents
        for (const stat in offspring.individualValues) {
            if (GameUtils.randomBool()) {
                offspring.individualValues[stat] = Math.floor((this.individualValues[stat] + otherParent.individualValues[stat]) / 2);
            }
        }
        
        // Chance to inherit moves from parents
        const inheritableMoves = [...this.learnedMoves, ...otherParent.learnedMoves];
        if (inheritableMoves.length > 0) {
            const inheritedMove = GameUtils.randomChoice(inheritableMoves);
            if (!offspring.learnedMoves.includes(inheritedMove)) {
                offspring.learnedMoves.push(inheritedMove);
            }
        }
        
        // Recalculate stats with new IVs
        offspring.stats = offspring.calculateStats();
        offspring.currentStats.hp = offspring.stats.hp;
        offspring.currentStats.mp = offspring.stats.mp;
    }
    
    // ================================================
    // AI AND BEHAVIOR
    // ================================================
    
    /**
     * Get AI behavior for wild monsters in combat
     */
    getAIBehavior() {
        const behaviors = {
            aggressive: 0.7,    // 70% chance to attack
            defensive: 0.3,     // 30% chance to defend/use items
            special: 0.2        // 20% chance to use special abilities
        };
        
        // Modify behavior based on health
        const healthPercent = this.currentStats.hp / this.stats.hp;
        if (healthPercent < 0.3) {
            behaviors.defensive += 0.3; // More likely to defend when low on health
        } else if (healthPercent > 0.8) {
            behaviors.aggressive += 0.2; // More aggressive when healthy
        }
        
        return behaviors;
    }
    
    /**
     * Choose action for AI-controlled monster
     */
    chooseAIAction(availableTargets) {
        const behavior = this.getAIBehavior();
        const random = Math.random();
        
        if (random < behavior.special && this.learnedMoves.length > 0) {
            // Use special ability
            const move = GameUtils.randomChoice(this.learnedMoves);
            return {
                type: 'ability',
                ability: move,
                target: this.chooseTarget(availableTargets)
            };
        } else if (random < behavior.aggressive) {
            // Basic attack
            return {
                type: 'attack',
                target: this.chooseTarget(availableTargets)
            };
        } else {
            // Defensive action
            return {
                type: 'defend',
                target: this
            };
        }
    }
    
    /**
     * Choose target from available targets
     */
    chooseTarget(availableTargets) {
        if (availableTargets.length === 0) return null;
        
        // Simple AI: target lowest HP enemy
        return availableTargets.reduce((lowest, target) => 
            target.currentStats.hp < lowest.currentStats.hp ? target : lowest
        );
    }
    
    // ================================================
    // FRIENDSHIP AND BONDING
    // ================================================
    
    /**
     * Increase friendship with player
     */
    increaseFriendship(amount = 1) {
        if (this.isWild) return;
        
        this.friendship = Math.min(100, this.friendship + amount);
        
        if (this.friendship === 100) {
            console.log(`${this.getDisplayName()} has maximum friendship with you!`);
        }
    }
    
    /**
     * Decrease friendship
     */
    decreaseFriendship(amount = 1) {
        if (this.isWild) return;
        
        this.friendship = Math.max(0, this.friendship - amount);
    }
    
    /**
     * Get friendship level description
     */
    getFriendshipLevel() {
        if (this.friendship >= 90) return 'Devoted';
        if (this.friendship >= 70) return 'Loyal';
        if (this.friendship >= 50) return 'Friendly';
        if (this.friendship >= 30) return 'Neutral';
        if (this.friendship >= 10) return 'Wary';
        return 'Hostile';
    }
    
    // ================================================
    // DISPLAY AND UTILITY
    // ================================================
    
    /**
     * Get display name (nickname or species name)
     */
    getDisplayName() {
        return this.nickname || (this.speciesData ? this.speciesData.name : this.species);
    }
    
    /**
     * Set nickname
     */
    setNickname(nickname) {
        this.nickname = nickname;
        console.log(`${this.species} is now called ${nickname}!`);
    }
    
    /**
     * Get monster summary for UI
     */
    getSummary() {
        return {
            id: this.id,
            species: this.species,
            name: this.getDisplayName(),
            level: this.level,
            hp: this.currentStats.hp,
            maxHP: this.stats.hp,
            mp: this.currentStats.mp,
            maxMP: this.stats.mp,
            experience: this.experience,
            experienceToNext: this.experienceToNext,
            stats: this.stats,
            abilities: this.learnedMoves,
            personality: this.personality,
            friendship: this.friendship,
            friendshipLevel: this.getFriendshipLevel(),
            statusEffects: this.statusEffects.map(se => se.type),
            isWild: this.isWild,
            evolutionStage: this.evolutionStage,
            generation: this.generation
        };
    }
    
    /**
     * Get detailed info for inspection
     */
    getDetailedInfo() {
        return {
            ...this.getSummary(),
            individualValues: this.individualValues,
            parentSpecies: this.parentSpecies,
            captureDate: this.captureDate,
            originalTrainer: this.originalTrainer,
            speciesData: this.speciesData
        };
    }
    
    /**
     * Capture this wild monster
     */
    capture(trainerId = null) {
        if (!this.isWild) {
            console.warn('Monster is already captured');
            return false;
        }
        
        this.isWild = false;
        this.captureDate = new Date().toISOString();
        this.originalTrainer = trainerId;
        this.friendship = 20; // Base friendship on capture
        
        console.log(`${this.getDisplayName()} was captured!`);
        return true;
    }
    
    /**
     * Release monster back to the wild
     */
    release() {
        if (this.isWild) {
            console.warn('Monster is already wild');
            return false;
        }
        
        this.isWild = true;
        this.captureDate = null;
        this.originalTrainer = null;
        this.friendship = 0;
        this.nickname = null;
        
        console.log(`${this.getDisplayName()} was released back to the wild.`);
        return true;
    }
}

// Make available globally
window.Monster = Monster;