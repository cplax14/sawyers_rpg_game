/**
 * Story Moments Hook
 * Provides easy access to story moment management functionality
 */

import { useCallback, useMemo } from 'react';
import { useGameState } from './useGameState';
import {
  StoryMoment,
  createStoryMomentManager,
  hasActiveStoryMoments,
  getHighestPriorityStoryMoment,
  STORY_SEQUENCES,
  STORY_MOMENTS
} from '../utils/storyMoments';

interface UseStoryMomentsResult {
  // Current state
  activeStoryMoments: StoryMoment[];
  highestPriorityMoment: StoryMoment | null;
  hasActiveStoryMoments: boolean;

  // Story moment controls
  startStoryMoment: (flag: string) => void;
  endStoryMoment: (flag: string) => void;
  startStoryMoments: (flags: string[]) => void;
  endStoryMoments: (flags: string[]) => void;

  // Sequence controls
  startSequence: (sequenceName: keyof typeof STORY_SEQUENCES) => void;
  endSequence: (sequenceName: keyof typeof STORY_SEQUENCES) => void;

  // Query functions
  isStoryMomentActive: (flag: string) => boolean;
  getStoryMomentInfo: (flag: string) => StoryMoment | undefined;
  shouldPauseAutoSave: () => boolean;

  // Utilities
  getAllStoryMoments: () => Record<string, StoryMoment>;
  getAvailableSequences: () => Record<string, string[]>;
}

export const useStoryMoments = (): UseStoryMomentsResult => {
  const { state, updateStoryFlags } = useGameState();

  // Create story moment manager
  const storyMomentManager = useMemo(() => {
    return createStoryMomentManager(updateStoryFlags);
  }, [updateStoryFlags]);

  // Computed values
  const activeStoryMoments = useMemo(() => {
    return hasActiveStoryMoments(state.storyFlags);
  }, [state.storyFlags]);

  const highestPriorityMoment = useMemo(() => {
    return getHighestPriorityStoryMoment(state.storyFlags);
  }, [state.storyFlags]);

  const hasActiveStoryMomentsValue = useMemo(() => {
    return activeStoryMoments.length > 0;
  }, [activeStoryMoments]);

  // Story moment controls
  const startStoryMoment = useCallback((flag: string) => {
    storyMomentManager.startStoryMoment(flag);
  }, [storyMomentManager]);

  const endStoryMoment = useCallback((flag: string) => {
    storyMomentManager.endStoryMoment(flag);
  }, [storyMomentManager]);

  const startStoryMoments = useCallback((flags: string[]) => {
    storyMomentManager.startStoryMoments(flags);
  }, [storyMomentManager]);

  const endStoryMoments = useCallback((flags: string[]) => {
    storyMomentManager.endStoryMoments(flags);
  }, [storyMomentManager]);

  // Sequence controls
  const startSequence = useCallback((sequenceName: keyof typeof STORY_SEQUENCES) => {
    const sequence = STORY_SEQUENCES[sequenceName];
    if (sequence) {
      storyMomentManager.startStoryMoments(sequence);
    } else {
      console.warn(`Unknown story sequence: ${sequenceName}`);
    }
  }, [storyMomentManager]);

  const endSequence = useCallback((sequenceName: keyof typeof STORY_SEQUENCES) => {
    const sequence = STORY_SEQUENCES[sequenceName];
    if (sequence) {
      storyMomentManager.endStoryMoments(sequence);
    } else {
      console.warn(`Unknown story sequence: ${sequenceName}`);
    }
  }, [storyMomentManager]);

  // Query functions
  const isStoryMomentActive = useCallback((flag: string): boolean => {
    return storyMomentManager.isStoryMomentActive(flag, state.storyFlags);
  }, [storyMomentManager, state.storyFlags]);

  const getStoryMomentInfo = useCallback((flag: string): StoryMoment | undefined => {
    return STORY_MOMENTS[flag];
  }, []);

  const shouldPauseAutoSave = useCallback((): boolean => {
    return activeStoryMoments.some(moment => moment.pauseAutoSave);
  }, [activeStoryMoments]);

  // Utilities
  const getAllStoryMoments = useCallback(() => {
    return STORY_MOMENTS;
  }, []);

  const getAvailableSequences = useCallback(() => {
    return STORY_SEQUENCES;
  }, []);

  return {
    // Current state
    activeStoryMoments,
    highestPriorityMoment,
    hasActiveStoryMoments: hasActiveStoryMomentsValue,

    // Story moment controls
    startStoryMoment,
    endStoryMoment,
    startStoryMoments,
    endStoryMoments,

    // Sequence controls
    startSequence,
    endSequence,

    // Query functions
    isStoryMomentActive,
    getStoryMomentInfo,
    shouldPauseAutoSave,

    // Utilities
    getAllStoryMoments,
    getAvailableSequences
  };
};

export default useStoryMoments;