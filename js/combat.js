/**
 * Turn-based Combat Engine (5.1)
 * Minimal scaffolding: initiative order and turn advancement
 */

class CombatEngine {
    constructor(gameState) {
        this.gameState = gameState;
    }

    /**
     * Start a battle with a set of participants
     * participants: Array of { id, side: 'player'|'enemy', speed: number, ref?: any }
     */
    startBattle(participants) {
        if (!Array.isArray(participants) || participants.length === 0) {
            throw new Error('No participants provided');
        }
        // Sort by speed descending; stable by input order for ties
        const ordered = [...participants].sort((a, b) => (b.speed || 0) - (a.speed || 0));
        const combat = this.gameState.combat;
        combat.active = true;
        combat.turn = 1;
        combat.turnOrder = ordered.map(p => ({ ...p }));
        combat.currentTurn = 0;
        combat.actions = [];
        combat.battleResult = null;

        // Populate combat.enemies array for CombatUI compatibility
        combat.enemies = participants
            .filter(p => p.side === 'enemy')
            .map(p => ({
                name: p.ref?.species || 'Unknown',
                species: p.ref?.species || 'unknown',
                level: p.ref?.level || 1,
                hp: p.ref?.currentStats?.hp || p.ref?.stats?.hp || 20,
                maxHp: p.ref?.stats?.hp || 20,
                attack: p.ref?.stats?.attack || 10,
                defense: p.ref?.stats?.defense || 5,
                capturable: true,
                id: p.id,
                ref: p.ref
            }));

        // Populate combat.player for CombatUI compatibility
        const playerParticipant = participants.find(p => p.side === 'player');
        if (playerParticipant && playerParticipant.ref) {
            combat.player = {
                name: playerParticipant.ref.name || 'Player',
                hp: playerParticipant.ref.stats?.hp || 100,
                maxHp: playerParticipant.ref.stats?.maxHp || 100,
                mana: playerParticipant.ref.stats?.mana || playerParticipant.ref.stats?.mp || 10,
                maxMana: playerParticipant.ref.stats?.maxMana || playerParticipant.ref.stats?.maxMp || 10,
                spells: playerParticipant.ref.spells || [],
                inventory: playerParticipant.ref.inventory?.items || {}
            };
        }


        return ordered;
    }

    /** Get the current actor taking a turn */
    getCurrentActor() {
        const c = this.gameState.combat;
        if (!c.active || c.turnOrder.length === 0) return null;
        return c.turnOrder[c.currentTurn];
    }

    /** Record an action and advance the turn */
    performAction(action) {
        const c = this.gameState.combat;
        if (!c.active) return false;
        const actor = this.getCurrentActor();
        c.actions.push({ turn: c.turn, actorId: actor?.id ?? null, action });
        this.endTurn();
        return true;
    }

    /** Advance to next turn */
    endTurn() {
        const c = this.gameState.combat;
        if (!c.active || c.turnOrder.length === 0) return;

        // Process end-of-turn effects before advancing
        this.processEndOfTurnEffects();

        c.currentTurn = (c.currentTurn + 1) % c.turnOrder.length;
        if (c.currentTurn === 0) {
            c.turn += 1;
            // Process end-of-round effects
            this.processEndOfRoundEffects();
        }
    }

    /**
     * Process effects that happen at the end of each turn
     */
    processEndOfTurnEffects() {
        const currentActor = this.getCurrentActor();
        if (!currentActor) return;

        const actorRef = this.getRef(currentActor);
        if (actorRef) {
            // MP regeneration
            this.applyMPRegeneration(actorRef);
            // Update status effects
            this.updateStatusEffects(actorRef);
        }
    }

    /**
     * Process effects that happen at the end of each round
     */
    processEndOfRoundEffects() {
        const c = this.gameState.combat;
        if (!c.turnOrder) return;

        // Apply MP regeneration and status updates to all participants
        for (const participant of c.turnOrder) {
            if (participant.defeated) continue;

            const ref = this.getRef(participant);
            if (ref) {
                this.applyMPRegeneration(ref);
                this.updateStatusEffects(ref);
                this.updateTemporaryEffects(ref);
            }
        }

        // Use SpellSystem's global regeneration if available
        if (this.gameState.spellSystem) {
            this.gameState.spellSystem.updateMPRegeneration(1000); // 1 second passed
        }
    }

    /**
     * Apply MP regeneration to a character
     */
    applyMPRegeneration(characterRef) {
        if (!characterRef || !characterRef.stats) return;

        // Use SpellSystem regeneration if available
        if (this.gameState.spellSystem) {
            this.gameState.spellSystem.regenerateCharacterMP(characterRef);
            return;
        }

        // Fallback MP regeneration
        this.ensureCurrentStats(characterRef);
        const maxMP = characterRef.stats.maxMp || characterRef.stats.mp || 0;
        const currentMP = characterRef.currentStats.mp || 0;

        if (currentMP < maxMP) {
            const regenAmount = Math.ceil(maxMP * 0.05); // 5% regen per turn
            const newMP = Math.min(maxMP, currentMP + regenAmount);
            characterRef.currentStats.mp = newMP;
            characterRef.stats.mp = newMP; // Sync

            if (regenAmount > 0) {
                this.gameState.addNotification(
                    `${characterRef.name || 'Character'} regenerates ${regenAmount} MP`,
                    'info'
                );
            }
        }
    }

    /**
     * Update status effects (duration, removal)
     */
    updateStatusEffects(characterRef) {
        if (!characterRef || !characterRef.statusEffects) return;

        const expiredEffects = [];
        characterRef.statusEffects = characterRef.statusEffects.filter(effect => {
            effect.duration -= 1;
            if (effect.duration <= 0) {
                expiredEffects.push(effect);
                return false;
            }
            return true;
        });

        // Notify about expired effects
        for (const effect of expiredEffects) {
            this.gameState.addNotification(
                `${characterRef.name || 'Character'} recovers from ${effect.type}`,
                'info'
            );
        }
    }

    /**
     * Update temporary stat effects (buffs/debuffs)
     */
    updateTemporaryEffects(characterRef) {
        if (!characterRef || !characterRef.temporaryEffects) return;

        const expiredEffects = [];
        characterRef.temporaryEffects = characterRef.temporaryEffects.filter(effect => {
            effect.duration -= 1;
            if (effect.duration <= 0) {
                expiredEffects.push(effect);
                return false;
            }
            return true;
        });

        // Notify about expired effects
        for (const effect of expiredEffects) {
            this.gameState.addNotification(
                `${characterRef.name || 'Character'}'s ${effect.stat} returns to normal`,
                'info'
            );
        }
    }

    /** End battle */
    endBattle(result = null) {
        const c = this.gameState.combat;
        c.battleResult = result;
        c.active = false;
        // Grant rewards on victory
        if (result && result.victory) {
            this.grantRewards(result);
        }
    }

    /** Compute and grant rewards after battle */
    grantRewards(result = {}) {
        const enemies = Array.isArray(result.defeated) && result.defeated.length
            ? result.defeated
            : this.gameState.combat.turnOrder.filter(p => p.side === 'enemy');

        let totalXP = 0;
        let totalGold = 0;
        const allDrops = [];
        const playerLevel = this.gameState?.player?.level || 1;

        for (const e of enemies) {
            const ref = this.getRef(e) || e.ref || {};
            const enemyLevel = ref.level || 1;
            const species = ref.species || ref?.speciesData?.name || 'unknown';

            // Enhanced XP calculation with level scaling
            let baseXP = enemyLevel * 8;

            // Level difference bonus (more XP for harder enemies)
            const levelDiff = enemyLevel - playerLevel;
            if (levelDiff > 0) {
                baseXP = Math.floor(baseXP * (1 + levelDiff * 0.1)); // +10% per level above player
            } else if (levelDiff < -5) {
                baseXP = Math.floor(baseXP * Math.max(0.2, 1 + levelDiff * 0.05)); // Reduced for much weaker enemies
            }

            // Rarity bonus
            if (typeof MonsterData !== 'undefined' && species) {
                const data = MonsterData.getSpecies(species);
                const rarity = data?.rarity || 'common';
                switch (rarity) {
                    case 'uncommon': baseXP = Math.floor(baseXP * 1.25); break;
                    case 'rare': baseXP = Math.floor(baseXP * 1.5); break;
                    case 'epic': baseXP = Math.floor(baseXP * 2.0); break;
                    case 'legendary': baseXP = Math.floor(baseXP * 3.0); break;
                }
            }

            totalXP += baseXP;

            // Enhanced loot generation with tiered system
            if (typeof LootSystem !== 'undefined') {
                const monsterLoot = LootSystem.generateMonsterLoot(species, enemyLevel, playerLevel);
                if (monsterLoot) {
                    totalGold += monsterLoot.gold || 0;
                    if (monsterLoot.items && monsterLoot.items.length > 0) {
                        allDrops.push(...monsterLoot.items);
                    }
                }
            } else {
                // Fallback to old loot system if LootSystem not available
                let baseGold = Math.floor(enemyLevel * 2.5);
                if (levelDiff > 0) {
                    baseGold = Math.floor(baseGold * (1 + levelDiff * 0.08));
                }
                totalGold += baseGold;

                // Improved drop system with level-appropriate items
                const dropChance = 0.15 + (enemyLevel * 0.005);
                if (Math.random() < dropChance) {
                    if (enemyLevel >= 15 && Math.random() < 0.3) {
                        allDrops.push({ itemId: 'mana_potion', quantity: 1, rarity: 'common' });
                    } else {
                        allDrops.push({ itemId: 'health_potion', quantity: 1, rarity: 'common' });
                    }
                }

                // Rare drops for higher level enemies
                if (enemyLevel >= 20 && Math.random() < 0.05) {
                    allDrops.push({ itemId: 'capture_orb', quantity: 1, rarity: 'uncommon' });
                }
            }
        }

        // Generate area-specific loot if available
        if (typeof LootSystem !== 'undefined' && this.gameState.world?.currentArea) {
            const areaLoot = LootSystem.generateAreaLoot(this.gameState.world.currentArea, playerLevel);
            if (areaLoot && areaLoot.items && areaLoot.items.length > 0) {
                allDrops.push(...areaLoot.items);
            }
        }

        // Grant rewards
        if (totalXP > 0) {
            this.gameState.addExperience(totalXP);
        }
        if (totalGold > 0) {
            this.gameState.addGold(totalGold);
        }

        // Add items to inventory with overflow handling
        const itemSummary = [];
        for (const drop of allDrops) {
            const itemId = drop.itemId || drop.id || drop;
            const quantity = drop.quantity || 1;
            const rarity = drop.rarity || 'common';
            const itemData = drop; // Pass the full drop object as item data for loot-generated items

            // For loot-generated items (objects with properties), pass the full data
            const fullItemData = (typeof drop === 'object' && drop.name) ? drop : null;

            const added = this.gameState.addItem(itemId, quantity, rarity, fullItemData);
            if (added) {
                const displayName = fullItemData?.name || itemId;
                itemSummary.push(`${displayName}${quantity > 1 ? ` x${quantity}` : ''}${rarity !== 'common' ? ` (${rarity})` : ''}`);
            }
        }

        // Display notification
        const itemText = itemSummary.length > 0 ? `, items: ${itemSummary.join(', ')}` : '';
        this.gameState.addNotification(`Battle Rewards: +${totalXP} EXP, +${totalGold} gold${itemText}`, 'success');
    }

    isBattleActive() {
        return !!this.gameState.combat.active;
    }

    // ================================================
    // CORE ACTIONS (5.2)
    // ================================================
    getParticipantById(id) {
        const c = this.gameState.combat;
        return c.turnOrder.find(p => p.id === id) || null;
    }
    
    getRef(participant) {
        return participant?.ref || null;
    }
    
    // Safely access stats on Monster or plain object
    getStat(ref, name, fallback = 0) {
        if (!ref) return fallback;
        if (ref.stats && typeof ref.stats[name] === 'number') return ref.stats[name];
        if (typeof ref[name] === 'number') return ref[name];
        return fallback;
    }
    
    ensureCurrentStats(ref) {
        if (!ref) return;
        if (!ref.currentStats && ref.stats) {
            ref.currentStats = { hp: ref.stats.hp, mp: ref.stats.mp };
        }
    }
    
    applyDamage(ref, amount) {
        this.ensureCurrentStats(ref);
        if (!ref || !ref.currentStats) return 0;
        const dmg = Math.max(1, Math.floor(amount));
        ref.currentStats.hp = Math.max(0, (ref.currentStats.hp || 0) - dmg);
        return dmg;
    }
    
    healTarget(ref, amount) {
        this.ensureCurrentStats(ref);
        if (!ref || !ref.currentStats) return 0;
        const maxHP = this.getStat(ref, 'hp', ref.currentStats.hp || 0);
        const before = ref.currentStats.hp || 0;
        ref.currentStats.hp = Math.min(maxHP, before + Math.max(1, Math.floor(amount)));
        return ref.currentStats.hp - before;
    }
    
    computeDamage(attackerRef, defenderRef, type = 'physical') {
        const atk = type === 'magic' ? this.getStat(attackerRef, 'magicAttack', 10) : this.getStat(attackerRef, 'attack', 10);
        const def = type === 'magic' ? this.getStat(defenderRef, 'magicDefense', 5) : this.getStat(defenderRef, 'defense', 5);

        // Enhanced damage formula with better scaling
        const attackerLevel = attackerRef?.level || 1;
        const defenderLevel = defenderRef?.level || 1;

        // Base power calculation using Pokemon-inspired formula
        const power = 60; // Base power for normal attacks
        const levelFactor = (2 * attackerLevel / 5 + 2);
        const attackRatio = atk / Math.max(1, def);

        // Enhanced formula with level difference consideration
        let base = Math.floor((levelFactor * power * attackRatio) / 50 + 2);

        // Level difference bonus/penalty (±20% max)
        const levelDiff = attackerLevel - defenderLevel;
        const levelBonus = Math.max(-0.2, Math.min(0.2, levelDiff * 0.05));
        base = Math.floor(base * (1 + levelBonus));

        // Improved variance (90% - 110%) for more consistent damage
        const variance = 0.9 + (Math.random() * 0.2);
        base = Math.floor(base * variance);

        // Improved crit system: 8% base chance, 2x damage
        const accuracy = this.getStat(attackerRef, 'accuracy', 70);
        const critChance = Math.max(0.05, Math.min(0.15, accuracy / 1000 + 0.03));
        const crit = Math.random() < critChance;
        if (crit) base = Math.floor(base * 2.0);

        // Ensure minimum damage
        return Math.max(1, base);
    }
    
    attack(attackerId, targetId) {
        const a = this.getParticipantById(attackerId);
        const d = this.getParticipantById(targetId);
        if (!a || !d) return { success: false, reason: 'Invalid participants' };
        const dmg = this.computeDamage(this.getRef(a), this.getRef(d), 'physical');
        const dealt = this.applyDamage(this.getRef(d), dmg);
        this.gameState.addNotification(`Attack deals ${dealt} damage`, 'info');
        this.performAction({ type: 'attack', targetId });
        return { success: true, damage: dealt };
    }
    
    magic(attackerId, targetId, moveId = 'spell', mpCost = 5) {
        const a = this.getParticipantById(attackerId);
        const d = this.getParticipantById(targetId);
        if (!a || !d) return { success: false, reason: 'Invalid participants' };
        const aref = this.getRef(a);

        // Enhanced MP validation using SpellSystem if available
        let mpValidation = this.validateMPCost(aref, mpCost);
        if (!mpValidation.canCast) {
            return { success: false, reason: mpValidation.reason };
        }

        // Consume MP using enhanced system
        const consumed = this.consumeMP(aref, mpCost);
        if (!consumed) return { success: false, reason: 'Failed to consume MP' };

        const dmg = this.computeDamage(aref, this.getRef(d), 'magic') + 5; // small magic bonus
        const dealt = this.applyDamage(this.getRef(d), dmg);
        this.gameState.addNotification(`${moveId} hits for ${dealt}`, 'info');
        this.performAction({ type: 'magic', moveId, targetId });
        return { success: true, damage: dealt };
    }

    /**
     * Validate MP cost for an action
     */
    validateMPCost(characterRef, mpCost) {
        if (!characterRef) {
            return { canCast: false, reason: 'Invalid character' };
        }

        // Use SpellSystem validation if available
        if (this.gameState.spellSystem) {
            return {
                canCast: this.gameState.spellSystem.hasEnoughMP(characterRef, mpCost),
                reason: this.gameState.spellSystem.hasEnoughMP(characterRef, mpCost)
                    ? 'Valid'
                    : `Insufficient MP (need ${mpCost}, have ${characterRef.stats?.mp || 0})`
            };
        }

        // Fallback validation
        this.ensureCurrentStats(characterRef);
        const currentMP = characterRef.currentStats?.mp || characterRef.stats?.mp || 0;

        return {
            canCast: currentMP >= mpCost,
            reason: currentMP >= mpCost
                ? 'Valid'
                : `Insufficient MP (need ${mpCost}, have ${currentMP})`
        };
    }

    /**
     * Consume MP from a character
     */
    consumeMP(characterRef, mpCost) {
        if (!characterRef) return false;

        // Use SpellSystem if available
        if (this.gameState.spellSystem) {
            return this.gameState.spellSystem.consumeMP(characterRef, mpCost);
        }

        // Fallback MP consumption
        if (characterRef && typeof characterRef.useMP === 'function') {
            return characterRef.useMP(mpCost);
        } else {
            // Manual MP field management
            this.ensureCurrentStats(characterRef);
            if (characterRef?.currentStats) {
                if ((characterRef.currentStats.mp || 0) >= mpCost) {
                    characterRef.currentStats.mp -= mpCost;
                    // Sync with stats.mp if it exists
                    if (characterRef.stats) {
                        characterRef.stats.mp = characterRef.currentStats.mp;
                    }
                    return true;
                } else {
                    return false;
                }
            }
        }

        return false;
    }

    /**
     * Cast a spell using the spell system
     */
    castSpell(casterId, spellId, targetId = null) {
        if (!this.gameState.spellSystem) {
            return { success: false, reason: 'Spell system not available' };
        }

        const caster = this.getParticipantById(casterId);
        if (!caster) {
            return { success: false, reason: 'Invalid caster' };
        }

        const casterRef = this.getRef(caster);
        if (!casterRef) {
            return { success: false, reason: 'Invalid caster reference' };
        }

        // Get target reference if targetId provided
        let target = null;
        if (targetId) {
            const targetParticipant = this.getParticipantById(targetId);
            target = targetParticipant ? this.getRef(targetParticipant) : null;
        }

        // Use spell system to cast the spell
        const result = this.gameState.spellSystem.castSpellForCharacter(casterRef, spellId, target);

        if (result.success) {
            // Apply spell effects to combat participants
            this.processSpellEffects(result.effects, casterRef, target);

            // Record the action in combat
            this.performAction({
                type: 'spell',
                spellId: spellId,
                targetId: targetId,
                mpCost: result.mpConsumed,
                effects: result.effects
            });

            // Check for KO'd targets after spell effects
            this.checkForDefeatedTargets();
        }

        return result;
    }

    /**
     * Process spell effects and apply them to combat participants
     */
    processSpellEffects(effects, caster, originalTarget) {
        if (!effects || !Array.isArray(effects)) return;

        for (const effect of effects) {
            this.applySpellEffectToCombat(effect, caster, originalTarget);
        }
    }

    /**
     * Apply a single spell effect to combat participants
     */
    applySpellEffectToCombat(effect, caster, originalTarget) {
        switch (effect.type) {
            case 'damage':
                if (originalTarget) {
                    // Update the combat participant's current stats
                    this.ensureCurrentStats(originalTarget);
                    // Damage was already applied by SpellSystem, just sync the stats
                    this.gameState.addNotification(
                        `${effect.target} takes ${effect.amount} spell damage!`,
                        'combat'
                    );
                }
                break;

            case 'heal':
                if (originalTarget) {
                    this.ensureCurrentStats(originalTarget);
                    this.gameState.addNotification(
                        `${effect.target} recovers ${effect.amount} HP!`,
                        'heal'
                    );
                }
                break;

            case 'stat_boost':
            case 'stat_debuff':
                // Apply temporary stat modifications
                this.applyTemporaryStatEffect(originalTarget, effect);
                break;

            case 'status_applied':
                this.gameState.addNotification(
                    `${effect.target} is affected by ${effect.status}!`,
                    'status'
                );
                break;

            case 'status_removed':
                this.gameState.addNotification(
                    `${effect.target} recovers from status effects!`,
                    'heal'
                );
                break;

            default:
                console.warn(`Unknown spell effect type: ${effect.type}`);
        }
    }

    /**
     * Apply temporary stat effects for buffs/debuffs
     */
    applyTemporaryStatEffect(target, effect) {
        if (!target) return;

        // Initialize temporary effects tracking if needed
        if (!target.temporaryEffects) {
            target.temporaryEffects = [];
        }

        // Add the temporary effect
        const tempEffect = {
            type: effect.type,
            stat: effect.stat,
            amount: effect.amount,
            duration: effect.duration,
            appliedAt: Date.now(),
            source: 'spell'
        };

        target.temporaryEffects.push(tempEffect);

        const effectVerb = effect.type === 'stat_boost' ? 'increased' : 'decreased';
        this.gameState.addNotification(
            `${effect.target}'s ${effect.stat} ${effectVerb} by ${Math.abs(effect.amount)}!`,
            effect.type === 'stat_boost' ? 'buff' : 'debuff'
        );
    }

    /**
     * Check for defeated targets and handle KOs
     */
    checkForDefeatedTargets() {
        const combat = this.gameState.combat;
        if (!combat.turnOrder) return;

        for (const participant of combat.turnOrder) {
            const ref = this.getRef(participant);
            if (ref && ref.currentStats && ref.currentStats.hp <= 0) {
                this.gameState.addNotification(
                    `${participant.id} was defeated!`,
                    'warning'
                );
                // Mark as defeated (could remove from turn order or set a flag)
                participant.defeated = true;
            }
        }
    }

    useItem(userId, itemId = 'health_potion') {
        const u = this.getParticipantById(userId);
        if (!u) return { success: false, reason: 'Invalid participant' };
        const inv = this.gameState.player.inventory.items;
        if (!inv[itemId] || inv[itemId] <= 0) return { success: false, reason: 'No item' };
        // Currently only support a simple heal potion
        const healAmount = itemId === 'health_potion' ? 30 : 0;
        if (healAmount <= 0) return { success: false, reason: 'Unsupported item' };
        const healed = this.healTarget(this.getRef(u), healAmount);
        this.gameState.removeItem(itemId, 1);
        this.gameState.addNotification(`Used ${itemId}, healed ${healed}`, 'item');
        this.performAction({ type: 'item', itemId });
        return { success: true, healed };
    }
    
    computeCaptureChance(tref, modifiers = {}) {
        // Base capture rate from species; default 30
        const species = tref.species || tref?.speciesData?.name;
        let baseRate = 30;
        if (typeof MonsterData !== 'undefined' && species) {
            const data = MonsterData.getSpecies(species);
            baseRate = data?.captureRate ?? baseRate;
        }

        // Enhanced HP factor calculation with strategic curve
        this.ensureCurrentStats(tref);
        const hp = tref.currentStats?.hp ?? 1;
        const maxHP = tref.stats?.hp ?? Math.max(1, hp);
        const hpPercent = hp / Math.max(1, maxHP);

        // Improved HP bonus curve: more strategic capture timing
        let hpBonus;
        if (hpPercent > 0.75) {
            hpBonus = 0; // No bonus when HP > 75%
        } else if (hpPercent > 0.5) {
            hpBonus = Math.floor((0.75 - hpPercent) * 60); // Gradual increase
        } else if (hpPercent > 0.25) {
            hpBonus = 15 + Math.floor((0.5 - hpPercent) * 80); // Better bonus
        } else {
            hpBonus = 35 + Math.floor((0.25 - hpPercent) * 100); // Maximum bonus for very low HP
        }

        // Level difference factor: harder to catch higher level monsters
        const playerLevel = this.gameState?.player?.level || 1;
        const monsterLevel = tref.level || 1;
        const levelDiff = monsterLevel - playerLevel;
        const levelPenalty = Math.max(0, levelDiff * 2); // -2% per level difference

        // Status effect bonuses
        let statusBonus = 0;
        if (tref.statusEffects?.includes?.('sleep')) statusBonus += 12;
        if (tref.statusEffects?.includes?.('paralysis')) statusBonus += 8;
        if (tref.statusEffects?.includes?.('frozen')) statusBonus += 10;

        // Modifiers
        const itemBonus = modifiers.itemBonus || 0; // e.g., capture item
        const flatBonus = modifiers.flatBonus || 0;
        const mult = modifiers.multiplier || 1;

        // Enhanced calculation with level consideration
        let chance = (baseRate + hpBonus - levelPenalty + statusBonus + itemBonus + flatBonus) * mult;
        chance = Math.max(5, Math.min(95, Math.floor(chance))); // Keep 5% minimum for test compatibility

        // Apply testing overrides if enabled (but only for manual testing, not unit tests)
        if (window.TESTING_OVERRIDES?.easyCaptureMode && !window.TEST_FRAMEWORK_RUNNING) {
            const originalChance = chance;
            chance = Math.max(chance, 75); // Minimum 75% capture rate in testing mode
            if (chance > originalChance) {
                console.log(`🧪 Testing mode boosted capture chance: ${originalChance}% → ${chance}%`);
            }
        }
        return chance;
    }

    attemptCapture(userId, targetId, options = {}) {

        // Handle undefined targetId - find the first enemy target
        if (targetId === undefined || targetId === null) {
            // Find the first enemy to capture
            const enemies = this.gameState.combat?.enemies || [];
            if (enemies.length > 0) {
                // Use the first enemy as the target
                const targetEnemy = enemies[0];
                const species = targetEnemy.species || targetEnemy?.speciesData?.name || 'unknown';
                const level = targetEnemy.level || 1;

                // Perform capture
                this.gameState.captureMonster(species, level, null);
                this.gameState.addNotification(`Captured ${species}!`, 'success');

                // Remove captured enemy from combat
                this.gameState.combat.enemies = this.gameState.combat.enemies.filter(enemy => enemy !== targetEnemy);

                // Check if combat should end (no enemies remaining)
                const remainingEnemies = this.gameState.combat?.enemies?.length || 0;
                if (remainingEnemies === 0) {
                    this.gameState.combat.active = false;
                    this.gameState.addNotification('All enemies captured! Victory!', 'success');
                }

                this.performAction({ type: 'capture', targetId: 'auto-target', success: true });
                return { success: true, chance: 100, roll: 1 };
            } else {
                return { success: false, reason: 'No enemies found to capture' };
            }
        }

        const t = this.getParticipantById(targetId);
        const tref = this.getRef(t);

        if (!t || !tref) {
            return { success: false, reason: 'Invalid target' };
        }
        const species = tref.species || tref?.speciesData?.name;
        const level = tref.level || 1;

        // Optional capture item support
        let itemBonus = 0;
        if (options.itemId) {
            const inv = this.gameState.player.inventory.items;
            if (inv[options.itemId] && inv[options.itemId] > 0) {
                // Provide a small bonus and consume the item
                itemBonus = 10;
                this.gameState.removeItem(options.itemId, 1);
                this.gameState.addNotification(`Used ${options.itemId} (+${itemBonus}% capture)`, 'item');
            }
        }

        const chance = this.computeCaptureChance(tref, { itemBonus });

        // Perform capture roll
        const roll = Math.floor(Math.random() * 100) + 1;
        let success = roll <= chance;

        // TESTING OVERRIDE: Force success in testing mode (but preserve roll for tests)
        if (window.TESTING_OVERRIDES?.easyCaptureMode && !window.TEST_FRAMEWORK_RUNNING && !success) {
            success = true;
        }
        if (success) {
            // Add to storage
            const stats = tref.stats || null;
            this.gameState.captureMonster(species, level, stats);
            this.gameState.addNotification(`Captured ${species}!`, 'success');
        } else {
            this.gameState.addNotification('Capture failed!', 'warning');
        }
        this.performAction({ type: 'capture', targetId, success });
        return { success, chance, roll };
    }
    
    attemptFlee(userId, successChance = 75) {
        const roll = Math.floor(Math.random() * 100) + 1;
        const success = roll <= successChance;
        if (success) {
            this.endBattle({ fled: true });
            this.gameState.addNotification('You fled the battle!', 'info');
        } else {
            this.gameState.addNotification('Could not flee!', 'warning');
        }
        this.performAction({ type: 'flee', success });
        return { success, roll };
    }

    // ================================================
    // STATUS EFFECTS (5.3)
    // ================================================
    applyStatusEffect(targetId, effect, duration = 3) {
        const t = this.getParticipantById(targetId);
        const ref = this.getRef(t);
        if (!t || !ref) return { success: false, reason: 'Invalid target' };
        if (typeof ref.applyStatusEffect === 'function') {
            ref.applyStatusEffect(effect, duration);
        } else {
            // Minimal emulation for plain objects
            if (!Array.isArray(ref.statusEffects)) ref.statusEffects = [];
            ref.statusEffects = ref.statusEffects.filter(se => se.type !== effect);
            ref.statusEffects.push({ type: effect, duration, remainingTurns: duration });
        }
        this.gameState.addNotification(`${effect} applied`, 'warning');
        this.performAction({ type: 'status', effect, targetId });
        return { success: true };
    }
    
    processEndOfTurn() {
        const c = this.gameState.combat;
        for (const p of c.turnOrder) {
            const ref = this.getRef(p);
            if (!ref) continue;
            if (typeof ref.processStatusEffects === 'function') {
                ref.processStatusEffects();
            } else if (Array.isArray(ref.statusEffects) && ref.statusEffects.length > 0) {
                const toRemove = [];
                for (const se of ref.statusEffects) {
                    switch (se.type) {
                        case 'poison': {
                            const maxHP = this.getStat(ref, 'hp', 1);
                            const dmg = Math.max(1, Math.floor(maxHP * 0.1));
                            this.applyDamage(ref, dmg);
                            break;
                        }
                        case 'burn': {
                            const maxHP = this.getStat(ref, 'hp', 1);
                            const dmg = Math.max(1, Math.floor(maxHP * 0.08));
                            this.applyDamage(ref, dmg);
                            break;
                        }
                        default:
                            break;
                    }
                    se.remainingTurns -= 1;
                    if (se.remainingTurns <= 0) toRemove.push(se.type);
                }
                if (toRemove.length > 0) {
                    ref.statusEffects = ref.statusEffects.filter(se => !toRemove.includes(se.type));
                }
            }
        }
    }

    // ================================================
    // ENEMY AI (5.4)
    // ================================================
    getAvailableTargets(side) {
        const opposite = side === 'enemy' ? 'player' : 'enemy';
        return this.gameState.combat.turnOrder.filter(p => p.side === opposite);
    }
    
    aiTakeTurn(participantId) {
        const p = this.getParticipantById(participantId);
        if (!p) return { success: false, reason: 'Invalid participant' };
        const ref = this.getRef(p);
        const targets = this.getAvailableTargets(p.side);
        let action;
        if (ref && typeof ref.chooseAIAction === 'function') {
            // Convert target turnOrder entries to their refs for AI convenience
            const targetRefs = targets.map(t => this.getRef(t)).filter(Boolean);
            action = ref.chooseAIAction(targetRefs);
        }
        // Fallback action
        if (!action) {
            // Simple: attack lowest HP target
            const target = targets.reduce((lowest, cur) => {
                const lr = this.getRef(lowest);
                const cr = this.getRef(cur);
                this.ensureCurrentStats(lr);
                this.ensureCurrentStats(cr);
                return (cr?.currentStats?.hp || 0) < (lr?.currentStats?.hp || Infinity) ? cur : lowest;
            }, targets[0]);
            if (target) action = { type: 'attack', target };
        }
        if (!action) return { success: false, reason: 'No action available' };
        
        // Execute action
        switch (action.type) {
            case 'ability': {
                // Treat as magic for now
                const targetId = this.findTurnIdForRef(action.target) || (targets[0]?.id ?? null);
                return this.magic(participantId, targetId, action.ability || 'ability', 5);
            }
            case 'spell': {
                // Cast a specific spell
                const targetId = this.findTurnIdForRef(action.target) || (targets[0]?.id ?? null);
                return this.castSpell(participantId, action.spellId, targetId);
            }
            case 'attack': {
                const targetId = this.findTurnIdForRef(action.target) || (targets[0]?.id ?? null);
                return this.attack(participantId, targetId);
            }
            case 'defend':
                this.performAction({ type: 'defend' });
                this.gameState.addNotification('Defending', 'info');
                return { success: true };
            default:
                return { success: false, reason: 'Unknown AI action' };
        }
    }
    
    findTurnIdForRef(targetRef) {
        // Accept either a participant id or a ref object
        const c = this.gameState.combat;
        const byId = this.getParticipantById(targetRef);
        if (byId) return byId.id;
        // If passed a participant object with an id
        if (targetRef && typeof targetRef === 'object' && 'id' in targetRef && typeof targetRef.id !== 'undefined') {
            return targetRef.id;
        }
        const found = c.turnOrder.find(p => this.getRef(p) === targetRef);
        return found ? found.id : null;
    }

    /**
     * Start an encounter with a monster
     */
    startEncounter(encounter) {
        try {
            // Create AI-enabled monster
            const species = encounter.species || encounter.monster || 'slime';
            const level = encounter.level || 1;
            const stats = encounter.stats || null;

            const monster = this.createEncounterMonster(species, level, stats);
            if (!monster) {
                throw new Error('Failed to create monster for encounter');
            }

            // Create player participant
            const player = this.gameState.player;
            const playerParticipant = {
                id: 'player',
                side: 'player',
                speed: player.stats?.speed || 50,
                ref: player
            };

            // Create monster participant
            const monsterParticipant = {
                id: 'monster_1',
                side: 'enemy',
                speed: monster.stats?.speed || 40,
                ref: monster
            };

            // Start battle with participants
            const participants = [playerParticipant, monsterParticipant];
            this.startBattle(participants);

            // Initialize MP for both participants
            if (this.gameState.spellSystem) {
                this.gameState.spellSystem.initializeMp(player);
                this.gameState.spellSystem.initializeMp(monster);
            }

            this.gameState.addNotification(`Encountered ${monster.species} (Level ${monster.level})!`, 'combat');

            return { success: true, monster: monster };

        } catch (error) {
            console.error('Failed to start encounter:', error);
            return { success: false, reason: error.message };
        }
    }

    /**
     * Create an AI-enabled monster for encounter
     */
    createEncounterMonster(species, level, stats = null) {
        if (typeof MonsterData !== 'undefined' && MonsterData.createAIMonster) {
            // Use the new AI monster creation
            return MonsterData.createAIMonster(species, level, stats);
        } else {
            // Fallback to basic monster creation
            const basicStats = stats || (MonsterData?.getStatsAtLevel ?
                MonsterData.getStatsAtLevel(species, level) :
                { hp: 20 + level * 5, mp: 10 + level * 2, attack: 10 + level * 2, defense: 8 + level });

            return {
                species: species,
                level: level,
                stats: basicStats,
                currentStats: { ...basicStats },
                abilities: ['attack'], // Basic fallback

                // Basic AI action for fallback
                chooseAIAction: function(targets) {
                    if (targets && targets.length > 0) {
                        return { type: 'attack', target: targets[0] };
                    }
                    return { type: 'defend' };
                }
            };
        }
    }

    /**
     * Enhanced AI turn processing with spell support
     */
    processAITurn() {
        const currentActor = this.getCurrentActor();
        if (!currentActor || currentActor.side !== 'enemy') {
            return { success: false, reason: 'Not an enemy turn' };
        }

        // Use the existing aiTakeTurn method
        const result = this.aiTakeTurn(currentActor.id);

        // Process MP regeneration for AI after their turn
        if (result.success && this.gameState.spellSystem) {
            const monsterRef = this.getRef(currentActor);
            if (monsterRef) {
                this.gameState.spellSystem.regenerateMP(monsterRef, 'combat');
            }
        }

        return result;
    }
}

// Global
window.CombatEngine = CombatEngine;
