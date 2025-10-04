# Animation Timing Guidelines

**Version:** 1.0
**Last Updated:** 2025-10-04
**Author:** Animation System Team

---

## Table of Contents

1. [Animation Phase Breakdowns](#animation-phase-breakdowns)
2. [Duration Standards by Attack Weight](#duration-standards-by-attack-weight)
3. [Frame Budget Allocation at 60fps](#frame-budget-allocation-at-60fps)
4. [Timing Tables and References](#timing-tables-and-references)
5. [Timing Best Practices](#timing-best-practices)
6. [Special Timing Considerations](#special-timing-considerations)

---

## Animation Phase Breakdowns

Combat spell animations follow a standardized phase structure that creates natural flow, clear visual communication, and satisfying impact. Understanding when to use each phase and how they connect is essential for creating compelling combat animations.

### Standard Phase Structure

All combat animations should follow this general progression:

```
CHARGE → CAST → TRAVEL/EXECUTION → IMPACT → AFTERMATH
```

Not all phases are required for every animation type. Use the appropriate subset based on the spell mechanic.

---

### Phase 1: Charge (Anticipation)

**Purpose:** Build tension, telegraph the incoming action, give player visual warning

**Visual Elements:**
- Particles gathering around caster
- Glowing energy building at hand/staff
- Color intensity increasing
- Converging or swirling effects

**Duration Range:**
- Light attacks: 300-400ms
- Medium attacks: 350-450ms
- Heavy attacks: 600-800ms

**When to Use:**
- **Always use** for offensive spells
- **Optional** for instant buffs/heals
- **Extended** for high-damage or AOE attacks

**Example (Ice Shard - 400ms):**
- 0-200ms: Crystalline particles converge inward (spread: -70)
- 200-300ms: Hexagonal crystal pattern forms, rotating
- 300-400ms: Frost mist gathers, intensity peaks

**Key Timing Relationship:**
- Should feel like drawing breath before action
- Heavier attacks need proportionally longer charge for visual weight
- Faster attacks snap quickly through charge phase

---

### Phase 2: Cast (Release Trigger)

**Purpose:** Sharp transition from buildup to action, moment of commitment

**Visual Elements:**
- Burst of particles from caster
- Bright flash at release point
- Quick expansion then immediate travel/execution
- Directional thrust toward target

**Duration Range:**
- Light attacks: 100-150ms
- Medium attacks: 150-200ms
- Heavy attacks: 200-300ms (for warnings, not execution)

**When to Use:**
- **Always use** for projectile spells (marks projectile launch)
- **Use** for beam/channel spells (marks beam start)
- **Replace with warning** for AOE attacks (ground indicators)

**Example (Fireball - 150ms):**
- 0-75ms: Flash at caster's hand, burst particles
- 75-150ms: Projectile begins to form and separate from caster

**Key Timing Relationship:**
- Should be the **snappiest** phase (quickest transition)
- Creates the "moment of release" feel
- Bridges anticipation to execution

---

### Phase 3A: Travel (For Projectiles)

**Purpose:** Projectile journey from caster to target

**Visual Elements:**
- Projectile moving along trajectory
- Trailing particles or vapor
- Rotating/spinning projectile (optional)
- Anticipatory glow building at target location

**Duration Range:**
- Fast projectiles: 200-300ms (Ice Shard, basic bolts)
- Medium projectiles: 300-400ms (Fireball, standard spells)
- Slow projectiles: 400-600ms (heavy siege magic, NOT common)

**When to Use:**
- **Required** for all projectile-based spells
- **Not used** for instant beams (use beam phase instead)
- **Not used** for self-buffs or AOE (no travel concept)

**Example (Ice Shard - 250ms):**
- Sharp rotating triangle projectile
- Frozen trail particles (10 particles, 25px spread)
- Frost vapor trail behind projectile
- Linear easing for fast, direct flight

**Key Timing Relationship:**
- Should feel deliberate but not slow
- Longer than 400ms risks feeling sluggish
- Player's eyes should track comfortably

---

### Phase 3B: Beam (For Channeled Spells)

**Purpose:** Sustained energy effect from caster/sky to target

**Visual Elements:**
- Column or ray of light/energy
- Inner bright core + outer glow layers
- Descending/horizontal beam depending on source
- Continuous particle flow along beam path

**Duration Range:**
- Quick beams: 250-350ms (Lightning strike)
- Standard beams: 350-450ms (Holy Beam, laser attacks)
- Sustained beams: 450-600ms (heavy channeled spells)

**When to Use:**
- **Use** for lightning/divine spells from sky
- **Use** for laser/ray attacks from caster
- **Not used** for projectiles (use travel instead)

**Example (Holy Beam - 350ms):**
- 0-100ms: Beam column descends from sky (scaleY: 0 → 1)
- 100-250ms: Beam sustains at full intensity
- 250-350ms: Beam begins to fade as impact approaches

**Key Timing Relationship:**
- Should feel like sustained power
- Shorter than travel because it's instant visual impact
- Overlaps with early impact effects

---

### Phase 3C: Warning (For AOE Attacks)

**Purpose:** Show affected area, give defenders visual warning before impact

**Visual Elements:**
- Shadow circles on ground (target indicators)
- Pulsing warning rings
- Red/orange danger coloration
- Sky darkening or energy gathering above

**Duration Range:**
- Quick warnings: 300-400ms (small AOE)
- Standard warnings: 400-500ms (medium AOE like Meteor)
- Long warnings: 500-700ms (massive siege AOE)

**When to Use:**
- **Required** for all AOE attacks
- **Extended** for multi-target simultaneous hits
- **Not used** for single-target spells

**Example (Meteor - 400ms):**
- 0-100ms: Shadow circles appear on ground (3 impact points)
- 100-300ms: Pulsing warning rings (opacity: 0.4 → 0.6 → 0.4)
- 300-400ms: Sky glow intensifies, particles falling faster

**Key Timing Relationship:**
- Gives players time to react mentally (even if not mechanically)
- Creates anticipation for big impact
- Stagger indicators slightly (50-80ms delay) for visual clarity

---

### Phase 4: Impact (Contact and Effect)

**Purpose:** Moment of visual and psychological payoff, damage confirmation

**Visual Elements:**
- Explosion or burst at target
- Radial particles scattering
- Screen flash (subtle, 0.1-0.2 opacity)
- Shockwave rings expanding
- Element-specific destruction (shatter, flames, sparks)

**Duration Range:**
- Light attacks: 100-150ms (quick hit)
- Medium attacks: 150-200ms (standard explosion)
- Heavy attacks: 300-400ms (devastating blast)

**When to Use:**
- **Always use** for offensive spells
- **Brief** for buffs/heals (gentle sparkle)
- **Extended** for climactic heavy attacks

**Example (Fireball - 150ms):**
- 0-50ms: Core explosion flash (opacity: 0 → 1, scale: 0 → 1.5)
- 50-100ms: Explosion ring shockwave expands (scale: 0 → 2)
- 100-150ms: Radiating particles burst (28 particles, 150px spread)
- Screen flash: Opacity 0 → 0.15 → 0 (red tint)

**Key Timing Relationship:**
- Should be the **most visually dense** phase
- Faster = snappier hit feel; slower = heavier devastation
- Screen flash should peak at 30-50% into impact phase

---

### Phase 5: Aftermath (Optional Lingering)

**Purpose:** Resolve the impact, show environmental effects, smooth transition to idle

**Visual Elements:**
- Dust clouds rising
- Smoke dissipating
- Lingering embers or sparks
- Crater glows fading
- Status effect overlays beginning (poison cloud, ice crystals, etc.)

**Duration Range:**
- Light attacks: 0ms (skip this phase)
- Medium attacks: 0-100ms (optional quick dissipation)
- Heavy attacks: 200-300ms (dramatic lingering effects)

**When to Use:**
- **Use** for AOE attacks (show scale of destruction)
- **Use** for heavy single-target attacks (epic feel)
- **Skip** for light/fast attacks (immediate return to combat)

**Example (Meteor - 200ms):**
- 0-100ms: Dust clouds rise from 3 impact craters
- 100-150ms: Crater glows fade (opacity: 0.7 → 0.4 → 0)
- 150-200ms: Lingering embers float upward (6 particles per crater)
- Overall smoke cloud dissipates (scale: 1 → 2.5)

**Key Timing Relationship:**
- Should feel like settling after chaos
- Helps establish "weight" of powerful attacks
- Can overlap with combat UI updates (damage numbers, health bars)

---

### Phase Timing Flow Examples

**Fast Attack (Ice Shard - 900ms total):**
```
Charge (400ms) → Cast (150ms) → Travel (250ms) → Impact (100ms)
[████████]      [███]           [█████]          [██]
```

**Medium Attack (Fireball - 950ms total):**
```
Charge (350ms) → Cast (150ms) → Travel (300ms) → Impact (150ms)
[███████]       [███]           [██████]         [███]
```

**Heavy AOE (Meteor - 1500ms total):**
```
Charge (600ms) → Warning (400ms) → Impact (300ms) → Aftermath (200ms)
[████████████]   [████████]        [██████]         [████]
```

---

## Duration Standards by Attack Weight

Attack "weight" refers to the perceived power, impact, and damage potential of a spell. Heavier attacks should **feel** heavier through extended timing, bigger particles, and more dramatic effects.

### Classification System

| Weight Class | Damage Tier | MP Cost | Examples |
|--------------|-------------|---------|----------|
| **Light** | 10-30 damage | 5-10 MP | Ice Shard, Magic Bolt, Quick Shot |
| **Medium** | 30-60 damage | 10-20 MP | Fireball, Lightning, Wind Slash |
| **Heavy** | 60-120 damage | 20-40 MP | Meteor, Earthquake, Divine Judgment |

---

### Light/Fast Attacks (800-1000ms specified, ~960-1200ms actual)

**Design Philosophy:** Responsive, snappy, spammable. Should feel like quick jabs in a fight.

#### Timing Budget

| Phase | Duration | Purpose |
|-------|----------|---------|
| **Charge** | 300-400ms | Quick buildup, minimal anticipation |
| **Cast** | 100-150ms | Sharp release |
| **Travel** | 200-300ms | Fast projectile flight |
| **Impact** | 100-150ms | Quick hit confirmation |
| **Total (specified)** | **800-1000ms** | |
| **Total (actual)** | **960-1200ms** | +15-20% browser overhead |

#### Implementation Example: Ice Shard (900ms specified)

```typescript
const CHARGE_DURATION = 400;   // Crystalline particles converge
const CAST_DURATION = 150;     // Frost mist burst
const TRAVEL_DURATION = 250;   // Rotating ice shard flies
const IMPACT_DURATION = 100;   // Sharp shatter effect
const TOTAL = 900;             // Specified total
// Actual: ~1080ms in browser
```

**Phase Breakdown:**
- **Charge (400ms = 44%)**: Converging ice crystals, hexagonal pattern forms
  - Particles: 15 count, -70 spread (negative = inward)
  - Glow: Opacity 0 → 0.9, scale 0 → 1.1
  - Feel: Quick, crisp gathering

- **Cast (150ms = 17%)**: Frost mist explosion
  - Burst particles: 10 count, 120 spread
  - Flash: White-blue, opacity 0 → 0.6 → 0
  - Feel: Snap release

- **Travel (250ms = 28%)**: Rotating triangular shard
  - Projectile: 22px size, 900° rotation (2.5 spins)
  - Trail: 10 particles, continuous emission
  - Feel: Sharp, fast, direct

- **Impact (100ms = 11%)**: Ice shatter burst
  - Shatter shards: 8 directional triangles
  - Particles: 22 count, 130 spread
  - Screen flash: Blue, 0.1 opacity
  - Feel: Quick crack

**Design Notes:**
- Travel phase is dominant for projectile feel
- Impact is brief for quick combat flow
- Total duration keeps combat pace fast

---

### Medium Attacks (900-1100ms specified, ~1080-1320ms actual)

**Design Philosophy:** Balanced power and speed. Should feel deliberate and impactful without slowing combat.

#### Timing Budget

| Phase | Duration | Purpose |
|-------|----------|---------|
| **Charge** | 350-450ms | Standard buildup, clear telegraph |
| **Cast** | 150-200ms | Controlled release |
| **Travel/Beam** | 250-400ms | Standard projectile/beam duration |
| **Impact** | 150-250ms | Satisfying explosion |
| **Total (specified)** | **900-1100ms** | |
| **Total (actual)** | **1080-1320ms** | +15-20% browser overhead |

#### Implementation Examples

##### Fireball (950ms specified)

```typescript
const CHARGE_DURATION = 350;   // Swirling red/orange particles
const CAST_DURATION = 150;     // Flame burst from hand
const TRAVEL_DURATION = 300;   // Spinning fireball projectile
const IMPACT_DURATION = 150;   // Explosion burst
const TOTAL = 950;
// Actual: ~1138ms in browser
```

**Phase Breakdown:**
- **Charge (350ms = 37%)**: Swirling fire particles
  - Particles: 18 count, 60 spread
  - Inner glow: Radial gradient, pulse effect
  - Feel: Building heat

- **Cast (150ms = 16%)**: Burst flash
  - Burst particles: 12 count, 100 spread
  - Flash: Orange-yellow, intense
  - Feel: Explosive release

- **Travel (300ms = 32%)**: Spinning fire sphere
  - Projectile: 24px size, 720° rotation (2 full spins)
  - Trail: 15 particles, fire colors
  - Core: Bright center with glow layers
  - Feel: Powerful, rolling momentum

- **Impact (150ms = 16%)**: Fire explosion
  - Core flash: Radial burst
  - Shockwave ring: Expanding border
  - Particles: 28 primary + 15 secondary
  - Screen flash: Red-orange, 0.15 opacity
  - Feel: Satisfying boom

##### Lightning (900ms specified)

```typescript
const CHARGE_DURATION = 350;   // Electric sparks crackling
const CAST_DURATION = 100;     // Point upward, energy burst
const STRIKE_DURATION = 200;   // Bolt from sky (instant visual)
const IMPACT_DURATION = 250;   // Electric burst and arcs
const TOTAL = 900;
// Actual: ~1016ms in browser
```

**Phase Breakdown:**
- **Charge (350ms = 39%)**: Crackling electricity
  - Particles: 12 count, erratic
  - Pulsing aura: 6 pulse cycles
  - Erratic arcs: 3 animated lines
  - Feel: Building static charge

- **Cast (100ms = 11%)**: Upward thrust
  - Vertical beam: Shoots upward
  - Flash at caster
  - Upward sparks: 8 particles, -150 gravity (strong upward)
  - Feel: Quick directional release

- **Strike (200ms = 22%)**: Lightning bolt descends
  - Jagged SVG path: 8 segments, ±30px deviation
  - Primary bolt: 4px width, white
  - Secondary bolt: 2px width, yellow, offset
  - Sky flash above target
  - Feel: Instant, violent

- **Impact (250ms = 28%)**: Electric explosion
  - Central burst: Long fade (4 opacity keyframes)
  - Electric arcs: 8 directional + 4 erratic
  - Particles: 24 count, crackling
  - Shockwave ring
  - Screen flash: Yellow, 0.2 opacity
  - Feel: Sustained electrical discharge

##### Holy Beam (1000ms specified)

```typescript
const CHARGE_DURATION = 350;   // Golden particles gather above
const CAST_DURATION = 150;     // Divine light forms
const BEAM_DURATION = 350;     // Column of light descends
const IMPACT_DURATION = 150;   // Radiant burst
const TOTAL = 1000;
// Actual: ~1126ms in browser
```

**Phase Breakdown:**
- **Charge (350ms = 35%)**: Rising golden energy
  - Particles: 18 count, float upward (-80 gravity)
  - Light gathers above: Moves Y: -60 → -90
  - Divine circle: Rotates 360°
  - Radiant cross pattern forms
  - Feel: Divine summoning

- **Cast (150ms = 15%)**: Divine light activates
  - Bright flash above
  - Expanding divine ring
  - Descending preparation glow (scaleY: 0 → 0.8)
  - Burst particles: 12 count
  - Feel: Heavenly activation

- **Beam (350ms = 35%)**: Light column descends
  - Main column: 60px width, golden gradient
  - Inner core: 30px, bright white-gold
  - Outer glow: 100px, soft radiance
  - Descending sparkles: 15 particles
  - Pulsing light at top
  - Ground indicator: Ellipse glow
  - Feel: Sustained divine power

- **Impact (150ms = 15%)**: Radiant explosion
  - Central burst: 4-phase fade
  - Light rays: 12 directional beams
  - Sparkle burst: 28 particles (-20 gravity for upward float)
  - Shimmer ring
  - Ascending sparkles: ✨ emoji particles
  - Screen flash: Golden, 0.15 opacity
  - Feel: Divine blessing/judgment

**Design Notes:**
- Medium attacks balance anticipation and execution
- Impact phases are more developed than light attacks
- Beam spells replace travel with sustained effect
- Total duration allows for satisfying buildup and payoff

---

### Heavy/Slow Attacks (1400-1800ms specified, ~1680-2160ms actual)

**Design Philosophy:** Epic, devastating, memorable. Should feel like ultimate abilities or high-cost power moves. These are climactic moments in combat.

#### Timing Budget

| Phase | Duration | Purpose |
|-------|----------|---------|
| **Charge** | 600-800ms | Extended buildup, dramatic anticipation |
| **Warning/Preparation** | 300-500ms | Clear threat communication, AOE indicators |
| **Impact** | 300-400ms | Massive explosion, extended destruction |
| **Aftermath** | 200-300ms | Lingering devastation effects |
| **Total (specified)** | **1400-1800ms** | |
| **Total (actual)** | **1680-2160ms** | +15-20% browser overhead |

#### Implementation Example: Meteor (1500ms specified)

```typescript
const CHARGE_DURATION = 600;      // Caster summons, sky reddens
const WARNING_DURATION = 400;     // Ground indicators appear
const IMPACT_DURATION = 300;      // Meteors crash down
const AFTERMATH_DURATION = 200;   // Dust, craters, embers
const TOTAL = 1500;
// Actual: ~1683ms in browser
```

**Phase Breakdown:**

- **Charge (600ms = 40%)**: Dramatic summoning
  - Upward gesture glow: Rises Y: -50 → -100
  - Rising particles: 15 count, -60 gravity (float upward)
  - Red glow in sky: Grows from scale 0 → 1.5, opacity 0 → 0.7
  - Pulsing red cloud: 6 pulse cycles
  - Ominous rumble effect: Pulsing glow at caster
  - Feel: Calling down destruction from above

- **Warning (400ms = 27%)**: Target indicators
  - Shadow circles: 3 impact points (staggered 80ms delays)
    - Opacity: 0 → 0.6 → 0.7 → 0.8
    - Scale: 0 → 0.8 → 1 → 1.1
    - Dashed borders, shadow effect
  - Pulsing warning rings: 5 pulse cycles per circle
  - Intensifying sky glow: Scale 1.5 → 2, opacity 0.3 → 0.9
  - Warning particles falling: 12 count, 200 gravity (fast fall)
  - Feel: Imminent danger, take cover!

- **Impact (300ms = 20%)**: Multiple meteor strikes
  - **3 meteors strike simultaneously (staggered 50ms)**:
    - Falling trail: Y: -200 → 0 (150ms, fast easing)
    - Flame trail: ScaleY: 0 → 1 → 0.8 → 0 (vertical gradient)
    - Impact explosion: Scale 0 → 1.5 → 2 → 2.5
    - Shockwave ring: Scale 0 → 2 → 3 per meteor
    - Explosion particles: 12 per meteor (36 total)
  - Overall AOE effect: 100px radius expanding
  - Screen flash: Red-orange, 0.25 opacity (strongest flash)
  - Feel: Cascading devastation

- **Aftermath (200ms = 13%)**: Lingering destruction
  - **Per crater (3 total)**:
    - Rising dust clouds: Y: 0 → -80
    - Crater glow: Fades from 0.7 → 0
    - Lingering embers: 6 particles each, float upward
  - Overall smoke: Dissipates upward, expands
  - Feel: Settling after chaos, epic scale

**Multi-Target Stagger Timing:**
- Meteor 1 (center): 0ms delay
- Meteor 2 (left): 50ms delay
- Meteor 3 (right): 50ms delay

This creates a **cascade effect** rather than perfect simultaneity, which is more visually clear and dramatic.

**Design Notes:**
- Charge is 40% of animation (dramatic buildup)
- Warning phase is unique to heavy AOE
- Impact involves multiple simultaneous effects
- Aftermath reinforces epic scale
- Total duration is acceptable because these are rare, high-cost abilities
- Particle count is distributed across 3 impacts (12 each, not 36 at once)

---

### Attack Weight Comparison Table

| Metric | Light | Medium | Heavy |
|--------|-------|--------|-------|
| **Total Duration (specified)** | 800-1000ms | 900-1100ms | 1400-1800ms |
| **Total Duration (actual)** | 960-1200ms | 1080-1320ms | 1680-2160ms |
| **Charge Phase** | 300-400ms (35-40%) | 350-450ms (35-40%) | 600-800ms (40-45%) |
| **Execution Phase** | 200-300ms (25-30%) | 250-400ms (28-35%) | 300-500ms (20-30%) |
| **Impact Phase** | 100-150ms (11-15%) | 150-250ms (15-25%) | 300-400ms (20-25%) |
| **Particles (total)** | 35-50 | 50-80 | 60-100 (distributed) |
| **Screen Flash Opacity** | 0.05-0.10 | 0.10-0.20 | 0.20-0.30 |
| **Projectile Speed** | Fast (250ms travel) | Medium (300ms travel) | N/A (AOE warning) |
| **Feel** | Snappy, responsive | Deliberate, powerful | Epic, devastating |

---

## Frame Budget Allocation at 60fps

Understanding frame budgets ensures animations stay performant while delivering visual impact. All timing guidelines are designed to maintain 60fps (16.67ms per frame) on modern hardware.

### Frame Rate Mathematics

**60fps Target:**
- 1 second = 1000ms
- 60 frames per second = 1000ms / 60 = **16.67ms per frame**
- Missing this budget = dropped frames = stutter/jank

**Frame Count Calculation:**
```
frames = duration_ms / 16.67
```

---

### Component Render Budget

Each React component update should complete within **5ms** to allow overhead for:
- Browser layout/paint (3-5ms)
- Framer Motion calculations (2-4ms)
- Particle system updates (2-3ms)
- Event handling (1-2ms)

**Total per-frame budget breakdown:**
```
16.67ms total per frame
  - 5ms: Component render
  - 5ms: Browser layout/paint
  - 4ms: Animation library (Framer Motion)
  - 2.67ms: Buffer/overhead
```

**What this means:**
- Keep component render logic minimal
- Use GPU-accelerated properties (transform, opacity)
- Avoid layout-triggering properties (width, height, top, left)
- Batch state updates when possible

---

### Animation Frame Calculations by Phase

#### Example: Ice Shard (900ms specified)

| Phase | Duration | Frame Count | Key Frames | Description |
|-------|----------|-------------|------------|-------------|
| **Charge** | 400ms | 24 frames | 0, 12, 24 | Converging particles, crystal formation |
| **Cast** | 150ms | 9 frames | 0, 4, 9 | Burst flash, snap release |
| **Travel** | 250ms | 15 frames | 0, 7, 15 | Rotating projectile, trailing particles |
| **Impact** | 100ms | 6 frames | 0, 3, 6 | Shatter burst, screen flash |
| **Total** | **900ms** | **54 frames** | | |

**Frame budget per component:**
- Main animation component: <2ms render
- Particle system: <2ms per update
- Projectile: <1ms per update
- Impact effects: <3ms (dense phase)

**Actual performance:**
- Chrome DevTools measured: **All frames 60fps** ✅
- Render times: 1.2-3.8ms (well under 5ms budget)
- No dropped frames observed

---

#### Example: Meteor (1500ms specified)

| Phase | Duration | Frame Count | Key Frames | Description |
|-------|----------|-------------|------------|-------------|
| **Charge** | 600ms | 36 frames | 0, 12, 24, 36 | Sky gathering, rising energy |
| **Warning** | 400ms | 24 frames | 0, 8, 16, 24 | Shadow circles, pulsing rings |
| **Impact** | 300ms | 18 frames | 0, 6, 12, 18 | 3 meteors crashing (staggered) |
| **Aftermath** | 200ms | 12 frames | 0, 6, 12 | Dust rising, craters glowing |
| **Total** | **1500ms** | **90 frames** | | |

**Frame budget per component (impact phase - most demanding):**
- Main animation: <2ms
- Meteor 1 effects: <2ms
- Meteor 2 effects: <2ms
- Meteor 3 effects: <2ms
- AOE effect: <1ms
- Particle systems (3x): <3ms total
- **Total: ~12ms per frame** (within 16.67ms budget)

**Optimization strategy:**
- Stagger meteor impacts by 50ms (3 frames) to distribute load
- Use shared particle systems where possible
- Limit particles to 12 per meteor (not 30)
- Aftermath phase reduces load as impact effects clean up

---

### Timing to Frame Conversion Table

Quick reference for converting millisecond durations to frame counts:

| Duration (ms) | Frames @ 60fps | Use Case |
|---------------|----------------|----------|
| 50ms | 3 frames | Very quick flash, instant feedback |
| 100ms | 6 frames | Light attack impact, quick burst |
| 150ms | 9 frames | Medium cast, standard burst |
| 200ms | 12 frames | Quick travel, beam strike |
| 250ms | 15 frames | Fast projectile travel |
| 300ms | 18 frames | Standard projectile travel, heavy impact |
| 350ms | 21 frames | Medium charge, standard beam |
| 400ms | 24 frames | Light charge, AOE warning start |
| 450ms | 27 frames | Medium charge (upper range) |
| 600ms | 36 frames | Heavy charge, dramatic buildup |

**Calculation Formula:**
```javascript
const frames = Math.round(duration_ms / 16.67);
```

**Example calculation:**
```javascript
// Fireball charge phase
const CHARGE_DURATION = 350; // ms
const chargeFrames = Math.round(350 / 16.67);
// Result: 21 frames

// This means the animation needs to feel complete across 21 frames
// Keyframes should be placed strategically:
// Frame 0 (0ms): Initial state
// Frame 10 (167ms): Mid-buildup
// Frame 21 (350ms): Peak intensity
```

---

### Performance Targets and Metrics

#### Target Performance

| Metric | Target | Acceptable | Unacceptable |
|--------|--------|------------|--------------|
| **Frame Rate** | 60fps | 55-60fps | <55fps |
| **Frame Time** | <16.67ms | <18ms | >18ms |
| **Component Render** | <5ms | <7ms | >7ms |
| **Dropped Frames** | 0 | <3% of animation | >5% of animation |
| **Memory Growth** | 0 MB | <2 MB per animation | >5 MB per animation |

#### Actual Measured Performance (Test Results)

Based on Chrome DevTools profiling of all implemented spells:

| Animation | Avg Frame Time | Max Frame Time | Dropped Frames | Status |
|-----------|----------------|----------------|----------------|---------|
| Ice Shard | 14.2ms | 16.1ms | 0 | ✅ Excellent |
| Fireball | 13.8ms | 15.9ms | 0 | ✅ Excellent |
| Lightning | 12.9ms | 15.2ms | 0 | ✅ Excellent |
| Holy Beam | 14.6ms | 16.4ms | 0 | ✅ Excellent |
| Meteor | 15.1ms | 16.8ms | 0 | ✅ Excellent |

**All animations maintain 60fps with no dropped frames** ✅

---

### Frame Budget Guidelines for New Animations

When designing new animations, follow these budgets:

#### Light Attack (800-1000ms, ~54-60 frames)

```
Phase Distribution:
- Charge: 24 frames (400ms)
  - Frame budget: <3ms render
  - Max particles: 15-20

- Cast: 9 frames (150ms)
  - Frame budget: <4ms render
  - Max particles: 10-15

- Travel: 15 frames (250ms)
  - Frame budget: <2ms render
  - Projectile + 10-15 trail particles

- Impact: 6 frames (100ms)
  - Frame budget: <5ms render (densest phase)
  - Max particles: 20-25
```

#### Medium Attack (900-1100ms, ~54-66 frames)

```
Phase Distribution:
- Charge: 21-27 frames (350-450ms)
  - Frame budget: <4ms render
  - Max particles: 18-22

- Cast: 9-12 frames (150-200ms)
  - Frame budget: <4ms render
  - Max particles: 12-15

- Travel/Beam: 15-24 frames (250-400ms)
  - Frame budget: <3ms render
  - Projectile + 15-20 trail particles OR
  - Beam effect with 15-20 descending particles

- Impact: 9-15 frames (150-250ms)
  - Frame budget: <5ms render
  - Max particles: 25-30 primary + 15 secondary
```

#### Heavy Attack (1400-1800ms, ~84-108 frames)

```
Phase Distribution:
- Charge: 36-48 frames (600-800ms)
  - Frame budget: <4ms render
  - Max particles: 15-20 (despite long duration)

- Warning: 18-30 frames (300-500ms)
  - Frame budget: <3ms render
  - Indicators, no heavy particles

- Impact: 18-24 frames (300-400ms)
  - Frame budget: <5ms render
  - Distributed particles (12 per impact point)
  - Stagger by 3 frames (50ms) if multiple impacts

- Aftermath: 12-18 frames (200-300ms)
  - Frame budget: <3ms render
  - Max particles: 6-10 per impact (lingering)
```

---

### Optimization Checklist

Before implementing a new animation, ensure:

- [ ] **Total particle count** <30 per phase (use `validateParticleCount()`)
- [ ] **GPU properties used**: Only animate `transform`, `opacity`, `filter`
- [ ] **Avoid layout triggers**: Don't animate `width`, `height`, `top`, `left`, `margin`
- [ ] **Stagger heavy effects**: Multi-target animations stagger by 50-100ms
- [ ] **Component render** <5ms (measure with React DevTools Profiler)
- [ ] **Animation cleanup**: `onComplete` callbacks clean up state
- [ ] **No memory leaks**: Check DevTools Memory profiler after 10+ plays

---

## Timing Tables and References

Complete timing data for all implemented spells, organized by category and use case.

### Complete Spell Timing Breakdown

| Spell | Type | Charge | Cast | Travel/Beam | Impact | Aftermath | Total (Specified) | Total (Actual) |
|-------|------|--------|------|-------------|--------|-----------|-------------------|----------------|
| **Ice Shard** | Projectile | 400ms | 150ms | 250ms | 100ms | - | 900ms | 1080ms |
| **Fireball** | Projectile | 350ms | 150ms | 300ms | 150ms | - | 950ms | 1138ms |
| **Lightning** | Beam | 350ms | 100ms | 200ms | 250ms | - | 900ms | 1016ms |
| **Holy Beam** | Beam | 350ms | 150ms | 350ms | 150ms | - | 1000ms | 1126ms |
| **Meteor** | AOE | 600ms | - | 400ms (warning) | 300ms | 200ms | 1500ms | 1683ms |

**Note:** Actual durations include browser/library overhead (~150-200ms), which is expected and acceptable for React + Framer Motion implementations.

---

### Phase Duration Comparison

Visual breakdown of how different spell types distribute time across phases:

#### Projectile Spells (Ice Shard, Fireball)

```
Ice Shard (900ms):
Charge   ████████ (44%)
Cast     ███ (17%)
Travel   █████ (28%)
Impact   ██ (11%)

Fireball (950ms):
Charge   ███████ (37%)
Cast     ███ (16%)
Travel   ██████ (32%)
Impact   ███ (16%)
```

**Pattern:**
- Charge: 35-45% (anticipation)
- Cast: 15-20% (release)
- Travel: 25-35% (projectile flight)
- Impact: 10-20% (hit confirmation)

**Design principle:** Projectiles emphasize travel phase for visual tracking.

---

#### Beam Spells (Lightning, Holy Beam)

```
Lightning (900ms):
Charge   ████████ (39%)
Cast     ██ (11%)
Strike   ████ (22%)
Impact   █████ (28%)

Holy Beam (1000ms):
Charge   ███████ (35%)
Cast     ███ (15%)
Beam     ███████ (35%)
Impact   ███ (15%)
```

**Pattern:**
- Charge: 35-40% (buildup)
- Cast: 10-15% (quick trigger)
- Beam/Strike: 20-35% (sustained or instant effect)
- Impact: 15-30% (extended reaction)

**Design principle:** Beam spells replace travel with sustained beam/instant strike, emphasize impact reaction.

---

#### AOE Spells (Meteor)

```
Meteor (1500ms):
Charge     ████████████ (40%)
Warning    ████████ (27%)
Impact     ██████ (20%)
Aftermath  ████ (13%)
```

**Pattern:**
- Charge: 40-45% (dramatic summoning)
- Warning: 25-30% (danger indicators)
- Impact: 20-25% (simultaneous explosions)
- Aftermath: 10-15% (lingering destruction)

**Design principle:** AOE emphasizes anticipation (charge + warning), uses aftermath to show scale.

---

### Recommended Timing Ranges by Spell Category

Use these as starting points when designing new spells:

#### Projectile Spells

| Attribute | Light | Medium | Heavy |
|-----------|-------|--------|-------|
| **Total Duration** | 800-900ms | 900-1000ms | 1000-1200ms |
| **Charge** | 300-400ms | 350-450ms | 450-600ms |
| **Cast** | 100-150ms | 150-200ms | 150-250ms |
| **Travel** | 200-300ms | 250-350ms | 300-450ms |
| **Impact** | 100-150ms | 150-200ms | 200-300ms |
| **Examples** | Ice Shard, Magic Dart | Fireball, Shadow Bolt | Meteor Strike (single) |

**Travel speed guidance:**
- <250ms: Feels instant, hard to track
- 250-350ms: Optimal tracking, deliberate feel
- >400ms: Feels slow, may frustrate players

---

#### Beam/Channel Spells

| Attribute | Light | Medium | Heavy |
|-----------|-------|--------|-------|
| **Total Duration** | 800-900ms | 900-1100ms | 1100-1400ms |
| **Charge** | 300-400ms | 350-450ms | 500-700ms |
| **Cast** | 100-150ms | 100-200ms | 150-250ms |
| **Beam** | 200-300ms | 300-400ms | 400-600ms |
| **Impact** | 150-250ms | 150-300ms | 200-400ms |
| **Examples** | Lightning Shock | Lightning Bolt, Holy Beam | Divine Judgment |

**Beam duration guidance:**
- <300ms: Feels like instant strike
- 300-400ms: Standard channeled beam
- >450ms: Sustained channel, high power

---

#### AOE Spells

| Attribute | Light | Medium | Heavy |
|-----------|-------|--------|-------|
| **Total Duration** | N/A* | 1200-1400ms | 1400-1800ms |
| **Charge** | N/A* | 500-600ms | 600-800ms |
| **Warning** | N/A* | 300-400ms | 400-500ms |
| **Impact** | N/A* | 250-350ms | 300-400ms |
| **Aftermath** | N/A* | 100-150ms | 200-300ms |
| **Examples** | - | Fire Nova | Meteor, Earthquake |

*Light AOE spells are uncommon; most AOE = heavy damage

**Warning duration guidance:**
- <350ms: Not enough time for players to process
- 350-450ms: Optimal for danger recognition
- >500ms: Feels slow, telegraph too obvious

---

#### Buff/Debuff Spells

| Attribute | Quick Buff | Standard Buff | Epic Buff |
|-----------|------------|---------------|-----------|
| **Total Duration** | 400-600ms | 600-800ms | 800-1000ms |
| **Charge** | 200-300ms | 300-400ms | 400-500ms |
| **Cast** | 100-150ms | 150-200ms | 200-250ms |
| **Effect Start** | 100-150ms | 150-200ms | 200-250ms |
| **Examples** | Quick Heal | Strength Buff, Holy Shield | Divine Intervention |

**Buff timing guidance:**
- Buffs don't need travel/impact phases
- Emphasize charge (gathering magic) and effect start (aura appears)
- Keep total duration shorter than damage spells (buffs feel bad if slow)
- Persistent effects (auras) start during "Effect Start" phase and continue

---

### Critical Hit Timing Adjustments

When implementing critical hit variations of spells:

**Add 10-20% duration to key phases:**

| Base Phase | Normal Duration | Critical Duration | Adjustment |
|------------|-----------------|-------------------|------------|
| Charge | 350ms | 385-420ms | +10-20% |
| Cast | 150ms | 165-180ms | +10-20% |
| Travel | 300ms | 300ms | No change (projectile speed same) |
| Impact | 150ms | 180-210ms | +20-40% (most emphasis) |
| **Total** | **950ms** | **1030-1110ms** | **+80-160ms** |

**Visual enhancements for crits:**
- Particle count: +50% (e.g., 18 → 27)
- Screen flash opacity: +50% (e.g., 0.15 → 0.225)
- Particle size: +20% (e.g., 6px → 7.2px)
- Glow intensity: +30%

**Example: Critical Fireball**
```typescript
const isCritical = damage > normalDamage;

const CHARGE_DURATION = isCritical ? 420 : 350;
const CAST_DURATION = isCritical ? 180 : 150;
const TRAVEL_DURATION = 300; // Same
const IMPACT_DURATION = isCritical ? 210 : 150;

const particleCount = isCritical ? 27 : 18;
const screenFlashOpacity = isCritical ? 0.225 : 0.15;
```

---

## Timing Best Practices

### Making Attacks Feel Responsive vs Powerful

The central challenge of combat animation timing: players want attacks to feel **responsive** (quick feedback) but also **powerful** (satisfying impact). Balance these through phase distribution.

#### Responsive Feel (Prioritize Speed)

**Characteristics:**
- Shorter charge phase (300-400ms)
- Quick cast (100-150ms)
- Fast total duration (800-1000ms)
- Immediate visual feedback

**When to use:**
- Low-cost, spammable attacks
- Quick reaction abilities
- Combo-based combat
- Fast-paced gameplay

**Timing strategy:**
```
Charge (short) → Cast (snap) → Execute (fast) → Impact (brief)
   35%             15%            30%              20%
```

**Example: Ice Shard**
- 400ms charge: Quick enough to not frustrate
- 150ms cast: Sharp release
- 250ms travel: Fast projectile
- 100ms impact: Instant confirmation
- **Feel: Snappy, responsive, "light" hit**

---

#### Powerful Feel (Prioritize Impact)

**Characteristics:**
- Extended charge phase (600-800ms)
- Longer impact phase (300-400ms)
- Aftermath effects (200-300ms)
- Dramatic total duration (1400-1800ms)

**When to use:**
- High-cost ultimate abilities
- Boss fight special moves
- Climactic story moments
- Reward for resource investment

**Timing strategy:**
```
Charge (long) → Warning → Impact (extended) → Aftermath
    40%          27%         20%               13%
```

**Example: Meteor**
- 600ms charge: Dramatic summoning, sky darkens
- 400ms warning: Danger indicators, anticipation builds
- 300ms impact: Multiple explosions, massive burst
- 200ms aftermath: Dust, craters, lingering effects
- **Feel: Epic, devastating, "heavy" destruction**

---

#### Balanced Feel (General Purpose)

**Characteristics:**
- Standard charge (350-450ms)
- Moderate execution (250-400ms)
- Satisfying impact (150-250ms)
- Balanced total (900-1100ms)

**When to use:**
- Standard combat spells
- Multi-purpose abilities
- Balanced gameplay
- Most common case

**Timing strategy:**
```
Charge → Cast → Execute → Impact
 37%     16%      32%       16%
```

**Example: Fireball**
- 350ms charge: Clear anticipation
- 150ms cast: Controlled release
- 300ms travel: Trackable projectile
- 150ms impact: Satisfying explosion
- **Feel: Deliberate, impactful, balanced**

---

### The Importance of "Snap" Moments

"Snap" refers to **quick transitions between phases** that create sharp, clear beats in the animation rhythm. These prevent animations from feeling mushy or unclear.

#### Where to Add Snap

1. **Cast Phase (Always)**
   - Transition from charge → cast should be <50ms
   - Use sharp easing (ease-in or linear)
   - Visual: Burst/flash effect
   - Feel: Moment of commitment

2. **Impact Start (Critical)**
   - First 2-3 frames of impact should be intense
   - Opacity: 0 → 1 instantly
   - Scale: Small jump (0.8 → 1.2)
   - Feel: Instant hit confirmation

3. **Projectile Launch**
   - Projectile should appear instantly at cast end
   - No gradual fade-in
   - Immediate motion
   - Feel: Crisp separation from caster

#### Example: Fireball Cast Phase (150ms)

**BAD (mushy):**
```typescript
animate={{
  opacity: [0, 0.3, 0.6, 0.8, 1],  // Gradual fade
  scale: [0.5, 0.7, 0.9, 1.1, 1.3], // Gradual grow
  transition: { duration: 0.15, ease: 'easeInOut' }
}}
// FEELS: Slow, unclear, lacks punch
```

**GOOD (snap):**
```typescript
animate={{
  opacity: [0, 1, 0],  // Instant on, quick off
  scale: [0.5, 2, 2.5], // Fast expansion
  transition: { duration: 0.15, ease: 'easeOut' }
}}
// FEELS: Sharp, clear, impactful
```

---

### Staggering Effects for Visual Clarity

When multiple effects happen simultaneously, **stagger them slightly** (50-100ms) for clarity.

#### Multi-Target Stagger

**Problem:** 3 enemies hit at exact same time = visual noise

**Solution:** Stagger impacts by 50-80ms

```typescript
// Meteor: 3 impact points
meteorImpacts.map((impact, index) => (
  <motion.div
    animate={{
      transition: {
        delay: index * 0.05 // 50ms stagger
      }
    }}
  />
))
// Result: Cascade effect, clear individual impacts
```

**Stagger timing guide:**
- **2 targets:** 50ms stagger
- **3-4 targets:** 50-80ms stagger
- **5+ targets:** 80-100ms stagger
- **>8 targets:** Consider wave groups (e.g., 4 hits, 100ms gap, 4 more hits)

---

#### Layered Effect Stagger

**Problem:** Particles + explosion + shockwave all start at 0ms = cluttered

**Solution:** Cascade effects by visual priority

```typescript
// Impact phase sequencing
const impactSequence = [
  { effect: 'coreFlash', delay: 0 },        // Instant
  { effect: 'shockwave', delay: 50 },       // 50ms after
  { effect: 'particles', delay: 30 },       // 30ms after
  { effect: 'screenFlash', delay: 40 },     // 40ms after
  { effect: 'secondaryBurst', delay: 100 }  // Later
];
```

**Priority order:**
1. Core flash/explosion (0ms)
2. Screen flash (30-50ms)
3. Particles (30-50ms)
4. Shockwave ring (50-80ms)
5. Secondary effects (100-150ms)

---

### Synchronizing Timing with Sound Effects

While sound implementation is a future task, design animations with audio in mind.

#### Audio Sync Points

**Recommended sound trigger timings:**

| Sound Type | Trigger Point | Example |
|------------|---------------|---------|
| **Charge SFX** | Charge phase start (0ms) | Energy gathering whoosh |
| **Cast SFX** | Cast phase start | Sharp release sound |
| **Projectile SFX** | Travel phase start | Whoosh, crackling, humming |
| **Impact SFX** | Impact phase start (most critical) | Explosion, crash, boom |
| **Aftermath SFX** | Aftermath phase start | Crackling, debris falling |

**Critical sync: Impact sound must match visual impact frame exactly**

```typescript
// When implementing audio
const handleImpactStart = () => {
  // Visual impact starts
  setPhase('impact');

  // Audio triggers at exact same moment
  audioManager.play('fireballExplosion');
};
```

---

### Testing Timing Feel

How to know if your timing is right:

#### The "Feel" Checklist

Play the animation 10 times and ask:

- [ ] **Does it feel too slow?** → Reduce charge/impact by 10-20%
- [ ] **Does it feel too fast?** → Extend charge phase
- [ ] **Can I track what happened?** → If not, slow execution or add snap
- [ ] **Does the impact feel satisfying?** → If not, extend impact or add particles
- [ ] **Would I get bored seeing this 100 times?** → If yes, reduce total duration
- [ ] **Does it communicate power level?** → Heavier = longer should feel true

#### Comparison Testing

Compare your animation to reference spells:

```
Your Spell vs Ice Shard (light reference):
- Is yours faster or slower?
- Should it be?
- Does relative timing feel right?

Your Spell vs Fireball (medium reference):
- Similar power level?
- Similar duration?
- Feel appropriately balanced?

Your Spell vs Meteor (heavy reference):
- Less epic? Good.
- If more epic, justify the longer duration.
```

#### Playtest Feedback Signals

**"That felt good!"** → Timing is correct
**"That was quick!"** → Either good (light) or too fast (heavy)
**"That took forever!"** → Too slow for frequency of use
**"I couldn't see what happened"** → Too fast execution, needs clarity
**"That was satisfying!"** → Impact phase is good
**"Meh"** → Needs more impact duration or effects

---

## Special Timing Considerations

### Critical Hits (Enhanced Versions)

Critical hits should feel **noticeably more impactful** without drastically slowing combat.

**Timing Adjustment Strategy:**

1. **Extend impact phase by 30-50%**
   - Normal: 150ms → Critical: 195-225ms
   - Most impactful change for player perception

2. **Slightly extend charge by 10-20%**
   - Normal: 350ms → Critical: 385-420ms
   - Subtle buildup enhancement

3. **Keep execution same**
   - Travel/beam duration unchanged
   - Maintains projectile speed consistency

4. **Add flash/shake at impact**
   - Stronger screen flash (+50% opacity)
   - Camera shake (if system exists)
   - Larger particle burst (+50% count)

**Example: Critical Fireball**

```typescript
const IMPACT_DURATION = isCritical ? 225 : 150;  // +50%
const CHARGE_DURATION = isCritical ? 420 : 350;  // +20%
const TRAVEL_DURATION = 300;                     // Unchanged

// Enhanced visuals
const particleCount = isCritical ? 42 : 28;      // +50%
const screenFlashOpacity = isCritical ? 0.225 : 0.15;
const explosionScale = isCritical ? 3.5 : 2.5;
```

**Total duration increase:**
- Normal: 950ms
- Critical: 1095ms
- **Difference: +145ms (+15%)**

**Design rationale:**
- 145ms longer is noticeable but not frustrating
- Impact extension gives payoff feeling
- Player associates longer impact = bigger hit
- Doesn't slow combat pacing significantly

---

### Multi-Target Attacks (Stagger Timing)

When a spell hits multiple targets, stagger for visual clarity and performance.

#### Stagger Strategies

**Strategy 1: Sequential Cascade**

```typescript
// Hit enemies one at a time
targets.forEach((target, index) => {
  const delay = index * 80; // 80ms between each
  animateTarget(target, delay);
});

// Timeline:
// Target 1: 0ms
// Target 2: 80ms
// Target 3: 160ms
// Target 4: 240ms
```

**Use when:**
- Projectile bounces between targets
- Chain lightning effect
- Sequential attack flavor

**Pros:** Very clear, reads as deliberate targeting
**Cons:** Slow if many targets (6+ targets = 400ms+)

---

**Strategy 2: Wave Groups**

```typescript
// Hit in groups of 3-4
const WAVE_SIZE = 3;
const WAVE_DELAY = 150;

targets.forEach((target, index) => {
  const waveIndex = Math.floor(index / WAVE_SIZE);
  const withinWaveDelay = (index % WAVE_SIZE) * 30; // Small stagger within wave
  const delay = (waveIndex * WAVE_DELAY) + withinWaveDelay;
  animateTarget(target, delay);
});

// Timeline (6 targets):
// Wave 1: 0ms, 30ms, 60ms
// Wave 2: 150ms, 180ms, 210ms
```

**Use when:**
- Many targets (5+)
- AOE explosion effect
- Balanced between clarity and speed

**Pros:** Handles many targets, still clear
**Cons:** More complex to implement

---

**Strategy 3: Radial Spread**

```typescript
// Hit targets based on distance from epicenter
const sorted = targets.sort((a, b) =>
  distance(epicenter, a) - distance(epicenter, b)
);

sorted.forEach((target, index) => {
  const delay = index * 60; // Expanding outward
  animateTarget(target, delay);
});
```

**Use when:**
- Explosion/shockwave flavor
- Center-out AOE
- Physics-based feel

**Pros:** Looks physically realistic
**Cons:** Requires distance calculation

---

#### Stagger Timing Recommendations

| Target Count | Strategy | Stagger Per Target | Total Added Time |
|--------------|----------|-------------------|------------------|
| **2 targets** | Sequential | 50ms | +50ms |
| **3 targets** | Sequential | 50-80ms | +100-160ms |
| **4 targets** | Sequential | 60-80ms | +180-240ms |
| **5-6 targets** | Wave Groups (3 per wave) | 30ms within, 150ms between waves | +180-240ms |
| **7-10 targets** | Wave Groups (4 per wave) | 30ms within, 150ms between waves | +300-450ms |
| **10+ targets** | Radial or Waves | 40-60ms | Cap at +500ms max |

**Golden rule:** Total stagger time should not exceed base animation duration.

**Example:**
- Meteor base impact: 300ms
- Multi-target stagger: Max +300ms
- Total: Up to 600ms impact phase for massive AOE

---

### Chain Reactions (Sequential Effects)

When one effect triggers another (e.g., lightning jumps between enemies):

#### Chain Timing Pattern

```typescript
// Lightning Chain: 3 jumps
const JUMP_TRAVEL = 150;  // Travel between targets
const JUMP_IMPACT = 100;  // Impact at each target

targets.forEach((target, index) => {
  const jumpDelay = index * (JUMP_TRAVEL + JUMP_IMPACT);

  // Travel to this target
  animateJumpTravel(prevTarget, target, jumpDelay, JUMP_TRAVEL);

  // Impact at this target
  animateJumpImpact(target, jumpDelay + JUMP_TRAVEL, JUMP_IMPACT);
});

// Timeline:
// Jump 1: 0-150ms travel, 150-250ms impact
// Jump 2: 250-400ms travel, 400-500ms impact
// Jump 3: 500-650ms travel, 650-750ms impact
// Total: 750ms for 3-jump chain
```

**Chain reaction timing guide:**
- Jump travel: 100-150ms (fast, electric feel)
- Jump impact: 80-120ms (brief confirmation)
- Max chain length: 5 jumps (to avoid tedium)
- Total duration: 250-300ms per jump

---

### Persistent Effects (Buff Auras, Status Overlays)

Effects that remain on screen after animation completes:

#### Persistent Effect Strategy

**Phase 1: Appearance (300-500ms)**
- Aura fades in
- Particles gather
- Effect color establishes

**Phase 2: Idle Loop (indefinite)**
- Subtle pulsing (opacity: 0.6 ↔ 0.8)
- Slow rotation (360° over 3-5 seconds)
- Occasional sparkle particles

**Phase 3: Removal (200-300ms)**
- Fade out when buff expires
- Particles dissipate upward

**Example: Strength Buff Aura**

```typescript
// Appearance (400ms)
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{
    opacity: [0, 0.7],
    scale: [0.8, 1.1, 1],
    transition: { duration: 0.4 }
  }}
>
  {/* Aura appears */}
</motion.div>

// Idle Loop (continuous while buff active)
<motion.div
  animate={{
    opacity: [0.6, 0.8, 0.6],
    rotate: [0, 360],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'linear'
    }
  }}
>
  {/* Pulsing aura */}
</motion.div>

// Removal (300ms when buff expires)
<motion.div
  animate={{
    opacity: [0.7, 0],
    scale: [1, 1.3],
    y: -50,
    transition: { duration: 0.3 }
  }}
>
  {/* Aura dissipates */}
</motion.div>
```

**Persistent effect timing rules:**
- Appearance: 300-500ms (clear visual)
- Idle pulse: 3-5 second cycles (subtle, not distracting)
- Removal: 200-400ms (clean fade)
- Particle emission: 1-2 particles per second during idle (low overhead)

---

### Combo Attacks (Rapid Succession)

When player casts multiple spells quickly:

#### Overlap Strategy

**Problem:** Full 1000ms animation every cast = sluggish combo feel

**Solution:** Allow next cast to start before previous completes

```typescript
// Allow new cast when previous reaches travel/impact phase
const COMBO_OVERLAP = 400; // ms before previous animation completes

if (timeSincePreviousCast > (TOTAL_DURATION - COMBO_OVERLAP)) {
  allowNextCast = true;
}

// Timeline:
// Cast 1: |--Charge--Cast--Travel--Impact--|
// Cast 2:                 |--Charge--Cast--Travel--Impact--|
//                         ^ Can start here (400ms before end)
```

**Combo timing guidelines:**
- Overlap window: 300-500ms before completion
- Prevents animation spam (still requires waiting)
- Maintains visual clarity (one spell finishes before next fully starts)
- Faster combat feel without sacrificing animation quality

---

## Summary Quick Reference

### Phase Duration Standards

| Phase | Light | Medium | Heavy |
|-------|-------|--------|-------|
| Charge | 300-400ms | 350-450ms | 600-800ms |
| Cast | 100-150ms | 150-200ms | 200-300ms |
| Execution | 200-300ms | 250-400ms | 300-500ms |
| Impact | 100-150ms | 150-250ms | 300-400ms |
| Aftermath | - | 0-100ms | 200-300ms |
| **Total** | **800-1000ms** | **900-1100ms** | **1400-1800ms** |

### Frame Budgets (60fps)

- **Component render:** <5ms per frame
- **Light attack:** 48-60 frames (800-1000ms)
- **Medium attack:** 54-66 frames (900-1100ms)
- **Heavy attack:** 84-108 frames (1400-1800ms)

### Performance Targets

- **Frame rate:** 60fps (16.67ms per frame)
- **Particle max:** 30 per phase (20 recommended)
- **Dropped frames:** 0 acceptable
- **Memory growth:** <2MB per animation

### Stagger Timings

- **2-3 targets:** 50-80ms per target
- **4-6 targets:** Wave groups, 30ms within, 150ms between
- **Chain reactions:** 100-150ms per jump
- **Critical hits:** +10-20% duration, +30-50% impact

---

**For implementation examples, see:**
- `/src/components/combat/animations/variants/*.tsx` - Live spell implementations
- `/docs/animations/reports/timing-verification.md` - Measured performance data
- `/docs/animations/guides/design-principles.md` - Visual design guidelines

**Next steps:**
- Use these guidelines when designing new animations
- Measure actual timing with test harness
- Adjust based on playtesting feedback
- Maintain relative timing between spell types
