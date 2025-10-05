# Animation Performance Test - Task 7.8

This directory contains the performance testing infrastructure for verifying that all spell animations maintain 60fps performance.

## Quick Start

### Automated Test (Recommended)

The easiest way to run the performance test is using the automated script:

```bash
# Terminal 1: Start the dev server
npm run dev

# Terminal 2: Run the automated performance test
npm run test:performance
```

The automated test will:
1. Launch Chrome browser
2. Navigate to the performance test page
3. Automatically run all animations
4. Extract performance metrics
5. Generate reports (JSON, Markdown, Screenshot)
6. Exit with success/failure status

### Manual Testing

If you prefer to run the test manually:

```bash
# Start the dev server
npm run dev

# Navigate to the test page in your browser
# http://localhost:3000/animation-performance-test.html
```

Then:
1. Click "Start Test" button
2. Watch animations play automatically
3. Review the performance report
4. Click "Export Report" to save results

## Test Configuration

### Test Modes

- **Sequential**: 500ms delay between animations (default, realistic)
- **Stress Test**: 100ms delay between animations (intensive)

### Options

- **Include Critical Hit Variants**: Tests both normal and critical hit versions of each spell

## Spell Animations Tested

The test covers all 6 spell animations implemented in the system:

1. **Magic Bolt** (Arcane) - Basic arcane projectile
2. **Fireball** (Fire) - Fire projectile with explosion
3. **Ice Shard** (Ice) - Ice projectile with freeze effect
4. **Lightning** (Lightning) - Lightning beam attack
5. **Holy Beam** (Holy) - Holy beam with divine effects
6. **Meteor** (Fire AOE) - Large meteor with impact

Each spell is tested with:
- Normal hit variant
- Critical hit variant (enhanced effects)

**Total animations tested:** 12 (6 spells × 2 variants)

## Success Criteria

The test passes if ALL of the following conditions are met:

1. **Average FPS ≥ 55** across all animations
2. **Frame drops < 10%** of total frames measured
3. **Individual animations ≥ 50 FPS** average
4. **No animation crashes or errors**

## Performance Metrics Measured

### Overall Metrics
- Test duration (total time)
- Total animations tested
- Overall average FPS
- Overall minimum FPS
- Overall maximum FPS
- Total frame drops (count and percentage)

### Per-Animation Metrics
- Animation duration (milliseconds)
- Average FPS during animation
- Minimum FPS during animation
- Frame drop count
- Pass/fail status

## FPS Measurement

The test uses `requestAnimationFrame` timing to accurately measure FPS:

```javascript
const fps = 1000 / deltaTime;
```

- Samples FPS every frame during animation
- Tracks minimum, maximum, and average
- Counts frames below 55 FPS as "drops"

## Generated Reports

### 1. JSON Report
`task-7.8-performance-test-report.json`

Complete performance data including:
- Full FPS samples for each animation
- Detailed timing information
- Browser/system information
- Test configuration

### 2. Markdown Report
`task-7.8-performance-test-report.md`

Human-readable summary with:
- Overall results table
- Individual animation results
- Success criteria checklist
- Failure analysis (if applicable)

### 3. Screenshot
`performance-test-results.png`

Full-page screenshot of the final performance report UI.

## Troubleshooting

### Test Won't Start

**Issue:** "Development Server Required" message appears

**Solution:** Make sure Vite dev server is running:
```bash
npm run dev
```

### Poor Performance Results

**Issue:** FPS below 60, many frame drops

**Solutions:**
1. Close other browser tabs
2. Close unnecessary applications
3. Ensure hardware acceleration is enabled in Chrome
4. Try running in regular (non-headless) mode for automated tests

### Browser Not Opening (Automated Test)

**Issue:** Playwright error launching browser

**Solution:** Install Playwright browsers:
```bash
npx playwright install chromium
```

### Module Not Found Errors

**Issue:** TypeScript compilation errors

**Solution:** Build the project first:
```bash
npm run build
```

## Architecture

### Component Structure

```
AnimationPerformanceTest.tsx
├── FPSMonitor class
│   ├── start() - Begin FPS measurement
│   ├── stop() - End FPS measurement
│   ├── measureFrame() - RAF loop
│   └── getMeasurement() - Get FPS stats
│
├── Test Configuration
│   ├── TEST_SPELLS - Spell definitions
│   └── Test modes (sequential/stress)
│
├── Test Execution
│   ├── buildTestQueue() - Create animation queue
│   ├── triggerAnimation() - Start an animation
│   ├── handleAnimationComplete() - Process results
│   └── completeTest() - Finalize and report
│
└── UI Components
    ├── Test controls (buttons, config)
    ├── Progress display
    ├── Results table
    └── Export functionality
```

### Automation Script

```
run-performance-test.js
├── runPerformanceTest() - Main test executor
│   ├── Launch browser (Playwright)
│   ├── Navigate to test page
│   ├── Click "Start Test"
│   ├── Wait for completion
│   ├── Extract results from DOM
│   └── Download JSON report
│
├── generateMarkdownReport() - Create MD report
└── checkDevServer() - Verify server running
```

## Best Practices

### For Accurate Results

1. **Close other applications** to minimize CPU/GPU competition
2. **Run in full screen** to avoid rendering overhead
3. **Use production-like viewport** (1440x900 used in automated tests)
4. **Multiple test runs** recommended for statistical confidence
5. **Compare across browsers** if targeting multi-browser support

### Interpreting Results

- **60+ FPS**: Excellent performance
- **55-60 FPS**: Good performance (acceptable)
- **50-55 FPS**: Marginal performance (optimize if possible)
- **< 50 FPS**: Poor performance (optimization required)

### Frame Drops

- **0-5%**: Excellent
- **5-10%**: Acceptable
- **10-20%**: Needs attention
- **> 20%**: Significant optimization required

## Optimization Guidance

If performance tests fail, check:

1. **Particle counts** - Should be ≤ 30 per effect
2. **GPU properties** - Use `transform` and `opacity` only
3. **Animation complexity** - Reduce simultaneous effects
4. **DOM updates** - Minimize reflows during animation
5. **Critical hit multipliers** - Verify they don't exceed limits

See `docs/animations/performance-report.md` for detailed optimization strategies.

## Related Files

- `/src/components/combat/animations/AnimationPerformanceTest.tsx` - Test component
- `/src/performance-test-entry.tsx` - Standalone entry point
- `/animation-performance-test.html` - Test page
- `/scripts/run-performance-test.js` - Automated test runner
- `/docs/animations/task-7.8-performance-test-report.md` - Generated report
- `/docs/animations/task-7.8-performance-test-report.json` - Raw data

## Task 7.8 Completion

This performance testing system completes Task 7.8 by:

✅ Testing all 6 spell animations in sequence
✅ Measuring FPS during each animation
✅ Testing both normal and critical hit variants
✅ Verifying 60fps target is met
✅ Generating comprehensive performance reports
✅ Providing automated and manual test options

---

**Last Updated:** 2025-10-04
**Status:** Complete and ready for use
