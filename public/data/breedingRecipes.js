/**
 * Breeding Recipes Data
 * Defines special breeding combinations, materials, and guaranteed outcomes
 */

const BreedingRecipeData = {
    // ================================================
    // COMMON RECIPES (Early-Mid Game)
    // ================================================
    recipes: {
        // Basic Slime Evolution
        slime_fusion: {
            id: "slime_fusion",
            name: "Slime Fusion",
            description: "Two slimes combine to create a King Slime with enhanced abilities.",
            parentSpecies1: "slime",
            parentSpecies2: "slime",
            materials: [
                { itemId: "slime_gel", quantity: 5, name: "Slime Gel" }
            ],
            offspringSpecies: "king_slime",
            guaranteedBonuses: {
                statMultiplier: 1.15,
                guaranteedAbilities: ["bounce", "heal", "gel_armor"]
            },
            hint: "Two of the same basic monster might create something greater..."
        },

        // Goblin Enhancement
        goblin_warrior: {
            id: "goblin_warrior",
            name: "Goblin Warrior Training",
            description: "Train two goblins with weapons to create a Goblin Warrior.",
            parentSpecies1: "goblin",
            parentSpecies2: "goblin",
            materials: [
                { itemId: "goblin_tooth", quantity: 8, name: "Goblin Tooth" },
                { itemId: "iron_ore", quantity: 3, name: "Iron Ore" }
            ],
            offspringSpecies: "goblin_warrior",
            guaranteedBonuses: {
                statMultiplier: 1.2,
                minRarity: "uncommon",
                guaranteedAbilities: ["dual_strike", "war_cry"]
            },
            hint: "Warriors need weapons to be forged..."
        },

        // Wolf Pack
        dire_wolf_breeding: {
            id: "dire_wolf_breeding",
            name: "Dire Wolf Pack",
            description: "Breed two wolves to create a powerful Dire Wolf.",
            parentSpecies1: "wolf",
            parentSpecies2: "wolf",
            materials: [
                { itemId: "wolf_fang", quantity: 4, name: "Wolf Fang" },
                { itemId: "wolf_pelt", quantity: 2, name: "Wolf Pelt" }
            ],
            offspringSpecies: "dire_wolf",
            guaranteedBonuses: {
                statMultiplier: 1.25,
                guaranteedAbilities: ["savage_bite", "pack_hunt", "intimidate"]
            },
            hint: "The pack grows stronger together..."
        },

        // Elemental Slime Variants
        magma_slime: {
            id: "magma_slime",
            name: "Magma Slime Creation",
            description: "Infuse a slime with fire essence to create a Magma Slime.",
            parentSpecies1: "slime",
            parentSpecies2: "fire_sprite",
            materials: [
                { itemId: "slime_gel", quantity: 5, name: "Slime Gel" },
                { itemId: "fire_essence", quantity: 3, name: "Fire Essence" }
            ],
            offspringSpecies: "magma_slime",
            guaranteedBonuses: {
                statMultiplier: 1.3,
                minRarity: "uncommon",
                guaranteedAbilities: ["lava_burst", "heat_aura"]
            },
            hint: "What happens when slime meets fire?"
        },

        crystal_slime: {
            id: "crystal_slime",
            name: "Crystal Slime Formation",
            description: "Combine slime with crystal energy for a defensive Crystal Slime.",
            parentSpecies1: "slime",
            parentSpecies2: "gem_slime",
            materials: [
                { itemId: "slime_gel", quantity: 5, name: "Slime Gel" },
                { itemId: "crystal_shard", quantity: 4, name: "Crystal Shard" }
            ],
            offspringSpecies: "crystal_slime",
            guaranteedBonuses: {
                statMultiplier: 1.25,
                minRarity: "uncommon",
                guaranteedAbilities: ["crystal_armor", "reflect"]
            },
            hint: "Crystalline structures form in the strangest places..."
        },

        // Beast Hybrids
        worg_creation: {
            id: "worg_creation",
            name: "Worg Breeding",
            description: "Cross a wolf with a goblin to create a fearsome Worg.",
            parentSpecies1: "wolf",
            parentSpecies2: "goblin",
            materials: [
                { itemId: "wolf_fang", quantity: 3, name: "Wolf Fang" },
                { itemId: "goblin_tooth", quantity: 6, name: "Goblin Tooth" }
            ],
            offspringSpecies: "worg",
            guaranteedBonuses: {
                statMultiplier: 1.2,
                minRarity: "uncommon",
                guaranteedAbilities: ["savage_bite", "cunning_strike"]
            },
            hint: "Beast and humanoid can create something unexpected..."
        },

        // Hobgoblin Evolution
        hobgoblin_ritual: {
            id: "hobgoblin_ritual",
            name: "Hobgoblin Ritual",
            description: "Enhance a goblin with an orc's strength to create a Hobgoblin.",
            parentSpecies1: "goblin",
            parentSpecies2: "orc",
            materials: [
                { itemId: "goblin_tooth", quantity: 10, name: "Goblin Tooth" },
                { itemId: "orc_tusk", quantity: 2, name: "Orc Tusk" },
                { itemId: "iron_ore", quantity: 5, name: "Iron Ore" }
            ],
            offspringSpecies: "hobgoblin",
            guaranteedBonuses: {
                statMultiplier: 1.35,
                minRarity: "rare",
                guaranteedAbilities: ["power_strike", "battle_tactics", "intimidate"]
            },
            unlockRequirements: {
                minPlayerLevel: 8
            },
            hint: "When goblin cunning meets orc strength..."
        },

        // Mountain Beast
        mountain_beast: {
            id: "mountain_beast",
            name: "Mountain Beast",
            description: "Breed mountain creatures to create an adapted Mountain Beast.",
            parentSpecies1: "mountain_goat",
            parentSpecies2: "rock_lizard",
            materials: [
                { itemId: "goat_horn", quantity: 4, name: "Goat Horn" },
                { itemId: "stone_scale", quantity: 6, name: "Stone Scale" }
            ],
            offspringSpecies: "mountain_beast",
            guaranteedBonuses: {
                statMultiplier: 1.3,
                minRarity: "uncommon",
                guaranteedAbilities: ["mountain_charge", "stone_skin", "sure_footed"]
            },
            hint: "Mountains breed hardy creatures..."
        },

        // Aerial Hunter
        aerial_predator: {
            id: "aerial_predator",
            name: "Aerial Predator",
            description: "Combine flying creatures to create a superior Aerial Predator.",
            parentSpecies1: "hawk",
            parentSpecies2: "bat",
            materials: [
                { itemId: "hawk_feather", quantity: 8, name: "Hawk Feather" },
                { itemId: "bat_wing", quantity: 4, name: "Bat Wing" }
            ],
            offspringSpecies: "aerial_predator",
            guaranteedBonuses: {
                statMultiplier: 1.25,
                minRarity: "uncommon",
                guaranteedAbilities: ["dive_attack", "sonic_screech", "keen_eye"]
            },
            hint: "The skies hold many predators..."
        },

        // Cave Dweller
        cave_lurker: {
            id: "cave_lurker",
            name: "Cave Lurker",
            description: "Breed cave-adapted monsters for a stealthy Cave Lurker.",
            parentSpecies1: "bat",
            parentSpecies2: "crystal_spider",
            materials: [
                { itemId: "bat_wing", quantity: 5, name: "Bat Wing" },
                { itemId: "crystal_silk", quantity: 8, name: "Crystal Silk" }
            ],
            offspringSpecies: "cave_lurker",
            guaranteedBonuses: {
                statMultiplier: 1.3,
                minRarity: "rare",
                guaranteedAbilities: ["web_trap", "echolocation", "darkness"]
            },
            unlockRequirements: {
                minPlayerLevel: 10
            },
            hint: "Darkness conceals many secrets..."
        },

        // Volcanic Beast
        lava_beast: {
            id: "lava_beast",
            name: "Lava Beast",
            description: "Fuse volcanic creatures to create a molten Lava Beast.",
            parentSpecies1: "salamander",
            parentSpecies2: "fire_bat",
            materials: [
                { itemId: "molten_scale", quantity: 6, name: "Molten Scale" },
                { itemId: "flame_wing", quantity: 4, name: "Flame Wing" },
                { itemId: "fire_crystal", quantity: 2, name: "Fire Crystal" }
            ],
            offspringSpecies: "lava_beast",
            guaranteedBonuses: {
                statMultiplier: 1.4,
                minRarity: "rare",
                guaranteedAbilities: ["lava_surge", "heat_shield", "molten_skin"]
            },
            unlockRequirements: {
                minPlayerLevel: 12
            },
            hint: "Where fire and earth meet, monsters are born..."
        },

        // Nature Guardian
        forest_guardian: {
            id: "forest_guardian",
            name: "Forest Guardian",
            description: "Combine nature sprites with beasts to create a Forest Guardian.",
            parentSpecies1: "nature_sprite",
            parentSpecies2: "treant",
            materials: [
                { itemId: "nature_essence", quantity: 10, name: "Nature Essence" },
                { itemId: "forest_crystal", quantity: 3, name: "Forest Crystal" },
                { itemId: "healing_herb", quantity: 15, name: "Healing Herb" }
            ],
            offspringSpecies: "forest_guardian",
            guaranteedBonuses: {
                statMultiplier: 1.45,
                minRarity: "rare",
                guaranteedAbilities: ["nature_magic", "forest_blessing", "summon_vines", "regeneration"]
            },
            unlockRequirements: {
                minPlayerLevel: 15,
                storyFlags: ["mystic_grove_discovered"]
            },
            hint: "The ancient forest protects its own..."
        },

        // =================================================
        // LEGENDARY RECIPES (Endgame)
        // =================================================

        // Dragon Evolution
        ancient_dragon: {
            id: "ancient_dragon",
            name: "Ancient Dragon Ascension",
            description: "Combine the most powerful dragons to create an Ancient Dragon.",
            parentSpecies1: "fire_drake",
            parentSpecies2: "wyvern",
            materials: [
                { itemId: "dragon_scale", quantity: 20, name: "Dragon Scale" },
                { itemId: "dragon_heart", quantity: 1, name: "Dragon Heart" },
                { itemId: "ancient_flame", quantity: 5, name: "Ancient Flame" },
                { itemId: "sky_gem", quantity: 3, name: "Sky Gem" }
            ],
            offspringSpecies: "ancient_dragon",
            guaranteedBonuses: {
                statMultiplier: 2.0,
                minRarity: "legendary",
                guaranteedAbilities: ["ancient_flame", "dragon_claw", "time_magic", "dominate"],
                generationBonus: 1
            },
            unlockRequirements: {
                minPlayerLevel: 35,
                storyFlags: ["dragon_peak_unlocked"],
                requiredCreatures: ["fire_drake", "wyvern"]
            },
            hint: "When dragons unite, legends are born..."
        },

        // Phoenix Creation
        phoenix_rebirth: {
            id: "phoenix_rebirth",
            name: "Phoenix Rebirth",
            description: "Perform the sacred ritual to create a Phoenix from fire and holy power.",
            parentSpecies1: "phoenix_chick",
            parentSpecies2: "fire_sprite",
            materials: [
                { itemId: "phoenix_feather", quantity: 10, name: "Phoenix Feather" },
                { itemId: "fire_gem", quantity: 5, name: "Fire Gem" },
                { itemId: "holy_crystal", quantity: 3, name: "Holy Crystal" },
                { itemId: "mana_essence", quantity: 20, name: "Mana Essence" }
            ],
            offspringSpecies: "phoenix",
            guaranteedBonuses: {
                statMultiplier: 1.8,
                minRarity: "legendary",
                guaranteedAbilities: ["phoenix_fire", "heal", "revive", "sacred_flame", "immortal_soul"],
                generationBonus: 1
            },
            unlockRequirements: {
                minPlayerLevel: 30,
                storyFlags: ["sacred_mountain_discovered"]
            },
            hint: "From ashes and flame, the Phoenix rises..."
        },

        // Titan Golem
        titan_golem: {
            id: "titan_golem",
            name: "Titan Golem Forging",
            description: "Forge the ultimate construct by combining ancient golems.",
            parentSpecies1: "guardian_golem",
            parentSpecies2: "lava_golem",
            materials: [
                { itemId: "ancient_core", quantity: 3, name: "Ancient Core" },
                { itemId: "molten_core", quantity: 5, name: "Molten Core" },
                { itemId: "mithril_ore", quantity: 10, name: "Mithril Ore" },
                { itemId: "crystal_essence", quantity: 15, name: "Crystal Essence" }
            ],
            offspringSpecies: "titan_golem",
            guaranteedBonuses: {
                statMultiplier: 1.9,
                minRarity: "legendary",
                guaranteedAbilities: ["titan_strike", "earthquake", "fortress_mode", "ancient_power"],
                generationBonus: 1
            },
            unlockRequirements: {
                minPlayerLevel: 38,
                storyFlags: ["ancient_ruins_completed"]
            },
            hint: "Ancient magic can forge the mightiest guardians..."
        },

        // Shadow Lich
        lich_transformation: {
            id: "lich_transformation",
            name: "Lich Transformation",
            description: "Perform the dark ritual to transform a spirit into a Lich.",
            parentSpecies1: "shadow_wraith",
            parentSpecies2: "ancient_spirit",
            materials: [
                { itemId: "soul_gem", quantity: 10, name: "Soul Gem" },
                { itemId: "time_relic", quantity: 2, name: "Time Relic" },
                { itemId: "dragon_essence", quantity: 8, name: "Dragon Essence" },
                { itemId: "shadow_crystal", quantity: 15, name: "Shadow Crystal" }
            ],
            offspringSpecies: "lich",
            guaranteedBonuses: {
                statMultiplier: 1.85,
                minRarity: "legendary",
                guaranteedAbilities: ["death_magic", "soul_drain", "immortality", "curse_mastery"],
                generationBonus: 1
            },
            unlockRequirements: {
                minPlayerLevel: 40,
                storyFlags: ["shadow_realm_unlocked"]
            },
            hint: "The darkest magic transforms death itself..."
        },

        // Celestial Dragon
        celestial_dragon: {
            id: "celestial_dragon",
            name: "Celestial Dragon Awakening",
            description: "Awaken the ultimate dragon by fusing Ancient Dragon with Phoenix.",
            parentSpecies1: "ancient_dragon",
            parentSpecies2: "phoenix",
            materials: [
                { itemId: "dragon_heart", quantity: 3, name: "Dragon Heart" },
                { itemId: "phoenix_feather", quantity: 20, name: "Phoenix Feather" },
                { itemId: "time_relic", quantity: 5, name: "Time Relic" },
                { itemId: "adamantine_crystal", quantity: 10, name: "Adamantine Crystal" },
                { itemId: "celestial_essence", quantity: 1, name: "Celestial Essence" }
            ],
            offspringSpecies: "celestial_dragon",
            guaranteedBonuses: {
                statMultiplier: 3.0,
                minRarity: "mythical",
                guaranteedAbilities: [
                    "celestial_flame",
                    "time_warp",
                    "divine_power",
                    "rebirth",
                    "cosmic_judgment"
                ],
                generationBonus: 2
            },
            unlockRequirements: {
                minPlayerLevel: 50,
                storyFlags: ["true_ending_unlocked"],
                requiredCreatures: ["ancient_dragon", "phoenix"]
            },
            hint: "When the mightiest powers unite, a god is born..."
        }
    },

    /**
     * Get recipe by ID
     */
    getRecipe: function(recipeId) {
        return this.recipes[recipeId] || null;
    },

    /**
     * Find matching recipe for two parents
     */
    findMatchingRecipe: function(species1, species2) {
        for (const recipeId in this.recipes) {
            const recipe = this.recipes[recipeId];

            // Check if species match in either order
            if ((recipe.parentSpecies1 === species1 && recipe.parentSpecies2 === species2) ||
                (recipe.parentSpecies1 === species2 && recipe.parentSpecies2 === species1)) {
                return recipe;
            }
        }
        return null;
    },

    /**
     * Get all recipes available to player
     */
    getAvailableRecipes: function(playerLevel, storyFlags = [], discoveredRecipes = []) {
        const available = [];

        for (const recipeId in this.recipes) {
            const recipe = this.recipes[recipeId];

            // Check unlock requirements
            if (recipe.unlockRequirements) {
                const req = recipe.unlockRequirements;

                if (req.minPlayerLevel && playerLevel < req.minPlayerLevel) {
                    continue;
                }

                if (req.storyFlags && !req.storyFlags.every(flag => storyFlags.includes(flag))) {
                    continue;
                }
            }

            available.push({
                ...recipe,
                discovered: discoveredRecipes.includes(recipeId)
            });
        }

        return available;
    },

    /**
     * Get recipes by rarity tier
     */
    getRecipesByTier: function(tier) {
        const tiers = {
            common: ['slime_fusion', 'goblin_warrior', 'dire_wolf_breeding'],
            uncommon: ['magma_slime', 'crystal_slime', 'worg_creation', 'mountain_beast', 'aerial_predator'],
            rare: ['hobgoblin_ritual', 'cave_lurker', 'lava_beast', 'forest_guardian'],
            legendary: ['ancient_dragon', 'phoenix_rebirth', 'titan_golem', 'lich_transformation'],
            mythical: ['celestial_dragon']
        };

        const recipeIds = tiers[tier] || [];
        return recipeIds.map(id => this.recipes[id]).filter(r => r);
    },

    /**
     * Check if player has materials for recipe
     */
    hasMaterials: function(recipe, playerMaterials) {
        if (!recipe.materials || recipe.materials.length === 0) {
            return true;
        }

        for (const material of recipe.materials) {
            const playerQty = playerMaterials[material.itemId] || 0;
            if (playerQty < material.quantity) {
                return false;
            }
        }

        return true;
    },

    /**
     * Get missing materials for recipe
     */
    getMissingMaterials: function(recipe, playerMaterials) {
        const missing = [];

        if (!recipe.materials) return missing;

        for (const material of recipe.materials) {
            const playerQty = playerMaterials[material.itemId] || 0;
            if (playerQty < material.quantity) {
                missing.push({
                    ...material,
                    have: playerQty,
                    need: material.quantity - playerQty
                });
            }
        }

        return missing;
    }
};

// Make available globally
window.BreedingRecipeData = BreedingRecipeData;
