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
        c.currentTurn = (c.currentTurn + 1) % c.turnOrder.length;
        if (c.currentTurn === 0) {
            c.turn += 1;
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
        const drops = [];
        for (const e of enemies) {
            const ref = this.getRef(e) || e.ref || {};
            const level = ref.level || 1;
            totalXP += level * 10;
            totalGold += level * 3;
            // 20% chance drop health_potion
            if (Math.random() < 0.2) drops.push('health_potion');
        }
        if (totalXP > 0) {
            this.gameState.addExperience(totalXP);
        }
        if (totalGold > 0) {
            this.gameState.addGold(totalGold);
        }
        for (const item of drops) {
            this.gameState.addItem(item, 1);
        }
        this.gameState.addNotification(`Battle Rewards: +${totalXP} EXP, +${totalGold} gold${drops.length?`, items: ${drops.join(', ')}`:''}`, 'success');
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
        // Base formula with level factor if available
        const level = attackerRef?.level || 1;
        let base = Math.max(1, Math.floor(((2 * level) / 5 + 2) * (atk / Math.max(1, def)) + 1));
        // Variance 85% - 100%
        const variance = 0.85 + (Math.random() * 0.15);
        base = Math.max(1, Math.floor(base * variance));
        // Crit 10% chance: 1.5x
        const crit = Math.random() < 0.10;
        if (crit) base = Math.max(1, Math.floor(base * 1.5));
        return base;
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
        // Try to consume MP if method exists
        let consumed = true;
        if (aref && typeof aref.useMP === 'function') {
            consumed = aref.useMP(mpCost);
        } else {
            // Fallback to manual mp field if present
            this.ensureCurrentStats(aref);
            if (aref?.currentStats) {
                if ((aref.currentStats.mp || 0) >= mpCost) {
                    aref.currentStats.mp -= mpCost;
                    consumed = true;
                } else {
                    consumed = false;
                }
            }
        }
        if (!consumed) return { success: false, reason: 'Not enough MP' };
        const dmg = this.computeDamage(aref, this.getRef(d), 'magic') + 5; // small magic bonus
        const dealt = this.applyDamage(this.getRef(d), dmg);
        this.gameState.addNotification(`${moveId} hits for ${dealt}`, 'info');
        this.performAction({ type: 'magic', moveId, targetId });
        return { success: true, damage: dealt };
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
        // HP factor: lower HP increases chance up to +60
        this.ensureCurrentStats(tref);
        const hp = tref.currentStats?.hp ?? 1;
        const maxHP = tref.stats?.hp ?? Math.max(1, hp);
        const hpPercent = hp / Math.max(1, maxHP);
        const hpBonus = Math.floor((1 - hpPercent) * 60);
        // Modifiers
        const itemBonus = modifiers.itemBonus || 0; // e.g., capture item
        const flatBonus = modifiers.flatBonus || 0;
        const mult = modifiers.multiplier || 1;
        // Combine and clamp
        let chance = ((baseRate * 0.5) + hpBonus + itemBonus + flatBonus) * mult;
        chance = Math.max(5, Math.min(95, Math.floor(chance)));

        // Apply testing overrides if enabled
        if (window.TESTING_OVERRIDES?.easyCaptureMode) {
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

        console.log(`🔍 CAPTURE DEBUG: About to call computeCaptureChance...`);
        const chance = this.computeCaptureChance(tref, { itemBonus });
        console.log(`🔍 CAPTURE DEBUG: computeCaptureChance returned: ${chance}%`);

        // TESTING OVERRIDE: Force 100% success in testing mode
        let success = false;
        if (window.TESTING_OVERRIDES?.easyCaptureMode) {
            success = true;
            console.log(`🧪 TESTING MODE: Forcing capture success (bypassing roll)`);
        } else {
            const roll = Math.floor(Math.random() * 100) + 1;
            success = roll <= chance;
            console.log(`🔍 CAPTURE DEBUG: Normal mode - rolled ${roll}, needed ≤${chance}, success: ${success}`);
        }
        if (success) {
            // Add to storage
            const stats = tref.stats || null;
            console.log(`🎯 Combat: About to call captureMonster(${species}, ${level})`);
            console.log(`🎯 Combat: this.gameState exists:`, !!this.gameState);
            console.log(`🎯 Combat: window.GameState exists:`, !!window.GameState);
            console.log(`🎯 Combat: Same instance?`, this.gameState === window.GameState);

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
}

// Global
window.CombatEngine = CombatEngine;
