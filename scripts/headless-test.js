// scripts/headless-test.js
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8';
    case '.js': return 'application/javascript; charset=utf-8';
    case '.css': return 'text/css; charset=utf-8';
    case '.json': return 'application/json; charset=utf-8';
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.svg': return 'image/svg+xml';
    default: return 'application/octet-stream';
  }
}

function createStaticServer(rootDir) {
  const server = http.createServer((req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      let filePath = path.join(rootDir, urlPath);

      // Prevent path traversal
      if (!filePath.startsWith(rootDir)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }

      // If directory, try to serve index.html
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      const stream = fs.createReadStream(filePath);
      res.setHeader('Content-Type', getContentType(filePath));
      stream.pipe(res);
    } catch (err) {
      res.statusCode = 500;
      res.end('Server Error');
    }
  });
  return server;
}

async function run() {
  const server = createStaticServer(projectRoot);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Pipe browser console logs to Node
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') console.error(text);
    else if (type === 'warning' || type === 'warn') console.warn(text);
    else console.log(text);
  });

  try {
    const url = `${baseUrl}/tests/test-runner.html?headless=1`;
    await page.goto(url, { waitUntil: 'load', timeout: 60_000 });

    // Wait for the test framework to be available
    await page.waitForFunction(() => typeof window.runTests === 'function', { timeout: 60_000 });

    // Execute tests in the browser context and get structured results
    const results = await page.evaluate(async () => {
      try {
        if (typeof window.setVerbose === 'function') {
          window.setVerbose(true);
        }
        const r = await window.runTests();
        return { ok: true, results: r };
      } catch (e) {
        return { ok: false, error: e?.message || String(e) };
      }
    });

    if (!results.ok) {
      console.error(`Test runner error: ${results.error}`);
      process.exitCode = 1;
      return;
    }

    const { results: r } = results;
    const summary = `Test summary: passed=${r.passed ?? '?'} failed=${r.failed ?? '?'} total=${r.total ?? '?'}`;
    if ((r.failed ?? 0) > 0) {
      console.error(`❌ Some tests failed. ${summary}`);
      process.exitCode = 1;
    } else {
      console.log(`✅ All tests passed. ${summary}`);
      process.exitCode = 0;
    }
  } catch (err) {
    console.error('Headless test run failed:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

run();
