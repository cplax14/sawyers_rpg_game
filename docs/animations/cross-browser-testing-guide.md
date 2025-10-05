# Cross-Browser Testing Guide

## Quick Start

This guide explains how to manually test spell animations across different browsers to ensure visual consistency and performance parity.

## Prerequisites

### Required Browsers

Install the latest stable versions:

1. **Google Chrome** - https://www.google.com/chrome/
2. **Mozilla Firefox** - https://www.mozilla.org/firefox/
3. **Safari** - Pre-installed on macOS, or https://support.apple.com/downloads/safari (Windows)

### Development Environment

```bash
# Start the development server
npm run dev

# Server will start at http://localhost:3000
```

## Testing Workflow

### Step 1: Start a New Game

1. Open browser and navigate to `http://localhost:3000`
2. Click "Start New Game"
3. Select "Wizard" character class
4. Click "Begin Adventure"

### Step 2: Enter Combat

1. From World Map, select "Whispering Woods" (starting area)
2. Click "Explore" to trigger random encounters
3. Keep exploring until you encounter an enemy (70-75% encounter rate)

### Step 3: Test Normal Animations

For each spell, follow this process:

#### Magic Bolt (Default Spell)
1. Select "Attack" → "Magic Bolt"
2. **Observe**: Purple arcane particles, blue-violet projectile, impact burst
3. **Time it**: Should complete in ~700ms
4. **Check FPS**: Open DevTools Performance panel

#### Fireball
1. Ensure MP ≥ 10
2. Select "Attack" → "Fireball"
3. **Observe**: Red/orange charge particles, spinning fireball, explosion
4. **Time it**: Should complete in ~950ms
5. **Check colors**: Fire should be vibrant red/orange/yellow

#### Ice Shard
1. Ensure MP ≥ 8
2. Select "Attack" → "Ice Shard"
3. **Observe**: Blue crystalline particles, rotating ice shard, shatter effect
4. **Time it**: Should complete in ~900ms
5. **Check colors**: Ice should be light blue/cyan

#### Lightning
1. Ensure MP ≥ 12
2. Select "Attack" → "Lightning"
3. **Observe**: Electric sparks, bolt from sky, electric burst
4. **Time it**: Should complete in ~900ms
5. **Check colors**: Lightning should be yellow/white with purple accents

#### Holy Beam
1. Ensure MP ≥ 15
2. Select "Attack" → "Holy Beam"
3. **Observe**: Golden particles above, column of light, radiant burst
4. **Time it**: Should complete in ~1000ms
5. **Check colors**: Holy should be gold/yellow/white

#### Meteor
1. Ensure MP ≥ 20
2. Select "Attack" → "Meteor"
3. **Observe**: Red glow in sky, shadow circles, meteor crash, dust
4. **Time it**: Should complete in ~1500ms
5. **Check colors**: Meteor should be red/orange with dark shadows

### Step 4: Test Critical Hit Animations

Critical hits occur randomly (based on stats). To test:

1. **Keep attacking** until a critical hit occurs (look for "CRITICAL!" text)
2. **Verify enhancements**:
   - Gold overlay on particles and projectile
   - Screen shake effect
   - Impact rings around hit area
   - 1.4x scale on projectile
   - 1.5x particle count

**Tip**: Higher AGI stats increase critical chance. You can modify save data to boost AGI for faster testing.

### Step 5: Performance Profiling

For each browser:

#### Chrome DevTools
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Trigger an animation
5. Stop recording
6. Check FPS chart - should stay at 60 FPS

#### Firefox DevTools
1. Open DevTools (F12)
2. Go to Performance tab
3. Click Record
4. Trigger an animation
5. Stop recording
6. Check frame rate - should be 60 FPS

#### Safari Web Inspector
1. Open Web Inspector (Option + Cmd + I on macOS)
2. Go to Timelines tab
3. Click Record
4. Trigger an animation
5. Stop recording
6. Check rendering timeline

### Step 6: Document Results

For each browser, fill in the test report:

**File**: `docs/animations/task-7.9-cross-browser-test-report.md`

Update the tables with:
- ✅ Visual pass
- ⚠️ Visual with caveats
- ❌ Visual fail
- Timing (measured duration)
- FPS (observed frame rate)
- Notes (any issues)

## What to Look For

### Visual Checks

#### Particle Systems
- **Count**: Should see 15-30 particles per effect
- **Color**: Should match element (red for fire, blue for ice, etc.)
- **Motion**: Should move smoothly without jitter
- **Fade**: Should fade in/out smoothly

#### Blur Effects
- **Glow**: Projectiles should have soft glow
- **Motion blur**: Should see subtle blur on fast-moving projectiles
- **Intensity**: Should not be overwhelming

**Browser Differences**:
- Safari may render blur lighter than Chrome
- Firefox may have slight color differences in gradients

#### Color Accuracy

| Element | Primary Color | Secondary Color | Accent Color |
|---------|--------------|-----------------|--------------|
| Arcane | #9b59b6 (purple) | #6c5ce7 (violet) | #a29bfe (light purple) |
| Fire | #ff6b35 (red-orange) | #f7931e (orange) | #ffc107 (yellow) |
| Ice | #4da6ff (light blue) | #00bfff (deep sky blue) | #e0f7fa (cyan tint) |
| Lightning | #ffd700 (gold) | #ffeb3b (yellow) | #9c27b0 (purple) |
| Holy | #ffd700 (gold) | #fff9e6 (cream) | #ffeb3b (light yellow) |
| Shadow | #2c2c3e (dark purple) | #1a1a2e (very dark) | #4a4a6a (gray-purple) |

**How to verify**:
1. Take a screenshot during animation peak
2. Use color picker tool to sample colors
3. Compare against table above
4. Allow ±10% variance for browser differences

#### Transform Animations

Check for smoothness:
- **Scale**: Projectiles should grow/shrink without jitter
- **Rotate**: Spinning projectiles should rotate smoothly
- **Translate**: Movement should be fluid, not jerky

**Red flags**:
- Stuttering motion
- Sudden jumps or teleporting
- Rotation snapping to angles
- Scale popping instead of smooth growth

### Performance Checks

#### Frame Rate
- **Target**: 60 FPS
- **Acceptable**: 55-60 FPS (occasional minor dips)
- **Problematic**: Below 50 FPS (animation feels sluggish)

**How to measure**:
1. Open DevTools Performance panel
2. Enable "Show FPS meter" (Chrome)
3. Record during animation
4. Check FPS graph - should be flat line at 60

#### Frame Drops
- **Target**: 0 frame drops
- **Acceptable**: 1-2 occasional drops
- **Problematic**: Consistent frame drops

**How to identify**:
- FPS graph dips below 60
- Visual stuttering during animation
- Audio/video desync

#### Memory Usage
- **Normal**: Memory should be stable
- **Problematic**: Memory spikes and doesn't return to baseline

**How to check**:
1. Open DevTools Memory panel
2. Take heap snapshot before animation
3. Trigger animation
4. Take heap snapshot after
5. Compare - should be similar size

### Timing Accuracy

Use a stopwatch or DevTools to measure:

1. **Start**: When you click spell button
2. **End**: When damage numbers appear and turn advances
3. **Duration**: Compare to spec

**Tolerance**: ±100ms is acceptable (browser render timing varies)

**Example**:
- Fireball spec: 950ms
- Acceptable range: 850ms - 1050ms
- Measured: 920ms → ✅ PASS

### Critical Hit Verification

When a critical hit occurs, verify:

1. **Gold Overlay**
   - ✅ Particles have gold tint
   - ✅ Projectile has gold glow
   - ✅ Impact has gold flash

2. **Screen Shake**
   - ✅ Screen shakes during impact
   - ✅ Shake is noticeable but not nauseating
   - ✅ Shake returns to normal quickly

3. **Impact Rings**
   - ✅ Rings expand from impact point
   - ✅ Rings are gold colored
   - ✅ Rings fade out smoothly

4. **"CRITICAL!" Indicator**
   - ✅ Text appears above enemy
   - ✅ Text is large and readable
   - ✅ Text fades after a moment

5. **Scale Enhancement**
   - ✅ Projectile is visibly larger (1.4x)
   - ✅ Particles are more numerous (1.5x)

## Common Issues & Debugging

### Issue: Animation Doesn't Play

**Symptoms**: Click spell, nothing happens, damage appears immediately

**Possible Causes**:
- Animation component failed to load
- JavaScript error in console
- Invalid position data

**Debug Steps**:
1. Open Console (F12)
2. Look for red error messages
3. Check Network tab for failed script loads
4. Check that spell ID matches registry

### Issue: Animation Plays But Looks Wrong

**Symptoms**: Animation plays but particles missing, wrong colors, or glitchy

**Possible Causes**:
- Browser doesn't support CSS filters
- GPU acceleration disabled
- Color profile differences

**Debug Steps**:
1. Check browser version (ensure latest)
2. Check GPU acceleration (chrome://gpu in Chrome)
3. Try disabling DevTools (can impact performance)
4. Compare with other browsers

### Issue: Animation is Slow/Laggy

**Symptoms**: Animation stutters, FPS below 60, feels sluggish

**Possible Causes**:
- Too many particles
- Heavy blur effects
- Other tabs/apps consuming resources
- Integrated graphics (not dedicated GPU)

**Debug Steps**:
1. Close other tabs and applications
2. Check system resource usage (CPU, GPU)
3. Test on different machine if available
4. Record Performance profile to find bottleneck

### Issue: Critical Hit Effects Not Working

**Symptoms**: Critical hits occur but enhancements don't show

**Possible Causes**:
- `isCritical` prop not being passed
- Gold overlay CSS not loading
- Screen shake not supported

**Debug Steps**:
1. Check Console for "CRITICAL!" log message
2. Inspect animation component props (React DevTools)
3. Verify CSS classes are applied
4. Test in different browser

### Issue: Timing Off

**Symptoms**: Animation completes too fast or too slow

**Possible Causes**:
- Browser refresh rate not 60Hz
- Performance mode enabled (Firefox)
- System performance throttling

**Debug Steps**:
1. Check monitor refresh rate
2. Disable battery saver / performance mode
3. Test on external monitor (if laptop)
4. Compare multiple browsers

## Browser-Specific Tips

### Chrome
- **Best performance**: Usually fastest for animations
- **DevTools**: Most robust performance profiling
- **Tips**:
  - Use Incognito mode to avoid extension interference
  - Enable hardware acceleration (Settings → Advanced → System)

### Firefox
- **Good compatibility**: Generally good, may be slower than Chrome
- **DevTools**: Solid performance tools
- **Tips**:
  - Disable privacy protection for localhost (can affect timing)
  - Check `about:config` for hardware acceleration settings

### Safari
- **macOS only**: Best on Mac, Windows version discontinued
- **Color handling**: Different color space (DCI-P3 vs sRGB)
- **Tips**:
  - Develop menu → Enable Web Inspector
  - Disable "Responsive Design Mode" for accurate testing
  - Test on actual Safari, not Safari Technology Preview

## Test Report Template

Copy this template for each browser:

```markdown
## [Browser Name + Version]

Date: YYYY-MM-DD
Tester: [Your Name]
System: [OS + Hardware]

### Normal Animations

| Spell | Visual | Timing | FPS | Issues |
|-------|--------|--------|-----|--------|
| Magic Bolt | ✅/⚠️/❌ | XXXms | XX | |
| Fireball | ✅/⚠️/❌ | XXXms | XX | |
| Ice Shard | ✅/⚠️/❌ | XXXms | XX | |
| Lightning | ✅/⚠️/❌ | XXXms | XX | |
| Holy Beam | ✅/⚠️/❌ | XXXms | XX | |
| Meteor | ✅/⚠️/❌ | XXXms | XX | |

### Critical Hit Animations

| Spell | Gold Overlay | Screen Shake | Impact Rings | FPS |
|-------|--------------|--------------|--------------|-----|
| Magic Bolt | ✅/❌ | ✅/❌ | ✅/❌ | XX |
| Fireball | ✅/❌ | ✅/❌ | ✅/❌ | XX |
| Ice Shard | ✅/❌ | ✅/❌ | ✅/❌ | XX |
| Lightning | ✅/❌ | ✅/❌ | ✅/❌ | XX |
| Holy Beam | ✅/❌ | ✅/❌ | ✅/❌ | XX |
| Meteor | ✅/❌ | ✅/❌ | ✅/❌ | XX |

### Notes
- [Any observations, issues, or recommendations]
```

## Automated Testing (Future)

Currently, testing is manual. Potential automated testing approaches:

### Playwright/Puppeteer
- Launch browsers programmatically
- Capture screenshots for visual comparison
- Measure performance metrics
- Compare across browsers

### Visual Regression Testing
- Percy.io or similar service
- Capture baseline screenshots
- Detect visual changes across browsers

### Performance Benchmarking
- Automated performance profiling
- FPS measurement via Performance Observer API
- Memory leak detection

## Reporting Issues

If you find a browser-specific issue:

1. **Document clearly**:
   - Browser + version
   - Operating system
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos

2. **Check if known issue**:
   - Review `task-7.9-cross-browser-test-report.md`
   - Search project issues/discussions

3. **Log in test report**:
   - Add to "Known Issues" section
   - Include severity rating
   - Suggest workaround if possible

4. **Create issue ticket** (if new bug):
   - Title: `[Browser] Animation Issue: Brief Description`
   - Labels: `animation`, `cross-browser`, `bug`
   - Link to test report

## Success Criteria

Task 7.9 is complete when:

- ✅ All 6 spells tested on Chrome (normal + critical)
- ✅ All 6 spells tested on Firefox (normal + critical)
- ✅ All 6 spells tested on Safari (normal + critical)
- ✅ Test report fully filled out with results
- ✅ All browsers maintain 60 FPS
- ✅ Visual consistency verified (or differences documented)
- ✅ Critical hit effects work on all browsers
- ✅ No blocking bugs identified

## Resources

### Documentation
- **PRD**: `/docs/prd-combat-animation-system.md`
- **Animation Specs**: `/docs/animations/wizard-spell-specifications.md`
- **Timing Guidelines**: `/docs/animations/timing-guidelines.md`
- **Performance Report**: `/docs/animations/performance-report.md`

### Browser Documentation
- **Chrome DevTools**: https://developer.chrome.com/docs/devtools/
- **Firefox DevTools**: https://firefox-source-docs.mozilla.org/devtools-user/
- **Safari Web Inspector**: https://developer.apple.com/safari/tools/

### Performance Tools
- **Chrome FPS Meter**: DevTools → Rendering → Frame Rendering Stats
- **Firefox Performance**: DevTools → Performance → Record
- **Safari Timelines**: Web Inspector → Timelines

---

**Questions?** Check the troubleshooting guide or reach out to the development team.
