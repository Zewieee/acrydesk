# User Story: AI Chatbot (Trợ lý ảo AI)

---

## Card

| | |
|---|---|
| **As a** | Khách truy cập trang chủ (Visitor) hoặc Khách hàng tiềm năng |
| **I want** | Trò chuyện với trợ lý ảo AI của OPEP ngay trên trang chủ để hỏi về sản phẩm, báo giá và dịch vụ mà không cần đăng ký tài khoản |
| **So that** | Tôi nhận được câu trả lời ngay lập tức bất kể giờ giấc, thay vì phải chờ nhân viên phản hồi, giúp tôi ra quyết định liên hệ hoặc gửi yêu cầu báo giá nhanh hơn |

---

## Summary

Module AI Chatbot là một widget chat nổi góc phải dưới trang chủ (`Home.tsx`), tích hợp API AI (Claude / OpenAI) để trả lời các câu hỏi liên quan đến sản phẩm và dịch vụ của OPEP Việt Nam. Chatbot được khởi động với lời chào mặc định và 3 gợi ý nhanh ("Tìm hiểu sản phẩm", "Yêu cầu báo giá", "Liên hệ tư vấn"). Người dùng có thể gõ câu hỏi tự do hoặc nhấn các option chip. Hội thoại được giữ nguyên trong phiên làm việc (session state). Chatbot không yêu cầu đăng nhập và không lưu lịch sử vào database.

---

## Scopes

**Widget UI:**
- Icon chat nổi góc phải dưới (fixed, z-index cao)
- Click icon → mở cửa sổ chat (320×480px)
- Click X → đóng, lưu trạng thái cuộc hội thoại trong session
- Animation: slide-up khi mở, fade khi đóng

**Tin nhắn bot:**
- Bong bóng màu xám nhạt, căn trái
- Avatar icon bot (Robot)
- Typing indicator ("..." nhấp nháy) khi đang xử lý

**Tin nhắn user:**
- Bong bóng màu xanh, căn phải
- Avatar icon user

**Quick options (chip):**
- Xuất hiện sau một số tin nhắn bot
- Tối đa 3 chips mỗi lần
- Click chip = gửi tin nhắn đó

**Input area:**
- Ô nhập văn bản + nút Gửi (icon mũi tên)
- Enter để gửi, Shift+Enter xuống dòng
- Disable khi đang chờ phản hồi AI

**Context AI:**
- Chatbot được cung cấp system prompt mô tả OPEP là ai, làm gì, sản phẩm gì
- Lịch sử cuộc hội thoại được gửi kèm mỗi request để AI nhớ context
- Fallback khi AI lỗi: hiện số hotline và email OPEP

---

## Out of scope

- Chatbot trong Staff Dashboard hoặc Customer Dashboard
- Lưu lịch sử chat vào database
- Chatbot phân tích đơn hàng / trạng thái đơn của khách (cần đăng nhập)
- Hỗ trợ gửi file / ảnh trong chat
- Chuyển cuộc hội thoại sang nhân viên thật (live handoff)
- Đa ngôn ngữ (chỉ hỗ trợ tiếng Việt)

---

## Trigger

Nhấn icon bong bóng chat (MessageCircle) cố định ở góc phải dưới trang chủ

---

## Precondition

- Người dùng đang xem trang chủ (`/` hoặc Home page)
- Không yêu cầu đăng nhập
- API AI (backend endpoint `/api/ai/chat`) phải hoạt động và có API key hợp lệ

---

## Business rule and error message

**BR-01:** Tin nhắn user tối đa **500 ký tự** mỗi lần gửi. Vượt quá → hiện counter đỏ, disable nút Gửi.

**BR-02:** Lịch sử tối đa **20 tin nhắn gần nhất** được gửi kèm context để tránh vượt token limit.

**BR-03:** Trong khi chờ phản hồi AI → input bị disable, nút Gửi thành spinner.

**BR-04:** Nếu API AI trả về lỗi (network/timeout/API key) → hiện fallback message cố định: *"Xin lỗi, tôi đang gặp một chút vấn đề về kết nối. Bạn vui lòng thử lại sau hoặc gọi Hotline 0913 213 091 nhé!"*

**BR-05:** System prompt nhúng thông tin OPEP: tên công ty, địa chỉ, sản phẩm chính, số điện thoại, email để AI trả lời đúng ngữ cảnh.

**BR-06:** Chatbot KHÔNG được đưa ra giá chính xác — chỉ hướng dẫn khách gửi yêu cầu báo giá qua hệ thống.

**Error message:**
- Tin nhắn quá dài: *"Tin nhắn không được vượt quá 500 ký tự"*
- Lỗi kết nối AI: message fallback kèm hotline (xem BR-04)

---

## Screen design

**Widget đóng:**
> Icon MessageCircle màu xanh, nền xanh đậm, shadow lớn, fixed bottom-6 right-6. Kích thước 56×56px. Không có badge số.

**Widget mở:**
> Cửa sổ 320×480px, bo tròn 16px. Header: nền xanh đậm, icon bot, "Trợ lý OPEP AI", dot xanh "Online", nút X. Body: scroll dọc, nền trắng. Footer: ô input + nút gửi xanh.

**Tin nhắn chào mừng:**
> Bong bóng xám: "Xin chào! Tôi là trợ lý ảo AI của OPEP. Tôi có thể giúp gì cho bạn hôm nay?" + 3 chip: [Tìm hiểu sản phẩm] [Yêu cầu báo giá] [Liên hệ tư vấn]

**Typing indicator:**
> Bong bóng xám nhỏ với 3 chấm nhấp nháy theo animation `bounce`.

---

## Screen description

| Tên thành phần | Mô tả | Loại | Min | Max | Required |
|---|---|---|---|---|---|
| Chat widget button | Nút mở/đóng cửa sổ chat | Button | — | — | — |
| Chat window | Cửa sổ hội thoại | Panel | 320px | 320px | — |
| Message input | Ô nhập tin nhắn | Textarea | 1 | 500 ký tự | Yes |
| Send button | Gửi tin nhắn | Button | — | — | — |
| Bot message | Tin nhắn từ AI | Chat bubble | — | — | — |
| User message | Tin nhắn từ người dùng | Chat bubble | — | — | — |
| Quick options | Chip gợi ý trả lời nhanh | Button group | 0 | 3 chips | No |
| Typing indicator | Animation đang xử lý | Visual | — | — | — |
| Chat history | Danh sách tin nhắn trong session | Array | 0 | 20 messages | — |
| Fallback message | Tin nhắn lỗi kèm hotline | Text | — | — | — |

---

## Acceptance Criteria

1. Icon chat xuất hiện cố định góc phải dưới trang chủ, không che khuất nội dung quan trọng. Nhấn → cửa sổ chat mở với animation mượt.

2. Cửa sổ chat hiển thị tin nhắn chào mặc định + 3 chip gợi ý khi mở lần đầu.

3. Nhấn chip "Tìm hiểu sản phẩm" → tin nhắn đó được gửi đi, typing indicator hiển thị, sau < 5 giây AI phản hồi nội dung liên quan đến danh mục sản phẩm OPEP.

4. Gõ câu hỏi tự do "Bồn nhựa PE 500L giá bao nhiêu?" → AI không đưa ra giá cụ thể mà hướng dẫn gửi yêu cầu báo giá.

5. Trong khi đang chờ AI phản hồi → input bị disable, nút Gửi hiện spinner, typing indicator nhấp nháy.

6. Đóng cửa sổ chat rồi mở lại (trong cùng session) → lịch sử hội thoại vẫn còn, không reset.

7. Gõ > 500 ký tự → counter đỏ hiện số ký tự vượt, nút Gửi bị disable.

8. Khi API AI bị lỗi → hiện đúng fallback message kèm số hotline 0913 213 091, chatbot không bị crash.

9. Nhấn X → cửa sổ đóng. Icon chat vẫn hiển thị. Nhấn lại → hội thoại cũ còn nguyên.
