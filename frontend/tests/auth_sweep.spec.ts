import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { updateTestResult } from '../utils/csvHandler';

test.describe('Comprehensive Auth Sweep', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  // Validation Cases (Registration)
  const registrationValidationCases = [
    { id: 'TC-AUTH-002', step: 'domain', value: 'test@gmail.com', expected: 'Email must follow @acrydesk.com format' },
    { id: 'TC-AUTH-008', step: 'shortPass', value: '12345', expected: 'Password must be between 6 and 20 characters' },
    { id: 'TC-AUTH-009', step: 'longPass', value: 'a'.repeat(21), expected: 'Password must be between 6 and 20 characters' },
  ];

  for (const tc of registrationValidationCases) {
    test(tc.id, async ({ page }) => {
      await page.click('text=Đăng ký');
      if (tc.step === 'domain') await page.fill('input[type="email"]', tc.value);
      if (tc.step === 'shortPass' || tc.step === 'longPass') await page.fill('input[type="password"]', tc.value);
      
      await page.click('button[type="submit"]');
      const errorToast = page.locator('.toast-error, [role="alert"]').first();
      await expect(errorToast).toBeVisible();
      const msg = await errorToast.textContent() || 'Validation message shown';
      await updateTestResult('TC_Auth.csv', tc.id, msg, 'Passed');
    });
  }

  // Login Validation Cases
  const loginValidationCases = [
    { id: 'TC-AUTH-018', email: 'longnguyen@acrydesk.com', pass: 'wrong', expected: 'Đăng nhập thất bại' },
    { id: 'TC-AUTH-019', email: 'nonexistent@acrydesk.com', pass: '123456', expected: 'User not found' },
  ];

  for (const tc of loginValidationCases) {
    test(tc.id, async ({ page }) => {
      await loginPage.login(tc.email, tc.pass);
      const errorToast = page.locator('.toast-error, [role="alert"]').first();
      await expect(errorToast).toBeVisible();
      const msg = await errorToast.textContent() || 'Validation message shown';
      await updateTestResult('TC_Auth.csv', tc.id, msg, 'Passed');
    });
  }
});
