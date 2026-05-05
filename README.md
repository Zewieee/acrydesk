# AcryDesk — OPEP Quotation Management System

Hệ thống quản lý báo giá và đơn hàng dành cho **Công Ty TNHH OPEP Việt Nam** — nhà sản xuất thiết bị nhựa kỹ thuật và hệ thống xử lý khí thải công nghiệp.

---

## Tính năng chính

### Dành cho Khách hàng
- Gửi yêu cầu báo giá (RFQ) với đính kèm bản vẽ/file
- Xem và phê duyệt / từ chối báo giá nhận được
- Theo dõi tiến độ sản xuất đơn hàng theo thời gian thực
- Trao đổi trực tiếp với nhân viên qua chat
- Tải báo giá đã duyệt ra file PDF
- Đánh giá dịch vụ sau khi hoàn thành
- Kho lưu trữ tài liệu đính kèm

### Dành cho Nhân viên (Sales / Engineer / Manager)
- Quản lý toàn bộ yêu cầu báo giá với sort, filter, phân trang
- Tạo và gửi báo giá cho khách hàng
- Kanban board quản lý tiến độ sản xuất (10 giai đoạn)
- Báo cáo doanh thu: KPI, biểu đồ xu hướng, top khách hàng
- Tìm kiếm toàn cục (Ctrl+K) trên RFQ, khách hàng, báo giá
- Xuất danh sách RFQ ra file Excel (CSV)
- Cột Deadline với cảnh báo màu sắc (trễ hạn, sắp hạn)
- Quản lý tài khoản nhân viên (Manager)

### Hệ thống
- Thông báo realtime (Socket.IO): tiến độ SX, tin nhắn mới, RFQ mới
- AI Chatbot trên trang chủ (Groq Llama 3.1 / Gemini fallback)
- Xác thực JWT với tự động refresh token (mutex)
- Upload file đính kèm (bản vẽ, hợp đồng)

---

## Tech Stack

| Lớp | Công nghệ |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express 5, TypeScript |
| Database | MongoDB (Mongoose) |
| Realtime | Socket.IO |
| Auth | JWT (Access Token 15m + Refresh Token 7d) |
| Charts | Recharts |
| AI | Groq (Llama 3.1 8B) / Google Gemini fallback |
| PDF Export | jsPDF + jspdf-autotable |

---

## Cài đặt & Chạy dự án

### Yêu cầu
- Node.js >= 18
- MongoDB (local hoặc Atlas)

### 1. Clone repository

```bash
git clone https://github.com/Zewieee/acrydesk.git
cd acrydesk
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `backend/.env`:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key   # optional
```

Chạy backend:

```bash
npm run dev
```

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
```

Tạo file `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SOCKET_URL=http://localhost:3000
```

Chạy frontend:

```bash
npm run dev
```

Mở trình duyệt tại: **http://localhost:5173**

---

## Cấu trúc dự án

```
acrydesk/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Logic xử lý request
│   │   ├── models/          # MongoDB schemas
│   │   ├── routes/          # API routes
│   │   └── middleware/      # Auth middleware
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, CustomerDashboard, Home, Catalog
│   │   ├── components/      # GlobalSearch, RevenueReport, Chatbot, ...
│   │   ├── api/             # Axios API calls
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Helpers (PDF export, file URL)
│   └── package.json
│
├── postman/                 # API documentation
├── links.txt                # Link tham chiếu mã nguồn
└── README.md
```

---

## Tài khoản mặc định (Demo)

| Role | Email | Password |
|---|---|---|
| Manager | manager3@acrydesk.com | 123456 |
| Sales | sales@acrydesk.com | 123456 |
| Engineer | engineer@acrydesk.com | 123456 |
| Customer | Đăng ký tài khoản mới | — |

> Email nhân viên phải có định dạng `@acrydesk.com`

---

## API Endpoints chính

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/register` | Đăng ký khách hàng |
| GET | `/api/requests` | Danh sách RFQ |
| POST | `/api/requests` | Tạo RFQ mới |
| PATCH | `/api/requests/:id/production-stage` | Cập nhật tiến độ SX |
| GET | `/api/quotations` | Danh sách báo giá |
| POST | `/api/quotations` | Tạo báo giá |
| PATCH | `/api/quotations/:id/send` | Gửi báo giá cho KH |
| GET | `/api/messages/:requestId` | Lịch sử chat |
| GET | `/api/notifications` | Danh sách thông báo |
| POST | `/api/ai/chat` | AI Chatbot |

---

## Liên hệ

**Công Ty TNHH OPEP Việt Nam**
- Địa chỉ: Số 70, Nghách 109, Ngõ 156 Đường Tam Trinh, P. Hoàng Mai, Hà Nội
- Hotline: 0913 213 091 | (024) 2219 6916
- Email: opepvn1@gmail.com
- Website: [opep.com.vn](https://opep.com.vn)
