/**
 * Monster Species Data
 * Defines all monster types, their stats, abilities, and evolution paths
 */

const MonsterData = {
    species: {
        // Basic Forest Monsters
        slime: {
            name: "Slime",
            type: ["water", "basic"],
            rarity: "common",
            baseStats: {
                hp: 40,
                mp: 20,
                attack: 30,
                defense: 25,
                magicAttack: 35,
                magicDefense: 40,
                speed: 45,
                accuracy: 70
            },
            statGrowth: {
                hp: 3, mp: 2, attack: 2, defense: 2,
                magicAttack: 3, magicDefense: 3, speed: 3, accuracy: 2
            },
            abilities: ["bounce", "heal"],
            captureRate: 85,
            evolutionLevel: 15,
            evolvesTo: ["king_slime"],
            evolutionItems: [],
            breedsWith: ["slime", "goblin"],
            areas: ["forest", "plains"]
        },
        
        goblin: {
            name: "Goblin",
            type: ["earth", "humanoid"],
            rarity: "common",
            baseStats: {
                hp: 50, mp: 15, attack: 45, defense: 35,
                magicAttack: 25, magicDefense: 30, speed: 60, accuracy: 75
            },
            statGrowth: {
                hp: 4, mp: 1, attack: 4, defense: 3,
                magicAttack: 2, magicDefense: 2, speed: 4, accuracy: 3
            },
            abilities: ["scratch", "throw_rock"],
            captureRate: 75,
            evolutionLevel: 18,
            evolvesTo: ["hobgoblin"],
            evolutionItems: [],
            breedsWith: ["goblin", "orc", "slime"],
            areas: ["forest", "cave", "mountains"]
        },
        
        wolf: {
            name: "Wolf",
            type: ["beast", "nature"],
            rarity: "common",
            baseStats: {
                hp: 65, mp: 25, attack: 55, defense: 40,
                magicAttack: 30, magicDefense: 35, speed: 85, accuracy: 80
            },
            statGrowth: {
                hp: 5, mp: 2, attack: 5, defense: 3,
                magicAttack: 2, magicDefense: 3, speed: 6, accuracy: 4
            },
            abilities: ["bite", "howl", "pack_hunt"],
            captureRate: 60,
            evolutionLevel: 20,
            evolvesTo: ["dire_wolf"],
            evolutionItems: [],
            breedsWith: ["wolf", "bear", "fox"],
            areas: ["forest", "mountains", "plains"]
        },
        
        // Intermediate Monsters
        orc: {
            name: "Orc",
            type: ["earth", "humanoid", "aggressive"],
            rarity: "uncommon",
            baseStats: {
                hp: 80, mp: 20, attack: 70, defense: 60,
                magicAttack: 25, magicDefense: 40, speed: 50, accuracy: 70
            },
            statGrowth: {
                hp: 6, mp: 1, attack: 6, defense: 5,
                magicAttack: 2, magicDefense: 3, speed: 3, accuracy: 3
            },
            abilities: ["club_smash", "roar", "intimidate"],
            captureRate: 45,
            evolutionLevel: 25,
            evolvesTo: ["orc_warrior"],
            evolutionItems: [],
            breedsWith: ["orc", "goblin", "troll"],
            areas: ["mountains", "cave", "wasteland"]
        },
        
        fire_sprite: {
            name: "Fire Sprite",
            type: ["fire", "magical", "elemental"],
            rarity: "uncommon",
            baseStats: {
                hp: 45, mp: 60, attack: 40, defense: 30,
                magicAttack: 75, magicDefense: 65, speed: 90, accuracy: 85
            },
            statGrowth: {
                hp: 3, mp: 5, attack: 3, defense: 2,
                magicAttack: 6, magicDefense: 5, speed: 6, accuracy: 4
            },
            abilities: ["fireball", "flame_burst", "fire_shield"],
            captureRate: 35,
            evolutionLevel: 30,
            evolvesTo: ["fire_elemental"],
            evolutionItems: ["fire_gem"],
            breedsWith: ["ice_sprite", "thunder_sprite"],
            areas: ["volcano", "desert", "fire_cave"]
        },
        
        // Rare Monsters
        dragon_whelp: {
            name: "Dragon Whelp",
            type: ["dragon", "fire", "flying"],
            rarity: "rare",
            baseStats: {
                hp: 90, mp: 70, attack: 85, defense: 75,
                magicAttack: 80, magicDefense: 80, speed: 75, accuracy: 85
            },
            statGrowth: {
                hp: 7, mp: 6, attack: 7, defense: 6,
                magicAttack: 7, magicDefense: 6, speed: 5, accuracy: 4
            },
            abilities: ["dragon_breath", "claw_attack", "fly", "roar"],
            captureRate: 15,
            evolutionLevel: 35,
            evolvesTo: ["young_dragon"],
            evolutionItems: ["dragon_scale"],
            breedsWith: ["dragon_whelp", "wyvern"],
            areas: ["dragon_peak", "ancient_ruins"]
        },
        
        // Legendary Monsters
        phoenix_chick: {
            name: "Phoenix Chick",
            type: ["fire", "holy", "flying", "legendary"],
            rarity: "legendary",
            baseStats: {
                hp: 70, mp: 100, attack: 60, defense: 50,
                magicAttack: 95, magicDefense: 90, speed: 95, accuracy: 90
            },
            statGrowth: {
                hp: 6, mp: 8, attack: 5, defense: 4,
                magicAttack: 8, magicDefense: 7, speed: 7, accuracy: 5
            },
            abilities: ["phoenix_fire", "heal", "revive", "sacred_flame"],
            captureRate: 5,
            evolutionLevel: 50,
            evolvesTo: ["phoenix"],
            evolutionItems: ["phoenix_feather", "fire_gem", "holy_crystal"],
            breedsWith: ["phoenix_chick"],
            areas: ["sacred_mountain", "temple_ruins"]
        }
    },
    
    // Evolution chains
    evolutionChains: {
        slime_line: ["slime", "king_slime", "slime_emperor"],
        goblin_line: ["goblin", "hobgoblin", "goblin_king"],
        wolf_line: ["wolf", "dire_wolf", "alpha_wolf"],
        dragon_line: ["dragon_whelp", "young_dragon", "ancient_dragon"],
        elemental_line: ["fire_sprite", "fire_elemental", "fire_lord"]
    },
    
    // Breeding compatibility matrix
    breedingGroups: {
        humanoid: ["goblin", "orc", "hobgoblin"],
        beast: ["wolf", "bear", "fox", "dire_wolf"],
        elemental: ["fire_sprite", "ice_sprite", "thunder_sprite"],
        magical: ["fire_sprite", "phoenix_chick", "unicorn"],
        dragon: ["dragon_whelp", "young_dragon", "wyvern"]
    },
    
    /**
     * Get monster species data by name
     */
    getSpecies: function(speciesName) {
        return this.species[speciesName] || null;
    },
    
    /**
     * Get all species names by rarity
     */
    getSpeciesByRarity: function(rarity) {
        return Object.keys(this.species).filter(name => 
            this.species[name].rarity === rarity
        );
    },
    
    /**
     * Get monsters by type
     */
    getSpeciesByType: function(type) {
        return Object.keys(this.species).filter(name => 
            this.species[name].type.includes(type)
        );
    },
    
    /**
     * Get monsters available in an area
     */
    getSpeciesInArea: function(area) {
        return Object.keys(this.species).filter(name => 
            this.species[name].areas.includes(area)
        );
    },
    
    /**
     * Calculate monster stats at level
     */
    getStatsAtLevel: function(speciesName, level) {
        const species = this.getSpecies(speciesName);
        if (!species) return null;
        
        const stats = { ...species.baseStats };
        const growth = species.statGrowth;
        
        const levelsToGrow = level - 1;
        for (const stat in growth) {
            stats[stat] += growth[stat] * levelsToGrow;
        }
        
        return stats;
    },
    
    /**
     * Check if two monsters can breed
     */
    canBreed: function(species1, species2) {
        const monster1 = this.getSpecies(species1);
        const monster2 = this.getSpecies(species2);
        
        if (!monster1 || !monster2) return false;
        
        return monster1.breedsWith.includes(species2) || 
               monster2.breedsWith.includes(species1);
    },
    
    /**
     * Get possible breeding outcomes
     */
    getBreedingOutcomes: function(species1, species2) {
        if (!this.canBreed(species1, species2)) return [];
        
        const outcomes = [];
        
        // Can produce either parent species
        outcomes.push({ species: species1, chance: 35 });
        outcomes.push({ species: species2, chance: 35 });
        
        // Check for special combinations
        const combinations = this.getSpecialBreedingCombinations();
        const combo = combinations[`${species1}+${species2}`] || 
                     combinations[`${species2}+${species1}`];
        
        if (combo) {
            outcomes.push({ species: combo.result, chance: combo.chance });
        }
        
        return outcomes;
    },
    
    /**
     * Special breeding combinations
     */
    getSpecialBreedingCombinations: function() {
        return {
            "fire_sprite+ice_sprite": { result: "steam_elemental", chance: 15 },
            "dragon_whelp+phoenix_chick": { result: "solar_dragon", chance: 5 },
            "wolf+goblin": { result: "worg", chance: 20 },
            "slime+fire_sprite": { result: "magma_slime", chance: 25 }
        };
    },
    
    /**
     * Get evolution requirements
     */
    getEvolutionRequirements: function(speciesName) {
        const species = this.getSpecies(speciesName);
        if (!species || !species.evolvesTo.length) return null;
        
        return {
            level: species.evolutionLevel,
            items: species.evolutionItems,
            possibleEvolutions: species.evolvesTo
        };
    },
    
    /**
     * Generate random encounter for area
     */
    generateEncounter: function(area, playerLevel) {
        const availableSpecies = this.getSpeciesInArea(area);
        if (availableSpecies.length === 0) return null;
        
        // Weight by rarity and level appropriateness
        const weightedSpecies = availableSpecies.map(species => {
            const data = this.getSpecies(species);
            let weight = 100;
            
            // Adjust weight by rarity
            switch (data.rarity) {
                case 'common': weight *= 3; break;
                case 'uncommon': weight *= 2; break;
                case 'rare': weight *= 0.5; break;
                case 'legendary': weight *= 0.1; break;
            }
            
            return { species, weight };
        });
        
        // Select random species based on weights
        const totalWeight = weightedSpecies.reduce((sum, s) => sum + s.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const entry of weightedSpecies) {
            random -= entry.weight;
            if (random <= 0) {
                // Generate level close to player level
                const level = Math.max(1, playerLevel + Math.floor(Math.random() * 6) - 3);
                return {
                    species: entry.species,
                    level: level,
                    stats: this.getStatsAtLevel(entry.species, level)
                };
            }
        }
        
        return null;
    }
};

// Make available globally
window.MonsterData = MonsterData;