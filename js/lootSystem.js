/**
 * Loot System
 * Manages tiered loot collection, drop calculations, and distribution
 * Supports rarity-based drops with level scaling and area-specific loot tables
 */

const LootSystem = {
    // Rarity tier definitions with base drop rates and scaling
    rarityTiers: {
        common: {
            name: 'Common',
            color: '#9e9e9e',
            dropRate: 0.65,        // 65% base chance
            levelScaling: 0.02,    // +2% per level difference
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
            dropRate: 0.015,       // 1.5% base chance
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

                if (dropResult.dropped) {
                    const item = this.generateLootItem(
                        lootEntry.itemType,
                        dropResult.rarity,
                        playerLevel,
                        monsterLoot.level,
                        areaName
                    );

                    if (item) {
                        generatedLoot.items.push(item);
                    }
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

                if (dropResult.dropped) {
                    const item = this.generateLootItem(
                        lootEntry.itemType,
                        dropResult.rarity,
                        playerLevel,
                        areaLootConfig.recommendedLevel,
                        areaName
                    );

                    if (item) {
                        generatedLoot.items.push(item);
                    }
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
     */
    rollForLoot: function(lootEntry, playerLevel, contentLevel) {
        // Base drop chance
        const baseChance = lootEntry.dropChance || 0.5;

        // Level scaling bonus/penalty
        const levelDifference = playerLevel - contentLevel;
        const levelScaling = this.calculateLevelScaling(levelDifference);

        const finalDropChance = Math.max(0.01, Math.min(0.95, baseChance * levelScaling));

        // Roll for drop
        const dropRoll = Math.random();
        const dropped = dropRoll < finalDropChance;

        if (!dropped) {
            return { dropped: false };
        }

        // Determine rarity
        const rarity = this.rollForRarity(lootEntry.rarityWeights || {}, playerLevel, contentLevel);

        return {
            dropped: true,
            rarity,
            dropChance: finalDropChance,
            levelScaling
        };
    },

    /**
     * Roll for item rarity based on weights and level scaling
     */
    rollForRarity: function(rarityWeights, playerLevel, contentLevel) {
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

        // Add default weights if none specified
        if (Object.keys(adjustedWeights).length === 0) {
            adjustedWeights.common = 0.65;
            adjustedWeights.uncommon = 0.25;
            adjustedWeights.rare = 0.08;
            adjustedWeights.epic = 0.015;
            adjustedWeights.legendary = 0.005;
        }

        // Weighted random selection
        const totalWeight = Object.values(adjustedWeights).reduce((sum, weight) => sum + weight, 0);
        const roll = Math.random() * totalWeight;

        let cumulativeWeight = 0;
        for (const [rarity, weight] of Object.entries(adjustedWeights)) {
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
            if (itemType === 'spell_scroll' || itemType === 'spell_book' || itemType === 'spell_tome') {
                this.generateSpellLearningItem(item, itemType, rarity, playerLevel, contentLevel, areaName);
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

        if (itemType === 'spell_book' && (spell.learnLevel < 5 || spell.learnLevel > 15)) {
            return false; // Books contain mid-level spells
        }

        if (itemType === 'spell_tome' && spell.learnLevel < 10) {
            return false; // Tomes contain high-level spells
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

        return Math.round(baseExp * levelPenalty);
    },

    /**
     * Get level scaling multiplier
     */
    calculateLevelScaling: function(levelDifference) {
        if (levelDifference > 0) {
            // Player higher level - reduce drops but increase quality
            return Math.max(0.3, 1 - (levelDifference * 0.15));
        } else if (levelDifference < 0) {
            // Content higher level - increase drops
            return Math.min(1.5, 1 + (Math.abs(levelDifference) * 0.1));
        }
        return 1.0;
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
        // This will be populated from ItemData when available
        const templates = {
            weapon: { name: 'Weapon', category: 'equipment', slot: 'weapon', baseValue: 50 },
            armor: { name: 'Armor', category: 'equipment', slot: 'armor', baseValue: 40 },
            accessory: { name: 'Accessory', category: 'equipment', slot: 'accessory', baseValue: 30 },
            potion: { name: 'Potion', category: 'consumable', stackable: true, baseValue: 10 },
            material: { name: 'Material', category: 'material', stackable: true, baseValue: 5 },
            spell_scroll: { name: 'Spell Scroll', category: 'spell_scroll', stackable: false, baseValue: 100 },
            spell_book: { name: 'Spell Book', category: 'spell_book', stackable: false, baseValue: 200 },
            spell_tome: { name: 'Spell Tome', category: 'spell_tome', stackable: false, baseValue: 500 }
        };

        return templates[itemType] ? { ...templates[itemType] } : null;
    },

    shouldApplyLevelScaling: function(itemType) {
        return ['weapon', 'armor', 'accessory', 'material'].includes(itemType);
    },

    addBonusProperties: function(item, tierInfo) {
        item.bonusProperties = item.bonusProperties || [];

        // Add 1-2 random bonus properties for rare+ items
        const bonusCount = 1 + (item.rarityLevel >= 4 ? 1 : 0);
        const availableBonuses = ['durability_boost', 'experience_bonus', 'gold_find', 'magic_resistance'];

        for (let i = 0; i < bonusCount && i < availableBonuses.length; i++) {
            const bonus = availableBonuses[Math.floor(Math.random() * availableBonuses.length)];
            if (!item.bonusProperties.includes(bonus)) {
                item.bonusProperties.push(bonus);
            }
        }
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
            const monster = MonsterData.species[monsterName.toLowerCase().replace(/\s+/g, '_')];
            if (!monster || !monster.lootTable) {
                console.warn(`No loot table found for monster: ${monsterName}`);
                return this.getFallbackMonsterConfig(monsterName);
            }

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
            initialized: !!this.lootCache
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