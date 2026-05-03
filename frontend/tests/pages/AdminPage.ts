import { Page } from '@playwright/test';

export class AdminPage {
  constructor(private page: Page) {}

  async goToAnnouncementsTab() {
    await this.page.click('text=Thông báo chung');
  }

  async openCreateAnnouncement() {
    await this.page.click('text=Tạo thông báo mới');
  }

  async fillAnnouncementForm(data: {
    title: string;
    content: string;
  }) {
    await this.page.fill('input[placeholder="Nhập tiêu đề thông báo..."]', data.title);
    await this.page.fill('textarea[placeholder="Nhập nội dung thông báo kỹ chi tiết..."]', data.content);
  }

  async submit() {
    await this.page.click('button:text("Đăng thông báo")');
  }
}
