/**
 * Debug Character Selection - Check if character selection is working
 */

const puppeteer = require('puppeteer');

async function debugCharacterSelection() {
  console.log('🎭 Debugging Character Selection...');

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
    console.log(`JS: ${text}`);
  });

  try {
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });

    // Wait for React to fully initialize
    await page.waitForFunction(() => {
      return document.querySelector('#new-game-btn') && !document.querySelector('#new-game-btn').disabled;
    }, { timeout: 15000 });

    console.log('✅ Main Menu loaded');

    // Click New Game
    await page.click('#new-game-btn');
    await page.waitForFunction(() => {
      return document.querySelector('#character-select.active');
    }, { timeout: 5000 });

    console.log('✅ Character Selection screen loaded');

    // Wait a moment for React component to fully render
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check character selection state
    const selectionState = await page.evaluate(() => {
      const classCards = document.querySelectorAll('.class-card');
      const menuUI = window.game?.ui?.modules?.MenuUI;

      return {
        classCardsCount: classCards.length,
        classCardsInfo: Array.from(classCards).map((card, i) => ({
          index: i,
          class: card.dataset.class,
          hasClickListener: !!card.onclick,
          classList: Array.from(card.classList)
        })),
        hasMenuUI: !!menuUI,
        menuUIScenes: menuUI ? menuUI.scenes : null,
        attachCharacterSelectionExists: menuUI && typeof menuUI.attachCharacterSelection === 'function'
      };
    });

    console.log('\n📋 Character Selection State:');
    console.log('   Class Cards Count:', selectionState.classCardsCount);
    console.log('   Has MenuUI:', selectionState.hasMenuUI);
    console.log('   MenuUI Scenes:', selectionState.menuUIScenes);
    console.log('   attachCharacterSelection exists:', selectionState.attachCharacterSelectionExists);
    console.log('   Class Cards Info:', selectionState.classCardsInfo);

    if (selectionState.classCardsCount > 0) {
      console.log('\n🖱️ Testing character card clicks...');

      // Try clicking on the first class card (wizard)
      await page.click('.class-card[data-class="wizard"]');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const afterClick = await page.evaluate(() => {
        const selectedCard = document.querySelector('.class-card.selected');
        const startBtn = document.getElementById('start-adventure-btn');

        return {
          hasSelectedCard: !!selectedCard,
          selectedClass: selectedCard?.dataset?.class,
          startBtnDisabled: startBtn?.disabled,
          selectedCardClassList: selectedCard ? Array.from(selectedCard.classList) : null
        };
      });

      console.log('\n📋 After Clicking Wizard Card:');
      console.log('   Has Selected Card:', afterClick.hasSelectedCard);
      console.log('   Selected Class:', afterClick.selectedClass);
      console.log('   Start Button Disabled:', afterClick.startBtnDisabled);
      console.log('   Selected Card Classes:', afterClick.selectedCardClassList);
    }

    console.log('\n✅ Debug Complete!');

  } catch (error) {
    console.error('❌ Debug failed:', error);

    // Take screenshot for debugging
    try {
      await page.screenshot({ path: '/tmp/character-selection-debug.png', fullPage: true });
      console.log('📸 Debug screenshot saved to /tmp/character-selection-debug.png');
    } catch (screenshotError) {
      // Ignore screenshot errors
    }
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  debugCharacterSelection().catch(console.error);
}

module.exports = { debugCharacterSelection };