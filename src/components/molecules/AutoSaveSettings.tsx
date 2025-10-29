/**
 * Auto-Save Settings Component
 * Provides user controls for auto-save preferences
 */

import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAutoSave, useResponsive, useReducedMotion } from '../../hooks';
import { useReactGame } from '../../contexts/ReactGameContext';

interface AutoSaveSettingsProps {
  /** Custom className */
  className?: string;
  /** Show advanced settings */
  showAdvanced?: boolean;
}

export const AutoSaveSettings: React.FC<AutoSaveSettingsProps> = ({
  className = '',
  showAdvanced = true,
}) => {
  const { state, updateSettings } = useReactGame();
  const { autoSaveState, getAutoSaveStatus, lastAutoSave } = useAutoSave();
  const { isMobile } = useResponsive();
  const { animationConfig } = useReducedMotion();

  const handleSettingChange = useCallback(
    (setting: string, value: any) => {
      updateSettings({ [setting]: value });
    },
    [updateSettings]
  );

  const intervalOptions = [
    { value: 1, label: '1 minute' },
    { value: 2, label: '2 minutes' },
    { value: 3, label: '3 minutes' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
  ];

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '16px' : '20px',
    padding: isMobile ? '16px' : '20px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: '12px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const settingRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    flexWrap: isMobile ? 'wrap' : 'nowrap',
  };

  const labelStyle: React.CSSProperties = {
    color: '#ffffff',
    fontSize: isMobile ? '0.9rem' : '1rem',
    fontWeight: '500',
    flex: isMobile ? '1 1 100%' : '1',
    marginBottom: isMobile ? '4px' : '0',
  };

  const descriptionStyle: React.CSSProperties = {
    color: '#cccccc',
    fontSize: '0.8rem',
    marginTop: '4px',
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(212, 175, 55, 0.5)',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '0.9rem',
    minWidth: isMobile ? '120px' : '140px',
    outline: 'none',
  };

  const statusStyle: React.CSSProperties = {
    padding: '12px',
    background: 'rgba(212, 175, 55, 0.1)',
    borderRadius: '8px',
    border: '1px solid rgba(212, 175, 55, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  };

  const statusItemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
  };

  return (
    <motion.div
      style={containerStyle}
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={animationConfig}
    >
      <div>
        <h3
          style={{
            color: '#d4af37',
            fontSize: isMobile ? '1.1rem' : '1.2rem',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
          }}
        >
          Auto-Save Settings
        </h3>
        <p
          style={{
            color: '#cccccc',
            fontSize: '0.85rem',
            margin: '0 0 16px 0',
            lineHeight: '1.4',
          }}
        >
          Configure automatic game saving to prevent progress loss
        </p>
      </div>

      <div style={sectionStyle}>
        {/* Enable Auto-Save */}
        <div style={settingRowStyle}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Enable Auto-Save</label>
            <div style={descriptionStyle}>
              Automatically save your game progress at regular intervals
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type='checkbox'
              checked={state.settings.autoSave}
              onChange={e => handleSettingChange('autoSave', e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: '#d4af37',
              }}
            />
            <span style={{ color: '#ffffff', fontSize: '0.9rem' }}>
              {state.settings.autoSave ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        {/* Auto-Save Interval */}
        {state.settings.autoSave && (
          <div style={settingRowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Save Interval</label>
              <div style={descriptionStyle}>How often to automatically save your progress</div>
            </div>
            <select
              value={state.settings.autoSaveInterval}
              onChange={e => handleSettingChange('autoSaveInterval', parseInt(e.target.value))}
              style={inputStyle}
            >
              {intervalOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Show Notifications */}
        {state.settings.autoSave && (
          <div style={settingRowStyle}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Show Save Notifications</label>
              <div style={descriptionStyle}>Display a notification when auto-save completes</div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type='checkbox'
                checked={state.settings.autoSaveShowNotifications}
                onChange={e => handleSettingChange('autoSaveShowNotifications', e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#d4af37',
                }}
              />
              <span style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                {state.settings.autoSaveShowNotifications ? 'On' : 'Off'}
              </span>
            </label>
          </div>
        )}

        {/* Advanced Settings */}
        {showAdvanced && state.settings.autoSave && (
          <>
            <div
              style={{
                height: '1px',
                background: 'rgba(212, 175, 55, 0.3)',
                margin: '8px 0',
              }}
            />

            <div style={settingRowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Pause During Combat</label>
                <div style={descriptionStyle}>
                  Temporarily pause auto-save during combat encounters
                </div>
              </div>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <input
                  type='checkbox'
                  checked={state.settings.autoSavePauseDuringCombat}
                  onChange={e => handleSettingChange('autoSavePauseDuringCombat', e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#d4af37',
                  }}
                />
                <span style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                  {state.settings.autoSavePauseDuringCombat ? 'On' : 'Off'}
                </span>
              </label>
            </div>

            <div style={settingRowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Only When Active</label>
                <div style={descriptionStyle}>
                  Only auto-save when you're actively playing the game
                </div>
              </div>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <input
                  type='checkbox'
                  checked={state.settings.autoSaveOnlyWhenActive}
                  onChange={e => handleSettingChange('autoSaveOnlyWhenActive', e.target.checked)}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#d4af37',
                  }}
                />
                <span style={{ color: '#ffffff', fontSize: '0.9rem' }}>
                  {state.settings.autoSaveOnlyWhenActive ? 'On' : 'Off'}
                </span>
              </label>
            </div>

            <div style={settingRowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Max Failures</label>
                <div style={descriptionStyle}>
                  Disable auto-save after this many consecutive failures
                </div>
              </div>
              <select
                value={state.settings.autoSaveMaxFailures}
                onChange={e => handleSettingChange('autoSaveMaxFailures', parseInt(e.target.value))}
                style={{ ...inputStyle, minWidth: '80px' }}
              >
                <option value={1}>1</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Status Display */}
      {state.settings.autoSave && state.player && (
        <div style={statusStyle}>
          <h4
            style={{
              color: '#d4af37',
              fontSize: '0.95rem',
              fontWeight: '500',
              margin: '0 0 8px 0',
            }}
          >
            Auto-Save Status
          </h4>

          <div style={statusItemStyle}>
            <span style={{ color: '#cccccc' }}>Status:</span>
            <span style={{ color: '#ffffff', fontWeight: '500' }}>{getAutoSaveStatus()}</span>
          </div>

          {autoSaveState.consecutiveFailures > 0 && (
            <div style={statusItemStyle}>
              <span style={{ color: '#cccccc' }}>Consecutive Failures:</span>
              <span style={{ color: '#ff9999', fontWeight: '500' }}>
                {autoSaveState.consecutiveFailures}
              </span>
            </div>
          )}

          {lastAutoSave && (
            <div style={statusItemStyle}>
              <span style={{ color: '#cccccc' }}>Last Auto-Save:</span>
              <span style={{ color: '#ffffff', fontSize: '0.75rem' }}>
                {lastAutoSave.toLocaleString()}
              </span>
            </div>
          )}

          <div style={statusItemStyle}>
            <span style={{ color: '#cccccc' }}>Save Slot:</span>
            <span style={{ color: '#ffffff' }}>Slot 1 (Auto-Save)</span>
          </div>
        </div>
      )}

      {!state.player && state.settings.autoSave && (
        <div
          style={{
            ...statusStyle,
            background: 'rgba(255, 107, 107, 0.1)',
            borderColor: 'rgba(255, 107, 107, 0.3)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ff9999',
            }}
          >
            <span style={{ fontSize: '16px' }}>⚠️</span>
            <span style={{ fontSize: '0.9rem' }}>
              Auto-save will begin after creating a character
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
};

AutoSaveSettings.displayName = 'AutoSaveSettings';

export default memo(AutoSaveSettings);
