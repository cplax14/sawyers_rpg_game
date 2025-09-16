/**
 * Inline World Map Interaction Tests
 */

describe('Inline World Map Interactions', () => {
  function click(el) { if (!el) throw new Error('Element missing'); el.click(); }
  function getText(el) { return el ? (el.textContent || '').trim() : ''; }

  it('Selecting different areas updates the details panel and action buttons', () => {
    const game = window.SawyersRPG;
    assertTruthy(game, 'Game instance exists');
    const ui = game.getUI();
    assertTruthy(ui, 'UIManager exists');

    // Go to game_world scene without transitions to simplify
    if (ui.sceneManager?.setTransitionsEnabled) ui.sceneManager.setTransitionsEnabled(false);
    ui.showScene('game_world', false);

    // Ensure inline map rendered
    const gw = ui.getModule('GameWorldUI');
    assertTruthy(gw, 'GameWorldUI module exists');
    gw.ensureInlineWorldMap();
    gw.renderInlineWorldMap();

    let container = document.getElementById('world-map');
    if (!container) {
      // Create minimal container if not present in test DOM
      const gameWorld = document.getElementById('game-world') || document.body;
      const wrap = document.createElement('div');
      wrap.className = 'world-map-container';
      container = document.createElement('div');
      container.id = 'world-map';
      container.className = 'world-map';
      wrap.appendChild(container);
      gameWorld.appendChild(wrap);
      // Render again now that container exists
      gw.renderInlineWorldMap();
    }
    assertTruthy(container, '#world-map exists');

    // Determine current area and a connected, unlocked neighbor
    const gs = game.getGameState();
    const current = gs.world.currentArea;
    const conns = window.AreaData.getConnectedAreas(current) || [];

    // pick first connected area that is unlocked
    const unlocked = window.AreaData.getUnlockedAreas(
      gs.world.storyFlags,
      gs.player.level,
      Object.keys(gs.player.inventory.items),
      gs.player.class
    );

    const neighbor = conns.find(a => unlocked.includes(a));
    assertTruthy(neighbor, 'Should have at least one unlocked connected area');

    const neighborTile = container.querySelector(`.map-area[data-area="${neighbor}"]`);
    assertTruthy(neighborTile, 'Connected area tile exists');

    // Select neighbor
    click(neighborTile);

    // Details panel should update to neighbor
    const nameEl = document.getElementById('area-name');
    assertTruthy(nameEl, '#area-name exists');
    const neighborName = window.AreaData.getArea(neighbor)?.name || neighbor;
    assertEqual(getText(nameEl), neighborName);

    // Travel button should be enabled when selecting connected, unlocked area
    const travelBtn = document.getElementById('travel-to-area');
    assertTruthy(travelBtn, '#travel-to-area exists');
    assertTruthy(!travelBtn.disabled, 'Travel button should enable for connected unlocked area');

    // Now select current area
    const currentTile = container.querySelector(`.map-area[data-area="${current}"]`);
    assertTruthy(currentTile, 'Current area tile exists');
    click(currentTile);

    const currentName = window.AreaData.getArea(current)?.name || current;
    assertEqual(getText(nameEl), currentName);

    // Travel button should be disabled for current location
    assertTruthy(travelBtn.disabled, 'Travel button should be disabled for current location');
  });
});
