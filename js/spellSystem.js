/**
 * Spell System
 * Manages MP, spell learning, casting validation, and spell effects
 */

class SpellSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.activeSpellEffects = new Map(); // Track ongoing spell effects
        this.spellCooldowns = new Map(); // Track spell cooldowns
        this.lastRegenTime = Date.now();

        // Enhanced MP regeneration configuration
        this.regenerationConfig = {
            // Base regeneration rates per second (% of max MP)
            baseRates: {
                combat: 0.005,    // 0.5% per second in combat (very slow)
                exploration: 0.015, // 1.5% per second during exploration
                rest: 0.08,       // 8% per second when resting (fast recovery)
                meditation: 0.15  // 15% per second when meditating (very fast)
            },

            // Class-specific multipliers
            classMultipliers: {
                wizard: 1.5,     // Wizards regenerate MP 50% faster
                paladin: 1.2,    // Paladins regenerate 20% faster
                knight: 1.1,     // Knights regenerate 10% faster
                ranger: 1.0,     // Rangers baseline
                rogue: 0.9,      // Rogues 10% slower
                warrior: 0.7     // Warriors 30% slower (lowest MP users)
            },

            // Level scaling factor
            levelBonus: 0.002,   // +0.2% per level

            // Equipment and status modifiers
            statusEffects: {
                poisoned: 0.5,   // 50% regeneration when poisoned
                blessed: 1.5,    // 50% bonus when blessed
                cursed: 0.3,     // 70% reduction when cursed
                focused: 2.0,    // Double regeneration when focused
                exhausted: 0.1   // 90% reduction when exhausted
            }
        };
    }

    /**
     * Initialize the spell system
     */
    initialize() {
        // Initialize player MP if not set
        if (this.gameState.player && this.gameState.player.stats) {
            this.initializeMp(this.gameState.player, this.gameState.player.level || 1);
        }

        // Initialize MP for any existing party monsters
        if (this.gameState.monsters && this.gameState.monsters.party) {
            this.gameState.monsters.party.forEach(monster => {
                this.initializeMp(monster, monster.level || 1);
            });
        }

        console.log('✅ Spell System initialized');
    }

    // ================================================
    // MP MANAGEMENT
    // ================================================

    /**
     * Initialize MP values for a character
     */
    initializeMp(character, level = 1) {
        const baseMP = this.calculateBaseMP(character.class || 'warrior', level);
        character.stats = character.stats || {};
        character.stats.mp = character.stats.mp || baseMP;
        character.stats.maxMp = character.stats.maxMp || baseMP;

        // Sync with alternate naming conventions
        character.mp = character.stats.mp;
        character.mana = character.stats.mp;
        character.maxMp = character.stats.maxMp;
        character.maxMana = character.stats.maxMp;
    }

    /**
     * Calculate base MP for a character class at a given level
     */
    calculateBaseMP(characterClass, level) {
        const baseMPByClass = {
            'wizard': 50,
            'paladin': 30,
            'ranger': 25,
            'knight': 20,
            'rogue': 15,
            'warrior': 10
        };

        const baseMP = baseMPByClass[characterClass] || 10;
        return baseMP + (level * 5); // +5 MP per level
    }

    /**
     * Consume MP for spell casting
     */
    consumeMP(character, amount) {
        if (!this.hasEnoughMP(character, amount)) {
            return false;
        }

        character.stats.mp = Math.max(0, character.stats.mp - amount);
        this.gameState.synchronizeMpValues();
        return true;
    }

    /**
     * Check if character has enough MP
     */
    hasEnoughMP(character, amount) {
        return (character.stats.mp || 0) >= amount;
    }

    /**
     * Restore MP to a character
     */
    restoreMP(character, amount) {
        if (!character.stats.maxMp) return 0;

        const currentMP = character.stats.mp || 0;
        const maxMP = character.stats.maxMp;
        const restored = Math.min(amount, maxMP - currentMP);

        character.stats.mp = Math.min(maxMP, currentMP + restored);
        this.gameState.synchronizeMpValues();
        return restored;
    }

    /**
     * Natural MP regeneration over time
     */
    updateMPRegeneration(deltaTime) {
        const now = Date.now();
        const timeSinceLastRegen = now - this.lastRegenTime;

        if (timeSinceLastRegen >= 1000) { // Regenerate every second
            this.lastRegenTime = now;

            // Regenerate player MP
            this.regenerateCharacterMP(this.gameState.player);

            // Regenerate party monsters MP
            if (this.gameState.monsters && this.gameState.monsters.party) {
                this.gameState.monsters.party.forEach(monster => {
                    this.regenerateCharacterMP(monster);
                });
            }
        }
    }

    /**
     * Enhanced MP regeneration for a single character
     */
    regenerateCharacterMP(character) {
        if (!character || !character.stats || !character.stats.maxMp || character.stats.mp >= character.stats.maxMp) {
            return 0;
        }

        const regenAmount = this.calculateMPRegeneration(character);
        if (regenAmount > 0) {
            const restored = this.restoreMP(character, regenAmount);

            // Add notification for significant regeneration (>5% of max MP)
            if (restored >= character.stats.maxMp * 0.05) {
                this.gameState.addNotification(
                    `${character.name || 'Character'} regenerates ${restored} MP`,
                    'info'
                );
            }

            return restored;
        }

        return 0;
    }

    /**
     * Calculate MP regeneration amount based on multiple factors
     */
    calculateMPRegeneration(character) {
        const maxMP = character.stats.maxMp;
        const characterClass = character.class || 'warrior';
        const characterLevel = character.level || 1;

        // Determine regeneration context
        const context = this.getRegenerationContext(character);

        // Get base regeneration rate for context
        let baseRate = this.regenerationConfig.baseRates[context] || this.regenerationConfig.baseRates.exploration;

        // Apply class multiplier
        const classMultiplier = this.regenerationConfig.classMultipliers[characterClass] || 1.0;

        // Apply level bonus
        const levelBonus = characterLevel * this.regenerationConfig.levelBonus;

        // Apply status effect modifiers
        const statusMultiplier = this.getStatusEffectMultiplier(character);

        // Apply equipment bonuses
        const equipmentBonus = this.getEquipmentMPRegenBonus(character);

        // Calculate final regeneration rate
        const finalRate = (baseRate + levelBonus + equipmentBonus) * classMultiplier * statusMultiplier;

        // Calculate regeneration amount
        const regenAmount = Math.ceil(maxMP * finalRate);

        return Math.max(0, regenAmount);
    }

    /**
     * Determine the regeneration context based on game state
     */
    getRegenerationContext(character) {
        // Check if in combat
        if (this.gameState.combat && this.gameState.combat.active) {
            return 'combat';
        }

        // Check if character is resting (could be implemented as a status effect or game state)
        if (this.isCharacterResting(character)) {
            return 'rest';
        }

        // Check if character is meditating (enhanced rest state)
        if (this.isCharacterMeditating(character)) {
            return 'meditation';
        }

        // Default to exploration
        return 'exploration';
    }

    /**
     * Check if character is in resting state
     */
    isCharacterResting(character) {
        // Check for resting status effect or specific game states
        if (character.statusEffects) {
            return character.statusEffects.some(effect => effect.type === 'resting');
        }

        // Could also check world state (e.g., in an inn, camp, sanctuary)
        if (this.gameState.world && this.gameState.world.currentArea) {
            const areaId = this.gameState.world.currentArea;
            // Areas like 'inn', 'sanctuary', 'camp' could provide rest bonuses
            return ['inn', 'sanctuary', 'camp', 'temple'].includes(areaId);
        }

        return false;
    }

    /**
     * Check if character is in meditation state
     */
    isCharacterMeditating(character) {
        if (character.statusEffects) {
            return character.statusEffects.some(effect =>
                effect.type === 'meditation' || effect.type === 'focused');
        }
        return false;
    }

    /**
     * Calculate status effect multiplier for MP regeneration
     */
    getStatusEffectMultiplier(character) {
        if (!character.statusEffects || character.statusEffects.length === 0) {
            return 1.0;
        }

        let multiplier = 1.0;

        for (const effect of character.statusEffects) {
            const effectMultiplier = this.regenerationConfig.statusEffects[effect.type];
            if (effectMultiplier !== undefined) {
                // Some effects multiply, others replace
                if (effect.type === 'cursed' || effect.type === 'poisoned' || effect.type === 'exhausted') {
                    multiplier *= effectMultiplier;
                } else {
                    multiplier *= effectMultiplier;
                }
            }
        }

        return Math.max(0.01, multiplier); // Minimum 1% regeneration
    }

    /**
     * Get equipment MP regeneration bonus
     */
    getEquipmentMPRegenBonus(character) {
        let bonus = 0;

        // Check equipped items for MP regeneration bonuses
        if (character.equipment) {
            for (const [slot, item] of Object.entries(character.equipment)) {
                if (item && item.effects) {
                    for (const effect of item.effects) {
                        if (effect.type === 'mp_regeneration') {
                            bonus += effect.value || 0;
                        }
                    }
                }
            }
        }

        // Check inventory for consumable MP regen items
        if (character.inventory && character.inventory.activeEffects) {
            for (const effect of character.inventory.activeEffects) {
                if (effect.type === 'mp_regeneration') {
                    bonus += effect.value || 0;
                }
            }
        }

        return bonus;
    }

    /**
     * Apply temporary MP regeneration boost from consumables
     */
    applyMPRegenerationBoost(character, boostType, duration = 30000) {
        if (!character.statusEffects) {
            character.statusEffects = [];
        }

        const boostEffects = {
            'mana_tea': {
                type: 'focused',
                multiplier: 1.5,
                description: 'Enhanced MP regeneration from mana tea'
            },
            'meditation_incense': {
                type: 'meditation',
                multiplier: 2.0,
                description: 'Deep meditation from burning incense'
            },
            'blessed_water': {
                type: 'blessed',
                multiplier: 1.5,
                description: 'Holy blessing enhances MP recovery'
            },
            'mana_crystal': {
                type: 'focused',
                multiplier: 3.0,
                description: 'Powerful mana crystal amplifies regeneration'
            }
        };

        const boost = boostEffects[boostType];
        if (boost) {
            character.statusEffects.push({
                type: boost.type,
                duration: Math.ceil(duration / 1000),
                source: boostType,
                appliedAt: Date.now(),
                description: boost.description
            });

            this.gameState.addNotification(
                `${character.name || 'Character'} gains enhanced MP regeneration!`,
                'buff'
            );
        }
    }

    /**
     * Calculate MP regeneration efficiency rating
     */
    getMPEfficiencyRating(character) {
        const regenInfo = this.getMPRegenerationInfo(character);
        const context = regenInfo.context;
        const rate = regenInfo.rate;

        // Rate MP efficiency on a scale of 1-10
        let rating = 1;

        switch (context) {
            case 'meditation':
                rating = Math.min(10, 8 + (rate / 20)); // 8-10 rating for meditation
                break;
            case 'rest':
                rating = Math.min(9, 6 + (rate / 15)); // 6-9 rating for rest
                break;
            case 'exploration':
                rating = Math.min(6, 3 + (rate / 10)); // 3-6 rating for exploration
                break;
            case 'combat':
                rating = Math.min(3, 1 + (rate / 5)); // 1-3 rating for combat
                break;
        }

        return Math.round(rating);
    }

    /**
     * Get strategic MP management recommendations
     */
    getMPManagementRecommendations(character) {
        const regenInfo = this.getMPRegenerationInfo(character);
        const mpPercent = (character.stats.mp / character.stats.maxMp) * 100;
        const recommendations = [];

        if (mpPercent < 25) {
            recommendations.push({
                priority: 'critical',
                action: 'rest',
                reason: 'MP critically low - rest immediately for faster recovery'
            });
        } else if (mpPercent < 50) {
            recommendations.push({
                priority: 'high',
                action: 'conserve',
                reason: 'MP below half - use spells sparingly'
            });
        }

        if (regenInfo.context === 'exploration' && mpPercent < 75) {
            recommendations.push({
                priority: 'medium',
                action: 'rest',
                reason: 'Consider resting before next encounter'
            });
        }

        if (this.gameState.combat && this.gameState.combat.active && mpPercent < 30) {
            recommendations.push({
                priority: 'high',
                action: 'items',
                reason: 'Use MP recovery items during combat'
            });
        }

        return recommendations;
    }

    /**
     * Simulate MP recovery time for strategic planning
     */
    simulateMPRecovery(character, targetPercent = 100) {
        const currentMP = character.stats.mp;
        const maxMP = character.stats.maxMp;
        const targetMP = Math.floor(maxMP * (targetPercent / 100));
        const mpNeeded = targetMP - currentMP;

        if (mpNeeded <= 0) return { timeSeconds: 0, method: 'already_full' };

        const contexts = ['exploration', 'rest', 'meditation'];
        const simulations = {};

        for (const context of contexts) {
            // Temporarily set context and calculate regeneration
            const tempCharacter = { ...character };
            const regenAmount = this.calculateMPRegeneration(tempCharacter);

            if (regenAmount > 0) {
                const timeSeconds = Math.ceil(mpNeeded / regenAmount);
                simulations[context] = {
                    timeSeconds: timeSeconds,
                    timeMinutes: Math.ceil(timeSeconds / 60),
                    regenPerSecond: regenAmount
                };
            } else {
                simulations[context] = {
                    timeSeconds: Infinity,
                    timeMinutes: Infinity,
                    regenPerSecond: 0
                };
            }
        }

        return simulations;
    }

    /**
     * Manually trigger rest for enhanced MP recovery
     */
    startResting(character, duration = 10000) {
        if (!character.statusEffects) {
            character.statusEffects = [];
        }

        // Add resting status effect
        character.statusEffects.push({
            type: 'resting',
            duration: Math.ceil(duration / 1000), // Convert to seconds
            source: 'rest',
            appliedAt: Date.now()
        });

        this.gameState.addNotification(
            `${character.name || 'Character'} begins resting to recover MP`,
            'info'
        );
    }

    /**
     * Manually trigger meditation for maximum MP recovery
     */
    startMeditation(character, duration = 5000) {
        if (!character.statusEffects) {
            character.statusEffects = [];
        }

        // Add meditation status effect
        character.statusEffects.push({
            type: 'meditation',
            duration: Math.ceil(duration / 1000), // Convert to seconds
            source: 'meditation',
            appliedAt: Date.now()
        });

        this.gameState.addNotification(
            `${character.name || 'Character'} enters deep meditation`,
            'info'
        );
    }

    /**
     * Get MP regeneration info for UI display
     */
    getMPRegenerationInfo(character) {
        const context = this.getRegenerationContext(character);
        const regenAmount = this.calculateMPRegeneration(character);
        const regenRate = character.stats.maxMp > 0 ? (regenAmount / character.stats.maxMp) * 100 : 0;

        return {
            context: context,
            amount: regenAmount,
            rate: regenRate,
            timeToFull: character.stats.maxMp > 0 && regenAmount > 0
                ? Math.ceil((character.stats.maxMp - character.stats.mp) / regenAmount)
                : Infinity
        };
    }

    // ================================================
    // SPELL LEARNING SYSTEM
    // ================================================

    /**
     * Check if a character can learn a spell
     */
    canLearnSpell(character, spellId) {
        if (typeof SpellData === 'undefined') {
            return { canLearn: false, reason: 'Spell data unavailable' };
        }

        const spell = SpellData.getSpell(spellId);
        if (!spell) {
            return { canLearn: false, reason: 'Spell not found' };
        }

        // Check if already learned
        if (this.hasLearnedSpell(character, spellId)) {
            return { canLearn: false, reason: 'Spell already learned' };
        }

        // Check class requirement
        const characterClass = character.class || 'warrior';
        if (!spell.availableClasses.includes(characterClass)) {
            return { canLearn: false, reason: `Class ${characterClass} cannot learn this spell` };
        }

        // Check level requirement
        const characterLevel = character.level || 1;
        if (characterLevel < spell.learnLevel) {
            return { canLearn: false, reason: `Requires level ${spell.learnLevel} (current: ${characterLevel})` };
        }

        return { canLearn: true };
    }

    /**
     * Learn a spell for a character with enhanced acquisition tracking
     */
    learnSpellForCharacter(character, spellId, source = 'level_up', additionalData = {}) {
        const validation = this.canLearnSpell(character, spellId, source, additionalData);
        if (!validation.canLearn) {
            return { success: false, reason: validation.reason };
        }

        // Initialize learned spells array if needed
        if (!character.learnedSpells) {
            character.learnedSpells = [];
        }

        // Create spell learning entry
        const learnEntry = {
            spellId: spellId,
            learnedAt: character.level || 1,
            source: source,
            timestamp: Date.now(),
            ...additionalData
        };

        // Add source-specific data
        switch (source) {
            case 'scroll':
                learnEntry.scrollType = additionalData.scrollType || 'basic';
                learnEntry.scrollRarity = additionalData.scrollRarity || 'common';
                break;
            case 'npc_purchase':
                learnEntry.npcId = additionalData.npcId;
                learnEntry.cost = additionalData.cost;
                learnEntry.currency = additionalData.currency || 'gold';
                break;
            case 'quest_reward':
                learnEntry.questId = additionalData.questId;
                learnEntry.questName = additionalData.questName;
                break;
            case 'loot_drop':
                learnEntry.dropSource = additionalData.dropSource;
                learnEntry.dropLocation = additionalData.dropLocation;
                break;
            case 'trainer':
                learnEntry.trainerId = additionalData.trainerId;
                learnEntry.trainingCost = additionalData.trainingCost;
                break;
        }

        // Add spell to learned spells
        character.learnedSpells.push(learnEntry);

        // Process source-specific costs and requirements
        const acquisitionResult = this.processSpellAcquisition(character, spellId, source, additionalData);
        if (!acquisitionResult.success) {
            // Remove the spell if acquisition processing failed
            character.learnedSpells.pop();
            return acquisitionResult;
        }

        // Add appropriate notification
        const spell = SpellData.getSpell(spellId);
        this.addSpellLearnedNotification(character, spell, source, additionalData);

        return { success: true, learnEntry: learnEntry };
    }

    /**
     * Enhanced spell learning validation with source-specific checks
     */
    canLearnSpell(character, spellId, source = 'level_up', additionalData = {}) {
        if (typeof SpellData === 'undefined') {
            return { canLearn: false, reason: 'Spell data unavailable' };
        }

        const spell = SpellData.getSpell(spellId);
        if (!spell) {
            return { canLearn: false, reason: 'Spell not found' };
        }

        // Check if already learned
        if (this.hasLearnedSpell(character, spellId)) {
            return { canLearn: false, reason: 'Spell already learned' };
        }

        // Check class requirement
        const characterClass = character.class || 'warrior';
        if (!spell.availableClasses.includes(characterClass)) {
            return { canLearn: false, reason: `Class ${characterClass} cannot learn this spell` };
        }

        // Source-specific validation
        const sourceValidation = this.validateSpellAcquisitionSource(character, spell, source, additionalData);
        if (!sourceValidation.valid) {
            return { canLearn: false, reason: sourceValidation.reason };
        }

        return { canLearn: true };
    }

    /**
     * Validate spell acquisition based on source
     */
    validateSpellAcquisitionSource(character, spell, source, additionalData) {
        switch (source) {
            case 'level_up':
                return this.validateLevelUpAcquisition(character, spell);

            case 'scroll':
                return this.validateScrollAcquisition(character, spell, additionalData);

            case 'npc_purchase':
                return this.validateNPCPurchase(character, spell, additionalData);

            case 'quest_reward':
                return this.validateQuestReward(character, spell, additionalData);

            case 'loot_drop':
                return this.validateLootDrop(character, spell, additionalData);

            case 'trainer':
                return this.validateTrainerLearning(character, spell, additionalData);

            case 'book':
            case 'tome':
                return this.validateBookLearning(character, spell, additionalData);

            default:
                return { valid: true }; // Allow unknown sources
        }
    }

    /**
     * Validate level-up spell acquisition
     */
    validateLevelUpAcquisition(character, spell) {
        const characterLevel = character.level || 1;
        if (characterLevel < spell.learnLevel) {
            return { valid: false, reason: `Requires level ${spell.learnLevel} (current: ${characterLevel})` };
        }
        return { valid: true };
    }

    /**
     * Validate scroll-based spell acquisition
     */
    validateScrollAcquisition(character, spell, additionalData) {
        // Scrolls may have level restrictions lower than normal learning
        const scrollMinLevel = Math.max(1, spell.learnLevel - 2); // Can learn 2 levels early from scrolls
        if ((character.level || 1) < scrollMinLevel) {
            return { valid: false, reason: `Scroll requires minimum level ${scrollMinLevel}` };
        }

        // Check if player has the scroll
        if (additionalData.requiresItem && !this.hasSpellScroll(character, spell.id)) {
            return { valid: false, reason: 'Spell scroll not found in inventory' };
        }

        return { valid: true };
    }

    /**
     * Validate NPC purchase
     */
    validateNPCPurchase(character, spell, additionalData) {
        const cost = additionalData.cost || 0;
        const currency = additionalData.currency || 'gold';

        // Check if player has enough currency
        if (currency === 'gold') {
            if ((this.gameState.player.gold || 0) < cost) {
                return { valid: false, reason: `Insufficient gold (need ${cost}, have ${this.gameState.player.gold || 0})` };
            }
        }

        // NPCs may have reputation or relationship requirements
        if (additionalData.requiredReputation) {
            // This would check NPC relationship system
            // For now, just return valid
        }

        return { valid: true };
    }

    /**
     * Validate quest reward acquisition
     */
    validateQuestReward(character, spell, additionalData) {
        // Quest rewards are typically always valid when offered
        // Could add checks for quest completion status
        return { valid: true };
    }

    /**
     * Validate loot drop acquisition
     */
    validateLootDrop(character, spell, additionalData) {
        // Loot drops may have special learning conditions
        const dropMinLevel = Math.max(1, spell.learnLevel - 1); // Can learn 1 level early from rare drops
        if ((character.level || 1) < dropMinLevel) {
            return { valid: false, reason: `Rare spell requires minimum level ${dropMinLevel}` };
        }

        return { valid: true };
    }

    /**
     * Validate trainer learning
     */
    validateTrainerLearning(character, spell, additionalData) {
        const cost = additionalData.trainingCost || 0;

        // Check gold cost
        if ((this.gameState.player.gold || 0) < cost) {
            return { valid: false, reason: `Insufficient gold for training (need ${cost})` };
        }

        // Trainers might have prerequisite spells
        if (additionalData.prerequisiteSpells) {
            for (const prereq of additionalData.prerequisiteSpells) {
                if (!this.hasLearnedSpell(character, prereq)) {
                    return { valid: false, reason: `Must learn ${prereq} first` };
                }
            }
        }

        return { valid: true };
    }

    /**
     * Validate book/tome learning
     */
    validateBookLearning(character, spell, additionalData) {
        // Books might require intelligence or specific stats
        if (additionalData.requiredIntelligence) {
            const intelligence = character.stats.intelligence || 10;
            if (intelligence < additionalData.requiredIntelligence) {
                return { valid: false, reason: `Requires ${additionalData.requiredIntelligence} intelligence` };
            }
        }

        return { valid: true };
    }

    /**
     * Process spell acquisition costs and effects
     */
    processSpellAcquisition(character, spellId, source, additionalData) {
        switch (source) {
            case 'scroll':
                return this.processScrollAcquisition(character, spellId, additionalData);

            case 'npc_purchase':
                return this.processNPCPurchase(character, spellId, additionalData);

            case 'trainer':
                return this.processTrainerLearning(character, spellId, additionalData);

            case 'book':
            case 'tome':
                return this.processBookLearning(character, spellId, additionalData);

            default:
                return { success: true }; // No special processing needed
        }
    }

    /**
     * Process scroll-based acquisition
     */
    processScrollAcquisition(character, spellId, additionalData) {
        if (additionalData.requiresItem) {
            // Remove scroll from inventory
            const scrollId = `spell_scroll_${spellId}`;
            if (!this.gameState.removeItem(scrollId, 1)) {
                return { success: false, reason: 'Failed to consume spell scroll' };
            }
        }

        return { success: true };
    }

    /**
     * Process NPC purchase
     */
    processNPCPurchase(character, spellId, additionalData) {
        const cost = additionalData.cost || 0;
        const currency = additionalData.currency || 'gold';

        if (currency === 'gold') {
            this.gameState.removeGold(cost);
        }

        return { success: true };
    }

    /**
     * Process trainer learning
     */
    processTrainerLearning(character, spellId, additionalData) {
        const cost = additionalData.trainingCost || 0;
        this.gameState.removeGold(cost);

        return { success: true };
    }

    /**
     * Process book learning
     */
    processBookLearning(character, spellId, additionalData) {
        // Books might be consumed or remain in inventory
        if (additionalData.consumeBook) {
            const bookId = additionalData.bookId || `spell_book_${spellId}`;
            this.gameState.removeItem(bookId, 1);
        }

        return { success: true };
    }

    /**
     * Add source-appropriate notification for spell learning
     */
    addSpellLearnedNotification(character, spell, source, additionalData) {
        let message = `Learned spell: ${spell.name}!`;
        let type = 'success';

        switch (source) {
            case 'scroll':
                message = `📜 Learned ${spell.name} from spell scroll!`;
                type = 'scroll';
                break;
            case 'npc_purchase':
                message = `💰 Purchased spell: ${spell.name}!`;
                type = 'purchase';
                break;
            case 'quest_reward':
                message = `🎖️ Quest reward: Learned ${spell.name}!`;
                type = 'quest';
                break;
            case 'loot_drop':
                message = `💎 Rare discovery: Learned ${spell.name}!`;
                type = 'rare';
                break;
            case 'trainer':
                message = `🎓 Training complete: Learned ${spell.name}!`;
                type = 'training';
                break;
            case 'book':
            case 'tome':
                message = `📚 Studied and learned: ${spell.name}!`;
                type = 'study';
                break;
        }

        this.gameState.addNotification(message, type);
    }

    /**
     * Check if character has a specific spell scroll
     */
    hasSpellScroll(character, spellId) {
        const scrollId = `spell_scroll_${spellId}`;
        return this.gameState.hasItem(scrollId);
    }

    // ================================================
    // SPELL ACQUISITION MANAGEMENT
    // ================================================

    /**
     * Generate loot-based spell learning opportunities
     */
    generateSpellLootOpportunities(character, sourceType, sourceLevel = 1) {
        const opportunities = [];
        const characterClass = character.class || 'warrior';
        const characterLevel = character.level || 1;

        // Get spells that could be found as loot
        if (typeof SpellData !== 'undefined') {
            for (const [spellId, spell] of Object.entries(SpellData.spells)) {
                if (spell.availableClasses.includes(characterClass) &&
                    !this.hasLearnedSpell(character, spellId)) {

                    // Calculate drop chance based on spell rarity and source
                    let dropChance = this.calculateSpellDropChance(spell, sourceType, sourceLevel, characterLevel);

                    if (dropChance > 0 && Math.random() < dropChance) {
                        opportunities.push({
                            spellId: spellId,
                            spell: spell,
                            dropChance: dropChance,
                            source: 'loot_drop',
                            sourceType: sourceType,
                            sourceLevel: sourceLevel
                        });
                    }
                }
            }
        }

        return opportunities;
    }

    /**
     * Calculate spell drop chance based on various factors
     */
    calculateSpellDropChance(spell, sourceType, sourceLevel, characterLevel) {
        // Base drop chances by source type
        const baseChances = {
            'monster': 0.02,      // 2% base chance from monsters
            'chest': 0.15,        // 15% base chance from chests
            'boss': 0.25,         // 25% base chance from bosses
            'rare_chest': 0.40,   // 40% base chance from rare chests
            'dungeon_boss': 0.60  // 60% base chance from dungeon bosses
        };

        let baseChance = baseChances[sourceType] || 0.05;

        // Adjust for spell level vs character level
        const levelDiff = spell.learnLevel - characterLevel;
        if (levelDiff > 5) {
            baseChance *= 0.1; // Much lower chance for high-level spells
        } else if (levelDiff > 2) {
            baseChance *= 0.5; // Lower chance for spells above character level
        } else if (levelDiff < -5) {
            baseChance *= 0.2; // Lower chance for very low-level spells
        }

        // Adjust for source level
        const sourceLevelBonus = Math.min(2.0, 1 + (sourceLevel - characterLevel) * 0.1);
        baseChance *= sourceLevelBonus;

        return Math.min(0.8, baseChance); // Cap at 80%
    }

    /**
     * Generate NPC spell shop inventory
     */
    generateNPCSpellShop(npcId, npcLevel = 5, specialization = null) {
        const shopInventory = [];
        const playerLevel = this.gameState.player.level || 1;

        if (typeof SpellData !== 'undefined') {
            for (const [spellId, spell] of Object.entries(SpellData.spells)) {
                // Check if NPC would sell this spell
                if (this.shouldNPCSellSpell(spell, npcLevel, specialization, playerLevel)) {
                    const cost = this.calculateSpellPurchaseCost(spell, npcLevel);

                    shopInventory.push({
                        spellId: spellId,
                        spell: spell,
                        cost: cost,
                        currency: 'gold',
                        npcId: npcId,
                        availability: this.getSpellAvailability(spell, npcLevel)
                    });
                }
            }
        }

        return shopInventory.sort((a, b) => a.cost - b.cost); // Sort by cost
    }

    /**
     * Check if NPC should sell a specific spell
     */
    shouldNPCSellSpell(spell, npcLevel, specialization, playerLevel) {
        // NPCs typically sell spells at or below their level
        if (spell.learnLevel > npcLevel + 2) return false;

        // Check specialization
        if (specialization) {
            const specializationTypes = {
                'fire_mage': ['fire', 'offensive'],
                'healer': ['healing', 'holy'],
                'scholar': ['utility', 'knowledge'],
                'combat_trainer': ['physical', 'self_buff'],
                'elementalist': ['fire', 'ice', 'thunder']
            };

            const npcTypes = specializationTypes[specialization] || [];
            if (npcTypes.length > 0 && !npcTypes.includes(spell.type) && !npcTypes.includes(spell.element)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculate spell purchase cost from NPCs
     */
    calculateSpellPurchaseCost(spell, npcLevel) {
        // Base cost calculation
        let baseCost = spell.learnLevel * 100; // 100 gold per spell level

        // Adjust for spell type and rarity
        const typeMultipliers = {
            'healing': 1.2,
            'offensive': 1.0,
            'utility': 0.8,
            'defensive': 1.1
        };

        const multiplier = typeMultipliers[spell.type] || 1.0;
        baseCost *= multiplier;

        // NPC level affects pricing
        const npcPriceModifier = 1 + (npcLevel - 5) * 0.1; // ±10% per level from 5
        baseCost *= npcPriceModifier;

        return Math.round(baseCost);
    }

    /**
     * Get spell availability rating for NPC shops
     */
    getSpellAvailability(spell, npcLevel) {
        const levelDiff = npcLevel - spell.learnLevel;

        if (levelDiff >= 5) return 'common';
        if (levelDiff >= 2) return 'available';
        if (levelDiff >= 0) return 'limited';
        return 'rare';
    }

    /**
     * Process quest reward spell learning
     */
    awardQuestSpell(questId, questName, spellId) {
        const result = this.learnSpellForCharacter(
            this.gameState.player,
            spellId,
            'quest_reward',
            {
                questId: questId,
                questName: questName
            }
        );

        return result;
    }

    /**
     * Process spell learning from item use (scrolls, books)
     */
    learnSpellFromItem(itemId, itemType = 'scroll') {
        // Extract spell ID from item ID
        let spellId = null;

        if (itemId.startsWith('spell_scroll_')) {
            spellId = itemId.replace('spell_scroll_', '');
        } else if (itemId.startsWith('spell_book_')) {
            spellId = itemId.replace('spell_book_', '');
        } else if (itemId.startsWith('spell_tome_')) {
            spellId = itemId.replace('spell_tome_', '');
        }

        if (!spellId) {
            return { success: false, reason: 'Invalid spell item' };
        }

        // Determine learning parameters based on item type
        let source = itemType;
        let additionalData = {
            requiresItem: true
        };

        if (itemType === 'scroll') {
            additionalData.scrollType = 'basic';
            additionalData.scrollRarity = 'common';
        } else if (itemType === 'book' || itemType === 'tome') {
            additionalData.consumeBook = true;
            additionalData.bookId = itemId;
        }

        return this.learnSpellForCharacter(
            this.gameState.player,
            spellId,
            source,
            additionalData
        );
    }

    /**
     * Get all available spell learning opportunities for a character
     */
    getAllSpellLearningOpportunities(character) {
        const opportunities = {
            levelUp: [],
            scrolls: [],
            books: [],
            npcs: [],
            trainers: []
        };

        if (typeof SpellData !== 'undefined') {
            for (const [spellId, spell] of Object.entries(SpellData.spells)) {
                if (spell.availableClasses.includes(character.class || 'warrior') &&
                    !this.hasLearnedSpell(character, spellId)) {

                    // Level up opportunities
                    if (character.level >= spell.learnLevel) {
                        opportunities.levelUp.push({
                            spellId: spellId,
                            spell: spell,
                            method: 'level_up'
                        });
                    }

                    // Scroll opportunities
                    if (this.hasSpellScroll(character, spellId)) {
                        opportunities.scrolls.push({
                            spellId: spellId,
                            spell: spell,
                            method: 'scroll',
                            itemId: `spell_scroll_${spellId}`
                        });
                    }

                    // Book opportunities
                    const bookId = `spell_book_${spellId}`;
                    if (this.gameState.hasItem(bookId)) {
                        opportunities.books.push({
                            spellId: spellId,
                            spell: spell,
                            method: 'book',
                            itemId: bookId
                        });
                    }
                }
            }
        }

        return opportunities;
    }

    /**
     * Get spell learning statistics for character progression tracking
     */
    getSpellLearningStats(character) {
        if (!character.learnedSpells) return null;

        const stats = {
            totalSpells: character.learnedSpells.length,
            sourceBreakdown: {},
            classProgress: {},
            recentLearning: []
        };

        // Analyze learning sources
        for (const entry of character.learnedSpells) {
            const source = entry.source || 'unknown';
            stats.sourceBreakdown[source] = (stats.sourceBreakdown[source] || 0) + 1;

            // Track recent learning (last 7 days)
            const daysSince = (Date.now() - entry.timestamp) / (1000 * 60 * 60 * 24);
            if (daysSince <= 7) {
                stats.recentLearning.push(entry);
            }
        }

        // Calculate class progression
        if (typeof SpellData !== 'undefined') {
            const characterClass = character.class || 'warrior';
            let totalAvailable = 0;

            for (const [spellId, spell] of Object.entries(SpellData.spells)) {
                if (spell.availableClasses.includes(characterClass)) {
                    totalAvailable++;
                }
            }

            stats.classProgress = {
                learned: stats.totalSpells,
                available: totalAvailable,
                percentage: Math.round((stats.totalSpells / totalAvailable) * 100)
            };
        }

        return stats;
    }

    /**
     * Check if character has learned a spell
     */
    hasLearnedSpell(character, spellId) {
        if (!character.learnedSpells) return false;
        return character.learnedSpells.some(entry => entry.spellId === spellId);
    }

    /**
     * Get all learned spells for a character
     */
    getLearnedSpells(character) {
        if (!character.learnedSpells) return [];

        return character.learnedSpells.map(entry => {
            const spellData = SpellData.getSpell(entry.spellId);
            return {
                ...entry,
                spellData: spellData
            };
        }).filter(entry => entry.spellData); // Filter out invalid spells
    }

    /**
     * Learn spells available at level up
     */
    learnSpellsOnLevelUp(character, newLevel) {
        if (typeof SpellData === 'undefined') return [];

        const characterClass = character.class || 'warrior';
        const learnedSpells = [];

        // Find spells that can be learned at this level
        const availableSpells = SpellData.getSpellsForLevel(characterClass, newLevel);

        for (const spellId of availableSpells) {
            const spell = SpellData.getSpell(spellId);
            if (spell && spell.learnLevel === newLevel && !this.hasLearnedSpell(character, spellId)) {
                const result = this.learnSpellForCharacter(character, spellId, 'level_up');
                if (result.success) {
                    learnedSpells.push(spellId);
                }
            }
        }

        return learnedSpells;
    }

    // ================================================
    // SPELL CASTING VALIDATION
    // ================================================

    /**
     * Validate if a spell can be cast
     */
    canCastSpell(caster, spellId, target = null) {
        if (typeof SpellData === 'undefined') {
            return { canCast: false, reason: 'Spell data unavailable' };
        }

        const spell = SpellData.getSpell(spellId);
        if (!spell) {
            return { canCast: false, reason: 'Spell not found' };
        }

        // Check if spell is learned
        if (!this.hasLearnedSpell(caster, spellId)) {
            return { canCast: false, reason: 'Spell not learned' };
        }

        // Check MP cost
        if (!this.hasEnoughMP(caster, spell.mpCost)) {
            return { canCast: false, reason: `Insufficient MP (need ${spell.mpCost}, have ${caster.stats.mp || 0})` };
        }

        // Check cooldown
        if (this.isSpellOnCooldown(caster, spellId)) {
            const remaining = this.getSpellCooldownRemaining(caster, spellId);
            return { canCast: false, reason: `Spell on cooldown (${Math.ceil(remaining)}s remaining)` };
        }

        // Check target validity
        const targetValidation = this.validateSpellTarget(spell, target);
        if (!targetValidation.valid) {
            return { canCast: false, reason: targetValidation.reason };
        }

        // Check status conditions that prevent casting
        if (this.hasSpellBlockingStatus(caster)) {
            return { canCast: false, reason: 'Cannot cast spells due to status effect' };
        }

        return { canCast: true };
    }

    /**
     * Validate spell target
     */
    validateSpellTarget(spell, target) {
        const targetType = spell.target;

        switch (targetType) {
            case 'self':
                return { valid: true };

            case 'single_ally':
            case 'single_enemy':
            case 'single_dead_ally':
                if (!target) {
                    return { valid: false, reason: 'Target required' };
                }
                // Additional target validation would go here
                return { valid: true };

            case 'all_allies':
            case 'all_enemies':
            case 'battlefield':
                return { valid: true };

            default:
                return { valid: false, reason: 'Invalid target type' };
        }
    }

    /**
     * Check if character has status effects that block spell casting
     */
    hasSpellBlockingStatus(character) {
        // Check for silence, stun, sleep, etc.
        const blockingStatuses = ['silence', 'stun', 'sleep', 'paralysis'];

        if (character.statusEffects) {
            for (const status of character.statusEffects) {
                if (blockingStatuses.includes(status.type)) {
                    return true;
                }
            }
        }

        return false;
    }

    // ================================================
    // SPELL COOLDOWN MANAGEMENT
    // ================================================

    /**
     * Start cooldown for a spell
     */
    startSpellCooldown(caster, spellId) {
        const spell = SpellData.getSpell(spellId);
        if (!spell || spell.cooldown <= 0) return;

        const casterId = caster.id || 'player';
        const cooldownKey = `${casterId}_${spellId}`;
        const expiresAt = Date.now() + (spell.cooldown * 1000);

        this.spellCooldowns.set(cooldownKey, expiresAt);
    }

    /**
     * Check if spell is on cooldown
     */
    isSpellOnCooldown(caster, spellId) {
        const casterId = caster.id || 'player';
        const cooldownKey = `${casterId}_${spellId}`;
        const expiresAt = this.spellCooldowns.get(cooldownKey);

        if (!expiresAt) return false;

        if (Date.now() >= expiresAt) {
            this.spellCooldowns.delete(cooldownKey);
            return false;
        }

        return true;
    }

    /**
     * Get remaining cooldown time in seconds
     */
    getSpellCooldownRemaining(caster, spellId) {
        const casterId = caster.id || 'player';
        const cooldownKey = `${casterId}_${spellId}`;
        const expiresAt = this.spellCooldowns.get(cooldownKey);

        if (!expiresAt) return 0;

        const remaining = (expiresAt - Date.now()) / 1000;
        return Math.max(0, remaining);
    }

    /**
     * Clear all cooldowns for a character
     */
    clearSpellCooldowns(caster) {
        const casterId = caster.id || 'player';
        const keysToDelete = [];

        for (const [key] of this.spellCooldowns) {
            if (key.startsWith(`${casterId}_`)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.spellCooldowns.delete(key));
    }

    // ================================================
    // SPELL CASTING EXECUTION
    // ================================================

    /**
     * Cast a spell for a character
     */
    castSpellForCharacter(caster, spellId, target = null) {
        const validation = this.canCastSpell(caster, spellId, target);
        if (!validation.canCast) {
            return { success: false, reason: validation.reason };
        }

        const spell = SpellData.getSpell(spellId);

        // Consume MP
        if (!this.consumeMP(caster, spell.mpCost)) {
            return { success: false, reason: 'Failed to consume MP' };
        }

        // Start cooldown
        this.startSpellCooldown(caster, spellId);

        // Apply spell effects
        const effects = this.applySpellEffects(caster, spell, target);

        // Add notification
        this.gameState.addNotification(`${caster.name || 'Player'} cast ${spell.name}!`, 'info');

        return {
            success: true,
            spell: spell,
            caster: caster,
            target: target,
            effects: effects,
            mpConsumed: spell.mpCost
        };
    }

    // ================================================
    // ENHANCED SPELL EFFECT SYSTEM
    // ================================================

    /**
     * Apply spell effects with enhanced processing
     */
    applySpellEffects(caster, spell, target) {
        const appliedEffects = [];

        console.log('🔍 applySpellEffects called with:', {
            caster: caster?.name || 'Unknown',
            spell: spell?.name || 'Unknown',
            spellEffects: spell?.effects,
            target: target?.name || 'Unknown'
        });

        // Pre-process effects for synergies and combinations
        const processedEffects = this.preprocessSpellEffects(caster, spell, spell.effects);
        console.log('🔍 Preprocessed effects:', processedEffects);

        for (const effect of processedEffects) {
            console.log('🔍 Processing effect:', effect);
            const result = this.applySpellEffect(caster, spell, effect, target);
            console.log('🔍 applySpellEffect result:', result);
            if (result) {
                appliedEffects.push(result);
                console.log('🔍 Added effect to appliedEffects, total:', appliedEffects.length);

                // Check for effect synergies and chains
                const chainEffects = this.checkEffectChains(caster, spell, effect, target, result);
                if (chainEffects.length > 0) {
                    appliedEffects.push(...chainEffects);
                }
            } else {
                console.log('⚠️ applySpellEffect returned null/falsy for effect:', effect);
            }
        }

        // Process combo effects
        const comboEffects = this.processEffectCombos(caster, spell, appliedEffects, target);
        if (comboEffects.length > 0) {
            appliedEffects.push(...comboEffects);
        }

        console.log('🔍 Final appliedEffects:', appliedEffects);
        return appliedEffects;
    }

    /**
     * Preprocess spell effects for scaling and modifications
     */
    preprocessSpellEffects(caster, spell, effects) {
        return effects.map(effect => {
            const processedEffect = { ...effect };

            // Apply caster level scaling
            processedEffect.scaledPower = this.calculateScaledPower(caster, spell, effect);

            // Apply spell mastery bonuses
            processedEffect.masteryBonus = this.calculateMasteryBonus(caster, spell);

            // Apply equipment bonuses
            processedEffect.equipmentBonus = this.getEquipmentSpellBonus(caster, spell.type);

            // Apply environmental modifiers
            processedEffect.environmentalModifier = this.getEnvironmentalModifier(caster, spell);

            return processedEffect;
        });
    }

    /**
     * Calculate scaled power for spell effects
     */
    calculateScaledPower(caster, spell, effect) {
        let basePower = effect.power || 0;

        // Apply stat scaling
        if (effect.scaling && effect.scalingMultiplier) {
            const scalingStat = caster.stats[effect.scaling] || 0;
            basePower += scalingStat * effect.scalingMultiplier;
        }

        // Apply level scaling
        if (effect.levelScaling) {
            const casterLevel = caster.level || 1;
            basePower += casterLevel * effect.levelScaling;
        }

        // Apply spell level scaling
        if (effect.spellLevelScaling) {
            basePower += spell.learnLevel * effect.spellLevelScaling;
        }

        return Math.max(1, Math.floor(basePower));
    }

    /**
     * Calculate spell mastery bonus
     */
    calculateMasteryBonus(caster, spell) {
        // Check how often the caster has used this spell
        const spellUsage = this.getSpellUsageCount(caster, spell.id);

        // Mastery bonus increases with usage (1% per use, max 50%)
        const masteryBonus = Math.min(0.5, spellUsage * 0.01);

        return masteryBonus;
    }

    /**
     * Get equipment-based spell bonuses
     */
    getEquipmentSpellBonus(caster, spellType) {
        let bonus = 0;

        if (caster.equipment) {
            for (const [slot, item] of Object.entries(caster.equipment)) {
                if (item && item.effects) {
                    for (const effect of item.effects) {
                        if (effect.type === 'spell_damage_bonus' &&
                            (!effect.spellType || effect.spellType === spellType)) {
                            bonus += effect.value || 0;
                        }
                    }
                }
            }
        }

        return bonus;
    }

    /**
     * Get environmental modifiers for spells
     */
    getEnvironmentalModifier(caster, spell) {
        let modifier = 1.0;

        // Check current area for environmental effects
        if (this.gameState.world && this.gameState.world.currentArea) {
            const areaModifiers = {
                'fire_temple': { fire: 1.3, ice: 0.7 },
                'ice_cavern': { ice: 1.3, fire: 0.7 },
                'lightning_tower': { thunder: 1.5 },
                'holy_sanctuary': { holy: 1.4, dark: 0.6 },
                'cursed_ruins': { dark: 1.4, holy: 0.6 },
                'nature_grove': { nature: 1.3, healing: 1.2 }
            };

            const area = this.gameState.world.currentArea;
            const areaEffects = areaModifiers[area];

            if (areaEffects && areaEffects[spell.element]) {
                modifier *= areaEffects[spell.element];
            }
        }

        return modifier;
    }

    /**
     * Enhanced spell effect application with comprehensive effect types
     */
    applySpellEffect(caster, spell, effect, target) {
        switch (effect.type) {
            case 'damage':
                return this.applyDamageEffect(caster, spell, effect, target);

            case 'heal':
                return this.applyHealEffect(caster, spell, effect, target);

            case 'stat_boost':
            case 'stat_debuff':
                return this.applyStatEffect(caster, spell, effect, target);

            case 'status_inflict':
            case 'status_chance':
                return this.applyStatusEffect(caster, spell, effect, target);

            case 'remove_status':
                return this.applyStatusRemoval(caster, spell, effect, target);

            case 'mp_restore':
                return this.applyMPRestoreEffect(caster, spell, effect, target);

            case 'mp_drain':
                return this.applyMPDrainEffect(caster, spell, effect, target);

            case 'revive':
                return this.applyReviveEffect(caster, spell, effect, target);

            case 'teleport':
                return this.applyTeleportEffect(caster, spell, effect, target);

            case 'summon':
                return this.applySummonEffect(caster, spell, effect, target);

            case 'transform':
                return this.applyTransformEffect(caster, spell, effect, target);

            case 'area_damage':
                return this.applyAreaDamageEffect(caster, spell, effect, target);

            case 'chain_damage':
                return this.applyChainDamageEffect(caster, spell, effect, target);

            case 'absorb_damage':
                return this.applyAbsorbEffect(caster, spell, effect, target);

            case 'reflect_damage':
                return this.applyReflectEffect(caster, spell, effect, target);

            case 'shield':
                return this.applyShieldEffect(caster, spell, effect, target);

            case 'dispel':
                return this.applyDispelEffect(caster, spell, effect, target);

            default:
                console.warn(`Unknown spell effect type: ${effect.type}`);
                return null;
        }
    }

    /**
     * Enhanced damage effect with comprehensive scaling
     */
    applyDamageEffect(caster, spell, effect, target) {
        console.log('🔍 applyDamageEffect called with target:', target);
        if (!target) {
            console.log('⚠️ applyDamageEffect: target is null/undefined');
            return null;
        }

        // Calculate base damage using enhanced scaling
        let damage = effect.scaledPower || effect.power || 0;

        // Apply mastery bonus
        damage *= (1 + (effect.masteryBonus || 0));

        // Apply equipment bonus
        damage += effect.equipmentBonus || 0;

        // Apply environmental modifier
        damage *= effect.environmentalModifier || 1.0;

        // Apply elemental resistances/weaknesses
        damage = this.applyElementalModifiers(damage, spell.element, target);

        // Apply critical hit calculation
        const critInfo = this.calculateCriticalHit(caster, spell, effect);
        if (critInfo.isCritical) {
            damage *= critInfo.multiplier;
        }

        // Apply damage reduction from target's defenses
        damage = this.applyDamageReduction(damage, caster, target, spell.type);

        // Apply damage variance (±10%)
        const variance = 0.9 + (Math.random() * 0.2);
        damage *= variance;

        // Apply to target - handle both stats wrapper and direct properties
        const actualDamage = Math.max(1, Math.floor(damage));
        let previousHP = 0;

        if (target.stats && target.stats.hp !== undefined) {
            // Target uses stats wrapper (like player/monsters)
            previousHP = target.stats.hp || 0;
            target.stats.hp = Math.max(0, previousHP - actualDamage);
        } else if (target.hp !== undefined) {
            // Target has direct hp property (like combat enemies)
            previousHP = target.hp || 0;
            target.hp = Math.max(0, previousHP - actualDamage);
        } else {
            console.log('⚠️ Target has no HP property, cannot apply damage');
            return null;
        }

        // Check for damage over time effects
        this.applyDamageOverTime(caster, spell, effect, target);

        console.log('🔍 Damage applied successfully:', actualDamage, 'HP:', previousHP, '->', target.hp || target.stats?.hp);
        return {
            type: 'damage',
            target: target.name || 'Enemy',
            amount: actualDamage,
            isCritical: critInfo.isCritical,
            element: spell.element,
            damageType: spell.type,
            overkill: Math.max(0, actualDamage - previousHP)
        };

        return null;
    }

    /**
     * Enhanced healing effect with overhealing and scaling
     */
    applyHealEffect(caster, spell, effect, target) {
        if (!target) return null;

        // Calculate base healing using enhanced scaling
        let healing = effect.scaledPower || effect.power || 0;

        // Apply mastery bonus
        healing *= (1 + (effect.masteryBonus || 0));

        // Apply equipment bonus
        healing += effect.equipmentBonus || 0;

        // Apply environmental modifier (nature areas boost healing)
        healing *= effect.environmentalModifier || 1.0;

        // Apply class-specific healing bonuses
        const classBonus = this.getClassHealingBonus(caster);
        healing *= classBonus;

        // Apply critical healing calculation
        const critInfo = this.calculateCriticalHeal(caster, spell, effect);
        if (critInfo.isCritical) {
            healing *= critInfo.multiplier;
        }

        // Apply healing variance (±5% - less than damage)
        const variance = 0.95 + (Math.random() * 0.1);
        healing *= variance;

        // Apply to target
        if (target.stats) {
            const currentHP = target.stats.hp || 0;
            const maxHP = target.stats.maxHp || target.stats.hp || 100;
            const actualHealing = Math.min(healing, maxHP - currentHP);
            target.stats.hp = Math.min(maxHP, currentHP + actualHealing);

            // Check for healing over time effects
            this.applyHealingOverTime(caster, spell, effect, target);

            // Calculate overhealing for potential shield/absorption effects
            const overheal = Math.max(0, healing - actualHealing);

            return {
                type: 'heal',
                target: target.name || 'Target',
                amount: actualHealing,
                isCritical: critInfo.isCritical,
                overheal: overheal,
                healingType: spell.type
            };
        }

        return null;
    }

    /**
     * Apply stat modification effect
     */
    applyStatEffect(caster, spell, effect, target) {
        if (!target || !target.stats) return null;

        const statName = effect.stat;
        const amount = effect.amount || 0;
        const duration = effect.duration || 10;

        // For now, apply temporary stat modifications
        // This would need to be integrated with a status effect system
        return {
            type: effect.type,
            target: target.name || 'Target',
            stat: statName,
            amount: amount,
            duration: duration
        };
    }

    /**
     * Apply status effect
     */
    applyStatusEffect(caster, spell, effect, target) {
        if (!target) return null;

        const chance = effect.chance || 1.0;
        if (Math.random() > chance) {
            return null; // Effect didn't proc
        }

        // Initialize status effects if needed
        if (!target.statusEffects) {
            target.statusEffects = [];
        }

        const statusEffect = {
            type: effect.condition,
            duration: effect.duration || 3,
            source: spell.name,
            appliedBy: caster.name || 'Player',
            timestamp: Date.now()
        };

        target.statusEffects.push(statusEffect);

        return {
            type: 'status_applied',
            target: target.name || 'Target',
            status: effect.condition,
            duration: effect.duration
        };
    }

    /**
     * Apply status removal effect
     */
    applyStatusRemoval(caster, spell, effect, target) {
        if (!target || !target.statusEffects) return null;

        const conditionsToRemove = effect.conditions || [];
        let removedCount = 0;

        target.statusEffects = target.statusEffects.filter(status => {
            if (conditionsToRemove.includes(status.type)) {
                removedCount++;
                return false;
            }
            return true;
        });

        if (removedCount > 0) {
            return {
                type: 'status_removed',
                target: target.name || 'Target',
                conditions: conditionsToRemove,
                count: removedCount
            };
        }

        return null;
    }

    /**
     * Apply MP restoration effect
     */
    applyMPRestoreEffect(caster, spell, effect, target) {
        if (!target || !target.stats) return null;

        let mpRestore = effect.scaledPower || effect.power || 0;

        // Apply mastery and equipment bonuses
        mpRestore *= (1 + (effect.masteryBonus || 0));
        mpRestore += effect.equipmentBonus || 0;

        const currentMP = target.stats.mp || 0;
        const maxMP = target.stats.maxMp || target.stats.mp || 50;
        const actualRestore = Math.min(mpRestore, maxMP - currentMP);
        target.stats.mp = Math.min(maxMP, currentMP + actualRestore);

        return {
            type: 'mp_restore',
            target: target.name || 'Target',
            amount: actualRestore,
            overflow: Math.max(0, mpRestore - actualRestore)
        };
    }

    /**
     * Apply MP drain effect
     */
    applyMPDrainEffect(caster, spell, effect, target) {
        if (!target || !target.stats) return null;

        let mpDrain = effect.scaledPower || effect.power || 0;
        mpDrain *= (1 + (effect.masteryBonus || 0));

        const currentMP = target.stats.mp || 0;
        const actualDrain = Math.min(mpDrain, currentMP);
        target.stats.mp = Math.max(0, currentMP - actualDrain);

        // Transfer drained MP to caster if specified
        if (effect.transferToCaster && caster.stats) {
            const casterMP = caster.stats.mp || 0;
            const casterMaxMP = caster.stats.maxMp || 50;
            const transferAmount = Math.min(actualDrain * 0.5, casterMaxMP - casterMP);
            caster.stats.mp = Math.min(casterMaxMP, casterMP + transferAmount);
        }

        return {
            type: 'mp_drain',
            target: target.name || 'Target',
            amount: actualDrain,
            transferred: effect.transferToCaster
        };
    }

    /**
     * Apply revive effect
     */
    applyReviveEffect(caster, spell, effect, target) {
        if (!target || !target.stats) return null;

        // Only revive if target is dead (hp <= 0)
        if (target.stats.hp > 0) {
            return null;
        }

        const reviveHP = effect.scaledPower || effect.power || 1;
        const maxHP = target.stats.maxHp || 100;
        const restoredHP = Math.min(reviveHP, maxHP);

        target.stats.hp = restoredHP;

        // Remove death-related status effects
        if (target.statusEffects) {
            target.statusEffects = target.statusEffects.filter(status =>
                status.type !== 'dead' && status.type !== 'unconscious'
            );
        }

        return {
            type: 'revive',
            target: target.name || 'Target',
            hpRestored: restoredHP
        };
    }

    /**
     * Apply area damage effect
     */
    applyAreaDamageEffect(caster, spell, effect, target) {
        const results = [];

        // Get all targets in area (for now, assume single target)
        const targets = this.getAreaTargets(caster, spell, effect, target);

        for (const areaTarget of targets) {
            // Create a damage effect for each target
            const damageEffect = { ...effect, type: 'damage' };
            const result = this.applyDamageEffect(caster, spell, damageEffect, areaTarget);
            if (result) {
                result.isAreaDamage = true;
                results.push(result);
            }
        }

        return {
            type: 'area_damage',
            effects: results,
            targetsHit: targets.length
        };
    }

    /**
     * Apply chain damage effect
     */
    applyChainDamageEffect(caster, spell, effect, target) {
        const results = [];
        const maxChains = effect.chains || 3;
        let currentTarget = target;
        let currentDamage = effect.scaledPower || effect.power || 0;

        for (let chain = 0; chain < maxChains && currentTarget; chain++) {
            // Apply reduced damage for each chain
            const chainEffect = {
                ...effect,
                type: 'damage',
                power: Math.floor(currentDamage * Math.pow(0.8, chain))
            };

            const result = this.applyDamageEffect(caster, spell, chainEffect, currentTarget);
            if (result) {
                result.chainNumber = chain + 1;
                results.push(result);
            }

            // Get next chain target (simplified for now)
            currentTarget = this.getNextChainTarget(currentTarget, caster);
        }

        return {
            type: 'chain_damage',
            effects: results,
            totalChains: results.length
        };
    }

    /**
     * Apply shield effect
     */
    applyShieldEffect(caster, spell, effect, target) {
        if (!target) return null;

        const shieldAmount = effect.scaledPower || effect.power || 0;
        const duration = effect.duration || 5;

        // Initialize shields if needed
        if (!target.shields) {
            target.shields = [];
        }

        const shield = {
            amount: shieldAmount,
            maxAmount: shieldAmount,
            duration: duration,
            type: effect.shieldType || 'magical',
            source: spell.name,
            appliedBy: caster.name || 'Player',
            timestamp: Date.now()
        };

        target.shields.push(shield);

        return {
            type: 'shield',
            target: target.name || 'Target',
            amount: shieldAmount,
            duration: duration,
            shieldType: shield.type
        };
    }

    /**
     * Apply dispel effect
     */
    applyDispelEffect(caster, spell, effect, target) {
        if (!target) return null;

        const results = [];

        // Remove magical effects
        if (target.statusEffects) {
            const beforeCount = target.statusEffects.length;
            target.statusEffects = target.statusEffects.filter(status =>
                !status.type.includes('magical') && !status.type.includes('enchant')
            );
            const removed = beforeCount - target.statusEffects.length;
            if (removed > 0) {
                results.push({ type: 'status_dispelled', count: removed });
            }
        }

        // Remove shields
        if (target.shields) {
            const shieldCount = target.shields.length;
            target.shields = [];
            if (shieldCount > 0) {
                results.push({ type: 'shields_dispelled', count: shieldCount });
            }
        }

        return {
            type: 'dispel',
            target: target.name || 'Target',
            effects: results
        };
    }

    // ================================================
    // HELPER METHODS FOR SPELL EFFECTS
    // ================================================

    /**
     * Apply elemental damage modifiers based on target resistances
     */
    applyElementalModifiers(damage, element, target) {
        if (!element || !target.resistances) return damage;

        const resistance = target.resistances[element] || 0;
        const weakness = target.weaknesses?.[element] || 0;

        // Apply resistance (reduces damage)
        damage *= (1 - resistance);

        // Apply weakness (increases damage)
        damage *= (1 + weakness);

        return Math.max(0, damage);
    }

    /**
     * Calculate critical hit for damage spells
     */
    calculateCriticalHit(caster, spell, effect) {
        const baseCritChance = 0.05; // 5% base crit chance
        const luckBonus = (caster.stats?.luck || 0) * 0.001; // 0.1% per luck point
        const spellCritBonus = effect.criticalChance || 0;

        const totalCritChance = baseCritChance + luckBonus + spellCritBonus;

        const isCritical = Math.random() < totalCritChance;
        const multiplier = isCritical ? (effect.criticalMultiplier || 2.0) : 1.0;

        return { isCritical, multiplier, chance: totalCritChance };
    }

    /**
     * Calculate critical healing
     */
    calculateCriticalHeal(caster, spell, effect) {
        const baseCritChance = 0.08; // Higher base crit for healing
        const wisdomBonus = (caster.stats?.wisdom || 0) * 0.001;
        const spellCritBonus = effect.criticalChance || 0;

        const totalCritChance = baseCritChance + wisdomBonus + spellCritBonus;

        const isCritical = Math.random() < totalCritChance;
        const multiplier = isCritical ? (effect.criticalMultiplier || 1.5) : 1.0;

        return { isCritical, multiplier, chance: totalCritChance };
    }

    /**
     * Apply damage reduction from target's defenses
     */
    applyDamageReduction(damage, caster, target, damageType) {
        if (!target.stats) return damage;

        // Physical damage reduction from armor
        if (damageType === 'physical') {
            const armor = target.stats.armor || 0;
            const reduction = armor / (armor + 100); // Diminishing returns
            damage *= (1 - reduction);
        }

        // Magical damage reduction from magic resistance
        if (damageType === 'magical') {
            const magicResist = target.stats.magicResistance || 0;
            const reduction = magicResist / (magicResist + 100);
            damage *= (1 - reduction);
        }

        return Math.max(1, damage); // Minimum 1 damage
    }

    /**
     * Get class-specific healing bonuses
     */
    getClassHealingBonus(caster) {
        const classBonus = {
            'cleric': 1.3,
            'paladin': 1.2,
            'druid': 1.25,
            'mage': 1.1,
            'warrior': 0.9,
            'rogue': 0.8
        };

        return classBonus[caster.class] || 1.0;
    }

    /**
     * Apply damage over time effects
     */
    applyDamageOverTime(caster, spell, effect, target) {
        if (!effect.dotDuration || !effect.dotDamage) return;

        if (!target.statusEffects) target.statusEffects = [];

        const dotEffect = {
            type: 'damage_over_time',
            damage: effect.dotDamage,
            duration: effect.dotDuration,
            interval: effect.dotInterval || 1,
            source: spell.name,
            element: spell.element,
            appliedBy: caster.name || 'Player',
            timestamp: Date.now()
        };

        target.statusEffects.push(dotEffect);
    }

    /**
     * Apply healing over time effects
     */
    applyHealingOverTime(caster, spell, effect, target) {
        if (!effect.hotDuration || !effect.hotHealing) return;

        if (!target.statusEffects) target.statusEffects = [];

        const hotEffect = {
            type: 'healing_over_time',
            healing: effect.hotHealing,
            duration: effect.hotDuration,
            interval: effect.hotInterval || 1,
            source: spell.name,
            appliedBy: caster.name || 'Player',
            timestamp: Date.now()
        };

        target.statusEffects.push(hotEffect);
    }

    /**
     * Get targets in area for area effects
     */
    getAreaTargets(caster, spell, effect, primaryTarget) {
        // Simplified implementation - in a full system this would check spatial positions
        const targets = [primaryTarget];

        // For now, just return primary target
        // In a full implementation, this would check for nearby enemies/allies
        // based on effect.areaSize, effect.targetType, etc.

        return targets.filter(t => t !== null);
    }

    /**
     * Get next target for chain effects
     */
    getNextChainTarget(currentTarget, caster) {
        // Simplified implementation - would need proper target selection logic
        // For now, return null to end chain
        return null;
    }

    /**
     * Check for effect chains and synergies
     */
    checkEffectChains(caster, spell, effect, target, result) {
        const chainEffects = [];

        // Example chain: Fire damage + Burn status = Extended burn
        if (effect.type === 'damage' && spell.element === 'fire' && result.amount > 20) {
            if (target.statusEffects?.some(s => s.type === 'burn')) {
                chainEffects.push({
                    type: 'status_applied',
                    target: target.name,
                    status: 'intense_burn',
                    duration: 3,
                    isChainEffect: true
                });
            }
        }

        // Example chain: Ice damage + Slow status = Freeze
        if (effect.type === 'damage' && spell.element === 'ice' && result.amount > 15) {
            if (target.statusEffects?.some(s => s.type === 'slow')) {
                chainEffects.push({
                    type: 'status_applied',
                    target: target.name,
                    status: 'frozen',
                    duration: 2,
                    isChainEffect: true
                });
            }
        }

        return chainEffects;
    }

    /**
     * Process effect combinations for enhanced results
     */
    processEffectCombos(caster, spell, appliedEffects, target) {
        const comboEffects = [];

        // Check for specific effect combinations
        const hasHealing = appliedEffects.some(e => e.type === 'heal');
        const hasDamage = appliedEffects.some(e => e.type === 'damage');
        const hasStatusEffect = appliedEffects.some(e => e.type === 'status_applied');

        // Combo: Healing + Damage = Life steal visualization
        if (hasHealing && hasDamage) {
            comboEffects.push({
                type: 'combo_effect',
                comboType: 'life_steal',
                description: 'Life force drained and restored',
                visualEffect: 'life_steal_aura'
            });
        }

        // Combo: Multiple status effects = Overwhelming debuff
        const statusCount = appliedEffects.filter(e => e.type === 'status_applied').length;
        if (statusCount >= 3) {
            comboEffects.push({
                type: 'combo_effect',
                comboType: 'overwhelming_debuff',
                description: 'Target overwhelmed by multiple effects',
                bonusDamage: 10
            });
        }

        return comboEffects;
    }

    /**
     * Get spell usage count for mastery calculation
     */
    getSpellUsageCount(caster, spellId) {
        if (!caster.spellUsage) {
            caster.spellUsage = {};
        }

        return caster.spellUsage[spellId] || 0;
    }

    /**
     * Increment spell usage for mastery tracking
     */
    incrementSpellUsage(caster, spellId) {
        if (!caster.spellUsage) {
            caster.spellUsage = {};
        }

        caster.spellUsage[spellId] = (caster.spellUsage[spellId] || 0) + 1;
    }

    // ================================================
    // UTILITY METHODS
    // ================================================

    /**
     * Get spell learning opportunities for character
     */
    getSpellLearningOpportunities(character) {
        if (typeof SpellData === 'undefined') return [];

        const characterClass = character.class || 'warrior';
        const characterLevel = character.level || 1;
        const opportunities = [];

        // Check for spells that can be learned at current level
        const availableSpells = SpellData.getSpellsForLevel(characterClass, characterLevel);

        for (const spellId of availableSpells) {
            if (!this.hasLearnedSpell(character, spellId)) {
                const spell = SpellData.getSpell(spellId);
                if (spell) {
                    opportunities.push({
                        spellId: spellId,
                        spell: spell,
                        source: 'level_up',
                        available: true
                    });
                }
            }
        }

        return opportunities;
    }

    /**
     * Update the spell system (called from game loop)
     */
    update(deltaTime) {
        this.updateMPRegeneration(deltaTime);
        this.updateSpellEffects(deltaTime);
    }

    /**
     * Update ongoing spell effects
     */
    updateSpellEffects(deltaTime) {
        // This would update status effects, buff/debuff durations, etc.
        // Implementation would depend on how status effects are structured
    }

    /**
     * Get MP percentage for UI display
     */
    getMPPercentage(character) {
        if (!character.stats.maxMp || character.stats.maxMp === 0) return 0;
        return Math.round((character.stats.mp / character.stats.maxMp) * 100);
    }

    /**
     * Get castable spells for a character
     */
    getCastableSpells(character) {
        const learnedSpells = this.getLearnedSpells(character);
        const castableSpells = [];

        for (const learned of learnedSpells) {
            const validation = this.canCastSpell(character, learned.spellId);
            castableSpells.push({
                ...learned,
                canCast: validation.canCast,
                reason: validation.reason
            });
        }

        return castableSpells;
    }

    // ================================================
    // GAMESTATE INTEGRATION METHODS
    // ================================================

    /**
     * Get spells that can be learned by player at current level
     * (Expected by GameState.checkForNewSpells)
     */
    getLearnableSpells() {
        if (typeof SpellData === 'undefined') return [];

        const player = this.gameState.player;
        const playerClass = player.class || 'warrior';
        const playerLevel = player.level || 1;
        const learnableSpells = [];

        // Find spells that can be learned at current level but haven't been learned yet
        const availableSpells = SpellData.getSpellsForLevel(playerClass, playerLevel);

        for (const spellId of availableSpells) {
            const spell = SpellData.getSpell(spellId);
            if (spell && spell.learnLevel === playerLevel && !this.hasLearnedSpell(player, spellId)) {
                learnableSpells.push({
                    id: spellId,
                    spell: spell,
                    name: spell.name
                });
            }
        }

        return learnableSpells;
    }

    /**
     * Learn a spell for the player (GameState integration)
     * (Expected by GameState.checkForNewSpells and GameState.learnSpell)
     */
    learnSpell(spellId, source = 'level_up') {
        const player = this.gameState.player;
        const result = this.learnSpellForCharacter(player, spellId, source);
        return result.success;
    }

    /**
     * Get available spells for the player
     * (Expected by GameState.getPlayerSpells)
     */
    getAvailableSpells() {
        const player = this.gameState.player;
        return this.getCastableSpells(player);
    }

    /**
     * Cast a spell (GameState integration)
     * (Expected by GameState.castSpell)
     */
    castSpell(spellId, casterId = 'player', targetId = null) {
        const caster = casterId === 'player' ? this.gameState.player : this.getMonsterById(casterId);
        if (!caster) {
            return { success: false, reason: 'Caster not found' };
        }

        // For now, we'll assume targetId is either null (self-target) or a monster reference
        const target = targetId ? (typeof targetId === 'string' ? this.getMonsterById(targetId) : targetId) : caster;
        return this.castSpellForCharacter(caster, spellId, target);
    }

    /**
     * Helper method to get monster by ID (may need implementation based on GameState structure)
     */
    getMonsterById(monsterId) {
        // Check combat enemies first (during combat)
        if (this.gameState.combat && this.gameState.combat.enemies) {
            const enemy = this.gameState.combat.enemies.find(e =>
                e.id === monsterId || e.monsterId === monsterId || e.name === monsterId
            );
            if (enemy) return enemy;
        }

        if (!this.gameState.monsters) return null;

        // Check party monsters
        if (this.gameState.monsters.party) {
            const monster = this.gameState.monsters.party.find(m => m.id === monsterId);
            if (monster) return monster;
        }

        // Check storage monsters
        if (this.gameState.monsters.storage) {
            const monster = this.gameState.monsters.storage.find(m => m.id === monsterId);
            if (monster) return monster;
        }

        return null;
    }

    /**
     * Initialize starting spells for a character
     * (Expected by GameState.setClass)
     */
    initializeStartingSpells() {
        const player = this.gameState.player;
        if (!player || !player.class) return;

        const playerClass = player.class;
        const playerLevel = player.level || 1;

        // Initialize learned spells array if needed
        if (!player.learnedSpells) {
            player.learnedSpells = [];
        }

        // Find all spells this class can learn up to current level
        if (typeof SpellData !== 'undefined') {
            const availableSpells = SpellData.getSpellsForLevel(playerClass, playerLevel);

            for (const spellId of availableSpells) {
                const spell = SpellData.getSpell(spellId);
                if (spell && spell.learnLevel <= playerLevel && !this.hasLearnedSpell(player, spellId)) {
                    const result = this.learnSpellForCharacter(player, spellId, 'class_start');
                    if (result.success) {
                        console.log(`🎓 Player learned starting spell: ${spell.name}`);
                    }
                }
            }
        }
    }

    // ================================================
    // ADDITIONAL SPELL EFFECT IMPLEMENTATIONS
    // ================================================

    /**
     * Apply teleport effect
     */
    applyTeleportEffect(caster, spell, effect, target) {
        // For now, just track the teleport attempt
        // Full implementation would need world map integration
        return {
            type: 'teleport',
            caster: caster.name || 'Player',
            destination: effect.destination || 'random',
            success: true
        };
    }

    /**
     * Apply summon effect
     */
    applySummonEffect(caster, spell, effect, target) {
        const summonData = {
            type: effect.summonType || 'familiar',
            duration: effect.duration || 10,
            hp: effect.summonHP || 20,
            damage: effect.summonDamage || 5,
            level: Math.min(caster.level || 1, effect.maxLevel || 10)
        };

        return {
            type: 'summon',
            caster: caster.name || 'Player',
            summon: summonData,
            success: true
        };
    }

    /**
     * Apply transform effect
     */
    applyTransformEffect(caster, spell, effect, target) {
        if (!target) return null;

        const transformData = {
            originalForm: target.form || 'normal',
            newForm: effect.newForm || 'polymorphed',
            duration: effect.duration || 5,
            statModifiers: effect.statModifiers || {}
        };

        // Apply temporary form change
        if (!target.transformations) {
            target.transformations = [];
        }

        target.transformations.push(transformData);
        target.form = transformData.newForm;

        return {
            type: 'transform',
            target: target.name || 'Target',
            transformation: transformData,
            success: true
        };
    }

    /**
     * Apply absorb damage effect
     */
    applyAbsorbEffect(caster, spell, effect, target) {
        if (!target || !target.stats) return null;

        const absorbAmount = effect.scaledPower || effect.power || 0;
        const duration = effect.duration || 5;

        // Add absorption shield
        if (!target.absorptions) {
            target.absorptions = [];
        }

        const absorption = {
            amount: absorbAmount,
            duration: duration,
            type: effect.absorbType || 'damage',
            transferToCaster: effect.transferToCaster || false,
            caster: caster,
            source: spell.name
        };

        target.absorptions.push(absorption);

        return {
            type: 'absorb',
            target: target.name || 'Target',
            amount: absorbAmount,
            duration: duration,
            absorbType: absorption.type
        };
    }

    /**
     * Apply reflect damage effect
     */
    applyReflectEffect(caster, spell, effect, target) {
        if (!target) return null;

        const reflectChance = effect.reflectChance || 0.5;
        const reflectAmount = effect.reflectAmount || 1.0; // 100% by default
        const duration = effect.duration || 5;

        if (!target.reflections) {
            target.reflections = [];
        }

        const reflection = {
            chance: reflectChance,
            amount: reflectAmount,
            duration: duration,
            reflectType: effect.reflectType || 'damage',
            source: spell.name
        };

        target.reflections.push(reflection);

        return {
            type: 'reflect',
            target: target.name || 'Target',
            chance: reflectChance,
            amount: reflectAmount,
            duration: duration
        };
    }

    // ================================================
    // SPELL EFFECT PROCESSING AND CLEANUP
    // ================================================

    /**
     * Process ongoing spell effects (called each turn/frame)
     */
    processOngoingEffects(character) {
        if (!character) return;

        // Process status effects
        this.processStatusEffects(character);

        // Process shields
        this.processShields(character);

        // Process absorptions
        this.processAbsorptions(character);

        // Process reflections
        this.processReflections(character);

        // Process transformations
        this.processTransformations(character);
    }

    /**
     * Process status effects (damage over time, healing over time, etc.)
     */
    processStatusEffects(character) {
        if (!character.statusEffects) return;

        character.statusEffects = character.statusEffects.filter(effect => {
            // Decrement duration
            effect.duration--;

            // Apply effect based on type
            if (effect.type === 'damage_over_time' && effect.damage) {
                const damage = Math.max(1, effect.damage);
                character.stats.hp = Math.max(0, (character.stats.hp || 0) - damage);
            } else if (effect.type === 'healing_over_time' && effect.healing) {
                const healing = effect.healing;
                const maxHP = character.stats.maxHp || 100;
                character.stats.hp = Math.min(maxHP, (character.stats.hp || 0) + healing);
            }

            // Remove if duration expired
            return effect.duration > 0;
        });
    }

    /**
     * Process shield effects
     */
    processShields(character) {
        if (!character.shields) return;

        character.shields = character.shields.filter(shield => {
            shield.duration--;
            return shield.duration > 0 && shield.amount > 0;
        });
    }

    /**
     * Process absorption effects
     */
    processAbsorptions(character) {
        if (!character.absorptions) return;

        character.absorptions = character.absorptions.filter(absorption => {
            absorption.duration--;
            return absorption.duration > 0 && absorption.amount > 0;
        });
    }

    /**
     * Process reflection effects
     */
    processReflections(character) {
        if (!character.reflections) return;

        character.reflections = character.reflections.filter(reflection => {
            reflection.duration--;
            return reflection.duration > 0;
        });
    }

    /**
     * Process transformation effects
     */
    processTransformations(character) {
        if (!character.transformations) return;

        character.transformations = character.transformations.filter(transform => {
            transform.duration--;

            // Revert transformation when expired
            if (transform.duration <= 0) {
                character.form = transform.originalForm;
                return false;
            }
            return true;
        });
    }

    /**
     * Calculate damage absorption when character takes damage
     */
    calculateDamageAbsorption(character, incomingDamage) {
        if (!character.absorptions || character.absorptions.length === 0) {
            return { finalDamage: incomingDamage, absorbed: 0 };
        }

        let remainingDamage = incomingDamage;
        let totalAbsorbed = 0;

        // Process absorptions in order (first applied, first used)
        character.absorptions = character.absorptions.filter(absorption => {
            if (remainingDamage <= 0 || absorption.amount <= 0) {
                return absorption.amount > 0; // Keep if still has absorption left
            }

            const absorbed = Math.min(remainingDamage, absorption.amount);
            absorption.amount -= absorbed;
            remainingDamage -= absorbed;
            totalAbsorbed += absorbed;

            // Transfer absorbed damage to caster if specified
            if (absorption.transferToCaster && absorption.caster && absorption.caster.stats) {
                const maxHP = absorption.caster.stats.maxHp || 100;
                const currentHP = absorption.caster.stats.hp || 0;
                const healAmount = Math.min(absorbed, maxHP - currentHP);
                absorption.caster.stats.hp = currentHP + healAmount;
            }

            return absorption.amount > 0; // Keep if still has absorption left
        });

        return {
            finalDamage: Math.max(0, remainingDamage),
            absorbed: totalAbsorbed
        };
    }

    /**
     * Calculate damage reflection when character takes damage
     */
    calculateDamageReflection(character, incomingDamage, attacker) {
        if (!character.reflections || character.reflections.length === 0 || !attacker) {
            return { reflected: 0 };
        }

        let totalReflected = 0;

        for (const reflection of character.reflections) {
            if (Math.random() < reflection.chance) {
                const reflectedDamage = Math.floor(incomingDamage * reflection.amount);
                totalReflected += reflectedDamage;

                // Apply reflected damage to attacker
                if (attacker.stats) {
                    attacker.stats.hp = Math.max(0, (attacker.stats.hp || 0) - reflectedDamage);
                }
            }
        }

        return { reflected: totalReflected };
    }

    // ================================================
    // SPELL SYSTEM INTEGRATION METHODS
    // ================================================

    /**
     * Enhanced spell validation with comprehensive checks
     */
    validateSpellCast(caster, spell, target) {
        // Basic validation
        const basicValidation = this.canCastSpell(caster, spell.id);
        if (!basicValidation.canCast) {
            return basicValidation;
        }

        // Target validation
        if (spell.targetType === 'enemy' && !target) {
            return { canCast: false, reason: 'No target selected' };
        }

        if (spell.targetType === 'self' && target !== caster) {
            return { canCast: false, reason: 'Can only target self' };
        }

        if (spell.targetType === 'ally' && target === caster) {
            // Self-targeting ally spells is usually OK
        }

        // Range validation (if applicable)
        if (spell.range && spell.range !== 'unlimited') {
            const distance = this.calculateDistance(caster, target);
            if (distance > spell.range) {
                return { canCast: false, reason: 'Target out of range' };
            }
        }

        // Line of sight validation (if applicable)
        if (spell.requiresLineOfSight && !this.hasLineOfSight(caster, target)) {
            return { canCast: false, reason: 'No line of sight to target' };
        }

        // Environmental restrictions
        if (spell.restrictions) {
            const environmentCheck = this.checkEnvironmentalRestrictions(caster, spell);
            if (!environmentCheck.allowed) {
                return { canCast: false, reason: environmentCheck.reason };
            }
        }

        return { canCast: true };
    }

    /**
     * Calculate distance between caster and target (simplified)
     */
    calculateDistance(caster, target) {
        // Simplified distance calculation - in a full system this would use actual positions
        return 1; // Assume everything is in range for now
    }

    /**
     * Check line of sight between caster and target (simplified)
     */
    hasLineOfSight(caster, target) {
        // Simplified - assume line of sight exists
        return true;
    }

    /**
     * Check environmental restrictions for spell casting
     */
    checkEnvironmentalRestrictions(caster, spell) {
        if (!spell.restrictions) {
            return { allowed: true };
        }

        const currentArea = this.gameState.world?.currentArea;

        // Check area restrictions
        if (spell.restrictions.forbiddenAreas?.includes(currentArea)) {
            return {
                allowed: false,
                reason: `Cannot cast ${spell.name} in ${currentArea}`
            };
        }

        // Check required areas
        if (spell.restrictions.requiredAreas?.length > 0 &&
            !spell.restrictions.requiredAreas.includes(currentArea)) {
            return {
                allowed: false,
                reason: `${spell.name} can only be cast in specific areas`
            };
        }

        // Check time restrictions
        if (spell.restrictions.timeOfDay) {
            const currentTime = this.gameState.world?.timeOfDay || 'day';
            if (spell.restrictions.timeOfDay !== currentTime) {
                return {
                    allowed: false,
                    reason: `${spell.name} can only be cast during ${spell.restrictions.timeOfDay}`
                };
            }
        }

        return { allowed: true };
    }

    /**
     * Get spell effectiveness rating for AI decision making
     */
    getSpellEffectiveness(caster, spell, target) {
        let effectiveness = 0;

        if (!spell.effects || !target) {
            return effectiveness;
        }

        for (const effect of spell.effects) {
            switch (effect.type) {
                case 'damage':
                    const targetHP = target.stats?.hp || 100;
                    const estimatedDamage = this.estimateSpellDamage(caster, spell, effect, target);
                    effectiveness += Math.min(estimatedDamage / targetHP, 1.0) * 100;
                    break;

                case 'heal':
                    const casterHP = caster.stats?.hp || 100;
                    const maxHP = caster.stats?.maxHp || 100;
                    const missingHP = maxHP - casterHP;
                    if (missingHP > 0) {
                        const estimatedHealing = this.estimateSpellHealing(caster, spell, effect);
                        effectiveness += Math.min(estimatedHealing / missingHP, 1.0) * 80;
                    }
                    break;

                case 'status_inflict':
                    if (!target.statusEffects?.some(s => s.type === effect.condition)) {
                        effectiveness += (effect.chance || 1.0) * 60;
                    }
                    break;

                case 'remove_status':
                    const hasTargetStatus = target.statusEffects?.some(s =>
                        effect.conditions?.includes(s.type)
                    );
                    if (hasTargetStatus) {
                        effectiveness += 70;
                    }
                    break;

                default:
                    effectiveness += 30; // Base value for other effects
            }
        }

        // Apply MP cost consideration
        const mpCost = spell.mpCost || 0;
        const currentMP = caster.stats?.mp || 0;
        if (mpCost > currentMP * 0.8) {
            effectiveness *= 0.5; // Reduce effectiveness if spell costs too much MP
        }

        return Math.max(0, effectiveness);
    }

    /**
     * Estimate spell damage for AI calculations
     */
    estimateSpellDamage(caster, spell, effect, target) {
        let damage = effect.power || 0;

        // Apply basic scaling
        if (effect.scaling && effect.scalingMultiplier) {
            const scalingStat = caster.stats?.[effect.scaling] || 0;
            damage += scalingStat * effect.scalingMultiplier;
        }

        // Apply level scaling
        if (effect.levelScaling) {
            damage += (caster.level || 1) * effect.levelScaling;
        }

        // Apply elemental modifiers
        if (spell.element && target.resistances) {
            const resistance = target.resistances[spell.element] || 0;
            damage *= (1 - resistance);
        }

        return Math.max(1, damage);
    }

    /**
     * Estimate spell healing for AI calculations
     */
    estimateSpellHealing(caster, spell, effect) {
        let healing = effect.power || 0;

        // Apply basic scaling
        if (effect.scaling && effect.scalingMultiplier) {
            const scalingStat = caster.stats?.[effect.scaling] || 0;
            healing += scalingStat * effect.scalingMultiplier;
        }

        // Apply level scaling
        if (effect.levelScaling) {
            healing += (caster.level || 1) * effect.levelScaling;
        }

        // Apply class bonus
        const classBonus = this.getClassHealingBonus(caster);
        healing *= classBonus;

        return Math.max(1, healing);
    }
}

// Make available globally
window.SpellSystem = SpellSystem;