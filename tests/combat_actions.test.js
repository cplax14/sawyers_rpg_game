/**
 * Unit Tests for Core Combat Actions (5.2)
 */

describe('Combat Actions Tests', () => {
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
        // Reset combat and party state
        gameState.resetCombat();
        if (!gameState.combatEngine) gameState.initializeCombatEngine();
    });

    function makeParticipants() {
        const a = new Monster('slime', 10, false);
        const b = new Monster('goblin', 10, true);
        // Ensure currentStats present
        a.currentStats = { hp: a.stats.hp, mp: a.stats.mp };
        b.currentStats = { hp: b.stats.hp, mp: b.stats.mp };
        const participants = [
            { id: 'A', side: 'player', speed: a.stats.speed, ref: a },
            { id: 'B', side: 'enemy', speed: b.stats.speed, ref: b }
        ];
        return { a, b, participants };
    }

    it('attack reduces target HP and records action', () => {
        const { a, b, participants } = makeParticipants();
        gameState.combatEngine.startBattle(participants);
        const initialHP = b.currentStats.hp;
        const res = gameState.combatEngine.attack('A', 'B');
        assertTruthy(res.success, 'Attack should succeed');
        assertTruthy(res.damage > 0, 'Attack should deal positive damage');
        assertTruthy(b.currentStats.hp < initialHP, 'Target HP should be reduced');
    });

    it('magic consumes MP and damages target; fails with insufficient MP', () => {
        const { a, b, participants } = makeParticipants();
        gameState.combatEngine.startBattle(participants);
        // Ensure enough MP
        a.currentStats.mp = 10;
        const initialHP = b.currentStats.hp;
        const res = gameState.combatEngine.magic('A', 'B', 'fireball', 5);
        assertTruthy(res.success, `Magic should succeed (reason: ${res.reason})`);
        assertTruthy(b.currentStats.hp < initialHP, 'Magic should reduce HP');
        // Now drain MP and try again
        a.currentStats.mp = 0;
        const res2 = gameState.combatEngine.magic('A', 'B', 'fireball', 5);
        assertFalsy(res2.success, 'Magic should fail when insufficient MP');
    });

    it('useItem heals the user and consumes inventory', () => {
        const { a, participants } = makeParticipants();
        gameState.combatEngine.startBattle(participants);
        // Damage the user and add a potion
        a.currentStats.hp = Math.max(1, a.currentStats.hp - 40);
        gameState.player.inventory.items['health_potion'] = 1;
        const before = a.currentStats.hp;
        const res = gameState.combatEngine.useItem('A', 'health_potion');
        assertTruthy(res.success, 'Item use should succeed');
        assertTruthy(a.currentStats.hp > before, 'HP should increase');
        assertEqual(gameState.player.inventory.items['health_potion'] || 0, 0, 'Potion should be consumed');
    });

    it('attemptCapture captures when RNG favors success', () => {
        const originalRandom = Math.random;
        Math.random = () => 0.0; // force best roll
        try {
            const { b, participants } = makeParticipants();
            // Reduce target HP to increase chance
            b.currentStats.hp = 1;
            gameState.combatEngine.startBattle(participants);
            const before = gameState.monsters.storage.length;
            const res = gameState.combatEngine.attemptCapture('A', 'B');
            assertTruthy(res.success, 'Capture should succeed with forced RNG');
            assertEqual(gameState.monsters.storage.length, before + 1, 'Storage should increase by 1');
        } finally {
            Math.random = originalRandom;
        }
    });

    it('attemptFlee ends battle when RNG favors success', () => {
        const originalRandom = Math.random;
        Math.random = () => 0.0; // force success
        try {
            const { participants } = makeParticipants();
            gameState.combatEngine.startBattle(participants);
            const res = gameState.combatEngine.attemptFlee('A', 100);
            assertTruthy(res.success, 'Flee should succeed with forced RNG');
            assertFalsy(gameState.combat.active, 'Battle should end after fleeing');
        } finally {
            Math.random = originalRandom;
        }
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Combat action tests loaded.');
}
