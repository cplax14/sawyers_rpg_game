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
        
        // Check level requirements (both should be at least level 10)
        if (monster1.level < 10 || monster2.level < 10) {
            return { canBreed: false, reason: 'Both monsters must be at least level 10' };
        }
        
        // Check friendship requirements (at least 50 friendship each)
        if (monster1.friendship < 50 || monster2.friendship < 50) {
            return { canBreed: false, reason: 'Monsters need higher friendship to breed' };
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
}

// Make available globally
window.MonsterBreedingSystem = MonsterBreedingSystem;