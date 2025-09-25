import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testSizing() {
  console.log('🚀 Starting browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    // Test the debug sizing page first
    const debugFile = `file://${path.resolve(__dirname, 'debug-sizing.html')}`;
    console.log('📄 Loading debug file:', debugFile);

    await page.goto(debugFile);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const debugInfo = await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const root = document.getElementById('root');
          const testDiv = document.querySelector('.test-div');

          resolve({
            viewport: {
              innerWidth: window.innerWidth,
              innerHeight: window.innerHeight
            },
            body: {
              offsetWidth: document.body.offsetWidth,
              offsetHeight: document.body.offsetHeight,
              boundingRect: document.body.getBoundingClientRect()
            },
            root: {
              offsetWidth: root.offsetWidth,
              offsetHeight: root.offsetHeight,
              boundingRect: root.getBoundingClientRect()
            },
            testDiv: {
              offsetWidth: testDiv.offsetWidth,
              offsetHeight: testDiv.offsetHeight,
              boundingRect: testDiv.getBoundingClientRect()
            }
          });
        }, 500);
      });
    });

    console.log('🔍 Debug page sizing info:', JSON.stringify(debugInfo, null, 2));

    // Now test the React app
    console.log('📄 Loading React app at http://localhost:3002/index-react.html...');
    await page.goto('http://localhost:3002/index-react.html');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for React to load

    // Log any console messages
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      console.log(`[Browser ${type.toUpperCase()}]`, text);
    });

    const reactInfo = await page.evaluate(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const root = document.getElementById('root');
          const reactApp = document.querySelector('.react-app');
          const gameShell = document.querySelector('[class*="game-shell"]');
          const mainMenu = document.querySelector('[class*="main-menu"]');

          // Get all elements to understand DOM structure
          const allElements = Array.from(document.querySelectorAll('*')).map(el => ({
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            offsetWidth: el.offsetWidth,
            offsetHeight: el.offsetHeight,
            boundingRect: el.getBoundingClientRect()
          })).filter(el => el.offsetWidth > 0 || el.offsetHeight > 0); // Only visible elements

          resolve({
            viewport: {
              innerWidth: window.innerWidth,
              innerHeight: window.innerHeight
            },
            body: {
              offsetWidth: document.body.offsetWidth,
              offsetHeight: document.body.offsetHeight,
              boundingRect: document.body.getBoundingClientRect(),
              children: Array.from(document.body.children).map(child => ({
                tagName: child.tagName,
                id: child.id,
                className: child.className,
                offsetWidth: child.offsetWidth,
                offsetHeight: child.offsetHeight
              }))
            },
            root: {
              exists: !!root,
              offsetWidth: root?.offsetWidth,
              offsetHeight: root?.offsetHeight,
              boundingRect: root?.getBoundingClientRect(),
              innerHTML: root ? root.innerHTML.substring(0, 500) : null,
              children: root ? Array.from(root.children).map(child => ({
                tagName: child.tagName,
                className: child.className,
                boundingRect: child.getBoundingClientRect()
              })) : []
            },
            reactApp: {
              exists: !!reactApp,
              offsetWidth: reactApp?.offsetWidth,
              offsetHeight: reactApp?.offsetHeight,
              boundingRect: reactApp?.getBoundingClientRect()
            },
            gameShell: {
              exists: !!gameShell,
              offsetWidth: gameShell?.offsetWidth,
              offsetHeight: gameShell?.offsetHeight,
              boundingRect: gameShell?.getBoundingClientRect()
            },
            mainMenu: {
              exists: !!mainMenu,
              offsetWidth: mainMenu?.offsetWidth,
              offsetHeight: mainMenu?.offsetHeight,
              boundingRect: mainMenu?.getBoundingClientRect()
            },
            allVisibleElements: allElements.slice(0, 10) // First 10 visible elements
          });
        }, 1000);
      });
    });

    console.log('🔍 React app sizing info:', JSON.stringify(reactInfo, null, 2));

    // Close browser
    await browser.close();

  } catch (error) {
    console.error('❌ Error:', error);
    await browser.close();
  }
}

testSizing().catch(console.error);