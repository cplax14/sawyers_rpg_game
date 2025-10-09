/**
 * Items Data
 * Defines all items, equipment, and consumables in the game
 */

const ItemData = {
    // ================================================
    // WEAPONS
    // ================================================
    weapons: {
        // Knight Weapons
        iron_sword: {
            name: "Iron Sword",
            description: "A sturdy blade forged from iron. Reliable in battle.",
            type: "weapon",
            weaponType: "sword",
            equipmentSlot: "weapon",
            equipmentSubtype: "sword",
            rarity: "common",
            statModifiers: { attack: 15, accuracy: 5 },
            requirements: { classes: ["knight", "paladin"] },
            value: 250,
            icon: "⚔️"
        },
        steel_sword: {
            name: "Steel Sword",
            description: "A well-crafted steel blade with superior balance.",
            type: "weapon",
            weaponType: "sword",
            equipmentSlot: "weapon",
            equipmentSubtype: "sword",
            rarity: "uncommon",
            statModifiers: { attack: 25, accuracy: 8 },
            requirements: { classes: ["knight", "paladin"], level: 5 },
            value: 500,
            icon: "🗡️"
        },
        blessed_mace: {
            name: "Blessed Mace",
            description: "A holy weapon blessed by divine powers.",
            type: "weapon",
            weaponType: "mace",
            equipmentSlot: "weapon",
            equipmentSubtype: "mace",
            rarity: "uncommon",
            statModifiers: { attack: 20, magicAttack: 10, accuracy: 5 },
            requirements: { classes: ["paladin"] },
            value: 400,
            icon: "🔨"
        },

        // Wizard Weapons
        oak_staff: {
            name: "Oak Staff",
            description: "A simple wooden staff that enhances magical abilities.",
            type: "weapon",
            weaponType: "staff",
            equipmentSlot: "weapon",
            equipmentSubtype: "staff",
            rarity: "common",
            statModifiers: { magicAttack: 20, accuracy: 5 },
            requirements: { classes: ["wizard"] },
            value: 200,
            icon: "🪄"
        },
        crystal_staff: {
            name: "Crystal Staff",
            description: "A staff topped with a magical crystal that amplifies spells.",
            type: "weapon",
            weaponType: "staff",
            equipmentSlot: "weapon",
            equipmentSubtype: "staff",
            rarity: "rare",
            statModifiers: { magicAttack: 35, accuracy: 10 },
            requirements: { classes: ["wizard"], level: 8 },
            value: 800,
            icon: "✨"
        },

        // Rogue Weapons
        steel_dagger: {
            name: "Steel Dagger",
            description: "A sharp, lightweight blade perfect for quick strikes.",
            type: "weapon",
            weaponType: "dagger",
            equipmentSlot: "weapon",
            equipmentSubtype: "dagger",
            rarity: "common",
            statModifiers: { attack: 12, speed: 10 },
            requirements: { classes: ["rogue"] },
            value: 180,
            icon: "🗡️"
        },
        poisoned_blade: {
            name: "Poisoned Blade",
            description: "A dagger coated with deadly poison.",
            type: "weapon",
            weaponType: "dagger",
            equipmentSlot: "weapon",
            equipmentSubtype: "dagger",
            rarity: "uncommon",
            statModifiers: { attack: 18, speed: 12 },
            effects: ["poison_chance"],
            requirements: { classes: ["rogue"], level: 6 },
            value: 450,
            icon: "🗡️"
        },

        // Ranger Weapons
        hunting_bow: {
            name: "Hunting Bow",
            description: "A reliable bow for hunting and combat.",
            type: "weapon",
            weaponType: "bow",
            equipmentSlot: "weapon",
            equipmentSubtype: "bow",
            rarity: "common",
            statModifiers: { attack: 18, accuracy: 12, speed: 5 },
            requirements: { classes: ["ranger"] },
            value: 300,
            icon: "🏹"
        },
        elvish_bow: {
            name: "Elvish Bow",
            description: "A masterwork bow crafted by elven artisans.",
            type: "weapon",
            weaponType: "bow",
            equipmentSlot: "weapon",
            equipmentSubtype: "bow",
            rarity: "rare",
            statModifiers: { attack: 30, accuracy: 15, speed: 8 },
            requirements: { classes: ["ranger"], level: 10 },
            value: 900,
            icon: "🏹"
        },

        // Warrior Weapons
        battle_axe: {
            name: "Battle Axe",
            description: "A heavy axe designed for devastating attacks.",
            type: "weapon",
            weaponType: "axe",
            equipmentSlot: "weapon",
            equipmentSubtype: "axe",
            rarity: "common",
            statModifiers: { attack: 22, accuracy: 5 },
            requirements: { classes: ["warrior"] },
            value: 320,
            icon: "🪓"
        },
        great_axe: {
            name: "Great Axe",
            description: "A massive two-handed axe that cleaves through enemies.",
            type: "weapon",
            weaponType: "axe",
            equipmentSlot: "weapon",
            equipmentSubtype: "axe",
            rarity: "uncommon",
            statModifiers: { attack: 35, accuracy: 5 },
            requirements: { classes: ["warrior"], level: 7 },
            value: 650,
            icon: "🪓"
        }
    },

    // ================================================
    // ARMOR
    // ================================================
    armor: {
        // Light Armor
        leather_armor: {
            name: "Leather Armor",
            description: "Basic protection made from treated leather.",
            type: "armor",
            armorType: "light",
            equipmentSlot: "armor",
            equipmentSubtype: "chestplate",
            rarity: "common",
            statModifiers: { defense: 8, maxHp: 10 },
            requirements: {},
            value: 150,
            icon: "🦺"
        },
        leather_vest: {
            name: "Leather Vest",
            description: "A lightweight vest that doesn't restrict movement.",
            type: "armor",
            armorType: "light",
            equipmentSlot: "armor",
            equipmentSubtype: "chestplate",
            rarity: "common",
            statModifiers: { defense: 6, speed: 5, maxHp: 8 },
            requirements: { classes: ["rogue"] },
            value: 120,
            icon: "🦺"
        },
        cloth_robe: {
            name: "Cloth Robe",
            description: "Simple robes that enhance magical focus.",
            type: "armor",
            armorType: "robe",
            equipmentSlot: "armor",
            equipmentSubtype: "chestplate",
            rarity: "common",
            statModifiers: { defense: 4, magicDefense: 12, maxMp: 15 },
            requirements: { classes: ["wizard"] },
            value: 100,
            icon: "👘"
        },
        ranger_cloak: {
            name: "Ranger Cloak",
            description: "A cloak that provides camouflage and protection.",
            type: "armor",
            armorType: "light",
            equipmentSlot: "armor",
            equipmentSubtype: "chestplate",
            rarity: "common",
            statModifiers: { defense: 7, speed: 5, accuracy: 8, maxHp: 10 },
            requirements: { classes: ["ranger"] },
            value: 180,
            icon: "🧥"
        },

        // Medium Armor
        chain_mail: {
            name: "Chain Mail",
            description: "Interlocked metal rings provide solid protection.",
            type: "armor",
            armorType: "medium",
            equipmentSlot: "armor",
            equipmentSubtype: "chestplate",
            rarity: "common",
            statModifiers: { defense: 15, magicDefense: 8, maxHp: 20 },
            requirements: { classes: ["knight", "paladin"] },
            value: 400,
            icon: "🛡️"
        },
        scale_mail: {
            name: "Scale Mail",
            description: "Overlapping metal scales offer flexible defense.",
            type: "armor",
            armorType: "medium",
            equipmentSlot: "armor",
            equipmentSubtype: "chestplate",
            rarity: "common",
            statModifiers: { defense: 18, maxHp: 25 },
            requirements: { classes: ["warrior"] },
            value: 350,
            icon: "🛡️"
        },

        // Heavy Armor
        plate_armor: {
            name: "Plate Armor",
            description: "Full body protection made from steel plates.",
            type: "armor",
            armorType: "heavy",
            equipmentSlot: "armor",
            equipmentSubtype: "chestplate",
            rarity: "uncommon",
            statModifiers: { defense: 25, magicDefense: 12, maxHp: 40 },
            requirements: { classes: ["knight", "paladin"], level: 8 },
            value: 800,
            icon: "🛡️"
        },

        // Magical Robes
        mage_robes: {
            name: "Mage Robes",
            description: "Enchanted robes that amplify magical power.",
            type: "armor",
            armorType: "robe",
            equipmentSlot: "armor",
            equipmentSubtype: "chestplate",
            rarity: "uncommon",
            statModifiers: { defense: 8, magicDefense: 20, magicAttack: 10, maxMp: 25 },
            requirements: { classes: ["wizard"], level: 5 },
            value: 600,
            icon: "👘"
        }
    },

    // ================================================
    // ACCESSORIES
    // ================================================
    accessories: {
        health_ring: {
            name: "Health Ring",
            description: "A ring that increases the wearer's vitality.",
            type: "accessory",
            equipmentSlot: "ring",
            equipmentSubtype: "ring",
            rarity: "common",
            statModifiers: { maxHp: 20 },
            value: 200,
            icon: "💍"
        },
        mana_crystal: {
            name: "Mana Crystal",
            description: "A crystal pendant that stores magical energy.",
            type: "accessory",
            equipmentSlot: "necklace",
            equipmentSubtype: "necklace",
            rarity: "common",
            statModifiers: { maxMp: 30, magicAttack: 5 },
            value: 250,
            icon: "💎"
        },
        stealth_cloak: {
            name: "Stealth Cloak",
            description: "A cloak that helps the wearer avoid detection.",
            type: "accessory",
            equipmentSlot: "charm",
            equipmentSubtype: "charm",
            rarity: "uncommon",
            statModifiers: { speed: 15 },
            effects: ["stealth_bonus"],
            value: 400,
            icon: "🧥"
        },
        holy_symbol: {
            name: "Holy Symbol",
            description: "A blessed amulet that protects against dark magic.",
            type: "accessory",
            equipmentSlot: "necklace",
            equipmentSubtype: "necklace",
            rarity: "uncommon",
            statModifiers: { magicDefense: 15, maxHp: 10 },
            effects: ["undead_resistance"],
            value: 350,
            icon: "✨"
        },
        nature_charm: {
            name: "Nature Charm",
            description: "A charm that connects the wearer to natural forces.",
            type: "accessory",
            equipmentSlot: "charm",
            equipmentSubtype: "charm",
            rarity: "uncommon",
            statModifiers: { maxHp: 15, maxMp: 15, accuracy: 10 },
            effects: ["nature_affinity"],
            value: 300,
            icon: "🍀"
        },
        strength_band: {
            name: "Strength Band",
            description: "A bracer that enhances physical power.",
            type: "accessory",
            equipmentSlot: "charm",
            equipmentSubtype: "charm",
            rarity: "common",
            statModifiers: { attack: 10, defense: 5 },
            value: 180,
            icon: "💪"
        }
    },

    // ================================================
    // CONSUMABLES
    // ================================================
    consumables: {
        health_potion: {
            name: "Health Potion",
            description: "Restores 50 HP when used.",
            type: "consumable",
            category: "healing",
            rarity: "common",
            effect: { type: "heal", amount: 50 },
            value: 25,
            icon: "🧪"
        },
        mana_potion: {
            name: "Mana Potion",
            description: "Restores 30 MP when used.",
            type: "consumable",
            category: "restoration",
            rarity: "common",
            effect: { type: "restore_mp", amount: 30 },
            value: 20,
            icon: "💙"
        },
        stamina_potion: {
            name: "Stamina Potion",
            description: "Restores stamina and reduces fatigue.",
            type: "consumable",
            category: "restoration",
            rarity: "common",
            effect: { type: "restore_stamina", amount: 40 },
            value: 18,
            icon: "💪"
        },
        hi_potion: {
            name: "Hi-Potion",
            description: "Restores 150 HP when used.",
            type: "consumable",
            category: "healing",
            rarity: "uncommon",
            effect: { type: "heal", amount: 150 },
            value: 75,
            icon: "🧪"
        },
        elixir: {
            name: "Elixir",
            description: "Fully restores HP and MP.",
            type: "consumable",
            category: "restoration",
            rarity: "rare",
            effect: { type: "full_restore" },
            value: 200,
            icon: "✨"
        },
        antidote: {
            name: "Antidote",
            description: "Cures poison status effect.",
            type: "consumable",
            category: "cure",
            rarity: "common",
            effect: { type: "cure", status: "poison" },
            value: 15,
            icon: "🟢"
        },
        phoenix_down: {
            name: "Phoenix Down",
            description: "Revives a fallen ally with 25% HP.",
            type: "consumable",
            category: "revival",
            rarity: "rare",
            effect: { type: "revive", amount: 0.25 },
            value: 500,
            icon: "🪶"
        },

        // ================================================
        // SPELL SCROLLS
        // ================================================
        fireball_scroll: {
            name: "Fireball Scroll",
            description: "A scroll containing the Fireball spell. Single use.",
            type: "consumable",
            category: "spell_scroll",
            rarity: "uncommon",
            effect: { type: "learn_spell", spell: "fireball" },
            usageType: "spell_learning",
            requirements: { minIntelligence: 12 },
            value: 150,
            icon: "📜🔥"
        },
        ice_shard_scroll: {
            name: "Ice Shard Scroll",
            description: "Teaches the Ice Shard spell to compatible classes.",
            type: "consumable",
            category: "spell_scroll",
            rarity: "uncommon",
            effect: { type: "learn_spell", spell: "ice_shard" },
            usageType: "spell_learning",
            requirements: { classes: ["wizard", "paladin"] },
            value: 140,
            icon: "📜❄️"
        },
        heal_scroll: {
            name: "Heal Scroll",
            description: "Contains the basic Heal spell.",
            type: "consumable",
            category: "spell_scroll",
            rarity: "common",
            effect: { type: "learn_spell", spell: "heal" },
            usageType: "spell_learning",
            requirements: { classes: ["wizard", "paladin"] },
            value: 100,
            icon: "📜✨"
        },
        lightning_bolt_scroll: {
            name: "Lightning Bolt Scroll",
            description: "A powerful electrical spell scroll.",
            type: "consumable",
            category: "spell_scroll",
            rarity: "rare",
            effect: { type: "learn_spell", spell: "lightning_bolt" },
            usageType: "spell_learning",
            requirements: { level: 8, classes: ["wizard"] },
            value: 300,
            icon: "📜⚡"
        },
        ancient_magic_scroll: {
            name: "Ancient Magic Scroll",
            description: "Contains lost magical knowledge.",
            type: "consumable",
            category: "spell_scroll",
            rarity: "epic",
            effect: { type: "learn_spell", spell: "ancient_magic" },
            usageType: "spell_learning",
            requirements: { level: 15, story: "ancient_knowledge" },
            value: 800,
            icon: "📜🌟"
        },

        // ================================================
        // ENHANCEMENT CONSUMABLES
        // ================================================
        strength_potion: {
            name: "Strength Potion",
            description: "Temporarily increases attack power by 25% for 5 battles.",
            type: "consumable",
            category: "enhancement",
            rarity: "uncommon",
            effect: { type: "temp_buff", stat: "attack", multiplier: 1.25, duration: 5 },
            value: 80,
            icon: "💪"
        },
        defense_elixir: {
            name: "Defense Elixir",
            description: "Boosts defense by 30% for 3 battles.",
            type: "consumable",
            category: "enhancement",
            rarity: "uncommon",
            effect: { type: "temp_buff", stat: "defense", multiplier: 1.3, duration: 3 },
            value: 85,
            icon: "🛡️"
        },
        speed_tonic: {
            name: "Speed Tonic",
            description: "Increases speed and accuracy for 4 battles.",
            type: "consumable",
            category: "enhancement",
            rarity: "rare",
            effect: { type: "temp_buff", stats: ["speed", "accuracy"], multiplier: 1.2, duration: 4 },
            value: 120,
            icon: "💨"
        },
        magic_amplifier: {
            name: "Magic Amplifier",
            description: "Enhances magical abilities for 6 battles.",
            type: "consumable",
            category: "enhancement",
            rarity: "rare",
            effect: { type: "temp_buff", stats: ["magicAttack", "magicDefense"], multiplier: 1.35, duration: 6 },
            value: 150,
            icon: "🔮"
        },
        experience_booster: {
            name: "Experience Booster",
            description: "Doubles experience gain for the next battle.",
            type: "consumable",
            category: "enhancement",
            rarity: "uncommon",
            effect: { type: "temp_buff", bonus: "experience", multiplier: 2.0, duration: 1 },
            value: 200,
            icon: "⭐"
        },
        lucky_charm: {
            name: "Lucky Charm",
            description: "Increases critical hit chance and loot drops for 3 battles.",
            type: "consumable",
            category: "enhancement",
            rarity: "rare",
            effect: { type: "temp_buff", bonus: ["critical", "loot_drop"], multiplier: 1.5, duration: 3 },
            value: 180,
            icon: "🍀"
        },

        // ================================================
        // UTILITY CONSUMABLES
        // ================================================
        torch: {
            name: "Torch",
            description: "Provides light in dark areas. Required for some dungeons.",
            type: "consumable",
            category: "utility",
            rarity: "common",
            effect: { type: "utility", function: "light_source" },
            duration: 10, // 10 area explorations
            value: 15,
            icon: "🔦"
        },
        rope: {
            name: "Rope",
            description: "Allows access to certain areas or escape from battles.",
            type: "consumable",
            category: "utility",
            rarity: "common",
            effect: { type: "utility", function: "escape_aid" },
            value: 30,
            icon: "🪢"
        },
        monster_bait: {
            name: "Monster Bait",
            description: "Increases monster encounter rate for 5 explorations.",
            type: "consumable",
            category: "utility",
            rarity: "uncommon",
            effect: { type: "temp_effect", effect: "encounter_boost", multiplier: 1.5, duration: 5 },
            value: 60,
            icon: "🥩"
        },
        monster_repel: {
            name: "Monster Repel",
            description: "Reduces monster encounters for 8 explorations.",
            type: "consumable",
            category: "utility",
            rarity: "uncommon",
            effect: { type: "temp_effect", effect: "encounter_reduce", multiplier: 0.3, duration: 8 },
            value: 45,
            icon: "🚫"
        },
        teleport_crystal: {
            name: "Teleport Crystal",
            description: "Instantly return to the last town visited.",
            type: "consumable",
            category: "utility",
            rarity: "rare",
            effect: { type: "utility", function: "teleport_town" },
            value: 250,
            icon: "💎"
        },

        // ================================================
        // CREATURE RECOVERY ITEMS
        // ================================================
        revitalization_potion: {
            name: "Revitalization Potion",
            description: "Removes 1 level of exhaustion from a creature. Restores vitality after breeding.",
            type: "consumable",
            category: "creature_recovery",
            rarity: "uncommon",
            effect: { type: "remove_exhaustion", amount: 1 },
            value: 150,
            icon: "🧪✨"
        },
        full_restore: {
            name: "Full Restore",
            description: "Completely removes all exhaustion from a creature. Returns it to peak condition.",
            type: "consumable",
            category: "creature_recovery",
            rarity: "rare",
            effect: { type: "remove_exhaustion", amount: -1 }, // -1 means remove all
            value: 400,
            icon: "💫"
        }
    },

    // ================================================
    // MONSTER CAPTURE ITEMS
    // ================================================
    captureItems: {
        monster_ball: {
            name: "Monster Ball",
            description: "A basic device for capturing monsters.",
            type: "capture",
            rarity: "common",
            captureRate: 1.0,
            value: 50,
            icon: "⚪"
        },
        great_ball: {
            name: "Great Ball",
            description: "An improved monster capture device.",
            type: "capture",
            rarity: "uncommon",
            captureRate: 1.5,
            value: 100,
            icon: "🔵"
        },
        ultra_ball: {
            name: "Ultra Ball",
            description: "A high-performance capture device.",
            type: "capture",
            rarity: "rare",
            captureRate: 2.0,
            value: 200,
            icon: "🟡"
        },
        net_ball: {
            name: "Net Ball",
            description: "Effective against water and flying monsters.",
            type: "capture",
            rarity: "uncommon",
            captureRate: 1.2,
            specialBonus: { types: ["water", "flying"], multiplier: 2.5 },
            value: 120,
            icon: "🕸️"
        },
        dusk_ball: {
            name: "Dusk Ball",
            description: "More effective in dark areas or at night.",
            type: "capture",
            rarity: "uncommon",
            captureRate: 1.0,
            specialBonus: { conditions: ["dark", "night"], multiplier: 3.0 },
            value: 150,
            icon: "🌑"
        }
    },

    // ================================================
    // CRAFTING MATERIALS
    // ================================================
    materials: {
        repair_kit: {
            name: "Repair Kit",
            description: "Tools for maintaining weapons and armor.",
            type: "material",
            category: "maintenance",
            rarity: "common",
            value: 30,
            icon: "🔧"
        },
        magic_ink: {
            name: "Magic Ink",
            description: "Special ink used for creating spell scrolls.",
            type: "material",
            category: "crafting",
            rarity: "uncommon",
            value: 40,
            icon: "🖋️"
        },
        monster_bait: {
            name: "Monster Bait",
            description: "Attracts wild monsters when used.",
            type: "material",
            category: "utility",
            rarity: "common",
            value: 20,
            icon: "🥩"
        },

        // ================================================
        // MONSTER-DERIVED MATERIALS
        // ================================================
        slime_gel: {
            name: "Slime Gel",
            description: "Viscous gel from slimes. Used in potion brewing.",
            type: "material",
            category: "monster_part",
            rarity: "common",
            craftingUse: ["alchemy", "equipment_repair"],
            value: 8,
            icon: "🫧"
        },
        goblin_tooth: {
            name: "Goblin Tooth",
            description: "Sharp tooth from a goblin. Used for crafting arrows.",
            type: "material",
            category: "monster_part",
            rarity: "common",
            craftingUse: ["weapon_crafting", "ammunition"],
            value: 12,
            icon: "🦷"
        },
        wolf_fang: {
            name: "Wolf Fang",
            description: "Curved fang from a wolf. Prized for weapon enhancement.",
            type: "material",
            category: "monster_part",
            rarity: "uncommon",
            craftingUse: ["weapon_enhancement", "jewelry"],
            value: 25,
            icon: "🔪"
        },
        wolf_pelt: {
            name: "Wolf Pelt",
            description: "Thick fur from a wolf. Excellent for armor crafting.",
            type: "material",
            category: "monster_part",
            rarity: "uncommon",
            craftingUse: ["armor_crafting", "clothing"],
            value: 30,
            icon: "🧥"
        },
        leather_scraps: {
            name: "Leather Scraps",
            description: "Small pieces of leather from various creatures.",
            type: "material",
            category: "monster_part",
            rarity: "common",
            craftingUse: ["armor_crafting", "repair"],
            value: 8,
            icon: "🟤"
        },
        orc_tusk: {
            name: "Orc Tusk",
            description: "Massive tusk from an orc. Used for powerful weapons.",
            type: "material",
            category: "monster_part",
            rarity: "rare",
            craftingUse: ["weapon_crafting", "decoration"],
            value: 60,
            icon: "🦏"
        },
        dragon_scale: {
            name: "Dragon Scale",
            description: "Incredibly hard scale from a dragon. Ultimate armor material.",
            type: "material",
            category: "monster_part",
            rarity: "legendary",
            craftingUse: ["legendary_armor", "magical_items"],
            value: 500,
            icon: "🐲"
        },
        dragon_heart: {
            name: "Dragon Heart",
            description: "The still-beating heart of an ancient dragon. Immense magical power.",
            type: "material",
            category: "monster_part",
            rarity: "legendary",
            craftingUse: ["artifact_creation", "spell_enhancement"],
            value: 2000,
            icon: "❤️"
        },

        // ================================================
        // NATURAL MATERIALS
        // ================================================
        healing_herb: {
            name: "Healing Herb",
            description: "A common medicinal plant found in forests.",
            type: "material",
            category: "natural",
            rarity: "common",
            craftingUse: ["alchemy", "healing_items"],
            value: 5,
            icon: "🌿"
        },
        mana_flower: {
            name: "Mana Flower",
            description: "Blue flower that restores magical energy.",
            type: "material",
            category: "natural",
            rarity: "common",
            craftingUse: ["alchemy", "mana_items"],
            value: 8,
            icon: "🌸"
        },
        oak_branch: {
            name: "Oak Branch",
            description: "Sturdy wood from ancient oak trees.",
            type: "material",
            category: "natural",
            rarity: "common",
            craftingUse: ["weapon_crafting", "tool_making"],
            value: 6,
            icon: "🌳"
        },
        pine_sap: {
            name: "Pine Sap",
            description: "Sticky resin used as adhesive and coating.",
            type: "material",
            category: "natural",
            rarity: "common",
            craftingUse: ["equipment_repair", "coating"],
            value: 4,
            icon: "🍯"
        },
        forest_crystal: {
            name: "Forest Crystal",
            description: "Crystallized nature energy found in ancient groves.",
            type: "material",
            category: "natural",
            rarity: "rare",
            craftingUse: ["magical_items", "enhancement"],
            value: 120,
            icon: "💚"
        },

        // ================================================
        // MINERAL MATERIALS
        // ================================================
        iron_ore: {
            name: "Iron Ore",
            description: "Raw iron extracted from mountain caves.",
            type: "material",
            category: "mineral",
            rarity: "common",
            craftingUse: ["weapon_crafting", "armor_crafting"],
            value: 15,
            icon: "⛏️"
        },
        quartz_crystal: {
            name: "Quartz Crystal",
            description: "Clear crystal with magical conductivity.",
            type: "material",
            category: "mineral",
            rarity: "uncommon",
            craftingUse: ["magical_items", "jewelry"],
            value: 40,
            icon: "💎"
        },
        amethyst_shard: {
            name: "Amethyst Shard",
            description: "Purple crystal fragment with potent magical properties.",
            type: "material",
            category: "mineral",
            rarity: "rare",
            craftingUse: ["spell_enhancement", "magical_weapons"],
            value: 80,
            icon: "💜"
        },
        mithril_ore: {
            name: "Mithril Ore",
            description: "Legendary metal ore lighter than steel but stronger than iron.",
            type: "material",
            category: "mineral",
            rarity: "epic",
            craftingUse: ["legendary_equipment", "artifact_creation"],
            value: 300,
            icon: "✨"
        },
        adamantine_crystal: {
            name: "Adamantine Crystal",
            description: "The hardest known substance, capable of cutting anything.",
            type: "material",
            category: "mineral",
            rarity: "legendary",
            craftingUse: ["legendary_weapons", "cutting_tools"],
            value: 1000,
            icon: "💠"
        },

        // ================================================
        // MAGICAL COMPONENTS
        // ================================================
        mana_essence: {
            name: "Mana Essence",
            description: "Concentrated magical energy in physical form.",
            type: "material",
            category: "magical",
            rarity: "uncommon",
            craftingUse: ["spell_scrolls", "mana_items"],
            value: 50,
            icon: "🔵"
        },
        crystal_essence: {
            name: "Crystal Essence",
            description: "Pure energy extracted from magical crystals.",
            type: "material",
            category: "magical",
            rarity: "rare",
            craftingUse: ["magical_enhancement", "power_cores"],
            value: 100,
            icon: "💫"
        },
        dragon_essence: {
            name: "Dragon Essence",
            description: "Condensed power from ancient dragons.",
            type: "material",
            category: "magical",
            rarity: "epic",
            craftingUse: ["legendary_spells", "dragon_items"],
            value: 400,
            icon: "🐉"
        },
        time_relic: {
            name: "Time Relic",
            description: "Fragment of crystallized time itself.",
            type: "material",
            category: "magical",
            rarity: "legendary",
            craftingUse: ["time_magic", "temporal_artifacts"],
            value: 1500,
            icon: "⏳"
        },

        evolution_stone: {
            name: "Evolution Stone",
            description: "A mysterious stone that triggers monster evolution.",
            type: "material",
            category: "evolution",
            rarity: "rare",
            value: 500,
            icon: "💎"
        }
    },

    // ================================================
    // SPELL SCROLLS
    // ================================================
    scrolls: {
        scroll_fireball: {
            name: "Fireball Scroll",
            description: "Teaches a monster the Fireball spell.",
            type: "scroll",
            spell: "fireball",
            rarity: "uncommon",
            value: 150,
            icon: "📜"
        },
        scroll_ice_shard: {
            name: "Ice Shard Scroll",
            description: "Teaches a monster the Ice Shard spell.",
            type: "scroll",
            spell: "ice_shard",
            rarity: "uncommon",
            value: 150,
            icon: "📜"
        },
        scroll_heal: {
            name: "Heal Scroll",
            description: "Teaches a monster the Heal spell.",
            type: "scroll",
            spell: "heal",
            rarity: "common",
            value: 100,
            icon: "📜"
        }
    },

    // ================================================
    // UTILITY METHODS
    // ================================================
    
    /**
     * Get all items combined into a single object
     */
    getAllItems() {
        return {
            ...this.weapons,
            ...this.armor,
            ...this.accessories,
            ...this.consumables,
            ...this.captureItems,
            ...this.materials,
            ...this.scrolls
        };
    },

    /**
     * Get item data by ID
     */
    getItem(itemId) {
        const allItems = this.getAllItems();
        return allItems[itemId] || null;
    },

    /**
     * Get items by type
     */
    getItemsByType(type) {
        const allItems = this.getAllItems();
        return Object.entries(allItems)
            .filter(([id, item]) => item.type === type)
            .reduce((acc, [id, item]) => {
                acc[id] = item;
                return acc;
            }, {});
    },

    /**
     * Get items by category (for consumables)
     */
    getItemsByCategory(category) {
        const allItems = this.getAllItems();
        return Object.entries(allItems)
            .filter(([id, item]) => item.category === category)
            .reduce((acc, [id, item]) => {
                acc[id] = item;
                return acc;
            }, {});
    },

    /**
     * Check if player can use an item
     */
    canPlayerUseItem(itemId, playerData) {
        const item = this.getItem(itemId);
        if (!item || !item.requirements) return true;

        const req = item.requirements;
        
        // Check class requirements
        if (req.classes && !req.classes.includes(playerData.class)) {
            return false;
        }
        
        // Check level requirements
        if (req.level && playerData.level < req.level) {
            return false;
        }
        
        return true;
    },

    /**
     * Get item display name with rarity color
     */
    getItemDisplayName(itemId) {
        const item = this.getItem(itemId);
        if (!item) return itemId;

        const rarityColors = {
            common: '#ffffff',
            uncommon: '#1eff00',
            rare: '#0070dd',
            epic: '#a335ee',
            legendary: '#ff8000'
        };

        const color = rarityColors[item.rarity] || '#ffffff';
        return `<span style="color: ${color}">${item.name}</span>`;
    },

    /**
     * Get equipment stats total
     */
    getEquipmentStats(equipment) {
        const stats = {};
        
        for (const slot in equipment) {
            const itemId = equipment[slot];
            if (itemId) {
                const item = this.getItem(itemId);
                if (item && item.stats) {
                    for (const stat in item.stats) {
                        stats[stat] = (stats[stat] || 0) + item.stats[stat];
                    }
                }
            }
        }
        
        return stats;
    }
};

// Make available globally
window.ItemData = ItemData;