import React from 'react';
import { motion } from 'framer-motion';
import { useInventoryNavigation } from '../../contexts/InventoryNavigationContext';

interface CrossNavigationAction {
  label: string;
  icon: string;
  description: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  disabled?: boolean;
}

interface CrossNavigationButtonsProps {
  actions: CrossNavigationAction[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const CrossNavigationButtons: React.FC<CrossNavigationButtonsProps> = ({
  actions,
  layout = 'horizontal',
  size = 'medium',
  className = '',
}) => {
  const sizeConfig = {
    small: {
      padding: '0.5rem 0.75rem',
      fontSize: '0.8rem',
      iconSize: '1rem',
      gap: '0.5rem',
    },
    medium: {
      padding: '0.75rem 1rem',
      fontSize: '0.9rem',
      iconSize: '1.1rem',
      gap: '0.75rem',
    },
    large: {
      padding: '1rem 1.25rem',
      fontSize: '1rem',
      iconSize: '1.2rem',
      gap: '1rem',
    },
  };

  const config = sizeConfig[size];

  const getButtonStyle = (variant: string = 'secondary', disabled: boolean = false) => ({
    background: disabled
      ? 'rgba(255, 255, 255, 0.05)'
      : variant === 'primary'
        ? 'rgba(79, 195, 247, 0.2)'
        : variant === 'accent'
          ? 'rgba(168, 85, 247, 0.2)'
          : 'rgba(255, 255, 255, 0.05)',
    border: disabled
      ? '1px solid rgba(255, 255, 255, 0.1)'
      : variant === 'primary'
        ? '1px solid rgba(79, 195, 247, 0.4)'
        : variant === 'accent'
          ? '1px solid rgba(168, 85, 247, 0.4)'
          : '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: config.padding,
    color: disabled
      ? 'rgba(244, 244, 244, 0.4)'
      : variant === 'primary'
        ? '#4fc3f7'
        : variant === 'accent'
          ? '#a855f7'
          : '#f4f4f4',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: config.gap,
    fontSize: config.fontSize,
    fontWeight: '500',
    transition: 'all 0.2s ease',
    textAlign: 'left' as const,
    width: layout === 'grid' ? '100%' : 'auto',
  });

  const getLayoutStyles = () => {
    switch (layout) {
      case 'vertical':
        return {
          display: 'flex',
          flexDirection: 'column' as const,
          gap: '0.75rem',
        };
      case 'grid':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
        };
      default:
        return {
          display: 'flex',
          flexWrap: 'wrap' as const,
          gap: '0.75rem',
        };
    }
  };

  return (
    <div className={`cross-navigation-buttons ${className}`} style={getLayoutStyles()}>
      {actions.map((action, index) => (
        <motion.button
          key={index}
          onClick={action.disabled ? undefined : action.action}
          whileHover={action.disabled ? {} : { scale: 1.02 }}
          whileTap={action.disabled ? {} : { scale: 0.98 }}
          style={getButtonStyle(action.variant, action.disabled)}
          title={action.description}
        >
          <span style={{ fontSize: config.iconSize }}>{action.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600' }}>{action.label}</div>
            <div
              style={{
                fontSize: '0.8em',
                opacity: 0.8,
                marginTop: '0.25rem',
              }}
            >
              {action.description}
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

// Pre-built navigation button sets for common scenarios
export const EquipmentNavigationButtons: React.FC<{ itemId?: string; slot?: string }> = ({
  itemId,
  slot,
}) => {
  const { navigateToItems, navigateToStats } = useInventoryNavigation();

  const actions: CrossNavigationAction[] = [
    {
      label: 'View Items',
      icon: '🎒',
      description: 'Browse all available items',
      action: () => navigateToItems('equipment'),
      variant: 'secondary',
    },
    {
      label: 'Check Stats',
      icon: '📊',
      description: 'View character progression',
      action: () => navigateToStats('overview'),
      variant: 'accent',
    },
  ];

  return <CrossNavigationButtons actions={actions} />;
};

export const ItemNavigationButtons: React.FC<{ itemId?: string; canEquip?: boolean }> = ({
  itemId,
  canEquip = false,
}) => {
  const { navigateToEquipment, equipItem } = useInventoryNavigation();

  const actions: CrossNavigationAction[] = [
    {
      label: 'Equipment',
      icon: '⚔️',
      description: 'Manage equipped items',
      action: () => navigateToEquipment(),
      variant: 'secondary',
    },
  ];

  if (canEquip && itemId) {
    actions.unshift({
      label: 'Equip Item',
      icon: '✅',
      description: 'Equip this item immediately',
      action: () => equipItem(itemId),
      variant: 'primary',
    });
  }

  return <CrossNavigationButtons actions={actions} />;
};

export const CreatureNavigationButtons: React.FC<{ creatureId?: string }> = ({ creatureId }) => {
  const { navigateToStats, navigateToEquipment } = useInventoryNavigation();

  const actions: CrossNavigationAction[] = [
    {
      label: 'Equipment',
      icon: '⚔️',
      description: 'Manage gear for combat',
      action: () => navigateToEquipment(),
      variant: 'secondary',
    },
    {
      label: 'Combat Stats',
      icon: '📊',
      description: 'View combat statistics',
      action: () => navigateToStats('overview'),
      variant: 'accent',
    },
  ];

  return <CrossNavigationButtons actions={actions} />;
};

export const StatsNavigationButtons: React.FC<{ section?: string }> = ({ section }) => {
  const { navigateToEquipment, navigateToCreatures } = useInventoryNavigation();

  const actions: CrossNavigationAction[] = [
    {
      label: 'Equipment',
      icon: '⚔️',
      description: 'Upgrade your gear',
      action: () => navigateToEquipment(),
      variant: 'primary',
    },
    {
      label: 'Creatures',
      icon: '🐉',
      description: 'Manage your team',
      action: () => navigateToCreatures(),
      variant: 'secondary',
    },
  ];

  return <CrossNavigationButtons actions={actions} />;
};

// Context-aware navigation suggestions
export const SmartNavigationSuggestions: React.FC<{
  context: 'low_health' | 'new_level' | 'new_equipment' | 'no_creatures' | 'full_inventory';
}> = ({ context }) => {
  const { navigateToItems, navigateToEquipment, navigateToCreatures, navigateToStats } =
    useInventoryNavigation();

  const getContextActions = (): CrossNavigationAction[] => {
    switch (context) {
      case 'low_health':
        return [
          {
            label: 'Use Healing Items',
            icon: '🧪',
            description: 'Restore health with potions',
            action: () => navigateToItems('consumables'),
            variant: 'primary',
          },
        ];

      case 'new_level':
        return [
          {
            label: 'Check Stats',
            icon: '📊',
            description: 'View your new stats',
            action: () => navigateToStats('overview'),
            variant: 'primary',
          },
          {
            label: 'Upgrade Equipment',
            icon: '⚔️',
            description: 'Find better gear',
            action: () => navigateToEquipment(),
            variant: 'secondary',
          },
        ];

      case 'new_equipment':
        return [
          {
            label: 'Equip Items',
            icon: '⚔️',
            description: 'Upgrade your equipment',
            action: () => navigateToEquipment(),
            variant: 'primary',
          },
        ];

      case 'no_creatures':
        return [
          {
            label: 'Find Creatures',
            icon: '🐉',
            description: 'Build your team',
            action: () => navigateToCreatures(),
            variant: 'primary',
          },
        ];

      case 'full_inventory':
        return [
          {
            label: 'Manage Items',
            icon: '🎒',
            description: 'Organize your inventory',
            action: () => navigateToItems(),
            variant: 'primary',
          },
        ];

      default:
        return [];
    }
  };

  const actions = getContextActions();
  if (actions.length === 0) return null;

  return (
    <div
      style={{
        background: 'rgba(79, 195, 247, 0.1)',
        border: '1px solid rgba(79, 195, 247, 0.3)',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          fontSize: '0.9rem',
          fontWeight: '600',
          color: '#4fc3f7',
          marginBottom: '0.75rem',
        }}
      >
        💡 Suggested Actions
      </div>
      <CrossNavigationButtons actions={actions} layout='horizontal' size='small' />
    </div>
  );
};

export default CrossNavigationButtons;
