import { test, expect } from '@playwright/test';
import { MessagingPage } from './pages/MessagingPage';
import { LoginPage } from './pages/LoginPage';

test.describe('Messaging System Automation (REAL E2E - Expanded)', () => {
  let msgPage: MessagingPage;
  let loginPage: LoginPage;
  const realRFQ = 'RFQ-2026-021';

  test.beforeEach(async ({ page }) => {
    msgPage = new MessagingPage(page);
    loginPage = new LoginPage(page);
    
    await page.goto('http://localhost:5173/');
    await loginPage.login('manager2@acrydesk.com', '123456');
    await msgPage.navigate();
  });

  test('TC_MSG_001 & 002: Real Room Selection', async ({ page }) => {
    await msgPage.selectRFQ(realRFQ);
    await expect(page.locator(`h3`).filter({ hasText: realRFQ })).toBeVisible();
  });

  test('TC_MSG_003: Real Send Text Message', async ({ page }) => {
    const testMessage = `Auto Test Message ${Date.now()}`;
    await msgPage.selectRFQ(realRFQ);
    await msgPage.sendMessage(testMessage);
    const lastMsg = await msgPage.waitForMessage(testMessage);
    await expect(lastMsg).toBeVisible();
  });

  test('TC_MSG_008: Block Empty Messages', async ({ page }) => {
    await msgPage.selectRFQ(realRFQ);
    const sendBtn = page.locator('button[type="submit"]');
    await expect(sendBtn).toBeDisabled();
    await page.fill('input[placeholder="Nhập tin nhắn..."]', '   ');
    await expect(sendBtn).toBeDisabled();
  });

  test('TC_MSG_006: Real Sidebar Search', async ({ page }) => {
    await msgPage.searchRFQ('021');
    await expect(page.locator('text=RFQ-2026-021')).toBeVisible();
  });

  test('TC_MSG_012: Real File Attachment UX', async ({ page }) => {
    await msgPage.selectRFQ(realRFQ);
    await msgPage.attachFile(['package.json']);
    await expect(page.locator('text=package.json')).toBeVisible();
    await page.locator('button:has(svg.lucide-x)').click();
    await expect(page.locator('text=package.json')).not.toBeVisible();
  });

  test('TC_MSG_013 & 014: Sender/Receiver Style & Identity', async ({ page }) => {
    await msgPage.selectRFQ(realRFQ);
    const testMsg = `Style Check ${Date.now()}`;
    await msgPage.sendMessage(testMsg);
    
    const lastBubble = await msgPage.waitForMessage(testMsg);
    // Sent message (isMe) should be in a div with bg-blue-600
    // ThewaitForMessage returns the bubble. Let's check its parent or class.
    // In our DOM structure, the bubble container has bg-blue-600
    await expect(lastBubble).toHaveClass(/bg-blue-600/);
  });

  test('TC_MSG_021: XSS Sanitization', async ({ page }) => {
    await msgPage.selectRFQ(realRFQ);
    const xssScript = `XSS_TEST_${Date.now()} <script>window.xss=1</script>`;
    await msgPage.sendMessage(xssScript);
    
    const lastMsg = await msgPage.waitForMessage(xssScript);
    await expect(lastMsg).toContainText(xssScript);
  });

  test('TC_MSG_023: Unicode and Emoji Support', async ({ page }) => {
    await msgPage.selectRFQ(realRFQ);
    const unicodeMsg = `Unicode_Emoji_${Date.now()} 🚀🔥 Tiếng Việt 100%`;
    await msgPage.sendMessage(unicodeMsg);
    
    const lastMsg = await msgPage.waitForMessage(unicodeMsg);
    await expect(lastMsg).toContainText(unicodeMsg);
  });

  test('TC_MSG_029: Chat Interface Initialization', async ({ page }) => {
    // Just verify the chat area is loaded
    await expect(page.locator('h2.text-xl:has-text("Trao đổi")').first()).toBeVisible();
    // If an RFQ is auto-selected, that's fine for this app's UX
    const chatContainer = page.locator('.flex-1.flex.flex-col.bg-white');
    await expect(chatContainer).toBeVisible();
  });

  test('TC_MSG_030: Search No Results UI', async ({ page }) => {
    await msgPage.searchRFQ('NON_EXISTENT_QUERY_RANDOM_123');
    await expect(page.locator('text=Không tìm thấy yêu cầu nào')).toBeVisible();
  });

  test('TC_MSG_031: Remove Specific file from multiple pending', async ({ page }) => {
    await msgPage.selectRFQ(realRFQ);
    await msgPage.attachFile(['package.json', 'README.md']);
    
    await expect(page.locator('text=package.json')).toBeVisible();
    await expect(page.locator('text=README.md')).toBeVisible();
    
    await page.locator('button:has(svg.lucide-x)').first().click();
    
    await expect(page.locator('text=package.json')).not.toBeVisible();
    await expect(page.locator('text=README.md')).toBeVisible();
  });

  test('TC_MSG_022: Long Message Handling', async ({ page }) => {
    await msgPage.selectRFQ(realRFQ);
    const longMsg = 'LongMsg_' + 'A'.repeat(100); 
    await msgPage.sendMessage(longMsg);
    
    const lastMsg = await msgPage.waitForMessage(longMsg);
    await expect(lastMsg).toContainText(longMsg);
  });
});
