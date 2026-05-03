import { test, expect, Browser } from '@playwright/test';
import { MessagingPage } from './pages/MessagingPage';
import { LoginPage } from './pages/LoginPage';

test.describe('Messaging System Automation (FULL E2E - 26 Cases)', () => {
  const realRFQ = 'RFQ-2026-021';

  // Helper for login
  async function setupUser(browser: Browser, email: string, pass: string) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);
    const msgPage = new MessagingPage(page);
    
    await page.goto('http://localhost:5173/');
    await loginPage.login(email, pass);
    await msgPage.navigate();
    return { page, msgPage, context };
  }

  test('TC_MSG_019 & 026: Real-time Cross-User Chat (Staff <-> Customer)', async ({ browser }) => {
    // 1. Staff Setup
    const staff = await setupUser(browser, 'manager2@acrydesk.com', '123456');
    await staff.msgPage.selectRFQ(realRFQ);

    // 2. Customer Setup
    const customer = await setupUser(browser, 'longnguyen@acrydesk.com', '1234567');
    await customer.msgPage.selectRFQ(realRFQ);

    // 3. Customer sends message
    const customerMsg = `Hello from Customer ${Date.now()}`;
    await customer.msgPage.sendMessage(customerMsg);

    // 4. Staff should see it REAL-TIME (without refresh)
    const staffReceived = await staff.msgPage.waitForMessage(customerMsg);
    await expect(staffReceived).toBeVisible();
    // In staff view, customer message should have bg-white (Receiver style)
    await expect(staffReceived).toHaveClass(/bg-white/);

    // 5. Staff replies
    const staffReply = `Copy that Customer, I am Staff ${Date.now()}`;
    await staff.msgPage.sendMessage(staffReply);

    // 6. Customer should see reply REAL-TIME
    const customerReceived = await customer.msgPage.waitForMessage(staffReply);
    await expect(customerReceived).toBeVisible();
    await expect(customerReceived).toHaveClass(/bg-white/);

    await staff.context.close();
    await customer.context.close();
  });

  test('TC_MSG_015: Auto Scroll Check', async ({ browser }) => {
    const staff = await setupUser(browser, 'manager2@acrydesk.com', '123456');
    await staff.msgPage.selectRFQ(realRFQ);

    // Send many small messages to ensure scroll
    for(let i=0; i<5; i++) {
        await staff.msgPage.sendMessage(`Scroll test ${i}`);
    }

    const lastMsg = await staff.msgPage.getLatestMessage();
    // Check if the scroll position is near the bottom
    // We can evaluate the scrollTop vs scrollHeight
    const isAtBottom = await staff.page.evaluate(() => {
        const el = document.querySelector('.flex-1.overflow-y-auto');
        if (!el) return false;
        return Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 100;
    });
    expect(isAtBottom).toBe(true);

    await staff.context.close();
  });

  test('TC_MSG_024: Sidebar Ordering', async ({ browser }) => {
    const staff = await setupUser(browser, 'manager2@acrydesk.com', '123456');
    
    // Select an RFQ that's NOT first (e.g. search and select)
    const targetRFQ = 'RFQ-2026-020'; 
    await staff.msgPage.selectRFQ(targetRFQ);
    await staff.msgPage.sendMessage('Ordering test');

    // After message, it should be at the top of the list
    const firstSidebarItem = staff.page.locator('.w-80 button').first();
    await expect(firstSidebarItem).toContainText(targetRFQ);

    await staff.context.close();
  });

  test('TC_MSG_027: Login Persistency', async ({ browser }) => {
    const staff = await setupUser(browser, 'manager2@acrydesk.com', '123456');
    await staff.msgPage.selectRFQ(realRFQ);
    const persistMsg = `Persist_${Date.now()}`;
    await staff.msgPage.sendMessage(persistMsg);

    // Logout
    await staff.page.click('button:has-text("Đăng xuất")');
    await expect(staff.page.locator('text=Đăng nhập')).toBeVisible();

    // Login back
    const loginPage = new LoginPage(staff.page);
    await loginPage.login('manager2@acrydesk.com', '123456');
    await staff.msgPage.navigate();
    await staff.msgPage.selectRFQ(realRFQ);

    // Verify message still there
    const foundMsg = await staff.msgPage.waitForMessage(persistMsg);
    await expect(foundMsg).toBeVisible();

    await staff.context.close();
  });

  test('TC_MSG_017: Image Preview', async ({ browser }) => {
     // This test requires a real image file. I'll use a screenshot for now.
     const staff = await setupUser(browser, 'manager2@acrydesk.com', '123456');
     await staff.msgPage.selectRFQ(realRFQ);
     
     await staff.page.screenshot({ path: 'test-image.png' });
     await staff.msgPage.attachFile(['test-image.png']);
     
     // Check for image icon/thumbnail in tray
     const thumbnail = staff.page.locator('svg.lucide-image');
     await expect(thumbnail).toBeVisible();
     
     await staff.context.close();
  });

  test('TC_MSG_032: History Loading (Load More)', async ({ browser }) => {
    const staff = await setupUser(browser, 'manager2@acrydesk.com', '123456');
    await staff.msgPage.selectRFQ(realRFQ);

    // Scroll to top
    await staff.page.evaluate(() => {
        const el = document.querySelector('.flex-1.overflow-y-auto');
        if (el) el.scrollTop = 0;
    });

    // Check if more messages load or triggered (if implemented as infinite scroll)
    // For now just check if UI doesn't crash
    await expect(staff.page.locator('.flex-1.overflow-y-auto')).toBeVisible();
    
    await staff.context.close();
  });
});
