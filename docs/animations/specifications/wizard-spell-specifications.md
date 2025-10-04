# Wizard Spell Animation Specifications

**Version:** 1.0
**Date:** 2025-10-04
**Status:** Complete
**Coverage:** All 10 wizard spells (5 offensive + 4 support + 1 arcane)

---

## Introduction

This document provides complete technical and visual specifications for all wizard spell animations in the RPG combat system. Each spell is documented with phase breakdowns, timing details, particle counts, color palettes, and implementation notes.

**Purpose:** Enable designers, developers, and QA to understand, recreate, verify, and extend spell animations.

**Audience:** Animation designers, front-end developers, QA testers, game designers

---

## Table of Contents

### Offensive Spells (Damage-Dealing)
1. [Fireball](#1-fireball) - Fire projectile (medium attack)
2. [Ice Shard](#2-ice-shard) - Ice projectile (light attack)
3. [Lightning](#3-lightning) - Lightning strike (medium attack)
4. [Holy Beam](#4-holy-beam) - Holy column of light (medium attack)
5. [Meteor](#5-meteor) - Fire AOE (heavy attack)

### Support Spells (Healing & Buffs)
6. [Heal](#6-heal) - Nature healing
7. [Protect](#7-protect) - Defense buff with shield barrier
8. [Shell](#8-shell) - Magic defense buff with mystical aura
9. [Haste](#9-haste) - Speed buff with motion streaks

### Arcane Spells
10. [Magic Bolt](#10-magic-bolt) - Arcane projectile (light attack)

### Reference Tables
- [Spell Comparison Table](#spell-comparison-table)
- [Quick Reference Card](#quick-reference-card)

---

## Spell Specifications

---

## 1. Fireball

### Spell Overview

**Name:** Fireball
**Spell ID:** `fire`
**Element:** Fire
**Category:** Offensive projectile
**Attack Weight:** Medium
**Total Duration:** 950ms (actual: ~1138ms with overhead)
**Game Mechanics:** Medium fire damage to single target

### Visual Description

A classic fireball spell that embodies explosive power and heat. The caster channels red and orange flames that swirl around their hand before launching a spinning fireball projectile that leaves a trail of fire particles. On impact, the fireball explodes in a brilliant burst of flame with radial scattering particles and a satisfying screen flash.

**Key Visual Elements:**
- Swirling red/orange particles during charge
- Pulsing glows with increasing intensity
- Spinning fireball core with visible rotation (720° during travel)
- Trailing fire particles that fade and fall
- Explosive radial burst on impact
- Screen flash and shockwave ring

**Motion Characteristics:**
- Charge: Gathering energy with increasing intensity
- Cast: Quick burst release
- Travel: Rapid spinning projectile with trailing flames
- Impact: Explosive expansion with radial particle scatter

**What Makes It Distinct:** The rotating fireball core, fiery trail, and explosive impact with multiple particle bursts create an unmistakably powerful fire spell.

### Phase-by-Phase Breakdown

#### Phase 1: Charge (350ms)

**Visual Elements:**
- 18 red/orange particles swirling around caster position
- Inner concentrated glow (40px diameter)
- Pulsing outer glow (60px diameter, expanding)

**Particle Details:**
- Count: 18 particles
- Colors: Fire orange (#ff6b35), red (#ff4444)
- Spread: 60px radius
- Size: 6px
- Behavior: Swirl pattern, no gravity

**Motion & Timing:**
- Inner glow: Opacity 0 → 0.8, Scale 0 → 1.2 (ease-out)
- Outer glow: Opacity 0 → 0.4, Scale 0.5 → 1.3 (ease-in-out)
- Particles: Continuous swirl with fade-out disabled

**Color Palette:**
- Primary: #ff6b35 (fire orange)
- Secondary: #ff4444 (red)
- Accent: #ffaa00 (yellow-orange)

**Code Implementation:**
```tsx
<ParticleSystem
  particleCount={18}
  colors={[FIRE_COLORS.primary, FIRE_COLORS.secondary]}
  spread={60}
  lifetime={350}
  size={6}
  gravity={0}
  fadeOut={true}
/>
```

#### Phase 2: Cast (150ms)

**Visual Elements:**
- Burst flash (80px diameter) expanding to 2x size
- 12 burst particles radiating outward
- Bright flash with yellow-orange accent color

**Particle Details:**
- Count: 12 particles
- Colors: Fire orange, yellow-orange accent
- Spread: 100px radius
- Size: 8px
- Behavior: Radial burst, no gravity

**Motion & Timing:**
- Burst flash: Opacity 0 → 1 → 0, Scale 0.5 → 2.5 (ease-out)
- Particles: Explosive spread with quick fade
- Duration: 150ms total

**Color Palette:**
- Accent flash: #ffaa00 (yellow-orange)
- Primary: #ff6b35
- Background: Radial gradient from accent to primary

#### Phase 3: Travel (300ms)

**Visual Elements:**
- Main fireball projectile (24px diameter)
- Spinning fire core (20px diameter, rotating 720°)
- 15 trailing particles following projectile path
- Particle trail with downward gravity effect

**Particle Details:**
- Trail count: 15 particles
- Colors: Orange (#ff6b35), red (#ff4444)
- Spread: 30px
- Size: 5px
- Gravity: 20 (downward pull for realistic trail)

**Motion & Timing:**
- Projectile: Linear travel from caster to target (300ms)
- Core rotation: 0° → 720° (two full spins, linear easing)
- Trail particles: Continuous emission, 60% of travel duration lifetime
- Glow intensity: 1.2x standard

**Trajectory:**
- Start: Caster position (X, Y)
- End: Target position (X, Y)
- Path: Straight line
- Speed: Constant (linear easing)

#### Phase 4: Impact (150ms)

**Visual Elements:**
- Core explosion flash (120px diameter)
- Explosion ring shockwave (expanding 3x)
- 28 primary explosion particles radiating outward
- 15 secondary particle burst
- Screen flash effect (15% opacity)

**Particle Details:**
- Primary burst: 28 particles (spread: 150px)
- Secondary burst: 15 particles (spread: 100px)
- Colors: All three fire colors (primary, secondary, accent)
- Size: 8px (primary), 6px (secondary)
- Gravity: 80 (fast downward fall)

**Motion & Timing:**
- Core flash: Opacity 0 → 1 → 0.6 → 0, Scale 0 → 2.5 (ease-out)
- Shockwave ring: Opacity 0.8 → 0, Scale 0 → 3 (cubic-bezier)
- Particles: Radial explosion with high gravity
- Screen flash: 0 → 0.15 → 0 (full-screen red overlay)

**Special Effects:**
- Screen shake: Implied through visual impact
- Shockwave: Expanding ring with border (3px solid primary color)
- Layered explosions: Core + primary burst + secondary burst

### Technical Specifications

**Total Duration:** 950ms (specified), ~1138ms (actual with overhead)

**Phase Timings Table:**

| Phase | Duration | Start Time | End Time | Easing |
|-------|----------|------------|----------|--------|
| Charge | 350ms | 0ms | 350ms | ease-out |
| Cast | 150ms | 350ms | 500ms | ease-out |
| Travel | 300ms | 500ms | 800ms | linear |
| Impact | 150ms | 800ms | 950ms | ease-out |

**Particle Count Breakdown:**

| Phase | Particle Count | Peak Simultaneous |
|-------|---------------|-------------------|
| Charge | 18 | 18 |
| Cast | 12 | 12 |
| Travel | 15 (trail) | ~8-10 |
| Impact | 43 (28 + 15) | 43 |
| **Total** | **88** | **~50** |

**Color Palette:**
- Primary: `#ff6b35` (fire orange)
- Secondary: `#ff4444` (red)
- Accent: `#ffaa00` (yellow-orange)

**Key Components Used:**
- `ParticleSystem` (charge, cast, travel trail, impact bursts)
- `Projectile` (main fireball)
- `motion.div` (glows, flashes, shockwave, screen effect)

**Performance Metrics:**
- Target FPS: 60fps
- Actual FPS: 60fps sustained
- Render time: <5ms per frame
- GPU compliance: 100% (transform/opacity only)

### Visual Mockup/Timeline

```
Timeline (ASCII representation):
0ms                    350ms       500ms           800ms     950ms
|----------------------|-----------|---------------|---------|
[==== CHARGE ====][CAST][=== TRAVEL ===][= IMPACT =]

Frame 0ms:     [Caster neutral, hand raised]
Frame 175ms:   [Swirling particles intensify, inner glow brightens]
Frame 350ms:   [Particles converge, energy peaks]
Frame 425ms:   [FLASH! Burst of particles radiate outward]
Frame 500ms:   [Fireball launches from hand, spinning rapidly]
Frame 650ms:   [Fireball mid-flight, trailing flames] ─────>
Frame 800ms:   [Fireball reaches target] ⚡ IMPACT!
Frame 875ms:   [Massive explosion, particles scatter radially]
Frame 950ms:   [Smoke dissipates, final particles fade]

Motion Diagram:
Charge:   Caster ⟲ [gathering particles]
Cast:     Caster → ⚡ [burst release]
Travel:   Caster ----------🔥-----> Target
Impact:   Target ☀️ [radial explosion]
```

### Variations & Alternatives

**Critical Hit Version:**
- Increase particle counts by 50% (27 charge, 18 cast, 42/22 impact)
- Add second shockwave ring with offset timing
- Enhance screen flash to 25% opacity
- Add slow-motion during impact (scale duration to 200ms)

**Miss Version:**
- Same charge and cast phases
- Travel: Projectile veers off-target (add random X/Y offset)
- Impact: Small puff effect at miss location (8 particles, no shockwave)
- Duration: 800ms total (no impact explosion)

**Alternative Ideas:**
- **Delayed Explosion:** Fireball embeds in target before exploding (add 200ms delay)
- **Multi-Hit:** Split into 3 smaller fireballs during travel
- **Charged Version:** Hold charge phase longer for bigger explosion (scale impact particles)

### Polish Recommendations

**Additional Juice:**
- **Screen Shake:** 4-6px horizontal shake for 150ms during impact
- **Color Flash:** Brief red tint on target character sprite
- **Damage Numbers:** Large orange/red numbers rising from impact (28px font, +60px vertical motion)
- **Post-Impact Effects:**
  - Lingering smoke particles (8 particles, 400ms duration, upward drift)
  - Scorch mark decal at impact location (fade over 2s)
  - Heat distortion shader effect (200ms duration)
- **Sound Cues:**
  - Charge: Crackling fire building up
  - Cast: Whoosh release
  - Travel: Roaring flame
  - Impact: Thunder-like explosion

### Performance Notes

**Optimizations Applied:**
- React.memo() wrapper prevents unnecessary re-renders
- GPU-accelerated properties only (transform, opacity)
- Particle counts within recommended limits (all <30 per effect)
- Conditional rendering by phase (only active phase renders)

**Concerns/Warnings:** None. Animation performs excellently at 60fps.

---

## 2. Ice Shard

### Spell Overview

**Name:** Ice Shard
**Spell ID:** `ice`
**Element:** Ice
**Category:** Offensive projectile
**Attack Weight:** Light
**Total Duration:** 900ms (actual: ~1080ms with overhead)
**Game Mechanics:** Light ice damage to single target, potential slow effect

### Visual Description

A sharp, crystalline ice spell that emphasizes precision and cold elegance. Blue particles converge inward to form a crystal, which then launches as a rapidly spinning triangular shard with a frozen vapor trail. On impact, the shard shatters into 8 angular fragments that scatter outward, creating a satisfying ice-breaking effect with frost clouds.

**Key Visual Elements:**
- Converging blue particles (negative spread for inward motion)
- Hexagonal crystal pattern during charge
- Sharp triangular shard projectile
- Rapidly rotating shard (900° during travel = 2.5 spins)
- Frozen vapor trail
- Angular shard fragments on impact (8 directions at 45° intervals)
- Frost cloud and blue screen flash

**Motion Characteristics:**
- Charge: Particles flowing inward, crystal coalescing
- Cast: Frost mist burst
- Travel: Rapid spinning with frozen trail
- Impact: Sharp angular shatter pattern

**What Makes It Distinct:** The inward-converging charge, hexagonal crystal formation, angular triangular shard, and geometric shatter pattern create a precise, cold aesthetic distinct from fire's chaotic energy.

### Phase-by-Phase Breakdown

#### Phase 1: Charge (400ms)

**Visual Elements:**
- 15 converging ice crystals (negative spread = inward motion)
- Crystalline formation glow (50px diameter)
- Hexagonal crystal pattern (40px, rotating 120°)
- Frost mist gathering around caster (70px diameter)

**Particle Details:**
- Count: 15 particles
- Colors: Ice blue (#4da6ff), light blue (#b3e0ff), white (#ffffff)
- Spread: -70px (negative = converge inward)
- Size: 5px
- Behavior: Converging inward, no gravity, no fade

**Motion & Timing:**
- Crystal glow: Opacity 0 → 0.9, Scale 0 → 1.1 (ease-in)
- Hexagonal pattern: Opacity 0 → 0.8, Rotation 0° → 120°
- Frost mist: Opacity 0 → 0.4, Scale 1.5 → 0.8 (gathering inward)
- Duration: 400ms (slower than Fireball for crystal formation)

**Color Palette:**
- Primary: #4da6ff (ice blue)
- Secondary: #b3e0ff (light blue)
- Accent: #ffffff (white highlights)

**Code Implementation:**
```tsx
<ParticleSystem
  particleCount={15}
  colors={[ICE_COLORS.primary, ICE_COLORS.secondary, ICE_COLORS.accent]}
  spread={-70} // Negative = inward convergence
  lifetime={400}
  size={5}
  gravity={0}
  fadeOut={false}
/>
```

#### Phase 2: Cast (150ms)

**Visual Elements:**
- Frost mist explosion (80px diameter, expanding to 2.5x)
- 10 crystalline shards bursting outward
- Flash effect (60px diameter)

**Particle Details:**
- Count: 10 particles
- Colors: White accent, ice blue primary
- Spread: 120px radius
- Size: 6px
- Behavior: Radial burst

**Motion & Timing:**
- Frost mist: Opacity 0 → 0.8 → 0, Scale 0.5 → 2.5 (ease-out)
- Flash: Opacity 0 → 0.6 → 0 (blue-white flash)
- Crystalline shards: Explosive spread
- Duration: 150ms

#### Phase 3: Travel (250ms)

**Visual Elements:**
- Main ice shard projectile (22px diameter, glowing)
- Sharp triangular shard (28px height, rotating 900°)
- 10 frozen trail particles
- Frost vapor trail (15px diameter, fading)

**Particle Details:**
- Trail count: 10 particles
- Colors: Light blue, white accent
- Spread: 25px
- Size: 4px
- Gravity: -10 (slight upward float for cold vapor effect)

**Motion & Timing:**
- Shard: Linear travel (250ms, faster than Fireball)
- Rotation: 0° → 900° (2.5 rapid spins, linear easing)
- Trail particles: 70% lifetime (175ms)
- Vapor trail: Opacity 0 → 0.4 → 0 (linear fade)
- Shape: CSS triangle using borders (rotates from base)

**Shard Shape (CSS):**
```css
border-left: 8px solid transparent;
border-right: 8px solid transparent;
border-bottom: 28px solid #4da6ff;
```

#### Phase 4: Impact (100ms)

**Visual Elements:**
- Core shatter burst (80px diameter)
- 8 ice fragment shards (radiating at 0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°)
- 22 shatter particles
- Frost cloud (100px diameter)
- Blue screen flash (10% opacity)

**Particle Details:**
- Shatter particles: 22 particles
- Colors: All ice colors (primary, secondary, accent)
- Spread: 130px radius
- Size: 6px
- Gravity: 100 (fast fall for ice shards)

**Motion & Timing:**
- Core burst: Opacity 0 → 1 → 0, Scale 0 → 1.8 (ease-out)
- Fragment shards: Angular projection along 8 directions (50px distance)
  - Each shard rotates 180° during flight
  - Triangular shape (12px height)
  - Opacity 0 → 1 → 0.7 → 0
- Frost cloud: Opacity 0 → 0.6 → 0, Scale 0.5 → 2.5 (ease-out)
- Screen flash: 0 → 0.1 → 0 (blue tint)
- Duration: 100ms (fastest impact - sharp and crisp)

**Special Effects:**
- Angular shatter pattern creates geometric aesthetic
- Fragment shards are small triangular CSS shapes
- Frost cloud is diffuse and soft (contrasts with sharp shards)

### Technical Specifications

**Total Duration:** 900ms (specified), ~1080ms (actual with overhead)

**Phase Timings Table:**

| Phase | Duration | Start Time | End Time | Easing |
|-------|----------|------------|----------|--------|
| Charge | 400ms | 0ms | 400ms | ease-in |
| Cast | 150ms | 400ms | 550ms | ease-out |
| Travel | 250ms | 550ms | 800ms | linear |
| Impact | 100ms | 800ms | 900ms | ease-out |

**Particle Count Breakdown:**

| Phase | Particle Count | Peak Simultaneous |
|-------|---------------|-------------------|
| Charge | 15 | 15 |
| Cast | 10 | 10 |
| Travel | 10 (trail) | ~6-7 |
| Impact | 22 + 8 shards | 30 |
| **Total** | **57** | **~35** |

**Color Palette:**
- Primary: `#4da6ff` (ice blue)
- Secondary: `#b3e0ff` (light blue)
- Accent: `#ffffff` (white)

**Key Components Used:**
- `ParticleSystem` (charge, cast, travel trail, impact)
- `Projectile` (main shard base)
- `motion.div` (triangular shard shape, fragments, glows, frost clouds)

**Performance Metrics:**
- Target FPS: 60fps
- Actual FPS: 60fps sustained
- Render time: <5ms per frame
- GPU compliance: 100%

### Visual Mockup/Timeline

```
Timeline:
0ms                    400ms       550ms      800ms  900ms
|----------------------|-----------|----------|------|
[===== CHARGE =====][CAST][= TRAVEL =][IMPACT]

Frame 0ms:     [Particles begin converging inward toward caster]
Frame 200ms:   [Hexagonal crystal forming, particles dense]
Frame 400ms:   [Crystal fully formed, glowing bright blue]
Frame 475ms:   [Frost mist burst, shard launching]
Frame 550ms:   [Triangular shard spins rapidly] ▲
Frame 675ms:   [Shard mid-flight, frozen trail] ─────▲──→
Frame 800ms:   [Shard strikes target] ⚡ SHATTER!
Frame 850ms:   [8 angular fragments scatter outward in star pattern]
Frame 900ms:   [Frost cloud dissipates]

Motion Diagram:
Charge:   Particles → → Caster ← ← [converging inward]
Cast:     Caster ⚡ [frost burst]
Travel:   Caster ---------▲-------> Target [spinning triangle]
Impact:   Target ❄ * [angular shatter, 8 directions]
```

### Variations & Alternatives

**Critical Hit Version:**
- 12 fragment shards instead of 8 (add 30° offset positions)
- Increase shatter particles to 32
- Add secondary frost wave expanding outward
- Slower rotation during shatter (slow-motion effect)

**Miss Version:**
- Same charge and cast
- Shard flies past target with continued rotation
- Small frost puff where it would have hit (5 particles)

**Alternative Ideas:**
- **Freeze Effect:** Ice crystals form around target briefly before shattering
- **Multi-Shard:** 3 smaller shards in spread pattern
- **Piercing:** Shard continues through target to secondary enemy

### Polish Recommendations

**Additional Juice:**
- **Screen Shake:** 2-3px subtle shake (lighter than Fireball)
- **Freeze Frame:** 1-frame pause on impact for crisp shatter feel
- **Damage Numbers:** Icy blue numbers with crystalline edges
- **Post-Impact:**
  - Ice crystals remain on ground (fade over 3s)
  - Frozen breath particles (6 particles, slow upward drift)
  - Frost shader on target character (200ms duration)
- **Sound Cues:**
  - Charge: Crystallizing chime building
  - Cast: Sharp whistle
  - Travel: Cutting wind sound
  - Impact: Glass breaking with ice crunch

### Performance Notes

**Optimizations Applied:**
- React.memo() wrapper
- GPU-only properties
- Efficient CSS shapes for triangular shards (no SVG overhead)
- Particle counts well within limits

**Special Implementation Notes:**
- Hexagonal pattern uses CSS clip-path
- Triangular shard uses border CSS trick for performance
- Fragment shards are reusable div elements with transforms

---

## 3. Lightning

### Spell Overview

**Name:** Lightning Bolt
**Spell ID:** `lightning`
**Element:** Lightning
**Category:** Offensive instant
**Attack Weight:** Medium
**Total Duration:** 900ms (actual: ~1016ms with overhead)
**Game Mechanics:** Medium lightning damage, instant strike from sky

### Visual Description

An electrifying spell that calls down a bolt of lightning from the heavens. Electric sparks crackle around the caster before they point upward, channeling energy skyward. A jagged lightning bolt instantly strikes from above, followed by continuous electrical arcs and crackling energy at the impact point. Yellow and white colors create a brilliant, shocking effect.

**Key Visual Elements:**
- Crackling electric sparks during charge
- Pulsing electric aura (6-stage pulse cycle)
- Erratic electric arcs (flickering pattern)
- Upward energy burst when casting
- Jagged lightning bolt path (8 segments with random deviation)
- Secondary thinner bolt (offset for depth)
- Sky flash effect
- Continuous electrical burst at impact with 8 radial arcs
- Lingering erratic electric arcs

**Motion Characteristics:**
- Charge: Erratic crackling with irregular pulses
- Cast: Sharp upward energy release
- Strike: Instant bolt from sky to target (200ms animation)
- Impact: Extended electrical bursts and arcs (250ms)

**What Makes It Distinct:** The instant vertical strike, jagged bolt path, erratic motion patterns, and extended electrical aftermath create the feeling of raw, chaotic electrical power.

### Phase-by-Phase Breakdown

#### Phase 1: Charge (350ms)

**Visual Elements:**
- 12 crackling electric sparks around caster
- Pulsing electric aura (60px diameter, 6-stage animation)
- 3 erratic electric arcs (40px length, flickering)
- Gathering energy glow (40px diameter)

**Particle Details:**
- Count: 12 particles
- Colors: Yellow (#ffeb3b), light yellow (#fff176), white (#ffffff)
- Spread: 50px radius
- Size: 4px
- Behavior: Random crackling, no gravity

**Motion & Timing:**
- Electric aura: 6-stage pulse pattern
  - Opacity: [0, 0.6, 0.4, 0.6, 0.4, 0.7]
  - Scale: [0.8, 1.1, 0.9, 1.2, 1, 1.3]
  - Duration: 350ms
- Electric arcs: Flickering on/off pattern
  - Opacity: [0, 1, 0, 1, 0] (rapid pulses)
  - 3 arcs at 0°, 120°, 240° rotation
  - Staggered delays (0ms, 80ms, 160ms)
- Gathering glow: Opacity 0 → 0.7 (ease-in)

**Color Palette:**
- Primary: #ffeb3b (yellow)
- Secondary: #fff176 (light yellow)
- Accent: #ffffff (white flash)

**Code Implementation:**
```tsx
<ParticleSystem
  particleCount={12}
  colors={[LIGHTNING_COLORS.primary, LIGHTNING_COLORS.secondary, LIGHTNING_COLORS.accent]}
  spread={50}
  lifetime={350}
  size={4}
  gravity={0}
  fadeOut={true}
/>
```

#### Phase 2: Cast (100ms)

**Visual Elements:**
- Upward energy burst (6px width, 80px height)
- Flash at caster position (50px diameter)
- 8 upward sparks

**Particle Details:**
- Count: 8 particles
- Colors: Yellow, white accent
- Spread: 40px
- Size: 4px
- Gravity: -150 (strong upward motion)

**Motion & Timing:**
- Energy beam: Vertical gradient, upward motion (-80px)
  - Opacity: 0 → 1 → 0.8
  - ScaleY: 0 → 1.5 → 1
  - Duration: 100ms (fast cast)
- Flash: Opacity 0 → 1 → 0.6, Scale 0.5 → 1.5 → 1.2
- Upward sparks: Strong -150 gravity, 100ms lifetime

#### Phase 3: Strike (200ms)

**Visual Elements:**
- Primary jagged lightning bolt (SVG path, 8 segments)
- Secondary offset bolt (2px width, 3px offset)
- Sky flash (200px width at top of screen)
- Strike point glow (60px diameter)

**Bolt Path Generation:**
- Starts at (targetX, 0) - top of screen
- 8 segments down to target position
- Random deviation: ±30px per segment
- Jagged appearance from segment-to-segment variation

**Motion & Timing:**
- Primary bolt:
  - PathLength: 0 → 1 (draws bolt downward)
  - Opacity: 0 → 1 → 0.8
  - StrokeWidth: 4px
  - Color: White accent (#ffffff)
  - Duration: 200ms (instant feel)
- Secondary bolt:
  - Same path, delayed 20ms
  - Opacity: 0 → 0.6 → 0.4
  - StrokeWidth: 2px
  - 3px translateX offset
- Sky flash: Radial gradient at top (200px × 150px)
  - Opacity: 0 → 0.3 → 0.2 → 0
- Strike point glow: Opacity 0 → 1 → 0.8, Scale 0 → 1.5 → 1.3

**Code Implementation:**
```tsx
// Bolt path generation
const generateLightningPath = () => {
  const segments = 8;
  const maxDeviation = 30;
  let path = `M ${targetX} 0`;
  const stepY = targetY / segments;
  let currentX = targetX;

  for (let i = 1; i <= segments; i++) {
    const deviation = (Math.random() - 0.5) * maxDeviation;
    currentX += deviation;
    path += ` L ${currentX} ${stepY * i}`;
  }
  return path;
};
```

#### Phase 4: Impact (250ms)

**Visual Elements:**
- Central electric burst (100px diameter, 5-stage animation)
- 8 radial electric arcs (60px length, extending from impact point)
- 24 crackling electric particles
- 4 lingering erratic arcs
- Shockwave ring (100px diameter)
- Yellow screen flash (20% opacity max)

**Particle Details:**
- Count: 24 particles
- Colors: All lightning colors (yellow, light yellow, white)
- Spread: 120px radius
- Size: 5px
- Gravity: 0 (float in air)

**Motion & Timing:**
- Central burst:
  - Opacity: [0, 1, 0.7, 0.5, 0]
  - Scale: [0, 1.2, 1.5, 1.8, 2]
  - Duration: 250ms (extended electrical aftermath)
- Radial arcs (8 directions at 45° intervals):
  - Opacity: [0, 1, 0.8, 0.6, 0]
  - ScaleX: [0, 1, 1.2, 1, 0.8]
  - Width: 60px, Height: 4px
  - Linear gradient from accent to primary to transparent
  - Random 0-50ms delays for asynchronous crackling
- Lingering arcs (4 random positions):
  - Erratic flickering: Opacity [0, 1, 0, 0.8, 0, 0.6, 0]
  - Random X/Y offsets (±40px, ±60px)
  - Staggered 40ms delays
- Shockwave: Opacity [0.8, 0.5, 0], Scale [0, 2, 3]
- Screen flash: Opacity [0, 0.2, 0.1, 0] (yellow overlay)

**Special Effects:**
- Erratic motion: Random position offsets simulate unstable electricity
- Asynchronous timing: Staggered delays create chaotic energy feel
- Extended duration: 250ms impact (longest phase) emphasizes raw power

### Technical Specifications

**Total Duration:** 900ms (specified), ~1016ms (actual with overhead)

**Phase Timings Table:**

| Phase | Duration | Start Time | End Time | Easing |
|-------|----------|------------|----------|--------|
| Charge | 350ms | 0ms | 350ms | ease-in-out |
| Cast | 100ms | 350ms | 450ms | ease-out |
| Strike | 200ms | 450ms | 650ms | linear |
| Impact | 250ms | 650ms | 900ms | ease-out |

**Particle Count Breakdown:**

| Phase | Particle Count | Peak Simultaneous |
|-------|---------------|-------------------|
| Charge | 12 | 12 |
| Cast | 8 | 8 |
| Strike | 0 (SVG bolt) | 0 |
| Impact | 24 | 24 |
| **Total** | **44** | **~30** |

**Color Palette:**
- Primary: `#ffeb3b` (yellow)
- Secondary: `#fff176` (light yellow)
- Accent: `#ffffff` (white)

**Key Components Used:**
- `ParticleSystem` (charge, cast, impact)
- `motion.path` (SVG lightning bolt)
- `motion.div` (arcs, glows, flashes, screen effect)

**Performance Metrics:**
- Target FPS: 60fps
- Actual FPS: 60fps sustained
- SVG path performance: Excellent (simple path, short animation)
- GPU compliance: 100%

### Visual Mockup/Timeline

```
Timeline:
0ms                    350ms 450ms       650ms           900ms
|----------------------|-----|-----------|---------------|
[===== CHARGE =====][CT][== STRIKE ==][==== IMPACT ====]

Frame 0ms:     [Electric sparks crackling around caster]
Frame 175ms:   [Pulsing electric aura intensifies]
Frame 350ms:   [Energy reaches peak, erratic arcs visible]
Frame 400ms:   [Caster points upward, energy beam shoots skyward] ↑
Frame 450ms:   [Sky glows yellow, gathering energy]
Frame 550ms:   [⚡ LIGHTNING BOLT strikes from sky to target!]
Frame 650ms:   [Impact! Electric burst at target position]
Frame 775ms:   [8 radial arcs crackle outward, particles scatter]
Frame 900ms:   [Final erratic arcs flicker out]

Motion Diagram:
Charge:   Caster ⚡⚡ [crackling energy]
Cast:     Caster ↑ [energy beam upward]
Strike:            ⚡ [bolt from sky]
          Sky ─────┤
                   ├─→ Target
Impact:   Target ✨ * ✨ [radial electric burst]
```

### Variations & Alternatives

**Critical Hit Version:**
- Chain lightning: Secondary bolts to nearby positions
- Increase radial arcs to 16 (every 22.5°)
- Increase particles to 36
- Add double-strike (two bolts 100ms apart)

**Miss Version:**
- Charge and cast phases complete
- Lightning strikes near target (30-50px offset)
- Smaller impact burst (12 particles, 4 arcs)
- No screen flash

**Alternative Ideas:**
- **Forked Lightning:** Bolt splits into 3 branches mid-strike
- **Continuous Beam:** Sustained lightning channel (500ms duration)
- **Ball Lightning:** Floating orb instead of instant strike

### Polish Recommendations

**Additional Juice:**
- **Screen Shake:** 6-8px erratic shake (multi-directional)
- **Electric Tint:** Yellow color overlay on target character
- **Damage Numbers:** Crackling numbers with electric glow animation
- **Post-Impact:**
  - Smoke rising from impact point (6 particles, 600ms)
  - Static electricity particles (4 particles, slow orbit, 800ms)
  - Burn mark / scorch at strike location
- **Sound Cues:**
  - Charge: Building static crackle
  - Cast: Electric discharge upward
  - Strike: Thunder crash + electrical zap
  - Impact: Sustained electrical sizzle (250ms)

### Performance Notes

**Optimizations Applied:**
- SVG path is simple (8 segments only)
- Path generation is memoized
- React.memo() wrapper
- GPU-only transforms

**Special Implementation Notes:**
- Lightning path uses SVG for crisp jagged appearance
- Random path generation happens once per animation (not per frame)
- Erratic arc positions use transform (GPU-accelerated) not layout properties

---

## 4. Holy Beam

### Spell Overview

**Name:** Holy Beam
**Spell ID:** `holy`
**Element:** Holy/Divine
**Category:** Offensive beam
**Attack Weight:** Medium
**Total Duration:** 1000ms (actual: ~1126ms with overhead)
**Game Mechanics:** Medium holy damage, column of divine light

### Visual Description

A divine spell that summons a column of radiant light from the heavens. Golden particles rise from the caster and gather in the air above before forming a brilliant beam that descends gracefully onto the target. The spell emphasizes vertical motion, divine imagery (cross patterns, radiant rays), and a warm golden glow. On impact, the target is bathed in holy light with radiant rays extending outward.

**Key Visual Elements:**
- Rising golden particles (upward gravity)
- Gathering light above caster with rotating divine circle
- Radiant cross pattern
- Descending column of light (60px width beam)
- Inner bright core and outer glow
- Descending sparkles within beam
- Radiant burst on impact with 12 extending rays
- Golden sparkle particles and ascending sparkles (✨ emoji)

**Motion Characteristics:**
- Charge: Upward floating particles, gathering above
- Cast: Bright flash and expanding ring
- Beam: Graceful descending column with sparkles
- Impact: Radiant explosion with extending light rays

**What Makes It Distinct:** The vertical beam mechanic, divine/religious imagery, warm golden palette, and gentle yet powerful aesthetic distinguish it from aggressive elemental spells.

### Phase-by-Phase Breakdown

#### Phase 1: Charge (350ms)

**Visual Elements:**
- 18 rising golden particles
- Gathering light above caster (60px diameter, -90px above caster Y)
- Divine circle (70px diameter, rotating 360°)
- Radiant cross pattern (30px vertical, 30px horizontal)
- Soft glow at caster (80px diameter)

**Particle Details:**
- Count: 18 particles
- Colors: Gold (#ffd700), light gold (#ffffcc), white (#ffffff)
- Spread: 60px radius
- Size: 6px
- Gravity: -80 (upward float)

**Motion & Timing:**
- Rising particles: Upward motion from caster, 350ms lifetime
- Gathering light:
  - Y position: 0 → -90px
  - Opacity: [0, 0.4, 0.6, 0.8]
  - Scale: [0, 0.8, 1, 1.2]
- Divine circle:
  - Rotation: 0° → 360° (linear)
  - Opacity: [0, 0.6, 0.8]
  - Border: 2px solid gold
  - Inner glow shadow
- Radiant cross: Two perpendicular bars forming cross
  - Vertical: 4px × 30px
  - Horizontal: 30px × 4px
  - Opacity: 0 → 0.8
- Soft glow: Opacity 0 → 0.5 (radial gradient)

**Color Palette:**
- Primary: #ffd700 (gold)
- Secondary: #ffffcc (light gold)
- Accent: #ffffff (white highlights)

**Code Implementation:**
```tsx
<ParticleSystem
  originX={casterX}
  originY={casterY}
  particleCount={18}
  colors={[HOLY_COLORS.primary, HOLY_COLORS.secondary, HOLY_COLORS.accent]}
  spread={60}
  lifetime={350}
  size={6}
  gravity={-80} // Upward float
  fadeOut={false}
/>
```

#### Phase 2: Cast (150ms)

**Visual Elements:**
- Bright flash above (100px diameter)
- Expanding divine ring (120px diameter)
- Descending preparation glow (50px width, extending from top to target)
- 12 burst particles

**Particle Details:**
- Count: 12 particles
- Colors: White accent, gold primary
- Spread: 100px
- Size: 5px
- Gravity: 0

**Motion & Timing:**
- Bright flash: Opacity [0, 1, 0.8], Scale [0.5, 1.5, 1.3]
- Divine ring: Opacity [0, 0.8, 0.6], Scale [0, 1.5, 2]
  - Border: 3px solid accent
  - Box-shadow: gold glow
- Preparation glow: Vertical gradient beam
  - ScaleY: [0, 0.5, 0.8]
  - Opacity: [0, 0.5, 0.7]
  - Origin: Top of screen extending downward
- Burst particles: Radial spread, 150ms lifetime

#### Phase 3: Beam (350ms)

**Visual Elements:**
- Main beam column (60px width, full height from top to target)
- Inner bright core (30px width)
- Outer beam glow (100px width)
- Descending sparkles (15 particles within beam)
- Pulsing light at top of beam (80px diameter)
- Target ground indicator (90px width, ellipse)

**Beam Structure:**
- Outer glow: 100px width, 20px blur
  - Gradient: primary 40% → secondary 20% → transparent
  - Opacity: [0, 0.5, 0.4]
- Main beam: 60px width, 6px blur
  - Gradient: accent 0% → primary 30% → secondary 70% → primary 100%
  - Opacity: [0, 0.9, 0.8, 0.7]
  - Box-shadow: 40px glow
- Inner core: 30px width, 3px blur
  - Solid accent color gradient
  - Opacity: [0, 1, 0.9, 0.8]

**Particle Details:**
- Descending sparkles: 15 particles
- Colors: Accent, primary, secondary
- Spread: 30px horizontal
- Size: 5px
- Gravity: 50 (gentle downward)
- Position: Moves from top to target over 350ms

**Motion & Timing:**
- All beam elements: ScaleY [0, 1, 1, 1] (origin: top)
- Sparkles: Y position animates from top to target
- Top light: Pulsing scale [0.8, 1.3, 1.2, 1.1]
- Ground indicator: Opacity [0, 0.7, 0.8], Scale [0, 1.2, 1]
  - Ellipse with rotateX(70deg) for perspective
- Duration: 350ms (sustained beam presence)

**Code Implementation:**
```tsx
// Main beam column
<motion.div
  initial={{ opacity: 0, scaleY: 0 }}
  animate={{
    opacity: [0, 0.9, 0.8, 0.7],
    scaleY: [0, 1, 1, 1],
    transition: { duration: 0.35, ease: 'easeOut' }
  }}
  style={{
    position: 'absolute',
    left: targetX - 30,
    top: 0,
    width: 60,
    height: targetY,
    background: `linear-gradient(to bottom,
      ${HOLY_COLORS.accent}ff 0%,
      ${HOLY_COLORS.primary}dd 30%,
      ${HOLY_COLORS.secondary}bb 70%,
      ${HOLY_COLORS.primary}dd 100%)`,
    filter: 'blur(6px)',
    transformOrigin: 'top',
    boxShadow: `0 0 40px ${HOLY_COLORS.primary}`
  }}
/>
```

#### Phase 4: Impact (150ms)

**Visual Elements:**
- Central radiant burst (120px diameter)
- 12 radiant light rays (70px length, every 30°)
- 28 golden sparkle burst particles
- Divine shimmer ring (120px diameter, expanding)
- 5 ascending sparkles (✨ emoji, rising -80px)
- Golden screen flash (15% opacity)

**Particle Details:**
- Count: 28 particles
- Colors: All holy colors
- Spread: 140px radius
- Size: 7px
- Gravity: -20 (gentle upward float)

**Motion & Timing:**
- Central burst:
  - Opacity: [0, 1, 0.7, 0]
  - Scale: [0, 1.3, 1.8, 2.2]
  - Radial gradient (accent → primary → secondary → transparent)
- Light rays (12 rays):
  - Opacity: [0, 0.8, 0.6, 0]
  - ScaleX: [0, 1, 1.2, 1]
  - Width: 70px, Height: 6px
  - Linear gradient (accent → primary → transparent)
  - Each ray rotated (0°, 30°, 60°, ... 330°)
  - Origin: Left center
- Sparkle burst: Radial expansion with upward float
- Shimmer ring:
  - Opacity: [0.8, 0.5, 0]
  - Scale: [0, 2.5, 3.5]
  - Border: 3px solid accent
- Ascending sparkles (✨):
  - Y: 0 → -80px
  - X: Random ±30px deviation
  - Opacity: [0, 1, 0.8, 0]
  - Scale: [0, 1.2, 1, 0.9]
  - Staggered 20ms delays
- Screen flash: [0, 0.15, 0] (golden overlay)

**Special Effects:**
- Radiant rays create divine sunburst pattern
- Ascending sparkles add whimsical divine touch
- Gentle upward particle motion (vs downward in most spells)

### Technical Specifications

**Total Duration:** 1000ms (specified), ~1126ms (actual with overhead)

**Phase Timings Table:**

| Phase | Duration | Start Time | End Time | Easing |
|-------|----------|------------|----------|--------|
| Charge | 350ms | 0ms | 350ms | ease-out |
| Cast | 150ms | 350ms | 500ms | ease-out |
| Beam | 350ms | 500ms | 850ms | ease-out |
| Impact | 150ms | 850ms | 1000ms | ease-out |

**Particle Count Breakdown:**

| Phase | Particle Count | Peak Simultaneous |
|-------|---------------|-------------------|
| Charge | 18 | 18 |
| Cast | 12 | 12 |
| Beam | 15 (descending) | ~8-10 |
| Impact | 28 | 28 |
| **Total** | **73** | **~35** |

**Color Palette:**
- Primary: `#ffd700` (gold)
- Secondary: `#ffffcc` (light gold)
- Accent: `#ffffff` (white)

**Key Components Used:**
- `ParticleSystem` (charge, cast, beam descending sparkles, impact)
- `motion.div` (beam column layers, glows, rings, light rays, sparkles)

**Performance Metrics:**
- Target FPS: 60fps
- Actual FPS: 60fps sustained
- Multi-layer beam: Well-optimized with blur filters
- GPU compliance: 100%

### Visual Mockup/Timeline

```
Timeline:
0ms                    350ms       500ms                850ms     1000ms
|----------------------|-----------|--------------------|---------||
[===== CHARGE =====][CAST][====== BEAM ======][= IMPACT =]

Frame 0ms:     [Golden particles begin rising from caster]
Frame 175ms:   [Particles gather above, divine circle forming]
Frame 350ms:   [Cross pattern visible, light fully gathered above]
Frame 425ms:   [Flash! Divine ring expands]
Frame 500ms:   [Beam column begins descending from sky]
Frame 675ms:   [Beam fully extended, sparkles descending within]
                Sky ═══════╗
                          ║ [golden beam column]
                          ║
Frame 850ms:   [Beam strikes target] ☀️ RADIANCE!
Frame 925ms:   [Radiant rays extend outward, 12 directions]
Frame 1000ms:  [Final sparkles ascend ✨]

Motion Diagram:
Charge:   Caster ↑↑ [particles rise] → ☀ [gather above]
Cast:     ☀ [flash and ring expand]
Beam:     Sky ══╦══ [descending column]
               ║
               ║ [sparkles fall within]
               ▼
Impact:   Target * ── * ── * [radiant sunburst, 12 rays]
               ✨ [sparkles rise]
```

### Variations & Alternatives

**Critical Hit Version:**
- Wider beam (90px vs 60px)
- 16 radiant rays instead of 12 (every 22.5°)
- Increase impact particles to 40
- Add second beam offset (double-column effect)
- Longer beam duration (500ms vs 350ms)

**Miss Version:**
- Full charge and cast phases
- Beam descends near target (offset position)
- Small radiant glow at miss location (no full burst)

**Alternative Ideas:**
- **Multi-Target:** Beam splits into 3 smaller beams mid-descent
- **Healing Version:** Green/white instead of gold, gentle glow
- **Judgment:** Slow-building charge (600ms), massive impact

### Polish Recommendations

**Additional Juice:**
- **Screen Shake:** Gentle 2-3px shake (divine power, not violent)
- **Color Tint:** Golden overlay on target character
- **Damage Numbers:** Golden glowing numbers with divine shimmer
- **Post-Impact:**
  - Lingering golden glow (600ms fade)
  - Ascending light wisps (8 particles, gentle upward drift)
  - Halo effect above target (brief 300ms)
- **Sound Cues:**
  - Charge: Angelic choir building
  - Cast: Bright chime
  - Beam: Sustained heavenly tone
  - Impact: Bell toll + radiant shimmer sound

### Performance Notes

**Optimizations Applied:**
- Multi-layer beam uses same width calculations (DRY)
- Radial rays generated with map() for efficiency
- React.memo() wrapper
- All GPU-accelerated properties

**Special Implementation Notes:**
- Vertical beam uses scaleY transform (origin: top)
- Ground indicator uses rotateX for 3D perspective
- Emoji sparkles (✨) are text elements (lightweight)
- Divine cross uses simple rectangular divs (not SVG)

---

## 5. Meteor

### Spell Overview

**Name:** Meteor
**Spell ID:** `meteor`
**Element:** Fire (AOE)
**Category:** Offensive area-of-effect
**Attack Weight:** Heavy
**Total Duration:** 1500ms (actual: ~1683ms with overhead)
**Game Mechanics:** Heavy fire damage to primary target + AOE damage

### Visual Description

The ultimate fire spell - a cataclysmic area-of-effect attack that summons multiple meteors from the sky. The caster raises their hands skyward, channeling red energy into the heavens. Warning circles appear on the ground, then fiery meteors crash down simultaneously in a devastating multi-impact explosion. Dust clouds, crater glows, and lingering embers complete the apocalyptic effect.

**Key Visual Elements:**
- Caster upward gesture with rising energy particles
- Red glow gathering in sky
- Ground shadow target indicators (dashed borders)
- Pulsing warning rings on ground
- 3 meteors falling simultaneously (primary + 2 secondary)
- Meteor flame trails descending
- Simultaneous explosions with shockwaves
- AOE effect circle
- Dust clouds rising from each impact
- Crater glows at impact points
- Lingering ember particles
- Screen flash (25% opacity - strongest of all spells)

**Motion Characteristics:**
- Charge: Slow buildup, energy rising to sky
- Warning: Tense anticipation, shadow indicators pulse
- Impact: Explosive multi-hit simultaneous strikes
- Aftermath: Settling debris, smoke, lingering fire

**What Makes It Distinct:** Multi-projectile AOE mechanic, warning phase with ground indicators, simultaneous impacts, heaviest screen shake, longest duration, most particles, strongest visual impact.

### Phase-by-Phase Breakdown

#### Phase 1: Charge (600ms)

**Visual Elements:**
- Caster upward gesture glow (60px diameter, rising -100px)
- 15 rising energy particles (red/orange)
- Red glow gathering in sky (160px diameter at -100px Y)
- Pulsing red cloud in sky (200px × 100px ellipse)
- Ominous rumble effect (pulsing glow at caster)

**Particle Details:**
- Count: 15 particles
- Colors: Red (#ff4444), orange (#ff6b35)
- Spread: 50px
- Size: 5px
- Gravity: -60 (upward float toward sky)

**Motion & Timing:**
- Upward gesture glow:
  - Y: 0 → -100px
  - Opacity: [0, 0.6, 0.8]
  - Duration: 600ms (slow buildup)
- Sky gathering glow:
  - Opacity: [0, 0.3, 0.5, 0.7]
  - Scale: [0, 1, 1.3, 1.5]
  - Position: -100px above screen top
- Red cloud:
  - Opacity: [0, 0.4, 0.5, 0.6]
  - Scale: [0.5, 1.2, 1.4, 1.6]
  - Ellipse shape (200px × 100px)
- Ominous rumble:
  - Opacity: [0, 0.3, 0.2, 0.4, 0.2, 0.5]
  - Pulse pattern (6 stages) for tension
- Rising particles: Continuous upward drift, 600ms

**Color Palette:**
- Primary: #ff4444 (red)
- Secondary: #ffaa00 (orange)
- Used for ominous, apocalyptic feel

#### Phase 2: Warning (400ms)

**Visual Elements:**
- 3 ground shadow target indicators (90px × 30px ellipses)
  - Position: Target center, -60px/-40px left, +50px/-30px right
  - Dashed border (2px dashed red)
- 3 pulsing warning rings (100px diameter)
- Intensifying sky glow (240px diameter)
- 12 warning particles falling from sky

**Meteor Impact Positions:**
1. Primary: (targetX, targetY) - center
2. Left: (targetX - 60, targetY - 40) - offset left
3. Right: (targetX + 50, targetY - 30) - offset right

**Motion & Timing:**
- Shadow indicators:
  - Opacity: [0, 0.6, 0.7, 0.8]
  - Scale: [0, 0.8, 1, 1.1]
  - Staggered 80ms delays (cascading appearance)
  - RotateX(70deg) for ground perspective
- Warning rings:
  - Opacity: [0, 0.6, 0.4, 0.6, 0.4]
  - Scale: [0.5, 1.2, 1, 1.3, 1.1]
  - Pulsing pattern for urgency
  - Border: 2px solid red
- Sky glow intensifies:
  - Opacity: [0.3, 0.5, 0.7, 0.9]
  - Scale: [1.5, 1.7, 1.9, 2]
- Warning particles: Falling from sky (gravity: 200)

**Special Effects:**
- Dashed borders create "target zone" feel
- Pulsing creates tension and anticipation
- Multiple indicators communicate AOE nature

#### Phase 3: Impact (300ms)

**Visual Elements (per meteor × 3):**
- Meteor falling trail (24px diameter, from -200px Y)
- Meteor flame trail (16px × 150px, vertical gradient)
- Impact explosion (100px diameter)
- Impact shockwave (120px diameter, expanding 3x)
- 12 explosion particles per meteor (36 total)
- Overall AOE effect circle (100px radius)
- Screen flash (25% red opacity)

**Particle Details:**
- Per meteor: 12 particles
- Total: 36 particles across 3 meteors
- Colors: All fire colors (red, orange, yellow-orange)
- Spread: 130px radius
- Size: 7px
- Gravity: 100 (fast downward fall)

**Motion & Timing:**
- Meteor descent (per meteor):
  - Y: -200px → 0 (impact point)
  - Opacity: [0, 1, 1]
  - Scale: [0, 1.5, 1.2]
  - Duration: 120ms (40% of impact phase)
  - Staggered 50ms delays (cascading impacts)
- Flame trail:
  - ScaleY: [0, 1, 0.8, 0]
  - Opacity: [0, 0.8, 0.6, 0]
  - Gradient: transparent → orange → red
  - Origin: Bottom (trails behind meteor)
- Impact explosion (per meteor):
  - Opacity: [0, 1, 0.8, 0]
  - Scale: [0, 1.5, 2, 2.5]
  - Radial gradient (accent → primary → secondary → transparent)
  - Duration: 300ms (full impact phase)
- Shockwave (per meteor):
  - Opacity: [0.8, 0.5, 0]
  - Scale: [0, 2, 3]
  - Border: 4px solid red
- AOE effect:
  - AreaEffect component (100px radius)
  - Expanding circle with fade
  - Duration: 180ms (60% of impact) + 120ms fade
- Screen flash:
  - Opacity: [0, 0.25, 0.15, 0]
  - Full-screen red overlay (strongest flash in game)

**Code Implementation:**
```tsx
// Per-meteor explosion
{meteorImpacts.map((impact, index) => (
  <React.Fragment key={`meteor-${index}`}>
    {/* Meteor falling */}
    <motion.div
      initial={{ y: -200, opacity: 0 }}
      animate={{
        y: 0,
        opacity: [0, 1, 1],
        scale: [0, 1.5, 1.2],
        transition: {
          duration: 0.12,
          delay: index * 0.05
        }
      }}
      // ... meteor styling
    />
    {/* Impact explosion */}
    <motion.div
      animate={{
        opacity: [0, 1, 0.8, 0],
        scale: [0, 1.5, 2, 2.5]
      }}
      // ... explosion styling
    />
    {/* Explosion particles */}
    <ParticleSystem
      originX={impact.x}
      originY={impact.y}
      particleCount={12}
      // ...
    />
  </React.Fragment>
))}
```

#### Phase 4: Aftermath (200ms)

**Visual Elements (per impact × 3):**
- Rising dust cloud (80px diameter, rising -80px)
- Crater glow (70px × 24px ellipse on ground)
- 6 lingering embers per impact (18 total)
- Overall dissipating smoke (160px diameter)

**Particle Details:**
- Per crater: 6 ember particles
- Total: 18 ember particles
- Colors: Orange, red
- Spread: 40px
- Size: 4px
- Gravity: -30 (gentle upward drift)

**Motion & Timing:**
- Dust clouds:
  - Opacity: [0, 0.6, 0.4, 0]
  - Scale: [0.5, 1.5, 2, 2.5]
  - Y: -20px → -80px (rising)
  - Radial gradient (gray 60% → transparent)
  - Staggered 40ms delays
- Crater glows:
  - Opacity: [0.7, 0.4, 0]
  - Scale: [1, 1.2, 1.3]
  - Ellipse (rotateX 70deg for ground perspective)
  - Radial gradient (orange → red → transparent)
- Lingering embers: Gentle upward float, slow fade
- Overall smoke:
  - Opacity: [0.5, 0.3, 0]
  - Scale: [1, 1.8, 2.5]
  - Y: -10px → -50px
  - Gray smoke effect

**Special Effects:**
- Dust clouds suggest massive impact force
- Crater glows show residual heat
- Embers provide lingering fire presence

### Technical Specifications

**Total Duration:** 1500ms (specified), ~1683ms (actual with overhead)

**Phase Timings Table:**

| Phase | Duration | Start Time | End Time | Easing |
|-------|----------|------------|----------|--------|
| Charge | 600ms | 0ms | 600ms | ease-in |
| Warning | 400ms | 600ms | 1000ms | ease-in-out |
| Impact | 300ms | 1000ms | 1300ms | ease-out |
| Aftermath | 200ms | 1300ms | 1500ms | ease-out |

**Particle Count Breakdown:**

| Phase | Particle Count | Peak Simultaneous |
|-------|---------------|-------------------|
| Charge | 15 | 15 |
| Warning | 12 | 12 |
| Impact | 36 (12 × 3) | 36 |
| Aftermath | 18 (6 × 3) | 18 |
| **Total** | **81** | **~45** |

**Color Palette:**
- Primary: `#ff4444` (red - ominous)
- Secondary: `#ffaa00` (orange)
- Accent: `#ff6b35` (fire orange - used in explosions)

**Key Components Used:**
- `ParticleSystem` (charge, warning, impact explosions, aftermath embers)
- `AreaEffect` (AOE circle indicator)
- `motion.div` (meteors, trails, explosions, glows, smoke, screen flash)

**Performance Metrics:**
- Target FPS: 60fps
- Actual FPS: 60fps sustained
- Multi-impact complexity: Well-optimized with staggered timing
- GPU compliance: 100%

### Visual Mockup/Timeline

```
Timeline:
0ms                                  600ms             1000ms     1300ms    1500ms
|-----------------------------------|-----------------|----------|---------|
[========== CHARGE ==========][==== WARNING ====][IMPACT][AFTER]

Frame 0ms:      [Caster raises hands, particles rise]
Frame 300ms:    [Sky begins glowing red]
Frame 600ms:    [Red cloud forms overhead, energy gathered]
Frame 700ms:    [Ground circles appear - WARNING!]
Frame 900ms:    [Circles pulse intensely]
Frame 1000ms:   [Three meteors begin falling!]
                Sky ☄ ☄ ☄ [meteors descending]
Frame 1100ms:   [Meteors mid-fall with flame trails]
Frame 1200ms:   [First impact!] ☀️
Frame 1250ms:   [All three impact simultaneously!] ☀️ ☀️ ☀️
Frame 1300ms:   [Massive explosions, screen shakes violently]
Frame 1400ms:   [Dust clouds rise, craters glow]
Frame 1500ms:   [Smoke dissipates, embers linger]

Motion Diagram:
Charge:    Caster ↑↑ → Sky ☁ [gathering energy]
Warning:   Ground ⭕ ⭕ ⭕ [target indicators]
Impact:    Sky ☄─┐  ☄─┐  ☄─┐
                 ├──→ ☀️
                 ├──→   ☀️
                 └──→     ☀️  [triple simultaneous impact]
Aftermath: ☀️ ☁↑ [dust rises from craters]
```

### Variations & Alternatives

**Critical Hit Version:**
- 5 meteors instead of 3 (wider spread)
- Increase explosion particles to 18 per meteor (90 total)
- Add second wave of meteors (delayed 200ms)
- Larger AOE radius (150px vs 100px)
- Screen shake intensity doubled

**Miss Version:**
- Full charge and warning phases
- Meteors land in offset positions (50-100px away)
- Smaller explosions (8 particles each)
- No direct hit effects on target

**Alternative Ideas:**
- **Delayed Detonation:** Meteors embed before exploding
- **Meteor Shower:** 10+ smaller meteors over 2 seconds
- **Focused Strike:** Single massive meteor (double size/particles)

### Polish Recommendations

**Additional Juice:**
- **Screen Shake:** 8-12px violent shake (strongest in game)
- **Slow Motion:** Impact moment at 0.5x speed for drama
- **Camera Zoom:** Slight zoom-in on impact zone
- **Damage Numbers:** Massive red/orange numbers, staggered per meteor
- **Post-Impact:**
  - Lingering smoke (1200ms fade)
  - Ground scorch marks (permanent/long-lasting decals)
  - Heat distortion waves (400ms)
  - Ambient fire particles (800ms, drifting upward)
- **Sound Cues:**
  - Charge: Deep rumble building
  - Warning: Whistling descent sound
  - Impact: Triple explosion (staggered), earth-shaking boom
  - Aftermath: Crackling fire, debris settling

### Performance Notes

**Optimizations Applied:**
- Staggered meteor impacts prevent all particles at once
- React.memo() wrapper
- Conditional rendering by phase
- GPU-only properties throughout

**Concerns/Warnings:**
- Most particle-heavy spell (81 total)
- Three simultaneous explosions could impact low-end devices
- Performance monitoring recommended on target hardware

**Special Implementation Notes:**
- Meteor positions stored in array for DRY code
- AreaEffect component reused from core
- Impact effects generated with .map() for efficiency
- Screen flash uses fixed positioning for full coverage

---

## 6. Heal

### Spell Overview

**Name:** Heal
**Spell ID:** `heal`
**Element:** Nature
**Category:** Support (Healing)
**Attack Weight:** N/A (Support spell)
**Total Duration:** 1100ms
**Game Mechanics:** Restores HP to target, displays +HP numbers

### Visual Description

A soothing spell that channels restorative nature energy. Soft green particles gather in the air above the target, then gently descend as a column of healing light that envelops the target in a warm green glow. Rising HP numbers and gentle sparkles complete the positive, reassuring effect. The animation uses gentle, non-aggressive motion to create a calming, supportive feel.

**Key Visual Elements:**
- Green particles gathering above target
- Gentle glowing light (softer than offensive spells)
- Descending healing beam (30px width)
- Green glow enveloping target (pulsing twice)
- Rising +HP numbers
- Gentle surrounding particles (upward float)
- Final sparkle burst

**Motion Characteristics:**
- Cast: Gentle upward gathering
- Descend: Graceful downward light
- Absorption: Soft pulsing glow (2 pulses)
- Complete: Quick sparkle finish

**What Makes It Distinct:** Gentle motion, green nature palette, pulsing absorption effect, upward particle motion, +HP display, and non-aggressive aesthetic clearly communicate healing vs damage.

### Phase-by-Phase Breakdown

#### Phase 1: Cast (400ms)

**Visual Elements:**
- 22 rising green particles (converging upward)
- Gentle gathering glow (50px diameter, -80px above target)
- Soft outer glow (70px diameter, expanding)

**Particle Details:**
- Count: 22 particles
- Colors: Green (#8bc34a), light green (#c5e1a5), white (#ffffff)
- Spread: -60px (negative = inward convergence)
- Size: 6px
- Gravity: -30 (upward float)

**Motion & Timing:**
- Particles: Rising from target position to gathering point
- Gathering glow:
  - Opacity: [0, 0.4, 0.6, 0.8]
  - Scale: [0, 0.8, 1, 1.2]
  - Y position: -80px above target
- Outer glow:
  - Opacity: [0, 0.3, 0.5]
  - Scale: [0.5, 1.2, 1.5]
- Duration: 400ms (deliberate gathering)

**Color Palette:**
- Primary: #8bc34a (green)
- Secondary: #c5e1a5 (light green)
- Accent: #ffffff (white sparkles)

#### Phase 2: Descend (300ms)

**Visual Elements:**
- Descending light beam (30px width, from gathering point to target)
- 12 descending particles alongside beam
- Glow at gathering point (fading)

**Beam Structure:**
- Width: 30px (thinner than offensive beams)
- Gradient: Secondary → primary → primary
- Filter: blur(8px)
- Box-shadow: 30px glow

**Particle Details:**
- Count: 12 particles
- Colors: Light green, white
- Spread: 25px horizontal
- Size: 4px
- Gravity: 10 (gentle downward)

**Motion & Timing:**
- Beam: ScaleY [0, 1, 1, 0.9] (origin: top)
- Opacity: [0, 0.8, 0.8, 0.6]
- Particles animate from gathering point to target
- Gathering glow fades: Opacity [0.8, 0.4, 0]

#### Phase 3: Absorption (300ms)

**Visual Elements:**
- Pulsing healing aura (100px diameter, 2 pulses)
- Inner bright core (60px diameter, synchronized pulses)
- 15 gentle surrounding particles (upward float)
- Rising +HP number (if healAmount provided)

**Motion & Timing:**
- Healing aura (2-pulse pattern):
  - Opacity: [0, 0.8, 0.9, 0.8, 0.6]
  - Scale: [0.5, 1.3, 1.1, 1.2, 1]
  - Times: [0, 0.3, 0.5, 0.7, 1] (5 keyframes = 2 pulses)
  - Radial gradient (green 50% → light green 30% → transparent)
- Inner core: Same pulse pattern, higher opacity
- Particles: Upward float (gravity: -20)
  - 15 particles, 300ms lifetime
  - Spread: 60px
  - Size: 5px
- HP number (if present):
  - Y: 0 → -80px
  - Opacity: [0, 1, 1, 0.8, 0]
  - Scale: [0.5, 1.2, 1, 1, 0.9]
  - Font: 28px bold
  - Color: Green with white text-shadow
  - Content: "+{healAmount}"

**Special Effects:**
- Two-pulse pattern creates satisfying feedback
- Upward particle motion (vs downward in damage spells)
- Green HP numbers clearly communicate healing

#### Phase 4: Complete (100ms)

**Visual Elements:**
- Final sparkle burst (70px diameter)
- 10 quick sparkle particles
- Fading aura remnant (80px diameter)

**Motion & Timing:**
- Sparkle burst:
  - Opacity: [0, 1, 0]
  - Scale: [0.8, 1.5, 2]
  - Radial gradient (white → light green → transparent)
- Sparkle particles:
  - Spread: 80px
  - Size: 4px
  - Gravity: 0
- Aura remnant:
  - Opacity: [0.6, 0]
  - Scale: [1, 1.3]

### Technical Specifications

**Total Duration:** 1100ms

**Phase Timings Table:**

| Phase | Duration | Start Time | End Time | Easing |
|-------|----------|------------|----------|--------|
| Cast | 400ms | 0ms | 400ms | ease-out |
| Descend | 300ms | 400ms | 700ms | ease-in-out |
| Absorption | 300ms | 700ms | 1000ms | ease-out |
| Complete | 100ms | 1000ms | 1100ms | ease-out |

**Particle Count Breakdown:**

| Phase | Particle Count | Peak Simultaneous |
|-------|---------------|-------------------|
| Cast | 22 | 22 |
| Descend | 12 | 12 |
| Absorption | 15 | 15 |
| Complete | 10 | 10 |
| **Total** | **59** | **~25** |

**Color Palette:**
- Primary: `#8bc34a` (green)
- Secondary: `#c5e1a5` (light green)
- Accent: `#ffffff` (white)

**Performance Metrics:**
- Target FPS: 60fps
- GPU compliance: 100%
- Optimized with React.memo()

### Visual Mockup/Timeline

```
Timeline:
0ms                400ms           700ms           1000ms 1100ms
|------------------|---------------|---------------|------|
[==== CAST ====][== DESCEND ==][= ABSORPTION =][COMP]

Frame 0ms:     [Green particles begin rising from target]
Frame 200ms:   [Particles gathering above target (-80px)]
Frame 400ms:   [All particles converged, glowing]
Frame 550ms:   [Healing beam descends gently]
Frame 700ms:   [Beam reaches target, begins enveloping]
Frame 850ms:   [Green aura pulses around target] +50 HP!
Frame 1000ms:  [Second pulse, aura bright]
Frame 1050ms:  [Sparkles burst gently]
Frame 1100ms:  [Final fade, target healed]

Motion Diagram:
Cast:       ↑ ↑ Target ↑ ↑ → ☀ [particles gather above]
Descend:    ☀ ║ [beam descends]
              ║
              ▼
Absorption: Target ✨ (green glow pulses) +HP ↑
Complete:   Target * (sparkles fade)
```

### Variations & Alternatives

**Enhanced Heal (High Amount):**
- Brighter glow (higher opacity)
- Larger particle count (30 cast, 20 descend, 22 absorption)
- Third pulse in absorption phase
- Larger HP numbers (36px font)

**Group Heal Version:**
- Multiple descending beams to different targets
- Shared gathering point above center
- Synchronized absorption pulses

**Alternative Ideas:**
- **HoT (Heal Over Time):** Sustained glow for duration
- **Regen:** Small particles continuously rising
- **Cleanse:** Add white flash to remove status effects

### Polish Recommendations

**Additional Juice:**
- **Subtle Glow:** Character sprite brightens briefly
- **Healing Sound:** Soft chime, gentle wind, nature sounds
- **HP Number Animation:** Bounce effect on rise
- **Post-Effect:**
  - Brief green aura lingers (300ms)
  - Vitality sparkles (5 particles, slow orbit, 600ms)
- **Morale Boost:** Small +symbol icon above head

### Performance Notes

**Optimizations Applied:**
- Gentle motions use simpler easing (lower computational cost)
- Particle counts moderate (all under 25)
- No complex effects (no SVG paths, simple shapes)

---

## 7. Protect

### Spell Overview

**Name:** Protect
**Spell ID:** `protect`
**Element:** Ice/Defense
**Category:** Support (Defense Buff)
**Attack Weight:** N/A (Support spell)
**Total Duration:** 700ms cast + persistent sustain + 200ms fade
**Game Mechanics:** Increases physical defense, persistent visual buff

### Visual Description

A defensive spell that creates a protective shield barrier around the target. A blue magical circle appears on the ground, and a semi-transparent dome shield with hexagonal patterns rises from it. The shield remains visible (but subtle) during the buff duration with gentle pulsing and orbital particles. The design emphasizes geometric structure and solidity.

**Key Visual Elements:**
- Ground magic circle (hexagonal pattern, rotating)
- Rising shield dome (110px diameter, semi-transparent)
- Hexagonal grid pattern within shield
- Formation particles rising with shield
- Persistent pulsing shield (during buff)
- 5 orbital particles (during buff)
- Ground circle reminder (during buff)
- Dissipating particles on fade

**Motion Characteristics:**
- Cast: Circle expands on ground
- Form: Shield rises from circle
- Sustain: Gentle pulsing (infinite loop)
- Fade: Shield dissipates upward/outward

**What Makes It Distinct:** Physical barrier aesthetic, hexagonal geometric patterns, low-opacity persistent effect, blue protective color scheme, ground-up formation.

### Phase-by-Phase Breakdown

#### Phase 1: Cast (300ms)

**Visual Elements:**
- Ground magic circle (120px × 30px ellipse, rotateX 60°)
  - Border: 3px solid blue
  - Inner radial gradient glow
- Rotating runic symbols (100px × 50px, rotating 360°)
  - 6 hexagonal lines at 60° intervals
- Ground glow (140px × 40px ellipse)

**Motion & Timing:**
- Circle: Opacity [0, 0.8, 1], Scale [0.3, 1.2, 1]
- Runic symbols: RotateZ 0° → 360° (linear)
- Lines appear with 60° offsets
- Ground glow: Opacity [0, 0.6, 0.8], Scale [0.5, 1.3, 1.5]

**Color Palette:**
- Primary: #4da6ff (blue)
- Secondary: #b3e0ff (light blue)
- Accent: #ffffff (white highlights)

#### Phase 2: Form (400ms)

**Visual Elements:**
- Ground circle fading (remains at 30% opacity)
- Rising shield dome (110px diameter)
  - ScaleY origin: bottom (grows upward)
  - Semi-transparent with radial gradient
  - Border: 2px solid blue
- Hexagonal pattern weaving (3 lines at 0°, 60°, 120°)
- 8 formation particles rising with shield
- Shield formation flash

**Motion & Timing:**
- Shield dome:
  - Opacity: [0, 0.7, 0.85, 0.8]
  - ScaleY: [0, 1, 1.05, 1]
  - ScaleX: [0.5, 1, 1.02, 1]
  - Ease: [0.34, 1.56, 0.64, 1] (overshoot)
- Hexagonal pattern:
  - 3 lines at 60° rotation intervals
  - ScaleY: [0, 1] per line
  - Staggered 80ms delays
  - Gradient: transparent → blue
- Formation particles:
  - Rise from ground circle to shield position
  - Radial spread (35px radius)
  - Staggered 40ms delays
- Flash: Opacity [0, 0.9, 0], Scale [0.8, 1.4, 1.6]

#### Phase 3: Sustain (Persistent, until buff expires)

**Visual Elements:**
- Pulsing shield barrier (110px diameter)
  - Opacity: [0.35, 0.45, 0.35] (infinite loop)
  - Scale: [0.98, 1.02, 0.98] (infinite loop)
  - Duration: 2s per cycle
- Rotating hexagonal pattern (slow 8s rotation)
  - Opacity: [0.5, 0.6, 0.5] (infinite loop)
- 5 orbital particles (gentle orbit pattern)
  - Circular path (40px radius)
  - 3-5.5s orbit duration (varying speeds)
  - Opacity: [0.4, 0.6, 0.4]
- Subtle ground circle (120px × 30px)
  - Opacity: [0.2, 0.3, 0.2] (infinite loop)

**Motion & Timing:**
- Shield pulse: 2s cycle, infinite repeat
- Hexagonal rotation: 8s full rotation, infinite
- Orbital particles:
  - Each particle on individual circular path
  - X: centerX + cos(angle) * 40px
  - Y: centerY - 40 + sin(angle) * 40px
  - Staggered starting positions (i/5 * 2π)
- Ground circle: 2s pulse cycle, infinite

**Special Effects:**
- Low opacity (35-45%) prevents gameplay obstruction
- Gentle pulsing provides visual interest without distraction
- Orbital particles add life to static barrier

#### Phase 4: Fade (200ms, when buff expires)

**Visual Elements:**
- Shield barrier fading (opacity → 0)
- Hexagonal pattern fading and rotating
- 8 dissipating particles (outward radial)
- Ground circle fading

**Motion & Timing:**
- Shield: Opacity [0.35, 0.2, 0], Scale [1, 1.1, 1.2]
- Hexagonal pattern: Opacity [0.5, 0.3, 0], RotateZ +30°
- Dissipating particles:
  - Radial expansion (40px → 60px)
  - Opacity: [0.5, 0.3, 0]
  - Scale: [1, 0.8, 0.3]
- Ground circle: Opacity [0.2, 0.1, 0], Scale [1, 1.1, 1.2]

### Technical Specifications

**Total Duration:** 700ms cast + variable sustain + 200ms fade

**Phase Timings Table:**

| Phase | Duration | Start Time | End Time | Notes |
|-------|----------|------------|----------|-------|
| Cast | 300ms | 0ms | 300ms | Fixed |
| Form | 400ms | 300ms | 700ms | Fixed |
| Sustain | Variable | 700ms | Buff expires | Infinite loop |
| Fade | 200ms | Buff expiry | +200ms | Fixed |

**Particle Count Breakdown:**

| Phase | Particle Count | Simultaneous |
|-------|---------------|--------------|
| Cast | 0 (glows only) | 0 |
| Form | 8 | 8 |
| Sustain | 5 (orbital) | 5 |
| Fade | 8 | 8 |
| **Total** | **21** | **~10** |

**Color Palette:**
- Primary: `#4da6ff` (blue)
- Secondary: `#b3e0ff` (light blue)
- Accent: `#ffffff` (white)

**isActive Prop:**
- Controls when sustain phase transitions to fade
- React useEffect watches isActive changes
- When isActive becomes false, triggers fade phase

**Performance Metrics:**
- Infinite animations use CSS repeat
- Low particle count (5 during sustain)
- Low opacity reduces rendering cost

### Visual Mockup/Timeline

```
Timeline:
0ms              300ms                 700ms                      Buff Expires    +200ms
|----------------|---------------------|-----------------------...|---------------|
[=== CAST ===][===== FORM =====][======= SUSTAIN (variable) =======][== FADE ==]

Frame 0ms:      [Blue circle appears on ground beneath target]
Frame 150ms:    [Circle expands, hexagonal symbols rotate]
Frame 300ms:    [Circle fully formed, glowing]
Frame 450ms:    [Shield dome rises from circle, particles ascending]
Frame 600ms:    [Shield reaches full height, hexagonal pattern weaves]
Frame 700ms:    [Shield complete, begins gentle pulsing]
Frame 2700ms:   [Shield continues pulsing, particles orbiting] (sustain)
Frame 10000ms:  [Shield still active, gentle presence] (sustain continues)
Buff Expires:   [Shield begins fading]
+100ms:         [Shield 50% faded, particles dispersing]
+200ms:         [Shield gone, protection ended]

Motion Diagram:
Cast:     Ground ⭕ [circle expands]
Form:     Ground ⭕ → ⬒ [dome rises from circle]
Sustain:  Target ⬒ ~~ [pulsing shield, orbital particles]
Fade:     ⬒ ... [shield dissipates outward]
```

### Variations & Alternatives

**Enhanced Protect:**
- Larger shield (130px vs 110px)
- Brighter opacity (45-55% vs 35-45%)
- More orbital particles (8 vs 5)
- Faster pulse (1.5s vs 2s)

**Group Protect:**
- Multiple shields on different targets
- Synchronized pulses
- Shared ground circle pattern

**Alternative Ideas:**
- **Iron Skin:** Metallic gray shield with sharp edges
- **Stone Barrier:** Brown/tan rocky texture
- **Barrier:** Simple force field without patterns

### Polish Recommendations

**Additional Juice:**
- **Audio:** Shield formation sound (crystalline chime)
- **Sustain Audio:** Very subtle hum (optional)
- **Fade Audio:** Shield dissipating (soft glass chime)
- **Status Icon:** Small shield icon above head
- **Defense UI:** DEF stat highlights in UI during buff

### Performance Notes

**Optimizations:**
- Infinite animations use CSS animation (not JS loops)
- Low particle count during sustain
- Semi-transparent elements reduce fill rate
- Ground circle uses CSS rotateX (GPU-accelerated)

**Special Implementation:**
- isActive prop pattern allows external control
- useEffect watches isActive to trigger phase changes
- Sustain phase uses Framer Motion repeat: Infinity

---

## 8. Shell

### Spell Overview

**Name:** Shell
**Spell ID:** `shell`
**Element:** Arcane/Magic Defense
**Category:** Support (Magic Defense Buff)
**Attack Weight:** N/A (Support spell)
**Total Duration:** 700ms cast + persistent sustain + 200ms fade
**Game Mechanics:** Increases magic defense, persistent visual buff

### Visual Description

A mystical spell that creates an ethereal magical barrier around the target. A purple arcane circle appears on the ground with flowing rune patterns, and a mystical dome weaves together from arcane energy. The barrier has flowing organic patterns (vs Protect's geometric structure) and wispy particles. The design emphasizes mystical, arcane, and magical energy.

**Key Visual Elements:**
- Ground arcane circle (flowing runes, organic rotation)
- Rising mystical dome (110px diameter, ethereal)
- Flowing arcane patterns (3 curved energy streams)
- Wispy particles (flowing motion, not orbital)
- Counter-rotating inner patterns
- Persistent pulsing ethereal aura
- Flowing wispy particles during sustain
- Dissipating wisps on fade

**Motion Characteristics:**
- Cast: Flowing organic expansion
- Form: Weaving mystic energy
- Sustain: Flowing patterns (12s rotation)
- Fade: Mystical dissolution

**What Makes It Distinct:** Flowing organic patterns (vs geometric), purple arcane colors, wispy particles, counter-rotating elements, mystical aesthetic vs physical barrier.

### Phase-by-Phase Breakdown

#### Phase 1: Cast (300ms)

**Visual Elements:**
- Ground arcane circle (120px × 30px ellipse)
  - Border: 3px solid purple
  - Flowing expansion (more organic than Protect)
- Flowing arcane runes (100px × 50px)
  - 8 curved patterns at 45° intervals
  - Organic rotation (not linear like Protect)
- 6 wispy particles rising from circle edges
- Ground glow (150px × 44px, more diffuse than Protect)

**Motion & Timing:**
- Circle: Opacity [0, 0.9, 1], Scale [0.3, 1.3, 1]
- Arcane runes: RotateZ [0, 180, 360]
  - Ease: [0.25, 0.1, 0.25, 1] (flowing, not linear)
  - Staggered 30ms delays per rune
- Wispy particles:
  - Y: 0 → -25px (gentle upward)
  - X: Radial positions based on i/6 * 2π
  - Opacity: [0, 0.7, 0.5]
- Ground glow: Larger, more diffuse blur(25px)

**Color Palette:**
- Primary: #9c27b0 (purple)
- Secondary: #ba68c8 (light purple)
- Accent: #4a148c (dark purple)

#### Phase 2: Form (400ms)

**Visual Elements:**
- Ground circle fading (to 30% opacity)
- Rising mystical dome (110px diameter)
  - More ethereal/translucent than Protect (70% vs 80% opacity)
  - Flowing appearance
- Flowing arcane patterns (3 streams at 0°, 120°, 240°)
  - Curved gradients (not straight lines)
  - Counter-rotating inner patterns
- 10 magical essence particles swirling upward
- Mystical formation flash (larger than Protect)

**Motion & Timing:**
- Mystical dome:
  - Opacity: [0, 0.6, 0.75, 0.7]
  - ScaleY: [0, 1, 1.08, 1]
  - ScaleX: [0.5, 1, 1.04, 1]
  - More ethereal feel (lower opacity peak)
- Flowing patterns (3 streams):
  - ScaleY: [0, 1.2, 1] (overshoot)
  - Curved gradient: transparent → light purple → purple → transparent
  - Staggered 100ms delays
  - BorderRadius: 50% (creates curves)
- Counter-rotating inner patterns (3 at 30°, 150°, 270°):
  - Opposite rotation direction
  - Thinner (40px vs 65px)
- Essence particles:
  - Swirling spiral motion (not straight up)
  - X offset: cos(i / 10 * 2π) * (30 + sin(i) * 10)
  - Y offset: sin(i / 10 * 2π) * (30 + cos(i) * 10)
- Formation flash: Opacity [0, 1, 0], Scale [0.8, 1.4, 1.6]

#### Phase 3: Sustain (Persistent, until buff expires)

**Visual Elements:**
- Pulsing ethereal barrier (110px diameter)
  - Opacity: [0.3, 0.4, 0.3] (lower than Protect)
  - Scale: [0.97, 1.03, 0.97]
  - Duration: 2.5s per cycle (slower than Protect)
- Flowing arcane patterns (12s rotation, slower and more mystical)
  - Counter-rotating inner patterns (10s, opposite direction)
  - Opacity: [0.4, 0.55, 0.4]
- 6 wispy floating particles (flowing motion, not orbital)
  - Irregular flowing paths (figure-8 patterns)
  - Variable speeds (4-5.2s cycles)
  - Opacity: [0.3, 0.6, 0.4]
- Subtle ground circle (pulsing)
  - Opacity: [0.15, 0.28, 0.15]
  - Scale: [0.98, 1.02, 0.98]

**Motion & Timing:**
- Barrier pulse: 2.5s cycle (vs 2s for Protect)
- Pattern rotation: 12s full rotation (vs 8s for Protect)
- Counter-rotation: 10s opposite direction
- Wispy particles (flowing paths):
  - X: Complex path with 4 waypoints
    - Base angle + offset variations
    - Radius + flow amplitude variations
  - Y: Similar complex path
  - Each particle has unique timing (4 + i * 0.6 seconds)

**Special Effects:**
- Lower opacity than Protect (more ethereal)
- Flowing patterns vs rigid geometry
- Wispy flowing particles vs orbital particles
- Slower rotation (more mystical)

#### Phase 4: Fade (200ms, when buff expires)

**Visual Elements:**
- Barrier dissolving into wispy energy
- Arcane patterns scattering (rotation accelerates)
- 10 wispy particles drifting upward/outward
- Ground circle fading

**Motion & Timing:**
- Barrier: Opacity [0.3, 0.15, 0], Scale [1, 1.15, 1.25]
- Patterns scattering:
  - Opacity: [0.45, 0.25, 0]
  - RotateZ: +40° additional
  - Scale: [1, 1.2, 1.4]
- Wispy particles:
  - Drift to outer positions (radius + 30px)
  - Y offset: -20 to -60px (upward)
  - Opacity: [0.4, 0.2, 0]
  - Scale: [1, 0.6, 0.2]
- Ground circle: Opacity [0.15, 0.08, 0], Scale [1, 1.15, 1.3]

### Technical Specifications

**Total Duration:** 700ms cast + variable sustain + 200ms fade

**Phase Timings Table:**

| Phase | Duration | Start Time | End Time | Notes |
|-------|----------|------------|----------|-------|
| Cast | 300ms | 0ms | 300ms | Fixed |
| Form | 400ms | 300ms | 700ms | Fixed |
| Sustain | Variable | 700ms | Buff expires | Infinite loop |
| Fade | 200ms | Buff expiry | +200ms | Fixed |

**Particle Count Breakdown:**

| Phase | Particle Count | Simultaneous |
|-------|---------------|--------------|
| Cast | 6 (wispy) | 6 |
| Form | 10 | 10 |
| Sustain | 6 (wispy) | 6 |
| Fade | 10 | 10 |
| **Total** | **32** | **~12** |

**Color Palette:**
- Primary: `#9c27b0` (purple)
- Secondary: `#ba68c8` (light purple)
- Accent: `#4a148c` (dark purple)

**Performance Metrics:**
- Similar to Protect (infinite animations)
- Slightly more complex particle paths (flowing vs circular)
- Counter-rotating patterns add visual complexity

### Visual Mockup/Timeline

```
Timeline:
0ms              300ms                 700ms                      Buff Expires    +200ms
|----------------|---------------------|-----------------------...|---------------|
[=== CAST ===][===== FORM =====][======= SUSTAIN (variable) =======][== FADE ==]

Frame 0ms:      [Purple circle appears with flowing runes]
Frame 150ms:    [Circle expands organically, wisps rising]
Frame 300ms:    [Circle complete, arcane energy gathered]
Frame 450ms:    [Mystical dome weaves from energy, swirling particles]
Frame 600ms:    [Flowing patterns interweave in dome]
Frame 700ms:    [Dome complete, begins ethereal pulsing]
Frame 2700ms:   [Dome pulses gently, wispy particles flow] (sustain)
Frame 10000ms:  [Mystical aura continues] (sustain)
Buff Expires:   [Barrier begins dissolving into wisps]
+100ms:         [Wisps drift upward/outward]
+200ms:         [Energy dissipated, protection ended]

Motion Diagram:
Cast:     Ground 〰️ [flowing circle expands]
Form:     Ground 〰️ → ⬒ [mystical dome weaves]
Sustain:  Target ⬒ ≋ [ethereal barrier, flowing wisps]
Fade:     ⬒ ≋≋≋ [dissolves into wispy energy]
```

### Variations & Alternatives

**Enhanced Shell:**
- Brighter arcane glow
- More wispy particles (10 vs 6)
- Faster flowing patterns (8s vs 12s)

**Group Shell:**
- Multiple barriers on different targets
- Interconnected flowing patterns

**Alternative Ideas:**
- **Mana Shield:** Brighter blue-purple, crystalline
- **Ward:** Runic symbols instead of flowing patterns
- **Absorption:** Darker purple, vortex patterns

### Polish Recommendations

**Additional Juice:**
- **Audio:** Mystical humming tone (different from Protect's chime)
- **Sustain Audio:** Ethereal whisper (very subtle)
- **Fade Audio:** Dissipating mystical energy
- **Status Icon:** Small arcane symbol above head
- **Magic Defense UI:** M.DEF stat highlights during buff

### Performance Notes

**Optimizations:**
- Flowing patterns use border-radius for curves (not SVG)
- Wispy particle paths calculated once (not per frame)
- Counter-rotation uses two separate divs (efficient)

**Special Implementation:**
- Counter-rotation achieved with nested motion.div
- Wispy paths use complex but pre-calculated keyframes
- Lower opacity reduces rendering cost

---

## 9. Haste

### Spell Overview

**Name:** Haste
**Spell ID:** `haste`
**Element:** Time/Speed
**Category:** Support (Speed Buff)
**Attack Weight:** N/A (Support spell)
**Total Duration:** 250ms cast + persistent sustain + 200ms fade
**Game Mechanics:** Increases speed/ATB fill rate, persistent speed lines

### Visual Description

An energetic spell that enhances the target's speed. Quick yellow energy bursts around the target with speed lines extending horizontally, creating a sense of rapid motion. The persistent effect shows continuous horizontal speed lines and streaking particles, with minimal visual footprint to emphasize speed without obscuring gameplay.

**Key Visual Elements:**
- Quick yellow energy burst (250ms cast)
- Horizontal speed lines (left and right)
- Diagonal speed lines at 45° angles
- 12 radiating energy particles
- Persistent horizontal speed lines (pulsing during sustain)
- 8 trailing particle effects (streaking pattern)
- Minimal energy glow (low opacity)
- 4 energetic sparkles appearing randomly

**Motion Characteristics:**
- Cast: Fast explosive burst (250ms - fastest cast)
- Sustain: Continuous flowing speed lines
- Fade: Speed lines extend and dissipate

**What Makes It Distinct:** Fastest cast time (250ms), horizontal emphasis, speed lines aesthetic, dynamic motion blur feel, yellow energetic colors, minimal sustained footprint.

### Phase-by-Phase Breakdown

#### Phase 1: Cast (250ms - fastest buff cast)

**Visual Elements:**
- Central energy burst (90px diameter)
- Horizontal speed lines (80px length, left and right)
- Diagonal speed lines (50px length, 4 directions)
- 12 radiating energy particles
- Core flash (60px diameter)

**Particle Details:**
- Count: 12 particles
- Colors: Gold/yellow (#ffd700), bright yellow (#ffeb3b)
- Spread: 360° radial (50px distance)
- Size: 6px
- Staggered 15ms delays

**Motion & Timing:**
- Energy burst:
  - Opacity: [0, 1, 0.8, 0.6]
  - Scale: [0.3, 1.3, 1.1, 1]
  - Times: [0, 0.4, 0.7, 1]
  - Ease: [0.34, 1.56, 0.64, 1] (quick overshoot)
- Horizontal speed lines (2 lines, ±1 direction):
  - Opacity: [0, 1, 0.7, 0]
  - ScaleX: [0, 1, 1, 0.8]
  - X: direction * 60px
  - Width: 80px, Height: 4px
  - Gradient: accent → secondary → transparent
- Diagonal speed lines (4 at -45°, 45°, -135°, 135°):
  - Opacity: [0, 0.8, 0.5, 0]
  - Scale: [0, 1, 1, 0.7]
  - Staggered 20ms delays
- Radiating particles:
  - Radial explosion (50px distance)
  - Opacity: [0, 1, 0.6, 0]
  - Scale: [0, 1.2, 1, 0.5]
- Core flash: Opacity [0, 1, 0], Scale [0.5, 2, 2.5]

**Color Palette:**
- Primary: #ffd700 (gold/yellow)
- Secondary: #ffeb3b (bright yellow)
- Accent: #fff176 (light yellow)

#### Phase 2: Sustain (Persistent, until buff expires)

**Visual Elements:**
- Continuous horizontal speed lines (60px length, pulsing)
  - Primary lines (left/right, alternating)
  - Secondary lines (offset vertically, alternating)
- 8 trailing particle effects (streaking horizontally)
  - Streaking motion (12px × 3px elongated particles)
  - Horizontal flow pattern
- Subtle energy glow (80px diameter)
  - Very low opacity (15-25%)
- 4 energetic sparkles (appearing randomly)

**Motion & Timing:**
- Primary speed lines (2 lines):
  - Opacity: [0.4, 0.6, 0.4]
  - ScaleX: [0.9, 1.1, 0.9]
  - X: [direction * 40, direction * 50, direction * 40]
  - Duration: 1.2s per cycle
  - Staggered 600ms (alternating appearance)
- Secondary speed lines (2 lines):
  - Similar pattern, offset timing (600ms + delays)
  - Y offset: ±10px
  - Smaller (50px length)
- Trailing particles (8 particles):
  - Streaking horizontal motion
  - X: [direction * 20, direction * 40, direction * 20]
  - Y: Variable vertical offsets (±10 to ±18px)
  - Opacity: [0.3, 0.5, 0.3]
  - ScaleX: [0.8, 1.2, 0.8]
  - Duration: 1-1.6s (varying)
  - Elongated shape (12px × 3px)
- Energy glow:
  - Opacity: [0.15, 0.25, 0.15]
  - Scale: [0.95, 1.05, 0.95]
  - Duration: 1.5s per cycle
  - Minimal presence
- Energetic sparkles (4 sparkles):
  - Random radial positions (35px radius)
  - Opacity: [0, 0.7, 0] (flash appearance)
  - Scale: [0, 1.2, 0]
  - Duration: 0.8s per sparkle
  - Staggered 400ms delays
  - RepeatDelay: 0.8s

**Special Effects:**
- Horizontal emphasis (speed direction)
- Alternating patterns create continuous flow
- Low opacity prevents gameplay obstruction
- Streaking particles suggest rapid motion

#### Phase 3: Fade (200ms, when buff expires)

**Visual Elements:**
- Speed lines extending and fading rapidly
- 10 trailing particles dispersing radially
- Energy glow dissipating
- Final flash of speed energy

**Motion & Timing:**
- Speed lines:
  - Opacity: [0.5, 0.2, 0]
  - ScaleX: [1, 1.3, 1.5]
  - X: direction * 70px (extending further)
- Trailing particles:
  - Radial dispersal (angle-based positions)
  - Distance: 30px → 55px
  - Opacity: [0.4, 0.2, 0]
  - Scale: [1, 0.7, 0.3]
- Energy glow:
  - Opacity: [0.2, 0.1, 0]
  - Scale: [1, 1.3, 1.5]
- Final flash:
  - Opacity: [0.3, 0.6, 0]
  - Scale: [0.8, 1.5, 2]
  - Yellow radial gradient

### Technical Specifications

**Total Duration:** 250ms cast + variable sustain + 200ms fade

**Phase Timings Table:**

| Phase | Duration | Start Time | End Time | Notes |
|-------|----------|------------|----------|-------|
| Cast | 250ms | 0ms | 250ms | Fastest buff cast |
| Sustain | Variable | 250ms | Buff expires | Infinite loop |
| Fade | 200ms | Buff expiry | +200ms | Fixed |

**Particle Count Breakdown:**

| Phase | Particle Count | Simultaneous |
|-------|---------------|--------------|
| Cast | 12 | 12 |
| Sustain | 8 (streaming) | 8 |
| Fade | 10 | 10 |
| **Total** | **30** | **~15** |

**Color Palette:**
- Primary: `#ffd700` (gold/yellow)
- Secondary: `#ffeb3b` (bright yellow)
- Accent: `#fff176` (light yellow)

**Performance Metrics:**
- Fast cast compensates for sustained effect
- Horizontal motion lines are efficient (simple transforms)
- Low particle count during sustain

### Visual Mockup/Timeline

```
Timeline:
0ms                  250ms                            Buff Expires    +200ms
|--------------------|-------------------------...-----|--------------||
[==== CAST ====][======== SUSTAIN (variable) ========][=== FADE ===]

Frame 0ms:      [Yellow burst appears at target]
Frame 100ms:    [Speed lines shoot left/right, particles radiate]
Frame 250ms:    [Burst complete, sustained speed lines begin]
Frame 1250ms:   [Speed lines pulse, particles streak] (sustain)
Frame 5000ms:   [Speed effect continues] (sustain)
Buff Expires:   [Speed lines begin extending]
+100ms:         [Lines fully extended, particles dispersing]
+200ms:         [Speed effect gone]

Motion Diagram:
Cast:     Target ──→ ←── [speed lines burst]
          * particles radiate *
Sustain:  Target ═══→ ←═══ [pulsing speed lines]
          ─→ particles streak →─
Fade:     Target ════→ ←════ [lines extend and fade]
```

### Variations & Alternatives

**Enhanced Haste:**
- Brighter glow (higher opacity)
- More speed lines (4 primary + 4 secondary)
- Faster pulse cycle (0.8s vs 1.2s)

**Slow (Opposite):**
- Same structure but blue colors
- Slower pulse (2s vs 1.2s)
- Downward-drifting particles

**Alternative Ideas:**
- **Quick:** Single brief cast, no sustain (instant buff)
- **Time Warp:** Circular clock pattern
- **Adrenaline:** Red/orange with heartbeat pulse

### Polish Recommendations

**Additional Juice:**
- **Audio:** Whoosh sound on cast
- **Sustain Audio:** Very subtle wind/whoosh loop
- **Fade Audio:** Decelerating whoosh
- **Status Icon:** Small speed arrows above head
- **Character Effect:** Slight blur shader on character sprite
- **SPD UI:** Speed stat highlights during buff

### Performance Notes

**Optimizations:**
- Horizontal speed lines use simple ScaleX transforms
- Streaming particles reuse same motion patterns
- Minimal glow reduces rendering cost
- Fast cast reduces total visual load time

**Special Implementation:**
- No ground circle (unlike Protect/Shell)
- Horizontal emphasis through directional motion
- Alternating patterns create persistent flow illusion
- Elongated particle shapes (12×3px) suggest motion blur

---

## 10. Magic Bolt

### Spell Overview

**Name:** Magic Bolt
**Spell ID:** `arcane` (legacy), can be any element
**Element:** Arcane (default), can be fire/ice/lightning
**Category:** Offensive projectile
**Attack Weight:** Light
**Total Duration:** 1400ms (with all phases)
**Game Mechanics:** Light arcane damage to single target

**Note:** Magic Bolt is the original spell from the pre-refactor system. It uses a slightly different architecture with separate charge/cast/projectile/impact subcomponents and a multi-element color system.

### Visual Description

A versatile magical projectile spell that can manifest in different elemental colors. The caster channels magical energy that swirls around them, then releases a glowing bolt that travels to the target and explodes on impact. The spell uses a classic charge → release → projectile → impact pattern.

**Key Visual Elements:**
- Charge particles swirling around caster
- Caster glow during charge/cast
- Arcane symbol (✨ emoji) during cast
- Glowing projectile traveling to target
- Impact particle burst
- Screen shake on impact
- Target hit reaction

**Motion Characteristics:**
- Charge: Gathering energy, caster animation
- Cast: Hand gesture with symbol
- Projectile: Straight-line travel
- Impact: Burst explosion with shake

**What Makes It Distinct:** Multi-element capable, emoji symbol, separate subcomponent architecture, longer overall duration, classic RPG spell aesthetic.

### Phase-by-Phase Breakdown

#### Phase 1: Charge (400ms)

**Visual Elements:**
- Charge particles around caster (configurable count)
- Caster glow (80px diameter)
  - Scale: [1, 1.1, 1]
  - Rotation: [0, -5, 5, 0]

**Particle Details:**
- Count: Configured per instance (typically 15-20)
- Colors: Element-based (ELEMENT_COLORS[element])
- Spread: 50px radius
- Component: `ChargeParticles`

**Motion & Timing:**
- Caster animation: Subtle scale/rotate (400ms)
- Glow: Opacity 0 → 0.8, Scale 0 → 1.2
- Particles: Swirling pattern
- Duration: 400ms

**Color Palette (per element):**
- Arcane: Primary #8b5cf6, Glow #a78bfa, Particles #c4b5fd
- Fire: Primary #f59e0b, Glow #fbbf24, Particles #fcd34d
- Ice: Primary #3b82f6, Glow #60a5fa, Particles #93c5fd
- Lightning: Primary #eab308, Glow #facc15, Particles #fde047

#### Phase 2: Cast (200ms)

**Visual Elements:**
- Arcane symbol (✨ emoji, 3rem size)
  - Rotation: 0° → 180°
  - Color: Element glow color
  - Text-shadow: Glow effect

**Motion & Timing:**
- Symbol: Scale [0, 1.2], Rotate [0, 180], Opacity [0, 1]
- Duration: 200ms
- Exit: Scale → 0, Opacity → 0

#### Phase 3: Projectile (600ms)

**Visual Elements:**
- Projectile component (16px diameter)
- Glowing orb with element color
- Component: `Projectile`

**Motion & Timing:**
- Linear travel from caster to target
- Duration: 600ms (longer than refactored spells)
- Glow intensity: Configurable
- Color: Element primary color

**Trajectory:**
- Start: Caster position
- End: Target position
- Path: Straight line
- Speed: Constant (linear easing)

#### Phase 4: Impact (200ms)

**Visual Elements:**
- Impact effects at target position
- Particle burst
- Damage numbers (if provided)
- Component: `ImpactEffects`

**Motion & Timing:**
- Screen shake: X: [0, -4, 4, -4, 4, 0], Y: [0, 2, -2, 2, -2, 0]
- Target reaction: X: [0, 10, -10, 5, -5, 0], Opacity flicker
- Duration: 200ms
- Particle burst: Element-colored

### Technical Specifications

**Total Duration:** 1400ms (400 + 200 + 600 + 200)

**Phase Timings Table:**

| Phase | Duration | Start Time | End Time | Component |
|-------|----------|------------|----------|-----------|
| Charge | 400ms | 0ms | 400ms | ChargeParticles |
| Cast | 200ms | 400ms | 600ms | Arcane symbol |
| Projectile | 600ms | 600ms | 1200ms | Projectile |
| Impact | 200ms | 1200ms | 1400ms | ImpactEffects |

**Component Architecture:**
- `MagicBoltAnimation` - Main orchestrator
- `ChargeParticles` - Charge phase subcomponent
- `Projectile` - Projectile phase subcomponent
- `ImpactEffects` - Impact phase subcomponent

**Props Interface:**
```typescript
interface MagicBoltAnimationProps {
  casterPosition: { x: number; y: number };
  targetPosition: { x: number; y: number };
  damage: number;
  isCritical?: boolean;
  element?: 'arcane' | 'fire' | 'ice' | 'lightning';
  onComplete?: () => void;
  isActive: boolean;
}
```

**Color System:**
```typescript
export const ELEMENT_COLORS = {
  arcane: {
    primary: '#8b5cf6',
    glow: '#a78bfa',
    particles: '#c4b5fd'
  },
  fire: { /* ... */ },
  ice: { /* ... */ },
  lightning: { /* ... */ }
};
```

**Performance Metrics:**
- Uses separate subcomponents (vs monolithic)
- Longer duration than refactored spells
- isActive prop controls animation start
- Resets to idle state after completion

### Visual Mockup/Timeline

```
Timeline:
0ms                400ms         600ms                    1200ms    1400ms
|------------------|-------------|------------------------|---------|
[==== CHARGE ====][== CAST ==][======= TRAVEL =======][= IMPACT =]

Frame 0ms:      [Particles swirl around caster]
Frame 200ms:    [Caster glows, charging energy]
Frame 400ms:    [Energy fully charged]
Frame 500ms:    [✨ symbol appears, rotating]
Frame 600ms:    [Projectile launches from caster]
Frame 900ms:    [Projectile mid-flight] ─────●──→
Frame 1200ms:   [Projectile reaches target] ⚡ IMPACT!
Frame 1300ms:   [Burst explosion, screen shakes]
Frame 1400ms:   [Effects fade, target reacts]

Motion Diagram:
Charge:     Caster ⟲ [particles swirl]
Cast:       Caster ✨ [symbol rotates]
Projectile: Caster ----------●------> Target
Impact:     Target ⚡ [burst + shake]
```

### Variations & Alternatives

**Critical Hit:**
- Enhanced via isCritical prop
- Larger impact effects
- Increased screen shake
- Critical damage numbers

**Element Variants:**
- Fire: Orange tones, flame particles
- Ice: Blue tones, frost particles
- Lightning: Yellow tones, electric particles
- Arcane: Purple tones, mystical particles

**Migration Note:**
This spell predates the refactored spell system. New spells use the consolidated architecture (single component, no separate subcomponents). Magic Bolt is kept for backward compatibility and demonstrates the original design pattern.

### Polish Recommendations

**Legacy Considerations:**
- Consider refactoring to match new spell architecture
- Update to use unified color constants (ARCANE_COLORS vs ELEMENT_COLORS)
- Reduce travel duration to match new spell pacing (300ms vs 600ms)

**Potential Improvements:**
- Add trailing particles during projectile phase
- Enhance impact effects to match newer spells
- Add elemental-specific impact patterns

### Performance Notes

**Architecture Differences:**
- Subcomponent system vs monolithic
- State management via useState and setTimeout
- isActive prop pattern (similar to buffs)
- Separate imports for each subcomponent

**Backward Compatibility:**
- Must maintain ELEMENT_COLORS constant
- Cannot break existing animation controller calls
- MAGIC_BOLT_TIMINGS constant exported from types.ts

---

## Spell Comparison Table

| Spell | Element | Category | Duration (ms) | Particle Peak | Attack Weight | Screen Flash |
|-------|---------|----------|---------------|---------------|---------------|--------------|
| **Fireball** | Fire | Projectile | 950 (~1138) | ~50 | Medium | 15% Red |
| **Ice Shard** | Ice | Projectile | 900 (~1080) | ~35 | Light | 10% Blue |
| **Lightning** | Lightning | Instant | 900 (~1016) | ~30 | Medium | 20% Yellow |
| **Holy Beam** | Holy | Beam | 1000 (~1126) | ~35 | Medium | 15% Gold |
| **Meteor** | Fire | AOE | 1500 (~1683) | ~45 | Heavy | 25% Red |
| **Heal** | Nature | Support | 1100 | ~25 | N/A | None |
| **Protect** | Ice | Buff | 700 + sustain | ~10 | N/A | None |
| **Shell** | Arcane | Buff | 700 + sustain | ~12 | N/A | None |
| **Haste** | Time | Buff | 250 + sustain | ~15 | N/A | None |
| **Magic Bolt** | Arcane | Projectile | 1400 | ~20 | Light | Variable |

**Notes:**
- Actual durations include ~150ms overhead (12-20% variance)
- Particle peak shows maximum simultaneous particles
- Screen flash opacity for offensive spells only
- Sustain duration for buffs is variable (based on buff duration)

---

## Quick Reference Card

### Offensive Spell Colors

```
Fire:      🔴 #ff6b35 (orange), #ff4444 (red), #ffaa00 (yellow-orange)
Ice:       🔵 #4da6ff (blue), #b3e0ff (light blue), #ffffff (white)
Lightning: ⚡ #ffeb3b (yellow), #fff176 (light yellow), #ffffff (white)
Holy:      ✨ #ffd700 (gold), #ffffcc (light gold), #ffffff (white)
```

### Support Spell Colors

```
Heal:      💚 #8bc34a (green), #c5e1a5 (light green), #ffffff (white)
Protect:   🛡️ #4da6ff (blue), #b3e0ff (light blue), #ffffff (white)
Shell:     🔮 #9c27b0 (purple), #ba68c8 (light purple), #4a148c (dark purple)
Haste:     ⚡ #ffd700 (gold), #ffeb3b (bright yellow), #fff176 (light yellow)
```

### Phase Duration Patterns

```
Light Attack:     600-900ms   (Ice Shard, Magic Bolt)
Medium Attack:    900-1000ms  (Fireball, Lightning, Holy Beam)
Heavy Attack:     1500ms      (Meteor)
Support Spell:    700-1100ms  (Heal, buffs)
```

### Particle Count Guidelines

```
Recommended Max:  20 per effect
Hard Max:        30 per effect
Light Spells:    10-25 particles
Medium Spells:   25-35 particles
Heavy Spells:    35-45 particles
```

### Common Phase Structure

```
Offensive:  Charge → Cast → Travel/Strike → Impact
Beam:       Charge → Cast → Beam → Impact
Support:    Cast → Descend/Form → Absorption/Sustain → Complete/Fade
```

---

## Document Change Log

**Version 1.0 (2025-10-04)**
- Initial complete specification
- All 10 wizard spells documented
- Phase breakdowns, technical specs, visual mockups
- Comparison tables and quick reference
- Based on actual implementations in codebase

---

**End of Wizard Spell Animation Specifications**
