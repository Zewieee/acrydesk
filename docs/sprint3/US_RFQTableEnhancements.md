# User Story: RFQ Table Enhancements (Deadline, Sort, Export)

---

## Card

| | |
|---|---|
| **As a** | Internal Staff (Sales / Engineer / Manager) |
| **I want** | Xem deadline của từng đơn hàng ngay trong bảng yêu cầu báo giá kèm cảnh báo màu sắc, sắp xếp bảng theo bất kỳ cột nào, và xuất toàn bộ danh sách ra file Excel |
| **So that** | Tôi có thể ưu tiên xử lý các đơn sắp đến hạn, tìm kiếm dữ liệu nhanh hơn, và chia sẻ báo cáo với quản lý mà không cần thao tác thủ công |

---

## Summary

Module RFQ Table Enhancements bổ sung 3 tính năng vào bảng Yêu cầu báo giá trong Staff Dashboard: (1) Cột **Deadline** hiển thị `expectedDate` của từng RFQ kèm badge màu cảnh báo theo mức độ khẩn cấp; (2) **Sort cột** — người dùng có thể click vào tiêu đề cột để sắp xếp tăng/giảm dần, click lần 2 đảo chiều; (3) Nút **Xuất Excel** tải file `.csv` (mở được bằng Microsoft Excel) chứa toàn bộ danh sách đang hiển thị (sau khi đã lọc). Tất cả tính năng hoạt động phía frontend, không cần API mới.

---

## Scopes

**Tính năng 1 — Cột Deadline:**
- Hiển thị `expectedDate` dưới dạng badge màu trong cột mới "Deadline"
- Badge đỏ + chữ "Trễ Xd": đã quá hạn (X = số ngày trễ)
- Badge đỏ nhấp nháy + chữ "Hôm nay!": đến hạn trong ngày
- Badge vàng + chữ "Còn Xd": còn ≤ 3 ngày
- Badge xám + ngày bình thường: còn > 3 ngày
- Dấu "—" xám: không có deadline
- Vị trí: cột thứ 7 (giữa "Ngày tạo" và "Thao tác")

**Tính năng 2 — Sort cột:**
- Các cột có thể sort: Mã RFQ, Khách hàng, Trạng thái, Ngày tạo, Deadline
- Các cột không sort: Sản phẩm, Số lượng, Thao tác
- Icon mặc định `⇅` (hai chiều) trên cột chưa sort
- Icon `▲` (xanh) khi sort tăng dần, `▼` (xanh) khi sort giảm dần
- Click cột đang sort → đảo chiều; click cột khác → reset về tăng dần
- Mặc định sort theo "Ngày tạo" giảm dần (mới nhất lên đầu)
- Khi sort thay đổi → reset về trang 1

**Tính năng 3 — Xuất Excel (CSV):**
- Nút "Xuất Excel" trong header bảng, bên trái nút "Tạo yêu cầu mới"
- Xuất dữ liệu đang hiển thị sau khi lọc (không phải toàn bộ 100 RFQ)
- Thứ tự cột xuất: Mã RFQ, Khách hàng, SĐT, Email, Sản phẩm, Tổng SL, Trạng thái, Ngày tạo, Deadline
- Tên file: `RFQ_DD-MM-YYYY.csv` (ngày xuất)
- Encoding UTF-8 có BOM để Excel hiển thị đúng tiếng Việt

---

## Out of scope

- Export ra định dạng `.xlsx` (chỉ hỗ trợ `.csv`)
- Export dữ liệu từ các tab Khách hàng hoặc Báo giá
- Sort nhiều cột cùng lúc (multi-column sort)
- Lưu trạng thái sort vào localStorage
- Highlight hàng sắp đến deadline trong dashboard tổng quan

---

## Trigger

- **Cột Deadline:** tự động hiển thị khi vào tab "Yêu cầu báo giá"
- **Sort:** click vào tiêu đề cột bất kỳ có icon sort
- **Export:** nhấn nút "Xuất Excel" trong header bảng

---

## Precondition

- Người dùng đăng nhập với role `sales`, `engineer`, hoặc `manager`
- Đang ở tab "Yêu cầu báo giá" trong Staff Dashboard
- Dữ liệu RFQ đã được tải thành công

---

## Business rule and error message

**BR-01 (Deadline):** Ngưỡng cảnh báo: < 0 ngày = trễ hạn (đỏ); = 0 ngày = hôm nay (đỏ nhấp nháy); 1–3 ngày = sắp hạn (vàng); > 3 ngày = bình thường (xám).

**BR-02 (Deadline):** RFQ không có `expectedDate` → hiển thị "—", không tính vào sort deadline (xếp cuối).

**BR-03 (Sort):** Sort theo chuỗi dùng `localeCompare()` để so sánh đúng tiếng Việt có dấu.

**BR-04 (Sort):** Phân trang reset về trang 1 mỗi khi thay đổi cột sort hoặc chiều sort.

**BR-05 (Export):** File CSV có BOM (`﻿`) ở đầu để Excel tự nhận encoding UTF-8, tránh lỗi chữ Việt thành ký tự lạ.

**BR-06 (Export):** Giá trị chứa dấu phẩy hoặc dấu nháy kép phải được bao trong `"..."` và escape theo chuẩn CSV (dấu `"` nội bộ nhân đôi thành `""`).

**Error message:** Không có thông báo lỗi — nếu danh sách rỗng thì file CSV chỉ chứa dòng header.

---

## Screen design

**Header bảng (cập nhật):**
> Hàng nút: [Làm mới] [Xuất Excel 📥] [Tạo yêu cầu mới +]. Nút "Xuất Excel" viền xám, hover nền xám nhạt.

**Tiêu đề cột có sort:**
> Flex row: text cột + icon sort bên phải. Hover → text chuyển màu xanh. Cursor pointer. Cột đang sort: icon xanh ▲ hoặc ▼.

**Badge Deadline trong row:**
> Pill nhỏ bo tròn 8px: [icon lịch 11px] [text]. Màu: đỏ/vàng/xám tùy mức độ. Badge "Hôm nay!" có class `animate-pulse`.

---

## Screen description

| Tên thành phần | Mô tả | Loại | Min | Max | Required |
|---|---|---|---|---|---|
| Nút Xuất Excel | Trigger xuất file CSV | Button | — | — | — |
| Cột Deadline | Badge hiển thị expectedDate | Table column | — | — | No |
| Badge deadline | Thẻ màu cảnh báo | Badge | — | — | — |
| Sort icon | Icon chỉ chiều sort | Icon | — | — | — |
| Sort key | Cột đang được sort | State | — | — | — |
| Sort direction | Chiều sort: asc / desc | State | — | — | — |
| CSV filename | Tên file khi download | Text | — | — | — |
| CSV columns | 9 cột dữ liệu xuất ra | Array | — | — | — |

---

## Acceptance Criteria

1. Bảng RFQ hiển thị cột "Deadline" ở vị trí thứ 7. RFQ có `expectedDate` hôm qua → badge đỏ "Trễ 1d". RFQ có `expectedDate` ngày mai → badge vàng "Còn 1d". RFQ không có `expectedDate` → hiển thị "—".

2. Click tiêu đề cột "Khách hàng" → danh sách sắp xếp A–Z theo tên khách hàng, icon ▲ xuất hiện bên cạnh tiêu đề cột. Click lần 2 → sắp xếp Z–A, icon chuyển thành ▼.

3. Click tiêu đề cột "Deadline" → RFQ có deadline gần nhất lên đầu, RFQ không có deadline xuống cuối.

4. Khi đang ở trang 3, click sort → tự động quay về trang 1.

5. Nhấn "Xuất Excel" khi đang lọc trạng thái "Chờ xử lý" → file CSV chỉ chứa các RFQ đang lọc, không bao gồm các trạng thái khác.

6. Mở file CSV bằng Microsoft Excel → tiếng Việt hiển thị đúng, không bị lỗi ký tự. Có đủ 9 cột đúng thứ tự.

7. Tên file download đúng định dạng: `RFQ_05-05-2026.csv` (ngày xuất thực tế).

8. Danh sách rỗng (sau khi lọc không có kết quả) → nhấn Xuất Excel vẫn tải được file CSV chỉ có dòng header.
