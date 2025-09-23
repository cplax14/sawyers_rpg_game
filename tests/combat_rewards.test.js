/**
 * Unit Tests for Combat Rewards (5.5)
 */

describe('Combat Rewards Tests', () => {
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
        // Reset state and inventory
        gameState.resetCombat();
        if (!gameState.player) {
            gameState.player = { level: 1, experience: 0, inventory: { items: {} } };
        }
        gameState.player.level = 1;
        gameState.player.experience = 0;

        // Calculate experience to next level safely
        if (typeof gameState.calculateExperienceRequired === 'function') {
            gameState.player.experienceToNext = gameState.calculateExperienceRequired(2);
        } else {
            gameState.player.experienceToNext = 100; // Default fallback
        }

        // Ensure inventory exists
        if (!gameState.player.inventory) {
            gameState.player.inventory = { items: {} };
        }
        gameState.player.inventory.items = {};

        if (!gameState.combatEngine) gameState.initializeCombatEngine();
    });

    function makeParticipants() {
        // Two enemies to ensure aggregate rewards
        const player = new Monster('slime', 10, false);
        player.currentStats = { hp: player.stats.hp, mp: player.stats.mp };
        const e1 = new Monster('goblin', 5, true);
        const e2 = new Monster('wolf', 7, true);
        e1.currentStats = { hp: e1.stats.hp, mp: e1.stats.mp };
        e2.currentStats = { hp: e2.stats.hp, mp: e2.stats.mp };
        const participants = [
            { id: 'P', side: 'player', speed: player.stats.speed, ref: player },
            { id: 'E1', side: 'enemy', speed: e1.stats.speed, ref: e1 },
            { id: 'E2', side: 'enemy', speed: e2.stats.speed, ref: e2 }
        ];
        return { player, e1, e2, participants };
    }

    it('grants XP and gold on victory and may drop items', () => {
        const { participants } = makeParticipants();
        gameState.combatEngine.startBattle(participants);
        const defeated = participants.filter(p => p.side === 'enemy');

        // Force drops by RNG
        const originalRandom = Math.random;
        Math.random = () => 0.0;
        try {
            const beforeXP = gameState.player.experience;
            const beforeGold = gameState.player.inventory.gold;
            const beforeItems = { ...gameState.player.inventory.items };

            gameState.combatEngine.endBattle({ victory: true, defeated });

            // XP: enhanced formula should give at least base level*8 => (5*8 + 7*8) = 96
            assertTruthy(gameState.player.experience >= beforeXP + 96 || gameState.player.level > 1, 'Player should gain XP or level up');
            // Gold: enhanced formula level*2.5 => (5*2.5 + 7*2.5) = 30 (floored)
            const expectedGold = Math.floor(5 * 2.5) + Math.floor(7 * 2.5); // 12 + 17 = 29
            assertTruthy(gameState.player.inventory.gold >= beforeGold + expectedGold, 'Player should gain expected gold');
            // Drops should include at least one health_potion when RNG forced to 0
            const potions = gameState.player.inventory.items['health_potion'] || 0;
            assertTruthy(potions >= 1, 'Should receive at least one health_potion drop');
        } finally {
            Math.random = originalRandom;
        }
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 Combat rewards tests loaded.');
}
