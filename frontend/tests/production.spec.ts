import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ProductionPage } from './pages/ProductionPage';
import { updateTestResult } from '../utils/csvHandler';

test.describe('Production Automation', () => {
  let loginPage: LoginPage;
  let productionPage: ProductionPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    productionPage = new ProductionPage(page);
    await loginPage.goto();
    // Login as Manager
    await loginPage.login('manager3@acrydesk.com', '123456');
  });

  test('TC-PROD-001: Kanban Board structure verification', async ({ page }) => {
    const testCaseId = 'TC-PROD-001';
    try {
      await productionPage.goToProductionTab();
      
      const columnLabels = [
        'Tiếp nhận', 'Thiết kế & KT', 'Vật tư', 'Cắt & Gia công', 
        'Lắp ráp', 'Hoàn thiện', 'Kiểm định (QC)', 'Đóng gói', 
        'Giao hàng', 'Hoàn tất'
      ];
      
      for (const label of columnLabels) {
        await expect(page.getByText(label)).toBeVisible();
      }
      
      await updateTestResult('TC_Production.csv', testCaseId, 'All 10 Kanban columns are visible', 'Passed');
    } catch (error: any) {
      await updateTestResult('TC_Production.csv', testCaseId, 'Kanban structure invalid', 'Failed', error.message);
      throw error;
    }
  });

  test('TC-PROD-002: Move RFQ to next production stage', async ({ page }) => {
    const testCaseId = 'TC-PROD-002';
    try {
      await productionPage.goToProductionTab();
      
      // Find the first card in any column that has a 'Next' button enabled
      // The Next button has class 'bg-blue-50'
      const nextButton = page.locator('button.bg-blue-50').first();
      await expect(nextButton).toBeVisible({ timeout: 10000 });
      
      // Get the code of the RFQ we are about to move
      const card = page.locator('div:has(button.bg-blue-50)').first();
      const rfqCode = await card.locator('span.font-black').textContent();
      
      if (!rfqCode) throw new Error('No RFQ card found to move');

      const initialStage = await productionPage.getRFQStage(rfqCode);
      
      await nextButton.click();
      
      // Wait for update (UI refresh)
      await page.waitForTimeout(1000); 
      
      const newStage = await productionPage.getRFQStage(rfqCode);
      
      if (initialStage === newStage) {
        throw new Error(`RFQ stage did not change from ${initialStage}`);
      }
      
      await updateTestResult('TC_Production.csv', testCaseId, `Moved ${rfqCode} from ${initialStage} to ${newStage}`, 'Passed');
    } catch (error: any) {
      await updateTestResult('TC_Production.csv', testCaseId, 'Failed to move RFQ stage', 'Failed', error.message);
      throw error;
    }
  });
});
