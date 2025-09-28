import React from 'react';
import { motion } from 'framer-motion';

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  shortcut: string;
  description: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  badge?: string | number;
}

interface QuickActionBarProps {
  actions: QuickAction[];
  layout?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
  showShortcuts?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  actions,
  layout = 'horizontal',
  showLabels = true,
  showShortcuts = true,
  className = '',
  style = {}
}) => {
  const getVariantColors = (variant: string = 'secondary') => {
    const variants = {
      primary: {
        background: 'rgba(79, 195, 247, 0.2)',
        border: '1px solid rgba(79, 195, 247, 0.4)',
        color: '#4fc3f7',
        hoverBackground: 'rgba(79, 195, 247, 0.3)'
      },
      secondary: {
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#f4f4f4',
        hoverBackground: 'rgba(255, 255, 255, 0.1)'
      },
      success: {
        background: 'rgba(34, 197, 94, 0.2)',
        border: '1px solid rgba(34, 197, 94, 0.4)',
        color: '#22c55e',
        hoverBackground: 'rgba(34, 197, 94, 0.3)'
      },
      danger: {
        background: 'rgba(239, 68, 68, 0.2)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        color: '#ef4444',
        hoverBackground: 'rgba(239, 68, 68, 0.3)'
      }
    };

    return variants[variant as keyof typeof variants] || variants.secondary;
  };

  const getLayoutStyles = () => {
    switch (layout) {
      case 'vertical':
        return {
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '0.5rem'
        };
      case 'compact':
        return {
          display: 'flex',
          flexWrap: 'wrap' as const,
          gap: '0.25rem'
        };
      default:
        return {
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center'
        };
    }
  };

  const containerStyle = {
    ...getLayoutStyles(),
    ...style
  };

  return (
    <div
      className={`quick-action-bar ${className}`}
      style={containerStyle}
    >
      {actions.map((action) => {
        const colors = getVariantColors(action.variant);
        const isCompact = layout === 'compact';

        return (
          <motion.button
            key={action.id}
            onClick={action.disabled ? undefined : action.action}
            whileHover={action.disabled ? {} : {
              backgroundColor: colors.hoverBackground,
              scale: 1.02
            }}
            whileTap={action.disabled ? {} : { scale: 0.98 }}
            title={action.description}
            style={{
              background: action.disabled ? 'rgba(255, 255, 255, 0.05)' : colors.background,
              border: action.disabled ? '1px solid rgba(255, 255, 255, 0.1)' : colors.border,
              borderRadius: '8px',
              padding: isCompact ? '0.5rem' : showLabels ? '0.75rem 1rem' : '0.75rem',
              color: action.disabled ? 'rgba(244, 244, 244, 0.4)' : colors.color,
              cursor: action.disabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: isCompact ? '0' : '0.5rem',
              fontSize: isCompact ? '0.8rem' : '0.9rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              position: 'relative',
              opacity: action.disabled ? 0.5 : 1,
              minWidth: isCompact ? '2.5rem' : 'auto',
              justifyContent: isCompact ? 'center' : 'flex-start'
            }}
          >
            {/* Icon */}
            <span style={{
              fontSize: isCompact ? '1rem' : '1.1rem',
              lineHeight: 1
            }}>
              {action.icon}
            </span>

            {/* Label (if not compact and showLabels is true) */}
            {!isCompact && showLabels && (
              <span style={{ whiteSpace: 'nowrap' }}>
                {action.label}
              </span>
            )}

            {/* Keyboard shortcut (if enabled and not compact) */}
            {!isCompact && showShortcuts && action.shortcut && (
              <span style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                padding: '0.2rem 0.4rem',
                fontSize: '0.7rem',
                fontFamily: 'monospace',
                opacity: 0.8,
                marginLeft: 'auto'
              }}>
                {action.shortcut.toUpperCase()}
              </span>
            )}

            {/* Badge */}
            {action.badge && (
              <span style={{
                position: 'absolute',
                top: '-0.25rem',
                right: '-0.25rem',
                background: '#ef4444',
                color: 'white',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                padding: '0.1rem 0.4rem',
                borderRadius: '10px',
                minWidth: '18px',
                textAlign: 'center',
                lineHeight: 1.2
              }}>
                {action.badge}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

// Pre-built action sets for different inventory screens
export const getEquipmentQuickActions = (callbacks: {
  onRepairAll?: () => void;
  onQuickEquipBest?: () => void;
  onSaveLoadout?: () => void;
  onShowComparison?: () => void;
}): QuickAction[] => [
  {
    id: 'repair-all',
    icon: '🔧',
    label: 'Repair All',
    shortcut: 'R',
    description: 'Repair all damaged equipment',
    action: callbacks.onRepairAll || (() => {}),
    variant: 'success',
    disabled: !callbacks.onRepairAll
  },
  {
    id: 'quick-equip',
    icon: '⚡',
    label: 'Quick Equip',
    shortcut: 'Q',
    description: 'Equip best available gear',
    action: callbacks.onQuickEquipBest || (() => {}),
    variant: 'primary',
    disabled: !callbacks.onQuickEquipBest
  },
  {
    id: 'save-loadout',
    icon: '💾',
    label: 'Save Loadout',
    shortcut: 'Ctrl+S',
    description: 'Save current equipment setup',
    action: callbacks.onSaveLoadout || (() => {}),
    variant: 'secondary',
    disabled: !callbacks.onSaveLoadout
  },
  {
    id: 'compare',
    icon: '⚖️',
    label: 'Compare',
    shortcut: 'C',
    description: 'Show stat comparison',
    action: callbacks.onShowComparison || (() => {}),
    variant: 'secondary',
    disabled: !callbacks.onShowComparison
  }
];

export const getItemsQuickActions = (callbacks: {
  onAutoSort?: () => void;
  onUseSelected?: () => void;
  onSellJunk?: () => void;
  onStackAll?: () => void;
}): QuickAction[] => [
  {
    id: 'auto-sort',
    icon: '📋',
    label: 'Auto Sort',
    shortcut: 'A',
    description: 'Sort inventory by category and rarity',
    action: callbacks.onAutoSort || (() => {}),
    variant: 'primary',
    disabled: !callbacks.onAutoSort
  },
  {
    id: 'use-selected',
    icon: '✨',
    label: 'Use Item',
    shortcut: 'Enter',
    description: 'Use the selected consumable',
    action: callbacks.onUseSelected || (() => {}),
    variant: 'success',
    disabled: !callbacks.onUseSelected
  },
  {
    id: 'sell-junk',
    icon: '💰',
    label: 'Sell Junk',
    shortcut: 'Shift+S',
    description: 'Sell all junk items',
    action: callbacks.onSellJunk || (() => {}),
    variant: 'secondary',
    disabled: !callbacks.onSellJunk
  },
  {
    id: 'stack-all',
    icon: '📦',
    label: 'Stack All',
    shortcut: 'T',
    description: 'Stack identical items',
    action: callbacks.onStackAll || (() => {}),
    variant: 'secondary',
    disabled: !callbacks.onStackAll
  }
];

export const getCreaturesQuickActions = (callbacks: {
  onFeedAll?: () => void;
  onReleaseSelected?: () => void;
  onBreedSelected?: () => void;
  onSummonBest?: () => void;
}): QuickAction[] => [
  {
    id: 'feed-all',
    icon: '🍎',
    label: 'Feed All',
    shortcut: 'F',
    description: 'Feed all hungry creatures',
    action: callbacks.onFeedAll || (() => {}),
    variant: 'success',
    disabled: !callbacks.onFeedAll
  },
  {
    id: 'summon-best',
    icon: '🌟',
    label: 'Summon Best',
    shortcut: 'B',
    description: 'Summon strongest creature',
    action: callbacks.onSummonBest || (() => {}),
    variant: 'primary',
    disabled: !callbacks.onSummonBest
  },
  {
    id: 'breed',
    icon: '💕',
    label: 'Breed',
    shortcut: 'M',
    description: 'Breed selected creatures',
    action: callbacks.onBreedSelected || (() => {}),
    variant: 'secondary',
    disabled: !callbacks.onBreedSelected
  },
  {
    id: 'release',
    icon: '🦋',
    label: 'Release',
    shortcut: 'Delete',
    description: 'Release selected creature',
    action: callbacks.onReleaseSelected || (() => {}),
    variant: 'danger',
    disabled: !callbacks.onReleaseSelected
  }
];

export const getStatsQuickActions = (callbacks: {
  onExportStats?: () => void;
  onResetProgress?: () => void;
  onShowHistory?: () => void;
}): QuickAction[] => [
  {
    id: 'show-history',
    icon: '📈',
    label: 'Show History',
    shortcut: 'H',
    description: 'View progression history',
    action: callbacks.onShowHistory || (() => {}),
    variant: 'primary',
    disabled: !callbacks.onShowHistory
  },
  {
    id: 'export-stats',
    icon: '📊',
    label: 'Export',
    shortcut: 'E',
    description: 'Export character statistics',
    action: callbacks.onExportStats || (() => {}),
    variant: 'secondary',
    disabled: !callbacks.onExportStats
  },
  {
    id: 'reset-progress',
    icon: '🔄',
    label: 'Reset',
    shortcut: 'Ctrl+R',
    description: 'Reset progression tracking',
    action: callbacks.onResetProgress || (() => {}),
    variant: 'danger',
    disabled: !callbacks.onResetProgress
  }
];

export default QuickActionBar;