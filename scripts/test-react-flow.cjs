/**
 * Test React Flow - Automated testing of the React port flow
 */

const puppeteer = require('puppeteer');

async function testReactFlow() {
  console.log('🧪 Testing React Port Game Flow...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('🎮') || text.includes('🚨') || text.includes('✅') || text.includes('❌') || text.includes('🗺️')) {
      console.log(`REACT: ${text}`);
    }
  });

  try {
    console.log('🌐 Starting Vite dev server and loading React port...');

    // Start the dev server
    const { spawn } = require('child_process');
    const serverProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });

    // Wait for server
    await new Promise((resolve) => {
      serverProcess.stdout.on('data', (data) => {
        if (data.toString().includes('Local:')) {
          setTimeout(resolve, 3000); // Give React time to initialize
        }
      });
    });

    await page.goto('http://localhost:3001', {
      waitUntil: 'networkidle0',
      timeout: 10000
    });

    console.log('⏱️  Waiting for React initialization...');
    await page.waitForTimeout(5000);

    // Test 1: Check initial state
    console.log('\n📋 Test 1: Initial State Check');
    const reactRoot = await page.$('#react-root');
    const newGameBtn = await page.$('#new-game-btn');
    const loadGameBtn = await page.$('#load-game-btn');
    const settingsBtn = await page.$('#settings-btn');

    console.log(`   React root: ${!!reactRoot}`);
    console.log(`   New Game button: ${!!newGameBtn}`);
    console.log(`   Load Game button: ${!!loadGameBtn}`);
    console.log(`   Settings button: ${!!settingsBtn}`);

    if (!newGameBtn) {
      console.log('❌ CRITICAL: New Game button not found');
      const allButtons = await page.$$eval('button', buttons =>
        buttons.map(btn => ({ id: btn.id, text: btn.textContent, class: btn.className }))
      );
      console.log('🔍 All buttons found:', allButtons);
      return;
    }

    // Test 2: New Game Flow
    console.log('\n📋 Test 2: New Game Flow');
    await page.click('#new-game-btn');
    await page.waitForTimeout(2000);

    const classCards = await page.$$('.class-card');
    const startBtn = await page.$('#start-adventure-btn');

    console.log(`   Character classes found: ${classCards.length}`);
    console.log(`   Start Adventure button: ${!!startBtn}`);

    if (classCards.length === 0) {
      console.log('❌ CRITICAL: No character class cards found');
      const characterSelectDiv = await page.$('#character-select');
      console.log(`   Character select screen: ${!!characterSelectDiv}`);
      return;
    }

    // Test 3: Character Selection
    console.log('\n📋 Test 3: Character Selection');
    await page.click('.class-card[data-class="wizard"]');
    await page.waitForTimeout(1000);

    const isStartEnabled = await page.evaluate(() => {
      const btn = document.getElementById('start-adventure-btn');
      return btn && !btn.disabled;
    });

    console.log(`   Start button enabled after selection: ${isStartEnabled}`);

    if (!isStartEnabled) {
      console.log('❌ Start button not enabled after character selection');
      return;
    }

    // Test 4: World Map
    console.log('\n📋 Test 4: World Map');
    await page.click('#start-adventure-btn');
    await page.waitForTimeout(3000);

    const worldMapContainer = await page.$('#world-map-container');
    const worldMap = await page.$('#world-map');
    const mapAreas = await page.$$('.map-area');
    const gameHud = await page.$('#game-hud');

    console.log(`   World map container: ${!!worldMapContainer}`);
    console.log(`   World map element: ${!!worldMap}`);
    console.log(`   Map areas: ${mapAreas.length}`);
    console.log(`   Game HUD: ${!!gameHud}`);

    // Test 5: Area Interaction
    if (mapAreas.length > 0) {
      console.log('\n📋 Test 5: Area Interaction');
      await page.click('.map-area');
      await page.waitForTimeout(1000);

      const areaDetailsPanel = await page.$('#area-details-panel');
      const isAreaPanelVisible = await page.evaluate(() => {
        const panel = document.getElementById('area-details-panel');
        return panel && panel.style.display !== 'none';
      });

      console.log(`   Area details panel exists: ${!!areaDetailsPanel}`);
      console.log(`   Area details panel visible: ${isAreaPanelVisible}`);
    }

    console.log('\n✅ React Port Flow Test Complete');

    serverProcess.kill();

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testReactFlow().catch(console.error);
}

module.exports = { testReactFlow };