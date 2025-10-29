import React from 'react';
import { motion } from 'framer-motion';
import { useInventoryNavigation, InventoryTab } from '../../contexts/InventoryNavigationContext';

interface NavigationBarProps {
  showBackButton?: boolean;
  showTabSwitcher?: boolean;
  compact?: boolean;
  className?: string;
}

interface QuickNavButtonProps {
  tab: InventoryTab;
  icon: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: string;
}

const QuickNavButton: React.FC<QuickNavButtonProps> = ({
  tab,
  icon,
  label,
  isActive,
  onClick,
  badge,
}) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    style={{
      background: isActive ? 'rgba(79, 195, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)',
      border: isActive ? '1px solid rgba(79, 195, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '8px',
      padding: '0.75rem 1rem',
      color: isActive ? '#4fc3f7' : '#f4f4f4',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.9rem',
      fontWeight: isActive ? '600' : '400',
      transition: 'all 0.2s ease',
      position: 'relative',
      minWidth: 'fit-content',
    }}
  >
    <span style={{ fontSize: '1.1rem' }}>{icon}</span>
    <span>{label}</span>

    {badge && (
      <span
        style={{
          background: '#4fc3f7',
          color: '#1a1a2e',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          padding: '0.2rem 0.4rem',
          borderRadius: '10px',
          minWidth: '18px',
          textAlign: 'center',
        }}
      >
        {badge}
      </span>
    )}
  </motion.button>
);

export const NavigationBar: React.FC<NavigationBarProps> = ({
  showBackButton = true,
  showTabSwitcher = true,
  compact = false,
  className = '',
}) => {
  const { navigationState, navigateToTab, goBack, canGoBack, isCurrentTab } =
    useInventoryNavigation();

  const tabs = [
    { id: 'equipment' as InventoryTab, icon: '⚔️', label: 'Equipment' },
    { id: 'items' as InventoryTab, icon: '🎒', label: 'Items' },
    { id: 'creatures' as InventoryTab, icon: '🐉', label: 'Creatures' },
    { id: 'stats' as InventoryTab, icon: '📊', label: 'Stats' },
  ];

  return (
    <div
      className={`navigation-bar ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: compact ? '0.75rem' : '1rem',
        background: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid rgba(79, 195, 247, 0.2)',
        borderRadius: '8px 8px 0 0',
      }}
    >
      {/* Back Button */}
      {showBackButton && (
        <motion.button
          onClick={goBack}
          disabled={!canGoBack()}
          whileHover={canGoBack() ? { scale: 1.05 } : {}}
          whileTap={canGoBack() ? { scale: 0.95 } : {}}
          style={{
            background: canGoBack() ? 'rgba(79, 195, 247, 0.1)' : 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '0.75rem',
            color: canGoBack() ? '#4fc3f7' : 'rgba(244, 244, 244, 0.4)',
            cursor: canGoBack() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>←</span>
          {!compact && <span>Back</span>}
        </motion.button>
      )}

      {/* Current Tab Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(79, 195, 247, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(79, 195, 247, 0.3)',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>
          {tabs.find(t => t.id === navigationState.currentTab)?.icon}
        </span>
        {!compact && (
          <span style={{ color: '#4fc3f7', fontWeight: '600' }}>
            {tabs.find(t => t.id === navigationState.currentTab)?.label}
          </span>
        )}
      </div>

      {/* Tab Switcher */}
      {showTabSwitcher && (
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginLeft: 'auto',
          }}
        >
          {tabs.map(tab => (
            <QuickNavButton
              key={tab.id}
              tab={tab.id}
              icon={tab.icon}
              label={compact ? '' : tab.label}
              isActive={isCurrentTab(tab.id)}
              onClick={() => navigateToTab(tab.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NavigationBar;
