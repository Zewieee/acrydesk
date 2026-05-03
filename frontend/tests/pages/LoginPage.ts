import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
    // Click the 'Đăng nhập' button on the Home page to show the Login component
    await this.page.click('text=Đăng nhập');
  }

  async login(email: string, pass: string) {
    // If we are on Home page, we need to click login button first
    const loginBtnOnHome = this.page.locator('button:has-text("Đăng nhập"), button:has-text("Bắt đầu ngay")').first();
    if (await loginBtnOnHome.isVisible()) {
      await loginBtnOnHome.click();
    }

    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', pass);
    await this.page.click('button[type="submit"]');
    // Wait for Dashboard to load
    await this.page.waitForSelector('nav', { state: 'visible' });
  }

  async getErrorMessage() {
    return this.page.textContent('.toast-error'); // Placeholder, adjust based on actual UI
  }

  async getDashboardHeader() {
    return this.page.textContent('header h1'); // Placeholder
  }
}
