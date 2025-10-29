/**
 * Story Moments Utility
 * Manages important story flags that should pause auto-save
 */

import { ReactGameState } from '../types/game';

export interface StoryMoment {
  flag: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  pauseAutoSave: boolean;
}

/**
 * Registry of important story moments that should pause auto-save
 */
export const STORY_MOMENTS: Record<string, StoryMoment> = {
  // Tutorial and onboarding
  tutorial_in_progress: {
    flag: 'tutorial_in_progress',
    description: 'Tutorial is in progress',
    priority: 'medium',
    pauseAutoSave: true,
  },

  // Dialogue and story
  dialogue_active: {
    flag: 'dialogue_active',
    description: 'Character dialogue is active',
    priority: 'high',
    pauseAutoSave: true,
  },
  cutscene_playing: {
    flag: 'cutscene_playing',
    description: 'Cutscene is playing',
    priority: 'high',
    pauseAutoSave: true,
  },
  story_choice_pending: {
    flag: 'story_choice_pending',
    description: 'Player must make a story choice',
    priority: 'critical',
    pauseAutoSave: true,
  },

  // Combat and encounters
  boss_encounter_intro: {
    flag: 'boss_encounter_intro',
    description: 'Boss encounter introduction',
    priority: 'high',
    pauseAutoSave: true,
  },
  monster_capture_attempt: {
    flag: 'monster_capture_attempt',
    description: 'Monster capture in progress',
    priority: 'medium',
    pauseAutoSave: false, // Allow saving during capture attempts
  },

  // Special events
  ending_sequence: {
    flag: 'ending_sequence',
    description: 'Game ending sequence',
    priority: 'critical',
    pauseAutoSave: true,
  },
  special_event_active: {
    flag: 'special_event_active',
    description: 'Special event is active',
    priority: 'high',
    pauseAutoSave: true,
  },

  // Shop and trading
  shop_transaction_active: {
    flag: 'shop_transaction_active',
    description: 'Shop transaction in progress',
    priority: 'low',
    pauseAutoSave: false,
  },

  // Area transitions
  area_transition_in_progress: {
    flag: 'area_transition_in_progress',
    description: 'Area transition in progress',
    priority: 'medium',
    pauseAutoSave: true,
  },
};

/**
 * Check if any critical story moments are active that should pause auto-save
 */
export const hasActiveStoryMoments = (storyFlags: Record<string, boolean>): StoryMoment[] => {
  const activeMoments: StoryMoment[] = [];

  Object.values(STORY_MOMENTS).forEach(moment => {
    if (storyFlags[moment.flag] === true && moment.pauseAutoSave) {
      activeMoments.push(moment);
    }
  });

  return activeMoments.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};

/**
 * Get the highest priority story moment that should pause auto-save
 */
export const getHighestPriorityStoryMoment = (
  storyFlags: Record<string, boolean>
): StoryMoment | null => {
  const activeMoments = hasActiveStoryMoments(storyFlags);
  return activeMoments.length > 0 ? activeMoments[0] : null;
};

/**
 * Helper functions for setting story flags that pause auto-save
 */
export class StoryMomentManager {
  private updateStoryFlags: (flags: Record<string, boolean>) => void;

  constructor(updateStoryFlags: (flags: Record<string, boolean>) => void) {
    this.updateStoryFlags = updateStoryFlags;
  }

  /**
   * Start a story moment (sets the flag to true)
   */
  startStoryMoment(flag: string): void {
    if (STORY_MOMENTS[flag]) {
      console.log(`Starting story moment: ${STORY_MOMENTS[flag].description}`);
      this.updateStoryFlags({ [flag]: true });
    } else {
      console.warn(`Unknown story moment flag: ${flag}`);
    }
  }

  /**
   * End a story moment (sets the flag to false)
   */
  endStoryMoment(flag: string): void {
    if (STORY_MOMENTS[flag]) {
      console.log(`Ending story moment: ${STORY_MOMENTS[flag].description}`);
      this.updateStoryFlags({ [flag]: false });
    } else {
      console.warn(`Unknown story moment flag: ${flag}`);
    }
  }

  /**
   * Start multiple story moments
   */
  startStoryMoments(flags: string[]): void {
    const updates: Record<string, boolean> = {};
    flags.forEach(flag => {
      if (STORY_MOMENTS[flag]) {
        updates[flag] = true;
      } else {
        console.warn(`Unknown story moment flag: ${flag}`);
      }
    });

    if (Object.keys(updates).length > 0) {
      this.updateStoryFlags(updates);
    }
  }

  /**
   * End multiple story moments
   */
  endStoryMoments(flags: string[]): void {
    const updates: Record<string, boolean> = {};
    flags.forEach(flag => {
      if (STORY_MOMENTS[flag]) {
        updates[flag] = false;
      } else {
        console.warn(`Unknown story moment flag: ${flag}`);
      }
    });

    if (Object.keys(updates).length > 0) {
      this.updateStoryFlags(updates);
    }
  }

  /**
   * Check if a specific story moment is active
   */
  isStoryMomentActive(flag: string, storyFlags: Record<string, boolean>): boolean {
    return storyFlags[flag] === true;
  }

  /**
   * Get all currently active story moments
   */
  getActiveStoryMoments(storyFlags: Record<string, boolean>): StoryMoment[] {
    return hasActiveStoryMoments(storyFlags);
  }
}

/**
 * Create a story moment manager instance
 */
export const createStoryMomentManager = (
  updateStoryFlags: (flags: Record<string, boolean>) => void
): StoryMomentManager => {
  return new StoryMomentManager(updateStoryFlags);
};

/**
 * Predefined story moment sequences for common game scenarios
 */
export const STORY_SEQUENCES = {
  TUTORIAL_START: ['tutorial_in_progress'],
  TUTORIAL_END: ['tutorial_in_progress'],

  DIALOGUE_START: ['dialogue_active'],
  DIALOGUE_END: ['dialogue_active'],

  CUTSCENE_START: ['cutscene_playing'],
  CUTSCENE_END: ['cutscene_playing'],

  BOSS_ENCOUNTER_START: ['boss_encounter_intro', 'dialogue_active'],
  BOSS_ENCOUNTER_END: ['boss_encounter_intro', 'dialogue_active'],

  STORY_CHOICE_START: ['story_choice_pending', 'dialogue_active'],
  STORY_CHOICE_END: ['story_choice_pending', 'dialogue_active'],

  AREA_TRANSITION_START: ['area_transition_in_progress'],
  AREA_TRANSITION_END: ['area_transition_in_progress'],

  ENDING_START: ['ending_sequence', 'cutscene_playing'],
  ENDING_END: ['ending_sequence', 'cutscene_playing'],
};
