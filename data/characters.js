/**
 * Character Classes Data
 * Defines the 6 playable character classes with their stats and abilities
 */

const CharacterData = {
    classes: {
        knight: {
            name: "Knight",
            description: "Strong defense and sword mastery",
            baseStats: {
                hp: 120,
                mp: 30,
                attack: 85,
                defense: 95,
                magicAttack: 40,
                magicDefense: 70,
                speed: 60,
                accuracy: 80
            },
            statGrowth: {
                hp: 8,
                mp: 2,
                attack: 6,
                defense: 7,
                magicAttack: 2,
                magicDefense: 5,
                speed: 3,
                accuracy: 4
            },
            weaponTypes: ["sword", "shield", "heavy_armor"],
            startingSpells: ["heal"],
            learnableSpells: ["heal", "cure", "protect", "shell", "mighty_strike"],
            monsterAffinities: ["defensive", "tank", "earth"],
            classBonus: "Increased capture rate for defensive monsters"
        },
        
        wizard: {
            name: "Wizard",
            description: "Master of elemental magic",
            baseStats: {
                hp: 70,
                mp: 100,
                attack: 45,
                defense: 40,
                magicAttack: 110,
                magicDefense: 85,
                speed: 70,
                accuracy: 90
            },
            statGrowth: {
                hp: 4,
                mp: 8,
                attack: 2,
                defense: 2,
                magicAttack: 8,
                magicDefense: 6,
                speed: 4,
                accuracy: 5
            },
            weaponTypes: ["staff", "wand", "robe"],
            startingSpells: ["fire", "ice"],
            learnableSpells: ["fire", "ice", "thunder", "heal", "sleep", "silence", "meteor"],
            monsterAffinities: ["magical", "elemental", "fire", "ice", "thunder"],
            classBonus: "Can teach elemental spells to captured monsters"
        },
        
        rogue: {
            name: "Rogue",
            description: "Swift and sneaky combatant",
            baseStats: {
                hp: 90,
                mp: 50,
                attack: 90,
                defense: 55,
                magicAttack: 60,
                magicDefense: 50,
                speed: 110,
                accuracy: 95
            },
            statGrowth: {
                hp: 5,
                mp: 3,
                attack: 7,
                defense: 3,
                magicAttack: 4,
                magicDefense: 3,
                speed: 8,
                accuracy: 7
            },
            weaponTypes: ["dagger", "bow", "light_armor"],
            startingSpells: ["steal"],
            learnableSpells: ["steal", "sleep", "poison", "haste", "sneak_attack", "backstab"],
            monsterAffinities: ["fast", "sneaky", "poison", "dark"],
            classBonus: "Higher chance to capture rare monsters"
        },
        
        paladin: {
            name: "Paladin",
            description: "Holy warrior with healing powers",
            baseStats: {
                hp: 110,
                mp: 70,
                attack: 75,
                defense: 85,
                magicAttack: 70,
                magicDefense: 90,
                speed: 65,
                accuracy: 85
            },
            statGrowth: {
                hp: 7,
                mp: 5,
                attack: 5,
                defense: 6,
                magicAttack: 5,
                magicDefense: 7,
                speed: 3,
                accuracy: 5
            },
            weaponTypes: ["sword", "mace", "holy_armor"],
            startingSpells: ["heal", "cure"],
            learnableSpells: ["heal", "cure", "esuna", "protect", "shell", "holy", "revive"],
            monsterAffinities: ["holy", "healing", "light", "defensive"],
            classBonus: "Captured monsters gain holy resistance"
        },
        
        ranger: {
            name: "Ranger",
            description: "Nature's guardian with bow mastery",
            baseStats: {
                hp: 100,
                mp: 60,
                attack: 80,
                defense: 65,
                magicAttack: 65,
                magicDefense: 70,
                speed: 90,
                accuracy: 100
            },
            statGrowth: {
                hp: 6,
                mp: 4,
                attack: 6,
                defense: 4,
                magicAttack: 4,
                magicDefense: 5,
                speed: 6,
                accuracy: 6
            },
            weaponTypes: ["bow", "spear", "nature_armor"],
            startingSpells: ["heal", "beast_call"],
            learnableSpells: ["heal", "beast_call", "nature_blessing", "entangle", "arrow_rain", "track"],
            monsterAffinities: ["nature", "beast", "earth", "wind"],
            classBonus: "Can communicate with and befriend wild monsters easier"
        },
        
        warrior: {
            name: "Warrior",
            description: "Fierce fighter with axe expertise",
            baseStats: {
                hp: 130,
                mp: 40,
                attack: 100,
                defense: 80,
                magicAttack: 35,
                magicDefense: 60,
                speed: 70,
                accuracy: 85
            },
            statGrowth: {
                hp: 9,
                mp: 2,
                attack: 8,
                defense: 5,
                magicAttack: 1,
                magicDefense: 4,
                speed: 4,
                accuracy: 5
            },
            weaponTypes: ["axe", "hammer", "battle_armor"],
            startingSpells: ["rage"],
            learnableSpells: ["rage", "berserk", "intimidate", "power_strike", "weapon_break"],
            monsterAffinities: ["aggressive", "physical", "fire", "earth"],
            classBonus: "Captured monsters gain increased attack power"
        }
    },
    
    /**
     * Get character class data by name
     */
    getClass: function(className) {
        return this.classes[className] || null;
    },
    
    /**
     * Get all available class names
     */
    getClassNames: function() {
        return Object.keys(this.classes);
    },
    
    /**
     * Calculate stats at a given level
     */
    getStatsAtLevel: function(className, level) {
        const classData = this.getClass(className);
        if (!classData) return null;
        
        const stats = { ...classData.baseStats };
        const growth = classData.statGrowth;
        
        // Apply level-based growth (level 1 = base stats)
        const levelsToGrow = level - 1;
        for (const stat in growth) {
            stats[stat] += growth[stat] * levelsToGrow;
        }
        
        return stats;
    },
    
    /**
     * Get spells available at a given level
     */
    getSpellsAtLevel: function(className, level) {
        const classData = this.getClass(className);
        if (!classData) return [];
        
        const availableSpells = [...classData.startingSpells];
        
        // Add spells based on level (simplified - every 3 levels unlock a new spell)
        const spellsToUnlock = Math.floor(level / 3);
        const additionalSpells = classData.learnableSpells
            .filter(spell => !classData.startingSpells.includes(spell))
            .slice(0, spellsToUnlock);
        
        return [...availableSpells, ...additionalSpells];
    }
};

// Make available globally
window.CharacterData = CharacterData;