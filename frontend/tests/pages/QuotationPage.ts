import { Page, expect } from '@playwright/test';

export class QuotationPage {
  constructor(private page: Page) {}

  async goToQuotationTab() {
    await this.page.getByRole('button', { name: 'Báo giá', exact: true }).click();
    await this.page.waitForLoadState('networkidle');
  }

  async openQuotationForm(rfqCode?: string) {
    if (rfqCode) {
      const row = this.page.locator(`div:has-text("${rfqCode}")`).filter({ has: this.page.locator('button:text("Tạo báo giá")') }).first();
      await row.locator('button:text("Tạo báo giá")').click();
    } else {
      await this.page.locator('button:text("Tạo báo giá")').first().click();
    }
  }

  async fillQuotationForm(data: {
    unitPrice: number;
    tax?: number;
    discount?: number;
    notes?: string;
  }) {
    await this.page.fill('input[type="number"] >> nth=0', data.unitPrice.toString());
    
    if (data.tax !== undefined) {
      await this.page.fill('input[type="number"]:near(span:text("VAT (%)"))', data.tax.toString());
    }
    
    if (data.discount !== undefined) {
      await this.page.fill('input[type="number"]:near(span:text("Giảm giá (VNĐ)"))', data.discount.toString());
    }

    if (data.notes) {
      await this.page.fill('textarea[placeholder*="Giá đã bao gồm"]', data.notes);
    }
  }

  async submit() {
    await this.page.click('button:text("Tạo & Gửi báo giá cho khách hàng")');
  }
}
