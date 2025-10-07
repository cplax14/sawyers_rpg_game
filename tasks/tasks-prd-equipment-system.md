# Equipment System Implementation Tasks

Generated from: `docs/ai_dev_tasks/prd-equipment-system.md`

## Relevant Files

- `src/contexts/ReactGameContext.tsx` - Contains Equipment interface that needs expansion to support all 10 slots
- `src/types/inventory.ts` - Contains EquipmentSlot, EquipmentSet, and other equipment types
- `src/hooks/useEquipment.ts` - Main equipment management hook with bugs to fix
- `src/hooks/useEquipment.test.ts` - Unit tests for equipment hook
- `src/hooks/useEquipmentValidation.ts` - Equipment validation logic
- `src/hooks/useInventory.ts` - Inventory management that needs integration with equipment
- `src/components/organisms/EquipmentScreen.tsx` - Main equipment UI component
- `src/components/molecules/EquipmentSelectionModal.tsx` - Item selection modal
- `src/components/molecules/StatComparison.tsx` - Stat comparison component
- `src/components/molecules/ConfirmationDialog.tsx` - Confirmation dialogs
- `src/utils/equipmentUtils.ts` - Equipment utility functions
- `src/utils/equipmentUtils.test.ts` - Unit tests for equipment utilities
- `public/data/items.js` - Item data that needs equipmentSlot field added
- `src/__tests__/integration/equipmentSystemIntegration.test.ts` - Integration tests for equipment system

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `useEquipment.tsx` and `useEquipment.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Tasks

- [x] 1.0 Update Equipment Data Model and Types
  - [x] 1.1 Update `Equipment` interface in `src/contexts/ReactGameContext.tsx` to include all 10 slots (helmet, necklace, armor, weapon, shield, gloves, boots, ring1, ring2, charm)
  - [x] 1.2 Verify `EquipmentSlot` type in `src/types/inventory.ts` includes all 10 slots
  - [x] 1.3 Add `equipmentSlot` field to all equipment items in `public/data/items.js` (weapons, armor, accessories)
  - [x] 1.4 Add `equipmentSubtype` field to items for granular slot matching (e.g., "sword", "helmet", "ring")
  - [x] 1.5 Add `statModifiers` field to items as `Partial<PlayerStats>` for stat bonuses
  - [x] 1.6 Update item type definitions to ensure compatibility with EnhancedItem interface
  - [x] 1.7 Create migration utility to validate and update legacy item data if needed

- [x] 2.0 Fix and Enhance useEquipment Hook Core Functionality
  - [x] 2.1 Fix `equipItem` function (line 344-426) to accept `itemId: string` and `slot: EquipmentSlot` parameters instead of `item: EnhancedItem`
  - [x] 2.2 Add item lookup by ID at the start of `equipItem` to fetch the full item object
  - [x] 2.3 Fix compatibility check on line 373 to use correct variable references
  - [x] 2.4 Fix infinite loop in `useEffect` on lines 541-547 by properly memoizing dependencies
  - [x] 2.5 Memoize `baseStats` calculation (lines 604-606) using `useMemo` to prevent recreation on every render
  - [x] 2.6 Update `equipItem` to handle automatic unequipping of old item in the same slot
  - [x] 2.7 Implement proper inventory space validation before unequipping items (10,000 item capacity limit)
  - [x] 2.8 Add error handling and return proper `EquipItemResult` with success/error states
  - [x] 2.9 Ensure `calculateFinalStats` properly combines base stats + equipment bonuses + level bonuses
  - [x] 2.10 Fix `compareEquipment` function to correctly calculate stat differences and net scores

- [x] 3.0 Implement Equipment State in ReactGameContext
  - [x] 3.1 Add `EQUIP_ITEM` action to the game state reducer
  - [x] 3.2 Add `UNEQUIP_ITEM` action to the game state reducer
  - [x] 3.3 Add `UPDATE_PLAYER_STATS` action to recalculate stats when equipment changes
  - [x] 3.4 VERIFIED: Inventory integration already complete in useEquipment hook (equipItem handles all inventory operations)
  - [x] 3.5 VERIFIED: Unequip inventory integration already complete in useEquipment hook (unequipItem handles: inventory space validation, addItem call, equipment state update, stat calculation)
  - [x] 3.6 VERIFIED: Automatic stat recalculation working correctly via useEffect hooks (lines 737-763 in useEquipment.ts)
  - [x] 3.7 Add validation in reducer to prevent invalid equipment operations (e.g., equipping to wrong slot type)
  - [x] 3.8 VERIFIED: Equipment initialization complete in CREATE_PLAYER action (lines 487-501) - all 10 slots initialized to null, mock data also correct
  - [x] 3.9 Export equipment-related action creators from ReactGameContext

- [x] 4.0 Integrate Equipment with Inventory System
  - [x] 4.1 Update `useInventory` hook to mark equipped items with `equipped: true` flag
  - [x] 4.2 Add filter in `getFilteredItems` to exclude equipped items by default (with option to include)
  - [x] 4.3 Update inventory UI to show visual indicator (icon/badge) for equipped items
  - [x] 4.4 Prevent `removeItem` from removing equipped items (throw error or return false)
  - [x] 4.5 Update `addItem` to properly handle items being added back when unequipped
  - [x] 4.6 Ensure inventory capacity checks account for equipped items vs. bag items
  - [x] 4.7 Add `isItemEquipped(itemId: string): boolean` utility function to inventory hook
  - [x] 4.8 Update item stack logic to handle equipped items separately from inventory stacks

- [ ] 5.0 Build Equipment Validation System
  - [x] 5.1 Enhance `useEquipmentValidation` hook to check level requirements
  - [x] 5.2 Add class requirement validation (check player class against item's `classRequirement` array)
  - [x] 5.3 Add stat requirement validation (check player stats against item's stat requirements)
  - [x] 5.4 Implement slot compatibility check (ensure item's `equipmentSlot` matches target slot)
  - [x] 5.5 Add equipment subtype validation (e.g., rings can only go in ring slots) - COMPLETE: Handled by Task 5.4 slot compatibility check. Ring subtype validation already works (rings go in ring1/ring2). System ready for future subtype extensions.
  - [ ] 5.6 Create `getRestrictionMessage` function to return user-friendly error messages for each restriction type
  - [ ] 5.7 Add two-handed weapon slot conflict detection (two-handed weapons use weapon + shield slots)
  - [ ] 5.8 Return comprehensive `EquipmentCompatibility` result with reasons, warnings, and suggestions
  - [ ] 5.9 Add validation for durability (if item durability is 0, cannot equip)
  - [ ] 5.10 Create validation result cache to improve performance for repeated checks

- [ ] 6.0 Create Equipment UI Components and Interactions
  - [ ] 6.1 Update `EquipmentScreen.tsx` to wire up `handleSlotClick` to open selection modal correctly
  - [ ] 6.2 Fix `handleItemSelected` to properly validate and trigger equip confirmation
  - [ ] 6.3 Update `handleConfirmEquip` to call `equipItem` from useEquipment hook
  - [ ] 6.4 Update `handleConfirmUnequip` to call `unequipItem` from useEquipment hook
  - [ ] 6.5 Fix stat display to show base stats, equipment bonuses, and final stats separately
  - [ ] 6.6 Update `EquipmentSelectionModal` to show validation errors for incompatible items
  - [ ] 6.7 Add visual highlighting in modal: green border for upgrades, red for downgrades, gray for locked items
  - [ ] 6.8 Update `StatComparison` component to show stat changes with green (+) and red (-) indicators
  - [ ] 6.9 Add loading states during equip/unequip operations to prevent double-clicks
  - [ ] 6.10 Add success/error toast notifications after equip/unequip operations
  - [ ] 6.11 Ensure equipment slots on paper doll show correct icons and tooltips
  - [ ] 6.12 Add "unequip" button (X) overlay on equipped item slots
  - [ ] 6.13 Implement responsive layout for mobile/tablet (grid view instead of paper doll)

- [ ] 7.0 Implement Save/Load Persistence for Equipment
  - [ ] 7.1 Update save data serialization to include `player.equipment` object with all 10 slots
  - [ ] 7.2 Ensure equipment is saved as item IDs, not full item objects (to prevent data duplication)
  - [ ] 7.3 Update load data deserialization to restore equipment from item IDs
  - [ ] 7.4 Add validation on load: check if equipped item IDs exist in items database
  - [ ] 7.5 Handle missing items gracefully (if item was removed in update, set slot to null and log warning)
  - [ ] 7.6 Add migration logic for old saves that don't have expanded equipment slots
  - [ ] 7.7 Test save/load with all equipment slots filled
  - [ ] 7.8 Test save/load with partial equipment (some slots empty)
  - [ ] 7.9 Verify auto-save includes equipment changes
  - [ ] 7.10 Add equipment version number to save data for future migrations

- [ ] 8.0 Add Equipment Protection and Edge Case Handling
  - [ ] 8.1 Prevent selling equipped items in shop/vendor UI (check `isItemEquipped` before allowing sale)
  - [ ] 8.2 Prevent consuming equipped items (add check in item use handler)
  - [ ] 8.3 Prevent dropping equipped items (add check in drop item handler)
  - [ ] 8.4 Add confirmation dialog when trying to destroy equipped items ("Must unequip first")
  - [ ] 8.5 Handle inventory full when unequipping (show error: "Inventory full, cannot unequip")
  - [ ] 8.6 Add durability decrease on combat (if durability system is implemented)
  - [ ] 8.7 Show durability warnings at 25% and 10% remaining
  - [ ] 8.8 Prevent equipped items with 0 durability from providing stat bonuses
  - [ ] 8.9 Handle slot conflicts: auto-unequip shield when equipping two-handed weapon
  - [ ] 8.10 Add weight limit validation (check total equipment weight vs. class weight limit)

- [ ] 9.0 Write Comprehensive Tests
  - [ ] 9.1 Unit test: `equipItem` successfully equips valid items (`src/hooks/useEquipment.test.ts`)
  - [ ] 9.2 Unit test: `equipItem` rejects items below level requirement
  - [ ] 9.3 Unit test: `equipItem` rejects items with wrong class requirement
  - [ ] 9.4 Unit test: `equipItem` returns old item to inventory when replacing
  - [ ] 9.5 Unit test: `unequipItem` successfully unequips and returns to inventory
  - [ ] 9.6 Unit test: `calculateFinalStats` correctly sums base + equipment stats
  - [ ] 9.7 Unit test: `checkCompatibility` validates all restriction types
  - [ ] 9.8 Unit test: `compareEquipment` calculates correct stat differences
  - [ ] 9.9 Unit test: Equipment state reducer handles EQUIP_ITEM action correctly
  - [ ] 9.10 Unit test: Equipment state reducer handles UNEQUIP_ITEM action correctly
  - [ ] 9.11 Integration test: Equipping item updates inventory state correctly
  - [ ] 9.12 Integration test: Equipped items persist through save/load cycle
  - [ ] 9.13 Integration test: Stat changes from equipment affect combat calculations
  - [ ] 9.14 Integration test: Equipped items cannot be sold
  - [ ] 9.15 Integration test: Equipped items cannot be consumed
  - [ ] 9.16 Integration test: Full inventory prevents unequip operation
  - [ ] 9.17 Run all tests and ensure 100% pass rate: `npx jest`

- [ ] 10.0 Manual QA and Bug Fixes
  - [ ] 10.1 Manual test: Equip item from empty slot - verify stats increase in character sheet
  - [ ] 10.2 Manual test: Equip item to replace existing item - verify old item returns to inventory
  - [ ] 10.3 Manual test: Unequip item - verify stats decrease and item returns to inventory
  - [ ] 10.4 Manual test: Try to equip item below level requirement - verify error message shows
  - [ ] 10.5 Manual test: Try to equip class-restricted item as wrong class - verify error message
  - [ ] 10.6 Manual test: Equip multiple items in different slots - verify all bonuses stack correctly
  - [ ] 10.7 Manual test: Save game with equipped items - reload and verify items still equipped
  - [ ] 10.8 Manual test: Try to sell equipped item - verify blocked with error message
  - [ ] 10.9 Manual test: Equip/unequip with full inventory - verify graceful error handling
  - [ ] 10.10 Manual test: Equip item and enter combat - verify equipment stats apply to combat
  - [ ] 10.11 Manual test: Compare equipment in selection modal - verify stat comparison is accurate
  - [ ] 10.12 Manual test: Responsive design on mobile - verify equipment screen works on small screen
  - [ ] 10.13 Fix any bugs discovered during manual testing
  - [ ] 10.14 Verify all PRD success metrics are met
  - [ ] 10.15 Create demo video or screenshots showing equipment system working
