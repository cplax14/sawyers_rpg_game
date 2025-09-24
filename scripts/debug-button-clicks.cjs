/**
 * Debug Button Clicks - Check if vanilla JS event handlers are working
 */

const puppeteer = require('puppeteer');

async function debugButtonClicks() {
  console.log('🔍 Debugging Button Click Handlers...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();

  // Capture all console messages
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('🎮') || text.includes('🚨') || text.includes('MenuUI') || text.includes('startNewGame')) {
      console.log(`JS: ${text}`);
    }
  });

  try {
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });

    // Wait for React to fully initialize
    await page.waitForFunction(() => {
      return document.querySelector('#new-game-btn') && !document.querySelector('#new-game-btn').disabled;
    }, { timeout: 15000 });

    console.log('✅ React initialized and New Game button enabled');

    // Check button state
    const eventListenersCheck = await page.evaluate(() => {
      const btn = document.getElementById('new-game-btn');

      return {
        hasButton: !!btn,
        buttonDisabled: btn ? btn.disabled : 'no button',
        buttonOuterHTML: btn ? btn.outerHTML.substring(0, 200) : 'no button'
      };
    });

    console.log('\n📋 Button State Analysis:');
    console.log('   Has New Game Button:', eventListenersCheck.hasButton);
    console.log('   Button Disabled:', eventListenersCheck.buttonDisabled);
    console.log('   Button HTML:', eventListenersCheck.buttonOuterHTML);

    // Check if vanilla MenuUI is loaded
    const vanillaJSStatus = await page.evaluate(() => {
      return {
        hasMenuUI: typeof window.MenuUI !== 'undefined',
        hasUIManager: typeof window.UIManager !== 'undefined',
        hasGameInstance: !!window.game,
        gameInstanceUI: !!(window.game && window.game.ui),
        uiModules: window.game && window.game.ui ? Object.keys(window.game.ui.modules || {}) : []
      };
    });

    console.log('\n📋 Vanilla JS Status:');
    console.log('   MenuUI Class Available:', vanillaJSStatus.hasMenuUI);
    console.log('   UIManager Available:', vanillaJSStatus.hasUIManager);
    console.log('   Game Instance:', vanillaJSStatus.hasGameInstance);
    console.log('   Game UI Manager:', vanillaJSStatus.gameInstanceUI);
    console.log('   UI Modules:', vanillaJSStatus.uiModules);

    // Try clicking the button and see what happens
    console.log('\n🎮 Clicking New Game button...');

    await page.click('#new-game-btn');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    // Check what changed after click
    const afterClick = await page.evaluate(() => {
      return {
        activeScreen: document.querySelector('.screen.active')?.id || 'none',
        allScreens: Array.from(document.querySelectorAll('.screen')).map(el => ({
          id: el.id,
          display: el.style.display,
          classList: Array.from(el.classList)
        }))
      };
    });

    console.log('\n📋 After Click State:');
    console.log('   Active Screen:', afterClick.activeScreen);
    console.log('   All Screens:', afterClick.allScreens);

    // Try directly calling the vanilla JS function if available
    console.log('\n🧪 Testing Direct Method Call...');
    const directCallResult = await page.evaluate(() => {
      if (window.game && window.game.ui && window.game.ui.modules && window.game.ui.modules.MenuUI) {
        try {
          window.game.ui.modules.MenuUI.startNewGame();
          return 'Direct call succeeded';
        } catch (error) {
          return `Direct call failed: ${error.message}`;
        }
      }
      return 'MenuUI module not found';
    });

    console.log('   Direct Call Result:', directCallResult);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Final state check
    const finalState = await page.evaluate(() => {
      return {
        activeScreen: document.querySelector('.screen.active')?.id || 'none'
      };
    });

    console.log('   Final Active Screen:', finalState.activeScreen);

    console.log('\n✅ Debug Complete!');
    console.log('\n📋 Recent Console Logs:');
    logs.slice(-10).forEach(log => console.log(`   ${log}`));

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  debugButtonClicks().catch(console.error);
}

module.exports = { debugButtonClicks };