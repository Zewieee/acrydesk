# User Story: Global Search (Tìm kiếm toàn cục)

---

## Card

| | |
|---|---|
| **As a** | System Administrator (Manager) hoặc Internal Staff (Sales / Engineer) |
| **I want** | Tìm kiếm nhanh bất kỳ yêu cầu báo giá, khách hàng hoặc báo giá nào từ một thanh tìm kiếm trung tâm, có thể truy cập từ mọi trang trong dashboard bằng phím tắt `Ctrl+K` / `⌘K` |
| **So that** | Tôi không cần phải nhớ đang ở tab nào hoặc điều hướng qua nhiều màn hình để tìm một bản ghi cụ thể, giúp tiết kiệm thời gian và tăng hiệu suất xử lý đơn hàng |

---

## Summary

Module Global Search cung cấp một modal tìm kiếm trung tâm (Command Palette) hoạt động trên toàn bộ Staff Dashboard. Người dùng có thể kích hoạt bằng phím tắt `Ctrl+K` hoặc nhấn nút Search trên header. Kết quả tìm kiếm được phân nhóm theo 3 loại: Yêu cầu báo giá (RFQ), Khách hàng, và Báo giá — tìm kiếm trực tiếp trên dữ liệu đã load trong bộ nhớ (không gọi thêm API). Người dùng có thể dùng phím mũi tên để điều hướng và Enter để chọn kết quả, sau đó hệ thống tự điều hướng đến đúng trang và mở bản ghi được chọn.

---

## Scopes

**Phạm vi tìm kiếm — Yêu cầu báo giá:**
- Tìm theo: mã RFQ, tên khách hàng, loại sản phẩm
- Kết quả hiển thị: mã RFQ, tên khách hàng + sản phẩm, badge trạng thái
- Hành động: click → chuyển sang tab "Yêu cầu báo giá" + mở modal chi tiết RFQ

**Phạm vi tìm kiếm — Khách hàng:**
- Tìm theo: tên, email, số điện thoại
- Kết quả hiển thị: tên khách hàng, email, số lượng yêu cầu
- Hành động: click → chuyển sang tab "Khách hàng" + lọc sẵn theo tên/email

**Phạm vi tìm kiếm — Báo giá:**
- Tìm theo: mã RFQ liên kết, tên khách hàng
- Kết quả hiển thị: mã RFQ, tên khách hàng, tổng tiền, trạng thái
- Hành động: click → chuyển sang tab "Báo giá"

**Điều hướng bàn phím:**
- `↑` / `↓`: di chuyển giữa các kết quả
- `Enter`: chọn kết quả đang active
- `Esc`: đóng modal
- `Ctrl+K` / `⌘K`: mở modal từ bất kỳ đâu

---

## Out of scope

- Tìm kiếm trong nội dung tin nhắn chat
- Tìm kiếm trong thông báo (notifications)
- Tìm kiếm trên màn hình Customer Dashboard (chỉ áp dụng Staff Dashboard)
- Lưu lịch sử tìm kiếm gần đây
- Tìm kiếm mờ (fuzzy search) — chỉ hỗ trợ substring match

---

## Trigger

- Nhấn phím tắt `Ctrl+K` (Windows/Linux) hoặc `⌘K` (macOS) từ bất kỳ trang nào trong Staff Dashboard
- Nhấn vào nút Search hình chữ nhật trên header (hiển thị trên màn hình ≥ 768px)
- Nhấn icon kính lúp trên header (màn hình mobile < 768px)

---

## Precondition

- Người dùng phải đang đăng nhập với role là `sales`, `engineer`, hoặc `manager`
- Dữ liệu RFQ và báo giá phải đã được tải (sau khi dashboard mount)

---

## Business rule and error message

**BR-01:** Kết quả tối đa hiển thị là 10 items (mỗi nhóm không giới hạn riêng, tổng ≤ 10).

**BR-02:** Tìm kiếm thực hiện ngay khi người dùng gõ (no debounce) vì tìm trong bộ nhớ.

**BR-03:** Kết quả phân nhóm theo thứ tự: RFQ → Khách hàng → Báo giá.

**BR-04:** Hover chuột lên kết quả cũng cập nhật item đang active (đồng bộ với điều hướng bàn phím).

**BR-05:** Khi query rỗng → hiển thị màn hình gợi ý ("Nhập để tìm kiếm..."), không hiển thị kết quả.

**Error message:** Khi không tìm thấy kết quả → hiển thị: *"Không tìm thấy kết quả cho '[query]'"*

---

## Screen design

**Trạng thái rỗng (chưa gõ):**
> Modal trắng rộng 672px, có thanh input ở trên với icon kính lúp. Phần body hiển thị icon kính lúp mờ + text "Nhập để tìm kiếm RFQ, khách hàng, báo giá..."

**Trạng thái có kết quả:**
> Chia nhóm bằng header nhỏ (icon + label "Yêu cầu báo giá", "Khách hàng", "Báo giá"). Mỗi kết quả: icon vuông 32px bên trái, title in đậm, subtitle mờ, badge trạng thái bên phải. Item active có nền xanh nhạt + icon mũi tên phải.

**Footer:**
> Thanh mỏng ở dưới: `↑↓ Di chuyển` | `Enter Chọn` | `Esc Đóng`

**Nút trigger trên header:**
> Hình chữ nhật màu slate-100, rộng 224px, text "Tìm kiếm..." + badge `⌘K` bên phải

---

## Screen description

| Tên thành phần | Mô tả | Loại | Min | Max | Required |
|---|---|---|---|---|---|
| Search input | Ô nhập từ khóa tìm kiếm | Text input | 0 | 100 | No |
| Result group header | Nhãn phân nhóm (icon + label) | Label | — | — | — |
| Result item - title | Tên chính của kết quả (mã RFQ / tên KH) | Text | — | — | — |
| Result item - subtitle | Thông tin phụ | Text | — | — | — |
| Result item - badge | Trạng thái / số lượng yêu cầu | Badge | — | — | — |
| Active indicator | Nền xanh nhạt + icon mũi tên | Visual | — | — | — |
| Empty state | Thông báo không có kết quả | Text | — | — | — |
| Footer shortcuts | Hướng dẫn phím tắt | Legend | — | — | — |

---

## Acceptance Criteria

1. Nhấn `Ctrl+K` từ tab "Báo giá" → modal tìm kiếm mở ngay lập tức, con trỏ focus vào input.

2. Gõ "RFQ-2025" → hiển thị tất cả RFQ có mã chứa chuỗi đó, phân nhóm đúng mục "Yêu cầu báo giá".

3. Gõ tên khách hàng "Nguyễn" → hiển thị cả kết quả RFQ lẫn Khách hàng có tên phù hợp.

4. Nhấn `↓` 2 lần → item thứ 3 được highlight. Nhấn `Enter` → modal đóng, hệ thống điều hướng đến đúng tab và mở bản ghi tương ứng.

5. Click kết quả loại "Khách hàng" → chuyển sang tab Khách hàng, ô tìm kiếm trong trang đó được điền sẵn tên/email khách hàng đó.

6. Click kết quả loại "RFQ" → chuyển sang tab Yêu cầu báo giá, modal chi tiết RFQ mở ra.

7. Gõ chuỗi không khớp bất kỳ dữ liệu nào → hiển thị thông báo "Không tìm thấy kết quả cho 'xyz'", không có lỗi.

8. Nhấn `Esc` → modal đóng, người dùng quay lại đúng trang đang xem trước đó.
