/**
 * World Areas Data
 * Defines all explorable areas, their connections, and encounter tables
 */

const AreaData = {
    areas: {
        starting_village: {
            name: "Peaceful Village",
            description: "A quiet village where your adventure begins. Safe from monsters.",
            type: "town",
            unlocked: true, // Always available
            unlockRequirements: {},
            encounterRate: 0,
            monsters: [],
            connections: ["forest_path"],
            storyEvents: ["game_start", "tutorial_complete"],
            services: ["shop", "inn", "save_point"],
            backgroundMusic: "village_theme"
        },
        
        forest_path: {
            name: "Forest Path",
            description: "A winding path through peaceful woods. Perfect for beginners.",
            type: "wilderness",
            unlocked: false,
            unlockRequirements: { story: "tutorial_complete" },
            encounterRate: 30,
            monsters: ["slime", "goblin"],
            // Optional weighted spawn table overrides generic MonsterData tables
            spawnTable: [
                { species: "slime", weight: 70 },
                { species: "goblin", weight: 30 }
            ],
            connections: ["starting_village", "deep_forest", "plains"],
            storyEvents: ["first_monster_encounter"],
            services: [],
            backgroundMusic: "forest_theme"
        },
        
        deep_forest: {
            name: "Deep Forest",
            description: "Ancient woods where stronger creatures dwell.",
            type: "wilderness",
            unlocked: false,
            unlockRequirements: { story: "forest_path_cleared", level: 5 },
            encounterRate: 45,
            monsters: ["goblin", "wolf", "orc", "slime"],
            spawnTable: [
                { species: "wolf", weight: 40 },
                { species: "goblin", weight: 25 },
                { species: "orc", weight: 25 },
                { species: "slime", weight: 10 }
            ],
            connections: ["forest_path", "wolf_den", "mystic_grove"],
            storyEvents: ["pack_encounter", "ancient_tree"],
            services: [],
            backgroundMusic: "deep_forest_theme"
        },
        
        wolf_den: {
            name: "Wolf Den",
            description: "A cave system home to a pack of wolves.",
            type: "dungeon",
            unlocked: false,
            unlockRequirements: { story: "pack_encounter", item: "wolf_tracker" },
            encounterRate: 70,
            monsters: ["wolf", "dire_wolf", "alpha_wolf"],
            spawnTable: [
                { species: "wolf", weight: 60 },
                { species: "dire_wolf", weight: 30 },
                { species: "alpha_wolf", weight: 10 }
            ],
            connections: ["deep_forest"],
            storyEvents: ["alpha_challenge", "pack_leader_defeated"],
            services: [],
            backgroundMusic: "cave_theme",
            boss: {
                name: "Alpha Wolf",
                species: "alpha_wolf",
                level: 15,
                reward: { exp: 500, gold: 200, items: ["wolf_fang", "leather_armor"] }
            }
        },
        
        plains: {
            name: "Grassy Plains",
            description: "Wide open grasslands under the blue sky.",
            type: "wilderness",
            unlocked: false,
            unlockRequirements: { story: "first_monster_encounter" },
            encounterRate: 25,
            monsters: ["slime", "goblin", "wild_horse", "hawk"],
            spawnTable: [
                { species: "wild_horse", weight: 40 },
                { species: "hawk", weight: 30 },
                { species: "slime", weight: 20 },
                { species: "goblin", weight: 10 }
            ],
            connections: ["forest_path", "mountain_base", "river_crossing"],
            storyEvents: ["merchant_encounter", "wild_horse_race"],
            services: ["traveling_merchant"],
            backgroundMusic: "plains_theme"
        },
        
        mountain_base: {
            name: "Mountain Base",
            description: "Rocky foothills leading to treacherous peaks.",
            type: "wilderness",
            unlocked: false,
            unlockRequirements: { story: "plains_explored", level: 8 },
            encounterRate: 50,
            monsters: ["goblin", "orc", "mountain_goat", "rock_lizard"],
            spawnTable: [
                { species: "mountain_goat", weight: 35 },
                { species: "rock_lizard", weight: 30 },
                { species: "orc", weight: 25 },
                { species: "goblin", weight: 10 }
            ],
            connections: ["plains", "mountain_peak", "cave_entrance"],
            storyEvents: ["rockslide", "mountain_guide"],
            services: [],
            backgroundMusic: "mountain_theme"
        },
        
        cave_entrance: {
            name: "Crystal Caves",
            description: "Mysterious caves filled with glowing crystals.",
            type: "dungeon",
            unlocked: false,
            unlockRequirements: { story: "mountain_guide", item: "torch" },
            encounterRate: 60,
            monsters: ["bat", "crystal_spider", "cave_troll", "gem_slime"],
            spawnTable: [
                { species: "bat", weight: 40 },
                { species: "crystal_spider", weight: 30 },
                { species: "gem_slime", weight: 20 },
                { species: "cave_troll", weight: 10 }
            ],
            connections: ["mountain_base", "underground_lake"],
            storyEvents: ["crystal_discovery", "cave_collapse"],
            services: [],
            backgroundMusic: "cave_theme"
        },
        
        volcanic_region: {
            name: "Volcanic Region",
            description: "A land of fire and molten rock. Extremely dangerous.",
            type: "wilderness",
            unlocked: false,
            unlockRequirements: { story: "fire_resistance_obtained", level: 20 },
            encounterRate: 80,
            monsters: ["fire_sprite", "lava_golem", "fire_bat", "salamander"],
            spawnTable: [
                { species: "fire_sprite", weight: 40 },
                { species: "fire_bat", weight: 30 },
                { species: "salamander", weight: 20 },
                { species: "lava_golem", weight: 10 }
            ],
            connections: ["mountain_peak", "dragon_peak"],
            storyEvents: ["volcanic_eruption", "fire_temple_found"],
            services: [],
            backgroundMusic: "volcano_theme"
        },
        
        dragon_peak: {
            name: "Dragon's Peak",
            description: "The highest mountain, where legends say dragons nest.",
            type: "dungeon",
            unlocked: false,
            unlockRequirements: { 
                story: "fire_temple_cleared", 
                level: 25,
                item: "dragon_scale"
            },
            encounterRate: 90,
            monsters: ["dragon_whelp", "wyvern", "fire_drake"],
            spawnTable: [
                { species: "dragon_whelp", weight: 50 },
                { species: "wyvern", weight: 30 },
                { species: "fire_drake", weight: 20 }
            ],
            connections: ["volcanic_region"],
            storyEvents: ["dragon_encounter", "ancient_hoard"],
            services: [],
            backgroundMusic: "dragon_theme",
            boss: {
                name: "Ancient Red Dragon",
                species: "ancient_dragon",
                level: 35,
                reward: { 
                    exp: 2000, 
                    gold: 1000, 
                    items: ["dragon_sword", "fire_immunity_ring", "ancient_treasure"] 
                }
            }
        },
        
        mystic_grove: {
            name: "Mystic Grove",
            description: "A magical place where nature spirits gather.",
            type: "special",
            unlocked: false,
            unlockRequirements: { 
                story: "nature_blessing", 
                character_class: ["ranger", "druid"] 
            },
            encounterRate: 20,
            monsters: ["nature_sprite", "unicorn", "treant", "fairy"],
            spawnTable: [
                { species: "nature_sprite", weight: 40 },
                { species: "fairy", weight: 35 },
                { species: "unicorn", weight: 15 },
                { species: "treant", weight: 10 }
            ],
            connections: ["deep_forest"],
            storyEvents: ["spirit_council", "nature_trial"],
            services: ["healing_spring", "monster_sanctuary"],
            backgroundMusic: "mystic_theme"
        },
        
        ancient_ruins: {
            name: "Ancient Ruins",
            description: "Mysterious structures from a forgotten civilization.",
            type: "dungeon",
            unlocked: false,
            unlockRequirements: { 
                story: "all_temples_cleared", 
                level: 30,
                item: "ancient_key" 
            },
            encounterRate: 70,
            monsters: ["guardian_golem", "shadow_wraith", "ancient_spirit"],
            spawnTable: [
                { species: "guardian_golem", weight: 50 },
                { species: "shadow_wraith", weight: 30 },
                { species: "ancient_spirit", weight: 20 }
            ],
            connections: ["mystic_grove", "dragon_peak"],
            storyEvents: ["final_trial", "truth_revealed"],
            services: [],
            backgroundMusic: "ruins_theme",
            boss: {
                name: "The Ancient Guardian",
                species: "guardian_titan",
                level: 40,
                reward: { 
                    exp: 5000, 
                    gold: 2000, 
                    items: ["legendary_weapon", "master_crystal"] 
                }
            }
        }
    },
    
    // Story progression flags
    storyFlags: [
        "game_start",
        "tutorial_complete", 
        "first_monster_encounter",
        "forest_path_cleared",
        "pack_encounter",
        "plains_explored",
        "mountain_guide",
        "fire_resistance_obtained",
        "fire_temple_cleared",
        "nature_blessing",
        "all_temples_cleared"
    ],
    
    /**
     * Get area data by name
     */
    getArea: function(areaName) {
        return this.areas[areaName] || null;
    },
    
    /**
     * Get all unlocked areas
     */
    getUnlockedAreas: function(storyProgress, playerLevel, inventory, playerClass = null) {
        return Object.keys(this.areas).filter(areaName => {
            return this.isAreaUnlocked(areaName, storyProgress, playerLevel, inventory, playerClass);
        });
    },
    
    /**
     * Check if an area is unlocked
     */
    isAreaUnlocked: function(areaName, storyProgress, playerLevel, inventory, playerClass = null) {
        const area = this.getArea(areaName);
        if (!area) return false;
        
        if (area.unlocked) return true;
        
        const requirements = area.unlockRequirements;
        
        // Check story requirements
        if (requirements.story && !storyProgress.includes(requirements.story)) {
            return false;
        }
        
        // Check level requirements
        if (requirements.level && playerLevel < requirements.level) {
            return false;
        }
        
        // Check item requirements
        if (requirements.item && !inventory.includes(requirements.item)) {
            return false;
        }
        
        // Check character class requirements
        if (requirements.character_class && 
            !requirements.character_class.includes(playerClass)) {
            return false;
        }
        
        return true;
    },
    
    /**
     * Get connected areas from current area
     */
    getConnectedAreas: function(currentArea) {
        const area = this.getArea(currentArea);
        return area ? area.connections : [];
    },
    
    /**
     * Get available services in an area
     */
    getAreaServices: function(areaName) {
        const area = this.getArea(areaName);
        return area ? area.services : [];
    },
    
    /**
     * Get encounter rate for an area
     */
    getEncounterRate: function(areaName) {
        const area = this.getArea(areaName);
        return area ? area.encounterRate : 0;
    },
    
    /**
     * Get monsters available in an area
     */
    getAreaMonsters: function(areaName) {
        const area = this.getArea(areaName);
        return area ? area.monsters : [];
    },
    
    /**
     * Get boss information for dungeon areas
     */
    getAreaBoss: function(areaName) {
        const area = this.getArea(areaName);
        return area && area.boss ? area.boss : null;
    },
    
    /**
     * Get story events that can trigger in an area
     */
    getAreaStoryEvents: function(areaName) {
        const area = this.getArea(areaName);
        return area ? area.storyEvents : [];
    },
    
    /**
     * Generate a random encounter in an area
     */
    generateRandomEncounter: function(areaName, playerLevel) {
        const area = this.getArea(areaName);
        if (!area || area.encounterRate === 0) return null;
        
        // Check if encounter should occur
        if (Math.random() * 100 > area.encounterRate) return null;
        
        const monsters = area.monsters;
        if (monsters.length === 0) return null;
        
        // Prefer local weighted spawn table if present
        if (Array.isArray(area.spawnTable) && area.spawnTable.length > 0) {
            const species = this.chooseWeighted(area.spawnTable);
            // Level near player level
            const variance = Math.floor(Math.random() * 5) - 2; // -2..+2
            const level = Math.max(1, (playerLevel || 1) + variance);
            return { species, level };
        }
        
        // Fallback to MonsterData
        if (typeof MonsterData !== 'undefined') {
            return MonsterData.generateEncounter(areaName, playerLevel);
        }
        
        // Final fallback: uniform random from area.monsters
        const idx = Math.floor(Math.random() * monsters.length);
        const species = monsters[idx];
        const variance = Math.floor(Math.random() * 5) - 2;
        const level = Math.max(1, (playerLevel || 1) + variance);
        return { species, level };
    },

    /** Weighted choice from a spawn table [{species, weight}] */
    chooseWeighted: function(table) {
        const total = table.reduce((s, e) => s + (e.weight || 0), 0) || 1;
        let roll = Math.random() * total;
        for (const entry of table) {
            roll -= (entry.weight || 0);
            if (roll <= 0) return entry.species;
        }
        return table[0]?.species || null;
    },
    
    /**
     * Get progression path suggestions
     */
    getProgressionSuggestions: function(playerLevel, storyProgress) {
        const suggestions = [];
        
        if (playerLevel < 5) {
            suggestions.push("Explore Forest Path to gain experience");
        } else if (playerLevel < 10) {
            suggestions.push("Try the Deep Forest for stronger monsters");
        } else if (playerLevel < 20) {
            suggestions.push("Challenge the Wolf Den or explore the Plains");
        } else {
            suggestions.push("You're ready for the Mountain regions");
        }
        
        return suggestions;
    },
    
    /**
     * Get all areas of a specific type
     */
    getAreasByType: function(type) {
        return Object.keys(this.areas).filter(areaName => 
            this.areas[areaName].type === type
        );
    }
};

// Make available globally
window.AreaData = AreaData;