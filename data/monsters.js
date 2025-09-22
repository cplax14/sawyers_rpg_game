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
                hp: 25,
                mp: 15,
                attack: 18,
                defense: 15,
                magicAttack: 20,
                magicDefense: 25,
                speed: 35,
                accuracy: 70
            },
            statGrowth: {
                hp: 3, mp: 2, attack: 2, defense: 2,
                magicAttack: 3, magicDefense: 3, speed: 3, accuracy: 2
            },
            abilities: ["bounce", "heal"],
            captureRate: 65,
            evolutionLevel: 12,
            evolvesTo: ["king_slime"],
            evolutionItems: [],
            breedsWith: ["slime", "goblin"],
            areas: ["forest", "plains"],
            lootTable: {
                level: 1,
                goldRange: [3, 8],
                drops: [
                    {
                        itemType: "slime_gel",
                        dropChance: 0.65,
                        rarityWeights: { common: 0.8, uncommon: 0.15, rare: 0.05 },
                        quantityRange: [1, 2]
                    },
                    {
                        itemType: "health_potion",
                        dropChance: 0.25,
                        rarityWeights: { common: 0.9, uncommon: 0.1 },
                        quantityRange: [1, 1]
                    },
                    {
                        itemType: "equipment",
                        dropChance: 0.08,
                        rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05 },
                        equipmentTypes: ["light_armor", "simple_weapon"]
                    }
                ]
            }
        },
        
        goblin: {
            name: "Goblin",
            type: ["earth", "humanoid"],
            rarity: "common",
            baseStats: {
                hp: 35, mp: 10, attack: 25, defense: 20,
                magicAttack: 15, magicDefense: 18, speed: 45, accuracy: 75
            },
            statGrowth: {
                hp: 4, mp: 1, attack: 4, defense: 3,
                magicAttack: 2, magicDefense: 2, speed: 4, accuracy: 3
            },
            abilities: ["scratch", "throw_rock"],
            captureRate: 55,
            evolutionLevel: 14,
            evolvesTo: ["hobgoblin"],
            evolutionItems: [],
            breedsWith: ["goblin", "orc", "slime"],
            areas: ["forest", "cave", "mountains"],
            lootTable: {
                level: 2,
                goldRange: [5, 12],
                drops: [
                    {
                        itemType: "goblin_tooth",
                        dropChance: 0.45,
                        rarityWeights: { common: 0.75, uncommon: 0.2, rare: 0.05 },
                        quantityRange: [1, 3]
                    },
                    {
                        itemType: "crude_weapon",
                        dropChance: 0.35,
                        rarityWeights: { common: 0.8, uncommon: 0.18, rare: 0.02 },
                        equipmentTypes: ["club", "dagger", "sling"]
                    },
                    {
                        itemType: "leather_scraps",
                        dropChance: 0.3,
                        rarityWeights: { common: 0.9, uncommon: 0.1 },
                        quantityRange: [1, 2]
                    },
                    {
                        itemType: "mana_potion",
                        dropChance: 0.15,
                        rarityWeights: { common: 0.85, uncommon: 0.15 },
                        quantityRange: [1, 1]
                    }
                ]
            }
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
            captureRate: 45,
            evolutionLevel: 16,
            evolvesTo: ["dire_wolf"],
            evolutionItems: [],
            breedsWith: ["wolf", "bear", "fox"],
            areas: ["forest", "mountains", "plains"],
            lootTable: {
                level: 4,
                goldRange: [8, 18],
                drops: [
                    {
                        itemType: "wolf_fang",
                        dropChance: 0.55,
                        rarityWeights: { common: 0.65, uncommon: 0.25, rare: 0.08, epic: 0.02 },
                        quantityRange: [1, 2]
                    },
                    {
                        itemType: "wolf_pelt",
                        dropChance: 0.4,
                        rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05 },
                        quantityRange: [1, 1]
                    },
                    {
                        itemType: "beast_equipment",
                        dropChance: 0.15,
                        rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.09, epic: 0.01 },
                        equipmentTypes: ["hunting_bow", "beast_armor", "nature_accessory"]
                    },
                    {
                        itemType: "stamina_potion",
                        dropChance: 0.2,
                        rarityWeights: { common: 0.8, uncommon: 0.2 },
                        quantityRange: [1, 1]
                    }
                ]
            }
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
            captureRate: 30,
            evolutionLevel: 20,
            evolvesTo: ["orc_warrior"],
            evolutionItems: [],
            breedsWith: ["orc", "goblin", "troll"],
            areas: ["mountains", "cave", "wasteland"],
            lootTable: {
                level: 8,
                goldRange: [15, 35],
                drops: [
                    {
                        itemType: "orc_tusk",
                        dropChance: 0.5,
                        rarityWeights: { common: 0.5, uncommon: 0.35, rare: 0.12, epic: 0.03 },
                        quantityRange: [1, 2]
                    },
                    {
                        itemType: "warrior_equipment",
                        dropChance: 0.4,
                        rarityWeights: { common: 0.4, uncommon: 0.4, rare: 0.17, epic: 0.03 },
                        equipmentTypes: ["war_axe", "battle_armor", "strength_ring"]
                    },
                    {
                        itemType: "iron_ore",
                        dropChance: 0.35,
                        rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05 },
                        quantityRange: [2, 4]
                    },
                    {
                        itemType: "strength_potion",
                        dropChance: 0.25,
                        rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.1 },
                        quantityRange: [1, 2]
                    },
                    {
                        itemType: "spell_scroll",
                        dropChance: 0.1,
                        rarityWeights: { uncommon: 0.6, rare: 0.3, epic: 0.1 },
                        spellTypes: ["earth_magic", "combat_magic"]
                    }
                ]
            }
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
        
        // Advanced Forest Monsters
        dire_wolf: {
            name: "Dire Wolf",
            type: ["beast", "nature", "aggressive"],
            rarity: "uncommon",
            baseStats: {
                hp: 85, mp: 35, attack: 75, defense: 50,
                magicAttack: 40, magicDefense: 45, speed: 95, accuracy: 85
            },
            statGrowth: {
                hp: 6, mp: 3, attack: 6, defense: 4,
                magicAttack: 3, magicDefense: 4, speed: 7, accuracy: 5
            },
            abilities: ["savage_bite", "howl", "pack_hunt", "intimidate"],
            captureRate: 40,
            evolutionLevel: 30,
            evolvesTo: ["alpha_wolf"],
            evolutionItems: [],
            breedsWith: ["wolf", "dire_wolf"],
            areas: ["deep_forest", "wolf_den"]
        },

        alpha_wolf: {
            name: "Alpha Wolf",
            type: ["beast", "nature", "leader"],
            rarity: "rare",
            baseStats: {
                hp: 120, mp: 50, attack: 95, defense: 70,
                magicAttack: 55, magicDefense: 60, speed: 100, accuracy: 90
            },
            statGrowth: {
                hp: 8, mp: 4, attack: 8, defense: 6,
                magicAttack: 4, magicDefense: 5, speed: 7, accuracy: 5
            },
            abilities: ["alpha_bite", "rally", "pack_leader", "moon_howl"],
            captureRate: 25,
            evolutionLevel: 45,
            evolvesTo: [],
            evolutionItems: [],
            breedsWith: ["alpha_wolf", "dire_wolf"],
            areas: ["wolf_den"]
        },

        // Plains Monsters
        wild_horse: {
            name: "Wild Horse",
            type: ["beast", "nature"],
            rarity: "common",
            baseStats: {
                hp: 70, mp: 30, attack: 60, defense: 45,
                magicAttack: 25, magicDefense: 35, speed: 110, accuracy: 80
            },
            statGrowth: {
                hp: 5, mp: 2, attack: 4, defense: 3,
                magicAttack: 2, magicDefense: 3, speed: 8, accuracy: 4
            },
            abilities: ["gallop", "kick", "trample"],
            captureRate: 65,
            evolutionLevel: 25,
            evolvesTo: ["stallion"],
            evolutionItems: [],
            breedsWith: ["wild_horse", "unicorn"],
            areas: ["plains", "grasslands"]
        },

        hawk: {
            name: "Hawk",
            type: ["air", "beast", "flying"],
            rarity: "common",
            baseStats: {
                hp: 50, mp: 40, attack: 70, defense: 35,
                magicAttack: 45, magicDefense: 50, speed: 120, accuracy: 95
            },
            statGrowth: {
                hp: 3, mp: 3, attack: 5, defense: 2,
                magicAttack: 4, magicDefense: 4, speed: 8, accuracy: 6
            },
            abilities: ["dive_attack", "gust", "keen_eye"],
            captureRate: 70,
            evolutionLevel: 20,
            evolvesTo: ["eagle"],
            evolutionItems: [],
            breedsWith: ["hawk", "fire_bat"],
            areas: ["plains", "mountains"]
        },

        // Mountain Monsters
        mountain_goat: {
            name: "Mountain Goat",
            type: ["beast", "earth"],
            rarity: "common",
            baseStats: {
                hp: 75, mp: 25, attack: 55, defense: 65,
                magicAttack: 20, magicDefense: 40, speed: 70, accuracy: 75
            },
            statGrowth: {
                hp: 5, mp: 2, attack: 4, defense: 5,
                magicAttack: 1, magicDefense: 3, speed: 4, accuracy: 4
            },
            abilities: ["ram", "mountain_climb", "sure_footed"],
            captureRate: 70,
            evolutionLevel: 22,
            evolvesTo: ["bighorn"],
            evolutionItems: [],
            breedsWith: ["mountain_goat", "wild_horse"],
            areas: ["mountains", "mountain_base"]
        },

        rock_lizard: {
            name: "Rock Lizard",
            type: ["earth", "reptile"],
            rarity: "uncommon",
            baseStats: {
                hp: 80, mp: 35, attack: 65, defense: 85,
                magicAttack: 40, magicDefense: 70, speed: 50, accuracy: 70
            },
            statGrowth: {
                hp: 5, mp: 3, attack: 5, defense: 7,
                magicAttack: 3, magicDefense: 6, speed: 3, accuracy: 3
            },
            abilities: ["rock_throw", "camouflage", "stone_skin"],
            captureRate: 55,
            evolutionLevel: 28,
            evolvesTo: ["stone_dragon"],
            evolutionItems: ["earth_gem"],
            breedsWith: ["rock_lizard", "cave_troll"],
            areas: ["mountains", "cave_entrance"]
        },

        // Cave Monsters
        bat: {
            name: "Bat",
            type: ["air", "dark", "flying"],
            rarity: "common",
            baseStats: {
                hp: 45, mp: 50, attack: 50, defense: 30,
                magicAttack: 60, magicDefense: 55, speed: 100, accuracy: 85
            },
            statGrowth: {
                hp: 3, mp: 4, attack: 3, defense: 2,
                magicAttack: 5, magicDefense: 4, speed: 7, accuracy: 5
            },
            abilities: ["sonic_screech", "drain", "darkness"],
            captureRate: 75,
            evolutionLevel: 18,
            evolvesTo: ["vampire_bat"],
            evolutionItems: [],
            breedsWith: ["bat", "fire_bat"],
            areas: ["cave_entrance", "underground_lake"]
        },

        crystal_spider: {
            name: "Crystal Spider",
            type: ["earth", "insect", "crystal"],
            rarity: "uncommon",
            baseStats: {
                hp: 60, mp: 70, attack: 65, defense: 55,
                magicAttack: 80, magicDefense: 75, speed: 85, accuracy: 90
            },
            statGrowth: {
                hp: 4, mp: 6, attack: 5, defense: 4,
                magicAttack: 7, magicDefense: 6, speed: 6, accuracy: 5
            },
            abilities: ["crystal_web", "poison_sting", "reflect"],
            captureRate: 45,
            evolutionLevel: 25,
            evolvesTo: ["crystal_queen"],
            evolutionItems: ["crystal_shard"],
            breedsWith: ["crystal_spider"],
            areas: ["cave_entrance", "crystal_caves"]
        },

        gem_slime: {
            name: "Gem Slime",
            type: ["water", "crystal", "mineral"],
            rarity: "uncommon",
            baseStats: {
                hp: 55, mp: 80, attack: 40, defense: 70,
                magicAttack: 85, magicDefense: 90, speed: 40, accuracy: 75
            },
            statGrowth: {
                hp: 4, mp: 7, attack: 3, defense: 6,
                magicAttack: 8, magicDefense: 8, speed: 2, accuracy: 4
            },
            abilities: ["gem_blast", "harden", "crystal_heal"],
            captureRate: 50,
            evolutionLevel: 30,
            evolvesTo: ["diamond_slime"],
            evolutionItems: ["precious_gem"],
            breedsWith: ["slime", "crystal_spider"],
            areas: ["cave_entrance", "crystal_caves"]
        },

        cave_troll: {
            name: "Cave Troll",
            type: ["earth", "giant", "aggressive"],
            rarity: "rare",
            baseStats: {
                hp: 140, mp: 30, attack: 110, defense: 90,
                magicAttack: 35, magicDefense: 50, speed: 30, accuracy: 60
            },
            statGrowth: {
                hp: 9, mp: 2, attack: 9, defense: 7,
                magicAttack: 2, magicDefense: 4, speed: 2, accuracy: 3
            },
            abilities: ["club_smash", "rock_throw", "regenerate", "roar"],
            captureRate: 30,
            evolutionLevel: 40,
            evolvesTo: [],
            evolutionItems: [],
            breedsWith: ["cave_troll", "orc"],
            areas: ["cave_entrance", "deep_caves"]
        },

        // Volcanic Region Monsters
        fire_bat: {
            name: "Fire Bat",
            type: ["fire", "air", "flying"],
            rarity: "uncommon",
            baseStats: {
                hp: 50, mp: 60, attack: 60, defense: 35,
                magicAttack: 70, magicDefense: 65, speed: 110, accuracy: 85
            },
            statGrowth: {
                hp: 3, mp: 5, attack: 4, defense: 2,
                magicAttack: 6, magicDefense: 5, speed: 8, accuracy: 5
            },
            abilities: ["fire_screech", "flame_wing", "heat_drain"],
            captureRate: 55,
            evolutionLevel: 25,
            evolvesTo: ["inferno_bat"],
            evolutionItems: ["fire_gem"],
            breedsWith: ["bat", "fire_sprite"],
            areas: ["volcanic_region", "fire_caves"]
        },

        salamander: {
            name: "Salamander",
            type: ["fire", "reptile"],
            rarity: "uncommon",
            baseStats: {
                hp: 70, mp: 65, attack: 70, defense: 60,
                magicAttack: 85, magicDefense: 80, speed: 75, accuracy: 80
            },
            statGrowth: {
                hp: 5, mp: 5, attack: 5, defense: 4,
                magicAttack: 7, magicDefense: 6, speed: 5, accuracy: 4
            },
            abilities: ["flame_breath", "fire_immunity", "molten_skin"],
            captureRate: 45,
            evolutionLevel: 32,
            evolvesTo: ["fire_dragon"],
            evolutionItems: ["dragon_scale"],
            breedsWith: ["salamander", "fire_sprite"],
            areas: ["volcanic_region", "lava_tubes"]
        },

        lava_golem: {
            name: "Lava Golem",
            type: ["fire", "earth", "construct"],
            rarity: "rare",
            baseStats: {
                hp: 150, mp: 40, attack: 100, defense: 120,
                magicAttack: 90, magicDefense: 100, speed: 25, accuracy: 70
            },
            statGrowth: {
                hp: 10, mp: 3, attack: 8, defense: 10,
                magicAttack: 7, magicDefense: 8, speed: 1, accuracy: 3
            },
            abilities: ["molten_punch", "lava_spray", "heat_aura", "eruption"],
            captureRate: 20,
            evolutionLevel: 50,
            evolvesTo: [],
            evolutionItems: [],
            breedsWith: [],
            areas: ["volcanic_region", "lava_chambers"]
        },

        // Dragon Peak Monsters
        wyvern: {
            name: "Wyvern",
            type: ["dragon", "air", "flying"],
            rarity: "rare",
            baseStats: {
                hp: 100, mp: 80, attack: 95, defense: 75,
                magicAttack: 85, magicDefense: 80, speed: 90, accuracy: 85
            },
            statGrowth: {
                hp: 8, mp: 7, attack: 8, defense: 6,
                magicAttack: 7, magicDefense: 6, speed: 6, accuracy: 5
            },
            abilities: ["wind_slash", "dive_bomb", "wing_buffet", "roar"],
            captureRate: 18,
            evolutionLevel: 40,
            evolvesTo: ["elder_wyvern"],
            evolutionItems: ["sky_gem"],
            breedsWith: ["dragon_whelp", "wyvern"],
            areas: ["dragon_peak", "sky_fortress"]
        },

        fire_drake: {
            name: "Fire Drake",
            type: ["dragon", "fire"],
            rarity: "rare",
            baseStats: {
                hp: 110, mp: 90, attack: 105, defense: 85,
                magicAttack: 100, magicDefense: 90, speed: 75, accuracy: 85
            },
            statGrowth: {
                hp: 9, mp: 8, attack: 9, defense: 7,
                magicAttack: 9, magicDefense: 7, speed: 5, accuracy: 5
            },
            abilities: ["dragon_fire", "flame_claws", "fire_shield", "intimidate"],
            captureRate: 15,
            evolutionLevel: 45,
            evolvesTo: ["fire_dragon"],
            evolutionItems: ["ancient_flame"],
            breedsWith: ["dragon_whelp", "salamander"],
            areas: ["dragon_peak", "ancient_ruins"]
        },

        ancient_dragon: {
            name: "Ancient Dragon",
            type: ["dragon", "fire", "legendary"],
            rarity: "legendary",
            baseStats: {
                hp: 200, mp: 150, attack: 150, defense: 120,
                magicAttack: 140, magicDefense: 130, speed: 80, accuracy: 95
            },
            statGrowth: {
                hp: 12, mp: 10, attack: 12, defense: 10,
                magicAttack: 12, magicDefense: 10, speed: 6, accuracy: 5
            },
            abilities: ["ancient_flame", "dragon_claw", "time_magic", "dominate"],
            captureRate: 3,
            evolutionLevel: 99,
            evolvesTo: [],
            evolutionItems: [],
            breedsWith: ["ancient_dragon"],
            areas: ["dragon_peak"],
            lootTable: {
                level: 50,
                goldRange: [500, 1500],
                drops: [
                    {
                        itemType: "dragon_scale",
                        dropChance: 0.95,
                        rarityWeights: { rare: 0.3, epic: 0.5, legendary: 0.2 },
                        quantityRange: [3, 8]
                    },
                    {
                        itemType: "dragon_heart",
                        dropChance: 0.8,
                        rarityWeights: { epic: 0.6, legendary: 0.4 },
                        quantityRange: [1, 1]
                    },
                    {
                        itemType: "legendary_equipment",
                        dropChance: 0.7,
                        rarityWeights: { epic: 0.4, legendary: 0.6 },
                        equipmentTypes: ["dragonslayer_sword", "ancient_armor", "time_amulet"]
                    },
                    {
                        itemType: "ancient_tome",
                        dropChance: 0.6,
                        rarityWeights: { rare: 0.2, epic: 0.4, legendary: 0.4 },
                        spellTypes: ["time_magic", "dragon_magic", "ancient_arts"]
                    },
                    {
                        itemType: "dragon_essence",
                        dropChance: 0.5,
                        rarityWeights: { epic: 0.7, legendary: 0.3 },
                        quantityRange: [2, 5]
                    },
                    {
                        itemType: "legendary_gem",
                        dropChance: 0.25,
                        rarityWeights: { legendary: 1.0 },
                        quantityRange: [1, 2]
                    }
                ]
            }
        },

        // Mystic Grove Monsters
        nature_sprite: {
            name: "Nature Sprite",
            type: ["nature", "magical", "elemental"],
            rarity: "uncommon",
            baseStats: {
                hp: 50, mp: 90, attack: 45, defense: 40,
                magicAttack: 95, magicDefense: 85, speed: 100, accuracy: 90
            },
            statGrowth: {
                hp: 3, mp: 8, attack: 3, defense: 3,
                magicAttack: 8, magicDefense: 7, speed: 7, accuracy: 6
            },
            abilities: ["nature_magic", "heal", "entangle", "blessing"],
            captureRate: 30,
            evolutionLevel: 35,
            evolvesTo: ["forest_guardian"],
            evolutionItems: ["nature_crystal"],
            breedsWith: ["fairy", "unicorn"],
            areas: ["mystic_grove", "enchanted_forest"]
        },

        fairy: {
            name: "Fairy",
            type: ["light", "magical", "flying"],
            rarity: "uncommon",
            baseStats: {
                hp: 40, mp: 100, attack: 35, defense: 30,
                magicAttack: 100, magicDefense: 95, speed: 115, accuracy: 95
            },
            statGrowth: {
                hp: 2, mp: 9, attack: 2, defense: 2,
                magicAttack: 9, magicDefense: 8, speed: 8, accuracy: 6
            },
            abilities: ["fairy_dust", "light_beam", "heal", "charm"],
            captureRate: 25,
            evolutionLevel: 40,
            evolvesTo: ["fairy_queen"],
            evolutionItems: ["star_fragment"],
            breedsWith: ["nature_sprite", "phoenix_chick"],
            areas: ["mystic_grove", "fairy_ring"]
        },

        unicorn: {
            name: "Unicorn",
            type: ["holy", "beast", "magical"],
            rarity: "rare",
            baseStats: {
                hp: 95, mp: 120, attack: 80, defense: 70,
                magicAttack: 110, magicDefense: 100, speed: 95, accuracy: 90
            },
            statGrowth: {
                hp: 7, mp: 10, attack: 6, defense: 5,
                magicAttack: 9, magicDefense: 8, speed: 7, accuracy: 6
            },
            abilities: ["horn_strike", "purify", "holy_light", "teleport"],
            captureRate: 12,
            evolutionLevel: 50,
            evolvesTo: [],
            evolutionItems: [],
            breedsWith: ["unicorn", "wild_horse"],
            areas: ["mystic_grove", "sacred_glade"]
        },

        treant: {
            name: "Treant",
            type: ["nature", "plant", "giant"],
            rarity: "rare",
            baseStats: {
                hp: 180, mp: 70, attack: 90, defense: 140,
                magicAttack: 85, magicDefense: 120, speed: 20, accuracy: 75
            },
            statGrowth: {
                hp: 12, mp: 5, attack: 7, defense: 12,
                magicAttack: 6, magicDefense: 10, speed: 1, accuracy: 4
            },
            abilities: ["root_strike", "forest_magic", "bark_skin", "summon_vines"],
            captureRate: 15,
            evolutionLevel: 60,
            evolvesTo: ["elder_treant"],
            evolutionItems: ["ancient_seed"],
            breedsWith: ["nature_sprite"],
            areas: ["mystic_grove", "ancient_forest"]
        },

        // Ancient Ruins Monsters
        guardian_golem: {
            name: "Guardian Golem",
            type: ["earth", "construct", "guardian"],
            rarity: "rare",
            baseStats: {
                hp: 160, mp: 50, attack: 110, defense: 130,
                magicAttack: 70, magicDefense: 110, speed: 30, accuracy: 80
            },
            statGrowth: {
                hp: 11, mp: 4, attack: 9, defense: 11,
                magicAttack: 5, magicDefense: 9, speed: 2, accuracy: 4
            },
            abilities: ["stone_fist", "barrier", "ancient_magic", "self_repair"],
            captureRate: 20,
            evolutionLevel: 55,
            evolvesTo: ["titan_golem"],
            evolutionItems: ["ancient_core"],
            breedsWith: ["lava_golem"],
            areas: ["ancient_ruins", "forgotten_temple"]
        },

        shadow_wraith: {
            name: "Shadow Wraith",
            type: ["dark", "undead", "spirit"],
            rarity: "rare",
            baseStats: {
                hp: 80, mp: 120, attack: 75, defense: 45,
                magicAttack: 125, magicDefense: 100, speed: 105, accuracy: 90
            },
            statGrowth: {
                hp: 6, mp: 10, attack: 6, defense: 3,
                magicAttack: 11, magicDefense: 8, speed: 8, accuracy: 6
            },
            abilities: ["shadow_strike", "drain_life", "phase", "curse"],
            captureRate: 18,
            evolutionLevel: 50,
            evolvesTo: ["lich"],
            evolutionItems: ["soul_gem"],
            breedsWith: [],
            areas: ["ancient_ruins", "shadow_realm"]
        },

        ancient_spirit: {
            name: "Ancient Spirit",
            type: ["spirit", "magical", "ancient"],
            rarity: "epic",
            baseStats: {
                hp: 100, mp: 150, attack: 85, defense: 60,
                magicAttack: 140, magicDefense: 130, speed: 90, accuracy: 95
            },
            statGrowth: {
                hp: 8, mp: 12, attack: 7, defense: 5,
                magicAttack: 12, magicDefense: 11, speed: 7, accuracy: 6
            },
            abilities: ["ancient_wisdom", "spirit_blast", "time_warp", "prophecy"],
            captureRate: 10,
            evolutionLevel: 70,
            evolvesTo: [],
            evolutionItems: [],
            breedsWith: ["shadow_wraith"],
            areas: ["ancient_ruins"]
        },

        guardian_titan: {
            name: "Guardian Titan",
            type: ["earth", "construct", "legendary", "boss"],
            rarity: "legendary",
            baseStats: {
                hp: 250, mp: 80, attack: 160, defense: 180,
                magicAttack: 100, magicDefense: 150, speed: 25, accuracy: 85
            },
            statGrowth: {
                hp: 15, mp: 6, attack: 13, defense: 15,
                magicAttack: 8, magicDefense: 12, speed: 1, accuracy: 4
            },
            abilities: ["titan_strike", "earthquake", "ancient_power", "fortress_mode"],
            captureRate: 2,
            evolutionLevel: 99,
            evolvesTo: [],
            evolutionItems: [],
            breedsWith: [],
            areas: ["ancient_ruins"]
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
     * Get possible breeding outcomes with enhanced balancing
     */
    getBreedingOutcomes: function(species1, species2) {
        if (!this.canBreed(species1, species2)) return [];

        const outcomes = [];
        const monster1 = this.getSpecies(species1);
        const monster2 = this.getSpecies(species2);

        // Same species breeding: 80% same species, 20% variant/evolution chance
        if (species1 === species2) {
            outcomes.push({ species: species1, chance: 80 });

            // Small chance for evolution/variant
            if (monster1.evolvesTo.length > 0 && Math.random() < 0.2) {
                const evolution = monster1.evolvesTo[0];
                outcomes.push({ species: evolution, chance: 20 });
            }
            return outcomes;
        }

        // Different species breeding: balanced based on rarity
        const rarity1 = monster1.rarity;
        const rarity2 = monster2.rarity;

        // Calculate parent chances based on rarity (rarer species have lower inheritance chance)
        let chance1 = this.getParentInheritanceChance(rarity1);
        let chance2 = this.getParentInheritanceChance(rarity2);

        // Adjust if one parent is much rarer
        if (rarity1 !== rarity2) {
            const rarityValues = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
            const diff = Math.abs(rarityValues[rarity1] - rarityValues[rarity2]);
            if (diff >= 2) {
                // Rarer parent has lower inheritance chance
                if (rarityValues[rarity1] > rarityValues[rarity2]) {
                    chance1 -= diff * 5;
                    chance2 += diff * 3;
                } else {
                    chance2 -= diff * 5;
                    chance1 += diff * 3;
                }
            }
        }

        // Ensure chances are valid
        chance1 = Math.max(15, Math.min(50, chance1));
        chance2 = Math.max(15, Math.min(50, chance2));

        outcomes.push({ species: species1, chance: chance1 });
        outcomes.push({ species: species2, chance: chance2 });

        // Check for special combinations
        const combinations = this.getSpecialBreedingCombinations();
        const combo = combinations[`${species1}+${species2}`] ||
                     combinations[`${species2}+${species1}`];

        if (combo) {
            const specialChance = this.getSpecialBreedingChance(rarity1, rarity2, combo.baseChance || 15);
            outcomes.push({ species: combo.result, chance: specialChance });
        }

        // Normalize chances to 100%
        const totalChance = outcomes.reduce((sum, outcome) => sum + outcome.chance, 0);
        if (totalChance !== 100) {
            const factor = 100 / totalChance;
            outcomes.forEach(outcome => {
                outcome.chance = Math.round(outcome.chance * factor);
            });
        }

        return outcomes;
    },

    /**
     * Get parent inheritance chance based on rarity
     */
    getParentInheritanceChance: function(rarity) {
        switch (rarity) {
            case 'common': return 40;
            case 'uncommon': return 35;
            case 'rare': return 30;
            case 'epic': return 25;
            case 'legendary': return 20;
            default: return 35;
        }
    },

    /**
     * Calculate special breeding chance based on parent rarities
     */
    getSpecialBreedingChance: function(rarity1, rarity2, baseChance) {
        const rarityValues = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
        const avgRarity = (rarityValues[rarity1] + rarityValues[rarity2]) / 2;

        // Higher rarity parents have better chance of special outcomes
        const rarityBonus = Math.floor((avgRarity - 1) * 3); // +3% per rarity level above common

        return Math.min(30, baseChance + rarityBonus);
    },
    
    /**
     * Special breeding combinations with enhanced balancing
     */
    getSpecialBreedingCombinations: function() {
        return {
            // Elemental combinations (rare results)
            "fire_sprite+ice_sprite": { result: "steam_elemental", baseChance: 12 },
            "fire_sprite+thunder_sprite": { result: "plasma_elemental", baseChance: 10 },
            "ice_sprite+thunder_sprite": { result: "storm_elemental", baseChance: 10 },

            // Dragon lineage (very rare results)
            "dragon_whelp+phoenix_chick": { result: "solar_dragon", baseChance: 3 },
            "dragon_whelp+ice_sprite": { result: "frost_dragon", baseChance: 5 },
            "wyvern+dragon_whelp": { result: "ancient_wyrm", baseChance: 4 },

            // Beast combinations (more common)
            "wolf+goblin": { result: "worg", baseChance: 18 },
            "wolf+orc": { result: "dire_worg", baseChance: 15 },
            "bear+wolf": { result: "dire_bear", baseChance: 16 },

            // Magical slime variants
            "slime+fire_sprite": { result: "magma_slime", baseChance: 20 },
            "slime+ice_sprite": { result: "crystal_slime", baseChance: 20 },
            "slime+thunder_sprite": { result: "spark_slime", baseChance: 20 },

            // Humanoid evolution paths
            "goblin+orc": { result: "goblin_warrior", baseChance: 25 },
            "hobgoblin+orc_warrior": { result: "orc_chieftain", baseChance: 8 },

            // Nature combinations
            "treant+dryad": { result: "world_tree", baseChance: 6 },
            "unicorn+dryad": { result: "forest_spirit", baseChance: 7 },

            // Undead combinations
            "shadow_wraith+bone_knight": { result: "death_lord", baseChance: 5 },
            "lich+phantom": { result: "arch_lich", baseChance: 3 }
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
    },

    /**
     * Create an AI-enabled monster instance for combat
     */
    createAIMonster: function(species, level, stats = null) {
        const speciesData = this.getSpecies(species);
        if (!speciesData) return null;

        const monster = {
            species: species,
            level: level,
            stats: stats || this.getStatsAtLevel(species, level),
            currentStats: null, // Will be set by combat system
            abilities: [...(speciesData.abilities || [])],
            speciesData: speciesData,
            type: speciesData.type || ['unknown'],

            // AI decision making method
            chooseAIAction: function(targets) {
                return MonsterData.chooseMonsterAction(this, targets);
            }
        };

        // Initialize current stats for combat
        monster.currentStats = { ...monster.stats };

        return monster;
    },

    /**
     * AI action selection for monsters
     */
    chooseMonsterAction: function(monster, targets) {
        if (!targets || targets.length === 0) {
            return { type: 'defend' };
        }

        // Get monster's available actions
        const actions = this.getAvailableActions(monster, targets);

        if (actions.length === 0) {
            return { type: 'attack', target: targets[0] };
        }

        // Choose action based on AI personality and situation
        return this.selectBestAction(monster, targets, actions);
    },

    /**
     * Get available actions for a monster
     */
    getAvailableActions: function(monster, targets) {
        const actions = [];

        // Always can attack
        actions.push({ type: 'attack', priority: 50 });

        // Check for spell/ability actions
        if (monster.abilities && monster.abilities.length > 0) {
            for (const ability of monster.abilities) {
                const spellAction = this.getSpellAction(monster, ability, targets);
                if (spellAction) {
                    actions.push(spellAction);
                }
            }
        }

        // Defensive actions based on health
        const healthPercent = (monster.currentStats?.hp || 0) / (monster.stats?.hp || 1);
        if (healthPercent < 0.3) {
            actions.push({ type: 'defend', priority: 70 });
        }

        return actions;
    },

    /**
     * Convert monster ability to spell action
     */
    getSpellAction: function(monster, ability, targets) {
        // Map common abilities to spell-like actions
        const spellMappings = {
            'fireball': { type: 'spell', spellId: 'fireball', mpCost: 8, priority: 80, targetType: 'enemy' },
            'heal': { type: 'spell', spellId: 'heal', mpCost: 6, priority: 90, targetType: 'self' },
            'ice_shard': { type: 'spell', spellId: 'ice_shard', mpCost: 6, priority: 75, targetType: 'enemy' },
            'lightning_bolt': { type: 'spell', spellId: 'lightning_bolt', mpCost: 10, priority: 85, targetType: 'enemy' },
            'flame_burst': { type: 'ability', ability: 'flame_burst', mpCost: 5, priority: 70, targetType: 'enemy' },
            'dragon_breath': { type: 'ability', ability: 'dragon_breath', mpCost: 12, priority: 90, targetType: 'enemy' },
            'fire_shield': { type: 'ability', ability: 'fire_shield', mpCost: 8, priority: 60, targetType: 'self' },
            'roar': { type: 'ability', ability: 'roar', mpCost: 4, priority: 50, targetType: 'all' },
            'claw_attack': { type: 'attack', priority: 60 }, // Enhanced attack
            'bounce': { type: 'ability', ability: 'bounce', mpCost: 3, priority: 40, targetType: 'enemy' }
        };

        const mapping = spellMappings[ability];
        if (!mapping) {
            // Default to ability action
            return { type: 'ability', ability: ability, mpCost: 5, priority: 50, targetType: 'enemy' };
        }

        // Check if monster has enough MP
        const currentMP = monster.currentStats?.mp || 0;
        if (currentMP < mapping.mpCost) {
            return null; // Can't cast
        }

        // Select appropriate target based on action type
        let target = null;
        switch (mapping.targetType) {
            case 'enemy':
                target = targets[0]; // For now, target first available enemy
                break;
            case 'self':
                target = monster; // Self-targeting
                break;
            case 'all':
                target = targets[0]; // Will affect all, but need a primary target
                break;
        }

        return {
            ...mapping,
            target: target
        };
    },

    /**
     * Select the best action based on AI logic
     */
    selectBestAction: function(monster, targets, actions) {
        if (actions.length === 0) {
            return { type: 'attack', target: targets[0] };
        }

        // Calculate situation modifiers
        const healthPercent = (monster.currentStats?.hp || 0) / (monster.stats?.hp || 1);
        const mpPercent = (monster.currentStats?.mp || 0) / (monster.stats?.mp || 1);

        // Adjust action priorities based on situation
        const adjustedActions = actions.map(action => {
            let priority = action.priority || 50;

            // Boost healing when low on health
            if (action.type === 'spell' && action.spellId === 'heal' && healthPercent < 0.5) {
                priority += 40;
            }

            // Prefer attacks when low on MP
            if (action.type === 'attack' && mpPercent < 0.3) {
                priority += 30;
            }

            // High-damage spells when enemy is low on health
            const targetHealthPercent = this.getTargetHealthPercent(action.target);
            if (action.type === 'spell' && targetHealthPercent < 0.3) {
                priority += 20;
            }

            // Monster personality adjustments
            const personality = this.getMonsterPersonality(monster);
            priority = this.applyPersonalityModifier(action, priority, personality);

            return { ...action, adjustedPriority: priority };
        });

        // Select action with highest adjusted priority (with some randomness)
        adjustedActions.sort((a, b) => (b.adjustedPriority || 0) - (a.adjustedPriority || 0));

        // Add some randomness: 70% chance to pick best, 30% chance to pick from top 3
        const randomRoll = Math.random();
        if (randomRoll < 0.7 || adjustedActions.length === 1) {
            return adjustedActions[0];
        } else {
            const topActions = adjustedActions.slice(0, Math.min(3, adjustedActions.length));
            const randomIndex = Math.floor(Math.random() * topActions.length);
            return topActions[randomIndex];
        }
    },

    /**
     * Get target's health percentage
     */
    getTargetHealthPercent: function(target) {
        if (!target || !target.currentStats || !target.stats) return 1.0;
        return (target.currentStats.hp || 0) / (target.stats.hp || 1);
    },

    /**
     * Get monster personality based on species type
     */
    getMonsterPersonality: function(monster) {
        const types = monster.type || [];

        if (types.includes('aggressive')) return 'aggressive';
        if (types.includes('magical')) return 'magical';
        if (types.includes('defensive')) return 'defensive';
        if (types.includes('cunning')) return 'cunning';

        // Default personalities based on element
        if (types.includes('fire')) return 'aggressive';
        if (types.includes('water') || types.includes('ice')) return 'balanced';
        if (types.includes('nature')) return 'defensive';
        if (types.includes('dark')) return 'cunning';

        return 'balanced';
    },

    /**
     * Apply personality modifiers to action priorities
     */
    applyPersonalityModifier: function(action, priority, personality) {
        switch (personality) {
            case 'aggressive':
                if (action.type === 'attack') priority += 20;
                if (action.type === 'spell' && action.spellId && action.spellId.includes('fire')) priority += 15;
                break;

            case 'magical':
                if (action.type === 'spell' || action.type === 'ability') priority += 25;
                if (action.type === 'attack') priority -= 10;
                break;

            case 'defensive':
                if (action.type === 'defend') priority += 20;
                if (action.type === 'spell' && action.spellId === 'heal') priority += 30;
                break;

            case 'cunning':
                if (action.type === 'ability') priority += 15;
                // Prefer status effects and tricks
                break;

            case 'balanced':
            default:
                // No significant modifiers
                break;
        }

        return priority;
    }
};

// Make available globally
window.MonsterData = MonsterData;