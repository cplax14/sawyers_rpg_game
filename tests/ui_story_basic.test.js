/**
 * StoryUI Basic Tests
 */

describe('StoryUI Basic Flow', () => {
  let storyUI;
  let uiManager;
  let gs;

  function ensureDom() {
    // Ensure container
    let container = document.getElementById('story');
    if (!container) {
      container = document.createElement('div');
      container.id = 'story';
      document.body.appendChild(container);
    }
    // Ensure children elements
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
    // Minimal UI manager stub with game reference so StoryUI.getGameState() works
    uiManager = { config: { debugMode: true }, showNotification: () => true, game: { getGameState: () => gs } };
    ensureDom();
    storyUI = new StoryUI(uiManager);
    if (typeof storyUI.init === 'function') storyUI.init();
  });

  it('advance() moves from current node to next and renders text', () => {
    const node = { text: 'First line', next: { text: 'Second line' } };
    storyUI.showDialogue(node);
    // Get via DOM or module cache
    const dlg = document.getElementById('story-dialogue') || storyUI.elements?.dialogue;
    assertTruthy(dlg, 'Dialogue element should exist');
    assertEqual(dlg.textContent, 'First line', 'Initial dialogue should render');
    storyUI.advance();
    assertEqual(dlg.textContent, 'Second line', 'Advance should render next node');
  });

  it('selectChoice() applies GameState.processStoryChoice and closes or advances', () => {
    // Stub processStoryChoice to add a flag we can assert on
    const orig = gs.processStoryChoice;
    gs.processStoryChoice = (eventName, outcome) => {
      gs.world.storyFlags = gs.world.storyFlags || [];
      gs.world.storyFlags.push('story_test_applied');
      return { ok: true };
    };

    try {
      const node = {
        text: 'Choose path',
        choices: [
          { label: 'A', eventName: 'intro_choice', outcome: 'a' }
        ]
      };
      storyUI.showDialogue(node);
      // Simulate clicking first choice button
      storyUI.selectChoice(0);
      assertTruthy(gs.world.storyFlags.includes('story_test_applied'), 'processStoryChoice should be called');
    } finally {
      gs.processStoryChoice = orig;
    }
  });
});
