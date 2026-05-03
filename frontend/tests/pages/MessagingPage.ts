import { Page, expect } from '@playwright/test';

export class MessagingPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate() {
    // Navigate via Sidebar in Dashboard
    await this.page.click('button:has-text("Tin nhắn")');
    // Use more specific selector since there are multiple h2 with 'Trao đổi'
    await expect(this.page.locator('h2.text-xl').filter({ hasText: /^Trao đổi$/ }).first()).toBeVisible({ timeout: 15000 });
  }

  async selectRFQ(code: string) {
    // Search to make it visible if list is long
    await this.searchRFQ(code);
    const rfqItem = this.page.locator(`.w-80 button:has-text("${code}")`).first();
    await rfqItem.click();
    // Wait for the room header to update
    await expect(this.page.locator('h3').filter({ hasText: code })).toBeVisible();
  }

  async searchRFQ(query: string) {
    await this.page.fill('input[placeholder="Tìm kiếm RFQ..."]', query);
  }

  async sendMessage(text: string) {
    if (text) {
      await this.page.fill('input[placeholder="Nhập tin nhắn..."]', text);
      await this.page.keyboard.press('Enter');
    } else {
      await this.page.click('button[type="submit"]');
    }
  }

  async attachFile(filePaths: string[]) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.page.click('button[title="Gửi file/ảnh"]');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePaths);
  }

  async waitForMessage(text: string) {
    const message = this.page.locator(`.flex-1.overflow-y-auto .rounded-2xl`).filter({ hasText: text }).last();
    await message.waitFor({ state: 'visible', timeout: 10000 });
    return message;
  }

  async getLatestMessage() {
    const bubbles = this.page.locator('.flex-1.overflow-y-auto .rounded-2xl').filter({ hasNotText: 'Hãy bắt đầu' });
    const last = bubbles.last();
    await last.waitFor({ state: 'visible', timeout: 8000 });
    return last;
  }

  async getToast() {
    return this.page.locator('.toast'); 
  }
}
