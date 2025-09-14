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
            rarity: "common",
            stats: { attack: 15, accuracy: 85 },
            requirements: { classes: ["knight", "paladin"] },
            value: 250,
            icon: "⚔️"
        },
        steel_sword: {
            name: "Steel Sword",
            description: "A well-crafted steel blade with superior balance.",
            type: "weapon",
            weaponType: "sword",
            rarity: "uncommon",
            stats: { attack: 25, accuracy: 90, critical: 5 },
            requirements: { classes: ["knight", "paladin"], level: 5 },
            value: 500,
            icon: "🗡️"
        },
        blessed_mace: {
            name: "Blessed Mace",
            description: "A holy weapon blessed by divine powers.",
            type: "weapon",
            weaponType: "mace",
            rarity: "uncommon",
            stats: { attack: 20, magicAttack: 10, accuracy: 80 },
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
            rarity: "common",
            stats: { magicAttack: 20, mp: 10, accuracy: 75 },
            requirements: { classes: ["wizard"] },
            value: 200,
            icon: "🪄"
        },
        crystal_staff: {
            name: "Crystal Staff",
            description: "A staff topped with a magical crystal that amplifies spells.",
            type: "weapon",
            weaponType: "staff",
            rarity: "rare",
            stats: { magicAttack: 35, mp: 20, accuracy: 85, critical: 10 },
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
            rarity: "common",
            stats: { attack: 12, speed: 10, critical: 15 },
            requirements: { classes: ["rogue"] },
            value: 180,
            icon: "🗡️"
        },
        poisoned_blade: {
            name: "Poisoned Blade",
            description: "A dagger coated with deadly poison.",
            type: "weapon",
            weaponType: "dagger",
            rarity: "uncommon",
            stats: { attack: 18, speed: 12, critical: 20 },
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
            rarity: "common",
            stats: { attack: 18, accuracy: 95, speed: 5 },
            requirements: { classes: ["ranger"] },
            value: 300,
            icon: "🏹"
        },
        elvish_bow: {
            name: "Elvish Bow",
            description: "A masterwork bow crafted by elven artisans.",
            type: "weapon",
            weaponType: "bow",
            rarity: "rare",
            stats: { attack: 30, accuracy: 98, speed: 8, critical: 12 },
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
            rarity: "common",
            stats: { attack: 22, critical: 10, accuracy: 75 },
            requirements: { classes: ["warrior"] },
            value: 320,
            icon: "🪓"
        },
        great_axe: {
            name: "Great Axe",
            description: "A massive two-handed axe that cleaves through enemies.",
            type: "weapon",
            weaponType: "axe",
            rarity: "uncommon",
            stats: { attack: 35, critical: 15, accuracy: 70 },
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
            rarity: "common",
            stats: { defense: 8, speed: -2 },
            requirements: {},
            value: 150,
            icon: "🦺"
        },
        leather_vest: {
            name: "Leather Vest",
            description: "A lightweight vest that doesn't restrict movement.",
            type: "armor",
            armorType: "light",
            rarity: "common",
            stats: { defense: 6, speed: 2 },
            requirements: { classes: ["rogue"] },
            value: 120,
            icon: "🦺"
        },
        cloth_robe: {
            name: "Cloth Robe",
            description: "Simple robes that enhance magical focus.",
            type: "armor",
            armorType: "robe",
            rarity: "common",
            stats: { defense: 4, magicDefense: 12, mp: 15 },
            requirements: { classes: ["wizard"] },
            value: 100,
            icon: "👘"
        },
        ranger_cloak: {
            name: "Ranger Cloak",
            description: "A cloak that provides camouflage and protection.",
            type: "armor",
            armorType: "light",
            rarity: "common",
            stats: { defense: 7, speed: 3, accuracy: 5 },
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
            rarity: "common",
            stats: { defense: 15, magicDefense: 8, speed: -5 },
            requirements: { classes: ["knight", "paladin"] },
            value: 400,
            icon: "🛡️"
        },
        scale_mail: {
            name: "Scale Mail",
            description: "Overlapping metal scales offer flexible defense.",
            type: "armor",
            armorType: "medium",
            rarity: "common",
            stats: { defense: 18, speed: -3 },
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
            rarity: "uncommon",
            stats: { defense: 25, magicDefense: 12, speed: -10 },
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
            rarity: "uncommon",
            stats: { defense: 8, magicDefense: 20, magicAttack: 10, mp: 25 },
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
            rarity: "common",
            stats: { hp: 20 },
            value: 200,
            icon: "💍"
        },
        mana_crystal: {
            name: "Mana Crystal",
            description: "A crystal pendant that stores magical energy.",
            type: "accessory",
            rarity: "common",
            stats: { mp: 30, magicAttack: 5 },
            value: 250,
            icon: "💎"
        },
        stealth_cloak: {
            name: "Stealth Cloak",
            description: "A cloak that helps the wearer avoid detection.",
            type: "accessory",
            rarity: "uncommon",
            stats: { speed: 15, critical: 10 },
            effects: ["stealth_bonus"],
            value: 400,
            icon: "🧥"
        },
        holy_symbol: {
            name: "Holy Symbol",
            description: "A blessed amulet that protects against dark magic.",
            type: "accessory",
            rarity: "uncommon",
            stats: { magicDefense: 15, hp: 10 },
            effects: ["undead_resistance"],
            value: 350,
            icon: "✨"
        },
        nature_charm: {
            name: "Nature Charm",
            description: "A charm that connects the wearer to natural forces.",
            type: "accessory",
            rarity: "uncommon",
            stats: { hp: 15, mp: 15, accuracy: 10 },
            effects: ["nature_affinity"],
            value: 300,
            icon: "🍀"
        },
        strength_band: {
            name: "Strength Band",
            description: "A bracer that enhances physical power.",
            type: "accessory",
            rarity: "common",
            stats: { attack: 10, defense: 5 },
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