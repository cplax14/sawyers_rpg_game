/**
 * Loot System
 * Manages tiered loot collection, drop calculations, and distribution
 * Supports rarity-based drops with level scaling and area-specific loot tables
 */

const LootSystem = {
    // Rarity tier definitions with standardized drop rates and scaling
    // Target distribution: 65% common, 25% uncommon, 8% rare, 1.8% epic, 0.2% legendary
    rarityTiers: {
        common: {
            name: 'Common',
            color: '#9e9e9e',
            dropRate: 0.65,        // 65% base chance
            levelScaling: 0.02,    // +2% per level difference (helps with progression)
            valueMultiplier: 1.0,
            qualityRange: [0.8, 1.2]
        },
        uncommon: {
            name: 'Uncommon',
            color: '#4caf50',
            dropRate: 0.25,        // 25% base chance
            levelScaling: 0.015,   // +1.5% per level difference
            valueMultiplier: 2.0,
            qualityRange: [0.9, 1.4]
        },
        rare: {
            name: 'Rare',
            color: '#2196f3',
            dropRate: 0.08,        // 8% base chance
            levelScaling: 0.01,    // +1% per level difference
            valueMultiplier: 4.0,
            qualityRange: [1.0, 1.6]
        },
        epic: {
            name: 'Epic',
            color: '#9c27b0',
            dropRate: 0.018,       // 1.8% base chance (updated from 1.5%)
            levelScaling: 0.005,   // +0.5% per level difference
            valueMultiplier: 8.0,
            qualityRange: [1.2, 2.0]
        },
        legendary: {
            name: 'Legendary',
            color: '#ff9800',
            dropRate: 0.002,       // 0.2% base chance
            levelScaling: 0.001,   // +0.1% per level difference
            valueMultiplier: 20.0,
            qualityRange: [1.5, 3.0]
        }
    },

    // Loot categories and their generation rules
    lootCategories: {
        equipment: {
            slots: ['weapon', 'armor', 'accessory'],
            statModifiers: ['attack', 'defense', 'magicAttack', 'magicDefense', 'speed', 'accuracy'],
            levelScaling: true
        },
        consumables: {
            types: ['healing', 'mana', 'buff', 'utility'],
            stackable: true,
            levelScaling: false
        },
        materials: {
            types: ['crafting', 'upgrade', 'spell_component'],
            stackable: true,
            levelScaling: true
        },
        currency: {
            types: ['gold', 'tokens'],
            stackable: true,
            levelScaling: true
        }
    },

    /**
     * Initialize the loot system
     */
    initialize: function() {
        this.validateRarityTiers();
        this.initializeLootCache();
        console.log('🎁 Loot System initialized with', Object.keys(this.rarityTiers).length, 'rarity tiers');
    },

    /**
     * Validate rarity tier configuration
     */
    validateRarityTiers: function() {
        const totalDropRate = Object.values(this.rarityTiers)
            .reduce((sum, tier) => sum + tier.dropRate, 0);

        if (Math.abs(totalDropRate - 1.0) > 0.001) {
            console.warn('⚠️ Rarity tier drop rates do not sum to 1.0:', totalDropRate);
        }
    },

    /**
     * Normalize rarity weights to ensure they sum to 1.0 for consistent distribution
     */
    normalizeRarityWeights: function(rarityWeights) {
        if (!rarityWeights || Object.keys(rarityWeights).length === 0) {
            return this.getDefaultRarityWeights();
        }

        // Calculate total weight
        const totalWeight = Object.values(rarityWeights).reduce((sum, weight) => sum + (weight || 0), 0);

        if (totalWeight <= 0) {
            console.warn('⚠️ Invalid rarity weights (zero total), using defaults');
            return this.getDefaultRarityWeights();
        }

        // Normalize weights to sum to 1.0
        const normalizedWeights = {};
        for (const [rarity, weight] of Object.entries(rarityWeights)) {
            normalizedWeights[rarity] = (weight || 0) / totalWeight;
        }

        return normalizedWeights;
    },

    /**
     * Get default rarity weights that match target distribution
     */
    getDefaultRarityWeights: function() {
        return {
            common: 0.65,       // 65%
            uncommon: 0.25,     // 25%
            rare: 0.08,         // 8%
            epic: 0.018,        // 1.8%
            legendary: 0.002    // 0.2%
        };
    },

    /**
     * Get phase-based progression rarity weights optimized for learning curve
     * Implements 80%+ basic reward frequency for early game (levels 1-10)
     */
    getPhaseBasedRarityWeights: function(playerLevel, contentLevel = null) {
        // Use player level as primary determinant, content level for fine-tuning
        const effectiveLevel = playerLevel;

        // Define progression phases with learning-focused distributions
        if (effectiveLevel <= 10) {
            // Early Game Phase (Levels 1-10): Learning Focus with 80%+ Basic Rewards
            // Emphasize common/uncommon items for skill learning and resource management
            return {
                common: 0.65,       // 65% common items (healing, materials, basic equipment)
                uncommon: 0.28,     // 28% uncommon (better equipment, learning spells) = 93% basic total
                rare: 0.06,         // 6% rare (special equipment, advanced spells)
                epic: 0.01,         // 1% epic (rare progression items)
                legendary: 0.00     // 0% legendary (none in early game for balance)
            };
        } else if (effectiveLevel <= 20) {
            // Mid Game Phase (Levels 11-20): Strategic Equipment Variety
            // Balanced distribution with equipment diversity and spell variety
            return {
                common: 0.50,       // 50% common (consumables, materials, basic equipment)
                uncommon: 0.35,     // 35% uncommon (strategic equipment, diverse spells)
                rare: 0.12,         // 12% rare (significant upgrades, class specialization)
                epic: 0.025,        // 2.5% epic (powerful equipment, advanced spells)
                legendary: 0.005    // 0.5% legendary (very rare progression items)
            };
        } else {
            // Late Game Phase (Levels 21-30+): Rare/Epic/Legendary Focus
            // Higher rarity distribution for endgame progression and prestige
            return {
                common: 0.35,       // 35% common (materials, consumables)
                uncommon: 0.30,     // 30% uncommon (utility items, materials)
                rare: 0.25,         // 25% rare (significant equipment, spells)
                epic: 0.08,         // 8% epic (powerful endgame items)
                legendary: 0.02     // 2% legendary (prestige items, ultimate equipment)
            };
        }
    },

    /**
     * Get early game learning-focused item type priorities
     * Ensures 80%+ basic reward frequency with educational value
     */
    getEarlyGameItemTypePriorities: function(playerLevel, encounterType = 'general') {
        if (playerLevel > 10) {
            return null; // Only applies to early game
        }

        // Define learning-focused item priorities for early game
        const priorities = {
            // High priority: Essential learning items (60% of drops)
            essential: {
                weight: 0.60,
                items: [
                    'healing_potion',      // Resource management learning
                    'mana_potion',         // Magic resource understanding
                    'iron_sword',          // Basic weapon progression
                    'leather_armor',       // Defense concept introduction
                    'spell_scroll'         // Magic system introduction
                ]
            },

            // Medium priority: Skill development items (25% of drops)
            development: {
                weight: 0.25,
                items: [
                    'oak_staff',           // Caster weapon option
                    'steel_dagger',        // Alternative weapon type
                    'health_ring',         // Accessory concept
                    'nature_charm',        // Elemental resistance intro
                    'cloth_robe',          // Caster armor option
                    'spell_book'           // Advanced magic learning
                ]
            },

            // Low priority: Exploration rewards (15% of drops)
            exploration: {
                weight: 0.15,
                items: [
                    'material',            // Crafting system preview
                    'gold',                // Economy introduction
                    'stamina_potion',      // Advanced resource management
                    'leather_scraps',      // Material variety
                    'iron_ore'             // Resource gathering concept
                ]
            }
        };

        return priorities;
    },

    /**
     * Select learning-appropriate item for early game players
     * Implements educational progression and resource management teaching
     */
    selectEarlyGameLearningItem: function(playerLevel, rarity = 'common', encounterContext = {}) {
        const priorities = this.getEarlyGameItemTypePriorities(playerLevel, encounterContext.type);
        if (!priorities) {
            return null; // Not early game
        }

        // Determine priority tier based on random roll weighted by learning needs
        const roll = Math.random();
        let selectedTier = null;

        if (roll < priorities.essential.weight) {
            selectedTier = priorities.essential;
        } else if (roll < priorities.essential.weight + priorities.development.weight) {
            selectedTier = priorities.development;
        } else {
            selectedTier = priorities.exploration;
        }

        // Select random item from the chosen tier
        const selectedItemType = selectedTier.items[Math.floor(Math.random() * selectedTier.items.length)];

        // Apply learning-focused modifications based on player level
        const learningModifications = this.getEarlyGameLearningModifications(playerLevel, selectedItemType, rarity);

        return {
            itemType: selectedItemType,
            modifications: learningModifications,
            learningValue: this.calculateLearningValue(selectedItemType, playerLevel),
            tier: selectedTier === priorities.essential ? 'essential' :
                  selectedTier === priorities.development ? 'development' : 'exploration'
        };
    },

    /**
     * Get learning-focused modifications for early game items
     */
    getEarlyGameLearningModifications: function(playerLevel, itemType, rarity) {
        const modifications = {
            dropChanceBonus: 0,
            quantityBonus: 0,
            valueAdjustment: 1.0,
            learningHints: []
        };

        // Essential learning items get significant bonuses
        const essentialItems = ['healing_potion', 'mana_potion', 'iron_sword', 'leather_armor', 'spell_scroll'];
        if (essentialItems.includes(itemType)) {
            modifications.dropChanceBonus = 0.25; // +25% drop chance
            modifications.learningHints.push(`Essential for level ${playerLevel} progression`);

            // Consumables get quantity bonuses to teach resource management
            if (['healing_potion', 'mana_potion'].includes(itemType)) {
                modifications.quantityBonus = Math.min(3, Math.floor(playerLevel / 3) + 1);
                modifications.learningHints.push('Use wisely - resources are limited');
            }
        }

        // Equipment items get progression hints
        const equipmentItems = ['iron_sword', 'leather_armor', 'oak_staff', 'steel_dagger', 'health_ring'];
        if (equipmentItems.includes(itemType)) {
            modifications.learningHints.push('Equip in inventory to improve combat effectiveness');
            if (playerLevel <= 3) {
                modifications.learningHints.push('Try different equipment types to find your playstyle');
            }
        }

        // Spell learning items get magic system introduction
        const spellItems = ['spell_scroll', 'spell_book'];
        if (spellItems.includes(itemType)) {
            modifications.learningHints.push('Learn spells to unlock new combat abilities');
            if (playerLevel <= 5) {
                modifications.learningHints.push('Start with basic spells like Heal or Magic Bolt');
            }
        }

        return modifications;
    },

    /**
     * Calculate learning value score for educational progression
     */
    calculateLearningValue: function(itemType, playerLevel) {
        const learningScores = {
            // Core survival items - highest learning value
            'healing_potion': 10,
            'mana_potion': 9,

            // Equipment progression - high learning value
            'iron_sword': 8,
            'leather_armor': 8,
            'oak_staff': 7,

            // System introduction - medium-high learning value
            'spell_scroll': 7,
            'health_ring': 6,
            'steel_dagger': 6,

            // Variety and options - medium learning value
            'cloth_robe': 5,
            'nature_charm': 5,
            'spell_book': 5,

            // Advanced concepts - lower early game learning value
            'material': 3,
            'gold': 2,
            'stamina_potion': 4
        };

        const baseScore = learningScores[itemType] || 3;

        // Adjust based on player level - some items more valuable at different stages
        let levelAdjustment = 1.0;
        if (playerLevel <= 3) {
            // Very early game - prioritize survival
            if (['healing_potion', 'iron_sword', 'leather_armor'].includes(itemType)) {
                levelAdjustment = 1.3;
            }
        } else if (playerLevel <= 6) {
            // Early-mid game - prioritize variety and magic
            if (['spell_scroll', 'oak_staff', 'mana_potion'].includes(itemType)) {
                levelAdjustment = 1.2;
            }
        } else {
            // Late early game - prioritize optimization and materials
            if (['spell_book', 'material', 'stamina_potion'].includes(itemType)) {
                levelAdjustment = 1.1;
            }
        }

        return Math.round(baseScore * levelAdjustment);
    },

    /**
     * Apply early game learning enhancements to loot items
     * Implements 80%+ basic reward frequency with educational focus for levels 1-10
     */
    applyEarlyGameLearningEnhancements: function(item, itemType, rarity, playerLevel, contentLevel) {
        // Get learning modifications for this item type
        const modifications = this.getEarlyGameLearningModifications(playerLevel, itemType, rarity);

        // Apply quantity bonuses for consumables to teach resource management
        if (modifications.quantityBonus > 0 && item.stackable) {
            const baseQuantity = item.quantity || 1;
            item.quantity = baseQuantity + modifications.quantityBonus;

            // Add learning metadata
            if (!item.learningInfo) item.learningInfo = {};
            item.learningInfo.quantityBonus = modifications.quantityBonus;
            item.learningInfo.purpose = 'resource_management_teaching';
        }

        // Apply value adjustments for early game balance
        if (modifications.valueAdjustment !== 1.0) {
            item.value = Math.round((item.value || item.baseValue || 10) * modifications.valueAdjustment);
        }

        // Add learning hints for educational progression
        if (modifications.learningHints.length > 0) {
            if (!item.learningInfo) item.learningInfo = {};
            item.learningInfo.hints = modifications.learningHints;
            item.learningInfo.playerLevel = playerLevel;
            item.learningInfo.isEarlyGame = true;
        }

        // Add early game progression markers
        item.earlyGameItem = true;
        item.learningValue = this.calculateLearningValue(itemType, playerLevel);

        // Special early game enhancements by item type
        this.applyItemTypeSpecificEarlyGameEnhancements(item, itemType, playerLevel, rarity);
    },

    /**
     * Apply item type specific early game enhancements
     */
    applyItemTypeSpecificEarlyGameEnhancements: function(item, itemType, playerLevel, rarity) {
        // Healing potions: Enhanced early game effectiveness
        if (itemType === 'healing_potion') {
            if (playerLevel <= 3) {
                // Very early game - more reliable healing
                if (item.healAmount) {
                    item.healAmount = Math.round(item.healAmount * 1.2);
                }
                item.description = (item.description || 'Restores health') + ' (Enhanced for new adventurers)';
            }
        }

        // Weapons: Early game damage consistency
        else if (['iron_sword', 'oak_staff', 'steel_dagger'].includes(itemType)) {
            if (playerLevel <= 5) {
                // Reduce damage variance for more predictable early combat
                if (item.damage && Array.isArray(item.damage)) {
                    const avgDamage = (item.damage[0] + item.damage[1]) / 2;
                    const variance = 0.15; // 15% variance instead of default
                    item.damage = [
                        Math.round(avgDamage * (1 - variance)),
                        Math.round(avgDamage * (1 + variance))
                    ];
                }
                item.description = (item.description || 'A reliable weapon') + ' (Balanced for learning combat)';
            }
        }

        // Armor: Early game protection emphasis
        else if (['leather_armor', 'cloth_robe'].includes(itemType)) {
            if (playerLevel <= 4) {
                // Slight armor bonus for survivability learning
                if (item.armor) {
                    item.armor = Math.round(item.armor * 1.1);
                }
                item.description = (item.description || 'Provides protection') + ' (Reinforced for new adventurers)';
            }
        }

        // Spell scrolls: Early game spell accessibility
        else if (itemType === 'spell_scroll') {
            if (playerLevel <= 6) {
                // Reduce mana costs for early learning
                if (item.manaCost) {
                    item.manaCost = Math.max(1, Math.round(item.manaCost * 0.8));
                }
                if (!item.learningInfo) item.learningInfo = {};
                item.learningInfo.reducedManaCost = true;
            }
        }

        // Materials: Early game crafting introduction
        else if (itemType === 'material' || item.category === 'material') {
            if (playerLevel <= 8) {
                // Add crafting introduction hints
                if (!item.learningInfo) item.learningInfo = {};
                item.learningInfo.craftingPreview = true;
                item.description = (item.description || 'A useful material') + ' (Future crafting component)';
            }
        }
    },

    /**
     * Get mid-game strategic equipment and spell priorities (levels 11-20)
     * Emphasizes equipment variety and spell diversity for strategic depth
     */
    getMidGameStrategicPriorities: function(playerLevel, playerClass = null, encounterType = 'general') {
        if (playerLevel < 11 || playerLevel > 20) {
            return null; // Only applies to mid-game
        }

        // Define strategic equipment categories for mid-game depth
        const priorities = {
            // Strategic Equipment: Class-specific and tactical options (40% of drops)
            strategicEquipment: {
                weight: 0.40,
                categories: {
                    weapons: [
                        'steel_sword',         // Upgraded melee option
                        'crystal_staff',       // Advanced caster weapon
                        'elvish_bow',          // Precision ranged weapon
                        'blessed_mace',        // Holy damage option
                        'poisoned_blade',      // Status effect weapon
                        'great_axe',           // High damage two-hander
                        'shadow_blade',        // Stealth/critical weapon
                        'war_hammer'           // Armor penetration option
                    ],
                    armor: [
                        'chain_mail',          // Balanced protection
                        'mage_robes',          // Caster-specific armor
                        'scale_mail',          // Physical damage resistance
                        'plate_armor',         // Heavy protection
                        'stealth_cloak',       // Mobility and stealth
                        'ranger_cloak',        // Environmental protection
                        'battle_vest'          // Combat-focused armor
                    ],
                    accessories: [
                        'strength_band',       // Physical damage boost
                        'mana_crystal',        // Magical power enhancement
                        'precision_ring',      // Accuracy improvement
                        'holy_symbol',         // Divine magic focus
                        'power_ring',          // General stat boost
                        'stealth_cloak',       // Evasion and stealth
                        'eagle_eye_ring'       // Critical hit enhancement
                    ]
                }
            },

            // Spell Diversity: Various magical schools and utilities (35% of drops)
            spellDiversity: {
                weight: 0.35,
                categories: {
                    combat: [
                        'fireball',            // AoE fire damage
                        'ice_shard',           // Single target ice + slow
                        'lightning_bolt',      // Fast electric damage
                        'earth_spike',         // Earth damage + knockdown
                        'shadow_strike',       // Dark magic + confusion
                        'holy_light',          // Light damage vs undead
                        'wind_slash'           // Air magic + positioning
                    ],
                    utility: [
                        'heal',                // Improved healing
                        'mana_restore',        // Resource management
                        'shield',              // Defensive magic
                        'haste',               // Speed enhancement
                        'detect_magic',        // Information gathering
                        'purify',              // Status cleansing
                        'teleport'             // Tactical positioning
                    ],
                    enhancement: [
                        'weapon_enchant',      // Temporary weapon boost
                        'armor_blessing',      // Defensive enhancement
                        'elemental_ward',      // Resistance magic
                        'strength_boost',      // Physical enhancement
                        'mind_clarity',        // Mental enhancement
                        'nature_bond'          // Environmental magic
                    ]
                }
            },

            // Advanced Consumables: Strategic depth items (15% of drops)
            advancedConsumables: {
                weight: 0.15,
                items: [
                    'greater_healing_potion',  // Improved healing
                    'greater_mana_potion',     // Enhanced mana restore
                    'stamina_elixir',          // Endurance enhancement
                    'antidote',                // Status effect cure
                    'strength_potion',         // Temporary stat boost
                    'invisibility_potion',     // Stealth option
                    'fire_resistance_potion',  // Elemental protection
                    'speed_potion'             // Mobility enhancement
                ]
            },

            // Materials and Crafting: Preparation for advanced systems (10% of drops)
            craftingMaterials: {
                weight: 0.10,
                items: [
                    'refined_metal',           // Advanced weapon materials
                    'enchanted_cloth',         // Magical armor components
                    'elemental_crystal',       // Spell enhancement materials
                    'rare_herbs',              // Advanced alchemy
                    'precious_gems',           // Jewelry crafting
                    'ancient_runes',           // Enchantment materials
                    'dragon_scale',            // Legendary materials
                    'mystical_essence'         // Pure magical energy
                ]
            }
        };

        return priorities;
    },

    /**
     * Select strategic equipment for mid-game players
     * Implements class-based preferences and tactical variety
     */
    selectMidGameStrategicEquipment: function(playerLevel, playerClass, encounterContext = {}) {
        const priorities = this.getMidGameStrategicPriorities(playerLevel, playerClass, encounterContext.type);
        if (!priorities) {
            return null; // Not mid-game
        }

        // Weight selection based on player class preferences
        const classWeights = this.getMidGameClassWeights(playerClass);

        // Determine equipment category based on strategic needs
        const roll = Math.random();
        let selectedCategory = null;

        if (roll < priorities.strategicEquipment.weight) {
            selectedCategory = this.selectStrategicEquipmentCategory(playerClass, classWeights);
        } else if (roll < priorities.strategicEquipment.weight + priorities.spellDiversity.weight) {
            selectedCategory = this.selectSpellDiversityCategory(playerClass, classWeights);
        } else if (roll < priorities.strategicEquipment.weight + priorities.spellDiversity.weight + priorities.advancedConsumables.weight) {
            selectedCategory = priorities.advancedConsumables;
        } else {
            selectedCategory = priorities.craftingMaterials;
        }

        return this.selectItemFromCategory(selectedCategory, playerClass, playerLevel);
    },

    /**
     * Get class-based weights for mid-game strategic selection
     */
    getMidGameClassWeights: function(playerClass) {
        const classPreferences = {
            knight: {
                weapons: 0.4,      // Heavy weapon focus
                armor: 0.35,       // Protection priority
                accessories: 0.15,
                spells: 0.1        // Limited magic
            },
            wizard: {
                weapons: 0.15,     // Staff/wand focus
                armor: 0.2,        // Robes and light armor
                accessories: 0.25, // Magical accessories
                spells: 0.4        // Heavy spell focus
            },
            rogue: {
                weapons: 0.35,     // Stealth weapons
                armor: 0.2,        // Light, mobile armor
                accessories: 0.3,  // Utility accessories
                spells: 0.15       // Some utility magic
            },
            ranger: {
                weapons: 0.3,      // Ranged and nature weapons
                armor: 0.25,       // Environmental protection
                accessories: 0.25, // Survival accessories
                spells: 0.2        // Nature magic
            },
            warrior: {
                weapons: 0.4,      // Combat weapon variety
                armor: 0.3,        // Battle-tested protection
                accessories: 0.2,  // Combat accessories
                spells: 0.1        // Minimal magic
            },
            paladin: {
                weapons: 0.3,      // Holy and defensive weapons
                armor: 0.3,        // Divine protection
                accessories: 0.2,  // Holy symbols and rings
                spells: 0.2        // Divine magic
            }
        };

        return classPreferences[playerClass] || {
            weapons: 0.25,
            armor: 0.25,
            accessories: 0.25,
            spells: 0.25
        };
    },

    /**
     * Select strategic equipment category based on class preferences
     */
    selectStrategicEquipmentCategory: function(playerClass, classWeights) {
        const roll = Math.random();
        const totalNonSpell = classWeights.weapons + classWeights.armor + classWeights.accessories;

        if (roll < classWeights.weapons / totalNonSpell) {
            return { type: 'weapons', items: this.getMidGameStrategicPriorities().strategicEquipment.categories.weapons };
        } else if (roll < (classWeights.weapons + classWeights.armor) / totalNonSpell) {
            return { type: 'armor', items: this.getMidGameStrategicPriorities().strategicEquipment.categories.armor };
        } else {
            return { type: 'accessories', items: this.getMidGameStrategicPriorities().strategicEquipment.categories.accessories };
        }
    },

    /**
     * Select spell diversity category based on class and tactical needs
     */
    selectSpellDiversityCategory: function(playerClass, classWeights) {
        const spellCategories = this.getMidGameStrategicPriorities().spellDiversity.categories;

        // Class-based spell preferences
        const classSpellPrefs = {
            wizard: { combat: 0.5, utility: 0.3, enhancement: 0.2 },
            paladin: { combat: 0.3, utility: 0.4, enhancement: 0.3 },
            ranger: { combat: 0.3, utility: 0.5, enhancement: 0.2 },
            rogue: { combat: 0.4, utility: 0.4, enhancement: 0.2 },
            knight: { combat: 0.2, utility: 0.5, enhancement: 0.3 },
            warrior: { combat: 0.6, utility: 0.3, enhancement: 0.1 }
        };

        const prefs = classSpellPrefs[playerClass] || { combat: 0.4, utility: 0.4, enhancement: 0.2 };
        const roll = Math.random();

        if (roll < prefs.combat) {
            return { type: 'combat_spells', items: spellCategories.combat };
        } else if (roll < prefs.combat + prefs.utility) {
            return { type: 'utility_spells', items: spellCategories.utility };
        } else {
            return { type: 'enhancement_spells', items: spellCategories.enhancement };
        }
    },

    /**
     * Select specific item from category with class and level considerations
     */
    selectItemFromCategory: function(category, playerClass, playerLevel) {
        if (!category || !category.items || category.items.length === 0) {
            return null;
        }

        // Apply level-based filtering for progression appropriateness
        const levelAppropriateItems = category.items.filter(item =>
            this.isMidGameLevelAppropriate(item, playerLevel)
        );

        if (levelAppropriateItems.length === 0) {
            return category.items[0]; // Fallback to first item
        }

        // Select with slight class-based weighting
        const selectedItem = levelAppropriateItems[Math.floor(Math.random() * levelAppropriateItems.length)];

        return {
            itemType: selectedItem,
            category: category.type,
            strategicValue: this.calculateStrategicValue(selectedItem, playerClass, playerLevel),
            classAlignment: this.calculateClassAlignment(selectedItem, playerClass)
        };
    },

    /**
     * Check if item is appropriate for mid-game level progression
     */
    isMidGameLevelAppropriate: function(itemType, playerLevel) {
        // Define level gates for strategic progression
        const levelGates = {
            // Early mid-game (11-13): Basic strategic options
            11: ['steel_sword', 'chain_mail', 'crystal_staff', 'fireball', 'heal', 'greater_healing_potion'],

            // Mid mid-game (14-17): Advanced tactical options
            14: ['elvish_bow', 'mage_robes', 'blessed_mace', 'ice_shard', 'shield', 'strength_potion'],

            // Late mid-game (18-20): Sophisticated strategic tools
            18: ['great_axe', 'plate_armor', 'shadow_blade', 'lightning_bolt', 'teleport', 'dragon_scale']
        };

        // Check if item is unlocked at current level
        for (const [level, items] of Object.entries(levelGates)) {
            if (playerLevel >= parseInt(level) && items.includes(itemType)) {
                return true;
            }
        }

        // Default: allow basic items for any mid-game level
        const basicMidGameItems = ['steel_sword', 'chain_mail', 'crystal_staff', 'fireball', 'heal'];
        return basicMidGameItems.includes(itemType);
    },

    /**
     * Calculate strategic value of item for mid-game progression
     */
    calculateStrategicValue: function(itemType, playerClass, playerLevel) {
        const baseValues = {
            // Weapons: High strategic value for tactical variety
            'steel_sword': 8, 'crystal_staff': 8, 'elvish_bow': 9, 'blessed_mace': 7,
            'great_axe': 9, 'shadow_blade': 10, 'poisoned_blade': 8, 'war_hammer': 8,

            // Armor: Medium-high value for survivability and class synergy
            'chain_mail': 7, 'mage_robes': 7, 'plate_armor': 9, 'stealth_cloak': 8,
            'scale_mail': 7, 'ranger_cloak': 6, 'battle_vest': 6,

            // Accessories: High value for build diversity
            'strength_band': 8, 'mana_crystal': 9, 'precision_ring': 7, 'holy_symbol': 7,
            'power_ring': 8, 'eagle_eye_ring': 8,

            // Spells: Very high value for tactical depth
            'fireball': 9, 'ice_shard': 8, 'lightning_bolt': 9, 'teleport': 10,
            'shield': 8, 'haste': 9, 'weapon_enchant': 8, 'heal': 7
        };

        const baseValue = baseValues[itemType] || 5;

        // Adjust for class alignment
        const classAlignment = this.calculateClassAlignment(itemType, playerClass);
        const classMultiplier = 1.0 + (classAlignment * 0.3); // Up to +30% for perfect alignment

        // Adjust for level progression (higher level = more value for advanced items)
        const levelProgression = (playerLevel - 10) / 10; // 0.1 to 1.0 for levels 11-20
        const advancedItems = ['shadow_blade', 'teleport', 'dragon_scale', 'plate_armor'];
        const levelMultiplier = advancedItems.includes(itemType) ? 1.0 + levelProgression * 0.2 : 1.0;

        return Math.round(baseValue * classMultiplier * levelMultiplier);
    },

    /**
     * Calculate how well item aligns with player class (0.0 to 1.0)
     */
    calculateClassAlignment: function(itemType, playerClass) {
        const alignments = {
            knight: {
                'steel_sword': 1.0, 'blessed_mace': 0.9, 'chain_mail': 1.0, 'plate_armor': 1.0,
                'strength_band': 0.8, 'holy_symbol': 0.7, 'heal': 0.6, 'shield': 0.9
            },
            wizard: {
                'crystal_staff': 1.0, 'mage_robes': 1.0, 'mana_crystal': 1.0, 'fireball': 1.0,
                'ice_shard': 0.9, 'lightning_bolt': 0.9, 'teleport': 1.0, 'weapon_enchant': 0.8
            },
            rogue: {
                'shadow_blade': 1.0, 'poisoned_blade': 1.0, 'stealth_cloak': 1.0, 'precision_ring': 0.9,
                'eagle_eye_ring': 0.8, 'haste': 0.8
            },
            ranger: {
                'elvish_bow': 1.0, 'ranger_cloak': 1.0, 'nature_bond': 1.0, 'eagle_eye_ring': 0.9,
                'precision_ring': 0.8
            },
            warrior: {
                'great_axe': 1.0, 'war_hammer': 1.0, 'battle_vest': 0.9, 'strength_band': 1.0,
                'power_ring': 0.8
            },
            paladin: {
                'blessed_mace': 1.0, 'holy_symbol': 1.0, 'chain_mail': 0.8, 'heal': 1.0,
                'shield': 0.9, 'purify': 0.9
            }
        };

        const classAlignments = alignments[playerClass] || {};
        return classAlignments[itemType] || 0.3; // Default moderate alignment
    },

    /**
     * Apply mid-game strategic enhancements to loot items
     * Implements strategic equipment variety and spell diversity for levels 11-20
     */
    applyMidGameStrategicEnhancements: function(item, itemType, rarity, playerLevel, contentLevel, areaName) {
        // Add mid-game progression markers
        item.midGameItem = true;
        item.strategicValue = this.calculateStrategicValue(itemType, item.playerClass, playerLevel);

        // Apply class-based strategic bonuses
        if (item.playerClass) {
            const classAlignment = this.calculateClassAlignment(itemType, item.playerClass);

            // Strong class alignment gets bonuses
            if (classAlignment >= 0.8) {
                this.applyClassAlignmentBonus(item, classAlignment, itemType);
            }
        }

        // Apply strategic depth enhancements by item category
        this.applyStrategicDepthEnhancements(item, itemType, playerLevel, rarity);

        // Add mid-game tactical metadata
        if (!item.tacticalInfo) item.tacticalInfo = {};
        item.tacticalInfo.strategicValue = item.strategicValue;
        item.tacticalInfo.gamePhase = 'mid_game';
        item.tacticalInfo.levelRange = '11-20';

        // Add build diversity hints for strategic options
        this.addBuildDiversityHints(item, itemType, playerLevel);
    },

    /**
     * Apply class alignment bonuses for strategic depth
     */
    applyClassAlignmentBonus: function(item, alignment, itemType) {
        // Weapons: Enhanced damage/accuracy for class synergy
        if (item.damage || item.attackBonus) {
            const damageBonus = Math.round(alignment * 15); // Up to +15% for perfect alignment
            if (Array.isArray(item.damage)) {
                item.damage = item.damage.map(dmg => Math.round(dmg * (1 + damageBonus / 100)));
            } else if (item.damage) {
                item.damage = Math.round(item.damage * (1 + damageBonus / 100));
            }

            if (!item.classEnhancements) item.classEnhancements = {};
            item.classEnhancements.damageBonus = `+${damageBonus}% class synergy`;
        }

        // Armor: Enhanced protection for class-appropriate gear
        if (item.armor || item.defenseBonus) {
            const armorBonus = Math.round(alignment * 12); // Up to +12% for perfect alignment
            if (item.armor) {
                item.armor = Math.round(item.armor * (1 + armorBonus / 100));
            }

            if (!item.classEnhancements) item.classEnhancements = {};
            item.classEnhancements.armorBonus = `+${armorBonus}% class synergy`;
        }

        // Accessories: Enhanced special effects
        if (item.specialEffects || item.statBonus) {
            const effectBonus = Math.round(alignment * 20); // Up to +20% for perfect alignment

            if (!item.classEnhancements) item.classEnhancements = {};
            item.classEnhancements.effectBonus = `+${effectBonus}% enhanced effects`;
        }

        // Spells: Reduced mana cost and improved effectiveness
        if (item.manaCost) {
            const manaCostReduction = alignment * 0.15; // Up to -15% mana cost
            item.manaCost = Math.max(1, Math.round(item.manaCost * (1 - manaCostReduction)));

            if (!item.classEnhancements) item.classEnhancements = {};
            item.classEnhancements.manaCostReduction = `${Math.round(manaCostReduction * 100)}% reduced mana cost`;
        }
    },

    /**
     * Apply strategic depth enhancements by item category
     */
    applyStrategicDepthEnhancements: function(item, itemType, playerLevel, rarity) {
        // Strategic weapons: Add tactical options
        const strategicWeapons = ['shadow_blade', 'poisoned_blade', 'blessed_mace', 'elvish_bow', 'great_axe'];
        if (strategicWeapons.includes(itemType)) {
            if (!item.tacticalOptions) item.tacticalOptions = [];

            const weaponTactics = {
                'shadow_blade': ['stealth_attack', 'critical_strike', 'shadow_step'],
                'poisoned_blade': ['poison_application', 'damage_over_time', 'status_infliction'],
                'blessed_mace': ['undead_bonus', 'holy_damage', 'blessing_aura'],
                'elvish_bow': ['precision_shot', 'nature_affinity', 'silent_shot'],
                'great_axe': ['cleave_attack', 'armor_penetration', 'intimidation']
            };

            item.tacticalOptions = weaponTactics[itemType] || ['enhanced_combat'];
        }

        // Advanced spells: Add spell combinations and strategic casting
        const advancedSpells = ['teleport', 'lightning_bolt', 'weapon_enchant', 'shield', 'haste'];
        if (advancedSpells.includes(itemType)) {
            if (!item.spellEnhancements) item.spellEnhancements = {};

            // Add mid-game spell combinations
            const spellCombos = {
                'teleport': ['escape_tactics', 'positioning', 'surprise_attack'],
                'lightning_bolt': ['chain_lightning', 'storm_mastery', 'electric_field'],
                'weapon_enchant': ['elemental_weapon', 'damage_amplification', 'spell_blade'],
                'shield': ['defensive_mastery', 'spell_reflection', 'barrier_tactics'],
                'haste': ['speed_tactics', 'action_economy', 'combat_mobility']
            };

            item.spellEnhancements.combinations = spellCombos[itemType] || ['strategic_casting'];
            item.spellEnhancements.midGameBonus = true;
        }

        // Advanced consumables: Add strategic timing and effects
        const advancedConsumables = ['greater_healing_potion', 'strength_potion', 'invisibility_potion'];
        if (advancedConsumables.includes(itemType)) {
            if (!item.strategicUse) item.strategicUse = {};

            const consumableTactics = {
                'greater_healing_potion': ['combat_sustain', 'emergency_recovery', 'tactical_healing'],
                'strength_potion': ['damage_window', 'boss_preparation', 'decisive_moment'],
                'invisibility_potion': ['stealth_approach', 'escape_route', 'positioning_advantage']
            };

            item.strategicUse.tactics = consumableTactics[itemType] || ['tactical_consumption'];
            item.strategicUse.timing = 'pre_combat_or_emergency';
        }
    },

    /**
     * Add build diversity hints for strategic character development
     */
    addBuildDiversityHints: function(item, itemType, playerLevel) {
        if (!item.buildDiversityHints) item.buildDiversityHints = [];

        // Equipment diversity hints
        const equipmentHints = {
            'steel_sword': 'Consider combining with shield for defensive builds or dual-wielding for offense',
            'crystal_staff': 'Pairs well with mana-boosting accessories and elemental spell combinations',
            'elvish_bow': 'Excellent for ranger builds focused on precision and nature magic',
            'shadow_blade': 'Perfect for stealth builds combining agility and dark magic',
            'mage_robes': 'Enhances spellcaster builds with mana efficiency and spell power',
            'plate_armor': 'Ideal for tank builds prioritizing survivability and protection',
            'stealth_cloak': 'Enables stealth builds with evasion and surprise attack tactics'
        };

        // Spell diversity hints
        const spellHints = {
            'fireball': 'Core combat spell - pairs well with other elemental magic for combo attacks',
            'teleport': 'Game-changing utility - opens tactical positioning and escape strategies',
            'shield': 'Essential defensive spell - combines well with melee combat styles',
            'haste': 'Versatile enhancement - benefits both combat and exploration activities',
            'weapon_enchant': 'Hybrid option - bridges physical combat with magical enhancement'
        };

        const hint = equipmentHints[itemType] || spellHints[itemType];
        if (hint) {
            item.buildDiversityHints.push(hint);
        }

        // Add level-appropriate build progression hints
        if (playerLevel >= 15) {
            item.buildDiversityHints.push('Consider specializing in a focused build or developing hybrid capabilities');
        }

        if (playerLevel >= 18) {
            item.buildDiversityHints.push('Prepare for late-game content with strategic equipment combinations');
        }
    },

    /**
     * Get late-game prestige item priorities (levels 21-30+)
     * Emphasizes rare/epic/legendary items and prestige content for endgame progression
     */
    getLateGamePrestigePriorities: function(playerLevel, playerClass = null, encounterType = 'general') {
        if (playerLevel < 21) {
            return null; // Only applies to late-game
        }

        // Define prestige item categories for endgame depth
        const priorities = {
            // Legendary Equipment: Ultimate gear with unique properties (25% of drops)
            legendaryEquipment: {
                weight: 0.25,
                categories: {
                    weapons: [
                        'dragonbane_sword',      // Anti-dragon legendary weapon
                        'staff_of_eternity',     // Ultimate caster weapon
                        'void_bow',              // Reality-warping ranged weapon
                        'demon_slayer',          // Anti-evil legendary blade
                        'world_ender',           // Apocalyptic two-hander
                        'time_ripper',           // Temporal manipulation weapon
                        'soul_reaper',           // Life-draining scythe
                        'god_hammer'             // Divine smithing weapon
                    ],
                    armor: [
                        'dragon_scale_armor',    // Ultimate physical protection
                        'archmage_robes',        // Supreme magical armor
                        'shadow_lord_cloak',     // Stealth mastery armor
                        'paladin_aegis',         // Divine protection set
                        'titan_plate',           // Legendary heavy armor
                        'void_shroud',           // Reality-bending protection
                        'phoenix_mantle',        // Resurrection armor
                        'storm_mail'             // Elemental mastery armor
                    ],
                    accessories: [
                        'ring_of_omnipotence',   // Ultimate power ring
                        'amulet_of_immortality', // Death prevention charm
                        'crown_of_dominion',     // Leadership and control
                        'gauntlets_of_creation', // Reality manipulation
                        'boots_of_transcendence',// Dimensional travel
                        'belt_of_infinity',      // Limitless resources
                        'cloak_of_shadows',      // Ultimate stealth
                        'pendant_of_wishes'      // Wish-granting artifact
                    ]
                }
            },

            // Epic Spells: Master-tier magic with game-changing effects (20% of drops)
            epicSpells: {
                weight: 0.20,
                categories: {
                    devastation: [
                        'meteor_storm',          // Area devastation spell
                        'time_stop',            // Temporal manipulation
                        'reality_tear',         // Space-time damage
                        'soul_burn',            // Spiritual destruction
                        'dimension_rift',       // Planar manipulation
                        'apocalypse',           // World-ending magic
                        'void_storm'            // Nihility magic
                    ],
                    mastery: [
                        'perfect_heal',         // Ultimate restoration
                        'mass_resurrection',    // Group revival magic
                        'mind_control',         // Mental domination
                        'shape_reality',        // Reality alteration
                        'summon_avatar',        // Divine manifestation
                        'transcendence',        // Ascension magic
                        'omniscience'           // All-knowing spell
                    ],
                    utility: [
                        'plane_shift',          // Dimensional travel
                        'time_travel',          // Temporal navigation
                        'clone_self',           // Perfect duplication
                        'wish',                 // Reality-bending desire
                        'gate',                 // Portal creation
                        'prophecy',             // Future sight
                        'divine_intervention'   // God-tier assistance
                    ]
                }
            },

            // Prestige Consumables: Legendary potions and artifacts (20% of drops)
            prestigeConsumables: {
                weight: 0.20,
                items: [
                    'elixir_of_immortality',    // Permanent life extension
                    'potion_of_godhood',        // Temporary divine powers
                    'essence_of_time',          // Temporal manipulation drink
                    'vial_of_creation',         // World-building essence
                    'draught_of_omniscience',   // All-knowledge potion
                    'philter_of_transcendence', // Ascension catalyst
                    'nectar_of_rebirth',        // Perfect resurrection
                    'ambrosia_of_power',        // Ultimate enhancement
                    'tears_of_phoenix',         // Legendary healing
                    'blood_of_titans'           // Primordial strength
                ]
            },

            // Rare Materials: Legendary crafting components (15% of drops)
            rareMaterials: {
                weight: 0.15,
                items: [
                    'primordial_essence',       // Pure creation material
                    'crystallized_time',        // Temporal crafting component
                    'void_metal',               // Reality-bending material
                    'dragon_heart',             // Ultimate fire material
                    'star_fragment',            // Cosmic crafting component
                    'god_bone',                 // Divine material
                    'shadow_silk',              // Stealth crafting material
                    'phoenix_feather',          // Resurrection component
                    'titan_blood',              // Strength enhancement material
                    'dream_crystal'             // Mind-affecting material
                ]
            },

            // Prestige Artifacts: Unique items with special mechanics (10% of drops)
            prestigeArtifacts: {
                weight: 0.10,
                items: [
                    'orb_of_destinies',         // Fate manipulation artifact
                    'mirror_of_souls',          // Soul-viewing artifact
                    'hourglass_of_eternity',    // Time control artifact
                    'codex_of_creation',        // Reality-writing book
                    'crown_of_kingship',        // Leadership artifact
                    'chalice_of_renewal',       // Endless healing artifact
                    'key_of_all_doors',         // Universal access artifact
                    'seed_of_worlds',           // World-creation artifact
                    'throne_of_judgment',       // Justice artifact
                    'seal_of_binding'           // Ultimate containment
                ]
            },

            // Trophy Items: Prestige markers and achievements (10% of drops)
            trophyItems: {
                weight: 0.10,
                items: [
                    'dragon_slayer_trophy',     // Dragon-killing achievement
                    'demon_lord_crown',         // Evil conquest trophy
                    'hero_of_realms_medal',     // Multi-world heroism
                    'master_of_magic_staff',    // Magical mastery trophy
                    'champion_of_light_halo',   // Good alignment prestige
                    'shadow_emperor_ring',      // Dark mastery trophy
                    'world_savior_cloak',       // Ultimate heroism
                    'god_slayer_blade',         // Deicide achievement
                    'reality_architect_tools',  // Creation mastery
                    'eternal_guardian_shield'   // Protection mastery
                ]
            }
        };

        return priorities;
    },

    /**
     * Select prestige item for late-game players
     * Implements rarity-focused progression and prestige mechanics
     */
    selectLateGamePrestigeItem: function(playerLevel, playerClass, rarity = 'rare', encounterContext = {}) {
        const priorities = this.getLateGamePrestigePriorities(playerLevel, playerClass, encounterContext.type);
        if (!priorities) {
            return null; // Not late-game
        }

        // Weight selection based on rarity tier - higher rarities get better categories
        const rarityWeights = this.getLateGameRarityWeights(rarity, playerLevel);

        // Determine prestige category based on rarity and player progression
        const selectedCategory = this.selectPrestigeCategoryByRarity(priorities, rarity, rarityWeights);

        return this.selectPrestigeItemFromCategory(selectedCategory, playerClass, playerLevel, rarity);
    },

    /**
     * Get late-game rarity-based category weights
     */
    getLateGameRarityWeights: function(rarity, playerLevel) {
        // Rarity determines access to prestige categories
        const rarityAccess = {
            common: {
                rareMaterials: 0.6,        // Mostly materials for common drops
                prestigeConsumables: 0.3,   // Some consumables
                trophyItems: 0.1,          // Minimal trophies
                legendaryEquipment: 0.0,   // No legendary access
                epicSpells: 0.0,           // No epic spells
                prestigeArtifacts: 0.0     // No artifacts
            },
            uncommon: {
                rareMaterials: 0.4,
                prestigeConsumables: 0.4,
                trophyItems: 0.15,
                legendaryEquipment: 0.05,  // Minimal legendary access
                epicSpells: 0.0,
                prestigeArtifacts: 0.0
            },
            rare: {
                rareMaterials: 0.25,
                prestigeConsumables: 0.3,
                trophyItems: 0.2,
                legendaryEquipment: 0.15,  // Some legendary access
                epicSpells: 0.1,           // Limited epic spells
                prestigeArtifacts: 0.0     // No artifacts yet
            },
            epic: {
                rareMaterials: 0.15,
                prestigeConsumables: 0.2,
                trophyItems: 0.15,
                legendaryEquipment: 0.25,  // Good legendary access
                epicSpells: 0.2,           // Good epic spell access
                prestigeArtifacts: 0.05    // Minimal artifact access
            },
            legendary: {
                rareMaterials: 0.1,
                prestigeConsumables: 0.15,
                trophyItems: 0.1,
                legendaryEquipment: 0.35,  // High legendary access
                epicSpells: 0.2,           // High epic spell access
                prestigeArtifacts: 0.1     // Some artifact access
            }
        };

        return rarityAccess[rarity] || rarityAccess.rare;
    },

    /**
     * Select prestige category based on rarity and weights
     */
    selectPrestigeCategoryByRarity: function(priorities, rarity, weights) {
        const roll = Math.random();
        let cumulativeWeight = 0;

        // Check each category based on rarity access weights
        for (const [categoryName, weight] of Object.entries(weights)) {
            cumulativeWeight += weight;
            if (roll <= cumulativeWeight && priorities[categoryName]) {
                return {
                    name: categoryName,
                    data: priorities[categoryName],
                    rarity: rarity,
                    accessLevel: weight
                };
            }
        }

        // Fallback to rare materials
        return {
            name: 'rareMaterials',
            data: priorities.rareMaterials,
            rarity: rarity,
            accessLevel: weights.rareMaterials || 0.1
        };
    },

    /**
     * Select specific prestige item from category with late-game considerations
     */
    selectPrestigeItemFromCategory: function(category, playerClass, playerLevel, rarity) {
        if (!category || !category.data) {
            return null;
        }

        let items = [];

        // Handle different category structures
        if (category.data.categories) {
            // Multi-category structure (legendary equipment, epic spells)
            const subCategory = this.selectPrestigeSubCategory(category.data.categories, playerClass);
            items = subCategory.items;
        } else if (category.data.items) {
            // Simple item list structure
            items = category.data.items;
        }

        if (items.length === 0) {
            return null;
        }

        // Apply level-based filtering for prestige progression
        const levelAppropriateItems = items.filter(item =>
            this.isLateGameLevelAppropriate(item, playerLevel)
        );

        if (levelAppropriateItems.length === 0) {
            return items[0]; // Fallback to first item
        }

        // Select with class-based and prestige weighting
        const selectedItem = this.selectPrestigeItemWithWeighting(levelAppropriateItems, playerClass, rarity);

        return {
            itemType: selectedItem,
            category: category.name,
            rarity: rarity,
            prestigeValue: this.calculatePrestigeValue(selectedItem, playerClass, playerLevel, rarity),
            classAlignment: this.calculateClassAlignment(selectedItem, playerClass),
            isPrestigeItem: true,
            requiredLevel: Math.max(21, playerLevel - 5) // Prestige items have level requirements
        };
    },

    /**
     * Select prestige sub-category based on class preferences
     */
    selectPrestigeSubCategory: function(categories, playerClass) {
        // Class-based prestige preferences for late game
        const classPrestigePrefs = {
            knight: { weapons: 0.4, armor: 0.4, accessories: 0.2 },
            wizard: { weapons: 0.2, armor: 0.3, accessories: 0.5 },
            rogue: { weapons: 0.5, armor: 0.2, accessories: 0.3 },
            ranger: { weapons: 0.4, armor: 0.3, accessories: 0.3 },
            warrior: { weapons: 0.5, armor: 0.3, accessories: 0.2 },
            paladin: { weapons: 0.3, armor: 0.4, accessories: 0.3 }
        };

        const prefs = classPrestigePrefs[playerClass] || { weapons: 0.33, armor: 0.33, accessories: 0.34 };
        const roll = Math.random();

        if (roll < prefs.weapons && categories.weapons) {
            return { type: 'weapons', items: categories.weapons };
        } else if (roll < prefs.weapons + prefs.armor && categories.armor) {
            return { type: 'armor', items: categories.armor };
        } else if (categories.accessories) {
            return { type: 'accessories', items: categories.accessories };
        }

        // Fallback to first available category
        const firstCategory = Object.keys(categories)[0];
        return { type: firstCategory, items: categories[firstCategory] };
    },

    /**
     * Check if item is appropriate for late-game level progression
     */
    isLateGameLevelAppropriate: function(itemType, playerLevel) {
        // Define prestige level gates for endgame progression
        const prestigeGates = {
            // Early late-game (21-25): Basic prestige items
            21: ['dragon_scale_armor', 'staff_of_eternity', 'meteor_storm', 'elixir_of_immortality', 'dragon_heart'],

            // Mid late-game (26-30): Advanced prestige items
            26: ['void_bow', 'archmage_robes', 'time_stop', 'potion_of_godhood', 'crystallized_time'],

            // Ultimate late-game (30+): Ultimate prestige items
            30: ['world_ender', 'ring_of_omnipotence', 'reality_tear', 'nectar_of_rebirth', 'primordial_essence']
        };

        // Check if item is unlocked at current level
        for (const [level, items] of Object.entries(prestigeGates)) {
            if (playerLevel >= parseInt(level) && items.includes(itemType)) {
                return true;
            }
        }

        // Default: allow basic prestige items for any late-game level
        const basicPrestigeItems = ['dragon_scale_armor', 'staff_of_eternity', 'meteor_storm', 'dragon_heart'];
        return basicPrestigeItems.includes(itemType);
    },

    /**
     * Select prestige item with class and rarity weighting
     */
    selectPrestigeItemWithWeighting: function(items, playerClass, rarity) {
        // For prestige items, use simple random selection with slight class bias
        // (Prestige items are inherently valuable regardless of class)
        return items[Math.floor(Math.random() * items.length)];
    },

    /**
     * Calculate prestige value for endgame progression
     */
    calculatePrestigeValue: function(itemType, playerClass, playerLevel, rarity) {
        const basePrestigeValues = {
            // Legendary weapons: Maximum prestige
            'dragonbane_sword': 100, 'staff_of_eternity': 100, 'void_bow': 95, 'world_ender': 100,
            'demon_slayer': 90, 'time_ripper': 95, 'soul_reaper': 85, 'god_hammer': 100,

            // Legendary armor: High prestige
            'dragon_scale_armor': 95, 'archmage_robes': 90, 'shadow_lord_cloak': 85, 'titan_plate': 95,
            'paladin_aegis': 90, 'void_shroud': 95, 'phoenix_mantle': 90, 'storm_mail': 85,

            // Epic spells: Very high prestige
            'meteor_storm': 90, 'time_stop': 100, 'reality_tear': 100, 'apocalypse': 95,
            'perfect_heal': 85, 'mass_resurrection': 90, 'shape_reality': 100, 'wish': 100,

            // Prestige artifacts: Ultimate prestige
            'orb_of_destinies': 100, 'mirror_of_souls': 95, 'hourglass_of_eternity': 100,
            'codex_of_creation': 100, 'throne_of_judgment': 95, 'seed_of_worlds': 100
        };

        const baseValue = basePrestigeValues[itemType] || 50;

        // Rarity multiplier for prestige scaling
        const rarityMultipliers = {
            common: 0.5,
            uncommon: 0.7,
            rare: 1.0,
            epic: 1.5,
            legendary: 2.0
        };

        const rarityMultiplier = rarityMultipliers[rarity] || 1.0;

        // Level progression bonus (higher level = more prestige value)
        const levelBonus = Math.min(2.0, 1.0 + ((playerLevel - 20) * 0.05)); // Up to +100% at level 40

        return Math.round(baseValue * rarityMultiplier * levelBonus);
    },

    /**
     * Apply late-game prestige enhancements to loot items
     * Implements rare/epic/legendary focus and prestige mechanics for levels 21-30+
     */
    applyLateGamePrestigeEnhancements: function(item, itemType, rarity, playerLevel, contentLevel, areaName) {
        // Add late-game prestige markers
        item.lateGameItem = true;
        item.prestigeValue = this.calculatePrestigeValue(itemType, item.playerClass, playerLevel, rarity);

        // Apply rarity-based prestige bonuses
        this.applyRarityBasedPrestigeBonuses(item, rarity, playerLevel);

        // Apply prestige-tier enhancements based on item category
        this.applyPrestigeTierEnhancements(item, itemType, playerLevel, rarity);

        // Add late-game prestige metadata
        if (!item.prestigeInfo) item.prestigeInfo = {};
        item.prestigeInfo.prestigeValue = item.prestigeValue;
        item.prestigeInfo.gamePhase = 'late_game';
        item.prestigeInfo.levelRange = '21-30+';
        item.prestigeInfo.rarityTier = rarity;

        // Add prestige achievement hints for endgame progression
        this.addPrestigeAchievementHints(item, itemType, playerLevel, rarity);
    },

    /**
     * Apply rarity-based prestige bonuses for endgame items
     */
    applyRarityBasedPrestigeBonuses: function(item, rarity, playerLevel) {
        const rarityBonuses = {
            rare: { multiplier: 1.2, specialEffects: 1 },
            epic: { multiplier: 1.5, specialEffects: 2 },
            legendary: { multiplier: 2.0, specialEffects: 3 }
        };

        const bonus = rarityBonuses[rarity];
        if (!bonus) return;

        // Enhanced stats for prestige items
        if (item.damage) {
            if (Array.isArray(item.damage)) {
                item.damage = item.damage.map(dmg => Math.round(dmg * bonus.multiplier));
            } else {
                item.damage = Math.round(item.damage * bonus.multiplier);
            }
        }

        if (item.armor) {
            item.armor = Math.round(item.armor * bonus.multiplier);
        }

        if (item.healAmount) {
            item.healAmount = Math.round(item.healAmount * bonus.multiplier);
        }

        // Add special effects based on rarity
        if (!item.prestigeEffects) item.prestigeEffects = [];

        const rarityEffects = {
            rare: ['enhanced_durability', 'improved_efficiency'],
            epic: ['rare_proc_effect', 'enhanced_stats', 'special_ability'],
            legendary: ['legendary_aura', 'reality_bending', 'divine_blessing', 'unique_mechanics']
        };

        const effects = rarityEffects[rarity] || [];
        const numEffects = Math.min(bonus.specialEffects, effects.length);

        for (let i = 0; i < numEffects; i++) {
            if (!item.prestigeEffects.includes(effects[i])) {
                item.prestigeEffects.push(effects[i]);
            }
        }

        // Add prestige enhancement markers
        if (!item.prestigeEnhancements) item.prestigeEnhancements = {};
        item.prestigeEnhancements.rarityMultiplier = bonus.multiplier;
        item.prestigeEnhancements.effectCount = numEffects;
        item.prestigeEnhancements.prestigeTier = rarity;
    },

    /**
     * Apply prestige-tier enhancements based on item category
     */
    applyPrestigeTierEnhancements: function(item, itemType, playerLevel, rarity) {
        // Legendary weapons: Ultimate combat capabilities
        const legendaryWeapons = ['dragonbane_sword', 'staff_of_eternity', 'void_bow', 'world_ender', 'demon_slayer'];
        if (legendaryWeapons.includes(itemType)) {
            if (!item.legendaryProperties) item.legendaryProperties = {};

            const weaponProperties = {
                'dragonbane_sword': ['dragon_slaying', 'fire_immunity', 'scale_penetration'],
                'staff_of_eternity': ['infinite_mana', 'spell_amplification', 'reality_weaving'],
                'void_bow': ['reality_piercing', 'dimensional_arrows', 'void_strike'],
                'world_ender': ['apocalyptic_damage', 'reality_breaking', 'existence_threat'],
                'demon_slayer': ['evil_bane', 'holy_blessing', 'soul_protection']
            };

            item.legendaryProperties.abilities = weaponProperties[itemType] || ['legendary_power'];
            item.legendaryProperties.tier = 'ultimate_weapon';
        }

        // Epic spells: Reality-altering magic
        const epicSpells = ['meteor_storm', 'time_stop', 'reality_tear', 'apocalypse', 'wish'];
        if (epicSpells.includes(itemType)) {
            if (!item.epicSpellProperties) item.epicSpellProperties = {};

            const spellProperties = {
                'meteor_storm': ['area_devastation', 'fire_mastery', 'celestial_power'],
                'time_stop': ['temporal_control', 'action_freedom', 'reality_pause'],
                'reality_tear': ['space_rending', 'dimensional_damage', 'existence_threat'],
                'apocalypse': ['world_ending', 'ultimate_destruction', 'divine_wrath'],
                'wish': ['reality_alteration', 'desire_manifestation', 'omnipotent_magic']
            };

            item.epicSpellProperties.effects = spellProperties[itemType] || ['epic_magic'];
            item.epicSpellProperties.tier = 'reality_altering';

            // Reduce mana cost scaling for epic spells
            if (item.manaCost) {
                const epicReduction = 0.3; // 30% reduction for epic tier
                item.manaCost = Math.max(1, Math.round(item.manaCost * (1 - epicReduction)));
            }
        }

        // Prestige artifacts: Unique mechanics and world-changing effects
        const prestigeArtifacts = ['orb_of_destinies', 'mirror_of_souls', 'hourglass_of_eternity'];
        if (prestigeArtifacts.includes(itemType)) {
            if (!item.artifactProperties) item.artifactProperties = {};

            const artifactProperties = {
                'orb_of_destinies': ['fate_manipulation', 'destiny_control', 'probability_alteration'],
                'mirror_of_souls': ['soul_viewing', 'spiritual_insight', 'inner_truth'],
                'hourglass_of_eternity': ['time_control', 'temporal_manipulation', 'chronos_mastery']
            };

            item.artifactProperties.powers = artifactProperties[itemType] || ['artifact_power'];
            item.artifactProperties.tier = 'world_changing';
            item.artifactProperties.uniqueness = 'one_of_a_kind';
        }

        // Prestige consumables: Permanent or game-changing effects
        const prestigeConsumables = ['elixir_of_immortality', 'potion_of_godhood', 'nectar_of_rebirth'];
        if (prestigeConsumables.includes(itemType)) {
            if (!item.prestigeConsumableProperties) item.prestigeConsumableProperties = {};

            const consumableProperties = {
                'elixir_of_immortality': ['permanent_life_extension', 'death_immunity', 'eternal_youth'],
                'potion_of_godhood': ['temporary_divinity', 'god_powers', 'reality_control'],
                'nectar_of_rebirth': ['perfect_resurrection', 'soul_restoration', 'life_renewal']
            };

            item.prestigeConsumableProperties.effects = consumableProperties[itemType] || ['prestige_effect'];
            item.prestigeConsumableProperties.permanence = itemType === 'elixir_of_immortality' ? 'permanent' : 'temporary';
            item.prestigeConsumableProperties.tier = 'life_changing';
        }
    },

    /**
     * Add prestige achievement hints for endgame progression goals
     */
    addPrestigeAchievementHints: function(item, itemType, playerLevel, rarity) {
        if (!item.prestigeAchievementHints) item.prestigeAchievementHints = [];

        // Rarity-based achievement hints
        const rarityHints = {
            rare: [
                'First step into legendary territory - collect more rare items to unlock epic tier access',
                'Rare items unlock advanced combat strategies and build optimization'
            ],
            epic: [
                'Epic tier achieved - you\'re approaching true mastery of the game systems',
                'Epic items enable world-changing abilities and ultimate build combinations'
            ],
            legendary: [
                'Legendary mastery - you possess items of mythical power and ultimate prestige',
                'Legendary items mark you as a true champion of the realms'
            ]
        };

        // Item-specific achievement hints
        const itemHints = {
            'dragonbane_sword': 'The ultimate anti-dragon weapon - seek out ancient dragons for legendary battles',
            'staff_of_eternity': 'Master of infinite magical power - reshape reality with your will',
            'meteor_storm': 'Command celestial devastation - rain destruction from the heavens',
            'orb_of_destinies': 'Controller of fate itself - the multiverse bends to your desire',
            'elixir_of_immortality': 'Transcend mortality - you have achieved the impossible dream'
        };

        // Add appropriate hints
        if (rarityHints[rarity]) {
            const rarityHint = rarityHints[rarity][Math.floor(Math.random() * rarityHints[rarity].length)];
            item.prestigeAchievementHints.push(rarityHint);
        }

        if (itemHints[itemType]) {
            item.prestigeAchievementHints.push(itemHints[itemType]);
        }

        // Add level-appropriate prestige goals
        if (playerLevel >= 25) {
            item.prestigeAchievementHints.push('Approach ultimate mastery - collect legendary items to complete your ascension');
        }

        if (playerLevel >= 30) {
            item.prestigeAchievementHints.push('You have reached the pinnacle of power - few can match your legendary status');
        }
    },

    /**
     * Level-appropriate safety net mechanics for healing item availability
     * Ensures players always have access to adequate healing resources
     */
    getSafetyNetHealingRequirements: function(playerLevel, playerClass = null, encounterContext = {}) {
        // Define minimum healing requirements by level progression
        const healingRequirements = {
            // Early game (1-10): Basic survival safety net
            early: {
                levelRange: [1, 10],
                minimumHealingChance: 0.35,     // 35% chance for healing items
                recommendedPotions: ['healing_potion', 'minor_healing_potion'],
                emergencyThreshold: 0.25,       // 25% chance minimum in emergency
                quantityBonus: 2,               // +2 extra potions in safety net
                healingPotency: 'basic'
            },

            // Mid game (11-20): Strategic healing support
            mid: {
                levelRange: [11, 20],
                minimumHealingChance: 0.30,     // 30% chance for healing items
                recommendedPotions: ['healing_potion', 'greater_healing_potion'],
                emergencyThreshold: 0.20,       // 20% chance minimum in emergency
                quantityBonus: 1,               // +1 extra potion in safety net
                healingPotency: 'improved'
            },

            // Late game (21-30+): Prestige healing assurance
            late: {
                levelRange: [21, 50],
                minimumHealingChance: 0.25,     // 25% chance for healing items
                recommendedPotions: ['greater_healing_potion', 'superior_healing_potion', 'tears_of_phoenix'],
                emergencyThreshold: 0.15,       // 15% chance minimum in emergency
                quantityBonus: 0,               // No bonus needed (self-sufficient)
                healingPotency: 'advanced'
            }
        };

        // Determine current progression phase
        let currentPhase = 'early';
        if (playerLevel >= 21) {
            currentPhase = 'late';
        } else if (playerLevel >= 11) {
            currentPhase = 'mid';
        }

        return healingRequirements[currentPhase];
    },

    /**
     * Check if player needs safety net healing intervention
     * Monitors loot generation to ensure adequate healing item availability
     */
    checkHealingSafetyNet: function(playerLevel, recentLootHistory = [], encounterContext = {}) {
        const requirements = this.getSafetyNetHealingRequirements(playerLevel, encounterContext.playerClass, encounterContext);

        // Analyze recent loot history for healing item frequency
        const healingAnalysis = this.analyzeRecentHealingLoot(recentLootHistory, requirements);

        // Determine if safety net intervention is needed
        const needsIntervention = this.evaluateHealingIntervention(healingAnalysis, requirements, encounterContext);

        return {
            needsIntervention,
            requirements,
            analysis: healingAnalysis,
            interventionType: needsIntervention ? this.getInterventionType(healingAnalysis, requirements) : null
        };
    },

    /**
     * Analyze recent loot history for healing item patterns
     */
    analyzeRecentHealingLoot: function(lootHistory, requirements) {
        // Look at last 10-20 loot drops for healing pattern analysis
        const recentDrops = lootHistory.slice(-20);
        const healingItems = ['healing_potion', 'minor_healing_potion', 'greater_healing_potion', 'superior_healing_potion', 'tears_of_phoenix'];

        let healingDrops = 0;
        let totalDrops = recentDrops.length;
        let lastHealingDropIndex = -1;
        let healingQuantity = 0;

        recentDrops.forEach((drop, index) => {
            if (healingItems.includes(drop.itemType)) {
                healingDrops++;
                healingQuantity += drop.quantity || 1;
                lastHealingDropIndex = index;
            }
        });

        const healingFrequency = totalDrops > 0 ? healingDrops / totalDrops : 0;
        const dropsSinceLastHealing = lastHealingDropIndex >= 0 ? (recentDrops.length - 1 - lastHealingDropIndex) : totalDrops;

        return {
            healingFrequency,
            healingDrops,
            totalDrops,
            healingQuantity,
            dropsSinceLastHealing,
            averageQuantityPerDrop: healingDrops > 0 ? healingQuantity / healingDrops : 0,
            isHealingDrought: dropsSinceLastHealing >= 8 // 8+ drops without healing
        };
    },

    /**
     * Evaluate if healing intervention is needed
     */
    evaluateHealingIntervention: function(analysis, requirements, encounterContext) {
        // Multiple criteria for intervention
        const criteria = {
            // Frequency too low
            frequencyBelowMinimum: analysis.healingFrequency < requirements.minimumHealingChance,

            // Extended drought without healing
            extendedDrought: analysis.isHealingDrought,

            // Emergency context (player in dangerous situation)
            emergencyContext: encounterContext.isEmergency && analysis.healingFrequency < requirements.emergencyThreshold,

            // Low overall healing availability
            lowHealing: analysis.totalDrops >= 10 && analysis.healingDrops <= 1,

            // Recent dangerous encounters without healing support
            dangerousWithoutHealing: encounterContext.recentDifficultEncounters && analysis.dropsSinceLastHealing >= 5
        };

        // Intervention needed if any major criteria met
        return criteria.frequencyBelowMinimum ||
               criteria.extendedDrought ||
               criteria.emergencyContext ||
               criteria.lowHealing ||
               criteria.dangerousWithoutHealing;
    },

    /**
     * Determine type of safety net intervention needed
     */
    getInterventionType: function(analysis, requirements) {
        // Different intervention strategies based on situation severity
        if (analysis.isHealingDrought && analysis.dropsSinceLastHealing >= 12) {
            return 'emergency_healing_boost';      // Immediate healing guaranteed
        } else if (analysis.healingFrequency < requirements.emergencyThreshold) {
            return 'healing_frequency_boost';      // Increase healing drop rates
        } else if (analysis.averageQuantityPerDrop < 1.5) {
            return 'healing_quantity_boost';       // Increase healing quantities
        } else {
            return 'gentle_healing_nudge';         // Subtle healing increase
        }
    },

    /**
     * Apply safety net healing adjustments to loot generation
     * Modifies drop chances and quantities to ensure healing availability
     */
    applySafetyNetHealing: function(lootEntry, playerLevel, encounterContext = {}) {
        const safetyNet = this.checkHealingSafetyNet(playerLevel, encounterContext.recentLootHistory || [], encounterContext);

        if (!safetyNet.needsIntervention) {
            return lootEntry; // No modification needed
        }

        // Create modified loot entry with healing safety net
        const modifiedEntry = { ...lootEntry };

        // Apply intervention based on type
        switch (safetyNet.interventionType) {
            case 'emergency_healing_boost':
                modifiedEntry = this.applyEmergencyHealingBoost(modifiedEntry, safetyNet.requirements);
                break;

            case 'healing_frequency_boost':
                modifiedEntry = this.applyHealingFrequencyBoost(modifiedEntry, safetyNet.requirements);
                break;

            case 'healing_quantity_boost':
                modifiedEntry = this.applyHealingQuantityBoost(modifiedEntry, safetyNet.requirements);
                break;

            case 'gentle_healing_nudge':
                modifiedEntry = this.applyGentleHealingNudge(modifiedEntry, safetyNet.requirements);
                break;
        }

        // Add safety net metadata for tracking
        modifiedEntry.safetyNetApplied = true;
        modifiedEntry.interventionType = safetyNet.interventionType;
        modifiedEntry.originalDropChance = lootEntry.dropChance;

        return modifiedEntry;
    },

    /**
     * Apply emergency healing boost - guarantees healing items
     */
    applyEmergencyHealingBoost: function(lootEntry, requirements) {
        // Force healing item generation
        const healingPotions = requirements.recommendedPotions;
        const selectedHealing = healingPotions[Math.floor(Math.random() * healingPotions.length)];

        return {
            ...lootEntry,
            itemType: selectedHealing,
            dropChance: 1.0,                    // 100% drop chance
            quantity: 2 + requirements.quantityBonus, // Extra healing
            rarityWeights: { common: 0.7, uncommon: 0.3 }, // Favor common/uncommon for reliability
            safetyNetBoost: 'emergency'
        };
    },

    /**
     * Apply healing frequency boost - increases healing drop rates
     */
    applyHealingFrequencyBoost: function(lootEntry, requirements) {
        if (this.isHealingItem(lootEntry.itemType)) {
            // Boost existing healing items
            return {
                ...lootEntry,
                dropChance: Math.min(0.9, (lootEntry.dropChance || 0.5) * 1.5), // +50% drop chance
                quantity: (lootEntry.quantity || 1) + requirements.quantityBonus,
                safetyNetBoost: 'frequency'
            };
        } else {
            // Add healing alternative to non-healing loot
            const roll = Math.random();
            if (roll < 0.3) { // 30% chance to replace with healing
                const healingPotions = requirements.recommendedPotions;
                const selectedHealing = healingPotions[Math.floor(Math.random() * healingPotions.length)];

                return {
                    ...lootEntry,
                    itemType: selectedHealing,
                    dropChance: 0.7,
                    quantity: 1 + requirements.quantityBonus,
                    safetyNetBoost: 'frequency_replacement'
                };
            }
        }

        return lootEntry;
    },

    /**
     * Apply healing quantity boost - increases healing quantities
     */
    applyHealingQuantityBoost: function(lootEntry, requirements) {
        if (this.isHealingItem(lootEntry.itemType)) {
            return {
                ...lootEntry,
                quantity: (lootEntry.quantity || 1) + requirements.quantityBonus + 1,
                dropChance: Math.min(0.8, (lootEntry.dropChance || 0.5) * 1.2), // Slight boost
                safetyNetBoost: 'quantity'
            };
        }

        return lootEntry;
    },

    /**
     * Apply gentle healing nudge - subtle healing improvement
     */
    applyGentleHealingNudge: function(lootEntry, requirements) {
        if (this.isHealingItem(lootEntry.itemType)) {
            return {
                ...lootEntry,
                dropChance: Math.min(0.7, (lootEntry.dropChance || 0.5) * 1.15), // +15% drop chance
                safetyNetBoost: 'gentle'
            };
        }

        return lootEntry;
    },

    /**
     * Check if item type is a healing item
     */
    isHealingItem: function(itemType) {
        const healingItems = [
            'healing_potion', 'minor_healing_potion', 'greater_healing_potion',
            'superior_healing_potion', 'tears_of_phoenix', 'nectar_of_rebirth',
            'elixir_of_immortality', 'perfect_heal'
        ];

        return healingItems.includes(itemType);
    },

    /**
     * Get level-appropriate healing recommendations for players
     */
    getHealingRecommendations: function(playerLevel, currentHealth, maxHealth, inventoryHealing = []) {
        const requirements = this.getSafetyNetHealingRequirements(playerLevel);
        const healthPercentage = currentHealth / maxHealth;

        const recommendations = {
            urgency: 'none',
            recommendedActions: [],
            healingNeeds: requirements,
            currentStatus: 'adequate'
        };

        // Assess current healing situation
        if (healthPercentage <= 0.25) {
            recommendations.urgency = 'critical';
            recommendations.currentStatus = 'emergency';
            recommendations.recommendedActions.push('Use healing immediately');
            recommendations.recommendedActions.push('Seek safe area for recovery');
        } else if (healthPercentage <= 0.50) {
            recommendations.urgency = 'high';
            recommendations.currentStatus = 'concerning';
            recommendations.recommendedActions.push('Consider using healing soon');
            recommendations.recommendedActions.push('Avoid risky encounters');
        } else if (healthPercentage <= 0.75) {
            recommendations.urgency = 'moderate';
            recommendations.currentStatus = 'monitor';
            recommendations.recommendedActions.push('Keep healing items ready');
        }

        // Assess healing inventory
        const healingCount = inventoryHealing.length;
        if (healingCount === 0) {
            recommendations.recommendedActions.push('Priority: Find healing items');
            recommendations.currentStatus = 'critical_shortage';
        } else if (healingCount <= 2) {
            recommendations.recommendedActions.push('Seek additional healing items');
            recommendations.currentStatus = 'low_supplies';
        }

        return recommendations;
    },

    /**
     * Initialize loot generation cache for performance
     */
    initializeLootCache: function() {
        this.lootCache = {
            rarityRolls: new Map(),
            levelScaledItems: new Map(),
            areaLoot: new Map()
        };

        // Initialize diminishing returns tracking
        this.diminishingReturns = {
            monsterFarms: new Map(), // Track repeated monster farming
            areaFarms: new Map(),    // Track repeated area farming
            resetInterval: 3600000,  // 1 hour in milliseconds
            maxPenalty: 0.7,         // Maximum 70% reduction
            thresholds: {
                minor: 5,    // 5 kills/explorations within window = minor penalty
                moderate: 10, // 10 kills/explorations = moderate penalty
                severe: 20   // 20+ kills/explorations = severe penalty
            }
        };
    },

    /**
     * Generate loot drop from a monster defeat
     */
    generateMonsterLoot: function(monsterName, playerLevel, areaName = null) {
        try {
            const startTime = performance.now();

            // Get monster loot configuration
            const monsterLoot = this.getMonsterLootConfig(monsterName);
            if (!monsterLoot) {
                return { items: [], gold: this.generateGoldDrop(1, playerLevel) };
            }

            const generatedLoot = {
                items: [],
                gold: 0,
                experience: 0,
                generationInfo: {
                    monster: monsterName,
                    playerLevel,
                    area: areaName,
                    timestamp: Date.now()
                }
            };

            // Calculate diminishing returns for repeated farming
            const diminishingMultiplier = this.calculateDiminishingReturns('monster', monsterName, playerLevel);

            // Generate item drops based on monster loot table
            const encounterContext = {
                totalLootEntries: monsterLoot.lootTable.length,
                encounterType: 'monster',
                monsterName: monsterName,
                consecutiveEmptyEncounters: 0, // TODO: Track this in GameState
                diminishingMultiplier: diminishingMultiplier
            };

            for (const lootEntry of monsterLoot.lootTable) {
                const dropResult = this.rollForLoot(lootEntry, playerLevel, monsterLoot.level, encounterContext);

                if (!dropResult.dropped) continue;

                // Resolve to a concrete item id when possible (e.g., from items list or equipmentTypes)
                // Use enhanced equipment selection for better upgrade paths
                const resolvedItemType = this.resolveConcreteItemIdWithUpgradePath(lootEntry, playerLevel) || lootEntry.itemType;

                const item = this.generateLootItem(
                    resolvedItemType,
                    dropResult.rarity,
                    playerLevel,
                    monsterLoot.level,
                    areaName,
                    dropResult.buildDiversityInfo
                );

                if (item) {
                    generatedLoot.items.push(item);
                } else {
                    console.warn('Monster loot generation failed for item type:', resolvedItemType, 'from entry:', lootEntry);
                }
            }

            // Generate gold drop with diminishing returns
            const baseGold = this.generateGoldDrop(monsterLoot.level, playerLevel);
            generatedLoot.gold = Math.round(baseGold * diminishingMultiplier);

            // Generate experience (if applicable)
            generatedLoot.experience = this.calculateExperienceReward(monsterLoot.level, playerLevel);

            // Performance monitoring
            const endTime = performance.now();
            if (endTime - startTime > 50) {
                console.warn(`⏱️ Loot generation took ${(endTime - startTime).toFixed(2)}ms for ${monsterName}`);
            }

            return generatedLoot;

        } catch (error) {
            console.error('❌ Error generating monster loot:', error);
            return { items: [], gold: this.generateGoldDrop(1, playerLevel) };
        }
    },

    /**
     * Generate loot from area exploration
     */
    generateAreaLoot: function(areaName, playerLevel, explorationType = 'standard') {
        try {
            const areaLootConfig = this.getAreaLootConfig(areaName);
            if (!areaLootConfig) {
                return { items: [], gold: 0 };
            }

            const generatedLoot = {
                items: [],
                gold: 0,
                generationInfo: {
                    area: areaName,
                    explorationType,
                    playerLevel,
                    timestamp: Date.now()
                }
            };

            // Apply exploration type modifiers
            const explorationModifiers = this.getExplorationModifiers(explorationType);

            // Calculate diminishing returns for repeated area farming
            const diminishingMultiplier = this.calculateDiminishingReturns('area', areaName, playerLevel);

            // Create encounter context for area exploration
            const encounterContext = {
                totalLootEntries: areaLootConfig.lootTable.length,
                encounterType: 'area_exploration',
                areaName: areaName,
                explorationType: explorationType,
                consecutiveEmptyEncounters: 0, // TODO: Track this in GameState
                diminishingMultiplier: diminishingMultiplier
            };

            // Generate area-specific loot
            for (const lootEntry of areaLootConfig.lootTable) {
                // Check if this loot entry has exploration type restrictions
                if (lootEntry.explorationTypes && !lootEntry.explorationTypes.includes(explorationType)) {
                    continue; // Skip items that require different exploration types
                }

                const modifiedEntry = {
                    ...lootEntry,
                    dropChance: lootEntry.dropChance * explorationModifiers.dropChanceMultiplier,
                    // Apply rarity bonus to rarity weights
                    rarityWeights: this.applyRarityBonus(lootEntry.rarityWeights || {}, explorationModifiers.rarityBonus)
                };

                const dropResult = this.rollForLoot(modifiedEntry, playerLevel, areaLootConfig.recommendedLevel, encounterContext);

                if (!dropResult.dropped) continue;

                // Resolve a concrete item id from items list, equipment types, or abstract itemType
                let selectedItemType = lootEntry.itemType;
                if (Array.isArray(lootEntry.items) && lootEntry.items.length > 0) {
                    if (typeof ItemData !== 'undefined' && typeof ItemData.getItem === 'function') {
                        const valid = lootEntry.items.filter(id => !!ItemData.getItem(id));
                        if (valid.length > 0) {
                            selectedItemType = valid[Math.floor(Math.random() * valid.length)];
                        } else if (Array.isArray(lootEntry.equipmentTypes)) {
                            selectedItemType = this.resolveConcreteItemIdWithUpgradePath(lootEntry, playerLevel) || lootEntry.itemType;
                        }
                    } else {
                        selectedItemType = lootEntry.items[Math.floor(Math.random() * lootEntry.items.length)];
                    }
                } else if (Array.isArray(lootEntry.equipmentTypes) && lootEntry.equipmentTypes.length > 0) {
                    selectedItemType = this.resolveConcreteItemIdWithUpgradePath(lootEntry, playerLevel) || lootEntry.itemType;
                } else {
                    // If itemType itself is abstract, try to resolve via resolver
                    const resolved = this.resolveConcreteItemIdWithUpgradePath(lootEntry, playerLevel);
                    if (resolved) selectedItemType = resolved;
                }

                // Attempt to generate the item; if it fails due to unknown type, fallback to a safe material
                let item = this.generateLootItem(
                    selectedItemType,
                    dropResult.rarity,
                    playerLevel,
                    areaLootConfig.recommendedLevel,
                    areaName,
                    dropResult.buildDiversityInfo
                );

                if (!item) {
                    console.warn('[Loot] Area loot generation failed for item type:', selectedItemType, 'from entry:', lootEntry, '— falling back to material');
                    item = this.generateLootItem(
                        'material',
                        'common',
                        playerLevel,
                        areaLootConfig.recommendedLevel,
                        areaName,
                        null  // No build diversity for fallback items
                    );
                }

                if (item) {
                    generatedLoot.items.push(item);
                }
            }

            // Generate area gold bonus with diminishing returns
            const baseGold = this.generateGoldDrop(areaLootConfig.recommendedLevel, playerLevel) *
                explorationModifiers.goldMultiplier;
            generatedLoot.gold = Math.round(baseGold * diminishingMultiplier);

            return generatedLoot;

        } catch (error) {
            console.error('❌ Error generating area loot:', error);
            return { items: [], gold: 0 };
        }
    },

    /**
     * Roll for loot drop with rarity calculation
     * Optimized to consistently hit 75%+ meaningful loot target
     */
    rollForLoot: function(lootEntry, playerLevel, contentLevel, encounterContext = {}) {
        // Apply safety net healing adjustments first
        const adjustedLootEntry = this.applySafetyNetHealing(lootEntry, playerLevel, encounterContext);

        // Base drop chance (potentially modified by safety net)
        const baseChance = adjustedLootEntry.dropChance || 0.5;

        // Level scaling bonus/penalty
        const levelDifference = playerLevel - contentLevel;
        const levelScaling = this.calculateLevelScaling(levelDifference, playerLevel, contentLevel);

        // Apply meaningful loot optimization
        let finalDropChance = this.optimizeForMeaningfulLoot(
            baseChance,
            levelScaling,
            adjustedLootEntry,
            encounterContext
        );

        finalDropChance = Math.max(0.01, Math.min(0.95, finalDropChance));

        // Roll for drop
        const dropRoll = Math.random();
        const dropped = dropRoll < finalDropChance;

        if (!dropped) {
            return {
                dropped: false,
                dropChance: finalDropChance,
                levelScaling
            };
        }

        // Determine rarity with meaningful loot bonuses (use adjusted entry)
        const rarity = this.rollForRarity(
            adjustedLootEntry.rarityWeights || {},
            playerLevel,
            contentLevel,
            encounterContext
        );

        // Apply build diversity enhancements if player context is available
        let buildDiversityInfo = null;
        if (encounterContext.playerClass || encounterContext.currentEquipment || encounterContext.recentLootHistory) {
            // Calculate build diversity profile
            const diversityProfile = this.getBuildDiversityPreferences(
                playerLevel,
                encounterContext.playerClass,
                encounterContext.recentLootHistory || [],
                encounterContext.currentEquipment || {}
            );

            // Determine if this loot should promote build diversity (30% chance)
            const shouldPromoteDiversity = Math.random() < 0.3;
            if (shouldPromoteDiversity) {
                buildDiversityInfo = {
                    diversityProfile,
                    diversityPromoted: true,
                    diversityWeights: diversityProfile.diversityWeights
                };
            }
        }

        return {
            dropped: true,
            rarity,
            dropChance: finalDropChance,
            levelScaling,
            meaningful: this.isMeaningfulLoot(adjustedLootEntry, rarity, playerLevel),
            adjustedLootEntry,  // Include the safety net adjustments
            safetyNetApplied: adjustedLootEntry.safetyNetApplied || false,
            buildDiversityInfo  // Include build diversity information for item generation
        };
    },

    /**
     * Optimize drop chance for meaningful loot target (75%+)
     */
    optimizeForMeaningfulLoot: function(baseChance, levelScaling, lootEntry, encounterContext) {
        // Calculate base meaningful chance
        let optimizedChance = baseChance * levelScaling;

        // Apply encounter-level loot bonuses
        if (encounterContext.totalLootEntries) {
            // For encounters with multiple loot entries, ensure at least 75% chance of getting something meaningful
            const globalMeaningfulTarget = 0.75;
            const entryCount = encounterContext.totalLootEntries;

            // Calculate what each entry needs to contribute to hit global target
            const perEntryTarget = this.calculatePerEntryTarget(globalMeaningfulTarget, entryCount, lootEntry);
            optimizedChance = Math.max(optimizedChance, perEntryTarget);
        }

        // Apply item type bonuses for meaningful categories
        const meaningfulBonus = this.getMeaningfulItemBonus(lootEntry);
        optimizedChance *= meaningfulBonus;

        // Apply pity timer for consecutive empty encounters
        const pityBonus = this.calculatePityBonus(encounterContext);
        optimizedChance *= pityBonus;

        // Apply diminishing returns for repeated farming
        if (encounterContext.diminishingMultiplier) {
            optimizedChance *= encounterContext.diminishingMultiplier;
        }

        // Ensure minimum viable drop rates for progression (after diminishing returns)
        const minimumViable = this.getMinimumViableDropChance(lootEntry);
        // For farming penalty, apply a reduced minimum to maintain some progression
        const adjustedMinimum = encounterContext.diminishingMultiplier ?
            minimumViable * Math.max(0.5, encounterContext.diminishingMultiplier) :
            minimumViable;
        optimizedChance = Math.max(optimizedChance, adjustedMinimum);

        return optimizedChance;
    },

    /**
     * Calculate per-entry target drop chance to hit global meaningful loot goal
     */
    calculatePerEntryTarget: function(globalTarget, entryCount, lootEntry) {
        // Weighted by item value - more valuable items need lower individual chance
        const itemValue = this.getItemValueWeight(lootEntry);
        const basePerEntryChance = globalTarget / Math.max(1, entryCount);

        // Adjust based on item value (valuable items can have lower chance)
        return basePerEntryChance * (2.0 - itemValue); // Value 0-1, so this gives 1.0-2.0 multiplier
    },

    /**
     * Get meaningful item bonus multiplier
     */
    getMeaningfulItemBonus: function(lootEntry) {
        const meaningfulTypes = {
            // Equipment and upgrades
            'weapon': 1.4,
            'armor': 1.4,
            'accessory': 1.3,
            'equipment': 1.4,
            'beast_equipment': 1.3,
            'nature_equipment': 1.3,
            'forest_equipment': 1.3,
            'beginner_weapon': 1.5, // Higher bonus for progression items
            'beginner_armor': 1.5,

            // Consumables and utility
            'healing_potion': 1.2,
            'mana_potion': 1.2,
            'stamina_potion': 1.2,
            'potion': 1.2,

            // Spell learning items
            'spell_scroll': 1.6,
            'spell_book': 1.8,
            'spell_tome': 2.0,
            'ancient_tome': 2.5,

            // Materials and crafting
            'material': 1.1,
            'crafting_material': 1.1,

            // Less meaningful but still useful
            'gold': 1.0,
            'currency': 1.0
        };

        // Check itemType first
        if (lootEntry.itemType && meaningfulTypes[lootEntry.itemType]) {
            return meaningfulTypes[lootEntry.itemType];
        }

        // Check equipmentTypes array
        if (Array.isArray(lootEntry.equipmentTypes)) {
            let maxBonus = 1.0;
            for (const equipType of lootEntry.equipmentTypes) {
                if (meaningfulTypes[equipType]) {
                    maxBonus = Math.max(maxBonus, meaningfulTypes[equipType]);
                }
            }
            return maxBonus;
        }

        // Default bonus for unknown types
        return 1.1;
    },

    /**
     * Calculate pity bonus for consecutive empty encounters
     */
    calculatePityBonus: function(encounterContext) {
        if (!encounterContext.consecutiveEmptyEncounters) {
            return 1.0;
        }

        const emptyCount = encounterContext.consecutiveEmptyEncounters;

        // Progressive pity bonus: +15% per empty encounter, capped at +100%
        const pityMultiplier = 1.0 + Math.min(1.0, emptyCount * 0.15);
        return pityMultiplier;
    },

    /**
     * Get minimum viable drop chance for progression
     */
    getMinimumViableDropChance: function(lootEntry) {
        // Ensure certain item types always have minimum drop chances
        const minimumRates = {
            'healing_potion': 0.15,     // Always need healing items
            'mana_potion': 0.10,
            'beginner_weapon': 0.20,    // Progression equipment
            'beginner_armor': 0.20,
            'spell_scroll': 0.08,       // Learning materials
            'gold': 0.05,               // Minimal currency
            'material': 0.12            // Crafting/progression materials
        };

        return minimumRates[lootEntry.itemType] || 0.05; // 5% minimum for all items
    },

    /**
     * Get item value weight (0-1, where 1 is most valuable)
     */
    getItemValueWeight: function(lootEntry) {
        const valueWeights = {
            'ancient_tome': 1.0,
            'spell_tome': 0.9,
            'spell_book': 0.8,
            'spell_scroll': 0.6,
            'weapon': 0.8,
            'armor': 0.8,
            'accessory': 0.7,
            'equipment': 0.8,
            'healing_potion': 0.4,
            'mana_potion': 0.3,
            'material': 0.2,
            'gold': 0.1
        };

        return valueWeights[lootEntry.itemType] || 0.5; // Default mid-value
    },

    /**
     * Check if dropped loot is considered meaningful
     */
    isMeaningfulLoot: function(lootEntry, rarity, playerLevel) {
        // Uncommon+ rarity is always meaningful
        if (rarity !== 'common') {
            return true;
        }

        // Check if item type is inherently meaningful
        const meaningfulTypes = [
            'weapon', 'armor', 'accessory', 'equipment',
            'spell_scroll', 'spell_book', 'spell_tome', 'ancient_tome',
            'healing_potion', 'mana_potion'
        ];

        const isTypeMatch = meaningfulTypes.includes(lootEntry.itemType) ||
            (Array.isArray(lootEntry.equipmentTypes) &&
             lootEntry.equipmentTypes.some(type => meaningfulTypes.includes(type)));

        return isTypeMatch;
    },

    /**
     * Roll for item rarity based on weights and level scaling
     */
    rollForRarity: function(rarityWeights, playerLevel, contentLevel, encounterContext = {}) {
        // Start with normalized weights to ensure proper distribution
        const normalizedWeights = this.normalizeRarityWeights(rarityWeights);

        // Apply level-based rarity bonuses
        const levelDifference = playerLevel - contentLevel;
        const adjustedWeights = {};

        // Calculate adjusted weights with level scaling
        for (const [rarity, baseWeight] of Object.entries(normalizedWeights)) {
            const tierInfo = this.rarityTiers[rarity];
            if (tierInfo) {
                const levelBonus = levelDifference * tierInfo.levelScaling;
                adjustedWeights[rarity] = Math.max(0.001, baseWeight + levelBonus);
            } else {
                adjustedWeights[rarity] = baseWeight;
            }
        }

        // Use phase-based progression weights for consistent learning curve
        const phaseBaseWeights = this.getPhaseBasedRarityWeights(playerLevel, contentLevel);
        const finalWeights = { ...phaseBaseWeights, ...adjustedWeights };

        // Weighted random selection
        const totalWeight = Object.values(finalWeights).reduce((sum, weight) => sum + weight, 0);
        const roll = Math.random() * totalWeight;

        let cumulativeWeight = 0;
        for (const [rarity, weight] of Object.entries(finalWeights)) {
            cumulativeWeight += weight;
            if (roll <= cumulativeWeight) {
                return rarity;
            }
        }

        return 'common'; // Fallback
    },

    /**
     * Generate a specific loot item with properties
     */
    generateLootItem: function(itemType, rarity, playerLevel, contentLevel, areaName = null, buildDiversityInfo = null) {
        try {
            const tierInfo = this.rarityTiers[rarity];
            if (!tierInfo) {
                console.warn('Unknown rarity tier:', rarity);
                return null;
            }

            const baseItem = this.getBaseItemTemplate(itemType);
            if (!baseItem) {
                console.warn('Unknown item type:', itemType);
                return null;
            }

            const item = {
                ...baseItem,
                // Canonical item id used by ItemData and inventory keys
                itemId: itemType,
                // Unique instance id for generated loot instance
                id: this.generateItemId(),
                rarity,
                rarityInfo: tierInfo,
                level: Math.max(1, contentLevel + Math.floor((playerLevel - contentLevel) * 0.3)),
                generationInfo: {
                    playerLevel,
                    contentLevel,
                    area: areaName,
                    timestamp: Date.now()
                }
            };

            // Apply rarity-based enhancements
            this.applyRarityEnhancements(item, tierInfo, playerLevel, contentLevel);

            // Apply level scaling
            if (this.shouldApplyLevelScaling(itemType)) {
                this.applyLevelScaling(item, playerLevel, contentLevel);
            }

            // Apply area-specific bonuses
            if (areaName) {
                this.applyAreaSpecificBonuses(item, areaName);
            }

            // Apply early game learning enhancements (levels 1-10)
            if (playerLevel <= 10) {
                this.applyEarlyGameLearningEnhancements(item, itemType, rarity, playerLevel, contentLevel);
            }

            // Apply mid-game strategic enhancements (levels 11-20)
            if (playerLevel >= 11 && playerLevel <= 20) {
                this.applyMidGameStrategicEnhancements(item, itemType, rarity, playerLevel, contentLevel, areaName);
            }

            // Apply late-game prestige enhancements (levels 21-30+)
            if (playerLevel >= 21) {
                this.applyLateGamePrestigeEnhancements(item, itemType, rarity, playerLevel, contentLevel, areaName);
            }

            // Special handling for spell scrolls and learning materials
            if (itemType === 'spell_scroll' || itemType === 'spell_book' || itemType === 'spell_tome' || itemType === 'ancient_tome') {
                this.generateSpellLearningItem(item, itemType, rarity, playerLevel, contentLevel, areaName);
            }

            // Enhanced handling for consumables with learning curve support\n            if (item.type === 'consumable' || itemType === 'consumable' || itemType === 'potion' || \n                itemType === 'healing_potion' || itemType === 'mana_potion' || \n                (item.category && ['healing', 'restoration', 'enhancement', 'utility', 'cure', 'revival'].includes(item.category))) {\n                this.enhanceConsumableForLearning(item, playerLevel, rarity, areaName);\n            }\n\n            // Enhanced handling for materials with crafting system preparation\n            if (item.type === 'material' || itemType === 'material' || itemType === 'crafting_material' ||\n                (item.category && ['natural', 'monster_part', 'mineral', 'magical', 'crafting'].includes(item.category))) {\n                this.enhanceMaterialForCrafting(item, playerLevel, rarity, areaName, null);\n            }\n\n            // Apply build diversity enhancements if requested\n            if (buildDiversityInfo && buildDiversityInfo.diversityPromoted && buildDiversityInfo.diversityProfile) {\n                const playerClass = buildDiversityInfo.diversityProfile.playerClass ||\n                    (typeof GameState !== 'undefined' && GameState.player && GameState.player.class);\n                this.applyBuildDiversityEnhancements(item, playerLevel, playerClass, buildDiversityInfo.diversityProfile);\n            }\n\n            // Trigger special notifications for rare and legendary items\n            this.triggerSpecialLootNotifications(item, playerLevel, contentLevel, areaName);\n\n            return item;

        } catch (error) {
            console.error('❌ Error generating loot item:', error);
            return null;
        }
    },

    /**
     * Generate spell learning item (scroll, book, or tome) with enhanced class and level gating
     */
    generateSpellLearningItem: function(item, itemType, rarity, playerLevel, contentLevel, areaName, playerClass = null) {
        // Get player class from GameState if not provided
        if (!playerClass && typeof GameState !== 'undefined' && GameState.player && GameState.player.class) {
            playerClass = GameState.player.class;
        }

        // Get available spells for generation with class filtering
        const availableSpells = this.getGeneratableSpells(playerLevel, contentLevel, areaName, itemType, playerClass);

        if (availableSpells.length === 0) {
            // Enhanced fallback with class-appropriate basic spell
            const fallbackSpells = {
                'wizard': { id: 'fireball', name: 'Fireball', element: 'fire' },
                'paladin': { id: 'heal', name: 'Heal', element: 'holy' },
                'knight': { id: 'heal', name: 'Heal', element: 'holy' },
                'ranger': { id: 'cure', name: 'Cure', element: 'nature' },
                'rogue': { id: 'stealth', name: 'Stealth', element: 'shadow' },
                'warrior': { id: 'battle_rage', name: 'Battle Rage', element: 'physical' }
            };

            const fallback = fallbackSpells[playerClass] || fallbackSpells['wizard'];
            item.spellId = fallback.id;
            item.name = `${fallback.name} ${itemType === 'spell_scroll' ? 'Scroll' : itemType === 'spell_book' ? 'Book' : 'Tome'}`;
            item.description = `A ${itemType.replace('_', ' ')} containing the ${fallback.name} spell.`;
            item.icon = this.generateSpellItemIcon(fallback, itemType);
            return;
        }

        // Select spell with enhanced class and level weighting
        const selectedSpell = this.selectSpellForItem(availableSpells, rarity, playerLevel, playerClass, itemType);

        if (!selectedSpell) {
            console.warn('Failed to select spell for spell item generation');
            return;
        }

        // Apply spell-specific properties to item
        this.applySpellItemProperties(item, selectedSpell, itemType, rarity);
    },

    /**
     * Get spells that can be generated as loot items with enhanced filtering
     */
    getGeneratableSpells: function(playerLevel, contentLevel, areaName, itemType, playerClass = null) {
        const spells = [];

        if (typeof SpellData === 'undefined' || !SpellData.spells) {
            return this.getFallbackSpells(itemType);
        }

        // Get all available spells with class-aware filtering
        for (const [spellId, spell] of Object.entries(SpellData.spells)) {
            // Check if spell is appropriate for the level, area, and class
            if (this.isSpellAppropriateForGeneration(spell, playerLevel, contentLevel, areaName, itemType, playerClass)) {
                spells.push({ id: spellId, ...spell });
            }
        }

        return spells;
    },

    /**
     * Check if spell is appropriate for generation in current context
     */
    isSpellAppropriateForGeneration: function(spell, playerLevel, contentLevel, areaName, itemType, playerClass = null) {
        // Level appropriateness check
        const maxSpellLevel = contentLevel + 3; // Allow spells up to 3 levels above content
        const minSpellLevel = Math.max(1, contentLevel - 2); // Allow spells down to 2 levels below content

        if (spell.learnLevel > maxSpellLevel || spell.learnLevel < minSpellLevel) {
            return false;
        }

        // Enhanced scroll type restrictions with better level gating
        if (itemType === 'spell_scroll' && spell.learnLevel > 10) {
            return false; // Basic scrolls don't contain high-level spells
        }

        if (itemType === 'spell_book' && (spell.learnLevel < 3 || spell.learnLevel > 18)) {
            return false; // Books contain low-mid to high-level spells
        }

        if (itemType === 'spell_tome' && spell.learnLevel < 8) {
            return false; // Tomes contain mid-high to legendary spells
        }

        if (itemType === 'ancient_tome' && spell.learnLevel < 15) {
            return false; // Ancient tomes contain only high-level spells
        }

        // Class compatibility check - prioritize class-appropriate spells
        if (playerClass && spell.availableClasses && spell.availableClasses.length > 0) {
            const isClassCompatible = spell.availableClasses.includes(playerClass);

            // Always allow class-compatible spells
            if (isClassCompatible) {
                // Class-compatible spells have higher chance in higher-tier items
                const compatibilityBonus = {
                    'spell_scroll': 0.8,    // 80% chance for scrolls
                    'spell_book': 0.9,      // 90% chance for books
                    'spell_tome': 0.95,     // 95% chance for tomes
                    'ancient_tome': 1.0     // 100% chance for ancient tomes
                };

                if (Math.random() > (compatibilityBonus[itemType] || 0.8)) {
                    return false;
                }
            } else {
                // Non-compatible spells have reduced chance, scaled by item type
                const crossClassChance = {
                    'spell_scroll': 0.4,    // 40% chance for basic scrolls
                    'spell_book': 0.25,     // 25% chance for books
                    'spell_tome': 0.15,     // 15% chance for tomes
                    'ancient_tome': 0.05    // 5% chance for ancient tomes
                };

                if (Math.random() > (crossClassChance[itemType] || 0.3)) {
                    return false;
                }
            }
        }

        // Area-specific spell filtering with enhanced affinities
        if (areaName && spell.element) {
            const areaSpellAffinities = {
                'fire_temple': ['fire', 'flame'],
                'ice_cavern': ['ice', 'water', 'frost'],
                'lightning_tower': ['thunder', 'electric', 'storm'],
                'nature_grove': ['nature', 'healing', 'earth'],
                'cursed_ruins': ['dark', 'death', 'shadow'],
                'holy_sanctuary': ['holy', 'light', 'healing'],
                'dragon_lair': ['fire', 'wind', 'ancient'],
                'crystal_caves': ['crystal', 'earth', 'magic'],
                'forest': ['nature', 'healing', 'earth'],
                'mountains': ['earth', 'wind', 'strength'],
                'swamp': ['poison', 'nature', 'dark'],
                'desert': ['fire', 'sand', 'illusion']
            };

            const areaAffinities = areaSpellAffinities[areaName];
            if (areaAffinities && !areaAffinities.includes(spell.element)) {
                // Area-matching spells have priority, non-matching reduced chance
                const affinityChance = {
                    'spell_scroll': 0.4,    // 40% for non-matching in scrolls
                    'spell_book': 0.3,      // 30% for books
                    'spell_tome': 0.2,      // 20% for tomes
                    'ancient_tome': 0.1     // 10% for ancient tomes
                };

                if (Math.random() > (affinityChance[itemType] || 0.3)) {
                    return false;
                }
            }
        }

        return true;
    },

    /**
     * Select appropriate spell for item generation
     */
    selectSpellForItem: function(availableSpells, rarity, playerLevel, playerClass = null, itemType = 'spell_scroll') {
        if (availableSpells.length === 0) return null;

        // Weight spells by rarity, class compatibility, and item type appropriateness
        const weightedSpells = availableSpells.map(spell => {
            let weight = 1.0;

            // Class compatibility weighting - prioritize class-appropriate spells
            if (playerClass && spell.availableClasses && spell.availableClasses.length > 0) {
                if (spell.availableClasses.includes(playerClass)) {
                    // Strong preference for class-compatible spells
                    const classBonus = {
                        'spell_scroll': 3.0,    // 3x weight for scrolls
                        'spell_book': 4.0,      // 4x weight for books
                        'spell_tome': 5.0,      // 5x weight for tomes
                        'ancient_tome': 6.0     // 6x weight for ancient tomes
                    };
                    weight *= classBonus[itemType] || 3.0;
                } else {
                    // Reduced weight for non-compatible spells
                    weight *= 0.3;
                }
            }

            // Level appropriateness weighting
            const levelDiff = Math.abs(spell.learnLevel - playerLevel);
            if (levelDiff <= 2) {
                weight *= 2.0; // Bonus for level-appropriate spells
            } else if (levelDiff <= 5) {
                weight *= 1.2; // Small bonus for nearby levels
            } else if (levelDiff > 10) {
                weight *= 0.5; // Penalty for very distant levels
            }

            // Item type and spell level synergy
            const itemTypeWeights = {
                'spell_scroll': {
                    1: 2.0, 2: 2.0, 3: 1.8, 4: 1.5, 5: 1.2, // Strong preference for low levels
                    6: 1.0, 7: 0.8, 8: 0.6, 9: 0.4, 10: 0.2  // Decreasing preference
                },
                'spell_book': {
                    1: 0.2, 2: 0.4, 3: 1.0, 4: 1.5, 5: 2.0, // Building up to mid levels
                    6: 2.0, 7: 2.0, 8: 1.8, 9: 1.6, 10: 1.4, // Peak at mid levels
                    11: 1.2, 12: 1.0, 13: 0.8, 14: 0.6, 15: 0.4, // Declining
                    16: 0.3, 17: 0.2, 18: 0.1
                },
                'spell_tome': {
                    1: 0.1, 2: 0.1, 3: 0.1, 4: 0.1, 5: 0.2, // Very low for early levels
                    6: 0.3, 7: 0.5, 8: 1.0, 9: 1.5, 10: 2.0, // Building up
                    11: 2.5, 12: 3.0, 13: 3.0, 14: 2.8, 15: 2.5, // Peak at high levels
                    16: 2.2, 17: 2.0, 18: 1.8, 19: 1.5, 20: 1.2
                },
                'ancient_tome': {
                    1: 0.0, 2: 0.0, 3: 0.0, 4: 0.0, 5: 0.0,  // No low level spells
                    6: 0.0, 7: 0.0, 8: 0.0, 9: 0.0, 10: 0.1, 11: 0.1, 12: 0.2,
                    13: 0.3, 14: 0.5, 15: 1.0, 16: 2.0, 17: 3.0, 18: 4.0, // Strong preference for legendary
                    19: 5.0, 20: 6.0, 21: 7.0, 22: 8.0, 23: 9.0, 24: 10.0, 25: 12.0
                }
            };

            const typeWeight = itemTypeWeights[itemType];
            if (typeWeight && typeWeight[spell.learnLevel]) {
                weight *= typeWeight[spell.learnLevel];
            }

            // Rarity weighting - prefer spells that match item rarity expectations
            const rarityWeights = {
                'common': { low: 2.0, mid: 1.0, high: 0.3 },
                'uncommon': { low: 1.5, mid: 2.0, high: 0.8 },
                'rare': { low: 0.8, mid: 1.5, high: 2.0 },
                'epic': { low: 0.3, mid: 1.0, high: 2.5 },
                'legendary': { low: 0.1, mid: 0.5, high: 3.0 }
            };

            // Categorize spell level for rarity matching
            let levelCategory = 'mid';
            if (spell.learnLevel <= 5) levelCategory = 'low';
            else if (spell.learnLevel >= 15) levelCategory = 'high';

            weight *= rarityWeights[rarity]?.[levelCategory] || 1.0;

            return { spell, weight };
        });

        // Weighted random selection
        const totalWeight = weightedSpells.reduce((sum, item) => sum + item.weight, 0);
        let randomWeight = Math.random() * totalWeight;

        for (const item of weightedSpells) {
            randomWeight -= item.weight;
            if (randomWeight <= 0) {
                return item.spell;
            }
        }

        // Fallback to random selection
        return availableSpells[Math.floor(Math.random() * availableSpells.length)];
    },

    /**
     * Apply spell-specific properties to the generated item
     */
    applySpellItemProperties: function(item, spell, itemType, rarity) {
        item.spellId = spell.id;
        item.type = 'consumable';
        item.usageType = 'spell_learning';

        // Set item name and description
        const typeNames = {
            'spell_scroll': 'Scroll',
            'spell_book': 'Book',
            'spell_tome': 'Tome'
        };

        item.name = `${spell.name} ${typeNames[itemType]}`;
        item.description = this.generateSpellItemDescription(spell, itemType);

        // Set appropriate icon
        item.icon = this.getSpellItemIcon(spell, itemType);

        // Set spell learning effect
        item.effect = {
            type: 'learn_spell',
            spell: spell.id
        };

        // Set requirements based on spell
        item.requirements = this.generateSpellItemRequirements(spell, itemType);

        // Adjust value based on spell level and type
        item.value = this.calculateSpellItemValue(spell, itemType, rarity);
    },

    /**
     * Generate description for spell learning item
     */
    generateSpellItemDescription: function(spell, itemType) {
        const typeDescriptions = {
            'spell_scroll': 'A magical scroll containing',
            'spell_book': 'An ancient book teaching',
            'spell_tome': 'A powerful tome inscribed with'
        };

        const baseDesc = typeDescriptions[itemType] || 'Contains';
        return `${baseDesc} the ${spell.name} spell. ${spell.description || 'A useful magical ability.'}`;
    },

    /**
     * Get appropriate icon for spell learning item
     */
    getSpellItemIcon: function(spell, itemType) {
        const elementIcons = {
            'fire': '🔥',
            'ice': '❄️',
            'water': '💧',
            'thunder': '⚡',
            'electric': '⚡',
            'earth': '🌍',
            'nature': '🌿',
            'healing': '✨',
            'holy': '☀️',
            'light': '💡',
            'dark': '🌑',
            'death': '💀'
        };

        const typeBase = {
            'spell_scroll': '📜',
            'spell_book': '📚',
            'spell_tome': '📖'
        };

        const base = typeBase[itemType] || '📜';
        const element = elementIcons[spell.element] || '✨';

        return base + element;
    },

    /**
     * Generate requirements for spell learning item
     */
    generateSpellItemRequirements: function(spell, itemType) {
        const requirements = {};

        // Level requirements
        if (spell.learnLevel > 1) {
            requirements.level = Math.max(1, spell.learnLevel - 1);
        }

        // Class requirements
        if (spell.availableClasses && spell.availableClasses.length > 0) {
            requirements.classes = [...spell.availableClasses];
        }

        // Intelligence requirements for books and tomes
        if (itemType === 'spell_book') {
            requirements.minIntelligence = Math.max(10, spell.learnLevel + 5);
        } else if (itemType === 'spell_tome') {
            requirements.minIntelligence = Math.max(15, spell.learnLevel + 8);
        }

        // Story requirements for rare spells
        if (spell.requirements && spell.requirements.story) {
            requirements.story = spell.requirements.story;
        }

        return requirements;
    },

    /**
     * Calculate value for spell learning item
     */
    calculateSpellItemValue: function(spell, itemType, rarity) {
        let baseValue = spell.learnLevel * 20; // Base value scales with spell level

        // Type multipliers
        const typeMultipliers = {
            'spell_scroll': 1.0,
            'spell_book': 2.0,
            'spell_tome': 4.0
        };

        baseValue *= typeMultipliers[itemType] || 1.0;

        // Rarity multipliers
        const rarityMultipliers = {
            'common': 1.0,
            'uncommon': 1.5,
            'rare': 2.5,
            'epic': 4.0,
            'legendary': 8.0
        };

        baseValue *= rarityMultipliers[rarity] || 1.0;

        return Math.round(baseValue);
    },

    /**
     * Get fallback spells when SpellData is not available
     */
    getFallbackSpells: function(itemType) {
        const fallbackSpells = [
            { id: 'heal', name: 'Heal', learnLevel: 1, element: 'healing', availableClasses: ['wizard', 'paladin'] },
            { id: 'fireball', name: 'Fireball', learnLevel: 3, element: 'fire', availableClasses: ['wizard'] },
            { id: 'ice_shard', name: 'Ice Shard', learnLevel: 2, element: 'ice', availableClasses: ['wizard'] }
        ];

        return fallbackSpells.filter(spell => {
            if (itemType === 'spell_scroll') return spell.learnLevel <= 10;
            if (itemType === 'spell_book') return spell.learnLevel >= 5 && spell.learnLevel <= 15;
            if (itemType === 'spell_tome') return spell.learnLevel >= 10;
            return true;
        });
    },

    /**
     * Apply rarity-based enhancements to item
     */
    applyRarityEnhancements: function(item, tierInfo, playerLevel, contentLevel) {
        // Apply quality multiplier
        const qualityRoll = Math.random();
        const qualityRange = tierInfo.qualityRange;
        item.quality = qualityRange[0] + (qualityRoll * (qualityRange[1] - qualityRange[0]));

        // Apply value multiplier
        if (item.baseValue) {
            item.value = Math.round(item.baseValue * tierInfo.valueMultiplier * item.quality);
        }

        // Add rarity-specific properties
        item.rarityLevel = Object.keys(this.rarityTiers).indexOf(item.rarity);

        // Higher rarity items get additional properties
        if (item.rarityLevel >= 2) { // Rare+
            this.addBonusProperties(item, tierInfo);
        }

        if (item.rarityLevel >= 3) { // Epic+
            this.addSpecialEffects(item, tierInfo);
        }

        if (item.rarityLevel >= 4) { // Legendary
            this.addLegendaryProperties(item, tierInfo);
        }
    },

    /**
     * Apply level scaling to item stats
     */
    applyLevelScaling: function(item, playerLevel, contentLevel) {
        const levelDifference = Math.abs(playerLevel - contentLevel);
        const scalingFactor = 1 + (levelDifference * 0.1);

        // Scale numerical properties
        const scalableProps = ['attack', 'defense', 'magicAttack', 'magicDefense', 'healing', 'duration'];

        for (const prop of scalableProps) {
            if (item[prop] && typeof item[prop] === 'number') {
                item[prop] = Math.round(item[prop] * scalingFactor);
            }
        }

        // Update item level display
        item.effectiveLevel = Math.max(1, item.level);
    },

    /**
     * Generate gold drop amount
     */
    generateGoldDrop: function(contentLevel, playerLevel) {
        const baseGold = 10 + (contentLevel * 5);
        const levelBonus = Math.max(0, (playerLevel - contentLevel) * 0.1);
        const variance = 0.3; // ±30% variance

        const finalAmount = baseGold * (1 + levelBonus) * (1 + (Math.random() - 0.5) * variance);

        return Math.max(1, Math.round(finalAmount));
    },

    /**
     * Calculate experience reward
     */
    calculateExperienceReward: function(contentLevel, playerLevel) {
        const basExp = 50 + (contentLevel * 10);
        const levelPenalty = Math.max(0.1, 1 - ((playerLevel - contentLevel) * 0.1));

        return Math.round(basExp * levelPenalty);
    },

    /**
     * Get level scaling multiplier with anti-farming measures
     * Enhanced formula prevents over-farming while maintaining fairness across level ranges
     * Now includes progression-aware penalties that scale with content tier
     */
    calculateLevelScaling: function(levelDifference, playerLevel = 1, contentLevel = 1) {
        // Base scaling factor
        let scaling = 1.0;

        // Apply progression-aware level difference penalties
        const progressionPenalty = this.calculateProgressionPenalty(levelDifference, playerLevel, contentLevel);
        scaling *= progressionPenalty;

        if (levelDifference > 0) {
            // Player higher level - implement progressive diminishing returns

            // Tier-based scaling to prevent extreme over-farming
            if (levelDifference <= 2) {
                // Small difference: minimal penalty to keep lower content viable
                scaling *= 1.0 - (levelDifference * 0.08); // -8% per level (was -15%)
            } else if (levelDifference <= 5) {
                // Medium difference: moderate penalty with diminishing returns
                const basePenalty = 0.16; // From 2 level penalty
                const additionalLevels = levelDifference - 2;
                scaling *= 1.0 - basePenalty - (additionalLevels * 0.12); // -12% per additional level
            } else if (levelDifference <= 10) {
                // Large difference: strong penalty but with curve flattening
                const mediumPenalty = 0.52; // From 5 level penalty
                const additionalLevels = levelDifference - 5;
                scaling *= 1.0 - mediumPenalty - (additionalLevels * 0.06); // -6% per additional level
            } else {
                // Extreme difference: asymptotic approach to minimum
                const largePenalty = 0.82; // From 10 level penalty
                const additionalLevels = levelDifference - 10;
                // Exponential decay towards minimum, preventing complete elimination
                scaling *= Math.max(0.1, 0.18 * Math.exp(-additionalLevels * 0.1));
            }

            // Ensure minimum viable drops for progression reasons
            scaling = Math.max(0.1, scaling);

        } else if (levelDifference < 0) {
            // Content higher level - controlled bonus to encourage appropriate challenges
            const absDifference = Math.abs(levelDifference);

            if (absDifference <= 3) {
                // Reasonable challenge: moderate bonus
                scaling *= 1.0 + (absDifference * 0.12); // +12% per level (was +10%)
            } else if (absDifference <= 8) {
                // High challenge: good bonus but diminishing returns
                const baseBonus = 0.36; // From 3 level bonus
                const additionalLevels = absDifference - 3;
                scaling *= 1.0 + baseBonus + (additionalLevels * 0.08); // +8% per additional level
            } else {
                // Extreme challenge: high bonus but capped to prevent exploitation
                const mediumBonus = 0.76; // From 8 level bonus
                const additionalLevels = absDifference - 8;
                scaling *= 1.0 + mediumBonus + (additionalLevels * 0.04); // +4% per additional level
            }

            // Cap maximum bonus to prevent extreme farming of high-level content
            scaling = Math.min(2.0, scaling); // Was 1.5, increased for better high-level incentive
        }

        // Add slight content-level based adjustments to encourage progression
        const contentTierBonus = this.getContentTierBonus(contentLevel, playerLevel);
        scaling = scaling * contentTierBonus;

        return scaling;
    },

    /**
     * Calculate progression-aware level difference penalties
     * Penalties scale based on content tier to encourage appropriate progression
     */
    calculateProgressionPenalty: function(levelDifference, playerLevel, contentLevel) {
        // Define content progression tiers
        const contentTiers = this.getContentTiers(contentLevel);
        const playerTier = this.getContentTiers(playerLevel);

        // Calculate tier difference penalty
        const tierDifference = playerTier.tier - contentTiers.tier;

        // Base progression penalty starts at 1.0 (no penalty)
        let progressionMultiplier = 1.0;

        if (levelDifference > 0) {
            // Player is higher level than content

            if (tierDifference > 0) {
                // Player is in a higher tier than content
                const tierPenalty = this.calculateTierDownscalePenalty(tierDifference, contentTiers.tier);
                progressionMultiplier *= tierPenalty;
            }

            // Add progression-specific penalties for being too far ahead
            const progressionGap = this.calculateProgressionGap(playerLevel, contentLevel);
            if (progressionGap > 0.5) { // More than 50% ahead in progression
                const gapPenalty = Math.max(0.3, 1.0 - (progressionGap * 0.4)); // Up to 70% penalty
                progressionMultiplier *= gapPenalty;
            }

        } else if (levelDifference < 0) {
            // Content is higher level than player

            if (tierDifference < 0) {
                // Content is in a higher tier than player
                const tierBonus = this.calculateTierUpscaleBonus(Math.abs(tierDifference), playerTier.tier);
                progressionMultiplier *= tierBonus;
            }

            // Reduce bonus if player is attempting content too far beyond their progression
            const progressionStretch = this.calculateProgressionStretch(playerLevel, contentLevel);
            if (progressionStretch > 1.5) { // More than 150% of recommended progression
                const stretchReduction = Math.max(0.7, 2.0 - progressionStretch); // Reduce bonus as stretch increases
                progressionMultiplier *= stretchReduction;
            }
        }

        return Math.max(0.1, Math.min(2.5, progressionMultiplier)); // Bound between 10% and 250%
    },

    /**
     * Get content tier information for progression calculations
     */
    getContentTiers: function(level) {
        // Define progression tiers with their characteristics
        if (level <= 5) {
            return { tier: 1, name: 'Tutorial', scalingFactor: 1.0 };
        } else if (level <= 10) {
            return { tier: 2, name: 'Beginner', scalingFactor: 1.1 };
        } else if (level <= 15) {
            return { tier: 3, name: 'Novice', scalingFactor: 1.2 };
        } else if (level <= 20) {
            return { tier: 4, name: 'Intermediate', scalingFactor: 1.3 };
        } else if (level <= 25) {
            return { tier: 5, name: 'Advanced', scalingFactor: 1.4 };
        } else if (level <= 30) {
            return { tier: 6, name: 'Expert', scalingFactor: 1.5 };
        } else if (level <= 40) {
            return { tier: 7, name: 'Master', scalingFactor: 1.6 };
        } else {
            return { tier: 8, name: 'Legendary', scalingFactor: 1.8 };
        }
    },

    /**
     * Calculate tier downscale penalty for fighting lower-tier content
     */
    calculateTierDownscalePenalty: function(tierDifference, contentTier) {
        // Harsher penalties for fighting much lower tier content
        const basePenalty = 0.15 * tierDifference; // 15% penalty per tier difference

        // Early game tiers have lighter penalties to allow backtracking
        const earlyGameMultiplier = contentTier <= 3 ? 0.6 : 1.0;

        // Late game tiers have harsher penalties to prevent extreme farming
        const lateGameMultiplier = contentTier >= 6 ? 1.4 : 1.0;

        const totalPenalty = basePenalty * earlyGameMultiplier * lateGameMultiplier;
        return Math.max(0.2, 1.0 - totalPenalty); // Minimum 20% of original reward
    },

    /**
     * Calculate tier upscale bonus for fighting higher-tier content
     */
    calculateTierUpscaleBonus: function(tierDifference, playerTier) {
        // Bonus for challenging higher-tier content, but diminishing returns
        const baseBonus = 0.2 * tierDifference; // 20% bonus per tier difference

        // Early game players get bigger bonuses to encourage exploration
        const earlyGameMultiplier = playerTier <= 3 ? 1.3 : 1.0;

        // Late game players get reduced bonuses to prevent exploitation
        const lateGameMultiplier = playerTier >= 6 ? 0.8 : 1.0;

        const totalBonus = baseBonus * earlyGameMultiplier * lateGameMultiplier;
        return Math.min(1.8, 1.0 + totalBonus); // Maximum 180% of original reward
    },

    /**
     * Calculate progression gap (how far ahead player is compared to expected progression)
     */
    calculateProgressionGap: function(playerLevel, contentLevel) {
        // Expected progression assumes players should be within 3-5 levels of content they're engaging with
        const expectedMinLevel = contentLevel - 2;
        const expectedMaxLevel = contentLevel + 3;

        if (playerLevel <= expectedMaxLevel) {
            return 0; // No gap, player is within expected range
        }

        // Calculate how far ahead the player is as a percentage
        const levelGap = playerLevel - expectedMaxLevel;
        const progressionGap = levelGap / Math.max(1, contentLevel); // Normalize by content level

        return progressionGap;
    },

    /**
     * Calculate progression stretch (how far player is attempting to reach beyond their tier)
     */
    calculateProgressionStretch: function(playerLevel, contentLevel) {
        // Calculate how much the player is stretching beyond recommended progression
        const playerTier = this.getContentTiers(playerLevel);
        const contentTier = this.getContentTiers(contentLevel);

        if (contentTier.tier <= playerTier.tier) {
            return 1.0; // No stretch, content is at or below player tier
        }

        // Calculate stretch as ratio of content level to expected progression
        const expectedMaxContent = playerLevel + 5; // Players can reasonably handle content 5 levels above
        const stretch = contentLevel / Math.max(1, expectedMaxContent);

        return stretch;
    },

    /**
     * Get content tier bonus based on progression appropriateness
     */
    getContentTierBonus: function(contentLevel, playerLevel) {
        // Encourage players to engage with level-appropriate content
        const levelRatio = playerLevel / Math.max(1, contentLevel);

        if (levelRatio >= 0.8 && levelRatio <= 1.3) {
            // Level-appropriate content gets slight bonus
            return 1.05;
        } else if (levelRatio >= 0.6 && levelRatio <= 1.6) {
            // Near-appropriate content is neutral
            return 1.0;
        } else {
            // Far from appropriate level gets slight penalty
            return 0.95;
        }
    },

    /**
     * Get exploration type modifiers
     */
    getExplorationModifiers: function(explorationType) {
        const modifiers = {
            // Standard exploration - balanced rewards
            standard: {
                dropChanceMultiplier: 1.0,
                goldMultiplier: 1.0,
                rarityBonus: 0.0,
                timeMultiplier: 1.0,
                description: "Normal exploration pace with balanced rewards"
            },

            // Thorough exploration - higher drop rates, better rarity
            thorough: {
                dropChanceMultiplier: 1.4,
                goldMultiplier: 1.3,
                rarityBonus: 0.1, // 10% better rarity chances
                timeMultiplier: 2.0,
                description: "Careful, detailed exploration with higher reward chances"
            },

            // Quick exploration - lower rewards but faster
            quick: {
                dropChanceMultiplier: 0.6,
                goldMultiplier: 0.7,
                rarityBonus: -0.05, // 5% worse rarity chances
                timeMultiplier: 0.5,
                description: "Fast exploration with reduced rewards"
            },

            // Treasure hunting - focused on valuable items
            treasure_hunt: {
                dropChanceMultiplier: 1.2,
                goldMultiplier: 2.5,
                rarityBonus: 0.15, // 15% better rarity chances
                timeMultiplier: 1.5,
                description: "Focused search for valuable treasures and rare items"
            },

            // Stealth exploration - avoids encounters, different loot
            stealth: {
                dropChanceMultiplier: 0.8,
                goldMultiplier: 1.1,
                rarityBonus: 0.05,
                timeMultiplier: 1.2,
                description: "Careful exploration avoiding confrontation"
            },

            // Resource gathering - focused on materials
            resource_gathering: {
                dropChanceMultiplier: 1.6,
                goldMultiplier: 0.9,
                rarityBonus: -0.1, // Lower rarity but more quantity
                timeMultiplier: 1.8,
                description: "Systematic collection of materials and resources"
            },

            // Combat patrol - looking for fights
            combat_patrol: {
                dropChanceMultiplier: 0.9,
                goldMultiplier: 1.1,
                rarityBonus: 0.0,
                timeMultiplier: 1.1,
                description: "Aggressive exploration seeking combat encounters"
            }
        };

        return modifiers[explorationType] || modifiers.standard;
    },

    /**
     * Apply rarity bonus to rarity weights
     */
    applyRarityBonus: function(rarityWeights, rarityBonus) {
        if (!rarityBonus || rarityBonus === 0) {
            return rarityWeights;
        }

        const adjustedWeights = { ...rarityWeights };

        // Apply bonus by shifting weights toward higher rarities
        if (rarityBonus > 0) {
            // Positive bonus - increase higher rarity weights
            const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

            for (let i = rarityOrder.length - 1; i >= 0; i--) {
                const rarity = rarityOrder[i];
                if (adjustedWeights[rarity]) {
                    // Higher rarities get more benefit from the bonus
                    const multiplier = 1 + (rarityBonus * (i + 1) * 0.5);
                    adjustedWeights[rarity] *= multiplier;
                }
            }
        } else {
            // Negative bonus - increase lower rarity weights
            const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

            for (let i = 0; i < rarityOrder.length; i++) {
                const rarity = rarityOrder[i];
                if (adjustedWeights[rarity]) {
                    // Lower rarities get more benefit from negative bonus
                    const multiplier = 1 + (Math.abs(rarityBonus) * (5 - i) * 0.3);
                    adjustedWeights[rarity] *= multiplier;
                }
            }
        }

        // Normalize weights to prevent overflow
        const totalWeight = Object.values(adjustedWeights).reduce((sum, weight) => sum + weight, 0);
        if (totalWeight > 0) {
            for (const rarity in adjustedWeights) {
                adjustedWeights[rarity] /= totalWeight;
            }
        }

        return adjustedWeights;
    },

    /**
     * Apply rarity bonus to rarity weights
     */
    applyRarityBonus: function(rarityWeights, rarityBonus) {
        if (!rarityBonus || rarityBonus === 0) {
            return rarityWeights;
        }

        const modifiedWeights = { ...rarityWeights };

        // Positive bonus shifts towards higher rarities
        if (rarityBonus > 0) {
            // Reduce common, increase rare+
            if (modifiedWeights.common) modifiedWeights.common *= (1 - rarityBonus);
            if (modifiedWeights.uncommon) modifiedWeights.uncommon *= (1 + rarityBonus * 0.5);
            if (modifiedWeights.rare) modifiedWeights.rare *= (1 + rarityBonus);
            if (modifiedWeights.epic) modifiedWeights.epic *= (1 + rarityBonus * 1.5);
            if (modifiedWeights.legendary) modifiedWeights.legendary *= (1 + rarityBonus * 2.0);
        } else {
            // Negative bonus shifts towards lower rarities
            const penalty = Math.abs(rarityBonus);
            if (modifiedWeights.common) modifiedWeights.common *= (1 + penalty);
            if (modifiedWeights.uncommon) modifiedWeights.uncommon *= (1 - penalty * 0.5);
            if (modifiedWeights.rare) modifiedWeights.rare *= (1 - penalty);
            if (modifiedWeights.epic) modifiedWeights.epic *= (1 - penalty * 1.5);
            if (modifiedWeights.legendary) modifiedWeights.legendary *= (1 - penalty * 2.0);
        }

        return modifiedWeights;
    },

    /**
     * Helper methods for item generation
     */
    generateItemId: function() {
        return 'loot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    getBaseItemTemplate: function(itemType) {
        // First check if ItemData is available and has this specific item ID
        if (typeof ItemData !== 'undefined') {
            // Prefer official accessor if available
            if (typeof ItemData.getItem === 'function') {
                const found = ItemData.getItem(itemType);
                if (found) return { ...found };
            }

            // Fallback to combined map if exposed
            if (typeof ItemData.getAllItems === 'function') {
                const all = ItemData.getAllItems();
                if (all && all[itemType]) return { ...all[itemType] };
            }
        }

        // Fallback to generic templates for basic types
        const templates = {
            weapon: { name: 'Weapon', category: 'equipment', slot: 'weapon', baseValue: 50 },
            armor: { name: 'Armor', category: 'equipment', slot: 'armor', baseValue: 40 },
            accessory: { name: 'Accessory', category: 'equipment', slot: 'accessory', baseValue: 30 },
            potion: { name: 'Potion', category: 'consumable', stackable: true, baseValue: 10 },
            material: { name: 'Material', category: 'material', stackable: true, baseValue: 5 },
            spell_scroll: { name: 'Spell Scroll', category: 'spell_scroll', stackable: false, baseValue: 100 },
            spell_book: { name: 'Spell Book', category: 'spell_book', stackable: false, baseValue: 200 },
            spell_tome: { name: 'Spell Tome', category: 'spell_tome', stackable: false, baseValue: 500 },
            ancient_tome: { name: 'Ancient Tome', category: 'ancient_tome', stackable: false, baseValue: 1000 },

            // Abstract item type fallbacks
            tutorial_items: { name: 'Tutorial Item', category: 'material', stackable: true, baseValue: 5 },
            village_supplies: { name: 'Village Supply', category: 'material', stackable: true, baseValue: 8 }
        };

        return templates[itemType] ? { ...templates[itemType] } : null;
    },

    shouldApplyLevelScaling: function(itemType) {
        return ['weapon', 'armor', 'accessory', 'material'].includes(itemType);
    },

    /**
     * Resolve a concrete item ID from a loot entry that may reference abstract categories
     */
    resolveConcreteItemId: function(lootEntry) {
        try {
            // 1) Prefer explicit items array
            if (Array.isArray(lootEntry.items) && lootEntry.items.length > 0) {
                if (typeof ItemData !== 'undefined' && typeof ItemData.getItem === 'function') {
                    const valid = lootEntry.items.filter(id => !!ItemData.getItem(id));
                    if (valid.length > 0) {
                        return valid[Math.floor(Math.random() * valid.length)];
                    }
                }
                // Fallback to any listed item
                return lootEntry.items[Math.floor(Math.random() * lootEntry.items.length)];
            }

            // 2) Handle equipment type abstractions via equipmentTypes array
            if (Array.isArray(lootEntry.equipmentTypes) && lootEntry.equipmentTypes.length > 0) {
                const equipmentMap = {
                    // Basic categories
                    light_armor: ['leather_armor', 'leather_vest', 'ranger_cloak', 'cloth_robe'],
                    simple_weapon: ['iron_sword', 'oak_staff', 'steel_dagger', 'hunting_bow', 'battle_axe'],
                    beast_armor: ['leather_armor', 'ranger_cloak'],
                    nature_accessory: ['nature_charm', 'health_ring'],
                    nature_equipment: ['oak_staff', 'leather_armor', 'nature_charm', 'ranger_cloak', 'hunting_bow', 'cloth_robe'],

                    // Expanded beginner equipment for new players
                    beginner_weapons: ['iron_sword', 'steel_dagger', 'oak_staff', 'hunting_bow', 'battle_axe'],
                    beginner_equipment: ['iron_sword', 'oak_staff', 'steel_dagger', 'leather_armor', 'cloth_robe', 'health_ring'],
                    knight_weapons: ['iron_sword', 'steel_sword', 'blessed_mace'],
                    wizard_weapons: ['oak_staff', 'crystal_staff'],
                    rogue_weapons: ['steel_dagger', 'poisoned_blade'],
                    ranger_weapons: ['hunting_bow', 'elvish_bow'],
                    warrior_weapons: ['battle_axe', 'great_axe'],
                    paladin_weapons: ['blessed_mace', 'steel_sword'],

                    // Class-specific armor (expanded)
                    beginner_armor: ['leather_armor', 'cloth_robe', 'leather_vest'],
                    knight_armor: ['chain_mail', 'plate_armor', 'leather_armor'],
                    wizard_armor: ['cloth_robe', 'mage_robes'],
                    rogue_armor: ['leather_armor', 'leather_vest', 'stealth_cloak'],
                    ranger_armor: ['ranger_cloak', 'leather_armor', 'leather_vest'],
                    warrior_armor: ['scale_mail', 'chain_mail', 'leather_armor'],

                    // Class-specific accessories
                    knight_accessories: ['health_ring', 'strength_band', 'holy_symbol'],
                    wizard_accessories: ['mana_crystal', 'nature_charm'],
                    rogue_accessories: ['stealth_cloak', 'health_ring'],
                    ranger_accessories: ['nature_charm', 'health_ring'],
                    warrior_accessories: ['strength_band', 'health_ring'],
                    paladin_accessories: ['holy_symbol', 'health_ring', 'mana_crystal'],

                    // Advanced equipment categories
                    crude_weapon: ['club', 'stone_knife', 'sling'],
                    club: ['wooden_club', 'bone_club'],
                    dagger: ['steel_dagger', 'shadow_blade'],
                    sling: ['leather_sling'],

                    // Specialized equipment sets
                    war_axe: ['battle_axe', 'war_hammer'],
                    battle_armor: ['scale_mail', 'plate_armor'],
                    strength_ring: ['power_ring', 'giant_ring'],

                    // Environmental gear
                    hunting_bow: ['oak_bow', 'composite_bow'],
                    wind_cloak: ['feather_cloak', 'storm_cloak'],
                    accuracy_ring: ['precision_ring', 'eagle_eye_ring'],
                    flight_boots: ['winged_boots', 'sky_walker_boots'],

                    // Mountain/climbing gear
                    mountain_boots: ['climbing_boots', 'steel_toe_boots'],
                    hardy_vest: ['mountain_vest', 'explorer_armor'],
                    climbing_gear: ['climbing_rope', 'grappling_hook'],

                    // Defensive equipment
                    stone_armor: ['rock_plate', 'granite_mail'],
                    earth_shield: ['stone_shield', 'boulder_guard'],
                    defense_amulet: ['protection_charm', 'ward_pendant'],

                    // Stealth equipment
                    shadow_cloak: ['night_cloak', 'invisibility_cloak'],
                    night_vision_goggles: ['dark_sight_lens', 'shadow_eyes'],
                    stealth_boots: ['silent_boots', 'shadow_step'],

                    // Magical equipment
                    crystal_staff: ['quartz_staff', 'amethyst_rod'],
                    reflection_armor: ['mirror_mail', 'prism_plate'],
                    magic_amulet: ['mana_pendant', 'spell_focus'],

                    // Treasure/wealth gear
                    gem_staff: ['ruby_staff', 'diamond_rod'],
                    crystal_armor: ['sapphire_mail', 'emerald_vest'],
                    wealth_ring: ['gold_ring', 'treasure_band'],

                    // Giant/massive equipment
                    giant_club: ['ogre_club', 'troll_mace'],
                    troll_armor: ['giant_hide', 'colossal_plate'],
                    strength_gauntlets: ['titan_gloves', 'power_gauntlets'],

                    // Fire/flame equipment
                    flame_cloak: ['fire_robe', 'ember_cloak'],
                    heat_armor: ['flame_mail', 'inferno_plate'],
                    fire_amulet: ['flame_pendant', 'ember_charm'],
                    salamander_armor: ['fire_scale_mail', 'heat_resistant_vest'],
                    flame_sword: ['fire_blade', 'ember_sword'],
                    heat_shield: ['flame_guard', 'fire_barrier'],

                    // Volcanic equipment
                    molten_armor: ['lava_plate', 'magma_mail'],
                    lava_gauntlets: ['molten_gloves', 'volcanic_fists'],
                    volcanic_shield: ['lava_guard', 'magma_barrier'],

                    // Dragon equipment
                    wyvern_armor: ['dragon_scale_mail', 'winged_plate'],
                    sky_rider_helm: ['dragon_helm', 'wind_crown'],
                    wind_blade: ['storm_sword', 'gale_blade'],
                    dragonfire_armor: ['flame_dragon_mail', 'inferno_scale'],
                    flame_claw_gauntlets: ['dragon_claws', 'fire_talons'],
                    drake_crown: ['dragon_circlet', 'flame_crown'],

                    // Forest/nature themed gear
                    wooden_staff: ['oak_staff', 'willow_wand'],
                    leaf_armor: ['bark_mail', 'thorn_vest'],
                    nature_ring: ['grove_ring', 'forest_band'],
                    forest_cloak: ['leaf_cloak', 'camouflage_robe'],
                    tracking_boots: ['hunter_boots', 'trail_boots'],
                    survival_kit: ['wilderness_pack', 'ranger_kit'],

                    // Hunter equipment
                    hunter_cloak: ['predator_cloak', 'stalker_robe'],
                    tracking_gear: ['hunter_kit', 'tracker_tools'],
                    predator_weapons: ['hunting_spear', 'tracker_bow'],

                    // Travel gear
                    riding_boots: ['horseman_boots', 'traveler_boots'],
                    travel_cloak: ['journey_robe', 'wanderer_cloak'],
                    plains_gear: ['grassland_kit', 'nomad_pack'],

                    // Altitude gear
                    altitude_gear: ['high_altitude_pack', 'mountain_gear'],
                    climbing_rope: ['silk_rope', 'steel_cable'],

                    // Crystal/gem weapons
                    crystal_sword: ['quartz_blade', 'gem_sword'],
                    gem_armor: ['crystal_mail', 'jeweled_plate'],
                    power_amulet: ['energy_pendant', 'force_charm'],

                    // Fire gear variations
                    fire_armor: ['flame_plate', 'heat_mail'],
                    fire_shield: ['flame_buckler', 'heat_guard'],
                    flame_weapons: ['fire_sword', 'ember_spear'],

                    // Elite equipment
                    dragonslayer_weapons: ['dragon_bane_sword', 'wyvern_killer_spear'],
                    dragon_armor: ['dragon_plate', 'scale_mail_legendary'],
                    fire_artifacts: ['flame_relic', 'ember_artifact'],

                    // Nature/spirit gear
                    nature_staff: ['spirit_staff', 'grove_wand'],
                    grove_robes: ['forest_vestments', 'nature_robe'],
                    spirit_amulet: ['nature_pendant', 'grove_charm'],

                    // Ancient equipment
                    relic_sword: ['ancient_blade', 'forgotten_sword'],
                    ancient_armor: ['relic_plate', 'timeless_mail'],
                    timeless_artifacts: ['eternal_relic', 'ageless_artifact'],

                    // Scholar equipment
                    scholar_robes: ['academic_vestments', 'learned_robe'],
                    wisdom_staff: ['knowledge_staff', 'sage_rod'],
                    knowledge_crystal: ['wisdom_gem', 'learning_orb'],

                    // Master equipment
                    battle_armor: ['veteran_plate', 'master_mail'],
                    master_weapons: ['expert_sword', 'master_blade'],
                    warrior_accessories: ['battle_ring', 'combat_amulet'],

                    // Grandmaster equipment
                    grandmaster_weapons: ['legendary_blade', 'ultimate_sword'],
                    legendary_armor: ['mythic_plate', 'ultimate_mail'],
                    champion_artifacts: ['victory_relic', 'triumph_artifact'],

                    // Shadow/void equipment
                    shadow_weapons: ['void_blade', 'darkness_sword'],
                    void_armor: ['shadow_plate', 'darkness_mail'],
                    darkness_regalia: ['void_crown', 'shadow_artifacts']
                };

                let candidates = [];
                for (const key of lootEntry.equipmentTypes) {
                    if (equipmentMap[key]) {
                        candidates = candidates.concat(equipmentMap[key]);
                    }
                }

                if (candidates.length > 0) {
                    if (typeof ItemData !== 'undefined' && typeof ItemData.getItem === 'function') {
                        const valid = candidates.filter(id => !!ItemData.getItem(id));
                        if (valid.length > 0) {
                            return valid[Math.floor(Math.random() * valid.length)];
                        }
                    }
                    return candidates[Math.floor(Math.random() * candidates.length)];
                }
            }

            // 3) Handle when itemType itself is an abstract umbrella (e.g., 'nature_equipment')
            if (typeof lootEntry.itemType === 'string') {
                const abstractMaps = {
                    // Basic equipment types (expanded)
                    nature_equipment: ['oak_staff', 'leather_armor', 'nature_charm', 'ranger_cloak', 'hunting_bow', 'cloth_robe'],
                    forest_equipment: ['oak_staff', 'leather_armor', 'ranger_cloak', 'hunting_bow', 'nature_charm'],
                    beginner_weapon: ['iron_sword', 'steel_dagger', 'oak_staff', 'hunting_bow', 'battle_axe'],
                    beginner_armor: ['leather_armor', 'cloth_robe', 'leather_vest'],
                    beginner_equipment: ['iron_sword', 'oak_staff', 'steel_dagger', 'leather_armor', 'cloth_robe', 'health_ring'],

                    // Class-specific equipment sets
                    knight_equipment: ['iron_sword', 'steel_sword', 'chain_mail', 'plate_armor'],
                    wizard_equipment: ['oak_staff', 'crystal_staff', 'cloth_robe', 'mage_robes'],
                    rogue_equipment: ['steel_dagger', 'poisoned_blade', 'leather_armor', 'leather_vest'],
                    ranger_equipment: ['hunting_bow', 'elvish_bow', 'ranger_cloak'],
                    warrior_equipment: ['battle_axe', 'great_axe', 'scale_mail'],
                    paladin_equipment: ['blessed_mace', 'steel_sword', 'plate_armor'],

                    // Themed equipment sets (using existing items from ItemData)
                    beast_equipment: ['leather_armor', 'ranger_cloak', 'hunting_bow'],
                    leadership_equipment: ['steel_sword', 'plate_armor', 'strength_band'],
                    speed_equipment: ['leather_vest', 'hunting_bow', 'steel_dagger'],
                    wind_equipment: ['ranger_cloak', 'elvish_bow', 'leather_vest'],
                    hardy_equipment: ['scale_mail', 'battle_axe', 'strength_band'],
                    defensive_equipment: ['plate_armor', 'chain_mail', 'health_ring'],
                    dark_equipment: ['stealth_cloak', 'poisoned_blade', 'leather_vest'],
                    magical_equipment: ['crystal_staff', 'mage_robes', 'mana_crystal'],
                    gem_equipment: ['crystal_staff', 'mana_crystal', 'nature_charm'],
                    giant_equipment: ['great_axe', 'battle_axe', 'strength_band'],
                    flame_equipment: ['steel_sword', 'iron_sword', 'chain_mail'],
                    fire_equipment: ['steel_sword', 'iron_sword', 'plate_armor'],
                    volcanic_equipment: ['great_axe', 'battle_axe', 'scale_mail'],
                    dragon_equipment: ['crystal_staff', 'elvish_bow', 'mage_robes'],
                    draconic_equipment: ['crystal_staff', 'elvish_bow', 'plate_armor'],

                    // Equipment by tier/quality
                    basic_weapon: ['iron_sword', 'oak_staff', 'steel_dagger', 'hunting_bow'],
                    advanced_weapon: ['steel_sword', 'crystal_staff', 'poisoned_blade', 'elvish_bow'],
                    master_weapon: ['crystal_staff', 'elvish_bow', 'great_axe'],

                    // Material-based equipment (using real items)
                    leather_equipment: ['leather_armor', 'leather_vest'],
                    metal_equipment: ['iron_sword', 'steel_sword', 'chain_mail', 'plate_armor'],
                    crystal_equipment: ['crystal_staff', 'mana_crystal'],
                    stealth_gear: ['stealth_cloak', 'poisoned_blade', 'leather_vest'],

                    // Abstract item types for areas and tutorials
                    tutorial_items: ['health_potion', 'repair_kit', 'healing_herb'],
                    village_supplies: ['health_potion', 'mana_potion', 'repair_kit', 'healing_herb']
                };
                const list = abstractMaps[lootEntry.itemType];
                if (Array.isArray(list) && list.length > 0) {
                    if (typeof ItemData !== 'undefined' && typeof ItemData.getItem === 'function') {
                        const valid = list.filter(id => !!ItemData.getItem(id));
                        if (valid.length > 0) return valid[Math.floor(Math.random() * valid.length)];
                    }
                    return list[Math.floor(Math.random() * list.length)];
                }
            }

            return null;
        } catch (e) {
            console.warn('Failed to resolve concrete item id for loot entry:', lootEntry, e);
            return null;
        }
    },

    /**
     * Enhanced equipment selection with upgrade path logic
     * Ensures smooth progression between level tiers and class-appropriate items
     */
    selectLevelAppropriateEquipment: function(playerLevel, contentLevel, playerClass = null, itemCategory = null) {
        try {
            if (typeof EquipmentData === 'undefined') return null;

            // Get player class from GameState if not provided
            if (!playerClass && typeof GameState !== 'undefined' && GameState.player && GameState.player.class) {
                playerClass = GameState.player.class;
            }

            // Define level progression tiers for equipment
            const levelTiers = {
                beginner: { min: 1, max: 4, weight: 1.0 },
                early: { min: 2, max: 7, weight: 0.9 },
                mid: { min: 5, max: 12, weight: 0.8 },
                advanced: { min: 8, max: 18, weight: 0.7 },
                expert: { min: 15, max: 25, weight: 0.6 },
                master: { min: 20, max: 30, weight: 0.5 }
            };

            // Determine target level for equipment selection (slight randomization for variety)
            const effectiveLevel = Math.max(1, Math.floor(playerLevel + (Math.random() * 4 - 2)));

            // Get all available equipment
            const availableEquipment = [];
            const categories = itemCategory ? [itemCategory] : ['weapons', 'armor', 'accessories'];

            categories.forEach(category => {
                if (!EquipmentData[category]) return;

                Object.entries(EquipmentData[category]).forEach(([itemId, item]) => {
                    // Level requirement check with upgrade path logic
                    const levelReq = item.levelRequirement || 1;
                    const levelDiff = Math.abs(effectiveLevel - levelReq);

                    // Allow items slightly above/below target level for progression
                    if (levelReq <= effectiveLevel + 3 && levelReq >= Math.max(1, effectiveLevel - 2)) {
                        // Class compatibility check
                        let classWeight = 1.0;
                        if (playerClass && item.classRequirements) {
                            if (item.classRequirements.includes(playerClass)) {
                                classWeight = 2.5; // Strong preference for class-compatible items
                            } else {
                                classWeight = 0.3; // Reduced chance for incompatible items
                            }
                        }

                        // Level appropriateness weight (closer to target level = higher weight)
                        const levelWeight = Math.max(0.1, 1.0 - (levelDiff * 0.15));

                        // Rarity progression weight (higher levels favor better rarities)
                        let rarityWeight = 1.0;
                        const rarity = item.rarity || 'common';
                        if (effectiveLevel >= 15) {
                            // High level favors rare+ items
                            rarityWeight = rarity === 'legendary' ? 1.5 : rarity === 'epic' ? 1.3 : rarity === 'rare' ? 1.1 : 0.8;
                        } else if (effectiveLevel >= 8) {
                            // Mid level favors uncommon+ items
                            rarityWeight = rarity === 'rare' ? 1.4 : rarity === 'uncommon' ? 1.2 : rarity === 'common' ? 1.0 : 0.9;
                        } else {
                            // Low level favors common/uncommon items
                            rarityWeight = rarity === 'common' ? 1.3 : rarity === 'uncommon' ? 1.1 : 0.7;
                        }

                        const totalWeight = classWeight * levelWeight * rarityWeight;

                        availableEquipment.push({
                            id: itemId,
                            item: item,
                            category: category,
                            weight: totalWeight,
                            levelReq: levelReq,
                            levelDiff: levelDiff
                        });
                    }
                });
            });

            if (availableEquipment.length === 0) {
                // Fallback: return any basic equipment if no level-appropriate items found
                return this.getFallbackEquipment(playerClass, itemCategory);
            }

            // Weight-based selection for better upgrade paths
            const weights = availableEquipment.map(eq => eq.weight);
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);

            if (totalWeight <= 0) return null;

            let random = Math.random() * totalWeight;
            for (let i = 0; i < availableEquipment.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    return availableEquipment[i].id;
                }
            }

            // Fallback to last item
            return availableEquipment[availableEquipment.length - 1].id;

        } catch (e) {
            console.warn('Failed to select level-appropriate equipment:', e);
            return null;
        }
    },

    /**
     * Fallback equipment selection for when no level-appropriate items are found
     */
    getFallbackEquipment: function(playerClass, itemCategory) {
        const fallbacks = {
            weapons: {
                knight: 'iron_sword',
                paladin: 'blessed_mace',
                warrior: 'battle_axe',
                wizard: 'oak_staff',
                rogue: 'steel_dagger',
                ranger: 'hunting_bow',
                default: 'iron_sword'
            },
            armor: {
                knight: 'leather_armor',
                paladin: 'leather_armor',
                warrior: 'leather_armor',
                wizard: 'cloth_robe',
                rogue: 'leather_vest',
                ranger: 'ranger_cloak',
                default: 'leather_armor'
            },
            accessories: {
                knight: 'strength_band',
                paladin: 'holy_symbol',
                warrior: 'strength_band',
                wizard: 'mana_crystal',
                rogue: 'health_ring',
                ranger: 'nature_charm',
                default: 'health_ring'
            }
        };

        if (itemCategory && fallbacks[itemCategory]) {
            return fallbacks[itemCategory][playerClass] || fallbacks[itemCategory].default;
        }

        // Random category if not specified
        const categories = Object.keys(fallbacks);
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        return fallbacks[randomCategory][playerClass] || fallbacks[randomCategory].default;
    },

    /**
     * Enhanced resolveConcreteItemId that uses upgrade path logic
     */
    resolveConcreteItemIdWithUpgradePath: function(lootEntry, playerLevel = 1, playerClass = null) {
        // First try enhanced consumable selection for consumable items\n        if (lootEntry.itemType && ['consumable', 'potion', 'healing_potion', 'mana_potion'].includes(lootEntry.itemType)) {\n            const selectedConsumable = this.selectLevelAppropriateConsumable(playerLevel, playerLevel, null, 'general');\n            if (selectedConsumable) return selectedConsumable;\n        }\n\n        // Try enhanced material selection for material items\n        if (lootEntry.itemType && ['material', 'crafting_material'].includes(lootEntry.itemType)) {\n            const selectedMaterial = this.selectCraftingAppropriateMaterial(playerLevel, playerLevel, null, null, {});\n            if (selectedMaterial) return selectedMaterial;\n        }\n\n        // Then try the enhanced equipment selection for equipment items
        if (lootEntry.itemType && ['weapon', 'armor', 'accessory', 'equipment'].includes(lootEntry.itemType)) {
            const categoryMap = {
                weapon: 'weapons',
                armor: 'armor',
                accessory: 'accessories',
                equipment: null // Any category
            };

            const selectedItem = this.selectLevelAppropriateEquipment(
                playerLevel,
                playerLevel,
                playerClass,
                categoryMap[lootEntry.itemType]
            );

            if (selectedItem) return selectedItem;
        }

        // For equipment types arrays, enhance with level filtering
        if (Array.isArray(lootEntry.equipmentTypes) && lootEntry.equipmentTypes.length > 0) {
            // Try level-appropriate selection first
            for (const equipType of lootEntry.equipmentTypes) {
                if (['beginner_weapons', 'knight_weapons', 'wizard_weapons', 'rogue_weapons', 'ranger_weapons', 'warrior_weapons', 'paladin_weapons'].includes(equipType)) {
                    const selected = this.selectLevelAppropriateEquipment(playerLevel, playerLevel, playerClass, 'weapons');
                    if (selected) return selected;
                } else if (['beginner_armor', 'knight_armor', 'wizard_armor', 'rogue_armor', 'ranger_armor', 'warrior_armor'].includes(equipType)) {
                    const selected = this.selectLevelAppropriateEquipment(playerLevel, playerLevel, playerClass, 'armor');
                    if (selected) return selected;
                }
            }
        }

        // Fallback to original logic
        return this.resolveConcreteItemId(lootEntry);
    },

    /**
     * Enhanced consumable distribution system for learning curve and strategic depth
     * Provides level-appropriate consumables that teach strategic usage patterns
     */
    selectLevelAppropriateConsumable: function(playerLevel, contentLevel, areaName = null, encounterType = 'general') {
        try {
            if (typeof ItemData === 'undefined') return null;

            // Define learning curve phases for consumable distribution
            const learningPhases = {
                discovery: { min: 1, max: 4, focus: 'basic_survival' },
                foundation: { min: 3, max: 8, focus: 'tactical_basics' },
                development: { min: 6, max: 15, focus: 'strategic_depth' },
                mastery: { min: 12, max: 25, focus: 'advanced_tactics' },
                endgame: { min: 20, max: 30, focus: 'optimization' }
            };

            // Determine current phase
            let currentPhase = 'discovery';
            for (const [phase, data] of Object.entries(learningPhases)) {
                if (playerLevel >= data.min && playerLevel <= data.max) {
                    currentPhase = phase;
                    break;
                }
            }

            // Strategic consumable categories by learning phase
            const phaseConsumables = {
                discovery: {
                    // Focus: Basic survival and understanding consumables exist
                    primary: ['health_potion', 'mana_potion', 'antidote'],
                    secondary: ['torch', 'rope'],
                    weights: { healing: 0.5, restoration: 0.3, cure: 0.15, utility: 0.05 }
                },
                foundation: {
                    // Focus: Introduce tactical options and resource management
                    primary: ['health_potion', 'mana_potion', 'hi_potion', 'strength_potion'],
                    secondary: ['antidote', 'torch', 'monster_repel', 'experience_booster'],
                    weights: { healing: 0.35, restoration: 0.25, enhancement: 0.25, utility: 0.1, cure: 0.05 }
                },
                development: {
                    // Focus: Strategic depth with buffs, debuffs, and encounter control
                    primary: ['hi_potion', 'strength_potion', 'defense_elixir', 'speed_tonic'],
                    secondary: ['mana_potion', 'monster_bait', 'monster_repel', 'lucky_charm'],
                    weights: { enhancement: 0.4, healing: 0.25, utility: 0.2, restoration: 0.15 }
                },
                mastery: {
                    // Focus: Advanced tactical combinations and encounter manipulation
                    primary: ['elixir', 'magic_amplifier', 'lucky_charm', 'speed_tonic'],
                    secondary: ['phoenix_down', 'teleport_crystal', 'experience_booster'],
                    weights: { enhancement: 0.45, restoration: 0.25, utility: 0.2, revival: 0.1 }
                },
                endgame: {
                    // Focus: Optimization and rare/powerful consumables
                    primary: ['elixir', 'phoenix_down', 'magic_amplifier', 'teleport_crystal'],
                    secondary: ['lucky_charm', 'experience_booster'],
                    weights: { restoration: 0.4, revival: 0.25, enhancement: 0.25, utility: 0.1 }
                }
            };

            // Area-specific consumable modifiers for strategic depth
            const areaModifiers = {
                forest: { utility: 1.3, healing: 1.2 }, // More torches and healing herbs
                dungeon: { utility: 1.5, enhancement: 1.2 }, // Light sources and buffs important
                desert: { restoration: 1.4, cure: 1.3 }, // Water/mana and poison cures
                mountains: { enhancement: 1.3, utility: 1.2 }, // Strength/endurance focus
                swamp: { cure: 2.0, utility: 1.3 }, // High poison cure need
                ruins: { restoration: 1.2, enhancement: 1.3 }, // Mana and magical buffs
                town: { healing: 0.8, utility: 1.5 }, // Less combat items, more utility
                cave: { utility: 1.6, enhancement: 1.1 }, // Light sources critical
                default: { healing: 1.0, restoration: 1.0, enhancement: 1.0, utility: 1.0, cure: 1.0, revival: 1.0 }
            };

            // Encounter-specific adjustments for strategic learning
            const encounterModifiers = {
                boss: { enhancement: 1.8, restoration: 1.5, revival: 2.0 }, // Prep for big fights
                group: { enhancement: 1.4, restoration: 1.3 }, // Multiple enemies = more resources
                rare: { enhancement: 1.6, utility: 1.4 }, // Rare encounters reward preparation
                elite: { enhancement: 1.5, restoration: 1.3, revival: 1.5 },
                general: { healing: 1.0, restoration: 1.0, enhancement: 1.0, utility: 1.0, cure: 1.0, revival: 1.0 }
            };

            // Get phase-appropriate consumables
            const phaseData = phaseConsumables[currentPhase];
            const availableConsumables = [...phaseData.primary, ...phaseData.secondary];

            // Get area and encounter modifiers
            const areaKey = areaName ? areaName.toLowerCase() : 'default';
            const areaMods = areaModifiers[areaKey] || areaModifiers.default;
            const encounterMods = encounterModifiers[encounterType] || encounterModifiers.general;

            // Build weighted selection based on ItemData
            const candidateItems = [];

            if (typeof ItemData.getAllItems === 'function') {
                const allItems = ItemData.getAllItems();

                availableConsumables.forEach(itemId => {
                    const item = allItems[itemId];
                    if (!item || item.type !== 'consumable') return;

                    const category = item.category || 'healing';
                    let baseWeight = phaseData.weights[category] || 0.1;

                    // Apply area and encounter modifiers
                    const areaMultiplier = areaMods[category] || 1.0;
                    const encounterMultiplier = encounterMods[category] || 1.0;

                    // Level appropriateness (prevent too-powerful items early)
                    let levelWeight = 1.0;
                    if (item.requirements && item.requirements.level) {
                        const levelDiff = item.requirements.level - playerLevel;
                        if (levelDiff > 3) {
                            levelWeight = 0.1; // Much less likely to get future items
                        } else if (levelDiff > 0) {
                            levelWeight = 0.7; // Slightly less likely to get higher-level items
                        }
                    }

                    // Rarity-based availability for learning curve
                    let rarityWeight = 1.0;
                    const rarity = item.rarity || 'common';
                    if (currentPhase === 'discovery' || currentPhase === 'foundation') {
                        // Early game: prefer common/uncommon
                        rarityWeight = rarity === 'common' ? 1.2 : rarity === 'uncommon' ? 0.8 : 0.3;
                    } else if (currentPhase === 'development') {
                        // Mid game: balanced distribution
                        rarityWeight = rarity === 'uncommon' ? 1.3 : rarity === 'rare' ? 1.0 : 0.9;
                    } else {
                        // Late game: prefer higher rarities
                        rarityWeight = rarity === 'rare' ? 1.4 : rarity === 'epic' ? 1.2 : rarity === 'legendary' ? 1.0 : 0.7;
                    }

                    const totalWeight = baseWeight * areaMultiplier * encounterMultiplier * levelWeight * rarityWeight;

                    if (totalWeight > 0) {
                        candidateItems.push({
                            id: itemId,
                            item: item,
                            weight: totalWeight,
                            category: category,
                            phase: currentPhase
                        });
                    }
                });
            }

            if (candidateItems.length === 0) {
                return this.getFallbackConsumable(currentPhase);
            }

            // Weight-based selection
            const weights = candidateItems.map(item => item.weight);
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);

            if (totalWeight <= 0) return null;

            let random = Math.random() * totalWeight;
            for (let i = 0; i < candidateItems.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    return candidateItems[i].id;
                }
            }

            // Fallback to last item
            return candidateItems[candidateItems.length - 1].id;

        } catch (e) {
            console.warn('Failed to select level-appropriate consumable:', e);
            return 'health_potion'; // Safe fallback
        }
    },

    /**
     * Fallback consumable selection for learning phases
     */
    getFallbackConsumable: function(phase) {
        const fallbacks = {
            discovery: 'health_potion',
            foundation: 'mana_potion',
            development: 'hi_potion',
            mastery: 'elixir',
            endgame: 'phoenix_down'
        };
        return fallbacks[phase] || 'health_potion';
    },

    /**
     * Enhanced consumable generation with strategic depth support
     */
    generateConsumableItem: function(itemType, rarity, playerLevel, contentLevel, areaName, encounterType = 'general') {
        // First try strategic consumable selection
        if (itemType === 'consumable' || itemType === 'potion' || itemType === 'healing_potion' || itemType === 'mana_potion') {
            const selectedConsumable = this.selectLevelAppropriateConsumable(playerLevel, contentLevel, areaName, encounterType);
            if (selectedConsumable) {
                itemType = selectedConsumable;
            }
        }

        // Generate the base item using existing logic
        const baseItem = this.getBaseItemTemplate(itemType);
        if (!baseItem) return null;

        const item = { ...baseItem };

        // Add dynamic properties for strategic depth
        this.enhanceConsumableForLearning(item, playerLevel, rarity, areaName);

        // Standard loot generation finalization
        item.id = this.generateItemId();
        item.rarity = rarity;
        item.level = Math.max(1, Math.min(playerLevel + 2, contentLevel + 1));

        return item;
    },

    /**
     * Enhance consumables with learning-curve appropriate properties
     */
    enhanceConsumableForLearning: function(item, playerLevel, rarity, areaName) {
        if (!item || item.type !== 'consumable') return;

        // Quantity scaling for strategic resource management
        if (item.category === 'healing' || item.category === 'restoration') {
            // Early game: more generous quantities to teach usage
            if (playerLevel <= 5) {
                item.quantity = Math.ceil((item.quantity || 1) * 1.5);
            } else if (playerLevel <= 10) {
                item.quantity = Math.ceil((item.quantity || 1) * 1.2);
            } else {
                item.quantity = item.quantity || 1;
            }
        }

        // Value scaling for economic learning
        if (item.value) {
            const levelMultiplier = Math.max(0.5, Math.min(2.0, 1.0 + (playerLevel - 1) * 0.05));
            item.value = Math.floor(item.value * levelMultiplier);
        }

        // Rarity-based enhancements for progression feeling
        if (rarity === 'uncommon' && (item.effect && item.effect.amount)) {
            item.effect.amount = Math.floor(item.effect.amount * 1.1);
        } else if (rarity === 'rare' && (item.effect && item.effect.amount)) {
            item.effect.amount = Math.floor(item.effect.amount * 1.25);
        } else if (rarity === 'epic' && (item.effect && item.effect.amount)) {
            item.effect.amount = Math.floor(item.effect.amount * 1.5);
        }

        // Add strategic hints in descriptions for learning
        if (playerLevel <= 8 && item.category === 'enhancement') {
            item.learningHint = "Tip: Use before tough battles for maximum effect!";
        } else if (playerLevel <= 6 && item.category === 'utility') {
            item.learningHint = "Tip: These items can change how you explore!";
        }
    },

    /**
     * Enhanced material drop system for future crafting system integration
     * Provides area-appropriate and monster-specific materials with crafting depth
     */
    selectCraftingAppropriateMaterial: function(playerLevel, contentLevel, areaName = null, monsterType = null, encounterContext = {}) {
        try {
            if (typeof ItemData === 'undefined') return null;

            // Define material categories and their strategic purposes
            const materialCategories = {
                // Basic materials for early crafting learning
                basic: {
                    items: ['iron_ore', 'healing_herb', 'oak_branch', 'pine_sap', 'slime_gel'],
                    purpose: 'foundational_crafting',
                    phases: ['discovery', 'foundation'],
                    areas: ['forest', 'grassland', 'cave', 'village']
                },
                // Monster-derived materials for equipment enhancement
                monster_parts: {
                    items: ['goblin_tooth', 'wolf_fang', 'wolf_pelt', 'orc_tusk', 'dragon_scale', 'dragon_heart'],
                    purpose: 'equipment_enhancement',
                    phases: ['foundation', 'development', 'mastery'],
                    areas: ['dungeon', 'cave', 'mountain', 'ruins']
                },
                // Natural materials for alchemy and consumables
                natural: {
                    items: ['healing_herb', 'mana_flower', 'forest_crystal', 'pine_sap', 'oak_branch'],
                    purpose: 'alchemy_brewing',
                    phases: ['discovery', 'foundation', 'development'],
                    areas: ['forest', 'swamp', 'grassland', 'grove']
                },
                // Mineral materials for high-tier equipment
                minerals: {
                    items: ['iron_ore', 'quartz_crystal', 'amethyst_shard', 'mithril_ore', 'adamantine_crystal'],
                    purpose: 'equipment_crafting',
                    phases: ['foundation', 'development', 'mastery', 'endgame'],
                    areas: ['cave', 'mountain', 'dungeon', 'mines']
                },
                // Magical materials for spell enhancement
                magical: {
                    items: ['mana_essence', 'crystal_essence', 'dragon_essence', 'time_relic'],
                    purpose: 'spell_enhancement',
                    phases: ['development', 'mastery', 'endgame'],
                    areas: ['ruins', 'tower', 'sanctuary', 'lair']
                }
            };

            // Area-specific material distributions for crafting themes
            const areaMaterialThemes = {
                forest: {
                    primary: ['healing_herb', 'oak_branch', 'pine_sap', 'mana_flower'],
                    secondary: ['forest_crystal', 'wolf_pelt', 'wolf_fang'],
                    theme: 'nature_alchemy',
                    bonusMultiplier: 1.8
                },
                cave: {
                    primary: ['iron_ore', 'quartz_crystal', 'slime_gel'],
                    secondary: ['amethyst_shard', 'goblin_tooth'],
                    theme: 'mining_crafting',
                    bonusMultiplier: 2.0
                },
                mountain: {
                    primary: ['iron_ore', 'mithril_ore', 'quartz_crystal'],
                    secondary: ['orc_tusk', 'amethyst_shard'],
                    theme: 'metalworking',
                    bonusMultiplier: 1.7
                },
                swamp: {
                    primary: ['healing_herb', 'mana_flower', 'slime_gel'],
                    secondary: ['goblin_tooth', 'pine_sap'],
                    theme: 'alchemy_brewing',
                    bonusMultiplier: 1.6
                },
                dungeon: {
                    primary: ['orc_tusk', 'goblin_tooth', 'iron_ore'],
                    secondary: ['quartz_crystal', 'mana_essence'],
                    theme: 'combat_enhancement',
                    bonusMultiplier: 1.5
                },
                ruins: {
                    primary: ['mana_essence', 'crystal_essence', 'quartz_crystal'],
                    secondary: ['amethyst_shard', 'time_relic'],
                    theme: 'magical_research',
                    bonusMultiplier: 1.9
                },
                dragon_lair: {
                    primary: ['dragon_scale', 'dragon_heart', 'dragon_essence'],
                    secondary: ['mithril_ore', 'adamantine_crystal'],
                    theme: 'legendary_crafting',
                    bonusMultiplier: 3.0
                },
                default: {
                    primary: ['iron_ore', 'healing_herb', 'slime_gel'],
                    secondary: ['oak_branch', 'goblin_tooth'],
                    theme: 'general_crafting',
                    bonusMultiplier: 1.0
                }
            };

            // Monster-specific material drops for authentic sourcing
            const monsterMaterialDrops = {
                slime: ['slime_gel', 'mana_essence'],
                goblin: ['goblin_tooth', 'iron_ore', 'pine_sap'],
                wolf: ['wolf_fang', 'wolf_pelt', 'healing_herb'],
                orc: ['orc_tusk', 'iron_ore', 'quartz_crystal'],
                dragon: ['dragon_scale', 'dragon_heart', 'dragon_essence', 'mithril_ore'],
                elemental: ['crystal_essence', 'mana_essence', 'amethyst_shard'],
                undead: ['time_relic', 'crystal_essence', 'mana_essence'],
                beast: ['wolf_fang', 'wolf_pelt', 'healing_herb', 'oak_branch'],
                construct: ['iron_ore', 'quartz_crystal', 'mithril_ore'],
                default: ['iron_ore', 'healing_herb', 'slime_gel']
            };

            // Determine player progression phase for material complexity
            let craftingPhase = 'discovery';
            if (playerLevel >= 20) craftingPhase = 'endgame';
            else if (playerLevel >= 12) craftingPhase = 'mastery';
            else if (playerLevel >= 6) craftingPhase = 'development';
            else if (playerLevel >= 3) craftingPhase = 'foundation';

            // Get area theme and available materials
            const areaKey = areaName ? areaName.toLowerCase() : 'default';
            const areaTheme = areaMaterialThemes[areaKey] || areaMaterialThemes.default;

            // Build candidate materials list with strategic weighting
            const candidateMaterials = [];

            if (typeof ItemData.getAllItems === 'function') {
                const allItems = ItemData.getAllItems();

                // Helper function to add material with weight
                const addMaterialCandidate = (materialId, baseWeight, source) => {
                    const material = allItems[materialId];
                    if (!material || material.type !== 'material') return;

                    // Level appropriateness check
                    let levelWeight = 1.0;
                    const materialRarity = material.rarity || 'common';

                    // Prevent too-rare materials early, encourage progression
                    if (craftingPhase === 'discovery' && ['epic', 'legendary'].includes(materialRarity)) {
                        levelWeight = 0.1;
                    } else if (craftingPhase === 'foundation' && materialRarity === 'legendary') {
                        levelWeight = 0.3;
                    } else if (craftingPhase === 'development' && materialRarity === 'legendary') {
                        levelWeight = 0.6;
                    }

                    // Rarity progression weighting
                    let rarityWeight = 1.0;
                    if (craftingPhase === 'endgame') {
                        rarityWeight = materialRarity === 'legendary' ? 1.5 : materialRarity === 'epic' ? 1.3 : 0.8;
                    } else if (craftingPhase === 'mastery') {
                        rarityWeight = materialRarity === 'rare' ? 1.4 : materialRarity === 'epic' ? 1.1 : materialRarity === 'legendary' ? 0.7 : 1.0;
                    } else {
                        rarityWeight = materialRarity === 'common' ? 1.3 : materialRarity === 'uncommon' ? 1.1 : 0.7;
                    }

                    const totalWeight = baseWeight * levelWeight * rarityWeight;

                    if (totalWeight > 0) {
                        candidateMaterials.push({
                            id: materialId,
                            material: material,
                            weight: totalWeight,
                            source: source,
                            phase: craftingPhase,
                            rarity: materialRarity
                        });
                    }
                };

                // Add monster-specific materials (highest priority)
                if (monsterType) {
                    const monsterKey = monsterType.toLowerCase();
                    const monsterMaterials = monsterMaterialDrops[monsterKey] || monsterMaterialDrops.default;
                    monsterMaterials.forEach(materialId => {
                        addMaterialCandidate(materialId, 3.0, 'monster');
                    });
                }

                // Add area-primary materials (high priority)
                areaTheme.primary.forEach(materialId => {
                    addMaterialCandidate(materialId, 2.0 * areaTheme.bonusMultiplier, 'area_primary');
                });

                // Add area-secondary materials (medium priority)
                areaTheme.secondary.forEach(materialId => {
                    addMaterialCandidate(materialId, 1.0 * areaTheme.bonusMultiplier, 'area_secondary');
                });

                // Add phase-appropriate materials from categories
                Object.values(materialCategories).forEach(category => {
                    if (category.phases.includes(craftingPhase)) {
                        category.items.forEach(materialId => {
                            // Only add if not already added by area/monster
                            const alreadyAdded = candidateMaterials.some(cm => cm.id === materialId);
                            if (!alreadyAdded) {
                                addMaterialCandidate(materialId, 0.8, 'category');
                            }
                        });
                    }
                });
            }

            if (candidateMaterials.length === 0) {
                return this.getFallbackMaterial(craftingPhase);
            }

            // Weight-based selection for strategic distribution
            const weights = candidateMaterials.map(mat => mat.weight);
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);

            if (totalWeight <= 0) return null;

            let random = Math.random() * totalWeight;
            for (let i = 0; i < candidateMaterials.length; i++) {
                random -= weights[i];
                if (random <= 0) {
                    return candidateMaterials[i].id;
                }
            }

            // Fallback to last material
            return candidateMaterials[candidateMaterials.length - 1].id;

        } catch (e) {
            console.warn('Failed to select crafting-appropriate material:', e);
            return 'iron_ore'; // Safe fallback
        }
    },

    /**
     * Fallback material selection for crafting phases
     */
    getFallbackMaterial: function(phase) {
        const fallbacks = {
            discovery: 'healing_herb',
            foundation: 'iron_ore',
            development: 'quartz_crystal',
            mastery: 'mithril_ore',
            endgame: 'adamantine_crystal'
        };
        return fallbacks[phase] || 'iron_ore';
    },

    /**
     * Enhanced material generation with crafting system integration
     */
    generateMaterialItem: function(itemType, rarity, playerLevel, contentLevel, areaName, monsterType = null) {
        // First try strategic material selection
        if (itemType === 'material' || itemType === 'crafting_material') {
            const selectedMaterial = this.selectCraftingAppropriateMaterial(
                playerLevel,
                contentLevel,
                areaName,
                monsterType,
                { encounterType: 'material_drop' }
            );
            if (selectedMaterial) {
                itemType = selectedMaterial;
            }
        }

        // Generate the base item using existing logic
        const baseItem = this.getBaseItemTemplate(itemType);
        if (!baseItem) return null;

        const item = { ...baseItem };

        // Add crafting-specific enhancements
        this.enhanceMaterialForCrafting(item, playerLevel, rarity, areaName, monsterType);

        // Standard loot generation finalization
        item.id = this.generateItemId();
        item.rarity = rarity;
        item.level = Math.max(1, Math.min(playerLevel + 3, contentLevel + 2));

        return item;
    },

    /**
     * Enhance materials with crafting-system appropriate properties
     */
    enhanceMaterialForCrafting: function(item, playerLevel, rarity, areaName, monsterType) {
        if (!item || item.type !== 'material') return;

        // Quantity scaling for resource management learning
        if (item.category === 'natural' || item.category === 'monster_part') {
            // Early game: more generous quantities to teach gathering
            if (playerLevel <= 5) {
                item.quantity = Math.ceil((item.quantity || 1) * 1.8);
            } else if (playerLevel <= 10) {
                item.quantity = Math.ceil((item.quantity || 1) * 1.4);
            } else if (playerLevel <= 15) {
                item.quantity = Math.ceil((item.quantity || 1) * 1.2);
            } else {
                item.quantity = item.quantity || 1;
            }
        }

        // Quality scaling based on area and rarity
        if (item.value) {
            let areaMultiplier = 1.0;
            if (areaName) {
                const areaKey = areaName.toLowerCase();
                const areaMultipliers = {
                    dragon_lair: 2.5,
                    ruins: 1.8,
                    cave: 1.6,
                    mountain: 1.5,
                    dungeon: 1.4,
                    forest: 1.2,
                    default: 1.0
                };
                areaMultiplier = areaMultipliers[areaKey] || areaMultipliers.default;
            }

            const levelMultiplier = Math.max(0.8, Math.min(2.0, 1.0 + (playerLevel - 1) * 0.03));
            item.value = Math.floor(item.value * areaMultiplier * levelMultiplier);
        }

        // Add crafting potential hints for learning
        if (playerLevel <= 10 && item.craftingUse) {
            const uses = Array.isArray(item.craftingUse) ? item.craftingUse.join(', ') : item.craftingUse;
            item.craftingHint = `Crafting uses: ${uses}`;
        }

        // Add source context for immersion
        if (monsterType) {
            item.sourceContext = `Obtained from ${monsterType}`;
        } else if (areaName) {
            item.sourceContext = `Found in ${areaName}`;
        }

        // Rarity-based enhancement for progression feeling
        if (rarity === 'uncommon' && item.craftingUse) {
            item.craftingBonus = 'Enhanced crafting potential (+10% success rate)';
        } else if (rarity === 'rare' && item.craftingUse) {
            item.craftingBonus = 'Superior crafting material (+25% quality bonus)';
        } else if (rarity === 'epic' && item.craftingUse) {
            item.craftingBonus = 'Masterwork crafting component (+50% enhancement)';
        } else if (rarity === 'legendary' && item.craftingUse) {
            item.craftingBonus = 'Legendary crafting essence (enables unique recipes)';
        }
    },

    addBonusProperties: function(item, tierInfo) {
        item.bonusProperties = item.bonusProperties || {};

        // Rare+ items get bonus properties based on item type
        const bonusTypes = {
            weapon: ['attack_bonus', 'critical_chance', 'accuracy_bonus'],
            armor: ['defense_bonus', 'magic_resistance', 'durability_bonus'],
            accessory: ['magic_power', 'mana_bonus', 'experience_bonus'],
            consumable: ['healing_boost', 'duration_bonus', 'stack_bonus']
        };

        const itemType = item.type || 'weapon';
        const availableBonuses = bonusTypes[itemType] || bonusTypes.weapon;
        const bonusType = availableBonuses[Math.floor(Math.random() * availableBonuses.length)];

        // Calculate bonus value based on rarity
        const bonusValue = (item.rarityLevel + 1) * 0.1; // 0.2 for rare, 0.3 for epic, etc.
        item.bonusProperties[bonusType] = bonusValue;
    },

    addSpecialEffects: function(item, tierInfo) {
        item.specialEffects = item.specialEffects || [];

        // Epic+ items get special effects
        const effects = ['elemental_damage', 'lifesteal', 'mana_steal', 'critical_boost'];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        item.specialEffects.push(effect);
    },

    addLegendaryProperties: function(item, tierInfo) {
        item.legendaryProperties = item.legendaryProperties || [];

        // Legendary items get unique properties
        const properties = ['set_bonus', 'unique_ability', 'legendary_aura', 'evolving_stats'];
        const property = properties[Math.floor(Math.random() * properties.length)];
        item.legendaryProperties.push(property);
    },

    /**
     * Apply area-specific bonuses to items
     */
    applyAreaSpecificBonuses: function(item, areaName) {
        const areaMap = {
            'forest': { nature_affinity: 0.1 },
            'mountain': { earth_resistance: 0.1 },
            'desert': { fire_resistance: 0.1 },
            'ice_cave': { ice_resistance: 0.1 }
        };

        const bonuses = areaMap[areaName];
        if (bonuses) {
            item.areaBonuses = bonuses;
        }
    },

    /**
     * Get monster loot configuration
     */
    getMonsterLootConfig: function(monsterName) {
        try {
            // Check if MonsterData is available
            if (typeof MonsterData === 'undefined' || !MonsterData.species) {
                console.warn('MonsterData not available, using fallback loot config');
                return this.getFallbackMonsterConfig(monsterName);
            }

            // Find monster in MonsterData
            const normalizedName = monsterName.toLowerCase().replace(/\s+/g, '_');
            console.log(`🔍 Looking for monster loot: "${monsterName}" -> "${normalizedName}"`);
            const monster = MonsterData.species[normalizedName];

            if (!monster) {
                console.warn(`Monster not found in data: ${monsterName} (${normalizedName})`);
                return this.getFallbackMonsterConfig(monsterName);
            }

            if (!monster.lootTable) {
                console.warn(`No loot table found for monster: ${monsterName}`);
                return this.getFallbackMonsterConfig(monsterName);
            }

            console.log(`✅ Found loot table for ${monsterName}:`, monster.lootTable);

            // Convert MonsterData format to LootSystem format
            const config = {
                level: monster.lootTable.level || 1,
                lootTable: monster.lootTable.drops || [],
                goldRange: monster.lootTable.goldRange || [1, 5],
                experience: this.calculateBaseExperience(monster.lootTable.level || 1)
            };

            return config;

        } catch (error) {
            console.error('Error getting monster loot config:', error);
            return this.getFallbackMonsterConfig(monsterName);
        }
    },

    /**
     * Get fallback monster configuration
     */
    getFallbackMonsterConfig: function(monsterName) {
        // Basic fallback based on monster name patterns
        const level = this.estimateMonsterLevel(monsterName);

        return {
            level,
            goldRange: [level * 2, level * 6],
            lootTable: [
                {
                    itemType: 'material',
                    dropChance: 0.4,
                    rarityWeights: { common: 0.7, uncommon: 0.25, rare: 0.05 },
                    quantityRange: [1, 2]
                },
                {
                    itemType: 'potion',
                    dropChance: 0.25,
                    rarityWeights: { common: 0.8, uncommon: 0.2 },
                    quantityRange: [1, 1]
                }
            ]
        };
    },

    /**
     * Estimate monster level based on name patterns
     */
    estimateMonsterLevel: function(monsterName) {
        const name = monsterName.toLowerCase();

        if (name.includes('ancient') || name.includes('legendary') || name.includes('dragon')) {
            return 25 + Math.floor(Math.random() * 25); // 25-50
        } else if (name.includes('dire') || name.includes('alpha') || name.includes('greater')) {
            return 15 + Math.floor(Math.random() * 15); // 15-30
        } else if (name.includes('elite') || name.includes('war') || name.includes('giant')) {
            return 8 + Math.floor(Math.random() * 12); // 8-20
        } else {
            return 1 + Math.floor(Math.random() * 7); // 1-8
        }
    },

    /**
     * Calculate base experience reward for monster level
     */
    calculateBaseExperience: function(level) {
        return 20 + (level * 15);
    },

    /**
     * Get area loot configuration
     */
    getAreaLootConfig: function(areaName) {
        try {
            // Check if AreaData is available
            if (typeof AreaData === 'undefined' || !AreaData.areas) {
                console.warn('AreaData not available, using fallback area config');
                return this.getFallbackAreaConfig(areaName);
            }

            // Find area in AreaData
            const area = AreaData.areas[areaName.toLowerCase().replace(/\s+/g, '_')];
            if (!area || !area.lootTable) {
                console.warn(`No loot table found for area: ${areaName}`);
                return this.getFallbackAreaConfig(areaName);
            }

            // Convert AreaData format to LootSystem format
            const config = {
                recommendedLevel: area.lootTable.recommendedLevel || 1,
                lootTable: area.lootTable.drops || [],
                explorationType: area.lootTable.explorationType || 'standard',
                areaBonus: area.lootTable.areaBonus || {}
            };

            return config;

        } catch (error) {
            console.error('Error getting area loot config:', error);
            return this.getFallbackAreaConfig(areaName);
        }
    },

    /**
     * Get fallback area configuration
     */
    getFallbackAreaConfig: function(areaName) {
        // Basic fallback based on area name patterns
        const level = this.estimateAreaLevel(areaName);

        return {
            recommendedLevel: level,
            explorationType: 'standard',
            lootTable: [
                {
                    itemType: 'material',
                    dropChance: 0.3,
                    rarityWeights: { common: 0.8, uncommon: 0.15, rare: 0.05 },
                    quantityRange: [1, 2]
                }
            ],
            areaBonus: {
                goldMultiplier: 1.0,
                environmentType: 'unknown'
            }
        };
    },

    /**
     * Estimate area level based on name patterns
     */
    estimateAreaLevel: function(areaName) {
        const name = areaName.toLowerCase();

        if (name.includes('dragon') || name.includes('ancient') || name.includes('legendary')) {
            return 25 + Math.floor(Math.random() * 25); // 25-50
        } else if (name.includes('deep') || name.includes('volcanic') || name.includes('crystal')) {
            return 10 + Math.floor(Math.random() * 15); // 10-25
        } else if (name.includes('mountain') || name.includes('cave') || name.includes('dungeon')) {
            return 5 + Math.floor(Math.random() * 10); // 5-15
        } else {
            return 1 + Math.floor(Math.random() * 5); // 1-6
        }
    },

    /**
     * Performance test loot generation to ensure <50ms requirement
     */
    performanceTestLootGeneration: function(testConfig = {}) {
        const config = {
            iterations: testConfig.iterations || 100,
            monsterTests: testConfig.monsterTests || 50,
            areaTests: testConfig.areaTests || 50,
            maxAcceptableTime: testConfig.maxAcceptableTime || 50, // 50ms requirement
            verbose: testConfig.verbose || false
        };

        const results = {
            monsterLoot: [],
            areaLoot: [],
            summary: {},
            passed: true,
            issues: []
        };

        console.log(`🔬 Starting performance test: ${config.iterations} total iterations`);
        console.log(`📊 Target: <${config.maxAcceptableTime}ms per generation`);

        // Test monster loot generation performance
        for (let i = 0; i < config.monsterTests; i++) {
            const testResult = this.testMonsterLootPerformance(config);
            results.monsterLoot.push(testResult);

            if (testResult.time > config.maxAcceptableTime) {
                results.passed = false;
                results.issues.push(`Monster loot generation took ${testResult.time.toFixed(2)}ms (>${config.maxAcceptableTime}ms)`);
            }
        }

        // Test area loot generation performance
        for (let i = 0; i < config.areaTests; i++) {
            const testResult = this.testAreaLootPerformance(config);
            results.areaLoot.push(testResult);

            if (testResult.time > config.maxAcceptableTime) {
                results.passed = false;
                results.issues.push(`Area loot generation took ${testResult.time.toFixed(2)}ms (>${config.maxAcceptableTime}ms)`);
            }
        }

        // Calculate performance summary
        results.summary = this.calculatePerformanceSummary(results, config);

        // Log results
        this.logPerformanceResults(results, config);

        return results;
    },

    /**
     * Test monster loot generation performance
     */
    testMonsterLootPerformance: function(config) {
        // Use random test data
        const monsters = ['wolf', 'goblin', 'skeleton', 'orc', 'dragon'];
        const monster = monsters[Math.floor(Math.random() * monsters.length)];
        const playerLevel = 1 + Math.floor(Math.random() * 30);
        const area = 'test_area';

        const startTime = performance.now();

        try {
            const loot = this.generateMonsterLoot(monster, playerLevel, area);
            const endTime = performance.now();

            return {
                type: 'monster',
                monster,
                playerLevel,
                time: endTime - startTime,
                itemCount: loot.items ? loot.items.length : 0,
                gold: loot.gold || 0,
                success: true
            };
        } catch (error) {
            const endTime = performance.now();
            return {
                type: 'monster',
                monster,
                playerLevel,
                time: endTime - startTime,
                itemCount: 0,
                gold: 0,
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Test area loot generation performance
     */
    testAreaLootPerformance: function(config) {
        // Use random test data
        const areas = ['forest', 'cave', 'mountain', 'desert', 'swamp'];
        const explorationTypes = ['standard', 'thorough', 'quick', 'treasure_hunt'];

        const area = areas[Math.floor(Math.random() * areas.length)];
        const explorationType = explorationTypes[Math.floor(Math.random() * explorationTypes.length)];
        const playerLevel = 1 + Math.floor(Math.random() * 30);

        const startTime = performance.now();

        try {
            const loot = this.generateAreaLoot(area, playerLevel, explorationType);
            const endTime = performance.now();

            return {
                type: 'area',
                area,
                explorationType,
                playerLevel,
                time: endTime - startTime,
                itemCount: loot.items ? loot.items.length : 0,
                gold: loot.gold || 0,
                success: true
            };
        } catch (error) {
            const endTime = performance.now();
            return {
                type: 'area',
                area,
                explorationType,
                playerLevel,
                time: endTime - startTime,
                itemCount: 0,
                gold: 0,
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Calculate performance summary statistics
     */
    calculatePerformanceSummary: function(results, config) {
        const allTimes = [...results.monsterLoot, ...results.areaLoot]
            .filter(test => test.success)
            .map(test => test.time);

        if (allTimes.length === 0) {
            return {
                error: 'No successful tests to analyze'
            };
        }

        const sortedTimes = allTimes.sort((a, b) => a - b);

        return {
            totalTests: allTimes.length,
            successfulTests: allTimes.length,
            failedTests: results.monsterLoot.length + results.areaLoot.length - allTimes.length,
            averageTime: allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length,
            medianTime: sortedTimes[Math.floor(sortedTimes.length / 2)],
            minTime: Math.min(...allTimes),
            maxTime: Math.max(...allTimes),
            p95Time: sortedTimes[Math.floor(sortedTimes.length * 0.95)],
            p99Time: sortedTimes[Math.floor(sortedTimes.length * 0.99)],
            testsOverLimit: allTimes.filter(time => time > config.maxAcceptableTime).length,
            performanceGrade: this.calculatePerformanceGrade(allTimes, config.maxAcceptableTime)
        };
    },

    /**
     * Calculate performance grade based on test results
     */
    calculatePerformanceGrade: function(times, maxTime) {
        const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        const overLimitCount = times.filter(time => time > maxTime).length;
        const overLimitPercentage = (overLimitCount / times.length) * 100;

        if (overLimitPercentage === 0 && averageTime < maxTime * 0.5) {
            return 'A+'; // Excellent: No violations and average < 50% of limit
        } else if (overLimitPercentage < 5 && averageTime < maxTime * 0.7) {
            return 'A'; // Great: <5% violations and average < 70% of limit
        } else if (overLimitPercentage < 10 && averageTime < maxTime * 0.8) {
            return 'B'; // Good: <10% violations and average < 80% of limit
        } else if (overLimitPercentage < 20 && averageTime < maxTime) {
            return 'C'; // Acceptable: <20% violations and average within limit
        } else if (overLimitPercentage < 30) {
            return 'D'; // Poor: <30% violations
        } else {
            return 'F'; // Failed: >30% violations
        }
    },

    /**
     * Log performance test results
     */
    logPerformanceResults: function(results, config) {
        const summary = results.summary;

        console.log('\n📊 === LOOT GENERATION PERFORMANCE TEST RESULTS ===');
        console.log(`🎯 Target: <${config.maxAcceptableTime}ms per generation`);
        console.log(`📈 Grade: ${summary.performanceGrade}`);
        console.log(`✅ Tests passed: ${results.passed ? 'YES' : 'NO'}`);

        if (summary.error) {
            console.log(`❌ Error: ${summary.error}`);
            return;
        }

        console.log('\n📊 Timing Statistics:');
        console.log(`   Average: ${summary.averageTime.toFixed(2)}ms`);
        console.log(`   Median:  ${summary.medianTime.toFixed(2)}ms`);
        console.log(`   Min:     ${summary.minTime.toFixed(2)}ms`);
        console.log(`   Max:     ${summary.maxTime.toFixed(2)}ms`);
        console.log(`   95th %:  ${summary.p95Time.toFixed(2)}ms`);
        console.log(`   99th %:  ${summary.p99Time.toFixed(2)}ms`);

        console.log('\n📈 Test Summary:');
        console.log(`   Total tests: ${summary.totalTests}`);
        console.log(`   Successful:  ${summary.successfulTests}`);
        console.log(`   Failed:      ${summary.failedTests}`);
        console.log(`   Over limit:  ${summary.testsOverLimit} (${((summary.testsOverLimit/summary.totalTests)*100).toFixed(1)}%)`);

        if (results.issues.length > 0) {
            console.log('\n⚠️ Performance Issues:');
            results.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }

        // Recommendations based on performance
        if (summary.performanceGrade === 'F' || summary.performanceGrade === 'D') {
            console.log('\n🔧 Recommendations:');
            console.log('   - Consider optimizing loot generation algorithms');
            console.log('   - Review complex calculations in progression penalties');
            console.log('   - Implement additional caching for frequently accessed data');
            console.log('   - Consider reducing complexity of rarity calculations');
        } else if (summary.performanceGrade === 'C') {
            console.log('\n💡 Suggestions:');
            console.log('   - Monitor performance in production environments');
            console.log('   - Consider minor optimizations for edge cases');
        } else {
            console.log('\n🎉 Performance is excellent! No optimizations needed.');
        }

        console.log('\n=== END PERFORMANCE TEST ===\n');
    },

    /**
     * Quick performance check for CI/automated testing
     */
    quickPerformanceCheck: function() {
        const results = this.performanceTestLootGeneration({
            iterations: 20,
            monsterTests: 10,
            areaTests: 10,
            maxAcceptableTime: 50,
            verbose: false
        });

        return {
            passed: results.passed,
            grade: results.summary.performanceGrade,
            averageTime: results.summary.averageTime,
            maxTime: results.summary.maxTime,
            issues: results.issues
        };
    },

    /**
     * Get loot system statistics
     */
    getSystemStats: function() {
        return {
            rarityTiers: Object.keys(this.rarityTiers).length,
            lootCategories: Object.keys(this.lootCategories).length,
            cacheSize: {
                rarityRolls: this.lootCache?.rarityRolls?.size || 0,
                levelScaledItems: this.lootCache?.levelScaledItems?.size || 0,
                areaLoot: this.lootCache?.areaLoot?.size || 0
            },
            diminishingReturns: {
                monsterFarms: this.diminishingReturns?.monsterFarms?.size || 0,
                areaFarms: this.diminishingReturns?.areaFarms?.size || 0
            },
            initialized: !!this.lootCache
        };
    },

    /**
     * Track repeated farming for diminishing returns
     */
    trackFarmingActivity: function(contentType, contentId, playerLevel) {
        const now = Date.now();
        const farmingData = contentType === 'monster' ?
            this.diminishingReturns.monsterFarms :
            this.diminishingReturns.areaFarms;

        // Create key based on content and level range to prevent level-hop exploitation
        const levelTier = Math.floor(playerLevel / 5) * 5; // Group into 5-level tiers
        const farmingKey = `${contentId}_L${levelTier}`;

        if (!farmingData.has(farmingKey)) {
            farmingData.set(farmingKey, []);
        }

        const encounters = farmingData.get(farmingKey);

        // Clean old encounters outside the reset window
        const cutoffTime = now - this.diminishingReturns.resetInterval;
        const recentEncounters = encounters.filter(timestamp => timestamp > cutoffTime);

        // Add current encounter
        recentEncounters.push(now);
        farmingData.set(farmingKey, recentEncounters);

        return recentEncounters.length;
    },

    /**
     * Calculate diminishing returns multiplier
     */
    calculateDiminishingReturns: function(contentType, contentId, playerLevel) {
        const encounterCount = this.trackFarmingActivity(contentType, contentId, playerLevel);
        const thresholds = this.diminishingReturns.thresholds;

        if (encounterCount <= thresholds.minor) {
            return 1.0; // No penalty
        }

        let penalty = 0;

        if (encounterCount <= thresholds.moderate) {
            // Minor penalty: Linear reduction 5-15% for encounters 6-10
            const excessEncounters = encounterCount - thresholds.minor;
            penalty = 0.05 + (excessEncounters * 0.02); // 5% + 2% per excess encounter
        } else if (encounterCount <= thresholds.severe) {
            // Moderate penalty: 15-35% for encounters 11-20
            const baseMinorPenalty = 0.15;
            const excessEncounters = encounterCount - thresholds.moderate;
            penalty = baseMinorPenalty + (excessEncounters * 0.02); // 15% + 2% per excess encounter
        } else {
            // Severe penalty: Exponential growth beyond 20 encounters, capped at maxPenalty
            const baseModeratePenalty = 0.35;
            const excessEncounters = encounterCount - thresholds.severe;

            // Exponential growth: penalty increases rapidly but asymptotically approaches max
            const exponentialPenalty = 1 - Math.exp(-excessEncounters * 0.1);
            penalty = Math.min(
                this.diminishingReturns.maxPenalty,
                baseModeratePenalty + (exponentialPenalty * (this.diminishingReturns.maxPenalty - baseModeratePenalty))
            );
        }

        return Math.max(1 - penalty, 1 - this.diminishingReturns.maxPenalty);
    },

    /**
     * Get diminishing returns info for UI display
     */
    getDiminishingReturnsInfo: function(contentType, contentId, playerLevel) {
        const now = Date.now();
        const farmingData = contentType === 'monster' ?
            this.diminishingReturns.monsterFarms :
            this.diminishingReturns.areaFarms;

        const levelTier = Math.floor(playerLevel / 5) * 5;
        const farmingKey = `${contentId}_L${levelTier}`;

        if (!farmingData.has(farmingKey)) {
            return {
                encounterCount: 0,
                multiplier: 1.0,
                status: 'optimal',
                nextResetTime: null
            };
        }

        const encounters = farmingData.get(farmingKey);
        const cutoffTime = now - this.diminishingReturns.resetInterval;
        const recentEncounters = encounters.filter(timestamp => timestamp > cutoffTime);

        const multiplier = this.calculateDiminishingReturns(contentType, contentId, playerLevel);
        const thresholds = this.diminishingReturns.thresholds;

        let status = 'optimal';
        if (recentEncounters.length > thresholds.severe) {
            status = 'severe_penalty';
        } else if (recentEncounters.length > thresholds.moderate) {
            status = 'moderate_penalty';
        } else if (recentEncounters.length > thresholds.minor) {
            status = 'minor_penalty';
        }

        // Calculate when the oldest encounter will expire
        let nextResetTime = null;
        if (recentEncounters.length > 0) {
            const oldestEncounter = Math.min(...recentEncounters);
            nextResetTime = oldestEncounter + this.diminishingReturns.resetInterval;
        }

        return {
            encounterCount: recentEncounters.length,
            multiplier,
            status,
            nextResetTime
        };
    },

    // === Build Diversity Support System ===
    // Implements varied equipment and spell availability to support different character build paths
    // Prevents homogeneous gameplay by ensuring diverse loot options across encounters

    /**
     * Get build diversity preferences based on player profile and recent loot history
     * Analyzes player's current equipment and recent drops to promote build variety
     */
    getBuildDiversityPreferences: function(playerLevel, playerClass = null, recentLootHistory = [], currentEquipment = {}) {
        const diversityProfile = {
            // Base build archetypes to support
            supportedBuilds: this.getSupportedBuildArchetypes(playerLevel, playerClass),

            // Equipment categories that need more representation
            underrepresentedCategories: this.analyzeEquipmentGaps(currentEquipment, recentLootHistory),

            // Spell schools that could use more variety
            spellDiversityNeeds: this.analyzeSpellDiversity(currentEquipment, recentLootHistory, playerClass),

            // Build synergy opportunities
            synergyOpportunities: this.identifyBuildSynergies(currentEquipment, playerLevel, playerClass),

            // Diversity weighting preferences
            diversityWeights: this.calculateDiversityWeights(recentLootHistory, playerLevel)
        };

        return diversityProfile;
    },

    /**
     * Get supported build archetypes for the current player level and class
     */
    getSupportedBuildArchetypes: function(playerLevel, playerClass = null) {
        const baseBuilds = {
            // Universal build types available to all classes
            universal: [
                'balanced', 'defensive', 'offensive', 'utility'
            ],

            // Early game (1-10): Simple, focused builds
            early: {
                warrior: ['melee_damage', 'tank', 'weapon_specialist'],
                mage: ['elemental_damage', 'support_caster', 'scholar'],
                rogue: ['stealth', 'ranged_damage', 'skill_specialist'],
                cleric: ['healer', 'divine_warrior', 'support'],
                general: ['combat_focused', 'exploration_focused', 'resource_focused']
            },

            // Mid game (11-20): Hybrid and specialized builds
            mid: {
                warrior: ['berserker', 'paladin', 'weapon_master', 'guardian', 'duelist'],
                mage: ['elementalist', 'battlemage', 'enchanter', 'summoner', 'arcane_scholar'],
                rogue: ['assassin', 'ranger', 'trickster', 'shadow_dancer', 'treasure_hunter'],
                cleric: ['battle_cleric', 'divine_healer', 'protector', 'crusader', 'miracle_worker'],
                general: ['hybrid_specialist', 'area_master', 'artifact_collector', 'skill_diversifier']
            },

            // Late game (21-30+): Advanced and prestige builds
            late: {
                warrior: ['legend_warrior', 'immortal_guardian', 'weapon_saint', 'battle_lord', 'champion'],
                mage: ['archmage', 'elemental_lord', 'reality_bender', 'spell_weaver', 'cosmic_scholar'],
                rogue: ['shadow_master', 'phantom_lord', 'perfect_assassin', 'treasure_legend', 'skill_transcendent'],
                cleric: ['divine_avatar', 'miracle_saint', 'holy_warrior', 'celestial_guide', 'faith_incarnate'],
                general: ['transcendent_master', 'world_shaper', 'legend_collector', 'ultimate_hybrid']
            }
        };

        // Determine phase and return appropriate builds
        let phase = 'early';
        if (playerLevel >= 21) phase = 'late';
        else if (playerLevel >= 11) phase = 'mid';

        const availableBuilds = [...baseBuilds.universal];

        if (playerClass && baseBuilds[phase][playerClass]) {
            availableBuilds.push(...baseBuilds[phase][playerClass]);
        }

        // Add general builds for the phase
        if (baseBuilds[phase].general) {
            availableBuilds.push(...baseBuilds[phase].general);
        }

        return {
            phase,
            availableBuilds,
            recommendedCount: Math.min(3 + Math.floor(playerLevel / 5), availableBuilds.length)
        };
    },

    /**
     * Analyze current equipment to identify gaps in build diversity
     */
    analyzeEquipmentGaps: function(currentEquipment = {}, recentLootHistory = []) {
        const equipmentCategories = {
            weapons: ['sword', 'axe', 'mace', 'dagger', 'bow', 'staff', 'wand', 'spear'],
            armor: ['light_armor', 'medium_armor', 'heavy_armor', 'robes', 'leather'],
            accessories: ['ring', 'amulet', 'cloak', 'belt', 'boots', 'gloves'],
            tools: ['lockpicks', 'rope', 'torch', 'healing_kit', 'trap_kit'],
            consumables: ['potions', 'scrolls', 'food', 'reagents', 'ammunition']
        };

        const gaps = {
            underrepresented: [],
            missing: [],
            overrepresented: []
        };

        // Analyze current equipment distribution
        const currentDistribution = this.categorizeEquipment(currentEquipment);

        // Analyze recent loot history (last 20 items)
        const recentDistribution = this.categorizeRecentLoot(recentLootHistory.slice(-20));

        // Identify gaps and overrepresentation
        Object.keys(equipmentCategories).forEach(category => {
            const currentCount = currentDistribution[category] || 0;
            const recentCount = recentDistribution[category] || 0;
            const totalRelevant = currentCount + recentCount;

            // Expected distribution (should be roughly balanced)
            const expectedRatio = 1.0 / Object.keys(equipmentCategories).length;
            const actualRatio = totalRelevant / Math.max(1, Object.keys(currentEquipment).length + recentLootHistory.length);

            if (actualRatio < expectedRatio * 0.5) {
                gaps.underrepresented.push({
                    category,
                    deficit: expectedRatio - actualRatio,
                    priority: 'high'
                });
            } else if (actualRatio < expectedRatio * 0.8) {
                gaps.underrepresented.push({
                    category,
                    deficit: expectedRatio - actualRatio,
                    priority: 'medium'
                });
            } else if (actualRatio > expectedRatio * 1.5) {
                gaps.overrepresented.push({
                    category,
                    excess: actualRatio - expectedRatio,
                    reduceChance: true
                });
            }

            if (currentCount === 0 && recentCount === 0) {
                gaps.missing.push(category);
            }
        });

        return gaps;
    },

    /**
     * Analyze spell diversity to identify magical build opportunities
     */
    analyzeSpellDiversity: function(currentEquipment = {}, recentLootHistory = [], playerClass = null) {
        const spellSchools = {
            elemental: ['fire', 'ice', 'lightning', 'earth', 'air', 'water'],
            divine: ['healing', 'protection', 'blessing', 'smite', 'guidance'],
            arcane: ['enchantment', 'illusion', 'transmutation', 'divination', 'force'],
            nature: ['growth', 'animal', 'weather', 'plant', 'earth_magic'],
            shadow: ['stealth', 'fear', 'corruption', 'death', 'darkness'],
            utility: ['teleport', 'detect', 'repair', 'create', 'transform']
        };

        const diversity = {
            currentSchools: [],
            missingSchools: [],
            dominantSchools: [],
            recommendedExpansion: []
        };

        // Analyze current spell access
        const spellAccess = this.categorizeSpellAccess(currentEquipment, recentLootHistory);

        // Identify school representation
        Object.keys(spellSchools).forEach(school => {
            const schoolSpells = spellAccess.filter(spell =>
                spellSchools[school].some(type => spell.includes(type))
            );

            if (schoolSpells.length > 0) {
                diversity.currentSchools.push({
                    school,
                    spellCount: schoolSpells.length,
                    spells: schoolSpells
                });

                if (schoolSpells.length >= 3) {
                    diversity.dominantSchools.push(school);
                }
            } else {
                diversity.missingSchools.push(school);
            }
        });

        // Recommend expansion based on class and current gaps
        if (playerClass) {
            const classAffinities = this.getClassSpellAffinities(playerClass);
            diversity.recommendedExpansion = diversity.missingSchools
                .filter(school => classAffinities.includes(school))
                .concat(diversity.missingSchools.filter(school => !classAffinities.includes(school)).slice(0, 2));
        } else {
            // General recommendation: expand into 2-3 missing schools
            diversity.recommendedExpansion = diversity.missingSchools.slice(0, 3);
        }

        return diversity;
    },

    /**
     * Identify potential build synergies based on current equipment
     */
    identifyBuildSynergies: function(currentEquipment = {}, playerLevel, playerClass = null) {
        const synergies = {
            discovered: [],
            potential: [],
            recommendations: []
        };

        // Define synergy patterns
        const synergyPatterns = {
            'elemental_mastery': {
                requires: ['elemental_weapon', 'elemental_armor', 'elemental_accessory'],
                bonus: 'Enhanced elemental damage and resistance',
                threshold: 2
            },
            'stealth_specialist': {
                requires: ['light_armor', 'stealth_accessories', 'stealth_weapons'],
                bonus: 'Improved stealth and critical strike chance',
                threshold: 2
            },
            'heavy_defender': {
                requires: ['heavy_armor', 'shield', 'defensive_accessories'],
                bonus: 'Massive damage reduction and threat generation',
                threshold: 3
            },
            'spell_warrior': {
                requires: ['magical_weapon', 'spell_armor', 'mana_accessories'],
                bonus: 'Balanced magical and physical combat effectiveness',
                threshold: 2
            },
            'treasure_hunter': {
                requires: ['lockpicks', 'detection_items', 'carrying_capacity'],
                bonus: 'Enhanced exploration and loot discovery',
                threshold: 2
            }
        };

        // Analyze current equipment for synergies
        const equipmentTypes = this.categorizeEquipmentBySynergy(currentEquipment);

        Object.keys(synergyPatterns).forEach(synergyName => {
            const pattern = synergyPatterns[synergyName];
            const matchCount = pattern.requires.filter(req => equipmentTypes.includes(req)).length;

            if (matchCount >= pattern.threshold) {
                synergies.discovered.push({
                    name: synergyName,
                    completion: matchCount / pattern.requires.length,
                    bonus: pattern.bonus,
                    active: true
                });
            } else if (matchCount > 0) {
                synergies.potential.push({
                    name: synergyName,
                    completion: matchCount / pattern.requires.length,
                    missing: pattern.requires.filter(req => !equipmentTypes.includes(req)),
                    bonus: pattern.bonus
                });
            }
        });

        // Generate recommendations
        synergies.recommendations = synergies.potential
            .filter(syn => syn.completion >= 0.5)
            .map(syn => ({
                synergy: syn.name,
                nextItems: syn.missing.slice(0, 2),
                priority: syn.completion > 0.7 ? 'high' : 'medium'
            }));

        return synergies;
    },

    /**
     * Calculate diversity weights to promote varied loot generation
     */
    calculateDiversityWeights: function(recentLootHistory = [], playerLevel) {
        const baseWeights = {
            weapons: 0.25,
            armor: 0.25,
            accessories: 0.20,
            spells: 0.15,
            consumables: 0.10,
            tools: 0.05
        };

        // Analyze recent loot to adjust weights
        const recentCategories = this.categorizeRecentLoot(recentLootHistory.slice(-15));
        const adjustedWeights = {...baseWeights};

        // Reduce weights for overrepresented categories
        Object.keys(recentCategories).forEach(category => {
            const recentCount = recentCategories[category] || 0;
            const recentRatio = recentCount / Math.max(1, recentLootHistory.length);

            if (recentRatio > baseWeights[category] * 1.5) {
                // Reduce weight for overrepresented categories
                adjustedWeights[category] *= 0.7;
                console.log(`🎲 Reducing ${category} weight due to overrepresentation`);
            } else if (recentRatio < baseWeights[category] * 0.5) {
                // Increase weight for underrepresented categories
                adjustedWeights[category] *= 1.3;
                console.log(`🎲 Increasing ${category} weight due to underrepresentation`);
            }
        });

        // Level-based adjustments
        if (playerLevel <= 10) {
            // Early game: more weapons and basic equipment
            adjustedWeights.weapons *= 1.2;
            adjustedWeights.consumables *= 1.1;
        } else if (playerLevel >= 21) {
            // Late game: more spells and accessories
            adjustedWeights.spells *= 1.3;
            adjustedWeights.accessories *= 1.2;
        }

        return this.normalizeWeights(adjustedWeights);
    },

    /**
     * Select items that promote build diversity
     */
    selectBuildDiversityItem: function(playerLevel, playerClass = null, encounterContext = {}) {
        const diversityProfile = this.getBuildDiversityPreferences(
            playerLevel,
            playerClass,
            encounterContext.recentLootHistory || [],
            encounterContext.currentEquipment || {}
        );

        // Use diversity weights to select item category
        const categoryWeights = diversityProfile.diversityWeights;
        const selectedCategory = this.weightedRandomSelect(categoryWeights);

        // Select specific item within category that promotes diversity
        let selectedItem = null;

        switch (selectedCategory) {
            case 'weapons':
                selectedItem = this.selectDiverseWeapon(playerLevel, playerClass, diversityProfile);
                break;
            case 'armor':
                selectedItem = this.selectDiverseArmor(playerLevel, playerClass, diversityProfile);
                break;
            case 'accessories':
                selectedItem = this.selectDiverseAccessory(playerLevel, playerClass, diversityProfile);
                break;
            case 'spells':
                selectedItem = this.selectDiverseSpell(playerLevel, playerClass, diversityProfile);
                break;
            case 'consumables':
                selectedItem = this.selectDiverseConsumable(playerLevel, playerClass, diversityProfile);
                break;
            case 'tools':
                selectedItem = this.selectDiverseTool(playerLevel, playerClass, diversityProfile);
                break;
        }

        // Add build diversity metadata
        if (selectedItem) {
            selectedItem.buildDiversityInfo = {
                category: selectedCategory,
                diversityReason: this.getBuildDiversityReason(selectedCategory, diversityProfile),
                synergyPotential: this.evaluateSynergyPotential(selectedItem, diversityProfile),
                buildSupport: this.identifyBuildSupport(selectedItem, diversityProfile.supportedBuilds)
            };
        }

        return selectedItem;
    },

    /**
     * Apply build diversity enhancements to generated items
     */
    applyBuildDiversityEnhancements: function(item, playerLevel, playerClass, diversityProfile) {
        if (!item || !diversityProfile) return item;

        // Add build diversity hints
        if (!item.buildDiversityHints) item.buildDiversityHints = [];

        // Determine if this item supports underrepresented builds
        const supportedBuilds = this.identifyBuildSupport(item, diversityProfile.supportedBuilds);
        if (supportedBuilds.length > 0) {
            item.buildDiversityHints.push(`Supports ${supportedBuilds.slice(0, 2).join(' and ')} builds`);
        }

        // Add synergy opportunity hints
        if (diversityProfile.synergyOpportunities.recommendations.length > 0) {
            const relevantSynergies = diversityProfile.synergyOpportunities.recommendations
                .filter(rec => this.itemSupportsSynergy(item, rec.synergy))
                .slice(0, 1);

            if (relevantSynergies.length > 0) {
                item.buildDiversityHints.push(`Contributes to ${relevantSynergies[0].synergy} synergy`);
            }
        }

        // Add diversity value bonus for underrepresented categories
        const gaps = diversityProfile.underrepresentedCategories;
        const itemCategory = this.categorizeItem(item);
        const relevantGap = gaps.find(gap => gap.category === itemCategory);

        if (relevantGap) {
            // Slight value bonus for addressing diversity gaps
            const diversityBonus = relevantGap.priority === 'high' ? 1.15 : 1.1;
            if (item.value) item.value = Math.floor(item.value * diversityBonus);
            item.buildDiversityHints.push('Addresses equipment variety gap');
        }

        return item;
    },

    // === Helper Functions for Build Diversity ===

    categorizeEquipment: function(equipment) {
        const distribution = {};
        Object.values(equipment).forEach(item => {
            if (!item || !item.type) return;
            const category = this.categorizeItem(item);
            distribution[category] = (distribution[category] || 0) + 1;
        });
        return distribution;
    },

    categorizeRecentLoot: function(lootHistory) {
        const distribution = {};
        lootHistory.forEach(item => {
            if (!item || !item.type) return;
            const category = this.categorizeItem(item);
            distribution[category] = (distribution[category] || 0) + 1;
        });
        return distribution;
    },

    categorizeItem: function(item) {
        if (!item.type) return 'unknown';

        const weaponTypes = ['sword', 'axe', 'mace', 'dagger', 'bow', 'staff', 'wand', 'spear'];
        const armorTypes = ['armor', 'helmet', 'shield', 'robes'];
        const accessoryTypes = ['ring', 'amulet', 'cloak', 'belt', 'boots', 'gloves'];
        const spellTypes = ['scroll', 'book', 'tome', 'orb'];
        const consumableTypes = ['potion', 'food', 'reagent'];
        const toolTypes = ['lockpicks', 'rope', 'torch', 'kit'];

        if (weaponTypes.some(type => item.type.includes(type))) return 'weapons';
        if (armorTypes.some(type => item.type.includes(type))) return 'armor';
        if (accessoryTypes.some(type => item.type.includes(type))) return 'accessories';
        if (spellTypes.some(type => item.type.includes(type))) return 'spells';
        if (consumableTypes.some(type => item.type.includes(type))) return 'consumables';
        if (toolTypes.some(type => item.type.includes(type))) return 'tools';

        return 'other';
    },

    categorizeSpellAccess: function(equipment, recentLoot) {
        const spells = [];

        [...Object.values(equipment), ...recentLoot].forEach(item => {
            if (item && item.type && (item.type.includes('scroll') || item.type.includes('book') || item.type.includes('tome'))) {
                if (item.spell || item.name) {
                    spells.push(item.spell || item.name);
                }
            }
        });

        return spells;
    },

    getClassSpellAffinities: function(playerClass) {
        const affinities = {
            warrior: ['divine', 'elemental'],
            mage: ['arcane', 'elemental', 'utility'],
            rogue: ['shadow', 'utility'],
            cleric: ['divine', 'nature']
        };

        return affinities[playerClass] || ['elemental', 'utility'];
    },

    categorizeEquipmentBySynergy: function(equipment) {
        const types = [];
        Object.values(equipment).forEach(item => {
            if (!item) return;

            // Analyze item properties for synergy categorization
            if (item.elementalDamage || item.type?.includes('elemental')) types.push('elemental_weapon', 'elemental_armor', 'elemental_accessory');
            if (item.stealth || item.type?.includes('light')) types.push('light_armor', 'stealth_accessories', 'stealth_weapons');
            if (item.defense >= 10 || item.type?.includes('heavy')) types.push('heavy_armor', 'shield', 'defensive_accessories');
            if (item.magicalPower || item.type?.includes('magical')) types.push('magical_weapon', 'spell_armor', 'mana_accessories');
            if (item.type?.includes('lockpicks') || item.exploration) types.push('lockpicks', 'detection_items', 'carrying_capacity');
        });

        return [...new Set(types)];
    },

    selectDiverseWeapon: function(playerLevel, playerClass, diversityProfile) {
        // Implementation would select weapons that address diversity gaps
        return this.selectItemFromCategory('weapons', playerClass, playerLevel);
    },

    selectDiverseArmor: function(playerLevel, playerClass, diversityProfile) {
        // Implementation would select armor that addresses diversity gaps
        return this.selectItemFromCategory('armor', playerClass, playerLevel);
    },

    selectDiverseAccessory: function(playerLevel, playerClass, diversityProfile) {
        // Implementation would select accessories that address diversity gaps
        return this.selectItemFromCategory('accessories', playerClass, playerLevel);
    },

    selectDiverseSpell: function(playerLevel, playerClass, diversityProfile) {
        // Select spells from underrepresented schools
        const missingSchools = diversityProfile.spellDiversityNeeds.missingSchools;
        if (missingSchools.length > 0) {
            const targetSchool = missingSchools[Math.floor(Math.random() * missingSchools.length)];
            return this.selectSpellFromSchool(targetSchool, playerLevel, playerClass);
        }
        return this.selectItemFromCategory('spells', playerClass, playerLevel);
    },

    selectDiverseConsumable: function(playerLevel, playerClass, diversityProfile) {
        // Implementation would select consumables that address diversity gaps
        return this.selectItemFromCategory('consumables', playerClass, playerLevel);
    },

    selectDiverseTool: function(playerLevel, playerClass, diversityProfile) {
        // Implementation would select tools that address diversity gaps
        return this.selectItemFromCategory('tools', playerClass, playerLevel);
    },

    selectSpellFromSchool: function(school, playerLevel, playerClass) {
        // Placeholder - would select appropriate spell from the specified school
        return {
            type: 'scroll',
            name: `${school} spell scroll`,
            school: school,
            level: Math.min(playerLevel, 10),
            value: 50 + playerLevel * 5
        };
    },

    getBuildDiversityReason: function(category, diversityProfile) {
        const gaps = diversityProfile.underrepresentedCategories;
        const relevantGap = gaps.find(gap => gap.category === category);

        if (relevantGap) {
            return `Addresses ${relevantGap.priority} priority gap in ${category}`;
        }
        return `Promotes ${category} variety`;
    },

    evaluateSynergyPotential: function(item, diversityProfile) {
        const synergies = diversityProfile.synergyOpportunities.recommendations;
        const supportedSynergies = synergies.filter(syn => this.itemSupportsSynergy(item, syn.synergy));

        return {
            count: supportedSynergies.length,
            synergies: supportedSynergies.map(syn => syn.synergy),
            highestPriority: supportedSynergies.find(syn => syn.priority === 'high')?.synergy || null
        };
    },

    identifyBuildSupport: function(item, supportedBuilds) {
        if (!item || !supportedBuilds.availableBuilds) return [];

        // Simple mapping - would be more sophisticated in full implementation
        const buildMap = {
            'sword': ['melee_damage', 'warrior', 'weapon_specialist'],
            'staff': ['mage', 'elemental_damage', 'arcane'],
            'bow': ['ranged_damage', 'rogue', 'ranger'],
            'armor': ['defensive', 'tank', 'guardian'],
            'scroll': ['caster', 'utility', 'scholar']
        };

        const itemBuildSupport = [];
        Object.keys(buildMap).forEach(itemType => {
            if (item.type?.includes(itemType) || item.name?.toLowerCase().includes(itemType)) {
                buildMap[itemType].forEach(build => {
                    if (supportedBuilds.availableBuilds.includes(build)) {
                        itemBuildSupport.push(build);
                    }
                });
            }
        });

        return [...new Set(itemBuildSupport)];
    },

    itemSupportsSynergy: function(item, synergyName) {
        // Simple check - would be more sophisticated in full implementation
        const synergyMap = {
            'elemental_mastery': ['elemental', 'fire', 'ice', 'lightning'],
            'stealth_specialist': ['stealth', 'light', 'dagger', 'bow'],
            'heavy_defender': ['heavy', 'armor', 'shield', 'defense'],
            'spell_warrior': ['magical', 'mana', 'hybrid'],
            'treasure_hunter': ['lockpicks', 'detection', 'exploration']
        };

        const keywords = synergyMap[synergyName] || [];
        return keywords.some(keyword =>
            item.type?.includes(keyword) ||
            item.name?.toLowerCase().includes(keyword) ||
            Object.values(item).some(val =>
                typeof val === 'string' && val.toLowerCase().includes(keyword)
            )
        );
    },

    normalizeWeights: function(weights) {
        const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
        const normalized = {};
        Object.keys(weights).forEach(key => {
            normalized[key] = weights[key] / total;
        });
        return normalized;
    },

    weightedRandomSelect: function(weights) {
        const random = Math.random();
        let cumulative = 0;

        for (const [key, weight] of Object.entries(weights)) {
            cumulative += weight;
            if (random <= cumulative) {
                return key;
            }
        }

        // Fallback
        return Object.keys(weights)[0];
    },

    // === Progression Gate Mechanics ===
    // Implements loot-based area access requirements to gate progression
    // Ensures players have appropriate equipment before accessing challenging content

    /**
     * Define progression gate requirements for area access
     * Returns the loot-based requirements players must meet to access specific areas
     */
    getProgressionGateRequirements: function(areaName, recommendedLevel = 1) {
        const gateRequirements = {
            // Early game areas (levels 1-10): Minimal requirements
            forest_clearing: {
                minLevel: 1,
                requiredItems: [],
                recommendedItems: ['any_weapon'],
                description: 'No special requirements'
            },

            abandoned_shack: {
                minLevel: 2,
                requiredItems: ['any_weapon'],
                recommendedItems: ['healing_potion', 'any_armor'],
                description: 'Requires any weapon for basic combat'
            },

            // Mid game areas (levels 11-20): Equipment and progression requirements
            dark_forest: {
                minLevel: 8,
                requiredItems: ['any_weapon', 'any_armor'],
                recommendedItems: ['torch', 'healing_potion', 'lockpicks'],
                lootRequirements: {
                    totalItems: 5,
                    rarityDistribution: { common: 3, uncommon: 1 }
                },
                description: 'Requires weapon and armor. Recommended: torch for visibility, healing supplies'
            },

            mountain_cave: {
                minLevel: 12,
                requiredItems: ['any_weapon', 'medium_armor_or_better'],
                recommendedItems: ['torch', 'rope', 'healing_kit'],
                lootRequirements: {
                    totalItems: 8,
                    rarityDistribution: { common: 4, uncommon: 3, rare: 1 },
                    equipmentTypes: ['weapons', 'armor']
                },
                description: 'Dangerous cave requiring proper armor and equipment for survival'
            },

            haunted_ruins: {
                minLevel: 15,
                requiredItems: ['magical_weapon_or_spell', 'protective_gear'],
                recommendedItems: ['holy_water', 'spell_components', 'restoration_items'],
                lootRequirements: {
                    totalItems: 10,
                    rarityDistribution: { common: 5, uncommon: 3, rare: 2 },
                    spellAccess: ['divine', 'arcane'],
                    equipmentTypes: ['weapons', 'armor', 'accessories']
                },
                description: 'Cursed ruins requiring magical defenses and supernatural countermeasures'
            },

            // Late game areas (levels 21-30+): Strict progression requirements
            dragon_lair: {
                minLevel: 22,
                requiredItems: ['legendary_weapon_or_epic', 'fire_resistance', 'flight_or_climbing'],
                recommendedItems: ['dragon_ward', 'treasure_detection', 'emergency_escape'],
                lootRequirements: {
                    totalItems: 15,
                    rarityDistribution: { common: 6, uncommon: 5, rare: 3, epic: 1 },
                    synergyRequirements: ['elemental_mastery', 'heavy_defender'],
                    equipmentTypes: ['weapons', 'armor', 'accessories', 'spells'],
                    minEquipmentLevel: 20
                },
                description: 'Ancient dragon requires legendary equipment and elemental protection'
            },

            void_portal: {
                minLevel: 28,
                requiredItems: ['artifact_weapon', 'void_protection', 'reality_anchor'],
                recommendedItems: ['planar_navigation', 'soul_protection', 'emergency_return'],
                lootRequirements: {
                    totalItems: 20,
                    rarityDistribution: { uncommon: 8, rare: 6, epic: 4, legendary: 2 },
                    synergyRequirements: ['spell_warrior', 'treasure_hunter'],
                    equipmentTypes: ['weapons', 'armor', 'accessories', 'spells', 'tools'],
                    minEquipmentLevel: 25,
                    buildRequirements: ['transcendent_master', 'world_shaper']
                },
                description: 'Interdimensional portal requiring mastery of multiple disciplines and legendary artifacts'
            }
        };

        // Return specific area requirements or default
        return gateRequirements[areaName] || {
            minLevel: Math.max(1, recommendedLevel - 2),
            requiredItems: [],
            recommendedItems: [],
            description: 'Standard exploration requirements'
        };
    },

    /**
     * Check if player meets progression gate requirements for an area
     */
    checkProgressionGateAccess: function(areaName, playerLevel, playerInventory = {}, playerEquipment = {}, playerClass = null) {
        const requirements = this.getProgressionGateRequirements(areaName, playerLevel);

        const accessCheck = {
            hasAccess: true,
            failures: [],
            warnings: [],
            requirements: requirements,
            playerReadiness: 'excellent'
        };

        // Check minimum level requirement
        if (playerLevel < requirements.minLevel) {
            accessCheck.hasAccess = false;
            accessCheck.failures.push(`Minimum level ${requirements.minLevel} required (current: ${playerLevel})`);
        }

        // Check required items
        if (requirements.requiredItems && requirements.requiredItems.length > 0) {
            const missingRequired = this.checkRequiredItems(requirements.requiredItems, playerInventory, playerEquipment);
            if (missingRequired.length > 0) {
                accessCheck.hasAccess = false;
                accessCheck.failures.push(`Missing required items: ${missingRequired.join(', ')}`);
            }
        }

        // Check loot progression requirements
        if (requirements.lootRequirements) {
            const lootCheck = this.checkLootProgressionRequirements(
                requirements.lootRequirements,
                playerInventory,
                playerEquipment,
                playerClass
            );

            if (!lootCheck.meetsRequirements) {
                accessCheck.hasAccess = false;
                accessCheck.failures.push(...lootCheck.failures);
            }

            accessCheck.warnings.push(...lootCheck.warnings);
        }

        // Check recommended items (warnings only)
        if (requirements.recommendedItems && requirements.recommendedItems.length > 0) {
            const missingRecommended = this.checkRequiredItems(requirements.recommendedItems, playerInventory, playerEquipment);
            if (missingRecommended.length > 0) {
                accessCheck.warnings.push(`Recommended items missing: ${missingRecommended.join(', ')}`);
            }
        }

        // Determine player readiness level
        if (accessCheck.failures.length > 0) {
            accessCheck.playerReadiness = 'blocked';
        } else if (accessCheck.warnings.length > 2) {
            accessCheck.playerReadiness = 'unprepared';
        } else if (accessCheck.warnings.length > 0) {
            accessCheck.playerReadiness = 'adequate';
        } else {
            accessCheck.playerReadiness = 'excellent';
        }

        return accessCheck;
    },

    /**
     * Check if player has required items
     */
    checkRequiredItems: function(requiredItems, inventory, equipment) {
        const missing = [];

        requiredItems.forEach(requirement => {
            if (!this.playerHasRequirement(requirement, inventory, equipment)) {
                missing.push(requirement);
            }
        });

        return missing;
    },

    /**
     * Check if player meets loot progression requirements
     */
    checkLootProgressionRequirements: function(lootRequirements, inventory, equipment, playerClass) {
        const check = {
            meetsRequirements: true,
            failures: [],
            warnings: []
        };

        // Count total items
        const totalItems = Object.keys(inventory).length + Object.keys(equipment).length;
        if (lootRequirements.totalItems && totalItems < lootRequirements.totalItems) {
            check.meetsRequirements = false;
            check.failures.push(`Need ${lootRequirements.totalItems} total items (have ${totalItems})`);
        }

        // Check rarity distribution
        if (lootRequirements.rarityDistribution) {
            const rarityCheck = this.checkRarityDistribution(lootRequirements.rarityDistribution, inventory, equipment);
            if (!rarityCheck.meetsRequirements) {
                check.meetsRequirements = false;
                check.failures.push(...rarityCheck.failures);
            }
        }

        // Check equipment type requirements
        if (lootRequirements.equipmentTypes) {
            const typeCheck = this.checkEquipmentTypeRequirements(lootRequirements.equipmentTypes, inventory, equipment);
            if (!typeCheck.meetsRequirements) {
                check.meetsRequirements = false;
                check.failures.push(...typeCheck.failures);
            }
        }

        // Check spell access requirements
        if (lootRequirements.spellAccess) {
            const spellCheck = this.checkSpellAccessRequirements(lootRequirements.spellAccess, inventory, equipment);
            if (!spellCheck.meetsRequirements) {
                check.meetsRequirements = false;
                check.failures.push(...spellCheck.failures);
            }
        }

        // Check synergy requirements
        if (lootRequirements.synergyRequirements) {
            const synergyCheck = this.checkSynergyRequirements(lootRequirements.synergyRequirements, equipment);
            if (!synergyCheck.meetsRequirements) {
                check.failures.push(...synergyCheck.failures);
                // Synergy requirements are often warnings rather than hard blocks
                if (synergyCheck.failures.length > 1) {
                    check.meetsRequirements = false;
                } else {
                    check.warnings.push(...synergyCheck.failures);
                }
            }
        }

        // Check minimum equipment level
        if (lootRequirements.minEquipmentLevel) {
            const levelCheck = this.checkMinimumEquipmentLevel(lootRequirements.minEquipmentLevel, equipment);
            if (!levelCheck.meetsRequirements) {
                check.meetsRequirements = false;
                check.failures.push(...levelCheck.failures);
            }
        }

        // Check build requirements
        if (lootRequirements.buildRequirements) {
            const buildCheck = this.checkBuildRequirements(lootRequirements.buildRequirements, inventory, equipment, playerClass);
            if (!buildCheck.meetsRequirements) {
                check.warnings.push(...buildCheck.failures); // Usually warnings for build requirements
            }
        }

        return check;
    },

    /**
     * Check if player has a specific requirement
     */
    playerHasRequirement: function(requirement, inventory, equipment) {
        // Handle different requirement types
        switch (requirement) {
            case 'any_weapon':
                return this.hasItemOfType(['weapon', 'sword', 'axe', 'mace', 'dagger', 'bow', 'staff', 'wand'], inventory, equipment);

            case 'any_armor':
                return this.hasItemOfType(['armor', 'helmet', 'shield', 'robes'], inventory, equipment);

            case 'medium_armor_or_better':
                return this.hasItemWithMinimumDefense(5, inventory, equipment);

            case 'magical_weapon_or_spell':
                return this.hasItemOfType(['magical_weapon', 'spell', 'scroll', 'book', 'tome'], inventory, equipment) ||
                       this.hasItemWithProperty('magical', inventory, equipment);

            case 'protective_gear':
                return this.hasItemWithMinimumDefense(3, inventory, equipment) ||
                       this.hasItemOfType(['shield', 'cloak', 'amulet'], inventory, equipment);

            case 'legendary_weapon_or_epic':
                return this.hasItemWithMinimumRarity(['epic', 'legendary'], inventory, equipment);

            case 'fire_resistance':
                return this.hasItemWithProperty('fire_resistance', inventory, equipment) ||
                       this.hasItemWithProperty('elemental_resistance', inventory, equipment);

            case 'artifact_weapon':
                return this.hasItemWithMinimumRarity(['legendary'], inventory, equipment) &&
                       this.hasItemOfType(['weapon'], inventory, equipment);

            case 'void_protection':
                return this.hasItemWithProperty('void_protection', inventory, equipment) ||
                       this.hasItemWithProperty('planar_protection', inventory, equipment);

            default:
                // Check for item by name or type
                return this.hasItemByName(requirement, inventory, equipment);
        }
    },

    /**
     * Check rarity distribution requirements
     */
    checkRarityDistribution: function(requiredDistribution, inventory, equipment) {
        const check = { meetsRequirements: true, failures: [] };
        const playerItems = [...Object.values(inventory), ...Object.values(equipment)];
        const rarityCount = {};

        // Count player's items by rarity
        playerItems.forEach(item => {
            if (item && item.rarity) {
                rarityCount[item.rarity] = (rarityCount[item.rarity] || 0) + 1;
            }
        });

        // Check each required rarity count
        Object.keys(requiredDistribution).forEach(rarity => {
            const required = requiredDistribution[rarity];
            const actual = rarityCount[rarity] || 0;

            if (actual < required) {
                check.meetsRequirements = false;
                check.failures.push(`Need ${required} ${rarity} items (have ${actual})`);
            }
        });

        return check;
    },

    /**
     * Check equipment type requirements
     */
    checkEquipmentTypeRequirements: function(requiredTypes, inventory, equipment) {
        const check = { meetsRequirements: true, failures: [] };
        const playerItems = [...Object.values(inventory), ...Object.values(equipment)];
        const typePresence = {};

        // Check what types player has
        playerItems.forEach(item => {
            if (item && item.type) {
                const category = this.categorizeItem(item);
                typePresence[category] = true;
            }
        });

        // Check each required type
        requiredTypes.forEach(requiredType => {
            if (!typePresence[requiredType]) {
                check.meetsRequirements = false;
                check.failures.push(`Need at least one ${requiredType} item`);
            }
        });

        return check;
    },

    /**
     * Check spell access requirements
     */
    checkSpellAccessRequirements: function(requiredSchools, inventory, equipment) {
        const check = { meetsRequirements: true, failures: [] };
        const spellAccess = this.categorizeSpellAccess(equipment, Object.values(inventory));
        const availableSchools = new Set();

        // Determine what spell schools player has access to
        spellAccess.forEach(spell => {
            // Simple school detection - would be more sophisticated in full implementation
            if (spell.includes('fire') || spell.includes('ice') || spell.includes('lightning')) {
                availableSchools.add('elemental');
            }
            if (spell.includes('heal') || spell.includes('bless') || spell.includes('holy')) {
                availableSchools.add('divine');
            }
            if (spell.includes('arcane') || spell.includes('magic') || spell.includes('enchant')) {
                availableSchools.add('arcane');
            }
        });

        // Check each required school
        requiredSchools.forEach(school => {
            if (!availableSchools.has(school)) {
                check.meetsRequirements = false;
                check.failures.push(`Need access to ${school} magic`);
            }
        });

        return check;
    },

    /**
     * Check synergy requirements
     */
    checkSynergyRequirements: function(requiredSynergies, equipment) {
        const check = { meetsRequirements: true, failures: [] };
        const synergies = this.identifyBuildSynergies(equipment, 1); // Level doesn't matter for synergy detection

        const activeSynergyNames = synergies.discovered.map(s => s.name);
        const potentialSynergyNames = synergies.potential.map(s => s.name);

        requiredSynergies.forEach(requiredSynergy => {
            if (!activeSynergyNames.includes(requiredSynergy) && !potentialSynergyNames.includes(requiredSynergy)) {
                check.meetsRequirements = false;
                check.failures.push(`Need ${requiredSynergy} equipment synergy`);
            }
        });

        return check;
    },

    /**
     * Check minimum equipment level requirement
     */
    checkMinimumEquipmentLevel: function(minLevel, equipment) {
        const check = { meetsRequirements: true, failures: [] };
        const equipmentLevels = Object.values(equipment)
            .filter(item => item && item.level)
            .map(item => item.level);

        if (equipmentLevels.length === 0) {
            check.meetsRequirements = false;
            check.failures.push('No leveled equipment found');
            return check;
        }

        const averageLevel = equipmentLevels.reduce((sum, level) => sum + level, 0) / equipmentLevels.length;

        if (averageLevel < minLevel) {
            check.meetsRequirements = false;
            check.failures.push(`Average equipment level ${averageLevel.toFixed(1)} below required ${minLevel}`);
        }

        return check;
    },

    /**
     * Check build requirements
     */
    checkBuildRequirements: function(requiredBuilds, inventory, equipment, playerClass) {
        const check = { meetsRequirements: true, failures: [] };

        // Get player's current build support
        const allItems = [...Object.values(inventory), ...Object.values(equipment)];
        const supportedBuilds = new Set();

        allItems.forEach(item => {
            if (item) {
                const builds = this.identifyBuildSupport(item, { availableBuilds: requiredBuilds });
                builds.forEach(build => supportedBuilds.add(build));
            }
        });

        // Check if player supports at least one required build
        const hasAnyRequired = requiredBuilds.some(build => supportedBuilds.has(build));

        if (!hasAnyRequired) {
            check.meetsRequirements = false;
            check.failures.push(`Equipment doesn't support required builds: ${requiredBuilds.join(', ')}`);
        }

        return check;
    },

    // === Helper Functions for Progression Gates ===

    hasItemOfType: function(types, inventory, equipment) {
        const allItems = [...Object.values(inventory), ...Object.values(equipment)];
        return allItems.some(item =>
            item && item.type && types.some(type => item.type.includes(type))
        );
    },

    hasItemWithMinimumDefense: function(minDefense, inventory, equipment) {
        const allItems = [...Object.values(inventory), ...Object.values(equipment)];
        return allItems.some(item =>
            item && item.defense && item.defense >= minDefense
        );
    },

    hasItemWithProperty: function(property, inventory, equipment) {
        const allItems = [...Object.values(inventory), ...Object.values(equipment)];
        return allItems.some(item =>
            item && (item[property] || (item.properties && item.properties.includes(property)))
        );
    },

    hasItemWithMinimumRarity: function(rarities, inventory, equipment) {
        const allItems = [...Object.values(inventory), ...Object.values(equipment)];
        return allItems.some(item =>
            item && item.rarity && rarities.includes(item.rarity)
        );
    },

    hasItemByName: function(itemName, inventory, equipment) {
        const allItems = [...Object.values(inventory), ...Object.values(equipment)];
        return allItems.some(item =>
            item && (item.name === itemName || item.type === itemName || item.itemId === itemName)
        );
    },

    /**
     * Get progression recommendations for a player trying to access an area
     */
    getProgressionRecommendations: function(areaName, accessCheck, playerLevel, playerClass = null) {
        if (accessCheck.hasAccess) {
            return {
                message: 'You are ready to explore this area!',
                recommendations: [],
                priority: 'ready'
            };
        }

        const recommendations = {
            message: 'You need to improve your equipment and preparation before accessing this area.',
            recommendations: [],
            priority: 'blocked'
        };

        // Generate specific recommendations based on failures
        accessCheck.failures.forEach(failure => {
            if (failure.includes('level')) {
                recommendations.recommendations.push({
                    type: 'level',
                    suggestion: 'Gain more experience by exploring lower-level areas',
                    priority: 'high'
                });
            } else if (failure.includes('weapon')) {
                recommendations.recommendations.push({
                    type: 'equipment',
                    suggestion: 'Acquire a suitable weapon from combat or merchant',
                    priority: 'high'
                });
            } else if (failure.includes('armor')) {
                recommendations.recommendations.push({
                    type: 'equipment',
                    suggestion: 'Find better armor to increase your defense',
                    priority: 'high'
                });
            } else if (failure.includes('rarity')) {
                recommendations.recommendations.push({
                    type: 'loot',
                    suggestion: 'Collect more rare and powerful items before attempting this area',
                    priority: 'medium'
                });
            } else if (failure.includes('magic')) {
                recommendations.recommendations.push({
                    type: 'spell',
                    suggestion: 'Learn spells or acquire magical items for supernatural threats',
                    priority: 'high'
                });
            }
        });

        // Add general preparation suggestions
        if (recommendations.recommendations.length === 0) {
            recommendations.recommendations.push({
                type: 'general',
                suggestion: 'Continue exploring and collecting equipment to meet area requirements',
                priority: 'medium'
            });
        }

        return recommendations;
    },

    // === Special Loot Notifications System ===
    // Implements automatic special notifications for rare and legendary item drops
    // Integrates with NotificationBridge for enhanced player feedback

    /**
     * Trigger special notifications for rare and legendary items
     * @param {Object} item - The generated loot item
     * @param {number} playerLevel - Current player level
     * @param {number} contentLevel - Level of the content that generated the item
     * @param {string} areaName - Area where the item was found
     */
    triggerSpecialLootNotifications: function(item, playerLevel, contentLevel, areaName = null) {
        if (!item || !item.rarity) return;

        // Check if we have access to notification system
        const hasNotificationSystem = this.getNotificationBridge();
        if (!hasNotificationSystem) return;

        const rarity = item.rarity.toLowerCase();

        // Define which rarities trigger special notifications
        const specialRarities = ['rare', 'epic', 'legendary'];
        if (!specialRarities.includes(rarity)) return;

        // Check for special circumstances
        const specialCircumstances = this.analyzeSpecialCircumstances(item, playerLevel, areaName);

        // Trigger appropriate special notification
        this.showSpecialRarityNotification(item, specialCircumstances, areaName);
    },

    /**
     * Analyze special circumstances surrounding the loot drop
     * @param {Object} item - The loot item
     * @param {number} playerLevel - Current player level
     * @param {string} areaName - Area where item was found
     * @returns {Object} Special circumstances detected
     */
    analyzeSpecialCircumstances: function(item, playerLevel, areaName) {
        const circumstances = {
            isFirstOfRarity: false,
            isProgressionSignificant: false,
            hasBuildSynergy: false,
            isAreaSpecial: false,
            isLevelMilestone: false,
            achievementType: null
        };

        // Check if this is the first item of this rarity
        circumstances.isFirstOfRarity = this.checkFirstOfRarity(item.rarity);

        // Check if this item has progression significance
        circumstances.isProgressionSignificant = this.checkProgressionSignificance(item, playerLevel);

        // Check for build synergy implications
        circumstances.hasBuildSynergy = this.checkBuildSynergyPotential(item);

        // Check if the area is special for this item type
        circumstances.isAreaSpecial = this.checkAreaSpecialness(item, areaName);

        // Check for level milestones
        circumstances.isLevelMilestone = this.checkLevelMilestone(item, playerLevel);

        // Determine the most significant achievement type
        circumstances.achievementType = this.determineAchievementType(circumstances, item);

        return circumstances;
    },

    /**
     * Check if this is the first item of its rarity the player has found
     * @param {string} rarity - Item rarity
     * @returns {boolean} True if this is the first of its rarity
     */
    checkFirstOfRarity: function(rarity) {
        // Check player's loot history or achievement flags
        if (typeof GameState !== 'undefined' && GameState.player && GameState.player.achievements) {
            const rarityFlag = `first_${rarity}_item`;
            if (!GameState.player.achievements[rarityFlag]) {
                // Mark this achievement
                GameState.player.achievements[rarityFlag] = true;
                return true;
            }
        }
        return false;
    },

    /**
     * Check if the item has progression significance
     * @param {Object} item - The loot item
     * @param {number} playerLevel - Current player level
     * @returns {boolean} True if progression significant
     */
    checkProgressionSignificance: function(item, playerLevel) {
        // Check if item could unlock new areas
        if (item.rarity === 'legendary' || item.rarity === 'epic') {
            return true;
        }

        // Check if item is significantly higher level than player
        if (item.level && item.level > playerLevel + 3) {
            return true;
        }

        // Check for special item properties
        const specialProperties = ['progression_key', 'area_unlock', 'quest_item', 'artifact'];
        return specialProperties.some(prop => item[prop] || (item.properties && item.properties.includes(prop)));
    },

    /**
     * Check if the item has build synergy potential
     * @param {Object} item - The loot item
     * @returns {boolean} True if it enables new synergies
     */
    checkBuildSynergyPotential: function(item) {
        // Check build diversity information
        if (item.buildDiversityInfo && item.buildDiversityInfo.synergyPotential) {
            return item.buildDiversityInfo.synergyPotential.count > 0;
        }

        // Check for synergy-enabling properties
        const synergyProperties = ['elemental', 'magical', 'stealth', 'heavy_defense', 'treasure_hunter'];
        return synergyProperties.some(prop =>
            item[prop] ||
            (item.type && item.type.includes(prop)) ||
            (item.properties && item.properties.includes(prop))
        );
    },

    /**
     * Check if the area is special for this item type
     * @param {Object} item - The loot item
     * @param {string} areaName - Area name
     * @returns {boolean} True if area/item combination is special
     */
    checkAreaSpecialness: function(item, areaName) {
        if (!areaName) return false;

        // Define special area/item combinations
        const specialCombinations = {
            'dragon_lair': ['legendary', 'epic'],
            'void_portal': ['legendary'],
            'haunted_ruins': ['epic', 'rare'],
            'ancient_temple': ['legendary', 'epic'],
            'treasure_vault': ['epic', 'rare']
        };

        if (specialCombinations[areaName]) {
            return specialCombinations[areaName].includes(item.rarity);
        }

        return false;
    },

    /**
     * Check for level milestone achievements
     * @param {Object} item - The loot item
     * @param {number} playerLevel - Current player level
     * @returns {boolean} True if this represents a level milestone
     */
    checkLevelMilestone: function(item, playerLevel) {
        // Check for milestone levels (every 5 levels)
        const isMilestoneLevel = playerLevel % 5 === 0;

        // High rarity items at milestone levels are special
        if (isMilestoneLevel && (item.rarity === 'legendary' || item.rarity === 'epic')) {
            return true;
        }

        // First rare+ item at new level tiers
        const tierBreakpoints = [10, 20, 30];
        const isNewTier = tierBreakpoints.some(tier => playerLevel >= tier && playerLevel < tier + 2);

        return isNewTier && ['rare', 'epic', 'legendary'].includes(item.rarity);
    },

    /**
     * Determine the most significant achievement type
     * @param {Object} circumstances - Special circumstances object
     * @param {Object} item - The loot item
     * @returns {string} Achievement type
     */
    determineAchievementType: function(circumstances, item) {
        // Priority order for achievement types
        if (circumstances.isFirstOfRarity && item.rarity === 'legendary') {
            return 'first_legendary';
        }

        if (circumstances.isFirstOfRarity && item.rarity === 'epic') {
            return 'first_epic';
        }

        if (circumstances.isFirstOfRarity && item.rarity === 'rare') {
            return 'first_rare';
        }

        if (circumstances.hasBuildSynergy) {
            return 'build_synergy';
        }

        if (circumstances.isProgressionSignificant) {
            return 'progression_gate';
        }

        if (circumstances.isAreaSpecial) {
            return 'area_special';
        }

        if (circumstances.isLevelMilestone) {
            return 'level_milestone';
        }

        // Default special notification for rare+ items
        if (item.rarity === 'legendary') return 'legendary_find';
        if (item.rarity === 'epic') return 'epic_find';
        if (item.rarity === 'rare') return 'rare_find';

        return 'rare_find';
    },

    /**
     * Show special rarity notification with enhanced presentation
     * @param {Object} item - The loot item
     * @param {Object} circumstances - Special circumstances
     * @param {string} areaName - Area where item was found
     */
    showSpecialRarityNotification: function(item, circumstances, areaName) {
        const notificationBridge = this.getNotificationBridge();
        if (!notificationBridge) return;

        // Add special notification metadata to the item
        item.specialNotification = {
            circumstances,
            areaName,
            timestamp: Date.now()
        };

        // Determine notification message and type based on circumstances
        const notificationInfo = this.buildSpecialNotificationMessage(item, circumstances, areaName);

        // Show the special notification
        if (notificationBridge.showSpecialLootNotification) {
            notificationBridge.showSpecialLootNotification(item, circumstances.achievementType);
        } else {
            // Fallback to regular loot notification
            const rarityType = `loot_${item.rarity}`;
            notificationBridge.showNotification(notificationInfo.message, rarityType);
        }

        // Log special loot event for analytics
        this.logSpecialLootEvent(item, circumstances, areaName);
    },

    /**
     * Build special notification message
     * @param {Object} item - The loot item
     * @param {Object} circumstances - Special circumstances
     * @param {string} areaName - Area name
     * @returns {Object} Notification information
     */
    buildSpecialNotificationMessage: function(item, circumstances, areaName) {
        let message = '';
        let title = '';
        let priority = 'high';

        switch (circumstances.achievementType) {
            case 'first_legendary':
                title = '🌟 FIRST LEGENDARY DISCOVERY! 🌟';
                message = `Congratulations! You've found your first legendary item:\n\n${item.name || item.type}\n\nLegendary items are extremely rare and possess incredible power. This marks a major milestone in your adventure!`;
                priority = 'critical';
                break;

            case 'first_epic':
                title = '⭐ FIRST EPIC DISCOVERY! ⭐';
                message = `Outstanding! You've found your first epic item:\n\n${item.name || item.type}\n\nEpic items are rare treasures with exceptional capabilities. Your journey into greatness has begun!`;
                priority = 'critical';
                break;

            case 'first_rare':
                title = '💎 FIRST RARE DISCOVERY! 💎';
                message = `Excellent! You've found your first rare item:\n\n${item.name || item.type}\n\nRare items are significant upgrades that will serve you well. Keep exploring to find even greater treasures!`;
                priority = 'high';
                break;

            case 'build_synergy':
                title = '⚡ SYNERGY ACTIVATED! ⚡';
                message = `The ${item.name || item.type} completes an equipment synergy!\n\nYour combined equipment now provides enhanced bonuses. Check your character sheet for new synergy effects!`;
                priority = 'high';
                break;

            case 'progression_gate':
                title = '🗝️ PROGRESSION ITEM FOUND! 🗝️';
                message = `The ${item.name || item.type} may unlock new possibilities!\n\nThis ${item.rarity} item could be the key to accessing new areas or advancing your quest. Guard it well!`;
                priority = 'high';
                break;

            case 'area_special':
                title = '🏛️ AREA TREASURE! 🏛️';
                message = `You've discovered a special ${item.rarity} treasure in ${areaName}!\n\n${item.name || item.type}\n\nThis area holds unique rewards for brave explorers!`;
                priority = 'high';
                break;

            case 'level_milestone':
                title = '🎉 MILESTONE REWARD! 🎉';
                message = `A ${item.rarity} reward for reaching your current level!\n\n${item.name || item.type}\n\nYour growing power attracts greater treasures!`;
                priority = 'medium';
                break;

            default:
                title = `✨ ${item.rarity.toUpperCase()} DISCOVERY! ✨`;
                message = `You've found a ${item.rarity} item: ${item.name || item.type}`;
                if (areaName) message += ` in ${areaName}`;
                message += '!\n\nContinue your adventures to discover even greater treasures!';
                priority = 'medium';
        }

        return { title, message, priority };
    },

    /**
     * Get notification bridge instance
     * @returns {Object|null} NotificationBridge instance or null
     */
    getNotificationBridge: function() {
        // Try multiple ways to access the notification system
        if (typeof window !== 'undefined') {
            // Check for NotificationManager on UI object
            if (window.ui && window.ui.notificationManager) {
                return window.ui.notificationManager.getBridge();
            }

            // Check for global NotificationBridge
            if (window.NotificationBridge) {
                return new window.NotificationBridge();
            }

            // Check for NotificationManager
            if (window.NotificationManager) {
                return new window.NotificationManager();
            }
        }

        return null;
    },

    /**
     * Log special loot event for analytics and player history
     * @param {Object} item - The loot item
     * @param {Object} circumstances - Special circumstances
     * @param {string} areaName - Area name
     */
    logSpecialLootEvent: function(item, circumstances, areaName) {
        const logEntry = {
            timestamp: Date.now(),
            itemName: item.name || item.type,
            rarity: item.rarity,
            level: item.level,
            value: item.value,
            area: areaName,
            achievementType: circumstances.achievementType,
            circumstances: circumstances,
            playerLevel: (typeof GameState !== 'undefined' && GameState.player) ? GameState.player.level : null
        };

        // Store in player's special loot history
        if (typeof GameState !== 'undefined' && GameState.player) {
            if (!GameState.player.specialLootHistory) {
                GameState.player.specialLootHistory = [];
            }
            GameState.player.specialLootHistory.push(logEntry);

            // Keep only the last 50 special loot events
            if (GameState.player.specialLootHistory.length > 50) {
                GameState.player.specialLootHistory = GameState.player.specialLootHistory.slice(-50);
            }
        }

        // Console log for debugging
        console.log('🌟 Special Loot Event:', logEntry);
    },

    /**
     * Clear loot system cache
     */
    clearCache: function() {
        if (this.lootCache) {
            this.lootCache.rarityRolls.clear();
            this.lootCache.levelScaledItems.clear();
            this.lootCache.areaLoot.clear();
            console.log('🧹 Loot system cache cleared');
        }

        // Also clear diminishing returns tracking if requested
        if (this.diminishingReturns) {
            this.diminishingReturns.monsterFarms.clear();
            this.diminishingReturns.areaFarms.clear();
            console.log('🧹 Diminishing returns tracking cleared');
        }
    }
};

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
    window.LootSystem = LootSystem;
    // Initialize on load or when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => LootSystem.initialize());
    } else {
        LootSystem.initialize();
    }
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LootSystem;
}