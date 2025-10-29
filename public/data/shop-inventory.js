/**
 * Shop Inventory Definitions
 * Maps items to shops with prices, stock, and unlock requirements
 * Item IDs reference ItemData from items.js
 */

const ShopInventoryData = {
    // ================================================
    // MISTWOOD GENERAL STORE
    // ================================================
    mistwood_general_store: [
        // Basic Consumables - Always available
        {
            itemId: "health_potion",
            price: 50,
            sellPrice: 25,
            stock: -1, // Unlimited
            unlocked: true,
            featured: true
        },
        {
            itemId: "mana_potion",
            price: 60,
            sellPrice: 30,
            stock: -1,
            unlocked: true,
            featured: true
        },
        {
            itemId: "antidote",
            price: 30,
            sellPrice: 15,
            stock: -1,
            unlockRequirements: {
                level: 2
            }
        },
        {
            itemId: "rope",
            price: 20,
            sellPrice: 10,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "torch",
            price: 15,
            sellPrice: 7,
            stock: -1,
            unlocked: true
        },

        // Better Consumables - Level locked
        {
            itemId: "greater_health_potion",
            price: 150,
            sellPrice: 75,
            stock: -1,
            unlockRequirements: {
                level: 5
            }
        },
        {
            itemId: "greater_mana_potion",
            price: 180,
            sellPrice: 90,
            stock: -1,
            unlockRequirements: {
                level: 5
            }
        },
        {
            itemId: "elixir",
            price: 300,
            sellPrice: 150,
            stock: 5,
            unlockRequirements: {
                level: 8
            },
            featured: true
        }
    ],

    // ================================================
    // BOB'S BLADE EMPORIUM (Weapon Shop)
    // ================================================
    oakwood_weapon_emporium: [
        // Knight Weapons
        {
            itemId: "iron_sword",
            price: 250,
            sellPrice: 125,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "steel_sword",
            price: 500,
            sellPrice: 225,
            stock: -1,
            unlockRequirements: {
                level: 5
            },
            featured: true
        },
        {
            itemId: "blessed_mace",
            price: 400,
            sellPrice: 180,
            stock: 3,
            unlockRequirements: {
                level: 4
            }
        },

        // Wizard Weapons
        {
            itemId: "oak_staff",
            price: 200,
            sellPrice: 90,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "crystal_staff",
            price: 800,
            sellPrice: 360,
            stock: 2,
            unlockRequirements: {
                level: 8
            },
            featured: true
        },

        // Rogue Weapons
        {
            itemId: "steel_dagger",
            price: 180,
            sellPrice: 80,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "poisoned_blade",
            price: 450,
            sellPrice: 200,
            stock: 3,
            unlockRequirements: {
                level: 6
            }
        },

        // Ranger Weapons
        {
            itemId: "hunting_bow",
            price: 300,
            sellPrice: 135,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "elvish_bow",
            price: 900,
            sellPrice: 405,
            stock: 2,
            unlockRequirements: {
                level: 10
            },
            featured: true
        },

        // Warrior Weapons
        {
            itemId: "battle_axe",
            price: 320,
            sellPrice: 145,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "great_axe",
            price: 650,
            sellPrice: 290,
            stock: 3,
            unlockRequirements: {
                level: 7
            }
        }
    ],

    // ================================================
    // DORA'S DEFENSE DEPOT (Armor Shop)
    // ================================================
    oakwood_armor_depot: [
        // Light Armor
        {
            itemId: "leather_armor",
            price: 150,
            sellPrice: 70,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "leather_vest",
            price: 120,
            sellPrice: 55,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "cloth_robe",
            price: 100,
            sellPrice: 45,
            stock: -1,
            unlocked: true
        },

        // Medium Armor
        {
            itemId: "chainmail",
            price: 400,
            sellPrice: 180,
            stock: -1,
            unlockRequirements: {
                level: 5
            },
            featured: true
        },
        {
            itemId: "studded_leather",
            price: 350,
            sellPrice: 160,
            stock: -1,
            unlockRequirements: {
                level: 4
            }
        },

        // Heavy Armor
        {
            itemId: "plate_armor",
            price: 800,
            sellPrice: 360,
            stock: 3,
            unlockRequirements: {
                level: 8
            },
            featured: true
        },
        {
            itemId: "knight_armor",
            price: 1200,
            sellPrice: 540,
            stock: 2,
            unlockRequirements: {
                level: 10,
                storyChapter: 2
            },
            featured: true
        },

        // Shields
        {
            itemId: "wooden_shield",
            price: 80,
            sellPrice: 35,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "iron_shield",
            price: 200,
            sellPrice: 90,
            stock: -1,
            unlockRequirements: {
                level: 3
            }
        },
        {
            itemId: "steel_shield",
            price: 450,
            sellPrice: 200,
            stock: -1,
            unlockRequirements: {
                level: 6
            }
        },

        // Helmets
        {
            itemId: "leather_helm",
            price: 100,
            sellPrice: 45,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "iron_helmet",
            price: 250,
            sellPrice: 110,
            stock: -1,
            unlockRequirements: {
                level: 4
            }
        },

        // Boots
        {
            itemId: "leather_boots",
            price: 90,
            sellPrice: 40,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "iron_boots",
            price: 220,
            sellPrice: 100,
            stock: -1,
            unlockRequirements: {
                level: 5
            }
        }
    ],

    // ================================================
    // WIZARD WALLY'S MAGIC MYSTERIES (Magic Shop)
    // ================================================
    oakwood_magic_mysteries: [
        // Magic Rings
        {
            itemId: "ring_of_power",
            price: 500,
            sellPrice: 200,
            stock: 3,
            unlocked: true,
            featured: true
        },
        {
            itemId: "ring_of_protection",
            price: 450,
            sellPrice: 180,
            stock: 3,
            unlocked: true
        },
        {
            itemId: "ring_of_wisdom",
            price: 600,
            sellPrice: 240,
            stock: 2,
            unlockRequirements: {
                level: 6
            },
            featured: true
        },

        // Necklaces
        {
            itemId: "amulet_of_health",
            price: 700,
            sellPrice: 280,
            stock: 2,
            unlockRequirements: {
                level: 5
            },
            featured: true
        },
        {
            itemId: "amulet_of_magic",
            price: 800,
            sellPrice: 320,
            stock: 2,
            unlockRequirements: {
                level: 7
            },
            featured: true
        },

        // Charms
        {
            itemId: "lucky_charm",
            price: 300,
            sellPrice: 120,
            stock: 5,
            unlocked: true
        },
        {
            itemId: "charm_of_speed",
            price: 550,
            sellPrice: 220,
            stock: 3,
            unlockRequirements: {
                level: 6
            }
        },

        // Magic Consumables
        {
            itemId: "magic_scroll",
            price: 250,
            sellPrice: 100,
            stock: 5,
            unlockRequirements: {
                level: 5
            }
        },
        {
            itemId: "enchantment_crystal",
            price: 1000,
            sellPrice: 400,
            stock: 2,
            unlockRequirements: {
                level: 10,
                storyChapter: 3
            },
            featured: true
        }
    ],

    // ================================================
    // PENNY'S POTION PARLOR (Apothecary)
    // ================================================
    oakwood_apothecary: [
        // Healing Potions
        {
            itemId: "health_potion",
            price: 50,
            sellPrice: 25,
            stock: -1,
            unlocked: true,
            featured: true
        },
        {
            itemId: "greater_health_potion",
            price: 150,
            sellPrice: 75,
            stock: -1,
            unlockRequirements: {
                level: 5
            },
            featured: true
        },
        {
            itemId: "super_health_potion",
            price: 400,
            sellPrice: 200,
            stock: -1,
            unlockRequirements: {
                level: 10
            },
            featured: true
        },

        // Mana Potions
        {
            itemId: "mana_potion",
            price: 60,
            sellPrice: 30,
            stock: -1,
            unlocked: true,
            featured: true
        },
        {
            itemId: "greater_mana_potion",
            price: 180,
            sellPrice: 90,
            stock: -1,
            unlockRequirements: {
                level: 5
            }
        },

        // Status Effect Remedies
        {
            itemId: "antidote",
            price: 30,
            sellPrice: 15,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "cure_potion",
            price: 100,
            sellPrice: 50,
            stock: -1,
            unlockRequirements: {
                level: 4
            }
        },
        {
            itemId: "refresh_potion",
            price: 80,
            sellPrice: 40,
            stock: -1,
            unlockRequirements: {
                level: 3
            }
        },

        // Special Elixirs
        {
            itemId: "elixir",
            price: 300,
            sellPrice: 150,
            stock: 10,
            unlockRequirements: {
                level: 7
            },
            featured: true
        },
        {
            itemId: "phoenix_down",
            price: 500,
            sellPrice: 250,
            stock: 5,
            unlockRequirements: {
                level: 10,
                storyChapter: 2
            },
            featured: true
        },

        // Crafting Ingredients
        {
            itemId: "herb",
            price: 10,
            sellPrice: 5,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "mushroom",
            price: 15,
            sellPrice: 7,
            stock: -1,
            unlocked: true
        },
        {
            itemId: "crystal_dust",
            price: 50,
            sellPrice: 25,
            stock: 20,
            unlockRequirements: {
                level: 5
            }
        }
    ],

    // ================================================
    // HIDDEN FOREST TRADER
    // ================================================
    hidden_forest_trader: [
        // Rare Weapons
        {
            itemId: "dragon_sword",
            price: 2000,
            sellPrice: 1200,
            stock: 1,
            unlockRequirements: {
                level: 12
            },
            featured: true
        },
        {
            itemId: "shadow_dagger",
            price: 1500,
            sellPrice: 900,
            stock: 1,
            unlockRequirements: {
                level: 10
            },
            featured: true
        },

        // Rare Armor
        {
            itemId: "mythril_armor",
            price: 1800,
            sellPrice: 1080,
            stock: 1,
            unlockRequirements: {
                level: 11
            },
            featured: true
        },

        // Rare Accessories
        {
            itemId: "ring_of_legends",
            price: 2500,
            sellPrice: 1500,
            stock: 1,
            unlockRequirements: {
                level: 15,
                storyChapter: 4
            },
            featured: true
        },

        // Rare Consumables
        {
            itemId: "megalixir",
            price: 1000,
            sellPrice: 600,
            stock: 3,
            unlockRequirements: {
                level: 12
            },
            featured: true
        },

        // Special Items
        {
            itemId: "mysterious_egg",
            price: 5000,
            sellPrice: 2500,
            stock: 1,
            unlockRequirements: {
                level: 15,
                storyChapter: 5,
                areaCompletion: "deep_forest"
            },
            featured: true
        }
    ],

    // ================================================
    // CRYSTAL CAVE ENCHANTMENTS
    // ================================================
    crystal_cave_magic_shop: [
        // Crystal-Enhanced Magic Items
        {
            itemId: "crystal_wand",
            price: 1500,
            sellPrice: 600,
            stock: 2,
            unlockRequirements: {
                level: 10
            },
            featured: true
        },
        {
            itemId: "crystal_orb",
            price: 1800,
            sellPrice: 720,
            stock: 1,
            unlockRequirements: {
                level: 12
            },
            featured: true
        },

        // Enchanted Accessories
        {
            itemId: "crystal_ring",
            price: 2000,
            sellPrice: 800,
            stock: 2,
            unlockRequirements: {
                level: 11
            },
            featured: true
        },
        {
            itemId: "crystal_necklace",
            price: 2200,
            sellPrice: 880,
            stock: 2,
            unlockRequirements: {
                level: 12
            },
            featured: true
        },

        // Powerful Magic Consumables
        {
            itemId: "crystal_potion",
            price: 500,
            sellPrice: 200,
            stock: 10,
            unlockRequirements: {
                level: 10
            },
            featured: true
        },
        {
            itemId: "enchanted_scroll",
            price: 800,
            sellPrice: 320,
            stock: 5,
            unlockRequirements: {
                level: 12
            },
            featured: true
        },

        // Legendary Items
        {
            itemId: "archmage_staff",
            price: 5000,
            sellPrice: 2000,
            stock: 1,
            unlockRequirements: {
                level: 15,
                storyChapter: 5,
                areaCompletion: "crystal_caves"
            },
            featured: true
        }
    ]
};

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShopInventoryData };
}

// Make available globally for browser
if (typeof window !== 'undefined') {
    window.ShopInventoryData = ShopInventoryData;
}
