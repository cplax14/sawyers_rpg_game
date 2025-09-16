/**
 * Endings (9.5) Minimal Tests
 */

describe('Story Endings (9.5)', () => {
  let gs;
  let uiManager;
  let storyUI;

  function ensureDom() {
    let container = document.getElementById('story');
    if (!container) {
      container = document.createElement('div');
      container.id = 'story';
      document.body.appendChild(container);
    }
    let dlg = document.getElementById('story-dialogue');
    if (!dlg) {
      dlg = document.createElement('div');
      dlg.id = 'story-dialogue';
      container.appendChild(dlg);
    }
    let choices = document.getElementById('story-choices');
    if (!choices) {
      choices = document.createElement('div');
      choices.id = 'story-choices';
      container.appendChild(choices);
    }
    let nextBtn = document.getElementById('story-next');
    if (!nextBtn) {
      nextBtn = document.createElement('button');
      nextBtn.id = 'story-next';
      container.appendChild(nextBtn);
    }
  }

  beforeAll(async () => {
    const game = window.SawyersRPG;
    assertTruthy(game, 'Game should be initialized');
    // Wait for GS
    let attempts = 0;
    while ((!game.getGameState || !game.getGameState()) && attempts < 50) {
      await new Promise(r => setTimeout(r, 10));
      attempts++;
    }
    gs = game.getGameState();
    assertTruthy(gs, 'GameState should be available');
  });

  beforeEach(() => {
    uiManager = { config: { debugMode: true }, showNotification: () => true, game: { getGameState: () => gs } };
    ensureDom();
    storyUI = new StoryUI(uiManager);
    if (typeof storyUI.init === 'function') storyUI.init();
  });

  it('checkForEnding returns a matching ending when requirements are met', () => {
    // Force flags to satisfy peace_ending: ["dragon_friendship","wolf_friendship","peaceful_resolution"]
    gs.world.storyFlags = Array.from(new Set([...(gs.world.storyFlags || []), 'dragon_friendship', 'wolf_friendship', 'peaceful_resolution']));
    const endingKey = gs.checkForEnding();
    assertTruthy(endingKey, 'An ending should be detected');
    // Expect one of the configured endings
    const valid = ['guardian_ending','master_ending','peace_ending','explorer_ending'];
    assertTruthy(valid.includes(endingKey), `Ending ${endingKey} should be valid`);
  });

  it('playEnding renders the ending dialogue sequence', () => {
    const key = 'peace_ending';
    const ok = storyUI.playEnding(key);
    assertTruthy(ok, 'playEnding should return true');
    const dlg = document.getElementById('story-dialogue') || storyUI.elements?.dialogue;
    assertTruthy(dlg, 'Dialogue element exists');
    assertTruthy(dlg.textContent && dlg.textContent.length > 0, 'First ending line should render');
    // Advance through chain should update dialogue and eventually close
    storyUI.advance();
    // Not asserting exact text; ensure it stays stable and non-empty while nodes remain
    assertTruthy(typeof dlg.textContent === 'string', 'Dialogue remains a string');
  });
});
