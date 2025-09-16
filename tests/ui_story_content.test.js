/**
 * Story Content Expansion (9.6) Tests
 */

describe('Story Content (9.6) events', () => {
  let gs;

  beforeAll(async () => {
    const game = window.SawyersRPG;
    assertTruthy(game, 'Game should be initialized');
    let attempts = 0;
    while ((!game.getGameState || !game.getGameState()) && attempts < 50) {
      await new Promise(r => setTimeout(r, 10));
      attempts++;
    }
    gs = game.getGameState();
    assertTruthy(gs, 'GameState should be available');
  });

  it('mystic_grove_discovery: attune_nature applies flags and unlocks area', () => {
    const outcome = window.StoryData.processChoice('mystic_grove_discovery', 'attune_nature');
    assertTruthy(outcome, 'Outcome exists');
    gs.processStoryChoice('mystic_grove_discovery', 'attune_nature');
    assertTruthy(gs.world.storyFlags.includes('nature_attuned'), 'nature_attuned flag set');
    assertTruthy(gs.world.storyFlags.includes('beast_speaker'), 'beast_speaker flag set');
    assertTruthy(gs.world.unlockedAreas.includes('mystic_grove'), 'mystic_grove unlocked');
  });

  it('ruins_puzzle: solve_riddle grants knowledge flag and unlocks inner ruins', () => {
    const outcome = window.StoryData.processChoice('ruins_puzzle', 'solve_riddle');
    assertTruthy(outcome, 'Outcome exists');
    gs.processStoryChoice('ruins_puzzle', 'solve_riddle');
    assertTruthy(gs.world.storyFlags.includes('ancient_knowledge'), 'ancient_knowledge flag set');
    assertTruthy(gs.world.unlockedAreas.includes('ancient_ruins_inner'), 'inner ruins unlocked');
  });
});
