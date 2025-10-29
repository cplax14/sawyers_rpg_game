# Product Requirements Document: Creature Breeding System

## Introduction/Overview

The Creature Breeding System is a core endgame mechanic that allows players to combine two creatures from their collection to create new, potentially more powerful offspring. This system provides a strategic path to obtaining the strongest creatures needed to defeat the hardest endgame enemies. Currently, the Inventory > Creatures > Breeding menu contains only a placeholder. This PRD outlines the full implementation of a deep, engaging breeding system that rewards player experimentation and long-term planning.

**Problem Statement:** Players currently lack a strategic method to create powerful creatures for endgame content. Wild-caught creatures have limited potential, and there's no progression system for creature strength beyond initial capture.

**Goal:** Implement a breeding system that becomes the primary method for obtaining endgame-viable creatures, encouraging player retention and strategic depth.

## Goals

1. Create a breeding mechanic that allows any two creatures to produce offspring with strategic value
2. Implement a stat inheritance system that rewards breeding high-quality parents
3. Design a resource economy (gold + materials) that balances accessibility with meaningful progression
4. Establish breeding as the optimal path to endgame creature viability
5. Add generational progression mechanics (Gen 2, Gen 3, etc.) that scale creature power
6. Integrate special abilities and stat caps exclusive to bred creatures
7. Prevent breeding system abuse through escalating costs

## User Stories

1. **As a player**, I want to breed any two creatures together so that I can experiment with different combinations and discover powerful offspring.

2. **As a casual player**, I want to breed creatures using just gold so that I can participate in breeding without grinding for rare materials.

3. **As a hardcore player**, I want certain breeding combinations to require special materials so that I can work toward optimal breeding recipes and feel rewarded for resource management.

4. **As an endgame player**, I want bred creatures to have access to unique abilities and higher stat caps so that breeding becomes essential for tackling the hardest content.

5. **As a strategic player**, I want offspring to potentially inherit the best stats from both parents so that I can carefully select breeding pairs to create ideal creatures.

6. **As a collector**, I want a small chance to breed rarer creatures than my parents so that breeding feels exciting and rewarding.

7. **As a player managing my creature collection**, I want bred creatures to have an "exhausted" state after breeding so that I must manage my roster carefully and can't abuse a single powerful pair.

8. **As an endgame player**, I want each successive generation (Gen 2, Gen 3, etc.) to be progressively stronger so that I have long-term progression goals.

## Functional Requirements

### Core Breeding Mechanics

1. The system must allow any two creatures in the player's collection to breed together, regardless of species.

2. The system must support instant breeding - players select two creatures and immediately receive offspring without time delays.

3. The system must implement two resource cost tiers:
   - **Basic breeding**: Gold cost only (scaling with parent levels/rarity)
   - **Advanced breeding**: Gold + special materials from player inventory (for optimal combinations)

4. The system must define a breeding recipe database that maps creature combinations to:
   - Offspring species
   - Material requirements (for advanced combinations)
   - Bonus outcomes (e.g., guaranteed stat bonuses, ability unlocks)

5. The system must apply an "exhausted" state to parent creatures after breeding:
   - Exhausted creatures have reduced stats (e.g., -20% to all stats)
   - Exhausted creatures can still be used in combat or bred again
   - Exhaustion stacks with each breeding use
   - Players can restore exhausted creatures using consumable items or rest mechanics (to be defined)

### Offspring Generation

6. The system must determine offspring stats using a hybrid inheritance model:
   - Base stats start at 70-90% of parent average
   - Each individual stat has a 40% chance to inherit the better parent's value
   - Offspring receive bonus stats based on generation (+5% per generation, max Gen 5)

7. The system must track creature "Generation" as metadata:
   - Wild-caught creatures are Gen 0
   - Offspring of two Gen 0 parents are Gen 1
   - Offspring generation = max(parent1 gen, parent2 gen) + 1
   - Maximum generation is Gen 5

8. The system must implement a 10% chance for offspring to be one rarity tier higher than the highest parent rarity:
   - Common → Uncommon (10%)
   - Uncommon → Rare (10%)
   - Rare → Epic (10%)
   - Epic → Legendary (10%)
   - Legendary → Mythic (10%, new highest tier)

9. The system must determine offspring species using the following logic:
   - Default: 50% chance of either parent's species
   - Special combinations (defined in breeding recipes): guaranteed specific offspring
   - Example: Slime + Dragon with Dragon Scale material = Slime Dragon (rare hybrid)

### Breeding Costs & Economy

10. The system must calculate gold costs based on:
    - Base cost: 100 gold × (parent1 level + parent2 level)
    - Rarity multiplier: Common ×1, Uncommon ×2, Rare ×4, Epic ×8, Legendary ×16
    - Generation tax: ×1.5 cost per generation level of parents
    - Breeding count tax: ×1.2 per previous breeding attempt (resets daily or per session)

11. The system must track total breeding attempts per session/day and apply escalating costs to prevent spam breeding.

12. The system must validate material requirements before allowing advanced breeding:
    - Display required materials in breeding UI
    - Highlight available/missing materials
    - Consume materials from inventory upon successful breeding

### Endgame Scaling & Power

13. The system must grant bred creatures access to exclusive benefits:
    - **Higher stat caps**: Bred creatures have 10% higher max stats per generation
    - **Special abilities**: Gen 2+ creatures can unlock unique abilities unavailable to wild creatures
    - **Ability inheritance**: Offspring have a 30% chance to inherit one ability from each parent (in addition to their natural ability set)

14. The system must implement special ability unlocks:
    - Gen 2: Unlock 1 bonus ability slot
    - Gen 3: Unlock 2 bonus ability slots + passive trait slot
    - Gen 4: Unlock 3 bonus ability slots + 2 passive trait slots
    - Gen 5: Unlock 4 bonus ability slots + 3 passive trait slots + signature ultimate ability

15. The system must ensure that Gen 4 and Gen 5 creatures are viable for endgame boss encounters that would be extremely difficult with wild-caught creatures.

### User Interface

16. The breeding UI must display:
    - Two creature selection slots (drag-and-drop or click to select)
    - Current stats of selected parents
    - Predicted offspring stats (range based on inheritance rules)
    - Rarity upgrade chance (10%)
    - Gold cost (calculated dynamically)
    - Required materials (if advanced breeding combo)
    - Available materials in player inventory
    - "Exhausted" status of parent creatures with visual indicator
    - Generation information for parents and predicted offspring

17. The system must show a confirmation modal before breeding that summarizes:
    - Parents selected
    - Total cost (gold + materials)
    - Parent creatures will become exhausted (with stat reduction)
    - Predicted offspring characteristics

18. The system must display a results screen after breeding showing:
    - New offspring creature card with full stats
    - Generation level
    - Inherited abilities (if any)
    - Rarity (with visual celebration if upgraded)
    - Option to name the creature
    - Option to immediately view in creature collection

19. The breeding menu must include a "Breeding Guide" or "Recipe Book" section that:
    - Reveals special combinations as they are discovered
    - Shows material requirements for advanced recipes
    - Displays ??? for undiscovered combinations
    - Provides hints about combination effects

### Data & Persistence

20. The system must persist the following creature data:
    - Generation level (0-5)
    - Breeding count (number of times this creature has bred)
    - Exhaustion level (number of times bred)
    - Parent lineage (IDs of parent creatures, if bred)
    - Inherited abilities (array of ability IDs)

21. The system must track global breeding statistics:
    - Total creatures bred (all-time)
    - Breeding attempts this session/day
    - Highest generation creature obtained
    - Special combinations discovered

22. The system must validate save data to prevent:
    - Invalid generation values
    - Stat values exceeding generation-based caps
    - Creatures with abilities they shouldn't have access to

## Non-Goals (Out of Scope)

1. **Real-time breeding delays**: Breeding is instant; no time-based mechanics or timers.
2. **Breeding slots/limits**: Players can breed as many times as they can afford; only cost escalation limits usage.
3. **Creature consumption**: Parent creatures are never lost/consumed; they become exhausted but remain in the collection.
4. **PvP balance**: This PRD focuses on PvE endgame viability; PvP balancing is a separate concern.
5. **Creature fusion**: This is breeding/genetics only; no "fusing" or sacrificing creatures for materials.
6. **Breeding animations**: Visual polish and animations are nice-to-have but not required for v1.
7. **Social features**: No trading bred creatures, sharing recipes, or collaborative breeding in v1.
8. **Automated breeding**: Players must manually select pairs; no "auto-breed" or batch breeding.

## Design Considerations

### UI/UX Requirements

- The breeding interface should use the existing atomic design components (Card, Button, Modal)
- Drag-and-drop creature selection should feel intuitive and provide visual feedback
- The predicted offspring preview should update in real-time as parents are selected
- Material requirements should be clearly visible with icon + quantity displays
- Exhaustion state should be visually distinct (grayed out, with a debuff icon)
- Rarity upgrades should have a celebratory animation or visual effect
- The breeding results screen should feel rewarding (particle effects, stat reveals)

### Responsive Design

- The breeding UI must work on both desktop and mobile viewports
- Drag-and-drop should fall back to click/tap selection on mobile
- Long lists of creatures should use the existing `LazyVirtualizedGrid` component

### Accessibility

- All interactive elements must be keyboard navigable
- Screen reader support for creature stats and breeding outcomes
- Color-blind friendly indicators for rarity tiers and status effects

## Technical Considerations

### State Management

- Add breeding-related state to `ReactGameContext`:
  - `breedingAttempts: number` (session/day counter)
  - `discoveredRecipes: string[]` (list of recipe IDs unlocked)
  - Extend `Creature` type with: `generation`, `breedingCount`, `exhaustionLevel`, `inheritedAbilities`, `parentIds`

### Data Structures

- Create `types/breeding.ts` with:
  - `BreedingRecipe` interface (parent species IDs, materials, offspring, bonuses)
  - `BreedingResult` interface (offspring creature, success flags, messages)
  - `BreedingCost` interface (gold amount, material requirements)

### Breeding Logic

- Create `utils/breedingEngine.ts` with pure functions:
  - `calculateBreedingCost(parent1, parent2, attemptCount): BreedingCost`
  - `generateOffspring(parent1, parent2, recipe?): BreedingResult`
  - `inheritStats(parent1Stats, parent2Stats, generation): Stats`
  - `rollRarityUpgrade(parentRarity): Rarity`
  - `applyExhaustion(creature): Creature`

### Breeding Recipes

- Create `public/data/breedingRecipes.js` with:
  - Array of breeding recipe objects
  - Each recipe defines: parent combinations, required materials, guaranteed offspring, bonuses
  - Example recipes for common combinations (to be populated during implementation)

### Performance

- Use `React.memo()` for creature card components to prevent unnecessary re-renders
- Lazy-load the breeding recipe database
- Cache breeding cost calculations when parent selection doesn't change

### Integration Points

- **Inventory System**: Validate and consume materials from player inventory
- **Creature Collection**: Add/remove creatures, update exhaustion states
- **Gold Economy**: Deduct gold costs, validate sufficient funds
- **Ability System**: Grant inherited abilities to offspring, validate ability compatibility
- **Stats System**: Respect generation-based stat caps, apply exhaustion penalties

## Success Metrics

### Primary Metrics

1. **Endgame Retention**: % of players who reach endgame areas and continue playing for 7+ days (target: 40%+ increase)
2. **Breeding Engagement**: % of players who use breeding at least once (target: 70%+)
3. **Advanced Breeding Usage**: % of players who use material-based breeding (target: 30%+)
4. **Generation Progression**: Average highest generation achieved by active players (target: Gen 3+)

### Secondary Metrics

1. Time spent in breeding menu per session (target: 5+ minutes for engaged players)
2. Number of breeding attempts per player per week (target: 10+ for active players)
3. Creature collection size growth after breeding implementation (target: 20%+ increase)
4. Endgame boss clear rates using bred creatures vs. wild creatures (target: 2x higher clear rate with Gen 3+ creatures)

### Qualitative Metrics

1. Player feedback on breeding system depth and satisfaction
2. Reported instances of "accidental" powerful combinations (emergent gameplay)
3. Community sharing of breeding recipes and strategies
4. Player sentiment toward exhaustion mechanic (balance feedback)

## Resolved Design Decisions

### 1. Exhaustion Recovery
**Decision**: Multiple recovery methods (combination approach)
- **Rest mechanic**: Creatures recover exhaustion over time (implementation details TBD - real-time vs in-game time)
- **Consumable items**: Special potions/items can restore exhausted creatures (e.g., "Revitalization Potion")
- **Gold cost**: Players can pay gold to instantly remove exhaustion

### 2. Material Drop Rates
**Decision**: High drop rates to support breeding as a core mechanic
- **Common breeding materials**: 25-30% drop rate from appropriate enemies
- **Rare breeding materials**: 25-30% drop rate from specific/harder enemies
- Materials should be abundant to encourage frequent breeding experimentation

### 3. Recipe Discovery
**Decision**: Multi-path discovery system
- **Automatic reveal**: When players obtain required creatures, basic recipes are revealed automatically
- **Story progression**: Special/powerful recipes unlock through completing story milestones
- **NPC hints/guides**: Players can purchase recipe hints or guides from in-game NPCs

### 4. Mythic Rarity Balance
**Decision**: Mythic tier has significant advantages over Legendary
- **+50% stat bonus** compared to Legendary baseline
- **Unique ultimate ability** exclusive to Mythic creatures
- **Special visual effects** (particle effects, aura, enhanced animations)

### 5. Breeding Attempt Cost Escalation
**Decision**: Per-creature permanent escalation
- Escalating cost applies to **individual creatures** that have been bred before
- Each time a specific creature breeds, its personal breeding cost increases (×1.2 multiplier)
- **Unbred creatures** can be bred as much as the player wants at base cost
- No daily/session resets - escalation is permanent per creature
- This encourages players to breed diverse pairs rather than spamming one powerful combination

### 6. Initial Recipe Set
**Decision**: 10-15 common recipes + 3-5 legendary recipes for v1
- 10-15 recipes covering common/accessible creature combinations
- 3-5 "legendary" endgame recipes requiring rare creatures and special materials
- Recipes should span early, mid, and endgame progression

### 7. Ability Inheritance Conflicts
**Decision**: Player choice system
- When offspring inherit more abilities than available slots, the player chooses which abilities to keep
- Present an ability selection screen during breeding results
- Show inherited abilities, natural abilities, and let player select final ability loadout
- Respects player agency and strategic decision-making

### 8. Visual Indicators for Bred Creatures
**Decision**: Multi-layered visual system
- **Generation badge**: Display "Gen 1", "Gen 2", etc. on creature card
- **Special border color**: Bred creatures have distinct border (e.g., gold/silver gradient)
- **"Bred" icon**: Small icon indicator in corner of creature card
- Visual prominence should increase with generation level

---

**Document Version**: 1.0
**Created**: 2025-10-05
**Target Audience**: Junior Developer
**Estimated Implementation Time**: 3-4 weeks (depends on recipe content creation)
