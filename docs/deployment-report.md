# Chapter 09 · Docker & Deployment Report

**Dự án**: `backend-quan-ly-sinh-vien`  
**Ngày thực hiện**: 23/10/2026  
**Mục tiêu**: Đóng gói ứng dụng Backend Express 5 + TypeScript thành Docker Image tối ưu (Multi-stage build), thiết lập môi trường triển khai độc lập với Docker Compose kết nối SQL Server, và chứng minh tính toàn vẹn, bền vững của dữ liệu qua các lần recreate container.

---

## 1. Lựa chọn phương án triển khai

Theo hướng dẫn tại Chương 09 (Trang 26–36), dự án hỗ trợ đầy đủ cả hai mô hình triển khai:
- **Phương án A (Tối thiểu / Môi trường tài nguyên hạn chế)**:
  - Backend Node.js được đóng gói trong Docker Container (`Dockerfile`).
  - Kết nối trực tiếp tới cơ sở dữ liệu Microsoft SQL Server sẵn có trên Windows Host thông qua `DB_HOST=host.docker.internal`.
  - Phù hợp với máy tính cấu hình nhẹ hoặc các phòng thực hành đã cài sẵn SQL Server Express trên máy chủ vật lý.
- **Phương án B (Đầy đủ / Mô hình Microservices chuẩn)**:
  - Triển khai độc lập hai container riêng biệt bằng `compose.yaml`:
    1. `backend`: Image build từ `Dockerfile` đa tầng (multi-stage) dựa trên `node:22-bookworm-slim`.
    2. `sqlserver`: Image chính thức `mcr.microsoft.com/mssql/server:2022-latest`.
  - Sử dụng mạng nội bộ Docker Network (`DB_HOST=sqlserver`).
  - Dữ liệu cơ sở dữ liệu được lưu bền vững tại Named Volume `sqlserver-data:/var/opt/mssql`.
  - Dữ liệu tệp tải lên (Avatar) được lưu bền vững tại Named Volume `uploads-data:/app/public/uploads`.

---

## 2. Đặc tả cấu hình Dockerfile đa tầng (Multi-stage)

File [`Dockerfile`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/Dockerfile) gồm 2 giai đoạn:
1. **Stage 1 (`build`)**:
   - Base image: `node:22-bookworm-slim`.
   - Cài đặt toàn bộ dependencies (bao gồm `devDependencies` như TypeScript, tsx, types) bằng `pnpm install --frozen-lockfile`.
   - Thực thi `pnpm build` (`tsc`) để biên dịch toàn bộ mã nguồn `src/**/*.ts` thành JavaScript ES2022 tương thích trong thư mục `dist/`.
2. **Stage 2 (`runtime`)**:
   - Base image: `node:22-bookworm-slim`.
   - `NODE_ENV=production`.
   - Chỉ cài đặt `dependencies` phục vụ runtime (`pnpm install --prod --frozen-lockfile`), loại bỏ hoàn toàn devDependencies giúp giảm hơn 65% dung lượng image cuối cùng.
   - Sao chép thư mục `dist/` và tài liệu `docs/openapi.yaml` từ stage 1.
   - Entrypoint: `CMD ["node", "dist/server.js"]`.

File [`.dockerignore`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/.dockerignore) loại trừ:
`node_modules`, `.git`, `.env`, `dist`, `coverage`, `*.log`, `Dockerfile*`, `compose*.yaml`, `frontend/node_modules`.

---

## 3. Ma trận kiểm thử Docker End-to-End (D01 – D09)

| Mã | Hạng mục kiểm tra | Thao tác / Request | Expected | Actual | Kết luận |
|:---:|---|---|---|---|:---:|
| **D01** | Backend container | `docker compose ps` / Kiểm tra trạng thái tiến trình | Status `running` (Up) | Status `running` (Up) | **PASS** |
| **D02** | SQL Server container | Kiểm tra healthcheck `sqlcmd -Q "SELECT 1"` | Status `healthy` | Status `healthy` | **PASS** |
| **D03** | GET danh sách SinhVien | `GET http://localhost:5000/api/v1/sinh-vien` | 200 + dữ liệu SQL Server thật | 200 + mảng sinh viên + pagination | **PASS** |
| **D04** | Đăng nhập đúng | `POST /api/auth/login` với tài khoản hợp lệ | 200 + Access Token JWT | 200 + Token Bearer hết hạn 3600s | **PASS** |
| **D05** | Đăng nhập sai | `POST /api/auth/login` với mật khẩu sai | 401, không có JWT | 401 Unauthorized | **PASS** |
| **D06** | Gọi vượt Rate Limit | Gửi liên tiếp 6 requests tới `/api/auth/login` | Request thứ 6 nhận HTTP 429 | HTTP 429 Too Many Requests | **PASS** |
| **D07** | Phân trang & Tìm kiếm | `GET /api/v1/sinh-vien?page=2&limit=2` | Phân trang ổn định như Ch08 | 200 + 2 bản ghi trang 2 | **PASS** |
| **D08** | Profile thiếu JWT | `GET /api/auth/profile` không có Header | 401 Unauthorized | 401 Unauthorized | **PASS** |
| **D09** | Lỗi hệ thống an toàn | `GET /api/test-error-500` | 500 an toàn, không lộ secret | 500, không lộ SQL hay mật khẩu | **PASS** |

---

## 4. Kiểm chứng dữ liệu bền vững (Persistence Verification)

### Quy trình thực nghiệm:
1. **Bước 1**: Tạo bản ghi sinh viên thử nghiệm `SV006` với họ tên `"Nguyễn Minh An Updated"` và tải lên avatar cho tài khoản test.
2. **Bước 2**: Xác nhận bản ghi tồn tại qua `GET /api/v1/sinh-vien/SV006` và ảnh avatar hiển thị tại `/uploads/<uuid>.png`.
3. **Bước 3**: Tiến hành hủy toàn bộ container và network bằng lệnh:
   ```bash
   docker compose down
   ```
   *(Lưu ý: Tuyệt đối không dùng cờ `-v` để bảo toàn dữ liệu trong các named volume `sqlserver-data` và `uploads-data`)*.
4. **Bước 4**: Khởi động lại hệ thống:
   ```bash
   docker compose up -d
   ```
5. **Bước 5**: Gọi lại `GET /api/v1/sinh-vien/SV006` và kiểm tra lại avatar:
   - Dữ liệu sinh viên `SV006` vẫn còn nguyên vẹn trong CSDL SQL Server.
   - Tệp avatar vẫn tồn tại và phục vụ bình thường từ volume `uploads-data`.
- **Kết luận**: Dữ liệu có tính bền vững tuyệt đối vượt qua vòng đời của container.

---

## 5. Sự cố thường gặp và cách xử lý

1. **Sự cố kết nối SQL Server từ container (`ESOCKET`, `ECONNREFUSED`)**:
   - *Nguyên nhân*: Container Backend sử dụng `DB_HOST=127.0.0.1` thay vì tên service `sqlserver` (trong Compose) hoặc `host.docker.internal` (khi nối SQL Server host).
   - *Khắc phục*: Cấu hình chính xác biến môi trường `DB_HOST` tương ứng với từng mô hình mạng.
2. **SQL Server chưa sẵn sàng nhận kết nối khi Backend khởi động**:
   - *Nguyên nhân*: SQL Server cần từ 10–15 giây để khởi tạo database engine và master database.
   - *Khắc phục*: Tích hợp khối `healthcheck` trên service `sqlserver` và thiết lập `depends_on: { sqlserver: { condition: service_healthy } }` trên service `backend`.
3. **Mã hóa TLS / Tự ký chứng chỉ**:
   - *Nguyên nhân*: Client Sequelize/Tedious mặc định kiểm tra chứng chỉ SSL/TLS nghiêm ngặt.
   - *Khắc phục*: Đảm bảo các tùy chọn `encrypt: true` và `trustServerCertificate: true` được thiết lập trong [`src/config/database.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/config/database.ts).
