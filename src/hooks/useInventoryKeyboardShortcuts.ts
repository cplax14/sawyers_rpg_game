import { useEffect, useCallback } from 'react';
import { useInventoryNavigation, InventoryTab } from '../contexts/InventoryNavigationContext';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'combat' | 'quick';
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
  condition?: () => boolean;
}

interface UseInventoryKeyboardShortcutsOptions {
  isInventoryOpen: boolean;
  currentTab: InventoryTab;
  onClose: () => void;
  onQuickUsePotion?: () => void;
  onQuickSaveLoadout?: () => void;
  onToggleAutoSort?: () => void;
  onQuickEquipBest?: () => void;
  onDropItem?: () => void;
  onSellItem?: () => void;
  onRepairAll?: () => void;
  onFeedCreatures?: () => void;
  disabled?: boolean;
}

export const useInventoryKeyboardShortcuts = ({
  isInventoryOpen,
  currentTab,
  onClose,
  onQuickUsePotion,
  onQuickSaveLoadout,
  onToggleAutoSort,
  onQuickEquipBest,
  onDropItem,
  onSellItem,
  onRepairAll,
  onFeedCreatures,
  disabled = false
}: UseInventoryKeyboardShortcutsOptions) => {
  const { navigateToTab, goBack, canGoBack } = useInventoryNavigation();

  // Define all keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      key: 'Escape',
      description: 'Close inventory',
      action: onClose,
      category: 'navigation'
    },
    {
      key: 'Backspace',
      description: 'Go back to previous tab',
      action: goBack,
      category: 'navigation',
      condition: canGoBack
    },
    {
      key: 'e',
      description: 'Open Equipment tab',
      action: () => navigateToTab('equipment'),
      category: 'navigation'
    },
    {
      key: 'i',
      description: 'Open Items tab',
      action: () => navigateToTab('items'),
      category: 'navigation'
    },
    {
      key: 'c',
      description: 'Open Creatures tab',
      action: () => navigateToTab('creatures'),
      category: 'navigation'
    },
    {
      key: 's',
      description: 'Open Stats tab',
      action: () => navigateToTab('stats'),
      category: 'navigation'
    },
    {
      key: '1',
      description: 'Switch to Equipment (Tab 1)',
      action: () => navigateToTab('equipment'),
      category: 'navigation'
    },
    {
      key: '2',
      description: 'Switch to Items (Tab 2)',
      action: () => navigateToTab('items'),
      category: 'navigation'
    },
    {
      key: '3',
      description: 'Switch to Creatures (Tab 3)',
      action: () => navigateToTab('creatures'),
      category: 'navigation'
    },
    {
      key: '4',
      description: 'Switch to Stats (Tab 4)',
      action: () => navigateToTab('stats'),
      category: 'navigation'
    },

    // Quick action shortcuts
    {
      key: 'h',
      description: 'Quick use healing potion',
      action: onQuickUsePotion || (() => {}),
      category: 'quick',
      condition: () => !!onQuickUsePotion
    },
    {
      key: 'q',
      description: 'Quick equip best available gear',
      action: onQuickEquipBest || (() => {}),
      category: 'quick',
      condition: () => !!onQuickEquipBest && currentTab === 'equipment'
    },
    {
      key: 'a',
      description: 'Auto-sort inventory',
      action: onToggleAutoSort || (() => {}),
      category: 'actions',
      condition: () => !!onToggleAutoSort && currentTab === 'items'
    },
    {
      key: 'r',
      description: 'Repair all equipment',
      action: onRepairAll || (() => {}),
      category: 'actions',
      condition: () => !!onRepairAll && currentTab === 'equipment'
    },
    {
      key: 'f',
      description: 'Feed all creatures',
      action: onFeedCreatures || (() => {}),
      category: 'actions',
      condition: () => !!onFeedCreatures && currentTab === 'creatures'
    },

    // Advanced shortcuts with modifiers
    {
      key: 's',
      description: 'Save current equipment loadout',
      action: onQuickSaveLoadout || (() => {}),
      category: 'actions',
      modifiers: { ctrl: true },
      condition: () => !!onQuickSaveLoadout && currentTab === 'equipment'
    },
    {
      key: 'Delete',
      description: 'Drop selected item',
      action: onDropItem || (() => {}),
      category: 'actions',
      condition: () => !!onDropItem
    },
    {
      key: 'Enter',
      description: 'Sell selected item',
      action: onSellItem || (() => {}),
      category: 'actions',
      modifiers: { shift: true },
      condition: () => !!onSellItem
    }
  ];

  // Check if a key event matches a shortcut
  const matchesShortcut = useCallback((event: KeyboardEvent, shortcut: KeyboardShortcut): boolean => {
    const key = event.key.toLowerCase();
    const shortcutKey = shortcut.key.toLowerCase();

    // Check key match
    if (key !== shortcutKey) return false;

    // Check modifiers
    if (shortcut.modifiers) {
      if (shortcut.modifiers.ctrl && !event.ctrlKey) return false;
      if (shortcut.modifiers.shift && !event.shiftKey) return false;
      if (shortcut.modifiers.alt && !event.altKey) return false;

      // Ensure no extra modifiers
      if (!shortcut.modifiers.ctrl && event.ctrlKey) return false;
      if (!shortcut.modifiers.shift && event.shiftKey) return false;
      if (!shortcut.modifiers.alt && event.altKey) return false;
    } else {
      // No modifiers should be pressed
      if (event.ctrlKey || event.shiftKey || event.altKey) return false;
    }

    return true;
  }, []);

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't handle shortcuts when inventory is closed or system is disabled
    if (!isInventoryOpen || disabled) return;

    // Don't handle shortcuts when typing in inputs
    if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement) {
      return;
    }

    // Find matching shortcut
    const matchedShortcut = shortcuts.find(shortcut => {
      if (!matchesShortcut(event, shortcut)) return false;
      if (shortcut.condition && !shortcut.condition()) return false;
      return true;
    });

    if (matchedShortcut) {
      event.preventDefault();
      event.stopPropagation();
      matchedShortcut.action();
    }
  }, [isInventoryOpen, disabled, shortcuts, matchesShortcut]);

  // Set up event listeners
  useEffect(() => {
    if (!isInventoryOpen || disabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInventoryOpen, disabled, handleKeyDown]);

  // Return shortcuts for help display
  const getShortcutsByCategory = useCallback(() => {
    const categorized = shortcuts.reduce((acc, shortcut) => {
      if (shortcut.condition && !shortcut.condition()) return acc;

      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    }, {} as Record<string, KeyboardShortcut[]>);

    return categorized;
  }, [shortcuts]);

  const getShortcutDescription = useCallback((key: string): string => {
    const shortcut = shortcuts.find(s => s.key.toLowerCase() === key.toLowerCase());
    return shortcut?.description || '';
  }, [shortcuts]);

  const isShortcutAvailable = useCallback((key: string): boolean => {
    const shortcut = shortcuts.find(s => s.key.toLowerCase() === key.toLowerCase());
    return shortcut ? (shortcut.condition ? shortcut.condition() : true) : false;
  }, [shortcuts]);

  return {
    shortcuts,
    getShortcutsByCategory,
    getShortcutDescription,
    isShortcutAvailable
  };
};

export default useInventoryKeyboardShortcuts;