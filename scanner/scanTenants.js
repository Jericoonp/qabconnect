const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const url = process.argv[2] || 'https://qa.bridgeconnect.uk/ha-tenants/';

  const domDir = path.join(__dirname, '../artifacts/dom');
  const shotDir = path.join(__dirname, '../artifacts/screenshots');

  fs.mkdirSync(domDir, { recursive: true });
  fs.mkdirSync(shotDir, { recursive: true });

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: path.join(__dirname, 'auth', 'auth.json')
  });
  const page = await context.newPage();

  try {
    // 1. Go to page
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // 2. WAIT FOR FULL LOAD (stable version)
    await page.waitForFunction(() => document.readyState === 'complete');

    // 3. Optional stability buffer (important for JS-heavy pages)
    await page.waitForLoadState('networkidle');

    // 4. Screenshot
    await page.screenshot({
      path: path.join(shotDir, 'Tenants-page.png'),
      fullPage: true
    });

    // 5. DOM snapshot (generic Tenants-page scan)
    const elements = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input, button, label, select, textarea, a')).map(el => ({
        tag: el.tagName,
        id: el.id || null,
        name: el.name || null,
        type: el.type || null,
        text: el.innerText?.trim() || null
      }));
    });

    fs.writeFileSync(
      path.join(domDir, 'Tenants-page.json'),
      JSON.stringify(elements, null, 2)
    );

    console.log('✅ Scan complete:', url);

  } catch (err) {
    console.error('❌ Scan failed:', err);
  } finally {
    await browser.close();
  }
})();