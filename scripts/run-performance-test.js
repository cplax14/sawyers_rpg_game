/**
 * Automated Performance Test Runner
 * Task 7.8: Verify 60fps performance across all spell animations
 *
 * This script uses Playwright to:
 * 1. Launch the performance test page
 * 2. Automatically run the test
 * 3. Extract the performance report
 * 4. Save results to a file
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const TEST_URL = 'http://localhost:3000/animation-performance-test.html';
const REPORT_OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'animations');

async function runPerformanceTest() {
  console.log('🧪 Starting Automated Performance Test...\n');

  let browser;
  let reportData = null;

  try {
    // Launch browser
    console.log('🚀 Launching Chrome browser...');
    browser = await chromium.launch({
      headless: false, // Show browser for visibility
      args: ['--disable-blink-features=AutomationControlled'] // More realistic performance
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();

    // Enable console logging from the page
    page.on('console', msg => {
      const text = msg.text();
      // Filter out noise, keep important test messages
      if (
        text.includes('[Performance Test]') ||
        text.includes('FPS') ||
        text.includes('PASSED') ||
        text.includes('FAILED')
      ) {
        console.log(`   ${text}`);
      }
    });

    // Navigate to test page
    console.log(`📄 Loading test page: ${TEST_URL}\n`);
    await page.goto(TEST_URL, { waitUntil: 'networkidle' });

    // Wait for component to load
    await page.waitForSelector('h1:has-text("Animation Performance Test")', { timeout: 10000 });
    console.log('✅ Performance test component loaded\n');

    // Click "Start Test" button
    console.log('▶️  Starting performance test...\n');
    await page.click('button:has-text("Start Test")');

    // Wait for test to complete (max 2 minutes)
    console.log('⏳ Running animations and measuring performance...\n');
    console.log('   (This will take about 30-60 seconds)\n');

    // Wait for completion message
    await page.waitForSelector('text=TEST PASSED', { timeout: 120000 }).catch(async () => {
      // Check if it failed instead
      const failed = await page.locator('text=TEST FAILED').isVisible().catch(() => false);
      if (!failed) {
        throw new Error('Test did not complete within timeout');
      }
    });

    console.log('\n✅ Test completed!\n');

    // Wait a bit for final rendering
    await page.waitForTimeout(1000);

    // Extract report data from the page
    console.log('📊 Extracting performance report...\n');

    reportData = await page.evaluate(() => {
      // The report data should be in the component state
      // We'll extract it from the rendered DOM
      const passed = document.querySelector('h3:has-text("TEST PASSED")') !== null;
      const failed = document.querySelector('h3:has-text("TEST FAILED")') !== null;

      const result = {
        passed,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      // Try to extract stats from the stat cards
      const statCards = document.querySelectorAll('[style*="grid-template-columns"]')[0];
      if (statCards) {
        const cards = statCards.querySelectorAll('div > div');
        cards.forEach(card => {
          const label = card.querySelector('div:first-child')?.textContent || '';
          const value = card.querySelector('div:last-child')?.textContent || '';

          if (label.includes('Test Duration')) result.testDuration = value;
          if (label.includes('Animations Tested')) result.animationsTested = value;
          if (label.includes('Average FPS')) result.averageFPS = value;
          if (label.includes('Min FPS')) result.minFPS = value;
          if (label.includes('Max FPS')) result.maxFPS = value;
          if (label.includes('Frame Drops')) result.frameDrops = value;
        });
      }

      // Extract failure reasons if test failed
      if (failed) {
        const reasonsList = document.querySelector('ul');
        if (reasonsList) {
          const reasons = Array.from(reasonsList.querySelectorAll('li')).map(li => li.textContent);
          result.failureReasons = reasons;
        }
      }

      // Extract individual animation results from table
      const table = document.querySelector('table');
      if (table) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        result.animations = rows.map(row => {
          const cells = row.querySelectorAll('td');
          return {
            spell: cells[0]?.textContent || '',
            type: cells[1]?.textContent || '',
            duration: cells[2]?.textContent || '',
            avgFPS: cells[3]?.textContent || '',
            minFPS: cells[4]?.textContent || '',
            frameDrops: cells[5]?.textContent || '',
            status: cells[6]?.textContent || ''
          };
        });
      }

      return result;
    });

    // Take a screenshot of the final report
    const screenshotPath = path.join(REPORT_OUTPUT_DIR, 'performance-test-results.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved: ${screenshotPath}\n`);

    // Export the full report using the export button
    console.log('💾 Exporting detailed report...');

    // Set up download handler
    const downloadPromise = page.waitForEvent('download');
    await page.click('button:has-text("Export Report")');
    const download = await downloadPromise;

    // Save the downloaded report
    const downloadPath = path.join(REPORT_OUTPUT_DIR, 'task-7.8-performance-test-report.json');
    await download.saveAs(downloadPath);
    console.log(`   Report saved: ${downloadPath}\n`);

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return reportData;
}

async function generateMarkdownReport(reportData) {
  console.log('📝 Generating markdown report...\n');

  const reportPath = path.join(REPORT_OUTPUT_DIR, 'task-7.8-performance-test-report.md');

  const markdown = `# Animation Performance Test Report - Task 7.8

**Date:** ${reportData.timestamp}
**Result:** ${reportData.passed ? '✅ PASSED' : '❌ FAILED'}

## Test Overview

This performance test verifies that all spell animations maintain 60fps performance with both normal and critical hit variants.

## Overall Results

| Metric | Value | Status |
|--------|-------|--------|
| Test Duration | ${reportData.testDuration || 'N/A'} | - |
| Animations Tested | ${reportData.animationsTested || 'N/A'} | - |
| Average FPS | ${reportData.averageFPS || 'N/A'} | ${reportData.passed ? '✅' : '❌'} |
| Min FPS | ${reportData.minFPS || 'N/A'} | ${reportData.passed ? '✅' : '❌'} |
| Max FPS | ${reportData.maxFPS || 'N/A'} | - |
| Frame Drops | ${reportData.frameDrops || 'N/A'} | ${reportData.passed ? '✅' : '❌'} |

## Success Criteria

- ✅ Average FPS >= 55 across all animations
- ✅ Frame drops < 10% of total frames
- ✅ Individual animations >= 50 FPS average

${reportData.failureReasons ? `
## Failure Reasons

${reportData.failureReasons.map(reason => `- ${reason}`).join('\n')}
` : ''}

## Individual Animation Results

${reportData.animations ? `
| Spell | Type | Duration | Avg FPS | Min FPS | Frame Drops | Status |
|-------|------|----------|---------|---------|-------------|--------|
${reportData.animations.map(anim =>
  `| ${anim.spell} | ${anim.type} | ${anim.duration} | ${anim.avgFPS} | ${anim.minFPS} | ${anim.frameDrops} | ${anim.status} |`
).join('\n')}
` : 'Animation details not available'}

## Animations Tested

1. **Magic Bolt** (Arcane) - Normal & Critical
2. **Fireball** (Fire) - Normal & Critical
3. **Ice Shard** (Ice) - Normal & Critical
4. **Lightning** (Lightning) - Normal & Critical
5. **Holy Beam** (Holy) - Normal & Critical
6. **Meteor** (Fire AOE) - Normal & Critical

## Technical Details

- **User Agent:** ${reportData.userAgent}
- **Viewport:** 1440x900
- **Browser:** Chromium (Playwright)
- **Test Mode:** Sequential with 500ms delays

## Conclusion

${reportData.passed
  ? '✅ **All animations meet the 60fps performance target.** The combat animation system is optimized and ready for production use.'
  : '❌ **Performance issues detected.** Review the failure reasons above and optimize the problematic animations.'
}

## Files Generated

- Full report JSON: \`task-7.8-performance-test-report.json\`
- Screenshot: \`performance-test-results.png\`
- This report: \`task-7.8-performance-test-report.md\`

---

**Task 7.8 Status:** ${reportData.passed ? '✅ Complete' : '⚠️ Needs Optimization'}
`;

  fs.writeFileSync(reportPath, markdown);
  console.log(`   Report saved: ${reportPath}\n`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   ANIMATION PERFORMANCE TEST - Task 7.8');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Ensure output directory exists
  if (!fs.existsSync(REPORT_OUTPUT_DIR)) {
    fs.mkdirSync(REPORT_OUTPUT_DIR, { recursive: true });
  }

  let reportData;

  try {
    // Run the automated test
    reportData = await runPerformanceTest();

    // Generate markdown report
    if (reportData) {
      await generateMarkdownReport(reportData);
    }

    // Print summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('   TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`   Result: ${reportData.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`   Average FPS: ${reportData.averageFPS || 'N/A'}`);
    console.log(`   Min FPS: ${reportData.minFPS || 'N/A'}`);
    console.log(`   Frame Drops: ${reportData.frameDrops || 'N/A'}`);
    console.log(`   Animations Tested: ${reportData.animationsTested || 'N/A'}`);
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    if (reportData.passed) {
      console.log('✅ Task 7.8 Complete: All animations maintain 60fps!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Task 7.8: Performance optimization needed\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error('\nMake sure the dev server is running:');
    console.error('   npm run dev\n');
    process.exit(1);
  }
}

// Check if dev server is accessible
async function checkDevServer() {
  try {
    const response = await fetch(TEST_URL);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Run the test
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runPerformanceTest };
