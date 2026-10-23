# Backend Quản Lý Sinh Viên

Hệ thống Backend RESTful API Quản lý Sinh viên hoàn chỉnh xây dựng với **Express 5**, **TypeScript (ESM / NodeNext)**, **Sequelize 6**, **SQL Server**, **Zod**, **JWT**, **Multer**, **Helmet**, **Jest**, **Supertest**, và **Docker**.

---

## 1. Yêu cầu môi trường

- **Node.js**: v20.x hoặc v22.x LTS trở lên
- **Trình quản lý gói**: `pnpm` (khuyến nghị v9 hoặc v10)
- **Cơ sở dữ liệu**: Microsoft SQL Server (2014, 2019 hoặc 2022)
- **Docker & Docker Compose**: (Tùy chọn cho triển khai container)

---

## 2. Cài đặt và cấu hình

1. **Cài đặt các gói thư viện**:
   ```bash
   pnpm install
   ```

2. **Cấu hình biến môi trường**:
   Sao chép tệp mẫu `.env.example` thành `.env` và điền cấu hình thực tế:
   ```bash
   cp .env.example .env
   ```
   *Nội dung mẫu:*
   ```env
   PORT=5000
   NODE_ENV=development
   DB_HOST=127.0.0.1
   DB_PORT=1433
   DB_NAME=QuanLySinhVienDB
   DB_USER=sv_app
   DB_PASSWORD=YourPasswordHere
   DB_ENCRYPT=true
   DB_TRUST_CERT=true
   JWT_SECRET=YourSuperSecretKey123
   ```

3. **Khởi chạy ứng dụng ở môi trường phát triển (Development)**:
   ```bash
   pnpm dev
   ```
   - Server lắng nghe tại: `http://localhost:5000`
   - Tài liệu OpenAPI / Swagger UI: `http://localhost:5000/api-docs`

4. **Biên dịch và chạy môi trường Production**:
   ```bash
   pnpm build
   pnpm start
   ```

---

## 3. Hệ thống kiểm thử tự động (Automated Testing)

Dự án cung cấp bộ kiểm thử toàn diện từ Unit Test, API Test đến kiểm thử nghiệp vụ CSDL thật:

| Lệnh thực thi | Mô tả bộ kiểm thử |
|---|---|
| `pnpm test` | Chạy toàn bộ Unit Tests và API Tests bằng **Jest + Supertest** |
| `pnpm test:coverage` | Chạy kiểm thử và xuất báo cáo độ bao phủ mã nguồn (**Coverage Report**) |
| `pnpm test:security` | Kiểm thử bảo mật: **Helmet Headers** và **Rate Limiter 429** (`S01 - S07`) |
| `pnpm test:pagination` | Kiểm thử phân trang & tìm kiếm SQL Server (`P01 - P17` & `E01 - E10`) |
| `pnpm test:auth` | Kiểm thử xác thực JWT & phân quyền RBAC Student/Admin (`A01 - B12`) |
| `pnpm test:upload` | Kiểm thử Multer Upload ảnh 2MB & kiểm tra Magic Bytes (`U01 - U12`) |

---

## 4. Triển khai với Docker & Docker Compose

Dự án hỗ trợ sẵn `Dockerfile` đa tầng (multi-stage) tối ưu dung lượng và `compose.yaml`:

1. **Khởi chạy toàn bộ hệ thống (Backend + SQL Server 2022)**:
   ```bash
   docker compose up -d --build
   ```

2. **Kiểm tra trạng thái các container**:
   ```bash
   docker compose ps
   ```

3. **Xem nhật ký hoạt động**:
   ```bash
   docker compose logs -f backend
   ```

4. **Dừng hệ thống nhưng bảo toàn dữ liệu (Named Volume)**:
   ```bash
   docker compose down
   ```
   *(Lưu ý: Không dùng cờ `-v` để tránh xóa dữ liệu trong volume)*.

---

## 5. Cấu trúc thư mục dự án

```text
backend-quan-ly-sinh-vien/
├── src/
│   ├── app.ts                 # Cấu hình Express app, middlewares, routes, error handler
│   ├── server.ts              # Entrypoint kết nối CSDL và lắng nghe HTTP Port
│   ├── config/                # Cấu hình Database Sequelize và Swagger UI
│   ├── controllers/           # Tầng điều khiển HTTP request/response
│   ├── middlewares/           # Logger, Helmet, Cors, isAuth, isAdmin, Rate Limit, Error
│   ├── models/                # Định nghĩa Sequelize Models (SinhVien, User, Lop)
│   ├── routes/                # Tuyến đường API (sinhVien.routes, auth.routes)
│   ├── services/              # Tầng nghiệp vụ xử lý dữ liệu và logic
│   ├── utils/                 # AppError, JWT helper
│   └── validations/           # Zod schemas (SinhVien, Auth, Query)
├── tests/
│   ├── smoke.test.ts          # Smoke test cấu hình Jest + ESM
│   ├── unit/login.test.ts     # Unit Test kiểm tra logic Login độc lập với Mock (T01 - T05)
│   └── api/auth.api.test.ts   # API Test Supertest xác thực và hồ sơ (A01 - A07)
├── docs/
│   ├── openapi.yaml           # Đặc tả OpenAPI 3.0.3 hoàn chỉnh
│   ├── prompt-log.md          # Nhật ký Prompt CTCO và phản biện qua các chương
│   ├── test-results.md        # Báo cáo kết quả kiểm thử chi tiết
│   ├── security-report.md     # Báo cáo rà soát an toàn thông tin OWASP
│   ├── sql-optimization.md    # Báo cáo phân tích và tối ưu hóa truy vấn SQL
│   └── deployment-report.md   # Báo cáo triển khai Docker và kiểm chứng bền vững
├── public/uploads/            # Thư mục lưu trữ tệp tĩnh (Ảnh đại diện)
├── frontend/                  # Ứng dụng giao diện Vite + React + TypeScript
├── Dockerfile                 # Multi-stage Dockerfile cho Backend
├── compose.yaml               # Docker Compose file đa dịch vụ
├── jest.config.mjs            # Cấu hình Jest với ts-jest ESM
├── package.json
└── tsconfig.json
```
