import { useState, useCallback, useEffect } from 'react';
import { useExperience } from './useExperience';
import { usePlayer } from './usePlayer';
import { ExperienceCalculator } from '../utils/experienceUtils';

interface LevelUpNotificationData {
  id: string;
  fromLevel: number;
  toLevel: number;
  totalXP: number;
  timestamp: number;
  isVisible: boolean;
}

interface UseLevelUpNotificationsReturn {
  currentNotification: LevelUpNotificationData | null;
  showLevelUpNotification: (fromLevel: number, toLevel: number, totalXP: number) => void;
  dismissNotification: () => void;
  hasPendingNotifications: boolean;
  notificationQueue: LevelUpNotificationData[];
}

export function useLevelUpNotifications(): UseLevelUpNotificationsReturn {
  const { levelInfo, checkLevelUp, processLevelUp } = useExperience();
  const { player } = usePlayer();

  const [currentNotification, setCurrentNotification] = useState<LevelUpNotificationData | null>(
    null
  );
  const [notificationQueue, setNotificationQueue] = useState<LevelUpNotificationData[]>([]);
  const [lastProcessedLevel, setLastProcessedLevel] = useState<number>(1);

  // Generate notification ID
  const generateNotificationId = useCallback(() => {
    return `levelup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Show level up notification
  const showLevelUpNotification = useCallback(
    (fromLevel: number, toLevel: number, totalXP: number) => {
      const newNotification: LevelUpNotificationData = {
        id: generateNotificationId(),
        fromLevel,
        toLevel,
        totalXP,
        timestamp: Date.now(),
        isVisible: true,
      };

      // If there's already a notification showing, queue this one
      if (currentNotification) {
        setNotificationQueue(prev => [...prev, newNotification]);
      } else {
        setCurrentNotification(newNotification);
      }
    },
    [currentNotification, generateNotificationId]
  );

  // Dismiss current notification and show next in queue
  const dismissNotification = useCallback(() => {
    setCurrentNotification(null);

    // Show next notification in queue if any
    if (notificationQueue.length > 0) {
      const nextNotification = notificationQueue[0];
      setNotificationQueue(prev => prev.slice(1));

      // Small delay to ensure smooth transition
      setTimeout(() => {
        setCurrentNotification(nextNotification);
      }, 300);
    }
  }, [notificationQueue]);

  // Check for automatic level ups
  useEffect(() => {
    if (!player || !levelInfo) return;

    const currentLevel = levelInfo.currentLevel;
    const currentXP = player.experience || 0;

    // Calculate level from current XP using our utilities
    const calculatedLevel = ExperienceCalculator.calculateLevel(currentXP);

    // Check if we've leveled up since last check
    if (calculatedLevel > lastProcessedLevel && lastProcessedLevel > 0) {
      // Process the level up through the experience system first
      const levelUpEvent = checkLevelUp();

      if (levelUpEvent) {
        // Process the level up in the background
        processLevelUp()
          .then(() => {
            // Show notification after processing is complete
            showLevelUpNotification(lastProcessedLevel, calculatedLevel, currentXP);
          })
          .catch(error => {
            console.error('Failed to process level up:', error);
            // Still show notification even if processing fails
            showLevelUpNotification(lastProcessedLevel, calculatedLevel, currentXP);
          });
      }
    }

    // Update last processed level
    if (calculatedLevel !== lastProcessedLevel) {
      setLastProcessedLevel(calculatedLevel);
    }
  }, [
    player?.experience,
    levelInfo?.currentLevel,
    lastProcessedLevel,
    checkLevelUp,
    processLevelUp,
    showLevelUpNotification,
  ]);

  // Initialize last processed level from current player level
  useEffect(() => {
    if (player && lastProcessedLevel === 1 && player.experience) {
      const currentLevel = ExperienceCalculator.calculateLevel(player.experience);
      setLastProcessedLevel(currentLevel);
    }
  }, [player, lastProcessedLevel]);

  // Handle experience gains that might trigger level ups
  useEffect(() => {
    if (!player) return;

    const currentXP = player.experience || 0;
    const currentLevel = ExperienceCalculator.calculateLevel(currentXP);

    // Check for multiple level gains (e.g., from large XP bonuses)
    if (currentLevel > lastProcessedLevel + 1) {
      // Multiple levels gained - show notifications for each
      for (let level = lastProcessedLevel + 1; level <= currentLevel; level++) {
        const fromLevel = level - 1;
        showLevelUpNotification(fromLevel, level, currentXP);
      }
      setLastProcessedLevel(currentLevel);
    }
  }, [player?.experience, lastProcessedLevel, showLevelUpNotification]);

  // Auto-process level ups when XP changes
  const processAutomaticLevelUp = useCallback(
    async (newXP: number) => {
      const newLevel = ExperienceCalculator.calculateLevel(newXP);
      const currentLevel = lastProcessedLevel;

      if (newLevel > currentLevel) {
        try {
          // Process level up through experience system
          const levelUpEvent = checkLevelUp();
          if (levelUpEvent) {
            await processLevelUp();
          }

          // Show notification(s) for level gains
          if (newLevel > currentLevel + 1) {
            // Multiple levels gained
            for (let level = currentLevel + 1; level <= newLevel; level++) {
              showLevelUpNotification(level - 1, level, newXP);
            }
          } else {
            // Single level gained
            showLevelUpNotification(currentLevel, newLevel, newXP);
          }

          setLastProcessedLevel(newLevel);
        } catch (error) {
          console.error('Failed to process automatic level up:', error);
        }
      }
    },
    [lastProcessedLevel, checkLevelUp, processLevelUp, showLevelUpNotification]
  );

  // Expose method for manual XP gains
  const handleExperienceGain = useCallback(
    (newTotalXP: number) => {
      processAutomaticLevelUp(newTotalXP);
    },
    [processAutomaticLevelUp]
  );

  return {
    currentNotification,
    showLevelUpNotification,
    dismissNotification,
    hasPendingNotifications: notificationQueue.length > 0,
    notificationQueue,
  };
}

export default useLevelUpNotifications;
