/**
 * Unit Tests for Enemy AI (5.4)
 */

describe('Enemy AI Tests', () => {
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
        const player = new Monster('slime', 10, false);
        const enemy = new Monster('goblin', 10, true);
        player.currentStats = { hp: player.stats.hp, mp: player.stats.mp };
        enemy.currentStats = { hp: enemy.stats.hp, mp: enemy.stats.mp };
        const participants = [
            { id: 'P', side: 'player', speed: player.stats.speed, ref: player },
            { id: 'E', side: 'enemy', speed: enemy.stats.speed, ref: enemy }
        ];
        return { player, enemy, participants };
    }

    it('aiTakeTurn uses Monster.chooseAIAction (special ability path with forced RNG)', () => {
        const { player, enemy, participants } = makeParticipants();
        const originalRandom = Math.random;
        try {
            // Force special branch and minimal variance/crit effects
            let seq = [0.0, 0.99, 0.99];
            Math.random = () => seq.shift() ?? 0.99;
            gameState.combatEngine.startBattle(participants);
            const beforeHP = player.currentStats.hp;
            const res = gameState.combatEngine.aiTakeTurn('E');
            assertTruthy(res.success, `AI action should succeed (reason: ${res.reason})`);
            assertTruthy(player.currentStats.hp < beforeHP, 'Player should take damage from AI action');
        } finally {
            Math.random = originalRandom;
        }
    });

    it('aiTakeTurn falls back to basic attack when chooseAIAction is missing', () => {
        const player = new Monster('slime', 10, false);
        const enemyRef = { stats: { hp: 50, mp: 10, attack: 20, defense: 10, speed: 5 }, currentStats: { hp: 50, mp: 10 } };
        const participants = [
            { id: 'P', side: 'player', speed: player.stats.speed, ref: player },
            { id: 'E', side: 'enemy', speed: 5, ref: enemyRef }
        ];
        gameState.combatEngine.startBattle(participants);
        const beforeHP = player.currentStats.hp;
        const res = gameState.combatEngine.aiTakeTurn('E');
        assertTruthy(res.success, 'AI fallback action should succeed');
        assertTruthy(player.currentStats.hp < beforeHP, 'Player should take damage from fallback attack');
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Combat AI tests loaded.');
}
