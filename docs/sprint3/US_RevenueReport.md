# User Story: Revenue Report (Báo cáo Doanh thu)

---

## Card

| | |
|---|---|
| **As a** | System Administrator (Manager) hoặc Sales Executive |
| **I want** | Xem trang báo cáo doanh thu tổng hợp với KPI cards, biểu đồ xu hướng theo tháng, bảng xếp hạng khách hàng và sản phẩm, có thể lọc theo khoảng thời gian |
| **So that** | Tôi có thể theo dõi hiệu suất kinh doanh, đánh giá tỉ lệ chốt đơn, xác định khách hàng tiềm năng và sản phẩm bán chạy để ra quyết định chiến lược |

---

## Summary

Module Revenue Report là trang phân tích kinh doanh trực quan, được truy cập qua mục **"Báo cáo"** trong sidebar Staff Dashboard. Trang tổng hợp dữ liệu từ bảng Quotations và RFQs hiện có, tính toán và hiển thị các chỉ số quan trọng: tổng doanh thu (từ báo giá đã được khách hàng chấp nhận), giá trị pipeline đang chờ, tỉ lệ chốt đơn, giá trị đơn trung bình, và so sánh tháng hiện tại vs tháng trước. Bộ lọc thời gian cho phép xem theo 3 tháng, 6 tháng, năm nay, hoặc tất cả dữ liệu.

---

## Scopes

**KPI Cards (4 thẻ):**
- Tổng doanh thu: tổng `totalAmount` của các quotation có status `approved` + % tăng/giảm so tháng trước
- Pipeline: tổng giá trị báo giá đang chờ khách duyệt (status `sent`) + số lượng
- Tỉ lệ chốt đơn (Win Rate): `approved / (approved + sent)` × 100%
- Giá trị đơn trung bình: tổng doanh thu / số đơn approved

**Biểu đồ 1 — Doanh thu theo tháng (AreaChart):**
- Trục X: tháng/năm
- Trục Y: giá trị (đồng), format tự động (tr / tỷ)
- 2 đường: Đã chốt (xanh lá) và Pipeline (vàng, nét đứt)
- Tooltip chi tiết khi hover

**Biểu đồ 2 — RFQ mới vs Đơn chốt (BarChart):**
- So sánh số lượng RFQ tạo mới (cột xám) vs báo giá được duyệt (cột xanh) mỗi tháng

**Bảng xếp hạng — Top 6 khách hàng:**
- Xếp theo doanh thu giảm dần
- Hiển thị: số thứ tự màu, tên khách, số đơn, doanh thu, thanh progress tương đối

**Bảng xếp hạng — Top 6 sản phẩm bán chạy:**
- Xếp theo tổng số lượng từ các RFQ approved/completed
- Hiển thị: số thứ tự, tên sản phẩm, số đơn, tổng số lượng, thanh progress

**Bộ lọc thời gian:**
- 3 tháng / 6 tháng / Năm nay / Tất cả
- Khi đổi bộ lọc → tất cả biểu đồ và bảng cập nhật ngay

---

## Out of scope

- Export báo cáo ra PDF hoặc Excel (sprint sau)
- Báo cáo doanh thu theo nhân viên phụ trách
- So sánh nhiều khoảng thời gian cùng lúc
- Báo cáo tồn kho vật tư
- Dữ liệu real-time (cập nhật mỗi lần render, không polling)

---

## Trigger

Nhấn mục **"Báo cáo"** (icon BarChart) trong sidebar của Staff Dashboard

---

## Precondition

- Người dùng đăng nhập với role `sales` hoặc `manager`
- Hệ thống đã có ít nhất một Quotation có status `approved` hoặc `sent` trong khoảng thời gian được chọn để biểu đồ có dữ liệu

---

## Business rule and error message

**BR-01:** "Doanh thu" chỉ tính từ Quotation có `status = 'approved'` (khách hàng đã chấp nhận báo giá).

**BR-02:** "Pipeline" tính từ Quotation có `status = 'sent'` (đã gửi, chờ khách duyệt).

**BR-03:** "Top sản phẩm" tính từ `items` của các RFQ có `status = 'approved'` hoặc `'completed'`.

**BR-04:** % tăng trưởng tháng này = `(tháng này - tháng trước) / tháng trước × 100`. Nếu tháng trước = 0 → không hiển thị badge tăng trưởng.

**BR-05:** Khi không có dữ liệu trong khoảng lọc → hiển thị placeholder "Chưa có dữ liệu trong khoảng thời gian này" thay vì biểu đồ trống gây lỗi.

**Error message:** Không có error message hiển thị người dùng vì dữ liệu được tính từ state local; nếu state rỗng → hiển thị empty state tương ứng.

---

## Screen design

**Vùng header:**
> Tiêu đề "Báo cáo Doanh thu" + subtitle. Bên phải: 4 nút filter thời gian dạng pill, nút active màu xanh nổi bật.

**KPI row:**
> 4 card nằm ngang, mỗi card: icon trong ô màu pastel góc phải, số liệu lớn in đậm, nhãn nhỏ, badge % tăng/giảm (xanh/đỏ + icon mũi tên).

**AreaChart:**
> Card rộng full, chiều cao 288px. Legend dưới biểu đồ: "Đã chốt" (xanh) và "Pipeline" (vàng nét đứt). Tooltip bo tròn hiện giá trị định dạng tiền Việt.

**BarChart:**
> Card rộng full, chiều cao 208px. Cột xám = RFQ mới, cột xanh = Đơn chốt. Bo tròn đầu cột.

**2 bảng xếp hạng (grid 2 cột):**
> Mỗi bảng: tiêu đề + 6 hàng. Mỗi hàng: badge số thứ tự màu, tên, thông tin phụ, giá trị, thanh progress mảnh bên dưới.

---

## Screen description

| Tên thành phần | Mô tả | Loại | Ghi chú |
|---|---|---|---|
| Time range filter | Bộ lọc thời gian | Button group | 4 tùy chọn: 3m / 6m / 1y / all |
| KPI - Tổng doanh thu | Tổng giá trị approved quotations | Computed | Format: tỷ/triệu đồng |
| KPI - Pipeline | Tổng giá trị sent quotations | Computed | — |
| KPI - Win Rate | Tỉ lệ chốt đơn (%) | Computed | approved / (approved + sent) |
| KPI - Giá trị TB | Doanh thu / số đơn approved | Computed | — |
| Growth badge | % thay đổi so tháng trước | Badge | Xanh = tăng, Đỏ = giảm |
| AreaChart | Biểu đồ doanh thu theo tháng | Chart | Recharts AreaChart |
| BarChart | Số RFQ mới vs Đơn chốt | Chart | Recharts BarChart |
| Top customers table | Bảng 6 khách hàng doanh thu cao nhất | List | Kèm progress bar |
| Top products table | Bảng 6 sản phẩm số lượng cao nhất | List | Kèm progress bar |

---

## Acceptance Criteria

1. Nhấn "Báo cáo" trong sidebar → trang load trong < 1 giây vì tính từ dữ liệu đã có sẵn.

2. KPI "Tổng doanh thu" hiển thị đúng tổng `totalAmount` của tất cả quotation có `status = 'approved'` trong khoảng thời gian lọc.

3. Chuyển bộ lọc từ "Năm nay" sang "3 tháng" → tất cả 4 KPI, 2 biểu đồ và 2 bảng xếp hạng cập nhật đồng thời mà không cần tải lại trang.

4. Khi tháng trước có doanh thu và tháng này tăng → badge màu xanh hiển thị đúng % tăng trưởng. Khi giảm → badge màu đỏ.

5. Hover vào đường biểu đồ tháng bất kỳ → tooltip hiển thị giá trị "Đã chốt" và "Pipeline" định dạng số tiền Việt đúng.

6. Bảng "Top khách hàng" xếp đúng thứ tự giảm dần theo doanh thu, thanh progress của khách hàng #1 luôn = 100%.

7. Khi không có dữ liệu nào trong khoảng thời gian được chọn → biểu đồ hiển thị placeholder text, không bị lỗi render.

8. Manager và Sales đều truy cập được trang Báo cáo; role khác không thấy mục này trong sidebar.
