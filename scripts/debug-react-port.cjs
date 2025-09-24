/**
 * Debug React Port - Interactive debugging script
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function debugReactPort() {
  console.log('🔍 Starting React Port Debug Session...');

  const browser = await puppeteer.launch({
    headless: false, // Show browser for visual debugging
    devtools: true,  // Open DevTools
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Start Vite dev server
  const { spawn } = require('child_process');
  const viteProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'pipe',
    shell: true,
    cwd: process.cwd()
  });

  // Wait for dev server to start
  await new Promise((resolve) => {
    viteProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Local:') && output.includes('3001')) {
        console.log('✅ Vite dev server started');
        setTimeout(resolve, 2000); // Extra time for React to initialize
      }
    });
  });

  try {
    console.log('🌐 Opening React port at localhost:3001');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });

    // Set up console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🎮') || text.includes('🚨') || text.includes('✅') || text.includes('❌')) {
        console.log(`PAGE: ${text}`);
      }
    });

    console.log('⏱️  Waiting for React to initialize...');
    await page.waitForTimeout(5000);

    // Debug: Check if React elements exist
    const reactRootExists = await page.$('#react-root');
    console.log(`🔍 React root exists: ${!!reactRootExists}`);

    const mainMenuBtn = await page.$('#new-game-btn');
    console.log(`🔍 New Game button exists: ${!!mainMenuBtn}`);

    if (mainMenuBtn) {
      console.log('🎮 Clicking New Game button...');
      await page.click('#new-game-btn');
      await page.waitForTimeout(2000);

      // Check for character selection
      const classCards = await page.$$('.class-card');
      console.log(`🔍 Found ${classCards.length} character class cards`);

      if (classCards.length > 0) {
        console.log('🎯 Clicking first character class (Wizard)...');
        await page.click('.class-card[data-class="wizard"]');
        await page.waitForTimeout(1000);

        const startBtn = await page.$('#start-adventure-btn');
        const isStartEnabled = await page.evaluate(() => {
          const btn = document.getElementById('start-adventure-btn');
          return btn && !btn.disabled;
        });

        console.log(`🔍 Start Adventure button enabled: ${isStartEnabled}`);

        if (isStartEnabled) {
          console.log('🚀 Clicking Start Adventure...');
          await page.click('#start-adventure-btn');
          await page.waitForTimeout(3000);

          // Check world map
          const worldMap = await page.$('#world-map');
          console.log(`🔍 World map exists: ${!!worldMap}`);

          if (worldMap) {
            const mapAreas = await page.$$('.map-area');
            console.log(`🔍 Found ${mapAreas.length} map areas`);

            // Take screenshot of world map
            await page.screenshot({
              path: '/tmp/react-world-map.png',
              fullPage: true
            });
            console.log('📸 Screenshot saved to /tmp/react-world-map.png');

            if (mapAreas.length > 0) {
              console.log('🗺️ Clicking first map area...');
              await page.click('.map-area');
              await page.waitForTimeout(1000);

              // Check for area details
              const areaDetails = await page.$('#area-details-panel');
              const isAreaDetailsVisible = await page.evaluate(() => {
                const panel = document.getElementById('area-details-panel');
                return panel && panel.style.display !== 'none';
              });
              console.log(`🔍 Area details panel visible: ${isAreaDetailsVisible}`);
            }
          }
        }
      }
    }

    console.log('🔍 Final state analysis...');
    const finalScreenshot = await page.screenshot({
      path: '/tmp/react-final-state.png',
      fullPage: true
    });
    console.log('📸 Final screenshot saved to /tmp/react-final-state.png');

    // Keep browser open for manual inspection
    console.log('🔍 Browser kept open for manual inspection. Press Ctrl+C when done.');
    await new Promise(() => {}); // Keep running until interrupted

  } catch (error) {
    console.error('❌ Debug session error:', error);
  } finally {
    viteProcess.kill();
    await browser.close();
  }
}

if (require.main === module) {
  debugReactPort().catch(console.error);
}

module.exports = { debugReactPort };