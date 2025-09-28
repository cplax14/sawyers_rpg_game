# Tasks: Loot and Rewards System Enhancement

## Relevant Files

- `public/js/lootSystem.js` - Core loot generation system that needs drop rate optimization and scaling improvements
- `public/data/monsters.js` - Monster species data with loot tables requiring comprehensive rebalancing
- `public/data/areas.js` - Area exploration data needing expanded loot table coverage
- `public/data/items.js` - Item definitions that may need expansion for progression paths
- `public/data/equipment.js` - Equipment data requiring level-appropriate distribution updates
- `public/data/spells.js` - Spell data for spell scroll/book/tome generation integration
- `tests/loot_system.test.js` - Existing test coverage requiring expansion for new features
- `tests/combat_rewards.test.js` - Combat reward tests needing updates for new drop rates
- `public/js/ui/NotificationBridge.js` - Notification system for loot feedback enhancements
- `public/js/gameState.js` - Game state management for loot tracking and progression integration

### Notes

- The LootSystem.js already has a solid foundation with rarity tiers and level scaling - focus on tuning rather than rebuilding
- Monster and area data files use consistent loot table formats that can be expanded systematically
- Existing test framework provides good coverage but needs expansion for new balance requirements
- Use `npm run test:headless` to run the full test suite after changes

## Tasks

- [x] 1.0 Rebalance and Expand Monster Loot Tables
  - [x] 1.1 Audit existing monster loot tables and identify gaps in coverage across all level ranges
  - [x] 1.2 Standardize drop rates to achieve 70-85% encounter loot frequency target
  - [x] 1.3 Expand early game monster loot tables (levels 1-10) with consistent basic rewards
  - [x] 1.4 Enhance mid-game monster loot tables (levels 11-20) with equipment progression items
  - [x] 1.5 Create comprehensive late-game monster loot tables (levels 21-30+) with rare/epic focus
  - [x] 1.6 Add missing monster species loot tables using level-appropriate templates
  - [x] 1.7 Validate loot table gold ranges match level progression and economic balance

- [x] 2.0 Enhance Area Exploration Loot Systems
  - [x] 2.1 Review and expand existing area loot tables to ensure comprehensive coverage
  - [x] 2.2 Implement area-specific loot themes (forest herbs, cave minerals, etc.)
  - [x] 2.3 Add exploration type modifiers for thorough vs. quick exploration rewards
  - [x] 2.4 Balance area gold multipliers and experience bonuses across difficulty progression
  - [x] 2.5 Create loot preview system showing potential area rewards to players
  - [x] 2.6 Add rare area-exclusive items for exploration incentivization

- [x] 3.0 Optimize Drop Rate Algorithms and Level Scaling
  - [x] 3.1 Fine-tune LootSystem.calculateLevelScaling() to prevent over-farming while maintaining fairness
  - [x] 3.2 Adjust rarity distribution weights to ensure target percentages (65% common, 25% uncommon, etc.)
  - [x] 3.3 Optimize rollForLoot() algorithm to consistently hit 75%+ meaningful loot target
  - [x] 3.4 Implement diminishing returns system for repeated farming of same content
  - [x] 3.5 Add level difference penalties that scale appropriately for content progression
  - [x] 3.6 Performance test loot generation to maintain <50ms generation time requirement

- [x] 4.0 Expand Equipment and Spell Item Generation
  - [x] 4.1 Enhance resolveConcreteItemId() to support more equipment type abstractions
  - [x] 4.2 Expand equipment mapping for nature_equipment, beginner_weapons, and class-specific gear
  - [x] 4.3 Improve spell scroll/book/tome generation with proper level and class gating
  - [x] 4.4 Add equipment upgrade path logic to ensure smooth progression between level tiers
  - [x] 4.5 Create consumable item distribution that supports learning curve and strategic depth
  - [x] 4.6 Implement material drop system for future crafting system integration

- [x] 5.0 Implement Phase-Based Progression Balancing
  - [x] 5.1 Configure early game (levels 1-10) with 80%+ basic reward frequency and learning focus
  - [x] 5.2 Set up mid-game (levels 11-20) with strategic equipment variety and spell diversity
  - [x] 5.3 Design late-game (levels 21-30+) with rare/epic/legendary focus and prestige items
  - [x] 5.4 Create level-appropriate safety net mechanics for healing item availability
  - [x] 5.5 Implement build diversity support through varied equipment and spell availability
  - [x] 5.6 Add progression gate mechanics using loot requirements for area access

- [ ] 6.0 Add Quality of Life Features and Notifications
  - [ ] 6.1 Enhance NotificationBridge.js to provide clear loot acquisition feedback
  - [ ] 6.2 Implement special notifications for rare and legendary item drops
  - [ ] 6.3 Add loot summary displays after combat encounters
  - [ ] 6.4 Create collection tracking system for loot variety and achievement progress
  - [ ] 6.5 Implement loot comparison tooltips for equipment upgrade decisions
  - [ ] 6.6 Add inventory management warnings when approaching capacity during loot-heavy sessions

- [ ] 7.0 Update Test Coverage and Performance Validation
  - [ ] 7.1 Expand loot_system.test.js with comprehensive drop rate validation tests
  - [ ] 7.2 Add performance tests ensuring <50ms loot generation across all scenarios
  - [ ] 7.3 Create integration tests validating proper monster/area loot table functionality
  - [ ] 7.4 Implement statistical testing for rarity distribution accuracy over large sample sizes
  - [ ] 7.5 Add regression tests preventing future loot scarcity issues
  - [ ] 7.6 Create end-to-end tests validating complete player progression loot experience