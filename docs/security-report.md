# Security Review – Chapter 09

**Dự án**: `backend-quan-ly-sinh-vien`  
**Ngày thực hiện**: 23/10/2026  
**Người thực hiện**: Đội ngũ phát triển Backend  
**Công cụ & Phương pháp**: Rà soát mã nguồn tĩnh (Manual Source Code Review), phân tích luồng dữ liệu (Data-flow Analysis), kiểm thử API động (Dynamic Testing với Supertest & Postman).

---

## 1. Phạm vi và phương pháp review

### Phạm vi rà soát:
- **Tầng Entry & Middleware**: `src/app.ts`, `src/middlewares/logger.middleware.ts`, `src/middlewares/access-log.middleware.ts`, `src/middlewares/isAuth.ts`, `src/middlewares/isAdmin.ts`, `src/middlewares/upload.middleware.ts`, `src/middlewares/rate-limit.middleware.ts`, `src/middlewares/error.middleware.ts`.
- **Tầng Route & Validation**: `src/routes/auth.routes.ts`, `src/routes/sinhVien.routes.ts`, `src/validations/*.ts`.
- **Tầng Controller & Service**: `src/controllers/*.ts`, `src/services/*.ts`.
- **Tầng Dữ liệu & Cấu hình**: `src/models/*.ts`, `src/config/database.ts`, `.env.example`.

### Phương pháp tiếp cận:
- Kiểm tra các lỗ hổng theo chuẩn **OWASP Top 10**:
  1. SQL Injection (A03:2021-Injection).
  2. Cross-Site Scripting (XSS) & Header Security (A05:2021-Security Misconfiguration).
  3. Lộ lọt thông tin nhạy cảm, Token, Secret, Stack trace (A02:2021-Cryptographic Failures / A04:2021-Insecure Design).
  4. Thiếu phân quyền hoặc vượt quyền IDOR/BOLA (A01:2021-Broken Access Control).
  5. Tấn công brute-force và Spam Login (A07:2021-Identification and Authentication Failures).

---

## 2. Phát hiện theo từng vị trí mã nguồn

| STT | Vị trí (File & Dòng) | Rủi ro được rà soát | Mức độ | Bằng chứng mã nguồn & Đánh giá | Trạng thái |
|:---:|---|---|:---:|---|:---:|
| **01** | [`src/services/sinhVien.service.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/services/sinhVien.service.ts#L13-L20) | SQL Injection trong tìm kiếm | **Thấp** (An toàn) | Dùng `Op.like: '%${search}%'` thông qua Sequelize Query Builder. Dữ liệu được bind parameterized queries tự động, không nối chuỗi thô vào `SELECT`. | Đã bảo vệ |
| **02** | [`src/app.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/app.ts#L25-L30) | Thiếu Header bảo mật HTTP | **Trung bình** | Đã tích hợp `helmet()`. Tự động thiết lập `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `X-XSS-Protection`. | Đã khắc phục |
| **03** | [`src/routes/auth.routes.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/routes/auth.routes.ts#L19) | Tấn công Brute-force / Spam Login | **Cao** | Đã bổ sung `loginLimiter` (tối đa 5 request / 60 giây từ cùng IP). Vượt ngưỡng nhận HTTP 429 Too Many Requests. | Đã bảo vệ |
| **04** | [`src/middlewares/error.middleware.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/middlewares/error.middleware.ts#L36-L45) | Lộ Stack Trace & Chuỗi kết nối DB | **Cao** | Lỗi 500 trả thông điệp an toàn `"Lỗi hệ thống, vui lòng thử lại sau"`. Stack trace chỉ bật khi `NODE_ENV === 'development'`, hoàn toàn ẩn trong `production`. | Đã bảo vệ |
| **05** | [`src/middlewares/isAdmin.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/middlewares/isAdmin.ts#L10-L26) | Vượt quyền truy cập (Broken Access Control) | **Cao** | Endpoint `POST`, `PUT`, `DELETE /api/v1/sinh-vien` được bọc bởi cả `isAuth` và `isAdmin`. Student cố tình gửi request bị chặn 403 Forbidden. | Đã bảo vệ |
| **06** | [`src/controllers/auth.controller.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/controllers/auth.controller.ts#L80-L100) | IDOR qua cập nhật Avatar | **Cao** | Avatar cập nhật theo `req.user.id` giải mã từ JWT, không nhận `userId` từ body hay query. | Đã bảo vệ |
| **07** | [`src/middlewares/upload.middleware.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/middlewares/upload.middleware.ts#L60-L85) | Tải lên file mã độc (Unrestricted File Upload) | **Cao** | Giới hạn dung lượng 2MB (trả 413), kiểm tra định dạng MIME và xác thực Magic Bytes nhị phân đầu file (`89 50 4E 47` cho PNG, `FF D8 FF` cho JPEG). | Đã bảo vệ |

---

## 3. Điều chỉnh đã thực hiện

1. **Tách biệt và nâng cấp kiến trúc**: Tách Express app thành [`src/app.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/app.ts) và server listener [`src/server.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/server.ts), cho phép Supertest kiểm thử HTTP cô lập mà không cần mở TCP Port.
2. **Triển khai Rate Limiting**: Tạo [`src/middlewares/rate-limit.middleware.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/middlewares/rate-limit.middleware.ts) gắn vào route `POST /api/auth/login`.
3. **Kích hoạt Helmet**: Kích hoạt `helmet()` trong `src/app.ts` với cấu hình linh hoạt cho phép tải tài nguyên tĩnh `/uploads` và tài liệu Swagger UI.
4. **Đồng bộ hóa mã phản hồi lỗi**: Bổ sung trường `status: 401` và `status: 403` vào các middleware [`isAuth.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/middlewares/isAuth.ts) và [`isAdmin.ts`](file:///c:/Users/SWEET%20HOME/.gemini/antigravity/scratch/backend-quan-ly-sinh-vien/src/middlewares/isAdmin.ts) để hợp đồng lỗi luôn đồng nhất 100%.

---

## 4. Kết quả kiểm thử bảo mật trước và sau

| Bộ kiểm thử | Trước điều chỉnh | Sau điều chỉnh | Trạng thái |
|---|:---:|:---:|:---:|
| **Unit Test Login (T01 - T05)** | Chưa có | **5/5 PASS** (Mock độc lập) | **ĐẠT** |
| **API Test Supertest (A01 - A07)** | Chưa có | **7/7 PASS** (Xác thực & 500 an toàn) | **ĐẠT** |
| **Security Test (S01 - S07)** | Chưa có Rate Limit | **7/7 PASS** (Helmet + Rate Limit 429) | **ĐẠT** |
| **Hồi quy Auth & RBAC (A01 - B12)** | 24/24 PASS | **24/24 PASS** (Không hồi quy) | **ĐẠT** |

---

## 5. Các rủi ro còn lại & khuyến nghị vận hành

1. **Bộ đếm Rate Limit trong môi trường đa tiến trình (Cluster / Multi-container)**:
   - Hiện tại `express-rate-limit` lưu bộ đếm trong bộ nhớ RAM nội bộ của 1 tiến trình Node.js (MemoryStore).
   - *Khuyến nghị khi scale production*: Sử dụng Redis store (`rate-limit-redis`) để chia sẻ bộ đếm giữa nhiều container.
2. **Reverse Proxy & Client IP Spoofing**:
   - Khi đứng sau Nginx hoặc Cloudflare, cần cấu hình `app.set('trust proxy', 1)` để `req.ip` nhận diện đúng IP người dùng từ header `X-Forwarded-For`.
3. **Bảo vệ biến môi trường**:
   - Tuyệt đối không commit file `.env` lên Git. Đã có `.gitignore` và `.dockerignore` bảo vệ.
