# Combat Animation System

Welcome to the combat animation system for Sawyer's RPG Game! This documentation will help you understand, use, and extend the animation system that brings wizard spells and combat to life.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start Guide](#quick-start-guide)
3. [File Structure](#file-structure)
4. [Key Concepts](#key-concepts)
5. [Available Animations](#available-animations)
6. [Further Reading](#further-reading)

---

## Overview

### What is the Combat Animation System?

The combat animation system is a modular, production-ready framework for creating visually engaging spell and attack animations in turn-based combat. It transforms combat from static text and numbers into dynamic, cinematic experiences.

### Key Features

- **10 Wizard Spell Animations**: Complete set of offensive, healing, and support spells
- **Phase-Based Architecture**: Animations flow through charge → cast → travel → impact → aftermath phases
- **Dynamic Component Selection**: AnimationController automatically selects the right animation for any spell
- **Performance-Optimized**: GPU-accelerated rendering targeting 60fps on desktop browsers
- **Production-Ready**: Comprehensive error handling, fallback animations, and graceful degradation
- **Developer-Friendly**: Clean APIs, TypeScript types, and extensive documentation

### Technology Stack

- **React 18** with functional components and hooks
- **TypeScript** for type safety and IntelliSense
- **Framer Motion** for smooth, physics-based animations
- **CSS transforms & opacity** for GPU acceleration

---

## Quick Start Guide

### Using Existing Animations in Combat

The animation system integrates seamlessly with the combat flow. Here's how animations are triggered:

#### 1. In Combat.tsx

```typescript
import { AnimationController } from '../animations/AnimationController';

// During the combat turn resolution:
<AnimationController
  attackType="fire"  // Spell ID from spells.js
  attackData={{
    casterX: 100,    // Caster position
    casterY: 200,
    targetX: 500,    // Target position
    targetY: 200,
    damage: 25,      // Optional: for damage effects
    isCritical: false // Optional: for critical hit visuals
  }}
  onComplete={() => {
    // Called when animation finishes
    // Continue combat flow here
  }}
  isActive={true}    // Trigger the animation
/>
```

#### 2. Animation Lifecycle

1. **AnimationController** receives spell ID (`attackType`)
2. Looks up the spell in the **animationRegistry**
3. Loads the corresponding component (e.g., `FireballAnimation`)
4. Renders the animation with position data
5. Animation plays through its phases
6. Calls `onComplete` callback when finished
7. Combat system continues to next turn

#### 3. Spell ID Mapping

The system maps spell IDs to animations automatically:

| Spell ID | Animation | Element | Type |
|----------|-----------|---------|------|
| `magic_bolt` | Magic Bolt | Arcane | Projectile |
| `fire` | Fireball | Fire | Projectile |
| `ice` | Ice Shard | Ice | Projectile |
| `thunder` | Lightning | Lightning | Beam |
| `holy` | Holy Beam | Holy | Beam |
| `meteor` | Meteor | Fire | AOE |
| `heal` | Heal | Holy | Heal |
| `protect` | Protect | Neutral | Buff |
| `shell` | Shell | Neutral | Buff |
| `haste` | Haste | Neutral | Buff |

### Testing Animations

To test an animation in isolation:

```typescript
import { FireballAnimation } from '@/components/combat/animations/variants/FireballAnimation';

<FireballAnimation
  casterX={100}
  casterY={200}
  targetX={500}
  targetY={200}
  onComplete={() => console.log('Animation complete!')}
/>
```

---

## File Structure

The animation system follows a modular architecture organized by purpose:

```
src/components/combat/animations/
├── animationRegistry.ts          # Maps spell IDs to components
├── AnimationController.tsx       # Smart animation selector & lifecycle manager
├── MagicBoltAnimation.tsx        # Original magic bolt spell
├── types.ts                      # Shared types and constants
├── index.ts                      # Barrel exports
│
├── core/                         # Reusable animation primitives
│   ├── ChargeParticles.tsx       # Particle gathering effect
│   ├── Projectile.tsx            # Moving projectile effect
│   ├── ImpactEffects.tsx         # Hit/explosion effects
│   ├── AreaEffect.tsx            # AOE spreading circles
│   ├── BuffAura.tsx              # Character aura effects
│   ├── StatusOverlay.tsx         # Persistent status overlays
│   ├── MeleeSlash.tsx            # Weapon trail effects
│   └── ParticleSystem.tsx        # Enhanced particle generator
│
└── variants/                     # Spell-specific animations
    ├── FireballAnimation.tsx     # Fire projectile
    ├── IceShardAnimation.tsx     # Ice projectile
    ├── LightningAnimation.tsx    # Lightning strike
    ├── HolyBeamAnimation.tsx     # Divine beam
    ├── MeteorAnimation.tsx       # Meteor AOE
    ├── HealAnimation.tsx         # Healing spell
    ├── ProtectAnimation.tsx      # Shield buff
    ├── ShellAnimation.tsx        # Magic defense buff
    └── HasteAnimation.tsx        # Speed buff
```

### Directory Responsibilities

#### `animationRegistry.ts`
Central registry mapping spell IDs to animation components with metadata. This is the source of truth for which animation plays for each spell.

**Key exports:**
- `ATTACK_ANIMATION_MAP` - Main spell-to-component mapping
- `getAnimationMetadata(spellId)` - Look up animation data
- `DEFAULT_ANIMATION` - Fallback for unmapped spells

#### `AnimationController.tsx`
Smart component that handles animation selection, lifecycle management, queueing, and error handling.

**Features:**
- Automatic component selection from registry
- Fallback to Magic Bolt for unmapped spells
- Animation queueing for rapid spell sequences
- Error boundaries to prevent crashes
- Position validation before rendering
- Performance instrumentation in dev mode

#### `types.ts`
Shared TypeScript interfaces and constants used across all animations.

**Key exports:**
- `AnimationTimings` - Phase duration interface
- `FIRE_COLORS`, `ICE_COLORS`, etc. - Element color palettes
- `SPRING_CONFIG` - Framer Motion spring presets
- `validateParticleCount()` - Performance validation

#### `core/` Components
Reusable animation primitives that can be composed into complex spell effects.

| Component | Purpose | Used By |
|-----------|---------|---------|
| `ChargeParticles` | Particle gathering during cast | Most projectiles |
| `Projectile` | Moving spell projectile | Fire, Ice, Magic Bolt |
| `ImpactEffects` | Explosion/hit effects | All offensive spells |
| `AreaEffect` | Expanding AOE circles | Meteor, buffs |
| `BuffAura` | Persistent character glow | Protect, Shell, Haste |
| `StatusOverlay` | Status effect overlays | Buffs, debuffs |
| `MeleeSlash` | Weapon trail effects | Physical attacks |
| `ParticleSystem` | Generic particle generator | Various effects |

#### `variants/` Components
Complete spell-specific animations that orchestrate core components into cohesive visual sequences.

Each variant component:
- Implements the standard `AnimationComponentProps` interface
- Coordinates multiple animation phases with timing
- Uses core components as building blocks
- Handles its own color scheme and effects
- Calls `onComplete` when animation finishes

---

## Key Concepts

### Animation Phases

All spell animations follow a 5-phase structure for visual consistency:

1. **Charge Phase** (200-600ms)
   - Caster gathers magical energy
   - Particles converge around caster
   - Anticipation builds for the attack

2. **Cast Phase** (100-200ms)
   - Caster releases the spell
   - Energy forms into spell shape
   - Quick transition to action

3. **Travel Phase** (200-600ms)
   - Projectile moves to target (projectiles)
   - Beam appears and strikes (beams)
   - Warning indicators (AOE)

4. **Impact Phase** (100-300ms)
   - Spell hits the target
   - Explosion/burst effects
   - Target reaction

5. **Aftermath Phase** (0-200ms)
   - Lingering effects fade
   - Dust/smoke clears
   - Return to combat UI

**Note:** Not all spells use all phases. Buffs skip travel/impact, instant effects skip charge, etc.

### Animation Registry System

The registry pattern decouples spell IDs from animation implementations:

```typescript
// In animationRegistry.ts
export const ATTACK_ANIMATION_MAP = {
  fire: {
    element: 'fire',
    type: 'projectile',
    component: FireballAnimation,
    description: 'Spinning fireball with explosive impact'
  },
  // ... more spells
};
```

**Benefits:**
- Easy to add new spells without modifying controller
- Metadata enables filtering and debugging
- Fallback system ensures no crashes from missing animations
- Clear separation of concerns

### Component Props Interface

All animation components share a standard interface:

```typescript
export interface AnimationComponentProps {
  casterX: number;       // Caster position X
  casterY: number;       // Caster position Y
  targetX: number;       // Target position X
  targetY: number;       // Target position Y
  onComplete?: () => void; // Callback when done
}
```

This consistency allows the AnimationController to work with any animation component without special handling.

### Error Handling & Fallbacks

The system is resilient to failures:

- **Error Boundaries**: Catch render errors and skip to combat result
- **Position Validation**: Invalid coordinates skip animation gracefully
- **Missing Animations**: Fallback to Magic Bolt with console warning
- **Queue Overflow**: Drops excess animations with warning (max 5 queued)
- **Development Logging**: Detailed errors in dev, silent in production

### Performance Optimization

The system is optimized for smooth 60fps gameplay:

- **GPU-Accelerated Properties**: Only `transform` and `opacity` (no layout/paint)
- **Component Memoization**: All components wrapped in `React.memo`
- **Particle Limits**: Max 20-30 particles per effect with validation
- **Lazy Loading**: Animation components load on-demand (future enhancement)
- **Performance Instrumentation**: Dev mode tracks render times (<5ms target)

---

## Available Animations

### Offensive Spells

#### Fireball (`fire`)
- **Element:** Fire
- **Type:** Projectile
- **Duration:** 950ms
- **Visual:** Spinning fireball with explosive impact, orange/red particle trail

#### Ice Shard (`ice`)
- **Element:** Ice
- **Type:** Projectile
- **Duration:** 900ms
- **Visual:** Rotating crystalline shard with frost mist, shatters on impact

#### Lightning (`thunder`)
- **Element:** Lightning
- **Type:** Beam
- **Duration:** 900ms
- **Visual:** Electric sparks charge, bolt strikes from sky, electric burst

#### Holy Beam (`holy`)
- **Element:** Holy
- **Type:** Beam
- **Duration:** 1000ms
- **Visual:** Golden particles gather above, divine light beam strikes down

#### Meteor (`meteor`)
- **Element:** Fire
- **Type:** AOE
- **Duration:** 1500ms
- **Visual:** Red glow in sky, shadow warning circles, meteors crash down

#### Magic Bolt (`magic_bolt`)
- **Element:** Arcane
- **Type:** Projectile
- **Duration:** 1400ms
- **Visual:** Purple arcane energy projectile, basic wizard attack

### Healing Spells

#### Heal (`heal`)
- **Element:** Holy
- **Type:** Heal
- **Duration:** 1100ms
- **Visual:** Green particles gather, healing light descends, gentle glow

### Support Spells (Buffs)

#### Protect (`protect`)
- **Element:** Neutral
- **Type:** Buff
- **Duration:** 700-900ms (+ persistent shimmer)
- **Visual:** Blue magical circle, shield barrier materializes, subtle glow remains

#### Shell (`shell`)
- **Element:** Neutral
- **Type:** Buff
- **Duration:** 700-900ms (+ persistent shimmer)
- **Visual:** Purple/violet barrier for magic defense, similar to Protect

#### Haste (`haste`)
- **Element:** Neutral
- **Type:** Buff
- **Duration:** 250ms (+ persistent trail)
- **Visual:** Yellow speed lines and glow, subtle particle trail remains

---

## Further Reading

### For Users
- **[Timing Guidelines](../specifications/timing-guidelines.md)** - Animation duration standards and pacing
- **[Design Principles](../specifications/design-principles.md)** - Visual philosophy and readability standards

### For Developers
- **[Adding New Animations](../guides/adding-new-animations.md)** - Step-by-step tutorial for creating animations
- **[Component API Reference](../api/component-api.md)** - Complete API documentation for all components
- **[Troubleshooting](../guides/troubleshooting.md)** - Common issues and debugging tips
- **[Animation Patterns](../specifications/animation-patterns.md)** - Reusable templates and design patterns

### Technical Documentation
- **[Wizard Spell Specifications](../specifications/wizard-spell-specifications.md)** - Detailed specs for each spell
- **[Performance Reports](../reports/)** - Performance testing and optimization results

---

## Getting Help

### Development Mode Logging

The system provides detailed logging in development mode:

```
🎬 [AnimationController] Starting animation: fire (element: fire, type: projectile)
📊 [Performance] FireballAnimation render took 2.45ms (within target)
✅ [Animation Timing] fire completed in 948.23ms
```

**Emoji Legend:**
- 🎬 Animation lifecycle events
- 📊 Performance measurements
- ✅ Successful completions
- ⚠️ Warnings (fallbacks, performance)
- 🚨 Errors (crashes, failures)

### Common Questions

**Q: How do I trigger an animation in combat?**
A: Use `<AnimationController attackType="fire" ... />` with the spell ID.

**Q: What happens if a spell has no animation?**
A: AnimationController falls back to Magic Bolt and logs a warning in dev mode.

**Q: How do I add a new spell animation?**
A: See [Adding New Animations](../guides/adding-new-animations.md) for a complete tutorial.

**Q: Why is my animation laggy?**
A: Check the [Troubleshooting Guide](../guides/troubleshooting.md) for performance debugging steps.

---

## Quick Reference Card

### Trigger Animation
```tsx
<AnimationController
  attackType="fire"
  attackData={{ casterX, casterY, targetX, targetY }}
  onComplete={() => {}}
  isActive={true}
/>
```

### Create New Spell Component
```tsx
import { AnimationComponentProps } from '../animationRegistry';

export const MySpellAnimation: React.FC<AnimationComponentProps> = ({
  casterX, casterY, targetX, targetY, onComplete
}) => {
  // Animation implementation
  return <div>...</div>;
};
```

### Register New Spell
```tsx
// In animationRegistry.ts
export const ATTACK_ANIMATION_MAP = {
  my_spell: {
    element: 'fire',
    type: 'projectile',
    component: MySpellAnimation,
    description: 'My awesome spell'
  }
};
```

---

**Built with precision and passion for great game feel! Happy animating!** ✨
