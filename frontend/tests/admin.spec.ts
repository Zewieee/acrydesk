import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { updateTestResult } from '../utils/csvHandler';

test.describe('Admin/Comm Automation', () => {
  let loginPage: LoginPage;
  let adminPage: AdminPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    adminPage = new AdminPage(page);
    await loginPage.goto();
    // Login as Manager
    await loginPage.login('manager3@acrydesk.com', '123456');
  });

  test('TC-ADM-003: Create common announcement', async ({ page }) => {
    const testCaseId = 'TC-ADM-003';
    try {
      await adminPage.goToAnnouncementsTab();
      await adminPage.openCreateAnnouncement();
      
      await adminPage.fillAnnouncementForm({
        title: 'Thông báo bảo trì hệ thống định kỳ',
        content: 'Hệ thống sẽ được nâng cấp vào lúc 00:00 ngày 20/04/2026. Vui lòng hoàn tất các tác vụ trước thời gian này.'
      });
      
      await adminPage.submit();
      
      // Verify in list
      await expect(page.getByText('Thông báo bảo trì hệ thống định kỳ')).toBeVisible();
      
      await updateTestResult('TC_Admin_Comm.csv', testCaseId, 'Announcement created successfully', 'Passed');
    } catch (error: any) {
      await updateTestResult('TC_Admin_Comm.csv', testCaseId, 'Failed to create announcement', 'Failed', error.message);
      throw error;
    }
  });
});
