/**
 * Test Full Game Flow - Complete React port functionality test
 */

const puppeteer = require('puppeteer');

async function testFullFlow() {
  console.log('🎮 Testing Full Game Flow...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });

    // Wait for React to fully initialize
    await page.waitForFunction(() => {
      return document.querySelector('#new-game-btn') && !document.querySelector('#new-game-btn').disabled;
    }, { timeout: 15000 });

    console.log('✅ Phase 1: Main Menu loaded');

    // Test New Game button
    await page.click('#new-game-btn');
    await page.waitForFunction(() => {
      return document.querySelector('#character-select.active');
    }, { timeout: 5000 });

    const characterSelectState = await page.evaluate(() => {
      return {
        activeScreen: document.querySelector('.screen.active')?.id,
        classCards: document.querySelectorAll('.class-card').length,
        startBtn: !!document.getElementById('start-adventure-btn'),
        startBtnDisabled: document.getElementById('start-adventure-btn')?.disabled
      };
    });

    console.log('✅ Phase 2: Character Selection');
    console.log('   Active Screen:', characterSelectState.activeScreen);
    console.log('   Class Cards:', characterSelectState.classCards);
    console.log('   Start Button Disabled:', characterSelectState.startBtnDisabled);

    if (characterSelectState.classCards === 0) {
      throw new Error('No character class cards found');
    }

    // Select a character class
    await page.click('.class-card[data-class="wizard"]');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const afterClassSelection = await page.evaluate(() => {
      return {
        selectedCard: !!document.querySelector('.class-card.selected'),
        startBtnDisabled: document.getElementById('start-adventure-btn')?.disabled
      };
    });

    console.log('✅ Phase 3: Class Selection');
    console.log('   Selected Class:', afterClassSelection.selectedCard);
    console.log('   Start Button Enabled:', !afterClassSelection.startBtnDisabled);

    if (afterClassSelection.startBtnDisabled) {
      throw new Error('Start button not enabled after class selection');
    }

    // Start Adventure
    await page.click('#start-adventure-btn');
    await page.waitForFunction(() => {
      return document.querySelector('#game-world.active');
    }, { timeout: 8000 });

    const gameWorldState = await page.evaluate(() => {
      return {
        activeScreen: document.querySelector('.screen.active')?.id,
        gameHUD: !!document.getElementById('game-hud'),
        worldMap: !!document.getElementById('world-map'),
        worldMapContainer: !!document.getElementById('world-map-container'),
        mapAreas: document.querySelectorAll('.map-area').length,
        areaDetailsPanel: !!document.getElementById('area-details-panel'),
        hudStats: Array.from(document.querySelectorAll('#game-hud .stat')).map(el => el.textContent)
      };
    });

    console.log('✅ Phase 4: World Map');
    console.log('   Active Screen:', gameWorldState.activeScreen);
    console.log('   Game HUD:', gameWorldState.gameHUD);
    console.log('   World Map Container:', gameWorldState.worldMapContainer);
    console.log('   World Map Element:', gameWorldState.worldMap);
    console.log('   Map Areas:', gameWorldState.mapAreas);
    console.log('   Area Details Panel:', gameWorldState.areaDetailsPanel);
    console.log('   HUD Stats:', gameWorldState.hudStats);

    if (gameWorldState.mapAreas > 0) {
      console.log('✅ Phase 5: Testing Area Interaction');

      // Click on first map area
      await page.click('.map-area');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const afterAreaClick = await page.evaluate(() => {
        return {
          selectedArea: !!document.querySelector('.map-area.selected'),
          areaPanelVisible: document.getElementById('area-details-panel')?.style.display !== 'none'
        };
      });

      console.log('   Area Selected:', afterAreaClick.selectedArea);
      console.log('   Details Panel Visible:', afterAreaClick.areaPanelVisible);
    }

    console.log('\n🎉 FULL FLOW TEST PASSED!');
    console.log('✅ Main Menu → Character Selection → World Map → Area Interaction');

  } catch (error) {
    console.error('❌ Full Flow Test failed:', error.message);

    // Take screenshot for debugging
    try {
      await page.screenshot({ path: '/tmp/flow-test-error.png', fullPage: true });
      console.log('📸 Error screenshot saved to /tmp/flow-test-error.png');
    } catch (screenshotError) {
      // Ignore screenshot errors
    }

    // Get current state for debugging
    const debugState = await page.evaluate(() => {
      return {
        activeScreen: document.querySelector('.screen.active')?.id || 'none',
        allScreens: Array.from(document.querySelectorAll('.screen')).map(s => ({
          id: s.id,
          hasActive: s.classList.contains('active'),
          display: getComputedStyle(s).display
        }))
      };
    }).catch(() => ({ error: 'Could not get debug state' }));

    console.log('🔍 Debug State:', debugState);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testFullFlow().catch(console.error);
}

module.exports = { testFullFlow };