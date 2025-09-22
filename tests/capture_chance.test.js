/**
 * Unit Tests for Capture Chance Calculations (5.6)
 */

describe('Capture Chance Tests', () => {
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

        // Ensure player and inventory exist
        if (!gameState.player) {
            gameState.player = { inventory: { items: {} } };
        }
        if (!gameState.player.inventory) {
            gameState.player.inventory = { items: {} };
        }
        if (!gameState.player.inventory.items) {
            gameState.player.inventory.items = {};
        }

        if (!gameState.combatEngine) gameState.initializeCombatEngine();
    });

    function makeTarget(species = 'goblin', level = 10) {
        const target = new Monster(species, level, true);
        target.currentStats = { hp: target.stats.hp, mp: target.stats.mp };
        return target;
    }

    it('lower HP increases capture chance', () => {
        const t = makeTarget('goblin', 10);
        const highHpChance = gameState.combatEngine.computeCaptureChance(t);
        // Reduce HP to very low
        t.currentStats.hp = Math.max(1, Math.floor(t.stats.hp * 0.05));
        const lowHpChance = gameState.combatEngine.computeCaptureChance(t);
        assertTruthy(lowHpChance > highHpChance, `Expected low HP chance (${lowHpChance}) > high HP chance (${highHpChance})`);
    });

    it('species with lower captureRate are harder to capture', () => {
        const easy = makeTarget('slime', 10); // captureRate 85
        const hard = makeTarget('dragon_whelp', 10); // captureRate 15
        // Equal HP state
        const easyChance = gameState.combatEngine.computeCaptureChance(easy);
        const hardChance = gameState.combatEngine.computeCaptureChance(hard);
        assertTruthy(easyChance > hardChance, `Expected slime chance (${easyChance}) > dragon chance (${hardChance})`);
    });

    it('capture item increases chance and is consumed', () => {
        const t = makeTarget('goblin', 10);
        // Put into turn order to allow attemptCapture path
        const participants = [
            { id: 'P', side: 'player', speed: 10, ref: new Monster('slime', 10, false) },
            { id: 'E', side: 'enemy', speed: 9, ref: t }
        ];
        gameState.combatEngine.startBattle(participants);
        // Ensure inventory contains the item
        gameState.player.inventory.items['capture_orb'] = 1;
        const baseChance = gameState.combatEngine.computeCaptureChance(t);
        const res = gameState.combatEngine.attemptCapture('P', 'E', { itemId: 'capture_orb' });
        assertTruthy(res.chance >= baseChance + 10 || res.success, 'Chance should increase with item or capture succeeds');
        assertEqual(gameState.player.inventory.items['capture_orb'] || 0, 0, 'Capture item should be consumed');
    });

    it('chance is clamped between 5 and 95', () => {
        const t = makeTarget('slime', 10);
        t.currentStats.hp = 1; // Max bonus
        const high = gameState.combatEngine.computeCaptureChance(t, { flatBonus: 1000 });
        assertEqual(high, 95, 'Chance should not exceed 95');
        const low = gameState.combatEngine.computeCaptureChance(t, { multiplier: 0, flatBonus: -1000 });
        assertEqual(low, 5, 'Chance should be at least 5');
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Capture chance tests loaded.');
}
