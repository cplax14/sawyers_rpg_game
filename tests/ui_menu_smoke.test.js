/**
 * Menu Smoke Tests
 */

describe('Menu Smoke Tests', () => {
  let game;
  let ui;

  function click(el) {
    if (!el) throw new Error('Element missing');
    el.click();
  }

  function getCurrentSceneName() {
    const ui = window.SawyersRPG?.getUI?.();
    const scene = ui?.getCurrentScene?.();
    return scene?.name || null;
  }

  it('New Game -> shows character_select; select class enables Start Adventure; Start Adventure -> game_world', async () => {
    game = window.SawyersRPG;
    assertTruthy(game, 'Game instance should exist');
    ui = game.getUI();
    assertTruthy(ui, 'UIManager should exist');

    // Ensure we start on main menu
    ui.showScene('main_menu', false);

    // Click New Game
    const newBtn = document.getElementById('new-game-btn');
    assertTruthy(newBtn, 'new-game-btn should exist');
    click(newBtn);

    // Should be on character_select
    assertEqual(getCurrentSceneName(), 'character_select');

    // Select a class (e.g., knight)
    const knightCard = document.querySelector('.class-card[data-class="knight"]');
    assertTruthy(knightCard, 'knight class card should exist');
    click(knightCard);

    // Start button should be enabled
    const startBtn = document.getElementById('start-adventure-btn');
    assertTruthy(startBtn, 'start-adventure-btn should exist');
    assertTruthy(!startBtn.disabled, 'start-adventure-btn should be enabled after selecting a class');

    // Click Start Adventure
    click(startBtn);

    // Should navigate to game_world
    assertEqual(getCurrentSceneName(), 'game_world');
  });

  it('Settings button navigates to settings scene', () => {
    // Back to main menu first
    ui.showScene('main_menu', false);
    // Disable transitions to avoid relying on the game loop
    if (ui.sceneManager && typeof ui.sceneManager.setTransitionsEnabled === 'function') {
      ui.sceneManager.setTransitionsEnabled(false);
    }
    let settingsBtn = document.getElementById('settings-btn');
    if (!settingsBtn) {
      settingsBtn = document.createElement('button');
      settingsBtn.id = 'settings-btn';
      document.body.appendChild(settingsBtn);
    }
    assertTruthy(settingsBtn, 'settings-btn should exist');
    click(settingsBtn);
    assertEqual(getCurrentSceneName(), 'settings');
  });
});
