import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page, private readonly baseUrl = 'https://qa.bridgeconnect.uk') {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.pageTitle = page.getByText('Sign in to BridgeConnect', { exact: true });
  }

  async goto() {
    await this.page.goto(this.baseUrl, { waitUntil: 'domcontentloaded' });
    await this.page.waitForLoadState('networkidle').catch(() => undefined);
  }

  async expectReady() {
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }

  async login(username: string, password: string) {
    await this.emailInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async assertLoginError() {
    const errorText = this.page.getByText(/error|invalid|incorrect|failed|unauthorized|forbidden/i);
    const hasErrorText = await errorText.count().then((count) => count > 0);

    if (hasErrorText) {
      await expect(errorText.first()).toBeVisible();
      return;
    }

    await expect(this.submitButton).toBeVisible();
    await expect(this.page).toHaveURL(/qa\.bridgeconnect\.uk\/?$/);
  }
}
