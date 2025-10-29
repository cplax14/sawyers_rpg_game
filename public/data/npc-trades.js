/**
 * NPC Trade Definitions
 * Defines barter-style and quest-based trades with NPCs
 * Ages 7-12 appropriate with helpful, friendly NPCs
 */

const NPCTradeData = {
    // ================================================
    // BARTER TRADES (Repeatable)
    // ================================================

    // Herbalist Slime Trade
    herbalist_slime_trade: {
        id: "herbalist_slime_trade",
        npcName: "Village Herbalist",
        type: "barter",
        repeatability: "repeatable",
        requiredItems: [
            { itemId: "slime_gel", quantity: 3, consumed: true }
        ],
        offeredItems: [
            { itemId: "health_potion", quantity: 1, chance: 1.0 }
        ],
        dialogue: "I can make healing potions from slime gel! Bring me 3 slime gels and I'll give you a fresh health potion!",
        location: "mistwood_forest",
        requirements: [
            {
                type: "level",
                value: 1,
                description: "Available from the start"
            }
        ],
        cooldown: 0 // No cooldown, always available
    },

    // Blacksmith Material Trade
    blacksmith_material_trade: {
        id: "blacksmith_material_trade",
        npcName: "Apprentice Blacksmith",
        type: "barter",
        repeatability: "repeatable",
        requiredItems: [
            { itemId: "iron_ore", quantity: 5, consumed: true },
            { itemId: "coal", quantity: 2, consumed: true }
        ],
        offeredItems: [
            { itemId: "iron_sword", quantity: 1, chance: 1.0 }
        ],
        goldRequired: 50,
        dialogue: "I'm learning to forge weapons! If you bring me 5 iron ore and 2 coal, plus 50 gold for the forge fuel, I'll craft you an iron sword!",
        location: "oakwood_village",
        requirements: [
            {
                type: "level",
                value: 3,
                description: "Requires level 3"
            }
        ],
        cooldown: 0
    },

    // Collector's Crystal Trade
    collector_crystal_trade: {
        id: "collector_crystal_trade",
        npcName: "Crystal Collector Clara",
        type: "barter",
        repeatability: "daily",
        requiredItems: [
            { itemId: "crystal_shard", quantity: 10, consumed: true }
        ],
        offeredItems: [
            { itemId: "crystal_dust", quantity: 5, chance: 1.0 },
            { itemId: "magic_scroll", quantity: 1, chance: 0.5 }
        ],
        dialogue: "Wow! Crystal shards! I collect these! Trade me 10 shards and I'll give you refined crystal dust. You might get a bonus scroll too!",
        location: "crystal_caves",
        requirements: [
            {
                type: "level",
                value: 8,
                description: "Requires level 8"
            },
            {
                type: "area",
                id: "crystal_caves",
                description: "Must have discovered Crystal Caves"
            }
        ],
        cooldown: 86400000 // 24 hours in milliseconds
    },

    // Alchemist Herb Bundle
    alchemist_herb_bundle: {
        id: "alchemist_herb_bundle",
        npcName: "Wandering Alchemist",
        type: "barter",
        repeatability: "repeatable",
        requiredItems: [
            { itemId: "herb", quantity: 10, consumed: true },
            { itemId: "mushroom", quantity: 5, consumed: true }
        ],
        offeredItems: [
            { itemId: "greater_health_potion", quantity: 2, chance: 1.0 },
            { itemId: "antidote", quantity: 3, chance: 1.0 }
        ],
        dialogue: "Ah, fresh herbs and mushrooms! Perfect! I'll trade you 2 greater health potions and 3 antidotes for 10 herbs and 5 mushrooms!",
        location: "oakwood_village",
        requirements: [
            {
                type: "level",
                value: 5,
                description: "Requires level 5"
            }
        ],
        cooldown: 0
    },

    // Monster Part Exchange
    hunter_monster_parts: {
        id: "hunter_monster_parts",
        npcName: "Monster Hunter Jake",
        type: "barter",
        repeatability: "repeatable",
        requiredItems: [
            { itemId: "goblin_tooth", quantity: 5, consumed: true },
            { itemId: "wolf_pelt", quantity: 3, consumed: true }
        ],
        offeredItems: [
            { itemId: "leather_armor", quantity: 1, chance: 1.0 }
        ],
        goldOffered: 100,
        dialogue: "Nice hunting! I'll take those goblin teeth and wolf pelts off your hands. Here's some leather armor and 100 gold!",
        location: "mistwood_forest",
        requirements: [
            {
                type: "level",
                value: 4,
                description: "Requires level 4"
            }
        ],
        cooldown: 0
    },

    // ================================================
    // QUEST-BASED TRADES (One-time or Quest-gated)
    // ================================================

    // Elder's First Quest Reward
    elder_starter_equipment: {
        id: "elder_starter_equipment",
        npcName: "Village Elder",
        type: "quest",
        repeatability: "one_time",
        requiredItems: [
            { itemId: "forest_herb", quantity: 5, consumed: true }
        ],
        offeredItems: [
            { itemId: "iron_sword", quantity: 1, chance: 1.0 },
            { itemId: "leather_armor", quantity: 1, chance: 1.0 },
            { itemId: "health_potion", quantity: 3, chance: 1.0 }
        ],
        goldOffered: 50,
        dialogue: "You've proven yourself by gathering those herbs! Take this equipment, young hero. You've earned it! May it serve you well on your adventures!",
        location: "mistwood_forest",
        requirements: [
            {
                type: "quest",
                id: "elder_herb_collection",
                description: "Complete Elder's Herb Collection quest"
            }
        ],
        cooldown: 0
    },

    // Wizard's Apprentice Quest
    wizard_apprentice_reward: {
        id: "wizard_apprentice_reward",
        npcName: "Wizard Wally",
        type: "quest",
        repeatability: "one_time",
        requiredItems: [
            { itemId: "magic_essence", quantity: 1, consumed: true },
            { itemId: "crystal_dust", quantity: 10, consumed: true }
        ],
        offeredItems: [
            { itemId: "crystal_staff", quantity: 1, chance: 1.0 },
            { itemId: "ring_of_power", quantity: 1, chance: 1.0 },
            { itemId: "magic_scroll", quantity: 5, chance: 1.0 }
        ],
        dialogue: "Magnificent! You've gathered the magical components! You have true talent for magic! Accept these gifts - you've more than earned them!",
        location: "oakwood_village",
        requirements: [
            {
                type: "quest",
                id: "wizard_apprentice_trial",
                description: "Complete Wizard's Apprentice Trial quest"
            },
            {
                type: "level",
                value: 7,
                description: "Requires level 7"
            },
            {
                type: "story",
                value: 2,
                description: "Requires story chapter 2"
            }
        ],
        cooldown: 0
    },

    // Blacksmith's Master Work
    blacksmith_masterwork: {
        id: "blacksmith_masterwork",
        npcName: "Master Blacksmith Bob",
        type: "quest",
        repeatability: "one_time",
        requiredItems: [
            { itemId: "dragon_scale", quantity: 3, consumed: true },
            { itemId: "mythril_ore", quantity: 5, consumed: true },
            { itemId: "fire_crystal", quantity: 1, consumed: true }
        ],
        offeredItems: [
            { itemId: "dragon_sword", quantity: 1, chance: 1.0 }
        ],
        goldRequired: 500,
        dialogue: "These materials are legendary! With your materials and my skill, I'll forge you the finest sword in all the land! This is my masterwork!",
        location: "oakwood_village",
        requirements: [
            {
                type: "quest",
                id: "legendary_materials_hunt",
                description: "Complete Legendary Materials Hunt quest"
            },
            {
                type: "level",
                value: 12,
                description: "Requires level 12"
            },
            {
                type: "story",
                value: 4,
                description: "Requires story chapter 4"
            }
        ],
        cooldown: 0
    },

    // Crystal Cave Guardian
    cave_guardian_blessing: {
        id: "cave_guardian_blessing",
        npcName: "Crystal Cave Guardian",
        type: "quest",
        repeatability: "one_time",
        requiredItems: [
            { itemId: "pure_crystal", quantity: 1, consumed: true }
        ],
        offeredItems: [
            { itemId: "crystal_necklace", quantity: 1, chance: 1.0 },
            { itemId: "enchantment_crystal", quantity: 3, chance: 1.0 },
            { itemId: "crystal_potion", quantity: 10, chance: 1.0 }
        ],
        dialogue: "You have restored the Pure Crystal to the caves! Your kindness and bravery have earned my blessing. Accept these gifts of the crystal realm!",
        location: "crystal_caves",
        requirements: [
            {
                type: "quest",
                id: "restore_crystal_heart",
                description: "Complete Restore the Crystal Heart quest"
            },
            {
                type: "level",
                value: 10,
                description: "Requires level 10"
            },
            {
                type: "area",
                id: "crystal_caves",
                description: "Must have completed Crystal Caves"
            }
        ],
        cooldown: 0
    },

    // Mysterious Merchant's Secret Deal
    mysterious_merchant_secret: {
        id: "mysterious_merchant_secret",
        npcName: "Mysterious Merchant Max",
        type: "quest",
        repeatability: "one_time",
        requiredItems: [
            { itemId: "ancient_coin", quantity: 10, consumed: true }
        ],
        offeredItems: [
            { itemId: "ring_of_legends", quantity: 1, chance: 1.0 },
            { itemId: "mysterious_egg", quantity: 1, chance: 1.0 },
            { itemId: "megalixir", quantity: 3, chance: 1.0 }
        ],
        dialogue: "Ah! Ancient coins! You're quite the treasure hunter! Very well, I'll give you access to my most precious items. These are one-of-a-kind treasures!",
        location: "deep_forest",
        requirements: [
            {
                type: "quest",
                id: "ancient_treasure_hunt",
                description: "Complete Ancient Treasure Hunt quest"
            },
            {
                type: "level",
                value: 15,
                description: "Requires level 15"
            },
            {
                type: "story",
                value: 5,
                description: "Requires story chapter 5"
            }
        ],
        cooldown: 0
    }
};

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NPCTradeData };
}
