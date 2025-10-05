# Damage Number Timing Fix

**Date**: 2025-10-05
**Issue**: Damage numbers not appearing during spell animations
**Root Cause**: Damage numbers were triggered AFTER animation completion instead of DURING the impact phase

## Problem Description

The behavior-diagnostician agent identified that damage numbers were scheduled to appear after `handleAnimationComplete` was called, which occurs at the END of the spell animation. By the time the damage number component was rendered, the animation cleanup was already scheduled, causing the damage number to either not display or be immediately hidden.

### Previous Flow
```
1. Spell animation starts (charge → cast → travel → impact → complete)
2. onComplete callback triggers handleAnimationComplete
3. handleAnimationComplete sets showDamageNumber = true
4. Damage number renders but cleanup is already scheduled
5. Result: Damage number doesn't appear or flashes briefly
```

## Solution

Modified the AnimationController to trigger damage numbers DURING the impact phase rather than after animation completion.

### New Flow
```
1. Spell animation starts
2. After 1150ms (impact phase begins): damage number appears
3. Damage number visible for 1250ms (appear + hold + disappear)
4. Spell animation completes
5. handleAnimationComplete waits briefly if damage number is showing
6. Combat flow continues
```

## Implementation Changes

### 1. Added Impact Timer Reference
**File**: `/src/components/combat/animations/AnimationController.tsx`

```typescript
const impactTimerRef = useRef<NodeJS.Timeout | null>(null);
```

### 2. New useEffect for Damage Number Timing
**File**: `/src/components/combat/animations/AnimationController.tsx`
**Lines**: ~529-576

Added a new `useEffect` hook that:
- Monitors `currentAnimation` and `animationState`
- Calculates when the impact phase occurs (1150ms after animation start)
- Schedules damage number to appear at impact time
- Keeps damage number visible for 1250ms total
- Cleans up timers when animation changes or unmounts

**Timing Breakdown:**
- **IMPACT_TIME**: 1150ms (charge 700-800ms + cast 150ms + travel 300ms)
- **DAMAGE_NUMBER_DURATION**: 1250ms (appear 150ms + hold 1000ms + disappear 100ms)

### 3. Simplified handleAnimationComplete
**File**: `/src/components/combat/animations/AnimationController.tsx`
**Lines**: ~410-464

Removed damage number triggering logic from `handleAnimationComplete` and simplified it to:
- Wait briefly if damage number is showing (300ms vs 50ms)
- Proceed with onComplete callback
- Process animation queue
- Clean up animation state

### 4. Updated Cleanup Effect
**File**: `/src/components/combat/animations/AnimationController.tsx`
**Lines**: ~632-652

Added cleanup for `impactTimerRef` to prevent memory leaks:
```typescript
if (impactTimerRef.current) {
  clearTimeout(impactTimerRef.current);
  impactTimerRef.current = null;
}
```

### 5. Added Debug Logging
**File**: `/src/components/combat/animations/DamageNumber.tsx`
**Lines**: ~50-72

Added console.log statements for development debugging:
- When DamageNumber component renders
- Damage value, critical status, position
- When animation completes

## Expected Behavior After Fix

### Timeline for Magic Bolt (example)
```
Time    Event
-----   -----
0ms     Animation starts (charge phase begins)
800ms   Cast phase begins
950ms   Projectile travel begins
1150ms  IMPACT - Damage number appears ← NEW TIMING
1300ms  Damage number peak visibility
2400ms  Damage number fades out
2500ms  Animation complete, handleAnimationComplete called
2800ms  Combat flow continues (after 300ms delay for damage number)
```

### Visual Sequence
1. **Charge Phase (0-800ms)**: Caster glows, energy builds
2. **Cast Phase (800-950ms)**: Projectile appears
3. **Travel Phase (950-1250ms)**: Projectile moves to target
4. **Impact Phase (1150ms+)**:
   - Projectile hits target
   - **Damage number appears** (synchronized with impact)
   - Explosion effects play
5. **Hold Phase (1250-2400ms)**:
   - Damage number visible for full 1 second
   - Player can clearly read the value
6. **Fade Phase (2400-2500ms)**:
   - Damage number fades out
7. **Completion (2500ms+)**:
   - Animation cleanup
   - Combat flow continues

## Debug Logging

In development mode (`NODE_ENV !== 'production'`), the following logs appear:

### AnimationController Logs
```
💥 [Damage Number] Scheduling damage number for magic_bolt:
   { damage: 45, isCritical: false, impactTime: "1150ms", duration: "1250ms", position: {...} }

✨ [Damage Number] Displaying damage: 45

🔚 [Damage Number] Hiding damage number
```

### DamageNumber Logs
```
🎯 [DamageNumber] Rendered:
   { damage: 45, isCritical: false, position: {x: 500, y: 300}, duration: "1250ms" }

✅ [DamageNumber] Animation complete for damage: 45
```

## Testing Checklist

After implementing this fix, test the following scenarios:

- [ ] **Magic Bolt**: Damage appears during projectile impact
- [ ] **Fireball**: Damage appears during explosion
- [ ] **Ice Shard**: Damage appears when shard hits
- [ ] **Lightning**: Damage appears during lightning strike
- [ ] **Critical Hits**: Gold "CRITICAL!" text with larger damage number
- [ ] **Healing Spells**: No damage number (expected - healing has no damage value)
- [ ] **Multiple Rapid Casts**: Damage numbers appear for each spell in queue
- [ ] **Victory Modal**: Modal only appears AFTER damage number completes

## Performance Considerations

- **No performance impact**: Timer-based approach uses minimal CPU
- **Cleanup**: All timers properly cleaned up on unmount/animation change
- **No re-renders**: Uses refs for timers to avoid unnecessary renders
- **Memory safety**: Timers cleared in both cleanup effect and animation change effect

## Browser Compatibility

Timing is based on `setTimeout`, which is supported in all browsers. The 1150ms impact time may need minor adjustment for:
- Slower devices (consider reducing to 1100ms)
- Different spell types (longer charge animations may need 1200-1300ms)

## Future Enhancements

1. **Dynamic Impact Timing**: Calculate impact time from animation metadata rather than hardcoding 1150ms
2. **Per-Spell Timing**: Different spells have different impact times (Meteor vs Magic Bolt)
3. **Animation Events**: Use callbacks from animation components to signal impact phase
4. **Configurable Timing**: Add timing configuration to animationRegistry.ts

## Related Files

- `/src/components/combat/animations/AnimationController.tsx` (main fix)
- `/src/components/combat/animations/DamageNumber.tsx` (debug logging)
- `/src/components/combat/animations/animationRegistry.ts` (animation metadata)
- `/src/components/combat/animations/MagicBoltAnimation.tsx` (example spell)

## Commit Message

```
fix(animations): trigger damage numbers during impact phase instead of after completion

- Add new useEffect to calculate and trigger damage at 1150ms (impact time)
- Simplify handleAnimationComplete to wait for damage number if showing
- Add impactTimerRef for proper cleanup
- Add debug logging for damage number lifecycle
- Ensure damage numbers visible for full 1 second before combat continues

Fixes issue where damage numbers weren't appearing because they were
scheduled after animation cleanup. Now they appear synchronized with
the visual impact of the spell.
```

## Verification

To verify the fix is working:

1. **Start dev server**: `npm run dev`
2. **Navigate to combat**: Start a new game → Select character → Find enemy
3. **Cast spell**: Use Magic Bolt or any offensive spell
4. **Observe**: Damage number should appear when projectile hits target
5. **Check console**: Development logs should show damage number lifecycle
6. **Test critical**: Keep casting until you get a critical hit (gold numbers)

Expected result: Damage numbers appear in sync with spell impact and are clearly visible for 1 full second before fading.
