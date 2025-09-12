/**
 * Unit Tests for Skill Learning (4.7)
 */

describe('Monster Skill Learning Tests', () => {
    let game;
    let gameState;

    beforeAll(() => {
        assertTruthy(typeof window.SawyersRPG !== 'undefined', 'Global game instance should be defined');
        game = window.SawyersRPG;
        assertTruthy(typeof game.getGameState === 'function', 'Global game instance should expose getGameState');
        gameState = game.getGameState();
        assertTruthy(gameState, 'GameState should be available');
    });

    beforeEach(() => {
        // Reset to a clean baseline
        gameState.resetToDefaults();
        // Ensure some scrolls
        gameState.player.inventory.items = { 'scroll_fireball': 1, 'scroll_thunder': 2 };
    });

    it('canTeachMove returns true for valid new move and false for duplicates', () => {
        const id = gameState.captureMonster('slime', 5);
        // slime likely has 'heal' and 'bounce'; teach fireball
        const can = gameState.canTeachMove(id, 'fireball');
        assertTruthy(can.canLearn, `Expected canLearn to be true (reason: ${can.reason})`);

        // First, teach fireball to create duplicate scenario later
        const t1 = gameState.teachMoveWithItem(id, 'fireball');
        assertTruthy(t1.success, 'Teaching move should succeed');

        const canDup = gameState.canTeachMove(id, 'fireball');
        assertFalsy(canDup.canLearn, 'Should not learn duplicate move');
    });

    it('teachMoveWithItem consumes scroll and adds move when slots available', () => {
        const id = gameState.captureMonster('goblin', 5);
        const before = gameState.player.inventory.items['scroll_fireball'] || 0;
        const res = gameState.teachMoveWithItem(id, 'fireball');
        assertTruthy(res.success, `Teaching should succeed (reason: ${res.reason})`);
        const after = gameState.player.inventory.items['scroll_fireball'] || 0;
        assertEqual(after, Math.max(0, before - 1), 'Scroll should be consumed');
        // Verify stored monster abilities include new move
        const stored = gameState.getMonsterByIdAnywhere(id).monster;
        assertTruthy(stored.abilities.includes('fireball'), 'Stored monster abilities should include taught move');
    });

    it('teachMoveWithItem fails without required scroll', () => {
        const id = gameState.captureMonster('wolf', 5);
        // Remove scrolls
        delete gameState.player.inventory.items['scroll_thunder'];
        const res = gameState.teachMoveWithItem(id, 'thunder');
        assertFalsy(res.success, 'Teaching should fail without scroll');
    });

    it('teachMoveWithItem replaces a move when at capacity (4 moves)', () => {
        const id = gameState.captureMonster('wolf', 20);
        // Force abilities to 4 moves to simulate capacity
        const stored = gameState.getMonsterByIdAnywhere(id).monster;
        stored.abilities = ['bite', 'howl', 'pack_hunt', 'tackle'];
        // Ensure scroll
        gameState.player.inventory.items['scroll_thunder'] = 1;
        const res = gameState.teachMoveWithItem(id, 'thunder', 2); // replace index 2
        assertTruthy(res.success, `Teaching should succeed with replacement (reason: ${res.reason})`);
        assertTruthy(stored.abilities.includes('thunder'), 'New move should be present after replacement');
        assertEqual(stored.abilities.length, 4, 'Move count should remain at 4');
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Skill learning tests loaded.');
}
