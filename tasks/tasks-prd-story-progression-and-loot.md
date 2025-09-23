# Tasks for Story Area Progression with Loot & Spell Systems

## Relevant Files

- `data/areas.js` - Enhanced with branching unlock conditions and loot tables per area
- `data/monsters.js` - Extended with loot drop tables and rarity-based drop rates
- `data/items.js` - Expanded with new item types, rarity classifications, and spell materials
- `data/spells.js` - Already exists, needs integration with combat system and learning mechanics
- `data/characters.js` - Enhanced with spell learning progression, class-specific spell sets, and spell capacity management (COMPLETED: Task 3.3)
- `data/equipment.js` - Enhanced with rarity tiers and level scaling
- `js/gameState.js` - Extended with area progression logic and loot management
- `js/combat.js` - Enhanced with spell casting, MP management, loot generation, and spell effect processing (COMPLETED: Task 3.2)
- `js/worldMap.js` - Updated with branching path visualization and progression indicators
- `js/ui/GameWorldUI.js` - Enhanced with area progression indicators and unlock status
- `js/ui/CombatUI.js` - Extended with spell casting interface and MP display
- `js/ui/InventoryUI.js` - Enhanced with loot rarity display and equipment management
- `js/ui/StoryUI.js` - Enhanced with branching path choices and progression tracking
- `js/lootSystem.js` - New system for managing loot generation and distribution
- `js/spellSystem.js` - New system for spell learning, casting, and MP management (COMPLETED: Task 3.1)
- `js/game.js` - Updated to properly initialize SpellSystem in game startup sequence
- `index.html` - Updated script loading order to ensure SpellSystem loads before GameState
- `tests/test-runner.html` - Updated to include SpellSystem in test environment
- `tests/area_progression.test.js` - Unit tests for branching area unlock logic
- `tests/loot_system.test.js` - Unit tests for loot generation and distribution
- `tests/spell_system.test.js` - Unit tests for spell casting and learning mechanics
- `tests/integration_story_loot_spells.test.js` - Integration tests for all three systems

### Notes

- Existing spell data structure in `data/spells.js` provides good foundation for spell system integration
- Current area unlock system in `data/areas.js` needs extension for complex branching conditions
- Item rarity system needs to be implemented across existing equipment and consumables
- Combat system already exists and needs MP integration and spell action support
- UI modules follow established BaseUIModule pattern for consistency

## Tasks

- [x] 1.0 Implement Branching Story Area Progression System
  - [x] 1.1 Enhance `data/areas.js` with complex unlock conditions supporting AND/OR logic for story flags, levels, items, and boss defeats
  - [x] 1.2 Extend `GameState.checkUnlockedAreas()` to evaluate multi-criteria unlock conditions with performance optimization
  - [x] 1.3 Implement branching story path tracking in `GameState.world.storyBranches` to maintain narrative consistency
  - [x] 1.4 Create progression indicator system in `GameState` that tracks unlock requirements and completion status
  - [x] 1.5 Add area unlock notifications with detailed requirement information for player guidance
  - [x] 1.6 Update `AreaData.isAreaUnlocked()` to support complex boolean logic for unlock conditions
  - [x] 1.7 Implement story branch validation to ensure player choices maintain narrative coherence

- [x] 2.0 Create Tiered Loot Collection and Distribution System
  - [x] 2.1 Create `js/lootSystem.js` with rarity tiers (common, uncommon, rare, epic, legendary) and base drop rate calculations
  - [x] 2.2 Enhance `data/monsters.js` with monster-specific loot tables including rarity weights and level scaling
  - [x] 2.3 Add area-specific loot tables to `data/areas.js` that define region-exclusive items and materials
  - [x] 2.4 Implement level-scaled loot generation that adjusts item stats and drop rates based on player/monster levels
  - [x] 2.5 Create new item types in `data/items.js`: spell scrolls, crafting materials, and consumable enhancements
  - [x] 2.6 Extend `GameState.player.inventory` to handle loot overflow scenarios with auto-discard or choice prompts
  - [x] 2.7 Integrate loot generation into `CombatEngine.endBattle()` with performance-optimized drop calculations
  - [x] 2.8 Add rarity-based visual indicators and sorting capabilities to inventory system

- [ ] 3.0 Integrate Mana-Based Spell Casting into Combat System
  - [x] 3.1 Create `js/spellSystem.js` with MP management, spell learning tracking, and cast validation
  - [x] 3.2 Enhance `CombatEngine` with spell action processing, MP cost validation, and spell effect application
  - [x] 3.3 Extend `CharacterData` classes with spell learning progression and class-specific spell sets
  - [x] 3.4 Implement MP regeneration system with balanced recovery rates for strategic resource management
  - [x] 3.5 Add spell learning mechanics supporting level-up acquisition, loot drops, NPC purchases, and quest rewards
  - [ ] 3.6 Create spell effect system supporting damage, healing, buffs, debuffs, and utility effects with scaling calculations
  - [ ] 3.7 Integrate spell scrolls and learning materials from loot system into spell acquisition workflow
  - [ ] 3.8 Add basic monster spell casting capabilities for enhanced combat variety

- [ ] 4.0 Enhance UI Systems for Progression, Loot, and Spell Management
  - [ ] 4.1 Update `GameWorldUI.js` with area progression indicators showing unlock requirements and current progress
  - [ ] 4.2 Enhance `CombatUI.js` with spell casting interface, MP display, and spell selection menu
  - [ ] 4.3 Extend `InventoryUI.js` with loot rarity visualization, equipment comparison, and overflow management
  - [ ] 4.4 Create spell management interface in existing UI modules for learning, forgetting, and organizing spells
  - [ ] 4.5 Add story branch visualization to `StoryUI.js` showing available paths and progression choices
  - [ ] 4.6 Implement loot acquisition notifications with rarity-appropriate visual effects and sound cues
  - [ ] 4.7 Create progression summary UI showing area unlock progress, loot collection, and spell mastery
  - [ ] 4.8 Add contextual help tooltips explaining new mechanics to players

- [ ] 5.0 Create Comprehensive Testing Suite for All New Systems
  - [ ] 5.1 Create `tests/area_progression.test.js` testing complex unlock conditions, branching logic, and progression tracking
  - [ ] 5.2 Create `tests/loot_system.test.js` testing drop rate calculations, rarity distribution, and level scaling
  - [ ] 5.3 Create `tests/spell_system.test.js` testing MP management, spell learning, casting mechanics, and effect calculations
  - [ ] 5.4 Create `tests/integration_story_loot_spells.test.js` testing cross-system interactions and complete player workflows
  - [ ] 5.5 Add performance tests ensuring loot generation completes within 100ms and area unlocks within 50ms
  - [ ] 5.6 Create edge case tests for inventory overflow, invalid spell casting, and broken unlock conditions
  - [ ] 5.7 Implement automated playtest scenarios covering complete progression paths with loot and spell acquisition
  - [ ] 5.8 Add save/load compatibility tests ensuring all new data persists correctly across game sessions