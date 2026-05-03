import { Page } from '@playwright/test';

export class ProductionPage {
  constructor(private page: Page) {}

  async goToProductionTab() {
    await this.page.getByRole('button', { name: 'Tiến độ', exact: true }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async moveRFQNext(rfqCode: string) {
    const card = this.page.locator(`div:has(span:text("${rfqCode}"))`).last();
    // The Right arrow button has class bg-blue-50
    await card.locator('button.bg-blue-50').click();
  }

  async moveRFQPrev(rfqCode: string) {
    const card = this.page.locator(`div:has(span:text("${rfqCode}"))`).last();
    // The Left arrow button has class bg-slate-50
    await card.locator('button.bg-slate-50').click();
  }

  async getRFQStage(rfqCode: string) {
    // Find which column the card is in
    const card = this.page.locator(`div:has(span:text("${rfqCode}"))`).last();
    const column = card.locator('xpath=ancestor::div[contains(@class, "flex flex-col bg-slate-100")]');
    return column.locator('h3').textContent();
  }
}
