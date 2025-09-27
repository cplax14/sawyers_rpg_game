import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlayer } from '../../hooks/usePlayer';
import { useExperience } from '../../hooks/useExperience';

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
  const { getExperienceBreakdown, calculateLevel, getRequiredXP } = useExperience();

  if (!player) return null;

  const currentXP = player.experience || 0;
  const currentLevel = calculateLevel(currentXP);
  const nextLevel = currentLevel + 1;
  const requiredForNext = getRequiredXP(nextLevel);
  const requiredForCurrent = getRequiredXP(currentLevel);
  const progressXP = currentXP - requiredForCurrent;
  const neededXP = requiredForNext - requiredForCurrent;
  const progressPercentage = Math.min((progressXP / neededXP) * 100, 100);

  const experienceBreakdown = getExperienceBreakdown();
  const totalActivityXP = Object.values(experienceBreakdown).reduce((sum, xp) => sum + xp, 0);

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
              {formatNumber(progressXP)} / {formatNumber(neededXP)} XP
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
            {Object.entries(experienceBreakdown).map(([activity, xp]) => {
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
                  .filter(([, xp]) => xp > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([activity, xp]) => {
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

              {Object.keys(experienceBreakdown).filter(key => experienceBreakdown[key] > 0).length === 0 && (
                <div className="no-activities">
                  <span className="empty-icon">💫</span>
                  <p>Start your adventure to gain experience!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .experience-bar-container {
          width: 100%;
          font-family: 'Inter', sans-serif;
        }

        .experience-bar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .level-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .current-level {
          font-weight: 600;
          color: #1f2937;
        }

        .xp-info {
          font-size: 12px;
          color: #6b7280;
        }

        .next-level {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .experience-bar {
          position: relative;
          height: 24px;
          border-radius: 12px;
          background: #f3f4f6;
          border: 2px solid #e5e7eb;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .experience-bar:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .experience-bar.compact {
          height: 16px;
          border-radius: 8px;
          border-width: 1px;
        }

        .experience-bar-background {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .experience-bar-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          border-radius: inherit;
          z-index: 1;
        }

        .experience-bar-segments {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          z-index: 2;
        }

        .experience-segment {
          height: 100%;
          transform-origin: left;
        }

        .compact-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 11px;
          font-weight: 600;
          color: white;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
          z-index: 3;
        }

        .experience-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 12px;
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
          min-width: 280px;
          max-width: 400px;
          z-index: 1000;
        }

        .experience-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid white;
        }

        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        .tooltip-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .total-xp {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .tooltip-progress {
          margin-bottom: 16px;
        }

        .progress-text {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 6px;
        }

        .progress-bar-mini {
          height: 6px;
          background: #f3f4f6;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          border-radius: inherit;
          transition: width 0.3s ease;
        }

        .progress-numbers {
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }

        .activity-breakdown {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .activity-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .activity-info {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
          flex: 1;
        }

        .activity-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .activity-name {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          white-space: nowrap;
        }

        .activity-stats {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .activity-bar {
          flex: 1;
          height: 4px;
          background: #f3f4f6;
          border-radius: 2px;
          overflow: hidden;
          min-width: 40px;
        }

        .activity-fill {
          height: 100%;
          border-radius: inherit;
          transition: width 0.3s ease;
        }

        .activity-xp {
          font-size: 11px;
          color: #6b7280;
          white-space: nowrap;
          font-weight: 500;
        }

        .no-activities {
          text-align: center;
          padding: 16px 8px;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 24px;
          display: block;
          margin-bottom: 8px;
        }

        .no-activities p {
          margin: 0;
          font-size: 13px;
          font-style: italic;
        }

        @media (max-width: 640px) {
          .experience-tooltip {
            min-width: 260px;
            left: 0;
            right: 0;
            transform: none;
            margin: 0 8px;
          }

          .activity-item {
            flex-direction: column;
            align-items: stretch;
            gap: 4px;
          }

          .activity-stats {
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
};

export default ExperienceBar;