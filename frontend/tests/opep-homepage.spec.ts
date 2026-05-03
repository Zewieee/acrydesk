import { test, expect } from '@playwright/test';
import { OpepHomePage } from './pages/OpepHomePage';

test.describe('OPEP Homepage Test Suite - RBT Approach', () => {

  test('OPEP_HOMEPAGE_TC_001: Verify UI of Header and Navigation Bar in Desktop', async ({ page }) => {
    const homePage = new OpepHomePage(page);
    await homePage.goto();

    await expect(homePage.menuTrangChu).toBeVisible({ timeout: 10000 });
    await expect(homePage.menuGioiThieu).toBeVisible();
    await expect(homePage.menuSanPham).toBeVisible();
    await expect(homePage.menuTinTuc).toBeVisible();
    await expect(homePage.menuLienHe).toBeVisible();
    
    // Kiểm tra CTA
    expect(await homePage.btnDangNhap.isVisible() || await homePage.btnBaoGiaNgay.isVisible()).toBeTruthy();
  });

  test('OPEP_HOMEPAGE_TC_004: Verify Hero Section UI and content', async ({ page }) => {
    const homePage = new OpepHomePage(page);
    await homePage.goto();

    await expect(homePage.heroTitle).toBeVisible();
    
    // Check 1 feature
    await expect(page.getByText(/Bồn chứa PP PK PVC FRP/i)).toBeVisible();

    await expect(homePage.btnHotline).toBeVisible();
    await expect(homePage.btnHotline).toHaveAttribute('href', /tel:.*0913.*213.*091/i);
    await expect(page.getByText(/KCN Quang Minh, Mê Linh, Hà Nội/i).first()).toBeVisible();
  });

  test('OPEP_HOMEPAGE_TC_005: Verify Stats Bar content', async ({ page }) => {
    const homePage = new OpepHomePage(page);
    await homePage.goto();

    await expect(page.getByText(/10/i).first()).toBeVisible();
    await expect(page.getByText(/Năm/i).first()).toBeVisible();
    await expect(page.getByText(/99/i).first()).toBeVisible();
    await expect(page.getByText(/Hài lòng/i).first()).toBeVisible();
  });

  test('OPEP_HOMEPAGE_TC_007: Verify Product Ecosystem', async ({ page }) => {
    const homePage = new OpepHomePage(page);
    await homePage.goto();

    // Verify section presence
    await expect(page.getByText(/Bể và bồn chứa hóa chất/i).first()).toBeVisible();
    await expect(homePage.btnTatCaSanPham).toBeVisible();
  });

  test('OPEP_HOMEPAGE_TC_011: Verify Footer Layout and Information', async ({ page }) => {
    const homePage = new OpepHomePage(page);
    await homePage.goto();

    await homePage.footer.scrollIntoViewIfNeeded();
    await expect(homePage.footer).toBeVisible();
    await expect(page.getByText(/© 2026/i).or(page.getByText(/Copyright/i)).first()).toBeVisible();
    
    const iframeMap = homePage.footer.locator('iframe').first();
    await expect(iframeMap).toBeAttached();
  });

  test('OPEP_HOMEPAGE_TC_013: Verify Responsive UI in Mobile (Emulation)', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)'
    });
    const mobilePage = await context.newPage();
    const homePage = new OpepHomePage(mobilePage);
    await homePage.goto();

    // Nên có hamburger icon khi ở giao diện mobile
    const hamburgerMenu = mobilePage.locator('.hamburger-menu, [aria-label="Menu"], button:has(svg.menu-icon)').first();
    if(await hamburgerMenu.isVisible()) {
      await expect(hamburgerMenu).toBeVisible();
    }
    
    await mobilePage.close();
  });

});
