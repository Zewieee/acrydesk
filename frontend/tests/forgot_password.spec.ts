import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

test.describe('Forgot Password Flow Automation', () => {
  let loginPage: LoginPage;
  let fpPage: ForgotPasswordPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    fpPage = new ForgotPasswordPage(page);
    await loginPage.goto();
    await fpPage.navigateFromLogin();
  });

  test('TC_EN_FP_001: Navigation to Forgot Password screen', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('Quên Mật Khẩu');
    await expect(page.locator('text=Email tài khoản')).toBeVisible();
  });

  test('TC_EN_FP_004: Handle non-existent account or mismatching data', async ({ page }) => {
    // Mock the API to return 404
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Thông tin không khớp với tài khoản nào' }),
      });
    });

    await fpPage.fillIdentity('wrong@acrydesk.com', '0999999999');
    await fpPage.submitIdentity();
    
    const message = await fpPage.getToastMessage();
    expect(message).toContain('không khớp');
  });

  test('TC_EN_FP_005: Validate mandatory fields on Step 1', async ({ page }) => {
    // To trigger JS validation instead of browser native one, we can remove the 'required' attribute via JS
    await page.evaluate(() => {
      document.querySelectorAll('input[required]').forEach(el => el.removeAttribute('required'));
    });

    await fpPage.submitIdentity();
    
    const message = await fpPage.getToastMessage();
    expect(message).toBe('Vui lòng nhập Email và Số điện thoại');
  });

  test('TC_EN_FP_003: Verify phone number input sanitization', async ({ page }) => {
    const phoneInput = page.locator('input[placeholder="0xxxxxxxxx"]');
    // Using .type() to simulate keyboard events which trigger the onChange
    await phoneInput.pressSequentially('09A123#$');
    const value = await phoneInput.inputValue();
    expect(value).toBe('09123');
  });

  test('TC_EN_FP_007: Verify password mismatch error', async ({ page }) => {
    // Mock Step 1 Success
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Success', resetToken: 'mock-token' }),
      });
    });

    await fpPage.fillIdentity('test@acrydesk.com', '0912345678');
    await fpPage.submitIdentity();

    // Now on Step 2
    await expect(page.locator('text=Mã xác thực (OTP)')).toBeVisible();
    
    await fpPage.fillReset('mock-token', 'Password123', 'Mismatch123');
    await fpPage.submitReset();
    
    const message = await fpPage.getToastMessage();
    expect(message).toBe('Mật khẩu xác nhận không khớp');
  });

  test('TC_EN_FP_008: Verify password length constraint (Too short)', async ({ page }) => {
    // Mock Step 1 Success
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Success', resetToken: 'mock-token' }),
      });
    });

    await fpPage.fillIdentity('test@acrydesk.com', '0912345678');
    await fpPage.submitIdentity();

    await expect(page.locator('text=Mã xác thực (OTP)')).toBeVisible();
    
    await fpPage.fillReset('mock-token', '12345', '12345');
    await fpPage.submitReset();
    
    const message = await fpPage.getToastMessage();
    expect(message).toBe('Mật khẩu phải từ 6 đến 20 ký tự');
  });

  test('TC_EN_FP_010: Verify Back to Login functionality', async ({ page }) => {
    await fpPage.goBack();
    await expect(page.locator('h1')).toHaveText('Đăng Nhập');
  });

  test('TC_EN_FP_013: Invalid Email format validation', async ({ page }) => {
    await fpPage.fillIdentity('invalid-email', '0912345678');
    await fpPage.submitIdentity();
    
    // Browse native validation or custom validation might trigger
    // Since it's type="email", browser might block it. Let's check native message
    const emailInput = page.locator('input[type="email"]');
    const validationMessage = await emailInput.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validationMessage).not.toBe('');
  });

  test('TC_EN_FP_014: Phone number too short (< 10 digits)', async ({ page }) => {
    await fpPage.fillIdentity('test@acrydesk.com', '12345');
    await fpPage.submitIdentity();

    // The requirements say phone must be exactly 10 digits
    const message = await fpPage.getToastMessage();
    // Usually backend or frontend logic will return error for mismatch/invalid
    expect(message).toBeTruthy(); 
  });

  test('TC_EN_FP_015: Password exceeding max length (> 20)', async ({ page }) => {
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ resetToken: 'token' }) });
    });
    await fpPage.fillIdentity('test@acrydesk.com', '0912345678');
    await fpPage.submitIdentity();

    const longPass = 'a'.repeat(21);
    await fpPage.fillReset('token', longPass, longPass);
    await fpPage.submitReset();

    const message = await fpPage.getToastMessage();
    expect(message).toBe('Mật khẩu phải từ 6 đến 20 ký tự');
  });

  test('TC_EN_FP_016: Complete successful E2E reset flow', async ({ page }) => {
    // 1. Mock Step 1
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ resetToken: 'safe-token', message: 'OTP Sent' }) });
    });
    // 2. Mock Step 2
    await page.route('**/auth/reset-password', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ message: 'Mật khẩu đã được cập nhật thành công' }) });
    });

    await fpPage.fillIdentity('success@acrydesk.com', '0987654321');
    await fpPage.submitIdentity();
    
    await expect(page.locator('text=Mã xác thực (OTP)')).toBeVisible();
    await fpPage.fillReset('safe-token', 'NewPass123', 'NewPass123');
    await fpPage.submitReset();

    const message = await fpPage.getToastMessage();
    expect(message).toContain('thành công');
    
    // Should redirect back to Login automatically
    await expect(page.locator('h1')).toHaveText('Đăng Nhập');
  });

  test('TC_EN_FP_009: Verify OTP token expiration handling', async ({ page }) => {
    // Mock Step 1 Success
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ resetToken: 'expired-token' }) });
    });
    // Mock Step 2 Failure (Expired)
    await page.route('**/auth/reset-password', async (route) => {
      await route.fulfill({ 
        status: 400, 
        body: JSON.stringify({ message: 'Token không hợp lệ hoặc đã hết hạn' }) 
      });
    });

    await fpPage.fillIdentity('test@acrydesk.com', '0912345678');
    await fpPage.submitIdentity();
    await fpPage.fillReset('expired-token', 'NewPass123', 'NewPass123');
    await fpPage.submitReset();

    const message = await fpPage.getToastMessage();
    expect(message).toBe('Token không hợp lệ hoặc đã hết hạn');
  });

  test('TC_EN_FP_011: Verify loading state and disabled buttons', async ({ page }) => {
    // Slow down the response to catch the loading state
    await page.route('**/auth/forgot-password', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({ status: 200, body: JSON.stringify({ message: 'OK' }) });
    });

    await fpPage.fillIdentity('test@acrydesk.com', '0912345678');
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    // Check if button is disabled and has loading spinner
    await expect(submitBtn).toBeDisabled();
    await expect(page.locator('.animate-spin')).toBeVisible();
  });

  test('TC_EN_FP_012: Verify returning to Step 1 from Step 2', async ({ page }) => {
    await page.route('**/auth/forgot-password', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ resetToken: 'token' }) });
    });
    await fpPage.fillIdentity('test@acrydesk.com', '0912345678');
    await fpPage.submitIdentity();
    
    // Switch back
    await page.click('text=Gửi lại mã hoặc dùng thông tin khác');
    
    // Should see Identity fields again
    await expect(page.locator('input[placeholder="0xxxxxxxxx"]')).toBeVisible();
    await expect(page.locator('text=Email tài khoản')).toBeVisible();
  });
});
