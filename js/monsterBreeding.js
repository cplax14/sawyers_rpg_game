/**
 * Monster Breeding System
 * Handles monster breeding, evolution, and genetic management
 */

class MonsterBreedingSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.breedingPairs = [];
        this.breedingCooldowns = new Map();
        this.breedingHistory = [];
        
        this.init();
    }
    
    /**
     * Initialize breeding system
     */
    init() {
        // Breeding facility settings
        this.settings = {
            maxBreedingPairs: 5,
            baseBreeingTime: 300, // 5 minutes
            cooldownTime: 900,    // 15 minutes
            eggHatchTime: 120,    // 2 minutes
            maxEggsHeld: 10
        };
        
        // Initialize egg storage
        if (!this.gameState.eggs) {
            this.gameState.eggs = [];
        }
        
        console.log('✅ Monster Breeding System initialized');
    }
    
    /**
     * Check if a monster is currently in breeding cooldown
     */
    isInBreedingCooldown(monsterId) {
        const expiresAt = this.breedingCooldowns.get(monsterId);
        if (!expiresAt) return false;
        return Date.now() < expiresAt;
    }
    
    // ================================================
    // BREEDING COMPATIBILITY
    // ================================================
    
    /**
     * Check if two monsters can breed together
     */
    canBreedTogether(monster1, monster2) {
        if (!monster1 || !monster2) return { canBreed: false, reason: 'Missing monsters' };
        
        // Can't breed with itself
        if (monster1.id === monster2.id) {
            return { canBreed: false, reason: 'Cannot breed with itself' };
        }
        
        // Both must be captured (not wild)
        if (monster1.isWild || monster2.isWild) {
            return { canBreed: false, reason: 'Wild monsters cannot breed' };
        }
        
        // Check if either is in cooldown
        if (this.isInBreedingCooldown(monster1.id) || this.isInBreedingCooldown(monster2.id)) {
            return { canBreed: false, reason: 'One or both monsters are tired from recent breeding' };
        }
        
        // Check species compatibility
        const compatibility = this.checkSpeciesCompatibility(monster1, monster2);
        if (!compatibility.compatible) {
            return { canBreed: false, reason: compatibility.reason };
        }
        
        // Enhanced level requirements based on rarity
        const minLevel1 = this.getMinBreedingLevel(monster1);
        const minLevel2 = this.getMinBreedingLevel(monster2);

        if (monster1.level < minLevel1 || monster2.level < minLevel2) {
            const maxMinLevel = Math.max(minLevel1, minLevel2);
            return { canBreed: false, reason: `Both monsters must be at least level ${maxMinLevel}` };
        }

        // Enhanced friendship requirements based on rarity
        const minFriendship1 = this.getMinBreedingFriendship(monster1);
        const minFriendship2 = this.getMinBreedingFriendship(monster2);

        if (monster1.friendship < minFriendship1 || monster2.friendship < minFriendship2) {
            const maxMinFriendship = Math.max(minFriendship1, minFriendship2);
            return { canBreed: false, reason: `Monsters need at least ${maxMinFriendship} friendship to breed` };
        }
        
        return { canBreed: true, reason: 'Compatible for breeding' };
    }
    
    /**
     * Check species-level breeding compatibility
     */
    checkSpeciesCompatibility(monster1, monster2) {
        // Use MonsterData to check breeding compatibility
        if (typeof MonsterData !== 'undefined') {
            const canBreed = MonsterData.canBreed(monster1.species, monster2.species);
            
            if (canBreed) {
                return { compatible: true, reason: 'Species are compatible' };
            } else {
                return { 
                    compatible: false, 
                    reason: 'These species are not compatible for breeding' 
                };
            }
        }
        
        // Fallback compatibility check based on types
        return this.checkTypeCompatibility(monster1, monster2);
    }
    
    /**
     * Check type-based compatibility (fallback)
     */
    checkTypeCompatibility(monster1, monster2) {
        const types1 = monster1.speciesData?.type || [];
        const types2 = monster2.speciesData?.type || [];
        
        // Same species can always breed
        if (monster1.species === monster2.species) {
            return { compatible: true, reason: 'Same species' };
        }
        
        // Check for shared types
        const sharedTypes = types1.filter(type => types2.includes(type));
        if (sharedTypes.length > 0) {
            return { 
                compatible: true, 
                reason: `Shared type: ${sharedTypes[0]}` 
            };
        }
        
        return {
            compatible: false,
            reason: 'No compatible types found'
        };
    }

    /**
     * Get minimum breeding level based on monster rarity
     */
    getMinBreedingLevel(monster) {
        const rarity = monster.speciesData?.rarity || 'common';
        switch (rarity) {
            case 'common': return 8;
            case 'uncommon': return 12;
            case 'rare': return 16;
            case 'epic': return 22;
            case 'legendary': return 30;
            default: return 10;
        }
    }

    /**
     * Get minimum breeding friendship based on monster rarity
     */
    getMinBreedingFriendship(monster) {
        const rarity = monster.speciesData?.rarity || 'common';
        switch (rarity) {
            case 'common': return 40;
            case 'uncommon': return 55;
            case 'rare': return 70;
            case 'epic': return 85;
            case 'legendary': return 95;
            default: return 50;
        }
    }

    /**
     * Calculate breeding success chance based on compatibility and stats
     */
    getBreedingSuccessChance(monster1, monster2) {
        let baseChance = 70; // Base 70% success rate

        // Level bonus: higher level monsters breed more successfully
        const avgLevel = (monster1.level + monster2.level) / 2;
        const levelBonus = Math.min(20, Math.floor(avgLevel / 5) * 2); // +2% per 5 avg levels, max +20%

        // Friendship bonus: higher friendship increases success
        const avgFriendship = (monster1.friendship + monster2.friendship) / 2;
        const friendshipBonus = Math.min(15, Math.floor(avgFriendship / 10)); // +1% per 10 avg friendship, max +15%

        // Species compatibility bonus
        let compatibilityBonus = 0;
        if (monster1.species === monster2.species) {
            compatibilityBonus = 10; // Same species breed easier
        } else if (this.shareTypes(monster1, monster2)) {
            compatibilityBonus = 5; // Shared types get small bonus
        }

        // Rarity penalty: rarer monsters are harder to breed
        const rarity1 = monster1.speciesData?.rarity || 'common';
        const rarity2 = monster2.speciesData?.rarity || 'common';
        const rarityPenalty = this.getRarityPenalty(rarity1) + this.getRarityPenalty(rarity2);

        const finalChance = Math.max(25, Math.min(95,
            baseChance + levelBonus + friendshipBonus + compatibilityBonus - rarityPenalty
        ));

        return finalChance;
    }

    /**
     * Get rarity penalty for breeding
     */
    getRarityPenalty(rarity) {
        switch (rarity) {
            case 'common': return 0;
            case 'uncommon': return 5;
            case 'rare': return 10;
            case 'epic': return 15;
            case 'legendary': return 20;
            default: return 0;
        }
    }

    /**
     * Check if two monsters share any types
     */
    shareTypes(monster1, monster2) {
        const types1 = monster1.speciesData?.type || [];
        const types2 = monster2.speciesData?.type || [];
        return types1.some(type => types2.includes(type));
    }
}

// Make available globally
window.MonsterBreedingSystem = MonsterBreedingSystem;