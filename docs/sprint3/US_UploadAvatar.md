# User Story: Upload Avatar (Tải lên ảnh đại diện)

---

## Card

| | |
|---|---|
| **As a** | Người dùng đã đăng nhập (Staff hoặc Customer) |
| **I want** | Tải lên ảnh đại diện cá nhân từ thiết bị của mình thông qua trang Cài đặt / Hồ sơ cá nhân |
| **So that** | Đồng nghiệp và khách hàng có thể nhận diện tôi dễ dàng trong hệ thống, tạo sự chuyên nghiệp và tin tưởng trong các cuộc trao đổi |

---

## Summary

Tính năng Upload Avatar cho phép người dùng thay thế avatar mặc định (chữ cái đầu tên) bằng ảnh thật. Người dùng vào trang **Cài đặt > Hồ sơ cá nhân**, nhấn vào vùng avatar → chọn ảnh từ thiết bị → hệ thống upload lên server (endpoint `/api/upload`) → lưu URL vào trường `avatarUrl` của User model → hiển thị ảnh mới ngay lập tức trên header, sidebar và toàn bộ hệ thống. Ảnh cũ bị thay thế hoàn toàn.

---

## Scopes

**Upload flow:**
- Click vào vùng avatar hiện tại (hình tròn hoặc chữ cái) → mở file picker
- Chọn file ảnh từ máy (jpg, jpeg, png, webp)
- Preview ảnh ngay trước khi confirm
- Nhấn "Lưu" → upload lên server → cập nhật UI

**Hiển thị avatar:**
- Header: avatar nhỏ (36×36px) thay thế ô chữ cái màu xanh
- Sidebar Staff: avatar nhỏ trong ô thông tin user dưới cùng
- Sidebar Customer: tương tự
- Trang Hồ sơ cá nhân: avatar lớn (96×96px) có overlay "Thay đổi" khi hover
- Chat / Tin nhắn: avatar người gửi (nếu mở rộng sau)

**Xóa/reset avatar:**
- Nút "Xóa ảnh" → reset về avatar mặc định (chữ cái đầu tên)

---

## Out of scope

- Crop / chỉnh sửa ảnh trước khi upload (chọn ảnh trực tiếp)
- Camera trực tiếp từ trình duyệt
- Avatar mặc định từ mạng xã hội (Google, Facebook)
- Upload ảnh nhóm / công ty
- Resize ảnh phía client trước khi upload

---

## Trigger

Nhấn vào vùng avatar trong trang **Cài đặt → Hồ sơ cá nhân** (tab Profile)

---

## Precondition

- Người dùng đã đăng nhập
- Trình duyệt hỗ trợ FileReader API (tất cả browser hiện đại)
- Server `/api/upload` đang hoạt động

---

## Business rule and error message

**BR-01:** Chỉ chấp nhận file ảnh: `image/jpeg`, `image/png`, `image/webp`. Các định dạng khác bị từ chối.

**BR-02:** Kích thước file tối đa: **5MB**. File lớn hơn → hiện thông báo lỗi, không upload.

**BR-03:** Sau khi upload thành công → cập nhật `localStorage['user'].avatarUrl` và re-render ngay lập tức, không cần reload trang.

**BR-04:** `avatarUrl` được lưu vào User model trong MongoDB và trả về trong response của các API xác thực.

**BR-05:** Ảnh được lưu trên server trong thư mục `/uploads/avatars/`. Tên file = `{userId}_{timestamp}.{ext}` để tránh conflict.

**Error message:**
- File không đúng định dạng: *"Chỉ hỗ trợ ảnh JPG, PNG, WEBP"*
- File quá lớn: *"Kích thước ảnh không được vượt quá 5MB"*
- Upload thất bại: *"Không thể tải ảnh lên. Vui lòng thử lại."*

---

## Screen design

**Vùng avatar trong trang Profile:**
> Hình tròn 96×96px ở đầu trang. Mặc định: nền màu (xanh/xanh lá) + chữ cái viết tắt trắng. Khi có avatar: ảnh fill tròn. Hover: overlay tối mờ + icon camera + text "Thay đổi" ở giữa. Cursor pointer.

**File picker:**
> Native file input ẩn, trigger khi click vào vùng avatar.

**Preview modal (tùy chọn):**
> Sau khi chọn ảnh: hiện preview ảnh + 2 nút "Lưu ảnh này" (xanh) và "Chọn lại" (xám).

**Loading state:**
> Trong khi upload: spinner overlay trên avatar + disable nút Lưu.

**Sau khi lưu:**
> Avatar mới hiển thị ngay. Toast: "Cập nhật ảnh đại diện thành công!"

---

## Screen description

| Tên thành phần | Mô tả | Loại | Min | Max | Required |
|---|---|---|---|---|---|
| Avatar container | Vùng hiển thị ảnh đại diện | Image / Div | — | — | — |
| File input | Input ẩn chấp nhận file ảnh | File input | — | — | No |
| Accept types | Định dạng file được phép | Attribute | — | — | jpg, png, webp |
| Max file size | Giới hạn dung lượng | Validation | 0 | 5MB | — |
| Preview | Ảnh xem trước trước khi lưu | Image | — | — | — |
| Upload button | Nút xác nhận lưu ảnh | Button | — | — | — |
| Delete button | Nút xóa ảnh về mặc định | Button | — | — | — |
| avatarUrl | URL ảnh lưu trong DB | String | — | 500 | No |
| Loading spinner | Trạng thái đang upload | Visual | — | — | — |

---

## Acceptance Criteria

1. Nhấn vào vùng avatar trong trang Hồ sơ cá nhân → file picker của trình duyệt mở ra, chỉ cho phép chọn file ảnh (jpg/png/webp).

2. Chọn file ảnh hợp lệ < 5MB → ảnh preview hiển thị ngay trước khi upload.

3. Nhấn "Lưu" → spinner hiển thị trong khi upload. Sau khi thành công → toast "Cập nhật ảnh đại diện thành công!", avatar mới xuất hiện ngay trên header và sidebar mà không reload trang.

4. Chọn file > 5MB → hiện thông báo lỗi "Kích thước ảnh không được vượt quá 5MB", không thực hiện upload.

5. Chọn file `.pdf` hoặc `.txt` → hiện thông báo "Chỉ hỗ trợ ảnh JPG, PNG, WEBP", không mở file picker để chọn thêm.

6. Nhấn "Xóa ảnh" → avatar reset về chữ cái đầu tên, `avatarUrl` bị xóa trong DB.

7. Đăng xuất rồi đăng nhập lại → avatar đã upload vẫn hiển thị đúng.

8. Hai người dùng khác nhau cùng upload ảnh → file được lưu riêng biệt trên server, không ghi đè lên nhau.
