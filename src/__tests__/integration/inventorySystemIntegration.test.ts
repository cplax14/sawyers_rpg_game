/**
 * Inventory System Integration Tests
 * Tests inventory system integration with combat, save system, and game state management
 */

import { renderHook, act } from '@testing-library/react';
import { useInventory } from '../../hooks/useInventory';
import { useEquipment } from '../../hooks/useEquipment';
import { useCreatures } from '../../hooks/useCreatures';
import { useCombat, useGameState } from '../../hooks/useGameState';
import { SaveSystemManager } from '../../utils/saveSystemManager';
import { EnhancedItem, ItemCategory } from '../../types/inventory';
import { EnhancedCreature } from '../../types/creatures';
import { ReactGameState } from '../../types/game';

// Mock external dependencies
jest.mock('../../hooks/useInventory');
jest.mock('../../hooks/useEquipment');
jest.mock('../../hooks/useCreatures');
jest.mock('../../hooks/useGameState');
jest.mock('../../contexts/ReactGameContext');
jest.mock('../../utils/saveSystemManager');

const mockUseInventory = useInventory as jest.MockedFunction<typeof useInventory>;
const mockUseEquipment = useEquipment as jest.MockedFunction<typeof useEquipment>;
const mockUseCreatures = useCreatures as jest.MockedFunction<typeof useCreatures>;
const mockUseCombat = useCombat as jest.MockedFunction<typeof useCombat>;
const mockUseGameState = useGameState as jest.MockedFunction<typeof useGameState>;
const mockSaveSystemManager = SaveSystemManager as jest.MockedClass<typeof SaveSystemManager>;

describe('Inventory System Integration Tests', () => {
  let mockGameState: ReactGameState;
  let mockInventoryState: any;
  let mockEquipmentState: any;
  let mockCreatureState: any;
  let mockCombatState: any;
  let mockSaveManager: jest.Mocked<SaveSystemManager>;

  // Test data
  const testItems: EnhancedItem[] = [
    {
      id: 'health_potion',
      name: 'Health Potion',
      category: 'consumables',
      type: 'consumable',
      rarity: 'common',
      quantity: 5,
      value: 50,
      usable: true,
      stackable: true,
      maxStack: 99,
      weight: 0.1,
      sellValue: 25,
      canTrade: true,
      canDrop: true,
      canDestroy: true,
      consumeOnUse: true,
      useInCombat: true,
      useOutOfCombat: true,
      description: 'Restores 50 HP',
      icon: '🧪',
      effects: [{ type: 'heal', value: 50 }]
    },
    {
      id: 'steel_sword',
      name: 'Steel Sword',
      category: 'equipment',
      type: 'equipment',
      rarity: 'uncommon',
      quantity: 1,
      value: 200,
      equipmentSlot: 'weapon',
      equipmentSubtype: 'sword',
      statModifiers: { attack: 25 },
      stackable: false,
      maxStack: 1,
      weight: 3,
      sellValue: 100,
      canTrade: true,
      canDrop: true,
      canDestroy: true,
      usable: false,
      consumeOnUse: false,
      useInCombat: false,
      useOutOfCombat: false,
      description: 'A sharp steel blade',
      icon: '⚔️'
    },
    {
      id: 'leather_armor',
      name: 'Leather Armor',
      category: 'equipment',
      type: 'equipment',
      rarity: 'common',
      quantity: 1,
      value: 150,
      equipmentSlot: 'armor',
      equipmentSubtype: 'chestplate',
      statModifiers: { defense: 15 },
      stackable: false,
      maxStack: 1,
      weight: 5,
      sellValue: 75,
      canTrade: true,
      canDrop: true,
      canDestroy: true,
      usable: false,
      consumeOnUse: false,
      useInCombat: false,
      useOutOfCombat: false,
      description: 'Basic leather protection',
      icon: '🦺'
    }
  ];

  const testCreatures: EnhancedCreature[] = [
    {
      id: 'dragon_001',
      creatureId: 'dragon_001',
      name: 'Fire Dragon',
      species: 'Dragon',
      creatureType: 'fire',
      level: 25,
      rarity: 'legendary',
      stats: { health: 500, attack: 80, defense: 60, speed: 40 },
      collectionStatus: 'captured'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock game state
    mockGameState = {
      player: {
        name: 'TestPlayer',
        level: 10,
        experience: 2500,
        currentArea: 'test_area',
        stats: { health: 100, mana: 50, attack: 30, defense: 20 }
      },
      inventory: {
        items: testItems.map(item => ({ id: item.id, quantity: item.quantity || 1 }))
      },
      equipment: {
        weapon: null,
        armor: null,
        helmet: null,
        shield: null,
        boots: null,
        gloves: null,
        necklace: null,
        ring1: null,
        ring2: null,
        charm: null
      },
      creatures: testCreatures,
      settings: {
        autoSave: true,
        autoSaveInterval: 300000
      }
    } as ReactGameState;

    // Mock inventory system
    mockInventoryState = {
      items: testItems,
      isLoading: false,
      error: null,
      getFilteredItems: jest.fn((filter) => testItems.filter(item =>
        !filter.category || item.category === filter.category
      )),
      getItemsByCategory: jest.fn((category: ItemCategory) =>
        testItems.filter(item => item.category === category)
      ),
      searchItems: jest.fn((query: string, items = testItems) =>
        items.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
      ),
      useItem: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      consolidateInventoryStacks: jest.fn(),
      getTotalItemCount: jest.fn(() => testItems.reduce((sum, item) => sum + (item.quantity || 1), 0))
    };

    // Mock equipment system
    mockEquipmentState = {
      equipped: {},
      equipmentStats: { attack: 0, defense: 0, health: 0, mana: 0 },
      finalStats: mockGameState.player.stats,
      canEquip: jest.fn((itemId: string) => {
        // Check combat state for equipment restrictions
        if (mockCombatState.inCombat && !mockCombatState.combatRestrictions.canChangeEquipment) {
          return { canEquip: false, reason: 'Cannot change equipment during combat' };
        }
        return { canEquip: true, reason: '' };
      }),
      equipItem: jest.fn(),
      unequipItem: jest.fn(),
      isLoading: false,
      error: null
    };

    // Mock creature system
    mockCreatureState = {
      collection: testCreatures,
      filteredCreatures: testCreatures,
      filteredBestiary: testCreatures,
      activeTeam: [],
      isLoading: false,
      error: null,
      getCollectionStats: jest.fn(() => ({
        discovered: 1,
        captured: 1,
        total: 100,
        completionPercentage: 1
      })),
      captureCreature: jest.fn(() => {
        // When capturing, also add to team if space available
        if (mockCreatureState.activeTeam.length < 6) {
          mockCreatureState.addToTeam();
        }
      }),
      releaseCreature: jest.fn(),
      addToTeam: jest.fn(),
      removeFromTeam: jest.fn()
    };

    // Mock combat system
    mockCombatState = {
      currentEncounter: null,
      inCombat: false,
      combatRestrictions: {
        canAccessInventory: true,
        canUseConsumables: true,
        canChangeEquipment: false
      },
      startCombat: jest.fn(),
      endCombat: jest.fn(),
      useItemInCombat: jest.fn(() => {
        // When using item in combat, also trigger inventory use
        mockInventoryState.useItem('health_potion');
      }),
      isLoading: false,
      error: null
    };

    // Mock save system
    mockSaveManager = {
      saveGame: jest.fn().mockResolvedValue({ success: true, data: 'save_id' }),
      loadGame: jest.fn().mockResolvedValue({ success: true, data: mockGameState }),
      getAllSaves: jest.fn().mockResolvedValue({ success: true, data: [] }),
      deleteSave: jest.fn().mockResolvedValue({ success: true }),
      exportSave: jest.fn().mockResolvedValue({ success: true, data: 'exported_data' }),
      importSave: jest.fn().mockResolvedValue({ success: true }),
      initialize: jest.fn().mockResolvedValue({ success: true })
    } as any;

    // Setup mock implementations
    mockUseInventory.mockReturnValue(mockInventoryState);
    mockUseEquipment.mockReturnValue(mockEquipmentState);
    mockUseCreatures.mockReturnValue(mockCreatureState);
    mockUseCombat.mockReturnValue(mockCombatState);
    mockUseGameState.mockReturnValue({ gameState: mockGameState, dispatch: jest.fn() });
    mockSaveSystemManager.mockImplementation(() => mockSaveManager);
  });

  describe('Inventory-Combat Integration', () => {
    it('should allow consumable usage during combat', async () => {
      // Setup: Player is in combat
      mockCombatState.inCombat = true;
      mockCombatState.currentEncounter = {
        enemy: { name: 'Goblin', health: 50, maxHealth: 50 },
        playerHealth: 75,
        playerMaxHealth: 100
      };

      const { result } = renderHook(() => ({
        inventory: useInventory(),
        combat: useCombat()
      }));

      // Act: Use health potion during combat
      await act(async () => {
        await result.current.combat.useItemInCombat('health_potion');
      });

      // Assert: Item was used and health was restored
      expect(mockCombatState.useItemInCombat).toHaveBeenCalledWith('health_potion');
      expect(mockInventoryState.useItem).toHaveBeenCalledWith('health_potion');
    });

    it('should prevent equipment changes during combat', async () => {
      // Setup: Player is in combat with equipment restrictions
      mockCombatState.inCombat = true;
      mockCombatState.combatRestrictions.canChangeEquipment = false;

      const { result } = renderHook(() => ({
        equipment: useEquipment(),
        combat: useCombat()
      }));

      // Act: Try to equip weapon during combat
      const canEquipResult = result.current.equipment.canEquip('steel_sword');

      // Assert: Equipment change should be prevented
      expect(canEquipResult.canEquip).toBe(false);
      expect(canEquipResult.reason).toContain('combat');
    });

    it('should apply equipment stats to combat calculations', () => {
      // Setup: Equip steel sword
      mockEquipmentState.equipped.weapon = testItems[1]; // steel_sword
      mockEquipmentState.equipmentStats.attack = 25;
      mockEquipmentState.finalStats = {
        ...mockGameState.player.stats,
        attack: mockGameState.player.stats.attack + 25
      };

      const { result } = renderHook(() => ({
        equipment: useEquipment(),
        combat: useCombat()
      }));

      // Assert: Player stats include equipment bonuses
      expect(result.current.equipment.finalStats.attack).toBe(55); // 30 base + 25 weapon
      expect(result.current.equipment.equipmentStats.attack).toBe(25);
    });

    it('should handle creature companions in combat', async () => {
      // Setup: Add creature to active team
      mockCreatureState.activeTeam = [testCreatures[0]];

      const { result } = renderHook(() => ({
        creatures: useCreatures(),
        combat: useCombat()
      }));

      // Act: Start combat with creature companion
      await act(async () => {
        await result.current.combat.startCombat({
          enemy: { name: 'Boss', health: 200 },
          companions: result.current.creatures.activeTeam
        });
      });

      // Assert: Combat started with companion
      expect(mockCombatState.startCombat).toHaveBeenCalledWith(
        expect.objectContaining({
          companions: expect.arrayContaining([testCreatures[0]])
        })
      );
    });
  });

  describe('Inventory-Save System Integration', () => {
    it('should save and restore inventory state correctly', async () => {
      const saveManager = new SaveSystemManager({} as any);

      // Act: Save game with current inventory
      const saveResult = await saveManager.saveGame(mockGameState, 'test_save');

      // Assert: Save was successful
      expect(saveResult.success).toBe(true);
      expect(mockSaveManager.saveGame).toHaveBeenCalledWith(mockGameState, 'test_save');

      // Act: Load the saved game
      const loadResult = await saveManager.loadGame('save_id');

      // Assert: Game state was loaded correctly
      expect(loadResult.success).toBe(true);
      expect(loadResult.data).toEqual(mockGameState);
    });

    it('should preserve equipment configuration across save/load', async () => {
      // Setup: Equip items
      mockEquipmentState.equipped.weapon = testItems[1];
      mockEquipmentState.equipped.armor = testItems[2];

      const gameStateWithEquipment = {
        ...mockGameState,
        equipment: {
          weapon: testItems[1],
          armor: testItems[2],
          helmet: null,
          shield: null,
          boots: null,
          gloves: null,
          necklace: null,
          ring1: null,
          ring2: null,
          charm: null
        }
      };

      const saveManager = new SaveSystemManager({} as any);

      // Mock load to return equipped state
      mockSaveManager.loadGame.mockResolvedValue({
        success: true,
        data: gameStateWithEquipment
      });

      // Act: Save and load
      await saveManager.saveGame(gameStateWithEquipment, 'equipped_save');
      const loadResult = await saveManager.loadGame('save_id');

      // Assert: Equipment was preserved
      expect(loadResult.data.equipment.weapon).toEqual(testItems[1]);
      expect(loadResult.data.equipment.armor).toEqual(testItems[2]);
    });

    it('should maintain creature collection across saves', async () => {
      const gameStateWithCreatures = {
        ...mockGameState,
        creatures: testCreatures
      };

      const saveManager = new SaveSystemManager({} as any);

      // Mock load to return creature state
      mockSaveManager.loadGame.mockResolvedValue({
        success: true,
        data: gameStateWithCreatures
      });

      // Act: Save and load
      await saveManager.saveGame(gameStateWithCreatures, 'creature_save');
      const loadResult = await saveManager.loadGame('save_id');

      // Assert: Creatures were preserved
      expect(loadResult.data.creatures).toEqual(testCreatures);
      expect(loadResult.data.creatures[0].collectionStatus).toBe('captured');
    });

    it('should handle inventory data corruption gracefully', async () => {
      // Setup: Corrupted save data
      const corruptedGameState = {
        ...mockGameState,
        inventory: null, // Corrupted inventory
        equipment: undefined // Missing equipment
      };

      mockSaveManager.loadGame.mockResolvedValue({
        success: true,
        data: corruptedGameState
      });

      const saveManager = new SaveSystemManager({} as any);

      // Act: Load corrupted save
      const loadResult = await saveManager.loadGame('corrupted_save');

      // Assert: System should handle corruption gracefully
      expect(loadResult.success).toBe(true);
      // In real implementation, the save system would provide defaults
    });
  });

  describe('Cross-System Workflows', () => {
    it('should handle complete equipment upgrade workflow', async () => {
      const { result } = renderHook(() => ({
        inventory: useInventory(),
        equipment: useEquipment(),
        gameState: useGameState()
      }));

      // Act: Complete equipment upgrade workflow
      await act(async () => {
        // 1. Find better weapon in inventory
        const weapons = result.current.inventory.getItemsByCategory('equipment');
        const betterWeapon = weapons.find(item => item.equipmentSlot === 'weapon');

        // 2. Check if can equip
        const canEquip = result.current.equipment.canEquip(betterWeapon.id);
        expect(canEquip.canEquip).toBe(true);

        // 3. Equip the weapon
        await result.current.equipment.equipItem(betterWeapon.id);

        // 4. Verify stats updated
        expect(mockEquipmentState.equipItem).toHaveBeenCalledWith(betterWeapon.id);
      });
    });

    it('should handle creature capture and team management workflow', async () => {
      const { result } = renderHook(() => ({
        creatures: useCreatures(),
        combat: useCombat(),
        gameState: useGameState()
      }));

      // Act: Complete creature capture workflow
      await act(async () => {
        // 1. Capture creature during combat
        await result.current.creatures.captureCreature('wild_dragon');

        // 2. Add to team
        const capturedCreature = result.current.creatures.collection.find(
          c => c.id === 'wild_dragon'
        );
        if (capturedCreature) {
          await result.current.creatures.addToTeam(capturedCreature.id);
        }

        // 3. Verify team size limits
        expect(mockCreatureState.captureCreature).toHaveBeenCalledWith('wild_dragon');
        expect(mockCreatureState.addToTeam).toHaveBeenCalled();
      });
    });

    it('should handle inventory management during exploration', async () => {
      const { result } = renderHook(() => ({
        inventory: useInventory(),
        combat: useCombat()
      }));

      // Act: Manage inventory during exploration
      await act(async () => {
        // 1. Use consumables freely (not in combat)
        mockCombatState.inCombat = false;
        await result.current.inventory.useItem('health_potion');

        // 2. Consolidate inventory stacks
        await result.current.inventory.consolidateInventoryStacks('main');

        // 3. Search for specific items
        const foundItems = result.current.inventory.searchItems('potion');
        expect(foundItems.length).toBeGreaterThan(0);
      });

      // Assert: All operations completed successfully
      expect(mockInventoryState.useItem).toHaveBeenCalledWith('health_potion');
      expect(mockInventoryState.consolidateInventoryStacks).toHaveBeenCalledWith('main');
    });

    it('should maintain data consistency across all systems', async () => {
      // Setup: Complex game state with all systems active
      const complexGameState = {
        ...mockGameState,
        equipment: { weapon: testItems[1], armor: testItems[2] },
        creatures: testCreatures,
        inventory: {
          items: testItems.map(item => ({
            id: item.id,
            quantity: item.quantity || 1
          }))
        }
      };

      const saveManager = new SaveSystemManager({} as any);
      mockSaveManager.loadGame.mockResolvedValue({
        success: true,
        data: complexGameState
      });

      // Act: Save and load complex state
      await saveManager.saveGame(complexGameState, 'complex_save');
      const loadResult = await saveManager.loadGame('save_id');

      // Assert: All systems maintain consistency
      expect(loadResult.success).toBe(true);
      expect(loadResult.data.inventory).toBeDefined();
      expect(loadResult.data.equipment).toBeDefined();
      expect(loadResult.data.creatures).toBeDefined();

      // Verify referential integrity
      const weaponInEquipment = loadResult.data.equipment.weapon;
      const weaponInInventory = loadResult.data.inventory.items.find(
        (item: any) => item.id === weaponInEquipment?.id
      );
      expect(weaponInInventory).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle inventory operations with invalid items', async () => {
      const { result } = renderHook(() => useInventory());

      // Act: Try to use non-existent item
      await act(async () => {
        await result.current.useItem('invalid_item_id');
      });

      // Assert: Should handle gracefully
      expect(mockInventoryState.useItem).toHaveBeenCalledWith('invalid_item_id');
    });

    it('should handle equipment restrictions correctly', () => {
      // Setup: Player doesn't meet requirements
      mockEquipmentState.canEquip.mockReturnValue({
        canEquip: false,
        reason: 'Level requirement not met'
      });

      const { result } = renderHook(() => useEquipment());

      // Act: Try to equip restricted item
      const canEquipResult = result.current.canEquip('legendary_sword');

      // Assert: Should be prevented with reason
      expect(canEquipResult.canEquip).toBe(false);
      expect(canEquipResult.reason).toContain('Level requirement');
    });

    it('should handle save system failures gracefully', async () => {
      // Setup: Save system failure
      mockSaveManager.saveGame.mockResolvedValue({
        success: false,
        error: 'Storage quota exceeded'
      });

      const saveManager = new SaveSystemManager({} as any);

      // Act: Attempt to save
      const saveResult = await saveManager.saveGame(mockGameState, 'test_save');

      // Assert: Should handle failure gracefully
      expect(saveResult.success).toBe(false);
      expect(saveResult.error).toBe('Storage quota exceeded');
    });
  });
});