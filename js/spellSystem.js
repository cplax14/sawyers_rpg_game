/**
 * Spell System Manager
 * Handles MP management, spell learning, casting validation, and effect application
 */

class SpellSystem {
    constructor(gameState) {
        this.gameState = gameState;
        this.mpRegenRate = 0.1; // MP per second during combat
        this.mpRegenRateOutOfCombat = 0.5; // MP per second outside combat
        this.lastRegenTick = Date.now();
        this.activeCooldowns = new Map(); // spellId -> endTime
        this.activeEffects = new Map(); // entityId -> { effectId, endTime, data }

        // Performance tracking
        this.castStartTime = null;
        this.maxProcessingTime = 50; // ms budget for spell processing
    }

    /**
     * Initialize spell system for player and monsters
     */
    initialize() {
        // Ensure player has MP tracking
        if (!this.gameState.player.stats.mp) {
            this.gameState.player.stats.mp = this.gameState.player.stats.maxMp || 50;
        }
        if (!this.gameState.player.stats.maxMp) {
            this.gameState.player.stats.maxMp = 50 + (this.gameState.player.level - 1) * 5;
        }

        // Initialize learned spells if not present
        if (!this.gameState.player.learnedSpells) {
            this.gameState.player.learnedSpells = [];
            this.initializeStartingSpells();
        }

        // Start MP regeneration
        this.startMpRegeneration();

        console.log('🪄 Spell System initialized');
    }

    /**
     * Give player starting spells based on class
     */
    initializeStartingSpells() {
        const playerClass = this.gameState.player.class;
        if (!playerClass || typeof SpellData === 'undefined') return;

        const startingSpells = [];

        // Check all spells for class-appropriate starting spells
        Object.entries(SpellData.spells).forEach(([spellId, spell]) => {
            if (spell.availableClasses && spell.availableClasses.includes(playerClass) &&
                spell.learnLevel <= this.gameState.player.level) {
                startingSpells.push(spellId);
            }
        });

        this.gameState.player.learnedSpells = startingSpells;
        console.log(`🎓 Player learned ${startingSpells.length} starting spells: ${startingSpells.join(', ')}`);
    }

    /**
     * Check if player can cast a spell
     */
    canCastSpell(spellId, casterId = 'player') {
        const spell = this.getSpell(spellId);
        if (!spell) return { canCast: false, reason: 'Spell not found' };

        const caster = casterId === 'player' ? this.gameState.player : this.getMonsterById(casterId);
        if (!caster) return { canCast: false, reason: 'Caster not found' };

        // Check if spell is learned (for players)
        if (casterId === 'player' && !this.gameState.player.learnedSpells.includes(spellId)) {
            return { canCast: false, reason: 'Spell not learned' };
        }

        // Check MP cost
        if (caster.stats.mp < spell.mpCost) {
            return { canCast: false, reason: 'Not enough MP' };
        }

        // Check cooldown
        if (this.isSpellOnCooldown(spellId, casterId)) {
            const remaining = this.getRemainingCooldown(spellId, casterId);
            return { canCast: false, reason: `Spell on cooldown (${Math.ceil(remaining)}s remaining)` };
        }

        // Check class restrictions (for players)
        if (casterId === 'player' && spell.availableClasses &&
            !spell.availableClasses.includes(this.gameState.player.class)) {
            return { canCast: false, reason: 'Class cannot use this spell' };
        }

        return { canCast: true };
    }

    /**
     * Cast a spell
     */
    castSpell(spellId, casterId = 'player', targetId = null, targetPosition = null) {
        this.castStartTime = Date.now();

        const canCast = this.canCastSpell(spellId, casterId);
        if (!canCast.canCast) {
            return { success: false, reason: canCast.reason };
        }

        const spell = this.getSpell(spellId);
        const caster = casterId === 'player' ? this.gameState.player : this.getMonsterById(casterId);

        // Consume MP
        caster.stats.mp -= spell.mpCost;

        // Apply cooldown
        if (spell.cooldown > 0) {
            this.setCooldown(spellId, casterId, spell.cooldown);
        }

        // Determine targets
        const targets = this.determineTargets(spell, casterId, targetId, targetPosition);

        // Apply spell effects
        const results = this.applySpellEffects(spell, caster, targets);

        // Log casting
        console.log(`✨ ${caster.name || 'Player'} cast ${spell.name} for ${spell.mpCost} MP`);

        // Add notification for player casts
        if (casterId === 'player') {
            this.gameState.addNotification(`Cast ${spell.name} (-${spell.mpCost} MP)`, 'spell');
        }

        // Performance check
        const processingTime = Date.now() - this.castStartTime;
        if (processingTime > this.maxProcessingTime) {
            console.warn(`⚠️ Spell processing took ${processingTime}ms (budget: ${this.maxProcessingTime}ms)`);
        }

        return {
            success: true,
            spell: spell,
            caster: caster,
            targets: targets,
            results: results,
            processingTime: processingTime
        };
    }

    /**
     * Determine spell targets based on targeting type
     */
    determineTargets(spell, casterId, targetId, targetPosition) {
        const targets = [];

        console.log(`🎯 SpellSystem determining targets for ${spell.name}:`, {
            spellTarget: spell.target,
            casterId,
            targetId,
            targetPosition
        });

        switch (spell.target) {
            case 'self':
                targets.push(casterId === 'player' ? this.gameState.player : this.getMonsterById(casterId));
                break;

            case 'single_ally':
                if (targetId) {
                    const target = targetId === 'player' ? this.gameState.player : this.getMonsterById(targetId);
                    console.log(`🤝 Looking for ally target: ${targetId}, found:`, target);
                    if (target && this.areAllies(casterId, targetId)) {
                        targets.push(target);
                    }
                }
                break;

            case 'single_enemy':
                if (targetId) {
                    const target = targetId === 'player' ? this.gameState.player : this.getMonsterById(targetId);
                    console.log(`⚔️ Looking for enemy target: ${targetId}, found:`, target);
                    const areAllies = this.areAllies(casterId, targetId);
                    console.log(`🤝 Are allies check: casterId=${casterId}, targetId=${targetId}, result=${areAllies}`);

                    if (target && !areAllies) {
                        console.log(`✅ Adding target to array:`, target);
                        targets.push(target);
                    } else {
                        console.log(`❌ Target rejected - target exists: ${!!target}, are allies: ${areAllies}`);
                    }
                }
                break;

            case 'all_allies':
                if (casterId === 'player') {
                    targets.push(this.gameState.player);
                    this.gameState.monsters.party.forEach(monster => targets.push(monster));
                } else {
                    // For enemy monsters, target all enemy monsters in combat
                    if (this.gameState.combat && this.gameState.combat.participants) {
                        this.gameState.combat.participants
                            .filter(p => p.side === 'enemy')
                            .forEach(p => targets.push(p.ref));
                    }
                }
                break;

            case 'all_enemies':
                if (casterId === 'player') {
                    // Target all enemy monsters in combat
                    if (this.gameState.combat && this.gameState.combat.participants) {
                        this.gameState.combat.participants
                            .filter(p => p.side === 'enemy')
                            .forEach(p => targets.push(p.ref));
                    }
                } else {
                    // For enemy monsters, target player and party
                    targets.push(this.gameState.player);
                    this.gameState.monsters.party.forEach(monster => targets.push(monster));
                }
                break;

            case 'area':
                // For area spells, get all entities in the target area
                // This would need position-based targeting implementation
                break;
        }

        const validTargets = targets.filter(target => {
            // Accept targets with either target.stats or direct stat properties
            return target && (target.stats || (target.hp !== undefined || target.maxHp !== undefined));
        });
        console.log(`🎯 Final targets array: ${targets.length} -> ${validTargets.length}`, {
            allTargets: targets,
            validTargets: validTargets
        });
        return validTargets;
    }

    /**
     * Apply spell effects to targets
     */
    applySpellEffects(spell, caster, targets) {
        const results = [];

        targets.forEach(target => {
            spell.effects.forEach(effect => {
                const result = this.applySingleEffect(effect, caster, target, spell);
                results.push({ target, effect, result });
            });
        });

        return results;
    }

    /**
     * Apply a single spell effect
     */
    applySingleEffect(effect, caster, target, spell) {
        switch (effect.type) {
            case 'damage':
                return this.applyDamage(effect, caster, target, spell);

            case 'heal':
                return this.applyHealing(effect, caster, target, spell);

            case 'buff':
                return this.applyBuff(effect, caster, target, spell);

            case 'debuff':
                return this.applyDebuff(effect, caster, target, spell);

            case 'remove_status':
                return this.removeStatusEffects(effect, target);

            case 'mp_restore':
                return this.restoreMp(effect, caster, target, spell);

            default:
                console.warn(`Unknown spell effect type: ${effect.type}`);
                return { success: false, reason: 'Unknown effect type' };
        }
    }

    /**
     * Get stat value from target (handles both target.stats.prop and target.prop formats)
     */
    getStat(target, statName, defaultValue = 0) {
        if (target.stats && target.stats[statName] !== undefined) {
            return target.stats[statName];
        }
        return target[statName] !== undefined ? target[statName] : defaultValue;
    }

    /**
     * Set stat value on target (handles both target.stats.prop and target.prop formats)
     */
    setStat(target, statName, value) {
        if (target.stats) {
            target.stats[statName] = value;
        } else {
            target[statName] = value;
        }
    }

    /**
     * Apply damage effect
     */
    applyDamage(effect, caster, target, spell) {
        let damage = effect.power || 0;

        // Apply scaling
        if (effect.scaling && effect.scalingMultiplier) {
            const scalingStat = caster.stats[effect.scaling] || 0;
            damage += scalingStat * effect.scalingMultiplier;
        }

        // Apply elemental modifiers (if target has resistances)
        if (spell.element && target.resistances && target.resistances[spell.element]) {
            damage *= (1 - target.resistances[spell.element]);
        }

        // Apply random variance
        damage = Math.floor(damage * (0.9 + Math.random() * 0.2)); // ±10% variance

        // Apply damage
        const actualDamage = Math.max(1, damage);
        const currentHp = this.getStat(target, 'hp', 0);
        const newHp = Math.max(0, currentHp - actualDamage);
        this.setStat(target, 'hp', newHp);

        console.log(`💥 ${spell.name} dealt ${actualDamage} damage to ${target.name || 'target'}`);

        return {
            success: true,
            type: 'damage',
            amount: actualDamage,
            isKo: newHp <= 0
        };
    }

    /**
     * Apply healing effect
     */
    applyHealing(effect, caster, target, spell) {
        let healing = effect.power || 0;

        // Apply scaling
        if (effect.scaling && effect.scalingMultiplier) {
            const scalingStat = caster.stats[effect.scaling] || 0;
            healing += scalingStat * effect.scalingMultiplier;
        }

        // Apply healing
        const maxHp = target.stats.maxHp || target.stats.hp;
        const actualHealing = Math.min(healing, maxHp - target.stats.hp);
        target.stats.hp = Math.min(maxHp, target.stats.hp + healing);

        console.log(`💚 ${spell.name} healed ${actualHealing} HP for ${target.name || 'target'}`);

        return {
            success: true,
            type: 'healing',
            amount: actualHealing
        };
    }

    /**
     * Apply buff effect
     */
    applyBuff(effect, caster, target, spell) {
        const buffId = `${spell.id || 'spell'}_${effect.type}_${Date.now()}`;
        const duration = effect.duration || 30; // seconds
        const endTime = Date.now() + (duration * 1000);

        // Store the buff
        if (!this.activeEffects.has(target.id || 'player')) {
            this.activeEffects.set(target.id || 'player', []);
        }

        this.activeEffects.get(target.id || 'player').push({
            id: buffId,
            type: 'buff',
            effect: effect,
            endTime: endTime,
            stat: effect.stat,
            value: effect.value
        });

        // Apply stat modification
        if (effect.stat && effect.value) {
            target.stats[effect.stat] = (target.stats[effect.stat] || 0) + effect.value;
        }

        console.log(`⬆️ ${spell.name} buffed ${effect.stat} by ${effect.value} for ${duration}s`);

        return {
            success: true,
            type: 'buff',
            stat: effect.stat,
            value: effect.value,
            duration: duration
        };
    }

    /**
     * Apply debuff effect
     */
    applyDebuff(effect, caster, target, spell) {
        // Similar to buff but with negative effects
        const debuffId = `${spell.id || 'spell'}_${effect.type}_${Date.now()}`;
        const duration = effect.duration || 30;
        const endTime = Date.now() + (duration * 1000);

        if (!this.activeEffects.has(target.id || 'player')) {
            this.activeEffects.set(target.id || 'player', []);
        }

        this.activeEffects.get(target.id || 'player').push({
            id: debuffId,
            type: 'debuff',
            effect: effect,
            endTime: endTime,
            stat: effect.stat,
            value: effect.value
        });

        // Apply stat modification (negative)
        if (effect.stat && effect.value) {
            target.stats[effect.stat] = Math.max(1, (target.stats[effect.stat] || 0) - effect.value);
        }

        console.log(`⬇️ ${spell.name} debuffed ${effect.stat} by ${effect.value} for ${duration}s`);

        return {
            success: true,
            type: 'debuff',
            stat: effect.stat,
            value: effect.value,
            duration: duration
        };
    }

    /**
     * Remove status effects
     */
    removeStatusEffects(effect, target) {
        let removedCount = 0;
        const targetEffects = this.activeEffects.get(target.id || 'player') || [];

        if (effect.conditions) {
            effect.conditions.forEach(condition => {
                const effectsToRemove = targetEffects.filter(e =>
                    e.type === 'debuff' && e.effect.condition === condition
                );
                removedCount += effectsToRemove.length;

                // Remove from active effects
                effectsToRemove.forEach(e => {
                    const index = targetEffects.indexOf(e);
                    if (index > -1) targetEffects.splice(index, 1);
                });
            });
        }

        console.log(`🧹 Removed ${removedCount} status effects`);

        return {
            success: true,
            type: 'status_removal',
            removedCount: removedCount
        };
    }

    /**
     * Restore MP
     */
    restoreMp(effect, caster, target, spell) {
        let mpRestore = effect.power || 0;

        if (effect.scaling && effect.scalingMultiplier) {
            const scalingStat = caster.stats[effect.scaling] || 0;
            mpRestore += scalingStat * effect.scalingMultiplier;
        }

        const maxMp = target.stats.maxMp || 100;
        const actualRestore = Math.min(mpRestore, maxMp - target.stats.mp);
        target.stats.mp = Math.min(maxMp, target.stats.mp + mpRestore);

        console.log(`💙 ${spell.name} restored ${actualRestore} MP for ${target.name || 'target'}`);

        return {
            success: true,
            type: 'mp_restore',
            amount: actualRestore
        };
    }

    /**
     * Learn a new spell
     */
    learnSpell(spellId, playerId = 'player') {
        if (playerId !== 'player') {
            console.warn('Spell learning only implemented for player');
            return false;
        }

        const spell = this.getSpell(spellId);
        if (!spell) {
            console.warn(`Spell ${spellId} not found`);
            return false;
        }

        // Check if already learned
        if (this.gameState.player.learnedSpells.includes(spellId)) {
            console.log(`${spell.name} already learned`);
            return false;
        }

        // Check class restrictions
        if (spell.availableClasses && !spell.availableClasses.includes(this.gameState.player.class)) {
            console.warn(`${this.gameState.player.class} cannot learn ${spell.name}`);
            return false;
        }

        // Check level requirement
        if (spell.learnLevel && this.gameState.player.level < spell.learnLevel) {
            console.warn(`Need level ${spell.learnLevel} to learn ${spell.name}`);
            return false;
        }

        // Learn the spell
        this.gameState.player.learnedSpells.push(spellId);
        this.gameState.addNotification(`Learned spell: ${spell.name}!`, 'spell');

        console.log(`🎓 Player learned ${spell.name}`);
        return true;
    }

    /**
     * Start MP regeneration system
     */
    startMpRegeneration() {
        setInterval(() => {
            this.updateMpRegeneration();
            this.updateActiveEffects();
            this.updateCooldowns();
        }, 1000); // Update every second
    }

    /**
     * Update MP regeneration
     */
    updateMpRegeneration() {
        const now = Date.now();
        const deltaTime = (now - this.lastRegenTick) / 1000; // seconds
        this.lastRegenTick = now;

        const regenRate = this.gameState.combat?.active ? this.mpRegenRate : this.mpRegenRateOutOfCombat;
        const regenAmount = regenRate * deltaTime;

        // Regenerate player MP
        if (this.gameState.player.stats.mp < this.gameState.player.stats.maxMp) {
            this.gameState.player.stats.mp = Math.min(
                this.gameState.player.stats.maxMp,
                this.gameState.player.stats.mp + regenAmount
            );
        }

        // Regenerate party monster MP
        this.gameState.monsters.party.forEach(monster => {
            if (monster.stats.mp < monster.stats.maxMp) {
                monster.stats.mp = Math.min(
                    monster.stats.maxMp || 50,
                    monster.stats.mp + regenAmount
                );
            }
        });

        // Synchronize MP values for UI compatibility
        if (typeof this.gameState.synchronizeMpValues === 'function') {
            this.gameState.synchronizeMpValues();
        }
    }

    /**
     * Update active spell effects (buffs/debuffs)
     */
    updateActiveEffects() {
        const now = Date.now();

        this.activeEffects.forEach((effects, entityId) => {
            const expiredEffects = effects.filter(effect => effect.endTime <= now);

            // Remove expired effects
            expiredEffects.forEach(effect => {
                this.removeActiveEffect(entityId, effect);
                const index = effects.indexOf(effect);
                if (index > -1) effects.splice(index, 1);
            });
        });
    }

    /**
     * Remove an active effect and reverse its stat changes
     */
    removeActiveEffect(entityId, effect) {
        const entity = entityId === 'player' ? this.gameState.player : this.getMonsterById(entityId);
        if (!entity) return;

        if (effect.stat && effect.value) {
            if (effect.type === 'buff') {
                entity.stats[effect.stat] = Math.max(1, entity.stats[effect.stat] - effect.value);
            } else if (effect.type === 'debuff') {
                entity.stats[effect.stat] = (entity.stats[effect.stat] || 0) + effect.value;
            }
        }

        console.log(`⏰ Effect expired: ${effect.type} on ${effect.stat}`);
    }

    /**
     * Update spell cooldowns
     */
    updateCooldowns() {
        const now = Date.now();

        this.activeCooldowns.forEach((endTime, key) => {
            if (endTime <= now) {
                this.activeCooldowns.delete(key);
            }
        });
    }

    /**
     * Set spell cooldown
     */
    setCooldown(spellId, casterId, cooldownSeconds) {
        const key = `${casterId}_${spellId}`;
        const endTime = Date.now() + (cooldownSeconds * 1000);
        this.activeCooldowns.set(key, endTime);
    }

    /**
     * Check if spell is on cooldown
     */
    isSpellOnCooldown(spellId, casterId) {
        const key = `${casterId}_${spellId}`;
        return this.activeCooldowns.has(key);
    }

    /**
     * Get remaining cooldown time in seconds
     */
    getRemainingCooldown(spellId, casterId) {
        const key = `${casterId}_${spellId}`;
        const endTime = this.activeCooldowns.get(key);
        if (!endTime) return 0;

        return Math.max(0, (endTime - Date.now()) / 1000);
    }

    /**
     * Check if two entities are allies
     */
    areAllies(entity1Id, entity2Id) {
        // If one is player, check if the other is in party (not combat enemies)
        if (entity1Id === 'player') {
            return this.gameState.monsters.party.some(m => m.id === entity2Id || m.monsterId === entity2Id || m.name === entity2Id);
        }
        if (entity2Id === 'player') {
            return this.gameState.monsters.party.some(m => m.id === entity1Id || m.monsterId === entity1Id || m.name === entity1Id);
        }

        // All party monsters are allies with each other
        const inParty1 = this.gameState.monsters.party.some(m => m.id === entity1Id || m.monsterId === entity1Id || m.name === entity1Id);
        const inParty2 = this.gameState.monsters.party.some(m => m.id === entity2Id || m.monsterId === entity2Id || m.name === entity2Id);

        return inParty1 && inParty2;
    }

    /**
     * Get spell data
     */
    getSpell(spellId) {
        return typeof SpellData !== 'undefined' ? SpellData.spells[spellId] : null;
    }

    /**
     * Get monster by ID (includes combat enemies)
     */
    getMonsterById(monsterId) {
        if (!monsterId) return null;

        // Check party and storage monsters by ID
        let monster = [...this.gameState.monsters.party, ...this.gameState.monsters.storage]
            .find(m => m.id === monsterId || m.monsterId === monsterId);

        // If not found, check combat enemies by ID
        if (!monster && this.gameState.combat && this.gameState.combat.enemies) {
            monster = this.gameState.combat.enemies.find(e =>
                e.id === monsterId || e.monsterId === monsterId
            );
        }

        // If still not found, try by name as fallback
        if (!monster && this.gameState.combat && this.gameState.combat.enemies) {
            monster = this.gameState.combat.enemies.find(e => e.name === monsterId);
        }

        return monster;
    }

    /**
     * Get player's available spells
     */
    getAvailableSpells() {
        // Ensure learnedSpells array exists
        if (!this.gameState.player.learnedSpells) {
            this.gameState.player.learnedSpells = [];
            this.initializeStartingSpells();
        }

        return this.gameState.player.learnedSpells.map(spellId => ({
            id: spellId,
            data: this.getSpell(spellId),
            canCast: this.canCastSpell(spellId),
            cooldown: this.getRemainingCooldown(spellId, 'player')
        })).filter(spell => spell.data);
    }

    /**
     * Get spells available for learning at current level
     */
    getLearnableSpells() {
        if (typeof SpellData === 'undefined') return [];

        const playerClass = this.gameState.player.class;
        const playerLevel = this.gameState.player.level;
        const learnedSpells = this.gameState.player.learnedSpells;

        return Object.entries(SpellData.spells)
            .filter(([spellId, spell]) => {
                return !learnedSpells.includes(spellId) &&
                       spell.availableClasses && spell.availableClasses.includes(playerClass) &&
                       spell.learnLevel <= playerLevel;
            })
            .map(([spellId, spell]) => ({ id: spellId, data: spell }));
    }

    /**
     * Export spell system state for saving
     */
    exportState() {
        return {
            activeCooldowns: Array.from(this.activeCooldowns.entries()),
            activeEffects: Array.from(this.activeEffects.entries()),
            mpRegenRate: this.mpRegenRate,
            mpRegenRateOutOfCombat: this.mpRegenRateOutOfCombat
        };
    }

    /**
     * Import spell system state from save
     */
    importState(state) {
        if (state.activeCooldowns) {
            this.activeCooldowns = new Map(state.activeCooldowns);
        }
        if (state.activeEffects) {
            this.activeEffects = new Map(state.activeEffects);
        }
        if (state.mpRegenRate) {
            this.mpRegenRate = state.mpRegenRate;
        }
        if (state.mpRegenRateOutOfCombat) {
            this.mpRegenRateOutOfCombat = state.mpRegenRateOutOfCombat;
        }
    }
}

// Make available globally
window.SpellSystem = SpellSystem;