/**
 * Equipment Data
 * Defines weapons, armor, and accessories with their stats and properties
 */

const EquipmentData = {
    // ================================================
    // WEAPONS
    // ================================================
    weapons: {
        // Knight weapons
        iron_sword: {
            name: "Iron Sword",
            description: "A reliable steel blade, well-balanced for combat.",
            type: "sword",
            rarity: "common",
            value: 150,
            stats: {
                attack: 15,
                accuracy: 5
            },
            classRequirements: ["knight", "paladin", "warrior"],
            levelRequirement: 1
        },
        
        steel_sword: {
            name: "Steel Sword",
            description: "Forged from quality steel, sharper than iron.",
            type: "sword",
            rarity: "common",
            value: 300,
            stats: {
                attack: 25,
                accuracy: 8
            },
            classRequirements: ["knight", "paladin", "warrior"],
            levelRequirement: 5
        },
        
        silver_sword: {
            name: "Silver Sword",
            description: "Blessed silver blade, effective against dark creatures.",
            type: "sword",
            rarity: "uncommon",
            value: 600,
            stats: {
                attack: 35,
                accuracy: 10,
                magicAttack: 5
            },
            classRequirements: ["knight", "paladin"],
            levelRequirement: 10,
            specialProperties: ["blessed", "anti_dark"]
        },
        
        // Wizard weapons
        oak_staff: {
            name: "Oak Staff",
            description: "A sturdy wooden staff that amplifies magical energy.",
            type: "staff",
            rarity: "common",
            value: 100,
            stats: {
                magicAttack: 20,
                mp: 10
            },
            classRequirements: ["wizard"],
            levelRequirement: 1
        },
        
        crystal_staff: {
            name: "Crystal Staff",
            description: "Topped with a glowing crystal that focuses magical power.",
            type: "staff",
            rarity: "uncommon",
            value: 450,
            stats: {
                magicAttack: 40,
                mp: 25,
                magicDefense: 5
            },
            classRequirements: ["wizard"],
            levelRequirement: 8
        },
        
        // Rogue weapons
        steel_dagger: {
            name: "Steel Dagger",
            description: "A quick, lightweight blade perfect for swift strikes.",
            type: "dagger",
            rarity: "common",
            value: 120,
            stats: {
                attack: 12,
                speed: 8,
                accuracy: 10
            },
            classRequirements: ["rogue"],
            levelRequirement: 1
        },
        
        poison_dagger: {
            name: "Poison Dagger",
            description: "Coated with a deadly toxin that weakens enemies.",
            type: "dagger",
            rarity: "uncommon",
            value: 400,
            stats: {
                attack: 18,
                speed: 10,
                accuracy: 12
            },
            classRequirements: ["rogue"],
            levelRequirement: 6,
            specialProperties: ["poison_chance"]
        },
        
        // Paladin weapons
        blessed_mace: {
            name: "Blessed Mace",
            description: "A holy weapon that channels divine energy.",
            type: "mace",
            rarity: "common",
            value: 180,
            stats: {
                attack: 18,
                magicAttack: 8,
                magicDefense: 5
            },
            classRequirements: ["paladin"],
            levelRequirement: 1
        },
        
        // Ranger weapons
        hunting_bow: {
            name: "Hunting Bow",
            description: "A well-crafted bow with excellent range and precision.",
            type: "bow",
            rarity: "common",
            value: 140,
            stats: {
                attack: 16,
                accuracy: 15
            },
            classRequirements: ["ranger"],
            levelRequirement: 1
        },
        
        // Warrior weapons
        battle_axe: {
            name: "Battle Axe",
            description: "A heavy two-handed axe that deals crushing blows.",
            type: "axe",
            rarity: "common",
            value: 200,
            stats: {
                attack: 22,
                speed: -5
            },
            classRequirements: ["warrior"],
            levelRequirement: 1
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
            type: "light",
            rarity: "common",
            value: 100,
            stats: {
                defense: 8,
                speed: -2
            },
            classRequirements: ["knight", "rogue", "ranger", "warrior"],
            levelRequirement: 1
        },
        
        studded_leather: {
            name: "Studded Leather",
            description: "Leather armor reinforced with metal studs.",
            type: "light",
            rarity: "common",
            value: 200,
            stats: {
                defense: 12,
                speed: -3
            },
            classRequirements: ["knight", "rogue", "ranger", "warrior"],
            levelRequirement: 4
        },
        
        // Medium Armor
        chain_mail: {
            name: "Chain Mail",
            description: "Interlocked metal rings providing solid protection.",
            type: "medium",
            rarity: "common",
            value: 300,
            stats: {
                defense: 15,
                magicDefense: 8,
                speed: -8
            },
            classRequirements: ["knight", "paladin", "warrior"],
            levelRequirement: 6
        },
        
        scale_mail: {
            name: "Scale Mail",
            description: "Overlapping metal scales offering excellent defense.",
            type: "medium",
            rarity: "uncommon",
            value: 500,
            stats: {
                defense: 20,
                speed: -10
            },
            classRequirements: ["knight", "warrior"],
            levelRequirement: 10
        },
        
        // Cloth Armor (Mages)
        cloth_robe: {
            name: "Cloth Robe",
            description: "Simple robes that aid magical concentration.",
            type: "cloth",
            rarity: "common",
            value: 80,
            stats: {
                magicDefense: 12,
                mp: 15
            },
            classRequirements: ["wizard"],
            levelRequirement: 1
        },
        
        silk_robe: {
            name: "Silk Robe",
            description: "Finely woven robes that enhance magical abilities.",
            type: "cloth",
            rarity: "uncommon",
            value: 350,
            stats: {
                magicDefense: 20,
                mp: 30,
                magicAttack: 5
            },
            classRequirements: ["wizard"],
            levelRequirement: 8
        },
        
        // Special Armor
        leather_vest: {
            name: "Leather Vest",
            description: "Lightweight protection that doesn't hinder movement.",
            type: "light",
            rarity: "common",
            value: 90,
            stats: {
                defense: 6,
                speed: 3
            },
            classRequirements: ["rogue"],
            levelRequirement: 1
        },
        
        ranger_cloak: {
            name: "Ranger Cloak",
            description: "Camouflaged cloak that aids stealth and mobility.",
            type: "light",
            rarity: "common",
            value: 110,
            stats: {
                defense: 5,
                speed: 5,
                accuracy: 5
            },
            classRequirements: ["ranger"],
            levelRequirement: 1
        }
    },
    
    // ================================================
    // ACCESSORIES
    // ================================================
    accessories: {
        // Rings
        health_ring: {
            name: "Health Ring",
            description: "A ruby ring that increases vitality.",
            type: "ring",
            rarity: "common",
            value: 200,
            stats: {
                hp: 25
            },
            levelRequirement: 1
        },
        
        mana_ring: {
            name: "Mana Ring",
            description: "A sapphire ring that enhances magical energy.",
            type: "ring",
            rarity: "common",
            value: 200,
            stats: {
                mp: 30
            },
            levelRequirement: 1
        },
        
        power_ring: {
            name: "Power Ring",
            description: "An emerald ring that boosts physical strength.",
            type: "ring",
            rarity: "uncommon",
            value: 400,
            stats: {
                attack: 10,
                magicAttack: 10
            },
            levelRequirement: 8
        },
        
        // Amulets/Crystals
        mana_crystal: {
            name: "Mana Crystal",
            description: "A crystalline pendant that stores magical energy.",
            type: "crystal",
            rarity: "common",
            value: 150,
            stats: {
                mp: 30,
                magicAttack: 5
            },
            classRequirements: ["wizard", "paladin"],
            levelRequirement: 1
        },
        
        protection_amulet: {
            name: "Protection Amulet",
            description: "A blessed charm that wards off harm.",
            type: "amulet",
            rarity: "uncommon",
            value: 350,
            stats: {
                defense: 8,
                magicDefense: 12
            },
            levelRequirement: 5
        },
        
        // Class-specific accessories
        stealth_cloak: {
            name: "Stealth Cloak",
            description: "A shadowy cloak that aids in remaining unseen.",
            type: "cloak",
            rarity: "uncommon",
            value: 300,
            stats: {
                speed: 10,
                accuracy: 8
            },
            classRequirements: ["rogue"],
            levelRequirement: 3,
            specialProperties: ["stealth_bonus"]
        },
        
        holy_symbol: {
            name: "Holy Symbol",
            description: "A sacred emblem that channels divine power.",
            type: "symbol",
            rarity: "common",
            value: 180,
            stats: {
                magicDefense: 10,
                mp: 20
            },
            classRequirements: ["paladin"],
            levelRequirement: 1
        },
        
        nature_charm: {
            name: "Nature Charm",
            description: "A wooden pendant that connects with natural forces.",
            type: "charm",
            rarity: "common",
            value: 160,
            stats: {
                hp: 15,
                mp: 15
            },
            classRequirements: ["ranger"],
            levelRequirement: 1
        },
        
        strength_band: {
            name: "Strength Band",
            description: "A metal bracer that enhances physical power.",
            type: "band",
            rarity: "common",
            value: 170,
            stats: {
                attack: 8,
                hp: 20
            },
            classRequirements: ["warrior", "knight"],
            levelRequirement: 1
        }
    },
    
    /**
     * Get equipment item by ID and type
     */
    getItem: function(itemId, type = null) {
        if (type) {
            return this[type][itemId] || null;
        }
        
        // Search all categories if type not specified
        for (const category of ['weapons', 'armor', 'accessories']) {
            if (this[category][itemId]) {
                return { ...this[category][itemId], category: category };
            }
        }
        
        return null;
    },
    
    /**
     * Get all items of a specific type
     */
    getItemsByType: function(type) {
        return this[type] || {};
    },
    
    /**
     * Get items available for a character class
     */
    getItemsForClass: function(className) {
        const availableItems = {};
        
        for (const [category, items] of Object.entries(this)) {
            if (typeof items !== 'object' || !items) continue;
            if (category.startsWith('get')) continue; // Skip methods
            
            availableItems[category] = {};
            
            for (const [itemId, item] of Object.entries(items)) {
                if (!item.classRequirements || 
                    item.classRequirements.includes(className)) {
                    availableItems[category][itemId] = item;
                }
            }
        }
        
        return availableItems;
    },
    
    /**
     * Get items available at a specific level
     */
    getItemsForLevel: function(level) {
        const availableItems = {};
        
        for (const [category, items] of Object.entries(this)) {
            if (typeof items !== 'object' || !items) continue;
            if (category.startsWith('get')) continue; // Skip methods
            
            availableItems[category] = {};
            
            for (const [itemId, item] of Object.entries(items)) {
                if (item.levelRequirement <= level) {
                    availableItems[category][itemId] = item;
                }
            }
        }
        
        return availableItems;
    },
    
    /**
     * Get items by rarity
     */
    getItemsByRarity: function(rarity) {
        const items = {};
        
        for (const [category, categoryItems] of Object.entries(this)) {
            if (typeof categoryItems !== 'object' || !categoryItems) continue;
            if (category.startsWith('get')) continue; // Skip methods
            
            items[category] = {};
            
            for (const [itemId, item] of Object.entries(categoryItems)) {
                if (item.rarity === rarity) {
                    items[category][itemId] = item;
                }
            }
        }
        
        return items;
    },
    
    /**
     * Check if player can equip item
     */
    canEquip: function(itemId, playerClass, playerLevel) {
        const item = this.getItem(itemId);
        if (!item) return false;
        
        // Check level requirement
        if (item.levelRequirement > playerLevel) {
            return false;
        }
        
        // Check class requirement
        if (item.classRequirements && 
            !item.classRequirements.includes(playerClass)) {
            return false;
        }
        
        return true;
    },
    
    /**
     * Get equipment slot for item
     */
    getItemSlot: function(itemId) {
        if (this.weapons[itemId]) return 'weapon';
        if (this.armor[itemId]) return 'armor';
        if (this.accessories[itemId]) return 'accessory';
        return null;
    },
    
    /**
     * Calculate total stats from equipment set
     */
    calculateEquipmentStats: function(equipment) {
        const totalStats = {
            hp: 0, mp: 0, attack: 0, defense: 0,
            magicAttack: 0, magicDefense: 0, speed: 0, accuracy: 0
        };
        
        for (const [slot, itemId] of Object.entries(equipment)) {
            if (!itemId) continue;
            
            const item = this.getItem(itemId);
            if (item && item.stats) {
                for (const [stat, value] of Object.entries(item.stats)) {
                    if (totalStats.hasOwnProperty(stat)) {
                        totalStats[stat] += value;
                    }
                }
            }
        }
        
        return totalStats;
    },
    
    /**
     * Get random equipment drop
     */
    generateRandomDrop: function(playerLevel, rarity = null) {
        // Filter items by level
        const availableItems = [];
        
        for (const [category, items] of Object.entries(this)) {
            if (typeof items !== 'object' || !items) continue;
            if (category.startsWith('get')) continue; // Skip methods
            
            for (const [itemId, item] of Object.entries(items)) {
                if (item.levelRequirement <= playerLevel + 3) { // Allow slightly higher level items
                    if (!rarity || item.rarity === rarity) {
                        availableItems.push({ id: itemId, ...item, category });
                    }
                }
            }
        }
        
        if (availableItems.length === 0) return null;
        
        // Weight by rarity (lower rarity = higher chance)
        const weights = availableItems.map(item => {
            switch (item.rarity) {
                case 'common': return 10;
                case 'uncommon': return 5;
                case 'rare': return 2;
                case 'legendary': return 1;
                default: return 5;
            }
        });
        
        if (typeof GameUtils !== 'undefined') {
            const selectedItem = GameUtils.weightedChoice(availableItems, weights);
            return selectedItem ? selectedItem.id : null;
        }
        
        // Fallback random selection
        return availableItems[Math.floor(Math.random() * availableItems.length)].id;
    }
};

// Make available globally
window.EquipmentData = EquipmentData;