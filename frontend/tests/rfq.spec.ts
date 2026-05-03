import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { RFQPage } from './pages/RFQPage';
import { updateTestResult } from '../utils/csvHandler';

test.describe('RFQ Automation', () => {
  let loginPage: LoginPage;
  let rfqPage: RFQPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    rfqPage = new RFQPage(page);
    await loginPage.goto();
    // Login as Customer
    await loginPage.login('longnguyen@acrydesk.com', '1234567');
  });

  test('TC-RFQ-001: Create new RFQ - Standard single item', async ({ page }) => {
    const testCaseId = 'TC-RFQ-001';
    try {
      await rfqPage.openCreateModal();
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expectedDate = tomorrow.toISOString().split('T')[0];

      await rfqPage.fillRFQForm({
        productType: 'Bồn Bể Nhựa PP, PVC, FRP',
        quantity: 2,
        dimensions: '1000x500x300mm',
        material: 'PP',
        description: 'Test RFQ for TC-RFQ-001',
        expectedDate: expectedDate
      });

      await rfqPage.submit();
      
      // Verification: Modal should be closed and dashboard visible
      await expect(page.getByText('Yêu cầu gần đây')).toBeVisible();
      
      await updateTestResult('TC_RFQ.csv', testCaseId, 'Successfully created new RFQ', 'Passed');
    } catch (error: any) {
      await updateTestResult('TC_RFQ.csv', testCaseId, 'Failed to create RFQ', 'Failed', error.message);
      throw error;
    }
  });
});
