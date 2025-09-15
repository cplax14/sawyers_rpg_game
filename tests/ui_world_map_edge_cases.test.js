/**
 * World Map Edge Cases Tests
 */

describe('World Map Overlay Edge Cases', () => {
    let game;
    let ui;
    let gs;

    beforeAll(async () => {
        game = window.SawyersRPG;
        assertTruthy(game, 'Game should be initialized');
        // Wait for systems
        let attempts = 0;
        while ((!game.getGameState || !game.getUI || !game.getGameState() || !game.getUI()) && attempts < 50) {
            await new Promise(r => setTimeout(r, 10));
            attempts++;
        }
        gs = game.getGameState();
        ui = game.getUI();
        assertTruthy(gs, 'GameState should be available');
        assertTruthy(ui, 'UIManager should be available');
    });

    beforeEach(() => {
        gs.resetToDefaults();
        // Ensure overlay exists and starts open for tests
        ui.ensureWorldMapOverlay();
        ui.openWorldMapOverlay();
    });

    it('shows only current area (disabled) when there are no unlocked connections', () => {
        // Set current area to an isolated area with no connections
        // If test data always has connections, simulate by stubbing AreaData APIs
        const originalGetConnected = window.AreaData.getConnectedAreas;
        const originalGetUnlocked = window.AreaData.getUnlockedAreas;
        const originalGetArea = window.AreaData.getArea;

        try {
            const current = gs.world.currentArea;
            window.AreaData.getConnectedAreas = () => [];
            window.AreaData.getUnlockedAreas = () => [];
            window.AreaData.getArea = (id) => ({ name: id, description: '' });

            ui.populateWorldMapAreas();
            const overlay = ui.worldMapOverlay;
            const list = overlay.querySelector('#world-map-list');
            const buttons = Array.from(list.querySelectorAll('button'));
            assertEqual(buttons.length, 1, 'Only current area button should be present');
            const onlyBtn = buttons[0];
            assertEqual(onlyBtn.getAttribute('data-area'), current, 'Single button should be current area');
            assertTruthy(onlyBtn.disabled, 'Current area button should be disabled');
        } finally {
            window.AreaData.getConnectedAreas = originalGetConnected;
            window.AreaData.getUnlockedAreas = originalGetUnlocked;
            window.AreaData.getArea = originalGetArea;
        }
    });

    it('pressing Enter on disabled current area does nothing and does not close overlay', () => {
        // Populate normally and focus the disabled current area button
        ui.populateWorldMapAreas();
        const overlay = ui.worldMapOverlay;
        const list = overlay.querySelector('#world-map-list');
        const buttons = Array.from(list.querySelectorAll('button'));
        const currentBtnIdx = buttons.findIndex(b => b.disabled);
        assertTruthy(currentBtnIdx >= 0, 'Should find disabled current area button');

        ui.worldMapIndex = currentBtnIdx;
        ui.focusWorldMapIndex();

        // Spy on travel and ensure not called
        const originalTravel = gs.travelToArea.bind(gs);
        let called = false;
        gs.travelToArea = () => { called = true; return false; };

        const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        document.dispatchEvent(ev);

        assertFalsy(called, 'travelToArea should not be called for disabled current area');
        assertTruthy(overlay.style.display !== 'none', 'Overlay should remain open');

        gs.travelToArea = originalTravel;
    });
});
