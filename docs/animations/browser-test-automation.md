# Browser Test Automation Script

## Overview

This document provides automation scripts for systematic cross-browser testing of spell animations. While manual visual inspection is still required, these scripts help automate the testing workflow.

## Prerequisites

```bash
# Ensure development server is running
npm run dev
```

## Automated Browser Testing Approach

### Option 1: Playwright (Recommended)

Since Playwright is already integrated via MCP, we can create a comprehensive test suite:

```javascript
// test-animations-cross-browser.js
const { chromium, firefox, webkit } = require('playwright');

const SPELL_TESTS = [
  { name: 'Magic Bolt', attackType: 'magic_bolt', expectedDuration: 700 },
  { name: 'Fireball', attackType: 'fire', expectedDuration: 950 },
  { name: 'Ice Shard', attackType: 'ice', expectedDuration: 900 },
  { name: 'Lightning', attackType: 'lightning', expectedDuration: 900 },
  { name: 'Holy Beam', attackType: 'holy', expectedDuration: 1000 },
  { name: 'Meteor', attackType: 'meteor', expectedDuration: 1500 }
];

const BROWSERS = [
  { name: 'Chrome', launch: chromium },
  { name: 'Firefox', launch: firefox },
  { name: 'Safari', launch: webkit }
];

async function testAnimationInBrowser(browserName, browserLauncher) {
  console.log(`\n=== Testing in ${browserName} ===\n`);

  const browser = await browserLauncher.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  // Enable performance monitoring
  await page.evaluate(() => {
    window.animationMetrics = {
      fps: [],
      durations: {}
    };

    let lastFrameTime = performance.now();
    function measureFPS() {
      const now = performance.now();
      const fps = 1000 / (now - lastFrameTime);
      window.animationMetrics.fps.push(fps);
      lastFrameTime = now;
      requestAnimationFrame(measureFPS);
    }
    measureFPS();
  });

  // Navigate and setup game
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Click New Game
  await page.click('text=New Game');

  // Select Wizard
  await page.click('text=Choose Class >> nth=0'); // Click first "Choose Class" (Wizard)

  // Enter name
  await page.fill('input[placeholder*="character"]', 'TestWizard');

  // Start Adventure
  await page.click('text=Start Adventure');

  // Navigate to combat
  await page.waitForSelector('text=Whispering Woods');
  await page.click('text=Explore');

  // Wait for combat to start (may need multiple explorations)
  let inCombat = false;
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(500);
    const combatActive = await page.isVisible('text=Attack');
    if (combatActive) {
      inCombat = true;
      break;
    }
    // If not in combat, explore again
    const exploreVisible = await page.isVisible('text=Explore');
    if (exploreVisible) {
      await page.click('text=Explore');
    }
  }

  if (!inCombat) {
    console.error(`${browserName}: Failed to enter combat`);
    await browser.close();
    return;
  }

  const results = [];

  // Test each spell
  for (const spell of SPELL_TESTS) {
    console.log(`  Testing ${spell.name}...`);

    // Clear FPS metrics
    await page.evaluate(() => {
      window.animationMetrics.fps = [];
    });

    // Click Attack button
    await page.click('text=Attack');

    // Check if spell is available
    const spellAvailable = await page.isVisible(`text=${spell.name}`);
    if (!spellAvailable) {
      console.warn(`  ${spell.name} not available, skipping`);
      continue;
    }

    // Measure animation
    const startTime = Date.now();
    await page.click(`text=${spell.name}`);

    // Wait for animation to complete (look for next turn)
    await page.waitForSelector('text=Attack', { state: 'visible', timeout: 5000 });
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Get FPS data
    const metrics = await page.evaluate(() => {
      const fps = window.animationMetrics.fps;
      const avgFPS = fps.reduce((a, b) => a + b, 0) / fps.length;
      const minFPS = Math.min(...fps);
      return { avgFPS, minFPS, samples: fps.length };
    });

    results.push({
      spell: spell.name,
      duration,
      expectedDuration: spell.expectedDuration,
      withinTolerance: Math.abs(duration - spell.expectedDuration) <= 200,
      avgFPS: metrics.avgFPS.toFixed(2),
      minFPS: metrics.minFPS.toFixed(2),
      frameDrops: metrics.avgFPS < 55 ? 'YES' : 'NO'
    });

    console.log(`    Duration: ${duration}ms (expected: ${spell.expectedDuration}ms)`);
    console.log(`    Avg FPS: ${metrics.avgFPS.toFixed(2)}, Min FPS: ${metrics.minFPS.toFixed(2)}`);
  }

  // Generate report
  console.log(`\n=== ${browserName} Results ===\n`);
  console.table(results);

  await browser.close();
  return results;
}

async function runAllTests() {
  const allResults = {};

  for (const browser of BROWSERS) {
    try {
      allResults[browser.name] = await testAnimationInBrowser(browser.name, browser.launch);
    } catch (error) {
      console.error(`Error testing ${browser.name}:`, error.message);
      allResults[browser.name] = { error: error.message };
    }
  }

  // Generate comparison report
  console.log('\n=== Cross-Browser Comparison ===\n');

  // Save results to file
  const fs = require('fs');
  fs.writeFileSync(
    'docs/animations/automated-test-results.json',
    JSON.stringify(allResults, null, 2)
  );

  console.log('\nResults saved to docs/animations/automated-test-results.json');
}

runAllTests().catch(console.error);
```

### Option 2: Manual Test Checklist Script

For manual testing with a structured checklist:

```javascript
// manual-test-helper.js
// Run this in the browser console during manual testing

class AnimationTester {
  constructor() {
    this.results = {
      browser: navigator.userAgent,
      timestamp: new Date().toISOString(),
      tests: []
    };
  }

  startTest(spellName) {
    this.currentTest = {
      spell: spellName,
      startTime: performance.now(),
      startFPS: this.getCurrentFPS()
    };
    console.log(`🎬 Testing ${spellName}...`);
  }

  endTest(passed, notes = '') {
    if (!this.currentTest) {
      console.error('No test in progress');
      return;
    }

    this.currentTest.endTime = performance.now();
    this.currentTest.duration = this.currentTest.endTime - this.currentTest.startTime;
    this.currentTest.passed = passed;
    this.currentTest.notes = notes;

    this.results.tests.push(this.currentTest);

    console.log(`✅ ${this.currentTest.spell}: ${this.currentTest.duration.toFixed(0)}ms`);
    this.currentTest = null;
  }

  getCurrentFPS() {
    // Estimate based on requestAnimationFrame
    let frameCount = 0;
    let lastTime = performance.now();

    const countFrames = () => {
      frameCount++;
      requestAnimationFrame(countFrames);
    };
    countFrames();

    setTimeout(() => {
      const now = performance.now();
      const fps = (frameCount / (now - lastTime)) * 1000;
      console.log(`Current FPS: ${fps.toFixed(2)}`);
    }, 1000);
  }

  exportResults() {
    const json = JSON.stringify(this.results, null, 2);
    console.log(json);

    // Copy to clipboard if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(json);
      console.log('Results copied to clipboard');
    }

    return this.results;
  }

  printChecklist() {
    console.log(`
=== Animation Testing Checklist ===

For each spell, run:
  tester.startTest('Spell Name');
  // Cast the spell
  // Observe the animation
  tester.endTest(true/false, 'optional notes');

Spells to test:
1. Magic Bolt
2. Fireball
3. Ice Shard
4. Lightning
5. Holy Beam
6. Meteor

After all tests:
  tester.exportResults();
    `);
  }
}

// Create global instance
window.tester = new AnimationTester();
window.tester.printChecklist();
```

## Quick Start for Manual Testing

### Chrome Testing

```bash
# 1. Start dev server
npm run dev

# 2. Open Chrome
google-chrome http://localhost:3000

# 3. Open DevTools (F12)
# 4. Go to Console tab
# 5. Copy and paste the manual-test-helper.js code
# 6. Follow the checklist

# 7. To check FPS:
# - Open DevTools → More Tools → Rendering
# - Enable "Frame Rendering Stats"
```

### Firefox Testing

```bash
# 1. Open Firefox
firefox http://localhost:3000

# 2. Open DevTools (F12)
# 3. Go to Performance tab
# 4. Click "Record" before casting spell
# 5. Click "Stop" after animation completes
# 6. Check frame rate in timeline
```

### Safari Testing (macOS)

```bash
# 1. Open Safari
open -a Safari http://localhost:3000

# 2. Enable Web Inspector:
# Safari → Preferences → Advanced → Show Develop menu

# 3. Develop → Show Web Inspector (Option + Cmd + I)
# 4. Go to Timelines tab
# 5. Record during animation
```

## Screenshot Capture Script

```javascript
// screenshot-animations.js
// Automated screenshot capture for visual comparison

const { chromium, firefox, webkit } = require('playwright');

async function captureAnimationScreenshots() {
  for (const browser of [chromium, firefox, webkit]) {
    const browserName = browser.name();
    const instance = await browser.launch();
    const page = await instance.newPage({ viewport: { width: 1440, height: 900 } });

    // Setup game (same as above)
    // ...

    // For each spell
    for (const spell of SPELLS) {
      // Click spell
      await page.click(`text=${spell.name}`);

      // Wait for peak of animation (spell-specific timing)
      await page.waitForTimeout(spell.peakTime);

      // Capture screenshot
      await page.screenshot({
        path: `docs/animations/screenshots/${spell.id}_${browserName}.png`,
        fullPage: false
      });

      // Wait for animation to complete
      await page.waitForTimeout(spell.duration - spell.peakTime);
    }

    await instance.close();
  }
}
```

## Performance Metrics Collection

```javascript
// Inject into page for performance monitoring
window.performanceObserver = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.entryType === 'measure' && entry.name.includes('animation')) {
      console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
    }
  }
});
window.performanceObserver.observe({ entryTypes: ['measure'] });
```

## Results Analysis

After collecting data, use this script to analyze:

```javascript
// analyze-results.js
const fs = require('fs');

function analyzeResults(resultsFile) {
  const data = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));

  console.log('=== Browser Compatibility Analysis ===\n');

  // Check for timing consistency
  const spells = Object.keys(data.Chrome || {});

  for (const spell of spells) {
    const chromeDuration = data.Chrome?.[spell]?.duration;
    const firefoxDuration = data.Firefox?.[spell]?.duration;
    const safariDuration = data.Safari?.[spell]?.duration;

    const maxVariance = Math.max(
      Math.abs(chromeDuration - firefoxDuration),
      Math.abs(chromeDuration - safariDuration),
      Math.abs(firefoxDuration - safariDuration)
    );

    console.log(`${spell}:`);
    console.log(`  Chrome: ${chromeDuration}ms`);
    console.log(`  Firefox: ${firefoxDuration}ms`);
    console.log(`  Safari: ${safariDuration}ms`);
    console.log(`  Max variance: ${maxVariance}ms ${maxVariance > 100 ? '⚠️' : '✅'}`);
    console.log();
  }
}
```

## Running the Tests

### Automated Full Suite

```bash
# Install Playwright browsers
npx playwright install

# Run automated tests
node docs/animations/test-animations-cross-browser.js
```

### Manual Testing Workflow

1. **Start Server**: `npm run dev`
2. **Open Browser**: Chrome, Firefox, or Safari
3. **Load Test Helper**: Copy `manual-test-helper.js` to console
4. **Run Through Checklist**: Test each spell systematically
5. **Export Results**: `tester.exportResults()`
6. **Repeat for Each Browser**
7. **Compare Results**: Use analysis script

## Expected Output

```
=== Chrome Results ===
┌─────────────┬──────────┬──────────────────┬──────────┬────────┐
│   spell     │ duration │ expectedDuration │  avgFPS  │ passed │
├─────────────┼──────────┼──────────────────┼──────────┼────────┤
│ Magic Bolt  │  720ms   │      700ms       │  60.00   │   ✅   │
│ Fireball    │  940ms   │      950ms       │  59.80   │   ✅   │
│ Ice Shard   │  910ms   │      900ms       │  60.10   │   ✅   │
│ Lightning   │  895ms   │      900ms       │  60.00   │   ✅   │
│ Holy Beam   │ 1010ms   │     1000ms       │  59.90   │   ✅   │
│ Meteor      │ 1520ms   │     1500ms       │  60.00   │   ✅   │
└─────────────┴──────────┴──────────────────┴──────────┴────────┘
```

## Troubleshooting

### Playwright Installation Issues

```bash
# If Playwright browsers won't install
npx playwright install-deps
npx playwright install chromium firefox webkit
```

### Permission Errors

```bash
# Ensure test files are executable
chmod +x docs/animations/test-animations-cross-browser.js
```

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Then restart dev server
npm run dev
```

## Next Steps

After running tests:

1. Fill in the test report: `docs/animations/task-7.9-cross-browser-test-report.md`
2. Document any browser-specific issues
3. Create visual comparison screenshots
4. Update compatibility matrix
5. Implement any necessary browser-specific workarounds

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
- [Firefox Performance Tools](https://firefox-source-docs.mozilla.org/devtools-user/performance/)
- [Safari Web Inspector](https://webkit.org/web-inspector/)
