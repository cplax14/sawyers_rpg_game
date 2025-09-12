/**
 * Unit Tests for Turn-based Combat Engine (5.1)
 */

describe('Combat Engine Tests', () => {
    let game;
    let gameState;

    beforeAll(() => {
        assertTruthy(typeof window.SawyersRPG !== 'undefined', 'Global game instance should be defined');
        game = window.SawyersRPG;
        assertTruthy(typeof game.getGameState === 'function', 'Global game instance should expose getGameState');
        gameState = game.getGameState();
        assertTruthy(gameState, 'GameState should be available');
        assertTruthy(!!gameState.combatEngine, 'CombatEngine should be initialized');
    });

    beforeEach(() => {
        // Reset combat state
        gameState.resetCombat();
        if (!gameState.combatEngine) gameState.initializeCombatEngine();
    });

    it('should start battle and order participants by speed (desc)', () => {
        const participants = [
            { id: 'p1', side: 'player', speed: 20 },
            { id: 'e1', side: 'enemy', speed: 35 },
            { id: 'p2', side: 'player', speed: 25 }
        ];
        const ordered = gameState.combatEngine.startBattle(participants);
        assertTruthy(gameState.combat.active, 'Combat should be active after start');
        Assert.deepEqual(ordered.map(p => p.id), ['e1', 'p2', 'p1'], 'Participants should be sorted by speed');
        const current = gameState.combatEngine.getCurrentActor();
        assertEqual(current.id, 'e1', 'First actor should be highest speed');
    });

    it('should advance turns and increment round after cycling', () => {
        const participants = [
            { id: 'a', side: 'player', speed: 10 },
            { id: 'b', side: 'enemy', speed: 9 }
        ];
        gameState.combatEngine.startBattle(participants);
        const c = gameState.combat;
        assertEqual(c.turn, 1, 'Initial turn should be 1');
        assertEqual(c.currentTurn, 0, 'Initial turn index is 0');

        gameState.combatEngine.performAction({ type: 'wait' });
        assertEqual(c.currentTurn, 1, 'Turn index should advance');
        assertEqual(c.turn, 1, 'Round should remain until wrap');

        gameState.combatEngine.performAction({ type: 'wait' });
        assertEqual(c.currentTurn, 0, 'Turn index wraps');
        assertEqual(c.turn, 2, 'Round increments after wrap');
    });

    it('should end battle and record result', () => {
        const participants = [ { id: 'x', side: 'player', speed: 5 } ];
        gameState.combatEngine.startBattle(participants);
        gameState.combatEngine.endBattle({ victory: true });
        assertFalsy(gameState.combat.active, 'Combat should be inactive after end');
        assertTruthy(!!gameState.combat.battleResult, 'Battle result should be recorded');
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Combat tests loaded.');
}
