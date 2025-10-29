import React, { createContext, useContext, useState, useCallback } from 'react';

export type InventoryTab = 'equipment' | 'items' | 'creatures' | 'stats';

export interface NavigationAction {
  type: 'navigate' | 'open_with_filter' | 'open_with_item' | 'open_with_creature';
  target: InventoryTab;
  payload?: {
    itemId?: string;
    creatureId?: string;
    filter?: string;
    category?: string;
    equipmentSlot?: string;
    autoSelect?: boolean;
  };
}

export interface NavigationState {
  currentTab: InventoryTab;
  history: InventoryTab[];
  pendingAction: NavigationAction | null;
}

export interface InventoryNavigationContextType {
  // Current navigation state
  navigationState: NavigationState;

  // Basic navigation
  navigateToTab: (tab: InventoryTab) => void;
  goBack: () => void;
  canGoBack: () => boolean;

  // Enhanced navigation with context
  navigateToEquipment: (slot?: string) => void;
  navigateToItems: (filter?: string, category?: string) => void;
  navigateToCreatures: (filter?: string) => void;
  navigateToStats: (section?: string) => void;

  // Cross-screen actions
  equipItem: (itemId: string) => void;
  viewItemDetails: (itemId: string) => void;
  viewCreatureDetails: (creatureId: string) => void;
  compareEquipment: (itemId: string, slot: string) => void;

  // Pending action management
  setPendingAction: (action: NavigationAction | null) => void;
  consumePendingAction: () => NavigationAction | null;

  // Navigation utilities
  getTabHistory: () => InventoryTab[];
  clearHistory: () => void;
  isCurrentTab: (tab: InventoryTab) => boolean;
}

const InventoryNavigationContext = createContext<InventoryNavigationContextType | null>(null);

export const useInventoryNavigation = (): InventoryNavigationContextType => {
  const context = useContext(InventoryNavigationContext);
  if (!context) {
    throw new Error('useInventoryNavigation must be used within an InventoryNavigationProvider');
  }
  return context;
};

interface InventoryNavigationProviderProps {
  children: React.ReactNode;
  initialTab?: InventoryTab;
  onTabChange?: (tab: InventoryTab) => void;
}

export const InventoryNavigationProvider: React.FC<InventoryNavigationProviderProps> = ({
  children,
  initialTab = 'items',
  onTabChange,
}) => {
  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentTab: initialTab,
    history: [initialTab],
    pendingAction: null,
  });

  // Basic navigation
  const navigateToTab = useCallback(
    (tab: InventoryTab) => {
      setNavigationState(prev => {
        const newHistory = prev.currentTab !== tab ? [...prev.history, tab] : prev.history;

        return {
          ...prev,
          currentTab: tab,
          history: newHistory.slice(-10), // Keep last 10 for memory management
        };
      });

      onTabChange?.(tab);
    },
    [onTabChange]
  );

  const goBack = useCallback(() => {
    setNavigationState(prev => {
      if (prev.history.length <= 1) return prev;

      const newHistory = prev.history.slice(0, -1);
      const previousTab = newHistory[newHistory.length - 1];

      return {
        ...prev,
        currentTab: previousTab,
        history: newHistory,
      };
    });
  }, []);

  const canGoBack = useCallback(() => {
    return navigationState.history.length > 1;
  }, [navigationState.history.length]);

  // Enhanced navigation with context
  const navigateToEquipment = useCallback(
    (slot?: string) => {
      const action: NavigationAction = {
        type: 'navigate',
        target: 'equipment',
        payload: slot ? { equipmentSlot: slot } : undefined,
      };

      setNavigationState(prev => ({ ...prev, pendingAction: action }));
      navigateToTab('equipment');
    },
    [navigateToTab]
  );

  const navigateToItems = useCallback(
    (filter?: string, category?: string) => {
      const action: NavigationAction = {
        type: 'open_with_filter',
        target: 'items',
        payload: { filter, category },
      };

      setNavigationState(prev => ({ ...prev, pendingAction: action }));
      navigateToTab('items');
    },
    [navigateToTab]
  );

  const navigateToCreatures = useCallback(
    (filter?: string) => {
      const action: NavigationAction = {
        type: 'open_with_filter',
        target: 'creatures',
        payload: { filter },
      };

      setNavigationState(prev => ({ ...prev, pendingAction: action }));
      navigateToTab('creatures');
    },
    [navigateToTab]
  );

  const navigateToStats = useCallback(
    (section?: string) => {
      const action: NavigationAction = {
        type: 'navigate',
        target: 'stats',
        payload: section ? { filter: section } : undefined,
      };

      setNavigationState(prev => ({ ...prev, pendingAction: action }));
      navigateToTab('stats');
    },
    [navigateToTab]
  );

  // Cross-screen actions
  const equipItem = useCallback(
    (itemId: string) => {
      const action: NavigationAction = {
        type: 'open_with_item',
        target: 'equipment',
        payload: { itemId, autoSelect: true },
      };

      setNavigationState(prev => ({ ...prev, pendingAction: action }));
      navigateToTab('equipment');
    },
    [navigateToTab]
  );

  const viewItemDetails = useCallback(
    (itemId: string) => {
      const action: NavigationAction = {
        type: 'open_with_item',
        target: 'items',
        payload: { itemId, autoSelect: true },
      };

      setNavigationState(prev => ({ ...prev, pendingAction: action }));
      navigateToTab('items');
    },
    [navigateToTab]
  );

  const viewCreatureDetails = useCallback(
    (creatureId: string) => {
      const action: NavigationAction = {
        type: 'open_with_creature',
        target: 'creatures',
        payload: { creatureId, autoSelect: true },
      };

      setNavigationState(prev => ({ ...prev, pendingAction: action }));
      navigateToTab('creatures');
    },
    [navigateToTab]
  );

  const compareEquipment = useCallback(
    (itemId: string, slot: string) => {
      const action: NavigationAction = {
        type: 'open_with_item',
        target: 'equipment',
        payload: { itemId, equipmentSlot: slot, autoSelect: true },
      };

      setNavigationState(prev => ({ ...prev, pendingAction: action }));
      navigateToTab('equipment');
    },
    [navigateToTab]
  );

  // Pending action management
  const setPendingAction = useCallback((action: NavigationAction | null) => {
    setNavigationState(prev => ({ ...prev, pendingAction: action }));
  }, []);

  const consumePendingAction = useCallback((): NavigationAction | null => {
    const action = navigationState.pendingAction;
    if (action) {
      setNavigationState(prev => ({ ...prev, pendingAction: null }));
    }
    return action;
  }, [navigationState.pendingAction]);

  // Navigation utilities
  const getTabHistory = useCallback(() => {
    return navigationState.history;
  }, [navigationState.history]);

  const clearHistory = useCallback(() => {
    setNavigationState(prev => ({
      ...prev,
      history: [prev.currentTab],
    }));
  }, []);

  const isCurrentTab = useCallback(
    (tab: InventoryTab) => {
      return navigationState.currentTab === tab;
    },
    [navigationState.currentTab]
  );

  const contextValue: InventoryNavigationContextType = {
    navigationState,
    navigateToTab,
    goBack,
    canGoBack,
    navigateToEquipment,
    navigateToItems,
    navigateToCreatures,
    navigateToStats,
    equipItem,
    viewItemDetails,
    viewCreatureDetails,
    compareEquipment,
    setPendingAction,
    consumePendingAction,
    getTabHistory,
    clearHistory,
    isCurrentTab,
  };

  return (
    <InventoryNavigationContext.Provider value={contextValue}>
      {children}
    </InventoryNavigationContext.Provider>
  );
};

export default InventoryNavigationProvider;
