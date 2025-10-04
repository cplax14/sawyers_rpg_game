# Animation Component API Reference

Complete API documentation for all animation components in Sawyer's RPG combat system.

## Table of Contents

1. [Overview](#overview)
2. [Reading This Documentation](#reading-this-documentation)
3. [Common Patterns](#common-patterns)
4. [Core Animation Components](#core-animation-components)
   - [ParticleSystem](#particlesystem)
   - [MeleeSlash](#meleeslash)
   - [AreaEffect](#areaeffect)
   - [StatusOverlay](#statusoverlay)
   - [BuffAura](#buffaura)
5. [Animation Building Blocks](#animation-building-blocks)
   - [Projectile](#projectile)
   - [ImpactEffects](#impacteffects)
   - [ChargeParticles](#chargeparticles)
6. [Animation System Components](#animation-system-components)
   - [AnimationController](#animationcontroller)
7. [Shared Interfaces and Types](#shared-interfaces-and-types)
8. [Usage Patterns](#usage-patterns)
9. [Props Reference Tables](#props-reference-tables)
10. [Code Examples Gallery](#code-examples-gallery)

---

## Overview

This document provides complete API reference for all animation components in the combat system. Each component is documented with:

- TypeScript interface definitions
- Complete prop descriptions with types and defaults
- Usage examples from basic to advanced
- Performance considerations
- Integration patterns

All animation components are built using **Framer Motion** for fluid, GPU-accelerated animations and follow strict performance guidelines to maintain 60fps during combat.

---

## Reading This Documentation

### Conventions

- **Required props** are marked with `(required)`
- **Optional props** show their default values like `size?: number = 12`
- **TypeScript types** are shown inline with prop descriptions
- **Code examples** use realistic combat scenarios
- **Performance notes** highlight optimization considerations

### Import Paths

All core components are exported from:
```typescript
import { ParticleSystem, MeleeSlash, AreaEffect } from '@/components/combat/animations/core';
import { Projectile, ImpactEffects, ChargeParticles } from '@/components/combat/animations';
import { AnimationController } from '@/components/combat/animations/AnimationController';
```

---

## Common Patterns

### Animation Component Structure

All animation components follow these conventions:

1. **Functional components** with TypeScript props interface
2. **Memoized** with `React.memo()` for performance
3. **GPU-accelerated properties only** (`transform`, `opacity`)
4. **Callback support** via `onComplete` prop
5. **Absolute positioning** with `position: 'absolute'`
6. **Non-interactive** with `pointerEvents: 'none'`

### Standard Props Pattern

Most animation components accept:
```typescript
interface StandardAnimationProps {
  // Position
  x?: number;
  y?: number;

  // Visual
  color: string;
  size?: number;

  // Timing
  duration?: number;

  // Lifecycle
  onComplete?: () => void;
}
```

### TypeScript Interface Conventions

- All props interfaces are defined inline at the top of each component file
- Shared types are in `src/components/combat/animations/types.ts`
- Animation metadata uses the `AnimationMetadata` interface from `animationRegistry.ts`

---

## Core Animation Components

### ParticleSystem

**Purpose**: Enhanced particle emission system with physics-based motion. Used for spell effects, impacts, explosions, and ambient magical effects.

**File**: `src/components/combat/animations/core/ParticleSystem.tsx`

#### TypeScript Interface

```typescript
interface ParticleSystemProps {
  originX: number;        // (required) X coordinate for particle emission
  originY: number;        // (required) Y coordinate for particle emission
  particleCount: number;  // (required) Number of particles to generate
  colors: string[];       // (required) Array of colors for particles
  spread: number;         // (required) Velocity spread magnitude (pixels)
  lifetime: number;       // (required) Particle lifetime in milliseconds
  size?: number;          // Particle size in pixels (default: 6)
  gravity?: number;       // Gravity effect in pixels/second (default: 0)
  fadeOut?: boolean;      // Enable fade-out animation (default: true)
  onComplete?: () => void; // Callback when last particle completes
}
```

#### Prop Descriptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `originX` | `number` | required | X coordinate where particles emit from |
| `originY` | `number` | required | Y coordinate where particles emit from |
| `particleCount` | `number` | required | Number of particles to generate. **Limit: 30 max** |
| `colors` | `string[]` | required | Array of colors. Particles randomly pick from this palette |
| `spread` | `number` | required | Velocity magnitude. Higher = wider spread. Can be negative for converging particles |
| `lifetime` | `number` | required | How long particles animate in milliseconds |
| `size` | `number` | `6` | Base particle size. Actual size varies 80-120% for variety |
| `gravity` | `number` | `0` | Gravity acceleration. Positive = fall, negative = float up |
| `fadeOut` | `boolean` | `true` | Whether particles fade out. Disable for gathering effects |
| `onComplete` | `() => void` | `undefined` | Called when the last particle finishes animating |

#### Particle Behavior

- **Direction**: Random 360° emission around origin
- **Velocity**: Randomized 50-100% of spread value for natural variation
- **Size**: Random 80-120% of base size
- **Lifetime**: Random 80-120% of base lifetime
- **Stagger**: Particles emit with slight delays (0.1s per particle count)

#### Usage Examples

**Basic Explosion**
```typescript
<ParticleSystem
  originX={targetX}
  originY={targetY}
  particleCount={25}
  colors={['#ff6b35', '#ff4444', '#ffaa00']}
  spread={150}
  lifetime={800}
  size={8}
  gravity={50}
  fadeOut={true}
  onComplete={() => console.log('Explosion complete')}
/>
```

**Healing Sparkles (Float Upward)**
```typescript
<ParticleSystem
  originX={playerX}
  originY={playerY}
  particleCount={15}
  colors={['#4ade80', '#86efac', '#ffffff']}
  spread={80}
  lifetime={1200}
  size={4}
  gravity={-20}  // Negative = float up
  fadeOut={true}
/>
```

**Gathering Energy (Converge Inward)**
```typescript
<ParticleSystem
  originX={casterX}
  originY={casterY}
  particleCount={12}
  colors={['#8b5cf6', '#a78bfa']}
  spread={-80}  // Negative = particles move inward
  lifetime={600}
  size={5}
  gravity={0}
  fadeOut={false}  // Don't fade so they stay visible at center
/>
```

#### Preset Configurations

The component exports `PARTICLE_PRESETS` with common configurations:

```typescript
import { PARTICLE_PRESETS } from '@/components/combat/animations/core/ParticleSystem';

// Use a preset
<ParticleSystem
  originX={x}
  originY={y}
  colors={['#ff0000']}
  {...PARTICLE_PRESETS.explosion}
/>
```

Available presets:
- `explosion` - Fast, wide spread with gravity
- `sparkle` - Slow, gentle float upward
- `debris` - Fast falling particles
- `gather` - Converging inward motion
- `ambient` - Minimal movement, long duration
- `embers` - Fire particles drifting up
- `crystals` - Sharp, fast ice particles
- `lightning` - Erratic, fast electric sparks
- `healing` - Gentle ascending light
- `poison` - Slow floating bubbles

#### Performance Considerations

- **Particle count limit**: Max 30 particles per effect (hard limit), 20 recommended
- **Validation**: Development mode validates particle counts with warnings/errors
- **GPU-accelerated**: Uses only `transform` and `opacity` for 60fps
- **Cleanup**: Automatically cleaned up when animation completes

---

### MeleeSlash

**Purpose**: Weapon trail effect component for melee attacks. Displays visual trails with different patterns based on slash type.

**File**: `src/components/combat/animations/core/MeleeSlash.tsx`

#### TypeScript Interface

```typescript
interface MeleeSlashProps {
  slashType: 'slash' | 'stab' | 'chop';  // (required) Type of melee attack
  startX: number;                         // (required) Starting X position
  startY: number;                         // (required) Starting Y position
  endX: number;                           // (required) Ending X position
  endY: number;                           // (required) Ending Y position
  color: string;                          // (required) Trail color
  duration: number;                       // (required) Animation duration in ms
  trailWidth?: number;                    // Trail width in pixels (default: 4)
  onComplete?: () => void;                // Completion callback
}
```

#### Prop Descriptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `slashType` | `'slash' \| 'stab' \| 'chop'` | required | Type of attack animation |
| `startX` | `number` | required | X coordinate where slash begins |
| `startY` | `number` | required | Y coordinate where slash begins |
| `endX` | `number` | required | X coordinate where slash ends |
| `endY` | `number` | required | Y coordinate where slash ends |
| `color` | `string` | required | Color of the weapon trail (typically weapon element color) |
| `duration` | `number` | required | Total animation duration in milliseconds |
| `trailWidth` | `number` | `4` | Width of the trail effect |
| `onComplete` | `() => void` | `undefined` | Called when slash animation completes |

#### Slash Type Behaviors

**`slash` - Diagonal Arc Slash**
- Rotates from -45° to +45° relative to attack angle
- Scales: 0 → 1.2 → 1 → 0.8 for weight
- Best for: Swords, katanas, scythes
- Timing: [0, 0.2, 0.7, 1] keyframes

**`stab` - Forward Thrust**
- Linear motion from start to end point
- Horizontal stretch: 0 → 1.5 → 1 → 0
- Best for: Daggers, spears, rapiers
- Timing: [0, 0.3, 0.7, 1] keyframes

**`chop` - Overhead Downward Strike**
- Vertical motion with 90° rotation
- Vertical stretch: 0 → 1.3 → 1 → 0
- Best for: Axes, hammers, clubs
- Timing: [0, 0.25, 0.6, 1] keyframes with custom easing

#### Usage Examples

**Diagonal Sword Slash**
```typescript
<MeleeSlash
  slashType="slash"
  startX={attackerX + 30}
  startY={attackerY - 20}
  endX={targetX - 30}
  endY={targetY + 20}
  color="#60a5fa"  // Blue steel
  duration={400}
  trailWidth={6}
  onComplete={() => triggerImpact()}
/>
```

**Dagger Stab**
```typescript
<MeleeSlash
  slashType="stab"
  startX={rogueX}
  startY={rogueY}
  endX={enemyX}
  endY={enemyY}
  color="#ef4444"  // Crimson
  duration={300}  // Fast stab
  trailWidth={3}
/>
```

**Overhead Axe Chop**
```typescript
<MeleeSlash
  slashType="chop"
  startX={warriorX}
  startY={warriorY - 50}  // Start above
  endX={targetX}
  endY={targetY}
  color="#f59e0b"  // Amber
  duration={600}  // Heavy, slower
  trailWidth={8}
/>
```

#### Visual Features

- **Gradient trail**: Fades at edges for smooth appearance
- **Glow effect**: Additional glow layer with higher opacity at midpoint
- **Motion blur**: 1px blur filter for natural motion
- **Auto-rotation**: Calculates angle from start/end positions

#### Performance Considerations

- **Lightweight**: Single animated div with glow overlay
- **GPU properties**: Only `transform`, `opacity`, and `scale` used
- **No particles**: Pure trail effect, combine with ParticleSystem if needed

---

### AreaEffect

**Purpose**: AOE (Area of Effect) spreading circle component. Used for AOE spells like Meteor, Earthquake, or area buffs.

**File**: `src/components/combat/animations/core/AreaEffect.tsx`

#### TypeScript Interface

```typescript
interface AreaEffectProps {
  centerX: number;        // (required) Center X coordinate
  centerY: number;        // (required) Center Y coordinate
  radius: number;         // (required) Maximum radius in pixels
  color: string;          // (required) Effect color
  expandDuration: number; // (required) Expansion time in ms
  fadeDuration: number;   // (required) Fade-out time in ms
  particleCount?: number; // Number of radiating particles (default: 20)
  onComplete?: () => void; // Completion callback
}
```

#### Prop Descriptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `centerX` | `number` | required | X coordinate of AOE center |
| `centerY` | `number` | required | Y coordinate of AOE center |
| `radius` | `number` | required | Maximum radius of the expanding circle in pixels |
| `color` | `string` | required | Primary color for circle, particles, and effects |
| `expandDuration` | `number` | required | How long expansion phase lasts (milliseconds) |
| `fadeDuration` | `number` | required | How long fade-out phase lasts (milliseconds) |
| `particleCount` | `number` | `20` | Number of particles radiating from center |
| `onComplete` | `() => void` | `undefined` | Called when all effects complete |

#### Animation Phases

1. **Expansion** (expandDuration):
   - Circle scales from 0 to full radius
   - Opacity: 0 → 0.8
   - Particles radiate outward

2. **Fade** (fadeDuration):
   - Circle maintains size
   - Opacity: 0.8 → 0
   - Particles dissipate

Total duration = `expandDuration + fadeDuration`

#### Visual Layers

The component renders multiple layers:
- **Main circle**: Expanding ring with border and glow
- **Inner glow**: Radial gradient fill
- **Ground indicator**: Dashed ring with perspective
- **Radiating particles**: Evenly distributed around perimeter
- **Shockwave ring**: Fast-expanding impact ring

#### Usage Examples

**Meteor Impact**
```typescript
<AreaEffect
  centerX={impactX}
  centerY={impactY}
  radius={150}
  color="#ff6b35"  // Fire orange
  expandDuration={400}
  fadeDuration={300}
  particleCount={30}
  onComplete={() => applyDamage()}
/>
```

**Earthquake Shockwave**
```typescript
<AreaEffect
  centerX={epicenterX}
  centerY={epicenterY}
  radius={200}
  color="#92400e"  // Earth brown
  expandDuration={600}
  fadeDuration={400}
  particleCount={25}
/>
```

**Healing Circle (Small, Gentle)**
```typescript
<AreaEffect
  centerX={allyX}
  centerY={allyY}
  radius={80}
  color="#4ade80"  // Healing green
  expandDuration={500}
  fadeDuration={300}
  particleCount={12}  // Fewer particles for subtlety
/>
```

#### Performance Considerations

- **Particle count**: Recommended max 30 for smooth performance
- **Radius scaling**: Large radii (>200px) may need longer durations
- **Staggered particles**: Delays spread load over time
- **3D transform**: Ground indicator uses `rotateX` for perspective

---

### StatusOverlay

**Purpose**: Persistent status effect overlay component. Displays visual indicators for status ailments on characters without obscuring gameplay.

**File**: `src/components/combat/animations/core/StatusOverlay.tsx`

#### TypeScript Interface

```typescript
interface StatusOverlayProps {
  statusType: 'poison' | 'sleep' | 'silence' | 'slow' | 'stun' | 'burn' | 'freeze';
  targetX: number;       // (required) X position of afflicted character
  targetY: number;       // (required) Y position of afflicted character
  color: string;         // (required) Status effect color
  intensity?: number;    // Effect intensity/opacity (default: 0.6)
  isActive: boolean;     // (required) Controls visibility
  onComplete?: () => void; // Called when status ends
}
```

#### Prop Descriptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `statusType` | `'poison' \| 'sleep' \| 'silence' \| 'slow' \| 'stun' \| 'burn' \| 'freeze'` | required | Type of status ailment |
| `targetX` | `number` | required | X coordinate of afflicted character |
| `targetY` | `number` | required | Y coordinate of afflicted character |
| `color` | `string` | required | Color representing the status effect |
| `intensity` | `number` | `0.6` | Opacity/intensity of overlay effects (0-1) |
| `isActive` | `boolean` | required | Whether overlay is visible. Toggle to remove |
| `onComplete` | `() => void` | `undefined` | Called when overlay exits |

#### Status Type Configurations

Each status type has unique visual behavior:

| Status | Icon | Particles | Pulse Speed | Special Overlay |
|--------|------|-----------|-------------|-----------------|
| `poison` | ☠️ | Bubbles | 2s | Rising bubbles |
| `sleep` | 💤 | Z's | 3s | Floating Z's |
| `silence` | 🔇 | No | 1.5s | Rotating seal |
| `slow` | 🐌 | Drips | 4s | Dripping effect |
| `stun` | ⭐ | Stars | 0.8s | Circling stars |
| `burn` | 🔥 | Flames | 1.2s | Fire particles |
| `freeze` | ❄️ | Crystals | 0.5s | Ice shards |

#### Visual Layers

- **Pulsing glow**: Radial gradient that pulses at status-specific speed
- **Status icon**: Emoji indicator floating above character
- **Floating particles**: Element-specific particles (if enabled)
- **Special overlay**: Unique pattern per status type

#### Usage Examples

**Poison Status**
```typescript
const [isPoisoned, setIsPoisoned] = useState(true);

<StatusOverlay
  statusType="poison"
  targetX={enemyX}
  targetY={enemyY}
  color="#22c55e"  // Poison green
  intensity={0.7}
  isActive={isPoisoned}
  onComplete={() => console.log('Poison cleared')}
/>
```

**Stun Effect**
```typescript
<StatusOverlay
  statusType="stun"
  targetX={playerX}
  targetY={playerY}
  color="#eab308"  // Yellow
  intensity={0.8}
  isActive={isStunned}
/>
```

**Freeze with Low Intensity**
```typescript
<StatusOverlay
  statusType="freeze"
  targetX={targetX}
  targetY={targetY}
  color="#3b82f6"  // Ice blue
  intensity={0.5}  // Subtle effect
  isActive={isFrozen}
/>
```

#### Persistent Animation

- Uses `AnimatePresence` for smooth entry/exit
- Infinite looping while `isActive={true}`
- Set `isActive={false}` to trigger exit animation
- Particles loop infinitely until overlay removed

#### Performance Considerations

- **Max 5 particles** per status overlay
- **Infinite animations**: Use CSS animations where possible
- **Positioned above character**: z-index 101 to show over other effects
- **Non-blocking**: Doesn't interfere with gameplay

---

### BuffAura

**Purpose**: Character aura effect component for buffs and enhancements. Displays persistent or temporary aura effects subtle enough not to obscure gameplay.

**File**: `src/components/combat/animations/core/BuffAura.tsx`

#### TypeScript Interface

```typescript
interface BuffAuraProps {
  targetX: number;       // (required) X position of buffed character
  targetY: number;       // (required) Y position of buffed character
  auraColor: string;     // (required) Aura color
  pulseSpeed: number;    // (required) Pulse animation speed in seconds
  particles: boolean;    // (required) Enable orbital particles
  intensity?: number;    // Effect intensity/opacity (default: 0.5)
  persistent?: boolean;  // Aura persists or fades out (default: true)
  isActive: boolean;     // (required) Controls visibility
  onComplete?: () => void; // Called when aura ends
}
```

#### Prop Descriptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `targetX` | `number` | required | X coordinate of buffed character |
| `targetY` | `number` | required | Y coordinate of buffed character |
| `auraColor` | `string` | required | Primary color of the aura effect |
| `pulseSpeed` | `number` | required | Pulse animation speed in seconds (e.g., 2 = 2s per pulse) |
| `particles` | `boolean` | required | Whether to show orbital particles |
| `intensity` | `number` | `0.5` | Opacity/intensity of aura (0-1) |
| `persistent` | `boolean` | `true` | If true, loops infinitely. If false, fades out |
| `isActive` | `boolean` | required | Controls aura visibility |
| `onComplete` | `() => void` | `undefined` | Called when aura exits |

#### Visual Layers

1. **Main pulsing glow**: Elliptical radial gradient
2. **Inner core glow**: Smaller, brighter center
3. **Shimmer ring**: Rotating ring for magical effect
4. **Orbital particles**: Circular orbit around character (if enabled)
5. **Vertical light rays**: Subtle upward rays
6. **Ground glow**: Perspective glow at character's feet
7. **Sparkle effects**: Random sparkles (if particles enabled)

#### Usage Examples

**Protect Buff (Persistent)**
```typescript
<BuffAura
  targetX={allyX}
  targetY={allyY}
  auraColor="#3b82f6"  // Blue protection
  pulseSpeed={2}
  particles={true}
  intensity={0.6}
  persistent={true}
  isActive={hasProtect}
/>
```

**Haste Buff (Fast Pulse)**
```typescript
<BuffAura
  targetX={playerX}
  targetY={playerY}
  auraColor="#eab308"  // Yellow speed
  pulseSpeed={0.8}  // Fast pulse for speed
  particles={true}
  intensity={0.7}
  persistent={true}
  isActive={hasHaste}
/>
```

**Temporary Buff (Fades Out)**
```typescript
<BuffAura
  targetX={heroX}
  targetY={heroY}
  auraColor="#8b5cf6"  // Purple magic
  pulseSpeed={1.5}
  particles={false}
  intensity={0.5}
  persistent={false}  // Will fade out
  isActive={buffActive}
  onComplete={() => setBuffActive(false)}
/>
```

#### Particle Orbits

When `particles={true}`:
- **8 particles** orbit around character
- Circular path with 50px radius
- Staggered delays for cascading effect
- Fades in/out during orbit cycle

#### Performance Considerations

- **Subtle by design**: Lower opacity prevents visual clutter
- **8 orbital particles max**: Optimized for performance
- **Positioned behind effects**: z-index 98 (below damage numbers)
- **Infinite loops**: Uses efficient CSS-based animations

---

## Animation Building Blocks

### Projectile

**Purpose**: Reusable animated projectile for spell attacks. Core component for traveling spell effects.

**File**: `src/components/combat/animations/Projectile.tsx`

#### TypeScript Interface

```typescript
interface ProjectileProps {
  startX: number;         // (required) Starting X position
  startY: number;         // (required) Starting Y position
  endX: number;           // (required) Ending X position
  endY: number;           // (required) Ending Y position
  color: string;          // (required) Projectile color
  size?: number;          // Projectile diameter in pixels (default: 12)
  duration?: number;      // Travel duration in ms (default: 600)
  glowIntensity?: number; // Glow multiplier (default: 1.0)
  onComplete?: () => void; // Completion callback
}
```

#### Prop Descriptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `startX` | `number` | required | X coordinate where projectile spawns |
| `startY` | `number` | required | Y coordinate where projectile spawns |
| `endX` | `number` | required | X coordinate of target destination |
| `endY` | `number` | required | Y coordinate of target destination |
| `color` | `string` | required | Main color of projectile |
| `size` | `number` | `12` | Diameter of projectile sphere |
| `duration` | `number` | `600` | Travel time in milliseconds |
| `glowIntensity` | `number` | `1.0` | Multiplier for glow size (e.g., 1.5 = 50% larger glow) |
| `onComplete` | `() => void` | `undefined` | Called when projectile reaches destination |

#### Visual Components

The Projectile renders three layers:

1. **Main projectile**: Solid sphere with glow
2. **Trailing particles**: 5 delayed spheres following main projectile
3. **Energy trail**: Connecting line from start to end

#### Usage Examples

**Basic Magic Bolt**
```typescript
<Projectile
  startX={casterX}
  startY={casterY}
  endX={targetX}
  endY={targetY}
  color="#8b5cf6"  // Arcane purple
  size={12}
  duration={600}
  glowIntensity={1.0}
  onComplete={() => triggerImpact()}
/>
```

**Fireball (Large, Bright)**
```typescript
<Projectile
  startX={wizardX}
  startY={wizardY}
  endX={enemyX}
  endY={enemyY}
  color="#ff6b35"  // Fire orange
  size={24}
  duration={300}  // Fast
  glowIntensity={1.5}  // Extra glow
/>
```

**Ice Shard (Fast, Small)**
```typescript
<Projectile
  startX={mageX}
  startY={mageY}
  endX={targetX}
  endY={targetY}
  color="#4da6ff"  // Ice blue
  size={16}
  duration={250}  // Very fast
  glowIntensity={0.8}  // Subtle glow
/>
```

#### Animation Behavior

- **Easing**: `easeInOut` for natural motion
- **Opacity curve**: [0, 1, 1, 0] with keyframes [0, 0.1, 0.9, 1]
- **Trailing particles**: 5 particles with 0.05s stagger
- **Energy trail**: Linear motion with blur filter

#### Performance Considerations

- **Fixed particle count**: Always 5 trail particles (optimized)
- **GPU-accelerated**: Only transform and opacity
- **Single path calculation**: Computed once at render

---

### ImpactEffects

**Purpose**: Displays impact flash, particles, and damage numbers on hit. Complete impact visualization for attacks.

**File**: `src/components/combat/animations/ImpactEffects.tsx`

#### TypeScript Interface

```typescript
interface ImpactEffectsProps {
  config: ImpactConfig;  // (required) Impact configuration
  isActive: boolean;     // (required) Controls visibility
  onComplete?: () => void; // Completion callback
}

interface ImpactConfig {
  x: number;           // (required) Impact X position
  y: number;           // (required) Impact Y position
  damage: number;      // (required) Damage value to display
  isCritical?: boolean; // Is this a critical hit (default: false)
  element?: 'fire' | 'ice' | 'lightning' | 'arcane'; // Element type
}
```

#### Prop Descriptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `config` | `ImpactConfig` | required | Complete impact configuration object |
| `config.x` | `number` | required | X coordinate of impact |
| `config.y` | `number` | required | Y coordinate of impact |
| `config.damage` | `number` | required | Damage number to display |
| `config.isCritical` | `boolean` | `false` | Whether this is a critical hit |
| `config.element` | `string` | `'arcane'` | Element type for color scheme |
| `isActive` | `boolean` | required | Whether impact is visible |
| `onComplete` | `() => void` | `undefined` | Called when impact completes |

#### Element Color Schemes

```typescript
const elementColors = {
  arcane: { primary: '#8b5cf6', secondary: '#a78bfa' },
  fire: { primary: '#f59e0b', secondary: '#fbbf24' },
  ice: { primary: '#3b82f6', secondary: '#60a5fa' },
  lightning: { primary: '#eab308', secondary: '#facc15' }
};
```

#### Visual Layers

**Normal Hit**:
- Impact flash (300ms)
- Secondary ring (400ms)
- 12 explosion particles
- Damage number floating up

**Critical Hit** (additional):
- Larger damage number (2.5rem vs 2rem)
- "CRITICAL!" text above damage
- 8 star sparkles radiating outward
- Red color scheme override

#### Usage Examples

**Normal Hit**
```typescript
<ImpactEffects
  config={{
    x: targetX,
    y: targetY,
    damage: 45,
    isCritical: false,
    element: 'arcane'
  }}
  isActive={showImpact}
  onComplete={() => setShowImpact(false)}
/>
```

**Critical Fire Hit**
```typescript
<ImpactEffects
  config={{
    x: enemyX,
    y: enemyY,
    damage: 127,
    isCritical: true,
    element: 'fire'
  }}
  isActive={true}
  onComplete={() => nextTurn()}
/>
```

**Ice Impact**
```typescript
<ImpactEffects
  config={{
    x: position.x,
    y: position.y,
    damage: damageRoll,
    isCritical: isCrit,
    element: 'ice'
  }}
  isActive={impactActive}
/>
```

#### Damage Number Animation

- **Normal**: Floats up 80px over 1.2s, fades at end
- **Critical**: Scales 0 → 1.3 → 1 for pop effect
- **Font**: Uses `var(--font-heading)` for consistency
- **Shadow**: Black drop shadow for readability

#### Performance Considerations

- **12 particles**: Fixed count for consistent performance
- **Single render cycle**: All effects in one component
- **Short duration**: 300-400ms total
- **Critical sparkles**: Only 8 particles when needed

---

### ChargeParticles

**Purpose**: Displays magical particles during spell charge-up phase. Core component for spell anticipation.

**File**: `src/components/combat/animations/ChargeParticles.tsx`

#### TypeScript Interface

```typescript
interface ChargeParticlesProps {
  x: number;                     // (required) Center X position
  y: number;                     // (required) Center Y position
  config?: Partial<ParticleConfig>; // Optional configuration override
  isActive: boolean;             // (required) Controls visibility
}

interface ParticleConfig {
  count: number;   // Number of particles
  color: string;   // Particle color
  size: number;    // Particle size in pixels
  spread: number;  // Distance from center
}
```

#### Prop Descriptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `x` | `number` | required | X coordinate of charge center (usually caster) |
| `y` | `number` | required | Y coordinate of charge center |
| `config` | `Partial<ParticleConfig>` | see below | Partial override of default config |
| `config.count` | `number` | `8` | Number of charging particles |
| `config.color` | `string` | `'#8b5cf6'` | Particle color |
| `config.size` | `number` | `4` | Particle size in pixels |
| `config.spread` | `number` | `40` | Distance particles orbit from center |
| `isActive` | `boolean` | required | Whether particles are visible |

#### Default Configuration

```typescript
const DEFAULT_CONFIG = {
  count: 8,
  color: '#8b5cf6',  // Arcane purple
  size: 4,
  spread: 40
};
```

#### Animation Behavior

- **Orbit pattern**: Particles evenly distributed in circle
- **Pulsing**: Particles pulse from outer orbit → center → outer
- **Infinite loop**: Repeats while `isActive={true}`
- **Stagger**: 0.1s delay per particle for cascade effect
- **Central glow**: Pulsing glow at charge center

#### Usage Examples

**Basic Arcane Charge**
```typescript
<ChargeParticles
  x={casterX}
  y={casterY}
  isActive={isCharging}
/>
```

**Fire Charge (Custom Color)**
```typescript
<ChargeParticles
  x={wizardX}
  y={wizardY}
  config={{
    color: '#ff6b35',  // Fire orange
    count: 12,
    spread: 50
  }}
  isActive={chargingFireball}
/>
```

**Ice Charge (Larger, Slower)**
```typescript
<ChargeParticles
  x={mageX}
  y={mageY}
  config={{
    color: '#4da6ff',  // Ice blue
    size: 6,
    count: 10,
    spread: 60
  }}
  isActive={chargingIce}
/>
```

#### Usage in Spell Animations

Typical charge phase pattern:
```typescript
const [phase, setPhase] = useState<'charge' | 'cast' | 'travel' | 'impact'>('charge');

{phase === 'charge' && (
  <ChargeParticles
    x={casterX}
    y={casterY}
    config={{ color: spellColor }}
    isActive={true}
  />
)}
```

#### Performance Considerations

- **8 particles default**: Balanced visual impact and performance
- **Infinite animation**: Efficient with transform-only animations
- **Cleanup**: Automatically stops when `isActive={false}`

---

## Animation System Components

### AnimationController

**Purpose**: Smart component selector and lifecycle manager for combat animations. Handles animation selection, sequencing, queueing, and error handling.

**File**: `src/components/combat/animations/AnimationController.tsx`

#### TypeScript Interface

```typescript
interface AnimationControllerProps {
  attackType: string;      // (required) Spell/attack ID to look up
  attackData: {            // (required) Position and context data
    casterX: number;
    casterY: number;
    targetX: number;
    targetY: number;
    damage?: number;
    isCritical?: boolean;
    element?: string;
  };
  onComplete: () => void;  // (required) Callback when animation completes
  isActive: boolean;       // (required) Whether animation should play
}
```

#### Prop Descriptions

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `attackType` | `string` | required | Spell/attack ID from registry (e.g., 'fire', 'ice', 'magic_bolt') |
| `attackData` | `object` | required | Complete animation context data |
| `attackData.casterX` | `number` | required | X position of attacker |
| `attackData.casterY` | `number` | required | Y position of attacker |
| `attackData.targetX` | `number` | required | X position of target |
| `attackData.targetY` | `number` | required | Y position of target |
| `attackData.damage` | `number` | optional | Damage dealt (for impact effects) |
| `attackData.isCritical` | `boolean` | optional | Whether hit was critical |
| `attackData.element` | `string` | optional | Element type override |
| `onComplete` | `() => void` | required | Called when animation finishes |
| `isActive` | `boolean` | required | Triggers animation when true |

#### Animation Registry Integration

AnimationController looks up animations in the registry:

```typescript
import { getAnimationMetadata } from './animationRegistry';

// In AnimationController
const metadata = getAnimationMetadata(attackType);
// Returns: { element, type, component, description }
```

#### Lifecycle Management

1. **Trigger**: `isActive` changes to `true`
2. **Validation**: Position data validated for NaN/bounds
3. **Selection**: Attack type looked up in registry
4. **Fallback**: Uses Magic Bolt if type not found
5. **Queue check**: If animation playing, new one queued
6. **Render**: Selected component rendered with props
7. **Complete**: `onComplete` called after animation
8. **Cleanup**: Resources freed, queue processed

#### Animation Queueing

**Queue Behavior**:
- Max queue size: 5 animations
- FIFO (First In, First Out) processing
- Duplicate detection prevents same animation queuing twice
- Overflow animations dropped with warning

**Queue States**:
- `idle` - No animation playing
- `playing` - Animation in progress
- `complete` - Animation finished, transitioning

#### Error Handling

**Development Mode**:
```
🚨 [AnimationController] Animation error for "fire":
Component stack: <FireballAnimation>...
Error details: { message: "Cannot read property 'x'", stack: "..." }
```

**Production Mode**:
```
⚠️ Animation failed for "fire", continuing combat
```

**Error Boundary**:
- Wraps all animation components
- Catches errors during render
- Skips to result on failure
- Processes queue even after error

#### Usage Examples

**Basic Usage in Combat**
```typescript
const [animating, setAnimating] = useState(false);

<AnimationController
  attackType="fire"
  attackData={{
    casterX: player.x,
    casterY: player.y,
    targetX: enemy.x,
    targetY: enemy.y,
    damage: 45,
    isCritical: false
  }}
  onComplete={() => {
    setAnimating(false);
    resolveCombatTurn();
  }}
  isActive={animating}
/>
```

**With Critical Hit**
```typescript
<AnimationController
  attackType="lightning"
  attackData={{
    casterX: casterPosition.x,
    casterY: casterPosition.y,
    targetX: targetPosition.x,
    targetY: targetPosition.y,
    damage: 127,
    isCritical: true,
    element: 'lightning'
  }}
  onComplete={handleAnimationComplete}
  isActive={true}
/>
```

**Queue Multiple Animations**
```typescript
// First animation starts
<AnimationController attackType="fire" {...props} isActive={true} />

// Second animation automatically queued
<AnimationController attackType="ice" {...props} isActive={true} />

// Third animation queued (plays after second)
<AnimationController attackType="lightning" {...props} isActive={true} />
```

#### Performance Instrumentation

Development mode includes performance tracking:

```javascript
// Logs in development
📊 [Performance] AnimationController-render took 2.34ms (within target)
🎬 [Animation Timing] fire started at 1234.56ms
✅ [Animation Timing] fire completed in 950.00ms
```

Warnings if performance degrades:
```javascript
⚠️ [Performance] AnimationController-render took 7.89ms (target: <5ms)
⚠️ [Animation Timing] fire took longer than expected (2150.00ms > 2000ms)
```

#### Fallback Animation

When attack type not in registry:
```typescript
// Development warning
⚠️ [AnimationController] No animation found for attack type: "unknown_spell".
   Using fallback (Magic Bolt).

// Uses default animation
const DEFAULT_ANIMATION = {
  element: 'arcane',
  type: 'projectile',
  component: MagicBoltAnimation
};
```

#### Position Validation

Validates coordinates before rendering:
```typescript
// Invalid position handling
if (isNaN(targetX) || targetX > 10000) {
  console.warn('Invalid position data for "fire"');
  onComplete(); // Skip animation
  return null;
}
```

#### Integration Pattern

```typescript
// In Combat.tsx
const handleAttack = (spell: Spell) => {
  setState({ animating: true, currentSpell: spell });
};

<AnimationController
  attackType={currentSpell.id}
  attackData={{
    casterX: isPlayerTurn ? playerX : enemyX,
    casterY: isPlayerTurn ? playerY : enemyY,
    targetX: isPlayerTurn ? enemyX : playerX,
    targetY: isPlayerTurn ? enemyY : playerY,
    damage: calculateDamage(currentSpell),
    isCritical: rollCritical()
  }}
  onComplete={() => {
    applyDamage();
    setState({ animating: false });
    nextTurn();
  }}
  isActive={state.animating}
/>
```

---

## Shared Interfaces and Types

### Core Type Definitions

**File**: `src/components/combat/animations/types.ts`

#### AnimationTimings

```typescript
interface AnimationTimings {
  charge: number;   // Charge phase duration (ms)
  cast: number;     // Cast phase duration (ms)
  travel: number;   // Travel phase duration (ms)
  impact: number;   // Impact phase duration (ms)
  total: number;    // Total animation duration (ms)
}
```

#### ProjectileConfig

```typescript
interface ProjectileConfig {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  glowColor: string;
  size?: number;
}
```

#### ImpactConfig

```typescript
interface ImpactConfig {
  x: number;
  y: number;
  damage: number;
  isCritical?: boolean;
  element?: 'fire' | 'ice' | 'lightning' | 'arcane';
}
```

#### ParticleConfig

```typescript
interface ParticleConfig {
  count: number;
  color: string;
  size: number;
  spread: number;
}
```

### Animation Metadata (Registry)

**File**: `src/components/combat/animations/animationRegistry.ts`

```typescript
interface AnimationMetadata {
  element?: 'fire' | 'ice' | 'lightning' | 'holy' | 'arcane' |
            'nature' | 'neutral' | 'poison';
  type: 'projectile' | 'beam' | 'aoe' | 'buff' | 'heal' |
        'debuff' | 'physical';
  component: ComponentType<AnimationComponentProps>;
  description?: string;
}

interface AnimationComponentProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}
```

### Duration Constants

```typescript
// Attack weight durations
export const FAST_ATTACK_DURATION = 600;      // 400-600ms
export const MEDIUM_ATTACK_DURATION = 900;    // 600-1000ms
export const HEAVY_ATTACK_DURATION = 1400;    // 1000-1500ms

// Specific animation timings
export const MAGIC_BOLT_TIMINGS: AnimationTimings = {
  charge: 400,
  cast: 200,
  travel: 600,
  impact: 200,
  total: 1400
};
```

### Color Palettes

```typescript
// Element color schemes (PRD specifications)
export const FIRE_COLORS = {
  primary: '#ff6b35',    // Orange
  secondary: '#ff4444',  // Red
  accent: '#ffaa00'      // Yellow-orange
};

export const ICE_COLORS = {
  primary: '#4da6ff',    // Blue
  secondary: '#b3e0ff',  // Light blue
  accent: '#ffffff'      // White
};

export const LIGHTNING_COLORS = {
  primary: '#ffeb3b',    // Yellow
  secondary: '#fff176',  // Light yellow
  accent: '#ffffff'      // White
};

export const HOLY_COLORS = {
  primary: '#ffd700',    // Gold
  secondary: '#ffffcc',  // Light gold
  accent: '#ffffff'      // White
};

export const ARCANE_COLORS = {
  primary: '#9c27b0',    // Purple
  secondary: '#ba68c8',  // Light purple
  accent: '#4a148c'      // Dark purple
};

export const POISON_COLORS = {
  primary: '#8bc34a',    // Green
  secondary: '#33691e',  // Dark green
  accent: '#7b1fa2'      // Purple tint
};
```

### Spring Configurations

```typescript
export const SPRING_CONFIG = {
  smooth: {
    type: "spring" as const,
    stiffness: 100,
    damping: 15
  },
  bouncy: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20
  },
  stiff: {
    type: "spring" as const,
    stiffness: 400,
    damping: 25
  }
};
```

### Particle Count Validation

```typescript
const MAX_PARTICLES = 30;
const RECOMMENDED_MAX_PARTICLES = 20;

export const validateParticleCount = (
  count: number,
  componentName: string,
  phase?: string
): void => {
  // Development warnings/errors for particle limits
};
```

---

## Usage Patterns

### Composing Multi-Phase Animations

Most spell animations follow this pattern:

```typescript
const [phase, setPhase] = useState<'charge' | 'cast' | 'travel' | 'impact'>('charge');

return (
  <div className="spell-animation">
    {/* CHARGE PHASE */}
    {phase === 'charge' && (
      <ChargeParticles
        x={casterX}
        y={casterY}
        config={{ color: FIRE_COLORS.primary }}
        isActive={true}
      />
    )}

    {/* CAST PHASE */}
    {phase === 'cast' && (
      <ParticleSystem
        originX={casterX}
        originY={casterY}
        particleCount={15}
        colors={[FIRE_COLORS.primary, FIRE_COLORS.accent]}
        spread={100}
        lifetime={150}
        onComplete={() => setPhase('travel')}
      />
    )}

    {/* TRAVEL PHASE */}
    {phase === 'travel' && (
      <Projectile
        startX={casterX}
        startY={casterY}
        endX={targetX}
        endY={targetY}
        color={FIRE_COLORS.primary}
        duration={300}
        onComplete={() => setPhase('impact')}
      />
    )}

    {/* IMPACT PHASE */}
    {phase === 'impact' && (
      <ImpactEffects
        config={{ x: targetX, y: targetY, damage: 45 }}
        isActive={true}
        onComplete={onComplete}
      />
    )}
  </div>
);
```

### Parallel Effects

Run multiple effects simultaneously:

```typescript
{phase === 'impact' && (
  <>
    {/* Primary explosion */}
    <ParticleSystem
      originX={targetX}
      originY={targetY}
      particleCount={25}
      colors={[FIRE_COLORS.primary, FIRE_COLORS.secondary]}
      spread={150}
      lifetime={200}
    />

    {/* Secondary shockwave */}
    <AreaEffect
      centerX={targetX}
      centerY={targetY}
      radius={100}
      color={FIRE_COLORS.primary}
      expandDuration={150}
      fadeDuration={100}
    />

    {/* Impact flash */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.3, 0] }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        background: FIRE_COLORS.primary,
        pointerEvents: 'none'
      }}
    />

    {/* All happen simultaneously */}
  </>
)}
```

### Conditional Rendering Based on Props

```typescript
interface SpellAnimationProps extends AnimationComponentProps {
  damage?: number;
  isCritical?: boolean;
}

// Normal vs Critical impacts
{phase === 'impact' && (
  isCritical ? (
    <>
      {/* Enhanced critical effects */}
      <ParticleSystem particleCount={30} spread={200} />
      <motion.div /* screen flash */ />
      <ImpactEffects config={{ ...config, isCritical: true }} />
    </>
  ) : (
    <>
      {/* Standard effects */}
      <ParticleSystem particleCount={20} spread={150} />
      <ImpactEffects config={{ ...config, isCritical: false }} />
    </>
  )
)}
```

### Reusing Components Across Spells

```typescript
// Shared impact effect for all fire spells
const FireImpact: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <>
    <ParticleSystem
      originX={x}
      originY={y}
      particleCount={25}
      colors={[FIRE_COLORS.primary, FIRE_COLORS.secondary, FIRE_COLORS.accent]}
      spread={150}
      lifetime={200}
      gravity={80}
    />
    <AreaEffect
      centerX={x}
      centerY={y}
      radius={80}
      color={FIRE_COLORS.primary}
      expandDuration={150}
      fadeDuration={100}
    />
  </>
);

// Use in Fireball, Fire Blast, etc.
{phase === 'impact' && <FireImpact x={targetX} y={targetY} />}
```

### Performance Optimization Patterns

```typescript
// Memoize expensive calculations
const trajectory = useMemo(() => ({
  deltaX: targetX - casterX,
  deltaY: targetY - casterY,
  distance: Math.sqrt(
    Math.pow(targetX - casterX, 2) +
    Math.pow(targetY - casterY, 2)
  ),
  angle: Math.atan2(targetY - casterY, targetX - casterX)
}), [casterX, casterY, targetX, targetY]);

// Memoize callbacks
const handlePhaseComplete = useCallback(() => {
  setPhase(nextPhase);
}, [nextPhase]);

// Memoize color arrays
const fireColors = useMemo(() => [
  FIRE_COLORS.primary,
  FIRE_COLORS.secondary,
  FIRE_COLORS.accent
], []);
```

---

## Props Reference Tables

### Quick Reference: Core Components

| Component | Required Props | Optional Props | onComplete |
|-----------|---------------|----------------|------------|
| ParticleSystem | originX, originY, particleCount, colors, spread, lifetime | size, gravity, fadeOut | ✅ Yes |
| MeleeSlash | slashType, startX, startY, endX, endY, color, duration | trailWidth | ✅ Yes |
| AreaEffect | centerX, centerY, radius, color, expandDuration, fadeDuration | particleCount | ✅ Yes |
| StatusOverlay | statusType, targetX, targetY, color, isActive | intensity | ✅ Yes |
| BuffAura | targetX, targetY, auraColor, pulseSpeed, particles, isActive | intensity, persistent | ✅ Yes |

### Quick Reference: Building Blocks

| Component | Required Props | Optional Props | onComplete |
|-----------|---------------|----------------|------------|
| Projectile | startX, startY, endX, endY, color | size, duration, glowIntensity | ✅ Yes |
| ImpactEffects | config, isActive | - | ✅ Yes |
| ChargeParticles | x, y, isActive | config | ❌ No |

### Quick Reference: System Components

| Component | Required Props | Optional Props | onComplete |
|-----------|---------------|----------------|------------|
| AnimationController | attackType, attackData, isActive | - | ✅ Yes (required) |

---

## Code Examples Gallery

### Example 1: Basic Spell (Minimal Props)

```typescript
/**
 * Simple Ice Bolt spell
 * Charge → Travel → Impact
 */
export const IceBoltAnimation: React.FC<AnimationComponentProps> = ({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  const [phase, setPhase] = useState<'charge' | 'travel' | 'impact'>('charge');

  return (
    <>
      {phase === 'charge' && (
        <ChargeParticles
          x={casterX}
          y={casterY}
          config={{ color: ICE_COLORS.primary, count: 8 }}
          isActive={true}
          onComplete={() => setPhase('travel')}
        />
      )}

      {phase === 'travel' && (
        <Projectile
          startX={casterX}
          startY={casterY}
          endX={targetX}
          endY={targetY}
          color={ICE_COLORS.primary}
          duration={400}
          onComplete={() => setPhase('impact')}
        />
      )}

      {phase === 'impact' && (
        <ParticleSystem
          originX={targetX}
          originY={targetY}
          particleCount={20}
          colors={[ICE_COLORS.primary, ICE_COLORS.secondary]}
          spread={120}
          lifetime={300}
          gravity={80}
          onComplete={onComplete}
        />
      )}
    </>
  );
};
```

### Example 2: Complex Spell (All Features)

```typescript
/**
 * Advanced Meteor spell
 * Warning → Descent → Impact → Aftermath with screen effects
 */
export const MeteorAnimation: React.FC<AnimationComponentProps> = ({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  const [phase, setPhase] = useState<'warning' | 'descent' | 'impact' | 'aftermath'>('warning');

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {/* WARNING PHASE: Ground indicator */}
      {phase === 'warning' && (
        <>
          {/* Sky glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0.3] }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              height: '50%',
              background: `linear-gradient(to bottom, ${FIRE_COLORS.primary}40, transparent)`,
              pointerEvents: 'none'
            }}
          />

          {/* Ground warning circle */}
          <AreaEffect
            centerX={targetX}
            centerY={targetY}
            radius={120}
            color={FIRE_COLORS.secondary}
            expandDuration={300}
            fadeDuration={100}
            particleCount={0}
            onComplete={() => setPhase('descent')}
          />
        </>
      )}

      {/* DESCENT PHASE: Meteor falling */}
      {phase === 'descent' && (
        <>
          <motion.div
            initial={{ x: targetX, y: -100, scale: 0.5 }}
            animate={{
              x: targetX,
              y: targetY,
              scale: [0.5, 1.5, 1.2],
              transition: { duration: 0.6, ease: 'easeIn' }
            }}
            onAnimationComplete={() => setPhase('impact')}
            style={{
              position: 'absolute',
              width: 60,
              height: 60,
              marginLeft: -30,
              marginTop: -30,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${FIRE_COLORS.accent}, ${FIRE_COLORS.primary})`,
              boxShadow: `0 0 60px ${FIRE_COLORS.primary}`
            }}
          />

          {/* Trailing fire */}
          <ParticleSystem
            originX={targetX}
            originY={targetY - 50}
            particleCount={15}
            colors={[FIRE_COLORS.primary, FIRE_COLORS.accent]}
            spread={40}
            lifetime={400}
            gravity={-30}
          />
        </>
      )}

      {/* IMPACT PHASE: Explosion */}
      {phase === 'impact' && (
        <>
          {/* Massive AOE */}
          <AreaEffect
            centerX={targetX}
            centerY={targetY}
            radius={150}
            color={FIRE_COLORS.primary}
            expandDuration={300}
            fadeDuration={200}
            particleCount={30}
          />

          {/* Explosion particles */}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={30}
            colors={[FIRE_COLORS.primary, FIRE_COLORS.secondary, FIRE_COLORS.accent]}
            spread={180}
            lifetime={400}
            gravity={100}
          />

          {/* Screen shake effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.4, 0],
              transition: { duration: 0.3 }
            }}
            onAnimationComplete={() => setPhase('aftermath')}
            style={{
              position: 'fixed',
              inset: 0,
              background: FIRE_COLORS.primary,
              pointerEvents: 'none'
            }}
          />
        </>
      )}

      {/* AFTERMATH PHASE: Lingering effects */}
      {phase === 'aftermath' && (
        <>
          {/* Smoke/dust clouds */}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={20}
            colors={['#78716c', '#a8a29e']}
            spread={100}
            lifetime={800}
            size={12}
            gravity={-20}
            onComplete={onComplete}
          />

          {/* Ground scorch mark */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.6, 0.3],
              scale: [0, 1, 1],
              transition: { duration: 0.5 }
            }}
            style={{
              position: 'absolute',
              left: targetX - 75,
              top: targetY - 20,
              width: 150,
              height: 40,
              borderRadius: '50%',
              background: 'radial-gradient(ellipse, #1c1917, transparent)',
              transform: 'rotateX(60deg)'
            }}
          />
        </>
      )}
    </div>
  );
};
```

### Example 3: Multi-Phase Coordination

```typescript
/**
 * Coordinated healing spell
 * Charge → Cast → Descend → Absorb → Complete
 */
export const HealAnimation: React.FC<AnimationComponentProps> = ({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  const [phase, setPhase] = useState<'charge' | 'cast' | 'descend' | 'absorb'>('charge');

  const TIMINGS = {
    charge: 400,
    cast: 150,
    descend: 300,
    absorb: 300
  };

  return (
    <>
      {/* Phase 1: Gather healing energy above caster */}
      {phase === 'charge' && (
        <ParticleSystem
          originX={casterX}
          originY={casterY - 60}
          particleCount={15}
          colors={['#4ade80', '#86efac', '#bbf7d0']}
          spread={-50}  // Converge
          lifetime={TIMINGS.charge}
          gravity={0}
          fadeOut={false}
          onComplete={() => setPhase('cast')}
        />
      )}

      {/* Phase 2: Cast healing orb */}
      {phase === 'cast' && (
        <motion.div
          initial={{ x: casterX, y: casterY - 60, scale: 0 }}
          animate={{
            scale: [0, 1.5, 1.2],
            transition: { duration: TIMINGS.cast / 1000 }
          }}
          onAnimationComplete={() => setPhase('descend')}
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            marginLeft: -20,
            marginTop: -20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #86efac, #4ade80)',
            boxShadow: '0 0 30px #4ade80'
          }}
        />
      )}

      {/* Phase 3: Healing light descends to target */}
      {phase === 'descend' && (
        <motion.div
          initial={{ x: casterX, y: casterY - 60 }}
          animate={{
            x: targetX,
            y: targetY,
            transition: { duration: TIMINGS.descend / 1000, ease: 'easeOut' }
          }}
          onAnimationComplete={() => setPhase('absorb')}
          style={{
            position: 'absolute',
            width: 40,
            height: 40,
            marginLeft: -20,
            marginTop: -20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #86efac, #4ade80)',
            boxShadow: '0 0 30px #4ade80'
          }}
        />
      )}

      {/* Phase 4: Absorbed into target with sparkles */}
      {phase === 'absorb' && (
        <>
          {/* Healing aura */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0, 1.5, 2],
              transition: { duration: TIMINGS.absorb / 1000 }
            }}
            style={{
              position: 'absolute',
              left: targetX - 60,
              top: targetY - 80,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #4ade8080, #86efac40, transparent)',
              filter: 'blur(10px)'
            }}
          />

          {/* Sparkle particles */}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={20}
            colors={['#4ade80', '#86efac', '#ffffff']}
            spread={60}
            lifetime={TIMINGS.absorb}
            size={4}
            gravity={-30}
            onComplete={onComplete}
          />
        </>
      )}
    </>
  );
};
```

### Example 4: Reusing Components Across Spells

```typescript
/**
 * Shared impact effect generator
 * Reusable across multiple spell types
 */
const createElementalImpact = (element: 'fire' | 'ice' | 'lightning') => {
  const configs = {
    fire: {
      colors: [FIRE_COLORS.primary, FIRE_COLORS.secondary, FIRE_COLORS.accent],
      particleCount: 28,
      spread: 150,
      gravity: 80
    },
    ice: {
      colors: [ICE_COLORS.primary, ICE_COLORS.secondary, ICE_COLORS.accent],
      particleCount: 25,
      spread: 120,
      gravity: 100
    },
    lightning: {
      colors: [LIGHTNING_COLORS.primary, LIGHTNING_COLORS.secondary, LIGHTNING_COLORS.accent],
      particleCount: 20,
      spread: 140,
      gravity: 0
    }
  };

  const config = configs[element];

  return ({ x, y, onComplete }: { x: number; y: number; onComplete?: () => void }) => (
    <>
      <ParticleSystem
        originX={x}
        originY={y}
        particleCount={config.particleCount}
        colors={config.colors}
        spread={config.spread}
        lifetime={200}
        gravity={config.gravity}
        onComplete={onComplete}
      />
      <AreaEffect
        centerX={x}
        centerY={y}
        radius={element === 'fire' ? 100 : element === 'ice' ? 80 : 90}
        color={config.colors[0]}
        expandDuration={150}
        fadeDuration={100}
      />
    </>
  );
};

// Use in multiple spells
const FireImpact = createElementalImpact('fire');
const IceImpact = createElementalImpact('ice');
const LightningImpact = createElementalImpact('lightning');

// In spell animation
{phase === 'impact' && <FireImpact x={targetX} y={targetY} onComplete={onComplete} />}
```

### Example 5: Performance-Optimized Pattern

```typescript
/**
 * Optimized spell animation
 * Uses memoization, callbacks, and efficient rendering
 */
export const OptimizedSpellAnimation: React.FC<AnimationComponentProps> = React.memo(({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  // Memoize expensive calculations
  const trajectory = useMemo(() => ({
    distance: Math.sqrt(Math.pow(targetX - casterX, 2) + Math.pow(targetY - casterY, 2)),
    angle: Math.atan2(targetY - casterY, targetX - casterX),
    duration: Math.min(600, Math.max(300, (targetX - casterX) / 2))
  }), [casterX, casterY, targetX, targetY]);

  // Memoize color palettes
  const colors = useMemo(() => ({
    primary: [ARCANE_COLORS.primary, ARCANE_COLORS.secondary],
    accent: [ARCANE_COLORS.accent, ARCANE_COLORS.primary]
  }), []);

  // Stable callbacks
  const handleChargeComplete = useCallback(() => setPhase('travel'), []);
  const handleTravelComplete = useCallback(() => setPhase('impact'), []);
  const handleImpactComplete = useCallback(() => onComplete?.(), [onComplete]);

  const [phase, setPhase] = useState<'charge' | 'travel' | 'impact'>('charge');

  return (
    <>
      {phase === 'charge' && (
        <ChargeParticles
          x={casterX}
          y={casterY}
          config={{ color: colors.primary[0] }}
          isActive={true}
          onComplete={handleChargeComplete}
        />
      )}

      {phase === 'travel' && (
        <Projectile
          startX={casterX}
          startY={casterY}
          endX={targetX}
          endY={targetY}
          color={colors.primary[0]}
          duration={trajectory.duration}
          onComplete={handleTravelComplete}
        />
      )}

      {phase === 'impact' && (
        <ParticleSystem
          originX={targetX}
          originY={targetY}
          particleCount={20}
          colors={colors.primary}
          spread={120}
          lifetime={300}
          onComplete={handleImpactComplete}
        />
      )}
    </>
  );
});

OptimizedSpellAnimation.displayName = 'OptimizedSpellAnimation';
```

---

## Performance Notes

### General Guidelines

1. **Particle Limits**:
   - Max 30 particles per effect (hard limit)
   - Recommended 20 particles for consistent 60fps
   - Validation in development mode warns of violations

2. **GPU Properties Only**:
   - Use `transform` and `opacity` exclusively
   - Avoid `width`, `height`, `top`, `left` animations
   - All components are GPU-optimized

3. **Memoization**:
   - All core components use `React.memo()`
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers

4. **Animation Duration**:
   - Target <1500ms for total spell animations
   - Each component should render in <5ms
   - Performance instrumentation in development mode

5. **Cleanup**:
   - All animations self-cleanup on complete
   - No memory leaks from infinite loops
   - Proper `onComplete` callback patterns

### Monitoring Performance

Development mode includes:
```javascript
// Performance timing
📊 [Performance] ParticleSystem-render took 3.21ms (within target)

// Particle count validation
⚠️ [FireballAnimation - impact] Particle count (28) exceeds recommended max (20)

// Animation timing
🎬 [Animation Timing] fire started at 1234.56ms
✅ [Animation Timing] fire completed in 950.00ms
```

---

This completes the comprehensive API documentation for all animation components. Use this as a reference when building new animations or debugging existing ones.
