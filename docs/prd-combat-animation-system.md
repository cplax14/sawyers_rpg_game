# Product Requirements Document: Combat Animation System

## Introduction/Overview

### Problem Statement
Currently, the RPG game has only one combat animation (Magic Bolt) implemented. All other attacks in the game (49+ unique attack types including weapons, spells, abilities, and enemy attacks) lack visual feedback, making combat feel static and unengaging. Players cannot visually distinguish between different attack types, reducing combat clarity and overall game enjoyment.

### Solution
Implement a comprehensive, modular combat animation system that provides unique visual feedback for every attack type in the game. The system will be built on the existing Magic Bolt animation foundation, extending it with reusable components and a data-driven architecture that makes adding new animations efficient for developers.

### Goal
Create a complete combat animation system that makes every attack feel visually distinct, impactful, and exciting while maintaining 60fps performance on desktop browsers. The initial phase will focus on the Wizard class to establish the animation patterns, with subsequent phases covering all remaining classes and enemy attacks.

---

## Goals

### Primary Goals
1. **Visual Distinction**: Every attack type must have a unique, recognizable animation that clearly communicates what action is occurring
2. **Combat Engagement**: Animations should make combat feel more exciting and fun to play through visual impact and polish
3. **Performance**: Maintain consistent 60fps on desktop browsers (Chrome, Firefox, Safari) during all combat animations
4. **Developer Velocity**: Create a modular architecture that makes adding new animations quick and straightforward for developers
5. **Scalability**: Build a system that can eventually support all 49+ attack types across all character classes and enemies

### Secondary Goals
6. **Animation Consistency**: Establish clear design principles and timing patterns for visual cohesion
7. **Graceful Degradation**: Ensure animations fail gracefully in production while providing helpful errors in development
8. **Comprehensive Documentation**: Provide full documentation of animation design principles, timing guides, and implementation instructions

---

## User Stories

### Player Experience
1. **As a player**, I want to see visually distinct animations for each spell I cast, so that I can immediately recognize which ability I'm using without reading text
2. **As a player**, I want combat animations to feel impactful and exciting, so that battles are engaging and satisfying to play
3. **As a player**, I want animations to be fast and smooth, so that combat doesn't feel sluggish or interrupted by visual effects
4. **As a player**, I want to clearly see what attacks enemies are using, so that I can strategically respond to different threat types
5. **As a player**, I want elemental magic to have visually appropriate effects (fire looks like fire, ice looks like ice), so that the game world feels consistent and immersive

### Developer Experience
6. **As a developer**, I want a modular animation component library, so that I can build new attack animations by composing existing pieces
7. **As a developer**, I want clear documentation on animation design principles, so that I can create animations that match the established visual style
8. **As a developer**, I want an animation registry system, so that I can map attack types to animations without modifying combat logic
9. **As a developer**, I want reusable core components (particles, projectiles, impacts), so that I don't have to rebuild common effects from scratch

---

## Functional Requirements

### Phase 1: Core Animation Infrastructure (Wizard Class Focus)
1. **FR1.1**: The system must provide reusable core animation components:
   - `MeleeSlash.tsx` - Weapon trail effects for melee attacks
   - `AreaEffect.tsx` - Circular/spreading area-of-effect visualizations
   - `StatusOverlay.tsx` - Persistent status effect visual overlays
   - `BuffAura.tsx` - Character buff/debuff aura effects
   - `ParticleSystem.tsx` - Enhanced particle generation system

2. **FR1.2**: The system must extend the existing `types.ts` with comprehensive interfaces for all animation types including projectile, melee, AOE, breath, buff, debuff, and special animations

3. **FR1.3**: The system must implement orchestrator components that combine core components into complete attack sequences:
   - `MeleeAttackAnimation.tsx` - Orchestrates melee weapon attacks
   - `RangedAttackAnimation.tsx` - Orchestrates bow/thrown weapon attacks
   - `AoeAttackAnimation.tsx` - Orchestrates area-of-effect attacks
   - `BuffAnimation.tsx` - Orchestrates buff/enhancement effects
   - `DebuffAnimation.tsx` - Orchestrates status affliction effects

### Phase 2: Wizard Class Spell Animations
4. **FR2.1**: The system must implement complete animations for all Wizard class spells:
   - **Magic Bolt** (✅ Already implemented) - Arcane projectile
   - **Fireball** - Fire projectile with explosion impact
   - **Ice Shard** - Frozen projectile with shatter effect
   - **Lightning Bolt** - Electric strike from sky to target
   - **Meteor** - AOE meteors falling from sky
   - **Holy Beam** - Divine light column effect

5. **FR2.2**: Each spell animation must follow a consistent phase structure:
   - **Charge Phase**: Visual buildup showing spell preparation (200-600ms)
   - **Cast Phase**: Spell release moment (50-150ms)
   - **Travel Phase**: Projectile/effect movement (varies by type)
   - **Impact Phase**: Contact with target effect (150-300ms)
   - **Aftermath Phase**: Lingering particles/effects (100-200ms optional)

6. **FR2.3**: The system must provide unique visual characteristics for each element:
   - **Fire**: Orange/red particles, warm glow, explosive impact
   - **Ice**: Blue/white particles, crystalline effects, shattering impact
   - **Lightning**: Yellow/white electric sparks, instant travel, electric burst
   - **Holy**: Gold/white divine light, beam effect, radiant particles
   - **Arcane**: Purple/blue mystical energy, swirling particles

### Phase 3: Support Spell Animations (Wizard Buffs/Heals)
7. **FR3.1**: The system must implement animations for Wizard support spells:
   - **Heal** - Green particles descending with HP restoration visual
   - **Protect** - Blue shield barrier materializing around target
   - **Shell** - Purple magic barrier for magic defense
   - **Haste** - Yellow speed lines and glow effect

8. **FR3.2**: Buff animations must have persistent visual effects that remain visible for the duration of the buff, using subtle particle effects or overlays that don't obscure gameplay

### Phase 4: Animation Registry & Integration
9. **FR4.1**: The system must provide an `animationRegistry.ts` that maps spell/attack IDs to their corresponding animation components and configuration

10. **FR4.2**: The system must provide an `AnimationController.tsx` component that:
    - Accepts attack type, caster/target positions, damage data, and element type
    - Selects the appropriate animation component from the registry
    - Manages animation lifecycle (start, play, complete)
    - Notifies combat system when animation completes

11. **FR4.3**: The system must integrate with `Combat.tsx` to trigger animations during battle:
    - Replace or enhance existing Magic Bolt integration
    - Trigger appropriate animation based on spell/attack being used
    - Handle animation completion to continue battle flow
    - Support animation queueing for rapid sequential attacks

### Phase 5: Error Handling & Degradation
12. **FR5.1**: The system must gracefully handle animation failures:
    - In production: Show simplified fallback animation or skip to immediate result
    - In development: Log detailed error messages to help developers debug
    - Never block combat progression due to animation errors

13. **FR5.2**: The system must handle edge cases:
    - Missing animation mappings (use default/fallback animation)
    - Invalid position data (skip animation, show result)
    - Rapid attack sequences (queue or skip animations based on combat speed)
    - Browser compatibility issues (detect and degrade gracefully)

### Phase 6: Performance Requirements
14. **FR6.1**: The system must maintain 60fps (16.67ms frame budget) during animations on desktop browsers (Chrome, Firefox, Safari)

15. **FR6.2**: Animation components must use GPU-accelerated properties only:
    - Use `transform` and `opacity` for all animations
    - Avoid `width`, `height`, `top`, `left` changes
    - Minimize DOM manipulation during animation playback

16. **FR6.3**: The system must implement particle limits:
    - Maximum 20-30 particles per effect
    - Reuse particle instances where possible
    - Use React.memo to prevent unnecessary re-renders

17. **FR6.4**: Animation components must be lazy-loaded to reduce initial bundle size

### Phase 7: Future Class Expansion (Out of Initial Scope, but Architecture Must Support)
18. **FR7.1**: The animation architecture must support easy expansion to other classes:
    - Warrior class melee attacks (sword, axe, mace)
    - Ranger class ranged attacks (bow, arrow rain)
    - Rogue class special attacks (backstab, steal)
    - Paladin class holy abilities
    - Enemy creature attacks (bite, claw, breath weapons)

---

## Non-Goals (Out of Scope)

The following features are explicitly **NOT** included in this PRD and will not be implemented in the initial combat animation system:

1. **Animation Customization Settings**: No player-facing options to control animation speed (slow/normal/fast) or visual quality settings. Animations will be fixed for consistency. *(May be added in future iteration)*

2. **Combo Attack Sequences**: No special animations for chaining multiple attacks together or combo-specific visual effects

3. **Environmental Interaction**: Animations will not interact with or affect terrain, background elements, or environmental objects

4. **Customizable Animation Themes**: No ability for players to choose different visual styles or themes for animations (e.g., "retro mode" or "minimalist mode")

5. **Animation-Based Gameplay Mechanics**: No timing-based gameplay features like parry windows, counter attack timing, or dodge mechanics that rely on animation frames

6. **Mobile Device Optimization**: Initial implementation targets desktop browsers only. Mobile optimization is not required for this phase

7. **Sound Effects Integration**: While animations will be created, sound effect integration is handled separately and is not part of this PRD

8. **Camera Effects**: No camera shake, zoom, or dynamic camera movement based on animations (may use subtle screen shake for heavy impacts only)

9. **AI Animation Learning**: The system will not adapt or learn from player preferences; all animations are pre-designed

10. **Animation Editor Tool**: No visual editor or GUI tool for non-developers to create/modify animations

---

## Design Considerations

### Visual Design Principles
- **Anticipation**: Every attack should have a clear "wind-up" or charge phase so players can anticipate what's coming
- **Impact**: Use particles, flashes, and brief screen effects to make hits feel powerful
- **Follow-through**: Animations should have proper recovery/aftermath for weight and realism
- **Readability**: Visual effects should be clear and not obscure important game information
- **Consistency**: Similar attack types should follow similar animation patterns

### Animation Timing Guidelines
- **Fast attacks** (dagger, light spells): 400-600ms total
- **Medium attacks** (sword, standard spells): 600-1000ms total
- **Heavy attacks** (axe, powerful spells): 1000-1500ms total
- **Support/Buff animations**: 800-1200ms total
- **Impact effects**: 150-300ms (never exceed 400ms)

### Color Palette by Element
- **Fire**: `#ff6b35` (orange), `#ff4444` (red), `#ffaa00` (yellow-orange)
- **Ice**: `#4da6ff` (blue), `#b3e0ff` (light blue), `#ffffff` (white)
- **Lightning**: `#ffeb3b` (yellow), `#fff176` (light yellow), `#ffffff` (white)
- **Holy**: `#ffd700` (gold), `#ffffcc` (light gold), `#ffffff` (white)
- **Arcane**: `#9c27b0` (purple), `#ba68c8` (light purple), `#4a148c` (dark purple)
- **Poison**: `#8bc34a` (green), `#33691e` (dark green), `#7b1fa2` (purple tint)

### Component Organization
```
src/components/combat/animations/
├── index.ts                    # Barrel exports
├── types.ts                    # Shared types & constants
├── animationRegistry.ts        # Attack type → Animation mapping
├── AnimationController.tsx     # Smart component selector
│
├── core/                       # Reusable building blocks
│   ├── ChargeParticles.tsx
│   ├── Projectile.tsx
│   ├── ImpactEffects.tsx
│   ├── MeleeSlash.tsx          # NEW
│   ├── AreaEffect.tsx          # NEW
│   ├── StatusOverlay.tsx       # NEW
│   ├── BuffAura.tsx            # NEW
│   └── ParticleSystem.tsx      # NEW
│
├── orchestrators/              # Complete animations
│   ├── MagicBoltAnimation.tsx  # ✅ Exists
│   ├── MeleeAttackAnimation.tsx
│   ├── RangedAttackAnimation.tsx
│   ├── AoeAttackAnimation.tsx
│   ├── BuffAnimation.tsx
│   └── DebuffAnimation.tsx
│
└── variants/                   # Specific implementations
    ├── FireballAnimation.tsx
    ├── IceShardAnimation.tsx
    ├── LightningAnimation.tsx
    ├── HolyBeamAnimation.tsx
    ├── MeteorAnimation.tsx
    └── HealAnimation.tsx
```

---

## Technical Considerations

### Dependencies
- **React 18+**: Animation components use hooks and functional components
- **Framer Motion**: Existing animation library used in Magic Bolt (continue using for consistency)
- **TypeScript**: All animation components must be fully typed

### Integration Points
1. **Combat.tsx**: Main combat component that will trigger animations via `AnimationController`
2. **Magic Bolt Animation**: Existing implementation will be redesigned to use new core component system for consistency
3. **Spell Data** (`public/data/spells.js`): Animation registry will map spell IDs to animation components
4. **Monster Data** (`public/data/monsters.js`): Future expansion will map enemy attack types to animations

### Performance Constraints
- **Target Frame Rate**: 60fps (16.67ms per frame)
- **Animation Component Budget**: <5ms per render
- **Particle System Budget**: <3ms per frame
- **Maximum Concurrent Animations**: 3 (player attack, enemy attack, environmental effect)

### Browser Compatibility
- **Primary Targets**: Latest versions of Chrome, Firefox, Safari on desktop
- **Graceful Degradation**: If advanced effects fail, fall back to simpler animations
- **No Polyfills Required**: Use modern browser features without fallbacks (ES6+, CSS transforms)

### Code Quality Standards
- All components must use TypeScript with strict mode
- Components must be memoized with `React.memo` where appropriate
- Use `useCallback` and `useMemo` to prevent unnecessary re-renders
- All magic numbers must be extracted to constants in `types.ts`
- Animation timings must be configurable via props for testing

---

## Success Metrics

The combat animation system will be considered successful when:

### Combat Engagement (Primary Metric)
1. **Subjective Player Feedback**: Players report that combat feels "more engaging and fun" compared to pre-animation system (via playtesting feedback)
2. **Visual Distinction**: 100% of implemented attack types have unique, recognizable animations that players can identify without text labels

### Performance Metrics (Critical)
3. **Frame Rate**: Maintain 60fps (no drops below 55fps) during combat animations on desktop browsers in performance testing
4. **Animation Completion**: 99%+ of animations complete successfully without errors in production environments

### Developer Velocity (Secondary)
5. **Implementation Speed**: After initial infrastructure is complete, new spell animations can be created and integrated in <4 hours per animation
6. **Code Reusability**: At least 70% of animation code is reusable components (core components used across multiple spell animations)

### Quality Metrics (Secondary)
7. **Bug Rate**: <2 animation-related bugs per 10 animations implemented
8. **Documentation Coverage**: 100% of animation components have JSDoc comments and design specifications documented

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)
**Goal**: Build reusable animation building blocks

**Deliverables**:
- Core animation components (`MeleeSlash`, `AreaEffect`, `StatusOverlay`, `BuffAura`, `ParticleSystem`)
- Enhanced `types.ts` with all animation interfaces
- Animation timing constants and configuration

**Success Criteria**: Core components can be composed together to create basic test animations

---

### Phase 2: Wizard Offensive Spells (Week 2)
**Goal**: Implement all Wizard attack spell animations

**Deliverables**:
- `FireballAnimation.tsx` - Complete fire projectile spell
- `IceShardAnimation.tsx` - Complete ice projectile spell
- `LightningAnimation.tsx` - Complete lightning strike spell
- `HolyBeamAnimation.tsx` - Complete holy beam spell
- `MeteorAnimation.tsx` - Complete AOE meteor spell
- Redesigned `MagicBoltAnimation.tsx` using new core components

**Success Criteria**: All Wizard offensive spells have unique, visually distinct animations that follow timing guidelines

---

### Phase 3: Wizard Support Spells (Week 3)
**Goal**: Implement Wizard buff, heal, and support animations

**Deliverables**:
- `HealAnimation.tsx` - HP restoration visual effect
- Buff animations for Protect, Shell, Haste
- `BuffAnimation.tsx` orchestrator component
- Persistent status effect overlay system

**Success Criteria**: Buffs have clear visual feedback and subtle persistent effects that don't obscure gameplay

---

### Phase 4: Animation Registry & Integration (Week 4)
**Goal**: Connect animation system to combat mechanics

**Deliverables**:
- `animationRegistry.ts` - Maps spell IDs to animation components
- `AnimationController.tsx` - Smart component that selects and manages animations
- Integration with `Combat.tsx` battle flow
- Animation queueing system for rapid attacks

**Success Criteria**: Combat.tsx successfully triggers appropriate animations for all Wizard spells, animations complete and return control to combat system

---

### Phase 5: Testing, Polish & Documentation (Week 5)
**Goal**: Ensure quality, performance, and maintainability

**Deliverables**:
- Performance testing and optimization (60fps validation)
- Error handling and graceful degradation implementation
- Comprehensive documentation in `docs/` folder:
  - Animation design principles guide
  - Timing and visual effect guidelines
  - How to add new animations tutorial
  - Component API documentation
  - Troubleshooting guide
- Edge case handling (missing animations, invalid data, etc.)

**Success Criteria**:
- All animations meet performance targets (60fps)
- Complete documentation allows new developers to add animations independently
- Error handling gracefully manages all identified edge cases

---

### Phase 6: Future Expansion Preparation (Week 6)
**Goal**: Validate architecture for remaining classes

**Deliverables**:
- Proof-of-concept animations for one non-Wizard class (e.g., Warrior sword slash)
- Architecture review and refinement based on expansion attempt
- Roadmap for remaining class implementations
- Animation pattern templates for future developers

**Success Criteria**: Existing architecture successfully supports non-Wizard animations with minimal modifications, clear path forward for full game coverage

---

## Open Questions

1. **Animation Interruption**: What should happen if a player/enemy is defeated mid-animation? Should the animation complete or cut short?

2. **Animation Speed Balance**: Should powerful spells have longer animations for dramatic effect, or should all animations be relatively quick to maintain combat pace?

3. **Particle Density**: What's the right balance between visual impact (more particles) and performance (fewer particles)? Should we implement LOD (Level of Detail) based on particle count?

4. **Critical Hit Visuals**: Should critical hits use enhanced versions of regular animations, or completely different animations?

5. **Multi-Target Spells**: How should animations work for spells that hit multiple enemies? Sequential, parallel, or one AOE animation?

6. **Animation Cancellation**: Should players be able to cancel/skip animations for faster combat, or are animations always required to play?

7. **Accessibility**: Should there be a "reduced motion" mode for players sensitive to visual effects?

8. **Battle Speed Modes**: If we add battle speed settings in the future (slow/normal/fast), should animations scale proportionally or use different animation sets?

9. **Enemy Animation Priority**: When implementing enemy attacks later, should all enemies have unique animations, or can some enemy types share animations?

10. **Animation Data Format**: Should animation configurations eventually be moved to JSON/data files for easier tweaking by designers, or keep them in TypeScript components?

---

## Documentation Requirements

### Documentation Location
All documentation must be stored in `/docs/animations/` directory with the following structure:

```
docs/animations/
├── README.md                          # Overview and quick start guide
├── design-principles.md               # Visual design philosophy and guidelines
├── timing-guidelines.md               # Animation duration and pacing standards
├── adding-new-animations.md           # Step-by-step tutorial for developers
├── component-api.md                   # API documentation for all components
├── troubleshooting.md                 # Common issues and solutions
├── wizard-spell-specifications.md     # Detailed specs for each Wizard spell
└── animation-patterns.md              # Reusable patterns and templates
```

### Required Documentation Content

#### 1. `design-principles.md`
- Visual design philosophy (anticipation, impact, follow-through)
- Color palette specifications by element
- Particle effect guidelines
- Readability and clarity standards
- Examples of good vs. bad animation design

#### 2. `timing-guidelines.md`
- Phase timing breakdowns (charge, cast, travel, impact, aftermath)
- Animation duration by attack weight (fast/medium/heavy)
- Frame budget allocation
- Performance optimization tips

#### 3. `adding-new-animations.md`
- Step-by-step tutorial for creating a new spell animation
- How to use core components
- How to register animations in the registry
- Testing and validation checklist
- Code examples and templates

#### 4. `component-api.md`
- Complete API documentation for all core components
- Props, types, and usage examples
- Animation lifecycle documentation
- Integration patterns with Combat.tsx

#### 5. `wizard-spell-specifications.md`
- Detailed specification for each Wizard spell animation
- Visual mockups or descriptions
- Timing breakdowns
- Particle effects and colors used
- Special considerations or edge cases

---

## Appendix: Wizard Spell Animation Specifications

### Fireball Animation
**Duration**: 950ms total
- **Charge (350ms)**: Red/orange particles swirl at caster's hand position
- **Cast (150ms)**: Flame burst from hand, bright flash
- **Travel (300ms)**: Spinning fireball projectile with trailing particles
- **Impact (150ms)**: Explosion burst, fire particles scatter, orange screen flash

**Visual Elements**:
- Primary color: `#ff6b35` (orange)
- Secondary color: `#ff4444` (red)
- Particle count: 15-20 during charge, 10-15 during travel, 25-30 during impact
- Special effects: Rotation during travel, radial burst on impact

---

### Ice Shard Animation
**Duration**: 900ms total
- **Charge (400ms)**: Blue crystalline particles form and coalesce
- **Cast (150ms)**: Frost mist burst from hand
- **Travel (250ms)**: Sharp rotating ice shard with frozen trail effect
- **Impact (100ms)**: Shatter effect with ice fragment particles, blue screen flash

**Visual Elements**:
- Primary color: `#4da6ff` (blue)
- Secondary color: `#b3e0ff` (light blue)
- Particle count: 12-18 during charge, 8-12 during travel, 20-25 during impact
- Special effects: Crystal formation during charge, sharp angular shatter on impact

---

### Lightning Bolt Animation
**Duration**: 900ms total
- **Charge (350ms)**: Electric sparks crackle around caster
- **Cast (100ms)**: Caster points hand/staff upward
- **Strike (200ms)**: Lightning bolt strikes from sky to target (instant visual travel)
- **Impact (250ms)**: Electric burst at target, continuous electrical sparks, yellow screen flash

**Visual Elements**:
- Primary color: `#ffeb3b` (yellow)
- Secondary color: `#fff176` (light yellow)
- Particle count: 10-15 during charge, 0 during strike, 20-25 during impact
- Special effects: Jagged bolt path, lingering electric arcs at impact site

---

### Holy Beam Animation
**Duration**: 1000ms total
- **Charge (350ms)**: Golden particles gather above caster
- **Cast (150ms)**: Bright divine light begins to form
- **Beam (350ms)**: Column of light descends from above onto target
- **Impact (150ms)**: Radiant burst, lingering golden sparkles

**Visual Elements**:
- Primary color: `#ffd700` (gold)
- Secondary color: `#ffffcc` (light gold)
- Particle count: 15-20 during charge, continuous beam effect, 25-30 during impact
- Special effects: Vertical beam of light, radiant glow effect, divine sparkles

---

### Meteor Animation (AOE)
**Duration**: 1500ms total
- **Charge (600ms)**: Caster looks to sky, red glow appears overhead
- **Warning (400ms)**: Shadow circles appear on ground (target indicators)
- **Impact (300ms)**: Multiple meteors crash down simultaneously, explosions
- **Aftermath (200ms)**: Dust clouds, crater effects, lingering particles

**Visual Elements**:
- Primary color: `#ff4444` (red)
- Secondary color: `#ffaa00` (orange)
- Particle count: 30-40 total (distributed across multiple impact points)
- Special effects: Shadow indicators, screen shake on impact, multiple simultaneous effects

---

### Heal Animation
**Duration**: 1100ms total
- **Cast (400ms)**: Green particles gather in air above target
- **Descend (300ms)**: Healing light falls gracefully onto target
- **Absorption (300ms)**: Green glow envelops target, HP numbers rise
- **Complete (100ms)**: Final sparkle effect, particles dissipate

**Visual Elements**:
- Primary color: `#8bc34a` (green)
- Secondary color: `#c5e1a5` (light green)
- Particle count: 20-25 during cast, continuous glow during absorption
- Special effects: Rising HP numbers, gentle pulsing glow, soothing visual feel

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-03 | AI Assistant (Claude) | Initial PRD creation based on rpg-combat-animator agent plan and user clarifications |

---

**Document Status**: ✅ Ready for Review and Implementation
**Next Step**: Review PRD with stakeholders, then proceed to Phase 1 implementation
