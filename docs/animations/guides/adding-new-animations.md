# Adding New Animations - Step-by-Step Tutorial

This hands-on tutorial walks you through creating a new spell animation from scratch. By the end, you'll have added a fully functional "Shadow Bolt" dark magic spell with complete animation and combat integration.

## Table of Contents

1. [Prerequisites and Setup](#prerequisites-and-setup)
2. [Step-by-Step Tutorial: Shadow Bolt Spell](#step-by-step-tutorial-shadow-bolt-spell)
3. [Code Templates and Patterns](#code-templates-and-patterns)
4. [Common Patterns and Shortcuts](#common-patterns-and-shortcuts)
5. [Testing Checklist](#testing-checklist)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices Recap](#best-practices-recap)

---

## Prerequisites and Setup

### What You Need to Know

Before starting, you should be familiar with:

- **React fundamentals** - functional components, hooks (`useState`, `useCallback`, `useEffect`)
- **TypeScript basics** - interfaces, type annotations
- **Framer Motion basics** - `motion.div`, `animate` prop, transitions
- **CSS fundamentals** - positioning, transforms, gradients

### Tools You'll Need

- **Code editor** with TypeScript support (VS Code recommended)
- **Browser DevTools** for testing and performance monitoring
- **Access to these project files:**
  - `/src/components/combat/animations/` - animation components
  - `/src/components/combat/animations/types.ts` - color constants and validation
  - `/src/components/combat/animations/animationRegistry.ts` - spell mapping
  - `/public/data/spells.js` - spell data

### Understanding the Animation System Architecture

**Quick Recap** (see [README.md](../README.md) for full details):

1. **Animation Components** (`variants/*.tsx`) - Individual spell animations
2. **Animation Registry** (`animationRegistry.ts`) - Maps spell IDs to components
3. **Animation Controller** (`AnimationController.tsx`) - Orchestrates playback
4. **Combat Integration** (`Combat.tsx`) - Triggers animations during battle

**Flow:** `Combat.tsx` → `AnimationController` → `animationRegistry` → `ShadowBoltAnimation.tsx`

---

## Step-by-Step Tutorial: Shadow Bolt Spell

We'll create a **Shadow Bolt** - a dark magic projectile spell with purple/black energy and ominous visual effects.

### Step 1: Plan Your Animation

Before writing code, define the spell's visual identity and timing.

#### 1.1 Define the Spell Concept

**Spell Name:** Shadow Bolt
**Element:** Dark/Shadow
**Visual Style:** Purple and black energy, ominous and creeping
**Attack Weight:** Medium (900-1000ms total)
**Key Characteristics:**
- Charge: Dark energy swirls and converges
- Travel: Shadowy projectile with trailing wisps
- Impact: Dark burst with creeping shadow tendrils

#### 1.2 Determine Total Duration and Phase Timings

Based on [timing-guidelines.md](./timing-guidelines.md), a medium attack should be 900-1000ms:

| Phase | Duration | Purpose |
|-------|----------|---------|
| **Charge** | 350ms | Dark energy converges around caster's hand |
| **Cast** | 150ms | Shadow burst from hand |
| **Travel** | 300ms | Projectile flies to target with trailing shadows |
| **Impact** | 150ms | Dark explosion with creeping tendrils |
| **TOTAL** | 950ms | ✅ Within medium attack range |

#### 1.3 Choose Your Color Palette

**Shadow Bolt Color Scheme:**
- **Primary:** `#6a0dad` (Dark purple - main spell color)
- **Secondary:** `#1a0033` (Very dark purple/black - shadows)
- **Accent:** `#9b30ff` (Bright purple - energy highlights)

We'll add these to `types.ts` later.

#### 1.4 Determine Particle Counts

Following the [design principles](./design-principles.md):

- **Charge:** 15 particles (converging dark energy)
- **Cast:** 10 particles (burst)
- **Travel:** 12 particles (trailing wisps)
- **Impact:** 25 particles (dark explosion)

All within the 30-particle maximum. ✅

---

### Step 2: Create the Animation Component

#### 2.1 Create the File

Create `/src/components/combat/animations/variants/ShadowBoltAnimation.tsx`

#### 2.2 Component Boilerplate with TypeScript Interface

```typescript
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { Projectile } from '../Projectile';
import { validateParticleCount } from '../types';

interface ShadowBoltAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}

/**
 * ShadowBoltAnimation - Dark magic projectile attack
 *
 * Phase breakdown (950ms total):
 * - Charge (350ms): Dark purple energy converges around caster
 * - Cast (150ms): Shadow burst from hand
 * - Travel (300ms): Shadowy projectile with trailing wisps
 * - Impact (150ms): Dark explosion with creeping tendrils
 *
 * Visual characteristics:
 * - Primary color: #6a0dad (dark purple)
 * - Secondary color: #1a0033 (shadow black)
 * - Particles: 15 charge, 10 cast, 12 travel, 25 impact
 * - Special effects: Converging particles during charge, wispy trails
 */
export const ShadowBoltAnimation: React.FC<ShadowBoltAnimationProps> = React.memo(({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  const [phase, setPhase] = useState<'charge' | 'cast' | 'travel' | 'impact'>('charge');

  // Phase durations (ms)
  const CHARGE_DURATION = 350;
  const CAST_DURATION = 150;
  const TRAVEL_DURATION = 300;
  const IMPACT_DURATION = 150;

  // TODO: Add color constants
  // TODO: Add phase transition handlers
  // TODO: Add render logic

  return null; // Placeholder
});

ShadowBoltAnimation.displayName = 'ShadowBoltAnimation';
```

#### 2.3 Add Phase Transition Handlers

```typescript
// Phase transition handlers
const handleChargeComplete = useCallback(() => {
  setPhase('cast');
}, []);

const handleCastComplete = useCallback(() => {
  setPhase('travel');
}, []);

const handleTravelComplete = useCallback(() => {
  setPhase('impact');
}, []);

const handleImpactComplete = useCallback(() => {
  onComplete?.();
}, [onComplete]);
```

#### 2.4 Implement Each Phase with Framer Motion

**CHARGE PHASE (350ms) - Converging Dark Energy:**

```typescript
return (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 100
    }}
  >
    {/* CHARGE PHASE: Dark energy converging (350ms) */}
    {phase === 'charge' && (
      <>
        {/* Converging shadow particles */}
        {validateParticleCount(15, 'ShadowBoltAnimation', 'charge')}
        <ParticleSystem
          originX={casterX}
          originY={casterY}
          particleCount={15}
          colors={['#6a0dad', '#1a0033', '#9b30ff']}
          spread={-70}  // Negative spread = converge inward
          lifetime={CHARGE_DURATION}
          size={5}
          gravity={0}
          fadeOut={false}
          onComplete={handleChargeComplete}
        />

        {/* Dark energy orb forming */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.7, 0.8],
            scale: [0, 1, 1.1],
            transition: {
              duration: CHARGE_DURATION / 1000,
              ease: 'easeIn'
            }
          }}
          style={{
            position: 'absolute',
            left: casterX - 25,
            top: casterY - 25,
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #9b30ff80 0%, #6a0dad60 40%, transparent 70%)',
            filter: 'blur(8px)',
            boxShadow: '0 0 20px #6a0dad'
          }}
        />

        {/* Ominous pulsing aura */}
        <motion.div
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{
            opacity: [0, 0.4, 0.5],
            scale: [1.5, 1.2, 1],
            transition: {
              duration: CHARGE_DURATION / 1000,
              ease: 'easeIn'
            }
          }}
          style={{
            position: 'absolute',
            left: casterX - 40,
            top: casterY - 40,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #1a003340 0%, transparent 70%)',
            filter: 'blur(15px)'
          }}
        />
      </>
    )}

    {/* Additional phases will go here */}
  </div>
);
```

**CAST PHASE (150ms) - Shadow Burst:**

```typescript
{/* CAST PHASE: Shadow burst from hand (150ms) */}
{phase === 'cast' && (
  <>
    {/* Dark energy explosion */}
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0.5, 2, 2.5],
        transition: {
          duration: CAST_DURATION / 1000,
          ease: 'easeOut'
        }
      }}
      onAnimationComplete={handleCastComplete}
      style={{
        position: 'absolute',
        left: casterX - 40,
        top: casterY - 40,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #9b30ffcc 0%, #6a0dad80 50%, transparent 80%)',
        filter: 'blur(10px)'
      }}
    />

    {/* Shadow particle burst */}
    {validateParticleCount(10, 'ShadowBoltAnimation', 'cast')}
    <ParticleSystem
      originX={casterX}
      originY={casterY}
      particleCount={10}
      colors={['#6a0dad', '#9b30ff']}
      spread={100}
      lifetime={CAST_DURATION}
      size={6}
      gravity={0}
      fadeOut={true}
    />
  </>
)}
```

**TRAVEL PHASE (300ms) - Shadowy Projectile:**

```typescript
{/* TRAVEL PHASE: Shadow projectile with wisps (300ms) */}
{phase === 'travel' && (
  <>
    {/* Main shadow bolt projectile */}
    <Projectile
      startX={casterX}
      startY={casterY}
      endX={targetX}
      endY={targetY}
      color={'#6a0dad'}
      size={22}
      duration={TRAVEL_DURATION}
      glowIntensity={1.1}
      onComplete={handleTravelComplete}
    />

    {/* Dark energy core (pulsing) */}
    <motion.div
      initial={{ x: casterX, y: casterY, opacity: 0 }}
      animate={{
        x: targetX,
        y: targetY,
        opacity: [0, 1, 0.8, 1],  // Pulsing opacity
        transition: {
          duration: TRAVEL_DURATION / 1000,
          ease: 'linear'
        }
      }}
      style={{
        position: 'absolute',
        width: 18,
        height: 18,
        marginLeft: -9,
        marginTop: -9,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #9b30ff 0%, #6a0dad 50%, transparent 80%)',
        boxShadow: '0 0 20px #6a0dad, 0 0 30px #1a0033'
      }}
    />

    {/* Trailing shadow wisps */}
    <motion.div
      initial={{ x: casterX, y: casterY }}
      animate={{
        x: targetX,
        y: targetY,
        transition: {
          duration: TRAVEL_DURATION / 1000,
          ease: 'linear'
        }
      }}
      style={{
        position: 'absolute',
        width: 0,
        height: 0
      }}
    >
      {validateParticleCount(12, 'ShadowBoltAnimation', 'travel-trail')}
      <ParticleSystem
        originX={0}
        originY={0}
        particleCount={12}
        colors={['#6a0dad', '#1a0033']}
        spread={25}
        lifetime={TRAVEL_DURATION * 0.8}
        size={4}
        gravity={-5}  // Slight upward drift
        fadeOut={true}
      />
    </motion.div>
  </>
)}
```

**IMPACT PHASE (150ms) - Dark Explosion:**

```typescript
{/* IMPACT PHASE: Dark explosion with tendrils (150ms) */}
{phase === 'impact' && (
  <>
    {/* Core shadow explosion */}
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 0.7, 0],
        scale: [0, 1.3, 1.8, 2.2],
        transition: {
          duration: IMPACT_DURATION / 1000,
          ease: 'easeOut'
        }
      }}
      onAnimationComplete={handleImpactComplete}
      style={{
        position: 'absolute',
        left: targetX - 50,
        top: targetY - 50,
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #9b30ffff 0%, #6a0dadcc 40%, #1a003380 70%, transparent 90%)',
        filter: 'blur(6px)'
      }}
    />

    {/* Shadow tendrils creeping outward */}
    {[0, 60, 120, 180, 240, 300].map((angle) => (
      <motion.div
        key={angle}
        initial={{
          x: targetX,
          y: targetY,
          opacity: 0,
          scaleX: 0
        }}
        animate={{
          x: targetX + Math.cos((angle * Math.PI) / 180) * 45,
          y: targetY + Math.sin((angle * Math.PI) / 180) * 45,
          opacity: [0, 0.8, 0.5, 0],
          scaleX: [0, 1, 0.8, 0],
          transition: {
            duration: IMPACT_DURATION / 1000,
            ease: 'easeOut'
          }
        }}
        style={{
          position: 'absolute',
          width: 30,
          height: 4,
          background: `linear-gradient(to right, #6a0dad, transparent)`,
          transform: `rotate(${angle}deg)`,
          transformOrigin: 'left center',
          filter: 'blur(2px)'
        }}
      />
    ))}

    {/* Dark explosion particles */}
    {validateParticleCount(25, 'ShadowBoltAnimation', 'impact')}
    <ParticleSystem
      originX={targetX}
      originY={targetY}
      particleCount={25}
      colors={['#6a0dad', '#1a0033', '#9b30ff']}
      spread={130}
      lifetime={IMPACT_DURATION}
      size={7}
      gravity={70}
      fadeOut={true}
    />

    {/* Dark mist cloud */}
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 0.5, 0],
        scale: [0.5, 2, 2.5],
        transition: {
          duration: IMPACT_DURATION / 1000,
          ease: 'easeOut'
        }
      }}
      style={{
        position: 'absolute',
        left: targetX - 60,
        top: targetY - 60,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #1a003350 0%, transparent 70%)',
        filter: 'blur(15px)'
      }}
    />

    {/* Screen flash effect (subtle purple tint) */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.12, 0],
        transition: {
          duration: IMPACT_DURATION / 1000,
          ease: 'easeInOut'
        }
      }}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        background: '#6a0dad',
        pointerEvents: 'none',
        zIndex: 99
      }}
    />
  </>
)}
```

#### 2.5 Complete Code Example

Your complete `ShadowBoltAnimation.tsx` file should now look like this:

<details>
<summary>Click to expand complete ShadowBoltAnimation.tsx</summary>

```typescript
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { Projectile } from '../Projectile';
import { validateParticleCount } from '../types';

interface ShadowBoltAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}

/**
 * ShadowBoltAnimation - Dark magic projectile attack
 *
 * Phase breakdown (950ms total):
 * - Charge (350ms): Dark purple energy converges around caster
 * - Cast (150ms): Shadow burst from hand
 * - Travel (300ms): Shadowy projectile with trailing wisps
 * - Impact (150ms): Dark explosion with creeping tendrils
 *
 * Visual characteristics:
 * - Primary color: #6a0dad (dark purple)
 * - Secondary color: #1a0033 (shadow black)
 * - Particles: 15 charge, 10 cast, 12 travel, 25 impact
 * - Special effects: Converging particles during charge, wispy trails
 */
export const ShadowBoltAnimation: React.FC<ShadowBoltAnimationProps> = React.memo(({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  const [phase, setPhase] = useState<'charge' | 'cast' | 'travel' | 'impact'>('charge');

  // Phase durations (ms)
  const CHARGE_DURATION = 350;
  const CAST_DURATION = 150;
  const TRAVEL_DURATION = 300;
  const IMPACT_DURATION = 150;

  // Shadow Bolt color palette
  const SHADOW_COLORS = {
    primary: '#6a0dad',     // Dark purple
    secondary: '#1a0033',   // Shadow black
    accent: '#9b30ff'       // Bright purple
  };

  // Phase transition handlers
  const handleChargeComplete = useCallback(() => {
    setPhase('cast');
  }, []);

  const handleCastComplete = useCallback(() => {
    setPhase('travel');
  }, []);

  const handleTravelComplete = useCallback(() => {
    setPhase('impact');
  }, []);

  const handleImpactComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100
      }}
    >
      {/* CHARGE PHASE: Dark energy converging (350ms) */}
      {phase === 'charge' && (
        <>
          {/* Converging shadow particles */}
          {validateParticleCount(15, 'ShadowBoltAnimation', 'charge')}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={15}
            colors={[SHADOW_COLORS.primary, SHADOW_COLORS.secondary, SHADOW_COLORS.accent]}
            spread={-70}
            lifetime={CHARGE_DURATION}
            size={5}
            gravity={0}
            fadeOut={false}
            onComplete={handleChargeComplete}
          />

          {/* Dark energy orb forming */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.7, 0.8],
              scale: [0, 1, 1.1],
              transition: {
                duration: CHARGE_DURATION / 1000,
                ease: 'easeIn'
              }
            }}
            style={{
              position: 'absolute',
              left: casterX - 25,
              top: casterY - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${SHADOW_COLORS.accent}80 0%, ${SHADOW_COLORS.primary}60 40%, transparent 70%)`,
              filter: 'blur(8px)',
              boxShadow: `0 0 20px ${SHADOW_COLORS.primary}`
            }}
          />

          {/* Ominous pulsing aura */}
          <motion.div
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{
              opacity: [0, 0.4, 0.5],
              scale: [1.5, 1.2, 1],
              transition: {
                duration: CHARGE_DURATION / 1000,
                ease: 'easeIn'
              }
            }}
            style={{
              position: 'absolute',
              left: casterX - 40,
              top: casterY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${SHADOW_COLORS.secondary}40 0%, transparent 70%)`,
              filter: 'blur(15px)'
            }}
          />
        </>
      )}

      {/* CAST PHASE: Shadow burst from hand (150ms) */}
      {phase === 'cast' && (
        <>
          {/* Dark energy explosion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.8, 0],
              scale: [0.5, 2, 2.5],
              transition: {
                duration: CAST_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            onAnimationComplete={handleCastComplete}
            style={{
              position: 'absolute',
              left: casterX - 40,
              top: casterY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${SHADOW_COLORS.accent}cc 0%, ${SHADOW_COLORS.primary}80 50%, transparent 80%)`,
              filter: 'blur(10px)'
            }}
          />

          {/* Shadow particle burst */}
          {validateParticleCount(10, 'ShadowBoltAnimation', 'cast')}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={10}
            colors={[SHADOW_COLORS.primary, SHADOW_COLORS.accent]}
            spread={100}
            lifetime={CAST_DURATION}
            size={6}
            gravity={0}
            fadeOut={true}
          />
        </>
      )}

      {/* TRAVEL PHASE: Shadow projectile with wisps (300ms) */}
      {phase === 'travel' && (
        <>
          {/* Main shadow bolt projectile */}
          <Projectile
            startX={casterX}
            startY={casterY}
            endX={targetX}
            endY={targetY}
            color={SHADOW_COLORS.primary}
            size={22}
            duration={TRAVEL_DURATION}
            glowIntensity={1.1}
            onComplete={handleTravelComplete}
          />

          {/* Dark energy core (pulsing) */}
          <motion.div
            initial={{ x: casterX, y: casterY, opacity: 0 }}
            animate={{
              x: targetX,
              y: targetY,
              opacity: [0, 1, 0.8, 1],
              transition: {
                duration: TRAVEL_DURATION / 1000,
                ease: 'linear'
              }
            }}
            style={{
              position: 'absolute',
              width: 18,
              height: 18,
              marginLeft: -9,
              marginTop: -9,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${SHADOW_COLORS.accent} 0%, ${SHADOW_COLORS.primary} 50%, transparent 80%)`,
              boxShadow: `0 0 20px ${SHADOW_COLORS.primary}, 0 0 30px ${SHADOW_COLORS.secondary}`
            }}
          />

          {/* Trailing shadow wisps */}
          <motion.div
            initial={{ x: casterX, y: casterY }}
            animate={{
              x: targetX,
              y: targetY,
              transition: {
                duration: TRAVEL_DURATION / 1000,
                ease: 'linear'
              }
            }}
            style={{
              position: 'absolute',
              width: 0,
              height: 0
            }}
          >
            {validateParticleCount(12, 'ShadowBoltAnimation', 'travel-trail')}
            <ParticleSystem
              originX={0}
              originY={0}
              particleCount={12}
              colors={[SHADOW_COLORS.primary, SHADOW_COLORS.secondary]}
              spread={25}
              lifetime={TRAVEL_DURATION * 0.8}
              size={4}
              gravity={-5}
              fadeOut={true}
            />
          </motion.div>
        </>
      )}

      {/* IMPACT PHASE: Dark explosion with tendrils (150ms) */}
      {phase === 'impact' && (
        <>
          {/* Core shadow explosion */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0.7, 0],
              scale: [0, 1.3, 1.8, 2.2],
              transition: {
                duration: IMPACT_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            onAnimationComplete={handleImpactComplete}
            style={{
              position: 'absolute',
              left: targetX - 50,
              top: targetY - 50,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${SHADOW_COLORS.accent}ff 0%, ${SHADOW_COLORS.primary}cc 40%, ${SHADOW_COLORS.secondary}80 70%, transparent 90%)`,
              filter: 'blur(6px)'
            }}
          />

          {/* Shadow tendrils creeping outward */}
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <motion.div
              key={angle}
              initial={{
                x: targetX,
                y: targetY,
                opacity: 0,
                scaleX: 0
              }}
              animate={{
                x: targetX + Math.cos((angle * Math.PI) / 180) * 45,
                y: targetY + Math.sin((angle * Math.PI) / 180) * 45,
                opacity: [0, 0.8, 0.5, 0],
                scaleX: [0, 1, 0.8, 0],
                transition: {
                  duration: IMPACT_DURATION / 1000,
                  ease: 'easeOut'
                }
              }}
              style={{
                position: 'absolute',
                width: 30,
                height: 4,
                background: `linear-gradient(to right, ${SHADOW_COLORS.primary}, transparent)`,
                transform: `rotate(${angle}deg)`,
                transformOrigin: 'left center',
                filter: 'blur(2px)'
              }}
            />
          ))}

          {/* Dark explosion particles */}
          {validateParticleCount(25, 'ShadowBoltAnimation', 'impact')}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={25}
            colors={[SHADOW_COLORS.primary, SHADOW_COLORS.secondary, SHADOW_COLORS.accent]}
            spread={130}
            lifetime={IMPACT_DURATION}
            size={7}
            gravity={70}
            fadeOut={true}
          />

          {/* Dark mist cloud */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 0.5, 0],
              scale: [0.5, 2, 2.5],
              transition: {
                duration: IMPACT_DURATION / 1000,
                ease: 'easeOut'
              }
            }}
            style={{
              position: 'absolute',
              left: targetX - 60,
              top: targetY - 60,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${SHADOW_COLORS.secondary}50 0%, transparent 70%)`,
              filter: 'blur(15px)'
            }}
          />

          {/* Screen flash effect (subtle purple tint) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.12, 0],
              transition: {
                duration: IMPACT_DURATION / 1000,
                ease: 'easeInOut'
              }
            }}
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              background: SHADOW_COLORS.primary,
              pointerEvents: 'none',
              zIndex: 99
            }}
          />
        </>
      )}
    </div>
  );
});

ShadowBoltAnimation.displayName = 'ShadowBoltAnimation';
```

</details>

---

### Step 3: Add Color Constants (If Needed)

Since Shadow Bolt uses a new element (dark/shadow), let's add proper color constants to `types.ts`.

**Edit `/src/components/combat/animations/types.ts`:**

Find the section with color palettes (around line 164) and add:

```typescript
export const SHADOW_COLORS = {
  primary: '#6a0dad',    // Dark purple
  secondary: '#1a0033',  // Shadow black
  accent: '#9b30ff'      // Bright purple
};
```

**Then update your ShadowBoltAnimation.tsx to import and use it:**

```typescript
import { validateParticleCount, SHADOW_COLORS } from '../types';

// Remove the local SHADOW_COLORS constant and use the imported one
```

**Naming Convention:** Element color constants are uppercase with `_COLORS` suffix:
- `FIRE_COLORS`, `ICE_COLORS`, `LIGHTNING_COLORS`, `SHADOW_COLORS`

---

### Step 4: Register the Animation

Now connect your animation to the spell system.

**Edit `/src/components/combat/animations/animationRegistry.ts`:**

#### 4.1 Import Your Component

Add to the imports section (around line 14):

```typescript
import { ShadowBoltAnimation } from './variants/ShadowBoltAnimation';
```

#### 4.2 Add Registry Entry

Add to the `ATTACK_ANIMATION_MAP` object (around line 58):

```typescript
// Shadow Bolt - Dark magic spell (wizard level 15)
shadow_bolt: {
  element: 'arcane',  // Or create a new 'shadow' element type
  type: 'projectile',
  component: ShadowBoltAnimation,
  description: 'Dark magic projectile with shadow tendrils'
}
```

**Metadata Fields:**
- `element` - Visual theme: 'fire', 'ice', 'lightning', 'holy', 'arcane', 'neutral', 'poison'
- `type` - Animation category: 'projectile', 'beam', 'aoe', 'buff', 'heal', 'debuff', 'physical'
- `component` - Your React component
- `description` - Short description for debugging

---

### Step 5: Test in Isolation

Before integration testing, verify the animation works standalone.

#### 5.1 Visual Test Harness

Create a temporary test file `/src/components/combat/animations/ShadowBoltTest.tsx`:

```typescript
import React, { useState } from 'react';
import { ShadowBoltAnimation } from './variants/ShadowBoltAnimation';

export const ShadowBoltTest: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);

  const handlePlay = () => {
    setIsPlaying(true);
    setPlayCount(prev => prev + 1);
  };

  const handleComplete = () => {
    setIsPlaying(false);
    console.log('✅ Shadow Bolt animation completed!');
  };

  return (
    <div style={{ padding: 20, background: '#1a1a1a', minHeight: '100vh' }}>
      <h2 style={{ color: 'white' }}>Shadow Bolt Animation Test</h2>

      <button onClick={handlePlay} disabled={isPlaying}>
        Play Animation (Count: {playCount})
      </button>

      <div style={{ position: 'relative', width: 600, height: 400, background: '#2a2a2a', marginTop: 20 }}>
        {isPlaying && (
          <ShadowBoltAnimation
            casterX={100}
            casterY={200}
            targetX={500}
            targetY={200}
            onComplete={handleComplete}
          />
        )}

        {/* Visual markers for positions */}
        <div style={{ position: 'absolute', left: 90, top: 190, width: 20, height: 20, background: 'blue', borderRadius: '50%' }}>
          <span style={{ color: 'white', fontSize: 10 }}>Caster</span>
        </div>
        <div style={{ position: 'absolute', left: 490, top: 190, width: 20, height: 20, background: 'red', borderRadius: '50%' }}>
          <span style={{ color: 'white', fontSize: 10 }}>Target</span>
        </div>
      </div>
    </div>
  );
};
```

**Run the test:**
1. Import in your `ReactApp.tsx` temporarily
2. Render `<ShadowBoltTest />` instead of the normal game
3. Click "Play Animation" button
4. Verify all phases play correctly

#### 5.2 Visual Verification Checklist

Watch the animation and check:

- [ ] **Charge phase** - Dark particles converge smoothly
- [ ] **Cast phase** - Shadow burst appears with good timing
- [ ] **Travel phase** - Projectile moves smoothly from caster to target
- [ ] **Impact phase** - Explosion and tendrils appear at target location
- [ ] **Timing** - Total duration feels about 950ms (not too fast/slow)
- [ ] **Colors** - Purple/dark colors match the shadow theme
- [ ] **Particles** - No console warnings about particle counts
- [ ] **Performance** - Animation feels smooth (60fps)
- [ ] **Completion** - `onComplete` callback fires after impact

**Common Issues:**
- Animation too fast/slow → Adjust phase durations
- Colors look wrong → Check color constants and gradients
- Particles missing → Verify ParticleSystem props
- Doesn't complete → Check `onAnimationComplete` handler on last phase

---

### Step 6: Integration Testing

Now test through the actual combat system.

#### 6.1 Add Spell Data

**Edit `/public/data/spells.js`:**

Add to the `spells` object (around line 50):

```javascript
shadow_bolt: {
    name: "Shadow Bolt",
    description: "Launch dark energy at a single enemy.",
    type: "offensive",
    element: "dark",
    mpCost: 8,
    power: 45,
    target: "single_enemy",
    castTime: 1.0,
    cooldown: 0,
    learnLevel: 15,
    availableClasses: ["wizard"],
    effects: [
        {
            type: "damage",
            element: "dark",
            power: 45,
            scaling: "magicAttack",
            scalingMultiplier: 1.2
        }
    ],
    animation: "shadow_bolt"  // ⚠️ Must match registry key EXACTLY
}
```

**Critical:** The `animation: "shadow_bolt"` field MUST match your registry key in `animationRegistry.ts`.

#### 6.2 Test Through Combat

1. **Start the game** - `npm run dev`
2. **Create a new character** - Choose Wizard class
3. **Level up to 15** (or modify `learnLevel: 1` temporarily for testing)
4. **Enter combat** - Find an enemy
5. **Cast Shadow Bolt** - Select the spell from the spell menu
6. **Verify the animation plays** during combat

**Combat Integration Checklist:**

- [ ] Spell appears in spell menu when learned
- [ ] Spell costs correct MP (8 MP)
- [ ] Animation triggers when spell is cast
- [ ] Animation completes before combat continues
- [ ] Damage is applied after animation
- [ ] Enemy HP bar updates correctly
- [ ] No console errors during animation
- [ ] Can cast spell multiple times in a row

---

### Step 7: Performance Validation

Use Chrome DevTools to verify 60fps performance.

#### 7.1 Open DevTools Performance Panel

1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Click **Record** button (⚫)
4. Cast Shadow Bolt in combat
5. Stop recording
6. Analyze the flame chart

#### 7.2 Check for 60fps

Look for:
- **Green FPS graph** should stay at 60fps (no dips)
- **GPU activity** (green bars) should be consistent
- **Main thread** (yellow) should not be blocked
- **Scripting time** should be minimal (<16ms per frame)

**Warning Signs:**
- Red dips in FPS graph → Performance issue
- Long yellow bars → JavaScript blocking rendering
- Purple bars → Layout thrashing (not using GPU properties)

#### 7.3 Verify GPU-Only Properties

Check that you're only animating `transform` and `opacity`:

```typescript
// ✅ GOOD - GPU accelerated
animate={{
  scale: [0, 1.5],      // Uses transform: scale()
  opacity: [0, 1],      // GPU composited
  x: [0, 100],          // Uses transform: translateX()
  y: [0, 100],          // Uses transform: translateY()
  rotate: [0, 180]      // Uses transform: rotate()
}}

// ❌ BAD - Triggers layout/paint
animate={{
  width: [100, 200],         // Triggers layout
  height: [100, 200],        // Triggers layout
  backgroundColor: '#fff',   // Triggers paint
  borderRadius: [0, 50]      // Triggers paint
}}
```

#### 7.4 Validate Particle Counts

Check the console for particle validation messages:

```
✅ Expected (no warnings):
   (No particle messages, or only informational logs)

❌ Warning:
   ⚠️ [ShadowBoltAnimation - impact] Particle count (32) exceeds recommended max (20)

❌ Error:
   🚨 [ShadowBoltAnimation - impact] Particle count (45) EXCEEDS maximum (30)
```

If you see warnings/errors, reduce particle counts in your component.

#### 7.5 Run Extended Performance Test

Cast Shadow Bolt 10 times in a row and verify:
- [ ] FPS stays consistent at 60fps
- [ ] No memory leaks (check Memory tab)
- [ ] No accumulating DOM nodes
- [ ] Animation cleanup happens properly
- [ ] No "janky" frames or stuttering

---

## Code Templates and Patterns

Here are copy-paste templates for common animation patterns.

### Template 1: Projectile Spell (Single Target)

Use for: Magic missile, arrow, thrown weapon

```typescript
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { Projectile } from '../Projectile';
import { validateParticleCount } from '../types';

interface YourSpellAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}

export const YourSpellAnimation: React.FC<YourSpellAnimationProps> = React.memo(({
  casterX, casterY, targetX, targetY, onComplete
}) => {
  const [phase, setPhase] = useState<'charge' | 'cast' | 'travel' | 'impact'>('charge');

  // TODO: Adjust durations for your spell's weight
  const CHARGE_DURATION = 350;
  const CAST_DURATION = 150;
  const TRAVEL_DURATION = 300;
  const IMPACT_DURATION = 150;

  // TODO: Define your color palette
  const COLORS = {
    primary: '#yourColor',
    secondary: '#yourColor',
    accent: '#yourColor'
  };

  const handleChargeComplete = useCallback(() => setPhase('cast'), []);
  const handleCastComplete = useCallback(() => setPhase('travel'), []);
  const handleTravelComplete = useCallback(() => setPhase('impact'), []);
  const handleImpactComplete = useCallback(() => onComplete?.(), [onComplete]);

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>

      {/* CHARGE PHASE */}
      {phase === 'charge' && (
        <>
          {validateParticleCount(15, 'YourSpellAnimation', 'charge')}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={15}
            colors={[COLORS.primary, COLORS.secondary]}
            spread={60}
            lifetime={CHARGE_DURATION}
            size={5}
            gravity={0}
            onComplete={handleChargeComplete}
          />
          {/* TODO: Add charge glow effect */}
        </>
      )}

      {/* CAST PHASE */}
      {phase === 'cast' && (
        <>
          {/* TODO: Add cast burst effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: CAST_DURATION / 1000 }}
            onAnimationComplete={handleCastComplete}
            style={{ /* TODO: Style cast flash */ }}
          />
        </>
      )}

      {/* TRAVEL PHASE */}
      {phase === 'travel' && (
        <>
          <Projectile
            startX={casterX}
            startY={casterY}
            endX={targetX}
            endY={targetY}
            color={COLORS.primary}
            size={20}
            duration={TRAVEL_DURATION}
            onComplete={handleTravelComplete}
          />
          {/* TODO: Add projectile trail particles */}
        </>
      )}

      {/* IMPACT PHASE */}
      {phase === 'impact' && (
        <>
          {validateParticleCount(25, 'YourSpellAnimation', 'impact')}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={25}
            colors={[COLORS.primary, COLORS.accent]}
            spread={130}
            lifetime={IMPACT_DURATION}
            size={7}
            gravity={80}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 2, 2.5] }}
            transition={{ duration: IMPACT_DURATION / 1000 }}
            onAnimationComplete={handleImpactComplete}
            style={{
              position: 'absolute',
              left: targetX - 50,
              top: targetY - 50,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${COLORS.accent}, ${COLORS.primary}, transparent)`,
              filter: 'blur(8px)'
            }}
          />
        </>
      )}
    </div>
  );
});

YourSpellAnimation.displayName = 'YourSpellAnimation';
```

### Template 2: AOE Spell (Area of Effect)

Use for: Meteor, earthquake, ring of fire

```typescript
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { validateParticleCount } from '../types';

interface AoeSpellAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}

export const AoeSpellAnimation: React.FC<AoeSpellAnimationProps> = React.memo(({
  casterX, casterY, targetX, targetY, onComplete
}) => {
  const [phase, setPhase] = useState<'charge' | 'warning' | 'impact' | 'aftermath'>('charge');

  const CHARGE_DURATION = 600;   // AOE spells have longer charge
  const WARNING_DURATION = 400;  // Show where AOE will hit
  const IMPACT_DURATION = 300;
  const AFTERMATH_DURATION = 200;

  // TODO: Define colors
  const COLORS = { primary: '#yourColor', secondary: '#yourColor', accent: '#yourColor' };

  // TODO: Define AOE impact zones
  const impactZones = [
    { x: targetX, y: targetY },
    { x: targetX + 60, y: targetY + 30 },
    { x: targetX - 60, y: targetY + 30 }
  ];

  const handleChargeComplete = useCallback(() => setPhase('warning'), []);
  const handleWarningComplete = useCallback(() => setPhase('impact'), []);
  const handleImpactComplete = useCallback(() => setPhase('aftermath'), []);
  const handleAftermathComplete = useCallback(() => onComplete?.(), [onComplete]);

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>

      {/* CHARGE PHASE - Energy gathering */}
      {phase === 'charge' && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.7], scale: [0, 1.5] }}
            transition={{ duration: CHARGE_DURATION / 1000, ease: 'easeIn' }}
            onAnimationComplete={handleChargeComplete}
            style={{
              position: 'absolute',
              left: casterX - 40,
              top: casterY - 80,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${COLORS.accent}, transparent)`,
              filter: 'blur(20px)'
            }}
          />
        </>
      )}

      {/* WARNING PHASE - Show impact zones */}
      {phase === 'warning' && (
        <>
          {impactZones.map((zone, index) => (
            <React.Fragment key={index}>
              {/* Shadow indicator */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0.7], scale: [0, 1] }}
                transition={{ duration: WARNING_DURATION / 1000, delay: index * 0.08 }}
                onAnimationComplete={index === impactZones.length - 1 ? handleWarningComplete : undefined}
                style={{
                  position: 'absolute',
                  left: zone.x - 40,
                  top: zone.y - 20,
                  width: 80,
                  height: 40,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.7), transparent)',
                  border: `2px dashed ${COLORS.primary}`
                }}
              />
              {/* Pulsing warning ring */}
              <motion.div
                animate={{ opacity: [0, 0.6, 0.4, 0.6], scale: [0.5, 1.2, 1, 1.3] }}
                transition={{ duration: WARNING_DURATION / 1000, delay: index * 0.08 }}
                style={{
                  position: 'absolute',
                  left: zone.x - 45,
                  top: zone.y - 45,
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  border: `2px solid ${COLORS.primary}`,
                  boxShadow: `0 0 15px ${COLORS.primary}`
                }}
              />
            </React.Fragment>
          ))}
        </>
      )}

      {/* IMPACT PHASE - Explosions */}
      {phase === 'impact' && (
        <>
          {impactZones.map((zone, index) => (
            <React.Fragment key={index}>
              {validateParticleCount(20, 'AoeSpellAnimation', `impact-${index}`)}
              <ParticleSystem
                originX={zone.x}
                originY={zone.y}
                particleCount={20}
                colors={[COLORS.primary, COLORS.accent]}
                spread={120}
                lifetime={IMPACT_DURATION}
                size={6}
                gravity={60}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], scale: [0, 2, 3] }}
                transition={{ duration: IMPACT_DURATION / 1000, delay: index * 0.05 }}
                onAnimationComplete={index === impactZones.length - 1 ? handleImpactComplete : undefined}
                style={{
                  position: 'absolute',
                  left: zone.x - 60,
                  top: zone.y - 60,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${COLORS.accent}, ${COLORS.primary}, transparent)`,
                  filter: 'blur(10px)'
                }}
              />
            </React.Fragment>
          ))}
        </>
      )}

      {/* AFTERMATH PHASE - Dust/smoke */}
      {phase === 'aftermath' && (
        <>
          {impactZones.map((zone, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 0.5, 0],
                scale: [0.5, 2, 2.5],
                y: [-20, -60, -80]
              }}
              transition={{ duration: AFTERMATH_DURATION / 1000 }}
              onAnimationComplete={index === impactZones.length - 1 ? handleAftermathComplete : undefined}
              style={{
                position: 'absolute',
                left: zone.x - 50,
                top: zone.y - 50,
                width: 100,
                height: 100,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(100,100,100,0.6), transparent)',
                filter: 'blur(15px)'
              }}
            />
          ))}
        </>
      )}
    </div>
  );
});

AoeSpellAnimation.displayName = 'AoeSpellAnimation';
```

### Template 3: Buff/Debuff Animation (Target Enhancement)

Use for: Protect, Shell, Haste, Poison

```typescript
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { validateParticleCount } from '../types';

interface BuffAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}

export const BuffAnimation: React.FC<BuffAnimationProps> = React.memo(({
  casterX, casterY, targetX, targetY, onComplete
}) => {
  const [phase, setPhase] = useState<'cast' | 'travel' | 'apply'>('cast');

  const CAST_DURATION = 300;
  const TRAVEL_DURATION = 400;
  const APPLY_DURATION = 500;

  // TODO: Define buff colors (usually bright, positive colors)
  const COLORS = { primary: '#yourColor', secondary: '#yourColor', accent: '#yourColor' };

  const handleCastComplete = useCallback(() => setPhase('travel'), []);
  const handleTravelComplete = useCallback(() => setPhase('apply'), []);
  const handleApplyComplete = useCallback(() => onComplete?.(), [onComplete]);

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>

      {/* CAST PHASE - Caster channels buff */}
      {phase === 'cast' && (
        <>
          {validateParticleCount(12, 'BuffAnimation', 'cast')}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={12}
            colors={[COLORS.primary, COLORS.accent]}
            spread={50}
            lifetime={CAST_DURATION}
            size={5}
            gravity={-20}  // Float upward
            onComplete={handleCastComplete}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 0.8], scale: [0, 1.2] }}
            transition={{ duration: CAST_DURATION / 1000 }}
            style={{
              position: 'absolute',
              left: casterX - 30,
              top: casterY - 30,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${COLORS.accent}, transparent)`,
              filter: 'blur(10px)'
            }}
          />
        </>
      )}

      {/* TRAVEL PHASE - Energy travels to target */}
      {phase === 'travel' && (
        <>
          <motion.div
            initial={{ x: casterX, y: casterY, opacity: 0 }}
            animate={{
              x: targetX,
              y: targetY,
              opacity: [0, 1, 1],
              transition: {
                duration: TRAVEL_DURATION / 1000,
                ease: 'easeInOut'
              }
            }}
            onAnimationComplete={handleTravelComplete}
            style={{
              position: 'absolute',
              width: 20,
              height: 20,
              marginLeft: -10,
              marginTop: -10,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${COLORS.accent}, ${COLORS.primary})`,
              boxShadow: `0 0 20px ${COLORS.primary}`
            }}
          />
        </>
      )}

      {/* APPLY PHASE - Buff aura appears on target */}
      {phase === 'apply' && (
        <>
          {/* Buff aura ring (pulses continuously during APPLY_DURATION) */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0.6, 0.8, 0],
              scale: [0, 1, 1.1, 1.2, 1.3],
              rotate: [0, 90, 180, 270, 360]
            }}
            transition={{ duration: APPLY_DURATION / 1000, ease: 'easeOut' }}
            onAnimationComplete={handleApplyComplete}
            style={{
              position: 'absolute',
              left: targetX - 50,
              top: targetY - 50,
              width: 100,
              height: 100,
              borderRadius: '50%',
              border: `3px solid ${COLORS.primary}`,
              boxShadow: `0 0 20px ${COLORS.primary}, inset 0 0 20px ${COLORS.accent}`,
              background: `radial-gradient(circle, transparent 60%, ${COLORS.primary}40 80%, transparent)`
            }}
          />

          {/* Rising buff particles */}
          {validateParticleCount(15, 'BuffAnimation', 'apply')}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={15}
            colors={[COLORS.primary, COLORS.accent]}
            spread={60}
            lifetime={APPLY_DURATION}
            size={4}
            gravity={-30}  // Float upward around target
          />

          {/* Shimmer effect */}
          <motion.div
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.8, 1.3, 1.5]
            }}
            transition={{
              duration: APPLY_DURATION / 1000,
              ease: 'easeOut'
            }}
            style={{
              position: 'absolute',
              left: targetX - 40,
              top: targetY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${COLORS.accent}60, transparent)`,
              filter: 'blur(12px)'
            }}
          />
        </>
      )}
    </div>
  );
});

BuffAnimation.displayName = 'BuffAnimation';
```

---

## Common Patterns and Shortcuts

### Reusing Core Components

The animation system provides reusable components. Use them instead of reimplementing:

#### ParticleSystem

```typescript
import { ParticleSystem } from '../core/ParticleSystem';

// Creates an animated particle burst
<ParticleSystem
  originX={x}              // Center X position
  originY={y}              // Center Y position
  particleCount={20}       // Number of particles (max 30)
  colors={['#fff', '#f00']} // Array of colors (randomly assigned)
  spread={100}             // Spread radius (negative = converge inward)
  lifetime={300}           // Duration in ms
  size={6}                 // Particle diameter in px
  gravity={50}             // Gravity (positive = fall, negative = rise, 0 = float)
  fadeOut={true}           // Fade opacity over lifetime
  onComplete={callback}    // Called when particles finish
/>
```

**Common Patterns:**
- **Converging energy:** `spread={-70}`, `gravity={0}` - Particles move inward
- **Explosion burst:** `spread={130}`, `gravity={80}` - Particles scatter and fall
- **Rising magic:** `spread={50}`, `gravity={-30}` - Particles drift upward
- **Floating ambient:** `spread={40}`, `gravity={0}` - Particles hover in place

#### Projectile

```typescript
import { Projectile } from '../Projectile';

// Creates a glowing projectile that travels from start to end
<Projectile
  startX={casterX}
  startY={casterY}
  endX={targetX}
  endY={targetY}
  color={'#8b5cf6'}       // Main projectile color
  size={20}               // Diameter in px
  duration={300}          // Travel time in ms
  glowIntensity={1.0}     // Glow strength (0.5-2.0)
  onComplete={callback}
/>
```

**Tip:** Add a custom visual on top of Projectile for unique looks (see Shadow Bolt example).

### Color Palette Patterns

#### Picking Complementary Colors

Use this process to choose harmonious colors:

1. **Pick primary color** - Main spell identity (e.g., `#6a0dad` purple for shadow)
2. **Darken for secondary** - 40-50% darker (e.g., `#1a0033` for shadows/depth)
3. **Lighten for accent** - 30-40% lighter (e.g., `#9b30ff` for highlights)

**Online tools:**
- [Coolors.co](https://coolors.co) - Generate palettes
- [Adobe Color](https://color.adobe.com) - Color wheel with complementary colors

#### Element Color Conventions

Follow these conventions for readability:

| Element | Primary Hue | Examples |
|---------|-------------|----------|
| **Fire** | Red/Orange | `#ff6b35`, `#ff4444`, `#ffaa00` |
| **Ice** | Blue/Cyan | `#4da6ff`, `#b3e0ff`, `#e0f7ff` |
| **Lightning** | Yellow/White | `#ffeb3b`, `#fff176`, `#ffffcc` |
| **Holy** | Gold/White | `#ffd700`, `#ffffcc`, `#ffee88` |
| **Arcane** | Purple | `#9c27b0`, `#ba68c8`, `#4a148c` |
| **Poison** | Green | `#8bc34a`, `#33691e`, `#7b1fa2` |
| **Shadow** | Dark Purple | `#6a0dad`, `#1a0033`, `#9b30ff` |

### Timing Shortcuts

Use these duration constants for consistency:

```typescript
// From types.ts
import { FAST_ATTACK_DURATION, MEDIUM_ATTACK_DURATION, HEAVY_ATTACK_DURATION } from '../types';

// Light attacks (dagger, quick spells)
const TOTAL = FAST_ATTACK_DURATION;  // 600ms

// Medium attacks (sword, standard spells)
const TOTAL = MEDIUM_ATTACK_DURATION;  // 900ms

// Heavy attacks (axe, powerful spells)
const TOTAL = HEAVY_ATTACK_DURATION;  // 1400ms
```

**Phase Ratio Guideline (Medium Attack - 900ms):**
- Charge: 35-40% → 315-360ms
- Cast: 15-20% → 135-180ms
- Travel: 30-35% → 270-315ms
- Impact: 15-20% → 135-180ms

### Particle Effect Recipes

Common particle configurations that work well:

#### Recipe 1: Explosive Impact
```typescript
<ParticleSystem
  particleCount={25}
  spread={140}
  gravity={80}
  size={7}
  lifetime={150}
/>
```
**Use for:** Fireball, explosion, meteor impact

#### Recipe 2: Magical Convergence
```typescript
<ParticleSystem
  particleCount={15}
  spread={-70}  // Negative!
  gravity={0}
  size={5}
  lifetime={350}
  fadeOut={false}
/>
```
**Use for:** Charge phases, energy gathering

#### Recipe 3: Rising Sparkles
```typescript
<ParticleSystem
  particleCount={12}
  spread={50}
  gravity={-30}  // Negative = rise
  size={4}
  lifetime={400}
/>
```
**Use for:** Healing, buff application, holy magic

#### Recipe 4: Trailing Wisps
```typescript
<ParticleSystem
  particleCount={10}
  spread={25}
  gravity={-5}
  size={4}
  lifetime={240}  // 80% of travel duration
/>
```
**Use for:** Projectile trails, comet tails

---

## Testing Checklist

### Pre-Integration Checklist

Before connecting to the combat system, verify:

#### Visual Quality
- [ ] All phases (charge, cast, travel, impact) render correctly
- [ ] Colors match your chosen palette
- [ ] Particle counts are within limits (≤30 per effect)
- [ ] Animation feels smooth (no stuttering)
- [ ] Timing feels appropriate for attack weight
- [ ] Visual effects don't obscure HP bars or character sprites

#### Technical Quality
- [ ] Component is wrapped in `React.memo()`
- [ ] All phase handlers use `useCallback()`
- [ ] `validateParticleCount()` is called before each ParticleSystem
- [ ] `onComplete` callback fires after final phase
- [ ] TypeScript compiles without errors
- [ ] No console errors when animation plays

#### Code Quality
- [ ] Component has JSDoc comment with phase breakdown
- [ ] Color constants are defined (imported from types.ts or local)
- [ ] Phase durations are documented with comments
- [ ] Variable names are clear and descriptive
- [ ] Code follows existing animation component patterns

### Integration Checklist

After adding to combat system:

#### Spell Data
- [ ] Spell added to `/public/data/spells.js`
- [ ] `animation` field matches registry key EXACTLY
- [ ] Spell has correct `mpCost`, `power`, `target`, `learnLevel`
- [ ] Spell appears in correct class's spell list

#### Animation Registry
- [ ] Animation imported in `animationRegistry.ts`
- [ ] Entry added to `ATTACK_ANIMATION_MAP` with correct key
- [ ] Metadata fields filled: `element`, `type`, `component`, `description`
- [ ] Registry key matches spell data's `animation` field

#### Combat Flow
- [ ] Spell appears in spell menu when learned
- [ ] Clicking spell triggers animation
- [ ] Animation completes before combat continues
- [ ] Damage is applied after animation finishes
- [ ] Enemy HP bar updates correctly
- [ ] Can cast spell multiple times without errors

#### Edge Cases
- [ ] Animation works if caster = target (self-buff)
- [ ] Animation works with different caster/target positions
- [ ] Animation handles rapid casting (spam clicking)
- [ ] Animation cleanup happens if combat ends mid-animation
- [ ] No memory leaks after 10+ casts

### Performance Checklist

Use Chrome DevTools to verify:

#### Frame Rate (60fps Target)
- [ ] Open DevTools → Performance tab
- [ ] Record during animation playback
- [ ] FPS graph stays green (60fps)
- [ ] No red dips or stuttering
- [ ] Main thread (yellow bars) not blocked

#### GPU Acceleration
- [ ] Only `transform` and `opacity` properties are animated
- [ ] No `width`, `height`, `left`, `top`, `background-color` animations
- [ ] motion.div uses `x`, `y`, `scale`, `rotate`, `opacity` only
- [ ] GPU activity (green bars) is consistent

#### Particle Validation
- [ ] No console warnings about particle counts
- [ ] No errors about exceeding 30-particle maximum
- [ ] Particle counts logged correctly in dev mode
- [ ] Total on-screen particles ≤60 (for multi-effect spells)

#### Memory Management
- [ ] Open DevTools → Memory tab
- [ ] Take heap snapshot before casting
- [ ] Cast spell 10 times
- [ ] Take heap snapshot after
- [ ] Compare snapshots - no significant growth
- [ ] No detached DOM nodes accumulating

#### Extended Performance Test
- [ ] Cast animation 20 times in a row
- [ ] FPS stays at 60fps throughout
- [ ] No progressive slowdown
- [ ] No browser freezing or "janky" frames
- [ ] Mobile browser performance acceptable (test on device)

### Final Validation Checklist

Before committing your animation:

#### Documentation
- [ ] JSDoc comment at top of component is complete
- [ ] Phase breakdown includes durations
- [ ] Color palette is documented
- [ ] Particle counts are noted

#### Code Standards
- [ ] Follows project TypeScript conventions
- [ ] Imports are organized (React, motion, components, types)
- [ ] No unused imports or variables
- [ ] ESLint passes (`npm run lint`)
- [ ] Prettier formatted (`npm run format`)

#### Testing
- [ ] Tested in isolation (test harness)
- [ ] Tested in combat (full integration)
- [ ] Tested on different enemies
- [ ] Tested with different character positions
- [ ] Performance validated (60fps confirmed)

#### Peer Review
- [ ] Animation matches spell's thematic identity
- [ ] Timing feels satisfying (not too fast/slow)
- [ ] Visual clarity maintained (readable combat)
- [ ] Fits cohesively with existing animations
- [ ] No performance regressions introduced

---

## Troubleshooting

### Animation Doesn't Appear

**Symptom:** No animation plays when spell is cast in combat.

**Causes & Fixes:**

1. **Registry key mismatch**
   ```javascript
   // ❌ WRONG - keys don't match
   // spells.js
   animation: "shadowbolt"

   // animationRegistry.ts
   shadow_bolt: { ... }

   // ✅ FIX - keys must match EXACTLY
   animation: "shadow_bolt"
   shadow_bolt: { ... }
   ```

2. **Component not imported**
   ```typescript
   // ❌ WRONG - forgot to import
   export const ATTACK_ANIMATION_MAP = {
     shadow_bolt: { component: ShadowBoltAnimation } // ❌ ShadowBoltAnimation is undefined
   }

   // ✅ FIX - add import at top
   import { ShadowBoltAnimation } from './variants/ShadowBoltAnimation';
   ```

3. **Animation controller not receiving spell ID**
   - Check console for: `[AnimationController] No animation found for: undefined`
   - Verify spell data has `animation` field
   - Check Combat.tsx passes spell ID correctly

4. **Component returns null**
   - Check initial phase state is set correctly
   - Verify phase rendering conditions (phase === 'charge' etc.)

### Animation Stutters/Lags

**Symptom:** Animation plays but looks choppy or drops frames.

**Causes & Fixes:**

1. **Too many particles**
   ```typescript
   // ❌ WRONG - 50 particles drops FPS
   <ParticleSystem particleCount={50} />

   // ✅ FIX - reduce to 25
   <ParticleSystem particleCount={25} />
   ```

2. **Using layout-triggering properties**
   ```typescript
   // ❌ WRONG - triggers layout recalculation
   animate={{
     width: [100, 200],
     height: [100, 200]
   }}

   // ✅ FIX - use transform instead
   animate={{
     scale: [1, 2]
   }}
   ```

3. **Too many simultaneous effects**
   - Limit to 3-5 simultaneous motion.divs per phase
   - Stagger particle systems with slight delays
   - Reduce particle counts if multiple systems active

4. **Heavy blur filters**
   ```typescript
   // ❌ WRONG - blur(50px) is expensive
   filter: 'blur(50px)'

   // ✅ FIX - reduce blur radius
   filter: 'blur(12px)'
   ```

**Debug Steps:**
1. Open Chrome DevTools → Performance
2. Record animation
3. Look for long yellow bars (scripting) or purple bars (layout)
4. Reduce particle counts or simplify effects

### Colors Look Wrong

**Symptom:** Colors appear different than expected or don't match design.

**Causes & Fixes:**

1. **Wrong color format**
   ```typescript
   // ❌ WRONG - RGB not supported by all properties
   background: 'rgb(106, 13, 173)'

   // ✅ FIX - use hex
   background: '#6a0dad'
   ```

2. **Opacity in wrong place**
   ```typescript
   // ❌ WRONG - opacity in color prevents blending
   background: '#6a0dadcc'  // cc = 80% opacity

   // ✅ FIX - use separate opacity
   background: '#6a0dad'
   style={{ opacity: 0.8 }}
   ```

3. **Gradient color stops incorrect**
   ```typescript
   // ❌ WRONG - stops too close together
   background: 'radial-gradient(circle, #6a0dad 0%, #9b30ff 5%, transparent 10%)'

   // ✅ FIX - spread out stops
   background: 'radial-gradient(circle, #6a0dad 0%, #9b30ff 40%, transparent 80%)'
   ```

4. **Filter affecting colors**
   - `blur()` can lighten colors
   - `brightness()` changes perceived color
   - Try reducing filter intensity

**Debug Steps:**
1. Inspect element in DevTools
2. Check computed styles
3. Temporarily remove filters to see base color
4. Adjust gradient stops or opacity

### Timing Feels Off

**Symptom:** Animation too fast, too slow, or phases don't flow well.

**Causes & Fixes:**

1. **Total duration wrong for attack weight**
   ```typescript
   // ❌ WRONG - 2000ms for a basic spell is too slow
   const TOTAL = 2000;

   // ✅ FIX - use medium attack duration
   const TOTAL = 900;
   ```

2. **Phase ratios unbalanced**
   ```typescript
   // ❌ WRONG - impact is half the animation
   CHARGE: 200ms
   CAST: 100ms
   TRAVEL: 200ms
   IMPACT: 500ms  // ❌ Too long!

   // ✅ FIX - impact should be shortest
   CHARGE: 350ms
   CAST: 150ms
   TRAVEL: 300ms
   IMPACT: 150ms  // ✅ Fast and snappy
   ```

3. **Wrong easing**
   ```typescript
   // ❌ WRONG - ease-in for explosion feels sluggish
   animate={{ scale: [0, 2] }}
   transition={{ ease: 'easeIn' }}

   // ✅ FIX - use ease-out for explosive motion
   transition={{ ease: 'easeOut' }}
   ```

4. **Missing delays**
   - Add 30-50ms delays between sequential effects
   - Stagger impact zones in AOE spells
   - Don't start all effects simultaneously

**Adjustment Strategy:**
1. Start with timing-guidelines.md recommendations
2. Playtest in combat
3. Adjust in 50ms increments
4. Compare to similar spells (Fireball, Ice Shard)

### Registry Errors

**Symptom:** Console errors about missing animations or "component is not a function."

**Causes & Fixes:**

1. **Import/export mismatch**
   ```typescript
   // ❌ WRONG - default export but named import
   // ShadowBoltAnimation.tsx
   export default ShadowBoltAnimation;

   // animationRegistry.ts
   import { ShadowBoltAnimation } from './variants/ShadowBoltAnimation';  // ❌ Undefined!

   // ✅ FIX - match export style
   export const ShadowBoltAnimation = ...  // Named export
   import { ShadowBoltAnimation } from ...  // Named import
   ```

2. **Circular dependency**
   - Don't import animationRegistry.ts in animation components
   - Only import types.ts and core components
   - Registry imports components, not vice versa

3. **Missing metadata fields**
   ```typescript
   // ❌ WRONG - missing required fields
   shadow_bolt: {
     component: ShadowBoltAnimation
   }

   // ✅ FIX - include all metadata
   shadow_bolt: {
     element: 'arcane',
     type: 'projectile',
     component: ShadowBoltAnimation,
     description: 'Dark magic projectile'
   }
   ```

4. **Type errors**
   - Ensure component accepts `AnimationComponentProps` interface
   - Check TypeScript compilation: `npm run build`
   - Fix any type mismatches

### Animation Doesn't Complete

**Symptom:** Animation starts but never calls `onComplete`, combat hangs.

**Causes & Fixes:**

1. **Missing onAnimationComplete handler**
   ```typescript
   // ❌ WRONG - last phase never calls complete
   {phase === 'impact' && (
     <motion.div animate={{ opacity: [0, 1, 0] }} />
     // ❌ No onAnimationComplete!
   )}

   // ✅ FIX - add handler to final visual element
   {phase === 'impact' && (
     <motion.div
       animate={{ opacity: [0, 1, 0] }}
       onAnimationComplete={handleImpactComplete}  // ✅
     />
   )}
   ```

2. **Handler on wrong element**
   - Put `onAnimationComplete` on element with longest duration
   - If multiple elements, pick the primary visual effect
   - Particle `onComplete` only fires if it's the only element

3. **Infinite animation**
   ```typescript
   // ❌ WRONG - infinite loop, never completes
   transition={{ repeat: Infinity }}

   // ✅ FIX - remove repeat in final phase
   transition={{ duration: 0.15 }}
   ```

4. **Wrong callback**
   ```typescript
   // ❌ WRONG - calling wrong phase handler
   onAnimationComplete={handleChargeComplete}  // Should be handleImpactComplete

   // ✅ FIX - use correct handler
   onAnimationComplete={handleImpactComplete}
   ```

**Debug Steps:**
1. Add console.log to each phase handler
2. Watch console to see which phase is stuck
3. Check that phase's onAnimationComplete handler
4. Verify handler calls setPhase or onComplete

---

## Best Practices Recap

### Do's ✅

1. **Follow the animation principles:**
   - Anticipation → Impact → Follow-through
   - See [design-principles.md](./design-principles.md)

2. **Use timing guidelines:**
   - Light: 600-900ms
   - Medium: 900-1200ms
   - Heavy: 1200-1500ms
   - See [timing-guidelines.md](./timing-guidelines.md)

3. **Validate particle counts:**
   ```typescript
   {validateParticleCount(25, 'YourAnimation', 'impact')}
   <ParticleSystem particleCount={25} />
   ```

4. **Use GPU-accelerated properties:**
   - `transform` (scale, translateX/Y, rotate)
   - `opacity`
   - Never `width`, `height`, `left`, `top`, `background-color`

5. **Reuse core components:**
   - `<ParticleSystem />` for particle effects
   - `<Projectile />` for traveling projectiles
   - Import from `../core/` and `../Projectile`

6. **Document your animation:**
   - JSDoc comment with phase breakdown
   - Inline comments for complex logic
   - Color palette documented

7. **Test thoroughly:**
   - Isolation test first (test harness)
   - Integration test in combat
   - Performance test with DevTools
   - Edge case testing (self-buff, rapid casting)

### Don'ts ❌

1. **Don't exceed particle limits:**
   - Max 30 particles per effect
   - Max 60 simultaneous on screen

2. **Don't obscure critical UI:**
   - Keep HP bars visible (top 200px clear)
   - Keep character sprites visible (±50px zones)

3. **Don't use layout-triggering properties:**
   - No `width`, `height` animation
   - No `left`, `top` animation
   - Use `transform` equivalents

4. **Don't make animations too long:**
   - 1500ms absolute maximum
   - Players get impatient > 1 second

5. **Don't skip performance testing:**
   - Always profile with DevTools
   - Test on lower-end hardware if possible
   - Check memory usage (Memory tab)

6. **Don't forget cleanup:**
   - Wrap component in `React.memo()`
   - Use `useCallback()` for handlers
   - Let Framer Motion handle unmounting

7. **Don't ignore existing patterns:**
   - Study Fireball, Ice Shard, Lightning
   - Follow established timing ratios
   - Use predefined color palettes

### Performance Tips

1. **Optimize particle generation:**
   - Fewer particles at 60fps > more particles at 30fps
   - Use larger particles instead of more particles
   - Stagger particle systems to spread load

2. **Minimize simultaneous motion:**
   - Limit to 3-5 motion.divs per phase
   - Stagger effects with delays
   - Reuse elements across phases if possible

3. **Use efficient gradients:**
   - Radial gradients more efficient than complex CSS
   - Limit to 3-4 color stops
   - Prefer CSS gradients over images

4. **Batch DOM updates:**
   - Change phase state once per transition
   - Don't update state in animation loops
   - Let Framer Motion batch property changes

### Code Organization Tips

1. **File structure:**
   ```
   /variants/
     YourSpellAnimation.tsx      ← Your animation
     FireballAnimation.tsx       ← Reference examples
     IceShardAnimation.tsx
   ```

2. **Component structure:**
   - Imports first (React, motion, components, types)
   - Interface definition
   - JSDoc comment
   - Component with memo()
   - State and constants
   - Handlers
   - Render (phases in order: charge → cast → travel → impact)
   - displayName export

3. **Naming conventions:**
   - Component: `PascalCase` + `Animation` suffix
   - Props interface: Component name + `Props`
   - Constants: `UPPER_SNAKE_CASE`
   - Handlers: `handlePhaseComplete` pattern

### When to Ask for Help

Ask for assistance if:

- **Animation performance < 60fps** after optimization attempts
- **Visual design unclear** - need direction on spell identity
- **Complex timing requirements** - unusual spell mechanics
- **Registry/integration issues** - errors you can't debug
- **Accessibility concerns** - motion sensitivity considerations
- **Advanced effects needed** - beyond current component capabilities

**Where to ask:**
- Check existing animation source code for patterns
- Review [design-principles.md](./design-principles.md) and [timing-guidelines.md](./timing-guidelines.md)
- Search for similar spells in the codebase
- Create a GitHub issue with minimal reproduction case

---

## Summary

You've now learned how to:

1. **Plan an animation** - concept, timing, colors, particles
2. **Create the component** - phases, handlers, Framer Motion
3. **Add color constants** - naming, palettes, imports
4. **Register the animation** - registry mapping, metadata
5. **Test in isolation** - test harness, visual verification
6. **Integrate with combat** - spell data, end-to-end testing
7. **Validate performance** - DevTools, FPS, GPU properties

**Next Steps:**

- Create your first animation using the Shadow Bolt tutorial
- Experiment with templates for different spell types
- Study existing animations (Fireball, Ice Shard, Lightning)
- Read the full [design-principles.md](./design-principles.md) for deeper understanding
- Review [timing-guidelines.md](./timing-guidelines.md) for advanced timing techniques

**Remember:** Great combat animations are:
- **Readable** - Players can see what's happening
- **Satisfying** - Timing and impact feel good
- **Performant** - Smooth 60fps on target hardware
- **Consistent** - Fits with existing animations

Now go create some amazing spell animations! 🎨✨
