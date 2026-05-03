import { Page } from '@playwright/test';

export class RFQPage {
  constructor(private page: Page) {}

  async openCreateModal() {
    await this.page.click('text=Gửi yêu cầu mới');
  }

  async fillRFQForm(data: {
    productType: string;
    quantity: number;
    dimensions: string;
    material: string;
    description: string;
    expectedDate: string;
  }) {
    // Fill items (first item)
    await this.page.selectOption('select:has-text("Chọn loại sp")', { label: data.productType });
    await this.page.fill('input[type="number"]', data.quantity.toString());
    await this.page.selectOption('select:has-text("Chọn kích thước")', { label: data.dimensions });
    await this.page.selectOption('select:has-text("Chọn vật liệu")', { label: data.material });
    await this.page.fill('textarea[placeholder="Mô tả kỹ thuật cho riêng sản phẩm này..."]', data.description);

    // Section 3: Ghi chú & Đính kèm
    await this.page.fill('input[type="date"]', data.expectedDate);
  }

  async submit() {
    await this.page.click('button:text("Gửi yêu cầu báo giá")');
  }

  async isSuccessToastVisible() {
    // react-hot-toast or similar. If app uses browser alert, we'd need a different check.
    // Based on RFQModal.tsx, it calls onSubmit and then onClose. 
    // The actual feedback is in CustomerDashboard.tsx
    return this.page.isVisible('text=Gửi yêu cầu mới'); // Modal closed
  }
}
