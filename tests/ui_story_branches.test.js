/**
 * Story Branch Expansion (9.6.b) Tests
 */

describe('Story Branches (9.6.b)', () => {
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

  beforeEach(() => {
    // reset flags minimally for each check to avoid interference
    gs.world.storyFlags = Array.from(new Set(gs.world.storyFlags || []));
    gs.world.unlockedAreas = Array.from(new Set(gs.world.unlockedAreas || ['starting_village']));
  });

  it('grove_ritual: perform_ritual grants peace/nature flags and unlocks sacred_clearing', () => {
    const res = gs.processStoryChoice('grove_ritual', 'perform_ritual');
    assertTruthy(res, 'Outcome should be processed');
    assertTruthy(gs.world.storyFlags.includes('peace_symbol'), 'peace_symbol flag set');
    assertTruthy(gs.world.storyFlags.includes('nature_affinity'), 'nature_affinity flag set');
    assertTruthy(gs.world.unlockedAreas.includes('sacred_clearing'), 'sacred_clearing unlocked');
  });

  it('wolf_den_challenge: face_alpha grants warrior flag and unlocks mountain_pass', () => {
    const res = gs.processStoryChoice('wolf_den_challenge', 'face_alpha');
    assertTruthy(res, 'Outcome should be processed');
    assertTruthy(gs.world.storyFlags.includes('wolf_challenge_won'), 'wolf_challenge_won flag set');
    assertTruthy(gs.world.storyFlags.includes('warrior_path'), 'warrior_path flag set');
    assertTruthy(gs.world.unlockedAreas.includes('mountain_pass'), 'mountain_pass unlocked');
  });

  it('inner_ruins_lore: study_tablet grants knowledge and unlocks library_of_echoes', () => {
    const res = gs.processStoryChoice('inner_ruins_lore', 'study_tablet');
    assertTruthy(res, 'Outcome should be processed');
    assertTruthy(gs.world.storyFlags.includes('ancient_knowledge_plus'), 'ancient_knowledge_plus flag set');
    assertTruthy(gs.world.storyFlags.includes('scholar_path'), 'scholar_path flag set');
    assertTruthy(gs.world.unlockedAreas.includes('library_of_echoes'), 'library_of_echoes unlocked');
  });
});
