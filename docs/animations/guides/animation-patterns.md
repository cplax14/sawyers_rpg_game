# Combat Animation Patterns

**Quick-start templates for building combat animations**

This guide provides reusable animation patterns extracted from the RPG combat system. Each pattern includes complete TypeScript templates, customization points, and real examples.

## Contents

- [Introduction](#introduction)
- [Pattern 1: Projectile](#pattern-1-projectile)
- [Pattern 2: AOE (Area of Effect)](#pattern-2-aoe-area-of-effect)
- [Pattern 3: Buff/Status](#pattern-3-buffstatus)
- [Pattern 4: Beam/Ray](#pattern-4-beamray)
- [Pattern Selection Guide](#pattern-selection-guide)

---

## Introduction

### What Are Animation Patterns?

Animation patterns are reusable templates that define the structure and timing for different types of combat effects. They provide:

- **Consistent structure**: All patterns follow a 4-phase approach (charge → cast → travel/execute → impact)
- **Performance optimization**: Built-in particle count validation and GPU-friendly properties
- **Customization points**: Clear parameters to adjust colors, timing, and effects

### When to Use Patterns

- **Starting a new spell/attack animation**: Choose the pattern that matches your attack type
- **Maintaining consistency**: Ensure similar attacks feel similar
- **Quick prototyping**: Get animations working fast, then customize

### How to Use This Guide

1. **Identify your attack type** (projectile, AOE, buff, beam, melee)
2. **Find the matching pattern** below
3. **Copy the template** code
4. **Customize** colors, timing, and effects
5. **Reference the real example** for advanced techniques

---

## Pattern 1: Projectile

### When to Use
- Single-target spells that travel from caster to target
- Ranged physical attacks (arrows, thrown weapons)
- Magic bolts, fireballs, ice shards

### Phase Structure
1. **Charge** (300-400ms): Particles gather at caster, build anticipation
2. **Cast** (100-200ms): Release burst, flash effect
3. **Travel** (250-600ms): Projectile moves to target with trail
4. **Impact** (100-200ms): Explosion/burst at target

### Template

```typescript
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { Projectile } from '../Projectile';
import { validateParticleCount } from '../types';

interface ProjectileAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}

export const ProjectileAnimation: React.FC<ProjectileAnimationProps> = ({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  const [phase, setPhase] = useState<'charge' | 'cast' | 'travel' | 'impact'>('charge');

  // ========================================
  // CUSTOMIZATION POINT: Timing
  // ========================================
  const CHARGE_DURATION = 350;
  const CAST_DURATION = 150;
  const TRAVEL_DURATION = 300;
  const IMPACT_DURATION = 150;

  // ========================================
  // CUSTOMIZATION POINT: Colors
  // ========================================
  const PRIMARY_COLOR = '#ff6b35';    // Main effect color
  const SECONDARY_COLOR = '#ff4444';  // Accent color
  const ACCENT_COLOR = '#ffaa00';     // Highlights

  // Phase transitions
  const handleChargeComplete = useCallback(() => setPhase('cast'), []);
  const handleCastComplete = useCallback(() => setPhase('travel'), []);
  const handleTravelComplete = useCallback(() => setPhase('impact'), []);
  const handleImpactComplete = useCallback(() => onComplete?.(), [onComplete]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>

      {/* CHARGE PHASE */}
      {phase === 'charge' && (
        <>
          {validateParticleCount(18, 'ProjectileAnimation', 'charge')}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={18}              // CUSTOMIZATION: 15-20 particles
            colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
            spread={60}                     // CUSTOMIZATION: 40-80 for spread size
            lifetime={CHARGE_DURATION}
            size={6}                        // CUSTOMIZATION: 4-8 for particle size
            gravity={0}
            fadeOut={true}
            onComplete={handleChargeComplete}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0.8],
              scale: [0, 1.2, 1.2],
              transition: { duration: CHARGE_DURATION / 1000, ease: 'easeOut' }
            }}
            style={{
              position: 'absolute',
              left: casterX - 20,
              top: casterY - 20,
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${PRIMARY_COLOR}80 0%, ${SECONDARY_COLOR}40 50%, transparent 80%)`,
              filter: 'blur(8px)'
            }}
          />
        </>
      )}

      {/* CAST PHASE */}
      {phase === 'cast' && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.5, 2, 2.5],
              transition: { duration: CAST_DURATION / 1000, ease: 'easeOut' }
            }}
            onAnimationComplete={handleCastComplete}
            style={{
              position: 'absolute',
              left: casterX - 40,
              top: casterY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ACCENT_COLOR}ff 0%, ${PRIMARY_COLOR}80 40%, transparent 70%)`,
              filter: 'blur(10px)'
            }}
          />

          {validateParticleCount(12, 'ProjectileAnimation', 'cast')}
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={12}              // CUSTOMIZATION: 10-15 particles
            colors={[PRIMARY_COLOR, ACCENT_COLOR]}
            spread={100}
            lifetime={CAST_DURATION}
            size={8}
            gravity={0}
            fadeOut={true}
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
            color={PRIMARY_COLOR}
            size={24}                       // CUSTOMIZATION: 16-32 for projectile size
            duration={TRAVEL_DURATION}
            glowIntensity={1.2}             // CUSTOMIZATION: 0.8-1.5 for glow
            onComplete={handleTravelComplete}
          />

          <motion.div
            initial={{ x: casterX, y: casterY }}
            animate={{
              x: targetX,
              y: targetY,
              transition: { duration: TRAVEL_DURATION / 1000, ease: 'linear' }
            }}
            style={{ position: 'absolute', width: 0, height: 0 }}
          >
            {validateParticleCount(15, 'ProjectileAnimation', 'travel')}
            <ParticleSystem
              originX={0}
              originY={0}
              particleCount={15}            // CUSTOMIZATION: 10-20 trail particles
              colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
              spread={30}
              lifetime={TRAVEL_DURATION * 0.6}
              size={5}
              gravity={20}
              fadeOut={true}
            />
          </motion.div>
        </>
      )}

      {/* IMPACT PHASE */}
      {phase === 'impact' && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0.6, 0],
              scale: [0, 1.5, 2, 2.5],
              transition: { duration: IMPACT_DURATION / 1000, ease: 'easeOut' }
            }}
            onAnimationComplete={handleImpactComplete}
            style={{
              position: 'absolute',
              left: targetX - 60,
              top: targetY - 60,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ACCENT_COLOR}ff 0%, ${PRIMARY_COLOR}cc 30%, ${SECONDARY_COLOR}80 60%, transparent 80%)`,
              filter: 'blur(8px)'
            }}
          />

          {validateParticleCount(28, 'ProjectileAnimation', 'impact')}
          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={28}              // CUSTOMIZATION: 25-30 impact particles
            colors={[PRIMARY_COLOR, SECONDARY_COLOR, ACCENT_COLOR]}
            spread={150}
            lifetime={IMPACT_DURATION}
            size={8}
            gravity={80}
            fadeOut={true}
          />

          {/* Optional: Screen flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.15, 0],
              transition: { duration: IMPACT_DURATION / 1000 }
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: PRIMARY_COLOR,
              pointerEvents: 'none',
              zIndex: 99
            }}
          />
        </>
      )}
    </div>
  );
};
```

### Customization Points

| Parameter | Purpose | Range | Notes |
|-----------|---------|-------|-------|
| `CHARGE_DURATION` | Anticipation time | 300-400ms | Longer = heavier feel |
| `TRAVEL_DURATION` | Projectile speed | 200-600ms | Faster = lighter attack |
| `particleCount` (charge) | Charge intensity | 15-20 | Keep under 20 |
| `particleCount` (impact) | Impact intensity | 25-30 | Keep under 30 |
| `projectile size` | Visual weight | 16-32px | Bigger = heavier |
| `spread` (charge) | Gather area | 40-80 | Negative = converge inward |

### Variations

**Fast Projectile** (dagger, light spell):
- `TRAVEL_DURATION = 200`
- `particleCount` (charge) = 12
- `size` = 18

**Standard Projectile** (fireball):
- `TRAVEL_DURATION = 300`
- `particleCount` (charge) = 18
- `size` = 24

**Heavy Projectile** (boulder, dark orb):
- `TRAVEL_DURATION = 500`
- `particleCount` (charge) = 20
- `size` = 32

### Real Example

See `FireballAnimation.tsx` for advanced techniques:
- Spinning projectile during travel (`rotate: 720`)
- Multiple particle layers (trail + burst)
- Shockwave ring on impact

---

## Pattern 2: AOE (Area of Effect)

### When to Use
- Spells that hit multiple targets or an area
- Ground-targeted effects (meteor, earthquake)
- Explosion-type attacks

### Phase Structure
1. **Charge** (400-600ms): Caster channels, sky/ground indication
2. **Warning** (300-400ms): Target indicators appear (circles, shadows)
3. **Impact** (300-400ms): Multiple simultaneous effects at target points
4. **Aftermath** (200-300ms): Lingering effects (dust, craters, smoke)

### Template

```typescript
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { AreaEffect } from '../core/AreaEffect';
import { validateParticleCount } from '../types';

interface AOEAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
}

export const AOEAnimation: React.FC<AOEAnimationProps> = ({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  const [phase, setPhase] = useState<'charge' | 'warning' | 'impact' | 'aftermath'>('charge');

  // ========================================
  // CUSTOMIZATION POINT: Timing
  // ========================================
  const CHARGE_DURATION = 600;
  const WARNING_DURATION = 400;
  const IMPACT_DURATION = 300;
  const AFTERMATH_DURATION = 200;

  // ========================================
  // CUSTOMIZATION POINT: Colors
  // ========================================
  const PRIMARY_COLOR = '#ff4444';
  const SECONDARY_COLOR = '#ffaa00';
  const ACCENT_COLOR = '#ff6b35';

  // ========================================
  // CUSTOMIZATION POINT: Impact Points
  // ========================================
  const impactPoints = [
    { x: targetX, y: targetY },                 // Center
    { x: targetX - 60, y: targetY - 40 },       // Left
    { x: targetX + 50, y: targetY - 30 }        // Right
  ];
  // Add more points for larger AOE: { x: targetX + 40, y: targetY + 50 }

  const handleChargeComplete = useCallback(() => setPhase('warning'), []);
  const handleWarningComplete = useCallback(() => setPhase('impact'), []);
  const handleImpactComplete = useCallback(() => setPhase('aftermath'), []);
  const handleAftermathComplete = useCallback(() => onComplete?.(), [onComplete]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>

      {/* CHARGE PHASE */}
      {phase === 'charge' && (
        <>
          {/* Sky/overhead indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.7, 0.7],
              scale: [0, 1.5, 1.5],
              transition: { duration: CHARGE_DURATION / 1000, ease: 'easeIn' }
            }}
            onAnimationComplete={handleChargeComplete}
            style={{
              position: 'absolute',
              left: targetX - 80,
              top: -100,                      // CUSTOMIZATION: -50 to -150 for height
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${PRIMARY_COLOR}60 0%, ${SECONDARY_COLOR}40 50%, transparent 70%)`,
              filter: 'blur(25px)'
            }}
          />

          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={15}
            colors={[PRIMARY_COLOR, SECONDARY_COLOR]}
            spread={50}
            lifetime={CHARGE_DURATION}
            size={5}
            gravity={-60}                     // CUSTOMIZATION: Negative = float up
            fadeOut={false}
          />
        </>
      )}

      {/* WARNING PHASE */}
      {phase === 'warning' && (
        <>
          {/* Target indicators for each impact point */}
          {impactPoints.map((point, index) => (
            <React.Fragment key={`warning-${index}`}>
              {/* Shadow circle on ground */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 0.7, 0.8],
                  scale: [0, 1, 1.1],
                  transition: {
                    duration: WARNING_DURATION / 1000,
                    delay: index * 0.08,
                    ease: 'easeOut'
                  }
                }}
                onAnimationComplete={index === impactPoints.length - 1 ? handleWarningComplete : undefined}
                style={{
                  position: 'absolute',
                  left: point.x - 45,
                  top: point.y - 15,
                  width: 90,
                  height: 30,
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 60%, transparent 80%)',
                  border: `2px dashed ${PRIMARY_COLOR}`,
                  filter: 'blur(3px)',
                  transform: 'rotateX(70deg)'
                }}
              />

              {/* Pulsing warning ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: [0, 0.6, 0.4, 0.6],
                  scale: [0.5, 1.2, 1, 1.3],
                  transition: {
                    duration: WARNING_DURATION / 1000,
                    delay: index * 0.08
                  }
                }}
                style={{
                  position: 'absolute',
                  left: point.x - 50,
                  top: point.y - 50,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  border: `2px solid ${PRIMARY_COLOR}`,
                  boxShadow: `0 0 15px ${PRIMARY_COLOR}`
                }}
              />
            </React.Fragment>
          ))}
        </>
      )}

      {/* IMPACT PHASE */}
      {phase === 'impact' && (
        <>
          {impactPoints.map((point, index) => (
            <React.Fragment key={`impact-${index}`}>
              {/* Explosion burst */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0.8, 0],
                  scale: [0, 1.5, 2, 2.5],
                  transition: {
                    duration: IMPACT_DURATION / 1000,
                    delay: index * 0.05,
                    ease: 'easeOut'
                  }
                }}
                onAnimationComplete={index === impactPoints.length - 1 ? handleImpactComplete : undefined}
                style={{
                  position: 'absolute',
                  left: point.x - 50,
                  top: point.y - 50,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${ACCENT_COLOR}ff 0%, ${PRIMARY_COLOR}dd 40%, ${SECONDARY_COLOR}80 70%, transparent 90%)`,
                  filter: 'blur(10px)'
                }}
              />

              {/* Shockwave */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0.8, 0.5, 0],
                  scale: [0, 2, 3],
                  transition: {
                    duration: IMPACT_DURATION / 1000,
                    delay: index * 0.05
                  }
                }}
                style={{
                  position: 'absolute',
                  left: point.x - 60,
                  top: point.y - 60,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  border: `4px solid ${PRIMARY_COLOR}`,
                  boxShadow: `0 0 30px ${PRIMARY_COLOR}`
                }}
              />

              {/* Particles per impact */}
              {validateParticleCount(12, 'AOEAnimation', `impact-${index}`)}
              <ParticleSystem
                originX={point.x}
                originY={point.y}
                particleCount={12}            // CUSTOMIZATION: 10-15 per point
                colors={[PRIMARY_COLOR, SECONDARY_COLOR, ACCENT_COLOR]}
                spread={130}
                lifetime={IMPACT_DURATION}
                size={7}
                gravity={100}
                fadeOut={true}
              />
            </React.Fragment>
          ))}

          {/* Overall AOE ring */}
          <AreaEffect
            centerX={targetX}
            centerY={targetY}
            radius={100}                      // CUSTOMIZATION: 80-150 for AOE size
            color={PRIMARY_COLOR}
            expandDuration={IMPACT_DURATION * 0.6}
            fadeDuration={IMPACT_DURATION * 0.4}
            particleCount={0}
          />

          {/* Screen flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.25, 0.15, 0],
              transition: { duration: IMPACT_DURATION / 1000 }
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: PRIMARY_COLOR,
              pointerEvents: 'none',
              zIndex: 99
            }}
          />
        </>
      )}

      {/* AFTERMATH PHASE */}
      {phase === 'aftermath' && (
        <>
          {impactPoints.map((point, index) => (
            <React.Fragment key={`aftermath-${index}`}>
              {/* Rising dust/smoke */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{
                  opacity: [0, 0.6, 0.4, 0],
                  scale: [0.5, 1.5, 2, 2.5],
                  y: [-20, -40, -60, -80],
                  transition: {
                    duration: AFTERMATH_DURATION / 1000,
                    delay: index * 0.04,
                    ease: 'easeOut'
                  }
                }}
                onAnimationComplete={index === impactPoints.length - 1 ? handleAftermathComplete : undefined}
                style={{
                  position: 'absolute',
                  left: point.x - 40,
                  top: point.y - 40,
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(100,100,100,0.6) 0%, rgba(80,80,80,0.3) 50%, transparent 70%)',
                  filter: 'blur(12px)'
                }}
              />

              {/* Lingering embers/particles */}
              <ParticleSystem
                originX={point.x}
                originY={point.y}
                particleCount={6}
                colors={[SECONDARY_COLOR, PRIMARY_COLOR]}
                spread={40}
                lifetime={AFTERMATH_DURATION}
                size={4}
                gravity={-30}                 // Float upward
                fadeOut={true}
              />
            </React.Fragment>
          ))}
        </>
      )}
    </div>
  );
};
```

### Customization Points

| Parameter | Purpose | Range | Notes |
|-----------|---------|-------|-------|
| `impactPoints` | AOE coverage | 2-5 points | More points = larger area |
| `WARNING_DURATION` | Reaction time | 300-500ms | Longer = easier to dodge |
| `radius` (AreaEffect) | Visual AOE size | 80-150px | Match gameplay area |
| `particleCount` per impact | Intensity | 10-15 | Total = count × points |

### Variations

**Expanding Ring** (frost nova):
- Single impact point at `targetX, targetY`
- Large `radius` (120-150)
- Slower `expandDuration` (400ms)

**Falling Meteors** (meteor shower):
- 4-5 impact points
- Staggered delays (`index * 0.1`)
- Vertical entry animation

**Ground Burst** (earthquake):
- Impact points in line or grid
- Dust/debris particles (`gravity: 50-100`)
- No sky indicators

### Real Example

See `MeteorAnimation.tsx` for advanced techniques:
- 3 simultaneous impact points
- Overhead charging effect (negative top position)
- Flame trails during descent
- Crater glows in aftermath

---

## Pattern 3: Buff/Status

### When to Use
- Buff spells (haste, protect, shield)
- Debuff spells (slow, poison, silence)
- Status effects with persistent visuals
- Healing spells (variation of buff)

### Phase Structure
1. **Charge** (300-400ms): Energy gathers around caster
2. **Cast** (200-300ms): Release toward target
3. **Apply** (400-500ms): Effect envelops target
4. **Persist** (optional): Lingering aura/indicator

### Template

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
  persistent?: boolean;        // If true, leave lingering effect
}

export const BuffAnimation: React.FC<BuffAnimationProps> = ({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete,
  persistent = false
}) => {
  const [phase, setPhase] = useState<'charge' | 'cast' | 'apply' | 'persist'>('charge');

  // ========================================
  // CUSTOMIZATION POINT: Timing
  // ========================================
  const CHARGE_DURATION = 350;
  const CAST_DURATION = 250;
  const APPLY_DURATION = 450;
  const PERSIST_DURATION = 1000;     // Only if persistent = true

  // ========================================
  // CUSTOMIZATION POINT: Colors
  // ========================================
  const AURA_COLOR = '#ffd700';       // Gold for buffs, dark for debuffs
  const SECONDARY_COLOR = '#ffffcc';
  const ACCENT_COLOR = '#ffffff';

  const handleChargeComplete = useCallback(() => setPhase('cast'), []);
  const handleCastComplete = useCallback(() => setPhase('apply'), []);
  const handleApplyComplete = useCallback(() => {
    if (persistent) {
      setPhase('persist');
    } else {
      onComplete?.();
    }
  }, [persistent, onComplete]);
  const handlePersistComplete = useCallback(() => onComplete?.(), [onComplete]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>

      {/* CHARGE PHASE */}
      {phase === 'charge' && (
        <>
          <ParticleSystem
            originX={casterX}
            originY={casterY}
            particleCount={15}
            colors={[AURA_COLOR, SECONDARY_COLOR]}
            spread={60}
            lifetime={CHARGE_DURATION}
            size={5}
            gravity={0}
            fadeOut={true}
            onComplete={handleChargeComplete}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.6, 0.8],
              scale: [0, 1, 1.2],
              transition: { duration: CHARGE_DURATION / 1000, ease: 'easeOut' }
            }}
            style={{
              position: 'absolute',
              left: casterX - 30,
              top: casterY - 30,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ACCENT_COLOR}80 0%, ${AURA_COLOR}60 40%, transparent 70%)`,
              filter: 'blur(10px)'
            }}
          />
        </>
      )}

      {/* CAST PHASE */}
      {phase === 'cast' && (
        <>
          {/* Stream of energy toward target */}
          <motion.div
            initial={{ x: casterX, y: casterY, opacity: 0 }}
            animate={{
              x: targetX,
              y: targetY,
              opacity: [0, 0.8, 0.6],
              transition: { duration: CAST_DURATION / 1000, ease: 'easeOut' }
            }}
            onAnimationComplete={handleCastComplete}
            style={{
              position: 'absolute',
              width: 20,
              height: 20,
              marginLeft: -10,
              marginTop: -10,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ACCENT_COLOR} 0%, ${AURA_COLOR} 50%, transparent 80%)`,
              filter: 'blur(6px)',
              boxShadow: `0 0 20px ${AURA_COLOR}`
            }}
          />

          {/* Trail particles */}
          <motion.div
            initial={{ x: casterX, y: casterY }}
            animate={{
              x: targetX,
              y: targetY,
              transition: { duration: CAST_DURATION / 1000, ease: 'easeOut' }
            }}
            style={{ position: 'absolute', width: 0, height: 0 }}
          >
            <ParticleSystem
              originX={0}
              originY={0}
              particleCount={10}
              colors={[AURA_COLOR, SECONDARY_COLOR]}
              spread={25}
              lifetime={CAST_DURATION * 0.7}
              size={4}
              gravity={0}
              fadeOut={true}
            />
          </motion.div>
        </>
      )}

      {/* APPLY PHASE */}
      {phase === 'apply' && (
        <>
          {/* Enveloping aura */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.8, 0.6],
              scale: [0, 1.3, 1],
              transition: { duration: APPLY_DURATION / 1000, ease: 'easeOut' }
            }}
            onAnimationComplete={handleApplyComplete}
            style={{
              position: 'absolute',
              left: targetX - 50,
              top: targetY - 50,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ACCENT_COLOR}60 0%, ${AURA_COLOR}40 50%, transparent 70%)`,
              filter: 'blur(12px)'
            }}
          />

          {/* Buff particles spiraling up */}
          <ParticleSystem
            originX={targetX}
            originY={targetY + 30}         // Start below target
            particleCount={20}
            colors={[AURA_COLOR, SECONDARY_COLOR, ACCENT_COLOR]}
            spread={40}
            lifetime={APPLY_DURATION}
            size={6}
            gravity={-50}                  // CUSTOMIZATION: Float upward for buffs
            fadeOut={true}
          />

          {/* Pulsing ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0.7, 0.5, 0],
              scale: [0.8, 1.5, 2, 2.5],
              transition: { duration: APPLY_DURATION / 1000 }
            }}
            style={{
              position: 'absolute',
              left: targetX - 60,
              top: targetY - 60,
              width: 120,
              height: 120,
              borderRadius: '50%',
              border: `3px solid ${AURA_COLOR}`,
              boxShadow: `0 0 20px ${AURA_COLOR}`
            }}
          />
        </>
      )}

      {/* PERSIST PHASE (optional) */}
      {persistent && phase === 'persist' && (
        <>
          {/* Lingering aura around target */}
          <motion.div
            initial={{ opacity: 0.6, scale: 1 }}
            animate={{
              opacity: [0.6, 0.4, 0.5, 0.3],
              scale: [1, 1.1, 1, 1.05],
              transition: {
                duration: PERSIST_DURATION / 1000,
                ease: 'easeInOut'
              }
            }}
            onAnimationComplete={handlePersistComplete}
            style={{
              position: 'absolute',
              left: targetX - 40,
              top: targetY - 60,
              width: 80,
              height: 120,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, ${AURA_COLOR}30 0%, transparent 70%)`,
              filter: 'blur(15px)'
            }}
          />

          {/* Gentle floating sparkles */}
          <motion.div
            style={{ position: 'absolute', left: targetX, top: targetY }}
          >
            <ParticleSystem
              originX={0}
              originY={0}
              particleCount={8}
              colors={[AURA_COLOR, ACCENT_COLOR]}
              spread={30}
              lifetime={PERSIST_DURATION}
              size={3}
              gravity={-20}
              fadeOut={true}
            />
          </motion.div>
        </>
      )}
    </div>
  );
};
```

### Customization Points

| Parameter | Purpose | Range | Notes |
|-----------|---------|-------|-------|
| `persistent` | Lingering effect | true/false | For buff spells |
| `PERSIST_DURATION` | Aura lifetime | 800-2000ms | Visual only, not gameplay |
| `gravity` (apply) | Particle direction | -50 to 50 | Negative = up (buff), positive = down (debuff) |
| `AURA_COLOR` | Buff type | any | Gold = buff, purple = debuff, green = poison |

### Variations

**Shield Buff**:
- `AURA_COLOR = '#4da6ff'` (blue)
- Hexagonal border instead of circle
- Slower pulsing animation

**Haste Buff**:
- `AURA_COLOR = '#ffeb3b'` (yellow)
- Fast, erratic particles
- Trailing motion lines

**Poison Debuff**:
- `AURA_COLOR = '#8bc34a'` (green)
- `gravity: 50` (dripping effect)
- Bubbling particles

### Real Example

See `HolyBeamAnimation.tsx` for beam-based buff:
- Descending light column instead of projectile
- Radiant burst on apply
- Ascending sparkles for divine effect

---

## Pattern 4: Beam/Ray

### When to Use
- Channeled attacks (laser, holy beam)
- Instant-hit spells (lightning bolt from sky)
- Line-of-effect attacks

### Phase Structure
1. **Charge** (300-400ms): Energy gathers at source (caster or sky)
2. **Cast** (100-200ms): Beam preparation, flash
3. **Beam** (300-500ms): Sustained beam/bolt connecting source to target
4. **Impact** (150-250ms): Burst at target, beam fades

### Template

```typescript
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ParticleSystem } from '../core/ParticleSystem';
import { validateParticleCount } from '../types';

interface BeamAnimationProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete?: () => void;
  beamSource?: 'caster' | 'sky';  // Where beam originates
}

export const BeamAnimation: React.FC<BeamAnimationProps> = ({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete,
  beamSource = 'sky'
}) => {
  const [phase, setPhase] = useState<'charge' | 'cast' | 'beam' | 'impact'>('charge');

  // ========================================
  // CUSTOMIZATION POINT: Timing
  // ========================================
  const CHARGE_DURATION = 350;
  const CAST_DURATION = 150;
  const BEAM_DURATION = 350;
  const IMPACT_DURATION = 150;

  // ========================================
  // CUSTOMIZATION POINT: Colors
  // ========================================
  const BEAM_COLOR = '#ffd700';       // Gold, white, blue, purple
  const SECONDARY_COLOR = '#ffffcc';
  const ACCENT_COLOR = '#ffffff';

  // ========================================
  // CUSTOMIZATION POINT: Beam Geometry
  // ========================================
  const beamStartY = beamSource === 'sky' ? 0 : casterY;
  const beamStartX = beamSource === 'sky' ? targetX : casterX;
  const beamHeight = beamSource === 'sky' ? targetY : Math.abs(targetY - casterY);

  const handleChargeComplete = useCallback(() => setPhase('cast'), []);
  const handleCastComplete = useCallback(() => setPhase('beam'), []);
  const handleBeamComplete = useCallback(() => setPhase('impact'), []);
  const handleImpactComplete = useCallback(() => onComplete?.(), [onComplete]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 100 }}>

      {/* CHARGE PHASE */}
      {phase === 'charge' && (
        <>
          {/* Energy gathering at beam source */}
          <motion.div
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{
              opacity: [0, 0.8, 0.8],
              scale: [0, 1.2, 1.2],
              y: beamSource === 'sky' ? [-60, -80, -90] : 0,
              transition: { duration: CHARGE_DURATION / 1000, ease: 'easeOut' }
            }}
            onAnimationComplete={handleChargeComplete}
            style={{
              position: 'absolute',
              left: beamStartX - 40,
              top: beamSource === 'sky' ? -50 : casterY - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ACCENT_COLOR}ff 0%, ${BEAM_COLOR}cc 40%, ${SECONDARY_COLOR}60 70%, transparent 90%)`,
              filter: 'blur(10px)'
            }}
          />

          <ParticleSystem
            originX={beamSource === 'caster' ? casterX : targetX}
            originY={beamSource === 'caster' ? casterY : 0}
            particleCount={18}
            colors={[BEAM_COLOR, SECONDARY_COLOR, ACCENT_COLOR]}
            spread={60}
            lifetime={CHARGE_DURATION}
            size={6}
            gravity={beamSource === 'sky' ? -80 : 0}  // Float up if from sky
            fadeOut={false}
          />
        </>
      )}

      {/* CAST PHASE */}
      {phase === 'cast' && (
        <>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 0.8],
              scale: [0.5, 1.5, 1.3],
              transition: { duration: CAST_DURATION / 1000, ease: 'easeOut' }
            }}
            onAnimationComplete={handleCastComplete}
            style={{
              position: 'absolute',
              left: beamStartX - 50,
              top: (beamSource === 'sky' ? -120 : casterY - 50),
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ACCENT_COLOR}ff 0%, ${BEAM_COLOR}dd 50%, transparent 80%)`,
              filter: 'blur(12px)'
            }}
          />

          {/* Beam preparation glow */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{
              opacity: [0, 0.5, 0.7],
              scaleY: [0, 0.5, 0.8],
              transition: { duration: CAST_DURATION / 1000 }
            }}
            style={{
              position: 'absolute',
              left: beamStartX - 25,
              top: beamStartY,
              width: 50,
              height: beamHeight,
              background: `linear-gradient(to bottom, ${ACCENT_COLOR}40 0%, ${BEAM_COLOR}20 50%, transparent 100%)`,
              filter: 'blur(8px)',
              transformOrigin: 'top'
            }}
          />
        </>
      )}

      {/* BEAM PHASE */}
      {phase === 'beam' && (
        <>
          {/* Main beam column */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{
              opacity: [0, 0.9, 0.8, 0.7],
              scaleY: [0, 1, 1, 1],
              transition: { duration: BEAM_DURATION / 1000, ease: 'easeOut' }
            }}
            onAnimationComplete={handleBeamComplete}
            style={{
              position: 'absolute',
              left: beamStartX - 30,
              top: beamStartY,
              width: 60,                      // CUSTOMIZATION: 40-80 for beam width
              height: beamHeight,
              background: `linear-gradient(to bottom,
                ${ACCENT_COLOR}ff 0%,
                ${BEAM_COLOR}dd 30%,
                ${SECONDARY_COLOR}bb 70%,
                ${BEAM_COLOR}dd 100%)`,
              filter: 'blur(6px)',
              transformOrigin: 'top',
              boxShadow: `0 0 40px ${BEAM_COLOR}`
            }}
          />

          {/* Inner bright core */}
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{
              opacity: [0, 1, 0.9, 0.8],
              scaleY: [0, 1, 1, 1],
              transition: { duration: BEAM_DURATION / 1000, ease: 'easeOut' }
            }}
            style={{
              position: 'absolute',
              left: beamStartX - 15,
              top: beamStartY,
              width: 30,
              height: beamHeight,
              background: `linear-gradient(to bottom, ${ACCENT_COLOR}ff 0%, ${ACCENT_COLOR}cc 100%)`,
              filter: 'blur(3px)',
              transformOrigin: 'top'
            }}
          />

          {/* Descending/traveling particles */}
          <motion.div
            initial={{ y: 0 }}
            animate={{
              y: beamHeight,
              transition: { duration: BEAM_DURATION / 1000, ease: 'linear' }
            }}
            style={{ position: 'absolute', left: beamStartX, top: beamStartY, width: 0, height: 0 }}
          >
            <ParticleSystem
              originX={0}
              originY={0}
              particleCount={15}
              colors={[ACCENT_COLOR, BEAM_COLOR, SECONDARY_COLOR]}
              spread={30}
              lifetime={BEAM_DURATION * 0.6}
              size={5}
              gravity={50}
              fadeOut={true}
            />
          </motion.div>

          {/* Target ground indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.7, 0.8],
              scale: [0, 1.2, 1],
              transition: { duration: BEAM_DURATION / 1000, ease: 'easeOut' }
            }}
            style={{
              position: 'absolute',
              left: targetX - 45,
              top: targetY - 10,
              width: 90,
              height: 20,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, ${BEAM_COLOR}80 0%, ${SECONDARY_COLOR}40 60%, transparent 90%)`,
              filter: 'blur(8px)',
              transform: 'rotateX(70deg)'
            }}
          />
        </>
      )}

      {/* IMPACT PHASE */}
      {phase === 'impact' && (
        <>
          {/* Radiant burst */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0.7, 0],
              scale: [0, 1.3, 1.8, 2.2],
              transition: { duration: IMPACT_DURATION / 1000, ease: 'easeOut' }
            }}
            onAnimationComplete={handleImpactComplete}
            style={{
              position: 'absolute',
              left: targetX - 60,
              top: targetY - 60,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${ACCENT_COLOR}ff 0%, ${BEAM_COLOR}dd 40%, ${SECONDARY_COLOR}80 70%, transparent 90%)`,
              filter: 'blur(8px)'
            }}
          />

          {/* Light rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle) => (
            <motion.div
              key={angle}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{
                opacity: [0, 0.8, 0.6, 0],
                scaleX: [0, 1, 1.2, 1],
                transition: { duration: IMPACT_DURATION / 1000, ease: 'easeOut' }
              }}
              style={{
                position: 'absolute',
                left: targetX,
                top: targetY - 3,
                width: 70,
                height: 6,
                background: `linear-gradient(to right, ${ACCENT_COLOR}ff 0%, ${BEAM_COLOR}cc 50%, transparent 100%)`,
                boxShadow: `0 0 10px ${ACCENT_COLOR}`,
                transformOrigin: 'left center',
                transform: `rotate(${angle}deg)`,
                filter: 'blur(2px)'
              }}
            />
          ))}

          <ParticleSystem
            originX={targetX}
            originY={targetY}
            particleCount={28}
            colors={[BEAM_COLOR, SECONDARY_COLOR, ACCENT_COLOR]}
            spread={140}
            lifetime={IMPACT_DURATION}
            size={7}
            gravity={-20}                     // Slight upward float
            fadeOut={true}
          />

          {/* Screen flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.15, 0],
              transition: { duration: IMPACT_DURATION / 1000 }
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: BEAM_COLOR,
              pointerEvents: 'none',
              zIndex: 99
            }}
          />
        </>
      )}
    </div>
  );
};
```

### Customization Points

| Parameter | Purpose | Range | Notes |
|-----------|---------|-------|-------|
| `beamSource` | Beam origin | 'caster' / 'sky' | 'sky' for lightning/holy |
| `width` (beam) | Beam thickness | 40-80px | Thicker = more powerful |
| `BEAM_DURATION` | Sustained time | 300-500ms | Channeled feel |
| `particleCount` (beam) | Beam density | 12-20 | More = denser effect |

### Variations

**Lightning Bolt** (instant):
- `beamSource = 'sky'`
- `BEAM_DURATION = 200` (fast)
- Jagged SVG path instead of rectangle

**Laser Beam** (sustained):
- `beamSource = 'caster'`
- `BEAM_DURATION = 500` (longer)
- Thin width (30-40px)
- No screen flash

**Holy Light** (divine):
- `beamSource = 'sky'`
- Golden colors
- Ascending sparkles at impact
- Cross/star shapes

### Real Example

See `HolyBeamAnimation.tsx` for advanced techniques:
- Rotating divine circle during charge
- Cross pattern at beam source
- Radiant light rays on impact (12-ray burst)

---

## Pattern Selection Guide

### Quick Decision Flowchart

```
Is it single-target? ──YES──> Projectile or Beam?
    │                          ├─ Travels visible path → Projectile
    │                          └─ Instant or sustained → Beam
    NO
    ↓
Does it affect multiple enemies? ──YES──> AOE Pattern
    │
    NO
    ↓
Does it buff/debuff? ──YES──> Buff Pattern
```

### Attack Type → Pattern Mapping

| Attack Type | Pattern | Example |
|-------------|---------|---------|
| Fireball | Projectile | FireballAnimation |
| Ice Shard | Projectile | IceShardAnimation |
| Meteor | AOE | MeteorAnimation |
| Earthquake | AOE | (use AOE with ground burst variation) |
| Lightning Bolt | Beam | LightningAnimation |
| Holy Beam | Beam | HolyBeamAnimation |
| Protect | Buff | (use Buff with shield variation) |
| Poison | Buff | (use Buff with debuff colors) |
| Heal | Buff | (use Buff with upward particles) |
| Laser | Beam | (use Beam from caster) |

### Timing Recommendations by Pattern

| Pattern | Total Duration | Feel |
|---------|---------------|------|
| **Projectile - Fast** | 600-800ms | Light, quick attacks |
| **Projectile - Standard** | 900-1100ms | Balanced spells |
| **Projectile - Heavy** | 1200-1500ms | Powerful, slow attacks |
| **AOE** | 1400-1700ms | Dramatic, area attacks |
| **Beam** | 900-1200ms | Instant/sustained attacks |
| **Buff** | 900-1100ms | Support spells |

### Particle Count Guidelines by Pattern

**Budget per animation: Max 30 particles total** (validated by `validateParticleCount`)

| Pattern | Charge | Cast/Execute | Impact | Total |
|---------|--------|--------------|--------|-------|
| **Projectile** | 15-18 | 10-12 | 25-28 | ~60 (over time) |
| **AOE** | 15 | 12 | 10-15/point | ~45-60 |
| **Beam** | 18 | 12 | 28 | ~60 |
| **Buff** | 15 | 10 | 20 | ~45 |

**Note**: Particle systems are short-lived (100-600ms), so total particles across phases don't overlap.

---

## Best Practices

### Performance
1. **Always validate particle counts** with `validateParticleCount(count, componentName, phase)`
2. **Use GPU properties**: `transform`, `opacity`, `filter` (avoid `top`, `left` changes mid-animation)
3. **Limit simultaneous effects**: No more than 3 major effects at once
4. **Keep durations reasonable**: Total animation 600-1500ms

### Visual Consistency
1. **Match timing to weight**: Heavier attacks = longer charge + slower travel
2. **Use color palettes**: Import from `types.ts` (FIRE_COLORS, ICE_COLORS, etc.)
3. **Follow phase structure**: charge → cast → execute → impact
4. **Screen flash intensity**: 0.1-0.2 for standard, 0.25+ for powerful

### Development
1. **Start with a pattern template** closest to your attack type
2. **Customize colors first**, then timing, then particle counts
3. **Test on low-end devices** to ensure 60fps
4. **Reference real examples** for advanced techniques

---

## Additional Resources

- **API Reference**: `/docs/animations/api/`
- **Component Specs**: `/docs/animations/specifications/`
- **Performance Reports**: `/docs/animations/reports/`
- **Real Implementations**: `/src/components/combat/animations/variants/`

---

**Last Updated**: 2025-10-04
**Maintainer**: Combat Animation System Team
