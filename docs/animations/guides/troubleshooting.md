# Animation Troubleshooting Guide

**Last Updated:** 2025-10-04
**For:** Combat Animation System v1.0

---

## How to Use This Guide

This guide is organized by **symptom** rather than by component. Find the symptom that matches your issue, then follow the diagnostic steps and solutions.

**Quick Navigation:**
- [Visual Issues](#visual-issues)
- [Performance Issues](#performance-issues)
- [Integration Issues](#integration-issues)
- [TypeScript/Build Errors](#typescriptbuild-errors)
- [Logic/Timing Issues](#logictiming-issues)
- [Error Messages Reference](#error-messages-reference)
- [Debugging Tools and Techniques](#debugging-tools-and-techniques)
- [Performance Debugging Deep Dive](#performance-debugging-deep-dive)
- [Common Pitfalls](#common-pitfalls)
- [Diagnostic Flowcharts](#diagnostic-flowcharts)
- [Getting Help](#getting-help)

---

## Quick Diagnostic Checklist

Before diving into specific issues, run through this checklist:

- [ ] Browser console is open (F12)
- [ ] Development mode is active (`npm run dev`)
- [ ] No build errors in terminal
- [ ] React DevTools installed (for component inspection)
- [ ] Animation performance instrumentation enabled (automatic in dev mode)
- [ ] Position data is valid (check console for validation warnings)

**When to Escalate:**
- Animation system completely broken across all spells
- Memory leaks causing browser crash
- Critical production bug affecting gameplay
- Security concern identified

**Development vs Production Debugging:**
- **Development:** Full logging, detailed errors, performance warnings
- **Production:** Minimal logging, graceful degradation, silent fallbacks

---

## Visual Issues

### Animation Doesn't Appear at All

**Symptom:** You cast a spell, but nothing visual happens. Combat continues, damage shows, but no animation.

**Likely Causes:**
1. Animation not registered in `animationRegistry.ts`
2. Invalid position data (NaN, undefined, out of bounds)
3. Component error caught by error boundary
4. CSS z-index issue hiding animation
5. Animation component not imported/exported properly

**Step-by-Step Diagnosis:**

1. **Check browser console for warnings:**
   ```
   ⚠️ [AnimationController] No animation found for attack type: "my_spell"
   ⚠️ [AnimationController] Invalid position data for "my_spell"
   🚨 [AnimationController] Animation error for "my_spell"
   ```

2. **Verify registry mapping:**
   ```typescript
   // In animationRegistry.ts
   import { MySpellAnimation } from './variants/MySpellAnimation';

   export const ATTACK_ANIMATION_MAP: Record<string, AnimationMetadata> = {
     my_spell: {
       component: MySpellAnimation,  // Check this exists
       element: 'fire',
       type: 'projectile'
     }
   };
   ```

3. **Check position data in combat:**
   ```javascript
   // In browser console during combat
   // Look for position validation warnings
   // Expected format:
   // { casterX: 100, casterY: 200, targetX: 400, targetY: 300 }
   ```

4. **Verify component is exported:**
   ```typescript
   // In MySpellAnimation.tsx
   export const MySpellAnimation = React.memo<AnimationComponentProps>(({ ... }) => {
     // Component code
   });

   // In variants/index.ts (if you have a barrel export)
   export { MySpellAnimation } from './MySpellAnimation';
   ```

5. **Inspect DOM:**
   - Open React DevTools
   - Look for `AnimationController` component in tree
   - Check if your animation component is rendered
   - If component exists but invisible, it's a CSS issue

**Solutions:**

**Missing Registry Entry:**
```typescript
// Add to animationRegistry.ts
import { MySpellAnimation } from './variants/MySpellAnimation';

export const ATTACK_ANIMATION_MAP: Record<string, AnimationMetadata> = {
  // ... other spells
  my_spell: {
    component: MySpellAnimation,
    element: 'fire',
    type: 'projectile'
  }
};
```

**Invalid Positions (NaN/undefined):**
```typescript
// In Combat.tsx, ensure position calculation is safe
const attackData = {
  casterX: playerElement?.offsetLeft ?? 100,  // Fallback to default
  casterY: playerElement?.offsetTop ?? 200,
  targetX: enemyElement?.offsetLeft ?? 400,
  targetY: enemyElement?.offsetTop ?? 300
};

// Verify positions are valid before passing
if (isNaN(attackData.casterX) || isNaN(attackData.targetX)) {
  console.error('Invalid position calculation');
  return;
}
```

**Z-Index Issue:**
```css
/* AnimationController renders at z-index: 100 by default */
/* Ensure nothing in Combat.tsx has higher z-index */
.combat-container {
  position: relative;
  z-index: 1; /* Keep lower than 100 */
}
```

---

### Animation Appears in Wrong Position

**Symptom:** Animation plays, but it's offset from where it should be (not at caster/target location).

**Likely Causes:**
1. Parent container not positioned relatively
2. Position calculation using wrong element references
3. Transform origin incorrect
4. Animation positioned absolute but parent not positioned

**Step-by-Step Diagnosis:**

1. **Check container positioning:**
   ```javascript
   // In browser console
   const container = document.querySelector('.combat-container');
   console.log(window.getComputedStyle(container).position);
   // Should be: "relative" or "absolute", NOT "static"
   ```

2. **Verify position data is correct:**
   ```typescript
   // Add temporary logging to Combat.tsx
   console.log('Attack positions:', {
     casterX: attackData.casterX,
     casterY: attackData.casterY,
     targetX: attackData.targetX,
     targetY: attackData.targetY
   });
   ```

3. **Check AnimationController wrapper:**
   ```typescript
   // AnimationController.tsx should have this structure
   return (
     <div
       className="animation-controller"
       style={{
         position: 'absolute',
         top: 0,
         left: 0,
         right: 0,
         bottom: 0,
         pointerEvents: 'none'
       }}
     >
       <AnimationComponent {...props} />
     </div>
   );
   ```

**Solutions:**

**Fix Container Positioning:**
```css
/* In Combat.css or Combat.tsx inline styles */
.combat-container {
  position: relative; /* Essential for absolute positioning to work */
  width: 100%;
  height: 600px;
  overflow: hidden;
}
```

**Fix Position Calculation:**
```typescript
// In Combat.tsx
const getCombatPosition = (element: HTMLElement | null) => {
  if (!element) return { x: 0, y: 0 };

  const rect = element.getBoundingClientRect();
  const container = document.querySelector('.combat-container')?.getBoundingClientRect();

  if (!container) return { x: 0, y: 0 };

  // Position relative to combat container, not viewport
  return {
    x: rect.left - container.left + (rect.width / 2),  // Center of element
    y: rect.top - container.top + (rect.height / 2)
  };
};

const playerPos = getCombatPosition(playerElement);
const enemyPos = getCombatPosition(enemyElement);

const attackData = {
  casterX: playerPos.x,
  casterY: playerPos.y,
  targetX: enemyPos.x,
  targetY: enemyPos.y
};
```

---

### Colors Look Wrong or Washed Out

**Symptom:** Animation colors appear faded, incorrect, or different from design specifications.

**Likely Causes:**
1. Wrong color constants used (legacy vs new palette)
2. Opacity values too low
3. Browser color profile issues
4. Blend mode conflicts
5. Using old element color scheme

**Step-by-Step Diagnosis:**

1. **Check which color constants you're using:**
   ```typescript
   // ❌ OLD (legacy):
   import { ELEMENT_COLORS } from '../types';
   const color = ELEMENT_COLORS.fire.primary; // '#f59e0b'

   // ✅ NEW (correct):
   import { FIRE_COLORS } from '../types';
   const color = FIRE_COLORS.primary; // '#ff6b35'
   ```

2. **Verify opacity values:**
   ```typescript
   // In your animation component
   <motion.div
     animate={{ opacity: [0, 0.8, 0] }}  // Check final opacity isn't too low
     style={{
       background: FIRE_COLORS.primary,
       opacity: 0.8  // This combines with animate opacity!
     }}
   />
   ```

3. **Check for blend mode conflicts:**
   ```typescript
   // Search your animation component for mixBlendMode
   style={{
     mixBlendMode: 'screen'  // Can wash out colors
   }}
   ```

**Solutions:**

**Use Correct Color Palette:**
```typescript
// At top of your animation file
import {
  FIRE_COLORS,
  ICE_COLORS,
  LIGHTNING_COLORS,
  HOLY_COLORS,
  ARCANE_COLORS,
  POISON_COLORS
} from '../types';

// Use in animations
<motion.div
  style={{
    background: `radial-gradient(circle, ${FIRE_COLORS.primary}, ${FIRE_COLORS.secondary})`,
    boxShadow: `0 0 20px ${FIRE_COLORS.accent}`
  }}
/>
```

**Avoid Double Opacity:**
```typescript
// ❌ BAD: opacity compounds
<motion.div
  animate={{ opacity: [0, 0.5, 0] }}
  style={{ opacity: 0.5 }}  // Effective opacity: 0.5 * 0.5 = 0.25
/>

// ✅ GOOD: use only one opacity source
<motion.div
  animate={{ opacity: [0, 0.8, 0] }}
  // No style opacity
/>
```

**Color Reference:**
```typescript
// Fire: Orange/red/yellow
FIRE_COLORS.primary    // '#ff6b35' - Orange
FIRE_COLORS.secondary  // '#ff4444' - Red
FIRE_COLORS.accent     // '#ffaa00' - Yellow-orange

// Ice: Blue/light blue/white
ICE_COLORS.primary     // '#4da6ff' - Blue
ICE_COLORS.secondary   // '#b3e0ff' - Light blue
ICE_COLORS.accent      // '#ffffff' - White

// Lightning: Yellow/light yellow/white
LIGHTNING_COLORS.primary   // '#ffeb3b' - Yellow
LIGHTNING_COLORS.secondary // '#fff176' - Light yellow
LIGHTNING_COLORS.accent    // '#ffffff' - White

// Holy: Gold/light gold/white
HOLY_COLORS.primary    // '#ffd700' - Gold
HOLY_COLORS.secondary  // '#ffffcc' - Light gold
HOLY_COLORS.accent     // '#ffffff' - White

// Arcane: Purple/light purple/dark purple
ARCANE_COLORS.primary    // '#9c27b0' - Purple
ARCANE_COLORS.secondary  // '#ba68c8' - Light purple
ARCANE_COLORS.accent     // '#4a148c' - Dark purple
```

---

### Particles Aren't Rendering

**Symptom:** Main animation works, but particle effects (sparkles, embers, etc.) don't appear.

**Likely Causes:**
1. Particle count is zero or undefined
2. Particle size too small (invisible)
3. Particles positioned off-screen
4. Opacity animation makes particles invisible too quickly
5. Key prop missing on particle array (React not rendering updates)

**Step-by-Step Diagnosis:**

1. **Check particle count validation:**
   ```javascript
   // Look for validation warnings in console
   // "⚠️ [MyAnimation - charge] Particle count (0) ..."
   ```

2. **Verify particle array generation:**
   ```typescript
   // Add logging to your component
   const particles = Array.from({ length: particleCount }, (_, i) => {
     console.log('Generating particle', i);
     return { id: i, angle: (i * 360) / particleCount, ... };
   });
   console.log('Total particles:', particles.length);
   ```

3. **Inspect particle element in DOM:**
   - Open DevTools Elements tab
   - Search for particle divs
   - Check computed styles (size, position, opacity)

**Solutions:**

**Use Particle Count Validation:**
```typescript
import { validateParticleCount } from '../types';

// Inside your component
const particleCount = 15;
validateParticleCount(particleCount, 'MyAnimation', 'charge');

// Ensure count is reasonable (max 30, recommended max 20)
```

**Ensure Particles Have Proper Size:**
```typescript
// ❌ BAD: particles too small
{particles.map((p, i) => (
  <motion.div
    key={i}
    style={{
      width: 1,   // Too small!
      height: 1,
      // ...
    }}
  />
))}

// ✅ GOOD: visible particle size
{particles.map((p, i) => (
  <motion.div
    key={i}
    style={{
      width: 8,   // Visible size
      height: 8,
      borderRadius: '50%',
      // ...
    }}
  />
))}
```

**Always Use Key Prop:**
```typescript
// ❌ BAD: no key prop
{particles.map((p, i) => (
  <motion.div>...</motion.div>
))}

// ✅ GOOD: unique key prop
{particles.map((p, i) => (
  <motion.div key={`particle-${i}`}>...</motion.div>
))}

// ✅ BETTER: stable unique identifier
{particles.map((p) => (
  <motion.div key={p.id}>...</motion.div>
))}
```

---

### Animation Appears But Doesn't Animate (Frozen)

**Symptom:** Animation component renders, but nothing moves or fades (static image).

**Likely Causes:**
1. `animate` prop not set or empty
2. Motion components not imported from `framer-motion`
3. Initial and animate states are identical
4. Transition duration is zero
5. Component not wrapped in AnimatePresence when needed

**Step-by-Step Diagnosis:**

1. **Verify Framer Motion imports:**
   ```typescript
   // At top of file
   import { motion, AnimatePresence } from 'framer-motion';

   // NOT just 'div':
   <motion.div>  // ✅ Correct
   <div>         // ❌ Won't animate
   ```

2. **Check animate prop exists:**
   ```typescript
   // Add logging
   const animateProps = {
     opacity: [0, 1, 0],
     scale: [0.5, 1, 0.5]
   };
   console.log('Animation props:', animateProps);

   <motion.div animate={animateProps} />
   ```

3. **Verify state changes:**
   ```typescript
   // Initial and animate must be different
   <motion.div
     initial={{ opacity: 0 }}    // Start state
     animate={{ opacity: 1 }}    // End state (must differ!)
     transition={{ duration: 0.5 }}
   />
   ```

**Solutions:**

**Correct Framer Motion Usage:**
```typescript
import { motion } from 'framer-motion';

// ✅ CORRECT: motion component with animate prop
<motion.div
  animate={{
    opacity: [0, 1, 0.8, 0],
    scale: [0.5, 1.2, 1, 0]
  }}
  transition={{
    duration: 1.0,
    times: [0, 0.3, 0.7, 1]  // Optional: control keyframe timing
  }}
  style={{
    width: 50,
    height: 50,
    background: FIRE_COLORS.primary
  }}
/>
```

**Use AnimatePresence for Mount/Unmount:**
```typescript
import { motion, AnimatePresence } from 'framer-motion';

// For components that appear/disappear
<AnimatePresence>
  {isVisible && (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.3 }}
    />
  )}
</AnimatePresence>
```

**Verify Transition Duration:**
```typescript
// ❌ BAD: no animation visible
<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: 0 }}  // Instant!
/>

// ✅ GOOD: visible animation
<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4 }}  // 400ms animation
/>
```

---

### Animation Flickers or Stutters Visually

**Symptom:** Animation plays but appears jerky, jumpy, or has visible frame drops.

**Likely Causes:**
1. Using non-GPU-accelerated CSS properties
2. Too many particles (>30)
3. Heavy blur filters (>8px)
4. Animating layout-triggering properties (width, height, left, top)
5. Component re-rendering during animation

**Step-by-Step Diagnosis:**

1. **Open Chrome DevTools Performance tab:**
   - Click Record
   - Cast spell
   - Stop recording
   - Look for long frames (>16ms = <60fps)
   - Check for "Layout" or "Paint" events (bad!)

2. **Check particle count:**
   ```javascript
   // Look for validation warnings
   // "⚠️ [MyAnimation] Particle count (35) exceeds recommended max (20)"
   ```

3. **Audit animated properties:**
   ```typescript
   // ❌ BAD: triggers layout/paint
   animate={{
     width: 100,      // Causes layout reflow
     left: 400,       // Causes layout reflow
     backgroundColor: 'red'  // Causes paint
   }}

   // ✅ GOOD: GPU-accelerated only
   animate={{
     scale: 2,        // GPU: transform
     x: 400,          // GPU: transform
     opacity: 0.5     // GPU: opacity
   }}
   ```

**Solutions:**

**Use Only GPU-Accelerated Properties:**
```typescript
// ✅ ALLOWED (GPU-accelerated):
// - transform (x, y, scale, rotate, scaleX, scaleY, rotateX, rotateZ)
// - opacity

// ❌ FORBIDDEN (triggers layout/paint):
// - width, height
// - left, top, right, bottom
// - background, backgroundColor
// - box-shadow (when animated)
// - border, borderRadius (when animated)

// CORRECT EXAMPLE:
<motion.div
  animate={{
    x: [0, 100, 50],           // ✅ transform: translateX
    y: [0, -50, 0],            // ✅ transform: translateY
    scale: [1, 1.5, 1],        // ✅ transform: scale
    rotate: [0, 180, 360],     // ✅ transform: rotate
    opacity: [0, 1, 0.8]       // ✅ opacity
  }}
/>
```

**Reduce Particle Count:**
```typescript
import { validateParticleCount } from '../types';

// ❌ TOO MANY:
const chargeParticles = 50;  // Will cause lag

// ✅ OPTIMAL:
const chargeParticles = 15;   // Smooth performance
validateParticleCount(chargeParticles, 'FireballAnimation', 'charge');

// HARD LIMIT: 30 particles max per effect
// RECOMMENDED: 20 particles max for best performance
```

**Limit Blur Filter Usage:**
```typescript
// ❌ HEAVY BLUR:
filter: 'blur(20px)'  // Very expensive

// ✅ LIGHT BLUR:
filter: 'blur(6px)'   // Acceptable performance

// GUIDELINE: Keep blur radius ≤ 8px
```

**Wrap with React.memo:**
```typescript
import React from 'react';

// ✅ Prevents unnecessary re-renders
export const MyAnimation = React.memo<AnimationComponentProps>(({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  // Component code
});
```

---

## Performance Issues

### Animation Causes Frame Drops (<60fps)

**Symptom:** Browser DevTools shows frame rate dropping below 60fps during animation.

**Step-by-Step Diagnosis:**

1. **Open Chrome DevTools Performance Profiler:**
   ```
   1. Open DevTools (F12)
   2. Click "Performance" tab
   3. Click record button (circle)
   4. Cast the problematic spell
   5. Stop recording
   6. Analyze the flame chart
   ```

2. **Look for red bars in timeline:**
   - Red = frames that exceeded 16ms (60fps budget exceeded)
   - Hover over long frames to see what caused the delay

3. **Check console for performance warnings:**
   ```
   ⚠️ [Performance] AnimationController-render took 8.5ms (target: <5ms)
   ⚠️ [MyAnimation - charge] Particle count (35) exceeds recommended max (20)
   ```

4. **Use React DevTools Profiler:**
   ```
   1. Open React DevTools
   2. Click "Profiler" tab
   3. Start recording
   4. Cast spell
   5. Stop recording
   6. Look for components that took >5ms to render
   ```

**Common Causes and Solutions:**

**Too Many Particles:**
```typescript
// BEFORE (laggy):
const chargeParticles = 40;  // Too many
const impactParticles = 50;  // Way too many

// AFTER (smooth):
const chargeParticles = 15;  // Optimal
const impactParticles = 20;  // Still good

// Always validate:
validateParticleCount(chargeParticles, 'MyAnimation', 'charge');
```

**Non-GPU Properties:**
```typescript
// BEFORE (triggers paint):
<motion.div
  animate={{
    width: [100, 200, 100],        // ❌ Layout reflow
    backgroundColor: ['#ff0000', '#00ff00']  // ❌ Paint
  }}
/>

// AFTER (GPU-accelerated):
<motion.div
  animate={{
    scaleX: [1, 2, 1],    // ✅ transform
    opacity: [1, 0.5, 1]  // ✅ opacity
  }}
  style={{
    background: '#ff0000'  // Static color (not animated)
  }}
/>
```

**Heavy Blur Filters:**
```typescript
// BEFORE:
filter: 'blur(25px)'  // Very expensive

// AFTER:
filter: 'blur(6px)'   // Much better

// OR REMOVE:
// No filter, use multiple layers with opacity instead
```

**Missing Memoization:**
```typescript
// BEFORE:
export const MyAnimation: React.FC<AnimationComponentProps> = (props) => {
  // Re-renders on every parent update
};

// AFTER:
export const MyAnimation = React.memo<AnimationComponentProps>((props) => {
  // Only re-renders when props change
});
```

**Optimization Checklist:**
- [ ] Particle count ≤ 20 (max 30)
- [ ] Only animating `transform` and `opacity`
- [ ] Blur filters ≤ 8px radius
- [ ] Component wrapped with `React.memo()`
- [ ] Using `useCallback` for event handlers
- [ ] No layout-triggering properties animated
- [ ] Static properties not in `animate` prop

---

### Animation Causes Memory Leaks

**Symptom:** Browser memory increases during combat and doesn't decrease. Eventually causes lag or crashes.

**Step-by-Step Diagnosis:**

1. **Open Chrome DevTools Memory tab:**
   ```
   1. DevTools → Memory
   2. Take heap snapshot (baseline)
   3. Cast 10 spells
   4. Take another heap snapshot
   5. Compare (look for retained objects)
   ```

2. **Check for cleanup issues:**
   ```typescript
   // In your animation component
   useEffect(() => {
     // Setup code

     return () => {
       // ❓ Is there cleanup code here?
       // Should clean up intervals, timeouts, subscriptions
     };
   }, []);
   ```

3. **Monitor AnimationController queue:**
   ```javascript
   // In browser console during combat
   // Look for warnings:
   // "⚠️ [AnimationController] Queue full (5). Dropping animation"
   ```

**Common Causes and Solutions:**

**Missing Cleanup in useEffect:**
```typescript
// ❌ BAD: interval never cleared
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Running...');
  }, 1000);
  // No cleanup!
}, []);

// ✅ GOOD: cleanup on unmount
useEffect(() => {
  const interval = setInterval(() => {
    console.log('Running...');
  }, 1000);

  return () => {
    clearInterval(interval);  // Cleanup
  };
}, []);
```

**Animation Queue Overflow:**
```typescript
// AnimationController has MAX_QUEUE_SIZE = 5
// If queue fills up, old animations drop automatically
// This is expected behavior, not a leak

// If you see constant queue full warnings:
// 1. Check if onComplete is being called
// 2. Verify animations aren't infinite loops
// 3. Reduce animation frequency
```

**onComplete Not Called:**
```typescript
// ❌ BAD: animation never completes
export const MyAnimation = React.memo<AnimationComponentProps>(({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete  // ❌ Never called!
}) => {
  return (
    <motion.div animate={{ opacity: 1 }}>
      {/* No call to onComplete */}
    </motion.div>
  );
});

// ✅ GOOD: onComplete called after animation
export const MyAnimation = React.memo<AnimationComponentProps>(({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();  // ✅ Called after total duration
    }, TOTAL_DURATION);

    return () => clearTimeout(timer);  // ✅ Cleanup
  }, [onComplete]);

  return (
    <motion.div animate={{ opacity: [0, 1, 0] }} />
  );
});
```

**Event Listener Leaks:**
```typescript
// ❌ BAD: listener never removed
useEffect(() => {
  const handleClick = () => { /* ... */ };
  document.addEventListener('click', handleClick);
  // No cleanup!
}, []);

// ✅ GOOD: listener removed on unmount
useEffect(() => {
  const handleClick = () => { /* ... */ };
  document.addEventListener('click', handleClick);

  return () => {
    document.removeEventListener('click', handleClick);
  };
}, []);
```

---

### Browser Becomes Unresponsive During Animation

**Symptom:** Entire browser tab freezes or becomes very slow during animation playback.

**Likely Causes:**
1. Synchronous blocking operation in animation code
2. Infinite loop in useEffect
3. Excessive DOM manipulation
4. Extremely high particle count (>100)
5. Running animations at <16ms frame time

**Step-by-Step Diagnosis:**

1. **Check console for errors immediately before freeze**

2. **Look for infinite loops:**
   ```typescript
   // Search your code for useEffect without dependencies
   useEffect(() => {
     setState(newValue);  // ⚠️ Could cause infinite loop
   }); // ❌ No dependency array!
   ```

3. **Profile with Performance Monitor:**
   ```
   Chrome → DevTools → Performance Monitor
   Watch "CPU Usage" and "JS Heap Size" during animation
   Spike to 100% CPU = blocking operation
   ```

**Solutions:**

**Fix Infinite useEffect Loops:**
```typescript
// ❌ INFINITE LOOP:
useEffect(() => {
  setCount(count + 1);  // Updates count, triggers effect again!
});

// ✅ CORRECT: add dependencies
useEffect(() => {
  setCount(count + 1);
}, []);  // Runs once on mount

// ✅ BETTER: don't update state in effect unless necessary
useEffect(() => {
  // Only update if condition met
  if (needsUpdate) {
    setCount(newCount);
  }
}, [needsUpdate, newCount]);
```

**Limit Particle Count:**
```typescript
// ❌ CATASTROPHIC:
const particles = Array.from({ length: 500 }, ...);  // 500 particles!

// ✅ SAFE:
const MAX_PARTICLES = 30;
const particleCount = Math.min(desiredCount, MAX_PARTICLES);
validateParticleCount(particleCount, 'MyAnimation');
```

**Batch DOM Updates:**
```typescript
// ❌ BAD: individual state updates
particles.forEach(p => {
  setParticlePosition(p.id, newPos);  // Multiple re-renders
});

// ✅ GOOD: single batched update
const newPositions = particles.map(p => calculatePos(p));
setParticlePositions(newPositions);  // One re-render
```

---

### Animation Works on Desktop but Lags on Mobile

**Symptom:** Smooth 60fps on desktop, but choppy <30fps on mobile devices.

**Likely Causes:**
1. Mobile GPU less powerful
2. Too many particle effects for mobile
3. High-resolution effects (retina display scaling)
4. Mobile browser throttling
5. Background apps consuming resources

**Step-by-Step Diagnosis:**

1. **Test on real mobile device (not emulator):**
   ```
   1. Connect phone to same network as dev machine
   2. Find your computer's local IP (ipconfig/ifconfig)
   3. On phone, browse to http://YOUR_IP:3000
   4. Test animation performance
   ```

2. **Use Chrome Remote Debugging:**
   ```
   1. Connect Android device via USB
   2. Chrome → chrome://inspect
   3. Inspect your device
   4. Use Performance profiler on mobile
   ```

3. **Simulate mobile CPU throttling:**
   ```
   Chrome DevTools → Performance tab → Gear icon
   CPU: 6x slowdown
   Test animation
   ```

**Solutions:**

**Reduce Particle Count for Mobile:**
```typescript
const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);

const particleCount = isMobile ? 10 : 20;  // Half for mobile
validateParticleCount(particleCount, 'MyAnimation');
```

**Simplify Effects for Mobile:**
```typescript
const shouldSimplify = isMobile || window.innerWidth < 768;

return (
  <motion.div>
    {/* Main animation always renders */}

    {!shouldSimplify && (
      // Complex particles only on desktop
      <ComplexParticleEffect />
    )}
  </motion.div>
);
```

**Reduce Blur on Mobile:**
```typescript
const blurAmount = isMobile ? 'blur(3px)' : 'blur(6px)';

style={{ filter: blurAmount }}
```

**Use will-change Sparingly:**
```typescript
// Can help mobile GPU optimization
// But don't overuse (limits GPU memory)
style={{
  willChange: 'transform, opacity'  // Only for frequently animated elements
}}
```

---

## Integration Issues

### Animation Doesn't Trigger from Combat

**Symptom:** You attack/cast spell, but animation never starts. Combat continues normally with damage showing.

**Likely Causes:**
1. AnimationController not integrated in Combat.tsx
2. Spell ID mismatch between combat and registry
3. `isActive` prop not set correctly
4. Animation not imported/registered
5. Combat flow bypassing animation trigger

**Step-by-Step Diagnosis:**

1. **Check if AnimationController is rendered:**
   ```typescript
   // In Combat.tsx, search for:
   <AnimationController
     attackType={currentAttack}
     attackData={attackData}
     onComplete={handleAnimationComplete}
     isActive={showAnimation}
   />

   // If not found, AnimationController not integrated
   ```

2. **Verify spell ID matching:**
   ```typescript
   // In Combat.tsx
   console.log('Attack type:', currentAttack);  // e.g., "fire"

   // In animationRegistry.ts
   export const ATTACK_ANIMATION_MAP = {
     fire: { ... },  // ✅ Must match exactly
     Fire: { ... },  // ❌ Case mismatch
   };
   ```

3. **Check isActive prop:**
   ```typescript
   // Add logging in Combat.tsx
   console.log('Animation active?', showAnimation);
   // Should be true when animation should play
   ```

**Solutions:**

**Integrate AnimationController:**
```typescript
// In Combat.tsx
import { AnimationController } from './animations/AnimationController';

export const Combat: React.FC<CombatProps> = () => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentAttack, setCurrentAttack] = useState<string | null>(null);
  const [attackData, setAttackData] = useState(null);

  const handlePlayerAttack = (spellId: string) => {
    // Calculate positions
    const data = {
      casterX: playerElement?.offsetLeft ?? 100,
      casterY: playerElement?.offsetTop ?? 200,
      targetX: enemyElement?.offsetLeft ?? 400,
      targetY: enemyElement?.offsetTop ?? 300
    };

    // Trigger animation
    setCurrentAttack(spellId);
    setAttackData(data);
    setShowAnimation(true);
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    // Apply damage, continue combat
    applyDamage();
  };

  return (
    <div className="combat-container" style={{ position: 'relative' }}>
      {/* Combat UI */}

      {/* Animation Layer */}
      {showAnimation && currentAttack && attackData && (
        <AnimationController
          attackType={currentAttack}
          attackData={attackData}
          onComplete={handleAnimationComplete}
          isActive={showAnimation}
        />
      )}
    </div>
  );
};
```

**Fix Spell ID Mismatch:**
```typescript
// In public/data/spells.js
export const SPELLS = {
  fireball: {
    id: 'fire',  // ← This is what Combat.tsx uses
    name: 'Fireball',
    // ...
  }
};

// In animationRegistry.ts
export const ATTACK_ANIMATION_MAP: Record<string, AnimationMetadata> = {
  fire: {  // ✅ Matches spell.id
    component: FireballAnimation,
    element: 'fire',
    type: 'projectile'
  }
};
```

---

### Animation Plays But onComplete Never Fires

**Symptom:** Animation plays fully, but combat gets stuck. Damage never applies, next turn never happens.

**Likely Causes:**
1. onComplete callback not called in animation component
2. useEffect cleanup canceling the completion call
3. Error in onComplete handler (caught silently)
4. Timeout/duration mismatch
5. Animation component unmounted before calling onComplete

**Step-by-Step Diagnosis:**

1. **Add logging to onComplete:**
   ```typescript
   // In Combat.tsx
   const handleAnimationComplete = () => {
     console.log('✅ Animation completed callback fired');
     // ... rest of logic
   };
   ```

2. **Check animation component's onComplete call:**
   ```typescript
   // In MyAnimation.tsx
   useEffect(() => {
     console.log('⏰ Setting completion timer for', TOTAL_DURATION, 'ms');
     const timer = setTimeout(() => {
       console.log('⏰ Timer fired, calling onComplete');
       onComplete();
     }, TOTAL_DURATION);

     return () => {
       console.log('🧹 Cleanup: clearing timer');
       clearTimeout(timer);
     };
   }, [onComplete]);
   ```

3. **Verify total duration matches animation:**
   ```typescript
   // Durations should add up
   const CHARGE_DURATION = 400;
   const CAST_DURATION = 200;
   const TRAVEL_DURATION = 300;
   const IMPACT_DURATION = 150;
   const TOTAL_DURATION = 1050;  // Must equal sum of all phases
   ```

**Solutions:**

**Ensure onComplete is Called:**
```typescript
export const MyAnimation = React.memo<AnimationComponentProps>(({
  casterX,
  casterY,
  targetX,
  targetY,
  onComplete
}) => {
  const TOTAL_DURATION = 1000;

  useEffect(() => {
    // Set timer for total animation duration
    const completionTimer = setTimeout(() => {
      onComplete();  // ✅ Must call this
    }, TOTAL_DURATION);

    return () => {
      clearTimeout(completionTimer);
    };
  }, [onComplete]);  // Include onComplete in deps

  return (
    <motion.div>
      {/* Animation phases */}
    </motion.div>
  );
});
```

**Handle onComplete Errors:**
```typescript
// In AnimationController.tsx (already implemented)
const handleAnimationComplete = useCallback(() => {
  try {
    console.log('✅ Animation complete');
    onComplete();  // Call parent's callback
  } catch (error) {
    console.error('🚨 Error in onComplete:', error);
    // Still call it to prevent stuck state
    onComplete();
  }
}, [onComplete]);
```

**Verify Duration Calculation:**
```typescript
// Define phase durations
const CHARGE_DURATION = 400;
const CAST_DURATION = 200;
const TRAVEL_DURATION = 300;
const IMPACT_DURATION = 150;

// Calculate total
const TOTAL_DURATION =
  CHARGE_DURATION +
  CAST_DURATION +
  TRAVEL_DURATION +
  IMPACT_DURATION;
// = 1050ms

// Use in timing validation
console.assert(
  TOTAL_DURATION === 1050,
  'Total duration mismatch!'
);
```

---

### Multiple Animations Interfere with Each Other

**Symptom:** When casting multiple spells rapidly, animations overlap incorrectly or behave strangely.

**Likely Causes:**
1. AnimationController queue not working correctly
2. Multiple AnimationController instances rendered
3. Shared state between animations
4. React key prop issues
5. Animation cleanup not happening

**Step-by-Step Diagnosis:**

1. **Check for multiple AnimationController instances:**
   ```typescript
   // In Combat.tsx - should only have ONE:
   <AnimationController ... />  // ✅ Only one

   // NOT:
   <AnimationController ... />
   <AnimationController ... />  // ❌ Multiple instances
   ```

2. **Verify queue system is working:**
   ```javascript
   // In console, cast 5 spells rapidly
   // Look for queue messages:
   // "⏸️ [AnimationController] Queueing animation: fire (queue size: 1/5)"
   // "🎬 [AnimationController] Processing queued animation: fire (0 remaining)"
   ```

3. **Check for shared state:**
   ```typescript
   // ❌ BAD: global variable shared between instances
   let particlePositions = [];

   export const MyAnimation = () => {
     particlePositions.push(...);  // Shared across all instances!
   };

   // ✅ GOOD: component-local state
   export const MyAnimation = () => {
     const [particlePositions, setParticlePositions] = useState([]);
   };
   ```

**Solutions:**

**Ensure Single AnimationController:**
```typescript
// In Combat.tsx
return (
  <div className="combat-container">
    {/* Combat UI */}

    {/* Only ONE AnimationController */}
    {showAnimation && (
      <AnimationController
        attackType={currentAttack}
        attackData={attackData}
        onComplete={handleAnimationComplete}
        isActive={showAnimation}
      />
    )}
  </div>
);
```

**Trust the Queue System:**
```typescript
// AnimationController handles queuing automatically
// MAX_QUEUE_SIZE = 5
// Animations process sequentially
// No action needed on your part

// If you need more than 5 queued, modify AnimationController:
const MAX_QUEUE_SIZE = 10;  // Increase limit
```

**Use Local State Only:**
```typescript
// ✅ CORRECT: each instance has its own state
export const MyAnimation = React.memo<AnimationComponentProps>((props) => {
  const [particles, setParticles] = useState(() =>
    Array.from({ length: 15 }, (_, i) => ({ id: i, ... }))
  );

  // State is local to this component instance
  // Multiple instances won't interfere

  return <motion.div>...</motion.div>;
});
```

---

### Animation Breaks Combat Flow

**Symptom:** After animation plays, combat state is incorrect (wrong turn, damage not applied, etc.).

**Likely Causes:**
1. onComplete called multiple times
2. onComplete not called at all
3. State update during animation causes re-render
4. Race condition between animation and combat logic

**Step-by-Step Diagnosis:**

1. **Check how many times onComplete is called:**
   ```typescript
   // In Combat.tsx
   let completeCount = 0;
   const handleAnimationComplete = () => {
     completeCount++;
     console.log('onComplete called:', completeCount, 'times');
     // Should be 1
   };
   ```

2. **Verify combat state before/after animation:**
   ```typescript
   const handlePlayerAttack = () => {
     console.log('Before animation:', { turn, playerHP, enemyHP });
     startAnimation();
   };

   const handleAnimationComplete = () => {
     console.log('After animation:', { turn, playerHP, enemyHP });
     applyDamage();
   };
   ```

**Solutions:**

**Prevent Multiple onComplete Calls:**
```typescript
export const MyAnimation = React.memo<AnimationComponentProps>((props) => {
  const completedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        props.onComplete();  // Only called once
      }
    }, TOTAL_DURATION);

    return () => {
      clearTimeout(timer);
    };
  }, [props.onComplete]);

  return <motion.div>...</motion.div>;
});
```

**Ensure Proper Combat Flow:**
```typescript
// In Combat.tsx
const [isCombatLocked, setIsCombatLocked] = useState(false);

const handlePlayerAttack = (spellId: string) => {
  if (isCombatLocked) return;  // Prevent actions during animation

  setIsCombatLocked(true);
  startAnimation(spellId);
};

const handleAnimationComplete = () => {
  // Apply combat results
  applyDamage(calculatedDamage);

  // Next turn
  advanceTurn();

  // Unlock combat
  setIsCombatLocked(false);
};
```

---

### Critical Hits Don't Show Enhanced Animations

**Symptom:** Critical hits don't look different from normal hits.

**Likely Cause:**
Animation component doesn't check or use `isCritical` prop.

**Solution:**

```typescript
export const MyAnimation = React.memo<AnimationComponentProps>(({
  casterX,
  casterY,
  targetX,
  targetY,
  damage,
  isCritical,  // ✅ Use this prop
  onComplete
}) => {
  // Scale up effects for crits
  const impactScale = isCritical ? 2.5 : 1.5;
  const particleCount = isCritical ? 25 : 15;
  const shakeIntensity = isCritical ? 15 : 8;

  return (
    <>
      {/* Impact explosion */}
      <motion.div
        animate={{
          scale: [0, impactScale, impactScale + 0.3],  // Bigger for crits
          opacity: [0, 1, 0]
        }}
        style={{
          background: isCritical
            ? 'radial-gradient(circle, #ffff00, #ff0000)'  // Gold/red
            : 'radial-gradient(circle, #ff6b35, #ff4444)'  // Normal
        }}
      />

      {/* More particles for crits */}
      {Array.from({ length: particleCount }, (_, i) => (
        <Particle key={i} />
      ))}

      {/* Screen shake */}
      <motion.div
        animate={{
          x: [0, shakeIntensity, -shakeIntensity, 0],  // More shake for crits
          y: [0, shakeIntensity/2, -shakeIntensity/2, 0]
        }}
      />
    </>
  );
});
```

---

## TypeScript/Build Errors

### Type Errors in Animation Components

**Common TypeScript Errors:**

**Error:** `Property 'isCritical' does not exist on type 'AnimationComponentProps'`

**Cause:** Using props not defined in the interface.

**Solution:**
```typescript
// Check AnimationComponentProps interface in animationRegistry.ts
export interface AnimationComponentProps {
  casterX: number;
  casterY: number;
  targetX: number;
  targetY: number;
  onComplete: () => void;
  damage?: number;       // Optional
  isCritical?: boolean;  // Optional
  element?: string;      // Optional
}

// Use optional props safely
const damage = props.damage ?? 0;
const isCritical = props.isCritical ?? false;
```

---

**Error:** `Type 'null' is not assignable to type 'AnimationMetadata'`

**Cause:** Not handling null return from `getAnimationMetadata()`.

**Solution:**
```typescript
// ❌ BAD:
const metadata = getAnimationMetadata(attackType);
const Component = metadata.component;  // Error if null

// ✅ GOOD:
const metadata = getAnimationMetadata(attackType) ?? DEFAULT_ANIMATION;
const Component = metadata.component;  // Always defined
```

---

**Error:** `Cannot find module './variants/MyAnimation'`

**Cause:** File not exported or path incorrect.

**Solution:**
```typescript
// In MyAnimation.tsx
export const MyAnimation = React.memo<AnimationComponentProps>(({ ... }) => {
  // ...
});

// In animationRegistry.ts
import { MyAnimation } from './variants/MyAnimation';  // ✅ Correct path

// NOT:
import MyAnimation from './variants/MyAnimation';  // ❌ Wrong (missing curly braces)
```

---

### Import/Export Errors

**Error:** `Attempted import error: 'FIRE_COLORS' is not exported from '../types'`

**Solution:**
```typescript
// In types.ts - ensure exports:
export const FIRE_COLORS = {
  primary: '#ff6b35',
  secondary: '#ff4444',
  accent: '#ffaa00'
};

// In your animation file:
import { FIRE_COLORS } from '../types';  // ✅ Named import
```

---

**Error:** `Module '"framer-motion"' has no exported member 'AnimatePresence'`

**Cause:** Framer Motion not installed or wrong version.

**Solution:**
```bash
# Check installed version
npm list framer-motion

# Install/update
npm install framer-motion@latest

# Verify import
import { motion, AnimatePresence } from 'framer-motion';
```

---

### Registry Type Mismatches

**Error:** `Type '{ component: FC; element: string; }' is not assignable to type 'AnimationMetadata'`

**Cause:** Missing required properties in metadata.

**Solution:**
```typescript
// In animationRegistry.ts
export interface AnimationMetadata {
  component: React.ComponentType<AnimationComponentProps>;
  element: 'fire' | 'ice' | 'lightning' | 'holy' | 'arcane';
  type: 'projectile' | 'beam' | 'aoe' | 'melee' | 'buff';
}

// ✅ CORRECT registration:
export const ATTACK_ANIMATION_MAP: Record<string, AnimationMetadata> = {
  fire: {
    component: FireballAnimation,  // ✅ React component
    element: 'fire',               // ✅ Valid element type
    type: 'projectile'             // ✅ Valid animation type
  }
};
```

---

### Framer Motion Type Issues

**Error:** `Type '{ opacity: number[]; scale: number[]; }' is not assignable to type 'TargetAndTransition'`

**Cause:** Incorrect keyframe array types.

**Solution:**
```typescript
// ✅ CORRECT:
<motion.div
  animate={{
    opacity: [0, 1, 0],         // number[]
    scale: [0.5, 1, 0.5],       // number[]
    x: [0, 100, 0]              // number[]
  }}
/>

// ❌ INCORRECT:
<motion.div
  animate={{
    opacity: ['0', '1', '0'],   // string[] - wrong type
    scale: [0.5, 1],            // Too few values
    x: 100                      // Not an array (but this actually works for single value)
  }}
/>
```

---

## Logic/Timing Issues

### Animation Duration Doesn't Match Specification

**Symptom:** Animation completes faster or slower than expected (e.g., Fireball should be 950ms but takes 1200ms).

**Diagnosis:**
```typescript
// In browser console
// Look for timing logs:
// "🎬 [Animation Timing] fire started at 12345.67ms"
// "✅ [Animation Timing] fire completed in 1203.45ms"
```

**Common Causes:**

1. **Phase durations don't add up:**
```typescript
// ❌ WRONG:
const CHARGE = 400;
const CAST = 200;
const TRAVEL = 300;
const IMPACT = 150;
const TOTAL = 1000;  // Should be 1050!

// ✅ CORRECT:
const TOTAL = CHARGE + CAST + TRAVEL + IMPACT;  // 1050
```

2. **Transition times property mismatch:**
```typescript
// ❌ WRONG:
animate={{
  opacity: [0, 0.5, 1, 0.5, 0],  // 5 keyframes
  scale: [0, 1, 0]                // 3 keyframes
}}
transition={{
  duration: 1.0,
  times: [0, 0.25, 0.5, 0.75, 1]  // 5 times (matches opacity but not scale)
}}

// ✅ CORRECT:
animate={{
  opacity: [0, 1, 0],  // 3 keyframes
  scale: [0, 1, 0]     // 3 keyframes
}}
transition={{
  duration: 1.0,
  times: [0, 0.5, 1]   // 3 times (matches both)
}}
```

3. **Delay accumulation:**
```typescript
// ❌ CUMULATIVE DELAYS:
<motion.div
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 0.5 }}  // Ends at 1.0s
/>
<motion.div
  animate={{ opacity: 1 }}
  transition={{ delay: 1.0, duration: 0.5 }}  // Ends at 1.5s
/>
// Total: 1.5s (delays overlap with phases)

// ✅ SEQUENTIAL DELAYS:
<motion.div
  animate={{ opacity: 1 }}
  transition={{ delay: 0, duration: 0.5 }}  // 0-0.5s
/>
<motion.div
  animate={{ opacity: 1 }}
  transition={{ delay: 0.5, duration: 0.5 }}  // 0.5-1.0s
/>
// Total: 1.0s (phases sequential, no gap)
```

**Solution Pattern:**
```typescript
// Define all phase durations
const TIMINGS = {
  charge: 400,
  cast: 200,
  travel: 300,
  impact: 150
};

// Calculate total
const TOTAL_DURATION = Object.values(TIMINGS).reduce((a, b) => a + b, 0);
console.assert(TOTAL_DURATION === 1050, 'Duration mismatch!');

// Use in transitions
<motion.div
  animate={{ opacity: [0, 1, 0] }}
  transition={{
    duration: TIMINGS.charge / 1000,  // Convert ms to seconds
    delay: 0
  }}
/>

<motion.div
  animate={{ opacity: [0, 1, 0] }}
  transition={{
    duration: TIMINGS.travel / 1000,
    delay: (TIMINGS.charge + TIMINGS.cast) / 1000  // Start after previous phases
  }}
/>

// Call onComplete after total duration
useEffect(() => {
  const timer = setTimeout(onComplete, TOTAL_DURATION);
  return () => clearTimeout(timer);
}, [onComplete]);
```

---

### Phases Play Out of Order

**Symptom:** Impact happens before projectile reaches target, or effects trigger at wrong times.

**Cause:** Incorrect `delay` values in transition props.

**Solution:**
```typescript
// Define phase start times
const PHASE_START_TIMES = {
  charge: 0,
  cast: 400,      // Starts after charge
  travel: 600,    // Starts after charge + cast
  impact: 900     // Starts after charge + cast + travel
};

// Use in transitions
<motion.div
  // Charge phase (0-400ms)
  animate={{ opacity: [0, 1, 0] }}
  transition={{
    duration: 0.4,
    delay: PHASE_START_TIMES.charge / 1000
  }}
/>

<motion.div
  // Travel phase (600-900ms)
  animate={{ x: [casterX, targetX] }}
  transition={{
    duration: 0.3,
    delay: PHASE_START_TIMES.travel / 1000
  }}
/>

<motion.div
  // Impact phase (900-1050ms)
  animate={{ scale: [0, 2, 2.5] }}
  transition={{
    duration: 0.15,
    delay: PHASE_START_TIMES.impact / 1000
  }}
/>
```

---

### Animation Cuts Off Early

**Symptom:** Animation starts but disappears before completing all phases.

**Likely Causes:**
1. Component unmounted too early
2. AnimatePresence not used correctly
3. Conditional rendering removes component
4. onComplete called before animation finishes

**Solution:**

```typescript
// ❌ PROBLEM: Component unmounts immediately
{showAnimation && <MyAnimation onComplete={handleComplete} />}
// If showAnimation becomes false, component unmounts

// ✅ SOLUTION: Use AnimatePresence
<AnimatePresence>
  {showAnimation && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}  // Allows exit animation
      onAnimationComplete={handleComplete}
    >
      <MyAnimation />
    </motion.div>
  )}
</AnimatePresence>

// ✅ ALTERNATIVE: Keep mounted, control visibility
<MyAnimation
  onComplete={handleComplete}
  style={{ display: showAnimation ? 'block' : 'none' }}
/>
```

---

### Animation Repeats Unexpectedly

**Symptom:** Animation plays, completes, then starts over again.

**Likely Causes:**
1. Infinite loop in transition
2. State update triggers re-render
3. isActive prop toggling rapidly
4. Duplicate AnimationController instances

**Solution:**

```typescript
// ❌ INFINITE LOOP:
<motion.div
  animate={{ rotate: 360 }}
  transition={{
    repeat: Infinity,  // Never stops!
    duration: 1
  }}
/>

// ✅ CORRECT: No repeat (or finite repeat)
<motion.div
  animate={{ rotate: 360 }}
  transition={{
    duration: 1  // Plays once
  }}
/>

// ✅ IF YOU WANT REPEAT: Use repeatType and specific count
<motion.div
  animate={{ rotate: 360 }}
  transition={{
    repeat: 2,           // Only 3 total (original + 2 repeats)
    repeatType: 'loop',
    duration: 1
  }}
/>
```

---

### Delays Between Phases Feel Wrong

**Symptom:** There are awkward pauses or overlaps between animation phases.

**Cause:** Incorrect delay calculation or missing/extra transition times.

**Solution:**

Use a timing helper function:
```typescript
// Helper to calculate sequential phase timings
const createPhaseTimings = (phaseDurations: number[]) => {
  let cumulative = 0;
  return phaseDurations.map(duration => {
    const start = cumulative;
    cumulative += duration;
    return { start, duration, end: cumulative };
  });
};

// Define phase durations
const PHASES = createPhaseTimings([400, 200, 300, 150]);
// Returns:
// [
//   { start: 0,   duration: 400, end: 400 },   // Charge
//   { start: 400, duration: 200, end: 600 },   // Cast
//   { start: 600, duration: 300, end: 900 },   // Travel
//   { start: 900, duration: 150, end: 1050 }   // Impact
// ]

// Use in animations
<motion.div
  animate={{ opacity: [0, 1, 0] }}
  transition={{
    duration: PHASES[0].duration / 1000,
    delay: PHASES[0].start / 1000
  }}
/>

<motion.div
  animate={{ x: [casterX, targetX] }}
  transition={{
    duration: PHASES[2].duration / 1000,
    delay: PHASES[2].start / 1000
  }}
/>
```

---

## Error Messages Reference

### Animation System Error Messages

**Message:** `🚨 [AnimationController] Animation error for "fire", continuing combat`

**Meaning:** Animation component crashed during rendering.

**What Happened:**
- Error boundary caught a React error
- Animation was skipped
- Combat continued normally
- Damage was applied immediately

**Action:**
1. Check browser console for full error stack trace
2. Look at the failing animation component
3. Fix the bug causing the crash
4. Test animation in isolation

---

**Message:** `⚠️ [AnimationController] No animation found for attack type: "unknown_spell". Using fallback (Magic Bolt).`

**Meaning:** Spell/attack type not registered in animation registry.

**What Happened:**
- `getAnimationMetadata(attackType)` returned null
- System used DEFAULT_ANIMATION (Magic Bolt) as fallback
- Animation played successfully with fallback

**Action:**
1. Add animation to registry:
   ```typescript
   // In animationRegistry.ts
   import { MySpellAnimation } from './variants/MySpellAnimation';

   export const ATTACK_ANIMATION_MAP = {
     // ... existing
     unknown_spell: {
       component: MySpellAnimation,
       element: 'arcane',
       type: 'projectile'
     }
   };
   ```

---

**Message:** `⚠️ [AnimationController] Invalid position data for "fire": casterX: NaN`

**Meaning:** Position data contains invalid values (NaN, undefined, null).

**What Happened:**
- Position validation failed
- Animation was skipped entirely
- onComplete was called immediately
- Combat continued with instant result

**Action:**
1. Check position calculation in Combat.tsx
2. Ensure elements exist before getting offsetLeft/offsetTop
3. Provide fallback values:
   ```typescript
   const attackData = {
     casterX: playerElement?.offsetLeft ?? 100,
     casterY: playerElement?.offsetTop ?? 200,
     targetX: enemyElement?.offsetLeft ?? 400,
     targetY: enemyElement?.offsetTop ?? 300
   };
   ```

---

**Message:** `⚠️ [AnimationController] Position out of bounds for "fire": casterX: 99999`

**Meaning:** Position values are outside reasonable screen coordinates.

**What Happened:**
- Position validation detected out-of-bounds values
- Valid range: -1000 to 10000
- Animation was skipped
- onComplete called immediately

**Action:**
1. Check why position calculation is producing extreme values
2. Verify element references are correct
3. Check for CSS transform issues affecting position

---

**Message:** `⚠️ [Performance] AnimationController-render took 8.24ms (target: <5ms)`

**Meaning:** Component render time exceeded performance target.

**What Happened:**
- Render took longer than 5ms (but still acceptable)
- Warning logged in development mode
- Animation still played normally

**Action:**
1. Check if animation component is wrapped with React.memo
2. Verify useCallback/useMemo are used for callbacks
3. Reduce particle counts if excessive
4. Profile with React DevTools to find slow renders

---

**Message:** `⚠️ [Animation Timing] fire took longer than expected (2543.21ms > 2000ms)`

**Meaning:** Animation took significantly longer than its specified duration.

**What Happened:**
- Animation specified ~950ms total
- Actually took 2543ms (2.6x longer)
- Logged for debugging purposes
- Animation still completed normally

**Action:**
1. Check for browser performance throttling
2. Verify transition durations are correct
3. Look for blocking JavaScript operations
4. Test on different hardware

---

**Message:** `⚠️ [AnimationController] Queue full (5). Dropping animation: fire`

**Meaning:** Animation queue reached maximum capacity (5 pending animations).

**What Happened:**
- 5 animations already queued
- New animation request was dropped
- Logged warning
- Combat continues (animation was optional)

**Action:**
1. This is usually expected during rapid spell casting
2. If happening frequently, consider:
   - Increasing MAX_QUEUE_SIZE in AnimationController
   - Adding cooldowns to prevent spam
   - Checking if animations are completing properly

---

**Message:** `🚨 [MyAnimation - charge] Particle count (35) EXCEEDS maximum (30). This will cause performance issues!`

**Meaning:** Particle count validation detected excessive particles.

**What Happened:**
- validateParticleCount() detected >30 particles
- Error logged (console.error)
- Animation still rendered (warning only)
- Likely to cause performance issues

**Action:**
1. Reduce particle count immediately:
   ```typescript
   const chargeParticles = 20;  // Down from 35
   validateParticleCount(chargeParticles, 'MyAnimation', 'charge');
   ```

---

**Message:** `⚠️ [MyAnimation - impact] Particle count (25) exceeds recommended max (20). Consider reducing for better performance.`

**Meaning:** Particle count is above recommended limit but below hard maximum.

**What Happened:**
- validateParticleCount() detected 21-30 particles
- Warning logged (console.warn)
- Animation will work but may have minor performance impact

**Action:**
1. Consider reducing for optimal performance:
   ```typescript
   const impactParticles = 18;  // Optimal range
   ```

---

**Message:** `Cannot read property 'offsetLeft' of null`

**Meaning:** Trying to access position of element that doesn't exist.

**What Happened:**
- playerElement or enemyElement is null
- Attempted to read offsetLeft property
- JavaScript error thrown

**Action:**
```typescript
// ❌ CAUSES ERROR:
const x = playerElement.offsetLeft;  // If null, crashes

// ✅ SAFE:
const x = playerElement?.offsetLeft ?? 100;  // Fallback to 100
```

---

**Message:** `Maximum update depth exceeded`

**Meaning:** React detected infinite update loop.

**What Happened:**
- State update triggered re-render
- Re-render triggered state update
- Infinite loop detected
- React threw error

**Action:**
```typescript
// ❌ CAUSES LOOP:
useEffect(() => {
  setCount(count + 1);  // Updates count, triggers effect again!
});

// ✅ FIXED:
useEffect(() => {
  setCount(count + 1);
}, []);  // Only runs on mount
```

---

## Debugging Tools and Techniques

### Chrome DevTools

#### Performance Profiler (FPS Analysis)

**How to Use:**
1. Open DevTools (F12)
2. Click "Performance" tab
3. Click record button (●)
4. Cast spell animation
5. Stop recording
6. Analyze flame chart

**What to Look For:**
- **Green bars:** Rendering (good if short)
- **Purple bars:** Layout recalculation (bad if frequent)
- **Yellow bars:** JavaScript execution
- **Gray bars:** Idle time
- **Red bars:** Frames that exceeded 16ms budget (dropped frames)

**Interpreting Results:**
```
Frame time target: 16.67ms (60fps)

Good performance:
├─ Scripting: 3ms
├─ Rendering: 2ms
├─ Painting: 1ms
└─ Total: 6ms ✅ (well under 16ms)

Poor performance:
├─ Scripting: 8ms
├─ Layout: 5ms      ⚠️ Should be minimal
├─ Painting: 7ms     ⚠️ Should be minimal
└─ Total: 20ms ❌ (exceeds 16ms = dropped frame)
```

---

#### Memory Profiler (Leak Detection)

**How to Use:**
1. DevTools → Memory tab
2. Select "Heap snapshot"
3. Click "Take snapshot" (baseline)
4. Cast 10-20 spells
5. Click "Take snapshot" (after test)
6. Compare snapshots

**What to Look For:**
- **Detached DOM nodes:** Indicates memory leak
- **Growing object counts:** Animation objects not cleaned up
- **Event listeners not removed:** Memory leak

**Expected Behavior:**
- Memory increases during animation
- Memory returns to baseline after garbage collection
- Small residual growth (<5MB) is acceptable

---

#### React DevTools (Component Inspection)

**Installation:**
```
Chrome Web Store → React Developer Tools
```

**How to Use:**
1. Open DevTools → "Components" tab
2. Navigate component tree
3. Find AnimationController
4. Inspect props and state

**Useful Features:**
- **Highlight updates:** Shows which components re-render
- **Props inspection:** Verify correct data passed
- **Hooks inspection:** See useState/useEffect values
- **Profiler:** Measure component render times

---

### Development Mode Logging

#### Understanding the Emoji Log System

The animation system uses emoji prefixes for easy log filtering:

```javascript
🎬  // Animation lifecycle (start, play, queue)
✅  // Success (animation complete, validation passed)
⚠️  // Warning (fallback, performance, excessive particles)
🚨  // Error (crash, failure, critical issue)
📊  // Performance measurement
⏸️  // Queue events (animation queued)
🧹  // Cleanup (unmount, resource release)
⏰  // Timing (duration tracking)
```

**How to Filter:**
```javascript
// In Chrome console, filter box:
🎬  // Shows only lifecycle events
⚠️  // Shows only warnings
📊  // Shows only performance metrics
```

---

#### Enabling Performance Instrumentation

**Automatic in Development:**
```typescript
// Performance logging enabled when:
if (process.env.NODE_ENV !== 'production') {
  // Detailed logging enabled
}
```

**Manual Override:**
```typescript
// In AnimationController.tsx
const FORCE_PERFORMANCE_LOGGING = true;

const measurePerformance = (name: string, callback: () => void) => {
  if (FORCE_PERFORMANCE_LOGGING || process.env.NODE_ENV !== 'production') {
    // ... performance measurement
  }
};
```

---

#### Reading Performance Metrics

**Example Console Output:**
```
🎬 [AnimationController] Starting animation: fire (element: fire, type: projectile)
🎬 [Animation Timing] fire started at 12345.67ms
📊 [Performance] AnimationController-render took 3.24ms (within target)
✅ [Animation Timing] fire completed in 953.12ms
✅ [AnimationController] Animation complete: fire
```

**Interpretation:**
- **Starting animation:** Animation selected and rendering
- **Timing started:** Performance timer started
- **Render performance:** Component rendered in 3.24ms (good, <5ms target)
- **Completed in:** Total animation took 953ms (expected ~950ms)
- **Animation complete:** onComplete callback fired

**Performance Targets:**
```typescript
Component render time: <5ms
Animation total duration: Within ±10% of specification
Frame time: <16.67ms (60fps)
```

---

#### Trace Logging for Animation Lifecycle

**Enable Detailed Logging:**
```typescript
// Add to your animation component
const DEBUG = true;

useEffect(() => {
  if (DEBUG) console.log('🎬 MyAnimation mounted');

  return () => {
    if (DEBUG) console.log('🧹 MyAnimation unmounted');
  };
}, []);

useEffect(() => {
  if (DEBUG) console.log('⏰ Starting charge phase');
  const timer = setTimeout(() => {
    if (DEBUG) console.log('⏰ Charge phase complete');
  }, CHARGE_DURATION);

  return () => clearTimeout(timer);
}, []);
```

**Expected Lifecycle:**
```
🎬 MyAnimation mounted
⏰ Starting charge phase
⏰ Charge phase complete
⏰ Starting cast phase
⏰ Cast phase complete
⏰ Starting travel phase
⏰ Travel phase complete
⏰ Starting impact phase
⏰ Impact phase complete
⏰ Calling onComplete
🧹 MyAnimation unmounted
```

---

### Visual Debugging

#### Adding Debug Borders

**Temporary borders to see element boundaries:**
```typescript
<motion.div
  style={{
    // Your animation styles
    border: '2px solid red',      // DEBUG: See exact boundaries
    background: 'rgba(255,0,0,0.1)' // DEBUG: See fill area
  }}
/>
```

**Debug colors for different phases:**
```typescript
const DEBUG_COLORS = {
  charge: 'rgba(255,0,0,0.2)',    // Red
  cast: 'rgba(0,255,0,0.2)',      // Green
  travel: 'rgba(0,0,255,0.2)',    // Blue
  impact: 'rgba(255,255,0,0.2)'   // Yellow
};

<motion.div style={{ background: DEBUG_COLORS.charge }} />
```

---

#### Logging Particle Counts in Real-Time

```typescript
const particles = Array.from({ length: particleCount }, (_, i) => ({
  id: i,
  angle: (i * 360) / particleCount,
  distance: 50 + Math.random() * 30
}));

// DEBUG: Log particle generation
if (process.env.NODE_ENV !== 'production') {
  console.log(`🎨 Generated ${particles.length} particles:`, {
    phase: 'charge',
    positions: particles.map(p => ({ angle: p.angle, distance: p.distance }))
  });
}
```

---

#### Visualizing Animation Phases with Overlays

**Phase indicator overlay:**
```typescript
const [currentPhase, setCurrentPhase] = useState('charge');

useEffect(() => {
  setCurrentPhase('charge');
  const t1 = setTimeout(() => setCurrentPhase('cast'), CHARGE_DURATION);
  const t2 = setTimeout(() => setCurrentPhase('travel'), CHARGE_DURATION + CAST_DURATION);
  const t3 = setTimeout(() => setCurrentPhase('impact'), CHARGE_DURATION + CAST_DURATION + TRAVEL_DURATION);

  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
    clearTimeout(t3);
  };
}, []);

return (
  <>
    {process.env.NODE_ENV !== 'production' && (
      <div style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        zIndex: 9999
      }}>
        Current Phase: {currentPhase}
      </div>
    )}

    {/* Animation components */}
  </>
);
```

---

#### Slow-Motion Testing

**Reduce animation speed for debugging:**
```typescript
const DEBUG_SLOW_MOTION = true;
const SPEED_MULTIPLIER = DEBUG_SLOW_MOTION ? 3 : 1;  // 3x slower

const CHARGE_DURATION = 400 * SPEED_MULTIPLIER;
const CAST_DURATION = 200 * SPEED_MULTIPLIER;
const TRAVEL_DURATION = 300 * SPEED_MULTIPLIER;
const IMPACT_DURATION = 150 * SPEED_MULTIPLIER;
```

**Or use browser DevTools:**
```
DevTools → Console → Gear icon → Rendering
✅ Enable "Emulate CSS media feature prefers-reduced-motion"
```

---

### Isolation Testing

#### Creating Test Harnesses for Animations

**Standalone animation tester:**
```typescript
// In src/components/combat/animations/__tests__/AnimationTestHarness.tsx
import React, { useState } from 'react';
import { FireballAnimation } from '../variants/FireballAnimation';

export const AnimationTestHarness: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);

  const testPositions = {
    casterX: 200,
    casterY: 300,
    targetX: 600,
    targetY: 300
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px', background: '#f0f0f0' }}>
      <button
        onClick={() => setIsPlaying(true)}
        style={{ position: 'absolute', top: 10, left: 10, zIndex: 1000 }}
      >
        Play Animation
      </button>

      {/* Caster indicator */}
      <div style={{
        position: 'absolute',
        left: testPositions.casterX,
        top: testPositions.casterY,
        width: 20,
        height: 20,
        background: 'blue',
        borderRadius: '50%'
      }} />

      {/* Target indicator */}
      <div style={{
        position: 'absolute',
        left: testPositions.targetX,
        top: testPositions.targetY,
        width: 20,
        height: 20,
        background: 'red',
        borderRadius: '50%'
      }} />

      {/* Animation */}
      {isPlaying && (
        <FireballAnimation
          {...testPositions}
          onComplete={() => {
            console.log('✅ Animation complete');
            setIsPlaying(false);
          }}
        />
      )}
    </div>
  );
};

// Add route to test in isolation
// Navigate to /animation-test to see harness
```

---

#### Testing Outside Combat Context

**Import animation directly:**
```typescript
// In a test file or dev page
import { FireballAnimation } from './animations/variants/FireballAnimation';

const TestPage = () => {
  return (
    <div style={{ position: 'relative', width: 800, height: 600 }}>
      <FireballAnimation
        casterX={100}
        casterY={300}
        targetX={700}
        targetY={300}
        onComplete={() => console.log('Done')}
      />
    </div>
  );
};
```

---

#### Mock Data Strategies

**Create reusable test data:**
```typescript
// In __tests__/mockData.ts
export const MOCK_POSITIONS = {
  playerLeft: {
    casterX: 100,
    casterY: 300,
    targetX: 700,
    targetY: 300
  },
  playerRight: {
    casterX: 700,
    casterY: 300,
    targetX: 100,
    targetY: 300
  },
  diagonal: {
    casterX: 100,
    casterY: 100,
    targetX: 700,
    targetY: 500
  }
};

export const MOCK_CRITICAL_HIT = {
  ...MOCK_POSITIONS.playerLeft,
  damage: 150,
  isCritical: true
};

export const MOCK_NORMAL_HIT = {
  ...MOCK_POSITIONS.playerLeft,
  damage: 75,
  isCritical: false
};

// Use in tests
<FireballAnimation {...MOCK_CRITICAL_HIT} onComplete={() => {}} />
```

---

## Performance Debugging Deep Dive

### Step-by-Step FPS Troubleshooting Workflow

**1. Measure Baseline Performance**
```javascript
// In browser console
const measure = () => {
  const start = performance.now();
  let frames = 0;

  const loop = () => {
    frames++;
    if (performance.now() - start < 1000) {
      requestAnimationFrame(loop);
    } else {
      console.log(`FPS: ${frames}`);
    }
  };

  requestAnimationFrame(loop);
};

measure();
// Expected: ~60 FPS idle, ~58-60 FPS during animation
```

---

**2. Identify Problem Phases/Components**
```typescript
// Add performance markers to each phase
const PHASES = ['charge', 'cast', 'travel', 'impact'];

PHASES.forEach((phase, i) => {
  setTimeout(() => {
    performance.mark(`${phase}-start`);

    // Phase logic

    setTimeout(() => {
      performance.mark(`${phase}-end`);
      performance.measure(phase, `${phase}-start`, `${phase}-end`);

      const measure = performance.getEntriesByName(phase)[0];
      console.log(`📊 ${phase} took ${measure.duration.toFixed(2)}ms`);
    }, PHASE_DURATIONS[i]);
  }, PHASE_START_TIMES[i]);
});
```

---

**3. Check Particle Counts**
```typescript
import { validateParticleCount } from '../types';

// In each phase
const chargeParticles = 15;
validateParticleCount(chargeParticles, 'MyAnimation', 'charge');

const impactParticles = 20;
validateParticleCount(impactParticles, 'MyAnimation', 'impact');

// Look for warnings:
// "⚠️ Particle count exceeds recommended max"
```

---

**4. Verify GPU-Only Properties**
```typescript
// Audit all animated properties
const ANIMATED_PROPERTIES = {
  allowed: ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate', 'rotateX', 'rotateZ', 'opacity'],
  forbidden: ['width', 'height', 'left', 'top', 'background', 'backgroundColor', 'boxShadow']
};

// Search codebase for forbidden properties in animate={{}}
// Should find ZERO instances
```

---

**5. Profile with Chrome DevTools**
```
1. Open DevTools → Performance
2. Check "Screenshots" and "Memory"
3. Click Record
4. Cast problematic spell
5. Stop recording
6. Analyze:
   - Red bars = dropped frames
   - Purple spikes = layout recalc (bad)
   - Yellow spikes = JS execution
   - Look for "Long Tasks" (>50ms)
```

---

**6. Optimize Iteratively**

**Iteration 1: Reduce Particles**
```typescript
// BEFORE:
const particles = 40;

// AFTER:
const particles = 20;

// Test FPS improvement
```

**Iteration 2: Remove Non-GPU Properties**
```typescript
// BEFORE:
animate={{
  width: [100, 200, 100],  // ❌ Triggers layout
  backgroundColor: ['red', 'blue']  // ❌ Triggers paint
}}

// AFTER:
animate={{
  scale: [1, 2, 1],  // ✅ GPU
  opacity: [1, 0.5, 1]  // ✅ GPU
}}

// Test FPS improvement
```

**Iteration 3: Reduce Blur**
```typescript
// BEFORE:
filter: 'blur(15px)'

// AFTER:
filter: 'blur(5px)'

// Test FPS improvement
```

**Iteration 4: Memoize Component**
```typescript
// BEFORE:
export const MyAnimation: React.FC = (props) => { ... }

// AFTER:
export const MyAnimation = React.memo<AnimationComponentProps>((props) => { ... });

// Test FPS improvement
```

---

### Performance Checklist

**Before Optimizing:**
- [ ] Baseline FPS measured (should be ~60)
- [ ] Problem animation identified
- [ ] DevTools profiler recording captured

**Optimization Steps:**
- [ ] Particle count ≤ 20 (recommended), ≤ 30 (max)
- [ ] Only `transform` and `opacity` animated
- [ ] Blur filters ≤ 8px or removed
- [ ] Component wrapped with `React.memo()`
- [ ] `useCallback` used for event handlers
- [ ] `useMemo` used for expensive calculations
- [ ] No layout-triggering properties
- [ ] No synchronous blocking operations

**After Optimizing:**
- [ ] FPS improved to 58-60
- [ ] No red bars in profiler
- [ ] No layout recalc spikes
- [ ] Visual quality acceptable

---

### Before/After Optimization Examples

**Example 1: Reducing Particles**
```typescript
// BEFORE (30 FPS):
const chargeParticles = 60;  // Way too many
const impactParticles = 80;

// AFTER (60 FPS):
const chargeParticles = 15;  // Optimal
const impactParticles = 20;

// Performance gain: +30 FPS
// Visual difference: Negligible (still looks great)
```

---

**Example 2: GPU-Only Properties**
```typescript
// BEFORE (40 FPS):
<motion.div
  animate={{
    width: [50, 100, 50],              // ❌ Layout
    height: [50, 100, 50],             // ❌ Layout
    backgroundColor: ['#ff0000', '#00ff00'],  // ❌ Paint
    boxShadow: ['0 0 10px red', '0 0 30px red']  // ❌ Paint
  }}
/>

// AFTER (60 FPS):
<motion.div
  animate={{
    scale: [1, 2, 1],      // ✅ Transform
    opacity: [1, 0.5, 1]   // ✅ Opacity
  }}
  style={{
    width: 50,           // Static (not animated)
    height: 50,          // Static
    background: '#ff0000',  // Static
    boxShadow: '0 0 10px red'  // Static
  }}
/>

// Performance gain: +20 FPS
// Visual difference: Can be matched with creative use of scale/opacity
```

---

**Example 3: Memoization**
```typescript
// BEFORE (re-renders every parent update):
export const FireballAnimation: React.FC<AnimationComponentProps> = (props) => {
  // Component re-renders unnecessarily
  return <motion.div>...</motion.div>;
};

// AFTER (only re-renders when props change):
export const FireballAnimation = React.memo<AnimationComponentProps>((props) => {
  // Only re-renders if casterX, casterY, etc. change
  return <motion.div>...</motion.div>;
});

// Performance gain: Prevents 5-10 unnecessary re-renders per animation
// Frame time improvement: ~2-3ms saved per avoided render
```

---

## Common Pitfalls

### ❌ Pitfall 1: Using Too Many Particles
```typescript
// ❌ PROBLEM:
const particles = Array.from({ length: 100 }, ...);  // 100 particles!
// Result: 20 FPS, browser lag

// ✅ SOLUTION:
const particles = Array.from({ length: 15 }, ...);   // 15 particles
validateParticleCount(15, 'MyAnimation', 'charge');
// Result: 60 FPS, smooth animation
```

---

### ❌ Pitfall 2: Animating Width/Height
```typescript
// ❌ PROBLEM:
<motion.div
  animate={{
    width: [100, 200, 100],   // Triggers layout reflow every frame
    height: [100, 200, 100]   // Very expensive
  }}
/>
// Result: Stuttering, dropped frames

// ✅ SOLUTION:
<motion.div
  animate={{
    scale: [1, 2, 1]  // GPU-accelerated transform
  }}
  style={{
    width: 100,   // Fixed size, scaled visually
    height: 100
  }}
/>
// Result: Smooth 60 FPS animation
```

---

### ❌ Pitfall 3: Heavy Blur Filters
```typescript
// ❌ PROBLEM:
<motion.div
  style={{
    filter: 'blur(25px)'  // Very expensive to render
  }}
/>
// Result: 30-40 FPS

// ✅ SOLUTION:
<motion.div
  style={{
    filter: 'blur(6px)'  // Much more performant
  }}
/>
// Result: 55-60 FPS
// OR: Remove blur entirely and use opacity/glow tricks
```

---

### ❌ Pitfall 4: Not Cleaning Up Effects
```typescript
// ❌ PROBLEM:
useEffect(() => {
  const interval = setInterval(() => {
    updateParticles();
  }, 16);
  // No cleanup!
});
// Result: Memory leak, intervals keep running after unmount

// ✅ SOLUTION:
useEffect(() => {
  const interval = setInterval(() => {
    updateParticles();
  }, 16);

  return () => {
    clearInterval(interval);  // Cleanup on unmount
  };
}, []);
// Result: No memory leaks
```

---

### ❌ Pitfall 5: Forgetting to Call onComplete
```typescript
// ❌ PROBLEM:
export const MyAnimation = React.memo((props) => {
  // onComplete never called!
  return <motion.div>...</motion.div>;
});
// Result: Combat gets stuck, next turn never happens

// ✅ SOLUTION:
export const MyAnimation = React.memo((props) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      props.onComplete();  // Must call this!
    }, TOTAL_DURATION);

    return () => clearTimeout(timer);
  }, [props.onComplete]);

  return <motion.div>...</motion.div>;
});
// Result: Combat flows smoothly
```

---

### ❌ Pitfall 6: Incorrect Dependency Arrays
```typescript
// ❌ PROBLEM:
useEffect(() => {
  const timer = setTimeout(onComplete, TOTAL_DURATION);
  return () => clearTimeout(timer);
});  // ❌ Missing dependency array
// Result: Effect runs on every render, multiple timers created

// ✅ SOLUTION:
useEffect(() => {
  const timer = setTimeout(onComplete, TOTAL_DURATION);
  return () => clearTimeout(timer);
}, [onComplete]);  // ✅ Proper dependencies
// Result: Effect runs once
```

---

### ❌ Pitfall 7: Animating Background Color
```typescript
// ❌ PROBLEM:
<motion.div
  animate={{
    backgroundColor: ['#ff0000', '#00ff00', '#0000ff']  // Triggers paint
  }}
/>
// Result: Poor performance, frame drops

// ✅ SOLUTION:
<motion.div
  animate={{
    opacity: [0, 1, 0]  // Fade between layers
  }}
  style={{
    background: '#ff0000'  // Static color
  }}
/>
// OR use multiple overlapping divs with opacity
<>
  <motion.div animate={{ opacity: [1, 0, 0] }} style={{ background: '#ff0000' }} />
  <motion.div animate={{ opacity: [0, 1, 0] }} style={{ background: '#00ff00' }} />
  <motion.div animate={{ opacity: [0, 0, 1] }} style={{ background: '#0000ff' }} />
</>
// Result: Smooth GPU-accelerated animation
```

---

### ❌ Pitfall 8: Shared Global State
```typescript
// ❌ PROBLEM:
let globalParticles = [];  // Global variable

export const MyAnimation = () => {
  globalParticles.push(...);  // Multiple instances interfere!
  return <div>...</div>;
};
// Result: Animations interfere with each other

// ✅ SOLUTION:
export const MyAnimation = () => {
  const [particles, setParticles] = useState([]);  // Local state
  return <div>...</div>;
};
// Result: Each instance independent
```

---

### ❌ Pitfall 9: Missing React.memo
```typescript
// ❌ PROBLEM:
export const MyAnimation: React.FC = (props) => {
  // Re-renders on every parent update, even if props unchanged
  return <ExpensiveAnimation />;
};
// Result: Unnecessary re-renders, wasted CPU cycles

// ✅ SOLUTION:
export const MyAnimation = React.memo<AnimationComponentProps>((props) => {
  // Only re-renders if props actually change
  return <ExpensiveAnimation />;
});
// Result: Optimized re-render behavior
```

---

### ❌ Pitfall 10: Not Using validateParticleCount
```typescript
// ❌ PROBLEM:
const particles = 45;  // Way too many!
// No validation, no warning
// Result: Performance issues go unnoticed

// ✅ SOLUTION:
import { validateParticleCount } from '../types';

const particles = 45;
validateParticleCount(particles, 'MyAnimation', 'charge');
// Logs: "🚨 Particle count (45) EXCEEDS maximum (30)"
// Result: Immediate feedback to reduce particles
```

---

### ❌ Pitfall 11: Incorrect Timing Calculation
```typescript
// ❌ PROBLEM:
const CHARGE = 400;
const CAST = 200;
const TRAVEL = 300;
const IMPACT = 150;
const TOTAL = 1000;  // ❌ Wrong! Should be 1050

useEffect(() => {
  setTimeout(onComplete, TOTAL);  // Fires 50ms early!
}, []);
// Result: Animation cuts off, visual glitch

// ✅ SOLUTION:
const TOTAL = CHARGE + CAST + TRAVEL + IMPACT;  // Auto-calculate
// OR
console.assert(TOTAL === 1050, 'Duration mismatch');
// Result: Animation completes fully
```

---

### ❌ Pitfall 12: Using Static Position Instead of Props
```typescript
// ❌ PROBLEM:
export const MyAnimation = (props) => {
  const targetX = 500;  // ❌ Hard-coded position
  const targetY = 300;
  // Projectile always goes to (500, 300) regardless of actual enemy position
};
// Result: Animation appears in wrong place

// ✅ SOLUTION:
export const MyAnimation = (props) => {
  const targetX = props.targetX;  // ✅ Use actual target position
  const targetY = props.targetY;
};
// Result: Animation targets correct position
```

---

### ❌ Pitfall 13: Forgetting to Validate Positions
```typescript
// ❌ PROBLEM:
const attackData = {
  casterX: playerElement.offsetLeft,  // Crashes if null
  casterY: playerElement.offsetTop,
  targetX: enemyElement.offsetLeft,
  targetY: enemyElement.offsetTop
};
// Result: "Cannot read property 'offsetLeft' of null"

// ✅ SOLUTION:
const attackData = {
  casterX: playerElement?.offsetLeft ?? 100,  // Fallback
  casterY: playerElement?.offsetTop ?? 200,
  targetX: enemyElement?.offsetLeft ?? 400,
  targetY: enemyElement?.offsetTop ?? 300
};
// Result: Safe position calculation
```

---

### ❌ Pitfall 14: Animating Box Shadow
```typescript
// ❌ PROBLEM:
<motion.div
  animate={{
    boxShadow: ['0 0 10px red', '0 0 50px red', '0 0 10px red']
  }}
/>
// Result: Triggers paint on every frame, poor performance

// ✅ SOLUTION:
<motion.div
  style={{
    boxShadow: '0 0 20px red'  // Static shadow
  }}
  animate={{
    scale: [1, 1.5, 1]  // Scale instead for "glow" effect
  }}
/>
// OR use separate glow layer with opacity
<>
  <div style={{ boxShadow: '0 0 20px red' }} />
  <motion.div
    animate={{ opacity: [0, 1, 0] }}
    style={{ boxShadow: '0 0 50px red' }}
  />
</>
// Result: GPU-accelerated glow effect
```

---

### ❌ Pitfall 15: Missing Key Prop in Lists
```typescript
// ❌ PROBLEM:
{particles.map((p, i) => (
  <motion.div>  {/* No key! */}
    Particle
  </motion.div>
))}
// Result: React can't track elements, potential bugs

// ✅ SOLUTION:
{particles.map((p, i) => (
  <motion.div key={`particle-${i}`}>  {/* ✅ Unique key */}
    Particle
  </motion.div>
))}
// Result: Proper React reconciliation
```

---

## Diagnostic Flowcharts

### Flowchart 1: Animation Doesn't Appear

```
START: Cast spell, no animation appears
  │
  ├─ Check browser console for errors
  │   │
  │   ├─ "No animation found for attack type"
  │   │   └─► Add animation to registry → SOLVED
  │   │
  │   ├─ "Invalid position data"
  │   │   └─► Fix position calculation → SOLVED
  │   │
  │   ├─ "Animation error for [spell]"
  │   │   └─► Fix component bug → SOLVED
  │   │
  │   └─ No errors
  │       └─► Continue below
  │
  ├─ Is AnimationController rendered in Combat.tsx?
  │   │
  │   ├─ NO → Add AnimationController → SOLVED
  │   │
  │   └─ YES → Continue below
  │
  ├─ Check React DevTools component tree
  │   │
  │   ├─ AnimationController not visible
  │   │   └─► Check showAnimation state → Fix state logic → SOLVED
  │   │
  │   └─ AnimationController visible but no children
  │       └─► Check registry mapping → Fix mapping → SOLVED
  │
  └─ Inspect element in DOM
      │
      ├─ Element exists but opacity:0 or display:none
      │   └─► Check CSS styles → Remove hiding → SOLVED
      │
      └─ Element exists but positioned off-screen
          └─► Fix position calculation → SOLVED
```

---

### Flowchart 2: Performance Problems

```
START: Animation lags or stutters
  │
  ├─ Open Chrome DevTools Performance Profiler
  │   └─► Record animation playback
  │
  ├─ Check frame rate in recording
  │   │
  │   ├─ Many red bars (dropped frames)
  │   │   └─► Continue below
  │   │
  │   └─ Mostly green (good performance)
  │       └─► Issue may be perception, not actual lag → END
  │
  ├─ Look for purple "Layout" spikes
  │   │
  │   ├─ YES → Non-GPU properties being animated
  │   │   └─► Audit animated properties
  │   │       └─► Replace width/height/left/top with transform
  │   │       └─► Replace background with opacity layers → SOLVED
  │   │
  │   └─ NO → Continue below
  │
  ├─ Look for yellow "Scripting" spikes
  │   │
  │   ├─ YES → Too much JavaScript execution
  │   │   └─► Check particle count
  │   │       │
  │   │       ├─ >30 particles → Reduce to 15-20 → SOLVED
  │   │       │
  │   │       └─ <30 particles → Check for loops in useEffect
  │   │           └─► Fix infinite loop → SOLVED
  │   │
  │   └─ NO → Continue below
  │
  ├─ Check console for particle warnings
  │   │
  │   ├─ "Particle count exceeds max"
  │   │   └─► Reduce particles → SOLVED
  │   │
  │   └─ No warnings → Continue below
  │
  ├─ Audit CSS filters
  │   │
  │   ├─ blur >8px found
  │   │   └─► Reduce blur to 6px or remove → SOLVED
  │   │
  │   └─ No heavy filters → Continue below
  │
  ├─ Check if component is memoized
  │   │
  │   ├─ NO → Wrap with React.memo() → SOLVED
  │   │
  │   └─ YES → Continue below
  │
  └─ Test on different hardware
      │
      ├─ Good performance on other device
      │   └─► Issue is device-specific
      │       └─► Implement adaptive quality → SOLVED
      │
      └─ Poor performance everywhere
          └─► Review entire animation design
              └─► Simplify effects → SOLVED
```

---

### Flowchart 3: Integration Issues

```
START: Animation doesn't trigger from combat
  │
  ├─ Add console.log to handlePlayerAttack()
  │   └─► Does it log when you cast spell?
  │       │
  │       ├─ NO → Combat action not triggering
  │       │   └─► Check button click handler → Fix → SOLVED
  │       │
  │       └─ YES → Continue below
  │
  ├─ Log spell ID being passed
  │   └─► console.log('Attack type:', attackType)
  │       │
  │       ├─ Logs "undefined" or null
  │       │   └─► Fix attack type extraction → SOLVED
  │       │
  │       └─ Logs spell ID (e.g., "fire")
  │           └─► Continue below
  │
  ├─ Check if spell ID matches registry
  │   └─► Open animationRegistry.ts
  │       └─► Is there a key matching the spell ID?
  │           │
  │           ├─ NO → Add to registry → SOLVED
  │           │
  │           ├─ Case mismatch ("Fire" vs "fire")
  │           │   └─► Fix case to match → SOLVED
  │           │
  │           └─ YES, exact match → Continue below
  │
  ├─ Log showAnimation state
  │   └─► console.log('Show animation:', showAnimation)
  │       │
  │       ├─ Logs "false"
  │       │   └─► Fix state update logic → SOLVED
  │       │
  │       └─ Logs "true"
  │           └─► Continue below
  │
  ├─ Check if AnimationController renders
  │   └─► Add console.log to AnimationController
  │       └─► Does it log?
  │           │
  │           ├─ NO → Component not rendered
  │           │   └─► Check conditional in Combat.tsx → Fix → SOLVED
  │           │
  │           └─ YES → Continue below
  │
  └─ Check position data
      └─► Log attackData in Combat.tsx
          │
          ├─ Contains NaN or undefined
          │   └─► Fix position calculation → Add fallbacks → SOLVED
          │
          └─ Valid positions
              └─► Animation should work
                  └─► If still failing, check component for errors → SOLVED
```

---

## Getting Help

### What Information to Gather Before Asking

When you need help, provide:

1. **Error Message (exact text):**
   ```
   Example: "🚨 [AnimationController] Animation error for 'fire', continuing combat"
   ```

2. **Browser Console Screenshot:**
   - Include full error stack trace
   - Include any warnings before the error
   - Include performance logs if relevant

3. **Code Context:**
   ```typescript
   // Share the problematic component or function
   // Include imports and relevant state
   export const MyAnimation = React.memo((props) => {
     // ... code with issue
   });
   ```

4. **Steps to Reproduce:**
   ```
   1. Start combat
   2. Cast Fireball spell
   3. Animation appears but doesn't complete
   4. Combat gets stuck
   ```

5. **Environment:**
   - Browser and version (Chrome 120, Firefox 121, etc.)
   - OS (Windows, macOS, Linux)
   - Device (Desktop, mobile, tablet)
   - Screen resolution

6. **What You've Tried:**
   ```
   - Checked registry mapping (correct)
   - Verified onComplete is called (it is)
   - Reduced particle count (no change)
   - Tested in isolation (works fine)
   ```

---

### How to Create a Minimal Reproduction

**Good Bug Report:**
```typescript
// Minimal reproduction of Fireball animation not completing

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export const FireballBugRepro = () => {
  const [showAnimation, setShowAnimation] = React.useState(true);

  return (
    <div style={{ position: 'relative', width: 800, height: 600 }}>
      {showAnimation && (
        <FireballAnimation
          casterX={100}
          casterY={300}
          targetX={700}
          targetY={300}
          onComplete={() => {
            console.log('onComplete called');  // This never logs!
            setShowAnimation(false);
          }}
        />
      )}
    </div>
  );
};

// Minimal FireballAnimation (stripped to essential bug)
const FireballAnimation = ({ casterX, casterY, targetX, targetY, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    // BUG: Cleanup clears timer before it fires
    return () => clearTimeout(timer);
  }, []);  // Missing onComplete in deps!

  return <motion.div animate={{ opacity: [0, 1, 0] }} />;
};
```

**What Makes This Good:**
- Self-contained (can be copy-pasted and run)
- Minimal (only the code necessary to show the bug)
- Clear bug indication (comment pointing to issue)
- Expected vs actual behavior documented

---

### Where to Find Additional Resources

**Documentation:**
- `/docs/animations/README.md` - System overview
- `/docs/animations/design-principles.md` - Design guidelines
- `/docs/animations/timing-guidelines.md` - Timing standards
- `/docs/animations/adding-new-animations.md` - Step-by-step tutorial
- `/docs/animations/component-api.md` - API reference

**Code Examples:**
- `/src/components/combat/animations/variants/FireballAnimation.tsx` - Complete spell example
- `/src/components/combat/animations/AnimationController.tsx` - Integration example
- `/src/components/combat/animations/__tests__/` - Test examples

**External Resources:**
- Framer Motion docs: https://www.framer.com/motion/
- React Performance: https://react.dev/learn/render-and-commit
- GPU Animation: https://web.dev/animations-guide/
- Chrome DevTools: https://developer.chrome.com/docs/devtools/

---

### Escalation Paths for Critical Issues

**Priority Levels:**

**P0 - Critical (Immediate Response):**
- Animation system completely broken
- Combat unable to proceed
- Browser crashes
- Data loss
- Security vulnerability

**Action:** Report immediately to team lead, include full error logs

---

**P1 - High (Same Day):**
- Single spell animation broken
- Performance degradation affecting gameplay
- Memory leak detected
- TypeScript build failure

**Action:** Create detailed bug report with reproduction steps

---

**P2 - Medium (This Week):**
- Visual glitch in animation
- Minor timing issue
- Console warnings (not errors)
- Performance suboptimal but playable

**Action:** Document in issue tracker, fix when available

---

**P3 - Low (Backlog):**
- Enhancement request
- Code style improvement
- Documentation typo
- Edge case bug

**Action:** Add to backlog for future sprint

---

## Conclusion

This troubleshooting guide covers the most common issues encountered during animation development. For issues not covered here:

1. **Search the codebase** for similar patterns
2. **Check browser console** for detailed error messages
3. **Use debugging tools** (DevTools, React DevTools, Performance Profiler)
4. **Create minimal reproduction** to isolate the problem
5. **Ask for help** with detailed information

**Remember:**
- The animation system has robust error handling (error boundaries, validation, fallbacks)
- Combat will continue even if animations fail (graceful degradation)
- Performance issues can almost always be fixed by reducing particles and using GPU properties
- When in doubt, check the working examples in `/variants/` directory

Happy debugging! 🐛🔧
