import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../../hooks/useGameState';
import { useExperience } from '../../hooks/useExperience';
import { ExperienceCalculator } from '../../utils/experienceUtils';

interface ExperienceBarProps {
  showTooltip?: boolean;
  className?: string;
  compact?: boolean;
}

interface ActivityIcon {
  [key: string]: string;
}

const ACTIVITY_ICONS: ActivityIcon = {
  combat: '⚔️',
  quest: '📜',
  exploration: '🗺️',
  creature: '🐉',
  crafting: '🔨',
  trading: '💰',
  discovery: '🔍',
  achievement: '🏆'
};

const ACTIVITY_COLORS: Record<string, string> = {
  combat: '#ef4444',
  quest: '#8b5cf6',
  exploration: '#10b981',
  creature: '#f59e0b',
  crafting: '#06b6d4',
  trading: '#84cc16',
  discovery: '#ec4899',
  achievement: '#f97316'
};

export const ExperienceBar: React.FC<ExperienceBarProps> = ({
  showTooltip = true,
  className = '',
  compact = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { player } = usePlayer();
  const { breakdown } = useExperience();

  if (!player) return null;

  // ALWAYS calculate level from XP (source of truth)
  const currentXP = player.experience || 0;
  const currentLevel = ExperienceCalculator.calculateLevel(currentXP);
  const nextLevel = currentLevel + 1;

  // Calculate XP needed for next level
  const requiredForNext = ExperienceCalculator.calculateRequiredXP(nextLevel);
  const requiredForCurrent = ExperienceCalculator.calculateRequiredXP(currentLevel);
  const progressXP = currentXP - requiredForCurrent;
  const neededXP = requiredForNext - requiredForCurrent;
  const progressPercentage = Math.min((progressXP / neededXP) * 100, 100);

  const experienceBreakdown = breakdown.bySource || {};
  const totalActivityXP = Object.values(experienceBreakdown).reduce((sum, sourceData: any) => sum + (sourceData.totalAmount || 0), 0);

  const getActivityPercentage = (activityXP: number): number => {
    return totalActivityXP > 0 ? (activityXP / totalActivityXP) * 100 : 0;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className={`experience-bar-container ${className}`}>
      {!compact && (
        <div className="experience-bar-header">
          <div className="level-info">
            <span className="current-level">Level {currentLevel}</span>
            <span className="xp-info">
              {formatNumber(progressXP)} / {formatNumber(neededXP)} XP to Level {nextLevel}
            </span>
          </div>
          <div className="next-level">
            Next: Level {nextLevel}
          </div>
        </div>
      )}

      <div
        className={`experience-bar ${compact ? 'compact' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="experience-bar-background">
          <motion.div
            className="experience-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          <div className="experience-bar-segments">
            {Object.entries(experienceBreakdown).map(([activity, sourceData]: [string, any]) => {
              const xp = sourceData.totalAmount || 0;
              if (xp === 0) return null;
              const percentage = getActivityPercentage(xp);
              const color = ACTIVITY_COLORS[activity] || '#64748b';

              return (
                <motion.div
                  key={activity}
                  className="experience-segment"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                    opacity: 0.7
                  }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
              );
            })}
          </div>
        </div>

        {compact && (
          <div className="compact-label">
            Lv.{currentLevel} ({Math.round(progressPercentage)}%)
          </div>
        )}

        <AnimatePresence>
          {showTooltip && isHovered && (
            <motion.div
              className="experience-tooltip"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="tooltip-header">
                <h3>Experience Breakdown</h3>
                <div className="total-xp">
                  Total: {formatNumber(currentXP)} XP
                </div>
              </div>

              <div className="tooltip-progress">
                <div className="progress-text">
                  Level {currentLevel} → {nextLevel}
                </div>
                <div className="progress-bar-mini">
                  <div
                    className="progress-fill"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="progress-numbers">
                  {formatNumber(progressXP)} / {formatNumber(neededXP)}
                </div>
              </div>

              <div className="activity-breakdown">
                {Object.entries(experienceBreakdown)
                  .filter(([, sourceData]: [string, any]) => (sourceData.totalAmount || 0) > 0)
                  .sort(([, a], [, b]) => (b.totalAmount || 0) - (a.totalAmount || 0))
                  .map(([activity, sourceData]: [string, any]) => {
                    const xp = sourceData.totalAmount || 0;
                    const percentage = getActivityPercentage(xp);
                    const icon = ACTIVITY_ICONS[activity] || '❓';
                    const color = ACTIVITY_COLORS[activity] || '#64748b';

                    return (
                      <div key={activity} className="activity-item">
                        <div className="activity-info">
                          <span className="activity-icon">{icon}</span>
                          <span className="activity-name">
                            {activity.charAt(0).toUpperCase() + activity.slice(1)}
                          </span>
                        </div>
                        <div className="activity-stats">
                          <div className="activity-bar">
                            <div
                              className="activity-fill"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                          <span className="activity-xp">
                            {formatNumber(xp)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {Object.keys(experienceBreakdown).filter(key => (experienceBreakdown[key].totalAmount || 0) > 0).length === 0 && (
                <div className="no-activities">
                  <span className="empty-icon">💫</span>
                  <p>Start your adventure to gain experience!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};

export default ExperienceBar;