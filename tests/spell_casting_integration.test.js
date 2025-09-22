/**
 * Integration Tests for Spell Casting System
 * Tests the complete spell casting pipeline from UI to SpellSystem
 */

describe('Spell Casting Integration Tests', () => {
    let game;
    let gameState;
    let spellSystem;

    beforeAll(() => {
        assertTruthy(typeof window.SawyersRPG !== 'undefined', 'Global game instance should be defined');
        game = window.SawyersRPG;
        assertTruthy(typeof game.getGameState === 'function', 'Global game instance should expose getGameState');
        gameState = game.getGameState();
        assertTruthy(gameState, 'GameState should be available');

        // Initialize required systems
        if (!gameState.spellSystem) gameState.initializeSpellSystem();
        if (!gameState.combatEngine) gameState.initializeCombatEngine();
        spellSystem = gameState.spellSystem;
        assertTruthy(spellSystem, 'SpellSystem should be available');
    });

    beforeEach(() => {
        // Reset combat state
        gameState.resetCombat();

        // Set up a basic player with spells
        gameState.player = {
            name: 'Test Player',
            class: 'wizard',
            level: 10,
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            stats: {
                hp: 100,
                maxHp: 100,
                mp: 50,
                maxMp: 50,
                attack: 20,
                defense: 15,
                magicAttack: 25,
                magicDefense: 20,
                speed: 18
            },
            learnedSpells: [
                {
                    spellId: 'fire',
                    learnedAt: 1,
                    source: 'class_start',
                    timestamp: Date.now(),
                    spellData: null
                },
                {
                    spellId: 'heal',
                    learnedAt: 1,
                    source: 'class_start',
                    timestamp: Date.now(),
                    spellData: null
                }
            ]
        };

        // Initialize combat with enemy
        gameState.combat = {
            active: true,
            player: gameState.player,
            enemies: [
                {
                    name: 'slime',
                    species: 'slime',
                    level: 1,
                    hp: 25,
                    maxHp: 25,
                    attack: 18,
                    defense: 15,
                    capturable: true,
                    id: 'monster_1',
                    ref: {}
                }
            ],
            turnCount: 1,
            currentTurn: 'player'
        };
    });

    it('should successfully cast fire spell and deal damage to enemy', () => {
        // Arrange
        const enemy = gameState.combat.enemies[0];
        const initialHP = enemy.hp;
        const initialMP = gameState.player.mp;

        // Act
        const result = gameState.castSpell('fire', 'monster_1');

        // Assert
        assertTruthy(result.success, `Fire spell should succeed (reason: ${result.reason})`);
        assertTruthy(result.effects.length > 0, 'Fire spell should have effects');
        assertTruthy(enemy.hp < initialHP, `Enemy HP should be reduced (was ${initialHP}, now ${enemy.hp})`);
        assertTruthy(gameState.player.mp < initialMP, 'Player MP should be consumed');

        // Check damage effect
        const damageEffect = result.effects.find(e => e.type === 'damage');
        assertTruthy(damageEffect, 'Should have damage effect');
        assertTruthy(damageEffect.amount > 0, 'Damage amount should be positive');
        assertEqual(damageEffect.target, 'slime', 'Damage should target correct enemy');
    });

    it('should successfully cast heal spell on player', () => {
        // Arrange - damage player first
        gameState.player.hp = 50;
        gameState.player.stats.hp = 50;
        const initialHP = gameState.player.hp;
        const initialMP = gameState.player.mp;

        // Act
        const result = gameState.castSpell('heal', null); // null target = self-target

        // Assert
        assertTruthy(result.success, `Heal spell should succeed (reason: ${result.reason})`);
        assertTruthy(result.effects.length > 0, 'Heal spell should have effects');
        assertTruthy(gameState.player.hp > initialHP || gameState.player.stats.hp > initialHP,
                    'Player HP should be increased');
        assertTruthy(gameState.player.mp < initialMP, 'Player MP should be consumed');

        // Check heal effect
        const healEffect = result.effects.find(e => e.type === 'heal');
        assertTruthy(healEffect, 'Should have heal effect');
        assertTruthy(healEffect.amount > 0, 'Heal amount should be positive');
    });

    it('should fail to cast spell when insufficient MP', () => {
        // Arrange - drain player MP
        gameState.player.mp = 0;
        gameState.player.stats.mp = 0;

        // Act
        const result = gameState.castSpell('fire', 'monster_1');

        // Assert
        assertFalsy(result.success, 'Fire spell should fail with insufficient MP');
        assertTruthy(result.reason.includes('MP') || result.reason.includes('mp'),
                    `Failure reason should mention MP: ${result.reason}`);
    });

    it('should find combat enemies as valid targets', () => {
        // Arrange
        const enemy = gameState.combat.enemies[0];

        // Act
        const foundEnemy = spellSystem.getMonsterById('monster_1');

        // Assert
        assertTruthy(foundEnemy, 'Should find combat enemy by ID');
        assertEqual(foundEnemy.name, enemy.name, 'Found enemy should match combat enemy');
        assertEqual(foundEnemy.id, enemy.id, 'Found enemy should have correct ID');
    });

    it('should handle spell effects with direct HP property structure', () => {
        // Arrange
        const enemy = gameState.combat.enemies[0];
        const initialHP = enemy.hp;

        // Verify enemy uses direct HP (not stats.hp)
        assertTruthy(enemy.hp !== undefined, 'Enemy should have direct hp property');
        assertEqual(enemy.stats, undefined, 'Enemy should not have stats wrapper');

        // Act
        const result = spellSystem.applyDamageEffect(
            gameState.player,
            { name: 'Test Spell', element: 'fire', type: 'offensive' },
            { type: 'damage', scaledPower: 20 },
            enemy
        );

        // Assert
        assertTruthy(result, 'Damage effect should be applied successfully');
        assertEqual(result.type, 'damage', 'Result should be damage type');
        assertTruthy(result.amount > 0, 'Damage amount should be positive');
        assertTruthy(enemy.hp < initialHP, 'Enemy HP should be reduced');
    });

    it('should get available spells from SpellSystem', () => {
        // Act
        const availableSpells = spellSystem.getAvailableSpells();

        // Assert
        assertTruthy(Array.isArray(availableSpells), 'Should return array of spells');
        assertTruthy(availableSpells.length > 0, 'Should have available spells');

        // Check spell structure
        const spell = availableSpells[0];
        assertTruthy(spell.spellId, 'Spell should have spellId');
        assertTruthy(spell.spellData, 'Spell should have spellData');
        assertTruthy(typeof spell.canCast === 'boolean', 'Spell should have canCast boolean');
    });

    it('should handle spell targeting for both enemy and ally targets', () => {
        // Test enemy targeting
        const enemyResult = gameState.castSpell('fire', 'monster_1');
        assertTruthy(enemyResult.success, 'Should successfully target enemy');

        // Test self-targeting (heal)
        gameState.player.hp = 50; // Damage player first
        const healResult = gameState.castSpell('heal', null);
        assertTruthy(healResult.success, 'Should successfully self-target');
    });

    it('should maintain spell result structure with caster and target info', () => {
        // Act
        const result = gameState.castSpell('fire', 'monster_1');

        // Assert
        assertTruthy(result.success, 'Spell should succeed');
        assertTruthy(result.caster, 'Result should include caster');
        assertTruthy(result.target, 'Result should include target');
        assertTruthy(result.spell, 'Result should include spell data');
        assertTruthy(Array.isArray(result.effects), 'Result should include effects array');
        assertTruthy(typeof result.mpConsumed === 'number', 'Result should include MP consumed');
    });

    it('should handle spell effects preprocessing and scaling', () => {
        // Arrange
        const testSpell = {
            name: 'Test Spell',
            effects: [
                { type: 'damage', power: 10 }
            ]
        };

        // Act
        const processedEffects = spellSystem.preprocessSpellEffects(
            gameState.player,
            testSpell,
            testSpell.effects
        );

        // Assert
        assertTruthy(Array.isArray(processedEffects), 'Should return processed effects array');
        assertTruthy(processedEffects.length > 0, 'Should have processed effects');

        const effect = processedEffects[0];
        assertTruthy(effect.scaledPower !== undefined, 'Effect should have scaled power');
        assertTruthy(effect.scaledPower >= effect.power, 'Scaled power should be >= base power');
    });

    it('should prevent casting when target not found', () => {
        // Act
        const result = gameState.castSpell('fire', 'nonexistent_target');

        // Assert
        assertFalsy(result.success, 'Should fail when target not found');
        assertTruthy(result.reason, 'Should provide failure reason');
    });
});