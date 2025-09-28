import { ExperienceCalculator } from './experienceUtils';

interface LevelUpCallback {
  (fromLevel: number, toLevel: number, totalXP: number): void;
}

class LevelUpManager {
  private static instance: LevelUpManager;
  private callbacks: LevelUpCallback[] = [];
  private lastKnownLevel: number = 1;
  private lastKnownXP: number = 0;

  private constructor() {}

  static getInstance(): LevelUpManager {
    if (!LevelUpManager.instance) {
      LevelUpManager.instance = new LevelUpManager();
    }
    return LevelUpManager.instance;
  }

  // Register a callback for level up events
  onLevelUp(callback: LevelUpCallback): () => void {
    this.callbacks.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  // Check for level ups when XP changes
  checkForLevelUp(newXP: number, forceCheck: boolean = false): void {
    const newLevel = ExperienceCalculator.calculateLevel(newXP);

    // Only process if level actually increased or if forced
    if (newLevel > this.lastKnownLevel || forceCheck) {
      const fromLevel = this.lastKnownLevel;
      const toLevel = newLevel;

      // Notify all registered callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(fromLevel, toLevel, newXP);
        } catch (error) {
          console.error('Error in level up callback:', error);
        }
      });

      this.lastKnownLevel = newLevel;
    }

    this.lastKnownXP = newXP;
  }

  // Initialize with current player state
  initialize(currentXP: number): void {
    this.lastKnownXP = currentXP;
    this.lastKnownLevel = ExperienceCalculator.calculateLevel(currentXP);
  }

  // Manual trigger for testing or special cases
  triggerLevelUp(fromLevel: number, toLevel: number, totalXP: number): void {
    this.callbacks.forEach(callback => {
      try {
        callback(fromLevel, toLevel, totalXP);
      } catch (error) {
        console.error('Error in manual level up callback:', error);
      }
    });
  }

  // Get current state
  getCurrentState(): { level: number; xp: number } {
    return {
      level: this.lastKnownLevel,
      xp: this.lastKnownXP
    };
  }

  // Reset state (useful for new games or testing)
  reset(): void {
    this.lastKnownLevel = 1;
    this.lastKnownXP = 0;
    this.callbacks = [];
  }
}

// Export singleton instance
export const levelUpManager = LevelUpManager.getInstance();

// Convenience functions
export const onLevelUp = (callback: LevelUpCallback) => levelUpManager.onLevelUp(callback);
export const checkForLevelUp = (newXP: number) => levelUpManager.checkForLevelUp(newXP);
export const initializeLevelUpManager = (currentXP: number) => levelUpManager.initialize(currentXP);
export const triggerLevelUp = (fromLevel: number, toLevel: number, totalXP: number) =>
  levelUpManager.triggerLevelUp(fromLevel, toLevel, totalXP);

// Integration helpers for existing game systems
export const createExperienceGainHandler = () => {
  return (newTotalXP: number) => {
    checkForLevelUp(newTotalXP);
  };
};

export const createLevelUpIntegration = (showNotification: LevelUpCallback) => {
  return {
    // Initialize the system
    init: (currentXP: number) => {
      initializeLevelUpManager(currentXP);
      return onLevelUp(showNotification);
    },

    // Handle XP gains
    handleXPGain: (newTotalXP: number) => {
      checkForLevelUp(newTotalXP);
    },

    // Manual trigger
    trigger: (fromLevel: number, toLevel: number, totalXP: number) => {
      triggerLevelUp(fromLevel, toLevel, totalXP);
    }
  };
};

export default levelUpManager;