/**
 * Breeding Materials Data
 * Defines special materials used in breeding recipes
 */

const BreedingMaterialData = {
    // ================================================
    // COMMON MATERIALS (Early Game)
    // ================================================
    materials: {
        // Slime Materials
        slime_gel: {
            id: "slime_gel",
            name: "Slime Gel",
            description: "Viscous gel from slimes. Essential for slime breeding.",
            rarity: "common",
            dropRate: 50,
            icon: "🫧",
            value: 8,
            droppedBy: ["slime", "king_slime"],
            stackLimit: 99
        },

        // Goblin Materials
        goblin_tooth: {
            id: "goblin_tooth",
            name: "Goblin Tooth",
            description: "Sharp tooth from a goblin. Used in warrior breeding.",
            rarity: "common",
            dropRate: 35,
            icon: "🦷",
            value: 12,
            droppedBy: ["goblin", "hobgoblin"],
            stackLimit: 99
        },

        // Wolf Materials
        wolf_fang: {
            id: "wolf_fang",
            name: "Wolf Fang",
            description: "Curved fang from a wolf. Prized for beast breeding.",
            rarity: "uncommon",
            dropRate: 40,
            icon: "🔪",
            value: 25,
            droppedBy: ["wolf", "dire_wolf"],
            stackLimit: 50
        },

        wolf_pelt: {
            id: "wolf_pelt",
            name: "Wolf Pelt",
            description: "Thick fur from a wolf. Used in beast enhancement.",
            rarity: "uncommon",
            dropRate: 30,
            icon: "🧥",
            value: 30,
            droppedBy: ["wolf", "dire_wolf", "alpha_wolf"],
            stackLimit: 50
        },

        // General Monster Parts
        leather_scraps: {
            id: "leather_scraps",
            name: "Leather Scraps",
            description: "Pieces of leather from various creatures.",
            rarity: "common",
            dropRate: 45,
            icon: "🟤",
            value: 8,
            droppedBy: ["goblin", "orc", "wild_horse"],
            stackLimit: 99
        },

        // Bird/Flying Materials
        hawk_feather: {
            id: "hawk_feather",
            name: "Hawk Feather",
            description: "Light feather from a hawk. Used in aerial breeding.",
            rarity: "common",
            dropRate: 45,
            icon: "🪶",
            value: 10,
            droppedBy: ["hawk", "eagle"],
            stackLimit: 99
        },

        sharp_talon: {
            id: "sharp_talon",
            name: "Sharp Talon",
            description: "Razor-sharp talon from a bird of prey.",
            rarity: "uncommon",
            dropRate: 35,
            icon: "🦅",
            value: 22,
            droppedBy: ["hawk", "eagle"],
            stackLimit: 50
        },

        // Cave Materials
        bat_wing: {
            id: "bat_wing",
            name: "Bat Wing",
            description: "Leathery wing from a bat. Used in cave breeding.",
            rarity: "common",
            dropRate: 40,
            icon: "🦇",
            value: 15,
            droppedBy: ["bat", "vampire_bat", "fire_bat"],
            stackLimit: 99
        },

        echo_essence: {
            id: "echo_essence",
            name: "Echo Essence",
            description: "Crystallized sound energy from bats.",
            rarity: "uncommon",
            dropRate: 30,
            icon: "🔊",
            value: 28,
            droppedBy: ["bat", "vampire_bat"],
            stackLimit: 50
        },

        // Mountain Materials
        goat_horn: {
            id: "goat_horn",
            name: "Goat Horn",
            description: "Sturdy horn from a mountain goat.",
            rarity: "common",
            dropRate: 40,
            icon: "🐏",
            value: 18,
            droppedBy: ["mountain_goat", "bighorn"],
            stackLimit: 99
        },

        stone_scale: {
            id: "stone_scale",
            name: "Stone Scale",
            description: "Hardened scale from a rock lizard.",
            rarity: "uncommon",
            dropRate: 45,
            icon: "🪨",
            value: 35,
            droppedBy: ["rock_lizard", "stone_dragon"],
            stackLimit: 50
        },

        // ================================================
        // UNCOMMON MATERIALS (Mid Game)
        // ================================================

        // Orc Materials
        orc_tusk: {
            id: "orc_tusk",
            name: "Orc Tusk",
            description: "Massive tusk from an orc. Used for powerful breeding.",
            rarity: "rare",
            dropRate: 35,
            icon: "🦏",
            value: 60,
            droppedBy: ["orc", "orc_warrior"],
            stackLimit: 30
        },

        // Elemental Materials
        fire_essence: {
            id: "fire_essence",
            name: "Fire Essence",
            description: "Concentrated fire energy. Essential for fire breeding.",
            rarity: "uncommon",
            dropRate: 40,
            icon: "🔥",
            value: 45,
            droppedBy: ["fire_sprite", "fire_bat", "salamander"],
            stackLimit: 50
        },

        flame_wing: {
            id: "flame_wing",
            name: "Flame Wing",
            description: "Burning wing from a fire bat.",
            rarity: "uncommon",
            dropRate: 48,
            icon: "🔥",
            value: 50,
            droppedBy: ["fire_bat", "inferno_bat"],
            stackLimit: 50
        },

        ice_essence: {
            id: "ice_essence",
            name: "Ice Essence",
            description: "Frozen magical energy. Used in ice breeding.",
            rarity: "uncommon",
            dropRate: 40,
            icon: "❄️",
            value: 45,
            droppedBy: ["ice_sprite", "frost_elemental"],
            stackLimit: 50
        },

        // Crystal Materials
        crystal_shard: {
            id: "crystal_shard",
            name: "Crystal Shard",
            description: "Magical crystal fragment. Used in crystal breeding.",
            rarity: "uncommon",
            dropRate: 40,
            icon: "💎",
            value: 55,
            droppedBy: ["crystal_spider", "crystal_queen", "gem_slime"],
            stackLimit: 50
        },

        crystal_silk: {
            id: "crystal_silk",
            name: "Crystal Silk",
            description: "Shimmering silk from crystal spiders.",
            rarity: "uncommon",
            dropRate: 50,
            icon: "🕸️",
            value: 48,
            droppedBy: ["crystal_spider", "crystal_queen"],
            stackLimit: 50
        },

        liquid_gem: {
            id: "liquid_gem",
            name: "Liquid Gem",
            description: "Liquefied gemstone from gem slimes.",
            rarity: "uncommon",
            dropRate: 45,
            icon: "💧",
            value: 65,
            droppedBy: ["gem_slime", "diamond_slime"],
            stackLimit: 30
        },

        // Nature Materials
        nature_essence: {
            id: "nature_essence",
            name: "Nature Essence",
            description: "Pure life energy from nature spirits.",
            rarity: "uncommon",
            dropRate: 55,
            icon: "🌿",
            value: 70,
            droppedBy: ["nature_sprite", "forest_guardian"],
            stackLimit: 50
        },

        sprite_dust: {
            id: "sprite_dust",
            name: "Sprite Dust",
            description: "Magical dust from nature sprites.",
            rarity: "uncommon",
            dropRate: 45,
            icon: "✨",
            value: 52,
            droppedBy: ["nature_sprite", "fairy"],
            stackLimit: 50
        },

        // Volcanic Materials
        molten_scale: {
            id: "molten_scale",
            name: "Molten Scale",
            description: "Heat-resistant scale from salamanders.",
            rarity: "uncommon",
            dropRate: 50,
            icon: "🔥",
            value: 75,
            droppedBy: ["salamander", "fire_drake"],
            stackLimit: 30
        },

        fire_crystal: {
            id: "fire_crystal",
            name: "Fire Crystal",
            description: "Crystallized flame energy.",
            rarity: "rare",
            dropRate: 42,
            icon: "🔴",
            value: 90,
            droppedBy: ["salamander", "lava_golem"],
            stackLimit: 30
        },

        // ================================================
        // RARE MATERIALS (Late Game)
        // ================================================

        // Dragon Materials
        dragon_scale: {
            id: "dragon_scale",
            name: "Dragon Scale",
            description: "Incredibly hard scale from a dragon. Ultimate breeding material.",
            rarity: "legendary",
            dropRate: 85,
            icon: "🐲",
            value: 500,
            droppedBy: ["dragon_whelp", "young_dragon", "ancient_dragon"],
            stackLimit: 20
        },

        dragon_heart: {
            id: "dragon_heart",
            name: "Dragon Heart",
            description: "The still-beating heart of an ancient dragon.",
            rarity: "legendary",
            dropRate: 65,
            icon: "❤️",
            value: 2000,
            droppedBy: ["ancient_dragon"],
            stackLimit: 5
        },

        drake_scale: {
            id: "drake_scale",
            name: "Drake Scale",
            description: "Powerful scale from a fire drake.",
            rarity: "rare",
            dropRate: 90,
            icon: "🔥",
            value: 400,
            droppedBy: ["fire_drake"],
            stackLimit: 20
        },

        wyvern_scale: {
            id: "wyvern_scale",
            name: "Wyvern Scale",
            description: "Aerodynamic scale from a wyvern.",
            rarity: "rare",
            dropRate: 85,
            icon: "🌪️",
            value: 380,
            droppedBy: ["wyvern", "elder_wyvern"],
            stackLimit: 20
        },

        // Phoenix Materials
        phoenix_feather: {
            id: "phoenix_feather",
            name: "Phoenix Feather",
            description: "Sacred feather from a phoenix. Radiates rebirth energy.",
            rarity: "legendary",
            dropRate: 70,
            icon: "🪶",
            value: 800,
            droppedBy: ["phoenix_chick", "phoenix"],
            stackLimit: 10
        },

        // Golem Materials
        ancient_core: {
            id: "ancient_core",
            name: "Ancient Core",
            description: "Power source from ancient golems.",
            rarity: "rare",
            dropRate: 55,
            icon: "⚙️",
            value: 450,
            droppedBy: ["guardian_golem", "titan_golem"],
            stackLimit: 10
        },

        molten_core: {
            id: "molten_core",
            name: "Molten Core",
            description: "Burning heart of a lava golem.",
            rarity: "rare",
            dropRate: 80,
            icon: "🌋",
            value: 500,
            droppedBy: ["lava_golem"],
            stackLimit: 10
        },

        lava_crystal: {
            id: "lava_crystal",
            name: "Lava Crystal",
            description: "Crystallized lava from volcanic golems.",
            rarity: "rare",
            dropRate: 65,
            icon: "🔴",
            value: 420,
            droppedBy: ["lava_golem"],
            stackLimit: 15
        },

        // Spirit/Undead Materials
        soul_gem: {
            id: "soul_gem",
            name: "Soul Gem",
            description: "Contains captured spiritual energy.",
            rarity: "rare",
            dropRate: 60,
            icon: "💎",
            value: 600,
            droppedBy: ["shadow_wraith", "lich"],
            stackLimit: 10
        },

        shadow_crystal: {
            id: "shadow_crystal",
            name: "Shadow Crystal",
            description: "Crystallized darkness from wraiths.",
            rarity: "rare",
            dropRate: 55,
            icon: "🌑",
            value: 480,
            droppedBy: ["shadow_wraith"],
            stackLimit: 15
        },

        // ================================================
        // LEGENDARY MATERIALS (Endgame)
        // ================================================

        // Special Gems
        fire_gem: {
            id: "fire_gem",
            name: "Fire Gem",
            description: "Pure fire energy condensed into gemstone form.",
            rarity: "epic",
            dropRate: 35,
            icon: "🔥",
            value: 800,
            droppedBy: ["fire_elemental", "salamander"],
            stackLimit: 10
        },

        sky_gem: {
            id: "sky_gem",
            name: "Sky Gem",
            description: "Contains the power of the heavens.",
            rarity: "epic",
            dropRate: 60,
            icon: "☁️",
            value: 900,
            droppedBy: ["wyvern", "elder_wyvern"],
            stackLimit: 10
        },

        holy_crystal: {
            id: "holy_crystal",
            name: "Holy Crystal",
            description: "Blessed crystal radiating divine power.",
            rarity: "epic",
            dropRate: 50,
            icon: "✨",
            value: 1000,
            droppedBy: ["unicorn", "phoenix"],
            stackLimit: 5
        },

        // Ultimate Materials
        ancient_flame: {
            id: "ancient_flame",
            name: "Ancient Flame",
            description: "Eternal fire from the first dragons.",
            rarity: "epic",
            dropRate: 50,
            icon: "🔥",
            value: 1200,
            droppedBy: ["fire_drake", "ancient_dragon"],
            stackLimit: 5
        },

        time_relic: {
            id: "time_relic",
            name: "Time Relic",
            description: "Fragment of crystallized time itself.",
            rarity: "legendary",
            dropRate: 35,
            icon: "⏳",
            value: 1500,
            droppedBy: ["ancient_spirit"],
            stackLimit: 5
        },

        dragon_essence: {
            id: "dragon_essence",
            name: "Dragon Essence",
            description: "Condensed power from ancient dragons.",
            rarity: "epic",
            dropRate: 35,
            icon: "🐉",
            value: 1100,
            droppedBy: ["ancient_dragon"],
            stackLimit: 10
        },

        mana_essence: {
            id: "mana_essence",
            name: "Mana Essence",
            description: "Concentrated magical energy in physical form.",
            rarity: "uncommon",
            dropRate: 40,
            icon: "🔵",
            value: 50,
            droppedBy: ["wizard", "mage", "elemental"],
            stackLimit: 50
        },

        crystal_essence: {
            id: "crystal_essence",
            name: "Crystal Essence",
            description: "Pure energy extracted from magical crystals.",
            rarity: "rare",
            dropRate: 45,
            icon: "💫",
            value: 350,
            droppedBy: ["crystal_spider", "gem_slime", "crystal_queen"],
            stackLimit: 20
        },

        // Minerals
        iron_ore: {
            id: "iron_ore",
            name: "Iron Ore",
            description: "Raw iron extracted from mountains.",
            rarity: "common",
            dropRate: 35,
            icon: "⛏️",
            value: 15,
            droppedBy: ["orc", "rock_lizard"],
            stackLimit: 99
        },

        mithril_ore: {
            id: "mithril_ore",
            name: "Mithril Ore",
            description: "Legendary metal ore stronger than iron.",
            rarity: "epic",
            dropRate: 25,
            icon: "✨",
            value: 700,
            droppedBy: ["guardian_golem", "titan_golem"],
            stackLimit: 10
        },

        adamantine_crystal: {
            id: "adamantine_crystal",
            name: "Adamantine Crystal",
            description: "The hardest known substance.",
            rarity: "legendary",
            dropRate: 15,
            icon: "💠",
            value: 2000,
            droppedBy: ["guardian_titan", "ancient_dragon"],
            stackLimit: 5
        },

        // Natural Materials
        forest_crystal: {
            id: "forest_crystal",
            name: "Forest Crystal",
            description: "Crystallized nature energy from ancient groves.",
            rarity: "rare",
            dropRate: 40,
            icon: "💚",
            value: 350,
            droppedBy: ["treant", "elder_treant", "forest_guardian"],
            stackLimit: 20
        },

        healing_herb: {
            id: "healing_herb",
            name: "Healing Herb",
            description: "Common medicinal plant found in forests.",
            rarity: "common",
            dropRate: 55,
            icon: "🌿",
            value: 5,
            droppedBy: ["nature_sprite"],
            stackLimit: 99
        },

        // Mythical Materials
        celestial_essence: {
            id: "celestial_essence",
            name: "Celestial Essence",
            description: "The rarest material, containing the power of the cosmos.",
            rarity: "mythical",
            dropRate: 5,
            icon: "🌟",
            value: 10000,
            droppedBy: ["ancient_dragon", "phoenix"],
            stackLimit: 1
        }
    },

    /**
     * Get material by ID
     */
    getMaterial: function(materialId) {
        return this.materials[materialId] || null;
    },

    /**
     * Get materials by rarity
     */
    getMaterialsByRarity: function(rarity) {
        const result = [];
        for (const id in this.materials) {
            if (this.materials[id].rarity === rarity) {
                result.push(this.materials[id]);
            }
        }
        return result;
    },

    /**
     * Get materials dropped by specific monster
     */
    getMaterialsFromMonster: function(monsterSpecies) {
        const result = [];
        for (const id in this.materials) {
            const material = this.materials[id];
            if (material.droppedBy.includes(monsterSpecies)) {
                result.push(material);
            }
        }
        return result;
    },

    /**
     * Calculate drop for defeated monster
     */
    rollDrop: function(monsterSpecies) {
        const possibleDrops = this.getMaterialsFromMonster(monsterSpecies);
        const drops = [];

        for (const material of possibleDrops) {
            const roll = Math.random() * 100;
            if (roll < material.dropRate) {
                // Determine quantity (1-3 for common, 1-2 for rare, 1 for legendary)
                let quantity = 1;
                if (material.rarity === 'common') {
                    quantity = Math.floor(Math.random() * 3) + 1;
                } else if (material.rarity === 'uncommon' || material.rarity === 'rare') {
                    quantity = Math.random() < 0.5 ? 1 : 2;
                }

                drops.push({
                    materialId: material.id,
                    name: material.name,
                    quantity: quantity,
                    rarity: material.rarity,
                    icon: material.icon
                });
            }
        }

        return drops;
    },

    /**
     * Get all materials as array
     */
    getAllMaterials: function() {
        return Object.values(this.materials);
    },

    /**
     * Check if player has enough of a material
     */
    hasEnough: function(materialId, quantity, playerMaterials) {
        const playerQty = playerMaterials[materialId] || 0;
        return playerQty >= quantity;
    }
};

// Make available globally
window.BreedingMaterialData = BreedingMaterialData;
