import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { updateTestResult } from '../utils/csvHandler';

test.describe('Auth Validation Sweep', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  const authCases = [
    { id: 'TC-AUTH-002', name: 'Registration - Invalid email domain', data: { email: 'test@gmail.com' }, expected: 'Email must follow @acrydesk.com format' },
    { id: 'TC-AUTH-006', name: 'Registration - Invalid phone prefix', data: { phone: '0291112223' }, expected: 'Phone number format invalid' },
    { id: 'TC-AUTH-008', name: 'Registration - Password too short', data: { pass: '12345' }, expected: 'Password must be between 6 and 20 characters' },
    { id: 'TC-AUTH-018', name: 'Login - Incorrect password', data: { email: 'longnguyen@acrydesk.com', pass: 'wrong' }, expected: 'Đăng nhập thất bại' },
  ];

  for (const tc of authCases) {
    test(`${tc.id}: ${tc.name}`, async ({ page }) => {
      try {
        // Since many of these are on Register page, we navigate there if needed
        if (tc.id.startsWith('TC-AUTH-00')) {
             await page.click('text=Đăng ký');
             if (tc.data.email) await page.fill('input[type="email"]', tc.data.email);
             if (tc.data.phone) await page.fill('input[type="tel"]', tc.data.phone);
             if (tc.data.pass) await page.fill('input[type="password"]', tc.data.pass);
             await page.click('button[type="submit"]');
        } else {
             await loginPage.login(tc.data.email || '', tc.data.pass || '');
        }

        // Check for error toast
        const errorToast = page.locator('.toast-error, .text-red-500, [role="alert"]').first();
        // Since we don't need screenshots, we just check visibility or text
        await expect(errorToast).toBeVisible();
        const actualMsg = await errorToast.textContent() || 'Error message shown';
        
        await updateTestResult('TC_Auth.csv', tc.id, actualMsg, 'Passed');
      } catch (error: any) {
        await updateTestResult('TC_Auth.csv', tc.id, 'Failed to trigger validation', 'Failed', error.message);
        throw error;
      }
    });
  }
});
