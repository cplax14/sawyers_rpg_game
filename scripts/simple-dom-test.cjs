/**
 * Simple DOM Test - Check if React elements are properly rendered
 */

const puppeteer = require('puppeteer');

async function simpleDOMTest() {
  console.log('🧪 Testing DOM Structure...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  try {
    // Navigate to the React app
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });

    // Wait for React to fully initialize
    await page.waitForFunction(() => {
      return document.querySelector('#react-root') &&
             (document.querySelector('#new-game-btn') ||
              document.querySelector('button'));
    }, { timeout: 10000 });

    console.log('✅ Page loaded and React initialized');

    // Check DOM structure
    const elements = await page.evaluate(() => {
      return {
        reactRoot: !!document.getElementById('react-root'),
        newGameBtn: !!document.getElementById('new-game-btn'),
        loadGameBtn: !!document.getElementById('load-game-btn'),
        settingsBtn: !!document.getElementById('settings-btn'),
        allButtons: document.querySelectorAll('button').length,
        classCards: document.querySelectorAll('.class-card').length,
        worldMapContainer: !!document.getElementById('world-map-container'),
        worldMap: !!document.getElementById('world-map'),
        gameHUD: !!document.getElementById('game-hud'),
        screenDivs: Array.from(document.querySelectorAll('.screen')).map(el => el.id),
        currentScreenClass: document.querySelector('.screen.active')?.id || 'none'
      };
    });

    console.log('\n📋 DOM Structure Analysis:');
    console.log('   React Root:', elements.reactRoot);
    console.log('   New Game Button:', elements.newGameBtn);
    console.log('   Load Game Button:', elements.loadGameBtn);
    console.log('   Settings Button:', elements.settingsBtn);
    console.log('   Total Buttons:', elements.allButtons);
    console.log('   Character Class Cards:', elements.classCards);
    console.log('   World Map Container:', elements.worldMapContainer);
    console.log('   World Map Element:', elements.worldMap);
    console.log('   Game HUD:', elements.gameHUD);
    console.log('   Screen Divs:', elements.screenDivs);
    console.log('   Active Screen:', elements.currentScreenClass);

    if (elements.newGameBtn) {
      console.log('\n🎮 Simulating New Game Click...');
      await page.click('#new-game-btn');
      await page.waitForFunction(() => {
        const screen = document.querySelector('.screen.active');
        return screen && screen.id === 'character-select';
      }, { timeout: 5000 });

      const afterNewGame = await page.evaluate(() => {
        return {
          activeScreen: document.querySelector('.screen.active')?.id,
          classCards: document.querySelectorAll('.class-card').length,
          startBtn: !!document.getElementById('start-adventure-btn'),
          startBtnEnabled: !document.getElementById('start-adventure-btn')?.disabled
        };
      });

      console.log('   Active Screen after click:', afterNewGame.activeScreen);
      console.log('   Class Cards visible:', afterNewGame.classCards);
      console.log('   Start Adventure button:', afterNewGame.startBtn);
      console.log('   Start button enabled:', afterNewGame.startBtnEnabled);

      if (afterNewGame.classCards > 0) {
        console.log('\n🎯 Selecting Wizard class...');
        await page.click('.class-card[data-class="wizard"]');
        await page.waitForTimeout(1000);

        const afterClassSelection = await page.evaluate(() => {
          return {
            selectedCard: !!document.querySelector('.class-card.selected'),
            startBtnEnabled: !document.getElementById('start-adventure-btn')?.disabled
          };
        });

        console.log('   Selected class card:', afterClassSelection.selectedCard);
        console.log('   Start button enabled after selection:', afterClassSelection.startBtnEnabled);

        if (afterClassSelection.startBtnEnabled) {
          console.log('\n🚀 Starting adventure...');
          await page.click('#start-adventure-btn');
          await page.waitForFunction(() => {
            const screen = document.querySelector('.screen.active');
            return screen && screen.id === 'game-world';
          }, { timeout: 5000 });

          const worldMapState = await page.evaluate(() => {
            return {
              activeScreen: document.querySelector('.screen.active')?.id,
              worldMapExists: !!document.getElementById('world-map'),
              mapAreas: document.querySelectorAll('.map-area').length,
              areaDetailsPanel: !!document.getElementById('area-details-panel'),
              gameHUDVisible: !!document.getElementById('game-hud')
            };
          });

          console.log('\n🗺️ World Map State:');
          console.log('   Active Screen:', worldMapState.activeScreen);
          console.log('   World Map exists:', worldMapState.worldMapExists);
          console.log('   Map Areas:', worldMapState.mapAreas);
          console.log('   Area Details Panel:', worldMapState.areaDetailsPanel);
          console.log('   Game HUD visible:', worldMapState.gameHUDVisible);
        }
      }
    }

    console.log('\n✅ DOM Test Complete!');

  } catch (error) {
    console.error('❌ DOM Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Helper to wait for timeout (modern puppeteer compatibility)
async function waitForTimeout(page, ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

if (require.main === module) {
  simpleDOMTest().catch(console.error);
}

module.exports = { simpleDOMTest };