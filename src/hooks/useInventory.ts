/**
 * useInventory Hook
 * Comprehensive inventory state management with enhanced operations
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useGameState } from './useGameState';
import { useSaveSystem } from './useSaveSystem';
import {
  InventoryState,
  InventoryContainer,
  InventorySlot,
  EnhancedItem,
  ItemOperation,
  InventoryOperation,
  InventoryOperationType,
  DetailedInventoryOperation,
  InventoryOperationContext,
  OperationStatus,
  InventoryError,
  InventoryException,
  InventoryFilter,
  InventorySortOption,
  UseItemResult,
  InventoryEvent,
  InventoryEventType,
  InventoryEventCallback,
  BatchOperation,
  InventorySnapshot
} from '../types/inventory';
import { ReactItem } from '../contexts/ReactGameContext';
import { consolidateStacks, canStackItems, stackItems } from '../utils/itemUtils';

// Default inventory configuration
const DEFAULT_INVENTORY_CONFIG = {
  maxCapacity: 100,
  maxWeight: 500,
  enableAutoSort: false,
  enableAutoStack: true,
  showQuantities: true,
  compactView: false
};

// Convert ReactItem to EnhancedItem
// Note: This helper is used during initialization. The equipped flag is added dynamically
// by the inventory hook based on current equipment state.
const convertToEnhancedItem = (reactItem: ReactItem): EnhancedItem => {
  // Check if item already has equipmentSlot (for test mocks and pre-converted items)
  const hasExplicitSlot = 'equipmentSlot' in reactItem && reactItem.equipmentSlot !== undefined;

  return {
    ...reactItem,
    category: reactItem.type === 'consumable' ? 'consumables' :
              reactItem.type === 'material' ? 'materials' :
              reactItem.type === 'quest' ? 'quest' : 'equipment',
    // Preserve explicit equipmentSlot if provided, otherwise infer from type
    equipmentSlot: hasExplicitSlot ? (reactItem as any).equipmentSlot :
                   reactItem.type === 'weapon' ? 'weapon' :
                   reactItem.type === 'armor' ? 'armor' :
                   reactItem.type === 'accessory' ? 'accessory' : undefined,
    equipmentSubtype: reactItem.subtype as any,
    stackable: reactItem.type === 'consumable' || reactItem.type === 'material',
    maxStack: reactItem.type === 'consumable' ? 99 : 1,
    weight: 1,
    sellValue: reactItem.value || 0,
    canTrade: true,
    canDrop: true,
    canDestroy: true,
    usable: reactItem.type === 'consumable',
    consumeOnUse: reactItem.type === 'consumable',
    useInCombat: reactItem.type === 'consumable',
    useOutOfCombat: true,
    rarity: reactItem.rarity || 'common'
  };
};

export const useInventory = () => {
  const gameState = useGameState();
  const { saveGame } = useSaveSystem();

  // Helper function to check if an item is currently equipped
  const isItemEquipped = useCallback((itemId: string): boolean => {
    const equipment = gameState.state.player?.equipment;
    if (!equipment) return false;

    // Check all equipment slots (10-slot system)
    const equippedItemIds = [
      equipment.weapon,
      equipment.armor,
      equipment.accessory,
      equipment.helmet,
      equipment.necklace,
      equipment.shield,
      equipment.gloves,
      equipment.boots,
      equipment.ring1,
      equipment.ring2,
      equipment.charm
    ];

    return equippedItemIds.includes(itemId);
  }, [gameState.state.player?.equipment]);

  // Enhanced inventory state
  const [inventoryState, setInventoryState] = useState<InventoryState>(() => {
    // Initialize with default containers
    const mainContainer: InventoryContainer = {
      id: 'main',
      name: 'Main Inventory',
      type: 'main',
      capacity: DEFAULT_INVENTORY_CONFIG.maxCapacity,
      items: gameState.state.inventory.map((item, index) => ({
        slotId: `main_${index}`,
        item: convertToEnhancedItem(item),
        quantity: item.quantity,
        locked: false,
        metadata: {
          isFavorite: false,
          isNew: false,
          lastModified: new Date()
        }
      })),
      filters: {
        categories: [],
        rarities: [],
        equipmentSlots: [],
        usableOnly: false,
        tradableOnly: false,
        showEquipped: false, // By default, hide equipped items from inventory view
        searchText: ''
      },
      sortBy: 'name',
      searchQuery: ''
    };

    return {
      containers: { main: mainContainer },
      equipped: {
        weapon: null,
        armor: null,
        accessory: null
      },
      totalCapacity: DEFAULT_INVENTORY_CONFIG.maxCapacity,
      usedCapacity: gameState.state.inventory.length,
      totalWeight: gameState.state.inventory.reduce((sum, item) => sum + (item.quantity || 1), 0),
      maxWeight: DEFAULT_INVENTORY_CONFIG.maxWeight,
      activeContainer: 'main',
      selectedItems: [],
      draggedItem: null,
      recentOperations: [],
      autoSort: DEFAULT_INVENTORY_CONFIG.enableAutoSort,
      autoStack: DEFAULT_INVENTORY_CONFIG.enableAutoStack,
      showQuantities: DEFAULT_INVENTORY_CONFIG.showQuantities,
      compactView: DEFAULT_INVENTORY_CONFIG.compactView,
      globalFilter: {
        categories: [],
        rarities: [],
        equipmentSlots: [],
        usableOnly: false,
        tradableOnly: false,
        showEquipped: false, // By default, hide equipped items from inventory view
        searchText: ''
      },
      savedFilters: {}
    };
  });

  // Sync inventory state when game context inventory changes
  // This is critical for tests and multi-hook scenarios where context is updated externally
  useEffect(() => {
    const contextInventory = gameState.state.inventory;

    // Update main container items to match context
    setInventoryState(prev => {
      const mainContainer: InventoryContainer = {
        ...prev.containers.main,
        items: contextInventory.map((item, index) => ({
          slotId: `main_${index}`,
          item: convertToEnhancedItem(item),
          quantity: item.quantity,
          locked: false,
          metadata: {
            isFavorite: false,
            isNew: false,
            lastModified: new Date()
          }
        }))
      };

      return {
        ...prev,
        containers: { ...prev.containers, main: mainContainer },
        usedCapacity: contextInventory.length,
        totalWeight: contextInventory.reduce((sum, item) => sum + (item.quantity || 1), 0)
      };
    });
  }, [gameState.state.inventory]);

  // Event listeners
  const [eventListeners, setEventListeners] = useState<Set<InventoryEventCallback>>(new Set());

  // Operation ID generator
  const generateOperationId = useCallback(() => {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Emit inventory events
  const emitEvent = useCallback((event: InventoryEvent) => {
    eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in inventory event listener:', error);
      }
    });
  }, [eventListeners]);

  // Create inventory snapshot
  const createSnapshot = useCallback((): InventorySnapshot => {
    return {
      id: `snapshot_${Date.now()}`,
      timestamp: new Date(),
      containers: Object.fromEntries(
        Object.entries(inventoryState.containers).map(([id, container]) => [
          id,
          {
            containerId: container.id,
            capacity: container.capacity,
            items: Object.fromEntries(
              container.items.map(slot => [
                slot.slotId,
                {
                  slotId: slot.slotId,
                  item: slot.item,
                  quantity: slot.quantity,
                  locked: slot.locked,
                  metadata: slot.metadata
                }
              ])
            ),
            filters: container.filters,
            sortBy: container.sortBy,
            searchQuery: container.searchQuery
          }
        ])
      ),
      equipment: inventoryState.equipped,
      metadata: {
        playerLevel: gameState.state.player?.level || 1,
        location: gameState.state.currentArea || 'unknown',
        gameState: 'exploration',
        totalValue: inventoryState.containers.main.items.reduce(
          (sum, slot) => sum + (slot.item?.value || 0) * slot.quantity, 0
        ),
        totalWeight: inventoryState.totalWeight,
        itemCount: inventoryState.usedCapacity,
        version: '1.0.0'
      },
      checksum: `${Date.now()}_${inventoryState.usedCapacity}_${inventoryState.totalWeight}`
    };
  }, [inventoryState, gameState.state]);

  // Add item to inventory
  const addItem = useCallback(async (
    item: EnhancedItem,
    quantity: number = 1,
    containerId: string = 'main'
  ): Promise<InventoryOperation> => {
    const operationId = generateOperationId();

    /**
     * TASK 4.5: Clear equipped flag when adding items to inventory
     * Items being unequipped should not retain their equipped status in inventory.
     * Create a clean copy of the item without the equipped flag.
     */
    const cleanItem = item.equipped ? { ...item, equipped: false } : item;

    const operation: InventoryOperation = {
      id: operationId,
      type: 'add',
      timestamp: new Date(),
      item: cleanItem,
      quantity,
      result: 'failed',
      error: undefined
    };

    try {
      const container = inventoryState.containers[containerId];
      if (!container) {
        throw new InventoryException(InventoryError.INVALID_OPERATION, `Container ${containerId} not found`);
      }

      // Check capacity (TASK 4.6: exclude equipped items from capacity check)
      const nonEquippedItemCount = container.items.filter(slot =>
        slot.item !== null && !isItemEquipped(slot.item.id)
      ).length;

      if (nonEquippedItemCount >= container.capacity) {
        throw new InventoryException(InventoryError.INVENTORY_FULL, 'Inventory is full');
      }

      // Check if item can stack with existing items
      // TASK 4.8: Exclude equipped items from stacking - they must remain separate
      let targetSlot: InventorySlot | null = null;
      if (cleanItem.stackable) {
        targetSlot = container.items.find(slot =>
          slot.item?.id === cleanItem.id &&
          slot.quantity < slot.item.maxStack &&
          !isItemEquipped(slot.item.id) // Don't stack with equipped items
        ) || null;
      }

      // Find empty slot if no stacking possible
      if (!targetSlot) {
        targetSlot = container.items.find(slot => slot.item === null) || null;
        if (!targetSlot) {
          // Create new slot if container has capacity
          const newSlotId = `${containerId}_${container.items.length}`;
          targetSlot = {
            slotId: newSlotId,
            item: null,
            quantity: 0,
            locked: false,
            metadata: {
              isFavorite: false,
              isNew: true,
              lastModified: new Date()
            }
          };
          container.items.push(targetSlot);
        }
      }

      // Update slot with clean item (equipped flag removed)
      if (targetSlot.item === null) {
        targetSlot.item = cleanItem;
        targetSlot.quantity = quantity;
      } else {
        targetSlot.quantity += quantity;
      }
      targetSlot.metadata = {
        ...targetSlot.metadata,
        lastModified: new Date(),
        isNew: true
      };

      // Update inventory state
      setInventoryState(prev => ({
        ...prev,
        containers: {
          ...prev.containers,
          [containerId]: container
        },
        usedCapacity: prev.usedCapacity + (targetSlot?.item === cleanItem ? 0 : 1),
        totalWeight: prev.totalWeight + quantity,
        recentOperations: [operation, ...prev.recentOperations.slice(0, 49)]
      }));

      // Update game state for backward compatibility (use clean item)
      gameState.addItems([{
        ...cleanItem,
        quantity
      } as ReactItem]);

      operation.result = 'success';
      operation.targetSlot = targetSlot.slotId;

      // Emit event (use clean item)
      emitEvent({
        type: 'item_added',
        timestamp: new Date(),
        item: cleanItem,
        quantity,
        container: containerId,
        slot: targetSlot.slotId,
        metadata: { operationId }
      });

      return operation;

    } catch (error) {
      operation.error = error instanceof InventoryException ? error.message : String(error);
      return operation;
    }
  }, [inventoryState, generateOperationId, gameState, emitEvent]);

  // Remove item from inventory
  const removeItem = useCallback(async (
    itemId: string,
    quantity: number = 1,
    containerId: string = 'main'
  ): Promise<InventoryOperation> => {
    const operationId = generateOperationId();
    const operation: InventoryOperation = {
      id: operationId,
      type: 'remove',
      timestamp: new Date(),
      item: {} as EnhancedItem, // Will be set when found
      quantity,
      result: 'failed'
    };

    try {
      const container = inventoryState.containers[containerId];
      if (!container) {
        throw new InventoryException(InventoryError.INVALID_OPERATION, `Container ${containerId} not found`);
      }

      const targetSlot = container.items.find(slot => slot.item?.id === itemId);
      if (!targetSlot || !targetSlot.item) {
        throw new InventoryException(InventoryError.ITEM_NOT_FOUND, `Item ${itemId} not found`);
      }

      // TASK 4.4: Prevent removal of equipped items
      if (isItemEquipped(itemId)) {
        throw new InventoryException(
          InventoryError.INVALID_OPERATION,
          "You can't remove an equipped item! Unequip it first."
        );
      }

      if (targetSlot.quantity < quantity) {
        throw new InventoryException(InventoryError.INVALID_QUANTITY, 'Insufficient quantity');
      }

      operation.item = targetSlot.item;
      operation.sourceSlot = targetSlot.slotId;

      // Update quantity or remove item
      if (targetSlot.quantity === quantity) {
        targetSlot.item = null;
        targetSlot.quantity = 0;
      } else {
        targetSlot.quantity -= quantity;
      }

      // Update inventory state
      setInventoryState(prev => ({
        ...prev,
        containers: {
          ...prev.containers,
          [containerId]: container
        },
        usedCapacity: targetSlot.item === null ? prev.usedCapacity - 1 : prev.usedCapacity,
        totalWeight: prev.totalWeight - quantity,
        recentOperations: [operation, ...prev.recentOperations.slice(0, 49)]
      }));

      // Update game state for backward compatibility
      gameState.removeItem(itemId, quantity);

      operation.result = 'success';

      // Emit event
      emitEvent({
        type: 'item_removed',
        timestamp: new Date(),
        item: operation.item,
        quantity,
        container: containerId,
        slot: targetSlot.slotId,
        metadata: { operationId }
      });

      return operation;

    } catch (error) {
      operation.error = error instanceof InventoryException ? error.message : String(error);
      return operation;
    }
  }, [inventoryState, generateOperationId, gameState, emitEvent, isItemEquipped]);

  // Drop item from inventory (permanently destroy)
  const dropItem = useCallback(async (
    itemId: string,
    quantity: number = 1,
    containerId: string = 'main'
  ): Promise<InventoryOperation> => {
    const operationId = generateOperationId();
    const operation: InventoryOperation = {
      id: operationId,
      type: 'drop',
      timestamp: new Date(),
      item: {} as EnhancedItem,
      quantity,
      result: 'failed'
    };

    try {
      const container = inventoryState.containers[containerId];
      if (!container) {
        throw new InventoryException(InventoryError.INVALID_OPERATION, `Container ${containerId} not found`);
      }

      const targetSlot = container.items.find(slot => slot.item?.id === itemId);
      if (!targetSlot || !targetSlot.item) {
        throw new InventoryException(InventoryError.ITEM_NOT_FOUND, `Item ${itemId} not found`);
      }

      // Check if item can be dropped
      if (!targetSlot.item.canDrop) {
        throw new InventoryException(
          InventoryError.INVALID_OPERATION,
          'This item cannot be dropped (quest item or special item)'
        );
      }

      // Prevent dropping equipped items
      if (isItemEquipped(itemId)) {
        throw new InventoryException(
          InventoryError.INVALID_OPERATION,
          "You can't drop an equipped item! Unequip it first."
        );
      }

      if (targetSlot.quantity < quantity) {
        throw new InventoryException(InventoryError.INVALID_QUANTITY, 'Insufficient quantity to drop');
      }

      operation.item = targetSlot.item;
      operation.sourceSlot = targetSlot.slotId;

      // Update quantity or remove item
      const remainingQuantity = targetSlot.quantity - quantity;
      if (remainingQuantity === 0) {
        targetSlot.item = null;
        targetSlot.quantity = 0;
      } else {
        targetSlot.quantity = remainingQuantity;
      }

      // Update inventory state
      setInventoryState(prev => ({
        ...prev,
        containers: {
          ...prev.containers,
          [containerId]: container
        },
        usedCapacity: remainingQuantity === 0 ? prev.usedCapacity - 1 : prev.usedCapacity,
        totalWeight: prev.totalWeight - quantity,
        recentOperations: [operation, ...prev.recentOperations.slice(0, 49)]
      }));

      // Update game state for backward compatibility
      gameState.removeItem(itemId, quantity);

      operation.result = 'success';

      // Emit event
      emitEvent({
        type: 'item_dropped',
        timestamp: new Date(),
        item: operation.item,
        quantity,
        container: containerId,
        slot: targetSlot.slotId,
        metadata: { operationId, droppedPermanently: true }
      });

      console.log(`✅ Dropped ${quantity}x ${operation.item.name} from inventory`);

      return operation;

    } catch (error) {
      operation.error = error instanceof InventoryException ? error.message : String(error);
      console.error('❌ Failed to drop item:', operation.error);
      return operation;
    }
  }, [inventoryState, generateOperationId, gameState, emitEvent, isItemEquipped]);

  // Use item with comprehensive effect application
  const useItem = useCallback(async (itemId: string, quantity: number = 1): Promise<UseItemResult> => {
    try {
      const container = inventoryState.containers.main;
      const targetSlot = container.items.find(slot => slot.item?.id === itemId);

      if (!targetSlot || !targetSlot.item) {
        return {
          success: false,
          consumed: false,
          effects: [],
          message: 'Item not found'
        };
      }

      const item = targetSlot.item;

      // TASK 8.2: Check if item is equipped (can't consume equipped items)
      if (isItemEquipped(itemId)) {
        return {
          success: false,
          consumed: false,
          effects: [],
          message: "You can't use an equipped item! Unequip it first."
        };
      }

      // Check if item can be used
      if (!item.usable && item.itemType !== 'consumable') {
        return {
          success: false,
          consumed: false,
          effects: [],
          message: 'Item is not usable'
        };
      }

      // Check if we have enough quantity
      const availableQuantity = item.quantity || 1;
      if (quantity > availableQuantity) {
        return {
          success: false,
          consumed: false,
          effects: [],
          message: `Not enough items (have ${availableQuantity}, need ${quantity})`
        };
      }

      // Get item effects
      const effects = item.effects || [];
      const appliedEffects: any[] = [];

      // Apply immediate effects to player stats
      if (effects.length > 0) {
        const currentPlayer = gameState.player;
        let playerUpdated = false;

        for (const effect of effects) {
          const effectValue = effect.value * quantity;

          switch (effect.type) {
            case 'heal':
            case 'health':
              if (currentPlayer.hp < currentPlayer.maxHp) {
                const healAmount = Math.min(effectValue, currentPlayer.maxHp - currentPlayer.hp);
                gameState.updatePlayer({
                  hp: Math.min(currentPlayer.hp + healAmount, currentPlayer.maxHp)
                });
                appliedEffects.push({
                  type: 'heal',
                  value: healAmount,
                  message: `Restored ${healAmount} HP`
                });
                playerUpdated = true;
              }
              break;

            case 'mana':
            case 'mp':
              if (currentPlayer.mp < currentPlayer.maxMp) {
                const manaAmount = Math.min(effectValue, currentPlayer.maxMp - currentPlayer.mp);
                gameState.updatePlayer({
                  mp: Math.min(currentPlayer.mp + manaAmount, currentPlayer.maxMp)
                });
                appliedEffects.push({
                  type: 'mana',
                  value: manaAmount,
                  message: `Restored ${manaAmount} MP`
                });
                playerUpdated = true;
              }
              break;

            case 'experience':
            case 'exp':
            case 'xp':
              gameState.updatePlayer({
                experience: currentPlayer.experience + effectValue
              });
              appliedEffects.push({
                type: 'experience',
                value: effectValue,
                message: `Gained ${effectValue} experience`
              });
              playerUpdated = true;
              break;

            case 'buff':
              // For buffs, we'll add them to a temporary effects list
              appliedEffects.push({
                type: 'buff',
                value: effectValue,
                duration: effect.duration,
                message: `Applied ${item.name} buff`
              });
              break;

            case 'stat_boost':
              // Temporary stat boost (would need a buff system to implement fully)
              appliedEffects.push({
                type: 'stat_boost',
                value: effectValue,
                duration: effect.duration,
                message: `Boosted stats temporarily`
              });
              break;

            default:
              appliedEffects.push({
                type: effect.type,
                value: effectValue,
                message: `Applied ${effect.type} effect`
              });
          }
        }

        // Save state if player was updated
        if (playerUpdated) {
          try {
            await saveGame();
          } catch (saveError) {
            console.warn('Failed to save game after item use:', saveError);
          }
        }
      }

      // Consume item if it's a consumable
      let consumed = false;
      if (item.itemType === 'consumable' || item.consumeOnUse) {
        await removeItem(itemId, quantity);
        consumed = true;
      }

      // Update game state for backward compatibility
      try {
        gameState.useItem(itemId);
      } catch (legacyError) {
        console.warn('Legacy useItem failed:', legacyError);
      }

      // Emit event
      emitEvent({
        type: 'item_used',
        timestamp: new Date(),
        item,
        quantity,
        metadata: {
          effects: appliedEffects,
          consumed,
          originalEffects: effects
        }
      });

      // Create success message
      let message = `Used ${item.name}`;
      if (quantity > 1) {
        message += ` x${quantity}`;
      }
      if (appliedEffects.length > 0) {
        const effectMessages = appliedEffects.map(e => e.message).join(', ');
        message += ` - ${effectMessages}`;
      }

      return {
        success: true,
        consumed,
        effects: appliedEffects,
        message
      };

    } catch (error) {
      console.error('Error using item:', error);
      return {
        success: false,
        consumed: false,
        effects: [],
        message: error instanceof Error ? error.message : 'Unknown error occurred while using item'
      };
    }
  }, [inventoryState, removeItem, gameState, saveGame, emitEvent]);

  // Consolidate stacks in inventory
  const consolidateInventoryStacks = useCallback(async (containerId: string = 'main'): Promise<void> => {
    const container = inventoryState.containers[containerId];
    if (!container) return;

    // Extract items from slots
    const items = container.items
      .filter(slot => slot.item !== null)
      .map(slot => slot.item!);

    // Consolidate stacks
    const consolidatedItems = consolidateStacks(items) || [];

    // Update container with consolidated items
    const newSlots: InventorySlot[] = consolidatedItems.map((item, index) => ({
      id: `slot-${index}`,
      position: index,
      item,
      locked: false
    }));

    // Fill remaining slots
    const remainingSlots = Array(container.capacity - consolidatedItems.length)
      .fill(null)
      .map((_, index) => ({
        id: `slot-${consolidatedItems.length + index}`,
        position: consolidatedItems.length + index,
        item: null,
        locked: false
      }));

    const updatedContainer = {
      ...container,
      items: [...newSlots, ...remainingSlots]
    };

    setInventoryState(prev => ({
      ...prev,
      containers: {
        ...prev.containers,
        [containerId]: updatedContainer
      }
    }));

    // Emit event
    emitEvent({
      type: 'inventory_consolidated',
      timestamp: new Date(),
      containerId,
      beforeCount: items.length,
      afterCount: consolidatedItems.length
    });
  }, [inventoryState, setInventoryState, emitEvent]);

  // Auto-stack items when adding to inventory
  const addItemWithStacking = useCallback(async (
    item: EnhancedItem,
    quantity: number = 1,
    containerId: string = 'main'
  ): Promise<InventoryOperation> => {
    const container = inventoryState.containers[containerId];
    if (!container) {
      throw new InventoryException('Container not found', 'CONTAINER_NOT_FOUND');
    }

    // Check if item can be stacked with existing items
    // TASK 4.8: Exclude equipped items from stacking - isItemEquipped check
    const existingSlot = container.items.find(slot =>
      slot.item &&
      canStackItems(item, slot.item) &&
      slot.item.quantity! + quantity <= (slot.item.maxStack || 99) &&
      !isItemEquipped(slot.item.id) // Don't stack with equipped items
    );

    if (existingSlot && existingSlot.item) {
      // Stack with existing item
      const updatedItem = {
        ...existingSlot.item,
        quantity: (existingSlot.item.quantity || 1) + quantity
      };

      const updatedSlot = {
        ...existingSlot,
        item: updatedItem
      };

      const updatedContainer = {
        ...container,
        items: container.items.map(slot => slot.id === existingSlot.id ? updatedSlot : slot)
      };

      setInventoryState(prev => ({
        ...prev,
        containers: {
          ...prev.containers,
          [containerId]: updatedContainer
        }
      }));

      const operation: InventoryOperation = {
        id: generateOperationId(),
        type: 'stack_item',
        timestamp: new Date(),
        itemId: item.id,
        quantity,
        targetSlot: existingSlot.id,
        containerId,
        status: 'completed'
      };

      emitEvent({
        type: 'item_stacked',
        timestamp: new Date(),
        item: updatedItem,
        quantity,
        previousQuantity: existingSlot.item.quantity || 1
      });

      return operation;
    } else {
      // Add as new item using existing addItem logic
      return await addItem(item, quantity, containerId);
    }
  }, [inventoryState, setInventoryState, generateOperationId, emitEvent, addItem, isItemEquipped]);

  // Helper function to mark items with equipped flag
  const markEquippedItems = useCallback((slots: InventorySlot[]): InventorySlot[] => {
    return slots.map(slot => {
      if (!slot.item) return slot;

      // Check if this item is currently equipped
      const equipped = isItemEquipped(slot.item.id);

      // Return slot with updated item that has equipped flag
      return {
        ...slot,
        item: {
          ...slot.item,
          equipped
        }
      };
    });
  }, [isItemEquipped]);

  // Get filtered and sorted items
  const getFilteredItems = useCallback((
    containerId: string = 'main',
    filter?: Partial<InventoryFilter>
  ): InventorySlot[] => {
    const container = inventoryState.containers[containerId];
    if (!container) return [];

    const activeFilter: InventoryFilter = filter ? { ...container.filters, ...filter } : container.filters;
    let items = container.items.filter(slot => slot.item !== null);

    // Mark items with equipped flag BEFORE filtering
    items = markEquippedItems(items);

    // Filter out equipped items by default (unless showEquipped is explicitly true)
    // Default behavior: exclude equipped items (showEquipped defaults to false if undefined)
    const shouldShowEquipped = activeFilter.showEquipped === true;
    if (!shouldShowEquipped) {
      items = items.filter(slot => !slot.item?.equipped);
    }

    // Apply filters
    if (activeFilter.categories.length > 0) {
      items = items.filter(slot =>
        slot.item && activeFilter.categories.includes(slot.item.category)
      );
    }

    if (activeFilter.rarities.length > 0) {
      items = items.filter(slot =>
        slot.item && activeFilter.rarities.includes(slot.item.rarity)
      );
    }

    if (activeFilter.usableOnly) {
      items = items.filter(slot => slot.item?.usable);
    }

    if (activeFilter.searchText) {
      const search = activeFilter.searchText.toLowerCase();
      items = items.filter(slot =>
        slot.item?.name.toLowerCase().includes(search) ||
        slot.item?.description.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    items.sort((a, b) => {
      if (!a.item || !b.item) return 0;

      switch (container.sortBy) {
        case 'name':
          return a.item.name.localeCompare(b.item.name);
        case 'rarity':
          const rarityOrder = { common: 0, rare: 1, epic: 2, legendary: 3 };
          return rarityOrder[b.item.rarity] - rarityOrder[a.item.rarity];
        case 'type':
          return a.item.category.localeCompare(b.item.category);
        case 'value':
          return (b.item.value || 0) - (a.item.value || 0);
        case 'quantity':
          return b.quantity - a.quantity;
        default:
          return 0;
      }
    });

    return items;
  }, [inventoryState, markEquippedItems]);

  // Get items by category with convenience function
  const getItemsByCategory = useCallback((category: string, containerId: string = 'main'): EnhancedItem[] => {
    const container = inventoryState.containers[containerId];
    if (!container) return [];

    // Get items and mark them with equipped flag
    const slots = container.items.filter(slot => slot.item && slot.item.category === category);
    const markedSlots = markEquippedItems(slots);

    return markedSlots.map(slot => slot.item!);
  }, [inventoryState, markEquippedItems]);

  // Search items with convenience function
  const searchItems = useCallback((query: string, items?: EnhancedItem[]): EnhancedItem[] => {
    const searchTarget = items || getFilteredItems().map(slot => slot.item!).filter(Boolean);

    if (!query.trim()) return searchTarget;

    const searchTerm = query.toLowerCase();
    return searchTarget.filter(item =>
      item.name.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm) ||
      item.category?.toLowerCase().includes(searchTerm)
    );
  }, [getFilteredItems]);

  // Get total item count (excluding equipped items)
  // TASK 4.6: Only count items in the bag, not equipped items
  const getTotalItemCount = useCallback((containerId: string = 'main'): number => {
    const container = inventoryState.containers[containerId];
    if (!container) return 0;

    // Only count items that are NOT equipped
    return container.items.reduce((total, slot) => {
      if (!slot.item) return total;

      // Skip items that are currently equipped
      if (isItemEquipped(slot.item.id)) return total;

      return total + (slot.item.quantity || 1);
    }, 0);
  }, [inventoryState, isItemEquipped]);

  // Update container filter
  const updateFilter = useCallback((
    containerId: string = 'main',
    filter: Partial<InventoryFilter>
  ) => {
    setInventoryState(prev => ({
      ...prev,
      containers: {
        ...prev.containers,
        [containerId]: {
          ...prev.containers[containerId],
          filters: {
            ...prev.containers[containerId].filters,
            ...filter
          }
        }
      }
    }));
  }, []);

  // Update sort option
  const updateSort = useCallback((
    containerId: string = 'main',
    sortBy: InventorySortOption
  ) => {
    setInventoryState(prev => ({
      ...prev,
      containers: {
        ...prev.containers,
        [containerId]: {
          ...prev.containers[containerId],
          sortBy
        }
      }
    }));
  }, []);

  // Event subscription
  const addEventListener = useCallback((callback: InventoryEventCallback) => {
    setEventListeners(prev => new Set([...prev, callback]));

    return () => {
      setEventListeners(prev => {
        const newSet = new Set(prev);
        newSet.delete(callback);
        return newSet;
      });
    };
  }, []);

  // Auto-save integration - DISABLED
  // The main AutoSaveManager handles inventory persistence as part of game state.
  // This redundant auto-save was causing save corruption ("Save NaN") due to
  // incorrect parameter structure and conflicts with the main auto-save system.
  //
  // Previous implementation had:
  // - Wrong parameter: { slot: 0 } instead of { slotNumber: 0 }
  // - Excessive saves: triggered on every inventory change
  // - State conflicts: race conditions with main auto-save
  //
  // useEffect(() => {
  //   const saveInventory = async () => {
  //     try {
  //       await saveGame(gameState, { slotNumber: 0 });
  //     } catch (error) {
  //       console.error('Failed to auto-save inventory:', error);
  //     }
  //   };
  //   const timer = setTimeout(saveInventory, 1000);
  //   return () => clearTimeout(timer);
  // }, [inventoryState, saveGame, gameState]);

  // Computed values
  const statistics = useMemo(() => ({
    totalItems: inventoryState.usedCapacity,
    totalValue: Object.values(inventoryState.containers).reduce(
      (sum, container) => sum + container.items.reduce(
        (containerSum, slot) => containerSum + (slot.item?.value || 0) * slot.quantity, 0
      ), 0
    ),
    averageItemValue: inventoryState.usedCapacity > 0 ?
      Object.values(inventoryState.containers).reduce(
        (sum, container) => sum + container.items.reduce(
          (containerSum, slot) => containerSum + (slot.item?.value || 0) * slot.quantity, 0
        ), 0
      ) / inventoryState.usedCapacity : 0,
    rarityDistribution: Object.values(inventoryState.containers).reduce(
      (dist, container) => {
        container.items.forEach(slot => {
          if (slot.item) {
            dist[slot.item.rarity] = (dist[slot.item.rarity] || 0) + slot.quantity;
          }
        });
        return dist;
      }, {} as Record<string, number>
    )
  }), [inventoryState]);

  return {
    // State
    inventoryState,
    statistics,

    // Core operations
    addItem,
    removeItem,
    useItem,
    dropItem,

    // Stacking operations
    consolidateInventoryStacks,
    addItemWithStacking,

    // Query operations
    getFilteredItems,
    getItemsByCategory,
    searchItems,
    getTotalItemCount,
    isItemEquipped, // Equipment integration

    // Filter and sort
    updateFilter,
    updateSort,

    // Event handling
    addEventListener,

    // Utility
    createSnapshot,

    // Container management
    containers: inventoryState.containers,
    activeContainer: inventoryState.activeContainer,

    // Quick access to main inventory
    mainInventory: inventoryState.containers.main,

    // Backward compatibility
    legacyInventory: gameState.state.inventory
  };
};

export default useInventory;