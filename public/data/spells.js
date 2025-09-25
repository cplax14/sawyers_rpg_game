/**
 * Spell System Data
 * Defines all magical spells, abilities, and their effects
 */

const SpellData = {
    spells: {
        // ================================================
        // HEALING SPELLS
        // ================================================
        heal: {
            name: "Heal",
            description: "Restore health to yourself or an ally.",
            type: "healing",
            element: "holy",
            mpCost: 5,
            power: 30,
            target: "single_ally",
            castTime: 1.0,
            cooldown: 0,
            learnLevel: 1,
            availableClasses: ["knight", "paladin", "ranger", "wizard"],
            effects: [
                {
                    type: "heal",
                    power: 30,
                    scaling: "magicAttack",
                    scalingMultiplier: 0.5
                }
            ],
            animation: "healing_light"
        },
        
        cure: {
            name: "Cure",
            description: "Remove poison and other ailments.",
            type: "healing",
            element: "holy",
            mpCost: 8,
            target: "single_ally",
            castTime: 1.2,
            cooldown: 0,
            learnLevel: 3,
            availableClasses: ["paladin", "wizard"],
            effects: [
                {
                    type: "remove_status",
                    conditions: ["poison", "sleep", "silence"]
                }
            ],
            animation: "purifying_light"
        },
        
        revive: {
            name: "Revive",
            description: "Bring a fallen ally back to life with minimal health.",
            type: "healing",
            element: "holy",
            mpCost: 25,
            target: "single_dead_ally",
            castTime: 3.0,
            cooldown: 10,
            learnLevel: 15,
            availableClasses: ["paladin"],
            effects: [
                {
                    type: "revive",
                    healthPercentage: 25
                }
            ],
            animation: "resurrection"
        },
        
        // ================================================
        // OFFENSIVE MAGIC
        // ================================================
        fire: {
            name: "Fire",
            description: "Launch a fireball at a single enemy.",
            type: "offensive",
            element: "fire",
            mpCost: 8,
            power: 40,
            target: "single_enemy",
            castTime: 1.5,
            cooldown: 0,
            learnLevel: 1,
            availableClasses: ["wizard"],
            effects: [
                {
                    type: "damage",
                    power: 40,
                    scaling: "magicAttack",
                    scalingMultiplier: 1.0
                },
                {
                    type: "status_chance",
                    condition: "burn",
                    chance: 0.15,
                    duration: 3
                }
            ],
            animation: "fireball"
        },
        
        ice: {
            name: "Ice",
            description: "Strike an enemy with freezing cold.",
            type: "offensive",
            element: "ice",
            mpCost: 8,
            power: 35,
            target: "single_enemy",
            castTime: 1.5,
            cooldown: 0,
            learnLevel: 1,
            availableClasses: ["wizard"],
            effects: [
                {
                    type: "damage",
                    power: 35,
                    scaling: "magicAttack",
                    scalingMultiplier: 1.0
                },
                {
                    type: "status_chance",
                    condition: "slow",
                    chance: 0.25,
                    duration: 4
                }
            ],
            animation: "ice_shard"
        },
        
        thunder: {
            name: "Thunder",
            description: "Strike an enemy with lightning.",
            type: "offensive",
            element: "thunder",
            mpCost: 10,
            power: 45,
            target: "single_enemy",
            castTime: 1.3,
            cooldown: 0,
            learnLevel: 5,
            availableClasses: ["wizard"],
            effects: [
                {
                    type: "damage",
                    power: 45,
                    scaling: "magicAttack",
                    scalingMultiplier: 1.0
                },
                {
                    type: "status_chance",
                    condition: "stun",
                    chance: 0.20,
                    duration: 2
                }
            ],
            animation: "lightning_bolt"
        },
        
        meteor: {
            name: "Meteor",
            description: "Call down a devastating meteor strike.",
            type: "offensive",
            element: "fire",
            mpCost: 30,
            power: 80,
            target: "all_enemies",
            castTime: 4.0,
            cooldown: 5,
            learnLevel: 20,
            availableClasses: ["wizard"],
            effects: [
                {
                    type: "damage",
                    power: 80,
                    scaling: "magicAttack",
                    scalingMultiplier: 1.2
                }
            ],
            animation: "meteor_strike"
        },
        
        holy: {
            name: "Holy",
            description: "Channel divine light to smite evil.",
            type: "offensive",
            element: "holy",
            mpCost: 15,
            power: 50,
            target: "single_enemy",
            castTime: 2.0,
            cooldown: 0,
            learnLevel: 10,
            availableClasses: ["paladin"],
            effects: [
                {
                    type: "damage",
                    power: 50,
                    scaling: "magicAttack",
                    scalingMultiplier: 1.0,
                    bonusVsEvil: 1.5
                }
            ],
            animation: "holy_light"
        },
        
        // ================================================
        // SUPPORT SPELLS
        // ================================================
        protect: {
            name: "Protect",
            description: "Increase an ally's defense temporarily.",
            type: "support",
            element: "neutral",
            mpCost: 12,
            target: "single_ally",
            castTime: 1.5,
            cooldown: 0,
            learnLevel: 6,
            availableClasses: ["knight", "paladin"],
            effects: [
                {
                    type: "stat_boost",
                    stat: "defense",
                    amount: 20,
                    duration: 10
                }
            ],
            animation: "protective_barrier"
        },
        
        shell: {
            name: "Shell",
            description: "Increase an ally's magic defense temporarily.",
            type: "support",
            element: "neutral",
            mpCost: 12,
            target: "single_ally",
            castTime: 1.5,
            cooldown: 0,
            learnLevel: 6,
            availableClasses: ["knight", "paladin"],
            effects: [
                {
                    type: "stat_boost",
                    stat: "magicDefense",
                    amount: 20,
                    duration: 10
                }
            ],
            animation: "magical_barrier"
        },
        
        haste: {
            name: "Haste",
            description: "Increase an ally's speed and attack frequency.",
            type: "support",
            element: "neutral",
            mpCost: 15,
            target: "single_ally",
            castTime: 1.0,
            cooldown: 0,
            learnLevel: 8,
            availableClasses: ["rogue", "ranger"],
            effects: [
                {
                    type: "stat_boost",
                    stat: "speed",
                    amount: 25,
                    duration: 8
                }
            ],
            animation: "speed_boost"
        },
        
        // ================================================
        // DEBUFF SPELLS
        // ================================================
        sleep: {
            name: "Sleep",
            description: "Put an enemy to sleep, making them unable to act.",
            type: "debuff",
            element: "neutral",
            mpCost: 10,
            target: "single_enemy",
            castTime: 1.2,
            cooldown: 0,
            learnLevel: 4,
            availableClasses: ["wizard", "rogue"],
            effects: [
                {
                    type: "status_inflict",
                    condition: "sleep",
                    chance: 0.70,
                    duration: 4
                }
            ],
            animation: "sleep_spell"
        },
        
        silence: {
            name: "Silence",
            description: "Prevent an enemy from casting spells.",
            type: "debuff",
            element: "neutral",
            mpCost: 8,
            target: "single_enemy",
            castTime: 1.0,
            cooldown: 0,
            learnLevel: 5,
            availableClasses: ["wizard", "rogue"],
            effects: [
                {
                    type: "status_inflict",
                    condition: "silence",
                    chance: 0.80,
                    duration: 6
                }
            ],
            animation: "silence_seal"
        },
        
        poison: {
            name: "Poison",
            description: "Inflict poison that damages over time.",
            type: "debuff",
            element: "poison",
            mpCost: 6,
            target: "single_enemy",
            castTime: 1.0,
            cooldown: 0,
            learnLevel: 3,
            availableClasses: ["rogue"],
            effects: [
                {
                    type: "status_inflict",
                    condition: "poison",
                    chance: 0.85,
                    duration: 5,
                    damagePerTurn: 8
                }
            ],
            animation: "poison_cloud"
        },
        
        // ================================================
        // SPECIAL ABILITIES
        // ================================================
        steal: {
            name: "Steal",
            description: "Attempt to steal gold or an item from an enemy.",
            type: "special",
            element: "neutral",
            mpCost: 5,
            target: "single_enemy",
            castTime: 0.5,
            cooldown: 2,
            learnLevel: 1,
            availableClasses: ["rogue"],
            effects: [
                {
                    type: "steal",
                    successRate: 0.60,
                    goldMultiplier: 0.3
                }
            ],
            animation: "steal_attempt"
        },
        
        rage: {
            name: "Rage",
            description: "Enter a berserker state, increasing attack but reducing defense.",
            type: "special",
            element: "neutral",
            mpCost: 8,
            target: "self",
            castTime: 0.8,
            cooldown: 8,
            learnLevel: 1,
            availableClasses: ["warrior"],
            effects: [
                {
                    type: "stat_boost",
                    stat: "attack",
                    amount: 30,
                    duration: 6
                },
                {
                    type: "stat_debuff",
                    stat: "defense",
                    amount: 15,
                    duration: 6
                }
            ],
            animation: "berserker_rage"
        },
        
        berserk: {
            name: "Berserk",
            description: "Extreme rage that greatly increases attack but reduces accuracy.",
            type: "special",
            element: "neutral",
            mpCost: 15,
            target: "self",
            castTime: 1.0,
            cooldown: 12,
            learnLevel: 12,
            availableClasses: ["warrior"],
            effects: [
                {
                    type: "stat_boost",
                    stat: "attack",
                    amount: 50,
                    duration: 5
                },
                {
                    type: "stat_debuff",
                    stat: "accuracy",
                    amount: 20,
                    duration: 5
                }
            ],
            animation: "berserk_fury"
        },
        
        beast_call: {
            name: "Beast Call",
            description: "Summon a wild animal to fight alongside you temporarily.",
            type: "summon",
            element: "nature",
            mpCost: 20,
            target: "battlefield",
            castTime: 2.5,
            cooldown: 15,
            learnLevel: 1,
            availableClasses: ["ranger"],
            effects: [
                {
                    type: "summon",
                    creature: "wild_wolf",
                    duration: 8
                }
            ],
            animation: "beast_summon"
        },
        
        nature_blessing: {
            name: "Nature's Blessing",
            description: "Channel nature's power to heal and protect all allies.",
            type: "support",
            element: "nature",
            mpCost: 25,
            target: "all_allies",
            castTime: 3.0,
            cooldown: 10,
            learnLevel: 15,
            availableClasses: ["ranger"],
            effects: [
                {
                    type: "heal",
                    power: 35,
                    scaling: "magicAttack",
                    scalingMultiplier: 0.8
                },
                {
                    type: "stat_boost",
                    stat: "defense",
                    amount: 15,
                    duration: 8
                }
            ],
            animation: "nature_blessing"
        },
        
        // ================================================
        // COMBAT ABILITIES
        // ================================================
        mighty_strike: {
            name: "Mighty Strike",
            description: "A powerful sword attack that deals extra damage.",
            type: "physical",
            element: "neutral",
            mpCost: 8,
            power: 1.5,
            target: "single_enemy",
            castTime: 1.2,
            cooldown: 3,
            learnLevel: 8,
            availableClasses: ["knight", "warrior"],
            effects: [
                {
                    type: "physical_attack",
                    damageMultiplier: 1.5,
                    accuracy: 0.9
                }
            ],
            animation: "mighty_strike"
        },
        
        sneak_attack: {
            name: "Sneak Attack",
            description: "A stealthy strike with high critical hit chance.",
            type: "physical",
            element: "neutral",
            mpCost: 6,
            power: 1.2,
            target: "single_enemy",
            castTime: 0.8,
            cooldown: 4,
            learnLevel: 6,
            availableClasses: ["rogue"],
            effects: [
                {
                    type: "physical_attack",
                    damageMultiplier: 1.2,
                    criticalChance: 0.5,
                    criticalMultiplier: 2.0
                }
            ],
            animation: "sneak_attack"
        },
        
        backstab: {
            name: "Backstab",
            description: "A devastating attack from behind that can instantly kill weak enemies.",
            type: "physical",
            element: "neutral",
            mpCost: 12,
            power: 2.0,
            target: "single_enemy",
            castTime: 1.0,
            cooldown: 8,
            learnLevel: 15,
            availableClasses: ["rogue"],
            effects: [
                {
                    type: "physical_attack",
                    damageMultiplier: 2.0,
                    instantKillChance: 0.15,
                    instantKillHPThreshold: 0.25
                }
            ],
            animation: "backstab"
        },
        
        arrow_rain: {
            name: "Arrow Rain",
            description: "Fire multiple arrows at all enemies.",
            type: "physical",
            element: "neutral",
            mpCost: 15,
            power: 0.8,
            target: "all_enemies",
            castTime: 2.0,
            cooldown: 6,
            learnLevel: 12,
            availableClasses: ["ranger"],
            effects: [
                {
                    type: "physical_attack",
                    damageMultiplier: 0.8,
                    hitCount: 3
                }
            ],
            animation: "arrow_rain"
        },
        
        power_strike: {
            name: "Power Strike",
            description: "Channel inner strength for a devastating blow.",
            type: "physical",
            element: "neutral",
            mpCost: 10,
            power: 1.8,
            target: "single_enemy",
            castTime: 1.5,
            cooldown: 5,
            learnLevel: 10,
            availableClasses: ["warrior"],
            effects: [
                {
                    type: "physical_attack",
                    damageMultiplier: 1.8,
                    armorPiercing: 0.3
                }
            ],
            animation: "power_strike"
        },
        
        // ================================================
        // UTILITY SPELLS
        // ================================================
        intimidate: {
            name: "Intimidate",
            description: "Strike fear into enemies, reducing their attack power.",
            type: "utility",
            element: "neutral",
            mpCost: 6,
            target: "all_enemies",
            castTime: 1.0,
            cooldown: 8,
            learnLevel: 4,
            availableClasses: ["warrior", "knight"],
            effects: [
                {
                    type: "stat_debuff",
                    stat: "attack",
                    amount: 15,
                    duration: 6
                }
            ],
            animation: "intimidating_roar"
        },
        
        weapon_break: {
            name: "Weapon Break",
            description: "Attempt to break an enemy's weapon, reducing their attack.",
            type: "utility",
            element: "neutral",
            mpCost: 8,
            target: "single_enemy",
            castTime: 1.2,
            cooldown: 10,
            learnLevel: 14,
            availableClasses: ["warrior", "knight"],
            effects: [
                {
                    type: "weapon_break",
                    successRate: 0.75,
                    attackReduction: 25,
                    duration: 999 // Permanent for this battle
                }
            ],
            animation: "weapon_shatter"
        },
        
        track: {
            name: "Track",
            description: "Reveal information about enemies and increase encounter rate.",
            type: "utility",
            element: "nature",
            mpCost: 5,
            target: "battlefield",
            castTime: 2.0,
            cooldown: 0,
            learnLevel: 7,
            availableClasses: ["ranger"],
            effects: [
                {
                    type: "reveal_info",
                    duration: 300 // 5 minutes
                },
                {
                    type: "encounter_modifier",
                    modifier: 1.3,
                    duration: 300
                }
            ],
            animation: "tracking_sense"
        }
    },
    
    /**
     * Get spell data by ID
     */
    getSpell: function(spellId) {
        return this.spells[spellId] || null;
    },
    
    /**
     * Get spells available for a character class
     */
    getSpellsForClass: function(className) {
        const classSpells = {};
        
        for (const [spellId, spell] of Object.entries(this.spells)) {
            if (spell.availableClasses.includes(className)) {
                classSpells[spellId] = spell;
            }
        }
        
        return classSpells;
    },
    
    /**
     * Get spells learnable at a specific level
     */
    getSpellsForLevel: function(className, level) {
        const availableSpells = [];
        
        for (const [spellId, spell] of Object.entries(this.spells)) {
            if (spell.availableClasses.includes(className) && 
                spell.learnLevel <= level) {
                availableSpells.push(spellId);
            }
        }
        
        return availableSpells;
    },
    
    /**
     * Get spells by type
     */
    getSpellsByType: function(type) {
        const typeSpells = {};
        
        for (const [spellId, spell] of Object.entries(this.spells)) {
            if (spell.type === type) {
                typeSpells[spellId] = spell;
            }
        }
        
        return typeSpells;
    },
    
    /**
     * Get spells by element
     */
    getSpellsByElement: function(element) {
        const elementSpells = {};
        
        for (const [spellId, spell] of Object.entries(this.spells)) {
            if (spell.element === element) {
                elementSpells[spellId] = spell;
            }
        }
        
        return elementSpells;
    },
    
    /**
     * Check if player can cast spell
     */
    canCast: function(spellId, playerMP, playerClass, playerLevel) {
        const spell = this.getSpell(spellId);
        if (!spell) return false;
        
        // Check MP cost
        if (playerMP < spell.mpCost) return false;
        
        // Check class requirement
        if (!spell.availableClasses.includes(playerClass)) return false;
        
        // Check level requirement
        if (playerLevel < spell.learnLevel) return false;
        
        return true;
    },
    
    /**
     * Calculate spell damage/effect power
     */
    calculateSpellPower: function(spellId, casterStats) {
        const spell = this.getSpell(spellId);
        if (!spell) return 0;
        
        let basePower = spell.power || 0;
        
        // Find scaling effect
        const scalingEffect = spell.effects.find(effect => 
            effect.scaling && effect.scalingMultiplier
        );
        
        if (scalingEffect && casterStats[scalingEffect.scaling]) {
            const scalingValue = casterStats[scalingEffect.scaling] * scalingEffect.scalingMultiplier;
            basePower += scalingValue;
        }
        
        return Math.floor(basePower);
    },
    
    /**
     * Get spell cast time modified by caster speed
     */
    getModifiedCastTime: function(spellId, casterSpeed) {
        const spell = this.getSpell(spellId);
        if (!spell) return 0;
        
        const speedModifier = Math.max(0.5, 1 - (casterSpeed - 100) / 200);
        return spell.castTime * speedModifier;
    },
    
    /**
     * Generate random spell for monster/enemy
     */
    generateRandomSpell: function(level, type = null) {
        const availableSpells = [];
        
        for (const [spellId, spell] of Object.entries(this.spells)) {
            if (spell.learnLevel <= level) {
                if (!type || spell.type === type) {
                    availableSpells.push(spellId);
                }
            }
        }
        
        if (availableSpells.length === 0) return null;
        
        if (typeof GameUtils !== 'undefined') {
            return GameUtils.randomChoice(availableSpells);
        }
        
        return availableSpells[Math.floor(Math.random() * availableSpells.length)];
    }
};

// Make available globally
window.SpellData = SpellData;