import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EquipmentScreen } from './EquipmentScreen';
import { InventoryScreen } from './InventoryScreen';
import { CreatureScreen } from './CreatureScreen';
import { StatsScreen } from './StatsScreen';
import {
  InventoryNavigationProvider,
  useInventoryNavigation,
} from '../../contexts/InventoryNavigationContext';
import { NavigationBar } from '../molecules/NavigationBar';
import KeyboardShortcutsHelp from '../molecules/KeyboardShortcutsHelp';
import { CombatRestrictionBanner } from '../molecules/CombatRestrictionBanner';
import { InventoryPauseIndicator } from '../molecules/GamePauseIndicator';
import { InventoryFeedback } from '../molecules/InventoryFeedback';
import { useInventory } from '../../hooks/useInventory';
import { usePlayer } from '../../hooks/useGameState';
import { useResponsiveInventory } from '../../hooks/useResponsiveInventory';
import { ExperienceCalculator } from '../../utils/experienceUtils';
import { useInventoryKeyboardShortcuts } from '../../hooks/useInventoryKeyboardShortcuts';
import {
  useCombatInventoryRestrictions,
  isTabAllowedInCombat,
} from '../../hooks/useCombatInventoryRestrictions';
import { useInventoryPause } from '../../hooks/useGamePause';
import { useInventoryAnimations } from '../../hooks/useInventoryAnimations';

interface InventoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: InventoryTab;
  className?: string;
}

export type InventoryTab = 'equipment' | 'items' | 'creatures' | 'stats';

interface TabConfig {
  id: InventoryTab;
  name: string;
  icon: string;
  shortcut: string;
  component: React.ComponentType<any>;
  description: string;
}

const INVENTORY_TABS: TabConfig[] = [
  {
    id: 'equipment',
    name: 'Equipment',
    icon: '⚔️',
    shortcut: 'E',
    component: EquipmentScreen,
    description: 'Manage weapons, armor, and accessories',
  },
  {
    id: 'items',
    name: 'Items',
    icon: '🎒',
    shortcut: 'I',
    component: InventoryScreen,
    description: 'View consumables, materials, and quest items',
  },
  {
    id: 'creatures',
    name: 'Creatures',
    icon: '🐉',
    shortcut: 'C',
    component: CreatureScreen,
    description: 'Manage creature collection and team',
  },
  {
    id: 'stats',
    name: 'Stats',
    icon: '📊',
    shortcut: 'S',
    component: StatsScreen,
    description: 'View character progression and statistics',
  },
];

// Inner component that uses navigation context
const InventoryManagerInner: React.FC<InventoryManagerProps> = ({ isOpen, onClose, className }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [combatBannerDismissed, setCombatBannerDismissed] = useState(false);
  const { inventoryState } = useInventory();
  const { player } = usePlayer();
  const {
    isMobile,
    isTablet,
    isDesktop,
    layoutConfig,
    getInventoryModalSize,
    getTabStyle,
    getResponsiveSpacing,
    getResponsiveFontSize,
  } = useResponsiveInventory();
  const { navigationState, navigateToTab, consumePendingAction } = useInventoryNavigation();

  // Combat restrictions
  const combatRestrictions = useCombatInventoryRestrictions({
    allowStatsView: true, // Allow checking stats during combat
    allowEquipmentView: false, // Prevent equipment changes during combat
    allowCreatureView: false, // Prevent creature management during combat
    allowedConsumableTypes: ['healing', 'mana', 'buff', 'debuff', 'combat'],
    enableEmergencyHealing: true,
  });

  // Game pause functionality
  const { pauseForInventory, resumeFromInventory, shouldPauseForInventory, isInventoryPaused } =
    useInventoryPause();

  // Animation and feedback system
  const {
    animations,
    feedbackQueue,
    removeFeedback,
    triggerEquipSuccess,
    triggerEquipError,
    triggerUseItem,
    triggerDeleteItem,
    triggerSaveLoadout,
    triggerAutoSort,
  } = useInventoryAnimations();

  const activeTab = navigationState.currentTab;

  // Handle combat tab restrictions - redirect to allowed tab if current tab is restricted
  useEffect(() => {
    if (combatRestrictions.isInCombat && !isTabAllowedInCombat(activeTab, combatRestrictions)) {
      // Auto-redirect to the first allowed tab (usually 'items')
      const firstAllowedTab = combatRestrictions.allowedTabs[0];
      if (firstAllowedTab && firstAllowedTab !== activeTab) {
        navigateToTab(firstAllowedTab);
      }
    }
  }, [combatRestrictions.isInCombat, combatRestrictions.allowedTabs, activeTab, navigateToTab]);

  // Handle game pause when inventory opens/closes during exploration
  useEffect(() => {
    if (isOpen && shouldPauseForInventory()) {
      pauseForInventory();
    } else if (!isOpen) {
      resumeFromInventory();
    }

    // Cleanup: Resume on unmount
    return () => {
      if (isInventoryPaused) {
        resumeFromInventory();
      }
    };
  }, [isOpen, shouldPauseForInventory, pauseForInventory, resumeFromInventory, isInventoryPaused]);

  // Handle close with animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose]);

  // Enhanced inventory action handlers with feedback
  const handleQuickUsePotion = useCallback(() => {
    // Implementation would use actual inventory system
    console.log('Quick use healing potion');
    triggerUseItem('Health Potion');
  }, [triggerUseItem]);

  const handleQuickEquipBest = useCallback(() => {
    // Implementation would analyze available equipment and equip best stats
    console.log('Quick equip best available gear');
    // Simulate success/failure for demo
    const success = Math.random() > 0.3;
    if (success) {
      triggerEquipSuccess();
    } else {
      triggerEquipError('No better equipment available');
    }
  }, [triggerEquipSuccess, triggerEquipError]);

  const handleToggleAutoSort = useCallback(() => {
    // Implementation would sort inventory by rarity/type
    console.log('Toggle auto-sort inventory');
    triggerAutoSort();
  }, [triggerAutoSort]);

  const handleQuickSaveLoadout = useCallback(() => {
    // Implementation would save current equipment setup
    console.log('Save current equipment loadout');
    triggerSaveLoadout();
  }, [triggerSaveLoadout]);

  const handleRepairAll = useCallback(() => {
    // Implementation would repair all damaged equipment
    console.log('Repair all equipment');
    triggerEquipSuccess();
  }, [triggerEquipSuccess]);

  const handleFeedCreatures = useCallback(() => {
    // Implementation would feed all hungry creatures
    console.log('Feed all creatures');
    triggerUseItem('Creature Food');
  }, [triggerUseItem]);

  const handleDropItem = useCallback(() => {
    // Implementation would drop currently selected item
    console.log('Drop selected item');
    triggerDeleteItem('Selected Item');
  }, [triggerDeleteItem]);

  const handleSellItem = useCallback(() => {
    // Implementation would sell currently selected item
    console.log('Sell selected item');
    triggerDeleteItem('Selected Item');
  }, [triggerDeleteItem]);

  // Keyboard shortcuts system
  const { shortcuts, getShortcutsByCategory } = useInventoryKeyboardShortcuts({
    isInventoryOpen: isOpen,
    currentTab: activeTab,
    onClose: handleClose,
    onQuickUsePotion: handleQuickUsePotion,
    onQuickSaveLoadout: combatRestrictions.isInCombat ? undefined : handleQuickSaveLoadout, // Disable during combat
    onToggleAutoSort: combatRestrictions.isInCombat ? undefined : handleToggleAutoSort, // Disable during combat
    onQuickEquipBest: combatRestrictions.isInCombat ? undefined : handleQuickEquipBest, // Disable during combat
    onDropItem: combatRestrictions.isInCombat ? undefined : handleDropItem, // Disable during combat
    onSellItem: combatRestrictions.isInCombat ? undefined : handleSellItem, // Disable during combat
    onRepairAll: combatRestrictions.isInCombat ? undefined : handleRepairAll, // Disable during combat
    onFeedCreatures: combatRestrictions.isInCombat ? undefined : handleFeedCreatures, // Disable during combat
    disabled: showKeyboardHelp, // Disable shortcuts when help is open
  });

  // Handle help toggle (? key)
  useEffect(() => {
    if (!isOpen) return;

    const handleHelpToggle = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        setShowKeyboardHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleHelpToggle);
    return () => window.removeEventListener('keydown', handleHelpToggle);
  }, [isOpen]);

  // Handle pending navigation actions
  useEffect(() => {
    if (isOpen) {
      const pendingAction = consumePendingAction();
      if (pendingAction) {
        // The action will be handled by the individual screen components
        console.log('Pending navigation action:', pendingAction);
      }
    }
  }, [isOpen, activeTab, consumePendingAction]);

  // Get active tab configuration
  const activeTabConfig = INVENTORY_TABS.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component;

  // Calculate summary stats for tab badges
  const getTabBadge = (tabId: InventoryTab): string | undefined => {
    switch (tabId) {
      case 'equipment':
        // Count equipped items
        const equippedCount = Object.values(inventoryState?.equipped || {}).filter(
          item => item !== null
        ).length;
        return equippedCount > 0 ? equippedCount.toString() : undefined;

      case 'items':
        // Count total items
        const itemCount = inventoryState?.items?.length || 0;
        return itemCount > 0 ? itemCount.toString() : undefined;

      case 'creatures':
        // Count creatures in collection
        const creatureCount = inventoryState?.creatures?.length || 0;
        return creatureCount > 0 ? creatureCount.toString() : undefined;

      case 'stats':
        // Show current level calculated from experience
        if (!player?.experience) return undefined;
        const calculatedLevel = ExperienceCalculator.calculateLevel(player.experience);
        return `Lv.${calculatedLevel}`;

      default:
        return undefined;
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`inventory-manager ${className || ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: isClosing ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: layoutConfig.modalPadding,
        }}
        onClick={e => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        {/* DEBUG: Component identifier */}
        {process.env.NODE_ENV === 'development' && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'rgba(0, 255, 0, 0.9)',
              color: 'black',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              borderRadius: '6px',
              zIndex: 10001,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
          >
            ✓ InventoryManager (FULL - WITH CREATURES TAB)
          </div>
        )}
        <motion.div
          className='inventory-container'
          initial={{ scale: 0.9, y: 20 }}
          animate={{
            scale: isClosing ? 0.9 : 1,
            y: isClosing ? 20 : 0,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            background: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)',
            borderRadius: getInventoryModalSize().borderRadius,
            border: '2px solid rgba(79, 195, 247, 0.3)',
            width: getInventoryModalSize().width,
            maxWidth: getInventoryModalSize().maxWidth,
            height: getInventoryModalSize().height,
            maxHeight: getInventoryModalSize().maxHeight,
            margin: getInventoryModalSize().margin,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header with close button */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.5rem 2rem',
              background: 'rgba(0, 0, 0, 0.3)',
              borderBottom: '1px solid rgba(79, 195, 247, 0.2)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: getResponsiveFontSize(2),
                    color: '#4fc3f7',
                    fontWeight: 'bold',
                  }}
                >
                  Inventory
                </h1>

                {/* Pause indicator in header */}
                {isInventoryPaused && (
                  <InventoryPauseIndicator
                    isPaused={isInventoryPaused}
                    position='header'
                    compact={isMobile}
                  />
                )}
              </div>

              {activeTabConfig && (
                <p
                  style={{
                    margin: '0.5rem 0 0',
                    color: 'rgba(244, 244, 244, 0.8)',
                    fontSize: '0.9rem',
                  }}
                >
                  {activeTabConfig.description}
                  {isInventoryPaused && !isMobile && (
                    <span style={{ color: '#ffd700', marginLeft: '0.5rem' }}>
                      • Game automatically paused during exploration
                    </span>
                  )}
                </p>
              )}
            </div>

            <motion.button
              onClick={handleClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f4f4f4',
                cursor: 'pointer',
                fontSize: '1.2rem',
              }}
            >
              ✕
            </motion.button>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(0, 0, 0, 0.2)',
              borderBottom: '1px solid rgba(79, 195, 247, 0.2)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {INVENTORY_TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const badge = getTabBadge(tab.id);
              const isTabRestricted =
                combatRestrictions.isInCombat && !isTabAllowedInCombat(tab.id, combatRestrictions);
              const tabStyle = getTabStyle();

              return (
                <motion.button
                  key={tab.id}
                  onClick={() => {
                    if (!isTabRestricted) {
                      navigateToTab(tab.id);
                    }
                  }}
                  whileHover={
                    !isTabRestricted ? { backgroundColor: 'rgba(79, 195, 247, 0.1)' } : {}
                  }
                  whileTap={!isTabRestricted ? { scale: 0.95 } : {}}
                  title={
                    isTabRestricted ? `${tab.name} is restricted during combat` : tab.description
                  }
                  style={{
                    background: isActive ? 'rgba(79, 195, 247, 0.2)' : 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid #4fc3f7' : '2px solid transparent',
                    padding: tabStyle.padding,
                    color: isTabRestricted
                      ? 'rgba(244, 244, 244, 0.4)'
                      : isActive
                        ? '#4fc3f7'
                        : '#f4f4f4',
                    cursor: isTabRestricted ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: tabStyle.gap,
                    fontSize: tabStyle.fontSize,
                    fontWeight: isActive ? '600' : '400',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    minWidth: 'fit-content',
                    whiteSpace: 'nowrap',
                    opacity: isTabRestricted ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontSize: tabStyle.iconSize }}>{tab.icon}</span>

                  {tabStyle.showLabels && <span>{tab.name}</span>}

                  {tabStyle.showShortcuts && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        opacity: 0.6,
                        background: 'rgba(255, 255, 255, 0.1)',
                        padding: '0.2rem 0.4rem',
                        borderRadius: '4px',
                      }}
                    >
                      {tab.shortcut}
                    </span>
                  )}

                  {/* Badge or restriction indicator */}
                  {isTabRestricted ? (
                    <span
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: '#dc2626',
                        color: '#ffffff',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        padding: '0.2rem 0.3rem',
                        borderRadius: '8px',
                        lineHeight: 1,
                      }}
                    >
                      🚫
                    </span>
                  ) : (
                    badge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
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
                    )
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Combat Restriction Banner */}
            {combatRestrictions.isInCombat && !combatBannerDismissed && (
              <div style={{ padding: '1rem 2rem 0' }}>
                <CombatRestrictionBanner
                  restrictions={combatRestrictions}
                  currentTab={activeTab}
                  onDismiss={() => setCombatBannerDismissed(true)}
                  compact={isMobile}
                />
              </div>
            )}

            <div
              style={{
                flex: 1,
                overflow: 'hidden',
              }}
            >
              <AnimatePresence mode='wait'>
                <motion.div
                  key={activeTab}
                  variants={animations.tabEntry}
                  initial='hidden'
                  animate='visible'
                  exit='exit'
                  transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1], // Custom easing for smooth feel
                  }}
                  style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                  }}
                >
                  {ActiveComponent && (
                    <ActiveComponent
                      className='inventory-tab-content'
                      onClose={handleClose}
                      combatRestrictions={combatRestrictions}
                      animations={animations} // Pass animations to child components
                      onAction={(action: string, data?: any) => {
                        // Handle actions from child components with feedback
                        switch (action) {
                          case 'equip-success':
                            triggerEquipSuccess();
                            break;
                          case 'equip-error':
                            triggerEquipError(data?.reason || 'Cannot equip item');
                            break;
                          case 'use-item':
                            triggerUseItem(data?.itemName || 'Item');
                            break;
                          case 'delete-item':
                            triggerDeleteItem(data?.itemName || 'Item');
                            break;
                          case 'auto-sort':
                            triggerAutoSort();
                            break;
                          case 'save-loadout':
                            triggerSaveLoadout();
                            break;
                        }
                      }}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Footer with keyboard shortcuts hint */}
          {!isMobile && (
            <div
              style={{
                padding: '0.75rem 2rem',
                background: 'rgba(0, 0, 0, 0.3)',
                borderTop: '1px solid rgba(79, 195, 247, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: 'rgba(244, 244, 244, 0.6)',
              }}
            >
              <div>
                {combatRestrictions.isInCombat ? (
                  <span style={{ color: '#dc2626' }}>
                    ⚔️ Combat Mode: Limited access to consumables only
                  </span>
                ) : isInventoryPaused ? (
                  <span style={{ color: '#ffd700' }}>
                    ⏸️ Game Paused: Exploration timers and auto-save suspended
                  </span>
                ) : (
                  <>
                    Press <strong>E</strong>, <strong>I</strong>, <strong>C</strong>, or{' '}
                    <strong>S</strong> to switch tabs
                  </>
                )}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div>
                  Press <strong>?</strong> for shortcuts
                </div>
                <div>
                  Press <strong>ESC</strong> to close
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Keyboard Shortcuts Help */}
        <KeyboardShortcutsHelp
          isVisible={showKeyboardHelp}
          onClose={() => setShowKeyboardHelp(false)}
          currentTab={activeTabConfig?.name || activeTab}
          shortcuts={getShortcutsByCategory()}
          compact={isMobile}
        />

        {/* Feedback System */}
        <InventoryFeedback
          feedbacks={feedbackQueue}
          onRemove={removeFeedback}
          position={isMobile ? 'top-center' : 'top-right'}
          maxVisible={isMobile ? 3 : 5}
        />
      </motion.div>
    </AnimatePresence>
  );
};

// Main component that provides navigation context
const InventoryManager: React.FC<InventoryManagerProps> = props => {
  return (
    <InventoryNavigationProvider initialTab={props.initialTab}>
      <InventoryManagerInner {...props} />
    </InventoryNavigationProvider>
  );
};

export default InventoryManager;
