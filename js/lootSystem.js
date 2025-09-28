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

            // Generate item drops based on monster loot table
            for (const lootEntry of monsterLoot.lootTable) {
                const dropResult = this.rollForLoot(lootEntry, playerLevel, monsterLoot.level);

                if (!dropResult.dropped) continue;

                // Resolve to a concrete item id when possible (e.g., from items list or equipmentTypes)
                // Use enhanced equipment selection for better upgrade paths
                const resolvedItemType = this.resolveConcreteItemIdWithUpgradePath(lootEntry, playerLevel) || lootEntry.itemType;

                const item = this.generateLootItem(
                    resolvedItemType,
                    dropResult.rarity,
                    playerLevel,
                    monsterLoot.level,
                    areaName
                );

                if (item) {
                    generatedLoot.items.push(item);
                } else {
                    console.warn('Monster loot generation failed for item type:', resolvedItemType, 'from entry:', lootEntry);
                }
            }

            // Generate gold drop
            generatedLoot.gold = this.generateGoldDrop(monsterLoot.level, playerLevel);

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

            // Generate area-specific loot
            for (const lootEntry of areaLootConfig.lootTable) {
                const modifiedEntry = {
                    ...lootEntry,
                    dropChance: lootEntry.dropChance * explorationModifiers.dropChanceMultiplier
                };

                const dropResult = this.rollForLoot(modifiedEntry, playerLevel, areaLootConfig.recommendedLevel);

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
                    areaName
                );

                if (!item) {
                    console.warn('[Loot] Area loot generation failed for item type:', selectedItemType, 'from entry:', lootEntry, '— falling back to material');
                    item = this.generateLootItem(
                        'material',
                        'common',
                        playerLevel,
                        areaLootConfig.recommendedLevel,
                        areaName
                    );
                }

                if (item) {
                    generatedLoot.items.push(item);
                }
            }

            // Generate area gold bonus
            generatedLoot.gold = Math.round(
                this.generateGoldDrop(areaLootConfig.recommendedLevel, playerLevel) *
                explorationModifiers.goldMultiplier
            );

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
        // Base drop chance
        const baseChance = lootEntry.dropChance || 0.5;

        // Level scaling bonus/penalty
        const levelDifference = playerLevel - contentLevel;
        const levelScaling = this.calculateLevelScaling(levelDifference, playerLevel, contentLevel);

        // Apply meaningful loot optimization
        let finalDropChance = this.optimizeForMeaningfulLoot(
            baseChance,
            levelScaling,
            lootEntry,
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

        // Determine rarity with meaningful loot bonuses
        const rarity = this.rollForRarity(
            lootEntry.rarityWeights || {},
            playerLevel,
            contentLevel,
            encounterContext
        );

        return {
            dropped: true,
            rarity,
            dropChance: finalDropChance,
            levelScaling,
            meaningful: this.isMeaningfulLoot(lootEntry, rarity, playerLevel)
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
        // Apply level-based rarity bonuses
        const levelDifference = playerLevel - contentLevel;
        const adjustedWeights = {};

        // Calculate adjusted weights with level scaling
        for (const [rarity, baseWeight] of Object.entries(rarityWeights)) {
            const tierInfo = this.rarityTiers[rarity];
            if (tierInfo) {
                const levelBonus = levelDifference * tierInfo.levelScaling;
                adjustedWeights[rarity] = Math.max(0.001, baseWeight + levelBonus);
            }
        }

        // Add default weights if none specified - use target distribution
        if (Object.keys(adjustedWeights).length === 0) {
            Object.assign(adjustedWeights, this.getDefaultRarityWeights());
        }

        // Normalize weights to ensure they sum to 1.0 for consistent distribution
        const finalWeights = this.normalizeRarityWeights(adjustedWeights);

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
    generateLootItem: function(itemType, rarity, playerLevel, contentLevel, areaName = null) {
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

            // Special handling for spell scrolls and learning materials
            if (itemType === 'spell_scroll' || itemType === 'spell_book' || itemType === 'spell_tome' || itemType === 'ancient_tome') {
                this.generateSpellLearningItem(item, itemType, rarity, playerLevel, contentLevel, areaName);
            }

            // Enhanced handling for consumables with learning curve support
            if (item.type === 'consumable' || itemType === 'consumable' || itemType === 'potion' ||
                itemType === 'healing_potion' || itemType === 'mana_potion' ||
                (item.category && ['healing', 'restoration', 'enhancement', 'utility', 'cure', 'revival'].includes(item.category))) {
                this.enhanceConsumableForLearning(item, playerLevel, rarity, areaName);
            }

            // Enhanced handling for materials with crafting integration
            if (item.type === 'material' || itemType === 'material' || itemType === 'crafting_material' ||
                itemType === 'component' || (item.category && ['crafting', 'alchemy', 'enchanting'].includes(item.category))) {
                this.enhanceMaterialForCrafting(item, playerLevel, rarity, areaName);
            }

            return item;

        } catch (error) {
            console.error('❌ Error generating loot item:', error);
            return null;
        }
    },

    /**
     * Generate spell learning item (scroll, book, or tome)
     */
    generateSpellLearningItem: function(item, itemType, rarity, playerLevel, contentLevel, areaName) {
        // Get available spells for generation
        const availableSpells = this.getGeneratableSpells(playerLevel, contentLevel, areaName, itemType);

        if (availableSpells.length === 0) {
            // Fallback to a basic spell if no spells available
            item.spellId = 'heal';
            item.name = 'Heal Scroll';
            item.description = 'A basic healing spell scroll.';
            item.icon = '📜✨';
            return;
        }

        // Select random spell weighted by rarity and level appropriateness
        const selectedSpell = this.selectSpellForItem(availableSpells, rarity, playerLevel);

        if (!selectedSpell) {
            console.warn('Failed to select spell for spell item generation');
            return;
        }

        // Apply spell-specific properties to item
        this.applySpellItemProperties(item, selectedSpell, itemType, rarity);
    },

    /**
     * Get spells that can be generated as loot items
     */
    getGeneratableSpells: function(playerLevel, contentLevel, areaName, itemType) {
        const spells = [];

        if (typeof SpellData === 'undefined' || !SpellData.spells) {
            return this.getFallbackSpells(itemType);
        }

        // Get all available spells
        for (const [spellId, spell] of Object.entries(SpellData.spells)) {
            // Check if spell is appropriate for the level and area
            if (this.isSpellAppropriateForGeneration(spell, playerLevel, contentLevel, areaName, itemType)) {
                spells.push({ id: spellId, ...spell });
            }
        }

        return spells;
    },

    /**
     * Check if spell is appropriate for generation in current context
     */
    isSpellAppropriateForGeneration: function(spell, playerLevel, contentLevel, areaName, itemType) {
        // Level appropriateness check
        const maxSpellLevel = contentLevel + 3; // Allow spells up to 3 levels above content
        const minSpellLevel = Math.max(1, contentLevel - 2); // Allow spells down to 2 levels below content

        if (spell.learnLevel > maxSpellLevel || spell.learnLevel < minSpellLevel) {
            return false;
        }

        // Scroll type restrictions
        if (itemType === 'spell_scroll' && spell.learnLevel > 10) {
            return false; // Basic scrolls don't contain high-level spells
        }

        if (itemType === 'spell_book' && (spell.learnLevel < 3 || spell.learnLevel > 18)) {
            return false; // Books contain mid-level spells
        }

        if (itemType === 'spell_tome' && spell.learnLevel < 8) {
            return false; // Tomes contain high-level spells
        }

        if (itemType === 'ancient_tome' && spell.learnLevel < 15) {
            return false; // Ancient tomes contain the most powerful spells
        }

        // Area-specific spell filtering
        if (areaName && spell.element) {
            const areaSpellAffinities = {
                'fire_temple': ['fire'],
                'ice_cavern': ['ice', 'water'],
                'lightning_tower': ['thunder', 'electric'],
                'nature_grove': ['nature', 'healing'],
                'cursed_ruins': ['dark', 'death'],
                'holy_sanctuary': ['holy', 'light', 'healing']
            };

            const areaAffinities = areaSpellAffinities[areaName];
            if (areaAffinities && !areaAffinities.includes(spell.element)) {
                // Allow non-matching spells but with reduced probability
                return Math.random() < 0.3;
            }
        }

        return true;
    },

    /**
     * Select appropriate spell for item generation
     */
    selectSpellForItem: function(availableSpells, rarity, playerLevel) {
        if (availableSpells.length === 0) return null;

        // Weight spells by rarity and appropriateness
        const weightedSpells = availableSpells.map(spell => {
            let weight = 1.0;

            // Rarity weighting
            const rarityWeights = {
                'common': { low: 2.0, mid: 1.0, high: 0.3 },
                'uncommon': { low: 1.5, mid: 2.0, high: 0.8 },
                'rare': { low: 0.8, mid: 1.5, high: 2.0 },
                'epic': { low: 0.3, mid: 1.0, high: 2.5 },
                'legendary': { low: 0.1, mid: 0.5, high: 3.0 }
            };

            // Categorize spell level
            let levelCategory = 'mid';
            if (spell.learnLevel <= 5) levelCategory = 'low';
            else if (spell.learnLevel >= 15) levelCategory = 'high';

            weight *= rarityWeights[rarity]?.[levelCategory] || 1.0;

            // Prefer spells close to player level
            const levelDistance = Math.abs(spell.learnLevel - playerLevel);
            weight *= Math.max(0.2, 1.0 - (levelDistance * 0.1));

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
            'spell_tome': 'Tome',
            'ancient_tome': 'Ancient Tome'
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
            'spell_tome': 'A powerful tome inscribed with',
            'ancient_tome': 'An ancient tome of immense power containing'
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
            'spell_tome': '📖',
            'ancient_tome': '📜✨'
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
            'spell_tome': 4.0,
            'ancient_tome': 8.0
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
            if (itemType === 'spell_book') return spell.learnLevel >= 3 && spell.learnLevel <= 18;
            if (itemType === 'spell_tome') return spell.learnLevel >= 8;
            if (itemType === 'ancient_tome') return spell.learnLevel >= 15;
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
     * Get level scaling multiplier
     */
    /**
     * Get default rarity weights for consistent distribution
     * Target: 65% common, 25% uncommon, 8% rare, 1.8% epic, 0.2% legendary
     */
    getDefaultRarityWeights: function() {
        return {
            common: 0.65,
            uncommon: 0.25,
            rare: 0.08,
            epic: 0.018,
            legendary: 0.002
        };
    },

    /**
     * Normalize rarity weights to ensure they sum to 1.0
     */
    normalizeRarityWeights: function(weights) {
        const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);

        if (totalWeight === 0) {
            console.warn('⚠️ Total rarity weight is 0, using default weights');
            return this.getDefaultRarityWeights();
        }

        const normalized = {};
        for (const [rarity, weight] of Object.entries(weights)) {
            normalized[rarity] = weight / totalWeight;
        }

        return normalized;
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
                scaling = 1.0 - (levelDifference * 0.08); // -8% per level (was -15%)
            } else if (levelDifference <= 5) {
                // Medium difference: moderate penalty with diminishing returns
                const basePenalty = 0.16; // From 2 level penalty
                const additionalLevels = levelDifference - 2;
                scaling = 1.0 - basePenalty - (additionalLevels * 0.12); // -12% per additional level
            } else if (levelDifference <= 10) {
                // Large difference: strong penalty but with curve flattening
                const mediumPenalty = 0.52; // From 5 level penalty
                const additionalLevels = levelDifference - 5;
                scaling = 1.0 - mediumPenalty - (additionalLevels * 0.06); // -6% per additional level
            } else {
                // Extreme difference: asymptotic approach to minimum
                const largePenalty = 0.82; // From 10 level penalty
                const additionalLevels = levelDifference - 10;
                // Exponential decay towards minimum, preventing complete elimination
                scaling = Math.max(0.1, 0.18 * Math.exp(-additionalLevels * 0.1));
            }

            // Ensure minimum viable drops for progression reasons
            scaling = Math.max(0.1, scaling);

        } else if (levelDifference < 0) {
            // Content higher level - controlled bonus to encourage appropriate challenges
            const absDifference = Math.abs(levelDifference);

            if (absDifference <= 3) {
                // Reasonable challenge: moderate bonus
                scaling = 1.0 + (absDifference * 0.12); // +12% per level (was +10%)
            } else if (absDifference <= 8) {
                // High challenge: good bonus but diminishing returns
                const baseBonus = 0.36; // From 3 level bonus
                const additionalLevels = absDifference - 3;
                scaling = 1.0 + baseBonus + (additionalLevels * 0.08); // +8% per additional level
            } else {
                // Extreme challenge: high bonus but capped to prevent exploitation
                const mediumBonus = 0.76; // From 8 level bonus
                const additionalLevels = absDifference - 8;
                scaling = 1.0 + mediumBonus + (additionalLevels * 0.04); // +4% per additional level
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
            standard: { dropChanceMultiplier: 1.0, goldMultiplier: 1.0 },
            thorough: { dropChanceMultiplier: 1.3, goldMultiplier: 1.2 },
            quick: { dropChanceMultiplier: 0.7, goldMultiplier: 0.8 },
            treasure_hunt: { dropChanceMultiplier: 1.5, goldMultiplier: 2.0 }
        };

        return modifiers[explorationType] || modifiers.standard;
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
            ancient_tome: { name: 'Ancient Tome', category: 'ancient_tome', stackable: false, baseValue: 1000 }
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
                    stealth_gear: ['stealth_cloak', 'poisoned_blade', 'leather_vest']
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
        // First try enhanced consumable selection for consumable items
        if (lootEntry.itemType && ['consumable', 'potion', 'healing_potion', 'mana_potion'].includes(lootEntry.itemType)) {
            const selectedConsumable = this.selectLevelAppropriateConsumable(playerLevel, playerLevel, null, 'general');
            if (selectedConsumable) return selectedConsumable;
        }

        // Try material selection for material items
        if (lootEntry.itemType && ['material', 'crafting_material', 'component'].includes(lootEntry.itemType)) {
            const selectedMaterial = this.selectCraftingAppropriateMaterial(
                playerLevel,
                playerLevel,
                lootEntry.areaName,
                lootEntry.monsterType,
                { type: 'loot_generation' }
            );
            if (selectedMaterial) return selectedMaterial;
        }

        // Then try the enhanced equipment selection for equipment items
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