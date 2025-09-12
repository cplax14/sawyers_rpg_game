/**
 * Unit Tests for Combat Damage and Status Effects (5.3)
 */

describe('Combat Damage and Status Effects Tests', () => {
    let game;
    let gameState;

    beforeAll(() => {
        assertTruthy(typeof window.SawyersRPG !== 'undefined', 'Global game instance should be defined');
        game = window.SawyersRPG;
        assertTruthy(typeof game.getGameState === 'function', 'Global game instance should expose getGameState');
        gameState = game.getGameState();
        assertTruthy(gameState, 'GameState should be available');
        if (!gameState.combatEngine) gameState.initializeCombatEngine();
    });

    beforeEach(() => {
        gameState.resetCombat();
        if (!gameState.combatEngine) gameState.initializeCombatEngine();
    });

    function makeParticipants() {
        const a = new Monster('slime', 10, false);
        const b = new Monster('goblin', 10, true);
        a.currentStats = { hp: a.stats.hp, mp: a.stats.mp };
        b.currentStats = { hp: b.stats.hp, mp: b.stats.mp };
        const participants = [
            { id: 'A', side: 'player', speed: a.stats.speed, ref: a },
            { id: 'B', side: 'enemy', speed: b.stats.speed, ref: b }
        ];
        return { a, b, participants };
    }

    it('computeDamage produces higher damage with crit than non-crit (controlled RNG)', () => {
        const { a, b, participants } = makeParticipants();
        gameState.combatEngine.startBattle(participants);

        const originalRandom = Math.random;
        try {
            // Non-crit path: variance ~ 1.0, crit false
            let seq = [0.99, 0.99];
            Math.random = () => seq.shift() ?? 0.99;
            const nonCrit = gameState.combatEngine.computeDamage(a, b, 'physical');

            // Crit path: variance low (0.85) and crit true
            seq = [0.0, 0.0];
            Math.random = () => seq.shift() ?? 0.0;
            const crit = gameState.combatEngine.computeDamage(a, b, 'physical');

            assertTruthy(crit >= nonCrit, `Crit (${crit}) should be >= non-crit (${nonCrit})`);
        } finally {
            Math.random = originalRandom;
        }
    });

    it('applyStatusEffect adds poison and processEndOfTurn applies DOT and expires', () => {
        const { b, participants } = makeParticipants();
        gameState.combatEngine.startBattle(participants);

        const startHP = b.currentStats.hp;
        const apply = gameState.combatEngine.applyStatusEffect('B', 'poison', 2);
        assertTruthy(apply.success, 'Status application should succeed');

        // First end of turn
        gameState.combatEngine.processEndOfTurn();
        assertTruthy(b.currentStats.hp < startHP, 'HP should be reduced by DOT');
        const afterOneHP = b.currentStats.hp;

        // Second end of turn (should expire after)
        gameState.combatEngine.processEndOfTurn();
        assertTruthy(b.currentStats.hp < afterOneHP, 'HP should be further reduced by DOT');

        // Third end of turn should not reduce further if expired
        const afterTwoHP = b.currentStats.hp;
        gameState.combatEngine.processEndOfTurn();
        assertEqual(b.currentStats.hp, afterTwoHP, 'Poison should have expired and stop reducing HP');
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Combat status tests loaded.');
}
