/**
 * Monster Capture System
 * Handles capturing wild monsters during combat encounters
 */

class MonsterCaptureSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.captureInProgress = false;
        this.captureAnimation = null;
        
        this.init();
    }
    
    /**
     * Initialize capture system
     */
    init() {
        console.log('✅ Monster Capture System initialized');
    }
    
    // ================================================
    // CAPTURE MECHANICS
    // ================================================
    
    /**
     * Attempt to capture a wild monster
     */
    attemptCapture(wildMonster, captureItem = 'monster_ball') {
        if (!wildMonster || !wildMonster.isWild) {
            return {
                success: false,
                reason: 'Target is not a wild monster'
            };
        }
        
        if (!this.gameState.player.hasItem(captureItem)) {
            return {
                success: false,
                reason: `No ${captureItem} available`
            };
        }
        
        // Remove capture item from inventory
        this.gameState.player.removeItem(captureItem, 1);
        
        // Calculate capture rate
        const captureRate = this.calculateCaptureRate(wildMonster, captureItem);
        
        // Perform capture attempt
        const captureResult = this.performCapture(wildMonster, captureRate, captureItem);
        
        // Apply class-specific bonuses
        this.applyClassBonuses(captureResult, wildMonster);
        
        // Handle capture result
        if (captureResult.success) {
            this.handleSuccessfulCapture(wildMonster);
        } else {
            this.handleFailedCapture(wildMonster, captureResult);
        }
        
        // Update statistics
        this.updateCaptureStats(captureResult);
        
        return captureResult;
    }
    
    /**
     * Calculate capture rate based on various factors
     */
    calculateCaptureRate(monster, captureItem) {
        const speciesData = monster.speciesData;
        if (!speciesData) return 0;
        
        // Base capture rate from species data
        let baseRate = speciesData.captureRate / 100; // Convert to decimal
        
        // Health factor (lower health = higher capture rate)
        const healthFactor = 1 - (monster.currentStats.hp / monster.stats.hp);
        const healthMultiplier = 1 + (healthFactor * 0.5); // Up to 50% bonus
        
        // Status effect bonuses
        const statusMultiplier = this.getStatusEffectMultiplier(monster);
        
        // Capture item effectiveness
        const itemMultiplier = this.getCaptureItemMultiplier(captureItem);
        
        // Level difference (easier to capture lower level monsters)
        const playerLevel = this.gameState.player.level;
        const levelDifference = playerLevel - monster.level;
        const levelMultiplier = Math.max(0.5, 1 + (levelDifference * 0.05));
        
        // Player class bonuses
        const classMultiplier = this.getClassCaptureBonus(monster);
        
        // Final capture rate calculation
        let finalRate = baseRate * healthMultiplier * statusMultiplier *
                       itemMultiplier * levelMultiplier * classMultiplier;

        // Testing override: boost capture rates for easier testing
        if (window.TESTING_OVERRIDES?.easyCaptureMode) {
            const originalRate = finalRate;
            finalRate = Math.max(finalRate, 0.5); // Minimum 50% capture rate in testing mode
            if (finalRate > originalRate) {
                console.log(`🧪 Testing mode boosted capture rate: ${(originalRate * 100).toFixed(1)}% → ${(finalRate * 100).toFixed(1)}%`);
            }
        }

        // Cap at 95% to maintain some challenge
        finalRate = Math.min(0.95, Math.max(0.01, finalRate));
        
        return finalRate;
    }
    
    /**
     * Get status effect multiplier for capture rate
     */
    getStatusEffectMultiplier(monster) {
        let multiplier = 1.0;
        
        for (const effect of monster.statusEffects) {
            switch (effect.type) {
                case 'sleep':
                    multiplier *= 2.0;
                    break;
                case 'poison':
                    multiplier *= 1.5;
                    break;
                case 'burn':
                    multiplier *= 1.5;
                    break;
                case 'freeze':
                    multiplier *= 2.0;
                    break;
                case 'paralysis':
                    multiplier *= 1.5;
                    break;
                case 'stun':
                    multiplier *= 1.8;
                    break;
            }
        }
        
        return multiplier;
    }
    
    /**
     * Get capture item effectiveness multiplier
     */
    getCaptureItemMultiplier(captureItem) {
        const itemMultipliers = {
            'monster_ball': 1.0,          // Standard ball
            'great_ball': 1.5,            // Better than standard
            'ultra_ball': 2.0,            // High-end capture item
            'master_ball': 100.0,         // Always succeeds (if implemented)
            'net_ball': 1.0,              // Standard, but bonus for certain types
            'timer_ball': 1.0,            // Gets better over time in battle
            'quick_ball': 1.0,            // Bonus on first turn
            'dusk_ball': 1.0,             // Bonus in dark areas
            'heal_ball': 1.2,             // Heals captured monster
            'luxury_ball': 1.0,           // Increases friendship gain
            'friend_ball': 1.0,           // Sets friendship to 200 on capture
            'love_ball': 1.0,             // Bonus if opposite gender
            'heavy_ball': 1.0,            // Bonus for heavy monsters
            'fast_ball': 1.0,             // Bonus for fast monsters
            'level_ball': 1.0             // Bonus based on level difference
        };
        
        return itemMultipliers[captureItem] || 1.0;
    }
    
    /**
     * Get player class capture bonus
     */
    getClassCaptureBonus(monster) {
        const playerClass = this.gameState.player.class;
        if (!playerClass || !monster.speciesData) return 1.0;
        
        const classData = typeof CharacterData !== 'undefined' ? 
            CharacterData.getClass(playerClass) : null;
        
        if (!classData || !classData.monsterAffinities) return 1.0;
        
        // Check if monster type matches class affinity
        const monsterTypes = monster.speciesData.type || [];
        const classAffinities = classData.monsterAffinities || [];
        
        for (const affinity of classAffinities) {
            if (monsterTypes.includes(affinity)) {
                return 1.3; // 30% bonus for matching affinity
            }
        }
        
        return 1.0;
    }
    
    /**
     * Perform the actual capture attempt with shake mechanics
     */
    performCapture(monster, captureRate, captureItem) {
        const result = {
            success: false,
            shakes: 0,
            maxShakes: 3,
            captureRate: captureRate,
            breakoutReason: null,
            criticalCapture: false
        };
        
        // Check for critical capture (rare instant success)
        if (Math.random() < 0.02) { // 2% chance
            result.success = true;
            result.criticalCapture = true;
            result.shakes = result.maxShakes;
            return result;
        }
        
        // Simulate Pokeball shaking mechanism
        for (let shake = 1; shake <= result.maxShakes; shake++) {
            const shakeSuccess = Math.random() < captureRate;
            
            if (shakeSuccess) {
                result.shakes = shake;
                
                // If this is the final shake, capture succeeds
                if (shake === result.maxShakes) {
                    result.success = true;
                }
            } else {
                result.shakes = shake;
                result.breakoutReason = this.getBreakoutReason(shake, monster);
                break;
            }
        }
        
        return result;
    }
    
    /**
     * Get reason for breakout based on shake count
     */
    getBreakoutReason(shakes, monster) {
        const reasons = [
            'The monster broke free immediately!',
            'The ball wobbled once... but broke open!',
            'The ball wobbled twice... so close!',
            'Almost had it! The monster broke free at the last second!'
        ];
        
        return reasons[Math.min(shakes, reasons.length - 1)];
    }
    
    /**
     * Apply class-specific bonuses after capture attempt
     */
    applyClassBonuses(captureResult, monster) {
        const playerClass = this.gameState.player.class;
        
        switch (playerClass) {
            case 'ranger':
                // Rangers have better relationship with captured monsters
                if (captureResult.success) {
                    monster.friendship += 10; // Extra friendship bonus
                }
                break;
                
            case 'paladin':
                // Paladins can heal captured monsters
                if (captureResult.success) {
                    monster.fullHeal();
                }
                break;
                
            case 'rogue':
                // Rogues have better capture rates for rare monsters
                if (monster.speciesData && monster.speciesData.rarity === 'rare') {
                    captureResult.captureRate *= 1.2;
                }
                break;
        }
    }
    
    // ================================================
    // CAPTURE RESULT HANDLING
    // ================================================
    
    /**
     * Handle successful monster capture
     */
    handleSuccessfulCapture(wildMonster) {
        // Capture the monster
        const captureSuccess = wildMonster.capture(this.gameState.player.name);
        
        if (captureSuccess) {
            // Add to monster collection
            const monsterId = this.gameState.captureMonster(
                wildMonster.species,
                wildMonster.level,
                wildMonster.stats
            );
            
            // Set the monster ID
            wildMonster.id = monsterId;
            
            // Store the full monster instance
            const storedMonster = this.gameState.monsters.storage.find(m => m.id === monsterId);
            if (storedMonster) {
                // Copy over all the wild monster's properties
                Object.assign(storedMonster, {
                    individualValues: wildMonster.individualValues,
                    personality: wildMonster.personality,
                    abilities: wildMonster.abilities,
                    learnedMoves: wildMonster.learnedMoves,
                    friendship: wildMonster.friendship,
                    experience: wildMonster.experience,
                    experienceToNext: wildMonster.experienceToNext,
                    currentStats: wildMonster.currentStats
                });
            }
            
            // Show capture success message
            this.gameState.addNotification(
                `${wildMonster.getDisplayName()} was captured!`,
                'success'
            );
            
            // Check if this is a new species for the player
            this.checkNewSpeciesDiscovered(wildMonster.species);
            
            // Increase player experience for successful capture
            this.gameState.player.addExperience(wildMonster.level * 5);
            
            return true;
        }
        
        return false;
    }
    
    /**
     * Handle failed capture attempt
     */
    handleFailedCapture(wildMonster, captureResult) {
        // Show failure message
        this.gameState.addNotification(
            captureResult.breakoutReason || 'Capture failed!',
            'error'
        );
        
        // Monster might become more aggressive after failed capture
        if (Math.random() < 0.3) { // 30% chance
            wildMonster.applyStatusEffect('enraged', 3);
            this.gameState.addNotification(
                `${wildMonster.getDisplayName()} became enraged!`,
                'warning'
            );
        }
        
        // Slight friendship decrease if it was a previously captured monster
        if (!wildMonster.isWild) {
            wildMonster.decreaseFriendship(1);
        }
    }
    
    /**
     * Check if this is a new species for the player
     */
    checkNewSpeciesDiscovered(species) {
        const existingSpecies = new Set();
        
        // Check party monsters
        for (const monster of this.gameState.monsters.party) {
            existingSpecies.add(monster.species);
        }
        
        // Check storage monsters
        for (const monster of this.gameState.monsters.storage) {
            existingSpecies.add(monster.species);
        }
        
        if (!existingSpecies.has(species)) {
            // This is a new species!
            this.gameState.addNotification(
                `New species discovered: ${species}!`,
                'success'
            );
            
            // Bonus experience for discovery
            this.gameState.player.addExperience(25);
            
            // Add to pokedex/monster encyclopedia if implemented
            this.addToMonsterEncyclopedia(species);
        }
    }
    
    /**
     * Add species to monster encyclopedia
     */
    addToMonsterEncyclopedia(species) {
        // Initialize encyclopedia if it doesn't exist
        if (!this.gameState.encyclopedia) {
            this.gameState.encyclopedia = {
                discoveredSpecies: [],
                encounterCounts: {},
                captureCounts: {}
            };
        }
        
        if (!this.gameState.encyclopedia.discoveredSpecies.includes(species)) {
            this.gameState.encyclopedia.discoveredSpecies.push(species);
        }
        
        // Update capture count
        if (!this.gameState.encyclopedia.captureCounts[species]) {
            this.gameState.encyclopedia.captureCounts[species] = 0;
        }
        this.gameState.encyclopedia.captureCounts[species]++;
    }
    
    // ================================================
    // CAPTURE ITEMS AND TOOLS
    // ================================================
    
    /**
     * Get available capture items
     */
    getAvailableCaptureItems() {
        const captureItems = [
            'monster_ball', 'great_ball', 'ultra_ball', 'net_ball',
            'timer_ball', 'quick_ball', 'dusk_ball', 'heal_ball'
        ];
        
        const available = [];
        
        for (const item of captureItems) {
            const count = this.gameState.player.getItemCount(item);
            if (count > 0) {
                available.push({
                    id: item,
                    name: this.getItemDisplayName(item),
                    count: count,
                    effectiveness: this.getCaptureItemMultiplier(item)
                });
            }
        }
        
        return available;
    }
    
    /**
     * Get item display name
     */
    getItemDisplayName(itemId) {
        const names = {
            'monster_ball': 'Monster Ball',
            'great_ball': 'Great Ball',
            'ultra_ball': 'Ultra Ball',
            'master_ball': 'Master Ball',
            'net_ball': 'Net Ball',
            'timer_ball': 'Timer Ball',
            'quick_ball': 'Quick Ball',
            'dusk_ball': 'Dusk Ball',
            'heal_ball': 'Heal Ball',
            'luxury_ball': 'Luxury Ball'
        };
        
        return names[itemId] || itemId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    /**
     * Get capture rate preview without using items
     */
    previewCaptureRate(wildMonster, captureItem = 'monster_ball') {
        if (!wildMonster || !wildMonster.isWild) return 0;
        
        return this.calculateCaptureRate(wildMonster, captureItem);
    }
    
    /**
     * Get capture difficulty description
     */
    getCaptureDescription(captureRate) {
        if (captureRate >= 0.8) return { text: 'Very Easy', color: '#28a745' };
        if (captureRate >= 0.6) return { text: 'Easy', color: '#6cbf00' };
        if (captureRate >= 0.4) return { text: 'Moderate', color: '#ffc107' };
        if (captureRate >= 0.2) return { text: 'Hard', color: '#fd7e14' };
        if (captureRate >= 0.1) return { text: 'Very Hard', color: '#dc3545' };
        return { text: 'Extremely Hard', color: '#6f42c1' };
    }
    
    // ================================================
    // SPECIAL CAPTURE MECHANICS
    // ================================================
    
    /**
     * Use bait to make monster easier to capture (but less likely to stay)
     */
    useBait(monster) {
        if (!this.gameState.player.hasItem('monster_bait')) {
            return { success: false, message: 'No bait available' };
        }
        
        this.gameState.player.removeItem('monster_bait', 1);
        
        // Bait makes monster easier to capture but more likely to flee
        monster.captureRateModifier = (monster.captureRateModifier || 1.0) * 1.5;
        monster.fleeChance = (monster.fleeChance || 0.1) * 1.3;
        
        this.gameState.addNotification('Used bait! The monster looks interested.', 'info');
        
        return { success: true, message: 'Bait used successfully' };
    }
    
    /**
     * Use rock to weaken monster (makes it angry but easier to capture when weak)
     */
    useRock(monster) {
        if (!this.gameState.player.hasItem('rock')) {
            return { success: false, message: 'No rocks available' };
        }
        
        this.gameState.player.removeItem('rock', 1);
        
        // Rock deals small damage but makes monster angry
        const damage = Math.floor(monster.stats.hp * 0.1);
        monster.takeDamage(damage);
        monster.applyStatusEffect('angry', 5);
        
        this.gameState.addNotification(
            `Threw rock! ${monster.getDisplayName()} takes ${damage} damage and becomes angry!`,
            'warning'
        );
        
        return { success: true, damage: damage };
    }
    
    /**
     * Update capture statistics
     */
    updateCaptureStats(captureResult) {
        if (!this.gameState.stats.captureAttempts) {
            this.gameState.stats.captureAttempts = 0;
            this.gameState.stats.successfulCaptures = 0;
        }
        
        this.gameState.stats.captureAttempts++;
        
        if (captureResult.success) {
            this.gameState.stats.successfulCaptures++;
        }
    }
    
    /**
     * Get capture statistics
     */
    getCaptureStats() {
        const stats = this.gameState.stats;
        
        return {
            totalAttempts: stats.captureAttempts || 0,
            successfulCaptures: stats.successfulCaptures || 0,
            successRate: stats.captureAttempts ? 
                (stats.successfulCaptures / stats.captureAttempts * 100).toFixed(1) : 0,
            uniqueSpeciesCaptured: this.gameState.encyclopedia ? 
                this.gameState.encyclopedia.discoveredSpecies.length : 0
        };
    }
}

// Make available globally
window.MonsterCaptureSystem = MonsterCaptureSystem;