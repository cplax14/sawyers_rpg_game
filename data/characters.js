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
            spellProgression: {
                1: ["heal"],
                3: ["cure"],
                6: ["protect"],
                10: ["shell"],
                15: ["mighty_strike"]
            },
            spellAffinities: ["healing", "defensive", "holy"],
            spellCapacity: { // Maximum number of spells that can be learned
                base: 6,
                perLevel: 0.2
            },
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
            spellProgression: {
                1: ["fire", "ice"],
                3: ["heal"],
                5: ["thunder"],
                8: ["sleep"],
                12: ["silence"],
                20: ["meteor"]
            },
            spellAffinities: ["offensive", "elemental", "fire", "ice", "thunder"],
            spellCapacity: {
                base: 10,
                perLevel: 0.3
            },
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
            spellProgression: {
                1: ["steal"],
                4: ["sleep"],
                7: ["poison"],
                10: ["haste"],
                14: ["sneak_attack"],
                18: ["backstab"]
            },
            spellAffinities: ["debuff", "utility", "dark"],
            spellCapacity: {
                base: 7,
                perLevel: 0.25
            },
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
            spellProgression: {
                1: ["heal", "cure"],
                5: ["esuna"],
                8: ["protect"],
                12: ["shell"],
                16: ["holy"],
                20: ["revive"]
            },
            spellAffinities: ["healing", "holy", "defensive"],
            spellCapacity: {
                base: 8,
                perLevel: 0.25
            },
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
            spellProgression: {
                1: ["heal", "beast_call"],
                6: ["nature_blessing"],
                9: ["entangle"],
                13: ["arrow_rain"],
                17: ["track"]
            },
            spellAffinities: ["nature", "healing", "utility"],
            spellCapacity: {
                base: 7,
                perLevel: 0.2
            },
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
            spellProgression: {
                1: ["rage"],
                5: ["intimidate"],
                9: ["power_strike"],
                13: ["weapon_break"],
                17: ["berserk"]
            },
            spellAffinities: ["offensive", "self_buff", "physical"],
            spellCapacity: {
                base: 5,
                perLevel: 0.15
            },
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
     * Get spells available at a given level (integrated with SpellData)
     */
    getSpellsAtLevel: function(className, level) {
        const classData = this.getClass(className);
        if (!classData) return [];

        // Use SpellData for accurate spell learning if available
        if (typeof SpellData !== 'undefined') {
            return SpellData.getSpellsForLevel(className, level);
        }

        // Fallback to original system if SpellData not available
        const availableSpells = [...classData.startingSpells];
        const spellsToUnlock = Math.floor(level / 3);
        const additionalSpells = classData.learnableSpells
            .filter(spell => !classData.startingSpells.includes(spell))
            .slice(0, spellsToUnlock);

        return [...availableSpells, ...additionalSpells];
    },

    /**
     * Get spells that can be learned at a specific level
     */
    getNewSpellsAtLevel: function(className, level) {
        if (typeof SpellData === 'undefined') return [];

        const availableSpells = [];

        for (const [spellId, spell] of Object.entries(SpellData.spells)) {
            if (spell.availableClasses.includes(className) &&
                spell.learnLevel === level) {
                availableSpells.push(spellId);
            }
        }

        return availableSpells;
    },

    /**
     * Get complete spell learning progression for a class
     */
    getSpellProgression: function(className) {
        const classData = this.getClass(className);
        if (!classData || typeof SpellData === 'undefined') return {};

        const progression = {};

        // Group spells by level they can be learned
        for (const [spellId, spell] of Object.entries(SpellData.spells)) {
            if (spell.availableClasses.includes(className)) {
                const level = spell.learnLevel;
                if (!progression[level]) {
                    progression[level] = [];
                }
                progression[level].push({
                    spellId: spellId,
                    spell: spell,
                    name: spell.name,
                    mpCost: spell.mpCost,
                    type: spell.type,
                    description: spell.description
                });
            }
        }

        return progression;
    },

    /**
     * Get spell learning opportunities for level up
     */
    getSpellLearningOpportunities: function(className, currentLevel, newLevel) {
        const opportunities = [];

        // Get all spells that can be learned between current and new level
        for (let level = currentLevel + 1; level <= newLevel; level++) {
            const newSpells = this.getNewSpellsAtLevel(className, level);
            for (const spellId of newSpells) {
                if (typeof SpellData !== 'undefined') {
                    const spell = SpellData.getSpell(spellId);
                    if (spell) {
                        opportunities.push({
                            spellId: spellId,
                            spell: spell,
                            learnLevel: level,
                            source: 'level_up'
                        });
                    }
                }
            }
        }

        return opportunities;
    },

    /**
     * Check if a class can learn a specific spell
     */
    canClassLearnSpell: function(className, spellId) {
        if (typeof SpellData === 'undefined') {
            // Fallback to class learnable spells list
            const classData = this.getClass(className);
            return classData ? classData.learnableSpells.includes(spellId) : false;
        }

        const spell = SpellData.getSpell(spellId);
        return spell ? spell.availableClasses.includes(className) : false;
    },

    /**
     * Get class-specific spell affinity bonus
     */
    getSpellAffinityBonus: function(className, spellType) {
        const affinityBonuses = {
            knight: {
                healing: 1.1,
                defensive: 1.2,
                holy: 1.15
            },
            wizard: {
                offensive: 1.2,
                elemental: 1.25,
                fire: 1.15,
                ice: 1.15,
                thunder: 1.15
            },
            paladin: {
                healing: 1.25,
                holy: 1.3,
                defensive: 1.15
            },
            ranger: {
                nature: 1.2,
                healing: 1.1,
                utility: 1.15
            },
            rogue: {
                debuff: 1.2,
                utility: 1.15,
                dark: 1.1
            },
            warrior: {
                physical: 1.15,
                offensive: 1.1,
                self_buff: 1.2
            }
        };

        const classAffinities = affinityBonuses[className];
        return classAffinities ? (classAffinities[spellType] || 1.0) : 1.0;
    },

    /**
     * Get maximum spell level a class can learn
     */
    getMaxSpellLevel: function(className) {
        if (typeof SpellData === 'undefined') return 20; // Default max level

        let maxLevel = 0;

        for (const [spellId, spell] of Object.entries(SpellData.spells)) {
            if (spell.availableClasses.includes(className)) {
                maxLevel = Math.max(maxLevel, spell.learnLevel);
            }
        }

        return maxLevel;
    },

    /**
     * Get recommended spell build for a class at given level
     */
    getRecommendedSpells: function(className, level) {
        const allSpells = this.getSpellsAtLevel(className, level);
        const classData = this.getClass(className);

        if (!classData || typeof SpellData === 'undefined') return allSpells;

        // Prioritize spells based on class characteristics
        const priorities = {
            knight: ['healing', 'defensive', 'holy'],
            wizard: ['offensive', 'elemental'],
            paladin: ['healing', 'holy', 'defensive'],
            ranger: ['nature', 'utility', 'healing'],
            rogue: ['debuff', 'utility'],
            warrior: ['offensive', 'self_buff']
        };

        const classPriorities = priorities[className] || [];

        return allSpells.sort((a, b) => {
            const spellA = SpellData.getSpell(a);
            const spellB = SpellData.getSpell(b);

            if (!spellA || !spellB) return 0;

            const priorityA = classPriorities.indexOf(spellA.type);
            const priorityB = classPriorities.indexOf(spellB.type);

            // Higher priority types first (lower index = higher priority)
            if (priorityA !== -1 && priorityB !== -1) {
                return priorityA - priorityB;
            }
            if (priorityA !== -1) return -1;
            if (priorityB !== -1) return 1;

            // If no priority difference, sort by MP cost (cheaper first for recommended)
            return spellA.mpCost - spellB.mpCost;
        });
    },

    /**
     * Get spell capacity for a character at given level
     */
    getSpellCapacity: function(className, level) {
        const classData = this.getClass(className);
        if (!classData || !classData.spellCapacity) return 10; // Default capacity

        const capacity = classData.spellCapacity;
        return Math.floor(capacity.base + (capacity.perLevel * (level - 1)));
    },

    /**
     * Get spells available from class progression system
     */
    getClassProgressionSpells: function(className, level) {
        const classData = this.getClass(className);
        if (!classData || !classData.spellProgression) return [];

        const availableSpells = [];

        // Get all spells from progression that can be learned at or below current level
        for (const [levelReq, spells] of Object.entries(classData.spellProgression)) {
            if (parseInt(levelReq) <= level) {
                availableSpells.push(...spells);
            }
        }

        return [...new Set(availableSpells)]; // Remove duplicates
    },

    /**
     * Get spells that become available at a specific level from class progression
     */
    getClassProgressionSpellsForLevel: function(className, level) {
        const classData = this.getClass(className);
        if (!classData || !classData.spellProgression) return [];

        return classData.spellProgression[level] || [];
    },

    /**
     * Check if character is near spell capacity limit
     */
    isNearSpellCapacity: function(className, level, currentSpellCount) {
        const maxCapacity = this.getSpellCapacity(className, level);
        const warningThreshold = Math.max(1, Math.floor(maxCapacity * 0.8)); // 80% threshold

        return currentSpellCount >= warningThreshold;
    },

    /**
     * Get spell learning priority for a class
     */
    getSpellLearningPriority: function(className, spellId) {
        const classData = this.getClass(className);
        if (!classData) return 0;

        // Check if spell is in class affinity list
        const spellAffinities = classData.spellAffinities || [];

        if (typeof SpellData !== 'undefined') {
            const spell = SpellData.getSpell(spellId);
            if (spell) {
                // Higher priority for spells that match class affinities
                for (let i = 0; i < spellAffinities.length; i++) {
                    if (spell.type === spellAffinities[i] || spell.element === spellAffinities[i]) {
                        return 10 - i; // Higher number = higher priority
                    }
                }

                // Medium priority for learnable spells
                if (classData.learnableSpells.includes(spellId)) {
                    return 3;
                }

                // Low priority for starting spells (already known)
                if (classData.startingSpells.includes(spellId)) {
                    return 1;
                }
            }
        }

        return 0; // No priority
    },

    /**
     * Get optimal spell build for a character level
     */
    getOptimalSpellBuild: function(className, level) {
        const maxCapacity = this.getSpellCapacity(className, level);
        const availableSpells = this.getSpellsAtLevel(className, level);
        const classData = this.getClass(className);

        if (!classData) return [];

        // Sort spells by priority and select top ones up to capacity
        const prioritizedSpells = availableSpells
            .map(spellId => ({
                spellId: spellId,
                priority: this.getSpellLearningPriority(className, spellId),
                mpCost: this.getSpellMPCost(spellId)
            }))
            .sort((a, b) => {
                // First by priority, then by MP cost (cheaper is better for same priority)
                if (b.priority !== a.priority) {
                    return b.priority - a.priority;
                }
                return a.mpCost - b.mpCost;
            })
            .slice(0, maxCapacity)
            .map(item => item.spellId);

        return prioritizedSpells;
    },

    /**
     * Helper method to get spell MP cost
     */
    getSpellMPCost: function(spellId) {
        if (typeof SpellData !== 'undefined') {
            const spell = SpellData.getSpell(spellId);
            return spell ? spell.mpCost : 999; // High cost for unknown spells
        }
        return 10; // Default MP cost
    }
};

// Make available globally
window.CharacterData = CharacterData;