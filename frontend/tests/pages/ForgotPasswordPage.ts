import { Page, expect } from '@playwright/test';

export class ForgotPasswordPage {
  constructor(private page: Page) {}

  async navigateFromLogin() {
    await this.page.click('text=Quên mật khẩu?');
  }

  // Step 1: Identity
  async fillIdentity(email: string, phone: string) {
    if (email) await this.page.fill('input[placeholder="name@acrydesk.com"]', email);
    if (phone) await this.page.fill('input[placeholder="0xxxxxxxxx"]', phone);
  }

  async submitIdentity() {
    await this.page.click('button:has-text("Gửi Mã Xác Nhận")');
  }

  // Step 2: Reset
  async fillReset(token: string, newPass: string, confirmPass: string) {
    if (token) await this.page.fill('input[placeholder="Nhập mã xác thực"]', token);
    
    // Select password inputs by their labels to be more robust
    if (newPass) {
        await this.page.locator('label:has-text("Mật khẩu mới") + div input').fill(newPass);
    }
    if (confirmPass) {
        await this.page.locator('label:has-text("Xác nhận mật khẩu") + div input').fill(confirmPass);
    }
  }

  async submitReset() {
    await this.page.click('button:has-text("Cập Nhật Mật Khẩu")');
  }

  async goBack() {
    await this.page.click('text=Quay lại đăng nhập');
  }

  async getToastMessage() {
    // Wait for the toast to appear
    const toast = this.page.locator('[role="status"], .hot-toast-bar, [role="alert"]').first();
    await toast.waitFor({ state: 'visible' });
    return await toast.innerText();
  }
}
