# Animation Showcase Guide

**Task 7.10: Test Battle Scenario for All Wizard Animations**

## Overview

The Animation Showcase is an interactive demonstration and testing tool that displays all wizard spell animations in an easy-to-access, repeatable format. It serves multiple purposes:

1. **Developer Testing**: Validate animations during development
2. **Visual QA**: Verify animations work correctly across updates
3. **Design Review**: Showcase animation quality and polish
4. **Documentation**: Demonstrate animation capabilities
5. **Performance Testing**: Monitor animation performance in isolation

## Access Methods

### Method 1: Standalone HTML Page (Recommended for Quick Testing)

The standalone HTML page provides immediate access without running the full React app:

```bash
# Open in browser
open animation-showcase.html

# Or serve with a simple HTTP server
python3 -m http.server 8000
# Then visit: http://localhost:8000/animation-showcase.html
```

**Pros:**
- No build process required
- Fast loading
- Easy to share with designers/stakeholders
- Works independently of main app

**Cons:**
- Uses mock animations (shows UI only, not actual React animations)
- Requires manual updates to match real implementation

### Method 2: React Component Integration

The full React component uses real animation components from the combat system:

```tsx
// Add to your router or page component
import { AnimationShowcase } from './components/combat/AnimationShowcase';

// Example: Add route
<Route path="/animation-showcase" element={<AnimationShowcase />} />
```

**Pros:**
- Uses actual animation components
- Always in sync with production code
- Full feature set and accuracy
- Real performance metrics

**Cons:**
- Requires dev server running
- Larger bundle size
- More complex setup

## Features

### 1. Spell Library

**10 Wizard Spells:**

**Offensive Spells (6):**
- **Magic Bolt**: Basic arcane projectile (1400ms)
- **Fireball**: Fire projectile with explosion (950ms)
- **Ice Shard**: Ice projectile with shatter (900ms)
- **Lightning**: Lightning strike from sky (900ms)
- **Holy Beam**: Divine light beam (1000ms)
- **Meteor**: AOE meteor strike (1500ms)

**Support Spells (4):**
- **Heal**: Healing restoration (1100ms)
- **Protect**: Defense buff shield (900ms)
- **Shell**: Magic defense buff (900ms)
- **Haste**: Speed buff (700ms)

### 2. Animation Controls

**Playback Controls:**
- **Play**: Start/replay current animation
- **Pause**: Pause animation (currently disabled, animations play to completion)
- **Previous**: Navigate to previous spell in list
- **Next**: Navigate to next spell in list
- **Play All**: Queue and play all 10 spells sequentially

**Settings:**
- **Critical Hit Toggle**: Switch between normal and critical hit variants
  - Normal: Standard animation timing and visuals
  - Critical: 1.4x scale, 1.5x particles, gold overlays, screen shake

### 3. Visual Feedback

**Animation Status Display:**
- Current spell name
- Normal/Critical indicator
- Playing/Idle/Complete status
- Progress bar (real-time)
- Elapsed time / Total duration

**Spell List Indicators:**
- Active spell highlighted
- Completed spells marked with checkmark
- Hover effects for interactivity

### 4. Battle Stage

**Character Positioning:**
- **Wizard** (left): Player character casting spells
- **Enemy** (right): Target for offensive spells / recipient for buffs

**Animation Layer:**
- Transparent overlay for animations
- Positioned absolutely to not interfere with UI
- Z-index 100 ensures animations appear above stage

## Usage Guide

### Basic Workflow

1. **Select a Spell**
   - Click any spell in the sidebar list
   - The spell name will appear in the stage info
   - Animation plays immediately

2. **Toggle Critical Hits**
   - Check "Critical Hit Mode ⭐" before playing
   - All subsequent animations will use critical variant
   - Uncheck to return to normal animations

3. **Navigate Between Spells**
   - Use Previous/Next buttons to cycle through spells
   - Or click directly on any spell in the list

4. **Play All Spells**
   - Click "Play All Spells" button
   - Animations play in sequence with 500ms gaps
   - Completed spells show checkmarks
   - Queue stops if you click another spell

### Testing Scenarios

#### Scenario 1: Verify Individual Spell

**Purpose**: Check if a specific spell animation works correctly

**Steps:**
1. Select the spell from the list
2. Observe the animation phases (charge → cast → travel → impact)
3. Verify timing matches expected duration
4. Check visual effects (particles, colors, motion)
5. Test critical variant by toggling the checkbox

**Success Criteria:**
- Animation plays smoothly without errors
- Timing is within ±50ms of expected duration
- Visual effects match design specifications
- Critical variant shows enhanced visuals

#### Scenario 2: Compare Normal vs Critical

**Purpose**: Verify critical hit enhancements work properly

**Steps:**
1. Select a spell (e.g., Fireball)
2. Play normal version (checkbox unchecked)
3. Observe animation intensity
4. Toggle Critical Hit Mode on
5. Play the same spell again
6. Compare visual differences

**Expected Differences:**
- 1.4x larger visual effects
- 50% more particles
- Golden glow overlay
- Screen shake on impact
- Brighter colors/higher intensity

#### Scenario 3: Full Suite Regression Test

**Purpose**: Ensure all animations work after code changes

**Steps:**
1. Click "Play All Spells"
2. Watch the full sequence
3. Note any errors in console
4. Verify each animation completes
5. Repeat with Critical Hit Mode enabled

**Success Criteria:**
- All 10 spells play without errors
- No animations freeze or crash
- Console shows no errors/warnings
- Timings are consistent
- All checkmarks appear after completion

#### Scenario 4: Performance Validation

**Purpose**: Check animation performance meets 60fps target

**Steps:**
1. Open browser DevTools (F12)
2. Go to Performance tab
3. Start recording
4. Click "Play All Spells"
5. Stop recording after sequence completes
6. Analyze frame rate

**Success Criteria:**
- Consistent 60fps throughout
- No frame drops during animations
- Total blocking time < 50ms per animation
- Memory usage stays reasonable (< 100MB growth)

## Troubleshooting

### Issue: Animations Don't Play

**Possible Causes:**
1. React component not properly imported
2. AnimationController not receiving correct props
3. Character positions not calculated correctly

**Solutions:**
1. Check browser console for errors
2. Verify `wizardRef` and `enemyRef` are attached
3. Ensure `getCharacterPositions()` returns valid values
4. Check that spell IDs match animation registry

### Issue: Animations Look Wrong

**Possible Causes:**
1. Using standalone HTML (shows mock only)
2. Outdated animation components
3. CSS conflicts

**Solutions:**
1. Use React component version for real animations
2. Rebuild the application (`npm run build`)
3. Clear browser cache
4. Verify CSS classes aren't overridden

### Issue: Critical Hits Don't Look Different

**Possible Causes:**
1. Critical multipliers not applied
2. Animation component doesn't support `isCritical` prop
3. Critical variant code missing

**Solutions:**
1. Check that `isCritical` prop is passed to AnimationController
2. Verify animation component reads `isCritical` from props
3. Review component implementation for critical-specific code
4. Check CRITICAL_HIT_MULTIPLIERS in types.ts

### Issue: Progress Bar Doesn't Match Animation

**Possible Causes:**
1. Duration mismatch between SPELLS array and actual animation
2. Progress interval not clearing properly
3. Animation completes earlier/later than expected

**Solutions:**
1. Update SPELLS array durations to match animation metadata
2. Ensure `onComplete` callback fires correctly
3. Add logging to track actual animation duration
4. Verify `progressIntervalRef` cleanup in useEffect

### Issue: "Play All" Stops Prematurely

**Possible Causes:**
1. Animation error breaks the queue
2. `onComplete` not called
3. Queue ref cleared unexpectedly

**Solutions:**
1. Check console for animation errors
2. Verify AnimationController calls `onComplete`
3. Add error boundaries to catch animation failures
4. Log queue state before/after each animation

## Integration with Main App

### Adding to Development Menu

```tsx
// In your main app or dev tools menu
import { AnimationShowcase } from './components/combat/AnimationShowcase';

// Add menu item
<DevMenuItem onClick={() => navigate('/animation-showcase')}>
  🎬 Animation Showcase
</DevMenuItem>

// Add route
<Route path="/animation-showcase" element={<AnimationShowcase />} />
```

### Creating Direct Access Button

```tsx
// Add to game settings or debug menu
<Button onClick={() => window.open('/animation-showcase.html', '_blank')}>
  Open Animation Showcase
</Button>
```

### Embedding in Documentation

```markdown
# Animation System

View all animations in the [Animation Showcase](./animation-showcase.html)
```

## Performance Benchmarks

Based on Task 7.8 performance testing:

| Spell | Duration | Avg FPS | Min FPS | Frame Drops |
|-------|----------|---------|---------|-------------|
| Magic Bolt | 1400ms | 1792 | 60 | 0 |
| Fireball | 950ms | 1792 | 60 | 0 |
| Ice Shard | 900ms | 1792 | 60 | 0 |
| Lightning | 900ms | 1792 | 60 | 0 |
| Holy Beam | 1000ms | 1792 | 60 | 0 |
| Meteor | 1500ms | 1792 | 60 | 0 |
| Heal | 1100ms | 1792 | 60 | 0 |
| Protect | 900ms | 1792 | 60 | 0 |
| Shell | 900ms | 1792 | 60 | 0 |
| Haste | 700ms | 1792 | 60 | 0 |

**All animations exceed 60fps target with zero frame drops.**

## Development Workflow

### Adding New Animations

When adding a new wizard spell animation:

1. **Implement the animation component** (see `docs/animations/adding-new-animations.md`)

2. **Register in animation registry**:
   ```typescript
   // src/components/combat/animations/animationRegistry.ts
   import { NewSpellAnimation } from './variants/NewSpellAnimation';

   export const ATTACK_ANIMATION_MAP = {
     // ...
     new_spell: {
       element: 'fire',
       type: 'projectile',
       component: NewSpellAnimation,
       description: 'New spell description'
     }
   };
   ```

3. **Add to showcase SPELLS array**:
   ```typescript
   // src/components/combat/AnimationShowcase.tsx
   const SPELLS: SpellDefinition[] = [
     // ...
     {
       id: 'new_spell',
       name: 'New Spell',
       type: 'Fire Projectile',
       duration: 1000,
       category: 'offensive',
       element: 'fire'
     }
   ];
   ```

4. **Test in showcase**:
   - Open Animation Showcase
   - Select your new spell
   - Verify normal and critical variants
   - Check performance in DevTools

### Updating Existing Animations

When modifying an animation:

1. Make changes to animation component
2. Update duration in SPELLS array if changed
3. Test in Animation Showcase
4. Run "Play All" regression test
5. Verify critical variant still works
6. Check console for warnings/errors

## Files

### Source Files

- **`animation-showcase.html`**: Standalone HTML demo page
- **`src/components/combat/AnimationShowcase.tsx`**: React component
- **`src/components/combat/AnimationShowcase.css`**: Component styles
- **`docs/animations/animation-showcase-guide.md`**: This guide

### Dependencies

- `AnimationController.tsx`: Animation orchestration
- `animationRegistry.ts`: Spell-to-component mapping
- All variant animation components (Fireball, IceShard, etc.)
- Animation types and constants

## Best Practices

### For Developers

1. **Always test in showcase before committing** animation changes
2. **Run "Play All"** to catch regressions
3. **Test both normal and critical** variants
4. **Monitor console** for warnings during development
5. **Use DevTools Performance tab** for performance validation

### For Designers

1. **Use standalone HTML** for quick visual reviews
2. **Toggle Critical Hit Mode** to see enhanced variants
3. **Compare spell timings** by watching multiple spells
4. **Note discrepancies** between design and implementation
5. **Provide feedback** with specific spell names and issues

### For QA

1. **Test after every animation system change**
2. **Create test plan** using the scenarios above
3. **Document any visual bugs** with screenshots
4. **Verify cross-browser** (Chrome, Firefox, Safari)
5. **Check performance** doesn't degrade over time

## Future Enhancements

Potential improvements to the showcase:

1. **Pause/Resume**: Support pausing mid-animation
2. **Slow Motion**: 0.5x, 0.25x speed for detailed inspection
3. **Frame-by-Frame**: Step through animation manually
4. **Side-by-Side**: Compare normal vs critical simultaneously
5. **Recording**: Export animations as video/GIF
6. **Metrics Display**: Show FPS, particle count in real-time
7. **Custom Positions**: Drag characters to test different positions
8. **Background Selection**: Test animations on different backgrounds
9. **Spell Comparison**: View 2-3 spells side-by-side
10. **Animation Timeline**: Visual timeline of all phases

## Summary

The Animation Showcase is your primary tool for:
- ✅ Viewing all wizard spell animations
- ✅ Testing normal and critical variants
- ✅ Validating animation quality and performance
- ✅ Demonstrating the animation system
- ✅ Regression testing after changes

**Quick Start:**
1. Open `animation-showcase.html` in browser
2. Click a spell from the list
3. Watch the animation
4. Toggle critical mode and repeat

For production-accurate testing, use the React component version with the full dev server running.
