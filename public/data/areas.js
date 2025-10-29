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
            shopIds: ["mistwood_general_store"], // Shops available in this area
            unlocked: true, // Always available
            unlockRequirements: {},
            encounterRate: 0,
            monsters: [],
            connections: ["forest_path"],
            storyEvents: ["game_start", "tutorial_complete"],
            services: ["shop", "inn", "save_point"],
            backgroundMusic: "village_theme",
            lootTable: {
                recommendedLevel: 1,
                explorationType: "safe_zone",
                drops: [
                    {
                        itemType: "tutorial_items",
                        dropChance: 0.8,
                        rarityWeights: { common: 1.0 },
                        quantityRange: [1, 1],
                        explorationTypes: ["thorough"]
                    },
                    {
                        itemType: "village_supplies",
                        dropChance: 0.4,
                        rarityWeights: { common: 0.9, uncommon: 0.1 },
                        quantityRange: [1, 2],
                        items: ["bread", "water", "basic_tools"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 0.5, // Towns have less gold lying around
                    safetyBonus: true,
                    shopAccess: true
                }
            }
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
            storyEvents: ["first_monster_encounter", "merchant_caravan", "abandoned_village"],
            services: [],
            backgroundMusic: "forest_theme",
            lootTable: {
                recommendedLevel: 3,
                explorationType: "wilderness",
                drops: [
                    {
                        itemType: "forest_herbs",
                        dropChance: 0.7,
                        rarityWeights: { common: 0.8, uncommon: 0.2 },
                        quantityRange: [1, 3],
                        items: ["healing_herb", "mana_flower", "forest_berry"]
                    },
                    {
                        itemType: "wood_materials",
                        dropChance: 0.5,
                        rarityWeights: { common: 0.9, uncommon: 0.1 },
                        quantityRange: [2, 4],
                        items: ["oak_branch", "pine_sap", "bark_strip"]
                    },
                    {
                        itemType: "nature_equipment",
                        dropChance: 0.15,
                        rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05 },
                        equipmentTypes: ["wooden_staff", "leaf_armor", "nature_ring"]
                    },
                    {
                        itemType: "forest_crystals",
                        dropChance: 0.1,
                        rarityWeights: { uncommon: 0.7, rare: 0.25, epic: 0.05 },
                        quantityRange: [1, 1],
                        items: ["forest_crystal", "nature_gem"]
                    },
                    {
                        itemType: "hidden_forest_cache",
                        dropChance: 0.15,
                        rarityWeights: { rare: 0.6, epic: 0.3, legendary: 0.1 },
                        quantityRange: [1, 2],
                        items: ["ancient_seed", "forest_memory", "druid_relic"],
                        explorationTypes: ["thorough", "treasure_hunt"]
                    },
                    {
                        itemType: "quick_forage",
                        dropChance: 0.8,
                        rarityWeights: { common: 0.9, uncommon: 0.1 },
                        quantityRange: [2, 4],
                        items: ["common_berry", "bark_strip", "fallen_branch"],
                        explorationTypes: ["quick", "resource_gathering"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 0.9, // Increased for early game
                    experienceBonus: 0.15, // Boosted early learning
                    environmentType: "forest"
                }
            }
        },
        
        deep_forest: {
            name: "Deep Forest",
            description: "Ancient woods where stronger creatures dwell.",
            type: "wilderness",
            unlocked: false,
            unlockRequirements: { story: "forest_path_cleared", level: 3 },
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
            backgroundMusic: "deep_forest_theme",
            lootTable: {
                recommendedLevel: 6,
                explorationType: "deep_wilderness",
                drops: [
                    {
                        itemType: "ancient_wood",
                        dropChance: 0.65,
                        rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.1 },
                        quantityRange: [2, 5],
                        explorationTypes: ["thorough"]
                    },
                    {
                        itemType: "rare_herbs",
                        dropChance: 0.50,
                        rarityWeights: { common: 0.5, uncommon: 0.4, rare: 0.1 },
                        quantityRange: [1, 3],
                        items: ["bloodroot", "shadowmoss", "ancient_fern"]
                    },
                    {
                        itemType: "beast_materials",
                        dropChance: 0.40,
                        rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05 },
                        quantityRange: [1, 4],
                        items: ["wolf_tracks", "orc_marking", "beast_claw"]
                    },
                    {
                        itemType: "wilderness_equipment",
                        dropChance: 0.20,
                        rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.1 },
                        equipmentTypes: ["forest_cloak", "tracking_boots", "survival_kit"]
                    },
                    {
                        itemType: "forest_treasures",
                        dropChance: 0.15,
                        rarityWeights: { uncommon: 0.7, rare: 0.25, epic: 0.05 },
                        quantityRange: [1, 2],
                        items: ["hidden_cache", "ancient_coin", "forest_crystal"]
                    },
                    {
                        itemType: "ancient_grove_secrets",
                        dropChance: 0.25,
                        rarityWeights: { epic: 0.7, legendary: 0.3 },
                        quantityRange: [1, 1],
                        items: ["primordial_essence", "time_worn_artifact", "forest_heart_fragment"],
                        explorationTypes: ["thorough", "stealth"]
                    },
                    {
                        itemType: "resource_nodes",
                        dropChance: 0.9,
                        rarityWeights: { common: 0.6, uncommon: 0.4 },
                        quantityRange: [3, 6],
                        items: ["harvested_wood", "gathered_herbs", "collected_materials"],
                        explorationTypes: ["resource_gathering"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 1.2,
                    experienceBonus: 0.15,
                    environmentType: "deep_forest"
                }
            }
        },
        
        wolf_den: {
            name: "Wolf Den",
            description: "A cave system home to a pack of wolves.",
            type: "dungeon",
            unlocked: false,
            unlockRequirements: {
                and: [
                    { story: "pack_encounter" },
                    { or: [
                        { item: "wolf_tracker" },
                        { item: "wolf_companion" }
                    ]}
                ]
            },
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
            },
            lootTable: {
                recommendedLevel: 12,
                explorationType: "pack_den",
                drops: [
                    {
                        itemType: "wolf_materials",
                        dropChance: 0.75,
                        rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.1 },
                        quantityRange: [2, 5],
                        items: ["wolf_pelt", "wolf_fang", "pack_scent"]
                    },
                    {
                        itemType: "den_treasures",
                        dropChance: 0.60,
                        rarityWeights: { common: 0.5, uncommon: 0.4, rare: 0.1 },
                        quantityRange: [1, 3],
                        items: ["bone_cache", "territorial_marker", "pack_trophy"]
                    },
                    {
                        itemType: "predator_equipment",
                        dropChance: 0.35,
                        rarityWeights: { uncommon: 0.6, rare: 0.3, epic: 0.1 },
                        equipmentTypes: ["hunter_cloak", "tracking_gear", "predator_weapons"]
                    },
                    {
                        itemType: "alpha_artifacts",
                        dropChance: 0.25,
                        rarityWeights: { rare: 0.7, epic: 0.25, legendary: 0.05 },
                        quantityRange: [1, 2],
                        items: ["alpha_tooth", "leadership_totem", "pack_bond_crystal"]
                    },
                    {
                        itemType: "wolf_den_exclusive",
                        dropChance: 0.12,
                        rarityWeights: { epic: 0.7, legendary: 0.3 },
                        quantityRange: [1, 1],
                        items: ["howling_moon_pendant", "alpha_dominance_crown", "wolf_spirit_essence"],
                        areaExclusive: true,
                        explorationTypes: ["thorough", "treasure_hunt"]
                    },
                    {
                        itemType: "cave_minerals",
                        dropChance: 0.40,
                        rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05 },
                        quantityRange: [1, 4],
                        items: ["cave_salt", "mineral_deposits", "stone_fragments"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 1.4, // Increased for boss difficulty
                    experienceBonus: 0.2, // Added substantial XP bonus for boss area
                    denBonus: 0.2, // 20% bonus to pack-related items
                    environmentType: "wolf_den",
                    bossArea: true
                }
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
            backgroundMusic: "plains_theme",
            lootTable: {
                recommendedLevel: 8,
                explorationType: "open_plains",
                drops: [
                    {
                        itemType: "grassland_herbs",
                        dropChance: 0.70,
                        rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05 },
                        quantityRange: [2, 5],
                        items: ["sweet_grass", "prairie_flower", "wind_herb"]
                    },
                    {
                        itemType: "plains_materials",
                        dropChance: 0.60,
                        rarityWeights: { common: 0.8, uncommon: 0.2 },
                        quantityRange: [1, 4],
                        items: ["wild_grain", "leather_scraps", "feathers"]
                    },
                    {
                        itemType: "traveler_supplies",
                        dropChance: 0.45,
                        rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.1 },
                        quantityRange: [1, 3],
                        items: ["trail_rations", "water_pouch", "merchant_goods"]
                    },
                    {
                        itemType: "riding_equipment",
                        dropChance: 0.25,
                        rarityWeights: { common: 0.5, uncommon: 0.4, rare: 0.1 },
                        equipmentTypes: ["riding_boots", "travel_cloak", "plains_gear"]
                    },
                    {
                        itemType: "sky_treasures",
                        dropChance: 0.15,
                        rarityWeights: { uncommon: 0.6, rare: 0.3, epic: 0.1 },
                        quantityRange: [1, 2],
                        items: ["wind_crystal", "sky_shard", "freedom_token"]
                    },
                    {
                        itemType: "nomad_caches",
                        dropChance: 0.35,
                        rarityWeights: { uncommon: 0.5, rare: 0.4, epic: 0.1 },
                        quantityRange: [1, 3],
                        items: ["traveler_memento", "route_map", "merchant_token"],
                        explorationTypes: ["thorough", "treasure_hunt"]
                    },
                    {
                        itemType: "swift_findings",
                        dropChance: 0.7,
                        rarityWeights: { common: 0.8, uncommon: 0.2 },
                        quantityRange: [2, 3],
                        items: ["plains_grass", "loose_feather", "worn_horseshoe"],
                        explorationTypes: ["quick", "combat_patrol"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 1.1, // Increased for mid-early game
                    experienceBonus: 0.1, // Added XP bonus
                    merchantBonus: 0.3, // 30% bonus when traveling merchant is present
                    environmentType: "grasslands"
                }
            }
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
            backgroundMusic: "mountain_theme",
            lootTable: {
                recommendedLevel: 10,
                explorationType: "mountain_foothills",
                drops: [
                    {
                        itemType: "mountain_stone",
                        dropChance: 0.80,
                        rarityWeights: { common: 0.6, uncommon: 0.3, rare: 0.1 },
                        quantityRange: [2, 6],
                        items: ["granite_chunk", "slate_fragment", "mountain_crystal"]
                    },
                    {
                        itemType: "highland_herbs",
                        dropChance: 0.55,
                        rarityWeights: { common: 0.5, uncommon: 0.4, rare: 0.1 },
                        quantityRange: [1, 3],
                        items: ["alpine_moss", "cliff_root", "altitude_flower"]
                    },
                    {
                        itemType: "climbing_gear",
                        dropChance: 0.40,
                        rarityWeights: { common: 0.4, uncommon: 0.5, rare: 0.1 },
                        equipmentTypes: ["mountain_boots", "climbing_rope", "altitude_gear"]
                    },
                    {
                        itemType: "tribal_artifacts",
                        dropChance: 0.30,
                        rarityWeights: { uncommon: 0.6, rare: 0.3, epic: 0.1 },
                        quantityRange: [1, 2],
                        items: ["orc_token", "tribal_marking", "mountain_blessing"]
                    },
                    {
                        itemType: "rare_minerals",
                        dropChance: 0.20,
                        rarityWeights: { rare: 0.7, epic: 0.25, legendary: 0.05 },
                        quantityRange: [1, 2],
                        items: ["iron_ore", "precious_stone", "mountain_gem"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 1.3, // Balanced for mid-game
                    experienceBonus: 0.12, // Added XP bonus for difficulty
                    altitudeBonus: 0.15, // 15% bonus to highland-specific items
                    environmentType: "mountain_foothills"
                }
            }
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
            storyEvents: ["crystal_discovery", "cave_collapse", "crystal_cave_mystery"],
            services: [],
            backgroundMusic: "cave_theme",
            lootTable: {
                recommendedLevel: 12,
                explorationType: "dungeon",
                drops: [
                    {
                        itemType: "crystal_ore",
                        dropChance: 0.8,
                        rarityWeights: { common: 0.5, uncommon: 0.3, rare: 0.15, epic: 0.05 },
                        quantityRange: [2, 6],
                        items: ["quartz_crystal", "amethyst_shard", "crystal_core"]
                    },
                    {
                        itemType: "rare_gems",
                        dropChance: 0.4,
                        rarityWeights: { uncommon: 0.6, rare: 0.3, epic: 0.1 },
                        quantityRange: [1, 3],
                        items: ["sapphire", "ruby", "diamond_shard"]
                    },
                    {
                        itemType: "crystal_equipment",
                        dropChance: 0.25,
                        rarityWeights: { uncommon: 0.4, rare: 0.4, epic: 0.18, legendary: 0.02 },
                        equipmentTypes: ["crystal_sword", "gem_armor", "power_amulet"]
                    },
                    {
                        itemType: "magical_essence",
                        dropChance: 0.3,
                        rarityWeights: { rare: 0.6, epic: 0.35, legendary: 0.05 },
                        quantityRange: [1, 2],
                        items: ["mana_essence", "crystal_essence", "power_core"]
                    },
                    {
                        itemType: "cave_artifacts",
                        dropChance: 0.1,
                        rarityWeights: { epic: 0.7, legendary: 0.3 },
                        quantityRange: [1, 1],
                        items: ["ancient_crystal", "power_rune"]
                    },
                    {
                        itemType: "crystal_cave_exclusive",
                        dropChance: 0.08,
                        rarityWeights: { epic: 0.6, legendary: 0.4 },
                        quantityRange: [1, 1],
                        items: ["resonance_crystal", "cave_singer_gem", "harmonic_amplifier"],
                        areaExclusive: true,
                        explorationTypes: ["thorough", "resource_gathering", "treasure_hunt"]
                    },
                    {
                        itemType: "crystalline_formations",
                        dropChance: 0.6,
                        rarityWeights: { uncommon: 0.5, rare: 0.4, epic: 0.1 },
                        quantityRange: [2, 4],
                        items: ["crystal_cluster", "mineral_vein", "gem_deposit"],
                        explorationTypes: ["thorough", "resource_gathering"]
                    },
                    {
                        itemType: "treasure_chamber_loot",
                        dropChance: 0.3,
                        rarityWeights: { epic: 0.5, legendary: 0.5 },
                        quantityRange: [1, 2],
                        items: ["vault_key", "treasure_map", "crystal_crown"],
                        explorationTypes: ["treasure_hunt"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 1.6, // Rich mineral deposits + difficulty bonus
                    experienceBonus: 0.18, // Good XP for dungeon challenge
                    magicItemBonus: 0.2, // 20% bonus to magical item drops
                    environmentType: "crystal_cave"
                }
            }
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
            backgroundMusic: "volcano_theme",
            lootTable: {
                recommendedLevel: 22,
                explorationType: "volcanic_wasteland",
                drops: [
                    {
                        itemType: "volcanic_materials",
                        dropChance: 0.85,
                        rarityWeights: { uncommon: 0.4, rare: 0.4, epic: 0.2 },
                        quantityRange: [2, 5],
                        items: ["obsidian_shard", "lava_rock", "fire_crystal"]
                    },
                    {
                        itemType: "flame_essence",
                        dropChance: 0.65,
                        rarityWeights: { rare: 0.5, epic: 0.4, legendary: 0.1 },
                        quantityRange: [1, 3],
                        items: ["fire_essence", "molten_core", "flame_spirit"]
                    },
                    {
                        itemType: "heat_resistant_gear",
                        dropChance: 0.50,
                        rarityWeights: { rare: 0.6, epic: 0.3, legendary: 0.1 },
                        equipmentTypes: ["fire_armor", "heat_shield", "flame_weapons"]
                    },
                    {
                        itemType: "salamander_scales",
                        dropChance: 0.40,
                        rarityWeights: { rare: 0.7, epic: 0.25, legendary: 0.05 },
                        quantityRange: [1, 4],
                        items: ["fire_scale", "heat_membrane", "salamander_hide"]
                    },
                    {
                        itemType: "volcanic_region_exclusive",
                        dropChance: 0.05,
                        rarityWeights: { epic: 0.5, legendary: 0.5 },
                        quantityRange: [1, 1],
                        items: ["molten_heart", "volcano_core", "phoenix_ash"],
                        areaExclusive: true,
                        explorationTypes: ["thorough", "stealth", "treasure_hunt"]
                    },
                    {
                        itemType: "volcanic_gems",
                        dropChance: 0.25,
                        rarityWeights: { epic: 0.6, legendary: 0.4 },
                        quantityRange: [1, 2],
                        items: ["fire_ruby", "lava_diamond", "inferno_gem"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 2.2, // Valuable volcanic materials + high difficulty
                    experienceBonus: 0.25, // High XP for dangerous area
                    fireResistanceBonus: 0.4, // 40% bonus to fire-related items
                    environmentType: "volcanic_region"
                }
            }
        },
        
        dragon_peak: {
            name: "Dragon's Peak",
            description: "The highest mountain, where legends say dragons nest.",
            type: "dungeon",
            unlocked: false,
            unlockRequirements: {
                and: [
                    { story: "fire_temple_cleared" },
                    { level: 25 },
                    { item: "dragon_scale" }
                ]
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
            },
            lootTable: {
                recommendedLevel: 30,
                explorationType: "legendary_dungeon",
                drops: [
                    {
                        itemType: "dragon_treasures",
                        dropChance: 0.9,
                        rarityWeights: { rare: 0.3, epic: 0.5, legendary: 0.2 },
                        quantityRange: [3, 8],
                        items: ["dragon_scale", "dragon_bone", "flame_crystal", "ancient_gold"]
                    },
                    {
                        itemType: "legendary_equipment",
                        dropChance: 0.6,
                        rarityWeights: { epic: 0.4, legendary: 0.6 },
                        equipmentTypes: ["dragonslayer_weapons", "dragon_armor", "fire_artifacts"]
                    },
                    {
                        itemType: "ancient_magic",
                        dropChance: 0.5,
                        rarityWeights: { epic: 0.3, legendary: 0.7 },
                        quantityRange: [1, 3],
                        spellTypes: ["dragon_magic", "fire_mastery", "ancient_arts"]
                    },
                    {
                        itemType: "priceless_gems",
                        dropChance: 0.4,
                        rarityWeights: { legendary: 1.0 },
                        quantityRange: [1, 2],
                        items: ["fire_ruby", "dragon_eye", "phoenix_tear"]
                    },
                    {
                        itemType: "realm_artifacts",
                        dropChance: 0.15,
                        rarityWeights: { legendary: 1.0 },
                        quantityRange: [1, 1],
                        items: ["time_relic", "world_shard", "creation_essence"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 5.0, // Dragon hoards
                    legendaryBonus: 0.5, // 50% bonus to legendary drops
                    environmentType: "dragon_lair",
                    bossArea: true
                }
            }
        },

        // ================================================
        // NEW STORY-ENHANCED AREAS
        // ================================================

        ancient_temple: {
            name: "Ancient Temple",
            description: "A forgotten temple that tests the worthy",
            type: "temple",
            difficulty: 15,
            spawnTable: [
                { species: "temple_guardian", weight: 40 },
                { species: "stone_golem", weight: 35 },
                { species: "spirit_shade", weight: 25 }
            ],
            connections: ["crystal_caves", "mountain_peak"],
            storyEvents: ["ancient_temple_trial", "convergence_point"],
            services: ["sanctuary"],
            backgroundMusic: "temple_theme",
            lootTable: {
                recommendedLevel: 15,
                explorationType: "sacred_site",
                drops: [
                    {
                        itemType: "sacred_artifacts",
                        dropChance: 0.6,
                        rarityWeights: { rare: 0.4, epic: 0.4, legendary: 0.2 },
                        quantityRange: [1, 3],
                        items: ["holy_relic", "ancient_blessing", "temple_key"]
                    },
                    {
                        itemType: "trial_rewards",
                        dropChance: 0.8,
                        rarityWeights: { uncommon: 0.3, rare: 0.5, epic: 0.2 },
                        quantityRange: [1, 2],
                        items: ["wisdom_scroll", "strength_potion", "spirit_gem"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 1.5, // Increased for sacred difficulty
                    experienceBonus: 0.2, // Spiritual learning bonus
                    spiritualBonus: 0.3, // 30% bonus to spirit-related items
                    environmentType: "sacred_temple"
                }
            }
        },

        rival_territory: {
            name: "Rival's Territory",
            description: "The domain of a skilled monster tamer rival",
            type: "rival_area",
            difficulty: 12,
            spawnTable: [
                { species: "trained_monster", weight: 50 },
                { species: "elite_creature", weight: 30 },
                { species: "rare_beast", weight: 20 }
            ],
            connections: ["plains", "deep_forest"],
            storyEvents: ["rival_tamer_encounter"],
            services: ["challenge_arena"],
            backgroundMusic: "rival_theme",
            lootTable: {
                recommendedLevel: 12,
                explorationType: "competitive_zone",
                drops: [
                    {
                        itemType: "competitive_rewards",
                        dropChance: 0.7,
                        rarityWeights: { uncommon: 0.4, rare: 0.4, epic: 0.2 },
                        quantityRange: [1, 2],
                        items: ["victory_trophy", "skill_manual", "training_gear"]
                    },
                    {
                        itemType: "rare_monsters",
                        dropChance: 0.3,
                        rarityWeights: { rare: 0.6, epic: 0.3, legendary: 0.1 },
                        quantityRange: [1, 1],
                        items: ["rare_capture", "elite_egg", "legendary_seed"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 1.4, // Competitive rewards
                    experienceBonus: 0.15, // Learning from rivalry
                    competitiveBonus: 0.25, // 25% bonus to skill-based rewards
                    environmentType: "rival_domain"
                }
            }
        },

        mystic_convergence: {
            name: "Mystic Convergence",
            description: "Where all paths meet at the end of the journey",
            type: "convergence_point",
            difficulty: 20,
            spawnTable: [
                { species: "cosmic_entity", weight: 30 },
                { species: "fate_weaver", weight: 30 },
                { species: "reality_guardian", weight: 25 },
                { species: "transcendent_being", weight: 15 }
            ],
            connections: ["dragon_peak", "ancient_temple", "spirit_realm"],
            storyEvents: ["convergence_point", "final_trial"],
            services: ["cosmic_altar"],
            backgroundMusic: "convergence_theme",
            lootTable: {
                recommendedLevel: 20,
                explorationType: "cosmic_nexus",
                drops: [
                    {
                        itemType: "cosmic_artifacts",
                        dropChance: 0.9,
                        rarityWeights: { epic: 0.4, legendary: 0.6 },
                        quantityRange: [2, 4],
                        items: ["cosmic_shard", "reality_fragment", "fate_thread"]
                    },
                    {
                        itemType: "transcendent_items",
                        dropChance: 0.5,
                        rarityWeights: { legendary: 1.0 },
                        quantityRange: [1, 2],
                        items: ["transcendence_core", "evolution_catalyst", "infinity_gem"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 3.5, // Increased cosmic rewards
                    experienceBonus: 0.5, // Massive end-game XP
                    transcendentBonus: 1.0, // Double chance for transcendent items
                    environmentType: "cosmic_nexus",
                    finalArea: true
                }
            }
        },

        class_trial_grounds: {
            name: "Trial Grounds",
            description: "Sacred grounds where classes prove their worth",
            type: "class_trials",
            difficulty: 10,
            spawnTable: [
                { species: "trial_guardian", weight: 40 },
                { species: "test_creature", weight: 35 },
                { species: "mentor_spirit", weight: 25 }
            ],
            connections: ["starting_village", "ancient_temple"],
            storyEvents: [
                "knight_honor_test",
                "wizard_arcane_mystery",
                "rogue_heist_opportunity",
                "paladin_faith_crisis",
                "ranger_nature_call",
                "warrior_ultimate_test"
            ],
            services: ["class_mentor", "trial_preparation"],
            backgroundMusic: "trial_theme",
            lootTable: {
                recommendedLevel: 10,
                explorationType: "class_specialization",
                drops: [
                    {
                        itemType: "class_artifacts",
                        dropChance: 0.8,
                        rarityWeights: { uncommon: 0.3, rare: 0.5, epic: 0.2 },
                        quantityRange: [1, 3],
                        items: ["class_relic", "specialization_tool", "mastery_token"]
                    },
                    {
                        itemType: "training_materials",
                        dropChance: 0.6,
                        rarityWeights: { common: 0.4, uncommon: 0.4, rare: 0.2 },
                        quantityRange: [2, 4],
                        items: ["skill_manual", "practice_weapon", "training_dummy"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 1.3, // Increased for training difficulty
                    experienceBonus: 0.25, // High XP for skill training
                    classBonus: 0.4, // 40% bonus to class-specific items
                    environmentType: "trial_grounds"
                }
            }
        },

        spirit_realm: {
            name: "Spirit Realm",
            description: "A realm between worlds where spirits dwell",
            type: "spiritual_plane",
            difficulty: 18,
            spawnTable: [
                { species: "spirit_guardian", weight: 40 },
                { species: "ethereal_beast", weight: 30 },
                { species: "phantom_creature", weight: 20 },
                { species: "soul_entity", weight: 10 }
            ],
            connections: ["abandoned_village", "mystic_convergence"],
            storyEvents: ["spirit_communion", "soul_trial"],
            services: ["spirit_guide", "ethereal_shop"],
            backgroundMusic: "spirit_theme",
            lootTable: {
                recommendedLevel: 18,
                explorationType: "spiritual_plane",
                drops: [
                    {
                        itemType: "spirit_essence",
                        dropChance: 0.8,
                        rarityWeights: { rare: 0.4, epic: 0.4, legendary: 0.2 },
                        quantityRange: [1, 3],
                        items: ["soul_crystal", "spirit_essence", "ethereal_shard"]
                    },
                    {
                        itemType: "spectral_equipment",
                        dropChance: 0.4,
                        rarityWeights: { epic: 0.6, legendary: 0.4 },
                        quantityRange: [1, 1],
                        items: ["spirit_blade", "ethereal_armor", "soul_amulet"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 1.8, // Increased for high-level mystical area
                    experienceBonus: 0.35, // High spiritual learning
                    spiritualBonus: 1.0, // Double spiritual item drops
                    environmentType: "spirit_realm",
                    mysticalArea: true
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
            backgroundMusic: "mystic_theme",
            lootTable: {
                recommendedLevel: 14,
                explorationType: "mystical_sanctuary",
                drops: [
                    {
                        itemType: "nature_blessing",
                        dropChance: 0.90,
                        rarityWeights: { uncommon: 0.3, rare: 0.5, epic: 0.2 },
                        quantityRange: [1, 3],
                        items: ["fairy_dust", "unicorn_tear", "spirit_blessing"]
                    },
                    {
                        itemType: "magical_herbs",
                        dropChance: 0.80,
                        rarityWeights: { rare: 0.6, epic: 0.35, legendary: 0.05 },
                        quantityRange: [2, 4],
                        items: ["moonflower", "starlight_moss", "eternal_bloom"]
                    },
                    {
                        itemType: "druidic_artifacts",
                        dropChance: 0.60,
                        rarityWeights: { rare: 0.4, epic: 0.5, legendary: 0.1 },
                        equipmentTypes: ["nature_staff", "grove_robes", "spirit_amulet"]
                    },
                    {
                        itemType: "treant_gifts",
                        dropChance: 0.45,
                        rarityWeights: { epic: 0.7, legendary: 0.3 },
                        quantityRange: [1, 2],
                        items: ["ancient_bark", "life_seed", "wisdom_fruit"]
                    },
                    {
                        itemType: "mystic_grove_exclusive",
                        dropChance: 0.15,
                        rarityWeights: { epic: 0.4, legendary: 0.6 },
                        quantityRange: [1, 1],
                        items: ["grove_heart", "nature_crown", "world_tree_essence"],
                        areaExclusive: true,
                        explorationTypes: ["thorough", "stealth"],
                        classRestricted: ["ranger", "druid"]
                    },
                    {
                        itemType: "sanctuary_tokens",
                        dropChance: 0.35,
                        rarityWeights: { legendary: 1.0 },
                        quantityRange: [1, 1],
                        items: ["grove_protection", "nature_harmony", "eternal_sanctuary"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 0.7, // Slightly increased for mystical rewards
                    experienceBonus: 0.3, // High spiritual XP
                    natureBonus: 1.5, // 150% bonus to nature items
                    environmentType: "mystical_grove",
                    classRestricted: true
                }
            }
        },
        
        ancient_ruins: {
            name: "Ancient Ruins",
            description: "Mysterious structures from a forgotten civilization.",
            type: "dungeon",
            unlocked: false,
            unlockRequirements: {
                and: [
                    { story: "all_temples_cleared" },
                    { level: 30 },
                    { item: "ancient_key" }
                ]
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
            },
            lootTable: {
                recommendedLevel: 32,
                explorationType: "ancient_ruins",
                drops: [
                    {
                        itemType: "ancient_relics",
                        dropChance: 0.90,
                        rarityWeights: { epic: 0.4, legendary: 0.6 },
                        quantityRange: [2, 4],
                        items: ["civilization_fragment", "ancient_technology", "lost_knowledge"]
                    },
                    {
                        itemType: "guardian_remnants",
                        dropChance: 0.75,
                        rarityWeights: { epic: 0.5, legendary: 0.5 },
                        quantityRange: [1, 3],
                        items: ["golem_core", "guardian_essence", "construct_blueprint"]
                    },
                    {
                        itemType: "ancient_weapons",
                        dropChance: 0.60,
                        rarityWeights: { epic: 0.3, legendary: 0.7 },
                        equipmentTypes: ["relic_sword", "ancient_armor", "timeless_artifacts"]
                    },
                    {
                        itemType: "spirit_essence",
                        dropChance: 0.50,
                        rarityWeights: { legendary: 1.0 },
                        quantityRange: [1, 2],
                        items: ["ancient_soul", "forgotten_spirit", "eternal_memory"]
                    },
                    {
                        itemType: "civilization_secrets",
                        dropChance: 0.20,
                        rarityWeights: { legendary: 1.0 },
                        quantityRange: [1, 1],
                        items: ["ultimate_knowledge", "creation_codex", "world_keystone"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 4.0, // Ancient treasures
                    artificientBonus: 1.0, // Double chance for ancient artifacts
                    environmentType: "ancient_ruins",
                    bossArea: true
                }
            }
        },

        // Branching Story Areas
        scholar_library: {
            name: "Scholar's Library",
            description: "A vast repository of ancient knowledge and magical tomes.",
            type: "special",
            unlocked: false,
            unlockRequirements: {
                and: [
                    { or: [
                        { story: "mystic_grove_discovery" },
                        { story: "ruins_puzzle" }
                    ]},
                    { or: [
                        { character_class: ["wizard", "paladin"] },
                        { item: "scholar_recommendation" }
                    ]}
                ]
            },
            encounterRate: 10,
            monsters: ["knowledge_spirit", "ancient_tome", "guardian_book"],
            spawnTable: [
                { species: "knowledge_spirit", weight: 60 },
                { species: "guardian_book", weight: 30 },
                { species: "ancient_tome", weight: 10 }
            ],
            connections: ["mystic_grove", "ancient_ruins"],
            storyEvents: ["forbidden_knowledge", "library_master"],
            services: ["spell_research", "knowledge_exchange"],
            backgroundMusic: "library_theme",
            storyBranch: "scholar_path",
            lootTable: {
                recommendedLevel: 16,
                explorationType: "knowledge_sanctuary",
                drops: [
                    {
                        itemType: "spell_scrolls",
                        dropChance: 0.95,
                        rarityWeights: { uncommon: 0.3, rare: 0.5, epic: 0.18, legendary: 0.02 },
                        quantityRange: [2, 5],
                        spellTypes: ["arcane_knowledge", "divine_wisdom", "ancient_magic"]
                    },
                    {
                        itemType: "knowledge_tomes",
                        dropChance: 0.80,
                        rarityWeights: { rare: 0.4, epic: 0.5, legendary: 0.1 },
                        quantityRange: [1, 3],
                        items: ["wisdom_tome", "arcane_compendium", "forbidden_knowledge"]
                    },
                    {
                        itemType: "scholarly_equipment",
                        dropChance: 0.60,
                        rarityWeights: { rare: 0.6, epic: 0.35, legendary: 0.05 },
                        equipmentTypes: ["scholar_robes", "wisdom_staff", "knowledge_crystal"]
                    },
                    {
                        itemType: "research_materials",
                        dropChance: 0.70,
                        rarityWeights: { uncommon: 0.4, rare: 0.4, epic: 0.2 },
                        quantityRange: [1, 4],
                        items: ["ink_essence", "parchment_scroll", "binding_reagent"]
                    },
                    {
                        itemType: "scholar_library_exclusive",
                        dropChance: 0.10,
                        rarityWeights: { epic: 0.3, legendary: 0.7 },
                        quantityRange: [1, 1],
                        items: ["omniscience_scroll", "master_librarian_key", "infinite_knowledge_crystal"],
                        areaExclusive: true,
                        explorationTypes: ["thorough", "treasure_hunt"],
                        classRestricted: ["wizard", "paladin"]
                    },
                    {
                        itemType: "master_secrets",
                        dropChance: 0.25,
                        rarityWeights: { epic: 0.6, legendary: 0.4 },
                        quantityRange: [1, 1],
                        items: ["ultimate_spell", "creation_formula", "reality_codex"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 1.4, // Increased for rare knowledge area
                    experienceBonus: 0.4, // Massive learning bonus
                    spellBonus: 2.0, // 200% bonus to spell-related items
                    environmentType: "library",
                    classRestricted: true
                }
            }
        },

        warrior_training_ground: {
            name: "Warrior Training Ground",
            description: "A place where the strongest fighters test their mettle.",
            type: "special",
            unlocked: false,
            unlockRequirements: {
                and: [
                    { or: [
                        { boss_defeated: "alpha_wolf" },
                        { boss_defeated: "cave_troll" }
                    ]},
                    { or: [
                        { character_class: ["knight", "warrior", "ranger"] },
                        { level: 15 }
                    ]}
                ]
            },
            encounterRate: 40,
            monsters: ["training_dummy", "sparring_partner", "weapon_master"],
            spawnTable: [
                { species: "sparring_partner", weight: 50 },
                { species: "weapon_master", weight: 30 },
                { species: "training_dummy", weight: 20 }
            ],
            connections: ["wolf_den", "cave_entrance"],
            storyEvents: ["warrior_trial", "master_challenge"],
            services: ["weapon_training", "combat_lessons"],
            backgroundMusic: "training_theme",
            storyBranch: "warrior_path",
            lootTable: {
                recommendedLevel: 16,
                explorationType: "training_facility",
                drops: [
                    {
                        itemType: "warrior_equipment",
                        dropChance: 0.85,
                        rarityWeights: { uncommon: 0.3, rare: 0.5, epic: 0.2 },
                        equipmentTypes: ["battle_armor", "master_weapons", "warrior_accessories"]
                    },
                    {
                        itemType: "training_manuals",
                        dropChance: 0.75,
                        rarityWeights: { rare: 0.6, epic: 0.35, legendary: 0.05 },
                        quantityRange: [1, 3],
                        items: ["combat_technique", "weapon_mastery", "battle_strategy"]
                    },
                    {
                        itemType: "strength_enhancers",
                        dropChance: 0.65,
                        rarityWeights: { uncommon: 0.4, rare: 0.4, epic: 0.2 },
                        quantityRange: [1, 4],
                        items: ["power_potion", "endurance_serum", "warrior_brew"]
                    },
                    {
                        itemType: "master_crafted_gear",
                        dropChance: 0.45,
                        rarityWeights: { epic: 0.7, legendary: 0.3 },
                        quantityRange: [1, 2],
                        equipmentTypes: ["grandmaster_weapons", "legendary_armor", "champion_artifacts"]
                    },
                    {
                        itemType: "warrior_honors",
                        dropChance: 0.30,
                        rarityWeights: { legendary: 1.0 },
                        quantityRange: [1, 1],
                        items: ["champion_medal", "master_recognition", "warrior_legacy"]
                    },
                    {
                        itemType: "combat_spoils",
                        dropChance: 0.8,
                        rarityWeights: { uncommon: 0.6, rare: 0.3, epic: 0.1 },
                        quantityRange: [1, 3],
                        items: ["battle_trophy", "combat_gear", "victory_token"],
                        explorationTypes: ["combat_patrol"]
                    },
                    {
                        itemType: "hidden_training_cache",
                        dropChance: 0.4,
                        rarityWeights: { rare: 0.5, epic: 0.4, legendary: 0.1 },
                        quantityRange: [1, 2],
                        items: ["secret_technique", "master_scroll", "ancient_weapon_fragment"],
                        explorationTypes: ["thorough", "stealth"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 1.5, // Increased for training rewards
                    experienceBonus: 0.35, // High combat learning
                    combatBonus: 1.5, // 150% bonus to combat-related items
                    environmentType: "training_ground",
                    classRestricted: true
                }
            }
        },

        shadow_realm: {
            name: "Shadow Realm",
            description: "A dark dimension where evil forces gather strength.",
            type: "secret",
            unlocked: false,
            unlockRequirements: {
                or: [
                    {
                        and: [
                            { story: "darkness_awakened" },
                            { item: "shadow_key" },
                            { level: 20 }
                        ]
                    },
                    {
                        and: [
                            { character_class: ["rogue", "assassin"] },
                            { story: "shadow_guild_contact" },
                            { item: "darkness_artifact" }
                        ]
                    }
                ]
            },
            encounterRate: 90,
            monsters: ["shadow_fiend", "void_walker", "darkness_incarnate"],
            spawnTable: [
                { species: "shadow_fiend", weight: 50 },
                { species: "void_walker", weight: 35 },
                { species: "darkness_incarnate", weight: 15 }
            ],
            connections: ["ancient_ruins"],
            storyEvents: ["shadow_corruption", "light_vs_dark"],
            services: [],
            backgroundMusic: "shadow_theme",
            storyBranch: "shadow_path",
            boss: {
                name: "Shadow Lord",
                species: "shadow_lord",
                level: 45,
                reward: {
                    exp: 8000,
                    gold: 3000,
                    items: ["shadow_blade", "darkness_crown", "void_crystal"]
                }
            },
            lootTable: {
                recommendedLevel: 28,
                explorationType: "shadow_dimension",
                drops: [
                    {
                        itemType: "shadow_essence",
                        dropChance: 0.90,
                        rarityWeights: { epic: 0.4, legendary: 0.6 },
                        quantityRange: [2, 4],
                        items: ["void_fragment", "darkness_crystal", "shadow_core"]
                    },
                    {
                        itemType: "forbidden_artifacts",
                        dropChance: 0.75,
                        rarityWeights: { epic: 0.5, legendary: 0.5 },
                        equipmentTypes: ["shadow_weapons", "void_armor", "darkness_regalia"]
                    },
                    {
                        itemType: "corrupted_power",
                        dropChance: 0.60,
                        rarityWeights: { legendary: 1.0 },
                        quantityRange: [1, 2],
                        items: ["corruption_seed", "void_whisper", "shadow_mastery"]
                    },
                    {
                        itemType: "dimensional_materials",
                        dropChance: 0.50,
                        rarityWeights: { epic: 0.3, legendary: 0.7 },
                        quantityRange: [1, 3],
                        items: ["reality_tear", "dimension_shard", "void_metal"]
                    },
                    {
                        itemType: "shadow_realm_exclusive",
                        dropChance: 0.08,
                        rarityWeights: { legendary: 1.0 },
                        quantityRange: [1, 1],
                        items: ["void_lord_essence", "shadow_dimension_key", "absolute_darkness"],
                        areaExclusive: true,
                        explorationTypes: ["thorough", "stealth", "treasure_hunt"],
                        classRestricted: ["rogue", "assassin"]
                    },
                    {
                        itemType: "shadow_lord_relics",
                        dropChance: 0.20,
                        rarityWeights: { legendary: 1.0 },
                        quantityRange: [1, 1],
                        items: ["shadow_throne_fragment", "void_crown_shard", "darkness_eternal"]
                    },
                    {
                        itemType: "stealth_rewards",
                        dropChance: 0.7,
                        rarityWeights: { rare: 0.4, epic: 0.5, legendary: 0.1 },
                        quantityRange: [1, 2],
                        items: ["shadow_cloak_fragment", "void_step_boots", "stealth_mastery_tome"],
                        explorationTypes: ["stealth"]
                    },
                    {
                        itemType: "dimensional_treasures",
                        dropChance: 0.4,
                        rarityWeights: { epic: 0.3, legendary: 0.7 },
                        quantityRange: [1, 3],
                        items: ["reality_anchor", "void_compass", "dimensional_key"],
                        explorationTypes: ["treasure_hunt"]
                    }
                ],
                areaBonus: {
                    goldMultiplier: 2.8, // Increased shadow treasures
                    experienceBonus: 0.3, // High XP for dangerous secret area
                    corruptionBonus: 2.0, // 200% bonus to dark artifacts
                    environmentType: "shadow_realm",
                    bossArea: true,
                    secretArea: true
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
    getUnlockedAreas: function(storyProgress, playerLevel, inventory, playerClass = null, defeatedBosses = []) {
        return Object.keys(this.areas).filter(areaName => {
            return this.isAreaUnlocked(areaName, storyProgress, playerLevel, inventory, playerClass, defeatedBosses);
        });
    },
    
    /**
     * Check if an area is unlocked
     */
    isAreaUnlocked: function(areaName, storyProgress, playerLevel, inventory, playerClass = null, defeatedBosses = []) {
        const area = this.getArea(areaName);
        if (!area) {
            console.warn(`Area not found: ${areaName}`);
            return false;
        }

        // Always unlocked areas
        if (area.unlocked) return true;

        // Areas with no unlock requirements are available by default
        const requirements = area.unlockRequirements;
        if (!requirements || Object.keys(requirements).length === 0) {
            return true;
        }

        try {
            // Normalize input parameters to prevent errors
            const normalizedParams = this.normalizeUnlockParameters(
                storyProgress, playerLevel, inventory, playerClass, defeatedBosses
            );

            // Handle complex unlock conditions with AND/OR logic
            if (requirements.and || requirements.or) {
                return this.evaluateUnlockConditions(
                    requirements,
                    normalizedParams.storyProgress,
                    normalizedParams.playerLevel,
                    normalizedParams.inventory,
                    normalizedParams.playerClass,
                    normalizedParams.defeatedBosses
                );
            }

            // Legacy simple requirements (backward compatibility)
            return this.evaluateLegacyRequirements(
                requirements,
                normalizedParams.storyProgress,
                normalizedParams.playerLevel,
                normalizedParams.inventory,
                normalizedParams.playerClass,
                normalizedParams.defeatedBosses
            );

        } catch (error) {
            console.error(`Error evaluating unlock conditions for ${areaName}:`, error);
            return false;
        }
    },

    /**
     * Normalize unlock parameters to handle various input types safely
     */
    normalizeUnlockParameters: function(storyProgress, playerLevel, inventory, playerClass, defeatedBosses) {
        return {
            storyProgress: Array.isArray(storyProgress) ? storyProgress : [],
            playerLevel: typeof playerLevel === 'number' ? Math.max(0, playerLevel) : 1,
            inventory: Array.isArray(inventory) ? inventory : [],
            playerClass: playerClass || null,
            defeatedBosses: Array.isArray(defeatedBosses) ? defeatedBosses : []
        };
    },

    /**
     * Evaluate legacy simple requirements for backward compatibility
     */
    evaluateLegacyRequirements: function(requirements, storyProgress, playerLevel, inventory, playerClass, defeatedBosses) {
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
        if (requirements.character_class) {
            const allowedClasses = Array.isArray(requirements.character_class)
                ? requirements.character_class
                : [requirements.character_class];
            if (!allowedClasses.includes(playerClass)) {
                return false;
            }
        }

        // Check boss defeated requirements
        if (requirements.boss_defeated && !defeatedBosses.includes(requirements.boss_defeated)) {
            return false;
        }

        return true;
    },

    /**
     * Evaluate complex unlock conditions with AND/OR logic
     */
    evaluateUnlockConditions: function(requirements, storyProgress, playerLevel, inventory, playerClass, defeatedBosses) {
        // Handle empty or invalid requirements
        if (!requirements || typeof requirements !== 'object') {
            return true;
        }

        if (requirements.and) {
            // All conditions in AND array must be true
            if (!Array.isArray(requirements.and) || requirements.and.length === 0) {
                return true;
            }
            return requirements.and.every(condition =>
                this.evaluateSingleCondition(condition, storyProgress, playerLevel, inventory, playerClass, defeatedBosses)
            );
        }

        if (requirements.or) {
            // At least one condition in OR array must be true
            if (!Array.isArray(requirements.or) || requirements.or.length === 0) {
                return true;
            }
            return requirements.or.some(condition =>
                this.evaluateSingleCondition(condition, storyProgress, playerLevel, inventory, playerClass, defeatedBosses)
            );
        }

        // Single condition
        return this.evaluateSingleCondition(requirements, storyProgress, playerLevel, inventory, playerClass, defeatedBosses);
    },

    /**
     * Evaluate a single unlock condition
     */
    evaluateSingleCondition: function(condition, storyProgress, playerLevel, inventory, playerClass, defeatedBosses) {
        // Handle empty or invalid conditions
        if (!condition || typeof condition !== 'object') {
            return true;
        }

        // Handle nested AND/OR conditions recursively
        if (condition.and || condition.or) {
            return this.evaluateUnlockConditions(condition, storyProgress, playerLevel, inventory, playerClass, defeatedBosses);
        }

        try {
            // Story flag requirement
            if (condition.story) {
                const storyFlag = typeof condition.story === 'string' ? condition.story : String(condition.story);
                return storyProgress.includes(storyFlag);
            }

            // Level requirement
            if (condition.level !== undefined) {
                const requiredLevel = typeof condition.level === 'number' ? condition.level : parseInt(condition.level, 10);
                return !isNaN(requiredLevel) && playerLevel >= requiredLevel;
            }

            // Item requirement
            if (condition.item) {
                const requiredItem = typeof condition.item === 'string' ? condition.item : String(condition.item);
                return inventory.includes(requiredItem);
            }

            // Character class requirement
            if (condition.character_class) {
                const allowedClasses = Array.isArray(condition.character_class)
                    ? condition.character_class
                    : [condition.character_class];
                return allowedClasses.includes(playerClass);
            }

            // Boss defeated requirement (supports both 'boss_defeated' and 'defeated_boss' keys)
            if (condition.boss_defeated || condition.defeated_boss) {
                const requiredBoss = condition.boss_defeated || condition.defeated_boss;
                const bossName = typeof requiredBoss === 'string' ? requiredBoss : String(requiredBoss);
                return defeatedBosses.includes(bossName);
            }

            // Multiple story flags requirement (any one must be met)
            if (condition.story_flags && Array.isArray(condition.story_flags)) {
                return condition.story_flags.some(flag => storyProgress.includes(flag));
            }

            // Multiple items requirement (all must be present)
            if (condition.items && Array.isArray(condition.items)) {
                return condition.items.every(item => inventory.includes(item));
            }

            // Multiple bosses defeated requirement (all must be defeated)
            if (condition.bosses_defeated && Array.isArray(condition.bosses_defeated)) {
                return condition.bosses_defeated.every(boss => defeatedBosses.includes(boss));
            }

            // Level range requirement
            if (condition.level_min !== undefined || condition.level_max !== undefined) {
                const minLevel = condition.level_min !== undefined ? condition.level_min : 0;
                const maxLevel = condition.level_max !== undefined ? condition.level_max : Infinity;
                return playerLevel >= minLevel && playerLevel <= maxLevel;
            }

        } catch (error) {
            console.warn('Error evaluating single condition:', condition, error);
            return false;
        }

        // Unknown condition type - log warning and default to false for safety
        const conditionKeys = Object.keys(condition);
        if (conditionKeys.length > 0) {
            console.warn('Unknown unlock condition type:', conditionKeys[0], 'in condition:', condition);
        }
        return false;
    },

    /**
     * Validate unlock requirements structure for debugging
     */
    validateUnlockRequirements: function(areaName, requirements) {
        if (!requirements) return { valid: true, issues: [] };

        const issues = [];
        const validConditionTypes = [
            'story', 'level', 'item', 'character_class', 'boss_defeated', 'defeated_boss',
            'story_flags', 'items', 'bosses_defeated', 'level_min', 'level_max', 'and', 'or'
        ];

        const validateCondition = (condition, path = '') => {
            if (!condition || typeof condition !== 'object') {
                issues.push(`${path}: Invalid condition structure`);
                return;
            }

            const conditionKeys = Object.keys(condition);

            // Check for unknown condition types
            for (const key of conditionKeys) {
                if (!validConditionTypes.includes(key)) {
                    issues.push(`${path}: Unknown condition type '${key}'`);
                }
            }

            // Validate nested conditions
            if (condition.and) {
                if (!Array.isArray(condition.and)) {
                    issues.push(`${path}.and: Should be an array`);
                } else {
                    condition.and.forEach((subCondition, index) => {
                        validateCondition(subCondition, `${path}.and[${index}]`);
                    });
                }
            }

            if (condition.or) {
                if (!Array.isArray(condition.or)) {
                    issues.push(`${path}.or: Should be an array`);
                } else {
                    condition.or.forEach((subCondition, index) => {
                        validateCondition(subCondition, `${path}.or[${index}]`);
                    });
                }
            }

            // Validate specific condition values
            if (condition.level !== undefined && typeof condition.level !== 'number') {
                issues.push(`${path}.level: Should be a number`);
            }

            if (condition.character_class && !Array.isArray(condition.character_class) && typeof condition.character_class !== 'string') {
                issues.push(`${path}.character_class: Should be a string or array of strings`);
            }

            if (condition.level_min !== undefined && typeof condition.level_min !== 'number') {
                issues.push(`${path}.level_min: Should be a number`);
            }

            if (condition.level_max !== undefined && typeof condition.level_max !== 'number') {
                issues.push(`${path}.level_max: Should be a number`);
            }
        };

        validateCondition(requirements, `${areaName}.unlockRequirements`);

        return {
            valid: issues.length === 0,
            issues
        };
    },

    /**
     * Get performance metrics for unlock condition evaluation
     */
    getUnlockConditionComplexity: function(requirements) {
        if (!requirements) return { depth: 0, conditions: 0 };

        let maxDepth = 0;
        let totalConditions = 0;

        const analyzeCondition = (condition, depth = 0) => {
            if (!condition || typeof condition !== 'object') return;

            maxDepth = Math.max(maxDepth, depth);

            if (condition.and) {
                condition.and.forEach(subCondition => analyzeCondition(subCondition, depth + 1));
            } else if (condition.or) {
                condition.or.forEach(subCondition => analyzeCondition(subCondition, depth + 1));
            } else {
                totalConditions++;
            }
        };

        analyzeCondition(requirements);

        return {
            depth: maxDepth,
            conditions: totalConditions,
            complexity: maxDepth * totalConditions // Simple complexity metric
        };
    },

    /**
     * Optimize unlock condition evaluation with caching for complex areas
     */
    isAreaUnlockedOptimized: function(areaName, storyProgress, playerLevel, inventory, playerClass = null, defeatedBosses = []) {
        const area = this.getArea(areaName);
        if (!area) return false;

        // Cache key for this specific combination
        const cacheKey = this.generateUnlockCacheKey(areaName, storyProgress, playerLevel, inventory, playerClass, defeatedBosses);

        // Check cache for recent evaluations (implement simple cache if needed)
        if (this.unlockCache && this.unlockCache[cacheKey]) {
            const cached = this.unlockCache[cacheKey];
            const cacheAge = Date.now() - cached.timestamp;

            // Use cached result if less than 5 seconds old
            if (cacheAge < 5000) {
                return cached.result;
            }
        }

        // Evaluate normally
        const result = this.isAreaUnlocked(areaName, storyProgress, playerLevel, inventory, playerClass, defeatedBosses);

        // Cache the result for complex areas
        const requirements = area.unlockRequirements;
        if (requirements && (requirements.and || requirements.or)) {
            if (!this.unlockCache) this.unlockCache = {};
            this.unlockCache[cacheKey] = {
                result,
                timestamp: Date.now()
            };
        }

        return result;
    },

    /**
     * Generate cache key for unlock evaluation
     */
    generateUnlockCacheKey: function(areaName, storyProgress, playerLevel, inventory, playerClass, defeatedBosses) {
        const sortedStory = [...storyProgress].sort();
        const sortedInventory = [...inventory].sort();
        const sortedBosses = [...defeatedBosses].sort();

        return `${areaName}:${sortedStory.join(',')}:${playerLevel}:${sortedInventory.join(',')}:${playerClass}:${sortedBosses.join(',')}`;
    },

    /**
     * Clear unlock evaluation cache
     */
    clearUnlockCache: function() {
        this.unlockCache = {};
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

        // Enhanced level scaling based on area difficulty
        const basePlayerLevel = playerLevel || 1;
        let levelVariance, levelRange;

        // Determine area difficulty and level scaling
        if (areaName === 'starting_village') {
            levelVariance = 0; // No variance in tutorial area
            levelRange = [1, 1];
        } else if (areaName === 'forest_path') {
            levelVariance = 1; // ±1 level
            levelRange = [1, 3];
        } else if (['deep_forest', 'plains'].includes(areaName)) {
            levelVariance = 2; // ±2 levels
            levelRange = [Math.max(1, basePlayerLevel - 1), basePlayerLevel + 3];
        } else if (['mountains', 'cave_entrance'].includes(areaName)) {
            levelVariance = 2;
            levelRange = [Math.max(1, basePlayerLevel), basePlayerLevel + 4];
        } else if (['fire_temple', 'mystic_grove'].includes(areaName)) {
            levelVariance = 3;
            levelRange = [Math.max(1, basePlayerLevel + 1), basePlayerLevel + 6];
        } else {
            // End-game areas
            levelVariance = 4;
            levelRange = [Math.max(1, basePlayerLevel + 2), basePlayerLevel + 8];
        }

        // Calculate encounter level with strategic variance
        let encounterLevel;
        if (Math.random() < 0.1) {
            // 10% chance for a significantly stronger enemy
            encounterLevel = Math.min(levelRange[1], basePlayerLevel + levelVariance + 2);
        } else if (Math.random() < 0.3) {
            // 20% chance for slightly weaker enemy
            encounterLevel = Math.max(levelRange[0], basePlayerLevel - Math.floor(levelVariance / 2));
        } else {
            // 70% chance for level appropriate enemy
            const variance = Math.floor(Math.random() * (levelVariance * 2 + 1)) - levelVariance;
            encounterLevel = Math.max(levelRange[0], Math.min(levelRange[1], basePlayerLevel + variance));
        }

        // Prefer local weighted spawn table if present
        if (Array.isArray(area.spawnTable) && area.spawnTable.length > 0) {
            const species = this.chooseWeighted(area.spawnTable);
            return { species, level: encounterLevel };
        }

        // Fallback to MonsterData
        if (typeof MonsterData !== 'undefined') {
            return MonsterData.generateEncounter(areaName, encounterLevel);
        }

        // Final fallback: uniform random from area.monsters
        const idx = Math.floor(Math.random() * monsters.length);
        const species = monsters[idx];
        return { species, level: encounterLevel };
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
    },

    /**
     * Get detailed unlock status for an area (for progression indicators)
     */
    getAreaUnlockStatus: function(areaName, storyProgress, playerLevel, inventory, playerClass = null, defeatedBosses = []) {
        const area = this.getArea(areaName);
        if (!area) return { unlocked: false, requirements: [], missing: [] };

        if (area.unlocked) {
            return { unlocked: true, requirements: [], missing: [] };
        }

        const requirements = area.unlockRequirements;
        const status = {
            unlocked: this.isAreaUnlocked(areaName, storyProgress, playerLevel, inventory, playerClass, defeatedBosses),
            requirements: [],
            missing: []
        };

        // Analyze requirements for detailed status
        if (requirements.and || requirements.or) {
            this.analyzeComplexRequirements(requirements, storyProgress, playerLevel, inventory, playerClass, defeatedBosses, status);
        } else {
            // Legacy simple requirements
            this.analyzeSimpleRequirements(requirements, storyProgress, playerLevel, inventory, playerClass, defeatedBosses, status);
        }

        return status;
    },

    /**
     * Analyze complex unlock requirements for detailed status
     */
    analyzeComplexRequirements: function(requirements, storyProgress, playerLevel, inventory, playerClass, defeatedBosses, status) {
        if (requirements.and) {
            requirements.and.forEach((condition, index) => {
                const conditionMet = this.evaluateSingleCondition(condition, storyProgress, playerLevel, inventory, playerClass, defeatedBosses);
                const description = this.getConditionDescription(condition);

                status.requirements.push({
                    type: 'and',
                    index: index,
                    description: description,
                    met: conditionMet
                });

                if (!conditionMet) {
                    status.missing.push(description);
                }
            });
        } else if (requirements.or) {
            requirements.or.forEach((condition, index) => {
                const conditionMet = this.evaluateSingleCondition(condition, storyProgress, playerLevel, inventory, playerClass, defeatedBosses);
                const description = this.getConditionDescription(condition);

                status.requirements.push({
                    type: 'or',
                    index: index,
                    description: description,
                    met: conditionMet
                });
            });

            // For OR conditions, add to missing only if ALL conditions are false
            const anyMet = requirements.or.some(condition =>
                this.evaluateSingleCondition(condition, storyProgress, playerLevel, inventory, playerClass, defeatedBosses)
            );
            if (!anyMet) {
                status.missing.push('One of: ' + requirements.or.map(c => this.getConditionDescription(c)).join(' OR '));
            }
        }
    },

    /**
     * Analyze simple unlock requirements for detailed status
     */
    analyzeSimpleRequirements: function(requirements, storyProgress, playerLevel, inventory, playerClass, defeatedBosses, status) {
        if (requirements.story) {
            const met = storyProgress.includes(requirements.story);
            status.requirements.push({
                type: 'story',
                description: `Story progress: ${requirements.story}`,
                met: met
            });
            if (!met) status.missing.push(`Story progress: ${requirements.story}`);
        }

        if (requirements.level) {
            const met = playerLevel >= requirements.level;
            status.requirements.push({
                type: 'level',
                description: `Level ${requirements.level}`,
                met: met
            });
            if (!met) status.missing.push(`Level ${requirements.level} (current: ${playerLevel})`);
        }

        if (requirements.item) {
            const met = inventory.includes(requirements.item);
            status.requirements.push({
                type: 'item',
                description: `Item: ${requirements.item}`,
                met: met
            });
            if (!met) status.missing.push(`Item: ${requirements.item}`);
        }

        if (requirements.character_class) {
            const met = requirements.character_class.includes(playerClass);
            status.requirements.push({
                type: 'class',
                description: `Class: ${requirements.character_class.join(' or ')}`,
                met: met
            });
            if (!met) status.missing.push(`Class: ${requirements.character_class.join(' or ')} (current: ${playerClass})`);
        }
    },

    /**
     * Get human-readable description of a condition
     */
    getConditionDescription: function(condition) {
        if (condition.story) return `Story: ${condition.story}`;
        if (condition.level) return `Level ${condition.level}`;
        if (condition.item) return `Item: ${condition.item}`;
        if (condition.character_class) {
            const classes = Array.isArray(condition.character_class) ? condition.character_class : [condition.character_class];
            return `Class: ${classes.join(' or ')}`;
        }
        if (condition.boss_defeated) return `Boss defeated: ${condition.boss_defeated}`;
        if (condition.and) return `All of: (${condition.and.map(c => this.getConditionDescription(c)).join(', ')})`;
        if (condition.or) return `One of: (${condition.or.map(c => this.getConditionDescription(c)).join(' OR ')})`;
        return 'Unknown requirement';
    }
};

// Make available globally
window.AreaData = AreaData;