const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto('https://qa.bridgeconnect.uk');

  // Login manually OR automate login

  console.log('Login complete. Press Enter to save auth state.');

  process.stdin.once('data', async () => {
    await page.context().storageState({
      path: 'scanner/auth/auth.json'
    });

    console.log('Auth state saved.');
    await browser.close();
  });
})();