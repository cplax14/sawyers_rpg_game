#!/usr/bin/env node

/**
 * Headless Test Runner for React Port of Sawyer's RPG Game
 * Modified to work with Vite dev server and React components
 */

import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { promises as fs } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

class ReactTestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.viteProcess = null;
    this.testResults = [];
    this.serverUrl = 'http://localhost:3001';
  }

  async startViteServer() {
    console.log('🚀 Starting Vite dev server...');

    return new Promise((resolve, reject) => {
      this.viteProcess = spawn('npm', ['run', 'dev'], {
        cwd: projectRoot,
        stdio: 'pipe'
      });

      let serverReady = false;

      this.viteProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('[Vite]', output.trim());

        if (output.includes('Local:') && !serverReady) {
          // Extract port from output if different
          const portMatch = output.match(/localhost:(\d+)/);
          if (portMatch) {
            this.serverUrl = `http://localhost:${portMatch[1]}`;
          }

          serverReady = true;
          setTimeout(resolve, 2000); // Give server time to fully start
        }
      });

      this.viteProcess.stderr.on('data', (data) => {
        console.error('[Vite Error]', data.toString());
      });

      this.viteProcess.on('error', reject);

      // Timeout if server doesn't start
      setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Vite server failed to start within timeout'));
        }
      }, 30000);
    });
  }

  async stopViteServer() {
    if (this.viteProcess) {
      console.log('🛑 Stopping Vite server...');
      this.viteProcess.kill('SIGTERM');

      // Wait for process to exit
      await new Promise((resolve) => {
        this.viteProcess.on('exit', resolve);
        // Force kill if not stopped in 5 seconds
        setTimeout(() => {
          this.viteProcess.kill('SIGKILL');
          resolve();
        }, 5000);
      });
    }
  }

  async startBrowser() {
    console.log('🌐 Starting browser...');

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    this.page = await this.browser.newPage();

    // Set up console logging
    this.page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error') {
        console.error('[Browser Error]', msg.text());
      } else if (type === 'warn') {
        console.warn('[Browser Warn]', msg.text());
      } else {
        console.log('[Browser]', msg.text());
      }
    });

    // Set up error handling
    this.page.on('pageerror', (error) => {
      console.error('[Page Error]', error.message);
    });

    // Set viewport
    await this.page.setViewport({ width: 1024, height: 768 });
  }

  async loadGamePage() {
    console.log(`📄 Loading React game at ${this.serverUrl}...`);

    try {
      await this.page.goto(this.serverUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Wait for React to load and render
      await this.page.waitForSelector('#react-root', { timeout: 10000 });
      console.log('✅ React app loaded');

      // Wait for game to initialize
      await this.waitForGameReady();

    } catch (error) {
      console.error('❌ Failed to load game page:', error);
      throw error;
    }
  }

  async waitForGameReady() {
    console.log('⏳ Waiting for game initialization...');

    try {
      // Wait for vanilla game to be ready
      await this.page.waitForFunction(
        () => {
          return window.SawyersRPG &&
                 window.gameState &&
                 document.querySelector('.game-canvas-container canvas');
        },
        { timeout: 30000 }
      );

      // Wait a bit more for full initialization
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('✅ Game fully initialized');
    } catch (error) {
      console.error('❌ Game failed to initialize:', error);
      throw error;
    }
  }

  async runBasicSmokeTests() {
    console.log('🧪 Running basic smoke tests...');

    const tests = [
      {
        name: 'React App Renders',
        test: async () => {
          const reactRoot = await this.page.$('#react-root');
          return reactRoot !== null;
        }
      },
      {
        name: 'Game Canvas Present',
        test: async () => {
          const canvas = await this.page.$('canvas#game-canvas');
          return canvas !== null;
        }
      },
      {
        name: 'Main Menu Visible',
        test: async () => {
          const mainMenu = await this.page.$('#main-menu, [data-testid="main-menu"]');
          return mainMenu !== null;
        }
      },
      {
        name: 'Vanilla Game Instance Available',
        test: async () => {
          return await this.page.evaluate(() => {
            return typeof window.SawyersRPG !== 'undefined' &&
                   typeof window.gameState !== 'undefined';
          });
        }
      },
      {
        name: 'Game State Has Player',
        test: async () => {
          return await this.page.evaluate(() => {
            return window.gameState &&
                   window.gameState.player &&
                   typeof window.gameState.player.name !== 'undefined';
          });
        }
      },
    ];

    for (const test of tests) {
      try {
        const result = await test.test();
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`  ${status} ${test.name}`);

        this.testResults.push({
          name: test.name,
          passed: result,
          error: null
        });

      } catch (error) {
        console.log(`  ❌ ERROR ${test.name}: ${error.message}`);
        this.testResults.push({
          name: test.name,
          passed: false,
          error: error.message
        });
      }
    }
  }

  async runExistingTests() {
    console.log('🔄 Running existing test suite...');

    try {
      // Load the existing test framework
      await this.page.addScriptTag({
        path: resolve(projectRoot, 'tests/test-framework.js')
      });

      // Run basic tests first
      const testFiles = [
        'core_systems_integration.test.js',
        'save_system.test.js',
      ];

      for (const testFile of testFiles) {
        try {
          console.log(`  🧪 Running ${testFile}...`);

          await this.page.addScriptTag({
            path: resolve(projectRoot, 'tests', testFile)
          });

          // Wait for test to complete
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Get test results
          const results = await this.page.evaluate(() => {
            return window.testFramework ? window.testFramework.getResults() : null;
          });

          if (results) {
            console.log(`    Results: ${results.passed} passed, ${results.failed} failed`);
          }

        } catch (error) {
          console.error(`    ❌ Failed to run ${testFile}:`, error.message);
        }
      }

    } catch (error) {
      console.error('❌ Failed to run existing tests:', error);
    }
  }

  async generateReport() {
    console.log('\n📊 Test Report');
    console.log('='.repeat(50));

    const passed = this.testResults.filter(r => r.passed).length;
    const failed = this.testResults.filter(r => !r.passed).length;

    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}${r.error ? ': ' + r.error : ''}`);
        });
    }

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: { total: this.testResults.length, passed, failed },
      tests: this.testResults,
      browser: 'Puppeteer/Chrome',
      environment: 'React Port'
    };

    const reportPath = resolve(projectRoot, 'test-results-react.json');
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return failed === 0;
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');

    if (this.page) {
      await this.page.close();
    }

    if (this.browser) {
      await this.browser.close();
    }

    await this.stopViteServer();
  }

  async run() {
    let success = false;

    try {
      await this.startViteServer();
      await this.startBrowser();
      await this.loadGamePage();
      await this.runBasicSmokeTests();
      await this.runExistingTests();
      success = await this.generateReport();

    } catch (error) {
      console.error('❌ Test runner failed:', error);
    } finally {
      await this.cleanup();
    }

    process.exit(success ? 0 : 1);
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new ReactTestRunner();
  runner.run().catch(console.error);
}

export default ReactTestRunner;