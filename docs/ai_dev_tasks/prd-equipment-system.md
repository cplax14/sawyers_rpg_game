# Product Requirements Document: Equipment System

## Introduction/Overview

The equipment system in Sawyer's RPG Game currently has a partial implementation where players can obtain weapons, armor, and accessories from combat drops and other sources, but cannot actually equip these items to improve their character stats. The Equipment Screen exists with UI components and hooks, but the core functionality to equip items is non-functional. This PRD outlines the requirements to create a fully functional equipment system that allows players to equip items, see stat changes, and manage their equipment slots effectively.

**Problem:** Players obtain equipment items but cannot use them, making equipment drops feel unrewarding and preventing character progression through gear acquisition.

**Goal:** Implement a complete, user-friendly equipment system that allows players to equip items from their inventory, see immediate stat improvements, manage multiple equipment slots, and make informed decisions about equipment choices.

## Goals

1. Enable players to equip weapons, armor, and accessories from their inventory to improve character stats
2. Provide clear visual feedback showing stat changes when equipping/unequipping items
3. Implement multiple equipment slots (helmet, weapon, armor, shield, gloves, boots, rings, necklace, charm) for diverse character customization
4. Create an intuitive UI that allows easy comparison between equipped and unequipped items
5. Ensure equipment changes persist across save/load cycles
6. Implement level and class restrictions to create meaningful progression gates
7. Prevent equipment-related bugs such as item loss, stat calculation errors, or inventory corruption

## User Stories

### Core Functionality

**US-1:** As a player, I want to click on an equipment slot and see a list of compatible items I can equip, so that I can easily choose which item to use.

**US-2:** As a player, I want to see a side-by-side comparison of my currently equipped item vs. a new item before equipping, so that I can make informed decisions about upgrades.

**US-3:** As a player, I want to equip a weapon from my inventory and immediately see my attack stat increase in the character sheet, so that I understand the impact of my equipment.

**US-4:** As a player, I want to unequip an item and have it return to my inventory, so that I can swap equipment or free up slots.

**US-5:** As a player, I want the system to automatically unequip my old item when I equip a new one in the same slot, so that I don't have to manually manage both operations.

### Visual Feedback

**US-6:** As a player, I want to see stat changes highlighted in green (improvements) or red (downgrades) when previewing equipment changes, so that I can quickly assess the value of an item.

**US-7:** As a player, I want to see my equipped items displayed on a "paper doll" character view with clear icons for each slot, so that I can visualize my character's gear at a glance.

**US-8:** As a player, I want confirmation dialogs when replacing higher-rarity equipment with lower-rarity equipment, so that I don't accidentally downgrade my gear.

### Requirements & Restrictions

**US-9:** As a warrior, I want to be prevented from equipping wizard staffs, so that class identity is maintained and I'm guided toward appropriate gear.

**US-10:** As a level 3 player, I want to see that I cannot equip a level 8 sword, so that I understand I need to level up to use better gear.

**US-11:** As a player, I want to see clear error messages when I cannot equip an item, explaining exactly why (e.g., "Requires Level 8", "Warrior Class Only"), so that I understand the restrictions.

### Persistence & Edge Cases

**US-12:** As a player, I want my equipped items to be saved when I save my game, so that I don't lose my equipment loadout.

**US-13:** As a player, I want the system to prevent me from selling or consuming equipped items, so that I don't accidentally lose critical gear.

**US-14:** As a player, I want equipment durability to decrease with use (if implemented), and to see warnings when my equipment is about to break, so that I can repair or replace it before it becomes useless.

## Functional Requirements

### FR-1: Equipment Slot Management
The system must provide the following equipment slots:
- **Helmet** - Head armor slot
- **Necklace** - Accessory slot for necklaces
- **Armor** - Chest/body armor slot
- **Weapon** - Main hand weapon slot
- **Shield** - Off-hand shield slot (conflicts with two-handed weapons)
- **Gloves** - Hand armor slot
- **Boots** - Foot armor slot
- **Ring 1** - First ring slot
- **Ring 2** - Second ring slot
- **Charm** - Special accessory slot

Each slot must accept only compatible item types (e.g., weapons in weapon slot, helmets in helmet slot).

### FR-2: Equip Item Operation
The system must allow players to:
1. Select an equipment slot from the Equipment Screen
2. View a modal/list showing all compatible items from inventory
3. Select an item to equip
4. See a stat comparison preview before confirming
5. Confirm the equip action
6. Automatically unequip the old item (if present) and return it to inventory
7. Remove the new item from inventory and place it in the equipment slot
8. Update character stats immediately

### FR-3: Unequip Item Operation
The system must allow players to:
1. Click an unequip button on an equipped item slot
2. See a confirmation dialog
3. Confirm the unequip action
4. Remove the item from the equipment slot
5. Return the item to inventory (with inventory space validation)
6. Update character stats immediately to reflect the stat loss

### FR-4: Stat Calculation
The system must:
1. Calculate base stats from player level and class
2. Calculate equipment bonuses from all equipped items
3. Calculate final stats as: `finalStat = baseStat + equipmentBonus + levelBonus + temporaryBuffs`
4. Support the following stat modifiers:
   - **attack** - Physical attack power
   - **defense** - Physical damage reduction
   - **magicAttack** - Magical attack power
   - **magicDefense** - Magical damage reduction
   - **speed** - Turn order and evasion
   - **accuracy** - Hit chance
   - **hp** - Maximum health points (from armor/accessories)
   - **mp** - Maximum mana points (from robes/accessories)
   - **critical** - Critical hit chance (percentage)
5. Apply stat changes from equipment in real-time
6. Display both base stats and bonuses separately in UI (e.g., "50 (+15)")

### FR-5: Level Requirements
The system must:
1. Store level requirements on each equipment item (e.g., `levelRequirement: 8`)
2. Check player level against item level requirement before allowing equip
3. Display level requirements in item tooltips
4. Show a validation error message if level requirement is not met (e.g., "Requires Level 8")
5. Allow items without level requirements to be equipped by any level player

### FR-6: Class Requirements
The system must:
1. Store class requirements on each equipment item (e.g., `classRequirement: ["warrior", "knight"]`)
2. Check player class against item class requirement before allowing equip
3. Display class requirements in item tooltips
4. Show a validation error message if class requirement is not met (e.g., "Warrior or Knight Only")
5. Allow items without class requirements to be equipped by any class

### FR-7: Stat Requirement Validation
The system must:
1. Check if player meets minimum stat requirements for certain items (e.g., bow requires 8 speed, 12 accuracy)
2. Display stat requirements in item tooltips
3. Show validation error if stat requirements are not met
4. Allow equipping once stat requirements are satisfied (through leveling or other equipment)

### FR-8: Equipment Comparison
The system must provide:
1. A comparison view showing current equipped item vs. new item
2. Stat-by-stat differences (e.g., "+5 attack", "-2 defense")
3. Net improvement score (sum of all stat changes)
4. Visual highlighting: green for improvements, red for downgrades
5. Overall recommendation indicator (upgrade/downgrade/sidegrade)

### FR-9: Confirmation Dialogs
The system must show confirmation dialogs in these scenarios:
1. **Equipping over an existing item** - Show current vs. new item comparison
2. **Equipping a downgrade** - Warn if new item has lower net stats than current
3. **Unequipping an item** - Confirm removal of equipped item

### FR-10: Inventory Integration
The system must:
1. Mark equipped items with an "equipped" flag in inventory
2. Prevent selling, consuming, or dropping equipped items
3. Show equipped items with a distinct visual indicator in inventory UI
4. Filter equipped items from general inventory lists (with option to show them)
5. Validate inventory space before allowing unequip (ensure room for returned item)

### FR-11: Save/Load Persistence
The system must:
1. Save equipped items as part of player save data
2. Save equipment slots as a JSON object mapping slots to item IDs
3. Restore equipped items when loading a save
4. Validate that equipped items exist in the items database on load
5. Handle missing items gracefully (e.g., if item was removed in an update)

### FR-12: Equipment Durability (Optional Enhancement)
If durability is implemented, the system must:
1. Track durability value for each equipped item (e.g., 100/100)
2. Decrease durability after combat or with use
3. Show durability warnings at 25% and 10%
4. Prevent item from functioning when durability reaches 0
5. Allow repair using repair kits or at vendors

### FR-13: Equipped Item Protection
The system must:
1. Prevent selling equipped items (show error: "Cannot sell equipped items")
2. Prevent consuming equipped items (show error: "Cannot use equipped items")
3. Prevent dropping equipped items (show error: "Must unequip item first")
4. Show confirmation if player tries to destroy equipped item

### FR-14: Equipment Slot Conflicts
The system must:
1. Handle two-handed weapons occupying both weapon and shield slots
2. Automatically unequip shield when equipping a two-handed weapon
3. Prevent equipping shield if two-handed weapon is equipped
4. Show warning messages for slot conflicts

### FR-15: Stat Display
The system must display:
1. Base stats (from level and class)
2. Equipment bonuses (total from all equipped items)
3. Final stats (base + equipment + other bonuses)
4. Stat breakdown on hover/click showing each equipped item's contribution
5. Updated stats in real-time as equipment changes

## Non-Goals (Out of Scope)

1. **Equipment sets with set bonuses** - Not implementing set bonuses in the initial version (can be added later)
2. **Equipment enchantment/upgrade system** - Not implementing equipment enhancement in this phase
3. **Socket/gem system** - Not implementing socketing gems into equipment
4. **Transmogrification/appearance customization** - Equipment appearance is tied to stats, no cosmetic-only system
5. **Equipment trading between players** - Single-player game, no trading needed
6. **Equipment crafting** - Crafting system is out of scope for this equipment implementation
7. **Visual character model changes** - Equipped items don't change the character sprite/model
8. **Equipment animations** - Basic equip/unequip without complex animations

## Design Considerations

### UI/UX Design

1. **Equipment Screen Layout:**
   - Center: Paper doll character silhouette with equipment slot overlays
   - Left/Right: Character stats panel showing base/equipment/final stats
   - Equipment slots positioned anatomically on paper doll (helmet at top, boots at bottom, etc.)

2. **Equipment Selection Modal:**
   - Title: "Select [Slot Name]" (e.g., "Select Weapon")
   - List of compatible items sorted by stat improvement potential
   - Each item shows: Icon, Name, Rarity color, Stat bonuses
   - Highlight currently equipped item
   - Show locked/unusable items grayed out with reason tooltip

3. **Stat Comparison View:**
   - Two-column layout: "Current" vs. "New"
   - Item name, icon, rarity at top
   - Stat-by-stat comparison with diff arrows (↑↓)
   - Color coding: Green for improvements, Red for downgrades, White for no change
   - Net change summary at bottom

4. **Confirmation Dialog:**
   - Clear title: "Equip [Item Name]?" or "Replace Equipment?"
   - Stat comparison preview
   - Two buttons: "Equip" (primary) and "Cancel" (secondary)
   - Show upgrade/downgrade indicator

5. **Equipment Slot States:**
   - **Empty:** Dashed border, slot name label, "Click to equip" tooltip
   - **Equipped:** Solid border, item icon/abbreviation, item name tooltip, small 'X' unequip button
   - **Selected:** Highlighted border in accent color
   - **Incompatible:** Grayed out with reason shown

6. **Responsive Design:**
   - Desktop: Side-by-side layout with large paper doll
   - Tablet: Stacked layout with medium paper doll
   - Mobile: Vertical layout with simplified slot grid instead of paper doll

### Component Architecture

**Existing Components to Use:**
- `EquipmentScreen.tsx` - Main screen (needs functionality wiring)
- `useEquipment.ts` - Equipment hook (needs bug fixes)
- `EquipmentSelectionModal.tsx` - Item selection modal
- `StatComparison.tsx` - Stat comparison component
- `ConfirmationDialog.tsx` - Confirmation prompts

**Components to Create:**
- `EquipmentSlotTooltip.tsx` - Enhanced tooltip for equipment slots
- `EquipmentValidationMessage.tsx` - Error/warning messages for restrictions

**Data Flow:**
1. `EquipmentScreen` → `useEquipment` hook → `ReactGameContext`
2. Player clicks slot → Show `EquipmentSelectionModal`
3. Player selects item → Show `ConfirmationDialog` with `StatComparison`
4. Player confirms → Call `equipItem()` → Update game state → Refresh UI

## Technical Considerations

### State Management

1. **Equipment State Location:** Store equipped items in `ReactGameContext` under `player.equipment` object
2. **Equipment State Shape:**
   ```typescript
   equipment: {
     helmet: EnhancedItem | null,
     necklace: EnhancedItem | null,
     armor: EnhancedItem | null,
     weapon: EnhancedItem | null,
     shield: EnhancedItem | null,
     gloves: EnhancedItem | null,
     boots: EnhancedItem | null,
     ring1: EnhancedItem | null,
     ring2: EnhancedItem | null,
     charm: EnhancedItem | null
   }
   ```

3. **Action Types Needed:**
   - `EQUIP_ITEM` - Equip an item to a slot
   - `UNEQUIP_ITEM` - Remove an item from a slot
   - `UPDATE_PLAYER_STATS` - Recalculate stats after equipment change

### Integration Points

1. **Inventory System:** Must mark items as equipped and prevent operations on equipped items
2. **Combat System:** Must use final calculated stats (including equipment) for combat calculations
3. **Save System:** Must include equipment state in save data serialization
4. **Item Drop System:** New items must be added to inventory, not auto-equipped

### Known Bugs to Fix

Based on code review, these issues exist in `useEquipment.ts`:
1. **Line 344-426:** `equipItem` function references `item` parameter but expects `itemId` - needs to accept item ID and fetch item
2. **Line 373:** Compatibility check uses wrong variable reference
3. **Line 400-404:** Game state dispatch for `EQUIP_ITEM` may not exist in reducer
4. **Line 541-547:** `useEffect` dependency array issue causing infinite loops
5. **Line 604-606:** `baseStats` calculation recreated on every render (should be memoized)

### Data Schema Updates

**Items Data (`public/data/items.js`):**
Items already have most required fields, but ensure consistency:
- `type` - weapon/armor/accessory
- `rarity` - common/uncommon/rare/epic/legendary
- `stats` - Object with stat modifiers
- `requirements` - Object with classes, level, story flags
- `equipmentSlot` - Add this field to map item to specific slot
- `equipmentSubtype` - Add for more granular slot matching

**Example Item:**
```javascript
iron_sword: {
  name: "Iron Sword",
  type: "weapon",
  equipmentSlot: "weapon",
  equipmentSubtype: "sword",
  rarity: "common",
  stats: { attack: 15, accuracy: 85 },
  requirements: { classes: ["knight", "paladin"] },
  value: 250
}
```

### Performance Optimizations

1. **Memoization:** Use `useMemo` for stat calculations to prevent recalculation on every render
2. **Equipment Slot Caching:** Cache available items for each slot to reduce filtering operations
3. **Debounced Stat Updates:** If stat recalculation is expensive, debounce updates when rapidly equipping/unequipping

### Error Handling

1. **Missing Item Data:** If equipped item ID doesn't exist in items database, log error and set slot to null
2. **Inventory Full on Unequip:** Show error message and prevent unequip if inventory is full
3. **Save Corruption:** Validate equipment state on load, remove invalid items, log warning
4. **Stat Calculation Errors:** Fallback to base stats if equipment stat calculation fails

## Success Metrics

The equipment system will be considered successfully implemented when:

1. ✅ **Equipping Works:** Players can equip items from inventory to all equipment slots
2. ✅ **Stats Update Correctly:** Character stats update immediately and accurately when equipment changes
3. ✅ **Persistence Works:** Equipped items save and load correctly without loss or corruption
4. ✅ **UI is Clear:** Equipment Screen clearly shows what's equipped and stat bonuses gained
5. ✅ **Comparison is Helpful:** Players can easily compare and swap equipment with clear stat previews
6. ✅ **Restrictions Enforce:** Level, class, and stat requirements prevent invalid equips with clear error messages
7. ✅ **No Item Loss:** Equipment changes never result in items disappearing or inventory corruption
8. ✅ **Edge Cases Handled:** Selling equipped items is prevented, inventory full is handled, slot conflicts work correctly

### Testing Checklist

**Unit Tests:**
- [ ] `equipItem()` successfully equips valid items
- [ ] `equipItem()` rejects items that don't meet level requirements
- [ ] `equipItem()` rejects items that don't meet class requirements
- [ ] `equipItem()` returns old item to inventory
- [ ] `unequipItem()` successfully unequips items
- [ ] `unequipItem()` returns item to inventory
- [ ] `calculateFinalStats()` correctly sums base + equipment stats
- [ ] `checkCompatibility()` validates all restriction types
- [ ] `compareEquipment()` calculates correct stat differences

**Integration Tests:**
- [ ] Equipping an item updates inventory state correctly
- [ ] Equipped items persist through save/load cycle
- [ ] Stat changes from equipment affect combat calculations
- [ ] Equipped items cannot be sold
- [ ] Equipped items cannot be consumed
- [ ] Full inventory prevents unequip operation

**Manual QA Tests:**
- [ ] Equip item from empty slot - verify stats increase
- [ ] Equip item to replace existing item - verify old item returns to inventory
- [ ] Unequip item - verify stats decrease and item returns to inventory
- [ ] Try to equip item below level requirement - verify error message
- [ ] Try to equip class-restricted item as wrong class - verify error message
- [ ] Equip multiple items - verify all bonuses stack correctly
- [ ] Save game with equipped items - reload and verify items still equipped
- [ ] Try to sell equipped item - verify blocked with error
- [ ] Equip/unequip with full inventory - verify graceful handling

## Open Questions

1. **Equipment Appearance:** Should equipped items change the character's visual appearance on the world map or in combat? (Leaning toward NO for initial implementation)

2. **Auto-Equip on Pickup:** Should the game auto-equip items if they're strictly better and the slot is empty? (Leaning toward NO - explicit player choice)

3. **Quick Swap Feature:** Should there be a "quick swap" feature to change equipment loadouts during combat? (Out of scope for initial implementation)

4. **Durability System Priority:** Is equipment durability a must-have or nice-to-have feature? (Nice-to-have - can be added in future iteration)

5. **Equipment Recommendations:** Should the system proactively suggest better equipment in inventory? (YES - already partially implemented in `useEquipment.ts`)

6. **Multiple Equipment Sets:** Should players be able to save and swap between equipment loadouts (e.g., "Combat Set" vs. "Exploration Set")? (Out of scope for now)

7. **Legacy Item Compatibility:** How should we handle items from old save files if the equipment system changes? (Add migration logic in save loader)

8. **Stat Cap System:** Should there be maximum stat values that equipment cannot exceed? (Not initially - can add if balance issues arise)

---

**Document Version:** 1.0
**Created:** 2025-10-06
**Author:** Claude Code Assistant
**Status:** Ready for Implementation
