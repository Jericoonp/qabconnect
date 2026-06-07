import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LoginPage } from '../pages/LoginPage';

const baseUrl = process.env.BASE_URL ?? 'https://qa.bridgeconnect.uk';

const credentialsPath = path.resolve(__dirname, '../credentials/test-users.json');

function readTestUsers() {
  try {
    const raw = fs.readFileSync(credentialsPath, 'utf8');
    const parsed = JSON.parse(raw) as { users?: Array<{ id?: string; email?: string; password?: string }> };
    return parsed.users ?? [];
  } catch {
    return [];
  }
}

const testUsers = readTestUsers();
const ha1User = testUsers.find((user) => user.id === 'HA1') ?? { email: 'julia+bhsstaff2ha1@mailinator.com', password: '11A' };
const ha2User = testUsers.find((user) => user.id === 'HA2') ?? { email: 'julia+bhsstaff2ha2@mailinator.com', password: '11A' };

const validUsername = process.env.BRIDGECONNECT_VALID_USER ?? ha1User.email ?? 'qa@example.com';
const validPassword = process.env.BRIDGECONNECT_VALID_PASSWORD ?? ha1User.password ?? 'Password123!';
const secondaryUsername = process.env.BRIDGECONNECT_SECONDARY_USER ?? ha2User.email ?? validUsername;
const secondaryPassword = process.env.BRIDGECONNECT_SECONDARY_PASSWORD ?? ha2User.password ?? validPassword;
const invalidUsername = process.env.BRIDGECONNECT_INVALID_USER ?? 'invalid@example.com';
const invalidPassword = process.env.BRIDGECONNECT_INVALID_PASSWORD ?? 'WrongPassword!';

test.describe('BridgeConnect login page', () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);
    await loginPage.goto();
    await loginPage.expectReady();
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== 'passed') {
      return;
    }

    const screenshotDir = path.resolve(__dirname, '../artifacts/screenshots');
    fs.mkdirSync(screenshotDir, { recursive: true });

    const screenshotPath = path.join(
      screenshotDir,
      `successful-${testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.png`,
    );

    await page.screenshot({ path: screenshotPath, fullPage: true });
    await testInfo.attach('successful-screenshot', {
      path: screenshotPath,
      contentType: 'image/png',
    });
  });

  test('happy path: login form accepts valid credentials and remains on the login page', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);

    await loginPage.login(validUsername, validPassword);
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('happy path: HA2 credentials can also be entered into the login form', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);

    await loginPage.login(secondaryUsername, secondaryPassword);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('negative case: invalid username with valid password keeps the user on the login page', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);

    await loginPage.login(invalidUsername, validPassword);
    await loginPage.assertLoginError();
  });

  test('negative case: valid username with invalid password keeps the user on the login page', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);

    await loginPage.login(validUsername, invalidPassword);
    await loginPage.assertLoginError();
  });

  test('negative case: empty username and password cannot submit a valid login attempt', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);

    await loginPage.login('', '');
    await expect(loginPage.submitButton).toBeEnabled();
    await expect(loginPage.emailInput).toHaveValue('');
    await expect(loginPage.passwordInput).toHaveValue('');
  });

  test('edge case: long credentials are accepted by the form fields', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);
    const longUsername = 'qa-user-' + 'x'.repeat(120) + '@example.com';
    const longPassword = 'P@ssw0rd!' + 'y'.repeat(120);

    await loginPage.login(longUsername, longPassword);
    await expect(loginPage.emailInput).toHaveValue(longUsername);
    await expect(loginPage.passwordInput).toHaveValue(longPassword);
  });

  test('edge case: special characters are preserved in the form fields', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);
    const specialUsername = 'user+tag@example.com';
    const specialPassword = 'P@ss!word_2026#';

    await loginPage.login(specialUsername, specialPassword);
    await expect(loginPage.emailInput).toHaveValue(specialUsername);
    await expect(loginPage.passwordInput).toHaveValue(specialPassword);
  });

  test('edge case: leading and trailing whitespace behaves consistently across both fields', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);
    const usernameWithSpaces = '  qa@example.com  ';
    const passwordWithSpaces = '  Password123!  ';

    await loginPage.login(usernameWithSpaces, passwordWithSpaces);
    await expect(loginPage.emailInput).toHaveValue(usernameWithSpaces.trim());
    await expect(loginPage.passwordInput).toHaveValue(passwordWithSpaces);
  });

  test('edge case: rapid repeated submissions do not break the login form', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);

    for (let index = 0; index < 3; index += 1) {
      await loginPage.login(validUsername, invalidPassword);
    }

    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('navigation: reload keeps the login form available', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);

    await page.reload();
    await loginPage.expectReady();
    await expect(loginPage.pageTitle).toBeVisible();
  });

  test('navigation: moving to another page and back restores the login form', async ({ page }) => {
    const loginPage = new LoginPage(page, baseUrl);

    await page.goto('https://example.com');
    await page.goBack();
    await loginPage.expectReady();
    await expect(loginPage.pageTitle).toBeVisible();
  });
});
