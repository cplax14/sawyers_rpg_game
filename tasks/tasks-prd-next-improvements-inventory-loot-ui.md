# Tasks for Inventory/Equipment Loop and Loot/UI Improvements

## Relevant Files

- `js/lootSystem.js` - Area/monster loot generation; add resolver for abstract equipment types (e.g., `nature_equipment`).
- `data/items.js` - Item and equipment definitions; ensure beginner gear items exist and have proper types/rarities.
- `data/equipment.js` - Equipment stats and rarity tiers; used for concrete gear definitions and scaling.
- `js/gameState.js` - Player EXP, level, inventory, and equip/unequip logic; UI-facing helpers (`equipItem`, `unequipItem`).
- `js/ui/InventoryUI.js` - Inventory & Equipment screens; render items/materials/equipment lists; handle equip/unequip; update EXP and stats.
- `js/ui/CombatUI.js` - Victory handling; ensure a single transition to post-battle scenes.
- `js/ui/GameWorldUI.js` - Post-battle navigation; verify we don’t double-trigger transitions to Inventory.
- `js/ui/NotificationBridge.js` - Player-facing toasts for loot, level-ups, and spell-learn messages.
- `js/ui/UIHelpers.js` - Common UI utilities; optional: save indicator, notifications, and reusable UI patterns.
- `css/components.css` - Grid/typography styles for items/materials/equipment lists; EXP bar styling.
- `css/styles.css` - Base screen visibility rules (`.screen` vs `.screen.active`) and general theme adjustments.
- `tests/core_systems_integration.test.js` - Integration hooks for EXP/loot flows; extend with assertions.
- `tests/loot_system.test.js` - Loot distribution unit tests; add coverage for equipment resolver and rarity.

### Notes

- Keep the Inventory/Equipment loop coherent: loot → inventory → equipment → updated stats.
- Favor readable UI even when `ItemData` is incomplete: show generic entries and names as fallbacks.
- Ensure scene transitions are single-fired to avoid flicker and duplicate logs.
- Add tests for loot grant → UI render, and EXP progression to avoid regressions.

## Tasks

- [ ] 1.0 Implement equipment type resolver in `lootSystem.js`
  - [x] 1.1 Add a resolver for abstract types like `nature_equipment` that maps area/rarity → concrete item IDs.
  - [x] 1.2 Update area loot generation to call the resolver and handle failures gracefully (fallback to simple material drop if needed).
  - [x] 1.3 Add logs/warnings with actionable messages when unknown types are encountered.
  - [ ] 1.4 Add unit tests to validate resolver outputs and rarity distribution.

- [ ] 2.0 Populate Available Equipment and enable equip/unequip in `InventoryUI`
  - [x] 2.1 Filter inventory to equipment types (`weapon`, `armor`, `accessory`) and render into `#equipment-list`.
  - [x] 2.2 Click-to-equip: call `GameState.equipItem(itemId)`; confirm slot rules, class/level gating via `ItemData.canPlayerUseItem`.
  - [x] 2.3 Click-to-unequip: allow unequip by clicking `equipment-slot` rows; return gear to inventory.
  - [x] 2.4 Refresh `Current Stats`, `Equipped` panel, and headers after equip/unequip; autosave.
  - [x] 2.5 Add minimal compare tooltip: show stat deltas on hover before equipping.

- [x] 3.0 Ensure Equipment tab stats are always populated
  - [x] 3.1 On Equipment tab show, call `GameState.recalcPlayerStats()` and use `CharacterData.getStatsAtLevel(class, level)` when available.
  - [x] 3.2 Populate `#stat-*` fields and sync MP (hp/mp/atk/def/mag atk/mag def/speed/accuracy).
  - [x] 3.3 Add graceful fallback values and ensure numbers are visible with theme contrast.

- [ ] 4.0 Enhance EXP feedback and level-up experience
  - [x] 4.1 Show "+EXP" toast on victory and a level-up toast when `levelUp()` triggers.
  - [ ] 4.2 Optional modal: display stat gains and newly learned spells.
  - [x] 4.3 Ensure `InventoryUI.updateExperienceDisplay()` is called on Equipment tab open.

- [ ] 5.0 Improve Materials tab categorization and icons
  - [ ] 5.1 Add subtype icon mapping (e.g., herbs 🌿, wood 🌲, crystals 💎) and display next to names.
  - [ ] 5.2 Keep unknown entries visible with a generic icon and raw ID → Pretty Name.
  - [ ] 5.3 Add simple filters for subtypes (herb/wood/crystal/scroll) and wire buttons.

- [x] 6.0 Eliminate duplicate scene transitions after battle
  - [x] 6.1 Audit where `ui.showScene('inventory')` is called; ensure a single orchestrator (likely Combat → World → Inventory).
  - [x] 6.2 Add guard in `SceneManager.showScene()` or calling sites to avoid re-entrant switches.
  - [ ] 6.3 Reduce log noise by consolidating "Starting transition"/"Switched to scene" messages.

- [ ] 7.0 Refine Items/Materials grid CSS
  - [ ] 7.1 Apply consistent grid columns and spacing in `.items-grid` / `.materials-grid`.
  - [ ] 7.2 Improve text contrast and card backgrounds for readability with the current theme.
  - [ ] 7.3 Remove temporary debug borders once content is legible.

- [ ] 8.0 Save UX polish
  - [ ] 8.1 Add a small “Saved” pulse near the header when `SaveSystem.autoSave()` completes.
  - [ ] 8.2 Provide manual Save/Load buttons in Settings with clear feedback and error handling.

- [ ] 9.0 Add tests for loot → UI render and EXP progression
  - [ ] 9.1 Extend `tests/core_systems_integration.test.js` to verify EXP increases and Inventory UI reflects item additions.
  - [ ] 9.2 Add `tests/loot_system.test.js` cases for equipment resolver and rarity weighting.
  - [ ] 9.3 Add a playtest scenario that simulates multiple battles, verifies drops, and checks that Equipment UI updates after equipping.
