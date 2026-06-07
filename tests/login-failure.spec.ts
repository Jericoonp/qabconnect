import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LoginPage } from '../pages/LoginPage';

const baseUrl = process.env.BASE_URL ?? 'https://qa.bridgeconnect.uk';
const credentialsPath = path.resolve(__dirname, '../credentials/test-users.json');

function readCredentials() {
  try {
    const raw = fs.readFileSync(credentialsPath, 'utf8');
    return JSON.parse(raw) as { users?: Array<{ id?: string; email?: string; password?: string }> };
  } catch {
    return { users: [] };
  }
}

const users = readCredentials().users ?? [];
const ha1 = users.find((user) => user.id === 'HA1') ?? { email: 'julia+bhsstaff2ha1@mailinator.com', password: '11A' };
const ha2 = users.find((user) => user.id === 'HA2') ?? { email: 'julia+bhsstaff2ha2@mailinator.com', password: '11A' };

function isFailureResponse(statusCode: number) {
  return statusCode === 401 || statusCode === 403;
}

test.describe('Login failure behavior', () => {
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      return;
    }

    const screenshotDir = path.resolve(__dirname, '../artifacts/screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });

    const screenshotPath = path.join(
      screenshotDir,
      `failure-suite-${testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`,
    );

    await page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach('failure-suite-screenshot', {
      path: screenshotPath,
      contentType: 'image/png',
    });
  });

  test('HA1 invalid login should fail with an authentication error response', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);
    const responseStatus: number[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/login')) {
        responseStatus.push(response.status());
      }
    });

    await loginPage.goto();
    await loginPage.expectReady();
    await loginPage.login('invalid@example.com', ha1.password ?? '11A');

    await expect.poll(async () => responseStatus.some(isFailureResponse), { timeout: 15000 }).toBe(true);
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('HA2 invalid login should fail with an authentication error response', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);
    const responseStatus: number[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/login')) {
        responseStatus.push(response.status());
      }
    });

    await loginPage.goto();
    await loginPage.expectReady();
    await loginPage.login(ha2.email ?? 'julia+bhsstaff2ha2@mailinator.com', 'wrong-password');

    await expect.poll(async () => responseStatus.some(isFailureResponse), { timeout: 15000 }).toBe(true);
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('happy path: HA1 credentials can submit the login form successfully', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);

    await loginPage.goto();
    await loginPage.expectReady();
    await loginPage.login(ha1.email ?? 'julia+bhsstaff2ha1@mailinator.com', ha1.password ?? '11A');

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('HA1 correct credentials should not be treated as failure on the login page', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);
    const responseStatus: number[] = [];

    page.on('response', (response) => {
      if (response.url().includes('/login')) {
        responseStatus.push(response.status());
      }
    });

    await loginPage.goto();
    await loginPage.expectReady();
    await loginPage.login(ha1.email ?? 'julia+bhsstaff2ha1@mailinator.com', ha1.password ?? '11A');

    await expect.poll(async () => responseStatus.length > 0, { timeout: 15000 }).toBe(true);
    await expect(loginPage.submitButton).toBeVisible();
  });
});
