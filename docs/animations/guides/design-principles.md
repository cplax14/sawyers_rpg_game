# Animation Design Principles

This guide documents the visual philosophy and design standards that make turn-based combat animations feel dynamic, readable, and satisfying. Every animation in this system follows these principles to create a cohesive, polished experience.

## Table of Contents

1. [Core Visual Philosophy](#core-visual-philosophy)
2. [Readability Standards](#readability-standards)
3. [Animation Principles in Practice](#animation-principles-in-practice)
4. [Design Guidelines](#design-guidelines)
5. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)

---

## Core Visual Philosophy

Great combat animations create **anticipation**, deliver **impact**, and follow through to **resolution**. These three principles are the foundation of satisfying game feel in turn-based combat.

### 1. Anticipation: Telegraphing the Action

**Anticipation** is the wind-up before the pitch, the deep breath before the shout. It builds tension and gives players time to register what's happening.

#### Why Anticipation Matters

In turn-based combat, players aren't controlling attacks in real-time. Animations need to clearly signal:
- **What type of attack is coming** (offensive, healing, buff)
- **What element it is** (fire, ice, lightning, holy)
- **Where it will hit** (projectile trajectory, AOE target indicators)

Without anticipation, attacks feel sudden and weightless. With it, they feel deliberate and powerful.

#### Implementation in Spells

**Fireball (350ms charge phase):**
```typescript
// Phase 1: Anticipation
{phase === 'charge' && (
  <>
    {/* 18 red/orange particles swirl around caster's hand */}
    <ParticleSystem particleCount={18} colors={[FIRE_COLORS.primary, FIRE_COLORS.secondary]} />

    {/* Growing inner glow telegraphs the gathering energy */}
    <motion.div
      animate={{ opacity: [0, 0.8, 0.8], scale: [0, 1.2, 1.2] }}
      style={{ background: 'radial-gradient(circle, #ff6b35, #ff4444, transparent)' }}
    />

    {/* Pulsing outer glow adds intensity */}
    <motion.div
      animate={{ opacity: [0, 0.6, 0.4], scale: [0.5, 1.5, 1.3] }}
    />
  </>
)}
```

**What This Achieves:**
- Players see red/orange = fire attack coming
- Swirling particles = energy gathering = something BIG is about to happen
- Growing intensity builds anticipation for the explosion

**Lightning (350ms charge phase):**
```typescript
{/* Crackling electric sparks telegraph electric attack */}
<ParticleSystem particleCount={12} colors={[LIGHTNING_COLORS.primary]} />

{/* Pulsing electric aura: [0, 0.6, 0.4, 0.6, 0.4, 0.7] */}
{/* Erratic pulsing mimics electricity's unstable nature */}

{/* Erratic electric arcs - random flickering */}
{[0, 1, 2].map(i => (
  <motion.div
    animate={{ opacity: [0, 1, 0, 1, 0] }}  // Flicker pattern
    style={{ transform: `rotate(${i * 120}deg)` }}
  />
))}
```

**What This Achieves:**
- Yellow sparks instantly read as "lightning"
- Erratic flickering mimics real electricity
- Multiple arcs create chaotic energy feeling

**Meteor (600ms charge + 400ms warning = 1000ms anticipation!):**
```typescript
{/* Phase 1: Charge - Red glow appears in sky */}
<motion.div
  animate={{ opacity: [0, 0.3, 0.5, 0.7], scale: [0, 1, 1.3, 1.5] }}
  style={{ top: -100, background: 'radial-gradient(circle, #ff4444)' }}
/>

{/* Phase 2: Warning - Shadow circles appear on ground */}
{meteorImpacts.map(impact => (
  <motion.div
    style={{
      background: 'radial-gradient(ellipse, rgba(0,0,0,0.7), transparent)',
      border: '2px dashed #ff4444'
    }}
  />
))}

{/* Pulsing warning rings */}
<motion.div
  animate={{ opacity: [0, 0.6, 0.4, 0.6, 0.4], scale: [0.5, 1.2, 1, 1.3, 1.1] }}
/>
```

**What This Achieves:**
- 1000ms gives players time to see it's an AOE attack
- Shadow circles show EXACTLY where meteors will hit
- Pulsing warns "danger incoming"
- Red sky glow creates ominous atmosphere

#### Anticipation Design Rules

1. **Charge phases should be 200-600ms** depending on attack weight
   - Light attacks (Ice Shard): 250-400ms
   - Medium attacks (Fireball, Lightning): 350-400ms
   - Heavy attacks (Meteor): 600ms+

2. **Use color to telegraph element immediately:**
   - Red/orange = Fire
   - Blue/cyan = Ice
   - Yellow/white = Lightning
   - Gold = Holy
   - Purple = Arcane
   - Green = Healing

3. **Particles should converge (negative spread) or swirl** during charge
   - Converging creates "gathering power" feeling
   - Diverging particles feel like dissipation

4. **Glow intensity should build** from 0 → peak
   - Opacity: [0, 0.6, 0.8] for gradual buildup
   - Scale: [0, 1, 1.2] for growing energy

---

### 2. Impact: The Moment of Power

**Impact** is the payoff. This is where the animation delivers on the promise built by anticipation. Impact should feel STRONG.

#### Why Impact Matters

Turn-based combat lacks the kinesthetic feedback of real-time action. Visual impact compensates by making hits FEEL powerful through:
- **Explosive particle bursts**
- **Screen flash effects**
- **Expanding shockwaves**
- **Color saturation spikes**

Without strong impact, attacks feel like they're just "touching" the target. With it, they SLAM home.

#### Implementation in Spells

**Fireball Impact (150ms):**
```typescript
{/* Core explosion flash - bright center */}
<motion.div
  animate={{ opacity: [0, 1, 0.6, 0], scale: [0, 1.5, 2, 2.5] }}
  style={{ background: 'radial-gradient(circle, #ffaa00 0%, #ff6b35 30%, #ff4444 60%, transparent)' }}
/>

{/* Explosion ring shockwave - expanding circle */}
<motion.div
  animate={{ opacity: [0.8, 0.4, 0], scale: [0, 2, 3] }}
  style={{ border: '3px solid #ff6b35', boxShadow: '0 0 20px #ff6b35' }}
/>

{/* 28 radiating explosion particles - main burst */}
<ParticleSystem particleCount={28} spread={150} gravity={80} />

{/* 15 secondary particles - debris cloud */}
<ParticleSystem particleCount={15} spread={100} lifetime={180} />

{/* Screen flash effect - full screen tint */}
<motion.div
  animate={{ opacity: [0, 0.15, 0] }}
  style={{ position: 'fixed', background: FIRE_COLORS.primary }}
/>
```

**What This Achieves:**
- **Visual hierarchy:** Bright center → ring → particles → screen flash
- **Layered effects** create depth and complexity
- **Fast timing (150ms)** creates snappy, punchy impact
- **28 particles** is substantial without overwhelming
- **Screen flash** sells the POWER of the explosion

**Lightning Impact (250ms - longer for electric arcs):**
```typescript
{/* Central electric burst */}
<motion.div
  animate={{ opacity: [0, 1, 0.7, 0.5, 0], scale: [0, 1.2, 1.5, 1.8, 2] }}
/>

{/* 8 electric arc bursts radiating outward at 45° intervals */}
{[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
  <motion.div
    animate={{ opacity: [0, 1, 0.8, 0.6, 0], scaleX: [0, 1, 1.2, 1, 0.8] }}
    style={{
      background: 'linear-gradient(to right, #ffeb3b 0%, #fff176 50%, transparent)',
      transform: `rotate(${angle}deg)`
    }}
  />
))}

{/* 24 crackling electric particles */}
<ParticleSystem particleCount={24} spread={120} gravity={0} />

{/* Lingering electric arcs - erratic flickering */}
{[0, 1, 2, 3].map(i => (
  <motion.div
    animate={{
      opacity: [0, 1, 0, 0.8, 0, 0.6, 0],  // Erratic pattern
      x: [(random - 0.5) * 40, (random - 0.5) * 60],
      y: [(random - 0.5) * 40, (random - 0.5) * 60]
    }}
  />
))}
```

**What This Achieves:**
- **Radial arcs** create electric feeling
- **Erratic flickering** mimics electricity's behavior
- **Longer duration (250ms)** lets electric effects linger realistically
- **Random movement** feels chaotic and powerful

**Ice Shard Impact (100ms - fast shatter):**
```typescript
{/* Core shatter burst */}
<motion.div
  animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 1.8] }}
/>

{/* 8 ice fragment shards flying outward (angular, not round) */}
{[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
  <motion.div
    initial={{ x: targetX, y: targetY, rotate: angle }}
    animate={{
      x: targetX + cos(angle) * 50,
      y: targetY + sin(angle) * 50,
      opacity: [0, 1, 0.7, 0],
      rotate: angle + 180  // Tumbling effect
    }}
    style={{
      borderLeft: '4px solid transparent',
      borderRight: '4px solid transparent',
      borderBottom: '12px solid #4da6ff'  // Triangle shape
    }}
  />
))}

{/* 22 shatter particles */}
<ParticleSystem particleCount={22} spread={130} gravity={100} />

{/* Frost cloud - muted, quick */}
<motion.div
  animate={{ opacity: [0, 0.6, 0], scale: [0.5, 2, 2.5] }}
  style={{ background: 'radial-gradient(circle, #b3e0ff40, transparent)' }}
/>
```

**What This Achieves:**
- **Fast timing (100ms)** mimics brittle glass shattering
- **Angular shards** (triangles) read as "ice breaking"
- **Tumbling rotation** adds realism to fragments
- **Lower opacity frost cloud** keeps ice feeling cold/muted

#### Impact Design Rules

1. **Impact should be the SHORTEST phase** (100-300ms)
   - Fast = snappy, satisfying
   - Too long = feels sluggish

2. **Layer 3-5 simultaneous effects:**
   - Core explosion/burst (brightest)
   - Expanding ring/shockwave
   - Radiating particles (most dramatic)
   - Secondary particles (debris/dust)
   - Screen flash (optional, for big attacks)

3. **Particle counts should SPIKE at impact:**
   - Charge: 10-18 particles
   - Travel: 8-15 particles
   - **Impact: 20-30 particles** (peak visual density)

4. **Use screen flash sparingly:**
   - Opacity: 0.1-0.2 max (subtle tint)
   - Duration: 50-150ms
   - Only for major spells (Fireball, Lightning, Meteor, Holy Beam)

5. **Motion should be EXPLOSIVE:**
   - Particles: spread 120-150 (wide scatter)
   - Easing: ease-out (fast start, slow end)
   - Opacity: peak immediately [0, 1, 0.7, 0]

---

### 3. Follow-Through: The Aftermath

**Follow-through** is the resolution that completes the action. It's the smoke after the explosion, the sparks fading, the dust settling. This phase transitions back to gameplay.

#### Why Follow-Through Matters

Without follow-through, animations feel "cut off." The eye needs time to register what happened and transition back to combat UI. Follow-through:
- **Sells the weight** of the attack (heavy attacks have lingering effects)
- **Provides breathing room** before next turn
- **Looks polished** (professional animation quality)

#### Implementation in Spells

**Fireball (implicit in impact fade-out):**
```typescript
{/* Impact particles have gravity - fall after burst */}
<ParticleSystem
  particleCount={28}
  gravity={80}  // Particles arc down after explosion
  lifetime={150}  // Fade as they fall
/>

{/* Secondary particles linger slightly longer */}
<ParticleSystem
  particleCount={15}
  lifetime={180}  // 30ms longer than primary
/>

{/* Explosion flash fades over 150ms */}
<motion.div
  animate={{ opacity: [0, 1, 0.6, 0] }}  // Notice: doesn't cut to 0 immediately
/>
```

**What This Achieves:**
- Particles don't disappear instantly - they fall with gravity
- Staggered lifetimes create natural dissipation
- Opacity fades gradually, not abruptly

**Meteor (explicit 200ms aftermath phase):**
```typescript
{phase === 'aftermath' && (
  <>
    {/* Rising dust clouds from each impact */}
    {meteorImpacts.map(impact => (
      <motion.div
        animate={{
          opacity: [0, 0.6, 0.4, 0],
          scale: [0.5, 1.5, 2, 2.5],
          y: [-20, -40, -60, -80]  // Rises upward
        }}
        style={{ background: 'radial-gradient(circle, rgba(100,100,100,0.6), transparent)' }}
      />
    ))}

    {/* Crater glow fades */}
    <motion.div
      animate={{ opacity: [0.7, 0.4, 0], scale: [1, 1.2, 1.3] }}
      style={{ background: 'radial-gradient(ellipse, #ffaa00, #ff4444, transparent)' }}
    />

    {/* Lingering embers float upward */}
    <ParticleSystem
      particleCount={6}
      gravity={-30}  // Negative = float UP
      lifetime={200}
    />
  </>
)}
```

**What This Achieves:**
- **Dust rising** creates realistic aftermath
- **Crater glow** lingers to show "heat remains"
- **Embers floating** adds atmospheric detail
- **200ms** gives visual breathing room before next turn

**Ice Shard (implicit - frost cloud dissipation):**
```typescript
{/* Frost cloud fades quickly (ice is cold/quick) */}
<motion.div
  animate={{ opacity: [0, 0.6, 0], scale: [0.5, 2, 2.5] }}
  duration={100}  // Matches impact duration
/>

{/* Shatter particles have high gravity - fall fast */}
<ParticleSystem
  gravity={100}  // Fall quickly (ice = brittle)
  lifetime={100}
/>
```

**What This Achieves:**
- Fast dissipation matches ice's brittle nature
- No explicit aftermath phase needed (element characteristic)
- Keeps animation snappy

#### Follow-Through Design Rules

1. **Duration depends on attack weight:**
   - Light attacks (Ice): 0-100ms (implicit in impact fade)
   - Medium attacks (Fireball): 100-150ms (staggered particle fades)
   - Heavy attacks (Meteor): 200ms+ (explicit aftermath phase)

2. **Use gravity and physics for natural motion:**
   - Explosions: particles fall with gravity (positive value)
   - Magic: particles float/drift (low or negative gravity)
   - Dust: rises slowly then dissipates

3. **Stagger effect lifetimes** for gradual fade:
   - Primary particles: 150ms
   - Secondary particles: 180ms
   - Glow effects: 200ms
   - Don't make everything fade at once

4. **Opacity should never cut to 0 abruptly:**
   - Good: [0, 1, 0.7, 0.4, 0]
   - Bad: [0, 1, 0]
   - Exception: Very fast attacks (Ice Shard) can use [0, 1, 0]

---

## Readability Standards

Animations should enhance combat, never obscure it. These standards ensure players can always see critical information.

### Rule 1: Never Obscure HP Bars

**Problem:**
HP bars are the most critical combat UI. Players need to see health at all times.

**Solution:**
Position animation elements to avoid HP bar zones:

```typescript
// Typical combat layout
// Player HP bar: top-left (0-200px height)
// Enemy HP bar: top-right (0-200px height)

// Caster position typically: (100, 200) - below HP zone
// Target position typically: (500, 200) - below HP zone

// GOOD: Particles spread around target, not upward into HP
<ParticleSystem
  originY={targetY}  // 200px - below HP bar
  spread={120}  // Radial spread, not all upward
  gravity={80}  // Falls downward, away from HP
/>

// BAD: Large effect that covers top of screen
<motion.div
  style={{
    top: 0,  // ❌ Covers HP bars
    height: '50%'  // ❌ Takes up half screen
  }}
/>

// GOOD: Lightning from sky stays in lane
<motion.div
  style={{
    left: targetX - 30,  // Narrow column
    width: 60,  // Only 60px wide
    top: 0,
    height: targetY  // Stops at target, doesn't cover UI below
  }}
/>
```

### Rule 2: Never Obscure Character Sprites

**Problem:**
Players need to see who's attacking and who's being hit.

**Solution:**
Keep character zones (±50px around position) clear:

```typescript
// Character occupies roughly 100x100px centered on position
const characterZone = {
  left: characterX - 50,
  right: characterX + 50,
  top: characterY - 50,
  bottom: characterY + 50
};

// GOOD: Charge particles orbit AROUND caster, not on top
<ParticleSystem
  originX={casterX}
  originY={casterY}
  spread={60}  // Particles spread OUT from character
  size={6}  // Small enough to not cover face
/>

// GOOD: Impact burst centered on target but expands outward
<motion.div
  style={{
    left: targetX - 60,  // Start larger than character zone
    top: targetY - 60,
    width: 120,  // Expands away from character
    height: 120
  }}
  animate={{ scale: [0, 1.5, 2, 2.5] }}  // Grows AWAY from character
/>

// BAD: Opaque overlay directly on character
<motion.div
  style={{
    left: characterX - 50,  // ❌ Directly covers character
    width: 100,
    opacity: 1  // ❌ Fully opaque
  }}
/>
```

### Rule 3: Use Transparency for Layered Effects

**Problem:**
Multiple simultaneous effects can create visual clutter.

**Solution:**
Layer with decreasing opacity:

```typescript
// Layer 1: Core effect (brightest, smallest)
<motion.div
  style={{ opacity: 1.0 }}  // Fully opaque core
/>

// Layer 2: Glow (medium opacity, medium size)
<motion.div
  style={{ opacity: 0.6 }}  // 60% transparent
  filter="blur(8px)"  // Blur makes transparency prettier
/>

// Layer 3: Outer glow (most transparent, largest)
<motion.div
  style={{ opacity: 0.3 }}  // 70% transparent
  filter="blur(20px)"
/>

// Screen flash: VERY transparent
<motion.div
  animate={{ opacity: [0, 0.15, 0] }}  // Only 15% at peak
/>
```

### Rule 4: Maintain Visual Hierarchy

**Problem:**
Too many effects at once create "visual noise."

**Solution:**
Use size, brightness, and motion to establish hierarchy:

```typescript
// PRIORITY 1: Main action (brightest, sharpest)
// Example: Lightning bolt
<motion.path
  stroke={LIGHTNING_COLORS.accent}  // Brightest color
  strokeWidth="4"  // Thickest
  filter="drop-shadow(0 0 8px #ffeb3b)"  // Sharp glow
/>

// PRIORITY 2: Supporting effects (medium brightness, blurred)
// Example: Sky flash
<motion.div
  style={{
    background: 'radial-gradient(ellipse, #ffeb3b60, transparent)',  // 60 = medium opacity
    filter: 'blur(20px)'  // Blurred = background element
  }}
/>

// PRIORITY 3: Atmospheric effects (dimmest, most blurred)
// Example: Dust clouds
<motion.div
  style={{
    background: 'radial-gradient(circle, rgba(100,100,100,0.3), transparent)',  // 0.3 = very dim
    filter: 'blur(12px)'
  }}
/>
```

**Visual Hierarchy in Fireball:**
1. **Spinning fireball core** (brightest, sharpest) - player watches this
2. **Explosion burst** (bright, medium blur) - dramatic impact
3. **Shockwave ring** (medium brightness, sharp edge) - sells force
4. **Particles** (medium brightness, small) - adds detail
5. **Screen flash** (dimmest, full screen) - atmosphere
6. **Smoke** (dimmest, most blurred) - aftermath

### Rule 5: Timing Ensures Readability

**Problem:**
Too much happening at once overwhelms the eye.

**Solution:**
Sequence effects with slight delays:

```typescript
// GOOD: Staggered effects direct attention
{meteorImpacts.map((impact, index) => (
  <motion.div
    animate={{ ... }}
    transition={{
      delay: index * 0.05  // 50ms delay between each meteor
    }}
  />
))}

// Result: Eye follows meteors 1 → 2 → 3 clearly

// GOOD: Lightning arcs appear in sequence
{[0, 1, 2, 3].map(i => (
  <motion.div
    animate={{ ... }}
    transition={{
      delay: i * 0.04  // 40ms stagger
    }}
  />
))}

// BAD: Everything at once
{effects.map(effect => (
  <motion.div animate={{ ... }} />  // ❌ No delay - visual chaos
))}
```

**Optimal Delays:**
- **Sequential projectiles:** 50-100ms apart
- **Simultaneous bursts:** 0-20ms (feels instant but slightly cleaner)
- **Aftermath effects:** 30-50ms (leisurely dissipation)

---

## Animation Principles in Practice

Let's examine complete spell breakdowns showing how all principles work together.

### Case Study: Fireball

**Total Duration:** 950ms
**Phases:** Charge (350ms) → Cast (150ms) → Travel (300ms) → Impact (150ms)

#### Anticipation (350ms Charge)

```typescript
{/* PRIMARY VISUAL: 18 particles swirling */}
<ParticleSystem
  particleCount={18}
  colors={['#ff6b35', '#ff4444']}  // Immediately reads as FIRE
  spread={60}  // Wide spread = gathering from area
  lifetime={350}
  gravity={0}  // Float in place while gathering
/>

{/* SECONDARY: Growing inner glow */}
<motion.div
  animate={{
    opacity: [0, 0.8, 0.8],  // Build to 80% quickly, hold
    scale: [0, 1.2, 1.2]  // Grow to 1.2x, hold
  }}
  duration={350}
/>
```

**Design Choices:**
- **18 particles** is enough to feel substantial without cluttering
- **Orange/red colors** instantly telegraph fire element
- **60px spread** creates gathering motion
- **Holds at peak** (0.8 opacity, 1.2 scale) creates tension before release

#### Impact (150ms)

```typescript
{/* PRIMARY: Core explosion (brightest center) */}
<motion.div
  animate={{
    opacity: [0, 1, 0.6, 0],  // Peak immediately, fade
    scale: [0, 1.5, 2, 2.5]  // Explosive expansion
  }}
  duration={150}
  style={{
    background: 'radial-gradient(
      circle,
      #ffaa00 0%,    // Bright center
      #ff6b35 30%,   // Fire orange
      #ff4444 60%,   // Red edge
      transparent 80%
    )'
  }}
/>

{/* SECONDARY: Shockwave ring */}
<motion.div
  animate={{
    opacity: [0.8, 0.4, 0],  // Visible but not competing with core
    scale: [0, 2, 3]  // Expands faster than core
  }}
  style={{
    border: '3px solid #ff6b35',
    boxShadow: '0 0 20px #ff6b35'  // Glowing edge
  }}
/>

{/* TERTIARY: 28 radiating particles */}
<ParticleSystem
  particleCount={28}
  spread={150}  // Wide scatter
  gravity={80}  // Fall after bursting
  lifetime={150}
/>
```

**Design Choices:**
- **3-layer visual:** Core → Ring → Particles creates depth
- **Radial gradient** concentrates brightness at center
- **Ring expands faster** (scale 3 vs 2.5) creates shockwave effect
- **28 particles** is peak density for "BIG explosion"
- **Gravity 80** makes particles arc realistically

#### Follow-Through (implicit)

```typescript
{/* Particles continue falling from impact */}
// gravity={80} causes natural arc trajectory

{/* Secondary particles linger */}
<ParticleSystem
  particleCount={15}
  lifetime={180}  // 30ms longer than primary burst
/>

{/* Screen flash fades gradually */}
<motion.div
  animate={{ opacity: [0, 0.15, 0] }}  // Peak at 15%, fade
  duration={150}
/>
```

**Design Choices:**
- **Gravity creates natural follow-through** - no explicit aftermath needed
- **Staggered lifetimes** (150ms vs 180ms) prevent sudden cutoff
- **Screen flash fades in 150ms** - subtle completion cue

### Case Study: Lightning

**Total Duration:** 900ms
**Phases:** Charge (350ms) → Cast (100ms) → Strike (200ms) → Impact (250ms)

#### Anticipation (350ms Charge)

```typescript
{/* PRIMARY: Crackling electric sparks */}
<ParticleSystem
  particleCount={12}
  colors={['#ffeb3b', '#fff176', '#ffffcc']}  // Yellow = lightning
  spread={50}
  gravity={0}
/>

{/* SECONDARY: Erratic pulsing aura */}
<motion.div
  animate={{
    opacity: [0, 0.6, 0.4, 0.6, 0.4, 0.7],  // UNEVEN pulse (erratic!)
    scale: [0.8, 1.1, 0.9, 1.2, 1, 1.3]
  }}
/>

{/* TERTIARY: Erratic electric arcs */}
{[0, 1, 2].map(i => (
  <motion.div
    animate={{
      opacity: [0, 1, 0, 1, 0],  // Flicker on/off
      scaleX: [0, 1, 0.5, 1, 0]
    }}
    transition={{ delay: i * 0.08 }}  // Staggered flicker
  />
))}
```

**Design Choices:**
- **Uneven pulse pattern** mimics electricity's chaos
- **Flickering arcs** reinforce electric nature
- **Staggered timing** (80ms delays) creates erratic feeling
- **Yellow colors** instantly read as lightning

#### Impact (250ms - LONGER for electric lingering)

```typescript
{/* PRIMARY: Central burst */}
<motion.div
  animate={{
    opacity: [0, 1, 0.7, 0.5, 0],  // 4-step fade (longer than Fireball)
    scale: [0, 1.2, 1.5, 1.8, 2]
  }}
/>

{/* SECONDARY: 8 radiating electric arcs */}
{[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
  <motion.div
    animate={{
      opacity: [0, 1, 0.8, 0.6, 0],  // 4-step fade
      scaleX: [0, 1, 1.2, 1, 0.8]  // Expand then contract
    }}
    transition={{ delay: Math.random() * 0.05 }}  // Random timing
  />
))}

{/* TERTIARY: Lingering electric arcs */}
{[0, 1, 2, 3].map(i => (
  <motion.div
    animate={{
      opacity: [0, 1, 0, 0.8, 0, 0.6, 0],  // Erratic flicker pattern
      x: [(random - 0.5) * 40, (random - 0.5) * 60],
      y: [(random - 0.5) * 40, (random - 0.5) * 60]
    }}
  />
))}
```

**Design Choices:**
- **250ms duration** (vs Fireball's 150ms) lets electric effects linger
- **4-step fade** instead of 3-step creates lingering feeling
- **Random delays** on arcs create chaotic electric behavior
- **Erratic flickering** mimics real electricity
- **Random movement** feels unstable/dangerous

### Case Study: Meteor (AOE)

**Total Duration:** 1500ms
**Phases:** Charge (600ms) → Warning (400ms) → Impact (300ms) → Aftermath (200ms)

#### Anticipation (600ms + 400ms = 1000ms total!)

```typescript
{/* PHASE 1 - CHARGE: Red glow gathering in sky */}
<motion.div
  animate={{
    opacity: [0, 0.3, 0.5, 0.7],  // Gradual buildup
    scale: [0, 1, 1.3, 1.5]
  }}
  duration={600}
  style={{
    top: -100,  // Above screen
    background: 'radial-gradient(circle, #ff4444 0%, #ffaa00 50%, transparent)'
  }}
/>

{/* PHASE 2 - WARNING: Shadow circles on ground */}
{meteorImpacts.map((impact, index) => (
  <>
    {/* Shadow indicator - shows EXACTLY where meteor hits */}
    <motion.div
      animate={{
        opacity: [0, 0.6, 0.7, 0.8],
        scale: [0, 0.8, 1, 1.1]
      }}
      transition={{ delay: index * 0.08 }}  // Appear in sequence
      style={{
        background: 'radial-gradient(ellipse, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)',
        border: '2px dashed #ff4444'  // Red dashed warning
      }}
    />

    {/* Pulsing warning ring */}
    <motion.div
      animate={{
        opacity: [0, 0.6, 0.4, 0.6, 0.4],  // Pulse pattern
        scale: [0.5, 1.2, 1, 1.3, 1.1]
      }}
      style={{
        border: '2px solid #ff4444',
        boxShadow: '0 0 15px #ff4444'
      }}
    />
  </>
))}
```

**Design Choices:**
- **1000ms total anticipation** for heavy AOE attack
- **Red glow above** creates ominous atmosphere
- **Shadow circles** show exact target zones (gameplay clarity)
- **Dashed border** = universal "warning" visual language
- **Pulsing rings** add urgency
- **Sequential delays** (80ms) let eye track each impact zone

#### Follow-Through (200ms Explicit Aftermath)

```typescript
{phase === 'aftermath' && (
  <>
    {/* Rising dust clouds */}
    {meteorImpacts.map(impact => (
      <motion.div
        animate={{
          opacity: [0, 0.6, 0.4, 0],
          scale: [0.5, 1.5, 2, 2.5],
          y: [-20, -40, -60, -80]  // Rises like real dust
        }}
        style={{
          background: 'radial-gradient(circle, rgba(100,100,100,0.6), transparent)'
        }}
      />
    ))}

    {/* Crater glow fades slowly */}
    <motion.div
      animate={{
        opacity: [0.7, 0.4, 0],  // Starts bright, fades
        scale: [1, 1.2, 1.3]
      }}
      style={{
        background: 'radial-gradient(ellipse, #ffaa00, #ff4444, transparent)',
        transform: 'rotateX(70deg)'  // Ground-level ellipse
      }}
    />

    {/* Lingering embers float upward */}
    <ParticleSystem
      particleCount={6}
      gravity={-30}  // Negative = float UP
      lifetime={200}
      colors={['#ffaa00', '#ff4444']}
    />
  </>
)}
```

**Design Choices:**
- **Explicit aftermath phase** for heavy attack weight
- **Dust rises naturally** (y motion upward)
- **Crater glow** suggests "heat remains"
- **Floating embers** add atmospheric detail
- **Gray dust** contrasts with fire colors (realism)

---

## Design Guidelines

### Color Palette Usage

Use the pre-defined element color palettes for consistency:

```typescript
// From types.ts
export const FIRE_COLORS = {
  primary: '#ff6b35',   // Fire orange - main color
  secondary: '#ff4444', // Red - hot core
  accent: '#ffaa00'     // Yellow-orange - brightest highlights
};

export const ICE_COLORS = {
  primary: '#4da6ff',   // Ice blue - main color
  secondary: '#b3e0ff', // Light blue - frost mist
  accent: '#e0f7ff'     // White-blue - brightest highlights
};

export const LIGHTNING_COLORS = {
  primary: '#ffeb3b',   // Yellow - main color
  secondary: '#fff176', // Light yellow - glow
  accent: '#ffffcc'     // White-yellow - brightest arc
};

export const HOLY_COLORS = {
  primary: '#ffd700',   // Gold - main color
  secondary: '#ffffcc', // Light gold - soft glow
  accent: '#ffee88'     // Bright gold - radiant center
};
```

#### When to Use Each Shade

- **Accent:** Core of explosions, brightest flashes, initial burst
- **Primary:** Main spell color, projectiles, most particles
- **Secondary:** Outer glows, mist, atmospheric effects

**Fireball Example:**
```typescript
{/* Accent for explosion core */}
background: `radial-gradient(circle, ${FIRE_COLORS.accent} 0%, ...)`

{/* Primary for fireball projectile */}
<Projectile color={FIRE_COLORS.primary} />

{/* Secondary for smoke/aftermath */}
background: `radial-gradient(circle, ${FIRE_COLORS.secondary}40, transparent)`
```

### Particle Density Standards

**Maximum Particle Counts:**
- Per effect: 30 particles
- Per phase: 20 particles
- Simultaneous on screen: 60 particles (multiple effects)

**Recommended Counts by Effect Type:**

| Effect Type | Particle Count | Reasoning |
|-------------|----------------|-----------|
| Charge | 12-18 | Enough to feel substantial, not cluttered |
| Cast burst | 8-12 | Quick burst, fewer needed |
| Travel trail | 10-15 | Continuous generation, keep lean |
| Impact primary | 20-28 | Peak visual density for satisfaction |
| Impact secondary | 10-15 | Supporting detail |
| Aftermath | 5-10 | Subtle lingering effects |

**Validation:**
```typescript
// Use validateParticleCount() from types.ts
{validateParticleCount(28, 'FireballAnimation', 'impact-primary')}
<ParticleSystem particleCount={28} />

// This logs warning in dev if count > 30:
// ⚠️ [Particle Validation] FireballAnimation (impact-primary): 28 particles (within limit)
```

### Motion Curves and Easing

Use appropriate easing for different motion types:

#### Explosive Motion (Fireball, Meteor)
```typescript
// Fast start, slow end (ease-out)
transition={{ ease: 'easeOut' }}
// OR
transition={{ ease: [0.4, 0, 0.2, 1] }}  // Cubic bezier
```

**Why:** Explosions accelerate instantly, then dissipate slowly

#### Gathering Motion (Charge phases)
```typescript
// Slow start, fast end (ease-in)
transition={{ ease: 'easeIn' }}
// OR
transition={{ ease: [0.4, 0, 1, 1] }}
```

**Why:** Energy gathers slowly at first, accelerates as it builds

#### Linear Motion (Lightning bolt, beams)
```typescript
// No easing - constant speed
transition={{ ease: 'linear' }}
```

**Why:** Electricity and light move at constant speed

#### Elastic Motion (Buff shields appearing)
```typescript
// Overshoot and settle (ease-out-back)
transition={{ ease: [0.34, 1.56, 0.64, 1] }}
```

**Why:** Magical barriers "snap" into place with slight bounce

**Framer Motion Spring Configs:**
```typescript
// From types.ts
export const SPRING_CONFIG = {
  gentle: { type: 'spring', stiffness: 100, damping: 15 },
  snappy: { type: 'spring', stiffness: 300, damping: 20 },
  bouncy: { type: 'spring', stiffness: 400, damping: 10 }
};

// Usage:
<motion.div
  animate={{ scale: 1.2 }}
  transition={SPRING_CONFIG.snappy}  // Quick, precise motion
/>
```

### Layering Effects for Depth

Create depth through **size, blur, and opacity** layering:

```typescript
// Layer 1: Sharp core (smallest, no blur, opaque)
<motion.div
  style={{
    width: 20,
    height: 20,
    opacity: 1,
    filter: 'blur(0px)',
    background: FIRE_COLORS.accent
  }}
/>

// Layer 2: Inner glow (medium, light blur, semi-transparent)
<motion.div
  style={{
    width: 40,
    height: 40,
    opacity: 0.8,
    filter: 'blur(6px)',
    background: FIRE_COLORS.primary
  }}
/>

// Layer 3: Outer glow (largest, heavy blur, very transparent)
<motion.div
  style={{
    width: 80,
    height: 80,
    opacity: 0.3,
    filter: 'blur(20px)',
    background: FIRE_COLORS.secondary
  }}
/>
```

**Rule of thumb:**
- Blur radius = width / 4
- Opacity decreases with size: 1.0 → 0.8 → 0.5 → 0.3

---

## Common Pitfalls to Avoid

### 1. Over-Animation (Too Many Particles, Too Long)

❌ **WRONG:**
```typescript
<ParticleSystem particleCount={50} />  // WAY too many
<motion.div duration={2000} />  // Attack lasts 2 full seconds!
```

✅ **RIGHT:**
```typescript
<ParticleSystem particleCount={25} />  // Within 30 max
<motion.div duration={150} />  // Fast, snappy impact
```

**Why This Matters:**
- 50 particles drops frame rate below 60fps
- 2-second animations slow combat to a crawl
- Players lose patience waiting for turns

**Guideline:**
- Total attack duration: 800-1500ms
- Particle count: 15-30 per effect
- If it feels too long in playtesting, it is

### 2. Visual Clutter (Hiding Gameplay)

❌ **WRONG:**
```typescript
// Opaque fullscreen overlay
<motion.div
  style={{
    position: 'fixed',
    width: '100%',
    height: '100%',
    background: 'rgba(255, 0, 0, 0.8)',  // 80% opaque!
    opacity: 1
  }}
/>
```

✅ **RIGHT:**
```typescript
// Subtle screen flash
<motion.div
  animate={{ opacity: [0, 0.15, 0] }}  // Only 15% at peak
  style={{
    position: 'fixed',
    background: FIRE_COLORS.primary
  }}
/>
```

**Why This Matters:**
- Players can't see HP bars during attack
- Character sprites disappear
- Feels disorienting, not exciting

**Guideline:**
- Screen flash max opacity: 0.2 (20%)
- Keep HP bar zones (top 200px) clear
- Character zones (±50px) should stay visible

### 3. Inconsistent Timing (Breaks Game Flow)

❌ **WRONG:**
```typescript
// Ice Shard takes 2 seconds, Fireball takes 600ms
<IceShardAnimation duration={2000} />
<FireballAnimation duration={600} />
```

✅ **RIGHT:**
```typescript
// Both around 900ms (similar attack weight)
<IceShardAnimation duration={900} />
<FireballAnimation duration={950} />
```

**Why This Matters:**
- Players expect similar attacks to take similar time
- Wildly different durations feel janky
- Combat flow becomes unpredictable

**Guideline:**
- Light attacks: 600-900ms
- Medium attacks: 900-1200ms
- Heavy attacks: 1200-1500ms
- Difference within category: <200ms

### 4. Performance-Heavy Effects (Dropping FPS)

❌ **WRONG:**
```typescript
// Using layout-triggering properties
<motion.div
  animate={{
    width: [100, 200],     // ❌ Triggers layout
    height: [100, 200],    // ❌ Triggers layout
    borderRadius: [0, 50]  // ❌ Triggers paint
  }}
/>

// Too many simultaneous particles
<ParticleSystem particleCount={100} />  // ❌ Way too many
```

✅ **RIGHT:**
```typescript
// GPU-accelerated properties only
<motion.div
  animate={{
    scale: [1, 2],      // ✅ Uses transform
    opacity: [0, 1]     // ✅ GPU accelerated
  }}
/>

// Reasonable particle count
<ParticleSystem particleCount={25} />  // ✅ Within limits
```

**Why This Matters:**
- Layout/paint properties drop to 30fps or lower
- Players see stuttering, choppy animations
- Mobile browsers struggle even more

**Guideline:**
- ONLY use `transform` and `opacity`
- Never animate `width`, `height`, `left`, `top`, `background-color`, etc.
- Use `translateX/Y`, `scale`, `rotate` instead
- Particle limit: 30 per effect

### 5. Abrupt Cutoffs (Feels Unfinished)

❌ **WRONG:**
```typescript
<motion.div
  animate={{
    opacity: [0, 1, 0],  // ❌ Cuts from 100% to 0% instantly
    scale: [1, 2]        // ❌ Stops abruptly at 2
  }}
  duration={150}
  onAnimationComplete={onComplete}  // ❌ Called at peak, not after fade
/>
```

✅ **RIGHT:**
```typescript
<motion.div
  animate={{
    opacity: [0, 1, 0.7, 0.4, 0],  // ✅ Gradual 4-step fade
    scale: [1, 2, 2.2, 2.3]        // ✅ Continues slightly
  }}
  duration={150}
  onAnimationComplete={onComplete}  // ✅ Called after fade completes
/>
```

**Why This Matters:**
- Abrupt cutoffs look cheap and unpolished
- Eye hasn't finished processing the effect
- Breaks immersion

**Guideline:**
- Use 3-5 step opacity fades: [0, 1, 0.7, 0.4, 0]
- Scale should ease out, not stop: [1, 2, 2.2] not [1, 2]
- Let particles fall/dissipate, don't vanish instantly

---

## Summary Checklist

When designing a new animation, verify:

**Anticipation:**
- [ ] Charge phase 200-600ms depending on weight
- [ ] Color immediately telegraphs element
- [ ] Particles converge/swirl to build tension
- [ ] Glow intensity builds gradually

**Impact:**
- [ ] Shortest phase (100-300ms)
- [ ] 3-5 layered simultaneous effects
- [ ] Particle count spikes (20-30)
- [ ] Motion is explosive (wide spread, fast easing)
- [ ] Screen flash only for major spells (0.1-0.2 opacity)

**Follow-Through:**
- [ ] Gravity/physics for natural motion
- [ ] Staggered effect lifetimes
- [ ] Gradual opacity fades (3-5 steps)
- [ ] Duration matches attack weight

**Readability:**
- [ ] HP bars never obscured (keep top 200px clear)
- [ ] Character sprites visible (±50px zones clear)
- [ ] Transparency used for layered effects (0.3-0.8)
- [ ] Visual hierarchy: core → supporting → atmospheric
- [ ] Effects staggered (30-100ms delays)

**Performance:**
- [ ] Only `transform` and `opacity` properties
- [ ] Particle count ≤30 per effect
- [ ] Total duration 600-1500ms
- [ ] React.memo on all components
- [ ] Tested at 60fps

**Polish:**
- [ ] Easing matches motion type (ease-out for explosions)
- [ ] Colors from predefined palettes
- [ ] No abrupt cutoffs (gradual fades)
- [ ] Timing consistent with similar attacks
- [ ] Looks professional and polished

---

**Following these principles creates animations that feel POWERFUL, look CLEAR, and perform SMOOTHLY. Every spell should make players think "That was SATISFYING!"**
