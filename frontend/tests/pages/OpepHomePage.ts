import { Page, Locator } from '@playwright/test';

export class OpepHomePage {
  readonly page: Page;
  
  // Header Elements
  readonly logo: Locator;
  readonly menuTrangChu: Locator;
  readonly menuGioiThieu: Locator;
  readonly menuSanPham: Locator;
  readonly menuTinTuc: Locator;
  readonly menuLienHe: Locator;
  readonly btnDangNhap: Locator;
  readonly btnBaoGiaNgay: Locator;

  // Hero Section
  readonly heroTitle: Locator;
  readonly btnHotline: Locator;

  // About Us
  readonly btnHopTacNgay: Locator;

  // Products
  readonly btnTatCaSanPham: Locator;
  readonly productCards: Locator;

  // Footer
  readonly footer: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Sử dụng text và role vì DOM thực tế có thể thay đổi
    this.logo = page.locator('img[alt*="OPEP"], img.logo, .header-logo').first();
    this.menuTrangChu = page.getByRole('link', { name: 'Trang Chủ', exact: true });
    this.menuGioiThieu = page.getByRole('link', { name: 'Giới Thiệu', exact: true });
    this.menuSanPham = page.getByRole('link', { name: 'Sản Phẩm', exact: true });
    this.menuTinTuc = page.getByRole('link', { name: 'Tin Tức', exact: true });
    this.menuLienHe = page.getByRole('link', { name: 'Liên Hệ', exact: true });
    
    // Nút CTA
    this.btnDangNhap = page.getByRole('button', { name: /Đăng nhập/i }).or(page.getByRole('link', { name: /Đăng nhập/i }));
    this.btnBaoGiaNgay = page.getByRole('button', { name: /Báo giá ngay/i }).or(page.getByRole('link', { name: /Báo giá ngay/i }));

    this.heroTitle = page.getByRole('heading', { name: /CÔNG TY TNHH OPEP VIỆT NAM/i });
    this.btnHotline = page.getByRole('link', { name: /0913 213 091/i });

    this.btnHopTacNgay = page.getByRole('button', { name: /Hợp tác ngay/i }).or(page.getByRole('link', { name: /Hợp tác ngay/i }));

    this.btnTatCaSanPham = page.getByRole('button', { name: /Tất cả sản phẩm/i }).or(page.getByRole('link', { name: /Tất cả sản phẩm/i }));
    this.productCards = page.locator('.product-card, .category-card');

    this.footer = page.locator('footer').or(page.locator('#footer'));
  }

  async goto() {
    await this.page.goto('http://localhost:5173/');
  }
}
