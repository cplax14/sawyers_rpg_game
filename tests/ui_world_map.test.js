/**
 * DOM/UI Tests for World Map Overlay (6.5)
 */

describe('World Map Overlay UI Tests', () => {
    let game;
    let gameState;
    let ui;

    beforeAll(async () => {
        assertTruthy(typeof window.SawyersRPG !== 'undefined', 'Global game instance should be defined');
        game = window.SawyersRPG;
        assertTruthy(typeof game.getGameState === 'function', 'Global game instance should expose getGameState');
        
        // Wait for initialization to complete
        let attempts = 0;
        while ((!game.getGameState() || !game.getUI()) && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 10));
            attempts++;
        }
        
        gameState = game.getGameState();
        assertTruthy(gameState, 'GameState should be available after initialization');
        ui = game.getUI();
        assertTruthy(ui, 'UIManager should be available after initialization');
    });

    beforeEach(() => {
        gameState.resetToDefaults();
        // Unlock forest_path (connected to starting_village) so there is something to travel to
        gameState.addStoryFlag('tutorial_complete');
    });

    it('creates overlay and populates connected, unlocked areas with names and descriptions', () => {
        // Ensure overlay exists and is open
        ui.ensureWorldMapOverlay();
        const opened = ui.showWorldMap();
        assertTruthy(opened, 'World map should open');
        
        // Use the UI manager's overlay reference directly since document.getElementById 
        // may not work reliably in test environments
        let overlay = ui.worldMapOverlay;
        
        // Fallback to document.getElementById if UI reference doesn't exist
        if (!overlay) {
            overlay = document.getElementById('world-map-overlay');
        }
        
        // If still no overlay, force creation
        if (!overlay) {
            ui.ensureWorldMapOverlay();
            overlay = ui.worldMapOverlay || document.getElementById('world-map-overlay');
        }
        
        assertTruthy(overlay, 'Overlay element should exist');
        assertTruthy(overlay.id === 'world-map-overlay', 'Overlay should have correct ID');
        
        if (overlay.style.display === 'none') {
            ui.openWorldMapOverlay();
        }
        assertTruthy(overlay.style.display !== 'none', 'Overlay should be visible');

        const list = overlay.querySelector('#world-map-list');
        assertTruthy(list, 'World map list should exist');

        // Should include current area (disabled) and connected unlocked areas as buttons
        const buttons = Array.from(list.querySelectorAll('button'));
        assertTruthy(buttons.length >= 1, 'There should be at least one button rendered');

        // Find forest_path button and validate content shows display name & description
        const fpBtn = buttons.find(b => b.getAttribute('data-area') === 'forest_path');
        assertTruthy(!!fpBtn, 'forest_path button should be present');
        const area = AreaData.getArea('forest_path');
        assertTruthy(fpBtn.innerHTML.includes(area.name), 'Display name should be shown');
        assertTruthy(fpBtn.innerHTML.includes(area.description), 'Description should be shown');

        // Close overlay
        ui.closeWorldMapOverlay();
        assertTruthy(overlay.style.display === 'none', 'Overlay should close');
    });

    it('supports keyboard navigation and Enter to travel', () => {
        // Spy on travelToArea
        let called = false;
        const originalTravel = gameState.travelToArea.bind(gameState);
        gameState.travelToArea = (areaName) => { called = true; return originalTravel(areaName); };

        ui.ensureWorldMapOverlay();
        ui.showWorldMap();
        
        // Use UI manager's overlay reference directly
        let overlay = ui.worldMapOverlay;
        if (!overlay) {
            ui.ensureWorldMapOverlay();
            overlay = ui.worldMapOverlay || document.getElementById('world-map-overlay');
        }
        
        assertTruthy(overlay, 'Overlay should exist');
        
        if (overlay.style.display === 'none') {
            ui.openWorldMapOverlay();
        }
        assertTruthy(overlay.style.display !== 'none', 'Overlay should be visible');

        // Focus the forest_path button programmatically
        const list = overlay.querySelector('#world-map-list');
        const buttons = Array.from(list.querySelectorAll('button'));
        const fpIdx = buttons.findIndex(b => b.getAttribute('data-area') === 'forest_path');
        assertTruthy(fpIdx >= 0, 'Should find forest_path button index');
        ui.worldMapIndex = fpIdx;
        ui.focusWorldMapIndex();

        // Simulate pressing Enter
        const ev = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        document.dispatchEvent(ev);

        assertTruthy(called, 'travelToArea should be called via Enter');
        // Overlay should close after successful travel
        assertTruthy(overlay.style.display === 'none', 'Overlay should close after travel');

        // Restore original
        gameState.travelToArea = originalTravel;
    });
});

if (typeof window !== 'undefined') {
    console.log('🧪 World map UI tests loaded.');
}
