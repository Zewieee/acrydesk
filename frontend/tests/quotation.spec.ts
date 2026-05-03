import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { QuotationPage } from './pages/QuotationPage';
import { updateTestResult } from '../utils/csvHandler';

test.describe('Quotation Automation', () => {
  let loginPage: LoginPage;
  let quotationPage: QuotationPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    quotationPage = new QuotationPage(page);
    await loginPage.goto();
    // Login as Manager
    await loginPage.login('manager3@acrydesk.com', '123456');
  });

  test('TC-QUO-001: Create and send quotation to customer', async ({ page }) => {
    const testCaseId = 'TC-QUO-001';
    try {
      await quotationPage.goToQuotationTab();
      
      // Wait for the quotation management page
      await expect(page.getByText('Quản lý Báo giá')).toBeVisible({ timeout: 10000 });
      
      // Look for any RFQ that needs quotation
      const createButton = page.locator('button:text("Tạo báo giá")').first();
      await expect(createButton).toBeVisible();
      
      await createButton.click();
      
      // Fill the form
      await quotationPage.fillQuotationForm({
        unitPrice: 5000000,
        tax: 8,
        discount: 0,
        notes: 'Báo giá tự động bởi TC-QUO-001'
      });
      
      // Submit
      await quotationPage.submit();
      
      // Handle alert (browser dialog)
      page.on('dialog', dialog => dialog.accept());
      
      // Check for success feedback
      await expect(page.getByText('Báo giá đã tạo')).toBeVisible();
      
      await updateTestResult('TC_Quotation.csv', testCaseId, 'Successfully created and sent quotation', 'Passed');
    } catch (error: any) {
      await updateTestResult('TC_Quotation.csv', testCaseId, 'Failed to create quotation', 'Failed', error.message);
      throw error;
    }
  });
});
