/**
 * Unit Tests for Monster Evolution (4.5)
 */

describe('Monster Evolution Tests', () => {
    let game;
    let gameState;
    let originalConfirm;

    beforeAll(() => {
        // Ensure game instance exists
        assertTruthy(typeof window.SawyersRPG !== 'undefined', 'Global game instance should be defined');
        game = window.SawyersRPG;
        assertTruthy(typeof game.getGameState === 'function', 'Global game instance should expose getGameState');
        gameState = game.getGameState();
        assertTruthy(gameState, 'GameState should be available');
        // Ensure evolved species exist for tests
        if (!MonsterData.getSpecies('king_slime')) {
            MonsterData.species.king_slime = {
                name: 'King Slime',
                type: ['water', 'basic'],
                rarity: 'uncommon',
                baseStats: { hp: 60, mp: 30, attack: 40, defense: 35, magicAttack: 45, magicDefense: 50, speed: 50, accuracy: 75 },
                statGrowth: { hp: 4, mp: 2, attack: 3, defense: 3, magicAttack: 4, magicDefense: 4, speed: 3, accuracy: 2 },
                abilities: ['bounce', 'heal', 'slam'],
                captureRate: 60,
                evolutionLevel: 30,
                evolvesTo: [],
                evolutionItems: [],
                breedsWith: ['slime'],
                areas: ['plains']
            };
        }

        if (!MonsterData.getSpecies('fire_elemental')) {
            MonsterData.species.fire_elemental = {
                name: 'Fire Elemental',
                type: ['fire', 'elemental'],
                rarity: 'rare',
                baseStats: { hp: 70, mp: 80, attack: 60, defense: 50, magicAttack: 95, magicDefense: 75, speed: 95, accuracy: 85 },
                statGrowth: { hp: 5, mp: 6, attack: 4, defense: 3, magicAttack: 7, magicDefense: 5, speed: 6, accuracy: 4 },
                abilities: ['fireball', 'flame_burst', 'inferno'],
                captureRate: 25,
                evolutionLevel: 40,
                evolvesTo: [],
                evolutionItems: [],
                breedsWith: ['fire_sprite'],
                areas: ['volcano']
            };
        }

        // Silence native confirm by default and default to true
        originalConfirm = window.confirm;
        window.confirm = () => true;
    });

    afterAll(() => {
        window.confirm = originalConfirm;
    });

    beforeEach(() => {
        // Reset inventory to baseline
        gameState.player.inventory.items = { 'health_potion': 3, 'mana_potion': 2 };
        // Clear notifications
        gameState.ui.notifications = [];
    });

    it('evolves by level only when requirements met (slime -> king_slime)', () => {
        // Create slime at required level
        const m = new Monster('slime', 15, false);
        const result = m.checkForEvolution();
        assertTruthy(result, `checkForEvolution should return true (got ${result})`);
        assertEqual(m.species, 'king_slime', `Species should evolve to king_slime (got ${m.species})`);
    });

    it('does not evolve when item is missing (fire_sprite needs fire_gem)', () => {
        // Ensure no required item in inventory
        delete gameState.player.inventory.items['fire_gem'];

        // Auto-confirm to ensure only item-gating blocks
        window.confirm = () => true;

        const m = new Monster('fire_sprite', 30, false);
        const invBefore = { ...gameState.player.inventory.items };
        const result = m.checkForEvolution();

        assertFalsy(result, `Evolution should not proceed without required item (got ${result})`);
        assertEqual(m.species, 'fire_sprite', `Species should remain unchanged (got ${m.species})`);
        Assert.deepEqual(gameState.player.inventory.items, invBefore, 'Inventory should be unchanged');
    });

    it('evolves when item present and user confirms (consumes item)', () => {
        // Add required item
        gameState.addItem('fire_gem', 1);

        // Confirm evolution
        window.confirm = () => true;

        const m = new Monster('fire_sprite', 30, false);
        const result = m.checkForEvolution();

        assertTruthy(result, 'checkForEvolution should return true when item present and confirmed');
        assertEqual(m.species, 'fire_elemental', 'Species should evolve to fire_elemental');
        assertEqual(gameState.player.inventory.items['fire_gem'] || 0, 0, 'fire_gem should be consumed');

        // Check that at least one notification was added
        assertTruthy(gameState.ui.notifications.length > 0, 'Should push notifications during evolution');
    });
});

// Global test setup hint
if (typeof window !== 'undefined') {
    console.log('🧪 Monster evolution tests loaded.');
}
